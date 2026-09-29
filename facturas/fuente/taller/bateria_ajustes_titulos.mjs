// ═══ BATERÍA TÍTULO↔CONTENIDO DE AJUSTES ═══
// Reproduce el escenario REAL del iPhone: la nube llega A PLAZOS, los
// apartados condicionales (Exportar, Papelera…) aparecen tarde y la lista
// de hijos se desplaza. Cada cabecera debe corresponder SIEMPRE a su cuerpo.
// Se comprueba en dos modos: carga instantánea y carga progresiva.
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
import fs from 'fs';
const datos=JSON.parse(fs.readFileSync('/home/claude/copia/BH10_copia_completa_2026-09-06.json','utf8'));

// firmas propias de cada cuerpo → título que le corresponde
const CUERPOS=[
 ['Estás usando','Versión de la app'],
 ['La app pide iniciar sesión','Acceso con Face ID'],
 ['Todas las facturas y anticipos','Exportar'],
 ['Eliminar datos','Borrar todo'],
];

async function pasada(modo){
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
  // carga progresiva: las claves gordas tardan (como en el iPhone)
  const LENTAS=new Set(['bh10-fc-v3','bh10-contratos','bh10-nominas','bh10-employees']);
  const inicio=Date.now();
  window.storage={
    get:async k=>{
      if(modo==='progresiva'&&LENTAS.has(k)){
        const espera=Math.max(0,900-(Date.now()-inicio));
        if(espera>0)await new Promise(r=>setTimeout(r,espera));
      }
      return nube[k]!==undefined?{key:k,value:nube[k]}:null;
    },
    set:async(k,v)=>{nube[k]=String(v);return{key:k,value:v}},
    delete:async k=>({key:k}),
    list:async p=>({keys:Object.keys(nube).filter(k=>!p||k.startsWith(p))}),
    getStatus:()=>({fase:'ok',error:'',ultimaEscritura:Date.now(),errorEscritura:'',pendientes:0,conflicto:null})};
  const {default:App}=await import('../web_subir/app/assets/bh10-APPV393.js');
  const oe=console.error;console.error=()=>{};
  createRoot(document.getElementById('root')).render(React.createElement(App));
  const E=ms=>new Promise(r=>setTimeout(r,ms));
  await E(300);   // ¡pronto! como quien abre Ajustes nada más entrar
  const bAj=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Ajustes'));
  if(bAj)bAj.click();
  await E(2200);  // la nube termina de llegar con Ajustes ya montado
  console.error=oe;
  // recorrer cada apartado: cabecera (botón) y cuerpo (div hermano)
  // v358: Ajustes son casillas. Cada cuerpo (oculto) lleva data-titulo con
  // el título que le ha dado la identificación, y su casilla en la rejilla
  // debe existir con ese mismo título. Cabecera y cuerpo siguen atados.
  const cuerpos=[...document.querySelectorAll('#bh-config > div[data-aj="cuerpo"]')];
  const casillas=[...document.querySelectorAll('button[data-aj="casilla"]')].map(x=>x.textContent.replace(/[◀▶]/g,'').trim());
  const parejas=[];
  for(const ap of cuerpos){
    const titulo=(ap.getAttribute('data-titulo')||'').trim();
    if(!titulo)continue;
    const enRejilla=casillas.some(t=>t.includes(titulo));
    parejas.push({titulo:enRejilla?titulo:titulo+' (SIN CASILLA)',cuerpo:(ap.textContent||'').replace(/\s+/g,' ').slice(0,120)});
  }
  console.log('  ',cuerpos.length,'cuerpos ·',casillas.length,'casillas');
  let mal=0;
  for(const [firma,tituloEsperado] of CUERPOS){
    const p=parejas.find(x=>x.cuerpo.includes(firma));
    if(!p){console.log('  ·',tituloEsperado,'(cuerpo no presente en',modo+')');continue;}
    const ok=p.titulo.includes(tituloEsperado);
    console.log(' ',ok?'✓':'✗',modo.padEnd(11),'cuerpo «'+firma.slice(0,28)+'…» → cabecera «'+p.titulo+'»'+(ok?'':' ✗ DEBÍA SER «'+tituloEsperado+'»'));
    if(!ok)mal++;
  }
  return mal;
}
// nivel componente: desplazamientos de hijos (la causa raíz del fallo real)
const {execSync}=await import('child_process');
let compFalla=0;
try{execSync('node taller/repro_shift.mjs',{stdio:['ignore','inherit','pipe']});}catch(e){compFalla=1;}
const m1=await pasada('instantanea');
const m2=await pasada('progresiva');
const total=compFalla+m1+m2;
console.log(total?'═══ TÍTULOS: '+total+' CABECERAS NO CASAN CON SU CUERPO ═══':'═══ TÍTULOS↔CONTENIDO: CASAN EN AMBOS MODOS DE CARGA ═══');
process.exit(total?1:0);
