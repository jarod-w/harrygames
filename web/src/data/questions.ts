import type { Band, EnglishLevel, MathGrade, Question } from './types'

type Word = [word: string, image: string, en: string, zh: string, expl?: string]

// Sample words at each Cambridge Young Learners level. The full list is imported from CSV later (§6.3).
const WORDS: Record<EnglishLevel, Word[]> = {
  starters: [
    ['cat', '🐈', 'a small animal that says "meow"', '猫'],
    ['dog', '🐕', 'a pet that barks', '狗'],
    ['sun', '☀️', 'it shines in the day', '太阳'],
    ['hat', '🎩', 'you wear it on your head', '帽子'],
    ['pen', '🖊️', 'you write with it', '笔'],
    ['red', '🔴', 'the colour of a tomato', '红色'],
    ['bus', '🚌', 'a big car that carries many people', '公共汽车'],
    ['egg', '🥚', 'a bird lays it', '蛋'],
    ['book', '📖', 'you read it', '书'],
    ['moon', '🌙', 'you see it in the sky at night', '月亮'],
    ['star', '⭐', 'a small light in the night sky', '星星'],
    ['frog', '🐸', 'a small green animal that jumps', '青蛙'],
    ['cake', '🎂', 'a sweet food for birthdays', '蛋糕', 'The e at the end is silent.|结尾的 e 不发音。'],
    ['bird', '🐦', 'an animal with wings', '鸟'],
    ['fish', '🐟', 'it lives in water', '鱼'],
    ['milk', '🥛', 'a white drink', '牛奶'],
    ['tree', '🌳', 'a tall plant with leaves', '树'],
    ['apple', '🍎', 'a round fruit, often red', '苹果'],
  ],
  movers: [
    ['castle', '🏰', 'a large strong building with towers and high walls', '城堡', 'The t in castle is silent.|castle 中的 t 不发音。'],
    ['magic', '✨', 'making impossible things happen', '魔法'],
    ['friend', '🧑‍🤝‍🧑', 'someone you like and trust', '朋友', 'Remember: i before e in friend.|friend 里是 i 在 e 前面。'],
    ['dragon', '🐉', 'a big animal in stories that breathes fire', '龙'],
    ['broom', '🧹', 'you sweep the floor with it (or fly on it!)', '扫帚'],
    ['candle', '🕯️', 'it gives light when it burns', '蜡烛'],
    ['island', '🏝️', 'land with water all around it', '岛', 'The s in island is silent.|island 中的 s 不发音。'],
    ['clever', '🧠', 'quick at learning and understanding', '聪明的'],
    ['river', '🏞️', 'water that runs across the land', '河'],
    ['forest', '🌲', 'a large place full of trees', '森林'],
    ['bridge', '🌉', 'a road that goes over a river', '桥'],
    ['pirate', '🏴‍☠️', 'a sailor who looks for treasure', '海盗'],
    ['wizard', '🧙', 'a person who uses magic', '巫师'],
    ['garden', '🌷', 'a place where flowers grow', '花园'],
    ['monster', '👾', 'a scary creature in a story', '怪物'],
    ['rainbow', '🌈', 'colours in the sky after rain', '彩虹'],
  ],
  flyers: [
    ['invisible', '👻', 'cannot be seen', '隐形的'],
    ['creature', '🦄', 'any living animal, real or magical', '生物'],
    ['library', '📚', 'a place where you borrow books', '图书馆', 'Don\'t forget the r after b: li-BR-ary.|别忘了 b 后面的 r。'],
    ['whisper', '🤫', 'to speak very quietly', '低语', 'whisper starts with wh.|whisper 以 wh 开头。'],
    ['journey', '🧭', 'a trip from one place to another', '旅程'],
    ['mysterious', '🔮', 'strange and hard to explain', '神秘的'],
    ['potion', '🧪', 'a magic drink', '药水', '-tion sounds like "shun".|-tion 读作 "shun"。'],
    ['treasure', '💰', 'gold, silver and jewels', '宝藏'],
    ['adventure', '🗺️', 'an exciting trip', '冒险'],
    ['ancient', '🏛️', 'very, very old', '古老的'],
    ['castle', '🏰', 'a large strong building with towers', '城堡'],
    ['discover', '🔎', 'to find something for the first time', '发现'],
    ['enormous', '🦕', 'extremely big', '巨大的'],
    ['frightened', '😨', 'feeling afraid', '害怕的'],
    ['instrument', '🎻', 'something you play to make music', '乐器'],
    ['secret', '🗝️', 'something you do not tell everyone', '秘密'],
  ],
}

