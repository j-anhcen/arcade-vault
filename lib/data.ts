export interface Game {
  id: string
  title: string
  short: string
  long: string
  cat: string
  cover: string
  color: 'cyan' | 'magenta' | 'yellow' | 'green'
  best: number
  plays: string
  difficulty: number
}

export interface ScoreRow {
  rank: number
  name: string
  score: number
  date: string
}

export type RouteParams<T extends Record<string, string> = Record<string, string>> = Promise<T>

export const CATS: string[] = ['TODOS', 'ARCADE', 'PUZZLE', 'SHOOTER', 'VERSUS']

export const GAMES: Game[] = [
  {
    id: 'bricks',
    title: 'BRICKS ASSAULT',
    short: 'Rompe todos los ladrillos antes de que el tiempo acabe.',
    long: 'Un clásico revitalizado: paleta, pelota y bloques de colores neon. Cada nivel añade velocidad y patrones imposibles. ¿Llegarás al nivel 99?',
    cat: 'ARCADE',
    cover: 'cover-bricks',
    color: 'cyan',
    best: 148200,
    plays: '42.1K',
    difficulty: 3,
  },
  {
    id: 'tetro',
    title: 'TETROVAULT',
    short: 'Encaja las piezas, limpia filas, sobrevive.',
    long: 'El puzzle de bloques definitivo con paleta neon y banda sonora chiptune. Las piezas caen más rápido con cada nivel. Supera tu propio récord.',
    cat: 'PUZZLE',
    cover: 'cover-tetro',
    color: 'magenta',
    best: 320500,
    plays: '91.7K',
    difficulty: 4,
  },
  {
    id: 'snake',
    title: 'NEON SNAKE',
    short: 'Crece, come, no te choques.',
    long: 'La serpiente de luz regresa con pistas laberínticas y power-ups que cambian las reglas a mitad de partida. Modo contra-reloj incluido.',
    cat: 'ARCADE',
    cover: 'cover-snake',
    color: 'green',
    best: 87300,
    plays: '58.4K',
    difficulty: 2,
  },
  {
    id: 'glot',
    title: 'GLOTÓN',
    short: 'Come puntos, evita los fantasmas.',
    long: 'Laberintos cambiantes y fantasmas con IA mejorada. Los power-ups te vuelven invencible por 8 segundos — úsalos bien.',
    cat: 'ARCADE',
    cover: 'cover-glot',
    color: 'yellow',
    best: 212800,
    plays: '74.2K',
    difficulty: 3,
  },
  {
    id: 'invaders',
    title: 'STAR INVADERS',
    short: 'Defiende la Tierra. Dispara o muere.',
    long: 'Oleadas alienígenas con patrones de ataque únicos. Las formaciones se reorganizan en cada nivel. Tus escudos se desgastan con cada impacto.',
    cat: 'SHOOTER',
    cover: 'cover-invaders',
    color: 'green',
    best: 195400,
    plays: '63.8K',
    difficulty: 4,
  },
  {
    id: 'asteroids',
    title: 'ASTEROIDS',
    short: 'Destruye rocas espaciales antes de que te destruyan.',
    long: 'Nave solitaria en un campo de asteroides infinito. Sin fricción, sin piedad. Los fragmentos se parten al impactar. Esquiva, apunta y sobrevive oleada tras oleada.',
    cat: 'SHOOTER',
    cover: 'cover-asteroids',
    color: 'cyan',
    best: 134600,
    plays: '29.5K',
    difficulty: 4,
  },
  {
    id: 'rocas',
    title: 'ROCAS',
    short: 'Destruye asteroides antes de que te destruyan.',
    long: 'Física newtoniana en el vacío: sin fricción, sin piedad. Los asteroides se fragmentan al impactar. Esquiva, apunta y dispara con precisión.',
    cat: 'SHOOTER',
    cover: 'cover-rocas',
    color: 'cyan',
    best: 134600,
    plays: '29.5K',
    difficulty: 3,
  },
  {
    id: 'rana',
    title: 'CYBER FROG',
    short: 'Cruza la autopista sin acabar aplastado.',
    long: 'Tráfico a velocidades imposibles y ríos de datos binarios. Cada nivel añade carriles y reduce el tiempo de reacción disponible.',
    cat: 'ARCADE',
    cover: 'cover-rana',
    color: 'green',
    best: 68900,
    plays: '37.1K',
    difficulty: 2,
  },
  {
    id: 'duelo',
    title: 'DUELO LASER',
    short: '1 vs 1. Solo uno sale vivo.',
    long: 'Arena simétrica, reflejos de laser y power-ups que cambian el juego. Juega contra la IA o desafía a un amigo en el mismo teclado.',
    cat: 'VERSUS',
    cover: 'cover-duelo',
    color: 'magenta',
    best: 500000,
    plays: '18.3K',
    difficulty: 5,
  },
]

const NAMES = [
  'PLAYER1',
  'XERO_X',
  'NOVA',
  'BLITZ',
  'PIXL',
  'VEGA',
  'ROGUE',
  'CIPHER',
  'KIRA',
  'NEON7',
  'ACE',
  'PHANTOM',
  'GLITCH',
  'STORM',
  'BLADE',
  'ECHO',
  'FROST',
  'HAWK',
  'JINX',
  'KARMA',
]

function lcg(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

export function seededScores(seed: number, count = 10): ScoreRow[] {
  const rand = lcg(seed)
  const baseScore = 50000 + Math.floor(rand() * 200000)
  const rows: ScoreRow[] = []

  for (let i = 0; i < count; i++) {
    const score = Math.floor(baseScore * (1 - i * 0.07 - rand() * 0.04))
    const nameIdx = Math.floor(rand() * NAMES.length)
    const day = 1 + Math.floor(rand() * 28)
    const month = 1 + Math.floor(rand() * 12)
    const year = 2025 + Math.floor(rand() * 2)
    rows.push({
      rank: i + 1,
      name: NAMES[nameIdx],
      score,
      date: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`,
    })
  }

  return rows
}
