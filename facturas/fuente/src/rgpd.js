// ═══ RGPD Y EXPEDIENTES · supresión, cesiones, plazos, notaría ═══
import {parseNum} from './basicos';
import {normProvNombre} from './fichaje';
import {normNif} from './embargos';
// Un saldo inválido acabaría en el importe de una transferencia. Se fuerza a
// número: si el dato está corrupto, sale 0 y se ve, en vez de propagarse.
// Una factura anulada no existe a efectos de IVA, de saldos ni de indicadores:
// su registro se retiró de la AEAT. Se comprueba en un solo sitio y se aplica
// en todos los cálculos, en vez de recordarlo en cada uno.
// ── CONSERVACIÓN Y DESTRUCCIÓN DE DATOS ──
// Los plazos no se recuerdan: se calculan. Cada tipo de dato tiene el suyo y se
// cuenta desde el último momento en que se usó, no desde que se recibió.
const PLAZOS = {
  identidad:{meses:6,  que:'Copias del DNI',        por:'Solo se necesitan para la escritura. Se destruyen al firmarla y, en todo caso, a los 6 meses.'},
  contrato: {meses:72, que:'Datos del contrato',    por:'Seis años de documentación mercantil (Código de Comercio).'},
  fiscal:   {meses:48, que:'Facturación',           por:'Cuatro años de prescripción tributaria.'},
};

const mesesDesde=(iso)=>{
  const t=Date.parse(String(iso||''));
  if(!Number.isFinite(t))return null;
  return Math.floor((Date.now()-t)/(30.44*864e5));
};

// El último uso de un cliente: su factura o contrato más reciente. Mientras siga
// habiendo movimiento, el plazo no empieza a correr.
const ultimoUsoCliente=(nombre,invoices,contratos)=>{
  const n=normProvNombre(nombre||'');
  const fechas=[]
    .concat((Array.isArray(invoices)?invoices:[]).filter(x=>x&&x.tipo==='cobro'&&normProvNombre(x.proveedor)===n).map(x=>x.fecha))
    .concat((Array.isArray(contratos)?contratos:[]).filter(c=>c&&normProvNombre(c.cliente)===n).map(c=>c.fecha))
    .filter(f=>typeof f==='string'&&f);
  return fechas.sort().pop()||'';
};

// ── AUTORIZACIÓN PARA CEDER DATOS A ENTIDADES FINANCIERAS ──
// Ojo al matiz, que es lo contrario de lo demás: los datos del contrato se
// tratan porque hacen falta para el contrato y porque la ley obliga, y ahí el
// consentimiento sería la base equivocada. Pero MANDAR sus datos a un banco NO
// hace falta para venderle la casa: es un favor. Así que aquí el consentimiento
// sí es la base correcta, y como tal tiene que ser libre, específico —qué
// entidades y qué datos—, revocable y demostrable.
const CESION_CAMPOS=['nombre','apellidos','dni','telefono','email','vivienda'];

const cesionVigente=(f,meses)=>{
  const b=(f&&f.bancos)||null;
  if(!b||!b.autoriza)return {ok:false,motivo:'sin autorización'};
  if(b.revocadoEn)return {ok:false,motivo:'retirada el '+b.revocadoEn};
  const m=mesesDesde(b.cuando);
  // Una autorización para buscar hipoteca no puede valer para siempre: se pidió
  // para una operación concreta y caduca con ella.
  if(m!==null&&meses&&m>=meses)return {ok:false,motivo:'caducada ('+m+' meses)'};
  return {ok:true,motivo:''};
};

const clientesCedibles=(cat,meses)=>(Array.isArray(cat)?cat:[])
  // Un cliente bloqueado tras pedir la supresión NO puede salir en un listado:
  // bloquear significa dejar de usarlo, no solo dejar de mirarlo.
  .filter(f=>f&&typeof f==='object'&&!f.bloqueada&&cesionVigente(f,meses).ok);

// Solo viajan los campos que él autorizó. Ni el estado civil, ni la
// nacionalidad, ni por supuesto la copia del DNI.
const filaCesion=(f)=>{
  const t=(Array.isArray(f&&f.titulares)?f.titulares:[])[0]||{};
  const completo=String(t.nombre||f.nombre||'').trim();
  const partes=completo.split(/\s+/);
  return {
    nombre: partes[0]||completo,
    apellidos: partes.slice(1).join(' '),
    dni: String(t.dni||f.cif||'').toUpperCase(),
    telefono: String(t.telefono||f.telefono||''),
    email: String(t.email||f.email||''),
    vivienda: String(f.viviendaReservada||''),
  };
};

