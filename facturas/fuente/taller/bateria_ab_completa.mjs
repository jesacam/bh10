// A/B DEFINITIVO monolito v313 vs modular v314, con los datos reales:
// el texto pintado debe ser IDÉNTICO carácter a carácter en:
//   1) Panel completo (IVAs, balance, vencido, pendiente, contadores)
//   2) Ventana de tesorería abierta (previsión 6 meses)
//   3) Vista de facturas (cabecera y saldos)
//   4) Vista de contratos, nóminas y seguros
import {irA} from './_nav.mjs';
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
import fs from 'fs';
import {explicarDelta,PATRON_NUEVO,normAjustesTexto} from './_delta.mjs';
const d=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const CLAVES=['bh10-fc-v3','bh10-contratos','bh10-nominas','bh10-polizas','bh10-remesas','bh10-provcat','bh10-clicat','bh10-employees','bh10-company-v2','bh10-kpis','bh10-payroll-hist','bh10-budgets'];
async function capturar(ruta){
  const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://bh10group.com/app/',pretendToBeVisual:true});
  for(const k of ['window','document','navigator','localStorage','sessionStorage','HTMLElement','Node','CustomEvent','Event','FileReader','Blob','URL','atob','btoa','getComputedStyle']){try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
  globalThis.window=dom.window;
  window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
  window.requestAnimationFrame=cb=>setTimeout(cb,0);globalThis.requestAnimationFrame=window.requestAnimationFrame;
  window.cancelAnimationFrame=()=>{};globalThis.cancelAnimationFrame=()=>{};
  class RO{observe(){}unobserve(){}disconnect(){}}window.ResizeObserver=RO;globalThis.ResizeObserver=RO;
  window.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};window.scrollTo=()=>{};
  window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
  window.BH10_EMPRESA={sub:'',nombre:'BIG HOUSE 2010'};window.BH10_ROL='admin';window.BH10_PERMISOS=null;
  const nube={};for(const k of CLAVES)if(d.claves[k]!==undefined)nube[k]=d.claves[k];
  // La copia de seguridad NO exporta bh10-ultimacopia: no está en CLAVES_COPIA
  // porque es un dato del dispositivo, no de la contabilidad. En el móvil sí
  // existe. Sin sembrarla, el arnés dispara el aviso de «no has hecho ninguna
  // copia» con un setTimeout de 4,5 s que arranca detrás de un fetch de red:
  // cae dentro o fuera de la foto según lo que tarde cada montaje, y hacía que
  // el MISMO bundle difiriese de sí mismo. No tapa nada: corrige un
  // laboratorio que no reflejaba la realidad.
  nube['bh10-ultimacopia']='2026-08-24T09:00:00.000Z';
  window.storage={get:async k=>nube[k]!==undefined?{key:k,value:nube[k]}:null,set:async(k,v)=>{nube[k]=String(v);return{key:k,value:v}},delete:async k=>{delete nube[k];return{key:k}},list:async p=>({keys:Object.keys(nube).filter(k=>!p||k.startsWith(p))}),getStatus:()=>({fase:'ok',error:'',ultimaEscritura:Date.now(),errorEscritura:'',pendientes:0,conflicto:null})};
  const {default:App}=await import(ruta);
  const root=createRoot(document.getElementById('root'));
  const oe=console.error;console.error=()=>{};
  root.render(React.createElement(App));
  const espera=ms=>new Promise(r=>setTimeout(r,ms));
  // v378 · las esperas fijas hacían que, bajo carga, un lado fotografiara una
  // pantalla y el otro OTRA: salía una «diferencia» que no existía (y, peor,
  // podría haber tapado una de verdad). Ahora se espera a que la pantalla
  // enseñe su marca, y solo entonces se fotografía. Si no llega, se dice.
  const esperarPantalla=async(marca,ms=6000)=>{
    const t0=Date.now();
    while(Date.now()-t0<ms){
      if(document.getElementById('root').textContent.includes(marca))return true;
      await espera(120);
    }
    return false;
  };
  for(let i=0;i<200;i++){await espera(25);if(document.getElementById('root').textContent.includes('Pendiente de pago'))break;}
  await espera(500);
  const norm=t=>t.replace(/\s+/g,' ').replace(/v3\d+/g,'vXXX').trim();
  // v376 · el rótulo «Panel · N casetas» lleva un número DERIVADO de cuántas
  // casetas hay declaradas; al añadir el buzón cambia por definición. No es un
  // cambio de contenido: las casetas visibles se comparan igual, una a una,
  // en el resto de la foto. Se neutraliza el número en los DOS lados para que
  // el comparador no lo cante cada vez que se añade una caseta.
  const normCasetas=t=>t.replace(/Panel · \d+ casetas/g,'Panel · N casetas');
  // Y la caseta del buzón se quita de los DOS lados antes de comparar, igual
  // que se hace con las barras de navegación: es una caseta nueva y entera, y
  // que exista lo comprueba su propia batería. Así el resto del panel —los
  // importes, que es lo que no puede cambiar— se compara intacto.
  const normBuzon=t=>t.replace(/📥 Buzón\d+(sin novedades|[^⚠📊]{0,80})/g,'');
  // v369 (06-09-2026) · la previsión de tesorería tiene desde v348 un MOTOR
  // distinto al de la referencia (presupuesto anual de personal, SS aprendida
  // o incluida en el presupuesto, pagas extra y modelo 111 por caja). Mientras
  // producción tuvo recurrentes aprendidos los dos motores coincidían en
  // números y el A/B no lo veía; con la copia del 06-09 (sin recurrentes y con
  // presupuesto de personal configurado) divergen A PROPÓSITO. Los NÚMEROS del
  // motor los vigila su batería propia (bateria_presupuesto); aquí se exige que
  // el bloque exista en las dos fotos y se compara TODO lo demás.
  // …y las BARRAS de navegación recolocadas en v364 («se quitan de los DOS
  // lados antes de comparar», mismo principio que normNavegacion en el A/B de
  // marcado): subpestañas de Facturas ↔ barra de Tesorería, y barra inferior.
  const normBarras=t=>t
    .replace(/📥 Recibidas\(\d+\)📤 Emitidas\(\d+\)👤 Clientes🏪 Proveedores🏗️ Obras💰 Pendiente🏦 Remesas\(\d+\)/,'<BARRA>')
    .replace(/🏦 Remesas prov\.💶 Remesas nóminas💰 Pendiente y N43🏦 Financiación🛡️ Seguros📈 Previsión🔁 Traspasos/,'<BARRA>')
    .replace(/📊Panel📋Facturas📑Contratos👷Nóminas🛡️Seguros⚙️Ajustes\+/,'<BARRAINF>')
    .replace(/📊Panel📋Facturas🏗Obras🏦Tesorería👷Plantilla⚙️Ajustes\+/,'<BARRAINF>');
  const normPrevision=t=>{
    const i=t.indexOf('Nóminas/mes:');
    const marca='además de los cobros previstos.';
    const j=t.indexOf(marca);
    if(i<0||j<0)return t; // si el bloque no está, que el A/B lo cante
    return t.slice(0,i)+'<PREVISION>'+t.slice(j+marca.length);
  };
  const fotos={};
  fotos.panel=normBuzon(normCasetas(norm(document.getElementById('root').textContent)));
  // vistas — y dentro de Facturas, abrir la ventana de tesorería
  for(const [nom,tab] of [['facturas','Facturas'],['contratos','Contratos'],['nominas','Nóminas'],['seguros','Seguros']]){
    const b=irA(document,tab)?{click:()=>{}}:[...document.querySelectorAll('button')].find(x=>x.textContent.includes(tab));
    const MARCA={facturas:'📥 Recibidas',contratos:'🏗',nominas:'Plantilla',seguros:'Pólizas'};
    if(b){b.click();
      if(!await esperarPantalla(MARCA[nom]))console.log('  · AVISO: «'+nom+'» no llegó a pintarse a tiempo');
      await espera(250);
      fotos[nom]=norm(document.getElementById('root').textContent);
      if(nom==='facturas'){
        const bPend=irA(document,'Pendiente')?{click:()=>{}}:[...document.querySelectorAll('button')].find(x=>x.textContent.includes('💰 Pendiente'));
        if(bPend){bPend.click();await esperarPantalla('Pendiente');await espera(250);
          fotos.pendientes=norm(document.getElementById('root').textContent);
          const bTeso=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Previsión de tesorería'));
          if(bTeso){bTeso.click();await espera(1800);
            fotos.tesoreria=normBarras(normPrevision(norm(document.getElementById('root').textContent)));
            const cerrar=[...document.querySelectorAll('button')].reverse().find(x=>['✕','×','Cerrar'].includes(x.textContent.trim()));
            if(cerrar){cerrar.click();await espera(300);}
          } else fotos.tesoreria='(SIN BOTÓN TESORERÍA)';
        } else fotos.pendientes='(SIN SUBPESTAÑA PENDIENTE)';
      }
    }
    else fotos[nom]='(SIN PESTAÑA)';
  }
  console.error=oe;
  root.unmount();await espera(100);
  return fotos;
}
const A=await capturar((()=>{const R=fs.readdirSync('ref_produccion').find(f=>/^bh10-APPV\d+\.js$/.test(f));if(!R)throw new Error('falta ref_produccion');return '../ref_produccion/'+R;})());
const B=await capturar('../web_subir/app/assets/bh10-APPV400.js');
let fallos=0;
for(const k of Object.keys(A)){
  if(A[k]===B[k]){console.log('  ✓',k.padEnd(10),'IDÉNTICO ·',A[k].length,'chars');continue;}
  // Desde v340 el Panel lleva una tarjeta nueva (traspasos entre empresas).
  // No basta con «difieren»: hay que demostrar que la ÚNICA diferencia es esa.
  const d=k==='ajustes'?explicarDelta(normAjustesTexto(A[k]),normAjustesTexto(B[k])):explicarDelta(A[k],B[k]);
  if(d.ok){console.log('  ✓',k.padEnd(10),'delta esperado ·',d.motivo);continue;}
  fallos++;
  console.log('  ✗',k.padEnd(10),'DIFIERE ·',A[k].length,'vs',B[k].length,'chars');
  console.log('     '+d.motivo);
  let i=0;while(i<Math.min(A[k].length,B[k].length)&&A[k][i]===B[k][i])i++;
  console.log('     desplegado: …'+A[k].slice(Math.max(0,i-40),i+60));
  console.log('     entrega: …'+B[k].slice(Math.max(0,i-40),i+60));
}
// La funcionalidad nueva TIENE que estar: si desapareciera, esto salta.
const enA=PATRON_NUEVO.test(A.panel||''), enB=PATRON_NUEVO.test(B.panel||'');
if(enA){fallos++;console.log('  ✗ la versión desplegada ya traía Traspasos: la referencia está mal');}
else if(!enB){fallos++;console.log('  ✗ la entrega NO trae la tarjeta de Traspasos en el Panel');}
else console.log('  ✓ funcionalidad nueva presente en la entrega y ausente en lo desplegado');
console.log(fallos?'═══ A/B: '+fallos+' DIFERENCIAS ═══':'═══ A/B COMPLETO: PANEL, TESORERÍA Y 4 VISTAS IDÉNTICOS ═══');
process.exit(fallos?1:0);
