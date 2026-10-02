// ═══ NÓMINAS Y EMBARGOS · emparejar PDF, cuadres, IBAN, 607 LEC, giros ═══
import {normProvNombre} from './fichaje';
// ═══ CONTACTO DE LOS TRABAJADORES ═══
const emailValido=(s)=>{
  const e=String(s||'').trim();
  if(!e||e.length>254)return false;
  if(/\s/.test(e))return false;
  return /^[^@]+@[^@.]+(\.[^@.]+)+$/.test(e);
};

const PESOS_CCC=[1,2,4,8,5,10,9,7,3,6];

const tokensNombre=(s)=>normProvNombre(String(s||'').replace(/,/g,' ')).split(' ').filter(t=>t.length>=3);

const restoIban=(i)=>{
  const s=String(i==null?'':i);
  if(s.length<5)return -1;
  const mov=s.slice(4)+s.slice(0,4);
  let r=0;
  for(const c of mov){
    const v=(c>='0'&&c<='9')?c:String(c.charCodeAt(0)-55);
    for(const d of v)r=(r*10+ +d)%97;
  }
  return Number.isFinite(r)?r:-1;
};

const puedeEnviarNominaBase=(fila)=>{
  if(!fila)return {ok:false,motivo:'sin datos'};
  if(!fila.verificado||!fila.verificado.ok)return {ok:false,motivo:(fila.verificado&&fila.verificado.motivo)||'sin verificar'};
  if(!fila.blob)return {ok:false,motivo:'no se ha podido separar su hoja'};
  if(!emailValido(fila.email))return {ok:false,motivo:'falta un correo válido en su ficha'};
  return {ok:true,motivo:''};
};

import {parseNum} from './basicos';
// ═══ REPARTO DE NÓMINAS: VERIFICACIÓN PÁGINA A PÁGINA ═══
// Lo que está en juego: si una página se asigna al trabajador equivocado, esa
// persona recibe el sueldo de un compañero. No se puede confiar en el orden de
// la lista —una portada, un finiquito o una nómina de dos hojas lo desplazan
// todo—, así que cada página se lee OTRA VEZ por separado, sin saber de quién
// debería ser, y solo sale si las dos lecturas coinciden.
const normNif=(s)=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');

const normNIF=(s)=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');

const dcCCC=(diez)=>{
  const t=String(diez==null?'':diez);
  if(!/^\d{10}$/.test(t))return -1;
  const s=t.split('').reduce((a,c,ix)=>a+(+c)*PESOS_CCC[ix],0);
  const r=11-(s%11);
  return r===11?0:(r===10?1:r);
};

// ═══ VALIDACIÓN DE IBAN ═══
// Hasta v166 solo se comprobaba que el IBAN NO estuviera vacío. Un dígito de
// menos por una errata pasaba al fichero SEPA y el banco rechazaba la REMESA
// ENTERA, que es el peor sitio para enterarse. Aquí se comprueba de verdad:
// longitud del país, dígito de control internacional (mod 97) y, en España,
// también el dígito de control bancario del CCC.
const LARGO_IBAN={AD:24,AT:20,BE:16,CH:21,CZ:24,DE:22,DK:18,EE:20,ES:24,FI:18,FR:27,GB:22,
  GI:23,GR:27,HR:21,HU:28,IE:22,IS:26,IT:27,LI:21,LT:20,LU:20,LV:21,MC:27,MT:31,NL:18,
  NO:15,PL:28,PT:25,RO:24,SE:24,SI:19,SK:24,SM:27};

