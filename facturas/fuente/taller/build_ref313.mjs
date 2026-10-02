import esbuild from 'esbuild';
import path from 'path';
const shim = p => ({path: path.resolve('taller/shims/'+p)});
await esbuild.build({
  entryPoints:[{in:'BH10_FacturaControl_v313.tsx', out:'bh10-REF313'}],
  bundle:true, format:'esm', minify:true, jsx:'automatic', splitting:true,
  outdir:'ref', chunkNames:'[name]-ref-[hash]',
  plugins:[{name:'bh10-shims',setup(b){
    b.onResolve({filter:/^react$/},()=>shim('react.js'));
    b.onResolve({filter:/^react\/jsx-runtime$/},()=>shim('jsx-runtime.js'));
    b.onResolve({filter:/^react\/jsx-dev-runtime$/},()=>shim('jsx-runtime.js'));
    b.onResolve({filter:/^\.\/ayuda$/},()=>({path: path.resolve('src/ayuda.js')}));
  }}],
  logLevel:'warning'
});
console.log('ref313 OK');
