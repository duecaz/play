import { BaseTemplate }  from './base.js'
import Events             from '../core/events.js'
import { esc }            from '../core/html.js'
import { PenDetector }    from '../libs/pen-detector.js'
import { buildHTML, wordAt }                                          from './tc-html.js'
import { drawZoneBorders, redrawResults, erase, drawEraserIndicator } from './tc-draw.js'

export class TextCorrectionTemplate extends BaseTemplate {
  static requiresTools  = ['pen']
  static reviewStrategy = 'frozenCanvas'
  static optionsSchema  = []
  static reviewOptions  = []

  constructor() {
    super()
    this._zones   = []
    this._strokes = []
    this._current = null
    this._canvas  = null
    this._ctx     = null
    this._drawing = false
    this._done    = false
    this._checkW  = 0
    this._checkH  = 0
    this._onDown  = null
    this._onMove  = null
    this._onUp    = null
    this._debugZones = false
    this._onDebug    = null
    this._spacerL    = null
    this._spacerR    = null
    this._pd         = null
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
    const stage    = document.getElementById('player-stage')
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
        if (this._debugZones) drawZoneBorders(this._ctx, this._zones)
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
      if (this._skin === 'notebook') this._fitText()
      this._sizeCanvas()
      if (this._done) {
        this._recalcZones(true)
        redrawResults(this._ctx, this._canvas, this._strokes, this._checkW, this._checkH)
      } else {
        this._recalcZones()
        if (this._debugZones) drawZoneBorders(this._ctx, this._zones)
      }
    })
  }

  /* ── Review API ────────────────────────────────────────────── */
  freeze() {
    this._done = true
    const btn = document.getElementById('btn-check')
    if (btn) btn.disabled = true
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
    const textHTML   = buildHTML(textOriginal, textCorrect)
    const isNotebook = this.activity.presentation?.skin === 'notebook'
    this._skin       = isNotebook ? 'notebook' : 'default'

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
    this._sizeCanvas()
    this._recalcZones()
    this._bind()

    if (isNotebook) {
      // Re-run once web fonts load — Kalam may change metrics
      document.fonts.ready.then(() => {
        if (!this._canvas) return
        this._fitText()
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

  _sizeCanvas() {
    if (!this._canvas) return
    // Use canvas's own bounding rect (CSS display size = wrapper padding-box)
    // so canvas pixels match CSS pixels exactly — no border-induced scale error.
    const r = this._canvas.getBoundingClientRect()
    this._canvas.width  = Math.round(r.width)
    this._canvas.height = Math.round(r.height)
  }

  _recalcZones(preserveHits = false) {
    const wrapper = document.getElementById('corr-wrapper')
    if (!wrapper) return
    const wr        = wrapper.getBoundingClientRect()
    const prevHits  = preserveHits ? this._zones.map(z => z.hit)  : []
    const prevWords = preserveHits ? this._zones.map(z => z.word) : []
    this._zones     = []
    const { textCorrect } = this.activity.content
    wrapper.querySelectorAll('.acc-zone').forEach((span, i) => {
      const sr      = span.getBoundingClientRect()
      const isBlank = span.classList.contains('acc-zone--blank')
      const padX    = isBlank ? 18 : sr.width * 0.25
      const padTop  = sr.height * 0.50
      const charIdx = span.dataset.index !== undefined ? parseInt(span.dataset.index, 10) : -1
      const word    = preserveHits && prevWords[i]
        ? prevWords[i]
        : (charIdx >= 0 && textCorrect ? wordAt(textCorrect, charIdx) : '')
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

  /* ── Pointer drawing ─────────────────────────────────────── */
  _bind() {
    const irPen = this.activity.rules?.templateOptions?.irPen ?? false
    if (irPen) this._bindIR()
    else       this._bindPointer()
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
      if (evt.tool === 'eraser' || evt.tool === 'penThick' || evt.tool === 'palm') {
        this._erasing = true
        this._strokes = erase(this._ctx, this._canvas, this._strokes, cx, cy, 30, this._debugZones, this._zones)
        drawEraserIndicator(this._ctx, cx, cy)
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
      if (this._erasing || evt.tool === 'penThick' || evt.tool === 'palm') {
        this._strokes = erase(this._ctx, this._canvas, this._strokes, cx, cy, 30, this._debugZones, this._zones)
        drawEraserIndicator(this._ctx, cx, cy)
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
        // radius=0 erases nothing — just redraws to clear the indicator circle
        this._strokes = erase(this._ctx, this._canvas, this._strokes, 0, 0, 0, this._debugZones, this._zones)
      }
      this._erasing = false
      if (this._drawing && this._current?.length) {
        this._strokes.push(this._current)
        this._current = null
      }
      this._drawing = false
      this._reportProgress()
    })
  }

  _toCanvas(ex, ey) {
    const r = this._canvas.getBoundingClientRect()
    return {
      cx: ex * (this._canvas.width  / r.width),
      cy: ey * (this._canvas.height / r.height)
    }
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
    if (e.pointerType === 'touch') return
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
    this._reportProgress()
  }

  /* Count zones that have at least one stroke starting inside them */
  _reportProgress() {
    if (!this._onProgress || !this._zones.length) return
    const covered = new Set()
    this._strokes.forEach(s => {
      if (!s.length) return
      const p = s[0]
      this._zones.forEach((z, i) => {
        if (p.x >= z.x && p.x <= z.x + z.w && p.y >= z.y && p.y <= z.y + z.h) covered.add(i)
      })
    })
    this._onProgress(covered.size, this._zones.length)
  }

  /* ── Check ───────────────────────────────────────────────── */
  _check() {
    this._done   = true
    this._checkW = this._canvas.width
    this._checkH = this._canvas.height
    this._recalcZones()

    // Only the START POINT of each stroke triggers a hit
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

    redrawResults(this._ctx, this._canvas, this._strokes, this._checkW, this._checkH)

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
