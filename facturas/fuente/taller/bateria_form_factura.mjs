// ═══ BATERÍA PROFUNDA DEL FORMULARIO DE FACTURA (pieza clave del ERP) ═══
// App COMPLETA con la copia real. Comprueba las interconexiones del modal
// extraído: detector de duplicados contra las 910 reales, borrador automático
// en la nube, cálculo del total, guardado hasta la nube y reapertura en edición.
import {irA} from './_nav.mjs';
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
import fs from 'fs';
const datos=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://bh10group.com/app/',pretendToBeVisual:true});
for(const k of ['window','document','navigator','localStorage','sessionStorage','HTMLElement','Node','Event','CustomEvent','Blob','URL','atob','btoa','FileReader','crypto']){try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
globalThis.window=dom.window;
window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
window.requestAnimationFrame=cb=>setTimeout(cb,0);globalThis.requestAnimationFrame=window.requestAnimationFrame;
window.cancelAnimationFrame=()=>{};globalThis.cancelAnimationFrame=()=>{};
class RO{observe(){}unobserve(){}disconnect(){}}window.ResizeObserver=RO;globalThis.ResizeObserver=RO;
window.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};window.scrollTo=()=>{};
window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
window.BH10_EMPRESA={sub:'',nombre:'BIG HOUSE 2010'};window.BH10_ROL='admin';window.BH10_PERMISOS=null;
const nube={};for(const k of Object.keys(datos.claves))nube[k]=datos.claves[k];
const escrituras=[];
window.storage={get:async k=>nube[k]!==undefined?{key:k,value:nube[k]}:null,
  set:async(k,v)=>{nube[k]=String(v);escrituras.push(k);return{key:k,value:v}},
  delete:async k=>{delete nube[k];return{key:k}},
  list:async p=>({keys:Object.keys(nube).filter(k=>!p||k.startsWith(p))}),
  getStatus:()=>({fase:'ok',error:'',ultimaEscritura:Date.now(),errorEscritura:'',pendientes:0,conflicto:null})};
const {default:App}=(await import('../web_subir/app/assets/bh10-APPV401.js'));
const oe=console.error;console.error=()=>{};
const root=createRoot(document.getElementById('root'));
root.render(React.createElement(App));
const E=ms=>new Promise(r=>setTimeout(r,ms));
await E(1500);
let fallos=0;const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};
const click=t=>{if(irA(document,t))return true;const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes(t));if(b)b.click();return !!b;};
const pon=(el,val)=>{
  const pk=Object.keys(el).find(k=>k.startsWith('__reactProps'));
  if(pk&&el[pk]&&el[pk].onChange){el[pk].onChange({target:{value:String(val)}});return;}
};
const inputTras=(etiqueta)=>{
  const span=[...document.querySelectorAll('span,label,div')].find(x=>x.textContent.trim().startsWith(etiqueta)&&x.textContent.length<etiqueta.length+25);
  if(!span)return null;
  const cont=span.closest('label')||span.parentElement;
  return cont?cont.querySelector('input'):null;
};
// una factura real para provocar el duplicado
const fc=JSON.parse(nube['bh10-fc-v3']);
const real=fc.find(i=>i.tipo!=='cobro'&&i.numFactura&&i.proveedor&&+i.total>0);
console.log('  · factura real usada como cebo:',real.numFactura,'·',real.proveedor.slice(0,25));

click('Facturas');await E(700);
const mas=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='+');
if(mas){mas.click();await E(350);}
click('📥 Factura recibida');await E(900);
ok(document.body.textContent.includes('Registrar'),'el formulario abre dentro de la app');

// 1) DUPLICADOS: número y proveedor de una real → el detector debe saltar
const iNum=[...document.querySelectorAll('input')].find(i=>(i.placeholder||'')==='F-2026/001');
const spanProv=[...document.querySelectorAll('span')].find(x=>x.textContent.trim()==='Proveedor *');
const iProv=spanProv?spanProv.parentElement.querySelector('input'):null;
ok(!!iNum&&!!iProv,'campos de número y proveedor localizados');
if(iNum)pon(iNum,real.numFactura);
if(iProv)pon(iProv,real.proveedor);
await E(700);
const cuerpo=()=>document.getElementById('root').textContent;
ok(/Ya registrada|Posible duplicado|Mismo importe/.test(cuerpo()),'⚠ el detector de duplicados SALTA contra las 910 reales');

// 2) BORRADOR: mientras se teclea, App guarda el borrador en la nube
await E(600);
const clavesLS=[];for(let i=0;i<dom.window.localStorage.length;i++)clavesLS.push(dom.window.localStorage.key(i));
const draftLS=clavesLS.find(k=>k.includes('draft-factura'));
ok(!!draftLS&&(dom.window.localStorage.getItem(draftLS)||'').includes(real.numFactura),'el borrador automático se escribe en localStorage mientras tecleas ('+draftLS+')');

// 3) número único + base → total calculado
if(iNum)pon(iNum,'PRUEBA-INTERCONEXION-001');
const spanBase=[...document.querySelectorAll('span')].find(x=>x.textContent.includes('Base imponible'));
const iBase=spanBase?spanBase.closest('label').querySelector('input'):null;
ok(!!iBase,'campo de base imponible localizado');
if(iBase)pon(iBase,'1000');
await E(600);
ok(cuerpo().includes('1.210,00')||cuerpo().includes('1210'),'el total con IVA 21% se calcula en vivo (1.210,00 €)');

// 4) GUARDAR: la factura debe llegar a la lista y a la nube
const antes=JSON.parse(nube['bh10-fc-v3']).length;
const bReg=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Registrar');
if(bReg){bReg.click();}
await E(1600);
const despues=JSON.parse(nube['bh10-fc-v3']);
ok(despues.length===antes+1,'la factura entra en la nube ('+antes+' → '+despues.length+')');
const nueva=despues.find(i=>i.numFactura==='PRUEBA-INTERCONEXION-001');
ok(!!nueva&&Math.abs(nueva.total-1210)<0.01&&nueva.proveedor===real.proveedor,'guardada con proveedor, base 1.000 y total 1.210,00');
const clavesLS2=[];for(let i=0;i<dom.window.localStorage.length;i++)clavesLS2.push(dom.window.localStorage.key(i));
const draftTras=clavesLS2.find(k=>k.includes('draft-factura'));
ok(!draftTras||!(dom.window.localStorage.getItem(draftTras)||'').includes('PRUEBA-INTERCONEXION'),'el borrador se limpia al registrar');

// 5) EDICIÓN: reabrir la recién creada y ver sus datos cargados
const filaNueva=[...document.querySelectorAll('*')].filter(x=>x.textContent.includes('PRUEBA-INTERCONEXION-001')&&x.children.length<8).sort((a,b)=>a.textContent.length-b.textContent.length)[0];
if(filaNueva)filaNueva.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true}));
await E(600);
click('✏️');await E(900);
const cargado=[...document.querySelectorAll('input')].some(i=>i.value==='PRUEBA-INTERCONEXION-001');
ok(cargado,'reabierta en edición con sus datos cargados');
console.error=oe;root.unmount();
console.log(fallos?'═══ FORM FACTURA: '+fallos+' FALLOS ═══':'═══ FORMULARIO DE FACTURA: TODAS LAS INTERCONEXIONES VIVAS ═══');
process.exit(fallos?1:0);
