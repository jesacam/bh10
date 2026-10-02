// ═══ BATERÍA · VENTAS FASE 1: viviendas, titulares, portal, mejoras (v367) ═══
import fs from 'fs';
import {idCliente,asegurarIds,nuevaVivienda,viviendasDeObra,viviendasDeCliente,cotitularesDe,normalizaTitulares,aplicarRecibidoAVivienda,aplicarMejoras,totalMejoras,precioTotal,precioConIva,resumenObra,etiquetaVivienda,parteVendedora,csvViviendas,ROLES_OBRA,ESTADOS_VIVIENDA} from '../src/ventas.js';
let n=0,mal=0;const ok=(c,t)=>{n++;if(!c){mal++;console.log('  ✗',t);}else console.log('  ✓',t);};
const copia=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const cliCat=JSON.parse(copia.claves['bh10-clicat']||'[]');
ok(ROLES_OBRA.length===2&&ESTADOS_VIVIENDA.length===4,'roles de obra (promotora/constructora) y estados de vivienda');
const obra={id:'ob1',alias:'Residencial Yuncos'};
const v1=nuevaVivienda('ob1',{identificador:'4',tipologia:'Chalet pareado',superficieConstruida:180,precio:250000,ivaTipo:10});
const v2=nuevaVivienda('ob1',{identificador:'12',precio:265000});
const v3=nuevaVivienda('ob2',{identificador:'1'});
ok(v1.estado==='libre'&&v1.titulares.length===0&&v1.enlaces.length===0,'vivienda nueva: libre, sin titulares ni enlaces');
ok(viviendasDeObra([v2,v3,v1],'ob1').map(v=>v.identificador).join(',')==='4,12','las viviendas de la obra, ordenadas de forma natural (4 antes que 12)');
ok(etiquetaVivienda(v1,obra)==='Residencial Yuncos · vivienda 4'&&!/250/.test(etiquetaVivienda(v1,obra)),'la etiqueta del portal nombra la vivienda y nunca el precio');
// titulares
ok(JSON.stringify(normalizaTitulares([{clienteId:'a'},{clienteId:'b'},{clienteId:'c'}]).map(t=>t.porcentaje))==='[33.33,33.33,33.34]','sin porcentajes: a partes iguales y suman 100');
ok(normalizaTitulares([{clienteId:'a',porcentaje:60},{clienteId:'b',porcentaje:40}]).map(t=>t.porcentaje).join(',')==='60,40','con porcentajes que suman 100 se respetan');
// lo que llega del portal: dos titulares, uno ya existe en clientes
const existente=cliCat.find(c=>c.cif&&c.nombre)||{id:'x',nombre:'CLIENTE PRUEBA S.L.',cif:'B12345678'};
const recibido={titulares:[{nombre:existente.nombre,nif:existente.cif,telefono:'600111222',email:'a@b.es',dir:'Calle Sol 1',cp:'45200',municipio:'Illescas'},{nombre:'Marta López Pérez',nif:'12345678Z',telefono:'600333444',email:'marta@b.es',estadoCivil:'casada',regimen:'gananciales'}],viviendaReservada:'vivienda 4'};
const r=aplicarRecibidoAVivienda({recibido,vivienda:v1,cliCat});
// v371 · lo que entra por el portal se guarda en MAYÚSCULAS (con tildes)
ok(r.nuevos.length===1&&r.nuevos[0]==='MARTA LÓPEZ PÉREZ'&&r.actualizados.length===1,'del portal: un titular nuevo se crea, el existente se completa (no se duplica)');
ok(r.vivienda.titulares.length===2&&r.vivienda.titulares.map(t=>t.porcentaje).join(',')==='50,50'&&r.vivienda.estado==='reservada','la vivienda queda con dos titulares al 50 % y pasa a reservada');
const marta=r.cliCat.find(c=>c.nombre==='MARTA LÓPEZ PÉREZ');
ok(!!marta&&marta.nombre===marta.nombre.toLocaleUpperCase('es-ES'),'la ficha creada por el portal queda en mayúsculas, conservando tildes');
ok(marta&&marta.cif==='12345678Z'&&marta.telefono==='600333444'&&marta.regimen==='gananciales'&&marta.origen==='portal','la ficha nueva lleva sus datos y el origen «portal»');
ok(viviendasDeCliente([r.vivienda,v2],marta.id).length===1&&cotitularesDe(r.vivienda,marta.id,r.cliCat)[0]===existente.nombre.toLocaleUpperCase('es-ES'),'desde Clientes: su vivienda y con quién es cotitular');
const r2=aplicarRecibidoAVivienda({recibido,vivienda:r.vivienda,cliCat:r.cliCat});
ok(r2.vivienda.titulares.length===2&&r2.nuevos.length===0,'si el enlace se reenvía, no se duplican titulares ni fichas');
// mejoras del configurador
const m=aplicarMejoras(r.vivienda,[{concepto:'Cocina ampliada',importe:4500},{concepto:'Suelo radiante',importe:6200},{concepto:'Cocina ampliada',importe:4500}]);
ok(m.anadidas===2&&totalMejoras(m.vivienda)===10700,'dos mejoras entran, la repetida no; total 10.700');
const m2=aplicarMejoras(m.vivienda,[{concepto:'Suelo radiante',importe:6200},{concepto:'Piscina',importe:18000}]);
ok(m2.anadidas===1&&totalMejoras(m2.vivienda)===28700,'un segundo envío solo añade lo nuevo');
ok(precioTotal(m2.vivienda)===278700&&precioConIva(m2.vivienda)===306570,'precio total = precio + mejoras; con IVA al 10 %');
// resumen de obra
const rs=resumenObra([m2.vivienda,v2,v3],'ob1');
ok(rs.total===2&&rs.reservadas===1&&rs.libres===1&&rs.ventas===543700&&rs.vendidas===278700,'resumen de la obra: totales por estado y ventas');
// parte vendedora = empresa en uso
const pv=parteVendedora({name:'GREEN GENERATION BUILDING S.L.',cif:'B45000000',address:'CL NEON 12',city:'45200 ILLESCAS',representante:'Jesús A.',representanteDni:'00000000T'},{nombre:'GREEN'});
ok(pv.razon_social==='GREEN GENERATION BUILDING S.L.'&&pv.domicilio==='CL NEON 12, 45200 ILLESCAS'&&pv.representante.cargo==='administrador único','la parte vendedora sale de los datos de la empresa en uso');
const csv=csvViviendas([m2.vivienda,v2],[obra],r.cliCat);
ok(csv.split('\r\n').length===3&&/MARTA LÓPEZ PÉREZ 50%/.test(csv),'CSV de viviendas con titulares y porcentajes');
// ── en pantalla: obra promotora, alta de vivienda, lista y Clientes ────────
// Batería del acordeón de Ajustes: apertura ÚNICA (abrir B cierra A).
import {JSDOM} from 'jsdom';
import React from 'react';
import * as JSXR from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://bh10group.com/app/',pretendToBeVisual:true});
for(const k of ['window','document','navigator','localStorage','sessionStorage','HTMLElement','Node','CustomEvent','Event','FileReader','Blob','URL','atob','btoa']){try{globalThis[k]=dom.window[k]??globalThis[k];}catch(e){}}
globalThis.window=dom.window;
// datos reales para que haya facturas (y el botón Excel)
const _copia=JSON.parse(fs.readFileSync((process.env.BH10_COPIA||'/home/claude/copia/BH10_copia_completa_2026-09-06.json'),'utf8'));
const nube={'bh10-fc-v3':_copia.claves['bh10-fc-v3']};
window.storage={get:async k=>nube[k]!==undefined?{key:k,value:nube[k]}:null,set:async(k,v)=>{nube[k]=String(v);return{key:k,value:v}},delete:async k=>{delete nube[k];return{key:k}},list:async p=>({keys:Object.keys(nube).filter(k=>!p||k.startsWith(p))}),getStatus:()=>({fase:'ok',error:'',ultimaEscritura:Date.now(),errorEscritura:'',pendientes:0,conflicto:null})};
window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
window.requestAnimationFrame=cb=>setTimeout(cb,0);globalThis.requestAnimationFrame=window.requestAnimationFrame;
window.cancelAnimationFrame=()=>{};globalThis.cancelAnimationFrame=()=>{};
class RO{observe(){}unobserve(){}disconnect(){}}window.ResizeObserver=RO;globalThis.ResizeObserver=RO;
window.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};window.scrollTo=()=>{};
window.__BH10_R=React;window.__BH10_JSX=JSXR;window.__BH10_STANDALONE=true;
window.BH10_EMPRESA={sub:'',nombre:'BIG HOUSE 2010'};window.BH10_ROL='admin';
window.BH10_PERMISOS=null;
await new Promise(r=>setTimeout(r,900));
// ir a Ajustes
const tab=[...document.querySelectorAll('button')].find(b=>/Ajustes/.test(b.textContent));



