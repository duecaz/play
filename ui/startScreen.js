import { esc } from '../core/html.js'

export function renderStartScreen(container, activity, { onStart } = {}) {
  const { title, subtitle, content, config } = activity
  const total = content.items?.length ?? null

  container.innerHTML = `
    <div class="start-screen fade-in">
      <div class="text-center" style="max-width:820px; padding:4rem;">
        <span class="badge bg-primary text-uppercase fw-bold mb-3 px-3 py-2" style="letter-spacing:.1em">Actividad</span>
        <h1 class="start-title mb-3">${esc(title)}</h1>
        ${subtitle ? `<p class="start-subtitle mb-4">${esc(subtitle)}</p>` : ''}
        <div class="start-meta d-flex gap-4 justify-content-center mb-5">
          ${total !== null ? `<span>${total} pregunta${total !== 1 ? 's' : ''}</span>` : ''}
          ${config.timer ? `<span>${config.timer} segundos</span>` : ''}
        </div>
        <button class="btn btn-primary btn-start" id="btn-start">▶ Comenzar</button>
      </div>
    </div>
  `

  document.getElementById('btn-start').addEventListener('click', onStart)
}
