// ═══ ALMACÉN VERI*FACTU · estados, cadena de registros y su guardado ═══════
// Sesión 3 de la fase de almacenes (v329). Dominio normativo: estos registros
// van a la AEAT y su huella encadena unos con otros, así que aquí no se
// "mejora" nada — se muda tal cual, con los mismos nombres y los mismos
// cuerpos. La batería bateria_verifactu.mjs vigila la cadena.
//
// LO QUE NO ESTÁ AQUÍ, Y POR QUÉ:
//  · La carga inicial sigue en App: es UN solo useEffect asíncrono que lee
//    todos los dominios en secuencia (vfCfg, vfRegistros y vfEventos son un
//    tramo suyo). Partirlo cambiaría el orden de escrituras a la nube.
//  · anotarEventos se queda en App: necesita compCfg, que es transversal.
//    Traerlo aquí obligaría a inyectar un estado ajeno al dominio.
//  · vfRegistroDe / vfBloqueada / vfRegistrarFactura y demás lógica siguen en
//    App: son negocio, no almacén. Esta entrega es mudanza, nada más.
import {useState,useRef} from 'react';

export const useVerifactu=({VF_CFG_POR_DEFECTO})=>{
  const [vfCfg,setVfCfg]=useState(VF_CFG_POR_DEFECTO);   // interruptor y destino; NUNCA el certificado
  const [vfRegistros,setVfRegistros]=useState([]);       // cadena de registros de facturación
  const [vfEventos,setVfEventos]=useState([]);           // registro de eventos que exige el reglamento
  const [vfEnviando,setVfEnviando]=useState(false);
  const [vfProbando,setVfProbando]=useState(false);
  const [vfPrueba,setVfPrueba]=useState(null);
  const [vfVer,setVfVer]=useState(false);
  const [vfAnular,setVfAnular]=useState(null);
  const [vfCotejo,setVfCotejo]=useState(null);

  // vfRegRef guarda la cadena SIN esperar al re-render: dos altas seguidas
  // deben encadenar contra la última de verdad, no contra la que el estado
  // todavía no ha refrescado. vfCola serializa los envíos.
  const vfRegRef=useRef(null);
  const vfCola=useRef(Promise.resolve());
  const vfLista=()=>vfRegRef.current||vfRegistros||[];

  const persistVfRegistros=(next)=>{
    vfRegRef.current=next;
    setVfRegistros(next);
    window.storage.set('bh10-vfregistros',JSON.stringify(next)).catch(e=>console.error('Error guardando registros VF:',e));
  };
  const persistVfCfg=(next)=>{setVfCfg(next);window.storage.set('bh10-vfcfg',JSON.stringify(next)).catch(()=>{});};

  return {vfCfg,setVfCfg,vfRegistros,setVfRegistros,vfEventos,setVfEventos,
    vfEnviando,setVfEnviando,vfProbando,setVfProbando,vfPrueba,setVfPrueba,
    vfVer,setVfVer,vfAnular,setVfAnular,vfCotejo,setVfCotejo,
    vfRegRef,vfCola,vfLista,persistVfRegistros,persistVfCfg};
};
