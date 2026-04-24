import Events                      from './events.js'
import { State, STATES }           from './state.js'
import Registry                    from './registry.js'
import { ReviewController }        from './reviewController.js'
import { Results }                 from './results.js'
import { renderStartScreen }       from '../ui/startScreen.js'
import { renderEndScreen }         from '../ui/endScreen.js'
import { HUD }                     from '../ui/hud.js'
import { Controls }                from '../ui/controls.js'

export const Player = {
  activity:  null,
  template:  null,
  score:     0,
  maxScore:  0,
  timeLeft:  0,
  timeUsed:  0,
  _interval: null,
  _onHome:   null,
  _hud:      null,
  _controls: null,
  _mainEl:   null,
  _reviewEl: null,

  /* ── Bootstrap ──────────────────────────────────────────────── */
  init(hudEl, mainEl, reviewEl, controlsEl) {
    this._hud      = new HUD(hudEl)
    this._controls = new Controls(controlsEl)
    this._mainEl   = mainEl
    this._reviewEl = reviewEl
    document.addEventListener('keydown', e => this.template?.onKey?.(e))
    window.addEventListener('resize',   () => this.template?.onResize?.())
  },

  /* ── Load activity ───────────────────────────────────────────── */
  load(activity, { onHome } = {}) {
    this._onHome  = onHome || null
    this.activity = activity
    this.score    = 0
    this.maxScore = activity.scoring?.maxScore
      ?? activity.content.maxScore
      ?? (activity.content.items || []).reduce((s, i) => s + (i.points || 10), 0)
    this.timeLeft = activity.rules?.timer ?? activity.config?.timer ?? 0
    this.timeUsed = 0

    const TemplateClass = Registry.get(activity.template)
    this.template = new TemplateClass()

    State.reset()
    this._hud.render(activity)
    this._controls.render({
      onPlay:    () => this._resume(),
      onPause:   () => this._pause(),
      onReset:   () => this._reset(),
      onNext:    () => this._skip(),
      onRestart: () => this._reset(),
      onHome:    this._onHome
    })
    this._showStart()
  },

  /* ── Screens ────────────────────────────────────────────────── */
  _showStart() {
    renderStartScreen(this._mainEl, this.activity, {
      onStart: () => this._start()
    })
  },

  _showEnd(result = {}) {
    const scoreFinal = result.scoreFinal ?? this.score
    const pct        = this.maxScore > 0
      ? Math.round((scoreFinal / this.maxScore) * 100) : 0
    renderEndScreen(this._mainEl, {
      score:     scoreFinal,
      scoreAuto: result.scoreAuto ?? scoreFinal,
      total:     this.activity.content.items?.length ?? 0,
      maxScore:  this.maxScore,
      pct,
      timeUsed:  this.timeUsed,
      overrides: result.overrides ?? [],
      onReplay:  () => this._reset(),
    })
    this._controls.showEnd()
  },

  /* ── Lifecycle ──────────────────────────────────────────────── */
  _start() {
    if (!State.go(STATES.PLAYING)) return
    this.score    = 0
    this.timeLeft = this.activity.rules?.timer ?? this.activity.config?.timer ?? 0
    this.timeUsed = 0

    this._hud.setScore(0, this.maxScore)
    this._hud.setTimer(this.timeLeft)

    this.template.init(this.activity, this._mainEl, {
      onScore:    pts => this._addScore(pts),
      onComplete: ()  => this._end()
    })
    this.template.start()

    const timer = this.activity.rules?.timer ?? this.activity.config?.timer ?? 0
    if (timer) {
      this._hud.setProgress(0, timer)
      this._startTimer()
    }
    this._controls.setPlayPause('playing')
  },

  _pause() {
    if (!State.go(STATES.PAUSED)) return
    clearInterval(this._interval)
    this.template.pause()
    this._controls.setPlayPause('paused')
  },

  _resume() {
    if (!State.go(STATES.PLAYING)) return
    this.template.resume()
    const timer = this.activity.rules?.timer ?? this.activity.config?.timer ?? 0
    if (timer) this._startTimer()
    this._controls.setPlayPause('playing')
  },

  _end() {
    clearInterval(this._interval)
    if (!State.go(STATES.REVIEW)) return

    this._controls.showReview()

    ReviewController.start(this.template, this.activity, this._mainEl, this._reviewEl, {
      onEnd:         result => this._finalize(result),
      onScoreChange: score  => this._hud.setScore(score, this.maxScore)
    })
  },

  _finalize(result) {
    if (!State.go(STATES.END)) return
    this.template.destroy()

    /* Persist result */
    Results.save({
      id:         Results.uid(),
      activityId: this.activity.id,
      title:      this.activity.title,
      date:       new Date().toISOString(),
      scoreAuto:  result.scoreAuto,
      scoreFinal: result.scoreFinal,
      maxScore:   this.maxScore,
      timeUsed:   this.timeUsed,
      overrides:  result.overrides
    })

    this._showEnd(result)
    Events.emit('activity:complete', { score: result.scoreFinal, maxScore: this.maxScore })
  },

  _reset() {
    clearInterval(this._interval)
    ReviewController.cleanup()
    this.template?.destroy()
    this.score    = 0
    this.timeLeft = this.activity.rules?.timer ?? this.activity.config?.timer ?? 0
    this.timeUsed = 0
    State.reset()
    this._hud.render(this.activity)
    this._controls.render({
      onPlay:    () => this._resume(),
      onPause:   () => this._pause(),
      onReset:   () => this._reset(),
      onNext:    () => this._skip(),
      onRestart: () => this._reset(),
      onHome:    this._onHome
    })
    this._showStart()
  },

  _skip() {
    if (State.is(STATES.PLAYING) || State.is(STATES.PAUSED)) this._end()
  },

  /* ── Helpers ────────────────────────────────────────────────── */
  _addScore(pts) {
    this.score += pts
    this._hud.setScore(this.score, this.maxScore)
    Events.emit('score:update', { score: this.score })
  },

  _startTimer() {
    const total = this.activity.rules?.timer ?? this.activity.config?.timer ?? 0
    clearInterval(this._interval)
    this._interval = setInterval(() => {
      if (!State.is(STATES.PLAYING)) return
      this.timeLeft--
      this.timeUsed++
      this._hud.setTimer(this.timeLeft)
      this._hud.setProgress(this.timeUsed, total)
      if (this.timeLeft <= 0) {
        clearInterval(this._interval)
        this._end()
      }
    }, 1000)
  }
}
