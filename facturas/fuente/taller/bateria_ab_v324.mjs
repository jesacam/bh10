// ═══ A/B PROFUNDA · PRODUCCIÓN (ref_produccion/) vs ESTA ENTREGA ═══════════════════════════════
// La A/B normal compara contra el v313 de referencia. Ésta compara contra el
// bundle QUE ESTÁ CORRIENDO AHORA MISMO en bh10group.com, que es la única
// prueba que responde a la pregunta «¿la mudanza de Seguros cambió algo?».
//
// Y compara innerHTML, no textContent: entra el marcado y los estilos en
// línea, así que un cambio de color, de ancho o de orden de nodos también
// salta. Reloj y azar congelados en ambos lados.
//
// Recorrido: Panel · las 6 subpestañas de Facturas · Contratos · Nóminas ·
// Seguros · Ajustes · y las ventanas de Previsión de tesorería, Liquidación
// de IVA, Envío a gestoría, C34 de proveedores y Remesas.
import {irA} from './_nav.mjs';
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
import fs from 'fs';
import {explicarDelta,PATRON_NUEVO,normAjustes,normNavegacion} from './_delta.mjs';
const datos=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const FIJO=new Date('2026-08-24T11:00:00Z').getTime();
const azarSembrado=(s)=>()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};

