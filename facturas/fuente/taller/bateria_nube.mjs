// ═══ BATERÍA · DOCUMENTO CONFIRMADO EN LA NUBE (v352) ═════════════════════
// Jesús (01-09-2026): «muchas veces no adjunta facturas que sí se ven en la
// app». La caché local enseña el documento aunque sus trozos sigan en cola.
// Aquí: la política de confirmación (paquete.js) y que la app la usa en los
// dos sitios donde adjunta, enseña ⏳ en la ficha y el comprobador pregunta
// primero al servidor.
import fs from 'fs';
import {confirmarEnNube} from '../src/paquete.js';
let n=0,mal=0;
const ok=(cond,txt)=>{n++;if(!cond){mal++;console.log('  ✗',txt);}else console.log('  ✓',txt);};
const esperas=[];const dormir=async(ms)=>{esperas.push(ms);};

{ let ll=0;const r=await confirmarEnNube(async()=>{ll++;return ll<3?{ok:false,motivo:'pendiente de subir (trozo 2 de 3 en cola)'}:{ok:true,trozos:3};},'x',{dormir});
  ok(r.ok&&ll===3,'en cola dos veces y a la tercera confirmado (3 llamadas)');
  ok(esperas.join(',')==='1500,3000','esperas 1,5 s y 3 s entre intentos'); }
{ let ll=0;const r=await confirmarEnNube(async()=>{ll++;return {ok:false,motivo:'falta el trozo 2 de 3 en la nube'};},'x',{dormir});
  ok(!r.ok&&ll===3&&/falta el trozo/.test(r.motivo),'tres veces sin confirmar → ok:false con el último motivo'); }
{ const r=await confirmarEnNube(async()=>{throw new Error('sin red');},'x',{dormir});
  ok(!r.ok&&r.motivo==='sin red','excepción (sin red) → ok:false con el mensaje, sin explotar'); }
{ const r=await confirmarEnNube(undefined,'x',{dormir});
  ok(r.ok&&r.motivo==='sin comprobación','envoltorio antiguo sin enNube → se da por bueno, no bloquea'); }
{ let ll=0;const r=await confirmarEnNube(async()=>{ll++;return {ok:true};},'x',{dormir});
  ok(r.ok&&ll===1,'confirmado a la primera: una sola llamada'); }

const app=fs.readFileSync(new URL('../src/app.jsx',import.meta.url),'utf8');
ok((app.match(/await confirmarNube\(/g)||[]).length===3,'la app confirma en los TRES sitios donde adjunta (archivador, ficha y Gmail)');
ok((app.match(/adjNube:nube\.ok/g)||[]).length===3,'y apunta adjNube en la factura en los tres');
ok(/inv\.adjNube===false&&.*⏳ pendiente de su/.test(app),'la ficha enseña ⏳ pendiente de subir cuando la nube no ha confirmado');
ok(/revisarPendientesNube/.test(app)&&/adjNube===false\)\)return;/.test(app),'al arrancar se vuelve a preguntar solo por las que quedaron ⏳');
ok(/window\.bh10Adj\.enNube\)\{const n=await window\.bh10Adj\.enNube\(i\.adjPath\);if\(!n\.ok\)throw errorDefinitivo/.test(app),'el comprobador de Ajustes pregunta primero al servidor (caché ≠ nube)');
const env=fs.readFileSync(new URL('../src-envoltorio/envoltorio.jsx',import.meta.url),'utf8');
ok(!/F \+= \(\$\.data\(\) \|\| \{\}\)\.v \|\| ""/.test(env),'el envoltorio ya NO concatena un trozo ausente como ""');
ok(env.includes('Documento incompleto en la nube: falta el trozo'),'un trozo ausente al abrir lanza error explícito');
const bundle=fs.readFileSync(new URL('../web_subir/app/assets/bh10-APPV398.js',import.meta.url),'utf8');
ok(bundle.includes('adjNube')&&bundle.includes('pendiente de su'),'el bundle compilado v352 lleva la marca y el aviso');

console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<12){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
