// ═══ ESCRITURAS DE LOS DOMINIOS MUDADOS · v324 producción vs actual ════════
// Las A/B S1–S6 no accionan NADA de seguros, fichaje ni promociones: mueven
// pagos, certificaciones, remesas y fichas. O sea, justo lo que la fase de
// almacenes ha movido es lo que ninguna prueba escribe. Esta batería tapa ese
// hueco: da de baja y restaura una póliza, crea una póliza y un vehículo,
// y usa el deshacer — que es el efecto transversal que se quedó en App
// leyendo flota y pólizas. Todo con reloj y azar congelados, y comparando la
// nube resultante byte a byte contra el bundle desplegado.
import {irA} from './_nav.mjs';
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
import fs from 'fs';
import {explicarDelta,explicarRecorte,normAjustesTexto} from './_delta.mjs';
const datos=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const FIJO=1756000000000;
function azarSembrado(sem){let a=sem>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

async function ejecutar(ruta){
  const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://bh10group.com/app/',pretendToBeVisual:true});
  for(const k of ['window','document','navigator','localStorage','sessionStorage','HTMLElement','Node','CustomEvent','Event','FileReader','Blob','URL','atob','btoa']){try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
  globalThis.window=dom.window;
  // ── congelar el tiempo y el azar ──
  const DateReal=Date;
  const DateFija=class extends DateReal{constructor(...a){a.length?super(...a):super(FIJO);}static now(){return FIJO;}};
  globalThis.Date=DateFija;dom.window.Date=DateFija;
  const rnd=azarSembrado(20260823);Math.random=rnd;dom.window.Math.random=rnd;
  window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
  window.requestAnimationFrame=cb=>setTimeout(cb,0);globalThis.requestAnimationFrame=window.requestAnimationFrame;
  window.cancelAnimationFrame=()=>{};globalThis.cancelAnimationFrame=()=>{};
  class RO{observe(){}unobserve(){}disconnect(){}}window.ResizeObserver=RO;globalThis.ResizeObserver=RO;
  window.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};window.scrollTo=()=>{};
  window.confirm=()=>true;window.prompt=()=>'';window.alert=()=>{};
  window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
  window.BH10_EMPRESA={sub:'',nombre:'BIG HOUSE 2010'};window.BH10_ROL='admin';window.BH10_PERMISOS=null;
  // ── nube instrumentada ──
  const nube={};for(const k of Object.keys(datos.claves))nube[k]=datos.claves[k];
  const escrituras=[];
  window.storage={
    get:async k=>nube[k]!==undefined?{key:k,value:nube[k]}:null,
    set:async(k,v)=>{escrituras.push([k,String(v)]);nube[k]=String(v);return{key:k,value:v}},
    delete:async k=>{escrituras.push([k,'__BORRADO__']);delete nube[k];return{key:k}},
    list:async p=>({keys:Object.keys(nube).filter(k=>!p||k.startsWith(p))}),
    getStatus:()=>({fase:'ok',error:'',ultimaEscritura:FIJO,errorEscritura:'',pendientes:0,conflicto:null})};
  // ── captura de descargas (los XML de remesa salen por aquí) ──
  const descargas=[];const blobs=new Map();
  const cOU=URL.createObjectURL?.bind(URL);
  URL.createObjectURL=(b)=>{const u='blob:cap-'+blobs.size;blobs.set(u,b);return u;};
  URL.revokeObjectURL=()=>{};
  const clickReal=dom.window.HTMLAnchorElement.prototype.click;
  dom.window.HTMLAnchorElement.prototype.click=function(){descargas.push({nombre:this.download||'',url:this.href});};
  const {default:App}=await import(ruta);
  const root=createRoot(document.getElementById('root'));
  const oe=console.error;console.error=()=>{};
  root.render(React.createElement(App));
  const E=ms=>new Promise(r=>setTimeout(r,ms));
  const click=(t,exacto)=>{if(!exacto&&irA(document,t))return true;const b=[...document.querySelectorAll('button')].find(x=>exacto?x.textContent.trim()===t:x.textContent.includes(t));if(b)b.click();return !!b;};
  await E(1400);
  const cortes={};const corta=n=>{cortes[n]=escrituras.length;};
  // Escritura en inputs controlados: por las props de React (los eventos
  //  sintéticos de jsdom no siempre despiertan el onChange delegado).
  const pon=(el,val)=>{
    const pk=Object.keys(el).find(k=>k.startsWith('__reactProps'));
    if(pk&&el[pk]&&el[pk].onChange){el[pk].onChange({target:{value:String(val)}});return;}
    const prev=el.value;
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(el,String(val));
    if(el._valueTracker)el._valueTracker.setValue(prev);
    el.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  };
  const inputPorPista=(pista)=>[...document.querySelectorAll('input')].find(i=>(i.placeholder||'').includes(pista));

  // ── D1 · DAR DE BAJA UNA PÓLIZA (persistPolizas, mudada al almacén) ──
  click('Seguros');await E(1100);
  corta('antesBaja');
  const bajas=[...document.querySelectorAll('button')].filter(x=>/🗑|Baja|✖/.test(x.textContent));
  if(bajas.length){bajas[0].click();await E(900);}
  corta('baja');

  // ── D2 · RESTAURAR con el botón de deshacer de la baja (bajaTimer, mudado) ──
  corta('antesRestaura');
  click('Deshacer');await E(800);
  corta('restaura');

  // ── D3 · CREAR UNA PÓLIZA NUEVA (uid() con azar congelado) ──
  click('Seguros');await E(700);
  corta('antesNuevaPol');
  const mas1=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='+ Añadir'||b.textContent.trim()==='+');
  if(mas1){mas1.click();await E(800);}
  const insPol=[...document.querySelectorAll('input')];
  for(const [pista,val] of [['AXA, Caja Rural','MAPFRE PRUEBA'],['45/00000000-00','PZ-TEST-001'],['975,46','1234,56']]){
    const el=insPol.find(i=>(i.placeholder||'').includes(pista));
    if(el){pon(el,val);await E(200);}
  }
  // la póliza exige clase de seguro: se rellena el campo libre de descripción
  const desc=insPol.find(i=>(i.placeholder||'').includes('Descripción'));
  if(desc){pon(desc,'SEGURO DE PRUEBA');await E(200);}
  // OJO: el primer <select> de la pantalla es el ORDENADOR de la lista de
  // detrás, no el del modal. El de la clase de seguro es el que ofrece
  // «— Elige —». Tocar el equivocado reordena la lista y no guarda nada.
  const selRamo=[...document.querySelectorAll('select')].find(sl=>[...sl.options].some(o=>/Elige/.test(o.textContent)));
  if(selRamo){const pk=Object.keys(selRamo).find(k=>k.startsWith('__reactProps'));
    const ops=[...selRamo.options].map(o=>o.value).filter(Boolean);
    if(pk&&selRamo[pk].onChange&&ops.length)selRamo[pk].onChange({target:{value:ops[0]}});await E(300);}
  for(const t of ['Guardar','💾']){if(click(t)){await E(900);break;}}
  corta('nuevaPol');

  // ── D4 · CREAR UN VEHÍCULO (persistFlota, mudada; la flota está vacía) ──
  click('Seguros');await E(700);
  click('🚐 Vehículos');await E(800);
  corta('antesVeh');
  const mas2=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='+ Añadir'||b.textContent.trim()==='+');
  if(mas2){mas2.click();await E(800);}
  const insVeh=[...document.querySelectorAll('input')];
  for(const [pista,val] of [['Furgón obra','FURGONETA PRUEBA'],['1234-ABC','1234ABC']]){
    const el=insVeh.find(i=>(i.placeholder||'').includes(pista));
    if(el){pon(el,val);await E(200);}
  }
  for(const t of ['Guardar','💾']){if(click(t)){await E(900);break;}}
  corta('veh');

  // ── D6 · CONFIGURACIÓN VERI*FACTU (persistVfCfg, mudada en la sesión 3) ──
  click('Ajustes');await E(900);
  click('Registro VERI*FACTU');await E(900);
  corta('antesVf');
  const insVf=[...document.querySelectorAll('input')];
  const nif=insVf.find(i=>(i.placeholder||'').includes('B12345678')||/productorNif/i.test(i.name||''));
  if(nif){pon(nif,'B45731981');await E(700);}
  else{const cual=insVf.find(i=>i.type==='text'&&(i.value||'').startsWith('https'));
       if(cual){pon(cual,'https://bh10group.com/aeat/enviar');await E(700);}}
  corta('vfcfg');

  // ── D5 · DESHACER GLOBAL (↶): el efecto transversal que lee flota y pólizas ──
  corta('antesDeshacer');
  click('↶');await E(1200);
  corta('deshacer');

  // Se fotografía la pantalla ENTERA, no los primeros 6.000 caracteres: al
  // añadir el campo de la serie en Ajustes, sus 562 bytes empujaban 3.684
  // fuera del recorte y el comparador denunciaba —con razón— que «se ha
  // QUITADO algo». No faltaba nada de la app: faltaba del recorte.
  const fotoSeg=document.getElementById('root').textContent.replace(/\s+/g,' ');
  console.error=oe;
  // resolver los textos de las descargas
  const bajadas=[];
  for(const d of descargas){
    const b=blobs.get(d.url);
    bajadas.push({nombre:d.nombre,texto:b?await b.text():'(?)'});
  }
  root.unmount();await E(80);
  return {escrituras,cortes,bajadas,fotoSeg,nubeFinal:nube};
}

