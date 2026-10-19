/** Solo rutas internas: evita que ?next= mande a otro sitio después de entrar. */
// Se parsea igual que el navegador (que borra tabs y saltos de línea: "/\t/evil.com" es "//evil.com")
// y se acepta solo si sigue en el mismo origen.
const BASE = 'http://interno.invalid';

export function safeNext(value: string | null): string {
  if (!value || !value.startsWith('/')) return '/';
  const url = new URL(value, BASE);
  if (url.origin !== BASE) return '/';
  // Al resolver "/.//evil.com" el pathname queda "//evil.com": se colapsan las barras iniciales.
  return '/' + url.pathname.replace(/^\/+/, '') + url.search + url.hash;
}
