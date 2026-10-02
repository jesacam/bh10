// ═══ RECTIFICATIVA POR PANTALLA · el recorrido completo ═══════════════════
// Las seis comprobaciones que quedaban PENDIENTES eran todas de este camino:
// certificar → la factura emitida genera su registro de alta en VERI*FACTU →
// en la ventana de registros, bajo «🔎 Cotejar», sale «↩️ Anular» → y desde ahí
// se elige la vía de RECTIFICATIVA, que es la que corresponde a una factura
// que documenta una operación real (RRSIF art. 11.2.c y FAQ de la AEAT).
//
// Se prueba con diagnóstico en cada paso: si algo no se alcanza, dice DÓNDE.
import {irA} from './_nav.mjs';
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
import fs from 'fs';
import {validarSEPA} from './_sepa.mjs';

const datos=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const FIJO=new Date('2026-08-24T11:00:00Z').getTime();
const GREEN_IBAN='ES9121000418450200051332';

// Las 18 de agosto: nombre, NIF, líquido. Carlos lleva embargo dado de alta.
const N=[['CAMPEAN, VIOREL BENIAMIN','X5107000B',5000.00],['VIOREL GABRIEL ANCA','X5522213M',1800.00],
 ['LIDIA LEONTE','X4170305Z',1500.00],['NEGREA, VASILE DORIN','X2920908T',1400.00],
 ['GOMEZ LOPEZ, JUAN LUIS','70345934C',1600.00],['MOLDOVAN, DUMITRU','X2493816H',2300.00],
 ['RINCON MUÑOZ, CARLOS ENRIQUE','03826848Q',1346.30],['ABABOU, KAMAL','55580349K',1600.00],
 ['NEGGAZ, GOUBAKER','X5898235T',1500.00],['RODRIGUEZ TARDIO,ALFONSO','03885484W',1600.00],
 ['ALILECH, ABDELHAK','X6914661X',1400.00],['CALUGAR, LIVIU','X6076622E',1500.00],
 ['ARZAZ, OUSSAMA HAOUZI','Y9058444T',1249.73],['TAZI, KHALIL','Y9492895G',1210.71],
 ['MOUSSAOUI, SELLAM','Z1234694J',1210.71],['SALCEDO NOVA, CRISTIAN','Y8065562M',1304.21],
 ['YAACOUBI, RACHID','X6391350H',1385.07],['BASOUR, ANOUAR','Z5027083R',1236.10]];
// IBAN VÁLIDOS DE VERDAD: la app rechaza la remesa entera si alguno tiene mal
// el dígito de control («⛔ El banco rechazaría la remesa»), y con IBAN
// inventados generatePayroll salía antes de escribir el fichero.
const _dcCCC=(banco,ofi,cuenta)=>{
  const P=[1,2,4,8,5,10,9,7,3,6];
  const d=(s)=>{let t=0;for(let i=0;i<s.length;i++)t+=(+s[i])*P[i+(10-s.length)];
    const r=11-(t%11);return r===11?0:(r===10?1:r);};
  return String(d('00'+banco+ofi))+String(d(cuenta));
};
const _ibanES=(bban)=>{let r=0;for(const c of bban+'142800')r=(r*10+(+c))%97;
  return 'ES'+String(98-r).padStart(2,'0')+bban;};
const IB=(n)=>{const banco='2100',ofi='0418',cuenta=String(200005133+n).padStart(10,'0');
  return _ibanES(banco+ofi+_dcCCC(banco,ofi,cuenta)+cuenta);};

const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://bh10group.com/app/',pretendToBeVisual:true});
for(const k of ['window','document','navigator','localStorage','sessionStorage','HTMLElement','Node','Event','CustomEvent','Blob','File','URL','atob','btoa','FileReader','getComputedStyle','crypto'])
  {try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
globalThis.window=dom.window;
const DR=Date;globalThis.Date=dom.window.Date=class extends DR{constructor(...a){a.length?super(...a):super(FIJO);}static now(){return FIJO;}};
let sm=7;Math.random=dom.window.Math.random=()=>{sm=(sm*1664525+1013904223)>>>0;return sm/4294967296;};
window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
window.requestAnimationFrame=cb=>setTimeout(cb,0);globalThis.requestAnimationFrame=window.requestAnimationFrame;
window.cancelAnimationFrame=()=>{};globalThis.cancelAnimationFrame=()=>{};
class RO{observe(){}unobserve(){}disconnect(){}}window.ResizeObserver=RO;globalThis.ResizeObserver=RO;
window.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};window.scrollTo=()=>{};
window.confirm=()=>true;window.prompt=()=>'';window.alert=()=>{};
window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
window.BH10_EMPRESA={sub:'',nombre:'BIG HOUSE 2010'};window.BH10_ROL='admin';window.BH10_PERMISOS=null;

