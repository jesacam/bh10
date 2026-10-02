// ═══ FACTURAS · CATÁLOGOS, FUSIÓN Y ALTA · producción vs actual ═══════════
// Tres circuitos del almacén de facturas (sesión 7) que NINGUNA batería tocaba:
//
//  F1 · guardar la ficha de un proveedor  → persistProvCat, recién mudada
//  F2 · fusionar dos proveedores duplicados → fusOrigen/fusDestino/fusManual
//       y persistCliCat. Es la operación de más riesgo del dominio: reasigna
//       facturas de un proveedor a otro.
//  F3 · dar de alta una factura de punta a punta → escribe el listado y, si
//       VERI*FACTU está activo, encadena un registro ante la AEAT: es la
//       interacción real entre el almacén de facturas y el de veri*factu.
//
// Reloj y azar congelados; se compara byte a byte contra el bundle desplegado.
import {normNavegacionTexto} from './_delta.mjs';
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
import fs from 'fs';
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
  const click=(t,exacto)=>{const b=[...document.querySelectorAll('button')].find(x=>exacto?x.textContent.trim()===t:x.textContent.includes(t));if(b)b.click();return !!b;};
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

  // ── F1 · FICHA DE PROVEEDOR (persistProvCat) ──
  // OJO: los botones de la lista de proveedores NO llevan texto, sólo el icono.
  click('Facturas');await E(800);
  click('Proveedores');await E(1200);
  corta('antesProv');
  const lapis=[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='✏️');
  if(lapis.length){lapis[0].click();await E(1200);}
  const insP=[...document.querySelectorAll('input')];
  const dirP=insP.find(i=>/[Dd]irecci|Calle|domicilio/.test((i.placeholder||'')+(i.getAttribute('aria-label')||'')));
  if(dirP){pon(dirP,'CALLE DE PRUEBA 1');await E(400);}
  else if(insP.length>1){pon(insP[1],'CALLE DE PRUEBA 1');await E(400);}
  for(const t of ['💾 Guardar','Guardar']){if(click(t)){await E(1200);break;}}
  corta('fichaProv');

  // ── F2 · DOS FACTURAS A DOS PROVEEDORES DISTINTOS, Y FUSIÓN ──
  // El alta cuelga del botón flotante «+» (no de «Acciones»), que despliega
  // «📥 Factura recibida». La fusión vive tras el «🔗» de la lista de
  // proveedores; con estos datos no hay duplicados detectados, así que se usa
  // la fusión manual, que es el camino que de verdad reasigna facturas.
  const altaFactura=async(prov,num,base)=>{
    click('Facturas');await E(600);click('Recibidas');await E(700);
    const fab=[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='+').pop();
    if(fab){fab.click();await E(700);}
    click('📥 Factura recibida');await E(1600);
    // Campos REALES del modal, leídos del fuente (no adivinados):
    //   «F-2026/001» = nº · «Nombre del proveedor» · «Descripción…» = concepto
    // y la línea lleva su precio en un input sin placeholder. El botón es
    // «Registrar», no «Guardar».
    const ins=[...document.querySelectorAll('input')].filter(i=>['text','number','date'].includes(i.type));
    const porPh=(ph)=>ins.find(i=>(i.placeholder||'').includes(ph));
    const eNum=porPh('F-2026/001'), eProv=porPh('Nombre del proveedor'), eDesc=porPh('Descripción del material');
    if(eProv){pon(eProv,prov);await E(500);}
    if(eNum){pon(eNum,num);await E(400);}
    if(eDesc){pon(eDesc,'CONCEPTO DE PRUEBA');await E(400);}
    const sinPh=[...document.querySelectorAll('input')].filter(i=>i.type==='text'&&!(i.placeholder||'').trim());
    if(sinPh.length){pon(sinPh[0],base);await E(500);}
    const reg=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Registrar');
    if(reg){reg.click();await E(1800);}
    return {prov,puesto:!!(eProv&&eNum&&eDesc&&reg)};
  };
  corta('antesAltas');
  const a1=await altaFactura('PROVEEDOR PRUEBA UNO','TEST-A-001','1000');
  const a2=await altaFactura('PROVEEDOR PRUEBA DOS','TEST-B-001','2000');
  corta('altas');

  corta('antesFusion');
  click('Facturas');await E(600);click('Proveedores');await E(1100);
  const bFus=[...document.querySelectorAll('button')].find(b=>/^🔗/.test(b.textContent.trim()));
  if(bFus){bFus.click();await E(1200);}
  click('Fusionar dos proveedores a mano');await E(1000);
  if(process.env.BH10_DIAG){
    console.log('  [d] hay panel fusión:',/Fusionar proveedores duplicados/.test(document.getElementById('root').textContent));
    console.log('  [d] selects>2:',[...document.querySelectorAll('select')].filter(x=>x.options.length>2).length);
    console.log('  [d] botones:',[...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(t=>t&&t.length<34).slice(0,14).join(' | '));
    const sel=[...document.querySelectorAll('select')].filter(x=>x.options.length>2)[0];
    if(sel)console.log('  [d] opciones con PRUEBA:',[...sel.options].map(o=>o.value).filter(v=>/PRUEBA/.test(v)).join(' , ')||'(ninguna)');
  }
  const selsF=[...document.querySelectorAll('select')].filter(sl=>sl.options.length>2);
  let elegidos=[];
  if(selsF.length>=2){
    const opsO=[...selsF[0].options].map(o=>o.value).filter(v=>/PRUEBA UNO/.test(v));
    const kO=Object.keys(selsF[0]).find(x=>x.startsWith('__reactProps'));
    if(opsO.length&&kO){selsF[0][kO].onChange({target:{value:opsO[0]}});elegidos.push(opsO[0]);await E(500);}
    const sels2=[...document.querySelectorAll('select')].filter(sl=>sl.options.length>2);
    const dest=sels2[1]||selsF[1];
    const opsD=[...dest.options].map(o=>o.value).filter(v=>/PRUEBA DOS/.test(v));
    const kD=Object.keys(dest).find(x=>x.startsWith('__reactProps'));
    if(opsD.length&&kD){dest[kD].onChange({target:{value:opsD[0]}});elegidos.push(opsD[0]);await E(500);}
  }
  // BtnConfirm: hay que pulsar dos veces (arma y confirma)
  // BtnConfirm arma y confirma: hay que pulsar DOS VECES EL MISMO ELEMENTO.
  // Volver a buscarlo entre pulsación y pulsación puede dar con otro botón.
  const bFusion=[...document.querySelectorAll('button')].find(x=>/Fusionar/.test(x.textContent)&&!/a mano|duplicados/.test(x.textContent));
  if(process.env.BH10_DIAG)console.log('  [d] botón fusión:',bFusion?JSON.stringify(bFusion.textContent.trim()):'(no hay)');
  if(bFusion){
    bFusion.click();await E(400);
    if(process.env.BH10_DIAG)console.log('  [d] tras armar:',JSON.stringify(bFusion.textContent.trim()));
    bFusion.click();await E(1500);
    if(process.env.BH10_DIAG)console.log('  [d] tras confirmar:',JSON.stringify(bFusion.textContent.trim()));
  }
  await E(1200);
  corta('fusion');
  const tras=JSON.parse(nube['bh10-fc-v3']||'[]');
  const quedaUno=tras.filter(i=>i.proveedor==='PROVEEDOR PRUEBA UNO').length;
  const quedaDos=tras.filter(i=>i.proveedor==='PROVEEDOR PRUEBA DOS').length;

  const fotoSeg=normNavegacionTexto(document.getElementById('root').textContent.replace(/\s+/g,' ')).slice(0,6000);
  console.error=oe;
  // resolver los textos de las descargas
  const bajadas=[];
  for(const d of descargas){
    const b=blobs.get(d.url);
    bajadas.push({nombre:d.nombre,texto:b?await b.text():'(?)'});
  }
  root.unmount();await E(80);
  return {escrituras,cortes,bajadas,fotoSeg,a1,a2,elegidos,quedaUno,quedaDos,nubeFinal:nube};
}

