// ═══ SANEADO DE LA LECTURA IA (v397) ═════════════════════════════════════
// Jesús (29-09-2026): el lote de la fototeca del 28/09 entró con 13 facturas
// inventadas. Eran fotos tumbadas 90° (iPhone plano sobre la mesa: el móvil
// no sabe dónde está «arriba») y la IA leyó la página de lado: acertaba algún
// importe y se inventaba proveedor, número y fecha (2002, 2010, 2018…), y en
// cinco puso NUESTRO CIF como CIF del proveedor. El giro se corrige en el
// lector (app.jsx: downscaleImage + reintento con «rot»); aquí se detecta lo
// improbable y se marca para REVISAR en vez de colarse como una factura más.

export const DIAS_ATRAS_MAX=550;    // ≈18 meses: más atrás no llega una factura de un lote de fotos
export const DIAS_ADELANTE_MAX=7;   // una fecha futura es una lectura mala

const norm=(s)=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const diaMs=86400000;
const fechaValida=(s)=>{
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s||'').trim());
  if(!m)return null;
  const d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3]));
  return (d.getUTCMonth()===+m[2]-1&&d.getUTCDate()===+m[3])?d:null;
};

// ctx: {today:'YYYY-MM-DD', miCif, miNombre}
export const avisosLectura=(inv,ctx)=>{
  const out=[];
  if(!inv||typeof inv!=='object')return ['lectura vacía'];
  const c=ctx||{};
  const hoy=fechaValida(c.today)||new Date();
  const f=fechaValida(inv.fecha);
  if(!f)out.push('fecha ilegible');
  else{
    const dias=Math.round((hoy-f)/diaMs);
    if(dias>DIAS_ATRAS_MAX)out.push(`fecha ${inv.fecha}: demasiado antigua`);
    else if(dias<-DIAS_ADELANTE_MAX)out.push(`fecha ${inv.fecha}: futura`);
  }
  const miCif=norm(c.miCif), miNom=norm(c.miNombre);
  const pc=norm(inv.proveedorCif), pr=norm(inv.proveedor);
  if(miCif.length>4&&pc===miCif&&!(miNom.length>5&&(pr.includes(miNom)||miNom.includes(pr))))out.push('el CIF leído es el nuestro, no el del proveedor');
  if(!String(inv.proveedor||'').trim())out.push('sin proveedor');
  else if(/\bPAGAD[OA]\b|\bCOBRAD[OA]\b/.test(pr.replace(/[^A-Z]/g,' ')))out.push('el nombre parece un sello, no un proveedor');
  if(!String(inv.numFactura||'').trim())out.push('sin número de factura');
  const tot=+inv.total||0, base=+inv.importeBase||0;
  if(tot<=0&&base<=0)out.push('importe cero');
  return out;
};

// Quita del proveedor lo que seguro es nuestro (el CIF): mejor vacío que equivocado.
export const saneaLectura=(inv,ctx)=>{
  if(!inv||typeof inv!=='object')return inv;
  const miCif=norm(ctx&&ctx.miCif);
  if(miCif.length>4&&norm(inv.proveedorCif)===miCif){
    const miNom=norm(ctx&&ctx.miNombre), pr=norm(inv.proveedor);
    if(!(miNom.length>5&&(pr.includes(miNom)||miNom.includes(pr))))return {...inv,proveedorCif:''};
  }
  return inv;
};

// ¿Un giro válido tal como lo devuelve la IA en «rot»?
export const giroValido=(v)=>{const n=+v;return [90,180,270].includes(n)?n:0;};

