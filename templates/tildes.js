import { TextCorrectionTemplate } from './textCorrection.js'

export class TildesTemplate extends TextCorrectionTemplate {
  start() {
    // Default to notebook skin if activity was created without one
    if (this.activity.presentation && !this.activity.presentation.skin) {
      this.activity = {
        ...this.activity,
        presentation: { ...this.activity.presentation, skin: 'notebook' }
      }
    }
    super.start()
  }

  _scoreLabel(correct) {
    return `${correct * 10} pts ✓`
  }
}
