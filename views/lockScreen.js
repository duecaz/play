import Store from '../core/storage.js'

export function renderLockScreen(container, onUnlock) {
  _renderGrid(container, {
    hint: 'Dibuja el patrón para entrar',
    onComplete: seq => {
      const stored = localStorage.getItem('eduplay_pattern')
      if (!stored || seq.join('-') === stored) { onUnlock(); return }
      _shake(container, 'Patrón incorrecto')
    }
  })
}

export function renderPatternConfig(container, onDone) {
  const hasPattern = !!localStorage.getItem('eduplay_pattern')
  let firstSeq = null

  function step1() {
    _renderGrid(container, {
      hint: 'Dibuja el nuevo patrón <small>(mín. 4 puntos)</small>',
      extra: hasPattern
        ? `<button class="btn btn-sm btn-outline-danger mt-1" id="btn-disable">Desactivar bloqueo</button>`
        : '',
      onComplete: seq => {
        if (seq.length < 4) { _shake(container, 'Mínimo 4 puntos'); setTimeout(step1, 900); return }
        firstSeq = seq
        step2()
      },
      onExtra: () => { Store.removePattern(); onDone() }
    })
  }

  function step2() {
    _renderGrid(container, {
      hint: 'Confirma el patrón',
      onComplete: seq => {
        if (seq.join('-') === firstSeq.join('-')) {
          Store.savePattern(seq.join('-'))
          onDone()
        } else {
          _shake(container, 'Los patrones no coinciden')
          setTimeout(step1, 900)
        }
      }
    })
  }

  step1()
}

/* ── Shared grid renderer ──────────────────────────────────── */
function _renderGrid(container, { hint, extra = '', onComplete, onExtra }) {
  container.className = 'view-lock'
  container.innerHTML = `
    <div class="lock-card fade-in">
      <div class="lock-logo">
        <span class="logo-mark">▶</span>
        <span class="logo-name">EduPlay</span>
      </div>
      <p class="lock-hint">${hint}</p>
      <div class="pattern-wrap" id="pattern-wrap">
        <canvas class="pattern-canvas" id="pattern-canvas"></canvas>
        <div class="pattern-grid" id="pattern-grid">
          ${Array.from({length: 9}, (_, i) => `<div class="pattern-dot" data-idx="${i}"></div>`).join('')}
        </div>
      </div>
      <p class="lock-error hidden" id="lock-error"></p>
      ${extra}
    </div>
  `
  document.getElementById('btn-disable')?.addEventListener('click', onExtra)
  _initInput(onComplete)
}

function _shake(container, msg) {
  const errEl = document.getElementById('lock-error')
  const wrap  = document.getElementById('pattern-wrap')
  if (errEl) { errEl.textContent = msg; errEl.classList.remove('hidden') }
  wrap?.classList.add('shake')
  setTimeout(() => {
    errEl?.classList.add('hidden')
    wrap?.classList.remove('shake')
  }, 900)
}

/* ── Pattern input logic ───────────────────────────────────── */
function _initInput(onComplete) {
  const wrap   = document.getElementById('pattern-wrap')
  const canvas = document.getElementById('pattern-canvas')
  const dots   = [...document.querySelectorAll('.pattern-dot')]
  if (!wrap || !canvas) return

  const wr = wrap.getBoundingClientRect()
  canvas.width  = Math.round(wr.width)
  canvas.height = Math.round(wr.height)
  const ctx = canvas.getContext('2d')

  const seq = []
  let drawing = false
  let curX = 0, curY = 0

  function center(dot) {
    const dr = dot.getBoundingClientRect()
    const ww = wrap.getBoundingClientRect()
    return { x: dr.left + dr.width / 2 - ww.left, y: dr.top + dr.height / 2 - ww.top }
  }

  function nearby(clientX, clientY) {
    const ww = wrap.getBoundingClientRect()
    const px = clientX - ww.left, py = clientY - ww.top
    return dots.find(d => { const c = center(d); return Math.hypot(px - c.x, py - c.y) < 38 }) ?? null
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!seq.length) return
    ctx.strokeStyle = 'rgba(74,144,226,0.7)'
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.beginPath()
    const pts = seq.map(center)
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
    if (drawing) ctx.lineTo(curX, curY)
    ctx.stroke()
  }

  function add(dot) {
    if (seq.includes(dot)) return
    seq.push(dot); dot.classList.add('selected'); draw()
  }

  wrap.addEventListener('pointerdown', e => {
    const dot = nearby(e.clientX, e.clientY)
    if (!dot) return
    e.preventDefault()
    try { wrap.setPointerCapture(e.pointerId) } catch {}
    seq.length = 0; dots.forEach(d => d.classList.remove('selected'))
    drawing = true; add(dot)
  }, { passive: false })

  wrap.addEventListener('pointermove', e => {
    if (!drawing) return
    e.preventDefault()
    const ww = wrap.getBoundingClientRect()
    curX = e.clientX - ww.left; curY = e.clientY - ww.top
    const dot = nearby(e.clientX, e.clientY)
    if (dot) add(dot)
    draw()
  }, { passive: false })

  wrap.addEventListener('pointerup', () => {
    if (!drawing) return
    drawing = false; draw()
    const result = seq.map(d => +d.dataset.idx)
    setTimeout(() => {
      dots.forEach(d => d.classList.remove('selected'))
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (result.length >= 2) onComplete(result)
    }, 250)
  })

  wrap.addEventListener('pointercancel', () => {
    drawing = false
    dots.forEach(d => d.classList.remove('selected'))
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  })
}
