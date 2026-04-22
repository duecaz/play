export class Controls {
  constructor(container) {
    this._container    = container
    this._playPauseBtn = null
    this._callbacks    = {}
  }

  render(callbacks = {}) {
    this._callbacks = callbacks
    this._renderGame()
  }

  /* Review state: minimal controls — teacher uses the review panel to finalize */
  showReview() {
    const { onRestart, onHome } = this._callbacks
    this._container.innerHTML = `
      <div class="controls-bar d-flex align-items-center gap-4">
        <button class="ctrl-btn ctrl-btn--wide" id="ctrl-restart">↺ Reiniciar</button>
        ${onHome ? `<button class="ctrl-btn ctrl-btn--wide" id="ctrl-home">🏠 Inicio</button>` : ''}
      </div>
    `
    this._playPauseBtn = null
    document.getElementById('ctrl-restart')?.addEventListener('click', onRestart)
    document.getElementById('ctrl-home')?.addEventListener('click', onHome)
  }

  showEnd() {
    const { onRestart, onHome } = this._callbacks
    this._container.innerHTML = `
      <div class="controls-bar d-flex align-items-center gap-4">
        <button class="ctrl-btn ctrl-btn--wide ctrl-primary" id="ctrl-restart">↺ Jugar de nuevo</button>
        ${onHome ? `<button class="ctrl-btn ctrl-btn--wide" id="ctrl-home">🏠 Inicio</button>` : ''}
      </div>
    `
    this._playPauseBtn = null
    document.getElementById('ctrl-restart')?.addEventListener('click', onRestart)
    document.getElementById('ctrl-home')?.addEventListener('click', onHome)
  }

  setPlayPause(state) {
    if (!this._playPauseBtn) return
    this._playPauseBtn.dataset.state = state
    this._playPauseBtn.textContent   = state === 'paused' ? '▶' : '⏸'
    this._playPauseBtn.title         = state === 'paused' ? 'Reanudar (Espacio)' : 'Pausar (Espacio)'
  }

  /* ── Private ─────────────────────────────────────────────── */
  _renderGame() {
    const { onPlay, onPause, onReset, onNext } = this._callbacks
    this._container.innerHTML = `
      <div class="controls-bar d-flex align-items-center gap-4">
        <button class="ctrl-btn" id="ctrl-reset" title="Reiniciar (R)">↺</button>
        <button class="ctrl-btn ctrl-primary" id="ctrl-play-pause" data-state="playing" title="Pausar (Espacio)">⏸</button>
        <button class="ctrl-btn" id="ctrl-next" title="Finalizar actividad">⏭</button>
      </div>
    `
    this._playPauseBtn = document.getElementById('ctrl-play-pause')

    document.getElementById('ctrl-reset').addEventListener('click', onReset)
    document.getElementById('ctrl-next').addEventListener('click', onNext)
    this._playPauseBtn.addEventListener('click', () => {
      if (this._playPauseBtn.dataset.state === 'playing') onPause?.()
      else onPlay?.()
    })
  }
}
