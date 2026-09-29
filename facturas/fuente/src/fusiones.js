// ═══ FUSIONES · núcleo puro, sin estado ═══════════════════════════════════
// v345: fusionar CLIENTES duplicados, hermana de fusionarProveedores.
// El cliente vive en TRES sitios y los tres se renombran a la vez:
//   · facturas emitidas y anticipos → campo `proveedor` (herencia del modelo:
//     en las emitidas ese campo guarda al cliente)
//   · contratos y presupuestos → campo `cliente`
//   · la ficha de cliCat → se MEZCLA: la del destino manda y los huecos
//     (cif/dni/dir/tel/email) se rellenan con lo que tuviera el origen.
// Es una función pura: recibe listas, devuelve listas nuevas. Quien la llama
// aplica los setters y persiste. Así la batería la prueba con datos reales
// sin montar la app entera.

const ES_EMITIDA=(i)=>i&&(i.tipo==='cobro'||i.tipo==='anticipo');

export const fusionaCliente=({invoices,contratos,cliCat},origen,destino)=>{
  if(!origen||!destino||origen===destino)return null;
  invoices=Array.isArray(invoices)?invoices:[];
  contratos=Array.isArray(contratos)?contratos:[];
  const cat=Array.isArray(cliCat)?cliCat:Object.values(cliCat||{}).filter(x=>x&&x.nombre);

  const nFacturas=invoices.filter(i=>ES_EMITIDA(i)&&i.proveedor===origen).length;
  const nContratos=contratos.filter(c=>c&&c.cliente===origen).length;

  const nuevasInv=invoices.map(i=>ES_EMITIDA(i)&&i.proveedor===origen?{...i,proveedor:destino}:i);
  const nuevosCt=contratos.map(c=>c&&c.cliente===origen?{...c,cliente:destino}:c);

  const fO=cat.find(c=>c&&c.nombre===origen);
  const fD=cat.find(c=>c&&c.nombre===destino);
  let nuevoCat;
  if(fO&&fD){
    const mezcla={...fD};
    for(const k of ['cif','dni','dir','tel','email','notas'])if(!mezcla[k]&&fO[k])mezcla[k]=fO[k];
    nuevoCat=cat.filter(c=>c&&c.nombre!==origen).map(c=>c.nombre===destino?mezcla:c);
  }else if(fO){
    nuevoCat=cat.map(c=>c&&c.nombre===origen?{...c,nombre:destino}:c);
  }else{
    nuevoCat=cat.slice();
  }
  return {invoices:nuevasInv,contratos:nuevosCt,cliCat:nuevoCat,nFacturas,nContratos};
};

// ═══ NORMALIZAR A MAYÚSCULAS (v345) ═══════════════════════════════════════
// Deja homogéneo todo lo que nombra a clientes y proveedores: los nombres en
// facturas y contratos, y las fichas (nombre, dirección, notas; cif y dni
// también, que a veces llegan con la letra en minúscula). El email NO se
// toca (hay servidores que distinguen mayúsculas) ni el teléfono ni el IBAN.
// Si al subir a mayúsculas dos nombres chocan («Oscar Olmo» y «OSCAR OLMO»),
// quedan unificados y sus fichas se funden rellenando huecos, igual que en
// las fusiones. Es idempotente: pasarla dos veces no cambia nada más.
const U=(s)=>String(s??'').toLocaleUpperCase('es-ES');
const normFichas=(cat)=>{
  const arr=(Array.isArray(cat)?cat:Object.values(cat||{})).filter(x=>x&&x.nombre);
  const porNombre=new Map();let cambiadas=0,fundidas=0;
  for(const f of arr){
    const g={...f};let toco=false;
    for(const k of ['nombre','dir','notas','cif','dni']){
      if(typeof g[k]==='string'&&g[k]&&U(g[k])!==g[k]){g[k]=U(g[k]);toco=true;}
    }
    if(toco)cambiadas++;
    const n=U(f.nombre);
    if(porNombre.has(n)){
      const d=porNombre.get(n);fundidas++;
      for(const k of Object.keys(g))if((d[k]===undefined||d[k]==='')&&g[k])d[k]=g[k];
    }else porNombre.set(n,g);
  }
  return {cat:[...porNombre.values()],cambiadas,fundidas};
};
export const normalizaMayusculas=({invoices,contratos,cliCat,provCat})=>{
  invoices=Array.isArray(invoices)?invoices:[];
  contratos=Array.isArray(contratos)?contratos:[];
  let nFact=0,nCt=0;
  const inv=invoices.map(i=>{
    if(!i||typeof i!=='object')return i;
    if(typeof i.proveedor==='string'&&i.proveedor&&U(i.proveedor)!==i.proveedor){nFact++;return {...i,proveedor:U(i.proveedor)};}
    return i;});
  const cts=contratos.map(c=>{
    if(!c||typeof c!=='object')return c;
    const c1=typeof c.cliente==='string'&&c.cliente&&U(c.cliente)!==c.cliente;
    const c2=typeof c.clienteDir==='string'&&c.clienteDir&&U(c.clienteDir)!==c.clienteDir;
    if(!c1&&!c2)return c;
    nCt++;
    return {...c,...(c1?{cliente:U(c.cliente)}:{}),...(c2?{clienteDir:U(c.clienteDir)}:{})};});
  const rc=normFichas(cliCat), rp=normFichas(provCat);
  return {invoices:inv,contratos:cts,cliCat:rc.cat,provCat:rp.cat,
    nFacturas:nFact,nContratos:nCt,
    nFichas:rc.cambiadas+rp.cambiadas,nFundidas:rc.fundidas+rp.fundidas};
};
