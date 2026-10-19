/** Separa la especificación en tokens ("1-3, 5" → ["1-3", "5"]) sin espacios sobrantes. */
export function specTokens(spec: string): string[] {
  if (!spec.trim()) throw new Error('Escribe al menos una página o un rango.');
  return spec.split(',').map((token) => token.trim());
}

/** Convierte un token ("5", "2-4", "8-", "-3") en índices base 0. */
function tokenIndices(token: string, pageCount: number): number[] {
  const single = /^(\d+)$/.exec(token);
  const range = /^(\d*)\s*-\s*(\d*)$/.exec(token);
  let from: number;
  let to: number;
  if (single) {
    from = to = Number(single[1]);
  } else if (range && (range[1] || range[2])) {
    from = range[1] ? Number(range[1]) : 1;
    to = range[2] ? Number(range[2]) : pageCount;
  } else {
    throw new Error(token ? `"${token}" no es una página ni un rango válido.` : 'Hay una coma sobrante o un valor vacío.');
  }
  if (from < 1 || to < 1) throw new Error('Las páginas empiezan en 1.');
  if (from > pageCount || to > pageCount) {
    throw new Error(`El documento tiene ${pageCount} ${pageCount === 1 ? 'página' : 'páginas'}; "${token}" se pasa del final.`);
  }
  if (from > to) throw new Error(`El rango "${token}" está al revés.`);
  return Array.from({ length: to - from + 1 }, (_, i) => from - 1 + i);
}

/** Páginas (base 1 en el texto) → índices base 0, en el orden escrito y con repetidas. */
export function parsePageSpec(spec: string, pageCount: number): number[] {
  return specTokens(spec).flatMap((token) => tokenIndices(token, pageCount));
}

/** Un grupo de índices por cada token, para generar un PDF por rango. */
export function splitRanges(spec: string, pageCount: number): number[][] {
  return specTokens(spec).map((token) => tokenIndices(token, pageCount));
}

/** Nombre del PDF de salida: quita la extensión original y deja solo caracteres seguros. */
export function outputName(originalName: string, suffix: string): string {
  const base = originalName.replace(/\.pdf$/i, '').trim() || 'documento';
  const safe = (text: string) => text.replace(/[\/:*?"<>|\s]+/g, '').replace(/^-+|-+$/g, '');
  return `${base.replace(/[\/:*?"<>|]+/g, '_')}-${safe(suffix) || 'salida'}.pdf`;
}
