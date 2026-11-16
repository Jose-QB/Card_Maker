function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

export function deriveFlowStage(model) {
  if (model.state.exportStatus?.kind === 'error') return 'export';
  if (model.diagnostics.length > 0 || !model.layout.valid) return 'configure';
  if (model.stats.totalCards <= 0) return 'prepare';
  if (model.state.exportStatus?.kind === 'success') return 'export';
  return 'review';
}

export function renderFlowSteps(root, model) {
  if (!root) return;
  const active = deriveFlowStage(model);
  const steps = [
    ['configure', 'Configurar', 'Papel, tamaño y reglas'],
    ['prepare', 'Preparar cartas', model.state.deckType === 'word' ? 'Listas y palabras' : 'Imágenes y copias'],
    ['review', 'Revisar', 'Previsualización y páginas'],
    ['export', 'Exportar', 'PDF listo para imprimir']
  ];
  const activeIndex = steps.findIndex(([id]) => id === active);
  root.innerHTML = `
    <nav class="flow-steps" aria-label="Flujo de trabajo">
      <ol>
        ${steps.map(([id, label, description], index) => {
          const state = index < activeIndex ? 'complete' : index === activeIndex ? 'active' : 'upcoming';
          return `<li class="flow-step is-${state}">
            <a href="#${id}-section" aria-current="${state === 'active' ? 'step' : 'false'}">
              <span class="flow-step-number" aria-hidden="true">${index + 1}</span>
              <span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(description)}</small></span>
            </a>
          </li>`;
        }).join('')}
      </ol>
    </nav>`;
}
