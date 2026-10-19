import type { EnglishLevel, MathGrade, Question } from './types'

// Sample Cambridge YLE words. The real list will be imported from CSV (§6.3).
const WORDS: Record<EnglishLevel, [string, string, string, string, string?][]> = {
  starters: [
    ['cat', '🐈', 'a small animal that says "meow"', '猫'],
    ['book', '📖', 'you read it', '书'],
    ['owl', '🦉', 'a bird that is awake at night', '猫头鹰'],
    ['frog', '🐸', 'a small green animal that jumps', '青蛙'],
    ['moon', '🌙', 'you see it in the sky at night', '月亮'],
    ['star', '⭐', 'a small light in the night sky', '星星'],
    ['hat', '🎩', 'you wear it on your head', '帽子'],
    ['cake', '🎂', 'a sweet food for birthdays', '蛋糕', 'The e at the end is silent.|结尾的 e 不发音。'],
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
  ],
}

const maskHint = (w: string) => w[0] + ' ' + Array(w.length - 2).fill('_').join(' ') + ' ' + w[w.length - 1]

export function charmsQuestions(level: EnglishLevel): Question[] {
  return WORDS[level].map(([word, image, en, zh, expl], i) => {
    const [ee, ez] = expl ? expl.split('|') : [`It is spelled ${word.toUpperCase().split('').join('-')}.`, `拼写是 ${word.toUpperCase().split('').join('-')}。`]
    return {
      id: `charms_${level}_${String(i + 1).padStart(3, '0')}`,
      subject: 'english',
      classroom: 'charms',
      level,
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

const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
const INGREDIENTS = ['🐸 frog eyes|青蛙眼睛', '🪶 phoenix feathers|凤凰羽毛', '🍄 mushrooms|蘑菇', '🌿 leaves|叶子', '💧 drops of dew|滴露水']

// Generated from rules per MOE grade (§6.3). Prototype covers a few topics only.
export function potionsQuestion(grade: MathGrade, n: number): Question {
  const [ingEn, ingZh] = INGREDIENTS[n % INGREDIENTS.length].split('|')
  let expr = '', answer = '', en = '', zh = ''
  if (grade <= 2) {
    const a = rnd(10, 60), b = rnd(5, 39)
    const add = Math.random() > 0.4 || a < b
    expr = add ? `${a} + ${b}` : `${a} − ${b}`
    answer = String(add ? a + b : a - b)
  } else if (grade <= 4) {
    if (n % 3 === 2) {
      const d = [4, 6, 8, 10][rnd(0, 3)], a = rnd(1, d - 2), b = rnd(1, d - 1 - a)
      expr = `${a}/${d} + ${b}/${d}`
      answer = `${a + b}/${d}`
    } else {
      const a = rnd(12, 49), b = rnd(3, 9)
      expr = `${a} × ${b}`
      answer = String(a * b)
    }
  } else {
    if (n % 3 === 2) {
      const p = [10, 20, 25, 50][rnd(0, 3)], base = [40, 80, 120, 200][rnd(0, 3)]
      expr = `${p}% of ${base}`
      answer = String((p * base) / 100)
    } else {
      const a = rnd(2, 9), b = rnd(2, 9), c = rnd(10, 40)
      expr = `${c} + ${a} × ${b}`
      answer = String(c + a * b)
    }
  }
  en = `The recipe needs ${expr} ${ingEn}. How many?`
  zh = `配方需要 ${expr} 份${ingZh}，一共需要多少？`
  return {
    id: `potions_g${grade}_${String(n + 1).padStart(3, '0')}`,
    subject: 'math',
    classroom: 'potions',
    grade,
    type: 'input',
    prompt: { en, zh },
    image: ingEn.split(' ')[0],
    answer,
    hint: grade >= 5 && expr.includes('×') ? { en: 'Multiply first, then add.', zh: '先算乘法，再算加法。' } : { en: 'Work it out step by step.', zh: '一步一步算。' },
    explanation: { en: `${expr} = ${answer}`, zh: `${expr} = ${answer}` },
  }
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

export function arithmancyQuestions(grade: MathGrade): Question[] {
  const band = grade <= 2 ? 'low' : grade <= 4 ? 'mid' : 'high'
  return SEQUENCES[band].map(([seq, ans, ee, ez], i) => ({
    id: `arithmancy_g${grade}_${String(i + 1).padStart(3, '0')}`,
    subject: 'logic',
    classroom: 'arithmancy',
    grade,
    type: 'sequence',
    prompt: { en: seq.join(', ') + ', ?', zh: seq.join('，') + '，？' },
    image: '🚪',
    answer: String(ans),
    hint: { en: `Look at how ${seq[0]} becomes ${seq[1]}.`, zh: `看看 ${seq[0]} 是怎么变成 ${seq[1]} 的。` },
    explanation: { en: ee, zh: ez },
  }))
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
