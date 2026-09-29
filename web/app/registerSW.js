/* Registro del service worker y aviso de versión nueva.
 *
 * En una aplicación instalada la pestaña no se recarga sola: se queda con la
 * versión que cargó el primer día. Sin este aviso alguien puede pasarse semanas
 * usando una versión antigua sin enterarse —y sin recibir las correcciones—,
 * que es exactamente lo que ocurre cuando algo «sigue fallando después de
 * actualizar».
 *
 * El relevo NO se toma por sorpresa: el trabajador nuevo espera a que el
 * usuario pulse «Actualizar». Si tomara el mando de golpe, la página abierta
 * seguiría ejecutando el código antiguo pero pediría al servidor los trozos que
 * se cargan bajo demanda, y esos ya serían los nuevos: fallos raros a media
 * faena.
 *
 * Si el registro falla (sin TLS, navegador sin soporte) la app sigue
 * funcionando; solo se pierde el uso sin conexión.
 */
(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;

  var registro = null;
  var avisoPuesto = false;
  var recargando = false;
  var CADA = 30 * 60 * 1000;   // se pregunta por versiones nuevas cada media hora

  // ── Barra de aviso ────────────────────────────────────────────────────────
  // Deliberadamente neutra (oscura con acento verde): la app tiene seis
  // familias de color y esta barra debe verse bien en todas.
  function avisar(esperando) {
    if (avisoPuesto || !esperando) return;
    avisoPuesto = true;

    var barra = document.createElement('div');
    barra.id = 'bh10-aviso-version';
    barra.setAttribute('role', 'status');
    barra.style.cssText = [
      'position:fixed', 'left:50%', 'transform:translateX(-50%)',
      'bottom:calc(58px + min(env(safe-area-inset-bottom, 0px), 20px))',
      'z-index:9999', 'max-width:min(440px, calc(100vw - 20px))', 'width:max-content',
      'display:flex', 'align-items:center', 'gap:10px',
      'background:#131C31', 'color:#F1F5F9',
      'border:1px solid rgba(255,255,255,.18)', 'border-radius:14px',
      'padding:11px 13px', 'font-size:13px', 'line-height:1.35',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
      'box-shadow:0 18px 40px -20px rgba(0,0,0,.75)',
    ].join(';');

    var texto = document.createElement('span');
    texto.textContent = 'Hay una versión nueva de la app.';
    texto.style.cssText = 'flex:1;min-width:0';

    var btn = document.createElement('button');
    btn.textContent = 'Actualizar';
    btn.style.cssText = [
      'flex-shrink:0', 'background:#7BF07B', 'color:#04120C', 'border:none',
      'border-radius:999px', 'padding:9px 16px', 'font-size:13px',
      'font-weight:700', 'cursor:pointer', 'font-family:inherit',
    ].join(';');
    btn.onclick = function () { aplicar(btn); };

    var luego = document.createElement('button');
    luego.textContent = 'Luego';
    luego.setAttribute('aria-label', 'Cerrar el aviso');
    luego.style.cssText = [
      'flex-shrink:0', 'background:transparent', 'color:#94A3B8', 'border:none',
      'font-size:12px', 'cursor:pointer', 'padding:6px 2px', 'font-family:inherit',
    ].join(';');
    luego.onclick = function () {
      barra.remove();
      avisoPuesto = false;   // volverá a avisar en la próxima comprobación
    };

    barra.appendChild(texto);
    barra.appendChild(luego);
    barra.appendChild(btn);
    document.body.appendChild(barra);
  }

  // ── Tomar la versión nueva ────────────────────────────────────────────────
  function aplicar(btn) {
    var esperando = registro && registro.waiting;
    if (!esperando) { location.reload(); return; }
    if (btn) { btn.disabled = true; btn.textContent = 'Actualizando…'; btn.style.opacity = '.7'; }
    // Se le pide al trabajador nuevo que tome el relevo. Cuando lo haga, el
    // navegador dispara controllerchange y ahí se recarga con todo ya nuevo.
    esperando.postMessage({ type: 'SKIP_WAITING' });
    // Red de seguridad: si el relevo no llega en 4 segundos, se recarga igual.
    setTimeout(function () { if (!recargando) { recargando = true; location.reload(); } }, 4000);
  }

  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (recargando) return;
    recargando = true;
    location.reload();
  });

  // ── Vigilancia ────────────────────────────────────────────────────────────
  function revisar(reg) {
    if (reg.waiting && navigator.serviceWorker.controller) { avisar(reg.waiting); return; }
    if (!reg.installing) return;
    reg.installing.addEventListener('statechange', function () {
      // «installed» con un trabajador ya al mando significa que esto es una
      // actualización, no la primera instalación.
      if (this.state === 'installed' && navigator.serviceWorker.controller) avisar(reg.waiting || this);
    });
  }

  function comprobar() {
    if (!registro) return Promise.resolve(false);
    return registro.update()
      .then(function () { revisar(registro); return !!registro.waiting; })
      .catch(function () { return false; });
  }

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/app/sw.js', { scope: '/app/' })
      .then(function (reg) {
        registro = reg;
        revisar(reg);
        reg.addEventListener('updatefound', function () { revisar(reg); });
        setInterval(comprobar, CADA);
        // Al volver a la app se comprueba: es el momento natural para hacerlo y
        // evita tener la app abierta días con una versión vieja.
        document.addEventListener('visibilitychange', function () {
          if (!document.hidden) comprobar();
        });
      })
      .catch(function () {});
  });

  // Puente para que la propia app pueda ofrecer el botón desde Ajustes
  window.bh10Actualizar = {
    hayNueva: function () { return !!(registro && registro.waiting); },
    comprobar: comprobar,
    aplicar: function () { aplicar(null); },
  };
})();
