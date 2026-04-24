import Store    from '../core/storage.js'
import Router   from '../core/router.js'
import Registry from '../core/registry.js'
import { esc }  from '../core/html.js'

export function renderHome(container) {
  container.className = 'view-home'
  const activities = Store.list()

  container.innerHTML = `
    <div class="home-header">
      <div class="d-flex align-items-center gap-3">
        <span class="logo-mark">▶</span>
        <span class="logo-name">EduPlay</span>
      </div>
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-sm btn-outline-secondary" id="btn-clearcache" title="Limpiar caché y recargar">⟳ Caché</button>
        <button class="btn btn-sm btn-outline-secondary" id="btn-calibrate" title="Calibrar lápiz IR">⚙ Calibrar</button>
        <button class="btn btn-primary" id="btn-new">+ Nueva actividad</button>
      </div>
    </div>

    <div class="home-body">
      ${activities.length === 0 ? `
        <div class="empty-state fade-in">
          <div class="empty-icon">📋</div>
          <h2>Sin actividades todavía</h2>
          <p class="text-muted">Crea tu primera actividad interactiva</p>
          <button class="btn btn-primary btn-lg mt-2" id="btn-new-empty">+ Crear actividad</button>
        </div>
      ` : `
        <h2 class="home-section-title">
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
  container.querySelector('#btn-calibrate')?.addEventListener('click', () => Router.navigate('/calibrate'))
  container.querySelector('#btn-clearcache')?.addEventListener('click', () => {
    localStorage.clear(); sessionStorage.clear(); location.reload(true)
  })

  container.querySelectorAll('.btn-play-card').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); Router.navigate(`/play/${btn.dataset.id}`) })
  })
  container.querySelectorAll('.btn-start-card').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation()
      try { await document.documentElement.requestFullscreen() } catch {}
      Router.navigate(`/play/${btn.dataset.id}`)
    })
  })
  container.querySelectorAll('.btn-edit-card').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      Router.navigate(`/editor/${btn.dataset.template}/${btn.dataset.id}`)
    })
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
  const color = meta.color || '#4a90e2'
  const icon  = meta.icon  || '▶'
  const label = meta.label || a.template
  const count = a.content?.items?.length || 0
  const timer = a.rules?.timer ?? a.config?.timer

  return `
    <div class="activity-card" data-id="${a.id}">
      <div class="card-thumb" style="background:${color}">
        <span class="card-thumb-icon">${icon}</span>
      </div>
      <div class="card-body-inner">
        <div class="card-top-row">
          <span class="card-template-label" style="color:${color}">${label}</span>
          <div class="card-actions">
            <button class="btn-edit-card card-action-btn"
              data-id="${a.id}" data-template="${a.template}" title="Editar">✏️</button>
            <button class="btn-delete-card card-action-btn text-danger"
              data-id="${a.id}" title="Eliminar">✕</button>
          </div>
        </div>
        <h3 class="card-title">${esc(a.title)}</h3>
        ${a.subtitle ? `<p class="card-subtitle">${esc(a.subtitle)}</p>` : ''}
        <div class="card-meta">
          ${count ? `<span>📝 ${count} zona${count !== 1 ? 's' : ''}</span>` : ''}
          ${timer    ? `<span>⏱ ${timer}s</span>` : ''}
        </div>
        <div class="btn-group w-100 mt-auto pt-3" role="group">
          <button class="btn-play-card btn btn-primary" data-id="${a.id}">▶ Jugar</button>
          <button class="btn-start-card btn btn-outline-primary" data-id="${a.id}">Empezar</button>
        </div>
      </div>
    </div>
  `
}
