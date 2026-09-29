// ═══ A/B DE ESCRITURAS · PRODUCCIÓN (ref_produccion/) vs ESTA ENTREGA (mismos datos, reloj y azar congelados) ═══
// Reloj y azar CONGELADOS en ambos: uid(), fechas y aleatorios salen iguales,
// así que toda escritura legítima debe ser BYTE A BYTE idéntica.
// Escenarios: 1) registrar un pago · 2) certificar contrato (emitir factura)
//             3) remesa de nóminas (C34) · 4) estado final COMPLETO de la nube
import {irA} from './_nav.mjs';
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
import fs from 'fs';
import {explicarSerie} from './_delta.mjs';
import {normNavegacionTexto} from './_delta.mjs';
const datos=JSON.parse(fs.readFileSync('/home/claude/copia/BH10_copia_completa_2026-09-06.json','utf8'));
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

  // ── S1 · PAGO ──
  click('Facturas');await E(900);
  corta('antesPago');
  click('Pagar',true);await E(600);
  click('Registrar',true);await E(900);
  corta('pago');

  // ── S2 · CERTIFICAR: probar contratos hasta que uno pase la validación
  //        (los que tienen extras «sin nada por escrito» se niegan: regla de negocio) ──
  click('Contratos');await E(900);
  corta('antesCert');
  for(let nC=0;nC<6;nC++){
    const certs=[...document.querySelectorAll('button')].filter(x=>x.textContent.includes('📋 Certificar'));
    if(!certs[nC])break;
    certs[nC].click();await E(700);
    const pct=inputPorPista('Ej: 20%');
    if(pct){pon(pct,'10');await E(300);}
    click('Generar factura',true);await E(1300);
    if(escrituras.length>cortes['antesCert'])break;      // consumado
    click('Cancelar',true);await E(400);                  // ese no pasó: siguiente
  }
  corta('cert');

  // ── S3 · REMESA DE NÓMINAS (C34) con el embargo de la plantilla ──
  click('Nóminas');await E(1000);
  corta('antesRem');
  click('💶 Remesar');await E(900);
  click('Editar importes y generar C34');await E(1000);
  click('Descargar XML SEPA');await E(1600);
  corta('remesa');
  const fotoRemesa=document.getElementById('root').textContent.replace(/\s+/g,' ').slice(0,6000);

  // ── S4 · FICHA DE PROVEEDOR: editar y guardar ──
  click('Facturas');await E(600);click('🏪 Proveedores');await E(900);
  corta('antesFicha');
  click('✏️');await E(600);
  const iban=[...document.querySelectorAll('input')].find(i=>/IBAN|ES\d/i.test((i.placeholder||'')+(i.value||'')));
  if(iban){pon(iban,'ES9121000418450200051332');await E(250);}
  for(const t of ['Guardar','💾']){if(click(t)){await E(800);break;}}
  corta('ficha');

  // ── S5 · C34 DE PROVEEDORES: abrir el modal con la selección real ──
  click('Facturas');await E(700);
  click('Pendiente');await E(900);
  corta('antesC34');
  click('☑ Todas');await E(500);
  click('Generar');await E(900);
  const fotoC34=normNavegacionTexto(document.getElementById('root').textContent.replace(/\s+/g,' ')).slice(-4500);
  click('Descargar XML SEPA');await E(1200);   // si falta algún IBAN estará inhabilitado: la foto manda
  corta('c34');
  click('Cancelar');await E(300);

  // ── S6 · FORMULARIO DE FACTURA (el modal gigante, recién mudado) ──
  click('Facturas');await E(500);click('Pendiente');await E(700);   // v364: Facturas aterriza en Recibidas; el formulario se abre sobre Pendiente como en la foto de producción
  const mas=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='+');
  if(mas){mas.click();await E(400);}
  click('📥 Factura recibida');await E(900);
  const fotoForm=normNavegacionTexto(document.getElementById('root').textContent.replace(/\s+/g,' ')).slice(-5000);
  click('Cancelar');await E(300);

  console.error=oe;
  // resolver los textos de las descargas
  const bajadas=[];
  for(const d of descargas){
    const b=blobs.get(d.url);
    bajadas.push({nombre:d.nombre,texto:b?await b.text():'(?)'});
  }
  root.unmount();await E(80);
  return {escrituras,cortes,bajadas,fotoRemesa,fotoC34,fotoForm,nubeFinal:nube};
}

