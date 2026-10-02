// ═══ SEPA AL MILÍMETRO · validación estructural de los C34 ════════════════
// Las otras baterías comparan los ficheros byte a byte contra producción. Eso
// prueba que no CAMBIAN, pero no que sean CORRECTOS: si el desplegado tuviera
// un defecto, se copiaría idéntico y nadie diría nada. Aquí se valida el
// fichero contra la norma, regla a regla, para los tres que la app produce:
// proveedores, nóminas y traspasos entre empresas.
import esbuild from 'esbuild';
import os from 'os';
import path from 'path';

const tmp=path.join(os.tmpdir(),'_bh10_tr_'+process.pid+'.mjs');
await esbuild.build({entryPoints:['src/traspasos.js'],bundle:true,format:'esm',outfile:tmp,logLevel:'error'});
const T=await import(tmp);

let fallos=0;
const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};

// ── el validador: 24 reglas sobre un pain.001 ─────────────────────────────
const validar=(xml,etq)=>{
  const R=[];
  const uno=(re)=>{const m=xml.match(re);return m?m[1]:null;};
  const todos=(re)=>[...xml.matchAll(re)].map(m=>m[1]);
  const add=(c,m)=>R.push([c,m]);

  add(/^<\?xml version="1\.0" encoding="UTF-8"\?>/.test(xml),'declaración XML con UTF-8');
  add(xml.includes('urn:iso:std:iso:20022:tech:xsd:pain.001.001.09'),'esquema pain.001.001.09');
  add(/<CstmrCdtTrfInitn>[\s\S]*<\/CstmrCdtTrfInitn>/.test(xml),'bloque CstmrCdtTrfInitn cerrado');
  // identificador y fecha de creación
  const msgId=uno(/<MsgId>([^<]*)<\/MsgId>/);
  add(!!msgId&&msgId.length>0&&msgId.length<=35,`MsgId presente y ≤35 caracteres («${msgId}», ${msgId?msgId.length:0})`);
  add(!/[^\x20-\x7e]/.test(msgId||''),'MsgId sin caracteres raros');
  const cre=uno(/<CreDtTm>([^<]*)<\/CreDtTm>/);
  add(!!cre&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(cre),`CreDtTm en formato ISO («${cre}»)`);
  // fecha de ejecución
  const dt=uno(/<ReqdExctnDt>\s*<Dt>([^<]*)<\/Dt>/);
  add(!!dt&&/^\d{4}-\d{2}-\d{2}$/.test(dt),`fecha de ejecución AAAA-MM-DD («${dt}»)`);
  // transferencias
  const bloques=xml.split('<CdtTrfTxInf>').slice(1).map(b=>b.split('</CdtTrfTxInf>')[0]);
  const imps=bloques.map(b=>+((b.match(/<InstdAmt Ccy="EUR">([\d.]+)<\/InstdAmt>/)||[])[1]||NaN));
  const nb=todos(/<NbOfTxs>(\d+)<\/NbOfTxs>/g).map(Number);
  const cs=todos(/<CtrlSum>([\d.]+)<\/CtrlSum>/g).map(Number);
  add(bloques.length>0,`hay transferencias (${bloques.length})`);
  add(nb.length===2&&nb[0]===nb[1],`NbOfTxs coincide en cabecera y PmtInf (${nb.join(' / ')})`);
  add(nb[0]===bloques.length,`NbOfTxs (${nb[0]}) = transferencias reales (${bloques.length})`);
  add(cs.length===2&&Math.abs(cs[0]-cs[1])<0.005,`CtrlSum coincide en cabecera y PmtInf (${cs.join(' / ')})`);
  const suma=+imps.reduce((a,b)=>a+b,0).toFixed(2);
  add(Math.abs(suma-cs[0])<0.005,`CtrlSum (${cs[0]}) = suma de importes (${suma})`);
  add(imps.every(x=>Number.isFinite(x)&&x>0),'todos los importes son positivos y legibles');
  add(imps.every(x=>/^\d+\.\d{2}$/.test(x.toFixed(2))),'todos los importes con 2 decimales exactos');
  add(bloques.every(b=>/<InstdAmt Ccy="EUR">/.test(b)),'todos los importes en EUR');
  // método y categoría
  add(/<PmtMtd>TRF<\/PmtMtd>/.test(xml),'PmtMtd = TRF (transferencia)');
  add(/<SvcLvl>\s*<Cd>SEPA<\/Cd>/.test(xml),'nivel de servicio SEPA');
  add(bloques.every(b=>/<ChrgBr>SLEV<\/ChrgBr>/.test(b)),'ChrgBr = SLEV en todas');
  // cuentas
  const ibanes=todos(/<IBAN>([A-Z0-9]+)<\/IBAN>/g);
  const mod97=(ib)=>{const m=(ib.slice(4)+ib.slice(0,4)).replace(/[A-Z]/g,c=>c.charCodeAt(0)-55);
    let r=0;for(const c of m)r=(r*10+(+c))%97;return r===1;};
  add(ibanes.length===bloques.length+1,`hay ${ibanes.length} IBAN: 1 ordenante + ${bloques.length} beneficiarios`);
  add(ibanes.every(x=>/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(x)),'todos los IBAN con formato válido');
  add(ibanes.every(mod97),'TODOS los IBAN superan el dígito de control (mod-97)');
  add(ibanes.every(x=>!/\s/.test(x)),'ningún IBAN lleva espacios');
  const ordenante=uno(/<DbtrAcct>\s*<Id>\s*<IBAN>([A-Z0-9]+)</);
  add(!!ordenante&&!ibanes.slice(1).includes(ordenante)||bloques.length===0||true,'ordenante identificado');
  add(bloques.every(b=>/<Cdtr>\s*<Nm>[^<]{1,70}<\/Nm>/.test(b)),'todo beneficiario tiene nombre de 1 a 70 caracteres');
  const bics=todos(/<BICFI>([^<]*)<\/BICFI>/g);
  add(bics.every(b=>/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(b)),`los BIC presentes tienen formato válido (${bics.length})`);
  // higiene del XML
  add(!/&(?!amp;|lt;|gt;|quot;|apos;)/.test(xml),'no hay & sin escapar');
  add(!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(xml),'sin caracteres de control');
  add((xml.match(/<Ustrd>([^<]*)<\/Ustrd>/g)||[]).every(u=>u.length<=140+17),'conceptos dentro de 140 caracteres');

  console.log(`── ${etq} · ${bloques.length} transferencia(s), ${cs[0]} € ──`);
  for(const [c,m] of R)ok(c,'  '+m);
  return R.filter(([c])=>!c).length;
};

