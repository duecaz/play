import { BaseTemplate }                        from './base.js'
import Events                                   from '../core/events.js'
import { esc }                                  from '../core/html.js'
import { TC_PX, TC_PY_TOP, TC_PY_BOT }         from '../core/constants.js'

export class TextCorrectionTemplate extends BaseTemplate {
  static requiresTools = ['pen']

  constructor() {
    super()
    this._zones   = []   // { x, y, w, h, hit }
    this._strokes = []   // array of [{x,y}] arrays
    this._current = null
    this._canvas  = null
    this._ctx     = null
    this._drawing = false
    this._done    = false
    this._onDown  = null
    this._onMove  = null
    this._onUp    = null
  }

  init(activity, container, callbacks) {
    super.init(activity, container, callbacks)
  }

  start() {
    this._done    = false
    this._strokes = []
    this._zones   = []
    this._render()
  }

  pause()  {}
  resume() {}

  destroy() {
    this._unbind()
    super.destroy()
  }

  onResize() {
    if (this._canvas && !this._done) this._recalcZones()
  }

  /* ── Render ───────────────────────────────────────────────── */
  _render() {
    const { textOriginal, textCorrect, instruction } = this.activity.content
    const textHTML = _buildHTML(textOriginal, textCorrect)

    this.container.innerHTML = `
      <div class="corr-screen fade-in">
        <p class="corr-instruction">${esc(instruction || 'Pon las tildes que faltan')}</p>
        <div class="corr-wrapper" id="corr-wrapper">
          <div class="corr-text" id="corr-text">${textHTML}</div>
          <canvas class="corr-canvas" id="corr-canvas"></canvas>
        </div>
        <button class="btn btn-primary btn-lg btn-corr-check" id="btn-check">Comprobar ✓</button>
      </div>
    `

    this._canvas = document.getElementById('corr-canvas')
    this._ctx    = this._canvas.getContext('2d')

    this._sizeCanvas()
    this._recalcZones()
    this._bind()

    document.getElementById('btn-check')
      .addEventListener('click', () => this._check())
  }

  _sizeCanvas() {
    const w = document.getElementById('corr-wrapper')
    if (!w || !this._canvas) return
    const r = w.getBoundingClientRect()
    this._canvas.width  = Math.round(r.width)
    this._canvas.height = Math.round(r.height)
  }

  _recalcZones() {
    const wrapper = document.getElementById('corr-wrapper')
    if (!wrapper) return
    const wr = wrapper.getBoundingClientRect()
    this._zones = []
    wrapper.querySelectorAll('.acc-zone').forEach(span => {
      const sr = span.getBoundingClientRect()
      this._zones.push({
        x:   sr.left - wr.left - TC_PX,
        y:   sr.top  - wr.top  - TC_PY_TOP,
        w:   sr.width  + TC_PX * 2,
        h:   sr.height + TC_PY_TOP + TC_PY_BOT,
        hit: false
      })
    })
  }

  /* ── Pointer drawing ──────────────────────────────────────── */
  _bind() {
    const c = this._canvas
    this._onDown = e => this._pDown(e)
    this._onMove = e => this._pMove(e)
    this._onUp   = e => this._pUp(e)
    c.addEventListener('pointerdown',   this._onDown)
    c.addEventListener('pointermove',   this._onMove)
    c.addEventListener('pointerup',     this._onUp)
    c.addEventListener('pointercancel', this._onUp)
  }

  _unbind() {
    if (!this._canvas) return
    this._canvas.removeEventListener('pointerdown',   this._onDown)
    this._canvas.removeEventListener('pointermove',   this._onMove)
    this._canvas.removeEventListener('pointerup',     this._onUp)
    this._canvas.removeEventListener('pointercancel', this._onUp)
  }

  _pos(e) {
    const r = this._canvas.getBoundingClientRect()
    const scaleX = this._canvas.width  / r.width
    const scaleY = this._canvas.height / r.height
    return { x: (e.clientX - r.left) * scaleX, y: (e.clientY - r.top) * scaleY }
  }

  _pDown(e) {
    if (this._done) return
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

  /* ── Check ────────────────────────────────────────────────── */
  _check() {
    this._done = true
    this._recalcZones()

    this._strokes.forEach(stroke => {
      stroke.forEach(pt => {
        this._zones.forEach(z => {
          if (!z.hit && pt.x >= z.x && pt.x <= z.x + z.w && pt.y >= z.y && pt.y <= z.y + z.h) {
            z.hit = true
          }
        })
      })
    })

    const correct = this._zones.filter(z => z.hit).length
    const total   = this._zones.length

    /* Reveal correct accent and color zones */
    document.getElementById('corr-wrapper')
      ?.querySelectorAll('.acc-zone')
      .forEach((span, i) => {
        span.textContent = span.dataset.correct   // show accented char
        span.classList.add(this._zones[i]?.hit ? 'zone-ok' : 'zone-miss')
      })

    /* Draw result circles */
    const ctx = this._ctx
    this._zones.forEach(z => {
      const cx = z.x + z.w / 2
      const cy = z.y + z.h / 2 + 20
      ctx.beginPath()
      ctx.arc(cx, cy, 20, 0, Math.PI * 2)
      ctx.fillStyle   = z.hit ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.3)'
      ctx.fill()
      ctx.strokeStyle = z.hit ? '#4caf50' : '#f44336'
      ctx.lineWidth   = 2.5
      ctx.stroke()
    })

    const btnCheck = document.getElementById('btn-check')
    if (btnCheck) {
      btnCheck.textContent = `${correct} / ${total} tildes correctas ✓`
      btnCheck.disabled    = true
    }

    if (correct > 0) this._onScore?.(correct * 10)
    Events.emit('answer:correct', { correct, total })
    setTimeout(() => this._onComplete?.(), 2500)
  }
}

/* ── Helpers ─────────────────────────────────────────────────── */
function _buildHTML(orig, correct) {
  let html = ''
  for (let i = 0; i < orig.length; i++) {
    if (orig[i] !== correct[i]) {
      html += `<span class="acc-zone" data-correct="${esc(correct[i])}">${esc(orig[i])}</span>`
    } else {
      html += esc(orig[i])
    }
  }
  return html
}
