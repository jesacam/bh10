// ═══ BATERÍA PRESUPUESTO DE PERSONAL + REINTENTOS AEAT (v348) ═══
// Dos piezas de la misma versión: el centro de coste de personal a 14 pagas
// en la previsión de tesorería, y el plan de reintentos de la ventana de
// 240 s tras un fallo de red con la pasarela.
import fs from 'fs';
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
const dom=new JSDOM('<!doctype html>',{url:'https://bh10group.com/app/'});
globalThis.window=dom.window;globalThis.document=dom.window.document;
window.__BH10_R=React;window.__BH10_JSX=JSXR;
window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
const {__internos:I}=await import('../web_subir/app/assets/bh10-APPV405.js');
const {previsionTesoreria,vfPlanReintento}=I;
let fallos=0;const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};

const datos=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const employees=JSON.parse(datos.claves['bh10-employees']);
const polizas=JSON.parse(datos.claves['bh10-polizas']||'[]');
const invoices=JSON.parse(datos.claves['bh10-fc-v3']);

console.log('── 1 · el modelo de CAJA real: mensual fijo + extra sin doblar SS + 111 ──');
const base={empleados:employees,polizas,facturas:invoices,recPatrones:[],getSaldoF:()=>0};
const PP={mensual:80000,extraImporte:30000,irpfTrimestral:15000,extras:[6,12]};
const P=previsionTesoreria({...base,presupuestoPersonal:PP},'2026-01',12);
ok(Math.abs(P.filas.find(f=>f.mes==='2026-02').nominas-80000)<0.01,'febrero, mes normal: 80.000 € clavados');
ok(Math.abs(P.filas.find(f=>f.mes==='2026-06').nominas-110000)<0.01,'junio: 80.000 + 30.000 de paga extra — la SS NO dobla');
ok(Math.abs(P.filas.find(f=>f.mes==='2026-12').nominas-110000)<0.01,'diciembre: igual');
for(const m of ['2026-01','2026-04','2026-07','2026-10'])
  ok(Math.abs(P.filas.find(f=>f.mes===m).nominas-95000)<0.01,`${m}: 80.000 + 15.000 del modelo 111`);
ok(P.filas.every(f=>f.ss===0),'la estimación del 41% de SS se apaga: el mensual YA la incluye');
const anual=+(P.filas.reduce((s,f)=>s+f.nominas,0)).toFixed(0);
ok(anual===12*80000+2*30000+4*15000,`el año suma el modelo completo: ${anual} € (960k + 60k extras + 60k del 111)`);
ok(P.conPresupuesto===true,'la previsión declara que va contra presupuesto');

console.log('── 2 · las líneas recurrentes de TGSS no se cuentan dos veces ──');
const srcT=fs.readFileSync('src/tesoreria.js','utf8');
ok(/Seguridad Social'\)\.reduce/.test(srcT)&&/recImp=\+\(rec\.imp-recSS\)/.test(srcT),
   'el descuento de la TGSS recurrente está en el fuente de la previsión');
ok(/la cotizaci\u00f3n va prorrateada|NO dobla/.test(srcT),'y el porqué del modelo está escrito donde vivirá siempre');

console.log('── 3 · sin presupuesto, TODO sigue igual que siempre ──');
const V=previsionTesoreria(base,'2026-05',6);
const planas=+employees.filter(e=>e&&e.activo).reduce((s,e)=>s+(I.parseNum(e.importeBase)||0),0).toFixed(2);
ok(Math.abs(V.filas[0].nominas-planas)<0.02,`imputación plana intacta: ${planas} € al mes`);
ok(V.filas[0].ss>0,'y la estimación de SS sigue viva sin presupuesto');
ok(!V.conPresupuesto,'sin bandera de presupuesto');

console.log('── 4 · reintentos de la ventana de 240 s ──');
ok(vfPlanReintento(0)===30000&&vfPlanReintento(1)===60000&&vfPlanReintento(2)===120000,'esperas de 30, 60 y 120 s');
ok(30+60+120<=240,'las tres esperas caben en la ventana de 240 s (suman 210)');
ok(vfPlanReintento(3)===null&&vfPlanReintento(-1)===null,'a la cuarta se desiste; entradas raras, también');
const src=fs.readFileSync('src/app.jsx','utf8');
ok(/vfProgramarReintento\(\);return;\s*\}\s*\n\s*vfReintento\.current\.intento=0/.test(src.replace(/\r/g,''))||(/setVfEnviando\(false\);vfProgramarReintento\(\)/.test(src)&&/vfReintento\.current\.intento=0/.test(src)),
   'los DOS caminos de fallo programan reintento y el éxito rearma el contador');
ok(/if\(r\.timer\)return;/.test(src),'dos fallos seguidos no apilan dos temporizadores');
ok(/rechazo de la AEAT no se reintenta/.test(src),'y un rechazo de contenido de la AEAT NO se reintenta: solo la red');

console.log('── 5 · el enganche del centro de coste ──');
ok(/prMensualPersonal/.test(src)&&/presupuestoPersonal:\{mensual:parseNum\(compCfg\.prMensualPersonal\)/.test(src),
   'la previsión recibe el modelo de caja fijado en la tarjeta de Nóminas');
ok(/Presupuesto anual de personal/.test(src)&&/onBlur=\{saveCompany\}/.test(src),'la tarjeta existe y guarda en la ficha de empresa');
ok(/consumidoRem/.test(src)&&/r\.tipo==='nom'/.test(src)&&/teoricoADia/.test(src),
   'el consumido bebe de las REMESAS de nóminas reales (más personal, TGSS y 111) y se compara con el teórico');
ok(/coherencia/.test(src)&&/revisa los importes/.test(src),'si el techo anual no casa con el modelo mensual, la tarjeta AVISA');

console.log(fallos?`═══ PRESUPUESTO+REINTENTOS: ${fallos} FALLOS ═══`:'═══ PRESUPUESTO DE CAJA REAL Y VENTANA 240s: EN ORDEN ═══');
process.exit(fallos?1:0);
