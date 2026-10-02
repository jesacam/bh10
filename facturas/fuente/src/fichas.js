// ═══ FICHAS · comparación, fusión de duplicados, contactos y dominios ═══
const GENERICOS_PROV=new Set(['SL','SA','SLU','SLL','SCP','CB','SC','SAU','GRUPO','CONSTRUCCIONES','CONSTRUCCION','HERMANOS','HNOS','HIJOS','SOCIEDAD','LIMITADA','ANONIMA','ESPANOLA','ESPANA','IBERICA','SERVICIOS','SUMINISTROS','MATERIALES','TECNICAS','ESPECIALES','COMERCIAL','INDUSTRIAL','TALLERES','ALMACENES','DISTRIBUCIONES','TRANSPORTES','OBRAS','REFORMAS','PROYECTOS','INSTALACIONES','MONTAJES','SISTEMAS','SOLUCIONES','GENERAL','NACIONAL','CENTRO','SUR','NORTE','ESTE','OESTE','DEL','LOS','LAS','SAN','SANTA']);

const tokensProv=(s)=>normTxtDup(s).replace(/[.,\-_/()]/g,' ').split(/\s+/).filter(t=>t.length>=3&&!GENERICOS_PROV.has(t));

const vacio=(v)=>v===undefined||v===null||String(v).trim()==='';

const today = new Date().toISOString().split('T')[0];

const provParecido=(a,b)=>{
  const na=normTxtDup(a), nb=normTxtDup(b);
  if(!na||!nb)return false;
  if(na===nb)return true;
  const ta=tokensProv(a), tb=tokensProv(b);
  if(!ta.length||!tb.length)return false;
  return ta.some(t=>tb.includes(t));
};

// ═══ Detección de facturas duplicadas: mismo proveedor + nº (fuerte) o mismo importe ±15 días (posible) ═══
const normTxtDup=(s)=>String(s||'').toUpperCase().replace(/\s+/g,' ').trim();

import {normTelefonoES} from './avisos';
import {normProvNombre} from './fichaje';
import {normNumFra} from './bancos';
const levDist=(a,b)=>{
  a=String(a==null?'':a); b=String(b==null?'':b);
  if(a===b)return 0;
  const m=a.length,n=b.length;if(!m)return n;if(!n)return m;
  let prev=Array.from({length:n+1},(_,j)=>j);
  for(let i=1;i<=m;i++){const cur=[i];
    for(let j=1;j<=n;j++)cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
    prev=cur;}
  return prev[n];
};

import {normIban,ibanOk,emailValido} from './embargos';
// Toda lista que llega de la nube pasa por aquí. Un solo elemento nulo —de una
// sincronización a medias, de una versión antigua o de un dato tocado a mano—
// tumbaba la app entera al pintar. Se filtra una vez, al cargar, en vez de
// comprobarlo en cada uno de los cientos de sitios donde se usa.
const _descartes=[];

const descartesDeCarga=()=>_descartes.slice();

// ═══ CUENTA NUEVA DE UN PROVEEDOR ═══
// El fraude más habitual en facturación es el cambio de cuenta: una factura
// con formato legítimo pero con un IBAN que no es del proveedor. Si el IBAN
// leído no coincide con NINGUNA de las cuentas que ya tenemos de ese
// proveedor (su ficha o sus facturas anteriores), se avisa en amarillo para
// verificarlo a mano. Puede ser una cuenta nueva de verdad, pero es lo raro.
const cuentaDesconocida=(iban,conocidas)=>{
  const n=normIban(iban);
  if(!n||!ibanOk(n))return null;                    // sin IBAN válido no hay qué comparar
  const lista=[...new Set((Array.isArray(conocidas)?conocidas:[])
    .map(x=>normIban(x)).filter(x=>x&&ibanOk(x)))];
  if(!lista.length)return null;                      // proveedor sin cuentas: nada que contrastar
  if(lista.includes(n))return null;                  // coincide con una conocida
  return {iban:n,conocidas:lista};
};

