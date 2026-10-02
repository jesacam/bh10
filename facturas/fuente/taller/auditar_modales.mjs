// ═══ AUDITORÍA DE MODALES · contrato props↔llamada y símbolos perdidos ═══
// Para CADA modal extraído: (1) sus variables libres son exactamente props,
// imports o globales del módulo — ningún enlace perdido; (2) el punto de
// llamada en app.jsx pasa EXACTAMENTE sus props, ni una de más ni de menos.
import fs from 'fs';
import {parse} from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse=_traverse.default||_traverse;
const GLOBALES=new Set(['window','document','navigator','console','Math','Date','JSON','Object','Array','String','Number','Boolean','Promise','Set','Map','parseFloat','parseInt','isNaN','encodeURIComponent','decodeURIComponent','btoa','atob','URL','Blob','File','FileReader','fetch','setTimeout','clearTimeout','setInterval','clearInterval','alert','confirm','prompt','undefined','Infinity','NaN','RegExp','Error','crypto','localStorage','requestAnimationFrame','TextEncoder','structuredClone','Intl','Symbol','isFinite','React','Response']);

const modSrc=fs.readFileSync('src/modales.jsx','utf8');
const modAst=parse(modSrc,{sourceType:'module',plugins:['jsx']});
const nivelModulo=new Set();
for(const n of modAst.program.body){
  if(n.type==='ImportDeclaration')for(const s of n.specifiers)nivelModulo.add(s.local.name);
  if(n.type==='VariableDeclaration')for(const d of n.declarations)d.id.type==='Identifier'&&nivelModulo.add(d.id.name);
}
const appSrc=fs.readFileSync('src/app.jsx','utf8');

let fallos=0;const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};

for(const n of modAst.program.body){
  if(n.type!=='VariableDeclaration')continue;
  const d=n.declarations[0];
  if(!d||!d.id.name||!d.id.name.startsWith('Modal'))continue;
  const nombre=d.id.name;
  const params=d.init.params[0].properties.map(p=>p.key.name);
  // (1) variables libres del cuerpo
  const dentro=new Set(params);const usadas=new Set();
  traverse(modAst,{
    Identifier(path){
      const x=path.node;
      if(x.start<d.init.start||x.end>d.init.end)return;
      if(path.isBindingIdentifier()){dentro.add(x.name);return;}
      if(!path.isReferencedIdentifier())return;
      if(path.scope.hasBinding(x.name))return;   // sombras internas y catch
      usadas.add(x.name);
    },
    JSXIdentifier(path){
      const x=path.node,p=path.parent;
      if(x.start<d.init.start||x.end>d.init.end)return;
      if((p.type==='JSXOpeningElement'||p.type==='JSXClosingElement')&&/^[A-Z]/.test(x.name))usadas.add(x.name);
    }
  });
  const perdidos=[...usadas].filter(x=>!dentro.has(x)&&!nivelModulo.has(x)&&!GLOBALES.has(x)&&x!==nombre);
  ok(perdidos.length===0,`${nombre}: sin enlaces perdidos${perdidos.length?' → SUELTOS: '+perdidos.join(','):''} (${params.length} props, ${usadas.size} símbolos)`);
  // (2) contrato con el punto de llamada
  const re=new RegExp(`<${nombre} \\{\\.\\.\\.\\{([^}]*)\\}\\}/>`);
  const hit=appSrc.match(re);
  if(!hit){ok(false,`${nombre}: SIN punto de llamada en app.jsx`);continue;}
  const pasadas=hit[1].split(',').map(x=>x.trim()).filter(Boolean);
  const faltan=params.filter(p=>!pasadas.includes(p));
  const sobran=pasadas.filter(p=>!params.includes(p));
  ok(faltan.length===0&&sobran.length===0,`${nombre}: contrato exacto con la llamada${faltan.length?' · FALTAN: '+faltan.join(','):''}${sobran.length?' · SOBRAN: '+sobran.join(','):''}`);
}
console.log(fallos?'═══ AUDITORÍA: '+fallos+' PROBLEMAS ═══':'═══ AUDITORÍA MODALES: CONTRATOS ÍNTEGROS, NADA PERDIDO ═══');
process.exit(fallos?1:0);
