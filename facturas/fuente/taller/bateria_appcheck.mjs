// Batería App Check: extraer el fragmento cosido del bundle y ejecutarlo con
// grecaptcha y fetch de mentira, comprobando canje, caché y renovación.
import fs from 'fs';
// El fragmento ejecutable se extrae de index-v310.js (reversa: cosido sobre
// minificado, conserva los nombres ACKS/pne). En el v316 compilado desde
// fuente esbuild renombra las variables, así que ahí se exige el RASTRO de
// cadenas literales (endpoint, cabecera, grecaptcha), que no se minifican.
// La equivalencia de comportamiento v310 ↔ v316 la cubre bateria_envoltorio.
const s=fs.readFileSync('web_subir/app/assets/index-v310.js','utf8');
const v316=fs.readFileSync('web_subir/app/assets/index-v316.js','utf8');
const ini=s.indexOf('var ACKS='); const fin=s.indexOf('try{pne.container');
if(ini<0||fin<0){console.log('✗ no encuentro el fragmento');process.exit(1);}
const frag=s.slice(ini,fin);
let canjes=0;
const PDe={projectId:'b10h-facturas',appId:'1:940248180337:web:989686e6c5fcb80b1c9dd0',apiKey:'AIza-prueba'};
global.window={grecaptcha:{execute:async()=>'RECAPTCHA-TOKEN',ready:cb=>cb()}};
global.document={head:{appendChild(){}},createElement:()=>({})};
global.fetch=async(url,opts)=>{
  canjes++;
  if(!url.includes('exchangeRecaptchaV3Token'))throw new Error('endpoint raro: '+url);
  const body=JSON.parse(opts.body);
  if(body.recaptcha_v3_token!=='RECAPTCHA-TOKEN')throw new Error('no manda el token de recaptcha');
  return {json:async()=>({token:'APPCHECK-JWT-'+canjes, ttl:'3600s'})};
};
const ACKget = new Function('PDe','window','document','fetch',frag+';return ACKget;')(PDe,global.window,global.document,global.fetch);
const ok=(c,m)=>{console.log((c?'  ✓ ':'  ✗ ')+m); if(!c)process.exitCode=1;};
ok(v316.includes('exchangeRecaptchaV3Token')&&v316.includes('X-Firebase-AppCheck')&&v316.includes('grecaptcha'),
   'el envoltorio SERVIDO (v316) lleva App Check: endpoint, cabecera y grecaptcha presentes');
const t1=await ACKget();      // primer canje
ok(t1.token==='APPCHECK-JWT-1'&&canjes===1,'primer canje devuelve token');
const t2=await ACKget();      // debe salir de caché
ok(t2.token==='APPCHECK-JWT-1'&&canjes===1,'segunda petición sale de la CACHÉ (sin canje)');
const t3=await ACKget(true);  // forzado
ok(t3.token==='APPCHECK-JWT-2'&&canjes===2,'renovar(true) fuerza canje nuevo');
// fallo de red: no rompe, devuelve {token:"",error}
global.fetch=async()=>{throw new Error('sin red');};
const ACKget2 = new Function('PDe','window','document','fetch',frag+';return ACKget;')(PDe,global.window,global.document,global.fetch);
const t4=await ACKget2(true);
ok(t4.token===''&&!!t4.error,'con fallo de red devuelve {token:\"\",error} sin romper');
console.log(process.exitCode?'═══ FALLOS ═══':'═══ BATERÍA APP CHECK: TODO OK ═══');
