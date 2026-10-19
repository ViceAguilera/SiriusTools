import { describe, expect, it } from 'vitest';
import { contrastRatio } from './color';

describe('contrastRatio', () => {
  it('da 21 para negro sobre blanco, en cualquier orden', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
  });

  it('da 1 para colores iguales', () => {
    expect(contrastRatio('#336699', '#336699')).toBeCloseTo(1, 5);
  });

  it('detecta pares de bajo contraste', () => {
    expect(contrastRatio('#cccccc', '#ffffff')).toBeLessThan(3);
  });

  it('rechaza colores mal formados', () => {
    expect(() => contrastRatio('rojo', '#fff')).toThrow(/Color inválido/);
  });
});
