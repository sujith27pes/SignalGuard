'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const Engine=require('./dist/engine.js'),{validateEmail,validateAI,CONTRACT_VERSION}=require('./lib/contracts.cjs'),{createNemotron,DEFAULT_MODEL}=require('./lib/nemotron.cjs'),{createAssessmentService}=require('./lib/assessment-service.cjs');
const root=path.join(__dirname,'dist');
const {createOutlook}=require('./lib/outlook.cjs');
function createServer(options={}){
 const token=crypto.randomBytes(32).toString('hex'),port=options.port||8787,origin=`http://127.0.0.1:${port}`,outlook=options.outlook||createOutlook();
 const provider=options.provider||createNemotron({key:options.key??process.env.NVIDIA_API_KEY,model:options.model??process.env.NVIDIA_MODEL??DEFAULT_MODEL,fetcher:options.fetcher||fetch}),service=createAssessmentService(provider,options.serviceOptions);
 const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))};
 const server=http.createServer(async(req,res)=>{try{
  if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(req.headers.host)){send(res,403,{error:'Invalid host'});return}
  const requestOrigin=req.headers.origin;
  if(requestOrigin&&![origin,`http://localhost:${port}`].includes(requestOrigin)){send(res,403,{error:'Cross-origin requests are not allowed'});return}
  if(req.headers['sec-fetch-site']==='cross-site'){send(res,403,{error:'Cross-site requests are not allowed'});return}
  const pathname=new URL(req.url,origin).pathname;
  if(pathname==='/api/config'&&req.method==='GET'){send(res,200,{aiConfigured:provider.configured,provider:provider.provider,model:provider.model,contractVersion:CONTRACT_VERSION,sessionToken:token,health:service.snapshot(),outlook:outlook.status()});return}
  if(pathname.startsWith('/api/outlook/')){
   if(req.headers['x-signalguard-token']!==token){send(res,403,{error:'Session token required'});return}
   try{
    if(pathname==='/api/outlook/status'&&req.method==='GET'){send(res,200,{status:outlook.status(),capabilities:await outlook.probe()});return}
    if(req.method!=='POST'){send(res,405,{error:'POST required'});return}
    if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')){send(res,415,{error:'JSON required'});return}
    const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>4096){send(res,413,{error:'Outlook control request too large'});return}chunks.push(chunk)}
    const input=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    let result;
    if(pathname==='/api/outlook/classic')result=await outlook.connectClassic(input.consent);
    else if(pathname==='/api/outlook/graph/start')result=await outlook.beginGraph(input);
    else if(pathname==='/api/outlook/graph/poll')result=await outlook.pollGraph();
    else if(pathname==='/api/outlook/sync')result=await outlook.sync();
    else if(pathname==='/api/outlook/disconnect'){outlook.disconnect();result={disconnected:true};}
    else {send(res,404,{error:'Unknown Outlook control'});return}
    send(res,200,result);
   }catch(error){send(res,400,{error:error.message||'Outlook connection failed'});}return;
  }
  if(pathname==='/api/health'&&req.method==='GET'){send(res,200,{status:'ready',localAvailable:true,aiConfigured:provider.configured,provider:provider.provider,model:provider.model,health:service.snapshot()});return}
  if(pathname==='/api/analyze'){
   if(req.method!=='POST'){send(res,405,{error:'POST required'});return}
   if(req.headers['x-signalguard-token']!==token){send(res,403,{error:'Session token required'});return}
   if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')){send(res,415,{error:'JSON required'});return}
   let raw;try{const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>70000){send(res,413,{error:'Message exceeds 70 KB'});return}chunks.push(chunk)}raw=Buffer.concat(chunks).toString('utf8')}catch{if(!res.headersSent)send(res,400,{error:'Incomplete request'});return}
   let email;try{const payload=JSON.parse(raw);if(payload.consent!==true)throw Error('Explicit consent is required');email=validateEmail(payload.email)}catch(error){send(res,400,{error:error.message});return}
   const requestId=crypto.randomUUID(),local=Engine.analyze(email);
   if(!provider.configured){send(res,503,{requestId,code:'not_configured',error:'Set NVIDIA_API_KEY on the local server. Local evidence is retained.',local});return}
   try{const result=await service.assess(email);send(res,200,{requestId,...result,local,consensus:result.ai.severity===local.level?'agreement':result.ai.severity==='Unknown'?'abstention':'disagreement'})}catch(error){const retry=error.retryAfterSeconds||0;if(retry)res.setHeader('Retry-After',String(retry));const status=['budget_limit','provider_rate_limit'].includes(error.code)?429:error.code==='circuit_open'?503:502;send(res,status,{requestId,code:error.code||'provider_unavailable',error:error.code?error.message:'AI request failed. Local evidence is retained.',retryAfterSeconds:retry,local})}return;
  }
  if(pathname.startsWith('/api/')){send(res,404,{error:'Unknown endpoint'});return}
  if(!['GET','HEAD'].includes(req.method)){send(res,405,{error:'Method not allowed'});return}
  let decoded;try{decoded=decodeURIComponent(pathname)}catch{send(res,400,{error:'Invalid path'});return}
  const file=path.resolve(root,'.'+(decoded==='/'?'/index.html':decoded));if(!file.startsWith(root+path.sep)){send(res,403,{error:'Invalid path'});return}
  let stat;try{stat=fs.statSync(file)}catch{send(res,404,{error:'File not found'});return}if(!stat.isFile()){send(res,404,{error:'File not found'});return}
  const type={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.zip':'application/zip'}[path.extname(file)]||'application/octet-stream';res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"});if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);
 }catch{if(!res.headersSent)send(res,500,{error:'Request failed'});else res.end()}});
 server.requestTimeout=15000;server.headersTimeout=10000;server.keepAliveTimeout=5000;server.on('close',()=>outlook.disconnect());return server;
}
if(require.main===module){const port=Number(process.env.PORT||8787);if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid PORT');const server=createServer({port});server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'That local port is already in use. Set PORT to a free port and restart.':'The local service could not start.');process.exitCode=1;});server.listen(port,'127.0.0.1',()=>{const url=`http://127.0.0.1:${port}`;console.log(`SignalGuard Desktop: ${url}\nNVIDIA Nemotron: ${process.env.NVIDIA_API_KEY?'configured':'key not configured — local analysis available'}`);if(process.platform==='win32'&&process.argv.includes('--open'))require('node:child_process').execFile(path.join(process.env.SystemRoot||'C:\\Windows','explorer.exe'),[url],{windowsHide:true},()=>{});});for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{server.close(()=>process.exit(0));setTimeout(()=>{server.closeAllConnections();process.exit(0)},5000).unref()})}
module.exports={createServer,validateAI,validateEmail};