const maskHint = (w: string) => w[0] + ' ' + Array(Math.max(0, w.length - 2)).fill('_').join(' ') + ' ' + w[w.length - 1]

function wordsFor(level: EnglishLevel, band: Band): Word[] {
  const sorted = [...WORDS[level]].sort((a, b) => a[0].length - b[0].length || a[0].localeCompare(b[0]))
  const size = Math.ceil(sorted.length / 3)
  const slice = sorted.slice(band * size, band === 2 ? sorted.length : (band + 1) * size)
  return slice.length ? slice : sorted
}

export function charmsQuestions(level: EnglishLevel, band: Band = 1): Question[] {
  return wordsFor(level, band).map(([word, image, en, zh, expl]) => {
    const [ee, ez] = expl ? expl.split('|') : [`It is spelled ${word.toUpperCase().split('').join('-')}.`, `拼写是 ${word.toUpperCase().split('').join('-')}。`]
    return {
      id: `charms_${level}_${word}`,
      subject: 'english',
      classroom: 'charms',
      level,
      band,
      type: 'spelling',
      prompt: { en, zh },
      image,
      audio: word,
      answer: word,
      hint: maskHint(word),
      explanation: { en: ee, zh: ez },
    }
  })
}

const INGREDIENTS = ['🐸 frog eyes|青蛙眼睛', '🪶 phoenix feathers|凤凰羽毛', '🍄 mushrooms|蘑菇', '🌿 leaves|叶子', '💧 drops of dew|滴露水']
type Rng = () => number
const ri = (rand: Rng, a: number, b: number) => a + Math.floor(rand() * (b - a + 1))

function potion(grade: MathGrade, band: Band, n: number, expr: string, answer: string, hint?: { en: string; zh: string }, prompt?: { en: string; zh: string }): Question {
  const [ingEn, ingZh] = INGREDIENTS[n % INGREDIENTS.length].split('|')
  return {
    id: `potions_g${grade}_b${band}_${n}_${Math.floor(Math.random() * 36 ** 4).toString(36)}`,
    subject: 'math',
    classroom: 'potions',
    grade,
    band,
    type: 'input',
    prompt: prompt ?? { en: `The recipe needs ${expr} ${ingEn}. How many?`, zh: `配方需要 ${expr} 份${ingZh}，一共需要多少？` },
    image: prompt ? '📏' : ingEn.split(' ')[0],
    answer,
    hint: hint ?? { en: 'Work it out step by step.', zh: '一步一步算。' },
    explanation: { en: `${expr} = ${answer}`, zh: `${expr} = ${answer}` },
  }
}

function fraction(grade: MathGrade, band: Band, n: number, rand: Rng): Question {
  const d = [4, 6, 8, 10][ri(rand, 0, 3)]
  const a = ri(rand, 1, d - 2)
  const b = ri(rand, 1, d - 1 - a)
  return potion(grade, band, n, `${a}/${d} + ${b}/${d}`, `${a + b}/${d}`, { en: 'The bottom numbers are the same. Add the top.', zh: '分母相同，分子相加。' })
}

