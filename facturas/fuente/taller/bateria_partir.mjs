// ═══ BATERÍA · PARTIR REMESAS C34 (v349) ══════════════════════════════════
// Cubre src/partir.js: el reparto bajo el límite del banco (por remesa y
// día), el escalonado en días hábiles y el C34 reconstruido desde las
// líneas guardadas del histórico. Umbral mínimo de comprobaciones para que
// no pueda pasar en vacío.
import {repartirLineas,fechasEscalonadas,construirC34DeTxns} from '../src/partir.js';

let n=0,mal=0;
const ok=(cond,txt)=>{n++;if(!cond){mal++;console.log('  ✗',txt);}else console.log('  ✓',txt);};
const r2=(x)=>Math.round(x*100)/100;

// ── reparto ───────────────────────────────────────────────────────────────
const tx=(nom,imp)=>({n:nom,imp,c:`F-${nom}`,ib:`ES9121000418450200051332`});
{
  const lineas=[tx('A',35000),tx('B',25000),tx('C',24000),tx('D',18000),tx('E',12000),tx('F',6000)];
  const partes=repartirLineas(lineas,60000);
  const suma=r2(partes.reduce((s,p)=>s+p.total,0));
  ok(suma===120000,`reparto conserva la suma total (${suma})`);
  ok(partes.every(p=>p.total<=60000.001),'ninguna parte supera el límite');
  ok(partes.length===2,`FFD usa pocas cajas: 2 partes para 120k/60k (salen ${partes.length})`);
  ok(partes.every(p=>!p.excede),'sin líneas marcadas excede cuando todas caben');
  const nombres=partes.flatMap(p=>p.txns.map(t=>t.n)).sort().join('');
  ok(nombres==='ABCDEF','no se pierde ni se duplica ninguna línea');
  const primera=partes[0].txns.map(t=>t.n).join('');
  ok(primera===primera.split('').sort().join(''),'dentro de cada parte se conserva el orden original');
}
{
  // línea que por sí sola pasa del límite: sola en su fichero y marcada
  const partes=repartirLineas([tx('GRANDE',70000),tx('P1',10000),tx('P2',9000)],60000);
  const grande=partes.find(p=>p.excede);
  ok(!!grande&&grande.txns.length===1&&grande.txns[0].n==='GRANDE','la que excede va sola y marcada excede=true');
  ok(partes.filter(p=>!p.excede).every(p=>p.total<=60000.001),'el resto sigue bajo el límite');
  const suma=r2(partes.reduce((s,p)=>s+p.total,0));
  ok(suma===89000,`suma intacta con línea excedida (${suma})`);
}
{
  // céntimos: nada de flotantes acumulando basura
  const partes=repartirLineas([tx('a',0.1),tx('b',0.2),tx('c',59999.7)],60000);
  ok(partes.length===1&&partes[0].total===60000,'céntimos redondeados: 0.1+0.2+59999.7 cabe justo en una parte');
  const sin=repartirLineas([],60000);
  ok(Array.isArray(sin)&&sin.length===0,'lista vacía → cero partes, sin explotar');
  const sinLim=repartirLineas([tx('x',1e9)],0);
  ok(sinLim.length===1&&!sinLim[0].excede,'límite 0 = sin límite (todo en una parte)');
}

// ── fechas escalonadas ────────────────────────────────────────────────────
{
  const f=fechasEscalonadas('2026-09-03',4); // jueves
  ok(f.join(',')==='2026-09-03,2026-09-04,2026-09-07,2026-09-08','jue→vie→LUNES→martes: el finde se salta');
  const g=fechasEscalonadas('2026-09-05',2); // sábado
  ok(g[0]==='2026-09-07','arrancar en sábado corre al lunes');
  ok(fechasEscalonadas('porqueria',3).length===0,'fecha inválida → lista vacía, sin NaN');
}

// ── C34 desde txns del histórico ──────────────────────────────────────────
{
  const ordenante={name:'BIG HOUSE 2010 S.L.',cif:'B45731981',iban:'ES30 3081 0231 1131 8879 2422',bic:'ERSVES22',address:'CL Neón s/n',city:'Illescas',country:'ES'};
  const lineas=[{n:'FERRETERÍA <PACO> & HIJOS',imp:1234.5,c:'F-88 - tornillería',ib:'ES9121000418450200051332'},
                {n:'ÁRIDOS DEL SUR',imp:250.25,c:'F-90',ib:'ES6621000418401234567891'}];
  const xml=construirC34DeTxns({ordenante,txns:lineas,fechaEjec:'2026-09-03',msgId:'BIOH-TEST-P1',ahora:'2026-08-31T10:00:00Z',tipo:'prov',
    bicDe:(ib)=>ib.startsWith('ES91')?'CAIXESBB':''});
  ok(xml.includes('pain.001.001.09'),'esquema pain.001.001.09');
  ok(xml.includes('<NbOfTxs>2</NbOfTxs>'),'NbOfTxs=2');
  ok(xml.includes('<CtrlSum>1484.75</CtrlSum>'),'CtrlSum con dos decimales exactos');
  ok(xml.includes('<InstdAmt Ccy="EUR">1234.50</InstdAmt>'),'importe de línea a dos decimales');
  ok(xml.includes('FERRETERÍA &lt;PACO&gt; &amp; HIJOS'),'nombre con <> & escapado en XML');
  ok(xml.includes('<IBAN>ES9121000418450200051332</IBAN>'),'IBAN del acreedor sin espacios');
  ok(xml.includes('<IBAN>ES3030810231113188792422</IBAN>'),'IBAN del ordenante normalizado');
  ok(xml.includes('<BICFI>CAIXESBB</BICFI>'),'BIC de línea resuelto vía bicDe');
  ok((xml.match(/<CdtrAgt>/g)||[]).length===1,'la línea sin BIC va SIN CdtrAgt (SEPA lo admite)');
  ok(xml.includes('<Cd>SUPP</Cd>'),'Purp SUPP en proveedores');
  ok(xml.includes('<MsgId>BIOH-TEST-P1</MsgId>')&&xml.includes('PmtInfId>SEPA SUPP BIOH-TEST-P1'),'msgId propio de la parte');
  ok(xml.includes('<Dt>2026-09-03</Dt>'),'fecha de ejecución de la parte');
  ok(xml.includes('<Id>B45731981000</Id>'),'sufijo 000 del CIF ordenante (como el generador de la app)');
  const nom=construirC34DeTxns({ordenante,txns:lineas,fechaEjec:'2026-09-03',msgId:'M2',tipo:'nom'});
  ok(nom.includes('<Cd>SALA</Cd>')&&nom.includes('SEPA NOM M2'),'tipo nom → SALA y prefijo SEPA NOM');
  // ida y vuelta con el reparto: cada parte genera un XML cuya CtrlSum casa
  const partes=repartirLineas([tx('A',35000),tx('B',30000),tx('C',20000)],60000);
  const sumas=partes.map(p=>construirC34DeTxns({ordenante,txns:p.txns,fechaEjec:'2026-09-03',msgId:'X',tipo:'prov'}))
    .map(x=>+x.match(/<CtrlSum>([\d.]+)<\/CtrlSum>/)[1]);
  ok(r2(sumas.reduce((s,a)=>s+a,0))===85000,'ida y vuelta reparto→XML: las CtrlSum suman el total original');
}

console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<25){console.log('✗ BATERÍA VACÍA: menos de 25 comprobaciones');process.exit(1);}
process.exit(mal?1:0);
