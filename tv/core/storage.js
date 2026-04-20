const KEY = 'eduplay_activities'

const Store = {
  list() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
    catch { return [] }
  },

  get(id) {
    return this.list().find(a => a.id === id) || null
  },

  save(activity) {
    const all = this.list()
    const idx = all.findIndex(a => a.id === activity.id)
    if (idx >= 0) all[idx] = activity
    else all.push(activity)
    localStorage.setItem(KEY, JSON.stringify(all))
    return activity
  },

  delete(id) {
    localStorage.setItem(KEY, JSON.stringify(this.list().filter(a => a.id !== id)))
  },

  uid() {
    return 'act-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
  },

  /* Load demo activities only on first run */
  seed(activities) {
    if (this.list().length === 0) activities.forEach(a => this.save(a))
  }
}

export default Store
