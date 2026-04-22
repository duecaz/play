import { esc } from '../core/html.js'

export function renderStartScreen(container, activity, { onStart } = {}) {
  const { title, subtitle, content, config } = activity
  const total = content.items?.length ?? null

  container.innerHTML = `
    <div class="start-screen fade-in">
      <div class="start-content">
        <div class="start-badge">Actividad</div>
        <h1 class="start-title">${esc(title)}</h1>
        ${subtitle ? `<p class="start-subtitle">${esc(subtitle)}</p>` : ''}
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