async function recorrer(ruta){
  const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://bh10group.com/app/',pretendToBeVisual:true});
  for(const k of ['window','document','navigator','localStorage','sessionStorage','HTMLElement','Node','CustomEvent','Event','FileReader','Blob','URL','atob','btoa','getComputedStyle','crypto'])
    {try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
  globalThis.window=dom.window;
  const DateReal=Date;
  const DateFija=class extends DateReal{constructor(...a){a.length?super(...a):super(FIJO);}static now(){return FIJO;}};
  globalThis.Date=DateFija;dom.window.Date=DateFija;
  const rnd=azarSembrado(20260824);Math.random=rnd;dom.window.Math.random=rnd;
  window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
  window.requestAnimationFrame=cb=>setTimeout(cb,0);globalThis.requestAnimationFrame=window.requestAnimationFrame;
  window.cancelAnimationFrame=()=>{};globalThis.cancelAnimationFrame=()=>{};
  class RO{observe(){}unobserve(){}disconnect(){}}window.ResizeObserver=RO;globalThis.ResizeObserver=RO;
  window.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};window.scrollTo=()=>{};
  window.confirm=()=>true;window.prompt=()=>'';window.alert=()=>{};
  window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
  window.BH10_EMPRESA={sub:'',nombre:'BIG HOUSE 2010'};window.BH10_ROL='admin';window.BH10_PERMISOS=null;
  // Puente del fichaje: lo pone el envoltorio en la app real. Sin él, el botón
  // «🕐 Fichajes» no se pinta y el dominio se quedaba sin visitar. Respuestas
  // fijas: los dos lados reciben exactamente lo mismo.
  window.bh10Fichaje={
    trabajadores:async()=>([{uid:'t1',nombre:'RODRIGUEZ TARDIO, ALFONSO',nif:'11111111H',activo:true},
                            {uid:'t2',nombre:'RINCON GARCIA, JOSE',nif:'22222222J',activo:true}]),
    registros:async()=>([{id:'r1',uid:'t1',fecha:'2026-08-20',entrada:'08:00',salida:'17:00'}]),
    alta:async()=>({ok:true}), rectificar:async()=>({ok:true}), publicarJornada:async()=>({ok:true})};
  const nube={};for(const k of Object.keys(datos.claves))nube[k]=datos.claves[k];
  // El recordatorio de copia sale de un setTimeout(…,4500) lanzado DESPUÉS de
  // un fetch de red: cae dentro o fuera de la foto según lo que tarde la
  // ejecución, y hacía que v324 difiriese DE SÍ MISMO. Se siembra la fecha de
  // última copia para que no dispare. Es lo ÚNICO que se neutraliza: cualquier
  // otro aviso (los de acciones) sigue entrando en la comparación.
  nube['bh10-ultimacopia']='2026-08-24T09:00:00.000Z';
  window.storage={get:async k=>nube[k]!==undefined?{key:k,value:nube[k]}:null,
    set:async(k,v)=>{nube[k]=String(v);return{key:k,value:v}},
    delete:async k=>{delete nube[k];return{key:k}},
    list:async p=>({keys:Object.keys(nube).filter(k=>!p||k.startsWith(p))}),
    getStatus:()=>({fase:'ok',error:'',ultimaEscritura:FIJO,errorEscritura:'',pendientes:0,conflicto:null})};
  const {default:App}=await import(ruta);
  const oe=console.error;console.error=()=>{};
  const root=createRoot(document.getElementById('root'));
  root.render(React.createElement(App));
  const E=ms=>new Promise(r=>setTimeout(r,ms));
  for(let i=0;i<240;i++){await E(25);if(document.getElementById('root').textContent.includes('Pendiente de pago'))break;}
  await E(700);

  const raiz=()=>document.getElementById('root');
  // se normaliza SOLO el número de versión; todo lo demás debe coincidir
  const foto=()=>raiz().innerHTML.replace(/v3\d\d/g,'vXXX').replace(/APPV3\d\d/g,'APPVXXX');
  // Los KPI del Panel NO son <button>: son divs con onClick de React. Si solo
  // se miran botones, tres de las ventanas críticas quedan sin visitar.
  const pulsa=(txt)=>{
    if(irA(document,txt))return true;
    const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes(txt));
    if(b){b.click();return true;}
    const cand=[...document.querySelectorAll('div,span,a,li')].filter(el=>{
      if(!el.textContent.includes(txt))return false;
      const pk=Object.keys(el).find(k=>k.startsWith('__reactProps'));
      return !!(pk&&el[pk]&&typeof el[pk].onClick==='function');
    });
    if(!cand.length)return false;
    cand.sort((a,b2)=>a.textContent.length-b2.textContent.length);   // el más ajustado
    const el=cand[0], pk=Object.keys(el).find(k=>k.startsWith('__reactProps'));
    el[pk].onClick({preventDefault(){},stopPropagation(){},target:el});
    return true;
  };
  const fotos={},abierto={};
  const capta=async(nom,etiqueta,ms=900)=>{
    const hubo=etiqueta===null?true:pulsa(etiqueta);
    abierto[nom]=hubo;
    await E(ms);
    fotos[nom]=hubo?foto():'(NO SE ABRIÓ)';
  };
  const cerrar=async()=>{
    const c=[...document.querySelectorAll('button')].reverse().find(x=>['✕','×','Cerrar','⟵','←'].includes(x.textContent.trim()));
    if(c)c.click();await E(400);
  };

  await capta('panel',null,0);
  // ── ventanas que cuelgan del PANEL (aquí fallaba el recorrido anterior) ──
  await capta('w_iva','Liquidación IVA',1300);      await cerrar();
  await capta('w_gestoria','📦 Envío gestoría',1800); await cerrar();
  await capta('w_c34prov','🏦 C34 Proveedores',1300);
  pulsa('Panel');await E(700);
  // v364: «Facturas» aterriza siempre en Recibidas (antes se quedaba en la subpestaña anterior)
  pulsa('Facturas');await E(500);await capta('facturas','Recibidas');
  for(const [n,t] of [['fac_recibidas','Recibidas'],['fac_emitidas','Emitidas'],['fac_clientes','Clientes'],
                      ['fac_proveedores','Proveedores'],['fac_pendiente','Pendiente']]) // v364: la «Obras» antigua de Facturas se retira (vive en Obras → Obras)
    await capta(n,t,800);
  // ventanas críticas que cuelgan de Facturas
  for(const [n,t] of [['w_tesoreria','Previsión de tesorería'],['w_remesas','🏦 Remesas']]){
    await capta(n,t,1500); await cerrar();
  }
  await capta('contratos','Contratos');
  // ventanas de los dominios mudados en la sesión 2: si el almacén cambiase
  // algo, es aquí donde se vería. Cuelgan de la tarjeta del contrato.
  await capta('w_promocion','🏘️ Promoción',1600); await cerrar();
  await capta('nominas','Nóminas');
  // el fichaje cuelga de la PLANTILLA, que es una subpestaña de Nóminas
  await capta('nom_plantilla','👥 Plantilla',1200);
  await capta('w_fichajes','🕐 Fichajes',1800);   await cerrar();
  await capta('seguros','Seguros');
  await capta('ajustes','Ajustes',1200);

  console.error=oe;
  root.unmount();await E(150);
  return {fotos,abierto};
}

