import { esc } from '../core/html.js'

export class HUD {
  constructor(container) {
    this._container  = container
    this._timerEl    = null
    this._scoreEl    = null
    this._fsBtn      = null
    this._onFsChange = null
  }

  render(activity) {
    const { title, presentation } = activity
    this._container.innerHTML = `
      <div class="hud-left">
        <span class="hud-title">${esc(title)}</span>
      </div>
      <div class="hud-center">
        ${presentation.showTimer ? `
          <div class="hud-timer" id="hud-timer">
            <span>⏱</span>
            <span id="timer-value">--</span>
          </div>
        ` : ''}
      </div>
      <div class="hud-right">
        ${presentation.showScore ? `
          <div class="hud-score">
            <span class="score-label">Puntos</span>
            <span class="score-value" id="score-value">0</span>
          </div>
        ` : ''}
        <button class="ctrl-btn hud-fs-btn" id="hud-fs" title="Pantalla completa">
          <i class="bi bi-fullscreen"></i>
        </button>
      </div>
    `
    this._timerEl = document.getElementById('timer-value')
    this._scoreEl = document.getElementById('score-value')
    this._fsBtn   = document.getElementById('hud-fs')
    this._fsBtn.addEventListener('click', () => this._toggleFs())

    if (!this._onFsChange) {
      this._onFsChange = () => this._syncFs()
      document.addEventListener('fullscreenchange', this._onFsChange)
    }
    this._syncFs()
  }

  destroy() {
    if (this._onFsChange) {
      document.removeEventListener('fullscreenchange', this._onFsChange)
      this._onFsChange = null
    }
  }

  setTimer(seconds) {
    if (!this._timerEl) return
    this._timerEl.textContent = seconds
    document.getElementById('hud-timer')
      ?.classList.toggle('timer-warning', seconds <= 10 && seconds > 0)
  }

  setScore(score) {
    if (!this._scoreEl) return
    this._scoreEl.textContent = score
    this._scoreEl.classList.remove('score-bump')
    void this._scoreEl.offsetWidth
    this._scoreEl.classList.add('score-bump')
  }

  /* ── Private ─────────────────────────────────────────────── */
  _toggleFs() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {})
    else document.exitFullscreen().catch(() => {})
  }

  _syncFs() {
    const on = !!document.fullscreenElement
    if (this._fsBtn) {
      this._fsBtn.innerHTML = on
        ? '<i class="bi bi-fullscreen-exit"></i>'
        : '<i class="bi bi-fullscreen"></i>'
      this._fsBtn.title = on ? 'Salir de pantalla completa' : 'Pantalla completa'
    }
    document.getElementById('player-container')
      ?.classList.toggle('fs-mode', on)
  }
}