const REF=fs.readdirSync('ref_produccion').find(f=>/^bh10-APPV\d+\.js$/.test(f));
if(!REF)throw new Error('ref_produccion/ no tiene ningún bh10-APPV*.js — ver su LEEME.txt');
const A=await ejecutar(process.argv[2]||('../ref_produccion/'+REF));
const B=await ejecutar(process.argv[3]||'../web_subir/app/assets/bh10-APPV400.js');
let fallos=0;const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};
// v359 · fuera del byte a byte: el latido de sesión (bh10-sesiones, periódico: con el pre-vuelo
// en paralelo cae en un tramo u otro según la carga) y el diario permanente (bh10-diario, nuevo)
const RUIDO=new Set(['bh10-sesiones','bh10-diario']);
const tramo=(r,d,h)=>r.escrituras.slice(r.cortes[d],r.cortes[h]).filter(([k])=>!RUIDO.has(k)).map(([k,v])=>k+'='+v).join('\u0001');
for(const [nom,d,h,min] of [['F1 ficha de proveedor','antesProv','fichaProv',1],['F2 dos altas de factura','antesAltas','altas',1],['F3 fusión de los dos proveedores','antesFusion','fusion',1]]){
  const ta=tramo(A,d,h),tb=tramo(B,d,h);
  const na=A.escrituras.slice(A.cortes[d],A.cortes[h]).map(x=>x[0]).filter(k=>!RUIDO.has(k));
  ok(ta===tb&&na.length>=min,`${nom}: escrituras idénticas Y consumadas (${na.length}: ${[...new Set(na)].join(', ')||'⚠ NINGUNA'})`);
  if(ta!==tb){let i=0;while(i<Math.min(ta.length,tb.length)&&ta[i]===tb[i])i++;
    console.log('     v324: …'+ta.slice(Math.max(0,i-50),i+70));
    console.log('     v314: …'+tb.slice(Math.max(0,i-50),i+70));}
}
ok(JSON.stringify(A.bajadas)===JSON.stringify(B.bajadas),
   `descargas idénticas (${A.bajadas.length}: ${A.bajadas.map(x=>x.nombre).join(', ')||'ninguna'})`);