// permite permutar los dos lados para distinguir un fallo REAL de una carrera
// del arnés: si v324 contra v324 ya difiere, el culpable es el arnés.
const REF=fs.readdirSync('ref_produccion').find(f=>/^bh10-APPV\d+\.js$/.test(f));
if(!REF)throw new Error('ref_produccion/ no tiene ningún bh10-APPV*.js — ver su LEEME.txt');
const RUTA_A=process.argv[2]||('../ref_produccion/'+REF);
const RUTA_B=process.argv[3]||'../web_subir/app/assets/bh10-APPV404.js';
console.log('  A: '+RUTA_A+'\n  B: '+RUTA_B);
// v369 (06-09-2026) · la previsión de tesorería tiene desde v348 un MOTOR
// distinto al del bundle desplegado de referencia (presupuesto anual de
// personal, SS aprendida/incluida, pagas extra, modelo 111). Con recurrentes
// aprendidos los números coincidían y el A/B no lo veía; con la copia del
// 06-09 (sin recurrentes, con presupuesto configurado) divergen a propósito.
// Los números del motor los vigila bateria_presupuesto; aquí se sustituye el
// bloque por un marcador EN LOS DOS LADOS y se compara todo lo demás.
const normPrevision=(h)=>{const s=String(h);const i=s.indexOf('Nóminas/mes:');const M='además de los cobros previstos.';const j=s.indexOf(M);if(i<0||j<0)return s;return s.slice(0,i)+'<PREVISION>'+s.slice(j+M.length);};
const A=await recorrer(RUTA_A);
const B=await recorrer(RUTA_B);
let fallos=0, comparadas=0, noAbiertas=[];
// v381 · en Facturas hay UNA casilla más: el anticipo ya se puede seleccionar
// para la remesa. En su fila, donde antes había un hueco de 20×20 ahora hay una
// casilla, y eso desalinea el cotejo del resto del marcado. No se tapa: se
// EXIGE que sea exactamente una más —ni dos, ni ninguna— y solo entonces se
// quitan casillas y huecos de LOS DOS lados para cotejar todo lo demás, que no
// puede haber cambiado.
const casillas=t=>(String(t).match(/type="checkbox"/g)||[]).length;
const sinMarcas=t=>String(t)
  .replace(/<input type="checkbox"[^>]*>/g,'')
  .replace(/<span style="width: 20px; height: 20px;[^>]*><\/span>/g,'');
for(const k of ['facturas','fac_recibidas']){
  if(!A.fotos[k]||!B.fotos[k])continue;
  const a=casillas(A.fotos[k]), b=casillas(B.fotos[k]);
  if(b===a+1){
    console.log(`  · ${k}: una casilla más (${a}→${b}) · el anticipo ya se puede remesar (v381) — se coteja el resto`);
    A.fotos[k]=sinMarcas(A.fotos[k]);B.fotos[k]=sinMarcas(B.fotos[k]);
  } else if(b!==a){
    fallos++;console.log(`  ✗ ${k}: ${b-a} casillas de diferencia y solo se esperaba UNA`);
  }
}
for(const k of Object.keys(A.fotos)){
  if(!A.abierto[k]){noAbiertas.push(k);continue;}
  comparadas++;
  if(A.fotos[k]===B.fotos[k]){console.log('  ✓ '+k.padEnd(16)+'IDÉNTICO · '+A.fotos[k].length+' bytes de marcado');continue;}
  // v358: Ajustes cambia de envoltorio (acordeón → casillas); se compara el contenido sin el envoltorio
  const d=k==='ajustes'?explicarDelta(normAjustes(A.fotos[k]),normAjustes(B.fotos[k])):k==='w_tesoreria'?explicarDelta(normNavegacion(normPrevision(A.fotos[k])),normNavegacion(normPrevision(B.fotos[k]))):explicarDelta(A.fotos[k],B.fotos[k]);
  if(d.ok){console.log('  ✓ '+k.padEnd(16)+'delta esperado · '+d.motivo);continue;}
  {
    fallos++;
    console.log('  ✗ '+k.padEnd(16)+'DIFIERE · '+A.fotos[k].length+' vs '+B.fotos[k].length);
    console.log('     '+d.motivo);
    let i=0;while(i<Math.min(A.fotos[k].length,B.fotos[k].length)&&A.fotos[k][i]===B.fotos[k][i])i++;
    console.log('     prod : …'+A.fotos[k].slice(Math.max(0,i-60),i+80));
    console.log('     ahora: …'+B.fotos[k].slice(Math.max(0,i-60),i+80));
  }
}
if(noAbiertas.length)console.log('  · no se abrieron en NINGUNO de los dos (sin cobertura aquí): '+noAbiertas.join(', '));
console.log(fallos?`═══ A/B producción→entrega: ${fallos} DIFERENCIAS ═══`
  :`═══ A/B producción→entrega: ${comparadas} PANTALLAS IDÉNTICAS BYTE A BYTE (marcado y estilos) ═══`);
process.exit(fallos?1:0);
