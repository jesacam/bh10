// ═══ ESTÉTICA · temas, paleta viva (C) y estilos (S) ═══
// C y S son objetos MUTABLES compartidos: aplicarTema los reescribe en
// caliente y toda la app los ve cambiar. Por eso se exportan los objetos,
// nunca copias.
// ═══ TEMAS DE COLOR ═══
// Cada familia trae su versión de noche y su versión de día. Se conservan los
// colores con significado (verde = cobrado, ámbar = aviso, rojo = vencido) y
// solo cambian fondos, bordes y acento: así el color sigue queriendo decir lo
// mismo en todos los temas.
const TEMAS = [
  {id:'bioh', nombre:'BIOH', muestra:'#7BF07B',
    oscuro:{bg:'#0B1121',sf:'#131C31',cd:'#1B2740',bd:'#2A3A54',tx:'#F1F5F9',mt:'#8196B0',ac:'#7BF07B',sc:'#10B981',wn:'#F59E0B',dn:'#EF4444',in:'#3B82F6',vt:'#8B5CF6',cy:'#B0E8E8',btnTx:'#0B1121',ch:['#E8A308','#3B82F6','#10B981','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316']},
    claro:{bg:'#F3EFE7',sf:'#FFFFFF',cd:'#FFFFFF',bd:'#E3DCCD',tx:'#22312B',mt:'#68766E',ac:'#0E7C8A',sc:'#177E57',wn:'#B45309',dn:'#DC2626',in:'#2563EB',vt:'#7C3AED',cy:'#0E7C8A',btnTx:'#FFFFFF',ch:['#B45309','#2563EB','#177E57','#DC2626','#7C3AED','#DB2777','#0F766E','#EA580C']}},
  {id:'obra', nombre:'Obra', muestra:'#F5A623',
    oscuro:{bg:'#12100D',sf:'#1D1A15',cd:'#26221B',bd:'#3D372C',tx:'#F5F1E8',mt:'#A2977F',ac:'#F5A623',sc:'#4FAE6E',wn:'#E08A1E',dn:'#E05252',in:'#5B93D6',vt:'#A57BD8',cy:'#E8C99B',btnTx:'#12100D',ch:['#F5A623','#5B93D6','#4FAE6E','#E05252','#A57BD8','#D97AA6','#3FA9A0','#EE7A2E']},
    claro:{bg:'#F7F2E8',sf:'#FFFFFF',cd:'#FFFFFF',bd:'#E4D9C4',tx:'#2A2418',mt:'#7A6E58',ac:'#B87309',sc:'#177E57',wn:'#B45309',dn:'#C62828',in:'#1F6FB8',vt:'#7C3AED',cy:'#8A6B1F',btnTx:'#FFFFFF',ch:['#B87309','#1F6FB8','#177E57','#C62828','#7C3AED','#C2185B','#00796B','#E65100']}},
  {id:'oceano', nombre:'Océano', muestra:'#38BDF8',
    oscuro:{bg:'#071620',sf:'#0D2130',cd:'#132C3E',bd:'#204458',tx:'#E6F4F9',mt:'#7FA5B8',ac:'#38BDF8',sc:'#22C1A0',wn:'#F0A93B',dn:'#F0605B',in:'#5AA9F0',vt:'#9C86F5',cy:'#7DE3E8',btnTx:'#071620',ch:['#38BDF8','#22C1A0','#F0A93B','#F0605B','#9C86F5','#F07DB8','#3FA9A0','#F5883B']},
    claro:{bg:'#EDF5F9',sf:'#FFFFFF',cd:'#FFFFFF',bd:'#CFE0EA',tx:'#12303D',mt:'#5C7A88',ac:'#0369A1',sc:'#0F766E',wn:'#B45309',dn:'#C62828',in:'#1D63C4',vt:'#6D28D9',cy:'#0E7490',btnTx:'#FFFFFF',ch:['#0369A1','#0F766E','#B45309','#C62828','#6D28D9','#BE185D','#047857','#EA580C']}},
  {id:'tinta', nombre:'Tinta', muestra:'#A78BFA',
    oscuro:{bg:'#100C1C',sf:'#191330',cd:'#221A3E',bd:'#372B57',tx:'#EFEAFB',mt:'#9A8FC0',ac:'#A78BFA',sc:'#34D399',wn:'#FBBF24',dn:'#FB7185',in:'#60A5FA',vt:'#C084FC',cy:'#A5B4FC',btnTx:'#100C1C',ch:['#A78BFA','#60A5FA','#34D399','#FB7185','#C084FC','#F472B6','#2DD4BF','#FB923C']},
    claro:{bg:'#F5F2FB',sf:'#FFFFFF',cd:'#FFFFFF',bd:'#DED5F0',tx:'#251C3D',mt:'#6C6188',ac:'#6D28D9',sc:'#177E57',wn:'#B45309',dn:'#DC2626',in:'#2563EB',vt:'#7C3AED',cy:'#4F46E5',btnTx:'#FFFFFF',ch:['#6D28D9','#2563EB','#177E57','#DC2626','#7C3AED','#DB2777','#0F766E','#EA580C']}},
  {id:'bosque', nombre:'Bosque', muestra:'#4ADE80',
    oscuro:{bg:'#08150F',sf:'#0F2119',cd:'#152D22',bd:'#254738',tx:'#E9F5EE',mt:'#87A897',ac:'#4ADE80',sc:'#22C55E',wn:'#EAB308',dn:'#EF4444',in:'#4D9BE0',vt:'#A78BFA',cy:'#86E8C4',btnTx:'#08150F',ch:['#4ADE80','#4D9BE0','#EAB308','#EF4444','#A78BFA','#EC4899','#14B8A6','#F97316']},
    claro:{bg:'#EFF5F0',sf:'#FFFFFF',cd:'#FFFFFF',bd:'#D3E2D7',tx:'#17301F',mt:'#5E7A66',ac:'#15803D',sc:'#177E57',wn:'#B45309',dn:'#C62828',in:'#1D63C4',vt:'#7C3AED',cy:'#0F766E',btnTx:'#FFFFFF',ch:['#15803D','#1D63C4','#0F766E','#C62828','#7C3AED','#BE185D','#0E7490','#EA580C']}},
  {id:'grafito', nombre:'Grafito', muestra:'#94A3B8',
    oscuro:{bg:'#0C0D0F',sf:'#16181C',cd:'#1E2126',bd:'#31363E',tx:'#F0F2F5',mt:'#98A1AE',ac:'#CBD5E1',sc:'#10B981',wn:'#F59E0B',dn:'#EF4444',in:'#60A5FA',vt:'#A78BFA',cy:'#9CC7E8',btnTx:'#0C0D0F',ch:['#94A3B8','#60A5FA','#10B981','#EF4444','#A78BFA','#EC4899','#14B8A6','#F97316']},
    claro:{bg:'#F2F3F5',sf:'#FFFFFF',cd:'#FFFFFF',bd:'#DCDFE4',tx:'#1E2126',mt:'#646B75',ac:'#334155',sc:'#177E57',wn:'#B45309',dn:'#C62828',in:'#2563EB',vt:'#6D28D9',cy:'#0E7490',btnTx:'#FFFFFF',ch:['#334155','#2563EB','#177E57','#C62828','#6D28D9','#BE185D','#0F766E','#EA580C']}},
];

