// ═══ BATERÍA · EL BUZÓN (v375) ════════════════════════════════════════════
// Jesús (06-09-2026): «cómo ves crear una bandeja de notificaciones recibidas
// (llegarán contratos de arras, de reserva, info de clientes…)» · «el buzón lo
// veo yo solo» · «lo montaría como un KPI dentro de panel con capacidad de
// moverlo como el resto de cosas».
import fs from 'fs';
let n=0,mal=0;const ok=(c,t)=>{n++;if(!c){mal++;console.log('  ✗',t);}else console.log('  ✓',t);};
const app=fs.readFileSync('src/app.jsx','utf8');
const mod=fs.readFileSync('src/modales.jsx','utf8');

console.log('── 1 · la caseta del Panel ──');
ok(/'n-buzon',/.test(app),'está dada de alta en KPI_IDS: se puede colocar y redimensionar como las demás');
ok(/id:'n-buzon',p:\{tipo:'cont',label:'📥 Buzón'/.test(app),'sale como caseta de contador, con el resto');
ok(/\.\.\.\(!esMiembro\(\)\?\[\{id:'n-buzon'/.test(app),'solo la ve el dueño');
// v376 · Jesús: «me gustaría verlo siempre para que tenga su lugar fijo en el
// panel». Una caseta que aparece y desaparece no sirve para acostumbrarse.
ok(!/buzonTodo\.total>0\?\[\{id:'n-buzon'/.test(app),'y está SIEMPRE, no solo cuando hay algo');
ok(/buzonTodo\.total===0\?'sin novedades'/.test(app),'cuando no hay nada pendiente, lo dice en vez de esconderse');
ok(/color:buzonTodo\.urgente>0\?C\.dn:\(buzonTodo\.total>0\?C\.wn:C\.mt\)/.test(app),'roja con algo urgente, ámbar con lo demás, gris cuando está vacía');

console.log('── 2 · la cuenta, de las cuatro fuentes que ya existen ──');
ok(/const buzonTodo=useMemo/.test(app),'se calcula de lo que ya hay, no de un almacén nuevo');
{ // se ejecuta la lógica real del contador, con datos de mentira
  const m=app.match(/const buzonTodo=useMemo\(\(\)=>\{([\s\S]*?)\},\[docsVenta/);
  ok(!!m,'el cuerpo del contador se puede leer y probar');
  const cuerpo=m[1];
  const f=new Function('docsVenta','cliRecibidos','buzon','derechos',cuerpo);
  const docs=[{id:'a',estado:'firmado'},{id:'b',estado:'firmado',visto:'2026-09-06'},{id:'c',estado:'enviado'}];
  const r=f(docs,[{id:'x'},{id:'y'}],[{id:'p'}],[{id:'d'}]);
  ok(r.firmas===1,'cuenta los contratos firmados SIN ver (el ya visto no molesta más)');
  ok(r.clientes===2&&r.proveedores===1&&r.derechos===1,'y los envíos de clientes, proveedores y derechos');
  ok(r.total===5,`el total suma las cuatro: ${r.total}`);
  ok(r.urgente===4,'lo urgente deja fuera las facturas de proveedores: no tienen plazo');
  const vacio=f([],null,[],[]);
  ok(vacio.total===0&&vacio.urgente===0,'con nada pendiente, cero (y la caseta ni aparece)');
  const soloProv=f([],[],[{id:'p'}],[]);
  ok(soloProv.total===1&&soloProv.urgente===0,'una factura de proveedor cuenta pero no pone la caseta en rojo');
}

console.log('── 3 · la ventana lleva a donde se resuelve, no duplica ──');
ok(/const ModalBuzon=/.test(mod),'existe la ventana');
ok(/irAClientesRecibidos/.test(mod)&&/irAProveedores/.test(mod)&&/irADerechos/.test(mod),'cada línea tiene su atajo a la pantalla de siempre');
ok(/verDocVenta\(d\)/.test(mod),'los contratos firmados se abren con el visor de siempre');
ok(/marcarDocVisto/.test(mod)&&/visto:today/.test(app),'«✓ Visto» los quita del buzón sin borrarlos');
ok(/Nada se aplica solo/.test(mod),'y la ventana lo dice: nada se aplica solo');
ok(!/persistCliCat|saveInvoice/.test(mod.slice(mod.indexOf('const ModalBuzon'))),'la ventana NO aplica nada por su cuenta: solo lleva');

console.log('── 4 · el contador se entera al entrar ──');
ok(/if\(window\.bh10Recibidos&&!esMiembro\(\)\)\{/.test(app),'los envíos de clientes se consultan al arrancar (antes solo al abrir la pantalla)');
ok(/console\.warn\('recibidos',e\)/.test(app),'y si falla la consulta, no tumba el arranque');

console.log('── 5 · el documento del proveedor se sigue guardando ──');
// Jesús: «acuérdate que si un proveedor sube su factura ahí, ésta debe quedar
// almacenada como cuando la escaneo». Se comprueba la cadena entera.
ok(/_file:file,_buzonId:item\.id/.test(app),'el fichero del proveedor entra como adjunto del formulario');
ok(/const _adjF=inv\._file; delete inv\._file;/.test(app),'se aparta antes de guardar la factura');
ok(/if\(_adjF\)subirAdjuntos\(\[\[inv\.id,_adjF\]\]\)/.test(app),'y se sube por el mismo camino que una foto o un escaneo, también al editar');

console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<18){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
