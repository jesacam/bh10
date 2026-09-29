// ═══ BANCOS · Norma 43, conciliación y saneado SEPA ═══
import {normTxtDup} from './fichas';
// ¿Aparece el nombre del proveedor en el concepto del movimiento bancario?
const provEnTexto=(prov,texto)=>{
  const tp=normProvNombre(prov).split(' ').filter(t=>t.length>=5);
  if(!tp.length)return false;
  const tt=normProvNombre(texto);
  return tp.some(t=>tt.includes(t));
};

import {normProvNombre} from './fichaje';
const normNumFra=(s)=>normTxtDup(s).replace(/^0+(?=\d)/,'');

import {problemaIban,normIban} from './embargos';
// Devuelve '' si el IBAN es correcto, o el motivo en castellano si no lo es
// ═══ REVISIÓN PREVIA DE LA REMESA ═══
// El banco valida el fichero entero: un solo dato mal y devuelve la remesa
// completa. Estas comprobaciones replican lo que rechaza para poder corregirlo
// aquí, en un minuto, en vez de descubrirlo en la banca electrónica.
const SEPA_MAX_NOMBRE=70, SEPA_MAX_CONCEPTO=140;

// ═══ Norma 43 (AEB): parser de extracto + conciliador ═══
const parseN43=(txt)=>{
  const lineas=String(txt||'').split(/\r?\n/);
  const movs=[];let actual=null;
  const imp=(s)=>{const n=parseInt(s,10);return isNaN(n)?0:n/100;};
  const fech=(s)=>'20'+s.slice(0,2)+'-'+s.slice(2,4)+'-'+s.slice(4,6);
  for(const ln of lineas){
    const t=ln.slice(0,2);
    if(t==='22'&&ln.length>=42){
      actual={fechaOp:fech(ln.slice(10,16)),fechaVal:fech(ln.slice(16,22)),cargo:ln[27]==='1',importe:imp(ln.slice(28,42)),texto:(ln.slice(52)||'').trim()};
      movs.push(actual);
    }else if(t==='23'&&actual){
      actual.texto=(actual.texto+' '+ln.slice(4).trim()).trim();
    }
  }
  return movs;
};

const conciliaN43=(movs,pendientes)=>{
  // El extracto lo genera el banco: puede traer líneas incompletas
  movs=(Array.isArray(movs)?movs:[]).filter(x=>x&&typeof x==='object');
  // pendientes: [{id,proveedor,saldo}] · devuelve {casados:[{mov,facturas:[{id,saldo}],nivel}],sinCasar:[mov]}
  const enTexto=provEnTexto;
  const usadas=new Set();
  const casados=[],sinCasar=[];
  for(const m of movs){
    if(!m.cargo||m.importe<=0){continue;}
    const libres=pendientes.filter(p=>!usadas.has(p.id));
    const conNombre=libres.filter(p=>enTexto(p.proveedor,m.texto));
    let hit=null;
    const uno=conNombre.find(p=>Math.abs(p.saldo-m.importe)<=0.01);
    if(uno)hit={facturas:[uno],nivel:'seguro'};
    if(!hit&&conNombre.length){
      const porProv={};
      conNombre.forEach(p=>{(porProv[normProvNombre(p.proveedor)]=porProv[normProvNombre(p.proveedor)]||[]).push(p);});
      for(const g of Object.values(porProv)){
        const suma=+g.reduce((s,p)=>s+p.saldo,0).toFixed(2);
        if(Math.abs(suma-m.importe)<=0.01){hit={facturas:g,nivel:'seguro'};break;}
      }
    }
    if(!hit){
      const soloImporte=libres.filter(p=>Math.abs(p.saldo-m.importe)<=0.01);
      if(soloImporte.length===1)hit={facturas:[soloImporte[0]],nivel:'probable'};
    }
    if(hit){hit.facturas.forEach(p=>usadas.add(p.id));casados.push({mov:m,...hit});}
    else sinCasar.push(m);
  }
  return {casados,sinCasar};
};

// ═══ Ajuste de fechas de pago con el extracto: cargos del banco ↔ facturas YA
// pagadas cuya fecha de pago es un relleno de importación (Excel / en bloque).
// Solo propone candidatos coherentes (cargo posterior o igual a la emisión,
// mismo importe total); el usuario confirma cada uno antes de aplicar.
// pagadas: [{id,proveedor,total,fecha,fechaPago,numFactura}]
// movsUsados: Set de movimientos ya consumidos por la conciliación de pendientes
const ajustaFechasN43=(movs,pagadas,movsUsados)=>{
  // El extracto lo genera el banco: puede traer líneas incompletas
  movs=(Array.isArray(movs)?movs:[]).filter(x=>x&&typeof x==='object');
  const usadas=new Set();
  const ajustes=[];
  for(const m of movs){
    if(!m.cargo||m.importe<=0)continue;
    if(movsUsados&&movsUsados.has(m))continue;
    const cand=pagadas.filter(p=>!usadas.has(p.id)
      &&Math.abs(p.total-m.importe)<=0.01
      &&String(m.fechaVal)>=String(p.fecha||'')
      &&p.fechaPago!==m.fechaVal);
    if(!cand.length)continue;
    const conNombre=cand.filter(p=>provEnTexto(p.proveedor,m.texto));
    let hit=null,nivel='';
    if(conNombre.length===1){hit=conNombre[0];nivel='seguro';}
    else if(conNombre.length>1){
      // mismo proveedor e importe repetidos: se propone la de emisión más
      // reciente anterior al cargo, marcada para revisar a mano
      hit=[...conNombre].sort((a,b)=>String(b.fecha||'').localeCompare(String(a.fecha||'')))[0];
      nivel='probable';
    }else if(cand.length===1){hit=cand[0];nivel='probable';}
    if(hit){usadas.add(hit.id);ajustes.push({mov:m,factura:hit,nivel});}
  }
  return ajustes;
};

