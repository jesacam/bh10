// ═══ OBRAS · CENTRO DE COSTE (v361) ════════════════════════════════════════
// Jesús (04-09-2026): «imputar facturas en bloque a una obra», «importar yo
// las obras en un Excel y asignar las facturas en el mismo Excel», «meter en
// obras el número de viviendas y calcular cada una», «un fusionador de
// obras», «revisar los fusionadores: no siempre proponen fusiones claras».
//
// El dato real: 853 de 884 recibidas llevan obra escrita a mano o copiada
// del papel por el lector, con 118 valores distintos (la misma nave con
// tres nombres). Aquí vive lo que se puede probar sin pantalla.

const r2=(n)=>Math.round((+n||0)*100)/100;
const U=(s)=>String(s==null?'':s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();

// Palabras que no distinguen una obra de otra (tipo de vía, provincia,
// artículos…). Nunca sostienen una fusión por sí solas.
const GENERICAS_OBRA=new Set(['C','CL','CALLE','C/','AV','AVDA','AVENIDA','PZA','PLAZA','CTRA','CARRETERA','CAMINO','URB','URBANIZACION','POL','POLIGONO','NAVE','LOCAL','PISO','BAJO',
  'DE','DEL','LA','EL','LOS','LAS','Y','EN','A','TOLEDO','MADRID','ESPANA','ESPAÑA','OBRA','OBRAS','FASE','PARCELA','N','NUM','NO','S/N','SN']);
// Para proveedores/clientes: palabras de razón social que tampoco distinguen
const GENERICAS_RAZON=new Set(['SL','SA','SLU','SAU','SLL','SC','CB','SCP','SLP','COOP','SOCIEDAD','LIMITADA','ANONIMA','CONSTRUCCIONES','CONSTRUCCION','REFORMAS','SERVICIOS','SUMINISTROS','MATERIALES','INSTALACIONES',
  'HERMANOS','HNOS','GRUPO','TALLERES','TALLER','COMERCIAL','INDUSTRIAS','INDUSTRIAL','TECNICAS','TECNICA','GESTION','INMOBILIARIA','PROMOCIONES','ESTUDIO','EMPRESA','ESPANA','MADRID','TOLEDO','CENTRO','SUR','NORTE','ESTE','OESTE','DE','DEL','LA','EL','LOS','LAS','Y','E','AND','THE']);

// ── normalización de un valor de obra ────────────────────────────────────
// «C/ NEON, 7, 45200 ILLESCAS, Toledo» → tokens [NEON, 7, ILLESCAS] ; clave «NEON 7 ILLESCAS»
export const tokensObra=(s)=>U(s).replace(/[.,;:()\-\/]/g,' ').split(/\s+/).filter(t=>t&&!GENERICAS_OBRA.has(t)&&!/^\d{5}$/.test(t));
export const claveObra=(s)=>tokensObra(s).join(' ');
export const mismaObra=(a,b)=>{const ka=claveObra(a),kb=claveObra(b);return !!ka&&ka===kb;};

// ── valores de obra que hay hoy en las facturas ──────────────────────────
export const esFiscal=(i)=>!!i&&!['anticipo','cobro','personal','presupuesto'].includes(i.tipo)&&!i.anulada;
export const valoresObra=(invoices)=>{
  const m=new Map();
  for(const i of (invoices||[])){
    if(!esFiscal(i))continue;
    const v=String(i.obra||'').trim();if(!v)continue;
    const e=m.get(v)||{valor:v,n:0,total:0,base:0};
    e.n++;e.total=r2(e.total+(+i.total||0));e.base=r2(e.base+(+i.importeBase||0));m.set(v,e);
  }
  return [...m.values()].sort((a,b)=>b.n-a.n||a.valor.localeCompare(b.valor,'es'));
};

// ── sugerencias de fusión SEGURAS ─────────────────────────────────────────
// Regla de oro: dos nombres cuyos números difieren NUNCA son la misma
// (VALDEMORO 1 ≠ VALDEMORO 2; NEON 7 ≠ NEON 12). Después: misma clave
// normalizada (seguro), o un nombre contenido en otro con al menos una
// palabra distintiva (≥5 letras, no genérica) en común (probable).
const numerosDe=(tokens)=>tokens.filter(t=>/^\d+[A-Z]?$/.test(t)).sort().join(',');
export const sugerirFusionObras=(valores)=>{
  const vs=(valores||[]).map(v=>typeof v==='string'?{valor:v,n:0,total:0}:v);
  const grupos=[];const usado=new Set();
  for(let i=0;i<vs.length;i++){
    if(usado.has(vs[i].valor))continue;
    const ti=tokensObra(vs[i].valor);if(!ti.length)continue;
    const grupo={miembros:[vs[i]],motivo:''};
    for(let j=i+1;j<vs.length;j++){
      if(usado.has(vs[j].valor))continue;
      const tj=tokensObra(vs[j].valor);if(!tj.length)continue;
      if(numerosDe(ti)!==numerosDe(tj))continue;                       // números distintos → obras distintas
      let motivo='';
      if(ti.join(' ')===tj.join(' '))motivo='mismo nombre normalizado';
      else{
        const A=new Set(ti),B=new Set(tj);const chico=A.size<=B.size?A:B,grande=A.size<=B.size?B:A;
        const distintiva=[...chico].some(t=>t.length>=5&&/[A-Z]/.test(t));
        if(distintiva&&[...chico].every(t=>grande.has(t)))motivo='uno contiene al otro';
      }
      if(!motivo)continue;
      grupo.miembros.push(vs[j]);usado.add(vs[j].valor);grupo.motivo=grupo.motivo||motivo;
      if(motivo==='mismo nombre normalizado')grupo.motivo='mismo nombre normalizado';
    }
    if(grupo.miembros.length>1){usado.add(vs[i].valor);grupos.push(grupo);}
  }
  // destino propuesto: el valor más usado del grupo (y el más corto a igualdad)
  return grupos.map(g=>{const dest=[...g.miembros].sort((a,b)=>(b.n||0)-(a.n||0)||a.valor.length-b.valor.length)[0];
    return {destino:dest.valor,origenes:g.miembros.filter(m=>m.valor!==dest.valor).map(m=>m.valor),motivo:g.motivo,n:g.miembros.reduce((s,m)=>s+(m.n||0),0)};})
    .sort((a,b)=>b.n-a.n);
};

// ── sugerencias de fusión para proveedores/clientes (endurecidas) ─────────
// Jesús: «no siempre proponen fusiones claras». Ahora: CIF distinto en las
// fichas → nunca; números distintos → nunca; «contiene» solo con palabra
// distintiva no genérica; y «casi idénticos» solo con nombres largos.
// formas jurídicas con puntos («S.L.», «S. A. U.», «S.L.L.») → una sola ficha genérica antes de trocear
const sinFormaJuridica=(s)=>U(s).replace(/\bS\.?\s?L\.?\s?(L|U)?\.?(?=\s|$|[,;)])/g,' SL ').replace(/\bS\.?\s?A\.?\s?U?\.?(?=\s|$|[,;)])/g,' SA ').replace(/\bS\.?\s?C\.?\s?P?\.?(?=\s|$|[,;)])/g,' SC ').replace(/\bC\.?\s?B\.?(?=\s|$|[,;)])/g,' CB ');
const tokensRazon=(s)=>sinFormaJuridica(s).replace(/[.,;:()\-\/&]/g,' ').split(/\s+/).filter(t=>t&&!GENERICAS_RAZON.has(t));
const lev=(a,b)=>{const m=a.length,n=b.length;if(!m)return n;if(!n)return m;let p=Array.from({length:n+1},(_,k)=>k);for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c;}return p[n];};
export const motivoFusionRazon=(A,B,fichaA,fichaB)=>{
  const cifA=U((fichaA&&(fichaA.cif||fichaA.dni))||'').replace(/[^A-Z0-9]/g,''),cifB=U((fichaB&&(fichaB.cif||fichaB.dni))||'').replace(/[^A-Z0-9]/g,'');
  if(cifA&&cifB){if(cifA===cifB)return 'mismo CIF';return '';}                  // CIFs distintos: nunca
  const ta=tokensRazon(A),tb=tokensRazon(B);if(!ta.length||!tb.length)return '';
  if(numerosDe(ta)!==numerosDe(tb))return '';
  if(ta.join(' ')===tb.join(' '))return 'mismo nombre sin S.L./genéricas';
  const Sa=new Set(ta),Sb=new Set(tb);const chico=Sa.size<=Sb.size?Sa:Sb,grande=Sa.size<=Sb.size?Sb:Sa;
  if([...chico].every(t=>grande.has(t))&&[...chico].some(t=>t.length>=5))return 'uno contiene al otro';
  const a=ta.join(' '),b=tb.join(' ');
  if(a.length>=8&&b.length>=8&&lev(a,b)<=Math.max(1,Math.floor(Math.min(a.length,b.length)/10)))return 'errata de un carácter';
  return '';
};