// ═══ DOMINIO DEL CORREO DEL PROVEEDOR ═══
// El fraude del cambio de cuenta suele entrar por un dominio PARECIDO al real
// (disetogar-sl.net en vez de disetogar.com). Se compara el dominio raíz.
const extraeDominio=(email)=>{
  const m=String(email||'').toLowerCase().match(/@([a-z0-9.\-]+)/);
  if(!m)return '';
  const p=m[1].split('.').filter(Boolean);
  return p.length<2?'':p.slice(-2).join('.');
};

const mejorRemitente=(froms,propios)=>{
  const cor=(propios&&propios.correos||[]).map(x=>String(x).toLowerCase());
  const dom=(propios&&propios.dominios||[]).map(x=>String(x).toLowerCase());
  const cuenta={};
  (Array.isArray(froms)?froms:[]).forEach(f=>{
    const m=String(f||'').match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
    if(!m)return;
    const email=m[0].toLowerCase();
    const d=extraeDominio(email);
    if(cor.includes(email)||dom.includes(d))return;
    cuenta[email]=(cuenta[email]||0)+1;
  });
  const mejor=Object.keys(cuenta).sort((a,b)=>cuenta[b]-cuenta[a])[0];
  return mejor?{email:mejor,dominio:extraeDominio(mejor)}:null;
};

const dominioSospechoso=(remitente,dominios)=>{
  const d=extraeDominio(remitente); if(!d)return null;
  const lista=[...new Set((Array.isArray(dominios)?dominios:[])
    .map(x=>String(x||'').includes('@')?extraeDominio(x):String(x||'').toLowerCase().trim())
    .map(x=>x.split('.').filter(Boolean).slice(-2).join('.')).filter(Boolean))];
  if(!lista.length)return null;
  return lista.includes(d)?null:{dominio:d,conocidos:lista};
};

// ── FUSIÓN DE FICHAS ──
// Un cliente ya dado de alta que rellena el formulario no debe machacar lo que
// ya tienes: puede que él ponga el móvil y tú tengas el fijo, o que se deje la
// provincia. Se comparan campo a campo y se decide, con la regla por defecto de
// «rellenar solo lo que falta»: nunca se pierde un dato por recibir otro.
const CAMPOS_FICHA=[
  ['nombre','Razón social'],['cif','CIF / NIF'],['dir','Domicilio'],['cp','CP'],
  ['municipio','Municipio'],['provincia','Provincia'],['email','Email'],
  ['telefono','Teléfono'],['contacto','Persona de contacto'],
  ['diasVenc','Días de cobro'],['retGarPct','Retención garantía %'],
  ['viviendaReservada','Vivienda reservada'],
  ['notariaNombre','Notaría'],['notariaEmail','Correo de la notaría'],
  ['notas','Notas'],
];

// Para cada campo: qué hay, qué llega, y si difieren de verdad
const compararFichas=(actual,entrante)=>{
  const a=actual||{}, b=entrante||{};
  return CAMPOS_FICHA.map(([k,etiq])=>{
    const va=a[k], vb=b[k];
    const mismo=String(va==null?'':va).trim()===String(vb==null?'':vb).trim();
    return {campo:k, etiqueta:etiq, actual:va, entrante:vb,
      estado: mismo?'igual' : vacio(va)?'nuevo' : vacio(vb)?'solo-actual' : 'distinto'};
  });
};

// La fusión por defecto: se completa lo que falta y se respeta lo que ya había.
// Lo que difiere se deja como está hasta que alguien decida, para que una
// fusión automática no cambie un dato bueno por otro peor.
const fusionar=(actual,entrante,elegidos)=>{
  const a={...(actual||{})}, b=entrante||{}, sel=elegidos||{};
  compararFichas(actual,entrante).forEach(({campo,estado})=>{
    if(sel[campo]==='entrante'){a[campo]=b[campo];return;}
    if(sel[campo]==='actual')return;
    if(estado==='nuevo')a[campo]=b[campo];      // estaba vacío: se rellena
  });
  // Los titulares y la autorización llegan enteros del envío: son suyos
  if(Array.isArray(b.titulares)&&b.titulares.length)a.titulares=b.titulares;
  // Se guarda diga lo que diga, no solo cuando autoriza: si en un envío nuevo
  // dice que NO, eso revoca lo anterior. Quedarse con el «sí» viejo significaría
  // seguir cediendo sus datos a bancos después de que los haya retirado.
  if(b.bancos&&typeof b.bancos==='object'){
    const antes=(a.bancos&&a.bancos.autoriza)?a.bancos:null;
    a.bancos=(!b.bancos.autoriza&&antes)
      ? {...b.bancos,revocadoEn:b.bancos.cuando||today,autorizabaDesde:antes.cuando||''}
      : b.bancos;
  }
  if(b.rgpd)a.rgpd=b.rgpd;
  return a;
};

