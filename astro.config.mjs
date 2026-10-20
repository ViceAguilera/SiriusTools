// @ts-check
import { createHash } from 'node:crypto';
import { defineConfig, envField } from 'astro/config';
import { speculationRules } from './src/config/speculation.mjs';

import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),

  env: {
    schema: {
      // Clave compartida de 5 caracteres para entrar. Cambiarla cierra todas las sesiones abiertas.
      TOOLS_PASSWORD: envField.string({ context: 'server', access: 'secret', min: 5, max: 5 }),
      SESSION_SECRET: envField.string({ context: 'server', access: 'secret', min: 32 }),
      // true solo si la app está detrás de un proxy propio (Nginx) que agrega X-Forwarded-For.
      TRUST_PROXY: envField.boolean({ context: 'server', access: 'secret', default: false }),
      YTDLP_PATH: envField.string({ context: 'server', access: 'secret', default: 'yt-dlp' }),
      // Generador de tokens PO (bgutil). Sin definir: yt-dlp va sin tokens.
      YTDLP_POT_URL: envField.string({ context: 'server', access: 'secret', optional: true, url: true }),
      // Ruta a un cookies.txt de una cuenta de YouTube. Si no existe el archivo, se descarga sin cookies.
      YTDLP_COOKIES: envField.string({ context: 'server', access: 'secret', optional: true }),
    }
  },

  // Detrás de Nginx: confiar en Host / X-Forwarded-Host / X-Forwarded-Proto solo para el dominio real.
  // Sin esto Astro cree que la página es http://localhost:<puerto> y rechaza los POST (checkOrigin).
  security: {
    allowedDomains: [{ hostname: 'tools.iamsirius.cl', protocol: 'https' }],
    // CSP con hashes de los scripts y estilos de cada página (solo en build; en dev no aplica).
    // blob: y data: para las vistas previas y descargas que generan las herramientas en el navegador.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' blob: data:",
        "media-src 'self' blob:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      // Hash de las reglas de precarga del riel (src/config/speculation.mjs), que van inline en Layout.astro.
      scriptDirective: {
        hashes: [`sha256-${createHash('sha256').update(speculationRules).digest('base64')}`],
      },
    },
  },

  // Precarga la página al pasar el mouse por el riel: la navegación entre herramientas se siente instantánea.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },

  vite: {
    plugins: [tailwindcss()],
    // Solo en el build: empaqueta las dependencias del servidor dentro de dist/ y la imagen Docker no necesita
    // node_modules. En dev rompe (dependencias CommonJS: "require is not defined").
    ssr: { noExternal: process.argv.includes('build') ? true : undefined }
  }
});
