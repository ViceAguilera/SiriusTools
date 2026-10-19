import { describe, expect, it } from 'vitest';
import { SESSION_MAX_AGE_S, createToken, verifyToken } from './session';

const SECRET = 'x'.repeat(32);

describe('session', () => {
  it('acepta un token recién creado', () => {
    expect(verifyToken(createToken(SECRET, 'k7m2x'), SECRET, 'k7m2x')).toBe(true);
  });

  it('rechaza tokens vacíos, mal formados o alterados', () => {
    const token = createToken(SECRET, 'k7m2x');
    expect(verifyToken(undefined, SECRET, 'k7m2x')).toBe(false);
    expect(verifyToken('', SECRET, 'k7m2x')).toBe(false);
    expect(verifyToken('abc', SECRET, 'k7m2x')).toBe(false);
    expect(verifyToken(`${token}.x`, SECRET, 'k7m2x')).toBe(false);
    const [expires, sig] = token.split('.');
    expect(verifyToken(`${Number(expires) + 1}.${sig}`, SECRET, 'k7m2x')).toBe(false);
  });

  it('se invalida al cambiar la contraseña o el secreto', () => {
    const token = createToken(SECRET, 'k7m2x');
    expect(verifyToken(token, SECRET, 'a1b2c')).toBe(false);
    expect(verifyToken(token, 'y'.repeat(32), 'k7m2x')).toBe(false);
  });

  it('vence a los 30 días', () => {
    const t0 = 1_000_000;
    const token = createToken(SECRET, 'k7m2x', t0);
    expect(verifyToken(token, SECRET, 'k7m2x', t0 + SESSION_MAX_AGE_S * 1000 - 1)).toBe(true);
    expect(verifyToken(token, SECRET, 'k7m2x', t0 + SESSION_MAX_AGE_S * 1000)).toBe(false);
  });
});
