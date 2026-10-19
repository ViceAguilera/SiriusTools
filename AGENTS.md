## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Proyecto

Suite personal de herramientas en tools.iamsirius.cl (tier "va a durar"). Ver README para rutas y seguridad, ROADMAP para pendientes.

- Todo detrás de una clave compartida (`src/middleware.ts`, `src/lib/auth.ts`); la lógica pura de la sesión está en `src/lib/session.ts`.
- `auth.ts`, `server.ts` y `jobs.ts` leen `astro:env/server`: no importarlos desde tests. La lógica testeable va en módulos puros (`session`, `youtube`, `image`, `metadata`, `pages`, `color`, `redirect`).
- Solo `/youtube` usa el servidor. Las demás herramientas procesan los archivos en el navegador: no agregar endpoints que reciban archivos del usuario.
- El estilo es provisorio: usar solo los tokens y clases de `src/styles/global.css`.
- Nueva herramienta: entrada en `src/config/tools.ts` + página en `src/pages/`.
- Antes de dar algo por terminado: `npm test`, `npm run check` y `npm run build` (con `TOOLS_PASSWORD` y `SESSION_SECRET` en el entorno).
