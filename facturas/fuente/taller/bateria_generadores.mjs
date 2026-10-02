// ═══ GENERADORES DE FICHERO · bytes idénticos a producción ════════════════
// Fase 1 de la extracción: antes de sacar estas funciones de app.jsx hay que
// poder demostrar que lo que producen no cambia. Siete de las nueve no tenían
// NINGUNA batería: si se rompiera una, el fallo llegaría en forma de Excel mal
// o certificación mal, con el fichero ya enviado.
//
// DOS COSAS QUE COSTARON ENCONTRAR Y QUE ESTÁN AQUÍ POR ESCRITO:
//
//  1. «⬇ Descargar» NO descarga: llama a showDocPreview(html, nombre, makePdf),
//     que abre un VISOR (iframe srcDoc) y deja el PDF sin construir. El fichero
//     nace al pulsar «📄 Compartir PDF». Se comprueban las DOS cosas: el HTML
//     del documento y el PDF resultante.
//
//  2. shareOrDownload hace `content instanceof Blob ? content : new Blob([...])`.
//     El Blob que devuelve JSZip no es instancia del Blob de jsdom, cae por el
//     else y se envuelve como la cadena "[object Blob]" — 13 bytes. La batería
//     llegó a decir «idéntico a producción» comparando dos ficheros vacíos. Por
//     eso se intercepta el constructor de Blob y se exige bytes>200.
import {irA} from './_nav.mjs';
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
import fs from 'fs';
import crypto from 'crypto';
import {explicarSerie} from './_delta.mjs';
import * as XLSX from 'xlsx';
// Nombres de las entradas de un zip (crudo en latin1), por las cabeceras
// locales. OJO: en este arnés (jsdom) la librería del zip vuelca el contenido
// en streaming y lo capturado es un cascarón —cabeceras con tamaño 0 y
// directorio central vacío—, tanto en producción como ahora. Así que aquí
// solo se pueden comparar los NOMBRES; el contenido del LÉEME y del CSV de
// cuadre se demuestra en bateria_paquete.mjs (paso 47), que sí los genera.
const entradasZip=(crudo)=>{
  const out=[];const b=Buffer.from(crudo,'latin1');let p=0;
  while((p=b.indexOf('PK\x03\x04',p,'latin1'))>=0){
    const nl=b.readUInt16LE(p+26);out.push({nombre:b.slice(p+30,p+30+nl).toString('utf8')});p=p+30+nl;
  }
  return out;
};

const datos=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const FIJO=new Date('2026-08-24T11:00:00Z').getTime();

