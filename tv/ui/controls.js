let _playPauseBtn = null

export function renderControls(container, { onPlay, onPause, onReset, onNext } = {}) {
  container.innerHTML = `
    <div class="controls-bar">
      <button class="ctrl-btn" id="ctrl-reset" title="Reiniciar (R)">↺</button>
      <button class="ctrl-btn ctrl-primary" id="ctrl-play-pause" data-state="playing" title="Pausar (Espacio)">⏸</button>
      <button class="ctrl-btn" id="ctrl-next" title="Finalizar actividad">⏭</button>
    </div>
  `

  _playPauseBtn = document.getElementById('ctrl-play-pause')

  document.getElementById('ctrl-reset').addEventListener('click', onReset)
  document.getElementById('ctrl-next').addEventListener('click', onNext)

  _playPauseBtn.addEventListener('click', () => {
    if (_playPauseBtn.dataset.state === 'playing') {
      onPause?.()
    } else {
      onPlay?.()
    }
  })
}

/* Called by Player to sync button icon with actual state */
export function setPlayPause(state) {
  if (!_playPauseBtn) return
  _playPauseBtn.dataset.state = state
  _playPauseBtn.textContent   = state === 'paused' ? '▶' : '⏸'
  _playPauseBtn.title         = state === 'paused' ? 'Reanudar (Espacio)' : 'Pausar (Espacio)'
}
