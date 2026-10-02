// ═══ BATERÍA · PERMISOS DE ESCRITURA Y ACCIONES (v364) ════════════════════
// Jesús (05-09-2026): «un usuario sin atribuciones no puede hacer cosas para
// las que no se le autoriza». Tres capas con la misma verdad (src/permisos.js):
// app (acciones), envoltorio (storage.set/delete por clave) y reglas de Firestore.
import fs from 'fs';
import {areaDeClave,puedeEscribirClave,puedeAccion,ACCIONES,AREA_DE_CLAVE,CLAVES_PERSONALES,reglasFirestoreKv,SUBAREAS,nivelSub,puedeVerSub,puedeEditarSub} from '../src/permisos.js';
let n=0,mal=0;const ok=(c,t)=>{n++;if(!c){mal++;console.log('  ✗',t);}else console.log('  ✓',t);};
const P_FACT={facturas:'admin',contratos:'lectura',nominas:'',seguros:'',tesoreria:'',ajustes:''};
// ── 1. por clave ──────────────────────────────────────────────────────────
ok(areaDeClave('bh10-fc-v3')==='facturas'&&areaDeClave('bh10-contratos')==='contratos'&&areaDeClave('bh10-nominas')==='nominas'&&areaDeClave('bh10-remesas')==='tesoreria'&&areaDeClave('bh10-vfcfg')==='ajustes','cada clave tiene su área');
ok(areaDeClave('bh10-anthkey')==='dueno'&&areaDeClave('bh10-usuarios')==='dueno'&&areaDeClave('bh10-loquesea')==='dueno','la clave de la IA, los usuarios y lo desconocido son del dueño');
ok(areaDeClave('bh10-ordenconfig')==='personal'&&areaDeClave('bh10-sesiones')==='personal'&&areaDeClave('bh10-plan-2026-09')==='nominas','personales y prefijos');
ok(puedeEscribirClave(null,'bh10-anthkey')&&puedeEscribirClave(null,'bh10-fc-v3'),'el dueño (sin permisos = dueño) escribe todo');
ok(puedeEscribirClave(P_FACT,'bh10-fc-v3')&&puedeEscribirClave(P_FACT,'bh10-diario')&&puedeEscribirClave(P_FACT,'bh10-ordenconfig'),'facturas admin: escribe facturas, diario y lo personal');
ok(!puedeEscribirClave(P_FACT,'bh10-contratos')&&!puedeEscribirClave(P_FACT,'bh10-nominas')&&!puedeEscribirClave(P_FACT,'bh10-remesas')&&!puedeEscribirClave(P_FACT,'bh10-company-v2')&&!puedeEscribirClave(P_FACT,'bh10-anthkey'),'…y NO contratos, nóminas, remesas, empresa ni la clave de la IA');
ok(!puedeEscribirClave({facturas:'lectura',ajustes:'admin'},'bh10-fc-v3')&&puedeEscribirClave({facturas:'lectura',ajustes:'admin'},'bh10-vfcfg'),'ajustes admin con facturas en lectura: toca ajustes, no facturas');
// ── 2. por acción ─────────────────────────────────────────────────────────
ok(ACCIONES.length>=7&&ACCIONES.every(a=>a.length===3),`${ACCIONES.length} acciones declaradas con su área`);
ok(puedeAccion(null,'remesar')&&puedeAccion(null,'borrar'),'el dueño tiene todas');
ok(puedeAccion(P_FACT,'remesar')&&puedeAccion(P_FACT,'pagos')&&!puedeAccion(P_FACT,'emitir')&&!puedeAccion(P_FACT,'obras'),'facturas admin: remesar y pagos sí; emitir y obras (contratos) no');
ok(!puedeAccion({...P_FACT,acciones:{remesar:false}},'remesar')&&puedeAccion({...P_FACT,acciones:{remesar:false}},'pagos'),'el dueño quita «remesar» y solo cae esa');
ok(!puedeAccion({...P_FACT,facturas:'lectura',acciones:{remesar:true}},'remesar'),'una acción marcada no vale sin admin en su área');
// ── 2b. subáreas (v365): heredan del área y se afinan por pantalla ──────────
ok(SUBAREAS.length===16&&SUBAREAS.every(x=>x.length===3),'16 subáreas declaradas con su área');
{const p={facturas:'admin',nominas:'lectura',contratos:'',sub:{emitidas:'',fichajes:'admin',obras:'lectura'}};
 ok(nivelSub(p,'recibidas')==='admin'&&nivelSub(p,'emitidas')===''&&nivelSub(p,'fichajes')==='admin'&&nivelSub(p,'nominas')==='lectura'&&nivelSub(p,'obras')==='lectura'&&nivelSub(p,'contratos')==='','hereda del área y la subárea afina en ambos sentidos');
 ok(puedeVerSub(p,'recibidas')&&!puedeVerSub(p,'emitidas')&&puedeEditarSub(p,'fichajes')&&!puedeEditarSub(p,'nominas')&&puedeVerSub(p,'obras')&&!puedeEditarSub(p,'obras'),'ver / editar por subárea');
 ok(nivelSub(null,'fichajes')==='admin','el dueño lo ve y edita todo');}
