// ═══ IVA 303 · borrador trimestral para la gestoría (v347) ═══════════════
// Un CSV con la estructura de casillas del modelo 303 que Reme pueda cotejar
// tal cual. Principios:
//  · Cada factura aporta TODAS sus bases: el desglose[] si lo trae (lector
//    nuevo), y si no, importeBase/tipoIva + base2/tipoIva2 (lo de siempre).
//  · Las cuotas se CALCULAN de las bases (base × tipo), no se copian del
//    campo iva: así la hoja es internamente coherente. Si la suma calculada
//    se separa más de 1 € de la registrada, se añade una línea de aviso para
//    que Reme lo mire — nunca se tapa una discrepancia.
//  · ISP recibido (global o por base «sp»): autorepercusión — la cuota se
//    ESTIMA al 21% (obra) y aparece a la vez como devengada y deducible
//    (efecto neto cero), cada una con su etiqueta de «estimada al 21%».
//  · ISP emitido: solo informativa (casilla 122), sin cuota.
//  · Abonos restan con su signo; anuladas fuera (eso lo filtra quien llama).
const TIPOS=[21,10,4,0];

// Todas las bases de una factura, con su marca de ISP.
export const basesDe=(i,parseNum)=>{
  const pn=v=>parseNum?parseNum(v)||0:(+v||0);
  const neg=i&&i.esAbono?-1:1;
  const sgn=b=>{const v=pn(b);return i&&i.esAbono&&v>0?-v:v;};
  let out=[];
  if(Array.isArray(i?.desglose)&&i.desglose.length){
    out=i.desglose.filter(l=>l&&typeof l==='object')
      .map(l=>({base:sgn(l.base),tipo:+l.tipo||0,isp:l.sp===true||i.isp===true}));
  }else{
    const b1=sgn(i?.importeBase);
    if(b1)out.push({base:b1,tipo:+(i?.tipoIva??21)||0,isp:i?.isp===true});
    const b2=sgn(i?.base2);
    if(b2)out.push({base:b2,tipo:+(i?.tipoIva2??10)||0,isp:i?.isp===true});
  }
  return out.map(l=>l.isp?{...l,tipo:0}:l).filter(l=>l.base!==0);
};

const r2=n=>+(+n||0).toFixed(2);

export const resumen303=({emitidas,recibidas,parseNum})=>{
  emitidas=Array.isArray(emitidas)?emitidas:[];
  recibidas=Array.isArray(recibidas)?recibidas:[];
  const dev={};TIPOS.forEach(t=>dev[t]={base:0,cuota:0});
  let ventasISP=0, ivaRepRegistrado=0;
  for(const i of emitidas){
    {const v=+(parseNum?parseNum(i.iva):i.iva)||0;ivaRepRegistrado+=i.esAbono&&v>0?-v:v;}
    for(const l of basesDe(i,parseNum)){
      if(l.isp){ventasISP+=l.base;continue;}
      const t=TIPOS.includes(l.tipo)?l.tipo:21;
      dev[t].base+=l.base; dev[t].cuota+=l.base*t/100;
    }
  }
  const ded={base:0,cuota:0};
  let ispRec=0, ivaSopRegistrado=0;
  for(const i of recibidas){
    {const v=+(parseNum?parseNum(i.iva):i.iva)||0;ivaSopRegistrado+=i.esAbono&&v>0?-v:v;}
    for(const l of basesDe(i,parseNum)){
      if(l.isp){ispRec+=l.base;continue;}
      const t=TIPOS.includes(l.tipo)?l.tipo:21;
      ded.base+=l.base; ded.cuota+=l.base*t/100;
    }
  }
  const ispCuota=r2(ispRec*0.21);
  const totalDevengado=r2(TIPOS.reduce((s,t)=>s+dev[t].cuota,0)+ispCuota);
  const totalDeducible=r2(ded.cuota+ispCuota);
  const resultado=r2(totalDevengado-totalDeducible);
  const avisos=[];
  const repCalc=r2(TIPOS.reduce((s,t)=>s+dev[t].cuota,0));
  const sopCalc=r2(ded.cuota);
  if(Math.abs(repCalc-r2(ivaRepRegistrado))>1)
    avisos.push(`IVA repercutido: calculado de las bases ${repCalc.toFixed(2)} € vs registrado ${r2(ivaRepRegistrado).toFixed(2)} € — revisar`);
  if(Math.abs(sopCalc-r2(ivaSopRegistrado))>1)
    avisos.push(`IVA soportado: calculado de las bases ${sopCalc.toFixed(2)} € vs registrado ${r2(ivaSopRegistrado).toFixed(2)} € — revisar`);
  return {
    devengado:{porTipo:Object.fromEntries(TIPOS.map(t=>[t,{base:r2(dev[t].base),cuota:r2(dev[t].cuota)}])),
      ispRecibidas:{base:r2(ispRec),cuotaEstimada:ispCuota},total:totalDevengado},
    deducible:{base:r2(ded.base),cuota:sopCalc,ispBase:r2(ispRec),ispCuotaEstimada:ispCuota,total:totalDeducible},
    informativas:{ventasISP:r2(ventasISP)},
    resultado,
    nEmitidas:emitidas.length,nRecibidas:recibidas.length,
    avisos};
};

