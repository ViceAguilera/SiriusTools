# Herramientas — tools.iamsirius.cl

Suite personal de herramientas para no depender de sitios de terceros. Entra quien tenga la clave de 5 caracteres.

| Ruta | Herramienta | Dónde corre |
|---|---|---|
| `/` → `/youtube` | Descargar audio (MP3, FLAC) o video (MP4) de YouTube | Servidor (`yt-dlp` + `ffmpeg`) |
| `/imagenes` | Recortar, redimensionar, convertir y comprimir | Navegador |
| `/pdf` | Unir, extraer y reordenar páginas | Navegador (`pdf-lib`) |
| `/qr` | Generar códigos QR (PNG y SVG) | Navegador (`qrcode`) |
| `/metadatos` | Quitar GPS, EXIF y XMP de fotos sin recomprimir | Navegador |

Lo que corre en el navegador nunca sube los archivos al servidor.

## Stack

Astro 7 (servidor Node) + Tailwind 4 + TypeScript estricto. Tests con Vitest. Sin base de datos: la sesión es una cookie
firmada y las descargas viven en memoria y en `/tmp` hasta 15 minutos.

## Levantar en local

Requisitos: Node 24, y para el descargador `yt-dlp` y `ffmpeg` en el PATH (`winget install yt-dlp.yt-dlp`).

```bash
npm install
cp .env.example .env   # y completar TOOLS_PASSWORD y SESSION_SECRET
npm run dev
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm test` | Tests de la lógica (sesión, links de YouTube, páginas de PDF, metadatos, imágenes) |
| `npm run check` | Tipos |
| `npm run build` | Build de producción (necesita las variables del `.env`) |

## Variables de entorno

Ver `.env.example`. `TOOLS_PASSWORD` (5 caracteres) y `SESSION_SECRET` (≥ 32) son obligatorias.

## Seguridad

- Todo el sitio va detrás de la clave (`src/middleware.ts`); las APIs responden 401 sin sesión.
- 5 intentos fallidos por IP cada 15 minutos, más una regla de Cloudflare (ver `DESPLIEGUE.md`).
- Cambiar `TOOLS_PASSWORD` invalida todas las sesiones.
- El descargador solo acepta videos de YouTube: rearma la URL a partir del ID, así `yt-dlp` no puede pedir otras
  direcciones (ni servicios internos del VPS). Máximo 2 descargas a la vez, 20 en cola, 30 por hora por IP, 3 h y 2 GB
  por video, y 10 GB guardados en total.
- CSP con hashes (`security.csp` de Astro, solo en build) y cabeceras de seguridad desde `src/middleware.ts`:
  `frame-ancestors 'none'`, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP.
  Por la CSP no hay scripts inline: lo que deba correr antes de pintar va en `public/` (ver `theme-init.js`).
- Contenedor sin capacidades, `no-new-privileges`, 1 GB de memoria y 200 procesos como tope.

## Cookies y privacidad

Solo una cookie estrictamente necesaria (`tools_session`); el resto (tema, cola, aviso visto) vive en el navegador.
Sin analítica ni terceros, así que el aviso es informativo y no pide consentimiento. Detalle en `/privacidad`.

## Rendimiento

Primera visita de una página: unos 85 KB sin comprimir (HTML, CSS, fuente y su script). `pdf-lib` (~400 KB) se descarga
recién al elegir el primer PDF. La fuente se sirve desde el sitio (no Google Fonts) y los archivos de `/_astro/`
llevan hash: Nginx los marca para guardarse un año. Al pasar el mouse por el riel se precarga la herramienta.

## Despliegue

`DESPLIEGUE.md`. Pendientes y decisiones: `ROADMAP.md`.
