export const activities = [
  {
    id: 'act-004',
    title: 'Tildes: El café de José',
    subtitle: 'Lengua · 3.º Primaria',
    template: 'textCorrection',
    schemaVersion: 2,
    content: {
      textOriginal: 'El cafe esta abierto. Jose corre rapido al salon.',
      textCorrect:  'El café está abierto. José corre rápido al salón.',
      instruction:  'Pon las tildes que faltan con el stylus',
      maxScore:     50
    },
    rules:        { timer: 120, randomize: false, shuffleOptions: false, templateOptions: {} },
    scoring:      { mode: 'perItem', pointsPerCorrect: 10, pointsPerWrong: 0, maxScore: null },
    review:       { allowOverride: true, showCorrectAnswer: true, autoAdvanceToSummary: false },
    presentation: { skin: 'default', layout: 'center', sound: false, showTimer: true, showScore: true, teams: false }
  }
]