const esDupFuerte=(d)=>!!d&&(d.motivo==='numero'||d.motivo==='importe-exacto');

const hallarDuplicada=(cand,lista,exceptoId)=>{
  if(!cand||typeof cand!=='object')return null;
  lista=(Array.isArray(lista)?lista:[]).filter(x=>x&&typeof x==='object');
  const prov=normTxtDup(cand.proveedor);
  const num=normNumFra(cand.numFactura);
  const tot=+((+cand.total)||0).toFixed(2);
  const f=cand.fecha?new Date(cand.fecha).getTime():null;
  let posible=null;
  for(const i of lista||[]){
    if(!i||i.id===exceptoId)continue;
    if((i.tipo==='cobro')!==(cand.tipo==='cobro'))continue;
    const provIgual=!!prov&&normTxtDup(i.proveedor)===prov;
    const provSimil=provIgual||provParecido(cand.proveedor,i.proveedor);
    const numOtro=normNumFra(i.numFactura);
    const mismoNum=!!num&&numOtro===num;
    // Dos facturas con número distinto son documentos distintos, por muy iguales
    // que sean el importe y la fecha: un proveedor puede emitir dos albaranes
    // del mismo material el mismo día. Solo se avisa; no se bloquea.
    const numsDistintos=!!num&&!!numOtro&&num!==numOtro;
    const mismoTot=tot>0&&Math.abs(((+i.total)||0)-tot)<0.011;
    const dias=(f&&i.fecha)?Math.abs(new Date(i.fecha).getTime()-f)/86400000:null;
    // ── Coincidencias FUERTES (bloquean el alta) ──
    if(provIgual&&mismoNum)return {inv:i,motivo:'numero'};
    if(mismoNum&&mismoTot)return {inv:i,motivo:'numero'};           // el nombre puede venir escrito distinto del Excel
    if(provSimil&&mismoTot&&dias!==null&&dias<=3&&!numsDistintos)return {inv:i,motivo:'importe-exacto'};
    // ── Coincidencias POSIBLES (avisan, no bloquean) ──
    if(!posible&&mismoTot&&dias!==null&&dias<=31){
      if(provSimil&&numsDistintos)posible={inv:i,motivo:'importe-num-distinto'};
      else if(provSimil)posible={inv:i,motivo:'importe'};
      else if(dias<=7)posible={inv:i,motivo:'importe-otro'};
    }
  }
  return posible;
};

