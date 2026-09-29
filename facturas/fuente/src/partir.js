// ═══ PARTIR REMESAS C34 ══════════════════════════════════════════════════
// El banco limita lo que acepta POR REMESA Y POR DÍA (Eurocaja: 60.000 €).
// Cuando una remesa ya descargada se pasa del límite, no hace falta deshacer
// pagos ni volver a seleccionar facturas: el histórico guarda TODAS las
// líneas (proveedor, importe, concepto, IBAN), y de ahí se reconstruyen
// varios ficheros válidos, cada uno bajo el límite y en un día hábil
// distinto — porque el límite es también diario: dos ficheros el mismo día
// chocarían igual.
//
// Los pagos de las facturas NO se tocan: ya estaban bien apuntados; lo que
// faltaba eran ficheros que el banco tragase.

const escXml=(s)=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
  .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const normIban=(s)=>String(s||'').replace(/[^A-Za-z0-9]/g,'').toUpperCase();
const r2=(n)=>Math.round(n*100)/100;

// ── reparto: primero-que-quepa con los importes de mayor a menor ──────────
// (first-fit decreasing: pocas cajas y determinista). Una línea que POR SÍ
// SOLA pasa del límite no se puede partir: va sola en su fichero, marcada
// con excede=true para que la pantalla avise — esa hay que acordarla con el
// banco o pagarla aparte.
export const repartirLineas=(txns,limite)=>{
  const lim=+limite>0?+limite:Infinity;
  const conIdx=(txns||[]).map((t,i)=>({...t,__i:i}));
  const orden=[...conIdx].sort((a,b)=>((+b.imp||0)-(+a.imp||0))||(a.__i-b.__i));
  const partes=[];
  for(const t of orden){
    const imp=+t.imp||0;
    if(imp>lim){partes.push({txns:[t],total:r2(imp),excede:true});continue;}
    let dest=null;
    for(const p of partes){if(!p.excede&&r2(p.total+imp)<=lim+0.001){dest=p;break;}}
    if(!dest){dest={txns:[],total:0,excede:false};partes.push(dest);}
    dest.txns.push(t);dest.total=r2(dest.total+imp);
  }
  // dentro de cada parte se recupera el orden original de la remesa
  partes.forEach(p=>{p.txns=[...p.txns].sort((a,b)=>a.__i-b.__i).map(({__i,...t})=>t);});
  return partes;
};

// ── días hábiles consecutivos desde una fecha (sáb/dom se saltan) ─────────
// El límite es por día: cada parte va a un día hábil distinto. Si la fecha
// de arranque cae en fin de semana, se corre al lunes.
export const fechasEscalonadas=(inicial,n)=>{
  const out=[];
  const d=new Date(String(inicial||'').slice(0,10)+'T12:00:00');
  if(isNaN(d.getTime()))return out;
  while(out.length<n){
    while(d.getDay()===0||d.getDay()===6)d.setDate(d.getDate()+1);
    out.push(d.toISOString().slice(0,10));
    d.setDate(d.getDate()+1);
  }
  return out;
};

// ── C34 pain.001.001.09 desde las líneas guardadas de una remesa ──────────
// Misma estructura que el generador de proveedores/nóminas de la app; aquí
// se parte de las txns del histórico {n,imp,c,ib}. La dirección postal del
// acreedor no se guardó en el histórico y es opcional en el esquema: los
// ficheros salen sin ella. El BIC se resuelve con la función bicDe que pasa
// la app (tabla de bancos españoles); sin ella, la línea va sin BIC, que
// SEPA admite dentro de la zona.
export const construirC34DeTxns=({ordenante,txns,fechaEjec,msgId,ahora,tipo,bicDe})=>{
  const purp=tipo==='nom'?'SALA':'SUPP';
  const pref=tipo==='nom'?'SEPA NOM':'SEPA SUPP';
  const lineas=(txns||[]).map(t=>({...t,imp:r2(+t.imp||0)}));
  const nbTxs=lineas.length;
  const ctrlSum=lineas.reduce((s,t)=>s+t.imp,0).toFixed(2);
  const iban=normIban(ordenante.iban||'');
  const bic=String(ordenante.bic||'').replace(/\s/g,'');
  const cif=String(ordenante.cif||'').replace(/[^A-Z0-9]/gi,'')+'000';
  const now=ahora||new Date().toISOString().replace(/\.\d{3}Z$/,'')+'Z';
  let txXml='';
  lineas.forEach(t=>{
    const credIban=normIban(t.ib||'');
    const credBic=String((bicDe&&bicDe(credIban))||'').replace(/\s/g,'').toUpperCase();
    txXml+=`
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>NOTPROVIDED</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="EUR">${t.imp.toFixed(2)}</InstdAmt>
        </Amt>
        <ChrgBr>SLEV</ChrgBr>${credBic?`
        <CdtrAgt>
          <FinInstnId>
            <BICFI>${credBic}</BICFI>
          </FinInstnId>
        </CdtrAgt>`:''}
        <Cdtr>
          <Nm>${escXml(String(t.n||'').slice(0,70))}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>${credIban}</IBAN>
          </Id>
        </CdtrAcct>
        <Purp>
          <Cd>${purp}</Cd>
        </Purp>
        <RmtInf>
          <Ustrd>${escXml(String(t.c||'Pago').slice(0,140))}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${now}</CreDtTm>
      <NbOfTxs>${nbTxs}</NbOfTxs>
      <CtrlSum>${ctrlSum}</CtrlSum>
      <InitgPty>
        <Nm>${escXml(String(ordenante.name||'').slice(0,70))}</Nm>${cif.length>3?`
        <Id>
          <OrgId>
            <Othr>
              <Id>${escXml(cif)}</Id>
            </Othr>
          </OrgId>
        </Id>`:''}
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${pref} ${msgId}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <BtchBookg>true</BtchBookg>
      <NbOfTxs>${nbTxs}</NbOfTxs>
      <CtrlSum>${ctrlSum}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
        <CtgyPurp>
          <Cd>${purp}</Cd>
        </CtgyPurp>
      </PmtTpInf>
      <ReqdExctnDt>
        <Dt>${fechaEjec}</Dt>
      </ReqdExctnDt>
      <Dbtr>
        <Nm>${escXml(String(ordenante.name||'').slice(0,70))}</Nm>${ordenante.address||ordenante.city?`
        <PstlAdr>
          <Ctry>${ordenante.country||'ES'}</Ctry>${ordenante.address?`
          <AdrLine>${escXml(ordenante.address)}</AdrLine>`:''}${ordenante.city?`
          <AdrLine>${escXml(ordenante.city)}</AdrLine>`:''}
        </PstlAdr>`:''}
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${iban}</IBAN>
        </Id>
      </DbtrAcct>${bic?`
      <DbtrAgt>
        <FinInstnId>
          <BICFI>${bic}</BICFI>
        </FinInstnId>
      </DbtrAgt>`:''}${txXml}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;
};