// ── TITULARES DE UN CONTRATO ──
// Una vivienda se compra a menudo entre dos. El contrato tenía un solo cliente,
// que es a quien se factura, pero en la escritura tienen que constar todos.
const titularesContrato=(c)=>{
  if(!c)return [];
  // El campo «titulares» guarda los COtitulares: el principal es c.cliente, que
  // es a quien se factura. Devolverlos por separado dejaba fuera al comprador
  // principal en cuanto había un segundo, justo cuando más falta hace tenerlos
  // a los dos juntos.
  const co=(Array.isArray(c.titulares)?c.titulares:[])
    .filter(t=>t&&typeof t==='object'&&String(t.nombre||'').trim());
  const out=[];
  if(String(c.cliente||'').trim())out.push({nombre:c.cliente,dni:c.clienteCif||'',principal:true});
  co.forEach(t=>{
    // No se repite si el cotitular es el mismo que el cliente
    if(out.some(x=>normProvNombre(x.nombre)===normProvNombre(t.nombre)))return;
    out.push({...t,principal:false});
  });
  return out;
};

const nombresTitulares=(c)=>titularesContrato(c).map(t=>t.nombre).filter(Boolean);

// ── SOLICITUDES DE SUPRESIÓN ──
// El derecho de supresión NO es absoluto: el artículo 17.3.b del RGPD deja
// fuera lo que hay que conservar por obligación legal. Así que la respuesta
// correcta a un «bórrenme» casi nunca es borrar todo: es borrar lo que no está
// amparado, BLOQUEAR el resto —a disposición solo de jueces y Administración,
// artículo 32 de la LOPDGDD— y decirle por escrito qué se guarda y hasta cuándo.
const PLAZO_RESPUESTA_DIAS=30;   // artículo 12.3: un mes, prorrogable a tres

const diasParaResponder=(recibida)=>{
  const t=Date.parse(String(recibida||''));
  if(!Number.isFinite(t))return null;
  return PLAZO_RESPUESTA_DIAS-Math.floor((Date.now()-t)/864e5);
};

// Qué se puede borrar hoy y qué no, con su motivo y su fecha.
const planSupresion=({ficha,invoices,contratos,dnis,ultimoUso})=>{
  const f=ficha||{};
  const inv=(Array.isArray(invoices)?invoices:[]).filter(x=>x&&typeof x==='object');
  const cts=(Array.isArray(contratos)?contratos:[]).filter(x=>x&&typeof x==='object');
  const nDni=Array.isArray(dnis)?dnis.length:(+dnis||0);
  const borrar=[], conservar=[];
  const mesesUso=mesesDesde(ultimoUso);
  const restan=(tope)=>mesesUso===null?tope:Math.max(0,tope-mesesUso);
  const fechaFin=(tope)=>{
    const base=Date.parse(String(ultimoUso||''));
    const d=new Date(Number.isFinite(base)?base:Date.now());
    d.setMonth(d.getMonth()+tope);
    return d.toISOString().slice(0,10);
  };

  // Lo que se borra ya: nada obliga a guardarlo
  if(nDni>0)borrar.push({que:`${nDni} copia${nDni!==1?'s':''} del documento de identidad`,
    porque:'Solo servían para la escritura. Ninguna ley obliga a conservarlas.'});
  if(f.bancos&&f.bancos.autoriza)borrar.push({que:'Autorización para ceder datos a entidades financieras',
    porque:'Era un consentimiento suyo y lo está retirando.'});
  if(f.telefono||f.email||f.contacto)borrar.push({que:'Datos de contacto comercial (teléfono, correo, persona de contacto)',
    porque:'No forman parte de la factura ni del libro registro.'});
  if(f.notas)borrar.push({que:'Notas internas',porque:'No responden a ninguna obligación legal.'});
  if(Array.isArray(f.titulares)&&f.titulares.length)borrar.push({
    que:'Datos personales de los titulares (nacimiento, estado civil, régimen, nacionalidad)',
    porque:'Servían para la escritura, no para la facturación.'});

  // Lo que hay que conservar, con su plazo
  const emitidas=inv.filter(x=>x.tipo==='cobro');
  if(emitidas.length)conservar.push({
    que:`${emitidas.length} factura${emitidas.length!==1?'s':''} emitida${emitidas.length!==1?'s':''}`,
    porque:'Obligación de facturación y prescripción tributaria (4 años).',
    meses:PLAZOS.fiscal.meses, restan:restan(PLAZOS.fiscal.meses), hasta:fechaFin(PLAZOS.fiscal.meses)});
  if(emitidas.length||cts.length)conservar.push({
    que:'Nombre, NIF y domicilio fiscal en el libro registro',
    porque:'Documentación mercantil, Código de Comercio (6 años).',
    meses:PLAZOS.contrato.meses, restan:restan(PLAZOS.contrato.meses), hasta:fechaFin(PLAZOS.contrato.meses)});
  if(cts.length)conservar.push({
    que:`${cts.length} contrato${cts.length!==1?'s':''}`,
    porque:'Documentación mercantil y, si hay vivienda, garantías de la Ley de Ordenación de la Edificación.',
    meses:PLAZOS.contrato.meses, restan:restan(PLAZOS.contrato.meses), hasta:fechaFin(PLAZOS.contrato.meses)});

  const puedeTodo=conservar.length===0;
  return {borrar,conservar,puedeTodo,
    // Mientras quede algo por conservar, la ficha queda BLOQUEADA: sigue
    // existiendo para Hacienda y para un juez, pero deja de usarse para todo lo
    // demás — nada de listados a bancos ni de comunicaciones comerciales.
    accion: puedeTodo?'borrar-todo':'borrar-parcial-y-bloquear'};
};