// Generated from MOE-style rules. Band 0 is the gentler start inside a grade, band 2 the hardest.
export function potionsQuestion(grade: MathGrade, band: Band, n: number, rand: Rng = Math.random): Question {
  if (grade === 1) {
    if (band === 0) {
      const a = ri(rand, 1, 9), b = ri(rand, 1, 9)
      return potion(grade, band, n, `${a} + ${b}`, String(a + b))
    }
    if (band === 1) {
      const a = ri(rand, 8, 18), b = ri(rand, 2, 12)
      const add = rand() > 0.45 || a < b
      return potion(grade, band, n, add ? `${a} + ${b}` : `${a} − ${b}`, String(add ? a + b : a - b))
    }
    const a = ri(rand, 1, 9), b = ri(rand, 1, 9), c = ri(rand, 1, 9)
    return potion(grade, band, n, `${a} + ${b} + ${c}`, String(a + b + c))
  }
  if (grade === 2) {
    if (band === 0) {
      const a = ri(rand, 20, 50), b = ri(rand, 5, 20)
      const add = rand() > 0.4
      return potion(grade, band, n, add ? `${a} + ${b}` : `${a} − ${b}`, String(add ? a + b : a - b))
    }
    if (band === 1) {
      const a = ri(rand, 30, 80), b = ri(rand, 15, 40)
      const add = rand() > 0.4 || a < b
      return potion(grade, band, n, add ? `${a} + ${b}` : `${a} − ${b}`, String(add ? a + b : a - b))
    }
    const a = ri(rand, 10, 40), b = ri(rand, 10, 30), c = ri(rand, 5, 20)
    return potion(grade, band, n, `${a} + ${b} + ${c}`, String(a + b + c))
  }
  if (grade === 3) {
    if (band === 0) {
      const a = ri(rand, 11, 19), b = ri(rand, 2, 4)
      return potion(grade, band, n, `${a} × ${b}`, String(a * b))
    }
    if (band === 1) {
      const a = ri(rand, 12, 40), b = ri(rand, 3, 9)
      return potion(grade, band, n, `${a} × ${b}`, String(a * b))
    }
    return fraction(grade, band, n, rand)
  }
  if (grade === 4) {
    if (band === 0) {
      const a = ri(rand, 20, 60), b = ri(rand, 3, 9)
      return potion(grade, band, n, `${a} × ${b}`, String(a * b))
    }
    if (band === 1) return fraction(grade, band, n, rand)
    const a = ri(rand, 12, 30), b = ri(rand, 2, 6), c = ri(rand, 10, 40)
    return potion(grade, band, n, `${c} + ${a} × ${b}`, String(c + a * b), { en: 'Multiply first, then add.', zh: '先算乘法，再算加法。' })
  }
  if (grade === 5) {
    if (band === 0) {
      const a = ri(rand, 2, 9), b = ri(rand, 2, 9), c = ri(rand, 10, 40)
      return potion(grade, band, n, `${c} + ${a} × ${b}`, String(c + a * b), { en: 'Multiply first, then add.', zh: '先算乘法，再算加法。' })
    }
    if (band === 1) {
      const p = [10, 20, 25, 50][ri(rand, 0, 3)]
      const base = [40, 80, 120, 200][ri(rand, 0, 3)]
      return potion(grade, band, n, `${p}% of ${base}`, String((p * base) / 100), { en: 'Percent means "out of 100".', zh: '百分数是“一百份里的几份”。' })
    }
    if (rand() > 0.5) {
      const m = ri(rand, 2, 9)
      return potion(grade, band, n, `${m} m`, String(m * 100), { en: '1 metre = 100 centimetres.', zh: '1 米 = 100 厘米。' }, { en: `How many centimetres are in ${m} m?`, zh: `${m} 米等于多少厘米？` })
    }
    const kg = ri(rand, 1, 5)
    return potion(grade, band, n, `${kg} kg`, String(kg * 1000), { en: '1 kilogram = 1000 grams.', zh: '1 千克 = 1000 克。' }, { en: `How many grams are in ${kg} kg?`, zh: `${kg} 千克等于多少克？` })
  }
  if (band === 0) {
    const a = ri(rand, 2, 8), b = ri(rand, 2, 6), c = ri(rand, 2, 5), d = ri(rand, 2, 5)
    return potion(grade, band, n, `${a} × ${b} + ${c} × ${d}`, String(a * b + c * d), { en: 'Work out both multiplications, then add.', zh: '先分别算乘法，再相加。' })
  }
  if (band === 1) {
    const p = [10, 20, 25, 50][ri(rand, 0, 3)]
    const base = [60, 80, 120, 240][ri(rand, 0, 3)]
    return potion(grade, band, n, `${base} + ${p}% of ${base}`, String(base + (p * base) / 100), { en: 'Find the percent, then add it on.', zh: '先算出百分数，再加回去。' })
  }
  const kg = ri(rand, 1, 4)
  const g = [200, 250, 400, 500][ri(rand, 0, 3)]
  return potion(
    grade, band, n, `${kg} kg ${g} g`, String(kg * 1000 + g),
    { en: 'Change the kilograms into grams, then add the grams.', zh: '先把千克换成克，再加上剩下的克。' },
    { en: `${kg} kg and ${g} g is how many grams?`, zh: `${kg} 千克 ${g} 克一共是多少克？` },
  )
}

