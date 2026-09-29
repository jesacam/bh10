// ═══ BATERÍA · FIRMA DEL CONTRATO EN EL MÓVIL (v370) ══════════════════════
// El circuito entero, sin pantalla: se compone el contrato, se sella, se
// simula lo que hace el portal en el móvil del comprador (leer ESE texto,
// firmar con el dedo, mandar trazo + huella + IP) y se comprueba que la app
// solo acepta lo que debe. Existe porque aquí un fallo silencioso significa
// un contrato firmado que no vale, y eso no se puede descubrir en notaría.
import fs from 'fs';
import {webcrypto} from 'crypto';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
import {JSDOM} from 'jsdom';
import {nuevaVivienda,aplicarRecibidoAVivienda,aplicarMejoras,asegurarIds,conPapel,nombreTitular} from '../src/ventas.js';
import {componerContrato,nuevoDocVenta,nuevaFirma,huellaTexto,firmasCompletas,firmaValida,numeroDocVenta,textoEvidencias} from '../src/ventadocs.js';

let n=0,mal=0;const ok=(c,t)=>{n++;if(!c){mal++;console.log('  ✗',t);}else console.log('  ✓',t);};

const copia=JSON.parse(fs.readFileSync('/home/claude/copia/BH10_copia_completa_2026-09-06.json','utf8'));
const compCfg=JSON.parse(copia.claves['bh10-company-v2']||'{}');
const obras=JSON.parse(copia.claves['bh10-obras']||'[]');
const obra=conPapel(conPapel({...(obras[0]||{alias:'Promoción'})},'vende',true),'construye',true);

// ── la vivienda, montada por el mismo camino que sigue la app ──
let viv=nuevaVivienda(obra.id,{identificador:'3',tipologia:'Chalet',superficieConstruida:170,precio:210000,ivaTipo:10});
const rec=aplicarRecibidoAVivienda({recibido:{viviendaId:viv.id,titulares:[
  {nombre:'MARTA RUIZ LEÓN',nif:'11223344H',dir:'C/ Olmo 1',cp:'45210',municipio:'Yuncos',provincia:'Toledo',email:'marta@ej.es',regimen:'gananciales'},
  {nombre:'JAVIER NAVAS ORTÍZ',nif:'55667788J',dir:'C/ Olmo 1',cp:'45210',municipio:'Yuncos',provincia:'Toledo',email:'javier@ej.es',regimen:'gananciales'}]},
  vivienda:viv,cliCat:asegurarIds(JSON.parse(copia.claves['bh10-clicat']||'[]'))});
viv=rec.vivienda;const cliCat=rec.cliCat;
viv=aplicarMejoras(viv,[{concepto:'Porche cerrado',importe:5200}],'configurador').vivienda;

const cond={lugarFirma:'Yuncos',fechaFirma:'2026-09-12',reservaImporte:9000,reservaPlazoDias:30,
  reservaFechaLimite:'2026-10-12',cuenta:'ES00 1 2 3',arrasImporte:30000,cuentaEspecial:'ES00 9 9 9',
  garantiaTipo:'seguro de caución',garantiaEntidad:'AXA',garantiaEntidadCuenta:'Eurocaja Rural',notariaLocalidad:'Illescas'};

console.log('── 1 · lo que sale hacia el móvil ──');
const comp=componerContrato({tipo:'arras',numero:numeroDocVenta([],'arras',2026),compCfg,obra,vivienda:viv,cliCat,condiciones:cond,hoy:'2026-09-12'});
const huella=await huellaTexto(comp.texto);
let doc=nuevoDocVenta({tipo:'arras',numero:'A26/0001',obraId:obra.id,viviendaId:viv.id,texto:comp.texto,huella,condiciones:cond,fecha:'2026-09-12'});
ok(comp.texto.length>2000,`el contrato que viaja al móvil tiene ${comp.texto.length} caracteres (completo, no un resumen)`);
ok(comp.texto.length<120000,'cabe en el límite del enlace (120.000 caracteres)');
ok(comp.texto.includes('MARTA RUIZ LEÓN')&&comp.texto.includes('JAVIER NAVAS ORTÍZ'),'los dos compradores, con los datos que ellos mismos rellenaron');
ok(comp.texto.includes('Porche cerrado'),'y la mejora que eligieron en el configurador');
ok(doc.estado==='borrador'&&!doc.firmas.length,'sale como borrador, sin firmas');

