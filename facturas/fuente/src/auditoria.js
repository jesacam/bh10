// ═══ AUDITORÍA DE REMESAS Y PAGOS (v359) ══════════════════════════════════
// Jesús (03/04-09-2026): «¿auditoría de los estados de cada factura?».
// Esto es el cruce que hicimos a mano con el extracto del banco, dentro de
// la app y repetible. Todo puro y comprobable; la pantalla solo lo pinta.
//
//  · remesasSinPagos      → remesas del histórico sin ningún pago que las
//                           referencie (la app las generó y no apuntó nada)
//  · facturasEnVariasRemesas → la misma factura en dos o más remesas
//  · pagosSinRastro       → pagos apuntados que NO se ven en un extracto
//                           N43, salvo los que por naturaleza no pasan por
//                           esa cuenta (efectivo, tarjeta, préstamo
//                           promotor, pago anticipado, confirming)
//  · pendientesConCargo   → facturas pendientes con un cargo en el extracto
//                           que las paga (proveedor + importe, o nº en el
//                           concepto)

const r2=(n)=>Math.round((+n||0)*100)/100;
const norm=(s)=>String(s==null?'':s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
const soloAlnum=(s)=>norm(s).replace(/[^A-Z0-9]/g,'');
const D=(s)=>{const d=new Date(String(s||'').slice(0,10)+'T12:00:00');return isNaN(d)?null:d;};
const dias=(a,b)=>{const x=D(a),y=D(b);return (x&&y)?Math.abs((x-y)/86400000):999;};

export const METODOS_FUERA_DE_CUENTA=/EFECTIVO|TARJETA|PROMOTOR|ANTICIPADO|CONFIRMING|CAIXA/i;

// Palabras «con peso» del nombre de un proveedor (sin S.L., de, la…)
export const palabrasProv=(prov)=>norm(prov).replace(/\b(S\.?L\.?U?|S\.?A\.?U?|SL|SA|SLU|SAU|CB|C\.B\.|SCP|SLP|DEL|DE|LA|LOS|LAS|Y|E)\b/g,' ').replace(/[^A-Z ]/g,' ').split(/\s+/).filter(p=>p.length>=4);
export const casaProveedor=(texto,prov)=>{const t=norm(texto);return palabrasProv(prov).some(p=>t.includes(p));};
export const numerosDelConcepto=(c)=>{const t=/FACT?\b/i.test(c)?String(c).split(/FACT?\b/i).pop():'';return (t.match(/[A-Z]?\d{2,}/gi)||[]).map(soloAlnum);};

const pagado=(i)=>(i.pagos||[]).reduce((s,p)=>s+(+p.importe||0),0);
export const esFiscal=(i)=>!!i&&!['anticipo','cobro','personal','presupuesto'].includes(i.tipo)&&!i.anulada;
const saldoDe=(i)=>r2((+i.total||0)-pagado(i));

const lineaCasaFactura=(t,i)=>{
  const np=soloAlnum(t.n).slice(0,12),ni=soloAlnum(i.proveedor).slice(0,12);
  if(!np||!ni||(np!==ni&&!casaProveedor(t.n,i.proveedor)))return false;
  const numc=soloAlnum(String(t.c||'').split(' - ')[0]);
  if(numc&&numc===soloAlnum(i.numFactura))return true;
  return Math.abs((+t.imp||0)-(+i.total||0))<0.01;
};

// solo remesas de proveedores: las de nóminas pagan a empleados, no facturas
export const remesasSinPagos=(remesas,invoices)=>(remesas||[]).filter(r=>r.tipo==='prov'&&(r.txns||[]).length&&!r.noEjecutada)
  .map(r=>{const conPago=(invoices||[]).filter(i=>(i.pagos||[]).some(p=>String(p.referencia)===String(r.msgId)));return {remesa:r,lineas:(r.txns||[]).length,conPago:conPago.length};})
  .filter(x=>x.conPago===0);

export const facturasEnVariasRemesas=(remesas,invoices)=>{
  const out=[];
  for(const i of (invoices||[])){
    if(!esFiscal(i))continue;
    const refs=new Set((i.pagos||[]).map(p=>String(p.referencia||'')).filter(r=>/^BIOH-/.test(r)));
    const enLineas=(remesas||[]).filter(r=>(r.tipo==='prov')&&(r.txns||[]).some(t=>lineaCasaFactura(t,i)));
    const conjunto=new Set([...refs,...enLineas.map(r=>String(r.msgId))]);
    if(conjunto.size>=2)out.push({factura:i,remesas:[...conjunto].map(m=>(remesas||[]).find(r=>String(r.msgId)===m)||{msgId:m}),saldo:saldoDe(i)});
  }
  return out;
};

// Evidencia de un pago en un extracto (movs: {fechaOp,cargo,importe,texto})
export const evidenciaDePago=(pago,factura,movs,remesas)=>{
  const imp=r2(pago.importe);const nf=soloAlnum(factura.numFactura);
  const ref=String(pago.referencia||'');
  if(/^BIOH-/.test(ref)){
    const r=(remesas||[]).find(x=>String(x.msgId)===ref);
    if(r){
      if(r.noEjecutada)return '';
      const tot=r2(r.total);
      const m=(movs||[]).find(m=>m.cargo&&Math.abs(r2(m.importe)-tot)<0.01&&dias(m.fechaOp,r.fechaEjec||r.fecha)<=3);
      if(m)return `remesa ${r.fecha} en el extracto (${m.fechaOp}, ${tot.toFixed(2)})`;
      // el banco puede haberla partido en dos días: suma de dos cargos REM consecutivos
      const rems=(movs||[]).filter(m=>m.cargo&&/REM/i.test(m.texto||'')&&dias(m.fechaOp,r.fechaEjec||r.fecha)<=3);
      for(let a=0;a<rems.length;a++)for(let b=a+1;b<rems.length;b++)if(Math.abs(r2(rems[a].importe+rems[b].importe)-tot)<0.01)return `remesa ${r.fecha} en dos cargos (${rems[a].importe.toFixed(2)} + ${rems[b].importe.toFixed(2)})`;
      return '';
    }
  }
  for(const m of (movs||[])){
    if(!m.cargo)continue;
    const mismo=Math.abs(r2(m.importe)-imp)<0.01;
    if(mismo&&(dias(m.fechaOp,pago.fecha)<=7||casaProveedor(m.texto,factura.proveedor)))return `${m.fechaOp} ${String(m.texto||'').slice(0,40)} ${r2(m.importe).toFixed(2)}`;
    if(nf&&casaProveedor(m.texto,factura.proveedor)&&numerosDelConcepto(m.texto).some(n=>n.length>=3&&(n===nf||(n.length>=4&&nf.endsWith(n)))))return `${m.fechaOp} ${String(m.texto||'').slice(0,50)} (nº en el concepto)`;
  }
  return '';
};

export const pagosSinRastro=(invoices,movs,remesas,opts={})=>{
  const fechas=(movs||[]).map(m=>m.fechaOp).filter(Boolean).sort();
  const desde=opts.desde||fechas[0]||'';const hasta=opts.hasta||fechas[fechas.length-1]||'9999';
  const out=[];
  for(const i of (invoices||[])){
    if(!esFiscal(i))continue;
    for(const p of (i.pagos||[])){
      const f=String(p.fecha||'');
      if(!f||f<desde||f>hasta)continue;
      if(METODOS_FUERA_DE_CUENTA.test(String(p.metodo||'')))continue;
      if(/importaci/i.test(String(p.metodo||'')))continue;
      const ref=String(p.referencia||'');
      const r=/^BIOH-/.test(ref)?(remesas||[]).find(x=>String(x.msgId)===ref):null;
      if(r&&r.noEjecutada){out.push({factura:i,pago:p,motivo:'referencia de una remesa marcada como no ejecutada'});continue;}
      const ev=evidenciaDePago(p,i,movs,remesas);
      if(!ev)out.push({factura:i,pago:p,motivo:r?`remesa ${r.fecha} no aparece en el extracto`:'sin cargo que case (importe, proveedor o nº)'});
    }
  }
  return out.sort((a,b)=>(+b.pago.importe||0)-(+a.pago.importe||0));
};

export const pendientesConCargo=(invoices,movs)=>{
  const out=[];
  for(const i of (invoices||[])){
    if(!esFiscal(i)||saldoDe(i)<=0.01)continue;
    const nf=soloAlnum(i.numFactura);
    for(const m of (movs||[])){
      if(!m.cargo||!casaProveedor(m.texto,i.proveedor))continue;
      if(D(m.fechaOp)&&D(i.fecha)&&D(m.fechaOp)<D(i.fecha))continue; // un cargo anterior a la factura no la paga
      const porImporte=Math.abs(r2(m.importe)-r2(i.total))<0.01||Math.abs(r2(m.importe)-saldoDe(i))<0.01;
      const porNumero=nf&&numerosDelConcepto(m.texto).some(n=>(n===nf&&n.length>=2)||(n.length>=4&&nf.endsWith(n)));
      if(porImporte||porNumero){out.push({factura:i,mov:m,por:porNumero?'nº de factura en el concepto':'proveedor e importe',saldo:saldoDe(i)});break;}
    }
  }
  return out;
};

const cel=(v)=>{const s=String(v==null?'':v);return /[;"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
const eur=(n)=>r2(n).toFixed(2).replace('.',',');
export const csvAuditoria=(a)=>{
  const L=['bloque;fecha;proveedor;numFactura;importe;detalle'];
  for(const x of (a.remesasSinPagos||[]))L.push(['remesa sin pagos apuntados',x.remesa.fecha,'','',eur(x.remesa.total),`${x.lineas} líneas · ${x.remesa.fichero||''}`].map(cel).join(';'));
  for(const x of (a.facturasEnVariasRemesas||[]))L.push(['factura en varias remesas',x.factura.fecha,x.factura.proveedor,x.factura.numFactura,eur(x.factura.total),x.remesas.map(r=>r.fecha||r.msgId).join(' + ')+(x.saldo>0.01?' · pendiente '+eur(x.saldo):'')].map(cel).join(';'));
  for(const x of (a.pagosSinRastro||[]))L.push(['pago sin rastro en el extracto',x.pago.fecha,x.factura.proveedor,x.factura.numFactura,eur(x.pago.importe),`${x.pago.metodo||''} · ${x.motivo}`].map(cel).join(';'));
  for(const x of (a.pendientesConCargo||[]))L.push(['pendiente con cargo en el extracto',x.mov.fechaOp,x.factura.proveedor,x.factura.numFactura,eur(x.mov.importe),`${String(x.mov.texto||'').slice(0,60)} · ${x.por} · pendiente ${eur(x.saldo)}`].map(cel).join(';'));
  return L.join('\r\n');
};
