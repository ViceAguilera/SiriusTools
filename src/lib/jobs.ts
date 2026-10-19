// Descargas de YouTube en el servidor: cola en memoria, un proceso yt-dlp por trabajo y limpieza automática.
import { YTDLP_PATH, YTDLP_POT_URL } from 'astro:env/server';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { type Format, buildArgs, friendlyError, parseLine } from './youtube';

export type JobStatus = 'queued' | 'downloading' | 'converting' | 'done' | 'error';

export interface Job {
  id: string;
  status: JobStatus;
  percent: number;
  error?: string;
  filePath?: string;
  fileName?: string;
  size?: number;
  finishedAt?: number;
}

const ROOT = join(tmpdir(), 'tools-yt');
const MAX_RUNNING = 2;
const TIMEOUT_MS = 15 * 60 * 1000;
// Tiempo que el archivo queda disponible para bajarlo después de terminar.
export const KEEP_MS = 15 * 60 * 1000;

const jobs = new Map<string, Job>();
const queue: Array<{ job: Job; url: string; format: Format }> = [];
let running = 0;

// Restos de un arranque anterior (el proceso se cayó o se reinició el contenedor).
rmSync(ROOT, { recursive: true, force: true });
mkdirSync(ROOT, { recursive: true });

setInterval(() => {
  const t = Date.now();
  for (const job of jobs.values()) {
    if (job.finishedAt && t - job.finishedAt > KEEP_MS) {
      rmSync(join(ROOT, job.id), { recursive: true, force: true });
      jobs.delete(job.id);
    }
  }
}, 60_000).unref();

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

// Topes globales para que nadie con la clave llene el disco o la cola del VPS.
const MAX_QUEUED = 20;
const MAX_STORED_BYTES = 10 * 1024 ** 3;
// Lo que puede llegar a pesar una descarga (--max-filesize de youtube.ts): se reserva mientras no termina,
// si no la cola entera podría aceptarse con el disco vacío y llenarlo después.
const RESERVED_BYTES = 2 * 1024 ** 3;

/** null si se puede aceptar otra descarga; si no, el motivo para mostrar. */
export function busyReason(): string | null {
  if (queue.length >= MAX_QUEUED) return 'El servidor tiene muchas descargas en cola. Intenta en unos minutos.';
  let stored = 0;
  for (const job of jobs.values()) stored += job.size ?? (job.finishedAt ? 0 : RESERVED_BYTES);
  if (stored >= MAX_STORED_BYTES) return 'El servidor está lleno de descargas recientes. Intenta en unos minutos.';
  return null;
}

export function createJob(url: string, format: Format): Job {
  const job: Job = { id: randomUUID(), status: 'queued', percent: 0 };
  jobs.set(job.id, job);
  queue.push({ job, url, format });
  next();
  return job;
}

function next() {
  while (running < MAX_RUNNING && queue.length > 0) {
    const item = queue.shift()!;
    running++;
    run(item.job, item.url, item.format).finally(() => {
      running--;
      next();
    });
  }
}

function finish(job: Job, patch: Partial<Job>) {
  Object.assign(job, patch, { finishedAt: Date.now() });
}

function run(job: Job, url: string, format: Format): Promise<void> {
  const dir = join(ROOT, job.id);
  mkdirSync(dir, { recursive: true });
  job.status = 'downloading';

  return new Promise((resolve) => {
    let lastError = '';
    let skipped = false;
    const child = spawn(YTDLP_PATH, buildArgs(url, format, dir, YTDLP_POT_URL), { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    const timer = setTimeout(() => child.kill('SIGKILL'), TIMEOUT_MS);

    const onLine = (line: string) => {
      const event = parseLine(line);
      if (!event) return;
      if (event.type === 'progress') job.percent = event.percent;
      else if (event.type === 'converting') job.status = 'converting';
      else if (event.type === 'error') lastError = event.message;
      else skipped = true;
    };
    createInterface({ input: child.stdout }).on('line', onLine);
    createInterface({ input: child.stderr }).on('line', onLine);

    child.on('error', (error) => {
      console.error('[yt] no se pudo ejecutar yt-dlp:', error.message);
      lastError = 'spawn';
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const file = code === 0 ? findOutput(dir) : undefined;
      if (file) {
        finish(job, { status: 'done', percent: 100, filePath: join(dir, file), fileName: file, size: statSync(join(dir, file)).size });
      } else {
        if (lastError) console.error(`[yt] ${job.id}: ${lastError}`);
        rmSync(dir, { recursive: true, force: true });
        finish(job, {
          status: 'error',
          error: skipped
            ? 'El video es una transmisión en vivo, dura más de 3 horas o pesa más de 2 GB.'
            : lastError === 'spawn'
              ? 'El descargador no está disponible en el servidor.'
              : friendlyError(lastError),
        });
      }
      resolve();
    });
  });
}

/** El archivo final: lo que quede en la carpeta que no sea temporal de yt-dlp. */
function findOutput(dir: string): string | undefined {
  return readdirSync(dir).find((f) => !/\.(part|ytdl|temp|webp|jpg|png)$/i.test(f) && !f.includes('.part-'));
}
