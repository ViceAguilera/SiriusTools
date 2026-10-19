// Catálogo de herramientas: la navegación (riel lateral y barra del celular) sale de aquí.
export interface Tool {
  href: string;
  /** Nombre corto para el riel y la barra del celular. */
  label: string;
  name: string;
  /** Trazos del ícono (SVG 24×24, solo líneas). */
  icon: string;
}

export const tools: Tool[] = [
  {
    href: '/youtube',
    label: 'descargar',
    name: 'Descargar de YouTube',
    icon: '<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>',
  },
  {
    href: '/imagenes',
    label: 'imágenes',
    name: 'Imágenes',
    icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  },
  {
    href: '/pdf',
    label: 'pdf',
    name: 'PDF',
    icon: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
  },
  {
    href: '/qr',
    label: 'qr',
    name: 'Código QR',
    icon: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 20h1M17 20h1M20 17h1"/>',
  },
  {
    href: '/metadatos',
    label: 'metadatos',
    name: 'Quitar metadatos',
    icon: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><path d="m4 4 16 16"/>',
  },
];