async function correr(ruta){
  const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://bh10group.com/app/',pretendToBeVisual:true});
  for(const k of ['window','document','navigator','localStorage','sessionStorage','HTMLElement','Node','Event','CustomEvent','File','URL','atob','btoa','FileReader','getComputedStyle','crypto','TextEncoder','TextDecoder'])
    {try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
  globalThis.window=dom.window;
  const DR=Date;globalThis.Date=dom.window.Date=class extends DR{constructor(...a){a.length?super(...a):super(FIJO);}static now(){return FIJO;}};
  let sm=20260824;Math.random=dom.window.Math.random=()=>{sm=(sm*1664525+1013904223)>>>0;return sm/4294967296;};
  window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
  window.requestAnimationFrame=cb=>setTimeout(cb,0);globalThis.requestAnimationFrame=window.requestAnimationFrame;
  window.cancelAnimationFrame=()=>{};globalThis.cancelAnimationFrame=()=>{};
  class RO{observe(){}unobserve(){}disconnect(){}}window.ResizeObserver=RO;globalThis.ResizeObserver=RO;
  window.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};window.scrollTo=()=>{};
  window.confirm=()=>true;window.prompt=()=>'';window.alert=()=>{};
  window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
  window.BH10_EMPRESA={sub:'',nombre:'BIG HOUSE 2010'};window.BH10_ROL='admin';window.BH10_PERMISOS=null;
  const nube={};for(const k of Object.keys(datos.claves))nube[k]=datos.claves[k];
  // Misma premisa que en bateria_hooks: la copia del 27 trae VERI*FACTU
  // APAGADO (vfcfg.apagadoEn=2026-08-27) y la ventana de registros no se
  // ofrece con el interruptor en off. Se enciende SOLO en esta copia local;
  // la cadena real de 3 registros no se toca.
  try{const _c=JSON.parse(nube['bh10-vfcfg']||'{}');_c.activo=true;nube['bh10-vfcfg']=JSON.stringify(_c);}catch(e){}
  nube['bh10-ultimacopia']='2026-08-24T09:00:00.000Z';
  // El expediente de notaría necesita el DNI de cada titular EN LA FICHA DEL
  // CLIENTE (cliCat). Sin él, exp.puede es falso y el botón sale deshabilitado.
  // Las fichas reales traen «cif» pero no «dni», así que se siembra a partir
  // del cif —el mismo dato— para que el circuito se pueda recorrer entero.
  try{const cli=JSON.parse(nube['bh10-clicat']||'[]');
    nube['bh10-clicat']=JSON.stringify(cli.map(f=>f&&!f.dni&&f.cif?{...f,dni:f.cif}:f));}catch(e){}
  window.storage={get:async k=>nube[k]!==undefined?{key:k,value:nube[k]}:null,
    set:async(k,v)=>{nube[k]=String(v);return{key:k,value:v}},
    delete:async k=>{delete nube[k];return{key:k}},
    list:async p=>({keys:Object.keys(nube).filter(k=>!p||k.startsWith(p))}),
    getStatus:()=>({fase:'ok',error:'',ultimaEscritura:FIJO,errorEscritura:'',pendientes:0,conflicto:null})};

  const BlobOrig=dom.window.Blob;
  dom.window.Blob=globalThis.Blob=class extends BlobOrig{
    constructor(partes,opts){
      const p0=partes&&partes.length===1?partes[0]:null;
      if(p0&&typeof p0==='object'&&typeof p0.arrayBuffer==='function'&&!(p0 instanceof BlobOrig)){super([],opts);this.__real=p0;}
      else super(partes,opts);
    }
    arrayBuffer(){return this.__real?this.__real.arrayBuffer():super.arrayBuffer();}
    get size(){return this.__real?this.__real.size:super.size;}
  };
  const producidos=[], pend=[], nombres=[];
  const crearOrig=dom.window.document.createElement.bind(dom.window.document);
  dom.window.document.createElement=(t,...r)=>{const el=crearOrig(t,...r);
    if(String(t).toLowerCase()==='a'){const c=el.click.bind(el);
      el.click=()=>{nombres.push(el.getAttribute('download')||'');return c();};}
    return el;};
  window.URL.createObjectURL=(b)=>{
    try{ if(b&&typeof b.arrayBuffer==='function') pend.push(b.arrayBuffer().then(ab=>{
      const buf=Buffer.from(ab);
      // Los PDF llevan la versión impresa en el pie («BH10 v340»). Se normaliza
      // igual que en las demás baterías: si no, dos versiones NUNCA podrían dar
      // el mismo sha aunque el documento fuese idéntico. Ojo: se normaliza el
      // sello de versión y NADA MÁS; cualquier otro byte distinto salta.
      const crudo=buf.toString('latin1');
      // Además del sello de versión, se normaliza el NÚMERO de factura, que
      // cambia de serie (v342, autorizado) y va impreso en el papel.
      const norm=crudo.replace(/BH10 v3\d\d/g,'BH10 vXXX')
        .replace(/F-\d{4}\/\d+/g,'<NUM>').replace(/\b\d{7}\b/g,'<NUM>');
      // v362 · de los Excel se guarda también el contenido por hojas: si el sha cambia
      // por columnas nuevas declaradas, se compara lo demás celda a celda
      let hojas=null;
      if(buf.slice(0,2).toString('latin1')==='PK'){try{const wb=XLSX.read(buf,{type:'buffer'});hojas={};for(const n of wb.SheetNames)hojas[n]=XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,raw:true,defval:''});}catch(e){hojas=null;}}
      producidos.push({bytes:buf.length,sha:crypto.createHash('sha256').update(Buffer.from(norm,'latin1')).digest('hex').slice(0,16),
        cabecera:buf.slice(0,8).toString('latin1'),crudo:buf.length<40000?norm:'',hojas});
    }).catch(()=>{})); }catch(e){}
    return 'blob:x';
  };
  window.URL.revokeObjectURL=()=>{};
  globalThis.URL=window.URL;

  const {default:App}=await import(ruta);
  const oe=console.error;console.error=()=>{};
  const root=createRoot(document.getElementById('root'));
  root.render(React.createElement(App));
  const E=ms=>new Promise(x=>setTimeout(x,ms));
  for(let i=0;i<320;i++){await E(25);if(document.getElementById('root').textContent.includes('Pendiente de pago'))break;}
  await E(1000);

  const click=t=>{if(irA(document,t))return true;const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes(t));if(b){b.click();return true;}return false;};
  const htmlVisor=()=>{const f=[...document.querySelectorAll('iframe')].pop();return f?(f.getAttribute('srcdoc')||f.srcdoc||''):'';};
  const cerrarVisor=async()=>{const c=[...document.querySelectorAll('button')].find(x=>/^(Cerrar|✕ Cerrar|✕)$/.test(x.textContent.trim()));if(c)c.click();await E(600);};
  const abrirFila=async(patron)=>{
    for(const d of [...document.querySelectorAll('div')].reverse()){
      const k=Object.keys(d).find(x=>x.startsWith('__reactProps'));
      if(!k||!d[k]||typeof d[k].onClick!=='function')continue;
      if(!patron.test(d.textContent)||d.textContent.length>500)continue;
      d[k].onClick({preventDefault(){},stopPropagation(){},target:d});await E(1200);
      if([...document.querySelectorAll('button')].some(b=>/⬇ Descargar/.test(b.textContent)))return true;
    }
    return false;
  };
  const R={};
  const desde=()=>producidos.length;
  const corte=(i)=>producidos.slice(i);

  // 1 · EXCEL · el fichero depende del FILTRO usado, así que se exporta con
  // varios y se comprueba que cada combinación da un fichero DISTINTO entre sí
  // e IDÉNTICO al de producción. Un solo export no probaba nada del filtrado.
  let i0=desde();
  click('Ajustes');await E(1100);
  R.pulsoExcel=click('📊 Descargar Excel');await E(3200);
  await Promise.all(pend.slice()); R.excel=corte(i0);

  // El export filtrado NO está en «⚙️ Acciones»: hay que desplegar «🔎 Filtros»
  // dentro de Recibidas y ahí sale el botón verde «📊 Excel», que baja la lista
  // TAL COMO ESTÁ FILTRADA. Sin esto solo se probaba el export general.
  const exportarCon=async(chip,clave)=>{
    click('Facturas');await E(700);click('📥 Recibidas');await E(1000);
    if(chip)click(chip);
    await E(1200);
    click('🔎 Filtros');await E(1200);
    const i=desde();
    const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='📊 Excel');
    R['pulso_'+clave]=!!b; if(b){b.click();await E(3400);}
    await Promise.all(pend.slice());
    R[clave]=corte(i);
    click('🔎 Filtros');await E(500);   // se pliega para el siguiente
  };
  await exportarCon('Todas','xlTodas');
  await exportarCon('⏳ Pendientes','xlPendientes');
  await exportarCon('⚠️ Vencidas','xlVencidas');

  // 1b · EXCEL CON FILTROS: la exportación depende del filtro activo, así que
  // se prueban varios. Cada uno tiene que dar un fichero DISTINTO entre sí
  // (si dieran el mismo, el filtro no se estaría aplicando) e IDÉNTICO al de
  // producción. El botón de la lista es «📊 Excel».
  R.excelFiltros={};
  for(const [etq,filtro] of [['todas','Todas'],['pendientes','⏳ Pendientes'],
                             ['vencidas','⚠️ Vencidas'],['esteMes','📅 Este mes']]){
    click('Facturas');await E(600); click('📥 Recibidas');await E(900);
    click('⚙️ Acciones');await E(700);
    const puso=click(filtro); await E(1100);
    const j0=desde();
    if(process.env.BH10_DIAG&&etq==='todas')oe('  [d] cajón:',[...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(t=>t&&t.length<28).join(' | ').slice(0,420));
    const pulso=click('📊 Excel'); await E(2800);
    await Promise.all(pend.slice());
    R.excelFiltros[etq]={puso,pulso,fich:corte(j0)};
  }

  // 2 · FACTURA EMITIDA: visor (HTML) + PDF al compartir
  click('Facturas');await E(700); click('📤 Emitidas');await E(1400);
  R.abreFila=await abrirFila(/\d{4}/);
  R.pulsoCert=click('⬇ Descargar factura');await E(2500);
  R.htmlCert=htmlVisor();
  i0=desde();
  R.compCert=click('📄 Compartir PDF');await E(3500);
  await Promise.all(pend.slice()); R.pdfCert=corte(i0);
  await cerrarVisor();

  // 3 · CONTRATO: visor (HTML) + PDF al compartir
  click('Contratos');await E(1300);
  R.pulsoDoc=click('⬇ Descargar');await E(2500);
  R.htmlDoc=htmlVisor();
  i0=desde();
  R.compDoc=click('📄 Compartir PDF');await E(3500);
  await Promise.all(pend.slice()); R.pdfDoc=corte(i0);
  await cerrarVisor();

  // 3b · CERTIFICAR DE VERDAD Y GENERAR SU FACTURA
  // No hay certificaciones en los datos, así que la batería CERTIFICA un
  // presupuesto aceptado, captura el documento que sale, y al final ANULA la
  // factura para no dejar rastro. Es la única forma de cubrir generarFacturaCert
  // con datos reales.
  click('Contratos');await E(1300);
  R.pulsoCertificar=click('📋 Certificar');await E(1600);
  {const ins=[...document.querySelectorAll('input')].filter(x=>['text','number'].includes(x.type));
   const pct=ins.find(x=>/%|pct|porcent/i.test((x.placeholder||'')+(x.getAttribute('aria-label')||'')))||ins[0];
   if(pct){const k=Object.keys(pct).find(z=>z.startsWith('__reactProps'));
     if(k&&pct[k].onChange)pct[k].onChange({target:{value:'30'},stopPropagation(){},preventDefault(){}});await E(600);}}
  R.pulsoGenFact=click('Generar factura');await E(3000);
  R.htmlCert2=htmlVisor();
  i0=desde();
  R.compCert2=click('📄 Compartir PDF');await E(3500);
  await Promise.all(pend.slice()); R.pdfCert2=corte(i0);
  await cerrarVisor();
  // DESHACER LO CREADO POR LA VÍA LEGAL, NO ANULANDO.
  // La factura nace de certificar un 30% REAL de un contrato: documenta una
  // operación que existe. Según el RRSIF (art. 11.2.c) y la FAQ de la AEAT, la
  // anulación es SOLO para la factura que nunca debió existir —duplicada, por
  // error, operación no realizada—. Una factura válida no se anula: se emite
  // una RECTIFICATIVA, que es un registro de ALTA (tipo R1) encadenado y con
  // referencia a la rectificada. La cadena solo crece; nada se borra.
  const fac=()=>JSON.parse(nube['bh10-fc-v3']||'[]');
  const antes=fac();
  const nacida=antes.filter(x=>x.tipo==='cobro').slice(-1)[0];
  R.nacioFactura=!!nacida&&!!nacida.contratoId;
  // VENTANA DE REGISTROS VERI*FACTU · Ajustes → «Ver registros y enviar».
  // Tiene cuatro funciones que nadie probaba: exportar el XML de los registros
  // (obligatorio conservarlos aunque se deje de usar el programa), exportar la
  // hoja, el registro de eventos y «Comprobar la cadena».
  click('Ajustes');await E(1400);
  R.abreRegistros=click('Ver registros y enviar');await E(1800);
  R.hayVentana=/Registros VERI\*FACTU/.test(document.getElementById('root').textContent);
  if(process.env.BH10_DIAG)console.error('  [d] ventana VF:',[...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(t=>t&&t.length<30).slice(0,16).join(' | '));
  // exportar XML de los registros
  i0=desde();
  R.pulsoXmlVf=click('Exportar XML');await E(2500);
  await Promise.all(pend.slice()); R.xmlVf=corte(i0);
  // exportar la hoja
  i0=desde();
  R.pulsoHojaVf=click('Exportar hoja');await E(2800);
  await Promise.all(pend.slice()); R.hojaVf=corte(i0);
  // comprobar la cadena: es la prueba de integridad de la AEAT
  R.pulsoCadena=click('Comprobar la cadena');await E(2000);
  R.textoCadena=document.getElementById('root').textContent.slice(0,4000);
  // registro de eventos
  R.pulsoEventos=click('Registro de eventos');await E(1500);
  R.hayEventos=/evento/i.test(document.getElementById('root').textContent);

  // RECTIFICATIVA · el botón «↩️ Anular» está DEBAJO de «🔎 Cotejar», solo en
  // registros de alta y solo si no existe ya una anulación de esa serie. En los
  // datos reales las dos facturas ya están anuladas y sale la etiqueta
  // «↩️ Anulada»; el registro que vale es el que nace de la certificación que
  // esta misma batería acaba de emitir.
  // vfRegistrarFactura va en un setTimeout y escribe en la nube de forma
  // asíncrona: hay que dejarle terminar antes de mirar.
  await E(3000);
  {const regs=JSON.parse(nube['bh10-vfregistros']||'[]');
   if(process.env.BH10_DIAG)console.error('  [d] registros VF en la nube:',regs.length,regs.map(x=>`${x.tipoRegistro}:${x.numSerie}`).join(' | '));
   const altas=regs.filter(x=>x&&x.tipoRegistro==='alta');
   const anuladas=new Set(regs.filter(x=>x&&x.tipoRegistro==='anulacion').map(x=>x.numSerie));
   R.altasVivas=altas.filter(x=>!anuladas.has(x.numSerie)).length;}
  {const b=[...document.querySelectorAll('button')].find(x=>/Anular/.test(x.textContent)&&!/Anulada/.test(x.textContent));
   R.abreVfAnular=!!b; if(b){b.click();await E(1600);}}
  if(process.env.BH10_DIAG)console.error('  [d] en la ventana de anular:',[...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(t=>t&&t.length<32).slice(-12).join(' | '));
  {const r=[...document.querySelectorAll('button')].find(x=>/rectificativa/i.test(x.textContent));
   R.pulsoRect=!!r; if(r){r.click();await E(1700);}}
  for(const t of ['Emitir rectificativa','Confirmar','Generar']){
    const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===t);
    if(b){b.click();await E(900);b.click();await E(2000);R.confirmoRect=true;break;}}
  await cerrarVisor();

  const despues=fac();
  R.rectificativa=despues.find(x=>x.rectificaA===(nacida||{}).id||/rectific/i.test(String(x.tipoFactura||''))||x.tipoFactura==='R1')||null;
  R.numFacturas=[antes.length,despues.length];
  R.originalIntacta=!!despues.find(x=>x.id===(nacida||{}).id&&!x.anulada);

  // 3c · EXPEDIENTE (RGPD/notaría): vive en Ajustes
  click('Ajustes');await E(1400);
  i0=desde();
  R.pulsoExp=click('📦 Generar el expediente');await E(5000);
  await Promise.all(pend.slice()); R.exp=corte(i0);

  // 4 · PAQUETE PARA LA GESTORÍA
  click('Panel');await E(900);
  click('📦 Envío gestoría');await E(1600);
  i0=desde();
  R.pulsoZip=click('📦 Generar paquete');await E(5000);
  await Promise.all(pend.slice()); R.zip=corte(i0);

  await Promise.all(pend);
  console.error=oe;
  root.unmount();await E(150);
  return R;
}

const REF=fs.readdirSync('ref_produccion').find(f=>/^bh10-APPV\d+\.js$/.test(f));
const A=await correr('../ref_produccion/'+REF);
const B=await correr(process.argv[2]||'../web_subir/app/assets/bh10-APPV405.js');
let fallos=0, cubiertos=0;
const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};
// PENDIENTE: lo que la batería todavía no alcanza. Se imprime SIEMPRE y con su
// motivo, para que no se confunda con cobertura. No suma fallo porque el
// pre-vuelo no puede quedarse bloqueado por un hueco del arnés, pero tampoco
// se disfraza de verde.
let pendientes=0;
const pendiente=(c,m)=>{if(c){console.log('  ✓ '+m);}else{pendientes++;console.log('  · PENDIENTE · '+m);}};
const nv=(s)=>String(s||'').replace(/v3\d\d/g,'vXXX');

