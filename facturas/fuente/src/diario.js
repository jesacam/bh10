// ═══ DIARIO PERMANENTE DE PAGOS Y REMESAS (v359) ══════════════════════════
// Jesús (03-09-2026): «¿no debería haber registro de eso?». No lo había: el
// «deshacer» vivía en memoria y un pago borrado no dejaba ni una nota.
//
// El diario NO depende de que cada pantalla se acuerde de escribirlo: se
// alimenta comparando los pagos de las facturas ANTES y DESPUÉS de cada
// cambio (el mismo sitio donde la app guarda las facturas). Así caza el
// pago apuntado por una remesa, el borrado a mano, el deshacer, la
// importación… todo. Cada pantalla solo pone el «origen» del cambio.
//
// Solo se añade; nunca se borra. Tope de entradas para que no crezca sin
// fin (las más antiguas se van, las últimas se quedan).

export const TOPE_DIARIO=6000;
const r2=(n)=>Math.round((+n||0)*100)/100;
const claveDe=(p)=>[p.id||'',p.fecha||'',r2(p.importe).toFixed(2),p.metodo||'',p.referencia||''].join('|');

// mapa id-factura → {firmas:Set de pagos, cab:{proveedor,numFactura,fecha,total}}
export const fotoPagos=(invoices)=>{
  const m=new Map();
  for(const i of (invoices||[])){
    if(!i||!i.id)continue;
    const firmas=new Map();
    for(const p of (i.pagos||[])){if(p&&typeof p==='object')firmas.set(claveDe(p),p);}
    m.set(i.id,{firmas,cab:{proveedor:i.proveedor||'',numFactura:i.numFactura||'',fecha:i.fecha||'',total:r2(i.total)}});
  }
  return m;
};

// Diferencias de pagos entre dos fotos → entradas del diario
export const diffPagos=(antes,ahora,origen,ahoraISO)=>{
  const t=ahoraISO||new Date().toISOString();
  const out=[];
  for(const [id,d] of ahora){
    const a=antes.get(id);
    for(const [k,p] of d.firmas){
      if(!a||!a.firmas.has(k))out.push({t,tipo:'pago+',factura:id,cab:d.cab,pago:{fecha:p.fecha||'',importe:r2(p.importe),metodo:p.metodo||'',referencia:p.referencia||''},origen:origen||'edición'});
    }
    if(a)for(const [k,p] of a.firmas){
      if(!d.firmas.has(k))out.push({t,tipo:'pago-',factura:id,cab:d.cab,pago:{fecha:p.fecha||'',importe:r2(p.importe),metodo:p.metodo||'',referencia:p.referencia||''},origen:origen||'edición'});
    }
  }
  for(const [id,a] of antes){
    if(ahora.has(id))continue;
    for(const [,p] of a.firmas)out.push({t,tipo:'pago-',factura:id,cab:a.cab,pago:{fecha:p.fecha||'',importe:r2(p.importe),metodo:p.metodo||'',referencia:p.referencia||''},origen:(origen||'edición')+' (factura eliminada)'});
  }
  return out;
};

// Entradas de remesa (las escribe la pantalla de remesas: no salen de un diff)
export const entradaRemesa=(tipo,r,detalle,ahoraISO)=>({t:ahoraISO||new Date().toISOString(),tipo,remesa:String(r&&r.msgId||''),cab:{fecha:r&&r.fecha||'',nbTxs:r&&r.nbTxs||0,total:r2(r&&r.total)},detalle:detalle||'',origen:'remesas'});