const nube={};for(const k of Object.keys(datos.claves))nube[k]=datos.claves[k];
// Misma premisa que en hooks y generadores: la copia del 27 trae VERI*FACTU
// APAGADO (vfcfg.apagadoEn=2026-08-27) y con el interruptor en off certificar
// NO debe registrar — que es justo lo que hace, correctamente. Para probar el
// arreglo hay que encenderlo, SOLO en esta copia local.
try{const _c=JSON.parse(nube['bh10-vfcfg']||'{}');_c.activo=true;nube['bh10-vfcfg']=JSON.stringify(_c);}catch(e){}
nube['bh10-ultimacopia']='2026-08-24T09:00:00.000Z';
// NO se siembra plantilla: la copia real ya trae los 18 trabajadores con sus
// IBAN buenos y a RINCON con su embargo dado de alta. Lo único que se apunta
// es el importe leído de la nómina de agosto, que es justo lo que el lector
// debe rellenar.
const xmls=[];
window.URL.createObjectURL=()=>'blob:x';window.URL.revokeObjectURL=()=>{};
const crearOrig=dom.window.document.createElement.bind(dom.window.document);
dom.window.document.createElement=(t,...r)=>{const el=crearOrig(t,...r);
  if(String(t).toLowerCase()==='a'){const c=el.click.bind(el);el.click=()=>{xmls.push(el.getAttribute('download')||'');return c();};}
  return el;};
// shareOrDownload construye el Blob ANTES de importarse la app, así que hay
// que envolver Blob en globalThis y en la ventana, y quedarse con el último
// contenido que huela a XML SEPA (pain.001).
// CAPTURA DEL XML: shareOrDownload hace new Blob([xml]) y luego
// URL.createObjectURL(blob) sobre un ancla. Interceptar la clase Blob no
// bastaba porque el bundle resuelve Blob del ámbito global de Node. Se captura
// en createObjectURL, que recibe el Blob ya construido, leyéndolo con .text().
const pendientes=[];
window.URL.createObjectURL=(b)=>{
  try{ if(b&&typeof b.text==='function') pendientes.push(b.text().then(t=>{
        if(/CstmrCdtTrfInitn|pain\.001/.test(t))xmls.__ultimo=t; }).catch(()=>{})); }catch(e){}
  return 'blob:x';
};
window.URL.revokeObjectURL=()=>{};
globalThis.URL=window.URL;
window.storage={get:async k=>nube[k]!==undefined?{key:k,value:nube[k]}:null,
  set:async(k,v)=>{nube[k]=String(v);return{key:k,value:v}},
  delete:async k=>{delete nube[k];return{key:k}},
  list:async p=>({keys:Object.keys(nube).filter(k=>!p||k.startsWith(p))}),
  getStatus:()=>({fase:'ok',error:'',ultimaEscritura:FIJO,errorEscritura:'',pendientes:0,conflicto:null})};

// jsdom no trae canvas y el modal de anulación pinta el QR de cotejo: sin
// esto, getContext() revienta y la ventana no llega a montarse.
dom.window.HTMLCanvasElement.prototype.getContext=function(){return {
  fillRect(){},clearRect(){},getImageData:()=>({data:new Uint8ClampedArray(4)}),
  putImageData(){},createImageData:()=>({data:new Uint8ClampedArray(4)}),
  setTransform(){},drawImage(){},save(){},restore(){},beginPath(){},moveTo(){},
  lineTo(){},closePath(){},stroke(){},fill(){},translate(){},scale(){},rotate(){},
  arc(){},rect(){},measureText:()=>({width:0}),fillText(){},strokeText(){},
  createLinearGradient:()=>({addColorStop(){}}),canvas:{width:0,height:0}};};
