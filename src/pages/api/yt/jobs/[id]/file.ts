import type { APIRoute } from 'astro';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { getJob } from '../../../../../lib/jobs';
import { contentDisposition } from '../../../../../lib/youtube';

export const GET: APIRoute = ({ params }) => {
  const job = getJob(params.id ?? '');
  if (!job?.filePath || !job.fileName) return new Response('La descarga ya no existe.', { status: 404 });
  return new Response(Readable.toWeb(createReadStream(job.filePath)) as ReadableStream, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(job.size),
      'Content-Disposition': contentDisposition(job.fileName),
      'Cache-Control': 'no-store',
    },
  });
};
