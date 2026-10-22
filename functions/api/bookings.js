// Cloudflare Pages Function: POST public booking enquiry, GET/PATCH admin.
// Bind a D1 database as DB. Set ADMIN_TOKEN as an encrypted environment variable.
const allowedTypes = new Set(['Club','Festival','Private','Corporate','Other']);
const allowedStates = new Set(['new','contacted','confirmed','declined']);
const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
function json(value,status=200){return new Response(JSON.stringify(value),{status,headers})}
function isString(value,min,max){return typeof value==='string' && value.trim().length>=min && value.trim().length<=max}
function clean(value){return typeof value==='string'?value.trim():''}
function validDate(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const date=new Date(value+'T12:00:00Z');
  if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)return false;
  const now=new Date();
  const today=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));
  const limit=new Date(today);limit.setUTCFullYear(limit.getUTCFullYear()+2);
  return date>=today && date<=limit;
}
async function hashIp(value,secret){
  const data=new TextEncoder().encode(value+'|'+secret);
  const digest=await crypto.subtle.digest('SHA-256',data);
  return Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
}
async function authorized(request,env){
  const actual=String(env.ADMIN_TOKEN||'');
  const supplied=(request.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
  if(actual.length<24||supplied.length<24)return false;
  const [a,b]=await Promise.all([hashIp(actual,'admin'),hashIp(supplied,'admin')]);
  return a===b;
}
async function sendNotification(env,body){
  if(!env.RESEND_API_KEY||!env.BOOKING_NOTIFICATION_EMAIL||!env.BOOKING_FROM_EMAIL)return;
  const message=[
    'New DJ SAMI booking enquiry', '',
    'Name: '+body.name,'Email: '+body.email,'Type: '+body.eventType,
    'Date: '+body.eventDate,'Location: '+body.location,
    'Guests: '+(body.guestCount||'Not provided'),
    'Message: '+(body.message||'Not provided'),'',
    'Review requests at /admin/ on your site.'
  ].join('\n');
  // Notification failures never discard a booking that is already stored.
  try {
    await fetch('https://api.resend.com/emails',{
      method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+env.RESEND_API_KEY},
      body:JSON.stringify({from:env.BOOKING_FROM_EMAIL,to:[env.BOOKING_NOTIFICATION_EMAIL],subject:'DJ SAMI booking — '+body.eventDate+' / '+body.location,text:message})
    });
  }catch(_err){/* Database record remains the source of truth. */}
}
export async function onRequest({request,env,waitUntil}){
  if(!env.DB)return json({ok:false,error:'BOOKING_NOT_CONFIGURED'},503);
  if(request.method==='POST'){
    if(!(request.headers.get('Content-Type')||'').toLowerCase().includes('application/json'))return json({ok:false,error:'CONTENT_TYPE'},415);
    const size=Number(request.headers.get('Content-Length')||0);
    if(size>12000)return json({ok:false,error:'PAYLOAD_TOO_LARGE'},413);
    let data;
    try{const raw=await request.text();if(raw.length>12000)return json({ok:false,error:'PAYLOAD_TOO_LARGE'},413);data=JSON.parse(raw)}catch(_err){return json({ok:false,error:'INVALID_JSON'},400)}
    if(!data||typeof data!=='object'||Array.isArray(data))return json({ok:false,error:'INVALID_DATA'},400);
    // Invisible field catches simple automated submissions.
    if(data.website)return json({ok:true},200);
    const item={
      name:clean(data.name),email:clean(data.email).toLowerCase(),
      eventType:clean(data.eventType),eventDate:clean(data.eventDate),
      location:clean(data.location),message:clean(data.message),
      language:data.language==='de'?'de':'en',
      guestCount:data.guestCount===null||data.guestCount===''||data.guestCount===undefined?null:Number(data.guestCount)
    };
    if(!data.privacy||!isString(item.name,2,120)||!isString(item.email,5,254)
      ||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)
      ||!allowedTypes.has(item.eventType)||!validDate(item.eventDate)
      ||!isString(item.location,2,160)||item.message.length>2000
      ||(item.guestCount!==null&&(!Number.isInteger(item.guestCount)||item.guestCount<1||item.guestCount>1000000)))
      return json({ok:false,error:'VALIDATION'},400);
    const now=new Date();
    const sinceHour=new Date(now.getTime()-3600000).toISOString();
    const sinceDay=new Date(now.getTime()-86400000).toISOString();
    const clientHash=await hashIp(request.headers.get('CF-Connecting-IP')||'unknown',String(env.RATE_LIMIT_SALT||env.ADMIN_TOKEN||'dj-sami'));
    try{
      const [ipCount,emailCount]=await Promise.all([
        env.DB.prepare('SELECT COUNT(*) AS n FROM booking_requests WHERE client_hash=? AND created_at>=?').bind(clientHash,sinceHour).first(),
        env.DB.prepare('SELECT COUNT(*) AS n FROM booking_requests WHERE email=? AND created_at>=?').bind(item.email,sinceDay).first()
      ]);
      if(Number(ipCount?.n||0)>=5||Number(emailCount?.n||0)>=10)return json({ok:false,error:'RATE_LIMIT'},429);
      const cutoff=new Date(now.getTime()-120*86400000).toISOString();
      await env.DB.prepare('DELETE FROM booking_requests WHERE created_at<?').bind(cutoff).run();
      await env.DB.prepare(
        'INSERT INTO booking_requests (name,email,event_type,event_date,location,guest_count,message,language,status,client_hash,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
      ).bind(item.name,item.email,item.eventType,item.eventDate,item.location,item.guestCount,item.message,item.language,'new',clientHash,now.toISOString()).run();
      if(waitUntil)waitUntil(sendNotification(env,item));else await sendNotification(env,item);
      return json({ok:true},201);
    }catch(error){
      console.error('D1 booking storage failed',error?.message||'unknown');
      return json({ok:false,error:'BOOKING_STORAGE_UNAVAILABLE'},503);
    }
  }
  if(request.method==='GET'){
    if(!await authorized(request,env))return json({ok:false,error:'UNAUTHORIZED'},401);
    try{
      const entries=await env.DB.prepare('SELECT id,name,email,event_type,event_date,location,guest_count,message,language,status,created_at FROM booking_requests ORDER BY created_at DESC LIMIT 150').all();
      return json({ok:true,bookings:entries.results||[]});
    }catch(_err){return json({ok:false,error:'DATABASE'},503)}
  }
  if(request.method==='PATCH'){
    if(!await authorized(request,env))return json({ok:false,error:'UNAUTHORIZED'},401);
    let item;try{item=await request.json()}catch(_err){return json({ok:false,error:'INVALID_JSON'},400)}
    const id=Number(item?.id),state=item?.status;
    if(!Number.isSafeInteger(id)||id<1||!allowedStates.has(state))return json({ok:false,error:'VALIDATION'},400);
    try{
      const result=await env.DB.prepare('UPDATE booking_requests SET status=? WHERE id=?').bind(state,id).run();
      if(!result.meta?.changes)return json({ok:false,error:'NOT_FOUND'},404);
      return json({ok:true});
    }catch(_err){return json({ok:false,error:'DATABASE'},503)}
  }
  return new Response('Method Not Allowed',{status:405,headers:{'Allow':'POST, GET, PATCH'}});
}