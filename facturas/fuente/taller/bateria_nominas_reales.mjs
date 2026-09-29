// ═══ NÓMINAS REALES · el cuadre y su reparador ════════════════════════════
// Ancla: las 18 nóminas de BIG HOUSE de agosto de 2026 (NOMINAS_BIG_HOUSE.pdf).
// Las cifras están transcritas de los recibos, NO del PDF: la batería no
// depende de ningún fichero externo y los datos que viajan son importes, sin
// NIF ni domicilios.
//
// REGRESIÓN VIVA que esta batería congela: el lector confundía la línea
// «TOTAL APORTACIONES» (lo que aporta el trabajador a la SS) con «B. TOTAL A
// DEDUCIR» (la suma de TODAS las deducciones). Como el total a deducir ya
// incluye el IRPF y la especie, el cuadre los restaba dos veces y 17 de las 18
// nóminas salían en rojo en la pantalla de Jesús.
//
// Se exige: 17 en rojo con la lectura mala · 0 tras el reparador · 17 avisos
// escritos · y los LÍQUIDOS intactos, porque son el único importe que mueve
// dinero.
import esbuild from 'esbuild';
import os from 'os';
import path from 'path';

const tmp=path.join(os.tmpdir(),'_bh10_emb_'+process.pid+'.mjs');
await esbuild.build({entryPoints:['src/embargos.js'],bundle:true,format:'esm',outfile:tmp,logLevel:'error'});
const E=await import(tmp);

// n, devengado, especie, ssREAL(aportaciones), ssLEÍDO(=B.TOTAL A DEDUCIR), IRPF, líquido, otras
const N=[
 ['CAMPEAN',   8267.86,787.50,   0.00,3267.86,2480.36,5000.00,   0],
 ['ANCA',      2285.81, 21.87, 169.63, 485.81, 294.31,1800.00,   0],
 ['LEONTE',    2086.67,378.00,   0.00, 586.67, 208.67,1500.00,   0],
 ['NEGREA',    1748.93, 18.35, 130.87, 348.93, 199.71,1400.00,   0],
 ['GOMEZ',     2028.55, 39.17, 150.65, 428.55, 238.73,1600.00,   0],
 ['MOLDOVAN',  2933.49, 44.80, 213.16, 633.49, 375.53,2300.00,   0],
 ['RINCON',    1823.49, 38.29, 136.88, 477.19, 248.32,1346.30,53.70],
 ['ABABOU',    1958.49, 38.29, 145.65, 358.49, 174.55,1600.00,   0],
 ['NEGGAZ',    1972.22, 38.29, 146.55, 472.22, 287.38,1500.00,   0],
 ['RODRIGUEZ', 2069.65, 39.17, 153.32, 469.65, 277.16,1600.00,   0],
 ['ALILECH',   1665.17, 36.13, 125.43, 265.17, 103.61,1400.00,   0],
 ['CALUGAR',   1859.43, 38.29, 139.21, 359.43, 181.93,1500.00,   0],
 ['ARZAZ',     1602.17, 37.19, 122.13, 352.44, 193.12,1249.73,   0],
 ['TAZI',      1522.67, 36.13, 116.18, 311.96, 159.65,1210.71,   0],
 ['MOUSSAOUI', 1522.67, 36.13, 116.18, 311.96, 159.65,1210.71,   0],
 ['SALCEDO',   1522.67, 36.13, 116.18, 218.46,  66.15,1304.21,   0],
 ['YAACOUBI',  1602.90, 39.17, 122.99, 217.83,  55.67,1385.07,   0],
 ['BASOUR',    1338.05,  0.00, 101.95, 101.95,   0.00,1236.10,   0],
];
let fallos=0;
const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};
const mal=(r)=>({dev:r[1],esp:r[2],ss:r[4],irC:r[5],liq:r[6],otras:r[7]});   // como lo leía
const bien=(r)=>({dev:r[1],esp:r[2],ss:r[3],irC:r[5],liq:r[6],otras:r[7]});  // como debe leerse

console.log('── 1 · las 18 nóminas de Jesús cuadran con el campo BUENO ──');
const conBueno=N.filter(r=>!E.cuadraNomina(bien(r)).ok);
ok(conBueno.length===0,`18/18 cuadran leyendo TOTAL APORTACIONES${conBueno.length?' → fallan '+conBueno.map(r=>r[0]).join(', '):''}`);
ok(E.cuadraNomina(bien(N[6])).ok,'RINCON cuadra CON su embargo de 53,70 € (necesita el campo «otras»)');
ok(!E.cuadraNomina({...bien(N[6]),otras:0}).ok,'…y sin contar el embargo NO cuadra: el campo «otras» hace falta de verdad');

console.log('── 2 · la lectura MALA reproduce lo que veía en pantalla ──');
const rojas=N.filter(r=>!E.cuadraNomina(mal(r)).ok);
ok(rojas.length===17,`con «B. TOTAL A DEDUCIR» salen ${rojas.length} en rojo (la pantalla mostraba 17)`);
ok(E.cuadraNomina(mal(N[17])).ok,'BASOUR es la única que cuadraba igualmente: su total a deducir SÍ era la aportación');

