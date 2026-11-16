function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

export function renderStatusSummary(root, model) {
  if (!root) return;
  const status = model.diagnostics.length > 0 || !model.layout.valid ? 'Revisa la configuración' : 'Listo para revisar';
  const statusClass = status === 'Listo para revisar' ? 'status-ok' : 'status-error';
  const deckLabel = model.state.deckType === 'word' ? 'Palabras' : 'Imágenes';
  const cardLabel = model.state.deckType === 'word' ? 'Cartas generadas' : 'Cartas';
  root.innerHTML = `
    <section class="status-summary" aria-labelledby="summary-title">
      <div class="status-summary-heading">
        <div><p class="eyebrow-dark">Resumen del mazo</p><h2 id="summary-title">${escapeHtml(deckLabel)}</h2></div>
        <span class="summary-status ${statusClass}">${escapeHtml(status)}</span>
      </div>
      <dl class="summary-list">
        <div><dt>${escapeHtml(cardLabel)}</dt><dd>${model.stats.totalCards}</dd></div>
        <div><dt>Tamaño de papel</dt><dd>${escapeHtml(model.config?.paper?.label ?? model.state.configInput.paper.toUpperCase())}</dd></div>
        <div><dt>Cartas por página</dt><dd>${escapeHtml(model.stats.capacityLabel)}</dd></div>
        <div><dt>Páginas</dt><dd>${model.stats.totalPages}</dd></div>
      </dl>
    </section>`;
}
