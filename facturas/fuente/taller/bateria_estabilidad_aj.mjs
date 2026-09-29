// La prueba del rediseño: con un apartado abierto, un cambio de estado de la
// app (lo que antes reconstruía Ajustes entero) debe conservar EL MISMO nodo
// del DOM (identidad ===), el apartado abierto y el scroll.
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://bh10group.com/app/',pretendToBeVisual:true});
for(const k of ['window','document','navigator','localStorage','sessionStorage','HTMLElement','Node','CustomEvent','Event','FileReader','Blob','URL','atob','btoa']){try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
globalThis.window=dom.window;
window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
window.requestAnimationFrame=cb=>setTimeout(cb,0);globalThis.requestAnimationFrame=window.requestAnimationFrame;
window.cancelAnimationFrame=()=>{};globalThis.cancelAnimationFrame=()=>{};
class RO{observe(){}unobserve(){}disconnect(){}}window.ResizeObserver=RO;globalThis.ResizeObserver=RO;
window.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};window.scrollTo=()=>{};
window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
window.BH10_EMPRESA={sub:'',nombre:'BIG HOUSE 2010'};window.BH10_ROL='admin';window.BH10_PERMISOS=null;
const nube={};
window.storage={get:async k=>nube[k]!==undefined?{key:k,value:nube[k]}:null,set:async(k,v)=>{nube[k]=String(v);return{key:k,value:v}},delete:async k=>{delete nube[k];return{key:k}},list:async p=>({keys:Object.keys(nube).filter(k=>!p||k.startsWith(p))}),getStatus:()=>({fase:'ok',error:'',ultimaEscritura:Date.now(),errorEscritura:'',pendientes:0,conflicto:null})};
const {default:App}=await import('../web_subir/app/assets/bh10-APPV393.js');
const root=createRoot(document.getElementById('root'));
const oe=console.error;console.error=()=>{};
root.render(React.createElement(App));
await new Promise(r=>setTimeout(r,900));
let fallos=0;const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};
[...document.querySelectorAll('button')].find(b=>/Ajustes/.test(b.textContent)).click();
await new Promise(r=>setTimeout(r,900));
// v358 · casillas: se abre la 3ª y su ventana debe seguir abierta tras los re-renders
const casillas=()=>[...document.querySelectorAll('button[data-aj="casilla"]')];
const ventanaTitulo=()=>{const v=document.querySelector('[data-aj="ventana"]');return v?((v.querySelector('span[style*="font-weight: 700"]')||{}).textContent||''):'';};
casillas()[2].click();await new Promise(r=>setTimeout(r,350));
const abiertoAntes=ventanaTitulo();
ok(!!abiertoAntes,'ventana abierta: '+abiertoAntes);
const nodoConfig=document.getElementById('bh-config');
const cont=document.getElementById('bh-main');if(cont){cont.scrollTop=380;}
// provocar re-renders de App: abrir y cerrar el buscador global 🔍 dos veces
const lupa=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='🔍');
if(lupa){lupa.click();await new Promise(r=>setTimeout(r,250));lupa.click();await new Promise(r=>setTimeout(r,250));
         lupa.click();await new Promise(r=>setTimeout(r,250));lupa.click();await new Promise(r=>setTimeout(r,350));}
ok(!!lupa,'re-renders provocados (buscador global ×2)');
ok(document.getElementById('bh-config')===nodoConfig,'MISMO nodo del DOM: Ajustes NO se reconstruyó');
const abiertoDespues=ventanaTitulo();
ok(!!abiertoDespues&&abiertoDespues===abiertoAntes,'la ventana sigue abierta tras los re-renders ('+abiertoDespues+')');
ok(!cont||Math.abs(cont.scrollTop-380)<5,'el scroll se conserva ('+(cont?cont.scrollTop:'—')+')');
console.error=oe;
console.log(fallos?'═══ FALLOS: '+fallos+' ═══':'═══ BATERÍA ESTABILIDAD: TODO OK ═══');
process.exit(fallos?1:0);
