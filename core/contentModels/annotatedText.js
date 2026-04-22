export const annotatedTextModel = {
  id: 'annotatedText',
  version: 1,

  validate(content) {
    if (!content?.textOriginal?.trim())
      return 'El texto original no está definido.'
    if (!content?.textCorrect?.trim())
      return 'El texto corregido no está definido.'
    if (content.textOriginal.length !== content.textCorrect.length)
      return `Los textos tienen longitudes distintas (sin tildes: ${content.textOriginal.length}, con tildes: ${content.textCorrect.length}).`
    let zones = 0
    for (let i = 0; i < content.textOriginal.length; i++)
      if (content.textOriginal[i] !== content.textCorrect[i]) zones++
    if (zones === 0)
      return 'Los textos son idénticos (no hay zonas de corrección).'
    return null
  }
}
