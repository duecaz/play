import { Player }       from './core/player.js'
import Registry          from './core/registry.js'
import { QuizTemplate }  from './templates/quiz.js'
import { activities }    from './data/activities.js'

Registry.register('quiz', QuizTemplate)

Player.init(
  document.getElementById('hud'),
  document.getElementById('main-area'),
  document.getElementById('controls')
)

Player.load(activities[0])
