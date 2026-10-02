// ═══ EXTRAS DE CONTRATO · partidas, respaldo por escrito, precios ═══
import {parseNum} from './basicos';
import {normProvNombre} from './fichaje';
import {esAnulada} from './saldos';
// ═══ GASTOS ADICIONALES NO PREVISTOS ═══
// Lo que se gasta en una obra y NO entra en el precio cerrado del contrato:
// hay que negociarlo con el promotor. Con precio cerrado (art. 1593 CC) solo
// se puede cobrar de más si hubo un cambio que aumentó la obra Y el promotor
// lo autorizó, expresa o tácitamente. Por eso aquí no basta con sumar
// facturas: lo que hace cobrable un extra es tener anotado QUIÉN lo pidió,
// CUÁNDO y con qué prueba. Un extra bien documentado se cobra; uno que solo
// tiene facturas acaba en discusión.
const ESTADOS_EXTRA={
  detectado:{n:'Detectado',ic:'🔍',c:'mt', ayuda:'Todavía no se lo has planteado al promotor'},
  presentado:{n:'Presentado',ic:'📨',c:'in', ayuda:'Se lo has pasado y esperas respuesta'},
  aprobado:{n:'Aprobado',ic:'✅',c:'sc', ayuda:'Lo ha aceptado: ya se puede facturar'},
  rechazado:{n:'Rechazado',ic:'❌',c:'dn', ayuda:'No lo acepta: lo asumes tú o se reclama'},
  facturado:{n:'Facturado',ic:'💰',c:'vt', ayuda:'Ya se lo has facturado'},
};

const PRUEBAS_EXTRA={
  escrito:'Firmado o por escrito', correo:'Por correo electrónico',
  whatsapp:'Por WhatsApp o mensaje', acta:'En acta de obra',
  verbal:'De palabra', ninguna:'Sin nada por escrito',
};

const extrasDeContrato=(c)=>(Array.isArray(c&&c.extras)?c.extras:[]).filter(x=>x&&typeof x==='object');

// Las facturas que se han imputado a un extra concreto
const facturasDeExtra=(extra,invoices)=>{
  const ids=new Set((Array.isArray(extra&&extra.facturas)?extra.facturas:[]).map(String));
  return (Array.isArray(invoices)?invoices:[])
    .filter(f=>f&&ids.has(String(f.id))&&!esAnulada(f));
};

// Lo que de esta factura cuenta como extra: el importe anotado a mano si lo
// hay, o la factura entera. Una factura puede ir partida entre lo previsto en
// el contrato y lo que no lo estaba.
const parteExtra=(extra,f)=>{
  const p=extra&&extra.partes&&extra.partes[String(f&&f.id)];
  if(p==null||p==='')return baseFactura(f);
  // parseNum devuelve 0 con texto sin sentido, así que hay que mirar si de
  // verdad hay alguna cifra: si no la hay, cuenta la factura entera. Un «0»
  // escrito a propósito sí vale cero.
  if(!/\d/.test(String(p)))return baseFactura(f);
  const n=parseNum(p);
  return Number.isFinite(n)?+n.toFixed(2):baseFactura(f);
};

const estaPartida=(extra,f)=>{
  const p=extra&&extra.partes&&extra.partes[String(f&&f.id)];
  return !(p==null||p==='')&&Math.abs(parseNum(p)-baseFactura(f))>0.005;
};

const costeExtra=(extra,invoices)=>
  +facturasDeExtra(extra,invoices).reduce((s,f)=>s+parteExtra(extra,f),0).toFixed(2);

// Lo que se le pediría al promotor: el coste más el margen que decida
const precioExtra=(extra,invoices)=>{
  const c=costeExtra(extra,invoices);
  if(extra&&extra.precioFijo!=='' &&extra&&extra.precioFijo!=null&&!Number.isNaN(parseNum(extra.precioFijo)))
    return +parseNum(extra.precioFijo).toFixed(2);
  const m=parseNum(extra&&extra.margen)||0;
  return +(c*(1+m/100)).toFixed(2);
};

// Agrupado por proveedor, que es como él quiere verlo
const extraPorProveedor=(extra,invoices)=>{
  const g={};
  facturasDeExtra(extra,invoices).forEach(f=>{
    const k=String(f.proveedor||'(sin proveedor)');
    g[k]=g[k]||{proveedor:k,facturas:[],total:0};
    g[k].facturas.push(f);
    g[k].total=+(g[k].total+parteExtra(extra,f)).toFixed(2);
  });
  return Object.values(g).sort((a,b)=>b.total-a.total);
};

const resumenExtras=(c,invoices)=>{
  const ex=extrasDeContrato(c);
  const r={n:ex.length,coste:0,precio:0,porEstado:{},sinRespaldo:0,pendientes:0};
  ex.forEach(x=>{
    const co=costeExtra(x,invoices), pr=precioExtra(x,invoices);
    r.coste+=co; r.precio+=pr;
    const e=String(x.estado||'detectado');
    r.porEstado[e]=(r.porEstado[e]||0)+1;
    // Lo que más duele: gastado, no rechazado, y sin nada que lo respalde
    if(e!=='rechazado'&&(!x.prueba||x.prueba==='ninguna'||x.prueba==='verbal')&&co>0)r.sinRespaldo+=co;
    if(e==='detectado'||e==='presentado')r.pendientes+=pr;
  });
  r.coste=+r.coste.toFixed(2); r.precio=+r.precio.toFixed(2);
  r.sinRespaldo=+r.sinRespaldo.toFixed(2); r.pendientes=+r.pendientes.toFixed(2);
  return r;
};

