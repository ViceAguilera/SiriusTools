import { describe, expect, it } from 'vitest';
import { outputName, parsePageSpec, splitRanges } from './pages';

describe('parsePageSpec', () => {
  it('convierte páginas sueltas a índices base 0', () => {
    expect(parsePageSpec('1, 3,5', 6)).toEqual([0, 2, 4]);
  });

  it('expande rangos cerrados y abiertos', () => {
    expect(parsePageSpec('2-4', 6)).toEqual([1, 2, 3]);
    expect(parsePageSpec('5-', 7)).toEqual([4, 5, 6]);
    expect(parsePageSpec('-3', 7)).toEqual([0, 1, 2]);
    expect(parsePageSpec('1-3, 5, 8-', 9)).toEqual([0, 1, 2, 4, 7, 8]);
  });

  it('tolera espacios alrededor del guion', () => {
    expect(parsePageSpec(' 2 - 3 ', 5)).toEqual([1, 2]);
  });

  it('conserva el orden escrito y las repeticiones', () => {
    expect(parsePageSpec('3,1,2,4-6,1', 6)).toEqual([2, 0, 1, 3, 4, 5, 0]);
  });

  it('rechaza una especificación vacía', () => {
    expect(() => parsePageSpec('', 5)).toThrow(/al menos una página/);
    expect(() => parsePageSpec('   ', 5)).toThrow(/al menos una página/);
  });

  it('rechaza tokens inválidos y valores vacíos entre comas', () => {
    expect(() => parsePageSpec('a', 5)).toThrow(/no es una página/);
    expect(() => parsePageSpec('1--3', 5)).toThrow(/no es una página/);
    expect(() => parsePageSpec('-', 5)).toThrow(/no es una página/);
    expect(() => parsePageSpec('1,,2', 5)).toThrow(/coma sobrante/);
  });

  it('rechaza la página 0', () => {
    expect(() => parsePageSpec('0', 5)).toThrow(/empiezan en 1/);
    expect(() => parsePageSpec('0-2', 5)).toThrow(/empiezan en 1/);
  });

  it('rechaza páginas fuera del documento', () => {
    expect(() => parsePageSpec('6', 5)).toThrow(/se pasa del final/);
    expect(() => parsePageSpec('3-9', 5)).toThrow(/se pasa del final/);
  });

  it('rechaza rangos al revés', () => {
    expect(() => parsePageSpec('5-3', 6)).toThrow(/al revés/);
  });
});

describe('splitRanges', () => {
  it('devuelve un grupo por cada rango', () => {
    expect(splitRanges('1-2, 4, 6-', 7)).toEqual([[0, 1], [3], [5, 6]]);
  });

  it('propaga los errores de validación', () => {
    expect(() => splitRanges('1-2, 9', 5)).toThrow(/se pasa del final/);
  });
});

describe('outputName', () => {
  it('quita la extensión y agrega el sufijo', () => {
    expect(outputName('Informe.PDF', 'paginas')).toBe('Informe-paginas.pdf');
  });

  it('limpia espacios y caracteres peligrosos del sufijo', () => {
    expect(outputName('a.pdf', '1 - 3')).toBe('a-1-3.pdf');
    expect(outputName('a.pdf', '8-')).toBe('a-8.pdf');
    expect(outputName('a/b.pdf', '2')).toBe('a_b-2.pdf');
  });

  it('usa un nombre por defecto si queda vacío', () => {
    expect(outputName('.pdf', 'x')).toBe('documento-x.pdf');
  });
});
