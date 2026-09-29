// ═══ INTERRELACIÓN ENTRE ALMACENES · ida y vuelta, y segunda empresa ═══════
// Lo que el pre-vuelo NO comprueba:
//
//  FASE 1 · escribir en TRES dominios distintos en la misma sesión (seguros,
//           veri*factu y seguros/flota), para ver si se pisan entre ellos.
//  FASE 2 · RECARGAR con la nube resultante. Éste es el punto ciego de toda la
//           fase: los estados viven ya en los almacenes, pero el CARGADOR
//           sigue en App. Si esa costura estuviera mal, lo escrito no volvería
//           — y ninguna batería lo miraba, porque todas montan la app una vez
//           y no la vuelven a levantar.
//  FASE 3 · GREEN GENERATION: la segunda empresa nunca se ha probado. Todo lo
//           verificado hasta hoy es con BIG HOUSE.
//
// Todo contra el bundle desplegado, con reloj y azar congelados.
import {irA} from './_nav.mjs';
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
import fs from 'fs';

const datos=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const FIJO=new Date('2026-08-24T11:00:00Z').getTime();
const azar=(s)=>()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};

function entorno(nube){
  const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://bh10group.com/app/',pretendToBeVisual:true});
  for(const k of ['window','document','navigator','localStorage','sessionStorage','HTMLElement','Node','Event','CustomEvent','Blob','File','URL','atob','btoa','FileReader','getComputedStyle','crypto'])
    {try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
  globalThis.window=dom.window;
  const DR=Date;globalThis.Date=dom.window.Date=class extends DR{constructor(...a){a.length?super(...a):super(FIJO);}static now(){return FIJO;}};
  const r=azar(20260824);Math.random=r;dom.window.Math.random=r;
  window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
  window.requestAnimationFrame=cb=>setTimeout(cb,0);globalThis.requestAnimationFrame=window.requestAnimationFrame;
  window.cancelAnimationFrame=()=>{};globalThis.cancelAnimationFrame=()=>{};
  class RO{observe(){}unobserve(){}disconnect(){}}window.ResizeObserver=RO;globalThis.ResizeObserver=RO;
  window.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};window.scrollTo=()=>{};
  window.confirm=()=>true;window.prompt=()=>'';window.alert=()=>{};
  window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
  window.BH10_ROL='admin';window.BH10_PERMISOS=null;
  nube['bh10-ultimacopia']='2026-08-24T09:00:00.000Z';
  window.storage={get:async k=>nube[k]!==undefined?{key:k,value:nube[k]}:null,
    set:async(k,v)=>{nube[k]=String(v);return{key:k,value:v}},
    delete:async k=>{delete nube[k];return{key:k}},
    list:async p=>({keys:Object.keys(nube).filter(k=>!p||k.startsWith(p))}),
    getStatus:()=>({fase:'ok',error:'',ultimaEscritura:FIJO,errorEscritura:'',pendientes:0,conflicto:null})};
  return dom;
}
const E=ms=>new Promise(x=>setTimeout(x,ms));
const util=()=>({
  click:t=>{if(irA(document,t))return true;const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes(t));if(b){b.click();return true;}return false;},
  pon:(el,v)=>{const k=Object.keys(el).find(x=>x.startsWith('__reactProps'));if(k&&el[k].onChange)el[k].onChange({target:{value:String(v)}});},
  txt:()=>document.getElementById('root').textContent,
});
async function montar(ruta,nube,empresa){
  entorno(nube);
  window.BH10_EMPRESA=empresa;
  const {default:App}=await import(ruta);
  const oe=console.error;console.error=()=>{};
  const root=createRoot(document.getElementById('root'));
  root.render(React.createElement(App));
  for(let i=0;i<320;i++){await E(25);if(document.getElementById('root').textContent.length>2500)break;}
  await E(1200);
  console.error=oe;
  return root;
}

