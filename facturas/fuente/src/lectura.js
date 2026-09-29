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
