// ═══ ALMACÉN CONTRATOS · contratos, obras, presupuestos y certificaciones ══
// Sesión 6 de la fase de almacenes (v333). Riesgo ALTO: de aquí salen las
// certificaciones (que la batería S2 vigila) y las retenciones de garantía.
// Mudanza pura: los 18 estados se han EXTRAÍDO LITERALMENTE del app.jsx, sin
// transcribirlos a mano, y se han verificado uno a uno por número de línea.
//
// A DIFERENCIA de las sesiones anteriores, aquí SÍ había dos useEffect dentro
// del rango (la lupa de búsqueda y el teclado de iOS, L1262 y L1308). Se
// comprobó que no referencian ningún estado del dominio, y todos los
// movimientos son HACIA ARRIBA: ninguna declaración queda por detrás de un uso.
//
// LO QUE NO ESTÁ AQUÍ: la carga inicial (sigue en App), el cálculo de
// certificaciones y retenciones (negocio, no almacén), y fObra/expObra, que
// son filtros de la pantalla de facturas aunque lleven «obra» en el nombre.
import {useState} from 'react';

export const useContratos=({today,emptyObra})=>{
  const [budgets,setBudgets]=useState({});
  const [editBudget,setEditBudget]=useState(null);
  const [budgetAmt,setBudgetAmt]=useState('');
  const [contratos,setContratos]=useState([]);
  const [obras,setObras]=useState([]);
  const [obraModal,setObraModal]=useState(null); // {editing:id|null,from:'form'|'obras'}
  const [obraForm,setObraForm]=useState(emptyObra);
  const [showContratoForm,setShowContratoForm]=useState(false);
  const [editingContrato,setEditingContrato]=useState(null);
  const [conView,setConView]=useState('lista');
  const [conOrden,setConOrden]=useState('reciente'); // reciente | ejecucion | importe | pendiente
  const [contratoForm,setContratoForm]=useState({tipo:'presupuesto',modo:'simple',fecha:today,numero:'',cliente:'',clienteCif:'',clienteDir:'',obra:'',items:[{desc:'',qty:1,precio:0,iva:21}],notas:'',estado:'borrador'});
  const [showCertModal,setShowCertModal]=useState(null);
  const [certPct,setCertPct]=useState('');
  const [certNumF,setCertNumF]=useState('');
  const [certLin,setCertLin]=useState({});
  const [showNuevoTipo,setShowNuevoTipo]=useState(false);
  const [certDesc,setCertDesc]=useState('');

  const persistObras=(next)=>{setObras(next);window.storage.set('bh10-obras',JSON.stringify(next)).catch(e=>console.error('Error guardando obras:',e));};

  return {budgets,setBudgets,editBudget,setEditBudget,budgetAmt,setBudgetAmt,contratos,setContratos,obras,setObras,obraModal,setObraModal,obraForm,setObraForm,showContratoForm,setShowContratoForm,editingContrato,setEditingContrato,conView,setConView,conOrden,setConOrden,contratoForm,setContratoForm,showCertModal,setShowCertModal,certPct,setCertPct,certNumF,setCertNumF,certLin,setCertLin,showNuevoTipo,setShowNuevoTipo,certDesc,setCertDesc,persistObras};
};
