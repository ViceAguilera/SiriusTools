import { describe, expect, it } from 'vitest';
import { safeNext } from './redirect';

describe('safeNext', () => {
  it('deja pasar rutas internas', () => {
    expect(safeNext('/youtube')).toBe('/youtube');
    expect(safeNext('/pdf?x=1#a')).toBe('/pdf?x=1#a');
  });

  it('manda al inicio cualquier cosa que salga del sitio', () => {
    const values = [null, '', 'https://evil.com', '//evil.com', '/\\evil.com', 'javascript:alert(1)', '/\t/evil.com', '/\n/evil.com', '/\\\t\\evil.com'];
    for (const value of values) {
      expect(safeNext(value)).toBe('/');
    }
  });

  it('no deja que los segmentos con punto armen una URL "//otro-sitio"', () => {
    for (const value of ['/.//evil.com', '/..//evil.com', '/./\\evil.com', '/a/..//evil.com', '/%2e//evil.com']) {
      expect(safeNext(value)).toBe('/evil.com');
    }
  });
});