// ═══ OBRA LEÍDA (v399) ════════════════════════════════════════════════════
// Jesús (29-09-2026): «la imputación a obra lo hace mal porque muchas veces
// toma la dirección fiscal de Big House». El dato: ~95 facturas con la nave
// (Neón 7 / nave 12), el domicilio fiscal (Castilla la Mancha 87) o el
// «retira por sus medios» del proveedor escritos como obra. Dos capas:
//   1. esDireccionPropia → cualquier dirección nuestra o de recogida se descarta.
//   2. casarObra → lo que queda se cruza con el catálogo de obras (alias y
//      «otros nombres») y con los valores ya usados, para que «C/ MOZAMBIQUE, 35»
//      caiga en «Mozambique 35,37,39» y no nazca una obra nueva por cada grafía.
import {tokensObra,claveObra} from './obras.js';

const RECOGIDA=/RETIRA\s+POR\s+SUS\s+MEDIOS|RECOG(E|IDA)\s+EN\s+(TIENDA|ALMAC[EÉ]N|MOSTRADOR|OBRA|CENTRO)|PORTES?\s+PROPIOS|WWW\.|HTTPS?:|@|\.COM\b|\.ES\b/i;
const esNum=(t)=>/^\d+[A-Z]?$/.test(t);
const partes=(s)=>{const t=tokensObra(s);return {nums:t.filter(esNum),pal:t.filter(x=>!esNum(x)&&x.length>=3)};};
// ¿«valor» apunta al mismo sitio que «dir»? Misma palabra distintiva y mismo
// número; si «dir» no lleva número, basta con que todas sus palabras estén.
export const mismaDireccion=(valor,dir)=>{
  const a=partes(valor), b=partes(dir);
  if(!b.pal.length)return false;
  const comun=b.pal.filter(p=>a.pal.includes(p));
  if(!comun.length)return false;
  if(!b.nums.length)return comun.length===b.pal.length;
  return b.nums.some(n=>a.nums.includes(n))&&(comun.length===b.pal.length||comun.some(p=>p.length>=4));
};
export const listaDirecciones=(ctx)=>{
  const c=ctx||{};
  const propias=String(c.direccionesPropias||'').split(/\n|;/).map(s=>s.trim()).filter(Boolean);
  const fiscal=[c.miDireccion,c.miCiudad].filter(Boolean).join(', ');
  return [fiscal,...propias].filter(s=>partes(s).pal.length);
};
export const esDireccionPropia=(valor,ctx)=>{
  const v=String(valor||'').trim(); if(!v)return false;
  if(RECOGIDA.test(v))return true;
  const vn=norm(v), miCif=norm(ctx&&ctx.miCif), miNom=norm(ctx&&ctx.miNombre);
  if(miCif.length>4&&vn.includes(miCif))return true;
  if(miNom.length>5&&vn.includes(miNom))return true;
  return listaDirecciones(ctx).some(d=>mismaDireccion(v,d));
};
// Devuelve el nombre de catálogo (alias) o el valor ya usado que corresponde;
// '' si no casa con nada conocido (se conserva lo leído).
export const casarObra=(valor,ctx)=>{
  const v=String(valor||'').trim(); if(!v)return '';
  const kv=claveObra(v); if(!kv)return '';
  const display=ctx&&typeof ctx.obraDisplay==='function'?ctx.obraDisplay:(o)=>String((o&&(o.alias||o.calle))||'');
  for(const o of (ctx&&ctx.obras||[])){
    if(!o||o.activa===false)continue;
    const nombre=display(o); if(!nombre)continue;
    const nombres=[nombre,[o.calle,o.numero].filter(Boolean).join(' '),...(Array.isArray(o.otros)?o.otros:[])].filter(Boolean);
    if(nombres.some(n=>claveObra(n)===kv))return nombre;
    if(nombres.some(n=>partes(n).nums.length&&mismaDireccion(v,n)))return nombre;
  }
  for(const c of (ctx&&ctx.conocidas||[])){
    if(claveObra(c)===kv)return String(c);
  }
  return '';
};
// La obra que entra en el formulario: vacía si es nuestra, casada si se puede.
export const limpiaObra=(valor,ctx)=>{
  const v=String(valor||'').trim(); if(!v)return '';
  if(esDireccionPropia(v,ctx))return '';
  return casarObra(v,ctx)||v;
};
