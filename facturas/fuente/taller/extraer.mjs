// Extractor por AST · TODO en Node para que los offsets (UTF-16) casen.
// Uso: node taller/extraer.mjs  — grupos definidos abajo.
import {parse} from '@babel/parser';
import fs from 'fs';
const G={
 tesoreria:'previsionTesoreria',
 copias:'REC esCopiaV9 resumenCopiaV9 imitaNumero seqSerie siguienteSerie normNumDoc',
 ia:'PRECIOS_IA costeEstimado usoDeRespuesta sumaUso textoDeResumen sanitizaResumen',
 historial:'AREAS_HIST describirCambio describirArea crearGuardadoDiferido',
 borradores:'DRAFT_C empActiva dkey guardarDraft leerDraft borrarDraft draftUtil',
 certificaciones:'pctLineasCert lineasCertificacion COSTE_SS_EMPRESA costeEmpresaDe mezclaMesNominas inferISP hallarProforma',
};
const CAB={tesoreria:"// ═══ TESORERÍA · previsión a 6 meses: nóminas, SS, seguros, pagos y cobros ═══\n",
 copias:"// ═══ COPIAS, RECURRENTES Y NUMERACIÓN · copia v9, motor REC, imitaNumero, series ═══\n",
 ia:"// ═══ IA · precios, coste estimado, saneado de resúmenes ═══\n",
 historial:"// ═══ HISTORIAL Y GUARDADO · descripción de cambios, guardado diferido ═══\n",
 borradores:"// ═══ BORRADORES · drafts locales por empresa ═══\n",
 certificaciones:"// ═══ CERTIFICACIONES Y COSTES · líneas por fases, coste empresa, ISP ═══\n"};
let s=fs.readFileSync('src/app.jsx','utf8');
const ast=parse(s,{sourceType:'module',plugins:['jsx']});
const rango={},declNames={};
for(const n of ast.program.body){
  if(n.type==='VariableDeclaration'){
    const nombres=n.declarations.filter(d=>d.id.type==='Identifier').map(d=>d.id.name);
    for(const nom of nombres){rango[nom]=[n.start,n.end];declNames[nom]=nombres;}
  }
  if(n.type==='FunctionDeclaration'&&n.id){rango[n.id.name]=[n.start,n.end];declNames[n.id.name]=[n.id.name];}
}
const conComentarios=(ini)=>{
  let j=ini;
  for(;;){
    const k=s.lastIndexOf('\n',j-2);
    const linea=s.slice(k+1,j).trimEnd();
    if(linea.startsWith('//')) j=k+1; else break;
  }
  return j;
};
const bloques=[];const vistos=new Set();
for(const [g,ns] of Object.entries(G))
  for(const n of ns.split(' ')){
    if(!(n in rango)){console.log('⚠ sin rango:',n);continue;}
    const clave=rango[n].join('-');
    if(vistos.has(clave))continue;
    vistos.add(clave);
    bloques.push({ini:conComentarios(rango[n][0]),fin:rango[n][1],g,nombres:declNames[n]});
  }
bloques.sort((a,b)=>a.ini-b.ini);
for(let i=1;i<bloques.length;i++)
  if(bloques[i-1].fin>bloques[i].ini) throw new Error('solape '+bloques[i-1].g+'/'+bloques[i].g);
const porg={},nomg={};
for(const b of bloques){
  (porg[b.g]??=[]).push(s.slice(b.ini,b.fin));
  (nomg[b.g]??=[]).push(...b.nombres);
}
for(let i=bloques.length-1;i>=0;i--) s=s.slice(0,bloques[i].ini)+s.slice(bloques[i].fin);
for(const g of Object.keys(G))
  fs.writeFileSync(`src/${g}.js`,CAB[g]+porg[g].join('\n\n')+`\nexport {${nomg[g].join(',')}};\n`);
const ancla="import {GRUPOS_AJ,ApartadoAj,ConfigAj} from './ajustes';";
if(s.split(ancla).length!==2)throw new Error('ancla imports');
s=s.replace(ancla,ancla+'\n'+Object.keys(G).map(g=>`import {${nomg[g].join(',')}} from './${g}';\n`).join(''));
fs.writeFileSync('src/app.jsx',s);
console.log('✓ extraídos:',Object.fromEntries(Object.keys(G).map(g=>[g,nomg[g].length])),'· app.jsx:',s.split('\n').length,'líneas');
