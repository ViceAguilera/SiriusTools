import { defineMiddleware } from 'astro:middleware';
import { hasSession } from './lib/auth';

// Todo el sitio va detrás de la clave, salvo la pantalla de entrada y la de privacidad (enlazada desde el aviso).
const PUBLIC = new Set(['/entrar', '/privacidad']);

// Cabeceras de seguridad en la app (y no solo en Nginx), así también rigen en local.
// La CSP de scripts y estilos la arma Astro (security.csp); aquí se le suma frame-ancestors como política aparte.
const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'X-Robots-Tag': 'noindex, nofollow',
};

function secure(response: Response): Response {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(name, value);
  // append y no set: si Astro ya mandó su CSP en cabecera, set la borraría. Dos políticas se aplican ambas.
  response.headers.append('Content-Security-Policy', "frame-ancestors 'none'");
  // Páginas privadas: que ni el navegador ni Cloudflare guarden copias compartibles.
  if (!response.headers.has('Cache-Control')) response.headers.set('Cache-Control', 'private, no-cache');
  return response;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname.replace(/\/+$/, '') || '/';
  if (!PUBLIC.has(pathname) && !hasSession(context.cookies)) {
    if (pathname.startsWith('/api/')) return secure(Response.json({ error: 'Sesión vencida.' }, { status: 401 }));
    const target = pathname === '/' ? '/entrar' : `/entrar?next=${encodeURIComponent(pathname)}`;
    return secure(context.redirect(target));
  }
  return secure(await next());
});
