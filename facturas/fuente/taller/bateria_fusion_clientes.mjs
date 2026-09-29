// ═══ BATERÍA FUSIÓN DE CLIENTES (v345) ═══
// El núcleo puro se prueba con la copia REAL: un cliente con facturas y
// contratos se funde en otro y se cuenta cada pieza. Y el enganche en la app
// se vigila en el fuente, como el de numeración.
import fs from 'fs';
const datos=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
const dom=new JSDOM('<!doctype html>',{url:'https://bh10group.com/app/'});
globalThis.window=dom.window;globalThis.document=dom.window.document;
window.__BH10_R=React;window.__BH10_JSX=JSXR;
window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
const {__internos:I}=await import('../web_subir/app/assets/bh10-APPV399.js');
let fallos=0;const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};

const invoices=JSON.parse(datos.claves['bh10-fc-v3']);
const contratos=JSON.parse(datos.claves['bh10-contratos']);
const cliCat=JSON.parse(datos.claves['bh10-clicat']||'[]');
const emitida=i=>i&&(i.tipo==='cobro'||i.tipo==='anticipo');

// el cliente real con más movimiento
const cuenta={};invoices.filter(emitida).forEach(i=>{cuenta[i.proveedor]=(cuenta[i.proveedor]||0)+1;});
const origen=Object.keys(cuenta).sort((a,b)=>cuenta[b]-cuenta[a])[0];
const destino='◆ DESTINO DE PRUEBA ◆';
const fO=invoices.filter(i=>emitida(i)&&i.proveedor===origen).length;
const cO=contratos.filter(c=>c&&c.cliente===origen).length;
const recibidasAntes=invoices.filter(i=>!emitida(i)).length;
console.log(`── se funde «${origen}» (${fO} emitidas, ${cO} contratos) ──`);
ok(fO>=5,'el caso de prueba tiene facturas de sobra (no pasa en vacío)');

// la ficha real del origen se aparta para que la premisa sea limpia:
// una ficha origen SOLO con cif y una destino SOLO con dirección
const catPrueba=[...cliCat.filter(c=>c&&c.nombre!==origen&&c.nombre!==destino),{nombre:origen,cif:'B00000000'},{nombre:destino,dir:'CALLE PRUEBA 1'}];
const r=I.fusionaCliente({invoices,contratos,cliCat:catPrueba},origen,destino);
ok(r&&r.nFacturas===fO,`cuenta ${fO} facturas movidas`);
ok(r.nContratos===cO,`cuenta ${cO} contratos movidos`);
ok(r.invoices.filter(i=>emitida(i)&&i.proveedor===destino).length===fO,'todas las emitidas llevan ya el destino');
ok(r.invoices.filter(i=>emitida(i)&&i.proveedor===origen).length===0,'del origen no queda ninguna');
ok(r.contratos.filter(c=>c&&c.cliente===origen).length===0,'ni contratos del origen');
ok(r.invoices.filter(i=>!emitida(i)).length===recibidasAntes
   &&r.invoices.filter(i=>!emitida(i)&&i.proveedor===destino).length===0,
   'las RECIBIDAS (proveedores de verdad) quedan intactas');
const fD=r.cliCat.find(c=>c.nombre===destino);
ok(fD&&fD.cif==='B00000000'&&fD.dir==='CALLE PRUEBA 1','la ficha destino hereda el CIF del origen y conserva lo suyo');
ok(!r.cliCat.some(c=>c.nombre===origen),'la ficha origen desaparece');
ok(I.fusionaCliente({invoices,contratos,cliCat},origen,origen)===null,'origen=destino se rechaza');

// el enganche en la app
const src=fs.readFileSync('src/app.jsx','utf8');
ok(/const fusionarClientes=/.test(src)&&/fusionaCliente\(\{invoices:invoicesAll,contratos,cliCat\}/.test(src),
   'la app cablea fusionarClientes sobre el núcleo puro');
ok(/Fusionar clientes duplicados/.test(src)&&/sugerirFusiones\(clientes,cliCat,emitidas\)/.test(src),
   'la tarjeta vive en la subvista clientes con el detector de duplicados');
ok(/bh10-clifusignore/.test(src),'el «no volver a sugerir» se guarda y se recarga');

// ── NORMALIZAR A MAYÚSCULAS (misma batería: comparten módulo) ──────────────
console.log('── normalizar a mayúsculas ──');
{
  const mix=[...invoices,{tipo:'cobro',id:'zz1',proveedor:'Cliente En Minúsculas SL'}];
  const ctx={invoices:mix,contratos:[...contratos,{id:'zz2',cliente:'Cliente En Minúsculas SL',clienteDir:'c/ prueba baja 3'}],
    cliCat:[...cliCat,{nombre:'Cliente En Minúsculas SL',cif:'b99999999'},{nombre:'CLIENTE EN MINÚSCULAS SL',dir:'YA ESTABA'}],provCat:[]};
  const r=I.normalizaMayusculas(ctx);
  ok(r.nFacturas>=1,'detecta y pasa la factura en minúsculas');
  ok(r.nContratos>=1,'y el contrato, con su dirección');
  ok(r.invoices.find(i=>i.id==='zz1').proveedor==='CLIENTE EN MINÚSCULAS SL','el nombre queda en mayúsculas con sus acentos');
  ok(r.contratos.find(c=>c.id==='zz2').clienteDir==='C/ PRUEBA BAJA 3','la dirección del contrato también');
  ok(r.nFundidas>=1&&r.cliCat.filter(c=>c.nombre==='CLIENTE EN MINÚSCULAS SL').length===1,'las dos fichas que chocaban quedan en UNA');
  const f=r.cliCat.find(c=>c.nombre==='CLIENTE EN MINÚSCULAS SL');
  ok(f.cif==='B99999999'&&f.dir==='YA ESTABA','la ficha fundida junta el CIF de una y la dirección de la otra');
  const r2=I.normalizaMayusculas(r);
  ok(r2.nFacturas===0&&r2.nContratos===0&&r2.nFichas===0&&r2.nFundidas===0,'IDEMPOTENTE: la segunda pasada no toca nada');
  const src2=fs.readFileSync('src/app.jsx','utf8');
  ok(/normalizarMayusculas=\(\)=>/.test(src2)&&/Homogeneizar nombres/.test(src2)&&/Pasar todo a MAYÚSCULAS/.test(src2),
     'la app cablea el botón en Ajustes sobre el núcleo puro');
}
console.log(fallos?`═══ FUSIÓN CLIENTES: ${fallos} FALLOS ═══`:'═══ FUSIÓN CLIENTES: TRES LISTAS A LA VEZ, RECIBIDAS INTACTAS ═══');
process.exit(fallos?1:0);
