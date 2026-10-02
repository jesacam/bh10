import fs from 'fs';
const lin=fs.readFileSync('src/app.jsx','utf8').split('\n');
const decl=[];
lin.forEach((l,i)=>{let m=l.match(/^  const \[(\w+),(\w+)\]=useState/);if(m)decl.push({n:m[1],set:m[2],L:i+1,t:'st'});
  m=l.match(/^  const (\w+)=useRef/);if(m)decl.push({n:m[1],set:null,L:i+1,t:'rf'});});
// bloque de la vista Nóminas
const ini=lin.findIndex(l=>l.includes("{view==='nominas'&&"));
let d=0,fin=-1;
for(let i=ini;i<lin.length;i++){for(const ch of lin[i]){if(ch==='{')d++;else if(ch==='}')d--;}if(i>ini&&d<=0){fin=i;break;}}
console.log(`vista Nóminas: L${ini+1}–${fin+1}`);
const RX=/^(nom|emp|embarg|remesa|expRemesa|plantilla|irpf|finiquito|paga|salar)/i;
const cand=decl.filter(x=>RX.test(x.n));
console.log('\n=== CANDIDATOS ===');
for(const x of cand){
  const re=new RegExp('\\b('+x.n+(x.set?'|'+x.set:'')+')\\b');
  const usos=[];lin.forEach((l,i)=>{if(i+1===x.L)return;if(re.test(l))usos.push(i+1);});
  const dentro=usos.filter(u=>u>=ini+1&&u<=fin+1).length;
  console.log(`  ${x.t} ${x.n.padEnd(14)} L${String(x.L).padEnd(5)} ${String(usos.length).padStart(3)} usos · ${String(dentro).padStart(3)} en la vista${usos.length&&dentro===usos.length?'  ← SOLO aquí':''}`);
}
console.log('\n=== ¿estados AJENOS intercalados entre el primero y el último candidato? ===');
const a=Math.min(...cand.map(x=>x.L)), b=Math.max(...cand.map(x=>x.L));
console.log(`  rango L${a}–L${b}`);
decl.filter(x=>x.L>a&&x.L<b&&!cand.includes(x)).forEach(x=>console.log('    AJENO L'+x.L+' '+x.t+' '+x.n));
console.log('\n=== hooks (efectos/memos) en ese rango ===');
lin.slice(a-1,b).forEach((l,i)=>{if(/^\s+(useEffect|useMemo|useCallback)\(/.test(l))console.log('    L'+(a+i)+' '+l.trim().slice(0,70));});
console.log('\n=== guardado del dominio ===');
lin.forEach((l,i)=>{if(/const persist(Nom|Emp|Emb|Rem)\w*=|bh10-nominas|bh10-empleados|bh10-embargos|bh10-remesas/.test(l))console.log('  L'+(i+1),l.trim().slice(0,110));});
