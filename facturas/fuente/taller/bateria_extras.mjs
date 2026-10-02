// ═══ BATERÍA DE PARTIDAS EXTRA · gasto no previsto sobre un contrato ═══════
// Por qué existe: con precio cerrado (art. 1593 CC) un extra solo se cobra si
// hubo cambio Y el promotor lo autorizó. Lo que decide si se cobra o se pierde
// no es la suma de facturas: es el respaldo. Un error aquí no da una pantalla
// fea, da dinero gastado que no se factura.
//
// Datos reales: el contrato P-2026/009 (obra UE24) lleva un extra «Vaciado no
// previsto» de EXCAVACIONES ILLESCAS, 25.940,00 €, en estado detectado y SIN
// NADA POR ESCRITO. Ése es el ancla.
//
// Parte A · las reglas, con los datos reales y con los casos que ya mordieron
//           (leer «base» en vez de importeBase daba 0,00 € en una de 13.296 €).
// Parte B · de punta a punta en pantalla: la tarjeta del contrato tiene que
//           enseñar la cifra y el aviso de que no hay respaldo.
import {irA} from './_nav.mjs';
import fs from 'fs';
import os from 'os';
import path from 'path';
import esbuild from 'esbuild';
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';

const datos=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const contratos=JSON.parse(datos.claves['bh10-contratos']);
const invoices=JSON.parse(datos.claves['bh10-fc-v3']);
let fallos=0;
const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};
const eq=(a,b,m)=>ok(a===b,`${m} → ${a}${a===b?'':' (esperado '+b+')'}`);

// ── el módulo se empaqueta al vuelo: sus imports son sin extensión ──
const tmp=path.join(os.tmpdir(),'_bh10_extras_'+process.pid+'.mjs');
await esbuild.build({entryPoints:['src/extras.js'],bundle:true,format:'esm',outfile:tmp,logLevel:'error'});
const X=await import(tmp);

const CONTRATO=contratos.find(c=>Array.isArray(c.extras)&&c.extras.length);
const EXTRA=CONTRATO.extras[0];
const FACT=invoices.find(i=>String(i.id)===String(EXTRA.facturas[0]));
const ANCLA=25940;

console.log('── A · REGLAS DE NEGOCIO ──────────────────────────────────────');
ok(!!CONTRATO&&CONTRATO.numero==='P-2026/009',`contrato real localizado: ${CONTRATO.numero} · obra ${CONTRATO.obra}`);
ok(!!FACT,`factura del extra: ${FACT&&FACT.numFactura} · ${FACT&&String(FACT.proveedor).slice(0,28)}`);

// 1 · el importe sale de importeBase (+ basesExtra), NUNCA de «base»
eq(X.baseFactura(FACT),ANCLA,'baseFactura de la factura real');
eq(X.baseFactura({importeBase:10000,basesExtra:[{base:3296}]}),13296,'baseFactura suma las bases con otro IVA');
eq(X.baseFactura({base:13296}),0,'baseFactura NO lee el campo «base» (el fallo de los 13.296 €)');
eq(X.baseFactura({importeBase:500,esAbono:true}),-500,'un abono resta, no suma');

// 2 · la parte de la factura que cuenta como extra
eq(X.parteExtra(EXTRA,FACT),ANCLA,'sin parte anotada cuenta la factura entera');
eq(X.parteExtra({partes:{[FACT.id]:'sin datos'}},FACT),ANCLA,'un texto sin cifras cuenta la factura entera');
eq(X.parteExtra({partes:{[FACT.id]:'0'}},FACT),0,'un cero escrito a propósito SÍ vale cero');
eq(X.parteExtra({partes:{[FACT.id]:'1.234,56'}},FACT),1234.56,'una parte en formato español se lee bien');
ok(X.estaPartida({partes:{[FACT.id]:'1.234,56'}},FACT)&&!X.estaPartida(EXTRA,FACT),'estaPartida distingue partida de entera');