// ── plantilla Excel de ida y vuelta ───────────────────────────────────────
// Hoja «Obras»: una fila por obra (Jesús añade las suyas). Hoja «Facturas»:
// una fila por factura con su id (la columna que hace posible la vuelta) y
// la columna «Obra» para rellenar; va precargada cuando la obra actual ya
// casa con una del catálogo o con un alias.
// El catálogo que ya existe en la app: {alias (nombre), calle, numero, cp,
// municipio, provincia, activa, presupuestoGasto, presupuestoVenta}. Aquí se
// le añaden «otros» (otros nombres con los que llega), «viviendas» y «cliente».
export const nombreObra=(o0)=>{
  const o=(o0&&typeof o0==='object')?o0:{};
  if(typeof o.alias==='string'&&o.alias.trim())return o.alias.trim();
  if(typeof o.nombre==='string'&&o.nombre.trim())return o.nombre.trim();
  const dir=[o.calle,o.numero].filter(Boolean).join(' ');
  const loc=[o.municipio,o.provincia?`(${o.provincia})`:''].filter(Boolean).join(' ');
  return [dir,loc].filter(Boolean).join(', ')||'';
};
const otrosDe=(o)=>Array.isArray(o&&o.otros)?o.otros:[];
export const nuevaObra=(nombre,extra)=>({id:'ob-'+Math.random().toString(36).slice(2,9),alias:nombre,calle:'',numero:'',cp:'',municipio:'',provincia:'',activa:true,presupuestoGasto:0,presupuestoVenta:0,cliente:'',viviendas:0,otros:[],...(extra||{})});
export const COLS_OBRAS=['Obra','Cliente','Viviendas','Estado','Alias (otros nombres, separados por ;)','Nº facturas hoy','Total hoy'];
export const COLS_FACTURAS=['id (no tocar)','Fecha','Proveedor','Nº factura','Total','Obra actual (tal como está)','Obra (RELLENAR con un nombre de la hoja Obras)','Categoría','Concepto'];
export const catalogoDesde=(obras,valores)=>{
  // catálogo + valores actuales que no casan con nada: para que salgan en la hoja y Jesús decida
  const cat=(obras||[]).map(o=>({...o,otros:otrosDe(o)}));
  const nombres=new Set(cat.flatMap(o=>[claveObra(nombreObra(o)),...o.otros.map(claveObra)]));
  const sueltos=(valores||[]).filter(v=>!nombres.has(claveObra(v.valor)));
  return {cat,sueltos};
};
export const obraDelCatalogo=(valor,obras)=>{
  const k=claveObra(valor);if(!k)return null;
  for(const o of (obras||[])){
    if(claveObra(nombreObra(o))===k)return o;
    if(otrosDe(o).some(a=>claveObra(a)===k))return o;
  }
  return null;
};
export const plantillaImputacion=(invoices,obras)=>{
  const valores=valoresObra(invoices);
  const {cat,sueltos}=catalogoDesde(obras,valores);
  const hojaObras=[COLS_OBRAS,
    ...cat.map(o=>{const vs=valores.filter(v=>obraDelCatalogo(v.valor,[o]));return [nombreObra(o),o.cliente||'',o.viviendas||'',o.activa===false?'cerrada':'activa',(o.otros||[]).join('; '),vs.reduce((s,v)=>s+v.n,0),r2(vs.reduce((s,v)=>s+v.total,0))];}),
    ...sueltos.map(v=>[v.valor,'','','','',v.n,v.total])];
  const hojaFacturas=[COLS_FACTURAS,
    ...(invoices||[]).filter(esFiscal).sort((a,b)=>String(a.fecha||'').localeCompare(String(b.fecha||''))).map(i=>{
      const o=obraDelCatalogo(i.obra,cat);
      return [i.id,i.fecha||'',i.proveedor||'',i.numFactura||'',r2(i.total),String(i.obra||''),o?nombreObra(o):'',i.categoria||'',String(i.concepto||'').slice(0,60)];
    })];
  return {hojaObras,hojaFacturas};
};

