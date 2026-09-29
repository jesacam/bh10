import fs from 'fs';
const lin=fs.readFileSync('src/app.jsx','utf8').split('\n');
const decl=[];
lin.forEach((l,i)=>{let m=l.match(/^  const \[(\w+),(\w+)\]=useState/);if(m)decl.push({n:m[1],set:m[2],L:i+1,t:'st'});
  m=l.match(/^  const (\w+)=useRef/);if(m)decl.push({n:m[1],set:null,L:i+1,t:'rf'});});
const ini=lin.findIndex(l=>l.includes("{view==='contratos'&&"));
let d=0,fin=-1;
for(let i=ini;i<lin.length;i++){for(const ch of lin[i]){if(ch==='{')d++;else if(ch==='}')d--;}if(i>ini&&d<=0){fin=i;break;}}
console.log(`vista Contratos: L${ini+1}–${fin+1}`);
const RX=/(contrat|obra|budget|presup|certif|reten|garant|hito|medicion)/i;
const cand=decl.filter(x=>RX.test(x.n));
console.log('\n=== CANDIDATOS ===');
for(const x of cand){
  const re=new RegExp('\\b('+x.n+(x.set?'|'+x.set:'')+')\\b');
  const usos=[];lin.forEach((l,i)=>{if(i+1===x.L)return;if(re.test(l))usos.push(i+1);});
  const dentro=usos.filter(u=>u>=ini+1&&u<=fin+1).length;
  console.log(`  ${x.t} ${x.n.padEnd(14)} L${String(x.L).padEnd(5)} ${String(usos.length).padStart(3)} usos · ${String(dentro).padStart(3)} en la vista`);
}
console.log('\n=== SOLO usados por la vista Contratos (candidatos ocultos) ===');
const solo=[];
for(const x of decl){
  const re=new RegExp('\\b('+x.n+(x.set?'|'+x.set:'')+')\\b');
  const usos=[];lin.forEach((l,i)=>{if(i+1===x.L)return;if(re.test(l))usos.push(i+1);});
  if(usos.length&&usos.every(u=>u>=ini+1&&u<=fin+1))solo.push(`${x.n} (L${x.L}, ${usos.length})`);
}
console.log('  '+(solo.join('\n  ')||'(ninguno)'));
const a=Math.min(...cand.map(x=>x.L)), b=Math.max(...cand.map(x=>x.L));
console.log(`\n=== hooks (efecto/memo) entre L${a} y L${b} ===`);
let h=0;lin.slice(a-1,b).forEach((l,i)=>{if(/^\s+(useEffect|useMemo|useCallback)\(/.test(l)){h++;console.log('    L'+(a+i)+' '+l.trim().slice(0,60));}});
if(!h)console.log('    ninguno');
console.log('\n=== inicializadores de los candidatos ===');
cand.forEach(x=>console.log('  '+lin[x.L-1].trim().slice(0,110)));
console.log('\n=== guardado ===');
lin.forEach((l,i)=>{if(/const persist(Contr|Obra|Budget|Cert)\w*=/.test(l))console.log('  L'+(i+1),l.trim().slice(0,120));});
