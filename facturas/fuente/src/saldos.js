
// Payment helpers — an anticipo linked (aplicadoA) to this invoice counts as a payment
// Índice de anticipos por factura. Antes cada consulta recorría la cartera
// entera, y como getEstado llama a esto varias veces por fila, pintar un
// listado de 800 facturas suponía millones de comparaciones. Ahora el índice
// se construye una sola vez por cartera y se guarda en un WeakMap: si cambia
// la lista (identidad distinta) se recalcula solo, y si desaparece se libera
// sin fugas. Las llamadas de fuera no cambian.
const _idxAnticipos = new WeakMap();

const abonosDe=(inv,todas)=>{
  if(!inv||!inv.id)return [];
  return (Array.isArray(todas)?todas:[]).filter(x=>x&&x.esAbono&&x.abonoDe===inv.id&&!esAnulada(x));
};


const indiceAnticipos = (all) => {
  all=(Array.isArray(all)?all:[]).filter(x=>x&&typeof x==='object');
  let m = _idxAnticipos.get(all);
  if (m) return m;
  m = new Map();
  for (const a of all) {
    if (a && a.tipo==='anticipo' && a.aplicadoA) {
      const l = m.get(a.aplicadoA);
      if (l) l.push(a); else m.set(a.aplicadoA, [a]);
    }
  }
  _idxAnticipos.set(all, m);
  return m;
};

const SIN_ANTICIPOS = [];

const importeAbonado=(inv,todas)=>{
  const s=abonosDe(inv,todas).reduce((a,x)=>a+Math.abs(Number(x.total)||0),0);
  return Number.isFinite(s)?+s.toFixed(2):0;
};

// ═══ SALDOS · qué se debe, qué está pagado y qué estado tiene cada factura ═══
// Estas funciones son la única verdad sobre el dinero: el panel, la vista de
// pendientes, las remesas y los exports salen todos de aquí.
const getAnticiposAplicados = (inv, allInvoices) => {
  if (!inv || !Array.isArray(allInvoices)) return SIN_ANTICIPOS;
  return indiceAnticipos(allInvoices).get(inv.id) || SIN_ANTICIPOS;
};

const getTotalPagado = (inv, allInvoices) => {
  if(!inv||typeof inv!=='object')return 0;
  const pagos = (inv.pagos||[]).reduce((s,p)=>s+(p.importe||0),0);
  const anticipos = getAnticiposAplicados(inv, allInvoices).reduce((s,a)=>s+(a.total||0),0);
  return pagos + anticipos;
};

const esAnulada=(inv)=>!!(inv&&inv.anulada);

// ═══ QUÉ ES UN GASTO DEDUCIBLE ═══
// Había tres criterios distintos por la app y el paquete de la gestoría usaba
// el más estrecho (solo tipo 'factura'), así que se le quedaban fuera los
// gastos de estructura, los leasings y los rentings —IVA soportado real— y en
// cambio SÍ le mandaba las anuladas. Ahora hay una sola definición, la misma
// que usa la liquidación de IVA, para que lo que se declara y lo que se envía
// sean siempre lo mismo.
// Los abonos SÍ entran: llevan su importe en negativo y restan donde toca.
const esGastoFiscal=(i)=>!!i&&i.tipo!=='anticipo'&&i.tipo!=='cobro'
  &&i.tipo!=='personal'&&i.tipo!=='presupuesto'&&!esAnulada(i);

// Lo que se debe a proveedores: como el anterior, pero las nóminas sí cuentan
// porque también son dinero pendiente de salir.
const esDeudaProveedor=(i)=>!!i&&i.tipo!=='anticipo'&&i.tipo!=='cobro'
  &&i.tipo!=='presupuesto'&&!esAnulada(i);

// Cuando un proveedor deja sin efecto una factura te manda un abono (factura
// rectificativa) con los importes en negativo. Los dos documentos se quedan en
// el libro —el IVA soportado se compensa solo, porque uno resta— pero lo que
// dejas de deber hay que descontarlo del saldo de la factura original: si no,
// seguirías viendo un pendiente de pago que ya no existe, y peor, podría
// colarse en una remesa.
const esAbono=(inv)=>!!(inv&&inv.esAbono);

const getSaldo = (inv, all) => {
  if(!inv||esAnulada(inv))return 0;
  // Un abono no es algo que se pague: es lo que descuenta de su factura
  if(esAbono(inv))return 0;
  const t=Number(inv.total), pag=Number(getTotalPagado(inv, all))||0;
  const ret=(inv.tipo==='cobro'&&(Number(inv.retGarImp)||0)>0&&!inv.retGarDevuelta)?(Number(inv.retGarImp)||0):0;
  const ab=importeAbonado(inv, all);
  const s=(Number.isFinite(t)?t:0)-pag-ret-ab;
  return Number.isFinite(s)?+s.toFixed(2):0;
};

const getEstado = (inv, all) => {
  if(!inv||typeof inv!=='object')return 'pendiente';
  if(inv.tipo==='anticipo') return inv.aplicadoA ? 'aplicado' : 'anticipo_libre';
  // el pagado se calcula una vez y se reutiliza para el saldo
  const pagado = getTotalPagado(inv, all);
  const retenido = (inv.tipo==='cobro'&&(inv.retGarImp||0)>0&&!inv.retGarDevuelta)?inv.retGarImp:0;
  const saldo = +(inv.total - pagado - retenido).toFixed(2);
  if(saldo <= 0.01) return 'pagada';
  const vencida = inv.fechaVencimiento && new Date(inv.fechaVencimiento) < new Date();
  if(pagado > 0) return vencida ? 'parcial_vencida' : 'parcial';
  return vencida ? 'vencida' : 'pendiente';
};
export {abonosDe,indiceAnticipos,importeAbonado,getAnticiposAplicados,getTotalPagado,esAnulada,esGastoFiscal,esDeudaProveedor,esAbono,getSaldo,getEstado};
