// ═══ BH10 · WORKER MASTER v368 ══════════════════════════════════════════════
// Sustituye al Worker Master anterior. Pegar en Cloudflare → Workers → (tu
// worker master) → Editar código. Secretos (Settings → Variables → Secrets):
//   FIREBASE_PROJECT   b10h-facturas
//   DUENO_UID          uid(s) de Firebase Auth de los dueños, separados por comas
//                      (Firebase → Authentication → Users). v375: admite varios «Master total».
//   ANTHROPIC_KEY      la clave sk-ant-… (rotada; NUNCA vuelve a la app)
//   SERVICE_ACCOUNT    (como antes) el JSON de la cuenta de servicio para crear/deshabilitar usuarios
//   CLAVE              (opcional, transición) la clave antigua de cabecera; se puede borrar tras probar
//
// Qué cambia (Jesús, 06-09-2026, puntos 1 y 2 de seguridad):
//   · Ninguna llamada exige ya un secreto compartido: se exige un TOKEN DE FIREBASE
//     válido del proyecto (Authorization: Bearer …). Se verifica la firma RS256
//     con las claves públicas de Google, la caducidad, el emisor y la audiencia.
//   · /crearUsuario y /estadoUsuario solo los puede llamar el DUEÑO (uid = DUENO_UID).
//   · /ia es un proxy hacia api.anthropic.com: la clave vive aquí como secreto. Puede
//     llamarlo el dueño o cualquier miembro ACTIVO (se comprueba su ficha en Firestore
//     con su propio token, que las reglas le dejan leer). Límite de 60 llamadas por
//     minuto y uid.
//   · /ip sigue siendo público (solo devuelve la IP: lo usa la lista de sesiones).

const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const ANTHROPIC = 'https://api.anthropic.com/v1/messages';
const cors = (origen) => ({
  'Access-Control-Allow-Origin': origen && /^https:\/\/([a-z0-9-]+\.)?bh10group\.com$/.test(origen) ? origen : 'https://bh10group.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Bh10-Clave',
  'Access-Control-Max-Age': '600',
});
const json = (obj, status, origen) => new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json', ...cors(origen) } });

// ── certificados de Google (caché en memoria del Worker) ────────────────────
let certsCache = { at: 0, keys: {} };
async function certs() {
  if (Date.now() - certsCache.at < 3600 * 1000 && Object.keys(certsCache.keys).length) return certsCache.keys;
  const r = await fetch(CERTS_URL, { cf: { cacheTtl: 3600 } });
  const pems = await r.json();
  const keys = {};
  for (const [kid, pem] of Object.entries(pems)) {
    const der = pem.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\s/g, '');
    const bytes = Uint8Array.from(atob(der), c => c.charCodeAt(0));
    keys[kid] = await spkiDeCertificado(bytes);
  }
  certsCache = { at: Date.now(), keys };
  return keys;
}
// Saca la clave pública (SubjectPublicKeyInfo) de un certificado X.509 DER sin librerías:
// se busca la secuencia del SPKI por su OID rsaEncryption y se importa con WebCrypto.
async function spkiDeCertificado(der) {
  const oid = [0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01];
  let i = -1;
  for (let k = 0; k < der.length - oid.length; k++) { if (oid.every((b, j) => der[k + j] === b)) { i = k; break; } }
  if (i < 0) throw new Error('certificado sin clave RSA');
  // retroceder hasta el SEQUENCE que envuelve AlgorithmIdentifier + BIT STRING: SEQ { SEQ { OID, NULL }, BITSTRING }
  let s = i - 1; while (s >= 0 && der[s] !== 0x30) s--;          // SEQ del AlgorithmIdentifier
  let s2 = s - 1; while (s2 >= 0 && der[s2] !== 0x30) s2--;       // SEQ del SPKI (puede tener longitud larga)
  let p = s2, cand = null;
  for (let tries = 0; tries < 4 && p >= 0; tries++) {
    if (der[p] === 0x30) { const { len, hdr } = leerLongitud(der, p + 1); const fin = p + 1 + hdr + len; if (fin <= der.length && fin > i + 20) { cand = der.slice(p, fin); break; } }
    p--; while (p >= 0 && der[p] !== 0x30) p--;
  }
  if (!cand) throw new Error('SPKI no encontrado');
  return crypto.subtle.importKey('spki', cand, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
}
function leerLongitud(der, at) {
  const b = der[at]; if (b < 0x80) return { len: b, hdr: 1 };
  const n = b & 0x7f; let len = 0; for (let k = 0; k < n; k++) len = (len << 8) | der[at + 1 + k];
  return { len, hdr: 1 + n };
}
const b64url = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), c => c.charCodeAt(0)); };

