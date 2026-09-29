import {useState,useEffect,useRef,useCallback} from 'react';
import {C} from './estetica';

// ═══════════════════════════════════════════════════════════════════
//  AJUSTES · ACORDEÓN DECLARADO Y ESTABLE
//  Antes: los títulos se adivinaban leyendo el texto de cada tarjeta con
//  expresiones regulares, y el acordeón vivía DENTRO de App — cada
//  re-render de la app lo reconstruía entero (scroll arriba, tirones).
//  Ahora: cada apartado está DECLARADO (icono, título y grupo fijos) y
//  los componentes viven a nivel de módulo: React los conserva entre
//  renders y la pantalla no pierde ni el scroll ni lo abierto.
// ═══════════════════════════════════════════════════════════════════
const GRUPOS_AJ=[
  {id:'dia',   t:'DÍA A DÍA'},
  {id:'datos', t:'DATOS'},
  {id:'acceso',t:'ACCESOS'},
  {id:'app',   t:'LA APP'},
];
// Cada apartado se reconoce por una marca de texto de su cabecera (los
// primeros 90 caracteres); icono/título/grupo salen de AQUÍ, no del texto.
const SECCIONES_AJ=[
  {claves:['Barra y pantalla'],            ic:'📐', t:'Barra y pantalla',               g:'app'},
  {claves:['Nube y sesión'],               ic:'☁️', t:'Nube y sesión',                  g:'dia'},
  {claves:['Datos de ejemplo'],            ic:'🧹', t:'Datos de ejemplo heredados',     g:'datos'},
  {claves:['Completar CIF'],               ic:'🪪', t:'Completar CIF de proveedores',   g:'datos'},
  {claves:['Clave API de Anthropic'],      ic:'🔑', t:'Clave API de Anthropic',         g:'acceso'},
  {claves:['Archivar documentos'],         ic:'📎', t:'Archivar documentos',            g:'dia'},
  {claves:['Portal de proveedores'],       ic:'🔗', t:'Portal de proveedores',          g:'acceso'},
  {claves:['Administrador','Solo consulta','Cambiar de empresa'],
                                           ic:'🏢', t:'Empresa y modo de acceso',       g:'acceso'},
  {claves:['Papelera'],                    ic:'🗑️', t:'Papelera',                       g:'datos'},
  {claves:['Face ID'],                     ic:'🔒', t:'Acceso con Face ID',             g:'acceso'},
  {claves:['Versión de la app'],           ic:'🔄', t:'Versión de la app',              g:'app'},
  {claves:['Versión instalada'],           ic:'📦', t:'Versión instalada',              g:'app'},
  {claves:['Apariencia'],                  ic:'🎨', t:'Apariencia',                     g:'app'},
  {claves:['empresa ordenante'],           ic:'🏦', t:'Datos empresa ordenante',        g:'dia'},
  {claves:['Planificación mensual'],       ic:'📅', t:'Planificación mensual',          g:'dia'},
  {claves:['Remesas y pagos'],             ic:'🧾', t:'Remesas y pagos',                g:'datos'},
  {claves:['Comprobar documentos'],        ic:'🔍', t:'Comprobar documentos enlazados', g:'datos'},
  {claves:['Custodia y destrucción'],      ic:'🔒', t:'Custodia y destrucción de datos',g:'datos'},
  {claves:['VERI*FACTU'],                  ic:'🧾', t:'Registro VERI*FACTU',            g:'dia'},
  {claves:['Consumo de la clave'],         ic:'🔢', t:'Consumo de la clave API',        g:'acceso'},
  {claves:['Master — usuarios'],           ic:'🛡️', t:'Master — usuarios y sesiones',   g:'acceso'},
  {claves:['Copia de seguridad'],          ic:'💾', t:'Copia de seguridad completa',    g:'datos'},
  {claves:['Importar facturas desde Excel'],ic:'📊',t:'Importar desde Excel/CSV',       g:'datos'},
  {claves:['Borrar todo'],                 ic:'⚠️', t:'Borrar todo',                    g:'datos'},
  {claves:['¿Cómo se guardan'],            ic:'ℹ️', t:'¿Cómo se guardan mis datos?',    g:'app'},
  // genéricas al final, para que no le roben la marca a las de arriba
  {claves:['Exportar'],                    ic:'⬇️', t:'Exportar',                       g:'datos'},
  {claves:['Proveedores'],                 ic:'🏪', t:'Proveedores',                    g:'otros'},
];
const identificarAj=(texto)=>{
  const cab=String(texto||'').replace(/\s+/g,' ').trim();
  const ini=cab.slice(0,90);
  for(const d of SECCIONES_AJ) if(d.claves.some(k=>ini.includes(k)))
    return {icono:d.ic,titulo:d.t,grupo:d.g};
  // apartado nuevo aún sin declarar: que se vea igualmente, en «MÁS»
  return {icono:'•',titulo:cab.slice(0,40)||'Apartado',grupo:'otros'};
};
// ═══ v358 · AJUSTES COMO CASILLAS (Jesús, 03-09-2026) ═════════════════════
// «Casillas como las del Panel; al pulsar, la ventana encima; Guardar o
// Cerrar (también con la ✕) sin guardar; y poder colocarlas como quiera».
// Cada apartado sigue siendo el MISMO contenido de siempre (se identifica
// por su cabecera, como antes) y sigue montado aunque no se vea, para que
// el estado de sus campos no se pierda. Lo único nuevo es el envoltorio:
// casilla en la rejilla → ventana emergente con cabecera y pie.
const ES_FORM=new Set(['Datos empresa ordenante','Planificación mensual','Clave API de Anthropic',
  'Custodia y destrucción de datos','Apariencia','Acceso con Face ID','Barra y pantalla']);

