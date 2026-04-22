import Router from '../core/router.js'

const TEMPLATES = [
  { id: 'quiz',           icon: '❓', name: 'Quiz',                 desc: 'Pregunta con 4 opciones de respuesta',          ready: true  },
  { id: 'textCorrection', icon: '✍️', name: 'Corrección de textos', desc: 'Pon las tildes con el stylus sobre el texto',   ready: true  },
  { id: 'match',          icon: '🔗', name: 'Relacionar',           desc: 'Conecta conceptos de dos columnas',             ready: false },
  { id: 'sort',           icon: '📂', name: 'Clasificar',           desc: 'Agrupa elementos en categorías',                ready: false }
]

export function renderTemplateSelector(container) {
  container.className = 'view-selector d-flex flex-column'

  container.innerHTML = `
    <div class="selector-header">
      <button class="btn btn-outline-secondary rounded-pill" id="btn-back">← Volver</button>
      <div>
        <h1 class="fs-3 fw-bold mb-0">Nueva actividad</h1>
        <p class="section-hint mt-1">Elige el tipo de actividad</p>
      </div>
    </div>

    <div class="template-grid fade-in">
      ${TEMPLATES.map(t => `
        <button
          class="template-card card text-center ${t.ready ? '' : 'template-card--soon'}"
          data-id="${t.id}"
          ${t.ready ? '' : 'disabled'}
        >
          <div class="card-body d-flex flex-column align-items-center gap-3 py-4">
            <span class="tpl-icon">${t.icon}</span>
            <span class="tpl-name">${t.name}</span>
            <span class="tpl-desc">${t.desc}</span>
          </div>
          ${!t.ready ? '<span class="tpl-soon-badge">Próximamente</span>' : ''}
        </button>
      `).join('')}
    </div>
  `

  document.getElementById('btn-back').addEventListener('click', () => Router.navigate('/home'))

  container.querySelectorAll('.template-card:not([disabled])').forEach(card => {
    card.addEventListener('click', () => Router.navigate(`/editor/${card.dataset.id}`))
  })
}
