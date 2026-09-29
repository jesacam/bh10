// ═══ VERI*FACTU · CONTRA LA NORMA DE LA AEAT ══════════════════════════════
// bateria_verifactu.mjs comprueba que la cadena de la app es coherente consigo
// misma. Eso no basta: si el orden de campos fuera el equivocado, sería
// coherente y ESTARÍA MAL, y todas las facturas quedarían inválidas ante
// Hacienda sin que ninguna batería dijese nada.
//
// Aquí se valida contra la especificación publicada (Anexo de la OM que
// desarrolla el RRSIF, «Veri-Factu_especificaciones_huella_hash_registros»),
// incluido el VECTOR DE PRUEBA OFICIAL: una cadena conocida que tiene que dar
// un hash conocido. Si el algoritmo o el orden se tocan, esa prueba cae.
import esbuild from 'esbuild';
import os from 'os';
import path from 'path';
import {webcrypto} from 'crypto';
if(!globalThis.crypto)globalThis.crypto=webcrypto;

const tmp=path.join(os.tmpdir(),'_bh10_vf_'+process.pid+'.mjs');
await esbuild.build({entryPoints:['src/verifactu.js'],bundle:true,format:'esm',outfile:tmp,logLevel:'error'});
const V=await import(tmp);
let fallos=0;
const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m);if(!c)fallos++;};

console.log('── 1 · el vector de prueba oficial de la AEAT ──');
// Publicado por la AEAT en las especificaciones de huella.
const CADENA_AEAT='IDEmisorFactura=89890001K&NumSerieFactura=12345678/G33&FechaExpedicionFactura=01-01-2024'
  +'&TipoFactura=F1&CuotaTotal=12.35&ImporteTotal=123.45&Huella=&FechaHoraHusoGenRegistro=2024-01-01T19:20:30+01:00';
const HASH_AEAT='3C464DAF61ACB827C65FDA19F352A4E3BDC2C640E9E9FC4CC058073F38F12F60';
const h=await V.vfHuella(CADENA_AEAT);
ok(h===HASH_AEAT,`la huella del vector oficial coincide: ${h.slice(0,24)}…`);
ok(h.length===64,`la huella tiene 64 caracteres (${h.length})`);
ok(/^[0-9A-F]+$/.test(h),'hexadecimal en MAYÚSCULAS, como exige la norma');

console.log('── 2 · la cadena que arma la app, campo a campo ──');
const reg={idEmisor:'89890001K',numSerie:'12345678/G33',fechaExpedicion:'01-01-2024',
  tipoFactura:'F1',cuotaTotal:12.35,importeTotal:123.45,huellaAnterior:'',
  fechaHoraHusoGenRegistro:'2024-01-01T19:20:30+01:00'};
const cad=V.vfCadenaAlta(reg);
ok(cad===CADENA_AEAT,'la app construye EXACTAMENTE la cadena del ejemplo oficial');
const ORDEN=['IDEmisorFactura','NumSerieFactura','FechaExpedicionFactura','TipoFactura',
             'CuotaTotal','ImporteTotal','Huella','FechaHoraHusoGenRegistro'];
const campos=cad.split('&').map(x=>x.split('=')[0]);
ok(JSON.stringify(campos)===JSON.stringify(ORDEN),`orden de campos exacto: ${campos.join(' → ')}`);
ok(cad.split('&').length===8,'ocho campos, ni uno más');
ok(await V.vfHuella(cad)===HASH_AEAT,'y su huella es la del vector oficial');

console.log('── 3 · el registro de ANULACIÓN ──');
const ANUL=['IDEmisorFacturaAnulada','NumSerieFacturaAnulada','FechaExpedicionFacturaAnulada',
            'Huella','FechaHoraHusoGenRegistro'];
const cadA=V.vfCadenaAnulacion(reg);
const camposA=cadA.split('&').map(x=>x.split('=')[0]);
ok(JSON.stringify(camposA)===JSON.stringify(ANUL),`orden de la anulación exacto: ${camposA.join(' → ')}`);
ok(camposA.length===5,'cinco campos en la anulación: no lleva TipoFactura ni importes');

