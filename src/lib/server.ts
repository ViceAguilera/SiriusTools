// Utilidades del servidor que dependen del entorno.
import { TRUST_PROXY } from 'astro:env/server';
import { ipKey } from './ip';

/** Límite en memoria por clave (IP). Suficiente para un solo proceso. */
const hits = new Map<string, number[]>();

const MAX_KEYS = 10_000;
const LONGEST_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Cuenta un intento y dice si la clave ya pasó el máximo de la ventana. */
export function rateLimited(key: string, max: number, windowMs: number): boolean {
  const t = Date.now();
  // Evita que el mapa crezca sin fin con claves distintas: descarta las que ya vencieron.
  if (hits.size > MAX_KEYS) {
    for (const [k, list] of hits) if (t - list[list.length - 1] > LONGEST_WINDOW_MS) hits.delete(k);
  }
  const recent = (hits.get(key) ?? []).filter((ts) => t - ts < windowMs);
  recent.push(t);
  hits.set(key, recent);
  return recent.length > max;
}

/** Dice si la clave ya llegó al máximo, sin contar un intento nuevo. */
export function isLimited(key: string, max: number, windowMs: number): boolean {
  const t = Date.now();
  return (hits.get(key) ?? []).filter((ts) => t - ts < windowMs).length >= max;
}

/**
 * IP del cliente para los límites. X-Forwarded-For lo puede escribir cualquiera, así que solo se usa con
 * TRUST_PROXY=true (detrás de Nginx), y se toma la última entrada: la que agregó Nginx, no las del cliente.
 */
export function clientIp(request: Request, fallback: string): string {
  const chain = TRUST_PROXY
    ? (request.headers.get('x-forwarded-for') ?? '').split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  return ipKey(chain.at(-1) || fallback);
}
