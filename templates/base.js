/* Base class — every template must extend this */
export class BaseTemplate {
  static requiresTools  = []
  static optionsSchema  = []   // [{ key, type, default, label }]
  static reviewOptions  = []   // review-specific knobs
  static reviewStrategy = 'aggregate'  // 'itemList' | 'frozenCanvas' | 'aggregate'

  constructor() {
    this.activity    = null
    this.container   = null
    this._onComplete = null
    this._onScore    = null
  }

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

  /* Called by ReviewController before rendering the review panel */
  freeze() {}

  /* Return structured review data; called after freeze() */
  getReviewData() {
    return { strategy: this.constructor.reviewStrategy, items: [], score: 0, maxScore: 0 }
  }

  /* Optional: re-launch a single item from review (e.g. quiz question) */
  replayItem(_itemId) {}

  onResize() {}
  onTouch(e) {}
  onKey(e)   {}
}
