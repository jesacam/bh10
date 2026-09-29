// ═══ BATERÍA · EL EMISOR DE AVISOS PUSH ═══════════════════════════════════
// Jesús (06-09-2026), preguntado si le llegan los avisos del fichaje: «No
// llegan no». La parte de suscribirse existía desde hace meses; el emisor
// NUNCA se construyó. Esto prueba la pieza nueva SIN mandar nada a nadie:
// se cifra un aviso de verdad y se descifra con las claves del destinatario,
// que es la única forma de saber que el navegador podrá leerlo.
import fs from 'fs';
import {webcrypto} from 'crypto';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
import {cifraPush} from '/home/claude/web_subir/worker_avisos_v376.js';

let n=0,mal=0;const ok=(c,t)=>{n++;if(!c){mal++;console.log('  ✗',t);}else console.log('  ✓',t);};
const src=fs.readFileSync('/home/claude/web_subir/worker_avisos_v376.js','utf8');
const B=(u)=>{let s='';const a=new Uint8Array(u);for(let i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
const b2u=(s)=>{const b=atob(String(s).replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(s.length/4)*4,'='));const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;};
const une=(...a)=>{const r=new Uint8Array(a.reduce((x,y)=>x+y.length,0));let o=0;for(const x of a){r.set(x,o);o+=x.length;}return r;};
const T=(s)=>new TextEncoder().encode(s);

console.log('── 1 · el aviso se cifra y el destinatario lo puede LEER ──');
// se finge un navegador: su par de claves y su secreto, como los que guarda /fichar/
const nav=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']);
const navPub=new Uint8Array(await crypto.subtle.exportKey('raw',nav.publicKey));
const auth=crypto.getRandomValues(new Uint8Array(16));
const mensaje=JSON.stringify({title:'✍️ Contrato firmado',body:'ANA PÉREZ ha firmado las arras A26/0001',url:'/app/'});
const paquete=await cifraPush(mensaje,B(navPub),B(auth));
ok(paquete instanceof Uint8Array&&paquete.length>100,`sale un paquete cifrado de ${paquete.length} bytes`);
ok(paquete.length>=16+4+1+65,'con su cabecera completa (sal, tamaño, clave efímera)');
// se descifra como haría el navegador
{
  const sal=paquete.slice(0,16);
  const largo=paquete[20];
  const asPub=paquete.slice(21,21+largo);
  const cifrado=paquete.slice(21+largo);
  ok(largo===65&&asPub[0]===4,'la clave efímera va sin comprimir, como pide la norma');
  const asKey=await crypto.subtle.importKey('raw',asPub,{name:'ECDH',namedCurve:'P-256'},false,[]);
  const secreto=new Uint8Array(await crypto.subtle.deriveBits({name:'ECDH',public:asKey},nav.privateKey,256));
  const hk=async(s,ikm,info,l)=>{const b=await crypto.subtle.importKey('raw',ikm,'HKDF',false,['deriveBits']);
    return new Uint8Array(await crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt:s,info},b,l*8));};
  const ikm=await hk(auth,secreto,une(T('WebPush: info\0'),navPub,asPub),32);
  const cek=await hk(sal,ikm,T('Content-Encoding: aes128gcm\0'),16);
  const nonce=await hk(sal,ikm,T('Content-Encoding: nonce\0'),12);
  const k=await crypto.subtle.importKey('raw',cek,'AES-GCM',false,['decrypt']);
  const claro=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:nonce,tagLength:128},k,cifrado));
  const fin=claro[claro.length-1];
  const leido=new TextDecoder().decode(claro.slice(0,claro.length-1));
  ok(fin===2,'el relleno final es el que marca «último trozo» (0x02)');
  ok(leido===mensaje,'EL NAVEGADOR LEE EXACTAMENTE EL AVISO ENVIADO');
  ok(JSON.parse(leido).title.includes('Contrato firmado'),'con su título y su cuerpo intactos');
}

console.log('── 2 · cada aviso es distinto (no se reutiliza nada) ──');
const p2=await cifraPush(mensaje,B(navPub),B(auth));
ok(B(paquete.slice(0,16))!==B(p2.slice(0,16)),'la sal cambia en cada envío');
ok(B(paquete.slice(21,86))!==B(p2.slice(21,86)),'y la clave efímera también: dos avisos nunca comparten cifrado');

console.log('── 3 · lo que no puede fallar en un emisor ──');
ok(/status === 404 \|\| r\.status === 410/.test(src),'una suscripción caducada se detecta (404/410)');
ok(/avisosDueno\/\$\{s\._id\}`, \{ method: 'DELETE'/.test(src),'y se borra sola, para no reintentarla eternamente');
ok(/exp: Math\.floor\(Date\.now\(\) \/ 1000\) \+ 12 \* 3600/.test(src),'el permiso VAPID caduca a las 12 horas, como manda la norma');
ok(/sub: env\.VAPID_CONTACTO/.test(src),'lleva el contacto obligatorio');
ok(/aud, /.test(src)&&/new URL\(endpoint\)\.origin/.test(src),'y se firma para el servidor concreto de cada aviso');
ok(/tipo === 'firma'/.test(src),'las firmas avisan al momento');
ok(/resto\.length \} cosa/.test(src)||/cosa\$\{resto\.length/.test(src)||/resto\.length !== 1/.test(src),'y el resto se junta en un solo aviso, para no hacer sonar el móvil por cada albarán');
ok(/VAPID_PRIVADA debe ser de 32 bytes/.test(src)&&/no es una clave P-256/.test(src),'si las claves están mal puestas, lo dice claro en vez de fallar en silencio');

console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<14){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
