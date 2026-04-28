import Router                           from './core/router.js'
import Store                             from './core/storage.js'
import Registry                          from './core/registry.js'
import { VERSION }                        from './core/constants.js'
import { QuizTemplate }                  from './templates/quiz.js'
import { TextCorrectionTemplate }        from './templates/textCorrection.js'
import { TildesTemplate }               from './templates/tildes.js'
import { TildesEquipoTemplate }         from './templates/tildesEquipo.js'
import { qaModel }                       from './core/contentModels/qa.js'
import { annotatedTextModel }            from './core/contentModels/annotatedText.js'
import { annotatedTextEquipoModel }     from './core/contentModels/annotatedTextEquipo.js'
import { renderHome }                    from './views/home.js'
import { renderTemplateSelector }        from './views/templateSelector.js'
import { renderPlayerView }              from './views/playerView.js'
import { renderCalibration }             from './views/calibration.js'
import { renderLockScreen, renderPatternConfig } from './views/lockScreen.js'
import { QuizEditor }                    from './editors/quizEditor.js'
import { TextCorrectionEditor }          from './editors/textCorrectionEditor.js'
import { TildesEditor }                 from './editors/tildesEditor.js'
import { TildesEquipoEditor }           from './editors/tildesEquipoEditor.js'

Registry.register('quiz',           QuizTemplate,           { label: 'Quiz',                 icon: '❓', color: '#6c5ce7' }, qaModel)
Registry.register('textCorrection', TextCorrectionTemplate, { label: 'Corrección de textos', icon: '✍️', color: '#f39c12' }, annotatedTextModel)
Registry.register('tildes',         TildesTemplate,         { label: 'Tildes',               icon: 'á',  color: '#27ae60' }, annotatedTextModel)
Registry.register('tildesEquipo',   TildesEquipoTemplate,   { label: 'Tildes Equipo',         icon: '👥', color: '#2980b9' }, annotatedTextEquipoModel)

const app   = document.getElementById('app')
const badge = document.getElementById('version-badge')
if (badge) badge.textContent = `v${VERSION}`

let _unlocked = false

Router.on('/home', () => {
  if (localStorage.getItem('eduplay_pattern') && !_unlocked) {
    renderLockScreen(app, () => { _unlocked = true; renderHome(app) })
    return
  }
  renderHome(app)
})
Router.on('/create',           ()             => renderTemplateSelector(app))
Router.on('/editor/:template', ({ template }) => {
  if (template === 'textCorrection')  new TextCorrectionEditor(app).render()
  else if (template === 'tildes')     new TildesEditor(app).render()
  else if (template === 'tildesEquipo') new TildesEquipoEditor(app).render()
  else new QuizEditor(app).render()
})
Router.on('/editor/:template/:id', ({ template, id }) => {
  const activity = Store.get(id)
  if (!activity) { Router.navigate('/home'); return }
  if (template === 'textCorrection')  new TextCorrectionEditor(app).render(activity)
  else if (template === 'tildes')     new TildesEditor(app).render(activity)
  else if (template === 'tildesEquipo') new TildesEquipoEditor(app).render(activity)
  else new QuizEditor(app).render(activity)
})
Router.on('/play/:id',             ({ id }) => renderPlayerView(app, id))
Router.on('/calibrate',            ()       => renderCalibration(app))
Router.on('/configure-pattern',    ()       => renderPatternConfig(app, () => Router.navigate('/home')))

function boot() {
  Router.init()
  Store.sync().then(() => {
    const hash = window.location.hash.replace('#', '') || '/home'
    if (hash === '/home' || hash === '/') renderHome(app)
  })
}

if (localStorage.getItem('eduplay_pattern') && !_unlocked) {
  renderLockScreen(app, () => { _unlocked = true; boot() })
} else {
  boot()
}