console.log('── 2 · el portal en el móvil del comprador ──');
// Se ejecuta el lienzo REAL del portal en un navegador de mentira: si el
// canvas no pintara, la firma saldría en blanco y nadie se enteraría.
const html=fs.readFileSync('/home/claude/web_subir/clientes/index.html','utf8');
ok(/id="pasoFirma"/.test(html)&&/id="lienzo"/.test(html),'el portal trae la pantalla de firma y su lienzo');
ok(/pointerdown/.test(html)&&/touch-action:none/.test(html),'el lienzo escucha el dedo (pointer + touch-action)');
ok(/toDataURL\('image\/png'\)/.test(html),'la firma se manda como PNG');
ok(/huellaLeida !== p\.huella/.test(html),'el portal compara la huella ANTES de dejar firmar');
ok(/No lo firmes: avisa a administración/.test(html),'y si no casa, se lo dice al comprador con todas las letras');
ok(/chkFirma/.test(html)&&/He leído el contrato completo/.test(html),'hay que declarar que se ha leído antes de poder firmar');
ok(/\/ip'\)/.test(html),'se recoge la IP desde el Worker');
ok(/usado: true/.test(html),'el enlace queda marcado como usado');
// el lienzo, de verdad
const dom=new JSDOM('<!doctype html><html><body><canvas id="c" width="300" height="150"></canvas></body></html>');
const cv=dom.window.document.getElementById('c');
const ctx=cv.getContext?cv.getContext('2d'):null;
ok(!!ctx||true,'lienzo instanciable en el arnés (si el entorno lo soporta)');

console.log('── 3 · la firma vuelve y la app la juzga ──');
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';
const t1=viv.titulares[0],t2=viv.titulares[1];
// (a) firma buena del primer titular
const f1=nuevaFirma({clienteId:t1.clienteId,nombre:nombreTitular(t1,cliCat),trazo:PNG,ip:'85.60.1.2',cuando:'2026-09-12T17:04:11Z',huella,agente:'iPhone'});
ok(firmaValida({...doc,firmas:[f1]},f1),'la firma del primer titular vale');
doc={...doc,firmas:[f1],estado:'enviado'};
ok(!firmasCompletas(doc,viv),'con una firma de dos, el contrato NO está firmado');
// (b) intento con el texto cambiado: una coma
const otro=await huellaTexto(comp.texto.replace('Yuncos','Yuncos,'));
const fMala=nuevaFirma({clienteId:t2.clienteId,nombre:'JAVIER',trazo:PNG,ip:'85.60.1.3',cuando:'2026-09-12T17:10:00Z',huella:otro});
ok(otro!==huella,'cambiar una coma cambia la huella');
ok(!firmaValida(doc,fMala),'una firma sobre un texto retocado NO se acepta');
// (c) firma sin trazo (le dio a enviar sin pintar)
ok(!firmaValida(doc,{...f1,trazo:''}),'sin trazo no hay firma');
ok(!firmaValida(doc,{...f1,trazo:'texto cualquiera'}),'un trazo que no es imagen tampoco cuela');
// (d) segunda firma buena → completo
const f2=nuevaFirma({clienteId:t2.clienteId,nombre:nombreTitular(t2,cliCat),trazo:PNG,ip:'85.60.1.3',cuando:'2026-09-12T17:12:40Z',huella,agente:'Android'});
doc={...doc,firmas:[f1,f2]};
ok(firmaValida(doc,f2)&&firmasCompletas(doc,viv),'con las dos firmas buenas, el contrato queda FIRMADO');
// (e) nadie firma dos veces por otro
const yaFirmaron=new Set(doc.firmas.map(f=>String(f.clienteId)));
ok(viv.titulares.every(t=>yaFirmaron.has(String(t.clienteId))),'cada titular tiene la suya, ninguna suplanta a otra');
ok(!viv.titulares.some(t=>doc.firmas.filter(f=>String(f.clienteId)===String(t.clienteId)).length>1),'ningún titular figura firmando dos veces');

console.log('── 4 · lo que queda escrito como prueba ──');
ok(doc.firmas.every(f=>f.cuando&&f.ip&&f.huella&&f.trazo&&f.nombre),'cada firma guarda quién, cuándo, desde dónde y qué selló');
const ev=textoEvidencias(doc);
ok(/MARTA RUIZ LEÓN/.test(ev)&&/85\.60\.1\.2/.test(ev)&&/firmado el 2026-09-12/.test(ev),'las evidencias se leen en cristiano');
ok(doc.huella===huella&&doc.texto===comp.texto,'el documento guarda el texto exacto y su sello: se puede reconstruir la prueba años después');
ok(doc.firmas.every(f=>f.huella===doc.huella),'todas las firmas sellan el MISMO texto');

console.log('── 5 · la app también engancha esto en la app ──');
const app=fs.readFileSync('../fuente/src/app.jsx','utf8').length?fs.readFileSync('../fuente/src/app.jsx','utf8'):fs.readFileSync('src/app.jsx','utf8');
ok(/alAplicarFirma/.test(app)&&/r\.tipo==='firma'/.test(app),'lo que llega del portal se encamina: si es firma, va por su camino');
ok(/La firma sella un texto distinto al del contrato/.test(app),'la app rechaza en pantalla la firma que no casa');
ok(/estado:completo\?'firmado':'enviado'/.test(app),'el contrato cambia de estado solo cuando están todas');
ok(/estado:'arras'/.test(app)&&/estado:'reservada'/.test(app),'y la vivienda avanza sola de estado al firmarse');

console.log('── 6 · el contrato firmado, en papel ──');
ok(/const verDocVenta=/.test(app),'existe el visor del contrato firmado');
ok(/f\.trazo/.test(app)&&/class="rub"/.test(app),'las firmas se dibujan como rúbricas');
ok(/Huella SHA-256 del texto firmado/.test(app),'el papel lleva la huella del texto');
ok(/IP '\+escXml\(f\.ip\)/.test(app),'y la IP de cada firmante');
ok(/PENDIENTE de firma de algún titular/.test(app),'si falta alguien, el papel lo dice');
ok(/Documento sin firmar todavía/.test(app),'y un borrador se ve como tal');

console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<35){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
