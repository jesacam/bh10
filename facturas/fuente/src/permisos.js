// ═══ PERMISOS · POR CLAVE Y POR ACCIÓN (v364) ═════════════════════════════
// Jesús (05-09-2026): «revisa que un usuario sin atribuciones no pueda hacer
// cosas para las que no se le autoriza». Hasta ahora la pantalla escondía
// botones, pero el almacén dejaba escribir cualquier clave a quien tuviera
// admin en CUALQUIER área, y las reglas de Firestore igual. Este módulo es
// la única fuente de verdad y lo usan las tres capas:
//   · la app (botones y acciones),
//   · el envoltorio (storage.set / delete rechaza la clave ajena),
//   · las reglas de Firestore (generadas desde aquí, para que digan lo mismo).

// Cada clave del almacén pertenece a un área. Lo que no está aquí es del dueño.
export const AREA_DE_CLAVE={
  'bh10-fc-v3':'facturas','bh10-fcseed':'facturas','bh10-provcat':'facturas','bh10-clicat':'facturas',
  'bh10-fusignore':'facturas','bh10-clifusignore':'facturas','bh10-vfregistros':'facturas','bh10-vfeventos':'facturas','bh10-diario':'facturas',
  'bh10-contratos':'contratos','bh10-obras':'contratos','bh10-viviendas':'contratos','bh10-docsventa':'contratos','bh10-promocfg':'contratos','bh10-cesiones':'contratos',
  'bh10-nominas':'nominas','bh10-payroll-hist':'nominas','bh10-employees':'nominas','bh10-planidx':'nominas','bh10-avisonom':'nominas',
  'bh10-polizas':'seguros','bh10-flota':'seguros','bh10-flotaseed':'seguros',
  'bh10-remesas':'tesoreria','bh10-n43':'tesoreria','bh10-recurrentes':'tesoreria','bh10-budgets':'tesoreria','bh10-banca':'tesoreria',
  'bh10-financiacion':'tesoreria','bh10-euribor':'tesoreria','bh10-traspasos':'tesoreria',
  'bh10-company-v2':'ajustes','bh10-vfcfg':'ajustes','bh10-kpis':'ajustes','bh10-gmailid':'ajustes','bh10-usoia':'ajustes','bh10-ultimacopia':'ajustes',
  // del dueño: la clave de la IA, los usuarios y la configuración del Master
  'bh10-anthkey':'dueno','bh10-usuarios':'dueno','bh10-mastercfg':'dueno','bh10-grupo':'dueno',
};
// Personales: cada uno escribe las suyas (orden de Ajustes, tema, paleta, alto de la barra, latido de sesión)
export const CLAVES_PERSONALES=['bh10-ordenconfig','bh10-tema','bh10-paleta','bh10-altotab','bh10-bajartab','bh10-sesiones','bh10-ping'];
const PREFIJOS=[['bh10-plan-','nominas'],['bh10-fichaje','nominas'],['bh10-sesiones','personal']];

export const areaDeClave=(k)=>{
  const c=String(k||'');
  if(CLAVES_PERSONALES.includes(c))return 'personal';
  if(AREA_DE_CLAVE[c])return AREA_DE_CLAVE[c];
  for(const [p,a] of PREFIJOS)if(c.startsWith(p))return a;
  return 'dueno';
};

// permisos = null → dueño (todo). Si no: {facturas:'admin'|'lectura'|'', …, acciones:{…}}
export const puedeEscribirClave=(permisos,clave)=>{
  if(!permisos)return true;
  const a=areaDeClave(clave);
  if(a==='personal')return true;
  if(a==='dueno')return false;
  return permisos[a]==='admin';
};

// Acciones que se pueden dar o quitar aparte del área (todas exigen admin en su área)
export const ACCIONES=[
  ['remesar','🏦 Generar remesas SEPA (proveedores y nóminas)','facturas'],
  ['pagos','💶 Apuntar y quitar pagos','facturas'],
  ['emitir','📤 Certificar y emitir facturas (VERI*FACTU)','contratos'],
  ['borrar','🗑️ Borrar facturas, contratos y pagos','facturas'],
  ['exportar','⬇️ Exportar (Excel, ZIP, paquete gestoría)','facturas'],
  ['lector','🤖 Usar el lector IA (gasta tokens)','facturas'],
  ['obras','🏗 Imputar, fundir e importar obras','contratos'],
];
export const areaDeAccion=(accion)=>{const d=ACCIONES.find(x=>x[0]===accion);return d?d[2]:'dueno';};
export const puedeAccion=(permisos,accion)=>{
  if(!permisos)return true;
  const area=areaDeAccion(accion);
  if(area==='dueno')return false;
  if(permisos[area]!=='admin')return false;
  const ac=permisos.acciones||{};
  return ac[accion]!==false;
};

