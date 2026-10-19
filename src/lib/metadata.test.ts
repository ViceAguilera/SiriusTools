import { describe, expect, it } from 'vitest';
import { cleanFilename, detectKind, stripMetadata } from './metadata';

const bytes = (...parts: (number | number[] | Uint8Array | string)[]): Uint8Array => {
  const out: number[] = [];
  for (const p of parts) {
    if (typeof p === 'number') out.push(p);
    else if (typeof p === 'string') out.push(...[...p].map((c) => c.charCodeAt(0)));
    else out.push(...p);
  }
  return new Uint8Array(out);
};

const u16 = (n: number) => [n >> 8, n & 0xff];
const u32 = (n: number) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
const u32le = (n: number) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];

const toHex = (d: Uint8Array) => [...d].map((b) => b.toString(16).padStart(2, '0')).join('');

// --- JPEG ---
const jpegSegment = (marker: number, payload: Uint8Array | string) => {
  const body = typeof payload === 'string' ? bytes(payload) : payload;
  return bytes(0xff, marker, u16(body.length + 2), body);
};

/** TIFF little-endian con una sola entrada en la IFD0: la que se pida. */
const tiff = (tag: number) =>
  bytes('II', [0x2a, 0x00], [8, 0, 0, 0], [1, 0], [tag & 0xff, tag >> 8], [4, 0], [1, 0, 0, 0], [26, 0, 0, 0], [0, 0, 0, 0]);

const EXIF_GPS = bytes('Exif\0\0', tiff(0x8825));
const EXIF_PLAIN = bytes('Exif\0\0', tiff(0x010f));
const SOI = bytes(0xff, 0xd8);
const SCAN = bytes(0xff, 0xda, u16(4), [0, 0], [1, 2, 3, 0xff, 0x00, 4], 0xff, 0xd9);
const JFIF = jpegSegment(0xe0, 'JFIF\0\x01\x01\0');
const ICC = jpegSegment(0xe2, 'ICC_PROFILE\0abc');

