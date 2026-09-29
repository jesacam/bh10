// AUDITORÍA ESTÁTICA DE LOS ALMACENES (nada de esto lo mira el pre-vuelo)
//  1. cada almacén: ¿declara todo lo que devuelve? ¿devuelve todo lo declarado?
//  2. App: ¿destructura exactamente lo que el almacén devuelve?
//  3. ¿algún nombre está declarado A LA VEZ en un almacén y en App? (sombra)
//  4. ¿algún almacén escribe una clave de nube de otro dominio?
import fs from 'fs';
import {parse} from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse=_traverse.default||_traverse;
const P=(src)=>parse(src,{sourceType:'module',plugins:['jsx']});
let fallos=0;
const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};

const almacenes=fs.readdirSync('src/almacenes').filter(f=>f.endsWith('.js'));
const app=fs.readFileSync('src/app.jsx','utf8');
const astApp=P(app);

// estados declarados directamente en App (nivel de componente)
const enApp=new Set();
app.split('\n').forEach(l=>{const m=l.match(/^  const \[(\w+),(\w+)\]=useState/);if(m){enApp.add(m[1]);enApp.add(m[2]);}
  const r=l.match(/^  const (\w+)=useRef/);if(r)enApp.add(r[1]);});

// qué destructura App de cada almacén
const destruct={};
traverse(astApp,{VariableDeclarator(p){
  const init=p.node.init;
  if(init&&init.type==='Identifier'&&/^_alm_/.test(init.name)&&p.node.id.type==='ObjectPattern'){
    destruct[init.name]=p.node.id.properties.map(x=>x.key&&x.key.name).filter(Boolean);
  }}});

console.log('=== 1·2 · CADA ALMACÉN CONTRA SU CONSUMO ===');
const todosDevueltos=new Map();
for(const f of almacenes){
  const src=fs.readFileSync('src/almacenes/'+f,'utf8');
  const ast=P(src);
  const declarados=new Set(), devueltos=[];
  traverse(ast,{
    VariableDeclarator(p){
      // SOLO el nivel superior del hook: las variables locales de una función
      // interna no son «cosas que el almacén se guarda sin devolver».
      let f=p.getFunctionParent();
      if(!f||f.node.type!=='ArrowFunctionExpression'||f.getFunctionParent())return;
      const id=p.node.id;
      if(id.type==='ArrayPattern')id.elements.forEach(e=>e&&e.name&&declarados.add(e.name));
      else if(id.type==='Identifier')declarados.add(id.name);
    },
    ReturnStatement(p){
      const a=p.node.argument;
      if(a&&a.type==='ObjectExpression')a.properties.forEach(pr=>{if(pr.key&&pr.key.name)devueltos.push(pr.key.name);});
    }});
  const dup=devueltos.filter((x,i)=>devueltos.indexOf(x)!==i);
  ok(dup.length===0,`${f}: sin nombres repetidos en el return${dup.length?' → '+dup.join(', '):''}`);
  const noDecl=devueltos.filter(x=>!declarados.has(x));
  ok(noDecl.length===0,`${f}: todo lo devuelto está declarado${noDecl.length?' → FANTASMA: '+noDecl.join(', '):''}`);
  const sinUsar=[...declarados].filter(x=>!devueltos.includes(x)&&!/^(use|_)/.test(x));
  ok(sinUsar.length===0,`${f}: no se queda nada dentro sin devolver${sinUsar.length?' → '+sinUsar.join(', '):''}`);
  devueltos.forEach(d=>{
    if(todosDevueltos.has(d))ok(false,`COLISIÓN: «${d}» lo devuelven ${todosDevueltos.get(d)} y ${f}`);
    todosDevueltos.set(d,f);
  });
}
console.log('\n=== 2 · APP DESTRUCTURA EXACTAMENTE LO QUE RECIBE ===');
for(const [alias,props] of Object.entries(destruct)){
  const faltan=props.filter(x=>!todosDevueltos.has(x));
  ok(faltan.length===0,`${alias}: App no pide nada que el almacén no dé${faltan.length?' → '+faltan.join(', '):''}`);
}
const pedidos=new Set(Object.values(destruct).flat());
const huerfanos=[...todosDevueltos.keys()].filter(x=>!pedidos.has(x));
ok(huerfanos.length===0,`ningún almacén devuelve algo que App no recoja${huerfanos.length?' → '+huerfanos.join(', '):''}`);

console.log('\n=== 3 · SOMBRAS: mismo nombre en un almacén Y en App ===');
const sombras=[...todosDevueltos.keys()].filter(x=>enApp.has(x));
ok(sombras.length===0,`sin nombres duplicados entre almacén y App${sombras.length?' → '+sombras.join(', '):''}`);

console.log('\n=== 4 · CLAVES DE NUBE: cada almacén solo escribe las suyas ===');
const esperadas={'seguros.js':['bh10-flota','bh10-polizas'],'verifactu.js':['bh10-vfregistros','bh10-vfcfg'],
  'tesoreria.js':['bh10-n43'],'facturas.js':['bh10-fc-v3','bh10-provcat','bh10-clicat'],'contratos.js':['bh10-obras','bh10-contratos','bh10-budgets'],'nominas.js':['bh10-nominas','bh10-remesas'],
  'fichaje.js':['bh10-planidx','bh10-plan-'],'promociones.js':['bh10-promocfg','bh10-promo']};
for(const f of almacenes){
  const src=fs.readFileSync('src/almacenes/'+f,'utf8');
  const claves=[...src.matchAll(/storage\.set\(\s*[`'"]([^`'"]+)/g)].map(m=>m[1]);
  const perm=esperadas[f]||[];
  const malas=claves.filter(k=>!perm.some(p=>k.startsWith(p)));
  ok(malas.length===0,`${f}: escribe [${claves.join(', ')||'—'}]${malas.length?' → AJENAS: '+malas.join(', '):''}`);
}
console.log(fallos?`\n═══ AUDITORÍA ALMACENES: ${fallos} FALLOS ═══`:'\n═══ AUDITORÍA ALMACENES: LOS ALMACENES, COHERENTES ═══');
process.exit(fallos?1:0);
