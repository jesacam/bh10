// ═══ BATERÍA DE NEGOCIO · IVA, contratos, presupuestos, anuladas, PDF ═══
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import fs from 'fs';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://bh10group.com/app/'});
for(const k of ['window','document','navigator','localStorage','HTMLElement','Node','Event','Blob','URL','atob','btoa','crypto']){try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
globalThis.window=dom.window;
window.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});
window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
window.storage={get:async()=>null,set:async(k,v)=>({key:k,value:v}),list:async()=>({keys:[]}),getStatus:()=>({fase:'ok'})};
const M=await import('../web_subir/app/assets/bh10-APPV404.js');const I=M.__internos;const I2=M.__internos2;
const datos=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const fc=JSON.parse(datos.claves['bh10-fc-v3']);
let fallos=0;const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};

// ── 1) IVA: emisión y recepción ──
const d1=I.calcDesglose([{base:1000,tipo:21}],0);
ok(Math.abs(d1.iva-210)<0.01&&Math.abs(d1.total-1210)<0.01,'IVA 21%: base 1.000 → cuota 210, total 1.210');
const d2=I.calcDesglose([{base:1000,tipo:21},{base:500,tipo:10}],0);
ok(Math.abs(d2.iva-260)<0.01&&Math.abs(d2.total-1760)<0.01,'dos bases (21%+10%): cuotas 210+50, total 1.760');
const d3=I.calcDesglose([{base:1000,tipo:21}],15);
ok(Math.abs(d3.retencion-150)<0.01&&Math.abs(d3.total-1060)<0.01,'IRPF 15%: retención 150, total 1.060');
const d4=I.calcDesglose([{base:1000,tipo:0}],0);
ok(Math.abs(d4.total-1000)<0.01,'inversión sujeto pasivo / exenta: total = base');
// cuadre con TODAS las facturas reales que tengan desglose
const conDes=fc.filter(i=>Array.isArray(i.desglose)&&i.desglose.length&&+i.total>0);
const malCuadre=conDes.filter(i=>!I.cuadraFactura(i));
ok(malCuadre.length===0,'cuadre de IVA en las '+conDes.length+' facturas reales con desglose'+(malCuadre.length?' → '+malCuadre.slice(0,2).map(i=>i.numFactura).join(','):''));

// ── 2) contratos: asignación y consumo ──
const contratos=JSON.parse(datos.claves['bh10-contratos']||'[]');
ok(contratos.length>0,'contratos reales cargados ('+contratos.length+')');
const cCli=I.contratosDeCliente({nombre:contratos[0].cliente,cif:contratos[0].clienteCif||''},contratos);
ok(cCli.length>=1,'contratosDeCliente asigna por cliente ('+cCli.length+' de «'+String(contratos[0].cliente).slice(0,22)+'»)');
const impC=I.importeContratos(cCli);
ok(Number.isFinite(impC)&&impC>0,'importe agregado de sus contratos: '+impC.toFixed(2)+' €');
// certificación consume del contrato: líneas al pct
const items=[{desc:'Estructura',qty:1,precio:10000,pct:0},{desc:'Cubierta',qty:1,precio:5000,pct:0}];
const c30=I2.lineasCertificacion(items,['30','30']);
ok(Math.abs(c30.base-4500)<0.01&&c30.lineas.length===2,'certificar al 30% consume 4.500 € del contrato de 15.000');
const items80=items.map(it=>({...it,pct:30}));
const c80=I2.lineasCertificacion(items80,['80','80']);
ok(Math.abs(c80.base-7500)<0.01,'certificar 30→80% consume SOLO el tramo (7.500 €), sin duplicar lo ya certificado');
const cIgual=I2.lineasCertificacion(items80,['30','30']);
ok(cIgual.base===0&&cIgual.lineas.length===0,'re-certificar el mismo % no consume nada (0 €)');

