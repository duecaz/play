/* Base class — every template must extend this */
export class BaseTemplate {
  /* Declare required tools: ['pen', 'eraser'] — used in Part 2 */
  static requiresTools = []

  constructor() {
    this.activity    = null
    this.container   = null
    this._onComplete = null
    this._onScore    = null
  }

  /* Called by Player before start() */
  init(activity, container, { onComplete, onScore } = {}) {
    this.activity    = activity
    this.container   = container
    this._onComplete = onComplete
    this._onScore    = onScore
  }

  start()   {}
  pause()   {}
  resume()  {}
  reset()   {}

  destroy() {
    if (this.container) this.container.innerHTML = ''
  }

  /* Lifecycle hooks for interactive screens */
  onResize() {}
  onTouch(e) {}
  onKey(e)   {}
}
