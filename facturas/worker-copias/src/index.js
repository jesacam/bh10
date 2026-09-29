// ═══ BH10 · COPIAS DE SEGURIDAD AUTOMÁTICAS ═══════════════════════════════
// Cada noche lee todas las claves de la empresa (y de sus sub-empresas) en
// Firestore, monta el mismo JSON que «Copia de seguridad completa v9» de la
// app y lo guarda:
//   1. En Firestore, en empresas/{uid}/copias/{fecha} (comprimido; 30 días).
//   2. Si hay DRIVE_FOLDER_ID, como zip cifrado con COPIA_CLAVE en esa
//      carpeta de Google Drive (90 días). Se restaura desde la app con
//      «Restaurar backup» y la contraseña, igual que las copias manuales.
// Sin coste: Firestore y Drive dentro de sus tramos gratuitos.
import { BlobWriter, TextReader, ZipWriter } from '@zip.js/zip.js';

const FUERA = new Set(['bh10-anthkey', 'bh10-sesiones', 'bh10-ping', 'bh10-ultimacopia']);
const b64url = (s) => btoa(String.fromCharCode(...new Uint8Array(s))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

async function tokenSA(env, scope) {
  const sa = JSON.parse(env.SA_JSON);
  const ahora = Math.floor(Date.now() / 1000);
  const enc = (o) => b64url(new TextEncoder().encode(JSON.stringify(o)));
  const cab = enc({ alg: 'RS256', typ: 'JWT' });
  const cuerpo = enc({ iss: sa.client_email, scope, aud: 'https://oauth2.googleapis.com/token', iat: ahora, exp: ahora + 3600 });
  const pem = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem), c => c.charCodeAt(0)), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const firma = await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, key, new TextEncoder().encode(cab + '.' + cuerpo));
  const jwt = cab + '.' + cuerpo + '.' + b64url(firma);
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt });
  const d = await r.json(); if (!d.access_token) throw new Error('sin token de la cuenta de servicio'); return d.access_token;
}

const base = (env) => `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT}/databases/(default)/documents`;
const val = (v) => {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue; if ('integerValue' in v) return +v.integerValue; if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue; if ('nullValue' in v) return null; return null;
};
const campos = (doc) => Object.fromEntries(Object.entries(doc.fields || {}).map(([k, v]) => [k, val(v)]));

async function gunzipB64(s) {
  const bytes = Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const ds = new DecompressionStream('gzip'); const w = ds.writable.getWriter(); w.write(bytes); w.close();
  return new TextDecoder().decode(await new Response(ds.readable).arrayBuffer());
}
async function gzipB64(texto) {
  const cs = new CompressionStream('gzip'); const w = cs.writable.getWriter(); w.write(new TextEncoder().encode(texto)); w.close();
  const buf = new Uint8Array(await new Response(cs.readable).arrayBuffer());
  let s = ''; for (let i = 0; i < buf.length; i += 8192) s += String.fromCharCode.apply(null, buf.subarray(i, i + 8192));
  return btoa(s);
}

// Lee todas las claves de una colección kv (con sus trozos ~N) y devuelve {clave: texto}
async function leerKv(env, tok, ruta) {
  const out = {}; let pageToken = '';
  const docs = [];
  do {
    const r = await fetch(`${base(env)}/${ruta}?pageSize=300${pageToken ? '&pageToken=' + pageToken : ''}`, { headers: { Authorization: 'Bearer ' + tok } });
    if (!r.ok) throw new Error('Firestore ' + r.status + ' en ' + ruta);
    const d = await r.json(); (d.documents || []).forEach(x => docs.push(x)); pageToken = d.nextPageToken || '';
  } while (pageToken);
  const porId = {}; docs.forEach(x => { porId[x.name.split('/').pop()] = campos(x); });
  for (const id of Object.keys(porId)) {
    if (id.includes('~') || FUERA.has(id)) continue;
    const f = porId[id]; let v;
    if (+f.p > 0) { v = ''; for (let i = 0; i < +f.p; i++) v += (porId[id + '~' + i] || {}).v || ''; } else v = f.v;
    if (typeof v !== 'string') continue;
    if (+f.z) { try { v = await gunzipB64(v); } catch { continue; } }
    out[id] = v;
  }
  return out;
}

async function listarSubs(env, tok, uid) {
  const r = await fetch(`${base(env)}/empresas/${uid}/sub?pageSize=50&showMissing=true`, { headers: { Authorization: 'Bearer ' + tok } });
  if (!r.ok) return [];
  const d = await r.json(); return (d.documents || []).map(x => x.name.split('/').pop());
}

async function montarCopia(env, tok) {
  const uid = env.EMPRESA_UID;
  const fecha = new Date().toISOString().slice(0, 10);
  const claves = await leerKv(env, tok, `empresas/${uid}/kv`);
  const sub = {};
  for (const s of await listarSubs(env, tok, uid)) sub[s] = await leerKv(env, tok, `empresas/${uid}/sub/${s}/kv`);
  return { version: 9, fecha, generada: new Date().toISOString(), origen: 'bh10-copias (automática)', claves, sub };
}

