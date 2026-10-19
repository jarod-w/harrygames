import type { Localized } from '../i18n'
import type { EnglishLevel, HouseId, MathGrade, WandCore } from './types'

export const HOUSES: Record<HouseId, { name: Localized; color: string; trait: Localized; animal: string }> = {
  gryffindor: { name: { en: 'Gryffindor', zh: '格兰芬多' }, color: 'var(--color-gryffindor)', trait: { en: 'Brave', zh: '勇敢' }, animal: '🦁' },
  slytherin: { name: { en: 'Slytherin', zh: '斯莱特林' }, color: 'var(--color-slytherin)', trait: { en: 'Ambitious', zh: '有抱负' }, animal: '🐍' },
  ravenclaw: { name: { en: 'Ravenclaw', zh: '拉文克劳' }, color: 'var(--color-ravenclaw)', trait: { en: 'Wise', zh: '聪慧' }, animal: '🦅' },
  hufflepuff: { name: { en: 'Hufflepuff', zh: '赫奇帕奇' }, color: 'var(--color-hufflepuff)', trait: { en: 'Loyal', zh: '忠诚' }, animal: '🦡' },
}
export const HOUSE_IDS = Object.keys(HOUSES) as HouseId[]

export const AVATARS = ['🦉', '🐈‍⬛', '🐸', '🐇', '🦊', '🐉', '🦄', '🐢', '🐼', '🦔', '🐧', '🐿️']

// 9 runes for the 4-rune password (9^4 = 6561 combos), §Q15
export const RUNES = [
  { id: 'owl', icon: '🦉', name: { en: 'Owl', zh: '猫头鹰' } },
  { id: 'wand', icon: '🪄', name: { en: 'Wand', zh: '魔杖' } },
  { id: 'broom', icon: '🧹', name: { en: 'Broom', zh: '扫帚' } },
  { id: 'bolt', icon: '⚡', name: { en: 'Lightning', zh: '闪电' } },
  { id: 'moon', icon: '🌙', name: { en: 'Moon', zh: '月亮' } },
  { id: 'star', icon: '⭐', name: { en: 'Star', zh: '星星' } },
  { id: 'key', icon: '🗝️', name: { en: 'Key', zh: '钥匙' } },
  { id: 'potion', icon: '🧪', name: { en: 'Potion', zh: '药水' } },
  { id: 'book', icon: '📖', name: { en: 'Book', zh: '书' } },
]

export const ENGLISH_LEVELS: { id: EnglishLevel; name: Localized }[] = [
  { id: 'starters', name: { en: 'Starters', zh: 'Starters' } },
  { id: 'movers', name: { en: 'Movers', zh: 'Movers' } },
  { id: 'flyers', name: { en: 'Flyers', zh: 'Flyers' } },
]
export const MATH_GRADES: MathGrade[] = [1, 2, 3, 4, 5, 6]

export const WAND_CORES: { id: WandCore; icon: string; nameKey: 'phoenix' | 'dragon' | 'unicorn'; descKey: 'phoenixDesc' | 'dragonDesc' | 'unicornDesc' }[] = [
  { id: 'phoenix', icon: '🪶', nameKey: 'phoenix', descKey: 'phoenixDesc' },
  { id: 'dragon', icon: '🐲', nameKey: 'dragon', descKey: 'dragonDesc' },
  { id: 'unicorn', icon: '🦄', nameKey: 'unicorn', descKey: 'unicornDesc' },
]

export const WAND_SKINS = [
  { id: 'skin_oak', name: { en: 'Classic Oak', zh: '经典橡木' }, colors: ['#8b5a2b', '#5c3a1a'], price: 0 },
  { id: 'skin_silver_star', name: { en: 'Silver Star', zh: '银色星光' }, colors: ['#d8dde6', '#8b95a7'], price: 80 },
  { id: 'skin_ruby', name: { en: 'Ruby Spiral', zh: '红宝石螺旋' }, colors: ['#d1495b', '#7a1f2b'], price: 120 },
  { id: 'skin_midnight', name: { en: 'Midnight Ink', zh: '午夜墨色' }, colors: ['#3a2c63', '#120d1f'], price: 150 },
  { id: 'skin_emerald', name: { en: 'Emerald Vine', zh: '翡翠藤蔓' }, colors: ['#3bb273', '#1f6e43'], price: 150 },
  { id: 'skin_gold', name: { en: 'Golden Snitch', zh: '金色飞贼' }, colors: ['#f6dc8f', '#cf9f3c'], price: 300 },
]

// Seconds per question, §2.2 / Q10
export const TIME_BY_ENGLISH: Record<EnglishLevel, number> = { starters: 30, movers: 20, flyers: 15 }
export const timeByMath = (g: MathGrade) => (g <= 2 ? 30 : g <= 4 ? 20 : 15)

export const SORTING_QUESTIONS: { q: Localized; options: { text: Localized; house: HouseId }[] }[] = [
  {
    q: { en: 'You find a locked door in the castle. What do you do?', zh: '你在城堡里发现一扇锁着的门，你会怎么做？' },
    options: [
      { text: { en: 'Open it — adventure awaits!', zh: '打开它——冒险在等我！' }, house: 'gryffindor' },
      { text: { en: 'Find a clever way to unlock it', zh: '想一个聪明的办法打开它' }, house: 'ravenclaw' },
      { text: { en: 'Get my friends to come along', zh: '叫上朋友们一起去' }, house: 'hufflepuff' },
      { text: { en: 'Find out who has the key', zh: '找出谁有钥匙' }, house: 'slytherin' },
    ],
  },
  {
    q: { en: 'Which would you most like to be?', zh: '你最想成为哪种人？' },
    options: [
      { text: { en: 'Brave', zh: '勇敢的' }, house: 'gryffindor' },
      { text: { en: 'Kind', zh: '善良的' }, house: 'hufflepuff' },
      { text: { en: 'Clever', zh: '聪明的' }, house: 'ravenclaw' },
      { text: { en: 'Great', zh: '了不起的' }, house: 'slytherin' },
    ],
  },
  {
    q: { en: 'Pick a magical pet:', zh: '选一只魔法宠物：' },
    options: [
      { text: { en: 'A wise owl', zh: '聪明的猫头鹰' }, house: 'ravenclaw' },
      { text: { en: 'A sneaky cat', zh: '机灵的猫' }, house: 'slytherin' },
      { text: { en: 'A cuddly toad', zh: '可爱的蟾蜍' }, house: 'hufflepuff' },
      { text: { en: 'A fiery phoenix', zh: '火焰凤凰' }, house: 'gryffindor' },
    ],
  },
]