// ── EXPEDIENTE PARA LA NOTARÍA ──
// Se arma en el momento y NO se guarda. Un zip guardado sería una segunda copia
// del dato más delicado: no caducaría a los seis meses, no desaparecería al
// destruir los DNI, no quedaría bloqueado si el cliente pide la supresión y no
// saldría en la pantalla de custodia. Toda la política de plazos se apoya en
// que cada cosa esté en un solo sitio.
const claveExpediente=()=>{
  const abc='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // sin I, O, 0 ni 1: se dicta por teléfono
  let s='';
  const n=(typeof crypto!=='undefined'&&crypto.getRandomValues)
    ? crypto.getRandomValues(new Uint8Array(12)) : Array.from({length:12},()=>Math.floor(Math.random()*256));
  for(let i=0;i<12;i++){s+=abc[n[i]%abc.length];if(i===3||i===7)s+='-';}
  return s;
};

// Se arma desde el CONTRATO, no desde un cliente suelto: si la vivienda tiene
// dos compradores, la notaría necesita la documentación de LOS DOS en un solo
// envío. Mandar dos expedientes por separado obliga al oficial a casarlos.
const expedienteNotaria=({contrato,fichas,dnis})=>{
  const ct=contrato||{};
  const cat=Array.isArray(fichas)?fichas:[];
  const buscaFicha=(nombre)=>cat.find(f=>f&&normProvNombre(f.nombre)===normProvNombre(nombre))||null;

  // Titulares del contrato: el cliente principal y sus cotitulares
  const base=titularesContrato(ct);
  const tits=base.map((t,i)=>{
    const f=buscaFicha(t.nombre)||{};
    // Si esa persona tiene ficha con sus propios titulares, se toma el que coincide
    const suyo=(Array.isArray(f.titulares)?f.titulares:[])
      .find(x=>x&&normProvNombre(x.nombre)===normProvNombre(t.nombre))||{};
    return {
      nombre:t.nombre||f.nombre||'',
      dni:t.dni||suyo.dni||f.cif||'',
      nacimiento:suyo.nacimiento||'', nacionalidad:suyo.nacionalidad||'',
      estadoCivil:suyo.estadoCivil||'', regimen:suyo.regimen||'',
      telefono:suyo.telefono||f.telefono||'', email:suyo.email||f.email||'',
      dir:suyo.dir||f.dir||'', cp:suyo.cp||f.cp||'',
      municipio:suyo.municipio||f.municipio||'', provincia:suyo.provincia||f.provincia||'',
      principal:i===0, bloqueada:!!f.bloqueada, conFicha:!!buscaFicha(t.nombre),
    };
  });

  // Las copias de DNI de CUALQUIERA de los titulares
  const nombres=tits.map(t=>normProvNombre(t.nombre));
  const imgs=(Array.isArray(dnis)?dnis:[]).filter(d=>d&&d.id
    &&(nombres.includes(normProvNombre(d.cliente))||nombres.includes(normProvNombre(d.nombreTitular))));

  const problemas=[];
  const bloq=tits.filter(t=>t.bloqueada);
  if(bloq.length)problemas.push(`${bloq.map(t=>t.nombre).join(', ')} está bloqueado por una solicitud de supresión: no se puede generar.`);
  if(!tits.length||!String(tits[0].nombre||'').trim())problemas.push('El contrato no tiene ningún titular con nombre.');
  tits.forEach((t,i)=>{ if(!String(t.dni||'').trim())problemas.push(`${t.nombre||'El titular '+(i+1)} no tiene DNI.`); });
  const sinDni=tits.filter(t=>!imgs.some(d=>normProvNombre(d.nombreTitular)===normProvNombre(t.nombre)||normProvNombre(d.cliente)===normProvNombre(t.nombre)));
  if(sinDni.length===tits.length)problemas.push('No hay ninguna copia de DNI guardada: el expediente iría sin documentos.');
  else if(sinDni.length)problemas.push(`Sin copia de DNI: ${sinDni.map(t=>t.nombre).join(', ')}.`);

  return {titulares:tits, imagenes:imgs, problemas, sinDni,
    puede:!bloq.length&&tits.length>0&&!!String(tits[0].nombre||'').trim(),
    contrato:ct};
};

