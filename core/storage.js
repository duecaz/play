const KEY = 'eduplay_activities'

const Store = {
  list() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]').map(_migrate) }
    catch { return [] }
  },

  get(id) {
    return this.list().find(a => a.id === id) || null
  },

  save(activity) {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '[]')
      const idx = raw.findIndex(a => a.id === activity.id)
      if (idx >= 0) raw[idx] = activity
      else raw.push(activity)
      localStorage.setItem(KEY, JSON.stringify(raw))
    } catch (e) {
      console.error('[Store] save failed:', e)
    }
    return activity
  },

  delete(id) {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '[]')
      localStorage.setItem(KEY, JSON.stringify(raw.filter(a => a.id !== id)))
    } catch (e) {
      console.error('[Store] delete failed:', e)
    }
  },

  uid() {
    return 'act-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
  },

  seed(activities) {
    if (this.list().length === 0) activities.forEach(a => this.save(a))
  }
}

/* Migrate v1 (flat config) → v2 (namespaced) on read */
function _migrate(activity) {
  if ((activity.schemaVersion ?? 1) >= 2) return activity
  const c = activity.config || {}
  return {
    id:            activity.id,
    title:         activity.title,
    subtitle:      activity.subtitle,
    template:      activity.template,
    schemaVersion: 2,
    content:       activity.content,
    rules: {
      timer:           c.timer          ?? 0,
      randomize:       c.randomize      ?? false,
      shuffleOptions:  c.shuffleOptions ?? true,
      templateOptions: {}
    },
    scoring: {
      mode:             'perItem',
      pointsPerCorrect: 10,
      pointsPerWrong:   0,
      maxScore:         null
    },
    review: {
      allowOverride:        true,
      showCorrectAnswer:    true,
      autoAdvanceToSummary: false
    },
    presentation: {
      skin:      c.skin      ?? 'default',
      layout:    c.layout    ?? 'center',
      sound:     c.sound     ?? false,
      showTimer: c.showTimer ?? true,
      showScore: c.showScore ?? true,
      teams:     c.teams     ?? false
    }
  }
}

export default Store
