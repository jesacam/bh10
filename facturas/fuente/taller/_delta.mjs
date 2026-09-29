import fs from 'fs';
// ═══ COMPARADOR DE DELTA ESPERADO ═════════════════════════════════════════
// Hasta v339 las A/B exigían «idéntico a lo desplegado», y era cierto porque
// solo se mudaba estado. En v340 se añade una FUNCIÓN nueva (traspasos entre
// empresas del grupo), así que el Panel cambia a propósito.
//
// Esto NO relaja la comprobación: la endurece. Ya no basta con «son iguales».
// Ahora hay que demostrar que la ÚNICA diferencia es la esperada:
//   1. se normaliza el contador de casetas del Panel (26 → 27), y
//   2. se localiza el bloque insertado; tiene que ser UNO, contiguo, y
//      contener la tarjeta de Traspasos.
// Cualquier otra diferencia —una coma, un estilo, un importe— sigue saltando.
// Lo que la entrega puede traer DE MÁS respecto a lo desplegado, declarado
// uno a uno y autorizado por Jesús:
//   · v340 · la tarjeta «🏢 Traspasos» del Panel
//   · v345 · tarjeta «🔠 Homogeneizar nombres» en Ajustes (normalizar a
//     mayúsculas) y tarjeta «🔗 Fusionar clientes duplicados» en la subvista
//     de clientes — ambas pedidas por Jesús el 28-08-2026.
//   · v342 · el campo «Última factura emitida» de Ajustes, que es donde se
//     configura la semilla de la serie AAnnnnn de cada empresa
// Si aparece cualquier OTRA inserción, o si algo desaparece, sigue saltando.
// · v349 · límite del banco por remesa/día en Ajustes, aviso en el modal
//   SEPA y botón «Partir en varios ficheros» en el histórico de remesas —
//   pedidos por Jesús el 31-08-2026 (Eurocaja limita a 60.000 €/remesa·día).
// · v393 · «no siempre los títulos se llaman como tú lo tienes en la app y no
//   lo reconoce»: candidatos por parecido con 📎 Usar, 📂 Elegir fichero con la
//   lista entera de la carpeta (guardada con el cotejo), lo elegido a mano
//   manda sobre cotejos posteriores y la línea APRENDE las palabras del
//   fichero elegido para casar sola la próxima vez.
// · v392 · «sigue pasando» (pantalla corrida en Facturas): el body ya estaba
//   bloqueado, pero #bh-main —el contenedor que desplaza toda la app— permitía
//   el eje horizontal, y cualquier elemento más ancho que la pantalla dejaba
//   arrastrar la app en diagonal. Regla #bh-main{overflow-x:hidden} en la hoja
//   inyectada: lo ancho se recorta, la pantalla no se descoloca. El marcado de
//   las pantallas queda idéntico (la regla vive en el head, no en el DOM).
// · v391 · «no quiero tener que tener una obra vinculada»: el expediente
//   cuelga del CONTRATO mismo (carpeta, líneas y cotejo se guardan en él), el
//   botón 📋 sale en todos los contratos, y el acceso desde Obras sigue
//   guardando en la obra.
// · v390 · «no veo el apartado expediente obra dentro del contrato»: el botón
//   📋 Expediente está ahora también en cada contrato con obra (resuelta con
//   obraDelCatalogo), y el de la tarjeta de Obras usa el mismo resolutor.
// · v389 · expediente de obra: la lista de 16 documentos de inicio dictada por
//   Jesús (PSS, TRC, TGSS, subcontratación…), cotejada con su carpeta de Drive
//   por TÍTULO (permiso solo-metadatos), con N/A gráfico por obra y líneas
//   añadibles. Además: casillas del representante en Datos de empresa (los
//   contratos imprimían «no consta» sin forma de rellenarlo), m² fuera de las
//   plantillas de reserva y arras, ayuda 127→135 temas, carrera del aspa
//   cerrada, aspa e importe real en la ventana de la remesa, desplegables de
//   filtros con tope de ancho (Safari los estiraba hasta la opción más larga).
// · v388 · tres aspas pedidas por Jesús: en cada correo candidato (lo descarta
//   y entra el siguiente de la cola), en la barra superior FIJA de la ventana, y
//   en cada factura (la saca de la lista y de las pendientes). El botón largo de
//   quitar se retira por duplicado.
// · v387 · «una vez vas adjuntando no sigue buscando más facturas pendientes de
//   documento, carga y no hay un ver más»: se revisaban las 446 de golpe (miles
//   de peticiones a Gmail) y se quedaba a medias sin avisar. Ahora de 25 en 25
//   con «ver más». Y «si no hay email vinculado, o rebusca con otro concepto
//   (previo click nuestro), o que nos permita quitarlo»: las dos salidas en cada
//   fila. Probando la app montada salieron dos más: el contador tardaba 4,5 s en
//   subir (esperaba a la nube) y los números de factura cortos se buscaban
//   sueltos, trayendo cualquier cosa.
// · v386 · «se desencaja de la ventana» (los nombres largos de fichero
//   empujaban el contenido fuera), «la ventana podría llegar hasta abajo» y «no
//   termina de ir bien en velocidad… tengo que darle dos veces y de repente
//   empieza a adjuntar clicks pasados»: el botón no daba señal mientras
//   trabajaba. Además, al revisar: clave de fila por factura y no por posición,
//   contador bien redactado y aviso de que la búsqueda sigue en marcha.
// · v385 · «selecciono, voy a usar, aparece una ventana verde como que se ha
//   enganchado, pero continúa ofreciéndose». La búsqueda reescribía la lista
//   entera cada pocos segundos desde su copia interna y machacaba el enganche
//   hecho a mano. Ahora las dos escrituras FUNDEN con lo que hay en pantalla.
// · v384 · «me lo dice pero no me deja elegir ninguna de las propuestas»: en la
//   ventana nueva pinté los candidatos sin botón — fallo mío, ya llevan «📎
//   Usar». Y «me cuesta creer que si pone el importe no encuentre
//   alternativas»: cierto, el bucle se cortaba con la primera consulta que
//   devolvía algo, así que las del importe casi nunca se lanzaban.
// · v383 · Jesús (08-09-2026): «cuando faltan documentos me propone cosas que
//   no son coherentes, facturas con importes distintos, otro proveedor…» y «me
//   he dado cuenta de que gmail, si pones el IMPORTE de la factura, da
//   resultados bastante certeros». Se busca por importe (3.350,01 · 3350,01 ·
//   3350.01), se retira la consulta de arrastre que traía el ruido, y ahora
//   hace falta una señal fuerte —número o importe exacto— más el proveedor.
//   Botón nuevo en Facturas → Recibidas → «Sin doc», con su ventana en la capa
//   ACCION. El envío a la gestoría usa la misma búsqueda.
// · v382 · «he generado una remesa hoy, que he pagado en el banco, y en la app
//   me sale como pendiente… he tenido que meter a mano el pago» · «deberían
//   darse por pagadas todas, salvo incidencia». La casilla «Marcar como
//   pagadas» podía quedarse apagada y el fichero salía sin apuntar nada, sin
//   avisar: se ha RETIRADO y la remesa apunta los pagos siempre. Si el banco no
//   la ejecuta, se deshace en Tesorería. Y el campo «A la remesa» ya no se
//   queda colgado en facturas ya pagadas (fallo mío de la v381).
// · v381 · «necesito poder meter a sepa la parte parcial del anticipo que se
//   estime… así como el pago de los restos cuando se quiera de cada anticipo o
//   factura». Al marcar una línea aparece su importe, relleno con el saldo y
//   editable: lo que se escribe es lo que va al banco y lo que se apunta como
//   pago; el resto queda pendiente para otra remesa. Los anticipos ya se pueden
//   seleccionar (uno ya aplicado no, para no pagarlo dos veces).
// · v380 · Jesús (07-09-2026): «necesito poder pagar los anticipos». El botón
//   de pagar los excluía a propósito y no debía: un anticipo es lo primero que
//   se paga. Como su estado nunca llega a «pagada», el botón se guía por el
//   saldo. Los pagos parciales ya funcionaban en el resto de facturas.
// · v379 · «me está funcionando en big house, es el green donde no». Los
//   ajustes se guardan por empresa: sin dirección de Worker en Green, la app
//   caía a llamar a Anthropic DIRECTAMENTE con una clave del navegador (el
//   camino cerrado en agosto, que allí seguía vivo). Ese camino desaparece, la
//   dirección del Worker se recuerda en el aparato para todas las empresas, y
//   los mensajes de error miran el contenido antes que el número.
// · v378 · Jesús (07-09-2026): «la ventana nueva de registro del importe
//   cobrado no se ha puesto por encima, ha habido un poco de lío». Cada ventana
//   llevaba su número de capa a mano (80, 90, 120, 125, 130, 9999) y el modal de
//   pago se quedó en 80, por debajo del detalle del KPI (90) desde el que se
//   abre. Ahora hay una escalera con nombres y las ventanas que se abren DESDE
//   otra (pagar, borrar, enseñar un enlace) van siempre por encima.
// · v377 · Jesús (07-09-2026): «una proforma o un pago anticipado no tenemos
//   forma de pasarlo a factura definitiva… he tenido que escanear la factura
//   como si fuera nueva, darla por pagada y eliminar el apunte de la proforma».
//   Ahora, desde el anticipo, «📸 Factura definitiva»: se escanea la buena y el
//   anticipo queda aplicado a ella, con su pago y su documento intactos.
// · v376 · la mañana del 07-09-2026: los lectores daban «Error API (403)» sin
//   decir por qué (era DUENO_UID, y el botón del Master decía «TODO BIEN» sin
//   serlo: dos fallos míos, corregidos); el lector propone ahora el proveedor
//   ya dado de alta en vez de duplicarlo (J MARTIN CARO, S.L.), registrando
//   todo en MAYÚSCULAS; cada cotitular pasa a tener SU ficha en vez de acabar
//   metido en la del primero; y el buzón está siempre en el Panel.
// · v375 · el BUZÓN, pedido por Jesús el 06-09-2026: «una bandeja de
//   notificaciones recibidas (llegarán contratos de arras, de reserva, info de
//   clientes…)», que «la veo yo solo» y va «como un KPI dentro de panel con
//   capacidad de moverlo como el resto». Reúne contratos firmados, envíos de
//   clientes, facturas de proveedores y peticiones de derechos; no guarda nada
//   nuevo y no aplica nada solo. Las notificaciones push quedan para mañana.
// · v374 · «los datos del enlace no han volcado sobre la vivienda»: en la v371
//   pasé a MAYÚSCULAS también viviendaId y obraId, y dejaban de casar — fallo
//   mío, corregido con una lista de campos técnicos intocables. Además: borrar
//   la ficha de un cliente (solo si no tiene facturas, contratos ni viviendas
//   detrás, y destruyendo sus copias de DNI), aviso en la ficha de si se le
//   puede pasar a bancos o no, y borrado real de cuentas de usuario en el
//   Worker (worker_master_v374.js).
// · v373 · Jesús, rellenando de verdad la ficha desde el enlace corto:
//   «cada vez que ingreso un carácter se me des-selecciona la ventana». El
//   portal redibujaba toda la lista de titulares en cada tecla del NIF y el
//   campo perdía el foco. Ahora solo se redibuja si el formulario cambia de
//   persona a empresa, y aun entonces vuelven el foco y el cursor.
// · v372 · pedidos por Jesús el 06-09-2026: el enlace del portal se enseña en
//   una VENTANA con Copiar, Compartir y el texto seleccionable (en iPhone el
//   portapapeles solo admite escritura dentro del gesto del dedo, y el enlace
//   llega después: por eso fallaba en silencio); y la tarjeta de cada vivienda
//   se parte en dos alturas para que los cuatro botones no se monten encima
//   del texto en el móvil. Además, los ficheros de la versión ANTERIOR se
//   quedan en el servidor: borrarlos dejaba colgados a los navegadores
//   rezagados (una tarde entera con Brave dando ERR_FAILED).
// · v371 · pedidos por Jesús el 06-09-2026: enlaces del portal CORTOS
//   (/c/?t=8 caracteres) que se BORRAN al usarse; las facturas emitidas contra
//   una vivienda descuentan de su precio, con botón «🧾 Facturar»; TODO en
//   MAYÚSCULAS (portal, entrada de datos y formularios), conservando tildes y
//   eñes y respetando el correo; y «🪪 Datos», el expediente de la vivienda con
//   los datos y el DNI de cada titular para las altas de luz y agua.
// · v370 · «Ventas fase 2», pedida por Jesús el 06-09-2026: contratos de
//   reserva y arras CONFIRMATORIAS que toman la parte vendedora de la empresa
//   en uso, el comprador de su enlace del portal y la vivienda con sus mejoras;
//   firma con el dedo desde el móvil del comprador; los dos papeles de la obra
//   (vender y construir) dejan de ser excluyentes; y rescate de los 13
//   vehículos de la flota que se perdieron al vaciar las semillas en v302.
// · v369 · pedidos por Jesús el 06-09-2026: en Obras, «Nueva obra» en color
//   de acción, pastillas de papel (● promotora / ○ constructora) con marca
//   clara, «🗑 Borrar» a la vista, «⚡ Generar las N viviendas que faltan»
//   repartiendo el coste de venta, y «📄 Contrato» en cada vivienda que
//   prepara el contrato con titular, obra, precio y mejoras. En Master, el
//   botón «Probar conexión» pasa de la clave compartida a /quienSoy con la
//   sesión de Firebase (worker_master_v374.js).
// · v363 · los botones ↶ ↷ de la cabecera (desde v334) los ve todo el que puede
//   editar en el área que mira; al fijar el área DURANTE el render, un miembro
//   con facturas en admin los ve también en el Panel (antes, por un desfase de
//   un render, no). Inserción declarada: «Nada que deshacer/rehacer».
export const PATRON_NUEVO=/📋 Expediente|Traspasos|Última factura emitida|Homogeneizar nombres|Fusionar clientes duplicados|📄 303|Presupuesto anual de personal|Límite del banco|Partir en varios ficheros|límite del banco|Comprobar documentos|pendiente de subir|sin documento de|llevan documento|Comprobar en la nube|Buscar en Gmail|Generar igual|Sin doc|title="sin documento"|title="sin confirmar en la nube"|📎✗|Nada que deshacer|Nada que rehacer|Papel:|🗑 Borrar|⚡ Generar las|viviendas que faltan|📄 Contrato|clave \(solo transición\)|quienSoy|En esta obra:|🪪 Datos|🧾 Facturar|📋 Copiar|📤 Compartir|✓ Copiado|🚫 NO se le puede pasar a bancos|🏦 Autoriza que le pongáis|🗑 Borrar ficha|¿Borrar la ficha\? Toca otra vez|📥 Buzón|firmados|de clientes|sin novedades|📋 Copiar UID|✓ Usar el que ya existe|Dejar lo leído|¿Es |📸 Factura definitiva|A la remesa:|Quedarán |Más de lo que se debe|Se darán por pagadas al generar|📧 Buscar en Gmail los |📎 Usar|⏳ Adjuntando…|sigue buscando|Buscar con otro concepto|Quitar de la lista|más · quedan|Se enseñan 4 de |descartados todos|Expediente|Cotejar con Drive|no obligatorio en esta obra|Representante (contratos de venta)|Buscar en Gmail los |de proveedores|derechos|facturado |sin cobrar |queda |Vendemos las viviendas|Ejecutamos la obra|Recuperar \d+ vehículos|Contrato · vivienda|Arras confirmatorias|Enviar a firmar|Guardar borrador|R26\/|A26\/|firmas \d+\/\d+|Olvidar este aparato|Cierre automático|Cerrar sesión si no toco la app|para desbloquear|Afinar por pantalla|Acciones \(solo cuentan|Sin permiso para|Sin acceso a esta pantalla|Remesas prov\.|Pendiente y N43|🔁 Sustituir|📎 ZIP|no tienen ningún documento adjuntado|Pagos apuntados con esta referencia|Sin pagos apuntados|Diario de pagos|ya llevan pago de otra remesa|Remesas y pagos|🏗 Obras|🏗 Obra|Fundir|📊 Coste|Coste por obra|sin tipología|Promotora — vendemos|Constructora — construimos|🏠 Viviendas|Vivienda /;

// ═══ v353 · segunda vía: diferencias reales por etiquetas ═════════════════
// El prefijo/sufijo se queda corto cuando la inserción nueva está al FINAL
// del DOM (la ventana del paquete) y en el medio ya hay otras inserciones
// autorizadas: lo «quitado» engloba trozos que en realidad siguen ahí. Aquí
// se calcula la diferencia de verdad (LCS por etiquetas) y se aplican LAS
// MISMAS reglas: cada trozo insertado debe casar el patrón declarado, y un
// trozo borrado solo se admite si reaparece íntegro dentro de un insertado
// (mudanza). Ni una letra realmente perdida pasa.
// Con marcado se trocea por etiquetas; el A/B de texto (sin «>») se trocea
// por caracteres: Myers sigue siendo rápido porque las diferencias son pocas.
const tokeniza=(s)=>String(s).includes('>')?String(s).split(/(?<=>)/):Array.from(String(s));
export const explicarPorEtiquetas=(a,b)=>{
  const A=tokeniza(a),B=tokeniza(b);
  // Myers O(ND): coste proporcional a las diferencias, no al tamaño. Con
  // 25.000 etiquetas y un centenar de cambios va en milisegundos; el LCS
  // cuadrático se ahogaba con las capturas de 850 KB.
  const n=A.length,m=B.length,max=n+m;
  const trazas=[];let v=new Int32Array(2*max+2);let fin=false;let dFin=0;
  for(let d=0;d<=max&&!fin;d++){
    trazas.push(Int32Array.from(v));
    for(let k=-d;k<=d;k+=2){
      let x;
      if(k===-d||(k!==d&&v[k-1+max]<v[k+1+max]))x=v[k+1+max];else x=v[k-1+max]+1;
      let y=x-k;
      while(x<n&&y<m&&A[x]===B[y]){x++;y++;}
      v[k+max]=x;
      if(x>=n&&y>=m){fin=true;dFin=d;break;}
    }
    if(d>25000)return {ok:false,motivo:'demasiadas diferencias para explicarlas por etiquetas'};
  }
  // reconstrucción hacia atrás
  const ops=[];let x=n,y=m;
  for(let d=dFin;d>0;d--){
    const vv=trazas[d];const k=x-y;
    let kPrev;
    if(k===-d||(k!==d&&vv[k-1+max]<vv[k+1+max]))kPrev=k+1;else kPrev=k-1;
    const xPrev=vv[kPrev+max],yPrev=xPrev-kPrev;
    while(x>xPrev&&y>yPrev){ops.push(['=',A[x-1]]);x--;y--;}
    if(x===xPrev)ops.push(['+',B[y-1]]),y--;else ops.push(['-',A[x-1]]),x--;
  }
  while(x>0&&y>0){ops.push(['=',A[x-1]]);x--;y--;}
  ops.reverse();
  // Los tramos iguales muy cortos entre dos diferencias (una «y», un
  // espacio, una letra suelta) se absorben: si no, un párrafo insertado se
  // parte en trocitos y ninguno lleva el patrón declarado. El tramo absorbido
  // queda como borrado+insertado, y la regla de mudanza lo exige íntegro.
  const esTexto=!String(a).includes('>');
  const TOPE_IGUAL=esTexto?16:0;
  const hunks=[];let del='',ins='',igual='';let enDiff=false;
  const cierra=()=>{if(del||ins){hunks.push({del,ins});}del='';ins='';igual='';enDiff=false;};
  for(const [op,t] of ops){
    if(op==='='){
      if(enDiff){igual+=t;if(igual.length>TOPE_IGUAL){const g=igual;del=del.slice(0,del.length);ins=ins.slice(0,ins.length);cierra();}}
    }else{
      if(igual){del+=igual;ins+=igual;igual='';}
      enDiff=true;
      if(op==='-')del+=t;else ins+=t;
    }
  }
  if(igual){/* cola igual: no se absorbe */}
  cierra();
  const inserciones=hunks.filter(h=>h.ins).map(h=>h.ins);
  const bloques=[];
  for(const h of hunks){
    if(h.del){
      // mudanza: lo borrado tiene que reaparecer íntegro en algún insertado,
      // y tiene que ser un BLOQUE (una letra suelta cabe en cualquier sitio:
      // eso es pérdida, no mudanza)
      if(esTexto?h.del.trim().length<12:!/<[^>]+>/.test(h.del))return {ok:false,motivo:`se ha QUITADO algo (${h.del.length} bytes): ${h.del.slice(0,120)}`,bloques:[]};
      const donde=inserciones.findIndex(x=>x.includes(h.del));
      if(donde<0)return {ok:false,motivo:`se ha QUITADO algo (${h.del.length} bytes): ${h.del.slice(0,120)}`,bloques:[]};
      inserciones[donde]=inserciones[donde].replace(h.del,'');
      bloques.push('mudanza '+h.del.length);
    }
  }
  // El LCS puede alinear los cierres del bloque nuevo con cierres ya
  // existentes y dejar suelto un «</div>»: solo etiquetas de cierre, sin una
  // letra de contenido. Se admite únicamente si hay un bloque declarado.
  const soloCierres=(x)=>/^\s*(<\/[a-zA-Z0-9]+>\s*)+$/.test(x);
  const hayDeclarado=inserciones.some(x=>PATRON_NUEVO.test(x));
  for(const x of inserciones){
    if(!x.trim())continue;
    if(soloCierres(x)&&hayDeclarado){bloques.push('cierres '+x.length);continue;}
    if(!PATRON_NUEVO.test(x))return {ok:false,motivo:`lo insertado NO está entre los cambios declarados (${x.length} bytes): ${x.slice(0,140)}`,bloques:[]};
    bloques.push(x);
  }
  return {ok:true,motivo:`por etiquetas: ${bloques.filter(x=>!/^(mudanza|cierres)/.test(x)).length} inserciones declaradas${bloques.some(x=>/^mudanza/.test(x))?' y bloques recolocados sin pérdida':''}`,bloques};
};

// ═══ v364 · NAVEGACIÓN NUEVA ══════════════════════════════════════════════
// Jesús (05-09-2026): Panel · Facturas · Obras · Tesorería · Plantilla ·
// Ajustes. Las pantallas no cambian; cambian la barra inferior y las barras
// de subpestañas (y una barra de Tesorería que se pone encima de las
// pantallas recolocadas). Se quitan de los DOS lados antes de comparar.
const quitaBloque=(s,inicio,abre,cierra,por='')=>{
  for(;;){
    const i=s.indexOf(inicio);if(i<0)return s;
    let k=i,prof=0;
    for(;;){const a=s.indexOf(abre,k),c=s.indexOf(cierra,k);if(c<0)return s;if(a>=0&&a<c){prof++;k=a+abre.length;}else{prof--;k=c+cierra.length;if(prof===0)break;}}
    s=s.slice(0,i)+por+s.slice(k);
  }
};
export const normNavegacion=(html)=>{
  let s=String(html==null?'':html);
  s=quitaBloque(s,'<div id="bh-tabbar"','<div','</div>');                       // barra inferior
  // barra de Tesorería (nueva): el atributo data-barra va tras el style; se busca la etiqueta que lo lleva
  s=s.replace(/<div style="[^"]*" data-barra="tesoreria">/g,'<div data-barra="tesoreria">');
  s=quitaBloque(s,'<div data-barra="tesoreria">','<div','</div>','<SUBTABS>');
  // barras de subpestañas: solo botones dentro → se pueden quitar con una expresión
  s=s.replace(/<div style="display: flex; gap: 1px; background: rgb\([^)]*\); border-radius: 10px; padding: 3px; min-width: max-content;">(?:<button[^>]*>(?:(?!<\/button>).)*<\/button>)*<\/div>/g,'<SUBTABS>');
  // barra de Nóminas/Plantilla: la fila fija va delante en el style (spread), así que se casa por el tramo «gap: 4px; border-bottom»
  s=s.replace(/<div style="[^"]*gap: 4px; border-bottom: 1px solid [^"]*">(?:<button[^>]*>(?:(?!<\/button>).)*<\/button>)*<\/div>/g,'<SUBTABS>');
  s=s.replace(/<div style="display: flex; gap: 6px; min-width: max-content;">(?:<button[^>]*>(?:(?!<\/button>).)*<\/button>)*<\/div>/g,'<SUBTABS>');
  s=s.replace(/<div style="display: flex; gap: 4px;">(?:<button[^>]*>(?:(?!<\/button>).)*<\/button>){2}<\/div>/g,'<SUBTABS>');
  // la fila fija (sticky) que envuelve una barra de subpestañas, y la oculta en contexto Tesorería:
  // en los dos lados queda un único <SUBTABS>
  for(let k=0;k<3;k++){
    s=s.replace(/<div style="([^"]*)display: none;([^"]*)"><SUBTABS><\/div>/g,'<SUBTABS>');
    s=s.replace(/<div style="position: sticky;[^"]*"><SUBTABS><\/div>/g,'<SUBTABS>');
    s=s.replace(/<SUBTABS><SUBTABS>/g,'<SUBTABS>');
  }
  // al final, las barras de subpestañas no cuentan en ningún lado (son navegación)
  s=s.replace(/<SUBTABS>/g,'');
  return s;
};
const ROTULOS_NAV=['📊Panel','📋Facturas','📑Contratos','👷Nóminas','🛡️Seguros','⚙️Ajustes','🏗Obras','🏦Tesorería','👷Plantilla',
  '📥Recibidas','📤Emitidas','👤Clientes','🏪Proveedores','🏗️Obras','💰Pendiente','🏦Remesas',
  '📊 Panel','💶 Remesar','📄 Leer PDF','👥 Plantilla','🏦 Remesas','📊 Nóminas',
  '📋 Contratos','📑 Contratos','🏗 Obras','📐 Presupuestos por obra','🛡️ Garantías','🏦 Financiación',
  '🛡️ Pólizas','🚐 Vehículos','🏦 Remesas prov.','💶 Remesas nóminas','💰 Pendiente y N43','🛡️ Seguros','📈 Previsión','🔁 Traspasos'];
export const normNavegacionTexto=(t)=>{
  let s=String(t==null?'':t);
  // rótulo con o sin espacio tras el icono, y con el contador pegado («📥 Recibidas884»)
  // los rótulos largos primero: «💰 Pendiente y N43» antes que «💰Pendiente», «🏦 Remesas prov.» antes que «🏦 Remesas»
  for(const r of [...ROTULOS_NAV].sort((a,b)=>b.length-a.length)){
    const [ic,...resto]=r.split(' ');const txt=resto.length?resto.join(' '):r.replace(/^[^A-Za-zÁÉÍÓÚÑ¿]+/,'');const icono=resto.length?ic:r.slice(0,r.length-txt.length);
    const re=new RegExp(icono.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+' ?'+txt.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\d*','g');
    s=s.replace(re,'');
  }
  // los contadores de las subpestañas pegados a la cabecera: «🔍941(881)(60)(18)»
  return s.replace(/🔍(\d+)(\(\d+\))+/g,'🔍$1');
};
export const explicarDelta=(a0,b0)=>{
  const esHtml=/<[a-z]/i.test(String(a0))||/<[a-z]/i.test(String(b0));
  const a=esHtml?normNavegacion(a0):normNavegacionTexto(a0), b=esHtml?normNavegacion(b0):normNavegacionTexto(b0);
  const d=explicarDeltaClasico(a,b);
  if(d.ok)return d;
  const e=explicarPorEtiquetas(String(a).replace(/(\d+) casetas/g,'N casetas'),String(b).replace(/(\d+) casetas/g,'N casetas'));
  return e.ok?e:d;
};
const explicarDeltaClasico=(a,b)=>{
  const na=String(a).replace(/(\d+) casetas/g,'N casetas');
  const nb=String(b).replace(/(\d+) casetas/g,'N casetas');
  if(na===nb)return {ok:true,motivo:'idénticos',bloques:[]};
  // prefijo y sufijo comunes
  let i=0; while(i<na.length&&i<nb.length&&na[i]===nb[i])i++;
  let j=0; while(j<na.length-i&&j<nb.length-i&&na[na.length-1-j]===nb[nb.length-1-j])j++;
  const quitado=na.slice(i,na.length-j);
  const puesto =nb.slice(i,nb.length-j);
  if(quitado.length){
    // v345 recolocó la caseta de Traspasos en su posición de lista (antes el
    // indexOf a -1 la mandaba la primera): los bloques del panel se MUDAN de
    // sitio sin perder ni una letra. Una mudanza pura se reconoce así: lo
    // «quitado» existe íntegro en la entrega. Se descuenta de ambos lados y
    // se sigue mirando; cualquier letra realmente perdida sigue saltando.
    if(nb.includes(quitado)){
      const na2=na.replace(quitado,''), nb2=nb.replace(quitado,'');
      const d2=explicarDelta(na2,nb2);
      if(d2.ok)return {ok:true,motivo:`bloque recolocado sin pérdida (${quitado.length} bytes) · ${d2.motivo}`,bloques:d2.bloques};
    }
    return {ok:false,motivo:`se ha QUITADO algo (${quitado.length} bytes): ${quitado.slice(0,120)}`,bloques:[]};
  }
  if(!puesto.length)return {ok:false,motivo:'diferencia sin bloque identificable',bloques:[]};
  if(!PATRON_NUEVO.test(puesto))
    return {ok:false,motivo:`lo insertado NO está entre los cambios declarados (${puesto.length} bytes): ${puesto.slice(0,140)}`,bloques:[]};
  // quitado el bloque, el resto tiene que ser idéntico byte a byte…
  const resto=nb.slice(0,i)+nb.slice(nb.length-j);
  if(resto!==na){
    // …o quedar SOLO más inserciones autorizadas: desde v347 el panel lleva
    // dos bloques nuevos en puntos distintos (Traspasos y el botón 303), y
    // una sola pasada de prefijo/sufijo no los separa. Se pela iterando:
    // cada vuelta debe quitar UNA inserción que case el patrón; si algo se
    // quita o no casa, sigue saltando como siempre.
    const otra=explicarDelta(na,resto);
    if(otra.ok)return {ok:true,motivo:`inserciones autorizadas encadenadas: ${otra.motivo} + otra con ${PATRON_NUEVO.test(puesto)?'patrón declarado':'?'}`,bloques:[...otra.bloques,puesto]};
    return {ok:false,motivo:'tras quitar la tarjeta el resto SIGUE difiriendo: '+otra.motivo,bloques:[puesto]};
  }
  // Se NOMBRA lo insertado: decir siempre «la tarjeta de Traspasos» ocultaba
  // que en Ajustes lo que aparece es el campo de la serie de facturas.
  const que=/Presupuesto anual de personal/.test(puesto)?'la tarjeta «Presupuesto anual de personal» de Nóminas (v348)'
    :/📄 303/.test(puesto)?'el botón «📄 303» del resumen fiscal (v347)'
    :/Homogeneizar nombres/.test(puesto)?'la tarjeta «Homogeneizar nombres» de Ajustes (v345)'
    :/Fusionar clientes duplicados/.test(puesto)?'la tarjeta «Fusionar clientes duplicados» (v345)'
    :/Última factura emitida/.test(puesto)?'el campo «Última factura emitida» de Ajustes'
           :(/Traspasos/.test(puesto)?'la tarjeta de Traspasos':'un bloque declarado');
  return {ok:true,motivo:`una sola inserción de ${puesto.length} bytes, y es ${que}`,bloques:[puesto]};
};

// ═══ DELTA DE LA SERIE NUEVA Y EL CIF DE CERTIFICACIÓN (v342) ═════════════
// Autorizado por Jesús, y SOLO por estos dos cambios:
//   · numFactura pasa de «F-AAAA/NNN» a la serie «AAnnnnn»
//   · las facturas de certificación arrastran «proveedorCif», sin el cual
//     VERI*FACTU las rechazaba en silencio
// No se relaja nada: se normalizan ESAS DOS COSAS y el resto tiene que seguir
// siendo idéntico byte a byte. Y además se exige que el cambio HAYA ocurrido:
// si el número volviera al formato viejo o el CIF desapareciera, salta.

// ═══ v358 · AJUSTES COMO CASILLAS ═════════════════════════════════════════
// Jesús (03-09-2026): «casillas como las del Panel, ventana encima, Guardar
// o Cerrar sin guardar, y colocarlas como quiera». El CONTENIDO de cada
// apartado es el mismo; cambia el envoltorio: acordeón (cabecera + cuerpo
// oculto por grupos) → rejilla de casillas + cuerpos ocultos + ventana. Se
// quita el envoltorio de los dos lados y se compara lo que queda, que debe
// ser idéntico salvo lo declarado. Y el mando «Colocar apartados» pasa a la
// cabecera: su tarjeta se queda como «Barra y pantalla» (misma tarjeta,
// menos la fila del mando y su pista).
export const normAjustes=(html)=>normCopiaZip(String(html==null?'':html))
  // — producción (acordeón) —
  .replace(/<div id="bh-config" style="padding: 14px; display: flex; flex-direction: column;">/,'<div id="bh-config">')
  .replace(/<div style="order: \d+; font-size: 10\.5px; font-weight: 700; color: rgb\(129, 150, 176\); letter-spacing: 0\.07em; margin: 10px 0px 6px 2px;">[^<]*<\/div>/g,'')
  .replace(/<div style="order: \d+; margin-bottom: 6px;"><button style="width: 100%;[^"]*">[\s\S]*?<\/button>(<div style="display: none;">[\s\S]*?<\/div>)<\/div>(?=<div style="order: \d+; margin-bottom: 6px;">|<\/div>)/g,'$1')
  .replace(/<span style="font-weight: 700; flex: 1 1 0%; min-width: 0px; font-size: 13px;">✥ Colocar apartados<\/span><button[^>]*>Ordenar<\/button>/,'<span style="font-weight: 700; flex: 1 1 0%; min-width: 0px; font-size: 13px;">📐 Barra y pantalla</span>')
  .replace(/ margin-bottom: 10px; order: -999;">/,' margin-bottom: 10px;">')
  .replace(/<div style="font-size: 10\.5px; color: rgb\(129, 150, 176\); margin-top: 4px; line-height: 1\.45;">Sube o baja los apartados de esta pantalla para tenerlos como te convenga\.<\/div>/,'')
  // — entrega (casillas) —
  .replace(/<div id="bh-config" style="padding: 14px;">/,'<div id="bh-config">')
  .replace(/<div data-aj="cabecera"[^>]*>[\s\S]*?<\/div>/,'')
  .replace(/<div data-aj="pista"[^>]*>[\s\S]*?<\/div>/,'')
  .replace(/<div data-aj="casillas"[^>]*>[\s\S]*?<\/div>/,'')
  .replace(/<div data-aj="cuerpo" data-titulo="[^"]*" style="display: none;">/g,'<div style="display: none;">');
// v365 · la restauración acepta también el ZIP cifrado de la copia (antes solo .json)
export const normCopiaZip=(html)=>String(html==null?'':html).replace(/accept="\.json,\.zip"/g,'accept=".json"')
  // v368 · el botón «Borrar todo» va atenuado hasta que se escribe el nombre de la empresa: la opacidad no cuenta
  .replace(/(<button style="background: rgb\(239, 68, 68\);[^"]*?) opacity: (?:0\.4|1);/g,'$1');
// misma idea para el A/B de TEXTO (sin etiquetas). Cabeceras del acordeón
// (icono+título pegados) y rótulos de las casillas (igual) se quitan de los
// dos lados leyendo la lista declarada en src/ajustes.jsx; los títulos de
// las tarjetas (icono, espacio, título) se quedan y se comparan.
const _rotulosAj=(()=>{try{
  const src=fs.readFileSync(new URL('../src/ajustes.jsx',import.meta.url),'utf8');
  return [...src.matchAll(/ic:'([^']+)',\s*t:'([^']+)'/g)].map(m=>m[1]+m[2]);
}catch(e){return [];}})();
const _sinRotulos=(t)=>_rotulosAj.reduce((x,r)=>x.split(r).join(''),String(t));
export const normAjustesTexto=(t)=>_sinRotulos(String(t==null?'':t)
  .replace(/DÍA A DÍA|DATOS|ACCESOS|LA APP|MÁS/g,'')
  .replace(/[›▾⌄]/g,'')
  .replace(/✥ Colocar apartadosOrdenarSube o baja los apartados de esta pantalla para tenerlos como te convenga\./,'📐 Barra y pantalla')
  .replace(/✥Colocar apartados/,'📐Barra y pantalla')
  .replace(/⚙️ Ajustes · \d+ casillas✎ Colocar/,'')
  // el marco de la ventana emergente (✕ y pie), si el flujo dejó una abierta
  .replace(/✕/g,'').replace(/Cerrar sin guardar💾 Guardar/g,'').replace(/Cerrar(?![ a-záéíóúñ])/g,''));

export const normSerie=(txt)=>String(txt==null?'':txt)
  .replace(/"numFactura":"F-\d{4}\/\d+"/g,'"numFactura":"<NUM>"')
  .replace(/"numFactura":"\d{7}"/g,'"numFactura":"<NUM>"')
  // El número aparece también en el NOMBRE del documento del visor
  // («📄 FACTURA_F-2026_015» → «📄 FACTURA_2600056»), no sólo en el JSON.
  // El número vive en CUATRO sitios: el JSON, el nombre del documento del
  // visor («FACTURA_F-2026_015»), el <title> del HTML («FACTURA F-2026/015»)
  // y el cuerpo del papel. Se normalizan los cuatro, y sólo ellos.
  .replace(/FACTURA[ _]F-\d{4}[_\/-]\d+/g,'FACTURA <NUM>')
  .replace(/FACTURA[ _]\d{7}/g,'FACTURA <NUM>')
  .replace(/F-\d{4}\/\d+/g,'<NUM>')
  .replace(/\b\d{7}\b/g,'<NUM>')
  .replace(/FACTURA_F-\d{4}[_\/-]\d+/g,'FACTURA_<NUM>')
  .replace(/FACTURA_\d{7}/g,'FACTURA_<NUM>')
  .replace(/,"proveedorCif":"[^"]*"/g,'')
  .replace(/"proveedorCif":"[^"]*",/g,'');

// v357 · Jesús (03-09-2026): «en los datos del cliente no aparece su
// dirección ni el email». La emitida toma ahora CIF, dirección, email y
// teléfono de la ficha del cliente cuando el contrato no los trae. El
// detalle del bloque CLIENTE del HTML se normaliza en ambos lados: es el
// único sitio autorizado a cambiar; todo lo demás sigue byte a byte.
export const normReceptor=(txt)=>String(txt==null?'':txt)
  // v359 · métodos de pago nuevos en el desplegable (Tarjeta, Préstamo promotor, Pago anticipado)
  .replace(/TransferenciaDomiciliaci(ó|o)nChequeEfectivoTarjetaPagar(é|e)ConfirmingPr(é|e)stamo promotorPago anticipado/g,'TransferenciaDomiciliaciónChequeEfectivoPagaréConfirming')
  // en el JSON guardado: los cuatro campos del cliente arrastrados al emitir
  .replace(/"_clienteCif":"[^"]*"/g,'"_clienteCif":"<CLI>"')
  .replace(/"_clienteDir":"[^"]*"/g,'"_clienteDir":"<CLI>"')
  .replace(/,"_clienteEmail":"[^"]*"/g,'')
  .replace(/,"_clienteTel":"[^"]*"/g,'')
  .replace(/(<div class="party receptor">[\s\S]*?<div class="party-detail">)[\s\S]*?(<\/div>)/,'$1<DETALLE-CLIENTE>$2');

// v360 · el sello VERI*FACTU (bloque vf-pie) va ahora también en la factura
// que se imprime AL EMITIR (antes solo al descargar desde la ficha). Se
// quita de los dos lados con etiquetas equilibradas: lleva divs anidados.
export const sinBloqueVf=(html)=>{
  let s=String(html==null?'':html);
  for(;;){
    const i=s.indexOf('<div class="vf-pie"');if(i<0)return s;
    let k=i,prof=0;
    for(;;){
      const a=s.indexOf('<div',k),c=s.indexOf('</div>',k);
      if(c<0)return s;
      if(a>=0&&a<c){prof++;k=a+4;}else{prof--;k=c+6;if(prof===0)break;}
    }
    s=s.slice(0,i)+s.slice(k);
  }
};
// el hueco que deja el bloque (saltos y sangría de la plantilla) se iguala en los dos lados
const sinHuecos=(h)=>String(h).replace(/>\s+</g,'><');
export const explicarSerie=(a,b)=>{
  // v364 · las series de texto llevan la barra inferior y las subpestañas: se quitan de los dos lados
  const nav=(x)=>/<[a-z]/i.test(String(x))?normNavegacion(x):normNavegacionTexto(x);
  const na=sinHuecos(sinBloqueVf(normReceptor(normSerie(nav(a))))), nb=sinHuecos(sinBloqueVf(normReceptor(normSerie(nav(b)))));
  if(na!==nb){
    let i=0;while(i<Math.min(na.length,nb.length)&&na[i]===nb[i])i++;
    return {ok:false,motivo:`tras normalizar número y CIF, SIGUE difiriendo en el byte ${i}: `
      +`«${na.slice(Math.max(0,i-40),i+60)}» vs «${nb.slice(Math.max(0,i-40),i+60)}»`};
  }
  const viejoEnB=/"numFactura":"F-\d{4}\/\d+"/.test(String(b));
  const nuevoEnB=/"numFactura":"\d{7}"/.test(String(b));
  const cifEnB=/"proveedorCif":"[0-9A-Za-z]/.test(String(b));
  if(viejoEnB&&!nuevoEnB)return {ok:false,motivo:'la entrega sigue usando la serie VIEJA F-AAAA/NNN'};
  return {ok:true,motivo:`sólo cambian el nº de factura${nuevoEnB?' (serie nueva)':''}${cifEnB?' y el CIF del cliente':''}; el resto, idéntico`};
};

// ═══ FOTOS RECORTADAS ═════════════════════════════════════════════════════
// Algunas baterías guardan sólo los primeros N caracteres de la pantalla. Si
// la entrega inserta algo AL PRINCIPIO, el final se sale del recorte y el
// comparador cree que «se ha quitado algo». No es cierto: está desplazado.
// Se compara quitando el bloque declarado y recortando AMBAS a lo que las dos
// alcanzan. Sigue saltando si dentro de esa parte común cambia cualquier cosa.
export const explicarRecorte=(a,b,tope)=>{
  const A=String(a), B=String(b);
  if(A===B)return {ok:true,motivo:'idénticos'};
  const d=explicarDelta(A,B);
  if(d.ok)return d;
  // ¿están las dos al tope? entonces hay desplazamiento por inserción
  const alTope=tope&&A.length>=tope-1&&B.length>=tope-1;
  if(!alTope)return d;
  // se quita del B el bloque declarado y se comparan hasta donde llegan las dos
  let sinBloque=B.replace(/Última factura emitida[\s\S]{0,700}?(?=CIF \/ NIF|<\/label>|País)/,'');
  // v345: se quitan también las dos tarjetas nuevas enteras (cada una es un
  // <div> de tarjeta completo, delimitado por el título y el botón/cierre)
  sinBloque=sinBloque.replace(/<div[^>]*>[^<]*🔠 Homogeneizar nombres[\s\S]{0,900}?MAYÚSCULAS<\/button><\/div>/,'');
  sinBloque=sinBloque.replace(/<button[^>]*>📄 303<\/button>/,'');
  sinBloque=sinBloque.replace(/🔠 Homogeneizar nombres[\s\S]{0,900}?MAYÚSCULAS<\/button><\/div>/,'');
  sinBloque=sinBloque.replace(/<div[^>]*><div[^>]*>[^<]*🔗 Fusionar clientes duplicados[\s\S]{0,2600}?<\/div><\/div>/,'');
  const n=Math.min(A.length,sinBloque.length);
  if(A.slice(0,n)===sinBloque.slice(0,n))
    return {ok:true,motivo:`la foto está recortada a ${tope}: quitado el campo nuevo, los ${n} caracteres comunes son idénticos`};
  let i=0;while(i<n&&A[i]===sinBloque[i])i++;
  return {ok:false,motivo:`difiere en el byte ${i} de la parte común: «${sinBloque.slice(Math.max(0,i-40),i+60)}»`};
};
