// ═══ BATERÍA DE RETENCIONES DE GARANTÍA (nuevo en v317) ═══
// Motor puro (vencimientos, liquidables, reclamación) + la vista Garantías
// pintando las insignias sin romperse con los datos reales.
import {irA} from './_nav.mjs';
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
import fs from 'fs';
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://bh10group.com/app/',pretendToBeVisual:true});
for(const k of ['window','document','navigator','localStorage','sessionStorage','HTMLElement','Node','Event','CustomEvent','Blob','URL','atob','btoa','FileReader','crypto']){try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
globalThis.window=dom.window;
window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
window.requestAnimationFrame=cb=>setTimeout(cb,0);globalThis.requestAnimationFrame=window.requestAnimationFrame;
window.cancelAnimationFrame=()=>{};globalThis.cancelAnimationFrame=()=>{};
class RO{observe(){}unobserve(){}disconnect(){}}window.ResizeObserver=RO;globalThis.ResizeObserver=RO;
window.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};window.scrollTo=()=>{};
window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
window.BH10_EMPRESA={sub:'',nombre:'BIG HOUSE 2010'};window.BH10_ROL='admin';window.BH10_PERMISOS=null;
let fallos=0;const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};

// ── datos reales + tres certificaciones sintéticas con retención ──
const datos=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const fc=JSON.parse(datos.claves['bh10-fc-v3']);
const HOY='2026-08-23';
const sint=[
 {id:'RG1',tipo:'cobro',numFactura:'F-2025/007',fecha:'2025-06-10',proveedor:'PROMOTORA NORTE SL',obra:'Bloque A',retGarPct:5,retGarImp:2500,retGarDevuelta:false,total:52500,importeBase:50000,pagos:[]},
 {id:'RG2',tipo:'cobro',numFactura:'F-2026/003',fecha:'2026-07-01',proveedor:'PROMOTORA NORTE SL',obra:'Bloque A',retGarPct:5,retGarImp:1800,retGarDevuelta:false,total:37800,importeBase:36000,pagos:[]},
 {id:'RG3',tipo:'cobro',numFactura:'F-2025/011',fecha:'2025-09-15',proveedor:'INMO SUR SA',obra:'Nave 3',retGarPct:5,retGarImp:900,retGarDevuelta:true,retGarFecha:'2026-08-01',total:18900,importeBase:18000,pagos:[]},
];
const invoices=[...fc,...sint];

// ── motor puro por __internos ──
const I=(await import('../web_subir/app/assets/bh10-APPV407.js')).__internos;
ok(typeof I.resumenRetenciones==='function','motor de retenciones en __internos');
const e1=I.estadoRetencion(sint[0],HOY);
ok(e1.vence==='2026-06-10'&&e1.liquidable===true,'F-2025/007: 12 meses → venció el 10-06-2026, LIQUIDABLE ('+e1.dias+' d)');
const e2=I.estadoRetencion(sint[1],HOY);
ok(e2.vence==='2027-07-01'&&e2.liquidable===false&&e2.dias>300,'F-2026/003: garantía viva hasta 2027 ('+e2.dias+' d)');
const R=I.resumenRetenciones(invoices,HOY);
ok(R.totLiquidable>=2500&&R.liquidables.some(i=>i.id==='RG1'),'resumen: liquidable ya incluye los 2.500 € vencidos');
ok(!R.pendientes.some(i=>i.id==='RG3')&&R.devueltas.some(i=>i.id==='RG3'),'las devueltas no cuentan como pendientes');
const txt=I.textoReclamacion('PROMOTORA NORTE SL',[sint[0]],'BIG HOUSE 2010 S.L.');
ok(txt.includes('F-2025/007')&&txt.includes('2.500,00 €')&&txt.includes('TOTAL A DEVOLVER'),'texto de reclamación con factura, importe y total');

// ── la vista Garantías pinta las insignias con datos reales+sintéticos ──
const nube={};for(const k of Object.keys(datos.claves))nube[k]=datos.claves[k];
nube['bh10-fc-v3']=JSON.stringify(invoices);
window.storage={get:async k=>nube[k]!==undefined?{key:k,value:nube[k]}:null,set:async(k,v)=>{nube[k]=String(v);return{key:k,value:v}},delete:async k=>({key:k}),list:async p=>({keys:Object.keys(nube).filter(k=>!p||k.startsWith(p))}),getStatus:()=>({fase:'ok',error:'',ultimaEscritura:Date.now(),errorEscritura:'',pendientes:0,conflicto:null})};
const {default:App}=await import('../web_subir/app/assets/bh10-APPV407.js');
const oe=console.error;console.error=()=>{};
createRoot(document.getElementById('root')).render(React.createElement(App));
const E=ms=>new Promise(r=>setTimeout(r,ms));
await E(1400);
const click=t=>{if(irA(document,t))return true;const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes(t));if(b)b.click();return !!b;};
click('Contratos');await E(900);
click('🛡️ Garantías');await E(900);
console.error=oe;
const t=document.getElementById('root').textContent;
ok(t.includes('Pendiente de devolución'),'la vista Garantías carga');
ok(t.includes('Liquidable ya')&&t.includes('Garantía vencida — reclamable'),'insignias de liquidación pintadas');
ok(t.includes('Garantía hasta'),'las vivas muestran su fecha de vencimiento');
ok([...document.querySelectorAll('button')].some(b=>b.textContent.includes('📋 Reclamar')),'botón Reclamar visible en el cliente con liquidables');
console.log(fallos?'═══ RETENCIONES: '+fallos+' FALLOS ═══':'═══ BATERÍA RETENCIONES: LIQUIDACIÓN COMPLETA VERIFICADA ═══');
process.exit(fallos?1:0);
