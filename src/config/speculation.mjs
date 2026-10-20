// Reglas de precarga de Chrome (Speculation Rules): descarga de antemano las herramientas del riel y las usa al
// tocarlas, así el cambio no espera a la red. Layout.astro las escribe inline y astro.config.mjs agrega su hash a la CSP
// (Chrome ignora 'inline-speculation-rules' cuando la política lleva hashes): por eso el texto sale de un solo lugar.
export const speculationRules = JSON.stringify({
  prefetch: [{ where: { selector_matches: '.rail-item[href]' }, eagerness: 'immediate' }],
});
