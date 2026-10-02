// ═══ PÓLIZAS Y FLOTA · ramos, primas, vencimientos, duplicados ═══
import {parseNum} from './basicos';
const normCab=(s)=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');

import {daysTo} from './verifactu';
// Lee filas de un Excel o CSV de pólizas. Acepta las cabeceras tal cual salen
// del propio programa y también las variantes razonables, porque nadie va a
// escribir «Nº de póliza» con la ñ y el punto exactos.
const RAMOS_ALIAS={auto:'auto',vehiculo:'auto',coche:'auto',nave:'nave',local:'nave',
  industrial:'nave',taller:'nave',hogar:'hogar',vivienda:'hogar',obra:'obra',
  construccion:'obra',ramostecnicos:'obra',decenal:'decenal',rc:'rc',
  responsabilidadcivil:'rc',salud:'salud',accidentes:'salud',subsidio:'salud',
  vida:'vida',otros:'otros'};

// ═══ SEGUROS ═══
// Antes había dos sitios donde vivía un seguro: los campos seguroVto/seguroCia
// del vehículo y las pólizas sueltas. Por eso un mismo coche podía acabar con
// dos seguros sin que nadie lo viera. Ahora la PÓLIZA es el único registro, y
// apunta a lo que asegura. El vehículo conserva lo que no es seguro: ITV y
// mantenimiento.
const RAMOS={
  auto:    {n:'Vehículo',        ic:'🚗', objeto:'Matrícula',      ph:'1234 ABC'},
  nave:    {n:'Nave o local',    ic:'🏭', objeto:'Dirección',      ph:'Calle Neón 12, Illescas'},
  hogar:   {n:'Hogar',           ic:'🏠', objeto:'Dirección',      ph:'Chalet nº 4, Valdemoro'},
  obra:    {n:'Todo riesgo obra',ic:'🏗️', objeto:'Obra',          ph:'Residencial Las Acacias'},
  decenal: {n:'Decenal',         ic:'🛡️', objeto:'Promoción',      ph:'Promoción Valdemoro'},
  rc:      {n:'Responsabilidad civil',ic:'⚖️',objeto:'Actividad',  ph:'Actividad de promoción'},
  salud:   {n:'Salud',           ic:'❤️', objeto:'Asegurado',      ph:'Nombre y apellidos'},
  vida:    {n:'Vida',            ic:'👤', objeto:'Asegurado',      ph:'Nombre y apellidos'},
  otros:   {n:'Otros',           ic:'📄', objeto:'Qué asegura',    ph:''},
};

const PERIODOS={anual:{n:'Anual',meses:12},semestral:{n:'Semestral',meses:6},
  trimestral:{n:'Trimestral',meses:3},mensual:{n:'Mensual',meses:1}};

