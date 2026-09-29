// Comparativa de arranque: chunk v307 (producción anterior) vs v311 (actual)
// con los MISMOS datos reales. Mide montaje hasta contenido pintado.
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
import fs from 'fs';
const d=JSON.parse(fs.readFileSync('/home/claude/copia/BH10_copia_completa_2026-09-06.json','utf8'));
async function medir(ruta,nombre){
  const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://bh10group.com/app/',pretendToBeVisual:true});
  for(const k of ['window','document','navigator','localStorage','sessionStorage','HTMLElement','Node','CustomEvent','Event','FileReader','Blob','URL','atob','btoa','getComputedStyle'])
    {try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
  globalThis.window=dom.window;
  window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
  window.requestAnimationFrame=cb=>setTimeout(cb,0);window.cancelAnimationFrame=()=>{};
  globalThis.requestAnimationFrame=window.requestAnimationFrame;globalThis.cancelAnimationFrame=window.cancelAnimationFrame;
  class RO{observe(){}unobserve(){}disconnect(){}}
  window.ResizeObserver=RO;globalThis.ResizeObserver=RO;
  window.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};
  window.scrollTo=()=>{};
  window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
  window.BH10_EMPRESA={sub:'',nombre:'BIG HOUSE 2010'};
  window.BH10_ROL='admin';window.BH10_PERMISOS=null;
  const nube={};for(const k of ['bh10-fc-v3','bh10-contratos','bh10-nominas','bh10-polizas','bh10-remesas','bh10-provcat','bh10-clicat','bh10-employees','bh10-company-v2'])nube[k]=d.claves[k];
  window.storage={get:async k=>nube[k]!==undefined?{key:k,value:nube[k]}:null,set:async(k,v)=>{nube[k]=String(v);return{key:k,value:v}},delete:async k=>{delete nube[k];return{key:k}},list:async p=>({keys:Object.keys(nube).filter(k=>!p||k.startsWith(p))}),getStatus:()=>({fase:'ok',error:'',ultimaEscritura:Date.now(),errorEscritura:'',pendientes:0,conflicto:null})};
  const t0=performance.now();
  const {default:App}=await import(ruta);
  const t1=performance.now();
  const root=createRoot(document.getElementById('root'));
  const oe=console.error;console.error=()=>{};
  root.render(React.createElement(App));
  // esperar a que el panel tenga contenido de verdad
  let t2=null;
  for(let i=0;i<400;i++){
    await new Promise(r=>setTimeout(r,25));
    const txt=document.getElementById('root').textContent;
    if(txt.includes('Pendiente de pago')){t2=performance.now();break;}
  }
  console.error=oe;
  console.log(`${nombre}: import ${Math.round(t1-t0)} ms · montaje+datos ${t2?Math.round(t2-t1)+' ms':'NO PINTÓ'}`);
  root.unmount();
  return t2?t2-t1:null;
}
// 3 pasadas de cada uno, alternadas, quedarse con la mejor (evita ruido del JIT)
const va=[],vb=[];
for(let i=0;i<3;i++){
  va.push(await medir('../viejo/app/assets/bh10-ZHBCDPK2.js','v307 (viejo)  pasada '+(i+1)));
  vb.push(await medir('../web_subir/app/assets/bh10-APPV311.js','v311 (actual) pasada '+(i+1)));
}
const m=x=>Math.round(Math.min(...x.filter(Boolean)));
console.log('\nMEJOR v307:',m(va),'ms · MEJOR v311:',m(vb),'ms · diferencia:',m(vb)-m(va),'ms');
process.exit(0);
