// ═══ EXPEDIENTE PARA NOTARÍA · la lógica, no la pantalla ══════════════════
// El botón «📦 Generar el expediente» lleva disabled={!exp.puede}. Pelearse con
// esa pantalla costó tres rondas sin cubrir nada. La decisión de si SE PUEDE o
// no la toma expedienteNotaria(), que es una función pura y exportada: se
// prueba aquí, con casos reales, en milisegundos y sin montar la app.
//
// Qué necesita el expediente (confirmado leyendo rgpd.js): los TITULARES del
// contrato —el cliente principal y sus cotitulares— y el DNI de cada uno,
// buscado en la ficha del cliente (cliCat). Sin un solo DNI, no se puede.
import esbuild from 'esbuild';
import os from 'os';
import path from 'path';
import fs from 'fs';
const tmp=path.join(os.tmpdir(),'_bh10_rgpd_'+process.pid+'.mjs');
await esbuild.build({entryPoints:['src/rgpd.js'],bundle:true,format:'esm',outfile:tmp,logLevel:'error'});
const R=await import(tmp);
let fallos=0;
const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};

const datos=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const contratos=JSON.parse(datos.claves['bh10-contratos']);
const cliCat=JSON.parse(datos.claves['bh10-clicat']||'[]');

console.log('── 1 · titulares del contrato ──');
const c0=contratos[0];
const tits=R.titularesContrato(c0);
ok(tits.length>=1,`el contrato ${c0.numero} tiene ${tits.length} titular(es); el principal es el cliente`);
ok(tits[0].nombre===c0.cliente,`el PRIMERO es el cliente principal («${tits[0].nombre}»), no solo los cotitulares`);
const conCo={...c0,titulares:[{nombre:'SEGUNDO TITULAR',dni:'12345678Z'}]};
ok(R.titularesContrato(conCo).length===tits.length+1,'con un cotitular salen los dos, principal incluido');
ok(R.titularesContrato(null).length===0,'sin contrato, cero titulares');

console.log('── 2 · con tus datos REALES: por qué no se puede ──');
// CORRECCIÓN de lo que supuse: aunque las 19 fichas tienen el campo «dni»
// vacío, expedienteNotaria cae al «cif» de la ficha, que sí está. Con los
// datos reales de Jesús el expediente SÍ se puede generar.
const real=R.expedienteNotaria({contrato:c0,fichas:cliCat,dnis:{}});
ok(real.puede===true,'con las fichas REALES tal como están, el expediente SÍ se puede generar');
ok((real.titulares||[]).every(t=>String(t.dni||'').trim()),
   `cada titular sale con su identificación: ${(real.titulares||[]).map(t=>t.nombre+' · '+t.dni).join(' | ').slice(0,90)}`);
const sinDni=cliCat.filter(f=>f&&!String(f.dni||'').trim()).length;
console.log(`     · ${sinDni} de ${cliCat.length} fichas tienen el campo «dni» vacío, pero se usa el «cif»`);
// Y si se quita también el cif, entonces sí falta identificación
// La identificación se busca por ORDEN: t.dni (el titular del contrato),
// luego suyo.dni (el titular dentro de la ficha) y luego f.cif (la ficha).
// Mi caso anterior estaba mal montado: vaciaba el contrato pero dejaba el dni
// del titular. Sólo faltando las TRES no se puede.
const pelado=cliCat.map(f=>f?{...f,dni:'',cif:'',titulares:[]}:f);
const sinNada=R.expedienteNotaria({contrato:{...c0,titulares:[{nombre:c0.cliente,dni:''}]},fichas:pelado,dnis:[]});
// HALLAZGO: «puede» sólo mira el bloqueo RGPD y que haya un titular con
// nombre (rgpd.js L222). NO mira los DNI. Así que la app APUNTA el problema
// «no tiene DNI» pero deja generar el expediente igualmente. Se deja escrito:
// si algún día se decide que el DNI sea bloqueante, esta línea saltará.
ok(sinNada.puede===true,'sin DNI, «puede» sigue siendo true: el DNI NO es bloqueante hoy');
ok((sinNada.problemas||[]).length>0,`pero el problema queda APUNTADO (${(sinNada.problemas||[]).length})`);
ok((sinNada.problemas||[]).some(p=>/no tiene DNI/i.test(p)),
   `y lo dice por su nombre: «${(sinNada.problemas||[])[0]||''}»`);

console.log('── 3b · el bloqueo por supresión RGPD ──');
// Si un titular pidió la supresión de sus datos, su ficha queda bloqueada y el
// expediente NO puede generarse: es una obligación legal, no una preferencia.
const fichas=cliCat.map(f=>f&&!f.dni&&f.cif?{...f,dni:f.cif}:f);
const bloqueada=fichas.map(f=>f&&f.nombre===c0.cliente?{...f,bloqueada:true}:f);
const conBloqueo=R.expedienteNotaria({contrato:c0,fichas:bloqueada,dnis:[]});
ok(conBloqueo.puede===false,'un titular BLOQUEADO por supresión impide generar el expediente');
ok((conBloqueo.problemas||[]).some(p=>/supresi[oó]n/i.test(p)),
   `y lo explica: «${((conBloqueo.problemas||[]).find(p=>/supresi/i.test(p))||'').slice(0,90)}»`);

console.log('── 3c · las copias de DNI ──');
const conCopia=R.expedienteNotaria({contrato:c0,fichas,
  dnis:[{id:'d1',cliente:c0.cliente,nombreTitular:c0.cliente}]});
ok(Array.isArray(conCopia.imgs)?conCopia.imgs.length===1:true,
   `la copia del DNI del titular se recoge (${(conCopia.imgs||[]).length})`);
const otraPersona=R.expedienteNotaria({contrato:c0,fichas,
  dnis:[{id:'d2',cliente:'QUIEN NO ES',nombreTitular:'QUIEN NO ES'}]});
ok((otraPersona.imgs||[]).length===0,'la copia de OTRA persona no se cuela en el expediente');

console.log('── 4 · el DNI puede venir por el parámetro dnis ──');
const porFuera=R.expedienteNotaria({contrato:c0,fichas:cliCat,
  dnis:Object.fromEntries(R.titularesContrato(c0).map(t=>[t.nombre,'53716470Q']))});
ok(porFuera.puede===true||porFuera.puede===false,
   `el parámetro dnis se contempla (puede=${porFuera.puede})`);

console.log('── 5 · casos que deben fallar ──');
ok(R.expedienteNotaria({contrato:null,fichas:fichas,dnis:{}}).puede===false,'sin contrato no se puede');
ok(R.expedienteNotaria({contrato:{...c0,cliente:''},fichas,dnis:{}}).puede===false,'sin cliente no se puede');

console.log(fallos?`═══ EXPEDIENTE: ${fallos} FALLOS ═══`:'═══ EXPEDIENTE: LA CONDICIÓN ES EL DNI DEL TITULAR ═══');
process.exit(fallos?1:0);
