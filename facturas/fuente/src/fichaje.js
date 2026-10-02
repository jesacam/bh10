// ═══ FICHAJE Y PLANIFICACIÓN · jornadas, turnos, cuadre de horas ═══
// Confirmación por doble toque — window.confirm está bloqueado en el sandbox del artefacto
// ═══ Detección de proveedores duplicados (heurística local, sin IA) ═══
const normProvNombre=(s)=>{
  let t=String(s||'').toUpperCase();
  t=t.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  t=t.replace(/[.,;:()'"-]/g,' ');
  t=t.replace(/\b(S\s*L\s*U?|S\s*A\s*U?|C\s*B|SOCIEDAD LIMITADA|SOCIEDAD ANONIMA)\b/g,' ');
  return t.replace(/\s+/g,' ').trim();
};

// ═══ PLANIFICACIÓN MENSUAL ═══
// Lo previsto, que es distinto de lo ocurrido: la planificación dice a qué hora
// debía entrar cada uno, el fichaje dirá a qué hora entró. Importar la
// planificación NUNCA puede tocar un fichaje ya registrado.
// ── JORNADA HABITUAL, EN LA FICHA DEL TRABAJADOR ──
// La jornada de una persona es estable: 08:00-17:00 de lunes a viernes no
// cambia cada mes. Se pone UNA vez en su ficha y de ahí sale todo. La
// planificación mensual pasa a ser la capa de EXCEPCIONES: festivos,
// vacaciones, un sábado trabajado o una semana con otro horario.
const DIAS_SEMANA=[['L','Lunes'],['M','Martes'],['X','Miércoles'],['J','Jueves'],
  ['V','Viernes'],['S','Sábado'],['D','Domingo']];

const JORNADA_VACIA={L:'',M:'',X:'',J:'',V:'',S:'',D:''};

// Lunes=1 … Domingo=0 en JavaScript; aquí se usa la letra
const letraDia=(fecha)=>{
  const d=new Date(String(fecha)+'T12:00');
  if(!Number.isFinite(d.getTime()))return '';
  return ['D','L','M','X','J','V','S'][d.getDay()];
};

const horasSemanales=(jornada)=>{
  const j=(jornada&&typeof jornada==='object')?jornada:{};
  return +DIAS_SEMANA.reduce((a,[k])=>a+(leerTurno(j[k]).horas||0),0).toFixed(2);
};

// Lo previsto para una persona un día concreto. El orden importa: una
// excepción del mes SIEMPRE manda sobre la jornada habitual, porque se metió a
// propósito para ese día.
const jornadaPrevista=(empleado,fecha,excepciones)=>{
  const exc=(Array.isArray(excepciones)?excepciones:[])
    .find(x=>x&&x.empleadoId===(empleado&&empleado.id)&&x.fecha===fecha);
  if(exc)return {origen:'excepcion',codigo:exc.codigo||'',tramos:exc.tramos||[],
    horas:exc.horas||0,trabaja:!exc.codigo&&(exc.horas||0)>0};
  const letra=letraDia(fecha);
  const j=(empleado&&empleado.jornada&&typeof empleado.jornada==='object')?empleado.jornada:null;
  if(!letra||!j)return {origen:'',codigo:'',tramos:[],horas:0,trabaja:false};
  const t=leerTurno(j[letra]);
  return {origen:t.trabaja?'jornada':'',codigo:'',tramos:t.tramos,horas:t.horas,trabaja:t.trabaja};
};

// ── LO FICHADO FRENTE A LO PREVISTO ──
// Los fichajes llegan sueltos (entrada, salida, entrada, salida). Aquí se
// emparejan por día y se comparan con lo que tocaba según su jornada.
const horasDeRegistros=(regs)=>{
  const l=(Array.isArray(regs)?regs:[]).filter(r=>r&&r.hora&&r.tipo)
    .sort((a,b)=>String(a.hora).localeCompare(String(b.hora)));
  let min=0, ini=null, sueltos=0;
  l.forEach(r=>{
    const p=String(r.hora).split(':'); const t=(+p[0])*60+(+p[1]);
    if(!Number.isFinite(t))return;
    if(r.tipo==='entrada'){ if(ini!==null)sueltos++; ini=t; }
    else { if(ini===null){sueltos++;return;} min+=Math.max(0,t-ini); ini=null; }
  });
  // Una entrada sin su salida no se puede contar: se marca y ya está
  if(ini!==null)sueltos++;
  return {horas:+(min/60).toFixed(2), abierto:ini!==null, sueltos, n:l.length};
};

const cuadreDia=(empleado,fecha,regs,excepciones)=>{
  const prev=jornadaPrevista(empleado,fecha,excepciones);
  const real=horasDeRegistros(regs);
  const dif=+(real.horas-(prev.horas||0)).toFixed(2);
  let estado='ok';
  if(prev.codigo)estado='ausencia';
  else if(!prev.trabaja&&real.n>0)estado='no-previsto';
  else if(prev.trabaja&&real.n===0)estado='sin-fichar';
  else if(real.abierto)estado='abierto';
  else if(Math.abs(dif)>0.25)estado=dif>0?'exceso':'defecto';
  return {fecha, previsto:prev.horas||0, real:real.horas, dif, estado,
    codigo:prev.codigo, abierto:real.abierto, sueltos:real.sueltos, fichajes:real.n};
};

const CODIGOS_PLAN={
  L:{n:'Libre',trabaja:false}, F:{n:'Festivo',trabaja:false},
  V:{n:'Vacaciones',trabaja:false}, B:{n:'Baja',trabaja:false},
  P:{n:'Permiso',trabaja:false},
};

// «08:00-17:00» o «08:00-13:00 / 15:00-18:00» → tramos y horas
const leerTurno=(txt)=>{
  const t=String(txt==null?'':txt).trim();
  if(!t)return {tramos:[],horas:0,codigo:'',trabaja:false};
  const cod=t.toUpperCase();
  if(CODIGOS_PLAN[cod])return {tramos:[],horas:0,codigo:cod,trabaja:false};
  const tramos=[];
  t.split('/').forEach(p=>{
    const m=String(p).trim().match(/^(\d{1,2})[:.](\d{2})\s*[-–a]\s*(\d{1,2})[:.](\d{2})$/);
    if(!m)return;
    const h1=+m[1], n1=+m[2], h2=+m[3], n2=+m[4];
    // Un reloj no tiene las 25:00. Sin esto, «25:00-30:00» daba 5 horas buenas.
    if(h1>23||h2>23||n1>59||n2>59)return;
    const e=h1*60+n1, s=h2*60+n2;
    // Un turno de noche cruza la medianoche: 22:00-06:00 son 8 horas, no -16
    const dur=s>=e?s-e:(1440-e)+s;
    if(dur>0&&dur<=16*60)tramos.push({entrada:m[1].padStart(2,'0')+':'+m[2],salida:m[3].padStart(2,'0')+':'+m[4],minutos:dur});
  });
  const min=tramos.reduce((a,x)=>a+x.minutos,0);
  return {tramos,horas:+(min/60).toFixed(2),codigo:'',trabaja:tramos.length>0};
};

// Lee la cuadrícula: trabajadores en filas, días en columnas
const leerPlanificacion=(filas,empleados)=>{
  const avisos=[], dias=[];
  const F=(Array.isArray(filas)?filas:[]).filter(f=>Array.isArray(f));
  if(!F.length)return {mes:'',lineas:[],avisos:['La hoja está vacía.'],sinCasar:[]};
  // El mes va en la primera fila, en cualquier celda con forma AAAA-MM
  let mes='';
  for(const f of F.slice(0,4)){
    for(const c of f){
      const m=String(c==null?'':c).trim().match(/^(\d{4})-(\d{2})$/);
      if(m&&+m[2]>=1&&+m[2]<=12){mes=m[0];break;}
    }
    if(mes)break;
  }
  if(!mes)return {mes:'',lineas:[],avisos:['No encuentro el mes. Debe ir arriba con formato AAAA-MM.'],sinCasar:[]};
  // La fila de días es la que trae más números seguidos del 1 al 31
  let filaDias=-1, colDia={};
  F.forEach((f,i)=>{
    const nums={};let n=0;
    f.forEach((c,j)=>{const v=+String(c==null?'':c).trim();if(Number.isInteger(v)&&v>=1&&v<=31){nums[j]=v;n++;}});
    if(n>Object.keys(colDia).length){filaDias=i;colDia=nums;}
  });
  if(filaDias<0||Object.keys(colDia).length<20)
    return {mes,lineas:[],avisos:['No encuentro la fila con los días del mes.'],sinCasar:[]};
  Object.values(colDia).forEach(d=>dias.push(d));

  const plantilla=(Array.isArray(empleados)?empleados:[]).filter(e=>e&&e.nombre);
  const casar=(nombre)=>{
    const n=normProvNombre(nombre);
    if(!n)return null;
    return plantilla.find(e=>normProvNombre(e.nombre)===n)
      // «PÉREZ GARCÍA, JUAN» y «JUAN PÉREZ GARCÍA» son la misma persona
      ||plantilla.find(e=>{
        const a=normProvNombre(e.nombre).split(/\s+/).filter(Boolean).sort().join(' ');
        const b=n.split(/\s+/).filter(Boolean).sort().join(' ');
        return a===b;
      })||null;
  };

  const lineas=[], sinCasar=[];
  F.slice(filaDias+1).forEach(f=>{
    const nombre=String(f[0]==null?'':f[0]).trim();
    if(!nombre||/^\(/.test(nombre))return;                 // fila de ejemplo o vacía
    const emp=casar(nombre);
    if(!emp){sinCasar.push(nombre);return;}
    Object.entries(colDia).forEach(([col,dia])=>{
      const t=leerTurno(f[+col]);
      if(!t.trabaja&&!t.codigo)return;                     // día en blanco: no se guarda nada
      lineas.push({empleadoId:emp.id, nombre:emp.nombre,
        fecha:`${mes}-${String(dia).padStart(2,'0')}`,
        tramos:t.tramos, horas:t.horas, codigo:t.codigo});
    });
  });
  if(sinCasar.length)avisos.push(`No están en la plantilla: ${sinCasar.join(', ')}`);
  if(!lineas.length)avisos.push('No he encontrado ningún horario que importar.');
  return {mes,lineas,avisos,sinCasar,dias};
};

const resumenPlan=(lineas)=>{
  const l=Array.isArray(lineas)?lineas:[];
  const porEmp={};
  l.forEach(x=>{
    const k=x.empleadoId;
    porEmp[k]=porEmp[k]||{nombre:x.nombre,dias:0,horas:0,ausencias:0};
    if(x.codigo)porEmp[k].ausencias++; else {porEmp[k].dias++;porEmp[k].horas+=x.horas;}
  });
  Object.values(porEmp).forEach(e=>{e.horas=+e.horas.toFixed(2);});
  return {porEmp:Object.values(porEmp).sort((a,b)=>a.nombre.localeCompare(b.nombre)),
    totalHoras:+l.reduce((a,x)=>a+(x.horas||0),0).toFixed(2),
    totalDias:l.filter(x=>!x.codigo).length,
    totalAusencias:l.filter(x=>x.codigo).length};
};
export {normProvNombre,DIAS_SEMANA,JORNADA_VACIA,letraDia,horasSemanales,jornadaPrevista,horasDeRegistros,cuadreDia,CODIGOS_PLAN,leerTurno,leerPlanificacion,resumenPlan};