// Identifica al trabajador de una nómina leída. El NIF manda; por nombre solo
// se acepta si NO hay empate: con dos hermanos en plantilla y el nombre de pila
// mal leído, la versión anterior se quedaba con el primero de la lista sin
// avisar, y eso significa mandarle a uno la nómina del otro.
const emparejarEmpleado=(nom,lista)=>{
  const nif=normNIF(nom&&(nom.nif||nom.NIF));
  if(nif){
    const porNif=(lista||[]).filter(e=>e&&normNIF(e.nif)===nif);
    if(porNif.length===1)return {emp:porNif[0],via:'nif',motivo:''};
    if(porNif.length>1)return {emp:null,via:'',motivo:`hay ${porNif.length} fichas con el NIF ${nif}`};
  }
  const tn=tokensNombre((nom&&(nom.n||nom.nombre))||'');
  if(!tn.length)return {emp:null,via:'',motivo:'la nómina no trae NIF ni nombre legible'};
  const puntuadas=(lista||[]).map(e=>{
    const te=tokensNombre(e&&e.nombre);
    if(!te.length)return {e,inter:0,score:0};
    const inter=tn.filter(t=>te.includes(t)).length;
    return {e,inter,score:inter/Math.max(tn.length,te.length)};
  }).filter(x=>x.inter>=2&&x.score>=0.5).sort((a,b)=>b.score-a.score);
  if(!puntuadas.length)return {emp:null,via:'',motivo:'no hay ninguna ficha que se parezca'};
  // Empate o casi empate: preferimos no emparejar a emparejar mal
  if(puntuadas.length>1&&(puntuadas[0].score-puntuadas[1].score)<0.15)
    return {emp:null,via:'',motivo:`el nombre encaja igual de bien con ${puntuadas[0].e.nombre} y con ${puntuadas[1].e.nombre}: hace falta el NIF`};
  return {emp:puntuadas[0].e,via:'nombre',motivo:''};
};

const matchEmpleado=(nom,lista)=>emparejarEmpleado(nom,lista).emp;

// ═══ LAS CUENTAS DE LA NÓMINA TIENEN QUE CUADRAR ═══
// Una nómina se sostiene sola: líquido = devengado − salario en especie −
// aportaciones del trabajador − IRPF retenido. Si el lector se equivoca en un
// dígito, esa suma deja de salir. Es la forma de pillar una lectura mala sin
// tener que revisar 17 hojas a mano.
// ═══ REPARADOR DETERMINISTA DE UNA LECTURA CONOCIDA ═══════════════════════
// La IA confundía dos casillas de la nómina: leía «B. TOTAL A DEDUCIR» (la
// suma de TODAS las deducciones) donde debía leer «TOTAL APORTACIONES» (lo que
// aporta el trabajador a la SS). Como el total a deducir ya lleva dentro el
// IRPF y la especie, el cuadre los restaba dos veces y salía en rojo.
//
// La confusión deja una HUELLA que no admite dudas: el valor leído coincide al
// céntimo con devengado − líquido. Solo cuando se ve esa huella exacta, y solo
// si al despejar la aportación real la nómina cuadra, se corrige. Nunca en
// silencio: devuelve un aviso para pintarlo en la fila. Y NUNCA toca el
// líquido, que es el único importe que mueve dinero.
// ═══ ¿LA NÓMINA TRAE UN EMBARGO QUE NO ESTÁ EN LA FICHA? ══════════════════
// Si el recibo descuenta un embargo y el trabajador no lo tiene dado de alta,
// ese dinero se le retiene del sueldo y NO sale hacia el juzgado: no hay
// cuenta ni referencia a donde mandarlo. Antes se descartaba en silencio.
// Ahora se avisa por su nombre y con su importe.
const EMB_TXT=/embarg|retenci[oó]n\s*judicial|juzgad/i;
const embargoSinFicha=(nom,emp)=>{
  const num=(x)=>{const v=+x;return Number.isFinite(v)?v:0;};
  const imp=num(nom&&nom.otras);
  const txt=String((nom&&nom.otrasTxt)||'');
  if(imp<=0)return '';
  if(!EMB_TXT.test(txt))return '';                       // otra deducción, no un embargo
  if(emp&&String(emp.embargo||'').trim())return '';      // ya está en ficha: nada que avisar
  return `la nómina descuenta ${imp.toFixed(2)} € de embargo y NO hay embargo dado de alta`
    +`${emp?` en la ficha de ${emp.nombre}`:''}: sin la cuenta del juzgado y la referencia ese dinero no sale en la remesa`;
};

