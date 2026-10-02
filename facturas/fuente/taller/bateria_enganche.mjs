// ═══ BATERÍA · ENGANCHAR A MANO Y QUE SE QUEDE (v385) ════════════════════
// Jesús (09-09-2026): «selecciono, voy a usar, y aparece una ventana verde
// como que se ha enganchado, pero continúa ofreciéndose como si no lo hubiera
// hecho». Y con razón: la búsqueda escribe la lista entera cada pocos segundos
// desde su copia interna, y machacaba el enganche hecho a mano. Con cientos de
// facturas la búsqueda dura minutos, así que pasaba siempre.
import fs from 'fs';
import {fundirResultados,consultaLibre,quitarDeLista,consultasGmail} from '../src/correo.js';
let n=0,mal=0;const ok=(c,t)=>{n++;if(!c){mal++;console.log('  ✗',t);}else console.log('  ✓',t);};
const app=fs.readFileSync('src/app.jsx','utf8');

console.log('── 1 · la fusión, con los casos reales ──');
{
  // lo que hay en pantalla tras enganchar a mano la factura A
  const pantalla=[{inv:{id:'A'},estado:'adjuntada',motivo:'FACT1129.pdf · ☁️ en la nube'},
                  {inv:{id:'B'},estado:'elegir',candidatos:[{filename:'x.pdf'}]}];
  // lo que trae la búsqueda un momento después, que aún cree que A está pendiente
  const busqueda=[{inv:{id:'A'},estado:'elegir',candidatos:[{filename:'x.pdf'},{filename:'y.pdf'}]},
                  {inv:{id:'B'},estado:'elegir',candidatos:[{filename:'x.pdf'}]},
                  {inv:{id:'C'},estado:'no encontrada'}];
  const r=fundirResultados(pantalla,busqueda);
  const A=r.find(x=>x.inv.id==='A');
  ok(A.estado==='adjuntada','la factura enganchada a MANO sigue enganchada — era justo lo que se perdía');
  ok(A.motivo.includes('FACT1129.pdf'),'y conserva qué documento se le puso');
  ok(!(A.candidatos||[]).length,'ya no se ofrece para elegir otra vez');
  ok(r.find(x=>x.inv.id==='B').estado==='elegir','lo que sigue pendiente, sigue pendiente');
  ok(!!r.find(x=>x.inv.id==='C'),'y lo que encuentra la búsqueda después se añade');
  ok(r.length===3,'sin duplicar filas: '+r.length);
}
{
  // el orden inverso: primero la búsqueda, luego el enganche
  const r=fundirResultados([],[{inv:{id:'A'},estado:'elegir',candidatos:[1]}]);
  ok(r.length===1&&r[0].estado==='elegir','sin nada previo, manda la búsqueda');
  const r2=fundirResultados([{inv:{id:'Z'},estado:'adjuntada'}],[]);
  ok(r2.length===1&&r2[0].inv.id==='Z','y lo enganchado no desaparece aunque la búsqueda no lo traiga');
}
{
  ok(fundirResultados(null,null).length===0,'con listas vacías no revienta');
  const raro=fundirResultados([{sinInv:true}],[{inv:{id:'A'},estado:'elegir'}]);
  ok(raro.length===1,'una fila sin factura no rompe la fusión');
}

console.log('── 2 · enganchado en los DOS sitios donde escribe la búsqueda ──');
ok((app.match(/resultados:fundirResultados\(/g)||[]).length===2,
   'las dos escrituras (la de cada paso y la final) funden en vez de reescribir');
ok(!/gmail:\{en:true,resultados:\[\.\.\.resultados\]\}/.test(app),'ya no queda la escritura que machacaba');
ok(!/gmail:\{en:false,resultados\}\}/.test(app),'ni la final');
ok(/String\(x\.inv\.id\)===String\(r\.inv\.id\)/.test(app),'y el enganche a mano compara los identificadores como texto, sin sorpresas de tipo');

