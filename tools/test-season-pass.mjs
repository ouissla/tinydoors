// Optional integration check against the configured Supabase project. Uses temporary,
// confirmed test accounts (no emails or Stripe charges) and removes them in finally.
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
const env=process.env;
const options={auth:{persistSession:false,autoRefreshToken:false}};
const admin=createClient(env.SUPABASE_URL,env.SUPABASE_SECRET_KEY,options);
const browser=createClient(env.SUPABASE_URL,env.SUPABASE_PUBLISHABLE_KEY,options);
const fixture=crypto.randomUUID().replaceAll('-','');
const users=[],events=['evt_','refund_','late_'].map(p=>p+fixture);
const ok=({data,error})=>{if(error) throw new Error(error.message);return data;};
const password=crypto.randomUUID()+'!Aa42';
try{
 for(const name of ['owner','other']) users.push(ok(await admin.auth.admin.createUser({email:`qa-${name}-${fixture}@example.invalid`,password,email_confirm:true})).user.id);
 const [owner,other]=users;
 ok(await browser.auth.signInWithPassword({email:`qa-owner-${fixture}@example.invalid`,password}));
 const doc={year:2090,theme:'cyber',days:Array.from({length:24},()=>({}))};
 ok(await admin.from('calendars').insert(Array.from({length:8},(_,i)=>({id:fixture+i,owner_id:owner,document:doc}))));
 const activate=async(id,who=owner)=>ok(await admin.rpc('activate_season_calendar',{p_owner:who,p_calendar:id}));
 const grant=async(event,revoked=false)=>ok(await admin.rpc('fulfill_season_pass',{p_event:event,p_owner:owner,p_year:2090,p_session:'cs_qa_'+fixture,p_payment_intent:'pi_qa_'+fixture,p_revoked:revoked}));
 assert.equal((await activate(fixture+'0')).code,402);
 await grant(events[0]);await grant(events[0]);
 assert.equal(ok(await admin.from('stripe_webhook_events').select('id').eq('id',events[0])).length,1);
 assert.equal((await activate(fixture+'0',other)).code,404);
 const races=await Promise.all(Array.from({length:7},(_,i)=>activate(fixture+i)));
 assert.equal(races.filter(r=>r.ok).length,5);
 assert.equal(races.filter(r=>r.code===409).length,2);
 const allocated=ok(await admin.from('season_pass_calendars').select('calendar_id').eq('owner_id',owner));
 assert.equal(allocated.length,5);
 assert.equal((await activate(allocated[0].calendar_id)).ok,true);
 assert.ok((await browser.rpc('activate_season_calendar',{p_owner:owner,p_calendar:fixture+'7'})).error);
 assert.ok((await browser.from('season_passes').update({status:'active'}).eq('owner_id',owner)).error);
 assert.equal(ok(await browser.from('season_passes').select('owner_id')).length,1);
 assert.equal(ok(await browser.from('season_passes').select('owner_id').eq('owner_id',other)).length,0);
 assert.ok((await browser.from('calendars').update({document:{...doc,year:2091}}).eq('id',allocated[0].calendar_id)).error);
 ok(await browser.from('calendars').delete().eq('id',allocated[0].calendar_id));
 assert.equal((await activate(fixture+'7')).code,409);
 await grant(events[1],true);await grant(events[2]);
 assert.equal(ok(await admin.from('season_passes').select('status').eq('owner_id',owner).single()).status,'revoked');
 assert.equal(ok(await admin.from('calendar_entitlements').select('status').eq('pass_owner_id',owner)).filter(r=>r.status==='active').length,0);
 assert.equal((await activate(fixture+'7')).code,402);
 // Checkout reservation is stable across tabs and renews only the expired session.
 const reserve=(expired=null)=>admin.rpc('reserve_season_checkout',{p_owner:owner,p_year:2090,p_calendar:fixture+'7',p_lang:'en',p_expired_session:expired}).then(ok);
 const attempts=await Promise.all([reserve(),reserve()]);assert.equal(attempts[0].request_key,attempts[1].request_key);
 ok(await admin.from('season_checkouts').update({stripe_session_id:'cs_expired'}).eq('owner_id',owner));
 const renewed=await Promise.all([reserve('cs_expired'),reserve('cs_expired')]);assert.equal(renewed[0].request_key,renewed[1].request_key);assert.notEqual(renewed[0].request_key,attempts[0].request_key);
 console.log('PASS: live Supabase ownership, RLS, concurrent five-slot limit, retries, deletion, season protection, refunds and checkout reservation.');
}finally{
 const errors=[];
 for(const id of users){const {error}=await admin.auth.admin.deleteUser(id);if(error)errors.push(error.message);}
 const {error}=await admin.from('stripe_webhook_events').delete().in('id',events);if(error)errors.push(error.message);
 if(errors.length)throw new Error('Fixture cleanup failed: '+errors.join('; '));
 console.log('Removed temporary test accounts and payment fixtures.');
}
