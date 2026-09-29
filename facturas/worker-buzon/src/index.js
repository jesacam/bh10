// ═══ BH10 · BUZÓN DE CORREO (Gmail → buzón de la app) ═══════════════════════
// Cada mañana lee el correo de la empresa (solo lectura), coge las facturas
// adjuntas (PDF o foto) de los proveedores y las deja en empresas/{uid}/buzon,
// exactamente en el formato del portal de proveedores, para que en la app
// aparezcan en «Buzón» pendientes de revisar. La app las lee con la IA al
// aceptarlas, como si las hubiera subido el proveedor.
//
// Rutas:
//   GET /autorizar   → consentimiento de Google (una sola vez, con la cuenta de la empresa)
//   GET|POST /callback → guarda el permiso (refresh token) en Firestore (empresas/{uid}/privado/gmail)
//   (el POST llega desde bh10group.com/app/buzon-gmail.html, sin URI de redirección)
//   GET /ahora       → recoge ahora mismo (exige sesión de Firebase del dueño: Authorization: Bearer …)
//   GET /estado      → último resultado (misma exigencia)

const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const GM = 'https://gmail.googleapis.com/gmail/v1/users/me';
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const deB64url = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return s; };
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });
const html = (t, status = 200) => new Response(`<!doctype html><meta charset="utf-8"><body style="font-family:system-ui;padding:40px;max-width:560px">${t}</body>`, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });

// ── Firestore con la cuenta de servicio ─────────────────────────────────────
async function tokenSA(env) {
  const sa = JSON.parse(env.SA_JSON); const ahora = Math.floor(Date.now() / 1000);
  const enc = (o) => b64url(new TextEncoder().encode(JSON.stringify(o)));
  const cab = enc({ alg: 'RS256', typ: 'JWT' }), cuerpo = enc({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: ahora, exp: ahora + 3600 });
  const pem = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem), c => c.charCodeAt(0)), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const firma = await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, key, new TextEncoder().encode(cab + '.' + cuerpo));
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + cab + '.' + cuerpo + '.' + b64url(firma) });
  const d = await r.json(); if (!d.access_token) throw new Error('sin token de la cuenta de servicio'); return d.access_token;
}
const base = (env) => `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT}/databases/(default)/documents`;
const fsVal = (v) => typeof v === 'number' ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }) : typeof v === 'boolean' ? { booleanValue: v } : v === null || v === undefined ? { nullValue: null } : Array.isArray(v) ? { arrayValue: { values: v.map(fsVal) } } : typeof v === 'object' ? (v.__ts ? { timestampValue: v.__ts } : { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fsVal(x)])) } }) : { stringValue: String(v) };
const deVal = (v) => { if (!v) return null; if ('stringValue' in v) return v.stringValue; if ('integerValue' in v) return +v.integerValue; if ('doubleValue' in v) return v.doubleValue; if ('booleanValue' in v) return v.booleanValue; if ('timestampValue' in v) return v.timestampValue; if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, deVal(x)])); if ('arrayValue' in v) return (v.arrayValue.values || []).map(deVal); return null; };
async function fsGet(env, tok, ruta) { const r = await fetch(`${base(env)}/${ruta}`, { headers: { Authorization: 'Bearer ' + tok } }); if (r.status === 404) return null; if (!r.ok) throw new Error('Firestore ' + r.status); const d = await r.json(); return Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, deVal(v)])); }
async function fsSet(env, tok, ruta, obj) { const r = await fetch(`${base(env)}/${ruta}`, { method: 'PATCH', headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fsVal(v)])) }) }); if (!r.ok) throw new Error('Firestore escribir ' + r.status + ' ' + (await r.text()).slice(0, 160)); }

// ── OAuth de Gmail ───────────────────────────────────────────────────────────
const redirect = (req) => new URL(req.url).origin + '/callback';
async function tokenGmail(env, tok) {
  const cfg = await fsGet(env, tok, `empresas/${env.EMPRESA_UID}/privado/gmail`);
  if (!cfg || !cfg.refresh_token) throw new Error('Gmail sin autorizar: abre /autorizar con la cuenta de la empresa');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.GMAIL_CLIENT_ID, client_secret: env.GMAIL_CLIENT_SECRET, refresh_token: cfg.refresh_token, grant_type: 'refresh_token' }) });
  const d = await r.json(); if (!d.access_token) throw new Error('Google no renueva el permiso: ' + JSON.stringify(d).slice(0, 160)); return d.access_token;
}

