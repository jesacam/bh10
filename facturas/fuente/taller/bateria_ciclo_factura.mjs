// ═══ ACEPTACIÓN DE NEGOCIO · ciclo completo de una factura ════════════════
// Lo que se prueba, en el orden que pidió Jesús:
//   1. alta de factura vinculada a obra con presupuesto  → ¿entra en el KPI?
//   2. pago por SEPA con fecha posterior                 → ¿la da por pagada?
//   3. KPI de pendiente                                  → ¿baja?
//   4. presupuesto de la obra                            → ¿lo consume?
//   5. anular el pago                                    → ¿vuelve a pendiente?
//   6. anular la factura                                 → ¿libera presupuesto?
//   7. lo mismo con una recibida SIN contrato, marcada como extra
//
// MONTAJE: la copia real no trae ninguna obra dada de alta (bh10-obras está
// vacío) y sin obra el presupuesto no puede consumirse. Se siembra UNA obra
// con presupuesto de gasto. Es lo único que se añade.
import {irA} from './_nav.mjs';
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
import fs from 'fs';

const datos=JSON.parse(fs.readFileSync('/home/claude/copia/BH10_copia_completa_2026-09-06.json','utf8'));
const FIJO=new Date('2026-08-24T11:00:00Z').getTime();
const OBRA='OBRA PRUEBA PPTO';
const PPTO=50000, IMPORTE=10000;

const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://bh10group.com/app/',pretendToBeVisual:true});
for(const k of ['window','document','navigator','localStorage','sessionStorage','HTMLElement','Node','Event','CustomEvent','Blob','File','URL','atob','btoa','FileReader','getComputedStyle','crypto'])
  {try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
globalThis.window=dom.window;
const DR=Date;globalThis.Date=dom.window.Date=class extends DR{constructor(...a){a.length?super(...a):super(FIJO);}static now(){return FIJO;}};
let sm=20260824;Math.random=dom.window.Math.random=()=>{sm=(sm*1664525+1013904223)>>>0;return sm/4294967296;};
window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
window.requestAnimationFrame=cb=>setTimeout(cb,0);globalThis.requestAnimationFrame=window.requestAnimationFrame;
window.cancelAnimationFrame=()=>{};globalThis.cancelAnimationFrame=()=>{};
class RO{observe(){}unobserve(){}disconnect(){}}window.ResizeObserver=RO;globalThis.ResizeObserver=RO;
window.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};window.scrollTo=()=>{};
window.confirm=()=>true;window.prompt=()=>'PRUEBA';window.alert=()=>{};
window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
window.BH10_EMPRESA={sub:'',nombre:'BIG HOUSE 2010'};window.BH10_ROL='admin';window.BH10_PERMISOS=null;
const nube={};for(const k of Object.keys(datos.claves))nube[k]=datos.claves[k];
nube['bh10-ultimacopia']='2026-08-24T09:00:00.000Z';
const contrato=JSON.parse(nube['bh10-contratos'])[1];   // P-2026/002, presupuesto aceptado
nube['bh10-obras']=JSON.stringify([{id:'obra-prueba',alias:OBRA,calle:'',numero:'',cp:'',municipio:'',
  provincia:'',activa:true,presupuestoGasto:PPTO,presupuestoVenta:0}]);
const descargas=[];
window.storage={get:async k=>nube[k]!==undefined?{key:k,value:nube[k]}:null,
  set:async(k,v)=>{nube[k]=String(v);return{key:k,value:v}},
  delete:async k=>{delete nube[k];return{key:k}},
  list:async p=>({keys:Object.keys(nube).filter(k=>!p||k.startsWith(p))}),
  getStatus:()=>({fase:'ok',error:'',ultimaEscritura:FIJO,errorEscritura:'',pendientes:0,conflicto:null})};
const crearOrig=dom.window.document.createElement.bind(dom.window.document);
dom.window.document.createElement=(t,...r)=>{const el=crearOrig(t,...r);
  if(String(t).toLowerCase()==='a'){const c=el.click.bind(el);el.click=()=>{descargas.push(el.getAttribute('download')||'');return c();};}
  return el;};
window.URL.createObjectURL=()=>'blob:x';window.URL.revokeObjectURL=()=>{};

