// ═══ VALIDADOR ESTRICTO DE FICHEROS SEPA C34 (pain.001) ═══════════════════
// Comparar contra producción demuestra que no hay REGRESIÓN. No demuestra que
// el fichero sea CORRECTO: si el desplegado tuviera un fallo latente, saldría
// «idénticamente mal». Esto lo mide en absoluto, contra la norma.
//
// Cada regla es un motivo real de rechazo del banco o de un cargo equivocado.
export const validarSEPA=(xml)=>{
  const P=[];
  const bloques=String(xml).split('<CdtTrfTxInf>').slice(1).map(b=>b.split('</CdtTrfTxInf>')[0]);
  const uno=(re,s=xml)=>{const m=String(s).match(re);return m?m[1]:null;};
  const todos=(re,s=xml)=>[...String(s).matchAll(re)].map(m=>m[1]);

  // ── estructura ──
  if(!/^<\?xml version="1\.0" encoding="UTF-8"\?>/.test(String(xml).trim()))P.push('falta la cabecera XML UTF-8');
  if(!/xmlns="urn:iso:std:iso:20022:tech:xsd:pain\.001\.\d{3}\.\d{2}"/.test(xml))P.push('el esquema no es pain.001');
  const abre=(String(xml).match(/<[A-Za-z]/g)||[]).length, cierra=(String(xml).match(/<\/[A-Za-z]/g)||[]).length;
  if(!bloques.length)P.push('no hay ninguna transferencia');

  // ── importes: el céntimo manda ──
  const imps=todos(/<InstdAmt Ccy="EUR">([\d.]+)<\/InstdAmt>/g).map(Number);
  imps.forEach((v,i)=>{
    if(!(v>0))P.push(`transferencia ${i+1}: importe ${v} no es mayor que cero`);
    const cru=todos(/<InstdAmt Ccy="EUR">([\d.]+)<\/InstdAmt>/g)[i];
    if(!/^\d+\.\d{2}$/.test(cru))P.push(`transferencia ${i+1}: importe «${cru}» no tiene exactamente 2 decimales`);
  });
  const suma=+imps.reduce((a,b)=>a+b,0).toFixed(2);
  for(const ctrl of todos(/<CtrlSum>([\d.]+)<\/CtrlSum>/g)){
    if(Math.abs(+ctrl-suma)>0.005)P.push(`CtrlSum ${ctrl} no cuadra con la suma real ${suma.toFixed(2)}`);
  }
  for(const nb of todos(/<NbOfTxs>(\d+)<\/NbOfTxs>/g)){
    if(+nb!==bloques.length)P.push(`NbOfTxs ${nb} no coincide con las ${bloques.length} transferencias reales`);
  }
  if(todos(/<CtrlSum>([\d.]+)<\/CtrlSum>/g).length<2)P.push('falta CtrlSum en cabecera o en PmtInf');
  if(todos(/<NbOfTxs>(\d+)<\/NbOfTxs>/g).length<2)P.push('falta NbOfTxs en cabecera o en PmtInf');

  // ── IBAN: dígito de control mod-97 ──
  const mod97=(ib)=>{const s=ib.slice(4)+ib.slice(0,4);
    let r=0;for(const c of s){const v=/[A-Z]/.test(c)?String(c.charCodeAt(0)-55):c;for(const d of v)r=(r*10+(+d))%97;}return r;};
  todos(/<IBAN>([A-Z0-9]+)<\/IBAN>/g).forEach((ib,i)=>{
    if(!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(ib))P.push(`IBAN ${i+1} «${ib}» con formato inválido`);
    else if(mod97(ib)!==1)P.push(`IBAN ${i+1} «${ib.slice(0,8)}…» NO supera el dígito de control`);
  });
  if(!/<DbtrAcct>[\s\S]*?<IBAN>/.test(xml))P.push('falta el IBAN del ordenante');

  // ── fecha de ejecución ──
  const f=uno(/<ReqdExctnDt>\s*<Dt>([^<]+)<\/Dt>/);
  if(!f)P.push('falta la fecha de ejecución');
  else if(!/^\d{4}-\d{2}-\d{2}$/.test(f))P.push(`fecha de ejecución «${f}» no es AAAA-MM-DD`);

  // ── longitudes que el banco corta ──
  const msg=uno(/<MsgId>([^<]*)<\/MsgId>/)||'';
  if(!msg)P.push('falta MsgId');
  if(msg.length>35)P.push(`MsgId de ${msg.length} caracteres (máximo 35)`);
  todos(/<EndToEndId>([^<]*)<\/EndToEndId>/g).forEach((e,i)=>{
    if(!e)P.push(`transferencia ${i+1}: EndToEndId vacío`);
    if(e.length>35)P.push(`transferencia ${i+1}: EndToEndId de ${e.length} caracteres (máximo 35)`);});
  todos(/<Nm>([^<]*)<\/Nm>/g).forEach((n,i)=>{
    if(n.length>70)P.push(`nombre ${i+1} de ${n.length} caracteres (máximo 70)`);
    if(!n.trim())P.push(`nombre ${i+1} vacío`);});
  todos(/<Ustrd>([^<]*)<\/Ustrd>/g).forEach((u,i)=>{
    if(u.length>140)P.push(`concepto ${i+1} de ${u.length} caracteres (máximo 140)`);});

  // ── juego de caracteres SEPA: lo que no esté aquí, el banco lo rechaza ──
  const OK=/^[A-Za-z0-9\/\-?:().,'+ ]*$/;
  for(const [et,vals] of [['nombre',todos(/<Nm>([^<]*)<\/Nm>/g)],['concepto',todos(/<Ustrd>([^<]*)<\/Ustrd>/g)]]){
    vals.forEach((v,i)=>{
      const limpio=v.replace(/&amp;/g,'+').replace(/&[a-z]+;/g,' ');
      if(!OK.test(limpio)){
        const malos=[...new Set(limpio.split('').filter(c=>!OK.test(c)))].join('');
        P.push(`${et} ${i+1} lleva caracteres fuera del juego SEPA: «${malos}» en «${v.slice(0,40)}»`);
      }});
  }
  // ── sin XML sin escapar ──
  if(/<Nm>[^<]*[<>][^<]*<\/Nm>/.test(xml))P.push('hay un nombre con < o > sin escapar');
  return {ok:P.length===0,problemas:P,nTx:bloques.length,total:suma,tags:{abre,cierra}};
};
