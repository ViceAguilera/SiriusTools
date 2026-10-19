import { SESSION_SECRET, TOOLS_PASSWORD } from 'astro:env/server';
import type { AstroCookies } from 'astro';
import { SESSION_MAX_AGE_S, createToken, safeEqual, verifyToken } from './session';

const COOKIE = 'tools_session';

export function checkPassword(input: string): boolean {
  return safeEqual(input, TOOLS_PASSWORD);
}

export function startSession(cookies: AstroCookies) {
  cookies.set(COOKIE, createToken(SESSION_SECRET, TOOLS_PASSWORD), {
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    path: '/',
    maxAge: SESSION_MAX_AGE_S,
  });
}

export function endSession(cookies: AstroCookies) {
  cookies.delete(COOKIE, { path: '/' });
}

export function hasSession(cookies: AstroCookies): boolean {
  return verifyToken(cookies.get(COOKIE)?.value, SESSION_SECRET, TOOLS_PASSWORD);
}
