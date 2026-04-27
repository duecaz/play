import { BaseEditor } from './base.js'
import Store          from '../core/storage.js'
import { esc }        from '../core/html.js'
import { LETTERS }    from '../core/constants.js'

export class QuizEditor extends BaseEditor {
  constructor(container) {
    super(container)
    this._questions = []
  }

  get title()    { return 'Crear Quiz' }
  get subtitle() { return 'Rellena los datos y añade tus preguntas' }

  renderBody() {
    this._questions = [_newQuestion()]
    return `
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
          <div class="d-flex align-items-center gap-3">
            <label class="form-label mb-0">✗ Penalización por error</label>
            <select class="form-select field-input--sm" id="f-penalty">
              <option value="0">Ninguna</option>
              <option value="0.25">−¼ punto</option>
              <option value="0.5">−½ punto</option>
              <option value="1">−1 punto</option>
            </select>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="f-score-only">
            <label class="form-check-label" for="f-score-only">Solo puntaje (sin fracción ni %)</label>
          </div>
        </div>
      </section>

      <section class="editor-section">
        <h2 class="section-label">Preguntas</h2>
        <div id="questions-list"></div>
        <button class="btn-add-question" id="btn-add-q">+ Añadir pregunta</button>
      </section>
    `
  }

  _load(activity) {
    document.getElementById('f-title').value       = activity.title    || ''
    document.getElementById('f-subtitle').value    = activity.subtitle || ''
    document.getElementById('f-timer').value       = activity.rules?.timer ?? 60
    document.getElementById('f-randomize').checked = activity.rules?.randomize ?? true
    document.getElementById('f-shuffle').checked   = activity.rules?.shuffleOptions ?? true
    document.getElementById('f-penalty').value       = String(activity.scoring?.penaltyRatio ?? 0)
    document.getElementById('f-score-only').checked  = activity.presentation?.scoreMode === 'points'

    this._questions = activity.content.items.map(item => {
      const opts = [...item.options]
      while (opts.length < 4) opts.push('')
      return { question: item.question, options: opts, correctIndex: opts.indexOf(item.answer) }
    })
    this._renderQuestions()
  }

  _bindBody() {
    this._renderQuestions()

    document.getElementById('btn-add-q').addEventListener('click', () => {
      this._questions.push(_newQuestion())
      this._renderQuestions()
    })

    const list = document.getElementById('questions-list')
    list.addEventListener('input', e => {
      if (e.target.matches('.q-text'))
        this._questions[+e.target.dataset.qi].question = e.target.value
      if (e.target.matches('.opt-text'))
        this._questions[+e.target.dataset.qi].options[+e.target.dataset.oi] = e.target.value
    })
    list.addEventListener('change', e => {
      if (e.target.matches('.opt-radio'))
        this._questions[+e.target.dataset.qi].correctIndex = +e.target.value
    })
    list.addEventListener('click', e => {
      const btn = e.target.closest('.btn-remove-q')
      if (btn) { this._questions.splice(+btn.dataset.qi, 1); this._renderQuestions() }
    })
  }

  _renderQuestions() {
    const list = document.getElementById('questions-list')
    if (!list) return
    list.innerHTML = this._questions.map((q, qi) => `
      <div class="question-card" data-qi="${qi}">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <span class="q-number">Pregunta ${qi + 1}</span>
          ${this._questions.length > 1
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
  }

  validate() {
    const errors = []
    if (!document.getElementById('f-title').value.trim())
      errors.push('El título es obligatorio.')

    const valid = this._validQuestions()
    if (valid.length === 0)
      errors.push('Añade al menos una pregunta con texto y 2 opciones rellenas.')

    valid.forEach((q, i) => {
      if (!q.options[q.correctIndex]?.trim())
        errors.push(`Pregunta ${i + 1}: marca cuál es la respuesta correcta.`)
    })
    return errors
  }

  buildActivity() {
    const title     = document.getElementById('f-title').value.trim()
    const subtitle  = document.getElementById('f-subtitle').value.trim()
    const timer     = parseInt(document.getElementById('f-timer').value, 10) || 60
    const randomize = document.getElementById('f-randomize').checked
    const shuffle   = document.getElementById('f-shuffle').checked
    const penalty   = parseFloat(document.getElementById('f-penalty').value) || 0
    const scoreOnly = document.getElementById('f-score-only').checked

    return {
      id:       Store.uid(),
      title,
      subtitle,
      template: 'quiz',
      content: {
        items: this._validQuestions().map((q, i) => ({
          id:       `q${i + 1}`,
          question: q.question.trim(),
          answer:   q.options[q.correctIndex].trim(),
          options:  q.options.filter(o => o.trim() !== ''),
          points:   10, image: null, audio: null
        }))
      },
      rules:        { timer, randomize, shuffleOptions: shuffle, templateOptions: {} },
      scoring:      { mode: 'perItem', pointsPerCorrect: 10, pointsPerWrong: 0, penaltyRatio: penalty, maxScore: null },
      review:       { allowOverride: true, showCorrectAnswer: true, autoAdvanceToSummary: false },
      presentation: { skin: 'default', layout: 'center', sound: false, showTimer: true, showScore: true, teams: false, scoreMode: scoreOnly ? 'points' : 'full' }
    }
  }

  _validQuestions() {
    return this._questions.filter(q =>
      q.question.trim() !== '' && q.options.filter(o => o.trim() !== '').length >= 2
    )
  }
}

function _newQuestion() {
  return { question: '', options: ['', '', '', ''], correctIndex: 0 }
}