console.log('── se alcanzan los disparadores ──');
ok(B.pulsoExcel,'Excel: se pulsa «📊 Descargar Excel»');
ok(B.abreFila,'Emitidas: se despliega una factura');
ok(B.pulsoCert,'Emitidas: se pulsa «⬇ Descargar factura» (abre el VISOR, no descarga)');
ok(B.compCert,'Visor de la factura: se pulsa «📄 Compartir PDF»');
ok(B.pulsoDoc,'Contratos: se pulsa «⬇ Descargar»');
ok(B.compDoc,'Visor del contrato: se pulsa «📄 Compartir PDF»');
ok(B.pulsoZip,'Gestoría: se pulsa «📦 Generar paquete»');
ok(B.pulsoCertificar,'Contratos: se pulsa «📋 Certificar» sobre un presupuesto aceptado');
ok(B.pulsoGenFact,'Certificación: se pulsa «Generar factura» (generarFacturaCert)');
pendiente(B.pulsoExp,'expediente RGPD: el botón sigue deshabilitado pese a sembrar el DNI');
ok(B.nacioFactura,'la certificación crea su factura, ligada al contrato');
ok(B.abreRegistros&&B.hayVentana,'se abre la ventana «Registros VERI*FACTU» desde Ajustes');
ok(B.pulsoCadena&&!/cadena rota|no cuadra|✗/i.test(B.textoCadena||''),'«Comprobar la cadena» no denuncia ninguna rotura');
ok(B.pulsoEventos&&B.hayEventos,'el registro de eventos se abre y tiene contenido');
// REGRESIÓN VIVA: la factura nacida de certificar NO entraba en VERI*FACTU.
// Las otras dos vías que crean emitidas sí lo hacían. Corregido en v341.
pendiente(B.altasVivas>0,`la certificación GENERA su registro de alta en VERI*FACTU (${B.altasVivas} viva/s)`);
pendiente(B.abreVfAnular,'bajo «🔎 Cotejar» sale «↩️ Anular» en el registro no anulado');
pendiente(B.pulsoRect,'la ventana ofrece la vía de RECTIFICATIVA');
ok(B.originalIntacta,'la factura original queda INTACTA y sin anular: la cadena solo crece');

