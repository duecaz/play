const Router = {
  _routes:  [],
  _onLeave: null,

  on(pattern, handler) {
    this._routes.push({ pattern, handler })
  },

  /* Register a one-time cleanup for the current view */
  onLeave(fn) { this._onLeave = fn },

  navigate(path) {
    window.location.hash = path
  },

  init() {
    window.addEventListener('hashchange', () => this._resolve())
    this._resolve()
  },

  _resolve() {
    /* run cleanup from previous view */
    if (this._onLeave) { this._onLeave(); this._onLeave = null }

    const path = window.location.hash.replace('#', '') || '/home'

    for (const { pattern, handler } of this._routes) {
      const params = this._match(pattern, path)
      if (params !== null) { handler(params); return }
    }

    /* no match → home */
    this.navigate('/home')
  },

  _match(pattern, path) {
    const pp = pattern.split('/').filter(Boolean)
    const rp = path.split('/').filter(Boolean)
    if (pp.length !== rp.length) return null
    const params = {}
    for (let i = 0; i < pp.length; i++) {
      if (pp[i].startsWith(':')) params[pp[i].slice(1)] = rp[i]
      else if (pp[i] !== rp[i]) return null
    }
    return params
  }
}

export default Router
