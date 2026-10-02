// Batería del acordeón de Ajustes: apertura ÚNICA (abrir B cierra A).
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://bh10group.com/app/',pretendToBeVisual:true});
for(const k of ['window','document','navigator','localStorage','sessionStorage','HTMLElement','Node','CustomEvent','Event','FileReader','Blob','URL','atob','btoa']){try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
globalThis.window=dom.window;
window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
window.requestAnimationFrame=cb=>setTimeout(cb,0);globalThis.requestAnimationFrame=window.requestAnimationFrame;
window.cancelAnimationFrame=()=>{};globalThis.cancelAnimationFrame=()=>{};
class RO{observe(){}unobserve(){}disconnect(){}}window.ResizeObserver=RO;globalThis.ResizeObserver=RO;
window.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};window.scrollTo=()=>{};
window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
window.BH10_EMPRESA={sub:'',nombre:'BIG HOUSE 2010'};window.BH10_ROL='admin';window.BH10_PERMISOS=null;
const nube={};
window.storage={get:async k=>nube[k]!==undefined?{key:k,value:nube[k]}:null,set:async(k,v)=>{nube[k]=String(v);return{key:k,value:v}},delete:async k=>{delete nube[k];return{key:k}},list:async p=>({keys:Object.keys(nube).filter(k=>!p||k.startsWith(p))}),getStatus:()=>({fase:'ok',error:'',ultimaEscritura:Date.now(),errorEscritura:'',pendientes:0,conflicto:null})};
const {default:App}=await import('../web_subir/app/assets/bh10-APPV404.js');
const root=createRoot(document.getElementById('root'));
const oe=console.error;console.error=()=>{};
root.render(React.createElement(App));
await new Promise(r=>setTimeout(r,900));
// ir a Ajustes
const tab=[...document.querySelectorAll('button')].find(b=>/Ajustes/.test(b.textContent));
tab.click();await new Promise(r=>setTimeout(r,900));
let fallos=0;const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};
const E=(ms)=>new Promise(r=>setTimeout(r,ms));
// teclear en un campo React (mismo truco que bateria_ab_escrituras: onChange directo)
const pon=(el,val)=>{
  const pk=Object.keys(el).find(k=>k.startsWith('__reactProps'));
  if(pk&&el[pk]&&el[pk].onChange){el[pk].onChange({target:{value:String(val)}});return;}
  const prev=el.value;
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(el,String(val));
  if(el._valueTracker)el._valueTracker.setValue(prev);
  el.dispatchEvent(new window.Event('input',{bubbles:true}));
};
// v358 · Ajustes como casillas: rejilla, ventana encima, Guardar / Cerrar sin guardar
const casillas=()=>[...document.querySelectorAll('button[data-aj="casilla"]')];
const ventanas=()=>[...document.querySelectorAll('[data-aj="ventana"]')];
const tituloVentana=()=>{const v=ventanas()[0];return v?(v.querySelector('span[style*="font-weight: 700"]')||{}).textContent||'':'';};
const tituloDe=(b)=>b.textContent.replace(/[◀▶]/g,'').trim();
ok(casillas().length>=8,'rejilla montada ('+casillas().length+' casillas)');
ok(ventanas().length===0,'ninguna ventana al entrar');
casillas()[0].click();await E(350);
ok(ventanas().length===1&&tituloVentana().includes(tituloDe(casillas()[0]).replace(/^\S+\s/,'')),'tocar la 1ª → su ventana encima ('+tituloVentana()+')');
const x=ventanas()[0].querySelector('button[aria-label="Cerrar"]');x.click();await E(350);
ok(ventanas().length===0,'la ✕ cierra la ventana');
casillas()[3].click();await E(350);
ok(ventanas().length===1,'tocar la 4ª → una sola ventana');
ventanas()[0].querySelector('button[aria-label="Cerrar"]').click();await E(350);
// Cerrar sin guardar: abrir «Datos empresa ordenante», cambiar el nombre, cerrar sin guardar → vuelve
const cEmp=casillas().find(b=>/empresa ordenante/i.test(b.textContent));
ok(!!cEmp,'existe la casilla «Datos empresa ordenante»');
if(cEmp){
  cEmp.click();await E(400);
  const v=ventanas()[0];
  const inputs=v?[...v.querySelectorAll('input')]:[];
  // el campo de texto libre más largo (nombre o dirección), nunca el país ni el IBAN
  const lab=v&&[...v.querySelectorAll('label')].find(l=>/Marca comercial/.test(l.textContent));
  const campo=lab?lab.querySelector('input'):null;
  ok(!!campo,'la ventana de empresa tiene campos ('+inputs.length+')');
  const antes=campo?campo.value:'';
  if(campo){
    pon(campo,antes+' PRUEBA');await E(200);
    ok(campo.value===antes+' PRUEBA','el campo cambia al escribir');
    const btnCerrar=[...v.querySelectorAll('button')].find(b=>/Cerrar sin guardar/.test(b.textContent));
    ok(!!btnCerrar,'la ventana de datos tiene «Cerrar sin guardar»');
    if(btnCerrar){btnCerrar.click();await E(400);
      ok(ventanas().length===0,'se cierra');
      cEmp.click();await E(400);
      const v2=ventanas()[0];const inputs2=v2?[...v2.querySelectorAll('input')]:[];
      const campo2=inputs2[inputs.indexOf(campo)];
      ok(!!campo2&&campo2.value===antes,'al reabrir, el campo ha VUELTO a como estaba ('+JSON.stringify(antes)+')');
      // y con Guardar sí se queda
      if(campo2){pon(campo2,antes+' OK');await E(200);
        const btnG=[...v2.querySelectorAll('button')].find(b=>b.textContent.trim()==='💾 Guardar');btnG&&btnG.click();await E(400);
        cEmp.click();await E(400);
        const v3=ventanas()[0];const c3=v3?[...v3.querySelectorAll('input')][inputs.indexOf(campo)]:null;
        ok(!!c3&&c3.value===antes+' OK','con Guardar el cambio se queda');
        if(c3){pon(c3,antes);await E(150);}
        const btnG2=v3&&[...v3.querySelectorAll('button')].find(b=>b.textContent.trim()==='💾 Guardar');btnG2&&btnG2.click();await E(300);
      }
    }
  }
}
// una casilla de acción solo tiene Cerrar
const cAcc=casillas().find(b=>/Exportar|Papelera|Comprobar documentos/.test(b.textContent));
if(cAcc){cAcc.click();await E(400);const v=ventanas()[0];
  ok(v&&![...v.querySelectorAll('button')].some(b=>/Guardar/.test(b.textContent))&&[...v.querySelectorAll('button')].some(b=>/^Cerrar$/.test(b.textContent.trim())),'una casilla de acción solo tiene Cerrar ('+tituloVentana()+')');
  const c=v&&[...v.querySelectorAll('button')].find(b=>/^Cerrar$/.test(b.textContent.trim()));c&&c.click();await E(300);}

