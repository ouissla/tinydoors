import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const source = await readFile(new URL('../js/cloud-db.js', import.meta.url), 'utf8');
async function adapter({queryError=null,sessionError=null}={}) {
  const state={writes:[],deleted:[],localCalls:0};
  const user={id:'creator-id'};
  const row={id:'calendar1234',document:{to:'Sam',plan:'season',days:[]},calendar_entitlements:null};
  const A={
    DB:{newId:()=> 'random',getCalendar(){state.localCalls++;},saveCalendar(){state.localCalls++;}},
    Auth:{ready:Promise.resolve(),mode:'cloud',user,config:{photoBucket:'calendar-photos'},async session(){if(sessionError)throw sessionError;return {user};},
      client:{from(){const q={select(){return q;},eq(){return q;},async maybeSingle(){return {data:row,error:queryError};},async upsert(value){state.writes.push(value);return {data:value,error:queryError};}};return q;},
        storage:{from(){return {async remove(paths){state.deleted.push(...paths);return {data:[],error:null};}};}}}},
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
