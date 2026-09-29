// ═══ DOCUMENTOS · el HTML y el PDF de facturas y contratos ════════════════
// Extraído de app.jsx en v341, con red debajo: taller/bateria_generadores.mjs
// compara el HTML y el PDF que producen estas dos funciones BYTE A BYTE contra
// el bundle desplegado. Sin esa batería no se habrían tocado.
//
// Ninguna de las dos descarga nada: llaman a showDocPreview(html, nombre,
// makePdf), que abre el visor y deja el PDF sin construir. El fichero nace
// cuando el usuario pulsa «Compartir PDF».
//
// Las dependencias se INYECTAN en un objeto en vez de capturarlas del ámbito
// de App: así son verificables sin montar la aplicación. Los nombres y las
// firmas no cambian — en App quedan dos envoltorios de una línea y ni un solo
// sitio de llamada se ha tocado.

export const generateCertDoc=(cobro,{APP_VERSION,buildInvoicePdf,buildParties,compCfg,contratos,escXml,fmt,fmtDate,invoiceCSS,marcaDoc,notify,showDocPreview,vfBloqueFactura,vfDatosPdf,vfCfg,vfRegRef,vfRegistros})=>{
    const contrato=cobro.contratoId?contratos.find(c=>c.id===cobro.contratoId):null;
    const clienteCif=cobro._clienteCif||contrato?.clienteCif||cobro.proveedorCif||'';
    const clienteDir=cobro._clienteDir||contrato?.clienteDir||cobro.proveedorDir||'';
    // v360 · el registro VERI*FACTU de esta factura, para el HTML y para el PDF
    const regVf=(vfRegRef.current||vfRegistros||[]).find(r=>r&&r.tipoRegistro==='alta'&&r.facturaId===cobro.id);
    const isSP=cobro._sujetoPasivo||contrato?.sujetoPasivo||cobro.tipoIva===0;
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>FACTURA ${cobro.numFactura}</title>
    <style>${invoiceCSS}</style></head><body><div class="page">
      <div class="header">
        <div><div class="brand">${escXml(marcaDoc())}</div><div class="brand-accent">${compCfg.name||''}</div></div>
        <div class="doc-type"><h1>Factura</h1><div class="num">Nº ${cobro.numFactura}</div><div class="date">Fecha: ${fmtDate(cobro.fecha)}</div>
        ${contrato?'<div class="date">Contrato: '+contrato.numero+'</div>':''}
        ${cobro.fechaVencimiento?'<div class="date">Vencimiento: '+fmtDate(cobro.fechaVencimiento)+'</div>':''}</div>
      </div>
      ${buildParties(cobro, clienteCif, clienteDir)}
      <table>
        <thead><tr><th style="width:55%">Concepto</th><th class="r">Base imponible</th><th class="c">IVA</th><th class="r">Importe</th></tr></thead>
        <tbody>${(cobro.certDetalle&&cobro.certDetalle.length)
          ? cobro.certDetalle.map(l=>`<tr><td>${escXml(l.d||'')} <span style="color:#64748B">· avance ${l.prev}% → ${l.nuevo}%</span></td><td class="r">${fmt(+l.imp||0)} €</td><td class="c">${isSP?'ISP':(cobro.tipoIva||0)+'%'}</td><td class="r">${fmt(+l.imp||0)} €</td></tr>`).join('')
          : `<tr>
          <td>${escXml(cobro.concepto||'Servicios profesionales')}</td>
          <td class="r">${fmt(cobro.importeBase||0)} €</td>
          <td class="c">${isSP?'ISP':(cobro.tipoIva||0)+'%'}</td>
          <td class="r">${fmt((cobro.importeBase||0)+(isSP?0:(cobro.iva||0)))} €</td>
        </tr>`}</tbody>
      </table>
      <div class="totals"><div class="totals-box">
        <div class="totals-row"><span>Base imponible</span><strong>${fmt(cobro.importeBase)} €</strong></div>
        ${isSP?'':'<div class="totals-row"><span>IVA '+cobro.tipoIva+'%</span><strong>'+fmt(cobro.iva)+' €</strong></div>'}
        ${cobro.irpf>0?'<div class="totals-row"><span>Retención IRPF '+cobro.irpf+'%</span><strong>-'+fmt(cobro.retencion)+' €</strong></div>':''}
        <div class="totals-row total"><span>TOTAL FACTURA</span><span>${fmt(cobro.total)} €</span></div>${(cobro.retGarImp||0)>0?`
        <div class="totals-row" style="color:#7c3aed"><span>Retención de garantía (${cobro.retGarPct}%)</span><span>−${fmt(cobro.retGarImp)} €</span></div>
        <div class="totals-row total" style="border-top:1px solid #ccc"><span>LÍQUIDO A PERCIBIR</span><span>${fmt(cobro.total-cobro.retGarImp)} €</span></div>`:''}
      </div></div>
      ${isSP?'<div class="isp-notice"><strong>Inversión del sujeto pasivo</strong> — Operación no sujeta a IVA conforme al artículo 84.Uno.2.f) de la Ley 37/1992, del IVA. El destinatario es sujeto pasivo de la operación.</div>':''}
      ${compCfg.iban?'<div class="payment"><div class="payment-title">Datos de pago</div><div>Forma de pago: '+(cobro.formaPago||'Transferencia bancaria')+'</div><div class="payment-iban">IBAN: '+compCfg.iban+'</div>'+(compCfg.bic?'<div>BIC/SWIFT: '+compCfg.bic+'</div>':'')+'</div>':''}
      ${cobro.notas?'<div class="notes"><strong>Observaciones:</strong> '+cobro.notas+'</div>':''}
      <div class="footer">${escXml(compCfg.name||marcaDoc())}${compCfg.cif?' · CIF: '+compCfg.cif:''}${compCfg.regMercantil?' · '+compCfg.regMercantil:''} · BH10 ${APP_VERSION}</div>
      ${(()=>{
        // Bloque de verificación al pie, después del pie de empresa. Se arma en
        // una función aparte para poder comprobarlo.
        return regVf?vfBloqueFactura(regVf,vfCfg.entorno,vfCfg.detalleFactura||'completo'):'';
      })()}
    </div></body></html>`;
    const makePdf=()=>buildInvoicePdf({
      tipo:'FACTURA', numero:cobro.numFactura, fecha:fmtDate(cobro.fecha),
      vencimiento:cobro.fechaVencimiento?fmtDate(cobro.fechaVencimiento):'',
      vf:(regVf&&vfDatosPdf)?vfDatosPdf(regVf,vfCfg.entorno,vfCfg.detalleFactura||'completo'):null,
      contratoNum:contrato?.numero||'',
      emisor:{...compCfg,marca:marcaDoc()},
      receptor:{name:cobro.proveedor,cif:clienteCif,dir:clienteDir},
      obra:cobro.obra||'',
      items:[{desc:cobro.concepto||'Servicios profesionales',qty:'1',base:fmt(cobro.importeBase)+' \u20AC',imp:fmt(cobro.total)+' \u20AC'}],
      base:fmt(cobro.importeBase)+' \u20AC',
      ivaLabel:'IVA '+cobro.tipoIva+'%', ivaImp:isSP?'':fmt(cobro.iva)+' \u20AC',
      irpfLabel:cobro.irpf>0?'Retenci\u00F3n IRPF '+cobro.irpf+'%':'', irpfImp:cobro.irpf>0?fmt(cobro.retencion)+' \u20AC':'',
      total:fmt(cobro.total)+' \u20AC', isSP,
      iban:compCfg.iban||'', bic:compCfg.bic||'', formaPago:cobro.formaPago||'Transferencia bancaria',
      notas:cobro.notas||'',
      footer:(compCfg.name||'')+(compCfg.cif?' \u00B7 CIF: '+compCfg.cif:'')+(compCfg.regMercantil?' \u00B7 '+compCfg.regMercantil:'')+' \u00B7 BH10 '+APP_VERSION
    },(cobro.retGarImp||0)>0?{pct:cobro.retGarPct,imp:cobro.retGarImp,impStr:fmt(cobro.retGarImp)+' EUR',liqStr:fmt(cobro.total-cobro.retGarImp)+' EUR'}:null).buildBlob();
    showDocPreview(html, `FACTURA_${cobro.numFactura.replace(/\//g,'-')}`, makePdf);
    notify(`Factura ${cobro.numFactura} generada`);
  };

export const generateDoc=(contrato,{APP_VERSION,buildInvoicePdf,buildParties,calcContratoTotal,compCfg,escXml,fmt,fmtDate,invoiceCSS,marcaDoc,notify,showDocPreview})=>{
    const t=calcContratoTotal(contrato.items,contrato.sujetoPasivo);
    const tipoLabel=contrato.tipo==='presupuesto'?'PRESUPUESTO':'FACTURA';
    const isSP=contrato.sujetoPasivo;
    const itemsHtml=(contrato.items||[]).filter(it=>it.precio>0).map(it=>{
      const imp=(it.qty||0)*(it.precio||0);
      return `<tr><td>${it.desc||'—'}</td><td class="c">${it.qty}</td><td class="r">${fmt(it.precio||0)} €</td><td class="c">${isSP?'ISP':it.iva+'%'}</td><td class="r">${fmt(imp)} €</td></tr>`;
    }).join('');
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${tipoLabel} ${contrato.numero}</title>
    <style>${invoiceCSS}</style></head><body><div class="page">
      <div class="header">
        <div><div class="brand">${escXml(marcaDoc())}</div><div class="brand-accent">${compCfg.name||''}</div></div>
        <div class="doc-type"><h1>${tipoLabel}</h1><div class="num">Nº ${contrato.numero}</div><div class="date">Fecha: ${fmtDate(contrato.fecha)}</div><div class="date">Estado: ${contrato.estado}</div></div>
      </div>
      ${buildParties({proveedor:contrato.cliente,obra:contrato.obra}, contrato.clienteCif, contrato.clienteDir)}
      <table>
        <thead><tr><th style="width:40%">Descripción</th><th class="c">Uds.</th><th class="r">Precio ud.</th><th class="c">IVA</th><th class="r">Importe</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="totals"><div class="totals-box">
        <div class="totals-row"><span>Base imponible</span><strong>${fmt(t.base)} €</strong></div>
        ${isSP?'':'<div class="totals-row"><span>IVA</span><strong>'+fmt(t.iva)+' €</strong></div>'}
        <div class="totals-row total"><span>TOTAL</span><span>${fmt(t.total)} €</span></div>
      </div></div>
      ${isSP?'<div class="isp-notice"><strong>Inversión del sujeto pasivo</strong> — Operación no sujeta a IVA conforme al artículo 84.Uno.2.f) de la Ley 37/1992, del IVA.</div>':''}
      ${compCfg.iban?'<div class="payment"><div class="payment-title">Datos de pago</div><div>Forma de pago: Transferencia bancaria</div><div class="payment-iban">IBAN: '+compCfg.iban+'</div>'+(compCfg.bic?'<div>BIC/SWIFT: '+compCfg.bic+'</div>':'')+'</div>':''}
      ${contrato.notas?'<div class="notes"><strong>Observaciones:</strong> '+contrato.notas+'</div>':''}
      <div class="footer">${escXml(compCfg.name||marcaDoc())}${compCfg.cif?' · CIF: '+compCfg.cif:''}${compCfg.regMercantil?' · '+compCfg.regMercantil:''} · BH10 ${APP_VERSION}</div>
    </div></body></html>`;
    const makePdf=()=>buildInvoicePdf({
      tipo:tipoLabel, numero:contrato.numero, fecha:fmtDate(contrato.fecha), estado:contrato.estado,
      emisor:{...compCfg,marca:marcaDoc()},
      receptor:{name:contrato.cliente,cif:contrato.clienteCif||'',dir:contrato.clienteDir||''},
      obra:contrato.obra||'',
      items:contrato.items.filter(it=>it.precio>0).map(it=>({desc:it.desc||'-',qty:String(it.qty||1),base:fmt(it.precio||0)+' \u20AC',imp:fmt((it.qty||0)*(it.precio||0))+' \u20AC'})),
      base:fmt(t.base)+' \u20AC',
      ivaLabel:'IVA', ivaImp:contrato.sujetoPasivo?'':fmt(t.iva)+' \u20AC',
      total:fmt(t.total)+' \u20AC', isSP:contrato.sujetoPasivo,
      iban:compCfg.iban||'', bic:compCfg.bic||'', formaPago:'Transferencia bancaria',
      notas:contrato.notas||'',
      footer:(compCfg.name||'')+(compCfg.cif?' \u00B7 CIF: '+compCfg.cif:'')+(compCfg.regMercantil?' \u00B7 '+compCfg.regMercantil:'')+' \u00B7 BH10 '+APP_VERSION
    }).buildBlob();
    showDocPreview(html, `${tipoLabel}_${contrato.numero.replace(/\//g,'-')}`, makePdf);
    notify(`${tipoLabel} ${contrato.numero} generado`);
  };
