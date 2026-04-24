import { BaseTemplate }     from './base.js'
import Events               from '../core/events.js'
import { esc }              from '../core/html.js'
import { PenDetector }      from '../libs/pen-detector.js'

export class TextCorrectionTemplate extends BaseTemplate {
  static requiresTools  = ['pen']
  static reviewStrategy = 'frozenCanvas'
  static optionsSchema  = []
  static reviewOptions  = []

  constructor() {
    super()
    this._zones   = []   // { x, y, w, h, hit, expected }
    this._strokes = []   // array of [{x,y}] in canvas pixel coords at capture time
    this._current = null
    this._canvas  = null
    this._ctx     = null
    this._drawing = false
    this._done    = false
    this._checkW  = 0    // canvas.width at the moment _check() ran
    this._checkH  = 0
    this._onDown  = null
    this._onMove  = null
    this._onUp    = null
    this._debugZones = false
    this._onDebug    = null
    this._spacerL    = null
    this._spacerR    = null
    this._pd         = null   // PenDetector instance (IR mode)
    this._erasing    = false
    this._skin       = 'default'
  }

  init(activity, container, callbacks) {
    super.init(activity, container, callbacks)
  }

  start() {
    this._done       = false
    this._debugZones = false
    this._strokes    = []
    this._zones      = []
    this._checkW     = 0
    this._checkH     = 0

    // Reserve half the review-panel width on each side of main-area so the
    // wrapper stays centred. freeze() removes both spacers in the same JS
    // tick the panel appears → main-area width never changes (no reflow).
    const stage = document.getElementById('player-stage')
    const mainArea = document.getElementById('main-area')
    const rvPanel  = document.getElementById('review-panel')
    if (stage && mainArea) {
      const half = 'width:140px;min-width:120px;flex-shrink:0'
      this._spacerL = document.createElement('div')
      this._spacerL.style.cssText = half
      stage.insertBefore(this._spacerL, mainArea)
      this._spacerR = document.createElement('div')
      this._spacerR.style.cssText = half
      stage.insertBefore(this._spacerR, rvPanel || null)
    }

    this._onDebug = () => {
      this._debugZones = !this._debugZones
      if (!this._done) {
        this._ctx?.clearRect(0, 0, this._canvas?.width, this._canvas?.height)
        if (this._debugZones) this._drawZoneBorders()
      }
    }
    document.addEventListener('debug:zones', this._onDebug)

    this._render()
  }

  pause()  {}
  resume() {}

  destroy() {
    this._spacerL?.remove(); this._spacerL = null
    this._spacerR?.remove(); this._spacerR = null
    this._unbind()
    if (this._onDebug) {
      document.removeEventListener('debug:zones', this._onDebug)
      this._onDebug = null
    }
    super.destroy()
  }

  onResize() {
    if (!this._canvas) return
    // rAF defers until browser has fully settled the new layout (e.g. after fullscreen)
    // so _fitText / _sizeCanvas / _recalcZones measure correct post-resize geometry.
    requestAnimationFrame(() => {
      if (!this._canvas) return
      if (this._skin === 'notebook') {
        this._fitText()
        this._applyNotebookSkin()
      }
      this._sizeCanvas()
      if (this._done) {
        this._recalcZones(true)
        this._redrawResults()
      } else {
        this._recalcZones()
        if (this._debugZones) this._drawZoneBorders()
      }
    })
  }

  /* ── Review API ────────────────────────────────────────────── */
  freeze() {
    this._done = true
    const btn = document.getElementById('btn-check')
    if (btn) btn.disabled = true
    // Remove both spacers in the same tick the panel becomes active
    this._spacerL?.remove(); this._spacerL = null
    this._spacerR?.remove(); this._spacerR = null
  }

