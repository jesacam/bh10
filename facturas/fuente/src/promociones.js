// ═══ PROMOCIONES · líneas de PDF, Excel, fusión y agrupado ═══
import {fmt} from './basicos';
const lineasPromoPdf=(grupos,codigo)=>{
  const L=['MEJORAS DE LA PROMOCIÓN '+String(codigo||'').toUpperCase(),''];
  let suma=0;
  (grupos||[]).forEach(g=>{
    suma+=+g.ultima.total||0;
    L.push('Vivienda '+g.vivienda+' — '+(g.ultima.nombre||'—'));
    L.push('   DNI '+(g.ultima.dni||'—')+' · '+(g.ultima.telefono||'sin teléfono')+' · '+(g.ultima.verificada?('VERIFICADA '+(g.ultima.verificada.en||'')):'SIN VERIFICAR'));
    L.push('   Mejoras: +'+fmt(+g.ultima.total||0)+' € · última '+String(g.ultima.enviadoISO||'').slice(0,10)+(g.versiones.length>1?' · '+g.versiones.length+' versiones':''));
    L.push('');
  });
  L.push('TOTAL MEJORAS DE LA PROMOCIÓN: +'+fmt(suma)+' € · '+(grupos||[]).length+' viviendas');
  return L;
};

const filasPromoExcel=(grupos)=>{
  const viv=(grupos||[]).map(g=>({
    'Vivienda':g.vivienda,'Comprador':g.ultima.nombre||'','DNI':g.ultima.dni||'',
    'Teléfono':g.ultima.telefono||'','Email':g.ultima.email||'','Mejoras (€)':+(+g.ultima.total||0).toFixed(2),
    'Estado':g.ultima.verificada?('VERIFICADA '+(g.ultima.verificada.en||'')):'SIN VERIFICAR',
    'Última':String(g.ultima.enviadoISO||'').slice(0,10),'Versiones':g.versiones.length,
    'Corregida':g.ultima.editadoEn?('sí ('+g.ultima.editadoEn+')'):''}));
  const hist=[];
  (grupos||[]).forEach(g=>g.versiones.forEach((v,ix)=>hist.push({
    'Vivienda':g.vivienda,'Versión':g.versiones.length-ix,'Fecha':String(v.enviadoISO||'').slice(0,16).replace('T',' '),
    'Comprador':v.nombre||'','DNI':v.dni||'','Mejoras (€)':+(+v.total||0).toFixed(2),
    'Vigente':ix===0?'sí':''})));
  return {viv,hist};
};

const fusionaPromo=(prev,llegados,hoy)=>{
  const next={...(prev||{})}; let nuevos=0;
  (Array.isArray(llegados)?llegados:[]).forEach(r=>{
    if(!r||r.tipo!=='configuracion'||!r.id||next[r.id])return;
    next[r.id]={id:r.id,tipo:'configuracion',promocion:r.promocion||'',vivienda:r.vivienda||'',
      nombre:r.nombre||'',dni:(r.cif&&r.cif!=='—')?r.cif:'',telefono:r.telefono||'',email:r.email||'',
      total:+(+r.total||0),resumenHtml:r.resumenHtml||'',enviadoISO:r.enviadoISO||'',recibidoEn:hoy||''};
    nuevos++;
  });
  return {next,nuevos};
};

const agrupaPromo=(items,codigo)=>{
  const porViv={};
  (Array.isArray(items)?items:[]).forEach(x=>{
    if(!x||x.borrado||x.tipo!=='configuracion')return;
    if(codigo&&String(x.promocion||'').trim().toLowerCase()!==String(codigo).trim().toLowerCase())return;
    const v=String(x.vivienda||'—');
    (porViv[v]=porViv[v]||[]).push(x);
  });
  return Object.keys(porViv).sort((a,b)=>a.localeCompare(b,'es',{numeric:true})).map(v=>{
    const vers=porViv[v].slice().sort((a,b)=>String(b.enviadoISO||'').localeCompare(String(a.enviadoISO||'')));
    return {vivienda:v,ultima:vers[0],versiones:vers};
  });
};
export {lineasPromoPdf,filasPromoExcel,fusionaPromo,agrupaPromo};