const sugerirFusiones=(nombres,provCat,invoices)=>{
  nombres=Array.isArray(nombres)?nombres.filter(n=>typeof n==='string'):[];
  invoices=Array.isArray(invoices)?invoices.filter(x=>x&&typeof x==='object'):[];
  const nInv=(p)=>invoices.filter(i=>i.proveedor===p).length;
  const pts=(p)=>{const f=(Array.isArray(provCat)?provCat:[]).find(x=>x&&x.nombre===p)||{};let s=0;if(f.iban)s+=3;if(f.cif)s+=1.5;if(Object.keys(f).some(k=>f[k]))s+=1;
    if(/S\.?\s?L|SLU|S\.?\s?A/i.test(p))s+=1;s+=Math.min(nInv(p),50)*0.05;s+=p.length*0.01;return s;};
  const parejas=[];
  const ya=new Set();
  for(let i=0;i<nombres.length;i++)for(let j=i+1;j<nombres.length;j++){
    const A=nombres[i],B=nombres[j];
    const a=normProvNombre(A),b=normProvNombre(B);
    if(!a||!b)continue;
    let motivo='';
    if(a===b)motivo='mismo nombre';
    else{
      const tA=new Set(a.split(' ')),tB=new Set(b.split(' '));
      const chico=tA.size<=tB.size?tA:tB,grande=tA.size<=tB.size?tB:tA;
      const contenido=[...chico].every(t=>grande.has(t))&&[...chico].some(t=>t.length>=5);
      if(contenido)motivo='uno contiene al otro';
      else if(a.length>=5&&b.length>=5&&levDist(a,b)<=2)motivo='casi idénticos';
      else{const pA=a.split(' ')[0],pB=b.split(' ')[0];
        if(pA.length>=6&&pB.length>=6&&levDist(pA,pB)<=1)motivo='errata de un carácter';}
    }
    if(!motivo)continue;
    const clavePar=[A,B].sort().join('|');
    if(ya.has(clavePar))continue;ya.add(clavePar);
    const dest=pts(A)>=pts(B)?A:B, orig=dest===A?B:A;
    parejas.push({origen:orig,destino:dest,motivo,n:nInv(orig)});
  }
  return parejas.sort((x,y)=>y.n-x.n).slice(0,8);
};

// ── IMPORTAR CONTACTOS DE LA PLANTILLA ──
// Solo móvil y correo. La cuenta bancaria NO se toca aunque venga en el
// archivo: la de la ficha es la buena, y meter un IBAN equivocado significa
// mandarle el dinero a otra persona.
const parecidoNombre=(a,b)=>{
  const t=(s)=>normProvNombre(s).split(/\s+/).filter(x=>x.length>2);
  const A=t(a), B=t(b);
  if(!A.length||!B.length)return 0;
  let iguales=0, parecidos=0;
  A.forEach(x=>{
    if(B.includes(x)){iguales++;return;}
    // «SELLMAN» y «SELLAM», «MOHAMED» y «MOHAMMED»: mismo principio
    if(B.some(y=>(y.length>=4&&x.length>=4)&&(y.startsWith(x.slice(0,4))||x.startsWith(y.slice(0,4)))))parecidos++;
  });
  // Se mide sobre lo escrito, no sobre la ficha: si en el archivo pone solo
  // «Khalil» y en la plantilla está como «TAZI, KHALIL», eso es una pista muy
  // buena, no media. Aun así nunca se da por bueno solo: siempre se confirma.
  return (iguales+parecidos*0.6)/A.length;
};

const leerContactos=(filas,empleados)=>{
  const plantilla=(Array.isArray(empleados)?empleados:[]).filter(e=>e&&e.nombre);
  const out=[];
  (Array.isArray(filas)?filas:[]).forEach(f=>{
    const celdas=(Array.isArray(f)?f:Object.values(f||{})).map(c=>String(c==null?'':c).trim());
    if(!celdas.length)return;
    const nombre=celdas[0];
    if(!nombre||nombre.length<2)return;
    // El móvil y el correo se buscan por su forma, no por su columna: así da
    // igual el orden en que vengan y que falte alguno.
    let tel='', email='';
    celdas.slice(1).forEach(c=>{
      if(!email&&/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(c)){email=c;return;}
      const d=c.replace(/[^\d]/g,'');
      if(!tel&&d.length>=9&&d.length<=12&&!/^ES/i.test(c))tel=c;
    });
    if(!tel&&!email)return;
    // Exacto primero; si no, el más parecido, pero nunca se da por bueno solo
    const exacto=plantilla.find(e=>normProvNombre(e.nombre)===normProvNombre(nombre))
      ||plantilla.find(e=>{
        const a=normProvNombre(e.nombre).split(/\s+/).filter(Boolean).sort().join(' ');
        const b=normProvNombre(nombre).split(/\s+/).filter(Boolean).sort().join(' ');
        return a===b;
      });
    const candidatos=plantilla.map(e=>({id:e.id,nombre:e.nombre,p:parecidoNombre(nombre,e.nombre)}))
      .filter(c=>c.p>=0.3).sort((a,b)=>b.p-a.p).slice(0,4);
    out.push({nombre, telefono:normTelefonoES(tel)||tel, email,
      empleadoId: exacto?exacto.id:'', seguro:!!exacto, candidatos,
      telMal: !!tel&&!normTelefonoES(tel),
      emailMal: !!email&&!emailValido(email)});
  });
  return out;
};