// 3 · coste, precio y margen
eq(X.costeExtra(EXTRA,invoices),ANCLA,'costeExtra del extra real');
eq(X.precioExtra(EXTRA,invoices),ANCLA,'precioExtra sin margen = coste');
eq(X.precioExtra({...EXTRA,margen:'10'},invoices),+(ANCLA*1.1).toFixed(2),'un margen del 10% se aplica');
eq(X.precioExtra({...EXTRA,margen:'10',precioFijo:'30000'},invoices),30000,'el precio fijo manda sobre el margen');

// 4 · el resumen: lo que duele es lo gastado sin respaldo
const R=X.resumenExtras(CONTRATO,invoices);
eq(R.n,1,'resumen: número de extras');
eq(R.coste,ANCLA,'resumen: coste');
eq(R.sinRespaldo,ANCLA,`resumen: SIN NADA POR ESCRITO (prueba='${EXTRA.prueba||'vacía'}')`);
eq(R.pendientes,ANCLA,'resumen: pendiente de negociar (estado detectado)');
eq(X.resumenExtras({extras:[{...EXTRA,prueba:'escrito'}]},invoices).sinRespaldo,0,'con respaldo por escrito deja de contar');
eq(X.resumenExtras({extras:[{...EXTRA,prueba:'verbal'}]},invoices).sinRespaldo,ANCLA,'«de palabra» sigue contando como sin respaldo');
eq(X.resumenExtras({extras:[{...EXTRA,estado:'rechazado'}]},invoices).sinRespaldo,0,'un extra rechazado ya no cuenta como riesgo');

// 5 · el mismo gasto no puede cobrarse dos veces
ok(X.facturasYaExtra(contratos).has(String(FACT.id)),'la factura consta como ya imputada a un extra');
eq(X.parteYaExtra(FACT,contratos),ANCLA,'parteYaExtra la descuenta del gasto corriente');
const halla=X.extraDeFactura(FACT.id,contratos);
ok(halla&&halla.contrato.numero===CONTRATO.numero,'extraDeFactura da con su contrato');
const otro={id:'c-falso',obra:CONTRATO.obra,extras:[]};
const cand=X.candidatasExtra(otro,invoices,contratos);
ok(!cand.marcadas.concat(cand.deObra).some(f=>String(f.id)===String(FACT.id)),
   'esa factura NO se ofrece como candidata en otro contrato (no se cobra dos veces)');
ok(!cand.marcadas.concat(cand.deObra).some(f=>f.tipo==='emitida'),'no se ofrecen facturas emitidas');
const anuladas=cand.marcadas.concat(cand.deObra).filter(f=>f.anulada||f.esAnulada||f.estadoVf==='anulada');
eq(anuladas.length,0,'no se ofrecen facturas anuladas');

// 6 · la misma obra escrita de dos maneras
ok(X.mismaObra('UE24','OBRA UE24 FASE 1'),'mismaObra: «UE24» y «OBRA UE24 FASE 1» son la misma');
ok(X.mismaObra('Carranque 2 fase','OBRA CARRANQUE'),'mismaObra: Carranque en las dos formas');
ok(!X.mismaObra('UE24','OBRA ILLESCAS CARVIER'),'mismaObra: dos obras distintas NO se confunden');

// 7 · el desglose por proveedor que él quiere ver
const provs=X.proveedoresDeExtras(CONTRATO,invoices);
eq(provs.length,1,'proveedoresDeExtras: un proveedor');
eq(provs[0].total,ANCLA,`proveedoresDeExtras: total de ${String(provs[0].proveedor).slice(0,28)}`);
ok(provs[0].facturas[0]._estado==='detectado'&&provs[0].facturas[0]._gasto===EXTRA.concepto,
   'cada factura lleva de qué gasto es y cómo va');

