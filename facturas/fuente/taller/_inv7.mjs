import fs from 'fs';
const lin=fs.readFileSync('src/app.jsx','utf8').split('\n');
const decl=[];
lin.forEach((l,i)=>{let m=l.match(/^  const \[(\w+),(\w+)\]=useState/);if(m)decl.push({n:m[1],set:m[2],L:i+1,t:'st'});
  m=l.match(/^  const (\w+)=useRef/);if(m)decl.push({n:m[1],set:null,L:i+1,t:'rf'});});
console.log('estados/refs que QUEDAN en App:',decl.length);
const ini=lin.findIndex(l=>l.includes("{view==='facturas'&&"));
let d=0,fin=-1;
for(let i=ini;i<lin.length;i++){for(const ch of lin[i]){if(ch==='{')d++;else if(ch==='}')d--;}if(i>ini&&d<=0){fin=i;break;}}
console.log(`vista Facturas: L${ini+1}–${fin+1}`);
console.log('\n=== TODOS los que quedan, con dónde se usan ===');
for(const x of decl){
  const re=new RegExp('\\b('+x.n+(x.set?'|'+x.set:'')+')\\b');
  const usos=[];lin.forEach((l,i)=>{if(i+1===x.L)return;if(re.test(l))usos.push(i+1);});
  const dentro=usos.filter(u=>u>=ini+1&&u<=fin+1).length;
  const solo=usos.length&&dentro===usos.length;
  console.log(`  L${String(x.L).padEnd(5)} ${x.n.padEnd(17)} ${String(usos.length).padStart(3)} usos · ${String(dentro).padStart(3)} en Facturas${solo?'  ← SOLO aquí':''}`);
}
console.log('\n=== hooks (efecto/memo/ref) intercalados entre los estados ===');
const a=decl[0].L, b=decl[decl.length-1].L;
lin.slice(a-1,b).forEach((l,i)=>{if(/^\s+(useEffect|useMemo|useCallback)\(/.test(l))console.log('    L'+(a+i)+' '+l.trim().slice(0,55));});
