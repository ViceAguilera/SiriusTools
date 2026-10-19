// Lógica pura de IPs (sin astro:env), para poder testearla.

/**
 * Clave de límite para una IP. Un hogar recibe todo un bloque IPv6 /64 y puede rotar direcciones
 * dentro de él, así que en IPv6 se agrupa por los primeros 4 grupos.
 */
export function ipKey(ip: string): string {
  const addr = ip.replace(/^::ffff:(?=\d+\.)/i, ''); // IPv4 escrita como IPv6
  if (!addr.includes(':')) return addr;
  const [head, tail = ''] = addr.split('::');
  const left = head ? head.split(':') : [];
  const right = addr.includes('::') && tail ? tail.split(':') : [];
  const groups = addr.includes('::') ? [...left, ...Array(8 - left.length - right.length).fill('0'), ...right] : left;
  return `${groups.slice(0, 4).map((g) => g.toLowerCase().replace(/^0+(?=.)/, '')).join(':')}::/64`;
}
