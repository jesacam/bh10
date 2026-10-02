import fs from 'fs';
// ═══ NUMERACIÓN DE EMITIDAS · la serie nueva ══════════════════════════════
// Es numeración fiscal y entra en la huella VERI*FACTU: un salto, un duplicado
// o un año mal puesto no es cosmético. Se prueba la función pura, sin app.
import esbuild from 'esbuild';import os from 'os';import path from 'path';
const tmp=path.join(os.tmpdir(),'_bh10_num_'+process.pid+'.mjs');
await esbuild.build({entryPoints:['src/numeracion.js'],bundle:true,format:'esm',outfile:tmp,logLevel:'error'});
const N=await import(tmp);
let fallos=0;
const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};

console.log('── 1 · el arranque que pidió Jesús ──');
ok(N.siguienteNumero({usados:[],semilla:'2600055',fecha:'2026-08-25'})==='2600056',
   'BIG: última 2600055 → la próxima es 2600056');
ok(N.siguienteNumero({usados:[],semilla:'2600007',fecha:'2026-08-25'})==='2600008',
   'GREEN: última 2600007 → la próxima es 2600008');
ok(N.siguienteNumero({usados:[],semilla:'',fecha:'2026-08-25'})==='2600001',
   'una empresa NUEVA, sin semilla, empieza por 2600001');

console.log('── 2 · correlativo, sin saltos ni repeticiones ──');
let usados=[], sem='2600055';
const salidos=[];
for(let i=0;i<5;i++){const n=N.siguienteNumero({usados,semilla:sem,fecha:'2026-08-25'});salidos.push(n);usados.push(n);}
ok(salidos.join(',')==='2600056,2600057,2600058,2600059,2600060',`cinco seguidas: ${salidos.join(' · ')}`);
ok(new Set(salidos).size===5,'ninguna repetida');

console.log('── 3 · el cambio de año ──');
ok(N.siguienteNumero({usados:['2600060'],semilla:'2600055',fecha:'2027-01-01'})==='2700001',
   'el 1 de enero de 2027 la serie empieza por 27 y el contador vuelve a 1');
ok(N.siguienteNumero({usados:['2700001','2700002'],semilla:'2600055',fecha:'2027-06-10'})==='2700003',
   'dentro de 2027 sigue correlativo, ignorando las de 2026');
ok(N.siguienteNumero({usados:['2700003'],semilla:'',fecha:'2028-01-01'})==='2800001','y en 2028, por 28');
ok(N.siguienteNumero({usados:[],semilla:'2600055',fecha:'2027-03-01'})==='2700001',
   'la semilla de 2026 NO arrastra al contador de 2027');

console.log('── 4 · convivencia con la serie vieja ──');
ok(N.siguienteNumero({usados:['F-2026/014','F-2026/013'],semilla:'2600055',fecha:'2026-08-25'})==='2600056',
   'los F-2026/NNN antiguos no estorban ni se cuentan');
ok(N.esSerieNueva('2600056')&&!N.esSerieNueva('F-2026/014'),'distingue una serie de la otra');
ok(N.contadorDe('2600056')===56&&N.prefijoDe('2600056')==='26','sabe leer prefijo y contador');

console.log('── 5 · duplicados ──');
ok(N.estaOcupado('2600056',['2600056']),'detecta un número ya usado');
ok(N.estaOcupado('26-00056',['2600056']),'y lo detecta aunque se escriba con guiones');
ok(!N.estaOcupado('2600057',['2600056']),'y no da falso positivo con el siguiente');
ok(N.siguienteNumero({usados:['2600056','2600060'],semilla:'2600055',fecha:'2026-08-25'})==='2600061',
   'con un hueco por medio, continúa DESDE EL MAYOR: nunca reutiliza un número');

console.log('── 6 · los límites ──');
ok(N.siguienteNumero({usados:['2699998'],semilla:'',fecha:'2026-12-31'})==='2699999','llega hasta 99.999');
let reventó=false; try{N.formatear('26',100000);}catch(e){reventó=true;}
ok(reventó,'pasado el tope avisa en vez de generar un número inválido');
ok(N.siguienteNumero({usados:[null,undefined,'','  '],semilla:'2600055',fecha:'2026-08-25'})==='2600056',
   'los huecos y basura en la lista no rompen nada');


// ── 7 · EL ENGANCHE en la app (repaso v342): numEmitidaOcupado tiene que
// comparar sin signos con el norm de ESTE módulo. Se encontró que usaba
// normNumDoc (no quita guiones) y «26-00056» se colaba junto a «2600056».
console.log('── 7 · el enganche en la app ──');
const _src=fs.readFileSync('src/app.jsx','utf8');
const _i=_src.indexOf('const numEmitidaOcupado');
const _f=_src.slice(_i,_i+700);
ok(_i>0&&/normNumSerie/.test(_f)&&!/normNumDoc\(/.test(_f),
   'numEmitidaOcupado compara con el norm de numeracion.js (sin signos), no con normNumDoc');
ok(/norm as normNumSerie/.test(_src),'la app importa el norm del módulo');

console.log(fallos?`═══ NUMERACIÓN: ${fallos} FALLOS ═══`:'═══ NUMERACIÓN: SERIE AAnnnnn POR EMPRESA Y POR AÑO ═══');
process.exit(fallos?1:0);
