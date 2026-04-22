import { BaseTemplate }            from './base.js'
import Events                       from '../core/events.js'
import { esc }                      from '../core/html.js'
import { LETTERS, FEEDBACK_DELAY }  from '../core/constants.js'

export class QuizTemplate extends BaseTemplate {
  static requiresTools  = []
  static reviewStrategy = 'itemList'
  static optionsSchema  = [
    { key: 'randomize',         type: 'bool', default: true,  label: 'Aleatorizar preguntas' },
    { key: 'shuffleOptions',    type: 'bool', default: true,  label: 'Barajar opciones' },
    { key: 'showAnswerOnWrong', type: 'bool', default: true,  label: 'Mostrar respuesta al fallar' }
  ]
  static reviewOptions = [
    { key: 'allowRetry', type: 'bool', default: false, label: 'Permitir reintentar pregunta desde revisión' }
  ]

  constructor() {
    super()
    this._items           = []
    this._currentIndex    = 0
    this._answered        = false
    this._feedbackTimeout = null
    this._results         = []   // [{id, question, options, given, expected, correct, earnedPoints, maxPoints}]
  }

  init(activity, container, callbacks) {
    super.init(activity, container, callbacks)
    this._results = []
    this._items   = [...activity.content.items]
    if (activity.rules.randomize) _shuffle(this._items)
  }

  start() {
    this._currentIndex = 0
    this._answered     = false
    this._results      = []
    this._render()
  }

  pause()  {}
  resume() {}

  reset() {
    clearTimeout(this._feedbackTimeout)
    this._currentIndex = 0
    this._answered     = false
    this._results      = []
    this._items = [...this.activity.content.items]
    if (this.activity.rules.randomize) _shuffle(this._items)
  }

  destroy() {
    clearTimeout(this._feedbackTimeout)
    super.destroy()
  }

  /* ── Review API ────────────────────────────────────────────── */
  freeze() {
    clearTimeout(this._feedbackTimeout)
    this._answered = true
    this.container.querySelectorAll('.quiz-option').forEach(btn => { btn.disabled = true })
  }

  getReviewData() {
    const byId = Object.fromEntries(this._results.map(r => [r.id, r]))
    const items = this._items.map(item => byId[item.id] ?? {
      id:           item.id,
      question:     item.question,
      options:      item.options,
      given:        null,
      expected:     item.answer,
      correct:      false,
      earnedPoints: 0,
      maxPoints:    item.points ?? 10
    })
    const score    = items.reduce((s, i) => s + i.earnedPoints, 0)
    const maxScore = this._items.reduce((s, i) => s + (i.points ?? 10), 0)
    return { strategy: 'itemList', items, score, maxScore }
  }

  /* ── Rendering ─────────────────────────────────────────────── */
  _render() {
    const item = this._items[this._currentIndex]
    if (!item) { this._complete(); return }

    const options = [...item.options]
    if (this.activity.rules.shuffleOptions) _shuffle(options)

    this.container.innerHTML = `
      <div class="quiz-wrapper fade-in">

        <div class="quiz-progress">
          ${this._currentIndex + 1} / ${this._items.length}
        </div>

        <div class="quiz-question">
          ${item.image ? `<img class="quiz-image" src="${item.image}" alt="">` : ''}
          <p>${esc(item.question)}</p>
        </div>

        <div class="quiz-options">
          ${options.map((opt, i) => `
            <button class="quiz-option" data-value="${esc(opt)}">
              <span class="option-letter">${LETTERS[i]}</span>
              <span class="option-text">${esc(opt)}</span>
            </button>
          `).join('')}
        </div>

      </div>
    `

    this.container.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('pointerdown', e => {
        e.preventDefault()
        this._answer(btn.dataset.value, item)
      })
    })

    this._answered = false
  }

  /* ── Answer handling ───────────────────────────────────────── */
  _answer(selected, item) {
    if (this._answered) return
    this._answered = true

    const correct      = selected === item.answer
    const maxPts       = item.points ?? 10
    const penaltyRatio = this.activity.scoring?.penaltyRatio ?? 0
    const earnedPoints = correct ? maxPts : -(maxPts * penaltyRatio)

    this._results.push({
      id:           item.id,
      question:     item.question,
      options:      item.options,
      given:        selected,
      expected:     item.answer,
      correct,
      earnedPoints,
      maxPoints: maxPts
    })

    this.container.querySelectorAll('.quiz-option').forEach(btn => {
      if (btn.dataset.value === item.answer) btn.classList.add('correct')
      else if (btn.dataset.value === selected) btn.classList.add('wrong')
      btn.disabled = true
    })

    if (correct) {
      Events.emit('answer:correct', { item, points: earnedPoints })
    } else {
      Events.emit('answer:wrong', { item, selected })
    }
    if (earnedPoints !== 0) this._onScore?.(earnedPoints)

    this._feedbackTimeout = setTimeout(() => {
      this._currentIndex++
      this._render()
    }, FEEDBACK_DELAY)
  }

  _complete() {
    Events.emit('template:complete', {})
    this._onComplete?.()
  }

  /* ── Keyboard support (1-4 or A-D) ────────────────────────── */
  onKey(e) {
    if (this._answered) return
    const map = { '1':'A','2':'B','3':'C','4':'D', 'a':'A','b':'B','c':'C','d':'D' }
    const letter = map[e.key]
    if (!letter) return
    const idx = LETTERS.indexOf(letter)
    const btn = this.container?.querySelectorAll('.quiz-option')[idx]
    btn?.dispatchEvent(new Event('pointerdown'))
  }
}

/* ── Helpers ─────────────────────────────────────────────────── */
function _shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