// ═══ LOS CONTRATOS DE UN CLIENTE ═══
// El contrato guarda a quién pertenece, pero no había camino de vuelta: desde
// la ficha de un cliente no se veía qué casa tiene. Se enlaza por NIF —que es
// lo fiable— y solo si no lo hay, por el nombre. Devuelve también SI ES
// TITULAR O COTITULAR, porque un cotitular vive dentro del contrato.
const contratosDeCliente=(cli,contratos)=>{
  if(!cli)return [];
  const nif=normNif(cli.cif||cli.nif||'');
  const nom=normProvNombre(cli.nombre||'');
  if(!nif&&!nom)return [];
  const casa=(a,b)=>{
    const na=normNif(a||''), nb=nif;
    if(na&&nb)return na===nb;               // con NIF, manda el NIF
    return !!nom&&normProvNombre(b||'')===nom;  // si no lo hay, el nombre
  };
  const out=[];
  (Array.isArray(contratos)?contratos:[]).forEach(c=>{
    if(!c||typeof c!=='object')return;
    if(casa(c.clienteCif,c.cliente)){ out.push({contrato:c,rol:'titular',conNif:!!(normNif(c.clienteCif)&&nif)}); return; }
    const co=(Array.isArray(c.titulares)?c.titulares:[])
      .find(t=>t&&casa(t.dni||t.nif,t.nombre));
    if(co) out.push({contrato:c,rol:'cotitular',conNif:!!(normNif(co.dni||co.nif)&&nif),junto:c.cliente||''});
  });
  return out.sort((a,b)=>String(b.contrato.fecha||'').localeCompare(String(a.contrato.fecha||'')));
};

const importeContratos=(lista)=>+(lista||[]).reduce((s,x)=>s+(parseNum(x.contrato&&x.contrato.total)||0),0).toFixed(2);

// Cotitulares que aún no tienen ficha de cliente: ya mandaron sus datos por el
// portal, así que darles de alta es rellenar lo que ya está escrito.
const cotitularesSinFicha=(contratos,clientes)=>{
  const hay=(Array.isArray(clientes)?clientes:[]).filter(c=>c&&c.activa!==false);
  const yaNif=new Set(hay.map(c=>normNif(c.cif||c.nif||'')).filter(Boolean));
  const yaNom=new Set(hay.map(c=>normProvNombre(c.nombre||'')).filter(Boolean));
  const vistos=new Set(); const out=[];
  (Array.isArray(contratos)?contratos:[]).forEach(c=>{
    (Array.isArray(c&&c.titulares)?c.titulares:[]).forEach(t=>{
      if(!t||!String(t.nombre||'').trim())return;
      const n=normNif(t.dni||t.nif||''), m=normProvNombre(t.nombre||'');
      if((n&&yaNif.has(n))||(!n&&m&&yaNom.has(m)))return;
      const k=n||m;
      if(!k||vistos.has(k))return;
      vistos.add(k);
      out.push({...t, _contrato:c.numero||'', _obra:c.obra||''});
    });
  });
  return out;
};
export {PLAZOS,mesesDesde,ultimoUsoCliente,CESION_CAMPOS,cesionVigente,clientesCedibles,filaCesion,titularesContrato,nombresTitulares,PLAZO_RESPUESTA_DIAS,diasParaResponder,planSupresion,claveExpediente,expedienteNotaria,contratosDeCliente,importeContratos,cotitularesSinFicha};
