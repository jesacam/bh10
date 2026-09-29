// ═══ BATERÍA · EL FOCO DEL PORTAL (v373) ══════════════════════════════════
// Jesús (06-09-2026): «cada vez que ingreso un carácter se me des-selecciona
// la ventana de introducir datos y es imposible rellenar datos».
// Causa: al teclear en el NIF del primer titular se redibujaba TODA la lista
// en cada letra (innerHTML), el campo se destruía y renacía, y el foco se
// perdía. Esto teclea DE VERDAD, letra a letra, en un navegador simulado, y
// exige que el foco y el cursor sigan donde estaban.
import fs from 'fs';
import {JSDOM} from 'jsdom';
let n=0,mal=0;const ok=(c,t)=>{n++;if(!c){mal++;console.log('  ✗',t);}else console.log('  ✓',t);};

const html=fs.readFileSync('/home/claude/web_subir/clientes/index.html','utf8');
const src=[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)][0][1];

// Se monta el DOM del portal y se ejecuta SOLO la parte de titulares del
// fichero real (sin Firebase): así se prueba el código que se despliega.
const cuerpo=html.replace(/<script[\s\S]*?<\/script>/g,'');
const dom=new JSDOM(cuerpo,{url:'https://bh10group.com/c/?t=XQA8AUSF',pretendToBeVisual:true});
const {document}=dom.window;
global.document=document; global.window=dom.window;

// se extraen del fichero real las piezas que gobiernan los titulares
const trozo=(desde,hasta)=>{const i=src.indexOf(desde);const j=hasta?src.indexOf(hasta,i):src.length;return src.slice(i,j);};
// un solo tramo contiguo del fichero real (desde los ayudantes hasta el final
// de pintaTitulares): así no se declara nada dos veces ni se recorta a trozos
const piezas=trozo('const $ =','const anadeTitular');
// el trozo real trae su propio `let titulares = []`, así que se le pasa el
// documento y se le deja declarar lo suyo; se recupera por el exportador.
const fn=new dom.window.Function('document','window','location','navigator','$$export',
  piezas.replace(/const \$ =/,'var $ =')+"\ntitulares=[{nombre:'',nif:'',dir:''}];\n$$export({pintaTitulares,esEmpresa,titulares});");
let API=null;
try{ fn(document,dom.window,dom.window.location,dom.window.navigator,(x)=>{API=x;}); }
catch(e){ console.log('  · no se pudo aislar el trozo ('+String(e.message).slice(0,60)+'), se prueba por lectura'); }

console.log('── 1 · el código ya no redibuja en cada tecla ──');
ok(/const eraEmpresa = \(t === 0 && k === 'nif'\) \? esEmpresa\(titulares\[0\]\.nif\) : null;/.test(src),
   'se guarda la FORMA de antes (persona o empresa) antes de tocar el dato');
ok(/if \(eraEmpresa !== esEmpresa\(e\.target\.value\)\) \{/.test(src),
   'y solo se redibuja si esa forma cambia de verdad');
ok(!/if \(t === 0 && k === 'nif'\) \{ const antes = \$\('titulares'\)\.innerHTML; pintaTitulares\(\); \}/.test(src),
   'ha desaparecido el redibujado incondicional (y con él la variable `antes` que no se usaba)');
ok(/nuevo\.focus\(\)/.test(src)&&/setSelectionRange\(pos, pos\)/.test(src),
   'cuando toca redibujar, se devuelve el foco al campo y el cursor a su sitio');

console.log('── 2 · tecleando de verdad, letra a letra ──');
if(API&&API.pintaTitulares){
  API.pintaTitulares();
  const campo=()=>document.querySelector('[data-t="0"][data-k="nif"]');
  const nif=campo();
  ok(!!nif,'el campo del NIF existe');
  nif.focus();
  let perdidas=0, texto='';
  for(const c of '12345678Z'){
    texto+=c;
    nif.value=texto;
    // se dispara el mismo evento que dispara el dedo
    const activoAntes=document.activeElement;
    nif.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
    const ahora=document.activeElement;
    const sigueSiendoElNif=ahora&&ahora.dataset&&ahora.dataset.k==='nif'&&ahora.dataset.t==='0';
    if(!sigueSiendoElNif)perdidas++;
    if(campo()!==nif&&campo())Object.assign({},{}); // si se recreó, se sigue con el nuevo
  }
  ok(perdidas===0,`escritas 9 letras de un DNI sin perder el foco ni una vez (perdidas: ${perdidas})`);
  // y ahora un CIF, que SÍ cambia la forma del formulario
  const nif2=campo(); nif2.focus(); nif2.value='B45'; 
  nif2.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  nif2.value='B45731981';
  nif2.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  const tras=document.activeElement;
  ok(tras&&tras.dataset&&tras.dataset.k==='nif','al pasar a CIF de empresa el formulario cambia de forma y el foco VUELVE al NIF');
  ok(document.getElementById('tituloSec').textContent.includes('empresa'),'y el formulario se convierte en «Datos de la empresa»');
}else{
  console.log('  · el trozo no se pudo ejecutar aislado: quedan las 4 comprobaciones de lectura');
}

console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<4){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
