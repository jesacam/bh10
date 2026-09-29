import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import * as XLSX from "xlsx";
import {APP_VERSION} from './version';
import {describirDispositivo,dispositivoLargo} from './dispositivo.js';
import {avisosLectura,saneaLectura,giroValido} from './lectura.js';
import {TEMAS,temaPorId,PALETA_OSCURA,PALETA_CLARA,C,buildS,S,aplicarTema,CAPAS} from './estetica';
import {fmt,fmtK,uid,fechaRegistroDe,fmtDate,parseNum} from './basicos';
import {abonosDe,indiceAnticipos,importeAbonado,getAnticiposAplicados,getTotalPagado,esAnulada,esGastoFiscal,esDeudaProveedor,esAbono,getSaldo,getEstado} from './saldos';
import {GRUPOS_AJ,ApartadoAj,ConfigAj,identificarAj} from './ajustes';
import {estadoRetencion,resumenRetenciones,textoReclamacion} from './retenciones';
import {ModalTraspasos,ModalTraspasoNuevo,ModalFichaProveedor,ModalSepaNominas,ModalSepaC34,ModalRepartoNominas,ModalLoteEscaneo,ModalFicheroBanca,ModalExtractosN43,ModalVehiculo,ModalPoliza,ModalObra,ModalEmpleado,ModalConfirmarBorrado,ModalFormFactura,ModalPagoFactura,ModalSesionCerrada,ModalRecurrentesExtracto,ModalCompradores,ModalErratasComprador,ModalAprenderExtracto,ModalEnvioSinResumen,ModalConectarGmail,ModalCorreosGmail,ModalEmbargosSueldo,ModalCertificar,ModalNuevoPresupuesto,ModalOperacionFinanciera,ModalCustodiaDatos,ModalAvisoConfidencial,ModalDatosClientes,ModalMovilesCorreos,ModalListadoFinancieras,ModalFichaCliente,ModalComparacionCapas,ModalAnularVf,ModalPresupuestosObra,ModalDocVenta,ModalDniVivienda,ModalEnlace,ModalBuzon} from './modales';
import {previsionTesoreria} from './tesoreria';
import {seqSerie,siguienteSerie,normNumDoc,REC,esCopiaV9,resumenCopiaV9,imitaNumero} from './copias';
import {textoDeResumen,sanitizaResumen,PRECIOS_IA,costeEstimado,usoDeRespuesta,sumaUso} from './ia';
import {crearGuardadoDiferido,AREAS_HIST,describirArea,describirCambio} from './historial';
import {DRAFT_C,DRAFT_F,empActiva,dkey,guardarDraft,leerDraft,borrarDraft,draftUtil} from './borradores';
import {pctLineasCert,lineasCertificacion,COSTE_SS_EMPRESA,costeEmpresaDe,mezclaMesNominas,inferISP,hallarProforma} from './certificaciones';

import {ESTADOS_EXTRA,PRUEBAS_EXTRA,extrasDeContrato,facturasDeExtra,parteExtra,estaPartida,costeExtra,precioExtra,extraPorProveedor,resumenExtras,baseFactura,mismaObra,facturasYaExtra,candidatasExtra,extrasSinAsignar,parteYaExtra,proveedoresDeExtras,extraDeFactura} from './extras';
import {RAMOS,PERIODOS,claveRiesgo,riesgosDuplicados,primaAnual,pagosSeguros,diasAVencer,ORDENES,filtrarPolizas,ordenarPolizas,cuentaPolizas,vehiculosACopiar,polizaDeVehiculo,leerFilasPolizas,migrarSegurosDeFlota} from './polizas';
import {tokensProv,vacio,today,provParecido,normTxtDup,levDist,_descartes,descartesDeCarga,cuentaDesconocida,extraeDominio,mejorRemitente,dominioSospechoso,CAMPOS_FICHA,compararFichas,fusionar,esDupFuerte,hallarDuplicada,sugerirFusiones,parecidoNombre,leerContactos,cambiosContacto,proponerProveedor} from './fichas';
import {PLAZOS,mesesDesde,ultimoUsoCliente,CESION_CAMPOS,cesionVigente,clientesCedibles,filaCesion,titularesContrato,nombresTitulares,PLAZO_RESPUESTA_DIAS,diasParaResponder,planSupresion,claveExpediente,expedienteNotaria,contratosDeCliente,importeContratos,cotitularesSinFicha} from './rgpd';
import {provEnTexto,normNumFra,parseN43,conciliaN43,ajustaFechasN43,limpiaSepa,problemaBic,problemaFechaEjec,revisarRemesa} from './bancos';
import {normLineas,mapearLectura,calcDesglose,cuadraFactura,repararDesglose} from './desglose';
import {lineasPromoPdf,filasPromoExcel,fusionaPromo,agrupaPromo} from './promociones';
import {fusionaCliente,normalizaMayusculas} from './fusiones';
import {resumen303,csv303,basesDe} from './iva303';
import {normTelefonoES,esMovil,AVISO_POR_DEFECTO,construirAviso,enlaceWhatsApp,puedeAvisar} from './avisos';

import {vfCargarQR,vfQrModulos,vfDatosPdf,vfPlanReintento,txtSeguro,daysTo,xe,normDesglose,limpiaTxt,TIPOS_IVA,VF_LEYENDA,VF_COTEJO,VF_EVENTOS,vfImporte,vfFecha,vfMarcaTemporal,vfHuella,vfCadenaAlta,vfCadenaAnulacion,vfCadenaDe,vfNif,vfDesglose,VF_LIMITE_SIMPLIFICADA,vfTipoFactura,vfProblemas,vfSistema,vfCrearRegistroAlta,vfCrearRegistroAnulacion,vfVerificarCadena,vfQrDataUrl,vfUrlCotejo,vfBloqueFactura,vfCrearEvento,VF_NS,vfXmlEncadenamiento,vfXmlRegistroAlta,vfXmlRegistroAnulacion,VF_MAX_LOTE,vfSobreSoap,vfLeerRespuesta,VF_CFG_POR_DEFECTO,vfActivo,vfDebeRegistrar,vfCambiarConfig,vfListoParaActivar,vfExportarXml,vfExportarCsv,VF_LUCES,vfSemaforo,vfUrlCotejoFactura,VF_ESTADOS,vfPendientes,vfLoteAEnviar,vfAplicarRespuesta,vfResumenEnvio,CERT_VF_CADUCA,avisoCertVf} from './verifactu';
import {diasEntre,TIPOS_FIN,finLlevaIva,sumaMeses,euriborAplicable,tipoEnFecha,cuadroFinanciacion,saldoDispuesto,disponibleLinea,interesesPeriodo,validarPropuestaEuribor,revisionesPendientes,cuotaFrancesa} from './financiacion';
import {normProvNombre,DIAS_SEMANA,JORNADA_VACIA,letraDia,horasSemanales,jornadaPrevista,horasDeRegistros,cuadreDia,CODIGOS_PLAN,leerTurno,leerPlanificacion,resumenPlan} from './fichaje';
import {emailValido,tokensNombre,restoIban,puedeEnviarNominaBase,normNif,normNIF,dcCCC,emparejarEmpleado,matchEmpleado,cuadraNomina,repararNomina,embargoSinFicha,normIban,problemaIban,ibanOk,reparaIban,nominaVieja,embargosDe,claveEmb,transferenciasEmbargo,calcEmbargo607,nifIgual,verificarPaginaNomina,prepararEnvioNomina,puedeEnviarNomina} from './embargos';



const CATS = ['Materiales','Mano de obra','Subcontrata','Servicios profesionales','Suministros','Seguros','Alquiler maquinaria','Gastos generales','Otros'];
const FORMAS = ['Transferencia','Domiciliación','Cheque','Efectivo','Tarjeta','Pagaré','Confirming','Préstamo promotor','Pago anticipado'];
const IVAS = [21,10,4,0];
const IVA_LABELS = {21:'21%',10:'10%',4:'4%',0:'0% (Inv. Suj. Pasivo)'};
const IRPFS = [0,1,2,7,15,19];
const TIPOS = [
  {id:'factura',label:'Factura recibida',icon:'📄'},
  {id:'anticipo',label:'Anticipo',icon:'⏩'},
  {id:'cobro',label:'Factura emitida',icon:'💰'},
  {id:'personal',label:'Personal / Nómina',icon:'👷'}
];
const esStandalone=()=>{
  try{
    if(typeof window==='undefined')return false;
    if(window.navigator&&window.navigator.standalone===true)return true;
    return !!(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches);
  }catch(e){return false;}
};


const ES_APP = typeof window!=='undefined' && window.__BH10_STANDALONE===true;
// Desenvuelve la respuesta del lector: admite objeto suelto, array, o {docs:[...]}
const listaLecturas=(p)=>{
  // El lector devuelve una lista, o un objeto con .docs, o una sola factura
  // suelta. Hubo una versión que forzaba la entrada a lista antes de mirar, y
  // eso convertía una factura suelta en «nada reconocible».
  if(Array.isArray(p))return p.filter(x=>x&&typeof x==='object');
  if(!p||typeof p!=='object')return [];
  if(Array.isArray(p.docs))return p.docs.filter(x=>x&&typeof x==='object');
  if(Array.isArray(p.facturas))return p.facturas.filter(x=>x&&typeof x==='object');
  return [p];
};

const listaSegura=(v,clave)=>{
  if(!Array.isArray(v))return [];
  const buenos=v.filter(x=>x&&typeof x==='object'&&!Array.isArray(x));
  // Descartar en silencio un registro estropeado hace que los contadores no
  // cuadren y nadie sepa por qué. Se anota para poder decirlo.
  if(buenos.length!==v.length)_descartes.push({clave:clave||'?',n:v.length-buenos.length,
    ejemplos:v.filter(x=>!(x&&typeof x==='object'&&!Array.isArray(x))).slice(0,3).map(x=>JSON.stringify(x).slice(0,60))});
  return buenos;
};
const objetoSeguro=(v)=>(v&&typeof v==='object'&&!Array.isArray(v))?v:{};
const parseJSONTolerante=(txt)=>{
  // Un número imposible en la respuesta del lector (1e500) se convertiría en
  // infinito y de ahí a un importe. Se acota al leerlo.
  const acota=(v)=>{
    if(typeof v==='number')return Number.isFinite(v)?v:0;
    if(Array.isArray(v))return v.map(acota);
    if(v&&typeof v==='object'){const o={};for(const k in v)o[k]=acota(v[k]);return o;}
    return v;
  };
  const limpio=String(txt||'').replace(/```json|```/g,'').trim();
  try{ return acota(JSON.parse(limpio)); }catch(e){}
  // La respuesta llegó cortada: rescatamos los objetos que sí están completos
  const objs=[]; const pila=[]; let enStr=false, esc=false;
  for(let k=0;k<limpio.length;k++){
    const ch=limpio[k];
    if(esc){esc=false;continue;}
    if(ch==='\\'){esc=true;continue;}
    if(ch==='"'){enStr=!enStr;continue;}
    if(enStr)continue;
    if(ch==='{')pila.push(k);
    else if(ch==='}'){ const ini=pila.pop(); if(ini!==undefined)objs.push(limpio.slice(ini,k+1)); }
  }
  const buenos=[];
  for(const o of objs){ try{ const p=JSON.parse(o); if(p&&typeof p==='object'&&!Array.isArray(p))buenos.push(p); }catch(e){} }
  const utiles=buenos.filter(x=>x.f!==undefined||x.n!==undefined||x.pr!==undefined||x.b!==undefined||x.fecha!==undefined||x.proveedor!==undefined);
  if(utiles.length)return {docs:utiles,_recuperado:true};
  throw new Error('La respuesta del lector llegó incompleta. Prueba con una foto más nítida o menos páginas por documento.');
};











// ═══ PERMISOS POR ÁREA (fase 3 Master) ═══
// El envoltorio deja en window.BH10_PERMISOS los permisos del miembro
// ('' | 'lectura' | 'admin' por área). Si no existe (dueño, o cualquier
// fallo), TODO se comporta exactamente como hasta hoy.
const permisosMiembro=()=>{try{return (typeof window!=='undefined'&&window.BH10_PERMISOS)||null;}catch(e){return null;}};
// v364 · acciones concretas (remesar, pagos, emitir, borrar, exportar, lector, obras): exigen admin en su área y que el dueño no las haya quitado
const puedeAccion=(accion)=>puedeAccionPura(permisosMiembro(),accion);
// v365 · subáreas: la pantalla en la que se está (window.__BH10_SUB, fijada en el render) afina el área
const puedeVerSub=(sub)=>puedeVerSubPura(permisosMiembro(),sub);
const puedeEditarSub=(sub)=>puedeEditarSubPura(permisosMiembro(),sub);
const esMiembro=()=>!!permisosMiembro();
const AREA_DE_VISTA={facturas:'facturas',contratos:'contratos',nominas:'nominas',flota:'seguros',config:'ajustes'};
const puedeVer=(a)=>{const p=permisosMiembro();if(!p||!a)return true;return p[a]==='lectura'||p[a]==='admin';};
const puedeEditar=(a)=>{const p=permisosMiembro();if(!p||!a)return true;return p[a]==='admin';};
const esLector=()=>{try{
  if(typeof window==='undefined')return false;
  if(window.BH10_ROL==='lector')return true;
  const p=window.BH10_PERMISOS;
  if(p){const a=window.__BH10_AREA||'';
    const sub=window.__BH10_SUB||'';                       // v365: la subárea (pantalla) afina el área
    if(sub&&!puedeEditarSubPura(p,sub))return true;
    if(a&&p[a]!=='admin')return true;                    // sin admin en el área que está viendo
    if(!Object.keys(p).some(k=>p[k]==='admin'))return true;} // sin admin en ninguna
  return false;
}catch(e){return false;}};
const nubeConfirmada=()=>{
  try{
    if(typeof window==='undefined'||!window.storage||typeof window.storage.getStatus!=='function')return true; // artefacto: sin nube
    return window.storage.getStatus().fase==='ok';
  }catch(e){return false;}
};
const hayDatos=async(clave)=>{
  try{const r=await window.storage.get(clave);const v=r&&r.value?JSON.parse(r.value):null;return Array.isArray(v)?v.length>0:!!v;}catch(e){return false;}
};
const permitirSiembra=()=>{try{return typeof window==='undefined'||window.__BH10_PERMITIR_SIEMBRA!==false;}catch(e){return true;}};
const DEBUG_LAYOUT=false;
// Identificadores de las tarjetas del Panel, en su orden de fábrica. El usuario
// puede reordenarlas y decidir cuáles ocupan media pantalla o el ancho entero;
// su elección se guarda en la nube (bh10-kpis) y se respeta en cada dispositivo.
const KPI_IDS=[
  'h-pendpago','h-vencido',
  'n-buzon',   // v375 · se coloca como cualquier otra caseta (Jesús: «con capacidad de moverlo como el resto»)
  'n-recibidas','n-emitidas','n-clientes','n-proveedores','n-obras','n-contratos','n-c34prov','n-c34nom','n-personal','n-flota','n-traspasos',
  'balance','facturado','pagado','pendiente','vencido','ingresos','ptecobro','ivasop','ivarep','ivaliq','estructura','anticipos','retgar','diaspago','ejecgasto','ejecventa','yoy'];
// ═══ ANCLAJE INFERIOR ═══
// iOS reserva env(safe-area-inset-bottom) (34 pt) bajo el indicador de inicio.
// Reservarlo entero dejaba una franja muerta enorme bajo la barra de pestañas,
// así que se capa: con 20 px el indicador sigue despejado y se recuperan 14 pt
// de pantalla. ALTO_TAB es la altura real de la barra: todo lo que va "justo
// encima" (avisos, FAB, toast) se ancla a ella y no a un número suelto.
const SAFE_B='var(--bh-safe-b,env(safe-area-inset-bottom))';
// El alto de la barra deja de estar clavado en 47: se puede subir o bajar
// desde Ajustes. Todo lo que se apoya en ella —el botón flotante, los avisos—
// usa la misma medida, así que se recolocan solos.
const TAB_H='var(--bh-tab-h,47px)';
const TAB_OFF='var(--bh-tab-off,0px)';
const BAJAR_MAX=70;
const TAB_MIN=36, TAB_MAX=72, TAB_DEF=47;
const ALTO_TAB=`calc(${TAB_H} + ${SAFE_B})`;
// Lo que flota sobre la barra baja con ella, y el contenido gana lo mismo
const SOBRE_TAB=(px)=>`calc(${TAB_H} + ${SAFE_B} + ${px}px - ${TAB_OFF})`;



 // cotización empresarial aproximada sobre el bruto








const daysBetween = (a,b) => {const n=Math.floor((new Date(b)-new Date(a))/864e5);return Number.isFinite(n)?n:0;};
const pct = (a,b) => {const x=+a,y=+b;if(!Number.isFinite(x)||!Number.isFinite(y)||y<=0)return 0;const p=Math.round(x/y*100);return Number.isFinite(p)?Math.max(0,Math.min(p,100)):0;};




















const calcTotals = (base,tipoIva,irpf,base2=0,tipoIva2=0) => {
  // Todo se fuerza a número finito: un total inválido acabaría cobrándose o pagándose
  const num=(x)=>{const n=parseFloat(x);return Number.isFinite(n)?n:0;};
  const b=num(base), b2=num(base2), t1=num(tipoIva), t2=num(tipoIva2), ir=num(irpf);
  const iv=+((b*t1/100)+(b2*t2/100)).toFixed(2);
  const ret=+(((b+b2)*ir)/100).toFixed(2);
  const tot=b+b2+iv-ret;
  return {iva:Number.isFinite(iv)?iv:0,retencion:Number.isFinite(ret)?ret:0,total:Number.isFinite(tot)?+tot.toFixed(2):0};
};

const TIPO_DERECHO={supresion:'Supresión (que le borren los datos)',acceso:'Acceso (saber qué datos tenéis)',
  rectificacion:'Rectificación (corregir un dato)',oposicion:'Oposición (que dejéis de usarlos)',
  portabilidad:'Portabilidad (que se los deis)',revocar:'Retirar la autorización a entidades financieras'};
// ── TOCAR FUERA DE UNA VENTANA NO LA CIERRA ──
// Cerraban al pulsar el fondo, y bastaba un dedo mal puesto para perder una
// ficha entera a medio rellenar. Ahora solo se cierran con la ✕ o con Cancelar.
// Para que no parezca que la app se ha quedado colgada, la ventana da un
// pequeño latido: dice «te he oído, pero cierra por ahí».
const avisarCerrar=(e)=>{
  if(e.target!==e.currentTarget)return;          // solo el fondo, no lo de dentro
  const m=e.currentTarget.firstElementChild;
  if(!m||!m.style)return;
  m.style.animation='none';
  void m.offsetWidth;                            // fuerza a reiniciar la animación
  m.style.animation='bhLatido .32s ease';
};
const vivas=(l)=>(Array.isArray(l)?l:[]).filter(x=>x&&typeof x==='object'&&!esAnulada(x));

const EST = {
  pendiente:{c:C.wn,l:'Pendiente'},parcial:{c:C.in,l:'Parcial'},pagada:{c:C.sc,l:'Pagada'},
  vencida:{c:C.dn,l:'Vencida'},parcial_vencida:{c:'#F97316',l:'Parcial+Vencida'},
  anticipo_libre:{c:C.vt,l:'Anticipo libre'},aplicado:{c:C.ch[6],l:'Aplicado a factura'}
};
const Badge = ({estado}) => {const e=EST[estado]||EST.pendiente;return (<span style={{background:e.c+'22',color:e.c,padding:'2px 8px',borderRadius:12,fontSize:10,fontWeight:700,whiteSpace:'nowrap'}}>{e.l}</span>);};
const ProgressBar = ({value,max}) => <div style={{height:4,background:C.bg,borderRadius:2,overflow:'hidden',marginTop:3}}><div style={{height:'100%',width:`${pct(value,max)}%`,background:C.sc,borderRadius:2,transition:'width .3s'}}/></div>;

const escXml = s => txtSeguro(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');


// Reduce fotos antes del OCR: menos tokens de visión y payload más ligero.
// Convierte también HEIC→JPEG en Safari. Devuelve null si no procede (ya pequeña o error).
// v397 · opts.girar (0|90|180|270, sentido horario) y opts.autoVertical: una
// foto apaisada de una factura casi siempre es la página tumbada (iPhone plano
// sobre la mesa), así que se pone vertical girándola a la derecha antes de que
// la IA la lea. El giro aplicado viaja en blob._girado para el reintento.
const downscaleImage = (file, maxSide=1280, quality=0.82, opts={}) => new Promise((res)=>{
  try{
    const img=new Image();
    const url=URL.createObjectURL(file);
    img.onload=()=>{
      URL.revokeObjectURL(url);
      const w=img.naturalWidth,h=img.naturalHeight;
      if(!w||!h){res(null);return;}
      let girar=[90,180,270].includes(+opts.girar)?+opts.girar:0;
      if(!girar&&opts.autoVertical&&w>h*1.15)girar=90;
      const scale=Math.min(1,maxSide/Math.max(w,h));
      const sw=Math.max(1,Math.round(w*scale)),sh=Math.max(1,Math.round(h*scale));
      const cv=document.createElement('canvas');
      const lado=girar===90||girar===270;
      cv.width=lado?sh:sw;cv.height=lado?sw:sh;
      const cx=cv.getContext('2d');
      cx.translate(cv.width/2,cv.height/2);cx.rotate(girar*Math.PI/180);
      cx.drawImage(img,-sw/2,-sh/2,sw,sh);
      cv.toBlob(b=>{if(b)try{b._girado=girar;}catch(e){} res(b||null);},'image/jpeg',quality);
    };
    img.onerror=()=>{URL.revokeObjectURL(url);res(null);};
    img.src=url;
  }catch(e){res(null);}
});

// BIC de las entidades españolas más comunes (entidad = dígitos 5-8 del IBAN)
const BIC_ES={'0049':'BSCHESMM','0081':'BSABESBB','0182':'BBVAESMM','0128':'BKBKESMM','1465':'INGDESMM','0073':'OPENESMM','2100':'CAIXESBB','3081':'ERSVES22','2085':'CAZRES2Z','2103':'UCJAES2M','0239':'EVOBESMM','3058':'CCRIES2A','2080':'CAGLESMM','1491':'TRIOESMM'};

// ═══ FLOTA: helpers de vencimiento ═══
const emptyVeh={empresa:'BIG',alias:'',matricula:'',tipo:'vehiculo',itv:'',seguroVto:'',seguroCia:'',seguroPrima:'',mantFecha:'',mantNota:'',notas:'',activa:true};
const vencColor=(days,C)=>{const p=C||{};const d=+days;if(days===null||!Number.isFinite(d))return p.mt;return d<0?p.dn:d<=30?p.wn:p.sc;};
const vencTxt=(days)=>{const d=+days;if(days===null||days===undefined||!Number.isFinite(d))return '—';return d<0?`vencida hace ${-d} d`:d===0?'vence HOY':`en ${d} d`;};
// ═══ Backup por partes: cada parte es un JSON válido ≤34 KB (límite real de copia por llamada MCP) ═══
const partirBackup=(inv,otras,fecha)=>{
  const PART_MAX=30000;
  // Sin estas dos líneas, un dato con forma inesperada hacía que la copia de
  // seguridad recorriera carácter a carácter serializando en cada vuelta:
  // doce segundos con la app congelada.
  inv=Array.isArray(inv)?inv:[];
  otras=(otras&&typeof otras==='object'&&!Array.isArray(otras))?otras:{};
  const parts=[];
  let cur={v:8,d:fecha};
  for(const k in otras){
    const test={...cur,[k]:otras[k]};
    if(JSON.stringify(test).length>PART_MAX&&Object.keys(cur).length>2){parts.push(cur);cur={v:8,d:fecha,[k]:otras[k]};}
    else cur=test;
  }
  parts.push(cur);
  let bloque=100;
  const cabe=(n)=>{for(let i=0;i<inv.length;i+=n){if(JSON.stringify({v:8,i:inv.slice(i,i+n)}).length>PART_MAX)return false;}return true;};
  for(const n of [100,60,40,25,15,8,4]){bloque=n;if(cabe(n))break;}
  for(let i=0;i<inv.length;i+=bloque)parts.push({v:8,i:inv.slice(i,i+bloque)});
  const files=parts.map((p,ix)=>['BH10_backup_p'+String(ix+1).padStart(2,'0')+'.json',JSON.stringify(p)]);
  const manifest=JSON.stringify({v:8,d:fecha,partes:files.map(f=>f[0]),nFacturas:inv.length,nPartes:files.length});
  return {files,manifest};
};
const reensamblarPartes=(objs)=>{
  objs=(Array.isArray(objs)?objs:[]).filter(x=>x&&typeof x==='object');
  objs=Array.isArray(objs)?objs:[];
  // objs: [{name,data}] — el manifiesto (data.partes) ordena; claves sueltas: la última gana; 'i' se concatena con dedup por id
  const manifiesto=objs.find(o=>o.data&&Array.isArray(o.data.partes));
  const data={};const invAcc=[];const vistos=new Set();
  const resto=objs.filter(o=>o!==manifiesto);
  const listadas=manifiesto?manifiesto.data.partes:null;
  const orden=manifiesto
    ?[...listadas.map(n=>resto.find(o=>o.name===n)).filter(Boolean),...resto.filter(o=>!listadas.includes(o.name)).sort((a,b)=>a.name.localeCompare(b.name))]
    :resto.slice().sort((a,b)=>a.name.localeCompare(b.name));
  for(const o of orden){
    if(!o.data||typeof o.data!=='object')continue;
    const ajena=listadas&&!listadas.includes(o.name); // fuera del manifiesto: solo puede aportar facturas nuevas
    for(const k in o.data){
      if(k==='i'||k==='invoices'){for(const f of (o.data[k]||[])){const id=f&&f.id?f.id:JSON.stringify(f);if(!vistos.has(id)){vistos.add(id);invAcc.push(f);}}}
      else if(k!=='v'&&k!=='d'&&!ajena)data[k]=o.data[k];
    }
  }
  if(invAcc.length)data.i=invAcc;
  data.v=8;
  return data;
};
// ═══════════════════════════════════════════════════════════════════════
import {AYUDA} from './ayuda';
import {useSeguros} from './almacenes/seguros';
import {useVerifactu} from './almacenes/verifactu';
import {useTesoreria} from './almacenes/tesoreria';
import {useNominas} from './almacenes/nominas';
import {useContratos} from './almacenes/contratos';
import {useFacturas} from './almacenes/facturas';
import {generateCertDoc as doc_generateCertDoc,generateDoc as doc_generateDoc} from './documentos';
import {siguienteNumero,esSerieNueva,norm as normNumSerie} from './numeracion';
import {useTraspasos} from './almacenes/traspasos';
import {CONCEPTO_POR_DEFECTO,parseImporte,fmtImporte,validarTraspaso,empresaValida,construirC34Traspaso,apuntarTraspaso} from './traspasos';
import {repartirLineas,fechasEscalonadas,construirC34DeTxns} from './partir';
import {sanoDocumento,conReintentos,errorDefinitivo,cuadrarEnvio,textoCuadre,csvCuadre,esquemaEnlace,nombreUnico,confirmarEnNube} from './paquete';
import {consultasGmail,cabecera,adjuntosDe,puntuar,decidir,b64urlABytes,faltanDocumento,fundirResultados,consultaLibre,quitarDeLista,quitarCandidato,claveCandidato} from './correo';
import {lineasDe,cotejarExpediente,idCarpetaDrive,candidatosLinea,aprenderDe} from './expediente';
import {fotoPagos,diffPagos,anotar,entradaRemesa,deFactura,deRemesa,csvDiario,lineaDiario,fotoEntidades,diffEntidades} from './diario';
import {remesasSinPagos,facturasEnVariasRemesas,pagosSinRastro,pendientesConCargo,csvAuditoria} from './auditoria';
import {ACCIONES,SUBAREAS,puedeAccion as puedeAccionPura,puedeVerSub as puedeVerSubPura,puedeEditarSub as puedeEditarSubPura} from './permisos';
import {MAY,mayusculasFicha,ROLES_OBRA,ESTADOS_VIVIENDA,REGIMENES,nuevaVivienda,viviendasDeObra,viviendasDeCliente,cotitularesDe,nombreTitular,normalizaTitulares,aplicarRecibidoAVivienda,aplicarMejoras,totalMejoras,precioTotal,precioConIva,resumenObra,etiquetaVivienda,idCliente,asegurarIds,papelesObra,conPapel} from './ventas';
import {TIPOS_DOCVENTA,componerContrato,numeroDocVenta,nuevoDocVenta,nuevaFirma,huellaTexto,firmasCompletas,firmaValida,textoEvidencias,eur as eurDoc} from './ventadocs';
import {valoresObra,sugerirFusionObras,plantillaImputacion,leerImputacion,leerExcelRecibidas,aplicarImputacion,fundirObras,costePorObra,csvCostePorObra,obraDelCatalogo,nombreObra,nuevaObra} from './obras';
import {usePromociones} from './almacenes/promociones';
import {useFichaje} from './almacenes/fichaje';
const DebugHUD=()=>{
  const [m,setM]=useState({});
  useEffect(()=>{
    const lee=()=>{
      const vv=window.visualViewport||{};
      const r=(id)=>{const e=document.getElementById(id);if(!e)return '—';const b=e.getBoundingClientRect();return Math.round(b.top)+'/'+Math.round(b.bottom);};
      // Lo que de verdad hacía falta saber: cuánto mide la franja de seguridad
      // en SU móvil, y cuánto sobra por debajo de la barra.
      // El valor de --bh-safe-b es el texto declarado, no el resultado: para
      // saber cuánto mide DE VERDAD la franja hay que medirla con una sonda.
      const sonda=(lado)=>{
        const d=document.createElement('div');
        d.style.cssText='position:fixed;visibility:hidden;height:env(safe-area-inset-'+lado+');';
        document.body.appendChild(d);
        const h=Math.round(d.getBoundingClientRect().height);
        d.remove(); return h;
      };
      const cs=getComputedStyle(document.documentElement);
      const tb=document.getElementById('bh-tabbar');
      const rb=tb?tb.getBoundingClientRect():null;
      setM({ih:window.innerHeight,vh:Math.round(vv.height||0),vt:Math.round(vv.offsetTop||0),
        sy:Math.round(window.scrollY||window.pageYOffset||0),root:r('bh-root'),tab:r('bh-tabbar'),lupa:r('bh-lupa'),
        pantalla:(window.screen&&window.screen.height)||0,
        instalada:(('standalone' in window.navigator)?(window.navigator.standalone?'SÍ':'NO'):
          (window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches?'SÍ':'NO')),
        envTop:sonda('top'), envBot:sonda('bottom'),
        safe:(cs.getPropertyValue('--bh-safe-b')||'?').trim(),
        padTab:tb?getComputedStyle(tb).paddingBottom:'?',
        sobra:rb?Math.round((vv.height||window.innerHeight)-rb.bottom):'?'});
    };
    lee();const t=setInterval(lee,600);return ()=>clearInterval(t);
  },[]);
  return React.createElement(React.Fragment,null,
    React.createElement('style',null,'#bh-root{outline:2px solid #EF4444 !important;outline-offset:-2px}#bh-header{outline:2px solid #F0B429 !important;outline-offset:-2px}#bh-main{outline:2px solid #22D3EE !important;outline-offset:-2px}#bh-tabbar{outline:2px solid #E879F9 !important;outline-offset:-2px}#bh-lupa{outline:2px solid #34D399 !important;outline-offset:-2px}'),
    React.createElement('div',{style:{position:'fixed',left:4,top:'40%',zIndex:9999,pointerEvents:'none',background:'rgba(0,0,0,.85)',color:'#7BF07B',fontFamily:'monospace',fontSize:9,lineHeight:1.5,padding:'6px 8px',borderRadius:8,border:'1px solid #34D399'}},
      'DEBUG v80',React.createElement('br'),
      'innerH: '+(m.ih||''),React.createElement('br'),
      'vv.h: '+(m.vh||'')+'  vv.top: '+(m.vt||''),React.createElement('br'),
      'scrollY: '+(m.sy||''),React.createElement('br'),
      'root t/b: '+(m.root||''),React.createElement('br'),
      'pantalla: '+(m.pantalla??'-')+'  instalada: '+(m.instalada??'-'),React.createElement('br'),
      'env top/bot REAL: '+(m.envTop??'-')+' / '+(m.envBot??'-'),React.createElement('br'),
      'franja: '+(m.safe||'')+'  pad: '+(m.padTab||''),React.createElement('br'),
      'SOBRA ABAJO: '+(m.sobra??'-')+' px',React.createElement('br'),
      'tabbar t/b: '+(m.tab||''),React.createElement('br'),
      'lupa t/b: '+(m.lupa||'')
    )
  );
};
// ═══ GRÁFICAS Y CASETAS DEL PANEL ═══
// Viven fuera de App a propósito: definidas dentro, React las veía como
// componentes nuevos en cada render y destruía y recreaba las 26 casetas y
// las gráficas con cada pulsación de tecla.
const ChartBox=({title,children,h=200})=><div data-bh="grafica" style={{...S.card,marginTop:10}}><div style={{fontSize:11,fontWeight:700,color:C.mt,marginBottom:8,textTransform:'uppercase',letterSpacing:'.04em'}}>{title}</div><div style={{height:h}}>{children}</div></div>;
const Tip=({active,payload,label})=>{if(!active||!payload?.length)return null;return (<div style={{background:C.sf,border:`1px solid ${C.bd}`,borderRadius:8,padding:'6px 10px',fontSize:11}}><div style={{fontWeight:600,marginBottom:3}}>{label}</div>{payload.map((p,i)=><div key={i} style={{color:p.color||p.fill}}>{p.name}: {fmt(p.value)} €</div>)}</div>);};
const KPI=({id,label,value,sub,color,onClick,visibles,tipo,edit,ancho,arrastrando,onArrastrar,onSoltar,onMover,onAncho})=>{
  color=color||C.ac;
    const full=ancho==='full';
    const pos=(visibles||[]).indexOf(id);
    return (
    <div
      draggable={edit}
      onDragStart={edit?(()=>onArrastrar(id)):undefined}
      onDragOver={edit?(e=>e.preventDefault()):undefined}
      onDrop={edit?(e=>{e.preventDefault();onSoltar(id);}):undefined}
      onDragEnd={edit?(()=>onArrastrar(null)):undefined}
      onClick={edit?undefined:onClick}
      data-bh="caseta" style={{...S.card,flex:full?'1 1 100%':'1 1 calc(50% - 4px)',minWidth:0,boxSizing:'border-box',position:'relative',opacity:arrastrando===id?0.45:1,
        cursor:edit?'grab':(onClick?'pointer':'default'),
        ...(edit?{borderColor:C.in+'88',borderStyle:'dashed'}:(onClick?{borderColor:C.bd,transition:'border-color .15s'}:{}))}}
      onMouseEnter={e=>{if(onClick&&!edit)e.currentTarget.style.borderColor=C.in;}}
      onMouseLeave={e=>{if(onClick&&!edit)e.currentTarget.style.borderColor=C.bd;}}>
      {tipo==='cont'?(<>
        <div style={{fontSize:11,fontWeight:700,color:C.mt,textAlign:'center',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{label}</div>
        <div style={{fontSize:full?26:20,fontWeight:800,color,textAlign:'center',lineHeight:1.2}}>{value}</div>
      </>):(<>
        <div style={{fontSize:full?24:18,fontWeight:800,color,letterSpacing:'-.02em',lineHeight:1.1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textAlign:'center'}}>{value}</div>
        <div style={{fontSize:11,color:C.mt,marginTop:3,fontWeight:500,lineHeight:1.25,textAlign:'center'}}>{label}</div>
        {sub&&<div style={{fontSize:10,color:C.mt+'cc',marginTop:1,lineHeight:1.25,textAlign:'center'}}>{sub}</div>}
      </>)}
      {edit&&(
        <div style={{display:'flex',gap:4,marginTop:6,justifyContent:'space-between'}}>
          <button style={{...S.sm(C.in),padding:'4px 8px',fontSize:12,minHeight:0,opacity:pos<=0?0.35:1}} disabled={pos<=0} onClick={e=>{e.stopPropagation();onMover(id,-1,visibles);}}>◀</button>
          <button style={{...S.sm(C.ac),padding:'4px 8px',fontSize:11,minHeight:0}} title="Media pantalla o ancho completo" onClick={e=>{e.stopPropagation();onAncho(id);}}>{full?'◨ Mitad':'▭ Ancho'}</button>
          <button style={{...S.sm(C.in),padding:'4px 8px',fontSize:12,minHeight:0,opacity:(pos<0||pos>=(visibles||[]).length-1)?0.35:1}} disabled={pos<0||pos>=(visibles||[]).length-1} onClick={e=>{e.stopPropagation();onMover(id,1,visibles);}}>▶</button>
        </div>
      )}
    </div>
    );
  };

class LimiteErrores extends React.Component{
  constructor(p){super(p);this.state={error:null};}
  static getDerivedStateFromError(e){return{error:e};}
  componentDidCatch(e,info){console.error('LimiteErrores:',e,info&&info.componentStack);}
  render(){
    if(this.state.error){
      return React.createElement('div',{style:{minHeight:'100dvh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#0F172A',color:'#E2E8F0',fontFamily:'system-ui',padding:24,textAlign:'center',gap:14}},
        React.createElement('div',{style:{fontSize:40}},'\ud83d\udedf'),
        React.createElement('div',{style:{fontWeight:800,fontSize:17}},'La aplicaci\u00f3n ha tropezado'),
        React.createElement('div',{style:{fontSize:12,color:'#94A3B8',maxWidth:340}},'Tus datos est\u00e1n a salvo \u2014 esto es solo la pantalla. Recarga para continuar y, si se repite, p\u00e1same el texto de abajo.'),
        React.createElement('code',{style:{fontSize:10,color:'#F87171',maxWidth:340,wordBreak:'break-word'}},String((this.state.error&&this.state.error.message)||this.state.error).slice(0,180)),
        React.createElement('button',{style:{marginTop:6,padding:'12px 26px',border:'none',borderRadius:10,background:'#10B981',color:'#04120C',fontWeight:800,fontSize:14,cursor:'pointer'},onClick:()=>{try{location.reload();}catch(e){this.setState({error:null});}}},'Recargar')
      );
    }
    return this.props.children;
  }
}
const BtnConfirm=({onConfirm,style,armStyle,armedLabel='¿Seguro? Toca de nuevo',children})=>{
  const [armed,setArmed]=useState(false);
  const t=useRef(null);
  useEffect(()=>()=>{if(t.current)clearTimeout(t.current);},[]);
  return <button style={{...style,...(armed?(armStyle||{}):{})}} onClick={(e)=>{if(e&&e.stopPropagation)e.stopPropagation();if(armed){if(t.current)clearTimeout(t.current);setArmed(false);onConfirm&&onConfirm();}else{setArmed(true);t.current=setTimeout(()=>setArmed(false),4000);}}}>{armed?armedLabel:children}</button>;
};
const emptyPoliza={empresa:'BIG',ramo:'',objeto:'',objetoId:'',nPoliza:'',cia:'',
  prima:'',periodicidad:'anual',vto:'',desc:'',notas:'',activa:true,
  tipo:'' /* se conserva por las pólizas antiguas */};




// Imita la numeración que ya se use (la de Reme o cualquiera): incrementa el
// ÚLTIMO tramo de cifras conservando prefijos, año y ceros a la izquierda.
// 'RM-2026/041' → 'RM-2026/042' · '26-117' → '26-118' · 'A099' → 'A100'
// ═══ COPIA COMPLETA v9: volcado fiel de TODAS las claves de la nube ═══
const AREAS_PERMISO=[['facturas','📋 Facturas'],['contratos','📑 Contratos'],['nominas','👷 Nóminas'],
  ['seguros','🛡️ Seguros'],['tesoreria','💰 Tesorería'],['ajustes','⚙️ Ajustes']];
const SESION_ID=(Math.random().toString(36).slice(2)+Date.now().toString(36)).slice(0,14);
// v394-v396 · la descripción del aparato vive en src/dispositivo.js; aquí solo se cachea.
const dispositivoCorto=()=>describirDispositivo(navigator,window,false);
let _dispositivoCache='';
const dispositivoActual=async()=>{if(!_dispositivoCache)try{_dispositivoCache=await dispositivoLargo(navigator,window);}catch(e){_dispositivoCache=dispositivoCorto();}return _dispositivoCache;};
const CLAVES_COPIA=['bh10-altotab','bh10-anthkey','bh10-avisonom','bh10-bajartab','bh10-banca',
 'bh10-budgets','bh10-cesiones','bh10-clicat','bh10-company-v2','bh10-contratos','bh10-employees',
 'bh10-euribor','bh10-fc-v3','bh10-fcseed','bh10-financiacion','bh10-flota','bh10-flotaseed',
 'bh10-fusignore','bh10-gmailid','bh10-kpis','bh10-n43','bh10-nominas','bh10-obras','bh10-ordenconfig',
 'bh10-paleta','bh10-payroll-hist','bh10-planidx','bh10-polizas','bh10-promocfg','bh10-provcat',
 'bh10-recurrentes','bh10-remesas','bh10-tema','bh10-usoia','bh10-vfcfg','bh10-vfeventos','bh10-vfregistros','bh10-diario','bh10-viviendas',
 // v369 · faltaban en la copia y llevan datos de verdad: traspasos entre empresas (v340),
 // usuarios del Master y su config, la empresa en uso del grupo y los descartes de fusión
 // de clientes. Fuera se quedan a propósito: sesiones y ping (efímeros) y ultimacopia (meta).
 'bh10-clifusignore','bh10-grupo','bh10-mastercfg','bh10-traspasos','bh10-usuarios',
 'bh10-docsventa'];   // v370 · contratos de reserva y arras firmados
// v365 · la copia completa NUNCA lleva la clave de la IA (se vuelve a pegar en Ajustes si hace falta)
const CLAVES_FUERA_DE_COPIA=new Set(['bh10-anthkey']);


const diasDesde=(f)=>{if(!f)return null;const d=Math.floor((Date.now()-new Date(f+'T12:00:00').getTime())/86400000);return isNaN(d)?null:Math.max(0,d);};



// ═══ LEER UNA FECHA SIN QUE SE VUELVA LOCA ═══
// new Date('12/08/2026') devuelve el 12 de DICIEMBRE, porque lo lee al modo
// inglés. Una factura guardada así se caía fuera del trimestre y no entraba
// en el paquete de la gestoría aunque estuviera perfectamente en el sistema.
const fechaSegura=(v)=>{
  if(v instanceof Date)return isNaN(v)?null:v;
  const s=String(v==null?'':v).trim();
  if(!s)return null;
  let m=s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);          // 2026-08-12
  if(m)return new Date(+m[1],+m[2]-1,+m[3]);
  m=s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);              // 12/08/2026
  if(m)return new Date(+m[3],+m[2]-1,+m[1]);
  m=s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/);             // 12/08/26
  if(m)return new Date(2000+ +m[3],+m[2]-1,+m[1]);
  const d=new Date(s);
  return isNaN(d)?null:d;
};



// La ruta llega como «empresas/UID» o «empresas/UID/sub/X»: el identificador
// es el trozo que NO es una palabra fija. Quedarse con el primero daría la
// palabra «empresas», que no sirve para nada.
const uidDeRuta=(ruta)=>{
  const p=String(ruta||'').split('/').filter(Boolean);
  const i=p.indexOf('empresas');
  if(i>=0&&p[i+1])return p[i+1];
  return p.find(x=>x!=='empresas'&&x!=='sub')||'';
};



// ═══ Datos importados de Vehiculos_y_seguros2.xlsx (jul 2026) — se siembran una sola vez ═══
const SEED_FLOTA=[]; // semilla VACIADA: los datos viven solo en la nube protegida (v302-seguridad)
// v370 · RESCATE DE LA FLOTA. Al vaciar las semillas por seguridad (v302) la
// marca «bh10-flotaseed» ya estaba puesta, así que la siembra escribió una
// lista VACÍA y los 13 vehículos del Excel de julio desaparecieron sin que
// nadie lo viera. Se recuperan del canónico v63. NO es una semilla automática:
// es un botón de Ajustes que Jesús pulsa una vez y que respeta lo que ya haya
// (compara por matrícula). Aquí solo hay matrícula, modelo, empresa y seguro
// de empresa: ni personas, ni cuentas, ni nada que la regla de seguridad prohíba.
const FLOTA_RESCATE=[];  // v370 · VACÍA A PROPÓSITO. Los 13 vehículos NO viajan en el
// bundle: la regla es que ningún dato real esté en el código compilado, y unas
// matrículas con el nombre de Benito lo son. Van en «flota_rescate.json», dentro
// del zip, y se traen con el botón de abajo eligiendo el fichero.


const SEED_POLIZAS=[]; // semilla VACIADA: los datos viven solo en la nube protegida (v302-seguridad)
// ═══ Registro de facturas importado de FACTURAS_IMPORT.xlsx (ene-2025 → jul-2026) — siembra única ═══
const SEED_PROVCAT=[]; // semilla VACIADA: los datos viven solo en la nube protegida (v302-seguridad)
const SEED_FC_ROWS=[]; // semilla VACIADA: los datos viven solo en la nube protegida (v302-seguridad)
const inferCatProv=(p)=>{const u=String(p).toUpperCase();if(/GASOLIN|CEPSA|REPSOL|CARBURAN/.test(u))return 'Suministros';if(/TALLER|AUTOMOVIL|NEUMATIC/.test(u))return 'Otros';if(/ALQUIL|GRUAS/.test(u))return 'Alquiler maquinaria';if(/ASESOR|GESTOR|NOTARI|ABOGAD/.test(u))return 'Servicios profesionales';if(/SEGUR/.test(u))return 'Seguros';return 'Materiales';};
const buildSeedFC=()=>{
  const provMap={};SEED_PROVCAT.forEach(p=>{provMap[p.nombre]=p;});
  const near=(pct)=>[21,10,4].reduce((a,b)=>Math.abs(b-pct)<Math.abs(a-pct)?b:a,21);
  return SEED_FC_ROWS.map((r,ix)=>{
    const [prov,fecha,num,total,iva,pend,obra]=r;
    const pf=provMap[prov]||{cif:'',dir:'',iban:''};
    const base=+(total-iva).toFixed(2);
    const tipoIva=iva?near(iva/(base||1)*100):0;
    const pagado=+(total-pend).toFixed(2);
    return {id:'imp-fc'+String(ix).padStart(3,'0'),tipo:'factura',fecha,numFactura:String(num),proveedor:prov,
      proveedorCif:pf.cif||'',proveedorDir:pf.dir||'',ibanProveedor:pf.iban||'',obra:obra||'',concepto:'',
      categoria:inferCatProv(prov),importeBase:base,tipoIva,iva,irpf:0,retencion:0,total,
      fechaVencimiento:'',formaPago:'Transferencia',notas:total<0?'Abono pendiente de compensar':'',
      refPresupuesto:'',esEstructural:false,aplicadoA:null,
      pagos:(pagado>0.009&&total>0)?[{id:'imp-pg'+ix,fecha,importe:pagado,metodo:'Importación Excel',referencia:''}]:[]};
  });
};

// Sanitizador para IDs SEPA (max 35 chars, solo alfanumérico y guiones)
// Nombre para mostrar de una obra del catálogo
const obraDisplay = o0 => {
  const o=(o0&&typeof o0==='object')?o0:{};
  if(typeof o.alias==='string'&&o.alias.trim())return o.alias.trim();
  const dir=[o.calle,o.numero].filter(Boolean).join(' ');
  const loc=[o.municipio,o.provincia?`(${o.provincia})`:''].filter(Boolean).join(' ');
  return [dir,loc].filter(Boolean).join(', ')||'(sin datos)';
};
const emptyObra={alias:'',calle:'',numero:'',cp:'',municipio:'',provincia:'',activa:true,presupuestoGasto:0,presupuestoVenta:0};


// ═══ IMPORTACIÓN EXCEL/CSV: mapeo flexible de columnas ═══
const xlsNorm = s => String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const XLS_SYN = {
  fecha:['fecha','fechafactura','ffactura','ffra','fechafra','femision','fechaemi','fechaemision','fechadefactura','date'],
  numFactura:['numfactura','nfactura','numerofactura','numero','factura','num','nfra','nofactura','ndefactura'],
  proveedor:['proveedor','nombre','emisor','acreedor','razonsocial','nombreproveedor'],
  proveedorCif:['cif','nif','cifproveedor','nifproveedor','cifnif'],
  proveedorDir:['direccion','direccionproveedor','domicilio'],
  _pagada:['pagada','pagado','estado','estadopago','situacion','abonada','cobrada','liquidada'],
  _fechaPago:['fechapago','fpago','fechadepago','fechaabono','pagadoel','fechacobro'],
  concepto:['concepto','descripcion','detalle','observaciones'],
  categoria:['categoria','tipo','tipogasto'],
  importeBase:['base','baseimponible','importebase','neto','basefactura'],
  tipoIva:['iva','tipoiva','porciva','pciva','porcentajeiva'],
  base2:['base2','segundabase','baseiva2'],
  tipoIva2:['iva2','tipoiva2','pciva2'],
  irpf:['irpf','retencion','tipoirpf','porcirpf'],
  total:['total','totalfactura','importetotal','importe','totalfra'],
  fechaVencimiento:['vencimiento','fechavencimiento','vto','fvencimiento','fechavto'],
  ibanProveedor:['iban','cuenta','cc','cuentabancaria','numerocuenta','ibanproveedor'],
  obra:['obra','direccionobra','proyecto','centrocoste','obradestino'],
  formaPago:['formapago','formadepago','pago','metodopago'],
};
const xlsToISO = v => {
  if(!v)return'';
  if(v instanceof Date&&!isNaN(v))return v.getFullYear()+'-'+String(v.getMonth()+1).padStart(2,'0')+'-'+String(v.getDate()).padStart(2,'0');
  if(typeof v==='number'&&v>20000&&v<80000){const d=new Date(Math.round((v-25569)*86400*1000));return isNaN(d)?'':xlsToISO(d);}
  const s=String(v).trim();
  let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)return m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0');
  m=s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if(m){const y=m[3].length===2?'20'+m[3]:m[3];return y+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');}
  return'';
};
// rows: array de objetos {cabecera:valor}; getSup: (nombre)=>{iban,cif,dir}
const parseExcelRows = (rows, getSup, todayISO, pagoPorDefecto) => {
  rows=(Array.isArray(rows)?rows:[]).filter(x=>x&&typeof x==='object');
  if(!rows.length)return[];
  const headers=Object.keys(rows[0]);
  const fieldOf={};
  headers.forEach(h=>{const n=xlsNorm(h);for(const[f,syns]of Object.entries(XLS_SYN)){if(syns.includes(n)){if(!Object.values(fieldOf).includes(f))fieldOf[h]=f;break;}}});
  const localSup={};
  return rows.map((r,idx)=>{
    const d={};
    for(const[h,f]of Object.entries(fieldOf))d[f]=r[h];
    const prov=String(d.proveedor||'').trim();
    // números
    const pIva=parseNum(String(d.tipoIva??'').replace('%',''));
    d.tipoIva=IVAS.includes(Math.round(pIva))?Math.round(pIva):21;
    const pIrpf=parseNum(String(d.irpf??'').replace('%',''));
    d.irpf=IRPFS.includes(Math.round(pIrpf))?Math.round(pIrpf):0;
    let base=parseNum(d.importeBase), tot=parseNum(d.total);
    if(!base&&tot)base=+(tot/(1+d.tipoIva/100)).toFixed(2);
    d.importeBase=base?fmt(parseNum(base)):'';
    d._totalLeido=tot||0;
    // fechas — si la del Excel no se entiende, la fila entra con la de hoy,
    // pero queda marcada (_fechaEstimada) para avisar y NO contaminar el pago
    const _fReal=xlsToISO(d.fecha)||'';
    d.fecha=_fReal||todayISO;
    d._fechaEstimada=!_fReal;
    d.fechaVencimiento=xlsToISO(d.fechaVencimiento)||'';
    // textos
    d.proveedor=prov;
    d.numFactura=String(d.numFactura||'').trim();
    d.concepto=String(d.concepto||'').trim();
    d.categoria=CATS.includes(String(d.categoria||'').trim())?String(d.categoria).trim():'Materiales';
    d.proveedorCif=String(d.proveedorCif||'').trim().toUpperCase();
    d.proveedorDir=String(d.proveedorDir||'').trim();
    d.ibanProveedor=normIban(d.ibanProveedor);
    d.obra=String(d.obra||'').trim();
    d.formaPago=String(d.formaPago||'').trim()||'Transferencia';
    // ── Estado de pago desde el Excel ──
    const _txtPag=String(d._pagada??'').trim().toLowerCase();
    const _fPago=xlsToISO(d._fechaPago)||'';
    const _marcaSi=['si','sí','s','x','yes','y','true','1','pagada','pagado','ok','abonada','cobrada','liquidada','pagada total','pagado total'];
    const _marcaNo=['no','n','false','0','pendiente','impagada','sin pagar','','-'];
    let _pagada=null;
    if(_marcaSi.includes(_txtPag))_pagada=true;
    else if(_txtPag&&_marcaNo.includes(_txtPag))_pagada=false;
    else if(_fPago)_pagada=true;              // sin marca pero con fecha de pago → pagada
    else _pagada=(pagoPorDefecto==='pagada');  // sin marca ni fecha: lo que se haya elegido al importar
    delete d._pagada; delete d._fechaPago;
    // fecha del pago: la columna de pago si existe; si no, la fecha REAL de la
    // factura. Nunca la fecha del día de importación: eso llenaba el registro
    // de pagos falsos hechos «hoy».
    d._pagoImport=(_pagada===true)?{fecha:_fPago||_fReal}:null;
    // ── Autocompletar desde ficha del proveedor (facturas previas o filas anteriores del Excel) ──
    if(prov){
      const sup=localSup[prov]||getSup(prov)||{};
      if(!d.ibanProveedor&&sup.iban)d.ibanProveedor=sup.iban;
      if(!d.proveedorCif&&sup.cif)d.proveedorCif=sup.cif;
      if(!d.proveedorDir&&sup.dir)d.proveedorDir=sup.dir;
      localSup[prov]={iban:d.ibanProveedor||sup.iban||'',cif:d.proveedorCif||sup.cif||'',dir:d.proveedorDir||sup.dir||''};
    }
    const valid=!!prov&&parseNum(d.importeBase)>0;
    return {id:uid(),name:`Fila ${idx+2} — ${prov||'(sin proveedor)'}`,file:null,
      status:valid?'done':'error',error:valid?null:(!prov?'Sin proveedor':'Sin base ni total'),
      data:valid?d:null,registered:false};
  });
};

const sepaId = (s, max=30) => (txtSeguro(s)||'REF').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9-]/g,'').slice(0,max) || 'REF';


const MESES_L=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

// ═══ SHARE / DOWNLOAD — acepta string o Blob, con fallback garantizado ═══
// En Safari iOS dentro de iframes, canShare() puede devolver true pero share()
// ser rechazado por Permissions Policy → SIEMPRE caer a descarga si share falla.
const shareOrDownload = (content, filename, mimeType) => new Promise(resolve => {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const doDownload = () => {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.style.display = 'none';
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 3000);
      resolve('downloaded');
    } catch (e) { resolve('failed'); }
  };
  try {
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file], title: filename })
        .then(() => resolve('shared'))
        .catch(e => { if (e.name === 'AbortError') resolve('cancelled'); else doDownload(); });
      return;
    }
  } catch (e) { /* Share API no disponible → download */ }
  doDownload();
});

// ═══════════════════════════════════════════════════════════════
// MOTOR PDF NATIVO — genera PDF 1.4 real sin librerías externas.
// Todo ASCII (chars especiales via escapes octales WinAnsi) para
// poder construir el Blob desde string sin corrupción UTF-8.
// ═══════════════════════════════════════════════════════════════
const WINANSI={'á':225,'é':233,'í':237,'ó':243,'ú':250,'Á':193,'É':201,'Í':205,'Ó':211,'Ú':218,'ñ':241,'Ñ':209,'ü':252,'Ü':220,'ç':231,'Ç':199,'º':186,'ª':170,'€':128,'¿':191,'¡':161,'·':183,'—':151,'–':150,'\u2019':146,'\u2018':145,'\u201C':147,'\u201D':148,'à':224,'è':232,'ì':236,'ò':242,'ù':249,'â':226,'ê':234,'ô':244,'ö':246,'ä':228,'ë':235,'ï':239,'•':149,'…':133,'×':215,'÷':247,'°':176,'©':169,'®':174,'™':153,'§':167,'«':171,'»':187,'½':189,'¼':188,'¾':190,'²':178,'³':179,'¹':185};
// Sustituciones para caracteres sin equivalente WinAnsi (flechas, etc.)
const PDF_SUBST={'→':'-','←':'-','↔':'-','⇒':'->','⇐':'<-','\u00A0':' ','↑':'','↓':''};
// Normaliza ANTES de medir/imprimir: sustituye o elimina lo no representable
const pdfNorm = s => txtSeguro(s).split('').map(ch=>{
  const c=ch.charCodeAt(0);
  if((c>=32&&c<=126)||WINANSI[ch]!==undefined)return ch;
  if(PDF_SUBST[ch]!==undefined)return PDF_SUBST[ch];
  if(c>=0x2000||(c>=0xD800&&c<=0xDFFF))return'';  // símbolos/emoji fuera de WinAnsi: omitir
  return '?';
}).join('');

const pdfEnc = s => txtSeguro(s).split('').map(ch=>{
  if(ch==='\\')return'\\\\'; if(ch==='(')return'\\('; if(ch===')')return'\\)';
  const c=ch.charCodeAt(0);
  if(c>=32&&c<=126)return ch;
  if(WINANSI[ch]!==undefined)return'\\'+WINANSI[ch].toString(8).padStart(3,'0');
  return '?';
}).join('');

const pdfCharW = c => {
  if('0123456789'.includes(c))return 556;
  if(' .,:;'.includes(c))return 278; if(c==='-')return 333; if(c==='/')return 278;
  if(c==='€')return 556; if(c==='%')return 889;
  if(c>='A'&&c<='Z')return 667; if(c>='a'&&c<='z')return 500;
  return 556;
};
const pdfTextW = (s,size) => {const t=+size;const w=String(s==null?'':s).split('').reduce((a,c)=>a+pdfCharW(c),0)*(Number.isFinite(t)?t:10)/1000;return Number.isFinite(w)?w:0;};

const createPdf = () => {
  const H=841.89, W=595.28;
  const pages=[]; let ops;
  const api={W,H};
  const newPage=()=>{ops=[];pages.push(ops);};
  newPage();
  const col=(r,g,b)=>`${r} ${g} ${b}`;
  api.NAVY=col(0.106,0.153,0.251); api.GREEN=col(0.298,0.686,0.314); api.GREY=col(0.4,0.4,0.4);
  api.LGREY=col(0.955,0.96,0.968); api.YELL=col(1,0.973,0.882); api.DYELL=col(0.545,0.412,0.078);
  api.WHITE=col(1,1,1); api.BLACK=col(0.1,0.1,0.1); api.LINE=col(0.86,0.86,0.86);
  const Y=t=>H-t;
  api.rect=(x,top,w,h,c)=>ops.push(`${c} rg ${x.toFixed(2)} ${(Y(top)-h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  api.line=(x1,top1,x2,top2,c,lw=1)=>ops.push(`${c} RG ${lw} w ${x1.toFixed(2)} ${Y(top1).toFixed(2)} m ${x2.toFixed(2)} ${Y(top2).toFixed(2)} l S`);
  api.text=(x,top,str,{size=10,font='F1',color=api.BLACK,align='left',maxW=0}={})=>{
    let s=pdfNorm(str); if(maxW>0){while(s.length>1&&pdfTextW(s,size)>maxW)s=s.slice(0,-1);}
    let tx=x; if(align==='right')tx=x-pdfTextW(s,size); else if(align==='center')tx=x-pdfTextW(s,size)/2;
    ops.push(`BT /${font} ${size} Tf ${color} rg ${tx.toFixed(2)} ${(Y(top)-size*0.78).toFixed(2)} Td (${pdfEnc(s)}) Tj ET`);
  };
  api.wrap=(str,size,maxW)=>{const words=pdfNorm(str).split(/\s+/).filter(Boolean);const lines=[];let cur='';
    words.forEach(w=>{const t=cur?cur+' '+w:w;if(pdfTextW(t,size)<=maxW)cur=t;else{if(cur)lines.push(cur);cur=w;}});
    if(cur)lines.push(cur);return lines.length?lines:[''];};
  api.newPage=newPage;
  api.build=()=>{
    const objs={}; const fontRes='<</Font<</F1 100 0 R/F2 101 0 R/F3 102 0 R>>>>';
    const kids=pages.map((_,i)=>`${3+i*2} 0 R`).join(' ');
    objs[1]=`<</Type/Catalog/Pages 2 0 R>>`;
    objs[2]=`<</Type/Pages/Kids[${kids}]/Count ${pages.length}>>`;
    pages.forEach((p,i)=>{
      const stream=p.join('\n');
      objs[3+i*2]=`<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${W} ${H}]/Resources${fontRes}/Contents ${4+i*2} 0 R>>`;
      objs[4+i*2]=`<</Length ${stream.length}>>\nstream\n${stream}\nendstream`;
    });
    objs[100]=`<</Type/Font/Subtype/Type1/BaseFont/Helvetica/Encoding/WinAnsiEncoding>>`;
    objs[101]=`<</Type/Font/Subtype/Type1/BaseFont/Helvetica-Bold/Encoding/WinAnsiEncoding>>`;
    objs[102]=`<</Type/Font/Subtype/Type1/BaseFont/Courier-Bold/Encoding/WinAnsiEncoding>>`;
    let out='%PDF-1.4\n'; const offs={};
    Object.keys(objs).map(Number).sort((a,b)=>a-b).forEach(n=>{offs[n]=out.length;out+=`${n} 0 obj\n${objs[n]}\nendobj\n`;});
    const xrefPos=out.length; const maxObj=102;
    out+=`xref\n0 ${maxObj+1}\n0000000000 65535 f \n`;
    for(let n=1;n<=maxObj;n++)out+=(offs[n]!==undefined?String(offs[n]).padStart(10,'0')+' 00000 n \n':'0000000000 65535 f \n');
    out+=`trailer\n<</Size ${maxObj+1}/Root 1 0 R>>\nstartxref\n${xrefPos}\n%%EOF`;
    return out;
  };
  api.buildBlob=()=>new Blob([api.build()],{type:'application/pdf'});
  return api;
};

// ═══ PLANTILLA PDF: FACTURA / PRESUPUESTO ═══
const buildInvoicePdf = ({tipo='FACTURA',numero,fecha,vencimiento,vf,contratoNum,estado,emisor,receptor,obra,items,base,ivaLabel,ivaImp,irpfLabel,irpfImp,total,isSP,iban,bic,formaPago,notas,footer},retGar) => {
  const P=createPdf(); const ML=45,MR=45,PW=P.W-ML-MR;
  let y;
  const header=()=>{
    P.rect(0,0,P.W,10,P.NAVY);
    P.text(ML,34,(emisor.marca||emisor.name||'BIOH GROUP'),{size:23,font:'F2',color:P.NAVY});
    P.text(ML,58,emisor.name||'',{size:10,font:'F2',color:P.GREEN});
    P.text(P.W-MR,32,tipo,{size:19,font:'F2',color:P.NAVY,align:'right'});
    P.text(P.W-MR,52,'N. '+(numero||''),{size:11,font:'F2',color:P.GREEN,align:'right'});
    let my=66;
    P.text(P.W-MR,my,'Fecha: '+(fecha||''),{size:9,color:P.GREY,align:'right'});my+=12;
    if(vencimiento){P.text(P.W-MR,my,'Vencimiento: '+vencimiento,{size:9,color:P.GREY,align:'right'});my+=12;}
    if(contratoNum){P.text(P.W-MR,my,'Contrato: '+contratoNum,{size:9,color:P.GREY,align:'right'});my+=12;}
    if(estado){P.text(P.W-MR,my,'Estado: '+estado,{size:9,color:P.GREY,align:'right'});}
    P.line(ML,96,P.W-MR,96,P.NAVY,1.6);
    y=110;
  };
  const checkPage=(need)=>{if(y+need>780){P.newPage();P.rect(0,0,P.W,6,P.NAVY);y=30;}};
  header();

  // Cajas emisor / receptor
  const boxW=(PW-16)/2, boxH=78;
  P.rect(ML,y,boxW,boxH,P.LGREY); P.rect(ML,y,3,boxH,P.NAVY);
  P.text(ML+10,y+8,'EMISOR',{size:6.5,font:'F2',color:P.NAVY});
  P.text(ML+10,y+19,emisor.name||'',{size:9.5,font:'F2',maxW:boxW-20});
  let ey=y+33;
  [emisor.cif?'CIF: '+emisor.cif:'',emisor.address||'',emisor.city||'',emisor.phone?'Tel: '+emisor.phone:''].filter(Boolean).slice(0,4).forEach(l=>{P.text(ML+10,ey,l,{size:7.5,color:P.GREY,maxW:boxW-20});ey+=10;});
  const rx=ML+boxW+16;
  P.rect(rx,y,boxW,boxH,'0.941 0.968 0.941'); P.rect(rx,y,3,boxH,P.GREEN);
  P.text(rx+10,y+8,'CLIENTE / DESTINATARIO',{size:6.5,font:'F2',color:P.GREEN});
  P.text(rx+10,y+19,receptor.name||'',{size:9.5,font:'F2',maxW:boxW-20});
  let ry=y+33;
  // v357 · Jesús: «en los datos del cliente no aparece su dirección ni el
  // email». Dirección hasta 2 líneas y, debajo, email · teléfono en una.
  const _contacto=[receptor.email||'',receptor.tel?'Tel: '+receptor.tel:''].filter(Boolean).join(' · ');
  [receptor.cif?'CIF/NIF: '+receptor.cif:''].concat(P.wrap(receptor.dir||'',7.5,boxW-20).slice(0,_contacto?2:3)).concat([_contacto]).filter(Boolean).forEach(l=>{P.text(rx+10,ry,l,{size:7.5,color:P.GREY,maxW:boxW-20});ry+=10;});
  y+=boxH+12;

  if(obra){P.rect(ML,y,PW,18,P.YELL);P.rect(ML,y,3,18,'0.909 0.639 0.031');P.text(ML+10,y+5,'Obra/Servicio: '+obra,{size:8.5,color:P.DYELL,maxW:PW-20});y+=26;}

  // Tabla
  const cols=[PW*0.44,PW*0.15,PW*0.19,PW*0.22];
  const tableHead=()=>{
    P.rect(ML,y,PW,18,P.NAVY);
    let cx=ML;
    ['CONCEPTO','UDS.','BASE / PRECIO','IMPORTE'].forEach((h,i)=>{
      const align=i===0?'left':i===1?'center':'right';
      const tx=align==='right'?cx+cols[i]-6:align==='center'?cx+cols[i]/2:cx+6;
      P.text(tx,y+5.5,h,{size:7.5,font:'F2',color:P.WHITE,align});cx+=cols[i];});
    y+=18;
  };
  tableHead();
  (items||[]).forEach(it=>{
    const lines=P.wrap(it.desc||'-',8.5,cols[0]-12);
    const rowH=Math.max(18,lines.length*11+7);
    checkPage(rowH+8); if(y===30){tableHead();}
    lines.forEach((l,li)=>P.text(ML+6,y+5+li*11,l,{size:8.5}));
    P.text(ML+cols[0]+cols[1]/2,y+5,it.qty||'',{size:8.5,align:'center'});
    P.text(ML+cols[0]+cols[1]+cols[2]-6,y+5,it.base||'',{size:8.5,align:'right'});
    P.text(ML+PW-6,y+5,it.imp||'',{size:8.5,align:'right'});
    y+=rowH; P.line(ML,y,ML+PW,y,P.LINE,0.7);
  });
  y+=10;

  // Totales
  checkPage(120);
  const totX=ML+PW*0.5;
  P.text(totX,y,'Base imponible',{size:9});P.text(ML+PW,y,base,{size:9,font:'F2',align:'right'});y+=14;
  if(!isSP&&ivaImp){P.text(totX,y,ivaLabel||'IVA',{size:9});P.text(ML+PW,y,ivaImp,{size:9,font:'F2',align:'right'});y+=14;}
  if(irpfImp){P.text(totX,y,irpfLabel||'Retencion IRPF',{size:9});P.text(ML+PW,y,'-'+irpfImp,{size:9,font:'F2',align:'right'});y+=14;}
  P.line(totX,y+2,ML+PW,y+2,P.NAVY,1.4);y+=8;
  P.text(totX,y,'TOTAL '+tipo,{size:12.5,font:'F2',color:P.NAVY});
  P.text(ML+PW,y,total,{size:13.5,font:'F2',color:P.NAVY,align:'right'});y+=26;
  if(retGar&&retGar.imp>0){
    P.text(totX,y,'Retencion de garantia ('+retGar.pct+'%)',{size:9,color:P.GREY});
    P.text(ML+PW,y,'-'+retGar.impStr,{size:9,font:'F2',color:P.GREY,align:'right'});y+=14;
    P.line(totX,y+2,ML+PW,y+2,P.GREY,0.8);y+=8;
    P.text(totX,y,'LIQUIDO A PERCIBIR',{size:11,font:'F2',color:P.NAVY});
    P.text(ML+PW,y,retGar.liqStr,{size:12,font:'F2',color:P.NAVY,align:'right'});y+=22;
  }

  if(isSP){checkPage(40);P.rect(ML,y,PW,26,P.YELL);P.rect(ML,y,3,26,'0.909 0.639 0.031');
    P.wrap('Inversion del sujeto pasivo — Operacion no sujeta a IVA conforme al articulo 84.Uno.2.f) de la Ley 37/1992, del IVA. El destinatario es sujeto pasivo de la operacion.',7.5,PW-20).slice(0,2).forEach((l,i)=>P.text(ML+10,y+5+i*10,l,{size:7.5,color:P.DYELL}));y+=34;}

  if(iban){checkPage(60);P.rect(ML,y,PW,44,P.LGREY);
    P.text(ML+10,y+6,'DATOS DE PAGO',{size:6.5,font:'F2',color:P.NAVY});
    P.text(ML+10,y+17,'Forma de pago: '+(formaPago||'Transferencia bancaria'),{size:8,color:P.GREY});
    P.text(ML+10,y+28,'IBAN: '+iban,{size:9.5,font:'F3',color:P.NAVY});
    if(bic)P.text(ML+PW-10,y+28,'BIC: '+bic,{size:8,color:P.GREY,align:'right'});
    y+=52;}

  if(notas){const nl=P.wrap('Observaciones: '+notas,7.5,PW-20).slice(0,4);checkPage(nl.length*10+20);P.rect(ML,y,PW,nl.length*10+10,'0.96 0.96 0.96');nl.forEach((l,i)=>P.text(ML+10,y+5+i*10,l,{size:7.5,color:P.GREY}));y+=nl.length*10+18;}

  P.line(ML,795,P.W-MR,795,P.LINE,0.7);
  // ── v360 · SELLO VERI*FACTU (QR + CSV + huella + URL), como en el HTML ──
  // Jesús (04-09-2026): «veo el QR con el CSV en la aplicación, pero no está
  // en el PDF». El QR va como rectángulos vectoriales: nítido y sin imágenes.
  if(vf&&vf.url){
    const QS=62;checkPage(QS+22);
    P.rect(ML,y,PW,0.6,'0.886 0.886 0.886');y+=8;
    if(vf.modulos&&vf.modulos.length){
      const n=vf.modulos.length,m=QS/n;
      // los módulos seguidos de una fila van en un solo rectángulo: mismo dibujo, un tercio de bytes
      for(let r=0;r<n;r++){let c=0;while(c<n){if(!vf.modulos[r][c]){c++;continue;}let c2=c;while(c2<n&&vf.modulos[r][c2])c2++;P.rect(ML+c*m,y+r*m,(c2-c)*m+0.15,m+0.15,'0 0 0');c=c2;}}
    }else{P.rect(ML,y,QS,QS,'0.93 0.93 0.93');P.text(ML+8,y+28,'QR no disponible',{size:6,color:'0.5 0.5 0.5'});}
    let ty=y+2;const tx=ML+QS+10;const tw=PW-QS-10;
    P.text(tx,ty,'VERI*FACTU · '+(vf.leyenda||''),{size:7,color:'0.25 0.25 0.25',maxW:tw});ty+=10;
    P.text(tx,ty,vf.csv?('CSV: '+vf.csv+(vf.estado?' · '+vf.estado:'')):(vf.estado||''),{size:6.8,color:'0.25 0.25 0.25',maxW:tw});ty+=10;
    P.wrap('Huella: '+(vf.huella||''),6.3,tw).slice(0,2).forEach(l=>{P.text(tx,ty,l,{size:6.3,color:'0.4 0.4 0.4',maxW:tw});ty+=9;});
    P.wrap(vf.url,6,tw).slice(0,2).forEach(l=>{P.text(tx,ty,l,{size:6,color:'0.6 0.6 0.6',maxW:tw});ty+=8;});
    y+=QS+8;
  }
  P.text(P.W/2,802,footer||'',{size:6.5,color:'0.63 0.63 0.63',align:'center',maxW:PW});
  return P;
};


// ═══ COMBOBOX (módulo) — fuera de App para que React no lo desmonte en cada keystroke ═══
const Combobox=({value,onChange,options,placeholder,style:extraStyle,color})=>{
  const [open,setOpen]=useState(false);
  const q=(value||'').toLowerCase();
  const hits=options.filter(o=>o.toLowerCase().includes(q));
  return(
    <div style={{position:'relative'}}>
      <input style={{...S.input,...(extraStyle||{})}} value={value} placeholder={placeholder}
        onChange={e=>{onChange(e.target.value);setOpen(true);}}
        onFocus={()=>setOpen(true)}
        onBlur={()=>setTimeout(()=>setOpen(false),200)}/>
      {open&&hits.length>0&&!(hits.length===1&&hits[0]===value)&&(
        <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:60,background:C.sf,border:`1px solid ${C.bd}`,borderRadius:'0 0 8px 8px',maxHeight:160,overflowY:'auto',boxShadow:'0 8px 24px rgba(0,0,0,.4)'}}>
          {hits.map(h=>(
            <div key={h} style={{padding:'10px 12px',fontSize:13,cursor:'pointer',borderBottom:`1px solid ${C.bd}22`,color:color||C.tx}}
              onMouseDown={e=>{e.preventDefault();onChange(h);setOpen(false);}}>
              {h}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const emptyForm = {extraPend:false,esAbono:false,abonoDe:null,basesExtra:[],_marcarPagada:false,fecha:today,numFactura:'',proveedor:'',proveedorCif:'',proveedorDir:'',obra:'',concepto:'',categoria:'Materiales',importeBase:'',tipoIva:21,irpf:0,fechaVencimiento:'',formaPago:'Transferencia',tipo:'factura',notas:'',refPresupuesto:'',ibanProveedor:'',esEstructural:false,proforma:false,isp:false,contratoId:null,lineas:[],base2:'',tipoIva2:10,_totalLeido:0};
const emptyPago = {fecha:today,importe:'',metodo:'Transferencia',referencia:''};

const VACIAS_MAT = new Set(['DE','DEL','LA','EL','LOS','LAS','CON','SIN','PARA','POR','Y','A','EN','UD','UDS','UNIDAD','UNIDADES','ML','M2','M3','KG','TN','L','H','HORA','HORAS','DIA','DIAS','MES','SUMINISTRO','COLOCACION','MONTAJE','INCLUIDO','INCLUIDA','SEGUN','TIPO','CLASE','REF','REFERENCIA','MARCA','MODELO','CODIGO']);

const RE_CODIGO = /\b([A-Z]{1,3}[-/]?\d{2,4}[A-Z]{0,2})\b/g;

const RE_MEDIDA=/^(M2|M3|ML|MM|CM|KG|TN|TM|UD|UDS|L|LT|H|HR|HRS|HORA|HORAS|PZ|PZA|CAJA|SACO|PALET|PALETS|BOLSA)$/;

const normMaterial=(s)=>{
  // Todo separador (guion, barra, punto) pasa a espacio: así «HA-25», «HA/25»
  // y «HA 25» acaban siendo el mismo artículo.
  const base=String(s||'')
    .toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^A-Z0-9]+/g,' ')
    .trim();
  if(!base)return '';
  const palabras=base.split(' ').filter(x=>x&&!VACIAS_MAT.has(x)&&!RE_MEDIDA.test(x));
  // Une código técnico y número cuando van seguidos: «HA» + «25» → «HA25»
  const unidas=[];
  for(let k=0;k<palabras.length;k++){
    const a=palabras[k], b=palabras[k+1];
    if(/^[A-Z]{1,3}$/.test(a)&&/^\d{1,4}$/.test(b)){ unidas.push(a+b); k++; }
    else unidas.push(a);
  }
  const unicas=[...new Set(unidas)];
  // Cuando hay un código técnico (HA25, B500S…), ese código identifica el
  // producto: da igual que el proveedor añada la especificación completa
  // «HA-25/B/20/IIa» o la abreviada «HA-25». Se toma el primer nombre y el
  // primer código, que es lo que de verdad distingue un artículo de otro.
  const RE_COD=/^[A-Z]{1,3}\d{2,4}[A-Z]{0,2}$/;
  const codigos=unicas.filter(x=>RE_COD.test(x));
  const nombres=unicas.filter(x=>/^[A-Z]{3,}$/.test(x));
  if(codigos.length&&nombres.length)return nombres[0]+' '+codigos[0];
  // Sin código técnico, los números sueltos son medidas o cantidades que
  // cambian de una factura a otra («LADRILLO 24x11x5» y «LADRILLO» son lo
  // mismo), así que se descartan y quedan solo los nombres, ordenados.
  const soloNombres=unicas.filter(x=>/^[A-Z]{2,}$/.test(x));
  return (soloNombres.length?soloNombres:unicas).sort().join(' ');
};

const lineasDeFactura=(inv)=>{
  const arr=Array.isArray(inv&&inv.lineas)?inv.lineas:[];
  return arr.map(l=>{
    const cant=+((l&&(l.q!==undefined?l.q:l.cantidad))||0);
    const pu=+((l&&(l.pu!==undefined?l.pu:l.precioUnit))||0);
    const imp=+((l&&(l.imp!==undefined?l.imp:l.importe))||0);
    // Si falta el precio unitario pero hay importe y cantidad, se deduce
    const unit=pu>0?pu:(cant>0&&imp>0?+(imp/cant).toFixed(4):0);
    return {
      desc:String((l&&(l.d||l.desc||l.descripcion))||'').slice(0,120),
      cant, pu:unit, imp:imp>0?imp:+(cant*unit).toFixed(2),
    };
  }).filter(l=>l.desc&&l.pu>0);
};

const agruparLineas=(invoices)=>{
  invoices=(Array.isArray(invoices)?invoices:[]).filter(x=>x&&typeof x==='object');
  const mapa=new Map();
  for(const inv of invoices||[]){
    if(!inv||inv._del||inv.tipo==='cobro')continue;
    const prov=String(inv.proveedor||'').trim();
    if(!prov)continue;
    for(const l of lineasDeFactura(inv)){
      const mat=normMaterial(l.desc);
      if(!mat)continue;
      const k=prov.toUpperCase()+'|'+mat;
      if(!mapa.has(k))mapa.set(k,{prov,material:mat,desc:l.desc,historia:[]});
      mapa.get(k).historia.push({
        fecha:inv.fecha||'', pu:l.pu, cant:l.cant, imp:l.imp,
        numFactura:inv.numFactura||'', invId:inv.id, desc:l.desc,
      });
    }
  }
  const salida=[];
  for(const g of mapa.values()){
    g.historia.sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)));
    salida.push(g);
  }
  return salida;
};

const evolucionPrecios=(invoices,opts)=>{
  invoices=(Array.isArray(invoices)?invoices:[]).filter(x=>x&&typeof x==='object');
  const o=opts||{};
  const minApariciones=o.minApariciones||2;
  // Filtros del Panel: por proveedor y por periodo. Se aplican a las facturas
  // antes de agrupar, para que los precios medios salgan solo del periodo pedido.
  let fuente=invoices||[];
  if(o.desde)fuente=fuente.filter(i=>String((i&&i.fecha)||'')>=o.desde);
  if(o.hasta)fuente=fuente.filter(i=>String((i&&i.fecha)||'')<=o.hasta);
  if(o.proveedor){
    const q=String(o.proveedor).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    fuente=fuente.filter(i=>String((i&&i.proveedor)||'').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(q));
  }
  const grupos=agruparLineas(fuente);
  const filas=[];
  for(const g of grupos){
    const h=g.historia;
    if(h.length<minApariciones)continue;
    // Con una sola compra (minApariciones:1) no hay «anterior»: se compara
    // consigo misma para no reventar al abrir el detalle desde el Panel.
    const ult=h[h.length-1], ant=h.length>1?h[h.length-2]:null;
    const dif=ant?+(ult.pu-ant.pu).toFixed(4):0;
    const pct=(ant&&ant.pu>0)?+((dif/ant.pu)*100).toFixed(2):0;
    const precios=h.map(x=>x.pu);
    filas.push({
      prov:g.prov, material:g.material, desc:ult.desc,
      actual:ult.pu, anterior:ant?ant.pu:ult.pu, dif, pct,
      fechaActual:ult.fecha, fechaAnterior:ant?ant.fecha:'',
      numFactura:ult.numFactura, invId:ult.invId,
      veces:h.length,
      min:Math.min(...precios), max:Math.max(...precios),
      medio:+(precios.reduce((s,x)=>s+x,0)/precios.length).toFixed(4),
      historia:h,
      tendencia:pct>0.5?'sube':(pct<-0.5?'baja':'igual'),
    });
  }
  // Primero lo que más ha variado en valor absoluto: es lo que interesa mirar
  filas.sort((a,b)=>Math.abs(b.pct)-Math.abs(a.pct));
  return filas;
};

const resumenPrecios=(invoices,opts)=>{
  invoices=(Array.isArray(invoices)?invoices:[]).filter(x=>x&&typeof x==='object');
  const filas=evolucionPrecios(invoices,opts);
  const suben=filas.filter(f=>f.tendencia==='sube');
  const bajan=filas.filter(f=>f.tendencia==='baja');
  const conLineas=(invoices||[]).filter(i=>i&&!i._del&&i.tipo!=='cobro'&&lineasDeFactura(i).length>0).length;
  return {
    filas, suben, bajan,
    igual:filas.filter(f=>f.tendencia==='igual').length,
    materiales:filas.length,
    conLineas,
    subidaMedia:suben.length?+(suben.reduce((s,f)=>s+f.pct,0)/suben.length).toFixed(2):0,
    bajadaMedia:bajan.length?+(bajan.reduce((s,f)=>s+f.pct,0)/bajan.length).toFixed(2):0,
    mayorSubida:suben.length?suben.reduce((a,b)=>a.pct>b.pct?a:b):null,
    mayorBajada:bajan.length?bajan.reduce((a,b)=>a.pct<b.pct?a:b):null,
  };
};

// ═══ DESHACER / REHACER ═══
// Solo cubre DATOS. La colocación del panel, el tema, los filtros y la pantalla
// en la que estás quedan fuera a propósito: si la flecha deshiciera también eso,
// pulsarla dejaría de ser previsible —esperas recuperar una factura y te cambia
// el color de la app—.
// Facturas y contratos se guardan solos mediante un efecto; las demás áreas
// solo se escriben cuando se llama a su función de guardado. Al deshacer se usan
// los setters directos, así que hay que escribirlas aquí a mano o el cambio se
// desharía en pantalla pero volvería en la siguiente carga.
const CLAVE_AREA={invoices:null,contratos:null,employees:'bh10-employees',flota:'bh10-flota',
  polizas:'bh10-polizas',obras:'bh10-obras',provCat:'bh10-provcat',cliCat:'bh10-clicat',remesas:'bh10-remesas',
  budgets:'bh10-budgets',n43Hist:'bh10-n43'};





function App(){
  // ── ALMACÉN FACTURAS (src/almacenes/facturas.js) ─────────────────────────
  // 44 estados. La llamada va aquí, en la posición de invoicesAll,
  // porque el useMemo de la línea siguiente lo consume. Alias: consumo intacto.
  const _alm_fac=useFacturas({emptyForm,emptyPago,today});
  const {invoicesAll,setInvoices,showForm,setShowForm,dupOk,setDupOk,editing,setEditing,form,setForm,search,setSearch,fEstado,setFEstado,fObra,setFObra,fTipo,setFTipo,fProvSel,setFProvSel,fusOrigen,setFusOrigen,pendProvSel,setPendProvSel,fusIgnoradas,setFusIgnoradas,fusCfg,setFusCfg,fusManual,setFusManual,fusDestino,setFusDestino,subView,setSubView,fProv,setFProv,focoProv,setFocoProv,focoCli,setFocoCli,expObra,setExpObra,sortMode,setSortMode,sortCol,setSortCol,sortDir,setSortDir,confirmDel,setConfirmDel,pagoModal,setPagoModal,pagoForm,setPagoForm,expandedId,setExpandedId,linkModal,setLinkModal,scanning,setScanning,selected,setSelected,showSepa,setShowSepa,sepaDate,setSepaDate,sepaSustituir,setSepaSustituir,provCat,setProvCat,cliCat,setCliCat,provModal,setProvModal,provForm,setProvForm,provApplyAll,setProvApplyAll,precioVer,setPrecioVer,archivador,setArchivador,detalleScan,setDetalleScan,docVer,setDocVer,ordenLista,setOrdenLista,persistCliCat,persistProvCat}=_alm_fac;
  const invoices=useMemo(()=>invoicesAll.filter(i=>!(i&&i._del)),[invoicesAll]);
  const [view,setView]=useState('dashboard');
  // Miembros: si el área está vetada, la vista rebota al Panel; y se publica
  // el área actual para que esLector() bloquee la edición donde no es admin.
  // v363 · el área se fija también DURANTE el render: si solo se fijara en el efecto, la primera
  // pintura de Ajustes vería el área anterior y enseñaría casillas de admin a un usuario de lectura
  try{window.__BH10_AREA=AREA_DE_VISTA[view]||'';}catch(e){}
  useEffect(()=>{try{window.__BH10_AREA=AREA_DE_VISTA[view]||'';}catch(e){}
    const a=AREA_DE_VISTA[view];
    if(a&&!puedeVer(a)){setView('dashboard');notify('⛔ No tienes acceso a esa área','error');}
  },[view]);
  useEffect(()=>{if(showForm)setDupOk(false);},[showForm]);
  // ── ALMACÉN TESORERÍA/BANCOS (src/almacenes/tesoreria.js) ────────────────
  const _alm_tes=useTesoreria();
  const {n43Res,setN43Res,n43Hist,setN43Hist,n43Gestion,setN43Gestion,
    n43Nombre,setN43Nombre,n43Pendiente,setN43Pendiente,persistN43}=_alm_tes;
  // Desglose que sale del formulario: la base principal más las que se hayan
  // añadido. Es lo que se guarda y con lo que se calcula el total.
  const desgloseForm=(f)=>{
    const l=[];
    const b1=parseNum(f.importeBase)||0;
    if(b1)l.push({base:b1,tipo:f.isp?0:(+f.tipoIva||0)});
    (f.basesExtra||[]).forEach(x=>{const b=parseNum(x.base)||0;if(b)l.push({base:b,tipo:f.isp?0:(+x.tipo||0)});});
    return l;
  };
  const [avisoTxt,setAvisoTxt]=useState(AVISO_POR_DEFECTO);
  const [avisoEdit,setAvisoEdit]=useState(false);
  const [histUI,setHistUI]=useState({atras:null,alante:null});
  const hist=useRef({pila:[],pos:-1,previo:null,ignorar:false});
  const [actEstado,setActEstado]=useState('');   // '', 'buscando', 'nueva', 'aldia'
  const [pkBusy,setPkBusy]=useState(false);
  const [zipListaBusy,setZipListaBusy]=useState(false); // v356 · «📎 ZIP» de la lista filtrada
  const [faceOn,setFaceOn]=useState(()=>{try{return !!(window.bh10FaceID&&window.bh10FaceID.activo());}catch(e){return false;}});
  const [facePass,setFacePass]=useState('');
  // ── v365 · CIERRE AUTOMÁTICO POR INACTIVIDAD (por aparato) ──────────────
  // Jesús (05-09-2026): Face ID solo actúa al abrir. Tras N minutos sin
  // tocar la app, se cierra la sesión (y se vacía la copia local). 0 = nunca.
  const [autoCierre,setAutoCierre]=useState(()=>{try{const v=parseInt(localStorage.getItem('bh10-autocierre')||'30',10);return isNaN(v)?30:v;}catch(e){return 30;}});
  const ultimaActividad=useRef(Date.now());
  useEffect(()=>{
    if(!ES_APP||!autoCierre)return;
    const toca=()=>{ultimaActividad.current=Date.now();};
    const evs=['pointerdown','keydown','touchstart','scroll'];
    evs.forEach(e=>window.addEventListener(e,toca,{passive:true}));
    const vis=()=>{if(document.visibilityState==='visible'){ if(Date.now()-ultimaActividad.current>autoCierre*60000){window.bh10Logout&&window.bh10Logout();} else toca(); }};
    document.addEventListener('visibilitychange',vis);
    const t=setInterval(()=>{if(Date.now()-ultimaActividad.current>autoCierre*60000){notify('🔒 Sesión cerrada por inactividad');window.bh10Logout&&window.bh10Logout();}},30000);
    return ()=>{evs.forEach(e=>window.removeEventListener(e,toca));document.removeEventListener('visibilitychange',vis);clearInterval(t);};
  },[autoCierre]); // eslint-disable-line
  const [anthKey,setAnthKey]=useState(''); // clave del lector IA (solo la usa la app instalada)
  // ── ALMACÉN NÓMINAS (src/almacenes/nominas.js) ───────────────────────────
  // 22 estados que estaban repartidos entre L1075 y L1267, con 64 estados de
  // otros dominios intercalados. Alias: ni una línea de consumo cambia.
  const _alm_nom=useNominas({today});
  const {empRen,setEmpRen,empNueva,setEmpNueva,employees,setEmployees,
    showEmpForm,setShowEmpForm,editingEmp,setEditingEmp,empForm,setEmpForm,
    showPayroll,setShowPayroll,payrollAmounts,setPayrollAmounts,embExcl,setEmbExcl,
    nomExcl,setNomExcl,payrollDate,setPayrollDate,payrollConcepto,setPayrollConcepto,
    payrollHistory,setPayrollHistory,nominasMes,setNominasMes,nomImport,setNomImport,
    nomBusy,setNomBusy,payrollSoloPDF,setPayrollSoloPDF,fichaEmp,setFichaEmp,
    remesas,setRemesas,expRemesa,setExpRemesa,partirRem,setPartirRem,nomView,setNomView,nomPer,setNomPer,
    payrollObras,setPayrollObras,payrollRegister,setPayrollRegister,
    persistNominas,persistRemesas}=_alm_nom;
  // Proveedor o cliente al que se ha llegado desde el buscador: se muestra solo
  // ese. Antes se desplegaba su ficha pero seguían apareciendo los otros
  // sesenta, y como el listado va por importe quedaba enterrado.
  const [loading,setLoading]=useState(true);
  const [toast,setToast]=useState(null);
  const [subirBanco,setSubirBanco]=useState(null);   // remesa recién generada, lista para llevar al banco
  const [financiacion,setFinanciacion]=useState([]);  // préstamos, leasing, renting y líneas
  const [euribor,setEuribor]=useState([]);            // valores publicados: {mes:'2026-07',valor:2.2}
  const [finVer,setFinVer]=useState(null);            // operación abierta en detalle
  const [finForm,setFinForm]=useState(null);          // alta o edición
  const [bancaUrl,setBancaUrl]=useState('https://banking.eurocajarural.es');
  const [compCfg,setCompCfg]=useState({name:'',cif:'',iban:'',bic:'',address:'',city:'',country:'ES',phone:'',email:'',regMercantil:''});
  // ── ALMACÉN CONTRATOS (src/almacenes/contratos.js) ───────────────────────
  // 18 estados repartidos en tres grupos (L1122, L1356 y L1374). Alias.
  // ── traspasos entre empresas del grupo (lógica en src/traspasos.js) ──────
  const guardarEmpresaGrupo=()=>{
    if(soloLector())return;
    const err=empresaValida(grupoForm);
    if(err){notify(err,'error');return;}
    const lim={nombre:String(grupoForm.nombre||'').trim(),cif:String(grupoForm.cif||'').trim().toUpperCase(),
      iban:normIban(grupoForm.iban),bic:String(grupoForm.bic||'').trim().toUpperCase()};
    const next=grupoModal==='new'
      ? [...grupo,{id:uid(),...lim}]
      : grupo.map(e=>e.id===grupoModal?{...e,...lim}:e);
    persistGrupo(next);setGrupoModal(null);
    notify(grupoModal==='new'?'✓ Empresa del grupo añadida':'✓ Empresa actualizada');
  };
  const borrarEmpresaGrupo=(id)=>{if(soloLector())return;persistGrupo(grupo.filter(e=>e.id!==id));notify('Empresa quitada del grupo');};
  const nuevoTraspaso=()=>{
    if(!grupo.length){notify('Primero da de alta la otra empresa del grupo','error');return;}
    setTraspForm({empresaId:'',beneficiario:'',concepto:CONCEPTO_POR_DEFECTO,importe:''});
    setTraspModal('new');
  };
  const generarTraspaso=(emp)=>{
    if(soloLector())return;
    const err=validarTraspaso({empresa:emp,importe:traspForm.importe,ordenante:compCfg});
    if(err){notify(err,'error');return;}
    const imp=parseImporte(traspForm.importe);
    const fecha=today;
    const msgId='GRUP'+fecha.replace(/-/g,'')+Date.now().toString(36).toUpperCase().slice(-5);
    const xml=construirC34Traspaso({ordenante:compCfg,empresa:emp,importe:traspForm.importe,
      concepto:traspForm.concepto,fecha,ahora:new Date().toISOString().slice(0,19),msgId});
    const fichero=`SEPA_GRUPO_${fecha}_${imp.toFixed(2).replace('.',',')}.xml`;
    shareOrDownload(xml,fichero,'application/xml;charset=utf-8').then(res=>{
      if(res==='cancelled'||res==='failed'){notify(res==='failed'?'No se pudo generar el fichero':'Generación cancelada — nada registrado','error');return;}
      // El apunte solo se hace si la descarga se consuma, igual que en la
      // remesa de proveedores: si cancelas, no queda rastro.
      // Se apunta con el MISMO logRemesa que proveedores y nóminas, para que
      // salga en RemesasList y quede en bh10-remesas como las demás.
      logRemesa({tipo:'grupo',fechaEjec:fecha,msgId,fichero,nbTxs:1,total:imp,
        txns:[{nombre:emp.nombre,iban:emp.iban,importe:imp,concepto:String(traspForm.concepto||'').trim()}]});
      persistTraspasos(apuntarTraspaso(traspasos,{empresa:emp,importe:traspForm.importe,
        concepto:traspForm.concepto,fecha,fichero,msgId}));
      setTraspModal(null);
      setSubirBanco({fichero,n:1,total:imp,fecha});
    });
  };
  // ── ALMACÉN TRASPASOS (src/almacenes/traspasos.js) ───────────────────────
  const _alm_tra=useTraspasos({CONCEPTO_POR_DEFECTO});
  const {grupo,setGrupo,traspasos,setTraspasos,traspModal,setTraspModal,
    traspForm,setTraspForm,grupoModal,setGrupoModal,grupoForm,setGrupoForm,
    persistGrupo,persistTraspasos}=_alm_tra;
  const _alm_con=useContratos({today,emptyObra});
  const {budgets,setBudgets,editBudget,setEditBudget,budgetAmt,setBudgetAmt,contratos,setContratos,obras,setObras,obraModal,setObraModal,obraForm,setObraForm,showContratoForm,setShowContratoForm,editingContrato,setEditingContrato,conView,setConView,conOrden,setConOrden,contratoForm,setContratoForm,showCertModal,setShowCertModal,certPct,setCertPct,certNumF,setCertNumF,certLin,setCertLin,showNuevoTipo,setShowNuevoTipo,certDesc,setCertDesc,persistObras}=_alm_con;
  // Ficha de cliente: el equivalente de la de proveedor. Sus datos fiscales
  // vivían sueltos dentro de cada contrato, así que había que buscarlos en uno
  // anterior o volver a escribirlos en cada presupuesto y cada factura.
  // El registro de cesiones no es un adorno: el RGPD exige poder demostrar qué
  // se cedió, a quién y cuándo. Sin esto, «se lo mandamos al banco» no se puede
  // acreditar, ni se puede avisar a nadie si hay que rectificar algo.
  const leerCesiones=()=>{try{return listaSegura(JSON.parse(localStorage.getItem('bh10-cesiones')||'[]'),'cesiones');}catch(e){return [];}};
  const anotarCesion=(entidad,nombres)=>{
    const reg={fecha:new Date().toISOString(),entidad:String(entidad||'').slice(0,80),
      n:nombres.length,clientes:nombres.slice(0,60),
      usuario:((typeof window!=='undefined'&&window.bh10Diag&&window.bh10Diag().correo)||'')};
    try{
      const l=[...leerCesiones(),reg].slice(-200);
      localStorage.setItem('bh10-cesiones',JSON.stringify(l));
      window.storage.set('bh10-cesiones',JSON.stringify(l)).catch(()=>{});
      return l;
    }catch(e){return leerCesiones();}
  };
  // Un solo empaquetador para todo lo que sale de la app. Antes el paquete de
  // gestoría se armaba con una librería y el expediente de notaría con otra, así
  // que la contraseña solo existía en uno de los dos. Ahora hay una única forma
  // de hacer un zip, y proteger es marcar una casilla.
  // Cifrado clásico por defecto: se probó que un zip AES no lo abre ni el
  // descompresor de Windows ni el de Mac ni con la clave correcta, y quien no
  // puede abrirlo acaba pidiendo que se lo mandes sin proteger, que es peor.
  const crearZipSeguro=async(entradas,{clave,fuerte}={})=>{
    const {ZipWriter,BlobWriter,TextReader,Uint8ArrayReader}=await import('@zip.js/zip.js');
    const opciones=clave?(fuerte?{password:clave,encryptionStrength:3}:{password:clave,zipCrypto:true}):{};
    const w=new ZipWriter(new BlobWriter('application/zip'),opciones);
    for(const e of (Array.isArray(entradas)?entradas:[])){
      if(!e||!e.nombre)continue;
      try{
        if(e.texto!==undefined)await w.add(e.nombre,new TextReader(String(e.texto)));
        else if(e.bytes)await w.add(e.nombre,new Uint8ArrayReader(
          e.bytes instanceof Uint8Array?e.bytes:new Uint8Array(e.bytes)));
      }catch(x){}
    }
    return await w.close();
  };
  // De un texto en base64 (una foto, un PDF) a los bytes que espera el zip
  const bytesDeBase64=(b64)=>{
    const bin=atob(String(b64).split(',').pop());
    const u=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
    return u;
  };
  // Arma el zip en el momento con lo que haya AHORA. Cifrado clásico por
  // defecto: se probó que un zip AES no lo abre ni el descompresor estándar de
  // Linux ni el de Windows, y una notaría que no puede abrirlo acaba pidiendo
  // que se lo mandes sin proteger, que es peor.
  const generarExpediente=async(datos)=>{
    const {ficha,exp,clave,fuerte,notaria}=datos;
    setExpBusy(true);
    try{
      const entradas=[];

      const lineas=[
        'EXPEDIENTE PARA NOTARÍA',
        '='.repeat(60),'',
        'Remitente: '+(compCfg.name||marcaDoc())+(compCfg.cif?' · '+compCfg.cif:''),
        'Fecha de envío: '+fmtDate(today),
        notaria.nombre?'Destinatario: '+notaria.nombre:'',
        exp.contrato?('Operación: '+(exp.contrato.numero||'')+' · '+(exp.contrato.obra||'')):'',
        ficha.viviendaReservada?'Vivienda: '+ficha.viviendaReservada:'',
        '','TITULARES','-'.repeat(60),
      ].filter(Boolean);
      exp.titulares.forEach((t,i)=>{
        lineas.push('',(i===0?'Titular 1 (a su nombre se factura)':'Titular '+(i+1)));
        [['Nombre y apellidos',t.nombre],['DNI / NIE',t.dni],['Fecha de nacimiento',t.nacimiento?fmtDate(t.nacimiento):''],
         ['Nacionalidad',t.nacionalidad],['Estado civil',t.estadoCivil],['Régimen económico',t.regimen],
         ['Teléfono',t.telefono],['Correo',t.email],
         ['Domicilio',[t.dir||ficha.dir,[t.cp||ficha.cp,t.municipio||ficha.municipio].filter(Boolean).join(' '),t.provincia||ficha.provincia].filter(Boolean).join(', ')],
        ].forEach(([k,v])=>{ if(String(v||'').trim())lineas.push('  '+k.padEnd(22)+': '+v); });
      });
      lineas.push('','DOCUMENTOS ADJUNTOS','-'.repeat(60));

      // Las imágenes se traen de la custodia, no de ninguna copia guardada
      let n=0;
      for(const d of exp.imagenes){
        try{
          const b64=await window.bh10Dni.ver(d.id);
          if(!b64)continue;
          const bytes=bytesDeBase64(b64);
          const quien=(d.nombreTitular||('titular'+((+d.titular||0)+1))).replace(/[^\w\sáéíóúñÁÉÍÓÚÑ-]/g,'').trim().replace(/\s+/g,'_');
          const nom='DNI/'+quien+'_'+(d.cara==='dniA'?'anverso':'reverso')+'.jpg';
          entradas.push({nombre:nom,bytes});
          lineas.push('  '+nom);
          n++;
        }catch(e){}
      }
      if(!n)lineas.push('  (ninguno)');
      lineas.push('','Documento generado por '+(compCfg.name||marcaDoc())+' el '+fmtDate(today)+'.',
        'Contiene datos personales: trátese conforme al RGPD y destrúyase cuando deje de ser necesario.');

      entradas.unshift({nombre:'LEEME.txt',texto:lineas.join('\r\n')});
      const blob=await crearZipSeguro(entradas,{clave,fuerte});
      const idArch=(exp.contrato&&(exp.contrato.numero||exp.contrato.obra))
        ? String(exp.contrato.numero||exp.contrato.obra)
        : String(ficha.nombre||'cliente');
      const nombreArch='expediente_'+idArch.replace(/[^\w]+/g,'_').slice(0,40)+'_'+today+'.zip';
      await shareOrDownload(blob,nombreArch,'application/zip');

      // Queda registrado a quién se entregó, igual que con los bancos
      const reg=anotarCesion('NOTARÍA · '+(notaria.nombre||notaria.email||'sin indicar'),
        exp.titulares.map(t=>t.nombre).filter(Boolean));
      notify(`📦 Expediente de ${n} documento${n!==1?'s':''} generado · queda registrado`);
      return {nombreArch,n,reg};
    }catch(e){
      notify('No se pudo generar: '+((e&&e.message)||e),'error');
      return null;
    }finally{setExpBusy(false);}
  };
  const [dashFrom,setDashFrom]=useState('');
  const [dashTo,setDashTo]=useState('');
  const [kpiDetail,setKpiDetail]=useState(null); // {title,list}
  const [kpiCfg,setKpiCfg]=useState({orden:[],ancho:{}}); // colocación del Panel elegida por el usuario
  const [kpiEdit,setKpiEdit]=useState(false);
  const [kpiDrag,setKpiDrag]=useState(null);
  const [precioFiltro,setPrecioFiltro]=useState({prov:'',orden:'gasto'});
  const [showSearch,setShowSearch]=useState(false);
  const lupaRef=useRef(null);
  const lupaInputRef=useRef(null);
  useEffect(()=>{
    if(!showSearch)return;
    const el=lupaRef.current, vv=window.visualViewport;
    const ajusta=()=>{
      try{window.scrollTo(0,0);}catch(e){}
      if(el&&vv){el.style.top=vv.offsetTop+'px';el.style.height=vv.height+'px';el.style.bottom='auto';}
    };
    ajusta();
    const t1=setTimeout(ajusta,120), t2=setTimeout(ajusta,350);
    const tf=setTimeout(()=>{try{lupaInputRef.current&&lupaInputRef.current.focus({preventScroll:true});}catch(e){}},60);
    if(vv){vv.addEventListener('resize',ajusta);vv.addEventListener('scroll',ajusta);}
    return ()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(tf);if(vv){vv.removeEventListener('resize',ajusta);vv.removeEventListener('scroll',ajusta);}};
  },[showSearch]);
  // Recalcula la altura de la aplicación. Se expone para poder invocarla al
  // cerrar pantallas completas: al salir de ellas, iOS a veces deja el visor
  // con una medida corta y la barra inferior se queda a media pantalla.
  const reajustarAltura=()=>{
    const el=document.getElementById('bh-root');
    if(!el)return;
    // contador de diagnóstico: cuántas veces se ha medido la pantalla
    try{window.__bh10Ajustes=(window.__bh10Ajustes||0)+1;}catch(e){}
    const vv=window.visualViewport;
    const a=document.activeElement;
    const foco=!!(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName));
    // App instalada: manda el CSS (100dvh). Medirlo a mano dejaba la barra
    // inferior a media pantalla cuando iOS devolvía un valor rancio.
    // Navegador (Safari): hay que medir SIEMPRE. Safari dibuja la página por
    // debajo de su propia barra flotante, así que el final de 100dvh queda
    // tapado y la barra inferior de la app se pierde de vista.
    const medir=!!vv&&(!esStandalone()||foco);
    if(!medir){
      // escribir el mismo valor otra vez también obliga a recalcular: se omite
      if(el.style.height||el.style.top||el.style.bottom){el.style.height='';el.style.top='';el.style.bottom='';}
      return;
    }
    // Safari con barra flotante: se mide y se fija alto; el resto del tiempo
    // manda el CSS (top:0/bottom:0), que llega siempre al borde de la pantalla.
    const altoVis=Math.round(vv.height), arribaVis=Math.round(vv.offsetTop||0);
    if(altoVis<220)return;   // medida imposible: mejor no tocar nada
    if(el.style.height===altoVis+'px'&&el.style.top===arribaVis+'px')return; // ya está así
    el.style.top=arribaVis+'px';
    el.style.height=altoVis+'px';
    el.style.bottom='auto';
  };
  const reajustarPronto=()=>{ reajustarAltura(); [60,180,400].forEach(ms=>setTimeout(reajustarAltura,ms)); };

  useEffect(()=>{
    const vv=window.visualViewport; if(!vv)return;
    const hayFoco=()=>{const a=document.activeElement;return !!(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName));};
    // El scroll llega a decenas de eventos por segundo. Medir en cada uno
    // obliga al navegador a recalcular la página y se come la batería; se
    // agrupan todos los del mismo fotograma en una única medición.
    let pedido=0;
    const raiz=()=>{ if(pedido)return; pedido=requestAnimationFrame(()=>{pedido=0;reajustarAltura();}); };
    reajustarAltura();
    const reajusta=()=>{raiz();[60,200,450,900].forEach(ms=>setTimeout(raiz,ms));};
    // Al guardarse el teclado, iOS deja el desplazamiento de la página donde
    // lo subió y la app queda medio fuera: pantalla "en blanco" hasta que el
    // usuario toca. Si ya no hay campo con foco, se devuelve la página a 0.
    const alCerrarTeclado=()=>{ setTimeout(()=>{ if(!hayFoco()){ try{window.scrollTo(0,0);}catch(e){} raiz(); } },80);
      setTimeout(()=>{ if(!hayFoco()){ try{window.scrollTo(0,0);}catch(e){} } },350); };
    const t=setTimeout(raiz,300);
    vv.addEventListener('resize',raiz);vv.addEventListener('scroll',raiz);
    window.addEventListener('orientationchange',reajusta);
    window.addEventListener('pageshow',reajusta);
    document.addEventListener('focusout',reajusta,true);
    document.addEventListener('focusout',alCerrarTeclado,true);
    document.addEventListener('visibilitychange',reajusta);
    return ()=>{clearTimeout(t);if(pedido)cancelAnimationFrame(pedido);vv.removeEventListener('resize',raiz);vv.removeEventListener('scroll',raiz);window.removeEventListener('orientationchange',reajusta);window.removeEventListener('pageshow',reajusta);document.removeEventListener('focusout',reajusta,true);document.removeEventListener('focusout',alCerrarTeclado,true);};
  },[]);
  const [fabOpen,setFabOpen]=useState(false);
  const [globalQ,setGlobalQ]=useState('');
  const [tema,setTema]=useState('oscuro');
  const [paleta,setPaleta]=useState('bioh');
  const [fMes,setFMes]=useState(false);
  // v354 · filtro «📎 Sin doc»: recibidas fiscales sin documento válido (sin
  // enlace, enlace que la app no entiende, o sin confirmar en la nube).
  const [fSinDoc,setFSinDoc]=useState(false);
  const docEstado=(i)=>{
    if(!esGastoFiscal(i))return '';
    if(!i.adjPath||!esquemaEnlace(i.adjPath).ok)return 'falta';
    if(i.adjNube===false)return 'nube';
    return 'ok';
  };
  const modoEfectivo=(t)=>t==='auto'?((new Date().getHours()>=8&&new Date().getHours()<20)?'claro':'oscuro'):t;
  // Lo necesitan los estilos globales para decirle al navegador de qué color
  // debe pintar lo que dibuja él: desplegables, calendarios y barras.
  const esOscuro=modoEfectivo(tema)==='oscuro';
  const cambiarTema=(t)=>{aplicarTema(modoEfectivo(t),paleta);setTema(t);try{window.storage.set('bh10-tema',t);}catch(e){}};
  const cambiarPaleta=(p)=>{aplicarTema(modoEfectivo(tema),p);setPaleta(p);try{window.storage.set('bh10-paleta',p);}catch(e){}};
  // ── ALMACÉN SEGUROS/FLOTA (src/almacenes/seguros.js) ──────────────────────
  // Los nombres se re-exponen con alias: ni una sola línea de consumo cambia.
  const _alm_seguros=useSeguros({emptyVeh,emptyPoliza});
  const {flota,setFlota,flotaModal,setFlotaModal,flotaForm,setFlotaForm,flotaView,setFlotaView,
    polizas,setPolizas,polModal,setPolModal,polFiltro,setPolFiltro,polOrden,setPolOrden,
    polMasFiltros,setPolMasFiltros,polImport,setPolImport,copiarSeg,setCopiarSeg,
    polForm,setPolForm,lastBaja,setLastBaja,verBajas,setVerBajas,bajaTimer,
    persistFlota,persistPolizas}=_alm_seguros;
  const [fq,setFq]=useState(Math.floor(new Date().getMonth()/3));
  const [fy,setFy]=useState(new Date().getFullYear());
  const [storageOk,setStorageOk]=useState(true);
  const [vincModal,setVincModal]=useState(null);
  const [buzon,setBuzon]=useState([]);
  const [buzonBusy,setBuzonBusy]=useState('');
  const [pkPeriodo,setPkPeriodo]=useState(null);
  // Chequeo previo del paquete: {nube:{vistos,total,malos:[{inv,motivo}]}|null, gmail:{en,resultados:[{inv,estado,motivo,candidatos}]}|null}
  const [pkCheq,setPkCheq]=useState(null);
  const [masPago,setMasPago]=useState(null);
  const [ayudaVer,setAyudaVer]=useState(null);
  const [xlsPago,setXlsPago]=useState('pendiente');
  const [cifFix,setCifFix]=useState(null);
  const [docPreview,setDocPreview]=useState(null); // {html,filename} para visor de factura
  const [batchFiles,setBatchFiles]=useState([]); // lote de facturas escaneadas
  const [batchTipo,setBatchTipo]=useState('factura'); // 'factura' recibidas | 'cobro' emitidas
  const [lotePagadas,setLotePagadas]=useState(false); // marcar como pagadas al registrar el lote
  const [batchReviewIdx,setBatchReviewIdx]=useState(null); // índice en revisión

  const SEED_EMP=[]; // semilla VACIADA: la plantilla vive solo en la nube protegida
  const SEED_EMPLOYEES=SEED_EMP.map((e,i)=>({id:'e'+String(i+1).padStart(2,'0'),nombre:e[0],iban:e[1],bic:e[2],importeBase:e[3],direccion:e[4],cp:e[5],activo:true}));
  const SEED_COMPANY = {name:'',cif:'',iban:'',bic:'',address:'',city:'',country:'ES'}; // vaciada: la ficha real vive en la nube (bh10-company-v2)

  // Latido de la sesión: última actividad + obediencia al cierre remoto
  useEffect(()=>{
    const late=async()=>{
      try{
        let lista=[];
        try{const rs=await window.storage.get('bh10-sesiones');lista=rs?.value?JSON.parse(rs.value):[];}catch(e){return;}
        if(!Array.isArray(lista))return;
        const mia=lista.find(s=>s&&s.id===SESION_ID);
        if(mia&&mia.revocada){setSesionRevocada(true);return;}
        if(mia){mia.ultimo=new Date().toISOString();
          try{const d=await dispositivoActual();if(d&&d!==mia.disp)mia.disp=d;}catch(e){}
          await window.storage.set('bh10-sesiones',JSON.stringify(lista));
          setSesionesApp(lista);}
      }catch(e){}
    };
    const t0=setTimeout(late,30*1000); // primer latido pronto: obediencia rápida al cierre remoto
    const t=setInterval(late,4*60*1000);
    return ()=>{clearTimeout(t0);clearInterval(t);};
  },[]);

  // ═══ PERSISTENCIA ROBUSTA ═══
  // Refs para evitar que el efecto de guardado sobreescriba datos al montar.
  // Patrón: el save-effect se salta su PRIMERA invocación (la del montaje),
  // así nunca puede escribir [] antes de que la carga async termine.
  const invSaveReady  = useRef(false);
  const ctSaveReady   = useRef(false);
  const loadedRef     = useRef(false);
  // v344: «no había nada» ≠ «no se pudo leer». Si la lectura de una lista con
  // autoguardado LANZA (valor corrupto, fallo de red), armar el autoguardado
  // escribiría la lista vacía encima de la nube al primer cambio del usuario.
  const invLecturaMal = useRef(false);
  const ctLecturaMal  = useRef(false);
  const batchCancelRef = useRef(false);
  const difFacturas = useRef(crearGuardadoDiferido('bh10-fc-v3',700));
  // v360 · el generador de QR se carga al arrancar para que el sello VERI*FACTU del PDF salga en síncrono
  useEffect(()=>{vfCargarQR();},[]);
  // ── DIARIO PERMANENTE DE PAGOS (v359) ────────────────────────────────────
  // Se alimenta del propio guardado de facturas: foto de los pagos antes y
  // después de cada cambio. Las pantallas solo ponen origenCambio.
  const [diario,setDiario]=useState([]);
  const difDiario=useRef(crearGuardadoDiferido('bh10-diario',1500));
  const fotoPagosRef=useRef(null);
  const origenCambio=useRef('edición');
  const difContratos = useRef(crearGuardadoDiferido('bh10-contratos',700));
  const detalleCancelRef = useRef(false); // parar la relectura de archivadas

  // ── ESTILO GLOBAL DE PÁGINA (fondo, hovers, focus) ──
  useEffect(()=>{
    // El fondo del documento va del color de la barra, no del contenido: si iOS
    // deja una franja muerta abajo, se ve como si la barra llegara al borde en
    // vez de flotar sobre un rectángulo blanco.
    document.documentElement.style.background=C.sf;
    document.body.style.background=C.sf;
    document.body.style.margin='0';
    // Se reutiliza el mismo elemento y se REESCRIBE. Antes solo se creaba la
    // primera vez, así que al pasar de día a noche los estilos se quedaban con
    // los colores del tema anterior.
    {
      let st=document.getElementById('bh10-global-css');
      if(!st){st=document.createElement('style');st.id='bh10-global-css';document.head.appendChild(st);}
      st.textContent=`
        *{box-sizing:border-box}
        html,body{height:100%;overflow:hidden;width:100%;max-width:100%;overscroll-behavior:none;-webkit-text-size-adjust:100%}
        /* v392 · el contenedor que desplaza la app no puede moverse en horizontal:
           un elemento demasiado ancho se recorta, la pantalla ya no se descoloca */
        #bh-main{overflow-x:hidden}
        #bh-root{position:fixed;top:0;left:0;right:0;bottom:calc(-1 * var(--bh-bajar,0px))}
        /* Franja que iOS reserva bajo el indicador de inicio. Se declara como
           variable para poder usarla en estilos en línea: Safari descarta un
           min(env(...)) escrito directamente en el atributo style. */
        :root{--bh-safe-b:env(safe-area-inset-bottom)}
        @supports (padding-bottom: min(1px, env(safe-area-inset-bottom))){:root{--bh-safe-b:min(env(safe-area-inset-bottom),20px)}}
        button{transition:filter .15s ease, transform .06s ease}
        button:hover:not(:disabled){filter:brightness(1.14)}
        button:active:not(:disabled){transform:scale(.98)}
        input:focus,select:focus,textarea:focus{outline:2px solid ${C.in}55;outline-offset:0;border-color:${C.in}!important}
        ::selection{background:${C.in}66}
        *{-webkit-tap-highlight-color:transparent}
        .bh-nav{scrollbar-width:none}.bh-nav::-webkit-scrollbar{display:none}
        ::-webkit-scrollbar{width:10px;height:10px}
        ::-webkit-scrollbar-thumb{background:${C.bd};border-radius:5px}
        ::-webkit-scrollbar-track{background:transparent}
        /* Latido al pulsar fuera de una ventana: la app responde sin cerrarla,
           para que quede claro que se cierra por la ✕ y no por descuido */
        @keyframes bhLatido{0%{transform:scale(1)}35%{transform:scale(1.022)}70%{transform:scale(.995)}100%{transform:scale(1)}}
        /* Los desplegables los dibuja el navegador, no la app. En modo noche
           salían con letra oscura sobre fondo oscuro e ilegibles. color-scheme
           le dice al navegador de qué color va todo esto —también el calendario
           de las fechas y las barras de desplazamiento—, y el option se pinta
           además a mano para los navegadores que no le hacen caso. */
        html{color-scheme:${esOscuro?'dark':'light'}}
        select,option,input,textarea{color-scheme:${esOscuro?'dark':'light'}}
        select option{background:${C.sf};color:${C.tx}}
        select optgroup{background:${C.sf};color:${C.mt}}
      `;
    }
  },[C.bg,C.tx,C.sf,C.bd,C.mt,esOscuro]);

  // ── CARGA INICIAL (una sola vez) ──
  useEffect(()=>{(async()=>{
    try{
      let invArr=[];try{const r=await window.storage.get('bh10-fc-v3');if(r?.value)invArr=JSON.parse(r.value);}catch(e){invLecturaMal.current=true;/* leer falló: NO es «primer uso» — el autoguardado queda desarmado */}
      let fcSeeded=false;try{const sd=await window.storage.get('bh10-fcseed');fcSeeded=!!sd?.value;}catch(e){}
      const _yaFacturas=await hayDatos('bh10-fc-v3');
      if(!fcSeeded&&permitirSiembra()&&nubeConfirmada()&&!_yaFacturas){
        const norm=(s)=>String(s||'').toUpperCase().replace(/\s+/g,' ').trim();
        const kInv=(i)=>norm(i.proveedor)+'|'+norm(i.numFactura)+'|'+(+i.total||0).toFixed(2)+'|'+(i.fecha||'');
        const seen=new Set(invArr.map(kInv));
        const nuevos=buildSeedFC().filter(i=>{const k=kInv(i);if(seen.has(k))return false;seen.add(k);return true;});
        if(nuevos.length)invArr=[...invArr,...nuevos];
        window.storage.set('bh10-fc-v3',JSON.stringify(invArr)).catch(()=>{});
        try{
          let pcArr=[];try{const pc0=await window.storage.get('bh10-provcat');if(pc0?.value)pcArr=JSON.parse(pc0.value);}catch(e){}
          const have=new Set(pcArr.map(p=>String(p.nombre||'').toUpperCase().trim()));
          const nuevosP=SEED_PROVCAT.filter(p=>!have.has(p.nombre.toUpperCase()));
          if(nuevosP.length)window.storage.set('bh10-provcat',JSON.stringify([...pcArr,...nuevosP])).catch(()=>{});
        }catch(e){}
        window.storage.set('bh10-fcseed','1').catch(()=>{});
      }
      setInvoices(listaSegura(invArr,'facturas'));
    }catch(e){}
    try{const c=await window.storage.get('bh10-company-v2');if(c?.value)setCompCfg(JSON.parse(c.value));else if(permitirSiembra()&&nubeConfirmada()){setCompCfg(SEED_COMPANY);await window.storage.set('bh10-company-v2',JSON.stringify(SEED_COMPANY)).catch(()=>{});}}catch(e){if(permitirSiembra()&&nubeConfirmada())setCompCfg(SEED_COMPANY);}
    try{const em=await window.storage.get('bh10-employees');if(em?.value)setEmployees(listaSegura(JSON.parse(em.value),'employees'));else if(permitirSiembra()&&nubeConfirmada()){setEmployees(SEED_EMPLOYEES);await window.storage.set('bh10-employees',JSON.stringify(SEED_EMPLOYEES)).catch(()=>{});}}catch(e){if(permitirSiembra()&&nubeConfirmada())setEmployees(SEED_EMPLOYEES);}
    try{const bg=await window.storage.get('bh10-budgets');if(bg?.value)setBudgets(objetoSeguro(JSON.parse(bg.value)));}catch(e){}
    try{const ph=await window.storage.get('bh10-payroll-hist');if(ph?.value)setPayrollHistory(JSON.parse(ph.value));}catch(e){}
    try{const nm=await window.storage.get('bh10-nominas');if(nm?.value)setNominasMes(JSON.parse(nm.value));}catch(e){}
    try{const ct=await window.storage.get('bh10-contratos');if(ct?.value)setContratos(listaSegura(JSON.parse(ct.value),'contratos'));}catch(e){ctLecturaMal.current=true;}
    try{const ob=await window.storage.get('bh10-obras');if(ob?.value)setObras(listaSegura(JSON.parse(ob.value),'obras'));}catch(e){}
    try{const dv=await window.storage.get('bh10-docsventa');if(dv?.value)setDocsVenta(listaSegura(JSON.parse(dv.value),'docsventa'));}catch(e){}
    // flArr vive fuera del try: declarada dentro, dejaba de existir al salir del
    // bloque y la migración de seguros de vehículo reventaba en silencio, sin
    // crear ninguna póliza. El try/catch se tragaba el error.
    let flArr=[];
    try{
      try{const fl=await window.storage.get('bh10-flota');if(fl?.value)flArr=JSON.parse(fl.value);}catch(e){}
      let seeded=false;try{const sd=await window.storage.get('bh10-flotaseed');seeded=!!sd?.value;}catch(e){}
      if(!seeded&&permitirSiembra()&&nubeConfirmada()){
        const mats=new Set(flArr.map(v=>String(v.matricula||'').toUpperCase().replace(/[^A-Z0-9]/g,'')));
        const nuevos=SEED_FLOTA.filter(v=>!mats.has(v.matricula));
        if(nuevos.length)flArr=[...flArr,...nuevos];
        window.storage.set('bh10-flota',JSON.stringify(flArr)).catch(()=>{});
        window.storage.set('bh10-flotaseed','1').catch(()=>{});
      }
      setFlota(listaSegura(flArr));
    }catch(e){}
    try{
      // leidoOk distingue «no había nada» de «no se pudo leer». Sin esa
      // distinción, una lectura fallida se confunde con una lista vacía y lo
      // que se escriba después borra lo que sí había. Así se perdieron las
      // pólizas al migrar: la migración guardaba partiendo de una lista vacía.
      let plArr=null, leidoOk=false;
      try{const pl=await window.storage.get('bh10-polizas');if(pl?.value){plArr=JSON.parse(pl.value);leidoOk=true;}else leidoOk=true;}catch(e){}
      if(plArr===null){if(leidoOk&&permitirSiembra()&&nubeConfirmada()){plArr=SEED_POLIZAS;window.storage.set('bh10-polizas',JSON.stringify(plArr)).catch(()=>{});}else plArr=[];}
      // Los seguros de los vehículos ya NO se convierten solos al arrancar.
      // Se hacía así y una lectura fallida acabó escribiendo una lista vacía
      // sobre las pólizas buenas. Ahora es un botón: se ve lo que va a pasar y
      // se confirma. El arranque no escribe nada.
      setPolizas(listaSegura(plArr));
    }catch(e){}
    try{const fi=await window.storage.get('bh10-fusignore');if(fi?.value)setFusIgnoradas(JSON.parse(fi.value));}catch(e){}
    try{const cfi=await window.storage.get('bh10-clifusignore');if(cfi?.value)setCliFusIgn(JSON.parse(cfi.value));}catch(e){}
    try{const ak=await window.storage.get('bh10-anthkey');if(ak?.value)setAnthKey(ak.value);}catch(e){}
    try{const mc=await window.storage.get('bh10-mastercfg');if(mc?.value)setMasterCfg(JSON.parse(mc.value));}catch(e){}
    try{const su=await window.storage.get('bh10-usuarios');if(su?.value)setUsuariosApp(JSON.parse(su.value));}catch(e){}
    try{
      let lista=[];
      try{const rs=await window.storage.get('bh10-sesiones');lista=rs?.value?JSON.parse(rs.value):[];}catch(e){lista=[];}
      if(!Array.isArray(lista))lista=[];
      const ahora=new Date().toISOString();
      lista=lista.filter(s=>s&&s.id).slice(-39);
      let ipReal='—';
      try{const mc0=await window.storage.get('bh10-mastercfg');const cf=mc0?.value?JSON.parse(mc0.value):null;
        if(cf&&cf.url){const rip=await Promise.race([fetch(String(cf.url).replace(/\/$/,'')+'/ip').then(r=>r.json()),new Promise((_,rj)=>setTimeout(rj,900))]);
          if(rip&&rip.ip)ipReal=rip.ip;}}catch(e){}
      lista.push({id:SESION_ID,disp:await dispositivoActual(),ip:ipReal,inicio:ahora,ultimo:ahora,revocada:false});
      await window.storage.set('bh10-sesiones',JSON.stringify(lista));
      setSesionesApp(lista);
    }catch(e){}
    try{const uc=await window.storage.get('bh10-ultimacopia');
      if(uc?.value){setUltimaCopia(uc.value);
        const d=diasDesde(uc.value);
        if(d!==null&&d>35)setTimeout(()=>notify('📦 Hace '+d+' días de tu última copia completa — Ajustes → Copia de seguridad'),3500);
      }else setTimeout(()=>notify('📦 Aún no has hecho ninguna copia completa v9 — Ajustes → Copia de seguridad'),4500);
    }catch(e){}
    try{const pc=await window.storage.get('bh10-promocfg');if(pc?.value)setPromoCfg(JSON.parse(pc.value));}catch(e){}
    try{const rc=await window.storage.get('bh10-recurrentes');if(rc?.value){const d=JSON.parse(rc.value)||{};
      setRecDatos({reglas:Array.isArray(d.reglas)?d.reglas:[],
        movs:(Array.isArray(d.movs)?d.movs:[]).map(m=>({fecha:m.fecha||m.f||'',concepto:m.concepto||m.c||'',importe:+(m.importe!==undefined?m.importe:m.i)||0})).filter(m=>m.fecha)});}}catch(e){}
    try{const bu=await window.storage.get('bh10-banca');if(bu?.value)setBancaUrl(bu.value);}catch(e){}
    // traspasos entre empresas del grupo (cada empresa, su lista)
    try{const g=await window.storage.get('bh10-grupo');if(g?.value)setGrupo(listaSegura(JSON.parse(g.value)));}catch(e){}
    try{const t2=await window.storage.get('bh10-traspasos');if(t2?.value)setTraspasos(listaSegura(JSON.parse(t2.value)));}catch(e){}
    try{const ui=await window.storage.get('bh10-usoia');if(ui?.value){const j=JSON.parse(ui.value);setUsoIA(j);usoRef.current=j;}}catch(e){}
    try{const vc=await window.storage.get('bh10-vfcfg');if(vc?.value)setVfCfg({...VF_CFG_POR_DEFECTO,...JSON.parse(vc.value)});}catch(e){}
    try{const vr=await window.storage.get('bh10-vfregistros');if(vr?.value){const j=listaSegura(JSON.parse(vr.value));setVfRegistros(j);vfRegRef.current=j;}}catch(e){}
    try{const ve=await window.storage.get('bh10-vfeventos');if(ve?.value)setVfEventos(listaSegura(JSON.parse(ve.value),'vfeventos'));}catch(e){}
    try{const fi=await window.storage.get('bh10-financiacion');if(fi?.value)setFinanciacion(listaSegura(JSON.parse(fi.value),'financiacion'));}catch(e){}
    try{const eu=await window.storage.get('bh10-euribor');if(eu?.value)setEuribor(listaSegura(JSON.parse(eu.value),'euribor'));}catch(e){}
    try{const av=await window.storage.get('bh10-avisonom');if(av?.value)setAvisoTxt(av.value);}catch(e){}
    try{const nh=await window.storage.get('bh10-n43');if(nh?.value)setN43Hist(listaSegura(JSON.parse(nh.value),'n43hist'));}catch(e){}
    try{const kp=await window.storage.get('bh10-kpis');if(kp?.value){const v=JSON.parse(kp.value);if(v&&typeof v==='object')setKpiCfg({orden:Array.isArray(v.orden)?v.orden:[],ancho:v.ancho||{}});}}catch(e){}
    let _pal='bioh';
    try{const pl=await window.storage.get('bh10-paleta');if(pl?.value){_pal=pl.value;setPaleta(_pal);}}catch(e){}
    try{const tm=await window.storage.get('bh10-tema');const t=(tm&&tm.value)||'oscuro';aplicarTema(t==='auto'?((new Date().getHours()>=8&&new Date().getHours()<20)?'claro':'oscuro'):t,_pal);setTema(t);}catch(e){}
    try{const rm=await window.storage.get('bh10-remesas');if(rm?.value)setRemesas(listaSegura(JSON.parse(rm.value),'remesas'));}catch(e){}
    try{const dj=await window.storage.get('bh10-diario');if(dj?.value){const v=JSON.parse(dj.value);if(Array.isArray(v))setDiario(v);}}catch(e){}
    try{const vv=await window.storage.get('bh10-viviendas');if(vv?.value)setViviendas(listaSegura(JSON.parse(vv.value),'viviendas'));}catch(e){}
    // Las solicitudes de derechos tienen plazo legal: se miran al entrar, no
    // cuando a alguien se le ocurra abrir una pantalla.
    if(ES_APP&&window.bh10Derechos){
      window.bh10Derechos.listar()
        .then(l=>{
          const vivas=(l||[]).filter(x=>x&&x.estado!=='resuelta');
          setDerechos(vivas);
          if(vivas.length){
            const urgente=vivas.map(x=>diasParaResponder(x.recibida)).filter(d=>d!==null).sort((a,b)=>a-b)[0];
            setTimeout(()=>notify(
              `⚖️ ${vivas.length} solicitud${vivas.length!==1?'es':''} de derechos sin responder`
              +(urgente!==undefined?` · ${urgente<0?'PLAZO VENCIDO hace '+(-urgente)+' días':'quedan '+urgente+' días'}`:''),
              (urgente!==undefined&&urgente<7)?'error':undefined),1800);
          }
        })
        .catch(()=>{});
    }
    try{const bt=await window.storage.get('bh10-bajartab');if(bt?.value)setBajarTab(Math.max(0,Math.min(BAJAR_MAX,+bt.value||0)));}catch(e){}
    try{const at=await window.storage.get('bh10-altotab');if(at?.value)setAltoTab(Math.max(TAB_MIN,Math.min(TAB_MAX,+at.value||TAB_DEF)));}catch(e){}
    // v363 · el orden de Ajustes es una lista de TÍTULOS (cadenas): listaSegura solo deja objetos y la vaciaba al cargar
    try{const oc=await window.storage.get('bh10-ordenconfig');if(oc?.value){const l=JSON.parse(oc.value);setOrdenConfig(Array.isArray(l)?l.filter(x=>typeof x==='string'&&x.trim()):[]);}}catch(e){}
    try{const pi=await window.storage.get('bh10-planidx');if(pi?.value)setPlanMeses(listaSegura(JSON.parse(pi.value),'planidx'));}catch(e){}
    try{const cc=await window.storage.get('bh10-clicat');if(cc?.value)setCliCat(listaSegura(JSON.parse(cc.value),'clientes'));}catch(e){}
    try{const pc=await window.storage.get('bh10-provcat');if(pc?.value){const v=JSON.parse(pc.value);const arr=listaSegura(Array.isArray(v)?v:Object.values(objetoSeguro(v)));setProvCat(arr);if(!Array.isArray(v)){window.storage.set('bh10-provcat',JSON.stringify(arr)).catch(()=>{});console.warn('provCat saneado: objeto\u2192lista');}}}catch(e){}
    // Ping: verifica que el almacenamiento de Claude responde (detecta sesión caída / sin red)
    try{await window.storage.set('bh10-ping',String(Date.now()));}catch(e){console.error('Storage no disponible:',e);setStorageOk(false);}
    setLoading(false);
    if(invLecturaMal.current||ctLecturaMal.current)setTimeout(()=>notify(
      '⛔ No se pudieron leer '+(invLecturaMal.current?'las FACTURAS':'')
      +(invLecturaMal.current&&ctLecturaMal.current?' ni ':'')
      +(ctLecturaMal.current?'los CONTRATOS':'')
      +': no toques datos y recarga la app. El guardado queda desactivado para no pisar la nube.','error'),800);
    loadedRef.current=true;
    olvidarHist();   // no se deshace sobre datos anteriores a esta carga
  })();},[]);

  // ── AUTO-GUARDADO FACTURAS ──
  // Se salta la 1ª ejecución (montaje con []) y la 2ª (carga de datos del storage).
  // Solo guarda a partir de cambios reales del usuario.
  // ═══ HISTORIAL DE CAMBIOS ═══
  // Se vigila el conjunto de datos: cada vez que alguno cambia se apunta el
  // antes y el después. Como las actualizaciones son inmutables, guardar el
  // estado anterior solo duplica la lista de referencias, no los registros: 30
  // pasos con 800 facturas ocupan menos de 200 KB.
  const PASOS_HIST=30;
  const setterHist={invoices:setInvoices,contratos:setContratos,employees:setEmployees,flota:setFlota,
    polizas:setPolizas,obras:setObras,provCat:setProvCat,cliCat:setCliCat,remesas:setRemesas,budgets:setBudgets,n43Hist:setN43Hist};
  const vivoHist={invoices:invoicesAll,contratos,employees,flota,polizas,obras,provCat,cliCat,remesas,budgets,n43Hist};
  const refrescarHist=()=>{const h=hist.current;setHistUI({
    atras:h.pos>=0?h.pila[h.pos].desc:null,
    alante:h.pos<h.pila.length-1?h.pila[h.pos+1].desc:null});};
  const olvidarHist=()=>{hist.current={pila:[],pos:-1,previo:null,ignorar:false};setHistUI({atras:null,alante:null});};

  useEffect(()=>{
    const h=hist.current;
    const ahora={};AREAS_HIST.forEach(a=>{ahora[a]=vivoHist[a];});
    // durante la carga inicial, y mientras se aplica un deshacer, no se apunta
    if(!loadedRef.current||h.ignorar){h.previo=ahora;h.ignorar=false;return;}
    if(!h.previo){h.previo=ahora;return;}
    const cambiadas=AREAS_HIST.filter(a=>h.previo[a]!==ahora[a]);
    if(!cambiadas.length)return;
    const antes={},despues={};
    cambiadas.forEach(a=>{antes[a]=h.previo[a];despues[a]=ahora[a];});
    const paso={desc:describirCambio(cambiadas,antes,despues),antes,despues,areas:cambiadas};
    h.pila=h.pila.slice(0,h.pos+1);   // una acción nueva borra lo que había por rehacer
    h.pila.push(paso);
    if(h.pila.length>PASOS_HIST)h.pila.shift();
    h.pos=h.pila.length-1;
    h.previo=ahora;
    refrescarHist();
  },[invoicesAll,contratos,employees,flota,polizas,obras,provCat,cliCat,remesas,budgets,n43Hist]); // eslint-disable-line

  const aplicarHist=(inst)=>{
    hist.current.ignorar=true;
    Object.keys(inst).forEach(a=>{
      const s=setterHist[a];
      if(s)s(inst[a]);
      const clave=CLAVE_AREA[a];
      if(clave)window.storage.set(clave,JSON.stringify(inst[a])).catch(e=>console.error('Error guardando '+clave+':',e));
    });
  };
  // Si el paso tocaba remesas, se avisa: el fichero pudo enviarse ya al banco.
  const avisoRemesa=(paso)=>{
    if(!paso.areas||paso.areas.indexOf('remesas')<0)return;
    setTimeout(()=>notify('⚠️ Si esa remesa ya se envió al banco, anúlala también allí: deshacer solo la quita de la app','error'),1200);
  };
  const deshacer=()=>{
    if(soloLector())return;
    const h=hist.current;
    if(h.pos<0){notify('No hay nada que deshacer');return;}
    origenCambio.current='deshacer';
    const paso=h.pila[h.pos];
    // Deshacer una factura ya comunicada a la AEAT dejaría el registro sin
    // corresponderse con la factura. Se anula, no se deshace.
    if(paso.areas&&paso.areas.indexOf('invoices')>=0&&(vfRegistros||[]).length){
      const antes=(paso.antes.invoices)||[], despues=(paso.despues.invoices)||[];
      const idsA=new Set(antes.map(x=>x&&x.id));
      const tocadas=despues.filter(x=>x&&(!idsA.has(x.id)||antes.find(y=>y.id===x.id)!==x));
      const registrada=tocadas.find(x=>vfBloqueada(x));
      if(registrada){
        notify(`No se puede deshacer: la factura ${registrada.numFactura||''} ya está registrada en VERI*FACTU. Anúlala desde su ficha.`,'error');
        return;
      }
    }
    aplicarHist(paso.antes);
    h.pos--;
    refrescarHist();
    notify('↩️ Deshecho: '+paso.desc);
    avisoRemesa(paso);
  };
  const rehacer=()=>{
    if(soloLector())return;
    const h=hist.current;
    if(h.pos>=h.pila.length-1){notify('No hay nada que rehacer');return;}
    const paso=h.pila[h.pos+1];
    aplicarHist(paso.despues);
    h.pos++;
    refrescarHist();
    notify('↪️ Rehecho: '+paso.desc);
  };

  useEffect(()=>{
    if(!invSaveReady.current){invSaveReady.current=true;return;}
    if(!loadedRef.current)return; // nunca guardar antes de completar la carga
    if(invLecturaMal.current)return; // la lectura falló: guardar pisaría la nube
    difFacturas.current.programar(()=>JSON.stringify(invoicesAll));
    // diario: qué pagos han aparecido o desaparecido con este cambio
    const ahora=fotoPagos(invoicesAll);
    if(fotoPagosRef.current){
      const ent=diffPagos(fotoPagosRef.current,ahora,origenCambio.current);
      if(ent.length)setDiario(d=>{const nd=anotar(d,ent);difDiario.current.programar(()=>JSON.stringify(nd));return nd;});
    }
    fotoPagosRef.current=ahora;origenCambio.current='edición';
  },[invoicesAll]);
  // la primera foto se toma al terminar la carga (no antes: si no, la carga entera parecería «pagos apuntados»)
  useEffect(()=>{if(loadedRef.current&&!fotoPagosRef.current)fotoPagosRef.current=fotoPagos(invoicesAll);},[invoicesAll]);
  const [viviendas,setViviendas]=useState([]);   // v367 · viviendas (ventas), declarado aquí porque el diario las vigila
  // v368 · diario para todo: contratos, empleados, clientes, obras y viviendas (alta, baja, cambio + campos)
  const fotosEntRef=useRef({});
  const vigilaEntidad=(coleccion,lista)=>{
    if(!loadedRef.current)return;
    const ahora=fotoEntidades(lista);
    const antes=fotosEntRef.current[coleccion];
    if(antes){const ent=diffEntidades(antes,ahora,coleccion,origenCambio.current);if(ent.length)setDiario(d=>{const nd=anotar(d,ent);difDiario.current.programar(()=>JSON.stringify(nd));return nd;});}
    fotosEntRef.current[coleccion]=ahora;
  };
  useEffect(()=>{vigilaEntidad('contratos',contratos);},[contratos]); // eslint-disable-line
  useEffect(()=>{vigilaEntidad('empleados',employees);},[employees]); // eslint-disable-line
  useEffect(()=>{vigilaEntidad('clientes',cliCat);},[cliCat]); // eslint-disable-line
  useEffect(()=>{vigilaEntidad('obras',obras);},[obras]); // eslint-disable-line
  useEffect(()=>{vigilaEntidad('viviendas',viviendas);},[viviendas]); // eslint-disable-line
  const anotarRemesa=(tipo,r,detalle)=>setDiario(d=>{const nd=anotar(d,[entradaRemesa(tipo,r,detalle)]);difDiario.current.programar(()=>JSON.stringify(nd));return nd;});

  // ── AUTO-GUARDADO CONTRATOS (sin restricción de .length → permite borrar todos) ──
  useEffect(()=>{
    if(!ctSaveReady.current){ctSaveReady.current=true;return;}
    if(!loadedRef.current)return;
    if(ctLecturaMal.current)return; // la lectura falló: guardar pisaría la nube
    difContratos.current.programar(()=>JSON.stringify(contratos));
  },[contratos]);

  // Al ocultar o cerrar la app se vuelca lo que quede pendiente: el retardo
  // ahorra escrituras, pero nunca puede costar un dato.
  useEffect(()=>{
    const vaciar=()=>{difFacturas.current.vaciar();difContratos.current.vaciar();};
    const alOcultar=()=>{if(document.hidden)vaciar();};
    document.addEventListener('visibilitychange',alOcultar);
    window.addEventListener('pagehide',vaciar);
    window.addEventListener('beforeunload',vaciar);
    return ()=>{document.removeEventListener('visibilitychange',alOcultar);window.removeEventListener('pagehide',vaciar);window.removeEventListener('beforeunload',vaciar);vaciar();};
  },[]);

  // ── GUARDADO EXPLÍCITO (empresa, empleados, presupuestos, nóminas) ──
  const saveCompany=()=>{window.storage.set('bh10-company-v2',JSON.stringify(compCfg)).then(()=>{setStorageOk(true);notify('Datos empresa guardados');}).catch(e=>{console.error(e);setStorageOk(false);notify('Sin conexión con Claude — reabre el artefacto','error');});};
  const saveEmployees=(emps)=>{if(soloLector())return;setEmployees(emps);window.storage.set('bh10-employees',JSON.stringify(emps)).catch(e=>console.error('Error guardando empleados:',e));};
  const saveBudget=(obra,amt)=>{if(soloLector())return;const nb={...budgets,[obra]:parseNum(amt)||0};setBudgets(nb);window.storage.set('bh10-budgets',JSON.stringify(nb)).catch(e=>console.error('Error guardando presupuestos:',e));setEditBudget(null);notify('Presupuesto guardado');};
  const logPayroll=(concepto,total,count)=>{const entry={id:uid(),date:today,concepto,total,count};const nh=[entry,...payrollHistory].slice(0,50);setPayrollHistory(nh);window.storage.set('bh10-payroll-hist',JSON.stringify(nh)).catch(e=>console.error('Error guardando historial nóminas:',e));};

  // ═══ CONTRATOS (Presupuestos / Facturas emitidas) ═══
  // Un cliente existe desde que se le crea la ficha, aunque todavía no tenga
  // ninguna factura ni contrato: es el orden natural de trabajo — primero se da
  // de alta a quien va a comprar, y después se le hace el presupuesto.
  const clientes=useMemo(()=>[...new Set([
    ...invoices.filter(i=>i.tipo==='cobro').map(i=>i.proveedor),
    ...contratos.map(c=>c.cliente),
    ...(cliCat||[]).map(c=>c&&c.nombre),
  ].filter(Boolean))].sort(),[invoices,contratos,cliCat]);

  const calcContratoTotal=(items,sujetoPasivo)=>{
    let base=0,iva=0;
    listaSegura(items).forEach(it=>{
      const b=(Number(it.qty)||0)*(Number(it.precio)||0);
      if(!Number.isFinite(b))return;
      base+=b; iva+=sujetoPasivo?0:b*(Number(it.iva)||21)/100;
    });
    const f=(x)=>Number.isFinite(x)?+x.toFixed(2):0;
    return{base:f(base),iva:f(iva),total:f(base+iva)};
  };

  const cifsDesdeFacturas=()=>{
    const mapa={};
    invoicesAll.forEach(i=>{
      const c=normNIF(i&&i.proveedorCif), n=normTxtDup(i&&i.proveedor);
      if(c.length<8||!n)return;
      mapa[n]=mapa[n]||{};
      mapa[n][c]=(mapa[n][c]||0)+1;
    });
    const out={};
    Object.keys(mapa).forEach(n=>{
      const pares=Object.entries(mapa[n]).sort((a,b)=>b[1]-a[1]);
      if(pares.length)out[n]=pares[0][0];
    });
    return out;
  };
  const provSinCif=()=>{
    const arr=Array.isArray(provCat)?provCat:Object.values(provCat||{});
    const desde=cifsDesdeFacturas();
    return arr.filter(p=>p&&normNIF(p.cif).length<8&&!desde[normTxtDup(p.nombre)]);
  };
  const activarPortal=async()=>{
    if(!ES_APP||esLector()||!window.bh10Buzon)return;
    const emps=(window.bh10Empresas&&window.bh10Empresas.listar&&window.bh10Empresas.listar())||[{sub:'',nombre:(compCfg.name||'Empresa')}];
    try{
      const n=await window.bh10Buzon.activarPortal(emps);
      notify(`🔗 Portal activo · ${n} empresa${n!==1?'s':''} disponible${n!==1?'s':''} para los proveedores`);
    }catch(e){notify('No se pudo activar: '+((e&&e.code)||e),'error');}
  };
;
  const cargarBuzon=async()=>{
    if(!ES_APP||!window.bh10Buzon)return;
    try{ setBuzon(await window.bh10Buzon.listar()); }catch(e){ console.warn('buzon',e); }
    // v375 · los envíos de clientes también se consultan al entrar, para que el
    // KPI del buzón sepa cuántos hay sin tener que abrir la pantalla. Solo el
    // dueño: a un miembro ni se le pide la lista.
    if(window.bh10Recibidos&&!esMiembro()){
      try{ setCliRecibidos(await window.bh10Recibidos.listar()); }catch(e){ console.warn('recibidos',e); }
    }
  };
  const rechazarBuzon=async(id)=>{
    if(soloLector()||!window.bh10Buzon)return;
    setBuzonBusy(id);
    try{ await window.bh10Buzon.borrar(id); setBuzon(p=>p.filter(x=>x.id!==id)); notify('Envío descartado'); }
    catch(e){ notify('No se pudo descartar','error'); }
    setBuzonBusy('');
  };
  const aceptarBuzon=async(item)=>{
    if(soloLector()||!window.bh10Buzon)return;
    setBuzonBusy(item.id);
    try{
      const bin=atob(item.archivo||'');
      const bytes=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
      const file=new File([bytes],item.nombreArchivo||'factura',{type:item.mime||'application/pdf'});
      setEditing(null);
      setForm({...emptyForm,tipo:'factura',proveedor:item.nombre||'',proveedorCif:item.cif||'',
        concepto:'Enviada por el proveedor · pendiente de revisar',_file:file,_buzonId:item.id});
      setShowForm(true);
      notify('📥 Revisa y completa los datos — el documento ya viene adjunto');
      if(!ES_APP||String(anthKey||'').trim())scanInvoice(file); // sin clave: el formulario queda abierto para rellenar a mano
    }catch(e){ notify('No se pudo abrir el envío: '+((e&&e.message)||e),'error'); }
    setBuzonBusy('');
  };
  const vincularFactura=(invId,contratoId)=>{
    if(soloLector())return;
    setInvoices(p=>p.map(x=>x.id===invId?{...x,contratoId:contratoId||null}:x));
    const c=(contratos||[]).find(x=>x.id===contratoId);
    notify(contratoId?`🔗 Vinculada al contrato ${c?c.numero:''}`:'Desvinculada del contrato');
    setVincModal(null);
  };
  const contratoDesdeFactura=(inv)=>{
    if(soloLector())return;
    if(!inv)return;
    setVincModal(null);
    setEditingContrato(null);
    setContratoForm({
      tipo:'presupuesto',modo:'simple',fecha:inv.fecha||today,numero:numContratoLibre(),
      cliente:inv.proveedor||'',clienteCif:inv._clienteCif||'',clienteDir:inv._clienteDir||'',
      obra:inv.obra||'',
      items:[{desc:inv.concepto||inv.obra||'Obra ejecutada',qty:1,precio:+inv.importeBase||0,iva:+inv.tipoIva||21}],
      notas:`Contrato creado desde la factura ${inv.numFactura||''} de ${fmtDate(inv.fecha)}`,
      estado:'aceptado',
      sujetoPasivo:!!(inv.isp||inv._sujetoPasivo||(+inv.tipoIva===0&&+inv.importeBase>0&&Math.abs(+inv.total-+inv.importeBase)<0.02)),
      retGarantia:+inv.retGarPct||0,
      _vincular:inv.id
    });
    setShowContratoForm(true);
    notify('📐 Revisa el importe total del contrato: viene con el de esta factura');
  };
  const openNewContrato=(tipo='presupuesto',cliente)=>{if(soloLector())return;
    setEditingContrato(null);
    const limpio={tipo,modo:'simple',fecha:today,numero:tipo==='presupuesto'?numContratoLibre():numEmitidaLibre(),
      cliente:'',clienteCif:'',clienteDir:'',titulares:[],obra:'',items:[{desc:'',qty:1,precio:0,iva:21}],notas:'',estado:'borrador',sujetoPasivo:false,retGarantia:0};
    const d=leerDraft(DRAFT_C);
    if(draftUtil(d,['cliente','obra','notas'])||(d&&Array.isArray(d.items)&&d.items.some(x=>x&&(String(x.desc||'').trim()||+x.precio>0)))){
      setContratoForm({...limpio,...d,tipo:d.tipo||tipo});
      notify('📝 Recuperado el borrador que quedó a medias');
    }else setContratoForm(limpio);
    // Si se viene desde la ficha de un cliente, entra ya con sus datos puestos
    if(cliente){
      const f=fichaCliente(cliente);
      const dc=dirCompletaCliente(f);
      setContratoForm(p=>({...p,cliente,
        clienteCif:f.cif||p.clienteCif,
        clienteDir:dc||p.clienteDir,
        retGarantia:p.retGarantia||f.retGarPct||''}));
    }
    setShowContratoForm(true);
  };
  // Factura emitida directamente a un cliente, sin pasar por contrato
  const facturarACliente=(cliente)=>{
    if(soloLector()||!cliente)return;
    openNew('cobro');
    const f=fichaCliente(cliente);
    const dc=dirCompletaCliente(f);
    setForm(p=>{
      const n={...p,proveedor:cliente,
        proveedorCif:f.cif||p.proveedorCif,
        proveedorDir:dc||p.proveedorDir};
      if(f.diasVenc){const d0=new Date(p.fecha||today);d0.setDate(d0.getDate()+(+f.diasVenc||0));n.fechaVencimiento=d0.toISOString().slice(0,10);}
      if(f.retGarPct)n.retGarPct=String(f.retGarPct);
      return n;
    });
  };

  const saveContrato=()=>{if(soloLector())return;
    if(!contratoForm.cliente){notify('Indica el cliente','error');return;}
    {
      const nn=normNumDoc(contratoForm.numero);
      const choca=(contratos||[]).some(c=>c&&c.id!==editingContrato&&c.tipo===contratoForm.tipo&&normNumDoc(c.numero)===nn)
        || (contratoForm.tipo==='factura_emitida'&&numEmitidaOcupado(contratoForm.numero,editingContrato));
      if(nn&&choca){notify(`El nº ${contratoForm.numero} ya existe — usa ${contratoForm.tipo==='presupuesto'?numContratoLibre():numEmitidaLibre()}`,'error');return;}
    }
    if(!contratoForm.items.some(it=>it.precio>0)){notify('Añade al menos una línea','error');return;}
    const totals=calcContratoTotal(contratoForm.items,contratoForm.sujetoPasivo);
    const c={...contratoForm,id:editingContrato||uid(),...totals};
    delete c._vincular;
    if(editingContrato)setContratos(p=>p.map(x=>x.id===editingContrato?c:x));
    else setContratos(p=>[...p,c]);
    if(contratoForm._vincular){
      const fid=contratoForm._vincular;
      setInvoices(p=>p.map(x=>x.id===fid?{...x,contratoId:c.id}:x));
      notify('🔗 Factura vinculada al contrato nuevo');
    }
    borrarDraft(DRAFT_C);
    setShowContratoForm(false);notify(editingContrato?'Contrato actualizado':'Contrato creado');
  };

  const marcaDoc=()=>{
    const m=String(compCfg.marca||'').trim();
    if(m)return m;
    if(permitirSiembra())return 'BIOH GROUP';
    return String(compCfg.name||'').trim()||'BIOH GROUP';
  };
  const numEmitidaLibre=()=>{
    // SERIE NUEVA (agosto 2026): AAnnnnn, con el año en el prefijo y un
    // contador propio POR EMPRESA. La última usada se declara en Ajustes
    // («ultimaEmitida»): BIG 2600055, GREEN 2600007. Si no hay semilla ni
    // facturas de la serie, una empresa nueva empieza por AA00001.
    const _usados=[
      ...invoicesAll.filter(x=>x&&x.tipo==='cobro').map(x=>x.numFactura),
      ...(contratos||[]).filter(c=>c&&c.tipo==='factura_emitida').map(c=>c.numero)
    ];
    if(_usados.some(esSerieNueva)||esSerieNueva(String(compCfg.ultimaEmitida||'')))
      return siguienteNumero({usados:_usados,semilla:compCfg.ultimaEmitida,fecha:today});
    // La serie la marca la ÚLTIMA emitida (por fecha): escribe tú una vez el
    // número con el formato de la gestoría y las siguientes van correlativas.
    const pool=[
      ...invoicesAll.filter(x=>x&&x.tipo==='cobro'&&String(x.numFactura||'').trim()).map(x=>({num:x.numFactura,fecha:x.fecha||''})),
      ...(contratos||[]).filter(c=>c&&c.tipo==='factura_emitida'&&String(c.numero||'').trim()).map(c=>({num:c.numero,fecha:c.fecha||''}))
    ];
    if(pool.length){
      const ult=pool.reduce((a,b)=>String(b.fecha)>=String(a.fecha)?b:a);
      let cand=imitaNumero(ult.num), vueltas=0;
      while(cand&&numEmitidaOcupado(cand)&&vueltas++<500)cand=imitaNumero(cand);
      if(cand&&!numEmitidaOcupado(cand))return cand;
    }
    return siguienteSerie([
      {arr:invoicesAll.filter(x=>x&&x.tipo==='cobro'),campo:'numFactura'},
      {arr:(contratos||[]).filter(c=>c&&c.tipo==='factura_emitida'),campo:'numero'}
    ],['F','FE'],new Date().getFullYear(),'F');
  };
  const numContratoLibre=()=>siguienteSerie([
    {arr:(contratos||[]).filter(c=>c&&c.tipo==='presupuesto'),campo:'numero'}
  ],['P'],new Date().getFullYear(),'P');
  const numEmitidaOcupado=(num,exceptoId)=>{
    // Se compara SIN signos (norm de numeracion.js): «26-00056» y «2600056»
    // son el MISMO número fiscal. normNumDoc no quitaba guiones y el campo es
    // texto libre, así que un duplicado con guion se colaba.
    const n=normNumSerie(num); if(!n)return false;
    return invoicesAll.some(x=>x&&x.tipo==='cobro'&&x.id!==exceptoId&&normNumSerie(x.numFactura)===n)
        || (contratos||[]).some(c=>c&&c.tipo==='factura_emitida'&&c.id!==exceptoId&&normNumSerie(c.numero)===n);
  };
  const sugerirNumF=()=>numEmitidaLibre();
  // v371 · Jesús: «esas facturas deberían restar del total, como ya teníamos
  // antes». Mismo criterio que las certificaciones de un contrato: lo que se
  // factura contra la vivienda va descontando de su precio (con mejoras e IVA).
  const facturasDeVivienda=(viviendaId)=>invoices.filter(i=>i&&i.tipo==='cobro'&&String(i.viviendaId||'')===String(viviendaId)&&!esAnulada(i));
  const dineroVivienda=(v)=>{
    const fs=facturasDeVivienda(v.id);
    const total=precioConIva(v);                       // precio + mejoras + IVA
    const facturado=fs.reduce((a,i)=>a+(+i.total||0),0);
    const cobrado=fs.reduce((a,i)=>a+getTotalPagado(i,invoices),0);
    return {facturas:fs,total,facturado,cobrado,
      pendienteFacturar:Math.max(+(total-facturado).toFixed(2),0),
      pendienteCobro:+(facturado-cobrado).toFixed(2)};
  };
  const getCertificaciones=(contratoId)=>invoices.filter(i=>i.tipo==='cobro'&&i.contratoId===contratoId);
  const getTotalCertificado=(contratoId)=>getCertificaciones(contratoId).reduce((s,i)=>s+i.total,0);
  const getTotalCobradoContrato=(contratoId)=>getCertificaciones(contratoId).reduce((s,i)=>s+getTotalPagado(i,invoices),0);

  const generarCertificacion=(contrato)=>{if(soloLector())return;if(sinAccion('emitir','certificar y emitir'))return;
    const yaCert=getTotalCertificado(contrato.id);
    const totalC=contrato.total||calcContratoTotal(contrato.items,contrato.sujetoPasivo).total;
    const pctYa=totalC>0?Math.round(yaCert/totalC*100):0;
    const modoF=(contrato.modo||'simple')==='fases';
    let base=0, certDetalle=null, pctAcum=0;
    if(modoF){
      const pctDerivG=pctLineasCert(contrato.items,getCertificaciones(contrato.id));
      const itemsCertG=(contrato.items||[]).map((it,ix)=>({...it,pct:pctDerivG[ix]}));
      const fc=lineasCertificacion(itemsCertG,certLin);
      if(fc.base<=0){notify('Indica un avance nuevo en al menos una línea','error');return;}
      base=fc.base;
      certDetalle=(fc.lineas||[]).map(l=>({ix:l.ix,d:l.d,prev:l.prev,nuevo:l.nuevo,imp:l.imp}));
      pctAcum=totalC>0?Math.round((yaCert+base)/totalC*100):0;
    }else{
      pctAcum=parseNum(certPct)||0;
      const pctNuevo=pctAcum-pctYa;
      if(pctNuevo<=0){notify(`El avance debe ser mayor que ${pctYa}%`,'error');return;}
      base=+(((contrato.base||calcContratoTotal(contrato.items,contrato.sujetoPasivo).base)*pctNuevo)/100).toFixed(2);
    }
    const certNum=getCertificaciones(contrato.id).length+1;
    const tipoIva=contrato.sujetoPasivo?0:(contrato.items[0]?.iva||21);
    const t=calcTotals(base,tipoIva,0);
    const retGarPct=parseNum(contrato.retGarantia)||0;
    const retGarImp=+(base*retGarPct/100).toFixed(2);
    let numF=(certNumF||'').trim()||numEmitidaLibre();
    if(numEmitidaOcupado(numF,null)){const libre=numEmitidaLibre();notify(`El nº ${numF} ya existe — se emite como ${libre}`);numF=libre;}
    // El NIF del cliente ES NECESARIO para registrar en VERI*FACTU: sin él,
    // vfProblemas se planta («solo se puede emitir como factura simplificada»)
    // y la certificación no entraba en la cadena. Se arrastra del contrato y,
    // si allí falta, de la ficha del cliente, que es donde vive el CIF.
    const _fichaCli=(cliCat||[]).find(f=>f&&normProvNombre(f.nombre)===normProvNombre(contrato.cliente));
    const _cifCli=String(contrato.clienteCif||(_fichaCli&&(_fichaCli.cif||_fichaCli.dni))||'').trim();
    if(!_cifCli)notify(vfActivo(vfCfg)
      ?`⚠ ${contrato.cliente} no tiene NIF: la factura no podrá registrarse en VERI*FACTU`
      :`⚠ ${contrato.cliente} no tiene NIF en el contrato ni en su ficha`,vfActivo(vfCfg)?'error':undefined);
    const cobro={id:uid(),tipo:'cobro',fecha:today,numFactura:numF,proveedor:contrato.cliente,proveedorCif:_cifCli,
      obra:contrato.obra,concepto:certDesc||`Certificación nº${certNum} · Contrato ${contrato.numero} — avance ${pctYa}%→${pctAcum}%`,categoria:'Servicios profesionales',
      importeBase:base,tipoIva,irpf:0,iva:t.iva,retencion:0,total:t.total,retGarPct,retGarImp,retGarDevuelta:false,
      isp:!!contrato.sujetoPasivo,
      fechaVencimiento:'',formaPago:'Transferencia',notas:`Contrato ${contrato.numero} · Cert. nº${certNum} · Avance acumulado ${pctAcum}%`+(retGarImp>0?` · Ret. garantía ${retGarPct}%: ${fmt(retGarImp)} €`:''),
      pagos:[],aplicadoA:null,contratoId:contrato.id,...(contrato.viviendaId?{viviendaId:contrato.viviendaId}:{}),certNum,certDetalle,esEstructural:false,ibanProveedor:'',
      _clienteCif:_cifCli||contrato.clienteCif,
      _clienteDir:String(contrato.clienteDir||(_fichaCli?[_fichaCli.dir,[_fichaCli.cp,_fichaCli.municipio].filter(Boolean).join(' '),_fichaCli.provincia].map(x=>String(x||'').trim()).filter(Boolean).join(', '):'')||'').trim(),
      _clienteEmail:String((_fichaCli&&_fichaCli.email)||'').trim(),_clienteTel:String((_fichaCli&&_fichaCli.telefono)||'').trim(),
      _sujetoPasivo:contrato.sujetoPasivo};
    setInvoices(p=>[...p,cobro]);
    // La factura nacida de una certificación es una EMITIDA como cualquier
    // otra: tiene que entrar en el circuito VERI*FACTU. Esta vía se lo saltaba
    // —las otras dos que crean emitidas, saveInvoice (L2221) y
    // emitirRectificativa, sí lo hacían— y por eso las certificaciones no
    // generaban registro de alta, ni CSV, ni entraban en la cadena.
    // vfDebeRegistrar respeta el interruptor de Ajustes: con el check
    // desmarcado devuelve false y aquí no pasa nada.
    if(vfDebeRegistrar(cobro,vfCfg))setTimeout(()=>{vfRegistrarFactura(cobro);},0);
    setShowCertModal(null);setCertPct('');setCertDesc('');setCertNumF('');setCertLin({});
    notify(`Factura ${numF}: ${fmt(t.total)} €${retGarImp>0?` · líquido ${fmt(t.total-retGarImp)} €`:''} — ${pctAcum}% acumulado`);
    setTimeout(()=>generarFacturaCert(cobro,contrato),80);
  };

  // ═══ VISOR DE DOCUMENTOS ═══
  const showDocPreview = (html, filename, makePdf) => setDocPreview({ html, filename, makePdf });

  // CSS compartido para facturas y presupuestos
  const invoiceCSS = `
    @page{size:A4;margin:18mm 15mm 15mm 15mm}
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;font-size:10pt;line-height:1.4}
    .page{max-width:720px;margin:0 auto;padding:10mm 0}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6mm;padding-bottom:4mm;border-bottom:3px solid #1B2740}
    .brand{font-size:22pt;font-weight:800;color:#1B2740;letter-spacing:-.02em}
    .brand-accent{color:#4CAF50;font-size:12pt;font-weight:700;margin-top:1mm}
    .brand-data{font-size:8pt;color:#555;margin-top:2mm;line-height:1.5}
    .doc-type{text-align:right}
    .doc-type h1{font-size:18pt;color:#1B2740;font-weight:800;text-transform:uppercase}
    .doc-type .num{font-size:11pt;color:#4CAF50;font-weight:700;margin-top:1mm}
    .doc-type .date{font-size:9pt;color:#555;margin-top:1mm}
    .parties{display:flex;gap:10mm;margin:5mm 0 6mm}
    .party{flex:1;padding:3mm 4mm;border-radius:2mm}
    .party-label{font-size:7pt;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:1.5mm}
    .party.emisor{background:#f8f9fa;border-left:3px solid #1B2740}
    .party.emisor .party-label{color:#1B2740}
    .party.receptor{background:#f0f7f0;border-left:3px solid #4CAF50}
    .party.receptor .party-label{color:#4CAF50}
    .party-name{font-size:10pt;font-weight:700}
    .party-detail{font-size:8.5pt;color:#444;margin-top:1mm;line-height:1.4}
    .obra-ref{margin:0 0 4mm;padding:2.5mm 4mm;background:#FFF8E1;border-left:3px solid #E8A308;font-size:8.5pt}
    table{width:100%;border-collapse:collapse;margin:3mm 0}
    thead th{background:#1B2740;color:#fff;padding:2.5mm 3mm;font-size:8pt;text-transform:uppercase;letter-spacing:.04em;font-weight:600}
    thead th:first-child{border-radius:1.5mm 0 0 0}
    thead th:last-child{border-radius:0 1.5mm 0 0}
    tbody td{padding:2.5mm 3mm;border-bottom:1px solid #e8e8e8;font-size:9pt}
    tbody tr:last-child td{border-bottom:2px solid #1B2740}
    .r{text-align:right}
    .c{text-align:center}
    .totals{margin-top:4mm;display:flex;justify-content:flex-end}
    .totals-box{width:55%;min-width:220px}
    .totals-row{display:flex;justify-content:space-between;padding:1.5mm 0;font-size:9pt}
    .totals-row.sep{border-top:1px solid #ccc;margin-top:1mm;padding-top:2mm}
    .totals-row.total{border-top:2px solid #1B2740;margin-top:2mm;padding-top:3mm;font-size:13pt;font-weight:800;color:#1B2740}
    .isp-notice{margin-top:3mm;padding:2.5mm 4mm;background:#FFF8E1;border-left:3px solid #E8A308;font-size:8pt;color:#8B6914}
    .payment{margin-top:6mm;padding:3mm 4mm;background:#f8f9fa;border-radius:2mm;font-size:8.5pt}
    .payment-title{font-size:7pt;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:#1B2740;margin-bottom:1.5mm}
    .payment-iban{font-family:'Courier New',monospace;font-size:10pt;font-weight:700;color:#1B2740;letter-spacing:.06em}
    .notes{margin-top:4mm;padding:2.5mm 4mm;background:#f5f5f5;border-radius:2mm;font-size:8pt;color:#666}
    .footer{margin-top:8mm;padding-top:3mm;border-top:1px solid #ddd;font-size:7pt;color:#999;text-align:center}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  `;

  // Datos del cliente para una emitida: lo que se copió al emitir y, si
  // falta, la ficha del cliente (CIF, dirección completa, email, teléfono).
  const datosClienteDe=(cb)=>{
    const f=(cliCat||[]).find(x=>x&&normProvNombre(x.nombre)===normProvNombre(cb&&cb.proveedor));
    const dirFicha=f?[f.dir,[f.cp,f.municipio].filter(Boolean).join(' '),f.provincia].map(x=>String(x||'').trim()).filter(Boolean).join(', '):'';
    return {
      name:(cb&&cb.proveedor)||'',
      cif:String((cb&&(cb._clienteCif||cb.proveedorCif))||(f&&(f.cif||f.dni))||'').trim(),
      dir:String((cb&&cb._clienteDir)||dirFicha||'').trim(),
      email:String((cb&&cb._clienteEmail)||(f&&f.email)||'').trim(),
      tel:String((cb&&cb._clienteTel)||(f&&f.telefono)||'').trim(),
    };
  };
  const buildParties = (cobro, clienteCif, clienteDir, contacto) => `
    <div class="parties">
      <div class="party emisor">
        <div class="party-label">Emisor</div>
        <div class="party-name">${compCfg.name||'(Configurar datos empresa)'}</div>
        <div class="party-detail">
          ${compCfg.cif?'CIF: '+compCfg.cif+'<br>':''}
          ${compCfg.address?compCfg.address+'<br>':''}
          ${compCfg.city||''}
          ${compCfg.phone?'<br>Tel: '+compCfg.phone:''}
          ${compCfg.email?'<br>'+compCfg.email:''}
        </div>
      </div>
      <div class="party receptor">
        <div class="party-label">Cliente / Destinatario</div>
        <div class="party-name">${cobro.proveedor||'—'}</div>
        <div class="party-detail">
          ${clienteCif?'CIF/NIF: '+clienteCif+'<br>':''}
          ${clienteDir||''}${contacto?'<br>'+escXml(contacto):''}
        </div>
      </div>
    </div>
    ${cobro.obra?'<div class="obra-ref"><strong>Obra/Servicio:</strong> '+cobro.obra+'</div>':''}`;

  // Generate downloadable invoice PDF from a cobro (certification or standalone)
  // generateCertDoc vive en src/documentos.js. Aquí queda el envoltorio que le
  // inyecta lo que antes tomaba del ámbito de App. La firma no cambia.
  const generateCertDoc=(...args)=>doc_generateCertDoc(...args,{APP_VERSION,buildInvoicePdf,buildParties,compCfg,contratos,escXml,fmt,fmtDate,invoiceCSS,marcaDoc,notify,showDocPreview,vfBloqueFactura,vfDatosPdf,vfCfg,vfRegRef,vfRegistros});

  const generarFacturaCert=(cb,contrato)=>{
    const certsAll=getCertificaciones(contrato.id);
    const yaEsta=certsAll.some(x=>x.id===cb.id);
    const retAcum=+(certsAll.reduce((s,i)=>s+(+i.retGarImp||0),0)+(yaEsta?0:(+cb.retGarImp||0))).toFixed(2);
    const nCert=certsAll.length+(yaEsta?0:1);
    const ejec=+(certsAll.reduce((s,i)=>s+(+i.total||0),0)+(yaEsta?0:(+cb.total||0))).toFixed(2);
    const totC=+(contrato.total||calcContratoTotal(contrato.items,contrato.sujetoPasivo).total||0).toFixed(2);
    const pctE=totC>0?Math.round(ejec/totC*100):0;
    const isSP=!!cb._sujetoPasivo;
    const filas=(cb.certDetalle&&cb.certDetalle.length)
      ?cb.certDetalle.map(l=>`<tr><td>${l.d}</td><td class="c">${l.prev}% → ${l.nuevo}%</td><td class="r">${fmt(+l.imp)} €</td></tr>`).join('')
      :`<tr><td>${cb.concepto||'Certificación de obra'}</td><td class="c">—</td><td class="r">${fmt(+cb.importeBase)} €</td></tr>`;
    const liq=+(((+cb.total)-(+cb.retGarImp||0))).toFixed(2);
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>FACTURA ${cb.numFactura}</title><style>${invoiceCSS}</style></head><body><div class="page">
      <div class="header"><div><div class="brand">${escXml(marcaDoc())}</div><div class="brand-accent">${compCfg.name||''}</div></div>
      <div class="doc-type"><h1>FACTURA</h1><div class="num">Nº ${cb.numFactura}</div><div class="date">Fecha: ${fmtDate(cb.fecha)}</div><div class="date">Contrato: ${contrato.numero}</div></div></div>
      ${(()=>{const dc=datosClienteDe(cb);return buildParties({proveedor:cb.proveedor,obra:cb.obra}, dc.cif, dc.dir, [dc.email,dc.tel?'Tel: '+dc.tel:''].filter(Boolean).join(' · '));})()}
      <table><thead><tr><th style="width:55%">Descripción</th><th class="c">Avance</th><th class="r">Base</th></tr></thead><tbody>${filas}</tbody></table>
      <div class="totals"><div class="totals-box">
        <div class="totals-row"><span>Base imponible</span><strong>${fmt(+cb.importeBase)} €</strong></div>
        ${isSP?'':`<div class="totals-row"><span>IVA ${cb.tipoIva}%</span><strong>${fmt(+cb.iva)} €</strong></div>`}
        <div class="totals-row total"><span>TOTAL FACTURA</span><span>${fmt(+cb.total)} €</span></div>
        ${(+cb.retGarImp||0)>0?`<div class="totals-row" style="color:#7c3aed"><span>Retención de garantía (${cb.retGarPct}%)</span><span>−${fmt(+cb.retGarImp)} €</span></div><div class="totals-row total" style="border-top:1px solid #ccc"><span>LÍQUIDO A PERCIBIR</span><span>${fmt(liq)} €</span></div>`:''}
      </div></div>
      ${isSP?'<div class="isp-notice"><strong>Inversión del sujeto pasivo</strong> — Operación no sujeta a IVA conforme al artículo 84.Uno.2.f) de la Ley 37/1992, del IVA. El destinatario es sujeto pasivo de la operación.</div>':''}
      <div class="notes"><strong>Ejecución del contrato ${contrato.numero}:</strong> ${fmt(ejec)} € de ${fmt(totC)} € (${pctE}%) · Pendiente: ${fmt(Math.max(totC-ejec,0))} €${(+cb.retGarImp||0)>0?`<br><strong>Retenciones de garantía:</strong> ${fmt(retAcum)} € acumulados en ${nCert} certificación(es), pendientes de liquidación a la finalización de obra.`:''}</div>
      ${compCfg.iban?'<div class="payment"><div class="payment-title">Datos de pago</div><div>Forma de pago: Transferencia bancaria</div><div class="payment-iban">IBAN: '+compCfg.iban+'</div>'+(compCfg.bic?'<div>BIC/SWIFT: '+compCfg.bic+'</div>':'')+'</div>':''}
      ${(()=>{const reg=(vfRegRef.current||vfRegistros||[]).find(r=>r&&r.tipoRegistro==='alta'&&r.facturaId===cb.id);return reg?vfBloqueFactura(reg,vfCfg.entorno,vfCfg.detalleFactura||'completo'):'';})()}
      <div class="footer">${escXml(compCfg.name||marcaDoc())}${compCfg.cif?' · CIF: '+compCfg.cif:''} · BH10 ${APP_VERSION}</div>
    </div></body></html>`;
    const regVfCert=(vfRegRef.current||vfRegistros||[]).find(r=>r&&r.tipoRegistro==='alta'&&r.facturaId===cb.id);
    const pdfItems=(cb.certDetalle&&cb.certDetalle.length)
      ?cb.certDetalle.map(l=>({desc:`${l.d} — avance ${l.prev}%→${l.nuevo}%`,qty:'',base:fmt(+l.imp)+' \u20AC',imp:fmt(+l.imp)+' \u20AC'}))
      :[{desc:cb.concepto||'Certificación de obra',qty:'1',base:fmt(cb.importeBase)+' \u20AC',imp:fmt(cb.total)+' \u20AC'}];
    const makePdf=()=>buildInvoicePdf({
      tipo:'FACTURA', numero:cb.numFactura, fecha:fmtDate(cb.fecha),
      vf:regVfCert?vfDatosPdf(regVfCert,vfCfg.entorno,vfCfg.detalleFactura||'completo'):null,
      contratoNum:contrato.numero||'',
      emisor:{...compCfg,marca:marcaDoc()},
      receptor:datosClienteDe(cb),
      obra:cb.obra||'',
      items:pdfItems,
      base:fmt(cb.importeBase)+' \u20AC',
      ivaLabel:'IVA '+cb.tipoIva+'%', ivaImp:isSP?'':fmt(cb.iva)+' \u20AC',
      total:fmt(cb.total)+' \u20AC', isSP,
      iban:compCfg.iban||'', bic:compCfg.bic||'', formaPago:'Transferencia bancaria',
      notas:`Ejecución del contrato ${contrato.numero}: ${fmt(ejec)} EUR de ${fmt(totC)} EUR (${pctE}%)`+((+cb.retGarImp||0)>0?` · Retenciones acumuladas: ${fmt(retAcum)} EUR en ${nCert} cert., pendientes de liquidación`:''),
      footer:(compCfg.name||'')+(compCfg.cif?' \u00B7 CIF: '+compCfg.cif:'')+' \u00B7 BH10 '+APP_VERSION
    },(cb.retGarImp||0)>0?{pct:cb.retGarPct,imp:cb.retGarImp,impStr:fmt(cb.retGarImp)+' EUR',liqStr:fmt(cb.total-cb.retGarImp)+' EUR'}:null).buildBlob();
    showDocPreview(html, `FACTURA_${String(cb.numFactura).replace(/[^A-Za-z0-9_-]/g,'_')}`, makePdf);
  };

  // generateDoc vive en src/documentos.js. Aquí queda el envoltorio que le
  // inyecta lo que antes tomaba del ámbito de App. La firma no cambia.
  const generateDoc=(...args)=>doc_generateDoc(...args,{APP_VERSION,buildInvoicePdf,buildParties,calcContratoTotal,compCfg,escXml,fmt,fmtDate,invoiceCSS,marcaDoc,notify,showDocPreview});
  const notify=useCallback((m,t='success')=>{setToast({m,t});setTimeout(()=>setToast(null),2800);},[]);

  const proveedores=useMemo(()=>[...new Set(invoices.filter(i=>i.tipo!=='personal').map(i=>i.proveedor).filter(Boolean))].sort(),[invoices]);
  const obrasAll=useMemo(()=>{
    const cat=obras.filter(o=>o.activa!==false).map(obraDisplay);
    const used=[...invoices.map(i=>i.obra),...contratos.map(c=>c.obra)].filter(Boolean);
    return [...new Set([...cat,...used])].sort();
  },[obras,invoices,contratos]);
  // Guardar catálogo de obras (explícito)
  const openObraModal=(from,prefill)=>{setObraForm({...emptyObra,...(prefill||{})});setObraModal({editing:prefill?.id||null,from});};
  const saveObra=()=>{if(soloLector())return;
    if(!obraForm.calle?.trim()&&!obraForm.alias?.trim()){notify('Indica al menos calle o alias','error');return;}
    let next;
    if(obraModal.editing){next=obras.map(o=>o.id===obraModal.editing?{...obraForm,id:o.id}:o);}
    else{next=[...obras,{...obraForm,id:uid()}];}
    persistObras(next);
    const disp=obraDisplay(obraForm);
    if(obraModal.from==='form')updateForm('obra',disp);
    setObraModal(null);notify(`Obra "${disp}" guardada`);
  };
  const deleteObra=(id)=>{persistObras(obras.filter(o=>o.id!==id));setObraModal(null);notify('Obra eliminada del catálogo');};

  // Available anticipos (not yet applied) for linking
  const anticiposLibres=useMemo(()=>invoices.filter(i=>i.tipo==='anticipo'&&!i.aplicadoA),[invoices]);

  // KPIs
  const K=useMemo(()=>{
    const now=new Date(),mes=now.getMonth(),anio=now.getFullYear();
    const inRange=i=>(!dashFrom||(i.fecha||'')>=dashFrom)&&(!dashTo||(i.fecha||'')<=dashTo);
    const gastos=invoices.filter(i=>i.tipo!=='anticipo'&&i.tipo!=='cobro'&&inRange(i)&&!esAnulada(i));
    const cobros=invoices.filter(i=>i.tipo==='cobro'&&inRange(i)&&!esAnulada(i));
    let totalFact=0,totalPagado=0,totalPendiente=0,totalVencido=0,totalIva=0,totalEstructura=0,totalEstructuraMes=0;
    let totalIngresos=0,totalCobrado=0,totalPteCobro=0,totalIvaRepercutido=0;
    const aging={a030:0,a3160:0,a6190:0,a90:0},meses={},provMap={},obraMap={},catMap={};

    // Gastos (expenses)
    gastos.forEach(inv=>{
      const est=getEstado(inv,invoices),pagado=getTotalPagado(inv,invoices),saldo=getSaldo(inv,invoices);
      totalFact+=inv.total;totalPagado+=pagado;totalIva+=(inv.iva||0);
      if(est!=='pagada')totalPendiente+=Math.max(saldo,0);
      if(est==='vencida'||est==='parcial_vencida')totalVencido+=Math.max(saldo,0);
      if(inv.esEstructural||inv.tipo==='estructura'){totalEstructura+=inv.total;const d=new Date(inv.fecha);if(d.getMonth()===mes&&d.getFullYear()===anio)totalEstructuraMes+=inv.total;}
      if(est!=='pagada'){const ref=inv.fechaVencimiento||inv.fecha,d=daysBetween(ref,today);
        if(d<=30)aging.a030+=saldo;else if(d<=60)aging.a3160+=saldo;else if(d<=90)aging.a6190+=saldo;else aging.a90+=saldo;}
      const mk=inv.fecha?.slice(0,7);
      if(mk){if(!meses[mk])meses[mk]={mes:mk,gastos:0,ingresos:0,pagado:0};meses[mk].gastos+=inv.total;}
      (inv.pagos||[]).forEach(p=>{const pk=p.fecha?.slice(0,7);if(pk){if(!meses[pk])meses[pk]={mes:pk,gastos:0,ingresos:0,pagado:0};meses[pk].pagado+=p.importe;}});
      getAnticiposAplicados(inv,invoices).forEach(a=>{const pk=a.fecha?.slice(0,7);if(pk){if(!meses[pk])meses[pk]={mes:pk,gastos:0,ingresos:0,pagado:0};meses[pk].pagado+=a.total;}});
      const prov=inv.proveedor||'—';
      if(!provMap[prov])provMap[prov]={name:prov,facturado:0,pendiente:0,count:0};
      provMap[prov].facturado+=inv.total;provMap[prov].pendiente+=Math.max(saldo,0);provMap[prov].count++;
      const obra=(inv.esEstructural||inv.tipo==='estructura')?'🏢 Estructura':inv.obra||'Sin asignar';
      if(!obraMap[obra])obraMap[obra]={name:obra,total:0,pendiente:0};
      obraMap[obra].total+=inv.total;obraMap[obra].pendiente+=Math.max(saldo,0);
      const cat=inv.categoria||'Otros';if(!catMap[cat])catMap[cat]={name:cat,value:0};catMap[cat].value+=inv.total;
    });

    // Cobros (income)
    cobros.forEach(inv=>{
      const pagado=getTotalPagado(inv,invoices),saldo=getSaldo(inv,invoices);
      totalIngresos+=inv.total;totalCobrado+=pagado;totalIvaRepercutido+=(inv.iva||0);
      if(saldo>0.01)totalPteCobro+=saldo;
      const mk=inv.fecha?.slice(0,7);
      if(mk){if(!meses[mk])meses[mk]={mes:mk,gastos:0,ingresos:0,pagado:0};meses[mk].ingresos+=inv.total;}
    });

    // YoY comparison
    const lastYearGastos=invoices.filter(i=>i.tipo!=='anticipo'&&i.tipo!=='cobro'&&new Date(i.fecha).getFullYear()===anio-1).reduce((s,i)=>s+i.total,0);
    const thisYearGastos=gastos.filter(i=>new Date(i.fecha).getFullYear()===anio).reduce((s,i)=>s+i.total,0);
    const yoyChange=lastYearGastos>0?Math.round((thisYearGastos-lastYearGastos)/lastYearGastos*100):0;

    const totalAnticiposLibres=anticiposLibres.reduce((s,a)=>s+a.total,0);
    const mensual=Object.values(meses).sort((a,b)=>a.mes.localeCompare(b.mes)).slice(-12);
    const topProv=Object.values(provMap).sort((a,b)=>b.facturado-a.facturado).slice(0,8);
    const topObras=Object.values(obraMap).sort((a,b)=>b.total-a.total);
    const catData=Object.values(catMap).sort((a,b)=>b.value-a.value);
    const diasPago=gastos.filter(i=>getEstado(i,invoices)==='pagada').map(i=>{
      const allP=[...(i.pagos||[]),...getAnticiposAplicados(i,invoices).map(a=>({fecha:a.fecha}))];
      if(!allP.length)return 0;const last=allP.reduce((a,b)=>(a.fecha||'')>(b.fecha||'')?a:b);
      return daysBetween(i.fecha,last.fecha);
    }).filter(d=>d>0);
    const avgDias=diasPago.length?Math.round(diasPago.reduce((s,d)=>s+d,0)/diasPago.length):0;

    return{gastos,cobros,totalFact,totalPagado,totalPendiente,totalVencido,totalIva,totalIvaRepercutido,totalEstructura,totalEstructuraMes,totalAnticiposLibres,totalIngresos,totalCobrado,totalPteCobro,yoyChange,lastYearGastos,thisYearGastos,aging,mensual,topProv,topObras,catData,avgDias};
  },[invoices,anticiposLibres,dashFrom,dashTo]);

  // Handlers
  const updateForm=(f,v)=>setForm(p=>{
    const n={...p,[f]:v};
    // Elegir un tipo de IVA distinto de cero contradice la inversión del sujeto
    // pasivo. Antes ganaba la marca y el IVA se quedaba en cero pasara lo que
    // pasara: escribías 21% y no reaccionaba. Ahora manda lo que tú eliges.
    if((f==='tipoIva'||f==='tipoIva2')&&(+v)>0&&n.isp)n.isp=false;
    if(f==='basesExtra'&&Array.isArray(v)&&v.some(x=>(+((x||{}).tipo))>0)&&n.isp)n.isp=false;
    // Un gasto estructural no va ligado a ninguna obra, así que no puede ser
    // el extra de un contrato: marcarlo apaga lo otro para que no quede una
    // factura esperando en un contrato al que ya no pertenece.
    if(f==='esEstructural'&&v)n.extraPend=false;
    return n;
  });
  const openNew=(tipo='factura')=>{if(soloLector())return;
    setEditing(null);
    const limpio={...emptyForm,tipo};
    if(tipo==='cobro')limpio.numFactura=numEmitidaLibre();
    const d=leerDraft(DRAFT_F);
    if(d&&d.tipo===tipo&&draftUtil(d,['proveedor','importeBase','concepto'])){
      setForm({...limpio,...d,_file:undefined});
      notify('📝 Recuperado el borrador que quedó a medias');
    }else setForm(limpio);
    setShowForm(true);
  };
  const openEdit=inv=>{if(soloLector())return;
    const bloq=vfBloqueada(inv);
    if(bloq){
      // No se puede modificar, pero sí anular: es el camino que marca la norma
      setVfAnular({inv,reg:bloq,motivo:''});
      return;
    }setEditing(inv.id);
    const d=normDesglose(inv);
    setForm({...inv,importeBase:String((d[0]&&d[0].base)||inv.importeBase||''),tipoIva:(d[0]&&d[0].tipo)??inv.tipoIva,
      basesExtra:d.slice(1).map(x=>({base:String(x.base),tipo:x.tipo}))});
    setShowForm(true);};

  const saveInvoice=()=>{if(soloLector())return;
    if(form.tipo==='cobro'&&numEmitidaOcupado(form.numFactura,editing)){notify(`El nº ${form.numFactura} ya está emitido — usa ${numEmitidaLibre()}`,'error');return;}
    const b=parseNum(form.importeBase)||0;
    const b2=parseNum(form.base2)||0;
    if(!form.proveedor){notify('Falta el proveedor','error');return;}
    // El importe puede ser 0 en una factura sin cargo, pero tiene que estar
    // escrito: un campo vacío es «no lo sé», y eso sí hay que completarlo.
    if(String(form.importeBase??'').trim()===''){notify('Escribe la base imponible (pon 0 si la factura no tiene importe)','error');return;}
    const des=desgloseForm(form);
    const t=calcDesglose(des,form.irpf);
    const inv={...form,id:editing||uid(),desglose:des,importeBase:des[0]?des[0].base:b,
      base2:des[1]?des[1].base:0,tipoIva2:des[1]?des[1].tipo:(form.tipoIva2||10),
      iva:t.iva,retencion:t.retencion,total:t.total};
    if(!editing&&!inv.fechaRegistro)inv.fechaRegistro=today;
    delete inv._dualIva; delete inv.basesExtra; delete inv._cuadre;
    // Si el registro VERI*FACTU está activo, esta factura entra en la cadena
    if(vfDebeRegistrar(inv,vfCfg))setTimeout(()=>{vfRegistrarFactura(inv);},0);
    if(!inv.base2){delete inv.base2; delete inv.tipoIva2;}
    if(!(inv.desglose||[]).length)delete inv.desglose;
    const _adjF=inv._file; delete inv._file;
    const _giroF=inv._giro||0; delete inv._giro; delete inv._avisos;
    delete inv._lista; delete inv._multi; delete inv._recuperado; // v397: eran del lector y se colaban en la nube
    const _bzId=inv._buzonId; delete inv._buzonId;
    if(Array.isArray(form.lineas)&&form.lineas.length)inv.lineas=form.lineas;
    if(!inv.ibanProveedor){const _fp=getSupplierData(inv.proveedor);if(_fp&&_fp.iban)inv.ibanProveedor=_fp.iban;}
    if(inv.ibanProveedor)aprenderIban(inv.proveedor,inv.ibanProveedor);
    const _deAnt=inv._deAnticipo; delete inv._deAnticipo;
    if(!editing){inv.pagos=[];inv.aplicadoA=null;}
    else{inv.pagos=invoices.find(i=>i.id===editing)?.pagos||[];inv.aplicadoA=invoices.find(i=>i.id===editing)?.aplicadoA||null;}
    // OJO: estos dos van DESPUÉS del reset de pagos de arriba; antes el reset
    // pisaba el pago del banco y las facturas del N43 nacían sin pagar.
    if(form._pagoAuto&&!editing){inv.pagos=[{id:uid(),fecha:form._pagoAuto.fecha,importe:+form._pagoAuto.importe||t.total,metodo:'Conciliación N43',referencia:form._pagoAuto.ref||''}];}
    delete inv._pagoAuto;
    // Fila del Excel marcada como pagada y revisada una a una: se respeta el
    // pago importado (mismo criterio que el alta en bloque).
    if(form._pagoImport&&!editing&&inv.tipo!=='cobro'&&(+inv.total||0)>0&&!(inv.pagos||[]).length){
      const _fpImp=form._pagoImport.fecha||inv.fechaVencimiento||inv.fecha;
      inv.pagos=[{id:uid(),fecha:_fpImp,importe:+(inv.total||0),metodo:'Transferencia',referencia:'Importado del Excel'}];
    }
    // Casilla «marcar como pagada»: se anota el pago del total en el acto,
    // con la fecha de la factura y la forma de pago elegida.
    if(form._marcarPagada&&!editing&&inv.tipo!=='cobro'&&(+inv.total||0)>0&&!(inv.pagos||[]).length){
      inv.pagos=[{id:uid(),fecha:inv.fecha||today,importe:+(inv.total||0),metodo:form.formaPago||'Transferencia',referencia:'Marcada al registrar'}];
    }
    delete inv._marcarPagada;
    delete inv._pagoImport;delete inv._fechaEstimada;
    // Clean non-applicable fields
    if(inv.tipo==='cobro'){
      const rp=parseNum(form.retGarPct)||0;
      inv.retGarPct=rp;inv.retGarImp=+(b*rp/100).toFixed(2);
      const prev=editing?invoices.find(i=>i.id===editing):null;
      inv.retGarDevuelta=prev?.retGarDevuelta||false;if(prev?.retGarFecha)inv.retGarFecha=prev.retGarFecha;
    }else{delete inv.retGarPct;delete inv.retGarImp;delete inv.retGarDevuelta;delete inv.retGarFecha;}
    if(inv.tipo!=='anticipo')delete inv.refPresupuesto;
    delete inv._totalLeido;
    const dup=hallarDuplicada(inv,invoices,editing)||hallarDuplicada(inv,invoicesAll.filter(x=>x&&x._del),editing);
    if(dup&&esDupFuerte(dup)&&!dupOk){
      setDupOk(true);
      const porQue=dup.motivo==='numero'?'mismo nº de factura':'mismo importe y fecha, y sin nº que las distinga';
      notify(`⚠ Parece YA REGISTRADA${dup.inv._del?' (está en la papelera)':''} — ${porQue}: ${dup.inv.numFactura?'nº '+dup.inv.numFactura+' de ':''}${dup.inv.proveedor} (${fmtDate(dup.inv.fecha)} · ${fmt(dup.inv.total)} €). Si aun así es otra factura, vuelve a pulsar Registrar y se guarda.`,'error');
      return;
    }
    if(batchReviewIdx!==null&&lotePagadas&&!editing&&inv.tipo!=='cobro'&&(+inv.total||0)>0&&!(inv.pagos||[]).length){
      inv.pagos=[{id:uid(),fecha:inv.fecha,importe:+(inv.total||0),metodo:'Transferencia',referencia:'Importación: marcada como pagada'}];
    }
    if(editing)setInvoices(p=>p.map(i=>i.id===editing?inv:i));
    else if(_deAnt){
      // v377 · la definitiva nace CON el anticipo aplicado: lo ya pagado en la
      // proforma se descuenta solo y no hay que borrar ni rehacer nada.
      setInvoices(p=>[...p.map(i=>i.id===_deAnt?{...i,aplicadoA:inv.id}:i),inv]);
      const ant=invoices.find(i=>i.id===_deAnt);
      const queda=Math.max(+( (inv.total||0)-(ant?ant.total:0) ).toFixed(2),0);
      notify(`✓ Definitiva registrada · anticipo de ${fmt(ant?ant.total:0)} € aplicado${queda>0?` — quedan ${fmt(queda)} € por pagar`:' — queda saldada'}`);
      setShowForm(false);setEditing(null);borrarDraft(DRAFT_F);
      return;
    }
    else setInvoices(p=>[...p,inv]);
    if(batchReviewIdx!==null){borrarDraft(DRAFT_F);notify('Registrada ✓ — siguiente factura');advanceBatch(true);return;}
    if(_adjF)subirAdjuntos([[inv.id,_adjF,_giroF]]); // v355: también al editar (sustituye el anterior)
    if(_bzId&&window.bh10Buzon){window.bh10Buzon.borrar(_bzId).catch(()=>{});setBuzon(p=>p.filter(x=>x.id!==_bzId));}
    borrarDraft(DRAFT_F);
    notify(editing?'Actualizada':'Registrada');setShowForm(false);
  };

  const convertirProforma=(pf,t)=>{if(soloLector())return;
    setInvoices(p=>p.map(i=>i.id===pf.id?{...i,
      fecha:form.fecha,numFactura:form.numFactura,concepto:form.concepto||i.concepto,categoria:form.categoria||i.categoria,
      obra:form.obra||i.obra,importeBase:parseNum(form.importeBase)||i.importeBase,base2:parseNum(form.base2)||0,tipoIva2:form.tipoIva2,tipoIva:form.tipoIva,irpf:form.irpf,
      esAbono:!!form.esAbono, abonoDe:form.esAbono?(form.abonoDe||null):null,
      iva:t.iva,retencion:t.retencion,total:t.total,fechaVencimiento:form.fechaVencimiento||i.fechaVencimiento,
      ibanProveedor:normIban(form.ibanProveedor)||i.ibanProveedor,proforma:false,
      notas:((form.notas||i.notas||'')+' · Convertida desde proforma nº '+(pf.numFactura||'s/n')+' ('+fmtDate(pf.fecha)+')').trim()
    }:i));
    notify('🔁 Proforma convertida en factura definitiva — pagos conservados');
    setShowForm(false);
  };
  const restaurarFactura=(id)=>{if(soloLector())return;
    const it=invoicesAll.find(x=>x&&x.id===id&&x._del);
    if(!it)return;
    const viva=hallarDuplicada(it,invoices,null);
    if(viva&&esDupFuerte(viva)){
      notify(`No se puede restaurar: ya existe una factura VIVA de ${it.proveedor} con el nº ${it.numFactura} — edítala o elimínala primero`,'error');
      return;
    }
    setInvoices(p=>p.map(x=>{if(x.id!==id)return x;const y={...x};delete y._del;return y;}));
    notify('↩️ Restaurada');
  };
  const deleteInvoice=id=>{if(soloLector())return;if(sinAccion('borrar','borrar facturas'))return;
    // If deleting an anticipo that's applied, un-apply it first
    const inv=invoices.find(i=>i.id===id);
    if(inv?.tipo==='anticipo'&&inv.aplicadoA){
      // Just remove — the target invoice will no longer find this anticipo
    }
    // Papelera: nada se borra de verdad — se marca y desaparece de toda la app
    setInvoices(p=>p.map(i=>i.id===id?{...i,_del:Date.now()}:(i.aplicadoA===id?{...i,aplicadoA:null}:i)));
    setConfirmDel(null);notify('🗑️ Movida a la papelera (Ajustes)');
  };

  // v377 · Jesús (07-09-2026): «una factura que tengo como proforma, o como pago
  // anticipado de un pedido, no tenemos forma de pasarlo a factura definitiva
  // una vez escaneamos la factura correcta… he tenido que escanear la factura
  // como si fuera nueva, darla por pagada y eliminar el apunte de la proforma».
  // Eso perdía el pago y el documento del anticipo. Ahora se hace al revés: se
  // escanea la definitiva DESDE el anticipo, y al guardarla el anticipo queda
  // aplicado a ella — el dinero ya pagado cuenta y el saldo cuadra solo.
  const facturaDeAnticipo=(ant)=>{
    if(sinAccion('facturas','registrar la factura definitiva'))return;
    setEditing(null);
    setForm({...emptyForm,tipo:ant.tipo==='cobro'?'cobro':'factura',fecha:today,
      proveedor:ant.proveedor||'',proveedorCif:ant.proveedorCif||'',proveedorDir:ant.proveedorDir||'',
      ibanProveedor:ant.ibanProveedor||'',obra:ant.obra||'',esEstructural:!!ant.esEstructural,
      concepto:ant.concepto||'',_deAnticipo:ant.id});
    setShowForm(true);
    notify(`Escanea la factura definitiva: el anticipo de ${fmt(ant.total)} € quedará aplicado a ella`);
  };

  // Link anticipo to invoice
  const linkAnticipo=(anticipoId,facturaId)=>{
    setInvoices(p=>p.map(i=>i.id===anticipoId?{...i,aplicadoA:facturaId}:i));
    setLinkModal(null);
    const ant=invoices.find(i=>i.id===anticipoId);
    notify(`Anticipo de ${fmt(ant?.total||0)} € vinculado`);
  };

  const unlinkAnticipo=(anticipoId)=>{
    setInvoices(p=>p.map(i=>i.id===anticipoId?{...i,aplicadoA:null}:i));
    notify('Anticipo desvinculado');
  };

  // Payments
  const openPago=inv=>{setPagoModal(inv.id);setPagoForm({...emptyPago,importe:String(getSaldo(inv,invoices))});};
  const savePago=()=>{if(soloLector())return;if(sinAccion('pagos','apuntar pagos'))return;
    const imp=parseNum(pagoForm.importe)||0;if(!imp){notify('Importe','error');return;}
    const pago={id:uid(),fecha:pagoForm.fecha,importe:imp,metodo:pagoForm.metodo,referencia:pagoForm.referencia};
    setInvoices(p=>p.map(i=>i.id===pagoModal?{...i,pagos:[...(i.pagos||[]),pago]}:i));
    setPagoModal(null);notify(`Pago de ${fmt(imp)} € registrado`);
  };
  const deletePago=(invId,pagoId)=>{if(soloLector())return;if(sinAccion('pagos','quitar pagos'))return;origenCambio.current='ficha: quitar pago';setInvoices(p=>p.map(i=>i.id===invId?{...i,pagos:(i.pagos||[]).filter(pp=>pp.id!==pagoId)}:i));notify('Pago eliminado');};

  const csvTextoDe=(lista)=>{
    const h='Fecha;NºFact;Proveedor;Obra;Concepto;Categoría;Tipo;RefPresupuesto;Base;%IVA;IVA;%IRPF;Ret;Total;Pagado;Saldo;Estado;Vto;FPago;Notas;Base2;%IVA2';
    const rows=lista.map(i=>[i.fecha,i.numFactura,i.proveedor,i.obra,i.concepto,i.categoria,i.tipo,i.refPresupuesto||'',i.importeBase,i.tipoIva,i.iva,i.irpf,i.retencion,i.total,getTotalPagado(i,invoices),getSaldo(i,invoices),getEstado(i,invoices),i.fechaVencimiento,i.formaPago,i.notas,(i.base2||''),(i.base2?i.tipoIva2:'')].join(';'));
    return [h,...rows].join('\n');
  };
  const exportCSVLista=(lista,nombre)=>{
    shareOrDownload('\ufeff'+csvTextoDe(lista), `${nombre}_${today}.csv`, 'text/csv;charset=utf-8');
    notify(`CSV exportado (${lista.length} fila${lista.length!==1?'s':''})`);
  };
  const exportCSV=()=>exportCSVLista(invoices,'facturas_bh10');

  // ═══ EXPORTACIÓN A EXCEL ═══
  // El CSV plano se abría mal en Excel español: las fechas ISO quedaban como
  // texto y los importes con punto decimal no sumaban. Aquí se escribe un libro
  // de verdad: fechas como fecha, importes como número con formato de moneda,
  // cabecera fija con filtro, anchos calculados y una hoja de resumen.
  // Formato de moneda español fijado por idioma: sin el prefijo [$-C0A], un
  // Excel configurado en inglés mostraría 1,234,567.89 en vez de 1.234.567,89€.
  const FMT_EUR='[$-C0A]#,##0.00"€"';
  const hojaConFormato=(aoa,anchos,cols,opts)=>{
    const o=opts||{};
    const ws=XLSX.utils.aoa_to_sheet(aoa);
    const rango=XLSX.utils.decode_range(ws['!ref']);
    ws['!cols']=anchos.map(w=>({wch:w}));
    if(o.filtro)ws['!autofilter']={ref:XLSX.utils.encode_range({s:{r:0,c:0},e:{r:rango.e.r,c:rango.e.c}})};
    // Formato por columna: 'f' fecha, 'n' importe, 'p' porcentaje
    for(let r=1;r<=rango.e.r;r++){
      for(let c=rango.s.c;c<=rango.e.c;c++){
        const t=cols[c]; if(!t)continue;
        const cel=ws[XLSX.utils.encode_cell({r,c})]; if(!cel)continue;
        if(typeof cel.v!=='number')continue;
        if(t==='f')cel.z='dd/mm/yyyy';
        else if(t==='n')cel.z=FMT_EUR;
        else if(t==='p')cel.z='0"%"';
      }
    }
    return ws;
  };

  // La versión libre de SheetJS no escribe negritas, no fija la cabecera ni crea
  // tablas de Excel. Se rematan sobre el propio fichero: negrita en encabezados
  // y subtotales, primera fila congelada, y el rango de la hoja de datos suelta
  // convertido en TABLA con nombre, que es lo que permite insertar una tabla
  // dinámica en dos clics.
  const rematarExcel=async(buf,plan)=>{
    const {default:JSZip}=await import('jszip');
    const zip=await JSZip.loadAsync(buf);
    const esc=(s)=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const P=plan||{};

    // 1) dos estilos nuevos: negrita, y negrita con importe en euros
    const rutaEst='xl/styles.xml';
    let est=await zip.file(rutaEst).async('string');
    const nFuentes=+((est.match(/<fonts count="(\d+)"/)||[])[1]||0);
    est=est.replace(/<fonts count="(\d+)"([^>]*)>/,(m,c,resto)=>`<fonts count="${+c+1}"${resto}>`)
           .replace(/<\/fonts>/,'<font><b/><sz val="11"/><name val="Calibri"/></font></fonts>');
    const fmtEur=(est.match(/<numFmt numFmtId="(\d+)" formatCode="\[\$-C0A\]/)||[])[1];
    // Poner una fila en negrita NO puede costarle su formato de número: la fila
    // TOTAL salía con los importes en crudo, sin € ni puntos de millar, porque
    // el estilo de negrita traía el formato «General». Se crea una versión en
    // negrita POR CADA formato que ya se use, y cada celda conserva el suyo.
    const bloqueXfs=(est.match(/<cellXfs count="\d+"[^>]*>([\s\S]*?)<\/cellXfs>/)||[])[1]||'';
    const xfs=(bloqueXfs.match(/<xf\b[^>]*\/>|<xf\b[\s\S]*?<\/xf>/g)||[])
      .map(x=>+((x.match(/numFmtId="(\d+)"/)||[])[1]||0));
    let nXf=xfs.length;
    const negritaDe={};
    let nuevosXf='';
    const estiloNegrita=(nf)=>{
      if(negritaDe[nf]!==undefined)return negritaDe[nf];
      negritaDe[nf]=nXf++;
      nuevosXf+=`<xf numFmtId="${nf}" fontId="${nFuentes}" fillId="0" borderId="0" xfId="0" applyFont="1"${nf?' applyNumberFormat="1"':''}/>`;
      return negritaDe[nf];
    };
    const formatoDe=(s)=>{const i=+s;return Number.isFinite(i)&&xfs[i]!==undefined?xfs[i]:0;};

    const libro=await zip.file('xl/workbook.xml').async('string');
    const nombres=[...libro.matchAll(/<sheet[^>]*name="([^"]*)"[^>]*\/>/g)].map(m=>m[1]);
    // Al abrirlo, Excel enseña la pestaña que se le diga en vez de la primera
    const idxActiva=P.activa?nombres.indexOf(P.activa):-1;
    if(idxActiva>0){
      let lb=libro;
      if(/<bookViews>/.test(lb))
        lb=lb.replace(/<workbookView\b([^>]*)\/>/,(m,a)=>`<workbookView${a.replace(/\s*activeTab="\d+"/,'')} activeTab="${idxActiva}"/>`);
      else
        lb=lb.replace('<sheets>',`<bookViews><workbookView activeTab="${idxActiva}"/></bookViews><sheets>`);
      zip.file('xl/workbook.xml',lb);
    }
    const hojas=Object.keys(zip.files).filter(f=>/^xl\/worksheets\/sheet\d+\.xml$/.test(f))
      .sort((a,b)=>(+a.match(/(\d+)/)[1])-(+b.match(/(\d+)/)[1]));

    for(let h=0;h<hojas.length;h++){
      const nombre=nombres[h];
      let xml=await zip.file(hojas[h]).async('string');
      const conTabla=P.tabla&&P.tabla.hoja===nombre;
      const negritas=(P.negritas&&P.negritas[nombre])||[];   // filas 0-index a destacar
      const eurNegrita=(P.eurNegrita&&P.eurNegrita[nombre])||[];

      // Hoja activa y cabecera congelada se escriben juntas: las dos viven en
      // el mismo <sheetView> y hacerlo en dos pasos borraría una de ellas.
      const esActiva=P.activa&&nombre===P.activa;
      const congela=P.congelar&&P.congelar.indexOf(nombre)>=0;
      if(esActiva||congela){
        const attrs='workbookViewId="0"'+(esActiva?' tabSelected="1"':'');
        const dentro=congela?'<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft"/>':'';
        xml=xml.replace('<sheetView workbookViewId="0"/>',
          dentro?`<sheetView ${attrs}>${dentro}</sheetView>`:`<sheetView ${attrs}/>`);
      }
      // negrita fila a fila
      const marcar=(fila0)=>{
        const nf=fila0+1;
        const re=new RegExp('<row r="'+nf+'"[^>]*>[\\s\\S]*?<\\/row>');
        const m=xml.match(re);
        if(!m)return;
        // Cada celda conserva SU formato de número; solo se le añade la negrita
        const conEstilo=m[0].replace(/<c r="([A-Z]+)(\d+)"(\s+s="(\d+)")?/g,(mm,col,fil,sAnt,sNum)=>
          `<c r="${col}${fil}" s="${estiloNegrita(sAnt?formatoDe(sNum):0)}"`);
        xml=xml.replace(m[0],conEstilo);
      };
      negritas.forEach(f=>marcar(f));
      eurNegrita.forEach(f=>marcar(f));

      if(conTabla){
        xml=xml.replace(/<autoFilter[^>]*\/>/,'');
        xml=xml.replace(/<\/worksheet>/,'<tableParts count="1"><tablePart r:id="rIdTabla1"/></tableParts></worksheet>');
        zip.file('xl/tables/table1.xml',
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n`+
          `<table xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" id="1" name="${esc(P.tabla.nombre)}" displayName="${esc(P.tabla.nombre)}" ref="${P.tabla.ref}" totalsRowShown="0">`+
          `<autoFilter ref="${P.tabla.ref}"/>`+
          `<tableColumns count="${P.tabla.cab.length}">`+
          P.tabla.cab.map((c,i)=>`<tableColumn id="${i+1}" name="${esc(c)}"/>`).join('')+
          `</tableColumns>`+
          `<tableStyleInfo name="TableStyleMedium2" showFirstColumn="0" showLastColumn="0" showRowStripes="1" showColumnStripes="0"/>`+
          `</table>`);
        zip.file(`xl/worksheets/_rels/${hojas[h].split('/').pop()}.rels`,
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n`+
          `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`+
          `<Relationship Id="rIdTabla1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/table" Target="../tables/table1.xml"/>`+
          `</Relationships>`);
      }
      zip.file(hojas[h],xml);
    }

    // Ya se sabe cuántos estilos en negrita hacen falta: se escriben ahora
    est=est.replace(/<cellXfs count="(\d+)"([^>]*)>/,(m,c,resto)=>`<cellXfs count="${nXf}"${resto}>`)
           .replace(/<\/cellXfs>/,nuevosXf+'</cellXfs>');
    zip.file(rutaEst,est);

    if(P.tabla){
      const rutaCT='[Content_Types].xml';
      let ct=await zip.file(rutaCT).async('string');
      if(!ct.includes('/xl/tables/table1.xml'))
        ct=ct.replace('</Types>','<Override PartName="/xl/tables/table1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml"/></Types>');
      zip.file(rutaCT,ct);
    }
    return await zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  };


  const ESTADO_ES={pagada:'Pagada',pendiente:'Pendiente',parcial:'Parcial',vencida:'Vencida',parcial_vencida:'Parcial vencida',anticipo_libre:'Anticipo sin aplicar',aplicado:'Anticipo aplicado'};
  const exportExcelLista=(lista,nombre,titulo,filtroTxt)=>{
    if(sinAccion('exportar','exportar'))return;
    if(!lista.length){notify('No hay facturas que exportar','error');return;}
    // Excel guarda las fechas como número de días desde el 30/12/1899. Se calcula
    // a mano desde el texto AAAA-MM-DD: usar un objeto Date hacía que, en España,
    // cada fecha se guardara 44 segundos antes de medianoche y Excel mostrase EL
    // DÍA ANTERIOR. Con enteros no hay husos horarios que valgan.
    const fecha=(s)=>{
      const m=(typeof s==='string')?s.match(/^(\d{4})-(\d{2})-(\d{2})/):null;
      if(!m)return '';
      const dias=Math.round((Date.UTC(+m[1],+m[2]-1,+m[3])-Date.UTC(1899,11,30))/864e5);
      return dias>0?dias:'';
    };
    // v362 · Jesús (04-09-2026): «voy a sacar el Excel, añadir una columna con la
    // calle de la promoción y luego importarlo». Las dos últimas columnas
    // hacen posible la vuelta: «Obra» (la actual, para editarla ahí mismo) e
    // «id» (para que la app case cada fila sin equivocarse).
    const cab=['Fecha factura','Fecha registro','Nº factura','Empresa','Concepto','Importe base','Importe IVA','Total','Estado','Pagado','Saldo pendiente','Vencimiento','Obra','id (no tocar)'];
    const tipos={0:'f',1:'f',5:'n',6:'n',7:'n',9:'n',10:'n',11:'f'};
    const ANCHOS=[13,14,16,34,38,15,14,15,16,14,16,13,30,16];
    const filaDe=(i)=>[fecha(i.fecha),fecha(fechaRegistroDe(i)),i.numFactura||'',i.proveedor||'',i.concepto||'',
      +i.importeBase||0,+i.iva||0,+i.total||0,
      ESTADO_ES[getEstado(i,invoices)]||getEstado(i,invoices),
      +getTotalPagado(i,invoices).toFixed(2),Math.max(+getSaldo(i,invoices).toFixed(2),0),fecha(i.fechaVencimiento),String(i.obra||''),String(i.id||'')];

    // ── Bloques por proveedor ──
    // Cada proveedor abre su bloque con un subtotal que suma las facturas que
    // vienen debajo; los bloques se ordenan por lo que se debe a cada uno, y las
    // facturas dentro de cada bloque por su pendiente, de mayor a menor.
    const porProv={};
    lista.forEach(i=>{const k=i.proveedor||'(sin proveedor)';(porProv[k]=porProv[k]||[]).push(i);});
    const grupos=Object.keys(porProv).map(k=>{
      const fs=[...porProv[k]].sort((a,b)=>{
        const sa=Math.max(getSaldo(a,invoices),0), sb=Math.max(getSaldo(b,invoices),0);
        if(Math.abs(sa-sb)>0.005)return sb-sa;
        return String(b.fecha||'').localeCompare(String(a.fecha||''));
      });
      const sum=(f)=>+fs.reduce((s,i)=>s+f(i),0).toFixed(2);
      return {emp:k,fs,
        base:sum(i=>+i.importeBase||0), iva:sum(i=>+i.iva||0), total:sum(i=>+i.total||0),
        pagado:sum(i=>getTotalPagado(i,invoices)), saldo:sum(i=>Math.max(getSaldo(i,invoices),0))};
    }).sort((a,b)=>(Math.abs(a.saldo-b.saldo)>0.005?b.saldo-a.saldo:a.emp.localeCompare(b.emp,'es')));

    const aoaF=[cab];
    const merges=[], filasSub=[], filasCab=[0];
    grupos.forEach(g=>{
      const r=aoaF.length;                    // fila 0-index del subtotal
      const p=r+2;                            // primera fila de facturas (1-index de Excel)
      const u=p+g.fs.length-1;                // última
      const sf=(L,v)=>({t:'n',f:`SUM(${L}${p}:${L}${u})`,v});
      aoaF.push([`▸ ${g.emp} · ${g.fs.length} factura${g.fs.length!==1?'s':''}`,'','','','',
        sf('F',g.base),sf('G',g.iva),sf('H',g.total),'',sf('J',g.pagado),sf('K',g.saldo),'','','']);
      merges.push({s:{r,c:0},e:{r,c:4}});
      filasSub.push(r);
      g.fs.forEach(i=>aoaF.push(filaDe(i)));
    });
    const n=lista.length;
    const wsF=hojaConFormato(aoaF,ANCHOS,tipos);
    wsF['!merges']=merges;
    // los subtotales llevan formato de euros aunque sean fórmulas
    filasSub.forEach(r=>{[5,6,7,9,10].forEach(c=>{const cel=wsF[XLSX.utils.encode_cell({r,c})];if(cel)cel.z=FMT_EUR;});});

    // ── Hoja de datos suelta, sin subtotales: fuente para tablas dinámicas ──
    const aoaD=[cab,...grupos.flatMap(g=>g.fs.map(filaDe))];
    const wsD=hojaConFormato(aoaD,ANCHOS,tipos,{filtro:true});

    // ── Hoja de saldos ──
    const D=`Datos!`;
    const col=(L)=>`${D}$${L}$2:$${L}$${n+1}`;
    const datos=aoaD.slice(1);
    const estados=[...new Set(datos.map(d=>d[8]))];
    const meses=[...new Set(lista.map(i=>(i.fecha||'').slice(0,7)).filter(Boolean))].sort();
    const sumaCol=(f,ix)=>+f.reduce((s,d)=>s+(+d[ix]||0),0).toFixed(2);
    const totalBase=sumaCol(datos,5), totalIva=sumaCol(datos,6), totalTot=sumaCol(datos,7);
    const totalPag=sumaCol(datos,9), totalSal=sumaCol(datos,10);
    const fx=(formula,valor)=>({t:'n',f:formula,v:+(+valor).toFixed(2)});
    const aoa=[];
    const destac=[];
    // Filas cuyo segundo dato es un número de facturas, no un importe: llevaban
    // el símbolo del euro y se leían como si 62 facturas fueran 62,00 €.
    const filasConteo=[];
    aoa.push([titulo||'Facturas exportadas']); destac.push(0);
    aoa.push([filtroTxt?('Contenido: '+filtroTxt):'Contenido: todas las facturas del listado']);
    aoa.push([`${n} factura${n!==1?'s':''} · ${grupos.length} proveedor${grupos.length!==1?'es':''} · exportado el ${fmtDate(today)}`]);
    aoa.push([]);
    aoa.push(['TOTALES']); destac.push(aoa.length-1);
    aoa.push(['Base','IVA','Total','Pagado','Pendiente']); destac.push(aoa.length-1);
    aoa.push([totalBase,totalIva,totalTot,totalPag,totalSal]);
    aoa.push([]);
    aoa.push(['POR ESTADO']); destac.push(aoa.length-1);
    aoa.push(['Estado','Facturas','Base','IVA','Total','Pagado','Pendiente']); destac.push(aoa.length-1);
    const filaEstado0=aoa.length+1;
    estados.forEach(e=>{
      const cond=`${col('I')},$A${aoa.length+1}`;
      const dd=datos.filter(d=>d[8]===e);
      filasConteo.push(aoa.length);
      aoa.push([e,fx(`COUNTIFS(${cond})`,dd.length),
        fx(`SUMIFS(${col('F')},${cond})`,sumaCol(dd,5)),fx(`SUMIFS(${col('G')},${cond})`,sumaCol(dd,6)),
        fx(`SUMIFS(${col('H')},${cond})`,sumaCol(dd,7)),fx(`SUMIFS(${col('J')},${cond})`,sumaCol(dd,9)),
        fx(`SUMIFS(${col('K')},${cond})`,sumaCol(dd,10))]);
    });
    const filaEstadoN=aoa.length;
    filasConteo.push(aoa.length);
    aoa.push(['TOTAL',fx(`SUM(B${filaEstado0}:B${filaEstadoN})`,n),
      fx(`SUM(C${filaEstado0}:C${filaEstadoN})`,totalBase),fx(`SUM(D${filaEstado0}:D${filaEstadoN})`,totalIva),
      fx(`SUM(E${filaEstado0}:E${filaEstadoN})`,totalTot),fx(`SUM(F${filaEstado0}:F${filaEstadoN})`,totalPag),
      fx(`SUM(G${filaEstado0}:G${filaEstadoN})`,totalSal)]); destac.push(aoa.length-1);
    aoa.push([]);
    aoa.push(['POR EMPRESA']); destac.push(aoa.length-1);
    aoa.push(['Empresa','Facturas','Base','IVA','Total','Pagado','Pendiente']); destac.push(aoa.length-1);
    grupos.forEach(g=>{
      const cond=`${col('D')},$A${aoa.length+1}`;
      filasConteo.push(aoa.length);
      aoa.push([g.emp,fx(`COUNTIFS(${cond})`,g.fs.length),
        fx(`SUMIFS(${col('F')},${cond})`,g.base),fx(`SUMIFS(${col('G')},${cond})`,g.iva),
        fx(`SUMIFS(${col('H')},${cond})`,g.total),fx(`SUMIFS(${col('J')},${cond})`,g.pagado),
        fx(`SUMIFS(${col('K')},${cond})`,g.saldo)]);
    });
    aoa.push([]);
    aoa.push(['POR MES DE FACTURA']); destac.push(aoa.length-1);
    aoa.push(['Mes','Facturas','Base','IVA','Total','Pagado','Pendiente']); destac.push(aoa.length-1);
    const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    meses.forEach(m=>{
      const dd=lista.filter(i=>(i.fecha||'').slice(0,7)===m);
      const s=(f)=>+dd.reduce((x,i)=>x+f(i),0).toFixed(2);
      filasConteo.push(aoa.length);
      aoa.push([`${MESES[+m.slice(5,7)-1]} ${m.slice(0,4)}`,dd.length,
        s(i=>+i.importeBase||0),s(i=>+i.iva||0),s(i=>+i.total||0),
        s(i=>getTotalPagado(i,invoices)),s(i=>Math.max(getSaldo(i,invoices),0))]);
    });
    const wsS=XLSX.utils.aoa_to_sheet(aoa);
    wsS['!cols']=[{wch:36},{wch:10},{wch:15},{wch:14},{wch:15},{wch:15},{wch:15}];
    const rgS=XLSX.utils.decode_range(wsS['!ref']);
    const esConteo=new Set(filasConteo);
    for(let r=0;r<=rgS.e.r;r++)for(let c=1;c<=6;c++){
      const cel=wsS[XLSX.utils.encode_cell({r,c})];
      if(!cel||typeof cel.v!=='number')continue;
      cel.z=(c===1&&esConteo.has(r))?'0':FMT_EUR;   // recuento entero, sin €
    }
    for(let c=0;c<=4;c++){const cel=wsS[XLSX.utils.encode_cell({r:6,c})];if(cel)cel.z=FMT_EUR;}

    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,wsS,'Saldos');
    XLSX.utils.book_append_sheet(wb,wsF,'Facturas');
    XLSX.utils.book_append_sheet(wb,wsD,'Datos');
    wb.Props={Title:titulo||'Facturas',Author:(compCfg&&compCfg.name)||'',CreatedDate:new Date()};
    const plan={
      // Se abre por el desglose por proveedor, que es lo que se mira primero
      activa:'Facturas',
      congelar:['Facturas','Datos'],
      negritas:{Saldos:destac,Facturas:filasCab,Datos:[0]},
      eurNegrita:{Facturas:filasSub},
      tabla:{hoja:'Datos',nombre:'Facturas',ref:XLSX.utils.encode_range({s:{r:0,c:0},e:{r:n,c:cab.length-1}}),cab},
    };
    const buf=XLSX.write(wb,{bookType:'xlsx',type:'array'});
    (async()=>{
      let salida=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      try{ salida=await rematarExcel(buf,plan); }catch(e){ console.warn('remate del Excel omitido:',e); }
      shareOrDownload(salida,`${nombre}_${today}.xlsx`,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      notify(`📊 Excel exportado — ${n} factura${n!==1?'s':''} en ${grupos.length} bloque${grupos.length!==1?'s':''} por proveedor`);
    })();
  };
  const toggleFaceID=async()=>{
    if(!window.bh10FaceID){notify('Solo disponible en la app instalada','error');return;}
    if(!window.bh10FaceID.soportado()){notify('Este dispositivo no admite Face ID en la web','error');return;}
    try{
      if(faceOn){window.bh10FaceID.desactivar();setFaceOn(false);notify('Face ID desactivado');}
      else{await window.bh10FaceID.activar(facePass);setFacePass('');setFaceOn(true);notify('🔒 Face ID activado — la próxima apertura entrará con tu cara');}
    }catch(e){notify('No se pudo activar: '+((e&&e.message)||e),'error');}
  };
  const marcarPagadasEnBloque=(ids,fechaPago)=>{
    if(soloLector())return;
    const set=new Set(ids);
    let n=0, suma=0;
    setInvoices(p=>p.map(i=>{
      if(!set.has(i.id))return i;
      const pend=(i.total||0)-getTotalPagado(i,p);
      if(pend<=0.01)return i;
      n++; suma+=pend;
      return {...i,pagos:[...(i.pagos||[]),{id:uid(),fecha:fechaPago||today,importe:+pend.toFixed(2),metodo:'Transferencia',referencia:'Marcado en bloque'}]};
    }));
    setMasPago(null);
    notify(`✅ ${n} factura${n!==1?'s':''} marcada${n!==1?'s':''} como pagada${n!==1?'s':''} · ${fmt(suma)} €`);
  };
  const rangoPeriodo=(clave,extra)=>{
    const h=new Date(), y=h.getFullYear(), m=h.getMonth();
    const iso2=(d)=>d.toISOString().slice(0,10);
    const dosD=(n)=>String(n).padStart(2,'0');
    if(clave==='mes')     return {ini:iso2(new Date(y,m,1)),  fin:iso2(new Date(y,m+1,0)),  etq:y+'-'+dosD(m+1)};
    if(clave==='mesant'){ const a=m===0?y-1:y, mm=(m+11)%12;
                          return {ini:iso2(new Date(a,mm,1)), fin:iso2(new Date(a,mm+1,0)), etq:a+'-'+dosD(mm+1)}; }
    if(clave==='trim'){   const qA=Math.floor(m/3);
                          const q=(extra===undefined||extra===null)?qA:+extra;
                          const ay=(q>qA)?y-1:y;
                          return {ini:iso2(new Date(ay,q*3,1)), fin:iso2(new Date(ay,q*3+3,0)), etq:ay+'-T'+(q+1)}; }
    if(clave==='anio')    return {ini:y+'-01-01',   fin:y+'-12-31',   etq:String(y)};
    if(clave==='anioant') return {ini:(y-1)+'-01-01', fin:(y-1)+'-12-31', etq:String(y-1)};
    return {ini:iso2(new Date(y,m,1)),fin:iso2(new Date(y,m+1,0)),etq:y+'-'+dosD(m+1)};
  };
  // ── descarga de documentos de una lista de facturas (v356) ─────────────
  // Compartida por el paquete de la gestoría y por «📎 ZIP» de la lista
  // filtrada: tres intentos, integridad, esquema, nombres únicos y estado por
  // factura ('documentos/x.pdf' | {fallo} | nada = sin adjuntar).
  const descargarDocumentos=async(lista,onProgreso)=>{
    const entradas=[];const estado={};let subidos=0;
    const conAdj=lista.filter(i=>i.adjPath);
    if(window.bh10Adj&&conAdj.length){
        const ext=(t)=>({'application/pdf':'pdf','image/jpeg':'jpg','image/png':'png','image/heic':'heic','image/webp':'webp'})[t]||'bin';
        const nombresZip=new Set();
        let vistos=0;
        for(const i of conAdj){
          vistos++;if(onProgreso)onProgreso(vistos,conAdj.length);
          try{
            // Un enlace en esquema que la app no entiende («adjfs:…») falla
            // siempre: se declara ya, por su nombre, sin gastar reintentos.
            const esq=esquemaEnlace(i.adjPath);
            if(!esq.ok)throw errorDefinitivo(esq.motivo);
            // Tres intentos con espera creciente: un tirón de red o de
            // Firestore ya no deja fuera una factura. Y el documento se
            // comprueba entero antes de entrar: un PDF sin cola %%EOF (trozo
            // perdido) se reintenta, y si sigue mal se declara, no se cuela.
            const r=await conReintentos(async()=>{
              const r=await window.bh10Adj.blobDe(i.adjPath);
              if(r===null)throw errorDefinitivo('no existe en la nube (enlace roto)');
              const blob=(r&&r.blob)?r.blob:r;                   // blobDe devuelve {blob,nombre}
              if(!blob||typeof blob.arrayBuffer!=='function')throw new Error('respuesta sin documento');
              const bytes=new Uint8Array(await blob.arrayBuffer());
              const motivo=sanoDocumento(bytes,blob.type,r&&r.nombre);
              if(motivo)throw new Error(motivo);
              return {bytes,tipo:blob.type,nombre:(r&&r.nombre)||''};
            });
            // La extensión sale del tipo del archivo; si no consta, del nombre guardado
            const porNombre=String(r.nombre||'').split('.').pop().toLowerCase();
            const e=ext(r.tipo)!=='bin'?ext(r.tipo):(/^(pdf|jpg|jpeg|png|heic|webp)$/.test(porNombre)?porNombre:'pdf');
            const nom=nombreUnico(i.fecha+'_'+String(i.proveedor||'').replace(/[^A-Za-z0-9 _-]/g,'').slice(0,30).trim().replace(/ +/g,'_')+'_'+String(i.numFactura||i.id).replace(/[^A-Za-z0-9._-]/g,'')+'.'+e,nombresZip);
            // Se entrega el contenido ya convertido: así no depende de que la
            // librería del ZIP sepa interpretar el tipo de archivo del navegador.
            entradas.push({nombre:'documentos/'+nom,bytes:r.bytes});subidos++;estado[i.id]='documentos/'+nom;
          }catch(e){estado[i.id]={fallo:(e&&e.message)||'error desconocido'};}
        }
    }else if(conAdj.length){conAdj.forEach(i=>{estado[i.id]={fallo:'sin acceso a la nube desde aquí'};});}
    return {entradas,estado,subidos};
  };
  // ── trocea en zips de ≤10 MB y descarga (v356, compartido) ─────────────
  const descargarEnZips=async(entradas,nombreBase,clave,fuerte)=>{
    const TOPE=10*1024*1024;
    const pesa=(e)=>e.bytes?e.bytes.length:(new TextEncoder().encode(e.texto||'')).length;
    const docs=entradas.filter(e=>e.nombre.startsWith('documentos/'));
    const fijas=entradas.filter(e=>!e.nombre.startsWith('documentos/'));
    // Los CSV, el resumen y el léeme van SIEMPRE en el primero, enteros
    const lotes=[[...fijas]];
    let peso=fijas.reduce((s,e)=>s+pesa(e),0);
    docs.forEach(d=>{
      const p=pesa(d);
      if(peso+p>TOPE&&lotes[lotes.length-1].length>(lotes.length===1?fijas.length:0)){
        lotes.push([]); peso=0;
      }
      lotes[lotes.length-1].push(d); peso+=p;
    });
    const n=lotes.length;
    // El léeme dice de cuántas partes consta y qué lleva cada una
    if(n>1){
      const idx=fijas.findIndex(e=>e.nombre==='LEEME.txt');
      if(idx>=0)fijas[idx].texto+='\nEste envío va en '+n+' archivos: '+
        lotes.map((l,k)=>'parte '+(k+1)+' ('+l.filter(e=>e.nombre.startsWith('documentos/')).length+' documentos)').join(', ')+
        '.\nDescomprímelos todos en la misma carpeta.\n';
    }
    const zips=[];
    for(let k=0;k<n;k++){
      const nom=nombreBase+(n>1?('_parte'+(k+1)+'de'+n):'')+'.zip';
      zips.push({nombre:nom,blob:await crearZipSeguro(lotes[k],{clave,fuerte})});
    }
    if(n===1){ await shareOrDownload(zips[0].blob,zips[0].nombre,'application/zip'); }
    else { setPaqueteTrozos(zips); }
    return zips;
  };
  // ── «📎 ZIP» de la lista filtrada con sus documentos (v356) ────────────
  // Jesús (03-09-2026): «como el Excel según filtros… exportar las imágenes
  // como hacemos con Reme en un zip». Mismo filtro que el Excel, misma
  // maquinaria que el paquete: CSV de la lista + LÉEME con cuadre +
  // cuadre_documentos.csv + documentos/. Sin lector, sin tokens.
  const exportZipLista=async(lista,descripcion)=>{
    if(sinAccion('exportar','exportar'))return;
    if(!ES_APP){notify('La exportación con documentos vive en la app de bh10group.com','error');return;}
    if(zipListaBusy||!lista.length)return;setZipListaBusy(true);
    try{
      notify(`📎 Descargando documentos de ${lista.length} facturas…`);
      const {entradas:docs,estado,subidos}=await descargarDocumentos(lista,(v,t)=>{if(v%20===0)notify(`📎 ${v} de ${t} documentos…`);});
      const cuadre=cuadrarEnvio(lista,estado);
      const entradas=[
        {nombre:'LEEME.txt',texto:'Facturas recibidas con documentos\nFiltro: '+(descripcion||'todas')+'\nGenerado: '+new Date().toLocaleString('es-ES')+'\n\nContenido: facturas.csv (la lista tal como estaba filtrada), cuadre_documentos.csv (una fila por factura con su documento) y '+subidos+' documentos en documentos/.\n\n'+textoCuadre(cuadre)},
        {nombre:'facturas.csv',texto:'\ufeff'+csvTextoDe(lista)},
        {nombre:'cuadre_documentos.csv',texto:'\ufeff'+csvCuadre(lista,estado)},
        ...docs];
      await descargarEnZips(entradas,'facturas_'+today+'_documentos','',false);
      notify(`📎 ZIP listo: ${lista.length} facturas · ${subidos} documentos`+(cuadre.sinAdj.length?` · ${cuadre.sinAdj.length} sin adjuntar`:'')+(cuadre.fallidos.length?` · ${cuadre.fallidos.length} no descargados (ver LEEME)`:''),cuadre.fallidos.length?'error':undefined);
    }catch(e){notify('No se pudo crear el ZIP: '+String(e&&e.message||e).slice(0,90),'error');}
    setZipListaBusy(false);
  };
  const generarPaqueteGestoria=async(rango,seguridad)=>{
    if(sinAccion('exportar','el paquete para la gestoría'))return;
    if(!ES_APP){notify('El paquete gestoría vive en la app de bh10group.com','error');return;}
    if(pkBusy)return;setPkBusy(true);
    try{
      const hoy=new Date();
      const r=(rango&&rango.ini&&rango.fin)?rango:rangoPeriodo('mesant');
      let ini=new Date(r.ini), fin=new Date(r.fin), per=r.etq;
      fin.setHours(23,59,59,999);
      const enP=(i)=>{const d=fechaSegura(i.fecha);return !!d&&d>=ini&&d<=fin;};
      // Las que no tienen fecha legible no caben en ningún trimestre: se avisan
      const sinFecha=invoices.filter(i=>esGastoFiscal(i)&&!fechaSegura(i.fecha));
      const recP=invoices.filter(i=>esGastoFiscal(i)&&enP(i));
      const cobP=invoices.filter(i=>i.tipo==='cobro'&&!esAnulada(i)&&enP(i));
      const pendTod=invoices.filter(i=>esDeudaProveedor(i)&&getSaldo(i,invoices)>0.009);
      notify('📦 Preparando paquete '+per+'…');
      // Mismo empaquetador que el expediente de notaría: una sola forma de
      // hacer un zip en toda la app, y la contraseña disponible en los dos.
      const entradas=[
        {nombre:'facturas_recibidas_'+per+'.csv',texto:'\ufeff'+csvTextoDe(recP)},
        {nombre:'pendientes_a_hoy.csv',texto:'\ufeff'+csvTextoDe(pendTod)},
      ];
      if(cobP.length)entradas.splice(1,0,{nombre:'emitidas_cobros_'+per+'.csv',texto:'\ufeff'+csvTextoDe(cobP)});
      const agg={};
      const suma=(t,b,v)=>{const k=String(t??0);agg[k]=agg[k]||{base:0,iva:0};agg[k].base+=b;agg[k].iva+=v;};
      recP.forEach(i=>{const b1=+i.importeBase||0;suma(i.tipoIva,b1,+(b1*(i.tipoIva||0)/100).toFixed(2));if(i.base2>0)suma(i.tipoIva2,+i.base2,+((+i.base2)*(i.tipoIva2||0)/100).toFixed(2));});
      let res='RESUMEN '+per+' — '+(compCfg.name||'Empresa')+(compCfg.cif?' ('+compCfg.cif+')':'')+'\n\nIVA SOPORTADO (recibidas del trimestre):\n';
      Object.keys(agg).sort((a,b)=>(+b)-(+a)).forEach(k=>{res+='  Base '+k+'%'+(k==='0'?' (ISP/exentas)':'')+': '+agg[k].base.toFixed(2)+' €  ·  IVA: '+agg[k].iva.toFixed(2)+' €\n';});
      res+='\nTotal recibidas: '+recP.length+' facturas · '+recP.reduce((s,i)=>s+(+i.total||0),0).toFixed(2)+' €\n';
      res+='Pendiente de pago a hoy: '+pendTod.reduce((s,i)=>s+getSaldo(i,invoices),0).toFixed(2)+' € en '+pendTod.length+' facturas\n';
      entradas.push({nombre:'resumen.txt',texto:res});
      const {entradas:entradasDocs,estado,subidos}=await descargarDocumentos(recP);
      entradasDocs.forEach(e=>entradas.push(e));
      const cuadre=cuadrarEnvio(recP,estado);
      const sinDoc=cuadre.sinAdj.length;
      entradas.push({nombre:'cuadre_documentos.csv',texto:'\ufeff'+csvCuadre(recP,estado)});
      entradas.unshift({nombre:'LEEME.txt',texto:'Paquete gestoría '+per+'\nGenerado: '+new Date().toLocaleString('es-ES')+'\n\nContenido: CSV de recibidas'+(cobP.length?' y emitidas':'')+' del trimestre, pendientes a hoy, resumen de IVA, cuadre_documentos.csv (una fila por factura con su documento) y '+subidos+' documentos.\n\n'+textoCuadre(cuadre)
        +(sinFecha.length?'\nATENCIÓN: '+sinFecha.length+' factura(s) sin fecha legible NO entran en ningún periodo:\n'
          +sinFecha.slice(0,40).map(i=>'  · '+(i.proveedor||'')+' nº'+(i.numFactura||'s/n')+' ('+(i.fecha||'sin fecha')+')').join('\n')+'\n':'')
        +((seguridad&&seguridad.clave)?'\nEste archivo va protegido con contraseña.\n':'')});
      const clave=(seguridad&&seguridad.clave)||'';
      const zips=await descargarEnZips(entradas,'gestoria_'+per+'_BH10',clave,!!(seguridad&&seguridad.fuerte));
      const blob=zips[0].blob;
      if(clave)anotarCesion('GESTORÍA · '+per,['Paquete de '+recP.length+' facturas']);
      notify('📦 Paquete listo: '+recP.length+' facturas · '+subidos+' documentos'+(cuadre.sinAdj.length?' · '+cuadre.sinAdj.length+' sin adjuntar':'')+(cuadre.fallidos.length?' · '+cuadre.fallidos.length+' NO descargadas (ver LEEME)':'')+(clave?' · protegido':''),cuadre.fallidos.length?'error':undefined);
    }catch(e){console.error(e);notify('No se pudo generar el paquete: '+(e.message||e),'error');}
    setPkBusy(false);
  };

  // ═══ OCR SCAN ═══
  // Cabeceras del lector IA: en la app instalada hacen falta la clave propia y
  // el permiso de navegador; como artefacto de Claude la sesión ya va firmada.
  // v368 · la clave de la IA sale del navegador: si hay Worker configurado (Ajustes → Master → URL), la
  // llamada va a <worker>/ia con el token de Firebase y la clave vive allí como secreto. Sin Worker,
  // se sigue llamando en directo con la clave guardada (transición).
  // v379 · Jesús (07-09-2026): «me está funcionando en big house, es el green
  // donde no me está funcionando». Los ajustes se guardan POR EMPRESA, así que
  // la dirección del Worker estaba puesta en Big House y no en Green. Y sin
  // Worker la app caía a llamar a Anthropic DIRECTAMENTE con una clave guardada
  // en el navegador —la vieja, ya revocada—, que es justo lo que quitamos en
  // agosto por seguridad. Dos arreglos: la dirección se recuerda en el aparato
  // (vale para todas las empresas del grupo) y el camino directo desaparece.
  const urlMaster=()=>{
    const u=String((masterCfg&&masterCfg.url)||'').trim();
    if(u)return u;
    try{return String(localStorage.getItem('bh10-master-url')||'').trim();}catch(e){return '';}
  };
  const iaPorWorker=()=>!!urlMaster();
  const urlIA=()=>urlMaster().replace(/\/$/,'')+'/ia';   // v379 · SIEMPRE por el Worker: nunca a la API con una clave del navegador
  const tokenIARef=useRef('');
  // v376 · Jesús: «tengo un problema importante con los lectores». Salía
  // «Error API (403)» y nada más: el mensaje del Worker se tiraba a la basura,
  // así que no había forma de saber si era la sesión, los permisos o la clave.
  // Ahora se lee el cuerpo y se traduce a algo accionable.
  const errorIA=async(resp)=>{
    let tx='';try{tx=await resp.text();}catch(e){}
    let msg='';try{const j=JSON.parse(tx);msg=(j&&(j.error&&(j.error.message||j.error)||j.message))||'';}catch(e){msg=tx.slice(0,160);}
    msg=String(msg||'').slice(0,180);
    // v379 · el CONTENIDO manda sobre el número. Un 401 con «API key is
    // invalid» lo dice Anthropic, no la sesión: mandar a Jesús a cerrar sesión
    // por una clave mal pegada es peor que no decir nada. Fallo mío de la v376.
    if(/api key|x-api-key|authentication_error|credit balance|billing/i.test(msg))
      return 'La clave de la IA no vale o no tiene saldo: revisa ANTHROPIC_KEY en el Worker (ojo a los espacios al pegarla) y el saldo en console.anthropic.com. ('+msg+')';
    if(resp.status===401)return 'La IA no reconoce tu sesión: cierra sesión, vuelve a entrar y repite. ('+msg+')';
    if(resp.status===403&&/no activo|dueño/i.test(msg))
      return 'El Worker no te reconoce como usuario activo: revisa que DUENO_UID sea tu UID de Firebase. ('+msg+')';
    if(resp.status===403)return 'La clave de la IA no está autorizada: revisa ANTHROPIC_KEY en el Worker (puede estar rotada o sin saldo). ('+msg+')';
    if(resp.status===413)return 'Archivo demasiado grande';
    if(resp.status===429)return 'Límite de solicitudes — reintenta en 1 min';
    if(resp.status===500&&/ANTHROPIC_KEY/.test(msg))return 'El Worker no tiene puesta la clave ANTHROPIC_KEY';
    return `Error API (${resp.status})`+(msg?': '+msg:'');
  };
  // v379 · la cabecera ya no lleva NINGUNA clave: solo tu sesión. La clave de
  // la IA vive en el Worker y no vuelve a pisar el navegador.
  const cabIA=()=>{const h={'Content-Type':'application/json'};
    if(tokenIARef.current)h['Authorization']='Bearer '+tokenIARef.current;
    return h;};
  const cabToken=async()=>{try{const t=window.bh10Token?await window.bh10Token():'';return t?{Authorization:'Bearer '+t}:{};}catch(e){return {};}};
  const prepararIA=async()=>{if(iaPorWorker()&&window.bh10Token){try{tokenIARef.current=await window.bh10Token();}catch(e){tokenIARef.current='';}}};
  // ═══ RECOLECTOR DE CORREOS DE PROVEEDORES (Gmail) ═══
  const [propCorreos,setPropCorreos]=useState(null);   // propuestas a revisar
  const [docsGmail,setDocsGmail]=useState(null);
  // v387 · rebuscar con otro concepto, y quitar de la lista lo que no aparezca
  const [otraBusca,setOtraBusca]=useState(null);
  // v389 · expediente de obra (lista de Jesús): ventana por obra
  const [expedienteObra,setExpedienteObra]=useState(null);   // la obra abierta
  const [elegirDe,setElegirDe]=useState(null);   // v393 · línea con la lista abierta
  // v391 · Jesús: «no quiero tener que tener una obra vinculada». El expediente
  // vive donde se abra: en la OBRA o en el CONTRATO mismo.
  const guardarExpediente=(suj,cambio)=>{
    const pon=x=>({...x,expediente:{...(x.expediente||{}),...cambio}});
    if(suj.tipo==='contrato')setContratos(p=>p.map(x=>String(x.id)===String(suj.id)?pon(x):x));
    else persistObras(obras.map(x=>String(x.id)===String(suj.id)?pon(x):x));
  };
  const cotejarConDrive=async(o,suj)=>{
    const carpeta=idCarpetaDrive(o.expediente&&o.expediente.carpeta);
    if(!carpeta){notify('Pega antes el enlace de la carpeta de Drive','error');return;}
    const clientId=await leerGmailId(); if(!clientId){setPideGmailId(true);return;}
    setEngBusy('drive|'+o.id);
    try{
      const tok=await tokenGoogle(clientId,'https://www.googleapis.com/auth/drive.metadata.readonly',driveTokenRef);
      const q=encodeURIComponent(`'${carpeta}' in parents and trashed=false`);
      const r=await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(name,webViewLink)&pageSize=200`,{headers:{Authorization:'Bearer '+tok}});
      if(!r.ok)throw new Error(r.status===404?'carpeta no encontrada o sin acceso':'Drive respondió '+r.status);
      const files=(await r.json()).files||[];
      const res=cotejarExpediente(lineasDe(o),files).map(({claves,...l})=>l);
      // v393 · la lista de la carpeta se guarda con el cotejo: los candidatos y
      // el «elegir fichero» salen de aquí, sin otra llamada a Drive
      guardarExpediente(suj,{lineas:res,cotejo:{fecha:new Date().toISOString().slice(0,10),ficheros:files.length,
        lista:files.map(f=>({n:f.name,e:f.webViewLink||''}))}});
      const con=res.filter(x=>x.doc).length,sin=res.filter(x=>!x.doc&&!x.noAplica).length;
      notify(`📋 Cotejado: ${con} con documento · ${sin} pendientes (${files.length} ficheros en la carpeta)`);
    }catch(e){notify('No se pudo cotejar: '+String(e&&e.message||e).slice(0,90),'error');}
    finally{setEngBusy('');}
  };   // {invId, texto}
  // v389 · lo descartado se recuerda: si quitas una factura MIENTRAS la tanda
  // sigue buscando, la tanda en marcha ya la llevaba dentro y al escribir sus
  // resultados la resucitaba un momento. Ahora sus escrituras la filtran.
  const descartadasRef=useRef(new Set());
  const rebuscarConTexto=async(inv,texto)=>{
    const q=consultaLibre(texto);
    if(!q){notify('Escribe al menos dos letras','error');return;}
    const clientId=await leerGmailId(); if(!clientId){setPideGmailId(true);return;}
    setEngBusy('rebusca|'+inv.id);
    try{
      const tok=await tokenGmail(clientId);
      const lst=await gmailGet('messages?q='+encodeURIComponent(q)+'&maxResults=10',tok);
      const ids=(lst.messages||[]).map(m=>String(m.id||'').replace(/[^\w@.\-]/g,'')).filter(Boolean);
      const candidatos=[];
      for(const id of ids){
        const msg=await gmailGet('messages/'+id+'?format=full',tok);
        const ctx={asunto:cabecera(msg,'Subject'),de:cabecera(msg,'From'),fecha:cabecera(msg,'Date'),cuerpo:String(msg&&msg.snippet||'')};
        adjuntosDe(msg).forEach(adj=>{const p=puntuar(adj,inv,ctx);candidatos.push({...adj,msgId:id,...ctx,puntos:p.puntos,por:p.por.length?p.por:['buscado a mano: «'+texto+'»']});});
      }
      setPkCheq(c=>({...c,gmail:{...c.gmail,resultados:(c.gmail.resultados||[]).map(x=>String(x.inv.id)===String(inv.id)
        ?{...x,estado:candidatos.length?'elegir':'no encontrada',
           motivo:candidatos.length?`${candidatos.length} encontrados con «${texto}»`:`nada con «${texto}»`,
           candidatos:candidatos.sort((a,b)=>b.puntos-a.puntos).slice(0,6)}:x)}}));
      setOtraBusca(null);
    }catch(e){notify('No se pudo buscar: '+String(e&&e.message||e).slice(0,80),'error');}
    finally{setEngBusy('');}
  };
  const TANDA_GMAIL=25;   // v387 · Jesús: «una vez vas adjuntando no sigue buscando
  // más facturas pendientes de documento, carga y no hay un ver más». Intentar las
  // 446 de una vez son miles de peticiones a Gmail: topa con sus límites y se queda
  // a medias sin avisar. De 25 en 25, y él decide si seguir.
  const [engBusy,setEngBusy]=useState('');             // v386 · un enganche cada vez, sin clics encolados       // v383 · la misma búsqueda, abierta desde Facturas
  const [buscandoCorreos,setBuscandoCorreos]=useState(false);
  const [pideGmailId,setPideGmailId]=useState(false);
  const [gmailIdTmp,setGmailIdTmp]=useState('');
  // ── Gmail directo (gratuito): la app habla con TU cuenta de Google.
  // Nada pasa por la API de pago. Solo lectura (gmail.readonly).
  const gmailTokenRef=useRef(null);
  const leerGmailId=async()=>{try{const c=await window.storage.get('bh10-gmailid');return c&&c.value?String(c.value).trim():'';}catch(e){return '';}};
  // v389 · el expediente coteja con Drive pidiendo SOLO títulos y enlaces
  // (drive.metadata.readonly): nunca el contenido de los ficheros.
  const driveTokenRef=useRef(null);
  const tokenGoogle=(clientId,scope,ref)=>new Promise((res,rej)=>{
    if(window.__BH10_GTOKEN){res(window.__BH10_GTOKEN);return;} // gancho de pruebas
    const t=ref.current;
    if(t&&t.exp>Date.now()+30000){res(t.tok);return;}
    const arranca=()=>{
      try{
        const cli=window.google.accounts.oauth2.initTokenClient({client_id:clientId,scope,
          callback:(r)=>{ if(r&&r.access_token){ref.current={tok:r.access_token,exp:Date.now()+(+r.expires_in||3500)*1000};res(r.access_token);} else rej(new Error('Google no devolvió permiso')); }});
        cli.requestAccessToken({prompt:''});
      }catch(e){rej(e);}
    };
    if(window.google&&window.google.accounts)arranca();
    else{const sc=document.createElement('script');sc.src='https://accounts.google.com/gsi/client';sc.onload=arranca;sc.onerror=()=>rej(new Error('no se pudo cargar Google'));document.head.appendChild(sc);}
  });
  const tokenGmail=(clientId)=>new Promise((res,rej)=>{
    if(window.__BH10_GTOKEN){res(window.__BH10_GTOKEN);return;} // gancho de pruebas
    const t=gmailTokenRef.current;
    if(t&&t.exp>Date.now()+30000){res(t.tok);return;}
    const arranca=()=>{
      try{
        const cli=window.google.accounts.oauth2.initTokenClient({
          client_id:clientId,
          scope:'https://www.googleapis.com/auth/gmail.readonly',
          callback:(r)=>{
            if(r&&r.access_token){gmailTokenRef.current={tok:r.access_token,exp:Date.now()+(+r.expires_in||3500)*1000};res(r.access_token);}
            else rej(new Error('Google no devolvió permiso'));
          }
        });
        cli.requestAccessToken({prompt:''});
      }catch(e){rej(e);}
    };
    if(window.google&&window.google.accounts&&window.google.accounts.oauth2){arranca();return;}
    const s=document.createElement('script');
    s.src='https://accounts.google.com/gsi/client';s.async=true;
    s.onload=arranca;s.onerror=()=>rej(new Error('No se pudo cargar el identificador de Google'));
    document.head.appendChild(s);
  });
  const gmailGet=async(ruta,tok)=>{
    const r=await fetch('https://gmail.googleapis.com/gmail/v1/users/me/'+ruta,{headers:{Authorization:'Bearer '+tok}});
    if(r.status===401){gmailTokenRef.current=null;throw new Error('CADUCADO');}
    if(r.status===403)throw new Error('SIN_API');
    if(!r.ok)throw new Error('Gmail respondió '+r.status);
    return r.json();
  };
  // (declarados aquí ARRIBA de su primer uso: abajo daban TDZ al montar)
  const [recDatos,setRecDatos]=useState({movs:[],reglas:[]}); // extracto aprendido
  const [pegaExtracto,setPegaExtracto]=useState(false);
  const [txtExtracto,setTxtExtracto]=useState('');
  const recPatrones=useMemo(()=>{
    try{
      if(!recDatos.movs||!recDatos.movs.length)return [];
      const ap=REC.aprenderRecurrentes(recDatos.movs);
      return (REC.aplicarReglas(ap.patrones,recDatos.reglas||[]).patrones||[]).filter(p=>p.clase==='compromiso');
    }catch(e){return [];}
  },[recDatos]);
  const cargarExtractoPegado=()=>{
    const movs=[];
    String(txtExtracto||'').split(/\n+/).forEach(l=>{
      const t=l.split(';');if(t.length<3)return;
      const m=String(t[0]).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      const imp=parseNum(String(t[2]).trim());
      if(!m||!Number.isFinite(imp)||imp===0)return;
      movs.push({fecha:m[3]+'-'+m[2]+'-'+m[1],concepto:String(t[1]).trim().slice(0,140),importe:imp});
    });
    if(movs.length<3){notify('No he entendido el extracto: una línea por apunte, «dd/mm/aaaa;concepto;importe» (importe con signo)','error');return;}
    const next={movs:movs.slice(-3000),reglas:recDatos.reglas||[]};
    setRecDatos(next);
    window.storage.set('bh10-recurrentes',JSON.stringify(next)).catch(()=>{});
    setPegaExtracto(false);setTxtExtracto('');
    notify('🧠 Extracto aprendido: '+movs.length+' apuntes');
  };
  const lineasAPdf=async(titulo,lineas,nombreFich)=>{
    const {PDFDocument,StandardFonts}=await import('pdf-lib');
    const pdf=await PDFDocument.create();
    const fN=await pdf.embedFont(StandardFonts.Helvetica);
    const fB=await pdf.embedFont(StandardFonts.HelveticaBold);
    const limpia=(s)=>String(s||'').replace(/[^\x20-\x7EáéíóúÁÉÍÓÚñÑüÜçÇ€ºª·¡¿\u2013\u2014«»]/g,'');
    const A=[595.28,841.89], M=48, ancho=A[0]-M*2;
    let pag=pdf.addPage(A), y=A[1]-M;
    const salto=(alto)=>{if(y-alto<M+20){pag=pdf.addPage(A);y=A[1]-M;}};
    const pinta=(txt,font,size,color)=>{
      const palabras=limpia(txt).split(' ');let linea='';
      const suelta=(l)=>{salto(size+4);pag.drawText(l,{x:M,y:y-size,size,font});y-=size+4;};
      palabras.forEach(p=>{const cand=linea?linea+' '+p:p;
        if(font.widthOfTextAtSize(cand,size)>ancho&&linea){suelta(linea);linea=p;}else linea=cand;});
      if(linea)suelta(linea);else y-=size*0.6;
    };
    pinta(titulo,fB,14);y-=6;
    lineas.forEach(l=>{
      if(!l){y-=7;return;}
      const negrita=/^(MEJORAS|TOTAL|Vivienda |Configuración)/.test(l)||/^[A-ZÁÉÍÓÚÑ0-9 ·:+€().,-]{6,}$/.test(l)&&l===l.toUpperCase();
      pinta(l,negrita?fB:fN,negrita?11:10);
    });
    y=Math.min(y,M+30);
    pag.drawText(limpia('BH10 Group · generado el '+today),{x:M,y:M-18,size:8,font:fN});
    const bytes=await pdf.save();
    shareOrDownload(new Blob([bytes],{type:'application/pdf'}),nombreFich);
  };
  const verificaCfg=(cfg)=>{
    if(!window.confirm('¿Dar por VERIFICADA esta configuración?\n\n'+(cfg.nombre||'—')+'\nDNI: '+(cfg.dni||'— sin DNI —')+'\nTel: '+(cfg.telefono||'—')+'\nVivienda '+cfg.vivienda+' · Mejoras +'+fmt(cfg.total)+' €\n\nHazlo solo tras comprobar que el DNI corresponde al comprador de esa vivienda.'))return;
    const next={...promoCfg,[cfg.id]:{...promoCfg[cfg.id],verificada:{en:today}}};
    guardaPromoCfg(next);notify('✓ Configuración verificada');
  };
  const borraCfg=(cfg)=>{
    if(!window.confirm('¿Borrar este envío de la vivienda '+cfg.vivienda+' ('+(cfg.nombre||'—')+')? Quedará fuera y NO volverá a recogerse.'))return;
    const next={...promoCfg,[cfg.id]:{id:cfg.id,borrado:true}};
    guardaPromoCfg(next);
    if(window.bh10Recibidos)window.bh10Recibidos.borrar(cfg.id).catch(()=>{});
    notify('🗑 Envío borrado');
  };
  const abrirPromo=async(c)=>{
    setVerPromo(c);setPromoBusy(true);
    try{
      if(window.bh10Recibidos){
        const lista=await window.bh10Recibidos.listar();
        const {next,nuevos}=fusionaPromo(promoCfg,lista,today);
        if(nuevos){
          setPromoCfg(next);
          window.storage.set('bh10-promocfg',JSON.stringify(next)).catch(()=>{});
          notify('🏘️ '+nuevos+' configuración(es) nueva(s) recogida(s) del configurador');
        }
      }
    }catch(e){notify('No se pudo consultar la bandeja: '+String(e&&e.message||e).slice(0,80),'error');}
    setPromoBusy(false);
  };
  const buscarCorreosProv=async()=>{
    const sin=[...new Set(proveedores.filter(p=>{
      const cat=(Array.isArray(provCat)?provCat:[]).find(x=>x&&x.nombre===p);
      return !cat||!String(cat.email||'').trim();
    }))].slice(0,8);
    if(!sin.length){notify('Todos los proveedores tienen ya correo en su ficha');return;}
    const clientId=await leerGmailId();
    if(!clientId){setPideGmailId(true);return;}
    setBuscandoCorreos(true);
    try{
      const tok=await tokenGmail(clientId);
      const propios={dominios:['bh10group.com'],correos:['greenbighouse@gmail.com']};
      const propuestas=[];
      for(const nombre of sin){
        try{
          const q=encodeURIComponent('"'+nombre+'"');
          const lst=await gmailGet('messages?q='+q+'&maxResults=4',tok);
          const ids=(lst.messages||[]).map(m=>String(m.id||'').replace(/[^\w@.\-]/g,'')).filter(Boolean);
          const froms=[];
          for(const id of ids){
            const msg=await gmailGet('messages/'+id+'?format=metadata&metadataHeaders=From',tok);
            const h=(((msg||{}).payload||{}).headers||[]).find(x=>String(x.name).toLowerCase()==='from');
            if(h&&h.value)froms.push(h.value);
          }
          const mejor=mejorRemitente(froms,propios);
          if(mejor)propuestas.push({nombre,email:mejor.email,dominio:mejor.dominio,acepta:true});
        }catch(e){if(e&&(e.message==='CADUCADO'||e.message==='SIN_API'))throw e;}
      }
      if(!propuestas.length){notify('No se encontró remitente claro para esos proveedores en tu Gmail','error');}
      else setPropCorreos(propuestas);
    }catch(e){
      if(e&&e.message==='SIN_API')notify('Gmail dice que falta habilitar su API en tu proyecto de Google (consola → APIs → Gmail API → Habilitar)','error');
      else if(e&&e.message==='CADUCADO')notify('El permiso de Google caducó: vuelve a pulsar el botón para renovarlo','error');
      else notify('No se pudo consultar Gmail: '+String(e&&e.message||e).slice(0,90),'error');
    }
    setBuscandoCorreos(false);
  };
  // ── documentos del periodo antes de generar el paquete (v353) ──────────
  const comprobarNubePeriodo=async(recP)=>{
    if(!window.bh10Adj||!window.bh10Adj.enNube)return;
    const lista=recP.filter(i=>i.adjPath&&esquemaEnlace(i.adjPath).ok);
    setPkCheq(c=>({...(c||{}),nube:{en:true,vistos:0,total:lista.length,malos:[]}}));
    const malos=[];let vistos=0;const okIds=new Set();
    for(const i of lista){
      try{const r=await window.bh10Adj.enNube(i.adjPath);if(r&&r.ok)okIds.add(i.id);else malos.push({inv:i,motivo:(r&&r.motivo)||'no confirmado'});}
      catch(e){malos.push({inv:i,motivo:(e&&e.message)||'error'});}
      vistos++;
      if(vistos%10===0)setPkCheq(c=>({...(c||{}),nube:{en:true,vistos,total:lista.length,malos:[...malos]}}));
    }
    const malosIds=new Set(malos.map(m=>m.inv.id));
    setInvoices(p=>p.map(i=>okIds.has(i.id)?{...i,adjNube:true}:malosIds.has(i.id)?{...i,adjNube:false}:i));
    setPkCheq(c=>({...(c||{}),nube:{en:false,vistos,total:lista.length,malos}}));
  };
  // Engancha un adjunto de Gmail a la factura: descarga, comprueba entero, sube y confirma nube
  // v387 · alSubir avisa EN CUANTO el documento está subido, sin esperar a que
  // la nube confirme (que reintenta hasta 4,5 s). Así la fila se marca al
  // momento y no parece que no haya pasado nada.
  const engancharDeGmail=async(inv,cand,tok,alSubir)=>{
    const a=await gmailGet('messages/'+cand.msgId+'/attachments/'+cand.attachmentId,tok);
    const bytes=b64urlABytes(a&&a.data);
    const mime=cand.mimeType||(/\.pdf$/i.test(cand.filename)?'application/pdf':'image/jpeg');
    const motivo=sanoDocumento(bytes,mime,cand.filename);
    if(motivo)throw new Error('el adjunto del correo no está entero: '+motivo);
    const file=new File([bytes],cand.filename||'documento.pdf',{type:mime});
    const path=await window.bh10Adj.subir(inv.id,file);
    if(typeof alSubir==='function')alSubir(path);
    const nube=await confirmarNube(path);
    setInvoices(p=>p.map(i=>i.id===inv.id?{...i,adjPath:path,adjNube:nube.ok}:i));
    return nube;
  };
  const buscarEnGmailFaltantes=async(faltan)=>{
    if(soloLector()||!window.bh10Adj)return;
    const clientId=await leerGmailId();
    if(!clientId){setPideGmailId(true);return;}
    // v387 · al buscar POR TANDAS no se borra lo ya revisado
    setPkCheq(c=>({...(c||{}),gmail:{en:true,resultados:((c&&c.gmail&&c.gmail.resultados)||[])}}));
    const resultados=[];
    try{
      const tok=await tokenGmail(clientId);
      for(const inv of faltan){
        let candidatos=[];const vistos=new Set();   // v384 · un correo se mira una sola vez, aunque salga en varias consultas
        try{
          for(const q of consultasGmail(inv)){
            const lst=await gmailGet('messages?q='+encodeURIComponent(q)+'&maxResults=6',tok);
            const ids=(lst.messages||[]).map(m=>String(m.id||'').replace(/[^\w@.\-]/g,'')).filter(Boolean);
            const nuevos=ids.filter(id=>!vistos.has(id));nuevos.forEach(id=>vistos.add(id));
            for(const id of nuevos){
              const msg=await gmailGet('messages/'+id+'?format=full',tok);
              // v383 · el cuerpo también cuenta: el importe suele venir escrito en el
              // correo («el importe asciende a 3.350,01 €»), y esa es la señal que
              // Jesús encontró a mano buscando en Gmail. Basta el resumen que
              // devuelve Gmail, sin descargar el mensaje entero.
              const ctx={asunto:cabecera(msg,'Subject'),de:cabecera(msg,'From'),fecha:cabecera(msg,'Date'),
                cuerpo:String(msg&&msg.snippet||'')};
              adjuntosDe(msg).forEach(adj=>{const p=puntuar(adj,inv,ctx);candidatos.push({...adj,msgId:id,...ctx,puntos:p.puntos,por:p.por});});
            }
            // v384 · Jesús: «me cuesta creer que si el sistema pone en el buscador el
            // importe de la factura, no encuentre alternativas». Y tenía razón: aquí
            // se cortaba en cuanto UNA consulta devolvía algo, aunque fuera flojo y
            // luego se descartara. Las consultas por importe —las mejores— casi nunca
            // llegaban a lanzarse. Ahora solo se corta cuando ya hay algo SÓLIDO.
            const solido=candidatos.some(c=>(c.por||[]).some(r=>/número en el nombre del fichero|importe exacto/.test(r)));
            if(solido)break;
          }
        }catch(e){if(e&&(e.message==='CADUCADO'||e.message==='SIN_API'))throw e;resultados.push({inv,estado:'error',motivo:String(e&&e.message||e).slice(0,80)});continue;}
        const d=decidir(candidatos);
        if(d.nada){resultados.push({inv,estado:'no encontrada',motivo:'ningún correo con adjunto que case'});}
        else if(d.auto){
          try{const nube=await engancharDeGmail(inv,d.auto,tok);resultados.push({inv,estado:'adjuntada',motivo:d.auto.filename+(nube.ok?' · ☁️ en la nube':' · ⏳ subiendo'),candidatos:[]});}
          catch(e){resultados.push({inv,estado:'elegir',motivo:'no se pudo enganchar sola: '+String(e&&e.message||e).slice(0,70),candidatos:d.elegir||[d.auto]});}
        }
        else resultados.push({inv,estado:'elegir',motivo:candidatos.length+' candidatos, ninguno claro',candidatos:d.elegir});
        // v385 · se FUNDE con lo que haya en pantalla: si Jesús ya enganchó uno a
        // mano mientras esto seguía buscando, no se le machaca.
        setPkCheq(c=>({...(c||{}),gmail:{en:true,resultados:fundirResultados((c&&c.gmail&&c.gmail.resultados)||[],resultados).filter(r=>!descartadasRef.current.has(String(r.inv&&r.inv.id)))}}));
      }
      const n=resultados.filter(r=>r.estado==='adjuntada').length;
      notify(n?`✉️ ${n} documento${n!==1?'s':''} enganchado${n!==1?'s':''} desde Gmail`:'✉️ Gmail no ha dado ningún candidato claro','success');
    }catch(e){
      if(e&&e.message==='SIN_API')notify('Gmail dice que falta habilitar su API en tu proyecto de Google (consola → APIs → Gmail API → Habilitar)','error');
      else if(e&&e.message==='CADUCADO')notify('El permiso de Google caducó: vuelve a pulsar el botón para renovarlo','error');
      else notify('No se pudo consultar Gmail: '+String(e&&e.message||e).slice(0,90),'error');
    }
    setPkCheq(c=>({...(c||{}),gmail:{en:false,resultados:fundirResultados((c&&c.gmail&&c.gmail.resultados)||[],resultados).filter(r=>!descartadasRef.current.has(String(r.inv&&r.inv.id)))}}));
  };
  const aplicarCorreosProv=()=>{
    const aceptadas=(propCorreos||[]).filter(x=>x.acepta);
    if(!aceptadas.length){setPropCorreos(null);return;}
    let next=Array.isArray(provCat)?[...provCat]:[];
    aceptadas.forEach(a=>{
      const i=next.findIndex(p=>p&&p.nombre===a.nombre);
      const base=i>=0?next[i]:{nombre:a.nombre,cif:'',dir:'',iban:'',bic:'',ibans:[]};
      const ficha={...base,email:a.email,
        dominios:[...new Set([...(base.dominios||[]),a.dominio].filter(Boolean))]};
      if(i>=0)next[i]=ficha;else next.push(ficha);
    });
    persistProvCat(next);
    notify('📧 '+aceptadas.length+' correo(s) guardado(s) en su ficha, con su dominio para el antifraude');
    setPropCorreos(null);
  };
  const faltaClaveIA=()=>{
    if(iaPorWorker())return false;   /* v368: la clave vive en el Worker */if(ES_APP&&!String(anthKey||'').trim()){notify('🔑 Falta la clave del lector — Ajustes → 🔑 Clave API de Anthropic','error');return true;}return false;};
  // ═══ EXTRACTOR OCR (reutilizable: individual y lote) ═══
  const extractInvoiceData = async (file, retried, giro) => {
    if(!puedeAccion('lector')){notify('🔒 Sin permiso para usar el lector IA: pídeselo al dueño en Master','error');throw new Error('sin permiso: lector');}
    if (file.size > 15 * 1024 * 1024) throw new Error('Archivo >15 MB');

    const ext = (file.name || '').split('.').pop().toLowerCase();
    const imgExts = ['jpg','jpeg','png','gif','webp','heic','heif'];
    const isImg = file.type.startsWith('image/') || imgExts.includes(ext);

    // Fotos: reducir a 1280px + JPEG antes de enviar (≈30-50% menos tokens de visión)
    let source = file;
    let mediaType = file.type;
    let giroAplicado = 0;
    if (isImg) {
      // v397 · primer intento: apaisada → vertical; reintento: el giro que pidió la IA
      const small = await downscaleImage(file, 1280, 0.82, giro===undefined ? {autoVertical:true} : {girar:giro});
      if (small) { source = small; mediaType = 'image/jpeg'; giroAplicado = small._girado || 0; }
    }
    if (!mediaType || mediaType === 'application/octet-stream') {
      mediaType = isImg ? 'image/jpeg' : 'application/pdf';
    }

    const base64 = await new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result.split(',')[1]);
      reader.onerror = () => rej(new Error('Error leyendo archivo'));
      reader.readAsDataURL(source);
    });
    const docBlock = isImg
      ? { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } }
      : { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } };

    await prepararIA();const resp = await fetch(urlIA(), {
      method: 'POST',
      headers: cabIA(),
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        system: 'Extraes datos de facturas españolas a JSON.',
        messages: [{ role: 'user', content: [
          docBlock,
          { type: 'text', text: 'Primero mira la ORIENTACIÓN de la imagen: en "rot" pon los grados (0, 90, 180 o 270) que habría que girarla en sentido horario para leer el texto derecho; si ya se lee derecha, "rot":0. Si "rot" no es 0 NO intentes leerla: devuelve "docs":[] y se volverá a enviar girada. Nunca inventes datos que no se lean con claridad: un campo dudoso va vacío. Si el documento contiene VARIAS facturas distintas (distinto nº o emisor), devuélvelas TODAS dentro del array "docs"; si solo hay una, el array tendrá un elemento. Responde SOLO este JSON: {"rot":0,"docs":[{"f":"fecha emisión YYYY-MM-DD","n":"nº factura","pr":"nombre EMISOR","pc":"CIF emisor","pd":"dirección emisor","cl":"nombre DESTINATARIO (cliente)","cc":"CIF destinatario","co":"concepto breve","ca":"categoría","imp":[{"b":base_imponible,"iv":pct_iva_de_esa_base,"c":cuota_de_iva_de_esa_base,"sp":true SOLO si ESA base concreta va en inversión del sujeto pasivo}],"ir":pct_irpf,"t":total_factura,"v":"vencimiento","ib":"IBAN del bloque de pago/domiciliación, transcrito CARÁCTER A CARÁCTER, solo letras y números sin espacios; los 2 dígitos tras ES son de CONTROL: no los deduzcas ni los corrijas. Si algún carácter no es claramente legible devuelve ib vacío — mejor vacío que inventado","sp":true si la factura indica INVERSION DEL SUJETO PASIVO (IVA no repercutido art.84; el total NO incluye IVA),"pf":true si el documento es PROFORMA o solicitud de pago previa (factura definitiva → false),"fp":"forma pago","ob":"obra/dirección envío","lin":[{"d":"descripción de la línea","q":cantidad,"pu":precio unitario sin IVA,"imp":importe de la línea sin IVA}]}]}. En "imp" pon UNA ENTRADA POR CADA BASE IMPONIBLE del resumen de impuestos: si la factura tiene bases a tipos distintos (por ejemplo 21% y 10%, o 21% y 4%), devuélvelas TODAS, no solo la mayor. Copia los importes del cuadro de totales, no los sumes ni los redondees. Los tipos posibles en España son 21, 10, 4 y 0 (exento). Si la factura MEZCLA una base con IVA normal y otra en inversión del sujeto pasivo (ISP, art. 84 — típico en obra), marca "sp":true SOLO en LA ENTRADA de esa base, con "iv":0 y "c":0, y NO actives el "sp" global, que se reserva para cuando TODA la factura va en ISP. La suma de todas las bases más sus cuotas (las bases con "sp" no aportan cuota), menos la retención, tiene que dar el total de la factura: si no te sale, revisa antes de responder. Incluye en "lin" TODAS las líneas de detalle que veas, con su cantidad y precio unitario; si el documento no las desglosa, devuelve "lin":[]. Ojo: si el emisor es '+(compCfg.name||'nuestra empresa')+(compCfg.cif?' (CIF '+compCfg.cif+')':'')+', la factura la emitimos nosotros y el interesado es el destinatario. ca de: Materiales|Mano de obra|Subcontrata|Servicios profesionales|Suministros|Seguros|Alquiler maquinaria|Gastos generales|Otros. Números punto decimal sin €. Vacío→"" o 0.' }
        ]}]
      })
    });

    if (!resp.ok) {
      if (resp.status === 429 && !retried) {
        // Rate limit: esperar y reintentar una vez
        await new Promise(r => setTimeout(r, 3000));
        return extractInvoiceData(file, true, giro);
      }
      throw new Error(await errorIA(resp));
    }

    const data = await resp.json();
    apuntarUso('factura',data);
    if (data.error) throw new Error(data.error.message || 'Respuesta inesperada');
    const text = (data.content || []).map(c => c.text || '').join('');
    if (!text) throw new Error('Documento ilegible');

    const p = parseJSONTolerante(text);
    // v397 · la IA dice si la página está girada: se reenvía girada UNA vez
    const rotLeida = isImg ? giroValido(p && p.rot) : 0;
    const soloRot = !!(p && !Array.isArray(p) && typeof p === 'object' && !Array.isArray(p.docs) && !Array.isArray(p.facturas) && p.rot !== undefined && Object.keys(p).every(k => k === 'rot' || k === 'docs'));
    if (isImg && rotLeida && giro === undefined) return extractInvoiceData(file, retried, (giroAplicado + rotLeida) % 360);
    const _lista = soloRot ? [] : listaLecturas(p);
    const _multi = _lista.length > 1;
    const _norm=(s)=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
    const _miNom=_norm(compCfg.name), _miCif=_norm(compCfg.cif);
    const esNuestro=(nom,cif)=>{
      const n=_norm(nom), c=_norm(cif);
      if(_miCif.length>4&&(c.includes(_miCif)||n.includes(_miCif)))return true;
      if(_miNom.length>5&&(n.includes(_miNom)||(n.length>5&&_miNom.includes(n))))return true;
      return n.includes('BIOH');
    };
    const ctx = { inferISP, esNuestro, today, CATS, IVAS, IRPFS, normIban, reparaIban, normNif, parseNum };
    if(!_lista.length) throw new Error(rotLeida ? 'La foto está girada y no se ha podido leer: gírala y vuelve a escanearla' : 'El lector no devolvió ninguna factura reconocible');
    // v397 · saneado y avisos: lo improbable se marca para revisar, no se registra en silencio
    const ctxAv = { today, miCif: compCfg.cif, miNombre: compCfg.name };
    const conAvisos = (x) => { const m = saneaLectura(mapearLectura(x, ctx), ctxAv); return { ...m, _avisos: avisosLectura(m, ctxAv), _giro: giroAplicado }; };
    const base = conAvisos(_lista[0]);
    return {
      ...base,
      _multi, _recuperado: !!(p && p._recuperado),
      _lista: _lista.map(conAvisos),
    };
  };

  // Escaneo individual (desde el formulario)
  const extractNominasPDF = async (file) => {if(soloLector())return;
    const b64 = await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]);r.onerror=rej;r.readAsDataURL(file);});
    await prepararIA();const resp = await fetch(urlIA(), {
      method: 'POST',
      headers: cabIA(),
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        system: 'Extraes datos de nóminas españolas a JSON.',
        messages: [{ role:'user', content: [
          { type:'document', source:{ type:'base64', media_type:'application/pdf', data:b64 } },
          { type:'text', text: 'PDF con nóminas españolas. Responde SOLO este JSON: {"per":"YYYY-MM","noms":[{"pag":numero_de_pagina_donde_aparece_esta_nomina_empezando_en_1,"n":"APELLIDOS, NOMBRE","nif":"NIF o NIE","nss":"num afiliacion SS","cat":"categoria","dev":total_devengado,"esp":salario_en_especie_o_0,"irB":base_IRPF,"irP":pct_IRPF,"irC":cuota_IRPF_retenida,"ss":importe_de_la_linea_TOTAL_APORTACIONES_del_apartado_II_1_o_0,"otras":importe_de_5_Otras_deducciones_o_0,"otrasTxt":concepto_de_esas_otras_deducciones_o_"","ce":coste_empresa,"liq":liquido_a_percibir}]}. Una entrada por nomina. Numeros con punto decimal, sin simbolos. Dato ausente: 0 o "". ATENCION con "ss": es la linea "TOTAL APORTACIONES" del apartado II.1 (contingencias comunes + desempleo + formacion, lo que aporta el TRABAJADOR). NO es "B. TOTAL A DEDUCIR", que es la suma de TODAS las deducciones e incluye el IRPF y la especie. Si "TOTAL APORTACIONES" esta en blanco, pon 0. En "otras" va el apartado "5. Otras deducciones" (por ejemplo un embargo salarial) y en "otrasTxt" su concepto. Comprueba que devengado - esp - ss - IRPF - otras = liquido.' }
        ]}]
      })
    });
    if(!resp.ok)throw new Error(await errorIA(resp));
    const data = await resp.json();
    apuntarUso('nominas-pdf',data);
    const raw = (data.content||[]).map(c=>c.text||'').join('');
    const j = JSON.parse(raw.replace(/```json|```/g,'').trim());
    if(!j||!Array.isArray(j.noms)||!j.noms.length)throw new Error('No se encontraron nóminas en el PDF');
    return j;
  };
  // ═══ REPARTO DE NÓMINAS ═══
  // Parte el PDF en una hoja por trabajador y, ANTES de dejar enviar nada,
  // vuelve a leer cada hoja por separado —sin decirle de quién debería ser— y
  // compara las dos lecturas. Si no coinciden, esa hoja no sale.
  const [reparto,setReparto]=useState(null);   // {fase,total,hechas,filas,periodo}
  const repartoCancel=useRef(false);
  const leerHojaSuelta=async(blob)=>{
    const b64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]);r.onerror=rej;r.readAsDataURL(blob);});
    await prepararIA();const resp=await fetch(urlIA(),{method:'POST',headers:cabIA(),
      body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:600,
        system:'Lees una única hoja de nómina española y devuelves quién aparece en ella.',
        messages:[{role:'user',content:[
          {type:'document',source:{type:'base64',media_type:'application/pdf',data:b64}},
          {type:'text',text:'Devuelve SOLO este JSON: {"nif":"NIF o NIE del TRABAJADOR","n":"apellidos y nombre","liq":liquido_a_percibir,"emb":importe_de_embargo_o_retencion_judicial_si_figura,"nifs":["todos los NIF/NIE de PERSONAS que aparezcan en la hoja"]}. En "emb": dentro del bloque II. DEDUCCIONES, mira el apartado "5. Otras deducciones" y pon el importe de la línea de EMBARGO, RETENCIÓN JUDICIAL, JUZGADO o AEAT si la hay; 0 si ese apartado está vacío o solo tiene otros conceptos. NO confundas con Anticipos (3), IRPF (2) ni especie (4). En "nifs" incluye únicamente documentos de personas físicas, no el CIF de la empresa. Si no lo ves con claridad, devuelve "" o 0.'}]}]})});
    if(!resp.ok)throw new Error(await errorIA(resp));
    const d=await resp.json();
    apuntarUso('nomina-hoja',d);
    const raw=(d.content||[]).map(c=>c.text||'').join('');
    return JSON.parse(raw.replace(/```json|```/g,'').trim());
  };
  const repartirNominas=async(file,noms,periodo)=>{
    if(soloLector())return;
    if(faltaClaveIA())return;
    const {PDFDocument}=await import('pdf-lib');
    const original=await PDFDocument.load(await file.arrayBuffer());
    const nPags=original.getPageCount();
    const nifsPlantilla=employees.map(e=>e.nif).filter(Boolean);
    const embLeidos={};   // NIF → {imp, periodo} leído de la hoja de este reparto
    const filas=noms.map(nm=>{
      const emp=employees.find(e=>nifIgual(e.nif,nm.nif))||employees.find(e=>normTxtDup(e.nombre)===normTxtDup(nm.n));
      const _rep=repararNomina(nm); const _nm=_rep.nom;
      const cuadre=cuadraNomina(_nm);
      return {nif:nm.nif,nombre:nm.n||(emp&&emp.nombre)||'',liq:+nm.liq||0,pag:+nm.pag||0,cuadre,
        email:(emp&&emp.email)||'',telefono:(emp&&emp.telefono)||'',empId:emp&&emp.id,
        blob:null,verificado:null,enviado:false};
    });
    repartoCancel.current=false;
    setReparto({fase:'partiendo',total:filas.length,hechas:0,filas,periodo});
    for(let ix=0;ix<filas.length;ix++){
      if(repartoCancel.current)break;
      const f=filas[ix];
      try{
        if(f.cuadre&&!f.cuadre.ok){f.verificado={ok:false,motivo:'sus cuentas no cuadran — '+f.cuadre.motivo};}
        else if(!f.pag||f.pag<1||f.pag>nPags){f.verificado={ok:false,motivo:'no se ha podido saber en qué página está su nómina'};}
        else{
          const suelta=await PDFDocument.create();
          const [pg]=await suelta.copyPages(original,[f.pag-1]);
          suelta.addPage(pg);
          const bytes=await suelta.save();
          f.blob=new Blob([bytes],{type:'application/pdf'});
          const leido=await leerHojaSuelta(f.blob);
          f.verificado=verificarPaginaNomina(f,{nif:leido.nif,nombre:leido.n,liq:parseNum(leido.liq)||0,nifs:leido.nifs||[]},nifsPlantilla);
          if(!f.verificado.ok)f.blob=null;   // si no cuadra, ni siquiera se guarda la hoja
          // El importe del embargo lo dicta la nómina del mes: se apunta lo
          // leído (también el 0, que significa que el embargo ya no figura)
          if(f.verificado.ok)embLeidos[normNif(f.nif)]={imp:parseNum(leido.emb)||0,periodo};
        }
      }catch(e){f.verificado={ok:false,motivo:'no se ha podido comprobar: '+String(e.message||e).slice(0,60)};f.blob=null;}
      setReparto(r=>r?{...r,hechas:ix+1,filas:[...filas]}:r);
      if(ix<filas.length-1)await new Promise(r=>setTimeout(r,300));
    }
    const ok=filas.filter(f=>f.verificado&&f.verificado.ok).length;
    // Si la hoja trae embargo y la ficha NO lo tiene, ese dinero se retiene al
    // trabajador y no sale hacia ningún juzgado. Antes se descartaba callando.
    const huerfanos=Object.entries(embLeidos)
      .filter(([k,v])=>v&&+v.imp>0&&!employees.some(e=>normNif(e.nif)===k&&String(e.embargo||'').trim()))
      .map(([k])=>{const e=employees.find(x=>normNif(x.nif)===k);return (e&&e.nombre)||k;});
    if(huerfanos.length)notify(`⚖️ ${huerfanos.length===1?'La nómina de':'Las nóminas de'} ${huerfanos.join(', ')} `
      +`descuenta${huerfanos.length===1?'':'n'} embargo y no hay embargo dado de alta: rellena la cuenta del juzgado y la referencia en su ficha`,'error');
    // Se guarda el embargo leído SOLO en fichas que tienen embargo anotado
    if(Object.keys(embLeidos).length){
      const conCambio=employees.some(e=>String(e.embargo||'').trim()&&embLeidos[normNif(e.nif)]!==undefined);
      if(conCambio)saveEmployees(employees.map(e=>{
        const k=normNif(e.nif);
        return (String(e.embargo||'').trim()&&embLeidos[k]!==undefined)?{...e,embargoLeido:embLeidos[k]}:e;
      }));
    }
    setReparto(r=>r?{...r,fase:'listo',filas:[...filas]}:r);
    notify(`📄 ${ok} de ${filas.length} nóminas verificadas y listas para enviar`,ok===filas.length?undefined:'error');
  };
  const enviarNomina=async(fila)=>{
    const per=(reparto&&reparto.periodo)||'';
    const env=prepararEnvioNomina(fila,per,(compCfg&&compCfg.name)||'');
    if(env.error){notify('No se puede enviar: '+env.error,'error');return;}
    const archivo=new File([fila.blob],env.archivo,{type:'application/pdf'});
    try{
      if(navigator.canShare&&navigator.canShare({files:[archivo]})){
        // El menú de compartir de iOS no admite destinatario: el correo se abre
        // con el PDF adjunto pero el «Para» vacío. Se copia la dirección al
        // portapapeles para pegarla, en vez de buscarla entre los contactos:
        // elegir el contacto equivocado sería el mismo error que intentamos
        // evitar, movido al último paso.
        let copiado=false;
        try{ await navigator.clipboard.writeText(env.para); copiado=true; }catch(e){}
        await navigator.share({files:[archivo],title:env.asunto,text:env.cuerpo});
        notify(copiado?`✉️ Pega la dirección en «Para»: ${env.para} (ya copiada)`:`✉️ Envíala a: ${env.para}`);
      }else{
        shareOrDownload(fila.blob,env.archivo,'application/pdf');
        window.location.href=`mailto:${encodeURIComponent(env.para)}?subject=${encodeURIComponent(env.asunto)}&body=${encodeURIComponent(env.cuerpo+'\n\n(Adjunta el PDF que se acaba de descargar: '+env.archivo+')')}`;
      }
      setReparto(r=>r?{...r,filas:r.filas.map(x=>x===fila?{...x,enviado:true}:x)}:r);
    }catch(e){ if(String(e&&e.name)!=='AbortError')notify('No se pudo compartir','error'); }
  };
  const avisarWhatsApp=(fila)=>{
    const p=puedeAvisar(fila);
    if(!p.ok){notify('No se puede avisar: '+p.motivo,'error');return;}
    const per=(reparto&&reparto.periodo)||'';
    const url=enlaceWhatsApp(fila.telefono,construirAviso(avisoTxt,fila,per,(compCfg&&compCfg.name)||''));
    if(!url){notify('No se pudo preparar el aviso','error');return;}
    window.open(url,'_blank');
    setReparto(r=>r?{...r,filas:r.filas.map(x=>x===fila?{...x,avisado:true}:x)}:r);
  };
  // Las dos vías seguidas: primero el correo con la nómina y, al volver, el
  // aviso por WhatsApp. Se hacen en dos pasos porque cada app se abre por su
  // cuenta; el segundo espera a que vuelvas.
  const enviarYAvisar=async(fila)=>{
    await enviarNomina(fila);
    const p=puedeAvisar(fila);
    if(!p.ok){notify('Nómina enviada. Aviso no: '+p.motivo,'error');return;}
    setTimeout(()=>{
      if(window.confirm(`¿Abrir WhatsApp para avisar a ${fila.nombre||''}?`))avisarWhatsApp(fila);
    },700);
  };

  const importarNominasPDF = async (file) => {if(soloLector())return;
    if(!ES_APP){notify('El importador de nóminas vive en la app de bh10group.com','error');return;}
    if(faltaClaveIA())return;
    if(nomBusy)return;setNomBusy(true);
    try{
      notify('📄 Leyendo nóminas… (unos segundos)');
      const j=await extractNominasPDF(file);
      const items=(j.noms||[]).map(nm0=>{
        const rep=repararNomina(nm0); const nm=rep.nom;
        const m2=emparejarEmpleado(nm,employees);
        return {...nm,empId:m2.emp?m2.emp.id:null,empNombre:m2.emp?m2.emp.nombre:null,
          _via:m2.via,_dudaEmp:m2.motivo,_cuadre:cuadraNomina(nm),_reparado:rep.aviso,
          _avisoEmb:embargoSinFicha(nm,m2.emp)};
      });
      const descuadres=items.filter(x=>x._cuadre&&!x._cuadre.ok).length;
      const embSinFicha=items.filter(x=>x._avisoEmb).length;
      const dudas=items.filter(x=>!x.empId).length;
      if(descuadres||dudas)notify(`⚠ Revisa antes de aplicar: ${descuadres?`${descuadres} con las cuentas descuadradas`:''}${descuadres&&dudas?' · ':''}${dudas?`${dudas} sin identificar`:''}`,'error');
      setNomImport({per:j.per||'',items,file});
    }catch(e){notify('No se pudo leer el PDF: '+((e&&e.message)||e),'error');}
    setNomBusy(false);
  };
  const aplicarNominas=(yRemesar)=>{if(soloLector())return;
    if(!nomImport)return;
    const per=nomImport.per||today.slice(0,7);
    let nuevos=0,completados=0;
    const emps=[...employees];
    const items=(nomImport.items||[]).map(nm=>{
      let empId=nm.empId;
      if(empId){
        const ix=emps.findIndex(e=>e.id===empId);
        if(ix>=0){const e={...emps[ix]};let ch=false;
          if(!e.nif&&nm.nif){e.nif=normNIF(nm.nif);ch=true;}
          if(!e.nss&&nm.nss){e.nss=nm.nss;ch=true;}
          if(!e.categoria&&nm.cat){e.categoria=nm.cat;ch=true;}
          // El importe del embargo lo dicta la nómina del mes. Si el recibo
          // trae uno y la ficha tiene embargo dado de alta, se apunta aquí
          // para que la transferencia al juzgado salga por ese importe, aunque
          // no se pase por «Repartir y enviar». Un cambio de mes se refleja
          // solo; un 0 significa que el embargo ya no figura y se da por
          // cancelado (eso lo interpreta transferenciasEmbargo).
          const impEmb=+nm.otras||0;
          const esEmb=/embarg|retenci[oó]n\s*judicial|juzgad/i.test(String(nm.otrasTxt||''));
          if(String(e.embargo||'').trim() && esEmb && impEmb>0){
            const prev=e.embargoLeido;
            if(!prev||prev.periodo!==per||Math.abs((+prev.imp||0)-impEmb)>0.005){
              e.embargoLeido={imp:impEmb,periodo:per};ch=true;}
          }
          if(ch){emps[ix]=e;completados++;}}
      }else{
        const nuevo={id:uid(),nombre:nm.n||'',nif:normNIF(nm.nif),nss:nm.nss||'',categoria:nm.cat||'',iban:'',bic:'',importeBase:String(nm.liq||''),direccion:'',cp:'',activo:true};
        emps.push(nuevo);empId=nuevo.id;nuevos++;
      }
      return {empId,nombre:nm.n||'',nif:normNIF(nm.nif),dev:+nm.dev||0,esp:+nm.esp||0,irB:+nm.irB||0,irP:+nm.irP||0,irC:+nm.irC||0,ss:+nm.ss||0,ce:+nm.ce||0,liq:+nm.liq||0};
    });
    saveEmployees(emps);
    persistNominas([{per,fecha:today,items},...nominasMes.filter(x=>x.per!==per)]);
    setNomImport(null);
    const sinIban=emps.filter(e=>e.activo&&!String(e.iban||'').trim()).length;
    notify(`✅ Nóminas ${per}: ${items.length} registradas · ${nuevos} nuevo${nuevos!==1?'s':''}${completados?` · ${completados} fichas completadas`:''}${sinIban?` · ⚠️ ${sinIban} sin IBAN`:''}`);
    if(yRemesar===true){
      const pre={};items.forEach(it=>{if(it.empId&&it.liq>0)pre[it.empId]=String(it.liq);});
      setPayrollAmounts(pre);
      setPayrollSoloPDF(true);
      setPayrollConcepto(`NOMINA ${per}`);
      setPayrollDate(today);
      setShowPayroll(true);
    }
  };
  const exportarCertificadoRet=()=>{
    if(!nominasMes.length){notify('No hay nóminas importadas todavía','error');return;}
    const año=String(nominasMes[0].per||'').slice(0,4)||String(new Date().getFullYear());
    const agg={};
    nominasMes.filter(x=>String(x.per||'').startsWith(año)).forEach(x=>(x.items||[]).forEach(i=>{
      const kk=i.nif||i.nombre;if(!kk)return;
      agg[kk]=agg[kk]||{nif:i.nif||'',nombre:i.nombre||'',dev:0,esp:0,ir:0,ss:0,meses:0};
      agg[kk].dev+=i.dev||0;agg[kk].esp+=i.esp||0;agg[kk].ir+=i.irC||0;agg[kk].ss+=i.ss||0;agg[kk].meses++;
    }));
    const h='NIF;Nombre;Percepciones íntegras;Salario en especie;IRPF retenido;SS trabajador;Meses';
    const rows=Object.values(agg).sort((a,b)=>a.nombre.localeCompare(b.nombre)).map(a=>[a.nif,a.nombre,a.dev.toFixed(2),a.esp.toFixed(2),a.ir.toFixed(2),a.ss.toFixed(2),a.meses].join(';'));
    shareOrDownload('\ufeff'+[h,...rows].join('\n'),`certificado_retenciones_${año}.csv`,'text/csv;charset=utf-8');
    notify(`Certificado ${año}: ${rows.length} trabajadores`);
  };
  const scanInvoice = async (file) => {if(soloLector())return;
    if(faltaClaveIA())return;
    setScanning(true);
    try {
      const d = await extractInvoiceData(file);
      if(d) d._file=file;
      // v376 · Jesús: «hay veces que crea un nuevo proveedor llamado J Martín
      // Caro S.L teniendo de alta J MARTIN CARO, S.L. … genera doble ficha».
      // Lo leído se pasa a MAYÚSCULAS y, si coincide con uno ya conocido, se
      // propone ese con su nombre exacto. Proponer, no imponer: si no lo toca,
      // se da de alta tal y como lo ha leído.
      if(d&&d.proveedor){
        const p=proponerProveedor(d.proveedor,provCat,invoicesAll);
        d.proveedor=p.nombre;
        if(p.sugerido)d._sugProv={nombre:p.sugerido,motivo:p.motivo,leido:p.nombre};
      }
      if(d&&!d.ibanProveedor&&d.proveedor){const fp=getSupplierData(d.proveedor);if(fp&&fp.iban)d.ibanProveedor=fp.iban;}
      if(d&&d._recuperado)notify('⚠️ La lectura llegó incompleta: revisa bien los datos antes de registrar','error');
      if(d&&d._multi&&Array.isArray(d._lista)&&d._lista.length>1){
        const entradas=d._lista.map((x,ix)=>{
          const base={...emptyForm,tipo:'factura',...x};
          if(base.proveedor){const fp=getSupplierData(base.proveedor);
            if(fp&&fp.iban&&!base.ibanProveedor)base.ibanProveedor=fp.iban;
            if(fp&&fp.pagoAlRegistrar){base._marcarPagada=true;if(fp.metodoHabitual)base.formaPago=fp.metodoHabitual;}}
          return {id:'m'+Date.now()+'_'+ix,file,status:'done',registered:false,data:base,nombre:(file.name||'documento')+' · '+(ix+1)+'/'+d._lista.length};
        });
        setBatchTipo('factura');
        setBatchFiles(entradas);
        setScanning(false);
        notify(`📑 El documento trae ${entradas.length} facturas — revísalas una a una`);
        setTimeout(()=>startBatchReview(),120);
        return;
      }
      // La ficha del proveedor decide si la factura nace pagada
      const _fp = d && d.proveedor ? getSupplierData(d.proveedor) : null;
      setForm(prev => ({ ...prev,
        _marcarPagada: _fp ? !!_fp.pagoAlRegistrar : prev._marcarPagada,
        formaPago: (_fp&&_fp.pagoAlRegistrar&&_fp.metodoHabitual) || d.formaPago || prev.formaPago,
        fecha: d.fecha || prev.fecha, numFactura: d.numFactura || prev.numFactura,
        proveedor: d.proveedor || prev.proveedor, concepto: d.concepto || prev.concepto,
        proveedorCif: d.proveedorCif || prev.proveedorCif, proveedorDir: d.proveedorDir || prev.proveedorDir,
        categoria: d.categoria || prev.categoria, importeBase: d.importeBase || prev.importeBase,
        tipoIva: d.tipoIva ?? prev.tipoIva, irpf: d.irpf ?? prev.irpf,
        fechaVencimiento: d.fechaVencimiento || prev.fechaVencimiento,
        ibanProveedor: d.ibanProveedor || prev.ibanProveedor,
        obra: d.obra || prev.obra,
        _totalLeido: d._totalLeido || 0,
        _avisos: d._avisos || [], _giro: d._giro || 0,
        isp: d.isp ?? prev.isp,
        proforma: d.proforma ?? prev.proforma,
        retencion: d.retencion ?? prev.retencion,
        _file: d._file || prev._file,
        lineas: (Array.isArray(d.lineas)&&d.lineas.length)?d.lineas:prev.lineas,
      }));
      if(d&&d._avisos&&d._avisos.length)notify('⚠️ Lectura dudosa: '+d._avisos.join(' · '),'error');
      else notify('Factura escaneada — revisa los datos');
    } catch (e) {
      console.error('Scan error:', e);
      notify(e instanceof SyntaxError ? 'No se pudo interpretar — prueba con foto más nítida' : ('Error: ' + e.message), 'error');
    }
    setScanning(false);
  };

  // ═══ ESCANEO EN LOTE ═══
  const scanBatch = async (fileList, destino) => {if(soloLector())return;
    if(faltaClaveIA())return;
    setBatchTipo(destino==='cobro'?'cobro':'factura');
    setLotePagadas(false);
    const files = [...fileList].map(f => ({ id: uid(), file: f, name: f.name, status: 'pending', data: null, error: null, registered: false }));
    if (!files.length) return;
    batchCancelRef.current = false;
    setBatchFiles(files);
    for (let i = 0; i < files.length; i++) {
      if (batchCancelRef.current) return;
      setBatchFiles(p => p.map((f, idx) => idx === i ? { ...f, status: 'scanning' } : f));
      try {
        const data = await extractInvoiceData(files[i].file);
        files[i] = { ...files[i], status: 'done', data };
      } catch (e) {
        files[i] = { ...files[i], status: 'error', error: e.message };
      }
      if (batchCancelRef.current) return;
      setBatchFiles([...files]);
      if (i < files.length - 1) await new Promise(r => setTimeout(r, 400)); // pausa entre llamadas
    }
  };

  // Importar Excel/CSV → mismo flujo de lote que el escaneo
  const importExcel = async (file) => {
    try{
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, {cellDates:true});
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, {defval:''});
      if(!rows.length){notify('El archivo no tiene filas de datos','error');return;}
      batchCancelRef.current=false;
      const items = parseExcelRows(rows, getSupplierData, today, xlsPago);
      setBatchFiles(items);
      const nPag=items.filter(f=>f.data&&f.data._pagoImport).length;
      const nSinF=items.filter(f=>f.data&&f.data._fechaEstimada).length;
      const ok=items.filter(f=>f.status==='done').length;
      notify(`${ok} de ${items.length} filas listas para revisar${nPag?` · ${nPag} llegan como PAGADAS`:''}${nSinF?` · ⚠ ${nSinF} sin fecha legible (entran con la de hoy)`:''}`,nSinF?'error':undefined);
    }catch(e){
      console.error('Import error:',e);
      notify('No se pudo leer el archivo — usa .xlsx, .xls o .csv','error');
    }
  };

  // Registrar todas las facturas válidas del lote de golpe (sin revisión individual)
  const registerAllBatch = () => {if(soloLector())return;
    // v397 · las lecturas con avisos no entran de golpe: se revisan una a una
    const dudosas=batchFiles.filter(f=>f.status==='done'&&!f.registered&&f.data&&Array.isArray(f.data._avisos)&&f.data._avisos.length);
    const pend=batchFiles.filter(f=>f.status==='done'&&!f.registered&&!dudosas.includes(f));
    if(!pend.length){if(dudosas.length)notify(`⚠️ ${dudosas.length} lectura${dudosas.length!==1?'s':''} dudosa${dudosas.length!==1?'s':''}: revísalas una a una`,'error');return;}
    const adjPares=[];
    const newInvs=pend.map(f=>{
      const d=f.data;const b=parseNum(d.importeBase)||0;
      const t=calcTotals(b,d.tipoIva??21,d.irpf??0,parseNum(d.base2)||0,d.tipoIva2??10);
      const inv={...emptyForm,...d,id:uid(),tipo:batchTipo,importeBase:b,base2:parseNum(d.base2)||0,iva:t.iva,retencion:t.retencion,total:t.total,pagos:[],aplicadoA:null,esEstructural:false};
      if(!inv.ibanProveedor){const _fp=getSupplierData(inv.proveedor);if(_fp&&_fp.iban)inv.ibanProveedor=_fp.iban;}
      if(inv.ibanProveedor)aprenderIban(inv.proveedor,inv.ibanProveedor);
      delete inv._emitidaPorNos;
      if(inv._pagoImport){
        // Sin fecha de pago en el Excel: mejor aproximación real de la factura
        // (vencimiento y, si no, emisión). Nunca el día de la importación.
        const fp=inv._pagoImport.fecha||inv.fechaVencimiento||inv.fecha;
        inv.pagos=[{id:uid(),fecha:fp,importe:+(inv.total||0),metodo:'Transferencia',referencia:'Importado del Excel'}];
      } else if(lotePagadas&&inv.tipo!=='cobro'&&(+inv.total||0)>0){
        inv.pagos=[{id:uid(),fecha:inv.fechaVencimiento||inv.fecha,importe:+(inv.total||0),metodo:'Transferencia',referencia:'Importación: marcada como pagada'}];
      }
      if(!inv.fechaRegistro)inv.fechaRegistro=today;
      delete inv._pagoImport;delete inv._fechaEstimada;
      adjPares.push([inv.id,(f.file||inv._file||null),inv._giro||0]);delete inv._file;
      delete inv._giro;delete inv._avisos;delete inv._lista;delete inv._multi;delete inv._recuperado;
      delete inv._totalLeido;delete inv.refPresupuesto;delete inv._dualIva;if(!inv.base2){delete inv.base2;delete inv.tipoIva2;}
      return inv;
    });
    const unicas=[];let omitidas=0;let archivadas=0;
    for(let ix=0;ix<newInvs.length;ix++){
      const n=newInvs[ix];
      const ex=hallarDuplicada(n,[...invoices,...unicas]);
      if(ex&&esDupFuerte(ex)){
        omitidas++;
        if(adjPares[ix]&&adjPares[ix][1]&&ex.inv&&!ex.inv.adjPath){adjPares[ix][0]=ex.inv.id;archivadas++;}
        else if(adjPares[ix])adjPares[ix][1]=null;
      }
      else unicas.push(n);
    }
    setInvoices(p=>[...p,...unicas]);
    setBatchFiles(dudosas.length?batchFiles.filter(f=>dudosas.includes(f)):[]);setBatchReviewIdx(null);
    if(dudosas.length)notify(`⚠️ ${dudosas.length} lectura${dudosas.length!==1?'s':''} dudosa${dudosas.length!==1?'s':''} se queda${dudosas.length!==1?'n':''} en el lote para revisar`,'error');
    if(archivadas)notify(`📎 ${archivadas} documento${archivadas!==1?'s':''} archivado${archivadas!==1?'s':''} en facturas ya existentes`);
    notify(`${unicas.length} facturas registradas${omitidas?` · ${omitidas} omitida${omitidas!==1?'s':''} por estar ya registrada${omitidas!==1?'s':''}`:''}`);
    subirAdjuntos(adjPares);
  };



  const csvOf=(list)=>{
    const h='Fecha;Num;Proveedor;CIF;Obra;Concepto;Cat;Base;IVA%;IVA;IRPF%;Ret;Total;Pagado;Estado;Vto';
    const rows=list.map(i=>[i.fecha,i.numFactura,i.proveedor,i.proveedorCif||'',i.obra,String(i.concepto||'').replace(/;/g,',').slice(0,60),i.categoria,i.importeBase,i.tipoIva,i.iva,i.irpf,i.retencion,i.total,getTotalPagado(i,invoices),getEstado(i,invoices),i.fechaVencimiento||''].join(';'));
    return [h,...rows].join('\n');
  };

  // Hash rápido para detectar si el backup cambió desde la última subida
  const hashStr=s=>{let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))>>>0;return h.toString(36)+'-'+s.length.toString(36);};



  const startBatchReview = () => {
    const first = batchFiles.findIndex(f => f.status === 'done' && !f.registered);
    if (first < 0) { notify('Ninguna factura legible en el lote', 'error'); return; }
    setBatchReviewIdx(first);
    setEditing(null);
    // v360 · Jesús (04-09-2026): «las facturas que registramos vía fotografía no guardan la foto».
    // El lote revisaba con los datos leídos pero sin el fichero: ahora viaja con él y se adjunta al registrar.
    setForm({ ...emptyForm, tipo: batchTipo, ...batchFiles[first].data, _file: batchFiles[first].file });
    setShowForm(true);
  };

  // Avanza a la siguiente factura del lote (tras registrar u omitir la actual)
  const advanceBatch = (registeredNow) => {
    const updated = batchFiles.map((f, i) => i === batchReviewIdx ? { ...f, registered: registeredNow || f.registered } : f);
    setBatchFiles(updated);
    const next = updated.findIndex((f, i) => i > batchReviewIdx && f.status === 'done' && !f.registered);
    if (next >= 0) {
      setBatchReviewIdx(next);
      setEditing(null);
      setForm({ ...emptyForm, tipo: batchTipo, ...updated[next].data, _file: updated[next].file });
    } else {
      const total = updated.filter(f => f.status === 'done').length;
      const reg = updated.filter(f => f.registered).length;
      setBatchReviewIdx(null); setShowForm(false); setBatchFiles([]);
      notify(`Lote finalizado — ${reg}/${total} facturas registradas`);
    }
  };

  const cancelBatch = () => {
    batchCancelRef.current = true;
    const reg = batchFiles.filter(f => f.registered).length;
    setBatchReviewIdx(null); setBatchFiles([]); setShowForm(false);
    if (reg > 0) notify(`Lote cancelado — ${reg} ya registradas se conservan`);
  };

  // Supplier IBAN auto-lookup from previous invoices
  // Datos conocidos del proveedor desde facturas anteriores (IBAN, CIF, dirección)
  // Datos del cliente: primero su ficha; si no la hay, lo último que se usó en
  // un contrato o factura suya. Así funciona desde el primer día, sin rellenar
  // nada, y va mejorando según se completa la ficha.
  const fichaCliente = (nombre) => {
    const n=String(nombre||'').trim();
    if(!n)return {nombre:'',cif:'',dir:'',cp:'',municipio:'',provincia:'',email:'',telefono:'',contacto:'',diasVenc:'',retGarPct:'',notas:'',_origen:''};
    const f=(Array.isArray(cliCat)?cliCat:[]).find(x=>x&&normProvNombre(x.nombre)===normProvNombre(n));
    if(f)return {...f,_origen:'ficha'};
    // Respaldo: el contrato o la factura más reciente de ese cliente
    const ct=(contratos||[]).filter(c=>c&&normProvNombre(c.cliente)===normProvNombre(n)&&(c.clienteCif||c.clienteDir))
      .sort((a,b)=>String(b.fecha||'').localeCompare(String(a.fecha||'')))[0];
    if(ct)return {nombre:n,cif:ct.clienteCif||'',dir:ct.clienteDir||'',cp:'',municipio:'',provincia:'',email:'',telefono:'',contacto:'',diasVenc:'',retGarPct:ct.retGarantia||'',notas:'',_origen:'contrato'};
    const fa=(invoices||[]).filter(x=>x&&x.tipo==='cobro'&&normProvNombre(x.proveedor)===normProvNombre(n)&&(x.proveedorCif||x.proveedorDir))
      .sort((a,b)=>String(b.fecha||'').localeCompare(String(a.fecha||'')))[0];
    if(fa)return {nombre:n,cif:fa.proveedorCif||'',dir:fa.proveedorDir||'',cp:'',municipio:'',provincia:'',email:'',telefono:'',contacto:'',diasVenc:'',retGarPct:'',notas:'',_origen:'factura'};
    return {nombre:n,cif:'',dir:'',cp:'',municipio:'',provincia:'',email:'',telefono:'',contacto:'',diasVenc:'',retGarPct:'',notas:'',_origen:''};
  };
  const dirCompletaCliente=(f)=>[f.dir,[f.cp,f.municipio].filter(Boolean).join(' '),f.provincia?'('+f.provincia+')':''].filter(Boolean).join(', ');
  const getSupplierData = (prov) => {
    const lista = Array.isArray(provCat) ? provCat : Object.values(provCat||{});
    const cat = lista.find(p=>p&&p.nombre===prov);
    const prevs = invoices.filter(i => i.proveedor === prov);
    return {
      ibans: (cat&&Array.isArray(cat.ibans))?cat.ibans:[],
      // Proveedores que se pagan en el acto (domiciliados, contado, tarjeta):
      // sus facturas nacen ya pagadas al registrarlas.
      pagoAlRegistrar: !!(cat&&cat.pagoAlRegistrar),
      metodoHabitual: (cat&&cat.metodoHabitual)||'',
      iban: cat?.iban || prevs.find(i=>i.ibanProveedor)?.ibanProveedor || '',
      cif: cat?.cif || prevs.find(i=>i.proveedorCif)?.proveedorCif || '',
      dir: cat?.dir || prevs.find(i=>i.proveedorDir)?.proveedorDir || '',
      bic: cat?.bic || '',
    };
  };
  // ═══ EXTRACTOS N43 ═══
  // De cada extracto aplicado se guarda qué hizo exactamente (qué pago añadió a
  // qué factura y qué fecha tenía antes), para poder deshacerlo entero después.
  const anularN43=(id)=>{if(soloLector())return;
    const ex=n43Hist.find(x=>x.id===id); if(!ex)return;
    const pagosPorFactura={}; (ex.pagos||[]).forEach(p=>{(pagosPorFactura[p.inv]=pagosPorFactura[p.inv]||[]).push(p.pago);});
    const ajustesPorFactura={}; (ex.ajustes||[]).forEach(a=>{ajustesPorFactura[a.inv]=a;});
    let quitados=0,restaurados=0;
    setInvoices(prev=>prev.map(i=>{
      let out=i;
      if(pagosPorFactura[i.id]){
        const quitar=new Set(pagosPorFactura[i.id]);
        const antes=(out.pagos||[]).length;
        out={...out,pagos:(out.pagos||[]).filter(p=>!quitar.has(p.id))};
        quitados+=antes-(out.pagos||[]).length;
      }
      const aj=ajustesPorFactura[i.id];
      if(aj&&(out.pagos||[]).length===1){
        // se devuelve la fecha y la referencia que tenía antes del extracto
        out={...out,pagos:[{...out.pagos[0],fecha:aj.fechaAntes,referencia:aj.refAntes||''}]};
        restaurados++;
      }
      return out;
    }));
    persistN43(n43Hist.filter(x=>x.id!==id));
    notify(`↩️ Extracto anulado · ${quitados} pago${quitados!==1?'s':''} retirado${quitados!==1?'s':''}${restaurados?` · ${restaurados} fecha${restaurados!==1?'s':''} restaurada${restaurados!==1?'s':''}`:''}`);
  };
  const persistFin=(next)=>{setFinanciacion(next);window.storage.set('bh10-financiacion',JSON.stringify(next)).catch(e=>console.error('Error guardando financiación:',e));};
  // ── ALMACÉN VERI*FACTU (src/almacenes/verifactu.js) ──────────────────────
  // Alias: ni una línea de consumo cambia.
  const _alm_vf=useVerifactu({VF_CFG_POR_DEFECTO});
  const {vfCfg,setVfCfg,vfRegistros,setVfRegistros,vfEventos,setVfEventos,
    vfEnviando,setVfEnviando,vfProbando,setVfProbando,vfPrueba,setVfPrueba,
    vfVer,setVfVer,vfAnular,setVfAnular,vfCotejo,setVfCotejo,
    vfRegRef,vfCola,vfLista,persistVfRegistros,persistVfCfg}=_alm_vf;
  // Una factura ya registrada NO se puede tocar: la huella se calculó sobre sus
  // datos y cambiarlos rompería la cadena. Se anula y se emite una rectificativa.
  const vfRegistroDe=(inv)=>(vfRegRef.current||vfRegistros||[]).find(r=>r&&r.tipoRegistro==='alta'&&r.facturaId===(inv&&inv.id));
  const vfBloqueada=(inv)=>{
    const r=vfRegistroDe(inv);
    if(!r)return null;
    const anulada=(vfRegRef.current||vfRegistros||[]).some(x=>x&&x.tipoRegistro==='anulacion'&&x.numSerie===r.numSerie);
    return anulada?null:r;
  };
  // Se llama al guardar una factura emitida: crea su registro y lo encadena
  const vfRegistrarFactura=async(inv)=>{
    if(!vfDebeRegistrar(inv,vfCfg))return null;
    if(vfRegistroDe(inv))return null;                      // ya estaba registrada
    const emisor={nif:compCfg.cif,nombre:compCfg.name,productorNif:vfCfg.productorNif||compCfg.cif,
      productorNombre:compCfg.name,instalacion:vfCfg.instalacion||'1'};
    const problemas=vfProblemas(inv,emisor);
    if(problemas.length){
      notify(`⛔ No se ha podido registrar la factura:\n· ${problemas.slice(0,3).join('\n· ')}`,'error');
      return null;
    }
    // En cola: si se guardan dos facturas seguidas, la segunda espera a que la
    // primera esté encadenada. Sin esto, ambas apuntarían al mismo registro
    // anterior y la cadena quedaría rota desde ese punto.
    const tarea=vfCola.current.then(async()=>{
      const lista=vfLista();
      const anterior=lista.length?lista[lista.length-1]:null;
      const reg=await vfCrearRegistroAlta({inv,emisor,anterior,ahora:new Date()});
      reg.qrPng=await vfQrDataUrl(vfUrlCotejo(reg,vfCfg.entorno));
      persistVfRegistros([...lista,reg]);
      // Envío inmediato: si se deja para luego, la marca temporal del registro
      // se aleja del reloj de la AEAT y responde con un aviso.
      if(String(vfCfg.pasarela||'').trim())setTimeout(()=>{vfEnviar(true);},400);
      return reg;
    }).catch(e=>{notify('No se ha podido registrar la factura: '+((e&&e.message)||e),'error');return null;});
    vfCola.current=tarea.then(()=>{},()=>{});
    return tarea;
  };
  // Emite una rectificativa que deja sin efecto una factura: misma estructura
  // con los importes en negativo, numerada en la serie de emitidas y enlazada a
  // la original. Es lo que hace que el libro de emitidas cuadre a cero.
  const emitirRectificativa=(inv)=>{
    if(soloLector()||!inv)return null;
    const des=normDesglose(inv);
    if(!des.length){notify('Esa factura no tiene importes que rectificar','error');return null;}
    const negativo=des.map(l=>({base:-Math.abs(+l.base||0),tipo:+l.tipo||0}));
    const t=calcDesglose(negativo,-(Math.abs(+inv.irpf||0)));
    const num=numEmitidaLibre();
    const rect={
      ...inv,
      id:uid(),
      numFactura:num,
      fecha:today,
      fechaVencimiento:today,
      concepto:`Rectificativa que anula la factura ${inv.numFactura||''}`.trim(),
      desglose:negativo,
      importeBase:negativo[0]?negativo[0].base:0,
      tipoIva:negativo[0]?negativo[0].tipo:0,
      base2:negativo[1]?negativo[1].base:0,
      tipoIva2:negativo[1]?negativo[1].tipo:10,
      iva:t.iva, retencion:t.retencion, total:t.total,
      pagos:[], notas:`Anula la factura ${inv.numFactura||''} de ${fmtDate(inv.fecha)}`,
      vfRectificaA:inv.numFactura||'', vfRectificaFecha:inv.fecha||'',
      vfTipoRect:'I',                              // por diferencias: importes en negativo
      vfEstado:undefined, vfCsv:'', vfHuella:'', vfError:'',
      retGarImp:0, retGarDevuelta:false,
    };
    delete rect.qrPng;
    // (el historial se apunta solo al detectar el cambio)
    setInvoices(p=>[...p,rect]);
    if(vfDebeRegistrar(rect,vfCfg))setTimeout(()=>{vfRegistrarFactura(rect);},0);
    notify(`📄 Emitida la rectificativa ${num} por ${fmt(t.total)} €`);
    return rect;
  };
  const vfAnularFactura=async(inv,motivo)=>{
    const r=vfBloqueada(inv);
    if(!r){notify('Esa factura no está registrada','error');return null;}
    const emisor={nif:compCfg.cif,nombre:compCfg.name,productorNif:vfCfg.productorNif||compCfg.cif,instalacion:vfCfg.instalacion||'1'};
    const tarea=vfCola.current.then(async()=>{
      const lista=vfLista();
      const anu=await vfCrearRegistroAnulacion({registroAnulado:r,anterior:lista[lista.length-1],emisor,ahora:new Date(),motivo});
      persistVfRegistros([...lista,anu]);
      if(String(vfCfg.pasarela||'').trim())setTimeout(()=>{vfEnviar(true);},400);
      return anu;
    });
    vfCola.current=tarea.then(()=>{},()=>{});
    const anu=await tarea;
    // La factura queda marcada como anulada. Sin esto, el registro desaparecía
    // de la AEAT pero la factura seguía contando en el IVA, en los saldos y en
    // los indicadores: se declararía IVA de una factura que ya no existe.
    if(inv&&inv.id){
      // (el historial se apunta solo al detectar el cambio)
      setInvoices(p=>p.map(x=>x&&x.id===inv.id?{...x,anulada:true,anuladaEn:today,anuladaMotivo:String(motivo||'')}:x));
    }
    anotarEventos([{tipo:'ANULACION',detalle:`Factura ${r.numSerie} anulada: ${motivo||'sin motivo'}`}]);
    notify(`Factura ${r.numSerie} anulada. Ya no cuenta en el IVA ni en los saldos.`);
    return anu;
  };
  // Comprueba que la pasarela existe, que el token vale y que el certificado
  // está cargado y sin caducar. Es la forma de ver que todo está en su sitio
  // ANTES de encender el registro y empezar a emitir facturas.
  const probarPasarela=async()=>{
    if(soloLector())return;
    const url=String(vfCfg.pasarela||'').trim();
    if(!url){notify('Escribe primero la dirección de la pasarela','error');return;}
    setVfProbando(true); setVfPrueba(null);
    try{
      const resp=await fetch(url,{method:'POST',
        headers:{'Content-Type':'application/json','X-BH10-Token':String(vfCfg.token||'').replace(/\s+/g,'')},
        body:JSON.stringify({entorno:vfCfg.entorno||'pruebas',prueba:true,soap:'<?xml version="1.0"?><comprobacion>RegFactuSistemaFacturacion</comprobacion>'})});
      const j=await resp.json().catch(()=>null);
      if(resp.status===401){setVfPrueba({ok:false,msg:`El token no coincide con el que guardaste en Cloudflare (aquí tienes ${String(vfCfg.token||'').replace(/\s+/g,'').length} caracteres). Vuelve a copiarlo del instalador, o ejecútalo otra vez para poner uno nuevo.`});}
      else if(!j){setVfPrueba({ok:false,msg:`La dirección responde pero no como se espera (${resp.status}). ¿Es la del fichero enviar.php?`});}
      else if(j.error&&/certificado/i.test(j.error)){setVfPrueba({ok:false,msg:j.error});}
      else if(j.error){setVfPrueba({ok:false,msg:j.error});}
      else {setVfPrueba({ok:true,msg:'',caduca:j.certCaduca||'',detalle:j.detalle||''});}
    }catch(e){
      setVfPrueba({ok:false,msg:'No se ha podido contactar con la pasarela. Comprueba la dirección y que el fichero está subido.'});
    }
    setVfProbando(false);
  };
  const [capas,setCapas]=useState(null);
  // Comprobador de documentos enlazados (Ajustes): {en:true|false, vistos, total, malos:[{inv,motivo}]}
  const [compDocs,setCompDocs]=useState(null);
  // Auditoría de remesas y pagos (Ajustes, v359): {sp,varias,sr,pc,extracto}
  const [audit,setAudit]=useState(null);
  const [borrarTodoNombre,setBorrarTodoNombre]=useState('');
  // v367 · viviendas (ventas): una por unidad dentro de cada obra promotora
  const persistViviendas=(next)=>{setViviendas(next);window.storage.set('bh10-viviendas',JSON.stringify(next)).catch(e=>console.error('Error guardando viviendas',e));};
  const persistDocsVenta=(next)=>{setDocsVenta(next);window.storage.set('bh10-docsventa',JSON.stringify(next)).catch(e=>console.error('Error guardando contratos de venta',e));};
  // Condiciones de partida: lo que la app ya sabe; el resto lo pone Jesús en el modal
  // v370 · contratos de venta (reserva / arras): viven aparte de presupuestos y
  // facturas — no son documentos fiscales y no tocan la serie AAnnnnn.
  const [docsVenta,setDocsVenta]=useState([]);
  // v371 · Jesús: «desde cada vivienda, acceso a toda la info para dar de alta
  // los boletines de luz y agua». Los DNI ya estaban guardados en custodia,
  // pero solo se llegaba a ellos desde la ventana de RGPD. Aquí se abren desde
  // la propia vivienda, sin salir de ella. Las imágenes NO se guardan en la
  // vivienda: se piden a la custodia cada vez y se sueltan al cerrar.
  const [dniVivienda,setDniVivienda]=useState(null);
  // v372 · Jesús: «el enlace aparece en pantalla pero no se copia; que salga en
  // una ventanita donde poder copiarlo». En iPhone el portapapeles solo deja
  // escribir dentro del gesto del dedo, y aquí el enlace tarda en crearse
  // (hay que hablar con Firebase), así que el gesto ya ha terminado y falla en
  // silencio. La ventana resuelve las dos cosas: copiar con un toque nuevo,
  // compartir con el menú del móvil, o seleccionarlo a mano si todo falla.
  const [enlaceModal,setEnlaceModal]=useState(null); // {titulo,enlace,nota} // {vivienda,obra,titulares:[{nombre,nif,fichas,imgs}]}
  const [docVentaModal,setDocVentaModal]=useState(null);   // {tipo,obra,vivienda,cond,previa} // {v} vivienda en edición
  // v370 · vista previa en vivo del contrato mientras se rellenan las cifras
  const previaDocVenta=useMemo(()=>{
    if(!docVentaModal)return null;
    const {tipo,obra,vivienda,cond}=docVentaModal;
    try{
      return componerContrato({tipo,numero:numeroDocVenta(docsVenta,tipo,+String(cond.fechaFirma||today).slice(0,4)),
        compCfg,obra,vivienda,cliCat,condiciones:cond,hoy:today});
    }catch(e){return {texto:'No se ha podido componer: '+String(e&&e.message||e),pendientes:0};}
  },[docVentaModal,docsVenta,compCfg,cliCat]); // eslint-disable-line
  const ponCond=(k,v)=>setDocVentaModal(m=>{
    const cond={...m.cond,[k]:v};
    // el plazo de la reserva calcula solo su fecha límite (es la que manda en el contrato)
    if((k==='reservaPlazoDias'||k==='fechaFirma')&&cond.fechaFirma&&+cond.reservaPlazoDias>0){
      const d=new Date(cond.fechaFirma+'T12:00:00');d.setDate(d.getDate()+(+cond.reservaPlazoDias||0));
      cond.reservaFechaLimite=d.toISOString().slice(0,10);
    }
    return {...m,cond};
  });
  // v370 · el contrato firmado, en papel: el texto tal cual se firmó, con las
  // firmas dibujadas y el pie de evidencias. Se abre en el visor de siempre y
  // desde ahí se guarda o se comparte.
  const verDocVenta=(doc)=>{
    const viv=viviendas.find(v=>v.id===doc.viviendaId);
    const ob=obras.find(o=>String(o.id)===String(doc.obraId));
    const firmado=firmasCompletas(doc,viv);
    const html=`<html><head><meta charset="utf-8"><style>${invoiceCSS}
      .cuerpo{white-space:pre-wrap;font-size:10.5pt;line-height:1.62;text-align:justify}
      .rubricas{display:flex;gap:24px;flex-wrap:wrap;margin-top:10mm}
      .rub{flex:1 1 40%;text-align:center;border-top:1px solid #999;padding-top:3mm;font-size:9pt}
      .rub img{max-height:26mm;max-width:100%;display:block;margin:0 auto 2mm}
      .ev{margin-top:8mm;padding:3mm 4mm;background:#F6F7F9;border-left:3px solid #94A3B8;font-size:7.5pt;color:#475569;line-height:1.5}
      .sello{font-family:ui-monospace,monospace;font-size:7pt;word-break:break-all}
    </style></head><body>
      <div class="cuerpo">${escXml(doc.texto)}</div>
      <div class="rubricas">
        <div class="rub"><div style="height:26mm"></div>Por ${escXml(compCfg.name||'')}<br/>${escXml(compCfg.representante||'')}</div>
        ${(doc.firmas||[]).map(f=>`<div class="rub"><img src="${f.trazo}" alt=""/>${escXml(f.nombre)}</div>`).join('')}
      </div>
      ${(doc.firmas||[]).length?`<div class="ev"><b>Firmado electrónicamente en el portal de clientes de ${escXml(compCfg.name||'')}.</b><br/>
        ${(doc.firmas||[]).map(f=>`${escXml(f.nombre)} — ${escXml(f.cuando)}${f.ip?' · IP '+escXml(f.ip):''}${f.agente?' · '+escXml(f.agente):''}`).join('<br/>')}
        <br/>Huella SHA-256 del texto firmado: <span class="sello">${escXml(doc.huella)}</span>
        <br/>${firmado?'Documento firmado por todos los titulares.':'PENDIENTE de firma de algún titular.'}</div>`
        :'<div class="ev">Documento sin firmar todavía.</div>'}
      <div class="footer">${escXml(compCfg.name||marcaDoc())} · ${escXml(doc.numero)} · ${escXml(ob?nombreObra(ob):'')} · vivienda ${escXml((viv&&viv.identificador)||'')} · BH10 ${APP_VERSION}</div>
    </body></html>`;
    showDocPreview(html,`${doc.tipo==='arras'?'ARRAS':'RESERVA'}_${String(doc.numero).replace(/[^A-Za-z0-9_-]/g,'_')}`,null);
  };
  const copiar=(t)=>{navigator.clipboard.writeText(String(t||'')).then(()=>notify('📋 Copiado')).catch(()=>notify(String(t||'')));};
  const descargarDni=(im,ficha)=>{
    const quien=String(ficha.nombre||'titular').replace(/[^\w\sáéíóúñÁÉÍÓÚÑ-]/g,'').trim().replace(/\s+/g,'_');
    shareOrDownload(new Blob([bytesDeBase64(im.b64)],{type:'image/jpeg'}),
      `DNI_${quien}_${im.cara==='dniA'?'anverso':'reverso'}.jpg`,'image/jpeg');
  };
  const abrirDniVivienda=async(v,o)=>{
    if(!window.bh10Dni){notify('Los DNI viven en la app de bh10group.com','error');return;}
    if(sinAccion('clientes','ver los DNI de los compradores'))return;
    setDniVivienda({vivienda:v,obra:o,cargando:true,titulares:[]});
    let docs=[];
    try{docs=await window.bh10Dni.listar();}catch(e){notify('No se pudo consultar la custodia: '+String((e&&e.code)||e),'error');setDniVivienda(null);return;}
    const titulares=[];
    for(const t of (v.titulares||[])){
      const f=(cliCat||[]).find(x=>String(idCliente(x))===String(t.clienteId))||{};
      const nom=normProvNombre(f.nombre||'');
      const suyos=docs.filter(d=>normProvNombre(d.nombreTitular||'')===nom||normProvNombre(d.cliente||'')===nom);
      const imgs=[];
      for(const d of suyos){
        try{const b64=await window.bh10Dni.ver(d.id);if(b64)imgs.push({id:d.id,cara:d.cara,b64,borrarAntesDe:d.borrarAntesDe});}catch(e){}
      }
      titulares.push({ficha:f,porcentaje:t.porcentaje,regimen:t.regimen,imgs});
    }
    setDniVivienda({vivienda:v,obra:o,cargando:false,titulares});
  };
  const generarDocVenta=async(paraFirmar)=>{
    if(sinAccion('contratos','generar contratos de venta'))return;
    const {tipo,obra,vivienda,cond}=docVentaModal;
    const comp=componerContrato({tipo,numero:numeroDocVenta(docsVenta,tipo,+String(cond.fechaFirma||today).slice(0,4)),
      compCfg,obra,vivienda,cliCat,condiciones:cond,hoy:today});
    if(paraFirmar&&comp.pendientes>0&&!window.confirm(`El contrato tiene ${comp.pendientes} datos sin rellenar y saldrán como «__________».\n\n¿Mandarlo a firmar así?`))return;
    if(paraFirmar&&!(vivienda.titulares||[]).length){notify('La vivienda no tiene titulares: manda antes el enlace de datos','error');return;}
    let huella='';
    try{huella=await huellaTexto(comp.texto);}catch(e){notify('No se pudo sellar el documento: '+String(e&&e.message||e),'error');return;}
    const doc=nuevoDocVenta({tipo,numero:comp.datos.numero,obraId:obra.id,viviendaId:vivienda.id,
      texto:comp.texto,huella,condiciones:cond,fecha:cond.fechaFirma||today});
    if(!paraFirmar){
      persistDocsVenta([...docsVenta,doc]);setDocVentaModal(null);
      notify(`📄 ${tipo==='arras'?'Arras':'Reserva'} ${doc.numero} guardada como borrador`);return;
    }
    if(!window.bh10Invitar){notify('El enlace de firma vive en la app de bh10group.com','error');return;}
    try{
      const enlace=await window.bh10Invitar({motivo:'Firma de '+(tipo==='arras'?'contrato de arras':'contrato de reserva'),
        vivienda:etiquetaVivienda(vivienda,obra),viviendaId:vivienda.id,obraId:obra.id,docId:doc.id,firmar:true,
        titulo:(tipo==='arras'?'Contrato de compraventa con arras':'Contrato de reserva')+' nº '+doc.numero,
        texto:comp.texto,huella,
        empresaNombre:compCfg.name||'',empresaNif:compCfg.cif||'',empresaEmail:compCfg.email||''});
      persistDocsVenta([...docsVenta,{...doc,estado:'enviado',enviado:today,enlace:String(enlace).split('t=')[1]||''}]);
      setDocVentaModal(null);
      setEnlaceModal({titulo:'✍️ Enlace para firmar · '+doc.numero,enlace,nota:'El comprador abre el enlace, lee el contrato entero y firma con el dedo. Sirve una sola vez.'});
    }catch(e){notify('No se pudo crear el enlace de firma: '+String(e&&e.message||e).slice(0,90),'error');}
  };
  const condicionesPorDefecto=(o,v)=>({
    lugarFirma:compCfg.city||o.municipio||'',fechaFirma:today,
    reservaImporte:0,reservaPlazoDias:30,reservaFechaLimite:'',reservaFormaPago:'transferencia bancaria',
    cuenta:'',arrasImporte:0,cuentaEspecial:'',garantiaTipo:'',garantiaEntidad:'',garantiaEntidadCuenta:'',
    notariaLocalidad:o.municipio||'',calendario:[],
  });
  const [vivModal,setVivModal]=useState(null);
  // v370 · una FIRMA que vuelve del móvil del comprador. Se acepta solo si sella
  // el mismo texto que se le enseñó (la huella): si no casa, no entra.
  const alAplicarFirma=(r)=>{
    const doc=docsVenta.find(d=>d.id===r.docId);
    if(!doc){notify('Esa firma no corresponde a ningún contrato de esta app','error');return;}
    const viv=viviendas.find(v=>v.id===doc.viviendaId);
    if(r.huella!==doc.huella){notify('⚠️ La firma sella un texto distinto al del contrato: NO se acepta','error');return;}
    // ¿de quién es la firma? del titular de la vivienda que aún no ha firmado
    const yaFirmaron=new Set((doc.firmas||[]).map(f=>String(f.clienteId)));
    const pend=((viv&&viv.titulares)||[]).find(t=>!yaFirmaron.has(String(t.clienteId)));
    if(!pend){notify('Ese contrato ya está firmado por todos los titulares','error');return;}
    const firma=nuevaFirma({clienteId:pend.clienteId,nombre:nombreTitular(pend,cliCat),trazo:r.trazo,
      ip:r.ip,cuando:r.cuando,huella:r.huella,agente:r.navegador});
    if(!firmaValida({...doc,firmas:[firma]},firma)){notify('La firma no es válida (sin trazo o sin sello)','error');return;}
    const actualizado={...doc,firmas:[...(doc.firmas||[]),firma]};
    const completo=firmasCompletas(actualizado,viv);
    persistDocsVenta(docsVenta.map(d=>d.id===doc.id?{...actualizado,estado:completo?'firmado':'enviado'}:d));
    if(completo&&viv&&doc.tipo==='arras'&&viv.estado!=='escriturada')
      persistViviendas(viviendas.map(v=>v.id===viv.id?{...v,estado:'arras',fechaArras:doc.fecha||today}:v));
    if(completo&&viv&&doc.tipo==='reserva'&&viv.estado==='libre')
      persistViviendas(viviendas.map(v=>v.id===viv.id?{...v,estado:'reservada',fechaReserva:doc.fecha||today}:v));
    if(r&&r.id&&window.bh10Recibidos)window.bh10Recibidos.borrar(r.id).catch(()=>{});
    notify(completo?`✍️ ${doc.numero} FIRMADO por todos los titulares`:`✍️ Firma de ${firma.nombre} recogida — faltan otros titulares`);
  };
  // lo que llega del portal con vivienda enlazada: titulares, fichas y mejoras del configurador
  const alAplicar=(r)=>{if(r&&r.tipo==='firma')return alAplicarFirma(r);if(r&&r.id&&window.bh10InvitacionUsada)window.bh10InvitacionUsada(r.id).catch(()=>{});   /* v368: el enlace queda usado */
    if(!r||!r.viviendaId)return;const v=viviendas.find(x=>x.id===r.viviendaId);if(!v)return;const res=aplicarRecibidoAVivienda({recibido:r,vivienda:v,cliCat});let vv=res.vivienda;if(Array.isArray(r.mejoras)&&r.mejoras.length)vv=aplicarMejoras(vv,r.mejoras,'configurador').vivienda;persistCliCat(res.cliCat);persistViviendas(viviendas.map(x=>x.id===vv.id?vv:x));notify(`🏠 Vivienda ${vv.identificador}: ${vv.titulares.length} titular(es)${res.nuevos.length?' · '+res.nuevos.length+' ficha(s) nueva(s)':''}${r.mejoras&&r.mejoras.length?' · mejoras del configurador':''}`);};
  // v361 · obras: vista dentro de Contratos e imputación en bloque desde Recibidas
  const [obrasUI,setObrasUI]=useState({vista:'catalogo',imp:null,sel:{},destino:'',desde:'',hasta:''});
  const [impObra,setImpObra]=useState(null); // {destino} en la barra de selección de Recibidas
  // v361 · obras: importación desde plantilla (vista previa), fusión de valores, imputar en bloque
  const [obrasImport,setObrasImport]=useState(null);   // {lec, nombre}
  const [obrasFundir,setObrasFundir]=useState(null);   // {marcados:Set, destino:''}
  const [obrasPeriodo,setObrasPeriodo]=useState({desde:'',hasta:''});
  const [imputarObra,setImputarObra]=useState(null);   // {destino:''} para la selección de Recibidas
  const compDocsParar=useRef(false);
  // Marca de alta nueva. No vale la cadena vacía: es falsa, y la ventana se
  // comprueba con {cliModal&&…}, así que no llegaría a abrirse.
  const CLI_NUEVO='\u0000nuevo';
  const [cliModal,setCliModal]=useState(null);
  const [cliMotivo,setCliMotivo]=useState('');
  const [cliSoloFiscal,setCliSoloFiscal]=useState(false);
  const [cliGenerando,setCliGenerando]=useState(false);
  const [cliRecibidos,setCliRecibidos]=useState(null);
  // ── ALMACÉN PROMOCIONES (src/almacenes/promociones.js) ────────────────────
  const _alm_promo=usePromociones();
  const {promoCfg,setPromoCfg,verPromo,setVerPromo,verResumen,setVerResumen,
    editCfg,setEditCfg,promoBusy,setPromoBusy,guardaPromoCfg}=_alm_promo;
  const [ultimaCopia,setUltimaCopia]=useState('');// fecha de la última copia v9
  const [verMaster,setVerMaster]=useState(false); // ventana Master (usuarios+sesiones)
  const [masterTab,setMasterTab]=useState('usuarios');
  const [usuariosApp,setUsuariosApp]=useState([]); // altas con permisos por áreas
  const [sesionesApp,setSesionesApp]=useState([]); // sesiones registradas
  const [nuevoUsr,setNuevoUsr]=useState({email:'',nombre:''});
  const [masterCfg,setMasterCfg]=useState({url:'',clave:''}); // Worker Master (fase 2)
  const [pruebaWorker,setPruebaWorker]=useState(null); // resultado de Probar conexión
  const [sesionRevocada,setSesionRevocada]=useState(false);
  const [verTeso,setVerTeso]=useState(false);     // previsión de tesorería
  const [verRecu,setVerRecu]=useState(false);     // panel de recurrentes (dentro de la app)
  const [cesion,setCesion]=useState(null);
  const [fusion,setFusion]=useState(null);
  const [derechos,setDerechos]=useState([]);
  // v375 · Jesús: «una bandeja de notificaciones recibidas… la veo yo solo, y
  // como un KPI dentro del Panel, movible como el resto». No es un almacén
  // nuevo: SUMA lo que ya existe en sus cuatro sitios y lleva a cada uno. Si
  // duplicáramos el circuito acabaríamos con dos caminos desincronizados, que
  // es de donde salen los fallos silenciosos.
  const [buzonAbierto,setBuzonAbierto]=useState(false);
  // Los cuatro atajos del buzón: llevan a la pantalla donde ya se resuelve
  const irAClientesRecibidos=async()=>{setView('facturas');setSubView('clientes');
    if(window.bh10Recibidos){try{setCliRecibidos(await window.bh10Recibidos.listar());}catch(e){notify('No se pudo consultar: '+((e&&e.code)||e),'error');}}};
  const irAProveedores=()=>{setView('facturas');setSubView('recibidas');};
  const irADerechos=()=>{setView('facturas');setSubView('clientes');if(derechos&&derechos.length)setVerDerecho(derechos[0]);};
  const marcarDocVisto=(d)=>{persistDocsVenta(docsVenta.map(x=>x.id===d.id?{...x,visto:today}:x));};
  const buzonTodo=useMemo(()=>{
    const firmados=(docsVenta||[]).filter(d=>d&&d.estado==='firmado'&&!d.visto);
    const cli=(cliRecibidos&&cliRecibidos.length)||0;
    return {
      clientes:cli,
      firmas:firmados.length,
      proveedores:(buzon||[]).length,
      derechos:(derechos||[]).length,
      get total(){return this.clientes+this.firmas+this.proveedores+this.derechos;},
      // urgente = tiene plazo legal o compromete un contrato firmado
      get urgente(){return this.firmas+this.derechos+this.clientes;},
    };
  },[docsVenta,cliRecibidos,buzon,derechos]);
  const [verDerecho,setVerDerecho]=useState(null);
  const [expNotaria,setExpNotaria]=useState(null);
  const [expBusy,setExpBusy]=useState(false);
  const [verEstado,setVerEstado]=useState({hay:false,msg:'',cuando:''});
  const [verBuscando,setVerBuscando]=useState(false);
  const [custodia,setCustodia]=useState(null);
  const [verDni,setVerDni]=useState(null);
  // ── ALMACÉN FICHAJE (src/almacenes/fichaje.js) ────────────────────────────
  const _alm_fichaje=useFichaje();
  const {planImport,setPlanImport,planMeses,setPlanMeses,fichajeGest,setFichajeGest,
    guardarPlanMes}=_alm_fichaje;
  const [contImport,setContImport]=useState(null);    // contactos a revisar antes de aplicar
  const [ordenConfig,setOrdenConfig]=useState([]);    // apartados de Ajustes, a su gusto
  const [verDebug,setVerDebug]=useState(false);       // medidas de la pantalla
  const [altoTab,setAltoTab]=useState(TAB_DEF);       // alto de la barra de abajo
  const [bajarTab,setBajarTab]=useState(0);           // cuánto se baja la barra entera
  const [apartados,setApartados]=useState([]);        // los que hay ahora en pantalla
  // v360 · Jesús (04-09-2026): «tengo el orden en el móvil y en el ordenador
  // no se respeta». Se guardaba bien; solo se leía al arrancar. Ahora, al
  // entrar en Ajustes, se vuelve a leer de la nube y, si cambió, se aplica.
  useEffect(()=>{
    if(view!=='config')return;
    let vivo=true;
    (async()=>{try{const oc=await window.storage.get('bh10-ordenconfig');const l0=oc?.value?JSON.parse(oc.value):[];const l=Array.isArray(l0)?l0.filter(x=>typeof x==='string'&&x.trim()):[];
      if(vivo&&JSON.stringify(l)!==JSON.stringify(ordenConfig)){setOrdenConfig(l);setApartados(l);}}catch(e){}})();
    return ()=>{vivo=false;};
  },[view]); // eslint-disable-line
  const [accionesFac,setAccionesFac]=useState(false);  // cajones de acciones de Facturas
  const [filtrosFac,setFiltrosFac]=useState(false);    // filtros de Facturas
  const [verExtras,setVerExtras]=useState(null);      // contrato cuyos extras se miran
  const [extraForm,setExtraForm]=useState(null);      // extra que se está editando
  const [extraAbierto,setExtraAbierto]=useState('');
  const [extrasFila,setExtrasFila]=useState('');
  const [emitidasFila,setEmitidasFila]=useState('');
  const [verFilas,setVerFilas]=useState(120);
  useEffect(()=>{
    // Un manejador async que revienta no enseña nada: el botón parece muerto.
    // Esta red convierte ese silencio en un aviso con el motivo.
    const alFallar=(ev)=>{
      const m=(ev&&(ev.reason&&(ev.reason.message||ev.reason)||ev.message))||'error desconocido';
      try{notify('⚠️ La acción ha fallado: '+String(m).slice(0,120));}catch(_){}
    };
    window.addEventListener('unhandledrejection',alFallar);
    return ()=>window.removeEventListener('unhandledrejection',alFallar);
  },[]);        // filas pintadas: la lista crece por tramos   // contrato con sus facturas emitidas desplegadas
  const [cliCt,setCliCt]=useState('');            // contrato desplegado en la ficha de cliente
  const [paqueteTrozos,setPaqueteTrozos]=useState(null); // zips del paquete gestoría cuando va troceado      // contrato con sus extras desplegados en la tarjeta  // cuál está desplegado
  const [verEmbargoEmp,setVerEmbargoEmp]=useState(false); // ventana del embargo en la ficha del trabajador
  const [abiertosAj,setAbiertosAj]=useState([]);      // apartados de Ajustes desplegados
  const alternarAj=useCallback((t)=>setAbiertosAj(p=>p.includes(t)?[]:[t]),[]);
  const [asignar,setAsignar]=useState(null);          // factura que se está asignando
  const [provAbierto,setProvAbierto]=useState('');    // proveedor desplegado
  const [contPegar,setContPegar]=useState(null);
  const [cliForm,setCliForm]=useState({nombre:'',cif:'',dir:'',cp:'',municipio:'',provincia:'',email:'',telefono:'',contacto:'',diasVenc:'',retGarPct:'',notas:''});
  // Envío: el sobre se arma aquí y la pasarela solo le añade el certificado
  // v348 · reintentos de la ventana de 240 s: si el envío falla por RED (no
  // por rechazo de la AEAT), se reintenta a los 30, 60 y 120 segundos. Un
  // rechazo de la AEAT no se reintenta: eso es un error de contenido.
  const vfReintento=useRef({intento:0,timer:null});
  const vfProgramarReintento=()=>{
    const r=vfReintento.current;
    if(r.timer)return;                          // ya hay uno en marcha
    const espera=vfPlanReintento(r.intento);
    if(espera===null){
      notify('⛔ Reintentos agotados (ventana de 240 s): el registro queda pendiente y saldrá en el próximo envío','error');
      anotarEventos([{tipo:'ENVIO_AEAT',detalle:'reintentos agotados tras fallo de red — registro pendiente'}]);
      r.intento=0;return;
    }
    r.intento++;
    notify(`⏳ Sin conexión con la pasarela: reintento ${r.intento} en ${espera/1000} s`);
    r.timer=setTimeout(()=>{r.timer=null;vfEnviar(true);},espera);
  };
  const vfEnviar=async(automatico)=>{
    if(soloLector())return;
    if(vfEnviando)return;                       // no solapar dos envíos
    if(!vfActivo(vfCfg)){if(!automatico)notify('El registro está desactivado','error');return;}
    if(!String(vfCfg.pasarela||'').trim()){if(!automatico)notify('Falta la dirección de la pasarela en Ajustes','error');return;}
    const lote=vfLoteAEnviar(vfLista());
    if(!lote.length){if(!automatico)notify('No hay registros pendientes de enviar');return;}
    setVfEnviando(true);
    try{
      const emisor={nif:compCfg.cif,nombre:compCfg.name};
      const soap=vfSobreSoap(lote,emisor);
      const resp=await fetch(vfCfg.pasarela,{method:'POST',
        headers:{'Content-Type':'application/json','X-BH10-Token':String(vfCfg.token||'').replace(/\s+/g,'')},
        body:JSON.stringify({entorno:vfCfg.entorno||'pruebas',soap})});
      const j=await resp.json().catch(()=>null);
      if(!resp.ok||!j){
        notify(`⛔ La pasarela ha respondido con error${j&&j.error?': '+j.error:` (${resp.status})`}`,'error');
        setVfEnviando(false);vfProgramarReintento();return;
      }
      vfReintento.current.intento=0;   // hubo conexión: el contador se rearma
      const leido=vfLeerRespuesta(j.xml||'');
      leido.cuando=vfMarcaTemporal(new Date());
      const actualizados=vfAplicarRespuesta(vfLista(),leido,lote);
      persistVfRegistros(actualizados);
      // El CSV se guarda también en la propia factura: es su justificante y
      // tiene que verse desde la factura, no solo desde la lista de registros.
      const porFactura={};
      actualizados.forEach(r=>{ if(r&&r.tipoRegistro==='alta'&&r.facturaId)porFactura[r.facturaId]=r; });
      setInvoices(p=>p.map(x=>{
        const r=porFactura[x.id];
        if(!r||!r.estadoAEAT)return x;
        return {...x,vfEstado:r.estadoAEAT,vfCsv:r.csv||'',vfHuella:r.huella||'',vfError:r.errorAEAT||''};
      }));
      anotarEventos([{tipo:'ENVIO_AEAT',detalle:`${lote.length} registros · ${leido.estado}${leido.csv?' · CSV '+leido.csv:''}`}]);
      if(leido.ok)notify(`✅ ${lote.length} registro${lote.length!==1?'s':''} aceptado${lote.length!==1?'s':''} por la AEAT${leido.csv?' · CSV '+leido.csv:''}`);
      else if(leido.parcial)notify(`⚠ Envío parcial: ${leido.rechazadas.length} rechazada${leido.rechazadas.length!==1?'s':''}. Míralas en la lista.`,'error');
      else notify(`⛔ La AEAT no ha aceptado el envío: ${leido.mensaje||leido.estado}`,'error');
    }catch(e){
      notify('No se ha podido enviar: '+((e&&e.message)||e),'error');
      setVfEnviando(false);vfProgramarReintento();return;
    }
    setVfEnviando(false);
  };
  const anotarEventos=(evs)=>{
    if(!evs||!evs.length)return;
    const nuevos=[...vfEventos,...evs.map(e=>vfCrearEvento(e.tipo,e.detalle,{usuario:((typeof window!=='undefined'&&window.bh10Diag&&window.bh10Diag().correo)||''),empresa:(compCfg&&compCfg.name)||''}))];
    setVfEventos(nuevos);
    window.storage.set('bh10-vfeventos',JSON.stringify(nuevos.slice(-500))).catch(()=>{});
  };
  const [usoIA,setUsoIA]=useState({});           // consumo por mes y por tipo de operación
  const usoRef=useRef({});
  // Se apunta después de cada llamada. El coste es una estimación con los
  // precios de tarifa: la cifra que factura Anthropic es la de su consola.
  const apuntarUso=(operacion,d)=>{
    const u=usoDeRespuesta(d);
    const mes=today.slice(0,7);
    const prev=usoRef.current&&Object.keys(usoRef.current).length?usoRef.current:usoIA;
    const m={...(prev[mes]||{}),total:sumaUso((prev[mes]||{}).total,u)};
    m.ops={...(m.ops||{})};
    m.ops[operacion]=sumaUso(m.ops[operacion],u);
    const next={...prev,[mes]:m};
    usoRef.current=next;
    setUsoIA(next);
    window.storage.set('bh10-usoia',JSON.stringify(next)).catch(()=>{});
  };
  const [euriProp,setEuriProp]=useState(null);   // propuesta pendiente de confirmar
  const [euriBusca,setEuriBusca]=useState('');
  // Consulta con búsqueda web: sin ella el modelo se inventaría la cifra
  const buscarEuribor=async(mes)=>{
    if(soloLector())return;
    if(faltaClaveIA())return;
    setEuriBusca(mes); setEuriProp(null);
    try{
      await prepararIA();const resp=await fetch(urlIA(),{method:'POST',headers:cabIA(),
        body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:1500,
          tools:[{type:'web_search_20250305',name:'web_search',max_uses:5}],
          system:'Buscas datos oficiales publicados. NUNCA respondes de memoria: si la búsqueda no lo confirma con una fuente, devuelves valor null. Responde solo con JSON.',
          messages:[{role:'user',content:`Busca el TIPO MEDIO MENSUAL del euríbor a un año correspondiente al mes ${mes}, que es el índice de referencia oficial que publica el Banco de España en el BOE para la revisión de préstamos en España. No quiero el valor de un día suelto ni el del primer día hábil: quiero la media del mes completo.\n\nDevuelve SOLO este JSON, sin texto alrededor:\n{"mes":"${mes}","valor":numero_con_tres_decimales,"fuente":"url de donde lo has sacado","cita":"la frase exacta donde aparece","seguro":true}\n\nSi no encuentras la media mensual publicada de ese mes, o no estás seguro, devuelve {"mes":"${mes}","valor":null,"seguro":false}.`}]})});
      if(!resp.ok)throw new Error(await errorIA(resp));
      const d=await resp.json();
      apuntarUso('euribor',d);
      const txt=(d.content||[]).filter(c=>c.type==='text').map(c=>c.text||'').join('');
      const m=txt.replace(/```json|```/g,'').match(/\{[\s\S]*\}/);
      const prop=m?JSON.parse(m[0]):null;
      const chk=validarPropuestaEuribor(prop,euribor,mes);
      if(!chk.ok){notify('No se ha podido conseguir el dato: '+chk.motivo,'error');setEuriBusca('');return;}
      setEuriProp({...prop,mes,avisos:chk.avisos||[]});
    }catch(e){notify('No se pudo consultar: '+((e&&e.message)||e),'error');}
    setEuriBusca('');
  };
  const persistEuribor=(next)=>{setEuribor(next);window.storage.set('bh10-euribor',JSON.stringify(next)).catch(e=>console.error('Error guardando euríbor:',e));};
  // Próximos pagos al banco: alimenta la previsión de tesorería del Panel
  const obligacionesBanco=(desde,hasta)=>{
    const out=[];
    (financiacion||[]).filter(o=>o.activo!==false).forEach(o=>{
      if(o.tipo==='linea'){
        // La línea no tiene cuota fija: se estima la liquidación del periodo
        const i=interesesPeriodo(o,desde,hasta,euribor);
        if(i.intereses>0)out.push({op:o,fecha:hasta,cuota:i.intereses,concepto:'Liquidación de intereses (estimada)',estimado:true});
        return;
      }
      const c=cuadroFinanciacion(o,euribor,{hoy:today});
      c.filas.filter(f=>f.fecha>=desde&&f.fecha<=hasta).forEach(f=>
        out.push({op:o,fecha:f.fecha,cuota:f.cuota,iva:f.iva||0,interes:f.interes||0,capital:f.capital||0,
          concepto:f.carencia?'Cuota (carencia: solo intereses)':`Cuota ${f.n}`,estimado:o.clase==='variable'}));
    });
    // Las primas de seguro son un pago cierto y con fecha: pertenecen aquí
    // igual que una cuota de préstamo. Antes no aparecían en ninguna previsión.
    pagosSeguros(polizas,desde,hasta).forEach(s=>out.push({
      op:{id:s.poliza.id,nombre:s.concepto,tipo:'seguro'},
      fecha:s.fecha, cuota:s.importe, seguro:true,
      concepto:'Prima · '+((PERIODOS[s.poliza.periodicidad||'anual']||{}).n||'Anual'),
    }));
    return out.sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)));
  };
  const logRemesa=(r)=>persistRemesas([{...r,id:uid(),fecha:today},...remesas].slice(0,100));
  const delRemesa=(id)=>{persistRemesas(remesas.filter(r=>r.id!==id));notify('Remesa eliminada del historial');};
  const RemesasList=({tipo,titulo})=>{
    const list=remesas.filter(r=>r.tipo===tipo);
    return(
      <div style={{marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:700,color:C.mt,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:6}}>{titulo} · {list.length}</div>
        {list.length===0?<div style={{fontSize:11,color:C.mt,padding:'4px 0 8px'}}>Sin remesas descargadas todavía</div>:
          list.map(r=>(
            <div key={r.id} style={{...S.card,marginBottom:8,padding:0,overflow:'hidden'}}>
              <div style={{padding:'10px 12px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}} onClick={()=>setExpRemesa(expRemesa===r.id?null:r.id)}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:13}}>{fmtDate(r.fechaEjec)} <span style={{color:C.mt,fontWeight:500,fontSize:11}}>· {r.msgId}</span></div>
                  <div style={{fontSize:10,color:C.mt}}>{r.nbTxs} transferencia{r.nbTxs!==1?'s':''}</div>
                </div>
                <div style={{fontWeight:800,fontSize:14,flexShrink:0}}>{fmt(r.total)} €</div>
                <span style={{fontSize:14,color:C.mt,transition:'transform .2s',transform:expRemesa===r.id?'rotate(180deg)':'rotate(0)'}}>▼</span>
              </div>
              {expRemesa===r.id&&(
                <div style={{borderTop:`1px solid ${C.bd}`,padding:'8px 12px',background:C.bg+'66'}}>
                  <div style={{fontSize:10,color:C.mt,marginBottom:6}}>Fichero: <b>{r.fichero}</b> · Generada el {fmtDate(r.fecha)}</div>
                  {(r.txns||[]).map((tx,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',gap:8,padding:'4px 0',borderBottom:`1px solid ${C.bd}22`,fontSize:12}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tx.n}</div>
                        <div style={{fontSize:10,color:C.mt}}>{tx.ib?'···'+tx.ib.slice(-4):''}{tx.c?' · '+tx.c:''}</div>
                      </div>
                      <div style={{fontWeight:700,flexShrink:0}}>{fmt(tx.imp)} €</div>
                    </div>
                  ))}
                  {/* ── PARTIR EN VARIOS FICHEROS ─────────────────────────
                      El límite del banco es POR REMESA Y DÍA. De las líneas
                      guardadas se reconstruyen varios C34 bajo el límite,
                      cada uno en un día hábil distinto. Los pagos de las
                      facturas no se tocan: ya estaban apuntados. */}
                  {r.partida?(
                    <div style={{fontSize:11,color:C.sc,marginTop:8}}>✂️ Partida en {r.partida.partes} ficheros el {fmtDate(r.partida.en)}</div>
                  ):(r.txns||[]).length>1&&!soloLector()&&(r.tipo==='prov'||r.tipo==='nom')&&(
                    partirRem&&partirRem.id===r.id?(
                      <div style={{border:`1px solid ${C.in}44`,borderRadius:8,padding:'8px 10px',marginTop:8,background:C.in+'0d'}}>
                        <div style={{fontWeight:700,fontSize:12,marginBottom:6}}>✂️ Partir en varios ficheros</div>
                        <div style={{display:'flex',gap:8,alignItems:'flex-end',flexWrap:'wrap',marginBottom:6}}>
                          <label style={{flex:1,minWidth:130}}><span style={{fontSize:10,color:C.mt}}>Límite por fichero y día (€)</span>
                            <input style={S.input} inputMode="decimal" value={partirRem.limite}
                              onChange={e=>setPartirRem(p=>({...p,limite:e.target.value,partes:null}))}/></label>
                          <button style={S.sm(C.in)} onClick={()=>{
                            const lim=parseNum(partirRem.limite);
                            if(!(lim>0)){notify('Pon el límite en euros','error');return;}
                            const partes=repartirLineas(r.txns,lim);
                            if(partes.length<2&&!partes.some(p=>p.excede)){notify(`Con ${fmt(lim)} € cabe todo en un fichero: no hace falta partirla`,'error');return;}
                            const arranque=(r.fechaEjec&&r.fechaEjec>today)?r.fechaEjec:today;
                            const fechas=fechasEscalonadas(arranque,partes.length);
                            setPartirRem(p=>({...p,partes:partes.map((x,i)=>({...x,fecha:fechas[i],bajada:false}))}));
                          }}>Calcular reparto</button>
                          <button style={S.sm(C.mt)} onClick={()=>setPartirRem(null)}>✕</button>
                        </div>
                        {partirRem.partes&&partirRem.partes.map((p,i)=>(
                          <div key={i} style={{borderTop:`1px solid ${C.bd}33`,padding:'6px 0'}}>
                            <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontWeight:700,fontSize:12}}>Parte {i+1} de {partirRem.partes.length} · {p.txns.length} transf. · {fmt(p.total)} €</div>
                                {p.excede&&<div style={{fontSize:10,color:C.dn,fontWeight:600}}>⚠️ Esta línea supera el límite por sí sola y no se puede partir: acuérdala con el banco o págala aparte</div>}
                              </div>
                              <input type="date" style={{...S.input,width:130,flexShrink:0}} value={p.fecha}
                                onChange={e=>setPartirRem(q=>({...q,partes:q.partes.map((x,j)=>j===i?{...x,fecha:e.target.value}:x)}))}/>
                              {p.bajada?<span style={{fontSize:11,color:C.sc,fontWeight:700,flexShrink:0}}>✓ descargada</span>:
                                <button style={{...S.sm(C.sc),flexShrink:0}} onClick={()=>{
                                  if(!p.fecha){notify('Pon la fecha de ejecución','error');return;}
                                  const msgId=`BIOH-${Date.now()}-P${i+1}`;
                                  const pref=r.tipo==='nom'?'SEPA_NOM':'SEPA_PROV';
                                  const fichero=`${pref}_${p.fecha}_parte${i+1}de${partirRem.partes.length}.xml`;
                                  const xml=construirC34DeTxns({ordenante:compCfg,txns:p.txns,fechaEjec:p.fecha,msgId,tipo:r.tipo,
                                    bicDe:(ib)=>BIC_ES[String(ib).slice(4,8)]||''});
                                  shareOrDownload(xml,fichero,'application/xml;charset=utf-8').then(res=>{
                                    if(res==='cancelled'||res==='failed'){notify(res==='failed'?'No se pudo generar el fichero':'Descarga cancelada — nada registrado','error');return;}
                                    logRemesa({tipo:r.tipo,fechaEjec:p.fecha,msgId,fichero,nbTxs:p.txns.length,total:p.total,txns:p.txns,deRemesa:r.msgId});
                                    setPartirRem(q=>{
                                      const partes=q.partes.map((x,j)=>j===i?{...x,bajada:true}:x);
                                      if(partes.every(x=>x.bajada)){
                                        persistRemesas(remesas.map(x=>x.id===r.id?{...x,partida:{en:today,partes:partes.length}}:x).slice(0,100));
                                        notify(`✂️ Remesa partida en ${partes.length} ficheros — súbelos al banco, cada uno va a su día`);
                                        return null;
                                      }
                                      return {...q,partes};
                                    });
                                  });
                                }}>⬇️ Descargar</button>}
                            </div>
                          </div>
                        ))}
                        {partirRem.partes&&<div style={{fontSize:10,color:C.mt,marginTop:4}}>Cada fichero va a un día hábil distinto porque el límite del banco es también diario. Las fechas se pueden cambiar antes de descargar. Los pagos de las facturas no se tocan.</div>}
                      </div>
                    ):(
                      <button style={{...S.sm(C.in),marginTop:8}} onClick={()=>setPartirRem({id:r.id,limite:fmt(parseNum(compCfg.sepaLimite)||60000),partes:null})}>✂️ Partir en varios ficheros</button>
                    )
                  )}
                  {r.deRemesa&&<div style={{fontSize:10,color:C.mt,marginTop:6}}>Parte de la remesa {r.deRemesa}</div>}
                  {/* ── v359 · ¿esta remesa dejó pagos apuntados? ¿se ejecutó? ──────
                      Jesús (03-09-2026): cuatro remesas quedaron en el histórico
                      sin pago apuntado y otra (la global de julio) nunca se
                      ejecutó y dejó 82 facturas marcadas. Aquí se ve y se arregla. */}
                  {(r.tipo==='prov'||r.tipo==='nom')&&(r.txns||[]).length>0&&(()=>{
                    const conPago=invoices.filter(i=>(i.pagos||[]).some(p=>String(p.referencia)===String(r.msgId)));
                    const dj=deRemesa(diario,String(r.msgId));
                    return (
                      <div style={{marginTop:8,fontSize:11}}>
                        {r.noEjecutada?<div style={{color:C.dn,fontWeight:700}}>✗ Marcada como NO ejecutada por el banco{r.noEjecutada.en?' el '+fmtDate(r.noEjecutada.en):''} · sus pagos se retiraron</div>
                        :conPago.length===0?<div style={{color:C.wn,fontWeight:700}}>⚠️ Sin pagos apuntados en ninguna factura (de {(r.txns||[]).length} líneas)</div>
                        :<div style={{color:C.mt}}>Pagos apuntados con esta referencia: {conPago.length} de {(r.txns||[]).length} líneas{conPago.length<(r.txns||[]).length?' ⚠️':''}</div>}
                        {dj.length>0&&<div style={{color:C.mt,fontSize:10,marginTop:2}}>📜 {dj.length} apuntes en el diario</div>}
                        {!esLector()&&!r.noEjecutada&&(
                          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:6}}>
                            {conPago.length<(r.txns||[]).length&&<button style={S.sm(C.sc)} onClick={()=>{
                              // apunta el pago en cada línea cuya factura tenga saldo (proveedor + nº, o proveedor + importe)
                              const nrm=(x)=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
                              if(sinAccion('pagos','apuntar pagos'))return;
                              let n=0;origenCambio.current='remesas: marcar pagadas';
                              setInvoices(prev=>prev.map(inv=>{
                                if((inv.pagos||[]).some(p=>String(p.referencia)===String(r.msgId)))return inv;
                                const t=(r.txns||[]).find(t=>nrm(t.n).slice(0,12)===nrm(inv.proveedor).slice(0,12)&&((t.c&&nrm(String(t.c).split(' - ')[0])===nrm(inv.numFactura))||Math.abs((+t.imp||0)-(+inv.total||0))<0.01));
                                if(!t)return inv;
                                const saldo=getSaldo(inv,prev);if(saldo<=0.01)return inv;
                                n++;return {...inv,pagos:[...(inv.pagos||[]),{id:uid(),fecha:r.fechaEjec||r.fecha,importe:Math.min(saldo,+t.imp||saldo),metodo:'Transferencia SEPA',referencia:r.msgId}]};
                              }));
                              anotarRemesa('remesa·marcada',r,'pagos apuntados a mano desde el histórico');
                              setTimeout(()=>notify(n?`💾 ${n} pagos apuntados con la referencia de esta remesa`:'Ninguna factura con saldo casaba con las líneas (ya estaban pagadas o no se encuentran)',n?'success':'error'),50);
                            }}>💾 Marcar pagadas ahora</button>}
                            <BtnConfirm style={S.sm(C.dn)} armStyle={{background:C.dn,color:'#fff',borderColor:C.dn}} armedLabel="¿Quitar sus pagos? Toca de nuevo" onConfirm={()=>{
                              if(sinAccion('pagos','quitar pagos'))return;
                              origenCambio.current='remesa no ejecutada';
                              setInvoices(prev=>prev.map(inv=>(inv.pagos||[]).some(p=>String(p.referencia)===String(r.msgId))?{...inv,pagos:(inv.pagos||[]).filter(p=>String(p.referencia)!==String(r.msgId))}:inv));
                              persistRemesas(remesas.map(x=>x.id===r.id?{...x,noEjecutada:{en:today,pagos:conPago.length}}:x));
                              anotarRemesa('remesa-deshecha',r,`marcada como NO ejecutada · ${conPago.length} pagos retirados`);
                              notify(`✗ Remesa marcada como no ejecutada · ${conPago.length} pagos retirados (las facturas vuelven a pendiente)`);
                            }}>✗ Esta remesa no se ejecutó</BtnConfirm>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <BtnConfirm style={{...S.sm(C.dn),marginTop:8}} armStyle={{background:C.dn,color:'#fff',borderColor:C.dn}} armedLabel="¿Eliminar remesa? Toca de nuevo" onConfirm={()=>delRemesa(r.id)}>🗑 Eliminar remesa</BtnConfirm>
                </div>
              )}
            </div>
          ))}
      </div>
    );
  };
  // Cada mes en su propia clave: 20 personas × 22 días son ~440 líneas al mes,
  // y guardarlo todo junto acabaría siendo un bloque enorme que se reescribe
  // entero cada vez. Así un mes no arrastra a los demás.
  // Los extras viven dentro del contrato: son pocos y así viajan con él
  const guardarExtra=(contratoId,extra)=>{
    const next=(contratos||[]).map(c=>{
      if(!c||c.id!==contratoId)return c;
      const ex=extrasDeContrato(c);
      const i=ex.findIndex(x=>x.id===extra.id);
      const nuevos=i>=0?ex.map(x=>x.id===extra.id?extra:x):[...ex,extra];
      return {...c,extras:nuevos};
    });
    setContratos(next);
    setVerExtras(v=>v&&v.id===contratoId?next.find(c=>c.id===contratoId):v);
  };
  const borrarExtra=(contratoId,extraId)=>{
    const next=(contratos||[]).map(c=>c&&c.id===contratoId
      ?{...c,extras:extrasDeContrato(c).filter(x=>x.id!==extraId)}:c);
    setContratos(next);
    setVerExtras(v=>v&&v.id===contratoId?next.find(c=>c.id===contratoId):v);
  };
  // Quitar o poner una factura en un extra
  const alternarFacturaExtra=(contratoId,extraId,facturaId)=>{
    const c=(contratos||[]).find(x=>x&&x.id===contratoId);
    if(!c)return;
    const ex=extrasDeContrato(c).find(x=>x.id===extraId);
    if(!ex)return;
    const l=(ex.facturas||[]).map(String);
    const id=String(facturaId);
    guardarExtra(contratoId,{...ex,facturas:l.includes(id)?l.filter(x=>x!==id):[...l,id]});
  };
  // ── ORDEN DE LOS APARTADOS DE AJUSTES ──
  // Se reordena con la propiedad «order» del contenedor, sin mover nada en el
  // documento: React sigue mandando sobre su contenido y aquí solo se decide
  // en qué sitio se pinta cada tarjeta. Cada apartado se reconoce por su
  // título, así que si mañana añado uno nuevo aparece al final sin romper nada.
  // La marca de cada apartado: el icono y las primeras palabras del encabezado.
  // No puede llevar nada que cambie solo («sincronizado», «Ordenar»/«Listo»),
  // El alto de la barra se aplica al documento: todo lo que se apoya en ella
  // usa la misma variable, así que se recoloca solo sin tocar nada más.
  useEffect(()=>{
    try{
      document.documentElement.style.setProperty('--bh-tab-h',altoTab+'px');
      document.documentElement.style.setProperty('--bh-tab-off',bajarTab+'px');
    }catch(e){}
  },[altoTab,bajarTab]);
  const cambiarBajarTab=(v)=>{
    const n=Math.max(0,Math.min(BAJAR_MAX,Math.round(+v||0)));
    setBajarTab(n);
    try{window.storage.set('bh10-bajartab',String(n));}catch(e){}
  };
  useEffect(()=>{
    try{document.documentElement.style.setProperty('--bh-bajar',bajarTab+'px');}catch(e){}
  },[bajarTab]);
  const cambiarBajar=(v)=>{
    const n=Math.max(0,Math.min(BAJAR_MAX,Math.round(+v||0)));
    setBajarTab(n);
    try{window.storage.set('bh10-bajartab',String(n));}catch(e){}
  };
  const cambiarAltoTab=(v)=>{
    const n=Math.max(TAB_MIN,Math.min(TAB_MAX,Math.round(+v||TAB_DEF)));
    setAltoTab(n);
    try{window.storage.set('bh10-altotab',String(n));}catch(e){}
  };
  const savePoliza=()=>{
    if(!String(polForm.ramo||'').trim()&&!String(polForm.tipo||'').trim()&&!String(polForm.desc||'').trim()){notify('Elige qué clase de seguro es','error');return;}
    const p={...polForm,empresa:polForm.empresa||'BIG',tipo:String(polForm.tipo||'').trim().toUpperCase(),
      objeto:String(polForm.objeto||'').trim(),objetoId:String(polForm.objeto||'').toUpperCase().replace(/[^A-Z0-9]/g,''),
      desc:String(polForm.desc||'').trim(),prima:parseNum(polForm.prima)||''};
    if(polModal==='new')persistPolizas([...polizas,{...p,id:uid()}]);
    else persistPolizas(polizas.map(x=>x.id===polModal?{...p,id:polModal}:x));
    setPolModal(null);notify('Póliza guardada');
  };
  const bajaItem=(kind,id)=>{
    if(kind==='pol')persistPolizas(polizas.map(x=>x.id===id?{...x,activa:false}:x));
    else persistFlota(flota.map(x=>x.id===id?{...x,activa:false}:x));
    setLastBaja({kind,id});
    if(bajaTimer.current)clearTimeout(bajaTimer.current);
    bajaTimer.current=setTimeout(()=>setLastBaja(null),10000);
  };
  const restaurarItem=(kind,id)=>{
    if(kind==='pol')persistPolizas(polizas.map(x=>x.id===id?{...x,activa:true}:x));
    else persistFlota(flota.map(x=>x.id===id?{...x,activa:true}:x));
    if(lastBaja&&lastBaja.id===id)setLastBaja(null);
    notify('Restaurado');
  };
  const saveVeh=()=>{
    if(!flotaForm.alias.trim()&&!flotaForm.matricula.trim()){notify('Indica nombre o matrícula','error');return;}
    const v={...flotaForm,empresa:flotaForm.empresa||'BIG',alias:flotaForm.alias.trim(),matricula:flotaForm.matricula.trim().toUpperCase(),seguroPrima:parseNum(flotaForm.seguroPrima)||''};
    if(flotaModal==='new')persistFlota([...flota,{...v,id:uid()}]);
    else persistFlota(flota.map(x=>x.id===flotaModal?{...v,id:flotaModal}:x));
    setFlotaModal(null);notify('Vehículo guardado');
  };
  useEffect(()=>{ if(showContratoForm&&!esLector()&&!editingContrato)guardarDraft(DRAFT_C,contratoForm); },[showContratoForm,contratoForm,editingContrato]);
  useEffect(()=>{ if(showForm&&!esLector()&&!editing){const {_file,...limpio}=form||{};guardarDraft(DRAFT_F,limpio);} },[showForm,form,editing]);
  // Buzón del portal: solo se consulta con la app a la vista. Antes seguía
  // preguntando cada 2 minutos aunque el móvil estuviera en el bolsillo.
  useEffect(()=>{
    if(!ES_APP)return;
    let iv=null;
    const consulta=()=>{ if(document.hidden||!window.bh10Buzon)return; window.bh10Buzon.listar().then(setBuzon).catch(()=>{}); };
    const arranca=()=>{
      if(iv){clearInterval(iv);iv=null;}
      if(document.hidden)return;
      consulta();
      iv=setInterval(consulta,180000);
    };
    const t=setTimeout(arranca,1500);
    document.addEventListener('visibilitychange',arranca);
    return ()=>{clearTimeout(t);if(iv)clearInterval(iv);document.removeEventListener('visibilitychange',arranca);};
  },[]);
  // Referencias de documento guardadas como objeto (fallo de una versión
  // anterior): se normalizan una sola vez para que vuelvan a abrirse.
  useEffect(()=>{
    if(typeof soloLector==='function'&&soloLector())return;
    const malas=invoicesAll.filter(i=>i&&i.adjPath&&typeof i.adjPath==='object');
    if(!malas.length)return;
    const limpia=(r)=>{ const v=(typeof r==='object')?(r.id||r.path||''):r; return String(v||'').replace(/^adj\//,'').trim()||null; };
    setInvoices(p=>p.map(i=>(i&&i.adjPath&&typeof i.adjPath==='object')?{...i,adjPath:limpia(i.adjPath)}:i));
    notify(`📎 ${malas.length} documento${malas.length!==1?'s':''} recuperado${malas.length!==1?'s':''} — ya se pueden abrir`);
  },[invoicesAll.length]);

  const soloLector=()=>{ if(esLector()){ notify('👁 Modo lector: solo consulta','error'); return true; } return false; };
  // v364 · «¿tengo esta acción?» — si no, avisa y frena (el almacén y Firestore frenan también, por si acaso)
  const sinAccion=(accion,que)=>{ if(puedeAccion(accion))return false; notify(`🔒 Sin permiso para ${que||accion}: pídeselo al dueño en Master`,'error'); return true; };
  const aprenderIban=(prov,iban)=>{
    if(esLector())return;
    const ib=normIban(iban); if(!prov||!ib||ib.length<15)return;
    // v346: un IBAN que suspende el dígito de control (mod-97) NO entra en la
    // ficha. Se queda en la factura, con su aviso de siempre, y ahí muere:
    // era la vía por la que se acumulaban cuentas falsas en los proveedores.
    if(problemaIban(ib))return;
    setProvCat(pc=>{
      const arr=Array.isArray(pc)?pc:Object.values(pc||{}).filter(x=>x&&x.nombre);
      const ix=arr.findIndex(p=>p&&p.nombre===prov);
      const base=ix>=0?arr[ix]:{nombre:prov,cif:'',dir:'',iban:'',bic:''};
      const lista=[...new Set([normIban(base.iban),...((base.ibans||[]).map(normIban)),ib].filter(x=>x&&x.length>=15))];
      if(ix>=0&&base.iban&&Array.isArray(base.ibans)&&base.ibans.length===lista.length)return pc;
      const f={...base,iban:base.iban?normIban(base.iban):ib,ibans:lista};
      const next=ix>=0?arr.map((p,i)=>i===ix?f:p):[...arr,f];
      window.storage.set('bh10-provcat',JSON.stringify(next)).catch(()=>{});
      return next;
    });
  };
  // ── ARCHIVADOR: escanea documentos SOLO para adjuntarlos a facturas que ya
  // existen. No crea facturas, no cambia importes, no toca el estado de pago.
  // Lo único que modifica de la factura existente es su documento adjunto.
  const archivarDocumentos=async(fileList)=>{
    if(soloLector())return;
    if(faltaClaveIA())return;
    const files=Array.from(fileList||[]);
    if(!files.length)return;
    setArchivador({fase:'leyendo',total:files.length,hechos:0,resultados:[]});
    const resultados=[];
    for(let i=0;i<files.length;i++){
      const file=files[i];
      setArchivador(a=>({...a,hechos:i}));
      let d=null,err='';
      try{ d=await extractInvoiceData(file); }catch(e){ err=String(e&&e.message||e).slice(0,90); }
      if(!d){ resultados.push({file,estado:'ilegible',nota:err||'No se pudo leer'}); continue; }
      // Se busca la factura ya registrada, sin crear nada
      const cand={tipo:'factura',proveedor:d.proveedor,numFactura:d.numFactura,
        fecha:d.fecha,total:(parseNum(d.importeBase)||0)+((parseNum(d.importeBase)||0)*(+d.tipoIva||0)/100)};
      if(d._totalLeido>0)cand.total=+d._totalLeido;
      const dup=hallarDuplicada(cand,invoicesAll,null);
      if(!dup){ resultados.push({file,estado:'sin-pareja',nota:`${d.proveedor||'?'} · ${d.numFactura||'s/n'} · ${fmt(cand.total)} €`,leido:d}); continue; }
      if(dup.inv.adjPath&&docEstado(dup.inv)==='ok'){ resultados.push({file,estado:'ya-tenia',nota:`${dup.inv.proveedor} · ${dup.inv.numFactura||'s/n'} (para cambiarlo: ficha → 🔁 Sustituir)`,inv:dup.inv}); continue; }
      if(dup.inv.adjPath){ // v355: enlace roto o sin confirmar en la nube → este documento lo sustituye
        if(!esDupFuerte(dup)){ resultados.push({file,estado:'dudosa',nota:`¿${dup.inv.proveedor} · ${dup.inv.numFactura||'s/n'}? (sustituiría un documento roto)`,inv:dup.inv,motivo:dup.motivo}); continue; }
        resultados.push({file,estado:'lista',nota:`${dup.inv.proveedor} · ${dup.inv.numFactura||'s/n'} · ${fmtDate(dup.inv.fecha)} · sustituye el documento roto`,inv:dup.inv}); continue; }
      if(!esDupFuerte(dup)){ resultados.push({file,estado:'dudosa',nota:`¿${dup.inv.proveedor} · ${dup.inv.numFactura||'s/n'}?`,inv:dup.inv,motivo:dup.motivo}); continue; }
      resultados.push({file,estado:'lista',nota:`${dup.inv.proveedor} · ${dup.inv.numFactura||'s/n'} · ${fmtDate(dup.inv.fecha)}`,inv:dup.inv});
    }
    setArchivador({fase:'revisar',total:files.length,hechos:files.length,resultados});
  };

  // ── RELECTURA DE ARCHIVADAS: recorre las facturas que YA tienen documento
  // guardado pero se registraron sin desglose (p. ej. las importadas del Excel)
  // y les extrae las líneas con el lector. No toca importes, fechas, estados
  // ni pagos: solo rellena «lineas» (y el concepto si estaba vacío) para que
  // el seguimiento de Precios de materiales tenga con qué trabajar.
  const analizarArchivadas=async()=>{
    if(soloLector())return;
    if(!ES_APP||!window.bh10Adj||typeof window.bh10Adj.blobDe!=='function'){notify('La relectura de documentos vive en la app de bh10group.com','error');return;}
    if(faltaClaveIA())return;
    const cands=invoices.filter(i=>i.tipo!=='cobro'&&i.adjPath&&typeof i.adjPath==='string'&&!(i.lineas||[]).length&&!i._sinDetalle);
    if(!cands.length){notify('No hay facturas archivadas pendientes de leer');return;}
    detalleCancelRef.current=false;
    let ok=0,fallos=0;
    setDetalleScan({total:cands.length,hechos:0,ok,fallos});
    for(let ix=0;ix<cands.length;ix++){
      if(detalleCancelRef.current)break;
      const inv=cands[ix];
      setDetalleScan({total:cands.length,hechos:ix,ok,fallos});
      try{
        const blob=await window.bh10Adj.blobDe(inv.adjPath);
        const nombre=String(inv.adjPath).split('/').pop()||'documento.pdf';
        const file=new File([blob],nombre,{type:blob.type||'application/pdf'});
        const d=await extractInvoiceData(file);
        const lista=(d._lista&&d._lista.length)?d._lista:[d];
        // Documento multifactura: la entrada buena es la que cuadra con el total
        let elegida=lista[0];
        if(lista.length>1){
          const porTotal=lista.find(x=>(+x._totalLeido||0)>0&&Math.abs(x._totalLeido-(+inv.total||0))<=0.02);
          if(porTotal)elegida=porTotal;
        }
        const tl=+elegida._totalLeido||0;
        const cuadra=!(tl>0&&(+inv.total||0)>0&&Math.abs(tl-inv.total)>0.02);
        const lineas=cuadra?(elegida.lineas||[]):[];
        if(lineas.length){
          ok++;
          setInvoices(p=>p.map(x=>x.id===inv.id?{...x,lineas,concepto:x.concepto||elegida.concepto||''}:x));
        }else{
          // Se marca para no volver a gastar lecturas en el mismo documento:
          // 'sin-lineas' = factura sin desglose · 'otro-importe' = el papel no
          // cuadra con la factura (posible adjunto equivocado, revisar a mano)
          fallos++;
          setInvoices(p=>p.map(x=>x.id===inv.id?{...x,_sinDetalle:cuadra?'sin-lineas':'otro-importe'}:x));
        }
      }catch(e){fallos++;console.error('relectura',inv.id,e);}
      setDetalleScan({total:cands.length,hechos:ix+1,ok,fallos});
      if(ix<cands.length-1)await new Promise(r=>setTimeout(r,400)); // pausa entre llamadas
    }
    setDetalleScan(null);
    notify(`🔎 Lectura terminada: ${ok} factura${ok!==1?'s':''} con líneas nuevas${fallos?` · ${fallos} sin desglose aprovechable`:''}`);
  };

  // Registrar una factura que el archivador no encontró, reutilizando la
  // lectura que ya se hizo: no se vuelve a gastar una consulta al escáner.
  const registrarDesdeArchivador=(item)=>{
    if(soloLector())return;
    if(!item||!item.leido)return;
    const d=item.leido;
    setArchivador(a=>({...(a||{}),resultados:(a.resultados||[]).filter(x=>x!==item)}));
    setEditing(null);
    setForm({...emptyForm,tipo:'factura',...d,_file:item.file});
    setShowForm(true);
    notify('📝 Datos ya leídos — revisa y registra. El documento va adjunto.');
  };

  // Adjunta los documentos confirmados. NO altera ningún otro campo.
  const confirmarArchivado=async(seleccion)=>{
    if(soloLector())return;
    const pares=(seleccion||[]).filter(r=>r&&r.inv&&r.file).map(r=>[r.inv.id,r.file]);
    if(!pares.length){setArchivador(null);return;}
    setArchivador(a=>({...(a||{}),fase:'guardando'}));
    let ok=0,pendientesNube=0;
    for(const [id,file] of pares){
      try{
        const ref=await window.bh10Adj.subir(id,file);
        const nube=await confirmarNube(ref);
        // Solo se toca adjPath (y su confirmación): el resto de la factura queda intacta
        setInvoices(p2=>p2.map(i=>i.id===id?{...i,adjPath:ref,adjNube:nube.ok}:i));
        if(!nube.ok)pendientesNube++;
        ok++;
      }catch(e){ console.error('archivar',e); }
    }
    setArchivador(null);
    notify(pendientesNube?`⏳ ${ok} archivado${ok!==1?'s':''}, ${pendientesNube} aún subiendo a la nube — no cierres la app hasta que desaparezca el reloj`:`📎 ${ok} documento${ok!==1?'s':''} archivado${ok!==1?'s':''} en sus facturas · nada más ha cambiado`,pendientesNube?'error':undefined);
  };

  // Abre el documento en un visor propio. No se usa window.open porque iOS
  // bloquea las ventanas nuevas que no salen de un toque directo, y aquí hay
  // que esperar a descargar el archivo de la nube antes de poder mostrarlo.
  // Ordenación de las listas de proveedores y clientes
  const ordenarLista=(arr)=>{
    const x=[...(arr||[])];
    if(ordenLista==='nombre')  return x.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'es',{sensitivity:'base'}));
    if(ordenLista==='pendiente')return x.sort((a,b)=>(b.pendiente||0)-(a.pendiente||0)||(b.total||0)-(a.total||0));
    if(ordenLista==='facturas') return x.sort((a,b)=>(b.count||0)-(a.count||0)||(b.total||0)-(a.total||0));
    return x.sort((a,b)=>(b.total||0)-(a.total||0));
  };

  const ChipsOrden=({sufijo})=>(
    <div style={{display:'flex',gap:5,marginBottom:8,flexWrap:'wrap'}}>
      {[['importe','💶 Importe'],['pendiente','⏳ Pendiente'],['nombre','🔤 A-Z'],['facturas','📄 Nº facturas']].map(([k,l])=>(
        <button key={k} onClick={()=>setOrdenLista(k)} style={{padding:'5px 10px',borderRadius:14,border:`1px solid ${ordenLista===k?C.in:C.bd}`,background:ordenLista===k?C.in+'22':'transparent',color:ordenLista===k?C.in:C.mt,fontSize:10,fontWeight:ordenLista===k?700:500,cursor:'pointer',whiteSpace:'nowrap'}}>{l}</button>
      ))}
    </div>
  );

  // ── documento en la nube ──────────────────────────────────────────────
  // Jesús (01-09-2026): «muchas veces no adjunta facturas que sí se ven en
  // la app». La caché local del iPhone enseña el documento aunque sus
  // trozos sigan en cola de subida; el paquete gestoría (u otro aparato)
  // no los encuentra. Tras subir se pregunta al servidor: enNube solo dice
  // sí cuando cabecera y trozos están aceptados. Hasta entonces la ficha
  // enseña ⏳ y al arrancar se vuelve a comprobar.
  const confirmarNube=(ref)=>confirmarEnNube(window.bh10Adj&&window.bh10Adj.enNube,ref);
  const revisarPendientesNube=async()=>{
    if(!window.bh10Adj||!window.bh10Adj.enNube||soloLector())return 0;
    const pend=invoices.filter(i=>i&&i.adjPath&&i.adjNube===false);
    let ya=0;const ok=new Set();
    for(const i of pend){try{const r=await window.bh10Adj.enNube(i.adjPath);if(r&&r.ok){ok.add(i.id);ya++;}}catch(e){}}
    if(ok.size)setInvoices(p=>p.map(i=>ok.has(i.id)?{...i,adjNube:true}:i));
    return ya;
  };
  useEffect(()=>{
    // Al arrancar con red: lo que quedó ⏳ se vuelve a preguntar al servidor
    // (Firestore reintenta la cola sola; aquí solo se confirma y se quita el reloj).
    if(!ES_APP||!invoices.some(i=>i&&i.adjNube===false))return;
    const t=setTimeout(()=>{revisarPendientesNube().then(n=>{if(n)notify(`☁️ ${n} documento${n!==1?'s':''} ya confirmado${n!==1?'s':''} en la nube`);});},15000);
    return ()=>clearTimeout(t);
  },[invoices.length?1:0]); // eslint-disable-line — al cargar las facturas, una vez
  const abrirDocumento=async(id)=>{
    if(!id){notify('Esta factura no tiene documento','error');return;}
    if(!window.bh10Adj||!window.bh10Adj.blobDe){notify('El visor no está disponible aquí','error');return;}
    setDocVer({cargando:true});
    try{
      const r=await window.bh10Adj.blobDe(id);
      if(!r||!r.blob){setDocVer(null);notify('No se encontró el documento','error');return;}
      const url=URL.createObjectURL(r.blob);
      setDocVer({url,nombre:r.nombre||'documento',mime:(r.blob.type||''),zoom:1,blob:r.blob});
    }catch(e){
      setDocVer(null);
      notify('No se pudo abrir: '+String(e&&e.message||e).slice(0,60),'error');
    }
  };

  const cerrarDocumento=()=>{
    setDocVer(d=>{ if(d&&d.url){try{URL.revokeObjectURL(d.url);}catch(e){}} return null; });
    reajustarPronto();
  };

  // Compartir con el sistema (AirDrop, correo, WhatsApp…); si no se puede, descarga
  const compartirDocumento=async()=>{
    const d=docVer; if(!d||!d.blob)return;
    try{
      const file=new File([d.blob],d.nombre,{type:d.mime||'application/octet-stream'});
      if(navigator.canShare&&navigator.canShare({files:[file]})){
        await navigator.share({files:[file],title:d.nombre});
        return;
      }
    }catch(e){ if(String(e&&e.name)==='AbortError')return; }
    try{
      const a=document.createElement('a');
      a.href=d.url; a.download=d.nombre; document.body.appendChild(a); a.click(); a.remove();
      notify('📥 Documento descargado');
    }catch(e){ notify('No se pudo compartir','error'); }
  };

  // v397 · una foto de móvil pesa 5 MB y se archivaba entera: 8 trozos por
  // factura y subidas que se quedaban a medias (9 de 20 en el lote del 28/09
  // llegaron sin foto). Se archiva a 2048 px y en JPEG, derecha si el lector
  // tuvo que girarla. Los PDF y las imágenes pequeñas van tal cual.
  const comprimirParaArchivo=async(file,giro)=>{
    try{
      if(!file||!/^image\//.test(file.type||'')||file.size<900*1024)return file;
      const b=await downscaleImage(file,2048,0.85,{girar:giro||0});
      if(!b||b.size>=file.size)return file;
      const nombre=String(file.name||'foto').replace(/\.[^.]+$/,'')+'.jpg';
      return new File([b],nombre,{type:'image/jpeg',lastModified:file.lastModified||Date.now()});
    }catch(e){return file;}
  };
  const subirAdjuntos=async(pares)=>{if(soloLector())return;
    const validos=(pares||[]).filter(p=>p&&p[1]);
    if(!ES_APP||!window.bh10Adj||!validos.length)return;
    let ok=0,pendientesNube=0;
    for(const [id,file0,giro] of validos){
      try{const file=await comprimirParaArchivo(file0,giro);
        const path=await window.bh10Adj.subir(id,file);
        const nube=await confirmarNube(path);
        setInvoices(p=>p.map(i=>i.id===id?{...i,adjPath:path,adjNube:nube.ok}:i));ok++;
        if(!nube.ok)pendientesNube++;
      }catch(e){console.error('adjunto',e);if(e&&e.message)notify('📎 '+e.message,'error');}
    }
    if(ok)notify(pendientesNube?`⏳ ${ok} guardado${ok!==1?'s':''}, ${pendientesNube} aún subiendo a la nube — no cierres la app hasta que desaparezca el reloj`:`📎 ${ok} documento${ok!==1?'s':''} guardado${ok!==1?'s':''}`,pendientesNube?'error':undefined);
  };
  const fusionarProveedores=(origen,destino)=>{if(soloLector())return;
    if(!origen||!destino||origen===destino){notify('Elige duplicado y destino distintos','error');return;}
    const n=invoices.filter(i=>i.proveedor===origen).length;
    setInvoices(p=>p.map(i=>i.proveedor===origen?{...i,proveedor:destino}:i));
    setProvCat(pc=>{
      const arr=Array.isArray(pc)?pc:Object.values(pc||{}).filter(x=>x&&x.nombre);
      const fO=arr.find(p=>p&&p.nombre===origen);
      const fD=arr.find(p=>p&&p.nombre===destino);
      let next;
      if(fO&&fD){
        const mezcla={...fD};
        for(const k of ['cif','dir','iban','bic'])if(!mezcla[k]&&fO[k])mezcla[k]=fO[k];
        next=arr.filter(p=>p&&p.nombre!==origen).map(p=>p.nombre===destino?mezcla:p);
      }else if(fO){
        next=arr.map(p=>p&&p.nombre===origen?{...p,nombre:destino}:p);
      }else{
        next=arr.slice();
      }
      window.storage.set('bh10-provcat',JSON.stringify(next)).catch(()=>{});
      return next;
    });
    if(fusOrigen===origen)setFusOrigen('');setFusDestino('');
    if(fProvSel===origen)setFProvSel(destino);
    notify(`✅ ${n} factura${n!==1?'s':''} de "${origen}" fusionada${n!==1?'s':''} en "${destino}"`);
  };
  // ── fusión de CLIENTES (v345), hermana de la de proveedores ──────────────
  const [cliFusOrigen,setCliFusOrigen]=useState('');
  const [cliFusDestino,setCliFusDestino]=useState('');
  const [cliFusIgn,setCliFusIgn]=useState([]);
  const [cliFusCfg,setCliFusCfg]=useState({cerradaEn:-1,abierta:false});
  const fusionarClientes=(origen,destino)=>{if(soloLector())return;
    const r=fusionaCliente({invoices:invoicesAll,contratos,cliCat},origen,destino);
    if(!r){notify('Elige duplicado y destino distintos','error');return;}
    setInvoices(()=>r.invoices);
    setContratos(r.contratos);
    setCliCat(r.cliCat);
    window.storage.set('bh10-clicat',JSON.stringify(r.cliCat)).catch(()=>{});
    if(cliFusOrigen===origen){setCliFusOrigen('');setCliFusDestino('');}
    if(focoCli===origen)setFocoCli(destino);
    notify(`✅ ${r.nFacturas} factura${r.nFacturas!==1?'s':''} y ${r.nContratos} contrato${r.nContratos!==1?'s':''} de "${origen}" fusionados en "${destino}"`);
  };
  const normalizarMayusculas=()=>{if(soloLector())return;
    const r=normalizaMayusculas({invoices:invoicesAll,contratos,cliCat,provCat});
    if(!r.nFacturas&&!r.nContratos&&!r.nFichas&&!r.nFundidas){notify('✓ Ya estaba todo en mayúsculas');return;}
    setInvoices(()=>r.invoices);
    setContratos(r.contratos);
    setCliCat(r.cliCat);setProvCat(r.provCat);
    window.storage.set('bh10-clicat',JSON.stringify(r.cliCat)).catch(()=>{});
    window.storage.set('bh10-provcat',JSON.stringify(r.provCat)).catch(()=>{});
    notify(`🔠 ${r.nFacturas} facturas, ${r.nContratos} contratos y ${r.nFichas} fichas pasados a MAYÚSCULAS`+(r.nFundidas?` · ${r.nFundidas} ficha${r.nFundidas!==1?'s':''} duplicada${r.nFundidas!==1?'s':''} fundida${r.nFundidas!==1?'s':''}`:''));
  };
  const openProvModal=(nombre)=>{const d=getSupplierData(nombre);setProvForm({nombre,cif:d.cif,dir:d.dir,iban:d.iban,bic:d.bic||'',ibans:d.ibans||[],_nuevoIban:'',pagoAlRegistrar:!!d.pagoAlRegistrar,metodoHabitual:d.metodoHabitual||'Transferencia'});setProvModal(nombre);};
  const saveProv=()=>{if(soloLector())return;
    const nombre=provForm.nombre.trim();
    if(!nombre){notify('El nombre no puede quedar vacío','error');return;}
    const nAfectadas=invoices.filter(i=>i.proveedor===provModal).length;
    const _ibP=normIban(provForm.iban);
    const _ibs=[...new Set([_ibP,...((provForm.ibans||[]).map(normIban))].filter(x=>x&&x.length>=15))];
    const next=[...provCat.filter(p=>p.nombre!==provModal&&p.nombre!==nombre),{nombre,cif:provForm.cif.trim().toUpperCase(),dir:provForm.dir.trim(),iban:_ibP,bic:provForm.bic.trim().toUpperCase(),ibans:_ibs,pagoAlRegistrar:!!provForm.pagoAlRegistrar,metodoHabitual:provForm.metodoHabitual||'Transferencia'}];
    persistProvCat(next);
    if(provApplyAll||nombre!==provModal){
      const f={cif:provForm.cif.trim().toUpperCase(),dir:provForm.dir.trim(),iban:provForm.iban.trim()};
      setInvoices(p=>p.map(i=>i.proveedor!==provModal?i:{
        ...i,
        proveedor:nombre,
        ...(provApplyAll?{
          proveedorCif:f.cif||i.proveedorCif,
          proveedorDir:f.dir||i.proveedorDir,
          ibanProveedor:f.iban||i.ibanProveedor,
        }:{}),
      }));
      notify(`Ficha guardada — ${nAfectadas} facturas actualizadas`);
    }else notify('Ficha de proveedor guardada');
    setProvModal(null);
  };

  // Selection helpers
  // v381 · Jesús (07-09-2026): «necesito poder meter a sepa la parte parcial
  // del anticipo que se estime… así como el pago de los restos cuando se
  // quiera de cada anticipo o factura», y lo quiere ajustar EN LA LISTA, al
  // marcar cada factura. Aquí se guarda cuánto va a la remesa por cada línea;
  // si no se toca, va el saldo entero, que es lo de siempre.
  const [sepaImp,setSepaImp]=useState({});   // id → importe escrito a mano
  const impRemesa=(inv)=>{
    const puesto=sepaImp[inv.id];
    if(puesto===undefined||puesto==='')return getSaldo(inv,invoices);
    const v=parseNum(puesto)||0;
    return v>0?+v.toFixed(2):0;
  };
  const toggleSelect = (id) => setSelected(prev => {const n=new Set(prev);
    if(n.has(id)){n.delete(id);setSepaImp(p=>{const q={...p};delete q[id];return q;});}
    else n.add(id);
    return n;});
  const clearSelection = () => {setSelected(new Set());setSepaImp({});};

  // Aviso de embargos: si en la remesa va la nómina de alguien con embargo
  // anotado en su ficha, se dice ANTES de generar nada. La transferencia no
  // se bloquea — la retención la decide su diligencia — pero no pasa callada.
  const avisoEmbargos=(sel)=>{
    const afectados=[];
    (sel||[]).forEach(inv=>{
      if(!inv||inv.tipo!=='personal')return;
      const e=(employees||[]).find(x=>x&&(nifIgual(x.nif,inv.nifTrabajador)||String(x.nombre||'').trim().toLowerCase()===String(inv.proveedor||'').trim().toLowerCase()));
      if(e&&String(e.embargo||'').trim())afectados.push({nombre:e.nombre,nota:e.embargo});
    });
    if(afectados.length)notify('⚖️ ATENCIÓN: '+afectados.length+' nómina(s) con EMBARGO en la remesa — '
      +afectados.map(a=>a.nombre+' ('+String(a.nota).slice(0,40)+')').join(' · ')
      +'. Comprueba la retención antes de pagar.','error');
    return afectados.length;
  };
  // SEPA C34.14 XML generation (pain.001.001.09 — Eurocaja Rural)
  const generateSEPA = () => {
    if(sinAccion('remesar','generar remesas'))return;
    {
      const f=[];
      if(!String(compCfg.name||'').trim())f.push('nombre');
      if(!String(compCfg.cif||'').trim())f.push('CIF');
      if(!normIban(compCfg.iban||''))f.push('IBAN');
      if(f.length){notify(`Faltan datos de la empresa (${f.join(', ')}) — rellénalos en Ajustes → Datos de la empresa antes de generar el C34`,'error');return;}
    }

    const sel = invoices.filter(i => selected.has(i.id));
    // Se valida ANTES de generar: un IBAN mal escrito hace que el banco rechace
    // la remesa entera, y enterarse allí cuesta un viaje y un día de retraso.
    // Revisión completa antes de generar: el banco valida el fichero entero y
    // devuelve la remesa por un solo dato mal, así que se comprueba todo aquí.
    const rev=revisarRemesa({
      ordenante:{nombre:compCfg.name,cif:compCfg.cif,iban:compCfg.iban,bic:compCfg.bic},
      lineas:sel.map(i=>{
        const d=getSupplierData(i.proveedor);
        return {nombre:i.proveedor,iban:i.ibanProveedor||d.iban||'',bic:d.bic||'',num:i.numFactura||'',
          importe:impRemesa(i),concepto:`${i.numFactura||'Pago'} - ${i.concepto||''}`};
      }),
      fechaEjec:sepaDate, hoy:today,
    });
    if(!rev.ok){
      notify(`⛔ El banco rechazaría la remesa (${rev.errores.length} problema${rev.errores.length!==1?'s':''}):\n· ${rev.errores.slice(0,4).join('\n· ')}${rev.errores.length>4?`\n· y ${rev.errores.length-4} más`:''}`,'error');
      return;
    }
    if(rev.avisos.length)notify(`⚠ Revisa antes de enviarla al banco:\n· ${rev.avisos.slice(0,3).join('\n· ')}`,'error');
    {// El límite del banco es por remesa y día. Se avisa pero no se frena:
     // puede estar pedido el aumento, y siempre queda partirla en el histórico.
      const lim=parseNum(compCfg.sepaLimite)||0;
      const suma=sel.reduce((s,i)=>s+impRemesa(i),0);   // v381 · con los importes ajustados a mano
      if(lim>0&&suma>lim+0.001)notify(`⚠ La remesa suma ${fmt(suma)} € y el límite del banco es ${fmt(lim)} €/remesa·día — el banco puede rechazarla. Luego se puede partir desde Facturas → Remesas.`,'error');
    }

    const msgId = `BIOH-${Date.now()}`;
    const nbTxs = sel.length;
    const amounts = sel.map(i => getSaldo(i, invoices));
    const ctrlSum = amounts.reduce((s,a) => s+a, 0).toFixed(2);
    const iban = compCfg.iban.replace(/\s/g,'');
    const bic = compCfg.bic.replace(/\s/g,'');
    const cif = (compCfg.cif||'').replace(/[^A-Z0-9]/gi,'') + '000';
    const now = new Date().toISOString().replace(/\.\d{3}Z$/,'') + 'Z';
    avisoEmbargos(sel);   // si va la nómina de alguien con embargo, se avisa aquí

    let txns = '';
    sel.forEach((inv) => {
      const saldo = impRemesa(inv);   // v381 · lo que se transfiere de verdad: puede ser una parte
      const concepto = `${inv.numFactura||'Pago'} - ${inv.concepto||inv.proveedor}`.slice(0,140);
      const sd = getSupplierData(inv.proveedor);
      const credIban = ((inv.ibanProveedor||sd.iban)||'').replace(/\s/g,'');
      const credBic = (sd.bic||BIC_ES[credIban.slice(4,8)]||'').replace(/\s/g,'').toUpperCase();
      const dirRaw = (inv.proveedorDir||sd.dir||'').trim();
      let adr='';
      if(dirRaw){
        const cut=dirRaw.lastIndexOf(',');
        const l1=escXml((cut>0?dirRaw.slice(0,cut):dirRaw).trim().slice(0,70));
        const l2=cut>0?escXml(dirRaw.slice(cut+1).trim().slice(0,70)):'';
        adr=`
          <PstlAdr>
            <Ctry>ES</Ctry>
            <AdrLine>${l1}</AdrLine>${l2?`
            <AdrLine>${l2}</AdrLine>`:''}
          </PstlAdr>`;
      }
      txns += `
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>NOTPROVIDED</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="EUR">${saldo.toFixed(2)}</InstdAmt>
        </Amt>
        <ChrgBr>SLEV</ChrgBr>${credBic?`
        <CdtrAgt>
          <FinInstnId>
            <BICFI>${credBic}</BICFI>
          </FinInstnId>
        </CdtrAgt>`:''}
        <Cdtr>
          <Nm>${escXml(inv.proveedor.slice(0,70))}</Nm>${adr}
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>${normIban(credIban)}</IBAN>
          </Id>
        </CdtrAcct>
        <Purp>
          <Cd>SUPP</Cd>
        </Purp>
        <RmtInf>
          <Ustrd>${escXml(concepto)}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${now}</CreDtTm>
      <NbOfTxs>${nbTxs}</NbOfTxs>
      <CtrlSum>${ctrlSum}</CtrlSum>
      <InitgPty>
        <Nm>${escXml(compCfg.name.slice(0,70))}</Nm>${cif.length>3 ? `
        <Id>
          <OrgId>
            <Othr>
              <Id>${escXml(cif)}</Id>
            </Othr>
          </OrgId>
        </Id>` : ''}
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>SEPA SUPP ${msgId}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <BtchBookg>true</BtchBookg>
      <NbOfTxs>${nbTxs}</NbOfTxs>
      <CtrlSum>${ctrlSum}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
        <CtgyPurp>
          <Cd>SUPP</Cd>
        </CtgyPurp>
      </PmtTpInf>
      <ReqdExctnDt>
        <Dt>${sepaDate}</Dt>
      </ReqdExctnDt>
      <Dbtr>
        <Nm>${escXml(compCfg.name.slice(0,70))}</Nm>${compCfg.address||compCfg.city ? `
        <PstlAdr>
          <Ctry>${compCfg.country||'ES'}</Ctry>${compCfg.address?`
          <AdrLine>${escXml(compCfg.address)}</AdrLine>`:''}${compCfg.city?`
          <AdrLine>${escXml(compCfg.city)}</AdrLine>`:''}
        </PstlAdr>` : ''}
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${normIban(iban)}</IBAN>
        </Id>
      </DbtrAcct>${bic ? `
      <DbtrAgt>
        <FinInstnId>
          <BICFI>${bic}</BICFI>
        </FinInstnId>
      </DbtrAgt>` : ''}${txns}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;

    shareOrDownload(xml, `SEPA_PROV_${sepaDate}_${nbTxs}transf.xml`, 'application/xml;charset=utf-8').then(res=>{
      if(res==='cancelled'||res==='failed'){notify(res==='failed'?'No se pudo generar el fichero':'Generación cancelada — nada registrado','error');return;}
      // Historial de remesas (solo descargas reales)
      const txList=sel.map(inv=>({n:inv.proveedor,imp:getSaldo(inv,invoices),c:`${inv.numFactura||'Pago'} - ${inv.concepto||''}`.slice(0,60),ib:((inv.ibanProveedor||getSupplierData(inv.proveedor).iban)||'').replace(/\s/g,'')}));
      logRemesa({tipo:'prov',fechaEjec:sepaDate,msgId,fichero:`SEPA_PROV_${sepaDate}_${nbTxs}transf.xml`,nbTxs,total:parseFloat(ctrlSum),txns:txList});
      anotarRemesa('remesa+',{msgId,fecha:today,nbTxs,total:parseFloat(ctrlSum)},'generada · pagos apuntados');
      setSubirBanco({fichero:`SEPA_PROV_${sepaDate}_${nbTxs}transf.xml`,n:nbTxs,total:parseFloat(ctrlSum),fecha:sepaDate});
      {   // v382 · siempre se apuntan: generar la remesa es decir «esto se paga»
        // v359 · nunca callar. Jesús (03-09-2026): remesó facturas que aún
        // constaban pagadas por otra remesa (la global de julio) y la app,
        // al verlas con saldo cero, no apuntó nada ni avisó. Ahora:
        //  · con «sustituir» (por defecto), el pago de la OTRA remesa se
        //    quita y se apunta el de esta: la última remesa manda;
        //  · sin «sustituir», se deja como está pero se dice cuáles se
        //    han saltado, en pantalla y en el histórico.
        const ids=new Set(sel.map(i=>i.id));
        const saltadas=[];const sustituidas=[];
        origenCambio.current='remesa SEPA';
        setInvoices(prev=>prev.map(inv=>{
          if(!ids.has(inv.id))return inv;
          let pagos=inv.pagos||[];
          const deOtraRemesa=pagos.filter(p=>/^BIOH-/.test(String(p.referencia||''))&&p.referencia!==msgId);
          if(sepaSustituir&&deOtraRemesa.length){pagos=pagos.filter(p=>!deOtraRemesa.includes(p));sustituidas.push(inv);}
          const saldo=getSaldo({...inv,pagos},prev);
          if(saldo<=0.01){saltadas.push(inv);return inv;}
          // v381 · se apunta lo que se ha TRANSFERIDO, que puede ser una parte;
          // el resto se queda pendiente y aparece en la siguiente remesa. Nunca
          // más de lo que se debe, aunque se hubiera escrito de más.
          const puesto=Math.min(impRemesa(inv),saldo);
          return {...inv,pagos:[...pagos,{id:uid(),fecha:sepaDate,importe:puesto,metodo:'Transferencia SEPA',referencia:msgId}]};
        }));
        const aviso=(saltadas.length?` · ⚠ ${saltadas.length} ya constaban pagadas: NO se ha apuntado pago (${saltadas.slice(0,3).map(i=>(i.proveedor||'')+' nº'+(i.numFactura||'s/n')).join(', ')}${saltadas.length>3?'…':''})`:'')+(sustituidas.length?` · ${sustituidas.length} con pago de otra remesa sustituido`:'');
        notify(`SEPA generado: ${nbTxs} transferencias, ${fmt(parseFloat(ctrlSum))} € — facturas marcadas como pagadas${aviso}`,saltadas.length?'error':'success');
        if(saltadas.length||sustituidas.length)anotarRemesa('remesa·aviso',{msgId,fecha:today,nbTxs,total:parseFloat(ctrlSum)},(saltadas.length?`${saltadas.length} sin apuntar (ya constaban pagadas): `+saltadas.map(i=>(i.proveedor||'')+' nº'+(i.numFactura||'s/n')).join(', '):'')+(sustituidas.length?` · ${sustituidas.length} con pago de otra remesa sustituido`:''));
      }
      setShowSepa(false);
      clearSelection();
    });
  };

  // ═══ EMPLOYEES & PAYROLL ═══
  // Abre la gestión del fichaje: quién está de alta y qué ha fichado
  const abrirFichaje=async()=>{
    if(!ES_APP||!window.bh10Fichaje){notify('El fichaje vive en la app de bh10group.com','error');return;}
    notify('Consultando…');
    try{
      const trabajadores=await window.bh10Fichaje.trabajadores();
      setFichajeGest({trabajadores,ver:null,regs:[],desde:'',hasta:''});
    }catch(e){notify('No se pudo consultar: '+((e&&e.code)||e),'error');}
  };
  const openNewEmp=()=>{if(soloLector())return;setEditingEmp(null);setEmpForm({embargos:[],embargo:'',embargoIban:'',embargoTitular:'',embargoConcepto:'',embargoImporte:'',nombre:'',nif:'',iban:'',bic:'',importeBase:'',direccion:'',cp:'',email:'',telefono:'',jornada:{...JORNADA_VACIA},activo:true});setShowEmpForm(true);};
  const openEditEmp=emp=>{if(soloLector())return;setEditingEmp(emp.id);setEmpForm({...emp,embargos:(l=>l.length===1&&emp.embargoLeido&&+emp.embargoLeido.imp>0&&!String(l[0].importe||'').trim()
      ?[{...l[0],importe:fmt(+emp.embargoLeido.imp)}]:l)(embargosDe(emp)),importeBase:(emp.importeBase||emp.importeBase===0)&&emp.importeBase!==''?fmt(parseNum(emp.importeBase)):'',jornada:{...JORNADA_VACIA,...(emp.jornada||{})}});setShowEmpForm(true);};
  const saveEmp=()=>{if(soloLector())return;
    if(!empForm.nombre||!empForm.iban){notify('Nombre e IBAN obligatorios','error');return;}
    const emp={...empForm,id:editingEmp||uid(),importeBase:parseNum(empForm.importeBase)||0};
    const updated=editingEmp?employees.map(e=>e.id===editingEmp?emp:e):[...employees,emp];
    saveEmployees(updated);setShowEmpForm(false);notify(editingEmp?'Empleado actualizado':'Empleado añadido');
  };
  const deleteEmp=id=>{if(soloLector())return;saveEmployees(employees.filter(e=>e.id!==id));notify('Empleado eliminado');};
  const toggleEmpActive=id=>{if(soloLector())return;const updated=employees.map(e=>e.id===id?{...e,activo:!e.activo}:e);saveEmployees(updated);};

  const openPayroll=()=>{if(soloLector())return;
    setEmbExcl({});setNomExcl({});
    setPayrollSoloPDF(false);
    const amts={};
    employees.filter(e=>e.activo).forEach(e=>{amts[e.id]=e.importeBase?fmt(parseNum(e.importeBase)):'';});
    setPayrollAmounts(amts);
    const now=new Date();
    const meses=['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
    setPayrollConcepto(`NOMINA ${meses[now.getMonth()]} ${now.getFullYear()}`);
    setPayrollDate(today);
    const ult=nominasMes&&nominasMes[0];
    if(ult&&Array.isArray(ult.items)&&ult.items.length){
      const pre={};listaSegura(ult&&ult.items).forEach(it=>{if(it.empId&&it.liq>0)pre[it.empId]=String(it.liq);});
      if(Object.keys(pre).length){
        setPayrollAmounts(pre);
        notify(`💶 Importes del último mes (${ult.per}) precargados — ajusta bajas, altas o cambios y genera`);
      }
    }
    setShowPayroll(true);
  };

  const generatePayroll=()=>{if(soloLector())return;if(sinAccion('remesar','generar la remesa de nóminas'))return;
    {
      const f=[];
      if(!String(compCfg.name||'').trim())f.push('nombre');
      if(!String(compCfg.cif||'').trim())f.push('CIF');
      if(!normIban(compCfg.iban||''))f.push('IBAN');
      if(f.length){notify(`Faltan datos de la empresa (${f.join(', ')}) — rellénalos en Ajustes → Datos de la empresa antes de generar el C34`,'error');return;}
    }

    if(!compCfg.name||!compCfg.iban){notify('Configura datos empresa en Config','error');return;}
    const active=employees.filter(e=>e.activo);
    const missing=active.filter(e=>!e.iban?.replace(/\s/g,''));
    if(missing.length){notify(`Falta IBAN: ${missing.map(e=>e.nombre).join(', ')}`,'error');return;}
    const malosNom=[];
    active.forEach(e=>{const p=problemaIban(e.iban||'');if(p)malosNom.push(`${e.nombre}: ${p}`);});
    if(malosNom.length){notify(`⛔ El banco rechazaría la remesa. Corrige el IBAN en la ficha:\n· ${malosNom.slice(0,4).join('\n· ')}`,'error');return;}
    
    const entries=active.filter(e=>!nomExcl[e.id]).map(e=>({...e,amount:parseNum(payrollAmounts[e.id])||0})).filter(e=>e.amount>0);
    if(!entries.length){notify('No hay importes','error');return;}
    
    // Embargos: los completos entran en la remesa; los cojos avisan y se quedan fuera
    const embTodos=transferenciasEmbargo(entries,embExcl);
    const embMal=embTodos.filter(x=>x.invalido), embCanc=embTodos.filter(x=>x.cancelado),
      embDesc=embTodos.filter(x=>x.descuadre),
      embOk=embTodos.filter(x=>!x.invalido&&!x.cancelado&&!x.descuadre);
    if(embDesc.length)notify('⚠️ Los embargos no cuadran con la nómina: '+embDesc.map(x=>x.nombre+' (diligencias '+fmt(x.suma)+' € / nómina '+fmt(x.leido)+' €)').join(' · ')+'. Revisa los importes antes de enviar.','error');
    if(embMal.length)notify('⚖️ Embargo SIN transferencia (faltan datos): '+embMal.map(x=>x.nombre+' — '+x.motivo).join(' · '),'error');
    if(embCanc.length)notify('⚖️ En la última nómina leída ya NO figura embargo ('+embCanc.map(x=>x.nombre+(x.periodo?' · '+x.periodo:'')).join(' · ')+'): se da por cancelado y no se transfiere. Cuando lo confirmes, borra la anotación de su ficha.');
    const nbTxs=entries.length+embOk.length;
    const ctrlSum=(entries.reduce((s,e)=>s+e.amount,0)+embOk.reduce((s,x)=>s+x.importe,0)).toFixed(2);
    const msgId=payrollConcepto.replace(/\s+/g,' ').trim();
    const msgIdSafe=sepaId(msgId.replace(/\s/g,'-'),35);
    const iban=compCfg.iban.replace(/\s/g,'');
    const bic=compCfg.bic.replace(/\s/g,'');
    const cif=(compCfg.cif||'').replace(/[^A-Z0-9]/gi,'')+'000';
    const now=new Date().toISOString().replace(/\.\d{3}Z$/,'')+'Z';

    let txns='';
    entries.forEach(e=>{
      const eIban=(e.iban||'').replace(/\s/g,'');
      const eBic=(e.bic||'').replace(/\s/g,'');
      txns+=`
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>NOTPROVIDED</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="EUR">${e.amount.toFixed(2)}</InstdAmt>
        </Amt>
        <ChrgBr>SLEV</ChrgBr>${eBic?`
        <CdtrAgt>
          <FinInstnId>
            <BICFI>${eBic}</BICFI>
          </FinInstnId>
        </CdtrAgt>`:''}
        <Cdtr>
          <Nm>${escXml(e.nombre.slice(0,70))}</Nm>${e.direccion||e.cp?`
          <PstlAdr>
            <Ctry>ES</Ctry>${e.direccion?`
            <AdrLine>${escXml(e.direccion)}</AdrLine>`:''}${e.cp?`
            <AdrLine>${escXml(e.cp)}</AdrLine>`:''}
          </PstlAdr>`:''}
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>${normIban(eIban)}</IBAN>
          </Id>
        </CdtrAcct>
      </CdtTrfTxInf>`;
    });
    embOk.forEach(x=>{
      txns+=`
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>NOTPROVIDED</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="EUR">${x.importe.toFixed(2)}</InstdAmt>
        </Amt>
        <ChrgBr>SLEV</ChrgBr>
        <Cdtr>
          <Nm>${escXml(x.beneficiario||('EMBARGO '+x.nombre).slice(0,70))}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>${x.iban}</IBAN>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>${escXml(x.concepto)}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>`;
    });
    if(embOk.length)notify('⚖️ '+embOk.length+' transferencia(s) de embargo añadida(s): '+embOk.map(x=>x.nombre+' '+fmt(x.importe)+' € (nómina '+(x.periodo||'—')+')').join(' · '));
    {const viejas=embOk.filter(x=>nominaVieja(x.periodo,payrollDate||today));
     if(viejas.length)notify('⚖️ OJO: la última nómina leída de '+viejas.map(x=>x.nombre+' es de '+x.periodo).join(' · ')+' — si estás pagando otro mes, pasa antes su PDF por el reparto','error');}

    const xml=`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${msgIdSafe}</MsgId>
      <CreDtTm>${now}</CreDtTm>
      <NbOfTxs>${nbTxs}</NbOfTxs>
      <CtrlSum>${ctrlSum}</CtrlSum>
      <InitgPty>
        <Nm>${escXml(compCfg.name.slice(0,70))}</Nm>${cif.length>3?`
        <Id>
          <OrgId>
            <Othr>
              <Id>${escXml(cif)}</Id>
            </Othr>
          </OrgId>
        </Id>`:''}
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${sepaId("SAL-"+msgIdSafe,35)}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <BtchBookg>true</BtchBookg>
      <NbOfTxs>${nbTxs}</NbOfTxs>
      <CtrlSum>${ctrlSum}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
        <CtgyPurp>
          <Cd>SALA</Cd>
        </CtgyPurp>
      </PmtTpInf>
      <ReqdExctnDt>
        <Dt>${payrollDate}</Dt>
      </ReqdExctnDt>
      <Dbtr>
        <Nm>${escXml(compCfg.name.slice(0,70))}</Nm>${compCfg.address||compCfg.city?`
        <PstlAdr>
          <Ctry>${compCfg.country||'ES'}</Ctry>${compCfg.address?`
          <AdrLine>${escXml(compCfg.address)}</AdrLine>`:''}${compCfg.city?`
          <AdrLine>${escXml(compCfg.city)}</AdrLine>`:''}
        </PstlAdr>`:''}
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${normIban(iban)}</IBAN>
        </Id>
      </DbtrAcct>${bic?`
      <DbtrAgt>
        <FinInstnId>
          <BICFI>${bic}</BICFI>
        </FinInstnId>
      </DbtrAgt>`:''}${txns}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;

    shareOrDownload(xml, `${msgId.replace(/\s/g,'_')}.xml`, 'application/xml;charset=utf-8').then(res=>{
      if(res==='cancelled'||res==='failed'){notify(res==='failed'?'No se pudo generar el fichero':'Generación cancelada — nada registrado','error');return;}
      const txList=entries.map(e=>({n:e.nombre,imp:e.amount,c:payrollConcepto,ib:(e.iban||'').replace(/\s/g,'')}));
      logRemesa({tipo:'nom',fechaEjec:payrollDate,msgId:msgIdSafe,fichero:`${msgId.replace(/\s/g,'_')}.xml`,nbTxs,total:parseFloat(ctrlSum),txns:txList});
      {
        const perR=String(payrollDate||today).slice(0,7);
        const prev=nominasMes.find(x=>x.per===perR);
        persistNominas([{per:perR,fecha:today,fuente:prev?'mixto':'remesa',items:mezclaMesNominas(prev&&prev.items,entries)},...nominasMes.filter(x=>x.per!==perR)]);
      }
      if(payrollRegister){
        const regs=entries.map(e=>({
          id:uid(),tipo:'personal',fecha:payrollDate,numFactura:'',
          proveedor:e.nombre,proveedorCif:'',proveedorDir:'',
          concepto:payrollConcepto,categoria:'Mano de obra',
          importeBase:e.amount,tipoIva:0,iva:0,irpf:0,retencion:0,total:e.amount,
          obra:payrollObras[e.id]||'',esEstructural:!(payrollObras[e.id]),
          fechaVencimiento:'',formaPago:'Transferencia',notas:'Nómina · remesa '+msgIdSafe,
          refPresupuesto:'',ibanProveedor:e.iban||'',
          pagos:[{id:uid(),fecha:payrollDate,importe:e.amount,metodo:'Transferencia SEPA',referencia:msgIdSafe}],
          aplicadoA:null,
        }));
        setInvoices(p=>[...p,...regs]);
        notify(`Nóminas: ${nbTxs} transferencias, ${fmt(parseFloat(ctrlSum))} € — coste registrado por obra`);
      }else{
        notify(`Nóminas: ${nbTxs} transferencias, ${fmt(parseFloat(ctrlSum))} €`);
      }
      logPayroll(payrollConcepto, parseFloat(ctrlSum), nbTxs);
      setShowPayroll(false);
    });
  };


  // Styles → moved to module level (S)
  // ═══ PANEL: colocación de las tarjetas ═══
  const persistKpis=(next)=>{setKpiCfg(next);window.storage.set('bh10-kpis',JSON.stringify(next)).catch(()=>{});};
  const kpiAncho=kpiCfg.ancho||{};
  // Orden efectivo: lo guardado primero, y detrás cualquier tarjeta nueva
  const kpiOrden=(()=>{const g=(kpiCfg.orden||[]).filter(x=>KPI_IDS.includes(x));return [...g,...KPI_IDS.filter(x=>!g.includes(x))];})();
  const ordenaKpis=(arr)=>arr.filter(Boolean).sort((a,b)=>kpiOrden.indexOf(a.id)-kpiOrden.indexOf(b.id));
  // Mueve una tarjeta saltando por encima de las que ahora no se ven
  const moverKpi=(id,dir,visibles)=>{
    const v=visibles.indexOf(id), destino=v+dir;
    if(v<0||destino<0||destino>=visibles.length)return;
    const full=[...kpiOrden];
    const a=full.indexOf(id), b=full.indexOf(visibles[destino]);
    if(a<0||b<0)return;
    full[a]=visibles[destino]; full[b]=id;
    persistKpis({...kpiCfg,orden:full});
  };
  const soltarKpi=(id,sobre)=>{
    if(!id||id===sobre)return;
    const full=kpiOrden.filter(x=>x!==id);
    const p=full.indexOf(sobre);
    full.splice(p<0?full.length:p,0,id);
    persistKpis({...kpiCfg,orden:full});
  };
  const anchoKpi=(id)=>(kpiAncho[id]==='full'?'1 1 100%':'1 1 calc(50% - 4px)');
  const alternaAncho=(id)=>persistKpis({...kpiCfg,ancho:{...kpiAncho,[id]:kpiAncho[id]==='full'?'half':'full'}});

  // Combobox → moved to module level

  // ═══ DASHBOARD ═══
  const Dashboard=()=>{

    const agingData=[{name:'0-30d',value:K.aging.a030},{name:'31-60d',value:K.aging.a3160},{name:'61-90d',value:K.aging.a6190},{name:'>90d',value:K.aging.a90}].filter(d=>d.value>0);
    return(
      <div style={{padding:10}}>
      {/* ── FILTRO DE PERIODO ── */}
      {(()=>{
        const now=new Date();
        const iso=d=>d.toISOString().slice(0,10);
        const setPreset=(f,t)=>{setDashFrom(f);setDashTo(t);};
        const y=now.getFullYear(),mth=now.getMonth();
        const chips=[
          ['Todo',()=>setPreset('','')],
          ['Este mes',()=>setPreset(iso(new Date(y,mth,1)),iso(new Date(y,mth+1,0)))],
          ['Trimestre',()=>{const q=Math.floor(mth/3);setPreset(iso(new Date(y,q*3,1)),iso(new Date(y,q*3+3,0)));}],
          ['Este año',()=>setPreset(y+'-01-01',y+'-12-31')],
          ['Año pasado',()=>setPreset((y-1)+'-01-01',(y-1)+'-12-31')],
        ];
        const activo=dashFrom||dashTo;
        return(
          <div style={{...S.card,marginBottom:10,padding:'9px 10px'}}>
            <div style={{fontSize:9,fontWeight:700,color:C.mt,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5}}>📅 Periodo</div>
            {/* Los cinco atajos reparten el ancho en una sola fila */}
            <div style={{display:'flex',gap:4,flexWrap:'nowrap'}}>
              {chips.map(([l,fn])=><button key={l} style={{...S.sm(C.in),flex:'1 1 0',minWidth:0,fontSize:10,padding:'6px 2px',minHeight:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}} onClick={fn}>{l}</button>)}
            </div>
            {/* Desde/Hasta con base 0: sin ancho mínimo no se solapan en pantalla estrecha */}
            <div style={{display:'flex',gap:6,marginTop:7,alignItems:'flex-end'}}>
              <label style={{flex:'1 1 0',minWidth:0}}><span style={{fontSize:9,color:C.mt}}>Desde</span><input type="date" style={{...S.input,padding:'5px 6px',minHeight:34,fontSize:12,width:'100%'}} value={dashFrom} onChange={e=>setDashFrom(e.target.value)}/></label>
              <label style={{flex:'1 1 0',minWidth:0}}><span style={{fontSize:9,color:C.mt}}>Hasta</span><input type="date" style={{...S.input,padding:'5px 6px',minHeight:34,fontSize:12,width:'100%'}} value={dashTo} onChange={e=>setDashTo(e.target.value)}/></label>
              {activo&&<button style={{...S.sm(C.mt),flexShrink:0,padding:'6px 9px',fontSize:11,minHeight:34}} onClick={()=>setPreset('','')}>✕</button>}
            </div>
            {activo&&<div style={{fontSize:10,color:C.sc,marginTop:6,fontWeight:600}}>Mostrando datos {dashFrom?'desde '+fmtDate(dashFrom):''} {dashTo?'hasta '+fmtDate(dashTo):''}</div>}
          </div>
        );
      })()}

      {invoices.length===0&&<div style={{...S.card,marginBottom:10,textAlign:'center',color:C.mt,fontSize:12,padding:'14px'}}>Aún no hay operaciones — entra en 📥 Recibidas o 📤 Emitidas para registrar la primera</div>}




        {/* ── INDICADORES: el usuario elige orden y ancho ── */}
        {(()=>{
          const cat=obras.filter(o=>o.activa!==false);
          const totalPptoG=cat.reduce((s,o)=>s+(+o.presupuestoGasto||0),0);
          const totalPptoV=cat.reduce((s,o)=>s+(+o.presupuestoVenta||0),0);
          const gastadoObras=K.gastos.filter(i=>i.obra&&cat.some(o=>obraDisplay(o)===i.obra)).reduce((s,i)=>s+i.total,0);
          const facturadoObras=K.cobros.filter(i=>i.obra&&cat.some(o=>obraDisplay(o)===i.obra)).reduce((s,i)=>s+i.total,0);
          const detalleGasto=cat.map(o=>{const disp=obraDisplay(o);return{obra:o,disp,ppto:+o.presupuestoGasto||0,real:K.gastos.filter(i=>i.obra===disp).reduce((s,i)=>s+i.total,0)};}).filter(x=>x.ppto>0||x.real>0);
          const detalleVenta=cat.map(o=>{const disp=obraDisplay(o);return{obra:o,disp,ppto:+o.presupuestoVenta||0,real:K.cobros.filter(i=>i.obra===disp).reduce((s,i)=>s+i.total,0)};}).filter(x=>x.ppto>0||x.real>0);
          const retG=invoices.filter(i=>i.tipo==='cobro'&&(i.retGarImp||0)>0&&!i.retGarDevuelta);
          const retGTot=retG.reduce((s,i)=>s+i.retGarImp,0);
          const ivaLiq=K.totalIvaRepercutido-K.totalIva;

          // Cada entrada: {id, props}. Se ordenan y luego se pintan.
          // Cabecera: saldo real de proveedores (sin filtrar por periodo)
          const impPend=recibidas.filter(i=>i.tipo!=='anticipo'&&!['pagada','aplicado','anticipo_libre'].includes(getEstado(i,invoices)));
          const heroPend=impPend.reduce((s,i)=>s+Math.max(getSaldo(i,invoices),0),0);
          const heroVenc=impPend.filter(i=>['vencida','parcial_vencida'].includes(getEstado(i,invoices))).reduce((s,i)=>s+Math.max(getSaldo(i,invoices),0),0);
          const flotaAl=flota.filter(v=>v.activa!==false).flatMap(v=>[v.itv,v.seguroVto,v.mantFecha]).map(daysTo).filter(d=>d!==null&&d<=30).length+polizas.filter(p=>p.activa!==false).map(p=>daysTo(p.vto)).filter(d=>d!==null&&d<=30).length;

          const defs=ordenaKpis([
            {id:'h-pendpago',p:{label:'PENDIENTE DE PAGO',value:fmt(heroPend)+' €',color:heroPend>0.01?C.wn:C.sc,sub:'tocar para ver',onClick:()=>{setView('facturas');setSubView('recibidas');setFEstado('impagada');}}},
            {id:'h-vencido',p:{label:'VENCIDO',value:fmt(heroVenc)+' €',color:heroVenc>0.01?C.dn:C.sc,sub:'tocar para ver',onClick:()=>{setView('facturas');setSubView('recibidas');setFEstado('vencida');}}},
            // v375 · el buzón, solo para el dueño: ni siquiera se le ofrece la
            // caseta a un miembro, así no le ocupa sitio en su panel.
            // v376 · Jesús: «me gustaría verlo siempre para que tenga su lugar fijo
            // en el panel». Antes aparecía y desaparecía según hubiera algo, y una
            // caseta que se mueve de sitio sola no sirve para acostumbrarse a ella.
            // Ahora está siempre para el dueño; cuando no hay nada, en gris y con
            // «sin novedades».
            ...(!esMiembro()?[{id:'n-buzon',p:{tipo:'cont',label:'📥 Buzón',
              value:buzonTodo.total,color:buzonTodo.urgente>0?C.dn:(buzonTodo.total>0?C.wn:C.mt),
              sub:buzonTodo.total===0?'sin novedades'
                :[buzonTodo.firmas&&`${buzonTodo.firmas} firmados`,buzonTodo.clientes&&`${buzonTodo.clientes} de clientes`,
                   buzonTodo.proveedores&&`${buzonTodo.proveedores} de proveedores`,buzonTodo.derechos&&`${buzonTodo.derechos} derechos`]
                   .filter(Boolean).join(' · '),
              onClick:()=>setBuzonAbierto(true)}}]:[]),
            {id:'n-recibidas',p:{tipo:'cont',label:'📥 Recibidas',value:recibidas.length,color:C.in,onClick:()=>{setView('facturas');setSubView('recibidas');}}},
            {id:'n-emitidas',p:{tipo:'cont',label:'📤 Emitidas',value:emitidas.length,color:C.in,onClick:()=>{setView('facturas');setSubView('emitidas');}}},
            {id:'n-clientes',p:{tipo:'cont',label:'👤 Clientes',value:clientes.length,color:C.in,onClick:()=>{setView('facturas');setSubView('clientes');}}},
            {id:'n-proveedores',p:{tipo:'cont',label:'🏪 Proveedores',value:proveedores.length,color:C.in,onClick:()=>{setView('facturas');setSubView('proveedores');}}},
            {id:'n-obras',p:{tipo:'cont',label:'🏗️ Obras',value:obrasAll.length,color:C.in,onClick:()=>{setView('contratos');setConView('obras');}}},
            {id:'n-contratos',p:{tipo:'cont',label:'📑 Contratos',value:contratos.length,color:C.in,onClick:()=>setView('contratos')}},
            {id:'n-c34prov',p:{tipo:'cont',label:'🏦 C34 Proveedores',value:remesas.filter(r=>r.tipo==='prov').length,color:C.in,onClick:()=>{setView('facturas');setSubView('remesas');}}},
            {id:'n-traspasos',p:{tipo:'cont',label:'🏢 Traspasos',value:traspasos.length,color:C.in,onClick:()=>setTraspModal('lista')}},
            {id:'n-c34nom',p:{tipo:'cont',label:'👷 C34 Nóminas',value:remesas.filter(r=>r.tipo==='nom').length,color:C.in,onClick:()=>{setView('nominas');setNomView('remesas');}}},
            {id:'n-personal',p:{tipo:'cont',label:'👷 Personal',value:employees.filter(em=>em.activo!==false).length,color:C.in,onClick:()=>setView('nominas')}},
            {id:'n-flota',p:{tipo:'cont',label:'🛡️ Seguros'+(flotaAl>0?' ⚠':''),value:(polizas||[]).filter(p=>p&&p.activa!==false).length,color:flotaAl>0?C.wn:C.in,onClick:()=>setView('flota')}},
            (K.totalIngresos>0||K.totalFact>0)&&{id:'balance',p:{label:'Balance',value:(K.totalIngresos-K.totalFact>=0?'+':'')+fmtK(K.totalIngresos-K.totalFact)+' €',color:K.totalIngresos>=K.totalFact?C.sc:C.dn,sub:'Ingresos − Gastos'}},
            {id:'facturado',p:{label:'Total facturado',value:fmtK(K.totalFact)+' €',sub:`${K.gastos.length} facturas · toca para ver`,onClick:()=>setKpiDetail({title:'Gastos del periodo',list:K.gastos})}},
            {id:'pagado',p:{label:'Pagado',value:fmtK(K.totalPagado)+' €',color:C.sc,sub:`${pct(K.totalPagado,K.totalFact)}% del total`,onClick:()=>setKpiDetail({title:'Facturas con pagos',list:K.gastos.filter(i=>getTotalPagado(i,invoices)>0)})}},
            {id:'pendiente',p:{label:'Pendiente de pago',value:fmtK(K.totalPendiente)+' €',color:K.totalPendiente>0?C.wn:C.sc,onClick:()=>setKpiDetail({title:'Pendientes de pago',list:K.gastos.filter(i=>{const e=getEstado(i,invoices);return e!=='pagada'&&getSaldo(i,invoices)>0.01;})})}},
            {id:'vencido',p:{label:'Vencido impagado',value:fmtK(K.totalVencido)+' €',color:K.totalVencido>0?C.dn:C.sc,sub:K.totalVencido>0?'⚠ Requiere atención':'OK',onClick:()=>setKpiDetail({title:'Vencidas impagadas',list:K.gastos.filter(i=>{const e=getEstado(i,invoices);return e==='vencida'||e==='parcial_vencida';})})}},
            K.totalIngresos>0&&{id:'ingresos',p:{label:'Ingresos emitidos',value:fmtK(K.totalIngresos)+' €',color:C.sc,sub:`Cobrado: ${fmtK(K.totalCobrado)} €`,onClick:()=>setKpiDetail({title:'Facturas emitidas',list:K.cobros})}},
            K.totalPteCobro>0&&{id:'ptecobro',p:{label:'Pendiente de cobro',value:fmtK(K.totalPteCobro)+' €',color:'#F97316',sub:'Facturas emitidas sin cobrar',onClick:()=>setKpiDetail({title:'Pendientes de cobro',list:K.cobros.filter(i=>getSaldo(i,invoices)>0.01)})}},
            {id:'ivasop',p:{label:'IVA soportado',value:fmtK(K.totalIva)+' €',color:C.in,sub:'Facturas recibidas',onClick:()=>setKpiDetail({title:'Facturas con IVA soportado',list:K.gastos.filter(i=>(i.iva||0)>0)})}},
            K.totalIvaRepercutido>0&&{id:'ivarep',p:{label:'IVA repercutido',value:fmtK(K.totalIvaRepercutido)+' €',color:C.sc,sub:'Facturas emitidas',onClick:()=>setKpiDetail({title:'Facturas con IVA repercutido',list:K.cobros.filter(i=>(i.iva||0)>0)})}},
            (K.totalIva>0||K.totalIvaRepercutido>0)&&{id:'ivaliq',p:{label:'Liquidación IVA',value:(ivaLiq>=0?'+':'')+fmtK(ivaLiq)+' €',color:ivaLiq>0?C.dn:C.sc,sub:ivaLiq>0?'A ingresar (Mod. 303)':'A compensar',onClick:()=>setKpiDetail({title:'Liquidación IVA — repercutido y soportado',list:[...K.cobros,...K.gastos].filter(i=>(i.iva||0)>0)})}},
            {id:'estructura',p:{label:'Gastos estructura /mes',value:fmtK(K.totalEstructuraMes)+' €',color:C.vt,sub:`${fmtK(K.totalEstructura)} € acum.`,onClick:()=>setKpiDetail({title:'Gastos de estructura',list:K.gastos.filter(i=>i.esEstructural||i.tipo==='estructura')})}},
            K.totalAnticiposLibres>0&&{id:'anticipos',p:{label:'Anticipos sin aplicar',value:fmtK(K.totalAnticiposLibres)+' €',color:C.ch[4],sub:`${anticiposLibres.length} pendientes de factura`}},
            retG.length>0&&{id:'retgar',p:{label:'Ret. garantía pendiente',value:fmtK(retGTot)+' €',color:C.vt,sub:`${retG.length} certificación${retG.length!==1?'es':''} · toca para ver`,onClick:()=>setKpiDetail({title:'Retenciones de garantía pendientes de devolución',list:retG})}},
            {id:'diaspago',p:{label:'Días medio pago',value:K.avgDias||'—',color:C.ch[7]}},
            totalPptoG>0&&{id:'ejecgasto',p:{label:'Ejecución gasto',value:pct(gastadoObras,totalPptoG)+'%',color:gastadoObras>totalPptoG?C.dn:gastadoObras>totalPptoG*0.85?C.wn:C.sc,sub:`${fmtK(gastadoObras)} € / ${fmtK(totalPptoG)} €`,onClick:()=>setKpiDetail({title:'Ejecución de gasto por obra',mode:'budget',rows:detalleGasto,kind:'gasto'})}},
            totalPptoV>0&&{id:'ejecventa',p:{label:'Ejecución venta',value:pct(facturadoObras,totalPptoV)+'%',color:facturadoObras>=totalPptoV?C.sc:facturadoObras>=totalPptoV*0.5?C.in:C.wn,sub:`${fmtK(facturadoObras)} € / ${fmtK(totalPptoV)} €`,onClick:()=>setKpiDetail({title:'Ejecución de venta por obra',mode:'budget',rows:detalleVenta,kind:'venta'})}},
            K.lastYearGastos>0&&{id:'yoy',p:{label:'Variación interanual',value:(K.yoyChange>=0?'+':'')+K.yoyChange+'%',color:K.yoyChange>10?C.dn:K.yoyChange<-5?C.sc:C.wn,sub:`${fmtK(K.thisYearGastos)} € vs ${fmtK(K.lastYearGastos)} € año ant.`}},
          ]);
          const visibles=defs.map(d=>d.id);
          return(<>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:6,margin:'2px 2px 6px'}}>
              <span style={{fontSize:10,fontWeight:700,color:C.mt,textTransform:'uppercase',letterSpacing:'.06em'}}>📊 Panel · {defs.length} casetas</span>
              <span style={{display:'flex',gap:6}}>
                {kpiEdit&&<BtnConfirm style={{...S.sm(C.mt),padding:'4px 9px',fontSize:10,minHeight:0}} armStyle={{opacity:.85}} armedLabel="¿Restablecer? Toca otra vez" onConfirm={()=>{persistKpis({orden:[],ancho:{}});notify('Panel restablecido');}}>↺ Restablecer</BtnConfirm>}
                <button style={{...S.sm(kpiEdit?C.sc:C.in),padding:'4px 10px',fontSize:10,minHeight:0}} onClick={()=>setKpiEdit(v=>!v)}>{kpiEdit?'✓ Hecho':'✥ Colocar'}</button>
              </span>
            </div>
            {kpiEdit&&<div style={{fontSize:10,color:C.mt,margin:'0 2px 6px',lineHeight:1.4}}>Todas las casetas se pueden mover: arrástralas (o usa ◀ ▶) y pulsa ▭/◨ para ancho completo o media pantalla. Se guarda en tu nube.</div>}
            <div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'stretch'}}>
              {defs.map(d=><KPI key={d.id} id={d.id} visibles={visibles} edit={kpiEdit} ancho={kpiAncho[d.id]} arrastrando={kpiDrag} onArrastrar={setKpiDrag} onSoltar={(sobre)=>{soltarKpi(kpiDrag,sobre);setKpiDrag(null);}} onMover={moverKpi} onAncho={alternaAncho} {...d.p}/>)}
            </div>
          </>);
        })()}

        {/* ── ALERTAS VENCIMIENTO ── */}
        {(()=>{
          const prox=invoices.filter(i=>{const e=getEstado(i,invoices);if(e==='pagada'||i.tipo==='anticipo')return false;
            const vto=i.fechaVencimiento;if(!vto)return false;const d=daysBetween(today,vto);return d>=0&&d<=7;});
          const vencidas=invoices.filter(i=>{const e=getEstado(i,invoices);return e==='vencida'||e==='parcial_vencida';});
          if(!prox.length&&!vencidas.length)return null;
          return(
            <div style={{...S.card,marginTop:10,borderColor:C.dn+'66',background:C.dn+'08'}}>
              <div style={{fontSize:11,fontWeight:700,color:C.dn,marginBottom:6}}>⚠ ALERTAS DE VENCIMIENTO</div>
              {vencidas.length>0&&<div style={{fontSize:11,color:C.dn,marginBottom:4}}>🔴 {vencidas.length} factura{vencidas.length>1?'s':''} vencida{vencidas.length>1?'s':''} ({fmt(vencidas.reduce((s,i)=>s+getSaldo(i,invoices),0))} €)</div>}
              {prox.length>0&&<div style={{fontSize:11,color:C.wn}}>🟡 {prox.length} vence{prox.length>1?'n':''} en los próximos 7 días ({fmt(prox.reduce((s,i)=>s+getSaldo(i,invoices),0))} €)</div>}
              <div style={{marginTop:6,maxHeight:100,overflowY:'auto'}}>
                {/* Una factura vencida hoy cae en las dos listas: sin quitar
                    repetidas, React descarta filas por clave duplicada. */}
                {Array.from(new Map([...vencidas,...prox].map(i=>[i.id,i])).values()).slice(0,8).map(i=>(
                  <div key={i.id} style={{fontSize:10,padding:'2px 0',color:C.mt,display:'flex',justifyContent:'space-between'}}>
                    <span>{i.proveedor} · {i.numFactura||'s/n'}</span>
                    <span style={{fontWeight:600}}>{fmt(getSaldo(i,invoices))} € · {fmtDate(i.fechaVencimiento)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── ALERTA DE FLOTA Y SEGUROS (justo encima del resumen fiscal) ── */}
        {(()=>{
          const alV=flota.filter(v=>v.activa!==false).flatMap(v=>[['ITV',v.itv],['Seguro',v.seguroVto],['Mant.',v.mantFecha]].map(([l,d])=>({n:v.alias||v.matricula,l,dy:daysTo(d)})).filter(x=>x.dy!==null&&x.dy<=30));
          const alP=polizas.filter(p=>p.activa!==false).map(p=>({n:(p.tipo||'Póliza')+(p.empresa&&p.empresa!=='BIG'?' · '+p.empresa:''),l:'Póliza',dy:daysTo(p.vto)})).filter(x=>x.dy!==null&&x.dy<=30);
          const al=[...alV,...alP];
          if(!al.length)return null;
          al.sort((a,b)=>a.dy-b.dy);
          return(
            <div style={{...S.card,marginBottom:8,border:`1px solid ${al[0].dy<0?C.dn:C.wn}66`,cursor:'pointer'}} onClick={()=>setView('flota')}>
              <div style={{fontSize:11,fontWeight:700,color:al[0].dy<0?C.dn:C.wn,marginBottom:4}}>🚛 FLOTA Y SEGUROS — {al.length} VENCIMIENTO{al.length!==1?'S':''} PRÓXIMO{al.length!==1?'S':''}</div>
              {al.slice(0,3).map((x,i)=><div key={i} style={{fontSize:12,display:'flex',justifyContent:'space-between'}}><span>{x.l} · {x.n}</span><b style={{color:vencColor(x.dy,C)}}>{vencTxt(x.dy)}</b></div>)}
              {al.length>3&&<div style={{fontSize:10,color:C.mt,marginTop:2}}>y {al.length-3} más — toca para ver</div>}
            </div>
          );
        })()}

        {/* ── RESUMEN FISCAL TRIMESTRAL ── */}
        {(()=>{
          const qNames=['T1 (Ene-Mar)','T2 (Abr-Jun)','T3 (Jul-Sep)','T4 (Oct-Dic)'];
          const inQ=i=>{const d=new Date(i.fecha);return Math.floor(d.getMonth()/3)===fq&&d.getFullYear()===fy;};
          const qGastos=invoices.filter(i=>inQ(i)&&i.tipo!=='anticipo'&&i.tipo!=='cobro'&&i.tipo!=='personal'&&!esAnulada(i));
          const qCobros=invoices.filter(i=>inQ(i)&&i.tipo==='cobro'&&!esAnulada(i));
          const prevQ=()=>{if(fq===0){setFq(3);setFy(fy-1);}else setFq(fq-1);};
          const nextQ=()=>{if(fq===3){setFq(0);setFy(fy+1);}else setFq(fq+1);};
          const porTipo=(list)=>{const m={};list.forEach(i=>{const t=i.tipoIva??21;if(!m[t])m[t]={base:0,iva:0};m[t].base+=i.importeBase||0;m[t].iva+=i.iva||0;});return Object.entries(m).sort((a,b)=>(+b[0])-(+a[0]));};
          const sopT=porTipo(qGastos.filter(i=>(i.iva||0)>0)), repT=porTipo(qCobros.filter(i=>(i.iva||0)>0));
          const ivaSop=qGastos.reduce((s,i)=>s+(i.iva||0),0), ivaRep=qCobros.reduce((s,i)=>s+(i.iva||0),0);
          const liq=+(ivaRep-ivaSop).toFixed(2);
          const isp=qCobros.filter(i=>(i.iva||0)===0&&(i.importeBase||0)>0).reduce((s,i)=>s+i.importeBase,0);
          const ret111=qGastos.filter(i=>(i.retencion||0)>0);
          const percep=[...new Set(ret111.map(i=>i.proveedorCif||i.proveedor))];
          const ret111Base=ret111.reduce((s,i)=>s+(i.importeBase||0),0), ret111Imp=ret111.reduce((s,i)=>s+(i.retencion||0),0);
          const retGarQ=qCobros.reduce((s,i)=>s+(i.retGarImp||0),0);
          const csv303Trim=()=>{
            if(!qGastos.length&&!qCobros.length){notify('Sin operaciones en el trimestre','error');return;}
            const r=resumen303({emitidas:qCobros,recibidas:qGastos,parseNum});
            shareOrDownload('\ufeff'+csv303(r,{empresa:compCfg.name||marcaDoc(),cif:compCfg.cif||'',trimestre:fq+1,anio:fy}),
              `Borrador303_${fy}_T${fq+1}_${(compCfg.cif||'empresa')}.csv`,'text/csv;charset=utf-8');
            if(r.avisos.length)notify('⚠ El borrador lleva '+r.avisos.length+' aviso'+(r.avisos.length>1?'s':'')+' de descuadre para Reme','error');
          };
          const csvGestoria=()=>{
            if(!qGastos.length&&!qCobros.length){notify('Sin operaciones en el trimestre','error');return;}
            const h='Registro;Fecha;Num;Tercero;CIF;Obra;Concepto;Base;PctIVA;IVA;PctIRPF;RetIRPF;RetGarantia;Total';
            const row=(i,reg)=>[reg,i.fecha,i.numFactura,i.proveedor,i.proveedorCif||'',i.obra||'',String(i.concepto||'').replace(/;/g,',').slice(0,60),(i.importeBase||0).toFixed(2),i.tipoIva??'',(i.iva||0).toFixed(2),i.irpf??'',(i.retencion||0).toFixed(2),(i.retGarImp||0).toFixed(2),i.total.toFixed(2)].join(';');
            const csv=[h,...qGastos.map(i=>row(i,'RECIBIDA')),...qCobros.map(i=>row(i,'EMITIDA'))].join('\n');
            shareOrDownload(csv,`Fiscal_${fy}_T${fq+1}_gestoria.csv`,'text/csv;charset=utf-8');
          };
          const csv190=()=>{
            const yr=invoices.filter(i=>{const d=new Date(i.fecha);return d.getFullYear()===fy&&i.tipo!=='cobro'&&i.tipo!=='anticipo'&&i.tipo!=='personal'&&(i.retencion||0)>0;});
            if(!yr.length){notify('Sin retenciones IRPF practicadas en '+fy,'error');return;}
            const m={};yr.forEach(i=>{const k=i.proveedorCif||i.proveedor;if(!m[k])m[k]={nombre:i.proveedor,cif:i.proveedorCif||'',base:0,ret:0,n:0};m[k].base+=i.importeBase||0;m[k].ret+=i.retencion||0;m[k].n++;});
            const csv=['CIF;Perceptor;NumFacturas;Base;RetencionIRPF',...Object.values(m).map(p=>[p.cif,p.nombre,p.n,p.base.toFixed(2),p.ret.toFixed(2)].join(';'))].join('\n');
            shareOrDownload(csv,`Mod190_${fy}_perceptores.csv`,'text/csv;charset=utf-8');
          };
          return(
            <div style={{...S.card,marginTop:10}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8,flexWrap:'wrap',gap:6}}>
                <div style={{fontSize:11,fontWeight:700,color:C.mt,textTransform:'uppercase',letterSpacing:'.04em'}}>📋 Resumen fiscal</div>
                <div style={{display:'flex',gap:4,alignItems:'center'}}>
                  <button style={S.sm(C.mt)} onClick={prevQ}>‹</button>
                  <span style={{fontSize:12,fontWeight:700,minWidth:112,textAlign:'center'}}>{qNames[fq]} {fy}</span>
                  <button style={S.sm(C.mt)} onClick={nextQ}>›</button>
                </div>
              </div>
              {(!qGastos.length&&!qCobros.length)?<div style={{textAlign:'center',color:C.mt,padding:12,fontSize:12}}>Sin operaciones en este trimestre</div>:<>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:8}}>
                <div style={{background:C.bg+'88',borderRadius:8,padding:'8px 10px'}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.sc,marginBottom:4}}>IVA REPERCUTIDO (emitidas)</div>
                  {repT.length===0?<div style={{fontSize:11,color:C.mt}}>—</div>:repT.map(([t,v])=><div key={t} style={{display:'flex',justifyContent:'space-between',fontSize:11}}><span style={{color:C.mt}}>Base {t}%: {fmt(v.base)} €</span><b>{fmt(v.iva)} €</b></div>)}
                  {isp>0&&<div style={{fontSize:10,color:C.vt,marginTop:4}}>ISP art. 84.Uno.2.f: {fmt(isp)} € (sin IVA)</div>}
                </div>
                <div style={{background:C.bg+'88',borderRadius:8,padding:'8px 10px'}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.in,marginBottom:4}}>IVA SOPORTADO (recibidas)</div>
                  {sopT.length===0?<div style={{fontSize:11,color:C.mt}}>—</div>:sopT.map(([t,v])=><div key={t} style={{display:'flex',justifyContent:'space-between',fontSize:11}}><span style={{color:C.mt}}>Base {t}%: {fmt(v.base)} €</span><b>{fmt(v.iva)} €</b></div>)}
                </div>
                <div style={{background:(liq>0?C.dn:C.sc)+'15',borderRadius:8,padding:'8px 10px',border:`1px solid ${liq>0?C.dn:C.sc}33`}}>
                  <div style={{fontSize:10,fontWeight:700,color:liq>0?C.dn:C.sc,marginBottom:4}}>MOD. 303 — RESULTADO</div>
                  <div style={{fontSize:18,fontWeight:800,color:liq>0?C.dn:C.sc}}>{liq>0?'+':''}{fmt(liq)} €</div>
                  <div style={{fontSize:10,color:C.mt}}>{liq>0?'A ingresar':'A compensar / devolver'}</div>
                </div>
                <div style={{background:C.bg+'88',borderRadius:8,padding:'8px 10px'}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.wn,marginBottom:4}}>MOD. 111 — IRPF PROFESIONALES</div>
                  {ret111.length===0?<div style={{fontSize:11,color:C.mt}}>Sin retenciones practicadas</div>:<div style={{display:'flex',justifyContent:'space-between',fontSize:11}}><span style={{color:C.mt}}>{percep.length} percept. · base {fmt(ret111Base)} €</span><b>{fmt(ret111Imp)} €</b></div>}
                  {(()=>{const perQ=(nominasMes||[]).filter(x=>{const p=String(x.per||'').split('-');const y=+p[0],m=+p[1];return y===fy&&Math.floor((m-1)/3)===fq;});const irT=perQ.reduce((s,x)=>s+(x.items||[]).reduce((a,i)=>a+(+i.irC||0),0),0);const nT=perQ.reduce((s,x)=>s+(x.items||[]).length,0);return irT>0?<div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginTop:4}}><span style={{color:C.mt}}>Trabajo (nóminas) · {nT} percep.</span><b>{fmt(irT)} €</b></div>:null;})()}
                  {retGarQ>0&&<div style={{fontSize:10,color:C.vt,marginTop:4}}>🛡️ Garantía retenida por clientes: {fmt(retGarQ)} €</div>}
                </div>
              </div>
              {/* Los tres botones reparten el ancho en una única fila */}
              <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'nowrap'}}>
                <button style={{...S.sm(C.sc),flex:'1 1 0',minWidth:0,padding:'8px 4px',fontSize:11,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}} title={`Borrador del modelo 303 · T${fq+1} ${fy} · con ISP y casillas, para cotejo de la gestoría`} onClick={csv303Trim}>📄 303</button>
                <button style={{...S.sm(C.in),flex:'1 1 0',minWidth:0,padding:'8px 4px',fontSize:11,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}} title="CSV del trimestre para la gestoría" onClick={csvGestoria}>⬇ CSV trimestre</button>
                <button style={{...S.sm(C.wn),flex:'1 1 0',minWidth:0,padding:'8px 4px',fontSize:11,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}} title={`Modelo 190 · perceptores ${fy}`} onClick={csv190}>⬇ Mod. 190 {fy}</button>
                {ES_APP&&<button style={{...S.sm(C.ac),flex:'1 1 0',minWidth:0,padding:'8px 4px',fontSize:11,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',opacity:pkBusy?0.6:1}} disabled={pkBusy} title="Paquete ZIP para enviar a la gestoría" onClick={()=>setPkPeriodo({clave:'mesant',trim:null})}>{pkBusy?'⏳ …':'📦 Envío gestoría'}</button>}
              </div>
              <div style={{fontSize:9,color:C.mt,marginTop:6}}>Orientativo — revisa con tu gestoría antes de presentar.</div>
              </>}
            </div>
          );
        })()}

        {/* ── CASH FLOW PRÓXIMAS 4 SEMANAS ── */}
        {(()=>{
          const weeks=[];
          for(let w=0;w<4;w++){
            const ws=new Date();ws.setDate(ws.getDate()+w*7);
            const we=new Date(ws);we.setDate(we.getDate()+7);
            const due=invoices.filter(i=>{if(getEstado(i,invoices)==='pagada'||i.tipo==='anticipo')return false;
              const vto=i.fechaVencimiento?new Date(i.fechaVencimiento):null;return vto&&vto>=ws&&vto<we;
            }).reduce((s,i)=>s+getSaldo(i,invoices),0);
            weeks.push({name:`Sem ${w+1}`,salidas:due});
          }
          if(weeks.every(w=>w.salidas===0))return null;
          return(
            <ChartBox title="Tesorería — Pagos próximas 4 semanas" h={140}>
              <ResponsiveContainer><BarChart data={weeks} margin={{top:5,right:5,bottom:5,left:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.bd+'44'}/>
                <XAxis dataKey="name" tick={{fill:C.mt,fontSize:10}}/>
                <YAxis tick={{fill:C.mt,fontSize:9}} tickFormatter={fmtK} width={42}/>
                <Tooltip content={<Tip/>}/>
                <Bar dataKey="salidas" name="Pagos previstos" fill={C.dn} radius={[3,3,0,0]}/>
              </BarChart></ResponsiveContainer>
            </ChartBox>
          );
        })()}

        {K.mensual.length>1&&<ChartBox title="Gastos vs Ingresos mensual"><ResponsiveContainer><BarChart data={K.mensual} margin={{top:5,right:5,bottom:5,left:0}}><CartesianGrid strokeDasharray="3 3" stroke={C.bd+'44'}/><XAxis dataKey="mes" tick={{fill:C.mt,fontSize:9}} tickFormatter={v=>{const m=+v.split('-')[1];return['E','F','M','A','My','Jn','Jl','Ag','S','O','N','D'][m-1];}}/><YAxis tick={{fill:C.mt,fontSize:9}} tickFormatter={fmtK} width={42}/><Tooltip content={<Tip/>}/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="gastos" name="Gastos" fill={C.dn+'aa'} radius={[3,3,0,0]}/><Bar dataKey="ingresos" name="Ingresos" fill={C.sc} radius={[3,3,0,0]}/><Bar dataKey="pagado" name="Pagado" fill={C.in+'88'} radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></ChartBox>}

        {agingData.length>0&&<ChartBox title="Antigüedad de deuda" h={170}><ResponsiveContainer><PieChart><Pie data={agingData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={2}>{agingData.map((e,i)=><Cell key={i} fill={[C.sc,C.wn,'#F97316',C.dn][['0-30d','31-60d','61-90d','>90d'].indexOf(e.name)]}/>)}</Pie><Tooltip formatter={v=>fmt(v)+' €'} contentStyle={{background:C.sf,border:`1px solid ${C.bd}`,borderRadius:8,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/></PieChart></ResponsiveContainer></ChartBox>}

        {(K.topProv.length>0||K.topObras.length>0)&&<div style={{fontSize:10,fontWeight:700,color:C.mt,textTransform:'uppercase',letterSpacing:'.06em',margin:'4px 2px 8px'}}>📈 Análisis del periodo</div>}
        {(()=>{
          const res=resumenPrecios(invoices,{desde:dashFrom||undefined,hasta:dashTo||undefined,proveedor:precioFiltro.prov||undefined});
          // Facturas con documento en el archivo pero sin desglose de líneas:
          // son las candidatas a la relectura que alimenta este panel.
          const sinLeer=ES_APP?invoices.filter(i=>i.tipo!=='cobro'&&i.adjPath&&typeof i.adjPath==='string'&&!(i.lineas||[]).length&&!i._sinDetalle).length:0;
          if(!res.materiales&&!sinLeer&&!detalleScan)return null;
          const orden=precioFiltro.orden;
          let filas=[...res.filas];
          if(orden==='sube')filas=filas.filter(f=>f.pct>0).sort((a,b)=>b.pct-a.pct);
          else if(orden==='baja')filas=filas.filter(f=>f.pct<0).sort((a,b)=>a.pct-b.pct);
          else filas=filas.sort((a,b)=>(b.historia.reduce((s,h)=>s+(h.imp||0),0))-(a.historia.reduce((s,h)=>s+(h.imp||0),0)));
          const visibles=filas.slice(0,12);
          const provs=[...new Set(invoices.filter(i=>i&&(i.lineas||[]).length).map(i=>i.proveedor))].sort();
          const chip=(k,l)=>(
            <button key={k} onClick={()=>setPrecioFiltro(f=>({...f,orden:k}))} style={{padding:'5px 11px',borderRadius:14,border:`1px solid ${orden===k?C.in:C.bd}`,background:orden===k?C.in+'22':'transparent',color:orden===k?C.in:C.mt,fontSize:10,fontWeight:orden===k?700:500,cursor:'pointer'}}>{l}</button>
          );
          // Barra de tendencia: una barrita por compra, altura proporcional al precio
          const tendencia=(h)=>{
            const ps=h.map(x=>x.pu); const mx=Math.max(...ps), mn=Math.min(...ps);
            const rango=mx-mn||1;
            return (
              <span style={{display:'inline-flex',alignItems:'flex-end',gap:1.5,height:16,marginLeft:6}}>
                {h.slice(-8).map((x,i)=>{
                  const alt=4+((x.pu-mn)/rango)*12;
                  const ult=i===Math.min(h.length,8)-1;
                  return <span key={i} title={`${fmtDate(x.fecha)} · ${fmt(x.pu)} €`} style={{width:3,height:alt,borderRadius:1,background:ult?C.in:C.bd,flexShrink:0}}/>;
                })}
              </span>
            );
          };
          return (
            <div style={{...S.card,marginBottom:10}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6,flexWrap:'wrap',gap:6}}>
                <span style={{fontWeight:700}}>📈 Precios de materiales</span>
                <span style={{fontSize:10,color:C.mt}}>{res.materiales} con seguimiento · {res.conLineas} facturas con detalle</span>
              </div>
              {(sinLeer>0||detalleScan)&&(
                <div style={{background:C.bg,borderRadius:8,padding:'8px 10px',marginBottom:8,fontSize:11,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                  {detalleScan
                    ?<>
                      <span style={{flex:1,minWidth:0}}>🔎 Leyendo documentos… <b>{detalleScan.hechos}/{detalleScan.total}</b> · {detalleScan.ok} con líneas{detalleScan.fallos?` · ${detalleScan.fallos} sin desglose`:''}</span>
                      <button style={S.sm(C.dn)} onClick={()=>{detalleCancelRef.current=true;}}>Parar</button>
                    </>
                    :<>
                      <span style={{flex:1,minWidth:0}}>📎 <b>{sinLeer}</b> factura{sinLeer!==1?'s':''} archivada{sinLeer!==1?'s':''} sin desglose de líneas. Leer sus documentos rellena este panel.</span>
                      <BtnConfirm style={S.sm(C.in)} armStyle={{opacity:.85}} armedLabel={`¿Leer ${sinLeer} documento${sinLeer!==1?'s':''}? Toca otra vez`} onConfirm={analizarArchivadas}>🔎 Leer sus documentos</BtnConfirm>
                    </>}
                </div>
              )}
              <div style={{display:'flex',gap:8,marginBottom:8,flexWrap:'wrap',fontSize:11}}>
                {res.suben.length>0&&<span style={{color:C.dn,fontWeight:700}}>▲ {res.suben.length} suben{res.subidaMedia?` (${res.subidaMedia}% medio)`:''}</span>}
                {res.bajan.length>0&&<span style={{color:C.sc,fontWeight:700}}>▼ {res.bajan.length} bajan{res.bajadaMedia?` (${res.bajadaMedia}% medio)`:''}</span>}
                {res.igual>0&&<span style={{color:C.mt}}>= {res.igual} sin cambio</span>}
              </div>
              <div style={{display:'flex',gap:6,marginBottom:8,flexWrap:'wrap'}}>
                {chip('gasto','Por gasto')}{chip('sube','Los que suben')}{chip('baja','Los que bajan')}
                {provs.length>1&&(
                  <select style={{...S.input,width:'auto',flex:'1 1 130px',fontSize:11,padding:'5px 8px'}} value={precioFiltro.prov} onChange={e=>setPrecioFiltro(f=>({...f,prov:e.target.value}))}>
                    <option value="">Todos los proveedores</option>
                    {provs.map(p2=><option key={p2} value={p2}>{p2}</option>)}
                  </select>
                )}
              </div>
              {visibles.length===0&&<div style={{fontSize:11,color:C.mt,textAlign:'center',padding:10}}>Nada que mostrar con este filtro.</div>}
              {visibles.map((f,ix)=>(
                <div key={ix} onClick={()=>setPrecioVer({prov:f.prov,material:f.material})} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 0',borderBottom:`1px solid ${C.bd}`,cursor:'pointer'}}>
                  <span style={{flex:1,minWidth:0}}>
                    <span style={{display:'block',fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.desc}</span>
                    <span style={{display:'block',fontSize:9,color:C.mt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.prov} · {f.veces} compra{f.veces!==1?'s':''}{tendencia(f.historia)}</span>
                  </span>
                  <span style={{textAlign:'right',flexShrink:0}}>
                    <span style={{display:'block',fontSize:12,fontWeight:700}}>{fmt(f.actual)} €</span>
                    <span style={{display:'block',fontSize:10,fontWeight:700,color:f.pct>0?C.dn:f.pct<0?C.sc:C.mt}}>{f.pct>0?'▲ +':f.pct<0?'▼ ':''}{f.pct}%</span>
                  </span>
                </div>
              ))}
              {filas.length>12&&<div style={{fontSize:9,color:C.mt,textAlign:'center',marginTop:6}}>y {filas.length-12} más</div>}
              <div style={{fontSize:9,color:C.mt,marginTop:8}}>Toca un material para ver su histórico y comparar proveedores.</div>
            </div>
          );
        })()}
        {K.topProv.length>0&&<ChartBox title="Proveedores" h={Math.max(140,K.topProv.length*26)}><ResponsiveContainer><BarChart data={K.topProv} layout="vertical" margin={{top:0,right:5,bottom:0,left:0}}><CartesianGrid strokeDasharray="3 3" stroke={C.bd+'44'} horizontal={false}/><XAxis type="number" tick={{fill:C.mt,fontSize:9}} tickFormatter={fmtK}/><YAxis type="category" dataKey="name" tick={{fill:C.mt,fontSize:9}} width={85}/><Tooltip content={<Tip/>}/><Bar dataKey="facturado" name="Facturado" fill={C.in} radius={[0,3,3,0]}/><Bar dataKey="pendiente" name="Pendiente" fill={C.wn} radius={[0,3,3,0]}/></BarChart></ResponsiveContainer></ChartBox>}

        {/* ── PRESUPUESTOS POR OBRA ── */}


        {K.catData.length>0&&<ChartBox title="Desglose categorías" h={170}><ResponsiveContainer><PieChart><Pie data={K.catData} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{fontSize:8}}>{K.catData.map((e,i)=><Cell key={i} fill={C.ch[i%C.ch.length]}/>)}</Pie><Tooltip formatter={v=>fmt(v)+' €'} contentStyle={{background:C.sf,border:`1px solid ${C.bd}`,borderRadius:8,fontSize:11}}/></PieChart></ResponsiveContainer></ChartBox>}
      </div>
    );
  };

  // ═══ MINI CARD DE FACTURA (reutilizable en todas las vistas) ═══
  const InvRow=({inv})=>{
    const est=getEstado(inv,invoices),pagado=getTotalPagado(inv,invoices),saldo=getSaldo(inv,invoices),expanded=expandedId===inv.id;
    const tipoIcon=TIPOS.find(t=>t.id===inv.tipo)?.icon||'📄';
    const linkedAnticipos=getAnticiposAplicados(inv,invoices);
    const isAnticipo=inv.tipo==='anticipo';
    const targetFactura=isAnticipo&&inv.aplicadoA?invoices.find(i=>i.id===inv.aplicadoA):null;
    return(
      <div style={{...S.card,marginBottom:6,padding:0,overflow:'hidden',borderLeft:isAnticipo?`3px solid ${C.vt}`:(inv.proforma?'3px solid #F0B429':undefined)}}>
        <div style={{padding:'10px 12px',cursor:'pointer',display:'flex',gap:8,alignItems:'flex-start'}} onClick={()=>setExpandedId(expanded?null:inv.id)}>
          {/* v381 · Jesús: «pero no me deja meterlos en sepa». Los anticipos
              estaban excluidos de la selección igual que lo estaban del botón de
              pagar. Un anticipo se paga por transferencia como cualquier otra
              factura. Como su estado nunca es «pagada», se mira el SALDO; y un
              anticipo YA APLICADO a una factura no se ofrece: lo que quedara
              por pagar se paga en la definitiva, no dos veces. */}
          {(inv.tipo!=='cobro'&&(isAnticipo?(!inv.aplicadoA&&getSaldo(inv,invoices)>0.01):(est!=='pagada'&&est!=='aplicado')))
            ? <input type="checkbox" checked={selected.has(inv.id)} onChange={e=>{e.stopPropagation();toggleSelect(inv.id);}} onClick={e=>e.stopPropagation()} style={{marginTop:1,accentColor:C.in,flexShrink:0,width:20,height:20,cursor:'pointer'}}/>
            : <span style={{width:20,height:20,flexShrink:0,display:'inline-block'}}/>}
        {/* v381 · el importe se ajusta AQUÍ, al marcar (lo eligió Jesús frente a
            hacerlo en la ventana de la remesa). Sin tocarlo va el saldo entero,
            que es lo de siempre; tocándolo va una parte y el resto se queda
            pendiente para otra remesa. */}
          <div style={{flex:1,minWidth:0}}>
            <div style={{minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'nowrap',minWidth:0,marginBottom:3}}>
                <span style={{fontSize:12,flexShrink:0}}>{tipoIcon}</span>
                <span style={{fontWeight:700,fontSize:13,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{inv.proveedor}</span>
                {(()=>{const d=docEstado(inv);return d==='falta'?<span title="sin documento" style={{fontSize:11,flexShrink:0,color:C.dn}}>📎✗</span>:d==='nube'?<span title="sin confirmar en la nube" style={{fontSize:11,flexShrink:0,color:C.wn}}>⏳</span>:null;})()}
              </div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'nowrap',minWidth:0,overflow:'hidden'}}>
                <Badge estado={est}/>
                {inv.esEstructural&&<span style={{background:C.vt+'22',color:C.vt,padding:'1px 6px',borderRadius:10,fontSize:9,flexShrink:0,whiteSpace:'nowrap',fontWeight:600}}>Estructura</span>}
                {/* Proforma e ISP iban sueltos a la izquierda y desalineaban toda
                    la lista. Van con los demás distintivos, mismo tamaño y su color. */}
                {inv.proforma&&<span style={{background:'#F0B42922',color:'#F0B429',padding:'1px 6px',borderRadius:10,fontSize:9,flexShrink:0,whiteSpace:'nowrap',fontWeight:700}}>Proforma</span>}
                {inv.isp&&<span title="Inversión del sujeto pasivo" style={{background:C.in+'22',color:C.in,padding:'1px 6px',borderRadius:10,fontSize:9,flexShrink:0,whiteSpace:'nowrap',fontWeight:700}}>ISP</span>}
                {esAbono(inv)&&(
                  <span style={{background:C.wn+'22',color:C.wn,padding:'1px 7px',borderRadius:10,fontSize:9,fontWeight:800}}>
                    ↩️ ABONO{(()=>{const o=(invoices||[]).find(x=>x&&x.id===inv.abonoDe);return o?' de '+(o.numFactura||''):'';})()}
                  </span>
                )}
                {!esAbono(inv)&&(()=>{
                  const ab=importeAbonado(inv,invoices);
                  if(ab<=0)return null;
                  const total=Math.abs(+inv.total||0);
                  const entera=Math.abs(total-ab)<0.01;
                  return(
                    <span style={{background:(entera?C.in:C.wn)+'22',color:entera?C.in:C.wn,padding:'1px 7px',borderRadius:10,fontSize:9,fontWeight:800}}>
                      {entera?'↩️ ABONADA ENTERA':'↩️ ABONADA '+fmt(ab)+' €'}
                    </span>
                  );
                })()}
                {esAnulada(inv)&&(
                  <span title={inv.anuladaMotivo||''} style={{background:C.dn+'22',color:C.dn,padding:'1px 7px',borderRadius:10,fontSize:9,fontWeight:800,letterSpacing:'.04em'}}>
                    ANULADA {inv.anuladaEn?'· '+fmtDate(inv.anuladaEn):''}
                  </span>
                )}
                {(()=>{
                  // Semáforo de VERI*FACTU. Se toca para ver el detalle y cotejar.
                  if(inv.tipo!=='cobro')return null;
                  const s=vfSemaforo(inv,vfRegRef.current||vfRegistros);
                  if(s.estado==='sin'&&!vfActivo(vfCfg))return null;
                  const col=s.estado==='aceptada'?C.sc:s.estado==='rechazada'?C.dn:s.estado==='error'?C.wn:s.estado==='pendiente'?C.wn:C.mt;
                  return(
                    <span role="button" onClick={e=>{e.stopPropagation();setVfCotejo({inv,s});}}
                      style={{background:col+'22',color:col,padding:'1px 7px',borderRadius:10,fontSize:9,fontWeight:700,cursor:'pointer'}}>
                      {s.luz} {s.estado==='aceptada'?'AEAT':s.texto}
                    </span>
                  );
                })()}
                {inv.tipo==='cobro'&&<span style={{background:C.sc+'22',color:C.sc,padding:'1px 6px',borderRadius:10,fontSize:9,flexShrink:0,whiteSpace:'nowrap',fontWeight:600}}>Ingreso</span>}
                </div>
                <div style={{fontWeight:800,fontSize:16,fontVariantNumeric:'tabular-nums',flexShrink:0,whiteSpace:'nowrap'}}>{fmt(inv.total)} €</div>
              </div>
              <div style={{fontSize:10.5,color:C.mt,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {fmtDate(inv.fecha)}
                {inv.numFactura&&` · ${inv.numFactura}`}
                {inv.obra&&` · ${inv.obra}`}
                {isAnticipo&&inv.refPresupuesto&&<span style={{color:C.vt}}> · Ppto: {inv.refPresupuesto}</span>}
              </div>
              {false&&inv.obra&&<div style={{fontSize:10,color:C.mt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{inv.obra}</div>}
              {expanded&&inv.concepto&&<div style={{fontSize:10.5,color:C.mt,marginTop:3,fontStyle:'italic'}}>{inv.concepto}</div>}
              {isAnticipo&&targetFactura&&<div style={{fontSize:10,color:C.ch[6],marginTop:2}}>→ Aplicado a: {targetFactura.numFactura||targetFactura.proveedor} ({fmt(targetFactura.total)} €)</div>}
              {isAnticipo&&!inv.aplicadoA&&<div style={{fontSize:10,color:C.vt,marginTop:2}}>⏳ Pendiente de vincular a factura</div>}
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',alignItems:'center',gap:8,marginTop:1}}>
              {!isAnticipo&&est!=='pagada'&&pagado>0&&<div style={{fontSize:10,color:C.sc,lineHeight:1.3}}>Pagado: {fmt(pagado)} €</div>}
              {!isAnticipo&&est!=='pagada'&&pagado>0&&<div style={{fontSize:10,color:(EST[est]||EST.pendiente).c,fontWeight:600}}>Saldo: {fmt(Math.max(saldo,0))} €</div>}
              <div style={{height:20,marginTop:2,display:'flex',justifyContent:'flex-end',alignItems:'center'}}>
                {!isAnticipo&&inv.tipo!=='cobro'&&!['pagada','aplicado','anticipo_libre'].includes(est)
                  ? <button style={{padding:'3px 10px',border:'none',borderRadius:8,background:C.sc+'22',color:C.sc,fontSize:11,fontWeight:800,cursor:'pointer',lineHeight:1.3}} onClick={e=>{e.stopPropagation();openPago(inv);}}>Pagar</button>
                  : <span style={{fontSize:10,color:C.mt}}>{est==='pagada'?'pagada':''}</span>}
              </div>
            </div>
          </div>
        </div>
        {/* v382 · Jesús (08-09-2026): en su captura, una factura YA PAGADA seguía
            enseñando «A la remesa: 0 €». El bloque solo miraba si estaba marcada,
            no si seguía pudiendo remesarse: al pagarse, la casilla desaparecía
            pero esto se quedaba colgado. Ahora usa la MISMA condición. */}
        {selected.has(inv.id)&&(inv.tipo!=='cobro'&&(isAnticipo?(!inv.aplicadoA&&getSaldo(inv,invoices)>0.01):(est!=='pagada'&&est!=='aplicado')))&&(
          <div onClick={e=>e.stopPropagation()}
            style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap',padding:'6px 12px 8px',
                    background:C.in+'10',borderTop:`1px solid ${C.in}33`}}>
            <span style={{fontSize:10,color:C.mt,flexShrink:0}}>A la remesa:</span>
            <input type="text" inputMode="decimal"
              value={sepaImp[inv.id]!==undefined?sepaImp[inv.id]:String(getSaldo(inv,invoices)).replace('.',',')}
              onChange={e=>setSepaImp(p=>({...p,[inv.id]:e.target.value}))}
              style={{...S.input,width:110,flexShrink:0,fontWeight:700,fontSize:12,padding:'4px 8px',minHeight:0,
                      borderColor:impRemesa(inv)>getSaldo(inv,invoices)+0.005?C.dn:undefined}}/>
            <span style={{fontSize:10,color:C.mt,flexShrink:0}}>€</span>
            {sepaImp[inv.id]!==undefined&&(
              <button style={{...S.sm(C.mt),padding:'3px 8px',fontSize:10,minHeight:0}}
                onClick={()=>setSepaImp(p=>{const q={...p};delete q[inv.id];return q;})}>Todo</button>
            )}
            {impRemesa(inv)>getSaldo(inv,invoices)+0.005
              ? <span style={{fontSize:10,color:C.dn,fontWeight:700}}>Más de lo que se debe ({fmt(getSaldo(inv,invoices))} €)</span>
              : (impRemesa(inv)<getSaldo(inv,invoices)-0.005
                  ? <span style={{fontSize:10,color:C.wn}}>Quedarán {fmt(getSaldo(inv,invoices)-impRemesa(inv))} € pendientes</span>
                  : null)}
          </div>
        )}
        {!isAnticipo&&est!=='pagada'&&pagado>0&&<div style={{padding:'0 12px'}}><ProgressBar value={pagado} max={inv.total}/></div>}
        {inv.fechaVencimiento&&!['pagada','aplicado','anticipo_libre'].includes(est)&&(
          <div style={{fontSize:10,padding:'0 12px 4px',color:(est==='vencida'||est==='parcial_vencida')?C.dn:C.mt}}>
            {(est==='vencida'||est==='parcial_vencida')?'⚠ Venció':'Vence'} {fmtDate(inv.fechaVencimiento)}
          </div>)}
        {expanded&&(
          <div style={{borderTop:`1px solid ${C.bd}`,padding:'10px 12px',background:C.bg+'88'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,fontSize:11,marginBottom:8}}>
              <div><span style={{color:C.mt}}>Base:</span> {fmt(inv.importeBase)} €</div>
              <div><span style={{color:C.mt}}>IVA {(inv.base2>0)?`(${inv.tipoIva}%+${inv.tipoIva2}%)`:`${inv.tipoIva}%`}:</span> {fmt(inv.iva)} €</div>
              {(inv.base2>0)&&<div><span style={{color:C.mt}}>Bases:</span> {fmt(inv.importeBase)} € al {inv.tipoIva}% + {fmt(inv.base2)} € al {inv.tipoIva2}%</div>}
              {inv.tipo==='cobro'&&(()=>{
                const ct=(contratos||[]).find(x=>x.id===inv.contratoId);
                return (
                  <div style={{gridColumn:'1/-1',marginTop:4,fontSize:11}}>
                    <span style={{color:C.mt}}>📐 Contrato: </span>
                    {ct?<b style={{color:C.sc}}>{ct.numero}{ct.obra?` · ${ct.obra}`:''}</b>:<span style={{color:C.wn}}>sin vincular</span>}
                    {!esLector()&&<button style={{background:'none',border:'none',color:C.in,cursor:'pointer',fontSize:10,fontWeight:700,marginLeft:6,padding:0}} onClick={()=>setVincModal(inv.id)}>{ct?'cambiar':'▸ vincular'}</button>}
                  </div>
                );
              })()}
              {ES_APP&&inv.tipo==='factura'&&<div style={{marginTop:6}}>
                {inv.adjPath?
                  <span><button style={S.sm(C.in)} onClick={()=>abrirDocumento(inv.adjPath)}>📄 Ver documento</button>{inv.adjNube===false&&<span style={{marginLeft:6,fontSize:10,color:C.wn,fontWeight:700}}>⏳ pendiente de subir a la nube</span>}
                    {/* v355 · Sustituir: machaca el documento anterior (se escribe en el mismo sitio de la nube). Antes no había forma de cambiar un documento roto. */}
                    {!esLector()&&<label style={{...S.sm(C.bd),display:'inline-block',cursor:'pointer',marginLeft:6}}>🔁 Sustituir<input type="file" accept="application/pdf,image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files&&e.target.files[0];if(f)subirAdjuntos([[inv.id,f]]);e.target.value='';}}/></label>}</span>
                  :(!esLector()&&<label style={{...S.sm(C.bd),display:'inline-block',cursor:'pointer'}}>📎 Adjuntar PDF/foto<input type="file" accept="application/pdf,image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files&&e.target.files[0];if(f)subirAdjuntos([[inv.id,f]]);e.target.value='';}}/></label>)}
              </div>}
              {inv.irpf>0&&<div><span style={{color:C.mt}}>IRPF {inv.irpf}%:</span> -{fmt(inv.retencion)} €</div>}
              <div><span style={{color:C.mt}}>Cat:</span> {inv.categoria}</div>
              {inv.proveedorCif&&<div><span style={{color:C.mt}}>CIF:</span> {inv.proveedorCif}</div>}
              {inv.proveedorDir&&<div style={{gridColumn:'1/-1'}}><span style={{color:C.mt}}>Dirección:</span> {inv.proveedorDir}</div>}
              {inv.tipo==='cobro'&&(inv.retGarImp||0)>0&&<div style={{gridColumn:'1/-1'}}><span style={{color:C.mt}}>🛡️ Ret. garantía {inv.retGarPct}%:</span> <span style={{color:C.vt,fontWeight:600}}>{fmt(inv.retGarImp)} €</span> {inv.retGarDevuelta?<span style={{color:C.sc,fontSize:10}}>✓ devuelta{inv.retGarFecha?' '+fmtDate(inv.retGarFecha):''}</span>:<span style={{color:C.wn,fontSize:10}}>pendiente de devolución</span>}</div>}
              {isAnticipo&&inv.refPresupuesto&&<div style={{gridColumn:'1/-1'}}><span style={{color:C.mt}}>Ref. presupuesto:</span> <span style={{color:C.vt,fontWeight:600}}>{inv.refPresupuesto}</span></div>}
              {inv.notas&&<div style={{gridColumn:'1/-1'}}><span style={{color:C.mt}}>Notas:</span> {inv.notas}</div>}
            </div>
            {!isAnticipo&&(<>
              <div style={{fontWeight:700,fontSize:11,marginBottom:4,color:C.mt}}>PAGOS Y ANTICIPOS APLICADOS</div>
              {linkedAnticipos.length>0&&(
                <div style={{marginBottom:6}}>
                  {linkedAnticipos.map(a=>(
                    <div key={a.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 6px',background:C.vt+'11',borderRadius:6,marginBottom:3,fontSize:11}}>
                      <div>
                        <span style={{color:C.vt,fontWeight:600}}>⏩ Anticipo: {fmt(a.total)} €</span>
                        <span style={{color:C.mt,marginLeft:6}}>{fmtDate(a.fecha)}</span>
                        {a.refPresupuesto&&<span style={{color:C.mt}}> · Ppto: {a.refPresupuesto}</span>}
                      </div>
                      <button onClick={e=>{e.stopPropagation();unlinkAnticipo(a.id);}} style={{background:'none',border:'none',color:C.dn,cursor:'pointer',fontSize:10,padding:2}} title="Desvincular">✕</button>
                    </div>
                  ))}
                </div>
              )}
              {(inv.pagos||[]).length===0&&linkedAnticipos.length===0?(
                <div style={{fontSize:11,color:C.mt,fontStyle:'italic',marginBottom:8}}>Sin pagos registrados</div>
              ):(
                <div style={{marginBottom:6}}>
                  {(inv.pagos||[]).map(p=>(
                    <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'3px 0',borderBottom:`1px solid ${C.bd}22`,fontSize:11}}>
                      <div><span style={{color:C.sc,fontWeight:600}}>{fmt(p.importe)} €</span><span style={{color:C.mt,marginLeft:6}}>{fmtDate(p.fecha)} · {p.metodo}</span>{p.referencia&&<span style={{color:C.mt+'99',marginLeft:4}}>({p.referencia})</span>}</div>
                      {/* v359 · quitar un pago pide dos toques y queda en el diario */}
                      <BtnConfirm style={{background:'none',border:'none',color:C.dn,cursor:'pointer',fontSize:11,padding:2}} armStyle={{background:C.dn,color:'#fff',borderRadius:6,padding:'2px 6px',fontSize:10,fontWeight:700}} armedLabel="¿Quitar? toca otra vez" onConfirm={()=>deletePago(inv.id,p.id)}>✕</BtnConfirm>
                    </div>
                  ))}
                  <div style={{textAlign:'right',marginTop:4,fontSize:11}}>
                    <span style={{color:C.mt}}>Total abonado: </span><span style={{fontWeight:700,color:C.sc}}>{fmt(pagado)} €</span>
                    {saldo>0.01&&<><span style={{color:C.mt,marginLeft:8}}>Resta: </span><span style={{fontWeight:700,color:C.wn}}>{fmt(saldo)} €</span></>}
                  </div>
                  {(()=>{const dj=deFactura(diario,inv.id);return dj.length?(
                    <details style={{marginTop:4,fontSize:10,color:C.mt}}><summary style={{cursor:'pointer'}}>📜 Diario de pagos ({dj.length})</summary>
                      {dj.slice(-12).reverse().map((e,k)=><div key={k} style={{padding:'2px 0',borderBottom:`1px solid ${C.bd}22`,color:e.tipo==='pago-'?C.dn:C.mt}}>{lineaDiario(e)}</div>)}
                    </details>):null;})()}
                </div>
              )}
            </>)}
            <div style={{display:'flex',gap:5,flexWrap:'wrap',marginTop:4}}>
              {/* v380 · Jesús: «necesito poder pagar los anticipos». Estaban excluidos a
                  propósito y no debían estarlo: un anticipo se paga como cualquier otra
                  factura, y de hecho es lo primero que se paga. El importe se puede
                  cambiar para pagos parciales, como en el resto. */}
              {(isAnticipo?getSaldo(inv,invoices)>0.01:est!=='pagada')&&<button style={S.sm(C.sc)} onClick={e=>{e.stopPropagation();openPago(inv);}}>{inv.tipo==='cobro'?'💶 Registrar cobro':'💰 Registrar pago'}</button>}
              {inv.tipo==='cobro'&&<button style={S.sm(C.ac)} onClick={e=>{e.stopPropagation();generateCertDoc(inv);}}>⬇ Descargar factura</button>}
              {!isAnticipo&&est!=='pagada'&&inv.tipo!=='cobro'&&anticiposLibres.filter(a=>a.proveedor===inv.proveedor||a.obra===inv.obra).length>0&&(
                <button style={S.sm(C.vt)} onClick={e=>{e.stopPropagation();setLinkModal(inv.id);}}>⏩ Vincular anticipo</button>
              )}
              {isAnticipo&&!inv.aplicadoA&&!esLector()&&(
                <button style={S.sm(C.ac)} onClick={e=>{e.stopPropagation();facturaDeAnticipo(inv);}}
                  title="Escanea la factura definitiva: este anticipo quedará aplicado a ella">📸 Factura definitiva</button>
              )}
              {isAnticipo&&inv.aplicadoA&&<button style={S.sm(C.wn)} onClick={e=>{e.stopPropagation();unlinkAnticipo(inv.id);}}>Desvincular</button>}
              <button style={S.sm(C.in)} onClick={e=>{e.stopPropagation();openEdit(inv);}}>✏️ Editar</button>
              <button style={S.sm(C.dn)} onClick={e=>{e.stopPropagation();setConfirmDel(inv.id);}}>🗑️</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══ FACTURAS (con registros separados) ═══
  // ═══ v364 · NUEVA NAVEGACIÓN (Jesús, 05-09-2026) ═══════════════════════
  // Pestañas por uso diario: Panel · Facturas · Obras · Tesorería · Plantilla · Ajustes.
  // Es un cambio de navegación pura: las pantallas son las mismas piezas de
  // siempre; Tesorería agrupa lo que toca el banco (remesas de proveedores y
  // de nóminas, pendiente y extracto N43, previsión, financiación, traspasos,
  // seguros) recolocando pantallas que ya existían bajo Facturas, Nóminas,
  // Contratos y Seguros. Los permisos siguen por área de cada pantalla.
  // v365 · subárea = la pantalla concreta (recibidas, contratos, remesas, fichajes…)
  const subActual=view==='facturas'?({recibidas:'recibidas',emitidas:'emitidas',clientes:'clientes',proveedores:'proveedores',obras:'obras',pendprov:'n43',remesas:'remesas'}[subView]||'recibidas')
    :view==='contratos'?({lista:'contratos',obras:'obras',presupuestos:'presupuestos',garantias:'garantias',financiacion:'financiacion'}[conView]||'contratos')
    :view==='nominas'?({panel:'nominas',remesar:'nominas',pdf:'nominas',plantilla:'empleados',remesas:'remesas'}[nomView]||'nominas')
    :view==='flota'?'seguros':'';
  try{window.__BH10_SUB=subActual;}catch(e){}
  const sinAccesoSub=!!subActual&&!puedeVerSub(subActual);
  const enTesoreria=(view==='facturas'&&(subView==='remesas'||subView==='pendprov'))||(view==='nominas'&&nomView==='remesas')||(view==='contratos'&&conView==='financiacion')||view==='flota';
  const irPestana=(k)=>{
    // cada pestaña aterriza en su primera subpantalla que el usuario pueda ver
    if(k==='tesoreria'){if(puedeVerSub('remesas')&&puedeVer('facturas')){setView('facturas');setSubView('remesas');}else if(puedeVerSub('n43')&&puedeVer('facturas')){setView('facturas');setSubView('pendprov');}else if(puedeVerSub('financiacion')&&puedeVer('contratos')){setView('contratos');setConView('financiacion');}else if(puedeVerSub('seguros')){setView('flota');}else if(puedeVerSub('remesas')&&puedeVer('nominas')){setView('nominas');setNomView('remesas');}return;}
    if(k==='contratos'){setView('contratos');setConView(puedeVerSub('contratos')?'lista':puedeVerSub('obras')?'obras':puedeVerSub('presupuestos')?'presupuestos':'garantias');return;}
    if(k==='nominas'){setView('nominas');setNomView(puedeVerSub('empleados')?'plantilla':'panel');return;}
    if(k==='facturas'){setView('facturas');setSubView(puedeVerSub('recibidas')?'recibidas':puedeVerSub('emitidas')?'emitidas':puedeVerSub('clientes')?'clientes':'proveedores');return;}
    setView(k);
  };
  const tesoActiva=view==='flota'?'seguros':view==='facturas'?(subView==='remesas'?'remprov':'pendprov'):view==='nominas'?'remnom':'financiacion';
  const BarraTeso=()=>(
    <div style={{...S.filaFija,overflowX:'auto',WebkitOverflowScrolling:'touch'}} data-barra="tesoreria">
      <div style={{display:'flex',gap:1,background:C.sf,borderRadius:10,padding:3,minWidth:'max-content'}}>
        {[['remprov','🏦 Remesas prov.',()=>{setView('facturas');setSubView('remesas');},'facturas','remesas'],
          ['remnom','💶 Remesas nóminas',()=>{setView('nominas');setNomView('remesas');},'nominas','remesas'],
          ['pendprov','💰 Pendiente y N43',()=>{setView('facturas');setSubView('pendprov');},'facturas','n43'],
          ['financiacion','🏦 Financiación',()=>{setView('contratos');setConView('financiacion');},'contratos','financiacion'],
          ['seguros','🛡️ Seguros',()=>setView('flota'),'seguros','seguros']].filter(([,,,area,sub])=>puedeVer(area)&&puedeVerSub(sub)).map(([k,l,fn])=>(
          <button key={k} onClick={fn} style={{padding:'8px 10px',border:'none',cursor:'pointer',fontSize:11,fontWeight:tesoActiva===k?700:500,borderRadius:8,background:tesoActiva===k?C.ac+'22':'transparent',color:tesoActiva===k?C.ac:C.mt,whiteSpace:'nowrap'}}>{l}</button>
        ))}
        {puedeVer('tesoreria')&&puedeVerSub('prevision')&&<button onClick={()=>setVerTeso(true)} style={{padding:'8px 10px',border:'none',cursor:'pointer',fontSize:11,borderRadius:8,background:'transparent',color:C.mt,whiteSpace:'nowrap'}}>📈 Previsión</button>}
        {!esMiembro()&&<button onClick={()=>setTraspModal('lista')} style={{padding:'8px 10px',border:'none',cursor:'pointer',fontSize:11,borderRadius:8,background:'transparent',color:C.mt,whiteSpace:'nowrap'}}>🔁 Traspasos</button>}
      </div>
    </div>
  );
  const subTab=(k,l,icon,count)=><button key={k} style={{padding:'8px 10px',border:'none',cursor:'pointer',fontSize:12,fontWeight:subView===k?700:500,background:subView===k?C.in+'22':'transparent',color:subView===k?C.in:C.mt,borderRadius:8,position:'relative',minHeight:40}} onClick={()=>{setSubView(k);setFEstado('todos');setFTipo('todos');setFObra('todas');setFProv('todos');setExpObra(null);setSelected(new Set());setFocoProv('');setFocoCli('');}}>{icon} {l}{count>0&&<span style={{marginLeft:3,fontSize:9,opacity:.7}}>({count})</span>}</button>;

  const recibidas=useMemo(()=>invoices.filter(i=>i.tipo!=='cobro'),[invoices]);
  const emitidas=useMemo(()=>invoices.filter(i=>i.tipo==='cobro'),[invoices]);

  const Facturas=()=>(
    <div style={{padding:10}}>
      

      {/* Sub-pestañas: se quedan fijas arriba al desplazar, conservando su
          propio desplazamiento horizontal */}
      {enTesoreria?<BarraTeso/>:(
      <div style={{...S.filaFija,overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
        <div style={{display:'flex',gap:1,background:C.sf,borderRadius:10,padding:3,minWidth:'max-content'}}>
          {puedeVerSub('recibidas')&&subTab('recibidas','Recibidas','📥',recibidas.length)}
          {puedeVerSub('emitidas')&&subTab('emitidas','Emitidas','📤',emitidas.length)}
          {puedeVerSub('clientes')&&subTab('clientes','Clientes','👤')}
          {puedeVerSub('proveedores')&&subTab('proveedores','Proveedores','🏪')}
        </div>
      </div>)}

      {/* ── REGISTRO DE ENTRADA (facturas recibidas de proveedores) ── */}
      {subView==='pendprov'&&(()=>{
        const pendL=invoices.filter(i=>esDeudaProveedor(i)&&getSaldo(i,invoices)>0.009).map(i=>({inv:i,saldo:getSaldo(i,invoices)}));
        const grupos={};
        pendL.forEach(({inv,saldo})=>{(grupos[inv.proveedor]=grupos[inv.proveedor]||{proveedor:inv.proveedor,total:0,items:[]});grupos[inv.proveedor].total+=saldo;grupos[inv.proveedor].items.push({inv,saldo});});
        const lista=Object.values(grupos).sort((a,b)=>b.total-a.total);
        const totalG=pendL.reduce((s,x)=>s+x.saldo,0);
        const leerN43=(file)=>{
          setN43Nombre((file&&file.name)||'extracto');
          const r=new FileReader();
          r.onload=()=>{
            try{
              const movs=parseN43(String(r.result||''));
              const pendPlanos=pendL.map(({inv,saldo})=>({id:inv.id,proveedor:inv.proveedor,saldo}));
              const res=conciliaN43(movs,pendPlanos);
              const cargos=movs.filter(m=>m.cargo).length;
              if(!movs.length){notify('No se encontraron movimientos — ¿es un fichero Norma 43?','error');return;}
              // Segunda pasada: cargos que no casan con pendientes pero SÍ con
              // facturas ya pagadas cuya fecha de pago vino de relleno de la
              // importación → se propone corregirles la fecha con la del banco.
              const movsUsados=new Set(res.casados.map(c=>c.mov));
              const pagadasImp=invoices.filter(i=>{
                if(i.tipo==='cobro'||(i.pagos||[]).length!==1)return false;
                const pg=i.pagos[0];if(!pg)return false;
                const marca=String((pg.metodo||'')+' '+(pg.referencia||'')).toLowerCase();
                if(!/importaci|importado|marcado en bloque/.test(marca))return false;
                return Math.abs((+pg.importe||0)-(+i.total||0))<=0.01;
              }).map(i=>({id:i.id,proveedor:i.proveedor,total:+i.total||0,fecha:i.fecha||'',fechaPago:(i.pagos[0]&&i.pagos[0].fecha)||'',numFactura:i.numFactura||''}));
              const ajustes=ajustaFechasN43(movs,pagadasImp,movsUsados);
              setN43Res({...res,cargos,sel:res.casados.map(c=>c.nivel==='seguro'),ajustes,selAj:ajustes.map(a=>a.nivel==='seguro')});
            }catch(e){notify('No se pudo leer el extracto: '+e.message,'error');}
          };
          r.readAsText(file,'ISO-8859-1');
        };
        const aplicarN43=()=>{if(soloLector())return;
          const elegidos=n43Res.casados.filter((c,ix)=>n43Res.sel[ix]);
          const elegidosAj=(n43Res.ajustes||[]).filter((a,ix)=>(n43Res.selAj||[])[ix]);
          if(!elegidos.length&&!elegidosAj.length)return;
          // Se anota qué se toca y con qué valores previos: así «Anular» puede
          // devolver las facturas exactamente a como estaban.
          const registroPagos=[],registroAjustes=[];
          let importeTotal=0;
          setInvoices(prev=>prev.map(i=>{
            for(const c of elegidos){
              const f=c.facturas.find(x=>x.id===i.id);
              if(f){
                const idPago=uid();
                registroPagos.push({inv:i.id,pago:idPago});
                importeTotal+=+f.saldo||0;
                return {...i,pagos:[...(i.pagos||[]),{id:idPago,fecha:c.mov.fechaVal,importe:f.saldo,metodo:'Conciliación N43',referencia:(c.mov.texto||'').slice(0,60)}]};
              }
            }
            const aj=elegidosAj.find(a=>a.factura.id===i.id);
            if(aj&&(i.pagos||[]).length===1){
              const pg=i.pagos[0];
              registroAjustes.push({inv:i.id,fechaAntes:pg.fecha||'',refAntes:pg.referencia||''});
              return {...i,pagos:[{...pg,fecha:aj.mov.fechaVal,referencia:('Banco '+aj.mov.fechaVal+' · '+(aj.mov.texto||'')).slice(0,60)}]};
            }
            return i;
          }));
          persistN43([{id:uid(),fecha:today,archivo:n43Nombre||'extracto',cargos:n43Res.cargos||0,pagos:registroPagos,ajustes:registroAjustes,importe:+importeTotal.toFixed(2)},...n43Hist].slice(0,60));
          const nf=elegidos.reduce((s,c)=>s+c.facturas.length,0);
          const na=elegidosAj.length;
          const partes=[];
          if(nf)partes.push(`${nf} factura${nf!==1?'s':''} marcada${nf!==1?'s':''} como pagada${nf!==1?'s':''}`);
          if(na)partes.push(`🗓️ ${na} fecha${na!==1?'s':''} de pago corregida${na!==1?'s':''}`);
          notify('🏦 '+partes.join(' · ')+' desde el extracto');
          setN43Res(null);
        };
        // Extracto elegido desde la ventana de gestión: se lee al volver aquí
        if(n43Pendiente){const f=n43Pendiente;setTimeout(()=>{setN43Pendiente(null);leerN43(f);},0);}
        return(
          <div>
            <div style={{...S.card,marginBottom:10,borderColor:C.ac+'44'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:6}}>
                {puedeVer('tesoreria')&&<button style={{...S.sm(C.in),width:'100%',marginBottom:8}} onClick={()=>setVerTeso(true)}>💰 Previsión de tesorería (6 meses) — nóminas, SS, seguros, pagos y cobros</button>}
                <div style={{fontWeight:700}}>💰 Pendiente por proveedor</div>
                <div style={{fontWeight:800,color:C.wn}}>{fmt(totalG)} €</div>
              </div>
              <div style={{fontSize:10,color:C.mt,marginTop:2}}>{pendL.length} factura{pendL.length!==1?'s':''} en {lista.length} proveedor{lista.length!==1?'es':''} · toca uno para desplegar</div>
              <div style={{marginTop:10,borderTop:`1px dashed ${C.bd}`,paddingTop:8}}>
                <label style={{...S.sm(C.ac),display:'inline-block',cursor:'pointer'}}>🏦 Conciliar extracto (Norma 43)<input type="file" accept=".txt,.n43,.aeb,.043,text/plain" style={{display:'none'}} onChange={e=>{const f=e.target.files&&e.target.files[0];if(f)leerN43(f);e.target.value='';}}/></label>
                <button style={{...S.sm(C.vt),marginLeft:6}} title="Ver, anular o subir más extractos N43" onClick={()=>setN43Gestion(true)}>🗂️ Extractos{n43Hist.length?` (${n43Hist.length})`:''}</button>
                <span style={{fontSize:10,color:C.mt,marginLeft:8}}>casa cargos del banco con facturas y las marca pagadas</span>
              </div>
              {n43Res&&(
                <div style={{marginTop:10,background:C.bg,borderRadius:10,padding:10}}>
                  <div style={{fontSize:11,fontWeight:700,marginBottom:6}}>Extracto leído: {n43Res.cargos} cargos · {n43Res.casados.length} casados · {n43Res.sinCasar.length} sin casar{(n43Res.ajustes||[]).length>0&&<span style={{color:C.vt}}> · {n43Res.ajustes.length} fecha{n43Res.ajustes.length!==1?'s':''} de pago a corregir</span>}</div>
                  {n43Res.casados.map((c,ix)=>(
                    <label key={ix} style={{display:'flex',gap:8,alignItems:'flex-start',padding:'6px 0',borderBottom:`1px solid ${C.bd}`,fontSize:11,cursor:'pointer'}}>
                      <input type="checkbox" checked={!!n43Res.sel[ix]} onChange={e=>{const sel=[...n43Res.sel];sel[ix]=e.target.checked;setN43Res({...n43Res,sel});}}/>
                      <span style={{flex:1,minWidth:0}}>
                        <b>{c.mov.fechaVal}</b> · {fmt(c.mov.importe)} € {c.nivel==='probable'&&<span style={{color:C.wn}}>(solo por importe — revisa)</span>}
                        <div style={{color:C.mt,fontSize:10,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.mov.texto||'—'}</div>
                        <div>→ {c.facturas.map(f=>{const i=invoices.find(x=>x.id===f.id);return i?`${i.proveedor} nº${i.numFactura||'s/n'}`:f.id;}).join(' + ')}</div>
                      </span>
                    </label>
                  ))}
                  {(n43Res.ajustes||[]).length>0&&(
                    <div style={{marginTop:10,borderTop:`1px dashed ${C.bd}`,paddingTop:8}}>
                      <div style={{fontSize:11,fontWeight:700,color:C.vt,marginBottom:4}}>🗓️ Fechas de pago a corregir ({n43Res.ajustes.length})</div>
                      <div style={{fontSize:9,color:C.mt,marginBottom:6}}>Facturas ya pagadas cuya fecha de pago vino de la importación: el banco muestra el cargo real. Solo se cambia la fecha del pago — nada más.</div>
                      {n43Res.ajustes.map((a,ix)=>(
                        <label key={ix} style={{display:'flex',gap:8,alignItems:'flex-start',padding:'6px 0',borderBottom:`1px solid ${C.bd}`,fontSize:11,cursor:'pointer'}}>
                          <input type="checkbox" checked={!!(n43Res.selAj||[])[ix]} onChange={e=>{const selAj=[...(n43Res.selAj||[])];selAj[ix]=e.target.checked;setN43Res({...n43Res,selAj});}}/>
                          <span style={{flex:1,minWidth:0}}>
                            <b>{a.factura.proveedor}</b> nº {a.factura.numFactura||'s/n'} · {fmt(a.factura.total)} € {a.nivel==='probable'&&<span style={{color:C.wn}}>(solo por importe — revisa)</span>}
                            <div style={{fontSize:10}}><span style={{color:C.mt,textDecoration:'line-through'}}>{fmtDate(a.factura.fechaPago)}</span> → <b style={{color:C.sc}}>{fmtDate(a.mov.fechaVal)}</b></div>
                            <div style={{color:C.mt,fontSize:10,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.mov.texto||'—'}</div>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                  <div style={{display:'flex',gap:8,marginTop:8}}>
                    {(()=>{const nOp=n43Res.sel.filter(Boolean).length+((n43Res.selAj||[]).filter(Boolean).length);return(
                      <button style={S.btn(C.sc)} onClick={aplicarN43}>✅ Aplicar {nOp} operación{nOp!==1?'es':''}</button>
                    );})()}
                    <button style={S.ghost} onClick={()=>setN43Res(null)}>Descartar</button>
                  </div>
                  {n43Res.sinCasar.length>0&&(
                    <div style={{marginTop:10,borderTop:`1px dashed ${C.bd}`,paddingTop:8}}>
                      <div style={{fontSize:11,fontWeight:700,color:C.wn,marginBottom:4}}>⚠️ {n43Res.sinCasar.length} cargo{n43Res.sinCasar.length!==1?'s':''} del banco SIN factura registrada:</div>
                      {n43Res.sinCasar.map((m,ix)=>(
                        <div key={ix} style={{display:'flex',gap:8,alignItems:'center',padding:'5px 0',borderBottom:`1px solid ${C.bd}`,fontSize:11}}>
                          <span style={{flex:1,minWidth:0}}>
                            <b>{m.fechaVal}</b> · <b style={{color:C.wn}}>{fmt(m.importe)} €</b>
                            <div style={{color:C.mt,fontSize:10,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.texto||'—'}</div>
                          </span>
                          <button style={{...S.sm(C.sc),flexShrink:0}} onClick={()=>{
                            setEditing(null);
                            setForm({...emptyForm,tipo:'factura',fecha:m.fechaVal,importeBase:String((m.importe/1.21).toFixed(2)),tipoIva:21,formaPago:'Transferencia',notas:('Cargo banco '+m.fechaVal+' · '+(m.texto||'')).slice(0,120),_pagoAuto:{fecha:m.fechaVal,importe:m.importe,ref:(m.texto||'').slice(0,60)}});
                            setShowForm(true);
                          }}>➕ Registrar</button>
                        </div>
                      ))}
                      <div style={{fontSize:9,color:C.mt,marginTop:4}}>Al registrarla se le adjunta el pago del banco: nace ya PAGADA. Ajusta proveedor, nº y bases en el formulario.</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {lista.length===0&&<div style={{...S.card,textAlign:'center',color:C.mt,fontSize:12}}>🎉 Nada pendiente — todo pagado</div>}
            {lista.map(g=>(
              <div key={g.proveedor} style={{...S.card,marginBottom:8,cursor:'pointer'}} onClick={()=>setPendProvSel(pendProvSel===g.proveedor?null:g.proveedor)}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                  <div style={{fontWeight:700,flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis'}}>{pendProvSel===g.proveedor?'▾':'▸'} {g.proveedor}</div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontWeight:800,color:C.wn}}>{fmt(g.total)} €</div>
                    <div style={{fontSize:9,color:C.mt}}>{(g.items||[]).length} fra{(g.items||[]).length!==1?'s':''}</div>
                  </div>
                </div>
                {pendProvSel===g.proveedor&&(
                  <div style={{marginTop:8,borderTop:`1px solid ${C.bd}`,paddingTop:6}} onClick={e=>e.stopPropagation()}>
                    {g.items.sort((a,b)=>(a.inv.fechaVencimiento||a.inv.fecha).localeCompare(b.inv.fechaVencimiento||b.inv.fecha)).map(({inv,saldo})=>{
                      const est=getEstado(inv,invoices);
                      return(
                        <div key={inv.id} style={{display:'flex',justifyContent:'space-between',gap:8,padding:'5px 0',fontSize:11,cursor:'pointer'}} onClick={()=>openEdit(inv)}>
                          <span style={{flex:1,minWidth:0}}>
                            <b>nº {inv.numFactura||'s/n'}</b> · {fmtDate(inv.fecha)}
                            {est==='vencida'&&<span style={{color:C.dn,fontWeight:700}}> · VENCIDA</span>}
                            {inv.fechaVencimiento&&est!=='vencida'&&<span style={{color:C.mt}}> · vto {fmtDate(inv.fechaVencimiento)}</span>}
                          </span>
                          <b style={{color:C.wn}}>{fmt(saldo)} €</b>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })()}
      {subView==='recibidas'&&(()=>{
        const q=(search||'').toLowerCase();
        let r=[...recibidas];
        if(q)r=r.filter(i=>(i.proveedor+i.obra+i.concepto+i.numFactura+(i.refPresupuesto||'')).toLowerCase().includes(q));
        if(fTipo!=='todos')r=r.filter(i=>i.tipo===fTipo);
        if(fEstado!=='todos'){if(fEstado==='impagada')r=r.filter(i=>{const e=getEstado(i,invoices);return e!=='pagada'&&e!=='aplicado'&&e!=='anticipo_libre';});else if(fEstado==='vencida')r=r.filter(i=>{const e=getEstado(i,invoices);return e==='vencida'||e==='parcial_vencida';});else r=r.filter(i=>getEstado(i,invoices)===fEstado);}
        if(fObra!=='todas')r=r.filter(i=>i.obra===fObra);
        if(fProvSel!=='todos')r=r.filter(i=>i.proveedor===fProvSel);
        if(fMes){const ym=today.slice(0,7);r=r.filter(i=>(i.fecha||'').startsWith(ym));}
        if(fSinDoc)r=r.filter(i=>{const d=docEstado(i);return d==='falta'||d==='nube';});
        const sorters={fecha_desc:(a,b)=>(b.fecha||'').localeCompare(a.fecha||''),fecha_asc:(a,b)=>(a.fecha||'').localeCompare(b.fecha||''),importe_desc:(a,b)=>(b.total||0)-(a.total||0),vencimiento:(a,b)=>(a.fechaVencimiento||'9999').localeCompare(b.fechaVencimiento||'9999')};
        r.sort(sorters[sortMode]||sorters.fecha_desc);

        // Facturas pendientes de pago para SEPA
        const pendientesPago=r.filter(i=>i.tipo!=='anticipo'&&getEstado(i,invoices)!=='pagada'&&getEstado(i,invoices)!=='aplicado'&&getEstado(i,invoices)!=='anticipo_libre');
        const selectAllLocal=()=>{const ids=pendientesPago.map(i=>i.id);setSelected(new Set(ids));};

        return(<>
          {ES_APP&&buzon.length>0&&(
            <div style={{...S.card,marginBottom:10,borderColor:C.wn+'66'}}>
              <div style={{fontWeight:700,marginBottom:4,color:C.wn}}>📥 Enviadas por proveedores <span style={{fontSize:10,color:C.mt,fontWeight:500}}>{buzon.length} pendiente{buzon.length!==1?'s':''}</span></div>
              <div style={{fontSize:10,color:C.mt,marginBottom:8}}>Llegaron por el portal. Al revisar se abre el formulario con el documento ya adjunto.</div>
              {buzon.map(b=>(
                <div key={b.id} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 0',borderBottom:`1px solid ${C.bd}`,fontSize:11}}>
                  <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    <b>{b.nombre||b.cif}</b><span style={{color:C.mt}}> · {b.cif} · {Math.round((b.bytes||0)/1024)} KB</span>
                  </span>
                  <button style={{...S.sm(C.sc),opacity:buzonBusy===b.id?0.5:1}} disabled={buzonBusy===b.id} onClick={()=>aceptarBuzon(b)}>{buzonBusy===b.id?'…':'✅ Revisar'}</button>
                  <BtnConfirm style={S.sm(C.dn)} armStyle={{background:C.dn,color:'#fff'}} armedLabel="¿Seguro?" onConfirm={()=>rechazarBuzon(b.id)}>✕</BtnConfirm>
                </div>
              ))}
            </div>
          )}
          {/* ── RESUMEN Y MANDOS ── */}
          {/* Lo primero que se ve es cuánto se debe; lo demás, a un toque. */}
          {(()=>{
            const viv=(invoices||[]).filter(f=>f&&!esAnulada(f)&&f.tipo!=='emitida'&&f.tipo!=='cobro');
            let tot=0,tv=0,nv=0;
            viv.forEach(f=>{
              const est=getEstado(f,invoices);
              // Un anticipo libre ya salió de caja: es pago adelantado, no deuda.
              // Así este total cuadra con el KPI «Pendiente de pago» del Panel.
              if(est==='pagada'||est==='aplicado'||est==='anticipo_libre')return;
              const s=getSaldo(f,invoices)||0;
              if(s<=0)return;
              tot+=s;
              const d=daysTo(f.fechaVencimiento);
              if(d!==null&&d<0){tv+=s;nv++;}
            });
            tot=+tot.toFixed(2); tv=+tv.toFixed(2);
            return(
              <div style={{...S.card,display:'flex',gap:10,alignItems:'center',marginBottom:9,padding:'11px 12px'}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:10,color:C.mt,textTransform:'uppercase',letterSpacing:'.03em'}}>Pendiente de pago</div>
                  <div style={{fontSize:19,fontWeight:800,color:C.wn,lineHeight:1.15}}>{fmt(tot)} €</div>
                  {tv>0&&<div style={{fontSize:10.5,color:C.dn,fontWeight:600}}>{fmt(tv)} € vencido · {nv} factura{nv!==1?'s':''}</div>}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:5,flexShrink:0}}>
                  {/* Acciones = escritura → solo con permiso. Filtros y su Excel = consulta pura → siempre. */}
                  {!esLector()&&(
                    <button style={{...S.sm(accionesFac?C.vt:C.mt),fontSize:11,padding:'7px 11px',minHeight:0,width:'auto'}}
                      onClick={()=>setAccionesFac(v=>!v)}>{accionesFac?'▴ Acciones':'⚙️ Acciones'}</button>
                  )}
                  <button style={{...S.sm(filtrosFac?C.in:C.mt),fontSize:11,padding:'7px 11px',minHeight:0,width:'auto'}}
                    onClick={()=>setFiltrosFac(v=>!v)}>{filtrosFac?'▴ Filtros':'🔎 Filtros'}</button>
                </div>
              </div>
            );
          })()}

          {/* ── ACCIONES: plegadas, porque son de vez en cuando ── */}
          {accionesFac&&(<>
          {/* ── CARGA MASIVA: dos columnas de media pantalla ── */}
          <div style={{gap:8,marginBottom:8,display:esLector()?'none':'flex',alignItems:'flex-start'}}>
            <label style={{flex:'1 1 0',minWidth:0,background:C.vt+'12',border:`1px dashed ${C.vt}55`,borderRadius:10,padding:'10px 12px',cursor:'pointer',textAlign:'center'}}>
              <input type="file" multiple accept="image/*,.pdf,application/pdf" style={{display:'none'}} onChange={e=>{if(e.target.files?.length)scanBatch(e.target.files);e.target.value='';}}/>
              <span style={{fontSize:13,fontWeight:700,color:C.vt}}>📚 Lote recibidas</span>
              <div style={{fontSize:10,color:C.mt,marginTop:2}}>PDFs o fotos · 💡 foto de 1 página gasta menos que PDF escaneado</div>
            </label>

            {/* Columna derecha: el Excel y, justo debajo, cómo entran sus filas */}
            <div style={{flex:'1 1 0',minWidth:0,display:'flex',flexDirection:'column',gap:6}}>
              <label style={{background:C.sc+'12',border:`1px dashed ${C.sc}55`,borderRadius:10,padding:'10px 12px',cursor:'pointer',textAlign:'center'}}>
                <input type="file" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" style={{display:'none'}} onChange={e=>{if(e.target.files?.[0])importExcel(e.target.files[0]);e.target.value='';}}/>
                <span style={{fontSize:13,fontWeight:700,color:C.sc}}>📊 Importar Excel</span>
                <div style={{fontSize:10,color:C.mt,marginTop:2}}>.xlsx, .xls o .csv</div>
              </label>
              {!esLector()&&(
                <div style={{padding:'0 2px'}}>
                  <div style={{fontSize:10,color:C.mt,marginBottom:4}}>Filas sin marca de pago:</div>
                  <div style={{display:'flex',gap:6}}>
                    {[['pendiente','⬜ Pendientes'],['pagada','✅ Pagadas']].map(([k,l])=>(
                      <button key={k} style={{flex:1,minWidth:0,padding:'5px 6px',borderRadius:12,border:`1px solid ${xlsPago===k?C.sc:C.bd}`,background:xlsPago===k?C.sc+'1E':'transparent',color:xlsPago===k?C.sc:C.mt,fontSize:10,fontWeight:xlsPago===k?700:500,cursor:'pointer',whiteSpace:'nowrap'}} onClick={()=>setXlsPago(k)}>{l}</button>
                    ))}
                  </div>
                  <div style={{fontSize:9,color:C.mt,marginTop:4,lineHeight:1.35}}>Si el Excel trae columna de estado o fecha de pago, esa manda siempre.</div>
                </div>
              )}
            </div>
          </div>

          {/* ── PAGOS EN BLOQUE + SEPA: dos cuadros de media pantalla ── */}
          <div style={{display:'flex',gap:8,marginBottom:8,alignItems:'stretch'}}>
            {!esLector()&&(
              <button style={{flex:'1 1 0',minWidth:0,background:C.in+'12',border:`1px dashed ${C.in}55`,borderRadius:10,padding:'9px 10px',cursor:'pointer',textAlign:'center'}} onClick={()=>setMasPago({hasta:'',prov:'',sel:{},fecha:today,tocado:false})}>
                <span style={{fontSize:12,fontWeight:700,color:C.in}}>✅ Marcar pagadas en bloque</span>
                <div style={{fontSize:9,color:C.mt,marginTop:2,lineHeight:1.35}}>Para poner al día muchas facturas de una vez</div>
              </button>
            )}
            <div style={{flex:'1 1 0',minWidth:0,background:C.in+'12',border:`1px solid ${C.in}33`,borderRadius:10,padding:'9px 10px'}}>
              <div style={{fontSize:12,fontWeight:700,color:C.in,textAlign:'center'}}>📄 Fichero SEPA (C34)</div>
              {selected.size>0&&<div style={{fontSize:10,color:C.mt,textAlign:'center',marginTop:2}}>{selected.size} sel. · <strong>{fmt(invoices.filter(i=>selected.has(i.id)).reduce((s,i)=>s+impRemesa(i),0))} €</strong></div>}
              <div style={{display:'flex',gap:5,marginTop:5,justifyContent:'center',flexWrap:'wrap'}}>
                <button style={{...S.sm(C.in),padding:'5px 9px',fontSize:11}} onClick={selectAllLocal}>☑ Todas ({pendientesPago.length})</button>
                {selected.size>0&&<button style={{...S.sm(C.sc),padding:'5px 9px',fontSize:11,fontWeight:700}} onClick={()=>setShowSepa(true)}>Generar</button>}
                {selected.size>0&&!esLector()&&<button style={{...S.sm(C.wn),padding:'5px 9px',fontSize:11}} onClick={()=>setImpObra(p=>p?null:{destino:''})}>🏗 Obra</button>}
                {selected.size>0&&<button style={{...S.sm(C.mt),padding:'5px 8px',fontSize:11}} onClick={clearSelection}>✕</button>}
              </div>
              {/* v361 · imputar en bloque a una obra (con segundo toque; desvincula de la anterior) */}
              {impObra&&selected.size>0&&(()=>{
                const sel=invoices.filter(i=>selected.has(i.id));const dest=String(impObra.destino||'').trim();
                const conOtra=sel.filter(i=>String(i.obra||'').trim()&&String(i.obra||'').trim()!==dest);
                return (
                  <div style={{marginTop:6,padding:'8px 10px',background:C.wn+'12',border:`1px solid ${C.wn}44`,borderRadius:8,fontSize:11}}>
                    <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                      <input list="bh-obras-cat2" placeholder="Obra (del catálogo o nueva)" value={impObra.destino} onChange={e=>setImpObra({destino:e.target.value})} style={{...S.input,flex:'1 1 180px'}}/>
                      <datalist id="bh-obras-cat2">{obras.map(o=><option key={o.id} value={nombreObra(o)}/>)}</datalist>
                      <BtnConfirm style={S.sm(C.sc)} armStyle={{background:C.sc,color:'#fff'}} armedLabel={`¿Imputar ${sel.length} a «${dest}»? Toca otra vez`} onConfirm={()=>{
                        if(!dest){notify('Escribe la obra','error');return;}
                        if(sinAccion('obras','imputar obras'))return;
                        origenCambio.current='obras: imputar en bloque';
                        const ids=new Set(sel.map(i=>i.id));setInvoices(prev=>prev.map(i=>ids.has(i.id)?{...i,obra:dest}:i));
                        if(!obraDelCatalogo(dest,obras))persistObras([...obras,{id:uid(),alias:dest,calle:'',numero:'',cp:'',municipio:'',provincia:'',activa:true,presupuestoGasto:0,presupuestoVenta:0,cliente:'',viviendas:0,otros:[]}]);
                        setImpObra(null);clearSelection();notify(`🏗 ${sel.length} facturas imputadas a «${dest}»${conOtra.length?` (${conOtra.length} venían de otra obra)`:''}`);
                      }}>Imputar {sel.length}</BtnConfirm>
                    </div>
                    <div style={{color:C.mt,marginTop:4}}>{sel.length} seleccionadas{conOtra.length?<span style={{color:C.wn}}> · {conOtra.length} ya tienen otra obra y se desvincularán ({[...new Set(conOtra.map(i=>String(i.obra).trim()))].slice(0,4).join(', ')}{conOtra.length>4?'…':''})</span>:''}</div>
                  </div>
                );
              })()}
              {selected.size===0&&<div style={{fontSize:9,color:C.mt,marginTop:4,textAlign:'center',lineHeight:1.35}}>Marca facturas con el ☑ de cada fila</div>}
            </div>
          </div>
          </>)}

          {/* Desplegables plegados: los chips de abajo cubren casi todo
              y estos estorbaban a diario. */}
          {filtrosFac&&(<>
          <div style={{display:'flex',gap:4,marginBottom:8,flexWrap:'wrap',alignItems:'center'}}>
            <select style={{...S.select,width:'auto',minWidth:0,maxWidth:'46vw',fontSize:11,padding:'4px 6px'}} value={fTipo} onChange={e=>setFTipo(e.target.value)}>
              <option value="todos">Todo tipo</option><option value="factura">📄 Factura</option><option value="personal">👷 Personal</option><option value="estructura">🏢 Estructura</option><option value="anticipo">⏩ Anticipo</option>
            </select>
            <select style={{...S.select,width:'auto',minWidth:0,maxWidth:'46vw',fontSize:11,padding:'4px 6px'}} value={fEstado} onChange={e=>setFEstado(e.target.value)}>
              <option value="todos">Todo estado</option><option value="impagada">⏳ Sin pagar</option><option value="pendiente">Pendiente</option><option value="parcial">Parcial</option><option value="pagada">Pagada</option><option value="vencida">Vencida</option><option value="anticipo_libre">Anticipos libres</option>
            </select>
            <select style={{...S.select,flex:'1 1 90px',minWidth:0,maxWidth:'94vw',fontSize:11,padding:'4px 6px',color:fProvSel!=='todos'?C.ac:undefined,borderColor:fProvSel!=='todos'?C.ac+'66':undefined}} value={fProvSel} onChange={e=>setFProvSel(e.target.value)}>
              <option value="todos">🏪 Todos proveedores</option>{[...new Set(recibidas.map(i=>i.proveedor).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es')).map(p=><option key={p} value={p}>{p}</option>)}
            </select>
            <select style={{...S.select,flex:'1 1 80px',minWidth:0,maxWidth:'94vw',fontSize:11,padding:'4px 6px'}} value={fObra} onChange={e=>setFObra(e.target.value)}>
              <option value="todas">Todas obras</option>{obrasAll.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
            <select style={{...S.select,width:'auto',fontSize:11,padding:'4px 6px'}} value={sortMode} onChange={e=>setSortMode(e.target.value)}>
              <option value="fecha_desc">↓ Más recientes</option><option value="fecha_asc">↑ Más antiguas</option><option value="importe_desc">€ Mayor importe</option><option value="vencimiento">⏰ Por vencimiento</option>
            </select>
            <button style={{padding:'4px 9px',border:'none',borderRadius:8,cursor:'pointer',fontSize:11,fontWeight:700,background:C.sc+'22',color:C.sc}} title="Exportar a Excel con el filtro actual" onClick={()=>{
              const partes=[];
              partes.push(fEstado==='impagada'?'solo pendientes de pago':fEstado==='vencida'?'solo vencidas':fEstado==='pagada'?'solo pagadas':'pagadas y pendientes');
              if(fMes)partes.push('del mes en curso');
              if(fSinDoc)partes.push('solo sin documento');
              if(fProv&&fProv!=='todos')partes.push('de '+fProv);
              if(fObra&&fObra!=='todas')partes.push('obra '+fObra);
              if(search)partes.push('búsqueda «'+search+'»');
              if(dashFrom||dashTo)partes.push(`entre ${dashFrom?fmtDate(dashFrom):'el inicio'} y ${dashTo?fmtDate(dashTo):'hoy'}`);
              exportExcelLista(r,'facturas_recibidas','Facturas recibidas',partes.join(' · '));
            }}>📊 Excel</button>
            {ES_APP&&!esLector()&&<button style={{padding:'4px 9px',border:'none',borderRadius:8,cursor:'pointer',fontSize:11,fontWeight:700,background:C.in+'22',color:C.in,opacity:zipListaBusy?0.6:1}} disabled={zipListaBusy} title="ZIP con la lista y los documentos (PDF/fotos) de estas facturas, con el filtro actual" onClick={()=>{
              const partes=[];
              partes.push(fEstado==='impagada'?'solo pendientes de pago':fEstado==='vencida'?'solo vencidas':fEstado==='pagada'?'solo pagadas':'pagadas y pendientes');
              if(fMes)partes.push('del mes en curso');
              if(fSinDoc)partes.push('solo sin documento');
              if(fProv&&fProv!=='todos')partes.push('de '+fProv);
              if(fObra&&fObra!=='todas')partes.push('obra '+fObra);
              if(search)partes.push('búsqueda «'+search+'»');
              if(dashFrom||dashTo)partes.push(`entre ${dashFrom?fmtDate(dashFrom):'el inicio'} y ${dashTo?fmtDate(dashTo):'hoy'}`);
              exportZipLista(r,partes.join(' · '));
            }}>{zipListaBusy?'⏳ ZIP…':'📎 ZIP'}</button>}
            <button style={{padding:'4px 9px',border:'none',borderRadius:8,cursor:'pointer',fontSize:11,fontWeight:600,background:C.bg,color:C.mt}} title="CSV plano, para otros programas" onClick={()=>exportCSVLista(r,'recibidas_filtro')}>CSV</button>
          </div>
          </>)}

          {/* Los cuatro filtros rápidos reparten el ancho en una única fila */}
          <div style={{display:'flex',gap:6,margin:'6px 0 8px',flexWrap:'nowrap'}}>
            {[['todas','Todas',()=>{setFEstado('todos');setFMes(false);setFSinDoc(false);},fEstado==='todos'&&!fMes&&!fSinDoc],
              ['pend','⏳ Pendientes',()=>setFEstado(fEstado==='impagada'?'todos':'impagada'),fEstado==='impagada'],
              ['venc','⚠️ Vencidas',()=>setFEstado(fEstado==='vencida'?'todos':'vencida'),fEstado==='vencida'],
              ['mes','📅 Este mes',()=>setFMes(m=>!m),fMes],
              ['sdoc',`📎 Sin doc${(()=>{const n=recibidas.filter(i=>{const d=docEstado(i);return d==='falta'||d==='nube';}).length;return n?' ('+n+')':'';})()}`,()=>setFSinDoc(v=>!v),fSinDoc]].map(([k,l,fn,on])=>(
              <button key={k} style={{flex:'1 1 0',minWidth:0,padding:'7px 4px',borderRadius:20,border:`1px solid ${on?C.ac:C.bd}`,background:on?C.ac+'22':'transparent',color:on?C.ac:C.mt,fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}} onClick={fn}>{l}</button>
            ))}
          </div>
            {/* v383 · Jesús: «una opción en una ventana que se abra dentro de Facturas
                recibidas, y dentro del apartado Sin documentos, que busque en el gmail
                los posibles documentos de las facturas registradas sin documento». Solo
                aparece cuando el filtro está puesto: es donde tiene sentido. */}
            {fSinDoc&&!esLector()&&(()=>{
              const faltan=recibidas.filter(i=>{const d=docEstado(i);return d==='falta'||d==='nube';});
              if(!faltan.length)return null;
              return <button style={{...S.sm(C.in),width:'100%',marginBottom:8,fontSize:11,fontWeight:700}}
                onClick={()=>{descartadasRef.current=new Set();setPkCheq(c=>({...(c||{}),gmail:{en:true,resultados:[]}}));
                  setDocsGmail({faltan});buscarEnGmailFaltantes(faltan.slice(0,TANDA_GMAIL));}}>
                📧 Buscar en Gmail los {faltan.length} documentos que faltan
              </button>;
            })()}
          {fProvSel!=='todos'&&(()=>{const tot=r.reduce((s,i)=>s+(i.total||0),0);const pte=r.reduce((s,i)=>s+Math.max(getSaldo(i,invoices),0),0);return(
            <div style={{background:C.ac+'11',border:`1px solid ${C.ac}33`,borderRadius:8,padding:'6px 10px',marginBottom:8,fontSize:11,display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:6}}>
              <span>🏪 <b>{fProvSel}</b> · {r.length} factura{r.length!==1?'s':''} en el filtro actual</span>
              <span>Total {fmt(tot)} € · <b style={{color:pte>0.01?C.wn:C.sc}}>pendiente {fmt(pte)} €</b></span>
            </div>
          );})()}
          {r.length===0?(
            <div style={{textAlign:'center',padding:30,color:C.mt}}>
              {recibidas.length===0?<div><div style={{marginBottom:10}}>Sin facturas recibidas</div><button style={S.sm(C.ac)} onClick={()=>openNew('factura')}>+ Registrar factura de proveedor</button></div>:'Sin resultados'}
            </div>
          ):(
            <div>
              {(()=>{const porFecha=(sortMode||'fecha_desc').startsWith('fecha');let mesPrev='';return r.slice(0,verFilas).map(inv=>{const mes=porFecha?String(inv.fecha||'').slice(0,7):'';const cab=porFecha&&mes&&mes!==mesPrev;if(cab)mesPrev=mes;return(<div key={inv.id}>{cab&&<div style={{position:'sticky',top:0,zIndex:5,background:C.bg+'F0',backdropFilter:'blur(6px)',padding:'7px 4px 5px',fontSize:11,fontWeight:800,letterSpacing:'.07em',color:C.mt,textTransform:'uppercase'}}>{MESES_L[+mes.slice(5,7)-1]} {mes.slice(0,4)}</div>}{InvRow({inv})}</div>);});})()}
              {r.length>verFilas&&(
                <button style={{...S.sm(C.in),width:'100%',marginTop:6}}
                  onClick={()=>setVerFilas(v=>v+120)}>
                  ⬇ Mostrar más ({r.length-verFilas} restantes)
                </button>
              )}
              <div style={{marginTop:8,padding:'4px',display:'flex',justifyContent:'space-between',fontSize:11,color:C.mt}}>
                <span>{r.length} factura{r.length!==1?'s':''} recibida{r.length!==1?'s':''}</span>
                <span>Total gastos: {fmt(r.filter(i=>i.tipo!=='anticipo').reduce((s,i)=>s+i.total,0))} €</span>
              </div>
            </div>
          )}
        </>);
      })()}

      {/* ── REGISTRO DE SALIDA (facturas emitidas / certificaciones) ── */}
      {subView==='emitidas'&&(()=>{
        const q=(search||'').toLowerCase();
        let r=[...emitidas];
        if(q)r=r.filter(i=>(i.proveedor+i.obra+i.concepto+i.numFactura).toLowerCase().includes(q));
        if(fEstado!=='todos'){if(fEstado==='impagada')r=r.filter(i=>{const e=getEstado(i,invoices);return e!=='pagada';});else r=r.filter(i=>getEstado(i,invoices)===fEstado);}
        if(fObra!=='todas')r=r.filter(i=>i.obra===fObra);
        r.sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''));
        return(<>
          {/* Acciones en paralelo: el lote a la izquierda, emitir y export a la derecha */}
          {!esLector()&&(
            <div style={{display:'flex',gap:8,marginBottom:8,alignItems:'stretch'}}>
              <label style={{flex:'1 1 0',minWidth:0,background:C.sc+'12',border:`1px dashed ${C.sc}55`,borderRadius:10,padding:'10px 12px',cursor:'pointer',textAlign:'center',display:'flex',flexDirection:'column',justifyContent:'center'}}>
                <input type="file" multiple accept="image/*,.pdf,application/pdf" style={{display:'none'}} onChange={e=>{if(e.target.files?.length)scanBatch(e.target.files,'cobro');e.target.value='';}}/>
                <span style={{fontSize:13,fontWeight:700,color:C.sc}}>📤 Lote emitidas</span>
                <div style={{fontSize:10,color:C.mt,marginTop:2,lineHeight:1.35}}>Tus facturas de venta · el cliente será el destinatario</div>
              </label>
              <div style={{flex:'1 1 0',minWidth:0,display:'flex',flexDirection:'column',gap:6}}>
                <button style={{...S.btn(C.sc),width:'100%',fontSize:13,padding:'11px 8px'}} onClick={()=>openNew('cobro')}>+ Emitir factura</button>
                <button style={{...S.sm(C.vt),width:'100%',padding:'10px 8px',fontSize:12}} title="Export completo para migración a software Verifactu" onClick={()=>{
              const list=invoices.filter(i=>i.tipo==='cobro');
              if(!list.length){notify('No hay facturas emitidas','error');return;}
              const h='Serie;Numero;FechaExpedicion;NIFEmisor;NombreEmisor;NIFDestinatario;NombreDestinatario;DireccionDestinatario;Concepto;BaseImponible;TipoIVA;CuotaIVA;ISP_Art84;RetGarantiaPct;RetGarantiaImp;TotalFactura;Obra;ContratoRef';
              const rows=list.map(i=>{
                const ct=contratos.find(c=>c.cliente===i.proveedor);
                const cd={cif:ct?.clienteCif||'',dir:ct?.clienteDir||''};
                const isp=(i.iva||0)===0&&(i.importeBase||0)>0?'SI':'NO';
                const [serie,...numparts]=(i.numFactura||'').split('/');
                return [serie||'',numparts.join('/')||i.numFactura||'',i.fecha,(compCfg.cif||''),(compCfg.name||''),i._clienteCif||cd.cif||'',i.proveedor,String(i._clienteDir||cd.dir||'').replace(/;/g,','),String(i.concepto||'').replace(/;/g,',').slice(0,80),(i.importeBase||0).toFixed(2),i.tipoIva??0,(i.iva||0).toFixed(2),isp,i.retGarPct||0,(i.retGarImp||0).toFixed(2),i.total.toFixed(2),i.obra||'',(i.notas||'').match(/Contrato ([^\s·]+)/)?.[1]||''].join(';');
              });
              shareOrDownload([h,...rows].join('\n'),`Emitidas_migracion_verifactu_${today}.csv`,'text/csv;charset=utf-8');
              notify(`${list.length} facturas exportadas para migración`);
            }}>📦 Export migración</button>
              </div>
            </div>
          )}
          {/* Filtros debajo de las acciones */}
          <div style={{display:'flex',gap:6,marginBottom:8,alignItems:'center'}}>
            <select style={{...S.select,flex:'1 1 0',minWidth:0,fontSize:11,padding:'5px 6px'}} value={fEstado} onChange={e=>setFEstado(e.target.value)}>
              <option value="todos">Todo estado</option><option value="pendiente">Pendiente cobro</option><option value="parcial">Parcial</option><option value="pagada">Cobrada</option>
            </select>
            <select style={{...S.select,flex:'1 1 0',minWidth:0,fontSize:11,padding:'5px 6px'}} value={fObra} onChange={e=>setFObra(e.target.value)}>
              <option value="todas">Todas obras</option>{obrasAll.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          {r.length===0?(
            <div style={{textAlign:'center',padding:30,color:C.mt}}>
              {emitidas.length===0?<div><div style={{marginBottom:10}}>Sin facturas emitidas</div><div style={{fontSize:11,color:C.mt}}>Crea un contrato y genera certificaciones, o emite una factura directamente</div></div>:'Sin resultados'}
            </div>
          ):(
            <div>
              {r.map(inv=><div key={inv.id}>{InvRow({inv})}</div>)}
              <div style={{marginTop:8,padding:'4px',display:'flex',justifyContent:'space-between',fontSize:11,color:C.mt}}>
                <span>{r.length} factura{r.length!==1?'s':''} emitida{r.length!==1?'s':''}</span>
                <span>Facturado: {fmt(r.reduce((s,i)=>s+i.total,0))} € · Cobrado: {fmt(r.reduce((s,i)=>s+getTotalPagado(i,invoices),0))} €</span>
              </div>
            </div>
          )}
        </>);
      })()}

      {/* ── VISTA PROVEEDORES ── */}
      {subView==='clientes'&&(()=>{
        // (el botón de envíos recibidos se pinta dentro)
        const q=(search||'').toLowerCase();
        const cliData=clientes.map(cl=>{
          const invs=emitidas.filter(i=>i.proveedor===cl&&(q?((i.proveedor+i.concepto+i.numFactura+i.obra).toLowerCase().includes(q)):true));
          const cts=contratos.filter(c=>c.cliente===cl).length;
          const total=invs.reduce((s,i)=>s+i.total,0);
          const pendiente=invs.reduce((s,i)=>s+Math.max(getSaldo(i,invoices),0),0);
          const retGar=invs.reduce((s,i)=>s+(((i.retGarImp||0)>0&&!i.retGarDevuelta)?i.retGarImp:0),0);
          return{name:cl,invs,cts,total,pendiente,retGar,count:invs.length};
        }).filter(c=>c.count>0||c.cts>0
          // Los recién creados aún no tienen nada, pero deben verse
          ||(cliCat||[]).some(f=>f&&normProvNombre(f.nombre)===normProvNombre(c.name)));
        const cliOrden=focoCli?ordenarLista(cliData).filter(c=>c.name===focoCli):ordenarLista(cliData);
        // sugerencias de duplicados: mismo detector que proveedores, con las
        // emitidas (ahí el cliente viaja en el campo `proveedor`) y cliCat
        const cliSugs=sugerirFusiones(clientes,cliCat,emitidas).filter(s=>!cliFusIgn.includes([s.origen,s.destino].sort().join('|')));
        const cliFusAbierta=cliFusCfg.abierta||(cliSugs.length>0&&cliSugs.length!==cliFusCfg.cerradaEn);
        const cliIgnorar=(s)=>{const k=[s.origen,s.destino].sort().join('|');const next=[...cliFusIgn,k];setCliFusIgn(next);window.storage.set('bh10-clifusignore',JSON.stringify(next)).catch(()=>{});};
        return(
          <div>
            {!esLector()&&!focoCli&&(cliFusAbierta?(
              <div style={{...S.card,marginBottom:10,borderColor:C.in+'44'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <span style={{fontWeight:700,flex:1,minWidth:0}}>🔗 Fusionar clientes duplicados</span>
                  <button style={{background:'transparent',border:'none',cursor:'pointer',color:C.mt,fontSize:16,lineHeight:1,padding:'2px 6px'}} onClick={()=>setCliFusCfg({cerradaEn:cliSugs.length,abierta:false})}>×</button>
                </div>
                {cliSugs.length>0&&<div style={{fontSize:10,color:C.mt,marginBottom:7}}>El mismo cliente puede existir con grafías distintas. Al fusionar, sus facturas y contratos pasan al nombre bueno y las fichas se funden.</div>}
                {cliSugs.map(s=>(
                  <div key={s.origen+s.destino} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 0',fontSize:11,borderTop:`1px solid ${C.bd}33`}}>
                    <span style={{flex:1,minWidth:0}}>
                      <div style={{overflow:'hidden',textOverflow:'ellipsis'}}><span style={{color:C.mt,textDecoration:'line-through'}}>{s.origen}</span> → <b>{s.destino}</b></div>
                      <div style={{color:C.mt,fontSize:9}}>{s.n} factura{s.n!==1?'s':''} · {s.motivo}</div>
                    </span>
                    <BtnConfirm style={{...S.sm(C.in),flexShrink:0,padding:'5px 9px',fontSize:11,minHeight:0}} armStyle={{background:C.wn}} onConfirm={()=>fusionarClientes(s.origen,s.destino)}>Fusionar</BtnConfirm>
                    <button style={{...S.ghost,flexShrink:0,fontSize:11,padding:'4px 7px',minHeight:0}} title="No volver a sugerir" onClick={()=>cliIgnorar(s)}>✕</button>
                  </div>
                ))}
                <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginTop:8,paddingTop:8,borderTop:`1px solid ${C.bd}33`}}>
                  <select style={{...S.select,flex:'1 1 130px',fontSize:11,padding:'6px'}} value={cliFusOrigen} onChange={e=>{setCliFusOrigen(e.target.value);setCliFusDestino('');}}>
                    <option value="">Duplicado (se va)…</option>
                    {clientes.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                  <select style={{...S.select,flex:'1 1 130px',fontSize:11,padding:'6px'}} value={cliFusDestino} onChange={e=>setCliFusDestino(e.target.value)} disabled={!cliFusOrigen}>
                    <option value="">Se queda…</option>
                    {clientes.filter(c=>c!==cliFusOrigen).map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                  {cliFusOrigen&&cliFusDestino?
                    <BtnConfirm style={{...S.btn(C.in),fontSize:11}} armStyle={{background:C.wn}} onConfirm={()=>fusionarClientes(cliFusOrigen,cliFusDestino)}>Fusionar</BtnConfirm>:null}
                </div>
              </div>
            ):(
              <div style={{display:'flex',justifyContent:'flex-end',marginBottom:6}}>
                <button style={{background:'transparent',border:'none',cursor:'pointer',fontSize:11,color:cliSugs.length>0?C.in:C.mt,padding:'2px 6px'}}
                  title="Fusionar clientes duplicados" onClick={()=>setCliFusCfg({cerradaEn:-1,abierta:true})}>
                  🔗{cliSugs.length>0?` ${cliSugs.length}`:''}
                </button>
              </div>
            ))}
            {focoCli&&(
              <div style={{display:'flex',alignItems:'center',gap:8,background:C.in+'14',border:`1px solid ${C.in}44`,borderRadius:10,padding:'8px 10px',marginBottom:8,fontSize:11}}>
                <span style={{flex:1,minWidth:0}}>🔎 Mostrando solo <b>{focoCli}</b></span>
                <button style={{...S.sm(C.in),flexShrink:0,padding:'5px 10px',fontSize:11,minHeight:0}} onClick={()=>{setFocoCli('');setFProv('todos');}}>✕ Ver todos</button>
              </div>
            )}
            <ChipsOrden/>
            {!esLector()&&(
              <button style={{...S.btn(C.sc),marginBottom:8,width:'100%'}} onClick={()=>{
                // Alta directa: primero se da de alta a quien va a comprar, y
                // después se le hace el presupuesto o la factura.
                setCliModal(CLI_NUEVO);
                setCliForm({nombre:'',cif:'',dir:'',cp:'',municipio:'',provincia:'',
                  email:'',telefono:'',contacto:'',diasVenc:'',retGarPct:'',notas:''});
              }}>➕ Nuevo cliente</button>
            )}
            {derechos.length>0&&(
              <button style={{...S.sm(C.dn),marginBottom:8,fontSize:11,width:'100%'}} onClick={()=>setVerDerecho(derechos[0])}>
                ⚖️ {derechos.length} solicitud{derechos.length!==1?'es':''} de derechos sin responder
                {(()=>{const d=diasParaResponder(derechos[0].recibida);return d===null?'':(d<0?` · VENCIDO hace ${-d} d`:` · quedan ${d} d`);})()}
              </button>
            )}
            {!esLector()&&(()=>{
              const cedibles=clientesCedibles(cliCat,12);
              if(!cedibles.length)return null;
              return (
                <button style={{...S.sm(C.vt),marginBottom:8,fontSize:11}} onClick={()=>{
                  setCesion({clientes:cedibles,entidad:'',hechas:leerCesiones()});
                }}>🏦 Listado para entidades financieras ({cedibles.length})</button>
              );
            })()}
            {ES_APP&&!esLector()&&window.bh10Recibidos&&(
              <button style={{...S.sm(C.in),marginBottom:8,fontSize:11}} onClick={async()=>{
                notify('Buscando envíos…');
                try{setCliRecibidos(await window.bh10Recibidos.listar());}
                catch(e){notify('No se pudo consultar: '+((e&&e.code)||e),'error');}
              }}>📥 Ver datos enviados por clientes</button>
            )}
            {cliOrden.length===0?<div style={{textAlign:'center',padding:30,color:C.mt}}>Sin clientes todavía</div>:
              cliOrden.map(c=>(
                <div key={c.name} style={{...S.card,marginBottom:8,padding:0,overflow:'hidden'}}>
                  <div style={{padding:'10px 12px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}} onClick={()=>setFProv(fProv===c.name?'todos':c.name)}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:13,display:'flex',alignItems:'center',gap:6}}>
                         {c.name}
                         {!esLector()&&<button style={{background:'none',border:'none',cursor:'pointer',fontSize:11,padding:0}}
                           onClick={e=>{e.stopPropagation();const f=fichaCliente(c.name);setCliModal(c.name);setCliForm({...f,nombre:c.name});}}
                           title="Editar ficha del cliente">✏️</button>}
                       </div>
                       {/* v374 · Jesús: «que en la ficha del cliente venga algo que nos avise
                           de que no podemos mandar información a los bancos si han marcado que no».
                           El listado ya los excluye, pero el aviso tiene que verse ANTES, cuando
                           estás mirando al cliente y se te ocurre llamar a la financiera. */}
                       {(()=>{
                         const f0=fichaCliente(c.name);const b=f0&&f0.bancos;
                         if(!b)return null;
                         if(b.autoriza)return <div style={{fontSize:10,color:C.sc,marginTop:2}}>🏦 Autoriza que le pongáis en contacto con entidades{b.entidades&&b.entidades.length?': '+b.entidades.join(', '):''}{b.cuando?` · desde ${fmtDate(b.cuando)}`:''}</div>;
                         const revocada=!!b.revocadoEn;
                         return <div style={{fontSize:10,color:C.dn,marginTop:2,fontWeight:600}}>🚫 NO se le puede pasar a bancos{revocada?` · retiró la autorización el ${fmtDate(b.revocadoEn)}`:' · no lo autorizó'}</div>;
                       })()}
                       {(()=>{const f0=fichaCliente(c.name);const vs=viviendasDeCliente(viviendas,f0);if(!vs.length)return null;return (
                         <div style={{fontSize:10,color:C.in,marginTop:2}}>{vs.map(v=>{const o=obras.find(x=>String(x.id)===String(v.obraId));const co=cotitularesDe(v,f0,cliCat);return `🏠 ${o?nombreObra(o):''} · vivienda ${v.identificador}${co.length?' · cotitular con '+co.join(', '):''}`;}).join(' · ')}</div>);})()}
                       {(()=>{
                         const f=fichaCliente(c.name);
                         if(f.bloqueada)return(
                           <div style={{fontSize:10,color:C.dn,fontWeight:700}}>
                             🔒 BLOQUEADO por solicitud de supresión{f.bloqueadaHasta?` · hasta ${fmtDate(f.bloqueadaHasta)}`:''}
                           </div>
                         );
                         if(!f.cif&&!f.dir)return <div style={{fontSize:10,color:C.wn}}>Sin datos fiscales — ✏️ para completarlos</div>;
                         return(
                           <div style={{fontSize:10,color:C.in,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                             {f.cif}{f.cif&&f.dir?' · ':''}{dirCompletaCliente(f)}
                             {f._origen&&f._origen!=='ficha'&&<span style={{color:C.mt}}> · deducido de {f._origen==='contrato'?'un contrato':'una factura'}</span>}
                           </div>
                         );
                       })()}
<div style={{fontSize:10,color:C.mt}}>{c.count} factura{c.count!==1?'s':''}{c.cts?` · ${c.cts} contrato${c.cts!==1?'s':''}`:''}</div>
                      {c.retGar>0&&<div style={{fontSize:10,color:C.vt,fontWeight:600}}>🛡️ Garantía retenida: {fmt(c.retGar)} €</div>}
                      {!esLector()&&(
                        <div style={{display:'flex',gap:5,marginTop:6,flexWrap:'wrap'}}>
                          <button style={{...S.sm(C.in),padding:'5px 9px',fontSize:10,minHeight:0}}
                            onClick={e=>{e.stopPropagation();openNewContrato('presupuesto',c.name);setView('contratos');}}>📋 Presupuesto</button>
                          <button style={{...S.sm(C.vt),padding:'5px 9px',fontSize:10,minHeight:0}}
                            onClick={e=>{e.stopPropagation();setFProv(fProv===c.name?'':c.name);setCliCt('');}}>📑 Contratos{c.cts>0?` (${c.cts})`:''}</button>
                          <button style={{...S.sm(C.mt),padding:'5px 9px',fontSize:10,minHeight:0}}
                            onClick={e=>{e.stopPropagation();openNewContrato('contrato',c.name);setView('contratos');}}>➕ Contrato</button>
                          <button style={{...S.sm(C.sc),padding:'5px 9px',fontSize:10,minHeight:0}}
                            onClick={e=>{e.stopPropagation();facturarACliente(c.name);}}>💰 Factura</button>
                          {/* v374 · Jesús: «clientes que damos de alta o se dan de alta… no
                              podemos borrarlo». Se borra solo si NO deja nada colgando:
                              una ficha con facturas o contratos detrás no se puede quitar
                              sin romper el libro, y una vivienda perdería a su titular. */}
                          {!esLector()&&(()=>{
                            const f0=fichaCliente(c.name);
                            const nom=String(c.name||'').trim().toLowerCase();
                            const nFac=invoices.filter(i=>i&&i.tipo==='cobro'&&!esAnulada(i)&&String(i.proveedor||'').trim().toLowerCase()===nom).length;
                            const nCon=contratos.filter(x=>String(x.cliente||'').trim().toLowerCase()===nom).length;
                            const nViv=f0?viviendasDeCliente(viviendas,f0).length:0;
                            const atado=nFac+nCon+nViv;
                            return <BtnConfirm style={{...S.sm(C.dn),padding:'5px 9px',fontSize:10,minHeight:0}}
                              armStyle={{background:C.dn,color:'#fff'}} armedLabel="¿Borrar la ficha? Toca otra vez"
                              onConfirm={async()=>{
                                if(sinAccion('clientes','borrar clientes'))return;
                                if(atado){
                                  notify(`No se puede borrar: tiene ${[nFac&&nFac+' facturas',nCon&&nCon+' contratos',nViv&&nViv+' viviendas'].filter(Boolean).join(', ')}. Quítalo de ahí primero.`,'error');
                                  return;
                                }
                                // sus copias de DNI se van con él: no se quedan huérfanas en la custodia
                                let dnis=0;
                                if(window.bh10Dni&&f0){
                                  try{
                                    const docs=await window.bh10Dni.listar();
                                    const suyo=normProvNombre(f0.nombre||c.name);
                                    for(const d of docs.filter(x=>normProvNombre(x.nombreTitular||'')===suyo||normProvNombre(x.cliente||'')===suyo)){
                                      await window.bh10Dni.borrar(d.id).catch(()=>{});dnis++;
                                    }
                                  }catch(e){}
                                }
                                persistCliCat((cliCat||[]).filter(x=>String(idCliente(x))!==String(idCliente(f0||{}))&&String(x.nombre||'').trim().toLowerCase()!==nom));
                                notify(`🗑 Ficha de ${c.name} borrada${dnis?` · ${dnis} copias de DNI destruidas`:''}`);
                              }}>🗑 Borrar ficha</BtnConfirm>;
                          })()}
                        </div>
                      )}
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontWeight:800,fontSize:14}}>{fmt(c.total)} €</div>
                      {c.pendiente>0&&<div style={{fontSize:10,color:'#F97316',fontWeight:600}}>Pte cobro: {fmt(c.pendiente)} €</div>}
                    </div>
                    <span style={{marginLeft:8,fontSize:14,color:C.mt,transform:fProv===c.name?'rotate(180deg)':'rotate(0)',transition:'transform .2s'}}>▼</span>
                  </div>
                  {fProv===c.name&&(()=>{
                    // La ficha cuenta la relación entera: primero lo VIVO (contratos
                    // en vigor), luego lo terminado, y al final lo facturado sin
                    // contrato, por año. Cada contrato lleva DOS saldos: el que
                    // avanza contra su importe, y EN AMARILLO los extras, que van
                    // aparte y no descuentan pendiente.
                    const fich=fichaCliente(c.name)||{};
                    const suyos=contratosDeCliente({nombre:c.name,cif:fich.cif||''},contratos);
                    const datos=suyos.map(x=>{
                      const ct=x.contrato;
                      const certs=invoices.filter(i=>i&&i.tipo==='cobro'&&!esAnulada(i)&&i.contratoId===ct.id)
                        .sort((a,b)=>String(b.fecha||'').localeCompare(String(a.fecha||'')));
                      const cert=+certs.reduce((s,f)=>s+(+f.total||0),0).toFixed(2);
                      const tot=parseNum(ct.total)||0;
                      const R=resumenExtras(ct,invoices);
                      return {...x,certs,cert,tot,pend:+(tot-cert).toFixed(2),extras:R.precio||0,nEx:R.n||0};
                    });
                    const vigor=datos.filter(d=>d.tot<=0||d.pend>0.009);
                    const compl=datos.filter(d=>d.tot>0&&d.pend<=0.009);
                    const enCert=new Set(datos.flatMap(d=>d.certs.map(f=>f.id)));
                    const sueltas=c.invs.filter(i=>!enCert.has(i.id))
                      .sort((a,b)=>String(b.fecha||'').localeCompare(String(a.fecha||'')));
                    const Contrato=({d})=>{
                      const ab=cliCt===d.contrato.id;
                      return(
                        <div style={{border:`1px solid ${C.bd}`,borderRadius:9,marginBottom:5,overflow:'hidden'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,
                            padding:'7px 9px',cursor:'pointer'}}
                            onClick={e=>{e.stopPropagation();setCliCt(v=>v===d.contrato.id?'':d.contrato.id);}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontWeight:700,fontSize:11.5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                🏠 {d.contrato.obra||d.contrato.numero||'(sin obra)'}
                                {d.rol==='cotitular'&&<span style={{marginLeft:5,background:C.in+'22',color:C.in,padding:'1px 6px',borderRadius:8,fontSize:9,fontWeight:700}}>cotitular{d.junto?` con ${d.junto}`:''}</span>}
                              </div>
                              <div style={{fontSize:9.5,color:C.mt}}>{d.contrato.numero||''}{d.contrato.fecha?` · ${fmtDate(d.contrato.fecha)}`:''}</div>
                            </div>
                            <div style={{textAlign:'right',flexShrink:0}}>
                              <div style={{fontWeight:800,fontSize:12,fontVariantNumeric:'tabular-nums'}}>{fmt(d.tot)} €</div>
                              {d.pend>0.009
                                ? <div style={{fontSize:9.5,color:C.wn,fontWeight:700}}>Pte: {fmt(d.pend)} €</div>
                                : <div style={{fontSize:9.5,color:C.sc,fontWeight:700}}>✓ completado</div>}
                              {d.nEx>0&&<div style={{fontSize:9.5,color:'#EAB308',fontWeight:700}}>＋ extras: {fmt(d.extras)} €</div>}
                            </div>
                            <span style={{fontSize:11,color:C.mt,flexShrink:0}}>{ab?'▴':'▾'}</span>
                          </div>
                          {ab&&(
                            <div style={{borderTop:`1px solid ${C.bd}`,padding:'5px 9px',background:C.bg+'55'}}>
                              <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:C.mt,marginBottom:3}}>
                                <span>Facturado {fmt(d.cert)} € de {fmt(d.tot)} €</span>
                                <span>{d.tot>0?Math.round(100*d.cert/d.tot):0}%</span>
                              </div>
                              {d.nEx>0&&<div style={{fontSize:9.5,color:'#EAB308',marginBottom:4}}>
                                Los {fmt(d.extras)} € de extras van aparte: no descuentan pendiente del contrato.</div>}
                              {d.certs.length===0&&<div style={{fontSize:10,color:C.mt}}>Sin facturas todavía.</div>}
                              {d.certs.map(f=>(
                                <div key={f.id} style={{display:'flex',justifyContent:'space-between',gap:8,fontSize:10,padding:'2px 0'}}>
                                  <span style={{minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                    {f.numFactura||'(sin nº)'} · {fmtDate(f.fecha)}{f.concepto?` · ${f.concepto}`:''}</span>
                                  <b style={{flexShrink:0,fontVariantNumeric:'tabular-nums'}}>{fmt(f.total)} €</b>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    };
                    let añoAnt=null;
                    return(
                      <div style={{borderTop:`1px solid ${C.bd}`,padding:'8px',background:C.bg+'66'}}>
                        {vigor.length>0&&<>
                          <div style={{fontSize:9.5,fontWeight:700,color:C.mt,letterSpacing:'.06em',margin:'2px 0 4px'}}>📑 CONTRATOS EN VIGOR</div>
                          {vigor.map(d=><Contrato key={d.contrato.id} d={d}/>)}
                        </>}
                        {compl.length>0&&<>
                          <div style={{fontSize:9.5,fontWeight:700,color:C.mt,letterSpacing:'.06em',margin:'8px 0 4px'}}>✓ COMPLETADOS</div>
                          {compl.map(d=><Contrato key={d.contrato.id} d={d}/>)}
                        </>}
                        {sueltas.length>0&&<>
                          <div style={{fontSize:9.5,fontWeight:700,color:C.mt,letterSpacing:'.06em',margin:'8px 0 4px'}}>🧾 FACTURAS SIN CONTRATO</div>
                          {sueltas.map(inv=>{
                            const a=String(inv.fecha||'').slice(0,4)||'—';
                            const cab=a!==añoAnt; añoAnt=a;
                            return(
                              <div key={inv.id}>
                                {cab&&<div style={{fontSize:9,color:C.mt,fontWeight:700,margin:'5px 0 2px'}}>{a}</div>}
                                {InvRow({inv})}
                              </div>
                            );
                          })}
                        </>}
                        {vigor.length===0&&compl.length===0&&sueltas.length===0&&
                          <div style={{fontSize:10.5,color:C.mt}}>Sin contratos ni facturas todavía.</div>}
                      </div>
                    );
                  })()}
                </div>
              ))}
            {cliOrden.length>0&&<div style={{padding:'4px',fontSize:11,color:C.mt,textAlign:'right'}}>{cliOrden.length} cliente{cliOrden.length!==1?'s':''} · Facturado: {fmt(cliData.reduce((s,c)=>s+c.total,0))} €</div>}
          </div>
        );})()}

      {subView==='proveedores'&&(()=>{
        const q=(search||'').toLowerCase();
        const provData=proveedores.filter(p=>recibidas.some(i=>i.proveedor===p&&i.tipo!=='personal')).map(p=>{
          const invs=recibidas.filter(i=>i.proveedor===p&&i.tipo!=='personal'&&(q?((i.proveedor+i.concepto+i.numFactura+i.obra).toLowerCase().includes(q)):true));
          const total=invs.reduce((s,i)=>s+i.total,0);
          const pendiente=invs.reduce((s,i)=>s+Math.max(getSaldo(i,invoices),0),0);
          const count=invs.length;
          return{name:p,invs,total,pendiente,count};
        }).filter(p=>p.count>0);
        const provOrden=focoProv?ordenarLista(provData).filter(p=>p.name===focoProv):ordenarLista(provData);
        return(
          <div>
            <button style={{...S.sm(C.in),marginBottom:8}} disabled={buscandoCorreos}
              onClick={buscarCorreosProv}>
              {buscandoCorreos?'📧 Buscando en Gmail…':'📧 Completar correos desde Gmail'}
            </button>
            {/* Repaso preventivo: con sesenta fichas, un IBAN mal escrito no se
                ve hasta que el banco rechaza la remesa. Aquí se avisa antes. */}
            {(()=>{
              const rotos=proveedores.map(p=>({p,d:getSupplierData(p)}))
                .filter(x=>x.d.iban&&problemaIban(x.d.iban))
                .map(x=>x.p);
              if(!rotos.length)return null;
              return(
                <div style={{background:C.dn+'12',border:`1px solid ${C.dn}44`,borderRadius:10,padding:'9px 11px',marginBottom:8,fontSize:11}}>
                  <div style={{fontWeight:700,color:C.dn}}>⚠ {rotos.length} proveedor{rotos.length!==1?'es':''} con el IBAN mal escrito</div>
                  <div style={{color:C.mt,fontSize:10,marginTop:3,lineHeight:1.45}}>{rotos.slice(0,5).join(' · ')}{rotos.length>5?` · y ${rotos.length-5} más`:''}</div>
                  <div style={{color:C.mt,fontSize:10,marginTop:3}}>Si alguno entra en una remesa, el banco la rechaza entera. Ábrelos con ✏️ y corrígelos.</div>
                </div>
              );
            })()}
            {focoProv&&(
              <div style={{display:'flex',alignItems:'center',gap:8,background:C.in+'14',border:`1px solid ${C.in}44`,borderRadius:10,padding:'8px 10px',marginBottom:8,fontSize:11}}>
                <span style={{flex:1,minWidth:0}}>🔎 Mostrando solo <b>{focoProv}</b>{provOrden.length===0&&<span style={{color:C.mt}}> — sin facturas con este filtro</span>}</span>
                <button style={{...S.sm(C.in),flexShrink:0,padding:'5px 10px',fontSize:11,minHeight:0}} onClick={()=>{setFocoProv('');setFProv('todos');}}>✕ Ver todos</button>
              </div>
            )}
            <ChipsOrden/>
            {/* ── FUSIÓN DE DUPLICADOS ──
                Se abre sola cuando el sistema detecta parejas nuevas; si no hay
                ninguna (o el usuario la cierra) queda un icono discreto. */}
            {(()=>{
              const sugs=sugerirFusiones(proveedores,provCat,invoices).filter(s=>!fusIgnoradas.includes([s.origen,s.destino].sort().join('|')));
              const abierta=fusCfg.abierta||(sugs.length>0&&sugs.length!==fusCfg.cerradaEn);
              const cerrar=()=>{setFusCfg({cerradaEn:sugs.length,abierta:false});setFusManual(false);};
              const ignorar=(s)=>{const k=[s.origen,s.destino].sort().join('|');const next=[...fusIgnoradas,k];setFusIgnoradas(next);window.storage.set('bh10-fusignore',JSON.stringify(next)).catch(()=>{});};
              if(!abierta)return(
                <div style={{display:'flex',justifyContent:'flex-end',marginBottom:6}}>
                  <button style={{background:'transparent',border:'none',cursor:'pointer',fontSize:11,color:sugs.length>0?C.in:C.mt,padding:'2px 4px',fontWeight:sugs.length>0?700:500}}
                    title="Fusionar proveedores duplicados" onClick={()=>setFusCfg({cerradaEn:-1,abierta:true})}>
                    🔗{sugs.length>0?` ${sugs.length}`:''}
                  </button>
                </div>
              );
              return(
                <div style={{...S.card,marginBottom:10,borderColor:C.in+'44'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                    <span style={{fontWeight:700,flex:1,minWidth:0}}>🔗 Fusionar proveedores duplicados</span>
                    <button style={{background:'transparent',border:'none',cursor:'pointer',color:C.mt,fontSize:16,lineHeight:1,padding:'0 2px'}} title="Cerrar" onClick={cerrar}>✕</button>
                  </div>
                  {sugs.length>0?(
                    <>
                      <div style={{fontSize:10,color:C.mt,marginBottom:7}}>El escáner lee a veces el mismo proveedor con grafías distintas. Estas parejas parecen la misma empresa — revisa y fusiona; facturas, ficha y cola se unifican sin perder nada.</div>
                      {sugs.map(s=>(
                        <div key={s.origen+s.destino} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 0',fontSize:11,borderTop:`1px solid ${C.bd}44`}}>
                          <span style={{flex:1,minWidth:0}}>
                            <div style={{overflow:'hidden',textOverflow:'ellipsis'}}><span style={{color:C.mt,textDecoration:'line-through'}}>{s.origen}</span> <span style={{color:C.in,fontWeight:700}}>→</span> <b>{s.destino}</b></div>
                            <div style={{color:C.mt,fontSize:9}}>{s.n} factura{s.n!==1?'s':''} · {s.motivo}</div>
                          </span>
                          <BtnConfirm style={{...S.sm(C.in),flexShrink:0,padding:'5px 9px',fontSize:11,minHeight:0}} armStyle={{background:C.wn,color:'#fff'}} armedLabel="¿Fusionar?" onConfirm={()=>fusionarProveedores(s.origen,s.destino)}>🔗 Fusionar</BtnConfirm>
                          <button style={{...S.ghost,flexShrink:0,fontSize:11,padding:'4px 7px',minHeight:0}} title="No volver a sugerir esta pareja" onClick={()=>ignorar(s)}>✕</button>
                        </div>
                      ))}
                    </>
                  ):(
                    <div style={{fontSize:10,color:C.sc,marginBottom:6}}>✓ No se detectan duplicados. Puedes fusionar dos proveedores a mano si lo necesitas.</div>
                  )}
                  <button style={{background:'transparent',border:'none',color:C.mt,fontSize:10,cursor:'pointer',padding:'6px 0 0',textDecoration:'underline'}} onClick={()=>setFusManual(v=>!v)}>{fusManual?'Ocultar fusión manual':'✏️ Fusionar dos proveedores a mano'}</button>
                  {fusManual&&(
                    <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginTop:6}}>
                      <select style={{...S.select,flex:'1 1 130px',fontSize:11,padding:'6px'}} value={fusOrigen} onChange={e=>setFusOrigen(e.target.value)}>
                        <option value=''>Duplicado (desaparece)…</option>
                        {proveedores.filter(p=>p!==fusDestino).map(p=><option key={p} value={p}>{p}</option>)}
                      </select>
                      <span style={{color:C.mt,fontWeight:700}}>→</span>
                      <select style={{...S.select,flex:'1 1 130px',fontSize:11,padding:'6px'}} value={fusDestino} onChange={e=>setFusDestino(e.target.value)}>
                        <option value=''>Correcto (se queda)…</option>
                        {proveedores.filter(p=>p!==fusOrigen).map(p=><option key={p} value={p}>{p}</option>)}
                      </select>
                      {fusOrigen&&fusDestino?
                        <BtnConfirm style={{...S.btn(C.in),fontSize:11}} armStyle={{background:C.wn}} onConfirm={()=>fusionarProveedores(fusOrigen,fusDestino)}>🔗 Fusionar ({invoices.filter(i=>i.proveedor===fusOrigen).length})</BtnConfirm>
                        :<button style={{...S.btn(C.bd),fontSize:11,opacity:.5,cursor:'default'}}>🔗 Fusionar</button>}
                    </div>
                  )}
                </div>
              );
            })()}
            {provOrden.length===0?<div style={{textAlign:'center',padding:30,color:C.mt}}>Sin proveedores</div>:
              provOrden.map(p=>(
                <div key={p.name} style={{...S.card,marginBottom:8,padding:0,overflow:'hidden'}}>
                  <div style={{padding:'10px 12px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}
                    onClick={()=>setFProv(fProv===p.name?'todos':p.name)}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:13,display:'flex',alignItems:'center',gap:6}}>{p.name}
                        <button style={{background:'none',border:'none',cursor:'pointer',fontSize:11,padding:0}} onClick={e=>{e.stopPropagation();openProvModal(p.name);}} title="Editar ficha fiscal">✏️</button>
                      </div>
                      {(()=>{const d=getSupplierData(p.name);return(<>
                        {(d.cif||d.iban)?<div style={{fontSize:10,color:C.in}}>{d.cif}{d.cif&&d.iban?' · ':''}{d.iban?'IBAN ···'+d.iban.replace(/\s/g,'').slice(-4):''}</div>:null}
                        {d.pagoAlRegistrar&&<div style={{fontSize:9,color:C.sc,fontWeight:700}}>✓ Se paga solo{d.metodoHabitual?' · '+d.metodoHabitual:''}</div>}
                        {!!d.iban&&problemaIban(d.iban)&&<div style={{fontSize:9,color:C.dn,fontWeight:700}}>⚠ IBAN incorrecto: {problemaIban(d.iban)}</div>}
                      </>);})()}
                      <div style={{fontSize:10,color:C.mt}}>{p.count} factura{p.count!==1?'s':''}</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontWeight:800,fontSize:14}}>{fmt(p.total)} €</div>
                      {p.pendiente>0&&<div style={{fontSize:10,color:C.wn,fontWeight:600}}>Pte: {fmt(p.pendiente)} €</div>}
                    </div>
                    <span style={{marginLeft:8,fontSize:14,color:C.mt,transition:'transform .2s',transform:fProv===p.name?'rotate(180deg)':'rotate(0)'}}>{fProv===p.name?'▲':'▼'}</span>
                  </div>
                  {fProv===p.name&&(
                    <div style={{borderTop:`1px solid ${C.bd}`,padding:'6px 8px',background:C.bg+'66'}}>
                      {p.invs.sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')).map(inv=>InvRow({inv}))}
                    </div>
                  )}
                </div>
              ))
            }
            <div style={{padding:'4px',fontSize:11,color:C.mt,textAlign:'right'}}>{provOrden.length} proveedor{provOrden.length!==1?'es':''} · Total: {fmt(provData.reduce((s,p)=>s+p.total,0))} €</div>
          </div>
        );
      })()}

      {/* ── REMESAS C34 DE PROVEEDORES ── */}
      {subView==='remesas'&&<RemesasList tipo="prov" titulo="🏦 C34 de proveedores"/>}

      {/* ── VISTA OBRAS ── */}
      {subView==='obras'&&(()=>{
        const q=(search||'').toLowerCase();
        const obraData=[...obrasAll,''].map(o=>{
          const label=o||'Sin obra asignada';
          const ficha=obras.find(ob=>obraDisplay(ob)===o);
          const invs=invoices.filter(i=>(o?(i.obra===o):(!(i.obra)))&&(q?((i.proveedor+i.concepto+i.numFactura+i.obra).toLowerCase().includes(q)):true));
          const total=invs.reduce((s,i)=>s+i.total,0);
          const pendiente=invs.reduce((s,i)=>s+Math.max(getSaldo(i,invoices),0),0);
          const budget=budgets[label]||budgets[o]||0;
          const count=invs.length;
          return{name:o,label,invs,total,pendiente,count,budget,ficha};
        }).filter(o=>o.count>0||o.ficha).sort((a,b)=>b.total-a.total);
        return(
          <div>
            <button style={{...S.btn(C.sc),width:'100%',marginBottom:8}} onClick={()=>openObraModal('obras')}>➕ Alta de obra (municipio, calle, número...)</button>
            {obraData.length===0?<div style={{textAlign:'center',padding:30,color:C.mt}}>Sin obras — da de alta la primera</div>:
              obraData.map(o=>{
                const pctBudget=o.budget>0?Math.round(o.total/o.budget*100):0;
                const overBudget=o.budget>0&&o.total>o.budget;
                return(
                  <div key={o.label} style={{...S.card,marginBottom:8,padding:0,overflow:'hidden',borderLeft:`3px solid ${overBudget?C.dn:o.budget?C.sc:C.bd}`}}>
                    <div style={{padding:'10px 12px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}
                      onClick={()=>setExpObra(expObra===o.label?null:o.label)}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:13,display:'flex',alignItems:'center',gap:6}}>{o.label}
                          {o.ficha&&<button style={{background:'none',border:'none',cursor:'pointer',fontSize:11,padding:0}} onClick={e=>{e.stopPropagation();openObraModal('obras',o.ficha);}} title="Editar ficha">✏️</button>}
                        </div>
                        {o.ficha&&(o.ficha.calle||o.ficha.municipio)&&<div style={{fontSize:10,color:C.in}}>{[o.ficha.calle,o.ficha.numero].filter(Boolean).join(' ')}{o.ficha.cp||o.ficha.municipio?` · ${[o.ficha.cp,o.ficha.municipio].filter(Boolean).join(' ')}`:''}{o.ficha.provincia?` (${o.ficha.provincia})`:''}</div>}
                        <div style={{fontSize:10,color:C.mt}}>{o.count>0?`${o.count} factura${o.count!==1?'s':''}`:'Sin facturas aún'}{o.budget>0&&` · Ppto: ${fmt(o.budget)} €`}</div>
                        {o.budget>0&&<div style={{height:4,background:C.bg,borderRadius:2,marginTop:3,overflow:'hidden',width:'100%',maxWidth:150}}>
                          <div style={{height:'100%',width:`${Math.min(pctBudget,100)}%`,background:overBudget?C.dn:pctBudget>80?C.wn:C.sc,borderRadius:2}}/>
                        </div>}
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <div style={{fontWeight:800,fontSize:14}}>{fmt(o.total)} €</div>
                        {o.pendiente>0&&<div style={{fontSize:10,color:C.wn,fontWeight:600}}>Pte: {fmt(o.pendiente)} €</div>}
                        {overBudget&&<div style={{fontSize:9,color:C.dn}}>+{fmt(o.total-o.budget)} € desviación</div>}
                      </div>
                      <span style={{marginLeft:8,fontSize:14,color:C.mt,transition:'transform .2s',transform:expObra===o.label?'rotate(180deg)':'rotate(0)'}}>{expObra===o.label?'▲':'▼'}</span>
                    </div>
                    {expObra===o.label&&(
                      <div style={{borderTop:`1px solid ${C.bd}`,padding:'6px 8px',background:C.bg+'66'}}>
                        {(()=>{
                          const porProv={};
                          o.invs.filter(i=>i.tipo!=='cobro').forEach(i=>{const k=(i.tipo==='personal'?'👷 ':'')+(i.proveedor||'(sin proveedor)');if(!porProv[k])porProv[k]={total:0,n:0};porProv[k].total+=i.total;porProv[k].n++;});
                          const filas=Object.entries(porProv).sort((a,b)=>b[1].total-a[1].total);
                          return filas.length>0?(
                            <div style={{background:C.sf,borderRadius:8,padding:'8px 10px',marginBottom:8}}>
                              <div style={{fontSize:10,fontWeight:700,color:C.mt,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:4}}>Coste por proveedor</div>
                              {filas.map(([prov,d])=>(
                                <div key={prov} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:`1px solid ${C.bd}22`,fontSize:12}}>
                                  <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginRight:8}}>{prov} <span style={{color:C.mt,fontSize:10}}>({d.n})</span></span>
                                  <span style={{fontWeight:700,flexShrink:0}}>{fmt(d.total)} €</span>
                                </div>
                              ))}
                            </div>
                          ):null;
                        })()}
                        {o.invs.sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')).map(inv=><div key={inv.id}>{InvRow({inv})}</div>)}
                      </div>
                    )}
                  </div>
                );
              })
            }
            <div style={{padding:'4px',fontSize:11,color:C.mt,textAlign:'right'}}>{obraData.length} obra{obraData.length!==1?'s':''} · Total: {fmt(obraData.reduce((s,o)=>s+o.total,0))} €</div>
          </div>
        );
      })()}

    </div>
  );

  // ═══ CONTRATOS ═══
  const Contratos=()=>{
    // Cada contrato con sus cifras de ejecución ya calculadas: sirven para
    // ordenar la lista y para pintar el saldo pendiente de certificar.
    const filas=contratos.map(c=>{
      const t=calcContratoTotal(c.items,c.sujetoPasivo);
      const certs=getCertificaciones(c.id);
      const totalCert=getTotalCertificado(c.id);
      const totalCob=getTotalCobradoContrato(c.id);
      const pctCert=t.total>0?Math.round(totalCert/t.total*100):0;
      const pctCob=t.total>0?Math.round(totalCob/t.total*100):0;
      const isPres=c.tipo==='presupuesto';
      // Lo que queda por ejecutar (certificar) del contrato
      const pendEjec=isPres?Math.max(0,+(t.total-totalCert).toFixed(2)):0;
      const pctPend=isPres?Math.max(0,100-pctCert):0;
      return {c,t,certs,totalCert,totalCob,pctCert,pctCob,isPres,pendEjec,pctPend};
    });
    const ordenadas=(()=>{
      const l=[...filas];
      if(conOrden==='ejecucion')return l.sort((a,b)=>b.pctCert-a.pctCert||b.t.total-a.t.total);
      if(conOrden==='importe')return l.sort((a,b)=>b.t.total-a.t.total);
      if(conOrden==='pendiente')return l.sort((a,b)=>b.pendEjec-a.pendEjec||b.t.total-a.t.total);
      return l.sort((a,b)=>String(b.c.fecha||'').localeCompare(String(a.c.fecha||'')));
    })();
    // Cartera viva: solo los presupuestos ya aceptados son obra contratada
    const cartera=filas.filter(f=>f.isPres&&f.c.estado==='aceptado');
    const carTotal=cartera.reduce((s,f)=>s+f.t.total,0);
    const carCert=cartera.reduce((s,f)=>s+f.totalCert,0);
    const carPend=cartera.reduce((s,f)=>s+f.pendEjec,0);
    const carPct=carTotal>0?Math.round(carCert/carTotal*100):0;
    const chipOrd=(k,l)=>(
      <button key={k} onClick={()=>setConOrden(k)} style={{padding:'5px 11px',borderRadius:14,border:`1px solid ${conOrden===k?C.in:C.bd}`,background:conOrden===k?C.in+'22':'transparent',color:conOrden===k?C.in:C.mt,fontSize:10,fontWeight:conOrden===k?700:500,cursor:'pointer',whiteSpace:'nowrap'}}>{l}</button>
    );
    return (
      <div style={{padding:10}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,flexWrap:'wrap',gap:6}}>
          <div style={{fontSize:13,fontWeight:700}}>📑 Contratos ({contratos.length})</div>
          <div style={{display:'flex',gap:5}}>
            <button style={S.btn()} onClick={()=>setShowNuevoTipo(true)}>+ Presupuesto</button>
            <button style={S.btn(C.sc)} onClick={()=>openNewContrato('factura_emitida')}>+ Factura</button>
          </div>
        </div>

        {cartera.length>0&&(
          <div style={{...S.card,marginBottom:10,borderColor:C.ac+'44'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6,flexWrap:'wrap',gap:6}}>
              <span style={{fontWeight:700,fontSize:12}}>🏗️ Obra contratada</span>
              <span style={{fontSize:10,color:C.mt}}>{cartera.length} contrato{cartera.length!==1?'s':''} aceptado{cartera.length!==1?'s':''}</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:6}}>
              {[['Contratado',fmt(carTotal)+' €',C.tx],['Certificado',fmt(carCert)+' €',C.wn],['Por ejecutar',fmt(carPend)+' €',C.ac]].map(([l,v,col])=>(
                <div key={l} style={{background:C.bg,borderRadius:8,padding:'7px 8px',textAlign:'center'}}>
                  <div style={{fontSize:9,color:C.mt}}>{l}</div>
                  <div style={{fontSize:13,fontWeight:800,color:col}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{height:6,background:C.bg,borderRadius:3,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${Math.min(100,carPct)}%`,background:C.wn,borderRadius:3}}/>
            </div>
            <div style={{fontSize:9,color:C.mt,marginTop:3}}>{carPct}% ejecutado · queda {100-carPct}% por certificar</div>
          </div>
        )}

        {contratos.length>1&&(
          <div style={{display:'flex',gap:6,marginBottom:8,flexWrap:'wrap'}}>
            {chipOrd('reciente','📅 Recientes')}{chipOrd('ejecucion','📊 Ejecución')}{chipOrd('importe','💰 Importe')}{chipOrd('pendiente','⏳ Por ejecutar')}
          </div>
        )}

        {contratos.length===0?(
          <div style={{textAlign:'center',padding:30,color:C.mt,fontSize:12}}>Crea presupuestos de obra y genera certificaciones parciales como facturas emitidas</div>
        ):(
          <div>
            {ordenadas.map(({c,t,certs,totalCert,totalCob,pctCert,pctCob,isPres,pendEjec,pctPend})=>{
              return (
                <div key={c.id} style={{...S.card,marginBottom:6,padding:'10px 12px',borderLeft:`3px solid ${isPres?C.ac:C.sc}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <span style={{fontWeight:700,fontSize:12}}>{c.numero}</span>
                        <span style={{background:((isPres&&c.estado==='aceptado')?C.sc:(isPres?C.ac:C.sc))+'22',color:(isPres&&c.estado==='aceptado')?C.sc:(isPres?C.ac:C.sc),padding:'1px 6px',borderRadius:10,fontSize:9,fontWeight:600}}>{isPres?(c.estado==='aceptado'?'Contrato':'Presupuesto'):'Factura'}</span>
                        <span style={{fontSize:9,padding:'1px 6px',borderRadius:10,background:C.mt+'22',color:C.mt}}>{c.estado}</span>
                      </div>
                      <div style={{fontSize:11,fontWeight:500,marginTop:2}}>{c.cliente}</div>
                      {/* v390 · Jesús: «no veo el apartado expediente obra dentro del
                          contrato». El expediente se abre también desde aquí: el contrato
                          conoce su obra por nombre y obraDelCatalogo la resuelve. */}
                      {c.obra&&<div style={{fontSize:10,color:C.mt}}>{c.obra}</div>}
                      {/* v391 · Jesús: «no quiero tener que tener una obra vinculada».
                          El expediente cuelga del CONTRATO mismo y el botón sale siempre. */}
                      <div style={{marginTop:2}}><button style={{...S.sm(C.in),fontSize:9,padding:'1px 7px'}}
                        onClick={e=>{e.stopPropagation();setExpedienteObra({tipo:'contrato',id:c.id});}}>📋 Expediente</button></div>
                      <div style={{fontSize:10,color:C.mt}}>{fmtDate(c.fecha)} · {(c.items||[]).filter(i=>i.precio>0).length} líneas</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontWeight:800,fontSize:14}}>{fmt(t.total)} €</div>
                      {c.sujetoPasivo&&<div style={{fontSize:9,color:C.wn}}>Inv. Suj. Pasivo</div>}
                    </div>
                  </div>

                  {/* Certification progress for presupuestos */}
                  {isPres&&(
                    <div style={{marginTop:6}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:C.mt}}>
                        <span>Certificado: {fmt(totalCert)} € ({pctCert}%)</span>
                        <span>Cobrado: {fmt(totalCob)} € ({pctCob}%)</span>
                      </div>
                      <div style={{height:6,background:C.bg,borderRadius:3,marginTop:3,overflow:'hidden',position:'relative'}}>
                        <div style={{position:'absolute',height:'100%',width:`${pctCert}%`,background:C.wn,borderRadius:3}}/>
                        <div style={{position:'absolute',height:'100%',width:`${pctCob}%`,background:C.sc,borderRadius:3}}/>
                      </div>
                      <div style={{display:'flex',gap:4,fontSize:9,marginTop:2}}>
                        <span style={{color:C.sc}}>■ Cobrado</span><span style={{color:C.wn}}>■ Certificado</span>
                      </div>
                      {pendEjec>0.009&&(
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,marginTop:5,padding:'6px 9px',borderRadius:7,background:C.ac+'14',borderLeft:`3px solid ${C.ac}`}}>
                          <span style={{fontSize:10,color:C.mt}}>⏳ Pendiente de ejecutar</span>
                          <span style={{textAlign:'right',flexShrink:0}}>
                            <b style={{fontSize:13,color:C.ac}}>{fmt(pendEjec)} €</b>
                            <span style={{fontSize:9,color:C.mt,marginLeft:5}}>{pctPend}% por certificar</span>
                          </span>
                        </div>
                      )}
                      {pendEjec<=0.009&&totalCert>0&&<div style={{fontSize:10,color:C.sc,fontWeight:700,marginTop:4}}>✓ Contrato ejecutado al 100%</div>}
                      {(()=>{const rA=certs.reduce((s,i)=>s+(+i.retGarImp||0),0);return rA>0?<div style={{fontSize:9,color:C.wn,marginTop:2}}>🛡️ Ret. garantía acumulada: {fmt(rA)} € — pendiente de liquidación</div>:null;})()}
                      {certs.length>0&&(()=>{
                        const ab=emitidasFila===c.id;
                        const totEmi=+certs.reduce((s,x)=>s+(+x.total||0),0).toFixed(2);
                        return(
                        <div style={{marginTop:5}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,
                            cursor:'pointer',padding:'4px 0'}}
                            onClick={e=>{e.stopPropagation();setEmitidasFila(v=>v===c.id?'':c.id);}}>
                            <span style={{fontSize:10,color:C.sc,fontWeight:700}}>
                              🧾 Facturado a cliente · {certs.length} factura{certs.length!==1?'s':''}
                            </span>
                            <span style={{textAlign:'right',flexShrink:0,display:'flex',alignItems:'center',gap:5}}>
                              <b style={{fontSize:13,color:C.sc}}>{fmt(totEmi)} €</b>
                              <span style={{fontSize:10,color:C.mt}}>{ab?'▴':'▾'}</span>
                            </span>
                          </div>
                          {ab&&(
                          <div style={{marginTop:2,paddingLeft:8,borderLeft:`2px solid ${C.sc}55`}}>
                          {certs.map(cert=>(
                            <div key={cert.id} style={{fontSize:10,padding:'2px 0',display:'flex',justifyContent:'space-between',borderBottom:`1px solid ${C.bd}22`}}>
                              <span style={{minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cert.numFactura} · {cert.concepto?.slice(0,30)}</span>
                              <span style={{display:'flex',gap:6,alignItems:'center',flexShrink:0}}><button style={{background:'none',border:'none',cursor:'pointer',fontSize:11,padding:0}} title="Ver factura" onClick={()=>generarFacturaCert(cert,c)}>📄</button><span style={{fontWeight:600}}>{fmt(cert.total)} €</span></span>
                            </div>
                          ))}
                          </div>
                          )}
                        </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Una sola fila: el texto se encoge si hace falta y los dos
                      iconos mantienen tamaño, así la papelera no salta abajo. */}
                  {/* ── GASTO EXTRA DE ESTE CONTRATO ── */}
                  {/* En naranja y en la propia tarjeta, para verlo sin entrar.
                      Al tocarlo salen las facturas que lo componen. */}
                  {(()=>{
                    const R=resumenExtras(c,invoices);
                    const esperan=extrasSinAsignar(c,invoices,contratos).length;
                    if(R.n===0&&esperan===0)return null;
                    const ab=extrasFila===c.id;
                    const provs=proveedoresDeExtras(c,invoices);
                    return(
                      <div style={{marginTop:5}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,
                          cursor:'pointer',padding:'4px 0'}}
                          onClick={e=>{e.stopPropagation();setExtrasFila(v=>v===c.id?'':c.id);}}>
                          <span style={{fontSize:10,color:C.wn,fontWeight:700}}>
                            ➕ Gasto extra{R.n>0?` · ${R.n} partida${R.n!==1?'s':''}`:''}
                            {esperan>0?` · ${esperan} sin asignar`:''}
                          </span>
                          <span style={{textAlign:'right',flexShrink:0,display:'flex',alignItems:'center',gap:5}}>
                            <b style={{fontSize:13,color:C.wn}}>{fmt(R.precio)} €</b>
                            <span style={{fontSize:10,color:C.mt}}>{ab?'▴':'▾'}</span>
                          </span>
                        </div>
                        {R.sinRespaldo>0&&(
                          <div style={{fontSize:9.5,color:C.dn,marginTop:-2}}>
                            ⚠ {fmt(R.sinRespaldo)} € sin nada por escrito
                          </div>
                        )}
                        {ab&&(
                          <div style={{marginTop:4,paddingLeft:8,borderLeft:`2px solid ${C.wn}55`}}>
                            {provs.length===0&&<div style={{fontSize:10,color:C.mt}}>Todavía sin facturas imputadas.</div>}
                            {provs.map(p=>(
                              <div key={p.proveedor} style={{marginBottom:4}}>
                                <div style={{display:'flex',justifyContent:'space-between',gap:8,fontSize:10.5,fontWeight:700}}>
                                  <span style={{minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.proveedor}</span>
                                  <span style={{flexShrink:0}}>{fmt(p.total)} €</span>
                                </div>
                                {p.facturas.map(f=>(
                                  <div key={f.id} style={{display:'flex',justifyContent:'space-between',gap:8,
                                    fontSize:9.5,color:C.mt,paddingLeft:8}}>
                                    <span style={{minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                      {f.numFactura||'(sin nº)'} · {f._gasto}
                                    </span>
                                    <span style={{flexShrink:0}}>{fmt(parteExtra({partes:(extrasDeContrato(c).find(x=>x.id===f._extraId)||{}).partes},f))} €</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(96px,1fr))',gap:5,marginTop:8}}>
                    {isPres&&c.estado==='aceptado'&&<button style={{...S.sm(C.sc),width:'100%',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}} onClick={()=>{setShowCertModal(c.id);setCertPct('');setCertDesc('');}}>📋 Certificar</button>}
                    {/* Lo que se gasta fuera del precio cerrado y hay que negociar */}
                    {(()=>{
                      const R=resumenExtras(c,invoices);
                      const esperan=extrasSinAsignar(c,invoices,contratos).length;
                      const hay=R.n>0||esperan>0;
                      return(
                        <button style={{...S.sm(esperan>0?C.wn:(R.sinRespaldo>0?C.dn:(hay?C.vt:C.mt))),
                          width:'100%',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',opacity:hay?1:.75}}
                          onClick={e=>{e.stopPropagation();setVerExtras(c);setExtraAbierto('');}}>
                          ➕ Extras{esperan>0?` · ${esperan} sin asignar`:(R.n>0?` · ${fmt(R.precio)} €`:'')}
                        </button>
                      );
                    })()}
                    {/* El expediente de notaría va aquí y no en el cliente: si la
                        vivienda tiene dos compradores, la notaría necesita la
                        documentación de LOS DOS en un solo envío. */}
                    {ES_APP&&!esLector()&&window.bh10Dni&&titularesContrato(c).length>0&&(
                      <button style={{...S.sm(C.vt),width:'100%',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}
                        onClick={async e=>{
                          e.stopPropagation();
                          let dnis=[];
                          try{dnis=await window.bh10Dni.listar();}catch(x){}
                          const exp=expedienteNotaria({contrato:c,fichas:cliCat,dnis});
                          const f0=(cliCat||[]).find(x=>x&&normProvNombre(x.nombre)===normProvNombre(c.cliente))||{};
                          setExpNotaria({nombre:c.cliente||'',ficha:f0,exp,
                            notaria:{nombre:f0.notariaNombre||'',email:f0.notariaEmail||''},
                            clave:claveExpediente(), proteger:false, fuerte:false});
                        }}>📦 Notaría{titularesContrato(c).length>1?` (${titularesContrato(c).length})`:''}</button>
                    )}
                        {String(c.promocion||'').trim()!==''&&(()=>{
                          const grupos=agrupaPromo(Object.values(promoCfg),c.promocion);
                          return(
                          <button style={S.sm(C.in)} onClick={()=>abrirPromo(c)}>
                            🏘️ Promoción{grupos.length?` (${grupos.length} viv.)`:''}
                          </button>);
                        })()}
                    {isPres&&c.estado==='borrador'&&<button style={{...S.sm(C.wn),flex:'1 1 auto',minWidth:0,whiteSpace:'nowrap'}} onClick={()=>{setContratos(p=>p.map(x=>x.id===c.id?{...x,estado:'aceptado'}:x));notify('Contrato aceptado');}}>✓ Aceptar</button>}
                    <button style={{...S.sm(C.in),width:'100%',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}} onClick={()=>generateDoc(c)}>⬇ Descargar</button>
                    <button style={{...S.sm(C.mt),flexShrink:0,padding:'6px 10px'}} onClick={()=>{setEditingContrato(c.id);setContratoForm({...c});setShowContratoForm(true);}}>✏️</button>
                    <BtnConfirm style={{...S.sm(C.dn),flexShrink:0,padding:'6px 10px'}} armStyle={{background:C.dn,color:'#fff',borderColor:C.dn}} armedLabel="¿Seguro?" onConfirm={()=>setContratos(p=>p.filter(x=>x.id!==c.id))}>🗑️</BtnConfirm>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ═══ NÓMINAS ═══
  const Nominas=()=>{
    const active=employees.filter(e=>e.activo);
    const inactive=employees.filter(e=>!e.activo);
    return(
      <div style={{padding:10}}>
        {enTesoreria&&<BarraTeso/>}
        <div style={{...S.filaFija,display:enTesoreria?'none':'flex',gap:4,borderBottom:`1px solid ${C.bd}`,paddingBottom:0,overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
          {[['plantilla','👥 Plantilla','empleados'],['panel','📊 Nóminas','nominas'],['remesar','💶 Remesar','nominas'],['pdf','📄 Leer PDF','nominas']].filter(([,,sub])=>puedeVerSub(sub)).map(([k,l])=>(
            <button key={k} style={{padding:'8px 12px',border:'none',cursor:'pointer',fontSize:12,fontWeight:nomView===k?700:500,background:nomView===k?C.in+'22':'transparent',color:nomView===k?C.in:C.mt,borderRadius:'8px 8px 0 0',whiteSpace:'nowrap',flexShrink:0}} onClick={()=>setNomView(k)}>{l}</button>
          ))}
        </div>
        {nomView==='remesas'&&<RemesasList tipo="nom" titulo="🏦 C34 de nóminas — histórico y detalle"/>}
        {nomView==='panel'&&(()=>{
          const hoy=new Date();const añoAct=hoy.getFullYear();
          // ── v348 · presupuesto anual de personal como centro de coste ──
          const prAnual=parseNum(compCfg.prPersonalAnual)||0;
          const prMensual=parseNum(compCfg.prMensualPersonal)||0;
          const prExtraImp=parseNum(compCfg.prExtraImporte)||0;
          const prIrpfT=parseNum(compCfg.prIrpfTrim)||0;
          const prExtras=String(compCfg.prPagasExtra||'6,12').split(',').map(Number);
          const mesAct=hoy.getMonth()+1;
          // devengado teórico a fecha con el modelo de caja: meses normales +
          // extras caídas + los 111 ya vencidos (enero/abril/julio/octubre)
          const teoricoADia=+(Array.from({length:mesAct},(_,k)=>k+1).reduce((s2,m)=>
            s2+prMensual+(prExtras.includes(m)?prExtraImp:0)+([1,4,7,10].includes(m)?prIrpfT:0),0)).toFixed(2);
          // consumido con las fuentes REALES: remesas de nóminas del año +
          // apuntes de personal + TGSS + pagos del 111 registrados
          const consumidoRem=(remesas||[]).filter(r=>r&&r.tipo==='nom'&&String(r.fechaEjec||'').startsWith(String(añoAct))).reduce((s2,r)=>s2+(+r.total||0),0);
          const consumidoNom=invoices.filter(i=>i.tipo==='personal'&&!i.esAnulada&&String(i.fecha||'').startsWith(String(añoAct))).reduce((s2,i)=>s2+(+i.total||0),0);
          const consumidoSS=invoices.filter(i=>i.tipo!=='personal'&&(i.categoria==='Seguridad Social'||/\b111\b|retenc/i.test(String(i.concepto||'')))&&String(i.fecha||'').startsWith(String(añoAct))).reduce((s2,i)=>s2+(+i.total||0),0);
          const consumido=+(consumidoRem+consumidoNom+consumidoSS).toFixed(2);
          const techoAnual=prAnual>0?prAnual:+(12*prMensual+prExtras.length*prExtraImp+4*prIrpfT).toFixed(2);
          const coherencia=prAnual>0&&prMensual>0?+(12*prMensual+prExtras.length*prExtraImp+4*prIrpfT).toFixed(2):null;
          const pctPr=techoAnual>0?Math.min(150,consumido/techoAnual*100):0;
          const enSel=(per)=>{const p=String(per||'').split('-');const y=+p[0],m=+p[1];if(!y)return false;
            if(nomPer==='año')return y===añoAct;
            if(nomPer==='trim'){const q=Math.floor(hoy.getMonth()/3);return y===añoAct&&Math.floor((m-1)/3)===q;}
            const d=new Date(añoAct,hoy.getMonth()-1,1);return y===d.getFullYear()&&m===d.getMonth()+1;};
          const regs=(nominasMes||[]).filter(x=>enSel(x.per));
          const cardPresupuesto=(
            <div style={{...S.card,marginBottom:8}}>
              <div style={{fontWeight:700,marginBottom:6}}>🎯 Presupuesto anual de personal</div>
              <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:6,fontSize:10,color:C.mt}}>
                <label>Mes normal € <div style={{fontSize:9}}>remesa + SS empresa y trabajador</div>
                  <input style={{...S.input,width:96,fontFamily:'monospace'}} inputMode="decimal" value={compCfg.prMensualPersonal||''} placeholder="80.000" onChange={e=>setCompCfg({...compCfg,prMensualPersonal:e.target.value})} onBlur={saveCompany}/></label>
                <label>Paga extra € <div style={{fontSize:9}}>lo que SUBE el mes (la SS no dobla)</div>
                  <input style={{...S.input,width:90,fontFamily:'monospace'}} inputMode="decimal" value={compCfg.prExtraImporte||''} placeholder="30.000" onChange={e=>setCompCfg({...compCfg,prExtraImporte:e.target.value})} onBlur={saveCompany}/></label>
                <label>111 trimestral € <div style={{fontSize:9}}>ene · abr · jul · oct</div>
                  <input style={{...S.input,width:84,fontFamily:'monospace'}} inputMode="decimal" value={compCfg.prIrpfTrim||''} placeholder="15.000" onChange={e=>setCompCfg({...compCfg,prIrpfTrim:e.target.value})} onBlur={saveCompany}/></label>
                <label>Meses extra
                  <select style={{...S.select,padding:'6px',display:'block'}} value={compCfg.prPagasExtra||'6,12'}
                    onChange={e=>{const nu={...compCfg,prPagasExtra:e.target.value};setCompCfg(nu);window.storage.set('bh10-company-v2',JSON.stringify(nu)).catch(()=>{});}}>
                    <option value="6,12">junio y diciembre</option>
                    <option value="7,12">julio y diciembre</option>
                  </select></label>
                <label>Techo anual € <div style={{fontSize:9}}>opcional: para cotejar</div>
                  <input style={{...S.input,width:96,fontFamily:'monospace'}} inputMode="decimal" value={compCfg.prPersonalAnual||''} placeholder="1.000.000" onChange={e=>setCompCfg({...compCfg,prPersonalAnual:e.target.value})} onBlur={saveCompany}/></label>
              </div>
              {prMensual>0?(
                <>
                  {coherencia!==null&&Math.abs(coherencia-prAnual)>prAnual*0.02&&(
                    <div style={{fontSize:10,color:C.wn,marginBottom:4}}>⚠ El modelo mensual suma {fmt(coherencia)} €/año y el techo dice {fmt(prAnual)} € — revisa los importes</div>
                  )}
                  <div style={{display:'flex',gap:14,flexWrap:'wrap',fontSize:12,marginBottom:6}}>
                    <span>Techo <b>{fmt(techoAnual)} €</b>/año</span>
                    <span>Consumido <b>{fmt(consumido)} €</b> ({pctPr.toFixed(1)}%)</span>
                    <span>Teórico a día <b>{fmt(teoricoADia)} €</b></span>
                    <span style={{color:consumido<=teoricoADia?C.sc:C.dn,fontWeight:700}}>{consumido<=teoricoADia?'▼':'▲'} {fmt(Math.abs(consumido-teoricoADia))} € {consumido<=teoricoADia?'por debajo':'POR ENCIMA'}</span>
                  </div>
                  <div style={{height:8,background:C.bd+'44',borderRadius:4,overflow:'hidden'}}>
                    <div style={{height:'100%',width:pctPr.toFixed(1)+'%',background:consumido<=teoricoADia?C.sc:C.dn,borderRadius:4}}/>
                  </div>
                  <div style={{fontSize:10,color:C.mt,marginTop:6}}>Consumido = remesas de nóminas ({fmt(consumidoRem)} €) + apuntes de personal ({fmt(consumidoNom)} €) + TGSS y 111 registrados ({fmt(consumidoSS)} €). La tesorería imputa: mes normal + paga extra en sus meses + 111 en ene/abr/jul/oct.</div>
                </>
              ):(
                <div style={{fontSize:11,color:C.mt}}>Fija la salida de un mes normal (remesa + Seguridad Social), lo que añade cada paga extra (la cotización va prorrateada y no dobla) y el 111 trimestral. La previsión de tesorería imputará esa caja real y aquí verás el consumo, como un centro de coste.</div>
              )}
            </div>);
          const agg={};
          regs.forEach(x=>(x.items||[]).forEach(i=>{const k=i.empId||normNIF(i.nif)||i.nombre;if(!k)return;
            agg[k]=agg[k]||{empId:i.empId,nombre:i.nombre||'',dev:0,irC:0,ss:0,liq:0,meses:0};
            agg[k].dev+=+i.dev||0;agg[k].irC+=+i.irC||0;agg[k].ss+=+i.ss||0;agg[k].liq+=+i.liq||0;agg[k].meses++;
            if(!agg[k].nombre&&i.nombre)agg[k].nombre=i.nombre;}));
          const lista=Object.values(agg).sort((a,b)=>b.liq-a.liq);
          const tot=lista.reduce((s,a)=>({dev:s.dev+a.dev,irC:s.irC+a.irC,ss:s.ss+a.ss,liq:s.liq+a.liq}),{dev:0,irC:0,ss:0,liq:0});
          const etq=nomPer==='año'?`Ejercicio ${añoAct}`:nomPer==='trim'?`T${Math.floor(hoy.getMonth()/3)+1} ${añoAct}`:'Mes anterior';
          return(
            <div>
              {cardPresupuesto}
              <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
                {[['año',`📅 Año ${añoAct}`],['trim','Trimestre'],['mesant','Mes anterior']].map(([k,l])=>(
                  <button key={k} style={{padding:'6px 12px',borderRadius:16,border:`1px solid ${nomPer===k?C.in:C.bd}`,background:nomPer===k?C.in+'22':'transparent',color:nomPer===k?C.in:C.mt,fontSize:11,fontWeight:nomPer===k?700:500,cursor:'pointer'}} onClick={()=>setNomPer(k)}>{l}</button>
                ))}
              </div>
              <div style={{...S.card,marginBottom:10,borderColor:C.in+'44'}}>
                <div style={{fontSize:10,fontWeight:700,color:C.in,marginBottom:6}}>{etq.toUpperCase()} · {lista.length} trabajador{lista.length!==1?'es':''} · {regs.length} mes{regs.length!==1?'es':''}</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 12px',fontSize:12}}>
                  <div><span style={{color:C.mt}}>Bruto devengado: </span><b>{fmt(tot.dev)} €</b></div>
                  <div><span style={{color:C.mt}}>Líquido pagado: </span><b style={{color:C.sc}}>{fmt(tot.liq)} €</b></div>
                  <div><span style={{color:C.mt}}>IRPF retenido: </span><b>{fmt(tot.irC)} €</b></div>
                  <div><span style={{color:C.mt}}>SS trabajador: </span><b>{fmt(tot.ss)} €</b></div>
                  {(()=>{const cs=regs.flatMap(x=>(x.items||[]).map(costeEmpresaDe));const t=cs.reduce((s,x)=>s+x.valor,0);const est=cs.some(x=>x.estimado);return t>0?(
                    <div style={{gridColumn:'1 / -1'}}><span style={{color:C.mt}}>Coste empresa total: </span><b style={{color:C.wn}}>{fmt(t)} €</b>{est&&<span style={{fontSize:9,color:C.mt}}> ≈ estimado (bruto +32% SS)</span>}</div>
                  ):null;})()}
                </div>
              </div>
              {lista.length===0&&<div style={{...S.card,textAlign:'center',color:C.mt,fontSize:12}}>Sin nóminas en este periodo — impórtalas desde 📄 Leer PDF o genera una remesa en 💶 Remesar.</div>}
              {lista.map((a,ix)=>(
                <div key={ix} style={{...S.card,marginBottom:6,padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,cursor:a.empId?'pointer':'default'}} onClick={()=>{if(a.empId)setFichaEmp(a.empId);}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:12,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.nombre||'—'}{a.empId?<span style={{fontSize:9,color:C.mt}}> ▸</span>:null}</div>
                    <div style={{fontSize:10,color:C.mt}}>Bruto {fmt(a.dev)} € · IRPF {fmt(a.irC)} € · SS {fmt(a.ss)} € · {a.meses}m</div>
                  </div>
                  <b style={{fontSize:13,color:C.sc,flexShrink:0}}>{fmt(a.liq)} €</b>
                </div>
              ))}
            </div>
          );
        })()}
        {nomView==='remesar'&&(()=>{
          const ult=(nominasMes||[])[0];
          return(
            <div style={{...S.card,marginBottom:10}}>
              <div style={{fontWeight:700,marginBottom:4}}>💶 Remesar nóminas (C34)</div>
              <div style={{fontSize:10,color:C.mt,marginBottom:8}}>{ult?`Último mes registrado: ${ult.per} · ${(ult.items||[]).length} trabajadores. Al editar, esos importes vienen precargados: ajusta bajas, altas o cambios y genera el XML — el mes se acumulará al panel.`:'Sin meses registrados todavía: los importes saldrán del salario de cada ficha.'}</div>
              {ult&&(
                <div style={{maxHeight:230,overflowY:'auto',marginBottom:10}}>
                  {(ult.items||[]).map((it,ix)=>(
                    <div key={ix} style={{display:'flex',justifyContent:'space-between',gap:8,padding:'4px 0',borderBottom:`1px solid ${C.bd}`,fontSize:11}}>
                      <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{it.nombre}</span>
                      <b>{fmt(+it.liq||0)} €</b>
                    </div>
                  ))}
                </div>
              )}
              <button style={S.btn(C.sc)} onClick={openPayroll}>💶 Editar importes y generar C34</button>
            </div>
          );
        })()}
        {nomView==='pdf'&&(<>
            {ES_APP&&(
              <div style={{...S.card,marginBottom:10,borderColor:C.ac+'44'}}>
                <div style={{fontWeight:700,marginBottom:4}}>📄 Importar nóminas del mes (PDF)</div>
                <div style={{fontSize:10,color:C.mt,marginBottom:8}}>El PDF de la gestoría con todas las nóminas: el lector las individualiza por trabajador, crea los que falten, completa NIF y registra IRPF, SS, coste empresa y líquidos.</div>
                <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                  <label style={{...S.btn(C.ac),display:'inline-block',cursor:'pointer',opacity:nomBusy?0.6:1}}>{nomBusy?'⏳ Leyendo…':'📄 Seleccionar PDF'}<input type="file" accept="application/pdf" style={{display:'none'}} disabled={nomBusy} onChange={e=>{const f=e.target.files&&e.target.files[0];if(f)importarNominasPDF(f);e.target.value='';}}/></label>
                  {nominasMes.length>0&&<button style={S.sm(C.in)} onClick={exportarCertificadoRet}>⬇ Certificado retenciones {String(nominasMes[0].per||'').slice(0,4)}</button>}
                  {nominasMes.length>0&&<span style={{fontSize:10,color:C.mt}}>último: {nominasMes[0].per} ({(nominasMes[0].items||[]).length})</span>}
                </div>
              </div>
            )}
            {nomImport&&(
              <div style={{...S.card,marginBottom:10,borderColor:C.sc+'55'}}>
                <div style={{fontWeight:700,marginBottom:6}}>Revisión · periodo {nomImport.per||'—'} · {nomImport.items.length} nóminas</div>
                <div style={{maxHeight:250,overflowY:'auto',marginBottom:8}}>
                  {(nomImport.items||[]).map((nm,ix)=>(
                    <div key={ix} style={{display:'flex',justifyContent:'space-between',gap:8,padding:'5px 0',borderBottom:`1px solid ${C.bd}`,fontSize:11}}>
                      <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nm.empId?'✓':'🆕'} <b>{nm.n}</b><span style={{color:C.mt}}> · IRPF {fmt(+nm.irC||0)} € · SS {fmt(+nm.ss||0)} €</span></span>
                      <b>{fmt(+nm.liq||0)} €</b>
                    </div>
                  )).map((el,ix)=>{
                    const nm=nomImport.items[ix];
                    const malCuadre=nm._cuadre&&!nm._cuadre.ok;
                    const duda=!nm.empId&&nm._dudaEmp;
                    if(!malCuadre&&!duda&&!nm._reparado&&!nm._avisoEmb)return el;
                    return(
                      <div key={'w'+ix}>
                        {el}
                        {malCuadre&&<div style={{fontSize:10,color:C.dn,padding:'2px 0 4px'}}>⚠ {nm._cuadre.motivo}</div>}
                        {nm._reparado&&<div style={{fontSize:10,color:C.wn,padding:'2px 0 4px'}}>🔧 Corregido al leer: {nm._reparado}</div>}
                        {nm._avisoEmb&&<div style={{fontSize:10,color:C.dn,padding:'2px 0 4px',fontWeight:700}}>⚖️ EMBARGO SIN FICHA: {nm._avisoEmb}</div>}
                        {duda&&<div style={{fontSize:10,color:C.wn,padding:'2px 0 4px'}}>⚠ Sin identificar: {nm._dudaEmp}</div>}
                      </div>
                    );
                  })}
                </div>
                {(()=>{const t=nomImport.items.reduce((s,x)=>({liq:s.liq+(+x.liq||0),ir:s.ir+(+x.irC||0),ss:s.ss+(+x.ss||0),ce:s.ce+(+x.ce||0)}),{liq:0,ir:0,ss:0,ce:0});return(
                  <div style={{fontSize:10,color:C.mt,marginBottom:8}}>Σ líquidos <b style={{color:C.tx}}>{fmt(t.liq)} €</b> (premonta el C34) · IRPF {fmt(t.ir)} € · SS trab. {fmt(t.ss)} € · coste empresa {fmt(t.ce)} €</div>
                );})()}
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <button style={S.btn(C.sc)} onClick={()=>aplicarNominas(false)}>✅ Aplicar ({(nomImport.items||[]).filter(x=>!x.empId).length} nuevos)</button>
                  <button style={S.btn(C.ac)} onClick={()=>aplicarNominas(true)}>💶 Aplicar y remesar C34</button>
                  <button style={S.btn(C.vt)} onClick={()=>repartirNominas(nomImport.file,nomImport.items,nomImport.per||today.slice(0,7))}>📤 Repartir y enviar</button>
                  <button style={S.ghost} onClick={()=>setNomImport(null)}>Descartar</button>
                </div>
              </div>
            )}
        </>)}
        {nomView==='plantilla'&&(<>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,gap:8,flexWrap:'wrap'}}>
          <div style={{fontSize:13,fontWeight:700,flexShrink:0}}>👷 Plantilla ({active.length} activos)</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',justifyContent:'flex-end',minWidth:0}}>
            {!esLector()&&(
              <button style={{...S.sm(C.in),fontSize:11,padding:'8px 10px',minHeight:0,alignSelf:'center',whiteSpace:'nowrap'}}
                title="Importar móviles y correos" onClick={()=>setContPegar('')}>📥 Contactos</button>
            )}
            {ES_APP&&!esLector()&&window.bh10Fichaje&&(
              <button style={{...S.sm(C.vt),fontSize:11,padding:'8px 10px',minHeight:0,alignSelf:'center',whiteSpace:'nowrap'}}
                onClick={abrirFichaje}>🕐 Fichajes</button>
            )}
            {active.length>0&&<button style={S.btn(C.in)} onClick={openPayroll}>💶 Generar nóminas</button>}
            <button style={S.btn()} onClick={openNewEmp}>+ Empleado</button>
          </div>
        </div>

        {employees.length===0?(
          <div style={{textAlign:'center',padding:30,color:C.mt}}>
            <div style={{fontSize:13,marginBottom:8}}>Añade tu plantilla de trabajadores</div>
            <div style={{fontSize:11,color:C.mt}}>Cada empleado con su IBAN y salario base. Luego genera el fichero SEPA mensual.</div>
          </div>
        ):(
          <div>
            {active.map(emp=>(
              <div key={emp.id} style={{...S.card,marginBottom:5,padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{flex:1,cursor:'pointer'}} onClick={()=>setFichaEmp(emp.id)}>
                  <div style={{fontWeight:700,fontSize:12}}>{emp.nombre} <span style={{fontSize:9,color:C.mt}}>▸ ficha</span></div>
                  <div style={{fontSize:10,color:C.mt,fontFamily:'monospace'}}>{emp.iban}</div>
                  {emp.direccion&&<div style={{fontSize:10,color:C.mt}}>{emp.direccion} {emp.cp}</div>}
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{fontWeight:700,fontSize:13}}>{fmt(emp.importeBase)} €</div>
                  <div style={{display:'flex',gap:3,marginTop:3}}>
                    <button style={S.sm(C.in)} onClick={()=>openEditEmp(emp)}>✏️</button>
                    <button style={S.sm(C.wn)} onClick={()=>toggleEmpActive(emp.id)}>⏸</button>
                    <BtnConfirm style={S.sm(C.dn)} armStyle={{background:C.dn,color:'#fff',borderColor:C.dn}} armedLabel="¿Seguro?" onConfirm={()=>deleteEmp(emp.id)}>🗑️</BtnConfirm>
                  </div>
                </div>
              </div>
            ))}
            {inactive.length>0&&(
              <div style={{marginTop:12}}>
                <div style={{fontSize:11,color:C.mt,fontWeight:600,marginBottom:4}}>Inactivos ({inactive.length})</div>
                {inactive.map(emp=>(
                  <div key={emp.id} style={{...S.card,marginBottom:4,padding:'6px 12px',opacity:0.5,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:12}}>{emp.nombre}</span>
                    <div style={{display:'flex',gap:3}}>
                      <button style={S.sm(C.sc)} onClick={()=>toggleEmpActive(emp.id)}>▶ Activar</button>
                      <button style={S.sm(C.dn)} onClick={()=>deleteEmp(emp.id)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {active.length>0&&(
              <div style={{...S.card,marginTop:10,textAlign:'center'}}>
                <div style={{fontSize:11,color:C.mt}}>Total nómina base mensual</div>
                <div style={{fontSize:20,fontWeight:800,color:C.ac}}>{fmt(active.reduce((s,e)=>s+(e.importeBase||0),0))} €</div>
                <button style={{...S.btn(C.in),marginTop:8}} onClick={openPayroll}>💶 Generar fichero SEPA nóminas</button>
              </div>
            )}

            
          </div>
        )}
        </>)}
      </div>
    );
  };

  // ═══ CONFIG ═══
  // ═══ AJUSTES EN ACORDEÓN, POR GRUPOS ═══
  // Los apartados se recogen tal cual de ConfigBruto y se les pone una cabecera
  // plegable. NO se toca su contenido: cada tarjeta sigue siendo la que era.
  // Truco importante: todos quedan como hermanos en el MISMO contenedor y se
  // colocan con la propiedad «order», así que agrupar no mueve nada en el
  // documento — si se movieran, React los volvería a montar y perderían su
  // estado (un formulario a medias se borraría al agrupar).
  const VentanaTrozos=()=>{
    if(!paqueteTrozos)return null;
    return(
      <div style={S.overlay} onClick={()=>setPaqueteTrozos(null)}>
        <div style={{...S.modal,maxWidth:420}} onClick={e=>e.stopPropagation()}>
          <div style={S.cabModal}>
            <b style={{fontSize:15}}>📦 El paquete va en {paqueteTrozos.length} archivos</b>
          </div>
          <div style={{fontSize:12,color:C.mt,marginBottom:10,lineHeight:1.5}}>
            Se ha partido para que ninguno pase de 10 MB y quepan en un correo.
            Descárgalos todos: el primero lleva los CSV, el resumen y el LÉEME.
          </div>
          {paqueteTrozos.map((z,i)=>(
            <button key={z.nombre} style={{...S.sm(i===0?C.sc:C.in),width:'100%',marginBottom:6,textAlign:'left'}}
              onClick={()=>shareOrDownload(z.blob,z.nombre,'application/zip')}>
              ⬇ Parte {i+1} de {paqueteTrozos.length} · {(z.blob.size/1048576).toFixed(1)} MB
              {i===0?'  (con el LÉEME)':''}
            </button>
          ))}
          <button style={{...S.sm(C.mt),width:'100%',marginTop:6}} onClick={()=>setPaqueteTrozos(null)}>Cerrar</button>
        </div>
      </div>
    );
  };
  const ConfigBruto=()=>(
    <div style={{display:'contents'}}>

      {/* ── BARRA Y PANTALLA ── */}
      {/* v358: el mando de colocar apartados vive ahora en la cabecera de
          Ajustes (✎ Colocar), como en el Panel. Aquí quedan los ajustes de
          la barra inferior y de la pantalla. */}
      <div style={{...S.card,marginBottom:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontWeight:700,flex:1,minWidth:0,fontSize:13}}>📐 Barra y pantalla</span>
        </div>

        {/* ── ALTO DE LA BARRA DE ABAJO ── */}
        {/* Se ve el cambio al momento, sin guardar ni recargar. */}
        <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.bd}`}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
            <span style={{fontSize:11.5,fontWeight:700,flex:1}}>📏 Alto de la barra de abajo</span>
            <b style={{fontSize:12,color:C.in}}>{altoTab} px</b>
            {altoTab!==TAB_DEF&&(
              <button style={{...S.sm(C.mt),padding:'5px 9px',fontSize:10,minHeight:0,width:'auto'}}
                onClick={()=>cambiarAltoTab(TAB_DEF)}>Normal</button>
            )}
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <button style={{...S.sm(C.in),padding:'9px 14px',fontSize:15,minHeight:0,width:'auto',
              opacity:altoTab<=TAB_MIN?.35:1}} disabled={altoTab<=TAB_MIN}
              onClick={()=>cambiarAltoTab(altoTab-2)}>−</button>
            <input type="range" min={TAB_MIN} max={TAB_MAX} step={1} value={altoTab}
              style={{flex:1,minWidth:0,accentColor:C.in,height:32}}
              onChange={e=>cambiarAltoTab(e.target.value)}/>
            <button style={{...S.sm(C.in),padding:'9px 14px',fontSize:15,minHeight:0,width:'auto',
              opacity:altoTab>=TAB_MAX?.35:1}} disabled={altoTab>=TAB_MAX}
              onClick={()=>cambiarAltoTab(altoTab+2)}>+</button>
          </div>
          {/* ── BAJAR EL BLOQUE ENTERO ── */}
          {/* iOS le da a la ventana menos alto del que tiene la pantalla, así
              que la barra se queda flotando. Esto la baja hasta el borde. */}
          <div style={{marginTop:12,paddingTop:10,borderTop:`1px dashed ${C.bd}`}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <span style={{fontSize:11.5,fontWeight:700,flex:1}}>⬇ Bajar la barra hasta el borde</span>
              <b style={{fontSize:12,color:bajarTab>0?C.sc:C.mt}}>{bajarTab} px</b>
              {bajarTab!==0&&(
                <button style={{...S.sm(C.mt),padding:'5px 9px',fontSize:10,minHeight:0,width:'auto'}}
                  onClick={()=>cambiarBajar(0)}>Quitar</button>
              )}
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <button style={{...S.sm(C.sc),padding:'9px 14px',fontSize:15,minHeight:0,width:'auto',
                opacity:bajarTab<=0?.35:1}} disabled={bajarTab<=0}
                onClick={()=>cambiarBajar(bajarTab-5)}>−</button>
              <input type="range" min={0} max={BAJAR_MAX} step={1} value={bajarTab}
                style={{flex:1,minWidth:0,accentColor:C.sc,height:32}}
                onChange={e=>cambiarBajar(e.target.value)}/>
              <button style={{...S.sm(C.sc),padding:'9px 14px',fontSize:15,minHeight:0,width:'auto',
                opacity:bajarTab>=BAJAR_MAX?.35:1}} disabled={bajarTab>=BAJAR_MAX}
                onClick={()=>cambiarBajar(bajarTab+5)}>+</button>
            </div>
            {(()=>{
              const falta=Math.max(0,((typeof window!=='undefined'&&window.screen&&window.screen.height)||0)
                -((typeof window!=='undefined'&&window.innerHeight)||0));
              return(
                <div style={{fontSize:10,color:C.mt,marginTop:6,lineHeight:1.45}}>
                  {falta>10
                    ? <>A tu pantalla le sobran <b style={{color:C.tx}}>{falta} px</b> por debajo de lo que
                       iOS le da a la app. Sube el cursor hasta que la barra llegue al borde.</>
                    : 'Súbelo si ves hueco blanco por debajo de la barra.'}
                  <div style={{marginTop:3}}>
                    Si al subirlo los rótulos se cortan por abajo, es que ahí no hay pantalla de verdad: bájalo.
                  </div>
                </div>
              );
            })()}
          </div>

          <div style={{fontSize:10,color:altoTab<44?C.wn:C.mt,marginTop:6,lineHeight:1.45}}>
            {altoTab<44
              ? '⚠ Por debajo de 44 px los botones se quedan pequeños para el dedo. Si te cuesta acertar, súbela un poco.'
              : 'Bájala para ganar pantalla, súbela si te cuesta acertar con el dedo. Los iconos y los rótulos se ajustan solos.'}
          </div>

          {/* ── BAJAR LA BARRA ENTERA ── */}
          {/* iOS le da a la app menos alto que la pantalla y queda una franja
              muerta abajo. Esto empuja la barra hacia ella. */}
          
        </div>

        {/* Medidas de la pantalla: para averiguar de una vez por qué la barra
            de abajo se sube en su móvil. Sale un recuadro con los números. */}
        <button style={{...S.sm(verDebug?C.dn:C.mt),width:'100%',marginTop:8,fontSize:10.5}}
          onClick={()=>setVerDebug(v=>!v)}>
          {verDebug?'Ocultar las medidas de pantalla':'📏 Ver medidas de pantalla'}
        </button>
        {verDebug&&<div style={{fontSize:10,color:C.mt,marginTop:5,lineHeight:1.45}}>
          Sale un recuadro verde arriba a la izquierda. Hazle una foto y mándala:
          con esos números se puede saber por qué la barra de abajo deja hueco.
        </div>}
      </div>

      {/* ── ☁️ NUBE Y SESIÓN — estado de sincronización y diagnóstico (solo app) ── */}
      {(()=>{
        const st=(window.storage&&typeof window.storage.getStatus==='function')?window.storage.getStatus():null;
        if(!st)return null;
        const diag=(window.bh10Diag&&window.bh10Diag())||null;
        return (
          <div style={{...S.card,marginBottom:10}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
              <span style={{fontWeight:700}}>☁️ Nube y sesión</span>
              <span style={{fontSize:11,fontWeight:700,color:st.fase==='ok'?C.sc:st.fase==='error'?C.dn:C.wn}}>
                {st.fase==='ok'?'● sincronizado':st.fase==='error'?'● error '+(st.error||''):st.fase==='sin-conexion'?'● sin conexión':st.fase==='dormida'?'● en pausa (app en segundo plano)':'● conectando…'}
              </span>
            </div>
            {diag&&(
              <div style={{fontSize:10,color:C.mt,marginBottom:8,lineHeight:1.5}}>
                🏢 <b style={{color:C.tx}}>{diag.empresa||'(sin nombre)'}</b> · {diag.modo==='lector'
                  ?<span style={{color:C.wn,fontWeight:700}}>👁 solo consulta — los cambios NO se guardan</span>
                  :<span style={{color:C.sc}}>✏️ administrador</span>}
                <br/>{diag.claves} datos sincronizados · {diag.correo}
              {/* El identificador hace falta para instalar el aviso de fichaje
                  y no se veía en ninguna parte. Con botón de copiar, porque
                  son veintitantos caracteres y a mano se falla. */}
              {diag.ruta&&(
                <div style={{display:'flex',alignItems:'center',gap:6,marginTop:5,flexWrap:'wrap'}}>
                  <span>🔑 Identificador:</span>
                  <code style={{background:C.bg,padding:'2px 6px',borderRadius:5,fontSize:10,
                    color:C.tx,userSelect:'all',wordBreak:'break-all'}}>
                    {uidDeRuta(diag.ruta)}
                  </code>
                  <button style={{...S.sm(C.in),padding:'3px 8px',fontSize:9,minHeight:0,width:'auto'}}
                    onClick={async()=>{
                      const id=uidDeRuta(diag.ruta);
                      try{await navigator.clipboard.writeText(id);notify('🔑 Identificador copiado');}
                      catch(x){notify('Cópialo a mano: '+id);}
                    }}>Copiar</button>
                </div>
              )}
                <br/>{st.conflicto
                  ?<b style={{color:C.dn}}>⛔ CONFLICTO: otro dispositivo (u otra pestaña) guardó datos más nuevos. Cierra la app en los demás sitios, pulsa «Recargar todo desde la nube» y vuelve a intentarlo.</b>
                  :st.errorEscritura
                  ?<b style={{color:C.dn}}>⛔ El último guardado FALLÓ: {st.errorEscritura}</b>
                  :st.pendientes>0
                  ?<span style={{color:C.wn}}>⏳ {st.pendientes} guardado(s) en curso…</span>
                  :st.ultimaEscritura
                  ?<span style={{color:C.sc}}>✔ Último guardado confirmado a las {new Date(st.ultimaEscritura).toLocaleTimeString('es-ES')}</span>
                  :<span style={{color:C.mt}}>Sin guardados aún en esta sesión</span>}
              </div>
            )}
            <button style={{...S.sm(C.vt),marginBottom:8}} onClick={async()=>{
              if(!window.bh10Capas){notify('No disponible','error');return;}
              notify('Comparando capas…');
              const r=await window.bh10Capas();
              const enPantalla=invoices.length;
              if(r.nube===enPantalla&&r.local===enPantalla){
                notify(`✅ Todo cuadra: ${enPantalla} facturas en la nube, en el móvil y en pantalla`);
                return;
              }
              // No basta con decir que no cuadra: hay que enseñar CUÁL falta.
              let guardadas=[];
              try{
                const bruto=await window.storage.get('bh10-fc-v3');
                guardadas=JSON.parse((bruto&&bruto.value)||'[]');
              }catch(e){}
              const enPantallaIds=new Set((invoices||[]).map(x=>x&&x.id));
              const faltan=(Array.isArray(guardadas)?guardadas:[]).filter((x,i)=>{
                if(!x||typeof x!=='object'||Array.isArray(x))return true;      // descartada al cargar
                return !enPantallaIds.has(x.id);
              }).map((x,i)=>({
                pos:i,
                valida:!!(x&&typeof x==='object'&&!Array.isArray(x)),
                proveedor:(x&&x.proveedor)||(x&&x.cliente)||'',
                numFactura:(x&&x.numFactura)||'',
                fecha:(x&&x.fecha)||'',
                total:(x&&x.total),
                id:(x&&x.id)||'',
                crudo:JSON.stringify(x).slice(0,90),
              }));
              setCapas({r,enPantalla,faltan,descartes:descartesDeCarga(),guardadas:Array.isArray(guardadas)?guardadas.length:0});
            }}>🔍 Comparar nube / móvil / pantalla</button>
            <button style={{...S.sm(C.ac),marginBottom:8,marginLeft:6}} onClick={async()=>{
              if(!window.bh10Test){notify('No disponible','error');return;}
              notify('Probando la nube…');
              const r=await window.bh10Test();
              const ok=r.escritura==='OK'&&r.lectura==='OK';
              notify(ok?`✅ Nube correcta · escritura y lectura OK · ${r.empresa} · modo ${r.modo}`:`❌ Fallo de nube · escritura ${r.escritura||'?'} · lectura ${r.lectura||'?'}${r.error?' · '+r.error:''}`,ok?undefined:'error');
            }}>🔬 Probar la nube</button>
            <BtnConfirm style={{...S.sm(C.in),marginBottom:8}} armStyle={{background:C.in,color:'#04120C'}} armedLabel="¿Recargar desde la nube? Toca otra vez" onConfirm={()=>{window.bh10Resync&&window.bh10Resync();}}>🔄 Recargar todo desde la nube</BtnConfirm>
            <button style={S.btn(C.dn)} onClick={()=>{window.bh10Logout&&window.bh10Logout();}}>Cerrar sesión</button>
            {/* v365 · para un ordenador prestado o un móvil que cambia de manos: caché local fuera y sesión cerrada */}
            {ES_APP&&<BtnConfirm style={S.btn(C.mt)} armStyle={{background:C.dn,color:'#fff'}} armedLabel="¿Olvidar este aparato? Toca otra vez" onConfirm={async()=>{
              // esta sesión sale de la lista de la nube antes de vaciar el aparato
              try{const rs=await window.storage.get('bh10-sesiones');const lista=rs?.value?JSON.parse(rs.value):[];if(Array.isArray(lista))await window.storage.set('bh10-sesiones',JSON.stringify(lista.filter(x=>x&&x.id!==SESION_ID)));}catch(e){}
              window.bh10OlvidarAparato&&window.bh10OlvidarAparato();}}>🧹 Olvidar este aparato</BtnConfirm>}
            <div style={{fontSize:10,color:C.mt,marginTop:6,lineHeight:1.4}}>Al cerrar sesión se vacía la copia local de este navegador (facturas, IBAN, nóminas). «Olvidar este aparato» hace lo mismo y además lo quita de la lista de sesiones.</div>
          </div>
        );
      })()}
      {(()=>{
        if(permitirSiembra()||esLector())return null;
        const eE=(employees||[]).filter(x=>x&&/^e\d{2}$/.test(String(x.id)));
        const eP=(polizas||[]).filter(x=>x&&/^imp-pz/.test(String(x.id)));
        const eF=(flota||[]).filter(x=>x&&/^imp-/.test(String(x.id)));
        const nomSeed=new Set(SEED_PROVCAT.map(s=>String(s.nombre||'').toUpperCase()));
        const arrPC=Array.isArray(provCat)?provCat:Object.values(provCat||{});
        const eC=arrPC.filter(x=>x&&nomSeed.has(String(x.nombre||'').toUpperCase()));
        const total=eE.length+eP.length+eF.length+eC.length;
        if(!total)return null;
        return (
          <div style={{...S.card,marginBottom:10,borderColor:C.wn+'66'}}>
            <div style={{fontWeight:700,marginBottom:4,color:C.wn}}>🧹 Datos de ejemplo heredados</div>
            <div style={{fontSize:11,color:C.mt,marginBottom:8}}>Esta empresa arrancó con datos de BIG HOUSE por un fallo ya corregido. Detectados: {eE.length} trabajador{eE.length!==1?'es':''} · {eP.length} póliza{eP.length!==1?'s':''} · {eF.length} vehículo{eF.length!==1?'s':''} · {eC.length} proveedor{eC.length!==1?'es':''}. Lo que hayas creado tú <b>no se toca</b>.</div>
            <BtnConfirm style={S.btn(C.dn)} armStyle={{opacity:.85}} armedLabel={`¿Borrar ${total} registros de ejemplo? Toca otra vez`} onConfirm={()=>{
              if(eE.length)saveEmployees((employees||[]).filter(x=>!(x&&/^e\d{2}$/.test(String(x.id)))));
              if(eP.length)persistPolizas((polizas||[]).filter(x=>!(x&&/^imp-pz/.test(String(x.id)))));
              if(eF.length)persistFlota((flota||[]).filter(x=>!(x&&/^imp-/.test(String(x.id)))));
              if(eC.length){const next=arrPC.filter(x=>!(x&&nomSeed.has(String(x.nombre||'').toUpperCase())));setProvCat(next);window.storage.set('bh10-provcat',JSON.stringify(next)).catch(()=>{});}
              notify(`🧹 ${total} registros de ejemplo eliminados`);
            }}>Limpiar {total} registros de ejemplo</BtnConfirm>
          </div>
        );
      })()}
      {cifFix&&(()=>{
        const faltan=provSinCif();
        return (
          <div style={S.overlay}>
            <div style={{...S.modal,maxWidth:470}} onClick={e=>e.stopPropagation()}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>🪪 Completar CIF de proveedores</div>
              <div style={{fontSize:11,color:C.mt,marginBottom:10}}>Sin CIF no pueden usar el portal. Rellena los que vayas a necesitar y pulsa Guardar.</div>
              {faltan.length===0?<div style={{fontSize:12,color:C.sc,textAlign:'center',padding:12}}>✓ Todos tus proveedores tienen CIF</div>:(
                <div style={{maxHeight:330,overflowY:'auto',marginBottom:10}}>
                  {faltan.map(p=>(
                    <div key={p.nombre} style={{display:'grid',gridTemplateColumns:'1fr 118px',gap:6,alignItems:'center',padding:'4px 0',borderBottom:`1px solid ${C.bd}`}}>
                      <span style={{fontSize:11,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.nombre}</span>
                      <input style={{...S.input,fontFamily:'monospace',fontSize:12,padding:'7px 8px'}} placeholder="B12345678" value={(cifFix&&cifFix[p.nombre])||''} onChange={e=>setCifFix(m=>({...m,[p.nombre]:e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'')}))}/>
                    </div>
                  ))}
                </div>
              )}
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button style={S.btn(C.sc)} onClick={()=>{
                  const arr=Array.isArray(provCat)?provCat:Object.values(provCat||{});
                  let n=0;
                  const next=arr.map(p=>{const v=cifFix[p.nombre];if(v&&v.length>=8&&normNIF(p.cif).length<8){n++;return {...p,cif:v};}return p;});
                  if(n){setProvCat(next);window.storage.set('bh10-provcat',JSON.stringify(next)).catch(()=>{});}
                  setCifFix(null);
                  notify(n?`✓ ${n} CIF guardados — pulsa "Publicar proveedores"`:'Sin cambios');
                }}>Guardar</button>
                <button style={S.ghost} onClick={()=>setCifFix(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* ── 🔑 CLAVE DEL LECTOR IA — necesaria en la app instalada ── */}
      {ES_APP&&!esLector()&&!esMiembro()&&(
        <div style={{...S.card,marginBottom:10}}>
          <div style={{fontWeight:700,marginBottom:4}}>🔑 Clave API de Anthropic — activa el escáner de PDFs y fotos</div>
          <div style={{fontSize:11,color:C.mt,marginBottom:8}}>Sin ella, el escáner no puede leer documentos. Se guarda en tu nube y no sale de tus dispositivos.</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            <input style={{...S.input,flex:'1 1 180px',fontFamily:'monospace',fontSize:11}} type="password" placeholder="sk-ant-…" value={anthKey} onChange={e=>setAnthKey(e.target.value)}/>
            <button style={S.sm(C.sc)} onClick={()=>{window.storage.set('bh10-anthkey',String(anthKey||'').trim()).then(()=>notify('🔑 Clave guardada — el escáner ya funciona')).catch(()=>notify('No se pudo guardar','error'));}}>Guardar</button>
          </div>
          <div style={{fontSize:9,color:anthKey?C.sc:C.wn,marginTop:6}}>{anthKey?'✔ Escáner activo':'⚠ Escáner inactivo: falta la clave'}</div>
        </div>
      )}
      {ES_APP&&!esLector()&&(
        <div style={{...S.card,marginBottom:10,borderColor:C.vt+'44'}}>
          <div style={{fontWeight:700,marginBottom:4}}>📎 Archivar documentos en facturas ya registradas</div>
          <div style={{fontSize:11,color:C.mt,marginBottom:8,lineHeight:1.5}}>Operación excepcional para poner al día el archivo. Escanea los documentos, busca a qué factura <b>ya registrada</b> corresponde cada uno y le adjunta el papel. <b>No crea facturas nuevas ni cambia importes, fechas ni estados de pago</b>: lo único que toca es el documento adjunto.</div>
          <label style={{...S.sm(C.vt),display:'inline-block',cursor:'pointer'}}>
            <input type="file" multiple accept="image/*,.pdf,application/pdf" style={{display:'none'}} onChange={e=>{if(e.target.files?.length)archivarDocumentos(e.target.files);e.target.value='';}}/>
            📎 Elegir documentos para archivar
          </label>
          <div style={{fontSize:9,color:C.mt,marginTop:6}}>Consume lecturas del escáner, igual que el registro normal.</div>
        </div>
      )}
      {ES_APP&&!esLector()&&!esMiembro()&&typeof window!=='undefined'&&window.bh10Buzon&&(
        <div style={{...S.card,marginBottom:10,borderColor:C.ac+'44'}}>
          <div style={{fontWeight:700,marginBottom:4}}>🔗 Portal de proveedores</div>
          <div style={{fontSize:11,color:C.mt,marginBottom:8}}>Enlace público para que tus proveedores te envíen facturas: escriben su CIF y nombre, eligen empresa y adjuntan el documento. Llegan a la bandeja de Recibidas.</div>
          <div style={{background:C.bg,borderRadius:8,padding:'8px 10px',fontSize:10,fontFamily:'monospace',wordBreak:'break-all',marginBottom:8,color:C.in}}>{(window.bh10Buzon.enlace&&window.bh10Buzon.enlace())||''}</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            <button style={S.sm(C.in)} onClick={()=>{const u=window.bh10Buzon.enlace();if(navigator.clipboard){navigator.clipboard.writeText(u);notify('Enlace copiado');}else notify(u);}}>📋 Copiar enlace</button>
            <button style={S.sm(C.ac)} onClick={activarPortal}>🔄 Activar / actualizar portal</button>
            <button style={S.sm(C.sc)} onClick={cargarBuzon}>📥 Ver envíos</button>

          </div>
          <div style={{fontSize:9,color:C.mt,marginTop:6}}>Pulsa «Activar» la primera vez y cada vez que crees o renombres una empresa.</div>
        </div>
      )}
      {typeof window!=='undefined'&&window.BH10_EMPRESA&&(
        <div style={{...S.card,marginBottom:10,borderColor:C.in+'44'}}>
          <div style={{fontWeight:700,marginBottom:2}}>🏢 {window.BH10_EMPRESA.nombre||'Empresa'}</div>
          <div style={{fontSize:11,color:esLector()?C.wn:C.sc,fontWeight:700,marginBottom:8}}>{esLector()?'👁 Solo consulta':'✏️ Administrador'}</div>
          {window.__BH10_MULTI&&<button style={S.btn(C.in)} onClick={()=>{window.bh10CambiarEmpresa&&window.bh10CambiarEmpresa();}}>Cambiar de empresa o modo</button>}
          {!esLector()&&window.bh10Empresas&&(
            <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.bd}`}}>
              <div style={{fontSize:10,fontWeight:700,color:C.mt,marginBottom:6}}>GESTIÓN DE EMPRESAS</div>
              <div style={{display:'flex',gap:6,marginBottom:8,flexWrap:'wrap'}}>
                <input style={{...S.input,flex:1,minWidth:150}} placeholder="Nuevo nombre de esta empresa" value={empRen} onChange={e=>setEmpRen(e.target.value)}/>
                <button style={S.sm(C.in)} onClick={async()=>{const n=empRen.trim();if(!n){notify('Escribe el nombre','error');return;}try{await window.bh10Empresas.renombrar(window.BH10_EMPRESA.sub||'',n);notify('✏️ Renombrada — recargando…');setTimeout(()=>location.reload(),700);}catch(e){notify('No se pudo renombrar: '+((e&&e.code)||e),'error');}}}>Renombrar</button>
              </div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                <input style={{...S.input,flex:1,minWidth:150}} placeholder="Nombre de la empresa nueva (p. ej. GGB)" value={empNueva} onChange={e=>setEmpNueva(e.target.value)}/>
                <button style={S.sm(C.sc)} onClick={async()=>{const n=empNueva.trim();if(!n){notify('Escribe el nombre','error');return;}try{await window.bh10Empresas.crear(n);notify('🏢 Empresa creada — recargando al selector…');setTimeout(()=>{try{localStorage.removeItem('bh10-empresa');localStorage.removeItem('bh10-modo');}catch(x){}location.reload();},900);}catch(e){notify('No se pudo crear: '+((e&&e.code)||e),'error');}}}>➕ Crear</button>
              </div>
              <div style={{fontSize:9,color:C.mt,marginTop:6}}>Las empresas nuevas nacen vacías. Este panel solo aparece en modo administrador.</div>
            </div>
          )}
        </div>
      )}
      {(()=>{const bor=invoicesAll.filter(i=>i&&i._del).sort((a,b)=>(b._del||0)-(a._del||0));if(!bor.length)return null;return(
        <div style={{...S.card,marginBottom:10,borderColor:C.wn+'44'}}>
          <div style={{fontWeight:700,marginBottom:4}}>🗑️ Papelera <span style={{fontSize:10,color:C.mt,fontWeight:500}}>{bor.length} factura{bor.length!==1?'s':''}</span></div>
          <div style={{fontSize:10,color:C.mt,marginBottom:8}}>Nada se borra de verdad hasta que tú lo digas: restaura con un toque o elimina definitivamente.</div>
          <div style={{maxHeight:230,overflowY:'auto'}}>
            {bor.slice(0,60).map(i=>(
              <div key={i.id} style={{display:'flex',alignItems:'center',gap:6,padding:'5px 0',borderBottom:`1px solid ${C.bd}`,fontSize:11}}>
                <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  <b>{i.proveedor||i.cliente||'—'}</b> · nº {i.numFactura||'s/n'} · {fmt(i.total||0)} €
                </span>
                <button style={S.sm(C.sc)} title="Restaurar" onClick={()=>restaurarFactura(i.id)}>↩️</button>
                <BtnConfirm style={S.sm(C.dn)} armStyle={{background:C.dn,color:'#fff'}} armedLabel="¿Seguro?" onConfirm={()=>{setInvoices(p=>p.filter(x=>x.id!==i.id));notify('Eliminada definitivamente');}}>✕</BtnConfirm>
              </div>
            ))}
          </div>
          {bor.length>1&&<div style={{marginTop:8}}>
            <BtnConfirm style={S.btn(C.dn)} armStyle={{opacity:.85}} armedLabel={`¿Eliminar ${bor.length} definitivamente? Toca otra vez`} onConfirm={()=>{setInvoices(p=>p.filter(x=>!(x&&x._del)));notify('Papelera vaciada');}}>Vaciar papelera ({bor.length})</BtnConfirm>
          </div>}
        </div>
      );})()}
      {ES_APP&&(
        <div style={{...S.card,marginBottom:10,borderColor:C.in+'44'}}>
          <div style={{fontWeight:700,marginBottom:4}}>🔒 Acceso con Face ID</div>
          {/* v365 · cierre automático por inactividad, por aparato */}
          <div style={{display:'flex',alignItems:'center',gap:8,margin:'4px 0 8px',fontSize:11}}>
            <span style={{color:C.mt}}>⏱ Cerrar sesión si no toco la app durante</span>
            <select value={autoCierre} onChange={e=>{const v=parseInt(e.target.value,10)||0;setAutoCierre(v);try{localStorage.setItem('bh10-autocierre',String(v));}catch(x){}}} style={{...S.input,width:'auto',padding:'4px 8px'}}>
              {[[0,'nunca'],[5,'5 min'],[15,'15 min'],[30,'30 min'],[60,'1 hora']].map(([m,l])=><option key={m} value={m}>{l}</option>)}
            </select>
          </div>
          <div style={{fontSize:11,color:C.mt,marginBottom:8}}>La app pide iniciar sesión en cada apertura; con Face ID entras sin teclear. Tu contraseña queda guardada <b>solo en este dispositivo</b>, protegida tras tu cara.</div>
          {faceOn?(
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
              <span style={{fontSize:11,color:C.sc,fontWeight:700}}>✓ Activado en este dispositivo</span>
              <button style={S.btn(C.dn)} onClick={toggleFaceID}>Desactivar</button>
            </div>
          ):(
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
              <input type="password" autoComplete="current-password" placeholder="Tu contraseña" style={{...S.input,maxWidth:180}} value={facePass} onChange={e=>setFacePass(e.target.value)}/>
              <button style={S.btn(C.in)} onClick={toggleFaceID}>Activar Face ID</button>
            </div>
          )}
        </div>
      )}

      {/* ── VERSIÓN E INSTALACIÓN DE ACTUALIZACIONES ── */}
      {ES_APP&&(
        <div style={{...S.card,marginBottom:10}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700}}>🔄 Versión de la app</div>
              <div style={{fontSize:11,color:C.mt,marginTop:2}}>
                Estás usando <b style={{color:C.tx}}>{APP_VERSION}</b>
                {actEstado==='nueva'&&<span style={{color:C.sc,fontWeight:700}}> · hay una versión más reciente</span>}
                {actEstado==='aldia'&&<span style={{color:C.sc}}> · es la última</span>}
                {actEstado==='buscando'&&<span style={{color:C.mt}}> · comprobando…</span>}
              </div>
              <div style={{fontSize:9,color:C.mt,marginTop:6,opacity:.75,lineHeight:1.4}}>
                El acceso está protegido por reCAPTCHA; se aplican la Política de privacidad y las Condiciones del servicio de Google.
              </div>
            </div>
            {actEstado==='nueva'
              ?<button style={S.btn(C.sc)} onClick={()=>{window.bh10Actualizar&&window.bh10Actualizar.aplicar();}}>⬇ Actualizar ahora</button>
              :<button style={{...S.sm(C.in),padding:'9px 12px'}} disabled={actEstado==='buscando'} onClick={async()=>{
                  if(!window.bh10Actualizar){notify('Solo disponible en la app instalada','error');return;}
                  setActEstado('buscando');
                  const hay=await window.bh10Actualizar.comprobar();
                  setActEstado(hay?'nueva':'aldia');
                  if(!hay)notify('✓ Ya tienes la última versión');
                }}>{actEstado==='buscando'?'⏳ Comprobando…':'Comprobar'}</button>}
          </div>
          <div style={{fontSize:10,color:C.mt,marginTop:6,lineHeight:1.4}}>Cuando se publica una versión nueva aparece un aviso abajo con el botón «Actualizar». Nada se actualiza sin que lo pulses: así no cambia el programa a media faena.</div>
        </div>
      )}
      <div style={{...S.card,marginBottom:10}}>
        <div style={{fontWeight:700,marginBottom:8}}>🎨 Apariencia <span style={{fontSize:9,color:C.mt,fontWeight:500}}>v71</span></div>
        <div style={{display:'flex',gap:6}}>
          {[['oscuro','🌙 Oscuro'],['claro','☀️ Claro'],['auto','🕐 Auto']].map(([t,l])=>(
            <button key={t} style={{flex:1,padding:'10px 4px',borderRadius:8,border:`1px solid ${tema===t?C.ac:C.bd}`,background:tema===t?C.ac+'22':'transparent',color:tema===t?C.ac:C.mt,fontWeight:700,fontSize:12,cursor:'pointer'}} onClick={()=>cambiarTema(t)}>{l}</button>
          ))}
        </div>
        <div style={{fontSize:10,color:C.mt,marginTop:6}}>Auto: claro de 8:00 a 20:00 según la hora del dispositivo</div>
        {/* Familias de color: cada una trae su versión de día y de noche */}
        <div style={{fontSize:10,fontWeight:700,color:C.mt,textTransform:'uppercase',letterSpacing:'.05em',margin:'12px 0 6px'}}>Color</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(96px,1fr))',gap:6}}>
          {TEMAS.map(t=>{
            const prev=(tema==='claro'||(tema==='auto'&&modoEfectivo('auto')==='claro'))?t.claro:t.oscuro;
            const activo=paleta===t.id;
            return(
              <button key={t.id} style={{padding:'8px 6px',borderRadius:9,border:`1px solid ${activo?C.ac:C.bd}`,background:activo?C.ac+'18':'transparent',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:5}} onClick={()=>cambiarPaleta(t.id)}>
                <span style={{display:'flex',gap:3}}>
                  {[prev.bg,prev.cd,prev.ac,prev.sc].map((c,ix)=><span key={ix} style={{width:13,height:13,borderRadius:4,background:c,border:`1px solid ${prev.bd}`}}/>)}
                </span>
                <span style={{fontSize:11,fontWeight:activo?800:600,color:activo?C.ac:C.mt}}>{activo?'✓ ':''}{t.nombre}</span>
              </button>
            );
          })}
        </div>
        <div style={{fontSize:10,color:C.mt,marginTop:6}}>El color se guarda en tu nube y se aplica en todos tus dispositivos. Verde, ámbar y rojo siguen significando lo mismo en todos los temas.</div>
      </div>
      {/* v363 · los datos de la empresa solo los edita quien tiene Ajustes en admin */}
      {!esLector()&&(
      <div style={{...S.card,marginBottom:10,borderColor:C.in+'44'}}>
        <div style={{fontWeight:700,marginBottom:8}}>🏦 Datos empresa ordenante</div>
        <div style={{color:C.mt,fontSize:11,marginBottom:8}}>Para ficheros SEPA de facturas y nóminas</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <label style={{gridColumn:'1/-1'}}><span style={{fontSize:10,color:C.mt}}>Razón social *</span><input style={S.input} value={compCfg.name} onChange={e=>setCompCfg(p=>({...p,name:e.target.value}))} placeholder="Big House 2010, S.L."/></label>
          {/* v389 · Jesús: «la de Viorel también cumplimentada». Los contratos de
              reserva y arras imprimen al representante de la parte vendedora
              (parteVendedora en ventas.js lo lee de aquí), pero NO había casilla
              para escribirlo y salía «no consta». */}
          <label><span style={{fontSize:10,color:C.mt}}>Representante (contratos de venta)</span><input style={S.input} placeholder="Nombre y apellidos" value={compCfg.representante||''} onChange={e=>setCompCfg({...compCfg,representante:e.target.value})}/></label>
          <label><span style={{fontSize:10,color:C.mt}}>DNI/NIE del representante</span><input style={S.input} placeholder="00000000X" value={compCfg.representanteDni||''} onChange={e=>setCompCfg({...compCfg,representanteDni:e.target.value})}/></label>
          <label style={{gridColumn:'1/-1'}}><span style={{fontSize:10,color:C.mt}}>Cargo (si no es «administrador»)</span><input style={S.input} placeholder="administrador" value={compCfg.representanteCargo||''} onChange={e=>setCompCfg({...compCfg,representanteCargo:e.target.value})}/></label>
          {(()=>{const f=[];if(!String(compCfg.name||'').trim())f.push('nombre');if(!String(compCfg.cif||'').trim())f.push('CIF');if(!normIban(compCfg.iban||''))f.push('IBAN');return f.length?(
            <div style={{background:C.wn+'18',border:`1px solid ${C.wn}55`,borderRadius:8,padding:'8px 10px',marginBottom:10,fontSize:11,color:C.wn}}>⚠️ Faltan datos de esta empresa ({f.join(', ')}). Rellénalos: los C34 y los documentos se emiten con ellos.</div>
          ):null;})()}
          {/* SERIE DE FACTURAS EMITIDAS · vive en bh10-company-v2, que es la
              configuración de ESTA empresa: cada una guarda la suya en su propio
              espacio y se recarga al abrir la app. La última usada la escribe
              Jesús una vez; a partir de ahí la app va correlativa y cambia de
              prefijo sola cada 1 de enero. */}
          <label style={{gridColumn:'1/-1',display:'block',marginBottom:8}}>
            <span style={{fontSize:10,color:C.mt}}>Última factura emitida <span style={{opacity:.6}}>(serie AAnnnnn — p. ej. 2600055. La siguiente saldrá correlativa)</span></span>
            <input style={{...S.input,fontFamily:'monospace'}} inputMode="numeric" placeholder="2600055"
              value={compCfg.ultimaEmitida||''}
              onChange={e=>setCompCfg(p=>({...p,ultimaEmitida:e.target.value.replace(/[^0-9]/g,'').slice(0,7)}))}/>
            {String(compCfg.ultimaEmitida||'').length>0&&String(compCfg.ultimaEmitida||'').length<7
              ? <span style={{fontSize:10,color:C.dn}}>Han de ser 7 cifras: dos de año y cinco de contador</span>
              : (esSerieNueva(String(compCfg.ultimaEmitida||''))
                  ? <span style={{fontSize:10,color:C.sc}}>La próxima será {siguienteNumero({usados:[...invoicesAll.filter(x=>x&&x.tipo==='cobro').map(x=>x.numFactura),...(contratos||[]).filter(c=>c&&c.tipo==='factura_emitida').map(c=>c.numero)],semilla:String(compCfg.ultimaEmitida),fecha:today})}</span>
                  : null)}
          </label>
          {!esLector()&&(
            <div style={{gridColumn:'1/-1',borderTop:`1px solid ${C.bd}33`,paddingTop:8,marginTop:2}}>
              <div style={{fontWeight:700,fontSize:11,marginBottom:4}}>🔠 Homogeneizar nombres</div>
              <div style={{fontSize:10,color:C.mt,marginBottom:6}}>Pasa a MAYÚSCULAS clientes y proveedores en todas las facturas y contratos, y sus fichas (nombre, dirección, CIF/DNI, notas). Nombres que solo se distinguían por las mayúsculas quedan unificados, con las fichas fundidas. El email no se toca.</div>
              <BtnConfirm style={{...S.sm(C.in),fontSize:11}} armStyle={{background:C.wn}} onConfirm={normalizarMayusculas}>Pasar todo a MAYÚSCULAS</BtnConfirm>
            </div>
          )}
          <label style={{display:'block',marginBottom:8}}><span style={{fontSize:10,color:C.mt}}>Marca comercial <span style={{opacity:.6}}>(cabecera de presupuestos y facturas)</span></span><input style={S.input} value={compCfg.marca||''} onChange={e=>setCompCfg(p=>({...p,marca:e.target.value}))} placeholder={marcaDoc()}/></label>
          <label><span style={{fontSize:10,color:C.mt}}>CIF / NIF</span><input style={{...S.input,fontFamily:'monospace'}} value={compCfg.cif||''} onChange={e=>setCompCfg(p=>({...p,cif:e.target.value.toUpperCase()}))} placeholder="B45731981"/></label>
          <label><span style={{fontSize:10,color:C.mt}}>País</span><input style={S.input} value={compCfg.country||'ES'} onChange={e=>setCompCfg(p=>({...p,country:e.target.value.toUpperCase()}))} maxLength={2}/></label>
          <label style={{gridColumn:'1/-1'}}><span style={{fontSize:10,color:C.mt}}>Dirección</span><input style={S.input} value={compCfg.address||''} onChange={e=>setCompCfg(p=>({...p,address:e.target.value}))} placeholder="CL Neón, s/n"/></label>
          <label><span style={{fontSize:10,color:C.mt}}>Localidad</span><input style={S.input} value={compCfg.city||''} onChange={e=>setCompCfg(p=>({...p,city:e.target.value}))} placeholder="Illescas"/></label>
          <label><span style={{fontSize:10,color:C.mt}}>Teléfono</span><input style={S.input} value={compCfg.phone||''} onChange={e=>setCompCfg(p=>({...p,phone:e.target.value}))} placeholder="925 000 000"/></label>
          <label style={{gridColumn:'1/-1'}}><span style={{fontSize:10,color:C.mt}}>Email</span><input style={S.input} value={compCfg.email||''} onChange={e=>setCompCfg(p=>({...p,email:e.target.value}))} placeholder="admin@bh10group.es"/></label>
          <label style={{gridColumn:'1/-1'}}><span style={{fontSize:10,color:C.mt}}>Registro Mercantil (pie de factura)</span><input style={S.input} value={compCfg.regMercantil||''} onChange={e=>setCompCfg(p=>({...p,regMercantil:e.target.value}))} placeholder="Reg. Mercantil de Toledo, Tomo X, Folio Y, Hoja TO-12345"/></label>
          <label style={{gridColumn:'1/-1'}}><span style={{fontSize:10,color:C.mt}}>IBAN cuenta ordenante *</span><input style={{...S.input,fontFamily:'monospace',letterSpacing:'1px'}} value={compCfg.iban} onChange={e=>setCompCfg(p=>({...p,iban:e.target.value.toUpperCase()}))} placeholder="ES00 0000 0000 00 0000000000"/></label>
          <label><span style={{fontSize:10,color:C.mt}}>BIC / SWIFT</span><input style={{...S.input,fontFamily:'monospace'}} value={compCfg.bic} onChange={e=>setCompCfg(p=>({...p,bic:e.target.value.toUpperCase()}))} placeholder="ERSVES22XXX"/></label>
          <label><span style={{fontSize:10,color:C.mt}}>Límite del banco (€/remesa y día)</span><input style={S.input} inputMode="decimal" value={compCfg.sepaLimite||''} onChange={e=>setCompCfg(p=>({...p,sepaLimite:e.target.value}))} placeholder="60.000"/></label>
        </div>
        <button style={{...S.btn(C.sc),marginTop:10,width:'100%'}} onClick={saveCompany}>💾 Guardar datos empresa</button>
      </div>
      )}
      {/* ── VERSIÓN DE LA APP ── */}
      <div style={{...S.card,marginBottom:10}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700}}>📦 Versión instalada</div>
            <div style={{fontSize:11,color:C.mt,marginTop:2}}>
              Estás en <b style={{color:C.tx,fontFamily:'monospace'}}>{APP_VERSION}</b>
              {verEstado.cuando?` · comprobado a las ${verEstado.cuando}`:''}
            </div>
          </div>
          <div style={{fontSize:22}}>{verEstado.hay?'🆕':'✓'}</div>
        </div>
        {verEstado.msg&&(
          <div style={{background:(verEstado.hay?C.sc:C.mt)+'14',border:`1px solid ${(verEstado.hay?C.sc:C.bd)}`,
            borderRadius:9,padding:'8px 10px',marginTop:8,fontSize:11,color:verEstado.hay?C.sc:C.mt}}>
            {verEstado.msg}
          </div>
        )}
        <div style={{display:'flex',gap:6,marginTop:9,flexWrap:'wrap'}}>
          <button style={{...S.sm(C.in),flex:'1 1 140px',fontSize:11,opacity:verBuscando?.6:1}} disabled={verBuscando}
            onClick={async()=>{
              const p=(typeof window!=='undefined')&&window.bh10Actualizar;
              if(!p){setVerEstado({hay:false,msg:'La comprobación solo funciona en la app instalada, no abriéndola desde el editor.',cuando:''});return;}
              setVerBuscando(true);
              setVerEstado(v=>({...v,msg:'Preguntando al servidor…'}));
              try{
                const hay=await p.comprobar();
                const hora=new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
                setVerEstado(hay
                  ? {hay:true, msg:'Hay una versión nueva lista. Pulsa «Actualizar ahora» para pasar a ella.', cuando:hora}
                  : {hay:false, msg:'Estás en la última versión publicada.', cuando:hora});
              }catch(e){
                setVerEstado({hay:false,msg:'No se pudo comprobar: '+((e&&e.message)||e),cuando:''});
              }
              setVerBuscando(false);
            }}>{verBuscando?'⏳ Comprobando…':'🔄 Comprobar si hay versión nueva'}</button>
          {verEstado.hay&&(
            <button style={{...S.btn(C.sc),flex:'1 1 140px',fontSize:12}} onClick={()=>{
              const p=(typeof window!=='undefined')&&window.bh10Actualizar;
              if(p)p.aplicar();
            }}>⬆️ Actualizar ahora</button>
          )}
        </div>
        <div style={{fontSize:10,color:C.mt,marginTop:7,lineHeight:1.45}}>
          La app ya comprueba sola cada cierto tiempo y cada vez que vuelves a ella. Esto sirve para forzarlo ahora mismo, justo después de subir una versión.
        </div>
      </div>

      {/* ── PLANIFICACIÓN MENSUAL ── */}
      {!esLector()&&(
        <div style={{...S.card,marginBottom:10}}>
          <div style={{fontWeight:700,marginBottom:4}}>📅 Planificación mensual</div>
          <div style={{fontSize:11,color:C.mt,marginBottom:8,lineHeight:1.5}}>
            El horario previsto de cada trabajador, mes a mes. Es lo que permitirá
            avisar a quien no haya fichado y calcular después las horas de más y de menos.
          </div>
          {planMeses.length>0&&(
            <div style={{background:C.bg,borderRadius:9,padding:'8px 10px',marginBottom:8,fontSize:11}}>
              <div style={{fontSize:10,color:C.mt,marginBottom:3}}>MESES CARGADOS</div>
              {planMeses.slice(-6).reverse().map(m=>(
                <div key={m.mes} style={{display:'flex',justifyContent:'space-between',gap:8,padding:'2px 0'}}>
                  <b>{m.mes}</b>
                  <span style={{color:C.mt}}>{m.dias} días · {fmt(m.horas)} h · {m.trabajadores} personas</span>
                </div>
              ))}
            </div>
          )}
          <label style={{...S.btn(C.in),width:'100%',cursor:'pointer',display:'block',textAlign:'center'}}>
            📥 Importar planificación (Excel)
            <input type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}} onChange={async e=>{
              const f=e.target.files&&e.target.files[0]; e.target.value='';
              if(!f)return;
              try{
                const XLSX=await import('xlsx');
                const wb=XLSX.read(await f.arrayBuffer());
                // La hoja de la cuadrícula, no la de códigos
                const nom=wb.SheetNames.find(n=>/planif/i.test(n))||wb.SheetNames[0];
                const filas=XLSX.utils.sheet_to_json(wb.Sheets[nom],{header:1,defval:''});
                const r=leerPlanificacion(filas,employees);
                if(!r.lineas.length&&r.avisos.length){notify(r.avisos[0],'error');return;}
                setPlanImport({...r,nombre:f.name,resumen:resumenPlan(r.lineas)});
              }catch(x){notify('No se pudo leer: '+((x&&x.message)||x),'error');}
            }}/>
          </label>
          <div style={{fontSize:10,color:C.mt,marginTop:7,lineHeight:1.45}}>
            Trabajadores en filas y días en columnas. En cada casilla, el horario
            (<b style={{color:C.tx}}>08:00-17:00</b>) o un código: L libre, F festivo, V vacaciones, B baja, P permiso.
          </div>
        </div>
      )}

      {/* ── CUSTODIA DE DATOS PERSONALES ── */}
      {!esLector()&&(
        <div style={{...S.card,marginBottom:10,borderColor:C.wn+'44'}}>
          <div style={{fontWeight:700,marginBottom:4}}>🔍 Remesas y pagos</div>
          <div style={{fontSize:11,color:C.mt,marginBottom:8,lineHeight:1.5}}>
            El cruce de septiembre, dentro de la app: remesas del histórico sin ningún pago apuntado, facturas metidas en dos remesas y, si cargas un extracto Norma 43 del banco, pagos apuntados que no aparecen en la cuenta (sin contar efectivo, tarjeta, préstamo promotor o pago anticipado) y pendientes que sí tienen su cargo.
          </div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
            <button style={S.sm(C.wn)} onClick={()=>{
              const sp=remesasSinPagos(remesas,invoices),varias=facturasEnVariasRemesas(remesas,invoices);
              setAudit(a=>({...(a||{}),sp,varias}));
              notify(`🔍 ${sp.length} remesas sin pagos · ${varias.length} facturas en varias remesas`,(sp.length||varias.length)?'error':'success');
            }}>🔍 Revisar remesas</button>
            <label style={{...S.sm(C.in),display:'inline-block',cursor:'pointer'}}>📂 Contrastar con extracto N43<input type="file" accept=".txt,.n43,.q43,.dat,text/plain" style={{display:'none'}} onChange={e=>{
              const f=e.target.files&&e.target.files[0];if(!f)return;const rd=new FileReader();
              rd.onload=()=>{const movs=parseN43(String(rd.result||''));if(!movs.length){notify('No se encontraron movimientos — ¿es un fichero Norma 43?','error');return;}
                const sr=pagosSinRastro(invoices,movs,remesas),pc=pendientesConCargo(invoices,movs);
                const fechas=movs.map(m=>m.fechaOp).sort();
                setAudit(a=>({...(a||{}),sr,pc,extracto:{nombre:f.name,movs:movs.length,desde:fechas[0],hasta:fechas[fechas.length-1]}}));
                notify(`📂 ${movs.length} movimientos (${fechas[0]} → ${fechas[fechas.length-1]}) · ${sr.length} pagos sin rastro · ${pc.length} pendientes con cargo`,(sr.length||pc.length)?'error':'success');};
              rd.readAsText(f,'latin1');e.target.value='';}}/></label>
            {audit&&<button style={S.sm(C.mt)} onClick={()=>shareOrDownload('\ufeff'+csvAuditoria(audit),`auditoria_remesas_pagos_${today}.csv`,'text/csv;charset=utf-8')}>⬇️ CSV</button>}
          </div>
          {audit&&(
            <div style={{background:C.bg,borderRadius:9,padding:'9px 11px',fontSize:11}}>
              {audit.sp&&<div style={{marginBottom:6}}><b style={{color:audit.sp.length?C.wn:C.sc}}>Remesas sin pagos apuntados: {audit.sp.length}</b>
                {audit.sp.slice(0,8).map((x,k)=><div key={k} style={{color:C.mt}}>{fmtDate(x.remesa.fecha)} · {x.lineas} líneas · {fmt(x.remesa.total)} € · {x.remesa.fichero||''} — en Facturas → Remesas: «Marcar pagadas ahora» o «no se ejecutó»</div>)}</div>}
              {audit.varias&&<div style={{marginBottom:6}}><b style={{color:audit.varias.length?C.wn:C.sc}}>Facturas en varias remesas: {audit.varias.length}</b>
                {audit.varias.slice(0,12).map((x,k)=><div key={k} style={{color:C.mt}}>{x.factura.proveedor} nº {x.factura.numFactura||'s/n'} · {fmt(x.factura.total)} € → {x.remesas.map(r=>fmtDate(r.fecha||'')||r.msgId).join(' + ')}{x.saldo>0.01?<span style={{color:C.wn}}> · pendiente {fmt(x.saldo)} €</span>:''}</div>)}
                {audit.varias.length>12&&<div style={{color:C.mt}}>… y {audit.varias.length-12} más (en el CSV)</div>}</div>}
              {audit.extracto&&<div style={{color:C.mt,marginBottom:4}}>Extracto: {audit.extracto.nombre} · {audit.extracto.movs} movimientos · {fmtDate(audit.extracto.desde)} → {fmtDate(audit.extracto.hasta)}</div>}
              {audit.sr&&<div style={{marginBottom:6}}><b style={{color:audit.sr.length?C.dn:C.sc}}>Pagos apuntados sin rastro en el extracto: {audit.sr.length}</b>
                {audit.sr.slice(0,15).map((x,k)=><div key={k} style={{color:C.mt}}>pago {fmtDate(x.pago.fecha)} {fmt(x.pago.importe)} € · {x.factura.proveedor} nº {x.factura.numFactura||'s/n'} · {x.pago.metodo||'—'} · <span style={{color:C.dn}}>{x.motivo}</span></div>)}
                {audit.sr.length>15&&<div style={{color:C.mt}}>… y {audit.sr.length-15} más (en el CSV)</div>}</div>}
              {audit.pc&&<div><b style={{color:audit.pc.length?C.dn:C.sc}}>Pendientes con cargo en el extracto: {audit.pc.length}</b>
                {audit.pc.slice(0,15).map((x,k)=><div key={k} style={{color:C.mt}}>{x.factura.proveedor} nº {x.factura.numFactura||'s/n'} · pendiente {fmt(x.saldo)} € ← {fmtDate(x.mov.fechaOp)} {String(x.mov.texto||'').slice(0,40)} {fmt(x.mov.importe)} € ({x.por})</div>)}</div>}
            </div>
          )}
        </div>
      )}
      {ES_APP&&!esLector()&&window.bh10Adj&&(
        <div style={{...S.card,marginBottom:10,borderColor:C.in+'44'}}>
          <div style={{fontWeight:700,marginBottom:4}}>🔍 Comprobar documentos enlazados</div>
          <div style={{fontSize:11,color:C.mt,marginBottom:8,lineHeight:1.5}}>
            Lee una a una las facturas con documento y comprueba que se abre y está entero. Las que no, salen aquí con proveedor, número e importe para readjuntarlas desde el correo antes del envío a la gestoría.
          </div>
          {compDocs&&compDocs.en&&<div style={{fontSize:11,color:C.tx,marginBottom:6}}>Comprobando {compDocs.vistos} de {compDocs.total}… <button style={S.sm(C.mt)} onClick={()=>{compDocsParar.current=true;}}>Parar</button></div>}
          {compDocs&&!compDocs.en&&(
            <div style={{background:C.bg,borderRadius:9,padding:'9px 11px',marginBottom:8,fontSize:11}}>
              <div style={{fontWeight:700,color:compDocs.malos.length?C.dn:C.sc}}>
                {compDocs.vistos} comprobadas{compDocs.vistos<compDocs.total?' de '+compDocs.total+' (parado)':''} · {compDocs.malos.length?compDocs.malos.length+' con problema':'todas se abren y están enteras ✓'}
              </div>
              {(()=>{const n=invoices.filter(i=>esGastoFiscal(i)&&!i.adjPath).length;return n?<div style={{fontSize:10,color:C.mt,marginTop:3}}>Además, {n} facturas no tienen ningún documento adjuntado (aquí solo se comprueban las que tienen enlace): las ves con 📎 Sin doc en Recibidas.</div>:null;})()}
              {compDocs.malos.map((m,k)=>(
                <div key={k} style={{borderTop:`1px solid ${C.bd}33`,padding:'5px 0'}}>
                  <div>{m.inv.fecha} · <b>{m.inv.proveedor||'(sin proveedor)'}</b> · nº {m.inv.numFactura||'s/n'} · {fmt(m.inv.total)} €</div>
                  <div style={{fontSize:10,color:C.dn}}>{m.motivo}</div>
                </div>
              ))}
            </div>
          )}
          <button style={{...S.sm(C.in),width:'100%',fontSize:11}} disabled={!!(compDocs&&compDocs.en)} onClick={async()=>{
            const lista=invoices.filter(i=>i.adjPath&&!esAnulada(i));
            compDocsParar.current=false;
            setCompDocs({en:true,vistos:0,total:lista.length,malos:[]});
            const malos=[];let vistos=0;
            for(const i of lista){
              if(compDocsParar.current)break;
              const esq=esquemaEnlace(i.adjPath);
              if(!esq.ok)malos.push({inv:i,motivo:esq.motivo});
              else{
                try{
                  // 1) ¿confirmado por el servidor? (caché local ≠ nube)
                  if(window.bh10Adj.enNube){const n=await window.bh10Adj.enNube(i.adjPath);if(!n.ok)throw errorDefinitivo(n.motivo);}
                  // 2) ¿se baja y está entero?
                  await conReintentos(async()=>{
                    const r=await window.bh10Adj.blobDe(i.adjPath);
                    if(r===null)throw errorDefinitivo('no existe en la nube (enlace roto)');
                    const blob=(r&&r.blob)?r.blob:r;
                    if(!blob||typeof blob.arrayBuffer!=='function')throw new Error('respuesta sin documento');
                    const motivo=sanoDocumento(new Uint8Array(await blob.arrayBuffer()),blob.type,r&&r.nombre);
                    if(motivo)throw new Error(motivo);
                  },{intentos:2,esperas:[1200]});
                }catch(e){malos.push({inv:i,motivo:(e&&e.message)||'error desconocido'});}
              }
              vistos++;
              if(vistos%5===0)setCompDocs({en:true,vistos,total:lista.length,malos:[...malos]});
            }
            setCompDocs({en:false,vistos,total:lista.length,malos});
            // Lo comprobado queda apuntado en cada factura: ⏳ en las que no están en la nube
            const malosIds=new Set(malos.map(m=>m.inv.id)),vistosIds=new Set(lista.slice(0,vistos).map(i=>i.id));
            setInvoices(p=>p.map(i=>vistosIds.has(i.id)?{...i,adjNube:!malosIds.has(i.id)}:i));
            notify(malos.length?`🔍 ${malos.length} documentos con problema de ${vistos}`:`🔍 ${vistos} documentos comprobados: todos bien`,malos.length?'error':undefined);
          }}>🔍 Comprobar {invoices.filter(i=>i.adjPath&&!esAnulada(i)).length} documentos</button>
        </div>
      )}
      {ES_APP&&!esLector()&&!esMiembro()&&window.bh10Dni&&(
        <div style={{...S.card,marginBottom:10,borderColor:C.vt+'44'}}>
          <div style={{fontWeight:700,marginBottom:4}}>🔒 Custodia y destrucción de datos</div>
          <div style={{fontSize:11,color:C.mt,marginBottom:8,lineHeight:1.5}}>
            Qué datos personales estás guardando, desde cuándo y cuándo hay que destruirlos.
            Los plazos se cuentan <b>desde el último uso</b>, no desde que se recibieron.
          </div>
          <div style={{background:C.bg,borderRadius:9,padding:'9px 11px',marginBottom:8,fontSize:10,color:C.mt,lineHeight:1.6}}>
            {Object.values(PLAZOS).map(p=>(
              <div key={p.que} style={{marginBottom:3}}>
                <b style={{color:C.tx}}>{p.que}</b> · {p.meses<12?p.meses+' meses':(p.meses/12)+' años'}
                <div style={{fontSize:9}}>{p.por}</div>
              </div>
            ))}
          </div>
          <button style={{...S.sm(C.vt),width:'100%',fontSize:11}} onClick={async()=>{
            notify('Revisando lo guardado…');
            // Si falta la regla de Firestore, esto responde permission-denied.
            // No se traga el error: se enseña con lo que hay que hacer.
            let docs=[],err='';
            try{docs=await window.bh10Dni.listar();}
            catch(e){err=String((e&&e.code)||e);}
            let reg={clientes:[],proveedores:[],error:''};
            try{if(window.bh10Rgpd)reg=await window.bh10Rgpd();}catch(e){if(!err)err=String((e&&e.code)||e);}
            const cli=(cliCat||[]).map(c=>({nombre:c.nombre,ultimo:ultimoUsoCliente(c.nombre,invoices,contratos)}));
            const prov=(provCat||[]).map(p=>({nombre:p.nombre,ultimo:(()=>{
              const n=normProvNombre(p.nombre||'');
              return (invoices||[]).filter(x=>x&&x.tipo!=='cobro'&&normProvNombre(x.proveedor)===n)
                .map(x=>x.fecha).filter(Boolean).sort().pop()||'';
            })()}));
            setCustodia({docs,cli,prov,reg,err:err||reg.error||'',pestana:'clientes'});
          }}>🔍 Ver qué se está guardando</button>
        </div>
      )}
      {/* ── VERI*FACTU ── */}
      {ES_APP&&!esLector()&&(
        <div style={{...S.card,marginBottom:10}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700}}>🧾 Registro VERI*FACTU</div>
              <div style={{fontSize:11,color:vfActivo(vfCfg)?C.sc:C.mt}}>
                {vfActivo(vfCfg)?`Activo desde ${fmtDate(vfCfg.desde)} · entorno ${vfCfg.entorno}`:'Desactivado — la facturación funciona como siempre'}
              </div>
            </div>
            <label style={{flexShrink:0,cursor:esLector()?'default':'pointer'}}>
              <input type="checkbox" disabled={esLector()} checked={vfActivo(vfCfg)} style={{width:22,height:22,accentColor:C.sc}}
                onChange={e=>{
                  if(e.target.checked){
                    const falta=vfListoParaActivar(vfCfg,{nif:compCfg.cif,nombre:compCfg.name,productorNif:vfCfg.productorNif||compCfg.cif});
                    if(falta.length){notify('Antes de activarlo falta: '+falta.join(', '),'error');return;}
                  }
                  const {cfg,eventos}=vfCambiarConfig(vfCfg,{activo:e.target.checked},today);
                  persistVfCfg(cfg); anotarEventos(eventos);
                  notify(e.target.checked?'🧾 Registro activado: las facturas emitidas a partir de hoy se registrarán':'Registro desactivado. Lo ya registrado se conserva.');
                }}/>
            </label>
          </div>

          {!vfActivo(vfCfg)&&(
            <div style={{fontSize:10,color:C.mt,marginTop:6,lineHeight:1.45}}>
              Rellena primero lo de abajo y después enciéndelo. Mientras esté apagado no se genera ningún registro ni se envía nada: las facturas se emiten exactamente igual que hasta ahora.
              {vfRegistros.length>0&&<div style={{color:C.wn,marginTop:3}}>⚠ Hay {vfRegistros.length} registros ya creados. Se conservan: al volver a activarlo, la cadena continúa donde se quedó.</div>}
            </div>
          )}

          {/* Dónde va el certificado. Es lo que más se pregunta y no estaba dicho. */}
          <div style={{background:C.in+'10',border:`1px solid ${C.in}40`,borderRadius:9,padding:'9px 11px',marginTop:9,fontSize:10,lineHeight:1.5,color:C.mt}}>
            <div style={{fontWeight:700,color:C.in,fontSize:11,marginBottom:3}}>🔐 ¿Dónde va el certificado?</div>
            Aquí no, y no es un olvido: el navegador no puede usarlo para conectar con la AEAT, y un certificado dentro del móvil dejaría actuar como la empresa ante Hacienda a quien entre en la app.
            <div style={{marginTop:5}}>El certificado vive en <b>la pasarela</b>, que va en el mismo paquete de la app y se instala una sola vez. Dos opciones:</div>
            <div style={{marginTop:3}}>· <b>aeat/cloudflare-worker.js</b> — recomendado si usas Cloudflare: el certificado queda en su almacén y no se puede descargar.</div>
            <div>· <b>aeat/enviar.php</b> — para un servidor propio con PHP; el certificado va FUERA de la carpeta pública.</div>
            <div>· <b>aeat/firebase-enviarAeat.js</b> — función de Firebase con el certificado en Secret Manager.</div>
            <div style={{marginTop:5}}>Después escribe abajo su dirección y su token. Eso es lo único que guarda la app.</div>
          </div>

          {(
            <>
              <div style={{background:C.bg,borderRadius:9,padding:'9px 11px',marginTop:8}}>
                {(()=>{const r=vfResumenEnvio(vfRegistros);return(
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,textAlign:'center'}}>
                    {[['Registradas',r.total,C.tx],['Aceptadas',r.aceptados,C.sc],['Rechazadas',r.rechazados,C.dn],['Pendientes',r.pendientes+r.conError,C.wn]].map(([l,v,col])=>(
                      <div key={l}><div style={{fontSize:9,color:C.mt}}>{l}</div><div style={{fontSize:14,fontWeight:800,color:col}}>{v}</div></div>
                    ))}
                  </div>
                );})()}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:8}}>
                <label><span style={{fontSize:10,color:C.mt}}>Entorno</span>
                  <select style={S.select} value={vfCfg.entorno} onChange={e=>{
                    const {cfg,eventos}=vfCambiarConfig(vfCfg,{entorno:e.target.value},today);
                    persistVfCfg(cfg); anotarEventos(eventos);
                  }}>
                    <option value="pruebas">Pruebas</option><option value="produccion">Producción</option>
                  </select></label>
                <label><span style={{fontSize:10,color:C.mt}}>NIF del productor</span>
                  <input style={S.input} value={vfCfg.productorNif||''} placeholder={compCfg.cif||'B00000000'}
                    onChange={e=>persistVfCfg({...vfCfg,productorNif:e.target.value})}/></label>
                <label style={{gridColumn:'1/-1'}}><span style={{fontSize:10,color:C.mt}}>Dirección de la pasarela de envío</span>
                  <input style={{...S.input,fontSize:16}} value={vfCfg.pasarela||''} placeholder="https://bh10group.com/aeat/enviar.php"
                    onChange={e=>persistVfCfg({...vfCfg,pasarela:e.target.value})}/></label>
                <label style={{gridColumn:'1/-1'}}><span style={{fontSize:10,color:C.mt}}>Qué se imprime en la factura</span>
                  <select style={S.select} value={vfCfg.detalleFactura||'completo'} onChange={e=>persistVfCfg({...vfCfg,detalleFactura:e.target.value})}>
                    <option value="completo">QR, leyenda, huella completa y CSV</option>
                    <option value="basico">QR, leyenda y huella abreviada</option>
                  </select></label>
                <label style={{gridColumn:'1/-1'}}><span style={{fontSize:10,color:C.mt}}>Token de la pasarela</span>
                  <input style={{...S.input,fontSize:16}} type="text" autoCapitalize="off" autoCorrect="off" spellCheck={false}
                    value={vfCfg.token||''}
                    onChange={e=>persistVfCfg({...vfCfg,token:String(e.target.value).replace(/\s+/g,'')})}/>
                  <span style={{fontSize:9,color:C.mt}}>{(vfCfg.token||'').length} caracteres · debe ser idéntico al que puso el instalador</span></label>
              </div>
              {vfCfg.entorno==='produccion'&&(
                <div style={{background:C.wn+'14',border:`1px solid ${C.wn}55`,borderRadius:8,padding:'7px 10px',marginTop:8,fontSize:10,color:C.wn}}>
                  ⚠ En producción, cada factura que registres se comunica a la AEAT de verdad y no se puede deshacer: solo anular.
                </div>
              )}
              <div style={{display:'flex',gap:6,marginTop:10,flexWrap:'wrap'}}>
                <button style={{...S.btn(C.in),flex:'1 1 150px',opacity:vfProbando?.6:1}} disabled={vfProbando||!String(vfCfg.pasarela||'').trim()} onClick={probarPasarela}>
                  {vfProbando?'⏳ Probando…':'🔐 Probar la pasarela'}
                </button>
                {vfActivo(vfCfg)&&<button style={{...S.btn(C.ac),flex:'1 1 150px'}} onClick={()=>setVfVer(true)}>🧾 Ver registros y enviar</button>}
              </div>
              {vfPrueba&&(
                <div style={{background:(vfPrueba.ok?C.sc:C.dn)+'14',border:`1px solid ${(vfPrueba.ok?C.sc:C.dn)}55`,borderRadius:8,padding:'8px 10px',marginTop:8,fontSize:11,color:vfPrueba.ok?C.sc:C.dn}}>
                  <b>{vfPrueba.ok?'✓ La pasarela responde y el certificado está cargado':'⛔ '+vfPrueba.msg}</b>
                  {vfPrueba.detalle&&<div style={{fontSize:10,color:C.mt,marginTop:2}}>{vfPrueba.detalle}</div>}
                  {vfPrueba.caduca&&<div style={{fontSize:10,color:C.mt,marginTop:2}}>El certificado caduca el {fmtDate(vfPrueba.caduca)}</div>}
                  {vfPrueba.ok&&<div style={{fontSize:10,color:C.mt,marginTop:2}}>Ya puedes encender el registro.</div>}
                </div>
              )}
              <div style={{fontSize:10,color:C.mt,marginTop:8,lineHeight:1.45}}>
                El certificado NO vive aquí: lo guarda la pasarela, en tu servidor o en Secret Manager de Firebase. La app solo sabe a dónde enviar.
              </div>
            </>
          )}
        </div>
      )}
      {/* ── CONSUMO DE LA CLAVE API ── */}
      {ES_APP&&!esMiembro()&&(
        <div style={{...S.card,marginBottom:10}}>
          <div style={{fontWeight:700,marginBottom:4}}>🔢 Consumo de la clave API</div>
          <div style={{fontSize:11,color:C.mt,marginBottom:8,lineHeight:1.45}}>
            Lo que ha gastado esta app. El saldo de tu cuenta no se puede consultar desde aquí: solo lo permite una clave de administrador, que da acceso a toda la organización y no debe guardarse en el móvil.
          </div>
          {(()=>{
            const meses=Object.keys(usoIA||{}).sort().reverse();
            if(!meses.length)return <div style={{fontSize:11,color:C.mt}}>Todavía no se ha usado el escáner en este dispositivo.</div>;
            const NOMBRE={factura:'Escanear facturas',['nominas-pdf']:'Leer PDF de nóminas',['nomina-hoja']:'Verificar hojas de nómina',euribor:'Buscar el euríbor'};
            return meses.slice(0,3).map(m=>{
              const u=usoIA[m]||{}, c=costeEstimado(u.total);
              return(
                <div key={m} style={{background:C.bg,borderRadius:9,padding:'9px 11px',marginBottom:7}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                    <b style={{fontSize:12}}>{m}</b>
                    <b style={{fontSize:14,color:C.in}}>≈ {c.total.toFixed(2)} $</b>
                  </div>
                  <div style={{fontSize:10,color:C.mt,marginTop:2}}>
                    {(u.total&&u.total.llamadas)||0} consultas · {fmt(Math.round(((u.total||{}).entrada||0)/1000))}k tokens de entrada · {fmt(Math.round(((u.total||{}).salida||0)/1000))}k de salida
                    {((u.total||{}).busquedas||0)>0&&` · ${u.total.busquedas} búsquedas web`}
                  </div>
                  {Object.entries(u.ops||{}).sort((a,b)=>costeEstimado(b[1]).total-costeEstimado(a[1]).total).map(([k,v])=>(
                    <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:10,color:C.mt,marginTop:3}}>
                      <span>{NOMBRE[k]||k} <span style={{opacity:.7}}>({v.llamadas})</span></span>
                      <span>{costeEstimado(v).total.toFixed(3)} $</span>
                    </div>
                  ))}
                </div>
              );
            });
          })()}
          <div style={{fontSize:10,color:C.mt,marginTop:4,lineHeight:1.45}}>
            Es una estimación con los precios de tarifa ({PRECIOS_IA.entrada} $ y {PRECIOS_IA.salida} $ por millón de tokens, {PRECIOS_IA.busqueda} $ por búsqueda). La cifra que se factura de verdad está en la consola de Anthropic.
          </div>
          <button style={{...S.sm(C.mt),marginTop:8,fontSize:10,padding:'6px 10px'}} onClick={()=>window.open('https://console.anthropic.com/settings/usage','_blank','noopener')}>Ver el saldo real en la consola</button>
        </div>
      )}
      {/* v363 · exportar todo exige Ajustes en admin */}
      {!esLector()&&(
      <div style={{...S.card,marginBottom:10}}>
        <div style={{fontWeight:700,marginBottom:6}}>Exportar</div>
        <div style={{color:C.mt,fontSize:11,marginBottom:8}}>Todas las facturas y anticipos con sus estados de pago. El Excel trae fechas e importes ya formateados, filtro en la cabecera, totales que respetan el filtro y una hoja de resumen por proveedor.</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          <button style={{...S.btn(C.sc),flex:'1 1 150px'}} onClick={()=>exportExcelLista(invoices,'facturas','Todas las facturas','todas — recibidas, emitidas y anticipos, pagadas y pendientes')} disabled={!invoices.length}>📊 Descargar Excel ({invoices.length})</button>
          <button style={{...S.sm(C.mt),padding:'10px 12px'}} onClick={exportCSV} disabled={!invoices.length} title="CSV plano, para otros programas">CSV</button>
        </div>
      </div>
      )}
            {!esLector()&&!esMiembro()&&<div style={{...S.card,marginBottom:10,borderColor:C.in+'55'}}>
        <div style={{fontWeight:700,marginBottom:6}}>🛡️ Master — usuarios y sesiones</div>
        <div style={{color:C.mt,fontSize:11,marginBottom:8}}>
          Da de alta usuarios con permisos por áreas y vigila las sesiones abiertas
          (con cierre remoto). Cada usuario entra con su propia contraseña y ve SOLO las áreas
          que le permitas (los permisos se aplican al activar o al cambiarlos aquí).
        </div>
        <button style={{...S.btn(C.in),width:'100%'}} onClick={()=>{setVerMaster(true);setMasterTab('usuarios');}}>🛡️ Abrir ventana Master</button>
      </div>}
      {/* v363 · solo el dueño saca la copia completa (lleva claves y todo) */}
      {!esMiembro()&&(
      <div style={{...S.card,marginBottom:10,borderColor:C.sc+'44'}}>
        <div style={{fontWeight:700,marginBottom:6}}>💾 Copia de seguridad completa</div>
        {(()=>{const d=diasDesde(ultimaCopia);
          const c=d===null?C.dn:(d>60?C.dn:(d>30?'#EAB308':C.sc));
          return <div style={{fontSize:11,fontWeight:700,color:c,marginBottom:6}}>
            {d===null?'⚠ Nunca has hecho una copia completa v9':'Última copia completa: '+ultimaCopia+' (hace '+d+' día'+(d===1?'':'s')+')'}
          </div>;})()}
        <div style={{color:C.mt,fontSize:11,marginBottom:8}}>Exporta TODO (facturas, empleados, empresa) en un fichero JSON. Puedes restaurarlo en cualquier momento — incluso desde otra sesión de Claude o un servidor propio.</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button style={S.btn(C.sc)} onClick={()=>{
            (async()=>{
               const claves={};
               for(const k of CLAVES_COPIA){if(CLAVES_FUERA_DE_COPIA.has(k))continue;try{const r=await window.storage.get(k);if(r?.value)claves[k]=r.value;}catch(e){}}
               try{const pi=claves['bh10-planidx']?JSON.parse(claves['bh10-planidx']):[];
                 for(const mes of (Array.isArray(pi)?pi:[])){try{const r=await window.storage.get('bh10-plan-'+mes);if(r?.value)claves['bh10-plan-'+mes]=r.value;}catch(e){}}
               }catch(e){}
               const res=resumenCopiaV9(claves);
               // v365 · cifrada con contraseña (AES-256 en el ZIP). Sin contraseña no se guarda.
               const texto=JSON.stringify({version:9,fecha:today,claves},null,1);
               const clave=String(window.prompt('Contraseña para cifrar la copia (mínimo 8 caracteres). La necesitarás para restaurarla.')||'');
               if(clave.length<8){notify('Copia NO guardada: la contraseña tiene que tener al menos 8 caracteres','error');return;}
               const zip=await crearZipSeguro([{nombre:`BH10_copia_completa_${today}.json`,texto}],{clave,fuerte:true});
               shareOrDownload(zip,`BH10_copia_completa_${today}.zip`,'application/zip');
               try{await window.storage.set('bh10-ultimacopia',today);}catch(e){}
               setUltimaCopia(today);
               notify('📦 Copia completa v9: '+res.n+' claves · '+res.kb+' KB');
             })(); 
          }}>⬇ Exportar backup JSON</button>
          <label style={{...S.btn(C.in),display:'inline-block',cursor:'pointer'}}>
            ⬆ Restaurar backup (1 archivo o varias partes)
            <input type="file" accept=".json,.zip" multiple style={{display:'none'}} onChange={e=>{
              const archivos=[...(e.target.files||[])];if(!archivos.length)return;
              // v365 · la copia cifrada (.zip con contraseña) se abre aquí mismo
              const leer=(f)=>new Promise((res,rej)=>{
                if(/\.zip$/i.test(f.name)){
                  (async()=>{try{
                    const {ZipReader,BlobReader,TextWriter}=await import('@zip.js/zip.js');
                    const clave=String(window.prompt('Contraseña de la copia '+f.name)||'');
                    const zr=new ZipReader(new BlobReader(f),{password:clave});
                    const entradas=await zr.getEntries();const j=entradas.find(x=>/\.json$/i.test(x.filename));
                    if(!j)throw new Error('el zip no trae ningún .json');
                    const text=await j.getData(new TextWriter());await zr.close();res({name:j.filename,text});
                  }catch(x){rej(new Error(f.name+': '+(/password|encrypt/i.test(String(x&&x.message))?'contraseña incorrecta':String(x&&x.message||x))));}})();
                  return;
                }
                const r=new FileReader();r.onload=ev=>res({name:f.name,text:ev.target.result});r.onerror=()=>rej(new Error(f.name));r.readAsText(f);
              });
              Promise.all(archivos.map(leer)).then(lecturas=>{
                try{
                  const objs=[];
                  for(const l of lecturas){try{objs.push({name:l.name,data:JSON.parse(l.text)});}catch(err){notify(`${l.name}: JSON no válido`,'error');return;}}
                  const esManifiesto=(o)=>o.data&&Array.isArray(o.data.partes);
                  let data;
                  if(objs.length===1&&!esManifiesto(objs[0])){
                    data=objs[0].data; // backup clásico de un solo archivo
                  }else{
                    data=reensamblarPartes(objs); // copia troceada (con o sin manifiesto)
                  }
                  if(esLector()){notify('👁 Estás en modo SOLO CONSULTA: la restauración no se guardaría. Ajustes → Cambiar de empresa o modo → entra como Administrador.','error');return;}
                  if(ES_APP&&window.storage&&window.storage.getStatus&&window.storage.getStatus().fase!=='ok'){notify('⚠️ Sin conexión con la nube: la restauración no se guardaría. Espera a que diga «sincronizado» en Ajustes.','error');return;}
                  if(esCopiaV9(data)){
                    const res=resumenCopiaV9(data.claves);
                    if(!window.confirm('Restaurar la copia completa v9 del '+(data.fecha||'?')+' ('+res.n+' claves, '+res.kb+' KB).\n\nSOBRESCRIBIRÁ los datos actuales de la nube. ¿Seguir?'))return;
                    (async()=>{
                      let ok=0;
                      for(const [k,val] of Object.entries(data.claves)){try{await window.storage.set(k,String(val));ok++;}catch(e){}}
                      notify('📦 Restauradas '+ok+' claves — recargando…');
                      setTimeout(()=>{try{location.reload();}catch(e){}},1200);
                    })();
                    return;
                  }
                  if(!data.invoices&&!data.i&&!data.employees&&!data.e){notify('Formato no válido','error');return;}
                  // Compatibilidad con claves compactas (v/d/c/i/e/b/p/ct/o/pc/fl/rm/pz)
                  if((data.v||data.version)&&!data.invoices){data.version=data.v||data.version;data.company=data.c;data.invoices=data.i;data.employees=data.e;data.budgets=data.b;data.payrollHistory=data.p;data.contratos=data.ct;data.obras=data.o;data.provCat=data.pc;data.flota=data.fl;data.remesas=data.rm;data.polizas=data.pz;}
                  if(data.company){setCompCfg(data.company);window.storage.set('bh10-company-v2',JSON.stringify(data.company));}
                  if(data.invoices){setInvoices(data.invoices);window.storage.set('bh10-fc-v3',JSON.stringify(data.invoices));}
                  if(data.nominas){setNominasMes(data.nominas);window.storage.set('bh10-nominas',JSON.stringify(data.nominas));}
                  if(data.employees){setEmployees(data.employees);window.storage.set('bh10-employees',JSON.stringify(data.employees));}
                  if(data.budgets){setBudgets(data.budgets);window.storage.set('bh10-budgets',JSON.stringify(data.budgets));}
                  if(data.payrollHistory){setPayrollHistory(data.payrollHistory);window.storage.set('bh10-payroll-hist',JSON.stringify(data.payrollHistory));}
                  if(data.contratos){setContratos(data.contratos);window.storage.set('bh10-contratos',JSON.stringify(data.contratos));}
                  if(data.obras){setObras(data.obras);window.storage.set('bh10-obras',JSON.stringify(data.obras));}
                  if(data.provCat){setProvCat(data.provCat);window.storage.set('bh10-provcat',JSON.stringify(data.provCat));}
                  if(data.cliCat){setCliCat(listaSegura(data.cliCat,'clientes'));window.storage.set('bh10-clicat',JSON.stringify(data.cliCat));}
                  if(data.flota){setFlota(data.flota);window.storage.set('bh10-flota',JSON.stringify(data.flota));}
                  if(data.polizas){setPolizas(data.polizas);window.storage.set('bh10-polizas',JSON.stringify(data.polizas));}
                  if(data.remesas){setRemesas(data.remesas);window.storage.set('bh10-remesas',JSON.stringify(data.remesas));}
                  notify(`Backup restaurado: ${data.invoices?.length||0} facturas, ${data.employees?.length||0} empleados`);
                }catch(err){notify('Error leyendo backup','error');}
              }).catch(()=>notify('Error leyendo archivos','error'));
              e.target.value='';
            }}/>
          </label>
        </div>
      </div>
      )}
      {/* v363 · importar facturas exige Ajustes en admin */}
      {!esLector()&&(
      <div style={{...S.card,marginBottom:10}}>
        <div style={{fontWeight:700,marginBottom:6}}>📊 Importar facturas desde Excel/CSV</div>
        <div style={{color:C.mt,fontSize:11,marginBottom:8}}>Selecciona el archivo y se leerá automáticamente: reconoce las columnas (fecha, proveedor, base, IVA...), completa CIF/IBAN desde tu histórico, y te deja revisar cada factura antes de registrarla — o registrarlas todas de golpe.</div>
        <label style={{display:'block',background:C.sc+'12',border:`1px dashed ${C.sc}55`,borderRadius:10,padding:'14px 12px',cursor:'pointer',textAlign:'center'}}>
          <input type="file" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" style={{display:'none'}} onChange={e=>{if(e.target.files?.[0])importExcel(e.target.files[0]);e.target.value='';}}/>
          <span style={{fontSize:14,fontWeight:700,color:C.sc}}>📁 Seleccionar archivo (.xlsx, .xls, .csv)</span>
        </label>
      </div>
      )}
      <div style={{...S.card,marginBottom:10}}><div style={{fontWeight:700,marginBottom:6}}>Proveedores</div>{K.topProv.length===0?<div style={{color:C.mt,fontSize:11}}>—</div>:<div style={{maxHeight:200,overflowY:'auto'}}>{K.topProv.map((p,i)=><div key={i} style={{padding:'4px 0',borderBottom:`1px solid ${C.bd}22`,fontSize:11,display:'flex',justifyContent:'space-between'}}><span>{p.name} <span style={{color:C.mt}}>({p.count})</span></span><span><span style={{fontWeight:600}}>{fmt(p.facturado)} €</span>{p.pendiente>0&&<span style={{color:C.wn,marginLeft:6,fontSize:10}}>pte {fmt(p.pendiente)}</span>}</span></div>)}</div>}</div>
      {/* v363 · solo el dueño puede borrar todo */}
      {!esMiembro()&&(
      <div style={S.card}><div style={{fontWeight:700,marginBottom:6,color:C.dn}}>Borrar todo</div>
        {/* v368 · hay que escribir el nombre de la empresa: un toque doble no basta para borrarlo todo */}
        <input value={borrarTodoNombre} onChange={e=>setBorrarTodoNombre(e.target.value)} placeholder={`Escribe «${compCfg.name||'el nombre de la empresa'}» para desbloquear`} style={{...S.input,marginBottom:6}}/>
        <BtnConfirm style={{...S.btn(C.dn),opacity:borrarTodoNombre.trim()&&borrarTodoNombre.trim().toUpperCase()===String(compCfg.name||'').trim().toUpperCase()?1:.4}} armStyle={{filter:'brightness(1.3)'}} armedLabel="⚠ ¿BORRAR TODO? Toca de nuevo" onConfirm={()=>{if(!borrarTodoNombre.trim()||borrarTodoNombre.trim().toUpperCase()!==String(compCfg.name||'').trim().toUpperCase()){notify('Escribe el nombre exacto de la empresa para borrar todo','error');return;}setBorrarTodoNombre('');setInvoices([]);saveEmployees([]);setBudgets({});setPayrollHistory([]);window.storage.set('bh10-budgets','{}');window.storage.set('bh10-payroll-hist','[]');notify('Todo borrado');}}>Eliminar datos</BtnConfirm></div>
      )}

      <div style={{...S.card,marginTop:10,borderColor:C.vt+'44'}}>
        <div style={{fontWeight:700,marginBottom:6}}>ℹ️ ¿Cómo se guardan mis datos?</div>
        <div style={{fontSize:11,color:C.mt,lineHeight:1.5}}>
          <p style={{margin:'0 0 8px'}}>Tus datos se almacenan automáticamente en el artefacto de Claude. Mientras accedas a <b style={{color:C.tx}}>esta misma conversación</b>, todo estará aquí.</p>
          <p style={{margin:'0 0 8px'}}>⚠️ Si borras la conversación, cierras tu cuenta, o Claude cambia su sistema de almacenamiento, podrías perder los datos. Por eso es importante <b style={{color:C.ac}}>descargar el backup JSON periódicamente</b>.</p>
          <p style={{margin:'0 0 8px'}}>Con el backup puedes restaurar todo en segundos — en esta misma conversación, en una nueva, o incluso si montas la app en un servidor propio (Vercel, Netlify, tu propio hosting).</p>
          <p style={{margin:0}}>💡 <b style={{color:C.sc}}>Recomendación:</b> descarga un backup cada vez que registres facturas importantes. El fichero pesa muy poco y contiene absolutamente todo (facturas, pagos, empleados, presupuestos, histórico).</p>
        </div>
      </div>
    </div>
  );

  // ═══ FORM MODAL ═══
  

  // ═══ PAGO MODAL ═══
  

  // ═══ LINK ANTICIPO MODAL ═══
  const LinkModal=()=>{
    const inv=invoices.find(i=>i.id===linkModal);if(!inv)return null;
    // Show anticipos matching proveedor or obra, sorted by relevance
    const candidates=anticiposLibres.filter(a=>a.proveedor===inv.proveedor||a.obra===inv.obra).sort((a,b)=>{
      const sa=(a.proveedor===inv.proveedor?2:0)+(a.obra===inv.obra?1:0);
      const sb=(b.proveedor===inv.proveedor?2:0)+(b.obra===inv.obra?1:0);
      return sb-sa;
    });
    const saldo=getSaldo(inv,invoices);
    return(
      <div style={S.overlay} onClick={avisarCerrar}>
        <div style={{...S.modal,maxWidth:420}} onClick={e=>e.stopPropagation()}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>⏩ Vincular anticipo</div>
          <div style={{fontSize:11,color:C.mt,marginBottom:4}}>Factura: {inv.proveedor} · {inv.numFactura||'s/n'} · Total: {fmt(inv.total)} € · Saldo actual: <span style={{color:C.wn,fontWeight:600}}>{fmt(saldo)} €</span></div>
          <div style={{fontSize:10,color:C.mt,marginBottom:10}}>Selecciona el anticipo que corresponde a esta factura. Su importe se descontará del saldo pendiente.</div>

          {candidates.length===0?(
            <div style={{textAlign:'center',padding:16,color:C.mt,fontSize:12}}>No hay anticipos disponibles para este proveedor/obra</div>
          ):(
            <div style={{maxHeight:300,overflowY:'auto'}}>
              {candidates.map(a=>(
                <div key={a.id} style={{...S.card,marginBottom:6,padding:10,cursor:'pointer',border:`1px solid ${C.vt}44`}} onClick={()=>linkAnticipo(a.id,inv.id)}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:12}}>{fmt(a.total)} € <span style={{fontWeight:400,color:C.mt}}>· {fmtDate(a.fecha)}</span></div>
                      {a.refPresupuesto&&<div style={{fontSize:11,color:C.vt}}>Ppto: {a.refPresupuesto}</div>}
                      <div style={{fontSize:10,color:C.mt}}>{a.proveedor} · {a.obra}</div>
                      {a.concepto&&<div style={{fontSize:10,color:C.mt+'99'}}>{a.concepto}</div>}
                    </div>
                    <button style={S.sm(C.vt)}>Vincular</button>
                  </div>
                  {a.total>saldo&&<div style={{fontSize:10,color:C.wn,marginTop:4}}>⚠ El anticipo ({fmt(a.total)} €) supera el saldo ({fmt(saldo)} €)</div>}
                </div>
              ))}
            </div>
          )}
          <div style={{display:'flex',justifyContent:'flex-end',marginTop:10}}><button style={S.ghost} onClick={()=>setLinkModal(null)}>Cerrar</button></div>
        </div>
      </div>
    );
  };

  if(loading) return (<div style={{background:C.bg,color:C.mt,display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'sans-serif'}}>Cargando...</div>);

  return(
    <div id="bh-root" style={{background:C.bg,color:C.tx,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',fontSize:14,width:'100%',maxWidth:1100,margin:'0 auto',display:'flex',flexDirection:'column',overflow:'hidden',borderLeft:`1px solid ${C.bd}55`,borderRight:`1px solid ${C.bd}55`}}>
      <div id="bh-header" style={{position:'sticky',top:0,zIndex:40,background:C.sf,borderBottom:`1px solid ${C.bd}`,boxShadow:'0 2px 10px rgba(0,0,0,.4)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'calc(10px + env(safe-area-inset-top)) 12px 10px'}}>
        {/* La versión va bajo el logotipo, no en una línea aparte: así la
            cabecera deja sitio para los botones y la empresa puede encogerse. */}
        <div style={{display:'flex',alignItems:'center',gap:8,minWidth:0,flex:'1 1 auto'}}>
          <div style={{flexShrink:0,lineHeight:1}}>
            <svg width="66" height="24" viewBox="0 0 72 28" style={{display:'block'}}>
              <text x="0" y="22" style={{fontSize:26,fontWeight:900,fontFamily:'Arial Black,sans-serif',letterSpacing:'-1px'}}><tspan fill="#7BF07B">B</tspan><tspan fill="#7BF07B">I</tspan><tspan fill="#7BF07B">O</tspan><tspan fill="#B0E8E8">H</tspan></text>
            </svg>
            <div style={{fontSize:8,color:C.mt,letterSpacing:'.06em',fontWeight:500,marginTop:-2}}>{APP_VERSION}</div>
          </div>
          {typeof window!=='undefined'&&window.__BH10_MULTI&&window.BH10_EMPRESA&&(
            <div
              onClick={esLector()?(()=>notify('👁 Modo lector: solo consulta. Para poder editar, cambia de modo en Ajustes.')):undefined}
              title={esLector()?'Modo lector · solo consulta':undefined}
              style={{fontSize:9,fontWeight:800,color:esLector()?C.wn:C.sc,letterSpacing:'.02em',minWidth:0,flex:'0 1 auto',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',cursor:esLector()?'pointer':'default'}}>{esLector()?'👁 ':'🏢 '}{window.BH10_EMPRESA.nombre||'Empresa'}</div>
          )}
        </div>
        {/* Botonera: no se encoge nunca, para que la lupa no se salga de la
            pantalla cuando el nombre de la empresa es largo. */}
        <div style={{display:'flex',alignItems:'center',gap:7,flexShrink:0}}>
          {/* Deshacer y rehacer. Apagados cuando no hay nada, y el propio botón
              dice qué va a deshacer: dos flechas mudas dan miedo de pulsar. */}
          {!esLector()&&(
            <span style={{display:'flex',alignItems:'center',gap:2}}>
              <button style={{background:'none',border:'none',fontSize:15,padding:'4px 3px',lineHeight:1,
                  cursor:histUI.atras?'pointer':'default',opacity:histUI.atras?1:.28,color:C.tx}}
                disabled={!histUI.atras}
                title={histUI.atras?('Deshacer: '+histUI.atras):'Nada que deshacer'}
                aria-label={histUI.atras?('Deshacer: '+histUI.atras):'Nada que deshacer'}
                onClick={deshacer}>↶</button>
              <button style={{background:'none',border:'none',fontSize:15,padding:'4px 3px',lineHeight:1,
                  cursor:histUI.alante?'pointer':'default',opacity:histUI.alante?1:.28,color:C.tx}}
                disabled={!histUI.alante}
                title={histUI.alante?('Rehacer: '+histUI.alante):'Nada que rehacer'}
                aria-label={histUI.alante?('Rehacer: '+histUI.alante):'Nada que rehacer'}
                onClick={rehacer}>↷</button>
            </span>
          )}
          <button style={{background:'none',border:'none',fontSize:17,cursor:'pointer',padding:'4px 3px'}} title="Ayuda y manual" onClick={()=>setAyudaVer({mod:null,q:''})}>🛟</button>
          <button style={{background:'none',border:'none',fontSize:15,cursor:'pointer',padding:'4px 5px'}} title="Cambiar tema claro/oscuro" onClick={()=>cambiarTema(tema==='claro'?'oscuro':'claro')}>{tema==='claro'?'🌙':tema==='auto'?'🕐':'☀️'}</button>
          <button style={{background:'none',border:'none',cursor:'pointer',fontSize:18,padding:4}} onClick={()=>{setGlobalQ('');setShowSearch(true);}} title="Buscar en todo">🔍</button>
          <span style={{fontSize:11,color:C.mt}}>{invoices.length||''}</span>
        </div>
      </div>

      {/* v392 · Jesús: «sigue pasando» (pantalla corrida en Facturas, capturas del
          09 y 11-09). El body ya estaba bloqueado, pero ESTE contenedor —el que
          desplaza toda la app— permitía el eje horizontal: bastaba un elemento
          más ancho que la pantalla (un desplegable estirado por Safari, un
          nombre largo) para poder arrastrar la app entera en diagonal y que se
          quedara descolocada. Prohibido de raíz: lo ancho se recorta, la
          pantalla no se mueve. */}
      {/* v392 · el bloqueo del eje horizontal vive como regla CSS en el
          envoltorio (#bh-main): mismo efecto y el marcado de las pantallas
          queda idéntico byte a byte para el A/B. */}
      <main id="bh-main" style={{flex:1,overflowY:'auto',overscrollBehavior:'contain',paddingBottom:SOBRE_TAB(58)}}>
      {!storageOk&&(
        <div style={{background:C.dn,color:'#fff',padding:'10px 14px',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:16}}>⚠️</span>
          <div style={{flex:1}}>Sin conexión con el almacenamiento de Claude. Tus datos están a salvo en el servidor, pero esta sesión no puede cargarlos ni guardar cambios. <strong>Desactiva el modo avión / comprueba la red, cierra el artefacto y vuelve a abrirlo.</strong></div>
        </div>
      )}
      {view==='dashboard'&&Dashboard()}
      {sinAccesoSub&&(
        <div style={{padding:30,textAlign:'center',color:C.mt,fontSize:13}}>
          <div style={{fontSize:34,marginBottom:8}}>🔒</div>
          <div style={{fontWeight:700,marginBottom:4}}>Sin acceso a esta pantalla</div>
          <div style={{fontSize:11}}>El dueño no te ha dado permiso para «{(SUBAREAS.find(x=>x[0]===subActual)||[])[1]||subActual}». Pídeselo en Master.</div>
        </div>
      )}
      {!sinAccesoSub&&view==='facturas'&&Facturas()}
      {!sinAccesoSub&&view==='contratos'&&(
        // Las demás pantallas envuelven su contenido con 10 de relleno. Esta no
        // lo tenía, y como la fila fija sale 10 px a cada lado contando con ese
        // relleno, se escapaba de la pantalla por los dos bordes.
        <div style={{padding:10}}>
          {enTesoreria&&<BarraTeso/>}
          <div style={{...S.filaFija,display:enTesoreria?'none':undefined,paddingTop:10,paddingBottom:8,overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
            {/* Dos capas a propósito: si el mismo elemento desplaza Y coloca en
                fila, crece con sus hijos y se sale de la pantalla. La de fuera
                limita y desplaza; la de dentro es la que puede crecer. */}
            <div style={{display:'flex',gap:6,minWidth:'max-content'}}>
            {(enTesoreria?[]:[['obras','🏗 Obras','obras'],['lista','📑 Contratos','contratos'],['presupuestos','📐 Presupuestos por obra','presupuestos'],['garantias','🛡️ Garantías','garantias']]).filter(([,,sub])=>puedeVerSub(sub)).map(([k,l])=>(
              <button key={k} style={{padding:'6px 12px',borderRadius:16,border:`1px solid ${conView===k?C.in:C.bd}`,background:conView===k?C.in+'22':'transparent',color:conView===k?C.in:C.mt,fontSize:11,fontWeight:conView===k?700:500,cursor:'pointer'}} onClick={()=>setConView(k)}>{l}</button>
            ))}
            </div>
          </div>
          {conView==='financiacion'&&(()=>{
            const ops=(financiacion||[]).filter(o=>o.activo!==false);
            const hasta=sumaMeses(today,1);
            const prox=obligacionesBanco(today,hasta);
            const totalMes=+prox.reduce((s,x)=>s+(+x.cuota||0),0).toFixed(2);
            const ivaMes=+prox.reduce((s,x)=>s+(+x.iva||0),0).toFixed(2);
            const deuda=ops.reduce((s,o)=>{
              if(o.tipo==='linea')return s+saldoDispuesto(o);
              if(o.tipo==='renting')return s;
              const c=cuadroFinanciacion(o,euribor,{hoy:today});
              const viva=c.filas.find(f=>f.fecha>=today);
              return s+(viva?viva.pendiente+viva.capital:0);
            },0);
            return(
              <div style={{padding:10}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,gap:6,flexWrap:'wrap'}}>
                  <div style={{fontSize:13,fontWeight:700}}>🏦 Financiación ({ops.length})</div>
                  {!esLector()&&<button style={S.btn()} onClick={()=>setFinForm({tipo:'prestamo',clase:'fijo',fechaInicio:today,plazoMeses:60,ivaPct:21,revisionMeses:12,desfaseMeses:1,activo:true,disposiciones:[],amortizaciones:[]})}>+ Operación</button>}
                </div>

                {ops.length>0&&(
                  <div style={{...S.card,marginBottom:10,borderColor:C.ac+'44'}}>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
                      {[['Próximos 30 días',fmt(totalMes)+' €',C.wn],['IVA soportado',fmt(ivaMes)+' €',C.in],['Capital pendiente',fmt(deuda)+' €',C.tx]].map(([l,v,col])=>(
                        <div key={l} style={{background:C.bg,borderRadius:8,padding:'7px 8px',textAlign:'center'}}>
                          <div style={{fontSize:9,color:C.mt}}>{l}</div>
                          <div style={{fontSize:13,fontWeight:800,color:col}}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {prox.some(x=>x.estimado)&&<div style={{fontSize:9,color:C.mt,marginTop:6}}>Las operaciones a tipo variable y las liquidaciones de la línea son una estimación con el último euríbor que tengas cargado.</div>}
                  </div>
                )}

                {ops.length===0
                  ?<div style={{textAlign:'center',padding:30,color:C.mt,fontSize:12}}>Aún no hay operaciones. Añade tus préstamos, leasings, rentings y la línea de la obra para ver lo que hay que pagar al banco cada mes.</div>
                  :ops.map(o=>{
                    const meta=TIPOS_FIN.find(x=>x.id===o.tipo)||TIPOS_FIN[0];
                    const esLinea=o.tipo==='linea';
                    const c=esLinea?null:cuadroFinanciacion(o,euribor,{hoy:today});
                    const sig=c?c.filas.find(f=>f.fecha>=today):null;
                    const t=tipoEnFecha(o,today,euribor);
                    return(
                      <div key={o.id} style={{...S.card,marginBottom:8,cursor:'pointer'}} onClick={()=>setFinVer(o.id)}>
                        <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'flex-start'}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{meta.ic} {o.nombre||meta.n}</div>
                            <div style={{fontSize:10,color:C.mt}}>{o.entidad||''}{o.entidad?' · ':''}{meta.n}{o.clase==='variable'?` · ${t.fuente}`:` · ${o.fijo||0}% fijo`}</div>
                          </div>
                          <div style={{textAlign:'right',flexShrink:0}}>
                            {esLinea
                              ?<><div style={{fontWeight:800,fontSize:14}}>{fmt(saldoDispuesto(o))} €</div>
                                 <div style={{fontSize:10,color:C.sc}}>disponible {fmt(disponibleLinea(o))} €</div></>
                              :<><div style={{fontWeight:800,fontSize:14}}>{sig?fmt(sig.cuota):'—'} €</div>
                                 <div style={{fontSize:10,color:C.mt}}>{sig?fmtDate(sig.fecha):'terminado'}</div></>}
                          </div>
                        </div>
                        {sig&&sig.carencia&&<div style={{fontSize:10,color:C.wn,marginTop:4}}>⏳ En carencia: solo intereses</div>}
                        {esLinea&&(()=>{const pct=(+o.limite||0)>0?Math.round(saldoDispuesto(o)/o.limite*100):0;return(
                          <div style={{marginTop:6}}>
                            <div style={{height:6,background:C.bg,borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(100,pct)}%`,background:C.ac}}/></div>
                            <div style={{fontSize:9,color:C.mt,marginTop:3}}>{pct}% dispuesto de {fmt(o.limite)} €</div>
                          </div>
                        );})()}
                      </div>
                    );
                  })}

                {/* ── Euríbor: la app no puede consultarlo sola ── */}
                <div style={{...S.card,marginTop:10}}>
                  <div style={{fontWeight:700,fontSize:12,marginBottom:4}}>📈 Euríbor · media mensual publicada</div>
                  <div style={{fontSize:10,color:C.mt,marginBottom:8,lineHeight:1.45}}>
                    Apunta la <b>media mensual</b> que publica el Banco de España en el BOE, que es el índice oficial al que se revisan los préstamos en España. No sirve el euríbor de un día suelto: es otro número.
                  </div>
                  {/* Avisos de revisiones que se quedarían sin dato */}
                  {(()=>{
                    const pend=revisionesPendientes(financiacion,euribor,today,2);
                    if(!pend.length)return null;
                    const meses=[...new Set(pend.map(p=>p.mes))];
                    return(
                      <div style={{background:C.wn+'14',border:`1px solid ${C.wn}55`,borderRadius:8,padding:'8px 10px',marginBottom:8,fontSize:11}}>
                        <div style={{fontWeight:700,color:C.wn}}>⚠ Falta el euríbor de {meses.join(', ')}</div>
                        {pend.slice(0,3).map((p,i)=>(
                          <div key={i} style={{fontSize:10,color:C.mt,marginTop:2}}>
                            {p.vencida?'Revisión pasada':'Revisión'} de <b>{p.op.nombre}</b> el {fmtDate(p.fechaRevision)} — necesita la media de {p.mes}
                          </div>
                        ))}
                        {pend.length>3&&<div style={{fontSize:10,color:C.mt}}>y {pend.length-3} más</div>}
                        <div style={{fontSize:10,color:C.mt,marginTop:4}}>Sin ese dato, la cuota que verás es una estimación con el último valor cargado.</div>
                        {!esLector()&&(
                          <div style={{display:'flex',gap:6,marginTop:6,flexWrap:'wrap'}}>
                            {meses.map(m=>(
                              <button key={m} style={{...S.sm(C.in),padding:'5px 10px',fontSize:10,minHeight:0}} disabled={euriBusca===m}
                                onClick={()=>buscarEuribor(m)}>{euriBusca===m?'⏳ Buscando…':`🔎 Buscar el de ${m}`}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {/* Propuesta traída de la búsqueda: se confirma, no se guarda sola */}
                  {euriProp&&(
                    <div style={{background:C.in+'12',border:`1px solid ${C.in}55`,borderRadius:9,padding:'9px 11px',marginBottom:8}}>
                      <div style={{fontSize:12,fontWeight:700}}>Propuesta para {euriProp.mes}: <span style={{color:C.in}}>{euriProp.valor}%</span></div>
                      {euriProp.cita&&<div style={{fontSize:10,color:C.mt,marginTop:3,fontStyle:'italic'}}>«{String(euriProp.cita).slice(0,140)}»</div>}
                      {euriProp.fuente&&<div style={{fontSize:10,marginTop:3,overflow:'hidden',textOverflow:'ellipsis'}}>
                        <a href={euriProp.fuente} target="_blank" rel="noopener noreferrer" style={{color:C.in}}>Ver la fuente</a>
                      </div>}
                      {(euriProp.avisos||[]).map((a,i)=><div key={i} style={{fontSize:10,color:C.wn,marginTop:3}}>⚠ {a}</div>)}
                      <div style={{fontSize:10,color:C.mt,marginTop:5}}>Compruébalo antes de aceptarlo: de este número sale la cuota.</div>
                      <div style={{display:'flex',gap:6,marginTop:7}}>
                        <button style={{...S.sm(C.sc),padding:'6px 12px',fontSize:11}} onClick={()=>{
                          persistEuribor([...(euribor||[]).filter(x=>x.mes!==euriProp.mes),{mes:euriProp.mes,valor:+euriProp.valor,fuente:euriProp.fuente||''}]);
                          setEuriProp(null);
                        }}>✓ Aceptar</button>
                        <button style={{...S.sm(C.mt),padding:'6px 12px',fontSize:11}} onClick={()=>setEuriProp(null)}>Descartar</button>
                      </div>
                    </div>
                  )}
                  {(euribor||[]).slice().sort((a,b)=>String(b.mes).localeCompare(String(a.mes))).slice(0,6).map(x=>(
                    <div key={x.mes} style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'3px 0',borderBottom:`1px solid ${C.bd}44`}}>
                      <span>{x.mes}{x.fuente?<span style={{color:C.mt,fontSize:9}}> · con fuente</span>:''}</span><b>{x.valor}%</b>
                      {!esLector()&&<button style={{background:'none',border:'none',color:C.dn,cursor:'pointer',fontSize:10}} onClick={()=>persistEuribor(euribor.filter(y=>y.mes!==x.mes))}>×</button>}
                    </div>
                  ))}
                  {!esLector()&&(
                    <div style={{display:'flex',gap:6,marginTop:8}}>
                      <input id="eu-mes" style={{...S.input,flex:'1 1 0',minWidth:0,fontSize:11}} type="month" defaultValue={today.slice(0,7)}/>
                      <input id="eu-val" style={{...S.input,flex:'1 1 0',minWidth:0,fontSize:11}} type="text" inputMode="decimal" placeholder="2,183"/>
                      <button style={{...S.sm(C.in),flexShrink:0}} onClick={()=>{
                        const m=document.getElementById('eu-mes').value;
                        const v=parseNum(document.getElementById('eu-val').value);
                        if(!m||!Number.isFinite(v)){notify('Indica el mes y el valor','error');return;}
                        if(v<-2||v>20){notify('Ese valor no parece un euríbor (entre -2% y 20%)','error');return;}
                        persistEuribor([...(euribor||[]).filter(x=>x.mes!==m),{mes:m,valor:v}]);
                        document.getElementById('eu-val').value='';
                      }}>Añadir</button>
                    </div>
                  )}
                  {!esLector()&&(
                    <div style={{marginTop:8,display:'flex',gap:6,flexWrap:'wrap'}}>
                      <button style={{...S.sm(C.mt),fontSize:10,padding:'5px 9px'}} onClick={()=>window.open('https://www.boe.es/buscar/boe.php?campo%5B0%5D=TIT&dato%5B0%5D=euribor','_blank','noopener')}>📋 Media oficial (BOE)</button>
                      <button style={{...S.sm(C.mt),fontSize:10,padding:'5px 9px'}} onClick={()=>window.open('https://www.euribor-rates.eu/es/','_blank','noopener')}>📈 euribor-rates.eu</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          {conView==='garantias'&&(()=>{
        const R=resumenRetenciones(invoices,today);
        const conRet=invoices.filter(i=>i.tipo==='cobro'&&(i.retGarImp||0)>0);
        const pend=R.pendientes, dev=R.devueltas;
        const grupos={};pend.forEach(i=>{(grupos[i.proveedor]=grupos[i.proveedor]||[]).push(i);});
        const totPend=R.totPend;
        const reclamar=(cli,list)=>{
          const liq=list.filter(i=>i._ret&&i._ret.liquidable);
          const txt=textoReclamacion(cli,liq.length?liq:list,compCfg.name);
          try{navigator.clipboard.writeText(txt);notify('Reclamación copiada — pégala en el correo al cliente');}
          catch(e){window.prompt('Copia el texto de la reclamación:',txt);}
        };
        const marcarDevuelta=(id)=>{if(soloLector())return;setInvoices(p=>p.map(i=>i.id!==id?i:{...i,retGarDevuelta:true,retGarFecha:today,pagos:[...(i.pagos||[]),{id:uid(),fecha:today,importe:i.retGarImp,metodo:'Devolución retención garantía',referencia:''}]}));notify('Retención devuelta — cobro registrado');};
        return(<div>
          {conRet.length===0?<div style={{textAlign:'center',padding:30,color:C.mt}}>Sin retenciones de garantía<div style={{fontSize:11,marginTop:6}}>Configura el % en el contrato o al emitir la factura</div></div>:<>
            <div style={{...S.card,marginBottom:10,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div><div style={{fontSize:11,color:C.mt}}>Pendiente de devolución</div><div style={{fontSize:20,fontWeight:800,color:C.vt}}>{fmt(totPend)} €</div>
                {R.totLiquidable>0&&<div style={{fontSize:11,fontWeight:700,color:C.ok,marginTop:2}}>✅ Liquidable ya (garantía vencida): {fmt(R.totLiquidable)} €</div>}
                {R.totProximas>0&&<div style={{fontSize:10,color:C.wr,marginTop:2}}>⏳ Vence en ≤60 días: {fmt(R.totProximas)} €</div>}
              </div>
              <div style={{fontSize:11,color:C.mt,textAlign:'right'}}>{pend.length} certificación{pend.length!==1?'es':''}<br/>{Object.keys(grupos).length} cliente{Object.keys(grupos).length!==1?'s':''}</div>
            </div>
            {Object.entries(grupos).sort((a,b)=>b[1].reduce((s,i)=>s+i.retGarImp,0)-a[1].reduce((s,i)=>s+i.retGarImp,0)).map(([cli,list])=>(
              <div key={cli} style={{...S.card,marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4,gap:6}}><div style={{fontWeight:700,fontSize:13,flex:1,minWidth:0}}>{cli}</div>
                  {list.some(i=>i._ret&&i._ret.liquidable)&&<button style={{...S.sm(C.ok),flexShrink:0}} onClick={()=>reclamar(cli,list)}>📋 Reclamar</button>}
                  <div style={{fontWeight:800,color:C.vt,flexShrink:0}}>{fmt(list.reduce((s,i)=>s+i.retGarImp,0))} €</div></div>
                {list.sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||'')).map(i=>(
                  <div key={i.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderTop:`1px solid ${C.bd}33`,gap:8}}>
                    <div style={{flex:1,minWidth:0,fontSize:12}}><div style={{fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{i.numFactura} · {fmtDate(i.fecha)}</div><div style={{fontSize:10,color:C.mt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{i.obra||i.concepto}</div>
                      {i._ret&&i._ret.vence&&<div style={{fontSize:10,fontWeight:700,color:i._ret.liquidable?C.ok:(i._ret.dias<=60?C.wr:C.mt)}}>{i._ret.liquidable?'✅ Garantía vencida — reclamable':'⏳ Garantía hasta '+fmtDate(i._ret.vence)+' ('+i._ret.dias+' d)'}</div>}</div>
                    <div style={{fontWeight:700,fontSize:13,flexShrink:0}}>{fmt(i.retGarImp)} €</div>
                    <button style={{...S.sm(C.sc),flexShrink:0}} onClick={()=>marcarDevuelta(i.id)}>✓ Devuelta</button>
                  </div>))}
              </div>))}
            {dev.length>0&&<div style={{...S.card,marginBottom:8,opacity:.85}}><div style={{fontSize:10,fontWeight:700,color:C.mt,marginBottom:4,textTransform:'uppercase'}}>✓ Devueltas ({dev.length})</div>{dev.sort((a,b)=>(b.retGarFecha||'').localeCompare(a.retGarFecha||'')).slice(0,12).map(i=><div key={i.id} style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'3px 0',color:C.mt}}><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginRight:8}}>{i.proveedor} · {i.numFactura}</span><span style={{color:C.sc,flexShrink:0}}>{fmt(i.retGarImp)} € · {fmtDate(i.retGarFecha)}</span></div>)}</div>}
          </>}
        </div>);})()}

          {conView==='obras'&&(()=>{
            const coste=costePorObra(invoices,obras,{desde:obrasUI.desde,hasta:obrasUI.hasta});
            const porNombre=(n)=>coste.find(c=>c.obra===n)||{n:0,total:0,porVivienda:null};
            const vals=valoresObra(invoices);
            const sug=obrasUI.vista==='fundir'?sugerirFusionObras(vals):[];
            const guardarObra=(o,campos)=>persistObras(obras.map(x=>x.id===o.id?{...x,...campos}:x));
            const bajarPlantilla=()=>{
              const {hojaObras,hojaFacturas}=plantillaImputacion(invoices,obras);
              const wb=XLSX.utils.book_new();
              const wsO=XLSX.utils.aoa_to_sheet(hojaObras);wsO['!cols']=[{wch:34},{wch:22},{wch:10},{wch:10},{wch:44},{wch:14},{wch:14}];
              const wsF=XLSX.utils.aoa_to_sheet(hojaFacturas);wsF['!cols']=[{wch:14},{wch:11},{wch:30},{wch:16},{wch:12},{wch:34},{wch:40},{wch:14},{wch:40}];
              XLSX.utils.book_append_sheet(wb,wsO,'Obras');XLSX.utils.book_append_sheet(wb,wsF,'Facturas');
              const out=XLSX.write(wb,{type:'array',bookType:'xlsx'});
              shareOrDownload(new Blob([out],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),`imputacion_obras_${today}.xlsx`,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            };
            const leerPlantilla=(f)=>{const rd=new FileReader();rd.onload=()=>{try{
              const wb=XLSX.read(rd.result,{type:'array'});
              const hoja=(nom)=>{const n=wb.SheetNames.find(x=>x.toLowerCase().startsWith(nom));return n?XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,raw:true,defval:''}):null;};
              const hO=hoja('obras'),hF=hoja('facturas'),hD=hoja('datos');
              // v362 · dos formatos: la plantilla (hojas Obras + Facturas con id) o el Excel
              // normal de Recibidas con una columna de obra añadida (Obra / Calle / Promoción)
              const esPlantilla=hO&&hF&&hF[0]&&hF[0].some(c=>/RELLENAR/i.test(String(c)));
              const lec=esPlantilla?leerImputacion(hO,hF,invoices,obras):leerExcelRecibidas(hD||hF||hO,invoices,obras);
              if(lec.errores.length){notify(lec.errores.join(' · '),'error');return;}
              setObrasUI(u=>({...u,imp:{...lec,archivo:f.name}}));
            }catch(e){notify('No se pudo leer el Excel: '+String(e&&e.message||e).slice(0,80),'error');}};rd.readAsArrayBuffer(f);};
            return (
              <div style={{padding:10}}>
                {/* v363 · pastillas ordenadas: una fila de vistas (tres iguales) y otra de acciones */}
                <div style={{display:'flex',gap:6,marginBottom:6}}>
                  {[['catalogo','📚 Catálogo'],['fundir','🔗 Fundir'],['coste','📊 Coste']].map(([k,l])=>(
                    <button key={k} onClick={()=>setObrasUI(u=>({...u,vista:k}))} style={{flex:1,padding:'9px 6px',borderRadius:10,fontSize:12,fontWeight:obrasUI.vista===k?700:500,cursor:'pointer',border:`1px solid ${obrasUI.vista===k?C.in:C.bd}`,background:obrasUI.vista===k?C.in+'22':'transparent',color:obrasUI.vista===k?C.in:C.mt}}>{l}</button>
                  ))}
                </div>
                {!esLector()&&(
                  <div style={{display:'flex',gap:6,marginBottom:10}}>
                    <button style={{...S.sm(C.sc),flex:1,textAlign:'center'}} onClick={bajarPlantilla}>📤 Plantilla</button>
                    <label style={{...S.sm(C.in),flex:1,textAlign:'center',cursor:'pointer'}}>📥 Importar<input type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}} onChange={e=>{const f=e.target.files&&e.target.files[0];if(f)leerPlantilla(f);e.target.value='';}}/></label>
                    <button style={{...S.sm(C.sc),flex:1,textAlign:'center'}} onClick={()=>openObraModal('cat')}>➕ Nueva obra</button>
                  </div>
                )}
                {obrasUI.imp&&(()=>{const L=obrasUI.imp;return (
                  <div style={{...S.card,marginBottom:10,borderColor:C.wn+'66'}}>
                    <div style={{fontWeight:700,marginBottom:4}}>📥 {L.archivo} · vista previa</div>
                    <div style={{fontSize:11,color:C.mt,lineHeight:1.6}}>
                      Obras nuevas: <b>{L.nuevas.length}</b>{L.nuevas.length?' ('+L.nuevas.slice(0,6).join(', ')+(L.nuevas.length>6?'…':'')+')':''} · actualizadas: <b>{L.actualizadas.length}</b><br/>
                      Facturas que cambian de obra: <b style={{color:L.asignaciones.length?C.wn:C.sc}}>{L.asignaciones.length}</b> · sin cambio: {L.sinCambio} · sin obra en la hoja: {L.vacias}{L.idsMal?` · filas que no casan con ninguna factura: ${L.idsMal}`:''}{L.ambiguas?` · ambiguas (dos facturas iguales): ${L.ambiguas}`:''}{L.porClaveN?` · casadas por empresa+nº+total: ${L.porClaveN}`:''}{L.porIdN?` · por id: ${L.porIdN}`:''}
                    </div>
                    {L.desconocidas.length>0&&<div style={{fontSize:11,color:C.dn,marginTop:4}}>⚠️ Nombres de obra que NO están en la hoja «Obras» (no se aplican): {L.desconocidas.map(d=>`${d.nombre} (${d.n})`).join(' · ')}</div>}
                    {L.asignaciones.slice(0,12).map((a,k)=><div key={k} style={{fontSize:10,color:C.mt,padding:'2px 0',borderTop:`1px solid ${C.bd}22`}}>{a.proveedor} nº {a.numFactura||'s/n'} · {fmt(a.total)} € · <s>{a.antes||'(sin obra)'}</s> → <b>{a.despues}</b></div>)}
                    {L.asignaciones.length>12&&<div style={{fontSize:10,color:C.mt}}>… y {L.asignaciones.length-12} más</div>}
                    <div style={{display:'flex',gap:6,marginTop:8}}>
                      <BtnConfirm style={S.sm(C.sc)} armStyle={{background:C.sc,color:'#fff'}} armedLabel={`¿Aplicar ${L.asignaciones.length} cambios y ${L.nuevas.length} obras nuevas? Toca otra vez`} onConfirm={()=>{
                        if(sinAccion('obras','imputar obras'))return;
                        origenCambio.current='obras: importar Excel';
                        if(L.asignaciones.length)setInvoices(prev=>aplicarImputacion(prev,L.asignaciones));
                        persistObras(L.catalogo);setObrasUI(u=>({...u,imp:null}));
                        notify(`🏗 ${L.asignaciones.length} facturas imputadas · ${L.nuevas.length} obras nuevas · ${L.actualizadas.length} actualizadas`);
                      }}>💾 Aplicar</BtnConfirm>
                      <button style={S.sm(C.mt)} onClick={()=>setObrasUI(u=>({...u,imp:null}))}>Cancelar</button>
                    </div>
                  </div>);})()}
                {obrasUI.vista==='catalogo'&&(
                  <div style={S.card}>
                    {obras.length===0&&<div style={{fontSize:11,color:C.mt,marginBottom:6}}>El catálogo está vacío. Las {vals.length} etiquetas de obra que hay hoy en las facturas están en «🔗 Fundir valores»: júntalas ahí en obras de verdad, o baja la plantilla Excel y rellénala.</div>}
                    {obras.map(o=>{const c=porNombre(nombreObra(o));return (
                      <div key={o.id} style={{padding:'8px 0',borderBottom:`1px solid ${C.bd}33`,fontSize:11}}>
                        {/* v363 · la obra se abre tocando el nombre; los datos de tipología a la vista */}
                        <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                          <div style={{flex:1,minWidth:0,cursor:'pointer'}} onClick={()=>!soloLector()&&openObraModal('cat',o)}>
                            <div style={{fontWeight:700,fontSize:13}}>{nombreObra(o)}{o.activa===false&&<span style={{color:C.mt,fontWeight:500}}> · cerrada</span>}</div>
                            <div style={{color:C.mt,fontSize:10,marginTop:2}}>{[o.cliente,(o.otros||[]).length?`${o.otros.length} otros nombres`:'',`${c.n} facturas`,`${fmt(c.total)} €`].filter(Boolean).join(' · ')}</div>
                            <div style={{color:C.mt,fontSize:10,marginTop:2}}>{[o.tipologia,o.viviendas?`${o.viviendas} viviendas`:'',o.m2?`${fmt(o.m2)} m²`:'',o.plantas?`${o.plantas} plantas`:'',o.sotano==='si'?'con sótano':o.sotano==='no'?'sin sótano':''].filter(Boolean).join(' · ')||'sin tipología: toca ✎ Editar y ponle viviendas, m², plantas…'}</div>
                          </div>

                          <div style={{textAlign:'right',flexShrink:0}}>
                            <div style={{fontSize:12,fontWeight:700,color:c.porVivienda!=null?C.sc:C.mt}}>{c.porVivienda!=null?fmt(c.porVivienda)+' €/viv':'— €/viv'}</div>
                            {c.porM2!=null&&<div style={{fontSize:10,color:C.mt}}>{fmt(c.porM2)} €/m²</div>}
                            {!esLector()&&<button style={{...S.sm(C.in),marginTop:6}} onClick={()=>openObraModal('cat',o)}>✎ Editar</button>}
                          </div>
                        </div>
                        {/* v367 · qué somos en esta obra y, si vendemos, sus viviendas */}
                        <div style={{display:'flex',gap:6,alignItems:'center',marginTop:6,flexWrap:'wrap'}}>
                          <span style={{fontSize:10,color:C.mt}}>En esta obra:</span>
                          {/* v370 · Jesús: «la empresa puede ser vendedora Y constructora» — dos interruptores, no una elección */}
                          {[['vende',ROLES_OBRA[0][1]],['construye',ROLES_OBRA[1][1]]].map(([k,l])=>{const on=papelesObra(o)[k];return (
                            <button key={k} disabled={esLector()} onClick={()=>{const n=conPapel(o,k,!on);persistObras(obras.map(x=>x.id===o.id?n:x));}} style={{padding:'4px 9px',borderRadius:8,fontSize:10,fontWeight:on?700:500,cursor:'pointer',border:`1px solid ${on?C.in:C.bd}`,background:on?C.in+'22':'transparent',color:on?C.in:C.tx}}>{on?'☑ ':'☐ '}{l}</button>
                          );})}
                          {!esLector()&&<BtnConfirm style={{...S.sm(C.dn),marginLeft:'auto',fontSize:10}} armStyle={{background:C.dn,color:'#fff'}} armedLabel="¿Borrar la obra? Toca otra vez" onConfirm={()=>{
                            const nViv=viviendasDeObra(viviendas,o.id).length;
                            if(nViv){notify(`La obra tiene ${nViv} viviendas: bórralas primero (o quítale el papel de promotora)`,'error');return;}
                            deleteObra(o.id);
                          }}>🗑 Borrar</BtnConfirm>}
                        </div>
                        {papelesObra(o).vende&&(()=>{const vs=viviendasDeObra(viviendas,o.id);const rs=resumenObra(viviendas,o.id);return (
                          <div style={{marginTop:8,padding:'8px 10px',background:C.bg,borderRadius:9}}>
                            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                              <b style={{flex:1,fontSize:12}}>🏠 Viviendas ({rs.total}) · {rs.libres} libres · {rs.reservadas} reservadas · {rs.arras} con arras · {rs.escrituradas} escrituradas</b>
                              {!esLector()&&<button style={S.sm(C.sc)} onClick={()=>setVivModal({v:nuevaVivienda(o.id,{identificador:String(vs.length+1),tipologia:o.tipologia||'',ivaTipo:10})})}>➕ Vivienda</button>}
                            </div>
                            {/* v369 · Jesús: alta de obra con nº de viviendas y coste de venta → un toque las crea todas */}
                            {!esLector()&&(+o.viviendas||0)>vs.length&&<button style={{...S.sm(C.in),width:'100%',marginBottom:6}} onClick={()=>{
                              const falta=(+o.viviendas||0)-vs.length;
                              const pv=(+o.presupuestoVenta||0)>0&&(+o.viviendas||0)>0?Math.round((+o.presupuestoVenta)/(+o.viviendas)*100)/100:0;
                              const lote=[];for(let k=0;k<falta;k++)lote.push(nuevaVivienda(o.id,{identificador:String(vs.length+k+1),tipologia:o.tipologia||'',precio:pv,ivaTipo:10}));
                              persistViviendas([...viviendas,...lote]);
                              notify(`🏠 ${falta} viviendas creadas${pv?` a ${fmt(pv)} € (venta ${fmt(+o.presupuestoVenta)} € ÷ ${o.viviendas})`:''} — toca cada una para afinarla`);
                            }}>⚡ Generar las {(+o.viviendas||0)-vs.length} viviendas que faltan{(+o.presupuestoVenta||0)>0?' con su precio':''}</button>}
                            {vs.length===0&&<div style={{fontSize:10,color:C.mt}}>Da de alta cada vivienda con su identificador (nº, letra, parcela…). Después, «🔗 Enlace» para que el comprador rellene sus datos y suba el DNI.</div>}
                            {vs.map(v=>(
                              <div key={v.id} style={{padding:'7px 0',borderTop:`1px solid ${C.bd}33`,fontSize:11}}>
                               {/* v372 · Jesús: «tienes que reordenar la ventana donde viven esas opciones».
                                   Los cuatro botones no caben junto al texto en un móvil y se le montaban
                                   encima. Ahora: arriba la vivienda y su precio, y los botones debajo,
                                   en su propia línea, cada uno entero y sin pisar nada. */}
                               <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                                <div style={{flex:1,minWidth:0,cursor:'pointer'}} onClick={()=>setVivModal({v})}>
                                  <div><b>Vivienda {v.identificador}</b>{v.tipologia?` · ${v.tipologia}`:''}{v.superficieConstruida?` · ${fmt(v.superficieConstruida)} m²`:''} · <span style={{color:v.estado==='libre'?C.mt:v.estado==='escriturada'?C.sc:C.wn,fontWeight:700}}>{(ESTADOS_VIVIENDA.find(e=>e[0]===v.estado)||[])[1]||v.estado}</span></div>
                                  <div style={{fontSize:10,color:C.mt}}>{(v.titulares||[]).length?(v.titulares.map(t=>nombreTitular(t,cliCat)+' '+t.porcentaje+'%').join(' + ')):'sin titulares'}{v.mejoras&&v.mejoras.length?` · ${v.mejoras.length} mejoras (${fmt(totalMejoras(v))} €)`:''}</div>
                                  {(()=>{const ds=docsVenta.filter(d=>d.viviendaId===v.id);if(!ds.length)return null;return (
                                    <div style={{fontSize:9.5,color:C.mt,marginTop:3,textAlign:'left'}}>{ds.map(d=>{
                                      const fs=(d.firmas||[]).length,tot=(v.titulares||[]).length;
                                      const col=d.estado==='firmado'?C.sc:d.estado==='enviado'?C.wn:C.mt;
                                      return <div key={d.id} style={{color:col,cursor:'pointer',textDecoration:'underline'}} onClick={()=>verDocVenta(d)} title="Ver el contrato">{d.tipo==='arras'?'🤝':'📝'} {d.numero} · {d.estado==='firmado'?'firmado':d.estado==='enviado'?`firmas ${fs}/${tot}`:'borrador'}</div>;
                                    })}</div>);})()}
                                </div>
                                <div style={{textAlign:'right',flexShrink:0}}>
                                  {(()=>{const D=dineroVivienda(v);return (<>
                                    <div style={{fontWeight:700,color:C.sc}}>{v.precio?fmt(precioTotal(v))+' €':'— €'}</div>
                                    {D.facturado>0&&<div style={{fontSize:9.5,color:C.mt}}>facturado {fmt(D.facturado)} € · queda <b style={{color:D.pendienteFacturar>0?C.wn:C.sc}}>{fmt(D.pendienteFacturar)} €</b></div>}
                                    {D.pendienteCobro>0.01&&<div style={{fontSize:9.5,color:C.wn}}>sin cobrar {fmt(D.pendienteCobro)} €</div>}
                                  </>);})()}
                                </div>
                               </div>
                               <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:6}}>
                                  {!esLector()&&<button style={{...S.sm(C.in),fontSize:10}} onClick={async()=>{
                                    if(!window.bh10Invitar){notify('El enlace del portal vive en la app de bh10group.com','error');return;}
                                    try{const enlace=await window.bh10Invitar({vivienda:etiquetaVivienda(v,o),viviendaId:v.id,obraId:o.id,empresaNombre:compCfg.name||'',empresaNif:compCfg.cif||'',empresaEmail:compCfg.email||'',motivo:'Reserva de vivienda'});
                                      persistViviendas(viviendas.map(x=>x.id===v.id?{...x,enlaces:[...(x.enlaces||[]),{token:String(enlace).split('t=')[1]||'',creado:today,caduca:'',usado:false}]}:x));
                                      setEnlaceModal({titulo:`🔗 Enlace de datos · vivienda ${v.identificador}`,enlace,nota:'Mándaselo al comprador. Sirve una sola vez y caduca a los 30 días; en cuanto lo use, desaparece.'});
                                    }catch(e){notify('No se pudo crear el enlace: '+String(e&&e.message||e).slice(0,80),'error');}
                                  }}>🔗 Enlace</button>}
                                  {!esLector()&&<button style={{...S.sm(C.vt),fontSize:10}} onClick={()=>abrirDniVivienda(v,o)} title="Datos y DNI de los titulares (para luz y agua)">🪪 Datos</button>}
                                  {!esLector()&&<button style={{...S.sm(C.wn),fontSize:10}} onClick={()=>{
                                    // v371 · facturar a cuenta CONTRA la vivienda: lo que se emita
                                    // aquí descuenta de su precio (como las certificaciones del contrato)
                                    const D=dineroVivienda(v);
                                    const tt=(v.titulares||[])[0];
                                    const cli=tt?(cliCat||[]).find(x=>String(idCliente(x))===String(tt.clienteId)):null;
                                    if(!cli){notify('La vivienda no tiene titulares con ficha: manda antes el enlace de datos','error');return;}
                                    openNewContrato('factura_emitida',cli.nombre);
                                    setContratoForm(p=>({...p,obra:nombreObra(o),viviendaId:v.id,
                                      items:[{desc:`Entrega a cuenta — vivienda ${v.identificador}${o.alias?' · '+o.alias:''}`,qty:1,precio:0,iva:+v.ivaTipo||10}],
                                      notas:`Vivienda ${v.identificador} · precio ${fmt(precioConIva(v))} € · pendiente de facturar ${fmt(D.pendienteFacturar)} €`}));
                                    setView('contratos');setConView('lista');
                                    notify(`🧾 Factura preparada — quedan ${fmt(D.pendienteFacturar)} € por facturar de esta vivienda`);
                                  }}>🧾 Facturar</button>}
                                  {!esLector()&&<button style={{...S.sm(C.sc),fontSize:10}} onClick={()=>{
                                    // v370 · abre el generador de reserva/arras (v369 fabricaba un documento
                                    // encabezado FACTURA: mal, y corregido)
                                    setDocVentaModal({tipo:'reserva',obra:o,vivienda:v,cond:condicionesPorDefecto(o,v)});
                                  }}>📄 Contrato</button>}
                                </div>
                              </div>
                            ))}
                          </div>);})()}
                      </div>);})}
                  </div>
                )}
                {obrasUI.vista==='fundir'&&(
                  <div style={S.card}>
                    <div style={{fontSize:11,color:C.mt,marginBottom:8}}>También puedes bajar el Excel de Recibidas (📊 Excel), añadirle una columna «Calle» o «Obra» con la promoción y traerlo con 📥 Importar Excel: la app casa cada fila por su id (o por empresa + nº + total) y crea las obras que falten. Hoy hay <b>{vals.length}</b> etiquetas de obra distintas en las facturas. Marca las que sean la misma obra y fúndelas en un nombre del catálogo (o nuevo). Los nombres viejos quedan como «otros nombres»: el lector los reconocerá.</div>
                    {sug.length>0&&<div style={{marginBottom:10}}><div style={{fontSize:11,fontWeight:700,marginBottom:4}}>Propuestas seguras ({sug.length})</div>
                      {sug.map((g,k)=><div key={k} style={{fontSize:11,padding:'5px 0',borderTop:`1px solid ${C.bd}33`,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                        <div style={{flex:1,minWidth:0}}><b>{g.destino}</b> ← {g.origenes.join(' · ')}<div style={{fontSize:10,color:C.mt}}>{g.motivo} · {g.n} facturas</div></div>
                        {!esLector()&&<BtnConfirm style={S.sm(C.sc)} armStyle={{background:C.sc,color:'#fff'}} armedLabel="¿Fundir? Toca otra vez" onConfirm={()=>{if(sinAccion('obras','fundir obras'))return;const r=fundirObras(invoices,obras,g.origenes,g.destino);origenCambio.current='obras: fundir';setInvoices(r.invoices);persistObras(r.obras);notify(`🔗 ${r.cambiadas} facturas → «${g.destino}»`);}}>Fundir</BtnConfirm>}
                      </div>)}</div>}
                    <div style={{fontSize:11,fontWeight:700,marginBottom:4}}>Todas las etiquetas</div>
                    <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:6,flexWrap:'wrap'}}>
                      <input list="bh-obras-cat" placeholder="Fundir las marcadas en… (nombre del catálogo o nuevo)" value={obrasUI.destino} onChange={e=>setObrasUI(u=>({...u,destino:e.target.value}))} style={{...S.input,flex:'1 1 220px'}}/>
                      <datalist id="bh-obras-cat">{obras.map(o=><option key={o.id} value={nombreObra(o)}/>)}</datalist>
                      {!esLector()&&<BtnConfirm style={S.sm(C.sc)} armStyle={{background:C.sc,color:'#fff'}} armedLabel="¿Fundir las marcadas? Toca otra vez" onConfirm={()=>{
                        if(sinAccion('obras','fundir obras'))return;
                        const marcadas=Object.keys(obrasUI.sel).filter(k=>obrasUI.sel[k]);const dest=String(obrasUI.destino||'').trim();
                        if(!marcadas.length||!dest){notify('Marca etiquetas y escribe el nombre de destino','error');return;}
                        const r=fundirObras(invoices,obras,marcadas,dest);origenCambio.current='obras: fundir';setInvoices(r.invoices);persistObras(r.obras);setObrasUI(u=>({...u,sel:{},destino:''}));notify(`🔗 ${r.cambiadas} facturas → «${dest}»`);
                      }}>🔗 Fundir ({Object.values(obrasUI.sel).filter(Boolean).length})</BtnConfirm>}
                    </div>
                    <div style={{maxHeight:360,overflowY:'auto'}}>
                      {vals.map(v=>{const o=obraDelCatalogo(v.valor,obras);return (
                        <label key={v.valor} style={{display:'flex',gap:8,alignItems:'center',padding:'3px 0',borderTop:`1px solid ${C.bd}22`,fontSize:11,cursor:'pointer'}}>
                          <input type="checkbox" checked={!!obrasUI.sel[v.valor]} onChange={e=>setObrasUI(u=>({...u,sel:{...u.sel,[v.valor]:e.target.checked}}))}/>
                          <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis'}}>{v.valor}{o&&nombreObra(o)!==v.valor?<span style={{color:C.sc}}> → {nombreObra(o)}</span>:''}</span>
                          <span style={{color:C.mt,flexShrink:0}}>{v.n} · {fmt(v.total)} €</span>
                        </label>);})}
                    </div>
                  </div>
                )}
                {obrasUI.vista==='coste'&&(
                  <div style={S.card}>
                    <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap',marginBottom:8,fontSize:11}}>
                      <span style={{color:C.mt}}>Periodo</span><input type="date" value={obrasUI.desde} onChange={e=>setObrasUI(u=>({...u,desde:e.target.value}))} style={{...S.input,width:130}}/>
                      <input type="date" value={obrasUI.hasta} onChange={e=>setObrasUI(u=>({...u,hasta:e.target.value}))} style={{...S.input,width:130}}/>
                      <span style={{flex:1}}/>
                      <button style={S.sm(C.mt)} onClick={()=>shareOrDownload('\ufeff'+csvCostePorObra(coste),`coste_por_obra_${today}.csv`,'text/csv;charset=utf-8')}>⬇️ CSV</button>
                    </div>
                    {coste.map((c,k)=>(
                      <div key={k} style={{padding:'6px 0',borderTop:`1px solid ${C.bd}33`,fontSize:11}}>
                        <div style={{display:'flex',gap:8,alignItems:'center'}}><b style={{flex:1,minWidth:0}}>{c.obra}{!c.enCatalogo&&<span style={{color:C.wn}}> · sin catálogo</span>}</b><span>{c.n} fact.</span><span style={{fontWeight:700,color:C.sc,minWidth:90,textAlign:'right'}}>{fmt(c.total)} €</span></div>
                        <div style={{fontSize:10,color:C.mt}}>base {fmt(c.base)} € · IVA {fmt(c.iva)} €{c.viviendas?` · ${c.viviendas} viviendas → `:''}{c.porVivienda!=null?<b style={{color:C.tx}}>{fmt(c.porVivienda)} €/vivienda (base {fmt(c.basePorVivienda)})</b>:''}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
          {conView!=='garantias'&&conView!=='obras'&&(conView==='presupuestos'?(
            <div style={{padding:10}}>
            {K.topObras.length>0?(
          <div style={{...S.card,marginTop:10}}>
            <div style={{fontSize:11,fontWeight:700,color:C.mt,marginBottom:8,textTransform:'uppercase',letterSpacing:'.04em'}}>📐 Presupuestos vs Coste real por obra</div>
            {K.topObras.map((o,i)=>{
              const budget=budgets[o.name]||0;
              const pctUsed=budget>0?Math.round(o.total/budget*100):0;
              const overBudget=budget>0&&o.total>budget;
              return(
                <div key={i} style={{padding:'6px 0',borderBottom:`1px solid ${C.bd}22`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:11}}>
                    <span style={{fontWeight:600,flex:1}}>{o.name}</span>
                    <span style={{fontWeight:700}}>{fmt(o.total)} €</span>
                  </div>
                  {budget>0?(
                    <div>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:overBudget?C.dn:C.sc,marginTop:2}}>
                        <span>{overBudget?'⚠ Desviación: +'+fmt(o.total-budget)+' €':'Disponible: '+fmt(budget-o.total)+' €'}</span>
                        <span>{pctUsed}% · Cert. {pctUsed>=100?'completa':pctUsed+'%'}</span>
                      </div>
                      <div style={{height:6,background:C.bg,borderRadius:3,marginTop:3,overflow:'hidden',position:'relative'}}>
                        <div style={{height:'100%',width:`${Math.min(pctUsed,100)}%`,background:overBudget?C.dn:pctUsed>80?C.wn:C.sc,borderRadius:3}}/>
                      </div>
                      <button style={{...S.sm(C.mt),fontSize:9,marginTop:3}} onClick={()=>{setEditBudget(o.name);setBudgetAmt(String(budget));}}>Editar presupuesto</button>
                    </div>
                  ):(
                    <div style={{display:'flex',alignItems:'center',gap:4,marginTop:2}}>
                      {editBudget===o.name?(
                        <div style={{display:'flex',gap:4,alignItems:'center'}}>
                          <input type="text" inputMode="decimal" style={{...S.input,width:110,fontSize:14,padding:'6px 8px'}} value={budgetAmt} onChange={e=>setBudgetAmt(e.target.value)} placeholder="Presupuesto €" autoFocus/>
                          <button style={S.sm(C.sc)} onClick={()=>saveBudget(o.name,budgetAmt)}>✓</button>
                          <button style={S.sm(C.mt)} onClick={()=>setEditBudget(null)}>✕</button>
                        </div>
                      ):(
                        <button style={{...S.sm(C.mt),fontSize:9}} onClick={()=>{setEditBudget(o.name);setBudgetAmt('');}}>+ Asignar presupuesto</button>
                      )}
                      {(()=>{const ob=obraDelCatalogo(o.name,obras)||obras.find(x=>nombreObra(x)===o.name)||obras.find(x=>String(x.name||'')===String(o.name));
                        return ob?<button style={{...S.sm(C.in),fontSize:9,marginTop:3}} onClick={()=>setExpedienteObra({tipo:'obra',id:ob.id})}>📋 Expediente</button>:null;})()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ):(<div style={{...S.card,textAlign:'center',color:C.mt,fontSize:12}}>Sin obras con movimiento en el periodo — los presupuestos por obra aparecerán aquí al facturar contra ellas.</div>)}
            </div>
          ):Contratos())}
        </div>
      )}
      {vivModal&&(()=>{const v=vivModal.v;const o=obras.find(x=>String(x.id)===String(v.obraId));const pon=(c)=>setVivModal(m=>({v:{...(m&&m.v||v),...c}}));/* funcional: dos cambios seguidos no se pisan */const cat=asegurarIds(cliCat);
        const campo=(l,k,tipo,extra)=><label style={{display:'block'}}><span style={{fontSize:10,color:C.mt}}>{l}</span><input {...(extra||{})} type={tipo||'text'} value={v[k]==null?'':v[k]} onChange={e=>pon({[k]:tipo==='number'?(parseNum(e.target.value)||0):(tipo?e.target.value:MAY(e.target.value))})} style={S.input}/></label>;
        return (
        <div style={S.overlay} onClick={avisarCerrar}><div style={{...S.modal,maxWidth:560}} onClick={e=>e.stopPropagation()}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}><span style={{fontWeight:700,flex:1}}>🏠 Vivienda {v.identificador||''} · {o?nombreObra(o):''}</span><button onClick={()=>setVivModal(null)} style={{background:'transparent',border:'none',color:C.mt,fontSize:20,cursor:'pointer'}}>✕</button></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {campo('Identificador (nº, letra, parcela)','identificador')}{campo('Tipología','tipologia')}
            {campo('m² construidos','superficieConstruida','number',{inputMode:'decimal'})}{campo('m² útiles','superficieUtil','number',{inputMode:'decimal'})}
            {campo('m² parcela','superficieParcela','number',{inputMode:'decimal'})}{campo('Anejos (garaje, trastero…)','anejos')}
            {campo('Precio de venta (sin IVA)','precio','number',{inputMode:'decimal'})}{campo('IVA %','ivaTipo','number',{inputMode:'decimal'})}
            <label style={{display:'block'}}><span style={{fontSize:10,color:C.mt}}>Estado</span><select value={v.estado} onChange={e=>pon({estado:e.target.value})} style={S.input}>{ESTADOS_VIVIENDA.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></label>
            {campo('Fecha de reserva','fechaReserva','date')}{campo('Fecha de arras','fechaArras','date')}{campo('Fecha de escritura','fechaEscritura','date')}
          </div>
          <div style={{marginTop:10,fontSize:11}}>
            <div style={{fontWeight:700,marginBottom:4}}>Titulares</div>
            {(v.titulares||[]).map((t,k)=>(
              <div key={k} style={{display:'flex',gap:6,alignItems:'center',marginBottom:4}}>
                <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis'}}>{nombreTitular(t,cat)}</span>
                <input inputMode="decimal" value={t.porcentaje} onChange={e=>pon({titulares:v.titulares.map((x,i)=>i===k?{...x,porcentaje:parseNum(e.target.value)||0}:x)})} style={{...S.input,width:56}}/> <span style={{color:C.mt}}>%</span>
                <select value={t.regimen||''} onChange={e=>pon({titulares:v.titulares.map((x,i)=>i===k?{...x,regimen:e.target.value}:x)})} style={{...S.input,width:130}}><option value="">régimen…</option>{REGIMENES.map(r=><option key={r} value={r}>{r}</option>)}</select>
                <button onClick={()=>pon({titulares:v.titulares.filter((_,i)=>i!==k)})} style={{background:'none',border:'none',color:C.dn,cursor:'pointer'}}>✕</button>
              </div>))}
            <div style={{display:'flex',gap:6}}>
              <input list="bh-cli-titular" placeholder="Añadir titular (ficha de cliente)…" onKeyDown={e=>{if(e.key==='Enter'){const c=cat.find(x=>x.nombre===e.target.value);if(c){pon({titulares:normalizaTitulares([...(v.titulares||[]),{clienteId:idCliente(c),porcentaje:0,regimen:''}])});e.target.value='';}}}} onBlur={e=>{const c=cat.find(x=>x.nombre===e.target.value);if(c){pon({titulares:normalizaTitulares([...(v.titulares||[]),{clienteId:idCliente(c),porcentaje:0,regimen:''}])});e.target.value='';}}} style={{...S.input,flex:1}}/>
              <datalist id="bh-cli-titular">{cat.map(c=><option key={idCliente(c)} value={c.nombre}/>)}</datalist>
            </div>
            <div style={{fontSize:10,color:C.mt,marginTop:2}}>Si el comprador rellena el portal con su enlace, los titulares entran solos.</div>
          </div>
          <div style={{marginTop:10,fontSize:11}}>
            <div style={{fontWeight:700,marginBottom:4}}>Mejoras ({(v.mejoras||[]).length}) · {fmt(totalMejoras(v))} €</div>
            {(v.mejoras||[]).map(m=>(<div key={m.id} style={{display:'flex',gap:6,alignItems:'center',marginBottom:3}}><span style={{flex:1,minWidth:0}}>{m.concepto}<span style={{color:C.mt}}> · {m.origen} · {fmtDate(m.fecha)}</span></span><b>{fmt(m.importe)} €</b><button onClick={()=>pon({mejoras:v.mejoras.filter(x=>x.id!==m.id)})} style={{background:'none',border:'none',color:C.dn,cursor:'pointer'}}>✕</button></div>))}
            <div style={{display:'flex',gap:6}}><input id="bh-mej-c" placeholder="Concepto" style={{...S.input,flex:2}}/><input id="bh-mej-i" inputMode="decimal" placeholder="€" style={{...S.input,flex:1}}/><button style={S.sm(C.sc)} onClick={()=>{const c=document.getElementById('bh-mej-c'),i=document.getElementById('bh-mej-i');const r=aplicarMejoras(v,[{concepto:c.value,importe:parseNum(i.value)||0}],'manual');pon({mejoras:r.vivienda.mejoras});c.value='';i.value='';}}>➕</button></div>
          </div>
          <div style={{marginTop:8,fontSize:11,color:C.mt}}>Total {fmt(precioTotal(v))} € · con IVA {fmt(precioConIva(v))} €</div>
          <label style={{display:'block',marginTop:8}}><span style={{fontSize:10,color:C.mt}}>Notas</span><textarea value={v.notas||''} onChange={e=>pon({notas:MAY(e.target.value)})} style={{...S.input,minHeight:50}}/></label>
          <div style={{display:'flex',gap:8,marginTop:10}}>
            <button style={{...S.btn(C.sc),flex:1}} onClick={()=>{if(soloLector())return;const vv={...v,titulares:normalizaTitulares(v.titulares)};persistViviendas(viviendas.some(x=>x.id===vv.id)?viviendas.map(x=>x.id===vv.id?vv:x):[...viviendas,vv]);setVivModal(null);notify('💾 Vivienda guardada');}}>💾 Guardar</button>
            {viviendas.some(x=>x.id===v.id)&&<BtnConfirm style={S.sm(C.dn)} armStyle={{background:C.dn,color:'#fff'}} armedLabel="¿Borrar la vivienda? Toca otra vez" onConfirm={()=>{if(soloLector())return;persistViviendas(viviendas.filter(x=>x.id!==v.id));setVivModal(null);}}>🗑</BtnConfirm>}
            <button style={S.ghost} onClick={()=>setVivModal(null)}>Cerrar</button>
          </div>
        </div></div>);})()}
      {!sinAccesoSub&&view==='nominas'&&Nominas()}
      {!sinAccesoSub&&view==='flota'&&(()=>{
        const empC={BIG:C.in,GREEN:C.sc,BENITO:C.vt};
        const Chip=({e})=>e&&e!=='BIG'?<span style={{fontSize:8,fontWeight:800,color:empC[e]||C.mt,border:`1px solid ${empC[e]||C.mt}66`,borderRadius:5,padding:'0 4px',marginLeft:5,verticalAlign:'middle'}}>{e}</span>:null;
        const activos=flota.filter(v=>v.activa!==false);
        const chips=(v)=>[['ITV',v.itv],['Seguro',v.seguroVto],['Mant.',v.mantFecha]].map(([l,d])=>{const dy=daysTo(d);return{l,d,dy,c:vencColor(dy,C)};});
        const urgencia=(v)=>Math.min(...chips(v).map(c=>c.dy===null?9999:c.dy));
        const alertas=activos.flatMap(v=>chips(v).filter(c=>c.dy!==null&&c.dy<=30).map(c=>({v,...c})));
        const activasP=polizas.filter(p=>p.activa!==false);
        const urgP=(p)=>{const d=daysTo(p.vto);return d===null?9999:d;};
        const alertasP=activasP.filter(p=>{const d=daysTo(p.vto);return d!==null&&d<=30;});
        return(
          <div style={{padding:10}}>
            <BarraTeso/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,gap:6}}>
              <div style={{display:'flex',gap:4}}>
                {[['polizas','🛡️ Pólizas'],['vehiculos','🚐 Vehículos']].map(([k,l])=>(
                  <button key={k} style={{padding:'8px 10px',border:'none',cursor:'pointer',fontSize:12,fontWeight:flotaView===k?700:500,background:flotaView===k?C.in+'22':'transparent',color:flotaView===k?C.in:C.mt,borderRadius:8}} onClick={()=>setFlotaView(k)}>{l}</button>
                ))}
              </div>
              {/* Copiar seguros a pólizas: pequeño y donde están los coches */}
              {flotaView==='vehiculos'&&!esLector()&&(
                <label style={{...S.sm(C.wn),fontSize:11,whiteSpace:'nowrap',cursor:'pointer'}} title="Trae los vehículos desde flota_rescate.json (viene en el zip)">
                  🚐 Recuperar flota
                  <input type="file" accept=".json" style={{display:'none'}} onChange={e=>{
                    const f=e.target.files&&e.target.files[0];e.target.value='';
                    if(!f)return;
                    if(sinAccion('seguros','recuperar la flota'))return;
                    const rd=new FileReader();
                    rd.onload=()=>{try{
                      const lista=JSON.parse(rd.result);
                      if(!Array.isArray(lista)||!lista.length||!lista.every(v=>v&&v.matricula)){notify('Ese fichero no es una lista de vehículos','error');return;}
                      const mats=new Set((flota||[]).map(v=>String(v.matricula||'').toUpperCase().replace(/[^A-Z0-9]/g,'')));
                      const faltan=lista.filter(v=>!mats.has(String(v.matricula||'').toUpperCase().replace(/[^A-Z0-9]/g,'')));
                      if(!faltan.length){notify('Ya los tienes todos: no se ha tocado nada');return;}
                      const next=[...(flota||[]),...faltan.map(v=>({...v,tipo:'vehiculo',activa:v.activa!==false}))];
                      setFlota(next);window.storage.set('bh10-flota',JSON.stringify(next)).catch(er=>console.error('Error guardando flota',er));
                      notify(`🚐 ${faltan.length} vehículos recuperados — revisa vencimientos y primas`);
                    }catch(er){notify('No se pudo leer el fichero: '+String(er&&er.message||er).slice(0,70),'error');}};
                    rd.readAsText(f);
                  }}/>
                </label>
              )}
              {flotaView==='vehiculos'&&!esLector()&&(()=>{
                const mats=new Set((flota||[]).map(v=>String(v.matricula||'').toUpperCase().replace(/[^A-Z0-9]/g,'')));
                const faltan=FLOTA_RESCATE.filter(v=>!mats.has(v.matricula));
                if(!faltan.length)return null;
                return <BtnConfirm style={{...S.sm(C.wn),fontSize:11,whiteSpace:'nowrap'}} armStyle={{background:C.wn,color:'#fff'}}
                  armedLabel={`¿Recuperar ${faltan.length}? Toca otra vez`} onConfirm={()=>{
                    if(sinAccion('seguros','recuperar la flota'))return;
                    const next=[...(flota||[]),...faltan];
                    setFlota(next);window.storage.set('bh10-flota',JSON.stringify(next)).catch(e=>console.error('Error guardando flota',e));
                    notify(`🚐 ${faltan.length} vehículos recuperados — revisa vencimientos y primas`);
                  }}>🚐 Recuperar {faltan.length} vehículos</BtnConfirm>;
              })()}
              <button style={S.btn()} onClick={()=>{if(flotaView==='polizas'){setPolForm(emptyPoliza);setPolModal('new');}else{setFlotaForm(emptyVeh);setFlotaModal('new');}}}>+ Añadir</button>
            </div>
            {lastBaja&&(
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:C.in+'15',border:`1px solid ${C.in}44`,borderRadius:10,padding:'8px 12px',marginBottom:10,fontSize:12}}>
                <span>🗑 {lastBaja.kind==='pol'?'Póliza dada de baja':'Vehículo dado de baja'}</span>
                <button style={S.sm(C.in)} onClick={()=>restaurarItem(lastBaja.kind,lastBaja.id)}>↩ Deshacer</button>
              </div>
            )}
            {flotaView==='polizas'&&(()=>{
              const vivas=(polizas||[]).filter(p=>p&&p.activa!==false);
              const dup=riesgosDuplicados(vivas);
              const coste=vivas.reduce((s,p)=>s+primaAnual(p),0);
              return(
                <>
                  {/* Lo que faltaba: ver de un vistazo el coste y lo que vence */}
                  <div style={{display:'flex',gap:6,marginBottom:8,flexWrap:'wrap'}}>
                    {[['todas','Todas',vivas.length],
                    ['vencidas','Vencidas',vivas.filter(p=>{const d=diasAVencer(p);return d!==null&&d<0;}).length],
                    ['30','Menos de 30 d',vivas.filter(p=>{const d=diasAVencer(p);return d!==null&&d>=0&&d<=30;}).length],
                    ['90','Menos de 90 d',vivas.filter(p=>{const d=diasAVencer(p);return d!==null&&d>30&&d<=90;}).length],
                    ['sinfecha','Sin fecha',vivas.filter(p=>diasAVencer(p)===null).length],
                  ].filter(([k,l,n])=>k!=='sinfecha'||n>0).map(([k,l,n])=>(
                      <button key={k} style={{padding:'6px 10px',borderRadius:14,fontSize:11,cursor:'pointer',
                        border:`1px solid ${polFiltro.vto===k?C.in:C.bd}`,
                        background:polFiltro.vto===k?C.in+'22':'transparent',
                        color:polFiltro.vto===k?C.in:(k==='vencidas'&&n>0?C.dn:C.mt),fontWeight:polFiltro.vto===k?700:500}}
                        onClick={()=>setPolFiltro(f=>({...f,vto:k}))}>{l} ({n})</button>
                    ))}
                  </div>

                  {/* ── ORDENAR Y AFINAR ── */}
                  {/* Con cincuenta pólizas de tres empresas no basta el
                      vencimiento: se ordena y se filtra por lo que haga falta. */}
                  <div style={{display:'flex',gap:6,marginBottom:8,flexWrap:'wrap',alignItems:'center'}}>
                    <select style={{...S.select,flex:'1 1 190px',fontSize:11,padding:'7px 9px',minWidth:0}}
                      value={polOrden} onChange={e=>setPolOrden(e.target.value)}>
                      {Object.entries(ORDENES).map(([k,v])=><option key={k} value={k}>{v.n}</option>)}
                    </select>
                    {(()=>{
                      const act=(polFiltro.empresa?1:0)+(polFiltro.ramo?1:0)+(String(polFiltro.texto||'').trim()?1:0);
                      return(
                        <button style={{padding:'7px 11px',borderRadius:9,fontSize:11,cursor:'pointer',whiteSpace:'nowrap',
                          border:`1px solid ${act?C.in:C.bd}`,background:act?C.in+'22':'transparent',
                          color:act?C.in:C.mt,fontWeight:act?700:500}}
                          onClick={()=>setPolMasFiltros(v=>!v)}>🔎 Filtros{act?` (${act})`:''}</button>
                      );
                    })()}
                  </div>

                  {polMasFiltros&&(
                    <div style={{...S.card,marginBottom:8,padding:'10px 12px'}}>
                      <input style={{...S.input,fontSize:16,marginBottom:8}} value={polFiltro.texto}
                        placeholder="Buscar por matrícula, dirección, nº de póliza o compañía"
                        onChange={e=>setPolFiltro(f=>({...f,texto:e.target.value}))}/>
                      {(()=>{
                        const porEmp=cuentaPolizas(activasP,polFiltro,'empresa');
                        const emps=Object.keys(porEmp).sort();
                        if(emps.length<2)return null;
                        return(<>
                          <div style={{fontSize:10,color:C.mt,marginBottom:4}}>EMPRESA</div>
                          <div style={{display:'flex',gap:5,marginBottom:9,flexWrap:'wrap'}}>
                            <button style={{padding:'5px 9px',borderRadius:12,fontSize:10.5,cursor:'pointer',
                              border:`1px solid ${!polFiltro.empresa?C.in:C.bd}`,background:!polFiltro.empresa?C.in+'22':'transparent',
                              color:!polFiltro.empresa?C.in:C.mt,fontWeight:!polFiltro.empresa?700:500}}
                              onClick={()=>setPolFiltro(f=>({...f,empresa:''}))}>Todas</button>
                            {emps.map(k=>(
                              <button key={k} style={{padding:'5px 9px',borderRadius:12,fontSize:10.5,cursor:'pointer',
                                border:`1px solid ${polFiltro.empresa===k?C.in:C.bd}`,background:polFiltro.empresa===k?C.in+'22':'transparent',
                                color:polFiltro.empresa===k?C.in:C.mt,fontWeight:polFiltro.empresa===k?700:500}}
                                onClick={()=>setPolFiltro(f=>({...f,empresa:f.empresa===k?'':k}))}>{k} ({porEmp[k]})</button>
                            ))}
                          </div>
                        </>);
                      })()}
                      {(()=>{
                        const porRamo=cuentaPolizas(activasP,polFiltro,'ramo');
                        const ramos=Object.keys(porRamo).sort((a,b)=>porRamo[b]-porRamo[a]);
                        if(!ramos.length)return null;
                        return(<>
                          <div style={{fontSize:10,color:C.mt,marginBottom:4}}>TIPO DE SEGURO</div>
                          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                            <button style={{padding:'5px 9px',borderRadius:12,fontSize:10.5,cursor:'pointer',
                              border:`1px solid ${!polFiltro.ramo?C.in:C.bd}`,background:!polFiltro.ramo?C.in+'22':'transparent',
                              color:!polFiltro.ramo?C.in:C.mt,fontWeight:!polFiltro.ramo?700:500}}
                              onClick={()=>setPolFiltro(f=>({...f,ramo:''}))}>Todos</button>
                            {ramos.map(k=>(
                              <button key={k} style={{padding:'5px 9px',borderRadius:12,fontSize:10.5,cursor:'pointer',
                                border:`1px solid ${polFiltro.ramo===k?C.in:C.bd}`,background:polFiltro.ramo===k?C.in+'22':'transparent',
                                color:polFiltro.ramo===k?C.in:C.mt,fontWeight:polFiltro.ramo===k?700:500}}
                                onClick={()=>setPolFiltro(f=>({...f,ramo:f.ramo===k?'':k}))}>
                                {(RAMOS[k]||{}).ic||'📄'} {(RAMOS[k]||{}).n||k} ({porRamo[k]})</button>
                            ))}
                          </div>
                        </>);
                      })()}
                      {(polFiltro.empresa||polFiltro.ramo||String(polFiltro.texto||'').trim())&&(
                        <button style={{...S.sm(C.mt),marginTop:9,fontSize:10.5,width:'100%'}}
                          onClick={()=>setPolFiltro(f=>({vto:f.vto,empresa:'',ramo:'',texto:''}))}>Quitar los filtros</button>
                      )}
                    </div>
                  )}

                  <div style={{...S.card,marginBottom:8,display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                    <div style={{flex:1,minWidth:120}}>
                      <div style={{fontSize:10,color:C.mt}}>Coste anual de todas las pólizas</div>
                      <div style={{fontSize:18,fontWeight:800}}>{fmt(coste)} €</div>
                    </div>
                    <label style={{...S.sm(C.in),fontSize:11,cursor:'pointer',display:'inline-flex',alignItems:'center'}}>
                      📥 Importar
                      <input type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}} onChange={async e=>{
                        const f=e.target.files&&e.target.files[0]; e.target.value='';
                        if(!f)return;
                        try{
                          const XLSX=await import('xlsx');
                          const wb=XLSX.read(await f.arrayBuffer(),{cellDates:true});
                          const ws=wb.Sheets[wb.SheetNames[0]];
                          const filas=XLSX.utils.sheet_to_json(ws,{defval:''});
                          const r=leerFilasPolizas(filas);
                          if(!r.polizas.length){notify('No he encontrado pólizas en ese archivo','error');return;}
                          setPolImport({...r,nombre:f.name});
                        }catch(x){notify('No se pudo leer: '+((x&&x.message)||x),'error');}
                      }}/>
                    </label>
                    <button style={{...S.sm(C.sc),fontSize:11}} onClick={()=>{
                      const cab=['Empresa','Ramo','Qué asegura','Nº póliza','Compañía','Prima','Periodicidad','Coste anual','Vencimiento','Días','Notas'];
                      const filas=vivas.slice().sort((a,b)=>String(a.vto||'9').localeCompare(String(b.vto||'9'))).map(p=>{
                        const d=diasAVencer(p);
                        return [p.empresa||'',((RAMOS[p.ramo]||{}).n)||p.tipo||'',p.objeto||p.desc||'',p.nPoliza||'',p.cia||'',
                          fmt(parseNum(p.prima)||0),((PERIODOS[p.periodicidad||'anual']||{}).n)||'Anual',
                          fmt(primaAnual(p)),p.vto?fmtDate(p.vto):'',d===null?'':String(d),p.notas||''];
                      });
                      const csv=[cab.join(';'),...filas.map(f=>f.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(';'))].join('\r\n');
                      shareOrDownload('\uFEFF'+csv,`seguros_${today}.csv`,'text/csv;charset=utf-8');
                      notify(`📄 ${filas.length} pólizas exportadas`);
                    }}>📄 Exportar todas</button>
                  </div>

                  {/* Traspasar los seguros que aún viven dentro de los vehículos */}
                  {dup.length>0&&(
                    <div style={{background:C.dn+'14',border:`1px solid ${C.dn}55`,borderRadius:10,padding:'10px 12px',marginBottom:8}}>
                      <div style={{fontWeight:700,fontSize:12,color:C.dn}}>⚠ {dup.length} riesgo{dup.length!==1?'s':''} asegurado{dup.length!==1?'s':''} dos veces</div>
                      <div style={{fontSize:10,color:C.mt,marginTop:2,marginBottom:5}}>Estás pagando dos pólizas por lo mismo. Revisa cuál dar de baja.</div>
                      {dup.map((r,i)=>(
                        <div key={i} style={{background:C.bg,borderRadius:8,padding:'7px 9px',marginTop:5,fontSize:11}}>
                          <b>{(RAMOS[r.ramo]||{}).ic||'📄'} {r.objeto||'(sin identificar)'}</b>
                          <div style={{fontSize:10,color:C.mt,marginTop:2}}>
                            {r.polizas.map(p=>`${p.cia||'sin compañía'} · ${fmt(primaAnual(p))} €/año`).join('  —  ')}
                          </div>
                          <div style={{fontSize:10,color:C.wn,marginTop:2}}>
                            Duplicado: {fmt(Math.min(...r.polizas.map(primaAnual)))} €/año de más
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
            {flotaView==='vehiculos'?(<>
            {alertas.length>0&&(
              <div style={{background:C.wn+'15',border:`1px solid ${C.wn}44`,borderRadius:10,padding:'8px 12px',marginBottom:10,fontSize:12}}>
                <b style={{color:C.wn}}>⚠ {alertas.length} vencimiento{alertas.length!==1?'s':''} en 30 días o pasado{alertas.length!==1?'s':''}</b>
              </div>
            )}
            {activos.length===0?<div style={{textAlign:'center',padding:30,color:C.mt}}>Sin vehículos ni máquinas<div style={{fontSize:11,marginTop:6}}>Añade el primero y controla ITV, seguro y mantenimiento</div></div>:
              [...activos].sort((a,b)=>urgencia(a)-urgencia(b)).map(v=>(
                <div key={v.id} style={{...S.card,marginBottom:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:13}}>{v.tipo==='maquina'?'🏗️':'🚐'} {v.alias||v.matricula}{v.alias&&v.matricula?<span style={{color:C.mt,fontWeight:500}}> · {v.matricula}</span>:''}<Chip e={v.empresa}/></div>
                      {v.seguroCia&&<div style={{fontSize:10,color:C.mt}}>Seguro: {v.seguroCia}{v.seguroPrima?` · ${fmt(v.seguroPrima)} €/año`:''}</div>}
                      {v.mantNota&&<div style={{fontSize:10,color:C.mt}}>Mant.: {v.mantNota}</div>}
                      {v.notas&&<div style={{fontSize:10,color:C.wn}}>📝 {v.notas}</div>}
                    </div>
                    <div style={{display:'flex',gap:6}}><button style={S.sm(C.in)} onClick={()=>{setFlotaForm({...emptyVeh,...v});setFlotaModal(v.id);}}>✏️</button><button style={S.sm(C.dn)} onClick={()=>bajaItem('veh',v.id)}>🗑</button></div>
                  </div>
                  <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
                    {chips(v).map(ch=>(
                      <div key={ch.l} style={{flex:'1 1 100px',background:ch.c+'15',border:`1px solid ${ch.c}44`,borderRadius:8,padding:'6px 8px',textAlign:'center'}}>
                        <div style={{fontSize:9,fontWeight:700,color:ch.c,textTransform:'uppercase'}}>{ch.l}</div>
                        <div style={{fontSize:11,fontWeight:700,color:ch.c}}>{ch.d?fmtDate(ch.d):'—'}</div>
                        <div style={{fontSize:9,color:ch.c}}>{vencTxt(ch.dy)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            {flota.some(v=>v.activa===false)&&(<>
              <div style={{fontSize:10,color:C.in,textAlign:'center',padding:6,cursor:'pointer'}} onClick={()=>setVerBajas(x=>!x)}>{flota.filter(v=>v.activa===false).length} de baja — {verBajas?'ocultar':'ver y restaurar'}</div>
              {verBajas&&flota.filter(v=>v.activa===false).map(v=>(
                <div key={v.id} style={{...S.card,marginBottom:6,opacity:.65,display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                  <div style={{fontSize:11,minWidth:0}}>{v.tipo==='maquina'?'🏗️':'🚐'} <b>{v.alias||v.matricula}</b>{v.alias&&v.matricula?` · ${v.matricula}`:''}</div>
                  <button style={S.sm(C.sc)} onClick={()=>restaurarItem('veh',v.id)}>↩ Restaurar</button>
                </div>
              ))}
            </>)}
            </>):(<>
            {alertasP.length>0&&(
              <div style={{background:C.wn+'15',border:`1px solid ${C.wn}44`,borderRadius:10,padding:'8px 12px',marginBottom:10,fontSize:12}}>
                <b style={{color:C.wn}}>⚠ {alertasP.length} póliza{alertasP.length!==1?'s':''} vencida{alertasP.length!==1?'s':''} o a punto de vencer</b>
              </div>
            )}
            {activasP.length===0?<div style={{textAlign:'center',padding:30,color:C.mt}}>Sin pólizas registradas<div style={{fontSize:11,marginTop:6}}>RC, decenal, accidentes de convenio, todo riesgo construcción…</div></div>:
              ordenarPolizas(filtrarPolizas(activasP,polFiltro),polOrden).map(p=>{const dy=daysTo(p.vto);const c=vencColor(dy,C);return(
                <div key={p.id} style={{...S.card,marginBottom:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:13,display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'}}>
                        <span>{(RAMOS[p.ramo]||{}).ic||'🛡️'} {p.nPoliza||p.tipo||'Póliza'}</span>
                        <Chip e={p.empresa}/>
                        {/* El triángulo: esta misma cosa ya está asegurada en otra
                            póliza viva. Se calcula sobre la lista entera, no sobre
                            la tarjeta, porque un duplicado necesita dos. */}
                        {(()=>{
                          const k=claveRiesgo(p);
                          if(!k)return null;
                          const otras=(polizas||[]).filter(x=>x&&x.activa!==false&&x.id!==p.id&&claveRiesgo(x)===k);
                          if(!otras.length)return null;
                          return(
                            <span title={`Ya asegurado en: ${otras.map(x=>x.cia||'sin compañía').join(', ')}`}
                              style={{background:C.wn+'26',color:C.wn,borderRadius:6,padding:'1px 6px',fontSize:9,fontWeight:800}}>
                              ⚠️ POSIBLE DUPLICADA
                            </span>
                          );
                        })()}
                      </div>
                      <div style={{fontSize:11,marginTop:2}}>{p.objeto||p.desc}</div>
                      <div style={{fontSize:10,color:C.mt,marginTop:2}}>
                        {(RAMOS[p.ramo]||{}).n||p.tipo||''}{p.cia?' · '+p.cia:''}
                        {p.prima?` · ${fmt(p.prima)} €${(p.periodicidad&&p.periodicidad!=='anual')?'/'+((PERIODOS[p.periodicidad]||{}).n||'').toLowerCase():'/año'}`:''}
                        {p.prima&&p.periodicidad&&p.periodicidad!=='anual'?` (${fmt(primaAnual(p))} €/año)`:''}
                      </div>
                      {p.notas&&<div style={{fontSize:10,color:C.wn,marginTop:2}}>📝 {p.notas}</div>}
                    </div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
                      <div style={{display:'flex',gap:6}}><button style={S.sm(C.in)} onClick={()=>{setPolForm({...emptyPoliza,...p,prima:(p.prima||p.prima===0)&&p.prima!==''?fmt(parseNum(p.prima)):''});setPolModal(p.id);}}>✏️</button><button style={S.sm(C.dn)} onClick={()=>bajaItem('pol',p.id)}>🗑</button></div>
                      <div style={{background:c+'15',border:`1px solid ${c}44`,borderRadius:8,padding:'4px 8px',textAlign:'center',minWidth:86}}>
                        <div style={{fontSize:11,fontWeight:700,color:c}}>{p.vto?fmtDate(p.vto):'—'}</div>
                        <div style={{fontSize:9,color:c}}>{vencTxt(dy)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );})}
            {polizas.some(p=>p.activa===false)&&(<>
              <div style={{fontSize:10,color:C.in,textAlign:'center',padding:6,cursor:'pointer'}} onClick={()=>setVerBajas(x=>!x)}>{polizas.filter(p=>p.activa===false).length} de baja — {verBajas?'ocultar':'ver y restaurar'}</div>
              {verBajas&&polizas.filter(p=>p.activa===false).map(p=>(
                <div key={p.id} style={{...S.card,marginBottom:6,opacity:.65,display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                  <div style={{fontSize:11,minWidth:0}}>🛡️ <b>{p.tipo||'Póliza'}</b>{p.desc?` · ${p.desc}`:''}</div>
                  <button style={S.sm(C.sc)} onClick={()=>restaurarItem('pol',p.id)}>↩ Restaurar</button>
                </div>
              ))}
            </>)}
            </>)}
          </div>
        );
      })()}
      {view==='config'&&<ConfigAj hijos={React.Children.toArray(ConfigBruto().props.children).filter(Boolean)} abiertos={abiertosAj} alternar={alternarAj} ordenConfig={ordenConfig} onOrden={(l)=>{setApartados(l);setOrdenConfig(l);try{window.storage.set('bh10-ordenconfig',JSON.stringify(l));}catch(e){}}}
        onRestablecer={()=>{setOrdenConfig([]);setApartados([]);try{window.storage.delete('bh10-ordenconfig');}catch(e){}notify('↺ Orden restablecido');}}
        instantanea={()=>({compCfg,anthKey,custodia})} restaurar={(sn)=>{if(!sn)return;setCompCfg(sn.compCfg);setAnthKey(sn.anthKey);setCustodia(sn.custodia);}} aviso={avisoCertVf()}/>}
      {verDebug&&<DebugHUD/>}
      {paqueteTrozos&&<VentanaTrozos/>}
      {verTeso&&puedeVer('tesoreria')&&(()=>{
        const prev=previsionTesoreria({empleados:employees,polizas,facturas:invoices,recPatrones,
          presupuestoPersonal:{mensual:parseNum(compCfg.prMensualPersonal)||0,extraImporte:parseNum(compCfg.prExtraImporte)||0,irpfTrimestral:parseNum(compCfg.prIrpfTrim)||0,extras:String(compCfg.prPagasExtra||'6,12').split(',').map(Number)},
          getSaldoF:(f)=>getSaldo(f,invoices)},today.slice(0,7),6);
        return(
        <div style={{...S.overlay,zIndex:CAPAS.SOBRE}}>
          <div style={{...S.modal,maxWidth:560}} onClick={e=>e.stopPropagation()}>
            <div style={S.cabModal}><b style={{fontSize:14,flex:1,minWidth:0}}>💰 Previsión de tesorería</b>
              <button style={S.ghost} onClick={()=>setVerTeso(false)}>✕</button></div>
            <div style={{fontSize:10.5,color:C.mt,lineHeight:1.5,marginBottom:8}}>
              Con lo que la app ya sabe: nóminas de la plantilla, Seguridad Social ESTIMADA
              (~41% sobre líquidos), primas según periodicidad, facturas por pagar (lo ya
              vencido, cargado al primer mes) y cobros previstos. El saldo real del banco
              se sumará cuando conectemos la lectura de cuentas de Eurocaja.
            </div>
            <button style={{...S.sm(C.in),width:'100%',marginBottom:8}} onClick={()=>setVerRecu(true)}>
              🧠 Recurrentes del extracto — pega tu Norma 43 y aprende los gastos fuera de factura
            </button>
            
            <div style={{fontSize:11,marginBottom:6}}>
              Nóminas/mes: <b>{fmt(prev.nominas)} €</b> · {prev.ssAprendida
                ?<span style={{color:C.sc,fontWeight:700}}>SS real aprendida del extracto (estimación apagada)</span>
                :<>SS estimada/mes: <b>{fmt(prev.ss)} €</b></>}
            </div>
            <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:8}}>
              <span style={{fontSize:10.5,color:C.mt,flex:1}}>🧠 Recurrentes aprendidos: <b>{recPatrones.length}</b>{recDatos.movs&&recDatos.movs.length?` (extracto de ${recDatos.movs.length} apuntes)`:''}</span>
              <button style={{...S.sm(C.in),padding:'3px 9px',minHeight:0}} onClick={()=>setPegaExtracto(true)}>📥 Pegar extracto</button>
            </div>
            {prev.filas.map(f=>(
              <div key={f.mes} style={{border:`1px solid ${C.bd}55`,borderRadius:9,padding:'7px 10px',marginBottom:6}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,fontWeight:800}}>
                  <span>📅 {f.mes}</span>
                  <span style={{color:f.neto>=0?C.sc:C.dn}}>{f.neto>=0?'+':''}{fmt(f.neto)} €</span>
                </div>
                <div style={{fontSize:10,color:C.mt,marginTop:2}}>
                  Sale: nóminas {fmt(f.nominas)} + SS {fmt(f.ss)} + seguros {fmt(f.seguros)} + recurrentes {fmt(f.recurrentes||0)} + facturas {fmt(f.pagar)} = <b>{fmt(f.salidas)} €</b>
                </div>
                <div style={{fontSize:10,color:C.mt}}>Entra: {fmt(f.cobrar)} € · Acumulado: <b style={{color:f.acumulado>=0?C.sc:C.dn}}>{fmt(f.acumulado)} €</b></div>
              </div>
            ))}
            {prev.necesidad>0&&(
              <div style={{background:C.dn+'18',border:`1.5px solid ${C.dn}`,borderRadius:9,padding:'8px 10px',fontSize:11,fontWeight:700,color:C.dn,marginBottom:8}}>
                ⚠️ Para cubrir el semestre harían falta {fmt(prev.necesidad)} € entre saldo actual e ingresos nuevos, además de los cobros previstos.
              </div>)}
            <button style={{...S.btn(C.sc),width:'100%'}} onClick={()=>setVerTeso(false)}>✔ Hecho</button>
          </div>
        </div>);
      })()}
      {verMaster&&!esMiembro()&&(()=>{
        const guardaUsuarios=async(lista)=>{setUsuariosApp(lista);
          try{await window.storage.set('bh10-usuarios',JSON.stringify(lista));}catch(e){}};
        const guardaSesiones=async(lista)=>{setSesionesApp(lista);
          try{await window.storage.set('bh10-sesiones',JSON.stringify(lista));}catch(e){}};
        const fF=(x)=>String(x||'').replace('T',' ').slice(0,16);
        return(
        <div style={{...S.overlay,zIndex:CAPAS.SOBRE2}}>
          <div style={{...S.modal,maxWidth:600}} onClick={e=>e.stopPropagation()}>
            <div style={S.cabModal}><b style={{fontSize:14,flex:1,minWidth:0}}>🛡️ Master</b>
              <button style={S.ghost} onClick={()=>setVerMaster(false)}>✕</button></div>
            <div style={{display:'flex',gap:6,marginBottom:10}}>
              <button style={masterTab==='usuarios'?S.btn(C.in):S.sm(C.in)} onClick={()=>setMasterTab('usuarios')}>👥 Usuarios</button>
              <button style={masterTab==='sesiones'?S.btn(C.in):S.sm(C.in)} onClick={async()=>{setMasterTab('sesiones');
                try{const rs=await window.storage.get('bh10-sesiones');const l=rs?.value?JSON.parse(rs.value):[];if(Array.isArray(l))setSesionesApp(l);}catch(e){}
              }}>🖥️ Sesiones</button>
            </div>

            {masterTab==='usuarios'&&<>
              <div style={{border:`1px dashed ${C.bd}88`,borderRadius:9,padding:'7px 9px',marginBottom:8}}>
                <div style={{fontSize:10.5,fontWeight:700,marginBottom:4}}>⚙️ Worker Master (fase 2) — para activar cuentas de verdad</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  <input style={{...S.inp,flex:'2 1 150px'}} placeholder="https://bh10group.com/master" value={masterCfg.url}
                    onChange={e=>setMasterCfg({...masterCfg,url:e.target.value})}/>
                  <input style={{...S.inp,flex:'1 1 110px'}} type="password" placeholder="clave (solo transición)" value={masterCfg.clave}
                    onChange={e=>setMasterCfg({...masterCfg,clave:e.target.value})}/>
                  <button style={S.sm(C.sc)} onClick={async()=>{try{await window.storage.set('bh10-mastercfg',JSON.stringify(masterCfg));(()=>{try{localStorage.setItem('bh10-master-url',String(masterCfg.url||'').trim());}catch(e){}})(),setPruebaWorker({c:C.sc,t:'✓ Guardado (vale para todas las empresas del grupo). Ahora pulsa «Probar conexión».'});}catch(e){setPruebaWorker({c:C.dn,t:'No se pudo guardar en la nube'});}}}>Guardar</button>
                </div>
                <button style={{...S.sm(C.in),width:'100%',marginTop:6}} onClick={async()=>{
                  const base=String(masterCfg.url||'').trim().replace(/\/$/,'');
                  if(!base){setPruebaWorker({c:C.dn,t:'✗ Escribe la dirección del Worker en la casilla de arriba (ahora está vacía).'});return;}
                  setPruebaWorker({c:C.mt,t:'Probando…'});
                  // v369 · el Worker nuevo se identifica con la SESIÓN de Firebase, no con la clave
                  // compartida: primero /ip (¿existe el Worker ahí?) y después /quienSoy con el token.
                  let ipOk=false;
                  try{const r=await fetch(base+'/ip');const d=await r.json();ipOk=!!(d&&('ip' in d));}catch(e){}
                  if(!ipOk){setPruebaWorker({c:C.dn,t:'✗ SIN RESPUESTA en esa dirección: revisa que sea la del Worker (workers.dev o bh10group.com/master, sin /ip ni barra final).'});return;}
                  try{
                    const cab={'Content-Type':'application/json',...(await cabToken())};
                    if(masterCfg.clave)cab['X-Bh10-Clave']=masterCfg.clave;
                    const r=await fetch(base+'/quienSoy',{method:'POST',headers:cab,body:'{}'});
                    const d=await r.json();
                    // v376 · el mensaje de la v369 decía «TODO BIEN» aunque la cuenta no
                    // fuese dueño ni miembro activo, y con eso el lector de facturas da 403.
                    // Fallo mío: costó una mañana entera. Ahora se distingue, y se enseña el
                    // UID para pegarlo en DUENO_UID sin buscarlo en Firebase.
                    if(d&&d.email&&(d.dueno||d.activo))
                      setPruebaWorker({c:C.sc,t:`✓ TODO BIEN: el Worker reconoce tu sesión (${d.email}${d.dueno?' · dueño':' · miembro activo'}). Usuarios y lector, en marcha.`});
                    else if(d&&d.email)
                      setPruebaWorker({c:C.dn,uid:d.uid,t:`⚠ El Worker reconoce tu sesión (${d.email}) pero esta cuenta NO es el dueño ni un miembro activo: el lector de facturas y nóminas dará error 403. Si ésta es tu cuenta de siempre, copia el UID de abajo y pégalo en el secreto DUENO_UID del Worker.`});
                    else if(d&&d.viaClave)setPruebaWorker({c:C.wn,t:'⚠ Tu sesión NO llega, pero la clave antigua vale (transición). Cierra sesión, vuelve a entrar y prueba otra vez; cuando salga TODO BIEN, borra el secreto CLAVE del Worker y vacía la casilla clave.'});
                    else if(d&&d.error==='ruta desconocida')setPruebaWorker({c:C.sc,t:'✓ Tu sesión llega y el Worker la acepta, pero es una versión anterior (sin /quienSoy): pega worker_master_v369.js cuando puedas.'});
                    else if(d&&d.error==='sin sesión válida')setPruebaWorker({c:C.dn,t:'✗ La dirección responde pero tu SESIÓN no llega: cierra sesión en la app, vuelve a entrar y prueba de nuevo (y comprueba que estás en la última versión).'});
                    else setPruebaWorker({c:C.dn,t:'✗ El Worker responde raro: '+JSON.stringify(d).slice(0,80)});
                  }catch(e){setPruebaWorker({c:C.dn,t:'✗ La dirección existe pero /quienSoy no contesta: '+String(e&&e.message||e).slice(0,60)});}
                }}>🔌 Probar conexión</button>
                {pruebaWorker&&<div style={{fontSize:10.5,fontWeight:700,color:pruebaWorker.c,marginTop:6,lineHeight:1.45}}>{pruebaWorker.t}</div>}
                {pruebaWorker&&pruebaWorker.uid&&(
                  <div style={{display:'flex',gap:6,alignItems:'center',marginTop:6}}>
                    <input readOnly value={pruebaWorker.uid} onFocus={e=>{e.target.select();e.target.setSelectionRange(0,99999);}}
                      style={{...S.inp,flex:1,fontFamily:'ui-monospace,monospace',fontSize:11}}/>
                    <button style={S.sm(C.in)} onClick={()=>copiar(pruebaWorker.uid)}>📋 Copiar UID</button>
                  </div>
                )}
              </div>
              <div style={{fontSize:10.5,color:C.mt,lineHeight:1.5,marginBottom:8}}>
                Define quién y qué puede: <b>nada</b>, <b>lectura</b> o <b>admin</b> por área.
                Quedan guardados en tu nube como «pendientes de activar»: el acceso con su
                propia contraseña se conecta en la obra del envoltorio.
              </div>
              <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
                <input style={{...S.inp,flex:'2 1 150px'}} placeholder="correo@ejemplo.com" value={nuevoUsr.email}
                  onChange={e=>setNuevoUsr({...nuevoUsr,email:e.target.value})}/>
                <input style={{...S.inp,flex:'1 1 100px'}} placeholder="Nombre" value={nuevoUsr.nombre}
                  onChange={e=>setNuevoUsr({...nuevoUsr,nombre:e.target.value})}/>
                <button style={S.btn(C.sc)} onClick={()=>{
                  const em=String(nuevoUsr.email||'').trim().toLowerCase();
                  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){notify('Correo no válido','error');return;}
                  if(usuariosApp.some(u=>u.email===em)){notify('Ese correo ya está dado de alta','error');return;}
                  const permisos={};AREAS_PERMISO.forEach(([k])=>permisos[k]='lectura');
                  guardaUsuarios([...usuariosApp,{id:uid(),email:em,nombre:nuevoUsr.nombre||'',permisos,estado:'pendiente',creado:today}]);
                  setNuevoUsr({email:'',nombre:''});
                  notify('👥 Usuario guardado (pendiente de activar)');
                }}>➕ Alta</button>
              </div>
              {usuariosApp.length===0&&<div style={{color:C.mt,fontSize:11,marginBottom:8}}>Sin usuarios dados de alta todavía.</div>}
              {usuariosApp.map(u=>(
                <div key={u.id} style={{border:`1px solid ${C.bd}55`,borderRadius:9,padding:'8px 10px',marginBottom:8}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:800,fontSize:12}}>{u.nombre||u.email}</div>
                      <div style={{fontSize:10,color:C.mt}}>{u.email} · {u.estado==='pendiente'?'⏳ pendiente de activar':(u.estado==='suspendido'?'⛔ suspendido':'✓ activo')} · alta {u.creado}</div>
                    </div>
                    {u.estado==='pendiente'&&<button style={S.sm(C.sc)} onClick={async()=>{
                      if(!masterCfg.url||!masterCfg.clave){notify('Configura antes el Worker Master (arriba)','error');return;}
                      try{
                        const r=await fetch(String(masterCfg.url).replace(/\/$/,'')+'/crearUsuario',{method:'POST',
                          headers:{'Content-Type':'application/json','X-Bh10-Clave':masterCfg.clave,...(await cabToken())},
                          body:JSON.stringify({email:u.email,nombre:u.nombre})});
                        const d=await r.json();
                        if(d&&d.uid){
                          guardaUsuarios(usuariosApp.map(x=>x.id===u.id?{...x,estado:'activo',authUid:d.uid}:x));
                          try{await window.bh10Miembros.poner(d.uid,{email:u.email,nombre:u.nombre,permisos:u.permisos,estado:'activo'});}
                          catch(e2){notify('⚠ Cuenta creada, pero no se pudo apuntar la membresía en la nube: cambia cualquier permiso suyo para reintentarlo','error');}
                          window.prompt('🔑 Cuenta creada para '+u.email+'.\nContraseña temporal (cópiala y dásela en mano):',d.passTemporal||'');
                          notify('✓ Cuenta activada');
                        }else{
                          const er=String(d&&d.error||'');
                          notify(/EMAIL_EXISTS/.test(er)?'Ese correo YA tiene cuenta en Firebase (si es la tuya, no hay que activarla)':'No se pudo crear: '+er,'error');
                        }
                      }catch(e){notify('Sin respuesta del Worker','error');}
                    }}>🔑 Activar</button>}
                    {u.estado==='activo'&&<button style={S.sm(C.dn)} title="Suspender el acceso" onClick={async()=>{
                      if(!window.confirm('¿Suspender el acceso de '+(u.nombre||u.email)+'?'))return;
                      try{
                        const r=await fetch(String(masterCfg.url).replace(/\/$/,'')+'/estadoUsuario',{method:'POST',
                          headers:{'Content-Type':'application/json','X-Bh10-Clave':masterCfg.clave,...(await cabToken())},
                          body:JSON.stringify({uid:u.authUid,deshabilitar:true})});
                        const d=await r.json();
                        if(d&&d.uid){guardaUsuarios(usuariosApp.map(x=>x.id===u.id?{...x,estado:'suspendido'}:x));
                          if(u.authUid&&window.bh10Miembros)window.bh10Miembros.poner(u.authUid,{email:u.email,nombre:u.nombre,permisos:u.permisos,estado:'suspendido'}).catch(()=>{});
                          notify('⛔ Acceso suspendido');}
                        else notify('No se pudo: '+String(d&&d.error||''),'error');
                      }catch(e){notify('Sin respuesta del Worker','error');}
                    }}>⛔</button>}
                    <button style={S.sm(C.dn)} onClick={()=>{
                      if(!window.confirm('¿Quitar a '+(u.nombre||u.email)+'? Su cuenta quedará deshabilitada: no podrá volver a entrar.'))return;
                      // v374 · Jesús: «he dado de alta un usuario de prueba y no podemos
                      // borrarlo». Deshabilitar deja la cuenta viva y el correo pillado.
                      // Se pregunta aparte si además hay que BORRARLA de Firebase.
                      const borrarDelTodo=window.confirm('¿Borrar además su cuenta de acceso?\n\nSÍ · desaparece de Firebase y el correo '+(u.email||'')+' queda libre para volver a usarlo. No tiene vuelta atrás.\nNO · la cuenta se queda deshabilitada (podrás reactivarla).');
                      // v366 · quitar = deshabilitar la cuenta en Firebase (como Suspender) + borrar la ficha + sacarlo de la lista.
                      // Sin cuenta no hay sesión posible; su ficha borrada dispara el interruptor remoto en sus aparatos.
                      (async()=>{
                        let deshabilitado=false;
                        if(u.authUid&&masterCfg&&masterCfg.url){try{
                          const r=await fetch(String(masterCfg.url).replace(/\/$/,'')+'/estadoUsuario',{method:'POST',headers:{'Content-Type':'application/json','X-Bh10-Clave':masterCfg.clave,...(await cabToken())},body:JSON.stringify({uid:u.authUid,deshabilitar:true})});
                          const d=await r.json();deshabilitado=!!(d&&d.uid);
                        }catch(e){}}
                        if(u.authUid&&!deshabilitado){notify('⚠️ No se pudo deshabilitar su cuenta en Firebase (Worker no disponible). Se le quita el acceso a los datos, pero la cuenta sigue viva: inténtalo de nuevo o usa Suspender.','error');}
                        let borrada=false;
                        if(borrarDelTodo&&u.authUid&&masterCfg&&masterCfg.url){
                          try{
                            const cab={'Content-Type':'application/json',...(await cabToken())};
                            if(masterCfg.clave)cab['X-Bh10-Clave']=masterCfg.clave;
                            const r=await fetch(String(masterCfg.url).replace(/\/$/,'')+'/borrarUsuario',{method:'POST',headers:cab,body:JSON.stringify({uid:u.authUid})});
                            const d=await r.json();
                            if(d&&d.borrado)borrada=true;
                            else notify('No se pudo borrar la cuenta: '+String((d&&d.error)||'')+' — queda deshabilitada','error');
                          }catch(e){notify('El Worker no respondió al borrado: la cuenta queda deshabilitada','error');}
                        }
                        if(u.authUid&&window.bh10Miembros)await window.bh10Miembros.quitar(u.authUid).catch(()=>{});
                        guardaUsuarios(usuariosApp.filter(x=>x.id!==u.id));
                        notify(borrada?`🗑 ${u.nombre||u.email} borrado del todo — el correo queda libre`:(deshabilitado?'🗑 Usuario quitado y cuenta deshabilitada':'🗑 Usuario quitado'));
                      })();
                    }}>🗑</button>
                  </div>
                  {AREAS_PERMISO.map(([k,lbl])=>(
                    <div key={k} style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                      <span style={{fontSize:10.5,flex:'0 0 108px'}}>{lbl}</span>
                      {['','lectura','admin'].map(p=>(
                        <button key={p||'nada'} style={{...S.sm((u.permisos&&u.permisos[k])===p?C.in:C.mt),padding:'3px 8px',minHeight:0,opacity:(u.permisos&&u.permisos[k])===p?1:.55}}
                          onClick={()=>{
                            const lista=usuariosApp.map(x=>x.id===u.id?{...x,permisos:{...x.permisos,[k]:p}}:x);
                            guardaUsuarios(lista);
                            const nu=lista.find(x=>x.id===u.id);
                            if(nu&&nu.authUid&&window.bh10Miembros)window.bh10Miembros.poner(nu.authUid,{email:nu.email,nombre:nu.nombre,permisos:nu.permisos,estado:nu.estado==='suspendido'?'suspendido':'activo'}).catch(()=>notify('⚠ No se pudo sincronizar el permiso en la nube (se reintenta al volver a tocarlo)','error'));
                          }}>{p===''?'nada':p}</button>
                      ))}
                    </div>
                  ))}
                  {/* v365 · subáreas: cada pantalla con su nivel; «heredar» toma el del área */}
                  <details style={{margin:'6px 0'}}><summary style={{fontSize:10,color:C.mt,cursor:'pointer'}}>Afinar por pantalla ({SUBAREAS.filter(([k])=>u.permisos&&u.permisos.sub&&u.permisos.sub[k]!=null).length} afinadas)</summary>
                    {SUBAREAS.map(([k,lbl,area])=>{const propio=u.permisos&&u.permisos.sub&&u.permisos.sub[k]!=null?u.permisos.sub[k]:null;const heredado=(u.permisos&&u.permisos[area])||'';return (
                      <div key={k} style={{display:'flex',alignItems:'center',gap:4,marginBottom:3}}>
                        <span style={{fontSize:10,flex:'0 0 150px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{lbl}</span>
                        {[[null,'hereda ('+(heredado||'nada')+')'],['','nada'],['lectura','lectura'],['admin','admin']].map(([p,l])=>(
                          <button key={String(p)} style={{...S.sm(propio===p?C.in:C.mt),padding:'2px 6px',minHeight:0,fontSize:9.5,opacity:propio===p?1:.55}} onClick={()=>{
                            const lista=usuariosApp.map(x=>{if(x.id!==u.id)return x;const sub={...(x.permisos&&x.permisos.sub||{})};if(p===null)delete sub[k];else sub[k]=p;return {...x,permisos:{...x.permisos,sub}};});
                            guardaUsuarios(lista);
                            const nu=lista.find(x=>x.id===u.id);
                            if(nu&&nu.authUid&&window.bh10Miembros)window.bh10Miembros.poner(nu.authUid,{email:nu.email,nombre:nu.nombre,permisos:nu.permisos,estado:nu.estado==='suspendido'?'suspendido':'activo'}).catch(()=>notify('⚠️ No se pudo sincronizar el miembro','error'));
                          }}>{l}</button>
                        ))}
                      </div>);})}
                  </details>
                  {/* v364 · acciones que se pueden dar o quitar aparte del área */}
                  <div style={{fontSize:10,color:C.mt,margin:'6px 0 3px'}}>Acciones (solo cuentan donde tiene admin):</div>
                  {ACCIONES.map(([ac,lbl,area])=>{const tiene=(u.permisos&&u.permisos[area])==='admin';const on=tiene&&!(u.permisos&&u.permisos.acciones&&u.permisos.acciones[ac]===false);return (
                    <label key={ac} style={{display:'flex',alignItems:'center',gap:6,fontSize:10.5,opacity:tiene?1:.45,marginBottom:2,cursor:tiene?'pointer':'default'}}>
                      <input type="checkbox" checked={on} disabled={!tiene} onChange={e=>{
                        const lista=usuariosApp.map(x=>x.id===u.id?{...x,permisos:{...x.permisos,acciones:{...(x.permisos&&x.permisos.acciones||{}),[ac]:e.target.checked}}}:x);
                        guardaUsuarios(lista);
                        const nu=lista.find(x=>x.id===u.id);
                        if(nu&&nu.authUid&&window.bh10Miembros)window.bh10Miembros.poner(nu.authUid,{email:nu.email,nombre:nu.nombre,permisos:nu.permisos,estado:nu.estado==='suspendido'?'suspendido':'activo'}).catch(()=>notify('⚠️ No se pudo sincronizar el miembro','error'));
                      }}/>
                      <span>{lbl}{!tiene?' (necesita admin en '+area+')':''}</span>
                    </label>);})}
                </div>
              ))}
            </>}

            {masterTab==='sesiones'&&<>
              <div style={{fontSize:10.5,color:C.mt,lineHeight:1.5,marginBottom:8}}>
                Cada aparato que abre la app queda registrado. <b>Cerrar</b> la revoca:
                ese aparato queda bloqueado en cuanto vuelva a latir (máx. 4 minutos).
                La IP llegará con el Worker de Cloudflare.
              </div>
              {[...sesionesApp].reverse().map(s=>(
                <div key={s.id} style={{border:`1px solid ${C.bd}55`,borderRadius:9,padding:'7px 10px',marginBottom:6,display:'flex',alignItems:'center',gap:8}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:800,fontSize:11.5}}>
                      {s.disp||'—'} {s.id===SESION_ID&&<span style={{color:C.sc}}>· esta sesión</span>}
                      {s.revocada&&<span style={{color:C.dn}}> · REVOCADA</span>}
                    </div>
                    <div style={{fontSize:9.5,color:C.mt}}>inicio {fF(s.inicio)} · última actividad {fF(s.ultimo)} · IP {s.ip||'—'}</div>
                  </div>
                  {!s.revocada&&s.id!==SESION_ID&&
                    <button style={S.sm(C.dn)} onClick={()=>{
                      guardaSesiones(sesionesApp.map(x=>x.id===s.id?{...x,revocada:true}:x));
                      notify('🖥️ Sesión revocada: se bloqueará en su próximo latido');
                    }}>Cerrar</button>}
                </div>
              ))}
              {sesionesApp.length>1&&<button style={{...S.sm(C.dn),width:'100%',marginTop:4}} onClick={()=>{
                if(!window.confirm('¿Cerrar TODAS las demás sesiones?'))return;
                guardaSesiones(sesionesApp.map(x=>x.id===SESION_ID?x:{...x,revocada:true}));
                notify('🖥️ Todas las demás sesiones revocadas');
              }}>Cerrar todas menos esta</button>}
            </>}
            <button style={{...S.btn(C.sc),width:'100%',marginTop:8}} onClick={()=>setVerMaster(false)}>✔ Hecho</button>
          </div>
        </div>);
      })()}
      {<ModalSesionCerrada {...{sesionRevocada}}/>}
      {<ModalRecurrentesExtracto {...{setVerRecu,verRecu}}/>}
      {<ModalCompradores {...{borraCfg,lineasAPdf,notify,promoBusy,promoCfg,setEditCfg,setVerPromo,setVerResumen,shareOrDownload,verPromo,verificaCfg}}/>}
      {<ModalErratasComprador {...{editCfg,guardaPromoCfg,notify,promoCfg,setEditCfg}}/>}
      {<ModalAprenderExtracto {...{cargarExtractoPegado,pegaExtracto,setPegaExtracto,setTxtExtracto,txtExtracto}}/>}
      {<ModalEnvioSinResumen {...{lineasAPdf,notify,setVerResumen,shareOrDownload,verResumen}}/>}
      {<ModalConectarGmail {...{gmailIdTmp,notify,pideGmailId,setGmailIdTmp,setPideGmailId}}/>}
      {<ModalCorreosGmail {...{aplicarCorreosProv,propCorreos,setPropCorreos}}/>}
      {<ModalEmbargosSueldo {...{empForm,setEmpForm,setVerEmbargoEmp,verEmbargoEmp}}/>}

      {showForm&&<ModalFormFactura {...{CATS,Combobox,ES_APP,FORMAS,IRPFS,IVAS,IVA_LABELS,TIPOS,advanceBatch,batchFiles,batchReviewIdx,batchTipo,cancelBatch,contratos,convertirProforma,desgloseForm,dirCompletaCliente,editing,fichaCliente,form,getSupplierData,invoices,invoicesAll,lotePagadas,notify,obrasAll,openObraModal,provCat,proveedores,restaurarFactura,saveInvoice,scanInvoice,scanning,setForm,setShowForm,subirAdjuntos,updateForm}}/>}

      {/* Contract Form Modal */}
      {<ModalCertificar {...{Combobox,IVAS,calcContratoTotal,cliCat,clientes,contratoForm,dirCompletaCliente,editingContrato,fichaCliente,obrasAll,saveContrato,setContratoForm,setShowContratoForm,showContratoForm}}/>}

      {/* Certification Modal */}
      {showCertModal&&(()=>{
        const c=contratos.find(x=>x.id===showCertModal);if(!c)return null;
        const t=calcContratoTotal(c.items,c.sujetoPasivo);
        const yaCert=getTotalCertificado(c.id);
        const pctYa=t.total>0?Math.round(yaCert/t.total*100):0;
        const certNum=getCertificaciones(c.id).length+1;
        const pctAcum=parseNum(certPct)||0;
        const pctNuevo=Math.max(pctAcum-pctYa,0);
        const modoF=(c.modo||'simple')==='fases';
        const pctDeriv=modoF?pctLineasCert(c.items,getCertificaciones(c.id)):null;
        const itemsCert=modoF?(c.items||[]).map((it,ix)=>({...it,pct:pctDeriv[ix]})):c.items;
        const fasesCalc=modoF?lineasCertificacion(itemsCert,certLin):null;
        const baseNueva=modoF?fasesCalc.base:+((t.base*pctNuevo)/100).toFixed(2);
        const tipoIvaC=c.sujetoPasivo?0:(c.items[0]?.iva||21);
        const tc=calcTotals(baseNueva,tipoIvaC,0);
        const retPC=parseNum(c.retGarantia)||0;
        const retIC=+(baseNueva*retPC/100).toFixed(2);
        const liqC=+(tc.total-retIC).toFixed(2);
        return (
          <div style={S.overlay}>
            <div style={{...S.modal,maxWidth:380}} onClick={e=>e.stopPropagation()}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>📋 Certificación nº{certNum}</div>
              <div style={{fontSize:11,color:C.mt,marginBottom:8}}>{c.numero} · {c.cliente} · Total: {fmt(t.total)} € {modoF&&<span style={{color:C.in,fontWeight:700}}>· 🏗️ por fases</span>}</div>
              <label style={{display:'block',marginBottom:8}}><span style={{fontSize:10,color:C.mt}}>Nº de factura</span><input style={{...S.input,fontFamily:'monospace'}} value={certNumF} onChange={e=>setCertNumF(e.target.value)} placeholder={sugerirNumF()}/></label>
              <div style={{background:C.bg,borderRadius:8,padding:8,marginBottom:10}}>
                <div style={{fontSize:11,display:'flex',justifyContent:'space-between'}}><span style={{color:C.mt}}>Ya certificado:</span><span style={{fontWeight:600,color:C.wn}}>{pctYa}% ({fmt(yaCert)} €)</span></div>
                <div style={{fontSize:11,display:'flex',justifyContent:'space-between'}}><span style={{color:C.mt}}>Pendiente:</span><span style={{fontWeight:600}}>{100-pctYa}% ({fmt(t.total-yaCert)} €)</span></div>
              </div>
              {modoF?(
                <div style={{marginBottom:8}}>
                  <div style={{fontSize:10,color:C.sc,fontWeight:600,marginBottom:4}}>Avance por línea (% acumulado)</div>
                  {itemsCert.map((it,ix)=>{
                    const lb=(+it.qty||0)*(+it.precio||0);if(lb<=0)return null;
                    const prev=+it.pct||0;
                    return (
                      <div key={ix} style={{display:'grid',gridTemplateColumns:'1fr 70px',gap:6,alignItems:'center',marginBottom:4}}>
                        <div style={{fontSize:11,minWidth:0}}><div style={{fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{it.desc||'—'}</div><div style={{fontSize:9,color:C.mt}}>{fmt(lb)} € · ya {prev}%</div></div>
                        <input type="text" inputMode="decimal" style={{...S.input,fontSize:16,textAlign:'center',fontWeight:700}} value={certLin[ix]??''} onChange={e=>setCertLin(p=>({...p,[ix]:e.target.value}))} placeholder={String(prev)}/>
                      </div>
                    );
                  })}
                  <div style={{fontSize:9,color:C.mt}}>Deja una línea vacía para no moverla. El % es acumulado, no el incremento.</div>
                </div>
              ):(
              <label style={{display:'block',marginBottom:8}}>
                <span style={{fontSize:10,color:C.sc,fontWeight:600}}>Avance acumulado total (%)</span>
                <input type="text" inputMode="decimal" style={{...S.input,fontWeight:700}} value={certPct} onChange={e=>setCertPct(e.target.value)} placeholder={`Ej: ${Math.min(pctYa+20,100)}%`}/>
                <div style={{fontSize:9,color:C.mt,marginTop:2}}>Indica hasta qué % de obra quieres certificar (no el incremento)</div>
              </label>
              )}
              {baseNueva>0&&(
                <div style={{background:C.sc+'11',border:`1px solid ${C.sc}44`,borderRadius:8,padding:10,marginBottom:8}}>
                  {modoF&&(fasesCalc.lineas||[]).map(l=>(
                    <div key={l.ix} style={{display:'flex',justifyContent:'space-between',fontSize:10,color:C.mt}}><span style={{minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.d} · {l.prev}%→{l.nuevo}%</span><span style={{fontWeight:600,color:C.tx}}>{fmt(l.imp)} €</span></div>
                  ))}
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginTop:modoF?6:0}}><span style={{color:C.mt}}>Base imponible</span><b>{fmt(baseNueva)} €</b></div>
                  {c.sujetoPasivo?<div style={{fontSize:9,color:C.wn}}>Inversión del sujeto pasivo — sin IVA</div>:<div style={{display:'flex',justifyContent:'space-between',fontSize:11}}><span style={{color:C.mt}}>IVA {tipoIvaC}%</span><b>{fmt(tc.iva)} €</b></div>}
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginTop:2}}><span>TOTAL FACTURA</span><b>{fmt(tc.total)} €</b></div>
                  {retIC>0&&(<>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:C.wn}}><span>Retención garantía {retPC}%</span><b>−{fmt(retIC)} €</b></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:13,fontWeight:800,color:C.sc,marginTop:2}}><span>LÍQUIDO A PERCIBIR</span><span>{fmt(liqC)} €</span></div>
                  </>)}
                </div>
              )}
              <label style={{display:'block',marginBottom:8}}><span style={{fontSize:10,color:C.mt}}>Descripción</span><input style={S.input} value={certDesc} onChange={e=>setCertDesc(e.target.value)} placeholder={`Certificación ${certNum} — fase...`}/></label>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <button style={S.ghost} onClick={()=>setShowCertModal(null)}>Cancelar</button>
                <button style={{...S.btn(C.sc),opacity:baseNueva>0?1:0.4}} onClick={()=>generarCertificacion(c)} disabled={baseNueva<=0}>Generar factura</button>
              </div>
            </div>
          </div>
        );
      })()}
      {vincModal&&(()=>{
        const inv=invoices.find(x=>x.id===vincModal);
        if(!inv)return null;
        const mismos=(contratos||[]).filter(c=>c&&normTxtDup(c.cliente)===normTxtDup(inv.proveedor));
        const otros=(contratos||[]).filter(c=>c&&normTxtDup(c.cliente)!==normTxtDup(inv.proveedor));
        const fila=(c)=>(
          <button key={c.id} style={{...S.card,width:'100%',textAlign:'left',cursor:'pointer',marginBottom:6,padding:'8px 10px',border:`1px solid ${inv.contratoId===c.id?C.sc:C.bd}`}} onClick={()=>vincularFactura(inv.id,c.id)}>
            <div style={{fontWeight:700,fontSize:12}}>{c.numero} {inv.contratoId===c.id?<span style={{color:C.sc,fontSize:10}}>✓ actual</span>:null}</div>
            <div style={{fontSize:10,color:C.mt}}>{c.cliente}{c.obra?` · ${c.obra}`:''} · {fmt(c.total||0)} €</div>
          </button>
        );
        return (
          <div style={S.overlay}>
            <div style={{...S.modal,maxWidth:470}} onClick={e=>e.stopPropagation()}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>📐 Vincular a contrato</div>
              <div style={{fontSize:11,color:C.mt,marginBottom:10}}>{inv.numFactura||'s/n'} · {inv.proveedor} · {fmt(inv.total)} €</div>
              <button style={{...S.btn(C.sc),marginBottom:10}} onClick={()=>contratoDesdeFactura(inv)}>➕ Crear contrato desde esta factura</button>
              <div style={{maxHeight:300,overflowY:'auto'}}>
                {mismos.length>0&&<div style={{fontSize:10,fontWeight:700,color:C.sc,margin:'4px 0'}}>DEL MISMO CLIENTE</div>}
                {mismos.map(fila)}
                {otros.length>0&&<div style={{fontSize:10,fontWeight:700,color:C.mt,margin:'8px 0 4px'}}>OTROS CONTRATOS</div>}
                {otros.map(fila)}
                {(contratos||[]).length===0&&<div style={{fontSize:11,color:C.mt,textAlign:'center',padding:10}}>Aún no hay contratos en esta empresa.</div>}
              </div>
              <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
                {inv.contratoId&&<button style={S.sm(C.dn)} onClick={()=>vincularFactura(inv.id,null)}>Desvincular</button>}
                <button style={S.ghost} onClick={()=>setVincModal(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        );
      })()}
      {ayudaVer&&(()=>{
        const q=(ayudaVer.q||'').trim().toLowerCase();
        const norm=(s)=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        const casa=(tema)=>{
          if(!q)return true;
          const nq=norm(q);
          return norm(tema.t).includes(nq)||(tema.p||[]).some(x=>norm(x).includes(nq))||norm(tema.n||'').includes(nq);
        };
        const resultados=q?AYUDA.flatMap(m=>m.temas.filter(casa).map(t=>({...t,mod:m}))):[];
        const modActivo=ayudaVer.mod?AYUDA.find(m=>m.id===ayudaVer.mod):null;
        const Tema=({tema,mod})=>(
          <div style={{marginBottom:14,paddingBottom:12,borderBottom:`1px solid ${C.bd}`}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:6,color:C.tx}}>{mod?<span style={{color:C.mt,fontWeight:500}}>{mod.ic} {mod.t} · </span>:null}{tema.t}</div>
            {(tema.p||[]).map((paso,ix)=>(
              <div key={ix} style={{display:'flex',gap:8,marginBottom:5,alignItems:'flex-start'}}>
                <span style={{flexShrink:0,width:18,height:18,borderRadius:9,background:C.in+'22',color:C.in,fontSize:10,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',marginTop:1}}>{ix+1}</span>
                <span style={{fontSize:12,lineHeight:1.5,color:C.tx}}>{paso}</span>
              </div>
            ))}
            {tema.n&&<div style={{marginTop:7,padding:'7px 9px',background:C.sc+'12',borderLeft:`3px solid ${C.sc}`,borderRadius:4,fontSize:11,color:C.mt,lineHeight:1.5}}>💡 {tema.n}</div>}
          </div>
        );
        return (
          <div style={{position:'absolute',inset:0,zIndex:95,background:'rgba(0,0,0,.55)',display:'flex',justifyContent:'center'}}>
          <div style={{width:'100%',maxWidth:1100,background:C.bg,display:'flex',flexDirection:'column',borderLeft:`1px solid ${C.bd}55`,borderRight:`1px solid ${C.bd}55`}}>
            <div style={{flexShrink:0,padding:'calc(14px + env(safe-area-inset-top,0px)) 14px 10px',borderBottom:`1px solid ${C.bd}`,background:C.sf}}>
              <div style={{...S.cabModal,display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                {(modActivo||q)&&<button style={{background:'none',border:'none',color:C.in,fontSize:13,fontWeight:700,cursor:'pointer',padding:0}} onClick={()=>setAyudaVer({mod:null,q:''})}>← Índice</button>}
                <span style={{flex:1,fontWeight:800,fontSize:15}}>{modActivo?`${modActivo.ic} ${modActivo.t}`:'🛟 Manual de uso'}</span>
                <button style={{background:'none',border:'none',color:C.mt,fontSize:20,cursor:'pointer',padding:0,lineHeight:1}} onClick={()=>{setAyudaVer(null);reajustarPronto();}}>✕</button>
              </div>
              <input style={{...S.input,fontSize:16}} placeholder="Buscar: pagar, remesa, backup, certificar…" value={ayudaVer.q} onChange={e=>setAyudaVer(p=>({...p,q:e.target.value,mod:null}))}/>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:14,WebkitOverflowScrolling:'touch'}}>
              {q?(
                <>
                  <div style={{fontSize:11,color:C.mt,marginBottom:10}}>{resultados.length} resultado{resultados.length!==1?'s':''} para «{ayudaVer.q}»</div>
                  {resultados.map((t,ix)=><Tema key={ix} tema={t} mod={t.mod}/>)}
                  {!resultados.length&&<div style={{textAlign:'center',padding:30,color:C.mt,fontSize:12}}>Nada con esa palabra. Prueba con otra: factura, nómina, contrato, copia, proveedor…</div>}
                </>
              ):modActivo?(
                modActivo.temas.map((t,ix)=><Tema key={ix} tema={t}/>)
              ):(
                <>
                  <div style={{fontSize:12,color:C.mt,marginBottom:12,lineHeight:1.5}}>Elige un apartado o busca directamente lo que necesites hacer.</div>
                  {AYUDA.map(m=>(
                    <button key={m.id} style={{...S.card,width:'100%',textAlign:'left',cursor:'pointer',marginBottom:8,padding:'12px 14px',display:'flex',alignItems:'center',gap:12}} onClick={()=>setAyudaVer({mod:m.id,q:''})}>
                      <span style={{fontSize:22,flexShrink:0}}>{m.ic}</span>
                      <span style={{flex:1,minWidth:0}}>
                        <span style={{display:'block',fontWeight:700,fontSize:13}}>{m.t}</span>
                        <span style={{display:'block',fontSize:10,color:C.mt,marginTop:2}}>{m.temas.length} {m.temas.length===1?'apartado':'apartados'}</span>
                      </span>
                      <span style={{color:C.mt,fontSize:15,flexShrink:0}}>›</span>
                    </button>
                  ))}
                  <div style={{textAlign:'center',fontSize:10,color:C.mt,marginTop:14,paddingBottom:20}}>BH10 FacturaControl {APP_VERSION} · {AYUDA.reduce((s,m)=>s+m.temas.length,0)} apartados</div>
                </>
              )}
            </div>
          </div>
          </div>
        );
      })()}
      {masPago&&(()=>{
        const pend=invoices.filter(i=>i&&i.tipo!=='cobro'&&((i.total||0)-getTotalPagado(i,invoices))>0.01)
          .filter(i=>!masPago.hasta||String(i.fecha||'')<=masPago.hasta)
          .filter(i=>!masPago.prov||normTxtDup(i.proveedor).includes(normTxtDup(masPago.prov)))
          .sort((a,b)=>String(a.fecha||'').localeCompare(String(b.fecha||'')));
        const sel=masPago.sel||{};
        const marcados=pend.filter(i=>sel[i.id]);
        const total=marcados.reduce((s,i)=>s+((i.total||0)-getTotalPagado(i,invoices)),0);
        const todos=pend.length>0&&marcados.length===pend.length;
        return (
          <div style={S.overlay}>
            <div style={{...S.modal,maxWidth:520}} onClick={e=>e.stopPropagation()}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>✅ Marcar facturas como pagadas</div>
              <div style={{fontSize:11,color:C.mt,marginBottom:10}}>Filtra, marca las que correspondan y confirma. Se registra el pago del importe pendiente de cada una.</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                <label><span style={{fontSize:10,color:C.mt}}>Facturas hasta la fecha</span><input type="date" style={S.input} value={masPago.hasta} onChange={e=>setMasPago(p=>({...p,hasta:e.target.value,sel:{}}))}/></label>
                <label><span style={{fontSize:10,color:C.mt}}>Fecha del pago</span><input type="date" style={S.input} value={masPago.fecha} onChange={e=>setMasPago(p=>({...p,fecha:e.target.value}))}/></label>
              </div>
              <label style={{display:'block',marginBottom:8}}><span style={{fontSize:10,color:C.mt}}>Proveedor (opcional)</span><input style={S.input} placeholder="Filtrar por nombre" value={masPago.prov} onChange={e=>setMasPago(p=>({...p,prov:e.target.value,sel:{}}))}/></label>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <span style={{fontSize:11,color:C.mt}}><b style={{color:C.tx}}>{pend.length}</b> pendiente{pend.length!==1?'s':''}</span>
                <button style={S.sm(C.in)} onClick={()=>setMasPago(p=>({...p,sel:todos?{}:Object.fromEntries(pend.map(i=>[i.id,true]))}))}>{todos?'Desmarcar todas':'Marcar todas'}</button>
              </div>
              <div style={{maxHeight:250,overflowY:'auto',border:`1px solid ${C.bd}`,borderRadius:8,marginBottom:10}}>
                {pend.length===0&&<div style={{padding:14,fontSize:11,color:C.mt,textAlign:'center'}}>No hay facturas pendientes con esos filtros.</div>}
                {pend.map(i=>{
                  const p2=(i.total||0)-getTotalPagado(i,invoices);
                  return (
                    <div key={i.id} onClick={()=>setMasPago(p=>({...p,sel:{...p.sel,[i.id]:!p.sel[i.id]}}))} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 9px',borderBottom:`1px solid ${C.bd}`,cursor:'pointer',background:sel[i.id]?C.sc+'14':'transparent'}}>
                      <span style={{fontSize:14,width:18,flexShrink:0}}>{sel[i.id]?'✅':'⬜'}</span>
                      <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:11}}>
                        <b>{i.proveedor}</b><span style={{color:C.mt}}> · {i.numFactura||'s/n'} · {fmtDate(i.fecha)}</span>
                      </span>
                      <span style={{fontSize:11,fontWeight:700,flexShrink:0}}>{fmt(p2)} €</span>
                    </div>
                  );
                })}
              </div>
              <div style={{background:C.bg,borderRadius:8,padding:'8px 10px',fontSize:11,marginBottom:10}}>
                <span style={{color:C.mt}}>Seleccionadas: </span><b style={{color:marcados.length?C.sc:C.mt}}>{marcados.length}</b>
                <span style={{color:C.mt}}> · Importe total: </span><b>{fmt(total)} €</b>
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <BtnConfirm style={S.btn(C.sc)} armStyle={{opacity:.85}} armedLabel={`¿Marcar ${marcados.length} como pagadas? Toca otra vez`} onConfirm={()=>marcarPagadasEnBloque(marcados.map(i=>i.id),masPago.fecha)}>Marcar {marcados.length} como pagadas</BtnConfirm>
                <button style={S.ghost} onClick={()=>setMasPago(null)}>Cancelar</button>
              </div>
            </div>
          </div>
        );
      })()}
      {docVer&&(()=>{
        if(docVer.cargando)return (
          <div style={{position:'absolute',inset:0,zIndex:96,background:'rgba(0,0,0,.7)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{color:'#fff',fontSize:13}}>Abriendo documento…</div>
          </div>
        );
        const esImagen=/^image\//.test(docVer.mime||'');
        const z=docVer.zoom||1;
        const setZoom=(v)=>setDocVer(d=>({...d,zoom:Math.min(4,Math.max(0.5,+v.toFixed(2)))}));
        const btn=(txt,fn,activo)=>(
          <button onClick={fn} style={{flex:'1 1 auto',minWidth:44,padding:'11px 8px',border:'none',background:'transparent',color:activo===false?C.mt:'#E2E8F0',fontSize:16,fontWeight:700,cursor:'pointer'}}>{txt}</button>
        );
        return (
          <div style={{position:'absolute',inset:0,zIndex:96,background:'rgba(8,12,20,.96)',display:'flex',justifyContent:'center'}}>
            <div style={{width:'100%',maxWidth:1100,display:'flex',flexDirection:'column',height:'100%'}}>
              {/* Cabecera */}
              <div style={{flexShrink:0,display:'flex',alignItems:'center',gap:10,padding:'calc(12px + env(safe-area-inset-top,0px)) 14px 12px',borderBottom:'1px solid rgba(255,255,255,.12)'}}>
                <span style={{flex:1,minWidth:0,color:'#E2E8F0',fontSize:12,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{docVer.nombre}</span>
                <button onClick={cerrarDocumento} style={{background:'none',border:'none',color:'#94A3B8',fontSize:22,lineHeight:1,cursor:'pointer',padding:'0 4px'}}>✕</button>
              </div>
              {/* Documento */}
              <div style={{flex:1,overflow:'auto',WebkitOverflowScrolling:'touch',display:'flex',alignItems:esImagen?'center':'stretch',justifyContent:'center',padding:esImagen?10:0}}>
                {esImagen?(
                  <img src={docVer.url} alt={docVer.nombre} style={{maxWidth:'none',flexShrink:0,width:`${100*z}%`,height:'auto',transformOrigin:'top center',borderRadius:4}}/>
                ):(
                  <div style={{width:`${100*z}%`,flexShrink:0,height:`${100*z}%`,minHeight:400,transformOrigin:'top center'}}>
                    <iframe src={docVer.url} title={docVer.nombre} style={{width:'100%',height:'100%',border:'none',background:'#fff'}}/>
                  </div>
                )}
              </div>
              {/* Controles */}
              <div style={{flexShrink:0,display:'flex',alignItems:'center',borderTop:'1px solid rgba(255,255,255,.12)',background:'rgba(0,0,0,.4)',paddingBottom:'env(safe-area-inset-bottom)'}}>
                {btn('−',()=>setZoom(z-0.25),z>0.5)}
                <span style={{minWidth:56,textAlign:'center',color:'#94A3B8',fontSize:12,fontWeight:700}}>{Math.round(z*100)}%</span>
                {btn('+',()=>setZoom(z+0.25),z<4)}
                {btn('⤢',()=>setZoom(1))}
                {/* En el móvil, el visor incrustado no admite pellizcar para
                    ampliar. Abrirlo aparte usa el visor del sistema, que sí. */}
                {!esImagen&&btn('⛶ Aparte',()=>{try{window.open(docVer.url,'_blank','noopener');}catch(e){notify('No se pudo abrir aparte','error');}})}
                {btn('􀈂 Compartir'.replace('􀈂 ','📤 '),compartirDocumento)}
                {btn('Cerrar',cerrarDocumento)}
              </div>
            </div>
          </div>
        );
      })()}
      {archivador&&(()=>{
        const r=archivador.resultados||[];
        const listas=r.filter(x=>x.estado==='lista');
        const dudosas=r.filter(x=>x.estado==='dudosa');
        const sinPareja=r.filter(x=>x.estado==='sin-pareja');
        const yaTenian=r.filter(x=>x.estado==='ya-tenia');
        const ilegibles=r.filter(x=>x.estado==='ilegible');
        const [sel,setSel]=[archivador.sel||{},(s)=>setArchivador(a=>({...a,sel:s}))];
        const marcada=(x,ix)=>x.estado==='lista'?(sel['l'+ix]!==false):(sel['d'+ix]===true);
        const aArchivar=[...listas.filter((x,ix)=>sel['l'+ix]!==false),...dudosas.filter((x,ix)=>sel['d'+ix]===true)];
        const bloque=(titulo,items,color,clave,nota,conAlta)=>items.length===0?null:(
          <div style={{marginBottom:10}}>
            <div style={{fontSize:10,fontWeight:700,color,marginBottom:4}}>{titulo} ({items.length})</div>
            {nota&&<div style={{fontSize:9,color:C.mt,marginBottom:5}}>{nota}</div>}
            {items.map((x,ix)=>(
              <div key={ix} onClick={()=>{if(clave)setSel({...sel,[clave+ix]:clave==='l'?(sel['l'+ix]===false):(sel['d'+ix]!==true)});}}
                   style={{display:'flex',alignItems:'center',gap:7,padding:'5px 0',borderBottom:`1px solid ${C.bd}`,fontSize:11,cursor:clave?'pointer':'default'}}>
                {clave&&<span style={{fontSize:13,width:16,flexShrink:0}}>{marcada(x,ix)?'✅':'⬜'}</span>}
                <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  <b style={{fontSize:10}}>{String(x.file.name||'').slice(0,26)}</b>
                  <span style={{color:C.mt}}> → {x.nota}</span>
                </span>
                {conAlta&&x.leido&&<button style={{...S.sm(C.sc),padding:'3px 9px',fontSize:10,flexShrink:0}} onClick={(ev)=>{ev.stopPropagation();registrarDesdeArchivador(x);}}>➕ Registrar</button>}
              </div>
            ))}
          </div>
        );
        return (
          <div style={S.overlay}>
            <div style={{...S.modal,maxWidth:520}} onClick={e=>e.stopPropagation()}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>📎 Archivar documentos</div>
              {archivador.fase==='leyendo'&&(
                <div style={{padding:'20px 0',textAlign:'center'}}>
                  <div style={{fontSize:12,marginBottom:8}}>Leyendo documento {archivador.hechos+1} de {archivador.total}…</div>
                  <div style={{height:6,background:C.bd,borderRadius:3,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${Math.round((archivador.hechos/(archivador.total||1))*100)}%`,background:C.vt,transition:'width .3s'}}/>
                  </div>
                </div>
              )}
              {archivador.fase==='guardando'&&<div style={{padding:'20px 0',textAlign:'center',fontSize:12}}>Adjuntando documentos…</div>}
              {archivador.fase==='revisar'&&(<>
                <div style={{fontSize:11,color:C.mt,marginBottom:10}}>Solo se adjuntará el documento. Ningún otro dato de estas facturas se modifica.</div>
                {bloque('✅ LISTAS PARA ARCHIVAR',listas,C.sc,'l','Coinciden con seguridad y no tienen documento todavía.')}
                {bloque('⚠️ DUDOSAS — REVISA ANTES',dudosas,C.wn,'d','Se parecen pero no es seguro. Márcalas solo si reconoces la factura.')}
                {bloque('📄 YA TENÍAN DOCUMENTO',yaTenian,C.mt,null,'No se tocan, para no sustituir el papel que ya guardaste.')}
                {bloque('❓ SIN FACTURA REGISTRADA',sinPareja,C.wn,null,'No hay ninguna factura que corresponda. Puedes registrarla aquí mismo con los datos ya leídos, sin volver a escanear.',true)}
                {bloque('✕ NO SE PUDIERON LEER',ilegibles,C.dn,null,null)}
                <div style={{background:C.bg,borderRadius:8,padding:'8px 10px',fontSize:11,marginBottom:10}}>
                  Se archivarán <b style={{color:aArchivar.length?C.sc:C.mt}}>{aArchivar.length}</b> de {r.length} documentos.
                </div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <BtnConfirm style={S.btn(C.sc)} armStyle={{opacity:.85}} armedLabel={`¿Archivar ${aArchivar.length}? Toca otra vez`} onConfirm={()=>confirmarArchivado(aArchivar)}>Archivar {aArchivar.length} documentos</BtnConfirm>
                  <button style={S.ghost} onClick={()=>setArchivador(null)}>Cancelar</button>
                </div>
              </>)}
            </div>
          </div>
        );
      })()}
      {precioVer&&(()=>{
        const todos=evolucionPrecios(invoices,{minApariciones:1});
        const f=todos.find(x=>x.prov===precioVer.prov&&x.material===precioVer.material);
        if(!f)return null;
        // Mismo material en otros proveedores: la comparación que ahorra dinero
        const otros=todos.filter(x=>x.material===f.material&&x.prov!==f.prov).sort((a,b)=>a.medio-b.medio);
        const h=f.historia;
        const ps=h.map(x=>x.pu), mx=Math.max(...ps), mn=Math.min(...ps), rango=(mx-mn)||1;
        const ALTO=90;
        return (
          <div style={S.overlay}>
            <div style={{...S.modal,maxWidth:520}} onClick={e=>e.stopPropagation()}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>📈 {f.desc}</div>
              <div style={{fontSize:11,color:C.mt,marginBottom:10}}>{f.prov} · {f.veces} compra{f.veces!==1?'s':''} · {fmt(h.reduce((s,x)=>s+(x.imp||0),0))} € en total</div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:10}}>
                {[['Actual',fmt(f.actual)+' €',f.pct>0?C.dn:f.pct<0?C.sc:C.tx],
                  ['Medio',fmt(f.medio)+' €',C.tx],
                  ['Mínimo',fmt(f.min)+' €',C.sc],
                  ['Máximo',fmt(f.max)+' €',C.dn]].map(([l,v,col])=>(
                  <div key={l} style={{background:C.bg,borderRadius:8,padding:'7px 8px',textAlign:'center'}}>
                    <div style={{fontSize:9,color:C.mt}}>{l}</div>
                    <div style={{fontSize:12,fontWeight:700,color:col}}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Gráfica de evolución: una barra por compra */}
              <div style={{background:C.bg,borderRadius:8,padding:'10px 8px 6px',marginBottom:10}}>
                <div style={{display:'flex',alignItems:'flex-end',gap:3,height:ALTO,justifyContent:h.length<10?'flex-start':'space-between'}}>
                  {h.map((x,i)=>{
                    const alt=14+((x.pu-mn)/rango)*(ALTO-20);
                    const sube=i>0&&x.pu>h[i-1].pu, baja=i>0&&x.pu<h[i-1].pu;
                    return (
                      <div key={i} style={{flex:h.length<10?'0 0 26px':'1 1 auto',display:'flex',flexDirection:'column',alignItems:'center',gap:2,minWidth:12}}>
                        <span style={{fontSize:8,color:sube?C.dn:baja?C.sc:C.mt,fontWeight:700,whiteSpace:'nowrap'}}>{h.length<=8?fmt(x.pu):''}</span>
                        <div style={{width:'100%',maxWidth:22,height:alt,borderRadius:'3px 3px 0 0',background:sube?C.dn:baja?C.sc:C.in,opacity:i===h.length-1?1:0.75}}/>
                        <span style={{fontSize:7,color:C.mt,whiteSpace:'nowrap'}}>{String(x.fecha||'').slice(5).split('-').reverse().join('/')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {otros.length>0&&(
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.mt,marginBottom:5}}>MISMO MATERIAL EN OTROS PROVEEDORES</div>
                  {otros.map((o,i)=>{
                    const dif=f.medio>0?+(((o.medio-f.medio)/f.medio)*100).toFixed(1):0;
                    return (
                      <div key={i} onClick={()=>setPrecioVer({prov:o.prov,material:o.material})} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:`1px solid ${C.bd}`,cursor:'pointer',fontSize:11}}>
                        <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.prov}</span>
                        <span style={{fontWeight:700,flexShrink:0}}>{fmt(o.medio)} €</span>
                        <span style={{fontSize:10,fontWeight:700,flexShrink:0,color:dif<0?C.sc:dif>0?C.dn:C.mt,minWidth:52,textAlign:'right'}}>{dif<0?'▼ ':dif>0?'▲ +':''}{dif}%</span>
                      </div>
                    );
                  })}
                  {otros[0]&&otros[0].medio<f.medio&&(
                    <div style={{marginTop:6,padding:'7px 9px',background:C.sc+'14',borderLeft:`3px solid ${C.sc}`,borderRadius:4,fontSize:11,color:C.sc}}>
                      💡 <b>{otros[0].prov}</b> lo tiene {fmt(f.medio-otros[0].medio)} € más barato de media. Sobre lo comprado aquí serían <b>{fmt(h.reduce((s,x)=>s+Math.max(0,(x.pu-otros[0].medio))*(x.cant||1),0))} €</b> de diferencia.
                    </div>
                  )}
                </div>
              )}

              <div style={{fontSize:10,fontWeight:700,color:C.mt,marginBottom:5}}>HISTÓRICO DE COMPRAS</div>
              <div style={{maxHeight:170,overflowY:'auto',marginBottom:10}}>
                {[...h].reverse().map((x,i)=>(
                  <div key={i} style={{display:'grid',gridTemplateColumns:'62px 1fr auto auto',gap:6,alignItems:'center',padding:'5px 0',borderBottom:`1px solid ${C.bd}`,fontSize:11}}>
                    <span style={{color:C.mt,fontSize:10}}>{fmtDate(x.fecha)}</span>
                    <span style={{color:C.mt,fontSize:10,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{x.numFactura||'s/n'}</span>
                    <span style={{fontSize:10,color:C.mt,textAlign:'right'}}>{fmt(x.cant)} ×</span>
                    <span style={{fontWeight:700,textAlign:'right',minWidth:62}}>{fmt(x.pu)} €</span>
                  </div>
                ))}
              </div>
              <button style={S.ghost} onClick={()=>setPrecioVer(null)}>Cerrar</button>
            </div>
          </div>
        );
      })()}
      {pkPeriodo&&(()=>{
        const h2=new Date();
        const r=rangoPeriodo(pkPeriodo.clave,pkPeriodo.trim);
        const dIni=pkPeriodo.ini||r.ini, dFin=pkPeriodo.fin||r.fin;
        const opciones=[['mes','Este mes'],['mesant','Mes anterior'],['trim','Trimestre'],['anio','Este año'],['anioant','Año pasado']];
        const cuenta=invoices.filter(i=>i.tipo==='factura'&&String(i.fecha||'')>=dIni&&String(i.fecha||'')<=dFin).length;
        // ── chequeo previo (v353): lo mismo que irá al zip, mirado ANTES ──
        const recP=invoices.filter(i=>esGastoFiscal(i)&&String(i.fecha||'')>=dIni&&String(i.fecha||'')<=dFin);
        const sinAdj=recP.filter(i=>!i.adjPath);
        const rotos=recP.filter(i=>i.adjPath&&!esquemaEnlace(i.adjPath).ok);
        const pendNube=recP.filter(i=>i.adjPath&&esquemaEnlace(i.adjPath).ok&&i.adjNube===false);
        const faltan=faltanDocumento(recP,esquemaEnlace);
        const nube=pkCheq&&pkCheq.nube, gm=pkCheq&&pkCheq.gmail;
        const lineaInv=(i)=><span>{i.fecha} · <b>{i.proveedor||'(sin proveedor)'}</b> · nº {i.numFactura||'s/n'} · {fmt(i.total)} €</span>;
        return (
          <div style={S.overlay}>
            <div style={{...S.modal,maxWidth:430}} onClick={e=>e.stopPropagation()}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>📦 Paquete para la gestoría</div>
              <div style={{fontSize:11,color:C.mt,marginBottom:10}}>Elige el periodo: solo se incluirán las facturas de esas fechas.</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
                {opciones.map(([k,l])=>(
                  <button key={k} style={{padding:'7px 12px',borderRadius:16,border:`1px solid ${pkPeriodo.clave===k?C.in:C.bd}`,background:pkPeriodo.clave===k?C.in+'22':'transparent',color:pkPeriodo.clave===k?C.in:C.mt,fontSize:11,fontWeight:pkPeriodo.clave===k?700:500,cursor:'pointer'}} onClick={()=>setPkPeriodo({clave:k,trim:k==='trim'?Math.floor(h2.getMonth()/3):null})}>{l}</button>
                ))}
              </div>
              {pkPeriodo.clave==='trim'&&(
                <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
                  {[0,1,2,3].map(q=>(
                    <button key={q} style={{padding:'6px 14px',borderRadius:14,border:`1px solid ${pkPeriodo.trim===q?C.sc:C.bd}`,background:pkPeriodo.trim===q?C.sc+'22':'transparent',color:pkPeriodo.trim===q?C.sc:C.mt,fontSize:11,fontWeight:700,cursor:'pointer'}} onClick={()=>setPkPeriodo(p=>({...p,trim:q,ini:null,fin:null}))}>T{q+1}</button>
                  ))}
                </div>
              )}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                <label><span style={{fontSize:10,color:C.mt}}>Desde</span><input type="date" style={S.input} value={dIni} onChange={e=>setPkPeriodo(p=>({...p,clave:'libre',ini:e.target.value,fin:p.fin||r.fin}))}/></label>
                <label><span style={{fontSize:10,color:C.mt}}>Hasta</span><input type="date" style={S.input} value={dFin} onChange={e=>setPkPeriodo(p=>({...p,clave:'libre',fin:e.target.value,ini:p.ini||r.ini}))}/></label>
              </div>
              <div style={{background:C.bg,borderRadius:8,padding:'8px 10px',fontSize:11,marginBottom:10}}>
                <span style={{color:C.mt}}>Periodo: </span><b>{fmtDate(dIni)} → {fmtDate(dFin)}</b><br/>
                <span style={{color:C.mt}}>Facturas recibidas incluidas: </span><b style={{color:cuenta?C.sc:C.wn}}>{cuenta}</b>
              </div>
              {recP.length>0&&(
                <div style={{border:`1px solid ${faltan.length?C.wn+'66':C.sc+'44'}`,borderRadius:8,padding:'8px 10px',fontSize:11,marginBottom:10,background:faltan.length?C.wn+'0d':C.sc+'0d'}}>
                  <div style={{fontWeight:700,marginBottom:4}}>{faltan.length?`⚠️ ${faltan.length} sin documento de ${recP.length} — irán nombradas en el LÉEME si generas igual`:`✓ Las ${recP.length} facturas llevan documento`}</div>
                  <div style={{color:C.mt,marginBottom:6}}>
                    {recP.length-faltan.length} con documento
                    {sinAdj.length?` · ${sinAdj.length} sin adjuntar`:''}
                    {rotos.length?` · ${rotos.length} con enlace que la app no entiende`:''}
                    {pendNube.length?` · ${pendNube.length} sin confirmar en la nube`:''}
                    {nube&&!nube.en?` · nube comprobada: ${nube.vistos} leídas, ${nube.malos.length} con problema`:''}
                  </div>
                  {faltan.slice(0,12).map(i=>(
                    <div key={i.id} style={{borderTop:`1px solid ${C.bd}33`,padding:'4px 0'}}>
                      {lineaInv(i)}
                      <div style={{fontSize:10,color:C.wn}}>{!i.adjPath?'sin adjuntar':!esquemaEnlace(i.adjPath).ok?'enlace que la app no entiende':'no confirmado en la nube'}</div>
                    </div>
                  ))}
                  {faltan.length>12&&<div style={{fontSize:10,color:C.mt}}>… y {faltan.length-12} más (todas irán nombradas en el LÉEME)</div>}
                  <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:8}}>
                    <button style={S.sm(C.in)} disabled={!!(nube&&nube.en)} onClick={()=>comprobarNubePeriodo(recP)}>{nube&&nube.en?`☁️ ${nube.vistos}/${nube.total}…`:'☁️ Comprobar en la nube'}</button>
                    {faltan.length>0&&<button style={S.sm(C.sc)} disabled={!!(gm&&gm.en)} onClick={()=>buscarEnGmailFaltantes(faltan)}>{gm&&gm.en?`✉️ Buscando ${gm.resultados.length}/${faltan.length}…`:`✉️ Buscar en Gmail las ${faltan.length} que faltan`}</button>}
                  </div>
                  {gm&&gm.resultados.length>0&&(
                    <div style={{marginTop:8,borderTop:`1px solid ${C.bd}55`,paddingTop:6}}>
                      {gm.resultados.map((res,k)=>(
                        <div key={k} style={{padding:'4px 0',borderTop:k?`1px solid ${C.bd}33`:'none'}}>
                          <div>{res.estado==='adjuntada'?'📎':res.estado==='elegir'?'❓':res.estado==='error'?'⚠️':'✗'} {lineaInv(res.inv)}</div>
                          <div style={{fontSize:10,color:res.estado==='adjuntada'?C.sc:C.mt}}>{res.motivo}</div>
                          {res.estado==='elegir'&&(res.candidatos||[]).map((cand,j)=>(
                            <div key={j} style={{display:'flex',gap:6,alignItems:'center',fontSize:10,padding:'3px 0 3px 12px'}}>
                              <div style={{flex:1,minWidth:0}}><b>{cand.filename}</b> · {String(cand.de||'').replace(/<.*$/,'').trim()} · {String(cand.asunto||'').slice(0,50)}<div style={{color:C.mt}}>{(cand.por||[]).join(', ')||'sin coincidencias claras'}</div></div>
                              <button style={S.sm(C.sc)} onClick={async()=>{
                                try{const clientId=await leerGmailId();const tok=await tokenGmail(clientId);const nube=await engancharDeGmail(res.inv,cand,tok);
                                  setPkCheq(c=>({...c,gmail:{...c.gmail,resultados:c.gmail.resultados.map(x=>x.inv.id===res.inv.id?{...x,estado:'adjuntada',motivo:cand.filename+(nube.ok?' · ☁️ en la nube':' · ⏳ subiendo'),candidatos:[]}:x)}}));
                                }catch(e){notify('No se pudo enganchar: '+String(e&&e.message||e).slice(0,80),'error');}
                              }}>📎 Usar</button>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button style={{...S.btn(C.ac),opacity:pkBusy?0.6:1}} disabled={pkBusy||!cuenta} onClick={()=>{
                  const etq=(pkPeriodo.clave==='libre')?(dIni+'_a_'+dFin):r.etq;
                  setPkPeriodo(null);setPkCheq(null);
                  generarPaqueteGestoria({ini:dIni,fin:dFin,etq});
                }}>{pkBusy?'⏳ Preparando…':'📦 Generar paquete'}</button>
                <button style={S.ghost} onClick={()=>{setPkPeriodo(null);setPkCheq(null);}}>Cancelar</button>
              </div>
            </div>
          </div>
        );
      })()}
      {<ModalNuevoPresupuesto {...{avisarCerrar,openNewContrato,setContratoForm,setShowNuevoTipo,showNuevoTipo}}/>}
      {pagoModal&&<ModalPagoFactura {...{FORMAS,avisarCerrar,invoices,pagoForm,pagoModal,savePago,setPagoForm,setPagoModal}}/>}
      {linkModal&&LinkModal()}

      {/* ═══ DESGLOSE DE KPI ═══ */}
      {/* ═══ ALTA Y EDICIÓN DE UNA OPERACIÓN FINANCIERA ═══ */}
      {<ModalOperacionFinanciera {...{BtnConfirm,avisarCerrar,finForm,financiacion,notify,persistFin,setFinForm,setFinVer}}/>}

      {/* ═══ DETALLE: CUADRO, DISPOSICIONES Y AMORTIZACIONES ═══ */}
      {finVer&&(()=>{
        const o=(financiacion||[]).find(x=>x.id===finVer);
        if(!o)return null;
        const meta=TIPOS_FIN.find(x=>x.id===o.tipo)||TIPOS_FIN[0];
        const esLinea=o.tipo==='linea';
        const c=esLinea?null:cuadroFinanciacion(o,euribor,{hoy:today});
        const desde=o.ultimaLiquidacion||o.fechaInicio||today;
        const iLinea=esLinea?interesesPeriodo(o,desde,today,euribor):null;
        const anadir=(campo,x)=>persistFin(financiacion.map(y=>y.id===o.id?{...y,[campo]:[...(y[campo]||[]),x]}:y));
        const quitar=(campo,ix)=>persistFin(financiacion.map(y=>y.id===o.id?{...y,[campo]:(y[campo]||[]).filter((_,k)=>k!==ix)}:y));
        return(
          <div style={S.overlay} onClick={avisarCerrar}>
            <div style={{...S.modal,maxWidth:560}} onClick={e=>e.stopPropagation()}>
              <div style={{...S.cabModal,display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{meta.ic} {o.nombre}</div>
                  <div style={{fontSize:11,color:C.mt}}>{o.entidad||meta.n} · {o.clase==='variable'?tipoEnFecha(o,today,euribor).fuente:`${o.fijo||0}% fijo`}</div>
                </div>
                {!esLector()&&<button style={S.sm(C.mt)} onClick={()=>{setFinForm(o);setFinVer(null);}}>✏️</button>}
                <button style={{background:'transparent',border:'none',cursor:'pointer',color:C.mt,fontSize:20,lineHeight:1,padding:'0 4px'}} onClick={()=>setFinVer(null)}>✕</button>
              </div>
              {c&&c.avisos.map((a,i)=><div key={i} style={{background:C.wn+'14',border:`1px solid ${C.wn}55`,borderRadius:8,padding:'7px 9px',marginBottom:8,fontSize:10,color:C.wn}}>⚠ {a}</div>)}

              {esLinea&&(
                <div style={{background:C.bg,borderRadius:9,padding:'9px 11px',marginBottom:10}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:6}}>
                    {[['Dispuesto',fmt(saldoDispuesto(o))+' €'],['Disponible',fmt(disponibleLinea(o))+' €'],['Intereses desde '+fmtDate(desde),fmt(iLinea.intereses)+' €']].map(([l,v])=>(
                      <div key={l} style={{textAlign:'center'}}><div style={{fontSize:9,color:C.mt}}>{l}</div><div style={{fontSize:12,fontWeight:800}}>{v}</div></div>
                    ))}
                  </div>
                  <div style={{fontSize:9,color:C.mt}}>Saldo medio del periodo: {fmt(iLinea.saldoMedio)} € · base 360 días</div>
                </div>
              )}

              {['disposiciones','amortizaciones'].filter(k=>k==='amortizaciones'||esLinea).map(campo=>(
                <div key={campo} style={{marginBottom:10}}>
                  <div style={{fontSize:11,fontWeight:700,marginBottom:4}}>{campo==='disposiciones'?'💶 Disposiciones':'↩️ Amortizaciones anticipadas'}</div>
                  {(o[campo]||[]).map((x,ix)=>(
                    <div key={ix} style={{display:'flex',alignItems:'center',gap:8,fontSize:11,padding:'4px 0',borderBottom:`1px solid ${C.bd}44`}}>
                      <span style={{flex:1,minWidth:0}}>{fmtDate(x.fecha)}{x.efecto?` · ${x.efecto==='plazo'?'acorta plazo':'baja cuota'}`:''}</span>
                      <b>{fmt(x.importe)} €</b>
                      {!esLector()&&<button style={{background:'none',border:'none',color:C.dn,cursor:'pointer',fontSize:11}} onClick={()=>quitar(campo,ix)}>×</button>}
                    </div>
                  ))}
                  {!esLector()&&(
                    <div style={{display:'flex',gap:6,marginTop:6,flexWrap:'wrap'}}>
                      <input id={`f-${campo}`} style={{...S.input,flex:'1 1 110px',minWidth:0,fontSize:11}} type="date" defaultValue={today}/>
                      <input id={`i-${campo}`} style={{...S.input,flex:'1 1 90px',minWidth:0,fontSize:11}} inputMode="decimal" placeholder="0,00"/>
                      {campo==='amortizaciones'&&<select id="e-amort" style={{...S.select,flex:'1 1 110px',minWidth:0,fontSize:11}}><option value="cuota">Bajar la cuota</option><option value="plazo">Acortar el plazo</option></select>}
                      <button style={{...S.sm(C.in),flexShrink:0}} onClick={()=>{
                        const f=document.getElementById(`f-${campo}`).value;
                        const imp=parseNum(document.getElementById(`i-${campo}`).value);
                        if(!f||!(imp>0)){notify('Indica fecha e importe','error');return;}
                        const x={fecha:f,importe:imp};
                        if(campo==='amortizaciones')x.efecto=document.getElementById('e-amort').value;
                        anadir(campo,x);
                        document.getElementById(`i-${campo}`).value='';
                      }}>Añadir</button>
                    </div>
                  )}
                </div>
              ))}

              {c&&(
                <div>
                  <div style={{fontSize:11,fontWeight:700,marginBottom:4}}>📅 Cuadro de amortización ({c.filas.length} cuotas)</div>
                  <div style={{maxHeight:260,overflowY:'auto',border:`1px solid ${C.bd}`,borderRadius:8}}>
                    <div style={{display:'grid',gridTemplateColumns:'52px 1fr 1fr 1fr 1fr',fontSize:9,fontWeight:700,color:C.mt,padding:'6px 8px',borderBottom:`1px solid ${C.bd}`,position:'sticky',top:0,background:C.cd}}>
                      <span>Fecha</span><span style={{textAlign:'right'}}>Cuota</span><span style={{textAlign:'right'}}>Interés</span><span style={{textAlign:'right'}}>Capital</span><span style={{textAlign:'right'}}>Pendiente</span>
                    </div>
                    {c.filas.map(f=>(
                      <div key={f.n} style={{display:'grid',gridTemplateColumns:'52px 1fr 1fr 1fr 1fr',fontSize:10,padding:'4px 8px',borderBottom:`1px solid ${C.bd}33`,
                        background:f.fecha<today?'transparent':(f.carencia?C.wn+'10':C.sc+'0c')}}>
                        <span style={{color:C.mt}}>{String(f.fecha).slice(2,7)}</span>
                        <span style={{textAlign:'right',fontWeight:700}}>{fmt(f.cuota)}</span>
                        <span style={{textAlign:'right',color:C.mt}}>{fmt(f.interes)}</span>
                        <span style={{textAlign:'right',color:C.mt}}>{fmt(f.capital)}</span>
                        <span style={{textAlign:'right'}}>{fmt(f.pendiente)}</span>
                      </div>
                    ))}
                  </div>
                  {finLlevaIva(o.tipo)&&<div style={{fontSize:10,color:C.mt,marginTop:6}}>El IVA de cada cuota ({fmt(c.filas[0]?c.filas[0].iva:0)} € la primera) es soportado deducible: entra en el 303.</div>}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ═══ CUSTODIA: QUÉ SE GUARDA Y QUÉ TOCA DESTRUIR ═══ */}
      {<ModalCustodiaDatos {...{BtnConfirm,avisarCerrar,custodia,notify,setCustodia,setVerDni}}/>}

      {/* Ver un documento de identidad */}
      {<ModalAvisoConfidencial {...{avisarCerrar,setVerDni,verDni}}/>}

      {/* ═══ DATOS QUE HAN MANDADO LOS CLIENTES ═══ */}
      {<ModalDatosClientes {...{BtnConfirm,avisarCerrar,cliCat,cliRecibidos,notify,persistCliCat,setCliRecibidos,setFusion,alAplicar}}/>}

      {/* ═══ FUSIONAR CON LA FICHA QUE YA EXISTÍA ═══ */}
      {fusion&&(()=>{
        const dif=compararFichas(fusion.anterior,fusion.entrante);
        const conflicto=dif.filter(c=>c.estado==='distinto');
        const nuevos=dif.filter(c=>c.estado==='nuevo');
        return(
          <div style={S.overlay} onClick={avisarCerrar}>
            <div style={{...S.modal,maxWidth:520}} onClick={e=>e.stopPropagation()}>
              <div style={{...S.cabModal,display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14}}>🔀 {fusion.nom} ya estaba dado de alta</div>
                  <div style={{fontSize:11,color:C.mt}}>Decide qué te quedas de cada campo</div>
                </div>
                <button style={{background:'transparent',border:'none',cursor:'pointer',color:C.mt,fontSize:20,lineHeight:1,padding:'0 4px'}} onClick={()=>setFusion(null)}>✕</button>
              </div>

              {nuevos.length>0&&(
                <div style={{background:C.sc+'12',border:`1px solid ${C.sc}44`,borderRadius:9,padding:'8px 10px',marginBottom:9,fontSize:11}}>
                  <b style={{color:C.sc}}>✓ {nuevos.length} dato{nuevos.length!==1?'s':''} que no tenías</b>
                  <div style={{fontSize:10,color:C.mt,marginTop:3,lineHeight:1.5}}>
                    {nuevos.map(c=>c.etiqueta+': '+c.entrante).join(' · ')}
                  </div>
                  <div style={{fontSize:9.5,color:C.mt,marginTop:3}}>Se añaden solos: rellenar un hueco no quita nada.</div>
                </div>
              )}

              {conflicto.length===0&&<div style={{fontSize:11,color:C.mt,marginBottom:9}}>No hay ningún dato que se contradiga.</div>}

              {conflicto.map(c=>{
                const eleg=fusion.elegidos[c.campo]||'actual';
                const opcion=(k,valor,etiq)=>(
                  <button style={{flex:1,textAlign:'left',padding:'7px 9px',borderRadius:8,cursor:'pointer',fontSize:11,
                    border:`1px solid ${eleg===k?C.in:C.bd}`,background:eleg===k?C.in+'18':'transparent',color:C.tx}}
                    onClick={()=>setFusion(p=>({...p,elegidos:{...p.elegidos,[c.campo]:k}}))}>
                    <div style={{fontSize:9,color:eleg===k?C.in:C.mt}}>{etiq}</div>
                    <div style={{fontWeight:eleg===k?700:400,wordBreak:'break-word'}}>{String(valor||'—')}</div>
                  </button>
                );
                return(
                  <div key={c.campo} style={{marginBottom:8}}>
                    <div style={{fontSize:10,color:C.mt,marginBottom:3}}>{c.etiqueta}</div>
                    <div style={{display:'flex',gap:6}}>
                      {opcion('actual',c.actual,'Lo que tienes')}
                      {opcion('entrante',c.entrante,'Lo que envía')}
                    </div>
                  </div>
                );
              })}

              {conflicto.length>1&&(
                <button style={{...S.sm(C.mt),fontSize:10,marginBottom:8}} onClick={()=>{
                  const todos={};conflicto.forEach(c=>{todos[c.campo]='entrante';});
                  setFusion(p=>({...p,elegidos:todos}));
                }}>Quedarme con todo lo que envía</button>
              )}

              <div style={{display:'flex',gap:8,marginTop:6}}>
                <button style={{...S.btn(C.sc),flex:1}} onClick={()=>{
                  const nueva=fusionar(fusion.anterior,fusion.entrante,fusion.elegidos);
                  nueva.nombre=fusion.nom; nueva.recibidoEn=today;
                  delete nueva._origen; delete nueva.id; delete nueva.estado; delete nueva.token; delete nueva.nDni;
                  persistCliCat([...(cliCat||[]).filter(x=>x&&normProvNombre(x.nombre)!==normProvNombre(fusion.nom)),nueva]);
                  if(fusion.entrante.nDni>0&&window.bh10Dni){
                    window.bh10Dni.listar().then(ds=>{
                      ds.filter(d=>d.envio===fusion.envio).forEach(d=>{window.bh10Dni.marcarCliente(d.id,fusion.nom).catch(()=>{});});
                    }).catch(()=>{});
                  }
                  if(window.bh10Recibidos)window.bh10Recibidos.borrar(fusion.envio).catch(()=>{});
                  setCliRecibidos(p=>(p||[]).filter(x=>x.id!==fusion.envio));
                  setFusion(null);
                  notify(`🔀 Ficha de ${fusion.nom} fusionada`);
                }}>🔀 Fusionar</button>
                <button style={S.ghost} onClick={()=>setFusion(null)}>Cancelar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ PEGAR CONTACTOS ═══ */}
      {<ModalMovilesCorreos {...{avisarCerrar,contPegar,employees,notify,setContImport,setContPegar}}/>}

      {/* ═══ REVISAR Y APLICAR CONTACTOS ═══ */}
      {contImport&&(()=>{
        const L=contImport;
        const conDestino=L.filter(x=>x.empleadoId);
        const cambios=conDestino.map(x=>cambiosContacto(x,employees)).filter(x=>x&&x.cambios.length);
        const nCambios=cambios.reduce((a,x)=>a+x.cambios.length,0);
        const sinDestino=L.filter(x=>!x.empleadoId);
        const poner=(i,id)=>setContImport(l=>l.map((x,k)=>k===i?{...x,empleadoId:id}:x));
        return(
          <div style={S.overlay} onClick={avisarCerrar}>
            <div style={{...S.modal,maxWidth:560}} onClick={e=>e.stopPropagation()}>
              <div style={{...S.cabModal,display:'flex',alignItems:'center',gap:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14}}>📥 Revisar contactos</div>
                  <div style={{fontSize:11,color:C.mt}}>{L.length} líneas · {nCambios} cambio{nCambios!==1?'s':''} que aplicar</div>
                </div>
                <button style={{background:'transparent',border:'none',cursor:'pointer',color:C.mt,fontSize:20,lineHeight:1,padding:'0 4px'}} onClick={()=>setContImport(null)}>✕</button>
              </div>

              {sinDestino.length>0&&(
                <div style={{background:C.wn+'14',border:`1px solid ${C.wn}55`,borderRadius:9,padding:'8px 10px',marginBottom:9,fontSize:11,color:C.wn}}>
                  ⚠ {sinDestino.length} sin asignar. <b>Elige tú a quién corresponde</b>: prefiero no adivinar,
                  porque un móvil en la ficha equivocada acaba en un fichaje de otra persona.
                </div>
              )}

              <div style={{maxHeight:330,overflowY:'auto',marginBottom:10}}>
                {L.map((x,i)=>{
                  const c=cambiosContacto(x,employees);
                  const yaIgual=c&&c.cambios.length===0;
                  return(
                    <div key={i} style={{background:C.bg,borderRadius:8,padding:'8px 10px',marginBottom:5,
                      borderLeft:`3px solid ${x.empleadoId?(yaIgual?C.mt:C.sc):C.wn}`}}>
                      <div style={{fontSize:12,fontWeight:700,marginBottom:2}}>
                        {x.seguro?'✓':(x.empleadoId?'✎':'?')} {x.nombre}
                      </div>
                      <div style={{fontSize:10,color:C.mt,marginBottom:5}}>
                        {x.telefono||'sin móvil'}{x.email?' · '+x.email:' · sin correo'}
                        {x.telMal?' · ⚠ móvil no válido':''}{x.emailMal?' · ⚠ correo no válido':''}
                      </div>
                      <select style={{...S.select,fontSize:16,padding:'7px 9px'}} value={x.empleadoId}
                        onChange={e=>poner(i,e.target.value)}>
                        <option value="">— no importar esta línea —</option>
                        {(employees||[]).filter(e=>e&&e.activo!==false).map(e=>(
                          <option key={e.id} value={e.id}>
                            {e.nombre}{x.candidatos.some(c2=>c2.id===e.id)?'  ★':''}
                          </option>
                        ))}
                      </select>
                      {c&&c.cambios.length>0&&(
                        <div style={{fontSize:10,color:C.sc,marginTop:4}}>
                          {c.cambios.map(k=>(
                            <div key={k.campo}>{k.etiqueta}: {k.antes?<s style={{color:C.mt}}>{k.antes}</s>:<i style={{color:C.mt}}>vacío</i>} → <b>{k.ahora}</b></div>
                          ))}
                        </div>
                      )}
                      {yaIgual&&<div style={{fontSize:10,color:C.mt,marginTop:4}}>Ya lo tiene igual: no se toca nada.</div>}
                    </div>
                  );
                })}
              </div>

              <div style={{display:'flex',gap:8}}>
                <button style={{...S.btn(C.sc),flex:1,opacity:nCambios?1:.5}} disabled={!nCambios}
                  onClick={()=>{
                    let n=0;
                    const nuevos=(employees||[]).map(e=>{
                      const l=L.find(x=>x&&x.empleadoId===e.id);
                      if(!l)return e;
                      const c=cambiosContacto(l,employees);
                      if(!c||!c.cambios.length)return e;
                      const upd={...e};
                      c.cambios.forEach(k=>{upd[k.campo]=k.ahora;n++;});
                      return upd;
                    });
                    saveEmployees(nuevos);
                    setContImport(null);
                    notify(`📥 ${n} dato${n!==1?'s':''} actualizado${n!==1?'s':''}`);
                  }}>Aplicar {nCambios||''}</button>
                <button style={S.ghost} onClick={()=>setContImport(null)}>Cancelar</button>
              </div>
              <div style={{fontSize:10,color:C.mt,marginTop:7,lineHeight:1.4}}>
                La cuenta bancaria no se toca. Sin móvil, un trabajador no puede fichar.
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ FICHAJES: ALTA Y SEGUIMIENTO ═══ */}
      {fichajeGest&&(()=>{
        const G=fichajeGest;
        const conAlta=new Set((G.trabajadores||[]).map(t=>String(t.telefono||'')));
        const sinAlta=(employees||[]).filter(e=>e&&e.activo!==false)
          .filter(e=>{const t=String(e.telefono||'').replace(/\D/g,'');return t.length>=9&&!conAlta.has(t);});
        const sinTelefono=(employees||[]).filter(e=>e&&e.activo!==false&&String(e.telefono||'').replace(/\D/g,'').length<9);
        return(
          <div style={S.overlay} onClick={avisarCerrar}>
            <div style={{...S.modal,maxWidth:560}} onClick={e=>e.stopPropagation()}>
              <div style={{...S.cabModal,display:'flex',alignItems:'center',gap:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14}}>🕐 Fichajes</div>
                  <div style={{fontSize:11,color:C.mt}}>
                    {G.ver?G.ver.nombre:`${(G.trabajadores||[]).length} de alta · ${sinAlta.length} por dar de alta`}
                  </div>
                </div>
                {G.ver&&<button style={{...S.sm(C.mt),padding:'5px 10px',fontSize:10,minHeight:0,width:'auto'}}
                  onClick={()=>setFichajeGest(p=>({...p,ver:null,regs:[]}))}>← Volver</button>}
                <button style={{background:'transparent',border:'none',cursor:'pointer',color:C.mt,fontSize:20,lineHeight:1,padding:'0 4px'}} onClick={()=>setFichajeGest(null)}>✕</button>
              </div>

              {!G.ver&&(<>
                <div style={{background:C.in+'12',border:`1px solid ${C.in}40`,borderRadius:9,padding:'9px 11px',marginBottom:10,fontSize:10.5,color:C.mt,lineHeight:1.5}}>
                  Cada trabajador ficha en <b style={{color:C.tx}}>bh10group.com/fichar</b> desde su móvil.
                  Solo puede entrar quien esté dado de alta aquí, y <b style={{color:C.tx}}>solo ve su propio historial</b>.
                </div>

                {sinAlta.length>0&&(
                  <div style={{marginBottom:10}}>
                    <div style={{fontSize:11,fontWeight:700,color:C.wn,marginBottom:5}}>POR DAR DE ALTA ({sinAlta.length})</div>
                    {sinAlta.map(e=>(
                      <div key={e.id} style={{background:C.bg,borderRadius:8,padding:'8px 10px',marginBottom:5,
                        display:'flex',justifyContent:'space-between',gap:8,alignItems:'center'}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.nombre}</div>
                          <div style={{fontSize:10,color:C.mt}}>{e.telefono}</div>
                        </div>
                        <button style={{...S.sm(C.vt),padding:'6px 9px',fontSize:10,minHeight:0,width:'auto',flexShrink:0}}
                          title="Mandarle las instrucciones por WhatsApp"
                          onClick={()=>{
                            const t=normTelefonoES(e.telefono);
                            const msg=['Hola '+String(e.nombre||'').split(',')[0].trim()+',','',
                              'Ya puedes fichar desde el móvil:','',
                              'bh10group.com/fichar','',
                              'Entra con ESTE mismo número de teléfono. Te llegará un SMS con un código, solo la primera vez.',
                              'Después creas un PIN de 6 cifras y ya está: abres, pones el PIN y fichas.','',
                              'Consejo: añade la página a la pantalla de inicio del móvil. Así te llegarán los avisos si algún día se te olvida fichar.'].join('\n');
                            if(!t){notify('Ese móvil no es válido','error');return;}
                            try{window.open(enlaceWhatsApp(t,msg),'_blank');}catch(x){notify('No se pudo abrir WhatsApp','error');}
                          }}>💬</button>
                        <button style={{...S.sm(C.sc),padding:'6px 11px',fontSize:10,minHeight:0,width:'auto',flexShrink:0}}
                          onClick={async()=>{
                            try{
                              await window.bh10Fichaje.alta(e.telefono,{empleadoId:e.id,nombre:e.nombre,
                                empresa:(compCfg&&compCfg.name)||''});
                              const t=await window.bh10Fichaje.trabajadores();
                              setFichajeGest(p=>({...p,trabajadores:t}));
                              notify(`🕐 ${e.nombre} ya puede fichar`);
                              // El aviso de la mañana necesita su jornada
                              const yo=t.find(x=>x&&x.empleadoId===e.id);
                              if(yo&&e.jornada)window.bh10Fichaje.publicarJornada(yo.uid,e.jornada).catch(()=>{});
                            }catch(x){notify('No se pudo: '+((x&&x.code)||x),'error');}
                          }}>Dar de alta</button>
                      </div>
                    ))}
                    <div style={{fontSize:10,color:C.mt,marginTop:4,lineHeight:1.45}}>
                      Al darlo de alta, ya puede entrar con su móvil. El SMS se lo manda Firebase la primera vez.
                    </div>
                  </div>
                )}
                {sinTelefono.length>0&&(
                  <div style={{background:C.wn+'12',border:`1px solid ${C.wn}44`,borderRadius:9,padding:'8px 10px',marginBottom:10,fontSize:10.5,color:C.wn}}>
                    ⚠ {sinTelefono.length} sin móvil en su ficha: {sinTelefono.slice(0,4).map(e=>e.nombre.split(',')[0]).join(', ')}{sinTelefono.length>4?'…':''}.
                    <div style={{fontSize:10,color:C.mt,marginTop:2}}>Sin móvil no pueden fichar: complétalo en su ficha.</div>
                  </div>
                )}

                {(G.trabajadores||[]).length>0&&(
                  <button style={{...S.sm(C.in),marginBottom:9,fontSize:11,width:'100%'}} onClick={async()=>{
                    let n=0;
                    for(const t of (G.trabajadores||[])){
                      const e=(employees||[]).find(x=>x&&x.id===t.empleadoId);
                      if(!e||!e.jornada)continue;
                      try{await window.bh10Fichaje.publicarJornada(t.uid,e.jornada);n++;}catch(x){}
                    }
                    notify(n?`🕐 Jornada publicada para ${n}`:'Ninguno tiene jornada puesta en su ficha','' );
                  }}>🔄 Publicar las jornadas (para el aviso automático)</button>
                )}
                <div style={{fontSize:11,fontWeight:700,color:C.mt,marginBottom:5}}>YA FICHAN ({(G.trabajadores||[]).length})</div>
                {(G.trabajadores||[]).length===0&&<div style={{fontSize:11,color:C.mt,marginBottom:8}}>Todavía no ha entrado nadie.</div>}
                {(G.trabajadores||[]).map(t=>(
                  <div key={t.uid} style={{background:C.bg,borderRadius:8,padding:'8px 10px',marginBottom:5,cursor:'pointer'}}
                    onClick={async()=>{
                      notify('Cargando…');
                      try{
                        const regs=await window.bh10Fichaje.registros(t.uid);
                        setFichajeGest(p=>({...p,ver:t,regs}));
                      }catch(x){notify('No se pudo: '+((x&&x.code)||x),'error');}
                    }}>
                    <div style={{display:'flex',justifyContent:'space-between',gap:8}}>
                      <b style={{fontSize:12,flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>👷 {t.nombre}</b>
                      <span style={{fontSize:10,color:C.in,flexShrink:0}}>ver fichajes ›</span>
                    </div>
                    <div style={{fontSize:10,color:C.mt}}>{t.telefono}{t.empresa?' · '+t.empresa:''}</div>
                  </div>
                ))}
              </>)}

              {G.ver&&(()=>{
                const emp=(employees||[]).find(e=>e&&e.id===G.ver.empleadoId)||{nombre:G.ver.nombre};
                const porDia={};
                (G.regs||[]).forEach(r=>{ if(r&&r.fecha)(porDia[r.fecha]=porDia[r.fecha]||[]).push(r); });
                const dias=Object.keys(porDia).sort().reverse().slice(0,31);
                const COL={ok:C.sc,exceso:C.in,defecto:C.wn,'sin-fichar':C.dn,'no-previsto':C.wn,abierto:C.wn,ausencia:C.mt};
                const TXT={ok:'correcto',exceso:'de más',defecto:'de menos','sin-fichar':'sin fichar',
                  'no-previsto':'no estaba previsto',abierto:'sin cerrar',ausencia:''};
                let sumaP=0,sumaR=0;
                const filas=dias.map(f=>{
                  const c=cuadreDia(emp,f,porDia[f],[]);
                  sumaP+=c.previsto; sumaR+=c.real; return c;
                });
                return(
                  <>
                    <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
                      <div style={{...S.card,flex:'1 1 100px',padding:'8px 10px'}}>
                        <div style={{fontSize:10,color:C.mt}}>Previsto</div>
                        <div style={{fontSize:16,fontWeight:800}}>{fmt(sumaP)} h</div>
                      </div>
                      <div style={{...S.card,flex:'1 1 100px',padding:'8px 10px'}}>
                        <div style={{fontSize:10,color:C.mt}}>Fichado</div>
                        <div style={{fontSize:16,fontWeight:800}}>{fmt(sumaR)} h</div>
                      </div>
                      <div style={{...S.card,flex:'1 1 100px',padding:'8px 10px'}}>
                        <div style={{fontSize:10,color:C.mt}}>Diferencia</div>
                        <div style={{fontSize:16,fontWeight:800,color:Math.abs(sumaR-sumaP)<0.26?C.sc:(sumaR>sumaP?C.in:C.wn)}}>
                          {sumaR>=sumaP?'+':''}{fmt(+(sumaR-sumaP).toFixed(2))} h
                        </div>
                      </div>
                    </div>
                    {filas.length===0&&<div style={{fontSize:11,color:C.mt}}>Todavía no ha fichado ningún día.</div>}
                    <div style={{maxHeight:300,overflowY:'auto'}}>
                      {filas.map(c=>(
                        <div key={c.fecha} style={{background:C.bg,borderRadius:8,padding:'7px 10px',marginBottom:5,
                          borderLeft:`3px solid ${COL[c.estado]||C.mt}`}}>
                          <div style={{display:'flex',justifyContent:'space-between',gap:8}}>
                            <b style={{fontSize:11.5}}>{fmtDate(c.fecha)}</b>
                            <span style={{fontSize:11,fontWeight:700}}>
                              {c.codigo?CODIGOS_PLAN[c.codigo]?.n||c.codigo:`${fmt(c.real)} / ${fmt(c.previsto)} h`}
                            </span>
                          </div>
                          <div style={{fontSize:10,color:C.mt,display:'flex',justifyContent:'space-between',gap:8}}>
                            <span>{(porDia[c.fecha]||[]).sort((a,b)=>String(a.hora).localeCompare(String(b.hora)))
                              .map(r=>(r.tipo==='entrada'?'▸':'◂')+r.hora).join(' ')}</span>
                            <span style={{color:COL[c.estado]||C.mt,flexShrink:0}}>{TXT[c.estado]||''}</span>
                          </div>
                          {c.sueltos>0&&<div style={{fontSize:10,color:C.wn}}>⚠ {c.sueltos} fichaje sin pareja</div>}
                        </div>
                      ))}
                    </div>
                    {/* Corregir: no borra el fichaje, añade una rectificación */}
                    {!esLector()&&(
                      <button style={{...S.sm(C.wn),width:'100%',marginTop:9,fontSize:11}} onClick={()=>{
                        setFichajeGest(p=>({...p,corregir:{fecha:today,texto:'',motivo:''}}));
                      }}>✍️ Añadir una corrección</button>
                    )}
                    {G.corregir&&(
                      <div style={{...S.card,marginTop:9,borderColor:C.wn+'66'}}>
                        <div style={{fontSize:11,fontWeight:700,color:C.wn,marginBottom:6}}>✍️ Corrección</div>
                        <div style={{fontSize:10,color:C.mt,marginBottom:8,lineHeight:1.45}}>
                          El fichaje original <b style={{color:C.tx}}>no se borra</b>. Esto se añade al lado,
                          con tu nombre y la fecha, y <b style={{color:C.tx}}>el trabajador lo ve</b>.
                          Es lo que hace que la corrección sea legítima y el registro siga valiendo.
                        </div>
                        <label><span style={{fontSize:10,color:C.mt}}>Día</span>
                          <input type="date" style={S.input} value={G.corregir.fecha}
                            onChange={e=>setFichajeGest(p=>({...p,corregir:{...p.corregir,fecha:e.target.value}}))}/></label>
                        <label><span style={{fontSize:10,color:C.mt}}>Qué debería decir</span>
                          <input style={S.input} value={G.corregir.texto} placeholder="Entró a las 08:00, se le olvidó fichar"
                            onChange={e=>setFichajeGest(p=>({...p,corregir:{...p.corregir,texto:e.target.value}}))}/></label>
                        <label><span style={{fontSize:10,color:C.mt}}>Motivo *</span>
                          <input style={S.input} value={G.corregir.motivo} placeholder="Olvido del trabajador, confirmado por el encargado"
                            onChange={e=>setFichajeGest(p=>({...p,corregir:{...p.corregir,motivo:e.target.value}}))}/></label>
                        <div style={{display:'flex',gap:8,marginTop:4}}>
                          <button style={{...S.btn(C.wn),flex:1,opacity:String(G.corregir.motivo||'').trim().length>3?1:.5}}
                            disabled={String(G.corregir.motivo||'').trim().length<=3}
                            onClick={async()=>{
                              try{
                                await window.bh10Fichaje.rectificar(G.ver.uid,{
                                  fecha:G.corregir.fecha, texto:String(G.corregir.texto||'').slice(0,300),
                                  motivo:String(G.corregir.motivo||'').slice(0,300)});
                                setFichajeGest(p=>({...p,corregir:null}));
                                notify('✍️ Corrección añadida · el trabajador la verá');
                              }catch(x){notify('No se pudo: '+((x&&x.code)||x),'error');}
                            }}>Añadir corrección</button>
                          <button style={S.ghost} onClick={()=>setFichajeGest(p=>({...p,corregir:null}))}>Cancelar</button>
                        </div>
                      </div>
                    )}
                    <div style={{fontSize:10,color:C.mt,marginTop:9,lineHeight:1.45}}>
                      Los fichajes <b style={{color:C.tx}}>no se pueden modificar ni borrar</b>, tampoco por ti:
                      un registro que se retoca no vale como registro. Las correcciones se añaden aparte y él las ve.
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        );
      })()}

      {/* ═══ IMPORTAR PLANIFICACIÓN MENSUAL ═══ */}
      {planImport&&(()=>{
        const P=planImport, R=P.resumen;
        const yaHabia=(planMeses||[]).find(m=>m&&m.mes===P.mes);
        return(
          <div style={S.overlay} onClick={avisarCerrar}>
            <div style={{...S.modal,maxWidth:540}} onClick={e=>e.stopPropagation()}>
              <div style={{...S.cabModal,display:'flex',alignItems:'center',gap:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14}}>📅 Planificación de {P.mes}</div>
                  <div style={{fontSize:11,color:C.mt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{P.nombre}</div>
                </div>
                <button style={{background:'transparent',border:'none',cursor:'pointer',color:C.mt,fontSize:20,lineHeight:1,padding:'0 4px'}} onClick={()=>setPlanImport(null)}>✕</button>
              </div>

              <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
                <div style={{...S.card,flex:'1 1 100px',padding:'8px 10px'}}>
                  <div style={{fontSize:10,color:C.mt}}>Personas</div>
                  <div style={{fontSize:17,fontWeight:800}}>{R.porEmp.length}</div>
                </div>
                <div style={{...S.card,flex:'1 1 100px',padding:'8px 10px'}}>
                  <div style={{fontSize:10,color:C.mt}}>Jornadas</div>
                  <div style={{fontSize:17,fontWeight:800}}>{R.totalDias}</div>
                </div>
                <div style={{...S.card,flex:'1 1 100px',padding:'8px 10px'}}>
                  <div style={{fontSize:10,color:C.mt}}>Horas previstas</div>
                  <div style={{fontSize:17,fontWeight:800}}>{fmt(R.totalHoras)}</div>
                </div>
              </div>

              {P.sinCasar.length>0&&(
                <div style={{background:C.dn+'14',border:`1px solid ${C.dn}55`,borderRadius:9,padding:'8px 10px',marginBottom:8,fontSize:11,color:C.dn}}>
                  ⚠ {P.sinCasar.length} nombre{P.sinCasar.length!==1?'s':''} que no está{P.sinCasar.length!==1?'n':''} en tu plantilla y se queda{P.sinCasar.length!==1?'n':''} fuera:
                  <div style={{fontSize:10,color:C.mt,marginTop:2}}>{P.sinCasar.join(' · ')}</div>
                  <div style={{fontSize:10,color:C.mt,marginTop:3}}>Compruébalo en Nóminas: el nombre debe coincidir, aunque el orden de apellidos puede cambiar.</div>
                </div>
              )}
              {yaHabia&&(
                <div style={{background:C.wn+'14',border:`1px solid ${C.wn}55`,borderRadius:9,padding:'8px 10px',marginBottom:8,fontSize:11,color:C.wn}}>
                  ⚠ Ya había planificación de {P.mes} ({yaHabia.dias} jornadas). <b>Se sustituye por esta.</b>
                  <div style={{fontSize:10,color:C.mt,marginTop:2}}>Los fichajes ya registrados no se tocan: lo previsto y lo ocurrido son cosas distintas.</div>
                </div>
              )}
              {R.totalAusencias>0&&(
                <div style={{fontSize:10.5,color:C.mt,marginBottom:8}}>
                  {R.totalAusencias} día{R.totalAusencias!==1?'s':''} marcado{R.totalAusencias!==1?'s':''} como ausencia (festivo, vacaciones, baja o permiso). No se pedirá fichar en ellos.
                </div>
              )}

              <div style={{maxHeight:240,overflowY:'auto',marginBottom:10}}>
                {R.porEmp.map((e,i)=>(
                  <div key={i} style={{background:C.bg,borderRadius:8,padding:'7px 10px',marginBottom:5,fontSize:11,
                    display:'flex',justifyContent:'space-between',gap:8,alignItems:'center'}}>
                    <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>👷 {e.nombre}</span>
                    <span style={{flexShrink:0,fontSize:10,color:C.mt}}>
                      {e.dias} d · <b style={{color:C.tx}}>{fmt(e.horas)} h</b>
                      {e.ausencias?` · ${e.ausencias} aus.`:''}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{display:'flex',gap:8}}>
                <button style={{...S.btn(C.sc),flex:1}} onClick={async()=>{
                  try{
                    await guardarPlanMes(P.mes,P.lineas);
                    setPlanImport(null);
                    notify(`📅 Planificación de ${P.mes} guardada · ${R.totalDias} jornadas`);
                  }catch(x){notify('No se pudo guardar: '+((x&&x.message)||x),'error');}
                }}>📅 Guardar {P.mes}</button>
                <button style={S.ghost} onClick={()=>setPlanImport(null)}>Cancelar</button>
              </div>
              <div style={{fontSize:10,color:C.mt,marginTop:7,lineHeight:1.4}}>
                Esto es lo <b style={{color:C.tx}}>previsto</b>. Cuando esté el fichaje, se comparará con lo ocurrido.
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ FICHA DE UN GASTO ADICIONAL ═══ */}
      {extraForm&&(()=>{
        const F=extraForm;
        const C0=(contratos||[]).find(c=>c&&c.id===F._contrato)||{};
        const puestas=(F.facturas||[]).map(String);
        const cand=candidatasExtra(C0,invoices,contratos);
        // Las ya metidas en ESTE gasto salen aunque estén "cogidas"
        const puestasObj=(invoices||[]).filter(f=>f&&puestas.includes(String(f.id))&&!esAnulada(f));
        const libres=(l)=>l.filter(f=>!puestas.includes(String(f.id)));
        const co=+puestasObj.reduce((s,f)=>s+parteExtra(F,f),0).toFixed(2);
        const pr=precioExtra(F,puestasObj);
        const set=(k,v)=>setExtraForm(p=>({...p,[k]:v}));
        const quitar=(id)=>set('facturas',puestas.filter(x=>x!==String(id)));
        // Sumatorio por proveedor de lo que lleva este gasto
        const porProv={};
        puestasObj.forEach(f=>{const k=String(f.proveedor||'(sin proveedor)');
          porProv[k]=(porProv[k]||0)+parteExtra(F,f);});
        const provs=Object.entries(porProv).map(([k,v])=>[k,+v.toFixed(2)]).sort((a,b)=>b[1]-a[1]);
        return(
          <div style={{...S.overlay,zIndex:CAPAS.DETALLE}} onClick={avisarCerrar}>
            <div style={{...S.modal,maxWidth:540}} onClick={e=>e.stopPropagation()}>
              <div style={{...S.cabModal,display:'flex',alignItems:'center',gap:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14}}>{F._nuevo?'➕ Nuevo gasto adicional':'✏️ Gasto adicional'}</div>
                  <div style={{fontSize:11,color:C.mt}}>{C0.obra||''}</div>
                </div>
                <button style={{background:'transparent',border:'none',cursor:'pointer',color:C.mt,fontSize:20,lineHeight:1,padding:'0 4px'}} onClick={()=>setExtraForm(null)}>✕</button>
              </div>

              <label><span style={{fontSize:10,color:C.mt}}>Qué es *</span>
                <input style={S.input} value={F.concepto||''} placeholder="Refuerzo de forjado en planta baja"
                  onChange={e=>set('concepto',e.target.value)}/></label>

              {/* ── FACTURAS: un desplegable y ya ── */}
              <div style={{fontSize:11.5,fontWeight:700,marginTop:6,marginBottom:5}}>📎 Facturas de este gasto</div>
              <select style={{...S.select,fontSize:16,marginBottom:8}} value=""
                onChange={e=>{ if(e.target.value)set('facturas',[...puestas,e.target.value]); }}>
                <option value="">➕ Añadir una factura…</option>
                {libres(cand.marcadas).length>0&&(
                  <optgroup label={'⭐ Marcadas como extra ('+libres(cand.marcadas).length+')'}>
                    {libres(cand.marcadas).map(f=>(
                      <option key={f.id} value={f.id}>
                        {f.proveedor} · {fmt(baseFactura(f))} €{f.obra?' · '+String(f.obra).slice(0,24):''}
                      </option>
                    ))}
                  </optgroup>
                )}
                {libres(cand.deObra).length>0&&(
                  <optgroup label={'Otras de '+(C0.obra||'esta obra')}>
                    {libres(cand.deObra).map(f=>(
                      <option key={f.id} value={f.id}>{f.proveedor} · {fmt(baseFactura(f))} € · {f.numFactura||'sin nº'}</option>
                    ))}
                  </optgroup>
                )}
              </select>

              {puestasObj.length===0
                ?<div style={{fontSize:10.5,color:C.mt,marginBottom:10,lineHeight:1.45}}>
                   {(libres(cand.marcadas).length+libres(cand.deObra).length)===0
                     ?'No hay ninguna disponible: o no has marcado ninguna factura como extra, o las que hay ya están en otro contrato.'
                     :'Elige arriba las facturas que son de este adicional.'}
                 </div>
                :(<>
                  {/* Sumatorio por proveedor, con sus facturas al tocarlo */}
                  {provs.map(([nom,tot])=>{
                    const ab=provAbierto===('f:'+nom);
                    const suyas=puestasObj.filter(f=>String(f.proveedor||'(sin proveedor)')===nom);
                    return(
                      <div key={nom} style={{background:C.bg,borderRadius:8,marginBottom:5,overflow:'hidden'}}>
                        <div style={{padding:'8px 10px',cursor:'pointer',display:'flex',justifyContent:'space-between',gap:8,alignItems:'center'}}
                          onClick={()=>setProvAbierto(a=>a===('f:'+nom)?'':('f:'+nom))}>
                          <b style={{fontSize:11.5,flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>🏢 {nom}</b>
                          <span style={{fontSize:10,color:C.mt,flexShrink:0}}>{suyas.length} fra</span>
                          <b style={{fontSize:12.5,flexShrink:0}}>{fmt(tot)} €</b>
                          <span style={{fontSize:11,color:C.mt,flexShrink:0}}>{ab?'▴':'▾'}</span>
                        </div>
                        {ab&&(
                          <div style={{padding:'0 10px 8px'}}>
                            {suyas.map(f=>(
                              <div key={f.id} style={{display:'flex',gap:8,alignItems:'center',padding:'4px 0',borderTop:`1px solid ${C.bd}44`}}>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:11,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                    {f.numFactura||'(sin nº)'} · {fmtDate(f.fecha)}
                                  </div>
                                  {f.concepto&&<div style={{fontSize:10,color:C.mt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.concepto}</div>}
                                </div>
                                <input inputMode="decimal" placeholder={fmt(baseFactura(f))}
                                  value={(F.partes&&F.partes[String(f.id)])??''}
                                  onChange={e=>{
                                    const v=e.target.value;
                                    setExtraForm(p=>({...p,partes:{...(p.partes||{}),[String(f.id)]:v}}));
                                  }}
                                  style={{...S.input,width:96,flexShrink:0,textAlign:'right',padding:'5px 7px',
                                    minHeight:0,fontSize:16,fontWeight:700,
                                    borderColor:estaPartida(F,f)?C.wn:C.bd}}/>
                                <span style={{fontSize:11,flexShrink:0}}>€</span>
                                <button style={{background:'transparent',border:'none',color:C.dn,cursor:'pointer',fontSize:12,padding:'0 2px',flexShrink:0}}
                                  title="Quitar de este gasto" onClick={()=>quitar(f.id)}>✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div style={{...S.card,padding:'8px 10px',marginBottom:10,display:'flex',justifyContent:'space-between'}}>
                    <span style={{fontSize:11,color:C.mt}}>Total de este gasto</span>
                    <b style={{fontSize:13}}>{fmt(co)} €{pr!==co?` → ${fmt(pr)} € a pedir`:''}</b>
                  </div>
                </>)}

              {/* ── LO DEMÁS, PLEGADO ── */}
              {/* Solo el concepto y las facturas hacen falta para anotarlo. El
                  resto es lo que hará falta para cobrarlo, y estorba de entrada. */}
              <button style={{width:'100%',background:'transparent',border:`1px dashed ${C.bd}`,borderRadius:9,
                padding:'9px 11px',color:C.mt,fontSize:11,cursor:'pointer',textAlign:'left',marginBottom:10}}
                onClick={()=>set('_abierto',!F._abierto)}>
                {F._abierto?'▴':'▾'} Datos para poder cobrarlo
                {!F._abierto&&(!F.prueba||F.prueba==='ninguna')&&co>0
                  ?<span style={{color:C.dn}}> · ⚠ sin nada por escrito</span>
                  :''}
              </button>

              {F._abierto&&(<>
                <label><span style={{fontSize:10,color:C.mt}}>Por qué surge</span>
                  <textarea style={{...S.input,minHeight:58}} value={F.causa||''}
                    placeholder="Al demoler apareció la viga dañada. No estaba en el proyecto."
                    onChange={e=>set('causa',e.target.value)}/></label>
                <label><span style={{fontSize:10,color:C.mt}}>Quién lo pidió o lo autorizó</span>
                  <input style={S.input} value={F.quienLoPide||''} placeholder="Promotor, arquitecto o jefe de obra"
                    onChange={e=>set('quienLoPide',e.target.value)}/></label>
                <label><span style={{fontSize:10,color:C.mt}}>Qué prueba hay</span>
                  <select style={S.select} value={F.prueba||''} onChange={e=>set('prueba',e.target.value)}>
                    <option value="">— sin indicar —</option>
                    {Object.entries(PRUEBAS_EXTRA).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                  </select></label>
                {(F.prueba==='verbal'||F.prueba==='ninguna')&&(
                  <div style={{fontSize:10,color:C.dn,margin:'-4px 0 10px',lineHeight:1.45}}>
                    De palabra vale, pero hay que probarlo. Manda un correo diciendo «según lo hablado,
                    ejecutamos X por Y €» y guarda su respuesta.
                  </div>
                )}
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <label style={{flex:'1 1 130px'}}><span style={{fontSize:10,color:C.mt}}>Margen (%)</span>
                    <input style={S.input} inputMode="decimal" value={F.margen||''} placeholder="15"
                      onChange={e=>set('margen',e.target.value)}/></label>
                  <label style={{flex:'1 1 130px'}}><span style={{fontSize:10,color:C.mt}}>o precio cerrado (€)</span>
                    <input style={S.input} inputMode="decimal" value={F.precioFijo||''} placeholder="—"
                      onChange={e=>set('precioFijo',e.target.value)}/></label>
                </div>
                <label><span style={{fontSize:10,color:C.mt}}>Cómo va</span>
                  <select style={S.select} value={F.estado||'detectado'} onChange={e=>set('estado',e.target.value)}>
                    {Object.entries(ESTADOS_EXTRA).map(([k,v])=><option key={k} value={k}>{v.ic} {v.n}</option>)}
                  </select></label>
              </>)}

              <div style={{display:'flex',gap:8}}>
                <button style={{...S.btn(C.sc),flex:1,opacity:String(F.concepto||'').trim()?1:.5}}
                  disabled={!String(F.concepto||'').trim()}
                  onClick={()=>{
                    const {_contrato,_nuevo,_facturas,_abierto,...limpio}=F;
                    guardarExtra(_contrato,limpio);
                    setExtraForm(null);
                    setExtraAbierto(limpio.id);
                    notify('➕ Gasto adicional guardado');
                  }}>Guardar</button>
                <button style={S.ghost} onClick={()=>setExtraForm(null)}>Cancelar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ GASTOS ADICIONALES NO PREVISTOS ═══ */}
      {verExtras&&(()=>{
        const C0=verExtras;
        const ex=extrasDeContrato(C0);
        const R=resumenExtras(C0,invoices);
        // Facturas de esta obra que aún no están en ningún extra
        const yaPuestas=new Set(ex.flatMap(x=>(x.facturas||[]).map(String)));
        const candidatas=(invoices||[]).filter(f=>f&&!esAnulada(f)&&f.tipo!=='emitida'
          &&normProvNombre(f.obra||'')===normProvNombre(C0.obra||'')&&!yaPuestas.has(String(f.id)));
        return(
          <div style={S.overlay} onClick={avisarCerrar}>
            <div style={{...S.modal,maxWidth:580}} onClick={e=>e.stopPropagation()}>
              <div style={{...S.cabModal,display:'flex',alignItems:'center',gap:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14}}>➕ Gastos adicionales no previstos</div>
                  <div style={{fontSize:11,color:C.mt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {C0.numero||''}{C0.obra?' · '+C0.obra:''}
                  </div>
                </div>
                <button style={{background:'transparent',border:'none',cursor:'pointer',color:C.mt,fontSize:20,lineHeight:1,padding:'0 4px'}} onClick={()=>{setVerExtras(null);setExtraForm(null);}}>✕</button>
              </div>

              {/* ── ASIGNAR UNA FACTURA MARCADA ── */}
              {/* Se eligen del desplegable. Solo salen las que NO son ya extra
                  de ningún contrato: el mismo gasto no puede cobrarse dos veces. */}
              {(()=>{
                const esperan=extrasSinAsignar(C0,invoices,contratos);
                if(!esperan.length)return null;
                const tot=+esperan.reduce((s,f)=>s+(baseFactura(f)),0).toFixed(2);
                const sel=(asignar&&asignar.facturaId)||'';
                const f0=esperan.find(f=>String(f.id)===sel);
                return(
                  <div style={{background:C.wn+'12',border:`1px solid ${C.wn}55`,borderRadius:9,padding:'10px 12px',marginBottom:10}}>
                    <div style={{fontSize:11.5,fontWeight:700,color:C.wn,marginBottom:6}}>
                      ⏳ {esperan.length} factura{esperan.length!==1?'s':''} marcada{esperan.length!==1?'s':''} como extra · {fmt(tot)} €
                    </div>
                    <select style={{...S.select,fontSize:16,marginBottom:8}} value={sel}
                      onChange={e=>setAsignar(e.target.value?{facturaId:e.target.value,destino:'',tratado:''}:null)}>
                      <option value="">— elige una factura para asignarla —</option>
                      {esperan.map(f=>(
                        <option key={f.id} value={f.id}>
                          {f.proveedor} · {fmt(baseFactura(f))} € · {f.numFactura||'sin nº'}
                        </option>
                      ))}
                    </select>

                    {f0&&(<>
                      {f0.concepto&&<div style={{fontSize:10.5,color:C.mt,marginBottom:8,lineHeight:1.45}}>{f0.concepto}</div>}

                      <div style={{fontSize:10,color:C.mt,marginBottom:4}}>¿A QUÉ GASTO?</div>
                      <select style={{...S.select,fontSize:16,marginBottom:8}} value={(asignar&&asignar.destino)||''}
                        onChange={e=>setAsignar(a=>({...a,destino:e.target.value}))}>
                        <option value="">— elige —</option>
                        {ex.map(x=><option key={x.id} value={x.id}>{x.concepto||'(sin concepto)'}</option>)}
                        <option value="__nuevo">➕ Un gasto nuevo</option>
                      </select>

                      <div style={{fontSize:10,color:C.mt,marginBottom:4}}>¿YA LO HAS HABLADO CON EL PROMOTOR?</div>
                      <div style={{display:'flex',gap:6,marginBottom:9,flexWrap:'wrap'}}>
                        {[['si','✅ Sí, ya está tratado'],['no','⏳ Todavía no']].map(([k,l])=>(
                          <button key={k} style={{padding:'7px 11px',borderRadius:9,fontSize:11,cursor:'pointer',flex:'1 1 120px',
                            border:`1px solid ${asignar.tratado===k?C.in:C.bd}`,
                            background:asignar.tratado===k?C.in+'22':'transparent',
                            color:asignar.tratado===k?C.in:C.mt,fontWeight:asignar.tratado===k?700:500}}
                            onClick={()=>setAsignar(a=>({...a,tratado:k}))}>{l}</button>
                        ))}
                      </div>

                      <button style={{...S.btn(C.sc),width:'100%',
                        opacity:(asignar.destino&&asignar.tratado)?1:.5}}
                        disabled={!asignar.destino||!asignar.tratado}
                        onClick={()=>{
                          const estado=asignar.tratado==='si'?'presentado':'detectado';
                          if(asignar.destino==='__nuevo'){
                            // Se abre el formulario con la factura ya marcada
                            setExtraForm({id:'ex-'+Date.now().toString(36),concepto:'',causa:'',
                              quienLoPide:'',fechaDeteccion:today,estado,prueba:'',margen:'',precioFijo:'',
                              facturas:[String(f0.id)],_contrato:C0.id,_nuevo:true});
                          }else{
                            const x=ex.find(y=>y.id===asignar.destino);
                            if(x)guardarExtra(C0.id,{...x,estado,
                              facturas:[...(x.facturas||[]).map(String),String(f0.id)]});
                            notify('➕ Factura asignada al gasto');
                          }
                          setAsignar(null);
                        }}>Asignar</button>
                    </>)}
                  </div>
                );
              })()}

              {ex.length===0&&(
                <div style={{background:C.in+'12',border:`1px solid ${C.in}40`,borderRadius:9,padding:'10px 12px',marginBottom:10,fontSize:11,color:C.mt,lineHeight:1.55}}>
                  Aquí se guarda lo que gastas en esta obra y <b style={{color:C.tx}}>no entra en el precio cerrado</b>,
                  para negociarlo después con el promotor.
                  <div style={{marginTop:6}}>
                    Con precio cerrado solo se puede cobrar de más si hubo un cambio que aumentó la obra
                    <b style={{color:C.tx}}> y el promotor lo autorizó</b>. Por eso lo importante no es la suma:
                    es tener anotado quién lo pidió, cuándo, y con qué prueba.
                  </div>
                </div>
              )}

              {ex.length>0&&(
                <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
                  <div style={{...S.card,flex:'1 1 110px',padding:'8px 10px'}}>
                    <div style={{fontSize:10,color:C.mt}}>Gastado de más</div>
                    <div style={{fontSize:17,fontWeight:800,color:C.dn}}>{fmt(R.coste)} €</div>
                  </div>
                  <div style={{...S.card,flex:'1 1 110px',padding:'8px 10px'}}>
                    <div style={{fontSize:10,color:C.mt}}>A pedir al promotor</div>
                    <div style={{fontSize:17,fontWeight:800,color:C.sc}}>{fmt(R.precio)} €</div>
                  </div>
                  <div style={{...S.card,flex:'1 1 110px',padding:'8px 10px'}}>
                    <div style={{fontSize:10,color:C.mt}}>Sin cerrar</div>
                    <div style={{fontSize:17,fontWeight:800,color:C.wn}}>{fmt(R.pendientes)} €</div>
                  </div>
                </div>
              )}

              {R.sinRespaldo>0&&(
                <div style={{background:C.dn+'14',border:`1px solid ${C.dn}55`,borderRadius:9,padding:'9px 11px',marginBottom:10,fontSize:11,color:C.dn,lineHeight:1.5}}>
                  ⚠ <b>{fmt(R.sinRespaldo)} € gastados sin nada por escrito.</b>
                  <div style={{fontSize:10,color:C.mt,marginTop:3}}>
                    De palabra también vale, pero hay que probarlo. Un correo diciendo
                    «según lo hablado, ejecutamos X por Y €» y su respuesta ya es prueba.
                  </div>
                </div>
              )}

              {/* ── TOTAL POR PROVEEDOR ── */}
              {/* Lo pidió así: el contrato totaliza por proveedor, y al tocar
                  uno se ven sus facturas con lo que hay que saber de cada una. */}
              {(()=>{
                const provs=proveedoresDeExtras(C0,invoices);
                if(!provs.length)return null;
                return(
                  <div style={{marginBottom:10}}>
                    <div style={{fontSize:11,fontWeight:700,color:C.mt,marginBottom:5}}>POR PROVEEDOR</div>
                    {provs.map(p=>{
                      const ab=provAbierto===p.proveedor;
                      return(
                        <div key={p.proveedor} style={{background:C.bg,borderRadius:9,marginBottom:5,overflow:'hidden'}}>
                          <div style={{padding:'9px 11px',cursor:'pointer',display:'flex',justifyContent:'space-between',gap:8,alignItems:'center'}}
                            onClick={()=>setProvAbierto(a=>a===p.proveedor?'':p.proveedor)}>
                            <b style={{fontSize:12,flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                              🏢 {p.proveedor}
                            </b>
                            <span style={{fontSize:10,color:C.mt,flexShrink:0}}>{p.facturas.length} fra</span>
                            <b style={{fontSize:13,flexShrink:0}}>{fmt(p.total)} €</b>
                            <span style={{fontSize:11,color:C.mt,flexShrink:0}}>{ab?'▴':'▾'}</span>
                          </div>
                          {ab&&(
                            <div style={{padding:'0 11px 10px',borderTop:`1px solid ${C.bd}66`}}>
                              {p.facturas.map(f=>{
                                const E=ESTADOS_EXTRA[f._estado]||ESTADOS_EXTRA.detectado;
                                return(
                                  <div key={f.id} style={{padding:'7px 0',borderBottom:`1px solid ${C.bd}44`}}>
                                    <div style={{display:'flex',justifyContent:'space-between',gap:8}}>
                                      <span style={{fontSize:11.5,fontWeight:700,flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                        {f.numFactura||'(sin nº)'} · {fmtDate(f.fecha)}
                                      </span>
                                      <b style={{fontSize:11.5,flexShrink:0}}>{fmt(baseFactura(f))} €</b>
                                    </div>
                                    {f.concepto&&<div style={{fontSize:10.5,color:C.mt,marginTop:2,lineHeight:1.4}}>{f.concepto}</div>}
                                    <div style={{fontSize:10,marginTop:3,display:'flex',gap:8,flexWrap:'wrap'}}>
                                      <span style={{color:C.mt}}>Gasto: <b style={{color:C.tx}}>{f._gasto}</b></span>
                                      <span style={{color:C[E.c]||C.mt,fontWeight:700}}>{E.ic} {E.n}</span>
                                      {f._prueba&&f._prueba!=='ninguna'
                                        ?<span style={{color:C.mt}}>{PRUEBAS_EXTRA[f._prueba]}</span>
                                        :<span style={{color:C.dn}}>⚠ sin nada por escrito</span>}
                                    </div>
                                    {f.notas&&<div style={{fontSize:10,color:C.mt,marginTop:2,fontStyle:'italic'}}>{f.notas}</div>}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* ── LISTA DE GASTOS ── */}
              <div style={{maxHeight:340,overflowY:'auto',marginBottom:10}}>
                {ex.map(x=>{
                  const co=costeExtra(x,invoices), pr=precioExtra(x,invoices);
                  const E=ESTADOS_EXTRA[x.estado||'detectado']||ESTADOS_EXTRA.detectado;
                  const col=C[E.c]||C.mt;
                  const abierto=extraAbierto===x.id;
                  const provs=extraPorProveedor(x,invoices);
                  return(
                    <div key={x.id} style={{background:C.bg,borderRadius:9,marginBottom:6,
                      borderLeft:`3px solid ${col}`,overflow:'hidden'}}>
                      <div style={{padding:'9px 11px',cursor:'pointer'}}
                        onClick={()=>setExtraAbierto(a=>a===x.id?'':x.id)}>
                        <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'baseline'}}>
                          <b style={{fontSize:12.5,flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {E.ic} {x.concepto||'(sin concepto)'}
                          </b>
                          <span style={{fontSize:13,fontWeight:800,flexShrink:0}}>{fmt(pr)} €</span>
                        </div>
                        <div style={{fontSize:10,color:C.mt,marginTop:2,display:'flex',justifyContent:'space-between',gap:8}}>
                          <span>
                            <span style={{color:col,fontWeight:700}}>{E.n}</span>
                            {x.quienLoPide?' · lo pidió '+x.quienLoPide:''}
                            {x.prueba&&x.prueba!=='ninguna'?' · '+PRUEBAS_EXTRA[x.prueba]:''}
                          </span>
                          <span style={{flexShrink:0}}>
                            coste {fmt(co)} € · {(x.facturas||[]).length} fra · {abierto?'▴':'▾'}
                          </span>
                        </div>
                        {(!x.prueba||x.prueba==='ninguna')&&x.estado!=='rechazado'&&co>0&&(
                          <div style={{fontSize:10,color:C.dn,marginTop:3}}>⚠ sin nada que lo respalde</div>
                        )}
                      </div>

                      {abierto&&(
                        <div style={{padding:'0 11px 11px',borderTop:`1px solid ${C.bd}66`}}>
                          {x.causa&&<div style={{fontSize:11,color:C.mt,margin:'8px 0',lineHeight:1.5}}>{x.causa}</div>}

                          {/* ── POR PROVEEDOR, que es como lo quería ver ── */}
                          {provs.length===0&&<div style={{fontSize:11,color:C.mt,marginTop:8}}>Todavía sin facturas imputadas.</div>}
                          {provs.map(p=>(
                            <div key={p.proveedor} style={{marginTop:8}}>
                              <div style={{display:'flex',justifyContent:'space-between',gap:8,fontSize:11.5,fontWeight:700}}>
                                <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>🏢 {p.proveedor}</span>
                                <span style={{flexShrink:0}}>{fmt(p.total)} €</span>
                              </div>
                              {p.facturas.map(f=>(
                                <div key={f.id} style={{display:'flex',justifyContent:'space-between',gap:8,
                                  fontSize:10.5,color:C.mt,padding:'3px 0 3px 14px'}}>
                                  <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                    {f.numFactura||'(sin nº)'} · {fmtDate(f.fecha)}
                                    {f.concepto?' · '+String(f.concepto).slice(0,32):''}
                                  </span>
                                  <span style={{flexShrink:0}}>{fmt(baseFactura(f))} €</span>
                                  {!esLector()&&<button style={{background:'transparent',border:'none',color:C.dn,cursor:'pointer',fontSize:11,padding:0,flexShrink:0}}
                                    title="Quitar de este extra"
                                    onClick={()=>alternarFacturaExtra(C0.id,x.id,f.id)}>✕</button>}
                                </div>
                              ))}
                            </div>
                          ))}

                          {!esLector()&&(
                            <div style={{display:'flex',gap:6,marginTop:10,flexWrap:'wrap'}}>
                              <button style={{...S.sm(C.in),fontSize:10.5,padding:'6px 10px',minHeight:0,width:'auto'}}
                                onClick={()=>setExtraForm({...x,_contrato:C0.id})}>✏️ Editar</button>
                              <button style={{...S.sm(C.vt),fontSize:10.5,padding:'6px 10px',minHeight:0,width:'auto'}}
                                onClick={()=>{
                                  const lin=[`SOLICITUD DE APROBACIÓN DE TRABAJOS ADICIONALES`,'',
                                    `Obra: ${C0.obra||''}`,`Contrato: ${C0.numero||''}`,
                                    `Fecha: ${fmtDate(today)}`,'',
                                    `CONCEPTO: ${x.concepto||''}`,'',
                                    `Causa: ${x.causa||'—'}`,
                                    x.quienLoPide?`Solicitado por: ${x.quienLoPide}`:'',
                                    x.fechaDeteccion?`Detectado el: ${fmtDate(x.fechaDeteccion)}`:'','',
                                    `DESGLOSE`,
                                    ...provs.map(p=>`  ${p.proveedor}: ${fmt(p.total)} €`),
                                    `  ─────`,`  Coste: ${fmt(co)} €`,'',
                                    `IMPORTE A APROBAR: ${fmt(pr)} € (IVA no incluido)`,'',
                                    `Estos trabajos no están incluidos en el precio cerrado del contrato.`,
                                    `Rogamos confirmación por escrito antes de continuar, o en su caso`,
                                    `la conformidad a lo ya ejecutado.`].filter(l=>l!=='');
                                  const t=lin.join('\n');
                                  try{navigator.clipboard.writeText(t);notify('📄 Copiado: pégalo en un correo');}
                                  catch(e){notify('No se pudo copiar','error');}
                                }}>📄 Texto para el promotor</button>
                              <BtnConfirm style={{...S.sm(C.dn),fontSize:10.5,padding:'6px 10px',minHeight:0,width:'auto'}}
                                armStyle={{...S.sm(C.dn),fontSize:10.5,padding:'6px 10px',minHeight:0,width:'auto',fontWeight:800}}
                                armedLabel="¿Seguro?" onConfirm={()=>borrarExtra(C0.id,x.id)}>🗑</BtnConfirm>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!esLector()&&(
                <button style={{...S.btn(C.sc),width:'100%'}} onClick={()=>setExtraForm({
                  id:'ex-'+Date.now().toString(36), concepto:'', causa:'', quienLoPide:'',
                  fechaDeteccion:today, estado:'detectado', prueba:'', margen:'', precioFijo:'',
                  facturas:[], _contrato:C0.id, _nuevo:true,
                })}>➕ Anotar un gasto adicional</button>
              )}
              {candidatas.length>0&&(
                <div style={{fontSize:10,color:C.mt,marginTop:8,lineHeight:1.45}}>
                  Hay {candidatas.length} factura{candidatas.length!==1?'s':''} de esta obra sin imputar a ningún extra.
                  Si alguna es un adicional, anótalo y márcala dentro.
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ═══ COPIAR SEGUROS DE VEHÍCULO A PÓLIZAS ═══ */}
      {copiarSeg&&(()=>{
        const marcados=copiarSeg.filter(v=>v.sel&&!v.yaEsta);
        const coste=marcados.reduce((s,v)=>s+(parseNum(v.prima)||0),0);
        const yaCopiados=copiarSeg.filter(v=>v.yaEsta).length;
        // Duplicados que quedarían al añadir los marcados
        const futuras=[...(polizas||[]),...marcados.map(polizaDeVehiculo)];
        const dup=riesgosDuplicados(futuras);
        const marcar=(id,val)=>setCopiarSeg(l=>l.map(v=>v.id===id?{...v,sel:val}:v));
        return(
          <div style={S.overlay} onClick={avisarCerrar}>
            <div style={{...S.modal,maxWidth:540}} onClick={e=>e.stopPropagation()}>
              <div style={{...S.cabModal,display:'flex',alignItems:'center',gap:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14}}>🛡️ Copiar seguros a pólizas</div>
                  <div style={{fontSize:11,color:C.mt}}>Elige qué vehículos quieres llevar</div>
                </div>
                <button style={{background:'transparent',border:'none',cursor:'pointer',color:C.mt,fontSize:20,lineHeight:1,padding:'0 4px'}} onClick={()=>setCopiarSeg(null)}>✕</button>
              </div>

              <div style={{background:C.in+'12',border:`1px solid ${C.in}40`,borderRadius:9,padding:'9px 11px',marginBottom:9,fontSize:10.5,color:C.mt,lineHeight:1.5}}>
                El seguro pasa a ser una póliza con su matrícula, compañía, prima y vencimiento.
                El vehículo <b style={{color:C.tx}}>no se toca</b>: conserva su ITV y su mantenimiento.
                Vienen marcados los de alta que aún no se han copiado.
              </div>

              <div style={{display:'flex',gap:6,marginBottom:8,flexWrap:'wrap',alignItems:'center'}}>
                <button style={{...S.sm(C.in),fontSize:10,padding:'5px 10px',minHeight:0}}
                  onClick={()=>setCopiarSeg(l=>l.map(v=>({...v,sel:!v.yaEsta})))}>Marcar todos</button>
                <button style={{...S.sm(C.mt),fontSize:10,padding:'5px 10px',minHeight:0}}
                  onClick={()=>setCopiarSeg(l=>l.map(v=>({...v,sel:false})))}>Ninguno</button>
                <button style={{...S.sm(C.mt),fontSize:10,padding:'5px 10px',minHeight:0}}
                  onClick={()=>setCopiarSeg(l=>l.map(v=>({...v,sel:!v.yaEsta&&v.activa})))}>Solo los de alta</button>
                <span style={{flex:1}}/>
                <span style={{fontSize:11,fontWeight:700,color:marcados.length?C.sc:C.mt}}>
                  {marcados.length} marcado{marcados.length!==1?'s':''}
                </span>
              </div>

              {marcados.length>0&&(
                <div style={{...S.card,padding:'8px 10px',marginBottom:8}}>
                  <div style={{fontSize:10,color:C.mt}}>Prima anual de lo marcado</div>
                  <div style={{fontSize:17,fontWeight:800}}>{fmt(coste)} €</div>
                </div>
              )}
              {dup.length>0&&(
                <div style={{background:C.wn+'14',border:`1px solid ${C.wn}55`,borderRadius:9,padding:'8px 10px',marginBottom:8,fontSize:10.5,color:C.wn}}>
                  ⚠ Quedarían {dup.length} matrícula{dup.length!==1?'s':''} con dos seguros: {dup.map(d=>d.objeto).join(', ')}.
                  <div style={{fontSize:10,color:C.mt,marginTop:2}}>Saldrán marcadas con el triángulo para que decidas cuál dar de baja.</div>
                </div>
              )}

              <div style={{maxHeight:280,overflowY:'auto',marginBottom:10}}>
                {copiarSeg.map(v=>(
                  <label key={v.id} style={{display:'flex',alignItems:'flex-start',gap:9,
                    background:C.bg,borderRadius:8,padding:'8px 10px',marginBottom:5,
                    cursor:v.yaEsta?'default':'pointer',opacity:v.yaEsta?.55:(v.activa?1:.75)}}>
                    <input type="checkbox" checked={v.sel&&!v.yaEsta} disabled={v.yaEsta}
                      style={{width:19,height:19,flexShrink:0,marginTop:1,accentColor:C.sc}}
                      onChange={e=>marcar(v.id,e.target.checked)}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',justifyContent:'space-between',gap:8}}>
                        <b style={{fontSize:12,flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          🚗 {v.matricula||'(sin matrícula)'}{v.alias?' · '+v.alias:''}
                        </b>
                        <span style={{fontSize:12,fontWeight:700,flexShrink:0}}>{v.prima?fmt(v.prima)+' €':'—'}</span>
                      </div>
                      <div style={{fontSize:10,color:C.mt}}>
                        {v.cia||'sin compañía'}{v.vto?' · vence '+fmtDate(v.vto):' · sin vencimiento'}
                        {v.empresa&&v.empresa!=='BIG'?' · '+v.empresa:''}
                      </div>
                      {v.yaEsta&&<div style={{fontSize:10,color:C.sc,fontWeight:700}}>✓ ya está en pólizas</div>}
                      {v.estabaDeBaja&&<div style={{fontSize:10,color:C.in,fontWeight:700}}>↩ estaba dada de baja · al copiar se recupera</div>}
                      {!v.activa&&!v.yaEsta&&<div style={{fontSize:10,color:C.mt}}>vehículo de baja</div>}
                    </div>
                  </label>
                ))}
              </div>

              <div style={{display:'flex',gap:8}}>
                <button style={{...S.btn(C.sc),flex:1,opacity:marcados.length?1:.5}} disabled={!marcados.length}
                  onClick={()=>{
                    const nuevas=marcados.map(polizaDeVehiculo);
                    // Si esa póliza ya existía dada de baja, se REVIVE en vez de
                    // añadir otra: comparten identificador y quedarían dos.
                    const ids=new Set(nuevas.map(p=>p.id));
                    const resto=(polizas||[]).filter(p=>!(p&&ids.has(p.id)));
                    persistPolizas([...resto,...nuevas]);
                    setCopiarSeg(null);
                    setFlotaView('polizas');
                    notify(`🛡️ ${nuevas.length} seguro${nuevas.length!==1?'s':''} copiado${nuevas.length!==1?'s':''} a pólizas`);
                  }}>🛡️ Copiar {marcados.length||''}</button>
                <button style={S.ghost} onClick={()=>setCopiarSeg(null)}>Cancelar</button>
              </div>
              {yaCopiados>0&&(
                <div style={{fontSize:10,color:C.mt,marginTop:7,lineHeight:1.4}}>
                  {yaCopiados} ya {yaCopiados===1?'estaba':'estaban'} en pólizas y no se {yaCopiados===1?'puede':'pueden'} volver a copiar, para no duplicarlos.
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ═══ IMPORTAR PÓLIZAS ═══ */}
      {polImport&&(()=>{
        const nuevas=polImport.polizas;
        // Se avisa de lo que ya existe: importar dos veces el mismo archivo no
        // debe llenar la lista de duplicados sin que nadie se entere.
        const yaHay=nuevas.filter(n=>(polizas||[]).some(p=>p&&p.activa!==false&&claveRiesgo(p)&&claveRiesgo(p)===claveRiesgo(n)));
        const coste=nuevas.reduce((s,p)=>s+primaAnual(p),0);
        const sinFecha=nuevas.filter(p=>!p.vto).length;
        return(
          <div style={S.overlay} onClick={avisarCerrar}>
            <div style={{...S.modal,maxWidth:540}} onClick={e=>e.stopPropagation()}>
              <div style={{...S.cabModal,display:'flex',alignItems:'center',gap:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14}}>📥 Importar pólizas</div>
                  <div style={{fontSize:11,color:C.mt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{polImport.nombre}</div>
                </div>
                <button style={{background:'transparent',border:'none',cursor:'pointer',color:C.mt,fontSize:20,lineHeight:1,padding:'0 4px'}} onClick={()=>setPolImport(null)}>✕</button>
              </div>

              <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
                <div style={{...S.card,flex:'1 1 130px',padding:'8px 10px'}}>
                  <div style={{fontSize:10,color:C.mt}}>Pólizas en el archivo</div>
                  <div style={{fontSize:17,fontWeight:800}}>{nuevas.length}</div>
                </div>
                <div style={{...S.card,flex:'1 1 130px',padding:'8px 10px'}}>
                  <div style={{fontSize:10,color:C.mt}}>Coste anual</div>
                  <div style={{fontSize:17,fontWeight:800}}>{fmt(coste)} €</div>
                </div>
              </div>

              {yaHay.length>0&&(
                <div style={{background:C.wn+'14',border:`1px solid ${C.wn}55`,borderRadius:9,padding:'8px 10px',marginBottom:8,fontSize:11,color:C.wn}}>
                  ⚠ {yaHay.length} ya existe{yaHay.length!==1?'n':''} con el mismo ramo y objeto. Se añadirán igual y quedarán marcadas como riesgo duplicado.
                </div>
              )}
              {sinFecha>0&&(
                <div style={{background:C.in+'12',border:`1px solid ${C.in}40`,borderRadius:9,padding:'8px 10px',marginBottom:8,fontSize:10.5,color:C.mt}}>
                  {sinFecha} sin fecha de vencimiento: entrarán igual, pero no saldrán en los avisos ni en la previsión de tesorería hasta que se la pongas.
                </div>
              )}
              {polImport.avisos.length>0&&(
                <div style={{background:C.bg,borderRadius:9,padding:'8px 10px',marginBottom:8,fontSize:10,color:C.mt,maxHeight:90,overflowY:'auto'}}>
                  {polImport.avisos.slice(0,12).map((a,i)=><div key={i}>· {a}</div>)}
                </div>
              )}

              <div style={{maxHeight:230,overflowY:'auto',marginBottom:10}}>
                {nuevas.map((p,i)=>(
                  <div key={i} style={{background:C.bg,borderRadius:8,padding:'7px 10px',marginBottom:5,fontSize:11}}>
                    <div style={{display:'flex',justifyContent:'space-between',gap:8}}>
                      <b style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {(RAMOS[p.ramo]||{}).ic||'📄'} {p.objeto||'(sin identificar)'}
                      </b>
                      <span style={{flexShrink:0,fontWeight:700}}>{p.prima?fmt(p.prima)+' €':'—'}</span>
                    </div>
                    <div style={{fontSize:10,color:C.mt}}>
                      {(RAMOS[p.ramo]||{}).n||p.ramo} · {p.cia||'sin compañía'}
                      {p.vto?' · vence '+fmtDate(p.vto):' · sin vencimiento'}
                      {p.empresa&&p.empresa!=='BIG'?' · '+p.empresa:''}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{display:'flex',gap:8}}>
                <button style={{...S.btn(C.sc),flex:1}} onClick={()=>{
                  const conId=nuevas.map((p,i)=>({...p,id:'pol-imp-'+Date.now().toString(36)+'-'+i}));
                  persistPolizas([...(polizas||[]),...conId]);
                  setPolImport(null);
                  notify(`🛡️ ${conId.length} póliza${conId.length!==1?'s':''} importada${conId.length!==1?'s':''}`);
                }}>📥 Importar las {nuevas.length}</button>
                <button style={S.ghost} onClick={()=>setPolImport(null)}>Cancelar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ EXPEDIENTE PARA LA NOTARÍA ═══ */}
      {expNotaria&&(()=>{
        const E=expNotaria, exp=E.exp;
        return(
          <div style={S.overlay} onClick={avisarCerrar}>
            <div style={{...S.modal,maxWidth:520}} onClick={e=>e.stopPropagation()}>
              <div style={{...S.cabModal,display:'flex',alignItems:'flex-start',gap:8,marginBottom:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14}}>📦 Expediente para notaría</div>
                  <div style={{fontSize:11,color:C.mt}}>
                    {exp.contrato&&(exp.contrato.numero||exp.contrato.obra)
                      ? `${exp.contrato.numero||''}${exp.contrato.obra?' · '+exp.contrato.obra:''}`
                      : E.nombre}
                  </div>
                  {exp.titulares.length>1&&(
                    <div style={{fontSize:10,color:C.vt,fontWeight:700}}>
                      👥 {exp.titulares.length} titulares en un solo envío
                    </div>
                  )}
                </div>
                <button style={{background:'transparent',border:'none',cursor:'pointer',color:C.mt,fontSize:20,lineHeight:1,padding:'0 4px'}} onClick={()=>!expBusy&&setExpNotaria(null)}>✕</button>
              </div>

              <div style={{background:C.in+'12',border:`1px solid ${C.in}40`,borderRadius:9,padding:'9px 11px',marginBottom:10,fontSize:10.5,color:C.mt,lineHeight:1.5}}>
                Se arma <b style={{color:C.tx}}>ahora</b>, con lo que haya en este momento, y no se guarda en ninguna parte.
                Así nunca está desactualizado ni se queda una copia fuera del control de plazos.
              </div>

              <div style={{fontSize:11,fontWeight:700,color:C.mt,marginBottom:5}}>QUÉ VA DENTRO</div>
              {exp.titulares.map((t,i)=>(
                <div key={i} style={{background:C.bg,borderRadius:8,padding:'7px 10px',marginBottom:5,fontSize:11}}>
                  <div style={{fontWeight:700}}>
                    {t.principal?'👤 ':'👥 '}{t.nombre||'(sin nombre)'}
                    {!t.conFicha&&<span style={{fontSize:9,color:C.wn,fontWeight:400}}> · sin ficha de cliente</span>}
                  </div>
                  <div style={{fontSize:10,color:C.mt}}>
                    {t.dni||'⚠ sin DNI'}{t.estadoCivil?' · '+t.estadoCivil:''}{t.regimen?' · '+t.regimen:''}
                    {t.nacimiento?' · '+fmtDate(t.nacimiento):''}
                  </div>
                  {(()=>{
                    const suyas=exp.imagenes.filter(d=>normProvNombre(d.nombreTitular)===normProvNombre(t.nombre)
                      ||normProvNombre(d.cliente)===normProvNombre(t.nombre));
                    return(
                      <div style={{fontSize:10,color:suyas.length?C.vt:C.wn,marginTop:2}}>
                        🪪 {suyas.length?`${suyas.length} imagen${suyas.length!==1?'es':''} de DNI`:'sin copia de DNI'}
                      </div>
                    );
                  })()}
                </div>
              ))}
              <div style={{fontSize:11,color:exp.imagenes.length?C.vt:C.wn,marginBottom:10}}>
                🪪 {exp.imagenes.length} imagen{exp.imagenes.length!==1?'es':''} de DNI{exp.imagenes.length?'':' — no hay ninguna guardada'}
              </div>

              {exp.problemas.length>0&&(
                <div style={{background:(exp.puede?C.wn:C.dn)+'14',border:`1px solid ${(exp.puede?C.wn:C.dn)}55`,borderRadius:9,padding:'8px 10px',marginBottom:10,fontSize:10.5,color:exp.puede?C.wn:C.dn,lineHeight:1.5}}>
                  {exp.problemas.map((p,i)=><div key={i}>⚠ {p}</div>)}
                </div>
              )}

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <label><span style={{fontSize:10,color:C.mt}}>🏛 Notaría</span>
                  <input style={S.input} value={E.notaria.nombre}
                    onChange={e=>setExpNotaria(p=>({...p,notaria:{...p.notaria,nombre:e.target.value}}))}
                    placeholder="Notaría de Illescas"/></label>
                <label><span style={{fontSize:10,color:C.mt}}>Correo *</span>
                  <input style={S.input} type="email" inputMode="email" autoCapitalize="off" value={E.notaria.email}
                    onChange={e=>setExpNotaria(p=>({...p,notaria:{...p.notaria,email:e.target.value.trim()}}))}
                    placeholder="notaria@ejemplo.es"/></label>
              </div>
              {E.notaria.email&&!emailValido(E.notaria.email)&&<div style={{fontSize:10,color:C.wn,marginBottom:6}}>⚠ Ese correo no parece válido</div>}
              {(E.notaria.nombre!==(E.ficha.notariaNombre||'')||E.notaria.email!==(E.ficha.notariaEmail||''))&&(
                <div style={{fontSize:10,color:C.in,marginBottom:8}}>Se guardará en su ficha para la próxima vez</div>
              )}

              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',margin:'4px 0 6px'}}>
                <input type="checkbox" checked={E.proteger} style={{width:18,height:18,accentColor:C.sc}}
                  onChange={e=>setExpNotaria(p=>({...p,proteger:e.target.checked}))}/>
                <span style={{fontSize:11.5}}>Proteger el zip con contraseña <span style={{color:C.mt,fontSize:10}}>— opcional</span></span>
              </label>

              {E.proteger&&(
                <div style={{background:C.bg,borderRadius:9,padding:'9px 11px',marginBottom:8}}>
                  <div style={{fontSize:10,color:C.mt,marginBottom:3}}>Contraseña — mándasela por otra vía (WhatsApp o teléfono), nunca en el mismo correo</div>
                  <div style={{display:'flex',gap:6,alignItems:'center'}}>
                    <div style={{flex:1,fontFamily:'monospace',fontSize:15,fontWeight:700,letterSpacing:'.06em'}}>{E.clave}</div>
                    <button style={{...S.sm(C.in),padding:'5px 10px',fontSize:10,minHeight:0}}
                      onClick={()=>{try{navigator.clipboard.writeText(E.clave);notify('Contraseña copiada');}catch(e){}}}>📋</button>
                    <button style={{...S.sm(C.mt),padding:'5px 10px',fontSize:10,minHeight:0}}
                      onClick={()=>setExpNotaria(p=>({...p,clave:claveExpediente()}))}>🎲</button>
                  </div>
                  <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',marginTop:8}}>
                    <input type="checkbox" checked={E.fuerte} style={{width:16,height:16,accentColor:C.wn}}
                      onChange={e=>setExpNotaria(p=>({...p,fuerte:e.target.checked}))}/>
                    <span style={{fontSize:10,color:C.mt,lineHeight:1.4}}>
                      Cifrado fuerte (AES-256). <b style={{color:C.wn}}>Solo si la notaría tiene 7-Zip o similar</b>:
                      el descompresor de Windows y el de Mac no abren estos zips ni con la clave correcta.
                    </span>
                  </label>
                  {!E.fuerte&&(
                    <div style={{fontSize:9.5,color:C.mt,marginTop:5,lineHeight:1.4}}>
                      Con el cifrado clásico lo abre cualquiera con la clave. No es criptografía seria,
                      pero evita lo que de verdad pasa: un correo mal dirigido o reenviado sin pensar.
                    </div>
                  )}
                </div>
              )}

              <div style={{display:'flex',gap:6,marginTop:6,flexWrap:'wrap'}}>
                <button style={{...S.btn(C.sc),flex:'1 1 160px',opacity:(!exp.puede||expBusy)?.5:1}}
                  disabled={!exp.puede||expBusy}
                  onClick={async()=>{
                    // La notaría se guarda en la ficha: la próxima vez ya está
                    if(E.notaria.nombre!==(E.ficha.notariaNombre||'')||E.notaria.email!==(E.ficha.notariaEmail||'')){
                      const base=(cliCat||[]).find(x=>x&&normProvNombre(x.nombre)===normProvNombre(E.nombre))||{nombre:E.nombre};
                      persistCliCat([...(cliCat||[]).filter(x=>x&&normProvNombre(x.nombre)!==normProvNombre(E.nombre)),
                        {...base,notariaNombre:E.notaria.nombre,notariaEmail:E.notaria.email}]);
                    }
                    const r=await generarExpediente({ficha:E.ficha,exp,clave:E.proteger?E.clave:'',fuerte:E.fuerte,notaria:E.notaria});
                    if(r)setExpNotaria(p=>p?{...p,hecho:r}:null);
                  }}>{expBusy?'⏳ Preparando…':'📦 Generar el expediente'}</button>
                {E.notaria.email&&emailValido(E.notaria.email)&&(
                  <button style={{...S.sm(C.in),fontSize:11}} onClick={()=>{
                    const asunto=`Documentación para la escritura · ${E.nombre}`;
                    const cuerpo=[`Buenos días:`,'',
                      `Adjuntamos la documentación de identidad para la escritura de ${E.nombre}`
                        +(exp.contrato&&exp.contrato.obra?` (${exp.contrato.obra})`:'')+`.`,
                      E.proteger?`\nEl archivo va protegido con contraseña; se la hacemos llegar por otra vía.`:'',
                      '','Un saludo,',compCfg.name||marcaDoc()].filter(Boolean).join('\n');
                    try{window.open(`mailto:${encodeURIComponent(E.notaria.email)}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`,'_blank');}
                    catch(e){notify('No se pudo abrir el correo','error');}
                  }}>✉️ Abrir el correo</button>
                )}
              </div>

              {E.hecho&&(
                <div style={{background:C.sc+'12',border:`1px solid ${C.sc}44`,borderRadius:9,padding:'9px 11px',marginTop:9,fontSize:11,color:C.sc}}>
                  ✓ Generado con {E.hecho.n} documento{E.hecho.n!==1?'s':''}. Queda anotada la entrega.
                  {exp.imagenes.length>0&&(
                    <div style={{fontSize:10,color:C.mt,marginTop:4,lineHeight:1.45}}>
                      Cuando se firme la escritura, destruye las copias de DNI desde
                      Ajustes → 🔒 Custodia. Es lo que toca y hoy depende de que te acuerdes.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ═══ SOLICITUD DE DERECHOS: QUÉ SE BORRA Y QUÉ NO ═══ */}
      {verDerecho&&(()=>{
        const d=verDerecho;
        const dias=diasParaResponder(d.recibida);
        const ficha=(cliCat||[]).find(x=>x&&(normProvNombre(x.nombre)===normProvNombre(d.nombre)
          ||normNIF(x.cif)===normNIF(d.dni)))||null;
        const nom=(ficha&&ficha.nombre)||d.nombre;
        const susFac=(invoices||[]).filter(x=>x&&x.tipo==='cobro'&&normProvNombre(x.proveedor)===normProvNombre(nom));
        const susCt=(contratos||[]).filter(c=>c&&normProvNombre(c.cliente)===normProvNombre(nom));
        const plan=planSupresion({ficha:ficha||{nombre:d.nombre},invoices:susFac,contratos:susCt,
          dnis:(ficha&&ficha.nDni)||0,ultimoUso:ultimoUsoCliente(nom,invoices,contratos)});
        const esSupresion=d.tipo==='supresion'||d.tipo==='revocar';
        return(
          <div style={S.overlay} onClick={avisarCerrar}>
            <div style={{...S.modal,maxWidth:540}} onClick={e=>e.stopPropagation()}>
              <div style={{...S.cabModal,display:'flex',alignItems:'flex-start',gap:8,marginBottom:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14}}>⚖️ {d.nombre}</div>
                  <div style={{fontSize:11,color:C.mt}}>{TIPO_DERECHO[d.tipo]||d.tipo}</div>
                </div>
                <button style={{background:'transparent',border:'none',cursor:'pointer',color:C.mt,fontSize:20,lineHeight:1,padding:'0 4px'}} onClick={()=>setVerDerecho(null)}>✕</button>
              </div>

              <div style={{background:(dias!==null&&dias<7?C.dn:C.in)+'14',border:`1px solid ${(dias!==null&&dias<7?C.dn:C.in)}55`,
                borderRadius:9,padding:'9px 11px',marginBottom:10,fontSize:11,color:dias!==null&&dias<7?C.dn:C.tx}}>
                <b>{dias===null?'Sin fecha de entrada':dias<0?`Plazo VENCIDO hace ${-dias} días`:`Quedan ${dias} días para responder`}</b>
                <div style={{fontSize:10,color:C.mt,marginTop:2}}>
                  Recibida el {d.recibida?new Date(d.recibida).toLocaleDateString('es-ES'):'—'} · el plazo legal es de un mes
                </div>
                <div style={{fontSize:10,color:C.mt,marginTop:3}}>
                  {d.dni} · {d.email}{d.telefono?' · '+d.telefono:''}
                </div>
              </div>

              {d.texto&&(
                <div style={{background:C.bg,borderRadius:8,padding:'8px 10px',marginBottom:10,fontSize:11,fontStyle:'italic',color:C.mt}}>
                  «{d.texto}»
                </div>
              )}

              {!ficha&&<div style={{fontSize:11,color:C.wn,marginBottom:9}}>⚠ No encuentro una ficha con ese nombre ni ese NIF. Compruébalo antes de actuar.</div>}

              {esSupresion&&(
                <>
                  <div style={{fontSize:11,fontWeight:700,color:C.sc,marginBottom:5}}>✓ SE PUEDE BORRAR AHORA</div>
                  {plan.borrar.length===0&&<div style={{fontSize:11,color:C.mt,marginBottom:9}}>No hay nada de esto guardado.</div>}
                  {plan.borrar.map((b,i)=>(
                    <div key={i} style={{background:C.sc+'10',borderLeft:`3px solid ${C.sc}`,borderRadius:'0 8px 8px 0',padding:'7px 10px',marginBottom:5}}>
                      <div style={{fontSize:11.5,fontWeight:600}}>{b.que}</div>
                      <div style={{fontSize:10,color:C.mt}}>{b.porque}</div>
                    </div>
                  ))}

                  <div style={{fontSize:11,fontWeight:700,color:C.wn,margin:'12px 0 5px'}}>🔒 HAY QUE CONSERVARLO POR LEY</div>
                  {plan.conservar.length===0&&<div style={{fontSize:11,color:C.sc,marginBottom:9}}>Nada: se puede borrar todo.</div>}
                  {plan.conservar.map((c,i)=>(
                    <div key={i} style={{background:C.wn+'10',borderLeft:`3px solid ${C.wn}`,borderRadius:'0 8px 8px 0',padding:'7px 10px',marginBottom:5}}>
                      <div style={{display:'flex',justifyContent:'space-between',gap:8}}>
                        <div style={{fontSize:11.5,fontWeight:600,flex:1}}>{c.que}</div>
                        <div style={{fontSize:10,color:C.wn,fontWeight:700,flexShrink:0}}>hasta {fmtDate(c.hasta)}</div>
                      </div>
                      <div style={{fontSize:10,color:C.mt}}>{c.porque}</div>
                    </div>
                  ))}

                  {plan.conservar.length>0&&(
                    <div style={{background:C.bg,borderRadius:9,padding:'9px 11px',marginTop:9,fontSize:10.5,color:C.mt,lineHeight:1.5}}>
                      Lo que se conserva queda <b style={{color:C.tx}}>bloqueado</b>: sigue existiendo para Hacienda o para un juez,
                      pero el cliente deja de salir en listados, en cesiones a entidades y en cualquier uso comercial.
                      No es una excusa para no borrar: es lo que manda el artículo 17.3.b del RGPD.
                    </div>
                  )}
                </>
              )}

              <div style={{display:'flex',gap:6,marginTop:12,flexWrap:'wrap'}}>
                {esSupresion&&!esLector()&&(
                  <BtnConfirm style={{...S.btn(C.dn),flex:'1 1 170px'}} armStyle={{background:C.dn,color:'#fff'}}
                    armedLabel="¿Seguro? Ejecutar"
                    onConfirm={async()=>{
                      // Se borra lo que no está amparado y se bloquea el resto
                      if(ficha){
                        const limpia={nombre:ficha.nombre,cif:ficha.cif||'',dir:ficha.dir||'',cp:ficha.cp||'',
                          municipio:ficha.municipio||'',provincia:ficha.provincia||'',
                          bloqueada:true,bloqueadaEn:today,
                          bloqueadaHasta:(plan.conservar[0]||{}).hasta||''};
                        persistCliCat([...(cliCat||[]).filter(x=>x&&normProvNombre(x.nombre)!==normProvNombre(nom)),
                          ...(plan.puedeTodo?[]:[limpia])]);
                      }
                      if(window.bh10Dni){
                        try{const ds=await window.bh10Dni.listar();
                          for(const x of ds.filter(y=>normProvNombre(y.cliente)===normProvNombre(nom)))await window.bh10Dni.borrar(x.id);
                        }catch(e){}
                      }
                      const resumen=plan.puedeTodo
                        ? 'Suprimido todo: no había obligación de conservar nada.'
                        : 'Borrado: '+plan.borrar.map(b=>b.que).join('; ')+'. Bloqueado hasta '+((plan.conservar[0]||{}).hasta||'—')+': '+plan.conservar.map(c=>c.que).join('; ');
                      if(window.bh10Derechos)window.bh10Derechos.resolver(d.id,resumen).catch(()=>{});
                      setDerechos(p=>p.filter(x=>x.id!==d.id));
                      setVerDerecho(null);
                      notify(plan.puedeTodo?'⚖️ Datos suprimidos por completo':'⚖️ Borrado lo que se podía · el resto queda bloqueado');
                    }}>🗑️ Ejecutar la supresión</BtnConfirm>
                )}
                <button style={{...S.sm(C.in),fontSize:11}} onClick={()=>{
                  const l=[`Estimado/a ${d.nombre}:`,'',
                    `En respuesta a su solicitud de ${(TIPO_DERECHO[d.tipo]||'').toLowerCase()} recibida el ${d.recibida?new Date(d.recibida).toLocaleDateString('es-ES'):''}, le informamos de lo siguiente.`,''];
                  if(plan.borrar.length){l.push('Hemos suprimido:');plan.borrar.forEach(b=>l.push('  · '+b.que));l.push('');}
                  if(plan.conservar.length){
                    l.push('Conservamos, por obligación legal (artículo 17.3.b del RGPD), y bloqueados —a disposición únicamente de jueces y Administración—:');
                    plan.conservar.forEach(c=>l.push(`  · ${c.que} — ${c.porque} Hasta el ${fmtDate(c.hasta)}.`));
                    l.push('','Transcurridos esos plazos se suprimirán también.');
                  }else l.push('No conservamos ningún dato suyo.');
                  l.push('','Puede reclamar ante la Agencia Española de Protección de Datos (www.aepd.es) si no está conforme.','',
                    compCfg.name||marcaDoc(),compCfg.email||'greenbighouse@gmail.com');
                  try{navigator.clipboard.writeText(l.join('\n'));notify('📋 Respuesta copiada — pégala en el correo');}catch(e){}
                }}>📋 Copiar la respuesta</button>
                {derechos.length>1&&(
                  <button style={{...S.sm(C.mt),fontSize:11}} onClick={()=>{
                    const ix=derechos.findIndex(x=>x.id===d.id);
                    setVerDerecho(derechos[(ix+1)%derechos.length]);
                  }}>Siguiente ({derechos.length-1})</button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ LISTADO PARA ENTIDADES FINANCIERAS ═══ */}
      {<ModalListadoFinancieras {...{anotarCesion,avisarCerrar,cesion,compCfg,marcaDoc,notify,setCesion,shareOrDownload}}/>}

      {/* ═══ FICHA DEL CLIENTE ═══ */}
      {<ModalFichaCliente {...{CLI_NUEVO,ES_APP,avisarCerrar,cliCat,cliForm,cliGenerando,cliModal,cliMotivo,cliSoloFiscal,clientes,compCfg,esLector,marcaDoc,notify,persistCliCat,setCliForm,setCliGenerando,setCliModal,setCliMotivo,setCliSoloFiscal,setContratos,setInvoices}}/>}

      {/* ═══ QUÉ FACTURA NO CUADRA ENTRE NUBE, MÓVIL Y PANTALLA ═══ */}
      {<ModalComparacionCapas {...{avisarCerrar,capas,notify,setCapas}}/>}

      {/* ═══ SEMÁFORO Y COTEJO EN LA AEAT ═══ */}
      {vfCotejo&&(()=>{
        const {inv,s}=vfCotejo;
        const col=s.estado==='aceptada'?C.sc:s.estado==='rechazada'?C.dn:s.estado==='error'?C.wn:s.estado==='pendiente'?C.wn:C.mt;
        const url=vfUrlCotejoFactura(inv,{nif:compCfg.cif},vfCfg.entorno);
        return(
          <div style={S.overlay} onClick={avisarCerrar}>
            <div style={{...S.modal,maxWidth:430}} onClick={e=>e.stopPropagation()}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                <div style={{fontSize:30,lineHeight:1}}>{s.luz}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,color:col}}>{s.texto}</div>
                  <div style={{fontSize:11,color:C.mt}}>{inv.numFactura||'—'} · {fmtDate(inv.fecha)} · {fmt(inv.total)} €</div>
                </div>
              </div>
              <div style={{fontSize:11,color:C.mt,lineHeight:1.5,margin:'8px 0'}}>{s.ayuda}</div>

              {s.motivo&&(
                <div style={{background:(s.estado==='rechazada'?C.dn:C.wn)+'14',border:`1px solid ${(s.estado==='rechazada'?C.dn:C.wn)}55`,borderRadius:8,padding:'8px 10px',marginBottom:8,fontSize:11,color:s.estado==='rechazada'?C.dn:C.wn}}>
                  {s.motivo}
                </div>
              )}

              {s.reg&&(
                <div style={{background:C.bg,borderRadius:9,padding:'9px 11px',fontSize:11,marginBottom:10}}>
                  {s.csv&&(<div style={{display:'flex',justifyContent:'space-between',gap:8}}><span style={{color:C.mt}}>CSV del envío</span><b style={{fontFamily:'monospace'}}>{s.csv}</b></div>)}
                  {s.enviadoEn&&(<div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:C.mt}}>Comunicada</span><b>{fmtDate(String(s.enviadoEn).slice(0,10))}</b></div>)}
                  <div style={{color:C.mt,marginTop:4,fontSize:10}}>Huella</div>
                  <div style={{fontFamily:'monospace',fontSize:9,wordBreak:'break-all',lineHeight:1.4}}>{s.huella}</div>
                  {s.csv&&<div style={{fontSize:10,color:C.mt,marginTop:5,lineHeight:1.4}}>El CSV identifica el <b>envío</b>, no la factura: si en el mismo envío fueron varias, todas comparten CSV.</div>}
                </div>
              )}

              <button style={{...S.btn(C.in),width:'100%'}} onClick={()=>{
                try{window.open(url,'_blank','noopener');}catch(e){notify('No se pudo abrir la sede','error');}
              }}>🔎 Cotejar en la sede de la AEAT</button>
              <div style={{fontSize:10,color:C.mt,marginTop:6,lineHeight:1.45}}>
                Se coteja con los datos de la factura (NIF, número, fecha e importe), que es lo que lleva el QR. La respuesta será <b>Factura encontrada</b>, <b>no encontrada</b> —si acabas de enviarla, espera unos minutos— o <b>no verificable</b>.
              </div>

              {s.csv&&(
                <button style={{...S.sm(C.mt),width:'100%',marginTop:8,fontSize:11}} onClick={()=>{
                  try{navigator.clipboard.writeText(s.csv);notify('CSV copiado');}catch(e){}
                }}>📋 Copiar el CSV del envío</button>
              )}
              <div style={{display:'flex',gap:8,marginTop:10,justifyContent:'flex-end'}}>
                <button style={S.ghost} onClick={()=>setVfCotejo(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ DEJAR SIN EFECTO UNA FACTURA REGISTRADA ═══ */}
      {<ModalAnularVf {...{BtnConfirm,avisarCerrar,emitirRectificativa,setVfAnular,vfAnular,vfAnularFactura}}/>}

      {/* ═══ REGISTROS VERI*FACTU Y ENVÍO ═══ */}
      {vfVer&&(()=>{
        const res=vfResumenEnvio(vfRegistros);
        const pend=vfPendientes(vfRegistros);
        return(
          <div style={S.overlay} onClick={avisarCerrar}>
            <div style={{...S.modal,maxWidth:600}} onClick={e=>e.stopPropagation()}>
              <div style={{...S.cabModal,display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14}}>🧾 Registros VERI*FACTU</div>
                  <div style={{fontSize:11,color:C.mt}}>{res.total} registros · {res.aceptados} aceptados · {res.rechazados} rechazados · entorno {vfCfg.entorno}</div>
                </div>
                <button style={{background:'transparent',border:'none',cursor:'pointer',color:C.mt,fontSize:20,lineHeight:1,padding:'0 4px'}} onClick={()=>setVfVer(false)}>✕</button>
              </div>

              {vfCfg.entorno==='produccion'&&(
                <div style={{background:C.wn+'14',border:`1px solid ${C.wn}55`,borderRadius:8,padding:'7px 10px',marginBottom:8,fontSize:10,color:C.wn}}>
                  ⚠ Estás en producción: lo que envíes se comunica a Hacienda de verdad.
                </div>
              )}

              {!esLector()&&(
                <button style={{...S.btn(C.sc),width:'100%',marginBottom:10,opacity:(vfEnviando||!pend.length)?.6:1}}
                  disabled={vfEnviando||!pend.length} onClick={vfEnviar}>
                  {vfEnviando?'⏳ Enviando…':pend.length?`📤 Enviar ${Math.min(pend.length,VF_MAX_LOTE)} pendiente${pend.length!==1?'s':''}`:'✓ Todo enviado'}
                </button>
              )}

              {!vfRegistros.length&&<div style={{textAlign:'center',padding:24,color:C.mt,fontSize:12}}>Todavía no hay registros. Se crean solos al emitir una factura.</div>}

              {vfRegistros.slice().reverse().slice(0,60).map((r,i)=>{
                const col=r.estadoAEAT==='aceptado'?C.sc:r.estadoAEAT==='rechazado'?C.dn:r.estadoAEAT==='error'?C.wn:C.bd;
                return(
                  <div key={r.huella||i} style={{background:C.bg,borderRadius:9,padding:'8px 10px',marginBottom:6,borderLeft:`3px solid ${col}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',gap:8}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:700}}>
                          {r.tipoRegistro==='anulacion'?'↩️ Anulación de ':''}{r.numSerie}
                          <span style={{fontSize:10,color:C.mt,fontWeight:400}}> · {r.fechaExpedicion}</span>
                        </div>
                        <div style={{fontSize:9,color:C.mt,fontFamily:'monospace',overflow:'hidden',textOverflow:'ellipsis'}}>{String(r.huella||'').slice(0,32)}…</div>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        {r.importeTotal!==undefined&&<div style={{fontSize:12,fontWeight:700}}>{fmt(r.importeTotal)} €</div>}
                        <div style={{fontSize:9,color:col,fontWeight:700}}>{VF_ESTADOS[r.estadoAEAT]||'Sin enviar'}</div>
                      </div>
                    </div>
                    {r.errorAEAT&&<div style={{fontSize:10,color:r.estadoAEAT==='rechazado'?C.dn:C.wn,marginTop:3}}>{r.errorAEAT}</div>}
                    {r.csv&&<div style={{fontSize:9,color:C.mt,marginTop:2}}>CSV: {r.csv}</div>}
                    {r.tipoRegistro==='alta'&&(
                      <button style={{...S.sm(C.in),padding:'5px 10px',fontSize:10,marginTop:5,minHeight:0,marginRight:6}}
                        onClick={()=>{
                          const inv=(invoices||[]).find(x=>x&&x.id===r.facturaId);
                          const url=inv?vfUrlCotejoFactura(inv,{nif:compCfg.cif},vfCfg.entorno):vfUrlCotejo(r,vfCfg.entorno);
                          try{window.open(url,'_blank','noopener');}catch(e){notify('No se pudo abrir la sede','error');}
                        }}>🔎 Cotejar</button>
                    )}
                    {(()=>{
                      // Anular desde aquí: es donde se mira después de enviar
                      if(esLector()||r.tipoRegistro!=='alta')return null;
                      const yaAnulada=(vfRegistros||[]).some(x=>x&&x.tipoRegistro==='anulacion'&&x.numSerie===r.numSerie);
                      if(yaAnulada)return <div style={{fontSize:10,color:C.mt,marginTop:4}}>↩️ Anulada</div>;
                      const inv=(invoices||[]).find(x=>x&&x.id===r.facturaId);
                      return(
                        <button style={{...S.sm(C.dn),padding:'5px 10px',fontSize:10,marginTop:5,minHeight:0}}
                          onClick={()=>setVfAnular({inv:inv||{id:r.facturaId},reg:r,motivo:''})}>↩️ Anular</button>
                      );
                    })()}
                  </div>
                );
              })}

              {vfRegistros.length>0&&(
                <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
                  <button style={{...S.sm(C.mt),fontSize:11}} onClick={()=>{
                    const xml=vfExportarXml(vfRegistros,{nif:compCfg.cif,nombre:compCfg.name});
                    shareOrDownload(new Blob([xml],{type:'application/xml;charset=utf-8'}),`Registros_VERIFACTU_${today}.xml`,'application/xml;charset=utf-8');
                    anotarEventos([{tipo:'EXPORTACION',detalle:`${vfRegistros.length} registros exportados en XML`}]);
                  }}>⬇️ Exportar XML</button>
                  <button style={{...S.sm(C.mt),fontSize:11}} onClick={()=>{
                    const csv=vfExportarCsv(vfRegistros);
                    shareOrDownload(new Blob([csv],{type:'text/csv;charset=utf-8'}),`Registros_VERIFACTU_${today}.csv`,'text/csv;charset=utf-8');
                    anotarEventos([{tipo:'EXPORTACION',detalle:`${vfRegistros.length} registros exportados en hoja de cálculo`}]);
                  }}>📊 Exportar hoja</button>
                  <button style={{...S.sm(C.mt),fontSize:11}} onClick={()=>{
                    const txt=(vfEventos||[]).map(e=>`${e.fechaHoraHusoGenRegistro}\t${e.descripcion}\t${e.detalle||''}\t${e.usuario||''}`).join('\n');
                    shareOrDownload(new Blob(['\ufeff'+txt],{type:'text/plain;charset=utf-8'}),`Eventos_VERIFACTU_${today}.txt`,'text/plain;charset=utf-8');
                  }}>📋 Registro de eventos ({(vfEventos||[]).length})</button>
                </div>
              )}
              {vfRegistros.length>0&&(
                <button style={{...S.sm(C.in),marginTop:6,fontSize:11}} onClick={async()=>{
                  const v=await vfVerificarCadena(vfRegistros);
                  if(v.intacta)notify(`✅ Cadena intacta: ${v.total} registros enlazados correctamente`);
                  else{
                    anotarEventos([{tipo:'CADENA_ROTA',detalle:`${v.rotos.length} registros con problemas`}]);
                    notify(`⛔ La cadena tiene ${v.rotos.length} problema${v.rotos.length!==1?'s':''}: ${v.rotos.slice(0,2).map(x=>x.numSerie+' ('+x.motivo+')').join(', ')}`,'error');
                  }
                }}>🔗 Comprobar la cadena</button>
              )}
              <div style={{fontSize:10,color:C.mt,marginTop:8,lineHeight:1.45}}>
                Una factura aceptada no se reenvía nunca: mandarla dos veces la duplicaría en los registros de la AEAT.<br/>
                Exporta los registros de vez en cuando y guárdalos aparte: tienes que conservarlos aunque algún día dejes de usar este programa.
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ LLEVAR LA REMESA AL BANCO ═══ */}
      {<ModalTraspasos {...{BtnConfirm,RemesasList,avisarCerrar,borrarEmpresaGrupo,fmtImporte,grupo,grupoForm,grupoModal,guardarEmpresaGrupo,nuevoTraspaso,setGrupoForm,setGrupoModal,setTraspModal,traspModal,traspasos}}/>}
      {<ModalTraspasoNuevo {...{Combobox,avisarCerrar,compCfg,fmtImporte,generarTraspaso,grupo,parseImporte,setTraspForm,setTraspModal,traspForm,traspModal}}/>}
      {<ModalFicheroBanca {...{avisarCerrar,bancaUrl,setBancaUrl,setSubirBanco,subirBanco}}/>}

      {/* ═══ REPARTO Y ENVÍO DE NÓMINAS ═══ */}
      {<ModalRepartoNominas {...{avisarCerrar,avisarWhatsApp,avisoEdit,avisoTxt,compCfg,enviarNomina,enviarYAvisar,reparto,repartoCancel,setAvisoEdit,setAvisoTxt,setReparto}}/>}

      {/* ═══ GESTIÓN DE EXTRACTOS N43 ═══ */}
      {<ModalExtractosN43 {...{BtnConfirm,anularN43,avisarCerrar,esLector,n43Gestion,n43Hist,setN43Gestion,setN43Pendiente,setSubView,setView}}/>}

      {<ModalPresupuestosObra {...{InvRow,dashFrom,dashTo,kpiDetail,setKpiDetail}}/>}
      {<ModalDocVenta {...{docVentaModal,setDocVentaModal,ponCond,previaDocVenta,generarDocVenta,eurDoc,nombreObra}}/>}
      {<ModalDniVivienda {...{dniVivienda,setDniVivienda,nombreObra,copiar,descargarDni,fmtDate}}/>}
      {<ModalEnlace {...{enlaceModal,setEnlaceModal}}/>}
      {/* v383 · resultados de la búsqueda en Gmail, abierta desde Facturas → Sin doc.
          Va en la capa ACCION: se abre DESDE una pantalla con filtros y no puede
          quedarse detrás de nada (la escalera de capas de la v378). */}
      {/* v389 · EXPEDIENTE DE OBRA · la lista de documentación de inicio que
          dictó Jesús, cotejada con su carpeta de Drive por título. */}
      {expedienteObra&&(()=>{
        const suj=typeof expedienteObra==='object'?expedienteObra:{tipo:'obra',id:expedienteObra};
        const o=suj.tipo==='contrato'?contratos.find(x=>String(x.id)===String(suj.id))
                                     :obras.find(x=>String(x.id)===String(suj.id));
        if(!o)return null;
        const rotulo=suj.tipo==='contrato'?(o.numero+(o.cliente?' · '+o.cliente:'')):nombreObra(o);
        const lin=lineasDe(o).map(({claves,...l})=>l);
        const con=lin.filter(x=>x.doc).length, na=lin.filter(x=>x.noAplica).length;
        const toca=(id,cambio)=>guardarExpediente(suj,{lineas:lineasDe(o).map(({claves,...l})=>String(l.id)===String(id)?{...l,...cambio}:l)});
        const lista=(o.expediente&&o.expediente.cotejo&&o.expediente.cotejo.lista)||[];
        // v393 · elegir un fichero a mano: manda sobre el cotejo y la línea aprende
        const asignar=(l,f)=>{
          toca(l.id,{doc:{nombre:f.n,enlace:f.e,manual:true},clavesExtra:aprenderDe(l,f.n)});
          setElegirDe(null);
        };
        return (
          <div style={{...S.overlay,zIndex:CAPAS.ACCION}} onClick={()=>setExpedienteObra(null)}>
            <div style={{...S.modal,width:'100%',maxWidth:'min(520px, 94vw)',boxSizing:'border-box',maxHeight:'94vh',overflowY:'auto',overflowX:'hidden'}} onClick={e=>e.stopPropagation()}>
              <div style={{position:'sticky',top:0,zIndex:1,background:C.pa||C.bg,margin:'-2px -2px 2px',padding:'6px 2px 8px',display:'flex',alignItems:'center',gap:8,borderBottom:`1px solid ${C.bd}`}}>
                <div style={{flex:1,minWidth:0,fontWeight:700,fontSize:14,overflowWrap:'anywhere'}}>📋 Expediente · {rotulo}</div>
                <button onClick={()=>setExpedienteObra(null)} title="Cerrar" style={{background:'transparent',border:'none',color:C.mt,cursor:'pointer',fontSize:20,lineHeight:1,padding:'0 4px',flexShrink:0}}>✕</button>
              </div>
              <div style={{fontSize:11,color:C.mt,marginBottom:8,lineHeight:1.5}}>
                Los documentos viven en tu Drive. Pega la carpeta y el cotejo casa cada punto por el TÍTULO del fichero (solo lee títulos y enlaces, nunca el contenido).
              </div>
              <div style={{display:'flex',gap:6,marginBottom:8,flexWrap:'wrap'}}>
                <input style={{...S.input,flex:'1 1 180px',fontSize:12,minHeight:0,padding:'7px 9px'}} placeholder="Enlace de la carpeta de Drive"
                  value={(o.expediente&&o.expediente.carpeta)||''} onChange={e=>guardarExpediente(suj,{carpeta:e.target.value})}/>
                <button disabled={!!engBusy} style={{...S.sm(C.in),fontSize:11,opacity:engBusy?0.45:1}} onClick={()=>cotejarConDrive(o,suj)}>
                  {engBusy==='drive|'+o.id?'⏳ Cotejando…':'🔄 Cotejar con Drive'}
                </button>
              </div>
              <div style={{fontSize:11,marginBottom:8}}>
                <b>{con}</b> con documento · <b>{lin.length-con-na}</b> pendientes{na?<> · <b>{na}</b> no aplican</>:null}
                {o.expediente&&o.expediente.cotejo?<span style={{color:C.mt}}> · cotejado el {o.expediente.cotejo.fecha}</span>:null}
              </div>
              {lin.map(l=>(
                <div key={l.id} style={{display:'flex',gap:7,alignItems:'flex-start',padding:'5px 0',borderTop:`1px solid ${C.bd}22`,minWidth:0}}>
                  <span style={{flexShrink:0,fontSize:13}}>{l.noAplica?'🚫':l.doc?'✅':'⬜'}</span>
                  <div style={{flex:1,minWidth:0,overflowWrap:'anywhere'}}>
                    <div style={{fontSize:11.5,...(l.noAplica?{color:C.mt,textDecoration:'line-through'}:{})}}>{l.t}</div>
                    {l.doc&&!l.noAplica&&<a href={l.doc.enlace||'#'} target="_blank" rel="noreferrer" style={{fontSize:10,color:C.in,overflowWrap:'anywhere'}}>📄 {l.doc.nombre}{l.doc.manual?' · elegido a mano':''}</a>}
                    {/* v393 · Jesús: «no siempre los títulos se llaman como tú lo tienes en
                        la app». Candidatos por parecido, y la lista entera para elegir. */}
                    {!l.doc&&!l.noAplica&&!!lista.length&&(()=>{
                      const cand=candidatosLinea(l,lista);
                      return <div style={{marginTop:3}}>
                        {cand.map((f,j)=>(
                          <div key={j} style={{display:'flex',gap:6,alignItems:'center',minWidth:0,padding:'2px 0'}}>
                            <div style={{flex:1,minWidth:0,fontSize:9.5,color:C.mt,overflowWrap:'anywhere'}}>📎 {f.n}</div>
                            <button style={{...S.sm(C.sc),fontSize:9,flexShrink:0}} onClick={()=>asignar(l,f)}>📎 Usar</button>
                          </div>
                        ))}
                        {elegirDe===l.id?(
                          <div style={{marginTop:3,maxHeight:150,overflowY:'auto',border:`1px solid ${C.bd}`,borderRadius:8,padding:4}}>
                            {lista.map((f,j)=>(
                              <button key={j} style={{display:'block',width:'100%',textAlign:'left',background:'transparent',
                                border:'none',color:C.tx,fontSize:9.5,padding:'3px 4px',cursor:'pointer',overflowWrap:'anywhere'}}
                                onClick={()=>asignar(l,f)}>📄 {f.n}</button>
                            ))}
                            <button style={{...S.sm(C.mt),fontSize:9,marginTop:3}} onClick={()=>setElegirDe(null)}>Cancelar</button>
                          </div>
                        ):(
                          <button style={{...S.sm(C.mt),fontSize:9,marginTop:2}} onClick={()=>setElegirDe(l.id)}>📂 Elegir fichero</button>
                        )}
                      </div>;
                    })()}
                    {l.noAplica&&<div style={{fontSize:9.5,color:C.mt}}>no obligatorio en esta obra</div>}
                  </div>
                  <button title={l.noAplica?'Vuelve a ser obligatorio':'Marcar como NO obligatorio en esta obra'}
                    onClick={()=>toca(l.id,{noAplica:!l.noAplica,doc:l.noAplica?l.doc:null})}
                    style={{...S.sm(l.noAplica?C.sc:C.mt),fontSize:9,flexShrink:0}}>{l.noAplica?'Aplica':'N/A'}</button>
                  {l.propia&&<button title="Quitar esta línea añadida" onClick={()=>guardarExpediente(suj,{lineas:lineasDe(o).filter(x=>String(x.id)!==String(l.id)).map(({claves,...x})=>x)})}
                    style={{background:'transparent',border:'none',color:C.mt,cursor:'pointer',fontSize:13,lineHeight:1,padding:'0 2px',flexShrink:0}}>✕</button>}
                </div>
              ))}
              {/* añadir líneas propias, como pidió Jesús */}
              <div style={{display:'flex',gap:6,marginTop:8}}>
                <input style={{...S.input,flex:1,fontSize:12,minHeight:0,padding:'7px 9px'}} placeholder="Añadir otro documento a la lista…" id="exp-nueva" defaultValue=""
                  onKeyDown={e=>{if(e.key==='Enter'&&e.target.value.trim()){
                    guardarExpediente(suj,{lineas:[...lineasDe(o).map(({claves,...x})=>x),{id:'p'+Date.now(),t:e.target.value.trim(),propia:true}]});
                    e.target.value='';}}}/>
                <button style={{...S.sm(C.sc),fontSize:11}} onClick={()=>{const el=document.getElementById('exp-nueva');
                  if(el&&el.value.trim()){guardarExpediente(suj,{lineas:[...lineasDe(o).map(({claves,...x})=>x),{id:'p'+Date.now(),t:el.value.trim(),propia:true}]});el.value='';}}}>＋ Añadir</button>
              </div>
            </div>
          </div>
        );
      })()}
      {docsGmail&&(()=>{
        const gm=pkCheq&&pkCheq.gmail;
        const res=(gm&&gm.resultados)||[];
        const puestas=res.filter(r=>r.estado==='adjuntada');
        return (
          <div style={{...S.overlay,zIndex:CAPAS.ACCION}} onClick={()=>setDocsGmail(null)}>
            {/* v386 · Jesús: «se desencaja de la ventana» y «la ventana podría llegar
                hasta abajo». Los nombres de fichero largos (…VISADO COACM.pdf) empujaban
                el contenido fuera. Ahora el ancho queda atado a la pantalla, nada se sale
                y la ventana aprovecha el alto disponible. */}
            <div style={{...S.modal,width:'100%',maxWidth:'min(480px, 94vw)',boxSizing:'border-box',
              maxHeight:'94vh',overflowY:'auto',overflowX:'hidden'}} onClick={e=>e.stopPropagation()}>
              {/* v388 · Jesús pide tres aspas. Ésta es la de la VENTANA, y va en una
                  barra FIJA arriba: la lista es larga y no se puede obligar a bajar hasta
                  el final para cerrar. Se queda pegada al desplazar. */}
              <div style={{position:'sticky',top:0,zIndex:1,background:C.pa||C.bg,margin:'-2px -2px 2px',
                padding:'6px 2px 8px',display:'flex',alignItems:'center',gap:8,borderBottom:`1px solid ${C.bd}`}}>
                <div style={{flex:1,minWidth:0,fontWeight:700,fontSize:14}}>📧 Documentos que faltan, buscados en Gmail</div>
                <button onClick={()=>setDocsGmail(null)} title="Cerrar"
                  style={{background:'transparent',border:'none',color:C.mt,cursor:'pointer',fontSize:20,lineHeight:1,padding:'0 4px',flexShrink:0}}>✕</button>
              </div>
              <div style={{fontSize:11,color:C.mt,marginBottom:10,lineHeight:1.5}}>
                Se busca por número de factura y por <b>importe exacto</b>, solo en correos con adjunto y de fechas cercanas.
                Únicamente se propone lo que cuadra con ese proveedor: si no cuadra, no aparece.
              </div>
              {(!gm||gm.en)&&!res.length&&<div style={{textAlign:'center',padding:24,color:C.mt,fontSize:12}}>⏳ Buscando en tu correo…</div>}
              {!!res.length&&(
                <div style={{fontSize:11,marginBottom:8}}>
                  {gm&&gm.en?<span style={{color:C.wn,fontWeight:700}}>⏳ sigue buscando · </span>:null}
                  <b>{puestas.length}</b> enganchadas de {res.length} revisadas
                  {res.length-puestas.length>0?` · ${res.length-puestas.length} necesitan que elijas`:''}
                </div>
              )}
              {res.map((r,k)=>(
                <div key={(r.inv&&r.inv.id)||k} style={{...S.card,marginBottom:6,minWidth:0,overflowWrap:'anywhere',
                  borderLeft:`3px solid ${r.estado==='adjuntada'?C.sc:C.wn}`}}>
                  <div style={{display:'flex',gap:6,alignItems:'flex-start'}}>
                    <div style={{flex:1,minWidth:0,fontSize:11,fontWeight:600}}>{r.inv.proveedor||'(sin proveedor)'} · nº {r.inv.numFactura||'s/n'} · {fmt(r.inv.total)} €</div>
                    {/* v388 · aspa de la FACTURA: la quita de la lista y de las pendientes */}
                    <button title="Quitar esta factura de la lista" onClick={()=>{
                      descartadasRef.current.add(String(r.inv.id));
                      const q=quitarDeLista(res,(docsGmail&&docsGmail.faltan)||[],r.inv.id);
                      setPkCheq(c=>({...c,gmail:{...c.gmail,resultados:q.resultados}}));
                      setDocsGmail(d=>({...(d||{}),faltan:q.faltan}));
                    }} style={{background:'transparent',border:'none',color:C.mt,cursor:'pointer',fontSize:15,lineHeight:1,padding:'0 2px',flexShrink:0}}>✕</button>
                  </div>
                  <div style={{fontSize:10,color:r.estado==='adjuntada'?C.sc:C.mt,marginTop:2}}>
                    {r.estado==='adjuntada'?'✓ ':'· '}{r.motivo}
                  </div>
                  {/* v387 · Jesús: «si no hay email vinculado, o rebusca con otro
                      concepto (previo click nuestro), o que nos permita quitarlo». Las
                      dos salidas, aquí mismo. */}
                  {r.estado!=='adjuntada'&&(
                    <div style={{marginTop:6}}>
                      {otraBusca&&otraBusca.invId===r.inv.id?(
                        <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                          <input autoFocus value={otraBusca.texto} placeholder="obra, remitente, concepto…"
                            onChange={e=>setOtraBusca(o=>({...o,texto:e.target.value}))}
                            onKeyDown={e=>{if(e.key==='Enter')rebuscarConTexto(r.inv,otraBusca.texto);}}
                            style={{...S.input,flex:'1 1 140px',fontSize:11,padding:'5px 8px',minHeight:0}}/>
                          <button disabled={!!engBusy} style={{...S.sm(C.in),fontSize:10,opacity:engBusy?0.45:1}}
                            onClick={()=>rebuscarConTexto(r.inv,otraBusca.texto)}>
                            {engBusy==='rebusca|'+r.inv.id?'⏳ Buscando…':'🔎 Buscar'}
                          </button>
                          <button style={{...S.sm(C.mt),fontSize:10}} onClick={()=>setOtraBusca(null)}>✕</button>
                        </div>
                      ):(
                        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                          <button style={{...S.sm(C.in),fontSize:10}}
                            onClick={()=>setOtraBusca({invId:r.inv.id,texto:''})}>🔎 Buscar con otro concepto</button>
                          {/* v388 · el botón largo de quitar se retira: ahora está el aspa
                              arriba de la propia factura, que hace lo mismo y ocupa menos. */}
                        </div>
                      )}
                    </div>
                  )}
                  {/* v384 · Jesús: «el sistema me lo dice pero no me deja elegir ninguna
                      de las propuestas». Fallo mío: los candidatos se pintaban como texto
                      y sin botón. Ahora cada uno se puede enganchar, igual que en la
                      ventana del paquete para la gestoría. */}
                  {r.estado==='elegir'&&(r.candidatos||[]).length>4&&(
                    <div style={{fontSize:9.5,color:C.mt,marginTop:4,paddingLeft:8}}>
                      Se enseñan 4 de {(r.candidatos||[]).length} · descarta con ✕ para ver los siguientes
                    </div>
                  )}
                  {r.estado==='elegir'&&(r.candidatos||[]).slice(0,4).map((c,j)=>(
                    <div key={j} style={{display:'flex',gap:6,alignItems:'center',marginTop:5,paddingLeft:8}}>
                      <div style={{flex:1,minWidth:0,fontSize:10,color:C.mt,overflowWrap:'anywhere'}}>
                        📎 <b>{c.filename}</b>
                        <div style={{fontSize:9.5,marginTop:1}}>{String(c.de||'').replace(/<.*$/,'').trim()} · {String(c.asunto||'').slice(0,44)}</div>
                        <div style={{fontSize:9.5,color:C.in,marginTop:1}}>{(c.por||[]).join(' · ')}</div>
                      </div>
                      {/* v386 · Jesús: «no termina de ir bien en velocidad desde que das al
                          botón de adjuntar, hay veces como que tengo que darle dos veces, y de
                          repente empieza a adjuntar clicks pasados». El botón no daba ninguna
                          señal: descargar el adjunto de Gmail y subirlo a la nube tarda unos
                          segundos, así que se pulsaba otra vez y los enganches se encolaban y
                          salían todos de golpe. Ahora se apaga mientras trabaja y se ignora
                          cualquier pulsación repetida. */}
                      {/* v388 · aspa del CANDIDATO: lo descarta y aparece el siguiente de
                          la cola. Con 13 candidatos y solo 4 a la vista, sin esto no había
                          forma de llegar a los de abajo. */}
                      <button title="Descartar este correo" onClick={()=>{
                        setPkCheq(p=>({...p,gmail:{...p.gmail,resultados:(p.gmail.resultados||[]).map(x=>{
                          if(String(x.inv.id)!==String(r.inv.id))return x;
                          const quedan=(x.candidatos||[]).filter(y=>!(y.filename===c.filename&&y.msgId===c.msgId));
                          return {...x,candidatos:quedan,
                            estado:quedan.length?x.estado:'no encontrada',
                            motivo:quedan.length?`${quedan.length} candidato${quedan.length!==1?'s':''}`:'descartados todos'};
                        })}}));
                      }} style={{background:'transparent',border:'none',color:C.mt,cursor:'pointer',fontSize:14,lineHeight:1,padding:'0 2px',flexShrink:0}}>✕</button>
                      <button disabled={!!engBusy} style={{...S.sm(C.sc),flexShrink:0,fontSize:10,
                        opacity:engBusy?0.45:1,cursor:engBusy?'default':'pointer'}} onClick={async()=>{
                        if(engBusy)return;
                        const marca=String(r.inv.id)+'|'+c.filename;
                        setEngBusy(marca);
                        try{
                          const clientId=await leerGmailId();const tok=await tokenGmail(clientId);
                          const marcar=(txtEstado)=>setPkCheq(p=>({...p,gmail:{...p.gmail,resultados:(p.gmail.resultados||[]).map(x=>String(x.inv.id)===String(r.inv.id)
                            ?{...x,estado:'adjuntada',motivo:c.filename+txtEstado,candidatos:[]}:x)}}));
                          // al momento, en cuanto sube; y se afina cuando la nube confirma
                          const nube=await engancharDeGmail(r.inv,c,tok,()=>{
                            marcar(' · ⏳ subiendo');
                            notify('📎 Documento enganchado a '+(r.inv.numFactura||r.inv.proveedor));
                            setEngBusy('');
                          });
                          marcar(nube.ok?' · ☁️ en la nube':' · ⏳ subiendo');
                        }catch(e){notify('No se pudo enganchar: '+String(e&&e.message||e).slice(0,80),'error');}
                        finally{setEngBusy('');}
                      }}>{engBusy===String(r.inv.id)+'|'+c.filename?'⏳ Adjuntando…':'📎 Usar'}</button>
                      {/* v388 · Jesús: «¿y quitar candidatos con una pequeña X y que salgan
                          más?». Se enseñan 4: al descartar uno entra el siguiente. Se quita
                          solo de ESTA factura; el mismo correo puede valer para otra. */}
                      <button title="Descartar este candidato"
                        style={{...S.sm(C.mt),flexShrink:0,fontSize:11,padding:'4px 8px',minHeight:0}}
                        onClick={()=>setPkCheq(p=>({...p,gmail:{...p.gmail,
                          resultados:quitarCandidato(p.gmail.resultados,r.inv.id,claveCandidato(c))}}))}>✕</button>
                    </div>
                  ))}
                  {r.estado==='elegir'&&(r.candidatos||[]).length>4&&(
                    <div style={{fontSize:10,color:C.mt,marginTop:4,paddingLeft:8}}>
                      y {(r.candidatos||[]).length-4} más · descarta con ✕ los que no sean para ver los siguientes
                    </div>
                  )}
                </div>
              ))}
              {/* v387 · «no hay un ver más»: aquí está. Se revisa de 25 en 25 y se dice
                  cuántas quedan, para que no se cuelgue intentando cientos de golpe. */}
              {(()=>{
                const todas=(docsGmail&&docsGmail.faltan)||[];
                const hechas=new Set(res.map(r=>r&&r.inv&&String(r.inv.id)));
                const quedan=todas.filter(i=>!hechas.has(String(i.id)));
                if(!quedan.length||(gm&&gm.en))return null;
                return <button style={{...S.sm(C.in),width:'100%',marginTop:8,fontWeight:700}}
                  onClick={()=>buscarEnGmailFaltantes(quedan.slice(0,TANDA_GMAIL))}>
                  🔎 Buscar {Math.min(TANDA_GMAIL,quedan.length)} más · quedan {quedan.length}
                </button>;
              })()}
              <div style={{display:'flex',gap:8,marginTop:10}}>
                <button style={S.ghost} onClick={()=>setDocsGmail(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        );
      })()}
      {<ModalBuzon {...{buzonAbierto,setBuzonAbierto,buzonTodo,docsVenta,viviendas,obras,nombreObra,irAClientesRecibidos,irAProveedores,irADerechos,verDocVenta,marcarDocVisto,fmtDate}}/>}

      {/* ═══ BÚSQUEDA GLOBAL ═══ */}
      {showSearch&&(()=>{
        const q=globalQ.trim().toLowerCase();
        const go=(fn)=>{fn();setShowSearch(false);};
        const R=({ic,t,s,onGo})=><div style={{display:'flex',gap:8,alignItems:'center',padding:'8px 10px',borderRadius:8,cursor:'pointer',background:C.bg+'66',marginBottom:4}} onClick={()=>go(onGo)}><span style={{fontSize:14}}>{ic}</span><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t}</div>{s&&<div style={{fontSize:10,color:C.mt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s}</div>}</div></div>;
        let res=[];
        if(q.length>=2){
          const m=(str)=>String(str||'').toLowerCase().includes(q);
          const SEC=[
            ['📊','Panel','panel inicio resumen kpis',()=>setView('dashboard')],
            ['📥','Facturas recibidas','recibidas gastos compras',()=>{setView('facturas');setSubView('recibidas');}],
            ['📤','Facturas emitidas','emitidas certificaciones ingresos ventas',()=>{setView('facturas');setSubView('emitidas');}],
            ['👤','Clientes','clientes',()=>{setView('facturas');setSubView('clientes');}],
            ['🏪','Proveedores','proveedores',()=>{setView('facturas');setSubView('proveedores');}],
            ['🏗️','Obras','obras presupuestos ejecucion ejecución',()=>{setView('facturas');setSubView('obras');}],
            ['🛡️','Garantías','garantias garantías retencion retención',()=>{setView('contratos');setConView('garantias');setShowSearch(false);}],
            ['🏦','Remesas C34 proveedores','remesas c34 sepa cuaderno pagos banco transferencias',()=>{setView('facturas');setSubView('remesas');}],
            ['📑','Contratos','contratos presupuestos',()=>setView('contratos')],
            ['👷','Nóminas','nominas nóminas plantilla empleados sueldos trabajadores',()=>setView('nominas')],
            ['🏦','C34 de nóminas','c34 nominas nóminas remesas sepa',()=>{setView('nominas');setNomView('remesas');}],
            ['🛡️','Seguros','seguros polizas pólizas flota vehiculos vehículos maquinaria itv seguro furgon furgón camion camión',()=>{setView('flota');setFlotaView('vehiculos');}],
            ['🛡️','Pólizas de seguro','polizas pólizas seguros rc decenal accidentes todo riesgo prima aseguradora axa',()=>{setView('flota');setFlotaView('polizas');}],
            ['⚙️','Configuración','config configuracion ajustes empresa backup copia clave escaner',()=>setView('config')],
          ];
          SEC.filter(s=>(s[1]+' '+s[2]).toLowerCase().includes(q)).slice(0,3).forEach((s,ix)=>res.push(<R key={'sec'+ix} ic={s[0]} t={s[1]} s="Ir a la sección" onGo={s[3]}/>));
          invoices.filter(i=>i.tipo!=='cobro'&&i.tipo!=='personal'&&(m(i.proveedor)||m(i.numFactura)||m(i.concepto)||m(i.obra))).slice(0,3).forEach(i=>res.push(<R key={'r'+i.id} ic="📥" t={`${i.proveedor} · ${fmt(i.total)} €`} s={`${i.numFactura||''} ${i.concepto||''}`} onGo={()=>{setView('facturas');setSubView('recibidas');setSearch(globalQ);}}/>));
          invoices.filter(i=>i.tipo==='cobro'&&(m(i.proveedor)||m(i.numFactura)||m(i.concepto)||m(i.obra))).slice(0,3).forEach(i=>res.push(<R key={'e'+i.id} ic="📤" t={`${i.proveedor} · ${fmt(i.total)} €`} s={i.numFactura} onGo={()=>{setView('facturas');setSubView('emitidas');setSearch(globalQ);}}/>));
          proveedores.filter(p=>m(p)).slice(0,3).forEach(p=>res.push(<R key={'p'+p} ic="🏪" t={p} s="Proveedor" onGo={()=>{setView('facturas');setSubView('proveedores');setSearch('');setFocoProv(p);setFocoCli('');setFProv(p);}}/>));
          clientes.filter(c=>m(c)).slice(0,3).forEach(c=>res.push(<R key={'c'+c} ic="👤" t={c} s="Cliente" onGo={()=>{setView('facturas');setSubView('clientes');setSearch('');setFocoCli(c);setFocoProv('');setFProv(c);}}/>));
          obras.filter(o=>o.activa!==false&&m(obraDisplay(o))).slice(0,3).forEach(o=>res.push(<R key={'o'+o.id} ic="🏗️" t={obraDisplay(o)} s="Obra" onGo={()=>{setView('facturas');setSubView('obras');setExpObra(obraDisplay(o));}}/>));
          contratos.filter(c=>m(c.cliente)||m(c.numero)||m(c.obra)).slice(0,3).forEach(c=>res.push(<R key={'ct'+c.id} ic="📑" t={`${c.numero} · ${c.cliente}`} s={c.obra} onGo={()=>setView('contratos')}/>));
          employees.filter(e=>m(e.nombre)).slice(0,3).forEach(e=>res.push(<R key={'em'+e.id} ic="👷" t={e.nombre} s="Empleado" onGo={()=>setView('nominas')}/>));
          flota.filter(v=>v.activa!==false&&(m(v.alias)||m(v.matricula)||m(v.seguroCia))).slice(0,3).forEach(v=>res.push(<R key={'f'+v.id} ic="🚛" t={v.alias||v.matricula} s={v.matricula} onGo={()=>{setView('flota');setFlotaView('vehiculos');}}/>));
          polizas.filter(p=>p.activa!==false&&(m(p.tipo)||m(p.desc)||m(p.cia))).slice(0,3).forEach(p=>res.push(<R key={'pz'+p.id} ic="🛡️" t={p.tipo||'Póliza'} s={p.desc} onGo={()=>{setView('flota');setFlotaView('polizas');}}/>));
        }
        return(
          <div style={{...S.overlay,alignItems:'flex-start',paddingTop:60}} onClick={avisarCerrar}>
            <div style={{...S.modal,maxWidth:480}} onClick={e=>e.stopPropagation()}>
              <div style={{...S.cabModal,display:'flex',gap:8,alignItems:'center',marginBottom:10}}>
                <input ref={lupaInputRef} style={{...S.input,flex:1}} placeholder="🔍 Factura, proveedor, obra, empleado…" value={globalQ} onChange={e=>setGlobalQ(e.target.value)} onKeyDown={e=>{if(e.key==='Escape')setShowSearch(false);}}/>
                <button onClick={()=>setShowSearch(false)} style={{background:'none',border:'none',color:C.mt,cursor:'pointer',fontSize:18}}>✕</button>
              </div>
              {q.length<2?<div style={{fontSize:11,color:C.mt,textAlign:'center',padding:10}}>Escribe al menos 2 letras</div>:
                res.length===0?<div style={{fontSize:11,color:C.mt,textAlign:'center',padding:10}}>Sin resultados para «{globalQ}»</div>:
                <div style={{maxHeight:'55vh',overflowY:'auto'}}>{res}</div>}
            </div>
          </div>
        );
      })()}

      {/* ═══ VEHÍCULO / MÁQUINA ═══ */}
      {<ModalVehiculo {...{avisarCerrar,bajaItem,flotaForm,flotaModal,saveVeh,setFlotaForm,setFlotaModal}}/>}

      {/* ═══ PÓLIZA DE SEGURO ═══ */}
      {<ModalPoliza {...{avisarCerrar,bajaItem,flota,polForm,polModal,polizas,savePoliza,setPolForm,setPolModal}}/>}

      {/* ═══ FICHA DE PROVEEDOR ═══ */}
      {<ModalFichaProveedor {...{BIC_ES,invoices,notify,provApplyAll,provForm,provModal,saveProv,setProvApplyAll,setProvForm,setProvModal}}/>}

      {/* ═══ ALTA / EDICIÓN DE OBRA ═══ */}
      {<ModalObra {...{avisarCerrar,deleteObra,obraDisplay,obraForm,obraModal,saveObra,setObraForm,setObraModal}}/>}

      {/* ═══ PROGRESO DEL LOTE ═══ */}
      {<ModalLoteEscaneo {...{batchCancelRef,batchFiles,batchReviewIdx,batchTipo,lotePagadas,registerAllBatch,setBatchFiles,setLotePagadas,startBatchReview}}/>}

      {/* ═══ VISOR DE FACTURA / PRESUPUESTO ═══ */}
      {docPreview&&(
        <div id="bh-lupa" ref={lupaRef} style={{position:'absolute',top:0,bottom:0,background:'rgba(0,0,0,.85)',zIndex:55,display:'flex',flexDirection:'column',paddingTop:'env(safe-area-inset-top)',paddingBottom:'env(safe-area-inset-bottom)',maxWidth:1100,left:'50%',transform:'translateX(-50%)',width:'100%'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 10px',flexShrink:0}}>
            <div style={{fontSize:12,color:'#fff',fontWeight:600,opacity:.8}}>📄 {docPreview.filename}</div>
            <button style={{background:'rgba(255,255,255,.2)',border:'none',color:'#fff',fontSize:13,cursor:'pointer',padding:'6px 16px',borderRadius:20,fontWeight:600}} onClick={()=>setDocPreview(null)}>✕ Cerrar</button>
          </div>
          <div style={{flex:1,overflow:'hidden',margin:'0 4px',borderRadius:8,background:'#fff'}}>
            <iframe srcDoc={docPreview.html} style={{width:'100%',height:'100%',border:'none',background:'#fff'}} title="Vista previa"/>
          </div>
          <div style={{padding:'8px 4px',display:'flex',gap:6,flexShrink:0}}>
            {docPreview.makePdf&&<button style={{flex:'1 1 auto',background:'#4CAF50',color:'#fff',border:'none',borderRadius:10,padding:'14px',fontSize:15,fontWeight:700,cursor:'pointer'}} onClick={()=>{
              try{
                const blob=docPreview.makePdf();
                shareOrDownload(blob, docPreview.filename+'.pdf', 'application/pdf').then(r=>{
                  if(r==='downloaded')notify('PDF descargado — mira el icono ↓ de Safari o la app Archivos');
                  else if(r==='shared')notify('PDF compartido');
                  else if(r==='failed')notify('No se pudo exportar el PDF','error');
                });
              }catch(e){console.error('PDF error:',e);notify('Error generando PDF — usa el botón HTML','error');}
            }}>📄 Compartir PDF</button>}
            <button style={{flex:docPreview.makePdf?'0 0 auto':'1 1 auto',background:'rgba(255,255,255,.15)',color:'#fff',border:'none',borderRadius:10,padding:'14px 16px',fontSize:14,cursor:'pointer'}} onClick={()=>{
              shareOrDownload(docPreview.html, docPreview.filename+'.html', 'text/html').then(r=>{
                if(r==='downloaded')notify('Descargado — mira el icono ↓ de Safari o la app Archivos');
                else if(r==='shared')notify('Compartido');
                else if(r==='failed')notify('No se pudo exportar — usa el botón Copiar','error');
              });
            }}>🌐 HTML</button>
            <button style={{flex:'0 0 auto',background:'rgba(255,255,255,.15)',color:'#fff',border:'none',borderRadius:10,padding:'14px 16px',fontSize:14,cursor:'pointer'}} onClick={()=>{
              navigator.clipboard?.writeText(docPreview.html).then(()=>notify('HTML copiado — pégalo en Notas o Mail')).catch(()=>notify('No se pudo copiar','error'));
            }}>📋</button>
            <button style={{flex:'0 0 auto',background:'rgba(255,255,255,.15)',color:'#fff',border:'none',borderRadius:10,padding:'14px 18px',fontSize:13,cursor:'pointer'}} onClick={()=>setDocPreview(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {/* Employee Form Modal */}
      {fichaEmp&&(()=>{
        const emp=employees.find(e=>e.id===fichaEmp);
        if(!emp)return null;
        const nifE=normNIF(emp.nif||'');
        const regs=nominasMes.flatMap(x=>(x.items||[]).filter(i=>i.empId===emp.id||(nifE&&normNIF(i.nif||'')===nifE)).map(i=>({per:x.per,fuente:x.fuente||'pdf',...i}))).sort((a,b)=>String(b.per).localeCompare(String(a.per)));
        const año=String(new Date().getFullYear());
        const delAño=regs.filter(r=>String(r.per||'').startsWith(año));
        const sum=(l,k)=>l.reduce((s,r)=>s+(+r[k]||0),0);
        const pagadoReg=invoices.filter(i=>i.tipo==='personal'&&i.proveedor===emp.nombre&&String(i.fecha||'').startsWith(año)).reduce((s,i)=>s+(+i.total||0),0);
        return(
          <div style={S.overlay} onClick={avisarCerrar}>
            <div style={{...S.card,maxWidth:520,width:'100%',maxHeight:'86dvh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
              <div style={{...S.cabModal,display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:8}}>
                <div>
                  <div style={{fontWeight:800,fontSize:15}}>👷 {emp.nombre}</div>
                  <div style={{fontSize:10,color:C.mt}}>{emp.categoria||'sin categoría'}{emp.activo===false?' · ⏸ inactivo':''}{(typeof window!=='undefined'&&window.__BH10_MULTI&&window.BH10_EMPRESA)?' · '+(window.BH10_EMPRESA.nombre||''):''}</div>
                </div>
                <button style={S.ghost} onClick={()=>setFichaEmp(null)}>✕</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 10px',fontSize:11,marginBottom:10}}>
                <div><span style={{color:C.mt}}>NIF: </span><b style={{fontFamily:'monospace'}}>{emp.nif||'—'}</b></div>
                <div><span style={{color:C.mt}}>NSS: </span><b style={{fontFamily:'monospace'}}>{emp.nss||'—'}</b></div>
                <div style={{gridColumn:'1 / -1'}}><span style={{color:C.mt}}>IBAN: </span><b style={{fontFamily:'monospace'}}>{emp.iban||'—'}</b></div>
                {(emp.direccion||emp.cp)&&<div style={{gridColumn:'1 / -1'}}><span style={{color:C.mt}}>Dirección: </span>{emp.direccion} {emp.cp}</div>}
              </div>
              <div style={{background:C.bg,borderRadius:10,padding:'8px 10px',marginBottom:8}}>
                <div style={{fontSize:10,fontWeight:700,color:C.in,marginBottom:4}}>ACUMULADO {año} · {delAño.length} mes{delAño.length!==1?'es':''}</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'3px 10px',fontSize:11}}>
                  <div><span style={{color:C.mt}}>Líquido pagado: </span><b>{fmt(sum(delAño,'liq'))} €</b></div>
                  <div><span style={{color:C.mt}}>Devengado: </span><b>{fmt(sum(delAño,'dev'))} €</b></div>
                  <div><span style={{color:C.mt}}>IRPF retenido: </span><b>{fmt(sum(delAño,'irC'))} €</b></div>
                  <div><span style={{color:C.mt}}>SS trabajador: </span><b>{fmt(sum(delAño,'ss'))} €</b></div>
                  {(()=>{const cs=delAño.map(costeEmpresaDe);const tot=cs.reduce((s,x)=>s+x.valor,0);const est=cs.some(x=>x.estimado);return(
                    <div><span style={{color:C.mt}}>Coste empresa: </span><b>{fmt(tot)} €</b>{est&&<span style={{fontSize:9,color:C.wn}}> ≈</span>}</div>
                  );})()}
                  <div><span style={{color:C.mt}}>Registrado en gastos: </span><b>{fmt(pagadoReg)} €</b></div>
                </div>
              </div>
              {regs.length>0?(
                <div style={{maxHeight:170,overflowY:'auto',marginBottom:10}}>
                  {regs.slice(0,18).map((r,ix)=>(
                    <div key={ix} style={{display:'flex',justifyContent:'space-between',gap:8,padding:'4px 0',borderBottom:`1px solid ${C.bd}`,fontSize:11}}>
                      <span><b>{r.per}</b><span style={{color:C.mt}}> · IRPF {fmt(+r.irC||0)} € · SS {fmt(+r.ss||0)} €{r.fuente==='remesa'?' · solo líquido':''}</span></span>
                      <b>{fmt(+r.liq||0)} €</b>
                    </div>
                  ))}
                </div>
              ):(
                <div style={{fontSize:11,color:C.mt,marginBottom:10}}>Sin nóminas registradas — importa el PDF del mes o genera una remesa.</div>
              )}
              <button style={S.btn(C.in)} onClick={()=>{setFichaEmp(null);openEditEmp(emp);}}>✏️ Editar ficha</button>
            </div>
          </div>
        );
      })()}
      {<ModalEmpleado {...{editingEmp,empForm,saveEmp,setEmpForm,setShowEmpForm,setVerEmbargoEmp,showEmpForm}}/>}

      {/* Payroll Generation Modal */}
      {<ModalSepaNominas {...{embExcl,employees,generatePayroll,nomExcl,obrasAll,payrollAmounts,payrollConcepto,payrollDate,payrollObras,payrollRegister,payrollSoloPDF,setEmbExcl,setNomExcl,setPayrollAmounts,setPayrollConcepto,setPayrollDate,setPayrollObras,setPayrollRegister,setPayrollSoloPDF,setShowPayroll,showPayroll}}/>}

      {/* SEPA Generation Modal */}
      {<ModalSepaC34 {...{avisarCerrar,compCfg,generateSEPA,getSupplierData,impRemesa,invoices,openProvModal,selected,sepaDate,sepaSustituir,setSepaSustituir,setSepaDate,setShowSepa,toggleSelect,setView,showSepa}}/>}
      {<ModalConfirmarBorrado {...{avisarCerrar,confirmDel,deleteInvoice,setConfirmDel}}/>}
      </main>

      {/* ═══ BARRA DE NAVEGACIÓN INFERIOR ═══ */}
      <div id="bh-tabbar" style={{background:C.sf,borderTop:`1px solid ${C.bd}`,display:'flex',zIndex:50,
        height:ALTO_TAB,paddingBottom:SAFE_B,boxShadow:'0 -2px 12px rgba(0,0,0,.35)',flexShrink:0,
        transform:`translateY(${TAB_OFF})`,marginTop:`calc(-1 * ${TAB_OFF})`}}>
        {[['dashboard','📊','Panel'],['facturas','📋','Facturas'],['contratos','🏗','Obras'],['tesoreria','🏦','Tesorería'],['nominas','👷','Plantilla'],['config','⚙️','Ajustes']].filter(([k])=>k==='tesoreria'?(puedeVer('facturas')||puedeVer('nominas')||puedeVer('contratos')||puedeVer('seguros')):(!AREA_DE_VISTA[k]||puedeVer(AREA_DE_VISTA[k]))).map(([k,ic,l])=>(
          <button key={k} onClick={()=>irPestana(k)} style={{flex:1,background:'transparent',border:'none',cursor:'pointer',padding:'6px 2px 4px',display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
            <span style={{fontSize:`calc(${TAB_H} * .38)`,lineHeight:1,filter:(k==='tesoreria'?enTesoreria:(view===k&&!enTesoreria))?'none':'grayscale(55%) opacity(.75)'}}>{ic}</span>
            <span style={{fontSize:`calc(${TAB_H} * .19)`,lineHeight:1.1,fontWeight:(k==='tesoreria'?enTesoreria:(view===k&&!enTesoreria))?700:500,color:(k==='tesoreria'?enTesoreria:(view===k&&!enTesoreria))?C.ac:C.mt,
              whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'100%'}}>{l}</span>
          </button>
        ))}
      </div>
      {/* ═══ BOTÓN + CON ACCIONES RÁPIDAS ═══ */}
      {!ES_APP&&<div style={{position:'absolute',left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:1100,bottom:ALTO_TAB,zIndex:60,background:'#3a2a05',color:'#F59E0B',fontSize:10,fontWeight:800,textAlign:'center',padding:'5px 8px'}}>🧪 MODO PRUEBA · datos locales, sin nube · tu app real está en bh10group.com/app/</div>}
      {ES_APP&&(()=>{
        const st=(typeof window!=='undefined'&&window.storage&&typeof window.storage.getStatus==='function')?window.storage.getStatus():null;
        if(!st||!st.fase||st.fase==='ok')return null;
        const conflicto=st.fase==='conflicto';
        return <div style={{position:'absolute',left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:1100,bottom:ALTO_TAB,zIndex:60,background:conflicto?'#4a2a05':'#4a1010',color:conflicto?'#FCD34D':'#FCA5A5',fontSize:11,fontWeight:800,textAlign:'center',padding:'6px 8px'}}>{conflicto?'⚠️ CONFLICTO: otro dispositivo tiene datos más nuevos — recarga desde la nube':'⚠️ SIN CONEXIÓN CON LA NUBE — trabajando en local, no se sincroniza'}</div>;
      })()}
      {!esLector()&&fabOpen&&<div style={{position:'absolute',inset:0,zIndex:54,background:'rgba(0,0,0,.35)'}} onClick={()=>setFabOpen(false)}/>}
      <div style={{position:'absolute',right:14,bottom:SOBRE_TAB(10),zIndex:55,display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8}}>
        {!esLector()&&fabOpen&&[['📥 Factura recibida',()=>openNew('factura')],['📤 Factura emitida',()=>openNew('cobro')],['⏩ Anticipo',()=>openNew('anticipo')],['🏢 Traspaso entre empresas',()=>{setTraspForm({empresaId:'',beneficiario:'',concepto:CONCEPTO_POR_DEFECTO,importe:''});setTraspModal('new');}],['📄 Leer nóminas',()=>{setView('nominas');setNomView('pdf');}]].map(([l,fn])=>(
          <button key={l} onClick={()=>{setFabOpen(false);fn();}} style={{background:C.sf,color:C.tx,border:`1px solid ${C.bd}`,borderRadius:10,padding:'11px 14px',fontSize:13,fontWeight:600,cursor:'pointer',boxShadow:'0 4px 14px rgba(0,0,0,.45)'}}>{l}</button>
        ))}
        {!esLector()&&<button onClick={()=>setFabOpen(o=>!o)} style={{width:54,height:54,borderRadius:27,border:'none',background:C.ac,color:'#0a2416',fontSize:26,fontWeight:800,cursor:'pointer',boxShadow:'0 6px 18px rgba(0,0,0,.5)',lineHeight:1}}>{fabOpen?'✕':'+'}</button>}
      </div>
      {toast&&<div style={{position:'absolute',bottom:SOBRE_TAB(24),left:'50%',transform:'translateX(-50%)',background:toast.t==='error'?C.dn:C.sc,color:'#fff',padding:'8px 18px',borderRadius:10,fontSize:12,fontWeight:600,zIndex:100,boxShadow:'0 4px 20px rgba(0,0,0,.3)'}}>{toast.m}</div>}
    </div>
  );
}

const AppConRed=()=>React.createElement(LimiteErrores,null,React.createElement(React.Fragment,null,React.createElement(App),DEBUG_LAYOUT?React.createElement(DebugHUD):null));
export default AppConRed;
// Puerta de pruebas: expone las funciones puras de cálculo para poder
// comprobarlas una a una. La app no las consume por aquí.
// Segunda tanda expuesta para poder someterla a la batería de robustez
export const __internos2={ModalFormFactura,ModalPagoFactura,ModalFicheroBanca,ModalExtractosN43,ModalVehiculo,ModalPoliza,ModalObra,ModalEmpleado,ModalConfirmarBorrado,ModalFichaProveedor,ModalSepaNominas,ModalSepaC34,ModalRepartoNominas,ModalLoteEscaneo,ApartadoAj,ConfigAj,identificarAj,temaPorId,fmt,fmtK,uid,listaLecturas,normLineas,parseJSONTolerante,seqSerie,siguienteSerie,normNumDoc,provEnTexto,normNIF,tokensNombre,pctLineasCert,lineasCertificacion,costeEmpresaDe,mezclaMesNominas,inferISP,normIban,restoIban,dcCCC,normNif,puedeEnviarNominaBase,hallarProforma,daysBetween,fmtDate,pct,diasEntre,vfNif,vfSistema,limpiaTxt,xe,vfXmlEncadenamiento,calcTotals,escXml,parseNum,daysTo,vencColor,vencTxt,partirBackup,reensamblarPartes,normTxtDup,normNumFra,tokensProv,provParecido,levDist,inferCatProv,obraDisplay,xlsNorm,xlsToISO,parseExcelRows,sepaId,pdfNorm,pdfEnc,pdfCharW,pdfTextW,normMaterial,lineasDeFactura,agruparLineas,evolucionPrecios,resumenPrecios,dkey,esLector,hayDatos,permitirSiembra,nubeConfirmada,empActiva,esStandalone};
export const __internos={vfCargarQR,vfQrModulos,vfDatosPdf,buildInvoicePdf,fusionaCliente,normalizaMayusculas,previsionTesoreria,vfPlanReintento,resumen303,csv303,basesDe,mapearLectura,cuadraFactura,problemaIban,reparaIban,normIban,normNif,parseNum,inferISP,CATS,IVAS,IRPFS,estadoRetencion,resumenRetenciones,textoReclamacion,vfQrDataUrl,REC,esCopiaV9,resumenCopiaV9,diasDesde,imitaNumero,previsionTesoreria,textoDeResumen,lineasPromoPdf,filasPromoExcel,fusionaPromo,agrupaPromo,sanitizaResumen,mejorRemitente,extraeDominio,dominioSospechoso,nominaVieja,embargosDe,cuentaDesconocida,transferenciasEmbargo,calcEmbargo607,reparaIban,CERT_VF_CADUCA,avisoCertVf,esGastoFiscal,esDeudaProveedor,fechaSegura,parteYaExtra,parteExtra,estaPartida,contratosDeCliente,importeContratos,cotitularesSinFicha,BAJAR_MAX,TAB_MIN,TAB_MAX,TAB_DEF,baseFactura,mismaObra,candidatasExtra,facturasYaExtra,proveedoresDeExtras,extrasSinAsignar,ESTADOS_EXTRA,PRUEBAS_EXTRA,extrasDeContrato,facturasDeExtra,costeExtra,precioExtra,extraPorProveedor,resumenExtras,extraDeFactura,ORDENES,filtrarPolizas,ordenarPolizas,cuentaPolizas,uidDeRuta,parecidoNombre,leerContactos,cambiosContacto,horasDeRegistros,cuadreDia,DIAS_SEMANA,JORNADA_VACIA,letraDia,horasSemanales,jornadaPrevista,CODIGOS_PLAN,leerTurno,leerPlanificacion,resumenPlan,vehiculosACopiar,polizaDeVehiculo,leerFilasPolizas,migrarSegurosDeFlota,RAMOS,PERIODOS,claveRiesgo,riesgosDuplicados,primaAnual,pagosSeguros,diasAVencer,claveExpediente,expedienteNotaria,PLAZO_RESPUESTA_DIAS,diasParaResponder,planSupresion,titularesContrato,nombresTitulares,CAMPOS_FICHA,compararFichas,fusionar,CESION_CAMPOS,cesionVigente,clientesCedibles,filaCesion,PLAZOS,mesesDesde,ultimoUsoCliente,descartesDeCarga,esAnulada,vivas,esAbono,abonosDe,importeAbonado,vfSemaforo,vfUrlCotejoFactura,VF_LUCES,vfBloqueFactura,vfExportarXml,vfExportarCsv,vfActivo,vfDebeRegistrar,vfCambiarConfig,vfListoParaActivar,VF_CFG_POR_DEFECTO,vfPendientes,vfLoteAEnviar,vfAplicarRespuesta,vfResumenEnvio,VF_ESTADOS,VF_MAX_LOTE,vfSobreSoap,vfLeerRespuesta,vfXmlRegistroAlta,vfXmlRegistroAnulacion,VF_NS,vfHuella,vfCadenaAlta,vfCadenaAnulacion,vfCadenaDe,vfCrearRegistroAlta,vfCrearRegistroAnulacion,vfVerificarCadena,vfDesglose,vfTipoFactura,vfProblemas,vfUrlCotejo,vfFecha,vfImporte,vfMarcaTemporal,vfCrearEvento,VF_LEYENDA,VF_COTEJO,costeEstimado,usoDeRespuesta,sumaUso,PRECIOS_IA,validarPropuestaEuribor,revisionesPendientes,cuadroFinanciacion,cuotaFrancesa,tipoEnFecha,euriborAplicable,saldoDispuesto,disponibleLinea,interesesPeriodo,sumaMeses,finLlevaIva,TIPOS_FIN,revisarRemesa,limpiaSepa,problemaBic,problemaFechaEjec,mapearLectura,normDesglose,calcDesglose,cuadraFactura,repararDesglose,TIPOS_IVA,construirAviso,enlaceWhatsApp,puedeAvisar,AVISO_POR_DEFECTO,emparejarEmpleado,cuadraNomina,matchEmpleado,prepararEnvioNomina,emailValido,normTelefonoES,esMovil,verificarPaginaNomina,puedeEnviarNomina,nifIgual,problemaIban,ibanOk,hallarDuplicada,esDupFuerte,describirCambio,describirArea,AREAS_HIST,fechaRegistroDe,crearGuardadoDiferido,indiceAnticipos,getTotalPagado,getSaldo,getEstado,getAnticiposAplicados,calcContratoTotal:null,parseN43,conciliaN43,ajustaFechasN43,sugerirFusiones,normProvNombre};
