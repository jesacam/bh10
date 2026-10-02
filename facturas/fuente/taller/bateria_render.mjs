import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
import fs from 'fs';

const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://bh10group.com/app/',pretendToBeVisual:true});
for(const k of ['window','document','navigator','localStorage','sessionStorage','location','HTMLElement','Node','getComputedStyle','requestAnimationFrame','cancelAnimationFrame','CustomEvent','Event','FileReader','Blob','URL','atob','btoa','matchMedia'])
  { try{ globalThis[k]=dom.window[k]??globalThis[k]; }catch(e){} }
globalThis.window=dom.window;
window.matchMedia=window.matchMedia||(()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}));
window.requestAnimationFrame=cb=>setTimeout(cb,0);
window.__BH10_R=React; window.__BH10_JSX=JSXR;
window.__BH10_STANDALONE=true; window.__BH10_MULTI=true;
window.BH10_EMPRESA={sub:'',nombre:'BIG HOUSE 2010'};

// nube de mentira: contrato completo de window.storage
const nube={};
const mkStorage=()=>({
  get:async k=>nube[k]!==undefined?{key:k,value:nube[k]}:null,
  set:async(k,v)=>{nube[k]=String(v);return{key:k,value:v}},
  delete:async k=>{delete nube[k];return{key:k,deleted:true}},
  list:async p=>({keys:Object.keys(nube).filter(k=>!p||k.startsWith(p))}),
  getStatus:()=>({fase:'ok',error:'',ultimaEscritura:Date.now(),errorEscritura:'',pendientes:0,conflicto:null})
});

const escenarios=[
 {n:'DUEÑO (todo igual que hoy)', rol:'admin', permisos:null,
  espera:{tabs:['Panel','Facturas','Obras','Gestión','Plantilla','Ajustes'], sinTabs:['Contratos','Nóminas','Seguros'], master:true, teso:true}},
 {n:'MIEMBRO Benito (facturas admin, contratos lectura, resto nada)', rol:'admin',
  permisos:{facturas:'admin',contratos:'lectura',nominas:'',seguros:'',tesoreria:'',ajustes:''},
  espera:{tabs:['Panel','Facturas','Obras','Gestión'], sinTabs:['Plantilla','Ajustes','Nóminas','Seguros'], master:false, teso:false}},
 {n:'MIEMBRO con Ajustes en admin (el máximo que se puede dar desde Master)', rol:'admin',
  permisos:{facturas:'admin',contratos:'admin',nominas:'admin',seguros:'admin',tesoreria:'admin',ajustes:'admin'},
  espera:{tabs:['Panel','Facturas','Obras','Gestión','Plantilla','Ajustes'], master:false, teso:true,
    ajustesSin:['Clave API','Copia de seguridad completa','Borrar todo','Custodia y destrucción','Panel Master','Portal de proveedores','Consumo de la clave API'],
    ajustesCon:['Archivar documentos','Remesas y pagos','Apariencia']}},
 {n:'MIEMBRO con Ajustes en lectura', rol:'admin',
  permisos:{facturas:'admin',contratos:'lectura',nominas:'',seguros:'',tesoreria:'',ajustes:'lectura'},
  espera:{tabs:['Panel','Facturas','Obras','Gestión','Ajustes'], master:false, teso:false,
    ajustesSin:['Clave API','Copia de seguridad completa','Borrar todo','Custodia y destrucción','Panel Master','Portal de proveedores','Consumo de la clave API','Datos empresa ordenante','Registro VERI','Exportar','Importar desde Excel']}},
 {n:'MIEMBRO solo-lectura total', rol:'admin',
  permisos:{facturas:'lectura',contratos:'',nominas:'',seguros:'',tesoreria:'lectura',ajustes:''},
  espera:{tabs:['Panel','Facturas','Gestión'], sinTabs:['Obras','Plantilla','Ajustes'], master:false, teso:true}},
];

const {default:App}=await import('../web_subir/app/assets/bh10-APPV401.js');
let fallos=0;
const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m); if(!c)fallos++;};