// ── lectura de la plantilla rellenada ─────────────────────────────────────
// Casa por id (nunca por nombre). Las obras se toman de la hoja «Obras»; un
// nombre en «Obra» que no esté ahí se devuelve como desconocido, no se aplica.
const celda=(f,k)=>f&&f[k]!=null?String(f[k]).trim():'';
export const leerImputacion=(hojaObras,hojaFacturas,invoices,obras)=>{
  const cab=(h)=>Array.isArray(h)&&h.length?h[0].map(x=>U(x)):[];
  const idx=(h,pista)=>cab(h).findIndex(x=>x.includes(U(pista)));
  const errores=[];
  const iO={nombre:idx(hojaObras,'OBRA'),cliente:idx(hojaObras,'CLIENTE'),viv:idx(hojaObras,'VIVIENDAS'),estado:idx(hojaObras,'ESTADO'),alias:idx(hojaObras,'ALIAS')};
  if(iO.nombre<0)errores.push('la hoja «Obras» no tiene la columna Obra');
  const obrasLeidas=[];
  (hojaObras||[]).slice(1).forEach(f=>{
    const nombre=celda(f,iO.nombre);if(!nombre)return;
    const viv=celda(f,iO.viv);const vn=viv?parseInt(viv.replace(/[^0-9]/g,''),10):0;
    obrasLeidas.push({nombre,cliente:celda(f,iO.cliente),viviendas:isNaN(vn)?0:vn,activa:!/cerrad|termin|inactiv|baja/i.test(celda(f,iO.estado)),otros:celda(f,iO.alias).split(';').map(x=>x.trim()).filter(Boolean)});
  });
  // catálogo resultante: existentes actualizadas por nombre + nuevas
  const catalogo=(obras||[]).map(o=>({...o}));
  const nuevas=[];const actualizadas=[];
  for(const o of obrasLeidas){
    const ex=catalogo.find(x=>claveObra(nombreObra(x))===claveObra(o.nombre)||otrosDe(x).some(a=>claveObra(a)===claveObra(o.nombre)));
    if(ex){const antes=JSON.stringify([ex.cliente,ex.viviendas,ex.activa,ex.otros]);Object.assign(ex,{cliente:o.cliente||ex.cliente||'',viviendas:o.viviendas||ex.viviendas||0,activa:o.activa,otros:[...new Set([...otrosDe(ex),...o.otros])]});if(antes!==JSON.stringify([ex.cliente,ex.viviendas,ex.activa,ex.otros]))actualizadas.push(nombreObra(ex));}
    else{const n=nuevaObra(o.nombre,{cliente:o.cliente,viviendas:o.viviendas,activa:o.activa,otros:o.otros});catalogo.push(n);nuevas.push(nombreObra(n));}
  }
  const iF={id:idx(hojaFacturas,'ID'),obra:cab(hojaFacturas).findIndex(x=>x.startsWith('OBRA (')||x.startsWith('OBRA(')||x==='OBRA')};
  if(iF.id<0||iF.obra<0)errores.push('la hoja «Facturas» no tiene las columnas id y Obra');
  const porId=new Map((invoices||[]).map(i=>[String(i.id),i]));
  const asignaciones=[];const desconocidas=new Map();let sinCambio=0,vacias=0,idsMal=0;
  (hojaFacturas||[]).slice(1).forEach(f=>{
    const id=celda(f,iF.id);if(!id)return;
    const inv=porId.get(id);if(!inv){idsMal++;return;}
    const nombre=celda(f,iF.obra);if(!nombre){vacias++;return;}
    const o=obraDelCatalogo(nombre,catalogo);
    if(!o){desconocidas.set(nombre,(desconocidas.get(nombre)||0)+1);return;}
    const nom=nombreObra(o);
    if(String(inv.obra||'').trim()===nom){sinCambio++;return;}
    asignaciones.push({id,antes:String(inv.obra||''),despues:nom,proveedor:inv.proveedor||'',numFactura:inv.numFactura||'',total:r2(inv.total)});
  });
  return {catalogo,nuevas,actualizadas,asignaciones,sinCambio,vacias,idsMal,desconocidas:[...desconocidas.entries()].map(([nombre,n])=>({nombre,n})),errores};
};

