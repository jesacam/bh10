import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div><div id="bh-main"></div></body></html>',{url:'https://x.com/',pretendToBeVisual:true});
for(const k of ['window','document','navigator','localStorage','HTMLElement','Node','Event','CustomEvent']){try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
globalThis.window=dom.window;
window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
window.requestAnimationFrame=cb=>setTimeout(cb,0);globalThis.requestAnimationFrame=window.requestAnimationFrame;
window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
window.storage={get:async()=>null,set:async(k,v)=>({key:k,value:v}),delete:async k=>({key:k}),list:async()=>({keys:[]}),getStatus:()=>({fase:'ok'})};
const M=await import('../web_subir/app/assets/bh10-APPV400.js');
const {ConfigAj}=M.__internos2;
const e=React.createElement;
const A=e('div',{key:'a'},'Face ID: la app pide iniciar sesión en cada apertura CUERPO-A');
const B=e('div',{key:'b'},'Versión de la app — estás usando CUERPO-B');
const C=e('div',{key:'c'},'Papelera con elementos eliminados CUERPO-C');
const root=createRoot(document.getElementById('root'));
const pinta=(hijos)=>root.render(e(ConfigAj,{hijos,abiertos:[],alternar:()=>{},ordenConfig:[],aviso:null}));
const E=ms=>new Promise(r=>setTimeout(r,ms));
const oe=console.error;console.error=()=>{};
pinta([A,B,C]);await E(400);
const parejas=()=>[...document.querySelectorAll('#bh-config > div')].map(d=>{
  const b=d.querySelector('button');const cu=d.querySelector('div');
  return b?{cab:b.textContent.replace(/[▾›]/g,'').trim(),cuerpo:(cu?.textContent||'').slice(-8)}:null;
}).filter(Boolean);
console.log('ANTES :',parejas());
const comprueba=(nombre,esperado)=>{
  const p=parejas();let mal=0;
  for(const x of p){
    const okA=x.cuerpo==='CUERPO-A'?x.cab.includes('Face ID'):true;
    const okB=x.cuerpo==='CUERPO-B'?x.cab.includes('Versión'):true;
    const okC=x.cuerpo==='CUERPO-C'?x.cab.includes('Papelera'):true;
    if(!(okA&&okB&&okC)){mal++;console.log('  ✗',nombre,'→',x.cab,'sobre',x.cuerpo);}
  }
  if(!mal)console.log('  ✓',nombre,'('+p.length+' apartados casan)');
  return mal;
};
let total=0;
pinta([B,C]);await E(400);        total+=comprueba('desaparece el primero');
pinta([A,B,C]);await E(400);      total+=comprueba('reaparece delante');
pinta([B]);await E(400);          total+=comprueba('quedan uno solo');
pinta([C,A,B]);await E(400);      total+=comprueba('orden distinto');
console.error=oe;
console.log(total?'✗ '+total+' desajustes cabecera↔cuerpo':'✓ cabeceras SIEMPRE con su cuerpo (4 escenarios de desplazamiento)');
process.exit(total?1:0);
