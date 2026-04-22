import { BaseEditor } from './base.js'
import Store          from '../core/storage.js'
import { esc }        from '../core/html.js'

export class TextCorrectionEditor extends BaseEditor {
  get title()    { return 'Corrección de textos' }
  get subtitle() { return 'Escribe el texto con y sin las marcas correctas' }

  renderBody() {
    return `
      <section class="editor-section">
        <h2 class="section-label">Información</h2>
        <div class="mb-3">
          <label class="form-label">Título <span class="required">*</span></label>
          <input class="form-control" id="f-title" placeholder="ej. Tildes: verbos en pasado" maxlength="80">
        </div>
        <div class="mb-3">
          <label class="form-label">Subtítulo</label>
          <input class="form-control" id="f-subtitle" placeholder="ej. 3.º Primaria · Lengua">
        </div>
      </section>

      <section class="editor-section">
        <h2 class="section-label">Configuración</h2>
        <div class="config-row">
          <div class="d-flex align-items-center gap-3">
            <label class="form-label mb-0">⏱ Tiempo (segundos)</label>
            <input class="form-control field-input--sm" id="f-timer" type="number" value="120" min="30" max="600">
          </div>
          <div class="d-flex align-items-center gap-3">
            <label class="form-label mb-0">✗ Penalización por error</label>
            <select class="form-select field-input--sm" id="f-penalty">
              <option value="0">Ninguna</option>
              <option value="0.25">−¼ punto</option>
              <option value="0.5">−½ punto</option>
              <option value="1">−1 punto</option>
            </select>
          </div>
        </div>
      </section>

      <section class="editor-section">
        <h2 class="section-label">Textos</h2>
        <p class="section-hint">
          Los dos textos deben tener el mismo número de caracteres.
          Usa <strong>_</strong> (guion bajo) en el texto original para marcar donde falta una coma u otro signo.
        </p>
        <div class="mb-3">
          <label class="form-label">Texto SIN tildes/comas <span class="required">*</span></label>
          <div class="d-flex gap-2">
            <textarea class="form-control" id="f-original" rows="3"
              placeholder="El cafe esta abierto_ Jose corre rapido al salon."></textarea>
            <button class="btn-insert-blank" id="btn-blank" title="Insertar posición vacía para coma u otro signo">◌</button>
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label">Texto CON tildes/comas <span class="required">*</span></label>
          <textarea class="form-control" id="f-correct" rows="3"
            placeholder="El café está abierto, José corre rápido al salón."></textarea>
        </div>
        <div class="mb-3">
          <label class="form-label">Instrucción para el alumno</label>
          <input class="form-control" id="f-instruction" value="Pon las tildes que faltan" maxlength="120">
        </div>
        <p id="char-count" class="char-count"></p>
        <div id="corr-preview" class="corr-preview-box hidden"></div>
      </section>
    `
  }

  _bindBody() {
    document.getElementById('f-original').addEventListener('input', () => this._updatePreview())
    document.getElementById('f-correct').addEventListener('input',  () => this._updatePreview())

    document.getElementById('btn-blank').addEventListener('click', () => {
      const ta  = document.getElementById('f-original')
      const pos = ta.selectionStart
      ta.value  = ta.value.slice(0, pos) + '_' + ta.value.slice(ta.selectionEnd)
      ta.selectionStart = ta.selectionEnd = pos + 1
      ta.focus()
      this._updatePreview()
    })
  }

  _updatePreview() {
    const orig    = document.getElementById('f-original').value
    const correct = document.getElementById('f-correct').value
    const countEl = document.getElementById('char-count')
    const preview = document.getElementById('corr-preview')

    if (!orig && !correct) { countEl.textContent = ''; preview.classList.add('hidden'); return }

    const diff = orig.length - correct.length
    if (orig.length === correct.length) {
      countEl.textContent = `✓ ${orig.length} caracteres en ambos textos`
      countEl.className   = 'char-count char-count--ok'
    } else {
      countEl.textContent = `⚠ Diferencia de ${Math.abs(diff)} caracteres (sin tildes: ${orig.length}, con tildes: ${correct.length})`
      countEl.className   = 'char-count char-count--err'
    }

    if (orig && correct && orig.length === correct.length) {
      preview.classList.remove('hidden')
      preview.innerHTML = '<p class="preview-label">Vista previa — zonas marcadas en azul:</p>' +
        '<p class="preview-text">' + _buildPreviewHTML(orig, correct) + '</p>'
    } else {
      preview.classList.add('hidden')
    }
  }

  validate() {
    const orig    = document.getElementById('f-original').value
    const correct = document.getElementById('f-correct').value
    const errors  = []

    if (!document.getElementById('f-title').value.trim())
      errors.push('El título es obligatorio.')
    if (!orig)    errors.push('El texto sin tildes es obligatorio.')
    if (!correct) errors.push('El texto con tildes es obligatorio.')
    if (orig && correct && orig.length !== correct.length)
      errors.push(`Los textos deben tener el mismo número de caracteres (sin tildes: ${orig.length}, con tildes: ${correct.length}).`)

    if (orig && correct && orig.length === correct.length) {
      let zones = 0
      for (let i = 0; i < orig.length; i++) if (orig[i] !== correct[i]) zones++
      if (zones === 0) errors.push('Los textos son idénticos. Comprueba que el segundo texto tenga las tildes.')
    }
    return errors
  }

  buildActivity() {
    const title       = document.getElementById('f-title').value.trim()
    const subtitle    = document.getElementById('f-subtitle').value.trim()
    const timer       = parseInt(document.getElementById('f-timer').value, 10) || 120
    const penalty     = parseFloat(document.getElementById('f-penalty').value) || 0
    const orig        = document.getElementById('f-original').value
    const correct     = document.getElementById('f-correct').value
    const instruction = document.getElementById('f-instruction').value.trim()

    let zoneCount = 0
    for (let i = 0; i < orig.length; i++) if (orig[i] !== correct[i]) zoneCount++

    return {
      id:       Store.uid(),
      title,
      subtitle,
      template: 'textCorrection',
      content: {
        textOriginal: orig,
        textCorrect:  correct,
        instruction:  instruction || 'Pon las tildes que faltan',
        maxScore:     zoneCount * 10
      },
      rules:        { timer, randomize: false, shuffleOptions: false, templateOptions: {} },
      scoring:      { mode: 'perItem', pointsPerCorrect: 10, pointsPerWrong: 0, penaltyRatio: penalty, maxScore: null },
      review:       { allowOverride: true, showCorrectAnswer: true, autoAdvanceToSummary: false },
      presentation: { skin: 'default', layout: 'center', sound: false, showTimer: true, showScore: true, teams: false }
    }
  }
}

function _buildPreviewHTML(orig, correct) {
  let html = ''
  for (let i = 0; i < orig.length; i++) {
    if (orig[i] !== correct[i]) {
      const blank = orig[i] === '_'
      html += blank
        ? `<span class="prev-zone prev-zone--blank">_</span>`
        : `<span class="prev-zone">${esc(correct[i])}</span>`
    } else {
      html += esc(orig[i])
    }
  }
  return html
}
