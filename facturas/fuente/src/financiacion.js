// ═══ FINANCIACIÓN · cuadros, cuota francesa, Euríbor, líneas dispuestas ═══
const diasEntre=(a,b)=>{const n=Math.round((Date.parse(String(b)+'T00:00:00Z')-Date.parse(String(a)+'T00:00:00Z'))/864e5);return Number.isFinite(n)?n:0;};

// ═══════════════════════════════════════════════════════════════════════════
// FINANCIACIÓN: PRÉSTAMOS, LEASING, RENTING Y LÍNEAS DE CRÉDITO
// Sirve para saber qué hay que pagar al banco cada mes, que es la mitad de las
// obligaciones que no estaba en la app. Cada figura tiene sus reglas: el
// préstamo no lleva IVA (operación exenta), el renting es un servicio y su
// cuota va entera a gasto, y el leasing parte cada cuota en recuperación del
// coste e intereses aunque el IVA se calcule sobre el total.
// ═══════════════════════════════════════════════════════════════════════════
const TIPOS_FIN=[
  {id:'prestamo',n:'Préstamo',ic:'🏦',iva:false},
  {id:'leasing', n:'Leasing',  ic:'📄',iva:true },
  {id:'renting', n:'Renting',  ic:'🚗',iva:true },
  {id:'linea',   n:'Línea / préstamo promotor',ic:'🏗️',iva:false},
];

const finLlevaIva=(t)=>!!(TIPOS_FIN.find(x=>x.id===t)||{}).iva;

// ── Fechas ──
const sumaMeses=(iso,m)=>{
  const [a,b,c]=String(iso||'').split('-').map(Number);
  const meses=Number.isFinite(+m)?Math.round(+m):0;
  // Una fecha inválida devolvía una excepción y tumbaba el cuadro entero
  if(!Number.isFinite(a)||!Number.isFinite(b)||a<1000||a>9999||b<1||b>12)return '';
  const d=new Date(Date.UTC(a,(b-1)+meses,1));
  if(isNaN(d.getTime()))return '';
  const ultimo=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();
  d.setUTCDate(Math.min(Number.isFinite(c)&&c>0?c:1,ultimo));
  return isNaN(d.getTime())?'':d.toISOString().slice(0,10);
};

// ── Euríbor ──
// La app NO puede consultar el euríbor sola: no hay fuente pública abierta que
// un navegador pueda leer, y además cada contrato dice QUÉ publicación aplica
// (normalmente la del mes anterior a la revisión). Se guarda una tabla de
// valores y se elige el que corresponde a cada revisión.
const euriborAplicable=(tabla,fechaRev,desfaseMeses)=>{
  const t=(Array.isArray(tabla)?tabla:[]).filter(x=>x&&x.mes&&Number.isFinite(+x.valor))
    .sort((a,b)=>String(a.mes).localeCompare(String(b.mes)));
  if(!t.length||!fechaRev)return null;
  const objetivo=sumaMeses(fechaRev.slice(0,7)+'-01',-(Number.isFinite(+desfaseMeses)?+desfaseMeses:1)).slice(0,7);
  const exacto=t.find(x=>x.mes===objetivo);
  if(exacto)return {mes:exacto.mes,valor:+exacto.valor,exacto:true};
  // si falta ese mes, se usa el último publicado antes de él y se avisa
  const previos=t.filter(x=>x.mes<objetivo);
  if(!previos.length)return null;
  const u=previos[previos.length-1];
  return {mes:u.mes,valor:+u.valor,exacto:false,pedido:objetivo};
};

// Tipo nominal anual aplicable en una fecha
const tipoEnFecha=(op,fecha,euribor)=>{
  const o=op||{};
  if(o.clase!=='variable')return {tipo:+o.fijo||0,fuente:'fijo',aviso:''};
  const dif=+o.diferencial||0;
  const cada=Math.max(1,+o.revisionMeses||12);
  const primera=o.primeraRevision||o.fechaInicio||fecha;
  // ¿cuántas revisiones han pasado hasta esta fecha?
  let rev=primera;
  if(fecha>=primera){
    // Con una fecha ilegible sumaMeses devuelve '' y '' siempre es «menor»:
    // el bucle no avanzaba nunca y la app se quedaba colgada. Ahora, si la
    // siguiente revisión no avanza de verdad, se para.
    let guardaRev=0;
    while(guardaRev++<600){const sig=sumaMeses(rev,cada);if(!sig||sig<=rev||sig>fecha)break;rev=sig;}
  }else rev=o.fechaInicio||primera;
  const e=euriborAplicable(o.euribor||euribor,rev,o.desfaseMeses);
  if(!e)return {tipo:dif,fuente:'sin euríbor',aviso:`falta el euríbor para la revisión de ${rev}: se calcula solo con el diferencial`};
  return {tipo:+(e.valor+dif).toFixed(4),fuente:`euríbor ${e.mes} (${e.valor}%) + ${dif}%`,
    aviso:e.exacto?'':`no está publicado el euríbor de ${e.pedido}: se usa el de ${e.mes}`,revision:rev};
};

