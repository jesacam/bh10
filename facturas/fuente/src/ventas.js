// ═══ VENTAS · VIVIENDAS, TITULARES Y EXPEDIENTE (v367, fase 1) ═════════════
// Jesús (06-09-2026): «doy de alta la obra, las viviendas una a una, mando a
// cada reservista su enlace, ellos rellenan; yo pongo precio y fechas; reserva,
// arras confirmatorias; el configurador vuelca sus mejoras; lo veo desde la
// obra y desde Clientes». La parte vendedora es la empresa en uso.
//
// La vivienda es la unidad: obra → viviendas → titulares (fichas de cliente
// enlazadas) → expediente (datos, DNI, contratos, pagos, mejoras). Aquí vive
// lo que se puede probar sin pantalla.

const r2=(n)=>Math.round((+n||0)*100)/100;
const U=(s)=>String(s==null?'':s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
const uid=()=>'vv'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
// v371 · Jesús: «todo debe estar en mayúsculas únicamente, para que sea
// uniforme y homogéneo». MAY es para VER (conserva tildes y eñes: MARÍA
// PEÑA, no MARIA PENA); la U de arriba, que las quita, sigue siendo solo
// para comparar. El correo se deja tal cual: en mayúsculas ni se lee bien ni
// se copia bien a un cliente de correo.
export const MAY=(s)=>String(s==null?'':s).toLocaleUpperCase('es-ES').trim();
export const mayusculasFicha=(f)=>({...f,
  nombre:MAY(f.nombre),cif:MAY(f.cif||''),dni:MAY(f.dni||''),
  dir:MAY(f.dir||''),municipio:MAY(f.municipio||''),provincia:MAY(f.provincia||''),
  contacto:MAY(f.contacto||''),
});
export const mayusculasVivienda=(v)=>({...v,
  identificador:MAY(v.identificador),tipologia:MAY(v.tipologia||''),anejos:MAY(v.anejos||''),
  notas:MAY(v.notas||''),
  mejoras:(v.mejoras||[]).map(m=>({...m,concepto:MAY(m.concepto)})),
});
// Las fichas de cliente antiguas no llevan id: se les da uno ESTABLE (de nombre + NIF) para
// poder enlazarlas a una vivienda desde cualquier aparato sin esperar a que se guarden.
const hash36=(s)=>{let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h.toString(36);};
export const idCliente=(c)=>c&&(c.id||('cl-'+hash36(U(c.nombre)+'|'+U(c.cif||c.dni||''))));
export const asegurarIds=(cliCat)=>(cliCat||[]).map(c=>c&&!c.id?{...c,id:idCliente(c)}:c);

// v370 · Jesús (06-09-2026): «la empresa puede ser vendedora Y constructora».
// Dejan de ser excluyentes: son dos interruptores. Lo normal en vuestras
// promociones es tener los dos encendidos (promováis y construyáis vosotros).
export const ROLES_OBRA=[['promotora','🏘️ Vendemos las viviendas'],['constructora','🏗 Ejecutamos la obra']];
// Lee los papeles admitiendo las obras antiguas, que guardaban un solo `rol`.
export const papelesObra=(o)=>{
  if(!o)return {vende:false,construye:false};
  if(o.vende!==undefined||o.construye!==undefined)return {vende:!!o.vende,construye:!!o.construye};
  return {vende:o.rol==='promotora',construye:o.rol==='constructora'};
};
export const conPapel=(o,cual,valor)=>{
  const p=papelesObra(o);const n={...p,[cual]:!!valor};
  // se mantiene `rol` al día para que nada de lo ya escrito se rompa
  return {...o,vende:n.vende,construye:n.construye,rol:n.vende?'promotora':(n.construye?'constructora':'')};
};
export const ESTADOS_VIVIENDA=[['libre','Libre'],['reservada','Reservada'],['arras','Con arras'],['escriturada','Escriturada']];
export const REGIMENES=['gananciales','separación de bienes','privativo','proindiviso'];

export const nuevaVivienda=(obraId,campos)=>mayusculasVivienda({
  id:uid(),obraId:String(obraId||''),identificador:'',tipologia:'',superficieConstruida:0,superficieUtil:0,superficieParcela:0,anejos:'',
  plantas:0,sotano:'',precio:0,ivaTipo:10,estado:'libre',fechaReserva:'',fechaArras:'',fechaEscritura:'',
  titulares:[],   // [{clienteId, porcentaje, regimen}]
  mejoras:[],     // [{id, concepto, importe, fecha, origen}]
  enlaces:[],     // [{token, creado, caduca, usado}]
  notas:'',...(campos||{}),
})

export const viviendasDeObra=(viviendas,obraId)=>(viviendas||[]).filter(v=>v&&String(v.obraId)===String(obraId)).sort((a,b)=>String(a.identificador).localeCompare(String(b.identificador),'es',{numeric:true}));

// Un cliente puede ser titular de varias viviendas; una vivienda, de varios clientes
export const viviendasDeCliente=(viviendas,cliente)=>{const id=typeof cliente==='object'?idCliente(cliente):cliente;return (viviendas||[]).filter(v=>(v.titulares||[]).some(t=>String(t.clienteId)===String(id)));};

export const cotitularesDe=(vivienda,cliente,cliCat)=>{const id=typeof cliente==='object'?idCliente(cliente):cliente;return (vivienda.titulares||[]).filter(t=>String(t.clienteId)!==String(id)).map(t=>nombreTitular(t,cliCat));};

export const nombreTitular=(t,cliCat)=>{const c=(cliCat||[]).find(x=>String(idCliente(x))===String(t.clienteId));return c?(c.nombre||''):'(cliente borrado)';};

// Los porcentajes tienen que sumar 100 (o no haber ninguno: se reparte a partes iguales)
export const normalizaTitulares=(titulares)=>{
  const ts=(titulares||[]).filter(t=>t&&t.clienteId);
  if(!ts.length)return [];
  const suma=ts.reduce((s,t)=>s+(+t.porcentaje||0),0);
  if(Math.abs(suma-100)<0.01)return ts.map(t=>({...t,porcentaje:r2(+t.porcentaje)}));
  const igual=r2(100/ts.length);
  return ts.map((t,i)=>({...t,porcentaje:i===ts.length-1?r2(100-igual*(ts.length-1)):igual}));
};

// Lo que llega del portal con la vivienda enlazada: fichas de cliente (crear o completar) y titulares
const normNif=(s)=>U(s).replace(/[^A-Z0-9]/g,'');
export const aplicarRecibidoAVivienda=({recibido,vivienda,cliCat})=>{
  const cat=asegurarIds(cliCat).map(c=>({...c}));
  const titularesRec=Array.isArray(recibido&&recibido.titulares)&&recibido.titulares.length?recibido.titulares:[recibido||{}];
  const nuevos=[];const actualizados=[];const titulares=[...(vivienda.titulares||[])];
  for(const t of titularesRec){
    const nif=normNif(t.nif||t.cif||'');const nombre=String(t.nombre||'').trim();
    if(!nombre&&!nif)continue;
    let c=cat.find(x=>nif&&normNif(x.cif||x.dni||'')===nif)||cat.find(x=>nombre&&U(x.nombre)===U(nombre));
    // v371 · todo lo que entra por el portal se guarda en MAYÚSCULAS
    const datos0={nombre:nombre||(c&&c.nombre)||'',cif:nif||(c&&c.cif)||'',dir:t.dir||(c&&c.dir)||'',cp:t.cp||(c&&c.cp)||'',municipio:t.municipio||(c&&c.municipio)||'',provincia:t.provincia||(c&&c.provincia)||'',email:t.email||(c&&c.email)||'',telefono:t.telefono||(c&&c.telefono)||'',estadoCivil:t.estadoCivil||(c&&c.estadoCivil)||'',regimen:t.regimen||(c&&c.regimen)||''};
    const datos=mayusculasFicha(datos0);
    if(c){Object.assign(c,datos);actualizados.push(c.nombre);}
    else{c={id:'cl'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),...datos,origen:'portal'};cat.push(c);nuevos.push(c.nombre);}
    if(!titulares.some(x=>String(x.clienteId)===String(c.id)))titulares.push({clienteId:c.id,porcentaje:0,regimen:datos.regimen||''});
  }
  const viv={...vivienda,titulares:normalizaTitulares(titulares),estado:vivienda.estado==='libre'?'reservada':vivienda.estado};
  return {vivienda:viv,cliCat:cat,nuevos,actualizados};
};

