export class Controls {
  constructor(container) {
    this._container    = container
    this._playPauseBtn = null
    this._fsBtn        = null
    this._onFsChange   = null
    this._callbacks    = {}
  }

  /* Render game controls; call once per load() */
  render(callbacks = {}) {
    this._callbacks = callbacks
    this._renderGame()
    if (!this._onFsChange) {
      this._onFsChange = () => this._syncFs()
      document.addEventListener('fullscreenchange', this._onFsChange)
    }
  }

  /* Switch controls bar to end-of-game actions */
  showEnd() {
    const { onRestart, onHome } = this._callbacks
    this._container.innerHTML = `
      <div class="controls-bar d-flex align-items-center gap-4">
        <button class="ctrl-btn ctrl-btn--wide ctrl-primary" id="ctrl-restart">↺ Jugar de nuevo</button>
        ${onHome ? `<button class="ctrl-btn ctrl-btn--wide" id="ctrl-home">🏠 Inicio</button>` : ''}
        <button class="ctrl-btn" id="ctrl-fs" title="Pantalla completa (F)">⛶</button>
      </div>
    `
    this._playPauseBtn = null
    this._fsBtn = document.getElementById('ctrl-fs')
    this._fsBtn.addEventListener('click', () => this._toggleFs())
    document.getElementById('ctrl-restart')?.addEventListener('click', onRestart)
    document.getElementById('ctrl-home')?.addEventListener('click', onHome)
    this._syncFs()
  }

  setPlayPause(state) {
    if (!this._playPauseBtn) return
    this._playPauseBtn.dataset.state = state
    this._playPauseBtn.textContent   = state === 'paused' ? '▶' : '⏸'
    this._playPauseBtn.title         = state === 'paused' ? 'Reanudar (Espacio)' : 'Pausar (Espacio)'
  }

  destroy() {
    if (this._onFsChange) {
      document.removeEventListener('fullscreenchange', this._onFsChange)
      this._onFsChange = null
    }
  }

  /* ── Private ─────────────────────────────────────────────── */
  _renderGame() {
    const { onPlay, onPause, onReset, onNext } = this._callbacks
    this._container.innerHTML = `
      <div class="controls-bar d-flex align-items-center gap-4">
        <button class="ctrl-btn" id="ctrl-reset" title="Reiniciar (R)">↺</button>
        <button class="ctrl-btn ctrl-primary" id="ctrl-play-pause" data-state="playing" title="Pausar (Espacio)">⏸</button>
        <button class="ctrl-btn" id="ctrl-next" title="Finalizar actividad">⏭</button>
        <button class="ctrl-btn" id="ctrl-fs" title="Pantalla completa (F)">⛶</button>
      </div>
    `
    this._playPauseBtn = document.getElementById('ctrl-play-pause')
    this._fsBtn        = document.getElementById('ctrl-fs')

    document.getElementById('ctrl-reset').addEventListener('click', onReset)
    document.getElementById('ctrl-next').addEventListener('click', onNext)
    this._fsBtn.addEventListener('click', () => this._toggleFs())
    this._playPauseBtn.addEventListener('click', () => {
      if (this._playPauseBtn.dataset.state === 'playing') onPause?.()
      else onPlay?.()
    })
    this._syncFs()
  }

  _toggleFs() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {})
    else document.exitFullscreen().catch(() => {})
  }

  _syncFs() {
    const on = !!document.fullscreenElement
    if (this._fsBtn) {
      this._fsBtn.textContent = on ? '⊡' : '⛶'
      this._fsBtn.title       = on ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)'
    }
    this._container.classList.toggle('fs-mode', on)
  }
}
