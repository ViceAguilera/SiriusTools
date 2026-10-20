// Transiciones entre páginas con View Transitions entre documentos (las animaciones están en global.css).
// Va en <head> y no como módulo: pagereveal se dispara antes del primer pintado y un módulo llegaría tarde.
// La página que se va decide el tipo de transición y lo deja en sessionStorage; la que llega lo aplica.
// Sin soporte (Firefox) no pasa nada: la navegación es la de siempre.
(function () {
  if (!('onpagereveal' in window)) return;
  var KEY = 'vt';

  function railIndex(url) {
    var path = new URL(url, location.href).pathname.replace(/\/+$/, '') || '/';
    var items = document.querySelectorAll('.rail-item[href]');
    for (var i = 0; i < items.length; i++) if (items[i].getAttribute('href') === path) return i;
    return -1;
  }

  window.addEventListener('pageswap', function (e) {
    if (!e.viewTransition || !e.activation) return;
    var data = { type: 'nav', t: Date.now() };
    var lock = document.getElementById('lock');
    if (lock && lock.classList.contains('is-open')) {
      // Desde la entrada: la herramienta aparece en un círculo que crece desde el candado.
      var r = lock.getBoundingClientRect();
      data = { type: 'unlock', t: data.t, x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    } else {
      var from = railIndex(location.href);
      var to = railIndex(e.activation.entry.url);
      if (from >= 0 && to >= 0 && from !== to) data.type = to > from ? 'nav-forward' : 'nav-back';
    }
    try {
      sessionStorage.setItem(KEY, JSON.stringify(data));
    } catch (_) {}
  });

  window.addEventListener('pagereveal', function (e) {
    if (!e.viewTransition) return;
    var data = null;
    try {
      data = JSON.parse(sessionStorage.getItem(KEY));
      sessionStorage.removeItem(KEY);
    } catch (_) {}
    // Un dato viejo (de otra pestaña o de una navegación sin transición) no vale.
    if (!data || Date.now() - data.t > 5000) data = { type: 'nav' };
    e.viewTransition.types.add(data.type);
    if (data.type === 'unlock') {
      var root = document.documentElement.style;
      root.setProperty('--vt-x', data.x + 'px');
      root.setProperty('--vt-y', data.y + 'px');
      e.viewTransition.finished.finally(function () {
        root.removeProperty('--vt-x');
        root.removeProperty('--vt-y');
      });
    }
  });
})();
