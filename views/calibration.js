import Router from '../core/router.js'

export const STORAGE_KEY = 'ep-pen-thresholds'

const DEFAULTS_FLAT = { penThinMax: 2.01, penThickMax: 3.0, eraserMin: 10.1, eraserMax: 100, palmMinPts: 3 }

const TOOL_LABELS = {
  penThin:  'Punta fina',
  penThick: 'Punta gruesa',
  eraser:   'Borrador',
  palm:     'Palma',
  none:     'Dedo / otro',
}
const TOOL_COLORS = {
  penThin:  '#4a90e2',
  penThick: '#9b59b6',
  eraser:   '#e74c3c',
  palm:     '#e67e22',
  none:     'rgba(255,255,255,0.35)',
}

function loadFlat() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS_FLAT }
    const s = JSON.parse(raw)
    return {
      penThinMax:  s.penThin?.max        ?? DEFAULTS_FLAT.penThinMax,
      penThickMax: s.penThick?.max       ?? DEFAULTS_FLAT.penThickMax,
      eraserMin:   s.eraser?.min         ?? DEFAULTS_FLAT.eraserMin,
      eraserMax:   s.eraser?.max         ?? DEFAULTS_FLAT.eraserMax,
      palmMinPts:  s.palm?.minPoints     ?? DEFAULTS_FLAT.palmMinPts,
    }
  } catch { return { ...DEFAULTS_FLAT } }
}

function saveNested(t) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
    penThin:  { min: 0,            max: t.penThinMax  },
    penThick: { min: t.penThinMax, max: t.penThickMax },
    eraser:   { min: t.eraserMin,  max: t.eraserMax   },
    palm:     { minPoints: t.palmMinPts },
  }))
}

function classify(metric, n, t) {
  if (n >= t.palmMinPts)                              return 'palm'
  if (metric <= t.penThinMax)                         return 'penThin'
  if (metric <= t.penThickMax)                        return 'penThick'
  if (metric >= t.eraserMin && metric <= t.eraserMax) return 'eraser'
  return 'none'
}

function readTouch(e) {
  const ts = e.touches
  const n  = ts.length
  if (!n) return null
  let rSum = 0
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const t of ts) {
    rSum += ((t.radiusX || 0) + (t.radiusY || 0)) / 2
    if (t.clientX < minX) minX = t.clientX
    if (t.clientX > maxX) maxX = t.clientX
    if (t.clientY < minY) minY = t.clientY
    if (t.clientY > maxY) maxY = t.clientY
  }
  const tracked  = ts[0]
  const rx = tracked.radiusX || 0, ry = tracked.radiusY || 0
  return {
    metric:    rSum / n,
    radiusMag: Math.sqrt(rx * rx + ry * ry),
    n,
    bboxArea: Math.round((maxX - minX) * (maxY - minY)),
  }
}

