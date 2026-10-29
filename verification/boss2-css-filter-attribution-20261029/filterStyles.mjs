export const diagnosticCssByCase = Object.freeze({
  standard: '',
  'hud-backdrop-off': '.game-shell .game-hud { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }',
  'boss-hull-filter-off': '.game-shell .boss-hull { filter: none !important; }',
  'all-css-filters-off': ['.game-shell', '.game-shell::before', '.game-shell::after',
    '.game-shell *', '.game-shell *::before', '.game-shell *::after'].join(',') +
    ' { filter: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }',
});
export const filterPreviewLabel = 'GRAFIKTEST: CSS-Filter ausgeschaltet';
