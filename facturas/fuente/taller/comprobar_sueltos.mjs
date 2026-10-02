// Comprobador de nombres sueltos: identificadores usados sin declarar ni
// importar. esbuild NO avisa de esto (los asume globales) y en ESM revientan
// en tiempo de ejecución — este es el cinturón de seguridad del fuente modular.
import * as acorn from 'acorn';
import jsx from 'acorn-jsx';
import * as walk from 'acorn-walk';
import fs from 'fs';
const P=acorn.Parser.extend(jsx());
const GLOB=new Set(('window document console setTimeout clearTimeout setInterval clearInterval Promise Date Math JSON Object Array String Number Boolean RegExp Error TypeError Map Set WeakMap WeakSet isNaN isFinite parseFloat parseInt Intl fetch navigator localStorage sessionStorage FileReader Blob File URL URLSearchParams atob btoa crypto TextEncoder TextDecoder requestAnimationFrame cancelAnimationFrame alert confirm prompt undefined NaN Infinity globalThis performance structuredClone queueMicrotask AbortController Event CustomEvent KeyboardEvent MouseEvent Uint8Array Uint16Array Uint32Array Int8Array Float32Array Float64Array ArrayBuffer DataView Symbol Proxy Reflect history location screen XMLSerializer DOMParser Image Audio ResizeObserver IntersectionObserver MutationObserver getComputedStyle matchMedia open close scrollTo WebSocket Notification encodeURIComponent decodeURIComponent encodeURI decodeURI escape unescape Function eval Response Request Headers FormData BigInt arguments this Node HTMLElement CSS visualViewport devicePixelRatio innerWidth innerHeight SyntaxError RangeError ReferenceError EvalError URIError DOMException AggregateError Worker caches indexedDB IDBKeyRange MessageChannel BroadcastChannel ClipboardItem ImageData OffscreenCanvas createImageBitmap postMessage dispatchEvent addEventListener removeEventListener getSelection cancelIdleCallback requestIdleCallback').split(' '));
const base={...walk.base};
base.JSXElement=(n,st,c)=>{n.children.forEach(x=>c(x,st));(n.openingElement.attributes||[]).forEach(a=>c(a,st));c(n.openingElement.name,st);};
base.JSXFragment=(n,st,c)=>{n.children.forEach(x=>c(x,st));};
base.JSXExpressionContainer=(n,st,c)=>c(n.expression,st);
base.JSXAttribute=(n,st,c)=>{if(n.value)c(n.value,st);};
base.JSXSpreadAttribute=(n,st,c)=>c(n.argument,st);
base.JSXText=()=>{};base.JSXEmptyExpression=()=>{};base.JSXIdentifier=()=>{};
base.JSXMemberExpression=(n,st,c)=>c(n.object,st);
let mal=0;
// Recorrido RECURSIVO: desde v325 el fuente tiene subcarpetas (src/almacenes/).
// Con readdirSync plano, cada almacén nuevo quedaba FUERA del cinturón.
const listar=(dir)=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?listar(dir+'/'+e.name):(/\.(js|jsx)$/.test(e.name)?[dir+'/'+e.name]:[]));
for(const f of listar('src')){
  const src=fs.readFileSync(f,'utf8');
  const ast=P.parse(src,{ecmaVersion:'latest',sourceType:'module'});
  const decl=new Set(),usos=new Set();
  const declara=(pat)=>{if(!pat)return;
    if(pat.type==='Identifier')decl.add(pat.name);
    else if(pat.type==='ObjectPattern')pat.properties.forEach(p=>declara(p.value||p.argument));
    else if(pat.type==='ArrayPattern')pat.elements.forEach(declara);
    else if(pat.type==='AssignmentPattern')declara(pat.left);
    else if(pat.type==='RestElement')declara(pat.argument);};
  walk.full(ast,(n)=>{
    if(n.type==='VariableDeclarator')declara(n.id);
    if(/Function/.test(n.type)||n.type==='ArrowFunctionExpression'){(n.params||[]).forEach(declara);if(n.id)decl.add(n.id.name);}
    if(n.type==='ImportDeclaration')n.specifiers.forEach(s=>decl.add(s.local.name));
    if(n.type==='CatchClause'&&n.param)declara(n.param);
    if(n.type==='ClassDeclaration'&&n.id)decl.add(n.id.name);
  },base);
  walk.ancestor(ast,{Identifier(n,st,anc){
    const p=anc[anc.length-2];if(!p)return;
    const noUso=(p.type==='Property'&&p.key===n&&!p.computed&&!p.shorthand)||(p.type==='MemberExpression'&&p.property===n&&!p.computed)||(p.type==='ImportSpecifier')||(p.type==='ExportSpecifier'&&p.local!==n)||(p.type==='LabeledStatement')||(p.type==='BreakStatement')||(p.type==='ContinueStatement');
    if(!noUso)usos.add(n.name);
  },JSXIdentifier(n){if(/^[A-Z]/.test(n.name))usos.add(n.name);}},base);
  const sueltos=[...usos].filter(u=>!decl.has(u)&&!GLOB.has(u)).sort();
  if(sueltos.length){mal++;console.log('✗',f,'SUELTOS:',sueltos.join(', '));}
  else console.log('✓',f);
}
console.log(mal?'═══ NOMBRES SUELTOS: REVISAR ═══':'═══ COMPROBADOR: TODO DECLARADO ═══');
process.exit(mal?1:0);