// ── Cuadro de amortización ──
// Se recalcula mes a mes en vez de con una fórmula cerrada, porque hay tres
// cosas que rompen cualquier fórmula: la carencia, las revisiones de tipo y las
// amortizaciones anticipadas. Cada fila lleva lo que de verdad se paga ese mes.
const cuadroFinanciacion=(op,euribor,opciones)=>{
  const o=op||{}, cfg=opciones||{};
  const filas=[], avisos=[];
  const tipo=o.tipo||'prestamo';

  // Renting: no hay capital ni intereses, solo cuota y su IVA
  if(tipo==='renting'){
    const n=Math.max(0,+o.plazoMeses||0), c=+o.cuotaBase||0, iv=+o.ivaPct||21;
    for(let k=1;k<=n;k++){
      const f=sumaMeses(o.fechaInicio||cfg.hoy||'',k);
      const iva=+(c*iv/100).toFixed(2);
      filas.push({n:k,fecha:f,cuota:+(c+iva).toFixed(2),interes:0,capital:0,servicio:c,iva,pendiente:0,carencia:false});
    }
    return {filas,avisos,tipo};
  }

  // Préstamo y leasing: sistema francés con carencia, revisiones y anticipadas
  let pendiente=+o.capital||0;
  const residual=tipo==='leasing'?(+o.valorResidual||0):0;
  const carencia=Math.max(0,+o.carenciaMeses||0);
  const n=Math.max(0,+o.plazoMeses||0);
  const iv=finLlevaIva(tipo)?(+o.ivaPct||21):0;
  const anticipadas=[...(o.amortizaciones||[])].sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)));
  let quedan=n-carencia;                 // cuotas con amortización de capital
  let cuota=null;                        // se fija al empezar a amortizar y en cada revisión
  let tipoAnt=null;

  for(let k=1;k<=n&&pendiente>0.004;k++){
    const fecha=sumaMeses(o.fechaInicio||cfg.hoy||'',k);
    const t=tipoEnFecha(o,fecha,euribor);
    if(t.aviso&&!avisos.includes(t.aviso))avisos.push(t.aviso);
    if(!Number.isFinite(+t.tipo)){
      const a='el tipo de interés no es un número válido: revisa el tipo fijo o el diferencial';
      if(!avisos.includes(a))avisos.push(a);
      break;                                  // mejor un cuadro vacío que uno falso
    }
    const iMes=(+t.tipo||0)/100/12;

    // Amortizaciones anticipadas con fecha anterior o igual a esta cuota
    let extra=0;
    while(anticipadas.length&&String(anticipadas[0].fecha)<=fecha){
      const a=anticipadas.shift();
      const imp=Math.min(+a.importe||0,pendiente);
      if(imp>0){
        pendiente=+(pendiente-imp).toFixed(2);
        extra+=imp;
        // El efecto lo elige quien amortiza: menos cuota o menos plazo
        if((a.efecto||'cuota')==='cuota')cuota=null;   // se recalcula con el nuevo capital
        else{                                          // acortar plazo: la cuota se mantiene
          const restante=cuota||cuotaFrancesa(pendiente+imp,iMes,Math.max(1,quedan),residual);
          cuota=restante;
          quedan=null;                                 // el plazo lo marca el saldo
        }
      }
    }
    if(pendiente<=0.004){
      if(extra)filas.push({n:k,fecha,cuota:+extra.toFixed(2),interes:0,capital:+extra.toFixed(2),
        iva:0,pendiente:0,carencia:false,anticipada:+extra.toFixed(2)});
      break;
    }

    const enCarencia=k<=carencia;
    const interes=+(pendiente*iMes).toFixed(2);
    let capital=0;

    if(enCarencia){
      capital=0;                                       // durante la carencia solo intereses
    }else{
      const restantes=quedan===null
        ?null                                          // plazo abierto tras acortar
        :Math.max(1,n-Math.max(k-1,carencia));
      if(cuota===null||t.tipo!==tipoAnt){
        const m=restantes===null
          ?Math.max(1,Math.ceil(Math.log(1+(pendiente*iMes)/Math.max(cuota||1,0.01))/Math.log(1+iMes))||1)
          :restantes;
        cuota=cuotaFrancesa(pendiente,iMes,restantes===null?m:restantes,
          (restantes!==null&&k===n)?residual:(restantes===null?0:residual));
      }
      capital=+(cuota-interes).toFixed(2);
      if(capital>pendiente)capital=pendiente;
      if(capital<0)capital=0;
    }
    tipoAnt=t.tipo;
    pendiente=+(pendiente-capital).toFixed(2);
    // En la última cuota se salda el residual del leasing
    if(k===n&&pendiente>0.004&&residual>0){capital=+(capital+pendiente).toFixed(2);pendiente=0;}
    const base=+(capital+interes).toFixed(2);
    const iva=iv?+(base*iv/100).toFixed(2):0;
    filas.push({n:k,fecha,cuota:+(base+iva).toFixed(2),interes,capital,iva,
      pendiente:+pendiente.toFixed(2),carencia:enCarencia,tipoAplicado:t.tipo,
      ...(extra?{anticipada:+extra.toFixed(2)}:{})});
  }
  return {filas,avisos,tipo};
};

