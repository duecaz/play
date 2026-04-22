import Store           from '../core/storage.js'
import Router          from '../core/router.js'
import { esc }         from '../core/html.js'
import { LETTERS }     from '../core/constants.js'

let _questions = []

export function renderQuizEditor(container) {
  container.className = 'view-editor'
  _questions = [newQuestion()]

  container.innerHTML = `
    <div class="editor-header">
      <button class="btn btn-outline-secondary rounded-pill" id="btn-back">← Volver</button>
      <div>
        <h1 class="fs-4 fw-bold mb-0">Crear Quiz</h1>
        <p class="section-hint mt-1">Rellena los datos y añade tus preguntas</p>
      </div>
      <button class="btn btn-primary" id="btn-save">Crear actividad ▶</button>
    </div>

    <div class="editor-body">

      <section class="editor-section">
        <h2 class="section-label">Información</h2>
        <div class="mb-3">
          <label class="form-label">Título <span class="required">*</span></label>
          <input class="form-control" id="f-title" placeholder="ej. Vocabulario: Los animales" maxlength="80">
        </div>
        <div class="mb-3">
          <label class="form-label">Subtítulo</label>
          <input class="form-control" id="f-subtitle" placeholder="ej. Nivel A1 · Español">
        </div>
      </section>

      <section class="editor-section">
        <h2 class="section-label">Configuración</h2>
        <div class="config-row">
          <div class="d-flex align-items-center gap-3">
            <label class="form-label mb-0">⏱ Tiempo (segundos)</label>
            <input class="form-control field-input--sm" id="f-timer" type="number" value="60" min="10" max="600">
          </div>
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="f-randomize" checked>
            <label class="form-check-label" for="f-randomize">Aleatorizar preguntas</label>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="f-shuffle" checked>
            <label class="form-check-label" for="f-shuffle">Barajar opciones</label>
          </div>
        </div>
      </section>

      <section class="editor-section">
        <h2 class="section-label">Preguntas</h2>
        <div id="questions-list"></div>
        <button class="btn-add-question" id="btn-add-q">+ Añadir pregunta</button>
      </section>

      <div id="editor-error" class="editor-error hidden"></div>

    </div>
  `

  _renderQuestions()

  document.getElementById('btn-back').addEventListener('click', () => Router.navigate('/create'))
  document.getElementById('btn-add-q').addEventListener('click', () => {
    _questions.push(newQuestion())
    _renderQuestions()
  })
  document.getElementById('btn-save').addEventListener('click', () => _save(container))
}

/* ── Render question list ─────────────────────────────────── */
function _renderQuestions() {
  const list = document.getElementById('questions-list')
  if (!list) return

  list.innerHTML = _questions.map((q, qi) => `
    <div class="question-card" data-qi="${qi}">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <span class="q-number">Pregunta ${qi + 1}</span>
        ${_questions.length > 1
          ? `<button class="btn btn-sm btn-link text-danger p-0 btn-remove-q" data-qi="${qi}" title="Eliminar">✕</button>`
          : ''}
      </div>

      <div class="mb-3">
        <label class="form-label">Pregunta <span class="required">*</span></label>
        <textarea class="form-control q-text" data-qi="${qi}"
          placeholder="Escribe la pregunta aquí..."
          rows="2">${esc(q.question)}</textarea>
      </div>

      <div class="options-grid">
        ${q.options.map((opt, oi) => `
          <div class="option-row">
            <input type="radio" name="correct-${qi}" class="opt-radio"
              value="${oi}" data-qi="${qi}"
              ${q.correctIndex === oi ? 'checked' : ''}
              title="Marcar como respuesta correcta">
            <span class="opt-letter">${LETTERS[oi]}</span>
            <input type="text" class="form-control opt-text"
              data-qi="${qi}" data-oi="${oi}"
              placeholder="Opción ${LETTERS[oi]}"
              value="${esc(opt)}" maxlength="120">
          </div>
        `).join('')}
      </div>
      <p class="q-hint mt-2">Selecciona el círculo de la opción correcta</p>
    </div>
  `).join('')

  list.querySelectorAll('.q-text').forEach(el => {
    el.addEventListener('input', e => { _questions[+e.target.dataset.qi].question = e.target.value })
  })
  list.querySelectorAll('.opt-text').forEach(el => {
    el.addEventListener('input', e => {
      const { qi, oi } = e.target.dataset
      _questions[+qi].options[+oi] = e.target.value
    })
  })
  list.querySelectorAll('.opt-radio').forEach(el => {
    el.addEventListener('change', e => {
      _questions[+e.target.dataset.qi].correctIndex = +e.target.value
    })
  })
  list.querySelectorAll('.btn-remove-q').forEach(btn => {
    btn.addEventListener('click', () => {
      _questions.splice(+btn.dataset.qi, 1)
      _renderQuestions()
    })
  })
}

/* ── Save ─────────────────────────────────────────────────── */
function _save() {
  const title     = document.getElementById('f-title').value.trim()
  const subtitle  = document.getElementById('f-subtitle').value.trim()
  const timer     = parseInt(document.getElementById('f-timer').value, 10) || 60
  const randomize = document.getElementById('f-randomize').checked
  const shuffle   = document.getElementById('f-shuffle').checked

  const errorEl = document.getElementById('editor-error')
  const errors  = []

  if (!title) errors.push('El título es obligatorio.')

  const validQuestions = _questions.filter(q => {
    const hasText    = q.question.trim() !== ''
    const filledOpts = q.options.filter(o => o.trim() !== '')
    return hasText && filledOpts.length >= 2
  })

  if (validQuestions.length === 0)
    errors.push('Añade al menos una pregunta con texto y 2 opciones rellenas.')

  validQuestions.forEach((q, i) => {
    const chosen = q.options[q.correctIndex]?.trim()
    if (!chosen) errors.push(`Pregunta ${i + 1}: marca cuál es la respuesta correcta.`)
  })

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
    template: 'quiz',
    config: {
      timer, showTimer: true, randomize,
      shuffleOptions: shuffle, showScore: true,
      sound: false, teams: false, layout: 'center', skin: 'default'
    },
    content: {
      items: validQuestions.map((q, i) => ({
        id:       `q${i + 1}`,
        question: q.question.trim(),
        answer:   q.options[q.correctIndex].trim(),
        options:  q.options.filter(o => o.trim() !== ''),
        points:   10, image: null, audio: null
      }))
    }
  }

  Store.save(activity)
  Router.navigate(`/play/${activity.id}`)
}

function newQuestion() {
  return { question: '', options: ['', '', '', ''], correctIndex: 0 }
}
