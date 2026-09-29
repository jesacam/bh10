// ═══ DESGLOSE DE IVA · lectura, cálculo, cuadre y reparación ═══
const normLineas=(arr)=>{
  if(!Array.isArray(arr))return [];
  const out=[];
  for(const l of arr){
    if(!l||typeof l!=='object')continue;
    const d=String(l.d!==undefined?l.d:(l.desc!==undefined?l.desc:(l.descripcion||''))).trim();
    const q=+(l.q!==undefined?l.q:(l.cant!==undefined?l.cant:(l.cantidad||0)))||0;
    let pu=+(l.pu!==undefined?l.pu:(l.unit!==undefined?l.unit:(l.precioUnit!==undefined?l.precioUnit:(l.precio||0))))||0;
    let imp=+(l.imp!==undefined?l.imp:(l.sub!==undefined?l.sub:(l.importe!==undefined?l.importe:(l.subtotal||0))))||0;
    if(pu<=0&&q>0&&imp>0)pu=+(imp/q).toFixed(4);   // se deduce el unitario
    if(imp<=0&&q>0&&pu>0)imp=+(q*pu).toFixed(2);   // o el importe
    if(!d||(pu<=0&&imp<=0))continue;
    out.push({d:d.slice(0,120),q,pu,imp});
  }
  return out;
};