// ── Línea de crédito / préstamo promotor ──
// No hay cuadro cerrado: hay disposiciones según avanza la obra y los intereses
// se liquidan sobre el saldo realmente dispuesto y los días que ha estado vivo.
const saldoDispuesto=(op,hasta)=>{
  const d=(op&&op.disposiciones)||[];
  const a=(op&&op.amortizaciones)||[];
  const s=d.filter(x=>!hasta||String(x.fecha)<=hasta).reduce((t,x)=>t+(+x.importe||0),0)
        -a.filter(x=>!hasta||String(x.fecha)<=hasta).reduce((t,x)=>t+(+x.importe||0),0);
  return +Math.max(0,s).toFixed(2);
};

const disponibleLinea=(op,hasta)=>+Math.max(0,(+((op||{}).limite)||0)-saldoDispuesto(op,hasta)).toFixed(2);

// Intereses del periodo por saldo medio: cada tramo de días con su saldo vivo
const interesesPeriodo=(op,desde,hasta,euribor)=>{
  if(!desde||!hasta||hasta<=desde)return {intereses:0,tramos:[],saldoMedio:0};
  const movs=[...((op&&op.disposiciones)||[]).map(x=>({f:String(x.fecha),i:+x.importe||0})),
              ...((op&&op.amortizaciones)||[]).map(x=>({f:String(x.fecha),i:-(+x.importe||0)}))]
    .filter(m=>m.f>desde&&m.f<=hasta).sort((a,b)=>a.f.localeCompare(b.f));
  const cortes=[desde,...movs.map(m=>m.f),hasta].filter((v,i,a)=>a.indexOf(v)===i).sort();
  let saldo=saldoDispuesto(op,desde), total=0, ponderado=0;
  const tramos=[];
  for(let k=0;k<cortes.length-1;k++){
    const a=cortes[k], b=cortes[k+1];
    if(k>0)saldo=saldoDispuesto(op,a);
    const dias=diasEntre(a,b);
    if(dias<=0)continue;
    const t=tipoEnFecha(op,a,euribor);
    // Base 360, que es la que usan los bancos españoles en estas pólizas
    const i=+(saldo*((+t.tipo||0)/100)*dias/360).toFixed(2);
    total+=i; ponderado+=saldo*dias;
    tramos.push({desde:a,hasta:b,dias,saldo,tipo:+t.tipo||0,intereses:i});
  }
  const diasTot=diasEntre(desde,hasta);
  return {intereses:+total.toFixed(2),tramos,saldoMedio:diasTot?+(ponderado/diasTot).toFixed(2):0};
};

