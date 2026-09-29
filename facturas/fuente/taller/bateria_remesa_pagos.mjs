// ═══ BATERÍA · LA REMESA APUNTA LOS PAGOS (v382) ═════════════════════════
// Jesús (08-09-2026): «He generado una remesa hoy, que he pagado en el banco.
// Y al meterme en la app ahora me sale como pendiente de pago… he tenido que
// meter a mano el pago» · «deberían darse por pagadas todas, salvo incidencia
// que lo resuelvo en tesorería… pero es incómodo tener que ir ahí después de
// ir al banco».
// La casilla «Marcar como pagadas al generar» venía activada, pero podía
// quedarse apagada y entonces el fichero salía y las facturas se quedaban sin
// pago SIN avisar. Se ha retirado: si no existe, no puede quedarse apagada.
import fs from 'fs';
let n=0,mal=0;const ok=(c,t)=>{n++;if(!c){mal++;console.log('  ✗',t);}else console.log('  ✓',t);};
const app=fs.readFileSync('src/app.jsx','utf8');
const mod=fs.readFileSync('src/modales.jsx','utf8');
const alm=fs.readFileSync('src/almacenes/facturas.js','utf8');

console.log('── 1 · el interruptor ya no existe ──');
ok(!/sepaMarkPaid/.test(app),'no queda rastro en la app');
ok(!/sepaMarkPaid/.test(mod),'ni en la ventana de la remesa');
ok(!/sepaMarkPaid/.test(alm),'ni en el almacén: no hay estado que se pueda quedar apagado');
ok(!/type="checkbox" checked=\{sepaMarkPaid\}/.test(mod),'y la casilla ha desaparecido de la pantalla');

console.log('── 2 · generar una remesa apunta los pagos, siempre ──');
ok(/metodo:'Transferencia SEPA',referencia:msgId/.test(app),'cada factura recibe su pago con la referencia del fichero');
ok(/fecha:sepaDate/.test(app),'con la fecha de ejecución que se puso, no la de hoy');
ok(/'generada · pagos apuntados'/.test(app),'y el histórico lo deja escrito');
ok(!/SIN marcar pagos/.test(app),'ya no existe el camino que generaba sin apuntar');
ok(!/Fichero SEPA generado: \$\{nbTxs\} transferencias, \$\{fmt\(parseFloat\(ctrlSum\)\)\} €`\);/.test(app),
   'ni el aviso que acompañaba a ese camino');

console.log('── 3 · la salida para cuando el banco NO la ejecute ──');
ok(/Se darán por pagadas al generar/.test(mod),'la ventana avisa de lo que va a hacer antes de generar');
ok(/Esta remesa no se ejecutó/.test(mod)||/Esta remesa no se ejecutó/.test(app),'y dice dónde deshacerlo si hace falta');
ok(/marcada como NO ejecutada/.test(app),'ese camino sigue existiendo en el histórico');
ok(/pagos apuntados a mano desde el histórico/.test(app),'y también el de apuntarlos después, por si acaso');

console.log('── 4 · lo que ya protegía, sigue ──');
ok(/if\(saldo<=0\.01\)\{saltadas\.push\(inv\);return inv;\}/.test(app),'una factura ya pagada no recibe un segundo pago');
ok(/⚠ \$\{saltadas\.length\} ya constaban pagadas/.test(app),'y se avisa de cuáles se han saltado');
ok(/const puesto=Math\.min\(impRemesa\(inv\),saldo\);/.test(app),'el pago apuntado nunca supera lo que se debe');

console.log('── 5 · el campo de importe no se queda colgado (fallo de la v381) ──');
// En la captura de Jesús, una factura YA PAGADA seguía enseñando «A la remesa: 0 €».
ok(/\{selected\.has\(inv\.id\)&&\(inv\.tipo!=='cobro'&&\(isAnticipo\?\(!inv\.aplicadoA&&getSaldo\(inv,invoices\)>0\.01\):\(est!=='pagada'&&est!=='aplicado'\)\)\)&&\(/.test(app),
   'el campo usa la MISMA condición que la casilla: si no se puede remesar, no aparece');

console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<15){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