// Qué cambia de verdad en cada ficha: lo que ya está igual no se toca
const cambiosContacto=(linea,empleados)=>{
  const e=(Array.isArray(empleados)?empleados:[]).find(x=>x&&x.id===(linea&&linea.empleadoId));
  if(!e)return null;
  const c=[];
  const tel=String(linea.telefono||'').trim();
  const em=String(linea.email||'').trim();
  if(tel&&normTelefonoES(tel)&&normTelefonoES(tel)!==normTelefonoES(e.telefono||''))
    c.push({campo:'telefono',etiqueta:'Móvil',antes:e.telefono||'',ahora:tel});
  if(em&&emailValido(em)&&em.toLowerCase()!==String(e.email||'').toLowerCase())
    c.push({campo:'email',etiqueta:'Correo',antes:e.email||'',ahora:em});
  return {empleado:e,cambios:c};
};
export {GENERICOS_PROV,tokensProv,vacio,today,provParecido,normTxtDup,levDist,_descartes,descartesDeCarga,cuentaDesconocida,extraeDominio,mejorRemitente,dominioSospechoso,CAMPOS_FICHA,compararFichas,fusionar,esDupFuerte,hallarDuplicada,sugerirFusiones,parecidoNombre,leerContactos,cambiosContacto};

// ═══ v376 · A QUÉ PROVEEDOR SE IMPUTA LO QUE LEE LA IA ═════════════════════
// Jesús (07-09-2026): «teniendo de alta el proveedor J MARTIN CARO, S.L. hay
// veces que crea un nuevo proveedor llamado J Martín Caro S.L … genera doble
// ficha, así pasa con otros que lo hace en minúscula, cuando hemos dicho que
// todo se registre con mayúscula».
// La comparación que hace falta ya existía (normProvNombre: quita tildes,
// puntuación y las formas societarias), pero el lector no la usaba. Aquí se
// usa: si lo leído coincide con uno ya dado de alta, se PROPONE ese, con su
// nombre exacto. Si no coincide con ninguno, se deja lo leído EN MAYÚSCULAS,
// que es como se registra todo.
export const proponerProveedor=(leido,provCat,invoices)=>{
  const bruto=String(leido||'').trim();
  if(!bruto)return {nombre:'',sugerido:null,motivo:''};
  const clave=normProvNombre(bruto);
  if(!clave)return {nombre:bruto.toLocaleUpperCase('es-ES'),sugerido:null,motivo:''};
  // Se buscan candidatos en el catálogo y, además, en los proveedores que ya
  // aparecen en facturas registradas: hay proveedores que existen de hecho
  // aunque nadie les haya creado ficha.
  const vistos=new Map();
  for(const p of (provCat||[])){
    const n=String(p&&p.nombre||'').trim(); if(!n)continue;
    const k=normProvNombre(n); if(k&&!vistos.has(k))vistos.set(k,{nombre:n,ficha:true});
  }
  for(const i of (invoices||[])){
    const n=String(i&&i.proveedor||'').trim(); if(!n)continue;
    const k=normProvNombre(n); if(k&&!vistos.has(k))vistos.set(k,{nombre:n,ficha:false});
  }
  const igual=vistos.get(clave);
  if(igual&&igual.nombre.trim()===bruto)return {nombre:bruto,sugerido:null,motivo:'ya coincide exactamente'};
  if(igual)return {nombre:bruto.toLocaleUpperCase('es-ES'),sugerido:igual.nombre,
    motivo:igual.ficha?'ya está dado de alta':'ya aparece en otras facturas'};
  return {nombre:bruto.toLocaleUpperCase('es-ES'),sugerido:null,motivo:''};
};

