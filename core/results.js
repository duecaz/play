const KEY = 'eduplay_results'
const MAX  = 200

export const Results = {
  list() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
    catch { return [] }
  },

  listForActivity(activityId) {
    return this.list().filter(r => r.activityId === activityId)
  },

  save(result) {
    try {
      const all = this.list()
      all.push(result)
      if (all.length > MAX) all.splice(0, all.length - MAX)
      localStorage.setItem(KEY, JSON.stringify(all))
    } catch (e) {
      console.error('[Results] save failed:', e)
    }
    return result
  },

  uid() {
    return 'res-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
  }
}
