// ═══ BORRADORES · drafts locales por empresa ═══
import {txtSeguro} from './verifactu';
const DRAFT_C='bh10-draft-contrato', DRAFT_F='bh10-draft-factura';

const empActiva=()=>{try{return (typeof window!=='undefined'&&window.BH10_EMPRESA&&window.BH10_EMPRESA.sub)||'';}catch(e){return '';}};

const dkey=(k)=>{const t=txtSeguro(k);const s=empActiva();return s?t+':'+s:t;};

const guardarDraft=(k,v)=>{try{localStorage.setItem(dkey(k),JSON.stringify(v));}catch(e){}};

const leerDraft=(k)=>{try{const s=localStorage.getItem(dkey(k));return s?JSON.parse(s):null;}catch(e){return null;}};

const borrarDraft=(k)=>{try{localStorage.removeItem(dkey(k));}catch(e){}};

const draftUtil=(d,campos)=>!!(d&&campos.some(c=>{const v=d[c];return v!==undefined&&v!==null&&String(v).trim()!==''&&String(v)!=='0';}));
export {DRAFT_C,DRAFT_F,empActiva,dkey,guardarDraft,leerDraft,borrarDraft,draftUtil};
