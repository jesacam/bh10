// ═══ TESORERÍA · previsión a 6 meses: nóminas, SS, seguros, pagos y cobros ═══
import {parseNum} from './basicos';
import {pagosSeguros} from './polizas';
// ═══ PREVISIÓN DE TESORERÍA ═══
// Con lo que la app ya sabe: nóminas, SS estimada, primas por periodicidad,
// facturas por pagar (lo vencido, al primer mes) y cobros previstos. El saldo
// real del banco se sumará cuando se conecte la lectura de cuentas.
const mesMas=(m,k)=>{const d=new Date(m+'-01T12:00:00');d.setMonth(d.getMonth()+k);return d.toISOString().slice(0,7);};

import {esDeudaProveedor} from './saldos';
import {REC} from './copias';
const previsionTesoreria=(datos,mesInicio,n)=>{
  const {empleados,polizas,facturas,getSaldoF}=datos;
  // v348 · presupuesto anual de personal (centro de coste): si la empresa fija
  // un bruto anual (pagas + complementos + SS), la previsión imputa CONTRA ESE
  // presupuesto en 14 pagas — 1/14 al mes y DOBLE en los meses de paga extra —
  // en lugar del cálculo plano bases+41%. La imputación deja de ser regular,
  // que es como de verdad sale el dinero.
  // El modelo es el de la CAJA real, no el de manual (v348, corregido con los
  // números de Jesús): un mes normal sale por una cantidad fija (remesa de
  // nóminas + Seguridad Social de empresa y trabajador); los meses de paga
  // extra añaden SOLO el importe de la paga (la cotización va prorrateada por
  // base anual y NO dobla); y cada trimestre cae el pago de retenciones
  // (modelo 111) en enero, abril, julio y octubre.
  const pr=datos.presupuestoPersonal||{};
  const prMensual=+pr.mensual||0;
  const prExtraImp=+pr.extraImporte||0;
  const prIrpfT=+pr.irpfTrimestral||0;
  const prExtras=(Array.isArray(pr.extras)&&pr.extras.length?pr.extras:[6,12]).map(Number);
  const MESES_111=[1,4,7,10];
  const conPresupuesto=prMensual>0;
  const personalDeMes=(m)=>{const mesN=+String(m).slice(5,7);
    return +(prMensual+(prExtras.includes(mesN)?prExtraImp:0)+(MESES_111.includes(mesN)?prIrpfT:0)).toFixed(2);};
  const nominasPlanas=+(empleados||[]).filter(e=>e&&e.activo).reduce((s,e)=>s+(parseNum(e.importeBase)||0),0).toFixed(2);
  const nominas=nominasPlanas;
  const proy=(datos.recPatrones&&datos.recPatrones.length)?REC.proyectar(datos.recPatrones,mesInicio,(n||6)+1):[];
  const recDeMes=(m)=>{const fila=proy.find(x=>x.mes===m);return fila?{imp:+Math.abs(fila.pagos||0).toFixed(2),lineas:fila.lineas||[]}:{imp:0,lineas:[]};};
  const ssAprendida=proy.some(x=>(x.lineas||[]).some(l=>l.categoria==='Seguridad Social'));
  const ss=conPresupuesto?0:(ssAprendida?0:+(nominas*0.41).toFixed(2)); // presupuesto o TGSS aprendida apagan la estimación
  const segTodos=pagosSeguros(polizas||[],mesMas(mesInicio,-1)+'-25',mesMas(mesInicio,(n||6))+'-05');
  const filas=[];let acumulado=0;
  for(let k=0;k<(n||6);k++){
    const m=mesMas(mesInicio,k);
    const seguros=+((segTodos.filter(x=>String(x.fecha||'').slice(0,7)===m)).reduce((s,x)=>s+(+x.importe||0),0)).toFixed(2);
    let pagar=0,cobrar=0;
    (facturas||[]).forEach(f=>{
      if(!f||f.activa===false)return;
      const saldo=getSaldoF?Math.max(+getSaldoF(f)||0,0):0;
      if(saldo<=0)return;
      const v=String(f.vencimiento||f.fecha||'').slice(0,7);
      if(!(v===m||(k===0&&v&&v<mesInicio)))return; // lo atrasado cae al primer mes
      if(esDeudaProveedor(f))pagar+=saldo;
      else if(f.tipo==='cobro')cobrar+=saldo;
    });
    const rec=recDeMes(m);
    // Con presupuesto: el bruto mensual (1 o 2 pagas) SUSTITUYE a nóminas+SS,
    // y las líneas recurrentes de Seguridad Social se descuentan para no
    // contar la TGSS dos veces (el presupuesto ya la incluye).
    const nominasMes=conPresupuesto?personalDeMes(m):nominas;
    const recSS=conPresupuesto?+((rec.lineas||[]).filter(l=>l.categoria==='Seguridad Social').reduce((s2,l)=>s2+Math.abs(+l.importe||0),0)).toFixed(2):0;
    const recImp=+(rec.imp-recSS).toFixed(2);
    const salidas=+(nominasMes+ss+seguros+pagar+recImp).toFixed(2);
    const neto=+(cobrar-salidas).toFixed(2);
    acumulado=+(acumulado+neto).toFixed(2);
    filas.push({mes:m,nominas:nominasMes,ss,seguros,recurrentes:recImp,recLineas:rec.lineas,pagar:+pagar.toFixed(2),cobrar:+cobrar.toFixed(2),salidas,neto,acumulado});
  }
  return {filas,nominas:conPresupuesto?personalDeMes(mesInicio):nominas,ss,ssAprendida,conPresupuesto,prExtras,necesidad:+Math.max(0,-Math.min(0,...filas.map(f=>f.acumulado))).toFixed(2)};
};
export {mesMas,previsionTesoreria};
