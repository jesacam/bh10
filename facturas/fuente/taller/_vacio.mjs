// ═══ INTERRELACIÓN ENTRE ALMACENES · ida y vuelta, y segunda empresa ═══════
// Lo que el pre-vuelo NO comprueba:
//
//  FASE 1 · escribir en TRES dominios distintos en la misma sesión (seguros,
//           veri*factu y seguros/flota), para ver si se pisan entre ellos.
//  FASE 2 · RECARGAR con la nube resultante. Éste es el punto ciego de toda la
//           fase: los estados viven ya en los almacenes, pero el CARGADOR
//           sigue en App. Si esa costura estuviera mal, lo escrito no volvería
//           — y ninguna batería lo miraba, porque todas montan la app una vez
//           y no la vuelven a levantar.
//  FASE 3 · GREEN GENERATION: la segunda empresa nunca se ha probado. Todo lo
//           verificado hasta hoy es con BIG HOUSE.
//
// Todo contra el bundle desplegado, con reloj y azar congelados.
import {irA} from './_nav.mjs';
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
import fs from 'fs';

const datos=JSON.parse(fs.readFileSync('/home/claude/copia/BH10_copia_completa_2026-09-06.json','utf8'));
const FIJO=new Date('2026-08-24T11:00:00Z').getTime();
const azar=(s)=>()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};

function entorno(nube){
  const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://bh10group.com/app/',pretendToBeVisual:true});
  for(const k of ['window','document','navigator','localStorage','sessionStorage','HTMLElement','Node','Event','CustomEvent','Blob','File','URL','atob','btoa','FileReader','getComputedStyle','crypto'])
    {try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
  globalThis.window=dom.window;
  const DR=Date;globalThis.Date=dom.window.Date=class extends DR{constructor(...a){a.length?super(...a):super(FIJO);}static now(){return FIJO;}};
  const r=azar(20260824);Math.random=r;dom.window.Math.random=r;
  window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
  window.requestAnimationFrame=cb=>setTimeout(cb,0);globalThis.requestAnimationFrame=window.requestAnimationFrame;
  window.cancelAnimationFrame=()=>{};globalThis.cancelAnimationFrame=()=>{};
  class RO{observe(){}unobserve(){}disconnect(){}}window.ResizeObserver=RO;globalThis.ResizeObserver=RO;
  window.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};window.scrollTo=()=>{};
  window.confirm=()=>true;window.prompt=()=>'';window.alert=()=>{};
  window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
  window.BH10_ROL='admin';window.BH10_PERMISOS=null;
  nube['bh10-ultimacopia']='2026-08-24T09:00:00.000Z';
  window.storage={get:async k=>nube[k]!==undefined?{key:k,value:nube[k]}:null,
    set:async(k,v)=>{nube[k]=String(v);return{key:k,value:v}},
    delete:async k=>{delete nube[k];return{key:k}},
    list:async p=>({keys:Object.keys(nube).filter(k=>!p||k.startsWith(p))}),
    getStatus:()=>({fase:'ok',error:'',ultimaEscritura:FIJO,errorEscritura:'',pendientes:0,conflicto:null})};
  return dom;
}
const E=ms=>new Promise(x=>setTimeout(x,ms));
const util=()=>({
  click:t=>{if(irA(document,t))return true;const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes(t));if(b){b.click();return true;}return false;},
  pon:(el,v)=>{const k=Object.keys(el).find(x=>x.startsWith('__reactProps'));if(k&&el[k].onChange)el[k].onChange({target:{value:String(v)}});},
  txt:()=>document.getElementById('root').textContent,
});
async function montar(ruta,nube,empresa){
  entorno(nube);
  window.BH10_EMPRESA=empresa;
  const {default:App}=await import(ruta);
  const oe=console.error;console.error=()=>{};
  const root=createRoot(document.getElementById('root'));
  root.render(React.createElement(App));
  for(let i=0;i<320;i++){await E(25);if(document.getElementById('root').textContent.length>2500)break;}
  await E(1200);
  console.error=oe;
  return root;
}

async function vacio(ruta){
  const nube={};                                   // ← NUBE VACÍA de verdad
  const root=await montar(ruta,nube,{sub:'NUEVA',nombre:'EMPRESA RECIÉN CREADA'});
  const U=util();
  const fotos={inicio:document.getElementById('root').innerHTML};
  for(const v of ['Facturas','Contratos','Nóminas','Seguros','Ajustes','Panel']){U.click(v);await E(650);fotos[v]=document.getElementById('root').innerHTML;}
  root.unmount();await E(150);
  return {fotos,claves:Object.keys(nube).sort()};
}
const REF=fs.readdirSync('ref_produccion').find(f=>/^bh10-APPV\d+\.js$/.test(f));
const A=await vacio('../ref_produccion/'+REF);
const B=await vacio('../web_subir/app/assets/bh10-APPV393.js');
let f=0;const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)f++;};
const nv=t=>String(t).replace(/v3\d\d/g,'vXXX');
ok(B.fotos.inicio.length>2000,'la app arranca con la nube VACÍA y pinta ('+B.fotos.inicio.length+' bytes)');
for(const k of Object.keys(B.fotos))ok(nv(A.fotos[k])===nv(B.fotos[k]),`vacío · ${k}: idéntica (${B.fotos[k].length} bytes)`);
ok(JSON.stringify(A.claves)===JSON.stringify(B.claves),'mismas claves sembradas al arrancar en vacío ('+B.claves.length+'): ['+B.claves.join(', ')+']');
console.log(f?`═══ ARRANQUE EN VACÍO: ${f} DIFERENCIAS ═══`:'═══ ARRANQUE EN VACÍO: IDÉNTICO A PRODUCCIÓN ═══');
process.exit(f?1:0);