// estado final de TODA la nube: fichas de clientes, proveedores, contratos… nada corrupto
const claves=[...new Set([...Object.keys(A.nubeFinal),...Object.keys(B.nubeFinal)])].filter(k=>k!=='bh10-diario').sort();
let distintas=0;
for(const k of claves){
  if(A.nubeFinal[k]!==B.nubeFinal[k]){distintas++;console.log('  ✗ clave final difiere:',k);}
}
ok(distintas===0,`estado final completo de la nube idéntico (${claves.length} claves: fichas, contratos, embargos, todo)`);
// la pantalla de Seguros tras todas las escrituras: idéntica en los dos
const normV=t=>String(t).replace(/v3\d+/g,'vXXX');
console.log('  · TEXTO de la pantalla final →',JSON.stringify(B.fotoSeg));
// v364: sin la barra inferior ni las subpestañas (cambiaron); lo demás, carácter a carácter
{const a=normNavegacionTexto(normV(A.fotoSeg)),b=normNavegacionTexto(normV(B.fotoSeg));
 if(a!==b){let i=0;while(i<Math.min(a.length,b.length)&&a[i]===b[i])i++;console.log('  · difiere en',i,':',JSON.stringify(a.slice(i-40,i+60)),'vs',JSON.stringify(b.slice(i-40,i+60)));}
 ok(a===b,'pantalla final idéntica a producción ('+B.fotoSeg.length+' chars, sin barras de navegación)');}
// el CONJUNTO de claves tocadas debe ser el mismo en los dos bundles
const kA=[...new Set(A.escrituras.map(x=>x[0]))].filter(k=>!RUIDO.has(k)).sort().join(', ');
const kB=[...new Set(B.escrituras.map(x=>x[0]))].filter(k=>!RUIDO.has(k)).sort().join(', ');
ok(kA===kB,`mismas claves tocadas en ambos · v324: [${kA}] · actual: [${kB}]`);
// F2 y F3 se comparan (las escrituras y la nube final entran en las
// comprobaciones de arriba) pero NO se dan por cubiertos: el guion todavía no
// alcanza el panel de fusión de duplicados ni el alta de factura. El «🔗» de
// la lista abre el aviso de IBAN, no la fusión, y «⚙️ Acciones» no despliega
// ningún alta. Se deja dicho en vez de fingir que pasan.
ok(B.a1.puesto&&B.a2.puesto,'los dos formularios de alta se rellenaron enteros');
ok(A.quedaUno===B.quedaUno&&A.quedaDos===B.quedaDos,
   `tras fusionar: «PRUEBA UNO» ${B.quedaUno} facturas · «PRUEBA DOS» ${B.quedaDos} — igual que producción`);
ok(B.quedaUno===0&&B.quedaDos===2,'LA FUSIÓN REASIGNÓ: el origen se queda a cero y el destino se lleva las dos');
console.log(fallos?'═══ A/B ESCRITURAS: '+fallos+' DIFERENCIAS ═══':'═══ A/B ESCRITURAS: TODO IDÉNTICO ═══');
process.exit(fallos?1:0);
