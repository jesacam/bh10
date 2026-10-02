// ═══ BATERÍA · PAQUETE GESTORÍA: integridad, reintentos y cuadre (v350) ═══
// Jesús: «hay veces que el documento existe pero la app no lo mete en el
// zip» y «necesito que el léeme indique proveedor, factura e importe por
// cada factura que faltara». Aquí se prueba, con las facturas reales del
// T2-2026, que el cuadre siempre suma, que cada falta va nombrada con su
// importe, que un tirón de red se reintenta y que un PDF truncado no cuela.
import fs from 'fs';
import {sanoDocumento,conReintentos,errorDefinitivo,cuadrarEnvio,textoCuadre,csvCuadre,lineaFactura,esquemaEnlace,nombreUnico} from '../src/paquete.js';

let n=0,mal=0;
const ok=(cond,txt)=>{n++;if(!cond){mal++;console.log('  ✗',txt);}else console.log('  ✓',txt);};
const b=(s)=>new Uint8Array([...s].map(c=>c.charCodeAt(0)));

// ── integridad ────────────────────────────────────────────────────────────
const pdfOk=b('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer\n%%EOF\n');
const pdfCortado=b('%PDF-1.4\n1 0 obj<<>>endobj\n'+'x'.repeat(2000));
ok(sanoDocumento(pdfOk,'application/pdf','f.pdf')==='','PDF entero pasa');
ok(/truncado/.test(sanoDocumento(pdfCortado,'application/pdf','f.pdf')),'PDF sin %%EOF (trozo perdido) se detecta');
ok(/no es un PDF/.test(sanoDocumento(b('<html>hola</html>'),'application/pdf','f.pdf')),'"PDF" que no empieza por %PDF se detecta');
ok(sanoDocumento(new Uint8Array(0),'application/pdf','f.pdf')==='documento vacío','documento vacío se detecta');
const jpg=new Uint8Array([0xFF,0xD8,0xFF,0xE0,1,2,3,0xFF,0xD9]);
ok(sanoDocumento(jpg,'image/jpeg','a.jpg')==='','JPEG entero pasa');
ok(/JPEG truncado/.test(sanoDocumento(jpg.slice(0,6),'image/jpeg','a.jpg')),'JPEG sin FFD9 se detecta');
const png=new Uint8Array([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,...b('....IHDR....IEND'),0xAE,0x42,0x60,0x82]);
ok(sanoDocumento(png,'image/png','a.png')==='','PNG entero pasa');
ok(/PNG truncado/.test(sanoDocumento(png.slice(0,12),'image/png','a.png')),'PNG sin IEND se detecta');
ok(sanoDocumento(b('lo que sea'),'application/octet-stream','x.heic')==='','formato desconocido no vacío pasa (no se puede juzgar)');
// PDF con cola larga: %%EOF dentro de los últimos 1200 bytes aunque haya basura detrás
ok(sanoDocumento(b('%PDF-1.7 '+'y'.repeat(5000)+'%%EOF\n'+' '.repeat(200)),'application/pdf','')==='','%%EOF seguido de pocos bytes en blanco pasa');

// ── reintentos ────────────────────────────────────────────────────────────
const esperas=[];const dormir=async(ms)=>{esperas.push(ms);};
{
  let llamadas=0;
  const r=await conReintentos(async()=>{llamadas++;if(llamadas<3)throw new Error('red');return 'ok';},{dormir});
  ok(r==='ok'&&llamadas===3,'falla dos veces por red y a la tercera entra (3 llamadas)');
  ok(esperas.join(',')==='800,2500','esperas crecientes 0,8 s y 2,5 s entre intentos');
}
{
  let llamadas=0;
  let err=null;
  try{await conReintentos(async()=>{llamadas++;throw errorDefinitivo('no existe en la nube');},{dormir});}catch(e){err=e;}
  ok(llamadas===1&&err&&/no existe/.test(err.message),'error definitivo: UNA llamada y fuera, sin esperar');
}
{
  let llamadas=0;let err=null;
  try{await conReintentos(async()=>{llamadas++;throw new Error('siempre');},{dormir});}catch(e){err=e;}
  ok(llamadas===3&&err&&err.message==='siempre','tres fallos transitorios → se rinde con el último error');
}

