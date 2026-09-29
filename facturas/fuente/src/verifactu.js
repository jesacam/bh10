// ═══ VERI*FACTU · registros, cadena de huellas, XML, semáforo y envíos ═══
const txtSeguro=(s)=>{if(s==null)return '';if(typeof s==='object')return '';const t=String(s);return t;};

const daysTo=(d)=>{if(!d||typeof d!=='string')return null;const n=Math.ceil((new Date(d+'T12:00')-new Date())/86400000);return Number.isFinite(n)?n:null;};

const xe=(s)=>txtSeguro(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');

// Acepta tanto el formato nuevo (lista) como el antiguo (base + base2)
const normDesglose=(inv)=>{
  if(!inv)return [];
  // Las líneas pueden venir del lector con huecos: se descartan sin reventar
  if(Array.isArray(inv.desglose)&&inv.desglose.length)
    return inv.desglose.filter(l=>l&&typeof l==='object')
      .map(l=>({base:+l.base||0,tipo:+l.tipo||0})).filter(l=>l.base>0||l.tipo>0);
  const l=[];
  const b1=+inv.importeBase||0, b2=+inv.base2||0;
  if(b1)l.push({base:b1,tipo:+inv.tipoIva||0});
  if(b2)l.push({base:b2,tipo:+inv.tipoIva2||0});
  return l;
};

const limpiaTxt=(v)=>{const s=String(v==null?'':v);return (s==='NaN'||s==='undefined'||s==='[object Object]')?'':s;};

import {fmt} from './basicos';
const diasCertVf=()=>daysTo(CERT_VF_CADUCA);

// ═══ DESGLOSE DE IVA DE UNA FACTURA ═══
// Una factura española puede llevar varias bases a tipos distintos (21, 10, 4 y
// exento). La app solo contemplaba dos, y el lector rellenaba una sola: el
// resto del importe se perdía. Aquí el desglose es una lista de la longitud que
// haga falta, y las cuentas se comprueban contra el total impreso.
const TIPOS_IVA=[21,10,4,0];

import {APP_VERSION} from './version';
// ── Propuesta de euríbor consultada ──
// Preguntarle al modelo «cuánto fue el euríbor de julio» a secas devolvería un
// número inventado con toda la seguridad del mundo: no lo sabe. En un dato que
// fija la cuota de un préstamo, eso es mucho peor que no tenerlo. Por eso la
// consulta se hace CON BÚSQUEDA activada, exigiendo la fuente, y lo que vuelve
// es una PROPUESTA que hay que confirmar. Nunca se guarda sola.
// ═══════════════════════════════════════════════════════════════════════════
// VERI*FACTU — REGISTROS DE FACTURACIÓN
// Portado del desarrollo de Cersan y corregido para esta app. El núcleo (la
// cadena que se resume y el encadenamiento) se ha verificado contra el vector
// oficial de la AEAT y coincide; lo que se ha cambiado es todo lo que dependía
// del modelo de datos del otro programa.
// ═══════════════════════════════════════════════════════════════════════════
const VF_LEYENDA='Factura verificable en la sede electrónica de la AEAT';

const VF_COTEJO={
  pruebas:'https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR',
  produccion:'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR',
};

const VF_EVENTOS={
  INICIO_SESION:'Inicio de sesión', FIN_SESION:'Cierre de sesión',
  ANULACION:'Anulación de factura', EXPORTACION:'Exportación de datos',
  RESTAURACION:'Restauración de copia de seguridad',
  CADENA_ROTA:'Detección de incoherencia en la cadena',
  CAMBIO_CONFIG:'Cambio de configuración de facturación',
  ENVIO_AEAT:'Remisión de registros a la AEAT',
};

// Importes: dos decimales con punto. Fechas de factura: dd-mm-aaaa.
const vfImporte=(v)=>{const n=Number(v)||0;return (Math.round(n*100)/100).toFixed(2);};

const vfFecha=(iso)=>{const s=String(iso||'').slice(0,10),[a,m,d]=s.split('-');return (d&&m&&a)?`${d}-${m}-${a}`:s;};

const vfMarcaTemporal=(fecha)=>{
  const d=fecha instanceof Date?fecha:new Date();
  const p=(x)=>String(x).padStart(2,'0');
  const off=-d.getTimezoneOffset(), signo=off>=0?'+':'-', abs=Math.abs(off);
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}${signo}${p(Math.floor(abs/60))}:${p(abs%60)}`;
};

const vfHuella=async(cadena)=>{
  const datos=new TextEncoder().encode(String(cadena));
  const buf=await crypto.subtle.digest('SHA-256',datos);
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
};

// Orden de campos fijado por la AEAT: cambiarlo invalida todas las facturas
const vfCadenaAlta=(r0)=>{const r=r0&&typeof r0==='object'?r0:{};return [
  `IDEmisorFactura=${r.idEmisor||''}`,
  `NumSerieFactura=${r.numSerie||''}`,
  `FechaExpedicionFactura=${r.fechaExpedicion||''}`,
  `TipoFactura=${r.tipoFactura||''}`,
  `CuotaTotal=${vfImporte(r.cuotaTotal)}`,
  `ImporteTotal=${vfImporte(r.importeTotal)}`,
  `Huella=${r.huellaAnterior||''}`,
  `FechaHoraHusoGenRegistro=${r.fechaHoraHusoGenRegistro||''}`,
].join('&');};

const vfCadenaAnulacion=(r0)=>{const r=r0&&typeof r0==='object'?r0:{};return [
  `IDEmisorFacturaAnulada=${r.idEmisor||''}`,
  `NumSerieFacturaAnulada=${r.numSerie||''}`,
  `FechaExpedicionFacturaAnulada=${r.fechaExpedicion||''}`,
  `Huella=${r.huellaAnterior||''}`,
  `FechaHoraHusoGenRegistro=${r.fechaHoraHusoGenRegistro||''}`,
].join('&');};

const vfCadenaDe=(r)=>(r&&r.tipoRegistro==='anulacion')?vfCadenaAnulacion(r):vfCadenaAlta(r);

const vfNif=(s)=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');

// CORREGIDO: el original solo leía dos bases. Aquí se usa el desglose completo,
// que es lo que la app guarda desde v173: una factura con tres tipos de IVA
// perdía una base entera y la huella se calculaba sobre un total incorrecto.
const vfDesglose=(inv)=>{
  const isp=!!(inv&&(inv.isp||inv.sujetoPasivo));
  // No se descartan las bases a cero: una factura sin cargo es una factura, y
  // el registro exige al menos una línea de desglose. Descartarla dejaría el
  // envío sin desglose y la AEAT lo rechazaría.
  return normDesglose(inv).map(l=>({
    impuesto:'01',
    claveRegimen:String((inv&&inv.vfClaveRegimen)||'01'),
    calificacionOperacion:isp?'S2':'S1',
    tipoImpositivo:isp?0:(+l.tipo||0),
    baseImponible:+(+l.base||0).toFixed(2),
    cuotaRepercutida:isp?0:+((+l.base||0)*(+l.tipo||0)/100).toFixed(2),
  }));
};

// CORREGIDO: el original marcaba F2 (simplificada) a cualquier factura sin CIF.
// Una certificación de obra a un particular saldría como simplificada, que solo
// vale por debajo de ciertos importes. Aquí F2 solo si se pide expresamente.
const VF_LIMITE_SIMPLIFICADA=400;

const vfTipoFactura=(inv)=>{
  if(inv&&inv.vfRectificaA)return 'R1';
  return (inv&&inv.vfSimplificada)?'F2':'F1';
};

// Lo que impediría registrar la factura: se comprueba ANTES de crear nada
const vfProblemas=(inv,emisor)=>{
  const p=[];
  const e=emisor||{};
  if(!vfNif(e.nif))p.push('falta el NIF de tu empresa en Ajustes');
  if(!String(e.nombre||'').trim())p.push('falta la razón social de tu empresa');
  if(!vfNif(e.productorNif))p.push('falta el NIF del productor del programa: al desarrollarlo vosotros, sois el productor');
  if(!inv)return p.concat('no hay factura');
  if(!String(inv.numFactura||'').trim())p.push('la factura no tiene número');
  if(!inv.fecha)p.push('la factura no tiene fecha');
  const des=vfDesglose(inv);
  if(!des.length)p.push('la factura no tiene ninguna base imponible');
  des.forEach(l=>{ if(!TIPOS_IVA.includes(+l.tipoImpositivo)&&!(inv.isp&&+l.tipoImpositivo===0))
    p.push(`hay un tipo de IVA que no existe (${l.tipoImpositivo}%)`); });
  const total=+(+inv.total||0).toFixed(2);
  const calc=+des.reduce((s,l)=>s+l.baseImponible+l.cuotaRepercutida,0).toFixed(2);
  const ret=+(+inv.retencion||0).toFixed(2);
  if(Math.abs(calc-ret-total)>0.02)
    p.push(`las cuentas no cuadran: el desglose da ${fmt(calc-ret)} € y la factura pone ${total.toFixed(2)} €`);
  if(!vfNif(inv.proveedorCif)&&!inv.vfSimplificada)
    p.push('falta el NIF del destinatario: sin él solo se puede emitir como factura simplificada');
  if(inv.vfSimplificada&&total>VF_LIMITE_SIMPLIFICADA)
    p.push(`una factura simplificada no puede superar los ${VF_LIMITE_SIMPLIFICADA} €`);
  return p;
};

const vfSistema=(emisor)=>({
  nombreRazon:String((emisor&&emisor.productorNombre)||(emisor&&emisor.nombre)||'').slice(0,120),
  nif:vfNif(emisor&&emisor.productorNif),
  nombreSistema:'FacturaControl', idSistema:'BH', version:String(APP_VERSION||'').replace(/^v/,''),
  numeroInstalacion:String((emisor&&emisor.instalacion)||'1'),
  soloVerifactu:'S', multiOT:'N', indicadorMultiplesOT:'N',
});

const vfCrearRegistroAlta=async({inv,emisor,anterior,ahora})=>{
  const des=vfDesglose(inv);
  const cuotaTotal=+des.reduce((s,l)=>s+l.cuotaRepercutida,0).toFixed(2);
  const importeTotal=+(+inv.total||0).toFixed(2);
  const idEmisor=vfNif(emisor&&emisor.nif);
  const destNif=vfNif(inv.proveedorCif), destNom=String(inv.proveedor||'').slice(0,120);
  const r={
    tipoRegistro:'alta', version:'1.0',
    idEmisor, numSerie:String(inv.numFactura||'').trim(), fechaExpedicion:vfFecha(inv.fecha),
    tipoFactura:vfTipoFactura(inv),
    ...(inv.vfRectificaA?{tipoRectificativa:inv.vfTipoRect==='I'?'I':'S',
      facturasRectificadas:[{idEmisor,numSerie:String(inv.vfRectificaA),fechaExpedicion:vfFecha(inv.vfRectificaFecha||inv.fecha)}],
      ...(inv.vfTipoRect==='S'?{importeRectificacion:{baseRectificada:+(+inv.vfBaseOriginal||0).toFixed(2),cuotaRectificada:+(+inv.vfCuotaOriginal||0).toFixed(2)}}:{})}:{}),
    descripcion:String(inv.concepto||'Entrega de bienes o prestación de servicios').slice(0,500),
    nombreRazonEmisor:String((emisor&&emisor.nombre)||'').slice(0,120),
    destinatarios:(destNif&&destNom)?[{nif:destNif,nombre:destNom}]:[],
    desglose:des, cuotaTotal, importeTotal,
    sistemaInformatico:vfSistema(emisor),
    fechaHoraHusoGenRegistro:vfMarcaTemporal(ahora),
    tipoHuella:'01',
    huellaAnterior:anterior?anterior.huella:'',
    encadenamiento:anterior
      ?{registroAnterior:{idEmisor:anterior.idEmisor,numSerie:anterior.numSerie,fechaExpedicion:anterior.fechaExpedicion,huella:anterior.huella}}
      :{primerRegistro:'S'},
    facturaId:inv.id||'',
  };
  r.cadena=vfCadenaAlta(r);
  r.huella=await vfHuella(r.cadena);
  return r;
};

const vfCrearRegistroAnulacion=async({registroAnulado,anterior,emisor,ahora,motivo})=>{
  if(!registroAnulado||!registroAnulado.numSerie)throw new Error('No se puede anular una factura que no está registrada');
  const r={
    tipoRegistro:'anulacion', version:'1.0',
    idEmisor:registroAnulado.idEmisor, numSerie:registroAnulado.numSerie,
    fechaExpedicion:registroAnulado.fechaExpedicion,
    sinRegistroPrevio:'N',
    sistemaInformatico:vfSistema(emisor),
    fechaHoraHusoGenRegistro:vfMarcaTemporal(ahora),
    tipoHuella:'01',
    huellaAnterior:anterior?anterior.huella:'',
    encadenamiento:anterior
      ?{registroAnterior:{idEmisor:anterior.idEmisor,numSerie:anterior.numSerie,fechaExpedicion:anterior.fechaExpedicion,huella:anterior.huella}}
      :{primerRegistro:'S'},
    facturaId:registroAnulado.facturaId||'', motivo:String(motivo||'').slice(0,500),
  };
  r.cadena=vfCadenaAnulacion(r);
  r.huella=await vfHuella(r.cadena);
  return r;
};

// Repasa la cadena entera: detecta tanto un eslabón que no enlaza como un
// registro cuyos datos se hayan tocado después de firmarlos.
const vfVerificarCadena=async(registros)=>{
  const l=Array.isArray(registros)?registros:[];
  const rotos=[];
  for(let i=0;i<l.length;i++){
    const r=l[i], ant=i>0?l[i-1]:null, esperada=ant?ant.huella:'';
    if((r.huellaAnterior||'')!==esperada){rotos.push({i,numSerie:r.numSerie,motivo:'no enlaza con el registro anterior'});continue;}
    const recalculada=await vfHuella(vfCadenaDe(r));
    if(recalculada!==r.huella)rotos.push({i,numSerie:r.numSerie,motivo:'los datos no cuadran con la huella'});
  }
  return {total:l.length,rotos,intacta:rotos.length===0};
};

// El QR se genera al registrar la factura y se guarda con ella. No entra en la
// huella (que se calcula sobre campos concretos), así que añadirlo no altera
// nada de lo firmado.
// v360 · el módulo qrcode se carga UNA vez y se guarda: así la matriz del
// QR se puede pedir en síncrono desde el escritor de PDF (que no puede
// esperar: en iOS el «compartir» tiene que salir en el mismo toque).
let _QR=null;
const vfCargarQR=()=>_QR?Promise.resolve(_QR):import('qrcode').then(m=>{_QR=m.default||m;return _QR;}).catch(e=>{console.error('No se ha podido cargar el generador de QR:',e);return null;});
// Matriz de módulos (filas de booleanos) o null si el módulo aún no está
const vfQrModulos=(texto)=>{
  if(!_QR||!_QR.create)return null;
  try{
    const d=_QR.create(String(texto),{errorCorrectionLevel:'M'});
    const n=d.modules.size;const filas=[];
    for(let r=0;r<n;r++){const f=[];for(let c=0;c<n;c++)f.push(!!d.modules.get(r,c));filas.push(f);}
    return filas;
  }catch(e){return null;}
};
// Lo que el PDF necesita para pintar el sello: mismo contenido que el bloque HTML
const vfDatosPdf=(reg,entorno,detalle)=>{
  if(!reg||!reg.numSerie)return null;
  const completo=detalle==='completo';
  const url=vfUrlCotejo(reg,entorno);
  return {
    leyenda:VF_LEYENDA,
    csv:reg.csv?String(reg.csv):'',
    estado:reg.csv?(reg.enviadoEn?'comunicada el '+String(reg.enviadoEn).slice(0,10).split('-').reverse().join('/'):''):'Pendiente de comunicar a la AEAT en el momento de imprimir',
    huella:completo?String(reg.huella||''):String(reg.huella||'').slice(0,24)+'…',
    url,modulos:vfQrModulos(url),
  };
};

const vfQrDataUrl=async(texto)=>{
  // Con canvas (el navegador): PNG. Sin canvas o si algo falla: SVG vectorial,
  // que además imprime más nítido. Nunca vuelve a devolver cadena vacía.
  const QR=await vfCargarQR();
  if(!QR)return '';
  try{
    return await QR.toDataURL(String(texto),{errorCorrectionLevel:'M',margin:1,width:192});
  }catch(e){
    try{
      const svg=await QR.toString(String(texto),{errorCorrectionLevel:'M',margin:1,width:192,type:'svg'});
      return 'data:image/svg+xml;utf8,'+encodeURIComponent(svg);
    }catch(e2){ console.error('No se ha podido generar el QR:',e2); return ''; }
  }
};

const vfUrlCotejo=(r,entorno)=>{
  if(!r||typeof r!=='object')return '';
  const base=VF_COTEJO[entorno]||VF_COTEJO.pruebas;
  return base+'?'+[
    'nif='+encodeURIComponent(String(r.idEmisor||'')),
    'numserie='+encodeURIComponent(String(r.numSerie||'')),
    'fecha='+encodeURIComponent(String(r.fechaExpedicion||'')),
    'importe='+encodeURIComponent(vfImporte(r.importeTotal)),
  ].join('&');
};

// ── BLOQUE DE VERIFICACIÓN QUE VA IMPRESO EN LA FACTURA ──
// El QR y la leyenda son obligatorios. La huella y el CSV no lo son, pero son
// útiles para vuestro archivo y para una inspección: la huella prueba sobre qué
// datos se calculó el registro y el CSV prueba que se comunicó.
// Ojo: el CSV solo existe DESPUÉS de que la AEAT acepte el envío, así que en el
// documento generado al emitir todavía no aparece; sí al volver a generarlo.
const vfBloqueFactura=(reg,entorno,detalle)=>{
  if(!reg||!reg.numSerie)return '';
  const completo=detalle==='completo';
  const esc=(s)=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const url=vfUrlCotejo(reg,entorno);
  const t=[];
  t.push(`<span style="font-weight:700;letter-spacing:.4px">VERI*FACTU</span> · ${esc(VF_LEYENDA)}`);
  if(reg.csv){
    t.push(`CSV: <b>${esc(reg.csv)}</b>${reg.enviadoEn?' · comunicada el '+esc(String(reg.enviadoEn).slice(0,10).split('-').reverse().join('/')):''}`);
  }else{
    t.push('Pendiente de comunicar a la AEAT en el momento de imprimir');
  }
  t.push(`Huella: <span style="font-family:monospace">${esc(completo?(reg.huella||''):String(reg.huella||'').slice(0,24)+'…')}</span>`);
  t.push(`<span style="color:#999">${esc(url)}</span>`);
  return `<div class="vf-pie" style="margin-top:10px;padding-top:7px;border-top:1px solid #e2e2e2;display:flex;gap:9px;align-items:center;page-break-inside:avoid">
    <div style="flex-shrink:0">${reg.qrPng?`<img src="${reg.qrPng}" width="62" height="62" alt="Código QR de verificación"/>`:`<div style="width:62px;height:62px;border:1px solid #ccc;font-size:6px;display:flex;align-items:center;justify-content:center;text-align:center">QR de cotejo</div>`}</div>
    <div style="font-size:7px;color:#666;line-height:1.55;word-break:break-all">${t.join('<br/>')}</div>
  </div>`;
};

const vfCrearEvento=(tipo,detalle,ctx)=>({
  tipo:limpiaTxt(tipo), descripcion:VF_EVENTOS[tipo]||limpiaTxt(tipo),
  detalle:limpiaTxt(detalle).slice(0,300),
  fechaHoraHusoGenRegistro:vfMarcaTemporal(),
  usuario:String((ctx&&ctx.usuario)||''), empresa:String((ctx&&ctx.empresa)||''),
  sistema:'FacturaControl '+String(APP_VERSION||''),
});

// ── ENVÍO A LA AEAT ──
// El sobre SOAP se construye AQUÍ, donde se puede probar. La pasarela del
// servidor solo le añade el certificado y lo reenvía: así, cuando la AEAT
// cambie algo del formato, se toca la app y no hay que subir nada al servidor.
const VF_NS={
  soap:'http://schemas.xmlsoap.org/soap/envelope/',
  sum :'https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroLR.xsd',
  sum1:'https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroInformacion.xsd',
};

const vfXmlEncadenamiento=(r)=>{
  const e=(r&&r.encadenamiento)||{};
  const a=e.registroAnterior;
  if(!a||!a.huella)return '<sum1:Encadenamiento><sum1:PrimerRegistro>S</sum1:PrimerRegistro></sum1:Encadenamiento>';
  return `<sum1:Encadenamiento><sum1:RegistroAnterior><sum1:IDEmisorFactura>${xe(a.idEmisor)}</sum1:IDEmisorFactura><sum1:NumSerieFactura>${xe(a.numSerie)}</sum1:NumSerieFactura><sum1:FechaExpedicionFactura>${xe(a.fechaExpedicion)}</sum1:FechaExpedicionFactura><sum1:Huella>${xe(a.huella)}</sum1:Huella></sum1:RegistroAnterior></sum1:Encadenamiento>`;
};

const vfXmlRegistroAlta=(r0)=>{
  const r=r0&&typeof r0==='object'?r0:{};
  const t=[];
  t.push('<sum1:RegistroAlta>');
  t.push('<sum1:IDVersion>1.0</sum1:IDVersion>');
  t.push(`<sum1:IDFactura><sum1:IDEmisorFactura>${xe(r.idEmisor)}</sum1:IDEmisorFactura><sum1:NumSerieFactura>${xe(r.numSerie)}</sum1:NumSerieFactura><sum1:FechaExpedicionFactura>${xe(r.fechaExpedicion)}</sum1:FechaExpedicionFactura></sum1:IDFactura>`);
  t.push(`<sum1:NombreRazonEmisor>${xe(r.nombreRazonEmisor)}</sum1:NombreRazonEmisor>`);
  t.push(`<sum1:TipoFactura>${xe(r.tipoFactura)}</sum1:TipoFactura>`);
  if(r.tipoRectificativa){
    t.push(`<sum1:TipoRectificativa>${xe(r.tipoRectificativa)}</sum1:TipoRectificativa>`);
    (Array.isArray(r.facturasRectificadas)?r.facturasRectificadas:[]).filter(f=>f&&typeof f==='object').forEach(f=>t.push(`<sum1:FacturasRectificadas><sum1:IDFacturaRectificada><sum1:IDEmisorFactura>${xe(f.idEmisor)}</sum1:IDEmisorFactura><sum1:NumSerieFactura>${xe(f.numSerie)}</sum1:NumSerieFactura><sum1:FechaExpedicionFactura>${xe(f.fechaExpedicion)}</sum1:FechaExpedicionFactura></sum1:IDFacturaRectificada></sum1:FacturasRectificadas>`));
    if(r.importeRectificacion)t.push(`<sum1:ImporteRectificacion><sum1:BaseRectificada>${vfImporte(r.importeRectificacion.baseRectificada)}</sum1:BaseRectificada><sum1:CuotaRectificada>${vfImporte(r.importeRectificacion.cuotaRectificada)}</sum1:CuotaRectificada></sum1:ImporteRectificacion>`);
  }
  t.push(`<sum1:DescripcionOperacion>${xe(r.descripcion)}</sum1:DescripcionOperacion>`);
  (Array.isArray(r.destinatarios)?r.destinatarios:[]).filter(d=>d&&typeof d==='object').forEach(d=>t.push(`<sum1:Destinatarios><sum1:IDDestinatario><sum1:NombreRazon>${xe(d.nombre)}</sum1:NombreRazon><sum1:NIF>${xe(d.nif)}</sum1:NIF></sum1:IDDestinatario></sum1:Destinatarios>`));
  t.push('<sum1:Desglose>');
  (Array.isArray(r.desglose)?r.desglose:[]).filter(l=>l&&typeof l==='object').forEach(l=>{
    t.push('<sum1:DetalleDesglose>');
    t.push(`<sum1:Impuesto>${xe(l.impuesto||'01')}</sum1:Impuesto>`);
    t.push(`<sum1:ClaveRegimen>${xe(l.claveRegimen||'01')}</sum1:ClaveRegimen>`);
    t.push(`<sum1:CalificacionOperacion>${xe(l.calificacionOperacion)}</sum1:CalificacionOperacion>`);
    t.push(`<sum1:TipoImpositivo>${vfImporte(l.tipoImpositivo)}</sum1:TipoImpositivo>`);
    t.push(`<sum1:BaseImponibleOimporteNoSujeto>${vfImporte(l.baseImponible)}</sum1:BaseImponibleOimporteNoSujeto>`);
    t.push(`<sum1:CuotaRepercutida>${vfImporte(l.cuotaRepercutida)}</sum1:CuotaRepercutida>`);
    t.push('</sum1:DetalleDesglose>');
  });
  t.push('</sum1:Desglose>');
  t.push(`<sum1:CuotaTotal>${vfImporte(r.cuotaTotal)}</sum1:CuotaTotal>`);
  t.push(`<sum1:ImporteTotal>${vfImporte(r.importeTotal)}</sum1:ImporteTotal>`);
  const s=r.sistemaInformatico||{};
  t.push(vfXmlEncadenamiento(r));
  t.push(`<sum1:SistemaInformatico><sum1:NombreRazon>${xe(s.nombreRazon)}</sum1:NombreRazon><sum1:NIF>${xe(s.nif)}</sum1:NIF><sum1:NombreSistemaInformatico>${xe(s.nombreSistema)}</sum1:NombreSistemaInformatico><sum1:IdSistemaInformatico>${xe(s.idSistema)}</sum1:IdSistemaInformatico><sum1:Version>${xe(s.version)}</sum1:Version><sum1:NumeroInstalacion>${xe(s.numeroInstalacion)}</sum1:NumeroInstalacion><sum1:TipoUsoPosibleSoloVerifactu>${xe(s.soloVerifactu)}</sum1:TipoUsoPosibleSoloVerifactu><sum1:TipoUsoPosibleMultiOT>${xe(s.multiOT)}</sum1:TipoUsoPosibleMultiOT><sum1:IndicadorMultiplesOT>${xe(s.indicadorMultiplesOT)}</sum1:IndicadorMultiplesOT></sum1:SistemaInformatico>`);
  t.push(`<sum1:FechaHoraHusoGenRegistro>${xe(r.fechaHoraHusoGenRegistro)}</sum1:FechaHoraHusoGenRegistro>`);
  t.push(`<sum1:TipoHuella>${xe(r.tipoHuella||'01')}</sum1:TipoHuella>`);
  t.push(`<sum1:Huella>${xe(r.huella)}</sum1:Huella>`);
  t.push('</sum1:RegistroAlta>');
  return t.join('');
};

const vfXmlRegistroAnulacion=(r0)=>{
  const r=r0&&typeof r0==='object'?r0:{};
  const s=r.sistemaInformatico||{};
  return '<sum1:RegistroAnulacion>'+
    '<sum1:IDVersion>1.0</sum1:IDVersion>'+
    `<sum1:IDFactura><sum1:IDEmisorFacturaAnulada>${xe(r.idEmisor)}</sum1:IDEmisorFacturaAnulada><sum1:NumSerieFacturaAnulada>${xe(r.numSerie)}</sum1:NumSerieFacturaAnulada><sum1:FechaExpedicionFacturaAnulada>${xe(r.fechaExpedicion)}</sum1:FechaExpedicionFacturaAnulada></sum1:IDFactura>`+
    `<sum1:SinRegistroPrevio>${xe(r.sinRegistroPrevio==='S'?'S':'N')}</sum1:SinRegistroPrevio>`+
    vfXmlEncadenamiento(r)+
    `<sum1:SistemaInformatico><sum1:NombreRazon>${xe(s.nombreRazon)}</sum1:NombreRazon><sum1:NIF>${xe(s.nif)}</sum1:NIF><sum1:NombreSistemaInformatico>${xe(s.nombreSistema)}</sum1:NombreSistemaInformatico><sum1:IdSistemaInformatico>${xe(s.idSistema)}</sum1:IdSistemaInformatico><sum1:Version>${xe(s.version)}</sum1:Version><sum1:NumeroInstalacion>${xe(s.numeroInstalacion)}</sum1:NumeroInstalacion><sum1:TipoUsoPosibleSoloVerifactu>${xe(s.soloVerifactu)}</sum1:TipoUsoPosibleSoloVerifactu><sum1:TipoUsoPosibleMultiOT>${xe(s.multiOT)}</sum1:TipoUsoPosibleMultiOT><sum1:IndicadorMultiplesOT>${xe(s.indicadorMultiplesOT)}</sum1:IndicadorMultiplesOT></sum1:SistemaInformatico>`+
    `<sum1:FechaHoraHusoGenRegistro>${xe(r.fechaHoraHusoGenRegistro)}</sum1:FechaHoraHusoGenRegistro>`+
    `<sum1:TipoHuella>${xe(r.tipoHuella||'01')}</sum1:TipoHuella>`+
    `<sum1:Huella>${xe(r.huella)}</sum1:Huella>`+
    '</sum1:RegistroAnulacion>';
};

// La AEAT admite hasta 1.000 registros por envío
const VF_MAX_LOTE=1000;

const vfSobreSoap=(registros,emisor)=>{
  const l=(Array.isArray(registros)?registros:[]).filter(r=>r&&r.numSerie).slice(0,VF_MAX_LOTE);
  if(!l.length)throw new Error('No hay registros que enviar');
  const cuerpo=l.map(r=>'<sum:RegistroFactura>'+
    (r.tipoRegistro==='anulacion'?vfXmlRegistroAnulacion(r):vfXmlRegistroAlta(r))+
    '</sum:RegistroFactura>').join('');
  return '<?xml version="1.0" encoding="UTF-8"?>'+
    `<soapenv:Envelope xmlns:soapenv="${VF_NS.soap}" xmlns:sum="${VF_NS.sum}" xmlns:sum1="${VF_NS.sum1}">`+
    '<soapenv:Header/><soapenv:Body>'+
    '<sum:RegFactuSistemaFacturacion>'+
    '<sum:Cabecera>'+
    `<sum1:ObligadoEmision><sum1:NombreRazon>${xe((emisor&&emisor.nombre)||'')}</sum1:NombreRazon><sum1:NIF>${xe(vfNif(emisor&&emisor.nif))}</sum1:NIF></sum1:ObligadoEmision>`+
    '</sum:Cabecera>'+
    cuerpo+
    '</sum:RegFactuSistemaFacturacion>'+
    '</soapenv:Body></soapenv:Envelope>';
};

// Lectura de la respuesta: interesa el estado global, el CSV y, sobre todo, el
// error concreto de cada registro rechazado.
const vfLeerRespuesta=(xml)=>{
  const t=String(xml||'');
  const uno=(tag)=>{const m=t.match(new RegExp('<(?:\\w+:)?'+tag+'>([\\s\\S]*?)</(?:\\w+:)?'+tag+'>'));return m?m[1].trim():'';};
  const falla=t.match(/<(?:\w+:)?Fault>[\s\S]*?<faultstring>([\s\S]*?)<\/faultstring>/);
  if(falla)return {ok:false,estado:'ERROR',csv:'',mensaje:falla[1].trim(),lineas:[]};
  const estado=uno('EstadoEnvio')||uno('EstadoRegistro')||'';
  const csv=uno('CSV');
  const lineas=[...t.matchAll(/<(?:\w+:)?RespuestaLinea>([\s\S]*?)<\/(?:\w+:)?RespuestaLinea>/g)].map(m=>{
    const b=m[1];
    const g=(tag)=>{const x=b.match(new RegExp('<(?:\\w+:)?'+tag+'>([\\s\\S]*?)</(?:\\w+:)?'+tag+'>'));return x?x[1].trim():'';};
    return {numSerie:g('NumSerieFactura'),estado:g('EstadoRegistro'),codigo:g('CodigoErrorRegistro'),error:g('DescripcionErrorRegistro')};
  });
  return {
    ok:estado==='Correcto',
    parcial:estado==='ParcialmenteCorrecto',
    estado:estado||'(sin estado)',
    csv, mensaje:'', lineas,
    rechazadas:lineas.filter(x=>x.estado&&x.estado!=='Correcto'),
  };
};

// ── INTERRUPTOR DE VERI*FACTU ──
// Hasta que sea obligatorio, la facturación de siempre funciona y no hay
// motivo para cambiarla. El registro se enciende cuando se quiera y se puede
// apagar, con una regla que no admite excepción: APAGARLO NO BORRA NADA. Los
// registros ya creados se conservan y, al volver a encenderlo, la cadena
// continúa donde se quedó. Si se rompiera, todo lo registrado quedaría
// inservible y no habría forma de rehacerlo.
const VF_CFG_POR_DEFECTO={activo:false,entorno:'pruebas',pasarela:'',token:'',desde:'',apagadoEn:''};

const vfActivo=(cfg)=>!!(cfg&&cfg.activo);

// ¿Hay que registrar esta factura? Solo las emitidas, y solo desde que se
// encendió: las anteriores se expidieron fuera del sistema y no se inventan.
const vfDebeRegistrar=(inv,cfg)=>{
  if(!vfActivo(cfg))return false;
  if(!inv||inv.tipo!=='cobro')return false;      // solo facturas emitidas
  if(inv.tipo==='anticipo')return false;
  if(cfg.desde&&String(inv.fecha||'')<String(cfg.desde))return false;
  return true;
};

// Al encender o apagar se deja constancia, como exige el reglamento
const vfCambiarConfig=(cfg,cambios,hoy)=>{
  const antes=cfg||VF_CFG_POR_DEFECTO;
  const nueva={...antes,...cambios};
  const eventos=[];
  if(!antes.activo&&nueva.activo){
    if(!nueva.desde)nueva.desde=hoy;             // desde cuándo se registra
    nueva.apagadoEn='';
    eventos.push({tipo:'CAMBIO_CONFIG',detalle:`Registro VERI*FACTU activado (entorno ${nueva.entorno||'pruebas'})`});
  }
  if(antes.activo&&!nueva.activo){
    nueva.apagadoEn=hoy;
    eventos.push({tipo:'CAMBIO_CONFIG',detalle:'Registro VERI*FACTU desactivado — los registros existentes se conservan'});
  }
  if(antes.activo&&nueva.activo&&antes.entorno!==nueva.entorno)
    eventos.push({tipo:'CAMBIO_CONFIG',detalle:`Entorno cambiado de ${antes.entorno} a ${nueva.entorno}`});
  return {cfg:nueva,eventos};
};

// Qué falta para poder encenderlo de verdad
const vfListoParaActivar=(cfg,emisor)=>{
  const falta=[];
  const e=emisor||{};
  if(!vfNif(e.nif))falta.push('el NIF de tu empresa');
  if(!String(e.nombre||'').trim())falta.push('la razón social');
  if(!vfNif(e.productorNif))falta.push('el NIF del productor del programa (sois vosotros)');
  if(!String((cfg&&cfg.pasarela)||'').trim())falta.push('la dirección de la pasarela de envío');
  return falta;
};

// ── EXPORTACIÓN DE LOS REGISTROS ──
// El reglamento obliga al productor del programa a ofrecer acceso a los
// registros y un procedimiento de descarga. Y a quien factura, a conservarlos
// aunque deje de usar el programa: por eso conviene exportar a menudo y
// guardarlo aparte. Se exporta en XML (el formato de los propios registros) y
// en texto separado por punto y coma para poder abrirlo en una hoja de cálculo.
const vfExportarXml=(registros,emisor)=>{
  const l=(Array.isArray(registros)?registros:[]).filter(r=>r&&typeof r==='object');
  const cuerpo=l.map(r=>'<RegistroFactura>'+
    (r.tipoRegistro==='anulacion'?vfXmlRegistroAnulacion(r):vfXmlRegistroAlta(r))+
    '</RegistroFactura>').join('\n');
  return '<?xml version="1.0" encoding="UTF-8"?>\n'+
    `<ExportacionRegistrosFacturacion xmlns:sum1="${VF_NS.sum1}">\n`+
    `<Emisor><NombreRazon>${xe((emisor&&emisor.nombre)||'')}</NombreRazon><NIF>${xe(vfNif(emisor&&emisor.nif))}</NIF></Emisor>\n`+
    `<FechaExportacion>${vfMarcaTemporal(new Date())}</FechaExportacion>\n`+
    `<NumeroRegistros>${l.length}</NumeroRegistros>\n`+
    cuerpo+'\n</ExportacionRegistrosFacturacion>';
};

const vfExportarCsv=(registros0)=>{
  const registros=(Array.isArray(registros0)?registros0:[]).filter(r=>r&&typeof r==='object');
  const cab=['Tipo','Nº factura','Fecha expedición','Tipo factura','Base','Cuota','Total','Huella','Huella anterior','Generado','Estado AEAT','CSV','Error'];
  const esc=(v)=>{const s=String(v==null?'':v);return /[;"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
  const filas=(registros||[]).map(r=>[
    r.tipoRegistro==='anulacion'?'Anulación':'Alta',
    r.numSerie, r.fechaExpedicion, r.tipoFactura||'',
    r.desglose?(+r.desglose.reduce((s,d)=>s+d.baseImponible,0)).toFixed(2):'',
    r.cuotaTotal!==undefined?vfImporte(r.cuotaTotal):'',
    r.importeTotal!==undefined?vfImporte(r.importeTotal):'',
    r.huella, r.huellaAnterior||'(primero)', r.fechaHoraHusoGenRegistro,
    VF_ESTADOS[r.estadoAEAT]||'Sin enviar', r.csv||'', r.errorAEAT||'',
  ].map(esc).join(';'));
  return '\ufeff'+[cab.join(';'),...filas].join('\r\n');
};

// ── SEMÁFORO DE CADA FACTURA ──
// El CSV identifica el ENVÍO, no la factura: si en un sobre van una factura y
// su anulación, las dos llevan el mismo CSV. Por eso el cotejo en la AEAT no se
// hace con el CSV sino con los cuatro datos de la factura, que es lo que lleva
// el QR: NIF del emisor, número, fecha de expedición e importe.
const VF_LUCES={
  sin:      {luz:'⚪', texto:'Sin registrar',          ayuda:'Esta factura no entró en VERI*FACTU: se emitió antes de activarlo, o el registro está apagado.'},
  pendiente:{luz:'🟡', texto:'Pendiente de enviar',    ayuda:'Registrada y encadenada, pero todavía no comunicada a la AEAT.'},
  aceptada: {luz:'🟢', texto:'Aceptada por la AEAT',   ayuda:'Comunicada y admitida. Puedes cotejarla en la sede.'},
  rechazada:{luz:'🔴', texto:'Rechazada por la AEAT',  ayuda:'La AEAT no la ha admitido. Corrige lo que indica el motivo y vuelve a enviarla.'},
  error:    {luz:'🟠', texto:'No se pudo enviar',      ayuda:'El envío falló antes de llegar o sin respuesta clara. Se reintenta en el próximo envío.'},
  anulada:  {luz:'⚫', texto:'Anulada',                ayuda:'Su registro se retiró de la AEAT mediante una anulación.'},
};

const vfSemaforo=(inv,registros)=>{
  const l=(Array.isArray(registros)?registros:[]).filter(r=>r&&typeof r==='object');
  const alta=l.find(r=>r.tipoRegistro==='alta'&&r.facturaId===(inv&&inv.id));
  if(!alta)return {estado:'sin',...VF_LUCES.sin,reg:null,anulada:false};
  const anulada=l.some(r=>r.tipoRegistro==='anulacion'&&r.numSerie===alta.numSerie&&r.estadoAEAT==='aceptado');
  if(anulada)return {estado:'anulada',...VF_LUCES.anulada,reg:alta,anulada:true};
  const e=alta.estadoAEAT;
  const clave=e==='aceptado'?'aceptada':e==='rechazado'?'rechazada':e==='error'?'error':'pendiente';
  return {estado:clave,...VF_LUCES[clave],reg:alta,anulada:false,
    csv:alta.csv||'', motivo:alta.errorAEAT||'', huella:alta.huella||'', enviadoEn:alta.enviadoEn||''};
};

// Dirección de cotejo a partir de la propia factura, sin depender del registro
const vfUrlCotejoFactura=(inv,emisor,entorno)=>{
  if(!inv)return '';
  const base=VF_COTEJO[entorno]||VF_COTEJO.pruebas;
  const p=[
    'nif='+encodeURIComponent(vfNif(emisor&&emisor.nif)),
    'numserie='+encodeURIComponent(String(inv.numFactura||'')),
    'fecha='+encodeURIComponent(vfFecha(inv.fecha)),
    'importe='+encodeURIComponent(vfImporte(inv.total)),
  ];
  return base+'?'+p.join('&');
};

// ── ESTADO DE ENVÍO DE CADA REGISTRO ──
// La app NUNCA maneja el certificado: solo guarda a dónde enviar. Si algún día
// aparece por aquí material de certificado, la batería que audita el código falla.
const VF_ESTADOS={pendiente:'Pendiente de enviar',aceptado:'Aceptada por la AEAT',
  rechazado:'Rechazada por la AEAT',error:'No se pudo enviar'};

const vfPendientes=(registros)=>(Array.isArray(registros)?registros:[]).filter(r=>r&&r.estadoAEAT!=='aceptado');

// Una factura aceptada NO se reenvía: mandarla dos veces la duplicaría en la AEAT
const vfLoteAEnviar=(registros,maximo)=>vfPendientes(registros).slice(0,Math.max(1,+maximo||VF_MAX_LOTE));

const vfAplicarRespuesta=(registros,resp,enviados)=>{
  const l=Array.isArray(registros)?registros.slice():[];
  const lote=(Array.isArray(enviados)?enviados:[]).filter(r=>r&&r.huella);
  // Se identifica cada registro por su HUELLA, que es única. Antes se usaba el
  // número de factura, y una anulación lleva el MISMO número que su factura:
  // enviar solo la anulación marcaba también el alta, que quedaba «fallida» y
  // volvía a la cola. Resultado: se reenviaba a la AEAT una factura ya
  // registrada, que la rechazaba por duplicada.
  const enviadas=new Set(lote.map(r=>r.huella));
  // La AEAT responde una línea por registro y en el mismo orden en que se
  // mandaron: emparejar por posición evita la ambigüedad del número repetido.
  const lineas=((resp&&resp.lineas)||[]);
  const porHuella={};
  lote.forEach((r,ix)=>{
    const porPosicion=lineas[ix];
    if(porPosicion&&(!porPosicion.numSerie||porPosicion.numSerie===r.numSerie)){porHuella[r.huella]=porPosicion;return;}
    const misma=lineas.filter(x=>x&&x.numSerie===r.numSerie);
    if(misma.length===1)porHuella[r.huella]=misma[0];
  });
  return l.map(r=>{
    if(!r||!r.huella||!enviadas.has(r.huella))return r;
    const linea=porHuella[r.huella];
    // Si la AEAT no dice nada de ese registro, manda el estado global del envío
    if(!linea){
      if(resp&&resp.ok)return {...r,estadoAEAT:'aceptado',csv:resp.csv||'',errorAEAT:'',enviadoEn:resp.cuando||''};
      return {...r,estadoAEAT:'error',errorAEAT:(resp&&resp.mensaje)||'la AEAT no confirmó este registro'};
    }
    if(linea.estado==='Correcto'||linea.estado==='AceptadoConErrores')
      return {...r,estadoAEAT:'aceptado',csv:resp.csv||'',errorAEAT:linea.error||'',enviadoEn:resp.cuando||''};
    return {...r,estadoAEAT:'rechazado',errorAEAT:`${linea.codigo?linea.codigo+': ':''}${linea.error||'rechazado sin motivo indicado'}`};
  });
};

const vfResumenEnvio=(registros)=>{
  const l=(Array.isArray(registros)?registros:[]).filter(r=>r&&typeof r==='object');
  const cuenta=(e)=>l.filter(r=>r&&r.estadoAEAT===e).length;
  return {total:l.length,aceptados:cuenta('aceptado'),rechazados:cuenta('rechazado'),
    conError:cuenta('error'),pendientes:l.filter(r=>r&&!r.estadoAEAT).length+cuenta('pendiente')};
};

// ═══ EL CERTIFICADO DE LA AEAT TIENE FECHA DE CADUCIDAD ═══
// Caduca seis semanas DESPUÉS de que empiece la obligación de VERI*FACTU: si
// se pasa, los envíos fallan de un día para otro. La app avisa con dos meses.
const CERT_VF_CADUCA='2027-02-14';

const avisoCertVf=()=>{
  const d=diasCertVf();
  if(d===null||d>60)return null;
  if(d<0)return {nivel:'dn',txt:'⛔ El certificado de la AEAT CADUCÓ hace '+(-d)+' días: los envíos VERI*FACTU están fallando. Renuévalo y reejecuta el instalador de la pasarela.'};
  return {nivel:d<=21?'dn':'wn',txt:'⚠️ El certificado de la AEAT caduca en '+d+' días ('+CERT_VF_CADUCA.split('-').reverse().join('/')+'). Renuévalo en la entidad emisora y reejecuta el instalador de la pasarela con la opción N.'};
};
// v348 · plan de reintentos tras un fallo de red con la pasarela: la norma
// da 240 segundos para la remisión. Esperas de 30, 60 y 120 s (210 acumulados,
// dentro de la ventana); a la cuarta se desiste y el registro queda pendiente
// para el siguiente envío manual o automático.
const VF_REINTENTOS=[30,60,120];
const vfPlanReintento=(intento)=>intento>=0&&intento<VF_REINTENTOS.length?VF_REINTENTOS[intento]*1000:null;

export {vfCargarQR,vfQrModulos,vfDatosPdf,VF_REINTENTOS,vfPlanReintento,txtSeguro,daysTo,xe,normDesglose,limpiaTxt,diasCertVf,TIPOS_IVA,VF_LEYENDA,VF_COTEJO,VF_EVENTOS,vfImporte,vfFecha,vfMarcaTemporal,vfHuella,vfCadenaAlta,vfCadenaAnulacion,vfCadenaDe,vfNif,vfDesglose,VF_LIMITE_SIMPLIFICADA,vfTipoFactura,vfProblemas,vfSistema,vfCrearRegistroAlta,vfCrearRegistroAnulacion,vfVerificarCadena,vfQrDataUrl,vfUrlCotejo,vfBloqueFactura,vfCrearEvento,VF_NS,vfXmlEncadenamiento,vfXmlRegistroAlta,vfXmlRegistroAnulacion,VF_MAX_LOTE,vfSobreSoap,vfLeerRespuesta,VF_CFG_POR_DEFECTO,vfActivo,vfDebeRegistrar,vfCambiarConfig,vfListoParaActivar,vfExportarXml,vfExportarCsv,VF_LUCES,vfSemaforo,vfUrlCotejoFactura,VF_ESTADOS,vfPendientes,vfLoteAEnviar,vfAplicarRespuesta,vfResumenEnvio,CERT_VF_CADUCA,avisoCertVf};