// Dos pólizas cubren el mismo riesgo si son del mismo ramo y del mismo objeto.
// Se compara el objeto sin acentos ni espacios: «1234ABC» y «1234 abc» son el
// mismo coche, y esa era justo la forma de que un duplicado pasara inadvertido.
const claveRiesgo=(p)=>{
  if(!p)return '';
  const ramo=String(p.ramo||p.tipo||'');
  const bruto=String(p.objeto||p.objetoId||'');
  // En un vehículo lo que identifica el riesgo es la MATRÍCULA, no el texto
  // entero. Si se compara «7578BTF · 11434294» con «7578BTF · PEUGEOT PARTNER»
  // salen distintos y el coche con dos seguros pasa desapercibido.
  if(ramo==='auto'){
    const m=bruto.toUpperCase().replace(/[^A-Z0-9]/g,'').match(/\d{4}[A-Z]{3}/);
    if(m)return 'auto|'+m[0];
  }
  const o=String(p.objetoId||p.objeto||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  return o?(ramo+'|'+o):'';
};

const riesgosDuplicados=(lista)=>{
  const vivas=(Array.isArray(lista)?lista:[]).filter(p=>p&&typeof p==='object'&&p.activa!==false);
  const porClave={};
  vivas.forEach(p=>{const k=claveRiesgo(p);if(!k)return;(porClave[k]=porClave[k]||[]).push(p);});
  return Object.entries(porClave).filter(([,ps])=>ps.length>1)
    .map(([clave,ps])=>({clave,ramo:(ps[0].ramo||ps[0].tipo||''),objeto:ps[0].objeto||'',polizas:ps}));
};

// El coste anual de una póliza no es su prima: depende de cada cuánto se paga
const primaAnual=(p)=>{
  const prima=parseNum(p&&p.prima)||0;
  const per=PERIODOS[(p&&p.periodicidad)||'anual']||PERIODOS.anual;
  return +(prima*(12/per.meses)).toFixed(2);
};

const pagosSeguros=(lista,desde,hasta)=>{
  const out=[];
  (Array.isArray(lista)?lista:[]).forEach(p=>{
    if(!p||typeof p!=='object'||p.activa===false)return;
    const prima=parseNum(p.prima)||0;
    if(prima<=0||!p.vto)return;
    const per=PERIODOS[p.periodicidad||'anual']||PERIODOS.anual;
    const base=new Date(String(p.vto)+'T12:00');
    if(!Number.isFinite(base.getTime()))return;
    // Se retrocede hasta antes de la ventana y se avanza pagando
    const d=new Date(base);
    while(d.toISOString().slice(0,10)>desde)d.setMonth(d.getMonth()-per.meses);
    for(let i=0;i<60;i++){
      d.setMonth(d.getMonth()+per.meses);
      const f=d.toISOString().slice(0,10);
      if(f>hasta)break;
      if(f>=desde)out.push({poliza:p,fecha:f,importe:prima,
        concepto:`${(RAMOS[p.ramo]||{}).ic||'📄'} ${p.cia||'Seguro'}${p.objeto?' · '+p.objeto:''}`});
    }
  });
  return out.sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)));
};

const diasAVencer=(p)=>daysTo(p&&p.vto);

// ── FILTRAR Y ORDENAR LAS PÓLIZAS ──
// Se saca de la pantalla para poder probarlo: con 50 pólizas de tres empresas,
// un filtro que se equivoque esconde justo la que hay que renovar.
const ORDENES={
  urgencia:{n:'⏰ Lo que antes vence'},
  importe:{n:'💰 Prima, de mayor a menor'},
  importeAsc:{n:'💰 Prima, de menor a mayor'},
  vencimiento:{n:'📅 Vencimiento, del más lejano'},
  empresa:{n:'🏢 Empresa'},
  ramo:{n:'🛡️ Tipo de seguro'},
  objeto:{n:'🔤 Qué asegura (A-Z)'},
};

const filtrarPolizas=(polizas,f)=>{
  const F=f||{};
  const txt=String(F.texto||'').trim().toUpperCase();
  return (Array.isArray(polizas)?polizas:[]).filter(p=>{
    if(!p||typeof p!=='object')return false;
    if(p.activa===false)return false;
    if(F.empresa&&String(p.empresa||'BIG')!==F.empresa)return false;
    if(F.ramo&&String(p.ramo||'')!==F.ramo)return false;
    if(F.vto&&F.vto!=='todas'){
      const d=diasAVencer(p);
      // Sin fecha no se puede decir si vence: queda fuera de esos filtros
      if(d===null)return F.vto==='sinfecha';
      if(F.vto==='sinfecha')return false;
      if(F.vto==='vencidas'&&!(d<0))return false;
      if(F.vto==='30'&&!(d>=0&&d<=30))return false;
      if(F.vto==='90'&&!(d>30&&d<=90))return false;
    }
    if(txt){
      const donde=[p.objeto,p.desc,p.nPoliza,p.tipo,p.cia,p.notas]
        .map(x=>String(x||'').toUpperCase()).join(' ');
      if(!donde.includes(txt))return false;
    }
    return true;
  });
};

