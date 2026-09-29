// ═══ BATERÍA BORRADOR 303 (v347) ═══
// El resumen para Reme se prueba con la copia real: las cifras del módulo se
// recalculan por una vía independiente dentro de la propia batería, y los
// casos finos (ISP parcial, abonos, multi-base) con premisas sintéticas.
import fs from 'fs';
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
const dom=new JSDOM('<!doctype html>',{url:'https://bh10group.com/app/'});
globalThis.window=dom.window;globalThis.document=dom.window.document;
window.__BH10_R=React;window.__BH10_JSX=JSXR;
window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
const {__internos:I}=await import('../web_subir/app/assets/bh10-APPV399.js');
const {resumen303,csv303,basesDe,parseNum}=I;
let fallos=0;const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};

const datos=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const invs=JSON.parse(datos.claves['bh10-fc-v3']);
const anulada=i=>!!(i&&(i.anulada||i.esAnulada||i.estadoVf==='anulada'));
const enQ=(i,q,y)=>{const d=new Date(i.fecha);return Math.floor(d.getMonth()/3)===q&&d.getFullYear()===y;};

console.log('── 1 · un trimestre real, recalculado por dos caminos ──');
const Q=1,Y=2026;   // T2: abril-junio, con la casa ya rodando
const emitidas=invs.filter(i=>enQ(i,Q,Y)&&i.tipo==='cobro'&&!anulada(i));
const recibidas=invs.filter(i=>enQ(i,Q,Y)&&i.tipo!=='cobro'&&i.tipo!=='anticipo'&&i.tipo!=='personal'&&!anulada(i));
ok(emitidas.length+recibidas.length>=40,`el trimestre tiene chicha: ${emitidas.length} emitidas y ${recibidas.length} recibidas`);
const r=resumen303({emitidas,recibidas,parseNum});
// recomputo independiente, sin el módulo
const indep=(lista)=>{let base=0,cuota=0,isp=0;
  for(const i of lista)for(const l of basesDe(i,parseNum)){if(l.isp)isp+=l.base;else{base+=l.base;cuota+=l.base*l.tipo/100;}}
  return {base:+base.toFixed(2),cuota:+cuota.toFixed(2),isp:+isp.toFixed(2)};};
const iE=indep(emitidas), iR=indep(recibidas);
ok(Math.abs(r.deducible.base-iR.base)<0.02&&Math.abs(r.deducible.cuota-iR.cuota)<0.02,
  `deducible cuadra por los dos caminos: base ${iR.base} · cuota ${iR.cuota}`);
const devCuota=+Object.values(r.devengado.porTipo).reduce((s,x)=>s+x.cuota,0).toFixed(2);
ok(Math.abs(devCuota-iE.cuota)<0.02,`devengado cuadra: cuota ${iE.cuota}`);
ok(Math.abs(r.resultado-(r.devengado.total-r.deducible.total))<0.02,'resultado = casilla 27 − casilla 45');
ok(Math.abs(r.devengado.ispRecibidas.base-iR.isp)<0.02&&Math.abs(r.deducible.ispBase-iR.isp)<0.02,
  'el ISP recibido aparece a la vez como devengado y deducible (neto cero)');

console.log('── 2 · los casos finos, con premisas sintéticas ──');
const rf=resumen303({parseNum,
  emitidas:[{tipo:'cobro',importeBase:'1.000,00',tipoIva:21,iva:210,total:1210},
            {tipo:'cobro',isp:true,importeBase:'2.000,00',tipoIva:21,iva:0,total:2000}],
  recibidas:[{tipo:'factura',desglose:[{base:500,tipo:21},{base:300,tipo:0,sp:true}],iva:105,total:905},
             {tipo:'factura',esAbono:true,importeBase:'100,00',tipoIva:21,iva:21,total:121}]});
ok(rf.informativas.ventasISP===2000,'la venta ISP emitida va a informativas (122), sin cuota');
ok(rf.devengado.porTipo[21].base===1000&&rf.devengado.porTipo[21].cuota===210,'la emitida normal: 1.000 al 21%');
ok(rf.deducible.base===400&&rf.deducible.cuota===84,'recibidas: 500 − 100 del abono = 400 de base, 84 de cuota');
ok(rf.devengado.ispRecibidas.base===300&&rf.devengado.ispRecibidas.cuotaEstimada===63,
  'la base sp del desglose entra como ISP recibido: 300, cuota estimada 63');
ok(rf.deducible.ispCuotaEstimada===63&&Math.abs(rf.resultado-(210+63-84-63))<0.005,
  'resultado: 210 + 63 − 84 − 63 = 126, con el ISP anulándose solo');

console.log('── 3 · la hoja que recibe Reme ──');
const csv=csv303(rf,{empresa:'BIG HOUSE 2010 S.L.',cif:'B45731981',trimestre:2,anio:2026});
ok(/BORRADOR MODELO 303;BIG HOUSE 2010 S.L.;CIF B45731981;T2 2026/.test(csv),'cabecera con empresa, CIF y trimestre');
ok(/Regimen general;1000,00;21%;210,00;07-09/.test(csv),'la fila del 21% lleva sus casillas 07-09');
ok(/ISP recibido[\s\S]*12-13/.test(csv)&&/ESTIMADA al 21%/.test(csv),'el ISP recibido va etiquetado como ESTIMADO, con casillas 12-13');
ok(/TOTAL CUOTA DEVENGADA;;;273,00;27/.test(csv),'casilla 27');
ok(/RESULTADO \(27 - 45\);;;126,00;46/.test(csv),'casilla 46 con el resultado');
ok(/NO es la autoliquidacion/.test(csv),'y el aviso de que es un borrador, no la autoliquidación');

console.log('── 4 · el enganche en la app ──');
const src=fs.readFileSync('src/app.jsx','utf8');
ok(/csv303Trim=\(\)=>/.test(src)&&/resumen303\(\{emitidas:qCobros,recibidas:qGastos/.test(src),
  'el botón usa las MISMAS listas del trimestre que la tarjeta fiscal');
ok(/📄 303/.test(src)&&/Borrador303_/.test(src),'el botón «📄 303» descarga Borrador303_AÑO_T_CIF.csv');
ok(/avisos de descuadre|aviso.*de descuadre/.test(src)||/avisos\.length.*Reme/.test(src),'los descuadres avisan en pantalla, no se tapan');

console.log(fallos?`═══ BORRADOR 303: ${fallos} FALLOS ═══`:'═══ BORRADOR 303: CASILLAS CUADRADAS POR DOS CAMINOS ═══');
process.exit(fallos?1:0);