for(const esc of escenarios){
  window.BH10_ROL=esc.rol; window.BH10_PERMISOS=esc.permisos; window.__BH10_AREA='';
  window.__BH10_DUENO='uidDueno'; window.storage=mkStorage();
  document.getElementById('root').innerHTML='';
  const root=createRoot(document.getElementById('root'));
  let err=null;
  const oldErr=console.error; console.error=()=>{};
  try{ root.render(React.createElement(App)); await new Promise(r=>setTimeout(r,900)); }
  catch(e){ err=e; }
  console.error=oldErr;
  const html=document.getElementById('root').innerHTML;
  console.log('── '+esc.n);
  ok(!err,'monta sin excepción'+(err?' → '+err.message:''));
  ok(html.length>5000,'pinta contenido ('+html.length+' chars)');
  const barra=(document.getElementById('bh-tabbar')||{}).textContent||'';
  for(const t of esc.espera.tabs) ok(barra.includes(t),'pestaña visible: '+t);
  for(const t of esc.espera.sinTabs||[]) ok(!barra.includes(t),'pestaña ESCONDIDA: '+t);
  // v364 · Jesús: un lector de contratos entraba en Obras y la app se caía (setState durante el render).
  // Se pasa por las pestañas visibles y se comprueba que ninguna tumba la app.
  for(const t of esc.espera.tabs){
    const bt=[...document.querySelectorAll('button')].find(b=>new RegExp('^\\S*\\s*'+t+'$').test(b.textContent.trim()));
    if(!bt)continue;bt.click();await new Promise(r=>setTimeout(r,450));
    ok(!/La aplicación ha tropezado/.test(document.body.textContent),'la pestaña «'+t+'» no tumba la app para este usuario');
  }
  // v363 · Jesús (05-09-2026): «confirmar que un usuario dado de alta desde el panel
  // Master no puede sacar copia de las claves, ni hacer copias de seguridad».
  // Si el escenario tiene Ajustes, se entra y se mira qué casillas hay.
  if(esc.espera.ajustesSin||esc.espera.ajustesCon){
    const tab=[...document.querySelectorAll('button')].find(b=>/Ajustes/.test(b.textContent));
    if(tab){tab.click();await new Promise(r=>setTimeout(r,700));}
    const casillas=[...document.querySelectorAll('button[data-aj="casilla"]')].map(b=>b.textContent);
    const todo=(document.getElementById('bh-config')||{}).textContent||'';
    for(const t of esc.espera.ajustesSin||[])ok(!casillas.some(c=>c.includes(t))&&!todo.includes(t),'Ajustes SIN «'+t+'» para este usuario');
    for(const t of esc.espera.ajustesCon||[])ok(casillas.some(c=>c.includes(t)),'Ajustes CON «'+t+'»');
    ok(!/sk-ant-api03-[A-Za-z0-9_-]{10,}/.test(html+document.body.innerHTML),'la clave API nunca aparece en el DOM de este usuario');
  }
  root.unmount();
}
// ── tarjetas huérfanas (v345): toda tarjeta del panel con id 'h-'/'n-' tiene
// que estar en KPI_IDS, o los botones de mover la rechazan en silencio
// (moverKpi: indexOf → -1 → return) y el arrastre revierte al filtrarse.
{const _src=fs.readFileSync('src/app.jsx','utf8');
 const _ids=[...new Set([..._src.matchAll(/id:'([hn]-[a-z0-9]+)'/g)].map(m=>m[1]))];
 const _m=_src.match(/const KPI_IDS=\[([\s\S]*?)\];/)[1];
 const _lista=[..._m.matchAll(/'([^']+)'/g)].map(x=>x[1]);
 const _huerf=_ids.filter(x=>!_lista.includes(x));
 if(_huerf.length){console.log('  ✗ tarjetas del panel FUERA de KPI_IDS (no se pueden mover): '+_huerf.join(', '));fallos++;}
 else console.log('  ✓ las '+_ids.length+' tarjetas h-/n- del panel están en KPI_IDS: todas movibles');}
console.log(fallos===0?'\n═══ BATERÍA RENDER: TODO OK ═══':'\n═══ FALLOS: '+fallos+' ═══');
process.exit(fallos?1:0);
