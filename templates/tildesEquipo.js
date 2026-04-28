import { TildesTemplate } from './tildes.js'

export class TildesEquipoTemplate extends TildesTemplate {
  static skipReview = true
  constructor() {
    super()
    this._rounds        = []
    this._roundCount    = 3
    this._round         = 0
    this._teamTotal     = 0
    this._lastRoundPts  = 0
    this._finalComplete = null
    this._onRoundScore  = null
  }

  init(activity, container, callbacks) {
    this._rounds        = activity.content.rounds
    this._roundCount    = this._rounds.length
    this._finalComplete = callbacks.onComplete ?? null
    this._onRoundScore  = callbacks.onRoundScore ?? null
    this._teamTotal     = 0
    this._lastRoundPts  = 0

    const wrappedCallbacks = {
      ...callbacks,
      onScore:    pts => { this._teamTotal += pts; this._lastRoundPts = pts; callbacks.onScore?.(pts) },
      onComplete: () => this._handleRoundComplete()
    }

    // Normalize presentation so old activities without these fields still behave correctly
    const pres = activity.presentation ?? {}
    const normalizedActivity = {
      ...activity,
      presentation: { skin: 'notebook', scoreMode: 'points', ...pres, teams: true },
      content: { ...this._rounds[0] }
    }
    super.init(normalizedActivity, container, wrappedCallbacks)
  }

  start() {
    this._round = 0
    super.start()
  }

  getReviewData() {
    const data = super.getReviewData()
    // Override totals to reflect all rounds
    return { ...data, score: this._teamTotal, maxScore: this._rounds.reduce((s, r) => s + (r.maxScore ?? 0), 0) }
  }

  /* ── Round transitions ─────────────────────────────────── */
  _handleRoundComplete() {
    this._onRoundScore?.(this._lastRoundPts)

    if (this._round >= this._roundCount - 1) {
      this._finalComplete?.()
      return
    }

    // Replace disabled "Comprobar" button with "Siguiente alumno" button
    const btnCheck = document.getElementById('btn-check')
    if (!btnCheck) return
    const btnNext = document.createElement('button')
    btnNext.className = 'btn btn-success btn-lg btn-corr-check'
    btnNext.innerHTML = `Alumno ${this._round + 2} <i class="bi bi-arrow-right-circle"></i>`
    btnNext.addEventListener('click', () => {
      this._round++
      this._advanceRound()
    })
    btnCheck.replaceWith(btnNext)
  }

  _advanceRound() {
    this._done    = false
    this._strokes = []
    this._zones   = []
    this._checkW  = 0
    this._checkH  = 0
    this.activity = { ...this.activity, content: { ...this._rounds[this._round] } }
    this._unbind()
    this._render()
  }

  /* Show round number in the instruction area */
  _render() {
    super._render()
    // Append round badge to wrapper so teacher can see which student is up
    const wrapper = document.getElementById('corr-wrapper')
    if (wrapper && this._roundCount > 1) {
      const badge = document.createElement('div')
      badge.className = 'round-badge'
      badge.textContent = `Alumno ${this._round + 1} / ${this._roundCount}`
      wrapper.parentElement?.insertBefore(badge, wrapper)
    }
  }
}
