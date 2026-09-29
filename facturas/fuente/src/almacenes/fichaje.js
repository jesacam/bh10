// ═══ ALMACÉN FICHAJE · planificación mensual y su guardado ══════════════════
// Sesión 2 de la fase de almacenes (v326). El índice de meses planificados y
// las dos ventanas del circuito: importar una planificación y gestionar el
// fichaje.
//
// Ojo con el guardado: cada mes se guarda en SU clave (bh10-plan-AAAA-MM) y
// aparte se reescribe el índice entero (bh10-planidx). Se hace así a propósito
// —así un mes no arrastra a los demás— y se ha movido tal cual, awaits
// incluidos: aquí el await sí estaba y quitarlo cambiaría la semántica.
//
// La carga inicial se queda en el useEffect compartido de App, como en los
// demás almacenes.
import {useState} from 'react';
import {resumenPlan} from '../fichaje';
import {today} from '../fichas';

export const useFichaje=()=>{
  const [planImport,setPlanImport]=useState(null);
  const [planMeses,setPlanMeses]=useState([]);
  const [fichajeGest,setFichajeGest]=useState(null);

  // El índice se reescribe entero cada vez. Así un mes no arrastra a los demás.
  const guardarPlanMes=async(mes,lineas)=>{
    await window.storage.set('bh10-plan-'+mes,JSON.stringify(lineas));
    const idx=(planMeses||[]).filter(m=>m&&m.mes!==mes);
    const r=resumenPlan(lineas);
    const nuevo=[...idx,{mes,dias:r.totalDias,horas:r.totalHoras,
      trabajadores:r.porEmp.length,cargado:today}].sort((a,b)=>a.mes.localeCompare(b.mes));
    setPlanMeses(nuevo);
    await window.storage.set('bh10-planidx',JSON.stringify(nuevo));
  };

  return {planImport,setPlanImport,planMeses,setPlanMeses,fichajeGest,setFichajeGest,
    guardarPlanMes};
};
