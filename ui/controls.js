let _playPauseBtn = null
let _fsBtn        = null

export function renderControls(container, { onPlay, onPause, onReset, onNext } = {}) {
  container.innerHTML = `
    <div class="controls-bar d-flex align-items-center gap-4">
      <button class="ctrl-btn" id="ctrl-reset" title="Reiniciar (R)">↺</button>
      <button class="ctrl-btn ctrl-primary" id="ctrl-play-pause" data-state="playing" title="Pausar (Espacio)">⏸</button>
      <button class="ctrl-btn" id="ctrl-next" title="Finalizar actividad">⏭</button>
      <button class="ctrl-btn" id="ctrl-fs" title="Pantalla completa (F)">⛶</button>
    </div>
  `

  _playPauseBtn = document.getElementById('ctrl-play-pause')
  _fsBtn        = document.getElementById('ctrl-fs')

  document.getElementById('ctrl-reset').addEventListener('click', onReset)
  document.getElementById('ctrl-next').addEventListener('click', onNext)
  _fsBtn.addEventListener('click', _toggleFs)
  document.addEventListener('fullscreenchange', _syncFsIcon)

  _playPauseBtn.addEventListener('click', () => {
    if (_playPauseBtn.dataset.state === 'playing') onPause?.()
    else onPlay?.()
  })
}

function _toggleFs() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {})
  else document.exitFullscreen().catch(() => {})
}

function _syncFsIcon() {
  if (!_fsBtn) return
  const on = !!document.fullscreenElement
  _fsBtn.textContent = on ? '⊡' : '⛶'
  _fsBtn.title       = on ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)'
}

/* Called by Player to sync button icon with actual state */
export function setPlayPause(state) {
  if (!_playPauseBtn) return
  _playPauseBtn.dataset.state = state
  _playPauseBtn.textContent   = state === 'paused' ? '▶' : '⏸'
  _playPauseBtn.title         = state === 'paused' ? 'Reanudar (Espacio)' : 'Pausar (Espacio)'
}
