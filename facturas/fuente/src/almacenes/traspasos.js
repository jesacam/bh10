// ═══ ALMACÉN TRASPASOS · empresas del grupo y remesas descargadas ══════════
// Noveno almacén. Nace ya en su módulo, como manda el §1.10: nada de esto se
// escribe dentro de app.jsx.
//   grupo      → empresas del grupo dadas de alta EN ESTA empresa
//   traspasos  → historial de remesas ya descargadas
//   traspModal → la ventana de nuevo traspaso ('new' | null)
//   traspForm  → concepto e importe que se están tecleando
//   grupoModal → alta/edición de una empresa del grupo
import {useState} from 'react';

export const useTraspasos=({CONCEPTO_POR_DEFECTO})=>{
  const [grupo,setGrupo]=useState([]);
  const [traspasos,setTraspasos]=useState([]);
  const [traspModal,setTraspModal]=useState(null);
  const [traspForm,setTraspForm]=useState({empresaId:'',concepto:CONCEPTO_POR_DEFECTO,importe:''});
  const [grupoModal,setGrupoModal]=useState(null);
  const [grupoForm,setGrupoForm]=useState({nombre:'',cif:'',iban:'',bic:''});

  const persistGrupo=(next)=>{setGrupo(next);window.storage.set('bh10-grupo',JSON.stringify(next)).catch(e=>console.error('Error guardando empresas del grupo:',e));};
  const persistTraspasos=(next)=>{setTraspasos(next);window.storage.set('bh10-traspasos',JSON.stringify(next)).catch(e=>console.error('Error guardando traspasos:',e));};

  return {grupo,setGrupo,traspasos,setTraspasos,traspModal,setTraspModal,
    traspForm,setTraspForm,grupoModal,setGrupoModal,grupoForm,setGrupoForm,
    persistGrupo,persistTraspasos};
};