const repararNomina=(n)=>{
  const num=(x)=>{const v=+x;return Number.isFinite(v)?v:null;};
  if(!n)return {nom:n,aviso:''};
  const dev=num(n.dev), liq=num(n.liq), ss=num(n.ss);
  if(dev===null||liq===null||ss===null)return {nom:n,aviso:''};
  if(cuadraNomina(n).ok)return {nom:n,aviso:''};          // si ya cuadra, no se toca
  const totalDeducir=+(dev-liq).toFixed(2);
  if(Math.abs(ss-totalDeducir)>0.005)return {nom:n,aviso:''};  // sin la huella, no se toca
  const esp=num(n.esp)||0, ir=num(n.irC)||0, otras=num(n.otras)||0, ant=num(n.ant)||0;
  const ssReal=+(totalDeducir-ir-esp-otras-ant).toFixed(2);
  if(ssReal<0)return {nom:n,aviso:''};
  const arreglada={...n,ss:ssReal};
  if(!cuadraNomina(arreglada).ok)return {nom:n,aviso:''};  // si no cuadra, se queda en rojo
  return {nom:arreglada,
    aviso:`la Seguridad Social venía leída como el total a deducir (${ss.toFixed(2)} €): corregida a ${ssReal.toFixed(2)} €`};
};

const cuadraNomina=(n)=>{
  const num=(x)=>{const v=+x;return Number.isFinite(v)?v:null;};
  const dev=num(n&&n.dev), liq=num(n&&n.liq);
  const esp=num(n&&n.esp)||0, ss=num(n&&n.ss)||0, ir=num(n&&n.irC)||0;
  // «5. Otras deducciones» (embargo salarial, p.ej.) y anticipos: sin ellos
  // una nómina con embargo NUNCA cuadra. El embargo de RINCON son 53,70 €.
  const otras=num(n&&n.otras)||0, ant=num(n&&n.ant)||0;
  if(dev===null||liq===null)return {ok:false,motivo:'faltan el devengado o el líquido',desvio:null};
  if(dev<=0)return {ok:false,motivo:'el devengado no puede ser cero',desvio:null};
  if(liq<0)return {ok:false,motivo:'el líquido no puede ser negativo',desvio:null};
  if(liq>dev)return {ok:false,motivo:`el líquido (${liq.toFixed(2)}) no puede superar al devengado (${dev.toFixed(2)})`,desvio:null};
  if(ss<0||ir<0||esp<0||otras<0||ant<0)return {ok:false,motivo:'hay deducciones negativas',desvio:null};
  const calculado=+(dev-esp-ss-ir-otras-ant).toFixed(2);
  const desvio=+(liq-calculado).toFixed(2);
  // Un euro de margen cubre redondeos y conceptos menores (anticipos, dietas)
  if(Math.abs(desvio)>1)
    return {ok:false,desvio,motivo:`las cuentas no cuadran: ${dev.toFixed(2)} − ${esp.toFixed(2)} − ${ss.toFixed(2)} − ${ir.toFixed(2)}${otras?' − '+otras.toFixed(2):''}${ant?' − '+ant.toFixed(2):''} = ${calculado.toFixed(2)}, pero pone ${liq.toFixed(2)}`};
  // El IRPF declarado debe corresponderse con su porcentaje, si viene
  const irB=num(n&&n.irB), irP=num(n&&n.irP);
  if(irB!==null&&irP!==null&&irB>0&&irP>0){
    const esperado=+(irB*irP/100).toFixed(2);
    if(Math.abs(esperado-ir)>Math.max(1,esperado*0.02))
      return {ok:false,desvio,motivo:`el IRPF no cuadra con su porcentaje: ${irP}% de ${irB.toFixed(2)} serían ${esperado.toFixed(2)} y pone ${ir.toFixed(2)}`};
  }
  return {ok:true,motivo:'',desvio};
};

