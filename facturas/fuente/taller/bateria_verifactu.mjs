// ═══ BATERÍA VERI*FACTU · cadena, anulación, rectificativa, multiempresa ═══
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://bh10group.com/app/'});
for(const k of ['window','document','navigator','localStorage','HTMLElement','Blob','URL','atob','btoa','crypto']){try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
globalThis.window=dom.window;
window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});
window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
window.storage={get:async()=>null,set:async(k,v)=>({key:k,value:v}),list:async()=>({keys:[]}),getStatus:()=>({fase:'ok'})};
const I=(await import('../web_subir/app/assets/bh10-APPV393.js')).__internos;
let fallos=0;const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};

const BIG={nif:'B45731981',nombre:'BIG HOUSE 2010 SL',productorNif:'B45731981',instalacion:'1'};
const f1={id:'i1',tipo:'cobro',numFactura:'FE-2026/010',fecha:'2026-08-20',proveedor:'CLIENTE SL',proveedorCif:'B00000000',desglose:[{base:1000,tipo:21}],importeBase:1000,iva:210,total:1210};
const f2={...f1,id:'i2',numFactura:'FE-2026/011',fecha:'2026-08-21'};

// ── 1) cadena de altas ──
const r1=await I.vfCrearRegistroAlta({inv:f1,anterior:null,emisor:BIG,ahora:new Date('2026-08-20T10:00:00')});
const r2=await I.vfCrearRegistroAlta({inv:f2,anterior:r1,emisor:BIG,ahora:new Date('2026-08-21T10:00:00')});
ok(r1.huella&&r1.huella.length>=32&&r2.huellaAnterior===r1.huella,'altas encadenadas: la 2ª lleva la huella de la 1ª');
const v1=await I.vfVerificarCadena([r1,r2]);
ok(v1.intacta,'cadena de 2 altas: intacta');
const manip={...r2,importeTotal:9999};
const v2=await I.vfVerificarCadena([r1,manip]);
ok(!v2.intacta&&v2.rotos.length===1,'manipular un importe tras firmar → la cadena canta');

// ── 2) anulación: se encadena Y se envía ──
const an=await I.vfCrearRegistroAnulacion({registroAnulado:r1,anterior:r2,emisor:BIG,ahora:new Date('2026-08-22T09:00:00'),motivo:'error en destinatario'});
ok(an.huellaAnterior===r2.huella,'la anulación es el 3er eslabón (enlaza con la última alta)');
const v3=await I.vfVerificarCadena([r1,r2,an]);
ok(v3.intacta,'cadena alta+alta+anulación: intacta');
const pend=I.vfPendientes([r1,r2,an]);
ok(pend.some(x=>x===an||x.huella===an.huella),'la ANULACIÓN entra en pendientes de ENVÍO (también se manda a la AEAT)');
const lote=I.vfLoteAEnviar([r1,r2,an]);
ok(Array.isArray(lote)&&lote.length===3,'el lote a enviar incluye los 3 registros');
const xmlAn=I.vfXmlRegistroAnulacion(an);
ok(xmlAn.includes(an.huella)&&xmlAn.includes('B45731981')&&/Encadenamiento|Huella/i.test(xmlAn),'XML de anulación: huella, NIF y encadenamiento dentro');
const sobre=I.vfSobreSoap([r1,an],BIG);
ok(sobre.includes('Envelope')&&sobre.includes(an.huella),'el sobre SOAP envuelve alta y anulación juntas');

// ── 3) rectificativa ──
const rect={...f1,id:'i3',numFactura:'FE-2026/012',fecha:'2026-08-22',concepto:'Rectificativa que anula la factura FE-2026/010',desglose:[{base:-1000,tipo:21}],importeBase:-1000,iva:-210,total:-1210,vfRectificaA:'FE-2026/010',vfRectificaFecha:'2026-08-20'};
const tR=I.vfTipoFactura(rect);
ok(String(tR).startsWith('R'),'la rectificativa se clasifica tipo R ('+tR+')');
const rR=await I.vfCrearRegistroAlta({inv:rect,anterior:an,emisor:BIG,ahora:new Date('2026-08-22T12:00:00')});
const v4=await I.vfVerificarCadena([r1,r2,an,rR]);
ok(v4.intacta&&Math.abs(+rR.importeTotal-(-1210))<0.01,'la rectificativa se encadena tras la anulación con total −1.210');
const xmlR=I.vfXmlRegistroAlta(rR);
ok(/R[1-5]|Rectificativa/i.test(xmlR),'el XML de la rectificativa declara su tipo R');

// ── 4) multiempresa: GREEN sin certificado ni configuración NO registra ──
const cfgVirgen={...I.VF_CFG_POR_DEFECTO};
ok(!I.vfActivo(cfgVirgen),'GREEN (config virgen): VERI*FACTU inactivo');
ok(I.vfDebeRegistrar(f1,cfgVirgen)===false,'GREEN emite una factura → NO se registra (sin activar)');
const faltaGreen=I.vfListoParaActivar(cfgVirgen,{nif:'',nombre:'GREEN GENERATION BUILDING SL'});
ok(Array.isArray(faltaGreen)&&faltaGreen.length>0,'activar GREEN exige lo que falta ('+faltaGreen.length+' requisitos, certificado/pasarela incluidos)');
const cfgBig={...I.VF_CFG_POR_DEFECTO,activo:true,entorno:'pruebas',pasarela:'https://worker/vf'};
ok(I.vfDebeRegistrar(f1,cfgBig)===true,'BIG activa → la emitida SÍ se registra');
ok(I.vfDebeRegistrar({...f1,tipo:'factura'},cfgBig)===false,'las RECIBIDAS nunca se registran (solo emisión propia)');
// el registro lleva el NIF del emisor de SU empresa
ok(r1.idEmisor==='B45731981','cada registro viaja con el NIF de la empresa emisora');
console.log(fallos?'═══ VERI*FACTU: '+fallos+' FALLOS ═══':'═══ VERI*FACTU: CADENA·ANULACIÓN·RECTIFICATIVA·MULTIEMPRESA EN ORDEN ═══');
process.exit(fallos?1:0);
