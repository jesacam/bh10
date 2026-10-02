// ═══ MODALES · piezas extraídas del monolito (props enumeradas por AST) ═══
// Extraídos de app.jsx con análisis de variables libres por AST: el JSX es
// VERBATIM y las props son exactamente los nombres del cierre de App que cada
// modal usaba. Extraer nunca cambia comportamiento: el A/B lo certifica.
import React from "react";
import {C,S,CAPAS} from './estetica';
import {CESION_CAMPOS,PLAZOS,filaCesion,mesesDesde} from './rgpd';
import {TIPOS_FIN,finLlevaIva} from './financiacion';
import {sanitizaResumen,textoDeResumen} from './ia';
import * as XLSX from 'xlsx';
import {agrupaPromo,filasPromoExcel,lineasPromoPdf} from './promociones';
import {hallarProforma} from './certificaciones';
import {TIPOS_IVA,VF_ESTADOS,normDesglose} from './verifactu';
import {calcDesglose} from './desglose';
import {DIAS_SEMANA,JORNADA_VACIA,horasSemanales,leerTurno,normProvNombre} from './fichaje';
import {PERIODOS,RAMOS,claveRiesgo,primaAnual} from './polizas';
import {claveEmb,emailValido,embargosDe,ibanOk,nominaVieja,normIban,problemaIban,puedeEnviarNomina,transferenciasEmbargo} from './embargos';
import {fmt,fmtDate,parseNum,uid} from './basicos';
import {compararFichas,cuentaDesconocida,dominioSospechoso,esDupFuerte,fichasDeEnvio,hallarDuplicada,leerContactos,today} from './fichas';
import {esAnulada,getEstado,getSaldo} from './saldos';
import {construirAviso,esMovil,normTelefonoES,puedeAvisar} from './avisos';

const ModalFichaProveedor=({BIC_ES,invoices,notify,provApplyAll,provForm,provModal,saveProv,setProvApplyAll,setProvForm,setProvModal})=>(
  (provModal&&(
        <div style={S.overlay}>
          <div style={{...S.modal,maxWidth:460}} onClick={e=>e.stopPropagation()}>
            <div style={{...S.cabModal,display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <span style={{fontWeight:700,fontSize:15}}>🏪 Ficha del proveedor</span>
              <button onClick={()=>setProvModal(null)} style={{background:'none',border:'none',color:C.mt,cursor:'pointer',fontSize:18}}>✕</button>
            </div>
            <label style={{display:'block',marginBottom:8}}><span style={{fontSize:10,color:C.mt}}>Nombre / Razón social</span><input style={S.input} value={provForm.nombre} onChange={e=>setProvForm(p=>({...p,nombre:e.target.value}))}/></label>
            {provForm.nombre.trim()!==provModal&&<div style={{fontSize:10,color:C.wn,marginBottom:8,marginTop:-4}}>⚠ Al guardar se renombrará en todas sus facturas</div>}
            <label style={{display:'block',marginBottom:8}}><span style={{fontSize:10,color:C.mt}}>CIF / NIF</span><input style={S.input} value={provForm.cif} onChange={e=>setProvForm(p=>({...p,cif:e.target.value.toUpperCase()}))} placeholder="B12345678" maxLength={12}/></label>
            <label style={{display:'block',marginBottom:8}}><span style={{fontSize:10,color:C.mt}}>Dirección fiscal</span><input style={S.input} value={provForm.dir} onChange={e=>setProvForm(p=>({...p,dir:e.target.value}))} placeholder="Calle, CP, ciudad"/></label>
            <label style={{display:'block',marginBottom:8}}><span style={{fontSize:10,color:C.mt}}>IBAN (para ficheros SEPA)</span><input style={{...S.input,fontFamily:'monospace',fontSize:14}} value={provForm.iban} onChange={e=>setProvForm(p=>({...p,iban:e.target.value.toUpperCase()}))} placeholder="ES00 0000 0000 00 0000000000"/></label>
            {(()=>{const otras=(provForm.ibans||[]).filter(x=>normIban(x)!==normIban(provForm.iban||''));return(
              <div style={{marginBottom:8}}>
                {otras.length>0&&<div style={{fontSize:10,color:C.mt,marginBottom:4}}>Otras cuentas conocidas:</div>}
                {otras.map(x=>(
                  <span key={x} style={{display:'inline-flex',alignItems:'center',gap:4,margin:'0 6px 4px 0',padding:'3px 7px',borderRadius:8,border:`1px solid ${C.bd}`,fontSize:10,fontFamily:'monospace'}}>
                    ···{normIban(x).slice(-6)}
                    <button style={{background:'none',border:'none',color:C.sc,cursor:'pointer',fontSize:9,fontWeight:700}} title="Usar como principal" onClick={()=>setProvForm(p=>({...p,iban:x}))}>★ usar</button>
                    <button style={{background:'none',border:'none',color:C.dn,cursor:'pointer',fontSize:10}} onClick={()=>setProvForm(p=>({...p,ibans:(p.ibans||[]).filter(y=>normIban(y)!==normIban(x))}))}>×</button>
                  </span>
                ))}
                <div style={{display:'flex',gap:6,marginTop:4}}>
                  <input style={{...S.input,fontFamily:'monospace',fontSize:11,flex:1}} placeholder="＋ añadir otra cuenta (ES…)" value={provForm._nuevoIban||''} onChange={e=>setProvForm(p=>({...p,_nuevoIban:e.target.value.toUpperCase()}))}/>
                  <button style={S.sm(C.in)} onClick={()=>setProvForm(p=>{const nb=normIban(p._nuevoIban);if(!nb||nb.length<15){notify('IBAN incompleto','error');return p;}return {...p,_nuevoIban:'',ibans:[...new Set([...(p.ibans||[]).map(normIban),nb])]};})}>Añadir</button>
                </div>
              </div>);})()}
            <label style={{display:'block',marginBottom:12}}><span style={{fontSize:10,color:C.mt}}>BIC/SWIFT <span style={{color:C.mt+'99'}}>(opcional — se deduce del IBAN en bancos conocidos)</span></span><input style={{...S.input,fontFamily:'monospace',fontSize:14}} value={provForm.bic} onChange={e=>setProvForm(p=>({...p,bic:e.target.value.toUpperCase()}))} placeholder="BSCHESMM" maxLength={11}/>{!provForm.bic&&BIC_ES[(provForm.iban||'').replace(/\s/g,'').slice(4,8)]&&<span style={{fontSize:10,color:C.sc}}>✓ Se usará {BIC_ES[(provForm.iban||'').replace(/\s/g,'').slice(4,8)]}</span>}</label>
            {/* Proveedores que se cobran solos: recibos domiciliados, contado,
                tarjeta. Sus facturas nacen pagadas y no ensucian el pendiente. */}
            {(()=>{const p=provForm.iban?problemaIban(provForm.iban):'';return p?(
              <div style={{background:C.dn+'14',border:`1px solid ${C.dn}55`,borderRadius:8,padding:'8px 10px',marginBottom:8,fontSize:11,color:C.dn}}>
                <b>⚠ Este IBAN no es válido:</b> {p}.
                <div style={{fontSize:10,color:C.mt,marginTop:2}}>El banco rechazaría la remesa entera. Compruébalo en una factura del proveedor antes de guardarlo.</div>
              </div>
            ):null;})()}
            <label style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,padding:'8px 10px',background:C.sc+'12',border:`1px solid ${C.sc}44`,borderRadius:8,cursor:'pointer'}}>
              <input type="checkbox" checked={!!provForm.pagoAlRegistrar} onChange={e=>setProvForm(p=>({...p,pagoAlRegistrar:e.target.checked}))} style={{width:20,height:20,accentColor:C.sc,flexShrink:0}}/>
              <div style={{fontSize:11}}><strong>Se paga solo</strong> — al escanear o registrar una factura suya vendrá <strong>ya marcada como pagada</strong>. Para domiciliados, contado o tarjeta.</div>
            </label>
            {provForm.pagoAlRegistrar&&(
              <label style={{display:'block',marginBottom:10}}>
                <span style={{fontSize:10,color:C.mt}}>Forma de pago que se anotará</span>
                <select style={S.select} value={provForm.metodoHabitual||'Transferencia'} onChange={e=>setProvForm(p=>({...p,metodoHabitual:e.target.value}))}>
                  {['Transferencia','Domiciliado','Efectivo','Tarjeta','Confirming','Pagaré','Préstamo promotor','Pago anticipado'].map(m=><option key={m} value={m}>{m}</option>)}
                </select>
              </label>
            )}
            <label style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,padding:'8px 10px',background:C.in+'12',border:`1px solid ${C.in}33`,borderRadius:8,cursor:'pointer'}}>
              <input type="checkbox" checked={provApplyAll} onChange={e=>setProvApplyAll(e.target.checked)} style={{width:20,height:20,accentColor:C.in,flexShrink:0}}/>
              <div style={{fontSize:11}}>Aplicar CIF, dirección e IBAN a las <strong>{invoices.filter(i=>i.proveedor===provModal).length} facturas existentes</strong> de este proveedor</div>
            </label>
            <div style={{fontSize:10,color:C.mt,marginBottom:12}}>La ficha también autocompleta futuras facturas y alimenta el fichero SEPA.</div>
            <div style={{display:'flex',gap:8}}>
              <button style={{...S.btn(C.sc),flex:1}} onClick={saveProv}>💾 Guardar ficha</button>
              <button style={S.ghost} onClick={()=>setProvModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      ))||null
);

