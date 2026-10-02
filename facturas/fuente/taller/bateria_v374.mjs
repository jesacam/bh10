// ═══ BATERÍA · v374 ═══════════════════════════════════════════════════════
// Tres cosas de Jesús (06-09-2026), y una de ellas repara un fallo mío:
//  · «los datos metidos en el enlace no han volcado sobre la vivienda» → en la
//    v371 pasé TODO a mayúsculas, incluido viviendaId: el identificador dejaba
//    de casar y el envío se quedaba sin vivienda, en silencio.
//  · «he dado de alta un cliente de prueba y no podemos borrarlo».
//  · «que en la ficha del cliente avise de que no se le puede pasar a bancos».
import fs from 'fs';
let n=0,mal=0;const ok=(c,t)=>{n++;if(!c){mal++;console.log('  ✗',t);}else console.log('  ✓',t);};
const app=fs.readFileSync('src/app.jsx','utf8');
const portal=fs.readFileSync('/home/claude/web_subir/clientes/index.html','utf8');
const worker=fs.readFileSync('/home/claude/web_subir/worker_master_v374.js','utf8');

console.log('── 1 · las mayúsculas ya no rompen los identificadores ──');
const m=portal.match(/const NO_TOCAR = ([^;]+);/);
ok(!!m,'existe la lista de lo que NO se toca');
const NO_TOCAR=m?eval(m[1]):/$^/;
const MAY=x=>String(x==null?'':x).toLocaleUpperCase('es-ES').trim();
const pasa=(k,v)=>NO_TOCAR.test(k)?v:MAY(v);
ok(pasa('viviendaId','vv1m3xk2p9abc')==='vv1m3xk2p9abc','viviendaId llega INTACTO — era exactamente lo que rompía el volcado');
ok(pasa('obraId','ob2def')==='ob2def','obraId intacto');
ok(pasa('docId','dv3ghi')==='dv3ghi','docId intacto (los contratos de firma también dependían de esto)');
ok(pasa('token','XQA8AUSF')==='XQA8AUSF','el token del enlace, intacto');
ok(pasa('huella','a1b2c3')==='a1b2c3','la huella del contrato firmado, intacta');
ok(pasa('nacimiento','1980-01-01')==='1980-01-01','las fechas, intactas');
ok(pasa('email','Ana@Ejemplo.ES')==='Ana@Ejemplo.ES','el correo, tal cual');
ok(pasa('dniA','AbC')==='AbC','las imágenes del DNI, sin tocar');
// y lo que SÍ debe ir en mayúsculas sigue yendo
ok(pasa('nombre','ana pérez gil')==='ANA PÉREZ GIL','el nombre sí, con tildes');
ok(pasa('municipio','yuncos')==='YUNCOS','el municipio sí');
ok(pasa('cif','12345678z')==='12345678Z','el NIF sí');
ok(pasa('viviendaReservada','chalet 3')==='CHALET 3','y lo que el comprador escribe a mano, también');
ok(/Las mayúsculas son para\s*\n?\s*\/\/ lo que LEE una persona, nunca para lo que compara una máquina/.test(portal)||/nunca para lo que compara una máquina/.test(portal),
   'queda escrito el porqué, para que no se repita');

console.log('── 2 · borrar una ficha de cliente ──');
ok(/borrar clientes/.test(app),'existe el borrado, sujeto a permisos');
ok(/armedLabel="¿Borrar la ficha\? Toca otra vez"/.test(app),'pide doble toque');
ok(/No se puede borrar: tiene \$\{\[nFac&&nFac\+' facturas'/.test(app),'y NO deja borrar si tiene facturas, contratos o viviendas detrás');
ok(/i\.tipo==='cobro'&&!esAnulada\(i\)/.test(app),'cuenta las facturas emitidas vivas (las anuladas no frenan)');
ok(/viviendasDeCliente\(viviendas,f0\)\.length/.test(app),'y las viviendas donde figura como titular');
ok(/window\.bh10Dni\.borrar\(d\.id\)/.test(app),'al borrarlo, sus copias de DNI se destruyen: no se quedan huérfanas en la custodia');
ok(/copias de DNI destruidas/.test(app),'y te dice cuántas');

console.log('── 3 · el aviso de bancos en la ficha ──');
ok(/🚫 NO se le puede pasar a bancos/.test(app),'avisa en rojo cuando no autoriza');
ok(/retiró la autorización el/.test(app),'distingue entre no haberlo autorizado nunca y haberlo RETIRADO');
ok(/🏦 Autoriza que le pongáis en contacto/.test(app),'y en verde cuando sí, con las entidades y desde cuándo');

console.log('── 4 · borrar usuarios de verdad (Worker) ──');
ok(/accounts:delete/.test(worker),'el Worker sabe borrar la cuenta de Firebase, no solo deshabilitarla');
ok(/uid === env\.DUENO_UID.*no se borra/.test(worker),'la cuenta del dueño está protegida');
ok(/borrarUsuario/.test(app),'y la app lo ofrece');
ok(/queda libre para volver a usarlo\. No tiene vuelta atrás/.test(app),'avisando de que no tiene vuelta atrás');

console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<20){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