// SEPA solo admite el juego de caracteres latino básico: las tildes y la ñ se
// transcriben, y lo que no tenga equivalente se sustituye por un espacio.
const limpiaSepa=(s)=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^A-Za-z0-9\/\-?:().,'+ ]/g,' ').replace(/\s{2,}/g,' ').trim();

const problemaBic=(s)=>{
  const b=String(s||'').replace(/\s/g,'').toUpperCase();
  if(!b)return '';   // el BIC es opcional en SEPA desde 2016
  if(!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(b))return 'el BIC no tiene forma válida (8 u 11 caracteres)';
  return '';
};

// fecha: ni pasada ni fin de semana, que el banco no ejecuta
const problemaFechaEjec=(iso,hoyIso)=>{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(iso||'')))return 'la fecha de ejecución no es válida';
  if(hoyIso&&iso<hoyIso)return 'la fecha de ejecución ya ha pasado';
  const d=new Date(iso+'T12:00:00');
  const dia=d.getDay();
  if(dia===0||dia===6)return 'la fecha de ejecución cae en fin de semana: el banco no la procesará ese día';
  return '';
};

// Revisión completa: devuelve la lista de problemas que impedirían el envío
const revisarRemesa=(p)=>{
  const {ordenante,lineas,fechaEjec,hoy}=(p&&typeof p==='object')?p:{};
  const errores=[],avisos=[];
  const o=ordenante||{};
  if(!String(o.nombre||'').trim())errores.push('falta el nombre de tu empresa');
  if(!String(o.cif||'').trim())errores.push('falta el CIF de tu empresa');
  const pio=problemaIban(o.iban);
  if(pio)errores.push(`el IBAN de tu empresa: ${pio}`);
  const pbo=problemaBic(o.bic);
  if(pbo)errores.push(`el BIC de tu empresa: ${pbo}`);
  const pf=problemaFechaEjec(fechaEjec,hoy);
  if(pf)(/fin de semana/.test(pf)?avisos:errores).push(pf);
  const l=lineas||[];
  if(!l.length)errores.push('no hay ninguna factura seleccionada');
  const vistos={};
  l.forEach((x,ix)=>{
    const quien=x.nombre||`línea ${ix+1}`;
    const pi=problemaIban(x.iban);
    if(pi)errores.push(`${quien}: ${pi}`);
    const pb=problemaBic(x.bic);
    if(pb)errores.push(`${quien}: ${pb}`);
    if(!String(x.nombre||'').trim())errores.push(`línea ${ix+1}: falta el nombre del beneficiario`);
    if(limpiaSepa(x.nombre).length>SEPA_MAX_NOMBRE)avisos.push(`${quien}: el nombre se recortará a ${SEPA_MAX_NOMBRE} caracteres`);
    if(limpiaSepa(x.concepto).length>SEPA_MAX_CONCEPTO)avisos.push(`${quien}: el concepto se recortará a ${SEPA_MAX_CONCEPTO} caracteres`);
    const imp=+x.importe||0;
    if(!(imp>0))errores.push(`${quien}: el importe tiene que ser mayor que cero`);
    if(imp>999999999.99)errores.push(`${quien}: importe fuera de rango`);
    if(Math.abs(imp*100-Math.round(imp*100))>1e-6)errores.push(`${quien}: el importe tiene más de dos decimales`);
    // Dos líneas al mismo proveedor por el mismo importe son NORMALES: los
    // proveedores facturan cada chalet por separado y el coste coincide. Solo
    // preocupa si además es la MISMA factura, o si no hay número que las
    // distinga —entonces no hay forma de saber si es una repetida—.
    const num=normNumFra(x.num);
    const clave=normIban(x.iban)+'|'+imp.toFixed(2)+'|'+num;
    if(vistos[clave]){
      avisos.push(num
        ?`${quien}: la factura ${x.num} aparece dos veces en la remesa — se pagaría por duplicado`
        :`${quien}: otra línea con el mismo IBAN e importe y sin nº de factura que las distinga — comprueba que no es la misma`);
    }else vistos[clave]=quien;
  });
  const suma=+l.reduce((s,x)=>s+(+x.importe||0),0).toFixed(2);
  return {ok:errores.length===0,errores,avisos,total:suma,n:l.length};
};
export {provEnTexto,normNumFra,SEPA_MAX_NOMBRE,parseN43,conciliaN43,ajustaFechasN43,limpiaSepa,problemaBic,problemaFechaEjec,revisarRemesa};
