/* Template registry — allows plugins / dynamic registration */
const Registry = {
  _map: new Map(),

  register(name, TemplateClass) {
    this._map.set(name, TemplateClass)
  },

  get(name) {
    if (!this._map.has(name)) throw new Error(`[Registry] Template "${name}" not found`)
    return this._map.get(name)
  },

  list() { return [...this._map.keys()] }
}

export default Registry
