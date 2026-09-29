// ═══ VENTAS · CONTRATOS DE RESERVA Y ARRAS (v370, fase 2) ══════════════════
// Jesús (06-09-2026), literal: «la app toma los datos de la empresa que esté
// en uso como parte vendedora —a veces promotores, a veces constructores—;
// yo doy de alta la obra y sus casas, a cada reservista le mando su enlace
// para que rellene sus datos, y una vez incorporados yo pongo precio de venta
// y fechas (NO hay que poner fecha límite de entrega) por eso las arras no
// son penitenciales sino CONFIRMATORIAS; luego el cliente manda sus mejoras
// desde el configurador y todo se vuelca solo».
//
// Aquí vive lo que se puede probar sin pantalla: el motor de huecos, las dos
// plantillas, la composición de los datos desde las TRES fuentes (empresa en
// uso · titulares del portal · vivienda con sus mejoras) y las evidencias de
// la firma hecha con el dedo en el móvil del comprador.

import {parteVendedora,normalizaTitulares,totalMejoras,precioTotal,idCliente,papelesObra} from './ventas.js';   // con extensión: así el módulo se puede probar en node sin compilar

const r2=(n)=>Math.round((+n||0)*100)/100;
const U=(s)=>String(s==null?'':s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
// Importe en euros SIEMPRE con punto de millar: toLocaleString('es-ES') no
// agrupa los números de cuatro cifras (6200 → «6200,00»), y en un contrato
// firmado eso no puede salir así. Se agrupa a mano.
export const eur=(n)=>{
  const neg=(+n||0)<0;const x=Math.abs(r2(n)).toFixed(2).split('.');
  return (neg?'-':'')+x[0].replace(/\B(?=(\d{3})+(?!\d))/g,'.')+','+x[1];
};

// ── importes en letra (los contratos lo exigen: «… € (… euros)») ───────────
const UNI=['','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve','veinte','veintiuno','veintidós','veintitrés','veinticuatro','veinticinco','veintiséis','veintisiete','veintiocho','veintinueve'];
const DEC=['','','','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa'];
const CEN=['','ciento','doscientos','trescientos','cuatrocientos','quinientos','seiscientos','setecientos','ochocientos','novecientos'];
const centenas=(n)=>{
  if(n===0)return '';
  if(n===100)return 'cien';
  const c=Math.floor(n/100),d=n%100;
  const resto=d<30?UNI[d]:(DEC[Math.floor(d/10)]+(d%10?' y '+UNI[d%10]:''));
  return [CEN[c],resto].filter(Boolean).join(' ');
};
export const enLetra=(n)=>{
  const num=Math.floor(Math.abs(+n||0));
  const cent=Math.round((Math.abs(+n||0)-num)*100);
  if(num===0)return cent?`cero euros con ${centenas(cent)} céntimos`:'cero euros';
  const millones=Math.floor(num/1000000), miles=Math.floor((num%1000000)/1000), resto=num%1000;
  const partes=[];
  if(millones)partes.push(millones===1?'un millón':centenas(millones)+' millones');
  if(miles)partes.push(miles===1?'mil':centenas(miles)+' mil');
  if(resto)partes.push(centenas(resto));
  let t=partes.join(' ').replace(/uno mil/g,'un mil').trim();
  if(cent)t+=' con '+centenas(cent)+' céntimos';
  return t;
};

// ── motor de huecos (subconjunto de Mustache: variable, sección, inversa) ──
// Se hace aquí y no con una librería porque el contrato no puede depender de
// nada externo: si un día falla el CDN, no se puede quedar un comprador sin
// su contrato delante.
const valorDe=(ctx,ruta)=>{
  if(ruta==='.')return ctx&&ctx['.']!==undefined?ctx['.']:ctx;
  let v=ctx;
  for(const paso of String(ruta).split('.')){
    if(v==null)return undefined;
    v=v[paso];
  }
  return v;
};
const busca=(pila,ruta)=>{
  for(let i=pila.length-1;i>=0;i--){
    const v=valorDe(pila[i],ruta);
    if(v!==undefined)return v;
  }
  return undefined;
};
const vacio=(v)=>v===undefined||v===null||v===false||v===''||v===0||(Array.isArray(v)&&v.length===0);
export const render=(plantilla,datos)=>{
  const pila=[datos||{}];
  const paso=(txt)=>{
    let out='',i=0;
    for(;;){
      const a=txt.indexOf('{{',i);
      if(a<0){out+=txt.slice(i);break;}
      out+=txt.slice(i,a);
      const b=txt.indexOf('}}',a);
      if(b<0){out+=txt.slice(a);break;}
      const et=txt.slice(a+2,b).trim();
      if(et[0]==='#'||et[0]==='^'){
        const nombre=et.slice(1).trim();
        // buscar el cierre correspondiente respetando anidamiento
        let prof=1,k=b+2,fin=-1;
        while(k<txt.length){
          const s=txt.indexOf('{{',k);if(s<0)break;
          const e=txt.indexOf('}}',s);if(e<0)break;
          const in2=txt.slice(s+2,e).trim();
          if((in2[0]==='#'||in2[0]==='^')&&in2.slice(1).trim()===nombre)prof++;
          else if(in2[0]==='/'&&in2.slice(1).trim()===nombre){prof--;if(prof===0){fin=s;break;}}
          k=e+2;
        }
        if(fin<0){i=b+2;continue;}
        const cuerpo=txt.slice(b+2,fin);
        const cierre=txt.indexOf('}}',fin)+2;
        const v=busca(pila,nombre);
        if(et[0]==='^'){ if(vacio(v))out+=paso(cuerpo); }
        else if(Array.isArray(v)){
          for(const it of v){pila.push(typeof it==='object'&&it!==null?it:{'.':it});out+=paso(cuerpo);pila.pop();}
        }else if(!vacio(v)){
          pila.push(typeof v==='object'?v:{'.':v});out+=paso(cuerpo);pila.pop();
        }
        i=cierre;
      }else{
        const v=busca(pila,et);
        out+=(v===undefined||v===null||v===false)?'':String(v);
        i=b+2;
      }
    }
    return out;
  };
  // los huecos que queden sin dato se marcan para que se vean ANTES de firmar
  return paso(String(plantilla||''));
};

// Huecos sin rellenar: se listan para avisar en pantalla (nunca se firma un
// contrato con un «__________» dentro sin que Jesús lo haya visto).
export const PENDIENTE='__________';
export const huecosPendientes=(texto)=>{
  const m=String(texto||'').match(/__________/g);
  return m?m.length:0;
};

const oNo=(v)=>{const s=String(v==null?'':v).trim();return s||PENDIENTE;};

// ── composición de los datos desde las TRES fuentes ────────────────────────
// 1) empresa en uso (Ajustes → Datos empresa) → parte vendedora
// 2) titulares de la vivienda → fichas de cliente que llegaron por el portal
// 3) vivienda → identificador, tipología, superficies, precio y mejoras
export const datosDeVenta=({compCfg,obra,vivienda,cliCat,condiciones,hoy})=>{
  const c=condiciones||{};
  const v=vivienda||{};
  const o=obra||{};
  const vend=parteVendedora(compCfg,null);
  const papeles=papelesObra(o);
  // Vende → es PROMOTORA en el contrato. Si además construye, se hace constar:
  // es lo que da fuerza al compromiso de ejecución sin fecha límite de entrega.
  const rol=papeles.vende?'promotora':'constructora';
  const titulares=normalizaTitulares(v.titulares).map(t=>{
    const f=(cliCat||[]).find(x=>String(idCliente(x))===String(t.clienteId))||{};
    const doc=String(f.cif||f.dni||'').trim();
    return {
      nombre_completo:oNo(f.nombre),
      tipo_documento:/^[XYZ]?\d{7,8}[A-Z]$/i.test(doc.replace(/[^0-9A-Za-z]/g,''))?'DNI/NIE':'NIF',
      documento:oNo(doc),
      domicilio:oNo([f.dir,[f.cp,f.municipio].filter(Boolean).join(' '),f.provincia&&'('+f.provincia+')'].filter(Boolean).join(', ')),
      telefono:oNo(f.telefono),email:oNo(f.email),
      estado_civil:String(f.estadoCivil||'').trim(),
      regimen:String(t.regimen||'').trim(),
      porcentaje:r2(t.porcentaje),
    };
  });
  const mejoras=(v.mejoras||[]).map(m=>({concepto:m.concepto,importe:eur(m.importe),fecha:m.fecha||''}));
  const totMej=totalMejoras(v);
  const base=r2(+v.precio||0);
  const iva=+v.ivaTipo||10;
  const total=precioTotal(v);
  const conIva=r2(total*(1+iva/100));
  const calendario=(c.calendario||[]).map(p=>({
    concepto:p.concepto,importe:eur(p.importe),porcentaje:p.porcentaje!=null?r2(p.porcentaje):'',
    fecha_o_hito:p.fechaOHito||'',pagado:p.pagado||null,
  }));
  return {
    lugar_firma:oNo(c.lugarFirma||compCfg&&compCfg.city),
    fecha_firma_larga:fechaLarga(c.fechaFirma||hoy),
    rol, es_promotora:papeles.vende, es_constructora:papeles.construye,
    promueve_y_construye:!!(papeles.vende&&papeles.construye),
    // el encabezado de la parte vendedora cambia con el papel de la obra
    parte_vendedora_titulo:rol==='promotora'?'PROMOTORA':'VENDEDORA',
    promotora:{
      razon_social:oNo(vend.razon_social),cif:oNo(vend.cif),domicilio:oNo(vend.domicilio),
      registro:oNo(vend.registro),
      representante:{nombre:oNo(vend.representante&&vend.representante.nombre),
        dni:oNo(vend.representante&&vend.representante.dni),
        cargo:String((vend.representante&&vend.representante.cargo)||'administrador')},
      email_rgpd:oNo(vend.email_rgpd),
    },
    titulares, varios_titulares:titulares.length>1,
    obra:{
      nombre:oNo(o.alias||o.nombre),
      direccion:oNo([o.calle,o.numero].filter(Boolean).join(' ')),
      municipio:oNo(o.municipio),provincia:oNo(o.provincia),
      descripcion:String(o.tipologia||'').trim()||oNo(''),
      licencia:oNo(c.licencia),licencia_fecha:oNo(c.licenciaFecha),
    },
    vivienda:{
      identificador:oNo(v.identificador),tipologia:String(v.tipologia||'').trim(),
      superficie_construida:v.superficieConstruida?eur(v.superficieConstruida):'',
      superficie_util:v.superficieUtil?eur(v.superficieUtil):'',
      superficie_parcela:v.superficieParcela?eur(v.superficieParcela):'',
      anejos:String(v.anejos||'').trim(),
    },
    finca:{registro:oNo(c.fincaRegistro),tomo:oNo(c.fincaTomo),libro:oNo(c.fincaLibro),
      folio:oNo(c.fincaFolio),numero:oNo(c.fincaNumero),catastral:oNo(c.fincaCatastral)},
    precio:{importe:eur(base),importe_letras:enLetra(base),iva_tipo:iva,
      total_con_iva:eur(conIva),total_con_mejoras:eur(total),
      incluye:String(c.precioIncluye||'').trim()||oNo(''),no_incluye:String(c.precioNoIncluye||'').trim()},
    mejoras,mejoras_total:eur(totMej),hay_mejoras:mejoras.length>0,
    reserva:{
      existe:!!c.reservaFecha,fecha:c.reservaFecha||'',
      importe:eur(c.reservaImporte),importe_letras:enLetra(c.reservaImporte),
      forma_pago:String(c.reservaFormaPago||'transferencia bancaria'),
      cuenta:oNo(c.cuenta),plazo_dias:c.reservaPlazoDias||30,
      fecha_limite:oNo(c.reservaFechaLimite),
    },
    arras:{importe:eur(c.arrasImporte),importe_letras:enLetra(c.arrasImporte)},
    garantia:{tipo:oNo(c.garantiaTipo),entidad:oNo(c.garantiaEntidad),numero:String(c.garantiaNumero||''),
      cuenta_especial:oNo(c.cuentaEspecial),entidad_cuenta:oNo(c.garantiaEntidadCuenta)},
    calendario,hay_calendario:calendario.length>0,
    notaria:{localidad:oNo(c.notariaLocalidad),designa:String(c.notariaDesigna||'la parte compradora')},
    gastos:{reparto:String(c.gastosReparto||'cada parte asumirá los que legalmente le correspondan')},
    incumplimiento:{dias_gracia:c.diasGracia||15},
    rgpd:{plazo_dni:String(c.plazoDni||'una vez otorgada la escritura y realizadas las altas de suministros')},
  };
};

const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
export const fechaLarga=(iso)=>{
  const s=String(iso||'');const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if(!m)return oNo(s);
  return `${+m[3]} de ${MESES[+m[2]-1]} de ${m[1]}`;
};

// ── numeración propia, separada de presupuestos y facturas ────────────────
// R26/0001 para reservas, A26/0001 para arras: nunca tocan la serie fiscal
// AAnnnnn ni la cadena VERI*FACTU (estos documentos no son facturas).
export const numeroDocVenta=(docs,tipo,anio)=>{
  const pre=(tipo==='arras'?'A':'R')+String(anio||new Date().getFullYear()).slice(2);
  const usados=new Set((docs||[]).filter(d=>d&&d.tipo===tipo).map(d=>String(d.numero||'')));
  let n=1;while(usados.has(`${pre}/${String(n).padStart(4,'0')}`))n++;
  return `${pre}/${String(n).padStart(4,'0')}`;
};

// ── evidencias de la firma hecha con el dedo en el móvil del comprador ────
// Firma simple con prueba: quién, cuándo, desde dónde y sobre QUÉ texto (la
// huella sella el contenido: si alguien cambiara una coma, la huella canta).
export const huellaTexto=async(texto)=>{
  const bytes=new TextEncoder().encode(String(texto||''));
  const h=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,'0')).join('');
};
export const nuevaFirma=({clienteId,nombre,trazo,ip,cuando,huella,agente})=>({
  id:'fi'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),
  clienteId:String(clienteId||''),nombre:String(nombre||''),
  trazo:String(trazo||''),                 // PNG en dataURL del canvas del móvil
  ip:String(ip||''),cuando:String(cuando||''),huella:String(huella||''),
  agente:String(agente||'').slice(0,180),
});
// ¿está el documento firmado por TODOS los titulares? (no vale con uno)
export const firmasCompletas=(doc,vivienda)=>{
  const necesarios=(vivienda&&vivienda.titulares||[]).map(t=>String(t.clienteId));
  if(!necesarios.length)return false;
  const hechas=new Set(((doc&&doc.firmas)||[]).map(f=>String(f.clienteId)));
  return necesarios.every(id=>hechas.has(id));
};
// Una firma solo vale si sella EXACTAMENTE el texto que se enseñó al firmante
export const firmaValida=(doc,firma)=>!!(doc&&firma&&firma.huella&&doc.huella&&firma.huella===doc.huella&&firma.trazo&&/^data:image\/(png|jpeg);base64,/.test(firma.trazo));

