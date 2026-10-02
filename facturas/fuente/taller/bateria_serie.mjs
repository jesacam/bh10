// ═══ SERIE DE FACTURAS · que el dato PERSISTA al cerrar y abrir ═══════════
// Jesús pidió garantía de que la última emitida no se pierda al reabrir. Vive
// en bh10-company-v2, la configuración de ESTA empresa, que se guarda en su
// propio espacio de la nube. Aquí se escribe desde Ajustes, se DESMONTA la app
// entera y se vuelve a montar leyendo de la nube, como al abrirla de nuevo.
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

const oe=console.error;console.error=()=>{};
const {default:App}=await import('../web_subir/app/assets/bh10-APPV403.js');
const E=ms=>new Promise(x=>setTimeout(x,ms));
let fallos=0;
const ok=(c,m)=>{oe((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};
const click=t=>{if(irA(document,t))return true;const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes(t));if(b){b.click();return true;}return false;};
const pon=(el,v)=>{const k=Object.keys(el).find(x=>x.startsWith('__reactProps'));
  if(k&&el[k].onChange)el[k].onChange({target:{value:String(v)},stopPropagation(){},preventDefault(){}});};
const montar=async()=>{
  const r=createRoot(document.getElementById('root'));
  r.render(React.createElement(App));
  for(let i=0;i<320;i++){await E(25);if(document.getElementById('root').textContent.includes('Pendiente de pago'))break;}
  await E(1100);return r;
};

oe('── 1 · se escribe la última emitida en Ajustes ──');
let root=await montar();
click('Ajustes');await E(1500);
// v369 (06-09-2026) · la esperada ya no se fija a mano: los datos reales del
// 06-09 traen la 2600056 EMITIDA (Jesús siguió facturando tras el 27-08), así
// que el salto de ocupados debe dar la 2600057. Se calcula aquí, con una
// implementación propia sobre la copia, y se exige que la app diga LO MISMO.
const ocupados=new Set();
for(const arr of [JSON.parse(datos.claves['bh10-fc-v3']||'[]'),JSON.parse(datos.claves['bh10-contratos']||'[]')])
  for(const x of arr){const n=String((x&&(x.numFactura||x.numero))||'');if(/^26\d{5}$/.test(n))ocupados.add(+n);}
let PROX=2600056;while(ocupados.has(PROX))PROX++;
console.log('  · esperada calculada de los datos: '+PROX+' (la 2600056 está '+(ocupados.has(2600056)?'OCUPADA':'libre')+')');
const campo=[...document.querySelectorAll('input')].find(i=>(i.placeholder||'')==='2600055');
ok(!!campo,'el campo «Última factura emitida» está en Ajustes');
if(campo){pon(campo,'2600055');await E(700);}
ok(new RegExp('La próxima será '+PROX).test(document.getElementById('root').textContent),
   'la pantalla adelanta cuál será la próxima: '+PROX);
ok(click('💾 Guardar datos empresa'),'se pulsa «💾 Guardar datos empresa»');await E(2000);
const guardado=JSON.parse(nube['bh10-company-v2']||'{}');
ok(guardado.ultimaEmitida==='2600055',`queda escrito en bh10-company-v2 («${guardado.ultimaEmitida}»)`);

oe('── 2 · se CIERRA y se vuelve a ABRIR la app ──');
root.unmount();await E(400);
document.getElementById('root').innerHTML='';
root=await montar();
click('Ajustes');await E(1500);
const campo2=[...document.querySelectorAll('input')].find(i=>(i.placeholder||'')==='2600055');
ok(!!campo2&&campo2.value==='2600055',`tras reabrir, el campo sigue con «${campo2&&campo2.value}»`);
ok(new RegExp('La próxima será '+PROX).test(document.getElementById('root').textContent),
   'y la app sigue sabiendo que la próxima es '+PROX);

oe('── 3 · la serie se usa de verdad al emitir ──');
click('Contratos');await E(1400);
click('📋 Certificar');await E(1600);
{const ins=[...document.querySelectorAll('input')].filter(x=>['text','number'].includes(x.type));
 const pct=ins.find(x=>/%|pct|porcent/i.test((x.placeholder||'')+(x.getAttribute('aria-label')||'')))||ins[0];
 if(pct)pon(pct,'30');await E(700);}
click('Generar factura');await E(3000);
const emitidas=JSON.parse(nube['bh10-fc-v3']||'[]').filter(x=>x.tipo==='cobro');
const ult=emitidas.slice(-1)[0];
// La semilla 2600055 manda sobre los huecos antiguos, y el salto de ocupados
// sobre lo emitido después: la esperada PROX viene calculada de los datos.
ok(String(ult.numFactura)===String(PROX),`la factura sale con ${PROX}: semilla + salto de ocupados sobre los datos reales (salió «${ult.numFactura}»)`);
ok(!ocupados.has(+ult.numFactura),'y ese número NO estaba ocupado en los datos');
ok(!/^F-/.test(String(ult.numFactura)),'ya no usa la serie vieja F-2026/NNN');
console.error=oe;
console.log(fallos?`═══ SERIE: ${fallos} FALLOS ═══`:'═══ SERIE: SE GUARDA, SOBREVIVE AL REINICIO Y SE USA ═══');
process.exit(fallos?1:0);
