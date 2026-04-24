import { esc }   from '../core/html.js'
import Registry from '../core/registry.js'

export function renderStartScreen(container, activity, { onStart } = {}) {
  const { title, subtitle, content, rules } = activity
  const meta   = Registry.getMeta(activity.template)
  const accent = meta.color || '#4a90e2'
  const ico    = meta.icon  || '▶'
  const lbl    = meta.label || ''
  const total  = content.items?.length ?? null
  const timer  = rules?.timer ?? 0

  container.innerHTML = `
    <div class="start-screen fade-in">
      <div class="start-bg" style="background:${accent}"></div>
      <div class="start-card">
        <div class="start-card-band" style="background:${accent}">
          <span class="start-card-icon">${ico}</span>
        </div>
        <div class="start-card-body">
          ${lbl ? `<p class="start-template-label">${esc(lbl)}</p>` : ''}
          <h1 class="start-title">${esc(title)}</h1>
          ${subtitle ? `<p class="start-subtitle">${esc(subtitle)}</p>` : ''}
          <div class="start-meta">
            ${total !== null ? `<span>✍️&nbsp;${total} zona${total !== 1 ? 's' : ''}</span>` : ''}
            ${timer          ? `<span>⏱&nbsp;${timer} s</span>`                              : ''}
          </div>
          <button class="btn-start" id="btn-start" style="background:${accent}">▶ Comenzar</button>
        </div>
      </div>
    </div>
  `

  document.getElementById('btn-start').addEventListener('click', onStart)
}
