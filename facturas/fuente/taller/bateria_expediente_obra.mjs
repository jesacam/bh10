// ═══ BATERÍA · EXPEDIENTE DE OBRA (v389) ═════════════════════════════════
// La lista de documentación de inicio que dictó Jesús el 11-09-2026, el
// casado por título con su Drive, el N/A gráfico y las líneas añadidas.
import fs from 'fs';
import {LISTA_EXPEDIENTE,normTitulo,casaLinea,lineasDe,cotejarExpediente,idCarpetaDrive,palabrasSig,candidatosLinea,aprenderDe} from '../src/expediente.js';
let n=0,mal=0;const ok=(c,t)=>{n++;if(!c){mal++;console.log('  ✗',t);}else console.log('  ✓',t);};

console.log('── 1 · la lista es LA SUYA, entera y en su orden ──');
ok(LISTA_EXPEDIENTE.length===16,'16 puntos, los 16 dictados');
ok(LISTA_EXPEDIENTE[0].t.includes('Comunicación de inicio')&&LISTA_EXPEDIENTE[15].t==='Acta de inicio de obra',
   'del aviso al Ayuntamiento al acta de inicio');
ok(LISTA_EXPEDIENTE.some(l=>l.t.includes('TRC'))&&LISTA_EXPEDIENTE.some(l=>l.t.includes('subcontratación'))
   &&LISTA_EXPEDIENTE.some(l=>l.t.includes('TGSS'))&&LISTA_EXPEDIENTE.some(l=>l.t.includes('incidencias')),
   'TRC, libro de subcontratación, TGSS y libro de incidencias están');

console.log('── 2 · el casado por título aguanta nombres reales ──');
ok(casaLinea(LISTA_EXPEDIENTE[1],'02 PLAN DE SEGURIDAD Y SALUD - Carranque.pdf'),'mayúsculas y guiones no estorban');
ok(casaLinea(LISTA_EXPEDIENTE[3],'Aprobación_PSS_CSS.pdf'),'las siglas PSS valen para la aprobación');
ok(casaLinea(LISTA_EXPEDIENTE[6],'SEGURO-TODO-RIESGO-CONSTRUCCION_2026.pdf'),'el TRC casa con su nombre largo');
ok(casaLinea(LISTA_EXPEDIENTE[8],'certificado tgss agosto.pdf'),'el TGSS casa en minúsculas');
ok(!casaLinea(LISTA_EXPEDIENTE[1],'Factura_luz_junio.pdf'),'y una factura de la luz NO casa con nada del plan');
ok(normTitulo('Comunicación-Início_Óbra')==='comunicacion inicio obra','los acentos y símbolos se normalizan');

console.log('── 3 · lo guardado manda y lo nuevo aparece ──');
{
  const obra={expediente:{lineas:[{id:'pss',noAplica:true},{id:'p123',t:'Cartel de obra',propia:true}]}};
  const lin=lineasDe(obra);
  ok(lin.length===17,'16 de serie + 1 añadida por Jesús');
  ok(lin.find(l=>l.id==='pss').noAplica===true,'el N/A guardado se respeta');
  ok(lin[16].t==='Cartel de obra'&&lin[16].propia,'la línea propia va al final, marcada como suya');
}

console.log('── 4 · el cotejo respeta el N/A y trae el enlace ──');
{
  const fsim=[{name:'Plan de Seguridad y Salud.pdf',webViewLink:'u1'},{name:'Acta de inicio de obra firmada.pdf',webViewLink:'u2'}];
  const lin=lineasDe({expediente:{lineas:[{id:'pss',noAplica:true}]}});
  const r=cotejarExpediente(lin,fsim);
  ok(r.find(x=>x.id==='pss').doc===null,'una línea N/A no recibe documento aunque el fichero exista');
  const acta=r.find(x=>x.id==='acta-inicio');
  ok(acta.doc&&acta.doc.nombre.includes('Acta')&&acta.doc.enlace==='u2','el acta casa y se lleva su enlace de Drive');
  ok(r.filter(x=>x.doc).length===1,'y nada más casa en falso');
}

console.log('── 5 · la carpeta se entiende como la pegue ──');
ok(idCarpetaDrive('https://drive.google.com/drive/folders/1AbC_dEf-123456789xyz?usp=sharing')==='1AbC_dEf-123456789xyz','del enlace normal');
ok(idCarpetaDrive('1AbC_dEf-123456789xyz')==='1AbC_dEf-123456789xyz','del identificador a pelo');
ok(idCarpetaDrive('lo que sea')===''&&idCarpetaDrive('')==='', 'y la morralla no cuela');