const ordenarPolizas=(lista,orden)=>{
  const l=[...(Array.isArray(lista)?lista:[])];
  const nom=(p)=>String(p.objeto||p.desc||p.nPoliza||'').toUpperCase();
  // Las que no tienen fecha van SIEMPRE al final: no son urgentes ni lejanas,
  // simplemente no se sabe, y colarlas arriba tapa lo que sí corre prisa.
  const conFecha=(p)=>diasAVencer(p)!==null;
  switch(String(orden||'urgencia')){
    case 'importe':     l.sort((a,b)=>primaAnual(b)-primaAnual(a)); break;
    case 'importeAsc':  l.sort((a,b)=>primaAnual(a)-primaAnual(b)); break;
    case 'vencimiento': l.sort((a,b)=>{
      if(conFecha(a)!==conFecha(b))return conFecha(a)?-1:1;
      return (diasAVencer(b)||0)-(diasAVencer(a)||0);
    }); break;
    case 'empresa':     l.sort((a,b)=>String(a.empresa||'BIG').localeCompare(String(b.empresa||'BIG'))||nom(a).localeCompare(nom(b))); break;
    case 'ramo':        l.sort((a,b)=>String(a.ramo||'').localeCompare(String(b.ramo||''))||nom(a).localeCompare(nom(b))); break;
    case 'objeto':      l.sort((a,b)=>nom(a).localeCompare(nom(b))); break;
    default:            l.sort((a,b)=>{
      if(conFecha(a)!==conFecha(b))return conFecha(a)?-1:1;
      return (diasAVencer(a)||0)-(diasAVencer(b)||0);
    });
  }
  return l;
};

// Cuántas hay de cada cosa, para poder poner el número en cada botón
const cuentaPolizas=(polizas,f,campo)=>{
  const base=filtrarPolizas(polizas,{...(f||{}),[campo]:''});
  const c={};
  base.forEach(p=>{
    const k=campo==='empresa'?String(p.empresa||'BIG'):String(p.ramo||'otros');
    c[k]=(c[k]||0)+1;
  });
  return c;
};

// Prepara la lista para elegir qué vehículos se copian a pólizas. Marca los que
// ya están copiados para no duplicarlos, y deja fuera de la selección previa
// los de baja: casi nunca se quieren, pero se pueden marcar a mano.
const vehiculosACopiar=(flota,polizas)=>{
  const pol=Array.isArray(polizas)?polizas:[];
  // Solo cuentan las pólizas VIVAS. Una dada de baja no puede bloquear la copia:
  // si se borró en Pólizas, hay que poder volver a traerla.
  const yaEstan=new Set(pol.filter(p=>p&&p.activa!==false).map(p=>String(p.origenVeh||'')).filter(Boolean));
  const deBaja=new Set(pol.filter(p=>p&&p.activa===false).map(p=>String(p.origenVeh||'')).filter(Boolean));
  return (Array.isArray(flota)?flota:[])
    .filter(v=>v&&typeof v==='object'&&v.id&&(v.seguroVto||v.seguroCia||v.seguroPrima))
    .map(v=>({
      id:String(v.id),
      matricula:v.matricula||'', alias:v.alias||'',
      cia:v.seguroCia||'', prima:v.seguroPrima||'', vto:v.seguroVto||'',
      empresa:v.empresa||'BIG', activa:v.activa!==false,
      yaEsta:yaEstan.has(String(v.id)),
      estabaDeBaja:deBaja.has(String(v.id))&&!yaEstan.has(String(v.id)),
      // Preseleccionados: los que están de alta y aún no se han copiado
      sel:!yaEstan.has(String(v.id))&&v.activa!==false,
    }));
};

const polizaDeVehiculo=(v)=>({
  id:'pol-veh-'+v.id, origenVeh:String(v.id),
  empresa:v.empresa||'BIG', ramo:'auto',
  objeto:v.matricula||v.alias||'',
  objetoId:String(v.matricula||'').toUpperCase().replace(/[^A-Z0-9]/g,''),
  cia:v.cia||'', prima:v.prima||'', periodicidad:'anual',
  vto:v.vto||'', desc:v.alias||v.matricula||'',
  notas:'Copiada desde la ficha del vehículo',
  activa:v.activa!==false,
});