const eur=n=>(+n||0).toFixed(2).replace('.',',');

export const csv303=(r,{empresa,cif,trimestre,anio})=>{
  const L=[];
  L.push(`BORRADOR MODELO 303;${empresa||''};CIF ${cif||''};T${trimestre} ${anio}`);
  L.push('Generado por BH10 FacturaControl — borrador para cotejo de la gestoría, NO es la autoliquidacion');
  L.push('');
  L.push('IVA DEVENGADO;Base;Tipo;Cuota;Casillas');
  const cas={4:'01-03',10:'04-06',21:'07-09'};
  for(const t of [4,10,21]){
    const d=r.devengado.porTipo[t];
    if(d.base||d.cuota)L.push(`Regimen general;${eur(d.base)};${t}%;${eur(d.cuota)};${cas[t]}`);
  }
  if(r.devengado.porTipo[0].base)L.push(`Exentas / tipo 0;${eur(r.devengado.porTipo[0].base)};0%;0,00;`);
  if(r.devengado.ispRecibidas.base)L.push(`ISP recibido — autorepercusion (cuota ESTIMADA al 21%);${eur(r.devengado.ispRecibidas.base)};21%*;${eur(r.devengado.ispRecibidas.cuotaEstimada)};12-13`);
  L.push(`TOTAL CUOTA DEVENGADA;;;${eur(r.devengado.total)};27`);
  L.push('');
  L.push('IVA DEDUCIBLE;Base;;Cuota;Casillas');
  L.push(`Operaciones interiores corrientes;${eur(r.deducible.base)};;${eur(r.deducible.cuota)};28-29`);
  if(r.deducible.ispBase)L.push(`ISP recibido — deducible (cuota ESTIMADA al 21%);${eur(r.deducible.ispBase)};;${eur(r.deducible.ispCuotaEstimada)};28-29`);
  L.push(`TOTAL A DEDUCIR;;;${eur(r.deducible.total)};45`);
  L.push('');
  L.push(`RESULTADO (27 - 45);;;${eur(r.resultado)};46`);
  L.push('');
  L.push('INFORMATIVAS');
  if(r.informativas.ventasISP)L.push(`Ventas emitidas con ISP (sin repercusion);${eur(r.informativas.ventasISP)};;;122`);
  L.push(`Facturas del trimestre;emitidas ${r.nEmitidas};recibidas ${r.nRecibidas}`);
  for(const a of r.avisos)L.push(`AVISO;${a}`);
  return L.join('\n');
};
