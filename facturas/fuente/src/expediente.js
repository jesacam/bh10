// ═══ EXPEDIENTE DE OBRA · lista de documentación de inicio (v389) ═════════
// Jesús (11-09-2026) dicta la lista inicial y pide: poder añadir líneas, y
// marcar gráficamente cuando algo NO es obligatorio en una obra concreta.
// Los documentos viven en SU Drive; la app solo guarda la carpeta, el estado
// de cada línea y, tras cotejar, el nombre y enlace del fichero que casó.

// claves: palabras que deben aparecer TODAS (normalizadas) en el título del
// fichero. Varios juegos de claves = vale cualquiera de ellos.
export const LISTA_EXPEDIENTE=[
 {id:'com-inicio', t:'Comunicación de inicio de obra al Ayuntamiento',claves:[['comunicacion','inicio'],['inicio','ayuntamiento']]},
 {id:'pss',        t:'Plan de Seguridad y Salud',claves:[['plan','seguridad','salud']]},
 {id:'residuos',   t:'Plan de gestión de residuos',claves:[['residuos']]},
 {id:'pss-aprob',  t:'Aprobación del Plan de Seguridad y Salud (CSS)',claves:[['aprobacion','seguridad'],['aprobacion','pss'],['acta','aprobacion','plan']]},
 {id:'apertura',   t:'Apertura del centro de trabajo',claves:[['apertura','centro','trabajo']]},
 {id:'subcontr',   t:'Libro de subcontratación',claves:[['subcontratacion']]},
 {id:'trc',        t:'Seguro Todo Riesgo Construcción (TRC)',claves:[['todo','riesgo'],['trc']]},
 {id:'rc-constr',  t:'Seguro RC del constructor',claves:[['rc','constructor'],['responsabilidad','civil','constructor']]},
 {id:'tgss',       t:'Certificado TGSS del constructor',claves:[['tgss'],['seguridad','social','certificado']]},
 {id:'aeat',       t:'Certificado AEAT del constructor',claves:[['aeat'],['agencia','tributaria','certificado'],['aet']]},
 {id:'trab-css',   t:'Documentación de trabajadores a CSS',claves:[['trabajadores','css'],['documentacion','trabajadores']]},
 {id:'incidencias',t:'Libro de incidencias (digital)',claves:[['libro','incidencias']]},
 {id:'ordenes',    t:'Libro de órdenes / actas digitales',claves:[['libro','ordenes'],['actas','obra']]},
 {id:'rc-do',      t:'Seguro RC en vigor · Director de obra',claves:[['rc','director','obra']]},
 {id:'rc-de',      t:'Seguro RC en vigor · Director de ejecución y CSS',claves:[['rc','ejecucion'],['rc','css']]},
 {id:'acta-inicio',t:'Acta de inicio de obra',claves:[['acta','inicio']]},
];

export const normTitulo=(s)=>String(s||'').toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9ñ]+/g,' ').trim();

// ¿casa este fichero con esta línea?
export const casaLinea=(linea,nombreFichero)=>{
  const n=' '+normTitulo(nombreFichero)+' ';
  const juegos=[...(linea.claves&&linea.claves.length?linea.claves:[[normTitulo(linea.t)]]),
                ...(linea.clavesExtra||[])];   // v393 · lo aprendido de elecciones a mano
  return juegos.some(cl=>cl.every(p=>n.includes(' '+p+' ')||n.includes(p)));
};

// el expediente guardado en la obra, completado con la lista inicial (las
// líneas nuevas de futuras versiones aparecen solas; lo guardado manda)
export const lineasDe=(obra)=>{
  const g=(obra&&obra.expediente&&obra.expediente.lineas)||[];
  const porId=new Map(g.map(l=>[l.id,l]));
  const base=LISTA_EXPEDIENTE.map(d=>({id:d.id,t:d.t,claves:d.claves,...(porId.get(d.id)||{})}));
  const extra=g.filter(l=>l.propia);         // las añadidas por Jesús, al final
  return [...base,...extra];
};

// cotejo: para cada línea que aplique, el primer fichero de la carpeta que case
export const cotejarExpediente=(lineas,ficheros)=>lineas.map(l=>{
  if(l.noAplica)return {...l,doc:null};
  if(l.doc&&l.doc.manual)return l;         // v393 · lo elegido a mano MANDA
  const f=(ficheros||[]).find(x=>casaLinea(l,x.name));
  return {...l,doc:f?{nombre:f.name,enlace:f.webViewLink||''}:null};
});

// el identificador de la carpeta, pegue lo que pegue (enlace o id a pelo)
export const idCarpetaDrive=(txt)=>{
  const s=String(txt||'').trim();
  const m=s.match(/folders\/([A-Za-z0-9_-]{10,})/)||s.match(/[?&]id=([A-Za-z0-9_-]{10,})/);
  if(m)return m[1];
  return /^[A-Za-z0-9_-]{10,}$/.test(s)?s:'';
};

// ═══ v393 · CASADO FLEXIBLE, ELECCIÓN A MANO Y APRENDIZAJE ═══════════════
// Jesús (11-09-2026): «no siempre los títulos se llaman como tú lo tienes en
// la app y no lo reconoce». Tres piezas: candidatos por parecido (él
// confirma), elegir de la lista entera, y lo elegido a mano MANDA y enseña.
const VACIAS=new Set(['de','del','la','las','el','los','y','en','a','al','por','para','con','que','su','se']);
export const palabrasSig=(txt)=>normTitulo(txt).split(' ')
  .filter(p=>p.length>=3&&!VACIAS.has(p)&&!/^\d+$/.test(p));

// ficheros de la carpeta que COMPARTEN alguna palabra con la línea, por parecido
export const candidatosLinea=(linea,ficheros)=>{
  const mias=new Set([
    ...palabrasSig(linea.t),
    ...(linea.claves||[]).flat(),
    ...((linea.clavesExtra||[]).flat()),
  ]);
  return (ficheros||[]).map(f=>{
    const suyas=palabrasSig(f.n!==undefined?f.n:f.name);
    const comunes=suyas.filter(p=>mias.has(p));
    return {n:f.n!==undefined?f.n:f.name,e:f.e!==undefined?f.e:(f.webViewLink||''),puntos:comunes.length,por:comunes};
  }).filter(x=>x.puntos>0).sort((a,b)=>b.puntos-a.puntos).slice(0,4);
};

// al elegir a mano, la línea APRENDE: las dos palabras más raras del fichero
// pasan a ser claves de esa línea, y la próxima obra casa sola
export const aprenderDe=(linea,nombreFichero)=>{
  const p=palabrasSig(nombreFichero).slice(0,2);
  if(!p.length)return linea.clavesExtra||[];
  const ya=(linea.clavesExtra||[]).some(j=>j.join(' ')===p.join(' '));
  return ya?(linea.clavesExtra||[]):[...(linea.clavesExtra||[]),p];
};
