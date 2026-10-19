import type { APIRoute } from 'astro';
import { busyReason, createJob } from '../../../../lib/jobs';
import { clientIp, rateLimited } from '../../../../lib/server';
import { canonicalVideoUrl, isFormat } from '../../../../lib/youtube';

const json = (body: unknown, status = 200) => Response.json(body, { status });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (rateLimited(`yt:${clientIp(request, clientAddress)}`, 30, 60 * 60 * 1000)) {
    return json({ error: 'Demasiadas descargas seguidas. Espera un rato.' }, 429);
  }
  const body = (await request.json().catch(() => null)) as { url?: unknown; format?: unknown } | null;
  const url = typeof body?.url === 'string' ? canonicalVideoUrl(body.url) : null;
  if (!url) return json({ error: 'Pega un link de un video de YouTube.' }, 400);
  if (!isFormat(body?.format)) return json({ error: 'Formato no válido.' }, 400);
  const busy = busyReason();
  if (busy) return json({ error: busy }, 503);
  return json({ id: createJob(url, body.format).id }, 201);
};