// ═══ v376 · UNA FICHA POR TITULAR ═════════════════════════════════════════
// Jesús (07-09-2026): «cuando un cliente da de alta sus datos e incorpora
// cotitulares, en vez de dar de alta los cotitulares mete los datos del
// segundo en la ficha del primero… y eso está mal porque mete dos móviles y
// dos emails en la misma casilla, en vez de crear una segunda ficha».
// Tenía razón: el camino del enlace CON vivienda ya creaba una ficha por
// titular, pero el enlace de cliente suelto solo creaba la del primero y
// dejaba al resto dentro de `titulares[]`, sin ficha propia y sin poder
// buscarlos, facturarles ni ponerlos en un contrato.
// Cada titular es una persona: cada uno su ficha, y todos apuntándose entre sí.
export const fichasDeEnvio=(envio,cliCat)=>{
  const r=envio||{};
  const lista=Array.isArray(r.titulares)?r.titulares.filter(t=>t&&String(t.nombre||'').trim()):[];
  const MAY=(x)=>String(x==null?'':x).toLocaleUpperCase('es-ES').trim();
  // Una empresa NO tiene cotitulares: es una sola ficha, con su CIF.
  if(r.esEmpresa||lista.length<=1){
    const base=lista[0]||{};
    const nom=MAY(r.nombre||base.nombre);
    if(!nom)return {cliCat:cliCat||[],creadas:[],actualizadas:[]};
    const antes=(cliCat||[]).find(x=>x&&normProvNombre(x.nombre)===normProvNombre(nom));
    const ficha={...antes,nombre:nom,cif:MAY(r.cif||base.nif||(antes&&antes.cif)||''),
      dir:MAY(r.dir||base.dir||''),cp:String(r.cp||base.cp||''),municipio:MAY(r.municipio||base.municipio||''),
      provincia:MAY(r.provincia||base.provincia||''),email:String(r.email||base.email||'').trim(),
      telefono:String(r.telefono||base.telefono||'').trim(),contacto:MAY(r.contacto||''),
      esEmpresa:!!r.esEmpresa,titulares:lista,rgpd:r.rgpd||null,bancos:r.bancos||(antes&&antes.bancos)||null,
      recibidoEn:r.recibidoEn||''};
    return {cliCat:[...(cliCat||[]).filter(x=>x&&normProvNombre(x.nombre)!==normProvNombre(nom)),ficha],
      creadas:antes?[]:[nom],actualizadas:antes?[nom]:[]};
  }
  // Varios titulares: una ficha por cabeza, con SUS datos, no los del primero.
  let cat=[...(cliCat||[])];
  const creadas=[],actualizadas=[];
  const nombres=lista.map(t=>MAY(t.nombre));
  lista.forEach((t,k)=>{
    const nom=MAY(t.nombre); if(!nom)return;
    const antes=cat.find(x=>x&&normProvNombre(x.nombre)===normProvNombre(nom));
    const ficha={...antes,nombre:nom,
      cif:MAY(t.nif||(antes&&antes.cif)||''),
      dir:MAY(t.dir||r.dir||''),cp:String(t.cp||r.cp||''),
      municipio:MAY(t.municipio||r.municipio||''),provincia:MAY(t.provincia||r.provincia||''),
      email:String(t.email||'').trim(),            // el SUYO, no el del primero
      telefono:String(t.telefono||'').trim(),      // el SUYO
      esEmpresa:false,
      // cada uno sabe con quién comparte: así se ven desde cualquiera de ellos
      titulares:lista,
      cotitulares:nombres.filter((_,i)=>i!==k),
      rgpd:k===0?(r.rgpd||null):(antes&&antes.rgpd)||null,
      bancos:r.bancos||(antes&&antes.bancos)||null,
      recibidoEn:r.recibidoEn||''};
    cat=[...cat.filter(x=>x&&normProvNombre(x.nombre)!==normProvNombre(nom)),ficha];
    (antes?actualizadas:creadas).push(nom);
  });
  return {cliCat:cat,creadas,actualizadas};
};
