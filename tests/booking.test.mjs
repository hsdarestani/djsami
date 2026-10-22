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



test('compact German link hub shows four accessible channels',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
  const admin=readFileSync(new URL('../admin/index.html',import.meta.url),'utf8');
  const privacy=readFileSync(new URL('../privacy.html',import.meta.url),'utf8');
  const imprint=readFileSync(new URL('../imprint.html',import.meta.url),'utf8');
  for(const page of [html,admin,privacy,imprint]){
    assert.match(page,/<html lang="de">/);
    assert.doesNotMatch(page,/[↗↖↘↙←→↑↓↻➜➔➝⇢]/,'Arrow glyphs should not be used');
  }
  for(const link of ['Spotify','YouTube','Instagram','SoundCloud'])assert.match(html,new RegExp('>'+link+'<'));
  assert.equal([...html.matchAll(/class="link-card"/g)].length,4);
  assert.match(html,/class="profile-grid"/);
  assert.match(html,/class="profile-portrait"/);
  assert.match(html,/class="profile-info"/);
  assert.match(html,/class="quick-actions"/);
  assert.match(html,/<details class="booking-details" id="bookingDetails">/);
  assert.match(html,/<form id="bookingForm"/);
  assert.match(html,/name="guestCount"/);
  assert.match(html,/name="message"/);
  assert.match(css,/@font-face\{/);
  assert.match(css,/font-family:"Syne"/);
  assert.match(css,/font-family:"Manrope"/);
  assert.match(css,/\/fonts\/syne-latin-variable\.woff2/);
  assert.match(css,/\/fonts\/manrope-latin-variable\.woff2/);
});

test('German-only visitor and administration wording',()=>{
  const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
  const admin=readFileSync(new URL('../admin/index.html',import.meta.url),'utf8');
  assert.match(index,/Auftritt anfragen/);
  assert.match(index,/Meine Musik/);
  assert.match(index,/Datenschutzerklärung/);
  assert.match(index,/Impressum/);
  assert.match(admin,/Geschützter Bereich/);
  assert.match(admin,/Aktualisieren/);
  assert.doesNotMatch(index,/data-i18n|localeToggle/);
  assert.doesNotMatch(app,/translations\s*=|localStorage|language\s*=\s*'en'/);
  assert.match(app,/language:'de'/);
  assert.match(app,/bookingDetails\.open=true/);
  assert.doesNotMatch(index,/\b(?:Request a booking|Listen to music|Booking requests|Latest release|OUT NOW|Full name|Latest track)\b/i);
});

test('portrait and hero text remain separate in the compact card',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const hero=html.slice(html.indexOf('<section class="hero"'),html.indexOf('<section class="links-section"'));
  const photoStart=hero.indexOf('class="profile-portrait"');
  const infoStart=hero.indexOf('class="profile-info"');
  assert.ok(photoStart>0 && infoStart>photoStart);
  assert.doesNotMatch(hero.slice(photoStart,infoStart),/<h1\b|<p\b|<a\b/);
  assert.match(hero,/<h1 id="hero-title"/);
});


test('German calendar displays TT.MM.JJJJ while keeping ISO booking dates',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
  const build=readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
  assert.match(html,/lang="de-DE" name="eventDate"/);
  assert.match(html,/vendor\/flatpickr\.min\.js/);
  assert.match(html,/vendor\/flatpickr\.de\.js/);
  assert.match(html,/vendor\/flatpickr\.min\.css/);
  assert.match(app,/locale:'de'/);
  assert.match(app,/altFormat:'d\.m\.Y'/);
  assert.match(app,/dateFormat:'Y-m-d'/);
  assert.match(app,/disableMobile:true/);
  assert.match(app,/TT\.MM\.JJJJ/);
  assert.match(app,/validBookingDate\(\)/);
  assert.match(build,/vendor\/flatpickr\.de\.js/);
});