const ModalSepaNominas=({embExcl,employees,generatePayroll,nomExcl,obrasAll,payrollAmounts,payrollConcepto,payrollDate,payrollObras,payrollRegister,payrollSoloPDF,setEmbExcl,setNomExcl,setPayrollAmounts,setPayrollConcepto,setPayrollDate,setPayrollObras,setPayrollRegister,setPayrollSoloPDF,setShowPayroll,showPayroll})=>(
  (showPayroll&&(()=>{
        const soloImportados=!!payrollSoloPDF;
        const active=soloImportados
          ? employees.filter(e=>payrollAmounts[e.id]!==undefined&&payrollAmounts[e.id]!=='')
          : employees.filter(e=>e.activo);
        const total=active.filter(e=>!nomExcl[e.id]).reduce((s,e)=>s+(parseNum(payrollAmounts[e.id])||0),0);
        const avisoPDF=soloImportados?<div style={{background:C.in+'18',border:`1px solid ${C.in}55`,borderRadius:8,padding:'7px 9px',marginBottom:8,fontSize:10,color:C.in}}>📄 Solo los <b>{active.length}</b> trabajadores del PDF importado, con sus importes. <button style={{background:'none',border:'none',color:C.in,textDecoration:'underline',cursor:'pointer',fontSize:10,fontWeight:700,padding:0}} onClick={()=>setPayrollSoloPDF(false)}>Ver toda la plantilla</button></div>:null;
        return(
          <div style={S.overlay}>
            <div style={{...S.modal,maxWidth:450}} onClick={e=>e.stopPropagation()}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:8}}>💶 Generar fichero nóminas SEPA</div>
                {avisoPDF}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                <label><span style={{fontSize:10,color:C.mt}}>Concepto</span><input style={S.input} value={payrollConcepto} onChange={e=>setPayrollConcepto(e.target.value)}/></label>
                <label><span style={{fontSize:10,color:C.mt}}>Fecha ejecución</span><input type="date" style={S.input} value={payrollDate} onChange={e=>setPayrollDate(e.target.value)}/></label>
              </div>
              <label style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,padding:'8px 10px',background:C.vt+'12',border:`1px solid ${C.vt}33`,borderRadius:8,cursor:'pointer'}}>
                <input type="checkbox" checked={payrollRegister} onChange={e=>setPayrollRegister(e.target.checked)} style={{width:20,height:20,accentColor:C.vt,flexShrink:0}}/>
                <div style={{fontSize:11}}><strong>Registrar coste de personal por obra</strong><div style={{color:C.mt,fontSize:10}}>Crea un registro 👷 pagado por cada empleado, imputado a la obra elegida (o a estructura)</div></div>
              </label>
              <div style={{fontSize:11,fontWeight:600,color:C.mt,marginBottom:4}}>Importes (editables)</div>
              <div style={{maxHeight:280,overflowY:'auto',marginBottom:10}}>
                {payrollRegister&&(
                  <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:6}}>
                    <span style={{fontSize:10,color:C.mt,flexShrink:0}}>Obra para todos:</span>
                    <select style={{...S.select,fontSize:16,padding:'6px 8px',minHeight:36}} value="" onChange={e=>{const v=e.target.value;if(v!=='')setPayrollObras(Object.fromEntries(active.map(x=>[x.id,v==='__none'?'':v])));}}>
                      <option value="">— elegir —</option>
                      <option value="__none">Sin obra (estructura)</option>
                      {obrasAll.map(o=><option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                )}
                {active.map(emp=>(
                  <div key={emp.id} style={{padding:'5px 0',borderBottom:`1px solid ${C.bd}22`,opacity:nomExcl[emp.id]?.6:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{flex:1,fontSize:12,fontWeight:500,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textDecoration:nomExcl[emp.id]?'line-through':'none'}}>{emp.nombre}</div>
                      {nomExcl[emp.id]
                        ?<><span style={{fontSize:10,color:C.dn,fontWeight:700}}>APARTADA</span>
                          <button type="button" style={{...S.sm(C.in),padding:'2px 8px',minHeight:0,fontSize:11,flexShrink:0}}
                            onClick={()=>setNomExcl(p=>{const q={...p};delete q[emp.id];return q;})}>↩</button></>
                        :<>
                          <input type="text" inputMode="decimal" style={{...S.input,width:100,textAlign:'right',fontWeight:700,flex:'0 0 100px'}} value={payrollAmounts[emp.id]||''} onChange={e=>setPayrollAmounts(p=>({...p,[emp.id]:e.target.value}))}/>
                          <span style={{fontSize:11,color:C.mt,flexShrink:0}}>€</span>
                          <button type="button" title="Apartar esta transferencia"
                            style={{...S.sm(C.dn),padding:'2px 9px',minHeight:0,fontSize:13,flexShrink:0}}
                            onClick={()=>setNomExcl(p=>({...p,[emp.id]:true}))}>×</button>
                        </>}
                    </div>
                    {payrollRegister&&(
                      <select style={{...S.select,fontSize:16,padding:'5px 8px',minHeight:34,marginTop:4}} value={payrollObras[emp.id]||''} onChange={e=>setPayrollObras(p=>({...p,[emp.id]:e.target.value}))}>
                        <option value="">🏢 Sin obra (estructura)</option>
                        {obrasAll.map(o=><option key={o} value={o}>🏗️ {o}</option>)}
                      </select>
                    )}
                  </div>
                ))}
              </div>
              <div style={{background:C.bg,borderRadius:8,padding:10,marginBottom:10,textAlign:'center'}}>
                {(()=>{
                  const activos=employees.filter(e=>e.activo&&!nomExcl[e.id]);
                  const todas=transferenciasEmbargo(activos.map(e=>({...e})),embExcl);
                  const fuera=[];
                  activos.forEach(e=>embargosDe(e).forEach(em=>{const k=claveEmb(e,em);if(embExcl[k])fuera.push({clave:k,nombre:e.nombre,ref:em.ref});}));
                  const ok=todas.filter(x=>!x.invalido&&!x.cancelado&&!x.descuadre);
                  const mal=todas.filter(x=>x.invalido), canc=todas.filter(x=>x.cancelado), desc=todas.filter(x=>x.descuadre);
                  if(!ok.length&&!mal.length&&!canc.length&&!fuera.length)return null;
                  return(
                  <div style={{border:`1.5px solid ${C.dn}55`,borderRadius:10,padding:'8px 10px',marginBottom:10,textAlign:'left'}}>
                    <div style={{fontSize:11,fontWeight:800,color:C.dn,marginBottom:6}}>⚖️ Transferencias de embargo que saldrán en esta remesa</div>
                    {ok.some(x=>nominaVieja(x.periodo,payrollDate||today))&&(
                      <div style={{background:'#EAB30818',border:'1.5px solid #EAB308',borderRadius:8,padding:'6px 9px',marginBottom:6,fontSize:10.5,lineHeight:1.45,color:'#EAB308',fontWeight:600}}>
                        ⚠️ La nómina leída parece ANTIGUA para esta remesa (Big House paga a fin de mes o primeros días del siguiente).
                        Si has pasado por el reparto el PDF de un mes ya remesado, vuelve a leer el del mes corriente antes de generar.
                      </div>
                    )}
                    {ok.map(x=>(
                      <div key={x.clave} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0',borderBottom:`1px solid ${C.mt}22`}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:11.5,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{x.beneficiario}</div>
                          <div style={{fontSize:10,color:C.mt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{x.nombre} · {x.ref} · nómina {x.periodo||'—'}</div>
                        </div>
                        <div style={{fontSize:13,fontWeight:800,whiteSpace:'nowrap'}}>{nominaVieja(x.periodo,payrollDate||today)&&<span title="nómina de un mes viejo" style={{marginRight:4}}>⚠️</span>}{fmt(x.importe)} €</div>
                        <button type="button" title="Apartar esta transferencia"
                          style={{...S.sm(C.dn),padding:'2px 9px',minHeight:0,fontSize:13,flexShrink:0}}
                          onClick={()=>setEmbExcl(p=>({...p,[x.clave]:true}))}>×</button>
                      </div>
                    ))}
                    {fuera.map(x=>(
                      <div key={x.clave} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0',opacity:.65}}>
                        <div style={{flex:1,fontSize:10.5,color:C.mt,textDecoration:'line-through',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{x.nombre} · {x.ref}</div>
                        <span style={{fontSize:10,color:C.dn,fontWeight:700}}>APARTADA</span>
                        <button type="button" style={{...S.sm(C.in),padding:'2px 8px',minHeight:0,fontSize:11,flexShrink:0}}
                          onClick={()=>setEmbExcl(p=>{const q={...p};delete q[x.clave];return q;})}>↩</button>
                      </div>
                    ))}
                    {canc.map((x,i)=><div key={'c'+i} style={{fontSize:10,color:C.mt,padding:'3px 0'}}>Ⓘ {x.nombre}: en su última nómina ({x.periodo||'—'}) ya no figura embargo — cancelado, no se transfiere</div>)}
                    {mal.map((x,i)=><div key={'m'+i} style={{fontSize:10,color:C.dn,padding:'3px 0'}}>⚠ {x.nombre}: {x.motivo} — no saldrá</div>)}
                    {desc.map((x,i)=><div key={'d'+i} style={{fontSize:10,color:C.dn,padding:'3px 0'}}>⚠ {x.nombre}: las diligencias suman {fmt(x.suma)} € y su nómina retiene {fmt(x.leido)} € — revisa antes de generar</div>)}
                  </div>);
                })()}
                <div style={{fontSize:10,color:C.mt}}>Total nóminas</div>
                <div style={{fontSize:22,fontWeight:800,color:C.ac}}>{fmt(total)} €</div>
                <div style={{fontSize:10,color:C.mt}}>{active.length} trabajador{active.length!==1?'es':''} · {payrollConcepto}</div>
              </div>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <button style={S.ghost} onClick={()=>setShowPayroll(false)}>Cancelar</button>
                <button style={S.btn(C.in)} onClick={generatePayroll}>Descargar XML SEPA</button>
              </div>
            </div>
          </div>
        );
      })())||null
);

const ModalSepaC34=({avisarCerrar,compCfg,generateSEPA,getSupplierData,impRemesa,invoices,openProvModal,selected,sepaDate,toggleSelect,sepaSustituir,setSepaSustituir,setSepaDate,setShowSepa,setView,showSepa})=>(
  (showSepa&&(()=>{
        const sel=invoices.filter(i=>selected.has(i.id));
        // v389 · el total y cada línea enseñan lo que VA A IR al banco (el importe
        // ajustado a mano si lo hay), no el saldo entero: antes repasabas 3.000 y la
        // ventana te enseñaba 9.100.
        const total=sel.reduce((s,i)=>s+impRemesa(i),0);
        const missingIBAN=sel.filter(i=>!(i.ibanProveedor?.replace(/\s/g,'')||getSupplierData(i.proveedor).iban.replace(/\s/g,'')));
        const missingDir=[...new Set(sel.filter(i=>!(i.proveedorDir||getSupplierData(i.proveedor).dir||'').trim()).map(i=>i.proveedor))];
        return(
          <div style={S.overlay} onClick={avisarCerrar}>
            <div style={{...S.modal,maxWidth:450}} onClick={e=>e.stopPropagation()}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:8}}>📄 Generar fichero SEPA C34.14</div>

              {(!compCfg.name||!compCfg.iban)?(
                <div style={{background:C.dn+'18',border:`1px solid ${C.dn}44`,borderRadius:8,padding:12,marginBottom:10}}>
                  <div style={{fontWeight:600,color:C.dn,fontSize:12,marginBottom:6}}>⚠ Configura tu empresa primero</div>
                  <div style={{fontSize:11,color:C.mt,marginBottom:8}}>Ve a Config e introduce el nombre, IBAN y BIC de la cuenta ordenante.</div>
                  <button style={S.btn(C.in)} onClick={()=>{setShowSepa(false);setView('config');}}>Ir a Config</button>
                </div>
              ):(
                <div>
                  <div style={{fontSize:11,color:C.mt,marginBottom:8}}>Ordenante: <span style={{color:C.tx,fontWeight:500}}>{compCfg.name}</span> · <span style={{fontFamily:'monospace',fontSize:10}}>{compCfg.iban}</span></div>
                  {(()=>{const lim=parseNum(compCfg.sepaLimite)||0;return lim>0&&total>lim+0.001?(
                    <div style={{background:C.wn+'18',border:`1px solid ${C.wn}55`,borderRadius:8,padding:'8px 10px',marginBottom:8,fontSize:11,color:C.wn}}>
                      ⚠️ Suman <b>{fmt(total)} €</b> y el límite del banco es <b>{fmt(lim)} €</b> por remesa y día — puede rechazarla. Quita facturas, o genérala y pártela después desde Facturas → Remesas.
                    </div>
                  ):null;})()}

                  <div style={{maxHeight:200,overflowY:'auto',marginBottom:10}}>
                    {sel.map(inv=>{
                      const saldo=getSaldo(inv,invoices);
                      const va=impRemesa(inv);   // lo que va a la remesa de verdad
                      const hasIBAN=!!(inv.ibanProveedor?.replace(/\s/g,'')||getSupplierData(inv.proveedor).iban.replace(/\s/g,''));
                      return(
                        <div key={inv.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:`1px solid ${C.bd}22`,fontSize:11}}>
                          <div>
                            <span style={{fontWeight:600}}>{inv.proveedor}</span>
                            <span style={{color:C.mt,marginLeft:4}}>{inv.numFactura}</span>
                            {!hasIBAN&&<span style={{color:C.dn,marginLeft:4}}>⚠ sin IBAN</span>}
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                            <span style={{fontWeight:700}}>{fmt(va)} €</span>
                            {va<saldo-0.005&&<span style={{fontSize:9.5,color:C.wn}}>de {fmt(saldo)}</span>}
                            {/* v389 · Jesús: «el sistema debería permitir borrar esa línea en esa
                                ventana». El aspa la desmarca: sale de esta remesa sin tocar nada más. */}
                            <button title="Quitar esta línea de la remesa" onClick={()=>{
                              if(selected.size<=1)setShowSepa(false);
                              toggleSelect(inv.id);
                            }} style={{background:'transparent',border:'none',color:C.mt,cursor:'pointer',fontSize:14,lineHeight:1,padding:'0 2px'}}>✕</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <label style={{display:'block',marginBottom:10}}>
                    <span style={{fontSize:10,color:C.mt}}>Fecha de ejecución</span>
                    <input type="date" style={S.input} value={sepaDate} onChange={e=>setSepaDate(e.target.value)} min={today}/>
                  </label>

                  {/* v382 · Jesús (08-09-2026): «deberían darse por pagadas todas, salvo
                      incidencia que lo resuelvo en tesorería… pero es incómodo tener que ir
                      ahí después de ir al banco». La casilla se ha quitado: generar una
                      remesa APUNTA LOS PAGOS, siempre. Si el banco no la ejecuta, se
                      deshace desde el histórico con «Esta remesa no se ejecutó», que es la
                      excepción y no lo normal. Se quedó desmarcada una vez y las facturas
                      salieron sin pago sin que nadie avisara. */}
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,padding:'8px 10px',
                    background:C.sc+'12',border:`1px solid ${C.sc}33`,borderRadius:8}}>
                    <span style={{fontSize:16,flexShrink:0}}>✓</span>
                    <div>
                      <div style={{fontSize:12,fontWeight:600,color:C.sc}}>Se darán por pagadas al generar</div>
                      <div style={{fontSize:10,color:C.mt}}>Con la fecha de ejecución y la referencia del fichero. Si el banco rechaza la remesa, se deshace en Tesorería → Remesas con «Esta remesa no se ejecutó».</div>
                    </div>
                  </div>
                  {(()=>{
                    // v359 · facturas seleccionadas que YA llevan un pago de otra remesa
                    const ya=invoices.filter(i=>selected.has(i.id)&&(i.pagos||[]).some(p=>/^BIOH-/.test(String(p.referencia||''))));
                    if(!ya.length)return null;
                    return (
                      <div style={{background:C.wn+'14',border:`1px solid ${C.wn}66`,borderRadius:8,padding:'8px 10px',marginBottom:10,fontSize:11}}>
                        <div style={{fontWeight:700,color:C.wn,marginBottom:4}}>⚠️ {ya.length} de estas facturas ya llevan pago de otra remesa</div>
                        <div style={{color:C.mt,marginBottom:6}}>{ya.slice(0,4).map(i=>(i.proveedor||'')+' nº'+(i.numFactura||'s/n')).join(' · ')}{ya.length>4?' …':''}</div>
                        <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                          <input type="checkbox" checked={!!sepaSustituir} onChange={e=>setSepaSustituir(e.target.checked)} style={{width:18,height:18,accentColor:C.wn,flexShrink:0}}/>
                          <span style={{fontSize:11}}><b>Sustituir</b> ese pago por el de esta remesa (la última remesa manda). Si lo desmarcas, se dejan como están y la app te dirá cuáles ha saltado.</span>
                        </label>
                      </div>
                    );
                  })()}

                  <div style={{background:C.bg,borderRadius:8,padding:10,marginBottom:10,textAlign:'center'}}>
                    <div style={{fontSize:10,color:C.mt}}>Total a transferir</div>
                    <div style={{fontSize:22,fontWeight:800,color:C.ac}}>{fmt(total)} €</div>
                    <div style={{fontSize:10,color:C.mt}}>{sel.length} transferencia{sel.length!==1?'s':''}</div>
                  </div>

                  {missingIBAN.length>0&&(
                    <div style={{background:C.dn+'18',borderRadius:8,padding:8,marginBottom:10,fontSize:11,color:C.dn}}>
                      Falta IBAN de: {[...new Set(missingIBAN.map(i=>i.proveedor))].map(p=><button key={p} style={{background:'none',border:'none',color:C.in,cursor:'pointer',textDecoration:'underline',fontSize:11,marginRight:6,padding:0}} onClick={()=>openProvModal(p)}>{p}</button>)} — complétalo en su ficha (✏️) o en la factura.
                    </div>
                  )}
                  {missingDir.length>0&&missingIBAN.length===0&&(
                    <div style={{background:C.wn+'12',border:`1px solid ${C.wn}44`,borderRadius:8,padding:'8px 10px',marginBottom:8,fontSize:11}}>
                      <span style={{color:C.wn,fontWeight:600}}>📮 Sin dirección fiscal:</span>{' '}
                      {missingDir.slice(0,4).map(p=><button key={p} style={{background:'none',border:'none',color:C.in,cursor:'pointer',textDecoration:'underline',fontSize:11,marginRight:6,padding:0}} onClick={()=>openProvModal(p)}>{p}</button>)}{missingDir.length>4?`y ${missingDir.length-4} más `:''}
                      <span style={{color:C.mt}}>— el banco la incluye en su C34; el fichero se generará igualmente sin ella.</span>
                    </div>
                  )}

                  <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                    <button style={S.ghost} onClick={()=>setShowSepa(false)}>Cancelar</button>
                    <button style={{...S.btn(C.in),opacity:missingIBAN.length?0.4:1}} onClick={generateSEPA} disabled={missingIBAN.length>0}>Descargar XML SEPA</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })())||null
);

const ModalRepartoNominas=({avisarCerrar,avisarWhatsApp,avisoEdit,avisoTxt,compCfg,enviarNomina,enviarYAvisar,reparto,repartoCancel,setAvisoEdit,setAvisoTxt,setReparto})=>(
  (reparto&&(
        <div style={S.overlay} onClick={avisarCerrar}>
          <div style={{...S.modal,maxWidth:560}} onClick={e=>e.stopPropagation()}>
            <div style={{...S.cabModal,display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14}}>📤 Repartir nóminas de {reparto.periodo}</div>
                <div style={{fontSize:11,color:C.mt}}>
                  {reparto.fase==='partiendo'
                    ?`Separando y comprobando… ${reparto.hechas}/${reparto.total}`
                    :(()=>{const ok=reparto.filas.filter(f=>f.verificado&&f.verificado.ok).length;
                       const env=reparto.filas.filter(f=>f.enviado).length;
                       const av=reparto.filas.filter(f=>f.avisado).length;
                       return `${ok} de ${reparto.total} listas · ✉️ ${env} enviadas · 💬 ${av} avisadas`;})()}
                </div>
              </div>
              {reparto.fase==='partiendo'
                ?<button style={S.sm(C.dn)} onClick={()=>{repartoCancel.current=true;}}>Parar</button>
                :<button style={{background:'transparent',border:'none',cursor:'pointer',color:C.mt,fontSize:20,lineHeight:1,padding:'0 4px'}} title="Cerrar" onClick={()=>setReparto(null)}>✕</button>}
            </div>
            <div style={{background:C.bg,borderRadius:8,padding:'8px 10px',marginBottom:10,fontSize:10,color:C.mt,lineHeight:1.45}}>
              Cada hoja se vuelve a leer por separado, sin saber de quién debería ser, y solo se puede enviar si las dos lecturas coinciden. Las que no cuadran no se envían: aparecen abajo con el motivo.
            </div>
            {reparto.fase==='listo'&&(
              <div style={{background:C.bg,borderRadius:8,padding:'8px 10px',marginBottom:8}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{flex:1,minWidth:0,fontSize:11}}>💬 Texto del aviso por WhatsApp</span>
                  <button style={{...S.sm(C.in),padding:'4px 9px',fontSize:10,minHeight:0}} onClick={()=>setAvisoEdit(v=>!v)}>{avisoEdit?'✓ Hecho':'✏️ Cambiar'}</button>
                </div>
                {avisoEdit
                  ?<>
                    <textarea style={{...S.input,marginTop:6,minHeight:64,fontSize:12}} value={avisoTxt}
                      onChange={e=>{setAvisoTxt(e.target.value);window.storage.set('bh10-avisonom',e.target.value).catch(()=>{});}}/>
                    <div style={{fontSize:9,color:C.mt,marginTop:3}}>Huecos disponibles: {'{nombre}'} · {'{periodo}'} · {'{empresa}'}. Se guarda solo.</div>
                  </>
                  :<div style={{fontSize:10,color:C.mt,marginTop:4,fontStyle:'italic'}}>«{construirAviso(avisoTxt,reparto.filas[0]||{},reparto.periodo,(compCfg&&compCfg.name)||'')}»</div>}
              </div>
            )}
            {(()=>{
              // Dos fichas con el mismo correo mandarían dos nóminas al mismo
              // buzón. Se avisa antes de que ocurra.
              const dirs=reparto.filas.map(f=>String(f.email||'').toLowerCase()).filter(Boolean);
              const repes=[...new Set(dirs.filter((d,i)=>dirs.indexOf(d)!==i))];
              if(!repes.length)return null;
              return(
                <div style={{background:C.wn+'14',border:`1px solid ${C.wn}55`,borderRadius:8,padding:'8px 10px',marginBottom:8,fontSize:11,color:C.wn}}>
                  <b>⚠ Hay un correo repetido en dos fichas:</b> {repes.join(', ')}.
                  <div style={{fontSize:10,color:C.mt,marginTop:2}}>Si lo envías, esa dirección recibirá la nómina de dos personas. Revisa las fichas antes.</div>
                </div>
              );
            })()}
            {reparto.filas.map((f,ix)=>{
              const p=puedeEnviarNomina(f);
              const bien=f.verificado&&f.verificado.ok;
              return(
                <div key={ix} style={{background:C.bg,borderRadius:9,padding:'9px 11px',marginBottom:7,borderLeft:`3px solid ${f.enviado?C.sc:bien?C.in:f.verificado?C.dn:C.bd}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.nombre||f.nif}</div>
                      <div style={{fontSize:10,color:C.mt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {f.email?<b style={{color:C.in}}>{f.email}</b>:<span style={{color:C.wn}}>sin correo en su ficha</span>}{f.pag?` · hoja ${f.pag}`:''}{f.liq>0?` · ${fmt(f.liq)} €`:''}
                      </div>
                    </div>
                    <div style={{flexShrink:0,textAlign:'right'}}>
                      {!f.verificado&&<span style={{fontSize:10,color:C.mt}}>…</span>}
                      {f.enviado&&<span style={{fontSize:10,color:C.sc,fontWeight:700}}>✉️ Enviada</span>}
                    </div>
                  </div>
                  {f.verificado&&!f.verificado.ok&&(
                    <div style={{fontSize:10,color:C.dn,marginTop:4,fontWeight:600}}>⛔ No se envía — {f.verificado.motivo}</div>
                  )}
                  {bien&&(()=>{
                    const a=puedeAvisar(f);
                    return(
                      <div style={{display:'flex',gap:6,marginTop:6,flexWrap:'wrap',alignItems:'center'}}>
                        {!f.enviado&&a.ok&&<button style={{...S.sm(C.sc),padding:'6px 11px',fontSize:11,opacity:p.ok?1:.45}} disabled={!p.ok}
                          title="Correo con la nómina y, después, aviso por WhatsApp" onClick={()=>enviarYAvisar(f)}>✉️+💬 Enviar y avisar</button>}
                        {!f.enviado&&<button style={{...S.sm(a.ok?C.mt:C.sc),padding:'6px 11px',fontSize:11,opacity:p.ok?1:.45}} disabled={!p.ok}
                          title={p.ok?'Solo el correo, con su nómina adjunta':p.motivo} onClick={()=>enviarNomina(f)}>✉️ Solo correo</button>}
                        {f.enviado&&!f.avisado&&a.ok&&<button style={{...S.sm(C.in),padding:'6px 11px',fontSize:11}} onClick={()=>avisarWhatsApp(f)}>💬 Avisar por WhatsApp</button>}
                        {f.avisado&&<span style={{fontSize:10,color:C.sc,fontWeight:700}}>💬 Avisado</span>}
                        {!a.ok&&<span style={{fontSize:9,color:C.mt}}>{a.motivo}</span>}
                        {!p.ok&&<span style={{fontSize:10,color:C.wn}}>{p.motivo}</span>}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
            <div style={{fontSize:10,color:C.mt,marginTop:4,lineHeight:1.45}}>
              Al pulsar ✉️ se abre tu correo con el PDF ya adjunto y la dirección copiada al portapapeles: solo hay que pegarla en «Para» y enviar. No se manda nada solo.<br/>
              «Enviar y avisar» hace las dos cosas seguidas: primero el correo y, al volver, WhatsApp. El aviso va sin la nómina adjunta — el documento viaja por correo, que es el canal con constancia, y WhatsApp solo sirve para que se enteren.
            </div>
          </div>
        </div>
      ))||null
);

const ModalLoteEscaneo=({batchCancelRef,batchFiles,batchReviewIdx,batchTipo,lotePagadas,registerAllBatch,setBatchFiles,setLotePagadas,startBatchReview})=>(
  (batchFiles.length>0&&batchReviewIdx===null&&(
        <div style={S.overlay}>
          <div style={{...S.modal,maxWidth:440}} onClick={e=>e.stopPropagation()}>
            {(()=>{
              const done=batchFiles.filter(f=>f.status==='done').length;
              const errs=batchFiles.filter(f=>f.status==='error').length;
              const processing=batchFiles.some(f=>f.status==='pending'||f.status==='scanning');
              const current=batchFiles.findIndex(f=>f.status==='scanning');
              return(<>
                <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{batchTipo==='cobro'?'📤':'📚'} {processing?'Escaneando lote':(batchTipo==='cobro'?'Lote de facturas EMITIDAS':'Lote de facturas recibidas')}</div>
                {!processing&&batchTipo!=='cobro'&&batchFiles.some(f=>f.status==='done')&&(
                  <div onClick={()=>setLotePagadas(v=>!v)} style={{display:'flex',alignItems:'center',gap:9,background:lotePagadas?C.sc+'18':C.bg,border:`1px solid ${lotePagadas?C.sc:C.bd}`,borderRadius:9,padding:'9px 11px',marginBottom:8,cursor:'pointer'}}>
                    <span style={{fontSize:17,flexShrink:0}}>{lotePagadas?'✅':'⬜'}</span>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:700,color:lotePagadas?C.sc:C.tx}}>Marcar todas como pagadas</div>
                      <div style={{fontSize:10,color:C.mt,lineHeight:1.4}}>Para históricos antiguos ya abonados. Registra el pago con la fecha de cada factura. Las que ya estén en el sistema no se tocan: el aviso de duplicado las respeta con su estado actual.</div>
                    </div>
                  </div>
                )}
                {(()=>{const cruz=batchFiles.filter(f=>f.status==='done'&&f.data&&(!!f.data._emitidaPorNos)!==(batchTipo==='cobro'));
                  return cruz.length?<div style={{background:C.wn+'18',border:`1px solid ${C.wn}55`,borderRadius:8,padding:'6px 8px',marginBottom:6,fontSize:10,color:C.wn}}>⚠️ {cruz.length} documento{cruz.length!==1?'s':''} {batchTipo==='cobro'?'no parece{cruz.length!==1?"n":""} emitido por ti':'parece{cruz.length!==1?"n":""} emitido por ti'} — revísalo antes de registrar</div>:null;})()}
                <div style={{fontSize:12,color:C.mt,marginBottom:10}}>
                  {processing?`Procesando ${current+1} de ${batchFiles.length}…`:`Terminado: ${done} legible${done!==1?'s':''}${errs?`, ${errs} con error`:''}`}
                </div>
                {(()=>{const dud=batchFiles.filter(f=>f.status==='done'&&Array.isArray(f.data?._avisos)&&f.data._avisos.length).length;
                  return !processing&&dud>0?<div style={{background:C.wn+'18',border:`1px solid ${C.wn}55`,borderRadius:8,padding:'6px 8px',marginBottom:6,fontSize:10,color:C.wn}}>⚠️ {dud} lectura{dud!==1?'s':''} dudosa{dud!==1?'s':''} (foto girada, fecha rara o CIF equivocado): revísala{dud!==1?'s':''} una a una; «Registrar todas» la{dud!==1?'s':''} deja fuera.</div>:null;})()}
                {processing&&<div style={{height:6,background:C.bg,borderRadius:3,marginBottom:10,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${(done+errs)/(batchFiles.length||1)*100}%`,background:C.vt,borderRadius:3,transition:'width .3s'}}/>
                </div>}
                <div style={{maxHeight:260,overflowY:'auto',marginBottom:12}}>
                  {batchFiles.map(f=>(
                    <div key={f.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderBottom:`1px solid ${C.bd}22`,fontSize:12}}>
                      <span style={{flexShrink:0,width:20,textAlign:'center'}}>
                        {f.status==='pending'&&'·'}{f.status==='scanning'&&'⏳'}{f.status==='done'&&'✅'}{f.status==='error'&&'❌'}
                      </span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</div>
                        {f.status==='done'&&f.data?.proveedor&&<div style={{fontSize:10,color:C.sc}}>{f.data.proveedor}{f.data.importeBase?` · ${f.data.importeBase} € base`:''}</div>}
                        {f.status==='done'&&Array.isArray(f.data?._avisos)&&f.data._avisos.length>0&&<div style={{fontSize:10,color:C.wn,fontWeight:700}}>⚠ Revisar: {f.data._avisos.join(' · ')}</div>}
                        {f.status==='error'&&<div style={{fontSize:10,color:C.dn}}>{f.error}</div>}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <button style={{...S.btn(C.sc),flex:'1 1 140px',opacity:done>0&&!processing?1:.5}} disabled={done===0||processing} onClick={startBatchReview}>
                    {processing?'Escaneando…':`Revisar ${done} factura${done!==1?'s':''} →`}
                  </button>
                  {!processing&&done>1&&<button style={{...S.btn(C.in),flex:'1 1 140px'}} onClick={registerAllBatch}>⚡ Registrar todas</button>}
                  <button style={S.ghost} onClick={()=>{batchCancelRef.current=true;setBatchFiles([]);}}>Cancelar</button>
                </div>
              </>);
            })()}
          </div>
        </div>
      ))||null
);

// ═══ TRASPASOS ENTRE EMPRESAS DEL GRUPO ═══════════════════════════════════
// Dos ventanas: la lista (historial de remesas + empresas dadas de alta) y la
// de un traspaso nuevo. El beneficiario viene ya relleno de la lista; solo hay
// que poner concepto e importe. El concepto trae «TRASPASO» y se puede editar
// o borrar entero.
const ModalTraspasos=({BtnConfirm,RemesasList,avisarCerrar,fmtImporte,grupo,grupoForm,grupoModal,guardarEmpresaGrupo,
  borrarEmpresaGrupo,nuevoTraspaso,setGrupoForm,setGrupoModal,setTraspModal,traspModal,traspasos})=>(
  traspModal!=='lista'?null:
  <div style={S.overlay} onClick={()=>avisarCerrar(()=>setTraspModal(null))}>
    <div style={{...S.modal,maxWidth:520}} onClick={e=>e.stopPropagation()}>
      <div style={S.modalHead}>
        <b>🏢 Traspasos entre empresas del grupo</b>
        <button style={S.x} onClick={()=>setTraspModal(null)}>✕</button>
      </div>
      <div style={{padding:'0 14px 14px'}}>
        <div style={{fontSize:11,color:C.mt,marginBottom:10}}>
          Movimientos de dinero entre empresas del grupo sin factura de por medio.
          Si una factura a la otra, eso va por Facturas como un proveedor más.
        </div>

        <div style={{fontWeight:700,fontSize:12,margin:'10px 0 6px'}}>Empresas dadas de alta</div>
        {grupo.length===0
          ? <div style={{fontSize:11,color:C.mt,padding:'6px 0'}}>Ninguna todavía. Da de alta la otra empresa del grupo para poder traspasarle dinero.</div>
          : grupo.map(e=>(
            <div key={e.id} style={{...S.card,padding:'8px 10px',marginBottom:6,display:'flex',gap:8,alignItems:'center'}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:12}}>{e.nombre}</div>
                <div style={{fontSize:10,color:C.mt}}>{e.cif||'sin CIF'} · {e.iban}</div>
              </div>
              <button style={{...S.sm(C.in),fontSize:11}} onClick={()=>{setGrupoForm({...e});setGrupoModal(e.id);}}>✏️</button>
              <BtnConfirm style={{...S.sm(C.dn),fontSize:11}} onConfirm={()=>borrarEmpresaGrupo(e.id)}>🗑</BtnConfirm>
            </div>))}
        <button style={{...S.sm(C.in),width:'100%',marginTop:4}}
          onClick={()=>{setGrupoForm({nombre:'',cif:'',iban:'',bic:''});setGrupoModal('new');}}>➕ Añadir empresa del grupo</button>

        {grupoModal&&(
          <div style={{...S.card,marginTop:10,padding:10,borderColor:C.ac+'66'}}>
            <div style={{fontWeight:700,fontSize:12,marginBottom:6}}>{grupoModal==='new'?'Nueva empresa del grupo':'Editar empresa'}</div>
            <label style={S.lbl}>Nombre
              <input style={S.input} placeholder="GREEN GENERATION BUILDING, S.L." value={grupoForm.nombre}
                onChange={e=>setGrupoForm({...grupoForm,nombre:e.target.value})}/></label>
            <label style={S.lbl}>CIF
              <input style={S.input} placeholder="B12345678" value={grupoForm.cif}
                onChange={e=>setGrupoForm({...grupoForm,cif:e.target.value})}/></label>
            <label style={S.lbl}>IBAN
              <input style={S.input} placeholder="ES00 0000 0000 00 0000000000" value={grupoForm.iban}
                onChange={e=>setGrupoForm({...grupoForm,iban:e.target.value})}/></label>
            <label style={S.lbl}>BIC (si lo tienes)
              <input style={S.input} placeholder="CAIXESBBXXX" value={grupoForm.bic}
                onChange={e=>setGrupoForm({...grupoForm,bic:e.target.value})}/></label>
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button style={{...S.btn(C.sc),flex:1}} onClick={guardarEmpresaGrupo}>💾 Guardar</button>
              <button style={{...S.sm(C.mt)}} onClick={()=>setGrupoModal(null)}>Cancelar</button>
            </div>
          </div>)}

        <div style={{marginTop:14}}>{RemesasList&&<RemesasList tipo="grupo" titulo="🏢 C34 de traspasos entre empresas"/>}</div>

        <button style={{...S.btn(C.sc),width:'100%',marginTop:10}}
          onClick={nuevoTraspaso}>🏢 Nuevo traspaso</button>
      </div>
    </div>
  </div>
);

const ModalTraspasoNuevo=({Combobox,avisarCerrar,compCfg,fmtImporte,generarTraspaso,grupo,parseImporte,
  setTraspForm,setTraspModal,traspForm,traspModal})=>{
  if(traspModal!=='new')return null;
  const emp=grupo.find(e=>e.id===traspForm.empresaId)||grupo[0]||null;
  const imp=parseImporte(traspForm.importe);
  return (
  <div style={S.overlay} onClick={()=>avisarCerrar(()=>setTraspModal(null))}>
    <div style={{...S.modal,maxWidth:460}} onClick={e=>e.stopPropagation()}>
      <div style={S.modalHead}>
        <b>🏢 Traspaso entre empresas</b>
        <button style={S.x} onClick={()=>setTraspModal(null)}>✕</button>
      </div>
      <div style={{padding:'0 14px 14px'}}>
        <div style={{fontSize:11,color:C.mt,marginBottom:8}}>
          Ordenante: <b>{compCfg.name||'—'}</b><br/>{compCfg.iban||'sin IBAN en Ajustes'}
        </div>
        {grupo.length===0
          ? <div style={{...S.card,padding:10,color:C.dn,fontSize:12}}>
              No hay ninguna empresa del grupo dada de alta. Añádela primero desde 🏢 Traspasos.
            </div>
          : <>
            <label style={S.lbl}>Beneficiario
              <Combobox value={traspForm.beneficiario||''} options={grupo.map(e=>e.nombre)}
                placeholder="Empieza a escribir el nombre…" color={C.ac}
                onChange={val=>{
                  const e=grupo.find(x=>x.nombre===val);
                  setTraspForm({...traspForm,beneficiario:val,empresaId:e?e.id:''});
                }}/></label>
            {emp
              ? <div style={{...S.card,padding:'6px 10px',marginTop:-4,marginBottom:8}}>
                  <div style={{fontSize:10,color:C.mt}}>Datos de su ficha de empresa del grupo</div>
                  <div style={{fontSize:11}}>{emp.cif||'sin CIF'} · {emp.iban}{emp.bic?' · '+emp.bic:''}</div>
                </div>
              : <div style={{fontSize:10,color:C.mt,marginTop:-4,marginBottom:8}}>Elige una de tus empresas del grupo</div>}
            <label style={S.lbl}>Concepto <span style={{fontSize:10,color:C.mt}}>(puedes editarlo o dejarlo vacío)</span>
              <input style={S.input} value={traspForm.concepto}
                onChange={e=>setTraspForm({...traspForm,concepto:e.target.value})}/></label>
            <label style={S.lbl}>Importe
              <input style={{...S.input,fontSize:16}} placeholder="1.212,12" value={traspForm.importe}
                onChange={e=>setTraspForm({...traspForm,importe:e.target.value})}/></label>
            <div style={{...S.card,padding:10,textAlign:'center',margin:'8px 0'}}>
              <div style={{fontSize:10,color:C.mt}}>Total a transferir</div>
              <div style={{fontSize:22,fontWeight:800,color:imp===null?C.mt:C.sc}}>
                {imp===null?'—':fmtImporte(imp)}</div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button style={{...S.sm(C.mt),flex:'0 0 auto'}} onClick={()=>setTraspModal(null)}>Cancelar</button>
              <button style={{...S.btn(C.ac),flex:1}} disabled={imp===null||!emp}
                onClick={()=>generarTraspaso(emp)}>Generar SEPA XML</button>
            </div>
          </>}
      </div>
    </div>
  </div>);
};

const ModalFicheroBanca=({avisarCerrar,bancaUrl,setBancaUrl,setSubirBanco,subirBanco})=>(
  (subirBanco&&(
        <div style={S.overlay} onClick={avisarCerrar}>
          <div style={{...S.modal,maxWidth:460}} onClick={e=>e.stopPropagation()}>
            <div style={{...S.cabModal,display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14}}>🏦 Fichero listo para el banco</div>
                <div style={{fontSize:11,color:C.mt}}>{subirBanco.n} transferencia{subirBanco.n!==1?'s':''} · {fmt(subirBanco.total)} € · ejecución {fmtDate(subirBanco.fecha)}</div>
              </div>
              <button style={{background:'transparent',border:'none',cursor:'pointer',color:C.mt,fontSize:20,lineHeight:1,padding:'0 4px'}} title="Cerrar" onClick={()=>setSubirBanco(null)}>✕</button>
            </div>
            <div style={{background:C.sc+'12',border:`1px solid ${C.sc}44`,borderRadius:9,padding:'9px 11px',marginBottom:10,fontSize:11}}>
              <div style={{fontWeight:700,color:C.sc,marginBottom:3}}>✓ Revisado: ningún dato que el banco vaya a rechazar</div>
              <div style={{color:C.mt,fontSize:10,lineHeight:1.45}}>IBAN y BIC de todos los beneficiarios, importes, fecha de ejecución y datos de tu empresa.</div>
            </div>
            <div style={{fontSize:11,marginBottom:8,lineHeight:1.6}}>
              <div style={{marginBottom:5}}><b>1.</b> El fichero <b>{subirBanco.fichero}</b> ya está guardado en tu móvil.</div>
              <div style={{marginBottom:5}}><b>2.</b> Abre la banca electrónica con el botón de abajo.</div>
              <div><b>3.</b> Entra en <b>Transmisión de ficheros</b>, elige ese fichero y envíalo.</div>
            </div>
            <button style={{...S.btn(C.ac),width:'100%',padding:'13px'}} onClick={()=>{window.open(bancaUrl,'_blank','noopener');}}>🏦 Abrir la banca electrónica</button>
            <div style={{marginTop:10}}>
              <span style={{fontSize:10,color:C.mt}}>Dirección de tu banca electrónica</span>
              <input style={{...S.input,fontSize:16}} value={bancaUrl} onChange={e=>{setBancaUrl(e.target.value);window.storage.set('bh10-banca',e.target.value).catch(()=>{});}} placeholder="https://banking.tubanco.es"/>
            </div>
            <div style={{fontSize:10,color:C.mt,marginTop:8,lineHeight:1.45}}>
              La app no puede subir el fichero por ti: ningún banco español permite que otra aplicación le entregue una remesa sin ser entidad de pago autorizada. Lo que sí hace es dejarlo todo revisado y a un toque.
            </div>
          </div>
        </div>
      ))||null
);

const ModalExtractosN43=({BtnConfirm,anularN43,avisarCerrar,esLector,n43Gestion,n43Hist,setN43Gestion,setN43Pendiente,setSubView,setView})=>(
  (n43Gestion&&(
        <div style={S.overlay} onClick={avisarCerrar}>
          <div style={{...S.modal,maxWidth:520}} onClick={e=>e.stopPropagation()}>
            <div style={{...S.cabModal,display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14}}>🗂️ Extractos del banco (Norma 43)</div>
                <div style={{fontSize:11,color:C.mt}}>{n43Hist.length} extracto{n43Hist.length!==1?'s':''} aplicado{n43Hist.length!==1?'s':''}</div>
              </div>
              <button style={{background:'transparent',border:'none',cursor:'pointer',color:C.mt,fontSize:20,lineHeight:1,padding:'0 4px'}} title="Cerrar" onClick={()=>setN43Gestion(false)}>✕</button>
            </div>
            {!esLector()&&(
              <label style={{...S.sm(C.ac),display:'block',textAlign:'center',cursor:'pointer',marginBottom:10,padding:'10px'}}>
                ⬆️ Subir otro extracto
                <input type="file" accept=".txt,.n43,.aeb,.043,text/plain" style={{display:'none'}} onChange={e=>{const f=e.target.files&&e.target.files[0];if(f){setN43Gestion(false);setView('facturas');setSubView('pendprov');setN43Pendiente(f);}e.target.value='';}}/>
              </label>
            )}
            {n43Hist.length===0?(
              <div style={{textAlign:'center',padding:24,color:C.mt,fontSize:12}}>Todavía no has aplicado ningún extracto.<div style={{fontSize:11,marginTop:6}}>Cuando concilies uno aparecerá aquí para poder anularlo.</div></div>
            ):n43Hist.map(ex=>(
              <div key={ex.id} style={{background:C.bg,borderRadius:9,padding:'9px 11px',marginBottom:7}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ex.archivo||'extracto'}</div>
                    <div style={{fontSize:10,color:C.mt}}>{fmtDate(ex.fecha)} · {(ex.pagos||[]).length} pago{(ex.pagos||[]).length!==1?'s':''}{(ex.ajustes||[]).length?` · ${ex.ajustes.length} fecha${ex.ajustes.length!==1?'s':''} corregida${ex.ajustes.length!==1?'s':''}`:''}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontWeight:800,fontSize:13,color:C.sc}}>{fmt(ex.importe||0)} €</div>
                    <div style={{fontSize:9,color:C.mt}}>{ex.cargos||0} cargos leídos</div>
                  </div>
                </div>
                {!esLector()&&(
                  <div style={{display:'flex',justifyContent:'flex-end',marginTop:6}}>
                    <BtnConfirm style={{...S.sm(C.dn),padding:'5px 10px',fontSize:11,minHeight:0}} armStyle={{background:C.dn,color:'#fff'}} armedLabel="¿Anular todo? Toca otra vez" onConfirm={()=>anularN43(ex.id)}>↩️ Anular este extracto</BtnConfirm>
                  </div>
                )}
              </div>
            ))}
            <div style={{fontSize:10,color:C.mt,marginTop:4,lineHeight:1.4}}>Anular retira los pagos que creó ese extracto y devuelve las fechas de pago que hubiera cambiado. No borra facturas.</div>
          </div>
        </div>
      ))||null
);

const ModalVehiculo=({avisarCerrar,bajaItem,flotaForm,flotaModal,saveVeh,setFlotaForm,setFlotaModal})=>(
  (flotaModal&&(
        <div style={S.overlay} onClick={avisarCerrar}>
          <div style={{...S.modal,maxWidth:460}} onClick={e=>e.stopPropagation()}>
            <div style={{...S.cabModal,display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <span style={{fontWeight:700,fontSize:15}}>🚛 {flotaModal==='new'?'Nuevo vehículo / máquina':'Editar'}</span>
              <button onClick={()=>setFlotaModal(null)} style={{background:'none',border:'none',color:C.mt,cursor:'pointer',fontSize:18}}>✕</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <label><span style={{fontSize:10,color:C.mt}}>Nombre / alias</span><input style={S.input} value={flotaForm.alias} onChange={e=>setFlotaForm(p=>({...p,alias:e.target.value}))} placeholder="Furgón obra"/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Matrícula / nº serie</span><input style={S.input} value={flotaForm.matricula} onChange={e=>setFlotaForm(p=>({...p,matricula:e.target.value.toUpperCase()}))} placeholder="1234-ABC"/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Tipo</span><select style={S.select} value={flotaForm.tipo} onChange={e=>setFlotaForm(p=>({...p,tipo:e.target.value}))}><option value="vehiculo">🚐 Vehículo</option><option value="maquina">🏗️ Máquina</option></select></label>
              <label><span style={{fontSize:10,color:C.mt}}>Empresa</span><select style={S.select} value={flotaForm.empresa||'BIG'} onChange={e=>setFlotaForm(p=>({...p,empresa:e.target.value}))}><option>BIG</option><option>GREEN</option><option>BENITO</option></select></label>
              <label><span style={{fontSize:10,color:C.mt}}>ITV — próximo vto.</span><input type="date" style={S.input} value={flotaForm.itv} onChange={e=>setFlotaForm(p=>({...p,itv:e.target.value}))}/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Seguro — vencimiento</span><input type="date" style={S.input} value={flotaForm.seguroVto} onChange={e=>setFlotaForm(p=>({...p,seguroVto:e.target.value}))}/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Aseguradora</span><input style={S.input} value={flotaForm.seguroCia} onChange={e=>setFlotaForm(p=>({...p,seguroCia:e.target.value}))} placeholder="Mapfre"/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Prima anual (€)</span><input type="text" inputMode="decimal" style={S.input} value={flotaForm.seguroPrima||''} onChange={e=>setFlotaForm(p=>({...p,seguroPrima:e.target.value}))} onBlur={e=>setFlotaForm(p=>({...p,seguroPrima:parseNum(e.target.value)||''}))} placeholder="424,76"/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Mantenimiento — fecha</span><input type="date" style={S.input} value={flotaForm.mantFecha} onChange={e=>setFlotaForm(p=>({...p,mantFecha:e.target.value}))}/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Mant. — nota</span><input style={S.input} value={flotaForm.mantNota} onChange={e=>setFlotaForm(p=>({...p,mantNota:e.target.value}))} placeholder="Cambio aceite 90.000 km"/></label>
            </div>
            <label style={{display:'block',marginTop:8}}><span style={{fontSize:10,color:C.mt}}>Notas</span><input style={S.input} value={flotaForm.notas} onChange={e=>setFlotaForm(p=>({...p,notas:e.target.value}))}/></label>
            <div style={{display:'flex',gap:8,marginTop:12}}>
              <button style={{...S.btn(C.sc),flex:1}} onClick={saveVeh}>💾 Guardar</button>
              {flotaModal!=='new'&&<button style={S.ghost} onClick={()=>{bajaItem('veh',flotaModal);setFlotaModal(null);}}>🗑 Baja</button>}
              <button style={S.ghost} onClick={()=>setFlotaModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      ))||null
);

const ModalPoliza=({avisarCerrar,bajaItem,flota,polForm,polModal,polizas,savePoliza,setPolForm,setPolModal})=>(
  (polModal&&(
        <div style={S.overlay} onClick={avisarCerrar}>
          <div style={{...S.modal,maxWidth:460}} onClick={e=>e.stopPropagation()}>
            <div style={{...S.cabModal,display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <span style={{fontWeight:700,fontSize:15}}>🛡️ {polModal==='new'?'Nueva póliza':'Editar póliza'}</span>
              <button onClick={()=>setPolModal(null)} style={{background:'none',border:'none',color:C.mt,cursor:'pointer',fontSize:18}}>✕</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {/* El ramo decide qué se pregunta: no es lo mismo asegurar un
                  coche (matrícula) que una nave (dirección) o la salud (persona) */}
              <label><span style={{fontSize:10,color:C.mt}}>¿Qué clase de seguro es? *</span>
                <select style={S.select} value={polForm.ramo||''} onChange={e=>setPolForm(p=>({...p,ramo:e.target.value}))}>
                  <option value="">— Elige —</option>
                  {Object.entries(RAMOS).map(([k,r])=><option key={k} value={k}>{r.ic} {r.n}</option>)}
                </select></label>
              {polForm.ramo&&(
                <label><span style={{fontSize:10,color:C.mt}}>{(RAMOS[polForm.ramo]||{}).objeto||'Qué asegura'} *</span>
                  <input style={S.input} value={polForm.objeto||''} list={polForm.ramo==='auto'?'lista-matriculas':undefined}
                    onChange={e=>{
                      const v=e.target.value;
                      setPolForm(p=>({...p,objeto:v,objetoId:String(v).toUpperCase().replace(/[^A-Z0-9]/g,'')}));
                    }}
                    placeholder={(RAMOS[polForm.ramo]||{}).ph||''}/></label>
              )}
              {polForm.ramo==='auto'&&(
                <datalist id="lista-matriculas">
                  {(flota||[]).filter(v=>v&&v.activa!==false&&v.matricula).map(v=>(
                    <option key={v.id} value={v.matricula}>{v.alias||''}</option>
                  ))}
                </datalist>
              )}
              {/* Aviso en el momento, antes de guardar el duplicado */}
              {polForm.ramo&&polForm.objeto&&(()=>{
                const ya=(polizas||[]).filter(p=>p&&p.activa!==false&&p.id!==polModal
                  &&claveRiesgo(p)===claveRiesgo({ramo:polForm.ramo,objeto:polForm.objeto,objetoId:polForm.objetoId}));
                if(!ya.length)return null;
                return(
                  <div style={{gridColumn:'1/-1',background:C.dn+'14',border:`1px solid ${C.dn}55`,borderRadius:9,padding:'8px 10px',fontSize:11,color:C.dn}}>
                    ⚠ Ya hay {ya.length===1?'una póliza':ya.length+' pólizas'} para eso: {ya.map(p=>p.cia||'sin compañía').join(', ')}.
                    <div style={{fontSize:10,color:C.mt,marginTop:2}}>Si es una renovación, da de baja la anterior en vez de añadir otra.</div>
                  </div>
                );
              })()}
              <label><span style={{fontSize:10,color:C.mt}}>Nº de póliza</span>
                <input style={{...S.input,fontFamily:'monospace'}} value={polForm.nPoliza||''}
                  onChange={e=>setPolForm(p=>({...p,nPoliza:e.target.value}))}/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Cada cuánto se paga</span>
                <select style={S.select} value={polForm.periodicidad||'anual'} onChange={e=>setPolForm(p=>({...p,periodicidad:e.target.value}))}>
                  {Object.entries(PERIODOS).map(([k,v])=><option key={k} value={k}>{v.n}</option>)}
                </select></label>
              {parseNum(polForm.prima)>0&&(polForm.periodicidad||'anual')!=='anual'&&(
                <div style={{gridColumn:'1/-1',fontSize:10,color:C.mt}}>
                  Coste anual: <b style={{color:C.tx}}>{fmt(primaAnual(polForm))} €</b>
                </div>
              )}
              <label><span style={{fontSize:10,color:C.mt}}>Empresa</span><select style={S.select} value={polForm.empresa||'BIG'} onChange={e=>setPolForm(p=>({...p,empresa:e.target.value}))}><option>BIG</option><option>GREEN</option><option>BENITO</option></select></label>
              <label style={{gridColumn:'1/-1'}}><span style={{fontSize:10,color:C.mt}}>Objeto asegurado</span><input style={S.input} value={polForm.desc} onChange={e=>setPolForm(p=>({...p,desc:e.target.value}))} placeholder="Obra, nave, empresa…"/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Vencimiento</span><input type="date" style={S.input} value={polForm.vto} onChange={e=>setPolForm(p=>({...p,vto:e.target.value}))}/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Prima anual (€)</span><input type="text" inputMode="decimal" style={S.input} value={polForm.prima||''} onChange={e=>setPolForm(p=>({...p,prima:e.target.value}))} onBlur={e=>setPolForm(p=>({...p,prima:parseNum(e.target.value)||''}))} placeholder="975,46"/></label>
              <label style={{gridColumn:'1/-1'}}><span style={{fontSize:10,color:C.mt}}>Compañía</span><input style={S.input} value={polForm.cia} onChange={e=>setPolForm(p=>({...p,cia:e.target.value}))} placeholder="AXA, Caja Rural…"/></label>
            </div>
            <label style={{display:'block',marginTop:8}}><span style={{fontSize:10,color:C.mt}}>Notas</span><input style={S.input} value={polForm.notas} onChange={e=>setPolForm(p=>({...p,notas:e.target.value}))}/></label>
            <div style={{display:'flex',gap:8,marginTop:12}}>
              <button style={{...S.btn(C.sc),flex:1}} onClick={savePoliza}>💾 Guardar</button>
              {polModal!=='new'&&<button style={S.ghost} onClick={()=>{bajaItem('pol',polModal);setPolModal(null);}}>🗑 Baja</button>}
              <button style={S.ghost} onClick={()=>setPolModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      ))||null
);

const ModalObra=({avisarCerrar,deleteObra,obraDisplay,obraForm,obraModal,saveObra,setObraForm,setObraModal})=>(
  (obraModal&&(
        <div style={S.overlay} onClick={avisarCerrar}>
          <div style={{...S.modal,maxWidth:440}} onClick={e=>e.stopPropagation()}>
            <div style={{...S.cabModal,display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <span style={{fontWeight:700,fontSize:15}}>🏗️ {obraModal.editing?'Editar obra':'Alta de obra'}</span>
              <button onClick={()=>setObraModal(null)} style={{background:'none',border:'none',color:C.mt,cursor:'pointer',fontSize:18}}>✕</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:8}}>
              <label style={{gridColumn:'1/-1'}}><span style={{fontSize:10,color:C.mt}}>Alias (opcional — ej: "Chalets Yuncos")</span><input style={S.input} value={obraForm.alias} onChange={e=>setObraForm(p=>({...p,alias:e.target.value}))} placeholder="Nombre corto para identificarla"/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Calle</span><input style={S.input} value={obraForm.calle} onChange={e=>setObraForm(p=>({...p,calle:e.target.value}))} placeholder="C/ Mozambique"/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Número</span><input style={S.input} value={obraForm.numero} onChange={e=>setObraForm(p=>({...p,numero:e.target.value}))} placeholder="12"/></label>
              <label><span style={{fontSize:10,color:C.mt}}>CP</span><input style={S.input} inputMode="numeric" value={obraForm.cp} onChange={e=>setObraForm(p=>({...p,cp:e.target.value}))} placeholder="45210"/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Municipio</span><input style={S.input} value={obraForm.municipio} onChange={e=>setObraForm(p=>({...p,municipio:e.target.value}))} placeholder="Yuncos"/></label>
              <label style={{gridColumn:'1/-1'}}><span style={{fontSize:10,color:C.mt}}>Provincia</span><input style={S.input} value={obraForm.provincia} onChange={e=>setObraForm(p=>({...p,provincia:e.target.value}))} placeholder="Toledo"/></label>
              <label><span style={{fontSize:10,color:C.dn}}>💸 Presupuesto de gasto (€)</span><input type="text" inputMode="decimal" style={S.input} value={obraForm.presupuestoGasto||''} onChange={e=>setObraForm(p=>({...p,presupuestoGasto:parseNum(e.target.value)}))} placeholder="0"/></label>
              <label><span style={{fontSize:10,color:C.sc}}>💰 Coste de venta (€) — total obra; al generar viviendas se reparte</span><input type="text" inputMode="decimal" style={S.input} value={obraForm.presupuestoVenta||''} onChange={e=>setObraForm(p=>({...p,presupuestoVenta:parseNum(e.target.value)}))} placeholder="0"/></label>
              {/* v362 · tipología para el coste por vivienda y por m² */}
              <label><span style={{fontSize:10,color:C.mt}}>🏠 Viviendas / chalets</span><input inputMode="numeric" style={S.input} value={obraForm.viviendas||''} onChange={e=>setObraForm(p=>({...p,viviendas:parseInt(e.target.value.replace(/[^0-9]/g,''),10)||0}))} placeholder="8"/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Tipología</span><input style={S.input} value={obraForm.tipologia||''} onChange={e=>setObraForm(p=>({...p,tipologia:e.target.value}))} placeholder="Chalet pareado, adosado, bloque…"/></label>
              <label><span style={{fontSize:10,color:C.mt}}>m² construidos (total)</span><input inputMode="decimal" style={S.input} value={obraForm.m2||''} onChange={e=>setObraForm(p=>({...p,m2:parseNum(e.target.value)||0}))} placeholder="1.200"/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Plantas</span><input inputMode="numeric" style={S.input} value={obraForm.plantas||''} onChange={e=>setObraForm(p=>({...p,plantas:parseInt(e.target.value.replace(/[^0-9]/g,''),10)||0}))} placeholder="2"/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Sótano</span><select style={S.input} value={obraForm.sotano||''} onChange={e=>setObraForm(p=>({...p,sotano:e.target.value}))}><option value="">—</option><option value="si">Sí</option><option value="no">No</option></select></label>
              <label><span style={{fontSize:10,color:C.mt}}>Cliente / promotora</span><input style={S.input} value={obraForm.cliente||''} onChange={e=>setObraForm(p=>({...p,cliente:e.target.value}))}/></label>
            </div>
            <div style={{marginTop:10,padding:'8px 10px',background:C.bg+'88',borderRadius:8,fontSize:11,color:C.mt}}>
              Se mostrará como: <span style={{color:C.tx,fontWeight:600}}>{obraDisplay(obraForm)}</span>
            </div>
            <div style={{display:'flex',gap:8,marginTop:12}}>
              <button style={{...S.btn(C.sc),flex:1}} onClick={saveObra}>💾 Guardar obra</button>
              {obraModal.editing&&<button style={S.sm(C.dn)} onClick={()=>deleteObra(obraModal.editing)}>🗑️</button>}
              <button style={S.ghost} onClick={()=>setObraModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      ))||null
);

const ModalEmpleado=({editingEmp,empForm,saveEmp,setEmpForm,setShowEmpForm,setVerEmbargoEmp,showEmpForm})=>(
  (showEmpForm&&(
        <div style={S.overlay}>
          <div style={{...S.modal,maxWidth:400}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:10}}>{editingEmp?'Editar':'Nuevo'} empleado</div>
            <div style={{display:'grid',gap:8}}>
              <label><span style={{fontSize:10,color:C.mt}}>Nombre completo *</span><input style={S.input} value={empForm.nombre} onChange={e=>setEmpForm(p=>({...p,nombre:e.target.value}))}/></label>
              <label><span style={{fontSize:10,color:C.mt}}>IBAN *</span><input style={{...S.input,fontFamily:'monospace',letterSpacing:'1px'}} value={empForm.iban} onChange={e=>setEmpForm(p=>({...p,iban:e.target.value.toUpperCase()}))} placeholder="ES00 0000 0000 00 0000000000"/></label>
              <label><span style={{fontSize:10,color:C.mt}}>NIF/NIE <span style={{opacity:.6}}>(para el certificado de retenciones)</span></span><input style={{...S.input,fontFamily:'monospace'}} value={empForm.nif||''} onChange={e=>setEmpForm(p=>({...p,nif:e.target.value.toUpperCase()}))} placeholder="00000000A"/></label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {(()=>{
                  const lista=embargosDe(empForm);
                  const hayEmb=lista.length>0;
                  const completo=hayEmb&&lista.every(x=>ibanOk(normIban(x.iban||''))&&String(x.titular||'').trim());
                  return(
                  <div style={{gridColumn:'1 / -1',display:'flex',alignItems:'center',gap:8}}>
                    <button type="button" style={{...S.sm(hayEmb?C.dn:C.mt),flexShrink:0}}
                      onClick={()=>setVerEmbargoEmp(true)}>⚖️ Embargo{hayEmb?(lista.length>1?'s activos ('+lista.length+')':' activo'):''}</button>
                    <span style={{fontSize:10,color:hayEmb?(completo?C.dn:'#EAB308'):C.mt}}>
                      {hayEmb?(completo?'con cuenta del juzgado y titular':'⚠ faltan datos: ábrelo y complétalo'):'sin embargo anotado'}
                    </span>
                  </div>);
                })()}
                <label><span style={{fontSize:10,color:C.mt}}>Nº afiliación SS</span><input style={{...S.input,fontFamily:'monospace'}} value={empForm.nss||''} onChange={e=>setEmpForm(p=>({...p,nss:e.target.value}))} placeholder="45/00000000-00"/></label>
                <label><span style={{fontSize:10,color:C.mt}}>Categoría</span><input style={S.input} value={empForm.categoria||''} onChange={e=>setEmpForm(p=>({...p,categoria:e.target.value}))} placeholder="Oficial 1ª, Peón…"/></label>
              </div>
              <label><span style={{fontSize:10,color:C.mt}}>BIC banco empleado</span><input style={{...S.input,fontFamily:'monospace'}} value={empForm.bic||''} onChange={e=>setEmpForm(p=>({...p,bic:e.target.value.toUpperCase()}))} placeholder="CAIXESBB"/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Importe nómina base (€)</span><input type="text" inputMode="decimal" style={{...S.input,fontWeight:700}} value={empForm.importeBase} onChange={e=>setEmpForm(p=>({...p,importeBase:e.target.value}))}/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Dirección</span><input style={S.input} value={empForm.direccion||''} onChange={e=>setEmpForm(p=>({...p,direccion:e.target.value}))} placeholder="CL Ejemplo, 5"/></label>
              <label><span style={{fontSize:10,color:C.mt}}>CP / Localidad</span><input style={S.input} value={empForm.cp||''} onChange={e=>setEmpForm(p=>({...p,cp:e.target.value}))} placeholder="45200"/></label>
              {/* Contacto: sirve para hacerle llegar su nómina. Se valida al
                  escribirlo, porque un correo mal puesto no da error al enviar:
                  simplemente no llega. */}
              <label><span style={{fontSize:10,color:C.mt}}>Correo</span><input style={S.input} type="email" inputMode="email" autoCapitalize="off" value={empForm.email||''} onChange={e=>setEmpForm(p=>({...p,email:e.target.value.trim()}))} placeholder="nombre@correo.es"/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Móvil</span><input style={S.input} type="tel" inputMode="tel" value={empForm.telefono||''} onChange={e=>setEmpForm(p=>({...p,telefono:e.target.value}))} placeholder="612 34 56 78"/></label>
            </div>
            {/* ── JORNADA HABITUAL ── */}
            {/* Se pone una vez y de aquí sale lo previsto para cada día. La
                planificación mensual solo hace falta para las excepciones. */}
            <div style={{marginTop:12,paddingTop:10,borderTop:`1px solid ${C.bd}`}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <span style={{fontSize:11,fontWeight:700,color:C.mt,flex:1}}>🕐 JORNADA HABITUAL</span>
                {(()=>{
                  const h=horasSemanales(empForm.jornada);
                  return h>0?<span style={{fontSize:11,fontWeight:800,color:C.sc}}>{fmt(h)} h/semana</span>:null;
                })()}
              </div>
              <div style={{display:'flex',gap:5,marginBottom:7,flexWrap:'wrap'}}>
                <button style={{...S.sm(C.in),padding:'5px 9px',fontSize:10,minHeight:0}} onClick={()=>
                  setEmpForm(p=>({...p,jornada:{...JORNADA_VACIA,L:'08:00-17:00',M:'08:00-17:00',X:'08:00-17:00',J:'08:00-17:00',V:'08:00-15:00'}}))}>
                  L-V 8 a 17, viernes hasta 15</button>
                <button style={{...S.sm(C.mt),padding:'5px 9px',fontSize:10,minHeight:0}} onClick={()=>
                  setEmpForm(p=>({...p,jornada:{...JORNADA_VACIA}}))}>Vaciar</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:'4px 8px',alignItems:'center'}}>
                {DIAS_SEMANA.map(([k,nom])=>{
                  const t=leerTurno((empForm.jornada||{})[k]);
                  const mal=String((empForm.jornada||{})[k]||'').trim()&&!t.trabaja;
                  return (
                    <React.Fragment key={k}>
                      <span style={{fontSize:11,color:C.mt,width:70}}>{nom}</span>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <input style={{...S.input,flex:1,fontSize:12,borderColor:mal?C.dn:undefined}}
                          value={(empForm.jornada||{})[k]||''} placeholder="libre"
                          onChange={e=>setEmpForm(p=>({...p,jornada:{...JORNADA_VACIA,...(p.jornada||{}),[k]:e.target.value}}))}/>
                        <span style={{fontSize:10,color:mal?C.dn:C.mt,minWidth:52,textAlign:'right'}}>
                          {mal?'no válido':(t.horas?fmt(t.horas)+' h':'—')}
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
              <div style={{fontSize:10,color:C.mt,marginTop:7,lineHeight:1.45}}>
                Escribe <b style={{color:C.tx}}>08:00-17:00</b>, o dos tramos con barra para jornada partida.
                Déjalo en blanco los días que no trabaje. Los festivos, vacaciones y cambios puntuales
                van en la planificación mensual, que manda sobre esto.
              </div>
            </div>
            {(()=>{
              const eMal=empForm.email&&!emailValido(empForm.email);
              const tMal=empForm.telefono&&!normTelefonoES(empForm.telefono);
              const tFijo=!tMal&&empForm.telefono&&!esMovil(empForm.telefono);
              if(!eMal&&!tMal&&!tFijo)return null;
              return(
                <div style={{background:C.wn+'14',border:`1px solid ${C.wn}55`,borderRadius:8,padding:'7px 10px',marginTop:8,fontSize:10,color:C.wn}}>
                  {eMal&&<div>⚠ El correo no parece válido: sin él no se le puede enviar la nómina.</div>}
                  {tMal&&<div>⚠ El móvil no parece un número español (9 cifras empezando por 6, 7 o 9).</div>}
                  {tFijo&&<div>⚠ Es un fijo: el aviso por WhatsApp solo funciona con móviles.</div>}
                </div>
              );
            })()}
            <div style={{display:'flex',gap:8,marginTop:12,justifyContent:'flex-end'}}>
              <button style={S.ghost} onClick={()=>setShowEmpForm(false)}>Cancelar</button>
              <button style={S.btn()} onClick={saveEmp}>{editingEmp?'Guardar':'Añadir'}</button>
            </div>
          </div>
        </div>
      ))||null
);

const ModalConfirmarBorrado=({avisarCerrar,confirmDel,deleteInvoice,setConfirmDel})=>(
  (confirmDel&&<div style={{...S.overlay,zIndex:CAPAS.ACCION}} onClick={avisarCerrar}><div style={S.modal} onClick={e=>e.stopPropagation()}><div style={{fontWeight:700,marginBottom:6}}>¿Eliminar?</div><div style={{color:C.mt,fontSize:11,marginBottom:12}}>Se borrarán pagos y vínculos asociados</div><div style={{display:'flex',gap:8,justifyContent:'flex-end'}}><button style={S.ghost} onClick={()=>setConfirmDel(null)}>No</button><button style={S.btn(C.dn)} onClick={()=>deleteInvoice(confirmDel)}>Eliminar</button></div></div></div>)||null
);

const ModalFormFactura=({CATS,Combobox,ES_APP,FORMAS,IRPFS,IVAS,IVA_LABELS,TIPOS,advanceBatch,batchFiles,batchReviewIdx,batchTipo,cancelBatch,contratos,convertirProforma,desgloseForm,dirCompletaCliente,editing,fichaCliente,form,getSupplierData,invoices,invoicesAll,lotePagadas,notify,obrasAll,openObraModal,provCat,proveedores,restaurarFactura,saveInvoice,scanInvoice,scanning,setForm,setShowForm,subirAdjuntos,updateForm})=>(()=>{
    const t=calcDesglose(desgloseForm(form),form.irpf);
    const tp=TIPOS.find(x=>x.id===form.tipo)||TIPOS[0];
    const isAnt=form.tipo==='anticipo';
    const isCobro=form.tipo==='cobro';
    const isFactura=form.tipo==='factura';
    const inBatch=batchReviewIdx!==null;
    const closeForm=()=>{if(inBatch)cancelBatch();else setShowForm(false);};
    const batchDone=inBatch?batchFiles.filter(f=>f.status==='done'):[];
    const batchPos=inBatch?batchDone.findIndex(f=>f.id===batchFiles[batchReviewIdx]?.id)+1:0;
    return (
      <div style={S.overlay}>
        <div style={S.modal} onClick={e=>e.stopPropagation()}>
          {inBatch&&(
            <div style={{background:C.vt+'18',border:`1px solid ${C.vt}44`,borderRadius:10,padding:'8px 12px',marginBottom:10,display:'flex',justifyContent:'space-between',alignItems:'center',gap:6}}>
              <div style={{fontSize:12,minWidth:0}}>
                <span style={{fontWeight:700,color:batchTipo==='cobro'?C.sc:C.vt}}>{batchTipo==='cobro'?'📤':'📚'} Lote {batchTipo==='cobro'?'emitidas ':''}{batchPos}/{batchDone.length}</span>
                {lotePagadas&&batchTipo!=='cobro'&&<span style={{fontSize:9,fontWeight:700,color:C.sc,marginLeft:6}}>✅ se registrarán como pagadas</span>}
                <div style={{fontSize:10,color:C.mt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{batchFiles[batchReviewIdx]?.name}</div>
                {Array.isArray(form._avisos)&&form._avisos.length>0&&<div style={{fontSize:10,color:C.wn,fontWeight:700}}>⚠ Revisar: {form._avisos.join(' · ')}</div>}
              </div>
              <button style={{...S.sm(C.wn),flexShrink:0}} onClick={()=>advanceBatch(false)}>Omitir →</button>
            </div>
          )}
          <div style={{...S.cabModal,display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <span style={{fontWeight:700,fontSize:14}}>{editing?'Editar':'Nuevo'}: {tp.icon} {tp.label}</span>
            <button onClick={closeForm} style={{background:'none',border:'none',color:C.mt,cursor:'pointer',fontSize:18}}>✕</button>
          </div>
          {!editing&&!inBatch&&<div style={{display:'flex',gap:5,marginBottom:10}}>{TIPOS.filter(t=>t.id!=='personal'||form.tipo==='personal').map(x=>(
            <button key={x.id} style={{...S.sm(form.tipo===x.id?C.ac:C.mt),fontSize:10}} onClick={()=>{updateForm('tipo',x.id);updateForm('esEstructural',false);}}>{x.icon} {x.label}</button>
          ))}</div>}

          {/* OCR scanner — for received invoices AND emitted (from gestoría) */}
          {!editing&&!inBatch&&(
            <div style={{marginBottom:10,padding:10,border:`1px dashed ${scanning?C.ac:C.bd}`,borderRadius:10,textAlign:'center',background:scanning?C.ac+'08':C.bg+'66'}}>
              {scanning?(<div style={{color:C.ac,fontSize:12,padding:6}}>⏳ Escaneando...</div>):(
                <div><div style={{fontSize:11,color:C.mt,marginBottom:6}}>📷 Sube foto o PDF y se rellena solo</div>
                <label style={{...S.btn(C.ac),display:'inline-block',cursor:'pointer',fontSize:11,padding:'6px 14px'}}>Escanear factura
                  <input type="file" accept="image/*,application/pdf" style={{display:'none'}} onChange={e=>{if(e.target.files?.[0])scanInvoice(e.target.files[0]);}}/>
                </label></div>
              )}
            </div>
          )}

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <label><span style={{fontSize:10,color:C.mt}}>Fecha {isCobro?'emisión':'factura'}</span><input type="date" style={S.input} value={form.fecha} onChange={e=>updateForm('fecha',e.target.value)}/></label>
            <label><span style={{fontSize:10,color:C.mt}}>{isAnt?'Nº Factura (si existe)':isCobro?'Nº Factura emitida':'Nº Factura'}</span><input style={S.input} value={form.numFactura} onChange={e=>updateForm('numFactura',e.target.value)} placeholder={isCobro?'FE-2026/001':'F-2026/001'}/></label>

            {isAnt&&(
              <label style={{gridColumn:'1/-1'}}>
                <span style={{fontSize:10,color:C.vt,fontWeight:600}}>Ref. Presupuesto / Pedido *</span>
                <input style={{...S.input,borderColor:C.vt+'66'}} value={form.refPresupuesto||''} onChange={e=>updateForm('refPresupuesto',e.target.value)} placeholder="PRES-2026/005"/>
                <div style={{fontSize:9,color:C.mt,marginTop:2}}>Vincularás este anticipo a la factura cuando llegue</div>
              </label>
            )}

            {/* Proveedor / Cliente */}
            <label style={{gridColumn:'1/-1'}}>
              <span style={{fontSize:10,color:isCobro?C.sc:C.mt}}>{isCobro?'Cliente *':'Proveedor *'}</span>
              <Combobox value={form.proveedor} options={isCobro?[...new Set([...proveedores,...invoices.filter(i=>i.tipo==='cobro').map(i=>i.proveedor)].filter(Boolean))].sort():proveedores}
                placeholder={isCobro?'Nombre del cliente':'Nombre del proveedor'} color={isCobro?C.sc:undefined}
                onChange={v=>{
                  updateForm('proveedor',v);
                  // En una factura emitida manda la ficha de CLIENTE; en una
                  // recibida, la de proveedor. Antes ambas leían la de proveedor.
                  if(isCobro){
                    const c=fichaCliente(v);
                    if(c.cif&&!form.proveedorCif)updateForm('proveedorCif',c.cif);
                    const dc=dirCompletaCliente(c);
                    if(dc&&!form.proveedorDir)updateForm('proveedorDir',dc);
                    if(c.diasVenc&&!form.fechaVencimiento){
                      const d0=new Date(form.fecha||today); d0.setDate(d0.getDate()+(+c.diasVenc||0));
                      updateForm('fechaVencimiento',d0.toISOString().slice(0,10));
                    }
                    if(c.retGarPct&&!form.retGarPct)updateForm('retGarPct',String(c.retGarPct));
                    return;
                  }
                  const d=getSupplierData(v);
                  if(d.iban&&!form.ibanProveedor)updateForm('ibanProveedor',d.iban);
                  if(d.cif&&!form.proveedorCif)updateForm('proveedorCif',d.cif);
                  if(d.dir&&!form.proveedorDir)updateForm('proveedorDir',d.dir);
                  if(!editing){updateForm('_marcarPagada',!!d.pagoAlRegistrar);if(d.pagoAlRegistrar&&d.metodoHabitual)updateForm('formaPago',d.metodoHabitual);}
                }}/>
            </label>
            {/* v376 · Jesús: «que antes de registrar proponga imputar la factura a algún
                proveedor que ya esté dado de alta; si no se clica, que lo dé de alta tal y
                como lo ha leído». Se propone, no se impone. */}
            {!isCobro&&form._sugProv&&form._sugProv.nombre&&form.proveedor!==form._sugProv.nombre&&(
              <div style={{gridColumn:'1/-1',display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',
                background:C.wn+'14',border:`1px solid ${C.wn}55`,borderRadius:10,padding:'8px 10px',marginTop:-4}}>
                <span style={{flex:'1 1 180px',fontSize:11,lineHeight:1.5}}>
                  ¿Es <b>{form._sugProv.nombre}</b>? ({form._sugProv.motivo}). Si no lo tocas, se dará de alta como <b>{form.proveedor}</b> y tendrás dos fichas del mismo proveedor.
                </span>
                <button style={{...S.sm(C.sc),flexShrink:0}} onClick={()=>{updateForm('proveedor',form._sugProv.nombre);updateForm('_sugProv',null);}}>✓ Usar el que ya existe</button>
                <button style={{...S.sm(C.mt),flexShrink:0}} onClick={()=>updateForm('_sugProv',null)}>Dejar lo leído</button>
              </div>
            )}
                {(()=>{if(isCobro||form.tipo!=='factura'||!form.proveedor)return null;const fp=getSupplierData(form.proveedor);const otras=(fp.ibans||[]).filter(x=>x&&normIban(x)!==normIban(form.ibanProveedor||''));if(!form.ibanProveedor&&!otras.length)return null;return(
                  <div style={{gridColumn:'1 / -1',fontSize:10,color:C.mt,margin:'0 0 4px'}}>
                    💳 Cuenta de pago: <b style={{fontFamily:'monospace',color:form.ibanProveedor?C.tx:C.wn}}>{form.ibanProveedor?('···'+normIban(form.ibanProveedor).slice(-6)):'sin cuenta'}</b>
                    {otras.length>0&&<span> · cambiar a: {otras.map(x=><button key={x} type="button" style={{background:'none',border:`1px solid ${C.bd}`,borderRadius:6,color:C.in,cursor:'pointer',fontSize:9,fontFamily:'monospace',padding:'1px 5px',marginLeft:4}} onClick={()=>updateForm('ibanProveedor',x)}>···{normIban(x).slice(-6)}</button>)}</span>}
                  </div>);})()}

            {/* CIF y dirección — datos fiscales de la contraparte */}
            <label><span style={{fontSize:10,color:C.mt}}>{isCobro?'CIF/NIF cliente':'CIF/NIF proveedor'}</span><input style={S.input} value={form.proveedorCif||''} onChange={e=>updateForm('proveedorCif',e.target.value.toUpperCase())} placeholder="B12345678" maxLength={12}/></label>
            <label style={{gridColumn:'1/-1'}}><span style={{fontSize:10,color:C.mt}}>{isCobro?'Dirección cliente':'Dirección proveedor'}</span><input style={S.input} value={form.proveedorDir||''} onChange={e=>updateForm('proveedorDir',e.target.value)} placeholder="Calle, CP, ciudad"/></label>

            {/* IBAN — only for facturas recibidas (for SEPA payment) */}
            {isFactura&&(<>
              <label style={{gridColumn:'1/-1'}}><span style={{fontSize:10,color:C.mt}}>IBAN proveedor <span style={{color:C.mt+'88'}}>(para fichero SEPA)</span></span><input style={{...S.input,fontFamily:'monospace',letterSpacing:'1px'}} value={form.ibanProveedor||''} onChange={e=>updateForm('ibanProveedor',e.target.value.toUpperCase())} placeholder="ES00 0000 0000 00 0000000000" maxLength={34}/></label>
                {(()=>{
                  if(!form.proveedor||isCobro)return null;
                  const fp=getSupplierData(form.proveedor);
                  const previas=invoices.filter(i=>i&&i.id!==form.id&&String(i.proveedor||'').trim().toLowerCase()===String(form.proveedor||'').trim().toLowerCase()&&i.ibanProveedor).map(i=>i.ibanProveedor);
                  const av=cuentaDesconocida(form.ibanProveedor,[fp.iban,...previas]);
                  if(!av)return null;
                  return(
                    <div style={{gridColumn:'1/-1',background:'#EAB30818',border:'1.5px solid #EAB308',borderRadius:8,
                      padding:'8px 10px',fontSize:11,lineHeight:1.5,color:'#EAB308',fontWeight:600}}>
                      ⚠️ Esta cuenta NO coincide con las que tenemos de {form.proveedor}
                      {av.conocidas.length===1?` (…${av.conocidas[0].slice(-4)})`:` (${av.conocidas.length} conocidas)`}.
                      Puede ser una cuenta nueva, pero el cambio de cuenta es el fraude más habitual:
                      verifícalo con el proveedor por un canal que ya conozcas antes de pagar.
              {(()=>{
                const cat=(Array.isArray(provCat)?provCat:[]).find(p=>p&&p.nombre===form.proveedor);
                const s=dominioSospechoso(form.remitente,cat&&cat.dominios);
                if(!s)return null;
                return(<div style={{marginTop:5,fontWeight:800}}>
                  Y ADEMÁS este correo llegó desde «{s.dominio}», que NO es su dominio habitual
                  ({s.conocidos.join(', ')}). Llama al proveedor a un número que ya tuvieras.
                </div>);
              })()}
                    </div>
                  );
                })()}
            </>)}

            {/* Structural expense checkbox — only for facturas */}
            {isFactura&&(
              <div style={{gridColumn:'1/-1',display:'flex',alignItems:'center',gap:8,padding:'4px 0'}}>
                <input type="checkbox" checked={form.esEstructural||false} onChange={e=>updateForm('esEstructural',e.target.checked)} style={{accentColor:C.vt,width:16,height:16}}/>
                <span style={{fontSize:11,color:form.esEstructural?C.vt:C.mt}}>🏢 Gasto estructural <span style={{fontSize:10,color:C.mt+'88'}}>(no vinculado a obra)</span></span>
              </div>
            )}

            {isCobro&&(
              <label style={{gridColumn:'1/-1'}}>
                <span style={{fontSize:10,color:C.mt}}>📐 Contrato vinculado <span style={{opacity:.6}}>(para agrupar certificaciones e IVA)</span></span>
                <select style={S.input} value={form.contratoId||''} onChange={e=>updateForm('contratoId',e.target.value||null)}>
                  <option value="">— Sin contrato —</option>
                  {(contratos||[]).map(c=><option key={c.id} value={c.id}>{c.numero} · {c.cliente}{c.obra?' · '+c.obra:''}</option>)}
                </select>
                <div style={{fontSize:9,color:C.mt,marginTop:2}}>¿No existe? Guarda la factura y pulsa "▸ vincular" en su detalle para crearlo con estos datos.</div>
              </label>
            )}
            {/* Obra / Proyecto / Centro de coste */}
            <label style={{gridColumn:'1/-1'}}>
              <span style={{fontSize:10,color:C.mt}}>{isCobro?'Proyecto / Servicio':form.esEstructural?'Centro de coste':'Dirección de obra'}</span>
              <Combobox value={form.obra} options={obrasAll}
                placeholder={isCobro?'Promoción, servicio prestado...':form.esEstructural?'Oficina, Vehículos, Asesoría...':'C/ Ejemplo 5, Illescas'}
                onChange={v=>updateForm('obra',v)}/>
              {!form.esEstructural&&<button type="button" style={{background:'none',border:'none',color:C.sc,fontSize:11,fontWeight:600,cursor:'pointer',padding:'4px 0',textAlign:'left'}}
                onClick={()=>openObraModal('form',form.obra?.trim()&&!obrasAll.includes(form.obra)?{calle:form.obra}:null)}>
                ➕ Dar de alta obra nueva{form.obra?.trim()&&!obrasAll.includes(form.obra)?` ("${form.obra.slice(0,30)}")`:''}
              </button>}
            </label>

            {/* ── ¿ES UN EXTRA? ── */}
            {/* Se marca aquí, al registrar, que es cuando se sabe. Luego sale
                en su contrato esperando a que se le ponga concepto y precio. */}
            {!isCobro&&!form.esEstructural&&(
              <label style={{gridColumn:'1/-1',display:'flex',alignItems:'flex-start',gap:9,
                background:form.extraPend?C.wn+'14':C.bg,borderRadius:9,padding:'9px 11px',
                border:`1px solid ${form.extraPend?C.wn+'66':C.bd}`,cursor:'pointer'}}>
                <input type="checkbox" checked={!!form.extraPend}
                  style={{width:19,height:19,flexShrink:0,marginTop:1,accentColor:C.wn}}
                  onChange={e=>updateForm('extraPend',e.target.checked)}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:form.extraPend?C.wn:C.tx}}>
                    ➕ Considerar extra
                  </div>
                  <div style={{fontSize:10,color:C.mt,lineHeight:1.45,marginTop:2}}>
                    {form.extraPend
                      ? 'No cuenta como gasto corriente. Saldrá en TODOS los contratos para que la metas en el que sea, tenga obra puesta o no.'
                      : 'Márcalo si este gasto no entra en el precio cerrado y hay que negociarlo con el promotor.'}
                  </div>
                </div>
              </label>
            )}

            <label style={{gridColumn:'1/-1'}}><span style={{fontSize:10,color:C.mt}}>Concepto</span><input style={S.input} value={form.concepto} onChange={e=>updateForm('concepto',e.target.value)} placeholder={isCobro?'Descripción del servicio facturado':'Descripción del material o servicio'}/></label>
            <label><span style={{fontSize:10,color:C.mt}}>Categoría</span><select style={S.select} value={form.categoria} onChange={e=>updateForm('categoria',e.target.value)}>{CATS.map(c=><option key={c}>{c}</option>)}</select></label>
            <label><span style={{fontSize:10,color:C.mt}}>{isCobro?'Forma de cobro':'Forma pago'}</span><select style={S.select} value={form.formaPago} onChange={e=>updateForm('formaPago',e.target.value)}>{FORMAS.map(f=><option key={f}>{f}</option>)}</select></label>

            <div style={{gridColumn:'1/-1',background:C.bg,borderRadius:10,padding:10,marginTop:2}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <label><span style={{fontSize:10,color:C.mt}}>{isAnt?'Importe anticipo':'Base imponible'} * (€)</span><input type="text" inputMode="decimal" style={{...S.input,fontWeight:700}} value={form.importeBase} onChange={e=>updateForm('importeBase',e.target.value)}/></label>
                <label><span style={{fontSize:10,color:C.mt}}>{isCobro?'IVA repercutido':'% IVA'}</span><select style={S.select} value={form.isp?0:form.tipoIva} onChange={e=>updateForm('tipoIva',+e.target.value)}>{IVAS.map(i=><option key={i} value={i}>{IVA_LABELS[i]||i+'%'}</option>)}</select></label>
                {/* Abono del proveedor: factura en negativo que deja sin efecto
                    otra suya. Se enlaza con la original para que deje de deberse. */}
                {!isCobro&&form.tipo==='factura'&&(
                  <div style={{gridColumn:'1/-1'}}>
                    <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',padding:'2px 0'}}>
                      <input type="checkbox" checked={!!form.esAbono} style={{width:18,height:18,accentColor:C.wn,flexShrink:0}}
                        onChange={e=>{
                          const on=e.target.checked;
                          setForm(p=>({...p,esAbono:on,abonoDe:on?p.abonoDe:null,
                            importeBase:on?String(-Math.abs(parseNum(p.importeBase)||0)||''):String(Math.abs(parseNum(p.importeBase)||0)||'')}));
                        }}/>
                      <span style={{fontSize:11}}>↩️ Es un abono <span style={{color:C.mt,fontSize:10}}>— rectificativa del proveedor que deja sin efecto otra factura</span></span>
                    </label>
                    {form.esAbono&&(()=>{
                      const cands=(invoices||[]).filter(x=>x&&x.tipo==='factura'&&!x.esAbono&&!esAnulada(x)
                        &&normProvNombre(x.proveedor||'')===normProvNombre(form.proveedor||''))
                        .sort((a,b)=>String(b.fecha||'').localeCompare(String(a.fecha||''))).slice(0,40);
                      return(
                        <div style={{background:C.wn+'12',border:`1px solid ${C.wn}44`,borderRadius:9,padding:'9px 11px',marginTop:6}}>
                          <span style={{fontSize:10,color:C.mt}}>¿Qué factura deja sin efecto?</span>
                          <select style={{...S.select,marginTop:3}} value={form.abonoDe||''} onChange={e=>updateForm('abonoDe',e.target.value||null)}>
                            <option value="">— Ninguna en concreto —</option>
                            {cands.map(x=><option key={x.id} value={x.id}>{x.numFactura||'(sin nº)'} · {fmtDate(x.fecha)} · {fmt(x.total)} €</option>)}
                          </select>
                          {!cands.length&&<div style={{fontSize:10,color:C.mt,marginTop:4}}>No encuentro facturas de «{form.proveedor||'ese proveedor'}». Escribe primero el proveedor tal y como está en la factura original.</div>}
                          {form.abonoDe&&(()=>{
                            const o=(invoices||[]).find(x=>x&&x.id===form.abonoDe);
                            const ab=Math.abs(parseNum(form.importeBase)||0)*(1+(+form.tipoIva||0)/100);
                            if(!o)return null;
                            const resta=+(Math.abs(+o.total||0)-ab).toFixed(2);
                            return(
                              <div style={{fontSize:10,color:C.mt,marginTop:6,lineHeight:1.45}}>
                                La {o.numFactura||'factura'} es de <b>{fmt(o.total)} €</b>. Con este abono quedará
                                {Math.abs(resta)<0.01
                                  ? <b style={{color:C.sc}}> saldada del todo</b>
                                  : <b style={{color:C.wn}}> un pendiente de {fmt(resta)} €</b>}.
                              </div>
                            );
                          })()}
                          <div style={{fontSize:10,color:C.mt,marginTop:5,lineHeight:1.45}}>
                            Las dos facturas se quedan en el libro: el IVA soportado de una compensa el de la otra. Lo que cambia es que dejas de deberla.
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                {/* La inversión del sujeto pasivo, a la vista y desmarcable:
                    muchos proveedores llevan la leyenda impresa en TODAS sus
                    facturas, también en las que sí repercuten IVA. */}
                <label style={{gridColumn:'1/-1',display:'flex',alignItems:'center',gap:8,cursor:'pointer',padding:'2px 0'}}>
                  <input type="checkbox" checked={!!form.isp} style={{width:18,height:18,accentColor:C.in,flexShrink:0}}
                    onChange={e=>setForm(p=>({...p,isp:e.target.checked,tipoIva:e.target.checked?0:(p.tipoIva||21)}))}/>
                  <span style={{fontSize:11}}>Inversión del sujeto pasivo <span style={{color:C.mt,fontSize:10}}>— sin IVA, lo declara el destinatario (art. 84.1.2.f)</span></span>
                </label>
                {/* Tantas bases como tenga la factura. Antes solo cabían dos y
                    lo que sobraba se perdía sin avisar. */}
                {!isCobro&&form.tipo==='factura'&&(form.basesExtra||[]).map((bx,bi)=>(
                  <React.Fragment key={bi}>
                    <label><span style={{fontSize:10,color:C.mt}}>Base {bi+2}ª <button type="button" style={{background:'none',border:'none',color:C.dn,cursor:'pointer',fontSize:10,padding:'0 0 0 4px'}} onClick={()=>updateForm('basesExtra',(form.basesExtra||[]).filter((_,k)=>k!==bi))}>× quitar</button></span>
                      <input style={S.input} type="text" inputMode="decimal" value={bx.base??''} placeholder="0,00"
                        onChange={e=>updateForm('basesExtra',(form.basesExtra||[]).map((x,k)=>k===bi?{...x,base:e.target.value}:x))}/></label>
                    <label><span style={{fontSize:10,color:C.mt}}>% IVA {bi+2}ª</span>
                      <select style={S.select} value={bx.tipo??10} onChange={e=>updateForm('basesExtra',(form.basesExtra||[]).map((x,k)=>k===bi?{...x,tipo:+e.target.value}:x))}>
                        {TIPOS_IVA.map(v=><option key={v} value={v}>{v}%</option>)}
                      </select></label>
                  </React.Fragment>
                ))}
                {!isCobro&&form.tipo==='factura'&&(
                  <button type="button" style={{...S.ghost,fontSize:10,alignSelf:'end',padding:'8px 6px',whiteSpace:'nowrap',gridColumn:(form.basesExtra||[]).length?'1/-1':'auto'}}
                    onClick={()=>updateForm('basesExtra',[...(form.basesExtra||[]),{base:'',tipo:10}])}>＋ Otra base con distinto IVA</button>
                )}
                <label><span style={{fontSize:10,color:C.mt}}>{isCobro?'Retención del cliente':'% IRPF retención'}</span><select style={S.select} value={form.irpf} onChange={e=>updateForm('irpf',+e.target.value)}>{IRPFS.map(i=><option key={i} value={i}>{i}%</option>)}</select></label>
                <div style={{display:'flex',flexDirection:'column',justifyContent:'center',fontSize:11}}>
                  <div style={{color:C.mt}}>{isCobro?'IVA repercut.':'IVA'}: {fmt(t.iva)} €</div>
                  {t.retencion>0&&<div style={{color:C.mt}}>{isCobro?'Ret. cliente':'Ret.'}: -{fmt(t.retencion)} €</div>}
                </div>
              </div>
              {isCobro&&<label style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:C.vt,marginTop:8,justifyContent:'flex-end'}}>🛡️ Ret. garantía
                <input type="text" inputMode="decimal" style={{...S.input,width:60,textAlign:'right',padding:'6px 8px',minHeight:36}} value={form.retGarPct||''} onChange={e=>updateForm('retGarPct',e.target.value)} placeholder="0"/> %
              </label>}
              {(()=>{
                // Aviso de factura sin importe: que no parezca que el lector falló
                const tl0=parseNum(form._totalLeido);
                const cero=String(form.importeBase??'')==='0'&&(t.total===0);
                if(!cero||isCobro)return null;
                return(
                  <div style={{background:C.in+'12',border:`1px solid ${C.in}44`,borderRadius:8,padding:'8px 10px',marginTop:8,fontSize:11}}>
                    <b>ℹ️ Esta factura es de importe 0 €</b>
                    <div style={{fontSize:10,color:C.mt,marginTop:2}}>Así viene en su cuadro de impuestos. Es normal en reposiciones en garantía o material sin cargo: se registra igual, para que quede constancia.</div>
                  </div>
                );
              })()}
              {(()=>{
                // El total impreso en la factura es el número que mejor se lee.
                // Si el desglose no llega a él, algo falta: casi siempre una
                // base a otro tipo que el lector no ha visto.
                const tl=parseNum(form._totalLeido)||0;
                if(!tl||isCobro)return null;
                const dif=+(t.total-tl).toFixed(2);
                if(Math.abs(dif)<=0.02)return null;
                return(
                  <div style={{background:C.wn+'14',border:`1px solid ${C.wn}55`,borderRadius:8,padding:'8px 10px',marginTop:8,fontSize:11,color:C.wn}}>
                    <b>⚠ Las cuentas no llegan al total de la factura.</b>
                    <div style={{fontSize:10,color:C.mt,marginTop:2}}>
                      Con lo que hay puesto sale <b>{fmt(t.total)} €</b> y la factura pone <b>{fmt(tl)} €</b> ({dif>0?'sobran':'faltan'} {fmt(Math.abs(dif))} €).
                      {dif<0&&' Suele ser una base a otro tipo de IVA: añádela con «＋ Otra base».'}
                    </div>
                    {dif<0&&(()=>{
                      // Se propone la base que cerraría la diferencia a cada tipo
                      const op=TIPOS_IVA.filter(v=>v>0).map(v=>({v,b:+(Math.abs(dif)/(1+v/100)).toFixed(2)}));
                      return(
                        <div style={{display:'flex',gap:5,marginTop:6,flexWrap:'wrap'}}>
                          {op.map(o=>(
                            <button key={o.v} type="button" style={{...S.sm(C.in),padding:'4px 9px',fontSize:10,minHeight:0}}
                              onClick={()=>updateForm('basesExtra',[...(form.basesExtra||[]),{base:String(o.b),tipo:o.v}])}>
                              ＋ {fmt(o.b)} € al {o.v}%
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}
              <div style={{marginTop:8,textAlign:'right',borderTop:`1px solid ${C.bd}`,paddingTop:6}}>
                <span style={{fontSize:10,color:C.mt}}>{isCobro?'A COBRAR':'TOTAL'} </span><span style={{fontSize:19,fontWeight:800,color:isCobro?C.sc:C.ac}}>{fmt(t.total)} €</span>
                {isCobro&&(()=>{const rp=parseNum(form.retGarPct)||0;if(rp<=0)return null;const ri=+((parseNum(form.importeBase)||0)*rp/100).toFixed(2);return <div style={{fontSize:11,color:C.vt}}>Ret. garantía {rp}%: −{fmt(ri)} € · <b>Líquido: {fmt(t.total-ri)} €</b></div>;})()}
              </div>
              {/* Verificación contra el total impreso en la factura escaneada */}
              {form._totalLeido>0&&Math.abs(t.total-form._totalLeido)>0.05&&(
                <div style={{marginTop:6,padding:'6px 10px',background:C.wn+'18',border:`1px solid ${C.wn}44`,borderRadius:8,fontSize:11,color:C.wn}}>
                  ⚠ La factura escaneada indica un total de <strong>{fmt(form._totalLeido)} €</strong> pero el calculado es {fmt(t.total)} € — revisa base, IVA o retención
                </div>
              )}
              {form._totalLeido>0&&Math.abs(t.total-form._totalLeido)<=0.05&&(
                <div style={{marginTop:6,fontSize:10,color:C.sc,textAlign:'right'}}>✓ Coincide con el total impreso en la factura</div>
              )}
            </div>

            {!isAnt&&<label><span style={{fontSize:10,color:C.mt}}>{isCobro?'Fecha cobro previsto':'Vencimiento'}</span><input type="date" style={S.input} value={form.fechaVencimiento} onChange={e=>updateForm('fechaVencimiento',e.target.value)}/>
              <div style={{display:'flex',gap:4,marginTop:4}}>
                {[30,60,90].map(d=><button key={d} type="button" style={{background:C.in+'18',color:C.in,border:'none',borderRadius:6,padding:'4px 10px',fontSize:11,fontWeight:600,cursor:'pointer'}} onClick={()=>{const base=new Date(form.fecha||today);base.setDate(base.getDate()+d);updateForm('fechaVencimiento',base.toISOString().slice(0,10));}}>+{d}d</button>)}
              </div>
            </label>}
            <label style={{gridColumn:isAnt?'1/-1':undefined}}><span style={{fontSize:10,color:C.mt}}>Notas</span><textarea style={{...S.input,height:36,resize:'vertical'}} value={form.notas} onChange={e=>updateForm('notas',e.target.value)}/></label>
          </div>
          {!isCobro&&form.tipo==='factura'&&(
            <label style={{display:'flex',alignItems:'center',gap:8,fontSize:11,color:form.proforma?'#F0B429':C.mt,margin:'10px 0 2px',cursor:'pointer'}}>
              <input type="checkbox" checked={!!form.proforma} onChange={e=>setForm(f=>({...f,proforma:e.target.checked}))}/>
              📄 Proforma — pago anticipado a falta de factura definitiva (se paga por SEPA como cualquier pendiente)
            </label>
          )}
          {(()=>{
            const b=parseNum(form.importeBase)||0;
            const t=calcDesglose(desgloseForm(form),form.irpf);
            const dup=hallarDuplicada({...form,total:t.total},invoices,editing);
            const enPap=(!editing)?hallarDuplicada({...form,total:t.total},invoicesAll.filter(x=>x&&x._del),null):null;
            const prof=(!form.proforma&&!editing&&form.tipo==='factura')?hallarProforma({proveedor:form.proveedor,total:t.total},invoices):null;
            if(!dup&&!prof&&!enPap)return null;
            return(
              <div style={{background:'#F0B42918',border:'1px solid #F0B42966',borderRadius:8,padding:'8px 10px',marginBottom:10,fontSize:11,color:'#F0B429'}}>
                {dup&&<div><b>⚠ {esDupFuerte(dup)?'Ya registrada':dup.motivo==='importe-num-distinto'?'Mismo importe, otro número':'Posible duplicado'}:</b> {dup.inv.numFactura?`nº ${dup.inv.numFactura} · `:''}{dup.inv.proveedor} — {fmtDate(dup.inv.fecha)} · {fmt(dup.inv.total)} € ({getEstado(dup.inv,invoices)==='pagada'?'pagada':'pendiente de pago'})
                  {dup.motivo==='importe-num-distinto'&&<div style={{fontSize:10,opacity:.85,marginTop:2}}>Los números no coinciden, así que se guarda sin más. Revísalo solo por si acaso.</div>}
                </div>}
                {dup&&dup.motivo&&dup.motivo.startsWith('importe')&&<div style={{marginTop:4,fontSize:10,color:C.mt}}>Coincide por <b>importe{dup.motivo==='importe-exacto'?' y fecha':''}</b>{dup.motivo==='importe-otro'?' pero el proveedor es distinto — revísalo':''}.</div>}
                {enPap&&<div style={{marginTop:dup?6:0}}>🗑️ Hay una factura <b>igual en la papelera</b> ({enPap.inv.proveedor} · nº {enPap.inv.numFactura||'s/n'}). <button style={{marginLeft:6,padding:'3px 8px',border:'none',borderRadius:6,cursor:'pointer',fontSize:10,fontWeight:700,background:C.sc,color:'#04120C'}} onClick={()=>{restaurarFactura(enPap.inv.id);closeForm();}}>↩️ Restaurar esa</button> <span style={{color:C.mt}}>en vez de crear otra</span></div>}
                {dup&&esDupFuerte(dup)&&ES_APP&&form._file&&!dup.inv.adjPath&&<div style={{marginTop:6}}>📎 ¿Solo querías archivar el papel? <button style={{marginLeft:4,padding:'3px 8px',border:'none',borderRadius:6,cursor:'pointer',fontSize:10,fontWeight:700,background:C.in,color:'#04120C'}} onClick={()=>{subirAdjuntos([[dup.inv.id,form._file]]);closeForm();notify('📎 Documento guardado en la factura existente');}}>Guardar documento en la existente</button></div>}
                {prof&&<div style={{marginTop:dup?6:0}}>🔁 <b>Proforma {getEstado(prof,invoices)==='pagada'?'PAGADA':'registrada'}</b> de este proveedor por el mismo importe (nº {prof.numFactura||'s/n'} · {fmtDate(prof.fecha)}). <button style={{marginLeft:6,padding:'3px 8px',border:'none',borderRadius:6,cursor:'pointer',fontSize:10,fontWeight:700,background:'#F0B429',color:'#1B2740'}} onClick={()=>convertirProforma(prof,t)}>Convertir en esta definitiva</button></div>}
              </div>
            );
          })()}
          {/* Marcar como pagada en el mismo acto de registrar. Viene premarcada
              si la ficha del proveedor dice que se paga solo. */}
          {!editing&&!isCobro&&form.tipo!=='anticipo'&&(()=>{
            const fp=form.proveedor?getSupplierData(form.proveedor):null;
            const porFicha=!!(fp&&fp.pagoAlRegistrar);
            return(
              <label style={{display:'flex',alignItems:'center',gap:8,marginTop:10,padding:'9px 11px',borderRadius:9,cursor:'pointer',background:form._marcarPagada?C.sc+'16':C.bg,border:`1px solid ${form._marcarPagada?C.sc+'66':C.bd}`}}>
                <input type="checkbox" checked={!!form._marcarPagada} onChange={e=>updateForm('_marcarPagada',e.target.checked)} style={{width:20,height:20,accentColor:C.sc,flexShrink:0}}/>
                <span style={{fontSize:11,flex:1,minWidth:0}}>
                  <b>Marcar como pagada</b> al registrarla
                  {form._marcarPagada&&<span style={{color:C.mt}}> · {form.formaPago||'Transferencia'} · {fmtDate(form.fecha||today)}</span>}
                  {porFicha&&<div style={{fontSize:9,color:C.sc,marginTop:2}}>✓ Premarcada: la ficha de {form.proveedor} dice que se paga solo</div>}
                  {!porFicha&&form.proveedor&&form._marcarPagada&&<div style={{fontSize:9,color:C.mt,marginTop:2}}>¿Pasa siempre con este proveedor? Márcalo en su ficha y vendrá solo.</div>}
                </span>
              </label>
            );
          })()}
          <div style={{display:'flex',gap:8,marginTop:12,justifyContent:'flex-end'}}>
            <button style={S.ghost} onClick={closeForm}>{inBatch?'Cancelar lote':'Cancelar'}</button>
            <button style={S.btn(isCobro?C.sc:undefined)} onClick={saveInvoice}>{editing?'Guardar':isCobro?'Registrar cobro':'Registrar'}</button>
          </div>
        </div>
      </div>
    );
  })();

const ModalPagoFactura=({FORMAS,avisarCerrar,invoices,pagoForm,pagoModal,savePago,setPagoForm,setPagoModal})=>(()=>{const inv=invoices.find(i=>i.id===pagoModal);if(!inv)return null;const saldo=getSaldo(inv,invoices);
    return(<div style={{...S.overlay,zIndex:CAPAS.ACCION}} onClick={avisarCerrar}>
      <div style={S.modal} onClick={e=>e.stopPropagation()}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>💰 Registrar pago</div>
      <div style={{fontSize:11,color:C.mt,marginBottom:10}}>{inv.proveedor} · Total: {fmt(inv.total)} € · Saldo: <span style={{color:C.wn,fontWeight:600}}>{fmt(saldo)} €</span></div>
      <div style={{display:'grid',gap:8}}>
        <label><span style={{fontSize:10,color:C.mt}}>Importe (€)</span><input type="text" inputMode="decimal" style={{...S.input,fontWeight:700}} value={pagoForm.importe} onChange={e=>setPagoForm(p=>({...p,importe:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter')savePago();}} autoFocus/></label>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <label><span style={{fontSize:10,color:C.mt}}>Fecha</span><input type="date" style={S.input} value={pagoForm.fecha} onChange={e=>setPagoForm(p=>({...p,fecha:e.target.value}))}/></label>
          <label><span style={{fontSize:10,color:C.mt}}>Método</span><select style={S.select} value={pagoForm.metodo} onChange={e=>setPagoForm(p=>({...p,metodo:e.target.value}))}>{FORMAS.map(f=><option key={f}>{f}</option>)}</select></label>
        </div>
        <label><span style={{fontSize:10,color:C.mt}}>Referencia</span><input style={S.input} value={pagoForm.referencia} onChange={e=>setPagoForm(p=>({...p,referencia:e.target.value}))} placeholder="Nº transferencia..."/></label>
        {parseNum(pagoForm.importe)>0&&parseNum(pagoForm.importe)<saldo&&<div style={{background:C.in+'22',color:C.in,padding:8,borderRadius:8,fontSize:11}}>Pago parcial — quedarán {fmt(saldo-parseNum(pagoForm.importe))} € pendientes</div>}
      </div>
      <div style={{display:'flex',gap:8,marginTop:12,justifyContent:'flex-end'}}><button style={S.ghost} onClick={()=>setPagoModal(null)}>Cancelar</button><button style={S.btn(C.sc)} onClick={savePago}>Registrar</button></div>
    </div></div>);
  })();

const ModalSesionCerrada=({sesionRevocada})=>(
  (sesionRevocada&&(
        <div style={{...S.overlay,zIndex:CAPAS.ENCIMA,background:'#0F172AF2',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{textAlign:'center',color:'#fff',padding:24}}>
            <div style={{fontSize:38,marginBottom:10}}>🔒</div>
            <div style={{fontWeight:800,fontSize:16,marginBottom:6}}>Sesión cerrada por el administrador</div>
            <div style={{fontSize:12,opacity:.8}}>Este aparato ha sido desconectado desde la ventana Master.</div>
          </div>
        </div>
      ))||null
);

const ModalRecurrentesExtracto=({setVerRecu,verRecu})=>(
  (verRecu&&(
        <div style={{...S.overlay,zIndex:CAPAS.SOBRE+5}}>
          <div style={{...S.modal,maxWidth:640,padding:8}} onClick={e=>e.stopPropagation()}>
            <div style={{...S.cabModal,padding:'4px 6px'}}><b style={{fontSize:13.5,flex:1,minWidth:0}}>🧠 Recurrentes del extracto</b>
              <button style={S.ghost} onClick={()=>setVerRecu(false)}>✕</button></div>
            <iframe title="Recurrentes" src="recurrentes.html"
              style={{width:'100%',height:'74vh',border:0,borderRadius:10,background:'#fff'}}
              onLoad={e=>{try{e.target.contentWindow.storage=window.storage;}catch(x){}}}/>
            <div style={{fontSize:9.5,color:C.mt,margin:'6px 2px 0'}}>Todo lo que pegues o ajustes se guarda en tu nube protegida, como el resto de la app.</div>
          </div>
        </div>
      ))||null
);

const ModalCompradores=({borraCfg,lineasAPdf,notify,promoBusy,promoCfg,setEditCfg,setVerPromo,setVerResumen,shareOrDownload,verPromo,verificaCfg})=>(
  (verPromo&&(
        <div style={{...S.overlay,zIndex:CAPAS.SOBRE}}>
          <div style={{...S.modal,maxWidth:520}} onClick={e=>e.stopPropagation()}>
            <div style={S.cabModal}><b style={{fontSize:14}}>🏘️ Promoción {verPromo.promocion} — {verPromo.cliente}</b>
              <button style={S.ghost} onClick={()=>setVerPromo(null)}>✕</button></div>
            <div style={{fontSize:10.5,color:C.mt,lineHeight:1.5,marginBottom:10}}>
              Compradores y mejoras llegadas del configurador de la web. Cada cambio del
              comprador es una versión nueva: nada se pisa. Estos compradores NO entran
              en tu panel de clientes: viven solo aquí, dentro del contrato.
            </div>
            {promoBusy&&<div style={{fontSize:11,color:C.mt,marginBottom:8}}>Recogiendo envíos nuevos…</div>}
            {(()=>{
              const grupos=agrupaPromo(Object.values(promoCfg),verPromo.promocion);
              if(!grupos.length){
                const otros=[...new Set(Object.values(promoCfg).filter(x=>x&&!x.borrado&&x.tipo==='configuracion').map(x=>String(x.promocion||'').trim()).filter(Boolean))];
                return <div style={{fontSize:11.5,color:C.mt,textAlign:'center',padding:'14px 0'}}>
                  Aún no ha llegado ninguna configuración de esta promoción.<br/>
                  {otros.length
                    ?<span style={{color:'#EAB308'}}>Ojo: sí hay envíos de otros códigos ({otros.join(' · ')}) — comprueba que el código del contrato sea EXACTAMENTE uno de esos.</span>
                    :'Llegarán solas cuando los compradores usen el configurador.'}</div>;
              }
              return grupos.map(g=>(
                <div key={g.vivienda} style={{border:`1px solid ${C.bd}55`,borderRadius:10,padding:'8px 10px',marginBottom:8}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12.5,fontWeight:800}}>🏠 Vivienda {g.vivienda}
                        <span style={{fontWeight:500,color:C.mt}}> · {g.ultima.nombre||'—'}</span></div>
                      <div style={{fontSize:10,color:C.mt}}>
                        {g.ultima.dni?`DNI ${g.ultima.dni}`:'⚠ sin DNI'} · {g.ultima.email||g.ultima.telefono||'sin contacto'} · {String(g.ultima.enviadoISO||'').slice(0,10)||'—'}
                        {g.versiones.length>1?` · ${g.versiones.length} versiones`:''}
                        {g.ultima.editadoEn?' · corregida por ti':''}
                      </div>
                      <div style={{fontSize:9.5,fontWeight:800,marginTop:2,color:g.ultima.verificada?C.sc:'#EAB308'}}>
                        {g.ultima.verificada?`✓ VERIFICADA (${g.ultima.verificada.en})`:'⏳ SIN VERIFICAR — comprueba el DNI antes de darla por buena'}
                      </div>
                    </div>
                    <div style={{fontSize:13,fontWeight:800,color:C.sc,whiteSpace:'nowrap'}}>Mejoras: +{fmt(g.ultima.total)} €</div>
                    <div style={{display:'flex',flexDirection:'column',gap:4,flexShrink:0}}>
                      <div style={{display:'flex',gap:4}}>
                        <button style={{...S.sm(C.in),padding:'3px 8px',minHeight:0}} onClick={()=>setVerResumen(g.ultima)}>📄</button>
                        {!g.ultima.verificada&&<button title="Verificar" style={{...S.sm(C.sc),padding:'3px 8px',minHeight:0}} onClick={()=>verificaCfg(g.ultima)}>✔</button>}
                      </div>
                      <div style={{display:'flex',gap:4}}>
                        <button title="Editar" style={{...S.sm(C.mt),padding:'3px 8px',minHeight:0}}
                          onClick={()=>setEditCfg({...g.ultima,total:fmt(g.ultima.total)})}>✏️</button>
                        <button title="Borrar" style={{...S.sm(C.dn),padding:'3px 8px',minHeight:0}} onClick={()=>borraCfg(g.ultima)}>🗑</button>
                      </div>
                    </div>
                  </div>
                  {g.versiones.length>1&&(
                    <div style={{marginTop:6,paddingTop:6,borderTop:`1px dashed ${C.mt}33`}}>
                      {g.versiones.slice(1).map(vv=>(
                        <div key={vv.id} style={{display:'flex',alignItems:'center',gap:8,fontSize:10.5,color:C.mt,padding:'2px 0'}}>
                          <span style={{flex:1}}>versión anterior · {String(vv.enviadoISO||'').slice(0,10)||'—'}</span>
                          <span>+{fmt(vv.total)} €</span>
                          <button style={{...S.sm(C.mt),padding:'1px 7px',minHeight:0,fontSize:10,flexShrink:0}}
                            onClick={()=>setVerResumen(vv)}>📄</button>
                          <button style={{...S.sm(C.dn),padding:'1px 7px',minHeight:0,fontSize:10,flexShrink:0}}
                            onClick={()=>borraCfg(vv)}>🗑</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ));
            })()}
            {(()=>{const grupos=agrupaPromo(Object.values(promoCfg),verPromo.promocion);
              if(!grupos.length)return null;
              return(<>
              <button style={{...S.sm(C.in),width:'100%',marginBottom:6}} onClick={()=>{
                const {viv,hist}=filasPromoExcel(grupos);
                const wb=XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(viv),'Viviendas');
                XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(hist),'Historial');
                const out=XLSX.write(wb,{bookType:'xlsx',type:'array'});
                shareOrDownload(new Blob([out],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),
                  `Mejoras_${String(verPromo.promocion).replace(/[^\w-]/g,'')}_${today}.xlsx`);
                notify('📥 Excel de la promoción generado: '+viv.length+' viviendas, '+hist.length+' versiones');
              }}>📥 Exportar Excel de la promoción</button>
              <button style={{...S.sm(C.in),width:'100%',marginBottom:6}} onClick={()=>{
                lineasAPdf('Mejoras de compradores — '+(verPromo.cliente||''),
                  lineasPromoPdf(grupos,verPromo.promocion),
                  `Mejoras_${String(verPromo.promocion).replace(/[^\w-]/g,'')}_${today}.pdf`)
                .then(()=>notify('📄 PDF de la promoción generado'))
                .catch(e=>notify('No se pudo generar el PDF: '+String(e&&e.message||e).slice(0,80),'error'));
              }}>📄 Exportar PDF de la promoción</button></>);})()}
            <button style={{...S.btn(C.sc),width:'100%',marginTop:4}} onClick={()=>setVerPromo(null)}>✔ Hecho</button>
          </div>
        </div>
      ))||null
);

const ModalErratasComprador=({editCfg,guardaPromoCfg,notify,promoCfg,setEditCfg})=>(
  (editCfg&&(
        <div style={{...S.overlay,zIndex:CAPAS.SOBRE2}}>
          <div style={{...S.modal,maxWidth:440}} onClick={e=>e.stopPropagation()}>
            <div style={S.cabModal}><b style={{fontSize:13.5}}>✏️ Corregir configuración · Vivienda {editCfg.vivienda}</b>
              <button style={S.ghost} onClick={()=>setEditCfg(null)}>✕</button></div>
            <div style={{fontSize:10.5,color:C.mt,marginBottom:8}}>Para erratas del comprador (nombre, DNI, importe…). El resumen visual se conserva tal cual llegó.</div>
            {[['nombre','Nombre'],['dni','DNI/NIE'],['telefono','Teléfono'],['vivienda','Nº de vivienda'],['total','Total de mejoras (€)']].map(([k,r])=>(
              <label key={k} style={{display:'block',marginBottom:7}}><span style={{fontSize:10,color:C.mt}}>{r}</span>
                <input style={S.input} value={editCfg[k]||''} inputMode={k==='total'?'decimal':undefined}
                  onChange={e=>setEditCfg(p=>({...p,[k]:k==='dni'?e.target.value.toUpperCase():e.target.value}))}/></label>
            ))}
            <button style={{...S.btn(C.sc),width:'100%',marginTop:4}} onClick={()=>{
              const next={...promoCfg,[editCfg.id]:{...promoCfg[editCfg.id],
                nombre:editCfg.nombre||'',dni:editCfg.dni||'',telefono:editCfg.telefono||'',
                vivienda:String(editCfg.vivienda||'').trim()||promoCfg[editCfg.id].vivienda,
                total:+(parseNum(editCfg.total)||0).toFixed(2),editadoEn:today}};
              guardaPromoCfg(next);setEditCfg(null);notify('✏️ Configuración corregida');
            }}>✔ Guardar la corrección</button>
          </div>
        </div>
      ))||null
);

const ModalAprenderExtracto=({cargarExtractoPegado,pegaExtracto,setPegaExtracto,setTxtExtracto,txtExtracto})=>(
  (pegaExtracto&&(
        <div style={{...S.overlay,zIndex:CAPAS.SOBRE2}}>
          <div style={{...S.modal,maxWidth:520}} onClick={e=>e.stopPropagation()}>
            <div style={S.cabModal}><b style={{fontSize:13.5,flex:1,minWidth:0}}>📥 Aprender del extracto del banco</b>
              <button style={S.ghost} onClick={()=>setPegaExtracto(false)}>✕</button></div>
            <div style={{fontSize:10.5,color:C.mt,lineHeight:1.5,marginBottom:8}}>
              Pega los movimientos (cuantos más meses, mejor aprende), una línea por apunte:
              <b> dd/mm/aaaa;concepto;importe</b> — el importe con signo (−2.340,50 para cargos).
              El motor separa lo que ya explican facturas y nóminas, detecta los gastos
              recurrentes (TGSS, cuotas, renting…) y los mete en la previsión.
              El análisis completo (confirmar, descartar, conciliar) vive en el botón <b>🧠 Recurrentes del extracto</b> de esta misma ventana.
            </div>
            <textarea style={{...S.input,minHeight:150,fontSize:16}} value={txtExtracto}
              placeholder={'30/07/2026;TGSS COTIZACION REGIMEN GENERAL;-2.340,50\n05/07/2026;RECIBO RENTING FURGONETA;-420,00'}
              onChange={e=>setTxtExtracto(e.target.value)}/>
            <button style={{...S.btn(C.sc),width:'100%',marginTop:10}} onClick={cargarExtractoPegado}>🧠 Aprender</button>
          </div>
        </div>
      ))||null
);

const ModalEnvioSinResumen=({lineasAPdf,notify,setVerResumen,shareOrDownload,verResumen})=>(
  (verResumen&&(
        <div style={{...S.overlay,zIndex:CAPAS.SOBRE2}}>
          <div style={{...S.modal,maxWidth:560}} onClick={e=>e.stopPropagation()}>
            <div style={S.cabModal}><b style={{fontSize:13.5}}>📄 Configuración · Vivienda {verResumen.vivienda} · {verResumen.nombre||'—'}</b>
              <button style={S.ghost} onClick={()=>setVerResumen(null)}>✕</button></div>
            <div style={{fontSize:10,color:C.mt,marginBottom:8}}>
              Enviada el {String(verResumen.enviadoISO||'').slice(0,16).replace('T',' a las ')||'—'} · Mejoras: +{fmt(verResumen.total)} €
            </div>
            {verResumen.resumenHtml
              ?<div style={{background:'#fff',color:'#1c2b30',borderRadius:10,padding:'10px 12px',maxHeight:'55vh',overflowY:'auto',WebkitOverflowScrolling:'touch',fontSize:12}}
                 dangerouslySetInnerHTML={{__html:sanitizaResumen(verResumen.resumenHtml)}}/>
              :<div style={{fontSize:11.5,color:C.mt,padding:'12px 0',textAlign:'center'}}>Este envío llegó sin el resumen visual (pesaba demasiado); los datos de arriba son los completos.</div>}
            <button style={{...S.sm(C.in),width:'100%',marginTop:10}} onClick={()=>{
              const cab=`<h1 style="font-size:18px">Configuración de mejoras · Vivienda ${verResumen.vivienda}</h1>
                <p>${verResumen.nombre||'—'} · DNI ${verResumen.dni||'—'} · ${verResumen.telefono||'—'}<br/>
                Enviada: ${String(verResumen.enviadoISO||'').slice(0,16).replace('T',' ')} · Mejoras: +${fmt(verResumen.total)} €</p><hr/>`;
              const html='<!doctype html><html><head><meta charset="utf-8"><title>Configuración vivienda '+verResumen.vivienda+'</title></head><body style="font-family:sans-serif;color:#1c2b30;max-width:720px;margin:20px auto;padding:0 14px">'+cab+sanitizaResumen(verResumen.resumenHtml||'<p>(sin resumen visual)</p>')+'</body></html>';
              shareOrDownload(new Blob([html],{type:'text/html'}),`Configuracion_viv${String(verResumen.vivienda).replace(/[^\w-]/g,'')}_${String(verResumen.enviadoISO||'').slice(0,10)}.html`);
            }}>⬇ Guardar esta configuración (para archivar o imprimir)</button>
            <button style={{...S.sm(C.in),width:'100%',marginTop:8}} onClick={()=>{
              const cab=['Comprador: '+(verResumen.nombre||'—')+' · DNI '+(verResumen.dni||'—'),
                'Teléfono: '+(verResumen.telefono||'—')+' · Enviada: '+String(verResumen.enviadoISO||'').slice(0,16).replace('T',' '),
                'Mejoras: +'+fmt(verResumen.total)+' €'+(verResumen.verificada?' · VERIFICADA '+(verResumen.verificada.en||''):' · SIN VERIFICAR'),''];
              lineasAPdf('Configuración de mejoras · Vivienda '+verResumen.vivienda,
                cab.concat(textoDeResumen(verResumen.resumenHtml||'(sin resumen visual)')),
                `Configuracion_viv${String(verResumen.vivienda).replace(/[^\w-]/g,'')}_${String(verResumen.enviadoISO||'').slice(0,10)}.pdf`)
              .then(()=>notify('📄 PDF de la configuración generado'))
              .catch(e=>notify('No se pudo generar el PDF: '+String(e&&e.message||e).slice(0,80),'error'));
            }}>📄 Exportar en PDF (para el anexo del contrato)</button>
            <button style={{...S.btn(C.sc),width:'100%',marginTop:8}} onClick={()=>setVerResumen(null)}>✔ Hecho</button>
          </div>
        </div>
      ))||null
);

const ModalConectarGmail=({gmailIdTmp,notify,pideGmailId,setGmailIdTmp,setPideGmailId})=>(
  (pideGmailId&&(
        <div style={{...S.overlay,zIndex:CAPAS.SOBRE}}>
          <div style={{...S.modal,maxWidth:460}} onClick={e=>e.stopPropagation()}>
            <div style={S.cabModal}><b style={{fontSize:14}}>📧 Conectar tu Gmail (gratuito)</b>
              <button style={S.ghost} onClick={()=>setPideGmailId(false)}>✕</button></div>
            <div style={{fontSize:11,color:C.mt,lineHeight:1.55,marginBottom:10}}>
              La app hablará DIRECTAMENTE con tu cuenta de Google, solo lectura y sin coste
              (no pasa por la API de pago). Hace falta una vez un «ID de cliente» de tu
              propio proyecto de Google:
              <br/>1) console.cloud.google.com → proyecto <b>b10h-facturas</b>
              <br/>2) «APIs y servicios» → Biblioteca → <b>Gmail API</b> → Habilitar
              <br/>3) Credenciales → Crear credencial → <b>ID de cliente de OAuth</b> → tipo
              «Aplicación web» → añade como origen <b>https://bh10group.com</b>
              <br/>4) Copia el ID (acaba en .apps.googleusercontent.com) y pégalo aquí.
            </div>
            <input style={S.input} value={gmailIdTmp} placeholder="xxxxxxxx.apps.googleusercontent.com"
              onChange={e=>setGmailIdTmp(e.target.value)}/>
            <button style={{...S.btn(C.sc),width:'100%',marginTop:10}}
              onClick={async()=>{const v=String(gmailIdTmp||'').trim();
                if(!/apps\.googleusercontent\.com/.test(v)){notify('Eso no parece un ID de cliente de Google','error');return;}
                try{await window.storage.set('bh10-gmailid',v);}catch(e){}
                setPideGmailId(false);notify('📧 Guardado. Vuelve a pulsar «Completar correos desde Gmail»');}}>
              ✔ Guardar el ID</button>
          </div>
        </div>
      ))||null
);

const ModalCorreosGmail=({aplicarCorreosProv,propCorreos,setPropCorreos})=>(
  (propCorreos&&(
        <div style={{...S.overlay,zIndex:CAPAS.SOBRE}}>
          <div style={{...S.modal,maxWidth:460}} onClick={e=>e.stopPropagation()}>
            <div style={S.cabModal}><b style={{fontSize:14}}>📧 Correos encontrados en Gmail</b>
              <button style={S.ghost} onClick={()=>setPropCorreos(null)}>✕</button></div>
            <div style={{fontSize:11,color:C.mt,lineHeight:1.5,marginBottom:10}}>
              Revisa antes de guardar: solo se rellena lo vacío, nunca se pisa lo que hay.
              El dominio se apunta también, para avisar si un día una factura llega desde otro.
            </div>
            {propCorreos.map((x,ix)=>(
              <label key={ix} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:`1px solid ${C.mt}22`}}>
                <input type="checkbox" checked={x.acepta}
                  onChange={e=>setPropCorreos(p=>p.map((y,j)=>j===ix?{...y,acepta:e.target.checked}:y))}
                  style={{width:17,height:17,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{x.nombre}</div>
                  <div style={{fontSize:11,color:C.in,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{x.email}</div>
                </div>
                <span style={{fontSize:10,color:C.mt,flexShrink:0}}>{x.dominio}</span>
              </label>
            ))}
            <button style={{...S.btn(C.sc),width:'100%',marginTop:10}} onClick={aplicarCorreosProv}>
              ✔ Guardar los marcados en sus fichas
            </button>
          </div>
        </div>
      ))||null
);

const ModalEmbargosSueldo=({empForm,setEmpForm,setVerEmbargoEmp,verEmbargoEmp})=>(
  (verEmbargoEmp&&(
        <div style={{...S.overlay,zIndex:CAPAS.SOBRE}}>
          <div style={{...S.modal,maxWidth:460}} onClick={e=>e.stopPropagation()}>
            <div style={S.cabModal}><b style={{fontSize:14}}>⚖️ Embargos de sueldo</b>
              <button style={S.ghost} onClick={()=>setVerEmbargoEmp(false)}>✕</button></div>
            <div style={{fontSize:11,color:C.mt,lineHeight:1.5,marginBottom:10}}>
              Los datos de cada diligencia se escriben UNA vez, a mano. El importe del mes
              se coge de su nómina al pasar el PDF por el reparto; si un mes ya no figura,
              se da por cancelado y no se transfiere. Si el trabajador liquida un embargo
              por su cuenta, quítalo de aquí.
            </div>
            {(()=>{
              const lista=Array.isArray(empForm.embargos)?empForm.embargos:embargosDe(empForm);
              const pon=(nueva)=>setEmpForm(p=>({...p,embargos:nueva}));
              const cambia=(id,campo,valor)=>pon(lista.map(x=>x.id===id?{...x,[campo]:valor}:x));
              const varios=lista.length>1;
              return(<>
                {lista.length===0&&<div style={{fontSize:11,color:C.mt,textAlign:'center',padding:'10px 0'}}>Sin embargos anotados.</div>}
                {lista.map((em,ix)=>(
                  <div key={em.id} style={{border:`1.5px solid ${C.dn}55`,borderRadius:10,padding:10,marginBottom:10}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                      <b style={{fontSize:12,color:C.dn}}>⚖️ Embargo {ix+1}</b>
                      <button type="button" style={{...S.sm(C.dn),padding:'3px 8px',minHeight:0}}
                        onClick={()=>{if(window.confirm('¿Quitar este embargo de la ficha? Hazlo solo si ya está liquidado o lo paga él por su cuenta.'))pon(lista.filter(x=>x.id!==em.id));}}>🗑 Quitar</button>
                    </div>
                    <label style={{display:'block',marginBottom:6}}><span style={{fontSize:10,color:C.dn}}>Referencia (juzgado/AEAT y nº de diligencia)</span>
                      <input style={S.input} value={em.ref||''} placeholder="p. ej. EJECUCION FORZOSA 0000413/2025"
                        onChange={e=>cambia(em.id,'ref',e.target.value)}/></label>
                    <label style={{display:'block',marginBottom:6}}><span style={{fontSize:10,color:C.dn}}>Titular de la cuenta (juzgado u organismo)</span>
                      <input style={S.input} value={em.titular||''} placeholder="p. ej. OFIC. RETENC SUELDOS / AEAT"
                        onChange={e=>cambia(em.id,'titular',e.target.value)}/></label>
                    <label style={{display:'block',marginBottom:2}}><span style={{fontSize:10,color:C.dn}}>IBAN de la cuenta del juzgado/organismo</span>
                      <input style={S.input} value={em.iban||''} placeholder="ES00 0000 0000 0000 0000 0000"
                        onChange={e=>cambia(em.id,'iban',e.target.value)}/></label>
                    {String(em.iban||'').trim()!==''&&!ibanOk(normIban(em.iban||''))&&
                      <div style={{fontSize:10,color:C.dn,marginBottom:4}}>⚠ Ese IBAN no pasa la comprobación: revísalo contra la diligencia.</div>}
                    <label style={{display:'block',margin:'4px 0 0'}}><span style={{fontSize:10,color:C.dn}}>Concepto de la transferencia (el de la diligencia)</span>
                      <input style={S.input} value={em.concepto||''} placeholder="p. ej. 5063 0000 05 0413 25"
                        onChange={e=>cambia(em.id,'concepto',e.target.value)}/></label>
                    {varios
                      ?<label style={{display:'block',margin:'6px 0 0'}}><span style={{fontSize:10,color:C.dn}}>Importe mensual de ESTA diligencia (€)</span>
                        <input style={S.input} inputMode="decimal" value={em.importe||''} placeholder="0,00"
                          onChange={e=>cambia(em.id,'importe',e.target.value)}/></label>
                      :<label style={{display:'block',margin:'6px 0 0'}}><span style={{fontSize:10,color:C.dn}}>Importe mensual (lo rellena solo el lector con su nómina)</span>
                        <input style={{...S.input,opacity:.75}} readOnly
                          value={empForm.embargoLeido&&+empForm.embargoLeido.imp>0
                            ?fmt(+empForm.embargoLeido.imp)+' €  ('+(empForm.embargoLeido.periodo||'—')+')'
                            :'— pendiente de leer su nómina —'}/></label>}
                  </div>
                ))}
                {varios&&<div style={{fontSize:10,color:'#EAB308',marginBottom:8}}>
                  Con varios embargos, el importe de cada diligencia lo pones tú; al generar la
                  remesa se comprueba que la suma cuadre con lo retenido en su nómina.</div>}
                <button type="button" style={{...S.sm(C.in),width:'100%',marginBottom:8}}
                  onClick={()=>pon([...lista,{id:'em'+Date.now(),ref:'',titular:'',iban:'',concepto:'',importe:''}])}>➕ Añadir embargo</button>
              </>);
            })()}
            <div style={{fontSize:10.5,color:C.mt,marginBottom:10}}>
              {empForm.embargoLeido&&Number.isFinite(+empForm.embargoLeido.imp)
                ? (+empForm.embargoLeido.imp>0
                    ? `Último importe leído de su nómina: ${fmt(+empForm.embargoLeido.imp)} € (${empForm.embargoLeido.periodo||'—'})`
                    : `En su última nómina leída (${empForm.embargoLeido.periodo||'—'}) ya NO figura embargo: se dará por cancelado`)
                : 'Aún sin nómina leída: la transferencia saldrá cuando pases su nómina por el reparto'}
            </div>
            <button style={{...S.btn(C.sc),width:'100%'}} onClick={()=>setVerEmbargoEmp(false)}>✔ Hecho — recuerda guardar la ficha</button>
          </div>
        </div>
      ))||null
);

const ModalCertificar=({Combobox,IVAS,calcContratoTotal,cliCat,clientes,contratoForm,dirCompletaCliente,editingContrato,fichaCliente,obrasAll,saveContrato,setContratoForm,setShowContratoForm,showContratoForm})=>(
  (showContratoForm&&(
        <div style={S.overlay}>
          <div style={{...S.modal,maxWidth:480}} onClick={e=>e.stopPropagation()}>
            <div style={{...S.cabModal,display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <span style={{fontWeight:700,fontSize:14}}>{editingContrato?'Editar':'Nuevo'} {contratoForm.tipo==='presupuesto'?'Presupuesto':'Factura emitida'}</span>
              {!editingContrato&&<span style={{fontSize:9,color:C.sc,marginLeft:6}}>· se guarda solo</span>}
              <button onClick={()=>setShowContratoForm(false)} style={{background:'none',border:'none',color:C.mt,cursor:'pointer',fontSize:18}}>✕</button>
            </div>
            {!editingContrato&&<div style={{display:'flex',gap:5,marginBottom:10}}>
              <button style={S.sm(contratoForm.tipo==='presupuesto'?C.ac:C.mt)} onClick={()=>setContratoForm(p=>({...p,tipo:'presupuesto'}))}>Presupuesto</button>
              <button style={S.sm(contratoForm.tipo==='factura_emitida'?C.sc:C.mt)} onClick={()=>setContratoForm(p=>({...p,tipo:'factura_emitida'}))}>Factura</button>
            </div>}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <label><span style={{fontSize:10,color:C.mt}}>Nº documento</span><input style={S.input} value={contratoForm.numero} onChange={e=>setContratoForm(p=>({...p,numero:e.target.value}))}/></label>
              <div style={{marginBottom:8}}>
                <span style={{fontSize:10,color:C.mt}}>Tipo de avance</span>
                <div style={{display:'flex',gap:6,marginTop:3}}>
                  {[['simple','📄 Global (un %)'],['fases','🏗️ Por fases (por línea)']].map(([k,l])=>(
                    <button key={k} type="button" style={{padding:'5px 10px',borderRadius:14,border:`1px solid ${(contratoForm.modo||'simple')===k?C.in:C.bd}`,background:(contratoForm.modo||'simple')===k?C.in+'22':'transparent',color:(contratoForm.modo||'simple')===k?C.in:C.mt,fontSize:10,fontWeight:600,cursor:'pointer'}} onClick={()=>setContratoForm(p=>({...p,modo:k}))}>{l}</button>
                  ))}
                </div>
              </div>
              <label><span style={{fontSize:10,color:C.mt}}>Fecha</span><input type="date" style={S.input} value={contratoForm.fecha} onChange={e=>setContratoForm(p=>({...p,fecha:e.target.value}))}/></label>
              <label style={{gridColumn:'1/-1'}}><span style={{fontSize:10,color:C.sc}}>Cliente *</span>
                <Combobox value={contratoForm.cliente} options={clientes} placeholder="Nombre del cliente" color={C.sc}
                  onChange={v=>{
                    setContratoForm(p=>({...p,cliente:v}));
                    // Antes se copiaba del último contrato de ese cliente; ahora
                    // manda su ficha, y el contrato solo sirve de respaldo.
                    const f=fichaCliente(v);
                    const dc=dirCompletaCliente(f);
                    if(f.cif||dc||f.retGarPct)setContratoForm(p=>({...p,
                      clienteCif:f.cif||p.clienteCif,
                      clienteDir:dc||p.clienteDir,
                      retGarantia:p.retGarantia||f.retGarPct||'',
                    }));
                  }}/>
              </label>
              <label><span style={{fontSize:10,color:C.mt}}>CIF cliente</span><input style={{...S.input,fontFamily:'monospace'}} value={contratoForm.clienteCif||''} onChange={e=>setContratoForm(p=>({...p,clienteCif:e.target.value.toUpperCase()}))}/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Dirección</span><input style={S.input} value={contratoForm.clienteDir||''} onChange={e=>setContratoForm(p=>({...p,clienteDir:e.target.value}))}/></label>
              {/* Cotitulares: una vivienda se compra a menudo entre dos, y en la
                  escritura tienen que constar todos. Se factura al primero. */}
              <div style={{gridColumn:'1/-1'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <span style={{fontSize:10,color:C.mt,flex:1}}>
                    👥 Cotitulares {(contratoForm.titulares||[]).length>0?`(${(contratoForm.titulares||[]).length+1} en total)`:'— se factura al cliente de arriba'}
                  </span>
                  <button style={{...S.sm(C.in),padding:'4px 9px',fontSize:10,minHeight:0,width:'auto'}}
                    onClick={()=>setContratoForm(p=>({...p,titulares:[...(p.titulares||[]),{nombre:'',dni:''}]}))}>＋ Añadir</button>
                </div>
                {(contratoForm.titulares||[]).map((t,i)=>(
                  <div key={i} style={{display:'flex',gap:6,marginBottom:5,alignItems:'center'}}>
                    <input style={{...S.input,flex:2,fontSize:12}} value={t.nombre||''} placeholder="Nombre y apellidos"
                      list="lista-clientes-cot"
                      onChange={e=>{
                        const v=e.target.value;
                        setContratoForm(p=>{
                          const l=[...(p.titulares||[])];
                          l[i]={...l[i],nombre:v};
                          // Si coincide con un cliente dado de alta, se trae su DNI
                          const f=(cliCat||[]).find(x=>x&&normProvNombre(x.nombre)===normProvNombre(v));
                          if(f&&!l[i].dni)l[i].dni=f.cif||'';
                          return {...p,titulares:l};
                        });
                      }}/>
                    <input style={{...S.input,flex:1,fontSize:12,fontFamily:'monospace'}} value={t.dni||''} placeholder="DNI"
                      onChange={e=>setContratoForm(p=>{const l=[...(p.titulares||[])];l[i]={...l[i],dni:e.target.value.toUpperCase()};return {...p,titulares:l};})}/>
                    <button style={{background:'none',border:'none',color:C.dn,cursor:'pointer',fontSize:14,padding:'0 4px'}}
                      onClick={()=>setContratoForm(p=>({...p,titulares:(p.titulares||[]).filter((_,k)=>k!==i)}))}>✕</button>
                  </div>
                ))}
                <datalist id="lista-clientes-cot">{clientes.map(c=><option key={c} value={c}/>)}</datalist>
              </div>
              <label style={{gridColumn:'1/-1'}}><span style={{fontSize:10,color:C.mt}}>Obra / Servicio</span>
                <Combobox value={contratoForm.obra||''} options={obrasAll} placeholder="Dirección de obra o servicio"
                  onChange={v=>setContratoForm(p=>({...p,obra:v}))}/>
              </label>
                <label style={{display:'block',marginTop:8}}><span style={{fontSize:10,color:C.mt}}>🏘️ Código de promoción (configurador de la web — solo contratos de promotora)</span>
                  <input style={S.input} value={contratoForm.promocion||''} placeholder="toca uno de abajo o escríbelo"
                    onChange={e=>setContratoForm(p=>({...p,promocion:e.target.value.trim()}))}/></label>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:4}}>
                  {[['illescas-bh10','BH10 Illescas (12)'],['carvari-18','Carvari Homes (18)'],['salto-caballo','Salto del Caballo'],['illescas-living','Illescas Living (10)']].map(([cod,rot])=>(
                    <button key={cod} type="button"
                      style={{...S.sm(contratoForm.promocion===cod?C.sc:C.mt),padding:'4px 10px',minHeight:0,fontSize:10.5}}
                      onClick={()=>setContratoForm(p=>({...p,promocion:p.promocion===cod?'':cod}))}>{rot}</button>
                  ))}
                </div>
              <div style={{gridColumn:'1/-1',display:'flex',alignItems:'center',gap:8,padding:'2px 0'}}>
                <input type="checkbox" checked={contratoForm.sujetoPasivo||false} onChange={e=>setContratoForm(p=>({...p,sujetoPasivo:e.target.checked}))} style={{accentColor:C.wn,width:16,height:16}}/>
                <span style={{fontSize:11,color:contratoForm.sujetoPasivo?C.wn:C.mt}}>Inversión sujeto pasivo (IVA 0%)</span>
              </div>
            </div>

            <div style={{fontWeight:600,fontSize:11,margin:'10px 0 6px',color:C.mt}}>LÍNEAS DE DETALLE</div>
            {(contratoForm.items||[]).map((it,idx)=>(
              <div key={idx} style={{display:'grid',gridTemplateColumns:'2fr 0.5fr 1fr 0.7fr auto',gap:4,marginBottom:4,alignItems:'end'}}>
                <input style={{...S.input,fontSize:16}} placeholder="Descripción" value={it.desc} onChange={e=>{const ni=[...contratoForm.items];ni[idx]={...it,desc:e.target.value};setContratoForm(p=>({...p,items:ni}));}}/>
                <input type="text" inputMode="decimal" style={{...S.input,fontSize:16,textAlign:'center'}} placeholder="Ud" value={it.qty||''} onChange={e=>{const ni=[...contratoForm.items];ni[idx]={...it,qty:parseNum(e.target.value)};setContratoForm(p=>({...p,items:ni}));}}/>
                <input type="text" inputMode="decimal" style={{...S.input,fontSize:16}} placeholder="Precio" value={it.precio||''} onChange={e=>{const ni=[...contratoForm.items];ni[idx]={...it,precio:parseNum(e.target.value)};setContratoForm(p=>({...p,items:ni}));}}/>
                <select style={{...S.select,fontSize:16,padding:'5px'}} value={it.iva} onChange={e=>{const ni=[...contratoForm.items];ni[idx]={...it,iva:+e.target.value};setContratoForm(p=>({...p,items:ni}));}} disabled={contratoForm.sujetoPasivo}>{IVAS.map(i=><option key={i} value={i}>{i}%</option>)}</select>
                <button style={{background:'none',border:'none',color:C.dn,cursor:'pointer',fontSize:14}} onClick={()=>{if((contratoForm.items||[]).length>1){const ni=(contratoForm.items||[]).filter((_,i)=>i!==idx);setContratoForm(p=>({...p,items:ni}));}}}>✕</button>
              </div>
            ))}
            <button style={{...S.sm(C.mt),marginBottom:8}} onClick={()=>setContratoForm(p=>({...p,items:[...p.items,{desc:'',qty:1,precio:0,iva:21}]}))}>+ Añadir línea</button>

            {(()=>{const t=calcContratoTotal(contratoForm.items,contratoForm.sujetoPasivo);return(
              <div style={{background:C.bg,borderRadius:8,padding:10,textAlign:'right'}}>
                <div style={{fontSize:11,color:C.mt}}>Base: {fmt(t.base)} € {!contratoForm.sujetoPasivo&&`· IVA: ${fmt(t.iva)} €`} {contratoForm.sujetoPasivo&&<span style={{color:C.wn}}>· ISP</span>}</div>
                <label style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:C.vt,marginBottom:6,justifyContent:'flex-end'}}>🛡️ Retención de garantía
                  <input type="text" inputMode="decimal" style={{...S.input,width:64,textAlign:'right',padding:'6px 8px',minHeight:36}} value={contratoForm.retGarantia||''} onChange={e=>setContratoForm(p=>({...p,retGarantia:e.target.value}))} placeholder="0"/> %
                </label>
                {parseNum(contratoForm.retGarantia)>0&&<div style={{fontSize:10,color:C.vt,marginBottom:4}}>Cada certificación retendrá el {parseNum(contratoForm.retGarantia)}% de su base</div>}
                <div style={{fontSize:20,fontWeight:800,color:C.ac}}>TOTAL: {fmt(t.total)} €</div>
              </div>
            );})()}

            <label style={{display:'block',marginTop:8}}><span style={{fontSize:10,color:C.mt}}>Notas</span><textarea style={{...S.input,height:36,resize:'vertical'}} value={contratoForm.notas||''} onChange={e=>setContratoForm(p=>({...p,notas:e.target.value}))}/></label>
            <div style={{display:'flex',gap:8,marginTop:10,justifyContent:'flex-end'}}>
              <button style={S.ghost} onClick={()=>setShowContratoForm(false)}>Cancelar</button>
              <button style={S.btn()} onClick={saveContrato}>{editingContrato?'Guardar':'Crear'}</button>
            </div>
          </div>
        </div>
      ))||null
);

const ModalNuevoPresupuesto=({avisarCerrar,openNewContrato,setContratoForm,setShowNuevoTipo,showNuevoTipo})=>(
  (showNuevoTipo&&(
        <div style={S.overlay} onClick={avisarCerrar}>
          <div style={{...S.modal,maxWidth:430}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:10}}>Nuevo presupuesto</div>
            <button style={{...S.card,width:'100%',textAlign:'left',cursor:'pointer',marginBottom:8,border:`1px solid ${C.bd}`}} onClick={()=>{setShowNuevoTipo(false);openNewContrato('presupuesto');setContratoForm(p=>({...p,modo:'simple'}));}}>
              <div style={{fontWeight:700}}>📄 Presupuesto simple</div>
              <div style={{fontSize:11,color:C.mt,marginTop:2}}>Un avance global sobre el total: una vivienda, una reforma, un servicio. Al aceptarse pasa a ser <b>contrato</b> y cada certificación genera su <b>factura</b>.</div>
            </button>
            <button style={{...S.card,width:'100%',textAlign:'left',cursor:'pointer',border:`1px solid ${C.bd}`}} onClick={()=>{setShowNuevoTipo(false);openNewContrato('presupuesto');setContratoForm(p=>({...p,modo:'fases'}));}}>
              <div style={{fontWeight:700}}>🏗️ Promoción por fases</div>
              <div style={{fontSize:11,color:C.mt,marginTop:2}}>Avance independiente por línea (adosadas, pareadas, exentas…): certificas cada fase a su porcentaje y la factura detalla el avance línea a línea.</div>
            </button>
          </div>
        </div>
      ))||null
);

const ModalOperacionFinanciera=({BtnConfirm,avisarCerrar,finForm,financiacion,notify,persistFin,setFinForm,setFinVer})=>(
  (finForm&&(
        <div style={S.overlay} onClick={avisarCerrar}>
          <div style={{...S.modal,maxWidth:520}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:8}}>{finForm.id?'Editar operación':'Nueva operación financiera'}</div>
            <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
              {TIPOS_FIN.map(t=>(
                <button key={t.id} style={{padding:'7px 11px',borderRadius:16,border:`1px solid ${finForm.tipo===t.id?C.in:C.bd}`,background:finForm.tipo===t.id?C.in+'22':'transparent',color:finForm.tipo===t.id?C.in:C.mt,fontSize:11,fontWeight:finForm.tipo===t.id?700:500,cursor:'pointer'}}
                  onClick={()=>setFinForm(f=>({...f,tipo:t.id}))}>{t.ic} {t.n}</button>
              ))}
            </div>
            <div style={{fontSize:10,color:C.mt,marginBottom:8,lineHeight:1.45}}>
              {finForm.tipo==='prestamo'&&'Sin IVA: los intereses de un préstamo son operación exenta.'}
              {finForm.tipo==='leasing'&&'Cada cuota se parte en recuperación del coste e intereses; el IVA se calcula sobre el total y es deducible.'}
              {finForm.tipo==='renting'&&'Es un servicio: la cuota entera es gasto y su IVA deducible. Ojo con el 50% en turismos de uso mixto.'}
              {finForm.tipo==='linea'&&'Sin cuadro fijo: se anotan las disposiciones y los intereses se liquidan sobre el saldo dispuesto.'}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <label style={{gridColumn:'1/-1'}}><span style={{fontSize:10,color:C.mt}}>Nombre</span><input style={S.input} value={finForm.nombre||''} onChange={e=>setFinForm(f=>({...f,nombre:e.target.value}))} placeholder="Préstamo promotor Yuncos"/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Entidad</span><input style={S.input} value={finForm.entidad||''} onChange={e=>setFinForm(f=>({...f,entidad:e.target.value}))}/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Inicio</span><input style={S.input} type="date" value={finForm.fechaInicio||''} onChange={e=>setFinForm(f=>({...f,fechaInicio:e.target.value}))}/></label>
              {finForm.tipo==='linea'
                ?<label><span style={{fontSize:10,color:C.mt}}>Límite (€)</span><input style={S.input} inputMode="decimal" value={finForm.limite??''} onChange={e=>setFinForm(f=>({...f,limite:e.target.value}))}/></label>
                :finForm.tipo==='renting'
                  ?<label><span style={{fontSize:10,color:C.mt}}>Cuota sin IVA (€)</span><input style={S.input} inputMode="decimal" value={finForm.cuotaBase??''} onChange={e=>setFinForm(f=>({...f,cuotaBase:e.target.value}))}/></label>
                  :<label><span style={{fontSize:10,color:C.mt}}>Capital (€)</span><input style={S.input} inputMode="decimal" value={finForm.capital??''} onChange={e=>setFinForm(f=>({...f,capital:e.target.value}))}/></label>}
              {finForm.tipo!=='linea'&&<label><span style={{fontSize:10,color:C.mt}}>Plazo (meses)</span><input style={S.input} inputMode="numeric" value={finForm.plazoMeses??''} onChange={e=>setFinForm(f=>({...f,plazoMeses:e.target.value}))}/></label>}
              {(finForm.tipo==='prestamo'||finForm.tipo==='leasing')&&<label><span style={{fontSize:10,color:C.mt}}>Carencia (meses)</span><input style={S.input} inputMode="numeric" value={finForm.carenciaMeses??''} onChange={e=>setFinForm(f=>({...f,carenciaMeses:e.target.value}))} placeholder="0"/></label>}
              {finForm.tipo==='leasing'&&<label><span style={{fontSize:10,color:C.mt}}>Valor residual (€)</span><input style={S.input} inputMode="decimal" value={finForm.valorResidual??''} onChange={e=>setFinForm(f=>({...f,valorResidual:e.target.value}))}/></label>}
              {finLlevaIva(finForm.tipo)&&<label><span style={{fontSize:10,color:C.mt}}>% IVA</span>
                <select style={S.select} value={finForm.ivaPct??21} onChange={e=>setFinForm(f=>({...f,ivaPct:+e.target.value}))}>{TIPOS_IVA.map(v=><option key={v} value={v}>{v}%</option>)}</select></label>}
            </div>

            {finForm.tipo!=='renting'&&(
              <div style={{marginTop:10,background:C.bg,borderRadius:9,padding:'9px 11px'}}>
                <div style={{display:'flex',gap:6,marginBottom:8}}>
                  {[['fijo','Tipo fijo'],['variable','Variable (euríbor + diferencial)']].map(([k,l])=>(
                    <button key={k} style={{flex:1,padding:'6px 8px',borderRadius:14,border:`1px solid ${(finForm.clase||'fijo')===k?C.in:C.bd}`,background:(finForm.clase||'fijo')===k?C.in+'22':'transparent',color:(finForm.clase||'fijo')===k?C.in:C.mt,fontSize:11,cursor:'pointer'}}
                      onClick={()=>setFinForm(f=>({...f,clase:k}))}>{l}</button>
                  ))}
                </div>
                {(finForm.clase||'fijo')==='fijo'
                  ?<label><span style={{fontSize:10,color:C.mt}}>% nominal anual</span><input style={S.input} inputMode="decimal" value={finForm.fijo??''} onChange={e=>setFinForm(f=>({...f,fijo:e.target.value}))} placeholder="3,25"/></label>
                  :<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    <label><span style={{fontSize:10,color:C.mt}}>Diferencial (%)</span><input style={S.input} inputMode="decimal" value={finForm.diferencial??''} onChange={e=>setFinForm(f=>({...f,diferencial:e.target.value}))} placeholder="1,25"/></label>
                    <label><span style={{fontSize:10,color:C.mt}}>Revisión cada (meses)</span><input style={S.input} inputMode="numeric" value={finForm.revisionMeses??12} onChange={e=>setFinForm(f=>({...f,revisionMeses:e.target.value}))}/></label>
                    <label><span style={{fontSize:10,color:C.mt}}>1ª revisión</span><input style={S.input} type="date" value={finForm.primeraRevision||''} onChange={e=>setFinForm(f=>({...f,primeraRevision:e.target.value}))}/></label>
                    <label><span style={{fontSize:10,color:C.mt}}>Euríbor de (meses antes)</span><input style={S.input} inputMode="numeric" value={finForm.desfaseMeses??1} onChange={e=>setFinForm(f=>({...f,desfaseMeses:e.target.value}))}/></label>
                    <div style={{gridColumn:'1/-1',fontSize:9,color:C.mt}}>Tu contrato dice qué publicación se aplica: casi siempre la del mes anterior a la revisión.</div>
                  </div>}
              </div>
            )}

            <div style={{display:'flex',gap:8,marginTop:12,justifyContent:'flex-end'}}>
              {finForm.id&&<BtnConfirm style={S.sm(C.dn)} armStyle={{background:C.dn,color:'#fff'}} armedLabel="¿Borrar?" onConfirm={()=>{persistFin(financiacion.filter(x=>x.id!==finForm.id));setFinForm(null);setFinVer(null);}}>🗑️</BtnConfirm>}
              <button style={S.ghost} onClick={()=>setFinForm(null)}>Cancelar</button>
              <button style={S.btn(C.sc)} onClick={()=>{
                const f={...finForm};
                if(!String(f.nombre||'').trim()){notify('Ponle un nombre a la operación','error');return;}
                ['capital','limite','cuotaBase','valorResidual','fijo','diferencial'].forEach(k=>{if(f[k]!==undefined&&f[k]!=='')f[k]=parseNum(f[k]);});
                ['plazoMeses','carenciaMeses','revisionMeses','desfaseMeses'].forEach(k=>{if(f[k]!==undefined&&f[k]!=='')f[k]=Math.round(parseNum(f[k]))||0;});
                if(!f.id)f.id=uid();
                f.disposiciones=f.disposiciones||[];f.amortizaciones=f.amortizaciones||[];
                persistFin(f.id&&financiacion.some(x=>x.id===f.id)?financiacion.map(x=>x.id===f.id?f:x):[...financiacion,f]);
                setFinForm(null);
              }}>Guardar</button>
            </div>
          </div>
        </div>
      ))||null
);

const ModalCustodiaDatos=({BtnConfirm,avisarCerrar,custodia,notify,setCustodia,setVerDni})=>(
  (custodia&&(
        <div style={S.overlay} onClick={avisarCerrar}>
          <div style={{...S.modal,maxWidth:520}} onClick={e=>e.stopPropagation()}>
            <div style={{...S.cabModal,display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14}}>🔒 Custodia de datos personales</div>
                <div style={{fontSize:11,color:C.mt}}>
                  {(custodia.cli||[]).length} cliente{(custodia.cli||[]).length!==1?'s':''} · {(custodia.prov||[]).length} proveedor{(custodia.prov||[]).length!==1?'es':''} · {custodia.docs.length} DNI
                </div>
              </div>
              <button style={{background:'transparent',border:'none',cursor:'pointer',color:C.mt,fontSize:20,lineHeight:1,padding:'0 4px'}} onClick={()=>setCustodia(null)}>✕</button>
            </div>

            {custodia.err&&(
              <div style={{background:C.dn+'14',border:`1px solid ${C.dn}55`,borderRadius:9,padding:'10px 12px',marginBottom:10,fontSize:11}}>
                <div style={{fontWeight:700,color:C.dn}}>⛔ Firestore no deja consultar: {custodia.err}</div>
                <div style={{fontSize:10,color:C.mt,marginTop:4,lineHeight:1.5}}>
                  No es un fallo de la app: <b>falta la regla de seguridad</b> que permite leer estos apartados.
                  En el zip va <b>REGLAS_FIRESTORE.txt</b>: ábrelo, cópialo entero y pégalo en
                  console.firebase.google.com → b10h-facturas → Firestore Database → Reglas → Publicar.
                  Tarda menos de un minuto y también es lo que hace falta para que funcione el portal de clientes.
                </div>
              </div>
            )}

            {/* Clientes o proveedores: son dos circuitos y se miran por separado */}
            <div style={{display:'flex',gap:5,marginBottom:10}}>
              {[['clientes','👤 Clientes'],['proveedores','🏪 Proveedores'],['dni','🪪 Copias de DNI']].map(([k,t])=>(
                <button key={k} style={{flex:1,padding:'7px 4px',borderRadius:14,fontSize:11,cursor:'pointer',
                  border:`1px solid ${custodia.pestana===k?C.vt:C.bd}`,
                  background:custodia.pestana===k?C.vt+'22':'transparent',
                  color:custodia.pestana===k?C.vt:C.mt,fontWeight:custodia.pestana===k?700:500}}
                  onClick={()=>setCustodia(p=>({...p,pestana:k}))}>{t}</button>
              ))}
            </div>

            {custodia.pestana!=='dni'&&(()=>{
              const esCli=custodia.pestana==='clientes';
              const fichas=esCli?(custodia.cli||[]):(custodia.prov||[]);
              const regs=esCli?((custodia.reg||{}).clientes||[]):((custodia.reg||{}).proveedores||[]);
              const plazo=PLAZOS.contrato.meses;
              const pasados=fichas.filter(f=>{const m=mesesDesde(f.ultimo);return m!==null&&m>=plazo;});
              return(
                <>
                  <div style={{background:C.bg,borderRadius:9,padding:'9px 11px',marginBottom:8,fontSize:11,lineHeight:1.6}}>
                    <div><b>{fichas.length}</b> ficha{fichas.length!==1?'s':''} de {esCli?'cliente':'proveedor'} guardada{fichas.length!==1?'s':''}</div>
                    <div style={{color:C.mt,fontSize:10}}>
                      {esCli?'Nombre, NIF, domicilio, contacto y datos de los titulares del contrato.':'Nombre, CIF, domicilio y cuenta bancaria para pagarles.'}
                    </div>
                    <div style={{marginTop:4}}><b>{regs.length}</b> registro{regs.length!==1?'s':''} de información en materia de protección de datos</div>
                    <div style={{color:C.mt,fontSize:10}}>De quienes han usado el formulario. Prueba de qué se les informó y cuándo.</div>
                  </div>

                  {regs.slice(0,12).map((r,i)=>(
                    <div key={i} style={{background:C.bg,borderRadius:9,padding:'8px 10px',marginBottom:6,borderLeft:`3px solid ${C.sc}`}}>
                      <div style={{fontSize:12,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {r.nombre||'(sin nombre)'} {r.pendiente&&<span style={{fontSize:9,color:C.wn,fontWeight:400}}>· sin revisar</span>}
                      </div>
                      <div style={{fontSize:10,color:C.mt,lineHeight:1.5}}>
                        {r.cif?r.cif+' · ':''}aviso {r.version} · leyó el {r.leidoHastaPct}% · {r.segundosEnPantalla}s
                        <div>{r.cuando?new Date(r.cuando).toLocaleString('es-ES'):''}</div>
                        <div style={{fontFamily:'monospace',fontSize:9,wordBreak:'break-all'}}>huella {r.huellaTexto}</div>
                      </div>
                    </div>
                  ))}
                  {regs.length>12&&<div style={{fontSize:10,color:C.mt,marginBottom:6}}>y {regs.length-12} más</div>}
                  {regs.length===0&&!custodia.err&&(
                    <div style={{fontSize:11,color:C.mt,textAlign:'center',padding:14,lineHeight:1.5}}>
                      Todavía nadie ha usado el formulario. Las fichas que ya tienes se crearon a mano o desde sus facturas,
                      así que no hay registro de información que mostrar.
                    </div>
                  )}

                  {pasados.length>0&&(
                    <div style={{background:C.wn+'12',border:`1px solid ${C.wn}44`,borderRadius:9,padding:'9px 11px',marginTop:8,fontSize:11}}>
                      <div style={{fontWeight:700,color:C.wn}}>{pasados.length} sin movimiento desde hace más de 6 años</div>
                      <div style={{fontSize:10,color:C.mt,marginTop:3,lineHeight:1.45}}>
                        {pasados.slice(0,6).map(c=>c.nombre).join(' · ')}{pasados.length>6?` y ${pasados.length-6} más`:''}
                      </div>
                      <div style={{fontSize:10,color:C.mt,marginTop:4,lineHeight:1.45}}>
                        Han pasado los plazos mercantil y tributario. Consúltalo con tu asesoría antes de suprimir nada.
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {custodia.pestana==='dni'&&(()=>{
              const vencidos=custodia.docs.filter(d=>d.borrarAntesDe&&Date.now()>d.borrarAntesDe);
              if(!vencidos.length)return null;
              return(
                <>
                {vencidos.length>0&&(
                <div style={{background:C.dn+'14',border:`1px solid ${C.dn}55`,borderRadius:9,padding:'9px 11px',marginBottom:10}}>
                  <div style={{fontWeight:700,color:C.dn,fontSize:12}}>⚠ {vencidos.length} documento{vencidos.length!==1?'s':''} fuera de plazo</div>
                  <div style={{fontSize:10,color:C.mt,marginTop:3,lineHeight:1.45}}>Han pasado los seis meses. Conservarlos ya no está justificado.</div>
                  <BtnConfirm style={{...S.sm(C.dn),marginTop:7,fontSize:11}} armStyle={{background:C.dn,color:'#fff'}}
                    armedLabel={`¿Destruir ${vencidos.length}? Toca otra vez`}
                    onConfirm={async()=>{
                      for(const d of vencidos){try{await window.bh10Dni.borrar(d.id);}catch(e){}}
                      setCustodia(p=>({...p,docs:p.docs.filter(x=>!vencidos.some(v=>v.id===x.id))}));
                      notify(`🗑️ ${vencidos.length} documento${vencidos.length!==1?'s':''} destruido${vencidos.length!==1?'s':''}`);
                    }}>🗑️ Destruir los {vencidos.length} vencidos</BtnConfirm>
                </div>
                )}

                {custodia.docs.length===0&&(
                  <div style={{textAlign:'center',padding:20,color:C.sc,fontSize:12}}>
                    ✓ No se está guardando ninguna copia de documento de identidad.
                  </div>
                )}

                {custodia.docs.map(d=>{
              const dias=d.borrarAntesDe?Math.ceil((d.borrarAntesDe-Date.now())/864e5):null;
              const col=dias===null?C.mt:dias<0?C.dn:dias<30?C.wn:C.sc;
              return(
                <div key={d.id} style={{background:C.bg,borderRadius:9,padding:'9px 11px',marginBottom:6,borderLeft:`3px solid ${col}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'flex-start'}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        🪪 {d.nombreTitular||'(sin nombre)'} <span style={{fontSize:10,color:C.mt,fontWeight:400}}>· {d.cara==='dniA'?'anverso':'reverso'}</span>
                      </div>
                      <div style={{fontSize:10,color:C.mt}}>
                        {d.cliente?d.cliente+' · ':''}recibido el {d.recibido?fmtDate(new Date(d.recibido).toISOString().slice(0,10)):'—'} · {Math.round(d.bytes/1024)} KB
                      </div>
                    </div>
                    <div style={{fontSize:10,fontWeight:700,color:col,flexShrink:0,textAlign:'right'}}>
                      {dias===null?'sin plazo':dias<0?`vencido hace ${-dias} d`:`quedan ${dias} d`}
                    </div>
                  </div>
                  <div style={{display:'flex',gap:6,marginTop:7,flexWrap:'wrap'}}>
                    <button style={{...S.sm(C.in),padding:'5px 10px',fontSize:10,minHeight:0}} onClick={async()=>{
                      try{const img=await window.bh10Dni.ver(d.id);if(img)setVerDni({img,nombre:d.nombreTitular});}
                      catch(e){notify('No se pudo abrir','error');}
                    }}>👁 Ver</button>
                    <BtnConfirm style={{...S.sm(C.dn),padding:'5px 10px',fontSize:10,minHeight:0}} armStyle={{background:C.dn,color:'#fff'}}
                      armedLabel="¿Destruir?"
                      onConfirm={async()=>{
                        try{await window.bh10Dni.borrar(d.id);}catch(e){}
                        setCustodia(p=>({...p,docs:p.docs.filter(x=>x.id!==d.id)}));
                        notify('🗑️ Documento destruido');
                      }}>🗑️ Ya firmada — destruir</BtnConfirm>
                  </div>
                </div>
              );
            })}

                </>
              );
            })()}

            <div style={{fontSize:10,color:C.mt,marginTop:10,lineHeight:1.45}}>
              Los documentos están cifrados en tránsito y guardados en tu propia nube, separados del resto de la ficha. Solo tú y quien tenga acceso a esta app pueden verlos.
            </div>
          </div>
        </div>
      ))||null
);

const ModalAvisoConfidencial=({avisarCerrar,setVerDni,verDni})=>(
  (verDni&&(
        <div style={{...S.overlay,background:'rgba(8,12,20,.96)'}} onClick={avisarCerrar}>
          <div style={{maxWidth:560,width:'100%',padding:12}} onClick={e=>e.stopPropagation()}>
            <div style={{...S.cabModal,display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <span style={{flex:1,color:'#E2E8F0',fontSize:12,fontWeight:700}}>🪪 {verDni.nombre||'Documento'}</span>
              <button style={{background:'none',border:'none',color:'#94A3B8',fontSize:22,cursor:'pointer'}} onClick={()=>setVerDni(null)}>✕</button>
            </div>
            <img src={verDni.img} alt="" style={{width:'100%',borderRadius:8,background:'#fff'}}/>
            <div style={{fontSize:10,color:'#94A3B8',marginTop:8,textAlign:'center'}}>No hagas capturas ni lo reenvíes: sale del circuito de custodia.</div>
          </div>
        </div>
      ))||null
);

const ModalDatosClientes=({BtnConfirm,avisarCerrar,cliCat,cliRecibidos,notify,persistCliCat,setCliRecibidos,setFusion,alAplicar})=>(
  (cliRecibidos&&(
        <div style={S.overlay} onClick={avisarCerrar}>
          <div style={{...S.modal,maxWidth:520}} onClick={e=>e.stopPropagation()}>
            <div style={{...S.cabModal,display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14}}>📥 Datos enviados por clientes</div>
                <div style={{fontSize:11,color:C.mt}}>{cliRecibidos.length} pendiente{cliRecibidos.length!==1?'s':''} de revisar</div>
              </div>
              <button style={{background:'transparent',border:'none',cursor:'pointer',color:C.mt,fontSize:20,lineHeight:1,padding:'0 4px'}} onClick={()=>setCliRecibidos(null)}>✕</button>
            </div>
            <div style={{fontSize:10,color:C.mt,marginBottom:10,lineHeight:1.45}}>
              Nada se guarda solo: revisa cada envío y decide si lo aplicas a la ficha. Así un enlace reenviado o un dato mal escrito no te toca los datos.
            </div>

            {cliRecibidos.length===0&&<div style={{textAlign:'center',padding:24,color:C.mt,fontSize:12}}>Sin envíos pendientes.</div>}

            {cliRecibidos.filter(r=>r&&r.tipo!=='configuracion').map(r=>(
              <div key={r.id} style={{background:C.bg,borderRadius:9,padding:'10px 12px',marginBottom:8}}>
                <div style={{fontWeight:700,fontSize:13}}>{r.nombre||'(sin nombre)'}</div>
                <div style={{fontSize:11,color:C.mt,marginTop:2,lineHeight:1.5}}>
                  {r.cif&&<div>NIF <b style={{color:C.tx,fontFamily:'monospace'}}>{r.cif}</b></div>}
                  {r.dir&&<div>{[r.dir,[r.cp,r.municipio].filter(Boolean).join(' '),r.provincia].filter(Boolean).join(', ')}</div>}
                  {(r.email||r.telefono)&&<div>{r.email}{r.email&&r.telefono?' · ':''}{r.telefono}</div>}
                  {r.esEmpresa&&<div style={{color:C.in}}>🏢 Empresa — sin titulares personales</div>}
                </div>

                {/* ── LO QUE HA AUTORIZADO ── */}
                {/* Un consentimiento que no se puede demostrar no sirve: hay que
                    poder decir quién lo dio, cuándo y sobre qué texto. Estaba
                    llegando del portal pero no se enseñaba en ninguna parte. */}
                {(()=>{
                  const b=r.bancos||null;
                  if(!b)return null;
                  if(!b.autoriza)return(
                    <div style={{background:C.sf,borderRadius:8,padding:'7px 10px',marginTop:7,
                      fontSize:10.5,color:C.mt}}>
                      🏦 <b style={{color:C.tx}}>No autoriza</b> ceder sus datos a entidades financieras
                    </div>
                  );
                  const quien=(r.titulares||[])[0];
                  return(
                    <div style={{background:C.sc+'14',border:`1px solid ${C.sc}55`,borderRadius:8,
                      padding:'8px 10px',marginTop:7}}>
                      <div style={{fontSize:11,fontWeight:700,color:C.sc,marginBottom:3}}>
                        🏦 SÍ autoriza ceder sus datos a entidades financieras
                      </div>
                      <div style={{fontSize:10.5,color:C.mt,lineHeight:1.5}}>
                        Lo marcó <b style={{color:C.tx}}>{quien&&quien.nombre?quien.nombre:(r.nombre||'el titular')}</b>
                        {b.cuando?<> el <b style={{color:C.tx}}>{fmtDate(b.cuando)}</b></>:''}
                        {b.version?<> · texto {b.version}</>:''}
                        {r.rgpd&&r.rgpd.huella?<> · huella {String(r.rgpd.huella).slice(0,10)}…</>:''}
                      </div>
                      {Array.isArray(b.entidades)&&b.entidades.length>0
                        ?<div style={{fontSize:10.5,color:C.tx,marginTop:4}}>
                           Entidades que eligió: <b>{b.entidades.join(', ')}</b>
                         </div>
                        :<div style={{fontSize:10.5,color:C.mt,marginTop:4}}>
                           No eligió entidades concretas: vale para las que trabajéis.
                         </div>}
                      <div style={{fontSize:10,color:C.mt,marginTop:4,lineHeight:1.4}}>
                        Solo viajan nombre, DNI, teléfono, correo y vivienda. Caduca al año y puede revocarlo cuando quiera.
                      </div>
                    </div>
                  );
                })()}

                {/* Titulares del contrato: la factura va al primero */}
                {(r.titulares||[]).length>0&&(
                  <div style={{background:C.sf,borderRadius:8,padding:'8px 10px',marginTop:7}}>
                    <div style={{fontSize:10,fontWeight:700,color:C.mt,marginBottom:4}}>
                      {r.titulares.length} TITULAR{r.titulares.length!==1?'ES':''} DEL CONTRATO
                      {r.nDni>0&&<span style={{color:C.vt}}> · {r.nDni} foto{r.nDni!==1?'s':''} de DNI</span>}
                    </div>
                    {r.titulares.map((t,i)=>(
                      <div key={i} style={{fontSize:11,padding:'3px 0',borderTop:i?`1px solid ${C.bd}44`:'none'}}>
                        <b>{i===0?'👤 ':'👥 '}{t.nombre}</b>
                        {i===0&&<span style={{fontSize:9,color:C.sc}}> · va la factura</span>}
                        <div style={{fontSize:10,color:C.mt}}>
                          {t.dni}{t.nacimiento?' · '+fmtDate(t.nacimiento):''}{t.estadoCivil?' · '+t.estadoCivil:''}{t.regimen?' · '+t.regimen:''}
                          {t.tieneDni&&<span style={{color:C.vt}}> · 🪪 DNI adjunto</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{fontSize:11,color:C.mt,marginTop:2,lineHeight:1.5}}>
                </div>

                {r.rgpd&&(
                  <div style={{background:C.sc+'12',border:`1px solid ${C.sc}44`,borderRadius:8,padding:'7px 9px',marginTop:7,fontSize:10,color:C.mt,lineHeight:1.5}}>
                    <b style={{color:C.sc}}>✓ Informado en materia de protección de datos</b>
                    <div>Aviso versión {r.rgpd.version} · leyó el {r.rgpd.leidoHastaPct}% · {r.rgpd.segundosEnPantalla}s en pantalla</div>
                    <div>{r.rgpd.cuando?new Date(r.rgpd.cuando).toLocaleString('es-ES'):''}</div>
                    <div style={{fontFamily:'monospace',fontSize:9,wordBreak:'break-all'}}>huella {r.rgpd.huellaTexto}</div>
                    <div style={{color:r.rgpd.comercial?C.in:C.mt,marginTop:2}}>
                      {r.rgpd.comercial?'✓ Acepta comunicaciones comerciales':'✕ No acepta comunicaciones comerciales'}
                    </div>
                  </div>
                )}

                <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
                  <button style={{...S.sm(C.sc),flex:'1 1 130px',fontSize:11}} onClick={()=>{
                    const nom=String(r.nombre||'').trim();
                    if(!nom){notify('Ese envío no trae nombre','error');return;}
                    // (el historial se apunta solo al detectar el cambio)
                    const anterior=(cliCat||[]).find(x=>x&&normProvNombre(x.nombre)===normProvNombre(nom));
                    // Si ya existía, no se machaca: se enseñan las diferencias y
                    // se decide campo a campo. Ese era el riesgo de aplicar sin más.
                    if(anterior&&compararFichas(anterior,r).some(c=>c.estado==='distinto')){
                      setFusion({nom,anterior,entrante:r,elegidos:{},envio:r.id});
                      return;
                    }
                    // v376 · UNA FICHA POR TITULAR. Antes se creaba solo la del
                    // primero y los demás quedaban dentro de `titulares[]`: sin ficha
                    // propia no se les puede buscar, ni facturar, ni poner en un
                    // contrato, y sus datos parecían del primero.
                    const res=fichasDeEnvio({...r,recibidoEn:today},cliCat);
                    persistCliCat(res.cliCat);
                    // Los DNI quedan asociados al cliente: sin esto no se sabría
                    // de quién es cada documento a la hora de destruirlo.
                    if(r.nDni>0&&window.bh10Dni){
                      window.bh10Dni.listar().then(ds=>{
                        ds.filter(d=>d.envio===r.id).forEach(d=>{window.bh10Dni.marcarCliente(d.id,nom).catch(()=>{});});
                      }).catch(()=>{});
                    }
                    if(alAplicar)try{alAplicar(r);}catch(e){console.error('vivienda del portal',e);}
                    if(window.bh10Recibidos)window.bh10Recibidos.borrar(r.id).catch(()=>{});
                    setCliRecibidos(p=>(p||[]).filter(x=>x.id!==r.id));
                    notify(res.creadas.length>1||res.creadas.length+res.actualizadas.length>1
                      ? `👤 ${res.creadas.length+res.actualizadas.length} fichas: ${[...res.creadas,...res.actualizadas].join(' · ')}${res.creadas.length?' ('+res.creadas.length+' nueva'+(res.creadas.length!==1?'s':'')+')':''}`
                      : `👤 Ficha de ${nom} actualizada con lo que envió`);
                  }}>✓ Aplicar a su ficha</button>
                  <BtnConfirm style={{...S.sm(C.dn),fontSize:11}} armStyle={{background:C.dn,color:'#fff'}} armedLabel="¿Descartar?"
                    onConfirm={()=>{
                      // Descartar el envío destruye también sus fotos: no tiene
                      // sentido guardar un DNI de datos que no se van a usar.
                      if(r.nDni>0&&window.bh10Dni)window.bh10Dni.borrarDeEnvio(r.id).catch(()=>{});
                      if(window.bh10Recibidos)window.bh10Recibidos.borrar(r.id).catch(()=>{});
                      setCliRecibidos(p=>(p||[]).filter(x=>x.id!==r.id));
                      notify(r.nDni>0?'Descartado — también sus fotos de DNI':'Descartado');
                    }}>🗑️</BtnConfirm>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))||null
);

const ModalMovilesCorreos=({avisarCerrar,contPegar,employees,notify,setContImport,setContPegar})=>(
  (contPegar!==null&&(
        <div style={S.overlay} onClick={avisarCerrar}>
          <div style={{...S.modal,maxWidth:520}} onClick={e=>e.stopPropagation()}>
            <div style={{...S.cabModal,display:'flex',alignItems:'center',gap:8}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14}}>📥 Móviles y correos</div>
                <div style={{fontSize:11,color:C.mt}}>Pega la tabla o elige un Excel</div>
              </div>
              <button style={{background:'transparent',border:'none',cursor:'pointer',color:C.mt,fontSize:20,lineHeight:1,padding:'0 4px'}} onClick={()=>setContPegar(null)}>✕</button>
            </div>
            <div style={{background:C.wn+'12',border:`1px solid ${C.wn}44`,borderRadius:9,padding:'9px 11px',marginBottom:9,fontSize:10.5,color:C.mt,lineHeight:1.5}}>
              Solo se tocan <b style={{color:C.tx}}>el móvil y el correo</b>. La cuenta bancaria
              NO se importa aunque venga en la tabla: la de la ficha es la buena, y un IBAN
              equivocado significa mandarle el dinero a otra persona.
            </div>
            <textarea style={{...S.input,minHeight:130,fontFamily:'monospace',fontSize:11,lineHeight:1.5}}
              value={contPegar} placeholder={'Nombre\ttelefono\tcorreo\nOtro nombre\ttelefono\tcorreo'}
              onChange={e=>setContPegar(e.target.value)}/>
            <div style={{fontSize:10,color:C.mt,margin:'6px 0 10px'}}>
              Un trabajador por línea. Da igual el orden de las columnas: el móvil y el correo se reconocen por su forma.
            </div>
            <div style={{display:'flex',gap:8}}>
              <button style={{...S.btn(C.sc),flex:1,opacity:String(contPegar||'').trim()?1:.5}}
                disabled={!String(contPegar||'').trim()}
                onClick={()=>{
                  const filas=String(contPegar||'').split(/\r?\n/).filter(l=>l.trim())
                    .map(l=>l.split(/\t|;|\s{2,}|,(?=\s)/).map(c=>c.trim()));
                  const l=leerContactos(filas,employees);
                  if(!l.length){notify('No he reconocido ningún móvil ni correo','error');return;}
                  setContPegar(null); setContImport(l);
                }}>Revisar</button>
              <label style={{...S.ghost,cursor:'pointer',display:'inline-flex',alignItems:'center'}}>
                📄 Excel
                <input type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}} onChange={async e=>{
                  const f=e.target.files&&e.target.files[0]; e.target.value='';
                  if(!f)return;
                  try{
                    const XLSX=await import('xlsx');
                    const wb=XLSX.read(await f.arrayBuffer());
                    const filas=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:''});
                    const l=leerContactos(filas,employees);
                    if(!l.length){notify('No he reconocido ningún móvil ni correo','error');return;}
                    setContPegar(null); setContImport(l);
                  }catch(x){notify('No se pudo leer: '+((x&&x.message)||x),'error');}
                }}/>
              </label>
            </div>
          </div>
        </div>
      ))||null
);

const ModalListadoFinancieras=({anotarCesion,avisarCerrar,cesion,compCfg,marcaDoc,notify,setCesion,shareOrDownload})=>(
  (cesion&&(
        <div style={S.overlay} onClick={avisarCerrar}>
          <div style={{...S.modal,maxWidth:520}} onClick={e=>e.stopPropagation()}>
            <div style={{...S.cabModal,display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14}}>🏦 Listado para entidades financieras</div>
                <div style={{fontSize:11,color:C.mt}}>{cesion.clientes.length} cliente{cesion.clientes.length!==1?'s':''} con autorización en vigor</div>
              </div>
              <button style={{background:'transparent',border:'none',cursor:'pointer',color:C.mt,fontSize:20,lineHeight:1,padding:'0 4px'}} onClick={()=>setCesion(null)}>✕</button>
            </div>

            <div style={{background:C.in+'12',border:`1px solid ${C.in}40`,borderRadius:9,padding:'9px 11px',marginBottom:10,fontSize:10.5,color:C.mt,lineHeight:1.5}}>
              Solo salen quienes lo autorizaron expresamente, y solo con los seis datos que autorizaron:
              nombre, apellidos, DNI, teléfono, correo y vivienda. <b style={{color:C.tx}}>Nunca la copia del DNI</b>, ni el estado civil, ni nada más.
            </div>

            <label><span style={{fontSize:10,color:C.mt}}>¿A qué entidad se lo mandas?</span>
              <input style={S.input} value={cesion.entidad} placeholder="Banco Sabadell — oficina de Illescas"
                onChange={e=>setCesion(p=>({...p,entidad:e.target.value}))}/></label>

            <div style={{maxHeight:190,overflowY:'auto',marginBottom:10}}>
              {cesion.clientes.map((f,i)=>{
                const fila=filaCesion(f);
                const marcadas=(f.bancos&&Array.isArray(f.bancos.entidades))?f.bancos.entidades:[];
                return(
                  <div key={i} style={{background:C.bg,borderRadius:8,padding:'7px 10px',marginBottom:5,fontSize:11}}>
                    <div style={{fontWeight:700}}>{fila.nombre} {fila.apellidos}</div>
                    <div style={{color:C.mt,fontSize:10}}>
                      {fila.dni}{fila.telefono?' · '+fila.telefono:''}{fila.email?' · '+fila.email:''}
                    </div>
                    <div style={{color:fila.vivienda?C.vt:C.wn,fontSize:10}}>
                      {fila.vivienda||'⚠ sin vivienda indicada'}
                    </div>
                    {marcadas.length>0&&(
                      <div style={{fontSize:9,color:C.in,marginTop:2}}>Autorizó: {marcadas.join(' · ')}</div>
                    )}
                  </div>
                );
              })}
            </div>

            {(()=>{
              const sinVivienda=cesion.clientes.filter(f=>!filaCesion(f).vivienda).length;
              const elegida=String(cesion.entidad||'').trim();
              const noMarcaron=elegida?cesion.clientes.filter(f=>{
                const m=(f.bancos&&f.bancos.entidades)||[];
                return m.length>0&&!m.some(x=>normProvNombre(x)===normProvNombre(elegida)||String(elegida).toLowerCase().includes(String(x).toLowerCase()));
              }).length:0;
              if(!sinVivienda&&!noMarcaron)return null;
              return(
                <div style={{background:C.wn+'14',border:`1px solid ${C.wn}55`,borderRadius:9,padding:'8px 10px',marginBottom:9,fontSize:10.5,color:C.wn,lineHeight:1.45}}>
                  {sinVivienda>0&&<div>⚠ {sinVivienda} sin vivienda indicada: complétala en su ficha antes de mandarlo.</div>}
                  {noMarcaron>0&&<div>⚠ {noMarcaron} no marcó esa entidad al autorizar. Revísalo: el consentimiento era para las que eligió.</div>}
                </div>
              );
            })()}

            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              <button style={{...S.btn(C.sc),flex:'1 1 150px'}} disabled={!String(cesion.entidad||'').trim()} onClick={()=>{
                const ent=String(cesion.entidad||'').trim();
                const filas=cesion.clientes.map(filaCesion);
                const cab=['Nombre','Apellidos','DNI','Teléfono','Email','Vivienda reservada'];
                const csv=[cab.join(';'),...filas.map(f=>CESION_CAMPOS.map(k=>`"${String(f[k]||'').replace(/"/g,'""')}"`).join(';'))].join('\r\n');
                shareOrDownload('\uFEFF'+csv,`clientes_${ent.replace(/[^\w]+/g,'_')}_${today}.csv`,'text/csv;charset=utf-8');
                setCesion(p=>({...p,hechas:anotarCesion(ent,filas.map(f=>(f.nombre+' '+f.apellidos).trim()))}));
                notify(`🏦 Listado de ${filas.length} para ${ent} · queda registrado`);
              }}>📄 Generar listado</button>
              <button style={{...S.sm(C.mt),fontSize:11}} onClick={()=>{
                const ent=String(cesion.entidad||'').trim()||'la entidad';
                const filas=cesion.clientes.map(filaCesion);
                const txt=filas.map(f=>`${f.nombre} ${f.apellidos} · DNI ${f.dni} · ${f.telefono} · ${f.email}${f.vivienda?' · '+f.vivienda:''}`).join('\n');
                try{navigator.clipboard.writeText(`Clientes de ${compCfg.name||marcaDoc()} interesados en financiación (${ent}):\n\n`+txt);notify('Copiado');}catch(e){}
              }}>📋 Copiar</button>
            </div>

            {(cesion.hechas||[]).length>0&&(
              <div style={{marginTop:11,borderTop:`1px solid ${C.bd}`,paddingTop:9}}>
                <div style={{fontSize:10,fontWeight:700,color:C.mt,marginBottom:4}}>ENVÍOS YA REALIZADOS</div>
                {(cesion.hechas||[]).slice(-6).reverse().map((c,i)=>(
                  <div key={i} style={{fontSize:10,color:C.mt,marginBottom:2}}>
                    {new Date(c.fecha).toLocaleDateString('es-ES')} · <b style={{color:C.tx}}>{c.entidad}</b> · {c.n} cliente{c.n!==1?'s':''}
                  </div>
                ))}
                <div style={{fontSize:9.5,color:C.mt,marginTop:5,lineHeight:1.4}}>
                  Queda registrado a quién se cedió y cuándo. Es lo que permite acreditarlo si algún día se pregunta.
                </div>
              </div>
            )}
          </div>
        </div>
      ))||null
);

const ModalFichaCliente=({CLI_NUEVO,ES_APP,avisarCerrar,cliCat,cliForm,cliGenerando,cliModal,cliMotivo,cliSoloFiscal,clientes,compCfg,esLector,marcaDoc,notify,persistCliCat,setCliForm,setCliGenerando,setCliModal,setCliMotivo,setCliSoloFiscal,setContratos,setInvoices})=>(
  (cliModal&&(
        <div style={S.overlay} onClick={avisarCerrar}>
          <div style={{...S.modal,maxWidth:470}} onClick={e=>e.stopPropagation()}>
            <div style={{...S.cabModal,display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <span style={{fontWeight:700,fontSize:15}}>{cliModal!==CLI_NUEVO?'👤 Ficha del cliente':'➕ Nuevo cliente'}</span>
              <button onClick={()=>setCliModal(null)} style={{background:'none',border:'none',color:C.mt,cursor:'pointer',fontSize:18}}>✕</button>
            </div>
            <div style={{fontSize:11,color:C.mt,marginBottom:10,lineHeight:1.45}}>
              Lo que pongas aquí se rellena solo al emitirle una factura, un presupuesto o un contrato.
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <label style={{gridColumn:'1/-1'}}><span style={{fontSize:10,color:C.mt}}>Razón social</span>
                <input style={S.input} value={cliForm.nombre} onChange={e=>setCliForm(p=>({...p,nombre:e.target.value}))}/></label>
              <label><span style={{fontSize:10,color:C.mt}}>CIF / NIF</span>
                <input style={{...S.input,fontFamily:'monospace'}} value={cliForm.cif||''} maxLength={12}
                  onChange={e=>setCliForm(p=>({...p,cif:e.target.value.toUpperCase()}))} placeholder="B12345678"/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Persona de contacto</span>
                <input style={S.input} value={cliForm.contacto||''} onChange={e=>setCliForm(p=>({...p,contacto:e.target.value}))}/></label>
              <label style={{gridColumn:'1/-1'}}><span style={{fontSize:10,color:C.mt}}>Domicilio fiscal</span>
                <input style={S.input} value={cliForm.dir||''} onChange={e=>setCliForm(p=>({...p,dir:e.target.value}))} placeholder="C/ Mayor 14"/></label>
              <label><span style={{fontSize:10,color:C.mt}}>CP</span>
                <input style={S.input} inputMode="numeric" value={cliForm.cp||''} onChange={e=>setCliForm(p=>({...p,cp:e.target.value}))} placeholder="45200"/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Municipio</span>
                <input style={S.input} value={cliForm.municipio||''} onChange={e=>setCliForm(p=>({...p,municipio:e.target.value}))} placeholder="Illescas"/></label>
              <label style={{gridColumn:'1/-1'}}><span style={{fontSize:10,color:C.mt}}>Provincia</span>
                <input style={S.input} value={cliForm.provincia||''} onChange={e=>setCliForm(p=>({...p,provincia:e.target.value}))} placeholder="Toledo"/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Email</span>
                <input style={S.input} type="email" inputMode="email" autoCapitalize="off" value={cliForm.email||''}
                  onChange={e=>setCliForm(p=>({...p,email:e.target.value.trim()}))}/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Teléfono</span>
                <input style={S.input} type="tel" inputMode="tel" value={cliForm.telefono||''}
                  onChange={e=>setCliForm(p=>({...p,telefono:e.target.value}))}/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Días de cobro habituales</span>
                <input style={S.input} inputMode="numeric" value={cliForm.diasVenc||''}
                  onChange={e=>setCliForm(p=>({...p,diasVenc:e.target.value}))} placeholder="30"/></label>
              <label><span style={{fontSize:10,color:C.vt}}>🛡️ Retención garantía (%)</span>
                <input style={S.input} inputMode="decimal" value={cliForm.retGarPct||''}
                  onChange={e=>setCliForm(p=>({...p,retGarPct:e.target.value}))} placeholder="5"/></label>
              <label><span style={{fontSize:10,color:C.mt}}>🏛 Notaría <span style={{opacity:.7}}>(donde firmará)</span></span>
                <input style={S.input} value={cliForm.notariaNombre||''}
                  onChange={e=>setCliForm(p=>({...p,notariaNombre:e.target.value}))} placeholder="Notaría de Illescas"/></label>
              <label><span style={{fontSize:10,color:C.mt}}>Correo de la notaría</span>
                <input style={S.input} type="email" inputMode="email" autoCapitalize="off" value={cliForm.notariaEmail||''}
                  onChange={e=>setCliForm(p=>({...p,notariaEmail:e.target.value.trim()}))} placeholder="notaria@ejemplo.es"/></label>
              <label style={{gridColumn:'1/-1'}}><span style={{fontSize:10,color:C.mt}}>Notas</span>
                <input style={S.input} value={cliForm.notas||''} onChange={e=>setCliForm(p=>({...p,notas:e.target.value}))}
                  placeholder="Facturar a 60 días, requiere nº de pedido…"/></label>
            </div>

            {cliForm.email&&!emailValido(cliForm.email)&&(
              <div style={{fontSize:10,color:C.wn,marginTop:6}}>⚠ Ese correo no parece válido</div>
            )}
            {cliModal!==CLI_NUEVO&&cliForm.nombre.trim()!==cliModal&&(
              <div style={{fontSize:10,color:C.wn,marginTop:6}}>⚠ Al guardar se renombrará también en sus facturas y contratos</div>
            )}
            {cliModal===CLI_NUEVO&&(()=>{
              const yaEsta=clientes.find(x=>normProvNombre(x)===normProvNombre(cliForm.nombre));
              if(!yaEsta||!String(cliForm.nombre||'').trim())return null;
              return <div style={{fontSize:10,color:C.wn,marginTop:6}}>⚠ Ya existe «{yaEsta}». Al guardar se actualizará su ficha en vez de crear otro.</div>;
            })()}

            {/* Enlace personal: se manda cuando la otra parte tiene motivo para
                contestar (al firmar), no como un portal abierto que nadie usa. */}
            {ES_APP&&!esLector()&&window.bh10Invitar&&(
              <div style={{background:C.in+'10',border:`1px solid ${C.in}40`,borderRadius:10,padding:'10px 12px',marginTop:12}}>
                <div style={{fontSize:11,fontWeight:700,color:C.in,marginBottom:3}}>🔗 Que los rellene el cliente</div>
                <div style={{fontSize:10,color:C.mt,lineHeight:1.45,marginBottom:7}}>
                  Genera un enlace personal con lo que ya sabes precargado. Él completa lo que falte y lee la información de protección de datos, que queda registrada.
                </div>
                <div style={{display:'flex',gap:6,marginBottom:7}}>
                  <input style={{...S.input,flex:1,fontSize:11}} value={cliMotivo} placeholder="Para qué: «Contrato chalet nº 4»"
                    onChange={e=>setCliMotivo(e.target.value)}/>
                </div>
                <label style={{display:'flex',alignItems:'center',gap:7,cursor:'pointer',marginBottom:7}}>
                  <input type="checkbox" checked={cliSoloFiscal} onChange={e=>setCliSoloFiscal(e.target.checked)} style={{width:17,height:17,accentColor:C.in}}/>
                  <span style={{fontSize:10,color:C.mt}}>Solo datos fiscales (sin los personales del contrato)</span>
                </label>
                <button style={{...S.sm(C.in),width:'100%',fontSize:11,opacity:cliGenerando?.6:1}} disabled={cliGenerando}
                  onClick={async()=>{
                    setCliGenerando(true);
                    try{
                      const enlace=await window.bh10Invitar({
                        ...cliForm, motivo:String(cliMotivo||'').trim(), soloFiscal:!!cliSoloFiscal,
                        empresaNombre:compCfg.name||marcaDoc(), empresaNif:compCfg.cif||'', empresaEmail:compCfg.email||'',
                      });
                      try{await navigator.clipboard.writeText(enlace);notify('🔗 Enlace copiado — mándaselo por WhatsApp o correo');}
                      catch(e){notify(enlace);}
                    }catch(e){notify('No se pudo crear el enlace: '+((e&&e.code)||e),'error');}
                    setCliGenerando(false);
                  }}>{cliGenerando?'⏳ Creando…':'🔗 Crear enlace y copiarlo'}</button>
                <div style={{fontSize:9,color:C.mt,marginTop:5,lineHeight:1.4}}>
                  Sirve una sola vez y caduca a los 30 días. Cuando lo rellene, te llegará para revisar antes de guardarlo.
                </div>
              </div>
            )}
            <div style={{display:'flex',gap:8,marginTop:12}}>
              <button style={{...S.btn(C.sc),flex:1}} onClick={()=>{
                const nom=String(cliForm.nombre||'').trim();
                if(!nom){notify('El cliente necesita un nombre','error');return;}
                // (el historial se apunta solo al detectar el cambio)
                const limpia={...cliForm,nombre:nom};
                delete limpia._origen;
                persistCliCat([...(cliCat||[]).filter(x=>x&&normProvNombre(x.nombre)!==normProvNombre(cliModal)&&normProvNombre(x.nombre)!==normProvNombre(nom)),limpia]);
                // Si se ha renombrado, se arrastra a facturas y contratos.
                // En un alta nueva no hay nada anterior que renombrar.
                if(cliModal&&cliModal!==CLI_NUEVO&&nom!==cliModal){
                  setInvoices(p=>p.map(x=>x&&x.tipo==='cobro'&&x.proveedor===cliModal?{...x,proveedor:nom}:x));
                  setContratos(p=>p.map(x=>x&&x.cliente===cliModal?{...x,cliente:nom}:x));
                }
                setCliModal(null);
                notify(cliModal!==CLI_NUEVO?`👤 Ficha de ${nom} guardada`:`👤 ${nom} dado de alta — ya puedes hacerle presupuesto o factura`);
              }}>{cliModal!==CLI_NUEVO?'💾 Guardar ficha':'➕ Dar de alta'}</button>
              <button style={S.ghost} onClick={()=>setCliModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      ))||null
);

const ModalComparacionCapas=({avisarCerrar,capas,notify,setCapas})=>(
  (capas&&(
        <div style={S.overlay} onClick={avisarCerrar}>
          <div style={{...S.modal,maxWidth:520}} onClick={e=>e.stopPropagation()}>
            <div style={{...S.cabModal,display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14}}>🔍 Comparación de capas</div>
                <div style={{fontSize:11,color:C.mt}}>Dónde está cada factura y cuál no llega a la pantalla</div>
              </div>
              <button style={{background:'transparent',border:'none',cursor:'pointer',color:C.mt,fontSize:20,lineHeight:1,padding:'0 4px'}} onClick={()=>setCapas(null)}>✕</button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:10}}>
              {[['☁️ Nube',capas.r.nube,capas.r.nubeFecha],['📱 Móvil',capas.r.local,capas.r.localFecha],['👁 Pantalla',capas.enPantalla,'']].map(([l,v,f])=>(
                <div key={l} style={{background:C.bg,borderRadius:9,padding:'8px 6px',textAlign:'center'}}>
                  <div style={{fontSize:9,color:C.mt}}>{l}</div>
                  <div style={{fontSize:16,fontWeight:800,color:v===capas.enPantalla?C.sc:C.wn}}>{v}</div>
                  {f&&<div style={{fontSize:8,color:C.mt,marginTop:2}}>{String(f).slice(0,17)}</div>}
                </div>
              ))}
            </div>

            {capas.faltan.length===0&&(
              <div style={{background:C.in+'14',border:`1px solid ${C.in}44`,borderRadius:9,padding:'9px 11px',fontSize:11,color:C.mt}}>
                Los números no coinciden, pero todas las facturas guardadas están en pantalla.
                Suele significar que la nube tiene un guardado a medio confirmar: espera unos segundos y vuelve a comparar,
                o pulsa «Recargar todo desde la nube».
              </div>
            )}

            {capas.faltan.length>0&&(
              <>
                <div style={{fontSize:11,fontWeight:700,color:C.wn,marginBottom:5}}>
                  {capas.faltan.length} guardada{capas.faltan.length!==1?'s':''} que no llega{capas.faltan.length!==1?'n':''} a la pantalla
                </div>
                {capas.faltan.slice(0,25).map((f,i)=>(
                  <div key={i} style={{background:C.bg,borderRadius:9,padding:'8px 10px',marginBottom:6,borderLeft:`3px solid ${f.valida?C.wn:C.dn}`}}>
                    {f.valida?(
                      <>
                        <div style={{display:'flex',justifyContent:'space-between',gap:8}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:12,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.proveedor||'(sin proveedor)'}</div>
                            <div style={{fontSize:10,color:C.mt}}>{f.numFactura||'sin nº'} · {f.fecha?fmtDate(f.fecha):'sin fecha'}</div>
                          </div>
                          <div style={{fontSize:12,fontWeight:700,flexShrink:0}}>{f.total!==undefined?fmt(f.total)+' €':'—'}</div>
                        </div>
                        <div style={{fontSize:10,color:C.wn,marginTop:3}}>Está guardada pero no se está mostrando. Prueba a recargar desde la nube.</div>
                      </>
                    ):(
                      <>
                        <div style={{fontSize:12,fontWeight:700,color:C.dn}}>⛔ Registro estropeado en la posición {f.pos+1}</div>
                        <div style={{fontSize:10,color:C.mt,marginTop:2}}>No es una factura válida, así que la app lo descarta al cargar para no reventar.</div>
                        <div style={{fontFamily:'monospace',fontSize:9,color:C.mt,marginTop:3,wordBreak:'break-all'}}>{f.crudo}</div>
                      </>
                    )}
                  </div>
                ))}
                {capas.faltan.length>25&&<div style={{fontSize:10,color:C.mt,marginBottom:6}}>y {capas.faltan.length-25} más</div>}
              </>
            )}

            {(capas.descartes||[]).length>0&&(
              <div style={{background:C.dn+'12',border:`1px solid ${C.dn}44`,borderRadius:9,padding:'9px 11px',marginTop:4,fontSize:11}}>
                <div style={{fontWeight:700,color:C.dn}}>Descartado al cargar</div>
                {capas.descartes.map((d,i)=>(
                  <div key={i} style={{fontSize:10,color:C.mt,marginTop:3}}>
                    <b>{d.clave}</b>: {d.n} registro{d.n!==1?'s':''} · {d.ejemplos.join(' · ')}
                  </div>
                ))}
              </div>
            )}

            <div style={{display:'flex',gap:6,marginTop:10,flexWrap:'wrap'}}>
              <button style={{...S.sm(C.in),flex:'1 1 150px',fontSize:11}} onClick={()=>{window.bh10Resync&&window.bh10Resync();}}>🔄 Recargar desde la nube</button>
              <button style={{...S.sm(C.mt),fontSize:11}} onClick={()=>{
                const txt=`Comparación ${new Date().toLocaleString('es-ES')}\nNube ${capas.r.nube} (${capas.r.nubeFecha})\nMóvil ${capas.r.local} (${capas.r.localFecha})\nPantalla ${capas.enPantalla}\nGuardadas ${capas.guardadas}\n\n`+
                  capas.faltan.map(f=>f.valida?`· ${f.proveedor} · ${f.numFactura} · ${f.fecha} · ${f.total} €`:`· POSICIÓN ${f.pos+1} ESTROPEADA: ${f.crudo}`).join('\n');
                try{navigator.clipboard.writeText(txt);notify('Copiado');}catch(e){}
              }}>📋 Copiar el detalle</button>
            </div>
          </div>
        </div>
      ))||null
);

const ModalAnularVf=({BtnConfirm,avisarCerrar,emitirRectificativa,setVfAnular,vfAnular,vfAnularFactura})=>(
  (vfAnular&&(
        <div style={S.overlay} onClick={avisarCerrar}>
          <div style={{...S.modal,maxWidth:480}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>🧾 Factura {vfAnular.reg.numSerie}</div>
            <div style={{background:C.bg,borderRadius:9,padding:'9px 11px',marginBottom:10,fontSize:11}}>
              <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:C.mt}}>Fecha</span><b>{vfAnular.reg.fechaExpedicion}</b></div>
              <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:C.mt}}>Importe</span><b>{fmt(vfAnular.reg.importeTotal)} €</b></div>
              <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:C.mt}}>Estado</span><b>{VF_ESTADOS[vfAnular.reg.estadoAEAT]||'Sin enviar'}</b></div>
            </div>

            <div style={{fontSize:11,color:C.mt,lineHeight:1.5,marginBottom:10}}>
              Registrada no se puede modificar. Hay <b>dos formas</b> de dejarla sin efecto, y no son lo mismo:
            </div>

            {/* ── Opción A ── */}
            <div style={{border:`1px solid ${vfAnular.via==='anular'?C.dn:C.bd}`,borderRadius:10,padding:'10px 12px',marginBottom:8,cursor:'pointer',background:vfAnular.via==='anular'?C.dn+'12':'transparent'}}
              onClick={()=>setVfAnular(p=>({...p,via:'anular'}))}>
              <div style={{fontWeight:700,fontSize:12,color:vfAnular.via==='anular'?C.dn:C.tx}}>↩️ Anular el registro</div>
              <div style={{fontSize:10,color:C.mt,marginTop:3,lineHeight:1.45}}>
                Para una factura que <b>nunca debió existir</b>: una prueba, un duplicado, un error al crearla.
                Se comunica a la AEAT que ese registro se retira y <b>desaparece del libro</b>. No se genera ningún documento.
              </div>
            </div>

            {/* ── Opción B ── */}
            <div style={{border:`1px solid ${vfAnular.via==='rectificar'?C.in:C.bd}`,borderRadius:10,padding:'10px 12px',marginBottom:10,cursor:'pointer',background:vfAnular.via==='rectificar'?C.in+'12':'transparent'}}
              onClick={()=>setVfAnular(p=>({...p,via:'rectificar'}))}>
              <div style={{fontWeight:700,fontSize:12,color:vfAnular.via==='rectificar'?C.in:C.tx}}>📄 Emitir una rectificativa</div>
              <div style={{fontSize:10,color:C.mt,marginTop:3,lineHeight:1.45}}>
                Para una factura <b>válida que ya está en manos del cliente</b> y hay que dejar sin efecto.
                Se emite una factura nueva con <b>los importes en negativo</b>, con su número de serie, y las dos quedan en el libro sumando cero.
              </div>
              {vfAnular.via==='rectificar'&&vfAnular.inv&&(()=>{
                const des=normDesglose(vfAnular.inv);
                const t=calcDesglose(des.map(l=>({base:-Math.abs(l.base),tipo:l.tipo})),-(Math.abs(+vfAnular.inv.irpf||0)));
                return(
                  <div style={{background:C.bg,borderRadius:8,padding:'7px 9px',marginTop:7,fontSize:10}}>
                    <div style={{color:C.mt,marginBottom:3}}>Quedará así:</div>
                    {des.map((l,k)=><div key={k} style={{display:'flex',justifyContent:'space-between'}}><span>Base al {l.tipo}%</span><b style={{color:C.dn}}>{fmt(-Math.abs(l.base))} €</b></div>)}
                    <div style={{display:'flex',justifyContent:'space-between',borderTop:`1px solid ${C.bd}`,marginTop:3,paddingTop:3}}><b>Total</b><b style={{color:C.dn}}>{fmt(t.total)} €</b></div>
                  </div>
                );
              })()}
            </div>

            {vfAnular.via==='anular'&&(
              <label><span style={{fontSize:10,color:C.mt}}>Motivo de la anulación</span>
                <input style={S.input} value={vfAnular.motivo} autoFocus placeholder="Factura de prueba"
                  onChange={e=>setVfAnular(p=>({...p,motivo:e.target.value}))}/></label>
            )}

            <div style={{display:'flex',gap:8,marginTop:12,justifyContent:'flex-end',flexWrap:'wrap'}}>
              <button style={S.ghost} onClick={()=>setVfAnular(null)}>Cancelar</button>
              {vfAnular.via==='anular'&&(
                <BtnConfirm style={S.btn(C.dn)} armStyle={{background:C.dn,color:'#fff'}} armedLabel="¿Seguro? Anular"
                  onConfirm={async()=>{
                    const m=String(vfAnular.motivo||'').trim()||'Sin motivo indicado';
                    const inv=vfAnular.inv; setVfAnular(null);
                    await vfAnularFactura(inv,m);
                  }}>Anular el registro</BtnConfirm>
              )}
              {vfAnular.via==='rectificar'&&(
                <BtnConfirm style={S.btn(C.in)} armStyle={{background:C.in,color:'#fff'}} armedLabel="¿Seguro? Emitir"
                  onConfirm={()=>{const inv=vfAnular.inv; setVfAnular(null); emitirRectificativa(inv);}}>Emitir rectificativa</BtnConfirm>
              )}
            </div>
            {!vfAnular.via&&<div style={{fontSize:10,color:C.mt,marginTop:8,textAlign:'center'}}>Elige arriba qué quieres hacer</div>}
          </div>
        </div>
      ))||null
);

const ModalPresupuestosObra=({InvRow,dashFrom,dashTo,kpiDetail,setKpiDetail})=>(
  (kpiDetail&&(
        <div style={S.overlay}>
          <div style={{...S.modal,maxWidth:600,padding:0,display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
            <div style={{...S.cabModal,display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',borderBottom:`1px solid ${C.bd}`,flexShrink:0}}>
              <div>
                <div style={{fontWeight:700,fontSize:14}}>{kpiDetail.title}</div>
                <div style={{fontSize:11,color:C.mt}}>{kpiDetail.mode==='budget'?`${kpiDetail.rows.length} obra${kpiDetail.rows.length!==1?'s':''}`:`${kpiDetail.list.length} registro${kpiDetail.list.length!==1?'s':''}`}{(dashFrom||dashTo)?' · periodo filtrado':''}</div>
              </div>
              <button onClick={()=>setKpiDetail(null)} style={{background:'none',border:'none',color:C.mt,cursor:'pointer',fontSize:18,padding:4}}>✕</button>
            </div>
            <div style={{overflowY:'auto',padding:'10px 12px',flex:1}}>
              {kpiDetail.mode==='budget'?(
                kpiDetail.rows.length===0?<div style={{textAlign:'center',padding:20,color:C.mt}}>Sin obras con presupuesto</div>:
                <div>
                  {kpiDetail.rows.sort((a,b)=>{const pa=a.ppto?a.real/a.ppto:0,pb=b.ppto?b.real/b.ppto:0;return pb-pa;}).map(r=>{
                    const p=r.ppto>0?r.real/r.ppto*100:0;
                    const isGasto=kpiDetail.kind==='gasto';
                    const over=isGasto?p>100:p<100;
                    const color=isGasto?(p>100?C.dn:p>85?C.wn:C.sc):(p>=100?C.sc:p>=50?C.in:C.wn);
                    return(
                      <div key={r.disp} style={{background:C.cd,borderRadius:8,padding:'10px 12px',marginBottom:6,border:`1px solid ${C.bd}`}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6,gap:8}}>
                          <div style={{fontWeight:700,fontSize:13,flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis'}}>{r.disp}</div>
                          <div style={{textAlign:'right',flexShrink:0}}>
                            <div style={{fontSize:15,fontWeight:800,color}}>{r.ppto>0?Math.round(p)+'%':'—'}</div>
                            <div style={{fontSize:10,color:C.mt}}>{fmt(r.real)} € / {r.ppto>0?fmt(r.ppto)+' €':'sin ppto'}</div>
                          </div>
                        </div>
                        {r.ppto>0&&<div style={{height:6,background:C.bg,borderRadius:3,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${Math.min(p,100)}%`,background:color,borderRadius:3,transition:'width .3s'}}/>
                        </div>}
                        {over&&<div style={{fontSize:10,marginTop:4,color:isGasto?C.dn:C.wn,fontWeight:600}}>
                          {isGasto?`⚠ Sobrecoste: +${fmt(r.real-r.ppto)} €`:`Falta facturar: ${fmt(r.ppto-r.real)} €`}
                        </div>}
                      </div>
                    );
                  })}
                </div>
              ):(
                kpiDetail.list.length===0?<div style={{textAlign:'center',padding:20,color:C.mt}}>Sin registros</div>:
                [...kpiDetail.list].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')).map(inv=><div key={inv.id}>{InvRow({inv})}</div>)
              )}
            </div>
          </div>
        </div>
      ))||null
);

// ═══ v370 · CONTRATO DE VENTA: RESERVA Y ARRAS ═════════════════════════════
// Jesús (06-09-2026): los importes «son cifras que habrá que rellenar», así
// que nacen en blanco cada vez. La app pone lo que ya sabe (vendedora,
// comprador del portal, vivienda y mejoras) y aquí se completa lo demás.
const ModalDocVenta=({docVentaModal,setDocVentaModal,ponCond,previaDocVenta,generarDocVenta,eurDoc,nombreObra})=>{
  if(!docVentaModal)return null;
  const {tipo,obra,vivienda,cond}=docVentaModal;
  const esArras=tipo==='arras';
  const F=({k,l,tipo:t='text',ancho='1 1 46%',ph=''})=>(
    <label style={{flex:ancho,minWidth:0}}><span style={{fontSize:10,color:C.mt}}>{l}</span>
      <input style={S.input} type={t==='num'?'text':t} inputMode={t==='num'?'decimal':undefined} placeholder={ph}
        value={cond[k]===0?'':(cond[k]||'')} onChange={e=>ponCond(k,t==='num'?parseNum(e.target.value):e.target.value)}/></label>
  );
  return (
    <div style={S.overlay}>
      <div style={{...S.modal,maxWidth:560,maxHeight:'92%',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
        <div style={{...S.cabModal,display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <span style={{fontWeight:700,fontSize:15}}>📄 Contrato · vivienda {vivienda.identificador} · {nombreObra(obra)}</span>
          <button onClick={()=>setDocVentaModal(null)} style={{background:'none',border:'none',color:C.mt,cursor:'pointer',fontSize:18}}>✕</button>
        </div>
        <div style={{display:'flex',gap:6,marginBottom:10}}>
          {[['reserva','📝 Reserva'],['arras','🤝 Arras confirmatorias']].map(([k,l])=>(
            <button key={k} onClick={()=>setDocVentaModal(m=>({...m,tipo:k}))} style={{flex:1,padding:'9px 6px',borderRadius:10,fontSize:12,fontWeight:tipo===k?700:500,cursor:'pointer',border:`1px solid ${tipo===k?C.in:C.bd}`,background:tipo===k?C.in+'22':'transparent',color:tipo===k?C.in:C.mt}}>{l}</button>
          ))}
        </div>
        <div style={{fontSize:10.5,color:C.mt,marginBottom:8,lineHeight:1.5}}>
          La parte vendedora sale de la empresa en uso; el comprador, de lo que rellenó en su enlace; la vivienda y sus mejoras, de su ficha. Aquí solo van las cifras y condiciones de esta venta.
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
          <F k="fechaFirma" l="Fecha del contrato" tipo="date"/>
          <F k="lugarFirma" l="Lugar de firma" ph="Yuncos"/>
          <F k="reservaImporte" l="💶 Importe de la reserva (€)" tipo="num" ph="0"/>
          {!esArras&&<F k="reservaPlazoDias" l="Días de vigencia" tipo="num" ph="30"/>}
          {!esArras&&<F k="reservaFechaLimite" l="Fecha límite para firmar arras" tipo="date"/>}
          <F k="cuenta" l="Cuenta para la reserva" ancho="1 1 100%" ph="ES.."/>
          {esArras&&<><F k="arrasImporte" l="🤝 Importe de las arras (€)" tipo="num" ph="0"/>
          <F k="reservaFecha" l="Fecha de la reserva previa" tipo="date"/>
          <F k="cuentaEspecial" l="Cuenta especial (Ley 20/2015)" ancho="1 1 100%" ph="ES.."/>
          <F k="garantiaTipo" l="Garantía" ph="aval / seguro de caución"/>
          <F k="garantiaEntidad" l="Entidad que la otorga" ph="AXA…"/>
          <F k="garantiaNumero" l="Nº de aval o póliza"/>
          <F k="garantiaEntidadCuenta" l="Banco de la cuenta especial" ph="Eurocaja Rural"/>
          <F k="notariaLocalidad" l="Notaría (localidad)"/>
          <F k="gastosReparto" l="Reparto de gastos" ancho="1 1 100%" ph="cada parte los que legalmente le correspondan"/>
          <div style={{flex:'1 1 100%',fontSize:10,fontWeight:700,color:C.mt,marginTop:4}}>Datos registrales de la finca</div>
          <F k="fincaRegistro" l="Registro de la Propiedad"/><F k="fincaNumero" l="Finca nº"/>
          <F k="fincaTomo" l="Tomo"/><F k="fincaLibro" l="Libro"/><F k="fincaFolio" l="Folio"/>
          <F k="fincaCatastral" l="Referencia catastral"/></>}
          <F k="licencia" l="Licencia de obras nº"/><F k="licenciaFecha" l="Fecha de licencia" tipo="date"/>
        </div>
        {esArras&&(
          <div style={{...S.card,marginBottom:8}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <b style={{flex:1,fontSize:12}}>📅 Calendario de pagos</b>
              <button style={S.sm(C.in)} onClick={()=>ponCond('calendario',[...(cond.calendario||[]),{concepto:'',importe:0,fechaOHito:''}])}>➕ Plazo</button>
            </div>
            {(cond.calendario||[]).length===0&&<div style={{fontSize:10,color:C.mt}}>Sin plazos: el contrato dirá que se acordarán por escrito en anexo.</div>}
            {(cond.calendario||[]).map((p,k)=>(
              <div key={k} style={{display:'flex',gap:6,marginBottom:4,alignItems:'center'}}>
                <input style={{...S.input,flex:'2 1 90px'}} placeholder="Concepto" value={p.concepto||''} onChange={e=>{const c=[...cond.calendario];c[k]={...p,concepto:e.target.value};ponCond('calendario',c);}}/>
                <input style={{...S.input,flex:'1 1 70px'}} inputMode="decimal" placeholder="€" value={p.importe||''} onChange={e=>{const c=[...cond.calendario];c[k]={...p,importe:parseNum(e.target.value)};ponCond('calendario',c);}}/>
                <input style={{...S.input,flex:'1 1 80px'}} placeholder="fecha o hito" value={p.fechaOHito||''} onChange={e=>{const c=[...cond.calendario];c[k]={...p,fechaOHito:e.target.value};ponCond('calendario',c);}}/>
                <button style={S.sm(C.dn)} onClick={()=>ponCond('calendario',cond.calendario.filter((_,x)=>x!==k))}>🗑</button>
              </div>
            ))}
          </div>
        )}
        {previaDocVenta&&(
          <div style={{...S.card,marginBottom:8,borderColor:previaDocVenta.pendientes?C.wn+'88':C.sc+'66'}}>
            <div style={{fontSize:11,fontWeight:700,marginBottom:4,color:previaDocVenta.pendientes?C.wn:C.sc}}>
              {previaDocVenta.pendientes?`⚠️ ${previaDocVenta.pendientes} datos sin rellenar — saldrán como «__________» en el contrato`:'✓ El contrato está completo'}
            </div>
            <div style={{maxHeight:200,overflowY:'auto',fontSize:10,lineHeight:1.55,whiteSpace:'pre-wrap',color:C.mt,fontFamily:'ui-monospace,monospace'}}>{previaDocVenta.texto}</div>
          </div>
        )}
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button style={{...S.btn(C.sc),flex:'1 1 150px'}} onClick={()=>generarDocVenta(false)}>💾 Guardar borrador</button>
          <button style={{...S.btn(C.in),flex:'1 1 150px'}} onClick={()=>generarDocVenta(true)}>🔗 Enviar a firmar al móvil</button>
          <button style={S.ghost} onClick={()=>setDocVentaModal(null)}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

// ═══ v371 · EXPEDIENTE DE LA VIVIENDA: DATOS Y DNI PARA LOS BOLETINES ══════
// Jesús (06-09-2026): «debo tener acceso desde cada vivienda a toda la info
// para luego dar de alta los boletines de luz y agua». Aquí están los datos
// de cada titular y su DNI por las dos caras, listos para copiar o descargar.
// Las imágenes se piden a la custodia al abrir y NO se guardan en la vivienda.
const ModalDniVivienda=({dniVivienda,setDniVivienda,nombreObra,copiar,descargarDni,fmtDate})=>{
  if(!dniVivienda)return null;
  const {vivienda,obra,cargando,titulares}=dniVivienda;
  const linea=(f)=>[f.nombre,f.cif||f.dni,f.dir,[f.cp,f.municipio].filter(Boolean).join(' '),f.provincia,f.telefono,f.email].filter(Boolean).join(' · ');
  return (
    <div style={S.overlay}>
      <div style={{...S.modal,maxWidth:560,maxHeight:'92%',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
        <div style={{...S.cabModal,display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <span style={{fontWeight:700,fontSize:15}}>🪪 Vivienda {vivienda.identificador} · {nombreObra(obra)}</span>
          <button onClick={()=>setDniVivienda(null)} style={{background:'none',border:'none',color:C.mt,cursor:'pointer',fontSize:18}}>✕</button>
        </div>
        <div style={{fontSize:10.5,color:C.mt,marginBottom:10,lineHeight:1.5}}>
          Datos y documentos de identidad de los titulares, para las altas de luz y agua. Las imágenes se traen de la custodia al abrir esta ventana y no quedan guardadas aquí.
        </div>
        {cargando&&<div style={{textAlign:'center',padding:24,color:C.mt}}>⏳ Buscando en la custodia…</div>}
        {!cargando&&titulares.length===0&&<div style={{textAlign:'center',padding:24,color:C.mt}}>Esta vivienda todavía no tiene titulares. Mándales el enlace para que rellenen sus datos.</div>}
        {!cargando&&titulares.map((t,k)=>(
          <div key={k} style={{...S.card,marginBottom:8}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <b style={{flex:1,fontSize:12.5}}>{t.ficha.nombre||'(sin ficha)'}</b>
              <span style={{fontSize:10,color:C.mt}}>{t.porcentaje}%{t.regimen?' · '+t.regimen:''}</span>
            </div>
            <div style={{fontSize:11,color:C.mt,lineHeight:1.6,wordBreak:'break-word'}}>{linea(t.ficha)||'sin datos'}</div>
            <div style={{display:'flex',gap:6,marginTop:6,flexWrap:'wrap'}}>
              <button style={S.sm(C.in)} onClick={()=>copiar(linea(t.ficha))}>📋 Copiar datos</button>
              {t.imgs.length===0&&<span style={{fontSize:10,color:C.wn,alignSelf:'center'}}>sin DNI subido</span>}
              {t.imgs.map(im=>(
                <button key={im.id} style={S.sm(C.vt)} onClick={()=>descargarDni(im,t.ficha)}>
                  🪪 {im.cara==='dniA'?'Anverso':'Reverso'}
                </button>
              ))}
            </div>
            {t.imgs.length>0&&(
              <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
                {t.imgs.map(im=>(
                  <div key={'v'+im.id} style={{flex:'1 1 45%',minWidth:0}}>
                    <img src={'data:image/jpeg;base64,'+im.b64} alt="" style={{width:'100%',borderRadius:8,border:`1px solid ${C.bd}`}}/>
                    {im.borrarAntesDe?<div style={{fontSize:9,color:C.mt,marginTop:2}}>se destruye antes del {fmtDate(new Date(im.borrarAntesDe).toISOString().slice(0,10))}</div>:null}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <div style={{display:'flex',gap:8,marginTop:4}}>
          <button style={S.ghost} onClick={()=>setDniVivienda(null)}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

// ═══ v372 · VENTANA DEL ENLACE ════════════════════════════════════════════
// Jesús (06-09-2026): «el enlace aparece en pantalla pero no se copia al
// portapapeles». En iPhone el navegador solo permite escribir en el
// portapapeles dentro del gesto que hizo el usuario; como el enlace tarda en
// crearse, el gesto ya terminó y la copia falla sin decir nada. Aquí el
// botón Copiar es un gesto NUEVO, así que funciona. Y si aun así fallara,
// el enlace está a la vista para seleccionarlo con el dedo.
const ModalEnlace=({enlaceModal,setEnlaceModal})=>{
  if(!enlaceModal)return null;
  const {titulo,enlace,nota}=enlaceModal;
  const copiar=async()=>{
    try{await navigator.clipboard.writeText(enlace);setEnlaceModal(m=>({...m,copiado:true}));}
    catch(e){
      // camino de respaldo para navegadores antiguos: seleccionar y copiar
      try{const i=document.getElementById('bh10-enlace-txt');i.focus();i.select();i.setSelectionRange(0,99999);
        document.execCommand('copy');setEnlaceModal(m=>({...m,copiado:true}));}
      catch(e2){setEnlaceModal(m=>({...m,copiado:false,fallo:true}));}
    }
  };
  const compartir=async()=>{
    try{await navigator.share({title:titulo,text:enlace});}
    catch(e){/* si lo cancela o no hay menú de compartir, no pasa nada */}
  };
  return (
    <div style={{...S.overlay,zIndex:CAPAS.ACCION}}>
      <div style={{...S.modal,maxWidth:460}} onClick={e=>e.stopPropagation()}>
        <div style={{...S.cabModal,display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <span style={{fontWeight:700,fontSize:14}}>{titulo}</span>
          <button onClick={()=>setEnlaceModal(null)} style={{background:'none',border:'none',color:C.mt,cursor:'pointer',fontSize:18}}>✕</button>
        </div>
        <input id="bh10-enlace-txt" readOnly value={enlace}
          onFocus={e=>{e.target.select();e.target.setSelectionRange(0,99999);}}
          style={{...S.input,fontFamily:'ui-monospace,monospace',fontSize:13,textAlign:'center',letterSpacing:'.02em'}}/>
        <div style={{fontSize:10.5,color:C.mt,margin:'8px 0 12px',lineHeight:1.5}}>
          {nota||''} Si el botón de copiar no funciona en tu móvil, toca el enlace de arriba: se selecciona entero y puedes copiarlo a mano.
        </div>
        {enlaceModal.copiado&&<div style={{fontSize:12,color:C.sc,fontWeight:700,marginBottom:8}}>✓ Copiado. Ya puedes pegarlo en WhatsApp o en un correo.</div>}
        {enlaceModal.fallo&&<div style={{fontSize:12,color:C.wn,marginBottom:8}}>Este navegador no deja copiar solo: selecciona el enlace de arriba y cópialo a mano.</div>}
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button style={{...S.btn(C.sc),flex:'1 1 120px'}} onClick={copiar}>📋 Copiar</button>
          {typeof navigator!=='undefined'&&navigator.share&&<button style={{...S.btn(C.in),flex:'1 1 120px'}} onClick={compartir}>📤 Compartir</button>}
          <button style={S.ghost} onClick={()=>setEnlaceModal(null)}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

// ═══ v375 · EL BUZÓN ══════════════════════════════════════════════════════
// Jesús (06-09-2026): «cómo ves crear una bandeja de notificaciones recibidas
// (llegarán contratos de arras, de reserva, info de clientes…)». Aquí está
// todo lo que ha llegado y espera algo de él, con el botón que lleva a donde
// ya se resuelve. Cada línea es un enlace, no una copia: la acción la hace la
// pantalla de siempre, con su lógica probada.
const ModalBuzon=({buzonAbierto,setBuzonAbierto,buzonTodo,docsVenta,viviendas,obras,nombreObra,
                   irAClientesRecibidos,irAProveedores,irADerechos,verDocVenta,marcarDocVisto,fmtDate})=>{
  if(!buzonAbierto)return null;
  const firmados=(docsVenta||[]).filter(d=>d&&d.estado==='firmado'&&!d.visto);
  const linea=(color,icono,titulo,detalle,accion,etiqueta,extra)=>(
    <div style={{...S.card,marginBottom:8,borderLeft:`3px solid ${color}`}}>
      <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
        <span style={{fontSize:18,lineHeight:1.2}}>{icono}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:12.5}}>{titulo}</div>
          <div style={{fontSize:10.5,color:C.mt,marginTop:2,lineHeight:1.5}}>{detalle}</div>
        </div>
      </div>
      <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
        <button style={{...S.sm(color),fontSize:11}} onClick={accion}>{etiqueta}</button>
        {extra}
      </div>
    </div>
  );
  return (
    <div style={S.overlay}>
      <div style={{...S.modal,maxWidth:520,maxHeight:'92%',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
        <div style={{...S.cabModal,display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <span style={{fontWeight:700,fontSize:15}}>📥 Buzón · {buzonTodo.total} pendiente{buzonTodo.total!==1?'s':''}</span>
          <button onClick={()=>setBuzonAbierto(false)} style={{background:'none',border:'none',color:C.mt,cursor:'pointer',fontSize:18}}>✕</button>
        </div>
        {buzonTodo.total===0&&<div style={{textAlign:'center',padding:28,color:C.mt,fontSize:12}}>Nada pendiente. Todo lo que llega —datos de clientes, contratos firmados, facturas de proveedores y peticiones de datos— aparece aquí.</div>}

        {firmados.map(d=>{
          const v=(viviendas||[]).find(x=>x.id===d.viviendaId);
          const o=(obras||[]).find(x=>String(x.id)===String(d.obraId));
          return <div key={d.id}>{linea(C.sc,d.tipo==='arras'?'🤝':'📝',
            `${d.tipo==='arras'?'Arras confirmatorias':'Contrato de reserva'} ${d.numero} · FIRMADO`,
            `${o?nombreObra(o):''}${v?' · vivienda '+v.identificador:''} · ${(d.firmas||[]).length} firma${(d.firmas||[]).length!==1?'s':''} · ${(d.firmas||[]).map(f=>f.nombre).join(', ')}`,
            ()=>{verDocVenta(d);},'📄 Ver el contrato',
            <button style={{...S.sm(C.mt),fontSize:11}} onClick={()=>marcarDocVisto(d)}>✓ Visto</button>)}</div>;
        })}

        {buzonTodo.clientes>0&&linea(C.in,'👤',
          `${buzonTodo.clientes} envío${buzonTodo.clientes!==1?'s':''} de datos de clientes`,
          'Rellenaron su enlace del portal: sus datos y su DNI esperan a que los apliques a la ficha y a su vivienda.',
          ()=>{setBuzonAbierto(false);irAClientesRecibidos();},'📥 Revisarlos')}

        {buzonTodo.proveedores>0&&linea(C.wn,'🏪',
          `${buzonTodo.proveedores} factura${buzonTodo.proveedores!==1?'s':''} enviada${buzonTodo.proveedores!==1?'s':''} por proveedores`,
          'Llegaron por bh10group.com/proveedores. Al revisarlas se abre el formulario con el documento ya adjunto, que se guarda igual que una foto o un escaneo.',
          ()=>{setBuzonAbierto(false);irAProveedores();},'📋 Revisarlas')}

        {buzonTodo.derechos>0&&linea(C.dn,'⚖️',
          `${buzonTodo.derechos} solicitud${buzonTodo.derechos!==1?'es':''} de derechos sin responder`,
          'Tienen plazo legal de un mes desde que llegaron. Se responden desde Clientes.',
          ()=>{setBuzonAbierto(false);irADerechos();},'⚖️ Atenderlas')}

        <div style={{fontSize:10,color:C.mt,marginTop:10,lineHeight:1.5}}>
          Este buzón solo lo ves tú. Nada se aplica solo: cada cosa la revisas y la confirmas donde siempre.
        </div>
        <div style={{display:'flex',gap:8,marginTop:10}}>
          <button style={S.ghost} onClick={()=>setBuzonAbierto(false)}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export {ModalTraspasos,ModalTraspasoNuevo,ModalFichaProveedor,ModalSepaNominas,ModalSepaC34,ModalRepartoNominas,ModalLoteEscaneo,ModalFicheroBanca,ModalExtractosN43,ModalVehiculo,ModalPoliza,ModalObra,ModalEmpleado,ModalConfirmarBorrado,ModalFormFactura,ModalPagoFactura,ModalSesionCerrada,ModalRecurrentesExtracto,ModalCompradores,ModalErratasComprador,ModalAprenderExtracto,ModalEnvioSinResumen,ModalConectarGmail,ModalCorreosGmail,ModalEmbargosSueldo,ModalCertificar,ModalNuevoPresupuesto,ModalOperacionFinanciera,ModalCustodiaDatos,ModalAvisoConfidencial,ModalDatosClientes,ModalMovilesCorreos,ModalListadoFinancieras,ModalFichaCliente,ModalComparacionCapas,ModalAnularVf,ModalPresupuestosObra,ModalDocVenta,ModalDniVivienda,ModalEnlace,ModalBuzon};
