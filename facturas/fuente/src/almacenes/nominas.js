// ═══ ALMACÉN NÓMINAS · empleados, nóminas, remesas y embargos ══════════════
// Sesión 5 de la fase de almacenes (v332). El dominio de MÁS riesgo hasta
// ahora: de aquí salen los SEPA de nóminas y los embargos judiciales. Un fallo
// no ensucia una pantalla, manda dinero a quien no es. Por eso: mudanza pura,
// mismos nombres, mismos inicializadores, mismos comentarios.
//
// LOS 22 ESTABAN DESPERDIGADOS entre las líneas 1075 y 1267 del app.jsx, con
// 64 estados de otros dominios intercalados. Se pudo agrupar porque en todo
// ese tramo NO hay ni un useEffect ni un useMemo (se comprobó con la máquina),
// y porque los 22 inicializadores son literales o `today` — ninguno depende de
// otro estado. Es exactamente la condición que el §3.4 exige para reordenar.
//
// LO QUE NO ESTÁ AQUÍ, Y POR QUÉ:
//  · La carga inicial sigue en App (un solo useEffect en secuencia).
//  · budgets quedó en App: está intercalado entre payrollConcepto y
//    payrollHistory, pero es de presupuestos de obra, no de nóminas.
//  · El reparto, los embargos y la construcción del C34 se quedan: son
//    negocio. Esta entrega mueve estado, nada más.
import {useState} from 'react';

export const useNominas=({today})=>{
  const [empRen,setEmpRen]=useState('');
  const [empNueva,setEmpNueva]=useState('');
  const [employees,setEmployees]=useState([]);
  const [showEmpForm,setShowEmpForm]=useState(false);
  const [editingEmp,setEditingEmp]=useState(null);
  const [empForm,setEmpForm]=useState({nombre:'',nif:'',iban:'',bic:'',importeBase:'',direccion:'',cp:'',jornada:{L:'',M:'',X:'',J:'',V:'',S:'',D:''},activo:true});
  const [showPayroll,setShowPayroll]=useState(false);
  const [payrollAmounts,setPayrollAmounts]=useState({});
  const [embExcl,setEmbExcl]=useState({}); // embargos apartados a mano en la ventana de la remesa
  const [nomExcl,setNomExcl]=useState({}); // nóminas apartadas a mano (× en la lista)
  const [payrollDate,setPayrollDate]=useState(today);
  const [payrollConcepto,setPayrollConcepto]=useState('');
  const [payrollHistory,setPayrollHistory]=useState([]);
  const [nominasMes,setNominasMes]=useState([]);
  const [nomImport,setNomImport]=useState(null);
  const [nomBusy,setNomBusy]=useState(false);
  const [payrollSoloPDF,setPayrollSoloPDF]=useState(false);
  const [payrollObras,setPayrollObras]=useState({});
  const [payrollRegister,setPayrollRegister]=useState(true);
  // ↑ payrollObras y payrollRegister: reparto de nómina por obra y el
  //   interruptor de registro. Son del dominio y la sesión 5 los dejó en
  //   App: el inventario de entonces se hizo por prefijo de nombre y
  //   «payroll» no entraba en la expresión. Vienen aquí en v334.
  const [fichaEmp,setFichaEmp]=useState(null);
  const [remesas,setRemesas]=useState([]);
  const [expRemesa,setExpRemesa]=useState(null);
  // Partición de una remesa que supera el límite del banco: id de la remesa,
  // límite editable en la propia pantalla y las partes calculadas.
  const [partirRem,setPartirRem]=useState(null);
  const [nomView,setNomView]=useState('panel');
  const [nomPer,setNomPer]=useState('año');

  // Guardado del dominio: localStorage inmediato y nube en segundo plano, sin
  // await en el camino del render. Movidas verbatim desde App.
  const persistNominas=(next)=>{setNominasMes(next);window.storage.set('bh10-nominas',JSON.stringify(next)).catch(()=>{});};
  const persistRemesas=(next)=>{setRemesas(next);window.storage.set('bh10-remesas',JSON.stringify(next)).catch(e=>console.error('Error guardando remesas:',e));};

  return {empRen,setEmpRen,empNueva,setEmpNueva,employees,setEmployees,
    showEmpForm,setShowEmpForm,editingEmp,setEditingEmp,empForm,setEmpForm,
    showPayroll,setShowPayroll,payrollAmounts,setPayrollAmounts,embExcl,setEmbExcl,
    nomExcl,setNomExcl,payrollDate,setPayrollDate,payrollConcepto,setPayrollConcepto,
    payrollHistory,setPayrollHistory,nominasMes,setNominasMes,nomImport,setNomImport,
    nomBusy,setNomBusy,payrollSoloPDF,setPayrollSoloPDF,fichaEmp,setFichaEmp,
    remesas,setRemesas,expRemesa,setExpRemesa,partirRem,setPartirRem,nomView,setNomView,nomPer,setNomPer,
    payrollObras,setPayrollObras,payrollRegister,setPayrollRegister,
    persistNominas,persistRemesas};
};
