export function renderStartScreen(container, activity, { onStart } = {}) {
  const { title, subtitle, content, config } = activity
  const total = content.items?.length ?? null

  container.innerHTML = `
    <div class="start-screen fade-in">
      <div class="start-content">
        <div class="start-badge">Actividad</div>
        <h1 class="start-title">${_esc(title)}</h1>
        ${subtitle ? `<p class="start-subtitle">${_esc(subtitle)}</p>` : ''}
        <div class="start-meta">
          ${total !== null ? `<span>${total} pregunta${total !== 1 ? 's' : ''}</span>` : ''}
          ${config.timer ? `<span>${config.timer} segundos</span>` : ''}
        </div>
        <button class="btn-start" id="btn-start">▶ Comenzar</button>
      </div>
    </div>
  `

  document.getElementById('btn-start').addEventListener('click', onStart)
}

function _esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
