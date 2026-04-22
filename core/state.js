import Events from './events.js'

export const STATES = {
  IDLE:    'idle',
  PLAYING: 'playing',
  PAUSED:  'paused',
  REVIEW:  'review',
  END:     'end'
}

const TRANSITIONS = {
  idle:    ['playing'],
  playing: ['paused', 'review'],
  paused:  ['playing', 'review'],
  review:  ['end'],
  end:     ['idle']
}

export const State = {
  current: STATES.IDLE,

  go(next) {
    const allowed = TRANSITIONS[this.current] || []
    if (!allowed.includes(next)) {
      console.warn(`[State] Invalid transition: ${this.current} → ${next}`)
      return false
    }
    const prev = this.current
    this.current = next
    Events.emit('state:change', { from: prev, to: next })
    Events.emit(`state:${next}`,  { from: prev })
    return true
  },

  is(s)  { return this.current === s },

  /* Hard reset — used by teacher "restart" only */
  reset() { this.current = STATES.IDLE }
}
