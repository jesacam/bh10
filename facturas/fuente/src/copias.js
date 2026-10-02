// ═══ COPIAS, RECURRENTES Y NUMERACIÓN · copia v9, motor REC, imitaNumero, series ═══
const seqSerie=(s,series,anio)=>{
  const m=String(s||'').trim().match(/^([A-Za-z]{1,4})\s*[-\s]?\s*(\d{4})\s*[\/\-]\s*(\d{1,6})$/);
  if(!m)return 0;
  if(+m[2]!==anio)return 0;
  if(!series.includes(m[1].toUpperCase()))return 0;
  return +m[3];
};

const siguienteSerie=(fuentes,series,anio,prefijo)=>{
  // Un número de factura mal formado se queda registrado para siempre
  const a=/^\d{4}$/.test(String(anio))?String(anio):String(new Date().getFullYear());
  const p=String(prefijo||'F').replace(/[^A-Za-z0-9]/g,'')||'F';
  let max=0;
  for(const f of (Array.isArray(fuentes)?fuentes:[])) for(const it of ((f&&Array.isArray(f.arr))?f.arr:[])){
    const n=seqSerie(it&&it[f.campo],series,anio);
    if(n>max)max=n;
  }
  return p+'-'+a+'/'+String(max+1).padStart(3,'0');
};

const normNumDoc=(s)=>String(s||'').toUpperCase().replace(/\s+/g,'').replace(/^0+(?=\d)/,'');

// Los pagos que caen dentro de una ventana, para la previsión de tesorería.
// Una póliza mensual genera doce apuntes al año, no uno.
// ═══ MOTOR DE RECURRENTES (aprendizaje del extracto) — encapsulado ═══
const REC=(()=>{
/* ══════════════════════════════════════════════════════════════════════
   APRENDIZAJE DE RECURRENTES  ·  motor puro, sin dependencias
   ----------------------------------------------------------------------
   Entrada:  movimientos [{fecha:'AAAA-MM-DD', concepto:'...', importe:n, id?}]
   Salida :  patrones aprendidos + previsión + avisos + clasificador

   El "aprendizaje" tiene dos capas:
     1) DETECCIÓN  — lo que se deduce solo de los datos (firma, periodo,
        importe, regularidad, confianza).
     2) REGLAS     — lo que el usuario corrige (confirmar, descartar,
        renombrar, fusionar, fijar periodo/importe/categoría). Las reglas
        MANDAN sobre la detección y sobreviven a cada nueva importación.
   ══════════════════════════════════════════════════════════════════════ */

/* ── utilidades de fecha (UTC puro: sin sorpresas de huso) ───────────── */
const DIA = 86400000;
const aDia = f => Math.round(Date.UTC(+f.slice(0, 4), +f.slice(5, 7) - 1, +f.slice(8, 10)) / DIA);
const aISO = d => new Date(d * DIA).toISOString().slice(0, 10);
const mesDe = f => f.slice(0, 7);
const finDeSemana = f => { const x = new Date(f + 'T00:00:00Z').getUTCDay(); return x === 0 || x === 6; };
const sumaMeses = (f, n) => {
  const a = +f.slice(0, 4), m = +f.slice(5, 7) - 1, d = +f.slice(8, 10);
  const t = new Date(Date.UTC(a, m + n, 1));
  const ult = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  return aISO(Math.round(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), Math.min(d, ult)) / DIA));
};