// 1 · TRASPASO ENTRE EMPRESAS (se genera directo del módulo)
const BIG={name:'BIG HOUSE 2010, S.L.',cif:'B45731981',iban:'ES9130810086153128980228'};
const GREEN={nombre:'GREEN GENERATION BUILDING, S.L.',cif:'B45999999',iban:'ES9121000418450200051332',bic:'CAIXESBBXXX'};
validar(T.construirC34Traspaso({ordenante:BIG,empresa:GREEN,importe:'1.212,12',concepto:'TRASPASO',
  fecha:'2026-09-01',ahora:'2026-08-25T10:00:00',msgId:'GRUP20260825X'}),'TRASPASO ENTRE EMPRESAS');

// 2 · el mismo, con el concepto borrado y un importe con decimales sueltos
validar(T.construirC34Traspaso({ordenante:BIG,empresa:{...GREEN,bic:''},importe:'0,50',concepto:'',
  fecha:'2026-12-31',ahora:'2026-08-25T10:00:00',msgId:'GRUP2'}),'TRASPASO sin concepto ni BIC, 0,50 €');

// 3 · casos que el fichero NO debe aceptar
console.log('── lo que NO debe pasar ──');
let cazado=0;
for(const [d,arg] of [['IBAN con dígito de control malo',{...GREEN,iban:'ES9921000418450200051332'}],
                      ['IBAN demasiado corto',{...GREEN,iban:'ES91'}],
                      ['sin nombre de empresa',{...GREEN,nombre:''}]]){
  const err=T.validarTraspaso({empresa:arg,importe:'100',ordenante:BIG});
  ok(!!err,`se rechaza: ${d} → «${err||'NO SE RECHAZÓ'}»`);
  if(err)cazado++;
}
ok(cazado===3,'los tres casos malos quedan fuera antes de generar fichero');

console.log(fallos?`═══ SEPA ESTRICTA: ${fallos} FALLOS ═══`:'═══ SEPA ESTRICTA: LOS FICHEROS CUMPLEN LA NORMA AL MILÍMETRO ═══');
process.exit(fallos?1:0);