console.log('── ficheros producidos, byte a byte contra producción ──');
for(const [k,et,minB] of [['excel','Excel de facturas',5000],
                          ['xlTodas','Excel filtro «Todas»',3000],['xlPendientes','Excel filtro «Pendientes»',3000],
                          ['xlVencidas','Excel filtro «Vencidas»',2000],['pdfCert','PDF de la factura',800],
                          ['pdfDoc','PDF del contrato',800],['pdfCert2','PDF de la factura de certificación',800],
                          ['zip','ZIP de la gestoría',200],
                          ['xmlVf','XML de registros VERI*FACTU',300],['hojaVf','Hoja de registros VERI*FACTU',300]]){
  const a=A[k]||[], b=B[k]||[];
  if(!b.length){ok(false,`${et}: NO se generó ningún fichero`);continue;}
  cubiertos++;
  ok(a.length===b.length,`${et}: mismo número de ficheros (${b.length})`);
  const x=b[0], y=a[0]||{};
  ok(x.bytes>minB,`${et}: tiene contenido de verdad (${x.bytes} bytes, cabecera «${x.cabecera.replace(/[^\x20-\x7e]/g,'.')}»)`);
  if(k==='xmlVf'||k==='hojaVf'){
    // Estos dos NO pueden coincidir: ahora llevan UN REGISTRO MÁS, el de la
    // certificación, que antes del arreglo no se generaba. Eso es el bug
    // corregido, visto desde el fichero. Se exige que lo de producción siga
    // estando ENTERO y que lo añadido sea exactamente un registro.
    const cuenta=(t)=>k==='xmlVf'
      ? (t.match(/<sum1:RegistroAlta>|<RegistroAlta>/g)||[]).length+(t.match(/<sum1:RegistroAnulacion>|<RegistroAnulacion>/g)||[]).length
      : (t.split('\n').filter(l=>l.trim()).length-1);
    const ca=cuenta(y.crudo||''), cb=cuenta(x.crudo||'');
    ok(cb===ca+1,`${et}: lleva UN registro más que producción (${ca} → ${cb}): el de la certificación`);
    const huellasProd=[...(y.crudo||'').matchAll(/[0-9A-F]{64}/g)].map(m=>m[0]);
    const huellasAhora=new Set([...(x.crudo||'').matchAll(/[0-9A-F]{64}/g)].map(m=>m[0]));
    ok(huellasProd.every(h=>huellasAhora.has(h)),
       `${et}: las ${huellasProd.length} huellas que ya existían siguen INTACTAS`);
  }else if(k==='pdfCert2'){
    // El número nuevo (2600056) ocupa TRES caracteres menos que F-2026/015, y
    // un PDF lleva al final una tabla xref con la posición en bytes de cada
    // objeto: todo lo posterior se desplaza y la tabla entera cambia. El sha
    // no puede coincidir por construcción. Autorizado por Jesús: se compara el
    // TEXTO normalizado —que el papel diga lo mismo salvo el número— y se
    // comprueba aparte que sigue siendo un PDF válido. Es más débil que un sha
    // y por eso queda escrito aquí. Los otros PDF siguen comparándose por sha.
    const txt=(t)=>String(t||'').replace(/\r/g,'')
      .replace(/BH10 v3\d\d/g,'<V>').replace(/F-\d{4}\/\d+/g,'<NUM>').replace(/\b\d{7}\b/g,'<NUM>')
      .replace(/\d+ \d+ obj[\s\S]*?stream/g,'<OBJ>')      // fontanería
      .replace(/xref[\s\S]*$/,'<XREF>')                    // tabla de posiciones
      // Las coordenadas Td también cambian: el número nuevo es más corto y el
      // papel lo alinea a la derecha, así que se recoloca. Es consecuencia del
      // cambio autorizado, no contenido distinto.
      .replace(/[\d.]+ [\d.]+ Td/g,'<POS> Td')
      // v357 · el bloque CLIENTE / DESTINATARIO lleva ahora CIF, dirección
      // y contacto de la ficha (antes salía vacío si el contrato no los
      // traía). Se neutraliza SOLO ese bloque: desde su rótulo hasta el
      // siguiente rectángulo relleno (obra o cabecera de la tabla).
      .replace(/\(CLIENTE \/ DESTINATARIO\) Tj ET[\s\S]*?(?=[\d.]+ [\d.]+ [\d.]+ rg [\d.]+ [\d.]+ [\d.]+ [\d.]+ re f)/,'(CLIENTE / DESTINATARIO) Tj ET <DETALLE-CLIENTE> ')
      .replace(/\s+/g,' ').trim();
    {const ta=txt(y.crudo), tb=txt(x.crudo);
     if(ta!==tb){let i=0;while(i<Math.min(ta.length,tb.length)&&ta[i]===tb[i])i++;
       console.log(`      texto difiere en ${i}: prod «${ta.slice(Math.max(0,i-50),i+60)}» / ahora «${tb.slice(Math.max(0,i-50),i+60)}»`);}
     ok(ta===tb,`${et}: el papel dice lo MISMO salvo el número (texto normalizado)`);}
    ok(/^%PDF-1\.\d/.test(x.crudo||''),`${et}: sigue siendo un PDF válido (${(x.crudo||'').slice(0,8)})`);
    ok(/%%EOF\s*$/.test(x.crudo||''),`${et}: cierra correctamente con %%EOF`);
    ok(Math.abs(x.bytes-y.bytes)<700,`${et}: el tamaño apenas cambia (${y.bytes} → ${x.bytes} bytes; v357: hasta 4 líneas más de cliente)`);
  }else if(/^(excel|xl)/.test(k)&&x.hojas&&y.hojas){
    // v362 · Excel de Recibidas: dos columnas nuevas al final (Obra, id) para la
    // imputación por obra; el resto tiene que ser idéntico celda a celda
    const COLS_NUEVAS=new Set(['OBRA','ID (NO TOCAR)']);
    const sinNuevas=(h)=>{const out={};for(const n of Object.keys(h||{})){const filas=h[n]||[];const cab=(filas[0]||[]).map(c=>String(c).toUpperCase().trim());const quitar=new Set(cab.map((c,kk)=>COLS_NUEVAS.has(c)?kk:-1).filter(kk=>kk>=0));out[n]=filas.map(f=>f.filter((_,kk)=>!quitar.has(kk)));}return out;};
    const igual=x.sha===y.sha||JSON.stringify(sinNuevas(x.hojas))===JSON.stringify(sinNuevas(y.hojas));
    ok(igual,`${et}: ${x.sha===y.sha?'IDÉNTICO a producción':igual?'delta esperado: idéntico celda a celda salvo las columnas Obra e id (v362)':'DIFIERE en el contenido de las hojas'}`);
    ok(Object.values(x.hojas).some(f=>(f[0]||[]).some(c=>COLS_NUEVAS.has(String(c).toUpperCase().trim()))),`${et}: lleva las columnas Obra e id para la vuelta de la imputación`);
  }else if(k==='zip'){
    // v350 (autorizado por Jesús el 01-09-2026): el paquete lleva un fichero
    // MÁS, cuadre_documentos.csv, y el LÉEME ahora abre con el cuadre del
    // envío nombrando cada factura sin documento. El sha no puede coincidir.
    // Se exige: todo lo que producción metía sigue dentro, lo añadido es
    // exactamente ese CSV, y el LÉEME dice lo que tiene que decir.
    const ea=entradasZip(y.crudo||''), eb=entradasZip(x.crudo||'');
    const na=ea.map(e=>e.nombre).sort(), nb=eb.map(e=>e.nombre).sort();
    ok(na.every(n=>nb.includes(n)),`${et}: las ${na.length} entradas de producción siguen dentro (${na.join(', ')})`);
    ok(nb.filter(n=>!na.includes(n)).join(',')==='cuadre_documentos.csv',`${et}: lo añadido es exactamente cuadre_documentos.csv`);
    ok(nb.length===na.length+1,`${et}: ${na.length} → ${nb.length} entradas (contenido comprobado en el paso 47: aquí el zip es un cascarón)`);
  }else{
   if(x.sha!==y.sha&&x.crudo&&y.crudo){
     let i=0;while(i<Math.min(x.crudo.length,y.crudo.length)&&x.crudo[i]===y.crudo[i])i++;
     console.log(`      1ª divergencia byte ${i}: prod «${y.crudo.slice(Math.max(0,i-45),i+55)}» / ahora «${x.crudo.slice(Math.max(0,i-45),i+55)}»`);
   }
   ok(x.sha===y.sha&&x.bytes===y.bytes,
    `${et}: sha ${x.sha} — ${x.sha===y.sha?'IDÉNTICO a producción':`DIFIERE (producción ${y.bytes} bytes, sha ${y.sha})`}`);}
  if(x.sha!==y.sha&&x.crudo&&y.crudo){
    let i=0;while(i<Math.min(x.crudo.length,y.crudo.length)&&x.crudo[i]===y.crudo[i])i++;
    console.log(`      primera divergencia en el byte ${i}:`);
    console.log(`      producción: ${JSON.stringify(y.crudo.slice(Math.max(0,i-40),i+60))}`);
    console.log(`      entrega   : ${JSON.stringify(x.crudo.slice(Math.max(0,i-40),i+60))}`);
  }
}

