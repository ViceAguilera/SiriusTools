import { describe, expect, it } from 'vitest';
import {
  applyAspect,
  clampRect,
  fitDimensions,
  formatBytes,
  naturalToPreview,
  outputFilename,
  percentChange,
  previewToNatural,
  rectFromDrag,
} from './image';

const BOUNDS = { w: 400, h: 300 };

describe('clampRect', () => {
  it('deja intacto un rectángulo que ya cabe', () => {
    expect(clampRect({ x: 10, y: 20, w: 100, h: 50 }, BOUNDS)).toEqual({ x: 10, y: 20, w: 100, h: 50 });
  });

  it('empuja hacia dentro un rectángulo que se sale por la derecha y abajo', () => {
    expect(clampRect({ x: 350, y: 280, w: 100, h: 50 }, BOUNDS)).toEqual({ x: 300, y: 250, w: 100, h: 50 });
  });

  it('corrige coordenadas negativas', () => {
    expect(clampRect({ x: -20, y: -5, w: 100, h: 50 }, BOUNDS)).toEqual({ x: 0, y: 0, w: 100, h: 50 });
  });

  it('achica un rectángulo más grande que la imagen', () => {
    expect(clampRect({ x: 0, y: 0, w: 900, h: 900 }, BOUNDS)).toEqual({ x: 0, y: 0, w: 400, h: 300 });
  });
});

describe('rectFromDrag', () => {
  it('arrastrando hacia abajo y a la derecha, parte desde el ancla', () => {
    expect(rectFromDrag({ x: 10, y: 10 }, { x: 110, y: 60 }, null, BOUNDS)).toEqual({ x: 10, y: 10, w: 100, h: 50 });
  });

  it('arrastrando hacia arriba y a la izquierda, normaliza el origen', () => {
    expect(rectFromDrag({ x: 110, y: 60 }, { x: 10, y: 10 }, null, BOUNDS)).toEqual({ x: 10, y: 10, w: 100, h: 50 });
  });

  it('limita el puntero a los bordes de la imagen', () => {
    const r = rectFromDrag({ x: 300, y: 200 }, { x: 999, y: 999 }, null, BOUNDS);
    expect(r).toEqual({ x: 300, y: 200, w: 100, h: 100 });
  });

  it('respeta la proporción 1:1 achicando el lado mayor', () => {
    const r = rectFromDrag({ x: 0, y: 0 }, { x: 200, y: 80 }, 1, BOUNDS);
    expect(r.w).toBe(80);
    expect(r.h).toBe(80);
  });

  it('respeta 16:9 sin salirse de la imagen', () => {
    const r = rectFromDrag({ x: 200, y: 100 }, { x: 5000, y: 5000 }, 16 / 9, BOUNDS);
    expect(r.w / r.h).toBeCloseTo(16 / 9);
    expect(r.x + r.w).toBeLessThanOrEqual(BOUNDS.w);
    expect(r.y + r.h).toBeLessThanOrEqual(BOUNDS.h);
  });
});

describe('applyAspect', () => {
  it('sin proporción solo ajusta a los límites', () => {
    expect(applyAspect({ x: 0, y: 0, w: 50, h: 50 }, null, BOUNDS)).toEqual({ x: 0, y: 0, w: 50, h: 50 });
  });

  it('convierte a 1:1 conservando el ancho y el centro', () => {
    const r = applyAspect({ x: 100, y: 100, w: 100, h: 50 }, 1, BOUNDS);
    expect(r).toEqual({ x: 100, y: 75, w: 100, h: 100 });
  });

  it('reduce cuando la proporción pedida no cabe en alto', () => {
    const r = applyAspect({ x: 0, y: 0, w: 400, h: 300 }, 9 / 16, BOUNDS);
    expect(r.h).toBe(300);
    expect(r.w).toBeCloseTo(168.75);
    expect(r.x).toBeCloseTo((400 - 168.75) / 2);
  });
});

describe('conversión vista previa <-> píxeles reales', () => {
  const preview = { w: 200, h: 100 };
  const natural = { w: 2000, h: 1000 };

  it('escala la vista previa a la imagen real', () => {
    expect(previewToNatural({ x: 10, y: 5, w: 50, h: 20 }, preview, natural)).toEqual({ x: 100, y: 50, w: 500, h: 200 });
  });

  it('es la inversa de naturalToPreview', () => {
    const r = { x: 100, y: 50, w: 500, h: 200 };
    expect(previewToNatural(naturalToPreview(r, preview, natural), preview, natural)).toEqual(r);
  });
});

describe('fitDimensions', () => {
  const base = { w: 400, h: 200 };

  it('mantiene la proporción al editar el ancho', () => {
    expect(fitDimensions(base, 'w', 100, true, base)).toEqual({ w: 100, h: 50 });
  });

  it('mantiene la proporción al editar el alto', () => {
    expect(fitDimensions(base, 'h', 50, true, base)).toEqual({ w: 100, h: 50 });
  });

  it('sin mantener proporción solo cambia el lado editado', () => {
    expect(fitDimensions(base, 'w', 100, false, { w: 400, h: 120 })).toEqual({ w: 100, h: 120 });
  });

  it('nunca baja de 1 px ni devuelve NaN', () => {
    expect(fitDimensions(base, 'w', Number.NaN, true, base)).toEqual({ w: 1, h: 1 });
    expect(fitDimensions(base, 'w', 0, true, base).w).toBe(1);
  });
});

describe('outputFilename', () => {
  it('reemplaza la extensión y agrega el sufijo', () => {
    expect(outputFilename('foto.png', 'jpg')).toBe('foto-editada.jpg');
  });

  it('solo quita la última extensión', () => {
    expect(outputFilename('mi.foto.final.HEIC', 'webp')).toBe('mi.foto.final-editada.webp');
  });

  it('funciona sin extensión o con nombre vacío', () => {
    expect(outputFilename('captura', 'png')).toBe('captura-editada.png');
    expect(outputFilename('', 'png')).toBe('imagen-editada.png');
  });
});

describe('formatBytes', () => {
  it('formatea bytes, KB y MB con coma decimal', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1536)).toBe('1,5 KB');
    expect(formatBytes(204800)).toBe('200 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3,00 MB');
  });
});

describe('percentChange', () => {
  it('calcula la variación respecto del original', () => {
    expect(percentChange(1000, 250)).toBe(-75);
    expect(percentChange(1000, 1500)).toBe(50);
    expect(percentChange(0, 10)).toBe(0);
  });
});
