// ═══ BATERÍA · AUDITORÍA DE REMESAS Y PAGOS (v359) ════════════════════════
// Con la copia real del 03-09-2026 y un extracto sintético construido a
// partir de lo que el banco ejecutó de verdad esos días (remesas, la del
// 31-08 en dos cargos, transferencias manuales con nº de factura). Tiene
// que reproducir el cotejo hecho a mano: remesas sin pagos, ADD SUELOS,
// pagos sin rastro, pendientes con cargo (y NO inventar).
import fs from 'fs';
import {remesasSinPagos,facturasEnVariasRemesas,pagosSinRastro,pendientesConCargo,evidenciaDePago,csvAuditoria,palabrasProv,numerosDelConcepto} from '../src/auditoria.js';
let n=0,mal=0;const ok=(c,t)=>{n++;if(!c){mal++;console.log('  ✗',t);}else console.log('  ✓',t);};
const copia=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const inv=JSON.parse(copia.claves['bh10-fc-v3']);const rem=JSON.parse(copia.claves['bh10-remesas']);
// v369 (06-09-2026) · re-anclada a la copia del 06-09 (la del 03-09 no viaja):
// 946 facturas y 23 remesas, contadas aparte en Python sobre el JSON crudo.
// El resto de anclas (remesas sin pagos, ADD SUELOS, pendientes con cargo)
// siguen cumpliéndose tal cual con los datos nuevos: el cotejo a mano vale.
ok(inv.length===946&&rem.length===23,'copia real del 06-09: 946 facturas y 23 remesas');

ok(palabrasProv('TÉCNICAS ESPECIALES PLACESA, S.L.').includes('PLACESA')&&!palabrasProv('J MARTÍN CARO, S.L.').includes('S.L.'),'palabras del proveedor sin S.L. ni artículos');
ok(numerosDelConcepto('TRANSF PARA AZASTONE 2018 PAGO FACT 260122,260125').join(',')==='260122,260125'&&numerosDelConcepto('REM.TRANSFERENCIAS').length===0,'números de factura del concepto (solo tras FACT)');

// 1) remesas sin pagos apuntados: en la copia real son 4 (05-08 dup, 11-08, 14-08, 01-09)
const sp=remesasSinPagos(rem,inv);
ok(sp.length===4&&sp.map(x=>x.remesa.fecha).sort().join(',')==='2026-08-05,2026-08-11,2026-08-14,2026-09-01',`remesas sin pagos: ${sp.map(x=>x.remesa.fecha+' '+x.remesa.total).join(' · ')}`);
// 2) facturas en varias remesas: Aislenvas (11-08 y 31-08), Talleres Oñate (14-08 y 31-08), Piscinas (05-08 ×2), ADD SUELOS (29-07 y 01-09)…
const varias=facturasEnVariasRemesas(rem,inv);
const nombres=new Set(varias.map(x=>String(x.factura.proveedor).toUpperCase()));
ok([...nombres].some(x=>/AISLAMIENTOS/.test(x))&&[...nombres].some(x=>/OÑATE|ONATE/.test(x))&&[...nombres].some(x=>/ADD SUELOS/.test(x)),`facturas en varias remesas: ${varias.length} (Aislenvas, Oñate y ADD SUELOS entre ellas)`);
ok(varias.every(x=>x.remesas.length>=2),'cada una lista sus remesas');

