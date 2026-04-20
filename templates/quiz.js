import { BaseTemplate } from './base.js'
import Events           from '../core/events.js'

const LETTERS = ['A', 'B', 'C', 'D']

export class QuizTemplate extends BaseTemplate {
  static requiresTools = []

  constructor() {
    super()
    this._items           = []
    this._currentIndex    = 0
    this._answered        = false
    this._feedbackTimeout = null
  }

  init(activity, container, callbacks) {
    super.init(activity, container, callbacks)
    this._items = [...activity.content.items]
    if (activity.config.randomize) _shuffle(this._items)
  }

  start() {
    this._currentIndex = 0
    this._answered     = false
    this._render()
  }

  pause()  { /* timer handled by Player; DOM stays frozen */ }
  resume() { /* DOM already rendered, nothing to do */ }

  reset() {
    clearTimeout(this._feedbackTimeout)
    this._currentIndex = 0
    this._answered     = false
    this._items = [...this.activity.content.items]
    if (this.activity.config.randomize) _shuffle(this._items)
  }

  destroy() {
    clearTimeout(this._feedbackTimeout)
    super.destroy()
  }

  /* ── Rendering ─────────────────────────────────────────── */
  _render() {
    const item = this._items[this._currentIndex]
    if (!item) { this._complete(); return }

    const options = [...item.options]
    if (this.activity.config.shuffleOptions) _shuffle(options)

    this.container.innerHTML = `
      <div class="quiz-wrapper fade-in">

        <div class="quiz-progress">
          ${this._currentIndex + 1} / ${this._items.length}
        </div>

        <div class="quiz-question">
          ${item.image ? `<img class="quiz-image" src="${item.image}" alt="">` : ''}
          <p>${_esc(item.question)}</p>
        </div>

        <div class="quiz-options">
          ${options.map((opt, i) => `
            <button class="quiz-option" data-value="${_esc(opt)}">
              <span class="option-letter">${LETTERS[i]}</span>
              <span class="option-text">${_esc(opt)}</span>
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

  /* ── Answer handling ───────────────────────────────────── */
  _answer(selected, item) {
    if (this._answered) return
    this._answered = true

    const correct = selected === item.answer
    const points  = correct ? (item.points ?? 10) : 0

    this.container.querySelectorAll('.quiz-option').forEach(btn => {
      if (btn.dataset.value === item.answer) btn.classList.add('correct')
      else if (btn.dataset.value === selected) btn.classList.add('wrong')
      btn.disabled = true
    })

    if (correct) {
      Events.emit('answer:correct', { item, points })
      this._onScore?.(points)
    } else {
      Events.emit('answer:wrong', { item, selected })
    }

    this._feedbackTimeout = setTimeout(() => {
      this._currentIndex++
      this._render()
    }, 1600)
  }

  _complete() {
    Events.emit('template:complete', {})
    this._onComplete?.()
  }

  /* ── Keyboard support (1-4 or A-D) ────────────────────── */
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

/* ── Helpers ─────────────────────────────────────────────── */
function _shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function _esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
