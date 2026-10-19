import type { APIRoute } from 'astro';
import { KEEP_MS, getJob } from '../../../../../lib/jobs';

export const GET: APIRoute = ({ params }) => {
  const job = getJob(params.id ?? '');
  if (!job) return Response.json({ error: 'La descarga ya no existe.' }, { status: 404 });
  const { status, percent, error, fileName, size, finishedAt } = job;
  // Milisegundos que le quedan al archivo en el servidor (relativo, para no depender del reloj del navegador).
  const expiresIn = finishedAt ? Math.max(0, finishedAt + KEEP_MS - Date.now()) : undefined;
  return Response.json({ status, percent, error, fileName, size, expiresIn });
};
