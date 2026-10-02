# bh10-buzon — buzón de correo automático

Worker de Cloudflare que cada mañana (06:00 UTC) revisa la cuenta de Gmail de
la empresa y deja en el buzón de FacturaControl (`empresas/{uid}/buzon`) los
adjuntos que parecen facturas (PDF/JPG/PNG), igual que si los hubiera subido
un proveedor por el portal.

## Puesta en marcha (una sola vez)

1. Google Cloud → APIs y servicios → Credenciales → cliente OAuth
   `1075389182399-…` → añadir URI de redirección autorizada:
   `https://bh10-buzon.jesacam.workers.dev/callback`
2. Cloudflare → Workers & Pages → bh10-buzon → Settings → Variables and Secrets:
   - `SA_JSON` (cuenta de servicio de Firebase, ya puesto)
   - `GMAIL_CLIENT_SECRET` (secreto del cliente OAuth)
3. Abrir `https://bh10group.com/app/buzon-gmail` (ventana emergente de Google, sin
   tocar el cliente OAuth) o, si se prefiere la redirección clásica,
   `https://bh10-buzon.jesacam.workers.dev/autorizar` con la cuenta
   `greenbighouse@gmail.com` y aceptar. El refresh token se guarda en
   `empresas/{uid}/privado/gmail`.

## Rutas

- `/autorizar` → consentimiento de Google (gmail.readonly, offline).
- `/callback` → guarda el refresh token.
- `/ahora` → ejecuta la recogida ya (cabecera `Authorization: Bearer <ID token Firebase del dueño>`).
- `/estado` → resumen de la última recogida.

## Despliegue

    cd facturas/worker-buzon && npx wrangler@4 deploy

Los remitentes conocidos están en `REMITENTES` (wrangler.toml); el resto de
adjuntos se acepta si el nombre del archivo o el asunto contiene
factura/invoice/recibo/ticket/albarán.