export function renderCalibration(container) {
  container.className = 'view-calibration'

  container.innerHTML = `
    <div class="calib-screen">
      <div class="calib-header">
        <button class="btn btn-sm btn-outline-secondary" id="calib-back">← Volver</button>
        <h5 class="mb-0">Calibración de lápiz</h5>
        <div></div>
      </div>

      <div class="calib-body">

        <div class="calib-left">
          <div class="calib-pad" id="calib-pad">
            <p class="calib-pad-hint" id="calib-hint">
              Toca con el lápiz fino,<br>el grueso, el borrador,<br>el dedo o la palma
            </p>
          </div>
          <div class="calib-live">
            <span class="calib-live-tool" id="cl-tool">—</span>
            <div class="calib-live-metrics">
              <div><span class="calib-live-lbl">métrica</span><b id="cl-metric">—</b></div>
              <div><span class="calib-live-lbl">radiusMag</span><b id="cl-rmag">—</b></div>
              <div><span class="calib-live-lbl">puntos</span><b id="cl-pts">—</b></div>
              <div><span class="calib-live-lbl">bboxÁrea</span><b id="cl-bbox">—</b></div>
            </div>
          </div>
        </div>

        <div class="calib-panel">
          <h6 class="mb-3">Umbrales <small class="text-muted">(radio medio en px)</small></h6>

          <div class="calib-thr-row">
            <label>Punta fina → gruesa</label>
            <div class="calib-slider-wrap">
              <input type="range"  id="th-thin-max"   min="0"  max="5"  step="0.05">
              <input type="number" id="th-thin-max-n" min="0"  max="5"  step="0.05">
            </div>
          </div>
          <div class="calib-thr-row">
            <label>Punta gruesa → dedo</label>
            <div class="calib-slider-wrap">
              <input type="range"  id="th-thick-max"   min="0"  max="10" step="0.1">
              <input type="number" id="th-thick-max-n" min="0"  max="10" step="0.1">
            </div>
          </div>
          <div class="calib-thr-row">
            <label>Dedo → borrador (min)</label>
            <div class="calib-slider-wrap">
              <input type="range"  id="th-erase-min"   min="2"  max="40" step="0.5">
              <input type="number" id="th-erase-min-n" min="2"  max="40" step="0.5">
            </div>
          </div>
          <div class="calib-thr-row">
            <label>Borrador (max)</label>
            <div class="calib-slider-wrap">
              <input type="range"  id="th-erase-max"   min="10" max="80" step="1">
              <input type="number" id="th-erase-max-n" min="10" max="80" step="1">
            </div>
          </div>
          <div class="calib-thr-row">
            <label>Palma — puntos simultáneos ≥</label>
            <div class="calib-slider-wrap">
              <input type="range"  id="th-palm-pts"   min="2" max="6" step="1">
              <input type="number" id="th-palm-pts-n" min="2" max="6" step="1">
            </div>
          </div>

          <div class="calib-range-bar" id="calib-range-bar"></div>

          <div class="d-flex gap-2 mt-3">
            <button class="btn btn-primary flex-fill" id="calib-save">Guardar</button>
            <button class="btn btn-outline-secondary"  id="calib-reset">Resetear</button>
          </div>
          <p class="calib-save-msg" id="calib-save-msg" hidden>✓ Guardado en este dispositivo</p>
        </div>

      </div>

      <div class="calib-history-wrap">
        <p class="calib-history-title">Historial de toques</p>
        <table class="table table-sm table-dark calib-table mb-0">
          <thead><tr>
            <th>Herramienta</th><th>Métrica</th>
            <th>RadiusMag</th><th>Puntos</th><th>BBoxÁrea</th>
          </tr></thead>
          <tbody id="calib-tbody"></tbody>
        </table>
      </div>
    </div>
  `

  let thr     = loadFlat()
  let history = []

  // ── Slider ↔ number sync ──────────────────────────────────────
  function setSlider(sl, nu, val) {
    document.getElementById(sl).value = val
    document.getElementById(nu).value = val
  }

  function readThr() {
    return {
      penThinMax:  +document.getElementById('th-thin-max').value,
      penThickMax: +document.getElementById('th-thick-max').value,
      eraserMin:   +document.getElementById('th-erase-min').value,
      eraserMax:   +document.getElementById('th-erase-max').value,
      palmMinPts:  +document.getElementById('th-palm-pts').value,
    }
  }

  function applyThr(t) {
    setSlider('th-thin-max',  'th-thin-max-n',  t.penThinMax)
    setSlider('th-thick-max', 'th-thick-max-n', t.penThickMax)
    setSlider('th-erase-min', 'th-erase-min-n', t.eraserMin)
    setSlider('th-erase-max', 'th-erase-max-n', t.eraserMax)
    setSlider('th-palm-pts',  'th-palm-pts-n',  t.palmMinPts)
    drawBar(t)
    renderHistory()
  }

  function linkPair(slId, nuId) {
    const sl = document.getElementById(slId), nu = document.getElementById(nuId)
    sl.addEventListener('input',  () => { nu.value = sl.value; thr = readThr(); drawBar(thr); renderHistory() })
    nu.addEventListener('change', () => { sl.value = nu.value; thr = readThr(); drawBar(thr); renderHistory() })
  }
  linkPair('th-thin-max',  'th-thin-max-n')
  linkPair('th-thick-max', 'th-thick-max-n')
  linkPair('th-erase-min', 'th-erase-min-n')
  linkPair('th-erase-max', 'th-erase-max-n')
  linkPair('th-palm-pts',  'th-palm-pts-n')

  applyThr(thr)

  // ── Range bar ─────────────────────────────────────────────────
  function drawBar(t) {
    const scale = 100 / Math.max(t.eraserMax + 5, 40)
    const segs = [
      { key: 'penThin',  label: 'fina',    from: 0,           to: t.penThinMax  },
      { key: 'penThick', label: 'gruesa',  from: t.penThinMax, to: t.penThickMax },
      { key: 'none',     label: 'dedo',    from: t.penThickMax, to: t.eraserMin  },
      { key: 'eraser',   label: 'borrador', from: t.eraserMin, to: t.eraserMax  },
    ]
    const bar = document.getElementById('calib-range-bar')
    bar.innerHTML = segs.map(s => {
      const w = Math.max(0, (s.to - s.from) * scale).toFixed(1)
      return `<div class="calib-bar-seg" style="width:${w}%;background:${TOOL_COLORS[s.key]}"
        title="${s.label}: ${s.from.toFixed(1)}–${s.to.toFixed(1)}">
        <span>${s.label}</span>
      </div>`
    }).join('') +
    `<div class="calib-bar-palm" style="background:${TOOL_COLORS.palm}"
      title="Palma: ≥${t.palmMinPts} puntos simultáneos">
      palma ≥${t.palmMinPts}
    </div>`
  }

  // ── Touch pad ─────────────────────────────────────────────────
  const pad  = document.getElementById('calib-pad')
  const hint = document.getElementById('calib-hint')

  function onTouch(e) {
    e.preventDefault()
    const data = readTouch(e)
    if (!data) return
    hint.style.display = 'none'
    const tool = classify(data.metric, data.n, thr)
    showLive(data, tool)
    if (e.type === 'touchstart') addHistory(data, tool)
  }

  pad.addEventListener('touchstart', onTouch, { passive: false })
  pad.addEventListener('touchmove',  onTouch, { passive: false })

  // ── Live readout ──────────────────────────────────────────────
  function showLive(data, tool) {
    const el = document.getElementById('cl-tool')
    el.textContent = TOOL_LABELS[tool] || tool
    el.style.color = TOOL_COLORS[tool] || '#fff'
    document.getElementById('cl-metric').textContent  = data.metric.toFixed(2)
    document.getElementById('cl-rmag').textContent    = data.radiusMag.toFixed(2)
    document.getElementById('cl-pts').textContent     = data.n
    document.getElementById('cl-bbox').textContent    = data.bboxArea
  }

  // ── History ───────────────────────────────────────────────────
  function addHistory(data, tool) {
    history.unshift({ ...data, tool })
    if (history.length > 12) history.pop()
    renderHistory()
  }

  function renderHistory() {
    const tbody = document.getElementById('calib-tbody')
    if (!tbody) return
    tbody.innerHTML = history.map(h => {
      const tool  = classify(h.metric, h.n, thr)
      const color = TOOL_COLORS[tool] || '#fff'
      return `<tr>
        <td style="color:${color};font-weight:600">${TOOL_LABELS[tool] || tool}</td>
        <td>${h.metric.toFixed(2)}</td>
        <td>${h.radiusMag.toFixed(2)}</td>
        <td>${h.n}</td>
        <td>${h.bboxArea}</td>
      </tr>`
    }).join('')
  }

  // ── Buttons ───────────────────────────────────────────────────
  document.getElementById('calib-back').addEventListener('click', () => Router.navigate('/home'))

  document.getElementById('calib-reset').addEventListener('click', () => {
    thr = { ...DEFAULTS_FLAT }
    applyThr(thr)
  })

  document.getElementById('calib-save').addEventListener('click', () => {
    thr = readThr()
    saveNested(thr)
    const msg = document.getElementById('calib-save-msg')
    msg.hidden = false
    setTimeout(() => { if (msg) msg.hidden = true }, 2500)
  })
}
