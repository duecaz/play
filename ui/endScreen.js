export function renderEndScreen(container, { score, total, maxScore, pct, timeUsed, onRestart, onHome } = {}) {
  const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'
  const msg   = pct >= 80 ? '¡Excelente trabajo!'
              : pct >= 50 ? '¡Bien hecho!'
              : '¡Sigue practicando!'

  container.innerHTML = `
    <div class="end-screen fade-in">
      <div class="end-content">
        <div class="end-emoji">${emoji}</div>
        <h1 class="end-title">${msg}</h1>

        <div class="end-score-ring">
          <span class="end-score-pct">${pct}%</span>
          <span class="end-score-label">Puntuación</span>
        </div>

        <div class="end-stats">
          <div class="end-stat">
            <span class="stat-value">${score}</span>
            <span class="stat-label">Puntos</span>
          </div>
          <div class="end-stat">
            <span class="stat-value">${total}</span>
            <span class="stat-label">Preguntas</span>
          </div>
          ${timeUsed > 0 ? `
          <div class="end-stat">
            <span class="stat-value">${timeUsed}s</span>
            <span class="stat-label">Tiempo</span>
          </div>` : ''}
        </div>

        <div class="end-actions">
          <button class="btn-restart" id="btn-restart">↺ Jugar de nuevo</button>
          ${onHome ? `<button class="btn-home" id="btn-home">🏠 Inicio</button>` : ''}
        </div>
      </div>
    </div>
  `

  document.getElementById('btn-restart')?.addEventListener('click', onRestart)
  document.getElementById('btn-home')?.addEventListener('click', onHome)
}
