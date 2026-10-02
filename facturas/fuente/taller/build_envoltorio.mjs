// Compila el envoltorio (login, bóveda, sesiones, almacén) desde su fuente
// recuperado. Autocontenido: React+Firebase van dentro; la app los toma de
// window.__BH10_R / __BH10_JSX como siempre.
import esbuild from 'esbuild';
await esbuild.build({
  entryPoints:[{in:'src-envoltorio/envoltorio.jsx', out:'index-v317'}],
  bundle:true, format:'esm', minify:true, jsx:'automatic',
  outdir:'web_subir/app/assets',
  logLevel:'warning'
});
console.log('envoltorio OK');
