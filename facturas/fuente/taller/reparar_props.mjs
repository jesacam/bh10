// ═══ REPARADOR: recalcula variables libres de cada Modal y poda props fantasma ═══
import fs from 'fs';
import {parse} from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse=_traverse.default||_traverse;
const GLOB=new Set(['window','document','navigator','console','Math','Date','JSON','Object','Array','String','Number','Boolean','Promise','Set','Map','parseFloat','parseInt','isNaN','encodeURIComponent','decodeURIComponent','btoa','atob','URL','Blob','File','FileReader','fetch','setTimeout','clearTimeout','setInterval','clearInterval','alert','confirm','prompt','undefined','Infinity','NaN','RegExp','Error','crypto','localStorage','requestAnimationFrame','TextEncoder','structuredClone','Intl','Symbol','isFinite','React']);
let mod=fs.readFileSync('src/modales.jsx','utf8');
let app=fs.readFileSync('src/app.jsx','utf8');
const ast=parse(mod,{sourceType:'module',plugins:['jsx']});
const nivelModulo=new Set();
for(const n of ast.program.body){
  if(n.type==='ImportDeclaration')for(const s of n.specifiers)nivelModulo.add(s.local.name);
  if(n.type==='VariableDeclaration')for(const d of n.declarations)d.id.type==='Identifier'&&nivelModulo.add(d.id.name);
}
const cambios=[];
traverse(ast,{VariableDeclarator(path){
  const d=path.node;
  if(!d.id.name||!d.id.name.startsWith('Modal'))return;
  const params=d.init.params[0].properties.map(p=>p.key.name);
  // scope REAL del componente: el binding de cada parámetro y sus referencias
  const fnPath=path.get('init');
  const fantasma=params.filter(p=>{
    const b=fnPath.scope.getBinding(p);
    return !b||b.references===0;
  });
  // JSX en mayúscula referencia el binding también (Babel lo cuenta) — nada extra
  if(!fantasma.length)return;
  const nuevos=params.filter(p=>!fantasma.includes(p));
  cambios.push({nombre:d.id.name,fantasma,de:params.join(','),a:nuevos.join(',')});
}});
for(const c of cambios){
  mod=mod.replace(`${c.nombre}=({${c.de}})`,`${c.nombre}=({${c.a}})`);
  const re=new RegExp(`<${c.nombre} \\{\\.\\.\\.\\{[^}]*\\}\\}/>`);
  app=app.replace(re,`<${c.nombre} {...{${c.a}}}/>`);
  console.log('  ✂',c.nombre,'poda:',c.fantasma.join(','));
}
fs.writeFileSync('src/modales.jsx',mod);
fs.writeFileSync('src/app.jsx',app);
console.log(cambios.length?'═══ '+cambios.length+' MODALES PODADOS ═══':'═══ SIN FANTASMAS ═══');
