(() => {
  'use strict';
  const field = document.getElementById('report'), status = document.getElementById('status');
  function refresh() {
    const report = window.CryptoidPrivatePreviewEvidence.report();
    field.value = JSON.stringify(report, null, 2);
    status.textContent = report.evidenceSource === 'absent' ? 'Keine Vorschau-Ereignisse vorhanden. Fehlende Daten sind kein Fehlernachweis.'
      : report.evidenceSource === 'current-tab' ? 'Vorhandene Hinweise dieses Tabs gelesen.'
        : 'Letzte lokale Kopie gelesen. Sie kann aus einem anderen Tab stammen.';
  }
  document.getElementById('refresh').addEventListener('click', refresh);
  document.getElementById('copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(field.value); status.textContent = 'Bericht kopiert.'; }
    catch { field.focus(); field.select(); status.textContent = 'Bitte den markierten Bericht über das Kopiermenü kopieren.'; }
  });
  document.getElementById('download').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([field.value], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'cryptoid-private-preview-diagnose.json';
    document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  });
  refresh();
})();
