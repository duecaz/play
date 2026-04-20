/* Central event bus — decouples all modules */
const Events = {
  _listeners: {},

  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = []
    this._listeners[event].push(fn)
    return () => this.off(event, fn)   // returns unsubscribe fn
  },

  off(event, fn) {
    if (!this._listeners[event]) return
    this._listeners[event] = this._listeners[event].filter(f => f !== fn)
  },

  emit(event, data) {
    ;(this._listeners[event] || []).forEach(fn => fn(data))
  },

  clear(event) {
    if (event) delete this._listeners[event]
    else this._listeners = {}
  }
}

export default Events
