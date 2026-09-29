// ═══ BATERÍA · BUSCAR EL DOCUMENTO EN GMAIL (v353) ═════════════════════════
// Jesús: «prefiero lo automático». Se prueba la parte pura: consultas,
// extracción de adjuntos de un mensaje Gmail, puntuación, decisión (solo
// engancha con UN candidato claro), base64url y qué facturas del periodo
// «faltan». Con las facturas reales del T3 y los 7 adjfs: del paquete real.
import fs from 'fs';
import {palabraClave,numeroLimpio,numeroDigitos,consultasGmail,cabecera,adjuntosDe,puntuar,decidir,b64urlABytes,faltanDocumento,coincideDeVerdad} from '../src/correo.js';
import {esquemaEnlace} from '../src/paquete.js';
let n=0,mal=0;
const ok=(cond,txt)=>{n++;if(!cond){mal++;console.log('  ✗',txt);}else console.log('  ✓',txt);};

ok(palabraClave('BASTIMAR, S.L.')==='BASTIMAR'&&palabraClave('COMERCIAL SIDERÚRGICA DEL SUR S.A.')==='SIDERÚRGICA'&&palabraClave('WÜRTH ESPAÑA S.A.')==='ESPAÑA','palabra clave del proveedor sin S.L./S.A./DE');
ok(numeroLimpio(' A/712/2026 ')==='A/712/2026'&&numeroDigitos('A/712/2026')==='2026'&&numeroDigitos('DGFC2622377783')==='2622377783','número limpio y sus dígitos largos');
const inv={id:'x1',fecha:'2026-07-21',proveedor:'BASTIMAR, S.L.',numFactura:'100/2026',total:1234.5};
const qs=consultasGmail(inv);
// v383 · ya no son 3 consultas fijas: entran las del IMPORTE, que es la señal
// que Jesús encontró («si pones en el buscador el importe da resultados
// bastante certeros»). La primera sigue siendo la más específica.
ok(qs.length>=3&&qs[0].includes('has:attachment')&&qs[0].includes('"100/2026"')&&qs[0].includes('"BASTIMAR"'),'primera consulta: adjunto + número + proveedor');
ok(qs.some(q=>/"[\d.,]+"/.test(q)&&!q.includes('100/2026')),'y alguna consulta busca por importe');
ok(qs[0].includes('after:2026/05/22')&&qs[0].includes('before:2026/09/19'),'ventana ±60 días en formato Gmail (aaaa/mm/dd)');
// La consulta de arrastre («filename:pdf "PROVEEDOR"») se RETIRA: traía
// cualquier PDF del proveedor de ese mes, y de ahí salían las propuestas con
// otro importe de las que se quejó Jesús.
ok(!qs.some(q=>/filename:pdf/.test(q)),'ya no se lanza la consulta de arrastre por proveedor');
ok(consultasGmail({fecha:'',proveedor:'',numFactura:''}).length===0,'sin datos → sin consultas, no explota');

const msg={id:'m1',payload:{headers:[{name:'Subject',value:'Factura 100/2026 BASTIMAR'},{name:'From',value:'Administración <admin@bastimar.es>'}],
  parts:[{mimeType:'multipart/alternative',parts:[{mimeType:'text/plain',body:{size:10}},{mimeType:'text/html',body:{size:20}}]},
         {filename:'F100-2026.pdf',mimeType:'application/pdf',body:{attachmentId:'ATT1',size:53000}},
         {filename:'logo.png',mimeType:'image/png',body:{attachmentId:'ATT2',size:0}},
         {filename:'firma.gif',mimeType:'image/gif',body:{attachmentId:'ATT3',size:900}},
         {filename:'nested.pdf',mimeType:'application/octet-stream',body:{attachmentId:'ATT4',size:7000}}]}};
