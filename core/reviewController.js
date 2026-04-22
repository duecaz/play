import { esc } from './html.js'

/*
 * ReviewController — manages the REVIEW phase between game end and final summary.
 *
 * Strategies:
 *   itemList     — full-width list of answered questions (quiz). Template DOM discarded.
 *   frozenCanvas — template DOM stays visible, lateral panel added on the right.
 *   aggregate    — no per-item review; panel shows aggregate score only.
 */

export const ReviewController = {
  _template:  null,
  _activity:  null,
  _data:      null,
  _mainEl:    null,
  _reviewEl:  null,
  _overrides:      {},   // itemId → { correct: bool }
  _onEnd:          null,
  _onScoreChange:  null,

  /* ── Public API ─────────────────────────────────────────────── */

  start(template, activity, mainEl, reviewEl, options = {}) {
    this._template  = template
    this._activity  = activity
    this._mainEl    = mainEl
    this._reviewEl  = reviewEl
    this._overrides     = {}
    this._onEnd         = options.onEnd         || null
    this._onScoreChange = options.onScoreChange || null

    template.freeze()
    this._data = template.getReviewData()

    const strategy = this._data.strategy
    if (strategy === 'frozenCanvas') this._startFrozenCanvas()
    else if (strategy === 'itemList') this._startItemList()
    else this._startAggregate()
  },

  override(itemId, correct) {
    this._overrides[itemId] = { correct }
    this._refresh()
  },

  end() {
    const scoreFinal = this._computeScore()
    const overrides  = Object.entries(this._overrides)
      .map(([itemId, o]) => ({ itemId, correct: o.correct }))
    this.cleanup()
    this._onEnd?.({ scoreFinal, scoreAuto: this._data?.score ?? 0, overrides })
  },

  cleanup() {
    if (this._reviewEl) {
      this._reviewEl.innerHTML = ''
      this._reviewEl.classList.remove('active')
    }
    const stage = this._mainEl?.parentElement
    stage?.classList.remove('review-mode--list')
    this._template      = null
    this._data          = null
    this._overrides     = {}
    this._onEnd         = null
    this._onScoreChange = null
  },

  /* ── Score computation ───────────────────────────────────────── */

  _computeScore() {
    if (!this._data) return 0
    const penaltyRatio = this._activity?.scoring?.penaltyRatio ?? 0
    return this._data.items.reduce((sum, item) => {
      const ov = this._overrides[item.id]
      if (ov !== undefined) {
        return sum + (ov.correct ? item.maxPoints : -(item.maxPoints * penaltyRatio))
      }
      return sum + (item.earnedPoints ?? (item.correct ? item.maxPoints : 0))
    }, 0)
  },

  _correctCount() {
    if (!this._data) return 0
    return this._data.items.filter(item => {
      const ov = this._overrides[item.id]
      return ov !== undefined ? ov.correct : item.correct
    }).length
  },

  /* ── frozenCanvas strategy ───────────────────────────────────── */

  _startFrozenCanvas() {
    /* corr-wrapper is size-locked in freeze(), so panel can share flex space safely */
    this._reviewEl.classList.add('active')
    this._renderFrozenPanel()
  },

  _renderFrozenPanel() {
    const data = this._data

    this._reviewEl.innerHTML = `
      <div class="rv-panel">
        <div class="rv-header">
          <span class="rv-badge-label">Revisión</span>
        </div>

        <div class="rv-items">
          ${data.items.map(item => {
            const ov      = this._overrides[item.id]
            const correct = ov !== undefined ? ov.correct : item.correct
            const changed = ov !== undefined
            return `
              <div class="rv-item ${correct ? 'rv-item--ok' : 'rv-item--miss'}${changed ? ' rv-item--changed' : ''}"
                   data-id="${esc(item.id)}">
                <span class="rv-item-icon">${correct ? '✓' : '✗'}</span>
                <span class="rv-item-label">${esc(item.label ?? item.id)}</span>
                <button class="rv-override" data-id="${esc(item.id)}"
                        data-correct="${correct ? '1' : '0'}"
                        title="${correct ? 'Marcar como incorrecto' : 'Marcar como correcto'}">
                  ${correct ? '✗' : '✓'}
                </button>
              </div>
            `
          }).join('')}
        </div>

        <div class="rv-footer">
          <span class="rv-summary">${this._correctCount()} / ${data.items.length} correctas</span>
          <button class="rv-finalize">Finalizar ▶</button>
        </div>
      </div>
    `

    this._bindPanel(this._reviewEl)
  },

  /* ── itemList strategy ───────────────────────────────────────── */

  _startItemList() {
    const stage = this._mainEl.parentElement
    stage.classList.add('review-mode--list')
    this._renderItemListPanel()
  },

  _renderItemListPanel() {
    const data      = this._data
    const scrollTop = this._mainEl.querySelector('.rv-list-items')?.scrollTop ?? 0

    this._mainEl.innerHTML = `
      <div class="rv-list fade-in">
        <div class="rv-list-header">
          <h2 class="rv-list-title">Revisión de respuestas</h2>
        </div>

        <div class="rv-list-items">
          ${data.items.map((item, idx) => {
            const ov          = this._overrides[item.id]
            const correct     = ov !== undefined ? ov.correct : item.correct
            const notAnswered = item.given === null
            const changed     = ov !== undefined
            return `
              <div class="rv-row ${correct ? 'rv-row--ok' : 'rv-row--miss'}${changed ? ' rv-row--changed' : ''}">
                <div class="rv-row-num">${idx + 1}</div>
                <div class="rv-row-body">
                  <p class="rv-row-q">${esc(item.question ?? item.label ?? `Ítem ${idx + 1}`)}</p>
                  <div class="rv-row-answers">
                    <span class="rv-given ${correct ? 'rv-given--ok' : 'rv-given--wrong'}">
                      ${notAnswered
                        ? '<em>Sin responder</em>'
                        : esc(item.given)}
                    </span>
                    ${!correct && !notAnswered
                      ? `<span class="rv-expected">✓ ${esc(item.expected ?? '')}</span>`
                      : ''}
                    ${notAnswered && item.expected
                      ? `<span class="rv-expected">✓ ${esc(item.expected)}</span>`
                      : ''}
                  </div>
                </div>
                <div class="rv-row-actions">
                  <span class="rv-row-icon">${correct ? '✓' : '✗'}</span>
                  <button class="rv-override"
                          data-id="${esc(item.id)}"
                          data-correct="${correct ? '1' : '0'}">
                    ${correct ? 'Marcar ✗' : 'Marcar ✓'}
                  </button>
                </div>
              </div>
            `
          }).join('')}
        </div>

        <div class="rv-list-footer">
          <span class="rv-summary">${this._correctCount()} / ${data.items.length} correctas</span>
          <button class="rv-finalize">Finalizar ▶</button>
        </div>
      </div>
    `

    const listEl = this._mainEl.querySelector('.rv-list-items')
    if (listEl) listEl.scrollTop = scrollTop

    this._bindPanel(this._mainEl)
  },

  /* ── aggregate strategy ─────────────────────────────────────── */

  _startAggregate() {
    const data  = this._data
    const score = this._computeScore()
    this._mainEl.innerHTML = `
      <div class="rv-aggregate fade-in">
        <div class="rv-score">
          <span class="rv-score-val">${score}</span>
          <span class="rv-score-max">/ ${data.maxScore} pts</span>
        </div>
        <button class="rv-finalize">Finalizar ▶</button>
      </div>
    `
    this._bindPanel(this._mainEl)
  },

  /* ── Shared event binding ────────────────────────────────────── */

  _bindPanel(root) {
    root.querySelectorAll('.rv-override').forEach(btn => {
      btn.addEventListener('click', () => {
        const id             = btn.dataset.id
        const currentCorrect = btn.dataset.correct === '1'
        this.override(id, !currentCorrect)
      })
    })
    root.querySelector('.rv-finalize')
      ?.addEventListener('click', () => this.end())
  },

  _refresh() {
    const strategy = this._data?.strategy
    if (strategy === 'frozenCanvas') this._renderFrozenPanel()
    else if (strategy === 'itemList') this._renderItemListPanel()
    else this._startAggregate()
    this._onScoreChange?.(this._computeScore())
  }
}
