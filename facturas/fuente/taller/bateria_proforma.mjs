// ═══ BATERÍA · DE PROFORMA A FACTURA DEFINITIVA (v377) ════════════════════
// Jesús (07-09-2026): «una factura que tengo como proforma, o como pago
// anticipado de un pedido, no tenemos forma de pasarlo a factura definitiva
// una vez escaneamos la factura correcta… he tenido que escanear la factura
// como si fuera nueva, darla por pagada y eliminar el apunte de la proforma,
// pero me parece poco operativo».
// Ese apaño perdía el pago y el documento del anticipo. Aquí se comprueba el
// camino nuevo: escanear la definitiva DESDE el anticipo y que el dinero ya
// pagado se descuente solo.
import fs from 'fs';
let n=0,mal=0;const ok=(c,t)=>{n++;if(!c){mal++;console.log('  ✗',t);}else console.log('  ✓',t);};
const app=fs.readFileSync('src/app.jsx','utf8');

console.log('── 1 · el camino existe desde el anticipo ──');
ok(/const facturaDeAnticipo=\(ant\)=>/.test(app),'hay una salida desde la ficha del anticipo');
ok(/isAnticipo&&!inv\.aplicadoA&&!esLector\(\)/.test(app),'el botón sale solo en anticipos SIN aplicar (uno ya aplicado no se toca)');
ok(/📸 Factura definitiva/.test(app),'y se llama por lo que hace');
ok(/sinAccion\('facturas','registrar la factura definitiva'\)/.test(app),'sujeto a permisos');

console.log('── 2 · la definitiva nace con los datos del anticipo ──');
ok(/proveedor:ant\.proveedor\|\|''/.test(app)&&/proveedorCif:ant\.proveedorCif/.test(app),'proveedor y CIF vienen puestos');
ok(/obra:ant\.obra\|\|''/.test(app)&&/esEstructural:!!ant\.esEstructural/.test(app),'y la obra y si es gasto de estructura');
ok(/ibanProveedor:ant\.ibanProveedor/.test(app),'y el IBAN, para la remesa');
ok(/_deAnticipo:ant\.id/.test(app),'queda marcado de qué anticipo viene');
ok(/tipo:ant\.tipo==='cobro'\?'cobro':'factura'/.test(app),'una proforma emitida da factura emitida; una recibida, recibida');

console.log('── 3 · al guardar, el anticipo queda aplicado ──');
ok(/const _deAnt=inv\._deAnticipo; delete inv\._deAnticipo;/.test(app),'la marca se aparta antes de guardar: no ensucia la factura');
ok(/i\.id===_deAnt\?\{\.\.\.i,aplicadoA:inv\.id\}:i/.test(app),'y el anticipo apunta a la nueva factura');
ok(/quedan \$\{fmt\(queda\)\} € por pagar/.test(app),'te dice cuánto queda por pagar');
ok(/queda saldada/.test(app),'o que ya está saldada si el anticipo lo cubría todo');

console.log('── 4 · las cuentas cuadran (la lógica de saldos, con números) ──');
{
  // Se reproduce el criterio de la app: un anticipo aplicado cuenta como pago
  // de la factura a la que se aplica.
  const pagado=(inv,todas)=>(inv.pagos||[]).reduce((a,p)=>a+(+p.importe||0),0)
    +todas.filter(a=>a.tipo==='anticipo'&&a.aplicadoA===inv.id&&!a.anulada).reduce((a,x)=>a+(+x.total||0),0);
  const ant={id:'A1',tipo:'anticipo',total:3000,pagos:[{importe:3000}],aplicadoA:null};
  const def={id:'F1',tipo:'factura',total:12100,pagos:[]};
  // antes de aplicar: la factura debe 12.100 enteros
  ok(pagado(def,[ant,def])===0,'sin aplicar, la definitiva debe los 12.100 € enteros');
  const ant2={...ant,aplicadoA:'F1'};
  ok(pagado(def,[ant2,def])===3000,'aplicado, los 3.000 € del anticipo cuentan como pagados');
  ok(+(def.total-pagado(def,[ant2,def])).toFixed(2)===9100,'y quedan 9.100 € por pagar, sin tocar nada más');
  // el caso de un anticipo que cubre la factura entera
  const antG={id:'A2',tipo:'anticipo',total:12100,pagos:[{importe:12100}],aplicadoA:'F1'};
  ok(+(def.total-pagado(def,[antG,def])).toFixed(2)===0,'si el anticipo cubría todo, la definitiva nace saldada');
  // y lo que Jesús hacía a mano: borrar el anticipo perdía el pago
  ok(pagado(def,[def])===0,'borrar el anticipo (el apaño de antes) dejaba la factura como impagada: por eso había que darla por pagada a mano');
}

console.log('── 5 · nada de lo que ya funcionaba se toca ──');
ok(/⏩ Vincular anticipo/.test(app),'sigue existiendo el camino contrario, desde la factura');
ok(/const unlinkAnticipo=/.test(app),'y se puede desvincular');
ok(/anticiposLibres=useMemo/.test(app),'los anticipos sin aplicar se siguen contando aparte');

console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<18){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
