import { Player } from '../core/player.js'
import Store       from '../core/storage.js'
import Router      from '../core/router.js'
import { State }   from '../core/state.js'

export function renderPlayerView(container, activityId) {
  const activity = Store.get(activityId)
  if (!activity) { Router.navigate('/home'); return }

  container.className = 'view-player'
  container.innerHTML = `
    <div id="player-container">
      <div id="hud"></div>
      <div id="main-area"></div>
      <div id="controls"></div>
    </div>
  `

  /* Stop player when navigating away */
  Router.onLeave(() => {
    clearInterval(Player._interval)
    Player.template?.destroy()
    State.reset()
    container.className = ''
  })

  Player.init(
    container.querySelector('#hud'),
    container.querySelector('#main-area'),
    container.querySelector('#controls')
  )

  Player.load(activity, {
    onHome: () => Router.navigate('/home')
  })
}