  getReviewData() {
    const penaltyRatio = this.activity.scoring?.penaltyRatio ?? 0
    const items = this._zones.map((z, i) => ({
      id:           `zone-${i}`,
      label:        z.word || z.expected || `Zona ${i + 1}`,
      correct:      z.hit,
      earnedPoints: z.hit ? 10 : -(10 * penaltyRatio),
      maxPoints:    10,
      zoneIndex:    i
    }))
    return {
      strategy: 'frozenCanvas',
      items,
      score:    items.reduce((s, i) => s + i.earnedPoints, 0),
      maxScore: this._zones.length * 10
    }
  }

  /* ── Render ───────────────────────────────────────────────── */
  _render() {
    const { textOriginal, textCorrect, instruction } = this.activity.content
    const textHTML    = _buildHTML(textOriginal, textCorrect)
    const isNotebook  = this.activity.presentation?.skin === 'notebook'
    this._skin        = isNotebook ? 'notebook' : 'default'

    this.container.innerHTML = `
      <div class="corr-screen fade-in">
        ${isNotebook ? '' : `<p class="corr-instruction">${esc(instruction || 'Pon las tildes que faltan')}</p>`}
        <div class="corr-wrapper${isNotebook ? ' skin-notebook' : ''}" id="corr-wrapper">
          <div class="corr-text" id="corr-text">${textHTML}</div>
          <canvas class="corr-canvas" id="corr-canvas"></canvas>
        </div>
        <button class="btn btn-primary btn-lg btn-corr-check" id="btn-check">Comprobar ✓</button>
      </div>
    `

    this._canvas = document.getElementById('corr-canvas')
    this._ctx    = this._canvas.getContext('2d')

    if (isNotebook) this._fitText()
    if (isNotebook) this._applyNotebookSkin()
    this._sizeCanvas()
    this._recalcZones()
    this._bind()

    if (isNotebook) {
      // Re-run full sequence once web fonts load — Kalam may change metrics
      document.fonts.ready.then(() => {
        if (!this._canvas) return
        this._fitText()
        this._applyNotebookSkin()
        this._sizeCanvas()
        this._recalcZones()
      })
    }

    document.getElementById('btn-check').addEventListener('click', () => this._check())
  }

  /* Binary-search the largest font-size (px) at which the text fits the wrapper.
     Sets font-size on the WRAPPER so that `2.5em` in the CSS gradient always
     equals the actual line-height — no separate JS measurement needed. */
  _fitText() {
    const wrapper = document.getElementById('corr-wrapper')
    const textEl  = document.getElementById('corr-text')
    if (!wrapper || !textEl) return
    const cs     = getComputedStyle(wrapper)
    const availH = wrapper.clientHeight
                   - parseFloat(cs.paddingTop)
                   - parseFloat(cs.paddingBottom)
    if (availH <= 0) return
    let lo = 12, hi = 80
    wrapper.style.fontSize = hi + 'px'
    while (hi - lo > 0.5) {
      const mid = (lo + hi) / 2
      wrapper.style.fontSize = mid + 'px'
      if (textEl.scrollHeight <= availH) lo = mid
      else hi = mid
    }
    wrapper.style.fontSize = Math.floor(lo) + 'px'
  }

  /* No-op: em-based CSS gradient auto-aligns with wrapper font-size */
  _applyNotebookSkin() {}

  _sizeCanvas() {
    if (!this._canvas) return
    // Use canvas's own bounding rect (CSS display size = wrapper padding-box)
    // so canvas pixels match CSS pixels exactly — no border-induced scale error.
    const r = this._canvas.getBoundingClientRect()
    this._canvas.width  = Math.round(r.width)
    this._canvas.height = Math.round(r.height)
  }

