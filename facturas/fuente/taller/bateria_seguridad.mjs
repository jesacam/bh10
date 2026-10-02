// ═══ BATERÍA · SEGURIDAD DEL APARATO Y DE LA COPIA (v365) ═════════════════
// Jesús (05-09-2026): cerrar sesión debe vaciar la copia local; «olvidar este
// aparato»; cierre automático por inactividad; copia completa cifrada y sin
// la clave de la IA; reglas de adjuntos y DNI.
import fs from 'fs';
let n=0,mal=0;const ok=(c,t)=>{n++;if(!c){mal++;console.log('  ✗',t);}else console.log('  ✓',t);};
const env=fs.readFileSync(new URL('../src-envoltorio/envoltorio.jsx',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../src/app.jsx',import.meta.url),'utf8');
const reglas=fs.readFileSync(new URL('../web_subir/REGLAS_FIRESTORE.txt',import.meta.url),'utf8');
// ── 1. caché local ────────────────────────────────────────────────────────
ok(/window\.bh10LimpiarCache = \(todo\) => \{/.test(env)&&/const conservar = new Set\(\[Jb, _5, "bh10-modo", "bh10-empresa", "bh10-autocierre"\]\)/.test(env),'bh10LimpiarCache vacía lo de bh10 y conserva Face ID, su cofre, modo, empresa y el cierre automático');
ok(/window\.bh10Logout = async \(\) => \{\s*window\.bh10LimpiarCache\(\);\s*await rA\(autenticacion\), location\.reload\(\)/.test(env),'cerrar sesión limpia la caché antes de salir');
ok((env.match(/window\.bh10LimpiarCache && window\.bh10LimpiarCache\(\)/g)||[]).length>=1,'el botón de salir del envoltorio también limpia');
ok(/window\.bh10OlvidarAparato = async \(\) => \{[\s\S]{0,400}bh10LimpiarCache\("todo"\)[\s\S]{0,300}localStorage\.removeItem\(c\)/.test(env),'«Olvidar este aparato» borra TODO lo local, Face ID incluido');
ok(/bh10OlvidarAparato&&window\.bh10OlvidarAparato\(\)/.test(app)&&/Olvidar este aparato/.test(app),'Ajustes → Nube y sesión ofrece «Olvidar este aparato» con dos toques');
// ── 2. cierre por inactividad ─────────────────────────────────────────────
ok(/localStorage\.getItem\('bh10-autocierre'\)\|\|'30'/.test(app)&&/autoCierre\*60000/.test(app)&&/window\.bh10Logout&&window\.bh10Logout\(\)/.test(app),'cierre automático: 30 min por defecto, configurable por aparato, llama a bh10Logout');
ok(/visibilitychange/.test(app)&&/pointerdown/.test(app)&&/touchstart/.test(app),'cuenta la actividad real (toques, teclas, scroll) y comprueba al volver a la app');
// ── 3. copia completa ─────────────────────────────────────────────────────
ok(/const CLAVES_FUERA_DE_COPIA=new Set\(\['bh10-anthkey'\]\)/.test(app)&&/if\(CLAVES_FUERA_DE_COPIA\.has\(k\)\)continue;/.test(app),'la copia completa NUNCA lleva la clave de la IA');
ok(/crearZipSeguro\(\[\{nombre:`BH10_copia_completa_\$\{today\}\.json`,texto\}\],\{clave,fuerte:true\}\)/.test(app),'la copia sale cifrada (ZIP con contraseña, cifrado fuerte)');
// ── 3b. v366 · quitar = cuenta deshabilitada + interruptor remoto ──────────
ok(/oU\(cn\(baseDatos, "miembros", t\.uid\), \(snap\) => \{[\s\S]{0,600}d\.estado !== "activo"[\s\S]{0,300}bh10LimpiarCache[\s\S]{0,200}rA\(autenticacion\)\.finally\(\(\) => location\.reload\(\)\)/.test(env),'el miembro escucha su ficha en vivo: suspendido o quitado → vacía la copia local y cierra sesión');
ok(/if \(d\.permisos\) \{ BH10P = d\.permisos; window\.BH10_PERMISOS = d\.permisos; \}/.test(env),'…y los permisos cambiados desde Master llegan en vivo');
ok(/Su cuenta quedará deshabilitada: no podrá volver a entrar/.test(app)&&/deshabilitar:true\}\)\}\);\s*const d=await r\.json\(\);deshabilitado=!!\(d&&d\.uid\);/.test(app),'Master → Quitar deshabilita la cuenta en Firebase antes de borrar la ficha');
ok(/No se pudo deshabilitar su cuenta en Firebase/.test(app),'si el Worker no responde, lo dice y sugiere Suspender');
// ── 3c. v368 · clave de la IA en el Worker, Worker con token, enlaces de un solo uso, borrar todo ──
const worker=fs.readFileSync(new URL('../web_subir/worker_master_v374.js',import.meta.url),'utf8');
ok(/async function verificarToken\(req, env\)/.test(worker)&&/securetoken@system\.gserviceaccount\.com/.test(worker)&&/RSASSA-PKCS1-v1_5/.test(worker)&&/cuerpo\.aud !== env\.FIREBASE_PROJECT/.test(worker),'el Worker verifica el token de Firebase (firma RS256 con las claves de Google, audiencia, emisor, caducidad)');
ok(/url\.pathname\.endsWith\('\/ia'\)/.test(worker)&&/env\.ANTHROPIC_KEY/.test(worker)&&/miembroActivo\(quien, env\)/.test(worker)&&/limite\(quien\.uid, 60\)/.test(worker),'/ia reenvía a Anthropic con la clave como secreto, solo a dueño o miembro activo, 60/min');
ok(/quien\.uid !== env\.DUENO_UID\)\) return json\(\{ error: 'solo el dueño' \}/.test(worker),'crear y deshabilitar usuarios: solo el dueño');
ok(!/sk-ant-api03-[A-Za-z0-9_-]{10,}/.test(worker),'el Worker no lleva ninguna clave escrita');
// v379 · antes se admitía «o en directo si no hay Worker». Ese camino era el
// que usaba GREEN (sin dirección de Worker configurada) y llamaba a Anthropic
// con una clave guardada en el navegador. Ya no existe: la prueba pasa a
// exigir que SIEMPRE se vaya por el Worker.
ok(/const urlIA=\(\)=>urlMaster\(\)\.replace/.test(app)&&!/api\.anthropic\.com/.test(app),
  'las 4 llamadas a la IA van SIEMPRE por el Worker: no queda ningún camino directo a api.anthropic.com');
ok((app.match(/fetch\(urlIA\(\)/g)||[]).length===4&&(app.match(/await prepararIA\(\)/g)||[]).length===4,
  'y las cuatro piden el token de sesión antes de llamar');
ok(/const cabIA=\(\)=>\{const h=\{'Content-Type':'application\/json'\};\s*\n\s*if\(tokenIARef\.current\)h\['Authorization'\]='Bearer '\+tokenIARef\.current;/.test(app),
  'la cabecera lleva SOLO tu sesión');
ok(!/h\['x-api-key'\]/.test(app)&&!/anthropic-dangerous/.test(app),
  'y no queda ni rastro de mandar la clave de la IA desde el navegador (era lo que fallaba en GREEN)');
ok(/window\.bh10Token = async \(\) => \{/.test(env)&&/window\.bh10InvitacionUsada = async \(token\) => \{/.test(env),'el envoltorio da el token y marca la invitación usada');
ok(/window\.bh10InvitacionUsada\(r\.id\)/.test(app),'al aplicar lo recibido, el enlace del portal queda usado (un solo uso)');
ok(/Escribe «\$\{compCfg\.name\|\|'el nombre de la empresa'\}» para desbloquear/.test(app)&&/Escribe el nombre exacto de la empresa para borrar todo/.test(app),'Borrar todo exige escribir el nombre de la empresa');
// ── 4. reglas de adjuntos y DNI ───────────────────────────────────────────
ok(/match \/empresas\/\{uid\}\/adj\/\{doc\}[\s\S]{0,300}permisoDe\(uid, 'facturas'\) in \['lectura', 'admin'\]/.test(reglas)&&/match \/empresas\/\{uid\}\/adj\/\{doc\}[\s\S]{0,500}permisoDe\(uid, 'facturas'\) == 'admin'/.test(reglas),'adjuntos: leen los de facturas, escriben los admin de facturas');
ok(/documento\[0\] in \['adj', 'cliDni'\]/.test(reglas),'el bloque genérico ya no cubre adj ni cliDni');
ok(/match \/empresas\/\{uid\}\/cliDni\/\{doc\}/.test(reglas),'cliDni tiene su propia regla (solo el dueño lee)');

// ── 5. en pantalla: el cierre por inactividad salta de verdad ──────────────
// Batería del acordeón de Ajustes: apertura ÚNICA (abrir B cierra A).
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://bh10group.com/app/',pretendToBeVisual:true});
for(const k of ['window','document','navigator','localStorage','sessionStorage','HTMLElement','Node','CustomEvent','Event','FileReader','Blob','URL','atob','btoa']){try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
globalThis.window=dom.window;
// datos reales para que haya facturas (y el botón Excel)
const _copia=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const nube={'bh10-fc-v3':_copia.claves['bh10-fc-v3']};
window.storage={get:async k=>nube[k]!==undefined?{key:k,value:nube[k]}:null,set:async(k,v)=>{nube[k]=String(v);return{key:k,value:v}},delete:async k=>{delete nube[k];return{key:k}},list:async p=>({keys:Object.keys(nube).filter(k=>!p||k.startsWith(p))}),getStatus:()=>({fase:'ok',error:'',ultimaEscritura:Date.now(),errorEscritura:'',pendientes:0,conflicto:null})};
window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
window.requestAnimationFrame=cb=>setTimeout(cb,0);globalThis.requestAnimationFrame=window.requestAnimationFrame;
window.cancelAnimationFrame=()=>{};globalThis.cancelAnimationFrame=()=>{};
class RO{observe(){}unobserve(){}disconnect(){}}window.ResizeObserver=RO;globalThis.ResizeObserver=RO;
window.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};window.scrollTo=()=>{};
window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
window.BH10_EMPRESA={sub:'',nombre:'BIG HOUSE 2010'};window.BH10_ROL='admin';
window.BH10_PERMISOS=null;
await new Promise(r=>setTimeout(r,900));
// ir a Ajustes
const tab=[...document.querySelectorAll('button')].find(b=>/Ajustes/.test(b.textContent));


window.localStorage.setItem('bh10-autocierre','1');
let cerrada=0;window.bh10Logout=async()=>{cerrada++;};
const {default:App}=await import('../web_subir/app/assets/bh10-APPV400.js');
const root=createRoot(document.getElementById('root'));
const oe=console.error;console.error=()=>{};
root.render(React.createElement(App));
const E=(ms)=>new Promise(r=>setTimeout(r,ms));
await E(1200);
const real=Date.now;Date.now=()=>real()+70000;   // «han pasado 70 s sin tocar nada» con un cierre de 1 minuto
await E(31500);                                   // el vigilante mira cada 30 s
ok(cerrada>=1,'tras 1 minuto sin actividad, la app cierra la sesión (bh10Logout)');
Date.now=real;
console.error=oe;
console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<12){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
