// ═══ BATERÍA DEL QR VERI*FACTU (recompuesto en v317) ═══
// Antes vfQrDataUrl devolvía '' en silencio (import('qrcode') sin resolver):
// las facturas registradas se guardaban SIN el QR de cotejo de la AEAT.
// Ahora: PNG con canvas (navegador) o SVG vectorial de respaldo. Nunca vacío.
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://bh10group.com/app/'});
for(const k of ['window','document','navigator','localStorage','sessionStorage','HTMLElement','Node','Event','CustomEvent','Blob','URL','atob','btoa','FileReader','crypto']){try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
globalThis.window=dom.window;
window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
window.storage={get:async()=>null,set:async(k,v)=>({key:k,value:v}),delete:async k=>({key:k}),list:async()=>({keys:[]}),getStatus:()=>({fase:'ok'})};
const I=(await import('../web_subir/app/assets/bh10-APPV402.js')).__internos;
let fallos=0;const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};
ok(typeof I.vfQrDataUrl==='function'&&typeof I.vfUrlCotejo==='function','vfQrDataUrl y vfUrlCotejo en __internos');
const reg={idEmisor:'B45731981',numSerie:'F-2026/001',fechaExpedicion:'23-08-2026',importeTotal:1210};
const url=I.vfUrlCotejo(reg,'pruebas');
ok(url.includes('nif=B45731981')&&url.includes('numserie=F-2026%2F001')&&url.includes('importe=1210.00'),
   'URL de cotejo AEAT bien formada');
const oe=console.error;console.error=()=>{};
const qr=await I.vfQrDataUrl(url);
const esPng=qr.startsWith('data:image/png;base64,');
const esSvg=qr.startsWith('data:image/svg+xml');
ok(esPng||esSvg,'genera imagen (antes: cadena vacía) → '+qr.slice(0,28)+'…');
if(esPng){
  const png=Buffer.from(qr.split(',')[1]||'','base64');
  ok(png.length>400&&png[0]===0x89&&png[1]===0x50,'PNG real ('+png.length+' bytes)');
}else{
  const svg=decodeURIComponent(qr.split(',')[1]||'');
  ok(svg.includes('<svg')&&svg.includes('<path')&&svg.length>500,'SVG real ('+svg.length+' chars, con trazado)');
}
const qr2=await I.vfQrDataUrl(url);
ok(qr===qr2&&qr.length>100,'determinista: dos llamadas, mismo QR');
const qr3=await I.vfQrDataUrl(url+'&x=1');
ok(qr3!==qr&&qr3.length>100,'texto distinto → QR distinto');
console.error=oe;

// ── v360 · el sello VERI*FACTU también en el PDF ──────────────────────────
// Jesús (04-09-2026): «veo el QR con el CSV en la aplicación, pero luego ese
// sello no está en el PDF generado».
await I.vfCargarQR();
const mods=I.vfQrModulos(url);
ok(Array.isArray(mods)&&mods.length>=21&&mods.length<=57&&mods.every(f=>f.length===mods.length),`matriz QR síncrona ${mods?mods.length:'—'}×${mods?mods.length:'—'} tras cargar el módulo`);
ok(mods&&mods[0].slice(0,7).every(Boolean)&&mods[6].slice(0,7).every(Boolean)&&!mods[1][1]&&mods[3][3],'patrón de posición arriba-izquierda (7×7) correcto');
const datos=I.vfDatosPdf({...reg,csv:'A-VDDVL3W8EBK8JG',enviadoEn:'2026-09-02',huella:'BD33B85C90AC79AC9DB47D79FF478DB7C0BB6DB893578A7FBB5BDF9128A34D41'},'pruebas','completo');
ok(datos&&datos.csv==='A-VDDVL3W8EBK8JG'&&/comunicada el 02\/09\/2026/.test(datos.estado)&&datos.huella.length===64&&datos.url===url&&datos.modulos.length===mods.length,'vfDatosPdf: CSV, estado, huella completa, URL y matriz');
ok(I.vfDatosPdf({...reg,huella:'BD33B85C90AC79AC9DB47D79FF478DB7C0BB6DB893578A7FBB5BDF9128A34D41'},'pruebas','resumido').huella.length===25,'huella recortada en modo resumido');
ok(I.vfDatosPdf(null,'pruebas')===null&&I.vfDatosPdf({},'pruebas')===null,'sin registro → sin sello');
const base={tipo:'FACTURA',numero:'2600056',fecha:'02/09/2026',emisor:{name:'BIG HOUSE 2010, S.L.',cif:'B45731981',address:'CL NEON, 12',city:'45200 - ILLESCAS'},receptor:{name:'INMOPROCONSA, SL',cif:'B56191265',dir:''},obra:'Carranque',items:[{desc:'Certificación nº3',qty:'1',base:'68.250,00 €',imp:'68.250,00 €'}],base:'68.250,00 €',ivaLabel:'IVA 21%',ivaImp:'',total:'68.250,00 €',isSP:true,iban:'ES9130810086153128980228',bic:'ERSVES22XXX',formaPago:'Transferencia',notas:'',footer:'BIG HOUSE 2010, S.L. · CIF: B45731981 · BH10 v360'};
const sin=I.buildInvoicePdf(base).build();const con=I.buildInvoicePdf({...base,vf:datos}).build();
const txt=(b)=>typeof b==='string'?b:Buffer.from(b).toString('latin1');
const ts=txt(sin),tc=txt(con);
ok(!/VERI\*FACTU/.test(ts)&&/VERI\*FACTU/.test(tc),'el PDF con registro lleva el rótulo VERI*FACTU; sin registro, no');
ok(/A-VDDVL3W8EBK8JG/.test(tc)&&/ValidarQR/.test(tc)&&/BD33B85C90AC79AC/.test(tc),'CSV, URL de cotejo y huella dentro del PDF');
const negros=(tc.match(/0 0 0 rg/g)||[]).length,negrosSin=(ts.match(/0 0 0 rg/g)||[]).length;
const llenos=mods.flat().filter(Boolean).length;
const tramos=mods.reduce((s,f)=>s+f.reduce((a,v,k)=>a+(v&&!f[k-1]?1:0),0),0);
ok(negros-negrosSin===tramos&&tramos<llenos,`el QR va como ${tramos} rectángulos vectoriales negros (uno por tramo de módulos llenos; ${llenos} módulos)`);
ok(con.length>sin.length&&con.length-sin.length<200000,`el PDF crece lo justo (${con.length-sin.length} bytes)`);

console.log(fallos?'═══ QR: '+fallos+' FALLOS ═══':'═══ BATERÍA QR: RECOMPUESTO Y FUNCIONANDO ═══');
process.exit(fallos?1:0);