  /* Percentage-based padding: left/right 25% of char width, top 50% char height, bottom 0 */
  _recalcZones(preserveHits = false) {
    const wrapper = document.getElementById('corr-wrapper')
    if (!wrapper) return
    const wr       = wrapper.getBoundingClientRect()
    const prevHits = preserveHits ? this._zones.map(z => z.hit) : []
    const prevWords = preserveHits ? this._zones.map(z => z.word) : []
    this._zones    = []
    const { textCorrect } = this.activity.content
    wrapper.querySelectorAll('.acc-zone').forEach((span, i) => {
      const sr      = span.getBoundingClientRect()
      const isBlank = span.classList.contains('acc-zone--blank')
      const padX    = isBlank ? 18 : sr.width * 0.25
      const padTop  = sr.height * 0.50
      const charIdx = span.dataset.index !== undefined ? parseInt(span.dataset.index, 10) : -1
      const word    = preserveHits && prevWords[i]
        ? prevWords[i]
        : (charIdx >= 0 && textCorrect ? _wordAt(textCorrect, charIdx) : '')
      this._zones.push({
        x:        sr.left - wr.left - padX,
        y:        sr.top  - wr.top  - padTop,
        w:        sr.width  + padX * 2,
        h:        sr.height + padTop,
        hit:      prevHits[i] ?? false,
        expected: span.dataset.correct || '',
        word
      })
    })
  }

  /* Dashed blue rectangles — show detection zone for each letter */
  _drawZoneBorders() {
    if (!this._ctx || !this._zones.length) return
    const ctx = this._ctx
    ctx.save()
    ctx.strokeStyle = 'rgba(74,144,226,0.55)'
    ctx.lineWidth   = 1.5
    ctx.setLineDash([4, 3])
    this._zones.forEach(z => ctx.strokeRect(z.x, z.y, z.w, z.h))
    ctx.setLineDash([])
    ctx.restore()
  }

  /* Redraw strokes (scaled) — called after canvas resize */
  _redrawResults() {
    if (!this._ctx || !this._done) return
    const ctx    = this._ctx
    const scaleX = this._checkW > 0 ? this._canvas.width  / this._checkW : 1
    const scaleY = this._checkH > 0 ? this._canvas.height / this._checkH : 1

    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height)

