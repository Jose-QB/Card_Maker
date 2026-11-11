import { CARD_PRESETS } from '../utils/config.js';

function findError(diagnostics, pattern) {
  return diagnostics.find((message) => pattern.test(message)) ?? '';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function numberField(id, label, value, {
  step = '1',
  min = '0',
  max = '1000',
  error = ''
} = {}) {
  const errorId = `${id}-error`;
  return `<div class="field-group">
    <label for="${id}">${label}
      <input id="${id}" name="${id}" type="number" min="${min}" max="${max}" step="${step}" value="${value ?? ''}"
        aria-describedby="${errorId}" aria-invalid="${error ? 'true' : 'false'}">
    </label>
    <span id="${errorId}" class="field-error" role="alert">${escapeHtml(error)}</span>
  </div>`;
}

export function renderControls(root, model, dispatch) {
  const input = model.state.configInput;
  const customCardEnabled = input.customCardEnabled !== false;
  const lastCardPreset = CARD_PRESETS[input.lastCardPreset] ? input.lastCardPreset : 'poker';
  const independentDimensions = input.dimensionsMode === 'perType';
  const diagnostics = model.diagnostics ?? [];
  const cardWidthError = findError(diagnostics, /ancho de la carta|carta no cabe/i);
  const cardHeightError = findError(diagnostics, /alto de la carta|carta no cabe/i);
  const marginError = (side) => findError(diagnostics, new RegExp(`margen ${side}`, 'i'));
  const paddingError = findError(diagnostics, /padding/i);
  root.innerHTML = `
    <fieldset>
      <legend>Papel</legend>
      <label for="paper">Tamaño de papel
        <select id="paper" name="paper">
          <option value="a4" ${input.paper === 'a4' ? 'selected' : ''}>A4 (210 × 297 mm)</option>
          <option value="letter" ${input.paper === 'letter' ? 'selected' : ''}>Carta US (215.9 × 279.4 mm)</option>
          <option value="legal" ${input.paper === 'legal' ? 'selected' : ''}>Legal (215.9 × 355.6 mm)</option>
          <option value="a3" ${input.paper === 'a3' ? 'selected' : ''}>A3 (297 × 420 mm)</option>
        </select>
      </label>
      <label for="orientation">Orientación
        <select id="orientation" name="orientation">
          <option value="portrait" ${input.orientation === 'portrait' ? 'selected' : ''}>Vertical</option>
          <option value="landscape" ${input.orientation === 'landscape' ? 'selected' : ''}>Horizontal</option>
        </select>
      </label>
    </fieldset>
    <fieldset>
      <legend>Dimensiones de carta (mm)</legend>
      <label for="dimensions-mode">Modo de dimensiones
        <select id="dimensions-mode" name="dimensions-mode">
          <option value="shared" ${input.dimensionsMode === 'shared' ? 'selected' : ''}>Compartidas</option>
          <option value="perType" ${input.dimensionsMode === 'perType' ? 'selected' : ''}>Únicas por carta</option>
        </select>
      </label>
      <label for="card-preset">Tamaño predefinido
        <select id="card-preset" name="card-preset" ${independentDimensions ? 'disabled' : ''}>
          ${Object.entries(CARD_PRESETS).map(([key, preset]) => `<option value="${key}" ${input.cardPreset === key ? 'selected' : ''}>${preset.label} (${preset.width} × ${preset.height} mm)</option>`).join('')}
          <option value="custom" ${input.cardPreset === 'custom' ? 'selected' : ''}>Personalizado</option>
        </select>
      </label>
      <label class="checkbox-field" for="custom-card-enabled">
        <input id="custom-card-enabled" name="custom-card-enabled" type="checkbox" ${customCardEnabled ? 'checked' : ''} ${independentDimensions ? 'disabled' : ''}>
        Usar tamaño personalizado
      </label>
      ${independentDimensions ? '<p class="field-help">Las dimensiones individuales se editan en cada fila de carta.</p>' : ''}
      <div id="shared-dimensions" ${input.dimensionsMode === 'perType' || !customCardEnabled ? 'hidden' : ''}>
        ${numberField('card-width', 'Ancho compartido', input.card.width, { step: '0.1', error: cardWidthError })}
        ${numberField('card-height', 'Alto compartido', input.card.height, { step: '0.1', error: cardHeightError })}
      </div>
    </fieldset>
    <fieldset>
      <legend>Alineación del bloque</legend>
      <label for="alignment-horizontal">Alineación horizontal
        <select id="alignment-horizontal" name="alignment-horizontal">
          <option value="left" ${input.alignment.horizontal === 'left' ? 'selected' : ''}>Izquierda</option>
          <option value="center" ${input.alignment.horizontal === 'center' ? 'selected' : ''}>Centro</option>
          <option value="right" ${input.alignment.horizontal === 'right' ? 'selected' : ''}>Derecha</option>
        </select>
      </label>
      <label for="alignment-vertical">Alineación vertical
        <select id="alignment-vertical" name="alignment-vertical">
          <option value="top" ${input.alignment.vertical === 'top' ? 'selected' : ''}>Arriba</option>
          <option value="center" ${input.alignment.vertical === 'center' ? 'selected' : ''}>Centro</option>
          <option value="bottom" ${input.alignment.vertical === 'bottom' ? 'selected' : ''}>Abajo</option>
        </select>
      </label>
    </fieldset>
    <fieldset>
      <legend>Márgenes de hoja (mm)</legend>
      ${numberField('margin-top', 'Superior', input.margins.top, { step: '0.1', error: marginError('top') })}
      ${numberField('margin-right', 'Derecho', input.margins.right, { step: '0.1', error: marginError('right') })}
      ${numberField('margin-bottom', 'Inferior', input.margins.bottom, { step: '0.1', error: marginError('bottom') })}
      ${numberField('margin-left', 'Izquierdo', input.margins.left, { step: '0.1', error: marginError('left') })}
    </fieldset>
    <fieldset>
      <legend>Tratamiento de carta</legend>
      ${numberField('padding', 'Padding (mm)', input.padding, { step: '0.1', error: paddingError })}
      <label for="visual-mode">Modo de imagen
        <select id="visual-mode" name="visual-mode">
          <option value="normal" ${input.visualMode === 'normal' ? 'selected' : ''}>Normal</option>
          <option value="bleed" ${input.visualMode === 'bleed' ? 'selected' : ''}>A sangre</option>
        </select>
      </label>
      <label for="order">Orden de copias
        <select id="order" name="order">
          <option value="normal" ${model.state.order === 'normal' ? 'selected' : ''}>Normal</option>
          <option value="interleaved" ${model.state.order === 'interleaved' ? 'selected' : ''}>Intercalado</option>
        </select>
      </label>
    </fieldset>`;

  const sendConfig = (changes) => dispatch({ type: 'set-config', changes });
  const sendNumberConfig = (event, changes, label, { min, max }) => {
    const rawValue = event.target.value.trim();
    const value = Number(rawValue);
    if (!rawValue || !Number.isFinite(value) || value < min || value > max) {
      dispatch({
        type: 'set-config-and-diagnostics',
        changes,
        messages: [`${label} debe ser un número entre ${min} y ${max} mm.`]
      });
      return;
    }
    sendConfig(changes);
  };
  root.querySelector('#paper').addEventListener('change', (event) => sendConfig({ paper: event.target.value }));
  root.querySelector('#orientation').addEventListener('change', (event) => sendConfig({ orientation: event.target.value }));
  root.querySelector('#dimensions-mode').addEventListener('change', (event) => sendConfig({ dimensionsMode: event.target.value }));
  root.querySelector('#alignment-horizontal').addEventListener('change', (event) => sendConfig({ alignment: { horizontal: event.target.value } }));
  root.querySelector('#alignment-vertical').addEventListener('change', (event) => sendConfig({ alignment: { vertical: event.target.value } }));
  root.querySelector('#visual-mode').addEventListener('change', (event) => sendConfig({ visualMode: event.target.value }));
  root.querySelector('#order').addEventListener('change', (event) => dispatch({ type: 'set-order', order: event.target.value }));
  root.querySelector('#card-preset').addEventListener('change', (event) => {
    const preset = CARD_PRESETS[event.target.value];
    if (!preset) {
      sendConfig({ cardPreset: 'custom', lastCardPreset, customCardEnabled: true });
      return;
    }
    sendConfig({ cardPreset: event.target.value, lastCardPreset: event.target.value, customCardEnabled: false, card: { width: preset.width, height: preset.height } });
  });
  root.querySelector('#custom-card-enabled').addEventListener('change', (event) => {
    if (event.target.checked) {
      sendConfig({ cardPreset: 'custom', lastCardPreset, customCardEnabled: true });
      return;
    }
    const preset = CARD_PRESETS[lastCardPreset];
    sendConfig({ cardPreset: lastCardPreset, lastCardPreset, customCardEnabled: false, card: { width: preset.width, height: preset.height } });
  });
  root.querySelector('#card-width').addEventListener('change', (event) => sendNumberConfig(event, { cardPreset: 'custom', customCardEnabled: true, card: { width: event.target.value } }, 'El ancho de la carta', { min: 0.1, max: 1000 }));
  root.querySelector('#card-height').addEventListener('change', (event) => sendNumberConfig(event, { cardPreset: 'custom', customCardEnabled: true, card: { height: event.target.value } }, 'El alto de la carta', { min: 0.1, max: 1000 }));
  root.querySelector('#padding').addEventListener('change', (event) => sendNumberConfig(event, { padding: event.target.value }, 'El padding', { min: 0, max: 1000 }));
  for (const side of ['top', 'right', 'bottom', 'left']) {
    root.querySelector(`#margin-${side}`).addEventListener('change', (event) => sendNumberConfig(event, { margins: { [side]: event.target.value } }, `El margen ${side}`, { min: 0, max: 1000 }));
  }
}
