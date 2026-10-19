// Antes de pintar: aplica el tema elegido con el botón, para que no parpadee al cargar.
// Va como archivo y no inline porque la CSP solo permite scripts propios o con hash.
try {
  var t = localStorage.getItem('theme');
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
} catch (e) {}
