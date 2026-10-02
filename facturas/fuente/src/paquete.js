// ═══ PAQUETE GESTORÍA · integridad, reintentos y cuadre ═══════════════════
// Jesús (01-09-2026): «hay veces que el documento existe pero la app no lo
// mete en el zip». Causa: el paquete bajaba cada documento UNA vez sin
// reintento, y el envoltorio concatena los trozos base64 que encuentra, así
// que un trozo perdido daba un PDF truncado que entraba en el zip sin aviso.
//
// Aquí vive la parte pura (comprobable en batería): comprobar que un
// documento está entero, reintentar con espera creciente distinguiendo lo
// definitivo de lo transitorio, y cuadrar el envío nombrando cada factura
// que falte con proveedor, número e importe.

const r2=(n)=>Math.round((+n||0)*100)/100;
const eur=(n)=>{const v=r2(n);const [e,d]=v.toFixed(2).split('.');return e.replace(/\B(?=(\d{3})+(?!\d))/g,'.')+','+d+' €';};
const asciiDe=(bytes)=>{let s='';for(let k=0;k<bytes.length;k++)s+=String.fromCharCode(bytes[k]);return s;};

// ── ¿qué esquema tiene el enlace? ─────────────────────────────────────────
// Evidencia del paquete T3 enviado a Reme el 13-08-2026: las 7 «no se
// pudieron descargar» llevaban enlaces «adjfs:…» (8 facturas adjuntadas
// entre el 14 y el 28 de julio), un esquema que ningún código de la app
// entiende. Fallaban SIEMPRE, no por red. Se reconoce de antemano y se
// declara por su nombre, sin gastar reintentos.
export const esquemaEnlace=(adjPath)=>{
  const p=String(adjPath||'').trim();
  if(!p)return {ok:false,motivo:'sin enlace'};
  const m=p.match(/^([a-z][a-z0-9]*):/i);
  if(m)return {ok:false,esquema:m[1]+':',motivo:'enlace «'+m[1]+':» en un formato que la app no entiende — readjunta el documento'};
  return {ok:true};
};

// ── nombre único dentro del zip ───────────────────────────────────────────
// Dos facturas con misma fecha, proveedor y número pisarían el mismo
// fichero sin error. Se añade _2, _3… al segundo y siguientes.
export const nombreUnico=(nombre,usados)=>{
  if(!usados.has(nombre)){usados.add(nombre);return nombre;}
  const i=nombre.lastIndexOf('.');const base=i>0?nombre.slice(0,i):nombre,ext=i>0?nombre.slice(i):'';
  let k=2;while(usados.has(base+'_'+k+ext))k++;
  const n=base+'_'+k+ext;usados.add(n);return n;
};

// ── ¿está entero? ─────────────────────────────────────────────────────────
// Devuelve '' si el documento pasa, o el motivo si no. Solo se pronuncia
// sobre lo que sabe comprobar (PDF, JPEG, PNG); otros formatos pasan si no
// están vacíos.
export const sanoDocumento=(bytes,mime,nombre)=>{
  if(!bytes||!bytes.length)return 'documento vacío';
  const n=bytes.length;
  const cab=asciiDe(bytes.slice(0,8));
  const cola=asciiDe(bytes.slice(Math.max(0,n-1200)));
  const dicePdf=/pdf/i.test(String(mime||''))||/\.pdf$/i.test(String(nombre||''));
  if(cab.startsWith('%PDF')){
    if(!cola.includes('%%EOF'))return 'PDF truncado (sin %%EOF final)';
    return '';
  }
  if(dicePdf)return 'no es un PDF válido (cabecera '+JSON.stringify(cab.slice(0,4))+')';
  if(bytes[0]===0xFF&&bytes[1]===0xD8){
    if(!(bytes[n-2]===0xFF&&bytes[n-1]===0xD9))return 'JPEG truncado (sin marca final)';
    return '';
  }
  if(bytes[0]===0x89&&cab.slice(1,4)==='PNG'){
    if(!cola.slice(-16).includes('IEND'))return 'PNG truncado (sin IEND)';
    return '';
  }
  return '';
};

// ── reintentos con espera creciente ───────────────────────────────────────
// fn recibe el nº de intento (0,1,2). Un error con .definitivo=true corta
// los reintentos: «no existe en la nube» no mejora esperando.
export const ESPERAS_MS=[800,2500,6000];
export const conReintentos=async(fn,opts={})=>{
  const intentos=opts.intentos||3;
  const esperas=opts.esperas||ESPERAS_MS;
  const dormir=opts.dormir||((ms)=>new Promise(r=>setTimeout(r,ms)));
  let ultimo=null;
  for(let k=0;k<intentos;k++){
    try{return await fn(k);}
    catch(e){
      ultimo=e;
      if(e&&e.definitivo)break;
      if(k<intentos-1)await dormir(esperas[Math.min(k,esperas.length-1)]);
    }
  }
  throw ultimo||new Error('sin resultado');
};
export const errorDefinitivo=(msg)=>{const e=new Error(msg);e.definitivo=true;return e;};