// Reglas de Firestore que dicen lo mismo que este módulo (Jesús las pega en la consola)
export const reglasFirestoreKv=()=>{
  const porArea={};
  for(const [k,a] of Object.entries(AREA_DE_CLAVE)){if(a==='dueno')continue;(porArea[a]=porArea[a]||[]).push(k);}
  const lista=(l)=>'['+l.map(x=>"'"+x+"'").join(', ')+']';
  const cond=Object.entries(porArea).map(([a,ks])=>`        (clave in ${lista(ks)} && permisoDe(uid, '${a}') == 'admin')`).join(' ||\n');
  return `    // ── Claves del almacén (kv): cada una pertenece a un área; escribe quien es admin en ella.
    // Generado desde src/permisos.js (v364): si cambia el mapa, se regenera y se pega aquí.
    function permisoDe(uid, area) {
      return get(/databases/$(database)/documents/miembros/$(request.auth.uid)).data.permisos[area];
    }
    function claveEscribible(uid, clave) {
      return clave in ${lista(CLAVES_PERSONALES)} ||
${cond};
    }
    match /empresas/{uid}/kv/{clave} {
      allow read: if esMiembroDe(uid);
      allow write: if request.auth != null && (request.auth.uid == uid || (esMiembroDe(uid) && claveEscribible(uid, clave)));
    }
    match /empresas/{uid}/sub/{sub}/kv/{clave} {
      allow read: if esMiembroDe(uid);
      allow write: if request.auth != null && (request.auth.uid == uid || (esMiembroDe(uid) && claveEscribible(uid, clave)));
    }`;
};


// ═══ SUBÁREAS (v365) ══════════════════════════════════════════════════════
// Jesús (05-09-2026): «eran pocos los campos». Cada pantalla de las pestañas
// nuevas es una subárea con su propio nada / lectura / admin, que HEREDA del
// área si el dueño no la toca. Las claves del almacén y las reglas de
// Firestore siguen por área (esa es la garantía del servidor); la subárea
// afina lo que se ve y se toca en pantalla.
export const SUBAREAS=[
  ['recibidas','📥 Facturas recibidas','facturas'],['emitidas','📤 Facturas emitidas','facturas'],
  ['clientes','👤 Clientes','facturas'],['proveedores','🏪 Proveedores','facturas'],
  ['obras','🏗 Obras y coste','contratos'],['contratos','📑 Contratos y certificaciones','contratos'],
  ['presupuestos','📐 Presupuestos por obra','contratos'],['garantias','🛡️ Garantías','contratos'],
  ['remesas','🏦 Remesas (proveedores y nóminas)','tesoreria'],['n43','💰 Pendiente y extracto N43','tesoreria'],
  ['financiacion','🏦 Financiación','tesoreria'],['seguros','🛡️ Seguros y vehículos','seguros'],['prevision','📈 Previsión de tesorería','tesoreria'],
  ['empleados','👥 Empleados','nominas'],['nominas','💶 Nóminas y remesar','nominas'],['fichajes','🕐 Fichajes','nominas'],
];
export const areaDeSub=(sub)=>{const d=SUBAREAS.find(x=>x[0]===sub);return d?d[2]:sub;};
// nivel efectivo de una subárea: lo dicho para ella, o lo del área
export const nivelSub=(permisos,sub)=>{
  if(!permisos)return 'admin';
  const s=permisos.sub&&Object.prototype.hasOwnProperty.call(permisos.sub,sub)?permisos.sub[sub]:undefined;
  if(s!==undefined&&s!==null)return s;
  return permisos[areaDeSub(sub)]||'';
};
export const puedeVerSub=(permisos,sub)=>{const n=nivelSub(permisos,sub);return n==='lectura'||n==='admin';};
export const puedeEditarSub=(permisos,sub)=>nivelSub(permisos,sub)==='admin';