console.log('── B · DE PUNTA A PUNTA EN PANTALLA ───────────────────────────');
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://bh10group.com/app/',pretendToBeVisual:true});
for(const k of ['window','document','navigator','localStorage','sessionStorage','HTMLElement','Node','CustomEvent','Event','FileReader','Blob','URL','atob','btoa','getComputedStyle','crypto']){try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
globalThis.window=dom.window;
window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
window.requestAnimationFrame=cb=>setTimeout(cb,0);globalThis.requestAnimationFrame=window.requestAnimationFrame;
window.cancelAnimationFrame=()=>{};globalThis.cancelAnimationFrame=()=>{};
class RO{observe(){}unobserve(){}disconnect(){}}window.ResizeObserver=RO;globalThis.ResizeObserver=RO;
window.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};window.scrollTo=()=>{};
window.confirm=()=>true;window.prompt=()=>'';window.alert=()=>{};
window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
window.BH10_EMPRESA={sub:'',nombre:'BIG HOUSE 2010'};window.BH10_ROL='admin';window.BH10_PERMISOS=null;
const nube={};for(const k of Object.keys(datos.claves))nube[k]=datos.claves[k];
window.storage={get:async k=>nube[k]!==undefined?{key:k,value:nube[k]}:null,
  set:async(k,v)=>{nube[k]=String(v);return{key:k,value:v}},
  delete:async k=>{delete nube[k];return{key:k}},
  list:async p=>({keys:Object.keys(nube).filter(k=>!p||k.startsWith(p))}),
  getStatus:()=>({fase:'ok',error:'',ultimaEscritura:Date.now(),errorEscritura:'',pendientes:0,conflicto:null})};
const {default:App}=await import('../web_subir/app/assets/bh10-APPV402.js');
const oe=console.error;console.error=()=>{};
createRoot(document.getElementById('root')).render(React.createElement(App));
const E=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<240;i++){await E(25);if(document.getElementById('root').textContent.includes('Pendiente de pago'))break;}
await E(700);
const pulsa=t=>{if(irA(document,t))return true;const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes(t));if(b){b.click();return true;}return false;};
const texto=()=>document.getElementById('root').textContent;

ok(pulsa('Contratos'),'navega a Contratos');await E(1100);
const btnEx=[...document.querySelectorAll('button')].filter(b=>b.textContent.includes('➕ Extras'));
ok(btnEx.length>0,`la tarjeta del contrato enseña el botón de extras (${btnEx.length})`);
const conCifra=btnEx.find(b=>/25\.940/.test(b.textContent));
ok(!!conCifra,'el botón lleva la cifra del extra a la vista, sin entrar: 25.940,00 €');
ok(/25\.940/.test(texto()),'la cifra aparece en la pantalla de Contratos');
// La frase «sin nada por escrito» vive en CINCO sitios (incluida la etiqueta
// fija de PRUEBAS_EXTRA). Buscarla suelta deja pasar mutaciones: hay que
// exigirla PEGADA A LA CIFRA, y en los dos sitios donde sale.
const AVISO=/⚠\s*25\.940,00\s*€\s*sin nada por escrito/;
ok(/➕ Gasto extra · 1 partida/.test(texto()),'la tarjeta resume el gasto extra: 1 partida');
ok(AVISO.test(texto()),'⚠ la TARJETA avisa: 25.940,00 € sin nada por escrito');
if(conCifra){conCifra.click();await E(900);}
const t=texto();
ok(t.includes(EXTRA.concepto),`la ventana de extras abre y muestra «${EXTRA.concepto}»`);
ok(/25\.940,00\s*€\s*gastados sin nada por escrito/.test(t),
   '⚠ la VENTANA avisa: 25.940,00 € gastados sin nada por escrito');
ok(/EXCAVACIONES/i.test(t),'aparece el proveedor del gasto');

console.error=oe;
try{fs.unlinkSync(tmp);}catch(e){}
console.log(fallos?`═══ BATERÍA EXTRAS: ${fallos} FALLOS ═══`:'═══ BATERÍA EXTRAS: REGLAS Y PANTALLA EN VERDE · ancla 25.940,00 € ═══');
process.exit(fallos?1:0);
