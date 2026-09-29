// ═══ ALMACÉN TESORERÍA/BANCOS · extractos N43 y conciliación ═══════════════
// Sesión 4 de la fase de almacenes (v330). Aquí se casan apuntes del banco con
// facturas: un fallo no rompe una pantalla, deja pagos mal aplicados. Por eso
// se muda tal cual, sin tocar un byte de la lógica de conciliación.
//
// LO QUE NO ESTÁ AQUÍ, Y POR QUÉ:
//  · La carga inicial sigue en App (un solo useEffect en secuencia, como en
//    las tres sesiones anteriores).
//  · n43Hist participa en el deshacer/rehacer global a través del mapa
//    CLAVE_AREA: ese efecto es transversal y se queda en App leyendo el alias.
//  · anularN43 se queda: es lógica de negocio (deshace pagos y restaura
//    fechas), no almacenamiento. Esta entrega es mudanza, nada más.
//  · subirBanco, pegaExtracto y txtExtracto NO se mudan: viven lejos del
//    bloque, con hooks de por medio, y pegaExtracto/txtExtracto pertenecen al
//    circuito de recurrentes (recDatos), que es otro dominio. Se identifican
//    aquí para que la sesión que les toque sepa que están pendientes.
import {useState} from 'react';

export const useTesoreria=()=>{
  const [n43Res,setN43Res]=useState(null);
  const [n43Hist,setN43Hist]=useState([]);   // extractos aplicados: permiten anular lo que hicieron
  const [n43Gestion,setN43Gestion]=useState(false);
  const [n43Nombre,setN43Nombre]=useState('');
  const [n43Pendiente,setN43Pendiente]=useState(null); // extracto elegido desde la ventana de gestión

  const persistN43=(next)=>{setN43Hist(next);window.storage.set('bh10-n43',JSON.stringify(next)).catch(e=>console.error('Error guardando extractos:',e));};

  return {n43Res,setN43Res,n43Hist,setN43Hist,n43Gestion,setN43Gestion,
    n43Nombre,setN43Nombre,n43Pendiente,setN43Pendiente,persistN43};
};