const CasillaAj=({info,pos,total,edit,arrastrando,onArrastrar,onSoltar,onMover,onAbrir})=>(
  <button type="button" data-aj="casilla"
    draggable={edit}
    onDragStart={edit?(()=>onArrastrar(info.titulo)):undefined}
    onDragOver={edit?(e=>e.preventDefault()):undefined}
    onDrop={edit?(e=>{e.preventDefault();onSoltar(info.titulo);}):undefined}
    onDragEnd={edit?(()=>onArrastrar(null)):undefined}
    onClick={edit?undefined:()=>onAbrir(info.titulo)}
    style={{flex:'1 1 calc(50% - 4px)',minWidth:0,boxSizing:'border-box',background:C.sf,
      border:`1px ${edit?'dashed':'solid'} ${edit?C.in+'88':C.bd}`,borderRadius:12,padding:'12px 10px',
      cursor:edit?'grab':'pointer',color:C.tx,textAlign:'center',opacity:arrastrando===info.titulo?0.45:1,
      display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
    <span style={{fontSize:22,lineHeight:1}}>{info.icono}</span>
    <span style={{fontSize:12,fontWeight:700,lineHeight:1.25}}>{info.titulo}</span>
    {edit&&(
      <span style={{display:'flex',gap:6,marginTop:4}}>
        <span role="button" style={{padding:'3px 9px',borderRadius:8,background:C.in+'22',color:C.in,fontSize:12,opacity:pos<=0?0.35:1}}
          onClick={e=>{e.stopPropagation();if(pos>0)onMover(info.titulo,-1);}}>◀</span>
        <span role="button" style={{padding:'3px 9px',borderRadius:8,background:C.in+'22',color:C.in,fontSize:12,opacity:pos>=total-1?0.35:1}}
          onClick={e=>{e.stopPropagation();if(pos<total-1)onMover(info.titulo,1);}}>▶</span>
      </span>
    )}
  </button>
);

// Cada apartado: su contenido siempre montado (oculto) y, si está abierto,
// la ventana emergente encima con el mismo contenido dentro.
const ApartadoAj=({hijo,idx,abiertos,alSaber,alCerrar,alGuardar})=>{
  const ref=useRef(null);
  const [cab,setCab]=useState(null);
  useEffect(()=>{
    if(!ref.current)return;
    const t=(ref.current.textContent||'').replace(/\s+/g,' ').trim();
    if(!t)return;
    const info=identificarAj(t);
    if(!cab||cab.titulo!==info.titulo){ setCab(info); alSaber(idx,info); }
  });
  const abierto=cab?abiertos.includes(cab.titulo):false;
  const esForm=cab?ES_FORM.has(cab.titulo):false;
  if(!abierto){
    return <div ref={ref} data-aj="cuerpo" data-titulo={cab?cab.titulo:''} style={cab?{display:'none'}:{position:'absolute',visibility:'hidden',pointerEvents:'none',height:0,overflow:'hidden'}}>{hijo}</div>;
  }
  return(
    <div data-aj="ventana" style={{position:'absolute',inset:0,background:'rgba(0,0,0,.65)',zIndex:80,display:'flex',
      alignItems:'flex-start',justifyContent:'center',overflowY:'auto',WebkitOverflowScrolling:'touch',padding:'14px 0 30px'}}
      onClick={e=>{if(e.target===e.currentTarget)alCerrar(cab.titulo,esForm);}}>
      <div style={{background:C.sf,borderRadius:14,width:'95%',maxWidth:560,border:`1px solid ${C.bd}`,display:'flex',flexDirection:'column',maxHeight:'calc(100% - 20px)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderBottom:`1px solid ${C.bd}`}}>
          <span style={{fontSize:20}}>{cab.icono}</span>
          <span style={{flex:1,minWidth:0,fontWeight:700,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cab.titulo}</span>
          <button type="button" aria-label="Cerrar" title={esForm?'Cerrar sin guardar':'Cerrar'} onClick={()=>alCerrar(cab.titulo,esForm)}
            style={{background:'transparent',border:'none',color:C.mt,fontSize:20,cursor:'pointer',padding:'2px 6px',lineHeight:1}}>✕</button>
        </div>
        <div ref={ref} style={{padding:14,overflowY:'auto',WebkitOverflowScrolling:'touch'}}>{hijo}</div>
        <div style={{display:'flex',gap:8,padding:'10px 14px',borderTop:`1px solid ${C.bd}`,justifyContent:'flex-end'}}>
          {esForm?(<>
            <button type="button" onClick={()=>alCerrar(cab.titulo,true)}
              style={{padding:'9px 14px',borderRadius:10,border:`1px solid ${C.bd}`,background:'transparent',color:C.mt,fontWeight:600,fontSize:12,cursor:'pointer'}}>Cerrar sin guardar</button>
            <button type="button" onClick={()=>alGuardar(cab.titulo)}
              style={{padding:'9px 16px',borderRadius:10,border:'none',background:C.sc,color:'#fff',fontWeight:700,fontSize:12,cursor:'pointer'}}>💾 Guardar</button>
          </>):(
            <button type="button" onClick={()=>alCerrar(cab.titulo,false)}
              style={{padding:'9px 16px',borderRadius:10,border:'none',background:C.in,color:'#fff',fontWeight:700,fontSize:12,cursor:'pointer'}}>Cerrar</button>
          )}
        </div>
      </div>
    </div>
  );
};

// La rejilla de casillas + el mando de colocación (como el Panel) + la
// instantánea para «Cerrar sin guardar».
const ConfigAj=({hijos,abiertos,alternar,ordenConfig,aviso,onOrden,onRestablecer,instantanea,restaurar})=>{
  const [info,setInfo]=useState({});
  const [edit,setEdit]=useState(false);
  const [arrastrando,setArrastrando]=useState(null);
  const snap=useRef(null);
  const alSaber=useCallback((i,d)=>setInfo(p=>(p[i]&&p[i].titulo===d.titulo)?p:{...p,[i]:d}),[]);
  // pares [índice del hijo, info] en orden de aparición
  const pares=Object.keys(info).map(k=>[+k,info[k]]).sort((a,b)=>a[0]-b[0]);
  const vistos=new Set();
  const lista=pares.filter(([,d])=>{if(vistos.has(d.titulo))return false;vistos.add(d.titulo);return true;});
  // orden: el guardado manda; lo no colocado va después por grupo y, dentro
  // del grupo, por orden de aparición (exactamente como el acordeón de antes)
  const grupoDe=(d)=>{const g=GRUPOS_AJ.findIndex(x=>x.id===d.grupo);return g<0?9:g;};
  const ordenados=lista.slice().sort(([ia0,da],[ib0,db])=>{
    const ia=(ordenConfig||[]).indexOf(da.titulo),ib=(ordenConfig||[]).indexOf(db.titulo);
    if(ia>=0&&ib>=0)return ia-ib;
    if(ia>=0)return -1;if(ib>=0)return 1;
    return grupoDe(da)-grupoDe(db)||ia0-ib0;
  }).map(([,d])=>d.titulo);
  const mover=(t,d)=>{const l=[...ordenados];const i=l.indexOf(t);const j=i+d;if(i<0||j<0||j>=l.length)return;[l[i],l[j]]=[l[j],l[i]];onOrden&&onOrden(l);};
  const soltar=(sobre)=>{if(!arrastrando||arrastrando===sobre)return;const l=ordenados.filter(x=>x!==arrastrando);const k=l.indexOf(sobre);l.splice(k<0?l.length:k,0,arrastrando);onOrden&&onOrden(l);setArrastrando(null);};
  const abrir=useCallback((t)=>{snap.current=instantanea?instantanea():null;alternar(t);},[alternar,instantanea]);
  const cerrar=useCallback((t,sinGuardar)=>{if(sinGuardar&&snap.current&&restaurar)restaurar(snap.current);snap.current=null;alternar(t);},[alternar,restaurar]);
  const guardar=useCallback((t)=>{snap.current=null;alternar(t);},[alternar]);
  const infoDe=(t)=>Object.values(info).find(d=>d.titulo===t);
  return(<>
    {(()=>{const a=aviso; if(!a)return null; return(
      <div style={{background:C[a.nivel]+'18',border:`1.5px solid ${C[a.nivel]}`,borderRadius:10,
        padding:'10px 12px',margin:'10px 14px 0',fontSize:12,lineHeight:1.5,color:C[a.nivel],fontWeight:600}}>
        {a.txt}
      </div>
    );})()}
    <div id="bh-config" style={{padding:14}}>
      <div data-aj="cabecera" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:6,margin:'2px 2px 8px'}}>
        <span style={{fontSize:10,fontWeight:700,color:C.mt,textTransform:'uppercase',letterSpacing:'.06em'}}>⚙️ Ajustes · {ordenados.length} casillas</span>
        <span style={{display:'flex',gap:6}}>
        {edit&&(ordenConfig||[]).length>0&&<span role="button" data-aj="restablecer" onClick={()=>{onRestablecer&&onRestablecer();}}
          style={{padding:'4px 9px',borderRadius:8,fontSize:10,fontWeight:700,cursor:'pointer',background:C.mt+'22',color:C.mt}}>↺ Orden de siempre</span>}
        <span role="button" data-aj="colocar" onClick={()=>setEdit(v=>!v)}
          style={{padding:'4px 10px',borderRadius:8,fontSize:10,fontWeight:700,cursor:'pointer',background:(edit?C.sc:C.in)+'22',color:edit?C.sc:C.in}}>{edit?'✓ Hecho':'✎ Colocar'}</span>
        </span>
      </div>
      {edit&&<div data-aj="pista" style={{fontSize:10,color:C.mt,margin:'0 2px 8px',lineHeight:1.4}}>Arrastra las casillas (o usa ◀ ▶) para dejarlas como te convenga. Pulsa «Hecho» al terminar.</div>}
      <div data-aj="casillas" style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'stretch'}}>
        {ordenados.map((t,k)=>{const d=infoDe(t);return d?<CasillaAj key={t} info={d} pos={k} total={ordenados.length} edit={edit}
          arrastrando={arrastrando} onArrastrar={setArrastrando} onSoltar={soltar} onMover={mover} onAbrir={abrir}/>:null;})}
      </div>
      {hijos.map((h,i)=>(
        <ApartadoAj key={i} hijo={h} idx={i} abiertos={abiertos} alSaber={alSaber} alCerrar={cerrar} alGuardar={guardar}/>
      ))}
    </div>
  </>);
};

export {GRUPOS_AJ,SECCIONES_AJ,identificarAj,ApartadoAj,ConfigAj,CasillaAj,ES_FORM};