const SEQUENCES: Record<'low' | 'mid' | 'high', [number[], number, string, string][]> = {
  low: [
    [[2, 4, 6, 8], 10, 'Add 2 each time.', '每次加 2。'],
    [[5, 10, 15, 20], 25, 'Add 5 each time.', '每次加 5。'],
    [[1, 3, 5, 7], 9, 'Odd numbers: add 2.', '奇数，每次加 2。'],
    [[20, 18, 16, 14], 12, 'Take away 2 each time.', '每次减 2。'],
  ],
  mid: [
    [[3, 7, 11, 15], 19, 'Add 4 each time.', '每次加 4。'],
    [[50, 44, 38, 32], 26, 'Take away 6 each time.', '每次减 6。'],
    [[2, 4, 8, 16], 32, 'Double each time.', '每次乘 2。'],
    [[9, 18, 27, 36], 45, 'The 9 times table.', '9 的乘法表。'],
  ],
  high: [
    [[1, 2, 3, 5, 8], 13, 'Add the two numbers before: 5 + 8.', '前两个数相加：5 + 8。'],
    [[1, 4, 9, 16], 25, 'Square numbers: 5 × 5.', '平方数：5 × 5。'],
    [[2, 6, 18, 54], 162, 'Multiply by 3 each time.', '每次乘 3。'],
    [[1, 3, 6, 10], 15, 'Add 2, 3, 4, then 5.', '依次加 2、3、4、5。'],
  ],
}

export function arithmancyQuestions(grade: MathGrade, band: Band = 1): Question[] {
  const group = grade <= 2 ? 'low' : grade <= 4 ? 'mid' : 'high'
  const all = SEQUENCES[group]
  const rows = band === 0 ? all.slice(0, 2) : band === 2 ? all.slice(2) : all
  return rows.map(([seq, ans, ee, ez], i) => ({
    id: `arithmancy_g${grade}_b${band}_${i}_${ans}`,
    subject: 'logic',
    classroom: 'arithmancy',
    grade,
    band,
    type: 'sequence',
    prompt: { en: seq.join(', ') + ', ?', zh: seq.join('，') + '，？' },
    image: '🚪',
    answer: String(ans),
    hint: { en: `Look at how ${seq[0]} becomes ${seq[1]}.`, zh: `看看 ${seq[0]} 是怎么变成 ${seq[1]} 的。` },
    explanation: { en: ee, zh: ez },
  }))
}

export function pickQuestion(pool: Question[], avoid: readonly string[] = [], rand: Rng = Math.random): Question {
  const fresh = pool.filter((q) => !avoid.includes(q.id))
  const list = fresh.length ? fresh : pool
  return list[Math.floor(rand() * list.length)]
}

// §6.3 / Q12: compare numbers exactly as fractions. 1/2 = 2/4 = 0.5; 1/3 ≠ 0.33.
type Frac = [bigint, bigint]
function parseFrac(s: string): Frac | null {
  s = s.trim().replace(/\s+/g, '')
  if (!s) return null
  let pct = false
  if (s.endsWith('%')) { pct = true; s = s.slice(0, -1) }
  let f: Frac | null = null
  const m = s.match(/^(-?\d+)\/(\d+)$/)
  if (m) f = BigInt(m[2]) === 0n ? null : [BigInt(m[1]), BigInt(m[2])]
  else if (/^-?\d*\.?\d+$/.test(s)) {
    const [i, d = ''] = s.split('.')
    f = [BigInt((i || '0') + d), 10n ** BigInt(d.length)]
  }
  if (f && pct) f = [f[0], f[1] * 100n]
  return f
}
export function checkAnswer(q: Question, input: string): boolean {
  if (q.subject === 'english') return input.trim().toLowerCase() === q.answer.toLowerCase()
  const a = parseFrac(input), b = parseFrac(q.answer)
  return !!a && !!b && a[0] * b[1] === b[0] * a[1]
}