// ── cuadre con datos reales (T2-2026) ─────────────────────────────────────
const copia=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const inv=JSON.parse(copia.claves['bh10-fc-v3']);
const fiscal=(i)=>i&&!['anticipo','cobro','personal','presupuesto'].includes(i.tipo)&&!i.anulada;
let recP=inv.filter(i=>fiscal(i)&&String(i.fecha||'')>='2026-04-01'&&String(i.fecha||'')<='2026-06-30');
ok(recP.length>100,`T2-2026 real: ${recP.length} facturas recibidas fiscales`);
// v369 (06-09-2026) · en la copia del 06-09 el T2 ya está COMPLETO: todas con
// documento (Jesús adjuntó lo que faltaba). El escenario «sin adjuntar» no
// puede depender de que producción esté descuidada: si no queda ninguna, se
// desengancha UNA (copia local, la nube ni se toca) para que el LÉEME, el CSV
// y el cuadre sigan ejercitando esa rama con datos reales. Nada de pasar en vacío.
if(recP.every(i=>i.adjPath)){const k=recP.length-1;recP=recP.map((i,x)=>x===k?{...i,adjPath:''}:i);console.log('  · T2 completo: se desengancha «'+(recP[k].proveedor||'?')+' nº '+(recP[k].numFactura||'s/n')+'» para probar la rama sin adjuntar');}
const conAdj=recP.filter(i=>i.adjPath);
ok(conAdj.length>50,`${conAdj.length} llevan documento enlazado en la app`);
// simulación: todas bajan menos dos (una truncada, una rota) y las sin adjPath quedan sin adjuntar
const estado={};
conAdj.forEach((i,k)=>{estado[i.id]=k===0?{fallo:'PDF truncado (sin %%EOF final)'}:k===1?{fallo:'no existe en la nube (enlace roto)'}:'documentos/'+i.fecha+'_x.pdf';});
const c=cuadrarEnvio(recP,estado);
ok(c.cuadra,'el cuadre suma: total = con documento + sin adjuntar + no descargadas');
ok(c.total===recP.length&&c.fallidos.length===2&&c.conDoc.length===conAdj.length-2&&c.sinAdj.length===recP.length-conAdj.length,
  `cifras: ${c.total} = ${c.conDoc.length} + ${c.sinAdj.length} + ${c.fallidos.length}`);
const txt=textoCuadre(c);
ok(txt.includes(`CUADRE DEL ENVÍO: ${recP.length} facturas del periodo = ${c.conDoc.length} con documento + ${c.sinAdj.length} sin adjuntar en la app + ${c.fallidos.length} no descargadas`),'la primera línea del LÉEME es el cuadre');
ok(!txt.includes('NO CUADRA'),'sin la alarma de descuadre cuando cuadra');
const f0=conAdj[0];
ok(txt.includes(lineaFactura(f0))&&txt.includes('[PDF truncado'),'la no descargada va con fecha · proveedor · nº · importe y motivo');
const s0=c.sinAdj[0];
ok(!!s0&&txt.includes(lineaFactura(s0)),'la sin adjuntar va nombrada con proveedor, número e importe');
ok(/\d{1,3}(\.\d{3})*,\d{2} €/.test(lineaFactura(s0)),'importe en formato español (1.234,56 €)');
ok(c.sinAdj.every(i=>txt.includes(lineaFactura(i))),'TODAS las sin adjuntar aparecen en el LÉEME, no solo un recorte');
const csv=csvCuadre(recP,estado);
const filas=csv.split('\r\n');
ok(filas[0]==='fecha;proveedor;numero;total;documento'&&filas.length===recP.length+1,`cuadre_documentos.csv: cabecera + ${recP.length} filas`);
ok(filas.filter(l=>l.endsWith(';SIN ADJUNTO')).length===c.sinAdj.length,'filas SIN ADJUNTO = sin adjuntar del cuadre');
ok(filas.filter(l=>/;FALLO: /.test(l)).length===2,'filas FALLO = no descargadas');
// descuadre artificial: una factura sin entrada y sin id → sigue cuadrando porque va a sinAdj;
// un estado con clave inventada no descuadra (se ignora)
const c2=cuadrarEnvio(recP,{...estado,'id-inventado':'documentos/z.pdf'});
ok(c2.cuadra&&c2.total===c.total,'un estado huérfano no altera el cuadre');
// todo con documento → mensaje de tranquilidad
const todo={};recP.forEach(i=>{todo[i.id]='documentos/a.pdf';});
ok(textoCuadre(cuadrarEnvio(recP,todo)).includes('Todas las facturas del periodo llevan su documento. ✓'),'con todo entero el LÉEME lo dice en claro');


