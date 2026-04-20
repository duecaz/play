import Router                       from './core/router.js'
import Store                         from './core/storage.js'
import Registry                      from './core/registry.js'
import { QuizTemplate }              from './templates/quiz.js'
import { activities }                from './data/activities.js'
import { renderHome }                from './views/home.js'
import { renderTemplateSelector }    from './views/templateSelector.js'
import { renderPlayerView }          from './views/playerView.js'
import { renderQuizEditor }          from './editors/quizEditor.js'

Registry.register('quiz', QuizTemplate)
Store.seed(activities)

const app = document.getElementById('app')

Router.on('/home',             ()              => renderHome(app))
Router.on('/create',           ()              => renderTemplateSelector(app))
Router.on('/editor/:template', ({ template })  => renderQuizEditor(app, template))
Router.on('/play/:id',         ({ id })        => renderPlayerView(app, id))

Router.init()
