function getPageValue(model) {
  return Number.isInteger(model?.currentPage) ? model.currentPage : 0;
}

function getTotalValue(model) {
  return Number.isInteger(model?.totalPages) ? model.totalPages : 0;
}

export function renderPagination(root, model, dispatch) {
  if (!root) return;

  const currentPage = getPageValue(model);
  const totalPages = getTotalValue(model);
  const hasPages = totalPages > 0 && currentPage > 0;
  const previousDisabled = !hasPages || currentPage <= 1;
  const nextDisabled = !hasPages || currentPage >= totalPages;

  root.innerHTML = `
    <nav class="preview-pagination" aria-label="Paginación de la previsualización">
      <button type="button" data-action="previous" ${previousDisabled ? 'disabled aria-disabled="true"' : ''}>Anterior</button>
      <span aria-live="polite">${hasPages ? `Página ${currentPage} de ${totalPages}` : 'Sin páginas'}</span>
      <button type="button" data-action="next" ${nextDisabled ? 'disabled aria-disabled="true"' : ''}>Siguiente</button>
    </nav>`;

  if (typeof root.querySelector !== 'function' || typeof dispatch !== 'function') return;

  root.querySelector('[data-action="previous"]')?.addEventListener('click', () => {
    if (!previousDisabled) dispatch({ type: 'set-page', page: currentPage - 1 });
  });
  root.querySelector('[data-action="next"]')?.addEventListener('click', () => {
    if (!nextDisabled) dispatch({ type: 'set-page', page: currentPage + 1 });
  });
}
