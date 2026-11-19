import test from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import { checkout, fulfillSession, confirmCheckout, webhook, seasonPassRoute, paymentError } from '../server/payments.js';
const owner='82d62867-c7f5-416b-bf06-a8c884d11267', other='3bc85e5c-cbc2-431a-917a-54b1aa0b9902';
const env={STRIPE_SECRET_KEY:'sk_test_fixture',STRIPE_SEASON_PASS_PRICE_ID:'price_fixture',STRIPE_WEBHOOK_SECRET:'whsec_fixture',APP_URL:'https://tinydoors.app'};
const paid=()=>({id:'cs_test_fixture',metadata:{tinydoors:'season-pass-v1',owner_id:owner,season_year:'2090'},client_reference_id:owner,mode:'payment',status:'complete',payment_status:'paid',livemode:false,currency:'aud',amount_total:699,line_items:{data:[{price:{id:'price_fixture'},quantity:1}],has_more:false},payment_intent:{id:'pi_fixture',latest_charge:{refunded:false}}});
function fixture({user=owner,pass=null,slots=[],session=paid()}={}){
  const state={calls:[],created:[],updates:[],session,attempt:{request_key:'nonce',calendar_id:'calendar1234',lang:'en',stripe_session_id:null}};
  const client={
    auth:{async getUser(token){return {data:{user:token==='valid'?{id:user,email:'creator@example.invalid'}:null},error:null};}},
    from(table){const filters={};const query={select(){return query;},eq(k,v){filters[k]=v;return query;},update(value){state.updates.push({table,value});return query;},async maybeSingle(){return {data:table==='calendars'?(filters.owner_id===owner?{id:'calendar1234',owner_id:owner,document:{year:2090}}:null):pass,error:null};},then(resolve){resolve({data:table==='season_pass_calendars'?slots:[],error:null});}};return query;},
    async rpc(name,args){state.calls.push({name,args});return {data:name==='reserve_season_checkout'?state.attempt:{ok:true,active:!args.p_revoked,year:2090},error:null};},
  };
  const stripe={prices:{async retrieve(){return {id:'price_fixture',active:true,type:'one_time',currency:'aud',unit_amount:699};}},checkout:{sessions:{async retrieve(){return state.session;},async create(params,options){state.created.push({params,options});return {id:'cs_test_fixture',status:'open',url:'https://checkout.stripe.com/c/pay/test'};},async list(){return {data:[{id:'cs_test_fixture'}]};}}},webhooks:new Stripe('sk_test_fixture').webhooks};
  return {client,stripe,state};
}
const req=(body,token='valid',path='/api/checkout')=>new Request('https://tinydoors.app'+path,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});
test('checkout verifies login and ownership before contacting Stripe',async()=>{
 for(const [options,token,status] of [[{},'bad',401],[{user:other},'valid',404]]){
  const {client,stripe,state}=fixture(options);
  await assert.rejects(checkout(req({calendarId:'calendar1234'},token),env,client,stripe),e=>e.status===status);
  assert.equal(state.created.length,0);
 }
});
test('checkout uses server price and creator identity, durable idempotency and fixed redirects',async()=>{
 const {client,stripe,state}=fixture();
 const response=await checkout(req({calendarId:'calendar1234',owner_id:other,price:'price_forged',success_url:'https://evil.test'}),env,client,stripe);
 assert.equal(response.status,200);
 const {params,options}=state.created[0];
 assert.deepEqual(params.allowed_payment_method_types,['card']);assert.equal(params.adaptive_pricing.enabled,false);assert.equal(params.payment_method_types,undefined);
 assert.equal(params.client_reference_id,owner);assert.equal(params.metadata.owner_id,owner);
 assert.deepEqual(params.line_items,[{price:'price_fixture',quantity:1}]);
 assert.equal(new URL(params.success_url).origin,'https://tinydoors.app');
 assert.ok(params.success_url.includes('{CHECKOUT_SESSION_ID}'));
 assert.equal(options.idempotencyKey,'tinydoors-season-nonce');
 assert.equal(state.calls.filter(c=>c.name==='fulfill_season_pass').length,0);
});
test('an existing active pass activates a calendar without a second checkout',async()=>{
 const {client,stripe,state}=fixture({pass:{status:'active',expires_at:'2091-02-01'}});
 await checkout(req({calendarId:'calendar1234'}),env,client,stripe);
 assert.equal(state.created.length,0);assert.equal(state.calls[0].name,'activate_season_calendar');
});
test('wrong configured price fails closed',async()=>{
 const {client,stripe}=fixture();stripe.prices.retrieve=async()=>({active:true,type:'one_time',currency:'usd',unit_amount:699});
 await assert.rejects(checkout(req({calendarId:'calendar1234'}),env,client,stripe),e=>e.status===503);
});
test('fulfillment validates authoritative payment state, price, amount, quantity and identity',async()=>{
 for(const patch of [{amount_total:1},{currency:'usd'},{client_reference_id:other},{livemode:true},{line_items:{data:[{price:{id:'price_other'},quantity:1}]}},{line_items:{data:[{price:{id:'price_fixture'},quantity:2}]}},{payment_intent:null}]){
  const {client,stripe,state}=fixture({session:{...paid(),...patch}});
  await assert.rejects(fulfillSession('cs_test_fixture',env,client,stripe));
  assert.equal(state.calls.length,0);
 }
 const {client,stripe,state}=fixture({session:{...paid(),payment_status:'unpaid'}});
 assert.deepEqual(await fulfillSession('cs_test_fixture',env,client,stripe),{pending:true});assert.equal(state.calls.length,0);
});
test('verified fulfillment delegates atomic account grant and full refund revocation',async()=>{
 const {client,stripe,state}=fixture();await fulfillSession('cs_test_fixture',env,client,stripe,'evt_fixture');
 assert.deepEqual(state.calls[0],{name:'fulfill_season_pass',args:{p_event:'evt_fixture',p_owner:owner,p_year:2090,p_session:'cs_test_fixture',p_payment_intent:'pi_fixture',p_revoked:false}});
 state.session.payment_intent.latest_charge.refunded=true;await fulfillSession('cs_test_fixture',env,client,stripe,'evt_refund');
 assert.equal(state.calls[1].args.p_revoked,true);
});
test('browser confirmation cannot claim someone else’s checkout',async()=>{
 const {client,stripe,state}=fixture({user:other});
 await assert.rejects(confirmCheckout(req({sessionId:'cs_test_fixture'}),env,client,stripe),e=>e.status===404);
 assert.equal(state.calls.length,0);
});
test('webhook rejects unsigned and modified bodies and accepts a genuine signature',async()=>{
 const {client,stripe,state}=fixture();
 const payload=JSON.stringify({id:'evt_signed',type:'checkout.session.completed',data:{object:{id:'cs_test_fixture'}}});
 const signature=stripe.webhooks.generateTestHeaderString({payload,secret:env.STRIPE_WEBHOOK_SECRET});
 const make=(raw,header)=>new Request('https://tinydoors.app/api/stripe/webhook',{method:'POST',headers:header?{'Stripe-Signature':header}:{},body:raw});
 await assert.rejects(webhook(make(payload),env,client,stripe),e=>e.status===400);
 await assert.rejects(webhook(make(payload+' ',signature),env,client,stripe),e=>e.status===400);
 assert.equal((await webhook(make(payload,signature),env,client,stripe)).status,200);
 assert.equal(state.calls[0].args.p_event,'evt_signed');
});
test('slot limit rejection is returned without granting access',async()=>{
 const {client}=fixture();client.rpc=async()=>({data:{ok:false,error:'All 5 premium calendars are used.',code:409},error:null});
 await assert.rejects(seasonPassRoute(req({calendarId:'calendar1234'}),env,client),e=>e.status===409);
 assert.equal(paymentError(new Error('secret')).status,503);assert.ok(!(await paymentError(new Error('secret')).text()).includes('secret'));
});

test('a refunded pass cannot create a second paid checkout',async()=>{
 const {client,stripe,state}=fixture({pass:{status:'revoked',expires_at:'2091-02-01'}});
 await assert.rejects(checkout(req({calendarId:'calendar1234'}),env,client,stripe),e=>e.status===409);
 assert.equal(state.created.length,0);
});
test('invalid JSON bodies fail as a bad request',async()=>{
 const {client,stripe}=fixture();
 for(const body of [null,[],42])await assert.rejects(checkout(req(body),env,client,stripe),e=>e.status===400);
});
