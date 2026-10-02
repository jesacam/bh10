// ═══ BATERÍA MAPEO DEL LECTOR (v346) ═══
// Los dos fallos que Jesús ve en el día a día:
//  1) IBAN mal leído que acaba acumulado en la ficha del proveedor
//  2) factura con una base a IVA normal y OTRA base en ISP (art. 84)
// desglose.js es puro: se prueba directo, con el ctx real de la app.
import fs from 'fs';
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
const dom=new JSDOM('<!doctype html>',{url:'https://bh10group.com/app/'});
globalThis.window=dom.window;globalThis.document=dom.window.document;
window.__BH10_R=React;window.__BH10_JSX=JSXR;
window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
const {__internos:I}=await import('../web_subir/app/assets/bh10-APPV401.js');
const {mapearLectura,cuadraFactura,normIban,reparaIban,problemaIban,normNif,parseNum,inferISP,CATS,IVAS,IRPFS}=I;
let fallos=0;const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};
const ctx={inferISP,esNuestro:()=>false,today:'2026-08-28',CATS,IVAS,IRPFS,normIban,reparaIban,normNif,parseNum};

console.log('── 1 · IBAN: reparar lo reparable, frenar lo inválido ──');
const BUENO='ES9121000418450200051332';        // control correcto
ok(!problemaIban(BUENO),'un IBAN válido pasa el mod-97');
const CONFUSO='ES91210004I845020005I332';      // I por 1, dos veces (OCR)
ok(reparaIban(CONFUSO)===BUENO,'la confusión OCR (I↔1) se repara y el control CUADRA');
const ROTO='ES9121000418450200051333';         // último dígito cambiado
ok(problemaIban(ROTO)&&reparaIban(ROTO)===ROTO,'un dígito de control que no cuadra NO se «repara» a ciegas');
const m1=mapearLectura({ib:ROTO,imp:[{b:100,iv:21,c:21}],t:121},ctx);
ok(m1.ibanProveedor===ROTO&&!!problemaIban(m1.ibanProveedor),
   'el IBAN roto llega al formulario (con su aviso) pero SUSPENDE el mod-97');
const src=fs.readFileSync('src/app.jsx','utf8');
ok(/if\(problemaIban\(ib\)\)return;/.test(src),
   'y la app NO lo guarda en la ficha: el guardián mod-97 está en el camino de acumulación');

console.log('── 2 · el prompt pide lo que hace falta ──');
ok(/CAR\u00c1CTER A CAR\u00c1CTER/.test(src)&&/d\u00edgitos tras ES son de CONTROL/.test(src)&&/mejor vac\u00edo que inventado/.test(src),
   'IBAN: carácter a carácter, dígitos de control, y mejor vacío que inventado');
ok(/"sp":true SOLO si ESA base concreta/.test(src)&&/NO actives el "sp" global/.test(src),
   'ISP: marca por BASE cuando la factura mezcla, con el sp global reservado');

console.log('── 3 · multi-base: 21% + ISP en la misma factura ──');
const m2=mapearLectura({pr:'FERRALLAS PACO SL',imp:[{b:1000,iv:21,c:210},{b:500,iv:0,c:0,sp:true}],t:1710},ctx);
ok(m2.desglose.length===2,'las DOS bases sobreviven al mapeo y la reparación');
ok(m2.desglose[0].base===1000&&m2.desglose[0].tipo===21,'la base normal conserva su 21%');
ok(m2.desglose[1].base===500&&m2.desglose[1].tipo===0&&m2.desglose[1].sp===true,'la base ISP queda a tipo 0 CON su marca sp');
ok(m2.isp===false,'el ISP global NO se activa: solo era una de las bases');
ok(m2._ispParcial===true,'y la factura queda señalada como ISP PARCIAL');
ok(m2._cuadre&&m2._cuadre.ok===true,'el cuadre da: 1.000 + 210 + 500 = 1.710… y el total impreso 1.710 cuadra al céntimo');
ok(m2.importeBase!==''&&String(m2.base2)==='500','el formulario recibe base y base2');

console.log('── 4 · el ISP global de siempre sigue intacto ──');
const m3=mapearLectura({imp:[{b:800,iv:21,c:0}],t:800,sp:true},ctx);
ok(m3.isp===true&&m3.desglose.every(l=>l.tipo===0),'factura entera en ISP: global true y todo a tipo 0');
ok(!m3._ispParcial,'sin marca de parcial cuando es total');
const m4=mapearLectura({imp:[{b:200,iv:21,c:42},{b:300,iv:10,c:30}],t:572},ctx);
ok(m4.desglose.length===2&&!m4._ispParcial&&m4._cuadre.ok,'dos bases normales (21+10) siguen cuadrando sin marcas');

console.log(fallos?`═══ MAPEO LECTOR: ${fallos} FALLOS ═══`:'═══ MAPEO LECTOR: IBAN FRENADO E ISP POR BASE ═══');
process.exit(fallos?1:0);
