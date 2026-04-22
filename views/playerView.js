import { Player } from '../core/player.js'
import Store       from '../core/storage.js'
import Router      from '../core/router.js'
import { State }   from '../core/state.js'
import Registry    from '../core/registry.js'

export function renderPlayerView(container, activityId) {
  const activity = Store.get(activityId)
  if (!activity) { Router.navigate('/home'); return }

  const modelError = Registry.getModel(activity.template)?.validate(activity.content)
  if (modelError) {
    container.innerHTML = `
      <div class="d-flex flex-column align-items-center justify-content-center gap-4"
           style="height:100vh; text-align:center; padding:2rem;">
        <p style="font-size:3rem">⚠</p>
        <p class="fs-4 fw-bold">Actividad no válida</p>
        <p class="text-secondary">${modelError}</p>
        <button class="btn btn-outline-secondary" id="btn-back-err">← Volver al inicio</button>
      </div>
    `
    document.getElementById('btn-back-err').addEventListener('click', () => Router.navigate('/home'))
    return
  }

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
