// ═══ BATERÍA · v372 ═══════════════════════════════════════════════════════
// Las tres cosas de esta versión, cada una con su prueba:
//  · «el enlace aparece en pantalla pero no se copia» → ventana con Copiar,
//    Compartir y el enlace seleccionable (iPhone solo deja escribir en el
//    portapapeles dentro del gesto del dedo, y el enlace llega después).
//  · «tienes que reordenar la ventana donde viven esas opciones» → los cuatro
//    botones de la vivienda ya no se montan encima del texto en el móvil.
//  · Y la lección de la tarde de Brave: los ficheros de la versión ANTERIOR se
//    quedan en el servidor, para que un navegador rezagado no se cuelgue.
import fs from 'fs';
let n=0,mal=0;const ok=(c,t)=>{n++;if(!c){mal++;console.log('  ✗',t);}else console.log('  ✓',t);};
const app=fs.readFileSync('src/app.jsx','utf8');
const mod=fs.readFileSync('src/modales.jsx','utf8');

console.log('── 1 · la ventana del enlace ──');
ok(/const ModalEnlace=/.test(mod),'existe la ventana');
ok(/id="bh10-enlace-txt"/.test(mod)&&/readOnly value=\{enlace\}/.test(mod),'el enlace se ve entero y a la vista');
ok(/onFocus=\{e=>\{e\.target\.select\(\)/.test(mod),'tocándolo se selecciona solo, para copiarlo a mano');
ok(/navigator\.clipboard\.writeText\(enlace\)/.test(mod),'el botón Copiar usa el portapapeles');
ok(/document\.execCommand\('copy'\)/.test(mod),'y tiene camino de respaldo para navegadores que no lo admiten');
ok(/navigator\.share/.test(mod),'hay Compartir para mandarlo directo por WhatsApp o correo');
ok(/✓ Copiado/.test(mod),'confirma cuando lo consigue');
ok(/no deja copiar solo/.test(mod),'y AVISA cuando no puede, en vez de callarse (que era el fallo)');
// lo importante: que ya NO se intente copiar en el gesto perdido
ok(!/try\{await navigator\.clipboard\.writeText\(enlace\);notify\('🔗 Enlace copiado/.test(app),
   'el botón de la vivienda ya no intenta copiar cuando el gesto del dedo ya terminó');
ok((app.match(/setEnlaceModal\(\{titulo:/g)||[]).length===2,'los DOS enlaces (datos del comprador y firma) abren la ventana');
ok(/Sirve una sola vez y caduca a los 30 días/.test(app),'y la ventana recuerda que el enlace es de un solo uso');

console.log('── 2 · la tarjeta de la vivienda, sin solaparse ──');
{
  const i=app.indexOf('{vs.map(v=>(');
  const trozo=app.slice(i,i+9000)   // la tarjeta entera: los cuatro botones llegan hasta ~8.000;
  ok(!/display:'flex',gap:8,alignItems:'center',padding:'5px 0',borderTop/.test(trozo),
     'la fila de una sola altura (texto y botones juntos) ya no está: era la que se montaba encima');
  ok(/flexWrap:'wrap',marginTop:6/.test(trozo),'los botones van en su propia línea y se reparten según el ancho');
  ok(/alignItems:'flex-start'/.test(trozo),'texto y precio se alinean arriba, sin estirarse');
  const botones=(trozo.match(/S\.sm\(C\.(in|vt|wn|sc)\),fontSize:10\}/g)||[]).length;
  ok(botones>=4,`los cuatro botones (Enlace, Datos, Facturar, Contrato) sin márgenes de apaño: ${botones}`);
  ok(!/marginTop:4,marginLeft:4/.test(trozo),'ningún botón lleva ya el margen manual que los descuadraba');
}

console.log('── 3 · la versión anterior sigue en el servidor ──');
// La avería de esta tarde: al borrar los ficheros de la v371, los navegadores
// con la versión vieja guardada pedían algo que ya no existía y daban
// ERR_FAILED. Mientras los ficheros sigan ahí, eso no puede pasar.
{
  const dir='/home/claude/web_subir/app/assets';
  // v375 · la prueba se ata a APP_VERSION en vez de a números escritos a mano:
  // así no hay que reescribirla en cada entrega (ya se me olvidó dos veces).
  const VER=(fs.readFileSync('src/version.js','utf8').match(/'(v\d+)'/)||[])[1];
  const nAnt='v'+(parseInt(VER.slice(1),10)-1);
  const hay=fs.readdirSync(dir);
  const dev=(v)=>hay.filter(f=>f.includes(v));
  ok(dev(VER).length>=10,`la versión nueva (${VER}) está entera: ${dev(VER).length} ficheros`);
  ok(dev(nAnt).length>=10,`y la ANTERIOR (${nAnt}) sigue ahí (${dev(nAnt).length} ficheros): un navegador rezagado no se queda colgado`);
  const idx=fs.readFileSync('/home/claude/web_subir/app/index.html','utf8');
  ok(idx.includes(`assets/app-${VER}.js`),'index.html carga la nueva');
  ok(!idx.includes(`assets/app-${nAnt}.js`),'y no la vieja (que solo está de red de seguridad)');
  const sw=fs.readFileSync('/home/claude/web_subir/app/sw.js','utf8');
  const urls=[...sw.matchAll(/url:"([^"]+)"/g)].map(m=>m[1]);
  ok(urls.every(u=>fs.existsSync('/home/claude/web_subir/app/'+u)),'todo lo que el service worker precachea existe (anti-404)');
  ok(!urls.some(u=>u.includes(nAnt)),'el precache nuevo no arrastra ficheros de la versión anterior');
}

console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<18){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