export const textoEvidencias=(doc)=>((doc&&doc.firmas)||[]).map(f=>
  `${f.nombre} · firmado el ${f.cuando}${f.ip?' desde '+f.ip:''} · huella del documento ${String(f.huella||'').slice(0,16)}…`).join('\n');

export const TIPOS_DOCVENTA=[['reserva','Contrato de reserva'],['arras','Compraventa con arras confirmatorias']];

export const nuevoDocVenta=({tipo,numero,obraId,viviendaId,texto,huella,condiciones,fecha})=>({
  id:'dv'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),
  tipo:tipo==='arras'?'arras':'reserva',numero:String(numero||''),
  obraId:String(obraId||''),viviendaId:String(viviendaId||''),
  fecha:String(fecha||''),texto:String(texto||''),huella:String(huella||''),
  condiciones:condiciones||{},firmas:[],estado:'borrador',   // borrador → enviado → firmado
});

// ═══ PLANTILLAS ════════════════════════════════════════════════════════════
// Redactadas el 06-09-2026 y ajustadas a lo que Jesús pidió: arras
// CONFIRMATORIAS (art. 1124 CC: no hay derecho a desistir pagando; se puede
// exigir el cumplimiento) y SIN fecha límite de entrega. Son modelos de
// trabajo: que los revise vuestro abogado antes del primer uso.
export const PLANTILLA_RESERVA=`CONTRATO DE RESERVA DE VIVIENDA
Nº {{numero}}

En {{lugar_firma}}, a {{fecha_firma_larga}}.

REUNIDOS

De una parte, como {{parte_vendedora_titulo}}: {{promotora.razon_social}}, con CIF {{promotora.cif}} y domicilio en {{promotora.domicilio}}, representada por D./Dña. {{promotora.representante.nombre}}, con DNI {{promotora.representante.dni}}, en calidad de {{promotora.representante.cargo}}.

De otra parte, como RESERVANTE(S):
{{#titulares}}— {{nombre_completo}}, mayor de edad, con {{tipo_documento}} {{documento}}, domicilio en {{domicilio}}, teléfono {{telefono}} y correo electrónico {{email}}{{#estado_civil}}, de estado civil {{estado_civil}}{{#regimen}} ({{regimen}}){{/regimen}}{{/estado_civil}}, con una participación del {{porcentaje}} %.
{{/titulares}}
Las partes se reconocen capacidad legal suficiente para otorgar el presente contrato y

EXPONEN

I. Que la {{parte_vendedora_titulo}} promueve en {{obra.direccion}}, término municipal de {{obra.municipio}} ({{obra.provincia}}), la promoción denominada {{obra.nombre}}{{#obra.descripcion}} ({{obra.descripcion}}){{/obra.descripcion}}, en adelante la PROMOCIÓN{{#promueve_y_construye}} La {{parte_vendedora_titulo}} ejecuta asimismo las obras con sus propios medios, en calidad de constructora.{{/promueve_y_construye}}

II. Que dentro de la PROMOCIÓN se encuentra la vivienda identificada como {{vivienda.identificador}}{{#vivienda.tipologia}}, {{vivienda.tipologia}}{{/vivienda.tipologia}}{{#vivienda.anejos}}, con {{vivienda.anejos}}{{/vivienda.anejos}}, en adelante la VIVIENDA.

III. Que el/los RESERVANTE(S) está(n) interesado(s) en su adquisición y la {{parte_vendedora_titulo}} en su venta, por lo que convienen formalizar la presente RESERVA con arreglo a las siguientes

ESTIPULACIONES

PRIMERA. Objeto. La {{parte_vendedora_titulo}} se compromete a retirar la VIVIENDA de la venta y a no ofrecerla a terceros durante la vigencia de esta reserva, y el/los RESERVANTE(S) a formalizar en dicho plazo el contrato privado de compraventa con arras confirmatorias.

SEGUNDA. Precio. El precio de venta de la VIVIENDA queda fijado en {{precio.importe}} € ({{precio.importe_letras}}), más el IVA al tipo legal vigente en el momento de cada pago (actualmente {{precio.iva_tipo}} %), lo que supone un total estimado de {{precio.total_con_iva}} €.{{#precio.incluye}} El precio incluye {{precio.incluye}}.{{/precio.incluye}}{{#precio.no_incluye}} No incluye {{precio.no_incluye}}.{{/precio.no_incluye}}

TERCERA. Importe de la reserva. El/los RESERVANTE(S) entrega(n) en este acto la cantidad de {{reserva.importe}} € ({{reserva.importe_letras}}) mediante {{reserva.forma_pago}} a la cuenta {{reserva.cuenta}}, sirviendo el presente documento como recibo. Dicha cantidad se imputará a cuenta del precio en el momento de la firma del contrato de arras.

CUARTA. Plazo. La reserva tendrá una vigencia de {{reserva.plazo_dias}} días naturales desde su firma, hasta el {{reserva.fecha_limite}}, fecha límite para la firma del contrato de compraventa con arras.

QUINTA. Efectos del desistimiento. Si el/los RESERVANTE(S) desiste(n) o no comparece(n) a la firma del contrato de arras en plazo, la {{parte_vendedora_titulo}} hará suya la cantidad entregada en concepto de indemnización por la retirada de la VIVIENDA del mercado. Si es la {{parte_vendedora_titulo}} quien desiste, devolverá íntegramente el importe de la reserva.

SEXTA. Condiciones de la futura compraventa. El contrato de compraventa se formalizará conforme al modelo de la {{parte_vendedora_titulo}} e incluirá el precio de la estipulación SEGUNDA, el calendario de pagos, las garantías legales sobre las cantidades entregadas a cuenta y las arras confirmatorias.

SÉPTIMA. Mejoras y personalización. {{#hay_mejoras}}Las mejoras seleccionadas por el/los RESERVANTE(S) en el configurador de la {{parte_vendedora_titulo}} se relacionan en el Anexo II, con su precio individualizado, y se incorporarán al contrato de arras.{{/hay_mejoras}}{{^hay_mejoras}}El/los RESERVANTE(S) podrá(n) seleccionar mejoras y opciones de personalización a través del configurador de la {{parte_vendedora_titulo}}; se incorporarán al contrato de arras con su precio individualizado.{{/hay_mejoras}} Cualquier modificación posterior deberá acordarse por escrito.

OCTAVA. Protección de datos. Los datos personales facilitados se tratan por {{promotora.razon_social}} con la finalidad de gestionar la reserva y la posterior compraventa, sobre la base de la ejecución del contrato, y se conservarán durante la relación contractual y los plazos legales de prescripción. Podrán comunicarse a la notaría, la entidad de garantía, la entidad financiera y las compañías suministradoras cuando sea necesario para la operación. Derechos de acceso, rectificación, supresión, limitación, portabilidad y oposición: {{promotora.email_rgpd}}.

NOVENA. Comunicaciones, legislación y fuero. Las comunicaciones se harán por escrito a los domicilios y correos indicados; las partes aceptan la validez de las realizadas a través del portal de clientes de la {{parte_vendedora_titulo}}. El contrato se rige por la legislación española y las partes se someten a los Juzgados y Tribunales del domicilio del consumidor.

Y en prueba de conformidad, las partes firman el presente contrato por duplicado y a un solo efecto.

Por la {{parte_vendedora_titulo}}: {{promotora.representante.nombre}}
{{#titulares}}
{{nombre_completo}} ({{documento}})
{{/titulares}}
{{#hay_mejoras}}
ANEXO II — MEJORAS Y PERSONALIZACIÓN
{{#mejoras}}— {{concepto}}: {{importe}} €
{{/mejoras}}Total mejoras: {{mejoras_total}} €
{{/hay_mejoras}}`;

