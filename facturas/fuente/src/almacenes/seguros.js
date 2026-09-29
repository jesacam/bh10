// ═══ ALMACÉN SEGUROS/FLOTA · estados y guardado del dominio ═══
// Primer almacén por dominio (v325). Contiene SOLO los estados que ningún otro
// dominio declara, más las dos funciones de guardado propias. Se mudó tal cual:
// mismos nombres, mismos inicializadores, mismos comentarios.
//
// LO QUE NO ESTÁ AQUÍ, Y POR QUÉ:
//  · La carga inicial NO vive en este módulo. En App hay UN solo useEffect
//    asíncrono que lee todos los dominios en secuencia con await (flota y
//    pólizas son un tramo suyo, con la lógica de leidoOk y flotaseed que ya
//    costó perder pólizas una vez). Sacar ese tramo a un efecto propio lo
//    pondría a correr en paralelo con el resto y cambiaría el orden de
//    escrituras a la nube: eso es cambiar comportamiento, no mudar. App sigue
//    cargando y usa los setters que devuelve este almacén.
//  · El efecto de deshacer/rehacer tampoco: lee flota y pólizas junto a otras
//    nueve áreas, así que es transversal por naturaleza y se queda en App.
import {useState,useRef} from 'react';

export const useSeguros=({emptyVeh,emptyPoliza})=>{
  const [flota,setFlota]=useState([]);
  const [flotaModal,setFlotaModal]=useState(null); // 'new' | id
  const [flotaForm,setFlotaForm]=useState(emptyVeh);
  // La sección se llama Seguros: entra por las pólizas, no por los vehículos
  const [flotaView,setFlotaView]=useState('polizas');
  const [polizas,setPolizas]=useState([]);
  const [polModal,setPolModal]=useState(null);
  // El filtro de pólizas ya no es un texto suelto: lleva vencimiento, empresa,
  // tipo de seguro y búsqueda, que se combinan entre sí.
  const [polFiltro,setPolFiltro]=useState({vto:'todas',empresa:'',ramo:'',texto:''});
  const [polOrden,setPolOrden]=useState('urgencia');
  const [polMasFiltros,setPolMasFiltros]=useState(false);
  const [polImport,setPolImport]=useState(null);
  const [copiarSeg,setCopiarSeg]=useState(null); // 'new' | id
  const [polForm,setPolForm]=useState(emptyPoliza);
  const [lastBaja,setLastBaja]=useState(null); // {kind:'pol'|'veh',id}
  const [verBajas,setVerBajas]=useState(false);
  const bajaTimer=useRef(null);

  // Guardado del dominio: localStorage/nube en segundo plano, sin await en el
  // camino del render (fire-and-forget). Movidas verbatim desde App.
  const persistFlota=(next)=>{setFlota(next);window.storage.set('bh10-flota',JSON.stringify(next)).catch(e=>console.error('Error guardando flota:',e));};
  const persistPolizas=(next)=>{setPolizas(next);window.storage.set('bh10-polizas',JSON.stringify(next)).catch(e=>console.error('Error guardando pólizas:',e));};

  return {flota,setFlota,flotaModal,setFlotaModal,flotaForm,setFlotaForm,flotaView,setFlotaView,
    polizas,setPolizas,polModal,setPolModal,polFiltro,setPolFiltro,polOrden,setPolOrden,
    polMasFiltros,setPolMasFiltros,polImport,setPolImport,copiarSeg,setCopiarSeg,
    polForm,setPolForm,lastBaja,setLastBaja,verBajas,setVerBajas,bajaTimer,
    persistFlota,persistPolizas};
};
