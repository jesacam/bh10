// ═══ ALMACÉN FACTURAS · el corazón de la aplicación ════════════════════════
// Sesión 7 y última de la fase de almacenes (v335). Es el dominio que el
// documento manda dejar para el final, y llega con el método rodado seis
// veces: los estados se EXTRAEN LITERALMENTE del app.jsx y se verifica uno a
// uno que cada línea declara el nombre esperado antes de tocarla.
//
// POR QUÉ LA LLAMADA VA DONDE VA: justo debajo de invoicesAll hay un useMemo
// que lo filtra (`invoices`). Si invoicesAll bajara, ese memo lo leería antes
// de existir y la app reventaría al renderizar. Por eso el hook se llama en la
// posición de invoicesAll y TODO lo demás sube hacia él: moviendo hacia arriba
// ninguna declaración queda nunca por detrás de un uso.
//
// provCat y cliCat ENTRAN aquí por decisión de Jesús. Los usan facturas,
// contratos y nóminas, así que la regla de frontera del §3.2 los dejaría en
// App; pero App los re-expone con alias y todos sus lectores los reciben del
// hook, que es la otra mitad de esa misma regla. El motivo: son catálogos con
// persist propio y dejarlos sueltos mientras el resto vive en almacenes es
// peor. Contrapartida a tener presente: si algún día el almacén de contratos
// o el de nóminas quisiera ser autónomo, tendría que pedírselos a éste.
//
// LO QUE NO ESTÁ AQUÍ: la carga inicial (sigue en App), el useEffect que
// resetea dupOk al abrir el formulario (es sincronización de UI, no guardado),
// financiación y euríbor, los KPI del panel, compCfg y ayudaVer (globales).
import {useState} from 'react';

export const useFacturas=({emptyForm,emptyPago,today})=>{
  const [invoicesAll,setInvoices]=useState([]);
  const [showForm,setShowForm]=useState(false);
  const [dupOk,setDupOk]=useState(false); // permite guardar un duplicado tras el aviso
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({...emptyForm});
  const [search,setSearch]=useState('');
  const [fEstado,setFEstado]=useState('todos');
  const [fObra,setFObra]=useState('todas');
  const [fTipo,setFTipo]=useState('todos');
  const [fProvSel,setFProvSel]=useState('todos');
  const [fusOrigen,setFusOrigen]=useState('');
  const [pendProvSel,setPendProvSel]=useState(null);
  const [fusIgnoradas,setFusIgnoradas]=useState([]);
  const [fusCfg,setFusCfg]=useState({cerradaEn:-1,abierta:false}); // se abre sola si hay propuestas nuevas
  const [fusManual,setFusManual]=useState(false);
  const [fusDestino,setFusDestino]=useState('');
  const [subView,setSubView]=useState('recibidas');
  const [fProv,setFProv]=useState('todos');
  const [focoProv,setFocoProv]=useState('');
  const [focoCli,setFocoCli]=useState('');
  const [expObra,setExpObra]=useState(null);
  const [sortMode,setSortMode]=useState('fecha_desc');
  const [sortCol,setSortCol]=useState('fecha');
  const [sortDir,setSortDir]=useState('desc');
  const [confirmDel,setConfirmDel]=useState(null);
  const [pagoModal,setPagoModal]=useState(null);
  const [pagoForm,setPagoForm]=useState({...emptyPago});
  const [expandedId,setExpandedId]=useState(null);
  const [linkModal,setLinkModal]=useState(null);
  const [scanning,setScanning]=useState(false);
  const [selected,setSelected]=useState(new Set());
  const [showSepa,setShowSepa]=useState(false);
  const [sepaDate,setSepaDate]=useState(today);
  // v382 · retirado: la remesa apunta los pagos SIEMPRE. Mientras fue un
  // interruptor se quedó apagado una vez y las facturas salieron sin pago.
  // v359 · si la factura ya lleva pago de OTRA remesa, sustituirlo por el de esta (la última manda)
  const [sepaSustituir,setSepaSustituir]=useState(true);
  const [provCat,setProvCat]=useState([]);
  const [cliCat,setCliCat]=useState([]);
  const [provModal,setProvModal]=useState(null);
  const [provForm,setProvForm]=useState({nombre:'',cif:'',dir:'',iban:'',bic:'',pagoAlRegistrar:false});
  const [provApplyAll,setProvApplyAll]=useState(true);
  const [precioVer,setPrecioVer]=useState(null); // {prov,material} del material abierto
  const [archivador,setArchivador]=useState(null); // proceso de archivado masivo de documentos
  const [detalleScan,setDetalleScan]=useState(null); // relectura de archivadas para extraer líneas {total,hechos,ok,fallos}
  const [docVer,setDocVer]=useState(null); // {url,nombre,mime,zoom} del documento abierto
  const [ordenLista,setOrdenLista]=useState('importe'); // proveedores y clientes: importe | pendiente | nombre | facturas

  const persistCliCat=(next)=>{setCliCat(next);window.storage.set('bh10-clicat',JSON.stringify(next)).catch(e=>console.error('Error guardando fichas de cliente:',e));};
  const persistProvCat=(next)=>{setProvCat(next);window.storage.set('bh10-provcat',JSON.stringify(next)).catch(e=>console.error('Error guardando proveedores:',e));};

  return {invoicesAll,setInvoices,showForm,setShowForm,dupOk,setDupOk,editing,setEditing,form,setForm,search,setSearch,fEstado,setFEstado,fObra,setFObra,fTipo,setFTipo,fProvSel,setFProvSel,fusOrigen,setFusOrigen,pendProvSel,setPendProvSel,fusIgnoradas,setFusIgnoradas,fusCfg,setFusCfg,fusManual,setFusManual,fusDestino,setFusDestino,subView,setSubView,fProv,setFProv,focoProv,setFocoProv,focoCli,setFocoCli,expObra,setExpObra,sortMode,setSortMode,sortCol,setSortCol,sortDir,setSortDir,confirmDel,setConfirmDel,pagoModal,setPagoModal,pagoForm,setPagoForm,expandedId,setExpandedId,linkModal,setLinkModal,scanning,setScanning,selected,setSelected,showSepa,setShowSepa,sepaDate,setSepaDate,sepaSustituir,setSepaSustituir,provCat,setProvCat,cliCat,setCliCat,provModal,setProvModal,provForm,setProvForm,provApplyAll,setProvApplyAll,precioVer,setPrecioVer,archivador,setArchivador,detalleScan,setDetalleScan,docVer,setDocVer,ordenLista,setOrdenLista,persistCliCat,persistProvCat};
};