const oe=console.error;console.error=()=>{};
const {default:App}=await import('../web_subir/app/assets/bh10-APPV393.js');
createRoot(document.getElementById('root')).render(React.createElement(App));
const E=ms=>new Promise(x=>setTimeout(x,ms));
for(let i=0;i<320;i++){await E(25);if(document.getElementById('root').textContent.includes('Pendiente de pago'))break;}
await E(1000);

let fallos=0;
const ok=(c,m)=>{oe((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};
const info=m=>oe('    · '+m);
const click=t=>{if(irA(document,t))return true;const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes(t));if(b){b.click();return true;}return false;};
const pon=(el,v)=>{const k=Object.keys(el).find(x=>x.startsWith('__reactProps'));
  if(k&&el[k].onChange)el[k].onChange({target:{value:String(v)},stopPropagation(){},preventDefault(){},currentTarget:{value:String(v)}});};
// Algunos onChange llaman a stopPropagation/preventDefault: el evento
// sintético tiene que traerlos o revienta.
const marca=(el,v=true)=>{const k=Object.keys(el).find(x=>x.startsWith('__reactProps'));
  if(k&&el[k].onChange)el[k].onChange({target:{checked:v,value:v?'on':''},stopPropagation(){},preventDefault(){},currentTarget:{checked:v}});};
const facturas=()=>JSON.parse(nube['bh10-fc-v3']||'[]');
const mia=(num)=>facturas().find(i=>String(i.numFactura)===num);
// KPI de pendiente de pago, leído de la PANTALLA del panel
const kpi=async()=>{click('Panel');await E(900);
  // Se lee del NODO de la tarjeta, no del textContent de la página: ahí el
  // contador de obras queda pegado al importe («…Obras144359,3 k €…»).
  const et=[...document.querySelectorAll('div,span')].find(e=>e.textContent.trim()==='Pendiente de pago');
  const card=et&&et.parentElement?et.parentElement:null;
  const txt=card?card.textContent.replace('Pendiente de pago','').trim():'';
  if(process.env.BH10_DIAG)console.log('  [d] tarjeta:',JSON.stringify(txt));
  let m=txt.match(/([\d][\d.]*,\d+)\s*k\s*€/);
  if(m)return parseFloat(m[1].replace(/\./g,'').replace(',','.'))*1000;
  m=txt.match(/([\d][\d.]*,\d\d)\s*€/);
  return m?parseFloat(m[1].replace(/\./g,'').replace(',','.')):null;};
// gasto imputado a la obra sembrada, según los datos
const gastoObra=()=>facturas().filter(i=>i.obra===OBRA&&!i.anulada&&i.tipo!=='emitida'&&i.tipo!=='cobro')
  .reduce((s,i)=>s+(+i.total||0),0);

const alta=async(num,conObra,extra)=>{
  click('Facturas');await E(600);click('Recibidas');await E(700);
  const fab=[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='+').pop();
  if(fab){fab.click();await E(700);}
  click('📥 Factura recibida');await E(1600);
  const ins=[...document.querySelectorAll('input')].filter(i=>['text','number','date'].includes(i.type));
  const ph=(p)=>ins.find(i=>(i.placeholder||'').includes(p));
  const eNum=ph('F-2026/001'), eProv=ph('Nombre del proveedor'), eDesc=ph('Descripción del material'), eObra=ph('C/ Ejemplo 5, Illescas');
  if(eProv){pon(eProv,'PROVEEDOR CICLO');await E(400);}
  if(eNum){pon(eNum,num);await E(350);}
  if(eDesc){pon(eDesc,'CONCEPTO CICLO');await E(350);}
  if(conObra&&eObra){pon(eObra,OBRA);await E(400);}
  // IBAN OBLIGATORIO: «Descargar XML SEPA» lleva disabled={missingIBAN.length>0}.
  // Un proveedor nuevo sin cuenta deja el botón muerto — y está bien que así sea.
  const eIban=ph('ES00 0000 0000 00 0000000000')||ph('ES00 0000 0000 0000');
  if(eIban){pon(eIban,'ES9121000418450200051332');await E(500);}
  const sinPh=[...document.querySelectorAll('input')].filter(i=>i.type==='text'&&!(i.placeholder||'').trim());
  if(sinPh.length){pon(sinPh[0],String(IMPORTE));await E(500);}
  let extraMarcado=false;
  if(extra){
    // La casilla de «extra» es la de form.extraPend. Se busca por su ETIQUETA,
    // no por posición: la última casilla del modal es «_marcarPagada» (pagar al
    // registrar) y marcarla hacía nacer la factura ya pagada — por eso no
    // entraba en pendientes. Si no aparece, NO se marca nada.
    const et=[...document.querySelectorAll('label')].filter(l=>/extra/i.test(l.textContent)&&!/base\s*\d/i.test(l.textContent));
    const cb=et.map(l=>l.querySelector('input[type=checkbox]')).find(Boolean);
    if(cb){marca(cb,true);extraMarcado=true;await E(500);}
  }
  const reg=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Registrar');
  if(reg){reg.click();await E(1800);}
  return {puesto:!!(eNum&&eProv&&eDesc&&reg),obraPuesta:!!(conObra&&eObra),extraMarcado};
};

const ciclo=async(etiqueta,num,conObra,extra)=>{
  oe('');oe('══ '+etiqueta+' ══');
  const k0=await kpi(); const g0=gastoObra();
  info(`KPI pendiente de partida: ${k0} € · gasto en la obra: ${g0} €`);
  const a=await alta(num,conObra,extra);
  ok(a.puesto,'1 · el formulario de alta se rellena y registra');
  if(extra)ok(a.extraMarcado,'   la casilla «extra» (form.extraPend) se marcó por su etiqueta');
  const f=mia(num);
  ok(!!f,`   la factura ${num} existe en el almacén`+(f?` (total ${f.total} €)`:''));
  if(!f)return;
  const k1=await kpi();
  ok(k1!==null&&Math.abs(k1-(k0+f.total))<120,`2 · el KPI de pendiente SUBE: ${k0} → ${k1} € (esperado ~${(k0+f.total).toFixed(0)}; la tarjeta redondea a miles)`);
  if(conObra){const g1=gastoObra();
    ok(Math.abs(g1-(g0+f.total))<0.02,`3 · CONSUME presupuesto de la obra: ${g0} → ${g1} de ${PPTO} €`);}
  else info('3 · sin obra: no debe consumir presupuesto · gasto en obra sigue en '+gastoObra()+' €');
  return {f,k0,k1};
};

// ── PASOS 4 a 6: pago por SEPA, anular pago, anular factura ──
const buscarSolo=async(num)=>{
  click('Facturas');await E(600);click('Recibidas');await E(800);
  const caja=[...document.querySelectorAll('input')].find(i=>i.type==='text'&&/[Bb]uscar|proveedor, n|concepto/.test((i.placeholder||'')));
  if(caja){pon(caja,num);await E(1100);}
  return !!caja;
};
const pagarSepa=async(num,fecha)=>{
  // El SEPA vive en subView==='recibidas' (L5433) dentro del CAJÓN que abre
  // «⚙️ Acciones» (L5490-5546): allí están «☑ Todas (N)» y, en cuanto
  // selected.size>0, el botón que abre la ventana con subtotales.
  click('Facturas');await E(700);
  click('📥 Recibidas');await E(1000);
  click('⚙️ Acciones');await E(1100);
  const cbs=[...document.querySelectorAll('input')].filter(i=>i.type==='checkbox');
  let elegida=null;
  for(const cb of cbs){let a=cb,k=0;
    while(a&&k<8){ if(a.textContent&&a.textContent.includes(num)){elegida=cb;break;} a=a.parentElement;k++; }
    if(elegida)break;}
  if(elegida){marca(elegida,true);await E(1000);}
  if(process.env.BH10_DIAG)console.log('  [d] cajón Acciones · casillas:',cbs.length,'· fila:',!!elegida,
    '· botones:',[...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(t=>t&&t.length<26).slice(5,24).join(' | '));
  // En el cajón, la tarjeta «📄 Fichero SEPA (C34)» trae «☑ Todas (N)» y
  // «Generar». El botón es literalmente «Generar»: buscar por /SEPA|remesa/
  // cazaba «🏦 Remesas» y abría otra ventana sin casilla de pagadas.
  const bSepa=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Generar');
  if(bSepa){bSepa.click();await E(1600);}
  const fech=[...document.querySelectorAll('input')].filter(i=>i.type==='date');
  if(fech.length){pon(fech[fech.length-1],fecha);await E(700);}
  // v389 · la casilla «Marcar como pagadas» se RETIRÓ en la v382: ahora la
  // remesa apunta los pagos siempre y la ventana lo AVISA. La prueba sigue el
  // cambio: exige el aviso y que la casilla ya no esté.
  const cbp=[...document.querySelectorAll('label')].filter(l=>/pagad/i.test(l.textContent))
    .map(l=>l.querySelector('input[type=checkbox]')).filter(Boolean);
  const casilla=document.body.textContent.includes('Se darán por pagadas al generar')&&cbp.length===0;
  if(process.env.BH10_DIAG)console.log('  [d] ventana SEPA · casilla pagadas:',casilla,
    '· botones:',[...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(t=>t&&t.length<26).slice(-12).join(' | '));
  // En la ventana «Generar fichero SEPA C34.14» el botón es «Descargar XML SEPA».
  const desc=[...document.querySelectorAll('button')].find(b=>/Descargar XML SEPA/i.test(b.textContent));
  if(process.env.BH10_DIAG&&desc)console.log('  [d] botón descargar · disabled:',desc.disabled);
  if(desc){desc.click();await E(2500);}
  if(process.env.BH10_DIAG){const t=document.body.textContent;
    const m=t.match(/(⛔[^•]{10,140}|Faltan datos[^•]{0,120}|rechazaría[^•]{0,120})/);
    console.log('  [d] tras descargar →',m?m[1].slice(0,150):'(sin aviso de error visible)');}
  const cerrar=[...document.querySelectorAll('button')].reverse().find(x=>x.textContent.trim()==='✕');
  if(cerrar){cerrar.click();await E(600);}
  return {hubo:!!desc,desactivado:!!(desc&&desc.disabled),seleccion:!!elegida,casilla,sepa:bSepa?bSepa.textContent.trim():null};
};
const cicloPago=async(etiqueta,num,conObra,base)=>{
  oe('');oe('── '+etiqueta+' ──');
  const FECHA='2026-09-15';
  const kAntes=await kpi();
  const r=await pagarSepa(num,FECHA);
  ok(r.seleccion,'4a · se selecciona la factura en la lista');
  ok(!!r.sepa,'4b · el menú Acciones ofrece Generar SEPA'+(r.sepa?` («${r.sepa}»)`:''));
  ok(r.casilla,'4c · la ventana avisa «Se darán por pagadas al generar» y la casilla vieja ya no está (v382)');
  ok(r.hubo&&!r.desactivado,'4d · se pulsa «Descargar XML SEPA»'+(r.desactivado?' → ESTABA DESACTIVADO (falta IBAN)':''));
  ok(descargas.length>0,`   se descarga el fichero SEPA (${descargas.length}: ${descargas.slice(-1)[0]||'?'})`);
  const f1=mia(num);
  ok(!!f1&&(f1.pagos||[]).length>0,`5 · la descarga la DA POR PAGADA (pagos: ${f1?(f1.pagos||[]).length:0})`);
  if(f1&&(f1.pagos||[]).length)info(`   fecha del pago: ${f1.pagos[0].fecha} · importe ${f1.pagos[0].importe}`);
  const kPag=await kpi();
  ok(kPag!==null&&kAntes!==null&&kPag<kAntes,`6 · el KPI de pendiente BAJA: ${kAntes} → ${kPag} €`);
  if(conObra)ok(Math.abs(gastoObra()-base)<0.02,`7 · el presupuesto consumido NO cambia al pagar: ${gastoObra()} €`);
  return {kAntes,kPag,f1};
};

// ── PASOS 8 y 9: anular el pago y anular la factura ──
const abrirFila=async(num)=>{
  click('Facturas');await E(600);click('📥 Recibidas');await E(900);
  const filas=[...document.querySelectorAll('div')].filter(d=>{
    const k=Object.keys(d).find(x=>x.startsWith('__reactProps'));
    return k&&d[k]&&typeof d[k].onClick==='function'&&d.textContent.includes(num)&&d.textContent.length<400;});
  if(filas.length){const d=filas[filas.length-1],k=Object.keys(d).find(x=>x.startsWith('__reactProps'));
    d[k].onClick({preventDefault(){},stopPropagation(){},target:d});await E(1100);return true;}
  return false;
};
const anularPago=async(num)=>{
  const abre=await abrirFila(num);
  // La ✕ del pago llama a deletePago(inv.id,p.id) (L5209) y hace stopPropagation.
  const equis=[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='✕');
  let hecho=false;
  for(const b of equis){let a=b,k=0;
    while(a&&k<6){ if(a.textContent&&/Transferencia SEPA/i.test(a.textContent)){b.click();hecho=true;break;} a=a.parentElement;k++; }
    if(hecho)break;}
  await E(1200);
  if(process.env.BH10_DIAG)console.log('  [d] fila abierta:',abre,'· ✕ encontradas:',equis.length,'· pago borrado:',hecho);
  return {abre,hecho};
};
const anularFactura=async(num)=>{
  await abrirFila(num);
  const bAnu=[...document.querySelectorAll('button')].find(b=>/Anular/i.test(b.textContent));
  if(process.env.BH10_DIAG)console.log('  [d] botón anular:',bAnu?JSON.stringify(bAnu.textContent.trim()):'(no hay)');
  if(bAnu){bAnu.click();await E(900);bAnu.click();await E(2000);}
  return {hubo:!!bAnu};
};
// v389 · desde la v378, anular (pago o factura) abre una ventana de
// confirmación en la capa ACCIÓN. La batería la confirmaba con el aire: ahora
// pulsa el botón de confirmar de verdad.
const confirmarSiSale=async()=>{
  for(let k=0;k<3;k++){
    const b=[...document.querySelectorAll('button')].find(x=>/^(Sí, |Anular|Confirmar|Eliminar|Quitar el pago)/.test(x.textContent.trim())&&x.closest('[style*="z-index"]'));
    if(!b)return k>0;
    b.click();await E(900);
  }
  return true;
};
const cicloAnular=async(etiqueta,num,conObra)=>{
  oe('');oe('── '+etiqueta+' ──');
  const kPagada=await kpi();
  const r=await anularPago(num);
   await confirmarSiSale();
  ok(r.hecho,'8 · se anula el pago desde el detalle de la factura');
  const f=mia(num);
  ok(!!f&&(f.pagos||[]).length===0,`   la factura se queda SIN pagos (${f?(f.pagos||[]).length:'?'})`);
  const kVuelta=await kpi();
  ok(kVuelta!==null&&kPagada!==null&&kVuelta>kPagada,`   VUELVE A PENDIENTE en el KPI: ${kPagada} → ${kVuelta} €`);
  const gAntes=gastoObra();
  const a=await anularFactura(num);
   await confirmarSiSale();
  ok(a.hubo,'9 · se pulsa Anular en la factura');
  const f2=mia(num);
  ok(!!f2&&!!f2.anulada,`   la factura queda ANULADA (${f2?!!f2.anulada:'?'})`);
  const kFin=await kpi();
  ok(kFin!==null&&kVuelta!==null&&kFin<kVuelta,`   sale del KPI de pendiente: ${kVuelta} → ${kFin} €`);
  if(conObra)ok(Math.abs(gastoObra()-(gAntes-12100))<0.02,
    `10 · LIBERA el presupuesto de la obra: ${gAntes} → ${gastoObra()} €`);
};

const r1=await ciclo('CIRCUITO A · factura vinculada a obra con presupuesto aceptado','CICLO-A-001',true,false);
const p1=await cicloPago('CIRCUITO A · pago por SEPA con fecha posterior','CICLO-A-001',true,12100);
const r2=await ciclo('CIRCUITO B · recibida SIN contrato, marcada como extra','CICLO-B-001',false,true);

const p2=await cicloPago('CIRCUITO B · pago por SEPA de la extra','CICLO-B-001',false,0);
await cicloAnular('CIRCUITO A · anular pago y anular factura','CICLO-A-001',true);
await cicloAnular('CIRCUITO B · anular pago y anular la extra','CICLO-B-001',false);
oe('');oe('── estado de las dos facturas creadas ──');
for(const n of ['CICLO-A-001','CICLO-B-001']){const f=mia(n);
  if(f)oe(`    ${n}: total ${f.total} · obra ${JSON.stringify(f.obra||'')} · esExtra ${JSON.stringify(f.esExtra)} · pagos ${(f.pagos||[]).length} · anulada ${!!f.anulada} · tipo ${f.tipo}`);}
console.error=oe;
oe('');
console.log(fallos?`═══ ACEPTACIÓN: ${fallos} FALLOS ═══`:'═══ ACEPTACIÓN: CICLO VERIFICADO ═══');
process.exit(fallos?1:0);
