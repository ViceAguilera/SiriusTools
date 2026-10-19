// Estado de la cola de descargas en el navegador (sessionStorage: dura lo que la pestaña).

export type QueueStatus = 'queued' | 'downloading' | 'converting' | 'done' | 'error';

export interface QueueItem {
  id: string;
  url: string;
  format: string;
  status: QueueStatus;
  percent: number;
  error?: string;
  fileName?: string;
  size?: number;
  /** Hora local en que el servidor borra el archivo. */
  expiresAt?: number;
  /** Ya se guardó una vez (para no repetir la descarga automática). */
  saved?: boolean;
}

const KEY = 'tools:queue';
const MAX_ITEMS = 30;

export function loadQueue(): QueueItem[] {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? '[]');
    return Array.isArray(parsed) ? (parsed as QueueItem[]) : [];
  } catch {
    return [];
  }
}

export function saveQueue(items: QueueItem[]) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Modo privado o almacenamiento bloqueado: la cola sigue funcionando, solo no sobrevive a recargar.
  }
}

/** Agrega al principio, sin duplicar el mismo trabajo, y descarta los más viejos sobre el máximo. */
export function addToQueue(items: QueueItem[], item: QueueItem): QueueItem[] {
  return [item, ...items.filter((other) => other.id !== item.id)].slice(0, MAX_ITEMS);
}
