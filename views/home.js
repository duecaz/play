import Store    from '../core/storage.js'
import Router   from '../core/router.js'
import Registry from '../core/registry.js'
import { esc }  from '../core/html.js'

export function renderHome(container) {
  container.className = 'view-home d-flex flex-column'
  const activities = Store.list()

  container.innerHTML = `
    <div class="home-header">
      <div class="d-flex align-items-center gap-3">
        <span class="logo-mark">▶</span>
        <span class="logo-name">EduPlay</span>
      </div>
      <button class="btn btn-primary" id="btn-new">+ Nueva actividad</button>
    </div>

    <div class="home-body">
      ${activities.length === 0 ? `
        <div class="empty-state d-flex flex-column align-items-center justify-content-center gap-3 text-center fade-in">
          <div class="empty-icon">📋</div>
          <h2 class="fs-3 fw-bold">Sin actividades todavía</h2>
          <p class="text-muted">Crea tu primera actividad interactiva</p>
          <button class="btn btn-primary" id="btn-new-empty">+ Crear actividad</button>
        </div>
      ` : `
        <h2 class="fs-4 fw-bold mb-4">
          Mis actividades
          <span class="badge bg-primary ms-2">${activities.length}</span>
        </h2>
        <div class="activities-grid fade-in">
          ${activities.map(a => activityCard(a)).join('')}
        </div>
      `}
    </div>
  `

  container.querySelector('#btn-new')?.addEventListener('click', () => Router.navigate('/create'))
  container.querySelector('#btn-new-empty')?.addEventListener('click', () => Router.navigate('/create'))

  container.querySelectorAll('.btn-play-card').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); Router.navigate(`/play/${btn.dataset.id}`) })
  })
  container.querySelectorAll('.btn-delete-card').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      if (confirm('¿Eliminar esta actividad?')) { Store.delete(btn.dataset.id); renderHome(container) }
    })
  })
  container.querySelectorAll('.activity-card').forEach(card => {
    card.addEventListener('click', () => Router.navigate(`/play/${card.dataset.id}`))
  })
}

function activityCard(a) {
  const meta  = Registry.getMeta(a.template)
  const label = meta.label || a.template
  const count = a.content?.items?.length || 0
  return `
    <div class="activity-card card" data-id="${a.id}">
      <div class="card-body d-flex flex-column gap-2">
        <div class="d-flex align-items-center justify-content-between">
          <span class="card-template-badge">${label}</span>
          <button class="btn-delete-card btn btn-sm btn-link text-danger p-0"
            data-id="${a.id}" title="Eliminar">✕</button>
        </div>
        <h3 class="card-title">${esc(a.title)}</h3>
        ${a.subtitle ? `<p class="card-subtitle">${esc(a.subtitle)}</p>` : ''}
        <div class="card-meta d-flex gap-3 mt-auto pt-2 border-top">
          <span>📝 ${count} pregunta${count !== 1 ? 's' : ''}</span>
          ${a.config?.timer ? `<span>⏱ ${a.config.timer}s</span>` : ''}
        </div>
        <button class="btn-play-card btn btn-primary w-100" data-id="${a.id}">▶ Jugar</button>
      </div>
    </div>
  `
}