    this._strokes.forEach(stroke => {
      if (stroke.length < 2) return
      ctx.beginPath()
      ctx.moveTo(stroke[0].x * scaleX, stroke[0].y * scaleY)
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x * scaleX, stroke[i].y * scaleY)
      }
      ctx.strokeStyle = 'rgba(74,144,226,0.65)'
      ctx.lineWidth   = 2
      ctx.lineCap     = 'round'
      ctx.lineJoin    = 'round'
      ctx.stroke()
    })
    // Circles removed — zone-ok/zone-miss on the text spans give the same feedback
  }

  /* ── Pointer drawing ─────────────────────────────────────── */
  _bind() {
    const irPen = this.activity.rules?.templateOptions?.irPen ?? false
    if (irPen) {
      this._bindIR()
    } else {
      this._bindPointer()
    }
  }

  _bindPointer() {
    const c = this._canvas
    this._onDown = e => this._pDown(e)
    this._onMove = e => this._pMove(e)
    this._onUp   = e => this._pUp(e)
    c.addEventListener('pointerdown',   this._onDown)
    c.addEventListener('pointermove',   this._onMove)
    c.addEventListener('pointerup',     this._onUp)
    c.addEventListener('pointercancel', this._onUp)
  }

  _bindIR() {
    this._pd = new PenDetector({ element: this._canvas, smooth: { xy: 0.15, pressure: 0.5 } })

    this._pd.on('pendown', evt => {
      if (this._done || evt.tool === 'none') return
      const { cx, cy } = this._toCanvas(evt.x, evt.y)
      if (evt.tool === 'eraser' || evt.tool === 'palm') {
        this._erasing = true
        this._erase(cx, cy)
        this._drawEraserIndicator(cx, cy)
      } else {
        this._drawing = true
        this._current = [{ x: cx, y: cy }]
        const ctx = this._ctx
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.strokeStyle = 'rgba(74,144,226,0.85)'
        ctx.lineWidth   = 2
        ctx.lineCap     = 'round'
        ctx.lineJoin    = 'round'
      }
    })

    this._pd.on('penmove', evt => {
      if (this._done || evt.tool === 'none') return
      const { cx, cy } = this._toCanvas(evt.x, evt.y)
      if (this._erasing || evt.tool === 'palm') {
        this._erase(cx, cy)
        this._drawEraserIndicator(cx, cy)
      } else if (this._drawing && this._current) {
        this._current.push({ x: cx, y: cy })
        this._ctx.lineTo(cx, cy)
        this._ctx.stroke()
        this._ctx.beginPath()
        this._ctx.moveTo(cx, cy)
      }
    })

    this._pd.on('penup', () => {
      if (this._erasing) {
        // Final redraw to remove eraser indicator circle
        this._erase(0, 0, 0)   // radius=0 → erases nothing, just redraws to clear indicator
      }
      this._erasing = false
      if (this._drawing && this._current?.length) {
        this._strokes.push(this._current)
        this._current = null
      }
      this._drawing = false
    })
  }

  _toCanvas(ex, ey) {
    const r = this._canvas.getBoundingClientRect()
    return {
      cx: ex * (this._canvas.width  / r.width),
      cy: ey * (this._canvas.height / r.height)
    }
  }

  /* Remove any stroke that passes through the erase circle, then redraw.
     Always redraws so the eraser indicator circle can be overlaid cleanly. */
  _erase(cx, cy, radius = 30) {
    const r2 = radius * radius
    this._strokes = this._strokes.filter(
      stroke => !stroke.some(pt => (pt.x - cx) ** 2 + (pt.y - cy) ** 2 <= r2)
    )
    const ctx = this._ctx
    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height)
    if (this._debugZones) this._drawZoneBorders()
    this._strokes.forEach(stroke => {
      if (stroke.length < 2) return
      ctx.beginPath()
      ctx.moveTo(stroke[0].x, stroke[0].y)
      for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y)
      ctx.strokeStyle = 'rgba(74,144,226,0.85)'
      ctx.lineWidth   = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      ctx.stroke()
    })
  }

  /* Dashed red circle drawn on the canvas to show the eraser area */
  _drawEraserIndicator(cx, cy, radius = 30) {
    const ctx = this._ctx
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,80,80,0.8)'
    ctx.lineWidth   = 2
    ctx.setLineDash([5, 4])
    ctx.stroke()
    ctx.restore()
  }

  _unbind() {
    this._pd?.destroy(); this._pd = null
    if (!this._canvas) return
    this._canvas.removeEventListener('pointerdown',   this._onDown)
    this._canvas.removeEventListener('pointermove',   this._onMove)
    this._canvas.removeEventListener('pointerup',     this._onUp)
    this._canvas.removeEventListener('pointercancel', this._onUp)
  }

  _pos(e) {
    const r      = this._canvas.getBoundingClientRect()
    const scaleX = this._canvas.width  / r.width
    const scaleY = this._canvas.height / r.height
    return { x: (e.clientX - r.left) * scaleX, y: (e.clientY - r.top) * scaleY }
  }

  _pDown(e) {
    if (this._done) return
    if (e.pointerType === 'touch') return   // finger: let drag/scroll pass through
    e.preventDefault()
    this._canvas.setPointerCapture(e.pointerId)
    this._drawing = true
    const p = this._pos(e)
    this._current = [p]
    const ctx = this._ctx
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    ctx.strokeStyle = 'rgba(74,144,226,0.85)'
    ctx.lineWidth   = e.pointerType === 'pen' ? Math.max(1.5, e.pressure * 5) : 3
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
  }

  _pMove(e) {
    if (!this._drawing || this._done) return
    e.preventDefault()
    const p = this._pos(e)
    this._current.push(p)
    this._ctx.lineTo(p.x, p.y)
    this._ctx.stroke()
    this._ctx.beginPath()
    this._ctx.moveTo(p.x, p.y)
  }

  _pUp() {
    if (!this._drawing) return
    this._drawing = false
    if (this._current?.length) {
      this._strokes.push(this._current)
      this._current = null
    }
  }

  /* ── Check ───────────────────────────────────────────────── */
  _check() {
    this._done   = true
    this._checkW = this._canvas.width    // snapshot for rescaling on redraw
    this._checkH = this._canvas.height
    this._recalcZones()   // fresh positions, hits reset to false

    /* Only the START POINT of each stroke triggers a hit */
    this._strokes.forEach(stroke => {
      if (!stroke.length) return
      const pt = stroke[0]
      this._zones.forEach(z => {
        if (!z.hit && pt.x >= z.x && pt.x <= z.x + z.w && pt.y >= z.y && pt.y <= z.y + z.h) {
          z.hit = true
        }
      })
    })

    const correct = this._zones.filter(z => z.hit).length
    const total   = this._zones.length

    document.getElementById('corr-wrapper')
      ?.querySelectorAll('.acc-zone')
      .forEach((span, i) => {
        span.textContent = span.dataset.correct
        span.classList.add(this._zones[i]?.hit ? 'zone-ok' : 'zone-miss')
      })

    /* Redraw: clear canvas → trazos → círculos (strokes always visible) */
    this._redrawResults()

    const btnCheck = document.getElementById('btn-check')
    if (btnCheck) {
      btnCheck.textContent = `${correct} / ${total} correctas ✓`
      btnCheck.disabled    = true
    }

    const penaltyRatio = this.activity.scoring?.penaltyRatio ?? 0
    const netScore     = correct * 10 - (total - correct) * 10 * penaltyRatio
    if (netScore !== 0) this._onScore?.(netScore)
    Events.emit('answer:correct', { correct, total })
    setTimeout(() => this._onComplete?.(), 150)
  }
}

