import { describe, expect, it } from 'vitest';
import { buildArgs, canonicalVideoUrl, contentDisposition, friendlyError, isFormat, parseLine } from './youtube';

const ID = 'dQw4w9WgXcQ';
const CANON = `https://www.youtube.com/watch?v=${ID}`;

describe('canonicalVideoUrl', () => {
  it('acepta las formas comunes de link y las normaliza', () => {
    for (const url of [
      `https://www.youtube.com/watch?v=${ID}`,
      `https://youtube.com/watch?v=${ID}&list=PL123&t=42`,
      `https://m.youtube.com/watch?v=${ID}`,
      `https://music.youtube.com/watch?v=${ID}&si=abc`,
      `https://youtu.be/${ID}?si=abc`,
      `https://www.youtube.com/shorts/${ID}`,
      `https://www.youtube.com/live/${ID}`,
      `  http://www.youtube.com/watch?v=${ID}  `,
    ]) {
      expect(canonicalVideoUrl(url), url).toBe(CANON);
    }
  });

  it('rechaza otros sitios, servicios internos y links sin video', () => {
    for (const url of [
      'no es un link',
      `https://evil.com/watch?v=${ID}`,
      `https://youtube.com.evil.com/watch?v=${ID}`,
      'http://127.0.0.1:9001/admin',
      'file:///etc/passwd',
      'https://www.youtube.com/playlist?list=PL123',
      'https://www.youtube.com/watch?v=corto',
      `https://www.youtube.com/watch?v=${ID}x`,
      'https://www.youtube.com/@canal',
    ]) {
      expect(canonicalVideoUrl(url), url).toBeNull();
    }
  });
});

describe('buildArgs', () => {
  it('termina con -- y la URL, y deja los archivos en la carpeta del trabajo', () => {
    const args = buildArgs(CANON, 'mp3', '/tmp/x');
    expect(args.slice(-2)).toEqual(['--', CANON]);
    expect(args).toContain('--no-playlist');
    expect(args[args.indexOf('-P') + 1]).toBe('/tmp/x');
    expect(args[args.indexOf('--use-extractors') + 1]).toBe('youtube');
  });

  it('elige audio o video según el formato', () => {
    expect(buildArgs(CANON, 'mp3', '/t')).toEqual(expect.arrayContaining(['-x', '--audio-format', 'mp3']));
    expect(buildArgs(CANON, 'flac', '/t')).toEqual(expect.arrayContaining(['-x', '--audio-format', 'flac']));
    const mp4 = buildArgs(CANON, 'mp4', '/t');
    expect(mp4).not.toContain('-x');
    expect(mp4).toEqual(expect.arrayContaining(['--merge-output-format', 'mp4']));
  });

  it('pasa el generador de tokens PO solo si está configurado', () => {
    expect(buildArgs(CANON, 'mp3', '/t')).not.toContain('--extractor-args');
    const args = buildArgs(CANON, 'mp3', '/t', 'http://pot:4416');
    expect(args[args.indexOf('--extractor-args') + 1]).toBe('youtubepot-bgutilhttp:base_url=http://pot:4416');
    expect(args.slice(-2)).toEqual(['--', CANON]);
  });
});

describe('parseLine', () => {
  it('reconoce progreso, conversión, errores y videos descartados', () => {
    expect(parseLine('PCT  42.5%')).toEqual({ type: 'progress', percent: 42.5 });
    expect(parseLine('[ExtractAudio] Destination: a.mp3')).toEqual({ type: 'converting' });
    expect(parseLine('[Merger] Merging formats into "a.mp4"')).toEqual({ type: 'converting' });
    expect(parseLine('ERROR: [youtube] x: Private video')).toEqual({ type: 'error', message: 'ERROR: [youtube] x: Private video' });
    expect(parseLine('[download] Live does not pass filter (!is_live), skipping ..')).toEqual({ type: 'skipped' });
    expect(parseLine('[youtube] Extracting URL: x')).toBeNull();
  });
});

describe('friendlyError', () => {
  it('traduce los errores conocidos', () => {
    expect(friendlyError("ERROR: Sign in to confirm you're not a bot")).toMatch(/bloqueó/);
    expect(friendlyError('ERROR: [youtube] x: Private video')).toMatch(/privado/);
    expect(friendlyError('ERROR: [youtube] x: This video is unavailable')).toMatch(/no está disponible/);
    expect(friendlyError('ERROR: algo raro')).toMatch(/No se pudo descargar/);
  });
});

describe('contentDisposition', () => {
  it('incluye el nombre en UTF-8 y una versión ASCII sin comillas', () => {
    const value = contentDisposition('Canción "ñandú".mp3');
    expect(value).toContain(`filename*=UTF-8''${encodeURIComponent('Canción "ñandú".mp3')}`);
    expect(value).toContain('filename="Cancion nandu.mp3"');
  });
});

describe('isFormat', () => {
  it('solo acepta los formatos conocidos', () => {
    expect(isFormat('mp3')).toBe(true);
    expect(isFormat('wav')).toBe(false);
    expect(isFormat(undefined)).toBe(false);
  });
});
