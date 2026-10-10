'use strict';
const GRAPH='https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages/delta';
const clip=(v,n)=>String(v||'').slice(0,n);
function verificationURL(value){
  if(!['https://www.microsoft.com/link','https://microsoft.com/devicelogin','https://www.microsoft.com/devicelogin'].includes(value))throw Error('Microsoft returned an unsupported sign-in page');
  return value;
}
function normalizeGraph(m){
  if(!m||typeof m.id!=='string'||m.id.length>2048)throw Error('Invalid Microsoft message');
  if(m['@removed'])return {id:m.id,removed:true};
  if(m.body?.contentType?.toLowerCase()!=='text')throw Error('Microsoft did not return plain text. No HTML is executed.');
  const sender=m.from?.emailAddress||{};
  return {id:m.id,from:clip(sender.name,150)+' <'+clip(sender.address,320)+'>',name:clip(sender.name||sender.address,150),subject:clip(m.subject||'(No subject)',1000),body:clip(m.body.content,50000),bodyTruncated:String(m.body.content||'').length>50000,replyTo:clip(m.replyTo?.[0]?.emailAddress?.address,500),receivedAt:clip(m.receivedDateTime,50),hasAttachments:m.hasAttachments===true,attachments:[],source:'outlook-graph',coverage:'Inbox / last seven days / text only; first reply-to address; attachment contents and authentication are not verified'};
}
function graphCursor(value){const u=new URL(value);if(u.origin!=='https://graph.microsoft.com'||!/^\/v1\.0\/me\/mailFolders(?:\/[^/]{1,2048}|\('[^/]{1,2048}'\))\/messages\/delta$/.test(u.pathname)||u.username||u.password)throw Error('Invalid Microsoft sync cursor');return u.href;}
async function boundedJSON(res,max=8000000){const chunks=[];let size=0;for await(const chunk of res.body){size+=chunk.length;if(size>max)throw Error('Microsoft response exceeds the local limit');chunks.push(chunk)}return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
function createGraph({fetcher=fetch,now=Date.now}={}){
  let pending=null,token=null,expires=0,cursor=null,epoch=0,nextPoll=0,pollBusy=false,cooldownUntil=0;
  const status=()=>({connected:!!token&&expires>now(),pending:!!pending,expiresAt:expires?new Date(expires).toISOString():null,cooldownSeconds:Math.max(0,Math.ceil((cooldownUntil-now())/1000))});
  const disconnect=()=>{epoch++;pending=null;token=null;expires=0;cursor=null;nextPoll=0;cooldownUntil=0;};
  async function identity(kind,body,tenant){const r=await fetcher(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/${kind}`,{method:'POST',redirect:'error',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body).toString(),signal:AbortSignal.timeout(15000)});return {ok:r.ok,data:await boundedJSON(r,64000)};}
  return {status,disconnect,async begin({clientId,tenant='common',consent}){
    if(consent!==true)throw Error('Read-only mailbox consent is required');
    if(!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(clientId||''))throw Error('Enter your Microsoft Application (client) ID; this is not a client secret');
    if(!/^(common|organizations|consumers|[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12})$/i.test(tenant))throw Error('Invalid Microsoft tenant');
    disconnect();const generation=epoch;
    const {ok,data}=await identity('devicecode',{client_id:clientId,scope:'https://graph.microsoft.com/Mail.Read'},tenant);
    if(generation!==epoch)throw Error('Connection cancelled');
    if(!ok||typeof data.device_code!=='string'||typeof data.user_code!=='string'||!Number.isFinite(data.expires_in))throw Error('Microsoft sign-in could not start. Check app registration and public-client policy.');
    const verificationUrl=verificationURL(data.verification_uri);
    pending={clientId,tenant,code:data.device_code,expires:now()+Math.min(1800,data.expires_in)*1000,interval:Math.max(5,Math.min(30,Number(data.interval)||5))};nextPoll=now()+pending.interval*1000;
    return {userCode:clip(data.user_code,30),verificationUrl,expiresAt:new Date(pending.expires).toISOString(),intervalSeconds:pending.interval};
  },async poll(){
    if(token&&expires>now())return status();
    if(!pending)throw Error('Start Microsoft sign-in first');
    if(pending.expires<=now()){disconnect();throw Error('Microsoft sign-in expired. Start again.');}
    if(pollBusy||now()<nextPoll)return status();
    pollBusy=true;const p=pending,generation=epoch;nextPoll=now()+p.interval*1000;
    try{const {ok,data}=await identity('token',{client_id:p.clientId,grant_type:'urn:ietf:params:oauth:grant-type:device_code',device_code:p.code},p.tenant);
      if(generation!==epoch)throw Error('Connection cancelled');
      if(!ok){if(data.error==='authorization_pending')return status();if(data.error==='slow_down'){p.interval=Math.min(60,p.interval+5);nextPoll=now()+p.interval*1000;return status();}disconnect();throw Error('Microsoft sign-in was declined or blocked by account policy. No mailbox has been connected.');}
      if(typeof data.access_token!=='string'||!Number.isFinite(data.expires_in)||!String(data.scope||'').toLowerCase().split(' ').some(s=>s==='mail.read'||s==='https://graph.microsoft.com/mail.read'))throw Error('Microsoft did not grant Mail.Read');
      token=data.access_token;expires=now()+Math.min(86400,data.expires_in)*1000;pending=null;
      const initial=new URL(GRAPH);initial.searchParams.set('$select','id,subject,from,replyTo,body,receivedDateTime,hasAttachments');initial.searchParams.set('$filter','receivedDateTime ge '+new Date(now()-7*86400000).toISOString());initial.searchParams.set('$orderby','receivedDateTime desc');initial.searchParams.set('$top','25');cursor=initial.href;return status();
    }finally{pollBusy=false;}
  },async read(){
    if(!token||expires<=now()){disconnect();throw Error('Microsoft session expired or disconnected. Sign in again.');}
    if(now()<cooldownUntil)throw Error('Microsoft is rate limiting. Sync will wait for its cooldown.');
    const generation=epoch,records=[];let pages=0,more=false,workingCursor=cursor;
    do{const r=await fetcher(graphCursor(workingCursor),{method:'GET',redirect:'error',headers:{Authorization:'Bearer '+token,Prefer:'outlook.body-content-type="text", odata.maxpagesize=25'},signal:AbortSignal.timeout(20000)});
      if(generation!==epoch)throw Error('Connection cancelled');
      if(r.status===429){cooldownUntil=now()+Math.max(10,Math.min(120,Number(r.headers.get('retry-after'))||30))*1000;throw Error('Microsoft rate limit: local assessments remain available.');}
      if(r.status===401){disconnect();throw Error('Microsoft authorization expired. Sign in again.');}
      if(r.status===410){cursor=null;disconnect();throw Error('Microsoft sync cursor expired. Reconnect to rebuild the seven-day view.');}
      if(!r.ok)throw Error('Microsoft mailbox sync failed. Existing local evidence remains available.');
      const data=await boundedJSON(r);if(generation!==epoch)throw Error('Connection cancelled');if(!Array.isArray(data.value)||data.value.length>100)throw Error('Invalid Microsoft message page');
      const page=data.value.map(normalizeGraph),next=data['@odata.nextLink'],delta=data['@odata.deltaLink'];
      if(!next&&!delta)throw Error('Microsoft omitted the sync checkpoint');
      const nextCursor=graphCursor(next||delta);records.push(...page);workingCursor=nextCursor;more=!!next;pages++;
    }while(more&&pages<4);
    cursor=workingCursor;return {records,more,coverage:'Inbox changes since connection window; last seven days initially; up to four pages per sync; session-only checkpoint'};
  }};
}
module.exports={createGraph,normalizeGraph,graphCursor,boundedJSON};
