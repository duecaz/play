export const qaModel = {
  id: 'qa',
  version: 2,

  validate(content) {
    if (!Array.isArray(content?.items) || content.items.length === 0)
      return 'La actividad no tiene preguntas.'
    for (const item of content.items) {
      if (!item.question?.trim())
        return 'Una pregunta no tiene texto.'
      if (!Array.isArray(item.options) || item.options.length < 2)
        return 'Una pregunta tiene menos de 2 opciones.'
      if (!item.answer?.trim())
        return 'Una pregunta no tiene respuesta correcta marcada.'
    }
    return null
  }
}
