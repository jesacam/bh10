// Compila la app desde src/ y NORMALIZA los nombres de los trozos:
// esbuild pone hashes que dependen de la ruta absoluta, así que tras compilar
// se renombran a nombres canónicos (ordenados por su huella md5) y se
// reescriben las referencias. Resultado: compilación reproducible byte a byte
// en cualquier directorio. El cache-busting lo da el número de versión.
import esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
const shim = p => ({path: path.resolve('taller/shims/'+p)});
const V='v404';
const DIR='web_subir/app/assets';
const res=await esbuild.build({
  entryPoints:[{in:'src/app.jsx', out:'bh10-APP'+V.toUpperCase()}],
  bundle:true, format:'esm', minify:true, jsx:'automatic', splitting:true,
  outdir:DIR, chunkNames:'trozo-'+V+'-[hash]', metafile:true,
  plugins:[{name:'bh10-shims',setup(b){
    b.onResolve({filter:/^react$/},()=>shim('react.js'));
    b.onResolve({filter:/^react\/jsx-runtime$/},()=>shim('jsx-runtime.js'));
    b.onResolve({filter:/^react\/jsx-dev-runtime$/},()=>shim('jsx-runtime.js'));
  }}],
  logLevel:'warning'
});
const emitidos=Object.keys(res.metafile.outputs).map(p=>path.basename(p));
const conHash=emitidos.filter(f=>new RegExp('-'+V+'-[A-Z0-9]{8}\\.js$').test(f));
const md5=f=>crypto.createHash('md5').update(fs.readFileSync(path.join(DIR,f))).digest('hex');
const orden=conHash.map(f=>({f,h:md5(f)})).sort((a,b)=>a.h<b.h?-1:1);
const letras='abcdefghijklmnopqrstuvwxyz';
const mapa={};
orden.forEach((x,i)=>{ mapa[x.f]=x.f.replace(/-[A-Z0-9]{8}\.js$/,'-'+letras[i]+'.js'); });
for(const f of emitidos){
  let t=fs.readFileSync(path.join(DIR,f),'utf8'),c=false;
  for(const [v,n] of Object.entries(mapa)) if(t.includes(v)){t=t.split(v).join(n);c=true;}
  if(c) fs.writeFileSync(path.join(DIR,f),t);
}
for(const [v,n] of Object.entries(mapa)) fs.renameSync(path.join(DIR,v),path.join(DIR,n));
console.log('build OK ·',conHash.length,'trozos normalizados:',Object.values(mapa).join(' '));
