// A/B de PERMISOS contra producción: bateria_render monta los tres escenarios
// pero nunca los compara con el desplegado. Si un almacén rompiese algo solo
// en modo lectura o con áreas recortadas (el caso de Benito), nadie lo vería.
import {irA} from './_nav.mjs';
import {JSDOM} from 'jsdom';import React from 'react';import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';import fs from 'fs';
import {explicarDelta,PATRON_NUEVO,normAjustes} from './_delta.mjs';
const datos=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const FIJO=new Date('2026-08-24T11:00:00Z').getTime();
const ESC=[
 {n:'DUEÑO', rol:'admin', permisos:null},
 {n:'BENITO (facturas admin, contratos lectura, resto nada)', rol:'admin',
  permisos:{facturas:'admin',contratos:'lectura',nominas:'',seguros:'',tesoreria:'',ajustes:''}},
 {n:'SOLO LECTURA total', rol:'admin',
  permisos:{facturas:'lectura',contratos:'',nominas:'',seguros:'',tesoreria:'lectura',ajustes:''}},
];
async function pinta(ruta,esc){
  const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://bh10group.com/app/',pretendToBeVisual:true});
  for(const k of ['window','document','navigator','localStorage','sessionStorage','HTMLElement','Node','Event','CustomEvent','Blob','URL','atob','btoa','FileReader','getComputedStyle','crypto']){try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
  globalThis.window=dom.window;
  const DR=Date;globalThis.Date=dom.window.Date=class extends DR{constructor(...a){a.length?super(...a):super(FIJO);}static now(){return FIJO;}};
  window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
  window.requestAnimationFrame=cb=>setTimeout(cb,0);globalThis.requestAnimationFrame=window.requestAnimationFrame;
  window.cancelAnimationFrame=()=>{};globalThis.cancelAnimationFrame=()=>{};
  class RO{observe(){}unobserve(){}disconnect(){}}window.ResizeObserver=RO;globalThis.ResizeObserver=RO;
  window.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};window.scrollTo=()=>{};
  window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
  window.BH10_EMPRESA={sub:'',nombre:'BIG HOUSE 2010'};
  window.BH10_ROL=esc.rol;window.BH10_PERMISOS=esc.permisos;window.__BH10_AREA='';window.__BH10_DUENO='uidDueno';
  const nube={};for(const k of Object.keys(datos.claves))nube[k]=datos.claves[k];
  nube['bh10-ultimacopia']='2026-08-24T09:00:00.000Z';
  window.storage={get:async k=>nube[k]!==undefined?{key:k,value:nube[k]}:null,set:async(k,v)=>{nube[k]=String(v);return{key:k,value:v}},delete:async k=>{delete nube[k];return{key:k}},list:async p=>({keys:Object.keys(nube).filter(k=>!p||k.startsWith(p))}),getStatus:()=>({fase:'ok',error:'',ultimaEscritura:FIJO,errorEscritura:'',pendientes:0,conflicto:null})};
  const {default:App}=await import(ruta);
  const oe=console.error;const dichos=[];console.error=(...a)=>dichos.push(a.map(x=>(x&&x.message)||String(x)).join(' '));
  const root=createRoot(document.getElementById('root'));
  root.render(React.createElement(App));
  const E=ms=>new Promise(r=>setTimeout(r,ms));
  await E(2200);
  const click=t=>{if(irA(document,t))return true;const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes(t));if(b){b.click();return true;}return false;};
  const fotos={inicio:document.getElementById('root').innerHTML};const omitidas=[];
  // Los avisos flotantes (p.ej. «👁 Modo lector: solo consulta») se desvanecen
  // solos por temporizador: caen dentro o fuera de la foto según lo que tarde
  // cada ejecución, y hacían que v324 difiriese DE SÍ MISMO. Se espera a que la
  // pantalla se asiente antes de retratarla. Se compara la pantalla estable;
  // los avisos transitorios no son comparables entre dos ejecuciones distintas.
  const flotante=()=>[...document.querySelectorAll('div')].some(d=>/position:\s*absolute/.test(d.getAttribute('style')||'')&&/bottom:\s*calc/.test(d.getAttribute('style')||''));
  const asentar=async()=>{for(let i=0;i<40;i++){if(!flotante())return;await E(150);}};
  await asentar();
  fotos.inicio=document.getElementById('root').innerHTML;
  // v364: con la navegación nueva un miembro sin un área ya no «se queda donde estaba» al pulsar una
  // pestaña que no ve (antes el clic no encontraba botón); las pantallas que no puede ver se saltan y
  // se comprueba aparte que no aparecen
  const VE={Facturas:'facturas',Contratos:'contratos',Seguros:'seguros',Ajustes:'ajustes'};
  const puedeVerEsc=(v)=>!esc.permisos||!VE[v]||!!esc.permisos[VE[v]];
  for(const v of ['Facturas','Contratos','Seguros','Ajustes','Panel']){ if(!puedeVerEsc(v)){omitidas.push(v);continue;} click(v); await E(650); await asentar(); fotos[v]=document.getElementById('root').innerHTML; }
  console.error=oe;root.unmount();await E(100);
  return {fotos,omitidas,dichos};
}
const REF=fs.readdirSync('ref_produccion').find(f=>/^bh10-APPV\d+\.js$/.test(f));
let fallos=0;
for(const esc of ESC){
  const A=await pinta(process.argv[2]||('../ref_produccion/'+REF),esc);
  const B=await pinta(process.argv[3]||'../web_subir/app/assets/bh10-APPV407.js',esc);
  console.log('── '+esc.n);
  if(B.omitidas.length)console.log('  · pantallas que este perfil no ve (no se comparan):',B.omitidas.join(', '));
  for(const k of Object.keys(A.fotos)){if(B.omitidas.includes(k))continue;
    // v363 · los botones ↶ ↷ se ven exactamente donde el usuario puede editar (área en admin,
    // o Panel si tiene admin en algo). Producción iba un render por detrás (el área se fijaba
    // en un efecto). Se comprueba la regla y se comparan las pantallas SIN ese bloque.
    const RE_DESHACER=/<span style="display: flex; align-items: center; gap: 2px;"><button[^>]*(?:Deshacer|deshacer)[\s\S]*?<\/span>/;
    const AREA={Facturas:'facturas',Contratos:'contratos',Nóminas:'nominas',Seguros:'seguros',Panel:''};
    {const pk=esc.permisos;const ar=AREA[k.replace(/\s+\d+$/,'')];const debe=!pk||(ar?pk[ar]==='admin':Object.values(pk).some(x=>x==='admin'));
     const hay=RE_DESHACER.test(B.fotos[k]);
     if(ar!==undefined){const bien=hay===debe;if(!bien)fallos++;console.log((bien?'  ✓ ':'  ✗ ')+k.padEnd(11)+'botones deshacer/rehacer '+(debe?'visibles':'ocultos')+' para «'+esc.n+'»'+(bien?'':' (al revés)'));}}
    // …y lo mismo con el botón ➕ (54×54) de añadir: solo donde se puede editar
    const RE_FAB=/<button style="width: 54px; height: 54px; border-radius: 27px;[^>]*>[\s\S]*?<\/button>/;
    {const pk=esc.permisos;const ar=AREA[k.replace(/\s+\d+$/,'')];const debe=!pk||(ar?pk[ar]==='admin':Object.values(pk).some(x=>x==='admin'));
     const hay=RE_FAB.test(B.fotos[k]);
     if(ar!==undefined){const bien=hay===debe;if(!bien)fallos++;console.log((bien?'  ✓ ':'  ✗ ')+k.padEnd(11)+'botón ➕ '+(debe?'visible':'oculto')+' para «'+esc.n+'»'+(bien?'':' (al revés)'));}}
    let a=A.fotos[k].replace(/v3\d\d/g,'vXXX').replace(RE_DESHACER,'').replace(RE_FAB,''), b=B.fotos[k].replace(/v3\d\d/g,'vXXX').replace(RE_DESHACER,'').replace(RE_FAB,'');
    let nota='';
    // v381 · en Facturas hay UNA casilla más: el anticipo ya se puede seleccionar
    // para la remesa. Se exige que sea exactamente una —para cada perfil— y solo
    // entonces se quitan casillas y huecos de los dos lados, para cotejar el
    // resto del marcado, que con estos permisos no puede haber cambiado.
    if(/^Facturas/i.test(k)){
      const cas=t=>(String(t).match(/type="checkbox"/g)||[]).length;
      const na=cas(a), nb=cas(b);
      if(nb===na+1){
        const limpia=t=>String(t).replace(/<input type="checkbox"[^>]*>/g,'')
                                 .replace(/<span style="width: 20px; height: 20px;[^>]*><\/span>/g,'');
        a=limpia(a);b=limpia(b);nota=' · una casilla más: el anticipo ya se puede remesar (v381)';
      } else if(nb!==na){
        console.log(`  ✗ ${k}: ${nb-na} casillas de diferencia y solo se esperaba UNA`);
      }
    }
    let igual=a===b;
    // v358: la pantalla de Ajustes cambió de envoltorio (acordeón → casillas): se compara el contenido sin él
    if(!igual){const d=/^Ajustes/i.test(k)?explicarDelta(normAjustes(a),normAjustes(b)):explicarDelta(a,b); if(d.ok){igual=true;nota=' · delta esperado: '+d.motivo;}else nota=' · '+d.motivo.slice(0,220);}
    if(!igual)fallos++;
    console.log((igual?'  ✓ ':'  ✗ ')+k.padEnd(11)+(igual?'idéntico · '+a.length+' bytes'+nota:'DIFIERE '+a.length+' vs '+b.length+nota));
    if(!igual){
      // ¿es un aviso flotante transitorio? Se enseña su texto para juzgarlo.
      for(const [et,h] of [['A',A.fotos[k]],['B',B.fotos[k]]]){
        const m=h.match(/<div style="position: absolute; bottom: calc[^>]*>([\s\S]{0,200}?)<\/div>/);
        if(m)console.log('     aviso en '+et+': '+m[1].replace(/<[^>]*>/g,'').slice(0,120));
      }
      let i=0;while(i<Math.min(a.length,b.length)&&a[i]===b[i])i++;
      console.log('     v324: …'+a.slice(Math.max(0,i-50),i+70));console.log('     v327: …'+b.slice(Math.max(0,i-50),i+70));}
  }
  const q=B.dichos.filter(d=>/Rendered more hooks|order of Hooks|Invalid hook call/i.test(d));
  if(q.length){fallos++;console.log('  ✗ quejas de hooks: '+q[0].slice(0,150));}
  else console.log('  ✓ sin quejas de orden de hooks');
}
console.log(fallos?`═══ A/B PERMISOS: ${fallos} DIFERENCIAS ═══`:'═══ A/B PERMISOS: LOS TRES PERFILES IDÉNTICOS A PRODUCCIÓN ═══');
process.exit(fallos?1:0);
