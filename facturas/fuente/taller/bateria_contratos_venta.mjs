// ═══ BATERÍA · CONTRATOS DE RESERVA Y ARRAS (v370) ════════════════════════
// Comprueba el flujo que Jesús describió el 06-09-2026: la parte vendedora
// sale de la EMPRESA EN USO, el comprador de lo que rellenó en SU ENLACE del
// portal, y la vivienda con sus MEJORAS del configurador. Arras
// CONFIRMATORIAS y sin fecha límite de entrega. Firma con el dedo, sellada
// con la huella del texto exacto que se le enseñó.
// Datos reales: la copia del 06-09 (empresa, clientes) + una vivienda montada
// con el mismo camino que sigue la app (portal → titulares → mejoras).
import fs from 'fs';
import {webcrypto} from 'crypto';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
import {nuevaVivienda,aplicarRecibidoAVivienda,aplicarMejoras,idCliente,asegurarIds,papelesObra,conPapel} from '../src/ventas.js';
import {render,enLetra,eur,datosDeVenta,componerContrato,numeroDocVenta,nuevoDocVenta,nuevaFirma,firmasCompletas,firmaValida,huellaTexto,huecosPendientes,PLANTILLAS,fechaLarga} from '../src/ventadocs.js';

let n=0,mal=0;const ok=(c,t)=>{n++;if(!c){mal++;console.log('  ✗',t);}else console.log('  ✓',t);};

const copia=JSON.parse(fs.readFileSync('/home/claude/copia/BH10_copia_completa_2026-09-06.json','utf8'));
const compCfg=JSON.parse(copia.claves['bh10-company-v2']||'{}');
const cliCat0=asegurarIds(JSON.parse(copia.claves['bh10-clicat']||'[]'));
const obras=JSON.parse(copia.claves['bh10-obras']||'[]');

console.log('── 1 · el motor de huecos ──');
ok(render('Hola {{a}}',{a:'mundo'})==='Hola mundo','variable simple');
ok(render('{{a.b.c}}',{a:{b:{c:'hondo'}}})==='hondo','ruta con puntos');
ok(render('{{#l}}[{{x}}]{{/l}}',{l:[{x:1},{x:2}]})==='[1][2]','sección repetida por cada elemento');
ok(render('{{#hay}}sí{{/hay}}{{^hay}}no{{/hay}}',{hay:false})==='no','sección inversa cuando está vacío');
ok(render('{{#hay}}sí{{/hay}}{{^hay}}no{{/hay}}',{hay:true})==='sí','sección directa cuando hay valor');
ok(render('{{#l}}{{#in}}({{v}}){{/in}}{{/l}}',{l:[{in:[{v:'a'},{v:'b'}]}]})==='(a)(b)','secciones anidadas del mismo tipo');
ok(render('{{#a}}X{{/a}}fin',{a:[]})==='fin','lista vacía no pinta nada');
ok(render('{{no_existe}}|',{})==='|','hueco desconocido se queda vacío, no rompe');
// el que más duele: que una sección herede el contexto de fuera
ok(render('{{#titulares}}{{nombre}} de {{empresa}}{{/titulares}}',{empresa:'BIG',titulares:[{nombre:'Ana'}]})==='Ana de BIG','dentro de una sección se ven los datos de fuera');

console.log('── 2 · importes en letra (los contratos lo exigen) ──');
ok(enLetra(0)==='cero euros','cero');
ok(enLetra(1)==='uno','uno');
ok(enLetra(21)==='veintiuno','veintiuno sin partir');
ok(enLetra(100)==='cien','cien (no «ciento»)');
ok(enLetra(101)==='ciento uno','ciento uno');
ok(enLetra(1000)==='mil','mil');
ok(enLetra(2500)==='dos mil quinientos','dos mil quinientos');
ok(enLetra(185000)==='ciento ochenta y cinco mil','185.000 en letra');
ok(enLetra(1000000)==='un millón','un millón');
ok(/con cincuenta céntimos$/.test(enLetra(1234.5)),'los céntimos van en letra');
ok(eur(185000)==='185.000,00','importe en formato español');
ok(fechaLarga('2026-09-06')==='6 de septiembre de 2026','fecha en letra larga');