console.log('── 3 · el reparador deshace la confusión ──');
let reparadas=0, avisos=0, liquidosIntactos=true;
for(const r of N){
  const leida=mal(r);
  const rep=E.repararNomina(leida);
  if(rep.aviso)avisos++;
  if(E.cuadraNomina(rep.nom).ok)reparadas++;
  if(+rep.nom.liq!==+leida.liq)liquidosIntactos=false;
  if(rep.aviso&&Math.abs(rep.nom.ss-r[3])>0.005)
    ok(false,`${r[0]}: despeja ${rep.nom.ss} y la nómina dice ${r[3]}`);
}
ok(reparadas===18,`tras reparar cuadran ${reparadas}/18`);
ok(avisos===17,`se escriben ${avisos} avisos visibles (uno por cada corrección)`);
ok(liquidosIntactos,'NINGÚN líquido tocado: es el único importe que mueve dinero');

console.log('── 4 · no repara lo que no debe ──');
// OJO: 2000−1500=500 SÍ es la huella; ese caso la app hace bien en repararlo.
const inventada={dev:2000,esp:0,ss:300,irC:100,liq:1500,otras:0};  // 2000−1500=500 ≠ 300
ok(!E.repararNomina(inventada).aviso,'un descuadre sin la huella exacta se queda en rojo, sin maquillar');
const yaBien=E.repararNomina(bien(N[1]));
ok(!yaBien.aviso&&yaBien.nom.ss===N[1][3],'una nómina que ya cuadra no se toca');
const imposible={dev:1000,esp:0,ss:400,irC:900,liq:600,otras:0};   // huella sí, pero despeja negativo
ok(!E.repararNomina(imposible).aviso,'si al despejar sale negativo, no se corrige');

console.log('── 5 · el embargo que NO está en ficha tiene que avisar ──');
const CARLOS={dev:1823.49,esp:38.29,ss:136.88,irC:248.32,liq:1346.30,otras:53.70,otrasTxt:'Embargo Salarial'};
const sinFicha={nombre:'RINCON MUÑOZ, CARLOS ENRIQUE',nif:'03826848Q'};
const conFicha={...sinFicha,embargo:'607/2024',embargoIban:'ES9121000418450200051332',embargoRef:'607/2024'};
const av=E.embargoSinFicha(CARLOS,sinFicha);
ok(!!av&&/53\.70|53,70/.test(av),'avisa cuando la nómina trae embargo y la ficha no lo tiene: «'+av.slice(0,72)+'…»');
ok(!E.embargoSinFicha(CARLOS,conFicha),'NO avisa si el embargo ya está dado de alta');
ok(!E.embargoSinFicha({...CARLOS,otrasTxt:'Anticipo'},sinFicha),'una «otra deducción» que no es embargo no dispara el aviso');
ok(!E.embargoSinFicha({...CARLOS,otras:0,otrasTxt:''},sinFicha),'sin importe no hay aviso');
const conLeido={...conFicha,embargoLeido:{imp:53.70,periodo:'2026-08'}};
const tr=E.transferenciasEmbargo([conLeido],{});
ok(tr.length===1&&!tr[0].invalido&&Math.abs(tr[0].importe-53.70)<0.005,
   `con ficha y nómina leída sale la transferencia al juzgado por ${tr[0]&&tr[0].importe} €`);
ok(E.transferenciasEmbargo([sinFicha],{}).length===0,'sin embargo en ficha no se inventa ninguna transferencia');

console.log('── 6 · si el importe del embargo CAMBIA, manda la nómina ──');
const juz={nombre:'RINCON MUÑOZ, CARLOS ENRIQUE',nif:'03826848Q',
  embargo:'607/2024',embargoIban:'ES9121000418450200051332',embargoRef:'607/2024'};
const conImporte=(imp,per)=>E.transferenciasEmbargo([{...juz,embargoLeido:{imp,periodo:per}}],{});
const t1=conImporte(53.70,'2026-08');
ok(t1.length===1&&Math.abs(t1[0].importe-53.70)<0.005,`agosto: ${t1[0]&&t1[0].importe} €`);
const t2=conImporte(91.40,'2026-09');
ok(t2.length===1&&Math.abs(t2[0].importe-91.40)<0.005,
   `septiembre sube a 91,40 y la transferencia SIGUE a la nómina: ${t2[0]&&t2[0].importe} € (no se queda en 53,70)`);
const t3=conImporte(0,'2026-10');
ok(t3.length===1&&t3[0].cancelado===true,'si la nómina deja de traer embargo (0), se da por CANCELADO en vez de transferir');
const t4=E.transferenciasEmbargo([{...juz}],{});
ok(t4.length===1&&t4[0].invalido===true&&/sin n[oó]mina le[ií]da/i.test(t4[0].motivo||''),
   'sin nómina leída no se transfiere a ciegas: avisa de que falta pasar el PDF');
const t5=E.transferenciasEmbargo([{...juz,embargoIban:'',embargoLeido:{imp:53.70,periodo:'2026-08'}}],{});
ok(t5.length===1&&t5[0].invalido===true&&/cuenta del juzgado/i.test(t5[0].motivo||''),
   'con importe pero sin cuenta del juzgado, tampoco: avisa');

console.log(fallos?`═══ NÓMINAS REALES: ${fallos} FALLOS ═══`:'═══ NÓMINAS REALES: 18/18 CUADRAN · 17 REPARADAS · LÍQUIDOS INTACTOS ═══');
process.exit(fallos?1:0);
