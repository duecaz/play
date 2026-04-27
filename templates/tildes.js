import { TextCorrectionTemplate } from './textCorrection.js'

export class TildesTemplate extends TextCorrectionTemplate {
  _scoreLabel(correct) {
    return `${correct * 10} pts ✓`
  }
}
