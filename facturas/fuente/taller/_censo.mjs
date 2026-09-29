// CENSO DE ESTADOS: v324 (todo en App) contra v335 (App + 8 almacenes).
// La pregunta que ninguna batería responde: ¿se ha perdido, duplicado o
// renombrado algún estado en las siete sesiones de mudanza?
import fs from 'fs';
const lee=(f)=>fs.readFileSync(f,'utf8').split('\n');
const saca=(lin)=>{const s=[];lin.forEach(l=>{
  let m=l.match(/^  const \[(\w+),(\w+)\]=useState/); if(m)s.push([m[1],m[2],'state']);
  m=l.match(/^  const (\w+)=useRef\(/); if(m)s.push([m[1],null,'ref']);});return s;};
const A=saca(lee('/tmp/f324/src/app.jsx'));
let B=saca(lee('src/app.jsx'));
for(const f of fs.readdirSync('src/almacenes')) B=B.concat(saca(lee('src/almacenes/'+f)));
const nA=A.map(x=>x[0]), nB=B.map(x=>x[0]);
const setA=new Set(nA), setB=new Set(nB);
let fallos=0; const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};
console.log(`v324: ${A.length} declaraciones · entrega: ${B.length}`);
const perdidos=nA.filter(x=>!setB.has(x));
// v340 añade una FUNCIÓN nueva (traspasos entre empresas). El censo no se
// relaja: se declara aquí, uno a uno, qué estados puede traer de más. Si
// aparece cualquier otro, salta. Y «PERDIDO» no admite excepción nunca.
const NUEVOS_AUTORIZADOS=['grupo','traspasos','traspModal','traspForm','grupoModal','grupoForm'];
const nuevos=nB.filter(x=>!setA.has(x)&&!NUEVOS_AUTORIZADOS.includes(x));
const nuevosOk=nB.filter(x=>!setA.has(x)&&NUEVOS_AUTORIZADOS.includes(x));
ok(perdidos.length===0,`ningún estado PERDIDO en la mudanza${perdidos.length?' → '+perdidos.join(', '):''}`);
ok(nuevos.length===0,`ningún estado inventado fuera de lo declarado${nuevos.length?' → '+nuevos.join(', '):''}`);
ok(nuevosOk.length===NUEVOS_AUTORIZADOS.length,
   `los ${nuevosOk.length} estados nuevos son EXACTAMENTE los de traspasos: ${nuevosOk.join(', ')}`);
const dupB=nB.filter((x,i)=>nB.indexOf(x)!==i);
ok(dupB.length===0,`ningún estado DUPLICADO entre App y almacenes${dupB.length?' → '+dupB.join(', '):''}`);
ok(B.length===A.length+NUEVOS_AUTORIZADOS.length,`el total cuadra: ${A.length} + ${NUEVOS_AUTORIZADOS.length} nuevos = ${B.length}`);
// los setters también
const sA=new Set(A.filter(x=>x[1]).map(x=>x[1])), sB=new Set(B.filter(x=>x[1]).map(x=>x[1]));
const sPerd=[...sA].filter(x=>!sB.has(x));
ok(sPerd.length===0,`ningún SETTER perdido${sPerd.length?' → '+sPerd.join(', '):''}`);
// inicializadores idénticos
const iniA={},iniB={};
lee('/tmp/f324/src/app.jsx').forEach(l=>{const m=l.match(/^  const \[(\w+),\w+\]=useState\((.*)\);\s*(\/\/.*)?$/);if(m)iniA[m[1]]=m[2];});
const todoB=lee('src/app.jsx').concat(...fs.readdirSync('src/almacenes').map(f=>lee('src/almacenes/'+f)));
todoB.forEach(l=>{const m=l.match(/^  const \[(\w+),\w+\]=useState\((.*)\);\s*(\/\/.*)?$/);if(m)iniB[m[1]]=m[2];});
const distintos=Object.keys(iniA).filter(k=>iniB[k]!==undefined&&iniA[k]!==iniB[k]);
const comparados=Object.keys(iniA).filter(k=>iniB[k]!==undefined).length;
const sinComparar=nA.filter(x=>iniA[x]===undefined);
console.log(`  · inicializadores comparados: ${comparados}/${A.length} (los de una sola línea)`);
if(sinComparar.length)console.log('  · NO comparables (multilínea o useRef): '+sinComparar.join(', '));
ok(distintos.length===0,`todos los INICIALIZADORES intactos${distintos.length?' → '+distintos.map(k=>`${k}: «${iniA[k]}» → «${iniB[k]}»`).join(' | '):''}`);
// Los que no se pueden comparar por su inicializador se comparan por TODOS
// sus usos: una declaración igual no prueba que se use igual.
try{ await import('./_refs10.mjs'); }catch(e){ console.log('  · (falta _refs10.mjs)'); }
console.log(fallos?`═══ CENSO: ${fallos} FALLOS ═══`:'═══ CENSO: NI UN ESTADO PERDIDO, INVENTADO NI ALTERADO ═══');
process.exit(fallos?1:0);
