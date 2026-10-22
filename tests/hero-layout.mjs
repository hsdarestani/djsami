import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const origin='http://127.0.0.1:4173';
const server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1','--directory','dist'],{stdio:'ignore'});
async function ready(){
  for(let i=0;i<40;i++){
    try{const r=await fetch(origin);if(r.ok)return}catch(_err){}
    await new Promise(resolve=>setTimeout(resolve,150));
  }
  throw new Error('Der lokale Webserver konnte nicht gestartet werden.');
}
function noOverlap(a,b,padding=3){
  return a&&b&&(a.right<=b.left-padding||b.right<=a.left-padding||a.bottom<=b.top-padding||b.bottom<=a.top-padding);
}
function contained(inner,outer,slack=3){
  return inner&&outer&&inner.left>=outer.left-slack&&inner.right<=outer.right+slack&&inner.top>=outer.top-slack&&inner.bottom<=outer.bottom+slack;
}
let browser;
try{
  await ready();
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox']});
  mkdirSync('artifacts',{recursive:true});
  for(const width of [1920,1440,1024,850,768,600,430,390,375,360,320]){
    const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1});
    const page=await context.newPage();
    await page.goto(origin,{waitUntil:'domcontentloaded'});
    await page.evaluate(async()=>{
      await Promise.all([document.fonts.load('800 42px Syne'),document.fonts.load('500 16px Manrope')]);
      await document.fonts.ready;
    });
    const inspect=await page.evaluate(()=>{
      const rect=(sel)=>{
        const element=document.querySelector(sel),r=element?.getBoundingClientRect();
        return r?{left:r.left,right:r.right,top:r.top,bottom:r.bottom}:null;
      };
      const violations=[...document.querySelectorAll('body *')].map(el=>({
        tag:el.tagName,cls:typeof el.className==='string'?el.className.slice(0,40):'',
        right:Math.round(el.getBoundingClientRect().right)
      })).filter(x=>x.right>innerWidth+2).slice(0,8);
      return {
        title:rect('#hero-title'),
        info:rect('.profile-info'),
        portrait:rect('.profile-portrait'),
        hero:rect('.hero'),
        page:rect('.page'),
        width:document.documentElement.scrollWidth,
        lang:document.documentElement.lang,
        fonts:[...document.fonts].filter(x=>x.status==='loaded').map(x=>x.family),
        visualHeading:getComputedStyle(document.querySelector('#hero-title')).fontFamily,
        bodyFont:getComputedStyle(document.body).fontFamily,
        violations
      };
    });
    if(inspect.lang!=='de')throw new Error(width+': Falsche Sprache');
    if(!inspect.fonts.includes('Syne')||!inspect.fonts.includes('Manrope'))throw new Error(width+': Schriftdateien wurden nicht geladen');
    if(!inspect.visualHeading.includes('Syne')||!inspect.bodyFont.includes('Manrope'))throw new Error(width+': Falsche Schriften verwendet');
    if(!noOverlap(inspect.portrait,inspect.info,1))throw new Error(width+': Porträt und Text überschneiden sich');
    if(!contained(inspect.title,inspect.info,2))throw new Error(width+': Künstlername läuft aus dem Textbereich');
    if(inspect.width>width+2)throw new Error(width+': Horizontales Scrollen um '+(inspect.width-width)+'px: '+JSON.stringify(inspect.violations));
    if(width===1440||width===390)await page.screenshot({path:'artifacts/startseite-'+width+'.png',fullPage:true});
    await page.locator('.action-primary').click();
    if(!await page.locator('#bookingDetails').evaluate(el=>el.open))throw new Error(width+': Anfrage klappt nicht mit einem Klick auf');
    if(!await page.locator('input[name="name"]').isVisible())throw new Error(width+': Anfrageformular bleibt versteckt');
    const afterOpen=await page.evaluate(()=>document.documentElement.scrollWidth);
    if(afterOpen>width+2)throw new Error(width+': Das geöffnete Formular verursacht horizontales Scrollen');
    if(width===390)await page.screenshot({path:'artifacts/anfrage-mobil.png',fullPage:true});
    console.log('Seite und Buchungsformular in Ordnung:',width+'px');
    await context.close();
  }
}finally{
  await browser?.close();
  server.kill();
}
