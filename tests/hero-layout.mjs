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
  throw new Error('Local website did not start');
}
function noOverlap(a,b,padding=3){
  if(!a||!b)return false;
  return a.x+a.width<=b.x-padding || b.x+b.width<=a.x-padding ||
    a.y+a.height<=b.y-padding || b.y+b.height<=a.y-padding;
}
function inside(inner,outer){
  return inner && outer && inner.x>=outer.x-2 && inner.y>=outer.y-2 &&
    inner.x+inner.width<=outer.x+outer.width+2 &&
    inner.y+inner.height<=outer.y+outer.height+2;
}
let browser;
try{
  await ready();
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox']});
  mkdirSync('artifacts',{recursive:true});
  for(const width of [1920,1440,1280,1024,900,851,850,430,390,375,320]){
    const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1});
    const page=await context.newPage();
    await page.goto(origin,{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>document.fonts.ready);
    const boxes=await Promise.all(['.hero-copy','.hero-art','#hero-title','.hero-content','.hero-visual','.hero-ctas'].map(s=>page.locator(s).boundingBox()));
    const [copy,art,title,content,visual,actions]=boxes;
    const stacked=width<=850;
    if(!noOverlap(copy,art))throw new Error(width+': Text column and portrait overlap');
    if(!inside(title,copy))throw new Error(width+': Main title extends outside text column');
    if(!inside(actions,copy))throw new Error(width+': Call-to-action controls extend outside text column');
    if(stacked&&!(copy.y+copy.height<art.y))throw new Error(width+': Stacked hero does not keep image below text');
    if(!stacked&&!(copy.x+copy.width<art.x))throw new Error(width+': Desktop hero columns overlap horizontally');
    const documentWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
    if(documentWidth>width+2){
      const offenders=await page.evaluate(()=>Array.from(document.querySelectorAll('body *')).map(el=>({tag:el.tagName,cls:el.className?.toString?.().slice(0,55),right:Math.round(el.getBoundingClientRect().right),left:Math.round(el.getBoundingClientRect().left)})).filter(e=>e.right>innerWidth+1).slice(0,12));
      throw new Error(width+': Horizontal page overflow '+documentWidth+' from '+JSON.stringify(offenders));
    }
    const documentLang=await page.evaluate(()=>document.documentElement.lang);
    if(documentLang!=='de')throw new Error(width+': Wrong document language '+documentLang);
    const forbidden=await page.locator('#localeToggle').count();
    if(forbidden)throw new Error(width+': English toggle still visible');
    if([1440,1024,390,320].includes(width))await page.screenshot({path:'artifacts/hero-'+width+'.png'});
    console.log('Layout in Ordnung:',width+'px');
    await context.close();
  }
}finally{
  await browser?.close();
  server.kill();
}