ok(cabecera(msg,'subject')==='Factura 100/2026 BASTIMAR'&&cabecera(msg,'From').includes('bastimar'),'cabeceras sin distinguir mayúsculas');
const adjs=adjuntosDe(msg);
ok(adjs.map(a=>a.filename).join(',')==='F100-2026.pdf,nested.pdf','adjuntos: recorre partes anidadas, ignora tamaño 0 y GIF, acepta .pdf por extensión');
const ctx={asunto:cabecera(msg,'Subject'),de:cabecera(msg,'From')};
const p1=puntuar(adjs[0],inv,ctx),p2=puntuar(adjs[1],inv,ctx);
ok(p1.puntos>=5&&p1.por.includes('número en el asunto')&&p1.por.includes('es PDF'),`el PDF con número en fichero/asunto puntúa alto (${p1.puntos})`);
ok(p2.puntos<p1.puntos,'el otro PDF sin número puntúa menos');
ok(decidir([{...adjs[0],...p1},{...adjs[1],...p2}]).auto.filename==='F100-2026.pdf','decisión: un candidato claro → se engancha solo');
ok(decidir([{puntos:3,filename:'a.pdf',por:['número en el asunto','es PDF']},{puntos:2,filename:'b.pdf',por:['dígitos del número en el fichero']}]).elegir.length===2,'dos candidatos parejos con número → se pregunta');
ok(decidir([{puntos:1,filename:'foto.jpg',por:['es PDF']}]).nada===true,'un candidato cuyo único mérito es «es PDF» NO se propone (v357)');
ok(decidir([{puntos:2,filename:'a.pdf',por:['proveedor en remitente/asunto/fichero','es PDF']}]).nada===true,'proveedor sin fecha cercana ni número → tampoco');
// v383 · esta regla se ha ENDURECIDO a petición de Jesús: «que no ofrezca
// facturas que no sean suyas… me propone facturas con importes distintos».
// «Proveedor + fecha cercana» es cualquier correo suyo de ese mes, y era de
// donde salían las propuestas incoherentes. Ahora hace falta el NÚMERO o el
// IMPORTE exacto.
ok(decidir([{puntos:3,filename:'a.pdf',por:['proveedor en remitente/asunto/fichero','fecha cercana','es PDF']}]).nada===true,
   'proveedor + fecha cercana ya NO basta: sin número ni importe no se propone');
ok(decidir([{puntos:5,filename:'a.pdf',por:['importe exacto (3.350,01 €)','proveedor en remitente/asunto/fichero']}]).elegir.length===1,
   'con el IMPORTE exacto y el proveedor, sí se propone (para que elija Jesús)');
ok(coincideDeVerdad({por:['dígitos del número en el fichero']})&&!coincideDeVerdad({por:['fecha cercana','es PDF']}),
   'coincidencia real = número o importe; la fecha y «es PDF» no bastan');
{ const ctx2={asunto:'Factura',de:'admin@bastimar.es',fecha:'Tue, 21 Jul 2026 10:00:00 +0200'};
  const p=puntuar({filename:'doc.pdf',mimeType:'application/pdf'},inv,ctx2);
  ok(p.por.includes('fecha cercana')&&p.por.includes('proveedor en remitente/asunto/fichero'),'la fecha del correo a ±20 días de la factura suma y deja rastro'); }
ok(decidir([]).nada===true,'sin candidatos → nada');
const bytes=b64urlABytes('JVBERi0xLjQ-Xw');
ok(bytes[0]===0x25&&bytes[1]===0x50&&bytes[2]===0x44&&bytes[3]===0x46&&bytes.length===10,'base64url (con - y _ y sin relleno) → bytes de %PDF');

// facturas reales: qué falta en el T3 hasta el 13-08 (el paquete real)
const copia=JSON.parse(fs.readFileSync('/home/claude/copia/BH10_copia_completa_2026-09-06.json','utf8'));
const inv2=JSON.parse(copia.claves['bh10-fc-v3']);
const fiscal=(i)=>i&&!['anticipo','cobro','personal','presupuesto'].includes(i.tipo)&&!i.anulada;
const t3=inv2.filter(i=>fiscal(i)&&String(i.fecha||'')>='2026-07-01'&&String(i.fecha||'')<='2026-08-13');
const faltan=faltanDocumento(t3,esquemaEnlace);
const sinAdj=t3.filter(i=>!i.adjPath).length,adjfs=t3.filter(i=>/^adjfs:/.test(i.adjPath||'')).length;
// v369 (06-09-2026) · las 7 adjfs: del 13-08 ya están sustituidas en producción
// (ese era el objetivo del botón 🔁 Sustituir): el ancla fija «adjfs===7» sobra.
// Queda la invariante de verdad: lo que falta = sin adjuntar + enlaces ilegibles.
ok(faltan.length===sinAdj+adjfs,`T3 real: faltan ${faltan.length} = ${sinAdj} sin adjuntar + ${adjfs} adjfs:`);
ok(faltanDocumento([{adjPath:'imp-fc1',adjNube:false}],esquemaEnlace).length===1&&faltanDocumento([{adjPath:'imp-fc1',adjNube:true}],esquemaEnlace).length===0,'no confirmada en la nube cuenta como falta; confirmada no');
ok(faltan.every(i=>consultasGmail(i).length>=1),'todas las que faltan tienen al menos una consulta que lanzar');

