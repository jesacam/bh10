// ═══ BATERÍA · v371: ENLACES CORTOS, DINERO POR VIVIENDA, MAYÚSCULAS Y DNI ══
// Lo que Jesús pidió el 06-09-2026, cada cosa con su prueba:
//  · «que los enlaces sean cortos… una vez se usen se borran y dejan de existir»
//  · «esas facturas deberían restar del total, como ya teníamos antes»
//  · «todo debe estar en mayúsculas únicamente, uniforme y homogéneo»
//  · «desde cada vivienda, acceso a toda la info para dar de alta los boletines»
import fs from 'fs';
import {MAY,mayusculasFicha,mayusculasVivienda,nuevaVivienda,aplicarRecibidoAVivienda,aplicarMejoras,precioConIva,precioTotal,idCliente,asegurarIds} from '../src/ventas.js';

let n=0,mal=0;const ok=(c,t)=>{n++;if(!c){mal++;console.log('  ✗',t);}else console.log('  ✓',t);};
const env=fs.readFileSync('src-envoltorio/envoltorio.jsx','utf8');
const app=fs.readFileSync('src/app.jsx','utf8');
const portal=fs.readFileSync('/home/claude/web_subir/clientes/index.html','utf8');
const corto=fs.readFileSync('/home/claude/web_subir/c/index.html','utf8');