// Mejoras del configurador (llegan como {concepto, importe}[]): se añaden sin duplicar
export const aplicarMejoras=(vivienda,mejoras,origen)=>{
  // sin duplicar: ni con lo que ya tenía la vivienda ni dentro del mismo envío
  const ya=new Set((vivienda.mejoras||[]).map(m=>U(m.concepto)+'|'+r2(m.importe)));
  const nuevas=[];
  for(const m of (mejoras||[])){
    if(!m||!String(m.concepto||'').trim())continue;
    const k=U(m.concepto)+'|'+r2(m.importe);if(ya.has(k))continue;ya.add(k);
    nuevas.push({id:'mj'+Math.random().toString(36).slice(2,9),concepto:String(m.concepto).trim().slice(0,160),importe:r2(m.importe),fecha:m.fecha||new Date().toISOString().slice(0,10),origen:origen||'configurador'});
  }
  return {vivienda:{...vivienda,mejoras:[...(vivienda.mejoras||[]),...nuevas]},anadidas:nuevas.length};
};
export const totalMejoras=(v)=>r2((v.mejoras||[]).reduce((s,m)=>s+(+m.importe||0),0));
export const precioTotal=(v)=>r2((+v.precio||0)+totalMejoras(v));
export const precioConIva=(v)=>r2(precioTotal(v)*(1+(+v.ivaTipo||0)/100));