console.log('── 4 · formatos que la AEAT valida ──');
ok(V.vfImporte(1210)==='1210.00','importes con dos decimales y punto (1210 → 1210.00)');
ok(V.vfImporte(12.5)==='12.50','12,5 → 12.50');
ok(V.vfImporte(0)==='0.00','cero → 0.00');
ok(!/,/.test(V.vfImporte(1234.5)),'nunca coma decimal en el registro');
const f=V.vfFecha('2026-08-24');
ok(f==='24-08-2026',`FechaExpedicionFactura en dd-mm-aaaa («${f}»), no ISO`);
const mt=V.vfMarcaTemporal(new Date('2026-08-24T11:00:00Z'));
ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z)$/.test(mt),
   `FechaHoraHusoGenRegistro en ISO 8601 CON huso («${mt}»)`);

console.log('── 5 · el encadenamiento ──');
const r1={...reg,huellaAnterior:''};
const h1=await V.vfHuella(V.vfCadenaAlta(r1));
const r2={...reg,numSerie:'12345678/G34',huellaAnterior:h1};
const h2=await V.vfHuella(V.vfCadenaAlta(r2));
ok(h1!==h2,'dos registros distintos dan huellas distintas');
ok(V.vfCadenaAlta(r2).includes(`Huella=${h1}`),'el segundo registro lleva DENTRO la huella del primero');
const r2malo={...r2,huellaAnterior:h1.replace(/^./,c=>c==='A'?'B':'A')};
ok(await V.vfHuella(V.vfCadenaAlta(r2malo))!==h2,'tocar un solo carácter de la cadena cambia la huella');
ok(V.vfCadenaAlta({...reg,huellaAnterior:''}).includes('Huella=&'),
   'el PRIMER registro lleva la huella anterior vacía, como manda la norma');

console.log('── 6 · leyenda y cotejo ──');
// El RD 1007/2023 admite dos leyendas: «VERI*FACTU» o la frase completa
// «Factura verificable en la sede electrónica de la AEAT». La app usa la
// segunda, que es igual de válida. Mi primera regex solo aceptaba la primera.
ok(/VERI\*?FACTU/i.test(V.VF_LEYENDA)||/verificable en la sede electr[oó]nica de la AEAT/i.test(V.VF_LEYENDA),
   `la factura lleva una leyenda válida («${V.VF_LEYENDA}»)`);
// VF_COTEJO no es una cadena: es un objeto con la URL de producción y la de
// pruebas, que es como debe ser para poder validar sin ensuciar el entorno real.
const urls=Object.values(V.VF_COTEJO||{}).filter(x=>typeof x==='string');
ok(urls.length>=1,`hay ${urls.length} URL de cotejo (producción y pruebas)`);
ok(urls.every(u=>/^https:\/\/[\w.-]*(agenciatributaria\.(es|gob\.es)|aeat\.es)\//.test(u)),  // aeat.es es el dominio oficial del entorno de pruebas
   `todas apuntan a la AEAT por HTTPS: ${urls.map(u=>u.replace(/^https:\/\//,'').split('/')[0]).join(', ')}`);
ok(urls.some(u=>/prewww|prueba|test/i.test(u)),'hay entorno de PRUEBAS separado del real');

console.log('── 7 · la regla de los 240 segundos ──');
// La AEAT valida que FechaHoraHusoGenRegistro esté dentro de 240 s de SU reloj.
// La app la fija al GENERAR el registro (al emitir la factura) y envía después,
// así que un lote enviado más tarde llega con la marca caducada. En las
// capturas de Jesús los dos registros salieron aceptados PERO con ese aviso.
// Y no se puede corregir al enviar: la marca entra en la huella, así que
// tocarla obliga a recalcular el hash y rompería la cadena.
const MARGEN=240;
const dentro=(marca,ahora)=>Math.abs((new Date(marca).getTime()-ahora)/1000)<=MARGEN;
const ahora=Date.now();
ok(dentro(V.vfMarcaTemporal(new Date(ahora)),ahora),'una marca generada AHORA cumple los 240 s');
ok(!dentro(V.vfMarcaTemporal(new Date(ahora-600*1000)),ahora),
   'una marca de hace 10 minutos NO los cumple: emitir y enviar más tarde deja el registro fuera de margen');
ok(V.vfCadenaAlta({...reg,fechaHoraHusoGenRegistro:'X'}).includes('FechaHoraHusoGenRegistro=X'),
   'la marca entra en la huella: no se puede refrescar al enviar sin rehacer la cadena');

console.log(fallos?`═══ VERI*FACTU vs NORMA: ${fallos} FALLOS ═══`:'═══ VERI*FACTU: CUMPLE LA ESPECIFICACIÓN DE LA AEAT ═══');
process.exit(fallos?1:0);
