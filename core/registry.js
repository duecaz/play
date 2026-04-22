/* Template registry — maps name → class + metadata */
const Registry = {
  _map: new Map(),

  register(name, TemplateClass, meta = {}) {
    this._map.set(name, { TemplateClass, meta })
  },

  get(name) {
    const entry = this._map.get(name)
    if (!entry) throw new Error(`[Registry] Template "${name}" not found`)
    return entry.TemplateClass
  },

  getMeta(name) {
    return this._map.get(name)?.meta ?? {}
  },

  list() {
    return [...this._map.entries()].map(([id, { meta }]) => ({ id, ...meta }))
  }
}

export default Registry