// A qué extra está imputada una factura, si lo está
// Marcadas al registrarlas pero todavía sin asignar a un gasto concreto
// Se miran TODOS los contratos, no solo este: una factura que ya es extra de
// un contrato no puede serlo de otro, o el mismo gasto se cobraría dos veces.
// «Carranque 2 fase» en el contrato y «OBRA CARRANQUE» en la factura son la
// misma obra. Exigir que fueran idénticas dejaba la lista vacía y parecía que
// no había facturas.
// El importe de una factura NO está en «base»: está en importeBase, y puede
// llevar bases añadidas con otro tipo de IVA. Leyendo el campo equivocado
// salía 0,00 € en una factura de 13.296 €.
const baseFactura=(f)=>{
  if(!f||typeof f!=='object')return 0;
  let t=parseNum(f.importeBase)||0;
  (Array.isArray(f.basesExtra)?f.basesExtra:[]).forEach(x=>{ t+=parseNum(x&&x.base)||0; });
  // Un abono resta, no suma
  return +(f.esAbono?-Math.abs(t):t).toFixed(2);
};

const mismaObra=(a,b)=>{
  const x=normProvNombre(a), y=normProvNombre(b);
  if(!x||!y)return false;
  if(x===y||x.includes(y)||y.includes(x))return true;
  const cortas=new Set(['OBRA','FASE','CALLE','VIVIENDAS','VIV','PROMOCION','EDIFICIO']);
  const t=(s)=>s.split(/\s+/).filter(w=>w.length>=5&&!cortas.has(w));
  const A=t(x), B=t(y);
  return A.some(w=>B.includes(w));
};

const facturasYaExtra=(contratos)=>{
  const s=new Set();
  (Array.isArray(contratos)?contratos:[]).forEach(c=>
    extrasDeContrato(c).forEach(x=>(x.facturas||[]).forEach(f=>s.add(String(f)))));
  return s;
};

// Lo que se puede meter en un gasto de este contrato: primero las marcadas al
// registrarlas, luego el resto de las de esa obra. Nunca las que ya son extra
// de otro contrato.
const candidatasExtra=(contrato,invoices,contratos)=>{
  const cogidas=facturasYaExtra(contratos&&contratos.length?contratos:[contrato]);
  const l=(Array.isArray(invoices)?invoices:[]).filter(f=>f&&!esAnulada(f)&&f.tipo!=='emitida'
    &&!cogidas.has(String(f.id)));
  return {
    marcadas:l.filter(f=>f.extraPend),
    deObra:l.filter(f=>!f.extraPend&&mismaObra(f.obra,contrato&&contrato.obra)),
  };
};

const extrasSinAsignar=(contrato,invoices,contratos)=>{
  const puestas=facturasYaExtra(contratos&&contratos.length?contratos:[contrato]);
  return (Array.isArray(invoices)?invoices:[]).filter(f=>f&&f.extraPend&&!esAnulada(f)
    &&f.tipo!=='emitida'&&!puestas.has(String(f.id)));
};

// ═══ GASTO CORRIENTE DEL CONTRATO ═══
// Lo que se gasta en esa obra y SÍ estaba previsto en el precio cerrado: todo
// lo de la obra menos lo que se haya llevado a un extra. Una factura partida
// sale en las dos listas, cada una con su parte.
const parteYaExtra=(f,contratos)=>{
  let t=0;
  (Array.isArray(contratos)?contratos:[]).forEach(c=>
    extrasDeContrato(c).forEach(x=>{
      if((x.facturas||[]).map(String).includes(String(f&&f.id))) t+=parteExtra(x,f);
    }));
  return +t.toFixed(2);
};

// El total por proveedor de TODO el contrato, no de un gasto suelto
const proveedoresDeExtras=(contrato,invoices)=>{
  const g={};
  extrasDeContrato(contrato).forEach(x=>{
    facturasDeExtra(x,invoices).forEach(f=>{
      const k=String(f.proveedor||'(sin proveedor)');
      g[k]=g[k]||{proveedor:k,total:0,facturas:[]};
      g[k].total=+(g[k].total+parteExtra(x,f)).toFixed(2);
      // Cada factura lleva de qué gasto es y cómo va, que es la observación útil
      g[k].facturas.push({...f,_gasto:x.concepto||'(sin concepto)',_estado:x.estado||'detectado',
        _prueba:x.prueba||'', _extraId:x.id});
    });
  });
  return Object.values(g).sort((a,b)=>b.total-a.total);
};

const extraDeFactura=(facturaId,contratos)=>{
  for(const c of (Array.isArray(contratos)?contratos:[])){
    for(const x of extrasDeContrato(c)){
      if((x.facturas||[]).map(String).includes(String(facturaId)))return {contrato:c,extra:x};
    }
  }
  return null;
};
export {ESTADOS_EXTRA,PRUEBAS_EXTRA,extrasDeContrato,facturasDeExtra,parteExtra,estaPartida,costeExtra,precioExtra,extraPorProveedor,resumenExtras,baseFactura,mismaObra,facturasYaExtra,candidatasExtra,extrasSinAsignar,parteYaExtra,proveedoresDeExtras,extraDeFactura};
