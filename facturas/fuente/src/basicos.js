// ═══ BÁSICOS · formato y análisis de números y fechas ═══
const fmt = n => {
  const v = Number(n);
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true
  }).format(Number.isFinite(v) ? v : 0);
};

const fmtK = n => {if(Math.abs(n)>=1e6)return(n/1e6).toFixed(1).replace('.',',')+' M';if(Math.abs(n)>=1e3)return(n/1e3).toFixed(1).replace('.',',')+' k';return fmt(n);};

const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,7);

// Cuándo se dio de alta la factura en la app (distinto de la fecha del papel).
// Las nuevas lo guardan en fechaRegistro; las anteriores no lo tienen, pero el
// identificador empieza por la marca de tiempo en base 36, así que se recupera
// de ahí siempre que dé una fecha creíble.
const fechaRegistroDe = (inv) => {
  if(!inv) return '';
  if(inv.fechaRegistro) return inv.fechaRegistro;
  const id = String(inv.id||'');
  if(id.length < 8) return '';
  const ms = parseInt(id.slice(0,-5), 36);
  if(!Number.isFinite(ms)) return '';
  const d = new Date(ms);
  const a = d.getFullYear();
  if(a < 2020 || d.getTime() > Date.now()+864e5) return '';
  return d.toISOString().slice(0,10);
};

const fmtDate = d => {const s=typeof d==='string'?d:'';return s?s.split('-').reverse().join('/'):'—';};

// ═══ PARSE NUMÉRICO ESPAÑOL — acepta "1.234,56", "1234,56" y "1234.56" ═══
const parseNum = v => {
  if (typeof v === 'number') return Number.isFinite(v)?v:0;
  if (!v) return 0;
  if (typeof v === 'object') return 0;
  let s = String(v).trim().replace(/\s/g,'').replace(/€/g,'');
  if (s.includes(',') && s.includes('.')) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g,'').replace(',','.');
    else s = s.replace(/,/g,'');
  } else if (s.includes(',')) s = s.replace(',','.');
  const _n=parseFloat(s) || 0;
  return Number.isFinite(_n)?_n:0;
};
export {fmt,fmtK,uid,fechaRegistroDe,fmtDate,parseNum};