// ── 3. reglas de Firestore generadas desde el mismo mapa ──────────────────
const reglas=reglasFirestoreKv();
const noDueno=Object.entries(AREA_DE_CLAVE).filter(([,a])=>a!=='dueno').map(([k])=>k);
ok(noDueno.every(k=>reglas.includes("'"+k+"'"))&&CLAVES_PERSONALES.every(k=>reglas.includes("'"+k+"'")),'las reglas nombran todas las claves de área y las personales');
ok(!/'bh10-anthkey'|'bh10-usuarios'|'bh10-mastercfg'/.test(reglas),'las reglas NO abren las claves del dueño a nadie');
ok(/permisoDe\(uid, 'facturas'\) == 'admin'/.test(reglas)&&/match \/empresas\/\{uid\}\/kv\/\{clave\}/.test(reglas)&&/sub\/\{sub\}\/kv\/\{clave\}/.test(reglas),'exigen admin por área, en kv y en sub/kv');
const fichero=fs.readFileSync(new URL('../web_subir/REGLAS_FIRESTORE.txt',import.meta.url),'utf8');
ok(fichero.includes('function claveEscribible')&&fichero.includes("documento[0] != 'kv'"),'REGLAS_FIRESTORE.txt lleva el bloque y el genérico ya no cubre kv (Firestore concede si cualquier match lo permite)');
// ── 4. el envoltorio y la app usan el módulo ──────────────────────────────
const env=fs.readFileSync(new URL('../src-envoltorio/envoltorio.jsx',import.meta.url),'utf8');
ok(/import \{puedeEscribirClave\} from '\.\.\/src\/permisos\.js'/.test(env)&&(env.match(/puedeEscribirClave\(window\.BH10_PERMISOS, T\)/g)||[]).length===2,'storage.set y storage.delete rechazan la clave ajena (sinPermiso)');
const app=fs.readFileSync(new URL('../src/app.jsx',import.meta.url),'utf8');
for(const [ac,que] of [['remesar','generateSEPA'],['remesar','generatePayroll'],['pagos','savePago'],['pagos','deletePago'],['borrar','deleteInvoice'],['emitir','generarCertificacion'],['exportar','exportExcelLista'],['exportar','exportZipLista'],['exportar','generarPaqueteGestoria']]){
  const i=app.indexOf('const '+que);const seg=app.slice(i,i+400);
  ok(i>=0&&seg.includes(`sinAccion('${ac}'`),`${que} exige la acción «${ac}»`);
}
ok(/const extractInvoiceData = async \(file, retried\) => \{\s*if\(!puedeAccion\('lector'\)\)/.test(app),'el lector IA exige la acción «lector»');
ok((app.match(/sinAccion\('obras'/g)||[]).length>=4,'importar, fundir (dos vías) e imputar obras exigen la acción «obras»');
ok(/ACCIONES\.map\(\(\[ac,lbl,area\]\)=>/.test(app)&&/acciones:\{\.\.\.\(x\.permisos&&x\.permisos\.acciones\|\|\{\}\),\[ac\]:e\.target\.checked\}/.test(app),'Master ofrece las acciones por usuario y las guarda en permisos.acciones');

// ── 4b. seguridad v365: caché al salir, olvidar aparato, copia cifrada sin clave IA, inactividad, reglas ──
ok(/window\.bh10LimpiarCache = \(todo\) => \{/.test(env)&&/const conservar = new Set\(\[Jb, _5, "bh10-modo", "bh10-empresa", "bh10-autocierre"\]\)/.test(env)&&/window\.bh10OlvidarAparato = async \(\) => \{[\s\S]{0,400}bh10LimpiarCache\("todo"\)/.test(env),'el envoltorio vacía lo bh10* al salir (conservando Face ID y su cofre) y TODO al olvidar el aparato');
ok(/window\.bh10Logout = async \(\) => \{\s*window\.bh10LimpiarCache\(\);/.test(env),'cerrar sesión vacía la caché local antes de salir');
ok(/window\.bh10OlvidarAparato = async \(\) => \{/.test(env)&&/🧹 Olvidar este aparato/.test(app)&&/lista\.filter\(x=>x&&x\.id!==SESION_ID\)/.test(app),'«Olvidar este aparato»: vacía, retira la sesión de la lista y sale');
ok(/const CLAVES_FUERA_DE_COPIA=new Set\(\['bh10-anthkey'\]\)/.test(app)&&/if\(CLAVES_FUERA_DE_COPIA\.has\(k\)\)continue;/.test(app),'la copia completa nunca lleva la clave de la IA');
ok(/if\(clave\.length<8\)\{notify\('Copia NO guardada/.test(app)&&/crearZipSeguro\(\[\{nombre:`BH10_copia_completa_\$\{today\}\.json`,texto\}\],\{clave,fuerte:true\}\)/.test(app),'la copia sale cifrada (AES-256) con contraseña de 8+ caracteres, o no sale');
ok(/accept="\.json,\.zip"/.test(app)&&/new ZipReader\(new BlobReader\(f\),\{password:clave\}\)/.test(app),'la restauración abre la copia cifrada pidiendo la contraseña');
ok(/localStorage\.getItem\('bh10-autocierre'\)\|\|'30'/.test(app)&&/Sesión cerrada por inactividad/.test(app)&&/\[\[0,'nunca'\],\[5,'5 min'\],\[15,'15 min'\],\[30,'30 min'\],\[60,'1 hora'\]\]/.test(app),'cierre por inactividad: 30 min por defecto, ajustable por aparato');
{const r=fs.readFileSync(new URL('../web_subir/REGLAS_FIRESTORE.txt',import.meta.url),'utf8');
 ok(/match \/empresas\/\{uid\}\/adj\/\{doc\}/.test(r)&&/permisoDe\(uid, 'facturas'\) in \['lectura', 'admin'\]/.test(r),'reglas: los adjuntos se leen con facturas y se escriben con facturas en admin');
 ok(/cliDni\/\{doc\} \{\s*allow create: if esImagenValida\(\);\s*\/\/[^\n]*\n\s*allow read, delete: if request\.auth != null && request\.auth\.uid == uid;/.test(r),'reglas: los DNI del portal solo los lee y borra el dueño');
 ok(/!\(documento\[0\] in \['adj', 'cliDni'\]\)/.test(r)&&/documento\[0\] != 'adj'/.test(r),'el bloque genérico ya no abre adj ni cliDni a los miembros');}
// ── 5. en pantalla: un miembro con facturas en admin pero sin «exportar» ni «pagos» ──
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
const oe=console.error;console.error=()=>{};
window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
window.requestAnimationFrame=cb=>setTimeout(cb,0);globalThis.requestAnimationFrame=window.requestAnimationFrame;
window.cancelAnimationFrame=()=>{};globalThis.cancelAnimationFrame=()=>{};
class RO{observe(){}unobserve(){}disconnect(){}}window.ResizeObserver=RO;globalThis.ResizeObserver=RO;
window.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};window.scrollTo=()=>{};
window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
window.BH10_EMPRESA={sub:'',nombre:'BIG HOUSE 2010'};window.BH10_ROL='admin';
window.BH10_PERMISOS={facturas:'admin',contratos:'lectura',nominas:'admin',seguros:'',tesoreria:'',ajustes:'',acciones:{exportar:false,pagos:false},sub:{emitidas:'',nominas:'',fichajes:'admin'}};
const {default:App}=await import('../web_subir/app/assets/bh10-APPV408.js');
const root=createRoot(document.getElementById('root'));
root.render(React.createElement(App));
await new Promise(r=>setTimeout(r,900));
// ir a Ajustes
const tab=[...document.querySelectorAll('button')].find(b=>/Ajustes/.test(b.textContent));

const E=(ms)=>new Promise(r=>setTimeout(r,ms));
await E(1500);
const btn=(re)=>[...document.querySelectorAll('button')].find(b=>re.test(b.textContent));
btn(/Facturas/).click();await E(700);
const filtros=btn(/🔎 Filtros/);filtros&&filtros.click();await E(400);   // el Excel vive en el panel de filtros
const excel=btn(/📊 Excel/);
ok(!!excel,'ve el botón Excel (la pantalla no lo esconde: es la acción la que frena)');
// solo cuentan los blobs de Excel (otros createObjectURL —QR, adjuntos— no son descargas)
let descargas=0;const _co=window.URL.createObjectURL;window.URL.createObjectURL=(b)=>{if(b&&/spreadsheet|excel|octet/.test(String(b.type||'')))descargas++;return 'blob:x';};
// el aviso dura 2,8 s: se sondea hasta verlo (y si el primer clic cayó en un repintado, se pulsa otra vez)
let visto=false;
for(let intento=0;intento<2&&!visto;intento++){
  const b=btn(/📊 Excel/);b&&b.click();
  for(let k=0;k<12&&!visto;k++){await E(150);if(/Sin permiso para exportar/.test(document.body.textContent))visto=true;}
}
ok(descargas===0&&visto,'al pulsar Excel: nada se descarga y avisa «Sin permiso para exportar»');
// ── 6. subáreas en pantalla ────────────────────────────────────────────────
{
  btn(/^📋?\s*Facturas$/)&&btn(/^📋?\s*Facturas$/).click();await E(600);
  const sub=[...document.querySelectorAll('button')].map(b=>b.textContent);
  ok(sub.some(t=>/Recibidas/.test(t))&&!sub.some(t=>/^📤\s?Emitidas/.test(t)),'Facturas: ve Recibidas y NO ve Emitidas (subárea cerrada)');
  const pl=btn(/^👷?\s*Plantilla$/);pl&&pl.click();await E(600);
  const sub2=[...document.querySelectorAll('button')].map(b=>b.textContent);
  ok(sub2.some(t=>/👥 Plantilla/.test(t))&&!sub2.some(t=>/📊 Nóminas|💶 Remesar|📄 Leer PDF/.test(t)),'Plantilla: ve empleados y NO ve nóminas ni remesar (subárea nóminas cerrada aunque el área sea admin)');
}
// ── 7. en pantalla: «Olvidar este aparato» vacía el navegador y cierra sesión ──
{
  localStorage.setItem('bh10ls:x:y:bh10-fc-v3','[]');localStorage.setItem('otra','1');
  let salio=false;window.bh10LimpiarCache=()=>{const b=[];for(let k=0;k<localStorage.length;k++){const c=localStorage.key(k);if(/^bh10/.test(c))b.push(c);}b.forEach(c=>localStorage.removeItem(c));return b.length;};
  window.bh10OlvidarAparato=async()=>{window.bh10LimpiarCache();salio=true;};
  window.BH10_PERMISOS=null;   // el dueño: ve Nube y sesión
  window.storage.getStatus=()=>({fase:'ok'});  // la tarjeta solo se pinta si el almacén responde
  btn(/^📊?\s*Panel$/)&&btn(/^📊?\s*Panel$/).click();await E(400);   // un repintado para que la barra vea al dueño
  btn(/Ajustes/)&&btn(/Ajustes/).click();await E(900);
  const cas=[...document.querySelectorAll('button[data-aj="casilla"]')].find(b=>/Nube y sesión/.test(b.textContent));
  if(cas){cas.click();await E(500);}
  const olv=[...document.querySelectorAll('button')].find(b=>/Olvidar este aparato/.test(b.textContent));
  ok(!!olv,'el dueño ve «🧹 Olvidar este aparato» en Nube y sesión');
  if(olv){olv.click();await E(150);olv.click();await E(400);}
  ok(salio&&localStorage.getItem('bh10ls:x:y:bh10-fc-v3')===null&&localStorage.getItem('otra')==='1','al confirmar: se vacía lo bh10* (y solo eso) y se cierra la sesión');
}
console.error=oe;
console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<45){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
