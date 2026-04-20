let _timerEl = null
let _scoreEl = null

export function renderHUD(container, activity) {
  const { title, config } = activity

  container.innerHTML = `
    <div class="hud-left">
      <span class="hud-title">${_esc(title)}</span>
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

  _timerEl = document.getElementById('timer-value')
  _scoreEl = document.getElementById('score-value')
}

export function updateTimer(seconds) {
  if (!_timerEl) return
  _timerEl.textContent = seconds
  const hudTimer = document.getElementById('hud-timer')
  hudTimer?.classList.toggle('timer-warning', seconds <= 10 && seconds > 0)
}

export function updateScore(score) {
  if (!_scoreEl) return
  _scoreEl.textContent = score
  _scoreEl.classList.remove('score-bump')
  /* force reflow so animation restarts */
  void _scoreEl.offsetWidth
  _scoreEl.classList.add('score-bump')
}

function _esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
