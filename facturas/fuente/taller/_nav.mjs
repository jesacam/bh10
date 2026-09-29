// ═══ NAVEGACIÓN PARA LAS BATERÍAS (v364) ══════════════════════════════════
// Las pestañas cambiaron (Panel · Facturas · Obras · Tesorería · Plantilla ·
// Ajustes). Las baterías siguen diciendo «Contratos», «Nóminas», «Seguros»,
// «🏦 Remesas»…: este mapa las lleva a la pantalla de siempre por el camino
// nuevo. Un solo sitio que mantener.
const PASOS={
  'Panel':[/^📊?\s*Panel$/],
  'Facturas':[/^📋?\s*Facturas$/],
  'Contratos':[/^🏗?\s*Obras$/,/📑 Contratos/],
  'Nóminas':[/^👷?\s*Plantilla$/,/📊 Nóminas/],
  'Seguros':[/^🏦?\s*Tesorería$/,/🛡️ Seguros/],
  'Ajustes':[/^⚙️?\s*Ajustes$/],
  '🏦 Remesas':[/^🏦?\s*Tesorería$/,/🏦 Remesas prov\./],   // en Facturas era el de proveedores (así lo capturaba el A/B)
  '🏦 Remesas nóminas':[/^🏦?\s*Tesorería$/,/💶 Remesas nóminas/],
  'Remesas':[/^🏦?\s*Tesorería$/,/🏦 Remesas prov\./],
  'Pendiente':[/^🏦?\s*Tesorería$/,/💰 Pendiente y N43/],
  '🏦 Financiación':[/^🏦?\s*Tesorería$/,/🏦 Financiación/],
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