async function guardarFirestore(env, tok, copia, texto) {
  const uid = env.EMPRESA_UID; const b64 = await gzipB64(texto);
  const doc = { fields: { v: { stringValue: b64 }, z: { integerValue: '1' }, bytes: { integerValue: String(texto.length) }, claves: { integerValue: String(Object.keys(copia.claves).length) }, t: { stringValue: copia.generada }, origen: { stringValue: 'bh10-copias' } } };
  const r = await fetch(`${base(env)}/empresas/${uid}/copias/${copia.fecha}`, { method: 'PATCH', headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' }, body: JSON.stringify(doc) });
  if (!r.ok) throw new Error('no se pudo guardar la copia en Firestore: ' + r.status + ' ' + (await r.text()).slice(0, 200));
  // retención
  const lim = new Date(Date.now() - (+env.DIAS_RETENCION_FIRESTORE || 30) * 86400000).toISOString().slice(0, 10);
  const l = await fetch(`${base(env)}/empresas/${uid}/copias?pageSize=200`, { headers: { Authorization: 'Bearer ' + tok } });
  let borradas = 0;
  if (l.ok) for (const d of ((await l.json()).documents || [])) { const id = d.name.split('/').pop(); if (id < lim) { await fetch(`${base(env)}/empresas/${uid}/copias/${id}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + tok } }); borradas++; } }
  return { bytes: b64.length, borradas };
}

async function zipCifrado(nombre, texto, clave) {
  const zw = new ZipWriter(new BlobWriter('application/zip'), { password: clave, encryptionStrength: 3, zip64: false });
  await zw.add(nombre, new TextReader(texto));
  return await zw.close();
}

async function guardarDrive(env, tokDrive, copia, texto) {
  const nombre = `BH10_copia_completa_${copia.fecha}.zip`;
  const blob = await zipCifrado(`BH10_copia_completa_${copia.fecha}.json`, texto, env.COPIA_CLAVE);
  const meta = JSON.stringify({ name: nombre, parents: [env.DRIVE_FOLDER_ID], mimeType: 'application/zip' });
  const boundary = 'bh10' + Date.now();
  const cuerpo = new Blob([`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: application/zip\r\n\r\n`, blob, `\r\n--${boundary}--`]);
  const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,size', { method: 'POST', headers: { Authorization: 'Bearer ' + tokDrive, 'Content-Type': 'multipart/related; boundary=' + boundary }, body: cuerpo });
  if (!r.ok) throw new Error('Drive ' + r.status + ' ' + (await r.text()).slice(0, 200));
  const subida = await r.json();
  // retención en Drive: solo las copias automáticas (nombre con prefijo) más viejas que el límite
  const lim = new Date(Date.now() - (+env.DIAS_RETENCION_DRIVE || 90) * 86400000).toISOString();
  const q = encodeURIComponent(`'${env.DRIVE_FOLDER_ID}' in parents and name contains 'BH10_copia_completa_' and createdTime < '${lim}' and trashed = false`);
  const l = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`, { headers: { Authorization: 'Bearer ' + tokDrive } });
  let borradas = 0;
  if (l.ok) for (const f of ((await l.json()).files || [])) { const d = await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}?supportsAllDrives=true`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + tokDrive } }); if (d.ok) borradas++; }
  return { archivo: subida.name, bytes: +subida.size || blob.size, borradas };
}

async function copiar(env) {
  const inicio = Date.now();
  const tok = await tokenSA(env, 'https://www.googleapis.com/auth/datastore');
  const copia = await montarCopia(env, tok);
  const texto = JSON.stringify(copia);
  const res = { fecha: copia.fecha, claves: Object.keys(copia.claves).length, subEmpresas: Object.keys(copia.sub).length, bytes: texto.length };
  res.firestore = await guardarFirestore(env, tok, copia, texto);
  if (env.DRIVE_FOLDER_ID && env.COPIA_CLAVE) {
    try { const tokD = await tokenSA(env, 'https://www.googleapis.com/auth/drive'); res.drive = await guardarDrive(env, tokD, copia, texto); }
    catch (e) { res.drive = { error: String(e && e.message || e) }; }
  }
  res.ms = Date.now() - inicio;
  console.log('copia', JSON.stringify(res));
  return res;
}

export default {
  async scheduled(event, env, ctx) { ctx.waitUntil(copiar(env)); },
  async fetch(req, env) {
    // Solo el dueño, con la contraseña de las copias, puede lanzar una copia a mano o ver el estado
    const url = new URL(req.url);
    if (!env.COPIA_CLAVE || req.headers.get('X-Copia-Clave') !== env.COPIA_CLAVE) return new Response('no', { status: 401 });
    if (url.pathname.endsWith('/ahora')) { try { return Response.json(await copiar(env)); } catch (e) { return Response.json({ error: String(e && e.message || e) }, { status: 500 }); } }
    if (url.pathname.endsWith('/estado')) {
      const tok = await tokenSA(env, 'https://www.googleapis.com/auth/datastore');
      const l = await fetch(`${base(env)}/empresas/${env.EMPRESA_UID}/copias?pageSize=200`, { headers: { Authorization: 'Bearer ' + tok } });
      const d = l.ok ? await l.json() : {};
      return Response.json({ copias: (d.documents || []).map(x => ({ fecha: x.name.split('/').pop(), ...campos(x), v: undefined })) });
    }
    return new Response('bh10-copias', { status: 200 });
  }
};
