import Router                           from './core/router.js'
import Store                             from './core/storage.js'
import Registry                          from './core/registry.js'
import { QuizTemplate }                  from './templates/quiz.js'
import { TextCorrectionTemplate }        from './templates/textCorrection.js'
import { qaModel }                       from './core/contentModels/qa.js'
import { annotatedTextModel }            from './core/contentModels/annotatedText.js'
import { activities }                    from './data/activities.js'
import { renderHome }                    from './views/home.js'
import { renderTemplateSelector }        from './views/templateSelector.js'
import { renderPlayerView }              from './views/playerView.js'
import { QuizEditor }                    from './editors/quizEditor.js'
import { TextCorrectionEditor }          from './editors/textCorrectionEditor.js'

Registry.register('quiz',           QuizTemplate,           { label: 'Quiz',                  icon: '❓' }, qaModel)
Registry.register('textCorrection', TextCorrectionTemplate, { label: 'Corrección de textos',   icon: '✍️' }, annotatedTextModel)
Store.seed(activities)

const app = document.getElementById('app')

Router.on('/home',             ()             => renderHome(app))
Router.on('/create',           ()             => renderTemplateSelector(app))
Router.on('/editor/:template', ({ template }) => {
  if (template === 'textCorrection') new TextCorrectionEditor(app).render()
  else new QuizEditor(app).render()
})
Router.on('/play/:id',         ({ id })       => renderPlayerView(app, id))

Router.init()