console.log('── 6 · la ventana está montada con lo pedido ──');
{
  const app=fs.readFileSync('src/app.jsx','utf8');
  // v391 · la cabecera ahora usa el rótulo del sujeto (contrato u obra)
  ok(/📋 Expediente · \{rotulo\}/.test(app),'ventana propia, con su barra fija y su aspa, rotulada por su sujeto');
  ok(/\{l\.noAplica\?'🚫':l\.doc\?'✅':'⬜'\}/.test(app),'estado gráfico: 🚫 no aplica · ✅ con documento · ⬜ pendiente');
  ok(/textDecoration:'line-through'/.test(app)&&/no obligatorio en esta obra/.test(app),'el N/A se ve tachado y explicado, como pidió');
  ok(/Marcar como NO obligatorio en esta obra/.test(app),'con su botón N/A por línea');
  ok(/Añadir otro documento a la lista/.test(app)&&/propia:true\}/.test(app),'y se pueden añadir líneas propias');
  ok(/drive\.metadata\.readonly/.test(app),'el permiso de Drive es SOLO títulos y enlaces');
  ok(/'⏳ Cotejando…':'🔄 Cotejar con Drive'/.test(app),'el botón avisa mientras trabaja');
  ok(/trashed=false/.test(app),'la papelera de Drive no cuenta');
}
console.log('── 7 · el expediente cuelga del CONTRATO, sin obra obligatoria (v391) ──');
{
  const app=fs.readFileSync('src/app.jsx','utf8');
  // Jesús: «me interesa tenerlo como ventana dentro de contrato… no quiero
  // tener que tener una obra vinculada».
  ok(/setExpedienteObra\(\{tipo:'contrato',id:c\.id\}\)/.test(app)&&/e\.stopPropagation\(\)/.test(app),
     'cada contrato lleva su botón 📋, tenga obra o no, y abre sin desplegar');
  ok(!/c\.obra&&\(\(\)=>\{const ob=obraDelCatalogo/.test(app),'el botón ya no exige obra vinculada');
  ok(/suj\.tipo==='contrato'\?contratos\.find/.test(app),'la ventana resuelve contrato u obra según quién la abra');
  ok(/if\(suj\.tipo==='contrato'\)setContratos\(p=>p\.map/.test(app),
     'lo del contrato se guarda EN el contrato: carpeta, líneas, N/A y cotejo');
  ok(/setExpedienteObra\(\{tipo:'obra',id:ob\.id\}\)/.test(app),'y el acceso desde Obras sigue vivo, guardando en la obra');
  ok(/const rotulo=suj\.tipo==='contrato'\?\(o\.numero/.test(app),'la cabecera dice de quién es: número de contrato o nombre de obra');
  ok(/guardarExpediente\(suj,/.test(app)&&!/guardarExpediente\(o\.id,/.test(app),'todas las escrituras pasan por el sujeto correcto');
}

console.log('── 8 · títulos que no casan: candidatos, elegir y aprender (v393) ──');
// Jesús: «no siempre los títulos se llaman como tú lo tienes en la app y no
// lo reconoce».
{
  const lista=[{n:'doc_final_v3.pdf',e:'u1'},{n:'Seguro RC empresa 2026.pdf',e:'u2'},{n:'ACTA REPLANTEO E INICIO.pdf',e:'u3'}];
  const acta={id:'acta-inicio',t:'Acta de inicio de obra',claves:[['acta','inicio']]};
  const c=candidatosLinea(acta,lista);
  ok(c.length===1&&c[0].n.includes('REPLANTEO')&&c[0].puntos===2,
     'el acta propone como candidato el fichero que se le PARECE, aunque no case exacto');
  ok(!c.some(x=>x.n.includes('doc_final')),'y lo que no se parece en nada no se propone');
  ok(palabrasSig('Plan de Gestión de Residuos 2026').join(' ')==='plan gestion residuos',
     'las palabras vacías (de, la, y…) y los números sueltos no cuentan como parecido');
}
{
  // elegir a mano un fichero imposible: manda y ENSEÑA
  const linea={id:'trc',t:'Seguro Todo Riesgo Construcción (TRC)',claves:[['todo','riesgo'],['trc']]};
  const extra=aprenderDe(linea,'doc_final_v3.pdf');
  ok(extra.length===1&&extra[0].join(' ')==='doc final','al elegirlo a mano, la línea aprende sus palabras');
  ok(casaLinea({...linea,clavesExtra:extra},'doc_final_v3.pdf'),'y la próxima obra, un nombre así casa SOLO');
  ok(aprenderDe({...linea,clavesExtra:extra},'doc_final_v3.pdf').length===1,'aprenderlo dos veces no lo duplica');
  const r=cotejarExpediente([{...linea,doc:{nombre:'elegido.pdf',enlace:'u',manual:true}}],[{name:'SEGURO-TRC.pdf',webViewLink:'z'}]);
  ok(r[0].doc.nombre==='elegido.pdf','lo elegido a mano MANDA: ningún cotejo posterior lo pisa');
}
{
  const app=fs.readFileSync('src/app.jsx','utf8');
  ok(/lista:files\.map\(f=>\(\{n:f\.name,e:f\.webViewLink\|\|''\}\)\)/.test(app),
     'la lista de la carpeta se guarda con el cotejo: elegir no cuesta otra llamada a Drive');
  ok(/📂 Elegir fichero/.test(app)&&/onClick=\{\(\)=>asignar\(l,f\)\}/.test(app),'cada línea sin casar ofrece candidatos con Usar y la lista entera');
  ok(/doc:\{nombre:f\.n,enlace:f\.e,manual:true\},clavesExtra:aprenderDe\(l,f\.n\)/.test(app),
     'la elección guarda el documento como manual y lo aprendido en la línea');
  ok(/elegido a mano/.test(app),'y en pantalla se ve que fue elección tuya');
}

console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<26){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