console.log('── 3 · el botón sigue donde tiene que estar ──');
{
  const v=app.slice(app.indexOf('docsGmail&&(()=>{'));
  // v386 · el botón cambia de texto mientras trabaja, así que se busca por su
// función y no por el rótulo fijo.
ok(/'⏳ Adjuntando…':'📎 Usar'\}<\/button>/.test(v),'el botón de elegir existe y avisa cuando está trabajando');
ok(/disabled=\{!!engBusy\}/.test(v)&&/if\(engBusy\)return;/.test(v),'y no admite un segundo clic mientras adjunta (los clics ya no se encolan)');
  ok(/Documento enganchado a /.test(v),'y avisa al conseguirlo');
  ok(/candidatos:\[\]/.test(v),'dejando la fila sin candidatos, para que no se vuelva a ofrecer');
}

console.log('── 4 · la ventana no se sale ni se queda corta (v386) ──');
{
  const v=app.slice(app.indexOf('docsGmail&&(()=>{'));
  // Jesús: «se desencaja de la ventana» · «la ventana podría llegar hasta abajo»
  ok(/maxWidth:'min\(480px, 94vw\)'/.test(v),'el ancho queda atado a la pantalla del móvil');
  ok(/boxSizing:'border-box'/.test(v),'el relleno cuenta dentro del ancho, no fuera');
  ok(/overflowX:'hidden'/.test(v),'nada se desborda por el lado');
  ok(/maxHeight:'94vh'/.test(v),'y aprovecha el alto hasta abajo (antes se quedaba al 90%)');
  ok((v.match(/overflowWrap:'anywhere'/g)||[]).length>=2,
     'los nombres largos de fichero parten en vez de empujar el contenido fuera');
  ok(!/maxWidth:480,maxHeight:'90%'/.test(v),'ya no queda el tamaño fijo de antes');
}

