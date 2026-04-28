export function renderLockScreen(container, onUnlock) {
  container.className = 'view-lock'
  container.innerHTML = `
    <div class="lock-card fade-in">
      <div class="lock-logo">
        <span class="logo-mark">▶</span>
        <span class="logo-name">EduPlay</span>
      </div>
      <p class="lock-hint">Introduce el PIN para continuar</p>
      <div class="lock-input-wrap">
        <input type="password" class="form-control form-control-lg text-center"
          id="lock-pin" placeholder="••••" autocomplete="off" maxlength="20">
        <button class="btn btn-primary btn-lg w-100 mt-3" id="lock-submit">Entrar</button>
      </div>
      <p class="lock-error hidden" id="lock-error">PIN incorrecto</p>
    </div>
  `

  const input = document.getElementById('lock-pin')
  const errEl = document.getElementById('lock-error')

  function tryUnlock() {
    if (input.value === localStorage.getItem('eduplay_pin')) {
      sessionStorage.setItem('eduplay_unlocked', '1')
      onUnlock()
    } else {
      errEl.classList.remove('hidden')
      input.value = ''
      input.classList.add('shake')
      setTimeout(() => input.classList.remove('shake'), 400)
      input.focus()
    }
  }

  document.getElementById('lock-submit').addEventListener('click', tryUnlock)
  input.addEventListener('keydown', e => { if (e.key === 'Enter') tryUnlock() })
  input.focus()
}
