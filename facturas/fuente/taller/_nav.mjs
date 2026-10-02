// ═══ NAVEGACIÓN PARA LAS BATERÍAS (v364) ══════════════════════════════════
// Las pestañas cambiaron (Panel · Facturas · Obras · Tesorería · Plantilla ·
// Ajustes). Las baterías siguen diciendo «Contratos», «Nóminas», «Seguros»,
// «🏦 Remesas»…: este mapa las lleva a la pantalla de siempre por el camino
// nuevo. Un solo sitio que mantener.
// v401 · la pestaña se llama Gestión (antes Tesorería) y sus apartados llevan el
// icono en un span aparte: las expresiones aceptan las dos versiones, porque las
// baterías A/B también navegan por el bundle desplegado anterior.
const TAB_GESTION=/^(🏦|🗂️)?\s*(Tesorería|Gestión)$/;
const PASOS={
  'Panel':[/^📊?\s*Panel$/],
  'Facturas':[/^📋?\s*Facturas$/],
  'Contratos':[/^🏗?\s*Obras$/,/📑 Contratos/],
  'Nóminas':[/^👷?\s*Plantilla$/,/📊 Nóminas/],
  'Seguros':[TAB_GESTION,/^🛡️\s*Seguros$/],
  'Ajustes':[/^⚙️?\s*Ajustes$/],
  '🏦 Remesas':[TAB_GESTION,/^🏦\s*Remesas( prov\.)?$/],   // en Facturas era el de proveedores (así lo capturaba el A/B)
  '🏦 Remesas nóminas':[TAB_GESTION,/^💶\s*(Remesas )?[Nn]óminas$/],
  'Remesas':[TAB_GESTION,/^🏦\s*Remesas( prov\.)?$/],
  'Pendiente':[TAB_GESTION,/^(💰\s*Pendiente y N43|🏧\s*Banco N43)$/],
  '🏦 Financiación':[TAB_GESTION,/^(🏦|📈)\s*Financiación$/],
  'IVA':[TAB_GESTION,/^📋\s*IVA · 303$/],
  'Gestoría':[TAB_GESTION,/^📦\s*Gestoría$/],
  '📊 Panel':[/📊 Nóminas/],
  '📋 Contratos':[/📑 Contratos/],
};
const limpio=(t)=>String(t||'').replace(/\s+/g,' ').trim();
export const botonDe=(document,re)=>[...document.querySelectorAll('button')].find(b=>re.test(limpio(b.textContent)));
// Devuelve true si ha pulsado algo. Los clics de React 18 se pintan en
// síncrono (evento discreto), así que la subpestaña ya existe tras el primero.
const VIEJAS={'Contratos':/^📑?\s*Contratos$/,'Nóminas':/^👷?\s*Nóminas$/,'Seguros':/^🛡️?\s*Seguros$/};
export const irA=(document,nombre)=>{
  // producción (v3xx antiguo) aún tiene la pestaña de antes en la barra: si está, se usa
  const barra=document.getElementById('bh-tabbar');
  if(VIEJAS[nombre]&&barra){const b=[...barra.querySelectorAll('button')].find(x=>VIEJAS[nombre].test(limpio(x.textContent)));if(b){b.click();return true;}}
  const pasos=PASOS[nombre];
  if(!pasos){const b=botonDe(document,new RegExp(nombre.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));if(b){b.click();return true;}return false;}
  // el primer clic va en síncrono; los siguientes, en cadena con un respiro de
  // 150 ms cada uno (React pinta la subpestaña tras el evento; las baterías
  // esperan 600-1500 ms después de llamar, así que llegan a tiempo)
  const b0=botonDe(document,pasos[0]);if(!b0)return false;b0.click();
  const resto=pasos.slice(1);
  const sigue=(k)=>{if(k>=resto.length)return;setTimeout(()=>{const b=botonDe(document,resto[k]);if(b)b.click();sigue(k+1);},150);};
  sigue(0);
  return true;
};