// ── lectura del Excel de Recibidas con una columna de obra (v362) ─────────
// Jesús saca el Excel normal de Recibidas, añade una columna con la calle
// de la promoción y lo importa. Cabeceras flexibles: la columna de obra es
// la que se llame Obra / Calle / Promoción / Obra nueva…; la fila casa por
// «id» si el Excel lo trae (desde v362 lo trae) y, si no, por empresa +
// nº de factura + total. Las filas de subtotal («▸ …») se saltan.
const CAB_OBRA=/^(OBRA|OBRA NUEVA|OBRA \(|CALLE|PROMOCION|PROMOCIÓN|CENTRO DE COSTE)/;
// importe desde una celda: número, o texto formateado de cualquier manera
// («34.485,00», «34,485.00», «$34,485.00€», «34485»)
export const numeroDeCelda=(v)=>{
  if(typeof v==='number')return v;
  let t=String(v==null?'':v).replace(/[^0-9,.\-]/g,'');if(!t)return NaN;
  const c=t.lastIndexOf(','),d=t.lastIndexOf('.');
  if(c>=0&&d>=0){const dec=Math.max(c,d);t=t.slice(0,dec).replace(/[.,]/g,'')+'.'+t.slice(dec+1);}
  else if(c>=0){const dec=t.length-c-1;t=(dec>0&&dec<=2)?t.slice(0,c).replace(/,/g,'')+'.'+t.slice(c+1):t.replace(/,/g,'');}
  else if(d>=0&&t.length-d-1!==2)t=t.replace(/\./g,'');
  return parseFloat(t);
};
export const leerExcelRecibidas=(hoja,invoices,obras)=>{
  const filas=(hoja||[]).filter(f=>Array.isArray(f)&&f.some(c=>String(c==null?'':c).trim()));
  if(!filas.length)return {errores:['hoja vacía']};
  // cabecera: la primera fila que tenga «Nº factura» y «Empresa»
  const iCab=filas.findIndex(f=>f.some(c=>/N[ºO°]?\s*FACTURA/i.test(String(c)))&&f.some(c=>/EMPRESA|PROVEEDOR/i.test(String(c))));
  if(iCab<0)return {errores:['no encuentro la fila de cabecera (Nº factura, Empresa…)']};
  const cab=filas[iCab].map(c=>U(String(c==null?'':c)).trim());
  const col=(re)=>cab.findIndex(c=>re.test(c));
  const iNum=col(/^N[ºO°]?\s*FACTURA/),iEmp=col(/^(EMPRESA|PROVEEDOR)/),iTot=col(/^TOTAL$/),iId=col(/^ID( \(|$)/);
  // la columna de obra: la ÚLTIMA cabecera que case (si Jesús añadió «Calle» además de «Obra», manda la suya)
  let iObra=-1;cab.forEach((c,k)=>{if(CAB_OBRA.test(c)&&!/OBRA ACTUAL/.test(c))iObra=k;});
  const iObraActual=col(/^OBRA ACTUAL/);
  if(iNum<0||iEmp<0)return {errores:['faltan las columnas Nº factura o Empresa']};
  if(iObra<0)return {errores:['no hay ninguna columna de obra (Obra, Calle, Promoción…)']};
  const fis=(invoices||[]).filter(esFiscal);
  const porId=new Map(fis.map(i=>[String(i.id),i]));
  const claveFila=(emp,num,tot)=>[U(emp).replace(/[^A-Z0-9]/g,'').slice(0,18),U(num).replace(/[^A-Z0-9]/g,''),r2(tot).toFixed(2)].join('|');
  const porClave=new Map();fis.forEach(i=>{const k=claveFila(i.proveedor,i.numFactura,i.total);porClave.set(k,[...(porClave.get(k)||[]),i]);});
  const asignaciones=[];const nombresNuevos=new Map();let sinCambio=0,vacias=0,noCasan=0,ambiguas=0,porIdN=0,porClaveN=0;
  const catalogo=(obras||[]).map(o=>({...o}));
  filas.slice(iCab+1).forEach(f=>{
    const c=(k)=>k>=0&&f[k]!=null?String(f[k]).trim():'';
    if(/^▸/.test(c(0))||/^▸/.test(c(iEmp)))return;                     // subtotal del export
    const nombre=c(iObra);
    let inv=null;
    if(iId>=0&&c(iId)){inv=porId.get(c(iId))||null;if(inv)porIdN++;}
    if(!inv){
      const cands=porClave.get(claveFila(c(iEmp),c(iNum),numeroDeCelda(iTot>=0?f[iTot]:'')))||[];
      if(cands.length===1){inv=cands[0];porClaveN++;}
      else if(cands.length>1){ambiguas++;return;}
    }
    if(!inv){if(nombre)noCasan++;return;}
    if(!nombre){vacias++;return;}
    if(iObraActual>=0&&!c(iObraActual)&&!nombre)return;
    // la obra: del catálogo (nombre u otros nombres) o nueva con ese texto
    let o=obraDelCatalogo(nombre,catalogo);
    if(!o){const ya=nombresNuevos.get(claveObra(nombre));if(ya)o=ya;else{o=nuevaObra(nombre);catalogo.push(o);nombresNuevos.set(claveObra(nombre),o);}}
    const dest=nombreObra(o);
    if(String(inv.obra||'').trim()===dest){sinCambio++;return;}
    asignaciones.push({id:inv.id,antes:String(inv.obra||''),despues:dest,proveedor:inv.proveedor||'',numFactura:inv.numFactura||'',total:r2(inv.total)});
  });
  return {catalogo,nuevas:[...nombresNuevos.values()].map(nombreObra),actualizadas:[],asignaciones,sinCambio,vacias,idsMal:noCasan,ambiguas,porIdN,porClaveN,desconocidas:[],errores:[]};
};

export const aplicarImputacion=(invoices,asignaciones)=>{
  const m=new Map((asignaciones||[]).map(a=>[String(a.id),a.despues]));
  return (invoices||[]).map(i=>m.has(String(i.id))?{...i,obra:m.get(String(i.id))}:i);
};

// ── fundir valores sueltos en una obra del catálogo ───────────────────────
export const fundirObras=(invoices,obras,origenes,destinoNombre)=>{
  const set=new Set((origenes||[]).map(x=>String(x).trim()));
  const inv2=(invoices||[]).map(i=>set.has(String(i.obra||'').trim())?{...i,obra:destinoNombre}:i);
  let cat=(obras||[]).map(o=>({...o,otros:[...otrosDe(o)]}));
  let dest=cat.find(o=>claveObra(nombreObra(o))===claveObra(destinoNombre)||otrosDe(o).some(a=>claveObra(a)===claveObra(destinoNombre)));
  if(!dest){dest=nuevaObra(destinoNombre);cat.push(dest);}
  for(const o of set)if(claveObra(o)!==claveObra(nombreObra(dest))&&!dest.otros.some(a=>claveObra(a)===claveObra(o)))dest.otros.push(o);
  return {invoices:inv2,obras:cat,cambiadas:(invoices||[]).filter(i=>set.has(String(i.obra||'').trim())).length};
};

// ── coste por obra y por vivienda ─────────────────────────────────────────
export const costePorObra=(invoices,obras,opts={})=>{
  const desde=opts.desde||'',hasta=opts.hasta||'9999';
  const filas=new Map();
  for(const i of (invoices||[])){
    if(!esFiscal(i))continue;
    const f=String(i.fecha||'');if(f<desde||f>hasta)continue;
    const o=obraDelCatalogo(i.obra,obras);const nombre=o?nombreObra(o):(String(i.obra||'').trim()||'(sin obra)');
    const e=filas.get(nombre)||{obra:nombre,enCatalogo:!!o,viviendas:o?(+o.viviendas||0):0,m2:o?(+o.m2||0):0,tipologia:o?(o.tipologia||''):'',n:0,base:0,iva:0,total:0,porCategoria:{},porProveedor:{}};
    e.n++;e.base=r2(e.base+(+i.importeBase||0));e.iva=r2(e.iva+(+i.iva||0));e.total=r2(e.total+(+i.total||0));
    const c=i.categoria||'(sin categoría)';e.porCategoria[c]=r2((e.porCategoria[c]||0)+(+i.total||0));
    const p=i.proveedor||'(sin proveedor)';e.porProveedor[p]=r2((e.porProveedor[p]||0)+(+i.total||0));
    filas.set(nombre,e);
  }
  return [...filas.values()].map(e=>({...e,porVivienda:e.viviendas>0?r2(e.total/e.viviendas):null,basePorVivienda:e.viviendas>0?r2(e.base/e.viviendas):null,porM2:e.m2>0?r2(e.total/e.m2):null})).sort((a,b)=>b.total-a.total);
};
const cel=(v)=>{const s=String(v==null?'':v);return /[;"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
const eur=(n)=>n==null?'':r2(n).toFixed(2).replace('.',',');
export const csvCostePorObra=(filas)=>['obra;en_catalogo;facturas;base;iva;total;viviendas;total_por_vivienda;base_por_vivienda;m2;total_por_m2;tipologia',
  ...(filas||[]).map(f=>[f.obra,f.enCatalogo?'sí':'no',f.n,eur(f.base),eur(f.iva),eur(f.total),f.viviendas||'',eur(f.porVivienda),eur(f.basePorVivienda),f.m2||'',eur(f.porM2),f.tipologia||''].map(cel).join(';'))].join('\r\n');
