// ═══ BATERÍA · OBRAS: fusiones seguras, plantilla Excel de ida y vuelta, coste por vivienda (v361) ═══
import fs from 'fs';
import * as XLSX from 'xlsx';
import {leerExcelRecibidas,numeroDeCelda,tokensObra,claveObra,mismaObra,valoresObra,sugerirFusionObras,motivoFusionRazon,plantillaImputacion,leerImputacion,aplicarImputacion,fundirObras,costePorObra,csvCostePorObra,obraDelCatalogo,nombreObra,COLS_OBRAS,COLS_FACTURAS} from '../src/obras.js';
let n=0,mal=0;const ok=(c,t)=>{n++;if(!c){mal++;console.log('  ✗',t);}else console.log('  ✓',t);};
const copia=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const inv=JSON.parse(copia.claves['bh10-fc-v3']);
// ── normalización ─────────────────────────────────────────────────────────
ok(claveObra('C/ NEON, 7, 45200 ILLESCAS, Toledo')==='NEON 7 ILLESCAS'&&claveObra('C. NEON, 7, 45200 ILLESCAS, TOLEDO')==='NEON 7 ILLESCAS','tipo de vía, CP, provincia y puntuación fuera: «C/ NEON, 7…» = «C. NEON, 7…»');
ok(mismaObra('NEON 7, NAVE 12, 45200, Illescas, Toledo','C/ NEON 7 NAVE 12 ILLESCAS')&&!mismaObra('VALDEMORO 1','VALDEMORO 2'),'misma obra con distinto formato; números distintos = obras distintas');
ok(!mismaObra('NEON 7','NEON 12')&&!mismaObra('CARRANQUE','CARRANQUE 3'),'NEON 7 ≠ NEON 12 · CARRANQUE ≠ CARRANQUE 3');
// ── valores reales ────────────────────────────────────────────────────────
const vals=valoresObra(inv);
ok(vals.length>=100&&vals[0].valor==='YUNCOS'&&vals[0].n>200,`${vals.length} valores de obra distintos; el más usado, YUNCOS (${vals[0].n})`);
ok(vals.every(v=>v.n>0&&typeof v.total==='number'),'cada valor con nº de facturas e importe');
// ── sugerencias SEGURAS ───────────────────────────────────────────────────
const sug=sugerirFusionObras(vals);
const todas=sug.flatMap(g=>[g.destino,...g.origenes]);
ok(sug.length>=3,`${sug.length} grupos propuestos`);
const neon=sug.find(g=>/NEON/.test(claveObra(g.destino)));
ok(!!neon&&neon.origenes.length>=2&&[neon.destino,...neon.origenes].every(v=>/NEON/.test(claveObra(v))),`las variantes de NEON 7 van juntas (${neon?1+neon.origenes.length:0})`);
const vald=sug.filter(g=>[g.destino,...g.origenes].some(v=>/VALDEMORO 1/.test(claveObra(v)))&&[g.destino,...g.origenes].some(v=>/VALDEMORO 2/.test(claveObra(v))));
ok(vald.length===0,'NUNCA se propone juntar VALDEMORO 1 con VALDEMORO 2');
const carr=sug.filter(g=>[g.destino,...g.origenes].some(v=>claveObra(v)==='CARRANQUE')&&[g.destino,...g.origenes].some(v=>/CARRANQUE \d/.test(claveObra(v))));
ok(carr.length===0,'ni CARRANQUE con CARRANQUE 3');
ok(sug.every(g=>g.motivo&&g.n>0),'cada grupo dice por qué y cuántas facturas toca');
ok(new Set(todas).size===todas.length,'ningún valor aparece en dos grupos');
// ── fusiones de razón social endurecidas ──────────────────────────────────
ok(motivoFusionRazon('COMERCIAL DURMA, S.L.','COMERCIAL DURMA SL')==='mismo nombre sin S.L./genéricas','misma razón social con y sin S.L.');
ok(motivoFusionRazon('CONSTRUCCIONES LOPEZ','CONSTRUCCIONES GARCIA')==='','dos «CONSTRUCCIONES» distintas: nada (la genérica no une)');
ok(motivoFusionRazon('MIGUEL MAÑAS','MIGUEL MAÑAS S.L',{cif:'B1'},{cif:'B2'})==='','CIFs distintos en las fichas: nunca, aunque el nombre sea igual');
ok(motivoFusionRazon('PINTURAS MAXIMO','PINTURAS MAXIMO Y MEJOR ILLESCAS')==='uno contiene al otro','contenido con palabra distintiva (MAXIMO) → se propone');
ok(motivoFusionRazon('PINTURAS MAX','PINTURAS MAX Y MEJOR ILLESCAS')==='uno contiene al otro','«PINTURAS MAX» ⊂ «PINTURAS MAX Y MEJOR» → se propone (dos palabras en común, una distintiva)');
ok(motivoFusionRazon('COMERCIAL SUR','COMERCIAL DEL SUR ILLESCAS')==='','solo genéricas en común (COMERCIAL, SUR) → no se propone');
ok(motivoFusionRazon('TALLERES OÑATE 1','TALLERES OÑATE 2')==='','números distintos: nunca');
ok(motivoFusionRazon('DISETOGAR SL','DISETOGAR S.L.',{cif:'B45'},{cif:'B45'})==='mismo CIF','mismo CIF manda');
ok(motivoFusionRazon('ADT','ADR')==='','nombres cortos casi iguales: no se propone (ADT ≠ ADR)');
// ── plantilla de ida y vuelta ─────────────────────────────────────────────
// forma real del catálogo de la app: alias = nombre, otros = otros nombres
const obras=[{id:'ob1',alias:'YUNCOS',calle:'',numero:'',municipio:'',activa:true,cliente:'',viviendas:8,otros:[]},{id:'ob2',alias:'',calle:'NEON',numero:'7',municipio:'',activa:true,viviendas:0,otros:['C/ NEON, 7, 45200 ILLESCAS, TOLEDO']}];
const pl=plantillaImputacion(inv,obras);
ok(pl.hojaObras[0].join('|')===COLS_OBRAS.join('|')&&pl.hojaFacturas[0].join('|')===COLS_FACTURAS.join('|'),'cabeceras de las dos hojas');
const fisc=inv.filter(i=>!['anticipo','cobro','personal','presupuesto'].includes(i.tipo)&&!i.anulada);
ok(pl.hojaFacturas.length===1+fisc.length,`hoja Facturas: una fila por recibida fiscal (${fisc.length})`);
const casanCat=vals.filter(v=>obraDelCatalogo(v.valor,obras)).length;
ok(pl.hojaObras.length===1+obras.length+(vals.length-casanCat),`hoja Obras: catálogo (${obras.length}) + valores sueltos (${vals.length-casanCat})`);
const filaY=pl.hojaFacturas.find(f=>f[5]==='YUNCOS');
ok(filaY&&filaY[6]==='YUNCOS','«Obra» precargada cuando la actual casa con el catálogo');
const filaAlias=pl.hojaFacturas.find(f=>f[5]==='C/ NEON, 7, 45200 ILLESCAS, TOLEDO');
ok(filaAlias&&filaAlias[6]==='NEON 7','…y cuando casa con un alias');
const filaSuelta=pl.hojaFacturas.find(f=>f[5]==='ILLESCAS PARQUE');
ok(filaSuelta&&filaSuelta[6]==='','sin casar → «Obra» vacía para rellenar');
// vuelta: Jesús añade una obra y rellena
const hojaObras=[COLS_OBRAS,['YUNCOS','',10,'activa','',0,0],['ILLESCAS PARQUE','Promotora X','24','activa','ILLESCAS PARQUE FASE 2;PARQUE ILLESCAS',0,0]];
const hojaFact=[COLS_FACTURAS,...pl.hojaFacturas.slice(1).map(f=>{const g=[...f];if(f[5]==='ILLESCAS PARQUE')g[6]='illescas parque';if(f[5]==='VALDEMORO 1')g[6]='OBRA QUE NO EXISTE';return g;})];
const lec=leerImputacion(hojaObras,hojaFact,inv,obras);
ok(lec.errores.length===0,'sin errores de formato');
ok(lec.nuevas.includes('ILLESCAS PARQUE')&&lec.actualizadas.includes('YUNCOS'),'obra nueva creada y YUNCOS actualizada (viviendas 8→10)');
ok(lec.catalogo.find(o=>o.alias==='ILLESCAS PARQUE').viviendas===24&&lec.catalogo.find(o=>o.alias==='ILLESCAS PARQUE').otros.length===2&&lec.catalogo.find(o=>o.alias==='ILLESCAS PARQUE').activa===true,'viviendas, otros nombres y estado leídos; forma del catálogo de la app');
const nIP=vals.find(v=>v.valor==='ILLESCAS PARQUE').n;
ok(lec.asignaciones.filter(a=>a.despues==='ILLESCAS PARQUE').length===0&&lec.sinCambio>=nIP,'«illescas parque» (minúsculas) casa con la obra y, como ya lo eran, cuenta como sin cambio');
ok(lec.desconocidas.length===1&&lec.desconocidas[0].nombre==='OBRA QUE NO EXISTE'&&lec.desconocidas[0].n===vals.find(v=>v.valor==='VALDEMORO 1').n,'un nombre que no está en la hoja Obras no se aplica: se devuelve como desconocido con su cuenta');
// ahora una reasignación real: mover NEON 7 (alias) a YUNCOS
const hojaFact2=[COLS_FACTURAS,...pl.hojaFacturas.slice(1).map(f=>{const g=[...f];if(f[6]==='NEON 7')g[6]='YUNCOS';return g;})];
const lec2=leerImputacion(hojaObras,hojaFact2,inv,obras);
const nNeonAlias=pl.hojaFacturas.slice(1).filter(f=>f[6]==='NEON 7').length;
// lo que cambia: las de NEON 7 y las que ya casaban con YUNCOS por normalización («OBRA YUNCOS» → «YUNCOS»)
const esperadas=hojaFact2.slice(1).filter(f=>f[6]&&f[6]!==f[5]).length;
ok(lec2.asignaciones.length===esperadas&&lec2.asignaciones.filter(a=>a.antes!=='OBRA YUNCOS').length>=nNeonAlias&&lec2.asignaciones.every(a=>a.despues==='YUNCOS'&&a.antes),`reasignación por id: ${lec2.asignaciones.length} facturas → YUNCOS (${nNeonAlias} de NEON 7 + las que se normalizan), con su obra anterior`);
const inv2=aplicarImputacion(inv,lec2.asignaciones);
ok(inv2.filter(i=>String(i.obra)==='YUNCOS').length===inv.filter(i=>i.obra==='YUNCOS').length+esperadas&&inv2.length===inv.length,'aplicar cambia solo esas y no pierde facturas');
// ── fundir ────────────────────────────────────────────────────────────────
const f=fundirObras(inv,obras,neon?[...neon.origenes,neon.destino]:['NEON 7, NAVE 12, 45200, Illescas, Toledo'],'NEON 7');
ok(f.cambiadas>0&&f.obras.find(o=>o.calle==='NEON').otros.length>=obras[1].otros.length,`fundir: ${f.cambiadas} facturas pasan a «NEON 7» y los nombres viejos quedan como otros nombres`);
ok(f.invoices.length===inv.length&&!f.invoices.some(i=>neon&&neon.origenes.includes(String(i.obra))),'tras fundir no queda ninguna con el nombre viejo');
// ── coste por obra y vivienda ─────────────────────────────────────────────
const coste=costePorObra(inv,[{alias:'YUNCOS',viviendas:8,otros:[]}]);
const y=coste.find(c=>c.obra==='YUNCOS');
const yun=fisc.filter(i=>claveObra(i.obra)==='YUNCOS');
ok(y&&y.enCatalogo&&y.n===yun.length&&Math.abs(y.total-yun.reduce((s,i)=>s+(+i.total||0),0))<0.01,`coste de YUNCOS: ${y.n} facturas (agrupa «Yuncos» y «YUNCOS»), mismo importe`);
ok(y.porVivienda===Math.round(y.total/8*100)/100&&y.basePorVivienda===Math.round(y.base/8*100)/100,'coste por vivienda = total/viviendas y base/viviendas');
ok(coste.find(c=>c.obra==='ILLESCAS PARQUE').porVivienda===null,'sin viviendas en el catálogo → sin coste por vivienda (no se inventa)');
const periodo=costePorObra(inv,[],{desde:'2026-07-01',hasta:'2026-07-31'});
ok(periodo.every(c=>c.n>0)&&periodo.reduce((s,c)=>s+c.n,0)===fisc.filter(i=>String(i.fecha||'')>='2026-07-01'&&String(i.fecha||'')<='2026-07-31').length,'con periodo, solo las facturas de julio');
const csv=csvCostePorObra(coste);
ok(csv.split('\r\n').length===coste.length+1&&csv.includes('total_por_vivienda'),'CSV con una fila por obra');
// ── v362 · el Excel normal de Recibidas con una columna «Calle» (el de Jesús del 04-09) ──
// v369 (06-09-2026) · el fichero del 04-09 no viaja (datos reales): se usa el
// MISMO Excel regenerado desde la copia del 06-09 con el formato exacto del
// export previo a v362 (hoja «Datos», sin Obra ni id: el id lo añade la propia batería). 886 filas.
ok(numeroDeCelda('$34,485.00€')===34485&&numeroDeCelda('34.485,00')===34485&&numeroDeCelda('12,5')===12.5&&numeroDeCelda(-641.02)===-641.02,'importes en cualquier formato de celda');
{
  const wb=XLSX.read(fs.readFileSync('/home/claude/copia/facturas_recibidas_2026-09-06.xlsx'),{type:'buffer'});
  const hoja=XLSX.utils.sheet_to_json(wb.Sheets['Datos'],{header:1,raw:true,defval:''});
  hoja[0].push('Calle');for(let k=1;k<hoja.length;k++)hoja[k].push(/MMBA/.test(String(hoja[k][3]||''))?'Calle Mozambique, Yuncos':(k%3===0?'YUNCOS':''));
  const r=leerExcelRecibidas(hoja,inv,[]);
  ok(r.errores.length===0&&r.porClaveN>=870,`el Excel de Recibidas sin id casa ${r.porClaveN} de ${hoja.length-1} filas por empresa + nº + total`);
  ok(r.nuevas.includes('Calle Mozambique, Yuncos')&&r.catalogo.some(o=>nombreObra(o)==='Calle Mozambique, Yuncos'),'una calle nueva en la columna crea la obra en el catálogo');
  ok(r.asignaciones.length>100&&r.asignaciones.every(a=>a.despues==='YUNCOS'||a.despues==='Calle Mozambique, Yuncos'),`${r.asignaciones.length} facturas cambian de obra según la columna Calle`);
  ok(r.sinCambio>0&&r.vacias>0&&r.ambiguas<=3&&r.idsMal<=5,`sin cambio ${r.sinCambio} · vacías ${r.vacias} · ambiguas ${r.ambiguas} · sin casar ${r.idsMal}`);
  // con la columna id (el export desde v362) casa por id aunque cambie el nombre del proveedor
  hoja[0].push('id (no tocar)');const porClave=new Map(inv.map(i=>[[String(i.proveedor||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,18),String(i.numFactura||'').toUpperCase().replace(/[^A-Z0-9]/g,''),(+i.total||0).toFixed(2)].join('|'),i.id]));
  for(let k=1;k<hoja.length;k++){const f=hoja[k];const key=[String(f[3]||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,18),String(f[2]||'').toUpperCase().replace(/[^A-Z0-9]/g,''),numeroDeCelda(f[7]).toFixed(2)].join('|');f.push(porClave.get(key)||'');f[3]='X '+f[3];}
  const r2b=leerExcelRecibidas(hoja,inv,[]);
  ok(r2b.porIdN>=870&&r2b.asignaciones.length===r.asignaciones.length,`con id, casa por id (${r2b.porIdN}) aunque el nombre de la empresa haya cambiado`);
  ok(leerExcelRecibidas([['Fecha','Empresa','Total']],inv,[]).errores.length>0,'sin columna de obra ni Nº factura → error claro, no aplica nada');
}

console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<25){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
