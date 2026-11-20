import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const source = await readFile(new URL('../js/cloud-db.js', import.meta.url), 'utf8');
async function adapter({queryError=null,sessionError=null}={}) {
  const state={writes:[],deleted:[],uploads:[],localCalls:0};
  const user={id:'creator-id'};
  const row={id:'calendar1234',document:{to:'Sam',plan:'season',days:[]},calendar_entitlements:null};
  const A={
    DB:{newId:()=> 'random',getCalendar(){state.localCalls++;},saveCalendar(){state.localCalls++;}},
    Auth:{ready:Promise.resolve(),mode:'cloud',user,config:{photoBucket:'calendar-photos'},async session(){if(sessionError)throw sessionError;return {user};},
      client:{from(){const q={select(){return q;},eq(){return q;},async maybeSingle(){return {data:row,error:queryError};},async upsert(value){state.writes.push(value);return {data:value,error:queryError};}};return q;},
        storage:{from(){return {async upload(path,blob,options){state.uploads.push({path,blob,options});return {data:{path},error:null};},async remove(paths){state.deleted.push(...paths);return {data:[],error:null};}};}}}},
  };
  const context=vm.createContext({window:{Advent:A},document:{body:{classList:{contains:()=>true}}},location:{search:''},URLSearchParams,structuredClone,fetch(){throw Error('unexpected fetch');},Date,Map,URL});
  vm.runInContext(source,context);
  await A.DBReady;
  return {db:A.DB,state};
}
test('cloud save strips editable entitlements and binds the authenticated owner',async()=>{
 const {db,state}=await adapter();
 await db.saveCalendar({id:'calendar1234',plan:'season',days:[]});
 assert.equal(state.writes[0].owner_id,'creator-id');
 assert.equal(state.writes[0].document.plan,undefined);
 assert.equal(state.localCalls,0);
});
test('cloud read derives the plan from server entitlement, not calendar JSON',async()=>{
 const {db}=await adapter();
 const cal=await db.getCalendar('calendar1234');
 assert.equal(cal.plan,'free');
});
test('expired sessions and failed cloud writes never fall back to local storage',async()=>{
 for(const options of [{queryError:new Error('network')},{sessionError:new Error('expired')}]){
  const {db,state}=await adapter(options);
  await assert.rejects(()=>db.saveCalendar({id:'calendar1234',days:[]}));
  assert.equal(state.localCalls,0);
 }
});
test('photo deletion refuses a different creator’s path',async()=>{
 const {db,state}=await adapter();
 await assert.rejects(()=>db.deletePhoto('another-owner/photo.jpg'));
 assert.equal(state.deleted.length,0);
 await db.deletePhoto('creator-id/photo.jpg');
 assert.equal(state.deleted[0],'creator-id/photo.jpg');
});

test('private video uploads preserve supported MIME types and owner paths',async()=>{
 const {db,state}=await adapter();
 const path=await db.putVideo(new Blob(['clip'],{type:'video/webm;codecs=vp8,opus'}));
 assert.equal(path,'creator-id/random.webm');
 assert.equal(state.uploads[0].options.contentType,'video/webm');
 assert.equal(state.uploads[0].options.upsert,false);
 const mp4=await db.putVideo(new Blob(['clip'],{type:'video/mp4'}));
 assert.equal(mp4,'creator-id/random.mp4');
 await assert.rejects(()=>db.putVideo(new Blob(['data'],{type:'text/html'})));
 await assert.rejects(()=>db.putVideo(new Blob([new Uint8Array(10*1024*1024+1)],{type:'video/webm'})));
 assert.equal(state.uploads.length,2);
});

async function guestAdapter() {
  const state={writes:[],uploads:[],localSaves:[],localDeleted:[],localCalendarsDeleted:[]};
  const photo=new Blob(['jpeg'],{type:'image/jpeg'}), clip=new Blob(['clip'],{type:'video/webm'});
  const local={newId:()=> 'random',
    async saveCalendar(cal){state.localSaves.push(cal);return cal;},
    async getCalendar(id){return id==='guest1234'?{id,to:'Sam',plan:'season',days:[{photoId:'p1'},{videoId:'v1'},{text:'hi'}],savedDays:{3:[{photoId:'p1'}]}}:null;},
    async putPhoto(){return 'local-photo';},async getPhotoURL(){return 'blob:local';},
    async getPhotoBlob(id){return id==='p1'?photo:clip;},
    async deletePhoto(id){state.localDeleted.push(id);},async deleteCalendar(id){state.localCalendarsDeleted.push(id);},
  };
  const Auth={ready:Promise.resolve(),mode:'cloud',user:null,config:{photoBucket:'calendar-photos'},async session(){return {user:{id:'creator-id'}};},
    client:{from(){const q={async upsert(value){state.writes.push(value);return {data:value,error:null};}};return q;},
      storage:{from(){return {async upload(path,blob,options){state.uploads.push({path,options});return {data:{path},error:null};}};}}}};
  const A={DB:local,Auth};
  const context=vm.createContext({window:{Advent:A},document:{body:{classList:{contains:()=>true}}},location:{search:''},URLSearchParams,structuredClone,fetch(){throw Error('unexpected fetch');},Date,Map,URL,Blob});
  vm.runInContext(source,context);
  await A.DBReady;
  return {db:A.DB,Auth,state};
}
test('signed-out creators save to this browser until they sign in',async()=>{
 const {db,state}=await guestAdapter();
 assert.equal(db.isGuest,true);
 await db.saveCalendar({id:'guest1234',days:[]});
 assert.equal(state.localSaves.length,1);assert.equal(state.writes.length,0);
 assert.equal(await db.putPhoto(new Blob(['x'])),'local-photo');assert.equal(state.uploads.length,0);
});
test('signing in moves a guest calendar, its photos and videos into the account once',async()=>{
 const {db,Auth,state}=await guestAdapter();
 Auth.user={id:'creator-id'};
 const cal=await db.adoptGuestCalendar('guest1234');
 assert.equal(db.isGuest,false);
 assert.equal(state.uploads.length,2);
 assert.deepEqual(state.uploads.map(u=>u.options.contentType),['image/jpeg','video/webm']);
 assert.equal(cal.days[0].photoId,'creator-id/random.jpg');assert.equal(cal.days[1].videoId,'creator-id/random.webm');
 assert.equal(cal.savedDays[3][0].photoId,'creator-id/random.jpg');
 assert.equal(state.writes[0].owner_id,'creator-id');assert.equal(state.writes[0].document.plan,undefined);
 assert.deepEqual(state.localDeleted.sort(),['p1','v1']);assert.deepEqual(state.localCalendarsDeleted,['guest1234']);
 assert.equal(await db.adoptGuestCalendar('missing'),null);
});
