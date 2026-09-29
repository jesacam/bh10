// ═══ BUSCAR EL DOCUMENTO EN GMAIL (v353) ══════════════════════════════════
// Jesús (01-09-2026): «prefiero lo automático». Para cada factura del
// periodo que no tiene documento (sin enlace, enlace roto o no confirmado en
// la nube), la app busca en su Gmail el correo con el adjunto y lo engancha
// sola cuando hay UN candidato claro; si hay varios, se los enseña.
//
// Aquí vive la parte pura y comprobable: qué consultas se lanzan, cómo se
// sacan los adjuntos del mensaje, cómo se puntúan y cuándo se decide solo.

const DOC_MIME=/^(application\/pdf|image\/(jpeg|jpg|png|heic|webp))$/i;
const DOC_EXT=/\.(pdf|jpe?g|png|heic|webp)$/i;

const fechaMas=(iso,dias)=>{const d=new Date(String(iso||'').slice(0,10)+'T12:00:00');if(isNaN(d))return '';d.setDate(d.getDate()+dias);return d.toISOString().slice(0,10).replace(/-/g,'/');};

// Palabras «con peso» del nombre del proveedor: fuera S.L., S.A., CIA, etc.
export const palabraClave=(proveedor)=>{
  const fuera=/^(S\.?L\.?U?|S\.?A\.?U?|S\.?C\.?|C\.?B\.?|SLL|SL|SA|SLU|SAU|CIA|COMPAÑIA|COMPANIA|DE|DEL|LA|EL|LOS|LAS|Y|E|GRUPO|HERMANOS|HNOS|SOCIEDAD|LIMITADA)$/i;
  const ps=String(proveedor||'').replace(/[.,;:()"]/g,' ').split(/\s+/).map(p=>p.trim()).filter(p=>p.length>=3&&!fuera.test(p));
  return ps.sort((a,b)=>b.length-a.length)[0]||'';
};

// El número tal como se escribiría en un asunto o nombre de fichero: sin
// espacios; y su versión «solo dígitos largos» para reconocerlo en nombres.
export const numeroLimpio=(numFactura)=>String(numFactura||'').replace(/\s+/g,'').trim();
export const numeroDigitos=(numFactura)=>{const m=numeroLimpio(numFactura).match(/\d{3,}/g)||[];return m.sort((a,b)=>b.length-a.length)[0]||'';};

// Consultas Gmail en orden de precisión (la primera que devuelva algo manda).
// v383 · Jesús (08-09-2026): «cuando faltan documentos me propone cosas que no
// son coherentes, facturas con importes distintos, otro proveedor…» y «me he
// dado cuenta de que gmail, si pones en el buscador el IMPORTE de la factura,
// da resultados bastante certeros».
// Tenía razón por partida doble:
//  · el importe no se buscaba en ninguna consulta, y es la señal más fiable
//    (aparece en el cuerpo del correo y dentro del PDF, que Gmail indexa);
//  · la tercera consulta era una pesca de arrastre: «cualquier PDF de un correo
//    que mencione una palabra del proveedor en ±60 días». Por ahí entraba todo
//    el ruido. Se retira.
export const importeGmail=(total)=>{
  const t=Number(total);
  if(!Number.isFinite(t)||t<=0)return [];
  // A mano y no con toLocaleString: el navegador y el banco de pruebas no dan
  // lo mismo, y la forma «3.350,01» —la que sale impresa en la factura— es
  // justo la más certera al buscarla en Gmail.
  const fijo=t.toFixed(2);                       // 3350.01
  const [ent,dec]=fijo.split('.');
  const miles=ent.replace(/\B(?=(\d{3})+(?!\d))/g,'.');
  return [...new Set([`${miles},${dec}`, `${ent},${dec}`, fijo])];   // 3.350,01 · 3350,01 · 3350.01
};
export const consultasGmail=(inv,ventanaDias=60)=>{
  const num=numeroLimpio(inv.numFactura);
  const clave=palabraClave(inv.proveedor);
  const desde=fechaMas(inv.fecha,-ventanaDias),hasta=fechaMas(inv.fecha,ventanaDias);
  const fechas=(desde&&hasta)?` after:${desde} before:${hasta}`:'';
  const imps=importeGmail(inv.total);
  const out=[];
  // v387 · un número de factura CORTO («1», «2», «842») trae cualquier cosa:
  // buscarlo suelto es lo que llenaba de ruido a AGUSTIN JIMENEZ (13 candidatos
  // por un «2»). Con menos de cuatro dígitos solo se usa acompañado del
  // proveedor, y el peso lo lleva el importe.
  const numFiable=(numeroDigitos(inv.numFactura)||'').length>=4;
  // de más certera a menos: número+proveedor, importe+proveedor, número, importe
  if(num&&clave)out.push(`has:attachment "${num}" "${clave}"${fechas}`);
  for(const im of imps){ if(clave)out.push(`has:attachment "${im}" "${clave}"${fechas}`); }
  if(num&&numFiable)out.push(`has:attachment "${num}"${fechas}`);
  for(const im of imps)out.push(`has:attachment "${im}"${fechas}`);
  return out;
};

// Cabecera de un mensaje Gmail (format=full/metadata)
export const cabecera=(msg,nombre)=>{
  const hs=(((msg||{}).payload||{}).headers)||[];
  const h=hs.find(x=>String(x.name||'').toLowerCase()===String(nombre).toLowerCase());
  return h?String(h.value||''):'';
};

// Adjuntos del mensaje (recorre parts anidadas). Solo documentos.
export const adjuntosDe=(msg)=>{
  const out=[];
  const anda=(p)=>{
    if(!p)return;
    const fn=String(p.filename||'');
    const mime=String(p.mimeType||'');
    const body=p.body||{};
    if(fn&&body.attachmentId&&(DOC_MIME.test(mime)||DOC_EXT.test(fn))&&(+body.size||0)>0){
      out.push({filename:fn,mimeType:mime,attachmentId:String(body.attachmentId),size:+body.size||0});
    }
    (p.parts||[]).forEach(anda);
  };
  anda((msg||{}).payload);
  return out;
};

// Puntuación de un adjunto como documento de ESA factura
export const puntuar=(adj,inv,ctx)=>{
  const num=numeroLimpio(inv.numFactura).toLowerCase();
  const dig=numeroDigitos(inv.numFactura);
  const clave=palabraClave(inv.proveedor).toLowerCase();
  const fn=String(adj.filename||'').toLowerCase();
  const asunto=String((ctx&&ctx.asunto)||'').toLowerCase();
  const de=String((ctx&&ctx.de)||'').toLowerCase();
  const cuerpo=String((ctx&&ctx.cuerpo)||'').toLowerCase();
  let s=0;const por=[];
  if(num&&fn.includes(num)){s+=3;por.push('número en el nombre del fichero');}
  else if(dig&&fn.includes(dig)){s+=2;por.push('dígitos del número en el fichero');}
  if(num&&asunto.includes(num)){s+=2;por.push('número en el asunto');}
  else if(dig&&asunto.includes(dig)){s+=1;por.push('dígitos del número en el asunto');}
  if(clave&&(de.includes(clave)||fn.includes(clave)||asunto.includes(clave))){s+=1;por.push('proveedor en remitente/asunto/fichero');}
  // v383 · el importe: la señal que Jesús encontró a mano. Si aparece en el
  // asunto o en el nombre del fichero, es casi seguro esa factura.
  for(const im of importeGmail(inv.total)){
    const i2=im.toLowerCase();
    if(asunto.includes(i2)||fn.includes(i2)){s+=3;por.push('importe exacto ('+im+' €)');break;}
    if(cuerpo.includes(i2)){s+=2;por.push('importe exacto en el correo ('+im+' €)');break;}
  }
  if(/\.pdf$/i.test(fn)||/pdf/i.test(adj.mimeType||'')){s+=1;por.push('es PDF');}
  if(/^(image|scan|img|photo|foto)/i.test(fn)&&!num){s-=1;}
  // fecha del correo cerca de la de la factura (±20 días): sube y deja rastro
  const dc=new Date(String((ctx&&ctx.fecha)||''));const df=new Date(String(inv.fecha||'').slice(0,10)+'T12:00:00');
  if(!isNaN(dc)&&!isNaN(df)&&Math.abs(dc-df)<=20*86400000){s+=1;por.push('fecha cercana');}
  return {puntos:s,por};
};

// ¿Coincidencia REAL con esta factura? Jesús (03-09-2026): «que proponga
// únicamente los que tengan cierto grado de coincidencia con el proveedor y
// el número». Cuenta: el número en el fichero o en el asunto, o el
// proveedor junto con una fecha cercana. «Es PDF» solo no es nada.
export const coincideDeVerdad=(c)=>{
  const por=(c&&c.por)||[];
  const numero=por.some(r=>/número|dígitos/.test(r));
  const importe=por.some(r=>/^importe exacto/.test(r));
  const prov=por.some(r=>/^proveedor/.test(r));
  const fecha=por.includes('fecha cercana');
  // v383 · «que no ofrezca facturas que no sean suyas». Hace falta una señal
  // FUERTE —el número o el importe exacto— y además que el proveedor cuadre.
  // Antes bastaba «proveedor + fecha cercana», y eso es cualquier correo suyo
  // de ese mes: de ahí salían las propuestas con otro importe.
  if(!(numero||importe))return false;
  return prov||numero;
};

// Decisión: solo se engancha sin preguntar con UN candidato claro.
// «Claro» = lleva el número (≥3 puntos) y saca ≥2 puntos al siguiente.
export const decidir=(candidatos)=>{
  const cs=[...(candidatos||[])].filter(coincideDeVerdad).sort((a,b)=>b.puntos-a.puntos);
  if(!cs.length)return {nada:true};
  const [a,b]=cs;
  // Solo se engancha SOLO si lleva el número de factura y saca ventaja clara
  const conNumero=(a.por||[]).some(r=>/número|dígitos/.test(r));
  if(conNumero&&a.puntos>=3&&(!b||a.puntos-b.puntos>=2))return {auto:a};
  return {elegir:cs.slice(0,4)};
};

// Gmail devuelve los bytes del adjunto en base64url
export const b64urlABytes=(s)=>{
  let t=String(s||'').replace(/-/g,'+').replace(/_/g,'/');
  while(t.length%4)t+='=';
  if(typeof atob!=='function')throw new Error('sin decodificador base64');
  const bin=atob(t);
  const out=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);
  return out;
};

// ¿A qué facturas del periodo les falta documento (sin enlace, enlace en
// esquema desconocido o no confirmado en la nube)?
export const faltanDocumento=(recP,esquemaEnlace)=>recP.filter(i=>{
  if(!i.adjPath)return true;
  if(esquemaEnlace&&!esquemaEnlace(i.adjPath).ok)return true;
  if(i.adjNube===false)return true;
  return false;
});

// ═══ v385 · LO QUE ENGANCHAS A MANO NO SE PIERDE ═════════════════════════
// Jesús (09-09-2026): «selecciono, voy a usar, y aparece una ventana verde
// como que se ha enganchado, pero continúa ofreciéndose como si no lo hubiera
// hecho».
// Causa: la búsqueda va escribiendo los resultados según avanza y cada vez
// reescribe la lista ENTERA con su copia interna. El enganche a mano se
// guardaba en pantalla y la siguiente escritura de la búsqueda lo machacaba.
// Con cientos de facturas la búsqueda dura minutos, así que siempre pasaba.
// Esto funde las dos listas: lo ya adjuntado manda sobre lo que traiga la
// búsqueda.
export const fundirResultados=(previos,nuevos)=>{
  const nuevo=new Map();
  for(const r of (nuevos||[])) if(r&&r.inv&&r.inv.id) nuevo.set(String(r.inv.id),r);
  const usados=new Set();
  // v387 · el orden lo marca lo que ya estaba: al buscar POR TANDAS, las
  // primeras no deben saltar al final de la lista cada vez que llega otra.
  // Una fila sin factura no se puede ni pintar (la ventana lee r.inv.proveedor):
  // se descarta aquí en vez de reventar al mostrarla.
  const fundidos=(previos||[]).filter(p=>p&&p.inv&&p.inv.id).map(p=>{
    const id=String(p.inv.id);usados.add(id);
    if(p.estado==='adjuntada')return p;       // lo enganchado manda siempre
    return nuevo.get(id)||p;
  });
  for(const r of (nuevos||[])) if(r&&r.inv&&r.inv.id&&!usados.has(String(r.inv.id))) fundidos.push(r);
  return fundidos;
};

// ═══ v387 · BUSCAR CON OTRO CONCEPTO ═════════════════════════════════════
// Jesús (09-09-2026): «si no hay email vinculado, o rebusca con otro concepto
// (previo click nuestro), o que nos permita quitarlo».
// A veces el correo existe pero no lleva ni el número ni el importe: lo manda
// una gestoría, va dentro de un «Fwd:», o el asunto habla de la obra. Con una
// palabra suya («MOZAMBIQUE», «certificación», el nombre de quien lo envía) se
// encuentra enseguida. Sigue exigiendo adjunto, pero SIN la horquilla de
// fechas: si se busca a mano es porque lo de siempre no valió.
export const consultaLibre=(texto)=>{
  const t=String(texto||'').trim().replace(/["]/g,' ').replace(/\s+/g,' ');
  if(t.length<2)return '';
  return `has:attachment "${t}"`;
};
// Quitar una factura de la lista: se va de los resultados Y de las pendientes,
// para que no vuelva a salir en la siguiente tanda.
export const quitarDeLista=(resultados,faltan,invId)=>{
  const id=String(invId);
  return {
    resultados:(resultados||[]).filter(r=>!(r&&r.inv&&String(r.inv.id)===id)),
    faltan:(faltan||[]).filter(i=>!(i&&String(i.id)===id)),
  };
};

// ═══ v388 · DESCARTAR UN CANDIDATO SUELTO ════════════════════════════════
// Jesús (10-09-2026): «¿y quitar candidatos con una pequeña X y que salgan
// más? Aparte del quitar la factura directamente».
// La ventana enseña 4 de los encontrados; al descartar uno debe entrar el
// siguiente. Se quita SOLO de esa factura: el mismo correo puede ser bueno
// para otra.
export const claveCandidato=(c)=>String((c&&c.msgId)||'')+'|'+String((c&&c.attachmentId)||(c&&c.filename)||'');
export const quitarCandidato=(resultados,invId,clave)=>(resultados||[]).map(r=>{
  if(!(r&&r.inv&&String(r.inv.id)===String(invId)))return r;
  const quedan=(r.candidatos||[]).filter(c=>claveCandidato(c)!==String(clave));
  return quedan.length
    ? {...r,candidatos:quedan,motivo:`${quedan.length} candidato${quedan.length!==1?'s':''}, ninguno claro`}
    : {...r,candidatos:[],estado:'no encontrada',motivo:'descartaste todos los que había'};
});
