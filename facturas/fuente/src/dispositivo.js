// ═══ DISPOSITIVO Y NAVEGADOR (v394-v396) ═══════════════════════════════════
// Reconstruido desde el bundle desplegado (el fuente de esas versiones no se
// conservó). Alimenta la lista de sesiones: distingue iPad de Mac por los
// puntos táctiles, reconoce Edge, Opera, Brave (de verdad, preguntándole al
// navegador), DuckDuckGo y Samsung, y añade «App» si la web está instalada
// en la pantalla de inicio. El nombre se refresca en cada latido de sesión.

export const soDe=(nav)=>{
  const u=nav&&nav.userAgent||'';const tp=nav&&nav.maxTouchPoints||0;
  return /iPhone/.test(u)?'iPhone'
    :(/iPad/.test(u)||(/Mac/.test(u)&&tp>1))?'iPad'
    :/Android/.test(u)?'Android'
    :/Windows/.test(u)?'Windows'
    :/Mac/.test(u)?'Mac'
    :/CrOS/.test(u)?'Chromebook'
    :/Linux/.test(u)?'Linux':'—';
};

export const navegadorDe=(nav,esBrave)=>{
  const u=nav&&nav.userAgent||'';
  if(esBrave)return 'Brave';
  const marcas=(nav&&nav.userAgentData&&Array.isArray(nav.userAgentData.brands)?nav.userAgentData.brands:[]).map(b=>String(b&&b.brand||''));
  const hay=(re)=>marcas.some(m=>re.test(m));
  return hay(/Brave/i)?'Brave'
    :(hay(/Edge/i)||/EdgiOS|EdgA\/|Edg\//.test(u))?'Edge'
    :(hay(/Opera/i)||/OPR\/|OPiOS|OPT\/|Opera/.test(u))?'Opera'
    :/FxiOS|Firefox/.test(u)?'Firefox'
    :/DuckDuckGo/.test(u)?'DuckDuckGo'
    :/SamsungBrowser/.test(u)?'Samsung'
    :(hay(/Google Chrome/i)||/CriOS|Chrome\//.test(u))?'Chrome'
    :/Safari/.test(u)?'Safari':'—';
};

export const esAppInstalada=(win)=>{
  try{
    if(win&&win.navigator&&win.navigator.standalone===true)return true;
    if(win&&typeof win.matchMedia==='function'){const m=win.matchMedia('(display-mode: standalone)');if(m&&m.matches)return true;}
  }catch(e){}
  return false;
};

export const describirDispositivo=(nav,win,esBrave)=>soDe(nav)+' · '+navegadorDe(nav,esBrave)+(esAppInstalada(win)?' · App':'');

// Brave se esconde tras un user-agent de Chrome: solo lo confiesa navigator.brave.isBrave().
export const dispositivoLargo=async(nav,win)=>{
  let brave=false;
  try{
    if(nav&&nav.brave&&typeof nav.brave.isBrave==='function')
      brave=!!(await Promise.race([nav.brave.isBrave(),new Promise(r=>setTimeout(()=>r(false),500))]));
  }catch(e){}
  return describirDispositivo(nav,win,brave);
};
