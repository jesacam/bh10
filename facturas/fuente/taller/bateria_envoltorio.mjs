// ═══ BATERÍA DEL ENVOLTORIO v315 (fuente recuperado) ═══
// 1) Arranca con Firebase REAL (sin red útil) y pinta la pantalla de login
//    con la atribución de reCAPTCHA y sin reventar.
// 2) A/B de superficie contra el envoltorio v310 minificado: mismas ventanas
//    (window.*) expuestas y misma pantalla de login carácter a carácter.
import {JSDOM} from 'jsdom';
import fs from 'fs';
async function arrancar(ruta){
  const dom=new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>',
    {url:'https://bh10group.com/app/',pretendToBeVisual:true});
  const claves=['window','document','navigator','localStorage','sessionStorage','HTMLElement','HTMLAnchorElement','Node','Event','CustomEvent','Blob','URL','atob','btoa','FileReader','TextEncoder','TextDecoder','crypto','fetch','Headers','Request','Response','AbortController','XMLHttpRequest','WebSocket','history','location','indexedDB'];
  for(const k of claves){try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
  globalThis.window=dom.window;globalThis.self=dom.window;
  window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
  window.requestAnimationFrame=cb=>setTimeout(cb,0);globalThis.requestAnimationFrame=window.requestAnimationFrame;
  window.cancelAnimationFrame=()=>{};globalThis.cancelAnimationFrame=()=>{};
  // sin red: cualquier salida devuelve fallo controlado
  const sinRed=async()=>{throw new TypeError('sin red (batería)');};
  globalThis.fetch=sinRed;window.fetch=sinRed;
  window.grecaptcha=undefined;
  const oe=console.error,ow=console.warn;console.error=()=>{};console.warn=()=>{};
  let error=null;
  try{ await import(ruta); }catch(e){ error=e; }
  await new Promise(r=>setTimeout(r,2500));
  console.error=oe;console.warn=ow;
  const texto=dom.window.document.body.textContent.replace(/\s+/g,' ').trim();
  const ventanas=['__BH10_R','__BH10_JSX','__BH10_RDOM','__BH10_STANDALONE','__BH10_MULTI','__BH10_APPCHECK'].map(k=>k+':'+(window[k]!==undefined));
  const estilos=[...dom.window.document.querySelectorAll('style')].map(s=>s.textContent).join('');
  return {error,texto,ventanas:ventanas.join(' '),insigniaOculta:estilos.includes('grecaptcha-badge'),dom};
}
let fallos=0;const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};
const N=await arrancar('../web_subir/app/assets/index-v317.js');
ok(!N.error,'v315 arranca sin excepción'+(N.error?' → '+N.error.message:''));
ok(/Correo|contraseña|Entrar|acceso restringido/i.test(N.texto),'v315 pinta la pantalla de LOGIN');
ok(N.texto.includes('Protegido por reCAPTCHA'),'v315 muestra la atribución de reCAPTCHA');
ok(N.insigniaOculta,'v315 esconde la insignia por CSS');
console.log('    ventanas v315:',N.ventanas);
console.log('    login v315:',N.texto.slice(0,180));
const V=await arrancar('../web_subir/app/assets/index-v310.js');
ok(!V.error,'v310 (referencia) arranca en el mismo arnés');
ok(N.texto===V.texto,'PANTALLA DE LOGIN IDÉNTICA carácter a carácter v310 ↔ v315'+(N.texto===V.texto?'':' → v310:『'+V.texto.slice(0,120)+'』'));
ok(N.ventanas===V.ventanas,'mismas ventanas globales expuestas');
// v352 · bh10Adj.enNube (confirmación del servidor: hasPendingWrites) y
// blobDe que ya no concatena trozos ausentes. bh10Adj solo existe tras el
// login, así que aquí se comprueba que el bundle compilado lo lleva y que
// la superficie pre-login no ha cambiado (arriba).
const fuente=fs.readFileSync(new URL('../web_subir/app/assets/index-v317.js',import.meta.url),'utf8');
ok(/enNube:\s*async/.test(fuente),'v316 lleva bh10Adj.enNube');
ok(fuente.includes('hasPendingWrites'),'enNube pregunta a Firestore por escrituras pendientes (caché local ≠ nube)');
ok(fuente.includes('falta el trozo')&&fuente.includes('pendiente de subir'),'enNube distingue trozo ausente de trozo en cola');
ok(fuente.includes('Documento incompleto en la nube'),'blobDe ya no concatena un trozo ausente en silencio');
ok(!N.texto.includes('enNube')&&window.bh10Adj===undefined,'bh10Adj sigue sin exponerse antes del login');
console.log(fallos?'═══ ENVOLTORIO: '+fallos+' FALLOS ═══':'═══ BATERÍA ENVOLTORIO: TODO OK ═══');
process.exit(fallos?1:0);
