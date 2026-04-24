/**
 * pen-detector.js v2.1 — IR touchscreen pen detection
 * Events: pendown(evt), penmove(evt), penup()
 * evt = { x, y, tool, pressure, velocity, metric, pointCount,
 *         radiusX, radiusY, radiusMag, bboxW, bboxH, bboxArea }
 * tool = 'penThin' | 'penThick' | 'eraser' | 'palm' | 'none'
 *
 * Options:
 *   element    — required DOM element
 *   thresholds — per-key overrides (merged over sessionStorage → DEFAULTS)
 *   smooth     — { xy: 0..1, pressure: 0..1 } (default xy=0.2, pressure=0.6)
 *
 * Thresholds are loaded from sessionStorage key 'ep-pen-thresholds' at
 * construction time so the calibration screen can persist tuned values.
 */

export const VERSION    = '2.1'
export const STORAGE_KEY = 'ep-pen-thresholds'

const DEFAULTS = {
  penThin:  { min: 0,    max: 2.01 },
  penThick: { min: 2.01, max: 3.0  },
  eraser:   { min: 10.1, max: 100  },   // palm contact = large radius
  palm:     { minPoints: 3         },
  // 3.0–10.0 = finger → 'none'
}

function _loadStored() {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null') } catch { return null }
}

export class PenDetector {
  constructor({ element, thresholds, smooth = {} } = {}) {
    if (!element) throw new Error('PenDetector: element required')
    this._el  = element
    this._ev  = {}
    this._b   = {}
    this._strokeTool = null
    this._trackId    = null
    this._smXY = Math.max(0, Math.min(0.95, smooth.xy       ?? 0.2))
    this._smP  = Math.max(0, Math.min(0.95, smooth.pressure ?? 0.6))
    this._sPos   = null
    this._velPos = null
    this._sP     = 0.5

    // Merge priority: DEFAULTS → sessionStorage → constructor argument (per-key)
    const stored = _loadStored()
    this._thr = {
      penThin:  Object.assign({}, DEFAULTS.penThin,  stored?.penThin,  thresholds?.penThin),
      penThick: Object.assign({}, DEFAULTS.penThick, stored?.penThick, thresholds?.penThick),
      eraser:   Object.assign({}, DEFAULTS.eraser,   stored?.eraser,   thresholds?.eraser),
      palm:     Object.assign({}, DEFAULTS.palm,     stored?.palm,     thresholds?.palm),
    }

    this._el.style.touchAction = 'none'
    this._init()
  }

  // ── event emitter ────────────────────────────────────────────────────────
  on(e, fn)  { (this._ev[e] = this._ev[e] || []).push(fn); return this }
  off(e, fn) { if (this._ev[e]) this._ev[e] = this._ev[e].filter(h => h !== fn); return this }
  _emit(e, d) { (this._ev[e] || []).slice().forEach(fn => fn(d)) }

  // ── touch listeners ───────────────────────────────────────────────────────
  _init() {
    const o = { passive: false }
    this._b.ts = e => { e.preventDefault(); this._handle(e) }
    this._b.tm = e => { e.preventDefault(); this._handle(e) }
    this._b.te = e => {
      e.preventDefault()
      const trackedLifted = this._trackId !== null &&
        Array.from(e.changedTouches).some(t => t.identifier === this._trackId)
      if (!e.touches.length || trackedLifted) {
        this._strokeTool = null; this._trackId = null
        this._sPos = null; this._velPos = null; this._sP = 0.5
        this._emit('penup', {})
      }
    }
    this._el.addEventListener('touchstart',  this._b.ts, o)
    this._el.addEventListener('touchmove',   this._b.tm, o)
    this._el.addEventListener('touchend',    this._b.te, o)
    this._el.addEventListener('touchcancel', this._b.te, o)
  }

