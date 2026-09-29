# BH10 · App de facturas

Estructura de la nube (proyecto Firebase `b10h-facturas`):

- `worker/worker_master.js` — Worker de Cloudflare `bh10-master` (proxy a la IA, alta/baja de usuarios). Secretos en Cloudflare: FIREBASE_PROJECT, DUENO_UID, ANTHROPIC_KEY, SERVICE_ACCOUNT.
- `firestore/firestore.rules` — reglas de seguridad de Firestore. Se publican en Firebase → Firestore → Reglas.
- Los datos viven en Firestore en `empresas/{uid}/kv/{clave}` (una clave por bloque: `bh10-fc-v3` son las facturas) y los adjuntos en `empresas/{uid}/adj/{id}`.
- La app (HTML) va en esta carpeta cuando se suba.

Las copias de seguridad de datos (zip cifrado) NO se guardan en este repositorio: contienen datos personales y el repositorio es público.