// ── verificación del token de Firebase (solo el dueño lanza /ahora) ─────────
let certsCache = { at: 0, keys: {} };
function leerLongitud(der, at) { const b = der[at]; if (b < 0x80) return { len: b, hdr: 1 }; const n = b & 0x7f; let len = 0; for (let k = 0; k < n; k++) len = (len << 8) | der[at + 1 + k]; return { len, hdr: 1 + n }; }
async function spkiDeCertificado(der) {
  const oid = [0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01]; let i = -1;
  for (let k = 0; k < der.length - oid.length; k++) { if (oid.every((b, j) => der[k + j] === b)) { i = k; break; } }
  if (i < 0) throw new Error('certificado sin clave RSA');
  let s = i - 1; while (s >= 0 && der[s] !== 0x30) s--; let s2 = s - 1; while (s2 >= 0 && der[s2] !== 0x30) s2--;
  let p = s2, cand = null;
  for (let tries = 0; tries < 4 && p >= 0; tries++) { if (der[p] === 0x30) { const { len, hdr } = leerLongitud(der, p + 1); const fin = p + 1 + hdr + len; if (fin <= der.length && fin > i + 20) { cand = der.slice(p, fin); break; } } p--; while (p >= 0 && der[p] !== 0x30) p--; }
  if (!cand) throw new Error('SPKI no encontrado');
  return crypto.subtle.importKey('spki', cand, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
}
async function certs() {
  if (Date.now() - certsCache.at < 3600e3 && Object.keys(certsCache.keys).length) return certsCache.keys;
  const pems = await (await fetch(CERTS_URL, { cf: { cacheTtl: 3600 } })).json(); const keys = {};
  for (const [kid, pem] of Object.entries(pems)) { const der = pem.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\s/g, ''); keys[kid] = await spkiDeCertificado(Uint8Array.from(atob(der), c => c.charCodeAt(0))); }
  certsCache = { at: Date.now(), keys }; return keys;
}
async function esDueno(req, env) {
  const m = /^Bearer\s+(.+)$/.exec(req.headers.get('Authorization') || ''); if (!m) return false;
  const [h, p, s] = m[1].split('.'); if (!h || !p || !s) return false;
  let cab, cuerpo; try { cab = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(deB64url(h)), c => c.charCodeAt(0)))); cuerpo = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(deB64url(p)), c => c.charCodeAt(0)))); } catch { return false; }
  const key = (await certs())[cab.kid]; if (!key) return false;
  const ok = await crypto.subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, key, Uint8Array.from(atob(deB64url(s)), c => c.charCodeAt(0)), new TextEncoder().encode(h + '.' + p));
  const ahora = Math.floor(Date.now() / 1000);
  return ok && cuerpo.exp > ahora && cuerpo.aud === env.FIREBASE_PROJECT && String(env.DUENO_UID || '').split(',').map(x => x.trim()).includes(cuerpo.sub);
}

// ── recogida ─────────────────────────────────────────────────────────────────
const ES_DOC = (nombre, mime) => /\.(pdf|jpe?g|png|webp|heic)$/i.test(nombre || '') || /^(application\/pdf|image\/(jpeg|jpg|png|webp|heic))$/i.test(mime || '');
const PARECE_FACTURA = /factur|invoice|recibo|\bfra\b|liquidaci|albar[aá]n|ticket|cargo|extracto/i;
function partes(p, out = []) { if (!p) return out; if (p.filename && p.body && p.body.attachmentId) out.push(p); (p.parts || []).forEach(x => partes(x, out)); return out; }
const cab = (msg, n) => ((msg.payload && msg.payload.headers || []).find(h => h.name.toLowerCase() === n.toLowerCase()) || {}).value || '';
const nombreDe = (from) => { const m = /^"?([^"<]+?)"?\s*<([^>]+)>/.exec(from || ''); return m ? { nombre: m[1].trim(), correo: m[2].trim().toLowerCase() } : { nombre: (from || '').split('@')[0], correo: String(from || '').toLowerCase() }; };