const temaPorId=(id)=>TEMAS.find(t=>t.id===id)||TEMAS[0];

const PALETA_OSCURA = TEMAS[0].oscuro;

const PALETA_CLARA = TEMAS[0].claro;

const C = {...PALETA_OSCURA};

// ═══ ESTILOS (módulo) — fuera de App para no recrearse en cada render ═══
const buildS=()=>({
  // Fila de pestañas que se queda pegada arriba al desplazar, conservando su
  // desplazamiento horizontal. Fondo opaco para que el contenido no se
  // transparente por debajo, y márgenes negativos para llegar a los bordes.
  filaFija:{position:'sticky',top:0,zIndex:30,background:C.bg,marginBottom:8,
    paddingTop:6,marginLeft:-10,marginRight:-10,paddingLeft:10,paddingRight:10,
    boxShadow:'0 6px 8px -8px rgba(0,0,0,.45)'},
  card:{background:C.cd,borderRadius:12,padding:'12px 14px',border:`1px solid ${C.bd}`},
  input:{background:C.sf,border:`1px solid ${C.bd}`,borderRadius:8,padding:'10px 12px',color:C.tx,fontSize:16,width:'100%',boxSizing:'border-box',minHeight:44},
  select:{background:C.sf,border:`1px solid ${C.bd}`,borderRadius:8,padding:'10px 12px',color:C.tx,fontSize:16,width:'100%',boxSizing:'border-box',minHeight:44},
  btn:c=>({background:c||C.ac,color:(c===C.ac||c===C.wn||!c)?C.btnTx:C.tx,border:'none',borderRadius:8,padding:'11px 18px',fontSize:14,fontWeight:600,cursor:'pointer',minHeight:44}),
  sm:c=>({background:(c||C.ac)+'22',color:c||C.ac,border:'none',borderRadius:8,padding:'8px 12px',fontSize:12,fontWeight:600,cursor:'pointer',minHeight:36}),
  ghost:{background:'transparent',border:`1px solid ${C.bd}`,color:C.mt,borderRadius:8,padding:'10px 16px',fontSize:13,cursor:'pointer',minHeight:44},
// ═══ v378 · ESCALERA DE CAPAS ═════════════════════════════════════════════
// Jesús (07-09-2026): «he ido a registrar un importe cobrado y la ventana
// nueva no se ha puesto por encima, ha habido un poco de lío».
// El modal de pago usaba la capa por defecto (80) y el detalle del KPI desde
// el que se abre está en 90: nacía DEBAJO. Hasta ahora cada ventana llevaba su
// número a mano (80, 90, 120, 125, 130, 9999) y era cuestión de tiempo que dos
// se cruzaran. Esto es la escalera, con nombres en vez de números sueltos:
//   FONDO      lo que vive en la pantalla (barras, botón flotante)
//   VENTANA    una ventana normal, abierta desde una pantalla
//   DETALLE    ventanas que se abren SOBRE otra ventana (detalle de un KPI…)
//   ACCION     lo que se abre DESDE una ventana y tiene que taparla: registrar
//              un pago, confirmar un borrado, enseñar un enlace
//   ENCIMA     avisos que deben verse pase lo que pase (sesión cerrada)
// Regla: si una ventana puede abrirse desde otra, va en una capa MÁS ALTA.

  overlay:{position:'absolute',inset:0,background:'rgba(0,0,0,.65)',zIndex:80,display:'flex',alignItems:'flex-start',justifyContent:'center',overflowY:'auto',WebkitOverflowScrolling:'touch',overscrollBehavior:'contain',padding:'calc(16px + env(safe-area-inset-top)) 10px calc(140px + env(safe-area-inset-bottom))'},
  modal:{background:C.sf,borderRadius:14,padding:18,width:'95%',maxWidth:540,border:`1px solid ${C.bd}`},
  // Cabecera pegada arriba: en una ventana larga la ✕ se perdía al bajar y no
  // había forma de cerrar sin volver al principio. Los márgenes negativos son
  // para que el fondo tape el contenido que pasa por detrás, incluido el
  // relleno lateral de la ventana.
  cabModal:{position:'sticky',top:-18,zIndex:6,background:C.sf,
    marginLeft:-18,marginRight:-18,marginTop:-18,
    paddingLeft:18,paddingRight:18,paddingTop:18,paddingBottom:8,
    borderTopLeftRadius:14,borderTopRightRadius:14},
});

const S=buildS();

const aplicarTema=(modo,familia)=>{const f=temaPorId(familia);Object.assign(C, modo==='claro'?f.claro:f.oscuro);Object.assign(S,buildS());};
const CAPAS={FONDO:55,VENTANA:80,DETALLE:90,SOBRE:120,SOBRE2:130,ACCION:150,ENCIMA:9999};
export {TEMAS,temaPorId,PALETA_OSCURA,PALETA_CLARA,C,buildS,S,aplicarTema,CAPAS};
