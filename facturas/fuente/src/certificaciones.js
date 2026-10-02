// ═══ CERTIFICACIONES Y COSTES · líneas por fases, coste empresa, ISP ═══
import {normProvNombre} from './fichaje';
import {normNIF} from './embargos';
const pctLineasCert=(items,certs)=>{
  items=(Array.isArray(items)?items:[]).filter(x=>x&&typeof x==='object');
  items=Array.isArray(items)?items:[];
  return (items||[]).map((it,ix)=>{
    const lb=(+it.qty||0)*(+it.precio||0);
    if(lb<=0)return 0;
    const imp=(certs||[]).reduce((s,cb)=>s+(((cb&&cb.certDetalle)||[]).filter(l=>l&&l.ix===ix).reduce((a,l)=>a+(+l.imp||0),0)),0);
    return Math.min(+(((imp/lb)*100)).toFixed(2),100);
  });
};

const lineasCertificacion=(items,certLin)=>{
  items=(Array.isArray(items)?items:[]).filter(x=>x&&typeof x==='object');
  items=Array.isArray(items)?items:[];
  const lineas=[];let base=0;
  (items||[]).forEach((it,ix)=>{
    const lb=(+it.qty||0)*(+it.precio||0);if(lb<=0)return;
    const prev=+it.pct||0;
    const v=certLin?certLin[ix]:undefined;
    const nv=(v===''||v==null)?prev:Math.min((+String(v).replace(',','.'))||0,100);
    const delta=Math.max(nv-prev,0);
    if(delta>0){const imp=+(lb*delta/100).toFixed(2);base+=imp;lineas.push({ix,d:it.desc||'—',prev,nuevo:nv,imp,lb});}
  });
  return {lineas,base:+base.toFixed(2)};
};

const COSTE_SS_EMPRESA=0.32;

const costeEmpresaDe=(it)=>{
  const ce=+((it&&it.ce)||0);
  if(ce>0)return {valor:ce,estimado:false};
  const dev=+((it&&it.dev)||0);
  if(dev>0)return {valor:+(dev*(1+COSTE_SS_EMPRESA)).toFixed(2),estimado:true};
  const liq=+((it&&it.liq)||0);
  return liq>0?{valor:+(liq*(1+COSTE_SS_EMPRESA)).toFixed(2),estimado:true}:{valor:0,estimado:false};
};

const mezclaMesNominas=(prevItems,entries)=>{
  prevItems=(Array.isArray(prevItems)?prevItems:[]).filter(x=>x&&typeof x==='object');
  entries=(Array.isArray(entries)?entries:[]).filter(x=>x&&typeof x==='object');
  const items=prevItems.map(i=>({...i}));
  entries.forEach(e=>{
    const ix=items.findIndex(i=>i&&i.empId===e.id);
    if(ix>=0)items[ix]={...items[ix],liq:+e.amount||0,nombre:items[ix].nombre||e.nombre||''};
    else items.push({empId:e.id,nombre:e.nombre||'',nif:normNIF(e.nif||''),dev:0,esp:0,irB:0,irP:0,irC:0,ss:0,ce:0,liq:+e.amount||0});
  });
  return items;
};

const inferISP=(b,t,iv,sp)=>{
  b=+b||0;t=+t||0;iv=+iv||0;
  // Muchos proveedores llevan la leyenda del artículo 84.1.2.f impresa en la
  // plantilla de TODAS sus facturas, también en las que sí repercuten IVA.
  // Por eso mandan las cuentas: si el total impreso supera a la base, hay IVA
  // cobrado y no puede haber inversión del sujeto pasivo, diga lo que diga el pie.
  const hayIvaCobrado = b>0 && t>0 && (t-b)>0.02;
  if(hayIvaCobrado)return false;
  if(sp===true||String(sp)==='true')return true;
  return b>0&&iv>0&&t>0&&Math.abs(t-b)<=0.02;
};

const hallarProforma=(cand,lista)=>{
  if(!cand||!cand.proveedor||!(+cand.total>0))return null;
  const np=normProvNombre(cand.proveedor);
  return lista.find(i=>i&&i.proforma&&i.tipo==='factura'&&normProvNombre(i.proveedor)===np&&Math.abs((+i.total||0)-(+cand.total))<0.02)||null;
};
export {pctLineasCert,lineasCertificacion,COSTE_SS_EMPRESA,costeEmpresaDe,mezclaMesNominas,inferISP,hallarProforma};