async function recoger(env) {
  const inicio = Date.now(); const tok = await tokenSA(env); const gtok = await tokenGmail(env, tok);
  const uid = env.EMPRESA_UID; const H = { Authorization: 'Bearer ' + gtok };
  const remitentes = String(env.REMITENTES || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const vistosDoc = (await fsGet(env, tok, `empresas/${uid}/privado/gmailVistos`)) || {}; const vistos = vistosDoc.ids || {};
  const q = encodeURIComponent(`newer_than:${+env.DIAS_ATRAS || 3}d has:attachment -in:spam -in:trash -from:${env.CUENTA}`);
  const lista = await (await fetch(`${GM}/messages?q=${q}&maxResults=100`, { headers: H })).json();
  const res = { cuando: new Date().toISOString(), revisados: 0, nuevos: 0, grandes: 0, ignorados: 0, errores: [], entradas: [] };
  for (const m of (lista.messages || [])) {
    if (vistos[m.id]) continue;
    res.revisados++;
    try {
      const msg = await (await fetch(`${GM}/messages/${m.id}?format=full`, { headers: H })).json();
      const de = nombreDe(cab(msg, 'From')), asunto = cab(msg, 'Subject'), fecha = cab(msg, 'Date');
      const adjuntos = partes(msg.payload).filter(p => ES_DOC(p.filename, p.mimeType));
      const conocido = remitentes.some(r => de.correo.includes(r) || de.nombre.toLowerCase().replace(/\s/g, '').includes(r));
      const candidatos = adjuntos.filter(p => conocido || PARECE_FACTURA.test(asunto) || PARECE_FACTURA.test(p.filename));
      if (!candidatos.length) { res.ignorados++; vistos[m.id] = res.cuando; continue; }
      for (const p of candidatos) {
        const tam = +(p.body.size || 0);
        if (tam > (+env.MAX_BYTES || 700000)) { res.grandes++; res.entradas.push({ de: de.correo, asunto, archivo: p.filename, nota: 'demasiado grande (' + Math.round(tam / 1024) + ' KB): registrar desde el correo' }); continue; }
        const att = await (await fetch(`${GM}/messages/${m.id}/attachments/${p.body.attachmentId}`, { headers: H })).json();
        const b64 = deB64url(att.data || '');
        const id = 'gm' + m.id + '_' + (p.partId || '0').replace(/[^\w]/g, '');
        await fsSet(env, tok, `empresas/${uid}/buzon/${id}`, {
          cif: '', nombre: de.nombre.slice(0, 70), archivo: b64, mime: p.mimeType || 'application/octet-stream',
          nombreArchivo: String(p.filename || 'factura').slice(0, 80), bytes: Math.round(b64.length * 3 / 4), estado: 'pendiente',
          origen: 'gmail', remitente: de.correo, asunto: asunto.slice(0, 160), gmailId: m.id, fechaCorreo: fecha, creado: { __ts: new Date().toISOString() }
        });
        res.nuevos++; res.entradas.push({ de: de.correo, asunto, archivo: p.filename });
      }
      vistos[m.id] = res.cuando;
    } catch (e) { res.errores.push(m.id + ': ' + String(e && e.message || e).slice(0, 120)); }
  }
  // poda de vistos (60 días)
  const lim = new Date(Date.now() - 60 * 86400e3).toISOString(); for (const k of Object.keys(vistos)) if (vistos[k] < lim) delete vistos[k];
  await fsSet(env, tok, `empresas/${uid}/privado/gmailVistos`, { ids: vistos });
  res.ms = Date.now() - inicio; res.entradas = res.entradas.slice(0, 40);
  await fsSet(env, tok, `empresas/${uid}/privado/gmailResumen`, res);
  console.log('buzon', JSON.stringify({ ...res, entradas: undefined }));
  return res;
}

export default {
  async scheduled(event, env, ctx) { ctx.waitUntil(recoger(env).catch(e => console.error('buzon', e))); },
  async fetch(req, env) {
    const url = new URL(req.url); const ruta = url.pathname.replace(/\/+$/, '');
    if (ruta.endsWith('/autorizar')) {
      const u = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      Object.entries({ client_id: env.GMAIL_CLIENT_ID, redirect_uri: redirect(req), response_type: 'code', scope: 'https://www.googleapis.com/auth/gmail.readonly', access_type: 'offline', prompt: 'consent', login_hint: env.CUENTA, include_granted_scopes: 'false' }).forEach(([k, v]) => u.searchParams.set(k, v));
      return Response.redirect(u.toString(), 302);
    }
    // v2 · dos caminos para el consentimiento: GET (redirección clásica, exige la URI
    // /callback dada de alta en el cliente OAuth) y POST desde la página
    // bh10group.com/app/buzon-gmail.html (ventana emergente de Google Identity
    // Services: el código se canjea con redirect_uri «postmessage» y NO hace falta
    // tocar el cliente OAuth, porque bh10group.com ya es origen autorizado).
    if (ruta.endsWith('/callback')) {
      const origen = req.headers.get('Origin') || '';
      const corsOk = /^https:\/\/([a-z0-9-]+\.)?bh10group\.com$/.test(origen);
      const cors = corsOk ? { 'Access-Control-Allow-Origin': origen, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } : {};
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
      const porPost = req.method === 'POST';
      let code = url.searchParams.get('code');
      if (porPost) { if (!corsOk) return json({ error: 'origen no permitido' }, 403); try { code = String((await req.json()).code || ''); } catch { code = ''; } }
      const responder = (obj, status) => porPost ? new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json', ...cors } })
        : html(obj.error ? '<h2>' + obj.error + '</h2>' + (obj.detalle ? '<pre>' + String(obj.detalle).replace(/</g, '&lt;') + '</pre>' : '') : '<h2>✅ Buzón de correo autorizado</h2><p>Cuenta: <b>' + obj.cuenta + '</b>. Cada mañana a las 08:00 se recogerán las facturas nuevas y aparecerán en el buzón de la app. Puedes cerrar esta pestaña.</p>', status || 200);
      if (!code) return responder({ error: 'Falta el código de Google' }, 400);
      if (!env.GMAIL_CLIENT_SECRET) return responder({ error: 'Falta el secreto GMAIL_CLIENT_SECRET en el Worker (Cloudflare → Workers & Pages → bh10-buzon → Settings → Variables and Secrets)' }, 500);
      const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: env.GMAIL_CLIENT_ID, client_secret: env.GMAIL_CLIENT_SECRET, redirect_uri: porPost ? 'postmessage' : redirect(req), grant_type: 'authorization_code' }) });
      const d = await r.json();
      if (!d.refresh_token) return responder({ error: 'Google no ha devuelto permiso permanente: vuelve a autorizar y acepta todo', detalle: JSON.stringify(d).slice(0, 300) }, 500);
      // Solo la cuenta de la empresa: nadie puede colgar su Gmail en nuestro buzón
      let cuenta = ''; try { const me = await (await fetch(`${GM}/profile`, { headers: { Authorization: 'Bearer ' + d.access_token } })).json(); cuenta = String(me.emailAddress || '').toLowerCase(); } catch {}
      if (cuenta !== String(env.CUENTA || '').toLowerCase()) return responder({ error: 'La cuenta autorizada (' + (cuenta || 'desconocida') + ') no es la de la empresa (' + env.CUENTA + '). No se ha guardado nada.' }, 403);
      const tok = await tokenSA(env);
      await fsSet(env, tok, `empresas/${env.EMPRESA_UID}/privado/gmail`, { refresh_token: d.refresh_token, cuenta, autorizadoEn: new Date().toISOString(), scope: d.scope || '', via: porPost ? 'popup' : 'redirect' });
      return responder({ ok: true, cuenta });
    }
    if (ruta.endsWith('/ahora') || ruta.endsWith('/estado')) {
      if (!(await esDueno(req, env))) return json({ error: 'solo el dueño, con sesión de Firebase' }, 401);
      if (ruta.endsWith('/ahora')) { try { return json(await recoger(env)); } catch (e) { return json({ error: String(e && e.message || e) }, 500); } }
      const tok = await tokenSA(env); return json((await fsGet(env, tok, `empresas/${env.EMPRESA_UID}/privado/gmailResumen`)) || { nunca: true });
    }
    return html('<h2>bh10-buzon</h2><p>Buzón de correo de la app de facturas. Para autorizar la cuenta de la empresa: <a href="/autorizar">/autorizar</a>.</p>');
  }
};