console.log('── 5 · lo que salió de revisar el bloque antes de lanzar ──');
{
  const v=app.slice(app.indexOf('docsGmail&&(()=>{'));
  ok(/key=\{\(r\.inv&&r\.inv\.id\)\|\|k\}/.test(v),
     'cada fila se identifica por su FACTURA, no por su posición: al fundir listas React no confunde filas');
  ok(!/<div key=\{k\} style=\{\{\.\.\.S\.card,marginBottom:6,minWidth:0/.test(v),'ya no queda la clave por posición');
  ok(/enganchadas de \{res\.length\} revisadas/.test(v),
     'el contador ya no dice «enganchadas solas»: también cuenta las que engancha Jesús a mano');
  ok(/gm&&gm\.en\?<span[^>]*>⏳ sigue buscando/.test(v),
     'mientras sigue buscando lo dice, aunque ya haya resultados en pantalla');
}

console.log('── 6 · por tandas, con «ver más» (v387) ──');
// Jesús: «una vez vas adjuntando no sigue buscando más facturas pendientes de
// documento, carga y no hay un ver más». Intentar las 446 de golpe son miles de
// peticiones a Gmail: topa con sus límites y se queda a medias sin avisar.
{
  const v=app.slice(app.indexOf('docsGmail&&(()=>{'));
  ok(/const TANDA_GMAIL=25;/.test(app),'se revisa de 25 en 25');
  ok(/buscarEnGmailFaltantes\(faltan\.slice\(0,TANDA_GMAIL\)\)/.test(app),'la primera tanda no intenta las 446');
  ok(/🔎 Buscar \{Math\.min\(TANDA_GMAIL,quedan\.length\)\} más · quedan \{quedan\.length\}/.test(v),
     'hay un «ver más» que dice cuántas quedan');
  ok(/const quedan=todas\.filter\(i=>!hechas\.has\(String\(i\.id\)\)\)/.test(v),
     'y las que quedan son las que aún no se han revisado, no las de siempre');
  ok(/if\(!quedan\.length\|\|\(gm&&gm\.en\)\)return null;/.test(v),
     'el botón se esconde mientras busca y cuando ya no queda ninguna');
  ok(/gmail:\{en:true,resultados:\(\(c&&c\.gmail&&c\.gmail\.resultados\)\|\|\[\]\)\}/.test(app),
     'al pedir otra tanda NO se borra lo ya revisado');
  ok(/setPkCheq\(c=>\(\{\.\.\.\(c\|\|\{\}\),gmail:\{en:true,resultados:\[\]\}\}\)\);/.test(app),
     'pero empezar de cero desde el botón sí limpia la lista');
}
{
  // el recorrido completo, como lo hace Jesús
  let estado=[];
  estado=fundirResultados(estado,[{inv:{id:'1'},estado:'elegir',candidatos:[{filename:'a.pdf'}]},
                                  {inv:{id:'2'},estado:'adjuntada',motivo:'auto.pdf'}]);
  ok(estado.length===2,'primera tanda: dos filas');
  // engancha la 1 a mano
  estado=estado.map(x=>x.inv.id==='1'?{...x,estado:'adjuntada',motivo:'elegida.pdf',candidatos:[]}:x);
  // llega la segunda tanda
  estado=fundirResultados(estado,[{inv:{id:'3'},estado:'elegir',candidatos:[{filename:'c.pdf'}]}]);
  ok(estado.length===3,'segunda tanda: se añade sin perder las anteriores');
  ok(estado.map(x=>x.inv.id).join('')==='123','y en orden: las primeras no saltan al final');
  ok(estado[0].estado==='adjuntada'&&estado[0].motivo==='elegida.pdf','lo enganchado a mano sigue enganchado tras la nueva tanda');
  // y una tanda que reintenta una ya enganchada no la desengancha
  estado=fundirResultados(estado,[{inv:{id:'1'},estado:'elegir',candidatos:[{filename:'otra.pdf'}]}]);
  ok(estado.find(x=>x.inv.id==='1').estado==='adjuntada','ni aunque la búsqueda vuelva a proponerla');
  ok(estado.length===3,'y sin duplicar filas');
}

console.log('── 7 · rebuscar con otro concepto, o quitar (v387) ──');
// Jesús: «si no hay email vinculado, o rebusca con otro concepto (previo click
// nuestro), o que nos permita quitarlo».
{
  ok(consultaLibre('MOZAMBIQUE 37')==='has:attachment "MOZAMBIQUE 37"','la búsqueda a mano exige adjunto');
  ok(consultaLibre('a')===''&&consultaLibre('')===''&&consultaLibre(null)==='','con menos de dos letras no se busca nada');
  ok(!consultaLibre('cert"ificación').includes('""'),'las comillas del texto no rompen la consulta');
  ok(!/after:|before:/.test(consultaLibre('obra')),'sin horquilla de fechas: si se busca a mano es porque lo de siempre no valió');
}
{
  const q=quitarDeLista([{inv:{id:'1'}},{inv:{id:'2'}}],[{id:'1'},{id:'2'},{id:'3'}],'1');
  ok(q.resultados.length===1&&q.resultados[0].inv.id==='2','quitar la saca de la lista de resultados');
  ok(q.faltan.map(f=>f.id).join(',')==='2,3','y de las pendientes, para que no vuelva en la siguiente tanda');
  const q2=quitarDeLista(null,null,'9');
  ok(q2.resultados.length===0&&q2.faltan.length===0,'con listas vacías no revienta');
}
{
  const v=app.slice(app.indexOf('docsGmail&&(()=>{'));
  // v388 · el botón largo de quitar se sustituye por el aspa de la factura.
ok(/🔎 Buscar con otro concepto/.test(v),'la rebúsqueda está en cada fila');
ok(/title="Quitar esta factura de la lista"/.test(v),'y quitar la factura es ahora un aspa en su cabecera');
  ok(/r\.estado!=='adjuntada'&&\(/.test(v),'y solo donde hacen falta: en las ya enganchadas no salen');
  ok(/onKeyDown=\{e=>\{if\(e\.key==='Enter'\)rebuscarConTexto/.test(v),'se puede lanzar con Enter, sin buscar el botón');
  ok(/engBusy==='rebusca\|'\+r\.inv\.id\?'⏳ Buscando…'/.test(v),'avisa mientras busca');
  ok(/disabled=\{!!engBusy\}/.test(v),'y no admite dos búsquedas a la vez');
  ok(/candidatos\.length\?'elegir':'no encontrada'/.test(app),'si la rebúsqueda encuentra algo pasa a elegir; si no, lo dice');
  ok(/nada con «\$\{texto\}»/.test(app),'y deja escrito con qué se buscó');
  ok(/buscado a mano: «'\+texto\+'»/.test(app),'los candidatos hallados a mano llevan su motivo');
}

console.log('── 8 · lo que salió de probar la app montada de verdad ──');
{
  // 1) el contador tardaba en subir: la fila esperaba hasta 4,5 s a que la nube
  //    confirmara. Ahora se marca en cuanto el documento SUBE.
  ok(/const engancharDeGmail=async\(inv,cand,tok,alSubir\)=>/.test(app),'el enganche avisa en cuanto sube');
  ok(/if\(typeof alSubir==='function'\)alSubir\(path\);\n    const nube=await confirmarNube\(path\);/.test(app),
     'y ese aviso llega ANTES de esperar la confirmación de la nube');
  ok(/marcar\(' · ⏳ subiendo'\);/.test(app)&&/marcar\(nube\.ok\?' · ☁️ en la nube'/.test(app),
     'la fila se marca al subir y se afina cuando la nube confirma');
  ok(/setEngBusy\(''\);\n                          \}\);/.test(app),'y el botón se libera al momento, no cuatro segundos después');
}
{
  // 2) los números de factura cortos traían cualquier cosa («2» → 13 candidatos)
  const cortas=consultasGmail({numFactura:'1',proveedor:'DISETOGAR',fecha:'2026-01-03',total:120.5});
  ok(!cortas.some(q=>/^has:attachment "1" after/.test(q)),
     'un número de UNA cifra ya no se busca suelto: era lo que llenaba de ruido');
  ok(cortas.some(q=>q.includes('"1" "DISETOGAR"')),'pero sí acompañado del proveedor');
  ok(cortas.some(q=>q.includes('"120,50"')),'y el peso lo lleva el importe');
  const largas=consultasGmail({numFactura:'2500072',proveedor:'J MARTIN CARO',fecha:'2026-01-03',total:1904.34});
  ok(largas.some(q=>/"2500072" after/.test(q)),'un número largo sí se busca suelto: ahí no hay confusión');
  const tres=consultasGmail({numFactura:'842',proveedor:'HORMIGONES RECAS',fecha:'2026-01-03',total:4722.33});
  ok(!tres.some(q=>/^has:attachment "842" after/.test(q)),'tres cifras siguen siendo pocas: tampoco suelto');
}

console.log('── 9 · las tres aspas (v388) ──');
// Jesús: «quiero 3 x: una en un email candidato, otra en la ventana —X en la
// barra superior FIJA, acuérdate—, otra en la factura».
{
  const v=app.slice(app.indexOf('docsGmail&&(()=>{'));
  ok(/position:'sticky',top:0/.test(v),'la barra de arriba es FIJA: no hay que bajar hasta el final para cerrar');
  ok(/title="Cerrar"[\s\S]{0,220}✕<\/button>/.test(v),'y lleva su aspa');
  ok(/borderBottom:`1px solid \$\{C\.bd\}`/.test(v),'con una raya que la separa del contenido al desplazar');
  ok(/title="Quitar esta factura de la lista"/.test(v),'aspa en la FACTURA');
  ok(/const q=quitarDeLista\(res,\(docsGmail&&docsGmail\.faltan\)\|\|\[\],r\.inv\.id\)/.test(v),
     'que la saca de los resultados y de las pendientes');
  ok(/title="Descartar este correo"/.test(v),'aspa en cada CORREO candidato');
  ok(/filter\(y=>!\(y\.filename===c\.filename&&y\.msgId===c\.msgId\)\)/.test(v),
     'que descarta ese correo y deja pasar al siguiente de la cola');
  ok(/estado:quedan\.length\?x\.estado:'no encontrada'/.test(v),
     'y si se descartan todos, la fila lo dice en vez de quedarse vacía');
  ok(/Se enseñan 4 de \{\(r\.candidatos\|\|\[\]\)\.length\}/.test(v),
     'cuando hay más de cuatro, se avisa de cuántos quedan en cola');
  ok(!/✕ Quitar de la lista<\/button>/.test(v),'el botón largo de quitar se retira: lo hace el aspa de la factura');
}

console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<60){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