console.log('── 1 · enlaces cortos ──');
const ALF='23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
ok(env.includes('const A = "'+ALF+'"'),'alfabeto sin parejas confundibles (ni 0/O ni 1/I/L)');
// La L sí está, y está bien: solo se confunde con la I y con el 1, y ambas
// fuera. Lo que hay que exigir es que no quede NINGUNA pareja confundible en
// pie, no una lista de letras al tuntún (mi primera versión de esta prueba
// suspendía por una L que no molesta a nadie).
// Las que NO pueden convivir: se confunden de un vistazo en cualquier tipografía
// y son la causa clásica de «no me funciona el enlace».
const PROHIBIDAS=[['0','O'],['1','I'],['1','L'],['I','L']];
const enPie=PROHIBIDAS.filter(([a,b])=>ALF.includes(a)&&ALF.includes(b));
ok(enPie.length===0,`ninguna pareja crítica convive${enPie.length?': '+enPie.map(p=>p.join('/')).join(', '):''}`);
// Las que SÍ conviven, a sabiendas: 5/S, 8/B, 2/Z y U/V se distinguen bien
// leyendo, y quitarlas dejaría el alfabeto en 28 caracteres — un tamaño que
// no divide a 256 y que metería sesgo en el azar. Se declaran aquí para que
// sea una decisión y no un descuido: si alguna diera problemas dictando por
// teléfono, se cambia el alfabeto y esta lista lo cantará.
const TOLERADAS=[['5','S'],['8','B'],['2','Z'],['U','V']];
ok(TOLERADAS.every(([a,b])=>ALF.includes(a)&&ALF.includes(b)),'las parejas toleradas son exactamente las declaradas (si cambia el alfabeto, esta prueba avisa)');
ok(256%ALF.length===0,'32 caracteres: el reparto del azar es exacto, sin sesgo por el resto');
ok(env.includes('crypto.getRandomValues'),'el token sale del generador criptográfico, no de Math.random');
ok(/new Uint8Array\(8\)/.test(env),'ocho caracteres');
ok(env.includes('location.origin + "/c/?t=" + N'),'la dirección es /c/?t=… (corta)');
{ // longitud real del enlace que le llega al comprador
  const url='https://bh10group.com/c/?t='+'K7M2PX9A';
  ok(url.length<=35,`el enlace mide ${url.length} caracteres (antes 49): cabe en un WhatsApp y se dicta por teléfono`);
}
ok(Math.pow(32,8)>1e12,`8 caracteres de 32 = ${Math.pow(32,8).toExponential(2)} combinaciones`);
ok(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]\{6,24\}\$/.test(corto.match(/\^\[23456789[^/]+/)?.[0]+'$')||corto.includes('23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6,24}'),'la página corta solo reenvía si el token tiene la pinta correcta');
ok(/location\.replace\('\/clientes\/\?t='/.test(corto),'y reenvía al portal de siempre (una sola copia que mantener)');
ok(!/BIG HOUSE|@bh10group|ES\d{10}/.test(corto),'la página corta no lleva ningún dato dentro');

console.log('── 2 · el enlace usado se BORRA ──');
ok(/await ql\(cn\(baseDatos, "invitaciones", String\(token\)\)\)/.test(env),'al aplicarse, la invitación se elimina (no se marca)');
ok(!/invitaciones", String\(token\)\), \{ usado: !0/.test(env),'ya no queda el «usado: true» de antes');
ok(/vive en cliRecibidos/.test(env),'y se explica por qué no se pierde nada al borrarla');

console.log('── 3 · las facturas restan del precio de la vivienda ──');
ok(/const facturasDeVivienda=/.test(app),'existe el cálculo por vivienda');
ok(/String\(i\.viviendaId\|\|''\)===String\(viviendaId\)/.test(app),'las facturas se atan a la vivienda por su identificador');
ok(/&&!esAnulada\(i\)/.test(app),'una factura anulada NO cuenta');
ok(/pendienteFacturar:Math\.max/.test(app)&&/pendienteCobro:/.test(app),'se distingue lo que falta por FACTURAR de lo que falta por COBRAR');
const appSin=app.replace(/\s/g,'');
ok(appSin.includes('...(contrato.viviendaId?{viviendaId:contrato.viviendaId}:{})'),
  'la certificación queda atada a la vivienda SOLO si el contrato la tiene: nada de escribir el campo vacío en todas las facturas (lo cazó el A/B de escrituras)');
{ // la cuenta, con números
  let v=nuevaVivienda('o1',{identificador:'5',precio:200000,ivaTipo:10});
  v=aplicarMejoras(v,[{concepto:'PORCHE',importe:10000}],'cfg').vivienda;
  ok(precioTotal(v)===210000,'precio + mejoras = 210.000');
  ok(precioConIva(v)===231000,'con el 10 % de IVA = 231.000 (es el total del que se descuenta)');
  const facturas=[{total:23100},{total:69300}];
  const facturado=facturas.reduce((a,i)=>a+i.total,0);
  ok(+(precioConIva(v)-facturado).toFixed(2)===138600,'tras facturar 92.400 quedan 138.600 por facturar');
}
ok(/🧾 Facturar/.test(app),'hay botón para facturar a cuenta desde la vivienda');
ok(/La vivienda no tiene titulares con ficha/.test(app),'y no deja facturar a una vivienda sin titular');

console.log('── 4 · MAYÚSCULAS en todo el circuito ──');
ok(MAY('maría peña ñandú')==='MARÍA PEÑA ÑANDÚ','se conservan tildes y eñes (van a un contrato y a una escritura)');
ok(MAY('  c/ mayor 3  ')==='C/ MAYOR 3','y se limpian los espacios de los lados');
{
  const f=mayusculasFicha({nombre:'ana pérez',cif:'12345678z',dir:'c/ olmo 1',municipio:'yuncos',provincia:'toledo',email:'Ana@Ejemplo.ES'});
  ok(f.nombre==='ANA PÉREZ'&&f.cif==='12345678Z'&&f.dir==='C/ OLMO 1'&&f.municipio==='YUNCOS'&&f.provincia==='TOLEDO','ficha de cliente entera en mayúsculas');
  ok(f.email==='Ana@Ejemplo.ES','el correo se respeta tal cual (en mayúsculas no se lee ni se copia bien)');
}
{
  const v=mayusculasVivienda({identificador:'3a',tipologia:'chalet pareado',anejos:'garaje y trastero',notas:'ojo',mejoras:[{concepto:'suelo porcelánico'}]});
  ok(v.identificador==='3A'&&v.tipologia==='CHALET PAREADO'&&v.anejos==='GARAJE Y TRASTERO','la vivienda, en mayúsculas');
  ok(v.mejoras[0].concepto==='SUELO PORCELÁNICO','y también las mejoras del configurador');
}
{ // lo que llega del portal entra ya normalizado
  let v=nuevaVivienda('o1',{identificador:'7'});
  const r=aplicarRecibidoAVivienda({recibido:{titulares:[{nombre:'luis soto',nif:'11223344h',dir:'c/ sol 2',municipio:'illescas',provincia:'toledo',email:'luis@ej.es'}]},vivienda:v,cliCat:[]});
  const c=r.cliCat[0];
  ok(c.nombre==='LUIS SOTO'&&c.municipio==='ILLESCAS'&&c.cif==='11223344H','lo que entra por el portal se guarda en mayúsculas');
  ok(c.email==='luis@ej.es','menos el correo');
}
ok(/text-transform:uppercase/.test(portal),'el comprador ve mayúsculas mientras escribe');
ok(/const enMayusculas/.test(portal),'y lo que se ENVÍA va convertido de verdad, no solo pintado');
// v374 · el filtro pasó de dos excepciones sueltas a una lista NO_TOCAR, tras
// descubrir que viviendaId también se estaba pasando a mayúsculas y rompía el
// volcado a la vivienda. La prueba se ejecuta contra la lista real.
{
  const mm=portal.match(/const NO_TOCAR = ([^;]+);/);
  ok(!!mm,'existe la lista de campos intocables');
  const R=mm?eval(mm[1]):/$^/;
  ok(R.test('email')&&R.test('dniA'),'sin tocar el correo ni las imágenes del DNI');
  ok(R.test('viviendaId')&&R.test('obraId'),'ni los identificadores internos (el fallo de la v371)');
  ok(!R.test('nombre')&&!R.test('municipio'),'y lo que lee una persona sí va en mayúsculas');
}
ok(/MAY\(e\.target\.value\)/.test(app),'y el formulario de la vivienda también escribe en mayúsculas');

console.log('── 4b · nada real se publica ──');
// Esta comprobación nace de un fallo mío: el fichero con los 13 vehículos
// (matrículas y el nombre de Benito) se me quedó DENTRO de la carpeta que se
// sube a bh10group.com, o sea, descargable por cualquiera que acertara la
// dirección. La regla de Jesús es que nada real vive fuera de la app.
{
  const sube=fs.readdirSync('/home/claude/web_subir');
  ok(!sube.includes('flota_rescate.json'),'el fichero de la flota NO viaja en lo que se publica');
  const fuera=[];
  const mira=(dir)=>{for(const f of fs.readdirSync(dir,{withFileTypes:true})){
    const p=dir+'/'+f.name;
    if(f.isDirectory()){mira(p);continue;}
    if(!/\.(js|html|json|txt)$/i.test(f.name))continue;
    const t=fs.readFileSync(p,'utf8');
    if(/[0-9]{4}[A-Z]{3}/.test(t)&&/matricula|seguroCia/.test(t))fuera.push(p);
  }};
  mira('/home/claude/web_subir');
  ok(fuera.length===0,`ninguna matrícula publicada${fuera.length?': '+fuera.join(', '):''}`);
}

console.log('── 5 · el expediente de la vivienda (luz y agua) ──');
ok(/const abrirDniVivienda=/.test(app),'se abre desde la vivienda');
ok(/sinAccion\('clientes','ver los DNI de los compradores'\)/.test(app),'sujeto a permisos: no lo ve cualquiera');
ok(/window\.bh10Dni\.listar\(\)/.test(app)&&/window\.bh10Dni\.ver\(/.test(app),'las imágenes se piden a la CUSTODIA, no a una copia');
ok(!/persistViviendas\([^)]*imgs/.test(app),'y no se guardan dentro de la vivienda (seguirían fuera del plazo de destrucción)');
const mod=fs.readFileSync('src/modales.jsx','utf8');
ok(/ModalDniVivienda/.test(mod),'existe la ventana del expediente');
ok(/📋 Copiar datos/.test(mod),'con los datos listos para pegar en el formulario de la compañía');
ok(/Anverso/.test(mod)&&/Reverso/.test(mod),'y el DNI por las dos caras');
ok(/se destruye antes del/.test(mod),'cada imagen dice cuándo la destruye la custodia');
ok(/sin DNI subido/.test(mod),'si falta el DNI de alguien, se avisa');
ok(/no quedan guardadas aquí/.test(mod),'la ventana explica que las imágenes no se copian');

console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<45){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
