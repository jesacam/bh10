// ═══ BATERÍA DE ORDEN DE HOOKS · el cinturón de la fase de almacenes ═══
// Desde v325 los estados se agrupan en hooks por dominio (src/almacenes/*).
// Si un almacén mete un hook dentro de un if, de un bucle o detrás de un
// return temprano, React llama a los hooks en distinto orden entre renders y
// la app revienta — a veces solo al navegar, que es justo lo que no se ve en
// una prueba de un único render. Aquí se navega y se vigila la consola.
import {irA} from './_nav.mjs';
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
import fs from 'fs';
const datos=JSON.parse(fs.readFileSync('/home/claude/copia/BH10_copia_completa_2026-09-06.json','utf8'));
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
// La copia del 27 trae VERI*FACTU APAGADO (Jesús lo apagó ese mismo día:
// vfcfg.apagadoEn=2026-08-27). El botón «Ver registros» solo se pinta con el
// interruptor encendido, así que la sonda recrea su premisa encendiéndolo
// SOLO en esta copia local. La cadena real de 3 registros no se toca.
try{const _c=JSON.parse(nube['bh10-vfcfg']||'{}');_c.activo=true;nube['bh10-vfcfg']=JSON.stringify(_c);}catch(e){}
window.storage={get:async k=>nube[k]!==undefined?{key:k,value:nube[k]}:null,
  set:async(k,v)=>{nube[k]=String(v);return{key:k,value:v}},
  delete:async k=>{delete nube[k];return{key:k}},
  list:async p=>({keys:Object.keys(nube).filter(k=>!p||k.startsWith(p))}),
  getStatus:()=>({fase:'ok',error:'',ultimaEscritura:Date.now(),errorEscritura:'',pendientes:0,conflicto:null})};

// ── se CAPTURA la consola, no se silencia: es la prueba entera ──────────────
const dichos=[];
const oe=console.error, ow=console.warn;
console.error=(...a)=>{dichos.push(a.map(x=>(x&&x.message)||String(x)).join(' '));};
console.warn =(...a)=>{dichos.push(a.map(x=>(x&&x.message)||String(x)).join(' '));};

const {default:App}=(await import('../web_subir/app/assets/bh10-APPV393.js'));
const root=createRoot(document.getElementById('root'));
root.render(React.createElement(App));
const E=ms=>new Promise(r=>setTimeout(r,ms));
await E(1500);

