import Store    from '../core/storage.js'
import Router   from '../core/router.js'
import { esc }  from '../core/html.js'

export function renderTextCorrectionEditor(container) {
  container.className = 'view-editor'

  container.innerHTML = `
    <div class="editor-header">
      <button class="btn-back" id="btn-back">← Volver</button>
      <div>
        <h1>Corrección de textos</h1>
        <p class="view-subtitle">Escribe el texto con y sin tildes</p>
      </div>
      <button class="btn-primary" id="btn-save">Crear actividad ▶</button>
    </div>

    <div class="editor-body">

      <section class="editor-section">
        <h2 class="section-label">Información</h2>
        <div class="field-group">
          <label class="field-label">Título <span class="required">*</span></label>
          <input class="field-input" id="f-title" placeholder="ej. Tildes: verbos en pasado" maxlength="80">
        </div>
        <div class="field-group">
          <label class="field-label">Subtítulo</label>
          <input class="field-input" id="f-subtitle" placeholder="ej. 3.º Primaria · Lengua">
        </div>
      </section>

      <section class="editor-section">
        <h2 class="section-label">Configuración</h2>
        <div class="config-row">
          <div class="field-group field-group--inline">
            <label class="field-label">⏱ Tiempo (segundos)</label>
            <input class="field-input field-input--sm" id="f-timer" type="number" value="120" min="30" max="600">
          </div>
        </div>
      </section>

      <section class="editor-section">
        <h2 class="section-label">Textos</h2>
        <p class="section-hint">Los dos textos deben tener exactamente el mismo número de caracteres. Solo cambian las letras con tilde.</p>
        <div class="field-group">
          <label class="field-label">Texto SIN tildes <span class="required">*</span></label>
          <textarea class="field-input field-textarea" id="f-original" rows="3"
            placeholder="El cafe esta abierto. Jose corre rapido al salon."></textarea>
        </div>
        <div class="field-group">
          <label class="field-label">Texto CON tildes <span class="required">*</span></label>
          <textarea class="field-input field-textarea" id="f-correct" rows="3"
            placeholder="El café está abierto. José corre rápido al salón."></textarea>
        </div>
        <div class="field-group">
          <label class="field-label">Instrucción para el alumno</label>
          <input class="field-input" id="f-instruction" value="Pon las tildes que faltan" maxlength="120">
        </div>

        <p id="char-count" class="char-count"></p>
        <div id="corr-preview" class="corr-preview-box hidden"></div>
      </section>

      <div id="editor-error" class="editor-error hidden"></div>

    </div>
  `

  document.getElementById('btn-back').addEventListener('click', () => Router.navigate('/create'))
  document.getElementById('btn-save').addEventListener('click', () => _save())

  const origEl    = document.getElementById('f-original')
  const correctEl = document.getElementById('f-correct')
  const countEl   = document.getElementById('char-count')
  const preview   = document.getElementById('corr-preview')

  function updatePreview() {
    const orig    = origEl.value
    const correct = correctEl.value
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

  origEl.addEventListener('input', updatePreview)
  correctEl.addEventListener('input', updatePreview)
}

function _buildPreviewHTML(orig, correct) {
  let html = ''
  for (let i = 0; i < orig.length; i++) {
    if (orig[i] !== correct[i]) html += `<span class="prev-zone">${esc(correct[i])}</span>`
    else html += esc(orig[i])
  }
  return html
}

function _save() {
  const title       = document.getElementById('f-title').value.trim()
  const subtitle    = document.getElementById('f-subtitle').value.trim()
  const timer       = parseInt(document.getElementById('f-timer').value, 10) || 120
  const orig        = document.getElementById('f-original').value
  const correct     = document.getElementById('f-correct').value
  const instruction = document.getElementById('f-instruction').value.trim()

  const errorEl = document.getElementById('editor-error')
  const errors  = []

  if (!title)   errors.push('El título es obligatorio.')
  if (!orig)    errors.push('El texto sin tildes es obligatorio.')
  if (!correct) errors.push('El texto con tildes es obligatorio.')
  if (orig && correct && orig.length !== correct.length)
    errors.push(`Los textos deben tener el mismo número de caracteres (sin tildes: ${orig.length}, con tildes: ${correct.length}).`)

  let zoneCount = 0
  if (orig && correct && orig.length === correct.length) {
    for (let i = 0; i < orig.length; i++) if (orig[i] !== correct[i]) zoneCount++
    if (zoneCount === 0) errors.push('Los textos son idénticos. Comprueba que el segundo texto tenga las tildes.')
  }

  if (errors.length) {
    errorEl.innerHTML = errors.map(e => `<p>⚠ ${e}</p>`).join('')
    errorEl.classList.remove('hidden')
    errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    return
  }

  errorEl.classList.add('hidden')

  const activity = {
    id:       Store.uid(),
    title,
    subtitle,
    template: 'textCorrection',
    config: { timer, showTimer: true, showScore: true, sound: false, skin: 'default' },
    content: {
      textOriginal: orig,
      textCorrect:  correct,
      instruction:  instruction || 'Pon las tildes que faltan',
      maxScore:     zoneCount * 10
    }
  }

  Store.save(activity)
  Router.navigate(`/play/${activity.id}`)
}

