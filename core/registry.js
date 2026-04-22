/* Template registry — maps name → class + metadata + content model */
const Registry = {
  _map: new Map(),

  register(name, TemplateClass, meta = {}, model = null) {
    this._map.set(name, { TemplateClass, meta, model })
  },

  get(name) {
    const entry = this._map.get(name)
    if (!entry) throw new Error(`[Registry] Template "${name}" not found`)
    return entry.TemplateClass
  },

  getMeta(name) {
    return this._map.get(name)?.meta ?? {}
  },

  getModel(name) {
    return this._map.get(name)?.model ?? null
  },

  list() {
    return [...this._map.entries()].map(([id, { meta }]) => ({ id, ...meta }))
  }
}

export default Registry
