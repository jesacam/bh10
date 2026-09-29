// ═══ TRASPASOS ENTRE EMPRESAS DEL GRUPO ═══════════════════════════════════
// Mover dinero entre BIG y GREEN sin que medie factura. Si una factura a la
// otra, eso NO pasa por aquí: va como un proveedor más.
//
// CADA EMPRESA GUARDA SU PROPIA LISTA. El almacén está atado a la empresa
// activa (empresas/<uid>[/sub/<sub>]/kv), así que desde BIG no se puede leer
// nada de GREEN. Por eso en BIG se da de alta a GREEN y en GREEN se da de alta
// a BIG: dos listas locales, ningún cruce, y sin tocar el envoltorio.
//
// El fichero que se genera es el MISMO C34 que el de proveedores —el que el
// banco ya acepta— con una sola transferencia. La batería compara etiqueta a
// etiqueta contra el de proveedores para que no se separen nunca.
import {normIban, ibanOk, problemaIban} from './embargos';
import {fmt} from './basicos';

export const CONCEPTO_POR_DEFECTO='TRASPASO';

// ── importe en formato español: 1.212,12 · 1212,12 · 1212.12 ──────────────
export const parseImporte=(txt)=>{
  const s=String(txt==null?'':txt).replace(/[€\s]/g,'').trim();
  if(!s)return null;
  if(!/^[\d.,]+$/.test(s))return null;
  let n;
  const comas=(s.match(/,/g)||[]).length, puntos=(s.match(/\./g)||[]).length;
  if(comas>1)return null;
  if(comas===1){                       // la coma manda: es el decimal
    const [ent,dec]=s.split(',');
    if(dec.length>2||/\./.test(dec))return null;
    n=+(ent.replace(/\./g,'')+'.'+(dec||'0'));
  }else if(puntos===1&&s.split('.')[1].length<=2){
    n=+s;                              // un punto con 1-2 decimales ES decimal:
                                       // 1212.12 → 1212,12. Con 3 detrás es
                                       // separador de miles: 1.212 → 1212.
  }else{
    n=+s.replace(/\./g,'');            // 1.212 → 1212 (miles)
  }
  if(!Number.isFinite(n)||n<=0)return null;
  return +n.toFixed(2);
};
// Se usa el fmt de la propia app para que el traspaso se pinte EXACTAMENTE
// igual que el resto de importes. toLocaleString no pone separador de miles
// en el entorno de las baterías y habría dado «1212,12 €».
export const fmtImporte=(n)=>fmt(+n||0)+' €';

// ── empresas del grupo ────────────────────────────────────────────────────
export const empresaValida=(e)=>{
  if(!e)return 'falta la empresa';
  if(!String(e.nombre||'').trim())return 'la empresa necesita un nombre';
  const ib=normIban(e.iban);
  if(!ib)return 'falta el IBAN de la empresa';
  const p=problemaIban(ib);
  if(p)return 'el IBAN no es válido: '+p;
  if(!ibanOk(ib))return 'el IBAN no supera el dígito de control';
  return '';
};
export const validarTraspaso=({empresa,importe,ordenante})=>{
  const errE=empresaValida(empresa); if(errE)return errE;
  const imp=parseImporte(importe);
  if(imp===null)return 'el importe no se entiende (usa 1.212,12)';
  if(!ordenante||!normIban(ordenante.iban))return 'falta el IBAN de tu propia empresa (Ajustes → datos de empresa)';
  if(normIban(ordenante.iban)===normIban(empresa.iban))return 'el ordenante y el beneficiario tienen el mismo IBAN';
  return '';
};

// ── el fichero C34, misma estructura que el de proveedores ────────────────
const escXml=(s)=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
  .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');

export const construirC34Traspaso=({ordenante,empresa,importe,concepto,fecha,ahora,msgId})=>{
  const imp=parseImporte(importe);
  if(imp===null)throw new Error('importe no válido');
  const ctrlSum=imp.toFixed(2);
  const cif=String(ordenante.cif||'').replace(/[^0-9A-Za-z]/g,'').toUpperCase();
  const bic=String(empresa.bic||'').replace(/\s/g,'').toUpperCase();
  const cpt=String(concepto==null?'':concepto).trim();   // se permite VACÍO a propósito
  const rmt=cpt?`
      <RmtInf>
        <Ustrd>${escXml(cpt.slice(0,140))}</Ustrd>
      </RmtInf>`:'';
  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${ahora}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
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
      <PmtInfId>SEPA GRUP ${msgId}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <BtchBookg>true</BtchBookg>
      <NbOfTxs>1</NbOfTxs>
      <CtrlSum>${ctrlSum}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
        <CtgyPurp>
          <Cd>SUPP</Cd>
        </CtgyPurp>
      </PmtTpInf>
      <ReqdExctnDt>
        <Dt>${fecha}</Dt>
      </ReqdExctnDt>
      <Dbtr>
        <Nm>${escXml(String(ordenante.name||'').slice(0,70))}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${normIban(ordenante.iban)}</IBAN>
        </Id>
      </DbtrAcct>
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>NOTPROVIDED</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="EUR">${imp.toFixed(2)}</InstdAmt>
        </Amt>
        <ChrgBr>SLEV</ChrgBr>${bic?`
        <CdtrAgt>
          <FinInstnId>
            <BICFI>${bic}</BICFI>
          </FinInstnId>
        </CdtrAgt>`:''}
        <Cdtr>
          <Nm>${escXml(String(empresa.nombre||'').slice(0,70))}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>${normIban(empresa.iban)}</IBAN>
          </Id>
        </CdtrAcct>
        <Purp>
          <Cd>SUPP</Cd>
        </Purp>${rmt}
      </CdtTrfTxInf>
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;
};

// ── historial de remesas descargadas ──────────────────────────────────────
export const apuntarTraspaso=(hist,{empresa,importe,concepto,fecha,fichero,msgId})=>{
  const imp=parseImporte(importe)||0;
  return [{id:msgId,fecha,empresaNombre:String(empresa.nombre||''),empresaIban:normIban(empresa.iban),
    importe:imp,concepto:String(concepto==null?'':concepto).trim(),fichero,creado:ahoraISO()},
    ...(Array.isArray(hist)?hist:[])];
};
const ahoraISO=()=>new Date().toISOString();
export const resumenTraspasos=(hist)=>{
  const h=Array.isArray(hist)?hist:[];
  return {n:h.length, total:+h.reduce((s,x)=>s+(+x.importe||0),0).toFixed(2),
    ultimo:h[0]||null};
};