console.log('── 3 · las TRES fuentes se juntan en el contrato ──');
// (a) vivienda de una obra real marcada como promotora
const obra=conPapel(conPapel({...(obras[0]||{alias:'Promoción'})},'vende',true),'construye',true);
let viv=nuevaVivienda(obra.id,{identificador:'7',tipologia:'Chalet pareado',superficieConstruida:180,superficieParcela:300,precio:185000,ivaTipo:10});
// (b) lo que llegó por el enlace del portal: dos titulares, uno nuevo
const recibido={viviendaId:viv.id,titulares:[
  {nombre:'ANA PÉREZ GIL',nif:'12345678Z',dir:'C/ Mayor 3',cp:'45210',municipio:'Yuncos',provincia:'Toledo',telefono:'600111222',email:'ana@ejemplo.es',regimen:'gananciales'},
  {nombre:'LUIS SOTO DÍAZ',nif:'87654321X',dir:'C/ Mayor 3',cp:'45210',municipio:'Yuncos',provincia:'Toledo',telefono:'600333444',email:'luis@ejemplo.es',regimen:'gananciales'}]};
const res=aplicarRecibidoAVivienda({recibido,vivienda:viv,cliCat:cliCat0});
viv=res.vivienda;const cliCat=res.cliCat;
ok(viv.titulares.length===2&&viv.titulares[0].porcentaje===50,'el portal deja DOS titulares al 50 % en la vivienda');
ok(viv.estado==='reservada','la vivienda pasa sola a «reservada» al recibir los datos');
// (c) mejoras del configurador
viv=aplicarMejoras(viv,[{concepto:'Suelo porcelánico 90x90',importe:2400},{concepto:'Aerotermia',importe:3800}],'configurador').vivienda;
ok(viv.mejoras.length===2,'las mejoras del configurador entran en la vivienda');

const condiciones={lugarFirma:'Yuncos',fechaFirma:'2026-09-10',reservaImporte:6000,reservaPlazoDias:30,
  reservaFechaLimite:'2026-10-10',cuenta:'ES00 0000 0000 0000 0000 0000',arrasImporte:20000,
  garantiaTipo:'seguro de caución',garantiaEntidad:'AXA',cuentaEspecial:'ES00 1111 2222 3333 4444 5555',
  garantiaEntidadCuenta:'Eurocaja Rural',notariaLocalidad:'Illescas',
  calendario:[{concepto:'Reserva',importe:6000,porcentaje:3.2,fechaOHito:'a la firma'},
              {concepto:'Arras',importe:20000,porcentaje:10.8,fechaOHito:'a la firma del contrato'},
              {concepto:'Resto',importe:159000,porcentaje:86,fechaOHito:'en la escritura'}]};

const D=datosDeVenta({compCfg,obra,vivienda:viv,cliCat,condiciones,hoy:'2026-09-10'});
ok(D.promotora.razon_social===String(compCfg.name||'').trim()&&D.promotora.cif===String(compCfg.cif||'').trim(),
   `la parte vendedora sale de la EMPRESA EN USO: ${D.promotora.razon_social} · ${D.promotora.cif}`);
ok(D.titulares.length===2&&D.titulares[0].nombre_completo==='ANA PÉREZ GIL'&&D.titulares[0].documento==='12345678Z',
   'los compradores salen de las fichas que creó el portal');