const app=fs.readFileSync(new URL('../src/app.jsx',import.meta.url),'utf8');
ok(/sanoDocumento\(bytes,mime,cand\.filename\)/.test(app)&&/bh10Adj\.subir\(inv\.id,file\)/.test(app)&&/await confirmarNube\(path\)/.test(app),'lo que viene de Gmail se comprueba entero, se sube y se confirma en la nube');
ok(/if\(!clientId\)\{setPideGmailId\(true\);return;\}/.test(app.slice(app.indexOf('const buscarEnGmailFaltantes'))),'sin ID de Google se abre la ventana que explica los 4 pasos');
ok(/sin documento de \$\{recP\.length\} — irán nombradas en el LÉEME/.test(app),'la ventana avisa antes de generar de cuántas van sin documento');

// v354 · filtro «📎 Sin doc» y marca por fila en Recibidas
ok(/\['sdoc',`📎 Sin doc/.test(app)&&/if\(fSinDoc\)r=r\.filter/.test(app),'filtro rápido «📎 Sin doc» en Recibidas, con su cuenta');
ok(/const docEstado=\(i\)=>\{\s*if\(!esGastoFiscal\(i\)\)return '';/.test(app),'docEstado solo juzga recibidas fiscales (no anticipos, nóminas, presupuestos ni anuladas)');
ok(/title="sin documento"[^>]*>📎✗</.test(app)&&/title="sin confirmar en la nube"[^>]*>⏳</.test(app),'marca por fila: 📎✗ sin documento · ⏳ sin confirmar; nada cuando está bien');
ok(/setFSinDoc\(false\);\},fEstado==='todos'&&!fMes&&!fSinDoc/.test(app),'el chip «Todas» también quita el filtro de documento');

// v355 · sustituir un documento (roto o no) sin gastar lector
ok(/🔁 Sustituir<input type="file"[^>]*onChange=\{e=>\{const f=e\.target\.files&&e\.target\.files\[0\];if\(f\)subirAdjuntos\(\[\[inv\.id,f\]\]\)/.test(app),'ficha: 🔁 Sustituir siempre que hay enlace, sube directo (sin lector, sin tokens)');
ok(/if\(_adjF\)subirAdjuntos\(\[\[inv\.id,_adjF\]\]\);/.test(app)&&!/if\(_adjF&&!editing\)/.test(app),'formulario: al editar con archivo también se sube (antes solo en factura nueva)');
ok(/docEstado\(dup\.inv\)==='ok'\)\{ resultados\.push\(\{file,estado:'ya-tenia'/.test(app)&&/sustituye el documento roto/.test(app),'archivador: un enlace roto se sustituye; uno sano sigue siendo «ya tenía» con la pista');

// v356 · «📎 ZIP» de la lista filtrada con documentos
ok(/const descargarDocumentos=async\(lista,onProgreso\)=>/.test(app)&&/await descargarDocumentos\(recP\)/.test(app)&&/await descargarDocumentos\(lista,/.test(app),'la descarga de documentos es UNA función, compartida por el paquete y por el ZIP de la lista');
ok(/const descargarEnZips=async\(entradas,nombreBase,clave,fuerte\)=>/.test(app)&&/descargarEnZips\(entradas,'gestoria_'\+per\+'_BH10',clave/.test(app)&&/descargarEnZips\(entradas,'facturas_'\+today\+'_documentos','',false\)/.test(app),'el troceado en zips de 10 MB también es compartido');
ok(/exportZipLista\(r,partes\.join\(' · '\)\)/.test(app)&&/📎 ZIP/.test(app),'botón 📎 ZIP junto al Excel, con el MISMO texto de filtro');
ok(/\{nombre:'facturas\.csv',texto:'\\ufeff'\+csvTextoDe\(lista\)\}/.test(app)&&/\{nombre:'cuadre_documentos\.csv',texto:'\\ufeff'\+csvCuadre\(lista,estado\)\}/.test(app)&&/textoCuadre\(cuadre\)\}/.test(app),'el ZIP lleva facturas.csv, cuadre_documentos.csv y LÉEME con cuadre');

// v357 · datos del cliente en la emitida desde su ficha
ok(/const datosClienteDe=\(cb\)=>\{/.test(app)&&/receptor:datosClienteDe\(cb\),/.test(app),'el PDF de la emitida toma el receptor de datosClienteDe (contrato → ficha)');
ok(/email:String\(\(cb&&cb\._clienteEmail\)\|\|\(f&&f\.email\)\|\|''\)/.test(app)&&/tel:String\(\(cb&&cb\._clienteTel\)\|\|\(f&&f\.telefono\)\|\|''\)/.test(app),'email y teléfono salen de la ficha si la factura no los guardó');
ok(/_clienteEmail:String\(\(_fichaCli&&_fichaCli\.email\)\|\|''\)\.trim\(\),_clienteTel:/.test(app),'al emitir se guardan también email y teléfono del cliente');
ok(/const _contacto=\[receptor\.email\|\|'',receptor\.tel\?'Tel: '\+receptor\.tel:''\]/.test(app),'el papel imprime email · Tel debajo de la dirección');
ok(/\$\{clienteDir\|\|''\}\$\{contacto\?'<br>'\+escXml\(contacto\):''\}/.test(app),'el HTML añade el contacto sin meter espacios nuevos en la plantilla (el contrato sigue idéntico)');

// v358 · Ajustes como casillas
const aj=fs.readFileSync(new URL('../src/ajustes.jsx',import.meta.url),'utf8');
ok(/data-aj="casilla"/.test(aj)&&/data-aj="cuerpo" data-titulo=\{cab\?cab\.titulo:''\}/.test(aj),'casillas y cuerpos marcados (la batería de títulos los ata)');
ok(/const ES_FORM=new Set\(\['Datos empresa ordenante','Planificación mensual','Clave API de Anthropic'/.test(aj),'las casillas de datos declaradas: son las que tienen Guardar / Cerrar sin guardar');
ok(/if\(sinGuardar&&snap\.current&&restaurar\)restaurar\(snap\.current\)/.test(aj)&&/snap\.current=instantanea\?instantanea\(\):null;alternar\(t\)/.test(aj),'al abrir se toma la instantánea y cerrar sin guardar la restaura');
ok(/instantanea=\{\(\)=>\(\{compCfg,anthKey,custodia\}\)\}/.test(app)&&/setCompCfg\(sn\.compCfg\);setAnthKey\(sn\.anthKey\);setCustodia\(sn\.custodia\)/.test(app),'la app da la instantánea (empresa, clave, custodia) y sabe restaurarla');
ok(/aria-label="Cerrar" title=\{esForm\?'Cerrar sin guardar':'Cerrar'\}/.test(aj),'la ✕ cierra sin guardar en las de datos');
ok(/onRestablecer=\{\(\)=>\{setOrdenConfig\(\[\]\);setApartados\(\[\]\)/.test(app)&&!/colocarConfig/.test(app),'el mando de colocar vive en la cabecera; la tarjeta vieja ya no existe');
ok(/const ordenados=lista\.slice\(\)\.sort/.test(aj)&&/if\(ia>=0&&ib>=0\)return ia-ib;/.test(aj)&&/return grupoDe\(da\)-grupoDe\(db\)\|\|ia0-ib0;/.test(aj),'el orden guardado manda sin ataduras de grupo; lo no colocado, por grupo y aparición (como antes)');

// v360 · el lote de fotos adjunta el fichero; el orden de Ajustes se relee al entrar
ok(/setForm\(\{ \.\.\.emptyForm, tipo: batchTipo, \.\.\.batchFiles\[first\]\.data, _file: batchFiles\[first\]\.file \}\)/.test(app)&&/setForm\(\{ \.\.\.emptyForm, tipo: batchTipo, \.\.\.updated\[next\]\.data, _file: updated\[next\]\.file \}\)/.test(app),'el lote (cámara / varias fotos) lleva el fichero a la ficha en los dos pasos: se adjunta al registrar');
ok(/if\(view!=='config'\)return;[\s\S]{0,400}window\.storage\.get\('bh10-ordenconfig'\)/.test(app),'al entrar en Ajustes se relee el orden de la nube (móvil ↔ ordenador)');
ok(/vf:\(regVf&&vfDatosPdf\)\?vfDatosPdf\(regVf/.test(fs.readFileSync(new URL('../src/documentos.js',import.meta.url),'utf8'))&&/vf:regVfCert\?vfDatosPdf\(regVfCert/.test(app),'el sello VERI*FACTU va al PDF por los dos caminos (al emitir y al descargar)');

console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<20){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
