// Los 10 que el censo no pudo comparar: no basta con que la DECLARACIÓN sea
// igual. Se comparan TODAS las líneas que los mencionan, en v324 y en v338.
import fs from 'fs';
const L=(f)=>fs.readFileSync(f,'utf8').split('\n');
const A=L('/tmp/f324/src/app.jsx');
let B=L('src/app.jsx');
for(const f of fs.readdirSync('src/almacenes')) B=B.concat(L('src/almacenes/'+f));
const norm=(s)=>s.trim().replace(/\s+/g,' ');
const NOM=['t','hist','lupaRef','lupaInputRef','bajaTimer','gmailTokenRef','repartoCancel','vfRegRef','vfCola','usoRef'];
let dif=0;
for(const n of NOM){
  const re=new RegExp('\\b'+n+'\\b');
  const a=A.filter(l=>re.test(l)).map(norm).sort();
  const b=B.filter(l=>re.test(l)).map(norm).sort();
  const soloA=a.filter(x=>!b.includes(x)), soloB=b.filter(x=>!a.includes(x));
  // Los refs que se mudaron a un almacén traen de más las líneas de alias
  // (return del almacén, destructurado en App) y sus comentarios. Eso es la
  // mudanza. Cualquier OTRA línea de más, o cualquiera de menos, es un fallo.
  const esAlias=(x)=>/_alm_|^\/\/|,persist|setVfRegistros|vfRegRef\.current/.test(x)||/^[\w,]+\}?=?_?/.test(x)&&x.includes(',');
  const igual=soloA.length===0&&soloB.length===0;
  const soloAlias=soloA.length===0&&soloB.length>0&&soloB.every(esAlias);
  if(!igual&&!soloAlias)dif++;
  console.log(`  ${igual||soloAlias?'✓':'✗'} ${n.padEnd(14)} ${String(a.length).padStart(3)} usos en v324 · ${String(b.length).padStart(3)} ahora`
    +(igual?'  idénticos':(soloAlias?`  +${soloB.length} líneas, todas de alias de almacén`:'')));
  if(!igual&&!soloAlias){
    soloA.slice(0,4).forEach(x=>console.log('       − '+x.slice(0,130)));
    soloB.slice(0,4).forEach(x=>console.log('       + '+x.slice(0,130)));
  }
}
console.log(dif?`  ═══ ${dif} de 10 con diferencias NO explicadas ═══`:'  ═══ LOS 10: IDÉNTICOS O SOLO CON LÍNEAS DE ALIAS ═══');
if(dif)process.exitCode=1;