// ── v368 · diario para TODO (contratos, clientes, empleados, obras, viviendas) ──
// Jesús (06-09-2026): «quién cambió qué». Misma idea que los pagos: foto de la
// lista antes y después del guardado; se anota alta, baja o cambio con los
// campos tocados. No guarda los valores (basta el diff del propio documento).
const nombreDe=(e,coleccion)=>String(e.nombre||e.numero||e.alias||e.identificador||e.numFactura||e.proveedor||e.id||'').slice(0,80);
export const fotoEntidades=(lista)=>{
  const m=new Map();
  for(const e of (lista||[])){if(!e||typeof e!=='object')continue;const id=String(e.id||e.numero||e.nombre||'');if(!id)continue;m.set(id,{nombre:nombreDe(e),firma:JSON.stringify(e),obj:e});}
  return m;
};
const camposDistintos=(a,b)=>{const ks=new Set([...Object.keys(a||{}),...Object.keys(b||{})]);const out=[];for(const k of ks){if(k.startsWith('_'))continue;if(JSON.stringify(a[k])!==JSON.stringify(b[k]))out.push(k);}return out;};
export const diffEntidades=(antes,ahora,coleccion,origen,ahoraISO)=>{
  const t=ahoraISO||new Date().toISOString();const out=[];
  for(const [id,d] of ahora){
    const a=antes.get(id);
    if(!a)out.push({t,tipo:'ent+',coleccion,id,nombre:d.nombre,campos:[],origen:origen||'edición'});
    else if(a.firma!==d.firma){const c=camposDistintos(a.obj,d.obj);if(c.length&&!(coleccion==='facturas'&&c.length===1&&c[0]==='pagos'))out.push({t,tipo:'ent~',coleccion,id,nombre:d.nombre,campos:c.slice(0,12),origen:origen||'edición'});}
  }
  for(const [id,a] of antes){if(!ahora.has(id))out.push({t,tipo:'ent-',coleccion,id,nombre:a.nombre,campos:[],origen:origen||'edición'});}
  return out;
};
export const deColeccion=(diario,coleccion)=>(diario||[]).filter(e=>e.coleccion===coleccion);

export const anotar=(diario,entradas,tope=TOPE_DIARIO)=>{
  if(!entradas||!entradas.length)return diario||[];
  const l=[...(diario||[]),...entradas];
  return l.length>tope?l.slice(l.length-tope):l;
};

export const deFactura=(diario,id)=>(diario||[]).filter(e=>e.factura===id);
export const deRemesa=(diario,msgId)=>(diario||[]).filter(e=>e.remesa===msgId||(e.pago&&e.pago.referencia===msgId));

const cel=(v)=>{const s=String(v==null?'':v);return /[;"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
export const csvDiario=(diario)=>{
  const filas=['cuando;tipo;origen;proveedor;numFactura;fecha_factura;total_factura;fecha_pago;importe;metodo;referencia;remesa;detalle'];
  for(const e of (diario||[])){
    filas.push([e.t,e.tipo,e.origen,e.coleccion?e.coleccion+': '+(e.nombre||'')+(e.campos&&e.campos.length?' ['+e.campos.join(' ')+']':''):(e.cab&&e.cab.proveedor),e.cab&&e.cab.numFactura,e.cab&&e.cab.fecha,e.cab&&e.cab.total!=null?String(e.cab.total).replace('.',','):'',
      e.pago&&e.pago.fecha,e.pago?String(e.pago.importe).replace('.',','):(e.cab&&e.cab.total!=null&&e.remesa?String(e.cab.total).replace('.',','):''),e.pago&&e.pago.metodo,e.pago&&e.pago.referencia,e.remesa||'',e.detalle||''].map(cel).join(';'));
  }
  return filas.join('\r\n');
};

// Texto corto de una entrada, para la ficha y la casilla de Ajustes
export const lineaDiario=(e)=>{
  const cuando=String(e.t||'').slice(0,16).replace('T',' ');
  if(e.tipo==='pago+')return `${cuando} · pago apuntado ${e.pago.importe.toFixed(2)} € (${e.pago.metodo||'—'}${e.pago.referencia?' · '+e.pago.referencia:''}) · ${e.origen}`;
  if(e.tipo==='pago-')return `${cuando} · pago QUITADO ${e.pago.importe.toFixed(2)} € (${e.pago.metodo||'—'}${e.pago.referencia?' · '+e.pago.referencia:''}) · ${e.origen}`;
  if(String(e.tipo).startsWith('remesa'))return `${cuando} · ${e.tipo} ${e.cab.fecha} · ${e.cab.nbTxs} transf · ${e.cab.total.toFixed(2)} €${e.detalle?' · '+e.detalle:''}`;
  if(e.tipo==='ent+')return `${cuando} · ${e.coleccion}: alta «${e.nombre}» · ${e.origen}`;
  if(e.tipo==='ent-')return `${cuando} · ${e.coleccion}: BAJA «${e.nombre}» · ${e.origen}`;
  if(e.tipo==='ent~')return `${cuando} · ${e.coleccion}: cambio en «${e.nombre}» (${(e.campos||[]).join(', ')}) · ${e.origen}`;
  return `${cuando} · ${e.tipo}`;
};
