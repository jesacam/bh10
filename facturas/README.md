# BH10 · App de facturas

Estructura de la nube (proyecto Firebase `b10h-facturas`):

- `worker/worker_master.js` — Worker de Cloudflare `bh10-master` (proxy a la IA, alta/baja de usuarios). Secretos en Cloudflare: FIREBASE_PROJECT, DUENO_UID, ANTHROPIC_KEY, SERVICE_ACCOUNT.
- `worker-copias/` — Worker `bh10-copias`: copia completa automática cada noche (03:15) en tres sitios: Firestore `empresas/{uid}/copias` (30 días), Cloudflare Workers KV «bh10-copias» (90 días, fuera de Google) y la carpeta «Copias BH10» del Drive del dueño (JSON sin contraseña; reutiliza por turnos los 31 archivos BH10_copia_libre_NN.json creados por el dueño, porque las cuentas de servicio no tienen cuota en Drive). Rutas `/ahora`, `/estado` y `/kv/{fecha}` solo para el dueño (sesión de Firebase o X-Copia-Clave). Secretos: SA_JSON, EMPRESA_UID, DRIVE_FOLDER_ID, COPIA_CLAVE (opcional).
- `firestore/firestore.rules` — reglas de seguridad de Firestore. Se publican en Firebase → Firestore → Reglas.
- Los datos viven en Firestore en `empresas/{uid}/kv/{clave}` (una clave por bloque: `bh10-fc-v3` son las facturas) y los adjuntos en `empresas/{uid}/adj/{id}`.
- La app (HTML) va en esta carpeta cuando se suba.

Las copias de seguridad de datos (zip cifrado) NO se guardan en este repositorio: contienen datos personales y el repositorio es público.
