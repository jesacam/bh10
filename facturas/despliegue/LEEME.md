# Cómo se publica bh10group.com

La web y la app viven en el Worker de Cloudflare `v21` (solo archivos estáticos,
sin código). Los dominios bh10group.com y www.bh10group.com apuntan a ese Worker.
No hay proyecto de Pages.

Publicar una versión = subir la carpeta completa del sitio (la misma estructura
que los zips `BH10_web_subir_vNNN`): `app/`, `c/`, `clientes/`, `facturas/`,
`fichar/` e `index.html`. La subida REEMPLAZA todos los archivos del sitio, así
que la carpeta tiene que llevar el sitio entero, no solo la app.

Desde v399 la carpeta del sitio completa vive en el repositorio (`web/`), así que
Git es la fuente de verdad: lo que hay en `web/` es lo que se publica. El flujo
de GitHub Actions `.github/workflows/desplegar.yml` comprueba que el bundle
comprometido coincide con una compilación limpia del fuente, pasa las baterías
rápidas y despliega con `wrangler`. Necesita los secretos `CLOUDFLARE_API_TOKEN`
y `CLOUDFLARE_ACCOUNT_ID` en el repositorio (Settings → Secrets → Actions).

Pasos (los hace Claude con el token de Cloudflare, o el flujo de Actions):

1. Compilar la app: `node taller/build_app.mjs` en `facturas/fuente` (produce
   `web_subir/app/assets/bh10-APPVNNN.js` y sus trozos).
2. Montar la carpeta del sitio: descargar el sitio publicado, sustituir los
   assets de la versión anterior por los nuevos, crear `app/assets/app-vNNN.js`
   (el cargador de una línea), apuntar `app/index.html` al cargador nuevo y
   regenerar la lista de precache de `app/sw.js` con la huella md5 de cada archivo.
3. Desplegar: `npx wrangler@4 deploy --config wrangler.toml` con las variables
   `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`.
4. Comprobar: `https://bh10group.com/app/` debe cargar `assets/app-vNNN.js` y
   `app/sw.js` no debe mencionar la versión anterior.

Historial:
- v397 · 29-09-2026 · lector robusto ante fotos giradas.
- v398 · 29-09-2026 · escrituras por transacción (fin de los pisotones entre aparatos), orden por fecha de registro, gestoría desde una fecha.
- v399 · 29-09-2026 · el lector no imputa a obra la dirección propia; casa con el catálogo de obras.