const validarPropuestaEuribor=(prop,tabla,mesPedido)=>{
  if(!prop||prop.valor===null||prop.valor===undefined||prop.valor==='')
    return {ok:false,motivo:'la búsqueda no ha encontrado el dato publicado'};
  const v=+prop.valor;
  if(!Number.isFinite(v))return {ok:false,motivo:'lo encontrado no es un número'};
  if(v<-2||v>20)return {ok:false,motivo:`${v}% no es un valor posible para el euríbor`};
  if(prop.mes&&mesPedido&&prop.mes!==mesPedido)
    return {ok:false,motivo:`ha traído el dato de ${prop.mes} y hacía falta el de ${mesPedido}`};
  if(prop.seguro===false)return {ok:false,motivo:'la búsqueda no lo ha podido confirmar'};
  const avisos=[];
  if(!prop.fuente)avisos.push('no viene con la dirección de la fuente: compruébalo antes de aceptarlo');
  // Coherencia con lo que ya hay: el euríbor no salta un punto de un mes a otro
  const previos=(tabla||[]).filter(x=>x&&x.mes&&x.mes<(mesPedido||prop.mes)&&Number.isFinite(+x.valor))
    .sort((a,b)=>String(a.mes).localeCompare(String(b.mes)));
  if(previos.length){
    const u=previos[previos.length-1];
    const salto=Math.abs(v-(+u.valor));
    if(salto>1)avisos.push(`salta ${salto.toFixed(3)} puntos respecto a ${u.mes} (${u.valor}%): revísalo`);
  }
  return {ok:true,motivo:'',avisos};
};

// ── ¿Qué revisiones están a la vuelta y falta su euríbor? ──
// La app conoce las fechas de revisión de cada operación, así que puede decir
// exactamente qué valor le falta y para cuándo. Es lo que convierte un «acuérdate
// de mirar el euríbor» en un aviso concreto.
const revisionesPendientes=(ops,tabla,hoy,mesesVista)=>{
  const vista=Number.isFinite(+mesesVista)?+mesesVista:2;
  const hasta=sumaMeses(hoy,vista);
  const out=[];
  (Array.isArray(ops)?ops:[]).filter(o=>o&&o.activo!==false&&o.clase==='variable').forEach(o=>{
    const cada=Math.max(1,+o.revisionMeses||12);
    let r=o.primeraRevision||o.fechaInicio;
    if(!r)return;
    // se avanza hasta la primera revisión que aún no ha pasado del todo
    let guarda=0;
    while(r<sumaMeses(hoy,-1)&&guarda++<600)r=sumaMeses(r,cada);
    while(r<=hasta&&guarda++<600){
      const mes=sumaMeses(r.slice(0,7)+'-01',-(Number.isFinite(+o.desfaseMeses)?+o.desfaseMeses:1)).slice(0,7);
      const tiene=(tabla||[]).some(x=>x&&x.mes===mes&&Number.isFinite(+x.valor));
      if(!tiene)out.push({op:o,fechaRevision:r,mes,vencida:r<hoy});
      r=sumaMeses(r,cada);
    }
  });
  return out.sort((a,b)=>String(a.fechaRevision).localeCompare(String(b.fechaRevision)));
};

// ── Cuota francesa ──
const cuotaFrancesa=(capital,iMes,n,residual)=>{
  // Con un tipo inválido, la versión anterior devolvía la cuota SIN intereses:
  // el cuadro parecía correcto y las cuotas salían más bajas de lo que son.
  const C=Number.isFinite(+capital)?+capital:0;
  const R=Number.isFinite(+residual)?+residual:0;
  const i=Number.isFinite(+iMes)?+iMes:null;
  const N=Number.isFinite(+n)?Math.max(0,Math.round(+n)):0;
  if(N<=0)return 0;
  if(i===null)return 0;                // sin tipo válido no se inventa una cuota
  const iMes2=i;
  if(!iMes2)return +((C-R)/N).toFixed(2);
  const f=Math.pow(1+iMes2,N);
  const q=((C-R/f)*iMes2*f)/(f-1);
  return Number.isFinite(q)?+q.toFixed(2):0;
};
export {diasEntre,TIPOS_FIN,finLlevaIva,sumaMeses,euriborAplicable,tipoEnFecha,cuadroFinanciacion,saldoDispuesto,disponibleLinea,interesesPeriodo,validarPropuestaEuribor,revisionesPendientes,cuotaFrancesa};