// 3) extracto sintético: lo que el banco ejecutó (según los movimientos reales del 03-09)
const REM=[['2026-09-01',8164.70],['2026-09-01',48867.76],['2026-08-31',59999.85],['2026-08-25',24027.21],['2026-08-25',30196.53],['2026-08-20',22.30],['2026-08-17',1192.72],['2026-08-10',12389.96],['2026-08-07',7359.90],['2026-08-06',3630.00],['2026-08-05',2556.40],['2026-08-04',32710.00],['2026-07-29',302.50],['2026-07-28',4036.65],['2026-07-28',29048.90],['2026-07-22',968.00]];
const movs=REM.map(([f,imp])=>({fechaOp:f,fechaVal:f,cargo:true,importe:imp,texto:'REM.TRANSFERENCIAS'}));
movs.push({fechaOp:'2026-07-29',cargo:true,importe:15675.76,texto:'TRANSF PARA PLACESA PAG FACT 41'});
movs.push({fechaOp:'2026-07-27',cargo:true,importe:1462.12,texto:'TRANSF PARA AZASTONE 2018 PAGO FACT 260122,260125'});
movs.push({fechaOp:'2026-07-22',cargo:true,importe:19465.85,texto:'S/ORD.TRANS MIGUEL MAÑAS PAG FACT 852,1197,1198,1199'});
movs.push({fechaOp:'2026-07-22',cargo:true,importe:13190.00,texto:'TRANSF PARA DISETOGAR PAG FACT 26,29'});
movs.push({fechaOp:'2026-07-15',cargo:true,importe:11712.64,texto:'TRANSF PARA MONTAJES ELECTRICOS PAGAR FACT 6,98,64,35,40,41,50,62'});
movs.push({fechaOp:'2026-08-12',cargo:true,importe:22.40,texto:'RECIBO WURTH ESPANA S.A.'});
movs.push({fechaOp:'2026-08-12',cargo:true,importe:121.73,texto:'RECIBO WURTH ESPANA S.A.'});
movs.push({fechaOp:'2026-08-02',cargo:false,importe:5000,texto:'INGRESO CLIENTE'});
// evidencia: la remesa 31-08 (108.867,61) se ve como dos cargos
const r3108=rem.find(r=>r.fecha==='2026-08-31'&&r.nbTxs===20);
const iAis=inv.find(i=>/AISLAMIENTOS/i.test(i.proveedor)&&String(i.numFactura)==='001/260000004400');
const pAis=iAis.pagos.find(p=>String(p.referencia)===String(r3108.msgId));
ok(/dos cargos/.test(evidenciaDePago(pAis,iAis,movs,rem)),'la remesa del 31-08 se reconoce partida en dos cargos (59.999,85 + 48.867,76)');
// ADD SUELOS: pago manual 01-09 8.164,70 → REM del mismo día
const iAdd=inv.find(i=>/ADD SUELOS/i.test(i.proveedor)&&String(i.numFactura)==='27');
ok(!!evidenciaDePago(iAdd.pagos[0],iAdd,movs,rem),'ADD SUELOS: el pago manual del 01-09 casa con el cargo de 8.164,70 del mismo día');
// Azastone 260122 (1.385,89) pagada dentro de una transferencia de 1.462,12 con su nº en el concepto
const iAz=inv.find(i=>/AZASTONE/i.test(i.proveedor)&&String(i.numFactura)==='260122');
ok(!!iAz&&/nº en el concepto/.test(evidenciaDePago(iAz.pagos[0],iAz,movs,rem)),'Azastone 260122: evidencia por el nº de factura en el concepto');
// pagos sin rastro: Strive, Bunker y JPC 242/2025 tienen que salir; Placesa y ADD SUELOS no
const sr=pagosSinRastro(inv,movs,rem,{desde:'2026-07-02',hasta:'2026-09-02'});
const nomSr=sr.map(x=>String(x.factura.proveedor).toUpperCase());
ok(nomSr.some(x=>/STRIVE/.test(x))&&nomSr.some(x=>/BUNKER/.test(x))&&sr.some(x=>String(x.factura.numFactura)==='242/2025'),'pagos sin rastro: Strive, Bunker y JPC 242/2025 salen');
ok(!nomSr.some(x=>/PLACESA/.test(x))&&!sr.some(x=>/ADD SUELOS/i.test(x.factura.proveedor)),'Placesa y ADD SUELOS NO salen (tienen su cargo)');
ok(!sr.some(x=>/EFECTIVO|TARJETA|PROMOTOR|ANTICIPADO/i.test(String(x.pago.metodo))),'efectivo, tarjeta, promotor y anticipado nunca cuentan como «sin rastro»');
ok(sr.every(x=>x.motivo),'cada pago sin rastro dice por qué');
// pendientes con cargo: ninguna real; un cargo anterior a la factura no la paga (Montajes 026116 del 03-08 vs transferencia del 15-07)
const pc=pendientesConCargo(inv,movs);
ok(pc.length===0,`pendientes con cargo: ${pc.length} (el cargo del 15-07 no paga la 026116 del 03-08)`);
// y si el extracto trae un cargo que paga una pendiente, sale
const pend=inv.find(i=>/MMBA/i.test(i.proveedor)&&String(i.numFactura)==='53');
const pc2=pendientesConCargo(inv,[...movs,{fechaOp:'2026-09-02',cargo:true,importe:+pend.total,texto:'TRANSF PARA ESTUDIO MMBA PAG FACT 53'}]);
ok(pc2.length===1&&pc2[0].factura.id===pend.id&&/nº de factura/.test(pc2[0].por),'una pendiente con cargo real en el extracto sale, por nº de factura');
// remesa marcada como no ejecutada → sus pagos son «sin rastro» con motivo claro
const remX=rem.map(r=>r.nbTxs===82?{...r,noEjecutada:{en:'2026-09-04'}}:r);
const sr2=pagosSinRastro(inv,movs,remX,{desde:'2026-07-02',hasta:'2026-09-02'});
ok(sr2.filter(x=>/no ejecutada/.test(x.motivo)).length>=30,`los pagos de la remesa global marcada como no ejecutada salen con su motivo (${sr2.filter(x=>/no ejecutada/.test(x.motivo)).length})`);
const csv=csvAuditoria({remesasSinPagos:sp,facturasEnVariasRemesas:varias,pagosSinRastro:sr,pendientesConCargo:pc2});
ok(csv.split('\r\n').length===1+sp.length+varias.length+sr.length+pc2.length&&csv.startsWith('bloque;fecha;proveedor'),'CSV con cabecera y una fila por hallazgo');
console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<14){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
