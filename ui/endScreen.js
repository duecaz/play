export function renderEndScreen(container, { score, total, maxScore, pct, timeUsed } = {}) {
  const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'
  const msg   = pct >= 80 ? '¡Excelente trabajo!'
              : pct >= 50 ? '¡Bien hecho!'
              : '¡Sigue practicando!'

  container.innerHTML = `
    <div class="end-screen fade-in">
      <div class="text-center" style="max-width:720px; padding:4rem;">
        <div class="end-emoji mb-3">${emoji}</div>
        <h1 class="end-title mb-4">${msg}</h1>

        <div class="end-score-ring mb-4">
          <span class="end-score-pct">${pct}%</span>
          <span class="end-score-label">Puntuación</span>
        </div>

        <div class="d-flex gap-5 justify-content-center">
          <div class="d-flex flex-column align-items-center gap-1">
            <span class="stat-value">${score}</span>
            <span class="stat-label">Puntos</span>
          </div>
          ${total > 0 ? `
          <div class="d-flex flex-column align-items-center gap-1">
            <span class="stat-value">${total}</span>
            <span class="stat-label">Preguntas</span>
          </div>` : ''}
          ${timeUsed > 0 ? `
          <div class="d-flex flex-column align-items-center gap-1">
            <span class="stat-value">${timeUsed}s</span>
            <span class="stat-label">Tiempo</span>
          </div>` : ''}
        </div>
      </div>
    </div>
  `
}
