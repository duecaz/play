import Events                             from './events.js'
import { State, STATES }                  from './state.js'
import Registry                           from './registry.js'
import { renderStartScreen }              from '../ui/startScreen.js'
import { renderEndScreen }                from '../ui/endScreen.js'
import { renderHUD, updateTimer,
         updateScore }                    from '../ui/hud.js'
import { renderControls, setPlayPause }   from '../ui/controls.js'

export const Player = {
  activity:  null,
  template:  null,
  score:     0,
  maxScore:  0,
  timeLeft:  0,
  timeUsed:  0,
  _interval: null,
  _els:      { hud: null, main: null, controls: null },

  /* ── Bootstrap ─────────────────────────────────────────── */
  init(hudEl, mainEl, controlsEl) {
    this._els = { hud: hudEl, main: mainEl, controls: controlsEl }
    document.addEventListener('keydown', e => this.template?.onKey?.(e))
    window.addEventListener('resize',   () => this.template?.onResize?.())
  },

  /* ── Load activity ─────────────────────────────────────── */
  load(activity) {
    this.activity = activity
    this.score    = 0
    this.maxScore = activity.content.items.reduce((s, i) => s + (i.points || 10), 0)
    this.timeLeft = activity.config.timer || 0
    this.timeUsed = 0

    const TemplateClass = Registry.get(activity.template)
    this.template = new TemplateClass()

    State.reset()
    renderHUD(this._els.hud, activity)
    renderControls(this._els.controls, {
      onPlay:  () => this._resume(),
      onPause: () => this._pause(),
      onReset: () => this._reset(),
      onNext:  () => this._skip()
    })
    this._showStart()
  },

  /* ── Screens ───────────────────────────────────────────── */
  _showStart() {
    renderStartScreen(this._els.main, this.activity, {
      onStart: () => this._start()
    })
  },

  _showEnd() {
    const pct = this.maxScore > 0
      ? Math.round((this.score / this.maxScore) * 100) : 0
    renderEndScreen(this._els.main, {
      score:    this.score,
      total:    this.activity.content.items.length,
      maxScore: this.maxScore,
      pct,
      timeUsed: this.timeUsed,
      onRestart: () => this._reset()
    })
  },

  /* ── Lifecycle ─────────────────────────────────────────── */
  _start() {
    if (!State.go(STATES.PLAYING)) return
    this.score    = 0
    this.timeLeft = this.activity.config.timer || 0
    this.timeUsed = 0

    updateScore(0)
    updateTimer(this.timeLeft)

    this.template.init(this.activity, this._els.main, {
      onScore:    pts => this._addScore(pts),
      onComplete: ()  => this._end()
    })
    this.template.start()

    if (this.activity.config.timer) this._startTimer()
    setPlayPause('playing')
  },

  _pause() {
    if (!State.go(STATES.PAUSED)) return
    clearInterval(this._interval)
    this.template.pause()
    setPlayPause('paused')
  },

  _resume() {
    if (!State.go(STATES.PLAYING)) return
    this.template.resume()
    if (this.activity.config.timer) this._startTimer()
    setPlayPause('playing')
  },

  _end() {
    clearInterval(this._interval)
    if (!State.go(STATES.END)) return
    this.template.destroy()
    this._showEnd()
    setPlayPause('playing')
    Events.emit('activity:complete', { score: this.score, maxScore: this.maxScore })
  },

  _reset() {
    clearInterval(this._interval)
    this.template?.destroy()
    this.score    = 0
    this.timeLeft = this.activity.config.timer || 0
    this.timeUsed = 0
    State.reset()
    renderHUD(this._els.hud, this.activity)
    updateScore(0)
    updateTimer(this.timeLeft)
    this._showStart()
    setPlayPause('playing')
  },

  _skip() {
    if (State.is(STATES.PLAYING) || State.is(STATES.PAUSED)) this._end()
  },

  /* ── Helpers ───────────────────────────────────────────── */
  _addScore(pts) {
    this.score += pts
    updateScore(this.score)
    Events.emit('score:update', { score: this.score })
  },

  _startTimer() {
    clearInterval(this._interval)
    this._interval = setInterval(() => {
      if (!State.is(STATES.PLAYING)) return
      this.timeLeft--
      this.timeUsed++
      updateTimer(this.timeLeft)
      if (this.timeLeft <= 0) {
        clearInterval(this._interval)
        this._end()
      }
    }, 1000)
  }
}