/* ── estadística mínima ─────────────────────────────────────────────── */
const mediana = a => { if (!a.length) return 0; const b = [...a].sort((x, y) => x - y); const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
const media = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
const desv = a => { if (a.length < 2) return 0; const m = media(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
const mad = a => { const m = mediana(a); return mediana(a.map(x => Math.abs(x - m))); };
const moda = a => { const c = {}; let mx = null, n = 0; for (const x of a) { c[x] = (c[x] || 0) + 1; if (c[x] > n) { n = c[x]; mx = x; } } return mx; };
const acota = (x, a, b) => Math.max(a, Math.min(b, x));
const fmtEur = n => (Math.round(n * 100) / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

/* ══ 1. FIRMA DEL CONCEPTO ═══════════════════════════════════════════
   Reduce el texto del banco a su núcleo estable: quien cobra o quien
   paga. Fuera fechas, números de factura, tarjetas y referencias, que
   son justo lo que cambia en cada repetición.                          */

const sinTildes = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const TIPOS = [
  [/^RECIBO\b/, 'recibo'],
  [/^(PAGO )?PRESTAMO\b|AMORTIZACION PRESTAMO/, 'prestamo'],
  [/^(PAGO )?LEASING\b|RENTING/, 'leasing'],
  [/^PAGO AVAL|COMISION AVAL|AVAL\b/, 'aval'],
  [/^COMISION|^COMIS\b|LIQUIDACION INTERESES/, 'comision'],
  [/^IMPUESTO|MOD\.?\s?\d{3}|AEAT|HACIENDA|TRIBUTOS/, 'impuesto'],
  [/^REM\.?TRANSFERENCIAS|NOMINA|FINIQUITO/, 'nomina'],
  [/TJ\s?\*+\s?\d{3,4}/, 'tarjeta'],
  [/^TRASPASO|TRANSF\.? INT\.?|TARGET/, 'traspaso'],
  [/^(S\/ORD\.?TRANS|TRANSF PARA|TRANSFERENCIA|TRANS\.|ABONO TRANS)/, 'transferencia'],
  [/^COBRO DE TRIBUTOS/, 'impuesto'],
];

const RUIDO = [
  /TJ\s?\*+\s?\d{3,4}/g,                       // mascarilla de tarjeta
  /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/g,    // fechas
  /\b(PAG(O|AR)?|PAGO DE)?\s?(FRA|FAC|FACT|FACTURA)S?\.?\s?N?[ºO]?\.?\s?[\d\s,.\/-]*/g,
  /\bN[ºO]\.?\s?[\d\/-]+/g,
  /\bREF\.?:?\s?\w+/g,
  /\bJUST\.?\s?\w+/g,                          // justificante AEAT
  /\bES\d{2}[\s\d]{10,}/g,                     // IBAN
  /\b[A-Z]?\d[\d.,]{2,}\b/g,                   // números sueltos largos
  /\*+/g,
];
const VACIAS = new Set(['SL', 'SA', 'SAU', 'SLU', 'SLL', 'SCP', 'SC', 'CB', 'SLNE', 'SOCIEDAD', 'LIMITADA',
  'ANONIMA', 'DE', 'DEL', 'LA', 'EL', 'LOS', 'LAS', 'Y', 'PARA', 'POR', 'SU', 'ORD', 'TRANSF',
  'TRANSFERENCIA', 'RECIBO', 'ABONO', 'EMITIDA', 'RECIBIDA', 'CONCEPTO', 'S', 'D', 'EN', 'AL', 'CON']);

/* Palabras del banco que NO identifican a nadie. Un concepto formado solo
   por ellas no tiene contraparte: no puede ser un recurrente por sí mismo. */
const GENERICAS = new Set(['TRANS', 'TRANSFERENCIAS', 'INMEDIATA', 'TARGET', 'INT', 'INTERNA', 'REM', 'SEPA',
  'BIZUM', 'ONLINE', 'INTERNET', 'OFICINA', 'CANAL', 'VARIOS', 'ORDEN', 'CUENTA', 'INGRESO', 'EFECTIVO',
  'CARGO', 'DIVERSOS', 'CLIENTE', 'PROVEEDOR', 'FRA', 'PAG', 'PAGO', 'PAGAR', 'FACT', 'FACTURA', 'FACTURAS',
  'PROFORMA', 'ANTICIPO', 'NUM']);

function tipoDe(txt) {
  const t = sinTildes(String(txt || '')).toUpperCase();
  for (const [re, nom] of TIPOS) if (re.test(t)) return nom;
  return 'otros';
}

function firma(concepto) {
  let t = sinTildes(String(concepto || '')).toUpperCase();
  t = t.replace(/[?]/g, '');                    // mojibake: W?RTH → WRTH
  // El número de modelo fiscal ES la identidad: el 111 es trimestral, el 202
  // tiene sus tres fechas y el 600 va por operación. Se protege antes de
  // barrer los números, o todos los impuestos caen en el mismo saco.
  t = t.replace(/\bMOD\.?\s?(\d{3})\b/g, 'MODELO$1');
  for (const re of RUIDO) t = t.replace(re, ' ');
  t = t.replace(/[^A-Z0-9ÑÇ]+/g, ' ').trim();
  const tok = t.split(' ').filter(p => p.length > 1 && !VACIAS.has(p) && !/^\d+$/.test(p));
  const utiles = tok.filter(p => !GENERICAS.has(p));
  if (utiles.length) return utiles.slice(0, 6).join(' ');
  // sin contraparte reconocible: se etiqueta por su naturaleza
  return '§' + tipoDe(concepto);
}
const esGenerica = f => f.charAt(0) === '§';
/* Naturalezas en las que la propia etiqueta del banco YA es el compromiso
   (no hace falta contraparte para saber qué es).                        */
const GEN_VALIDA = new Set(['§nomina', '§prestamo', '§leasing', '§aval', '§comision', '§impuesto']);

/* Parecido por bigramas (Dice). Absorbe erratas y variantes del banco:
   «WURTH ESPANA» / «WRTH ESPANA» son el mismo acreedor.               */
function similitud(a, b) {
  if (a === b) return 1;
  const bg = s => { const r = new Set(); for (let i = 0; i < s.length - 1; i++) r.add(s.slice(i, i + 2)); return r; };
  const A = bg(a), B = bg(b);
  if (!A.size || !B.size) return 0;
  let c = 0; for (const x of A) if (B.has(x)) c++;
  return (2 * c) / (A.size + B.size);
}

/* ══ 2. CATEGORÍA (la del cash flow, para que cuadren los dos) ═══════ */
const CATS = [
  [/TGSS|COTIZACION|SEGURIDAD SOCIAL/, 'Seguridad Social'],
  [/REM\.?TRANSFERENCIAS|NOMINA|FINIQUITO/, 'Nóminas'],
  [/MOD\.?\s?\d{3}|AEAT|HACIENDA|IMPUESTO|TRIBUTOS|OAPGT|CATASTRO|IBI/, 'Impuestos'],
  [/PRESTAMO|AMORTIZACION/, 'Préstamos'],
  [/LEASING|RENTING/, 'Leasing / renting'],
  [/AVAL|COMISION|INTERES|LIQUIDACION|MANTENIMIENTO CUENTA/, 'Gastos financieros'],
  [/SEGUROS|VIDACAIXA|AXA|MAPFRE|MUTUA|ALLIANZ|GENERALI|ZURICH|OCASO|REALE|ASISA|ADESLAS/, 'Seguros'],
  [/NATURGY|IBERDROLA|ENDESA|GAS NATURAL|AQUALIA|ELECTRIC|LUZ|AGUA|REPSOL|BALLENOIL|CARBURANTE|GASOLIN/, 'Suministros y carburante'],
  [/ORANGE|VODAFONE|MOVISTAR|TELEFONICA|DIGI|JAZZTEL|MASMOVIL|APPLE\.COM|GOOGLE|MICROSOFT|ADOBE|SOFTWARE|BIZNEO|EQUIFAX/, 'Telecom y software'],
  [/ASESORIA|GESTORIA|ABOGAD|NOTARIA|REGISTRO|PROCURADOR|AUDITOR|COLEGIO|FUNDACION LABORAL|PREVENCION/, 'Servicios profesionales'],
  [/PROSEGUR|TYCO|SECURITAS|ALARMA|VIGILANCIA/, 'Seguridad y alarmas'],
  [/ALQUILER|ARRENDAMIENTO|RENTA/, 'Alquileres'],
  [/AMAZON|LEROY|BIGMAT|FERRETERIA|WURTH|WRTH|MATERIAL|SUMINISTROS|BRICO/, 'Material y ferretería'],
  [/TRASPASO|TARGET|INT\.? TARGET/, 'Traspasos internos'],
];
function categoria(concepto, importe) {
  const t = sinTildes(String(concepto || '')).toUpperCase();
  for (const [re, c] of CATS) if (re.test(t)) return c;
  return importe > 0 ? 'Cobros' : 'Proveedores y otros pagos';
}

/* ══ 3. ANÁLISIS DE LA SERIE ════════════════════════════════════════ */
const PERIODOS = [
  { id: 'semanal', dias: 7, tol: 2 }, { id: 'quincenal', dias: 14, tol: 4 },
  { id: 'mensual', dias: 30.4, tol: 7 }, { id: 'bimestral', dias: 60.8, tol: 10 },
  { id: 'trimestral', dias: 91.3, tol: 14 }, { id: 'cuatrimestral', dias: 121.7, tol: 18 },
  { id: 'semestral', dias: 182.6, tol: 25 }, { id: 'anual', dias: 365.25, tol: 45 },
];

function analizaSerie(ocs) {
  // ocs: [{fecha, importe, concepto}] ordenadas ascendente
  const dias = ocs.map(o => aDia(o.fecha));
  const imps = ocs.map(o => o.importe);
  const meses = [...new Set(ocs.map(o => mesDe(o.fecha)))];
  const span = dias[dias.length - 1] - dias[0];
  const porMes = ocs.length / Math.max(1, meses.length);

  // huecos entre ocurrencias, agrupando el mismo día como una sola
  const unicos = [...new Set(dias)].sort((a, b) => a - b);
  const huecos = unicos.slice(1).map((d, i) => d - unicos[i]);
  const hMed = mediana(huecos);

  let periodo = null, regularidad = 0;
  if (porMes >= 1.7 && unicos.length >= 6) {
    periodo = { id: 'frecuente', dias: 30.4, tol: 15 };           // varios cargos al mes
    regularidad = acota(meses.length / Math.max(1, mesesEntre(ocs[0].fecha, ocs[ocs.length - 1].fecha)), 0, 1);
  } else if (huecos.length >= 1) {
    periodo = PERIODOS.find(p => Math.abs(hMed - p.dias) <= p.tol) || null;
    if (periodo) {
      const disp = huecos.length > 1 ? mad(huecos) : 0;
      regularidad = acota(1 - disp / Math.max(4, periodo.dias * 0.5), 0, 1);
    }
  }

  // día del mes al que tiende (solo tiene sentido en periodos ≥ mensual)
  const diaMes = periodo && periodo.dias >= 28 ? moda(ocs.map(o => +o.fecha.slice(8, 10))) : null;

  // meses ancla: un compromiso trimestral o más lento no cae "cada N días",
  // cae en SUS meses del calendario (el 111 en ene/abr/jul/oct, el IBI en
  // los suyos). Si las ocurrencias respetan un juego de meses, se ancla ahí.
  let mesesAncla = null;
  if (periodo && periodo.dias >= 58 && periodo.id !== 'frecuente' && ocs.length >= 3) {
    const ms = [...new Set(ocs.map(o => +o.fecha.slice(5, 7)))].sort((a, b) => a - b);
    const maxMeses = Math.max(1, Math.round(365.25 / periodo.dias)) + 1;
    if (ms.length <= maxMeses) mesesAncla = ms;
  }

  // importe: fijo, casi fijo, revisado (cambio de nivel) o variable.
  // Se juzga sobre los cargos TÍPICOS: una liquidación complementaria o un
  // pico suelto no definen el compromiso y no deben torcer ni el nivel ni
  // la deriva (la TGSS de 1.163 € junto a las de 13.000 € es el ejemplo).
  const abs = imps.map(Math.abs);
  const medTodo = mediana(abs);
  const tipicos = [];
  for (let i = 0; i < abs.length; i++) if (!medTodo || (abs[i] >= medTodo * 0.45 && abs[i] <= medTodo * 1.8)) tipicos.push(i);
  const absT = tipicos.map(i => abs[i]), diasT = tipicos.map(i => dias[i]);
  const med = mediana(absT);
  const cv = med ? desv(absT) / med : 0;                 // clásico, informativo
  const cvR = med ? 1.4826 * mad(absT) / med : 0;        // robusto: manda este
  let estabilidad = 'variable', nivel = med;
  if (cvR <= 0.02) estabilidad = 'fijo';
  else if (cvR <= 0.12) estabilidad = 'casi fijo';
  // El cambio de nivel se mira SIEMPRE, no solo en las variables: con mayoría
  // de cargos en el nivel viejo, el CV robusto decía «fijo» y la previsión se
  // quedaba en el importe antiguo (la nómina de 26.400 → 30.400 €)
  // Se busca el MEJOR punto de corte, no la mitad: la revisión no cae donde
  // uno quiera. Y para que sea revisión tiene que haber ESCALÓN — un salto
  // brusco en la frontera —, no una rampa suave (eso es deriva, no revisión)
  let corteRev = -1;
  if (absT.length >= 4) {
    let mejor = 0;
    for (let c = 2; c <= absT.length - 2; c++) {
      const a1 = absT.slice(0, c), a2 = absT.slice(c);
      const m1 = mediana(a1), m2 = mediana(a2);
      if (!m1) continue;
      const est1 = desv(a1) / m1, est2 = m2 ? desv(a2) / m2 : 1;
      const dif = Math.abs(m2 - m1);
      const salto = Math.abs(absT[c] - absT[c - 1]);
      if (est1 <= 0.1 && est2 <= 0.1 && dif / m1 > 0.03 && salto >= dif * 0.4 && dif > mejor) {
        mejor = dif; corteRev = c; nivel = m2;
      }
    }
    if (corteRev >= 0) estabilidad = 'revisado';
  }
  if (estabilidad !== 'revisado') nivel = med;

  // deriva del importe: pendiente de Theil-Sen (mediana de pendientes),
  // que un pico suelto no puede torcer. Solo cuenta si es sostenida.
  let tendenciaMes = 0;
  // sobre los típicos; en un revisado, solo sobre el tramo nuevo (mezclar los
  // dos niveles convertiría el salto en pendiente y se contaría dos veces)
  const baseT = estabilidad === 'revisado'
    ? { a: absT.slice(corteRev), d: diasT.slice(corteRev) }
    : { a: absT, d: diasT };
  if (baseT.a.length >= 5 && estabilidad !== 'fijo') {
    const pend = [];
    for (let i = 0; i < baseT.a.length; i++) for (let j = i + 1; j < baseT.a.length; j++) {
      const dd = baseT.d[j] - baseT.d[i];
      if (dd >= 20) pend.push((baseT.a[j] - baseT.a[i]) / dd);
    }
    const pd = mediana(pend) * 30.44;
    const rel = med ? Math.abs(pd) / med : 0;
    // entre un 0,3 % y un 6 % al mes: menos es ruido, más es otra cosa
    if (rel >= 0.003 && rel <= 0.06) tendenciaMes = pd;
  }

  return {
    n: ocs.length, meses: meses.length, span, porMes,
    periodo, regularidad, diaMes, mesesAncla, tendenciaMes: +tendenciaMes.toFixed(2),
    huecoMediano: hMed, estabilidad, cv: +cv.toFixed(3), cvR: +cvR.toFixed(3),
    importe: Math.sign(imps[0] || -1) * nivel,
    importeMedio: media(imps), importeUltimo: imps[imps.length - 1],
    total: imps.reduce((s, x) => s + x, 0),
    primera: ocs[0].fecha, ultima: ocs[ocs.length - 1].fecha,
  };
}

const mesesEntre = (a, b) => (+b.slice(0, 4) - +a.slice(0, 4)) * 12 + (+b.slice(5, 7) - +a.slice(5, 7)) + 1;

/* Confianza 0-100: ocurrencias + cobertura del calendario + regularidad
   en el tiempo + estabilidad del importe.                              */
function confianza(a) {
  if (!a.periodo) return Math.min(25, a.n * 5);
  const esperadas = Math.max(1, Math.round(a.span / a.periodo.dias) + 1);
  const cobertura = acota((a.periodo.id === 'frecuente' ? a.meses / Math.max(1, mesesEntre(a.primera, a.ultima)) : a.n / esperadas), 0, 1);
  const pOcur = acota((a.n - 1) / 5, 0, 1) * 30;
  const pCob = cobertura * 25;
  const pReg = a.regularidad * 25;
  const pImp = ({ fijo: 1, 'casi fijo': .8, revisado: .65, variable: .35 }[a.estabilidad]) * 20;
  return Math.round(pOcur + pCob + pReg + pImp);
}

/* Estado a la fecha de corte: ¿sigue vivo o dejó de cargarse?          */
function estadoDe(a, corteISO) {
  if (!a.periodo) return 'suelto';
  const retraso = (aDia(corteISO) - aDia(a.ultima)) / a.periodo.dias;
  if (retraso <= 1.35) return 'vivo';
  if (retraso <= 2.5) return 'en riesgo';
  return 'terminado';
}

/* Una misma etiqueta del banco puede esconder VARIOS compromisos:
   «PAGO PRESTAMO» son tres préstamos, «RECIBO AXA» varias pólizas y
   «TGSS AUTONOMOS» dos autónomos. Se separan por nivel de importe.     */
function separaPorImporte(ocs, tolRel = 0.045) {
  const orden = [...ocs].sort((a, b) => Math.abs(a.importe) - Math.abs(b.importe));
  const grupos = []; let cur = [];
  for (const o of orden) {
    const v = Math.abs(o.importe);
    if (!cur.length) { cur = [o]; continue; }
    const ref = mediana(cur.map(x => Math.abs(x.importe)));
    if (ref && Math.abs(v - ref) / ref <= tolRel) cur.push(o); else { grupos.push(cur); cur = [o]; }
  }
  if (cur.length) grupos.push(cur);
  return grupos.map(g => g.sort((a, b) => a.fecha < b.fecha ? -1 : 1));
}

/* ¿Los niveles de importe conviven en el tiempo o se suceden? Dos series
   solapadas son dos compromisos distintos; dos series seguidas son el
   mismo compromiso que ha cambiado de precio.                          */
function separadosClaramente(series, minSalto = 0.25, maxDisp = 0.035) {
  const m = series.map(t => { const a = t.map(x => Math.abs(x.importe)); const md = mediana(a); return { md, disp: md ? 1.4826 * mad(a) / md : 1 }; })
    .sort((a, b) => a.md - b.md);
  if (m.some(x => x.disp > maxDisp)) return false;              // dentro, casi clavados
  for (let i = 1; i < m.length; i++) if (!m[i - 1].md || (m[i].md - m[i - 1].md) / m[i - 1].md < minSalto) return false;
  return true;                                                   // entre sí, bien distintos
}

function convivenEnElTiempo(series) {
  const iv = series.map(t => [aDia(t[0].fecha), aDia(t[t.length - 1].fecha)]);
  for (let i = 0; i < iv.length; i++) for (let j = i + 1; j < iv.length; j++) {
    const sol = Math.min(iv[i][1], iv[j][1]) - Math.max(iv[i][0], iv[j][0]);
    const corto = Math.min(iv[i][1] - iv[i][0], iv[j][1] - iv[j][0]);
    if (corto > 0 && sol / corto >= 0.4) return true;
  }
  return false;
}

/* Qué es cada patrón para la tesorería:
     compromiso — importe y fecha previsibles (recibos, cuotas, seguros…)
     habitual   — el proveedor de siempre, importe variable: sirve la media
     ocasional  — ni una cosa ni la otra                                 */
function claseDe(a, tipo) {
  if (!a.periodo) return 'ocasional';
  const estable = a.estabilidad === 'fijo' || a.estabilidad === 'casi fijo' || a.estabilidad === 'revisado';
  const institucional = ['recibo', 'prestamo', 'leasing', 'aval', 'nomina', 'impuesto'].includes(tipo);
  if (estable && a.n >= 3 && a.periodo.id !== 'frecuente') return 'compromiso';
  if (institucional && a.n >= 4 && a.regularidad >= 0.5) return 'compromiso';
  if (a.n >= 6 && a.meses >= 4) return 'habitual';
  if (a.periodo.id === 'frecuente') return 'habitual';
  return 'ocasional';
}
const esInterno = txt => /TRASPASO|TARGET|TRANSF\.? INT|GREEN GENERATION|BIG HOUSE|CUENTA PROPIA/i.test(sinTildes(String(txt || '')).toUpperCase());

/* ══ 4. APRENDIZAJE ═════════════════════════════════════════════════ */
function aprenderRecurrentes(movs, opc = {}) {
  const o = { minOcurrencias: 3, minConfianza: 45, fusionar: 0.84, separar: true, corte: null, reglas: [], ...opc };
  const limpios = (movs || [])
    .filter(m => m && m.fecha && typeof m.importe === 'number' && !isNaN(m.importe))
    .map(m => ({ ...m, concepto: String(m.concepto || '') }))
    .sort((a, b) => a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0);
  if (!limpios.length) return { patrones: [], sueltos: [], resumen: vacio() };
  const corte = o.corte || limpios[limpios.length - 1].fecha;

  // 4.1 agrupar por signo + firma
  const grupos = new Map();
  for (const m of limpios) {
    const f = firma(m.concepto), s = m.importe >= 0 ? '+' : '-';
    const k = s + '|' + f;
    if (!grupos.has(k)) grupos.set(k, { firma: f, signo: s, tipo: tipoDe(m.concepto), ocs: [] });
    grupos.get(k).ocs.push(m);
  }

  // 4.2 fusionar firmas casi iguales del mismo signo (erratas del banco)
  const lista = [...grupos.values()].sort((a, b) => b.ocs.length - a.ocs.length);
  const fundidos = [];
  for (const g of lista) {
    const tks = f => new Set(f.split(' ').filter(x => x.length >= 4));
    const comparten = (a, b) => { const A = tks(a); for (const x of tks(b)) if (A.has(x)) return true; return false; };
    const modelo = f => (f.match(/MODELO\d{3}/) || [null])[0];
    const d = fundidos.find(x => x.signo === g.signo && !esGenerica(x.firma) && !esGenerica(g.firma)
      && modelo(x.firma) === modelo(g.firma)          // el 111 jamás se funde con el 202
      && similitud(x.firma, g.firma) >= o.fusionar && (comparten(x.firma, g.firma) || similitud(x.firma, g.firma) >= 0.93));
    if (d) { d.ocs = d.ocs.concat(g.ocs).sort((a, b) => a.fecha < b.fecha ? -1 : 1); d.alias = (d.alias || []).concat(g.firma); }
    else fundidos.push({ ...g, alias: [] });
  }

  // 4.3 separar compromisos mezclados bajo una misma etiqueta
  const candidatos = [];
  for (const g of fundidos) {
    const base = analizaSerie(g.ocs);
    let partido = null;
    const separable = o.separar && !['tarjeta', 'transferencia', 'traspaso'].includes(g.tipo);
    // Se intenta separar cuando el importe baila, y también cuando hay varios
    // cargos al mes: ahí suele haber dos compromisos bajo la misma etiqueta.
    const sospechoso = base.estabilidad === 'variable' || (base.periodo && base.periodo.id === 'frecuente');
    if (separable && g.ocs.length >= 5 && sospechoso) {
      const trozos = separaPorImporte(g.ocs).filter(t => t.length >= 3);
      const validos = trozos.filter(t => { const a = analizaSerie(t); return a.periodo && confianza(a) >= o.minConfianza; });
      const cubre = validos.reduce((s2, t) => s2 + t.length, 0);
      // Dos niveles de importe SEGUIDOS en el tiempo no son dos compromisos:
      // son el mismo que ha subido de precio. Solo se separa si conviven.
      if (validos.length >= 2 && cubre >= g.ocs.length * 0.55 && convivenEnElTiempo(validos) && separadosClaramente(validos)) {
        const dentro = new Set(validos.flat());
        partido = validos.map((t, i) => ({ ...g, ocs: t, sufijo: ' · ' + fmtEur(mediana(t.map(x => Math.abs(x.importe)))), sub: i + 1 }));
        const resto = g.ocs.filter(x => !dentro.has(x));
        if (resto.length >= 3) partido.push({ ...g, ocs: resto, sufijo: ' · resto', sub: validos.length + 1 });
      }
    }
    candidatos.push(...(partido || [{ ...g, sufijo: '', sub: 0 }]));
  }

  // 4.4 analizar, puntuar y clasificar
  const patrones = [], sueltos = [];
  for (const g of candidatos) {
    const a = analizaSerie(g.ocs);
    const conf = confianza(a);
    const ult = g.ocs[g.ocs.length - 1];
    const p = {
      id: g.signo + '|' + g.firma + (g.sub ? '#' + g.sub : ''),
      firma: g.firma, alias: g.alias || [], signo: g.signo, tipo: g.tipo, sub: g.sub,
      nombre: nombreLegible(ult.concepto, g.firma) + (g.sufijo || ''),
      categoria: categoria(ult.concepto, ult.importe),
      interno: esInterno(ult.concepto) || g.tipo === 'traspaso',
      ...a,
      confianza: conf,
      estado: estadoDe(a, corte),
      origen: 'detectado',
      ocurrencias: g.ocs.map(m => ({ fecha: m.fecha, importe: m.importe, concepto: m.concepto, id: m.id })),
    };
    p.clase = claseDe(a, g.tipo);
    p.mensualiza = mensualiza(p);
    const generica = esGenerica(g.firma) && !GEN_VALIDA.has(g.firma);
    const bueno = a.periodo && a.n >= o.minOcurrencias && conf >= o.minConfianza && p.clase !== 'ocasional' && !generica;
    (bueno ? patrones : sueltos).push(p);
  }

  const conReglas = aplicarReglas(patrones, sueltos, o.reglas, corte);
  conReglas.patrones.sort((a, b) => Math.abs(b.mensualiza) - Math.abs(a.mensualiza));
  return { ...conReglas, corte, resumen: resumir(conReglas.patrones, limpios, corte) };
}

/* Importe que aporta al mes (para la previsión de tesorería)           */
function mensualiza(p) {
  if (!p.periodo) return 0;
  if (p.periodo.id === 'frecuente') return p.total / Math.max(1, mesesEntre(p.primera, p.ultima));
  return p.importe * (30.44 / p.periodo.dias);
}

function nombreLegible(concepto, f) {
  let t = String(concepto || '').replace(/\s+/g, ' ').trim();
  t = t.replace(/TJ\s?\*+\s?\d{3,4}.*/i, '').replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, '')
    .replace(/\bJUST\.?\s?\w+/gi, '').replace(/\bREF\.?:?\s?\w+/gi, '')
    .replace(/\s(PAG|PAGO|PAGAR|PAGO DE)?\s?(FRA|FAC|FACT|FACTURA)S?\.?\s?N?[ºO]?\.?[\d\s,.\/-]*$/i, '')
    .replace(/^(RECIBO|TRANSFERENCIA|TRANSF PARA|S\/ORD\.?TRANS|ABONO)\s+/i, '').trim();
  return (t.length > 3 ? t : f).slice(0, 60);
}

/* ══ 5. REGLAS DEL USUARIO — mandan sobre la detección ══════════════ */
function aplicarReglas(patrones, sueltos, reglas, corte) {
  const P = patrones.map(p => ({ ...p })), S = sueltos.map(p => ({ ...p }));
  for (const r of (reglas || [])) {
    const enP = i => P.findIndex(p => p.id === i || p.firma === i);
    const enS = i => S.findIndex(p => p.id === i || p.firma === i);
    if (r.accion === 'descartar') { const i = enP(r.firma); if (i >= 0) { P[i].origen = 'descartado'; S.push(P.splice(i, 1)[0]); } }
    else if (r.accion === 'confirmar') {
      let i = enP(r.firma);
      if (i < 0) { const j = enS(r.firma); if (j >= 0) { const p = S.splice(j, 1)[0]; p.confianza = Math.max(p.confianza, 90); if (!p.periodo && r.periodo) p.periodo = PERIODOS.find(x => x.id === r.periodo) || null; p.mensualiza = mensualiza(p); P.push(p); i = P.length - 1; } }
      if (i >= 0) { P[i].origen = 'confirmado'; P[i].confianza = 100; }
    }
    else if (r.accion === 'renombrar') { const i = enP(r.firma); if (i >= 0) { P[i].nombre = r.nombre; P[i].origen = 'ajustado'; } }
    else if (r.accion === 'categoria') { const i = enP(r.firma); if (i >= 0) { P[i].categoria = r.categoria; P[i].origen = 'ajustado'; } }
    else if (r.accion === 'fijar') {
      const i = enP(r.firma); if (i < 0) continue;
      if (r.periodo) P[i].periodo = PERIODOS.find(x => x.id === r.periodo) || P[i].periodo;
      if (typeof r.importe === 'number') { P[i].importe = r.importe; P[i].estabilidad = 'fijo'; P[i].tendenciaMes = 0; }
      if (r.diaMes) P[i].diaMes = r.diaMes;
      P[i].origen = 'ajustado'; P[i].confianza = 100; P[i].mensualiza = mensualiza(P[i]);
      P[i].estado = estadoDe(P[i], corte);
    }
    else if (r.accion === 'fusionar') {
      const i = enP(r.firma), j = enP(r.con);
      if (i >= 0 && j >= 0 && i !== j) {
        const b = P.splice(j, 1)[0], k = enP(r.firma);
        P[k].ocurrencias = P[k].ocurrencias.concat(b.ocurrencias).sort((x, y) => x.fecha < y.fecha ? -1 : 1);
        P[k].alias = (P[k].alias || []).concat(b.firma, b.alias || []);
        Object.assign(P[k], analizaSerie(P[k].ocurrencias));
        P[k].confianza = confianza(P[k]); P[k].estado = estadoDe(P[k], corte);
        P[k].mensualiza = mensualiza(P[k]); P[k].origen = 'ajustado';
      }
    }
  }
  return { patrones: P, sueltos: S };
}

/* ══ 6. PREVISIÓN ═══════════════════════════════════════════════════ */
function proximas(p, desdeISO, hastaISO) {
  if (!p.periodo || p.estado === 'terminado') return [];
  const out = [], hasta = aDia(hastaISO), desde = aDia(desdeISO);
  if (p.periodo.id === 'frecuente' || p.clase === 'habitual') {   // media mensual
    let f = desdeISO.slice(0, 8) + '15';
    while (aDia(f) <= hasta) {
      if (aDia(f) >= desde) out.push({ fecha: f, importe: p.mensualiza, estimado: true });
      f = sumaMeses(f, 1);
    }
    return out;
  }
  const pasoMeses = p.periodo.dias >= 28 ? Math.round(p.periodo.dias / 30.44) : 0;
  let f = p.ultima, guarda = 0;
  while (guarda++ < 400) {
    if (p.mesesAncla && p.mesesAncla.length) {
      // avanzar al siguiente mes del calendario propio del compromiso
      let a = +f.slice(0, 4), m = +f.slice(5, 7);
      do { m++; if (m > 12) { m = 1; a++; } } while (!p.mesesAncla.includes(m));
      f = a + '-' + String(m).padStart(2, '0') + '-01';
    } else {
      f = pasoMeses ? sumaMeses(f, pasoMeses) : aISO(aDia(f) + Math.round(p.periodo.dias));
    }
    if ((pasoMeses || p.mesesAncla) && p.diaMes) {     // respeta el día habitual de cargo
      const ult = new Date(Date.UTC(+f.slice(0, 4), +f.slice(5, 7), 0)).getUTCDate();
      f = f.slice(0, 8) + String(Math.min(p.diaMes, ult)).padStart(2, '0');
    }
    let g = f, s = 0;
    while (finDeSemana(g) && s++ < 3) g = aISO(aDia(g) + 1);   // el banco carga en hábil
    if (mesDe(g) !== mesDe(f)) {                               // salvo a fin de mes:
      g = f; s = 0;                                            // ahí retrocede, no salta
      while (finDeSemana(g) && s++ < 3) g = aISO(aDia(g) - 1);
    }
    if (aDia(g) > hasta) break;
    if (aDia(g) >= desde) {
      // la deriva medida se prolonga, con tope del 25 % sobre el nivel actual
      let imp = p.importe;
      if (p.tendenciaMes) {
        const mesesFuera = (aDia(g) - aDia(p.ultima)) / 30.44;
        const delta = p.tendenciaMes * mesesFuera;
        const tope = Math.abs(p.importe) * 0.25;
        imp = Math.sign(p.importe) * Math.max(0, Math.abs(p.importe) + acota(delta, -tope, tope));
      }
      out.push({ fecha: g, importe: +imp.toFixed(2), estimado: true });
    }
  }
  return out;
}

function proyectar(patrones, desdeISO, meses = 12) {
  const hasta = sumaMeses(desdeISO, meses);
  const cal = [];
  for (let i = 0; i < meses; i++) cal.push({ mes: sumaMeses(desdeISO, i).slice(0, 7), cobros: 0, pagos: 0, neto: 0, lineas: [] });
  const idx = Object.fromEntries(cal.map((c, i) => [c.mes, i]));
  for (const p of patrones) {
    // el estado se vuelve a mirar contra la fecha desde la que se proyecta:
    // con un extracto viejo, lo que ya murió no puede resucitar
    if (estadoDe(p, desdeISO) === 'terminado') continue;
    for (const e of proximas(p, desdeISO, hasta)) {
      const i = idx[mesDe(e.fecha)]; if (i === undefined) continue;
      if (e.importe >= 0) cal[i].cobros += e.importe; else cal[i].pagos += e.importe;
      cal[i].neto += e.importe;
      cal[i].lineas.push({ nombre: p.nombre, categoria: p.categoria, fecha: e.fecha, importe: e.importe });
    }
  }
  cal.forEach(c => c.lineas.sort((a, b) => a.fecha < b.fecha ? -1 : 1));
  return cal;
}

/* ══ 7. CLASIFICADOR — encaja un movimiento nuevo en lo aprendido ═══ */
function clasificar(mov, patrones, tol = 0.12) {
  const f = firma(mov.concepto), s = mov.importe >= 0 ? '+' : '-';
  let mejor = null, mejorS = 0;
  for (const p of patrones) {
    if (p.signo !== s) continue;
    const sim = Math.max(similitud(p.firma, f), ...(p.alias || []).map(a => similitud(a, f)));
    if (sim > mejorS) { mejorS = sim; mejor = p; }
  }
  if (!mejor || mejorS < 0.8) return { patron: null, parecido: mejorS, aviso: 'nuevo' };
  const esp = Math.abs(mejor.importe), real = Math.abs(mov.importe);
  const desvio = esp ? (real - esp) / esp : 0;
  return {
    patron: mejor, parecido: +mejorS.toFixed(2), desvio: +desvio.toFixed(3),
    categoria: mejor.categoria,
    aviso: Math.abs(desvio) > tol ? (desvio > 0 ? 'importe al alza' : 'importe a la baja') : null,
  };
}

/* ══ 8. BACKTEST — el motor se examina contra los últimos meses ═════
   Aprende SOLO con los movimientos anteriores al corte de prueba y
   predice el tramo final, que sí ocurrió. Devuelve, por patrón y en
   conjunto, cuántos cargos acertó y con qué error de fecha e importe. */
function backtest(movs, opc = {}) {
  const o = { mesesPrueba: 3, reglas: [], ...opc };
  const limpios = (movs || []).filter(m => m && m.fecha && typeof m.importe === 'number' && !isNaN(m.importe))
    .sort((a, b) => a.fecha < b.fecha ? -1 : 1);
  if (limpios.length < 30) return null;
  const fin = limpios[limpios.length - 1].fecha;
  const corte = sumaMeses(fin, -o.mesesPrueba);
  const entren = limpios.filter(m => m.fecha <= corte);
  const prueba = limpios.filter(m => m.fecha > corte);
  if (entren.length < 20 || !prueba.length) return null;

  const r = aprenderRecurrentes(entren, { reglas: o.reglas, corte });
  const porFirma = {};
  let prevTot = 0, acertTot = 0, eurPrev = 0, eurReal = 0;   // solo emparejados
  const nMesesPr = o.mesesPrueba;
  const errsImp = [];

  for (const p of r.patrones) {
    // lo real de este patrón en el tramo de prueba
    const reales = prueba.filter(m => {
      if ((m.importe >= 0 ? '+' : '-') !== p.signo) return false;
      const f = firma(m.concepto);
      return f === p.firma || (p.alias || []).includes(f) ||
        (!esGenerica(f) && !esGenerica(p.firma) && similitud(f, p.firma) >= 0.88);
    });
    if (p.clase === 'habitual' || (p.periodo && p.periodo.id === 'frecuente')) {
      // los habituales se juzgan por su media mensual, que es como se proyectan
      const realMes = reales.reduce((a, m) => a + m.importe, 0) / nMesesPr;
      const errImp = p.mensualiza ? Math.abs((realMes - p.mensualiza) / p.mensualiza) : null;
      porFirma[p.firma] = { modo: 'media', nReal: reales.length, realMes, previstoMes: p.mensualiza,
        errImp: errImp === null ? null : +errImp.toFixed(3) };
      if (errImp !== null) errsImp.push(errImp);
      continue;
    }
    const previstos = proximas(p, aISO(aDia(corte) + 1), fin);
    if (!previstos.length) { porFirma[p.firma] = { modo: 'fecha', nPrevisto: 0, nReal: reales.length, aciertos: 0 }; continue; }
    // emparejar cada previsto con el real más cercano en fecha, sin repetir
    const libres = reales.map(m => ({ ...m, usado: false }));
    const tolDias = Math.min(20, (p.periodo ? p.periodo.tol : 7) + 4);
    const dF = [], dI = []; let aciertos = 0;
    for (const pv of previstos) {
      // se elige por cercanía de fecha E importe a la vez: cuando dos
      // compromisos comparten firma (los dos autónomos), la fecha sola
      // empareja el de 785 € con el de 376 € y falsea el error
      let mejor = null, mejorD = Infinity, mejorPunt = Infinity;
      for (const rl of libres) {
        if (rl.usado) continue;
        const d = Math.abs(aDia(rl.fecha) - aDia(pv.fecha));
        const ri = pv.importe ? Math.abs((rl.importe - pv.importe) / pv.importe) : 0;
        const punt = d + 25 * Math.min(ri, 2);
        if (punt < mejorPunt) { mejorPunt = punt; mejorD = d; mejor = rl; }
      }
      if (mejor && mejorD <= tolDias) {
        mejor.usado = true; aciertos++;
        dF.push(mejorD);
        if (pv.importe) dI.push(Math.abs((mejor.importe - pv.importe) / pv.importe));
        eurPrev += Math.abs(pv.importe); eurReal += Math.abs(mejor.importe);
      }
    }
    prevTot += previstos.length; acertTot += aciertos;
    porFirma[p.firma] = { modo: 'fecha', nPrevisto: previstos.length, nReal: reales.length, aciertos,
      errFechaDias: dF.length ? Math.round(mediana(dF)) : null,
      errImp: dI.length ? +mediana(dI).toFixed(3) : null };
    if (dI.length) errsImp.push(mediana(dI));
  }
  return {
    corte, hasta: fin, mesesPrueba: o.mesesPrueba,
    cargosPrevistos: prevTot, cargosAcertados: acertTot,
    tasaAcierto: prevTot ? +(acertTot / prevTot).toFixed(3) : null,
    // de los cargos emparejados: cuánto dinero se previó y cuánto fue de verdad
    eurEmparejadoPrevisto: Math.round(eurPrev), eurEmparejadoReal: Math.round(eurReal),
    desvioEur: eurPrev ? +((eurReal - eurPrev) / eurPrev).toFixed(3) : null,
    errImpMediano: errsImp.length ? +mediana(errsImp).toFixed(3) : null,
    porFirma,
  };
}

/* ══ 9. AVISOS ═════════════════════════════════════════════════════ */
function avisos(patrones, corteISO) {
  const av = [];
  for (const p of patrones) {
    if (!p.periodo || p.periodo.id === 'frecuente') continue;
    const retraso = Math.round(aDia(corteISO) - aDia(p.ultima));
    const est = estadoDe(p, corteISO);
    if (est === 'en riesgo') av.push({ nivel: 'aviso', firma: p.firma, nombre: p.nombre, texto: `No se ha cargado desde hace ${retraso} días (esperado cada ${Math.round(p.periodo.dias)}). Comprueba si sigue vigente.` });
    if (est === 'terminado' && p.n >= 3) av.push({ nivel: 'info', firma: p.firma, nombre: p.nombre, texto: `Dejó de cargarse el ${p.ultima} tras ${p.n} cargos.` });
    if (p.estabilidad === 'revisado') {
      const prim = Math.abs(mediana(p.ocurrencias.slice(0, p.n >> 1).map(x => x.importe)));
      const sub = prim ? (Math.abs(p.importe) - prim) / prim : 0;
      av.push({ nivel: Math.abs(sub) > 0.15 ? 'aviso' : 'info', firma: p.firma, nombre: p.nombre, texto: `Ha cambiado de importe: ${prim.toFixed(2)} € → ${Math.abs(p.importe).toFixed(2)} € (${(sub * 100).toFixed(1)} %).` });
    }
    // cargos idénticos el mismo día: solo chirría si el patrón es de un cargo
    if (p.porMes <= 1.2) {
      const cuenta = {};
      for (const oc of p.ocurrencias) { const k = oc.fecha + '|' + oc.importe.toFixed(2); cuenta[k] = (cuenta[k] || 0) + 1; }
      for (const [k, n] of Object.entries(cuenta)) {
        if (n < 2) continue;
        const [f, i] = k.split('|');
        av.push({ nivel: 'aviso', firma: p.firma, nombre: p.nombre, texto: `${n} cargos idénticos el ${f} (${Math.abs(+i).toFixed(2)} € cada uno). Comprueba si hay un duplicado.` });
      }
    }
  }
  return av;
}

/* ══ 10. RESUMEN ═══════════════════════════════════════════════════ */
const vacio = () => ({ n: 0, cubierto: 0, mensualPagos: 0, mensualCobros: 0, porCategoria: [] });
function resumir(patrones, movs, corte) {
  const vivos = patrones.filter(p => p.estado !== 'terminado');
  const enPatron = new Set();
  patrones.forEach(p => p.ocurrencias.forEach(o => enPatron.add(o.fecha + '|' + o.importe + '|' + o.concepto)));
  const cubierto = movs.filter(m => enPatron.has(m.fecha + '|' + m.importe + '|' + m.concepto)).length;
  const cats = {};
  for (const p of vivos) { if (!p.interno) cats[p.categoria] = (cats[p.categoria] || 0) + p.mensualiza; }
  const ext = vivos.filter(p => !p.interno);
  // fondo NO recurrente: lo que el extracto mueve cada mes fuera de los
  // patrones (obra, cobros puntuales). Mediana de los meses completos, para
  // que un mes partido por el corte del extracto no lo hunda
  const fueraMes = {};
  for (const m of movs) {
    if (enPatron.has(m.fecha + '|' + m.importe + '|' + m.concepto)) continue;
    const k = mesDe(m.fecha);
    fueraMes[k] = fueraMes[k] || { c: 0, p: 0 };
    if (m.importe >= 0) fueraMes[k].c += m.importe; else fueraMes[k].p += m.importe;
  }
  const mesesCompletos = Object.keys(fueraMes).sort().slice(1, -1);
  const fondo = {
    cobrosMes: mediana(mesesCompletos.map(k => fueraMes[k].c)),
    pagosMes: mediana(mesesCompletos.map(k => fueraMes[k].p)),
    meses: mesesCompletos.length,
  };

  return {
    n: patrones.length, vivos: vivos.length, fondo,
    movimientos: movs.length, cubierto, pctCubierto: +(100 * cubierto / movs.length).toFixed(1),
    desde: movs[0].fecha, hasta: corte,
    compromisos: vivos.filter(p => p.clase === 'compromiso').length,
    habituales: vivos.filter(p => p.clase === 'habitual').length,
    mensualPagos: ext.filter(p => p.mensualiza < 0).reduce((s, p) => s + p.mensualiza, 0),
    mensualCobros: ext.filter(p => p.mensualiza > 0).reduce((s, p) => s + p.mensualiza, 0),
    mensualCompromisos: ext.filter(p => p.clase === 'compromiso' && p.mensualiza < 0).reduce((s, p) => s + p.mensualiza, 0),
    mensualInterno: vivos.filter(p => p.interno).reduce((s, p) => s + p.mensualiza, 0),
    porCategoria: Object.entries(cats).map(([k, v]) => ({ categoria: k, mensual: v })).sort((a, b) => a.mensual - b.mensual),
  };
}

/* ══ 10. CONCILIACIÓN — casar un extracto nuevo con lo aprendido ═══ */
function conciliar(nuevos, patrones, opc = {}) {
  const limpios = (nuevos || []).filter(m => m && m.fecha && typeof m.importe === 'number' && !isNaN(m.importe))
    .sort((a, b) => a.fecha < b.fecha ? -1 : 1);
  if (!limpios.length) return { reconocidos: [], desconocidos: [], esperadosSinCargo: [], resumen: { n: 0 } };
  const desde = opc.desde || limpios[0].fecha, hasta = opc.hasta || limpios[limpios.length - 1].fecha;

  const reconocidos = [], desconocidos = [];
  const vistosPorPatron = {};
  for (const m of limpios) {
    const c = clasificar(m, patrones, opc.tolerancia || 0.12);
    if (c.patron) {
      reconocidos.push({ mov: m, patron: c.patron.nombre, id: c.patron.id, categoria: c.categoria, desvio: c.desvio, aviso: c.aviso });
      (vistosPorPatron[c.patron.id] = vistosPorPatron[c.patron.id] || []).push(m);
    } else desconocidos.push({ mov: m, categoria: categoria(m.concepto, m.importe) });
  }

  // compromisos que TOCABAN en el tramo y no aparecen — lo más valioso
  const esperadosSinCargo = [];
  for (const p of patrones) {
    if (p.clase !== 'compromiso' || p.interno) continue;
    for (const e of proximas(p, desde, hasta)) {
      const hay = (vistosPorPatron[p.id] || []).some(m => Math.abs(aDia(m.fecha) - aDia(e.fecha)) <= Math.max(6, (p.periodo ? p.periodo.dias : 30) * 0.35));
      if (!hay) esperadosSinCargo.push({ nombre: p.nombre, id: p.id, fecha: e.fecha, importe: e.importe, categoria: p.categoria });
    }
  }
  const sum = a => a.reduce((x, y) => x + y, 0);
  return {
    reconocidos, desconocidos, esperadosSinCargo,
    resumen: {
      n: limpios.length, desde, hasta,
      nReconocidos: reconocidos.length, nDesconocidos: desconocidos.length, nSinCargo: esperadosSinCargo.length,
      importeReconocido: +sum(reconocidos.map(r => r.mov.importe)).toFixed(2),
      importeDesconocido: +sum(desconocidos.map(r => r.mov.importe)).toFixed(2),
      importeSinCargo: +sum(esperadosSinCargo.map(r => r.importe)).toFixed(2),
      conDesvio: reconocidos.filter(r => r.aviso).length,
    },
  };
}

/* ══ 11. CONTRASTE — la fiabilidad se mide, no se promete ══════════
   Se aprende con los primeros meses del extracto y se predice el tramo
   final, que ya se conoce: la diferencia ES el error del modelo.        */
function contrastar(movs, mesesPrueba = 3, opc = {}) {
  const limpios = (movs || []).filter(m => m && m.fecha && typeof m.importe === 'number' && !isNaN(m.importe))
    .sort((a, b) => a.fecha < b.fecha ? -1 : 1);
  if (limpios.length < 50) return null;
  const fin = limpios[limpios.length - 1].fecha;
  const cortePlan = sumaMeses(fin.slice(0, 8) + '01', -(mesesPrueba - 1));
  const entreno = limpios.filter(m => m.fecha < cortePlan);
  const prueba = limpios.filter(m => m.fecha >= cortePlan && mesDe(m.fecha) < mesDe(fin) || (mesDe(m.fecha) === mesDe(fin) && fin.slice(8) >= '28'));
  if (entreno.length < 40 || !prueba.length) return null;

  const apr = aprenderRecurrentes(entreno, opc);
  const meses = [...new Set(prueba.map(m => mesDe(m.fecha)))].sort();
  const porMes = [];
  for (const mes of meses) {
    const del = prueba.filter(m => mesDe(m.fecha) === mes);
    const con = conciliar(del, apr.patrones, { desde: mes + '-01', hasta: mes + '-28' });
    // previsto para el mes: compromisos con fecha + habituales por media
    const cal = proyectar(apr.patrones.filter(p => !p.interno), mes + '-01', 1)[0];
    const realCubierto = con.reconocidos.reduce((s2, r) => s2 + r.mov.importe, 0);
    porMes.push({
      mes,
      previstoPagos: +cal.pagos.toFixed(2), previstoCobros: +cal.cobros.toFixed(2),
      realPagos: +con.reconocidos.filter(r => r.mov.importe < 0).reduce((s2, r) => s2 + r.mov.importe, 0).toFixed(2),
      realCobros: +con.reconocidos.filter(r => r.mov.importe >= 0).reduce((s2, r) => s2 + r.mov.importe, 0).toFixed(2),
      sinCargo: con.esperadosSinCargo.length,
      realCubierto: +realCubierto.toFixed(2),
    });
  }
  const sum = k => porMes.reduce((s2, m) => s2 + m[k], 0);
  const pv = sum('previstoPagos'), re = sum('realPagos');
  return {
    mesesPrueba: meses, porMes,
    pagosPrevistos: +pv.toFixed(2), pagosReales: +re.toFixed(2),
    desvioPagos: re ? +((pv - re) / re * 100).toFixed(1) : null,
    cobrosPrevistos: +sum('previstoCobros').toFixed(2), cobrosReales: +sum('realCobros').toFixed(2),
  };
}

/* ── exportación ───────────────────────────────────────────────────── */
const API = {
  aprenderRecurrentes, aplicarReglas, proximas, proyectar, clasificar, avisos, conciliar, contrastar, backtest,
  firma, similitud, tipoDe, categoria, analizaSerie, confianza, estadoDe, mensualiza,
  separaPorImporte, claseDe, esGenerica, nombreLegible, convivenEnElTiempo, separadosClaramente,
  PERIODOS, _u: { aDia, aISO, sumaMeses, mediana, media, desv, mad, moda, mesesEntre },
};
/* module.exports neutralizado dentro de la app */
if (typeof window !== 'undefined') window.Recurrentes = API;

return API;
})();

const esCopiaV9=(d)=>!!(d&&d.version===9&&d.claves&&typeof d.claves==='object'&&!Array.isArray(d.claves));

const resumenCopiaV9=(claves)=>{const ks=Object.keys(claves||{});
  return {n:ks.length,kb:Math.round(ks.reduce((s,k)=>s+String(claves[k]||'').length,0)/1024)};};

const imitaNumero=(ultimo)=>{
  const s=String(ultimo||'');
  const m=s.match(/^([\s\S]*?)(\d+)(\D*)$/);
  if(!m)return null;
  const n=String(+m[2]+1);
  return m[1]+(n.length<m[2].length?'0'.repeat(m[2].length-n.length)+n:n)+m[3];
};
export {seqSerie,siguienteSerie,normNumDoc,REC,esCopiaV9,resumenCopiaV9,imitaNumero};