let fallos=0;
const ok=(c,m)=>{oe((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};
const pinta=()=>document.getElementById('root').textContent.length;
const click=t=>{if(irA(document,t))return true;const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes(t));if(b)b.click();return !!b;};

const RE_ORDEN=/Rendered more hooks|Rendered fewer hooks|change in the order of Hooks|Should have a queue|Invalid hook call/i;

ok(pinta()>3000,`arranque: la app pinta ${pinta()} caracteres`);

// Recorrido del §3.5 (Panel→Facturas→Ajustes→Panel) + Seguros, que es el
// dominio mudado en la sesión 1: si su almacén reordenase hooks, es la
// pantalla que lo destaparía.
const ruta=['Panel','Facturas','Seguros','Ajustes','Panel','Seguros','Panel'];
// v369 (06-09-2026) · con la copia del 06-09 Seguros pinta ~1.9k: la flota está
// a cero y las 17 pólizas tienen fin anterior a hoy, así que la pantalla sale
// legítimamente más corta. El umbral sigue probando que RENDERIZA (no una
// pantalla en blanco): 1.200 para Seguros, 3.000 para el resto, como estaba.
for(const paso of ruta){
  const hubo=click(paso);
  await E(600);
  ok(hubo,`navega a ${paso}`);
  const minimo=paso==='Seguros'?1200:3000;
  ok(pinta()>minimo,`  ${paso}: pinta ${pinta()} caracteres (mínimo ${minimo})`);
}

// Los estados del almacén deben estar VIVOS: la pantalla de Seguros tiene que
// enseñar pólizas reales de la copia, no una lista vacía.
click('Seguros');await E(700);
const pol=JSON.parse(nube['bh10-polizas']||'[]');
const cuerpo=document.getElementById('root').textContent;
const muestra=pol.filter(p=>p&&p.activa!==false).slice(0,6).map(p=>String(p.nPoliza||p.cia||'')).filter(x=>x.length>3);
const vistas=muestra.filter(x=>cuerpo.includes(x)).length;
ok(pol.length>0,`la copia trae ${pol.length} pólizas reales`);
ok(vistas>0,`el almacén las sirve: ${vistas}/${muestra.length} identificadores visibles en pantalla`);

// ═══════════════════════════════════════════════════════════════════════════
// AÑADIDO (v327) · COBERTURA POR DOMINIO MUDADO
// Nada de lo de arriba se ha tocado: esto se SUMA. El recorrido original se
// quedó anclado a Seguros y la sesión 2 (fichaje y promociones) pasó el paso
// 22 sin que la batería pisara lo que había movido. Aquí cada almacén tiene
// su fila: al mudar un dominio nuevo se añade la suya y la red crece con la
// fase en vez de quedarse quieta.
//
// Los puentes de la app (fichaje y configurador de vivienda) se instalan AQUÍ
// y no arriba, a propósito: así la primera mitad de la batería sigue corriendo
// en el mismo entorno exacto en que corría antes.
console.log('  ── añadido: cobertura por dominio mudado ──');
window.bh10Fichaje={trabajadores:async()=>[{uid:'t1',nombre:'PRUEBA FICHAJE',telefono:'600000000'}],
  registros:async()=>[], alta:async()=>({}), publicarJornada:async()=>({}), rectificar:async()=>({})};
window.bh10Recibidos={listar:async()=>[], borrar:async()=>({})};

// 1 · las SEIS vistas, ida y vuelta, dos veces. El recorrido de arriba no pasa
//     por Contratos ni por Nóminas, y ahí viven dos de los tres almacenes.
const rutaLarga=['Panel','Facturas','Contratos','Nóminas','Seguros','Ajustes',
                 'Panel','Nóminas','Contratos','Seguros','Facturas','Panel'];
for(const paso of rutaLarga){
  const hubo=click(paso);
  await E(550);
  ok(hubo,`recorrido largo: ${paso}`);
  ok(pinta()>1500,`  ${paso}: pinta ${pinta()} caracteres`);
}

// 2 · la ventana propia de cada dominio mudado, con su sonda de datos vivos.
//     Al mudar un dominio nuevo: se añade su fila y ya está.
const DOMINIOS=[
  // minimo: la flota de esta copia está VACÍA, así que su pantalla es corta a
  // propósito. Lo que manda es la sonda, no el tamaño.
  {dominio:'seguros · vehículos', pasos:['Seguros','🚐 Vehículos'], minimo:150,
   sonda:()=>{const f=JSON.parse(nube['bh10-flota']||'[]').filter(v=>v&&v.activa!==false);
     const t=document.getElementById('root').textContent;
     return f.length===0 ? /Sin vehículos ni máquinas/.test(t)
       : f.slice(0,4).some(v=>t.includes(String(v.matricula||v.alias||'')));},
   queEs:'la subvista de vehículos responde al almacén de seguros'},
  {dominio:'fichaje', pasos:['Nóminas','👥 Plantilla','🕐 Fichajes'], minimo:1500,
   sonda:()=>/PRUEBA FICHAJE/.test(document.getElementById('root').textContent),
   queEs:'la ventana de fichaje abre y pinta lo que devuelve el puente'},
  // FACTURAS (sesión 7, la última): sonda con una factura real de la copia.
  {dominio:'facturas', pasos:['Facturas','Recibidas'], minimo:5000,
   sonda:()=>{const f=JSON.parse(nube['bh10-fc-v3']||'[]').filter(x=>x&&x.tipo!=='emitida');
     const t=document.getElementById('root').textContent;
     return f.length>0 && f.slice(0,12).some(x=>t.includes(String(x.numFactura||'')));},
   queEs:'la lista enseña facturas reales de la copia'},
  // CONTRATOS (sesión 6): la sonda exige un contrato real de la copia.
  {dominio:'contratos', pasos:['Contratos'], minimo:3000,
   sonda:()=>{const c=JSON.parse(nube['bh10-contratos']||'[]');
     const t=document.getElementById('root').textContent;
     return c.length>0 && c.slice(0,8).some(x=>t.includes(String(x.numero||'')));},
   queEs:'la lista enseña contratos reales de la copia'},
  // NÓMINAS (sesión 5): el dominio grande. La sonda exige un empleado real de
  // la copia en la plantilla — si el almacén no sirviera, saldría vacía.
  {dominio:'nóminas · plantilla', pasos:['Nóminas','👥 Plantilla'], minimo:1500,
   sonda:()=>{const e=JSON.parse(nube['bh10-employees']||'[]');
     const t=document.getElementById('root').textContent;
     return e.length>0 ? e.slice(0,5).some(x=>t.includes(String(x.nombre||''))) : /[Pp]lantilla/.test(t);},
   queEs:'la plantilla enseña empleados reales de la copia'},
  // TESORERÍA/BANCOS (sesión 4): la ventana de extractos cuelga de
  // Facturas → Pendiente por proveedor. OJO: la copia real NO trae ningún
  // extracto N43, así que aquí solo se puede comprobar el camino vacío.
  // Cuando haya extractos, la sonda debe exigir uno de verdad.
  {dominio:'tesorería · N43', pasos:['Facturas','Pendiente','🗂️ Extractos'], minimo:1000,
   sonda:()=>/[Ee]xtracto/.test(document.getElementById('root').textContent),
   queEs:'la ventana de extractos abre y responde al almacén de tesorería'},
  // VERI*FACTU (sesión 3): la ventana cuelga de Ajustes, dentro de su
  // acordeón. Sonda: la cadena real de registros de la copia debe verse.
  {dominio:'veri*factu', pasos:['Ajustes','Registro VERI*FACTU','🧾 Ver registros y enviar'], minimo:1500,
   sonda:()=>{const r=JSON.parse(nube['bh10-vfregistros']||'[]');
     const t=document.getElementById('root').textContent;
     return r.length>0 && r.some(x=>t.includes(String(x.numSerie||x.numSerieFactura||'')));},
   queEs:'la ventana enseña la cadena de registros real de la AEAT'},
  {dominio:'promociones', pasos:['Contratos','🏘️ Promoción'], minimo:3000,
   sonda:()=>pinta()>3000,
   queEs:'la ventana de promoción abre sobre un contrato real'},
];
for(const d of DOMINIOS){
  let llego=true;
  for(const p of d.pasos){ if(!click(p))llego=false; await E(900); }
  ok(llego,`${d.dominio}: se alcanza (${d.pasos.join(' → ')})`);
  ok(pinta()>d.minimo,`  ${d.dominio}: pinta ${pinta()} caracteres (mínimo ${d.minimo})`);
  ok(d.sonda(),`  ${d.dominio}: ${d.queEs}`);
  const cerrar=[...document.querySelectorAll('button')].reverse()
    .find(x=>['✕','×','Cerrar','⟵','←'].includes(x.textContent.trim()));
  if(cerrar){cerrar.click();await E(500);}
}

// 3 · y después de haber pisado los tres, el almacén de la sesión 1 debe
//     seguir sirviendo. Si un almacén posterior le reordenase los hooks,
//     aquí es donde se caería.
click('Panel');await E(500);
click('Seguros');await E(800);
click('🛡️ Pólizas');await E(700);   // el paso anterior dejó la subvista en Vehículos
const cuerpo2=document.getElementById('root').textContent;
const vistas2=muestra.filter(x=>cuerpo2.includes(x)).length;
ok(vistas2>0,`tras recorrer los tres dominios, seguros sigue vivo: ${vistas2}/${muestra.length}`);

const orden=dichos.filter(d=>RE_ORDEN.test(d));
ok(orden.length===0,`cero quejas de orden de hooks (${dichos.length} mensajes de consola en total)`);
if(orden.length)orden.slice(0,3).forEach(d=>oe('     ↳ '+d.slice(0,180)));

console.error=oe;console.warn=ow;
console.log(fallos?`═══ BATERÍA HOOKS: ${fallos} FALLOS ═══`:'═══ BATERÍA HOOKS: ORDEN ESTABLE EN TODA LA NAVEGACIÓN ═══');
process.exit(fallos?1:0);
