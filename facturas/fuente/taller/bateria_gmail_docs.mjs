// ═══ BATERÍA · BUSCAR EL DOCUMENTO EN GMAIL (v383) ═══════════════════════
// Jesús (08-09-2026): «el sistema debería ofrecer solo aquellos que provengan
// del proveedor, y no ofrezca facturas que no sean suyas, porque hasta ahora
// cuando faltan documentos me propone cosas que no son coherentes, facturas
// con importes distintos, otro proveedor…» y «me he dado cuenta de que gmail,
// si pones en el buscador el IMPORTE de la factura, da resultados bastante
// certeros sobre el posible email que contiene la factura».
import {consultasGmail,importeGmail,puntuar,coincideDeVerdad,decidir} from '../src/correo.js';
let n=0,mal=0;const ok=(c,t)=>{n++;if(!c){mal++;console.log('  ✗',t);}else console.log('  ✓',t);};

// la factura real de ayer, con su documento y su transferencia
const F={numFactura:'FACT1129',proveedor:'VEJOMAT CONTAINER SL',fecha:'2026-09-07',total:3350.01};

console.log('── 1 · el importe entra en la búsqueda ──');
{
  const i=importeGmail(3350.01);
  ok(i.includes('3.350,01'),'se busca tal y como sale impreso en la factura: 3.350,01');
  ok(i.includes('3350,01')&&i.includes('3350.01'),'y en las otras dos formas, por si el correo lo escribe distinto');
  ok(importeGmail(0).length===0&&importeGmail(null).length===0,'sin importe no se inventa nada');
  ok(importeGmail(350)[0]==='350,00','los importes pequeños no llevan separador de miles');
}
{
  const qs=consultasGmail(F);
  ok(qs.some(q=>q.includes('"3.350,01"')),'la consulta a Gmail lleva el importe');
  ok(qs[0].includes('"FACT1129"')&&qs[0].includes('"CONTAINER"'),'la primera es la más certera: número Y proveedor');
  ok(!qs.some(q=>/filename:pdf "CONTAINER"/.test(q)),
     'ha desaparecido la pesca de arrastre («cualquier PDF que mencione al proveedor»), que era la que traía el ruido');
  ok(qs.every(q=>q.includes('has:attachment')),'todas piden que el correo lleve adjunto');
  ok(qs.every(q=>/after:\d{4}\/\d{2}\/\d{2}/.test(q)),'y todas acotan por fechas alrededor de la factura');
}

console.log('── 2 · lo que Jesús NO quiere ver ──');
const ctx=(asunto,de,cuerpo)=>({asunto,de,cuerpo,fecha:'Mon, 07 Sep 2026 10:00:00 +0200'});
{
  // otro proveedor, importe distinto: el caso que le salía antes
  const otro=puntuar({filename:'factura.pdf',mimeType:'application/pdf'},F,
    ctx('Factura de septiembre','facturacion@otraempresa.es','Le adjuntamos su factura de 1.250,00 €'));
  ok(!coincideDeVerdad(otro),'un PDF de OTRO proveedor con OTRO importe ya no se propone');
  // el proveedor correcto pero otra factura suya del mismo mes
  const suyaOtra=puntuar({filename:'albaran.pdf',mimeType:'application/pdf'},F,
    ctx('Albarán de entrega','pedidos@vejomatcontainer.es','Importe 890,00 €'));
  ok(!coincideDeVerdad(suyaOtra),'y un correo SUYO pero de otro importe, tampoco (antes bastaba «proveedor + fecha cercana»)');
  const soloPdf=puntuar({filename:'documento.pdf',mimeType:'application/pdf'},F,ctx('Hola','x@y.es',''));
  ok(!coincideDeVerdad(soloPdf),'«es un PDF» sigue sin ser motivo de nada');
}

console.log('── 3 · lo que SÍ debe encontrar ──');
{
  const porNumero=puntuar({filename:'FACT1129.pdf',mimeType:'application/pdf'},F,
    ctx('Factura FACT1129','admin@vejomatcontainer.es','Adjunto factura'));
  ok(coincideDeVerdad(porNumero),'el PDF con el número de factura en el nombre, sí');
  const porImporte=puntuar({filename:'fra_septiembre.pdf',mimeType:'application/pdf'},F,
    ctx('Factura Contenedor 3.350,01 €','admin@vejomatcontainer.es','Contenedor de oficina 20 pies'));
  ok(coincideDeVerdad(porImporte),'y el que lleva el IMPORTE exacto en el asunto, también');
  ok((porImporte.por||[]).some(r=>/importe exacto/.test(r)),'y queda dicho por qué se propone');
  const enCuerpo=puntuar({filename:'adjunto.pdf',mimeType:'application/pdf'},F,
    ctx('Su factura','admin@vejomatcontainer.es','El importe asciende a 3.350,01 € con IVA'));
  ok(coincideDeVerdad(enCuerpo),'el importe dentro del cuerpo del correo también vale');
}

