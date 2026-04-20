export const activities = [
  {
    id: 'act-001',
    title: 'Vocabulario: Los Animales',
    subtitle: 'Nivel A1 · Español',
    template: 'quiz',
    config: {
      timer: 60,
      showTimer: true,
      randomize: true,
      shuffleOptions: true,
      showScore: true,
      sound: false,
      teams: false,
      layout: 'center',
      skin: 'default'
    },
    content: {
      items: [
        {
          id: 'q1',
          question: '¿Cómo se dice "dog" en español?',
          answer: 'perro',
          options: ['gato', 'perro', 'pez', 'pájaro'],
          points: 10,
          image: null,
          audio: null
        },
        {
          id: 'q2',
          question: '¿Cómo se dice "cat" en español?',
          answer: 'gato',
          options: ['perro', 'gato', 'ratón', 'caballo'],
          points: 10,
          image: null,
          audio: null
        },
        {
          id: 'q3',
          question: '¿Qué animal hace "mu"?',
          answer: 'vaca',
          options: ['oveja', 'cerdo', 'vaca', 'gallina'],
          points: 10,
          image: null,
          audio: null
        },
        {
          id: 'q4',
          question: '¿Qué animal vive en el mar y tiene aletas?',
          answer: 'pez',
          options: ['pez', 'perro', 'gato', 'pájaro'],
          points: 10,
          image: null,
          audio: null
        },
        {
          id: 'q5',
          question: '¿Cuál de estos animales puede volar?',
          answer: 'pájaro',
          options: ['perro', 'pájaro', 'vaca', 'pez'],
          points: 10,
          image: null,
          audio: null
        }
      ]
    }
  },

  {
    id: 'act-002',
    title: 'Matemáticas: Sumas Básicas',
    subtitle: '1.º Primaria',
    template: 'quiz',
    config: {
      timer: 90,
      showTimer: true,
      randomize: false,
      shuffleOptions: true,
      showScore: true,
      sound: false,
      teams: false,
      layout: 'center',
      skin: 'default'
    },
    content: {
      items: [
        {
          id: 'q1',
          question: '¿Cuánto es 5 + 3?',
          answer: '8',
          options: ['6', '7', '8', '9'],
          points: 10,
          image: null,
          audio: null
        },
        {
          id: 'q2',
          question: '¿Cuánto es 4 + 6?',
          answer: '10',
          options: ['8', '9', '10', '11'],
          points: 10,
          image: null,
          audio: null
        },
        {
          id: 'q3',
          question: '¿Cuánto es 7 + 2?',
          answer: '9',
          options: ['8', '9', '10', '11'],
          points: 10,
          image: null,
          audio: null
        },
        {
          id: 'q4',
          question: '¿Cuánto es 3 + 3?',
          answer: '6',
          options: ['5', '6', '7', '8'],
          points: 10,
          image: null,
          audio: null
        }
      ]
    }
  },

  {
    id: 'act-003',
    title: 'Geografía: Capitales de Europa',
    subtitle: 'Nivel Intermedio',
    template: 'quiz',
    config: {
      timer: 120,
      showTimer: true,
      randomize: true,
      shuffleOptions: true,
      showScore: true,
      sound: false,
      teams: false,
      layout: 'center',
      skin: 'default'
    },
    content: {
      items: [
        {
          id: 'q1',
          question: '¿Cuál es la capital de Francia?',
          answer: 'París',
          options: ['Londres', 'París', 'Berlín', 'Roma'],
          points: 10,
          image: null,
          audio: null
        },
        {
          id: 'q2',
          question: '¿Cuál es la capital de Alemania?',
          answer: 'Berlín',
          options: ['Múnich', 'Hamburgo', 'Berlín', 'Viena'],
          points: 10,
          image: null,
          audio: null
        },
        {
          id: 'q3',
          question: '¿Cuál es la capital de Italia?',
          answer: 'Roma',
          options: ['Milán', 'Nápoles', 'Florencia', 'Roma'],
          points: 10,
          image: null,
          audio: null
        },
        {
          id: 'q4',
          question: '¿Cuál es la capital de Portugal?',
          answer: 'Lisboa',
          options: ['Porto', 'Lisboa', 'Braga', 'Faro'],
          points: 10,
          image: null,
          audio: null
        },
        {
          id: 'q5',
          question: '¿Cuál es la capital de España?',
          answer: 'Madrid',
          options: ['Barcelona', 'Valencia', 'Madrid', 'Sevilla'],
          points: 10,
          image: null,
          audio: null
        }
      ]
    }
  }
]
