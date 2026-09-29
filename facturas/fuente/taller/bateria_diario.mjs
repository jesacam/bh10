// ═══ BATERÍA · DIARIO PERMANENTE DE PAGOS (v359) ══════════════════════════
// Con las facturas reales: se simula lo que pasó en julio-septiembre
// (remesa global que marca 82, borrado a mano de 52, remesa nueva que no
// apunta nada, deshacer) y el diario tiene que contarlo entero.
import fs from 'fs';
import {fotoPagos,diffPagos,anotar,entradaRemesa,deFactura,deRemesa,csvDiario,lineaDiario,TOPE_DIARIO,fotoEntidades,diffEntidades,deColeccion} from '../src/diario.js';
let n=0,mal=0;const ok=(c,t)=>{n++;if(!c){mal++;console.log('  ✗',t);}else console.log('  ✓',t);};
const copia=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const inv=JSON.parse(copia.claves['bh10-fc-v3']);
const fiscal=(i)=>i&&!['anticipo','cobro','personal','presupuesto'].includes(i.tipo)&&!i.anulada;
const pag=(i)=>(i.pagos||[]).reduce((s,p)=>s+(+p.importe||0),0);
const pend=inv.filter(i=>fiscal(i)&&pag(i)<(+i.total||0)-0.01).slice(0,82);const N=pend.length;const Q=Math.max(1,N-30);
ok(N>=40,`${N} facturas pendientes reales para la simulación`);
let diario=[];
// 1) remesa global: 82 pagos con referencia
let antes=fotoPagos(inv);
const msg='BIOH-1785000000000';
let inv2=inv.map(i=>pend.find(p=>p.id===i.id)?{...i,pagos:[...(i.pagos||[]),{id:'pg-'+i.id,fecha:'2026-07-29',importe:+((+i.total||0)-pag(i)).toFixed(2),metodo:'Transferencia SEPA',referencia:msg}]}:i);
let ahora=fotoPagos(inv2);let e=diffPagos(antes,ahora,'remesa SEPA','2026-07-29T10:00:00Z');
ok(e.length===N&&e.every(x=>x.tipo==='pago+'&&x.pago.referencia===msg&&x.origen==='remesa SEPA'),`la remesa deja ${N} entradas «pago+» con su referencia y origen`);
diario=anotar(diario,[entradaRemesa('remesa+',{msgId:msg,fecha:'2026-07-29',nbTxs:N,total:281120.07},'generada','2026-07-29T10:00:00Z'),...e]);
// 2) borrado a mano de 52
antes=ahora;const quitar=new Set(pend.slice(0,Q).map(p=>p.id));
let inv3=inv2.map(i=>quitar.has(i.id)?{...i,pagos:(i.pagos||[]).filter(p=>p.referencia!==msg)}:i);
ahora=fotoPagos(inv3);e=diffPagos(antes,ahora,'ficha: quitar pago','2026-08-02T09:00:00Z');
ok(e.length===Q&&e.every(x=>x.tipo==='pago-'&&x.origen==='ficha: quitar pago'),`${Q} borrados a mano → ${Q} entradas «pago-» con origen`);
diario=anotar(diario,e);
// 3) remesa nueva sobre una que aún constaba pagada: no cambia nada → el diff no inventa
antes=ahora;ahora=fotoPagos(inv3);e=diffPagos(antes,ahora,'remesa SEPA');
ok(e.length===0,'sin cambio de pagos, sin entradas (el diff no inventa)');
// 4) deshacer (vuelve una) → pago+ con origen deshacer
const vuelve=pend[0].id;const inv4=inv3.map(i=>i.id===vuelve?{...i,pagos:[...(i.pagos||[]),(inv2.find(x=>x.id===vuelve).pagos).find(p=>p.referencia===msg)]}:i);
antes=ahora;ahora=fotoPagos(inv4);e=diffPagos(antes,ahora,'deshacer');
ok(e.length===1&&e[0].tipo==='pago+'&&e[0].origen==='deshacer'&&e[0].factura===vuelve,'deshacer deja rastro como «pago+ · deshacer»');
diario=anotar(diario,e);
// 5) factura eliminada con pagos → pago- (factura eliminada)
const inv5=inv4.filter(i=>i.id!==vuelve);antes=ahora;ahora=fotoPagos(inv5);e=diffPagos(antes,ahora,'papelera');
ok(e.length>=1&&e.every(x=>x.tipo==='pago-'&&/factura eliminada/.test(x.origen)),'eliminar una factura con pagos deja «pago- (factura eliminada)»');
diario=anotar(diario,e);
// consultas
ok(deRemesa(diario,msg).length===1+N+Q+1+1,`deRemesa reúne la remesa, sus ${N} altas, las ${Q} bajas, el deshacer y la eliminada (${deRemesa(diario,msg).length})`);
ok(deFactura(diario,vuelve).length===4,'deFactura de la que fue y volvió: alta, baja, deshacer, eliminada (4)');
const csv=csvDiario(diario);
ok(csv.split('\r\n').length===diario.length+1&&csv.startsWith('cuando;tipo;origen;proveedor;numFactura'),'CSV: cabecera + una fila por entrada');
ok(/pago QUITADO/.test(lineaDiario(diario[N+2]))&&/pago apuntado/.test(lineaDiario(diario[1]))&&/remesa\+/.test(lineaDiario(diario[0])),'líneas legibles para la ficha');
// tope: solo se añade, nunca se borra salvo por antigüedad
const grande=anotar([],Array.from({length:TOPE_DIARIO+10},(_,k)=>({t:'2026-01-01T00:00:'+String(k%60).padStart(2,'0')+'Z',tipo:'pago+',factura:'x'+k,cab:{},pago:{importe:1},origen:'x'})));
ok(grande.length===TOPE_DIARIO&&grande[0].factura==='x10','al pasar del tope se van las más antiguas, no las últimas');
// idempotencia de la foto: mismo estado, mismas firmas (no depende del orden de los pagos)
const f1=fotoPagos(inv2),f2=fotoPagos(inv2.map(i=>({...i,pagos:[...(i.pagos||[])].reverse()})));
ok(diffPagos(f1,f2,'x').length===0,'el orden de los pagos no genera entradas falsas');
// ── v368 · diario para todo: contratos con datos reales ────────────────────
{const contratos=JSON.parse(copia.claves['bh10-contratos']||'[]');
 ok(contratos.length>10,`${contratos.length} contratos reales`);
 const f0=fotoEntidades(contratos);
 const c2=contratos.map((c,i)=>i===0?{...c,cliente:'OTRO CLIENTE',importe:1}:c).slice(1).concat([{id:'nuevo1',numero:'P-2026/099',cliente:'NUEVO'}]);
 const ent=diffEntidades(f0,fotoEntidades(c2),'contratos','ficha de contrato','2026-09-06T10:00:00Z');
 ok(ent.some(e=>e.tipo==='ent+'&&e.nombre==='P-2026/099')&&ent.some(e=>e.tipo==='ent-'),'alta y baja de contrato anotadas con su nombre');
 const cambio=ent.find(e=>e.tipo==='ent~');
 ok(!cambio||(cambio.campos.includes('cliente')&&cambio.campos.includes('importe')),'un cambio anota exactamente los campos tocados');
 ok(diffEntidades(f0,fotoEntidades(contratos),'contratos','x').length===0,'sin cambios, sin apuntes');
 ok(diffEntidades(f0,fotoEntidades([...contratos].reverse()),'contratos','x').length===0,'reordenar no genera apuntes');
 const d2=anotar([],ent);ok(deColeccion(d2,'contratos').length===ent.length&&/contratos: alta «P-2026\/099»/.test(lineaDiario(ent.find(e=>e.tipo==='ent+'))),'consulta por colección y línea legible');
 ok(csvDiario(d2).includes('contratos: P-2026/099'),'CSV con la colección y el nombre');}
console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<18){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
