'use strict';
const {execFile}=require('node:child_process'),path=require('node:path'),crypto=require('node:crypto');
const {createGraph}=require('./outlook-graph.cjs');
async function classicProbe(){
  if(process.platform!=='win32')return {classicAvailable:false,newOutlookRunning:false,platform:process.platform};
  const system=path.join(process.env.SystemRoot||'C:\\Windows','System32');
  const check=(exe,args)=>new Promise(resolve=>execFile(path.join(system,exe),args,{windowsHide:true,timeout:5000,maxBuffer:64000},(error,stdout,stderr)=>resolve({ok:!error,text:String(stdout||''),errorText:String(stderr||'')})));
  const [registry,processes]=await Promise.all([check('reg.exe',['query','HKCR\\Outlook.Application\\CLSID']),check('tasklist.exe',['/FI','IMAGENAME eq olk.exe','/FO','CSV','/NH'])]);
  return {classicAvailable:registry.ok?true:/unable to find|cannot find|not found/i.test(registry.errorText)?false:null,newOutlookRunning:processes.ok?/olk\.exe/i.test(processes.text):null,detectionLimited:!processes.ok||!registry.ok&&!/unable to find|cannot find|not found/i.test(registry.errorText),platform:'win32'};
}
function classicCall(probe=false){return new Promise((resolve,reject)=>{
  if(probe){classicProbe().then(resolve,reject);return;}
  if(process.platform!=='win32'){probe?resolve({classicAvailable:false,newOutlookRunning:false,platform:process.platform}):reject(Error('Classic Outlook integration requires Windows'));return;}
  const exe=path.join(process.env.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe');
  execFile(exe,['-NoProfile','-NonInteractive','-STA','-File',path.join(__dirname,'../scripts/Read-Outlook.ps1'),...(probe?['-Probe']:[])],{windowsHide:true,timeout:25000,maxBuffer:8000000,encoding:'utf8'},(error,stdout)=>{if(error){reject(Error('Classic Outlook could not be read. Check its profile and programmatic-access policy; use the Microsoft mailbox route for New Outlook.'));return;}try{resolve(JSON.parse(stdout.replace(/^\uFEFF/,'')))}catch{reject(Error('Classic Outlook returned an invalid local response'))}});
});}
function createOutlook({graph=createGraph(),classicReader=classicCall,now=Date.now}={}){
  let mode=null,epoch=0,busy=false,lastSync=null,lastError=null,nextRead=0,truncated=false;const records=new Map();
  const status=()=>({mode,connected:mode==='classic'||mode==='graph'&&graph.status().connected,busy,lastSync,lastError,retained:records.size,limit:200,truncated,graph:graph.status(),pollSeconds:mode==='classic'?10:20});
  const clear=()=>{epoch++;mode=null;records.clear();graph.disconnect();lastSync=null;lastError=null;nextRead=0;truncated=false;};
  return {status,probe:()=>classicReader(true),disconnect:clear,async connectClassic(consent){if(consent!==true)throw Error('Read-only mailbox consent is required');const generation=epoch;const p=await classicReader(true);if(generation!==epoch)throw Error('Connection cancelled');if(!p.classicAvailable)throw Error('Classic Outlook could not be confirmed as available. New Outlook uses the Microsoft mailbox connection.');clear();mode='classic';return status();},async beginGraph(input){clear();const generation=epoch;const result=await graph.begin(input);if(generation!==epoch)throw Error('Connection cancelled');mode='graph';return result;},pollGraph:()=>graph.poll(),async sync(){
    if(!mode)throw Error('Connect Outlook first');if(busy||now()<nextRead)return {status:status(),messages:[...records.values()]};
    busy=true;const generation=epoch,selected=mode;nextRead=now()+(mode==='classic'?10000:20000);
    try{const batch=selected==='classic'?await classicReader(false):await graph.read();if(epoch!==generation)throw Error('Connection cancelled');
      for(const item of batch.records){if(!item||typeof item.id!=='string')continue;const id=crypto.createHash('sha256').update(selected+'\n'+item.id).digest('hex');if(item.removed){records.delete(id);continue;}
        const clean={id:'outlook-'+id,name:String(item.name||'Outlook sender').slice(0,150),from:String(item.from||'').slice(0,500),replyTo:String(item.replyTo||'').slice(0,500),subject:String(item.subject||'(No subject)').slice(0,1000),body:String(item.body||'').slice(0,50000),receivedAt:item.receivedAt,hasAttachments:item.hasAttachments===true,bodyTruncated:item.bodyTruncated===true,attachments:[],source:item.source,coverage:item.coverage};
        const contentVersion=crypto.createHash('sha256').update(JSON.stringify(clean)).digest('hex');records.set(id,{...clean,contentVersion});}
      const sorted=[...records.entries()].sort((a,b)=>String(b[1].receivedAt).localeCompare(String(a[1].receivedAt)));records.clear();for(const [key,value] of sorted.slice(0,200))records.set(key,value);
      truncated=batch.more===true||sorted.length>200;lastSync=new Date(now()).toISOString();lastError=null;
    }catch(error){if(epoch===generation)lastError=error.message;throw error}finally{busy=false;}
    return {status:status(),messages:[...records.values()]};
  }};
}
module.exports={createOutlook,classicCall,classicProbe};
