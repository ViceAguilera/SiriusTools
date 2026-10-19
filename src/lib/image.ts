export interface Size {
  w: number;
  h: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect extends Point, Size {}

/** Ancho/alto, o null para proporción libre. */
export type Ratio = number | null;

const MIN_SIDE = 1;

/** Mueve y recorta el rectángulo para que quede dentro de los límites sin deformarlo más de lo necesario. */
export function clampRect(rect: Rect, bounds: Size): Rect {
  const w = Math.min(Math.max(rect.w, MIN_SIDE), bounds.w);
  const h = Math.min(Math.max(rect.h, MIN_SIDE), bounds.h);
  return {
    x: Math.min(Math.max(rect.x, 0), bounds.w - w),
    y: Math.min(Math.max(rect.y, 0), bounds.h - h),
    w,
    h,
  };
}

/** Rectángulo definido por un ancla fija y el punto que arrastra el puntero, con proporción opcional. */
export function rectFromDrag(anchor: Point, pointer: Point, ratio: Ratio, bounds: Size): Rect {
  const px = Math.min(Math.max(pointer.x, 0), bounds.w);
  const py = Math.min(Math.max(pointer.y, 0), bounds.h);
  const sx = px >= anchor.x ? 1 : -1;
  const sy = py >= anchor.y ? 1 : -1;
  let w = Math.abs(px - anchor.x);
  let h = Math.abs(py - anchor.y);
  if (ratio) {
    // Se achica el lado que sobra: así nunca se sale de la imagen, porque el puntero ya está dentro.
    if (w / Math.max(h, 1e-9) > ratio) w = h * ratio;
    else h = w / ratio;
  }
  return { x: sx > 0 ? anchor.x : anchor.x - w, y: sy > 0 ? anchor.y : anchor.y - h, w, h };
}

/** Reajusta un rectángulo existente a una proporción, conservando su centro. */
export function applyAspect(rect: Rect, ratio: Ratio, bounds: Size): Rect {
  if (!ratio) return clampRect(rect, bounds);
  let w = rect.w;
  let h = w / ratio;
  if (h > bounds.h) {
    h = bounds.h;
    w = h * ratio;
  }
  if (w > bounds.w) {
    w = bounds.w;
    h = w / ratio;
  }
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  return clampRect({ x: cx - w / 2, y: cy - h / 2, w, h }, bounds);
}

/** Convierte un rectángulo en coordenadas de la vista previa a píxeles reales de la imagen. */
export function previewToNatural(rect: Rect, preview: Size, natural: Size): Rect {
  const fx = natural.w / preview.w;
  const fy = natural.h / preview.h;
  return { x: rect.x * fx, y: rect.y * fy, w: rect.w * fx, h: rect.h * fy };
}

export function naturalToPreview(rect: Rect, preview: Size, natural: Size): Rect {
  return previewToNatural(rect, natural, preview);
}

/** Nuevo tamaño al editar un lado, manteniendo la proporción de `base` cuando `keep` es true. */
export function fitDimensions(base: Size, edited: 'w' | 'h', value: number, keep: boolean, current: Size): Size {
  const v = Math.max(MIN_SIDE, Math.round(value) || MIN_SIDE);
  if (!keep) return edited === 'w' ? { w: v, h: current.h } : { w: current.w, h: v };
  return edited === 'w'
    ? { w: v, h: Math.max(MIN_SIDE, Math.round((v * base.h) / base.w)) }
    : { w: Math.max(MIN_SIDE, Math.round((v * base.w) / base.h)), h: v };
}

/** `foto.final.png` -> `foto.final-editada.jpg` */
export function outputFilename(original: string, ext: string): string {
  const dot = original.lastIndexOf('.');
  const base = (dot > 0 ? original.slice(0, dot) : original).trim() || 'imagen';
  return `${base}-editada.${ext}`;
}

export function formatBytes(bytes: number): string {
  const fmt = (n: number, digits: number) => n.toFixed(digits).replace('.', ',');
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${fmt(kb, kb < 10 ? 1 : 0)} KB`;
  }
  return `${fmt(bytes / (1024 * 1024), 2)} MB`;
}

/** Variación porcentual redondeada de `now` respecto de `original` (negativa si pesa menos). */
export function percentChange(original: number, now: number): number {
  if (original <= 0) return 0;
  return Math.round(((now - original) / original) * 100);
}