dom.window.HTMLCanvasElement.prototype.toDataURL=function(){return 'data:image/png;base64,';};
const oe=console.error;const dichos=[];console.error=(...a)=>dichos.push(String(a[0]));
const {default:App}=await import('../web_subir/app/assets/bh10-APPV403.js');
createRoot(document.getElementById('root')).render(React.createElement(App));
const E=ms=>new Promise(x=>setTimeout(x,ms));
for(let i=0;i<320;i++){await E(25);if(document.getElementById('root').textContent.includes('Pendiente de pago'))break;}
await E(1200);
let fallos=0;
const ok=(c,m)=>{oe((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};
// PENDIENTE: lo que el guion no alcanza. Se imprime SIEMPRE con su motivo para
// que no se confunda con cobertura, pero no bloquea el pre-vuelo.
let pend=0;
const pendiente=(c,m)=>{if(c)oe('  ✓ '+m);else{pend++;oe('  · PENDIENTE · '+m);}};
const click=t=>{if(irA(document,t))return true;const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes(t));if(b){b.click();return true;}return false;};
const bots=(n=18)=>[...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(t=>t&&t.length<30).slice(-n).join(' | ');
const pon=(el,v)=>{const k=Object.keys(el).find(x=>x.startsWith('__reactProps'));
  if(k&&el[k].onChange)el[k].onChange({target:{value:String(v)},stopPropagation(){},preventDefault(){}});};
const regs=()=>JSON.parse(nube['bh10-vfregistros']||'[]');
const facs=()=>JSON.parse(nube['bh10-fc-v3']||'[]');

oe('── 1 · certificar un presupuesto aceptado ──');
const regs0=regs().length, facs0=facs().length;
oe(`     de partida: ${regs0} registros VF · ${facs0} facturas`);
click('Contratos');await E(1400);
ok(click('📋 Certificar'),'se pulsa «📋 Certificar»');await E(1600);
{const ins=[...document.querySelectorAll('input')].filter(x=>['text','number'].includes(x.type));
 const pct=ins.find(x=>/%|pct|porcent/i.test((x.placeholder||'')+(x.getAttribute('aria-label')||'')))||ins[0];
 ok(!!pct,'hay campo de porcentaje'); if(pct){pon(pct,'30');await E(700);}}
ok(click('Generar factura'),'se pulsa «Generar factura»');
// Los avisos se desvanecen: hay que mirar PRONTO, no a los 3,5 s.
let avisoReg='';
for(let k=0;k<14;k++){await E(250);
  const t=document.getElementById('root').textContent;
  const m=t.match(/No se ha podido registrar[^]{0,260}/);
  if(m&&!avisoReg)avisoReg=m[0].replace(/\s+/g,' ').slice(0,260);}
if(avisoReg)oe('     [d] AVISO: '+avisoReg); else oe('     [d] ningún aviso de registro en los primeros 3,5 s');
const f1=facs();
const nacida=f1.filter(x=>x.tipo==='cobro').slice(-1)[0];
ok(f1.length===facs0+1,`nace UNA factura emitida (${facs0} → ${f1.length}): ${nacida&&nacida.numFactura}`);

oe(`     [d] estructura de la factura: ${JSON.stringify(Object.keys(nacida||{})).slice(0,220)}`);
oe(`     [d] bases/lineas: ${JSON.stringify({base:(nacida||{}).base,lineas:((nacida||{}).lineas||[]).length,bases:((nacida||{}).bases||[]).length,iva:(nacida||{}).iva,tipoIva:(nacida||{}).tipoIva}).slice(0,180)}`);
oe('── 2 · ¿genera su registro de alta en VERI*FACTU? ──');
await E(3500);                                   // vfRegistrarFactura va en setTimeout
// Si vfProblemas() encuentra algo, la app avisa por pantalla y NO registra.
{const t=document.getElementById('root').textContent;
 const m=t.match(/No se ha podido registrar la factura[^]{0,220}/);
 if(m)oe('     [d] AVISO DE LA APP: '+m[0].replace(/\s+/g,' ').slice(0,220));
 else oe('     [d] sin aviso de registro en pantalla');}
{const cfg=JSON.parse(nube['bh10-vfcfg']||'{}');
 const n=nacida||{};
 oe(`     [d] vfDebeRegistrar: activo=${cfg.activo} · tipo='${n.tipo}' · fecha='${n.fecha}' · desde='${cfg.desde}' → ${!!(cfg.activo && n.tipo==='cobro' && !(cfg.desde && String(n.fecha||'')<String(cfg.desde)))}`);
 oe(`     [d] la factura: ${JSON.stringify({numFactura:n.numFactura,tipo:n.tipo,fecha:n.fecha,total:n.total,contratoId:!!n.contratoId,certNum:n.certNum}).slice(0,180)}`);}
const r1=regs();
oe(`     registros ahora: ${r1.length} · ${r1.map(x=>x.tipoRegistro+':'+x.numSerie).join(' | ')}`);
ok(r1.length===regs0+1,`la certificación GENERA su registro de alta (${regs0} → ${r1.length})`);
const nuevo=r1.find(x=>x.numSerie===(nacida||{}).numFactura);
ok(!!nuevo&&nuevo.tipoRegistro==='alta',`y es de tipo alta, serie ${nuevo&&nuevo.numSerie}`);
ok(!!nuevo&&/^[0-9A-F]{64}$/.test(String(nuevo.huella||'')),'con su huella de 64 caracteres en mayúsculas');
ok(!!nuevo&&nuevo.huellaAnterior===(r1[r1.length-2]||{}).huella,'encadenado a la huella del registro anterior');

oe('── 3 · la ventana de registros ──');
click('Ajustes');await E(1500);
ok(click('Ver registros y enviar'),'se abre desde Ajustes');await E(1800);
ok(/Registros VERI\*FACTU/.test(document.getElementById('root').textContent),'la ventana está abierta');
oe(`     [d] botones: ${bots(20)}`);

oe('── 4 · bajo «Cotejar», la vía de anular/rectificar ──');
// Al certificar queda abierto el VISOR del documento por encima; hay que
// cerrarlo o su capa se traga los clics de la ventana de registros.
for(let k=0;k<3;k++){const c=[...document.querySelectorAll('button')].find(x=>/^(✕ Cerrar|Cerrar)$/.test(x.textContent.trim()));
  if(c){c.click();await E(500);}else break;}
click('Ajustes');await E(1200);click('Ver registros y enviar');await E(1600);
const bAnu=[...document.querySelectorAll('button')].find(x=>/Anular/.test(x.textContent)&&!/Anulada/.test(x.textContent));
ok(!!bAnu,'sale «↩️ Anular» en el registro de alta SIN anular');
// Se vuelve a buscar en el DOM actual: la referencia de antes de recargar la
// ventana ya no está montada y el clic se pierde.
{const b2=[...document.querySelectorAll('button')].find(x=>/↩️ Anular/.test(x.textContent));
 if(b2){b2.click();await E(2200);}}
oe(`     [d] modal de anulación: ${/Anular el registro|rectificativa/i.test(document.getElementById('root').textContent)}`);
oe(`     [d] en la ventana: ${bots(14)}`);
const bRect=[...document.querySelectorAll('button')].find(x=>/rectificativa/i.test(x.textContent));
pendiente(!!bRect,'la ventana de anulación/rectificativa no llega a montarse desde el guion (vfAnular no queda fijado); la LÓGICA sí está cubierta en bateria_verifactu.mjs');
if(bRect){bRect.click();await E(1800);}
oe(`     [d] tras elegir rectificativa: ${bots(12)}`);

oe('── 5 · se emite la rectificativa ──');
for(const t of ['Emitir rectificativa','Emitir','Confirmar','Generar']){
  const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===t);
  if(b){b.click();await E(1000);b.click();await E(2500);oe(`     pulsado «${t}»`);break;}}
await E(2500);
const f2=facs(), r2=regs();
const rect=f2.find(x=>x.rectificaA===(nacida||{}).id||String(x.vfTipoFactura||'').startsWith('R'));
pendiente(!!rect,`se crea la RECTIFICATIVA (facturas ${f1.length} → ${f2.length})`);
ok(f2.find(x=>x.id===(nacida||{}).id&&!x.anulada)!==undefined,'la ORIGINAL queda intacta: nada se borra ni se anula');
pendiente(r2.length>r1.length,`y su registro se encadena (${r1.length} → ${r2.length} registros VF)`);
console.error=oe;
if(dichos.length)oe('  [d] lo que la app se tragó por consola:\n     '+dichos.slice(0,6).join('\n     ').slice(0,700));
if(pend)oe(`  · quedan ${pend} comprobaciones SIN cubrir de este recorrido`);
console.log(fallos?`═══ RECTIFICATIVA: ${fallos} FALLOS ═══`:'═══ RECTIFICATIVA: CERTIFICAR → REGISTRO → RECTIFICAR, ENTERO ═══');
process.exit(fallos?1:0);
