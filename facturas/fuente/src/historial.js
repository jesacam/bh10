// ═══ HISTORIAL Y GUARDADO · descripción de cambios, guardado diferido ═══
const NOMBRE_AREA={
  invoices:{s:'factura',p:'facturas',g:'a'},
  contratos:{s:'contrato',p:'contratos',g:'o'},
  employees:{s:'trabajador',p:'trabajadores',g:'o'},
  flota:{s:'vehículo',p:'vehículos',g:'o'},
  polizas:{s:'póliza',p:'pólizas',g:'a'},
  obras:{s:'obra',p:'obras',g:'a'},
  provCat:{s:'ficha de proveedor',p:'fichas de proveedor',g:'a'},
  cliCat:{s:'ficha de cliente',p:'fichas de cliente',g:'a'},
  remesas:{s:'remesa',p:'remesas',g:'a'},
  budgets:{s:'presupuesto de obra',p:'presupuestos de obra',g:'o'},
  n43Hist:{s:'extracto',p:'extractos',g:'o'},
};

// ═══ GUARDADO DIFERIDO ═══
// Guardar en la nube cuesta serializar, comprimir y transmitir. Sin freno, una
// ráfaga de cambios (marcar facturas de una en una) hacía una escritura entera
// por cada toque. Esto agrupa la ráfaga en una sola escritura con el último
// valor, y ofrece vaciar() para volcar lo pendiente al cerrar la app.
// Cada acción (registrar una factura, guardar un contrato, tocar la plantilla)
// se escribe en la nube AL INSTANTE. Lo único que se agrupa son los cambios que
// llegan mientras esa escritura viaja: en vez de encolar una escritura entera
// por cada toque de una ráfaga, se junta todo en una segunda y última pasada.
// Así nunca se retrasa un guardado suelto y no se machaca la red en los lotes.
const crearGuardadoDiferido=(clave,enfriamiento=700)=>{
  let pendiente=null, enVuelo=false, temporizador=null;
  const lanza=()=>{
    if(!pendiente)return;
    const valor=pendiente(); pendiente=null; enVuelo=true;
    let p;
    try{ p=window.storage.set(clave,valor); }
    catch(e){ console.error('Error guardando '+clave+':',e); enVuelo=false; return; }
    Promise.resolve(p)
      .catch(e=>console.error('Error guardando '+clave+':',e))
      .then(()=>{
        enVuelo=false;
        // ¿llegaron cambios mientras se escribía? se juntan en una sola pasada
        if(pendiente&&!temporizador)temporizador=setTimeout(()=>{temporizador=null;lanza();},enfriamiento);
      });
  };
  return {
    programar(valorFn){
      pendiente=valorFn;
      if(enVuelo||temporizador)return;  // ya hay una escritura en marcha o en cola
      lanza();                          // caso normal: se guarda ya
    },
    vaciar(){ if(temporizador){clearTimeout(temporizador);temporizador=null;} lanza(); },
    hayPendiente(){ return !!pendiente||enVuelo; },
  };
};

const AREAS_HIST=['invoices','contratos','employees','flota','polizas','obras','provCat','cliCat','remesas','budgets','n43Hist'];

// Describe qué cambió comparando el antes y el después. Se hace por diferencia
// en lugar de pedir un texto en cada punto del código: así ninguna acción se
// queda sin etiqueta aunque se añadan pantallas nuevas.
const describirArea=(area,a,b)=>{
  const N=NOMBRE_AREA[area]||{s:'cambio',p:'cambios',g:'o'};
  if(!Array.isArray(a)||!Array.isArray(b))return 'cambio en '+N.p;
  const ma=new Map(a.map(x=>[x&&x.id,x])), mb=new Map(b.map(x=>[x&&x.id,x]));
  let alta=0,baja=0,mod=0,muestra=null;
  mb.forEach((v,k)=>{
    const o=ma.get(k);
    if(!o){alta++;muestra=muestra||v;}
    else if(o!==v){
      // en facturas el borrado es una marca, no una desaparición
      if(!o._del&&v._del){baja++;muestra=muestra||v;}
      else if(o._del&&!v._del){alta++;muestra=muestra||v;}
      else {mod++;muestra=muestra||v;}
    }
  });
  ma.forEach((v,k)=>{if(!mb.has(k)){baja++;muestra=muestra||v;}});
  const detalle=()=>{
    const x=muestra; if(!x)return '';
    if(area==='invoices')return x.numFactura?` ${x.numFactura}${x.proveedor?' · '+x.proveedor:''}`:(x.proveedor?' de '+x.proveedor:'');
    if(area==='remesas')return x.fichero?` ${x.nbTxs||''} transferencia${x.nbTxs===1?'':'s'}`:'';
    return x.nombre?' '+x.nombre:(x.numero?' '+x.numero:(x.matricula?' '+x.matricula:(x.alias?' '+x.alias:'')));
  };
  const uno=(n)=>n===1;
  const partes=[];
  if(alta)partes.push(`alta de ${alta} ${uno(alta)?N.s:N.p}`);
  if(baja)partes.push(`baja de ${baja} ${uno(baja)?N.s:N.p}`);
  if(mod)partes.push(`${mod} ${uno(mod)?N.s:N.p} modificad${N.g}${uno(mod)?'':'s'}`);
  const solo=(alta+baja+mod)===1;
  return (partes.join(' · ')||('cambio en '+N.p))+(solo?detalle():'');
};

const describirCambio=(areas,antes,despues)=>{
  areas=Array.isArray(areas)?areas:[];
  antes=antes&&typeof antes==='object'?antes:{};
  despues=despues&&typeof despues==='object'?despues:{};
  const t=areas.map(a=>describirArea(a,antes[a],despues[a])).filter(Boolean).join(' · ');
  return t.charAt(0).toUpperCase()+t.slice(1);
};
export {NOMBRE_AREA,crearGuardadoDiferido,AREAS_HIST,describirArea,describirCambio};
