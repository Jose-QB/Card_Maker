import { loadImageFile } from '../services/image-loader.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function renderFileControl({ id, label, image, description, error = '' }) {
  return `<div class="back-source">
    <label for="${id}">${escapeHtml(label)}
      <input id="${id}" data-back-input="true" type="file" accept="image/png,image/jpeg" aria-describedby="${id}-help ${id}-error" aria-invalid="${error ? 'true' : 'false'}">
    </label>
    <span id="${id}-help" class="help-text">${escapeHtml(image ? `Configurado: ${image.name ?? 'imagen local'}` : description)}</span>
    <span id="${id}-error" class="field-error" role="alert">${escapeHtml(error)}</span>
    ${image ? `<button type="button" data-back-remove="${id}">Quitar</button>` : ''}
  </div>`;
}

export function renderSpecificBackControl(card, image, error = '') {
  const id = `back-card-${card.id}`;
  return `<div class="card-back-control">
    <label for="${id}">Reverso de ${escapeHtml(card.name)} y sus copias
      <input id="${id}" data-back-specific="true" data-back-input="true" type="file" accept="image/png,image/jpeg" aria-describedby="${id}-help ${id}-error" aria-invalid="${error ? 'true' : 'false'}">
    </label>
    <span id="${id}-help" class="help-text">${escapeHtml(image ? `Configurado: ${image.name ?? 'imagen local'}` : 'Una imagen para este tipo; se repite en todas sus copias.')}</span>
    <span id="${id}-error" class="field-error" role="alert">${escapeHtml(error)}</span>
    ${image ? `<button type="button" data-back-remove="${id}">Quitar reverso</button>` : ''}
  </div>`;
}

export function renderBackControls(root, model, dispatch) {
  if (!root) return;
  const design = model.backDesign ?? { global: null, bySize: {}, byCard: {} };
  const errors = model.state.backErrors ?? {};
  const groups = model.layout?.groups ?? [];
  const cards = model.state.cards ?? [];
  root.innerHTML = `
    <p class="help-text">Prioridad: respaldo específico, después por tamaño y finalmente global. Los tamaños distintos se imprimen en hojas separadas.</p>
    ${renderFileControl({ id: 'back-global', label: 'Respaldo global de hoja', image: design.global, description: 'Cubre la hoja completa como fondo.', error: errors['back-global'] })}
    ${groups.map((group) => renderFileControl({
      id: `back-size-${group.key}`,
      label: `Respaldo para tamaño ${group.cardSize.width} × ${group.cardSize.height} mm`,
      image: design.bySize?.[group.key],
      description: 'Se repite en las cartas de este tamaño.',
      error: errors[`back-size-${group.key}`]
    })).join('')}
    `;

  const saveImage = async (input, target) => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const image = await loadImageFile(file);
      const changes = target.kind === 'global'
        ? { global: image }
        : target.kind === 'size'
          ? { bySize: { [target.key]: image } }
          : { byCard: { [target.key]: image } };
      dispatch({ type: 'set-back-design', changes });
      dispatch({ type: 'set-back-error', errors: { [input.id]: '' } });
      dispatch({ type: 'set-diagnostics', messages: [] });
    } catch (error) {
      dispatch({ type: 'set-back-error', errors: { [input.id]: error instanceof Error ? error.message : 'No se pudo cargar el respaldo.' } });
    } finally {
      input.value = '';
    }
  };

  root.querySelector('#back-global')?.addEventListener('change', (event) => saveImage(event.target, { kind: 'global' }));
  root.querySelectorAll('[id^="back-size-"]').forEach((input) => {
    input.addEventListener('change', (event) => saveImage(event.target, { kind: 'size', key: input.id.slice('back-size-'.length) }));
  });
  root.querySelectorAll('[data-back-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.backRemove;
      if (id === 'back-global') dispatch({ type: 'set-back-design', changes: { global: null } });
      else if (id.startsWith('back-size-')) dispatch({ type: 'set-back-design', changes: { bySize: { [id.slice(10)]: null } } });
      else dispatch({ type: 'set-back-design', changes: { byCard: { [id.slice(10)]: null } } });
      dispatch({ type: 'set-back-error', errors: { [id]: '' } });
    });
  });
}
