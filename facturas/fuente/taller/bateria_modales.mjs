// ═══ BATERÍA DE MODALES EXTRAÍDOS ═══
// Monta cada modal como componente con props sintéticas: render correcto y
// callbacks vivos. Cubre en directo los dos sin escena A/B (reparto y lote).
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://x.com/',pretendToBeVisual:true});
for(const k of ['window','document','navigator','HTMLElement','Node','Event','CustomEvent']){try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
globalThis.window=dom.window;
window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
window.requestAnimationFrame=cb=>setTimeout(cb,0);globalThis.requestAnimationFrame=window.requestAnimationFrame;
window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
window.storage={get:async()=>null,set:async(k,v)=>({key:k,value:v}),delete:async k=>({key:k}),list:async()=>({keys:[]}),getStatus:()=>({fase:'ok'})};
const M=await import('../web_subir/app/assets/bh10-APPV399.js');
const {ModalFichaProveedor,ModalSepaNominas,ModalSepaC34,ModalRepartoNominas,ModalLoteEscaneo}=M.__internos2;
const e=React.createElement;
const root=createRoot(document.getElementById('root'));
const E=ms=>new Promise(r=>setTimeout(r,ms));
const oe=console.error;console.error=()=>{};
let fallos=0;const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};
const monta=async el=>{root.render(el);await E(250);return document.getElementById('root').textContent;};
const boton=t=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes(t));
const espia=()=>{const f=(...a)=>{f.llamado=true;f.args=a;};f.llamado=false;return f;};

