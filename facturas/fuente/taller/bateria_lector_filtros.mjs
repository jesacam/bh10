// Batería específica de esta entrega: el LECTOR ve Filtros y Excel, no Acciones.
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://bh10group.com/app/',pretendToBeVisual:true});
for(const k of ['window','document','navigator','localStorage','sessionStorage','HTMLElement','Node','CustomEvent','Event','FileReader','Blob','URL','atob','btoa'])
  {try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
globalThis.window=dom.window;
window.matchMedia=window.matchMedia||(()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}));
window.requestAnimationFrame=cb=>setTimeout(cb,0);
window.cancelAnimationFrame=()=>{};
globalThis.requestAnimationFrame=window.requestAnimationFrame;
globalThis.cancelAnimationFrame=window.cancelAnimationFrame;
class RO{observe(){}unobserve(){}disconnect(){}}
window.ResizeObserver=RO;globalThis.ResizeObserver=RO;
window.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};
window.scrollTo=()=>{};
window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
window.BH10_EMPRESA={sub:'',nombre:'BIG HOUSE 2010'};
// datos: una factura con documento y otra sin él
import fs from 'fs';
const d=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const nube={'bh10-fc-v3':d.claves['bh10-fc-v3']};
window.storage={get:async k=>nube[k]!==undefined?{key:k,value:nube[k]}:null,set:async(k,v)=>{nube[k]=String(v);return{key:k,value:v}},delete:async k=>{delete nube[k];return{key:k,deleted:true}},list:async p=>({keys:Object.keys(nube).filter(k=>!p||k.startsWith(p))}),getStatus:()=>({fase:'ok',error:'',ultimaEscritura:Date.now(),errorEscritura:'',pendientes:0,conflicto:null})};
const {default:App}=await import('../web_subir/app/assets/bh10-APPV398.js');
let fallos=0;const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};
for(const esc of [
  {n:'MIEMBRO lector de facturas',permisos:{facturas:'lectura'},esperaFiltros:true,esperaAcciones:false},
  {n:'MIEMBRO admin de facturas', permisos:{facturas:'admin'},  esperaFiltros:true,esperaAcciones:true},
]){
  window.BH10_ROL='admin';window.BH10_PERMISOS=esc.permisos;window.__BH10_AREA='';
  document.getElementById('root').innerHTML='';
  const root=createRoot(document.getElementById('root'));
  const oe=console.error;console.error=()=>{};
  root.render(React.createElement(App));
  await new Promise(r=>setTimeout(r,800));
  // navegar a Facturas
  const botones=[...document.querySelectorAll('button')];
  const bFac=botones.find(b=>b.textContent.includes('Facturas'));
  bFac&&bFac.click();
  await new Promise(r=>setTimeout(r,800));
  console.error=oe;
  const txt=document.getElementById('root').textContent;
  console.log('── '+esc.n);
  ok(txt.includes('Filtros')===esc.esperaFiltros,'botón Filtros '+(esc.esperaFiltros?'visible':'oculto'));
  ok(txt.includes('Acciones')===esc.esperaAcciones,'botón Acciones '+(esc.esperaAcciones?'visible':'oculto'));
  if(esc.esperaFiltros&&!esc.esperaAcciones){
    const bFil=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Filtros'));
    bFil&&bFil.click();await new Promise(r=>setTimeout(r,400));
    const t2=document.getElementById('root').textContent;
    ok(t2.includes('Todos proveedores'),'panel de filtros se abre (selector de proveedor)');
    ok([...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='📊 Excel'),'botón 📊 Excel del filtro visible');
    ok(!t2.includes('Adjuntar PDF/foto'),'Adjuntar oculto para el lector');
    // desplegar una factura CON documento y comprobar que el lector puede verlo
    const invs=JSON.parse(d.claves['bh10-fc-v3']);
        // la lista sale ordenada por fecha desc: elegir la factura CON adjunto más reciente
    const objetivo=invs.filter(i=>i.adjPath&&i.tipo==='factura').sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha)))[0];
    console.log('    objetivo:',objetivo&&objetivo.proveedor,objetivo&&objetivo.fecha,'· ¿aparece en página?',t2.includes(objetivo&&objetivo.proveedor));
    const candidatos=[...document.querySelectorAll('div,td,span')].filter(el=>objetivo&&el.textContent.includes(objetivo.proveedor)&&el.textContent.length<400);
    console.log('    candidatos de fila:',candidatos.length);
    const fila=candidatos[candidatos.length-1];
    if(fila){fila.click();await new Promise(r=>setTimeout(r,600));}
    console.log('    ¿creció la página?',document.getElementById('root').textContent.length,'vs',t2.length);
    const t3=document.getElementById('root').textContent;
    ok(t3.includes('Ver documento'),'Ver documento disponible en el detalle para el lector');
    ok(!t3.includes('Adjuntar PDF/foto'),'Adjuntar sigue oculto también en el detalle');
  }
  root.unmount();
}
console.log(fallos?'═══ FALLOS: '+fallos+' ═══':'═══ BATERÍA LECTOR-FILTROS: TODO OK ═══');
process.exit(fallos?1:0);
