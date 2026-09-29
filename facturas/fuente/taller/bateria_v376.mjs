// ═══ BATERÍA · v376 ═══════════════════════════════════════════════════════
// La mañana del 07-09-2026, en orden:
//  · «tengo un problema importante con los lectores» → era DUENO_UID, pero la
//    app solo enseñaba «Error API (403)» y el botón del Master decía «TODO
//    BIEN» sin serlo. Las dos cosas eran mías.
//  · «que antes de registrar proponga imputar la factura a algún proveedor que
//    ya esté dado de alta» (J MARTIN CARO, S.L. duplicado tres veces).
//  · «en vez de dar de alta los cotitulares mete los datos del segundo en la
//    ficha del primero».
import fs from 'fs';
let n=0,mal=0;const ok=(c,t)=>{n++;if(!c){mal++;console.log('  ✗',t);}else console.log('  ✓',t);};
const app=fs.readFileSync('src/app.jsx','utf8');
const mod=fs.readFileSync('src/modales.jsx','utf8');
const fichas=fs.readFileSync('src/fichas.js','utf8');

const normProvNombre=(s)=>{let t=String(s||'').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[.,;:()'"-]/g,' ').replace(/\b(S\s*L\s*U?|S\s*A\s*U?|C\s*B|SOCIEDAD LIMITADA|SOCIEDAD ANONIMA)\b/g,' ');return t.replace(/\s+/g,' ').trim();};
// se recorta SOLO esa función (hasta el siguiente export), no el resto del
// fichero: si no, se cuela otro `export const` dentro y no se puede ejecutar
const carga=(nombre)=>{
  const i=fichas.indexOf('export const '+nombre+'=');
  const j=fichas.indexOf('export const ',i+10);
  const cuerpo=fichas.slice(i,j<0?undefined:j).replace('export const '+nombre+'=','const '+nombre+'=');
  return new Function('normProvNombre',cuerpo+';return '+nombre+';')(normProvNombre);};

console.log('── 1 · el 403 ya dice QUÉ pasa ──');
ok(/const errorIA=async\(resp\)=>/.test(app),'hay un solo traductor de errores de la IA');
ok((app.match(/errorIA\(resp\)/g)||[]).length===4,'y los CUATRO lectores pasan por él (facturas, nóminas, hoja suelta, euríbor)');
ok(/revisa que DUENO_UID sea tu UID de Firebase/.test(app),'un 403 de «usuario no activo» apunta al DUENO_UID — que era exactamente el fallo');
ok(/revisa ANTHROPIC_KEY en el Worker/.test(app),'y un 403 de la API apunta a la clave');
ok(/cierra sesión, vuelve a entrar/.test(app),'el 401 dice qué hacer');
ok(!/throw new Error\(`Error API \(\$\{resp\.status\}\)`\);/.test(app),'ya no queda el mensaje mudo que costó la mañana');

console.log('── 2 · el Master deja de decir «TODO BIEN» cuando no lo es ──');
ok(/d\.email&&\(d\.dueno\|\|d\.activo\)/.test(app),'solo dice TODO BIEN si es dueño o miembro activo');
ok(/NO es el dueño ni un miembro activo/.test(app),'y si no, avisa de que los lectores fallarán');
ok(/📋 Copiar UID/.test(app),'con el UID a la vista para pegarlo en DUENO_UID sin buscarlo en Firebase');

console.log('── 3 · el proveedor que ya existe, propuesto ──');
{
  const proponer=carga('proponerProveedor');
  const cat=[{nombre:'J MARTIN CARO, S.L.'},{nombre:'BASTIMAR OBRAS Y SERVICIOS SL'}];
  const a=proponer('J Martín Caro S.L',cat,[]);
  ok(a.sugerido==='J MARTIN CARO, S.L.',`el caso real de Jesús: propone «${a.sugerido}»`);
  ok(a.nombre==='J MARTÍN CARO S.L','y lo leído queda en mayúsculas por si decide dejarlo');
  ok(proponer('j martin caro sl',cat,[]).sugerido==='J MARTIN CARO, S.L.','también en minúsculas');
  ok(proponer('BASTIMAR Obras y Servicios, S.L.',cat,[]).sugerido==='BASTIMAR OBRAS Y SERVICIOS SL','y con la forma societaria escrita de otra manera');
  ok(proponer('J MARTIN CARO, S.L.',cat,[]).sugerido===null,'si ya coincide exactamente, no molesta');
  ok(proponer('FERRETERIA NUEVA',cat,[]).sugerido===null,'y un proveedor de verdad nuevo no se confunde con ninguno');
  ok(proponer('ferreteria nueva',cat,[]).nombre==='FERRETERIA NUEVA','el nuevo se registra en MAYÚSCULAS, como todo');
  const conFacturas=proponer('mañas construcciones',[],[{proveedor:'MAÑAS CONSTRUCCIONES SL'}]);
  ok(conFacturas.sugerido==='MAÑAS CONSTRUCCIONES SL','busca también entre los que ya aparecen en facturas, aunque no tengan ficha');
  ok(proponer('',cat,[]).nombre==='','sin nombre no inventa nada');
}
ok(/d\._sugProv=\{nombre:p\.sugerido/.test(app),'el lector guarda la propuesta');
ok(/¿Es <b>\{form\._sugProv\.nombre\}<\/b>\?/.test(mod),'y el formulario la enseña antes de registrar');
ok(/✓ Usar el que ya existe/.test(mod)&&/Dejar lo leído/.test(mod),'se propone, no se impone: dos botones');
ok(/tendrás dos fichas del mismo proveedor/.test(mod),'y avisa de la consecuencia de no tocarlo');

console.log('── 4 · una ficha por titular ──');
{
  const f=carga('fichasDeEnvio');
  const envio={nombre:'ANA PÉREZ',cif:'12345678Z',email:'ana@ej.es',telefono:'600111222',dir:'C/ Olmo 1',municipio:'yuncos',
    titulares:[{nombre:'ana pérez',nif:'12345678z',email:'ana@ej.es',telefono:'600111222'},
               {nombre:'luis soto',nif:'87654321x',email:'luis@ej.es',telefono:'600333444'}]};
  const r=f(envio,[]);
  ok(r.cliCat.length===2,`dos titulares → DOS fichas (antes solo una): ${r.cliCat.length}`);
  const ana=r.cliCat.find(c=>c.nombre==='ANA PÉREZ'), luis=r.cliCat.find(c=>c.nombre==='LUIS SOTO');
  ok(!!ana&&!!luis,'y ambas con su nombre en mayúsculas');
  ok(luis.telefono==='600333444'&&luis.email==='luis@ej.es','el segundo lleva SU teléfono y SU correo, no los del primero');
  ok(luis.cif==='87654321X','y su propio NIF');
  ok(ana.telefono==='600111222'&&ana.email==='ana@ej.es','el primero conserva los suyos');
  ok(!/;/.test(String(ana.telefono))&&!/,/.test(String(ana.email)),'nada de dos móviles ni dos correos en la misma casilla');
  ok((ana.cotitulares||[]).includes('LUIS SOTO')&&(luis.cotitulares||[]).includes('ANA PÉREZ'),'cada uno sabe con quién comparte');
  ok(ana.municipio==='YUNCOS'&&luis.municipio==='YUNCOS','los datos comunes del envío se reparten a los dos');
  // una empresa NO se parte
  const emp=f({nombre:'BIG HOUSE 2010 SL',cif:'B45731981',esEmpresa:true,email:'a@b.es',
    titulares:[{nombre:'ANA'},{nombre:'LUIS'}]},[]);
  ok(emp.cliCat.length===1&&emp.cliCat[0].esEmpresa===true,'una EMPRESA sigue siendo una sola ficha, aunque figuren personas dentro');
  // y si ya existía, se actualiza en vez de duplicar
  const otra=f(envio,r.cliCat);
  ok(otra.cliCat.length===2&&otra.creadas.length===0&&otra.actualizadas.length===2,'aplicarlo dos veces no duplica: actualiza las dos');
}
ok(/const res=fichasDeEnvio\(\{\.\.\.r,recibidoEn:today\},cliCat\);/.test(mod),'el modal usa la función nueva');
ok(/fichas: \$\{\[\.\.\.res\.creadas/.test(mod),'y dice cuántas fichas ha tocado y cuáles');

console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<25){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
