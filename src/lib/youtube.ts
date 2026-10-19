// Lógica pura del descargador (sin astro:env ni procesos), para poder testearla.

export const FORMATS = ['mp3', 'mp4', 'flac'] as const;
export type Format = (typeof FORMATS)[number];

export function isFormat(value: unknown): value is Format {
  return typeof value === 'string' && (FORMATS as readonly string[]).includes(value);
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com']);

/**
 * Devuelve la URL canónica del video, o null si no es un video de YouTube.
 * Rearmar la URL (en vez de pasar la del usuario) impide que yt-dlp descargue desde otros sitios o desde
 * servicios internos del VPS, y descarta playlists y parámetros extra.
 */
export function canonicalVideoUrl(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.toLowerCase();
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1] ?? null;
  } else if (HOSTS.has(host)) {
    const [, first, second] = url.pathname.split('/');
    if (first === 'watch') id = url.searchParams.get('v');
    else if (first === 'shorts' || first === 'live' || first === 'embed') id = second ?? null;
  }
  return id && VIDEO_ID.test(id) ? `https://www.youtube.com/watch?v=${id}` : null;
}

/** Argumentos de yt-dlp. Los formatos son los mismos de la app de escritorio, más FLAC. */
export function buildArgs(videoUrl: string, format: Format, outDir: string): string[] {
  const args = [
    '--no-playlist',
    '--newline',
    '--no-color',
    '--encoding', 'utf-8',
    '--js-runtimes', 'node',
    '--use-extractors', 'youtube',
    // Sin transmisiones en vivo ni videos de más de 3 horas: llenarían el disco y nunca terminarían.
    '--match-filter', '!is_live & duration < 10800',
    '--max-filesize', '2G',
    '--progress-template', 'download:PCT %(progress._percent_str)s',
    '-P', outDir,
    '-o', '%(title).150B.%(ext)s',
  ];
  if (format === 'mp4') {
    // H.264 primero: AV1/VP9 no se reproducen en todos los reproductores.
    args.push('-f', 'bv*[vcodec^=avc1]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b', '--merge-output-format', 'mp4');
  } else {
    args.push('-x', '--audio-format', format, '--audio-quality', '0', '--embed-thumbnail', '--embed-metadata');
  }
  // "--" impide que la URL se interprete como opción.
  return [...args, '--', videoUrl];
}

export type LineEvent =
  | { type: 'progress'; percent: number }
  | { type: 'converting' }
  | { type: 'error'; message: string }
  | { type: 'skipped' };

const PCT_RE = /^PCT\s+([\d.]+)%/;

export function parseLine(raw: string): LineEvent | null {
  const line = raw.trim();
  const pct = PCT_RE.exec(line);
  if (pct) return { type: 'progress', percent: Math.min(100, Number(pct[1])) };
  if (line.startsWith('ERROR')) return { type: 'error', message: line };
  if (line.includes('does not pass filter') || line.includes('File is larger than max-filesize')) {
    return { type: 'skipped' };
  }
  if (/^\[(ExtractAudio|Merger|EmbedThumbnail|Metadata|VideoConvertor)\]/.test(line)) return { type: 'converting' };
  return null;
}

/** Traduce los errores de yt-dlp a algo que se entienda. */
export function friendlyError(message: string): string {
  if (/confirm you.?re not a bot|Sign in to confirm/i.test(message)) {
    return 'YouTube bloqueó la descarga desde el servidor. Intenta más tarde.';
  }
  if (/private video/i.test(message)) return 'El video es privado.';
  if (/age.restricted|inappropriate|confirm your age/i.test(message)) return 'El video tiene restricción de edad.';
  if (/unavailable|not available/i.test(message)) return 'El video no está disponible.';
  return 'No se pudo descargar. Revisa el link o intenta de nuevo.';
}

/** Content-Disposition con el nombre original (UTF-8) y una versión ASCII para navegadores viejos. */
export function contentDisposition(filename: string): string {
  const ascii = filename.normalize('NFKD').replace(/[^\x20-\x7e]/g, '').replace(/["\\]/g, '') || 'descarga';
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