ok(D.titulares[0].tipo_documento==='DNI/NIE','el documento se etiqueta como DNI/NIE cuando lo es');
ok(D.varios_titulares===true&&D.titulares[1].porcentaje===50,'dos titulares con su porcentaje');
ok(D.vivienda.identificador==='7'&&D.precio.importe==='185.000,00','vivienda y precio, de la ficha de la vivienda');
ok(D.mejoras.length===2&&D.mejoras_total==='6.200,00','las mejoras y su total llegan al contrato');
ok(D.parte_vendedora_titulo==='PROMOTORA','el papel de la obra manda: promotora');
// v370 · Jesús: «la empresa puede ser vendedora Y constructora». Los papeles
// dejan de ser excluyentes y el contrato tiene que decirlo.
ok(D.promueve_y_construye===true&&D.parte_vendedora_titulo==='PROMOTORA','vendiendo y construyendo a la vez: sigue siendo PROMOTORA en el contrato');
const soloVende=datosDeVenta({compCfg,obra:conPapel(obra,'construye',false),vivienda:viv,cliCat,condiciones,hoy:'2026-09-10'});
ok(soloVende.promueve_y_construye===false&&soloVende.es_promotora===true,'si solo vende, no se dice que ejecute la obra');
const p=papelesObra({rol:'promotora'});
ok(p.vende===true&&p.construye===false,'una obra antigua con un solo `rol` se sigue entendiendo');
const p2=papelesObra(conPapel({},'construye',true));
ok(p2.construye===true&&p2.vende===false,'y los dos interruptores son independientes');

console.log('── 4 · los dos contratos ──');
const R=componerContrato({tipo:'reserva',numero:'R26/0001',compCfg,obra,vivienda:viv,cliCat,condiciones,hoy:'2026-09-10'});
const A=componerContrato({tipo:'arras',numero:'A26/0001',compCfg,obra,vivienda:viv,cliCat,condiciones,hoy:'2026-09-10'});
ok(R.texto.includes('CONTRATO DE RESERVA')&&R.texto.includes('R26/0001'),'la reserva sale con su número');
ok(R.texto.includes('ANA PÉREZ GIL')&&R.texto.includes('LUIS SOTO DÍAZ'),'los dos compradores figuran en la reserva');
ok(R.texto.includes('185.000,00 € (ciento ochenta y cinco mil)'),'el precio va en cifra y en letra');
ok(R.texto.includes('6.000,00 €')&&R.texto.includes('2026-10-10'),'importe de la reserva y fecha límite');
ok(R.texto.includes('Suelo porcelánico 90x90')&&R.texto.includes('Total mejoras: 6.200,00 €'),'el anexo de mejoras se pinta solo');
ok(/arras confirmatorias/i.test(R.texto),'la reserva ya anuncia arras confirmatorias');
ok(A.texto.includes('ARRAS CONFIRMATORIAS')&&A.texto.includes('artículo 1124'),'las arras son CONFIRMATORIAS (art. 1124), como pidió Jesús');
ok(!/arras penitenciales del artículo 1454 del Código Civil, de modo que/i.test(A.texto),'no queda rastro del modelo penitencial');
ok(/NINGUNA de las partes podrá desistir/.test(A.texto),'y se dice expresamente que nadie puede desistir pagando');
ok(/no se fija fecha límite de entrega/i.test(A.texto),'SIN fecha límite de entrega, como pidió Jesús');
ok(A.texto.includes('Reserva: 6.000,00 €')&&A.texto.includes('Resto: 159.000,00 €'),'el calendario de pagos se despliega');
ok(A.texto.includes('Ley 20/2015'),'garantía de cantidades anticipadas (obra nueva)');
ok(/responderá de su devolución/.test(A.texto)&&A.texto.includes('AXA'),'con su entidad y cuenta especial');
ok(/respondiendo solidariamente/.test(A.texto),'cotitularidad solidaria cuando hay dos');
const solo=componerContrato({tipo:'arras',numero:'A26/0002',compCfg,obra,
  vivienda:{...viv,titulares:[viv.titulares[0]]},cliCat,condiciones,hoy:'2026-09-10'});
ok(/un único comprador/.test(solo.texto)&&!/respondiendo solidariamente/.test(solo.texto),'con un solo titular, el contrato lo dice y quita la solidaridad');

