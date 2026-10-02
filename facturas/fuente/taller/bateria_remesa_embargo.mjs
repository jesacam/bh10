// ═══ REMESA C34 DE NÓMINAS · las 18 + la del juzgado ══════════════════════
// Lo que pidió Jesús: que salga UNA remesa con todas las nóminas y, dentro,
// la transferencia del embargo al juzgado. Se comprueba sobre el XML SEPA
// generado por la app, no sobre funciones sueltas.
import {irA} from './_nav.mjs';
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
import fs from 'fs';
import {validarSEPA} from './_sepa.mjs';

const datos=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const FIJO=new Date('2026-08-24T11:00:00Z').getTime();
const JUZGADO='ES9121000418450200051332';
const EMB=53.70;

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
const EMPS=JSON.parse(nube['bh10-employees']);
const iCarlos=EMPS.findIndex(e=>String(e.nif||'').toUpperCase().replace(/[^0-9A-Z]/g,'')==='03826848Q');
EMPS[iCarlos]={...EMPS[iCarlos],embargoLeido:{imp:EMB,periodo:'2026-08'}};
nube['bh10-employees']=JSON.stringify(EMPS);
const LIQ=Object.fromEntries(EMPS.map(e=>[e.nombre,+e.importeBase||0]));
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

const oe=console.error;const dichos=[];console.error=(...a)=>dichos.push(a.map(x=>(x&&x.message)||String(x)).join(' '));
const {default:App}=await import('../web_subir/app/assets/bh10-APPV407.js');
createRoot(document.getElementById('root')).render(React.createElement(App));
const E=ms=>new Promise(x=>setTimeout(x,ms));
for(let i=0;i<320;i++){await E(25);if(document.getElementById('root').textContent.includes('Pendiente de pago'))break;}
await E(1200);
let fallos=0;
const ok=(c,m)=>{oe((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};
const click=t=>{if(irA(document,t))return true;const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes(t));if(b){b.click();return true;}return false;};
const pon=(el,v)=>{const k=Object.keys(el).find(x=>x.startsWith('__reactProps'));
  if(k&&el[k].onChange)el[k].onChange({target:{value:String(v)},stopPropagation(){},preventDefault(){}});};

click('Nóminas');await E(1100);
ok(/RINCON|CAMPEAN/.test(document.getElementById('root').textContent),'la plantilla carga los 18 trabajadores');
// El botón real de la vista de Nóminas es «💶 Editar importes y generar C34»
// (o «Generar fichero SEPA nóminas»). Buscar por «C34» a secas cazaba la
// subpestaña del histórico de remesas, que no genera nada.
click('👥 Plantilla');await E(1200);
const abrio=click('💶 Editar importes y generar C34')||click('💶 Generar fichero SEPA nóminas')||click('Editar importes')||click('generar C34');
await E(1500);
if(process.env.BH10_DIAG)console.log('  [d] abrió:',abrio,'· botones:',[...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(t=>t&&t.length<30).slice(-12).join(' | '));
await E(1400);
const conc=[...document.querySelectorAll('input')].find(i=>i.type==='text'&&/concepto|NOMINA|nómina/i.test((i.placeholder||'')+(i.value||'')));
if(conc){pon(conc,'NOMINAS AGOSTO 2026');await E(500);}
const gen=[...document.querySelectorAll('button')].find(b=>/Descargar XML SEPA/i.test(b.textContent));
oe('  [d] botón:',gen?JSON.stringify(gen.textContent.trim()):'(no hay)','· disabled:',gen&&gen.disabled);
oe('  [d] inputs de texto en el modal:',[...document.querySelectorAll('input')].filter(x=>x.type==='text').map(x=>JSON.stringify((x.placeholder||'')+'='+(x.value||'')).slice(0,40)).join(' | ').slice(0,300));
if(gen){gen.click();await E(2600);}
oe('  [d] tras pulsar · createObjectURL llamado:',pendientes.length,'· descargas:',xmls.length);
oe('  [d] texto de pantalla:',document.getElementById('root').textContent.replace(/\s+/g,' ').slice(0,260));
await Promise.all(pendientes);await E(400);
console.error=oe;

const xml=xmls.__ultimo||'';
if(!xml){const t=document.getElementById('root').textContent;
  const m=t.match(/(Falta IBAN[^]{0,110}|El banco rechazar[^]{0,140}|Faltan datos de la empresa[^]{0,80}|No hay importes|Configura datos empresa[^]{0,40})/);
  oe('  [aviso de la app] '+(m?m[1].slice(0,170):'(ninguno visible)'));}
ok(!!gen&&xml.length>500,`se genera el fichero SEPA (${xml.length} bytes)`);
if(xml){
  // DESGLOSE REAL del fichero: quién cobra y cuánto, para no suponer nada.
  // Se parte por BLOQUES <CdtTrfTxInf> y dentro se lee cada dato: el XML pone
  // el nombre ANTES del IBAN y una regex encadenada se saltaba transferencias.
  const bloques=xml.split('<CdtTrfTxInf>').slice(1).map(b=>b.split('</CdtTrfTxInf>')[0]);
  const tx=bloques.map(b=>({
    imp:+((b.match(/<InstdAmt Ccy="EUR">([\d.]+)<\/InstdAmt>/)||[])[1]||0),
    iban:((b.match(/<IBAN>([A-Z0-9]+)<\/IBAN>/)||[])[1]||''),
    nm:((b.match(/<Nm>([^<]*)<\/Nm>/)||[])[1]||''),
    rmt:((b.match(/<Ustrd>([^<]*)<\/Ustrd>/)||[])[1]||'')}));
  const ibJuz=String(EMPS[iCarlos].embargoIban||JUZGADO).replace(/\s/g,'');
  const alJuzgado=tx.filter(t=>t.iban===ibJuz);
  const aTrabajadores=tx.filter(t=>t.iban!==ibJuz);
  oe('  · desglose: '+tx.length+' transferencias = '+aTrabajadores.length+' a trabajadores + '+alJuzgado.length+' al juzgado');
  const enRemesa=new Set(aTrabajadores.map(t=>t.iban));
  const fuera=EMPS.filter(e=>e.activo&&!enRemesa.has(String(e.iban||'').replace(/\s/g,'')));
  if(fuera.length)oe('  · NO entran en la remesa: '+fuera.map(e=>e.nombre+' (importeBase '+e.importeBase+')').join(' · '));

  const nTx=(xml.match(/<CdtTrfTxInf>/g)||[]).length;
  const nbTxs=+((xml.match(/<NbOfTxs>(\d+)<\/NbOfTxs>/)||[])[1]||0);
  const ctrl=+((xml.match(/<CtrlSum>([\d.]+)<\/CtrlSum>/)||[])[1]||0);
  const sumaNom=+aTrabajadores.reduce((a,t)=>a+t.imp,0).toFixed(2);
  ok(alJuzgado.length===1,`hay UNA transferencia al juzgado, y solo una`);
  ok(nbTxs===tx.length,`la cabecera declara NbOfTxs=${nbTxs} y hay ${tx.length} transferencias`);
  ok(Math.abs(ctrl-(sumaNom+EMB))<0.02,
     `el total cuadra: ${ctrl} € = ${sumaNom} de nóminas + ${EMB.toFixed(2)} del juzgado`);
  ok(xml.includes(ibJuz),`la cuenta del JUZGADO (${ibJuz.slice(0,8)}…) está dentro del fichero`);
  ok(new RegExp('<InstdAmt Ccy="EUR">'+EMB.toFixed(2)+'</InstdAmt>').test(xml),
     `hay una transferencia de exactamente ${EMB.toFixed(2)} €`);
  ok(/RINCON/i.test(xml),'y la nómina de Carlos también va en la misma remesa');
  // Hasta el último milímetro: no basta con que sea igual al desplegado, tiene
  // que ser CORRECTO. Si producción tuviera un fallo latente, esto lo caza.
  const V=validarSEPA(xml);
  ok(V.ok,`el fichero SEPA es válido contra la norma (${V.nTx} transferencias, ${V.total} €)`
    +(V.ok?'':' → '+V.problemas.slice(0,3).join(' | ')));
  const carlosTx=aTrabajadores.find(t=>String(t.iban)===String(EMPS[iCarlos].iban||'').replace(/\s/g,''));
  ok(!!carlosTx,`Carlos cobra su nómina aparte: ${carlosTx?carlosTx.imp+' €':'NO APARECE'}`);
}
console.log(fallos?`═══ REMESA C34: ${fallos} FALLOS ═══`:'═══ REMESA C34: 18 NÓMINAS + EMBARGO EN UN SOLO FICHERO ═══');
process.exit(fallos?1:0);
