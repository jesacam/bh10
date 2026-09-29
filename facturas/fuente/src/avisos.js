// ═══ AVISOS · WhatsApp, textos y condiciones de envío ═══
// Devuelve el teléfono en formato internacional (+34…) o '' si no es válido.
// WhatsApp exige el prefijo de país; sin él, el enlace no abre nada.
const normTelefonoES=(s)=>{
  let t=String(s||'').replace(/[^\d+]/g,'');
  if(t.startsWith('+34'))t=t.slice(3);
  else if(t.startsWith('0034'))t=t.slice(4);
  else if(t.startsWith('34')&&t.length===11)t=t.slice(2);
  t=t.replace(/\D/g,'');
  if(!/^[679]\d{8}$/.test(t))return '';
  return '+34'+t;
};

const esMovil=(s)=>/^\+34[67]/.test(normTelefonoES(s));

// ═══ AVISO POR WHATSAPP ═══
// El texto es editable porque cada empresa habla a su gente de una manera. Los
// huecos se rellenan con los datos de esa persona: si la plantilla se queda
// vacía o alguien borra los huecos, sigue saliendo un mensaje con sentido.
const AVISO_POR_DEFECTO='Hola {nombre}: te acabamos de enviar por correo tu nómina de {periodo}. Un saludo, {empresa}';

const construirAviso=(plantilla,fila,periodo,empresa)=>{
  const nombre=String((fila&&fila.nombre)||'').split(',').slice(-1)[0].trim()
    .toLocaleLowerCase('es').replace(/(^|[\s-])([a-záéíóúñü])/g,(m,a,b)=>a+b.toLocaleUpperCase('es'));
  const base=String(plantilla||'').trim()||AVISO_POR_DEFECTO;
  return base.replace(/\{nombre\}/g,nombre||'')
             .replace(/\{periodo\}/g,String(periodo||''))
             .replace(/\{empresa\}/g,String(empresa||''))
             .replace(/\s{2,}/g,' ').replace(/\s+([.,:;])/g,'$1').trim();
};

// wa.me abre el chat de ESE número: es la única forma de garantizar que el
// mensaje va a quien debe. A cambio no admite adjuntos, así que el aviso va
// sin la nómina; el documento viaja por correo.
const enlaceWhatsApp=(telefono,texto)=>{
  const tel=normTelefonoES(telefono);
  if(!tel)return '';
  return `https://wa.me/${tel.replace('+','')}?text=${encodeURIComponent(String(texto||''))}`;
};

const puedeAvisar=(fila)=>{
  if(!fila)return {ok:false,motivo:'sin datos'};
  if(!normTelefonoES(fila.telefono))return {ok:false,motivo:'no tiene un móvil válido en su ficha'};
  if(!esMovil(fila.telefono))return {ok:false,motivo:'ese número es un fijo: WhatsApp necesita un móvil'};
  return {ok:true,motivo:''};
};
export {normTelefonoES,esMovil,AVISO_POR_DEFECTO,construirAviso,enlaceWhatsApp,puedeAvisar};