async function guion(ruta){
  const nube={};for(const k of Object.keys(datos.claves))nube[k]=datos.claves[k];
  // ── FASE 1 · tres dominios en la misma sesión ──
  let root=await montar(ruta,nube,{sub:'',nombre:'BIG HOUSE 2010'});
  const U=util();
  U.click('Seguros');await E(1000);
  const bajas=[...document.querySelectorAll('button')].filter(x=>/🗑|Baja|✖/.test(x.textContent));
  if(bajas.length){bajas[0].click();await E(900);}
  const polizasTrasBaja=nube['bh10-polizas']||'';
  U.click('Seguros');await E(600);U.click('🚐 Vehículos');await E(700);
  const mas=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='+ Añadir');
  if(mas){mas.click();await E(800);}
  const iv=[...document.querySelectorAll('input')];
  for(const [ph,v] of [['Furgón obra','FURGO INTERRELACION'],['1234-ABC','9999XYZ']]){
    const el=iv.find(i=>(i.placeholder||'').includes(ph)); if(el){U.pon(el,v);await E(200);}
  }
  U.click('💾 Guardar');await E(900);
  const flotaTrasAlta=nube['bh10-flota']||'';
  U.click('Ajustes');await E(900);U.click('Registro VERI*FACTU');await E(900);
  const ivf=[...document.querySelectorAll('input')].find(i=>i.type==='text'&&String(i.value||'').startsWith('https'));
  if(ivf){U.pon(ivf,'https://bh10group.com/aeat/enviar');await E(800);}
  const vfTras=nube['bh10-vfcfg']||'';
  const trasFase1=U.txt().replace(/\s+/g,' ').slice(0,4000);
  root.unmount();await E(200);

  // ── FASE 2 · RECARGA con esa misma nube: ¿vuelve lo escrito? ──
  const nube2=JSON.parse(JSON.stringify(nube));
  root=await montar(ruta,nube2,{sub:'',nombre:'BIG HOUSE 2010'});
  const V=util();
  V.click('Seguros');await E(1000);
  const traeVeh=/9999XYZ|FURGO INTERRELACION/.test((()=>{V.click('🚐 Vehículos');return '';})()||'')||false;
  await E(800);
  const pantallaVeh=V.txt();
  V.click('🛡️ Pólizas');await E(700);
  const pantallaPol=V.txt().replace(/\s+/g,' ').slice(0,4000);
  V.click('Ajustes');await E(800);V.click('Registro VERI*FACTU');await E(800);
  const pantallaVf=V.txt().replace(/\s+/g,' ').slice(0,4000);
  const recarga={polizas:nube2['bh10-polizas']||'',flota:nube2['bh10-flota']||'',vfcfg:nube2['bh10-vfcfg']||'',
                 pantallaVeh:pantallaVeh.replace(/\s+/g,' ').slice(0,4000),pantallaPol,pantallaVf};
  root.unmount();await E(200);

  // ── FASE 3 · segunda empresa ──
  const nube3={};for(const k of Object.keys(datos.claves))nube3[k]=datos.claves[k];
  root=await montar(ruta,nube3,{sub:'GREEN',nombre:'GREEN GENERATION BUILDING'});
  const G=util();
  const green={};
  green.inicio=document.getElementById('root').innerHTML;
  for(const v of ['Facturas','Contratos','Nóminas','Seguros','Ajustes','Panel']){G.click(v);await E(700);green[v]=document.getElementById('root').innerHTML;}
  root.unmount();await E(200);

  return {polizasTrasBaja,flotaTrasAlta,vfTras,trasFase1,recarga,green};
}

const REF=fs.readdirSync('ref_produccion').find(f=>/^bh10-APPV\d+\.js$/.test(f));
const A=await guion(process.argv[2]||('../ref_produccion/'+REF));
const B=await guion(process.argv[3]||'../web_subir/app/assets/bh10-APPV397.js');
let fallos=0;
const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};
const nv=t=>String(t).replace(/v3\d\d/g,'vXXX');

console.log('── FASE 1 · tres dominios en la misma sesión');
ok(A.polizasTrasBaja===B.polizasTrasBaja&&B.polizasTrasBaja.length>100,'seguros: pólizas tras la baja idénticas ('+B.polizasTrasBaja.length+' bytes)');
ok(A.flotaTrasAlta===B.flotaTrasAlta,'seguros: flota tras el alta idéntica ('+B.flotaTrasAlta.length+' bytes)');
ok(A.vfTras===B.vfTras&&B.vfTras.length>50,'veri*factu: configuración idéntica ('+B.vfTras.length+' bytes)');
ok(nv(A.trasFase1)===nv(B.trasFase1),'pantalla tras tocar los tres dominios: idéntica');

console.log('── FASE 2 · RECARGA (la costura almacén ↔ cargador de App)');
ok(A.recarga.polizas===B.recarga.polizas,'la nube de pólizas sobrevive a la recarga idéntica en ambos');
ok(A.recarga.flota===B.recarga.flota,'la nube de flota sobrevive a la recarga idéntica en ambos');
ok(A.recarga.vfcfg===B.recarga.vfcfg,'la nube de veri*factu sobrevive a la recarga idéntica en ambos');
ok(/9999XYZ|FURGO INTERRELACION/.test(B.recarga.pantallaVeh),'AL RECARGAR, el vehículo creado VUELVE a pantalla');
ok(nv(A.recarga.pantallaVeh)===nv(B.recarga.pantallaVeh),'pantalla de vehículos tras recargar: idéntica');
ok(nv(A.recarga.pantallaPol)===nv(B.recarga.pantallaPol),'pantalla de pólizas tras recargar: idéntica');
ok(nv(A.recarga.pantallaVf)===nv(B.recarga.pantallaVf),'pantalla de veri*factu tras recargar: idéntica');

console.log('── FASE 3 · GREEN GENERATION BUILDING (segunda empresa)');
for(const k of Object.keys(B.green)){
  const a=nv(A.green[k]),b=nv(B.green[k]);
  ok(a===b,`GREEN · ${k}: idéntica (${b.length} bytes)`);
}
console.log(fallos?`═══ INTERRELACIÓN: ${fallos} DIFERENCIAS ═══`:'═══ INTERRELACIÓN: IDA, VUELTA Y SEGUNDA EMPRESA IDÉNTICAS ═══');
process.exit(fallos?1:0);
