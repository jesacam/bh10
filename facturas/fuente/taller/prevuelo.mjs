// ═══ LANZADOR DEL PRE-VUELO · un solo comando, para en el primer fallo ═══
// Uso: node taller/prevuelo.mjs   (desde la raíz del paquete de fuente)
import {execSync} from 'child_process';
const pasos=[
 ['nombres sueltos',        'node taller/comprobar_sueltos.mjs'],
 ['compilar app',           'node taller/build_app.mjs'],
 ['compilar envoltorio',    'node taller/build_envoltorio.mjs'],
 ['render (3 permisos)',    'node taller/bateria_render.mjs'],
 ['saldos (datos reales)',  'node taller/bateria_saldos.mjs'],
 ['lector: filtros sí',     'node taller/bateria_lector_filtros.mjs'],
 ['casillas de Ajustes',         'node taller/bateria_acordeon.mjs'],
 ['Ajustes estable',        'node taller/bateria_estabilidad_aj.mjs'],
 ['referencia v313',         'node -e "import(\'fs\').then(async fs=>{if(!fs.existsSync(\'ref/bh10-REF313.js\')){const{execSync}=await import(\'child_process\');execSync(\'node taller/build_ref313.mjs\',{stdio:\'inherit\'})}else console.log(\'ya está\')})"'],
 ['A/B 7 pantallas',        'node taller/bateria_ab_completa.mjs'],
 ['A/B escrituras',         'node taller/bateria_ab_escrituras.mjs'],
 ['títulos de Ajustes',      'node taller/bateria_ajustes_titulos.mjs'],
 ['modales extraídos',      'node taller/bateria_modales.mjs'],
 ['auditoría de contratos',  'node taller/auditar_modales.mjs'],
 ['form factura profunda',   'node taller/bateria_form_factura.mjs'],
 ['negocio: IVA·contratos·PDF','node taller/bateria_negocio.mjs'],
 ['retenciones de garantía','node taller/bateria_retenciones.mjs'],
 ['VERI*FACTU completo',     'node taller/bateria_verifactu.mjs'],
 ['QR VERI*FACTU',          'node taller/bateria_qr.mjs'],
 ['embargos 607 LEC',       'node taller/bateria_embargos.mjs'],
 ['envoltorio (login real)','node taller/bateria_envoltorio.mjs'],
 ['orden de hooks',         'node taller/bateria_hooks.mjs'],
 ['partidas extra',         'node taller/bateria_extras.mjs'],
 ['contratos de venta (v370)','node taller/bateria_contratos_venta.mjs'],
 ['firma en el móvil (v370)','node taller/bateria_firma.mjs'],
 ['enlaces·dinero·mayúsculas·DNI (v371)','node taller/bateria_v371.mjs'],
 ['ventana de enlace y tarjeta (v372)','node taller/bateria_v372.mjs'],
 ['foco del portal (v373)','node taller/bateria_portal_foco.mjs'],
 ['identificadores·borrar cliente·bancos (v374)','node taller/bateria_v374.mjs'],
 ['el buzón (v375)','node taller/bateria_buzon.mjs'],
 ['lectores·proveedor·cotitulares (v376)','node taller/bateria_v376.mjs'],
 ['proforma → definitiva (v377)','node taller/bateria_proforma.mjs'],
 ['orden de las ventanas (v378)','node taller/bateria_capas.mjs'],
 ['IA por Worker en TODAS las empresas (v379)','node taller/bateria_v379.mjs'],
 ['pagar anticipos y parciales (v380)','node taller/bateria_pagos.mjs'],
 ['la remesa apunta los pagos (v382)','node taller/bateria_remesa_pagos.mjs'],
 ['documentos que faltan, en Gmail (v383)','node taller/bateria_gmail_docs.mjs'],
 ['enganchar a mano y que se quede (v385)','node taller/bateria_enganche.mjs'],
 ['expediente de obra: lista, casado y N/A (v389)','node taller/bateria_expediente_obra.mjs'],
 ['remesas con importe manual y restos (v389)','node taller/bateria_remesa_parcial.mjs'],
 ['A/B producción·pantallas','node taller/bateria_ab_v324.mjs'],
 ['A/B producción·escrituras','node taller/bateria_esc_v324.mjs'],
 ['escrituras de dominios','node taller/bateria_esc_dominios.mjs'],
 ['A/B permisos vs producción','node taller/bateria_ab_permisos.mjs'],
 // OMITIDO EN ESTE COTEJO: necesita un extracto bancario real C43_*.txt que se
 // sube aparte de la copia y no llegó al contenedor.
 ['importación N43 real','echo "  · OMITIDO · falta el extracto C43_*.txt"'],
 ['facturas: ficha, altas y fusión','node taller/bateria_facturas_dominio.mjs'],
 ['nóminas reales (18 recibos)','node taller/bateria_nominas_reales.mjs'],
 ['remesa C34 + embargo','node taller/bateria_remesa_embargo.mjs'],
 ['traspasos: lógica y C34','node taller/bateria_traspasos.mjs'],
 ['traspaso en pantalla','node taller/bateria_traspaso_pantalla.mjs'],
 ['generadores de fichero','node taller/bateria_generadores.mjs'],
 ['SEPA estricta (norma)','node taller/bateria_sepa_estricta.mjs'],
 ['VERI*FACTU vs norma AEAT','node taller/bateria_verifactu_norma.mjs'],
 ['expediente notaría (RGPD)','node taller/bateria_expediente.mjs'],
 ['numeración de emitidas','node taller/bateria_numeracion.mjs'],
 ['serie: guarda y sobrevive','node taller/bateria_serie.mjs'],
 ['certificar → registro VERI*FACTU','node taller/bateria_rectificativa.mjs'],
 ['lectura fallida ≠ vacía','node taller/bateria_lectura_fallida.mjs'],
 ['fusión de clientes','node taller/bateria_fusion_clientes.mjs'],
 ['mapeo del lector','node taller/bateria_lector_mapeo.mjs'],
 ['borrador 303','node taller/bateria_iva303.mjs'],
 ['presupuesto personal + 240s','node taller/bateria_presupuesto.mjs'],
 ['partir remesas C34','node taller/bateria_partir.mjs'],
 ['paquete gestoría: cuadre','node taller/bateria_paquete.mjs'],
 ['documento en la nube (v352)','node taller/bateria_nube.mjs'],
 ['buscar documento en Gmail','node taller/bateria_correo.mjs'],
 ['diario de pagos (v359)','node taller/bateria_diario.mjs'],
 ['auditoría remesas y pagos','node taller/bateria_auditoria.mjs'],
 ['obras: fusiones, Excel, coste','node taller/bateria_obras.mjs'],
 ['permisos: claves y acciones','node taller/bateria_permisos_escritura.mjs'],
 ['seguridad del aparato y copia','node taller/bateria_seguridad.mjs'],
 ['ventas: viviendas y titulares','node taller/bateria_ventas.mjs'],
];
// PASOS=a-b (opcional): ejecuta solo ese tramo, con la numeración global.
// Sirve para partir el pre-vuelo cuando el entorno no aguanta 16 minutos
// seguidos; las dos mitades juntas son EXACTAMENTE el mismo pre-vuelo.
// ═══ v359 · PISCINA Y MEMORIA ══════════════════════════════════════════════
// PARALELO=n  → corre hasta n pasos a la vez (las baterías solo leen: no se
//               pisan; los pasos lentos se pasan el rato esperando a jsdom,
//               así que solapar espera reduce mucho el reloj de pared).
// ESTADO=fichero.json → apunta cada paso en verde; si el contenedor se
//               reinicia, la siguiente ejecución SALTA lo ya pasado. La
//               memoria solo vale para el mismo bundle y el mismo taller:
//               lleva su huella y se descarta si cambian.
// PASOS=a-b   → tramo (compatibilidad con la forma anterior).
import {spawn} from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
const tramo=(process.env.PASOS||'').match(/^(\d+)-(\d+)$/);
const desde=tramo?+tramo[1]:1, hasta=tramo?+tramo[2]:pasos.length;
const PARALELO=Math.max(1,+(process.env.PARALELO||1));
const ESTADO=process.env.ESTADO||'';
const huella=()=>{
  const h=crypto.createHash('sha256');
  for(const f of fs.readdirSync('taller').filter(x=>x.endsWith('.mjs')).sort())h.update(fs.readFileSync('taller/'+f));
  const assets='web_subir/app/assets';
  if(fs.existsSync(assets))for(const f of fs.readdirSync(assets).filter(x=>/^bh10-APPV\d+\.js$|^trozo-|^index-v316\.js$/.test(x)).sort())h.update(fs.readFileSync(assets+'/'+f));
  return h.digest('hex').slice(0,16);
};
const miHuella=huella();
let memoria={huella:miHuella,pasados:{}};
if(ESTADO&&fs.existsSync(ESTADO)){try{const m=JSON.parse(fs.readFileSync(ESTADO,'utf8'));if(m.huella===miHuella)memoria=m;else console.log('  (memoria descartada: cambió el bundle o el taller)');}catch(e){}}
const guarda=()=>{if(ESTADO)fs.writeFileSync(ESTADO,JSON.stringify(memoria));};
const t0=Date.now();
const cola=pasos.map((p,i)=>({n:i+1,nombre:p[0],cmd:p[1]})).filter(p=>p.n>=desde&&p.n<=hasta);
const saltados=cola.filter(p=>memoria.pasados[p.n]);
for(const p of saltados)console.log(`[${String(p.n).padStart(2)}/${pasos.length}] ${p.nombre.padEnd(24)}✓ ${memoria.pasados[p.n]}s (de memoria)`);
const pendientes=cola.filter(p=>!memoria.pasados[p.n]);
let fallo=null;const enCurso=new Set();const repetir=[];
const corre=(p)=>new Promise((res)=>{
  const t=Date.now();
  // por el shell, como hacía execSync: hay pasos con comillas (node -e "…")
  const ch=spawn(p.cmd,{shell:true,stdio:['ignore','pipe','pipe']});enCurso.add(ch);
  let out='',err='';ch.stdout.on('data',d=>out+=d);ch.stderr.on('data',d=>err+=d);
  const timer=setTimeout(()=>{ch.kill('SIGKILL');err+='\n(tiempo agotado: 600 s)';},600000);
  ch.on('close',(code)=>{clearTimeout(timer);enCurso.delete(ch);
    const seg=((Date.now()-t)/1000).toFixed(1);
    if(code===0){memoria.pasados[p.n]=seg;guarda();console.log(`[${String(p.n).padStart(2)}/${pasos.length}] ${p.nombre.padEnd(24)}✓ ${seg}s`);}
    else if(PARALELO>1&&!p.solo){
      // en paralelo, un fallo puede ser de tiempos (tres jsdom a la vez): se apunta y se repite A SOLAS al final
      console.log(`[${String(p.n).padStart(2)}/${pasos.length}] ${p.nombre.padEnd(24)}✗ (en paralelo; se repetirá a solas)`);
      repetir.push(p);
    }else{console.log(`[${String(p.n).padStart(2)}/${pasos.length}] ${p.nombre.padEnd(24)}✗ FALLO`);console.log(out.split('\n').slice(-15).join('\n'));console.log(err.split('\n').slice(-8).join('\n'));fallo=fallo||p;}
    res();});
});
// Los pasos que COMPILAN (escriben el bundle y el envoltorio) van siempre
// primero y en serie: en paralelo, un «render» importaba el bundle a medio
// escribir. El resto solo lee.
const compila=(p)=>/^compilar|^referencia/i.test(p.nombre); // compilan o construyen ficheros que otros pasos importan
const previos=pendientes.filter(compila),resto=pendientes.filter(p=>!compila(p));
for(const p of previos){await corre(p);if(fallo)break;}
if(!fallo){
  if(PARALELO===1){
    for(const p of resto){await corre(p);if(fallo)break;}
  }else{
    let k=0;
    const obrero=async()=>{while(k<resto.length&&!fallo){const p=resto[k++];await corre(p);}};
    await Promise.all(Array.from({length:Math.min(PARALELO,resto.length)},obrero));
    // segunda oportunidad, en serie y sin compañía: si aquí falla, falla de verdad
    if(!fallo&&repetir.length){
      console.log(`\n── ${repetir.length} paso(s) fallaron en paralelo: se repiten a solas ──`);
      for(const p of repetir){await corre({...p,solo:true});if(fallo)break;}
    }
  }
}
if(fallo){for(const ch of enCurso)try{ch.kill('SIGKILL');}catch(e){}process.exit(1);}
const total=cola.length,ahora=pendientes.length;
if(tramo)console.log(`\n═══ TRAMO ${desde}-${hasta} EN VERDE (${total} pasos de ${pasos.length}${ahora<total?`, ${total-ahora} de memoria`:''}) · ${((Date.now()-t0)/1000).toFixed(0)}s ═══`);
else console.log(`\n═══ PRE-VUELO COMPLETO: ${pasos.length}/${pasos.length} EN VERDE${ahora<total?` (${total-ahora} de memoria)`:''} · ${((Date.now()-t0)/1000).toFixed(0)}s ═══`);