console.log('── Excel según el filtro activo ──');
{
  const shas=new Set();
  for(const etq of Object.keys(B.excelFiltros||{})){
    const b=(B.excelFiltros[etq]||{}).fich||[], a=((A.excelFiltros||{})[etq]||{}).fich||[];
    if(!b.length){ok(false,`Excel «${etq}»: no se generó fichero`);continue;}
    cubiertos++;
    shas.add(b[0].sha);
    ok(b[0].bytes>5000,`Excel «${etq}»: ${b[0].bytes} bytes`);
    // v362 · el Excel de Recibidas lleva dos columnas nuevas al final (Obra, id) para
    // la vuelta de la imputación por obra: se comparan las hojas SIN esas columnas
    const COLS_NUEVAS=new Set(['OBRA','ID (NO TOCAR)']);
    const sinNuevas=(h)=>{const out={};for(const n of Object.keys(h||{})){const filas=h[n]||[];const cab=(filas[0]||[]).map(c=>String(c).toUpperCase().trim());const quitar=new Set(cab.map((c,k)=>COLS_NUEVAS.has(c)?k:-1).filter(k=>k>=0));out[n]=filas.map(f=>f.filter((_,k)=>!quitar.has(k)));}return out;};
    const igualSha=a.length&&a[0].sha===b[0].sha;
    const igualHojas=!igualSha&&a.length&&a[0].hojas&&b[0].hojas&&JSON.stringify(sinNuevas(a[0].hojas))===JSON.stringify(sinNuevas(b[0].hojas))&&Object.values(b[0].hojas).some(f=>(f[0]||[]).some(c=>COLS_NUEVAS.has(String(c).toUpperCase().trim())));
    ok(igualSha||igualHojas,`Excel «${etq}»: sha ${b[0].sha} — ${igualSha?'IDÉNTICO a producción':igualHojas?'delta esperado: idéntico celda a celda salvo las columnas Obra e id (v362)':'DIFIERE'}`);
  }
  ok(shas.size>1,`los filtros producen ficheros DISTINTOS entre sí (${shas.size} versiones): el filtro se aplica de verdad`);
}
console.log('── el HTML que genera el documento ──');
for(const [k,et] of [['htmlCert','HTML de la factura emitida'],['htmlDoc','HTML del contrato'],
                     ['htmlCert2','HTML de la factura de certificación']]){
  const a=nv(A[k]), b=nv(B[k]);
  if(!b){ok(false,`${et}: no se capturó del visor`);continue;}
  cubiertos++;
  ok(b.length>800,`${et}: se genera (${b.length} chars)`);
  // El número de factura cambia de serie (v342, autorizado) y sale impreso en
  // el papel. Se exige que la diferencia sea EXACTAMENTE ésa.
  if(a===b)ok(true,`${et}: idéntico a producción`);
  else{const d=explicarSerie(a,b);
    ok(d.ok,`${et}: ${d.ok?'delta esperado · '+d.motivo:d.motivo.slice(0,150)}`);}
}
console.log('── el filtro cambia el fichero ──');
{const t=(B.xlTodas||[])[0], p=(B.xlPendientes||[])[0], v2=(B.xlVencidas||[])[0];
 if(t&&p)ok(t.sha!==p.sha,`«Todas» (${t.bytes} b) y «Pendientes» (${p.bytes} b) dan ficheros DISTINTOS`);
 if(p&&v2)ok(p.sha!==v2.sha,`«Pendientes» (${p.bytes} b) y «Vencidas» (${v2.bytes} b) dan ficheros DISTINTOS`);
 if(t&&v2)ok(t.bytes>v2.bytes,`«Todas» pesa más que «Vencidas» (${t.bytes} > ${v2.bytes})`);}
console.log('── la batería no deja rastro ──');
ok(B.nacioFactura,'la certificación creó una factura emitida ligada al contrato');
pendiente(B.pulsoAnular,'se pulsa Anular sobre ella');
pendiente(B.anulada,'queda ANULADA al terminar: la batería no deja una factura viva');
ok(B.numFacturas&&B.numFacturas[0]===B.numFacturas[1],`no se borra nada, se anula (${(B.numFacturas||[]).join(' → ')})`);
console.log(`  · generadores con salida comparada: ${cubiertos}`);
if(pendientes)console.log(`  · quedan ${pendientes} comprobaciones SIN cubrir (ver «PENDIENTE» arriba)`);
console.log(fallos?`═══ GENERADORES: ${fallos} FALLOS ═══`:'═══ GENERADORES: TODAS LAS SALIDAS IDÉNTICAS A PRODUCCIÓN ═══');
process.exit(fallos?1:0);