import {parseNum,fmt} from './basicos';
import {TIPOS_IVA} from './verifactu';
// Convierte UNA entrada del lector en los campos del formulario.
// La usan por igual el escaneo suelto, el lote y los documentos multifactura.
const mapearLectura=(x,ctx)=>{
  if(!ctx||typeof ctx.inferISP!=='function')return {};   // sin contexto no hay lectura que mapear
  x=x&&typeof x==='object'?x:{};
  const o=x||{};
  const g=(a,b)=>o[a]!==undefined&&o[a]!==null?o[a]:o[b];
  const cat=g('ca','categoria'), iva=g('iv','tipoIva'), irp=g('ir','irpf');
  // La base puede venir suelta o dentro de la lista de desglose: si no se suma
  // la lista, inferISP no ve que hay IVA cobrado y se fía de la leyenda del pie.
  const _impLista=g('imp','desglose');
  const _baseTotal=(()=>{
    const suelta=ctx.parseNum(g('b','importeBase'))||0;
    if(suelta>0)return suelta;
    if(!Array.isArray(_impLista))return 0;
    return _impLista.reduce((s,l)=>s+(l&&typeof l==='object'?(ctx.parseNum(l.base!==undefined?l.base:l.b)||0):0),0);
  })();
  const _isp=ctx.inferISP(_baseTotal, g('t','total')!==undefined?g('t','total'):g('t','_totalLeido'), iva, g('sp','isp'));
  let _pr=g('pr','proveedor')||'', _pc=ctx.normNif(g('pc','proveedorCif')||''), _pd=g('pd','proveedorDir')||'';
  const _cl=String(g('cl','cliente')||''), _cc=ctx.normNif(String(g('cc','clienteCif')||''));
  let _emitidaPorNos=false;
  if(ctx.esNuestro(_pr,_pc) && _cl && !ctx.esNuestro(_cl,_cc)){ _pr=_cl; _pc=_cc; _pd=''; _emitidaPorNos=true; }
  return {
    _emitidaPorNos,
    fecha: g('f','fecha') || ctx.today,
    numFactura: g('n','numFactura') || '',
    proveedor: _pr,
    proveedorCif: _pc,
    proveedorDir: _pd,
    concepto: g('co','concepto') || g('c','concepto') || '',
    categoria: ctx.CATS.includes(cat) ? cat : 'Materiales',
    ...(()=>{
      // Desglose: se admite la lista nueva («imp») y, si no viene, se compone
      // con los campos de siempre. Después se repara con el total impreso y se
      // comprueba, porque leer mal una base es el fallo más caro del lector.
      const tot=ctx.parseNum(g('t','total'))||0;
      const irp2=ctx.IRPFS.includes(irp)?irp:0;
      let bruto=[];
      const imp=g('imp','desglose');
      if(Array.isArray(imp)&&imp.length){
        // v346: cada entrada puede venir marcada "sp" (ISP solo en ESA base:
        // mezcla de IVA normal e inversión del sujeto pasivo, típica en obra).
        // La base ISP va a tipo 0 y cuota 0, y la marca se conserva.
        bruto=imp.map(l=>{const _sp=!!(l&&(l.sp===true||String(l.sp)==='true'));
          return {base:ctx.parseNum(l&&(l.b??l.base))||0,
          tipo:_sp?0:(+(l&&(l.iv??l.tipo))||0), cuota:_sp?0:(ctx.parseNum(l&&(l.c??l.cuota))||0), sp:_sp};});
      }else{
        const b1=ctx.parseNum(g('b','importeBase'))||0, bb2=ctx.parseNum(g('b2','base2'))||0;
        if(b1)bruto.push({base:b1,tipo:ctx.IVAS.includes(iva)?iva:21,cuota:0});
        if(bb2)bruto.push({base:bb2,tipo:+g('iv2','tipoIva2')||10,cuota:0});
      }
      if(_isp)bruto=bruto.map(l=>({...l,tipo:0}));
      // Ojo: no se filtran las bases a cero. Una factura sin cargo se lee como
      // 0 y hay que conservarlo; descartarlo la haría parecer ilegible.
      const des0=repararDesglose(bruto,tot,irp2,_isp);
      // repararDesglose devuelve entradas limpias {base,tipo}: la marca sp se
      // repone casando cada base reparada con las que venían marcadas.
      const _basesSp=new Set(bruto.filter(l=>l.sp).map(l=>+(+l.base).toFixed(2)));
      const des=des0.map(l=>_basesSp.has(+(+l.base).toFixed(2))&&l.tipo===0?{...l,sp:true}:l);
      const chk=cuadraFactura(des,irp2,tot,_isp);
      return {
        desglose:des,
        _ispParcial:!_isp&&des.some(l=>l.sp===true),
        _cuadre:chk,
        importeBase: des[0]&&des[0].base?fmt(parseNum(des[0].base)):'',
        tipoIva: _isp?0:(des[0]?des[0].tipo:(ctx.IVAS.includes(iva)?iva:21)),
        base2: des[1]?String(des[1].base):'',
        tipoIva2: des[1]?des[1].tipo:10,
      };
    })(),
    isp: _isp,
    irpf: ctx.IRPFS.includes(irp) ? irp : 0,
    fechaVencimiento: g('v','fechaVencimiento') || g('fv','fechaVencimiento') || '',
    ibanProveedor: ctx.reparaIban(g('ib','ibanProveedor')),
    proforma: g('pf','proforma')===true||String(g('pf','proforma'))==='true',
    formaPago: g('fp','formaPago') || 'Transferencia',
    obra: g('ob','obra') || '',
    _totalLeido: ctx.parseNum(g('t','total')) || 0,
    // Líneas de detalle: alimentan el seguimiento de precios por material.
    // Se normalizan a {d, q, pu, imp} y se descarta lo que no aporte nada.
    lineas: normLineas(g('lin','lineas')),
  };
};

const calcDesglose=(desglose,irpf)=>{
  const l=(Array.isArray(desglose)?desglose:[]).filter(x=>x&&typeof x==='object')
    .map(x=>({base:+x.base||0,tipo:+x.tipo||0}));
  const base=+l.reduce((s,x)=>s+x.base,0).toFixed(2);
  const iva=+l.reduce((s,x)=>s+x.base*x.tipo/100,0).toFixed(2);
  const pct=Number.isFinite(+irpf)?+irpf:0;
  const r=base*pct/100;
  const retencion=Number.isFinite(r)?+r.toFixed(2):0;
  const tot=base+iva-retencion;
  return {base,iva,retencion,total:Number.isFinite(tot)?+tot.toFixed(2):0,lineas:l};
};