const REF=fs.readdirSync('ref_produccion').find(f=>/^bh10-APPV\d+\.js$/.test(f));
if(!REF)throw new Error('ref_produccion/ no tiene ningún bh10-APPV*.js — ver su LEEME.txt');
const A=await ejecutar(process.argv[2]||('../ref_produccion/'+REF));
const B=await ejecutar(process.argv[3]||'../web_subir/app/assets/bh10-APPV402.js');
let fallos=0;const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};
const tramo=(r,d,h)=>r.escrituras.slice(r.cortes[d],r.cortes[h]).map(([k,v])=>k+'='+v).join('\u0001');
for(const [nom,d,h,min] of [['D1 baja de póliza','antesBaja','baja',1],['D2 restaurar (deshacer baja)','antesRestaura','restaura',1],['D3 póliza nueva','antesNuevaPol','nuevaPol',1],['D4 vehículo nuevo','antesVeh','veh',1],['D6 config VERI*FACTU','antesVf','vfcfg',0],['D5 deshacer global','antesDeshacer','deshacer',0]]){
  const ta=tramo(A,d,h),tb=tramo(B,d,h);
  const na=A.escrituras.slice(A.cortes[d],A.cortes[h]).map(x=>x[0]);
  ok(ta===tb&&na.length>=min,`${nom}: escrituras idénticas Y consumadas (${na.length}: ${[...new Set(na)].join(', ')||'⚠ NINGUNA'})`);
  if(ta!==tb){let i=0;while(i<Math.min(ta.length,tb.length)&&ta[i]===tb[i])i++;
    console.log('     v324: …'+ta.slice(Math.max(0,i-50),i+70));
    console.log('     v314: …'+tb.slice(Math.max(0,i-50),i+70));}
}
ok(JSON.stringify(A.bajadas)===JSON.stringify(B.bajadas),
   `descargas idénticas (${A.bajadas.length}: ${A.bajadas.map(x=>x.nombre).join(', ')||'ninguna'})`);
