// ═══ NUMERACIÓN DE FACTURAS EMITIDAS ══════════════════════════════════════
// Serie nueva a partir de agosto de 2026, decidida por Jesús:
//
//   · formato AAnnnnn — dos dígitos de año + cinco de contador: 2600056
//   · el año cambia el prefijo: 27 desde el 1-1-2027, 28 desde el 1-1-2028…
//   · CADA EMPRESA lleva su propio contador, y las que se creen en el futuro
//     también: el contador vive en el espacio de datos de cada una.
//   · última usada en BIG: 2600055 → la próxima es 2600056
//   · última usada en GREEN: 2600007 → la próxima es 2600008
//
// OJO: esto es numeración fiscal y entra en la huella VERI*FACTU. Un salto o
// un duplicado no es cosmético. Por eso la función es pura y está aquí, con su
// batería, en vez de dentro de app.jsx.
export const PREFIJO_DE=(fecha)=>{
  const f=String(fecha||'');
  const m=f.match(/^(\d{4})-/);
  const anio=m?+m[1]:new Date().getFullYear();
  return String(anio%100).padStart(2,'0');
};

// ¿Es un número de la serie nueva?  2600055 → sí
export const esSerieNueva=(num)=>/^\d{7}$/.test(String(num==null?'':num).trim());

// El contador de un número de la serie: 2600055 → 55
export const contadorDe=(num)=>esSerieNueva(num)?+String(num).trim().slice(2):null;
export const prefijoDe=(num)=>esSerieNueva(num)?String(num).trim().slice(0,2):null;

export const formatear=(prefijo,contador)=>{
  const c=Math.max(0,Math.floor(+contador||0));
  if(c>99999)throw new Error('el contador de la serie se ha agotado (más de 99.999 facturas en un año)');
  return String(prefijo)+String(c).padStart(5,'0');
};

// ── el siguiente número libre ─────────────────────────────────────────────
// usados : números ya emitidos (cualquier formato; los de la serie vieja se
//          ignoran, no estorban)
// semilla: la última usada que Jesús declara en Ajustes ('2600055'), para
//          arrancar la serie sin depender de que haya facturas previas
// fecha  : marca el prefijo del año
export const siguienteNumero=({usados,semilla,fecha})=>{
  const prefijo=PREFIJO_DE(fecha);
  const lista=(Array.isArray(usados)?usados:[]).map(x=>String(x==null?'':x).trim());
  let max=0;
  for(const n of lista){
    if(!esSerieNueva(n))continue;
    if(prefijoDe(n)!==prefijo)continue;     // otro año: contador aparte
    const c=contadorDe(n);
    if(c!==null&&c>max)max=c;
  }
  // La semilla sólo manda dentro de SU año: al cambiar de año se empieza por 1
  const s=String(semilla==null?'':semilla).trim();
  if(esSerieNueva(s)&&prefijoDe(s)===prefijo){
    const c=contadorDe(s);
    if(c!==null&&c>max)max=c;
  }
  return formatear(prefijo,max+1);
};

// ¿Ese número ya está cogido? Se compara sin ceros ni signos, como el resto
// de la app, para que «26-00056» y «2600056» no se cuelen como distintos.
export const norm=(n)=>String(n==null?'':n).replace(/[^0-9A-Za-z]/g,'').toUpperCase();
export const estaOcupado=(num,usados)=>{
  const n=norm(num); if(!n)return false;
  return (Array.isArray(usados)?usados:[]).some(x=>norm(x)===n);
};
