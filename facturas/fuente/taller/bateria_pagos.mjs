// ═══ BATERÍA · PAGAR ANTICIPOS Y PAGOS PARCIALES (v380) ═══════════════════
// Jesús (07-09-2026): «NECESITO PODER PAGAR LOS ANTICIPOS, TAMBIÉN PODER PAGAR
// UN IMPORTE DISTINTO AL TOTAL DE LA FACTURA PARA PAGOS PARCIALES».
// Lo segundo YA funcionaba (la ventana propone el saldo pero admite cualquier
// importe); lo primero no: el botón de pagar estaba excluido para los anticipos
// a propósito, y no debía estarlo — un anticipo es justo lo primero que se paga.
import fs from 'fs';
import {getSaldo,getTotalPagado,getEstado} from '../src/saldos.js';
let n=0,mal=0;const ok=(c,t)=>{n++;if(!c){mal++;console.log('  ✗',t);}else console.log('  ✓',t);};
const app=fs.readFileSync('src/app.jsx','utf8');

console.log('── 1 · un anticipo se puede pagar ──');
ok(/\{\(isAnticipo\?getSaldo\(inv,invoices\)>0\.01:est!=='pagada'\)&&<button/.test(app),
   'el botón de pagar ya NO excluye a los anticipos');
ok(!/\{!isAnticipo&&est!=='pagada'&&<button style=\{S\.sm\(C\.sc\)\}/.test(app),
   'y ha desaparecido la exclusión que lo impedía');
ok(/es lo primero que se paga/.test(app),'queda escrito por qué se cambió');

console.log('── 2 · con números: el saldo de un anticipo ──');
{
  const ant={id:'A1',tipo:'anticipo',total:3000,pagos:[]};
  ok(getSaldo(ant,[ant])===3000,'un anticipo sin pagar debe sus 3.000 €');
  const medio={...ant,pagos:[{importe:1000}]};
  ok(getSaldo(medio,[medio])===2000,'con un pago parcial de 1.000, quedan 2.000');
  const todo={...ant,pagos:[{importe:1000},{importe:2000}]};
  ok(getSaldo(todo,[todo])===0,'con los dos pagos, queda a cero');
  // el estado de un anticipo NUNCA es «pagada»: por eso el botón mira el SALDO
  ok(getEstado(todo,[todo])!=='pagada',
     `el estado de un anticipo pagado sigue siendo «${getEstado(todo,[todo])}»: por eso el botón se guía por el saldo y no por el estado`);
  ok(getSaldo(todo,[todo])<=0.01,'y con saldo cero el botón deja de ofrecerse');
}

console.log('── 3 · pagos parciales, en cualquier factura ──');
{
  const f={id:'F1',tipo:'factura',total:12100,pagos:[]};
  ok(getSaldo(f,[f])===12100,'sin pagos, debe el total');
  const p1={...f,pagos:[{importe:5000}]};
  ok(getSaldo(p1,[p1])===7100,'un pago de 5.000 deja 7.100 pendientes');
  ok(getEstado(p1,[p1])==='parcial','y el estado pasa a «parcial»');
  const p2={...f,pagos:[{importe:5000},{importe:3000},{importe:4100}]};
  ok(getSaldo(p2,[p2])===0,'tres pagos parciales que suman el total lo dejan a cero');
  ok(getEstado(p2,[p2])==='pagada','y entonces sí queda «pagada»');
  // pagar de más no rompe nada (a veces se paga con recargo o redondeo)
  const demas={...f,pagos:[{importe:13000}]};
  ok(getSaldo(demas,[demas])===-900,'si se paga de más, el saldo queda en negativo y se ve');
}
ok(/const imp=parseNum\(pagoForm\.importe\)\|\|0;if\(!imp\)/.test(app),'la ventana acepta el importe que escribas: solo rechaza el cero');
ok(/importe:String\(getSaldo\(inv,invoices\)\)/.test(app),'propone el saldo pendiente, pero es una propuesta, no una imposición');
ok(/pagos:\[\.\.\.\(i\.pagos\|\|\[\]\),pago\]/.test(app),'cada pago se AÑADE a los anteriores: no se pisan');

console.log('── 3b · importe parcial elegido en la lista (v381) ──');
// Jesús: «necesito poder meter a sepa la parte parcial del anticipo que se
// estime… así como el pago de los restos cuando se quiera», y lo quiso ajustar
// EN LA LISTA, al marcar cada factura.
ok(/const \[sepaImp,setSepaImp\]=useState\(\{\}\);/.test(app),'se guarda un importe por línea');
ok(/const impRemesa=\(inv\)=>/.test(app),'y hay un único sitio que decide cuánto va de cada una');
{
  // se ejecuta la lógica real de impRemesa
  const m=app.match(/const impRemesa=\(inv\)=>\{([\s\S]*?)\n  \};/);
  ok(!!m,'el cuerpo de impRemesa se puede leer y probar');
  const hacer=(sepaImp,saldo)=>new Function('sepaImp','getSaldo','invoices','parseNum','inv',m[1])
    (sepaImp,()=>saldo,[], (x)=>parseFloat(String(x).replace(',','.'))||0, {id:'X'});
  ok(hacer({},9100)===9100,'sin tocar nada va el saldo entero: como toda la vida');
  ok(hacer({X:'3000'},9100)===3000,'escribiendo 3.000 va solo esa parte');
  ok(hacer({X:'3000,50'},9100)===3000.5,'admite la coma decimal española');
  ok(hacer({X:''},9100)===9100,'vaciando el campo vuelve al saldo');
  ok(hacer({X:'0'},9100)===0,'un cero es cero: no se cuela el saldo por detrás');
}
ok(/Quedarán \{fmt\(getSaldo\(inv,invoices\)-impRemesa\(inv\)\)\} € pendientes/.test(app),
   'te dice cuánto dejas pendiente antes de generar');
ok(/Más de lo que se debe/.test(app),'y avisa en rojo si escribes más del saldo');
ok(/const puesto=Math\.min\(impRemesa\(inv\),saldo\);/.test(app),
   'el pago apuntado NUNCA supera lo que se debe, aunque se escriba de más');
ok(/importe:puesto,metodo:'Transferencia SEPA'/.test(app),
   'y se apunta lo transferido, no el saldo entero: el resto sigue pendiente');
ok(/reduce\(\(s,i\)=>s\+impRemesa\(i\),0\)/.test(app),'el total del pie suma los importes ajustados');
ok(/const suma=sel\.reduce\(\(s,i\)=>s\+impRemesa\(i\),0\);/.test(app),'y el aviso del límite del banco, también');
ok(/n\.delete\(id\);setSepaImp/.test(app),'al desmarcar una factura se olvida su importe: no queda colgado');

console.log('── 4 · el anticipo entra en la remesa SEPA ──');
// Jesús: «pero no me deja meterlos en sepa».
ok(/isAnticipo\?\(!inv\.aplicadoA&&getSaldo\(inv,invoices\)>0\.01\)/.test(app),
   'la casilla de selección ya admite anticipos con saldo pendiente');
ok(!/\{\(!isAnticipo&&inv\.tipo!=='cobro'&&est!=='pagada'&&est!=='aplicado'\)/.test(app),
   'y ha desaparecido la exclusión que lo impedía');
ok(/!inv\.aplicadoA/.test(app),
   'un anticipo YA APLICADO no se ofrece: lo que quede se paga en la definitiva, no dos veces');
// v381 · pasó de enviar el saldo a enviar el importe ajustado, que por
// defecto ES el saldo. La prueba sigue el cambio.
ok(/importe:impRemesa\(i\)/.test(app),
   'la remesa envía el importe de cada línea (por defecto, su saldo), nunca el total');

console.log('── 5 · el pago de la diferencia sale solo ──');
{
  // Con el anticipo aplicado, la definitiva debe la diferencia: eso es lo que
  // viaja al banco, sin que Jesús tenga que calcular nada.
  const ant={id:'A1',tipo:'anticipo',total:3000,pagos:[{importe:3000}],aplicadoA:'F1'};
  const def={id:'F1',tipo:'factura',total:12100,pagos:[]};
  const todas=[ant,def];
  ok(getSaldo(def,todas)===9100,'la definitiva de 12.100 con 3.000 de anticipo aplicado debe 9.100');
  ok(getSaldo(ant,todas)===0,'y el anticipo ya pagado no debe nada: no se paga dos veces');
  const cubierto={...ant,total:12100,pagos:[{importe:12100}]};
  ok(getSaldo(def,[cubierto,def])===0,'si el anticipo cubría todo, la definitiva no va al banco');
}

console.log('── 4 · sigue habiendo permisos y trazabilidad ──');
ok(/sinAccion\('pagos','apuntar pagos'\)/.test(app),'apuntar un pago exige permiso');
ok(/sinAccion\('pagos','quitar pagos'\)/.test(app),'y quitarlo también');
ok(/fecha:pagoForm\.fecha,importe:imp,metodo:pagoForm\.metodo,referencia:pagoForm\.referencia/.test(app),'cada pago guarda fecha, importe, forma y referencia');

console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<36){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
