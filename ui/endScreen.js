export function renderEndScreen(container, {
  score, scoreAuto, total, maxScore, pct, timeUsed,
  overrides = [], onReplay
} = {}) {
  const ringColor = pct >= 80 ? 'var(--ep-correct)' : pct >= 50 ? '#f39c12' : 'var(--ep-wrong)'
  const msg = pct >= 80 ? '¡Excelente trabajo!' : pct >= 50 ? '¡Bien hecho!' : '¡Sigue practicando!'

  const scoreDiff     = score - (scoreAuto ?? score)
  const overrideBadge = overrides.length
    ? `<p class="end-override-note">Puntuación ajustada por el docente
         ${scoreDiff !== 0 ? `<span class="end-override-diff">${scoreDiff > 0 ? '+' : ''}${scoreDiff} pts</span>` : ''}
       </p>`
    : ''

  container.innerHTML = `
    <div class="end-screen fade-in">
      <div class="confetti-wrap" id="confetti-wrap"></div>
      <div class="end-card">
        <h1 class="end-title">${msg}</h1>

        <div class="end-score-ring" style="border-color:${ringColor}">
          <span class="end-score-pct">${pct}%</span>
          <span class="end-score-label">Puntuación</span>
        </div>

        ${overrideBadge}

        <div class="end-stats">
          <div class="end-stat">
            <span class="stat-value">${score}</span>
            <span class="stat-label">Puntos</span>
          </div>
          ${total > 0 ? `
          <div class="end-stat">
            <span class="stat-value">${total}</span>
            <span class="stat-label">Zonas</span>
          </div>` : ''}
          ${timeUsed > 0 ? `
          <div class="end-stat">
            <span class="stat-value">${timeUsed}s</span>
            <span class="stat-label">Tiempo</span>
          </div>` : ''}
        </div>

        ${onReplay ? `<button class="end-replay-btn" id="btn-replay">↺ Jugar de nuevo</button>` : ''}
      </div>
    </div>
  `

  if (onReplay) document.getElementById('btn-replay').addEventListener('click', onReplay)
  if (pct >= 50) _spawnConfetti(document.getElementById('confetti-wrap'))
}

function _spawnConfetti(wrap) {
  if (!wrap) return
  const colors = ['#f39c12', '#6c5ce7', '#00b894', '#e17055', '#0984e3', '#fd79a8', '#fdcb6e']
  const frag   = document.createDocumentFragment()
  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div')
    el.className = 'confetti-piece'
    el.style.cssText = [
      `left:${Math.random() * 100}%`,
      `background:${colors[i % colors.length]}`,
      `animation-delay:${(Math.random() * 0.7).toFixed(2)}s`,
      `animation-duration:${(0.9 + Math.random() * 0.8).toFixed(2)}s`,
      `width:${4 + Math.round(Math.random() * 5)}px`,
      `height:${8 + Math.round(Math.random() * 7)}px`,
      `transform:rotate(${Math.round(Math.random() * 360)}deg)`,
    ].join(';')
    frag.appendChild(el)
  }
  wrap.appendChild(frag)
}
