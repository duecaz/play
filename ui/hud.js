import { esc } from '../core/html.js'

export class HUD {
  constructor(container) {
    this._container = container
    this._timerEl   = null
    this._scoreEl   = null
  }

  render(activity) {
    const { title, config } = activity
    this._container.innerHTML = `
      <div class="hud-left">
        <span class="hud-title">${esc(title)}</span>
      </div>
      <div class="hud-center">
        ${config.showTimer ? `
          <div class="hud-timer" id="hud-timer">
            <span>⏱</span>
            <span id="timer-value">--</span>
          </div>
        ` : ''}
      </div>
      <div class="hud-right">
        ${config.showScore ? `
          <div class="hud-score">
            <span class="score-label">Puntos</span>
            <span class="score-value" id="score-value">0</span>
          </div>
        ` : ''}
      </div>
    `
    this._timerEl = document.getElementById('timer-value')
    this._scoreEl = document.getElementById('score-value')
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
}
