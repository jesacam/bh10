// ═══ A/B UNITARIO DEL CIRCUITO DE EMBARGOS (vía __internos) ═══
// Con la ficha REAL de RINCON MUÑOZ (juzgado, IBAN, diligencia):
//  T1 · sin nómina leída → el sistema AVISA y no gira nada (lo que pediste)
//  T2 · con la nómina leída (335,53 €) → transferencia al juzgado, junto al resto
//  T3 · tramos legales del art. 607 LEC
import fs from 'fs';
const datos=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const emp=JSON.parse(datos.claves['bh10-employees']);
const RINCON=emp.find(e=>String(e.nombre||'').includes('RINCON'));
// las funciones puras no tocan window, pero el módulo entero sí al evaluarse
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://bh10group.com/app/'});
for(const k of ['window','document','navigator','localStorage','sessionStorage','HTMLElement','Node','Event','CustomEvent','Blob','URL','atob','btoa','FileReader']){try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
globalThis.window=dom.window;
window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
window.storage={get:async()=>null,set:async(k,v)=>({key:k,value:v}),delete:async k=>({key:k}),list:async()=>({keys:[]}),getStatus:()=>({fase:'ok'})};
const A=(await import('../ref/bh10-REF313.js')).__internos;
const B=(await import('../web_subir/app/assets/bh10-APPV400.js')).__internos;
let fallos=0;const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};
const J=x=>JSON.stringify(x);
ok(!!A&&!!B&&typeof A.transferenciasEmbargo==='function','__internos disponible en ambos bundles');

// T1 — ficha real SIN nómina leída → aviso
// La copia del 27 YA trae embargoLeido (agosto, 53,70 €): Jesús procesó la
// nómina entre copias. T1 recrea su premisa quitándolo, en vez de depender
// del estado de la instantánea.
const R1={...RINCON};delete R1.embargoLeido;
const t1a=A.transferenciasEmbargo([R1]), t1b=B.transferenciasEmbargo([R1]);
ok(J(t1a)===J(t1b),'T1 idéntico en ambos');
ok(t1a.length===1&&t1a[0].invalido===true&&/sin nómina leída/.test(t1a[0].motivo),
   'T1: sin PDF leído el sistema AVISA: «'+(t1a[0]&&t1a[0].motivo||'').slice(0,70)+'…»');

// T2 — con la nómina leída del mes → transferencia al juzgado
const R2={...RINCON,embargoLeido:{imp:335.53,periodo:'2026-07'}};
const t2a=A.transferenciasEmbargo([R2]), t2b=B.transferenciasEmbargo([R2]);
ok(J(t2a)===J(t2b),'T2 idéntico en ambos');
const tr=t2a.find(x=>!x.invalido&&!x.cancelado);
ok(!!tr&&Math.abs((tr.importe||tr.imp||0)-335.53)<0.01,'T2: gira 335,53 € (importe de la nómina leída)');
ok(!!tr&&String(tr.iban||'').replace(/\s/g,'')==='ES5500493569920005001274','T2: al IBAN del juzgado de la diligencia');
ok(!!tr&&/EJECUCION FORZOSA/.test(J(tr)),'T2: con la referencia de la ejecución forzosa');

// T2b — la nómina del mes ya no trae embargo → cancelado
const R3={...RINCON,embargoLeido:{imp:0,periodo:'2026-08'}};
const t3a=A.transferenciasEmbargo([R3]), t3b=B.transferenciasEmbargo([R3]);
ok(J(t3a)===J(t3b)&&t3a[0]&&t3a[0].cancelado===true,'T2b: si el PDF ya no trae embargo, se da por cancelado (idéntico)');

// T3 — tramos del 607 LEC
const c1a=A.calcEmbargo607(1800,1134), c1b=B.calcEmbargo607(1800,1134);
ok(J(c1a)===J(c1b),'T3 idéntico en ambos');
ok(Math.abs(c1a.retenible-199.8)<0.01,'T3: líquido 1.800 con SMI 1.134 → retenible 199,80 € (30% del exceso)');
const c2a=A.calcEmbargo607(900,1134);
ok(c2a.retenible===0,'T3b: por debajo del SMI no se retiene nada');

console.log(fallos?'═══ EMBARGOS: '+fallos+' FALLOS ═══':'═══ BATERÍA EMBARGOS: CIRCUITO COMPLETO VERIFICADO ═══');
process.exit(fallos?1:0);
