// ═══ IMPORTACIÓN N43 REAL · producción vs actual ═══════════════════════════
// La sesión 4 mudó el almacén de tesorería (n43Res, n43Hist, persistN43…) pero
// la copia no traía ningún extracto, así que el dominio se probaba en vacío.
// Con un extracto real del banco, esta batería hace el circuito entero en los
// DOS bundles y compara byte a byte: leer el fichero, conciliar contra las
// facturas pendientes, aplicar los pagos y guardar el histórico.
//
// EL FICHERO NO VIAJA. Se lee de /mnt/user-data/uploads igual que la copia:
// lleva movimientos, nombres, NIF e IBAN reales y no entra en ningún zip.
import {irA} from './_nav.mjs';
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
import fs from 'fs';

const datos=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const cual=fs.readdirSync('/mnt/user-data/uploads').find(f=>/^C43_.*\.txt$/i.test(f));
if(!cual){console.log('✗ falta el extracto: se espera un C43_*.txt en /mnt/user-data/uploads');process.exit(1);}
const CRUDO=fs.readFileSync('/mnt/user-data/uploads/'+cual);
const FIJO=new Date('2026-08-24T11:00:00Z').getTime();
const azar=(s)=>()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};

async function circuito(ruta){
  const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://bh10group.com/app/',pretendToBeVisual:true});
  for(const k of ['window','document','navigator','localStorage','sessionStorage','HTMLElement','Node','Event','CustomEvent','Blob','File','FileList','URL','atob','btoa','FileReader','getComputedStyle','crypto'])
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
  window.BH10_EMPRESA={sub:'',nombre:'BIG HOUSE 2010'};window.BH10_ROL='admin';window.BH10_PERMISOS=null;
  const escrituras=[];
  const nube={};for(const k of Object.keys(datos.claves))nube[k]=datos.claves[k];
  nube['bh10-ultimacopia']='2026-08-24T09:00:00.000Z';
  window.storage={get:async k=>nube[k]!==undefined?{key:k,value:nube[k]}:null,
    set:async(k,v)=>{escrituras.push([k,String(v).length]);nube[k]=String(v);return{key:k,value:v}},
    delete:async k=>{delete nube[k];return{key:k}},
    list:async p=>({keys:Object.keys(nube).filter(k=>!p||k.startsWith(p))}),
    getStatus:()=>({fase:'ok',error:'',ultimaEscritura:FIJO,errorEscritura:'',pendientes:0,conflicto:null})};
  const {default:App}=await import(ruta);
  const oe=console.error;console.error=()=>{};
  createRoot(document.getElementById('root')).render(React.createElement(App));
  const E=ms=>new Promise(x=>setTimeout(x,ms));
  for(let i=0;i<300;i++){await E(25);if(document.getElementById('root').textContent.includes('Pendiente de pago'))break;}
  await E(800);
  const click=t=>{if(irA(document,t))return true;const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes(t));if(b){b.click();return true;}return false;};
  const texto=()=>document.getElementById('root').textContent;

  click('Facturas');await E(700);
  click('Pendiente');await E(900);
  // el <input type=file> vive dentro del rótulo «Conciliar extracto»
  const inp=[...document.querySelectorAll('input[type=file]')].pop();
  if(!inp){console.error=oe;return{error:'no hay input de fichero'};}
  const fich=new dom.window.File([new Uint8Array(CRUDO)],cual,{type:'text/plain'});
  const pk=Object.keys(inp).find(k=>k.startsWith('__reactProps'));
  inp[pk].onChange({target:{files:[fich],value:''}});
  for(let i=0;i<80;i++){await E(100);if(/operaci[oó]n|movimiento|casad/i.test(texto()))break;}
  await E(900);
  const trasLeer=texto().replace(/\s+/g,' ');
  // La app solo PREMARCA los casados de nivel «seguro». Con este extracto el
  // único casado es «probable», así que no hay nada premarcado y Aplicar no
  // haría nada: eso es correcto, no un fallo. Para ejercitar la escritura se
  // marca a mano, que es lo que haría Jesús al revisar la propuesta.
  const casillas=[...document.querySelectorAll('input[type=checkbox]')];
  let marcadas=0;
  for(const c of casillas.slice(0,3)){
    const k=Object.keys(c).find(x=>x.startsWith('__reactProps'));
    if(k&&c[k].onChange&&!c.checked){c[k].onChange({target:{checked:true}});marcadas++;await E(250);}
  }
  await E(500);
  const nAntes=escrituras.length;
  const aplico=click('✅ Aplicar');
  await E(1600);
  const trasAplicar=texto().replace(/\s+/g,' ');
  const escAplicar=escrituras.slice(nAntes);
  console.error=oe;
  return {trasLeer,trasAplicar,aplico,marcadas,escAplicar,escrituras,
    n43:nube['bh10-n43']||'',facturas:nube['bh10-fc-v3']||'',
    nubeFinal:Object.fromEntries(Object.keys(nube).sort().map(k=>[k,nube[k]]))};
}

