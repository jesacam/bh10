// ═══ IA · precios, coste estimado, saneado de resúmenes ═══
// De una lista de cabeceras From, el remitente que más se repite,
// descartando los correos propios de la empresa (que salen en respuestas)
// ═══ PROMOCIONES: configuraciones del configurador de la web ═══
// Los compradores de la promotora NO son clientes de BH10: viven solo dentro
// del contrato de su promoción. Cada envío del configurador es una versión.
// Fusiona lo llegado de la bandeja con lo ya archivado. Las LÁPIDAS
// ({borrado:true}) impiden que un envío borrado a mano vuelva a colarse.
// Filas del Excel de la promoción: hoja de viviendas (última versión de cada
// una) y hoja de historial (todas las versiones), listas para el libro
// Del resumen HTML a líneas de texto plano (para el PDF): fuera etiquetas,
// entidades decodificadas, y solo caracteres que la letra del PDF conoce
const textoDeResumen=(html)=>{
  let t=String(html||'');
  t=t.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'');
  t=t.replace(/<(h\d|p|div|tr|li|br)[^>]*>/gi,'\n').replace(/<td[^>]*>/gi,'  ').replace(/<[^>]+>/g,'');
  t=t.replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
  t=t.replace(/[^\x20-\x7EáéíóúÁÉÍÓÚñÑüÜçÇ€ºª·¡¿\u2013\u2014«»\n]/g,'');
  return t.split('\n').map(x=>x.replace(/\s+/g,' ').trim()).filter((x,ix,arr)=>x||arr[ix-1]);
};

// El resumen llega en HTML del propio configurador (misma casa), pero se
// limpia igual: fuera scripts y manejadores antes de pintarlo
const sanitizaResumen=(h)=>String(h||'')
  .replace(/<script[\s\S]*?<\/script>/gi,'')
  .replace(/\son\w+\s*=\s*"[^"]*"/gi,'').replace(/\son\w+\s*=\s*'[^']*'/gi,'')
  .replace(/javascript:/gi,'');

// ═══ CONSUMO DE LA CLAVE API ═══
// La clave normal de la API NO puede consultar el saldo ni la facturación: eso
// solo lo permite una clave de administrador, que da acceso de lectura Y
// escritura a toda la organización y no debe vivir dentro de una app en el
// móvil. Lo que sí se puede es contar lo que gasta ESTA app: cada respuesta de
// la API dice cuántos tokens ha costado, así que se suman y se estima el coste.
// Precios en dólares por millón de tokens (los de Haiku 4.5) y por búsqueda.
const PRECIOS_IA={entrada:1.00,salida:5.00,busqueda:0.01};

const costeEstimado=(u,precios)=>{
  const p=precios||PRECIOS_IA, x=u||{};
  const e=(+x.entrada||0)/1e6*(+p.entrada||0);
  const s=(+x.salida||0)/1e6*(+p.salida||0);
  const b=(+x.busquedas||0)*(+p.busqueda||0);
  return {entrada:+e.toFixed(4),salida:+s.toFixed(4),busquedas:+b.toFixed(4),total:+(e+s+b).toFixed(4)};
};

// Extrae el consumo de una respuesta de la API
const usoDeRespuesta=(d)=>{
  const u=(d&&d.usage)||{};
  return {
    entrada:(+u.input_tokens||0)+(+u.cache_read_input_tokens||0)+(+u.cache_creation_input_tokens||0),
    salida:+u.output_tokens||0,
    busquedas:+(((u.server_tool_use||{}).web_search_requests)||0),
    llamadas:1,
  };
};

const sumaUso=(a,b)=>({
  entrada:(+((a||{}).entrada)||0)+(+((b||{}).entrada)||0),
  salida:(+((a||{}).salida)||0)+(+((b||{}).salida)||0),
  busquedas:(+((a||{}).busquedas)||0)+(+((b||{}).busquedas)||0),
  llamadas:(+((a||{}).llamadas)||0)+(+((b||{}).llamadas)||0),
});
export {textoDeResumen,sanitizaResumen,PRECIOS_IA,costeEstimado,usoDeRespuesta,sumaUso};