console.log('── 4 · engancharlo solo, únicamente si no hay duda ──');
{
  const bueno={puntos:6,por:['número en el nombre del fichero','importe exacto (3.350,01 €)','proveedor en remitente/asunto/fichero']};
  const flojo={puntos:3,por:['importe exacto (3.350,01 €)','proveedor en remitente/asunto/fichero']};
  ok(decidir([bueno,flojo]).auto===bueno,'con uno clarísimo y ventaja, se engancha solo');
  const dosIguales=[{puntos:5,por:['importe exacto (3.350,01 €)','proveedor en remitente/asunto/fichero']},
                    {puntos:5,por:['importe exacto (3.350,01 €)','proveedor en remitente/asunto/fichero']}];
  ok(!!decidir(dosIguales).elegir,'con dos igual de buenos, se pregunta: nunca se elige a ciegas');
  ok(decidir([]).nada===true,'y sin candidatos, se dice que no hay nada');
  const soloRuido=[{puntos:2,por:['es PDF','fecha cercana']}];
  ok(decidir(soloRuido).nada===true,'el ruido ya no llega ni a proponerse');
}

console.log('── 5 · dónde se abre y en qué capa ──');
{
  const fs2=await import('fs');
  const app=fs2.readFileSync('src/app.jsx','utf8');
  ok(/fSinDoc&&!esLector\(\)&&\(\(\)=>\{/.test(app),'el botón sale en Facturas → Recibidas, con el filtro «Sin doc» puesto');
  ok(/📧 Buscar en Gmail los \{faltan\.length\} documentos que faltan/.test(app),'y dice cuántos va a buscar');
  ok(/\{\.\.\.S\.overlay,zIndex:CAPAS\.ACCION\}/.test(app.slice(app.indexOf('docsGmail&&'))),
     'la ventana va en la capa ACCION: se abre desde una pantalla y no se queda detrás');
  ok(/cuerpo:String\(msg&&msg\.snippet\|\|''\)/.test(app),'el cuerpo del correo llega a la puntuación');
  ok(/Únicamente se propone lo que cuadra con ese proveedor/.test(app),'la ventana explica el criterio, para que no sorprenda');
}

console.log('── 5 · dónde se ofrece, y en qué capa ──');
{
  const fs2=await import('fs');
  const app=fs2.readFileSync('src/app.jsx','utf8');
  ok(/📧 Buscar en Gmail los \{faltan\.length\} documentos que faltan/.test(app),
     'el botón sale en Facturas → Recibidas, dentro del apartado «Sin doc»');
  ok(/\{fSinDoc&&!esLector\(\)&&/.test(app),'solo con el filtro puesto, y no para un lector');
  ok(/\{\.\.\.S\.overlay,zIndex:CAPAS\.ACCION\}/.test(app.slice(app.indexOf('docsGmail&&(()=>{'))),
     'la ventana va en la capa ACCION: no puede quedarse detrás de la pantalla desde la que se abre');
  ok(/cuerpo:String\(msg&&msg\.snippet\|\|''\)/.test(app),'el cuerpo del correo llega a la puntuación');
  ok(/buscarEnGmailFaltantes\(faltan\)/.test(app),'y usa la MISMA búsqueda que el envío a la gestoría: se arregla en los dos sitios a la vez');
}

console.log('── 6 · poder ELEGIR, y que el importe llegue a buscarse (v384) ──');
{
  const fs3=await import('fs');
  const app=fs3.readFileSync('src/app.jsx','utf8');
  const ventana=app.slice(app.indexOf('docsGmail&&(()=>{'));
  // Jesús: «me lo dice pero no me deja elegir ninguna de las propuestas».
  // v386 · el rótulo cambia a «⏳ Adjuntando…» mientras trabaja, así que se
// busca por su función, no por el texto fijo.
ok(/'⏳ Adjuntando…':'📎 Usar'\}<\/button>/.test(ventana),'cada candidato lleva su botón para engancharlo');
  // v387 · el enganche lleva ahora un aviso para marcar la fila en cuanto sube,
// sin esperar los 4,5 s de la confirmación en la nube.
ok(/engancharDeGmail\(r\.inv,c,tok,\(\)=>\{/.test(ventana),'y usa el mismo enganche que la ventana de la gestoría, avisando al subir');
  ok(/r\.estado==='elegir'&&\(r\.candidatos\|\|\[\]\)/.test(ventana),'los botones salen solo donde hay que elegir');
  ok(/Documento enganchado a /.test(ventana),'y se confirma al hacerlo');
  // Jesús: «me cuesta creer que si pone el importe no encuentre alternativas».
  ok(!/if\(candidatos\.length\)break;/.test(app),
     'la búsqueda ya NO se corta en cuanto una consulta devuelve algo');
  ok(/const solido=candidatos\.some\(c=>\(c\.por\|\|\[\]\)\.some\(r=>\/número en el nombre del fichero\|importe exacto\/\.test\(r\)\)\);/.test(app),
     'solo se corta cuando ya hay algo SÓLIDO: el número en el fichero o el importe exacto');
  ok(/const vistos=new Set\(\)/.test(app)&&/nuevos=ids\.filter\(id=>!vistos\.has\(id\)\)/.test(app),
     'y un mismo correo no se descarga dos veces aunque salga en varias consultas');
}

console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<30){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