const leerFilasPolizas=(filas)=>{
  const out=[], avisos=[];
  (Array.isArray(filas)?filas:[]).forEach((f,ix)=>{
    if(!f||typeof f!=='object')return;
    const g=(...claves)=>{
      for(const k of Object.keys(f)){
        const n=normCab(k);
        if(claves.some(c=>n===c||n.startsWith(c)))return f[k];
      }
      return '';
    };
    const desc=String(g('queasegura','objeto','descripcion','desc','asegurado')||'').trim();
    const cia=String(g('compania','aseguradora','cia')||'').trim();
    const tipo=String(g('ndepoliza','numerodepoliza','npoliza','poliza','tipo')||'').trim();
    // Una póliza necesita saber QUÉ asegura o su número. Con esto se descartan
    // la fila vacía y la de totales, que si no se colaría como una póliza más y
    // duplicaría el coste anual sin que nadie lo notara.
    if(!desc&&!tipo)return;
    if(/^(total|totales|suma)$/i.test(String(cia).trim())||/^(total|totales|suma)$/i.test(desc))return;
    const rBruto=normCab(g('ramo','clase','tipodeseguro'));
    const ramo=RAMOS_ALIAS[rBruto]||(rBruto&&RAMOS[rBruto]?rBruto:'');
    if(!ramo)avisos.push(`Fila ${ix+2}: no reconozco el ramo «${g('ramo','clase')||''}», se deja como Otros`);
    const perBruto=normCab(g('periodicidad','cadacuanto'));
    const per=PERIODOS[perBruto]?perBruto:'anual';
    // La fecha puede llegar como texto español, como ISO o como fecha de Excel
    const vRaw=g('vencimiento','vto','fecha');
    let vto='';
    if(vRaw instanceof Date&&Number.isFinite(vRaw.getTime()))vto=vRaw.toISOString().slice(0,10);
    else{
      const t=String(vRaw||'').trim();
      const m=t.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
      if(m)vto=`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
      else if(/^\d{4}-\d{2}-\d{2}$/.test(t))vto=t;
      else if(t)avisos.push(`Fila ${ix+2}: no entiendo la fecha «${t}», se deja vacía`);
    }
    out.push({
      empresa:String(g('empresa')||'BIG').trim().toUpperCase()||'BIG',
      ramo:ramo||'otros', objeto:desc,
      objetoId:desc.toUpperCase().replace(/[^A-Z0-9]/g,''),
      nPoliza:tipo, tipo:tipo, cia, prima:parseNum(g('prima','importe','cuota'))||'',
      periodicidad:per, vto, desc,
      notas:String(g('notas','observaciones')||'').trim(),
      activa:true,
    });
  });
  return {polizas:out, avisos};
};

// Los vehículos guardaban su seguro dentro (seguroVto, seguroCia, seguroPrima).
// Se convierten en pólizas de verdad, sin tocar el vehículo: su ITV y su
// mantenimiento siguen donde estaban, que no son seguros. La conversión se hace
// una sola vez y deja marca, para no crear la misma póliza en cada arranque.
const migrarSegurosDeFlota=(flota,polizas)=>{
  const pol=Array.isArray(polizas)?polizas.slice():[];
  const yaEstan=new Set(pol.map(p=>String((p&&p.origenVeh)||'')).filter(Boolean));
  const nuevas=[];
  (Array.isArray(flota)?flota:[]).forEach(v=>{
    if(!v||typeof v!=='object'||!v.id)return;
    if(yaEstan.has(String(v.id)))return;
    if(!v.seguroVto&&!v.seguroCia&&!v.seguroPrima)return;
    nuevas.push({
      id:'pol-veh-'+v.id, origenVeh:String(v.id),
      empresa:v.empresa||'BIG', ramo:'auto',
      objeto:v.matricula||v.alias||'', objetoId:String(v.matricula||'').toUpperCase().replace(/[^A-Z0-9]/g,''),
      cia:v.seguroCia||'', prima:v.seguroPrima||'', periodicidad:'anual',
      vto:v.seguroVto||'', desc:v.alias||v.matricula||'',
      notas:'Convertida automáticamente desde la ficha del vehículo',
      activa:v.activa!==false,
    });
  });
  return {polizas:pol.concat(nuevas), nuevas:nuevas.length};
};
export {normCab,RAMOS_ALIAS,RAMOS,PERIODOS,claveRiesgo,riesgosDuplicados,primaAnual,pagosSeguros,diasAVencer,ORDENES,filtrarPolizas,ordenarPolizas,cuentaPolizas,vehiculosACopiar,polizaDeVehiculo,leerFilasPolizas,migrarSegurosDeFlota};