// ── confirmación de nube tras subir (v352) ────────────────────────────────
// enNube (del envoltorio) devuelve {ok,motivo}: ok solo si cabecera y trozos
// están aceptados por el servidor (sin hasPendingWrites). Se insiste tres
// veces con espera creciente porque justo después de subir la cola puede
// tardar unos segundos en vaciarse. Sin función de comprobación (envoltorio
// antiguo) se da por bueno para no bloquear.
export const confirmarEnNube=async(enNube,ref,opts={})=>{
  if(typeof enNube!=='function')return {ok:true,motivo:'sin comprobación'};
  const intentos=opts.intentos||3;
  const dormir=opts.dormir||((ms)=>new Promise(r=>setTimeout(r,ms)));
  let ultimo={ok:false,motivo:'sin respuesta'};
  for(let k=0;k<intentos;k++){
    try{const r=await enNube(ref);if(r&&r.ok)return r;if(r&&r.motivo)ultimo=r;}
    catch(e){ultimo={ok:false,motivo:(e&&e.message)||'error'};}
    if(k<intentos-1)await dormir(1500*(k+1));
  }
  return ultimo;
};

// ── cuadre del envío ──────────────────────────────────────────────────────
// estado: {id → 'documentos/xxx.pdf' | {fallo:'motivo'} | undefined (sin adjunto)}
export const lineaFactura=(i)=>`${i.fecha||'sin fecha'} · ${i.proveedor||'(sin proveedor)'} · nº ${i.numFactura||'s/n'} · ${eur(i.total)}`;

export const cuadrarEnvio=(recP,estado)=>{
  const conDoc=[],sinAdj=[],fallidos=[];
  for(const i of recP){
    const e=estado[i.id];
    if(typeof e==='string'&&e)conDoc.push(i);
    else if(e&&e.fallo)fallidos.push({inv:i,motivo:e.fallo});
    else sinAdj.push(i);
  }
  const cuadra=recP.length===conDoc.length+sinAdj.length+fallidos.length;
  return {conDoc,sinAdj,fallidos,cuadra,total:recP.length};
};

export const textoCuadre=(c)=>{
  let t=`CUADRE DEL ENVÍO: ${c.total} facturas del periodo = ${c.conDoc.length} con documento + ${c.sinAdj.length} sin adjuntar en la app + ${c.fallidos.length} no descargadas${c.cuadra?'':'  ← ¡NO CUADRA, avisar a Jesús!'}\n`;
  t+=`El CSV lleva las ${c.total} facturas; la carpeta documentos/ lleva ${c.conDoc.length}.\n`;
  const ilegibles=c.fallidos.filter(f=>/^enlace «/.test(f.motivo)),transit=c.fallidos.filter(f=>!/^enlace «/.test(f.motivo));
  if(ilegibles.length){
    t+=`\nENLACE QUE LA APP NO ENTIENDE (${ilegibles.length}) — el documento no se puede leer desde la app con ese enlace; readjúntalo desde el correo (Ajustes → 🔍 Comprobar documentos los encuentra todos):\n`;
    ilegibles.forEach(f=>{t+=`  · ${lineaFactura(f.inv)}  [${f.motivo}]\n`;});
  }
  if(transit.length){
    t+=`\nNO DESCARGADAS (${transit.length}) — el documento está enlazado en la app pero no se pudo bajar entero tras 3 intentos. Reintenta el paquete; si persiste, búscalas en el correo:\n`;
    transit.forEach(f=>{t+=`  · ${lineaFactura(f.inv)}  [${f.motivo}]\n`;});
  }
  if(c.sinAdj.length){
    t+=`\nSIN DOCUMENTO ADJUNTO (${c.sinAdj.length}) — están en el CSV pero nadie las ha adjuntado en la app; búscalas en el correo:\n`;
    c.sinAdj.forEach(i=>{t+=`  · ${lineaFactura(i)}\n`;});
  }
  if(!c.fallidos.length&&!c.sinAdj.length)t+='\nTodas las facturas del periodo llevan su documento. ✓\n';
  return t;
};

// ── cuadre_documentos.csv: una fila por factura del periodo ───────────────
const celda=(v)=>{const s=String(v==null?'':v);return /[;"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
export const csvCuadre=(recP,estado)=>{
  const filas=['fecha;proveedor;numero;total;documento'];
  for(const i of recP){
    const e=estado[i.id];
    const doc=(typeof e==='string'&&e)?e.replace(/^documentos\//,''):(e&&e.fallo)?('FALLO: '+e.fallo):'SIN ADJUNTO';
    filas.push([i.fecha||'',i.proveedor||'',i.numFactura||'',r2(i.total).toFixed(2).replace('.',','),doc].map(celda).join(';'));
  }
  return filas.join('\r\n');
};