const REF=fs.readdirSync('ref_produccion').find(f=>/^bh10-APPV\d+\.js$/.test(f));
const A=await circuito(process.argv[2]||('../ref_produccion/'+REF));
const B=await circuito(process.argv[3]||'../web_subir/app/assets/bh10-APPV397.js');
let fallos=0;
const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};
const nv=t=>String(t).replace(/v3\d\d/g,'vXXX');
if(A.error||B.error){console.log('  ✗ '+(A.error||B.error));process.exit(1);}

ok(nv(A.trasLeer)===nv(B.trasLeer),'pantalla tras LEER el extracto: idéntica ('+B.trasLeer.length+' chars)');
ok(B.aplico,'se pulsa «Aplicar»');
ok(A.marcadas===B.marcadas,'mismas casillas marcadas a mano en ambos ('+B.marcadas+')');
ok(/TRASPASO|casad|operaci/i.test(B.trasLeer),'la pantalla muestra el análisis del extracto');
ok(nv(A.trasAplicar)===nv(B.trasAplicar),'pantalla tras APLICAR: idéntica ('+B.trasAplicar.length+' chars)');
ok(JSON.stringify(A.escAplicar)===JSON.stringify(B.escAplicar),
   'escrituras al aplicar idénticas ('+B.escAplicar.length+': '+[...new Set(B.escAplicar.map(x=>x[0]))].join(', ')+')');
ok(B.escAplicar.some(x=>x[0]==='bh10-n43'),'el histórico N43 se guardó (persistN43, la función mudada)');
ok(B.escAplicar.some(x=>x[0]==='bh10-fc-v3'),'las facturas casadas se marcaron pagadas');
ok(A.n43===B.n43,'histórico N43 final idéntico ('+B.n43.length+' bytes)');
ok(A.facturas===B.facturas,'listado de facturas final idéntico ('+B.facturas.length+' bytes)');
const kA=Object.keys(A.nubeFinal),kB=Object.keys(B.nubeFinal);
const dif=kA.filter(k=>A.nubeFinal[k]!==B.nubeFinal[k]);
ok(kA.length===kB.length&&dif.length===0,'estado final completo de la nube idéntico ('+kB.length+' claves)'+(dif.length?' → difieren: '+dif.join(', '):''));
const m=B.trasLeer.match(/(\d+)\s*operaci/);
console.log('  · conciliación con datos reales: '+(m?m[1]+' operaciones propuestas':'(no se pudo leer el contador)'));
console.log(fallos?`═══ N43 REAL: ${fallos} DIFERENCIAS ═══`:'═══ N43 REAL: CIRCUITO COMPLETO IDÉNTICO A PRODUCCIÓN ═══');
process.exit(fallos?1:0);
