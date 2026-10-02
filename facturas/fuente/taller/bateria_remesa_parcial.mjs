// ═══ BATERÍA · REMESAS CON IMPORTE MANUAL Y RESTOS (v389) ═════════════════
// Jesús (10-09-2026): «quiero que revises la generación de remesas con
// importes manuales y de las remesas a generar de los importes restantes en
// la siguiente remesa».
// Se sigue el dinero de remesa en remesa, con números, reproduciendo la
// lógica REAL (impRemesa + el apunte del pago con su tope).
import fs from 'fs';
import {getSaldo,getEstado} from '../src/saldos.js';
let n=0,mal=0;const ok=(c,t)=>{n++;if(!c){mal++;console.log('  ✗',t);}else console.log('  ✓',t);};
const app=fs.readFileSync('src/app.jsx','utf8');
const parseNum=x=>parseFloat(String(x).replace(/\./g,'').replace(',','.'))||0;

// la lógica real de impRemesa, extraída y ejecutada
const m=app.match(/const impRemesa=\(inv\)=>\{([\s\S]*?)\n  \};/);
ok(!!m,'impRemesa se puede leer y ejecutar tal cual está en la app');
const impRemesa=(sepaImp,inv,invoices)=>new Function('sepaImp','getSaldo','invoices','parseNum','inv',m[1])
  (sepaImp,(i,all)=>getSaldo(i,all),invoices,parseNum,inv);
// el apunte del pago, como lo hace generateSEPA (importe = min(puesto, saldo))
const apuntar=(inv,invoices,sepaImp,fecha,ref)=>{
  const saldo=getSaldo(inv,invoices);
  if(saldo<=0.01)return inv;
  const puesto=Math.min(impRemesa(sepaImp,inv,invoices),saldo);
  return {...inv,pagos:[...(inv.pagos||[]),{fecha,importe:puesto,metodo:'Transferencia SEPA',referencia:ref}]};
};

console.log('── 1 · el recorrido de Jesús: 9.100 € en tres remesas ──');
{
  let f={id:'F1',tipo:'factura',total:9100,pagos:[]};
  let todas=[f];
  // remesa 1: escribe 3.000 a mano
  ok(impRemesa({F1:'3000'},f,todas)===3000,'remesa 1: al banco van los 3.000 escritos');
  f=apuntar(f,todas,{F1:'3000'},'2026-09-10','R1');todas=[f];
  ok(getSaldo(f,todas)===6100,'tras ejecutarse, quedan 6.100 pendientes');
  ok(getEstado(f,todas)==='parcial','y la factura consta como parcial');
  // remesa 2: la vuelve a marcar SIN tocar el importe
  ok(impRemesa({},f,todas)===6100,'remesa 2: sin tocar nada, se propone EL RESTO (6.100), no el total');
  // pero esta vez paga 2.000
  f=apuntar(f,todas,{F1:'2000'},'2026-09-17','R2');todas=[f];
  ok(getSaldo(f,todas)===4100,'quedan 4.100');
  // remesa 3: el resto entero
  f=apuntar(f,todas,{},'2026-09-24','R3');todas=[f];
  ok(getSaldo(f,todas)===0,'remesa 3: el resto sale solo y la deja a cero');
  ok(getEstado(f,todas)==='pagada','pagada del todo');
  ok((f.pagos||[]).length===3,'con sus tres pagos apuntados, uno por remesa');
  ok(f.pagos.map(p=>p.referencia).join(',')==='R1,R2,R3','cada uno con la referencia de SU remesa');
  ok(+(f.pagos.reduce((s,p)=>s+p.importe,0)).toFixed(2)===9100,'y la suma clava el total: 9.100,00');
}

console.log('── 2 · un anticipo, igual ──');
{
  let a={id:'A1',tipo:'anticipo',total:5000,pagos:[]};let todas=[a];
  ok(impRemesa({A1:'1500'},a,todas)===1500,'un anticipo también admite importe manual');
  a=apuntar(a,todas,{A1:'1500'},'2026-09-10','R1');todas=[a];
  ok(getSaldo(a,todas)===3500,'y deja su resto para la siguiente');
  a=apuntar(a,todas,{},'2026-09-17','R2');todas=[a];
  ok(getSaldo(a,todas)===0,'que sale entero en la remesa 2');
}

console.log('── 3 · torpezas que no deben costar dinero ──');
{
  const f={id:'F2',tipo:'factura',total:500,pagos:[]};const todas=[f];
  // escribe MÁS de lo que debe y genera igual
  const f2=apuntar(f,todas,{F2:'800'},'2026-09-10','R1');
  ok(f2.pagos[0].importe===500,'aunque se escriba 800 debiendo 500, el pago apuntado se queda en 500');
  // coma española y puntos de miles
  ok(impRemesa({F2:'1.234,56'},{id:'F2',tipo:'factura',total:2000,pagos:[]},[{id:'F2',tipo:'factura',total:2000,pagos:[]}])===1234.56,
     '«1.234,56» se entiende como 1.234,56, no como 1,23');
  // cero y vacío
  ok(impRemesa({F2:'0'},f,todas)===0,'un 0 escrito es 0 (y la revisión previa no deja generar esa línea)');
  ok(impRemesa({F2:''},f,todas)===500,'vaciar la casilla vuelve al saldo');
  // una factura que quedó pagada por otra vía no recibe pago aunque siga marcada
  const pagada={id:'F3',tipo:'factura',total:100,pagos:[{importe:100}]};
  ok(apuntar(pagada,[pagada],{F3:'100'},'2026-09-10','R1')===pagada,'una ya pagada se salta: ni un euro duplicado');
}

console.log('── 4 · la ventana de repaso enseña la verdad (v389) ──');
{
  const mod=fs.readFileSync('src/modales.jsx','utf8');
  ok(/const total=sel\.reduce\(\(s,i\)=>s\+impRemesa\(i\),0\);/.test(mod),'el total de la ventana suma lo que va al banco');
  ok(/const va=impRemesa\(inv\);/.test(mod),'y cada línea enseña su importe real');
  ok(/\{va<saldo-0\.005&&<span[^>]*>de \{fmt\(saldo\)\}/.test(mod),'con el «de X €» al lado cuando es una parte');
  ok(/title="Quitar esta línea de la remesa"/.test(mod),'cada línea lleva su aspa para quitarla desde ahí');
  ok(/if\(selected\.size<=1\)setShowSepa\(false\);\s*\n\s*toggleSelect\(inv\.id\);/.test(mod),
     'y al quitar la última, la ventana se cierra en vez de quedarse vacía');
  ok(/impRemesa,invoices,openProvModal,selected/.test(mod)&&/setShowSepa,toggleSelect,/.test(fs.readFileSync('src/app.jsx','utf8')),
     'la ventana recibe las dos herramientas desde la app');
}

console.log('── 5 · el descarte durante la tanda no resucita (v389) ──');
{
  ok(/const descartadasRef=useRef\(new Set\(\)\);/.test(app),'hay memoria de lo descartado');
  ok((app.match(/\.filter\(r=>!descartadasRef\.current\.has\(String\(r\.inv&&r\.inv\.id\)\)\)/g)||[]).length===2,
     'y las DOS escrituras de la búsqueda la respetan: la tanda en marcha ya no resucita lo quitado');
  ok(/descartadasRef\.current\.add\(String\(r\.inv\.id\)\);/.test(app),'el aspa de la factura apunta el descarte');
  ok(/descartadasRef\.current=new Set\(\);/.test(app),'y al empezar de cero, se olvida: no arrastra descartes viejos');
}

console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<25){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
