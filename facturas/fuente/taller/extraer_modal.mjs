// ═══ EXTRACTOR DE MODALES · análisis de variables libres por AST ═══
// Uso: node taller/extraer_modal.mjs <líneaDentroDelModal> <NombreComponente> <fichero.jsx>
// Localiza la expresión {cond && <JSX/>} que contiene esa línea dentro del
// return de App, enumera las variables libres (definidas en el cierre de App),
// genera el módulo con el componente y deja impreso el reemplazo a aplicar.
import fs from 'fs';
import {parse} from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse=_traverse.default||_traverse;

const [linea,nombre,salida]=process.argv.slice(2);
const src=fs.readFileSync('src/app.jsx','utf8');
const ast=parse(src,{sourceType:'module',plugins:['jsx']});

// nombres de nivel módulo (imports y const globales): NO son props
const nivelModulo=new Set();
const deImport={};   // nombre → módulo de origen
for(const n of ast.program.body){
  if(n.type==='ImportDeclaration')for(const s of n.specifiers){nivelModulo.add(s.local.name);deImport[s.local.name]=n.source.value;}
  if(n.type==='VariableDeclaration')for(const d of n.declarations){
    if(d.id.type==='Identifier')nivelModulo.add(d.id.name);
    if(d.id.type==='ObjectPattern')for(const p of d.id.properties)p.value&&p.value.type==='Identifier'&&nivelModulo.add(p.value.name);
  }
  if(n.type==='FunctionDeclaration'&&n.id)nivelModulo.add(n.id.name);
  if(n.type==='ExportNamedDeclaration'&&n.declaration&&n.declaration.declarations)
    for(const d of n.declaration.declarations)d.id.type==='Identifier'&&nivelModulo.add(d.id.name);
}
const GLOBALES=new Set(['window','document','navigator','console','Math','Date','JSON','Object','Array','String','Number','Boolean','Promise','Set','Map','parseFloat','parseInt','isNaN','encodeURIComponent','decodeURIComponent','btoa','atob','URL','Blob','File','FileReader','fetch','setTimeout','clearTimeout','setInterval','clearInterval','alert','confirm','prompt','undefined','Infinity','NaN','RegExp','Error','crypto','localStorage','sessionStorage','requestAnimationFrame','TextEncoder','TextDecoder','structuredClone','Intl','Symbol','React','Number','isFinite']);

const objetivo=parseInt(linea,10);
let nodo=null;
traverse(ast,{
  LogicalExpression(path){
    const {node}=path;
    if(node.operator!=='&&')return;
    const a=node.loc.start.line,b=node.loc.end.line;
    if(a<=objetivo&&objetivo<=b&&(!nodo||(b-a)<(nodo.loc.end.line-nodo.loc.start.line))){
      // el bloque && más PEQUEÑO que contiene la línea y cuyo lado derecho es JSX
      const der=node.right;
      if(der.type==='JSXElement'||der.type==='JSXFragment'||(der.type==='CallExpression'))nodo=node;
    }
  }
});
if(!nodo){console.error('No se encontró el bloque');process.exit(1);}
// subir al {…} contenedor si el padre inmediato es JSXExpressionContainer
console.log(`Bloque: líneas ${nodo.loc.start.line}–${nodo.loc.end.line} (${nodo.loc.end.line-nodo.loc.start.line+1} líneas)`);

// variables libres: identificadores leídos dentro, no definidos dentro, no de módulo, no globales
const definidasDentro=new Set();
const usadas=new Set();
traverse(ast,{
  Identifier(path){
    const n=path.node;
    if(n.start<nodo.start||n.end>nodo.end)return;
    // el juicio del propio Babel: binding = definida dentro; referencia = uso
    if(path.isBindingIdentifier()){definidasDentro.add(n.name);return;}
    if(!path.isReferencedIdentifier())return;
    usadas.add(n.name);
  },
  JSXIdentifier(path){
    const n=path.node,p=path.parent;
    if(n.start<nodo.start||n.end>nodo.end)return;
    if(p.type==='JSXOpeningElement'||p.type==='JSXClosingElement'){
      if(/^[A-Z]/.test(n.name))usadas.add(n.name);
    }
  }
});
const libres=[...usadas].filter(x=>!definidasDentro.has(x)&&!GLOBALES.has(x));
const props=libres.filter(x=>!nivelModulo.has(x)).sort();
const importar={};
const localesApp=[];
for(const x of libres){
  if(deImport[x])(importar[deImport[x]]=importar[deImport[x]]||[]).push(x);
  else if(nivelModulo.has(x))localesApp.push(x);
}
console.log(`Props (${props.length}):`,props.join(','));
for(const [m,ns] of Object.entries(importar))console.log(`  import {${ns.sort().join(',')}} from '${m}'`);
if(localesApp.length)console.log('  ⚠ locales de app.jsx (irán como props):',localesApp.join(','));
fs.writeFileSync('/tmp/extraccion_'+nombre+'.json',JSON.stringify({start:nodo.start,end:nodo.end,lineaIni:nodo.loc.start.line,lineaFin:nodo.loc.end.line,props:[...new Set([...props,...localesApp])].sort(),importar,nombre,salida}));