ok(/ejecuta asimismo las obras con sus propios medios/.test(R.texto),'la reserva hace constar que además construís vosotros');
ok(/promueve y ejecuta con sus propios medios, en calidad de constructora/.test(A.texto),'y las arras también');
const soloV=componerContrato({tipo:'arras',numero:'A26/0009',compCfg,obra:conPapel(obra,'construye',false),vivienda:viv,cliCat,condiciones,hoy:'2026-09-10'});
ok(!/en calidad de constructora/.test(soloV.texto),'si no construís, esa frase no aparece');

console.log('── 5 · nada se firma con huecos a medias ──');
ok(R.pendientes===0||R.pendientes>0,'se cuentan los huecos sin rellenar');
const flojo=componerContrato({tipo:'reserva',numero:'R26/0003',compCfg:{},obra:{},vivienda:nuevaVivienda('x'),cliCat:[],condiciones:{},hoy:'2026-09-10'});
ok(flojo.pendientes>5,`sin datos, el contrato avisa de ${flojo.pendientes} huecos por rellenar (no se firma así)`);
ok(huecosPendientes('todo relleno')===0,'un texto completo no reporta huecos');

console.log('── 6 · numeración propia, lejos de la serie fiscal ──');
const docs=[{tipo:'reserva',numero:'R26/0001'},{tipo:'reserva',numero:'R26/0002'},{tipo:'arras',numero:'A26/0001'}];
ok(numeroDocVenta(docs,'reserva',2026)==='R26/0003','la siguiente reserva salta las ocupadas');
ok(numeroDocVenta(docs,'arras',2026)==='A26/0002','las arras llevan su propia serie');
ok(numeroDocVenta([],'reserva',2027)==='R27/0001','el año cambia el prefijo');
ok(!/^\d{7}$/.test(numeroDocVenta(docs,'arras',2026)),'jamás se parece a la serie AAnnnnn de facturas');

console.log('── 7 · la firma con el dedo, sellada ──');
const huella=await huellaTexto(A.texto);
ok(/^[0-9a-f]{64}$/.test(huella),'huella SHA-256 del texto exacto que se enseña');
ok(await huellaTexto(A.texto)===huella,'la misma huella dos veces (determinista)');
ok(await huellaTexto(A.texto+' ')!==huella,'un solo espacio cambia la huella: el texto queda sellado');
let doc=nuevoDocVenta({tipo:'arras',numero:'A26/0001',obraId:obra.id,viviendaId:viv.id,texto:A.texto,huella,condiciones,fecha:'2026-09-10'});
ok(doc.estado==='borrador'&&doc.firmas.length===0,'el documento nace en borrador y sin firmas');
const PNG='data:image/png;base64,iVBORw0KGgo=';
const f1=nuevaFirma({clienteId:viv.titulares[0].clienteId,nombre:'ANA PÉREZ GIL',trazo:PNG,ip:'88.1.2.3',cuando:'2026-09-10T18:22:31Z',huella,agente:'iPhone Safari'});
doc={...doc,firmas:[f1]};
ok(firmaValida(doc,f1),'la firma vale: sella la misma huella y trae trazo');
ok(!firmaValida(doc,{...f1,huella:'otra'}),'una firma con huella distinta NO vale (el texto cambió)');
ok(!firmaValida(doc,{...f1,trazo:''}),'sin trazo no hay firma');
ok(!firmasCompletas(doc,viv),'con un titular firmado de dos, el contrato NO está firmado');
const f2=nuevaFirma({clienteId:viv.titulares[1].clienteId,nombre:'LUIS SOTO DÍAZ',trazo:PNG,ip:'88.1.2.4',cuando:'2026-09-10T18:25:02Z',huella});
doc={...doc,firmas:[f1,f2]};
ok(firmasCompletas(doc,viv),'firmado por los DOS titulares: ahora sí');
ok(doc.firmas.every(f=>f.cuando&&f.ip&&f.huella&&f.trazo),'cada firma guarda cuándo, desde dónde, qué selló y el trazo');
ok(!firmasCompletas(doc,{...viv,titulares:[...viv.titulares,{clienteId:'nuevo'}]}),'si aparece un tercer titular, vuelve a faltar su firma');

console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<55){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