const normIban=(s)=>String(s||'').replace(/[^A-Za-z0-9]/g,'').toUpperCase();

const problemaIban=(s)=>{
  const i=normIban(s);
  if(!i)return 'falta el IBAN';
  if(!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(i))return 'no tiene forma de IBAN';
  const esperado=LARGO_IBAN[i.slice(0,2)];
  if(esperado&&i.length!==esperado)
    return `tiene ${i.length} caracteres y ${i.slice(0,2)} usa ${esperado}${i.length<esperado?` (faltan ${esperado-i.length})`:` (sobran ${i.length-esperado})`}`;
  if(!esperado&&(i.length<15||i.length>34))return 'longitud imposible para un IBAN';
  if(restoIban(i)!==1)return 'el dígito de control no cuadra: hay algún número mal';
  if(i.slice(0,2)==='ES'){
    const ent=i.slice(4,8), ofi=i.slice(8,12), dc=i.slice(12,14), cta=i.slice(14);
    if(`${dcCCC('00'+ent+ofi)}${dcCCC(cta)}`!==dc)return 'el dígito de control del banco no cuadra';
  }
  return '';
};

const ibanOk=(s)=>!problemaIban(s);

// ═══ REPARAR UN IBAN MAL LEÍDO ═══
// El lector confunde letras y cifras (O↔0, I/L↔1, S↔5, B↔8). Solo se toca la
// parte que va tras el país, y solo se acepta si el dígito de control CUADRA
// tras la reparación; si no, se devuelve tal cual y el aviso de IBAN salta.
const reparaIban=(v)=>{
  const n=normIban(v); if(!n||ibanOk(n))return n;
  const mapa={O:'0',I:'1',L:'1',S:'5',B:'8'};
  const rep=n.slice(0,2)+n.slice(2).replace(/[OILSB]/g,ch=>mapa[ch]);
  return ibanOk(rep)?rep:n;
};

// ═══ TRANSFERENCIAS DE EMBARGO EN LA REMESA DE NÓMINAS ═══
// Si el trabajador tiene anotados cuenta del juzgado, concepto e importe, su
// retención viaja EN LA MISMA REMESA como transferencia aparte. Reglas duras:
// sin cuenta válida o sin importe NO se genera nada y se avisa — inventarse
// un pago a un juzgado es peor que no hacerlo.
// La nómina leída vale para su mes: si la remesa se ejecuta dos meses (o más)
// después del periodo leído, probablemente falta pasar el PDF del mes corriente
const nominaVieja=(periodo,fechaEjec)=>{
  const p=String(periodo||'').slice(0,7), f=String(fechaEjec||'').slice(0,7);
  if(!/^\d{4}-\d{2}$/.test(p)||!/^\d{4}-\d{2}$/.test(f))return false;
  const meses=(a)=>+a.slice(0,4)*12
+(+a.slice(5,7));
  return meses(f)-meses(p)>=2;
};

const embargosDe=(e)=>{
  if(!e)return [];
  if(Array.isArray(e.embargos))return e.embargos.filter(x=>x&&String(x.ref||'').trim());
  // Fichas antiguas: un solo embargo en campos sueltos
  if(String(e.embargo||'').trim())return [{id:'leg',ref:e.embargo,titular:e.embargoTitular||'',
    iban:e.embargoIban||'',concepto:e.embargoConcepto||''}];
  return [];
};

const claveEmb=(e,em)=>String((e&&(e.id||e.nombre))||'')+'|'+String((em&&(em.id||em.ref))||'');

