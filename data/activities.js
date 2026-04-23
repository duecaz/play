export const activities = [
  {
    id: 'act-004',
    title: 'Tildes y comas: Jamás',
    subtitle: 'Lengua · 3.º Primaria',
    template: 'textCorrection',
    schemaVersion: 2,
    content: {
      textOriginal: 'Jamas_ hombres humanos_\nhubo tanto dolor en el pecho_ en la solapa_ en la cartera_\nen el vaso_ en la carniceria_ en la aritmetica!',
      textCorrect:  'Jamás, hombres humanos,\nhubo tanto dolor en el pecho, en la solapa, en la cartera,\nen el vaso, en la carnicería, en la aritmética!',
      instruction:  'Pon las tildes y las comas que faltan',
      maxScore:     110
    },
    rules:        { timer: 120, randomize: false, shuffleOptions: false, templateOptions: {} },
    scoring:      { mode: 'perItem', pointsPerCorrect: 10, pointsPerWrong: 0, penaltyRatio: 0, maxScore: null },
    review:       { allowOverride: true, showCorrectAnswer: true, autoAdvanceToSummary: false },
    presentation: { skin: 'notebook', layout: 'center', sound: false, showTimer: true, showScore: true, teams: false }
  }
]