/* ── Helpers ─────────────────────────────────────────────────── */
function _buildHTML(orig, correct) {
  /*
   * Build token list so blank zones (commas) attach to the preceding
   * word in a white-space:nowrap span, preventing orphaned comma zones
   * at the start of a wrapped line.
   */
  const parts = []   // { type: 'text'|'span'|'nowrap', html }

  for (let i = 0; i < orig.length; i++) {
    if (orig[i] !== correct[i]) {
      const blank = orig[i] === '_'
      const cls   = blank ? 'acc-zone acc-zone--blank' : 'acc-zone'
      const span  = `<span class="${cls}" data-correct="${esc(correct[i])}" data-index="${i}">${blank ? esc(correct[i]) : esc(orig[i])}</span>`

      if (blank && parts.length > 0 && parts[parts.length - 1].type === 'text') {
        // Only wrap the last word + blank zone so the comma can't start a new line alone
        const prev      = parts.pop()
        const lastSpace = prev.html.lastIndexOf(' ')
        if (lastSpace >= 0) {
          if (lastSpace + 1 > 0) parts.push({ type: 'text', html: prev.html.slice(0, lastSpace + 1) })
          parts.push({ type: 'nowrap', html: prev.html.slice(lastSpace + 1) + span })
        } else {
          parts.push({ type: 'nowrap', html: prev.html + span })
        }
      } else {
        parts.push({ type: 'span', html: span })
      }
      // Skip the space after comma: comma has natural width so the following
      // space would create a double-width gap that hints the comma position.
      if (blank && i + 1 < orig.length && /[ \n]/.test(orig[i + 1]) && /[ \n]/.test(correct[i + 1])) i++
    } else {
      const ch = esc(orig[i])
      const last = parts[parts.length - 1]
      if (last?.type === 'text') last.html += ch
      else parts.push({ type: 'text', html: ch })
    }
  }

  return parts.map(p =>
    p.type === 'nowrap' ? `<span class="tc-nb">${p.html}</span>` : p.html
  ).join('')
}

function _wordAt(text, idx) {
  let start = idx
  let end   = idx
  while (start > 0 && /\S/.test(text[start - 1])) start--
  while (end < text.length - 1 && /\S/.test(text[end + 1])) end++
  return text.slice(start, end + 1)
}
