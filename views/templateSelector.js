import Router from '../core/router.js'

const TEMPLATES = [
  {
    id:   'quiz',
    icon: '❓',
    name: 'Quiz',
    desc: 'Pregunta con 4 opciones de respuesta',
    ready: true
  },
  {
    id:   'detectErrors',
    icon: '🔍',
    name: 'Detectar errores',
    desc: 'Encuentra las palabras incorrectas en un texto',
    ready: false
  },
  {
    id:   'match',
    icon: '🔗',
    name: 'Relacionar',
    desc: 'Conecta conceptos de dos columnas',
    ready: false
  },
  {
    id:   'sort',
    icon: '📂',
    name: 'Clasificar',
    desc: 'Agrupa elementos en categorías',
    ready: false
  }
]

export function renderTemplateSelector(container) {
  container.className = 'view-selector'

  container.innerHTML = `
    <div class="selector-header">
      <button class="btn-back" id="btn-back">← Volver</button>
      <div>
        <h1>Nueva actividad</h1>
        <p class="view-subtitle">Elige el tipo de actividad</p>
      </div>
    </div>

    <div class="template-grid fade-in">
      ${TEMPLATES.map(t => `
        <button
          class="template-card ${t.ready ? '' : 'template-card--soon'}"
          data-id="${t.id}"
          ${t.ready ? '' : 'disabled'}
        >
          <span class="tpl-icon">${t.icon}</span>
          <span class="tpl-name">${t.name}</span>
          <span class="tpl-desc">${t.desc}</span>
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
