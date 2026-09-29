// ═══ BATERÍA · EL ORDEN DE LAS VENTANAS (v378) ════════════════════════════
// Jesús (07-09-2026): «he ido a registrar un importe cobrado que teníamos
// pendiente de una factura emitida, y la ventana nueva de registro del importe
// cobrado no se ha puesto por encima, ha habido un poco de lío».
// El modal de pago usaba la capa por defecto (80) y el detalle del KPI desde el
// que se abre está en 90: nacía DEBAJO. Cada ventana llevaba su número a mano,
// así que era cuestión de tiempo que dos se cruzaran. Esto vigila la escalera.
import fs from 'fs';
let n=0,mal=0;const ok=(c,t)=>{n++;if(!c){mal++;console.log('  ✗',t);}else console.log('  ✓',t);};
const est=fs.readFileSync('src/estetica.jsx','utf8');
const app=fs.readFileSync('src/app.jsx','utf8');
const mod=fs.readFileSync('src/modales.jsx','utf8');

console.log('── 1 · hay una escalera, con nombres ──');
const m=est.match(/const CAPAS=\{([^}]+)\}/);
ok(!!m,'existe CAPAS en estetica.jsx');
const CAPAS=m?Function('return {'+m[1]+'}')():{};
ok(/CAPAS/.test(est.match(/export \{[^}]*\}/)[0]),'y se exporta como el resto del módulo');
ok(CAPAS.VENTANA===80,'la capa de una ventana normal sigue siendo la de siempre (80): nada se mueve sin querer');
ok(CAPAS.DETALLE>CAPAS.VENTANA,'el detalle de un KPI va por encima de una ventana');
ok(CAPAS.ACCION>CAPAS.DETALLE&&CAPAS.ACCION>CAPAS.SOBRE2,'y una ACCIÓN (pagar, borrar, enseñar un enlace) por encima de TODAS las ventanas');
ok(CAPAS.ENCIMA>CAPAS.ACCION,'solo los avisos críticos quedan por encima de una acción');
{
  const vals=Object.values(CAPAS);
  ok(new Set(vals).size===vals.length,'ningún peldaño repetido: no hay dos capas empatadas');
  ok(vals.every(v=>Number.isFinite(v)&&v>0),'todos los peldaños son números válidos');
}

console.log('── 2 · el caso de Jesús, arreglado ──');
{
  const i=mod.indexOf('const ModalPagoFactura=');
  const trozo=mod.slice(i,i+1200);
  ok(/zIndex:CAPAS\.ACCION/.test(trozo),'REGISTRAR PAGO se abre en la capa de acción, por encima del detalle del KPI desde donde se pulsa');
  const detalle=CAPAS.DETALLE, pago=CAPAS.ACCION;
  ok(pago>detalle,`y con números: pago (${pago}) por encima del detalle (${detalle}) — antes era 80 contra 90`);
}
ok(/const ModalConfirmarBorrado=[\s\S]{0,600}zIndex:CAPAS\.ACCION/.test(mod),'confirmar un borrado también: se pulsa desde una ventana');
ok(/const ModalEnlace=[\s\S]{0,900}zIndex:CAPAS\.ACCION/.test(mod),'y la ventana del enlace, que sale desde la ficha de una vivienda');

console.log('── 3 · no quedan números sueltos donde importa ──');
{
  const sueltos=[...(app+mod).matchAll(/\.\.\.S\.overlay,zIndex:(\d+)/g)].map(x=>x[1]);
  ok(sueltos.length===0,`ninguna ventana lleva ya su número a mano${sueltos.length?': '+[...new Set(sueltos)].join(', '):''}`);
  const conNombre=[...(app+mod).matchAll(/\.\.\.S\.overlay,zIndex:CAPAS\.[A-Z0-9+]+/g)].length;
  ok(conNombre>=10,`y ${conNombre} usan la escalera por su nombre`);
}

console.log('── 4 · el orden real, tal y como lo verá la pantalla ──');
{
  // Se ordenan las capas como haría el navegador y se comprueba que la de
  // acción gana a cualquier ventana, que es la regla que se saltó el pago.
  const orden=Object.entries(CAPAS).sort((a,b)=>a[1]-b[1]).map(x=>x[0]);
  console.log('     de abajo arriba: '+orden.join(' → '));
  const iAccion=orden.indexOf('ACCION');
  ok(orden.slice(0,iAccion).every(x=>x!=='ENCIMA'),'ENCIMA nunca queda por debajo de ACCION');
  ok(orden[0]==='FONDO','lo que vive en la pantalla queda al fondo del todo');
  ok(orden[orden.length-1]==='ENCIMA','y el aviso crítico, arriba del todo');
}

console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<14){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
