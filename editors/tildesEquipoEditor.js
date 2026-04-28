import { BaseEditor } from './base.js'
import Store          from '../core/storage.js'
import { esc }        from '../core/html.js'

const ROUNDS = 3

export class TildesEquipoEditor extends BaseEditor {
  get title()    { return 'Tildes Equipo' }
  get subtitle() { return `${ROUNDS} alumnos por equipo — cada uno corrige su texto` }

  renderBody() {
    return `
      <section class="editor-section">
        <h2 class="section-label">Información</h2>
        <div class="mb-3">
          <label class="form-label">Título <span class="required">*</span></label>
          <input class="form-control" id="f-title" placeholder="ej. Tildes: equipo A" maxlength="80">
        </div>
        <div class="mb-3">
          <label class="form-label">Subtítulo</label>
          <input class="form-control" id="f-subtitle" placeholder="ej. 3.º Primaria · Concurso">
        </div>
      </section>

      <section class="editor-section">
        <h2 class="section-label">Configuración</h2>
        <div class="config-row">
          <div class="d-flex align-items-center gap-3">
            <label class="form-label mb-0">⏱ Tiempo por alumno (s)</label>
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
          <div class="d-flex align-items-center gap-3">
            <label class="form-label mb-0">🖊️ Lápiz IR</label>
            <input class="form-check-input" type="checkbox" id="f-irpen">
          </div>
          <div class="d-flex align-items-center gap-3">
            <label class="form-label mb-0">🎨 Estilo visual</label>
            <select class="form-select field-input--sm" id="f-skin">
              <option value="default">Estándar</option>
              <option value="notebook" selected>Cuaderno (Kalam)</option>
            </select>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="f-score-only" checked>
            <label class="form-check-label" for="f-score-only">Solo puntaje (sin fracción ni %)</label>
          </div>
        </div>
      </section>

      ${Array.from({length: ROUNDS}, (_, i) => `
        <section class="editor-section">
          <h2 class="section-label">Alumno ${i + 1}</h2>
          <p class="section-hint">
            Escribe el texto <strong>con todas las tildes</strong>.
          </p>
          <div class="mb-3">
            <label class="form-label">Texto correcto <span class="required">*</span></label>
            <textarea class="form-control f-correct" id="f-correct-${i}" rows="3"
              placeholder="Mamá, ¿por qué el avión volará más rápido que el tren?"></textarea>
          </div>
          <div id="corr-preview-${i}" class="corr-preview-box hidden"></div>
        </section>
      `).join('')}
    `
  }

  _load(activity) {
    document.getElementById('f-title').value      = activity.title    || ''
    document.getElementById('f-subtitle').value   = activity.subtitle || ''
    document.getElementById('f-timer').value      = activity.rules?.timer ?? 120
    document.getElementById('f-penalty').value    = String(activity.scoring?.penaltyRatio ?? 0)
    document.getElementById('f-irpen').checked    = activity.rules?.templateOptions?.irPen ?? false
    document.getElementById('f-skin').value       = activity.presentation?.skin || 'notebook'
    document.getElementById('f-score-only').checked = (activity.presentation?.scoreMode ?? 'points') === 'points'

    const rounds = activity.content.rounds ?? []
    rounds.forEach((r, i) => {
      const el = document.getElementById(`f-correct-${i}`)
      if (el) { el.value = r.textCorrect || ''; this._updatePreview(i) }
    })
  }

  _bindBody() {
    for (let i = 0; i < ROUNDS; i++) {
      document.getElementById(`f-correct-${i}`)
        ?.addEventListener('input', () => this._updatePreview(i))
    }
  }

  _updatePreview(i) {
    const correct  = document.getElementById(`f-correct-${i}`)?.value ?? ''
    const preview  = document.getElementById(`corr-preview-${i}`)
    if (!preview) return

    if (!correct) { preview.classList.add('hidden'); return }

    const original = _autoOriginal(correct)
    let zones = 0
    for (let j = 0; j < correct.length; j++) if (original[j] !== correct[j]) zones++

    preview.classList.remove('hidden')
    preview.innerHTML =
      `<p class="preview-label">${zones} tilde${zones !== 1 ? 's' : ''}:</p>` +
      `<p class="preview-text">${_buildPreviewHTML(original, correct)}</p>`
  }

  validate() {
    const errors = []
    if (!document.getElementById('f-title').value.trim())
      errors.push('El título es obligatorio.')
    for (let i = 0; i < ROUNDS; i++) {
      const correct = document.getElementById(`f-correct-${i}`)?.value ?? ''
      if (!correct.trim()) { errors.push(`Alumno ${i + 1}: el texto es obligatorio.`); continue }
      const original = _autoOriginal(correct)
      let zones = 0
      for (let j = 0; j < correct.length; j++) if (original[j] !== correct[j]) zones++
      if (zones === 0) errors.push(`Alumno ${i + 1}: el texto no tiene tildes.`)
    }
    return errors
  }

  buildActivity() {
    const title     = document.getElementById('f-title').value.trim()
    const subtitle  = document.getElementById('f-subtitle').value.trim()
    const timer     = parseInt(document.getElementById('f-timer').value, 10) || 120
    const penalty   = parseFloat(document.getElementById('f-penalty').value) || 0
    const irPen     = document.getElementById('f-irpen').checked
    const skin      = document.getElementById('f-skin').value || 'notebook'
    const scoreOnly = document.getElementById('f-score-only').checked

    const rounds = Array.from({length: ROUNDS}, (_, i) => {
      const correct  = document.getElementById(`f-correct-${i}`).value
      const original = _autoOriginal(correct)
      let zones = 0
      for (let j = 0; j < correct.length; j++) if (original[j] !== correct[j]) zones++
      return {
        textOriginal: original,
        textCorrect:  correct,
        instruction:  'Pon las tildes que faltan',
        maxScore:     zones * 10
      }
    })

    const totalMaxScore = rounds.reduce((s, r) => s + r.maxScore, 0)

    return {
      id:       Store.uid(),
      title,
      subtitle,
      template: 'tildesEquipo',
      content:  { rounds, maxScore: totalMaxScore },
      rules:        { timer, randomize: false, shuffleOptions: false, templateOptions: { irPen } },
      scoring:      { mode: 'perItem', pointsPerCorrect: 10, pointsPerWrong: 0, penaltyRatio: penalty, maxScore: null },
      review:       { allowOverride: false, showCorrectAnswer: true, autoAdvanceToSummary: false, skipReview: true },
      presentation: { skin, layout: 'center', sound: false, showTimer: true, showScore: true, teams: true, scoreMode: scoreOnly ? 'points' : 'full' }
    }
  }
}

/* ── Helpers ─────────────────────────────────────────────────── */

const ACCENT_MAP = {
  á:'a', é:'e', í:'i', ó:'o', ú:'u', ü:'u',
  Á:'A', É:'E', Í:'I', Ó:'O', Ú:'U', Ü:'U'
}

function _autoOriginal(correct) {
  return [...correct].map(ch => ACCENT_MAP[ch] ?? ch).join('')
}

function _buildPreviewHTML(original, correct) {
  const parts = []
  for (let i = 0; i < original.length; i++) {
    if (original[i] !== correct[i]) {
      parts.push({ type: 'span', html: `<span class="prev-zone">${esc(correct[i])}</span>` })
    } else {
      const ch   = esc(original[i])
      const last = parts[parts.length - 1]
      if (last?.type === 'text') last.html += ch
      else parts.push({ type: 'text', html: ch })
    }
  }
  return parts.map(p => p.html).join('')
}
