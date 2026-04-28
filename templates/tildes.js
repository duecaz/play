import { TextCorrectionTemplate } from './textCorrection.js'

export class TildesTemplate extends TextCorrectionTemplate {
  start() {
    // Default to notebook skin — works even if presentation object is missing entirely
    const pres = this.activity.presentation ?? {}
    if (!pres.skin) {
      this.activity = {
        ...this.activity,
        presentation: { ...pres, skin: 'notebook' }
      }
    }
    super.start()
  }

  _scoreLabel(correct) {
    return `${correct * 10} pts ✓`
  }
}
