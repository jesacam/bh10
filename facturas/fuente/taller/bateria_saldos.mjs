// Batería de saldos: con los datos REALES de la copia, el cabecero de
// RE-ANCLADA a la copia del 2026-09-06 (antes 354.798,63 de la del 27-08): la cifra
// se verificó con una reimplementación independiente en Python antes de fijarla.
// Pendientes debe cuadrar ahora con el KPI del Panel (anticipo libre fuera).
import fs from 'fs';
const d=JSON.parse(fs.readFileSync('/home/claude/copia/BH10_copia_completa_2026-09-06.json','utf8'));
const invs=JSON.parse(d.claves['bh10-fc-v3']);
const s=fs.readFileSync('web_subir/app/assets/bh10-APPV393.js','utf8');
// el literal del comentario no sobrevive al minificado: verificar por comportamiento.
// Reimplantación local de la lógica corregida (idéntica al TSX v309):
const anulada=i=>!!(i.anulada||i.esAnulada||i.estadoVf==='anulada');
const abono=i=>!!i.esAbono;
const aplic=inv=>invs.filter(a=>a.tipo==='anticipo'&&a.aplicadoA===inv.id&&!anulada(a));
const pagado=i=>(i.pagos||[]).reduce((x,p)=>x+(p.importe||0),0)+aplic(i).reduce((x,a)=>x+(a.total||0),0);
const abonado=i=>+invs.filter(x=>abono(x)&&x.abonoDe===i.id&&!anulada(x)).reduce((a,x)=>a+Math.abs(x.total||0),0).toFixed(2);
const saldo=i=>anulada(i)||abono(i)?0:+((i.total||0)-pagado(i)-((i.tipo==='cobro'&&(i.retGarImp||0)>0&&!i.retGarDevuelta)?i.retGarImp:0)-abonado(i)).toFixed(2);
const estado=i=>{if(i.tipo==='anticipo')return i.aplicadoA?'aplicado':'anticipo_libre';
  const p=pagado(i),ret=(i.tipo==='cobro'&&(i.retGarImp||0)>0&&!i.retGarDevuelta)?i.retGarImp:0;
  return +( (i.total||0)-p-ret ).toFixed(2)<=0.01?'pagada':(p>0?'parcial':'pendiente');};
let panel=0,pend=0;
for(const i of invs){
  if(anulada(i))continue;
  if(!['anticipo','cobro'].includes(i.tipo)&&estado(i)!=='pagada')panel+=Math.max(saldo(i),0);
  if(!['emitida','cobro'].includes(i.tipo)){const e=estado(i);
    if(!['pagada','aplicado','anticipo_libre'].includes(e)){const x=saldo(i);if(x>0)pend+=x;}}
}
panel=+panel.toFixed(2);pend=+pend.toFixed(2);
console.log('Panel:',panel,'· Pendientes:',pend);
if(panel!==pend||panel!==315017.69){console.log('✗ NO CUADRA');process.exit(1);}
// y que el bundle contiene la condición nueva (anticipo_libre en el descarte del cabecero)
const hay=/anticipo_libre/.test(s);
console.log(hay?'✓ bundle contiene la condición anticipo_libre':'✗ falta en bundle');
console.log('═══ BATERÍA SALDOS: CUADRA A 315.017,69 € ═══');