const transferenciasEmbargo=(lista,excluidos)=>{
  const ex=excluidos||{};
  const out=[];
  (Array.isArray(lista)?lista:[]).forEach(e=>{
    const embsTodos=embargosDe(e);
    const embs=embsTodos.filter(em=>!ex[claveEmb(e,em)]); if(!embs.length)return;
    const hayApartados=embs.length!==embsTodos.length;
    const lect=e&&e.embargoLeido, leidoOk=lect&&Number.isFinite(+lect.imp);
    if(!leidoOk){out.push({invalido:true,nombre:e.nombre||'',motivo:'sin nómina leída: pasa el PDF de la gestoría por el reparto para coger el importe'});return;}
    // La nómina del mes ya no trae embargo: TODOS se dan por cancelados
    if(+lect.imp<=0){out.push({cancelado:true,nombre:e.nombre||'',periodo:lect.periodo||''});return;}
    const varios=embsTodos.length>1; let suma=0, validos=0;
    embs.forEach(em=>{
      const iban=normIban(em.iban||'');
      const ref=String(em.ref||'').trim();
      if(!iban){out.push({invalido:true,nombre:e.nombre||'',motivo:ref+': falta la cuenta del juzgado'});return;}
      if(!ibanOk(iban)){out.push({invalido:true,nombre:e.nombre||'',motivo:ref+': la cuenta del juzgado tiene el IBAN mal'});return;}
      // Con UN embargo, el importe lo dicta la nómina; con VARIOS, cada
      // diligencia trae el suyo y se cuadra contra el total de la nómina
      const imp=varios?+(parseNum(em.importe)||0).toFixed(2):+(+lect.imp).toFixed(2);
      if(varios&&imp<=0){out.push({invalido:true,nombre:e.nombre||'',motivo:ref+': con varios embargos, pon el importe de cada diligencia'});return;}
      const titular=String(em.titular||'').trim();
      suma+=imp; validos++;
      out.push({clave:claveEmb(e,em),nombre:e.nombre||'',ref,iban,importe:imp,periodo:lect.periodo||'',
        beneficiario:(titular||('EMBARGO '+(e.nombre||''))).slice(0,70),
        concepto:String(em.concepto||('EMBARGO '+ref)).trim().slice(0,135)});
    });
    if(varios&&validos>0&&!hayApartados&&Math.abs(suma-(+lect.imp))>0.02)
      out.push({descuadre:true,nombre:e.nombre||'',suma:+suma.toFixed(2),leido:+(+lect.imp).toFixed(2)});
  });
  return out;
};

// ═══ EMBARGO DE SUELDO — ART. 607 LEC ═══
// Sobre el LÍQUIDO mensual: el primer SMI es inembargable; lo que exceda se
// retiene por tramos de un SMI cada uno: 30%, 50%, 60%, 75% y 90% del resto.
// El SMI se pasa como dato (cambia cada año). Esto es la escala general: la
// diligencia concreta MANDA — cargas familiares, pensiones de alimentos o
// varios embargos concurrentes la alteran, y eso no se adivina desde aquí.
const calcEmbargo607=(liquido,smi)=>{
  const L=parseNum(liquido)||0, S=parseNum(smi)||0;
  if(L<=0||S<=0)return {retenible:0,tramos:[]};
  const pct=[0.30,0.50,0.60,0.75];
  let resto=L-S, ret=0; const tramos=[];
  if(resto<=0)return {retenible:0,tramos:[{hasta:'1er SMI',base:+L.toFixed(2),pct:0,cuota:0}]};
  tramos.push({hasta:'1er SMI',base:S,pct:0,cuota:0});
  for(let i=0;i<pct.length&&resto>0;i++){
    const base=Math.min(resto,S); const cuota=+(base*pct[i]).toFixed(2);
    tramos.push({hasta:(i+2)+'º SMI',base:+base.toFixed(2),pct:pct[i]*100,cuota});
    ret+=cuota; resto-=base;
  }
  if(resto>0){const cuota=+(resto*0.90).toFixed(2);
    tramos.push({hasta:'resto',base:+resto.toFixed(2),pct:90,cuota}); ret+=cuota;}
  return {retenible:+ret.toFixed(2),tramos};
};

