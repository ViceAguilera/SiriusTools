// Transiciones entre páginas (las animaciones están en global.css).
// Va en <head> y no como módulo: pagereveal se dispara antes del primer pintado y un módulo llegaría tarde.
// La página que se va decide el tipo y lo deja en sessionStorage; la que llega lo aplica:
// - unlock (desde la entrada): View Transition entre documentos, la herramienta aparece en un círculo.
// - nav-forward / nav-back / nav (cambio de herramienta): sin View Transition, porque Chrome retiene ~300 ms la página
//   nueva para capturar la vieja y el cambio se siente lento. El contenido entra con una animación CSS desde el
//   primer cuadro (html[data-enter]).
// Sin soporte (Firefox) no pasa nada: la navegación es la de siempre.
(function () {
  // Respuesta inmediata al tocar el riel: la herramienta se marca antes de que llegue la página.
  document.addEventListener('click', function (e) {
    var link = e.target instanceof Element && e.target.closest('.rail-item[href]');
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var current = document.querySelector('.rail-item[aria-current="page"]');
    if (current) current.removeAttribute('aria-current');
    link.setAttribute('aria-current', 'page');
  });
  // Al volver atrás el navegador puede restaurar la página tal cual quedó, con la marca en la herramienta tocada.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    var path = location.pathname.replace(/\/+$/, '') || '/';
    var items = document.querySelectorAll('.rail-item[href]');
    for (var i = 0; i < items.length; i++) {
      if (items[i].getAttribute('href') === path) items[i].setAttribute('aria-current', 'page');
      else items[i].removeAttribute('aria-current');
    }
  });

  if (!('onpagereveal' in window)) return;
  var KEY = 'vt';

  function railIndex(url) {
    var path = new URL(url, location.href).pathname.replace(/\/+$/, '') || '/';
    var items = document.querySelectorAll('.rail-item[href]');
    for (var i = 0; i < items.length; i++) if (items[i].getAttribute('href') === path) return i;
    return -1;
  }

  window.addEventListener('pageswap', function (e) {
    if (!e.activation) return;
    var data = { type: 'nav', t: Date.now() };
    var lock = document.getElementById('lock');
    if (lock && lock.classList.contains('is-open')) {
      var r = lock.getBoundingClientRect();
      data = { type: 'unlock', t: data.t, x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    } else {
      if (e.viewTransition) {
        e.viewTransition.ready.catch(function () {}); // saltarla rechaza la promesa: no es un error
        e.viewTransition.skipTransition();
      }
      var from = railIndex(location.href);
      var to = railIndex(e.activation.entry.url);
      if (from >= 0 && to >= 0 && from !== to) data.type = to > from ? 'nav-forward' : 'nav-back';
    }
    try {
      sessionStorage.setItem(KEY, JSON.stringify(data));
    } catch (_) {}
  });

  window.addEventListener('pagereveal', function (e) {
    var data = null;
    try {
      data = JSON.parse(sessionStorage.getItem(KEY));
      sessionStorage.removeItem(KEY);
    } catch (_) {}
    // Un dato viejo (de otra pestaña o de una recarga) no vale.
    if (!data || Date.now() - data.t > 5000) return;
    var root = document.documentElement;
    if (data.type === 'unlock') {
      if (!e.viewTransition) return;
      e.viewTransition.types.add('unlock');
      root.style.setProperty('--vt-x', data.x + 'px');
      root.style.setProperty('--vt-y', data.y + 'px');
      e.viewTransition.finished.finally(function () {
        root.style.removeProperty('--vt-x');
        root.style.removeProperty('--vt-y');
      });
      return;
    }
    root.dataset.enter = data.type;
    setTimeout(function () {
      delete root.dataset.enter;
    }, 500);
  });
})();
