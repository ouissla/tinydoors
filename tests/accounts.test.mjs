import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../server/worker.js';
import { publicConfiguration } from '../server/config.js';
import { createShare, readShare, tokenHash } from '../server/sharing.js';
const env = {
  APP_MODE:'cloud', APP_URL:'https://little-doors.test', SUPABASE_URL:'https://project.supabase.co',
  SUPABASE_PUBLISHABLE_KEY:'sb_publishable_example-test-key', SUPABASE_SECRET_KEY:'sb_secret_server-only', SUPABASE_STORAGE_BUCKET:'calendar-photos',
};
const owner = '82d62867-c7f5-416b-bf06-a8c884d11267';
const calendar = { id:'calendar1234',owner_id:owner,document:{year:2090,days:[{photoId:owner+'/photo.jpg'}]},calendar_entitlements:null };
function fakeClient({ cal=structuredClone(calendar), user=owner, share=null } = {}) {
  const state={saved:null,signed:[],cal,share};
  const client = {
    auth:{async getUser(token){return token==='valid' ? {data:{user:{id:user}},error:null} : {data:{user:null},error:{message:'invalid'}};}},
    from(table){
      const filters={};
      const query={
        select(){return query;},eq(key,value){filters[key]=value;return query;},
        async maybeSingle(){
          const row=table==='calendars'?state.cal:state.share;
          return {data:row&&Object.entries(filters).every(([k,v])=>row[k]===v)?row:null,error:null};
        },
        async insert(row){state.saved=row;state.share=row;return {error:null};},
      }; return query;
    },
    storage:{from(bucket){assert.equal(bucket,'calendar-photos');return {async createSignedUrls(paths,seconds){state.signed.push(...paths);assert.equal(seconds,3600);return {data:paths.map(path=>({path,signedUrl:'https://photos.test/signed/'+encodeURIComponent(path)})),error:null};}};}},
  };
  return {client,state};
}
const request = (bearer='valid') => new Request('https://little-doors.test/api/calendars/calendar1234/share',{method:'POST',headers:bearer?{Authorization:'Bearer '+bearer}:{}});

test('public config exposes only the public key and cloud mode is opt-in', async()=>{
  assert.deepEqual(publicConfiguration({}),{mode:'prototype'});
  const response=await worker.fetch(new Request('https://little-doors.test/api/config'),env);
  const body=await response.json();
  assert.equal(body.mode,'cloud');
  assert.equal(body.supabasePublishableKey,env.SUPABASE_PUBLISHABLE_KEY);
  assert.ok(!JSON.stringify(body).includes(env.SUPABASE_SECRET_KEY));
});
test('missing cloud settings and secret keys in the public-key field fail closed',async()=>{
  assert.throws(()=>publicConfiguration({...env,SUPABASE_PUBLISHABLE_KEY:env.SUPABASE_SECRET_KEY}));
  const response=await worker.fetch(new Request('https://little-doors.test/api/config'),{APP_MODE:'cloud'});
  assert.equal(response.status,503);
  assert.ok(!JSON.stringify(await response.json()).includes('SUPABASE_SECRET_KEY'));
});
test('a share requires a valid login and calendar ownership',async()=>{
  const {client,state}=fakeClient();
  assert.equal((await createShare(request(null),'calendar1234',env,client)).status,401);
  assert.equal((await createShare(request('invalid'),'calendar1234',env,client)).status,401);
  const other=fakeClient({user:'another-owner'});
  assert.equal((await createShare(request(),'calendar1234',env,other.client)).status,404);
  assert.equal(state.saved,null);
  assert.equal(other.state.saved,null);
});
test('sharing stores a hash, grants read-only access without a login, and signs only owner photos',async()=>{
  const {client,state}=fakeClient();
  const response=await createShare(request(),'calendar1234',env,client);
  assert.equal(response.status,200);
  const {token}=await response.json();
  assert.match(token,/^[a-f0-9]{64}$/);
  assert.notEqual(state.saved.token_hash,token);
  assert.equal(state.saved.token_hash,await tokenHash(token));
  const recipient=await readShare(token,env,client);
  const body=await recipient.json();
  assert.equal(recipient.status,200);
  assert.equal(body.calendar.id,'calendar1234');
  assert.equal(body.calendar.plan,'free');
  assert.equal(body.calendar.owner_id,undefined);
  assert.deepEqual(state.signed,[owner+'/photo.jpg']);
});
test('expired/revoked links and foreign photo references cannot expose photos',async()=>{
  const token='1'.repeat(64), hash=await tokenHash(token);
  for (const fields of [{expires_at:'2020-01-01T00:00:00Z'},{expires_at:'2091-01-01T00:00:00Z',revoked_at:'2026-11-18T00:00:00Z'}]) {
    const {client,state}=fakeClient({share:{calendar_id:'calendar1234',token_hash:hash,...fields}});
    assert.ok([404,410].includes((await readShare(token,env,client)).status));
    assert.deepEqual(state.signed,[]);
  }
  const foreign=structuredClone(calendar);foreign.document.days[0].photoId='different-owner/secret.jpg';
  const {client,state}=fakeClient({cal:foreign,share:{calendar_id:'calendar1234',token_hash:hash,expires_at:'2091-01-01T00:00:00Z'}});
  assert.equal((await readShare(token,env,client)).status,422);
  assert.deepEqual(state.signed,[]);
});
test('cloud mode never reports demo payments as ready',async()=>{
  const response=await worker.fetch(new Request('https://little-doors.test/api/health'),env);
  const health=await response.json();
  assert.equal(health.authentication,'email-magic-link');assert.equal(health.payments,'unavailable');assert.equal(health.paidLaunchReady,false);
});