// ── v363 · el ORDEN de las casillas se guarda en la nube y se conserva ─────
{
  const colocar=document.querySelector('[data-aj="colocar"]');colocar.click();await E(250);
  const antes=casillas().map(tituloDe);
  const flechas=casillas()[0].querySelectorAll('[role="button"]');
  ok(flechas.length===2,'en modo Colocar cada casilla tiene ◀ ▶');
  flechas[1].click();await E(300);
  const despues=casillas().map(tituloDe);
  ok(despues[1]===antes[0]&&despues[0]===antes[1],'▶ en la primera la mueve al segundo sitio en pantalla');
  await E(200);
  const guardado=nube['bh10-ordenconfig'];
  const sinIcono=(t)=>t.replace(/^[^A-Za-zÁÉÍÓÚÑ]+/,'');
  ok(!!guardado&&JSON.parse(guardado)[1]===sinIcono(antes[0])&&JSON.parse(guardado)[0]===sinIcono(antes[1]),'el orden nuevo está GUARDADO en la nube (bh10-ordenconfig) al instante');
  document.querySelector('[data-aj="colocar"]').click();await E(200);
  // salir de Ajustes y volver: se relee de la nube y se conserva
  const tabs=[...document.querySelectorAll('button')];
  const panel=tabs.find(b=>/^Panel$/.test(b.textContent.trim()))||tabs.find(b=>/Panel/.test(b.textContent));
  panel.click();await E(300);
  tabs.find(b=>/Ajustes/.test(b.textContent)).click();await E(500);
  const vuelta=casillas().map(tituloDe);
  ok(vuelta.join('|')===despues.join('|'),'al salir y volver a Ajustes se conserva el orden');
  // otro aparato: la nube dice otra cosa → al entrar en Ajustes se aplica lo de la nube
  const invertido=[...JSON.parse(nube['bh10-ordenconfig'])].reverse();nube['bh10-ordenconfig']=JSON.stringify(invertido);
  panel.click();await E(300);tabs.find(b=>/Ajustes/.test(b.textContent)).click();await E(600);
  const cruzado=casillas().map(tituloDe).map(sinIcono);
  const inv2=invertido.map(sinIcono);
  ok(cruzado[0]===inv2[0]&&cruzado[1]===inv2[1]&&cruzado[2]===inv2[2],'lo que se colocó en otro aparato se ve al entrar (relectura de la nube)');
}

console.error=oe;
console.log(fallos?'═══ FALLOS: '+fallos+' ═══':'═══ BATERÍA CASILLAS DE AJUSTES: TODO OK ═══');
process.exit(fallos?1:0);