// datos: un cliente real como titular, una obra promotora y una vivienda ya reservada
const cli0=cliCat.find(c=>c.nombre&&c.cif)||{nombre:'CLIENTE PRUEBA',cif:'B00000000'};
const cliId=idCliente(cli0);
nube['bh10-clicat']=JSON.stringify(asegurarIds(cliCat));
nube['bh10-obras']=JSON.stringify([{id:'ob1',alias:'Residencial Yuncos',activa:true,rol:'promotora',otros:[]},{id:'ob2',alias:'Obra ajena',activa:true,rol:'constructora',otros:[]}]);
nube['bh10-viviendas']=JSON.stringify([{...nuevaVivienda('ob1',{identificador:'4',tipologia:'Chalet pareado',precio:250000,estado:'reservada'}),titulares:[{clienteId:cliId,porcentaje:100,regimen:''}]}]);
const {default:App}=await import('../web_subir/app/assets/bh10-APPV404.js');
const root=createRoot(document.getElementById('root'));
const errores=[];const oe=console.error;console.error=(...a)=>{errores.push(a.map(String).join(' ').slice(0,200));};
root.render(React.createElement(App));
const E=(ms)=>new Promise(r=>setTimeout(r,ms));await E(1500);
const btn=(re)=>[...document.querySelectorAll('button')].find(b=>re.test(b.textContent));
btn(/^🏗?\s*Obras$/).click();await E(700);
const txt=()=>document.getElementById('root').textContent;
// v370 · Jesús: «la empresa puede ser vendedora Y constructora». Los dos
// papeles dejan de ser excluyentes: la pantalla ofrece DOS casillas, y hay
// que poder marcar las dos a la vez.
ok(/Vendemos las viviendas/.test(txt())&&/Ejecutamos la obra/.test(txt()),'cada obra ofrece sus dos papeles por separado');
ok(/En esta obra:/.test(txt()),'y se presentan como lo que son: lo que hacéis en esa obra');
ok(/🏠 Viviendas \(1\)/.test(txt())&&/Vivienda 4/.test(txt())&&/Reservada/.test(txt())&&txt().includes(cli0.nombre+' 100%'),'la obra promotora lista su vivienda con estado, titular y porcentaje');
ok((txt().match(/🏠 Viviendas/g)||[]).length===1,'la obra constructora NO tiene bloque de viviendas');
ok(/250\.000,00 €/.test(txt()),'precio total de la vivienda a la vista');
// alta de una vivienda nueva
btn(/➕ Vivienda/).click();await E(500);
ok(!errores.some(e=>/LimiteErrores|ReferenceError|TypeError/.test(e)),'sin errores de pantalla al abrir la ficha');
const modal=[...document.querySelectorAll('span')].find(sp=>/🏠 Vivienda/.test(sp.textContent));
ok(!!modal,'➕ abre la ficha de vivienda');
const pon=(el,val)=>{const k=Object.keys(el).find(x=>x.startsWith('__reactProps'));if(k&&el[k].onChange)el[k].onChange({target:{value:String(val)}});};
const inputDe=(lbl)=>{const l=[...document.querySelectorAll('label')].find(x=>x.textContent.startsWith(lbl));return l&&l.querySelector('input');};
pon(inputDe('Identificador'),'7');await E(120);pon(inputDe('Tipología'),'Adosado');await E(120);pon(inputDe('Precio de venta'),'199000');await E(200);
let guardado=null;const _set=window.storage.set;window.storage.set=async(k,v)=>{if(k==='bh10-viviendas')guardado=JSON.parse(v);return _set(k,v);};
btn(/💾 Guardar/).click();await E(500);
ok(Array.isArray(guardado)&&guardado.length===2&&guardado.some(v=>v.identificador==='7'&&v.tipologia==='ADOSADO'&&v.precio===199000&&v.estado==='libre'),'la vivienda nueva se guarda en la nube (bh10-viviendas) con sus datos, libre');
ok(/🏠 Viviendas \(2\)/.test(txt())&&/Vivienda 7/.test(txt()),'y aparece en la lista de la obra');
// Clientes: la línea de su vivienda
btn(/^📋?\s*Facturas$/).click();await E(500);btn(/👤\s?Clientes/).click();await E(700);
ok(new RegExp('🏠 Residencial Yuncos · vivienda 4').test(txt()),'en Clientes, el titular ve su vivienda enlazada');
console.error=oe;
console.log(`\n${n} comprobaciones, ${mal} fallos`);
if(n<24){console.log('✗ BATERÍA VACÍA');process.exit(1);}
process.exit(mal?1:0);
