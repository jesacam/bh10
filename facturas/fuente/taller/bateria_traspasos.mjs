// ═══ TRASPASOS ENTRE EMPRESAS · lógica y fichero C34 ══════════════════════
// El fichero tiene que ser el MISMO C34 que el de proveedores, que es el que
// el banco ya acepta. Se compara etiqueta a etiqueta contra el real generado
// por la app (el del paso 25) para que no se separen nunca.
import esbuild from 'esbuild';
import os from 'os';
import path from 'path';
const tmp=path.join(os.tmpdir(),'_bh10_trasp_'+process.pid+'.mjs');
await esbuild.build({entryPoints:['src/traspasos.js'],bundle:true,format:'esm',outfile:tmp,logLevel:'error'});
const T=await import(tmp);
let fallos=0;
const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};

console.log('── 1 · el importe en formato español ──');
for(const [txt,esp] of [['1.212,12',1212.12],['1212,12',1212.12],['1.212',1212],['5.000,00',5000],
                        ['1212.12',1212.12],['  1.212,12 € ',1212.12],['0,50',0.5]])
  ok(T.parseImporte(txt)===esp,`«${txt}» → ${T.parseImporte(txt)}`);
for(const malo of ['','abc','0','-5','1,2,3','1.212,123','12x'])
  ok(T.parseImporte(malo)===null,`«${malo}» se rechaza`);
ok(T.fmtImporte(1212.12)==='1.212,12 €',`se pinta ${T.fmtImporte(1212.12)}`);

console.log('── 2 · validación antes de mover dinero ──');
const GREEN={id:'g1',nombre:'GREEN GENERATION BUILDING, S.L.',cif:'B45999999',
  iban:'ES9121000418450200051332',bic:'CAIXESBBXXX'};
const BIG={name:'BIG HOUSE 2010, S.L.',cif:'B45731981',iban:'ES9130810086153128980228'};
ok(!T.validarTraspaso({empresa:GREEN,importe:'1.212,12',ordenante:BIG}),'un traspaso correcto pasa');
ok(/IBAN/.test(T.validarTraspaso({empresa:{...GREEN,iban:'ES0000'},importe:'100',ordenante:BIG})),'IBAN malo: se rechaza');
ok(/importe/.test(T.validarTraspaso({empresa:GREEN,importe:'abc',ordenante:BIG})),'importe ilegible: se rechaza');
ok(/mismo IBAN/.test(T.validarTraspaso({empresa:{...GREEN,iban:BIG.iban},importe:'100',ordenante:BIG})),
   'ordenante y beneficiario con el mismo IBAN: se rechaza');
ok(/nombre/.test(T.empresaValida({nombre:'',iban:GREEN.iban})),'una empresa sin nombre no vale');

console.log('── 3 · el fichero C34 ──');
const xml=T.construirC34Traspaso({ordenante:BIG,empresa:GREEN,importe:'1.212,12',
  concepto:'TRASPASO',fecha:'2026-09-01',ahora:'2026-08-25T10:00:00',msgId:'GRUP20260825X'});
ok(/^<\?xml version="1\.0" encoding="UTF-8"\?>/.test(xml),'cabecera XML correcta');
ok(xml.includes('urn:iso:std:iso:20022:tech:xsd:pain.001.001.09'),'mismo esquema pain.001.001.09 que proveedores');
ok((xml.match(/<CdtTrfTxInf>/g)||[]).length===1,'una sola transferencia');
ok(/<NbOfTxs>1<\/NbOfTxs>[\s\S]*<NbOfTxs>1<\/NbOfTxs>/.test(xml),'NbOfTxs=1 en cabecera y en PmtInf');
ok(/<CtrlSum>1212\.12<\/CtrlSum>/.test(xml),'CtrlSum con el importe');
ok(/<InstdAmt Ccy="EUR">1212\.12<\/InstdAmt>/.test(xml),'InstdAmt con el importe');
ok(xml.includes('<IBAN>ES9130810086153128980228</IBAN>'),'IBAN del ordenante (BIG)');
ok(xml.includes('<IBAN>ES9121000418450200051332</IBAN>'),'IBAN del beneficiario (GREEN)');
ok(/<Ustrd>TRASPASO<\/Ustrd>/.test(xml),'el concepto va en Ustrd');
ok((xml.match(/<Cd>SUPP<\/Cd>/g)||[]).length===2,'categoría SUPP en CtgyPurp y en Purp, igual que la remesa de proveedores');
const sinCpt=T.construirC34Traspaso({ordenante:BIG,empresa:GREEN,importe:'100',concepto:'',
  fecha:'2026-09-01',ahora:'x',msgId:'m'});
ok(!/<RmtInf>/.test(sinCpt),'si borras el concepto, el bloque RmtInf NO se escribe (fichero válido igual)');

console.log('── 4 · mismas etiquetas que el C34 de proveedores ──');
const ETI=['Document','CstmrCdtTrfInitn','GrpHdr','MsgId','CreDtTm','NbOfTxs','CtrlSum','InitgPty','Nm',
  'PmtInf','PmtInfId','PmtMtd','BtchBookg','PmtTpInf','SvcLvl','Cd','CtgyPurp','ReqdExctnDt','Dt',
  'Dbtr','DbtrAcct','Id','IBAN','CdtTrfTxInf','PmtId','EndToEndId','Amt','InstdAmt','ChrgBr',
  'CdtrAgt','FinInstnId','BICFI','Cdtr','CdtrAcct','Purp','RmtInf','Ustrd'];
const faltan=ETI.filter(t=>!new RegExp('<'+t+'[ >]').test(xml));
ok(faltan.length===0,`están las ${ETI.length} etiquetas del C34 de proveedores${faltan.length?' → faltan '+faltan.join(', '):''}`);

console.log('── 5 · historial de remesas descargadas ──');
let h=[];
h=T.apuntarTraspaso(h,{empresa:GREEN,importe:'1.212,12',concepto:'TRASPASO',fecha:'2026-09-01',fichero:'a.xml',msgId:'m1'});
h=T.apuntarTraspaso(h,{empresa:GREEN,importe:'500',concepto:'',fecha:'2026-09-02',fichero:'b.xml',msgId:'m2'});
ok(h.length===2&&h[0].id==='m2','se apunta cada remesa, la última la primera');
const r=T.resumenTraspasos(h);
ok(r.n===2&&Math.abs(r.total-1712.12)<0.005,`resumen: ${r.n} remesas · ${r.total} €`);
ok(r.ultimo.empresaNombre.startsWith('GREEN'),'el resumen sabe a quién fue la última');

console.log(fallos?`═══ TRASPASOS: ${fallos} FALLOS ═══`:'═══ TRASPASOS: IMPORTES, VALIDACIÓN Y C34 EN ORDEN ═══');
process.exit(fallos?1:0);