// ── 3) la emitida consume; la ANULADA deja de consumir ──
const OB='OBRA-PRUEBA-NEG';
const sint=[
 {id:'e1',tipo:'cobro',numFactura:'FE-1',proveedor:'CLI',obra:OB,importeBase:10000,total:12100,fecha:'2026-01-10',pagos:[]},
 {id:'e2',tipo:'cobro',numFactura:'FE-2',proveedor:'CLI',obra:OB,importeBase:5000,total:6050,fecha:'2026-02-10',pagos:[]},
];
const consumo=l=>I.vivas(l).filter(i=>i.obra===OB&&i.tipo==='cobro').reduce((s,i)=>s+(+i.importeBase||0),0);
ok(consumo(sint)===15000,'dos emitidas consumen 15.000 del presupuesto de la obra');
const anulada={...sint[1],anulada:true};
const trasAnular=[sint[0],I.esAnulada(anulada)?anulada:{...anulada,anulada:true}];
ok(I.esAnulada(anulada)&&!I.esAnulada(sint[0]),'esAnulada reconoce la bandera anulada');
const c2=consumo([sint[0],anulada].map(x=>x));
ok(c2===10000,'ANULADA FE-2 → deja de consumir (queda 10.000)');
// abono resta
const abono={id:'e3',tipo:'cobro',esAbono:true,numFactura:'FE-1-AB',proveedor:'CLI',obra:OB,importeBase:-2000,total:-2420,fecha:'2026-03-01',pagos:[]};
ok(I.esAbono(abono),'el abono se reconoce');
ok(consumo([...sint,abono])===13000,'el abono resta del consumo (15.000 → 13.000)');

// ── 4) saldos: pagos parciales y estado ──
const f={id:'p1',tipo:'factura',numFactura:'R-1',proveedor:'PROV',total:1210,pagos:[{id:'x',fecha:'2026-08-01',importe:500,metodo:'Transferencia'}]};
ok(Math.abs(I.getSaldo(f,[f])-710)<0.01&&I.getEstado(f,[f])==='parcial','pago parcial: saldo 710 y estado parcial');

// ── 5) PDF: PRESUPUESTO dice PRESUPUESTO, FACTURA dice FACTURA ──
// Desde v341 generateDoc y generateCertDoc viven en src/documentos.js. Estas
// comprobaciones leen el FUENTE, así que tienen que mirar los dos ficheros: si
// solo miraran app.jsx, dejarían de vigilar el rótulo del PDF sin avisar.
const src=fs.readFileSync('src/app.jsx','utf8')+'\n'+fs.readFileSync('src/documentos.js','utf8');
ok(src.includes("tipoLabel=contrato.tipo==='presupuesto'?'PRESUPUESTO':'FACTURA'"),'el rótulo del PDF nace del tipo del contrato');
const iTL=src.indexOf('tipoLabel=contrato.tipo');const iMk=src.indexOf('const makePdf',iTL);const llamada2183=(src.match(/showDocPreview\([\s\S]{0,400}?\)/g)||[]).join(' ')+' '+(src.match(/tipo:\s*tipoLabel/g)||[]).join(' ');
ok(/tipo:\s*tipoLabel/.test(llamada2183),'el PDF de contrato recibe tipo:tipoLabel (presupuesto→PRESUPUESTO)');
ok((src.match(/tipo:'FACTURA'/g)||[]).length===2,'las dos rutas de factura emitida fijan tipo FACTURA');
const plantilla=src.slice(src.indexOf('const buildInvoicePdf'),src.indexOf('const buildInvoicePdf')+2600);
ok(/P\.text\([^)]*tipo/.test(plantilla),'la plantilla imprime el rótulo tipo en el papel');
console.log(fallos?'═══ NEGOCIO: '+fallos+' FALLOS ═══':'═══ BATERÍA NEGOCIO: IVA·CONTRATOS·ANULADAS·PDF EN ORDEN ═══');
process.exit(fallos?1:0);