const nifIgual=(a,b)=>{const x=normNif(a),y=normNif(b);return !!x&&x===y;};

const verificarPaginaNomina=(esperado,leido,nifsPlantilla)=>{
  if(!esperado||!normNif(esperado.nif))return {ok:false,motivo:'la ficha no tiene NIF: no hay forma de comprobar de quién es la página'};
  if(!leido)return {ok:false,motivo:'no se ha podido leer la página por separado'};
  if(!normNif(leido.nif))return {ok:false,motivo:'la página no muestra un NIF legible'};
  if(!nifIgual(esperado.nif,leido.nif))
    return {ok:false,motivo:`esa página es de ${leido.nombre||normNif(leido.nif)}, no de ${esperado.nombre||normNif(esperado.nif)}`};
  // ¿aparece alguien más en la misma hoja?
  const ajenos=(leido.nifs||[]).filter(n=>normNif(n)&&!nifIgual(n,esperado.nif));
  const deLaPlantilla=ajenos.filter(n=>(nifsPlantilla||[]).some(x=>nifIgual(x,n)));
  if(deLaPlantilla.length)return {ok:false,motivo:'en esa hoja aparecen datos de otra persona de la plantilla'};
  // El líquido puede venir escrito a la española («1.234,56»): con +texto
  // salía NaN, el importe quedaba a 0 y ESTA COMPROBACIÓN SE SALTABA EN
  // SILENCIO — justo la que evita que alguien cobre lo que no es.
  const a=parseNum(esperado.liq), b=parseNum(leido.liq);
  if(Number.isFinite(a)&&Number.isFinite(b)&&a>0&&b>0&&Math.abs(a-b)>0.02)
    return {ok:false,motivo:`el líquido no cuadra: la ficha dice ${a.toFixed(2)} y la hoja ${b.toFixed(2)}`};
  return {ok:true,motivo:''};
};

// Un trabajador solo puede recibir su nómina si la verificación pasó Y hay
// correo válido. Ninguna otra combinación abre el envío.
// Arma el correo de un trabajador. Es una función aparte y sin efectos para
// poder comprobarla: el nombre del fichero, el destinatario, el asunto y el
// cuerpo tienen que referirse SIEMPRE a la misma persona. Si algo no cuadra
// devuelve error y no hay nada que enviar.
const prepararEnvioNomina=(fila,periodo,empresa)=>{
  const p=puedeEnviarNominaBase(fila);
  if(!p.ok)return {error:p.motivo};
  const limpio=String(fila.nombre||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,40);
  const per=String(periodo||'');
  return {
    para:String(fila.email).trim(),
    asunto:`Nómina ${per}`.trim(),
    archivo:`Nomina_${per}_${limpio||'trabajador'}.pdf`,
    // El destinatario va también dentro del texto: si al final acaba en otro
    // buzón, quien lo reciba ve en el acto que no era para él.
    cuerpo:`Hola${fila.nombre?', '+String(fila.nombre).split(',').slice(-1)[0].trim().toLocaleLowerCase('es').replace(/(^|[\s-])([a-záéíóúñü])/g,(m,a,b)=>a+b.toLocaleUpperCase('es')):''}:\n\n`+
      `Te adjunto tu nómina de ${per}.\n\n`+
      `Destinatario: ${String(fila.email).trim()}\n\n`+
      `Un saludo,\n${empresa||''}`.trimEnd(),
  };
};

const puedeEnviarNomina=puedeEnviarNominaBase;
export {emailValido,PESOS_CCC,tokensNombre,restoIban,puedeEnviarNominaBase,normNif,normNIF,dcCCC,LARGO_IBAN,emparejarEmpleado,matchEmpleado,cuadraNomina,repararNomina,embargoSinFicha,normIban,problemaIban,ibanOk,reparaIban,nominaVieja,embargosDe,claveEmb,transferenciasEmbargo,calcEmbargo607,nifIgual,verificarPaginaNomina,prepararEnvioNomina,puedeEnviarNomina};
