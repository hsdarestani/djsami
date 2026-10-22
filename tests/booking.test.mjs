import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { onRequest } from '../functions/api/bookings.js';
const ADMIN_TOKEN='s'.repeat(48);
const future=new Date(Date.now()+10*86400000).toISOString().slice(0,10);
const payload={name:'Test Booking',email:'booking@example.com',eventType:'Festival',eventDate:future,location:'Frankfurt',guestCount:240,message:'An evening show',privacy:true,language:'en',website:''};
function stubDb(){
  const calls=[];
  return {
    calls,
    prepare(sql){
      return {all: async()=>({results:[{id:1,name:'Test Booking',status:'new'}]}),bind(...args){
        return {
          async first(){calls.push({kind:'first',sql,args});return {n:0}},
          async all(){calls.push({kind:'all',sql,args});return {results:[{id:1,name:'Test Booking',status:'new'}]}},
          async run(){calls.push({kind:'run',sql,args});return {meta:{changes:1}}}
        };
      }};
    }
  };
}
function request(method,data,token){
  return new Request('https://example.pages.dev/api/bookings',{
    method,headers:{...(data?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},
    ...(data?{body:JSON.stringify(data)}:{})
  });
}
function context(req,db,token=ADMIN_TOKEN){
  return {request:req,env:{DB:db,ADMIN_TOKEN:token},waitUntil(){}};
}
test('HTML contains main visitor paths',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  for(const value of ['id="bookingForm"','id="music"','id="about"','href="https://www.instagram.com/djsami21/"'])assert.ok(html.includes(value),value);
});
test('unconfigured DB returns 503, never pretends to save',async()=>{
  const res=await onRequest({request:request('POST',payload),env:{}});
  assert.equal(res.status,503);
});
test('valid request inserts into D1',async()=>{
  const db=stubDb();
  const res=await onRequest(context(request('POST',payload),db));
  assert.equal(res.status,201);
  assert.equal((await res.json()).ok,true);
  assert.ok(db.calls.some(c=>c.kind==='run'&&c.sql.includes('INSERT INTO booking_requests')));
});
test('invalid event date is rejected',async()=>{
  const db=stubDb();
  const res=await onRequest(context(request('POST',{...payload,eventDate:'2020-01-01'}),db));
  assert.equal(res.status,400);
  assert.equal(db.calls.length,0);
});
test('privacy acknowledgement is required',async()=>{
  const res=await onRequest(context(request('POST',{...payload,privacy:false}),stubDb()));
  assert.equal(res.status,400);
});
test('admin GET requires token',async()=>{
  const res=await onRequest(context(request('GET'),stubDb()));
  assert.equal(res.status,401);
});
test('admin GET succeeds with token',async()=>{
  const res=await onRequest(context(request('GET',null,ADMIN_TOKEN),stubDb()));
  assert.equal(res.status,200);
  const data=await res.json();
  assert.equal(data.bookings[0].name,'Test Booking');
});
test('admin PATCH status update',async()=>{
  const res=await onRequest(context(request('PATCH',{id:1,status:'contacted'},ADMIN_TOKEN),stubDb()));
  assert.equal(res.status,200);
});
test('unsupported HTTP methods reject',async()=>{
  const res=await onRequest(context(request('DELETE'),stubDb()));
  assert.equal(res.status,405);
});


test('simple visitor flow and no arrow glyphs in site controls',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
  const admin=readFileSync(new URL('../admin/index.html',import.meta.url),'utf8');
  const privacy=readFileSync(new URL('../privacy.html',import.meta.url),'utf8');
  const imprint=readFileSync(new URL('../imprint.html',import.meta.url),'utf8');
  for (const page of [html,admin,privacy,imprint]){
    assert.doesNotMatch(page,/[↗↖↘↙←→↑↓↻➜➔➝⇢]/u,'No arrows anywhere in visible interface');
  }
  assert.match(html,/class="mobile-booking"/);
  assert.match(html,/class="more-details"/);
  assert.match(html,/<details class="more-details"/);
  assert.match(html,/name="guestCount"/);
  assert.match(html,/name="message"/);
  assert.match(css,/env\(safe-area-inset-bottom\)/);
  assert.match(css,/Avenir Next/);
});
test('translations include every rendered label in both languages',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const script=readFileSync(new URL('../app.js',import.meta.url),'utf8').split('var toggle=')[0];
  const keys=[...html.matchAll(/data-i18n="([^"]+)"/g)].map(m=>m[1]);
  for(const key of new Set(keys)){
    const matches=script.match(new RegExp('(?:^|[,\\s])'+key+'\\s*:', 'g'))||[];
    assert.equal(matches.length,2,'Expected EN and DE translation for '+key);
  }
});
