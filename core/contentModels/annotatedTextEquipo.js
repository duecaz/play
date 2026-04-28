import { annotatedTextModel } from './annotatedText.js'

export const annotatedTextEquipoModel = {
  id: 'annotatedTextEquipo',
  version: 1,

  validate(content) {
    if (!Array.isArray(content?.rounds) || content.rounds.length < 2)
      return 'Se necesitan al menos 2 rondas.'
    for (let i = 0; i < content.rounds.length; i++) {
      const err = annotatedTextModel.validate(content.rounds[i])
      if (err) return `Alumno ${i + 1}: ${err}`
    }
    return null
  }
}
