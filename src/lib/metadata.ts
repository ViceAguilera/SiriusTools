export type ImageKind = 'jpeg' | 'png' | 'webp';

export interface StripResult {
  kind: ImageKind;
  data: Uint8Array;
  /** Qué metadatos tenía el archivo (sin repetir), p. ej. ["EXIF", "GPS"]. */
  found: string[];
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const GPS_IFD_TAG = 0x8825;

function ascii(data: Uint8Array, start: number, length: number): string {
  let out = '';
  for (let i = start; i < start + length && i < data.length; i++) out += String.fromCharCode(data[i]);
  return out;
}

function startsWithAscii(data: Uint8Array, start: number, text: string): boolean {
  return start + text.length <= data.length && ascii(data, start, text.length) === text;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export function detectKind(data: Uint8Array): ImageKind | null {
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return 'jpeg';
  if (data.length >= 8 && PNG_SIGNATURE.every((b, i) => data[i] === b)) return 'png';
  if (data.length >= 12 && startsWithAscii(data, 0, 'RIFF') && startsWithAscii(data, 8, 'WEBP')) return 'webp';
  return null;
}

/** Busca el puntero al IFD de GPS (0x8825) en la IFD0 de un bloque TIFF que empieza en `tiff`. */
function tiffHasGps(data: Uint8Array, tiff: number): boolean {
  try {
    if (tiff + 8 > data.length) return false;
    const little = ascii(data, tiff, 2) === 'II';
    if (!little && ascii(data, tiff, 2) !== 'MM') return false;
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const ifd = tiff + view.getUint32(tiff + 4, little);
    const count = view.getUint16(ifd, little);
    for (let i = 0; i < count; i++) {
      const entry = ifd + 2 + i * 12;
      if (entry + 12 > data.length) return false;
      if (view.getUint16(entry, little) === GPS_IFD_TAG) return true;
    }
  } catch {
    // Un EXIF malformado no debe impedir limpiar el archivo.
  }
  return false;
}

function exifFound(data: Uint8Array, tiff: number, found: Set<string>) {
  found.add('EXIF');
  if (tiffHasGps(data, tiff)) found.add('GPS');
}

function stripJpeg(data: Uint8Array): StripResult {
  const found = new Set<string>();
  const parts: Uint8Array[] = [data.subarray(0, 2)];
  let i = 2;
  while (i < data.length) {
    if (data[i] !== 0xff) throw new Error('El JPEG está dañado: estructura de segmentos inválida.');
    let marker = data[i + 1];
    let start = i;
    // Los bytes 0xFF de relleno antes de un marcador son válidos.
    while (marker === 0xff && start + 2 < data.length) {
      start++;
      marker = data[start + 1];
    }
    if (marker === undefined) break;
    if (marker === 0xda) {
      parts.push(data.subarray(start));
      return { kind: 'jpeg', data: concat(parts), found: [...found] };
    }
    if (marker === 0xd9) break;
    // Marcadores sin longitud.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      parts.push(data.subarray(start, start + 2));
      i = start + 2;
      continue;
    }
    if (start + 4 > data.length) throw new Error('El JPEG está incompleto.');
    const length = (data[start + 2] << 8) | data[start + 3];
    const end = start + 2 + length;
    if (length < 2 || end > data.length) throw new Error('El JPEG está incompleto o dañado.');

    const payload = start + 4;
    let drop = false;
    if (marker === 0xe1) {
      drop = true;
      if (startsWithAscii(data, payload, 'Exif\0\0')) exifFound(data, payload + 6, found);
      else if (startsWithAscii(data, payload, 'http://ns.adobe.com/xap/1.0/\0')) found.add('XMP');
      else found.add('otros metadatos');
    } else if (marker === 0xfe) {
      drop = true;
      found.add('comentarios');
    } else if (marker >= 0xe2 && marker <= 0xef) {
      const isIcc = marker === 0xe2 && startsWithAscii(data, payload, 'ICC_PROFILE\0');
      // Adobe (APP14) define la transformación de color en JPEG CMYK/YCCK: quitarlo cambia los colores.
      const isAdobe = marker === 0xee && startsWithAscii(data, payload, 'Adobe');
      if (!isIcc && !isAdobe) {
        drop = true;
        found.add(marker === 0xed && startsWithAscii(data, payload, 'Photoshop 3.0') ? 'IPTC' : 'otros metadatos');
      }
    }
    if (!drop) parts.push(data.subarray(start, end));
    i = end;
  }
  throw new Error('El JPEG está incompleto: no contiene datos de imagen.');
}

function stripPng(data: Uint8Array): StripResult {
  const found = new Set<string>();
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const parts: Uint8Array[] = [data.subarray(0, 8)];
  let i = 8;
  while (i + 12 <= data.length) {
    const length = view.getUint32(i);
    const end = i + 12 + length;
    if (end > data.length) throw new Error('El PNG está incompleto o dañado.');
    const type = ascii(data, i + 4, 4);
    const body = i + 8;
    let drop = true;
    if (type === 'tEXt' || type === 'zTXt') found.add('comentarios');
    else if (type === 'iTXt') found.add(startsWithAscii(data, body, 'XML:com.adobe.xmp') ? 'XMP' : 'comentarios');
    else if (type === 'eXIf') exifFound(data, body, found);
    else if (type === 'tIME') found.add('fecha de modificación');
    else drop = false;
    if (!drop) parts.push(data.subarray(i, end));
    i = end;
    if (type === 'IEND') return { kind: 'png', data: concat(parts), found: [...found] };
  }
  throw new Error('El PNG está incompleto: falta el final del archivo.');
}

function stripWebp(data: Uint8Array): StripResult {
  const found = new Set<string>();
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const total = Math.min(view.getUint32(4, true) + 8, data.length);
  const chunks: Uint8Array[] = [];
  let i = 12;
  while (i + 8 <= total) {
    const size = view.getUint32(i + 4, true);
    // Los datos van rellenados a tamaño par; el último chunk puede venir sin su byte de relleno.
    const end = Math.min(i + 8 + size + (size % 2), total);
    if (i + 8 + size > total) throw new Error('El WebP está incompleto o dañado.');
    const type = ascii(data, i, 4);
    const body = i + 8;
    if (type === 'EXIF') {
      // Algunos escritores anteponen "Exif\0\0" y otros no.
      exifFound(data, startsWithAscii(data, body, 'Exif\0\0') ? body + 6 : body, found);
    } else if (type === 'XMP ') {
      found.add('XMP');
    } else if (type === 'VP8X') {
      const copy = data.slice(i, end);
      copy[8] &= ~(0x08 | 0x04);
      chunks.push(copy);
    } else {
      chunks.push(data.subarray(i, end));
    }
    i = end;
  }
  const payload = concat(chunks);
  const out = new Uint8Array(12 + payload.length);
  out.set(data.subarray(0, 12));
  out.set(payload, 12);
  new DataView(out.buffer).setUint32(4, out.length - 8, true);
  return { kind: 'webp', data: out, found: [...found] };
}

/** Quita los metadatos sin recomprimir la imagen. Lanza un Error en español si el formato no es válido. */
export function stripMetadata(data: Uint8Array): StripResult {
  const kind = detectKind(data);
  if (kind === 'jpeg') return stripJpeg(data);
  if (kind === 'png') return stripPng(data);
  if (kind === 'webp') return stripWebp(data);
  throw new Error('Formato no compatible: usa JPEG, PNG o WebP.');
}

/** `foto.jpg` -> `foto-limpia.jpg` */
export function cleanFilename(original: string, kind: ImageKind): string {
  const dot = original.lastIndexOf('.');
  const base = (dot > 0 ? original.slice(0, dot) : original).trim() || 'imagen';
  const ext = dot > 0 && dot < original.length - 1 ? original.slice(dot + 1) : kind === 'jpeg' ? 'jpg' : kind;
  return `${base}-limpia.${ext}`;
}