// estado final de TODA la nube: fichas de clientes, proveedores, contratos… nada corrupto
const claves=[...new Set([...Object.keys(A.nubeFinal),...Object.keys(B.nubeFinal)])].sort();
let distintas=0;
for(const k of claves){
  if(A.nubeFinal[k]!==B.nubeFinal[k]){distintas++;console.log('  ✗ clave final difiere:',k);}
}
ok(distintas===0,`estado final completo de la nube idéntico (${claves.length} claves: fichas, contratos, embargos, todo)`);
// la pantalla de Seguros tras todas las escrituras: idéntica en los dos
const normV=t=>String(t).replace(/v3\d+/g,'vXXX');
console.log('  · TEXTO de la pantalla final →',JSON.stringify(B.fotoSeg));
{const a=normV(A.fotoSeg), b=normV(B.fotoSeg);
 let ig=a===b, nota='';
 if(!ig){const d=explicarRecorte(a,b,6000); if(d.ok){ig=true;nota=' · delta esperado: '+d.motivo;} else nota=' · '+d.motivo.slice(0,140);}
 if(!ig&&process.env.BH10_DIAG){
   const ia=a.indexOf('Marca comercial'), ib=b.indexOf('Marca comercial');
   console.log('  [d] «Marca comercial» está en producción:',ia>=0,'· en la entrega:',ib>=0);
   console.log('  [d] largo A/B:',a.length,'/',b.length);
   console.log('  [d] cola de la entrega:',JSON.stringify(b.slice(-160)));
   console.log('  [d] cola de producción:',JSON.stringify(a.slice(-160)));}
 // El campo «Última factura emitida» de Ajustes (v342, autorizado) aparece
 // también en esta foto. Se exige que la diferencia sea EXACTAMENTE esa.
 // v358: la foto final es Ajustes; su envoltorio cambió (acordeón → casillas) y se compara sin él
 if(!ig){const d=explicarDelta(normAjustesTexto(a),normAjustesTexto(b)); if(d.ok){ig=true;nota=' · delta esperado: '+d.motivo;} else nota=' · '+d.motivo.slice(0,140);}
 ok(ig,'pantalla final idéntica a producción ('+B.fotoSeg.length+' chars)'+nota);}
// el CONJUNTO de claves tocadas debe ser el mismo en los dos bundles
const kA=[...new Set(A.escrituras.map(x=>x[0]))].sort().join(', ');
const kB=[...new Set(B.escrituras.map(x=>x[0]))].sort().join(', ');
ok(kA===kB,`mismas claves tocadas en ambos · v324: [${kA}] · actual: [${kB}]`);
console.log(fallos?'═══ A/B ESCRITURAS: '+fallos+' DIFERENCIAS ═══':'═══ A/B ESCRITURAS: TODO IDÉNTICO ═══');
process.exit(fallos?1:0);
