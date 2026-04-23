import { BaseEditor } from './base.js'
import Store          from '../core/storage.js'
import { esc }        from '../core/html.js'

export class TextCorrectionEditor extends BaseEditor {
  get title()    { return 'Corrección de textos' }
  get subtitle() { return 'Escribe el texto correcto — el sistema genera automáticamente el ejercicio' }

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
        <h2 class="section-label">Texto</h2>
        <p class="section-hint">
          Escribe el texto <strong>con todas las tildes y comas</strong>.
          El sistema quitará las tildes y marcará las comas como huecos en blanco para el alumno.
        </p>
        <div class="mb-3">
          <label class="form-label">Texto correcto <span class="required">*</span></label>
          <textarea class="form-control" id="f-correct" rows="4"
            placeholder="Jamás, señor ministro de salud, fue la salud más mortal."></textarea>
        </div>
        <div class="mb-3">
          <label class="form-label">Instrucción para el alumno</label>
          <input class="form-control" id="f-instruction" value="Pon las tildes y las comas que faltan" maxlength="120">
        </div>
        <div id="corr-preview" class="corr-preview-box hidden"></div>
      </section>
    `
  }

  _load(activity) {
    document.getElementById('f-title').value       = activity.title    || ''
    document.getElementById('f-subtitle').value    = activity.subtitle || ''
    document.getElementById('f-timer').value       = activity.rules?.timer ?? 120
    document.getElementById('f-penalty').value     = String(activity.scoring?.penaltyRatio ?? 0)
    document.getElementById('f-instruction').value = activity.content.instruction || ''
    document.getElementById('f-correct').value     = activity.content.textCorrect || ''
    this._updatePreview()
  }

  _bindBody() {
    document.getElementById('f-correct').addEventListener('input', () => this._updatePreview())
  }

  _updatePreview() {
    const correct  = document.getElementById('f-correct').value
    const preview  = document.getElementById('corr-preview')

    if (!correct) { preview.classList.add('hidden'); return }

    const original = _autoOriginal(correct)
    let zones = 0
    for (let i = 0; i < correct.length; i++) if (original[i] !== correct[i]) zones++

    preview.classList.remove('hidden')
    preview.innerHTML =
      `<p class="preview-label">Vista previa — lo que verá el alumno (${zones} zona${zones !== 1 ? 's' : ''}):</p>` +
      `<p class="preview-text">${_buildPreviewHTML(original, correct)}</p>`
  }

  validate() {
    const correct = document.getElementById('f-correct').value
    const errors  = []
    if (!document.getElementById('f-title').value.trim())
      errors.push('El título es obligatorio.')
    if (!correct)
      errors.push('El texto es obligatorio.')
    else {
      const original = _autoOriginal(correct)
      let zones = 0
      for (let i = 0; i < correct.length; i++) if (original[i] !== correct[i]) zones++
      if (zones === 0)
        errors.push('El texto no tiene tildes ni comas — no hay nada que corregir.')
    }
    return errors
  }

  buildActivity() {
    const title       = document.getElementById('f-title').value.trim()
    const subtitle    = document.getElementById('f-subtitle').value.trim()
    const timer       = parseInt(document.getElementById('f-timer').value, 10) || 120
    const penalty     = parseFloat(document.getElementById('f-penalty').value) || 0
    const correct     = document.getElementById('f-correct').value
    const instruction = document.getElementById('f-instruction').value.trim()
    const original    = _autoOriginal(correct)

    let zoneCount = 0
    for (let i = 0; i < correct.length; i++) if (original[i] !== correct[i]) zoneCount++

    return {
      id:       Store.uid(),
      title,
      subtitle,
      template: 'textCorrection',
      content: {
        textOriginal: original,
        textCorrect:  correct,
        instruction:  instruction || 'Pon las tildes y las comas que faltan',
        maxScore:     zoneCount * 10
      },
      rules:        { timer, randomize: false, shuffleOptions: false, templateOptions: {} },
      scoring:      { mode: 'perItem', pointsPerCorrect: 10, pointsPerWrong: 0, penaltyRatio: penalty, maxScore: null },
      review:       { allowOverride: true, showCorrectAnswer: true, autoAdvanceToSummary: false },
      presentation: { skin: 'default', layout: 'center', sound: false, showTimer: true, showScore: true, teams: false }
    }
  }
}

/* ── Helpers ─────────────────────────────────────────────────── */

const ACCENT_MAP = {
  á:'a', é:'e', í:'i', ó:'o', ú:'u', ü:'u',
  Á:'A', É:'E', Í:'I', Ó:'O', Ú:'U', Ü:'U'
}

// Derive student-facing text: strip accents, replace commas with blank placeholder
function _autoOriginal(correct) {
  return [...correct].map(ch => ACCENT_MAP[ch] ?? (ch === ',' ? '_' : ch)).join('')
}

function _buildPreviewHTML(original, correct) {
  const parts = []
  for (let i = 0; i < original.length; i++) {
    if (original[i] !== correct[i]) {
      const blank = original[i] === '_'
      const span  = blank
        ? `<span class="prev-zone prev-zone--blank">_</span>`
        : `<span class="prev-zone">${esc(correct[i])}</span>`
      if (blank && parts.length > 0 && parts[parts.length - 1].type === 'text') {
        const prev      = parts.pop()
        const lastSpace = prev.html.lastIndexOf(' ')
        if (lastSpace >= 0) {
          if (lastSpace + 1 > 0) parts.push({ type: 'text', html: prev.html.slice(0, lastSpace + 1) })
          parts.push({ type: 'nowrap', html: prev.html.slice(lastSpace + 1) + span })
        } else {
          parts.push({ type: 'nowrap', html: prev.html + span })
        }
      } else {
        parts.push({ type: 'span', html: span })
      }
      if (blank && i + 1 < original.length && original[i + 1] === ' ' && correct[i + 1] === ' ') {
        i++
      }
    } else {
      const ch   = esc(original[i])
      const last = parts[parts.length - 1]
      if (last?.type === 'text') last.html += ch
      else parts.push({ type: 'text', html: ch })
    }
  }
  return parts.map(p =>
    p.type === 'nowrap' ? `<span class="tc-nb">${p.html}</span>` : p.html
  ).join('')
}
