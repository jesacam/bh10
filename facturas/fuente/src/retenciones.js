// ═══ RETENCIONES DE GARANTÍA · vencimientos, liquidables y reclamación ═══
// Cada certificación cobrada con retención guarda retGarImp. La retención se
// puede reclamar cuando vence el plazo de garantía: por defecto 12 meses desde
// la fecha de la factura, salvo que la factura traiga su propio retGarMeses.
import {fmt,fmtDate} from './basicos';

const PLAZO_GARANTIA_MESES=12;

const sumaMesesFecha=(iso,meses)=>{
  const [a,m,d]=String(iso||'').split('-').map(Number);
  if(!a||!m||!d)return '';
  const f=new Date(Date.UTC(a,m-1+ (meses|0),d));
  return f.toISOString().slice(0,10);
};

// Estado de UNA retención: cuándo vence y si ya se puede reclamar.
const estadoRetencion=(inv,hoy)=>{
  const meses=(+inv?.retGarMeses>0)?+inv.retGarMeses:PLAZO_GARANTIA_MESES;
  const vence=sumaMesesFecha(inv?.fecha,meses);
  if(!vence)return {vence:'',dias:null,liquidable:false,meses};
  const dias=Math.round((Date.parse(vence)-Date.parse(hoy))/86400000);
  return {vence,dias,liquidable:dias<=0,meses};
};

// Resumen de todas: pendientes, liquidables ya, y las que vencen pronto.
const resumenRetenciones=(invoices,hoy,diasAviso=60)=>{
  const conRet=(invoices||[]).filter(i=>i&&i.tipo==='cobro'&&(+i.retGarImp||0)>0);
  const pendientes=conRet.filter(i=>!i.retGarDevuelta)
    .map(i=>({...i,_ret:estadoRetencion(i,hoy)}));
  const liquidables=pendientes.filter(i=>i._ret.liquidable);
  const proximas=pendientes.filter(i=>!i._ret.liquidable&&i._ret.dias!==null&&i._ret.dias<=diasAviso);
  const suma=l=>+l.reduce((s,i)=>s+(+i.retGarImp||0),0).toFixed(2);
  return {
    pendientes,liquidables,proximas,
    devueltas:conRet.filter(i=>i.retGarDevuelta),
    totPend:suma(pendientes),totLiquidable:suma(liquidables),totProximas:suma(proximas),
  };
};

// Texto listo para enviar al cliente reclamando la devolución.
const textoReclamacion=(cliente,items,empresa)=>{
  const l=(items||[]).filter(Boolean);
  const tot=+l.reduce((s,i)=>s+(+i.retGarImp||0),0).toFixed(2);
  const lineas=l.map(i=>`  · ${i.numFactura} (${fmtDate(i.fecha)})${i.obra?' — '+i.obra:''}: ${fmt(+i.retGarImp)} €`).join('\n');
  return `Estimados Sres. de ${cliente||'—'}:\n\n`+
`Cumplido el plazo de garantía, les solicitamos la devolución de las retenciones practicadas en las siguientes certificaciones:\n\n`+
lineas+`\n\n  TOTAL A DEVOLVER: ${fmt(tot)} €\n\n`+
`Rogamos transferencia a la cuenta habitual. Quedamos a su disposición para cualquier comprobación.\n\nAtentamente,\n${empresa||'BIG HOUSE 2010 S.L.'}`;
};

export {PLAZO_GARANTIA_MESES,sumaMesesFecha,estadoRetencion,resumenRetenciones,textoReclamacion};
