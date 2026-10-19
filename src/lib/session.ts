// Lógica pura de la sesión (sin astro:env), para poder testearla.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 30;

export function safeEqual(a: string, b: string): boolean {
  // Hashear primero iguala largos y evita filtrar la longitud por timing.
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

// La clave también firma con la contraseña: al cambiar TOOLS_PASSWORD se invalidan todas las sesiones.
function sign(payload: string, secret: string, password: string): string {
  return createHmac('sha256', `${secret}\0${password}`).update(payload).digest('base64url');
}

export function createToken(secret: string, password: string, now = Date.now()): string {
  const expires = String(now + SESSION_MAX_AGE_S * 1000);
  return `${expires}.${sign(expires, secret, password)}`;
}

export function verifyToken(token: string | undefined, secret: string, password: string, now = Date.now()): boolean {
  if (!token) return false;
  const [expires, sig, extra] = token.split('.');
  if (!expires || !sig || extra !== undefined || !/^\d+$/.test(expires)) return false;
  if (!safeEqual(sig, sign(expires, secret, password))) return false;
  return Number(expires) > now;
}
