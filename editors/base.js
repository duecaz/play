import Store    from '../core/storage.js'
import Router   from '../core/router.js'
import Registry from '../core/registry.js'

export class BaseEditor {
  constructor(container) {
    this.container = container
    this._errorEl  = null
  }

  get title()     { return '' }
  get subtitle()  { return '' }
  renderBody()    { return '' }
  validate()      { return [] }
  buildActivity() { return null }
  _bindBody()     {}

  render() {
    this.container.className = 'view-editor'
    this.container.innerHTML = `
      <div class="editor-header">
        <button class="btn btn-outline-secondary rounded-pill" id="btn-back">← Volver</button>
        <div>
          <h1 class="fs-4 fw-bold mb-0">${this.title}</h1>
          <p class="section-hint mt-1">${this.subtitle}</p>
        </div>
        <button class="btn btn-primary" id="btn-save">Crear actividad ▶</button>
      </div>
      <div class="editor-body">
        ${this.renderBody()}
        <div id="editor-error" class="editor-error hidden"></div>
      </div>
    `
    this._errorEl = document.getElementById('editor-error')
    document.getElementById('btn-back').addEventListener('click', () => Router.navigate('/create'))
    document.getElementById('btn-save').addEventListener('click', () => this._save())
    this._bindBody()
  }

  _showErrors(errors) {
    this._errorEl.innerHTML = errors.map(e => `<p>⚠ ${e}</p>`).join('')
    this._errorEl.classList.remove('hidden')
    this._errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  _save() {
    const errors = this.validate()
    if (errors.length) { this._showErrors(errors); return }
    this._errorEl.classList.add('hidden')
    const activity = this.buildActivity()
    const model = Registry.getModel(activity.template)
    if (model) activity.schemaVersion = model.version
    Store.save(activity)
    Router.navigate(`/play/${activity.id}`)
  }
}
