import {JSDOM} from 'jsdom';
import fs from 'fs';
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://bh10group.com/app/',pretendToBeVisual:true});
for(const k of ['window','document','navigator','localStorage','sessionStorage','HTMLElement','Node','CustomEvent','Event','FileReader','Blob','URL','btoa','File'])
  try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}
globalThis.window=dom.window;
class RO{observe(){}unobserve(){}disconnect(){}}dom.window.ResizeObserver=RO;globalThis.ResizeObserver=RO;
globalThis.atob=(x)=>Buffer.from(String(x),'base64').toString('binary');
dom.window.matchMedia=dom.window.matchMedia||(()=>({matches:false,addEventListener(){},removeEventListener(){}}));
const React=(await import('react')).default;const {createRoot}=await import('react-dom/client');
window.__BH10_R=React;window.__BH10_JSX=await import('react/jsx-runtime');
window.__BH10_GTOKEN='tok';
const copia=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const nube={...copia.claves,'bh10-gmailid':'x.apps.googleusercontent.com'};
window.storage={get:async k=>nube[k]!==undefined?{value:nube[k]}:null,set:async(k,v)=>{nube[k]=v;return{};},delete:async()=>({}),list:async()=>({keys:Object.keys(nube)}),getStatus:()=>({fase:'ok'})};
const PDF=new Uint8Array([0x25,0x50,0x44,0x46,0x2d,0x31,0x2e,0x34,10,...Array(300).fill(65),0x25,0x25,0x45,0x4f,0x46]);
const b64u=u=>Buffer.from(u).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
// seis correos distintos, para que haya más de cuatro candidatos
globalThis.fetch=async(url)=>{const u=String(url);const j=o=>({ok:true,status:200,json:async()=>o});
  if(u.includes('/messages?q='))return j({messages:[1,2,3,4,5,6].map(n=>({id:'m'+n}))});
  if(u.includes('/attachments/'))return j({data:b64u(PDF)});
  const m=u.match(/\/messages\/m(\d)/);
  if(m)return j({snippet:'Factura, importe 4.722,33 €',payload:{headers:[{name:'Subject',value:'Factura 842 · envío '+m[1]},
    {name:'From',value:'admin@hormigonesrecas.es'},{name:'Date',value:'Mon, 07 Sep 2026 10:00:00 +0200'}],
    parts:[{filename:'Factura_842_v'+m[1]+'.pdf',mimeType:'application/pdf',body:{attachmentId:'att'+m[1],size:PDF.length}}]}});
  return j({});};
window.bh10Adj={subir:async()=>'adj/x',enNube:async()=>({ok:true}),url:async()=>'https://x/y.pdf'};
const errs=[];const oe=console.error;console.error=(...a)=>errs.push(String(a[0]).slice(0,200));
const {default:App}=await import('/home/claude/fuente/web_subir/app/assets/bh10-APPV399.js');
createRoot(document.getElementById('root')).render(React.createElement(App));
const esp=ms=>new Promise(r=>setTimeout(r,ms));
await esp(2500);
const btn=t=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes(t));
const txt=()=>document.getElementById('root').textContent;
btn('Facturas').click();await esp(900);
btn('📎 Sin doc').click();await esp(900);
btn('Buscar en Gmail los').click();await esp(45000);
console.error=oe;
console.log('candidatos visibles:',(txt().match(/Factura_842_v\d\.pdf/g)||[]).length);
console.log('aviso «y N más»    :',(txt().match(/y \d+ más · descarta con ✕/)||['(no sale)'])[0]);
const xs=[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='✕');
console.log('botones ✕          :',xs.length);
if(xs.length){
  const antes=(txt().match(/Factura_842_v(\d)\.pdf/g)||[]).slice(0,4).join(',');
  xs[0].click();await esp(800);
  const despues=(txt().match(/Factura_842_v(\d)\.pdf/g)||[]).slice(0,4).join(',');
  console.log('antes de la ✕      :',antes);
  console.log('después de la ✕    :',despues);
  console.log('¿entró uno nuevo?  :',antes!==despues?'sí':'NO');
  console.log('motivo actualizado :',(txt().match(/\d+ candidatos?, ninguno claro/)||['(?)'])[0]);
}
console.log('errores de React   :',errs.length?errs.slice(0,2).join(' || '):'ninguno');
