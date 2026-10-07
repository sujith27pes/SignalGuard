(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.SignalGmail=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function extract(card,subject){const sender=card.querySelector('.gD[email]'),body=card.querySelector('.a3s.aiL');if(!sender||!body||!body.textContent.trim())return null;const address=sender.getAttribute('email')||'',name=sender.getAttribute('name')||sender.textContent.trim();const links=[...body.querySelectorAll('a[href]')].map(a=>({url:a.getAttribute('href')||'',label:(a.textContent||'').trim().slice(0,200)})).filter(a=>/^https?:\/\//i.test(a.url)).slice(0,30);return {from:(name?name+' ':'')+'<'+address+'>',subject:String(subject||'Opened Gmail message').slice(0,1000),body:body.textContent.slice(0,50000),links,source:'gmail',auth:'unknown'};}
 return {extract};
});
