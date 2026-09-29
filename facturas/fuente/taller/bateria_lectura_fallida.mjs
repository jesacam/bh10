// ═══ BATERÍA LECTURA FALLIDA · el guardián de v344 ═══
// «No había nada» ≠ «no se pudo leer». Si bh10-fc-v3 trae un valor CORRUPTO
// (JSON.parse revienta), la app arrancaba con [] y el primer cambio del
// usuario escribía la lista vacía encima de la nube: 922 facturas fuera.
// Aquí se siembra la corrupción de verdad y se vigila cada escritura.
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
import fs from 'fs';
const datos=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://bh10group.com/app/',pretendToBeVisual:true});
for(const k of ['window','document','navigator','localStorage','sessionStorage','HTMLElement','Node','Event','CustomEvent','Blob','URL','atob','btoa'])
  {try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
globalThis.window=dom.window;
window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
window.requestAnimationFrame=cb=>setTimeout(cb,0);globalThis.requestAnimationFrame=window.requestAnimationFrame;
window.cancelAnimationFrame=()=>{};globalThis.cancelAnimationFrame=()=>{};
class RO{observe(){}unobserve(){}disconnect(){}}window.ResizeObserver=RO;globalThis.ResizeObserver=RO;
window.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};window.scrollTo=()=>{};
window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
window.BH10_EMPRESA={sub:'',nombre:'BIG HOUSE 2010'};window.BH10_ROL='admin';window.BH10_PERMISOS=null;

const nube={};for(const k of Object.keys(datos.claves))nube[k]=datos.claves[k];
// ── LA CORRUPCIÓN: un JSON truncado, como el que deja una escritura a medias ──
nube['bh10-fc-v3']=nube['bh10-fc-v3'].slice(0,4000);
nube['bh10-contratos']='{esto no es json[';

const escrituras=[];
window.storage={get:async k=>nube[k]!==undefined?{key:k,value:nube[k]}:null,
  set:async(k,v)=>{escrituras.push(k);nube[k]=String(v);return{key:k,value:v}},
  delete:async k=>{delete nube[k];return{key:k}},
  list:async p=>({keys:Object.keys(nube).filter(k=>!p||k.startsWith(p))}),
  getStatus:()=>({fase:'ok',error:'',ultimaEscritura:Date.now(),errorEscritura:'',pendientes:0,conflicto:null})};
console.error=()=>{};console.warn=()=>{};

let fallos=0;const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};
const {default:App}=(await import('../web_subir/app/assets/bh10-APPV399.js'));
const root=createRoot(document.getElementById('root'));
root.render(React.createElement(App));
const E=ms=>new Promise(r=>setTimeout(r,ms));
await E(2500);

ok(document.getElementById('root').textContent.length>500,'la app ARRANCA pese a las dos listas corruptas');
const aviso=document.body.textContent;
ok(/No se pudieron leer/.test(aviso)&&/FACTURAS/.test(aviso)&&/CONTRATOS/.test(aviso),
   'el aviso ⛔ nombra FACTURAS y CONTRATOS y pide recargar');
await E(1800);   // margen de sobra sobre los 700 ms del guardado diferido
ok(!escrituras.includes('bh10-fc-v3'),'NINGUNA escritura de facturas: la nube corrupta queda intacta y recuperable');
ok(!escrituras.includes('bh10-contratos'),'NINGUNA escritura de contratos');

// ── contraste: con la copia SANA el autoguardado sí queda armado ──
const src=fs.readFileSync('src/app.jsx','utf8');
ok(/invLecturaMal\.current\)return/.test(src)&&/ctLecturaMal\.current\)return/.test(src),
   'los dos autoguardados llevan el guardián en el fuente');
ok(/invLecturaMal\.current=true/.test(src)&&/ctLecturaMal\.current=true/.test(src),
   'los dos catches marcan la lectura fallida en vez de tragarla en silencio');

console.log(fallos?`═══ LECTURA FALLIDA: ${fallos} FALLOS ═══`:'═══ LECTURA FALLIDA: LA NUBE NO SE PISA ═══');
process.exit(fallos?1:0);