const REF=fs.readdirSync('ref_produccion').find(f=>/^bh10-APPV\d+\.js$/.test(f));
if(!REF)throw new Error('ref_produccion/ no tiene ningún bh10-APPV*.js — ver su LEEME.txt');
const A=await ejecutar(process.argv[2]||('../ref_produccion/'+REF));
const B=await ejecutar(process.argv[3]||'../web_subir/app/assets/bh10-APPV393.js');
let fallos=0;const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};
// v359 · el diario permanente (bh10-diario) es una escritura nueva y autorizada: se aparta del byte a byte
const tramo=(r,d,h)=>r.escrituras.slice(r.cortes[d],r.cortes[h]).filter(([k])=>k!=='bh10-diario').map(([k,v])=>k+'='+v).join('\u0001');
for(const [nom,d,h,min] of [['S1 pago','antesPago','pago',1],['S2 certificación','antesCert','cert',1],['S3 remesa nóminas','antesRem','remesa',0],['S4 ficha proveedor','antesFicha','ficha',1],['S5 C34 proveedores','antesC34','c34',0]]){
  const ta=tramo(A,d,h),tb=tramo(B,d,h);
  const na=A.escrituras.slice(A.cortes[d],A.cortes[h]).map(x=>x[0]).filter(k=>k!=='bh10-diario');
  let _ig=ta===tb, _nota='';
  if(!_ig){const d=explicarSerie(ta,tb); if(d.ok){_ig=true;_nota=' · delta esperado: '+d.motivo;} else _nota=' · '+d.motivo.slice(0,150);}
  ok(_ig&&na.length>=min,`${nom}: escrituras idénticas Y consumadas (${na.length}: ${[...new Set(na)].join(', ')||'⚠ NINGUNA'})${_nota}`);
  if(ta!==tb){let i=0;while(i<Math.min(ta.length,tb.length)&&ta[i]===tb[i])i++;
    console.log('     v313: …'+ta.slice(Math.max(0,i-50),i+70));
    console.log('     v314: …'+tb.slice(Math.max(0,i-50),i+70));}
}
ok(JSON.stringify(A.bajadas)===JSON.stringify(B.bajadas),
   `descargas idénticas (${A.bajadas.length}: ${A.bajadas.map(x=>x.nombre).join(', ')||'ninguna'})`);
// estado final de TODA la nube: fichas de clientes, proveedores, contratos… nada corrupto
const claves=[...new Set([...Object.keys(A.nubeFinal),...Object.keys(B.nubeFinal)])].filter(k=>k!=='bh10-diario').sort();
{const dj=(()=>{try{return JSON.parse(B.nubeFinal['bh10-diario']||'[]');}catch(e){return null;}})();ok(Array.isArray(dj)&&dj.length>0&&dj.every(e=>e.t&&e.tipo&&e.origen),`diario permanente escrito (${dj?dj.length:'—'} apuntes con cuándo/qué/origen) · nuevo en v359`);}
let distintas=0;
for(const k of claves){
  if(A.nubeFinal[k]!==B.nubeFinal[k]){
    const d=explicarSerie(A.nubeFinal[k],B.nubeFinal[k]);
    if(d.ok){console.log('  ✓ clave final',k,'· delta esperado:',d.motivo);}
    else{distintas++;console.log('  ✗ clave final difiere:',k,'·',d.motivo.slice(0,150));}
  }
}
ok(distintas===0,`estado final completo de la nube idéntico (${claves.length} claves: fichas, contratos, embargos, todo)`);
// embargo: la remesa debe llevar a RINCON, y su embargo o girarse o avisarse
const xml=(B.bajadas.find(x=>/xml|c34/i.test(x.nombre))||{}).texto||'';
ok(xml.length>0,'la remesa generó un XML C34 ('+xml.length+' bytes)');
const normV=t=>String(t).replace(/v3\d+/g,'vXXX');
{const a=normV(A.fotoForm), b=normV(B.fotoForm);
 let ig=a===b, nota='';
 if(!ig){const d=explicarSerie(a,b); if(d.ok){ig=true;nota=' · delta esperado: '+d.motivo;} else nota=' · '+d.motivo.slice(0,140);}
 ok(ig&&B.fotoForm.length>800,'formulario de factura idéntico carácter a carácter ('+B.fotoForm.length+' chars)'+nota);}
{const a=normV(A.fotoC34), b=normV(B.fotoC34);
 let ig=a===b, nota='';
 if(!ig){const d=explicarSerie(a,b); if(d.ok){ig=true;nota=' · delta esperado: '+d.motivo;} else nota=' · '+d.motivo.slice(0,140);}
 ok(ig&&B.fotoC34.length>800,'modal C34 de proveedores idéntico carácter a carácter ('+B.fotoC34.length+' chars)'+nota);}
if(xml){
  ok(xml.includes('RINCON')||xml.includes('Rincon'),'la nómina de RINCON va dentro del XML');
  const emb=xml.match(/EJECUCION|EMBARGO|embargo/i);
  const aviso=/embargo/i.test(B.fotoRemesa);
  console.log('  · embargo en XML:',emb?'SÍ (transferencia girada)':'no','· aviso en pantalla:',aviso?'SÍ':'no');
}
console.log('  · pantalla de remesa (v314):',B.fotoRemesa.slice(0,300));
console.log(fallos?'═══ A/B ESCRITURAS: '+fallos+' DIFERENCIAS ═══':'═══ A/B ESCRITURAS: TODO IDÉNTICO ═══');
process.exit(fallos?1:0);
