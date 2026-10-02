// Monta la carpeta del sitio (web/ del repositorio) con la versión recién
// compilada: copia bundle y trozos, escribe el cargador app-vNNN.js, apunta
// app/index.html al cargador nuevo, regenera el precache de app/sw.js (md5)
// y deja solo la versión nueva y la anterior (marcha atrás) en assets/.
import fs from 'fs'; import path from 'path'; import crypto from 'crypto';
const {APP_VERSION:V}=await import('../src/version.js');
const ORIG='web_subir/app/assets', WEB=path.resolve('../../web'), APP=path.join(WEB,'app'), DEST=path.join(APP,'assets');
const num=v=>+String(v).replace(/\D/g,'');
const bundle='bh10-APP'+V.toUpperCase()+'.js';
if(!fs.existsSync(path.join(ORIG,bundle)))throw new Error('falta '+bundle+': compila antes (node taller/build_app.mjs)');
// 1. assets de la versión nueva
const nuevos=fs.readdirSync(ORIG).filter(f=>f===bundle||f.startsWith('trozo-'+V+'-'));
for(const f of nuevos)fs.copyFileSync(path.join(ORIG,f),path.join(DEST,f));
fs.writeFileSync(path.join(DEST,'app-'+V+'.js'),'typeof window<"u"&&(window.__BH10_APPF=async()=>(await import("./'+bundle+'")).default);\n');
// 2. limpiar versiones viejas: se conservan V y la inmediatamente anterior
// Solo cuentan como «versionados» el cargador, el bundle y los trozos de la app:
// index-v317.js (envoltorio) y los chunk-*.js NO se tocan nunca.
const verDe=f=>{const m=f.match(/^(?:app-|bh10-APP|trozo-)v(\d+)[-.]/i);return m?'v'+m[1]:'';};
const vers=[...new Set(fs.readdirSync(DEST).map(verDe).filter(Boolean))].sort((a,b)=>num(a)-num(b));
const conservar=new Set(vers.slice(-2)); let borrados=0;
for(const f of fs.readdirSync(DEST)){const v=verDe(f);if(v&&!conservar.has(v)){fs.unlinkSync(path.join(DEST,f));borrados++;}}
// 3. index.html → cargador nuevo
const ix=path.join(APP,'index.html'); let h=fs.readFileSync(ix,'utf8');
h=h.replace(/\/app\/assets\/app-v\d+\.js/g,'/app/assets/app-'+V+'.js'); fs.writeFileSync(ix,h);
// 4. precache de sw.js: todo lo de app/ salvo sw.js, workbox y la versión anterior
const sw=path.join(APP,'sw.js'); let s=fs.readFileSync(sw,'utf8');
const m=s.match(/e\.precacheAndRoute\((\[.*?\]),\{\}\)/); if(!m)throw new Error('sw.js sin precacheAndRoute');
const lista=[];
const andar=(dir,pre)=>{for(const f of fs.readdirSync(dir)){const p=path.join(dir,f);if(fs.statSync(p).isDirectory()){andar(p,pre+f+'/');continue;}
  if(/^sw\.js$|^workbox-|LEEME/.test(f))continue; const mv=verDe(f); if(mv&&mv!==V)continue;
  lista.push({url:pre+f,revision:crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex')});}};
andar(APP,'');
lista.sort((a,b)=>a.url.localeCompare(b.url));
s=s.slice(0,m.index)+'e.precacheAndRoute(['+lista.map(e=>`{url:"${e.url}",revision:"${e.revision}"}`).join(',')+'],{})'+s.slice(m.index+m[0].length);
fs.writeFileSync(sw,s);
console.log('sitio montado ·',V,'·',nuevos.length,'assets nuevos ·',borrados,'ficheros viejos borrados ·',lista.length,'entradas en precache · conservadas:',[...conservar].join(' '));