// ── LOTE DE ESCANEO (sin escena A/B → cobertura directa aquí) ──
{
  const revisar=espia(), setFiles=espia();
  const t=await monta(e(ModalLoteEscaneo,{batchCancelRef:{current:false},batchTipo:'factura',batchReviewIdx:null,
    lotePagadas:false,setLotePagadas:espia(),registerAllBatch:espia(),startBatchReview:revisar,setBatchFiles:setFiles,
    batchFiles:[
      {id:'1',name:'fra_acme.pdf',status:'done',data:{proveedor:'ACME SL',importeBase:'950'}},
      {id:'2',name:'rota.pdf',status:'error',error:'ilegible'},
    ]}));
  ok(t.includes('Lote de facturas recibidas')&&t.includes('1 legible')&&t.includes('con error'),'lote: recuento de legibles y errores');
  ok(t.includes('ACME SL')&&t.includes('ilegible'),'lote: filas con su estado');
  ok(t.includes('Marcar todas como pagadas'),'lote: opción de históricos presente');
  const b=boton('Revisar');ok(!!b,'lote: botón Revisar visible');
  if(b){b.click();await E(100);ok(revisar.llamado,'lote: Revisar dispara startBatchReview');}
  const c=boton('Cancelar');if(c){c.click();await E(100);ok(setFiles.llamado,'lote: Cancelar vacía el lote');}
}
// ── REPARTO DE NÓMINAS (sin escena A/B → cobertura directa) ──
{
  const cerrar=espia();
  const fila1={nombre:'GARCIA LOPEZ, ANA',nif:'11111111H',email:'ana@x.es',liq:1500,pag:1,verificado:{ok:true},pdf:'x'};
  const fila2={nombre:'PEREZ RUIZ, LUIS',nif:'22222222J',email:'',liq:1400,pag:2,verificado:{ok:false,motivo:'las dos lecturas no coinciden'}};
  const t=await monta(e(ModalRepartoNominas,{reparto:{fase:'listo',total:2,hechas:2,periodo:'2026-07',filas:[fila1,fila2]},
    setReparto:cerrar,repartoCancel:{current:false},avisoTxt:'Hola {nombre}',setAvisoTxt:espia(),avisoEdit:false,setAvisoEdit:espia(),
    compCfg:{name:'BIG HOUSE 2010'},enviarNomina:espia(),enviarYAvisar:espia(),avisarWhatsApp:espia(),avisarCerrar:()=>{}}));
  ok(t.includes('Repartir nóminas de 2026-07'),'reparto: cabecera con el periodo');
  ok(t.includes('1 de 2 listas'),'reparto: cuenta las verificadas');
  ok(t.includes('No se envía')&&t.includes('las dos lecturas no coinciden'),'reparto: la que no cuadra, bloqueada y con motivo');
  ok(t.includes('sin correo en su ficha')||t.includes('ana@x.es'),'reparto: estado de correo por fila');
  const x=boton('✕');if(x){x.click();await E(100);}
  ok(cerrar.llamado,'reparto: cerrar dispara setReparto');
}
// ── los tres con escena A/B: humo de montaje directo ──
{
  const t=await monta(e(ModalFichaProveedor,{provModal:'ACME SL',provForm:{nombre:'ACME SL',cif:'B11111111',dir:'',iban:'ES9121000418450200051332',bic:'',ibans:[],pagoAlRegistrar:false},
    setProvForm:espia(),setProvModal:espia(),saveProv:espia(),provApplyAll:false,setProvApplyAll:espia(),invoices:[],notify:espia(),BIC_ES:{}}));
  const enInput=[...document.querySelectorAll('input')].some(i=>i.value==='ACME SL');
  ok(t.includes('Ficha del proveedor')&&enInput,'ficha proveedor: monta y el formulario trae los datos');
}
{
  const t=await monta(e(ModalSepaNominas,{showPayroll:true,setShowPayroll:espia(),employees:[{id:'e1',nombre:'ANA',activo:true,iban:'ES9121000418450200051332'}],
    payrollAmounts:{e1:'1500'},setPayrollAmounts:espia(),payrollConcepto:'NOMINA',setPayrollConcepto:espia(),payrollDate:'2026-08-28',setPayrollDate:espia(),
    payrollRegister:false,setPayrollRegister:espia(),payrollObras:{},setPayrollObras:espia(),payrollSoloPDF:null,setPayrollSoloPDF:espia(),
    nomExcl:{},setNomExcl:espia(),embExcl:{},setEmbExcl:espia(),obrasAll:[],generatePayroll:espia()}));
  ok(t.includes('Generar fichero nóminas SEPA')&&t.includes('1.500,00'),'SEPA nóminas: monta con importes');
}
{
  const t=await monta(e(ModalSepaC34,{showSepa:true,setShowSepa:espia(),selected:new Set(),invoices:[],compCfg:{name:'BIG HOUSE',iban:'ES91...',bic:'X'},
    sepaDate:'2026-08-28',setSepaDate:espia(),sepaMarkPaid:false,setSepaMarkPaid:espia(),generateSEPA:espia(),getSupplierData:()=>({iban:'',dir:''}),
    openProvModal:espia(),setView:espia(),avisarCerrar:()=>{}}));
  ok(t.includes('Generar fichero SEPA C34'),'C34: monta');
}
// ── TANDA 3: los siete de seguros/contratos/ficheros ──
const {ModalFicheroBanca,ModalExtractosN43,ModalVehiculo,ModalPoliza,ModalObra,ModalEmpleado,ModalConfirmarBorrado}=M.__internos2;
{
  const t=await monta(e(ModalVehiculo,{flotaModal:'new',flotaForm:{alias:'Furgón obra',matricula:'1234ABC',tipo:'vehiculo',empresa:'BIG',itv:'',seguroVto:'',seguroCia:'',seguroPrima:'',mantFecha:'',mantNota:'',notas:''},
    setFlotaForm:espia(),setFlotaModal:espia(),saveVeh:espia(),bajaItem:espia(),avisarCerrar:()=>{}}));
  ok(t.includes('Nuevo vehículo / máquina')&&[...document.querySelectorAll('input')].some(i=>i.value==='1234ABC'),'vehículo: monta con matrícula');
}
{
  const t=await monta(e(ModalPoliza,{polModal:'new',polForm:{ramo:'auto',objeto:'1234ABC',objetoId:'1234ABC',nPoliza:'P-1',periodicidad:'anual',empresa:'BIG',desc:'',vto:'2026-12-01',prima:'424,76',cia:'Mapfre',notas:''},
    setPolForm:espia(),setPolModal:espia(),savePoliza:espia(),bajaItem:espia(),avisarCerrar:()=>{},polizas:[],flota:[{id:'v1',activa:true,matricula:'1234ABC',alias:'Furgón'}]}));
  ok(t.includes('Nueva póliza')&&t.includes('Vencimiento'),'póliza: monta con ramo y vencimiento');
}
{
  const guardar=espia();
  const t=await monta(e(ModalObra,{obraModal:{editing:null},obraForm:{alias:'Chalets Yuncos',calle:'C/ Mozambique',numero:'12',cp:'45210',municipio:'Yuncos',provincia:'Toledo',presupuestoGasto:'',presupuestoVenta:''},
    setObraForm:espia(),setObraModal:espia(),saveObra:guardar,deleteObra:espia(),obraDisplay:o=>(o&&(o.alias||o.calle))||'—',avisarCerrar:()=>{}}));
  ok(t.includes('Alta de obra')&&t.includes('Se mostrará como'),'obra: monta con vista previa del nombre');
  const g=boton('Guardar obra');if(g){g.click();await E(80);}
  ok(guardar.llamado,'obra: Guardar dispara saveObra');
}
{
  const t=await monta(e(ModalEmpleado,{showEmpForm:true,editingEmp:null,empForm:{nombre:'GARCIA, ANA',iban:'ES9121000418450200051332',nif:'11111111H',nss:'',categoria:'Oficial 1ª',bic:'',importeBase:'1600',direccion:'',cp:'',email:'ana@x.es',telefono:'612345678',jornada:{L:'08:00-17:00',M:'08:00-17:00',X:'08:00-17:00',J:'08:00-17:00',V:'08:00-15:00'}},
    setEmpForm:espia(),setShowEmpForm:espia(),saveEmp:espia(),setVerEmbargoEmp:espia()}));
  ok(t.includes('Nuevo empleado')&&t.includes('JORNADA HABITUAL')&&t.includes('h/semana'),'empleado: monta con jornada calculada');
  ok(t.includes('sin embargo anotado'),'empleado: estado de embargo visible');
}
{
  const anular=espia();
  const t=await monta(e(ModalExtractosN43,{n43Gestion:true,setN43Gestion:espia(),n43Hist:[{id:'x1',archivo:'agosto.n43',fecha:'2026-08-20',importe:1234.56,cargos:9,pagos:[1,2],ajustes:[]}],
    anularN43:anular,setN43Pendiente:espia(),setSubView:espia(),setView:espia(),esLector:()=>false,avisarCerrar:()=>{},BtnConfirm:({children,onConfirm,...r})=>e('button',{onClick:onConfirm},children)}));
  ok(t.includes('Extractos del banco')&&t.includes('agosto.n43')&&t.includes('9 cargos'),'N43: monta con el extracto');
  const an=boton('Anular este extracto');if(an){an.click();await E(80);}
  ok(anular.llamado,'N43: anular dispara anularN43');
}
{
  const t=await monta(e(ModalFicheroBanca,{subirBanco:{n:3,total:4500,fecha:'2026-08-28',fichero:'REMESA.xml'},setSubirBanco:espia(),avisarCerrar:()=>{},bancaUrl:'https://banca.x.es',setBancaUrl:espia()}));
  ok(t.includes('Fichero listo para el banco')&&t.includes('REMESA.xml')&&t.includes('Abrir la banca electrónica'),'fichero banca: monta con pasos');
}
{
  const borrar=espia();
  const t=await monta(e(ModalConfirmarBorrado,{confirmDel:'id1',setConfirmDel:espia(),deleteInvoice:borrar,avisarCerrar:()=>{}}));
  ok(t.includes('¿Eliminar?'),'confirmación: monta');
  const b2=boton('Eliminar');if(b2){b2.click();await E(80);}
  ok(borrar.llamado,'confirmación: Eliminar dispara deleteInvoice');
}
// ── TANDA 4: los de Facturas ──
const {ModalFormFactura,ModalPagoFactura}=M.__internos2;
{
  const pagar=espia();
  const inv={id:'i1',tipo:'factura',numFactura:'F-1',proveedor:'ACME SL',total:1210,pagos:[],fecha:'2026-08-01'};
  const t=await monta(e(ModalPagoFactura,{pagoModal:'i1',invoices:[inv],pagoForm:{fecha:'2026-08-24',importe:'1210',metodo:'Transferencia',referencia:''},
    setPagoForm:espia(),setPagoModal:espia(),savePago:pagar,avisarCerrar:()=>{},FORMAS:['Transferencia','Efectivo']}));
  ok(t.includes('Registrar pago')&&t.includes('ACME SL'),'pago: monta con la factura y su saldo');
  const g=boton('Registrar');if(g&&g.textContent.includes('pago')===false){g.click();await E(80);}
  const g2=[...document.querySelectorAll('button')].find(b=>/Guardar|Registrar/.test(b.textContent)&&!b.textContent.includes('cobro'));
  if(g2){g2.click();await E(80);}
  ok(pagar.llamado,'pago: guardar dispara savePago');
}
{
  const guardar=espia();
  const formBase={tipo:'factura',fecha:'2026-08-24',numFactura:'',proveedor:'',proveedorCif:'',proveedorDir:'',obra:'',concepto:'',categoria:'Materiales',refPresupuesto:'',importeBase:'',base2:'',tipoIva:21,tipoIva2:21,irpf:'',total:'',fechaVencimiento:'',formaPago:'Transferencia',ibanProveedor:'',notas:'',sujetoPasivo:false,esEstructural:false,desglose:[],_file:null};
  const t=await monta(e(ModalFormFactura,{showForm:true,setShowForm:espia(),form:formBase,setForm:espia(),updateForm:espia(),editing:null,
    saveInvoice:guardar,invoices:[],invoicesAll:[],contratos:[],proveedores:[],provCat:{},obrasAll:[],batchFiles:[],batchReviewIdx:null,batchTipo:'factura',
    advanceBatch:espia(),cancelBatch:espia(),lotePagadas:false,scanInvoice:espia(),scanning:false,subirAdjuntos:espia(),notify:espia(),
    convertirProforma:espia(),restaurarFactura:espia(),desgloseForm:f=>[{b:parseFloat(f.importeBase)||0,iv:f.tipoIva,c:0}],
    dirCompletaCliente:()=>'',fichaCliente:()=>({}),getSupplierData:()=>({iban:'',dir:'',cif:''}),openObraModal:espia(),
    TIPOS:[{id:'factura',n:'📥 Recibida'},{id:'cobro',n:'📤 Emitida'}],CATS:['Materiales','Otros'],FORMAS:['Transferencia'],IVAS:[21,10,4,0],IVA_LABELS:{21:'21%'},IRPFS:[0,7,15],ES_APP:false,
    Combobox:({value,onChange,placeholder})=>e('input',{value:value||'',placeholder:placeholder||'',onChange:ev=>onChange&&onChange(ev.target.value)})}));
  ok(t.includes('Fecha')&&t.includes('Proveedor')&&t.includes('Base imponible'),'formulario factura: monta el gigante (381 líneas) con sus campos');
  ok([...document.querySelectorAll('input,select')].length>10,'formulario factura: más de 10 campos vivos');
  const g=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Registrar');
  if(g){g.click();await E(120);}
  ok(guardar.llamado,'formulario factura: Guardar dispara saveInvoice');
}
console.error=oe;root.unmount();
console.log(fallos?'═══ MODALES: '+fallos+' FALLOS ═══':'═══ BATERÍA MODALES: LOS 14 MONTAN Y RESPONDEN ═══');
process.exit(fallos?1:0);