describe('detectKind', () => {
  it('reconoce JPEG, PNG y WebP por su firma', () => {
    expect(detectKind(bytes(SOI, 0xff, 0xe0))).toBe('jpeg');
    expect(detectKind(bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('png');
    expect(detectKind(bytes('RIFF', u32le(4), 'WEBP'))).toBe('webp');
  });

  it('devuelve null para cualquier otra cosa', () => {
    expect(detectKind(bytes('GIF89a'))).toBeNull();
    expect(detectKind(new Uint8Array())).toBeNull();
  });
});

describe('stripMetadata: JPEG', () => {
  it('quita EXIF con GPS, XMP, comentarios y APPn, y detecta lo que había', () => {
    const input = bytes(
      SOI,
      JFIF,
      jpegSegment(0xe1, EXIF_GPS),
      jpegSegment(0xe1, 'http://ns.adobe.com/xap/1.0/\0<x/>'),
      jpegSegment(0xfe, 'hecho con mi camara'),
      jpegSegment(0xed, 'Photoshop 3.0\0iptc'),
      SCAN,
    );
    const result = stripMetadata(input);
    expect(result.kind).toBe('jpeg');
    expect(toHex(result.data)).toBe(toHex(bytes(SOI, JFIF, SCAN)));
    expect(result.found).toEqual(['EXIF', 'GPS', 'XMP', 'comentarios', 'IPTC']);
  });

  it('conserva el perfil ICC, APP0 y deja los datos de imagen idénticos', () => {
    const input = bytes(SOI, JFIF, ICC, jpegSegment(0xe1, EXIF_PLAIN), jpegSegment(0xdb, new Uint8Array(65)), SCAN);
    const result = stripMetadata(input);
    expect(toHex(result.data)).toBe(toHex(bytes(SOI, JFIF, ICC, jpegSegment(0xdb, new Uint8Array(65)), SCAN)));
    expect(result.found).toEqual(['EXIF']);
  });

  it('EXIF sin puntero a GPS no reporta GPS', () => {
    const result = stripMetadata(bytes(SOI, jpegSegment(0xe1, EXIF_PLAIN), SCAN));
    expect(result.found).toEqual(['EXIF']);
  });

  it('un JPEG sin metadatos queda byte a byte igual', () => {
    const input = bytes(SOI, JFIF, SCAN);
    const result = stripMetadata(input);
    expect(toHex(result.data)).toBe(toHex(input));
    expect(result.found).toEqual([]);
  });

  it('rechaza un JPEG truncado', () => {
    expect(() => stripMetadata(bytes(SOI, 0xff, 0xe1, u16(500), 'corto'))).toThrow(/JPEG/);
  });
});

// --- PNG ---
const chunk = (type: string, data: Uint8Array | string) => {
  const body = typeof data === 'string' ? bytes(data) : data;
  return bytes(u32(body.length), type, body, [0xde, 0xad, 0xbe, 0xef]); // CRC de mentira: no se toca
};
const PNG_SIG = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const IHDR = chunk('IHDR', new Uint8Array(13));
const IDAT = chunk('IDAT', bytes(1, 2, 3));
const IEND = chunk('IEND', new Uint8Array());

describe('stripMetadata: PNG', () => {
  it('quita tEXt, zTXt, iTXt, eXIf y tIME y conserva el resto con su CRC', () => {
    const keep = [IHDR, chunk('gAMA', new Uint8Array(4)), chunk('iCCP', 'perfil'), IDAT, IEND];
    const input = bytes(
      PNG_SIG,
      IHDR,
      chunk('tEXt', 'Comment\0hola'),
      chunk('gAMA', new Uint8Array(4)),
      chunk('zTXt', 'k\0\0zz'),
      chunk('iTXt', 'XML:com.adobe.xmp\0\0\0\0\0<x/>'),
      chunk('eXIf', tiff(0x8825)),
      chunk('tIME', new Uint8Array(7)),
      chunk('iCCP', 'perfil'),
      IDAT,
      IEND,
    );
    const result = stripMetadata(input);
    expect(toHex(result.data)).toBe(toHex(bytes(PNG_SIG, ...keep)));
    expect(result.found).toEqual(['comentarios', 'XMP', 'EXIF', 'GPS', 'fecha de modificación']);
  });

  it('rechaza un PNG cortado a mitad de un chunk', () => {
    expect(() => stripMetadata(bytes(PNG_SIG, u32(100), 'IDAT', [1, 2]))).toThrow(/PNG/);
  });
});

// --- WebP ---
const riffChunk = (type: string, data: Uint8Array | string) => {
  const body = typeof data === 'string' ? bytes(data) : data;
  return bytes(type, u32le(body.length), body, body.length % 2 ? [0] : []);
};
const riff = (...chunks: Uint8Array[]) => {
  const payload = bytes(...chunks);
  return bytes('RIFF', u32le(payload.length + 4), 'WEBP', payload);
};

describe('stripMetadata: WebP', () => {
  const vp8x = (flags: number) => riffChunk('VP8X', bytes(flags, 0, 0, 0, 9, 0, 0, 9, 0, 0));
  const VP8 = riffChunk('VP8 ', bytes(1, 2, 3, 4, 5));

  it('quita EXIF y XMP, limpia los flags de VP8X y corrige el tamaño RIFF', () => {
    const input = riff(vp8x(0x20 | 0x08 | 0x04), VP8, riffChunk('EXIF', EXIF_GPS), riffChunk('XMP ', '<x/>'));
    const result = stripMetadata(input);
    expect(toHex(result.data)).toBe(toHex(riff(vp8x(0x20), VP8)));
    expect(result.found).toEqual(['EXIF', 'GPS', 'XMP']);
    const size = new DataView(result.data.buffer).getUint32(4, true);
    expect(size).toBe(result.data.length - 8);
  });

  it('un WebP simple sin metadatos queda igual', () => {
    const input = riff(VP8);
    expect(toHex(stripMetadata(input).data)).toBe(toHex(input));
  });

  it('rechaza un WebP truncado', () => {
    const input = riff(VP8);
    expect(() => stripMetadata(input.subarray(0, input.length - 3))).toThrow(/WebP/);
  });
});

describe('stripMetadata: formatos no válidos', () => {
  it('lanza un error en español', () => {
    expect(() => stripMetadata(bytes('GIF89a....'))).toThrow('Formato no compatible');
    expect(() => stripMetadata(new Uint8Array())).toThrow('Formato no compatible');
  });
});

describe('cleanFilename', () => {
  it('agrega el sufijo y conserva la extensión original', () => {
    expect(cleanFilename('IMG_0001.JPG', 'jpeg')).toBe('IMG_0001-limpia.JPG');
    expect(cleanFilename('a.b.png', 'png')).toBe('a.b-limpia.png');
  });

  it('sin extensión usa la del formato detectado', () => {
    expect(cleanFilename('foto', 'jpeg')).toBe('foto-limpia.jpg');
  });
});
