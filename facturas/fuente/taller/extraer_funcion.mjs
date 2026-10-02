// ═══ EXTRACTOR DE FUNCIONES-MODAL (const Nombre=()=>{...} dentro de App) ═══
// Uso: node taller/extraer_funcion.mjs <NombreLocal> <NombreComponente>
import fs from 'fs';
import {parse} from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse=_traverse.default||_traverse;
const [local,nombre]=process.argv.slice(2);
const src=fs.readFileSync('src/app.jsx','utf8');
const ast=parse(src,{sourceType:'module',plugins:['jsx']});
const nivelModulo=new Set();const deImport={};
for(const n of ast.program.body){
  if(n.type==='ImportDeclaration')for(const s of n.specifiers){nivelModulo.add(s.local.name);deImport[s.local.name]=n.source.value;}
  if(n.type==='VariableDeclaration')for(const d of n.declarations)d.id.type==='Identifier'&&nivelModulo.add(d.id.name);
  if(n.type==='FunctionDeclaration'&&n.id)nivelModulo.add(n.id.name);
}
const GLOBALES=new Set(['window','document','navigator','console','Math','Date','JSON','Object','Array','String','Number','Boolean','Promise','Set','Map','parseFloat','parseInt','isNaN','encodeURIComponent','decodeURIComponent','btoa','atob','URL','Blob','File','FileReader','fetch','setTimeout','clearTimeout','setInterval','clearInterval','alert','confirm','prompt','undefined','Infinity','NaN','RegExp','Error','crypto','localStorage','requestAnimationFrame','TextEncoder','structuredClone','Intl','Symbol','isFinite']);
let decl=null;
traverse(ast,{VariableDeclarator(path){
  if(path.node.id.type==='Identifier'&&path.node.id.name===local&&!decl)decl=path.node;
}});
if(!decl){console.error('No encontrado:',local);process.exit(1);}
const nodo=decl.init;
console.log(`${local}: líneas ${decl.loc.start.line}–${decl.loc.end.line}`);
const definidasDentro=new Set();const usadas=new Set();
traverse(ast,{
  Identifier(path){
    const n=path.node;
    if(n.start<nodo.start||n.end>nodo.end)return;
    if(path.isBindingIdentifier()){definidasDentro.add(n.name);return;}
    if(!path.isReferencedIdentifier())return;
    usadas.add(n.name);
  },
  JSXIdentifier(path){
    const n=path.node,p=path.parent;
    if(n.start<nodo.start||n.end>nodo.end)return;
    if((p.type==='JSXOpeningElement'||p.type==='JSXClosingElement')&&/^[A-Z]/.test(n.name))usadas.add(n.name);
  }
});
const libres=[...usadas].filter(x=>!definidasDentro.has(x)&&!GLOBALES.has(x)&&x!==local);
const props=libres.filter(x=>!nivelModulo.has(x)).sort();
const importar={};const localesApp=[];
for(const x of libres){
  if(deImport[x])(importar[deImport[x]]=importar[deImport[x]]||[]).push(x);
  else if(nivelModulo.has(x))localesApp.push(x);
}
console.log(`Props (${props.length}):`,props.join(','));
for(const [m,ns] of Object.entries(importar))console.log(`  import {${ns.sort().join(',')}} from '${m}'`);
if(localesApp.length)console.log('  ⚠ locales de app.jsx (props):',localesApp.join(','));
// rango a borrar: la declaración COMPLETA const X=...; (statement)
fs.writeFileSync('/tmp/fn_'+nombre+'.json',JSON.stringify({declStart:decl.start,declEnd:decl.end,bodyStart:nodo.start,bodyEnd:nodo.end,props:[...new Set([...props,...localesApp])].sort(),importar,nombre,local}));