export const resumenObra=(viviendas,obraId)=>{
  const vs=viviendasDeObra(viviendas,obraId);const n=(e)=>vs.filter(v=>v.estado===e).length;
  return {total:vs.length,libres:n('libre'),reservadas:n('reservada'),arras:n('arras'),escrituradas:n('escriturada'),ventas:r2(vs.reduce((s,v)=>s+precioTotal(v),0)),vendidas:r2(vs.filter(v=>v.estado!=='libre').reduce((s,v)=>s+precioTotal(v),0))};
};

// Etiqueta con la que el comprador verá su vivienda en el portal (nunca el precio ni los vecinos)
export const etiquetaVivienda=(vivienda,obra)=>[obra&&(obra.alias||obra.nombre)||'',vivienda.identificador?('vivienda '+vivienda.identificador):''].filter(Boolean).join(' · ');

// Parte vendedora: la empresa en uso, con lo que hay en Ajustes → Datos empresa
export const parteVendedora=(compCfg,empresa)=>({
  razon_social:String((compCfg&&compCfg.name)||(empresa&&empresa.nombre)||'').trim(),cif:String(compCfg&&compCfg.cif||'').trim(),
  domicilio:[compCfg&&compCfg.address,compCfg&&compCfg.city].filter(Boolean).join(', '),registro:String(compCfg&&compCfg.registro||'').trim(),
  representante:{nombre:String(compCfg&&compCfg.representante||'').trim(),dni:String(compCfg&&compCfg.representanteDni||'').trim(),cargo:String(compCfg&&compCfg.representanteCargo||'administrador único').trim()},
  email_rgpd:String(compCfg&&(compCfg.emailRgpd||compCfg.email)||'').trim(),
});

const cel=(v)=>{const s=String(v==null?'':v);return /[;"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
export const csvViviendas=(viviendas,obras,cliCat)=>['obra;vivienda;tipologia;m2;precio;mejoras;total;iva;estado;titulares;reserva;arras;escritura',
  ...(viviendas||[]).map(v=>{const o=(obras||[]).find(x=>String(x.id)===String(v.obraId));return [o?(o.alias||o.nombre):v.obraId,v.identificador,v.tipologia,v.superficieConstruida||'',String(r2(v.precio)).replace('.',','),String(totalMejoras(v)).replace('.',','),String(precioTotal(v)).replace('.',','),v.ivaTipo,v.estado,(v.titulares||[]).map(t=>nombreTitular(t,cliCat)+' '+t.porcentaje+'%').join(' + '),v.fechaReserva||'',v.fechaArras||'',v.fechaEscritura||''].map(cel).join(';');})].join('\r\n');