// ── esquema del enlace: el caso REAL del paquete T3 enviado a Reme el 13-08 ─
// Las 7 «no se pudieron descargar» llevaban adjfs:… Se reconocen sin gastar
// reintentos y salen en su propia sección del LÉEME.
ok(esquemaEnlace('imp-fc451').ok&&esquemaEnlace('ms5ubf9x1k2').ok&&esquemaEnlace('adj/imp-fc001').ok,'enlaces de trozos en Firestore (imp-, id plano, adj/…) se aceptan');
const e1=esquemaEnlace('adjfs:mrw6uxzzfbijh');
ok(!e1.ok&&e1.esquema==='adjfs:'&&/no entiende/.test(e1.motivo),'adjfs: se reconoce como esquema que la app no entiende');
ok(!esquemaEnlace('').ok&&!esquemaEnlace(null).ok,'enlace vacío no pasa');
let t3=inv.filter(i=>fiscal(i)&&String(i.fecha||'')>='2026-07-01'&&String(i.fecha||'')<='2026-08-13');
// v369 (06-09-2026) · en la copia del 06-09 ya NO queda ninguna adjfs:: Jesús
// sustituyó las 7 del LÉEME del 13-08 con el botón «🔁 Sustituir» — que era
// exactamente el objetivo. La rama de «enlace que la app no entiende» no puede
// depender de que producción esté rota: si está limpia, se rompen DOS en una
// copia local y se exige que el LÉEME las trate igual que trató a las reales.
let adjfs=t3.filter(i=>/^adjfs:/.test(String(i.adjPath||'')));
if(adjfs.length===0){
  const conDoc=t3.filter(i=>i.adjPath&&!/^adjfs:/.test(i.adjPath));
  const romper=new Set([conDoc[0]&&conDoc[0].id,conDoc[1]&&conDoc[1].id]);
  t3=t3.map(i=>romper.has(i.id)?{...i,adjPath:'adjfs:'+String(i.adjPath).slice(0,10)}:i);
  adjfs=t3.filter(i=>/^adjfs:/.test(String(i.adjPath||'')));
  console.log('  · T3 limpio (las 7 adjfs: del 13-08 ya sustituidas): se rompen 2 en copia local para probar la rama');
}
ok(adjfs.length>=2,`en el T3 hay ${adjfs.length} facturas con adjfs: que ejercitar (reales o rotas a propósito)`);
{
  const estado={};
  t3.forEach(i=>{if(!i.adjPath)return;const e=esquemaEnlace(i.adjPath);estado[i.id]=e.ok?'documentos/x.pdf':{fallo:e.motivo};});
  const c=cuadrarEnvio(t3,estado);
  const txt=textoCuadre(c);
  ok(c.cuadra&&c.fallidos.length===adjfs.length,'cuadre del T3 real: las adjfs: van a no descargadas y todo suma');
  ok(txt.includes(`ENLACE QUE LA APP NO ENTIENDE (${adjfs.length})`),'sección propia en el LÉEME para los enlaces ilegibles');
  ok(!txt.includes('NO DESCARGADAS ('),'sin sección de transitorias cuando todas las faltas son de esquema');
  ok(adjfs.every(i=>txt.includes(lineaFactura(i))),'cada adjfs: aparece con fecha · proveedor · nº · importe');
  ok(txt.includes('Comprobar documentos'),'el LÉEME remite al comprobador de Ajustes');
}
{
  // esquema desconocido no gasta reintentos
  let llamadas=0;let err=null;
  try{await conReintentos(async()=>{llamadas++;const e=esquemaEnlace('adjfs:zzz');if(!e.ok)throw errorDefinitivo(e.motivo);},{dormir});}catch(e){err=e;}
  ok(llamadas===1&&err&&err.definitivo,'esquema desconocido: una llamada, definitivo, sin esperas');
}
// ── nombres únicos dentro del zip ─────────────────────────────────────────
{
  const u=new Set();
  const a=nombreUnico('2026-07-21_BASTIMAR_1002026.pdf',u),b=nombreUnico('2026-07-21_BASTIMAR_1002026.pdf',u),c=nombreUnico('2026-07-21_BASTIMAR_1002026.pdf',u);
  ok(a==='2026-07-21_BASTIMAR_1002026.pdf'&&b==='2026-07-21_BASTIMAR_1002026_2.pdf'&&c==='2026-07-21_BASTIMAR_1002026_3.pdf','dos facturas con el mismo nombre ya no se pisan: _2, _3');
  ok(nombreUnico('sinext',u)==='sinext'&&nombreUnico('sinext',u)==='sinext_2','también sin extensión');
  const todos=new Set();const noms=inv.filter(i=>fiscal(i)&&i.adjPath).map(i=>nombreUnico(i.fecha+'_'+String(i.proveedor||'').replace(/[^A-Za-z0-9 _-]/g,'').slice(0,30).trim().replace(/ +/g,'_')+'_'+String(i.numFactura||i.id).replace(/[^A-Za-z0-9._-]/g,'')+'.pdf',todos));
  ok(new Set(noms).size===noms.length,`con las ${noms.length} facturas reales con documento, ${noms.length} nombres distintos`);
}

console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<40){console.log('✗ BATERÍA VACÍA: menos de 40 comprobaciones');process.exit(1);}
process.exit(mal?1:0);