export const PLANTILLA_ARRAS=`CONTRATO PRIVADO DE COMPRAVENTA DE VIVIENDA CON ARRAS CONFIRMATORIAS
Nº {{numero}}

En {{lugar_firma}}, a {{fecha_firma_larga}}.

REUNIDOS

De una parte, como VENDEDORA: {{promotora.razon_social}}, con CIF {{promotora.cif}} y domicilio en {{promotora.domicilio}}, representada por D./Dña. {{promotora.representante.nombre}}, con DNI {{promotora.representante.dni}}, en calidad de {{promotora.representante.cargo}}.

De otra parte, como COMPRADOR(ES):
{{#titulares}}— {{nombre_completo}}, mayor de edad, con {{tipo_documento}} {{documento}}, domicilio en {{domicilio}}, teléfono {{telefono}} y correo electrónico {{email}}{{#estado_civil}}, de estado civil {{estado_civil}}{{#regimen}} ({{regimen}}){{/regimen}}{{/estado_civil}}, que adquiere una participación indivisa del {{porcentaje}} %.
{{/titulares}}
Las partes se reconocen capacidad legal suficiente y

EXPONEN

I. Que la VENDEDORA promueve{{#promueve_y_construye}} y ejecuta con sus propios medios, en calidad de constructora,{{/promueve_y_construye}} en {{obra.direccion}}, {{obra.municipio}} ({{obra.provincia}}), la promoción {{obra.nombre}}, sobre la finca inscrita en el Registro de la Propiedad de {{finca.registro}}, tomo {{finca.tomo}}, libro {{finca.libro}}, folio {{finca.folio}}, finca nº {{finca.numero}}, referencia catastral {{finca.catastral}}.

II. Que forma parte de dicha promoción la vivienda {{vivienda.identificador}}{{#vivienda.tipologia}}, {{vivienda.tipologia}}{{/vivienda.tipologia}}{{#vivienda.anejos}}, con {{vivienda.anejos}}{{/vivienda.anejos}}, en adelante la VIVIENDA, con la cuota de participación en elementos comunes que le corresponda en la división horizontal.

III. Que {{#reserva.existe}}el/los COMPRADOR(ES) suscribió/suscribieron contrato de reserva de fecha {{reserva.fecha}}, entregando {{reserva.importe}} €, cantidad que se imputa al precio, y que {{/reserva.existe}}ambas partes desean formalizar la compraventa con arreglo a las siguientes

ESTIPULACIONES

PRIMERA. Objeto. La VENDEDORA vende y el/los COMPRADOR(ES) compra(n) la VIVIENDA descrita, libre de cargas, gravámenes y arrendatarios, y al corriente de pago de tributos y gastos.

SEGUNDA. Precio. El precio es de {{precio.importe}} € ({{precio.importe_letras}}), más el IVA al tipo legal vigente en cada pago (actualmente {{precio.iva_tipo}} %), total estimado {{precio.total_con_iva}} €.{{#hay_mejoras}} A dicho precio se añade el importe de las mejoras del Anexo II, {{mejoras_total}} € más IVA, resultando un precio total de {{precio.total_con_mejoras}} € más IVA.{{/hay_mejoras}}

TERCERA. Forma y calendario de pago.{{#hay_calendario}}
{{#calendario}}— {{concepto}}: {{importe}} €{{#porcentaje}} ({{porcentaje}} %){{/porcentaje}}{{#fecha_o_hito}} — {{fecha_o_hito}}{{/fecha_o_hito}}
{{/calendario}}{{/hay_calendario}}{{^hay_calendario}} El precio se satisfará conforme al calendario que las partes acuerden por escrito y que se incorporará como anexo.{{/hay_calendario}}
Todos los pagos anteriores a la entrega se harán mediante transferencia a la cuenta especial {{garantia.cuenta_especial}} de {{garantia.entidad_cuenta}}. La VENDEDORA emitirá factura de cada cantidad recibida. El resto del precio se abonará en el acto de otorgamiento de la escritura pública.

CUARTA. Garantía de las cantidades anticipadas. Conforme a la disposición adicional primera de la Ley 20/2015, de 14 de julio, las cantidades entregadas a cuenta del precio con anterioridad a la entrega quedan garantizadas mediante {{garantia.tipo}} otorgado por {{garantia.entidad}}{{#garantia.numero}}, nº {{garantia.numero}}{{/garantia.numero}}, que responderá de su devolución más los intereses legales en caso de que la construcción no se inicie o no llegue a buen fin. Se entrega al/los COMPRADOR(ES) copia del documento individual de garantía.

QUINTA. Terminación y entrega. La VENDEDORA se obliga a terminar la VIVIENDA y a obtener la licencia de primera ocupación, comunicándolo fehacientemente al/los COMPRADOR(ES). La entrega se hará con el otorgamiento de la escritura pública, libre de ocupantes y con los suministros dados de alta o en condiciones de darlos de alta. Las partes hacen constar expresamente que no se fija fecha límite de entrega, sin perjuicio de la obligación de la VENDEDORA de ejecutar la obra con la diligencia debida.

SEXTA. Escritura pública. La escritura se otorgará ante el Notario de {{notaria.localidad}} que designe {{notaria.designa}}, dentro de los treinta días siguientes a la comunicación de la obtención de la licencia de primera ocupación. Los gastos e impuestos se distribuirán así: {{gastos.reparto}}.

SÉPTIMA. Arras confirmatorias. Las cantidades entregadas hasta la fecha, y en particular la de {{arras.importe}} € ({{arras.importe_letras}}), se entregan y reciben en concepto de ARRAS CONFIRMATORIAS, como señal y parte del precio y en prueba de la perfección del contrato. En consecuencia, y a diferencia de las arras penitenciales del artículo 1454 del Código Civil, NINGUNA de las partes podrá desistir de la compraventa perdiendo la señal o devolviéndola duplicada: ambas quedan obligadas a su cumplimiento, y ante el incumplimiento de una de ellas la otra podrá exigir el cumplimiento forzoso o la resolución del contrato, con resarcimiento de daños y abono de intereses, conforme al artículo 1124 del Código Civil.

OCTAVA. Incumplimiento. El impago de cualquiera de los plazos por más de {{incumplimiento.dias_gracia}} días desde su vencimiento, previo requerimiento fehaciente, facultará a la VENDEDORA para instar la resolución del contrato con los efectos de la estipulación SÉPTIMA, o para exigir su cumplimiento. Las cantidades a devolver en caso de resolución lo serán conforme a la garantía de la estipulación CUARTA.

NOVENA. Mejoras y personalización. {{#hay_mejoras}}Las mejoras seleccionadas por el/los COMPRADOR(ES) en el configurador constan en el Anexo II con su precio.{{/hay_mejoras}}{{^hay_mejoras}}El/los COMPRADOR(ES) podrá(n) seleccionar mejoras a través del configurador de la VENDEDORA; se incorporarán como anexo con su precio.{{/hay_mejoras}} No se admitirán modificaciones que afecten a estructura, fachadas, instalaciones comunes o a la licencia de obras.

DÉCIMA. Cotitularidad. {{#varios_titulares}}Los COMPRADORES adquieren la VIVIENDA en las participaciones indicadas en el encabezamiento, respondiendo solidariamente frente a la VENDEDORA de las obligaciones de este contrato. Las comunicaciones dirigidas a cualquiera de ellos se entenderán hechas a todos.{{/varios_titulares}}{{^varios_titulares}}La VIVIENDA se adquiere por un único comprador.{{/varios_titulares}}

UNDÉCIMA. Protección de datos. Los datos personales, incluidas las copias de los documentos de identidad, se tratan por {{promotora.razon_social}} para la ejecución de este contrato, la preparación de la escritura y las altas de suministros, y se comunicarán a la notaría, la entidad de garantía, la entidad financiera y las compañías suministradoras cuando sea necesario. Los documentos de identidad se destruirán {{rgpd.plazo_dni}}. Derechos: {{promotora.email_rgpd}}.

DUODÉCIMA. Comunicaciones, legislación y fuero. Las comunicaciones se harán por escrito a los domicilios y correos del encabezamiento; las partes aceptan la validez de las realizadas a través del portal de clientes de la VENDEDORA. Este contrato se rige por la legislación española. Las partes se someten a los Juzgados y Tribunales del domicilio del consumidor.

Y en prueba de conformidad, firman por duplicado y a un solo efecto.

Por la VENDEDORA: {{promotora.representante.nombre}}
{{#titulares}}
{{nombre_completo}} ({{documento}})
{{/titulares}}
{{#hay_mejoras}}
ANEXO II — MEJORAS Y PERSONALIZACIÓN
{{#mejoras}}— {{concepto}}: {{importe}} €
{{/mejoras}}Total mejoras: {{mejoras_total}} €
{{/hay_mejoras}}`;

export const PLANTILLAS={reserva:PLANTILLA_RESERVA,arras:PLANTILLA_ARRAS};
// El texto que se enseña al firmante es EXACTAMENTE el que se sella y guarda.
export const componerContrato=({tipo,numero,compCfg,obra,vivienda,cliCat,condiciones,hoy})=>{
  const datos={...datosDeVenta({compCfg,obra,vivienda,cliCat,condiciones,hoy}),numero:String(numero||'')};
  const texto=render(PLANTILLAS[tipo==='arras'?'arras':'reserva'],datos);
  return {texto,datos,pendientes:huecosPendientes(texto)};
};