// ¿Cuadra lo leído con el total impreso en la factura?
const cuadraFactura=(desglose,irpf,totalLeido,isp)=>{
  const todas=(Array.isArray(desglose)?desglose:[]).filter(x=>x&&typeof x==='object');
  const l=todas.filter(x=>(+x.base||0)>0);
  const tl0=+totalLeido||0;
  // Hay facturas legítimas de importe cero: reposiciones en garantía, material
  // sin cargo, servicios incluidos en un contrato. Se emiten y hay que
  // registrarlas. No confundirlas con «no se ha podido leer el importe».
  if(!l.length&&todas.length&&tl0===0)return {ok:true,motivo:'',calculado:0,cero:true};
  if(!l.length)return {ok:false,motivo:'no se ha leído ninguna base imponible',calculado:0};
  if(l.some(x=>+x.base<0))return {ok:false,motivo:'hay bases negativas',calculado:0};
  if(l.some(x=>!TIPOS_IVA.includes(+x.tipo)))
    return {ok:false,motivo:`hay un tipo de IVA que no existe en España (${l.map(x=>x.tipo).filter(t=>!TIPOS_IVA.includes(t)).join(', ')}%)`,calculado:0};
  const c=calcDesglose(isp?l.map(x=>({...x,tipo:0})):l,irpf);
  const tl=+totalLeido||0;
  if(!tl)return {ok:true,motivo:'',calculado:c.total};   // sin total impreso no hay con qué comparar
  const dif=+(c.total-tl).toFixed(2);
  if(Math.abs(dif)>0.02)
    return {ok:false,calculado:c.total,dif,
      motivo:`las cuentas dan ${fmt(c.total)} € y la factura pone ${fmt(tl)} €`};
  return {ok:true,motivo:'',calculado:c.total,dif};
};

// Intenta rellenar lo que falte usando el total, que es el número que mejor se
// lee de una factura. No inventa tipos: solo completa lo que se deduce.
const repararDesglose=(lineas,totalLeido,irpf,isp)=>{
  const tl=+totalLeido||0;
  let l=(Array.isArray(lineas)?lineas:[]).filter(x=>x&&typeof x==='object')
    .map(x=>({base:+x.base||0,tipo:+x.tipo||0,cuota:+x.cuota||0}));
  // 1) si falta la base pero hay cuota y tipo, se despeja
  l.forEach(x=>{ if(!x.base&&x.cuota>0&&x.tipo>0)x.base=+(x.cuota*100/x.tipo).toFixed(2); });
  // 2) si falta la cuota pero hay base y tipo, se calcula
  l.forEach(x=>{ if(!x.cuota&&x.base>0&&x.tipo>0)x.cuota=+(x.base*x.tipo/100).toFixed(2); });
  const habiaLectura=(Array.isArray(lineas)?lineas:[]).filter(x=>x&&typeof x==='object').length>0;
  l=l.filter(x=>x.base>0);
  // Se leyó el cuadro de impuestos y ponía cero: se conserva como tal
  if(!l.length&&habiaLectura&&tl===0)
    return [{base:0,tipo:+((lineas[0]||{}).tipo)||0}];
  // 3) Una sola base que no llega al total: se corrige SOLO si el ajuste es
  // pequeño (una cifra mal leída). Si la diferencia es grande, lo más probable
  // es que falte una base entera a otro tipo, y entonces inflar esta falsearía
  // el IVA de la factura —y del modelo 303—. En ese caso se deja como está y
  // el cuadre lo denuncia.
  if(tl>0&&l.length===1&&!isp){
    const r=+irpf||0, t=l[0].tipo;
    const baseDelTotal=+(tl/(1+t/100-r/100)).toFixed(2);
    const desvia=Math.abs(calcDesglose(l,r).total-tl)>0.02;
    const ajustePeque=l[0].base>0&&Math.abs(baseDelTotal-l[0].base)/l[0].base<=0.05;
    if(desvia&&baseDelTotal>0&&ajustePeque)l[0].base=baseDelTotal;
  }
  // 4) ninguna base leída pero sí total y tipo: se reconstruye
  if(tl>0&&!l.length)l=[{base:+(tl/1.21).toFixed(2),tipo:21,cuota:0}];
  return l.map(x=>({base:+x.base.toFixed(2),tipo:x.tipo}));
};
export {normLineas,mapearLectura,calcDesglose,cuadraFactura,repararDesglose};
