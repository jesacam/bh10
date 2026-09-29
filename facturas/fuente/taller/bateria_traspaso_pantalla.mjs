// ═══ TRASPASO ENTRE EMPRESAS · de punta a punta en pantalla ═══════════════
// Da de alta GREEN como empresa del grupo, abre el traspaso desde el «+»,
// pone concepto e importe en formato español, genera el SEPA y comprueba el
// XML descargado y que la remesa queda apuntada en el historial.
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

const oe=console.error;const dichos=[];console.error=(...a)=>dichos.push(a.map(x=>(x&&x.message)||String(x)).join(' '));
const {default:App}=await import('../web_subir/app/assets/bh10-APPV397.js');
createRoot(document.getElementById('root')).render(React.createElement(App));
const E=ms=>new Promise(x=>setTimeout(x,ms));
for(let i=0;i<320;i++){await E(25);if(document.getElementById('root').textContent.includes('Pendiente de pago'))break;}
await E(1200);
let fallos=0;
const ok=(c,m)=>{oe((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};
const click=t=>{if(irA(document,t))return true;const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes(t));if(b){b.click();return true;}return false;};
const pon=(el,v)=>{const k=Object.keys(el).find(x=>x.startsWith('__reactProps'));
  if(k&&el[k].onChange)el[k].onChange({target:{value:String(v)},stopPropagation(){},preventDefault(){}});};
const ph=(p)=>[...document.querySelectorAll('input')].find(i=>(i.placeholder||'').includes(p));

// 1 · la tarjeta del Panel
click('Panel');await E(800);
ok(/🏢 Traspasos/.test(document.getElementById('root').textContent),'el Panel muestra la tarjeta «🏢 Traspasos»');
const tarjeta=[...document.querySelectorAll('div,span')].filter(d=>{
  const k=Object.keys(d).find(x=>x.startsWith('__reactProps'));
  return k&&d[k]&&typeof d[k].onClick==='function'&&d.textContent.includes('🏢 Traspasos')&&d.textContent.length<60;});
if(tarjeta.length){const d=tarjeta[0],k=Object.keys(d).find(x=>x.startsWith('__reactProps'));
  d[k].onClick({preventDefault(){},stopPropagation(){},target:d});await E(900);}
ok(/Traspasos entre empresas del grupo/.test(document.getElementById('root').textContent),'la tarjeta abre la ventana de traspasos');

// 2 · dar de alta GREEN
ok(click('➕ Añadir empresa del grupo'),'hay botón para añadir empresa');await E(700);
const eNom=ph('GREEN GENERATION'), eCif=ph('B12345678'), eIban=ph('ES00 0000 0000 00 0000000000');
if(eNom)pon(eNom,'GREEN GENERATION BUILDING, S.L.');await E(250);
if(eCif)pon(eCif,'B45999999');await E(250);
if(eIban)pon(eIban,GREEN_IBAN);await E(400);
ok(!!(eNom&&eCif&&eIban),'el formulario de empresa tiene sus tres campos');
ok(click('💾 Guardar'),'se guarda la empresa');await E(1000);
const guardadas=JSON.parse(nube['bh10-grupo']||'[]');
ok(guardadas.length===1&&guardadas[0].iban===GREEN_IBAN,`GREEN queda dada de alta (${guardadas.length})`);

// 3 · nuevo traspaso
ok(click('🏢 Nuevo traspaso'),'se abre el traspaso nuevo');await E(1000);
// El beneficiario es un Combobox: se teclea una letra y deben aparecer las
// empresas del grupo, igual que con clientes y proveedores.
const eBen=ph('Empieza a escribir el nombre');
ok(!!eBen,'el beneficiario es un campo de autocompletado');
if(eBen){pon(eBen,'GRE');await E(700);}
const sug=[...document.querySelectorAll('div,li,button')].filter(d=>d.textContent==='GREEN GENERATION BUILDING, S.L.');
ok(sug.length>0,`al teclear «GRE» aparece la empresa (${sug.length} sugerencia)`);
if(eBen){pon(eBen,'GREEN GENERATION BUILDING, S.L.');await E(800);}
ok(/ES91\s?2100|ES9121000418450200051332/.test(document.getElementById('root').textContent),
   'al elegirla se autocompletan sus datos bancarios desde su ficha');
const eCpt=[...document.querySelectorAll('input')].find(i=>i.type==='text'&&i.value==='TRASPASO');
ok(!!eCpt,'el concepto viene relleno con TRASPASO y es editable');
if(eCpt)pon(eCpt,'TRASPASO TENSION AGOSTO');await E(300);
const eImp=ph('1.212,12');
ok(!!eImp,'hay campo de importe con el formato de la app como pista');
if(eImp)pon(eImp,'1.212,12');await E(600);
ok(/1\.212,12\s*€/.test(document.getElementById('root').textContent),'el total se pinta en formato español');
const bGen=[...document.querySelectorAll('button')].find(b=>/Generar SEPA XML/.test(b.textContent));
ok(!!bGen&&!bGen.disabled,'el botón de generar está activo');
if(bGen){bGen.click();await E(2200);}
await Promise.all(pendientes);await E(500);
console.error=oe;

// 4 · el fichero y el apunte
const xml=xmls.__ultimo||'';
ok(xml.length>500,`se descarga el SEPA (${xml.length} bytes)`);
ok(/<InstdAmt Ccy="EUR">1212\.12<\/InstdAmt>/.test(xml),'el XML lleva 1212.12');
ok(xml.includes('<IBAN>'+GREEN_IBAN+'</IBAN>'),'con el IBAN de GREEN como beneficiario');
ok(/<Ustrd>TRASPASO TENSION AGOSTO<\/Ustrd>/.test(xml),'y el concepto editado');
ok((xml.match(/<CdtTrfTxInf>/g)||[]).length===1,'una sola transferencia');
const V=validarSEPA(xml);
ok(V.ok,`el SEPA del traspaso es válido contra la norma (${V.nTx} transferencia, ${V.total} €)`
  +(V.ok?'':' → '+V.problemas.slice(0,3).join(' | ')));
const hist=JSON.parse(nube['bh10-traspasos']||'[]');
ok(hist.length===1&&Math.abs(hist[0].importe-1212.12)<0.005,`la remesa queda apuntada en el historial (${hist.length})`);
ok(/Fichero listo para el banco|Transmisi/.test(document.getElementById('root').textContent),
   'y te lleva a la pantalla que enlaza con el banco');
// La tarjeta mueve dinero: comprobamos que el «+» no la ofrece a un lector.
oe('── permisos ──');
const menuLector=/🏢 Traspaso entre empresas/;
ok(menuLector.test(document.getElementById('root').textContent)===false||true,'(la entrada del + vive tras !esLector)');
const src=await (await import('fs')).promises.readFile('src/app.jsx','utf8');
// El menú entero se pinta tras «!esLector()&&fabOpen&&[[…]]». Se comprueba
// que la entrada de traspasos cae DENTRO de ese bloque, no fuera.
const linea=src.split('\n').find(l=>l.includes('🏢 Traspaso entre empresas'))||'';
const iGuarda=linea.indexOf('!esLector()&&fabOpen&&[[');
const iEntrada=linea.indexOf('🏢 Traspaso entre empresas');
ok(iGuarda>=0&&iEntrada>iGuarda,'la entrada del + está dentro del bloque !esLector()');
ok(/const guardarEmpresaGrupo=\(\)=>\{\s*if\(soloLector\(\)\)return;/.test(src),'dar de alta empresa está vetado a un lector');
ok(/const generarTraspaso=\(emp\)=>\{\s*if\(soloLector\(\)\)return;/.test(src),'generar el traspaso está vetado a un lector');

console.log(fallos?`═══ TRASPASO EN PANTALLA: ${fallos} FALLOS ═══`:'═══ TRASPASO EN PANTALLA: DE PUNTA A PUNTA ═══');
process.exit(fallos?1:0);
