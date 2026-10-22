import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { onRequest } from '../functions/api/bookings.js';
const ADMIN_TOKEN='s'.repeat(48);
const future=new Date(Date.now()+10*86400000).toISOString().slice(0,10);
const payload={name:'Test Booking',email:'booking@example.com',eventType:'Festival',eventDate:future,location:'Frankfurt',guestCount:240,message:'Abendveranstaltung',privacy:true,language:'de',website:''};
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
test('all visitor and administration pages use German copy',()=>{
  const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const admin=readFileSync(new URL('../admin/index.html',import.meta.url),'utf8');
  const privacy=readFileSync(new URL('../privacy.html',import.meta.url),'utf8');
  const imprint=readFileSync(new URL('../imprint.html',import.meta.url),'utf8');
  const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
  for(const [filename,html] of [['index',index],['admin',admin],['privacy',privacy],['imprint',imprint]]){
    assert.match(html,/<html lang="de">/,filename+' language');
    assert.doesNotMatch(html,/\b(?:Request a booking|Listen to music|Play video|Back to website|Booking requests|Privacy notice|Your name|Full name|LATEST TRACK|OUT NOW|Latest release)\b/i,filename+' has untranslated UI');
  }
  assert.match(index,/Auftritt anfragen/);
  assert.match(index,/Meine Musik/);
  assert.match(index,/Datenschutzerklärung/);
  assert.match(index,/Impressum/);
  assert.match(admin,/Geschützter Bereich/);
  assert.match(admin,/Aktualisieren/);
  assert.match(admin,/Bearbeitungsstand/);
  assert.doesNotMatch(index,/data-i18n|localeToggle/);
  assert.doesNotMatch(app,/translations\s*=|localStorage|language\s*=\s*'en'/);
  assert.match(app,/language:'de'/);
});

test('desktop hero keeps copy and portrait in independent columns',()=>{
  const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
  const hero=index.slice(index.indexOf('<section class="hero section-wrap"'),index.indexOf('<section class="music section-wrap"'));
  assert.match(hero,/class="hero-copy"/);
  assert.match(hero,/class="hero-visual"/);
  assert.match(hero,/class="hero-art"/);
  assert.ok(hero.indexOf('class="hero-copy"')<hero.indexOf('class="hero-visual"'));
  const portrait=hero.slice(hero.indexOf('class="hero-art"'),hero.indexOf('class="hero-visual-meta"'));
  assert.doesNotMatch(portrait,/<h[1-6]\b|<p\b|<a\b|<span\b/,'No copy over photo');
  assert.match(css,/grid-template-columns:minmax\(0,1\.02fr\) minmax\(0,\.98fr\)/);
  assert.match(css,/\.hero h1\{[^}]*white-space:nowrap/);
  assert.match(css,/@media\(max-width:850px\)/);
  assert.match(css,/\.hero\{display:flex;flex-direction:column/);
  assert.match(css,/\.hero-art\{[^}]*overflow:hidden/);
});