  _handle(e) {
    const ts   = e.touches
    if (!ts.length) return
    const rect = this._el.getBoundingClientRect()

    let rSum = 0
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const t of ts) {
      rSum += ((t.radiusX || 0) + (t.radiusY || 0)) / 2
      const tx = t.clientX - rect.left, ty = t.clientY - rect.top
      if (tx < minX) minX = tx; if (tx > maxX) maxX = tx
      if (ty < minY) minY = ty; if (ty > maxY) maxY = ty
    }
    const n      = ts.length
    const bboxW  = maxX - minX, bboxH = maxY - minY
    const metric = rSum / n

    const isFirst = e.type === 'touchstart' && this._strokeTool === null
    if (isFirst) {
      this._strokeTool = this._classify(metric, n)
      this._trackId    = ts[0].identifier
      this._sPos = null; this._velPos = null; this._sP = 0.5
    }

    const tracked = Array.from(ts).find(t => t.identifier === this._trackId) || ts[0]
    const rx = tracked.radiusX || 0, ry = tracked.radiusY || 0
    const rawX = tracked.clientX - rect.left, rawY = tracked.clientY - rect.top
    const { x, y }              = this._smoothXY(rawX, rawY)
    const { pressure, velocity } = this._velPressure(rawX, rawY)

    this._emit(isFirst ? 'pendown' : 'penmove', {
      x, y,
      tool: this._strokeTool || 'none',
      pressure, velocity, metric,
      pointCount: n,
      radiusX: rx, radiusY: ry,
      radiusMag: Math.sqrt(rx * rx + ry * ry),
      bboxW, bboxH, bboxArea: bboxW * bboxH,
    })
  }

  // ── smoothing ─────────────────────────────────────────────────────────────
  _smoothXY(x, y) {
    if (!this._smXY || !this._sPos) { this._sPos = { x, y }; return { x, y } }
    this._sPos.x = this._smXY * this._sPos.x + (1 - this._smXY) * x
    this._sPos.y = this._smXY * this._sPos.y + (1 - this._smXY) * y
    return { x: this._sPos.x, y: this._sPos.y }
  }

  _velPressure(x, y) {
    const now = Date.now()
    let velocity = 0
    if (this._velPos) {
      const dx = x - this._velPos.x, dy = y - this._velPos.y
      const dt = Math.max(1, now - this._velPos.t)
      velocity = Math.sqrt(dx * dx + dy * dy) / dt
      const raw = 1 - Math.min(1, velocity / 3)
      this._sP = this._smP * this._sP + (1 - this._smP) * raw
    }
    this._velPos = { x, y, t: now }
    return { pressure: this._sP, velocity }
  }

  // ── classification ────────────────────────────────────────────────────────
  // Palm is checked first (by simultaneous point count) before metric ranges.
  _classify(m, n) {
    const t = this._thr
    if (n >= t.palm.minPoints)                    return 'palm'
    if (m >= t.penThin.min  && m <= t.penThin.max)  return 'penThin'
    if (m >= t.penThick.min && m <= t.penThick.max) return 'penThick'
    if (m >= t.eraser.min   && m <= t.eraser.max)   return 'eraser'
    return 'none'
  }

  // ── public API ────────────────────────────────────────────────────────────
  get thresholds() { return this._thr }
  setThresholds(thr) {
    if (thr.penThin)  Object.assign(this._thr.penThin,  thr.penThin)
    if (thr.penThick) Object.assign(this._thr.penThick, thr.penThick)
    if (thr.eraser)   Object.assign(this._thr.eraser,   thr.eraser)
    if (thr.palm)     Object.assign(this._thr.palm,     thr.palm)
    return this
  }
  setSmooth({ xy, pressure } = {}) {
    if (xy       !== undefined) this._smXY = Math.max(0, Math.min(0.95, xy))
    if (pressure !== undefined) this._smP  = Math.max(0, Math.min(0.95, pressure))
    return this
  }

  destroy() {
    this._el.removeEventListener('touchstart',  this._b.ts)
    this._el.removeEventListener('touchmove',   this._b.tm)
    this._el.removeEventListener('touchend',    this._b.te)
    this._el.removeEventListener('touchcancel', this._b.te)
  }
}