// ── verificación del token de Firebase ─────────────────────────────────────
async function verificarToken(req, env) {
  const auth = req.headers.get('Authorization') || '';
  const m = /^Bearer\s+(.+)$/.exec(auth); if (!m) return null;
  const [h, p, s] = m[1].split('.'); if (!h || !p || !s) return null;
  let cab, cuerpo; try { cab = JSON.parse(new TextDecoder().decode(b64url(h))); cuerpo = JSON.parse(new TextDecoder().decode(b64url(p))); } catch { return null; }
  if (cab.alg !== 'RS256' || !cab.kid) return null;
  const keys = await certs(); const key = keys[cab.kid]; if (!key) return null;
  const ok = await crypto.subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, key, b64url(s), new TextEncoder().encode(h + '.' + p));
  if (!ok) return null;
  const ahora = Math.floor(Date.now() / 1000);
  if (!(cuerpo.exp > ahora) || !(cuerpo.iat <= ahora + 300)) return null;
  if (cuerpo.aud !== env.FIREBASE_PROJECT || cuerpo.iss !== 'https://securetoken.google.com/' + env.FIREBASE_PROJECT) return null;
  if (!cuerpo.sub || cuerpo.sub !== cuerpo.user_id) return null;
  return { uid: cuerpo.sub, email: cuerpo.email || '', token: m[1] };
}
// v375 · DUENO_UID puede llevar varios uid separados por comas: cualquiera de
// ellos es dueño («Master total»). Espacios y comas de más no estorban.
const DUENOS = (env) => String(env.DUENO_UID || '').split(',').map(s => s.trim()).filter(Boolean);
const esDueno = (uid, env) => !!uid && DUENOS(env).includes(uid);
// ¿es el dueño, o un miembro activo? (lee su ficha con su propio token; las reglas se lo permiten)
async function miembroActivo(quien, env) {
  if (esDueno(quien.uid, env)) return { dueno: true };
  const r = await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT}/databases/(default)/documents/miembros/${quien.uid}`, { headers: { Authorization: 'Bearer ' + quien.token } });
  if (!r.ok) return null;
  const d = await r.json(); const f = (d && d.fields) || {};
  const estado = f.estado && f.estado.stringValue; const dueno = f.dueno && f.dueno.stringValue;
  if (estado !== 'activo' || !esDueno(dueno, env)) return null;
  return { dueno: false };
}

// ── límite de llamadas a la IA por uid ─────────────────────────────────────
const ventana = new Map();
function limite(uid, max) {
  const ahora = Date.now(); const v = (ventana.get(uid) || []).filter(t => ahora - t < 60000);
  if (v.length >= max) return false; v.push(ahora); ventana.set(uid, v); return true;
}

// ── Firebase Admin por REST (crear / deshabilitar usuarios) con la cuenta de servicio ──
async function tokenAdmin(env) {
  const sa = JSON.parse(env.SERVICE_ACCOUNT);
  const ahora = Math.floor(Date.now() / 1000);
  const cab = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const cuerpo = btoa(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/cloud-platform', aud: 'https://oauth2.googleapis.com/token', iat: ahora, exp: ahora + 3600 })).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const pem = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem), c => c.charCodeAt(0)), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const firma = new Uint8Array(await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, key, new TextEncoder().encode(cab + '.' + cuerpo)));
  const jwt = cab + '.' + cuerpo + '.' + btoa(String.fromCharCode(...firma)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt });
  const d = await r.json(); if (!d.access_token) throw new Error('sin token de admin'); return d.access_token;
}
const IDENTITY = 'https://identitytoolkit.googleapis.com/v1';

export default {
  async fetch(req, env) {
    const url = new URL(req.url); const origen = req.headers.get('Origin') || '';
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origen) });
    if (url.pathname.endsWith('/ip')) return json({ ip: req.headers.get('CF-Connecting-IP') || '' }, 200, origen);

    // transición: la clave antigua sigue valiendo SOLO si existe el secreto CLAVE (bórralo cuando la app ya mande token)
    const claveVieja = env.CLAVE && req.headers.get('X-Bh10-Clave') === env.CLAVE;
    const quien = await verificarToken(req, env);
    if (!quien && !claveVieja) return json({ error: 'sin sesión válida' }, 401, origen);

    // v369 · ¿quién llama? — respalda el botón «Probar conexión» de la app:
    // con token válido dice quién eres; solo con la clave antigua lo señala.
    if (url.pathname.endsWith('/quienSoy')) {
      if (!quien) return json({ viaClave: true }, 200, origen);
      const m = await miembroActivo(quien, env);
      return json({ uid: quien.uid, email: quien.email, dueno: !!(m && m.dueno), activo: !!m, viaClave: false }, 200, origen);
    }

    if (url.pathname.endsWith('/ia')) {
      if (!quien) return json({ error: 'la IA exige sesión de Firebase' }, 401, origen);
      const m = await miembroActivo(quien, env); if (!m) return json({ error: 'usuario no activo' }, 403, origen);
      if (!limite(quien.uid, 60)) return json({ error: 'demasiadas llamadas: espera un minuto' }, 429, origen);
      if (!env.ANTHROPIC_KEY) return json({ error: 'el Worker no tiene ANTHROPIC_KEY' }, 500, origen);
      const cuerpo = await req.text();
      if (cuerpo.length > 25 * 1024 * 1024) return json({ error: 'petición demasiado grande' }, 413, origen);
      const r = await fetch(ANTHROPIC, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' }, body: cuerpo });
      return new Response(await r.text(), { status: r.status, headers: { 'Content-Type': 'application/json', ...cors(origen) } });
    }

    // lo demás: solo el dueño
    if (!claveVieja && (!quien || !esDueno(quien.uid, env))) return json({ error: 'solo el dueño' }, 403, origen);
    let cuerpo = {}; try { cuerpo = await req.json(); } catch {}
    if (url.pathname.endsWith('/crearUsuario')) {
      const email = String(cuerpo.email || '').trim().toLowerCase(); const clave = String(cuerpo.clave || '');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || clave.length < 8) return json({ error: 'email o contraseña no válidos' }, 400, origen);
      const t = await tokenAdmin(env);
      const r = await fetch(`${IDENTITY}/accounts:signUp`, { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: clave, displayName: String(cuerpo.nombre || ''), returnSecureToken: false }) });
      const d = await r.json(); if (!r.ok) return json({ error: (d.error && d.error.message) || 'no se pudo crear' }, 400, origen);
      return json({ uid: d.localId, email }, 200, origen);
    }
    if (url.pathname.endsWith('/estadoUsuario')) {
      const uid = String(cuerpo.uid || ''); if (!uid) return json({ error: 'sin uid' }, 400, origen);
      const t = await tokenAdmin(env);
      const r = await fetch(`${IDENTITY}/accounts:update`, { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ localId: uid, disableUser: !!cuerpo.deshabilitar }) });
      const d = await r.json(); if (!r.ok) return json({ error: (d.error && d.error.message) || 'no se pudo cambiar' }, 400, origen);
      return json({ uid: d.localId, deshabilitado: !!cuerpo.deshabilitar }, 200, origen);
    }
    // v374 · Jesús: «he dado de alta un usuario de prueba y no podemos
    // borrarlo». Suspender solo deshabilita: la cuenta sigue existiendo y el
    // correo queda pillado. Esto la borra de verdad de Firebase Auth y libera
    // el correo. Solo el dueño llega aquí (el filtro está más arriba).
    if (url.pathname.endsWith('/borrarUsuario')) {
      const uid = String(cuerpo.uid || ''); if (!uid) return json({ error: 'sin uid' }, 400, origen);
      if (esDueno(uid, env)) return json({ error: 'la cuenta de un dueño no se borra desde aquí' }, 400, origen);
      const t = await tokenAdmin(env);
      const r = await fetch(`${IDENTITY}/accounts:delete`, { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ localId: uid }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return json({ error: (d.error && d.error.message) || 'no se pudo borrar' }, 400, origen);
      return json({ uid, borrado: true }, 200, origen);
    }

    return json({ error: 'ruta desconocida' }, 404, origen);
  }
};
