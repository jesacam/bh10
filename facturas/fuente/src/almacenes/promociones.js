// ═══ ALMACÉN PROMOCIONES · configuraciones de comprador y su guardado ═══════
// Sesión 2 de la fase de almacenes (v326). Son las configuraciones que los
// compradores mandan desde el configurador de vivienda: se recogen, se
// verifican, se corrigen erratas y se sacan a PDF/Excel.
//
// LO QUE NO ESTÁ AQUÍ, Y POR QUÉ (igual que en seguros):
//  · La carga inicial vive en el único useEffect asíncrono de App, que lee
//    todos los dominios en secuencia con await. Sacar su tramo a un efecto
//    propio lo pondría a correr en paralelo y cambiaría el orden de escrituras
//    a la nube: eso es cambiar comportamiento, no mudar.
//  · verificaCfg, borraCfg y abrirPromo se quedan en App: usan notify,
//    window.bh10Recibidos y fusionaPromo, que son de App, no del almacén.
import {useState} from 'react';

export const usePromociones=()=>{
  const [promoCfg,setPromoCfg]=useState({});      // configuraciones guardadas {id:doc}
  const [verPromo,setVerPromo]=useState(null);    // contrato cuya promoción se mira
  const [verResumen,setVerResumen]=useState(null);// configuración cuyo resumen se enseña
  const [editCfg,setEditCfg]=useState(null);      // configuración en edición manual
  const [promoBusy,setPromoBusy]=useState(false);

  // Guardado del dominio, movido verbatim: local inmediato y nube al vuelo,
  // sin await en el camino del render.
  const guardaPromoCfg=(next)=>{setPromoCfg(next);window.storage.set('bh10-promocfg',JSON.stringify(next)).catch(()=>{});};

  return {promoCfg,setPromoCfg,verPromo,setVerPromo,verResumen,setVerResumen,
    editCfg,setEditCfg,promoBusy,setPromoBusy,guardaPromoCfg};
};
