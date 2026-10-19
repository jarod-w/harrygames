// All UI strings live here. zh.ts must provide the same keys.
export const en = {
  appTitle: 'Hogwarts',
  appSubtitle: 'The Spell & Arithmancy Trial',
  tapToEnter: 'Tap to enter Hogwarts',
  fanNotice: 'A non-commercial fan project for friends',

  // login
  whoAreYou: 'Who are you, young wizard?',
  newWizard: 'New wizard',
  tapRunes: 'Tap your 4 magic runes',
  wrongRunes: 'Those runes are not right. Try again!',
  locked: 'Too many tries. The door is locked for 3 minutes.',
  forgotRunes: 'Forgot your runes? Ask the headmaster (Dad) to reset them.',
  back: 'Back',
  next: 'Next',
  clear: 'Clear',

  // register
  createProfile: 'Create your wizard profile',
  nickname: 'Wizard name',
  nicknamePh: 'e.g. Little Hermione',
  pickAvatar: 'Pick your avatar',
  englishLevel: 'English level',
  mathGrade: 'Maths grade',
  setRunes: 'Choose 4 magic runes as your password',
  sendOwl: 'Send my letter',
  privacyNote: 'We only keep your wizard name and avatar. Never use your real name.',

  // pending
  owlSending: 'The owl is flying your letter to the headmaster…',
  owlWait: 'When the headmaster approves, you can enter the castle.',

  // sorting
  sortingTitle: 'The Sorting Hat',
  sortingIntro: 'Hmm… let me look inside your head…',
  hatSuggests: 'The Sorting Hat suggests…',
  accept: 'Yes, that one!',
  chooseOther: 'Or choose another house',
  crowdedHint: 'This house is getting crowded. The others need brave wizards too!',

  // wand
  wandTitle: 'Choose your wand core',
  wandNote: 'The core gives a small power and is chosen once. You can buy new wand looks in Diagon Alley later.',
  phoenix: 'Phoenix feather',
  phoenixDesc: '+20% time on every question',
  dragon: 'Dragon heartstring',
  dragonDesc: 'Stronger spells in the Boss battle',
  unicorn: 'Unicorn hair',
  unicornDesc: 'One free mistake each round',

  // card
  wizardCard: 'Hogwarts Wizard Card',
  house: 'House',
  wand: 'Wand',
  begin: 'Begin the story',

  // story
  storyTitle: 'The Vanishing Letters',
  story1: 'On the first day of school, the magic of Hogwarts suddenly stopped working.',
  story2: 'An old book in the Restricted Section was opened, and out escaped Inkshade, a creature that eats letters and numbers!',
  story3: 'Only new students can write the letters and numbers back into the spellbooks. Will you help?',
  imIn: "I'll help!",

  // hub
  castle: 'Hogwarts Castle',
  housePoints: 'House points',
  galleons: 'Galleons',
  curfewIn: 'Lights out in',
  classrooms: 'Classrooms',
  charms: 'Charms',
  charmsDesc: 'Spell the word to fix the charm',
  potions: 'Potions',
  potionsDesc: 'Work out the recipe numbers',
  arithmancy: 'Arithmancy',
  arithmancyDesc: 'Find the pattern to open the door',
  boss: 'Great Hall',
  bossDesc: 'Face the giant Inkshade',
  houseCup: 'House Cup',
  pensieve: 'Pensieve',
  diagonAlley: 'Diagon Alley',
  settings: 'Settings',
  comingSoon: 'Coming soon',
  logout: 'Switch wizard',

  // classroom
  question: 'Question',
  listen: 'Listen',
  spellIt: 'Spell the word',
  brew: 'How much do you need?',
  pattern: 'What comes next?',
  cast: 'Cast!',
  correct: 'Brilliant! The spell is fixed!',
  hintTitle: 'Inkshade left an ink clue…',
  tryAgain: 'Try once more',
  answerWas: 'The answer is',
  intoPensieve: 'This one goes into the Pensieve for later.',
  timeUp: "Time's up!",
  shieldUsed: 'Unicorn hair protected you! Your streak is safe.',
  levelUp: 'Level up! Harder questions coming.',
  levelDown: "Let's try slightly easier ones.",
  sec: 's',

  // result
  lessonComplete: 'Lesson complete!',
  lettersReturned: 'letters returned to the spellbook',
  accuracy: 'Accuracy',
  bestStreak: 'Best streak',
  backToCastle: 'Back to the castle',
  playAgain: 'Play again',

  // boss
  bossName: 'Inkshade',
  yourHp: 'You',
  attack: 'Correct! A letter flies back into the book!',
  counter: 'Inkshade strikes back!',
  bossWin: 'Inkshade is full and sleepy… it becomes the guardian of the library!',

  // house cup
  houseCupTitle: 'The House Cup',
  perWizard: 'points per wizard',
  wizards: 'wizards',
  topAccuracy: 'Top accuracy',
  topStreak: 'Longest streak',
  min50: 'Answer at least 50 questions to join the accuracy board.',

  // pensieve
  pensieveTitle: 'The Pensieve',
  pensieveDesc: 'Memories Inkshade is still hiding. Get each one right twice to take it back.',
  practice: 'Practise these',
  recovered: 'recovered',

  // shop
  shopTitle: 'Ollivanders Wand Looks',
  shopNote: 'Looks only. Your wand core never changes.',
  buy: 'Buy',
  owned: 'Owned',

  // curfew
  lightsOut: 'Lights out!',
  curfewMsg: 'Young wizards need rest. Inkshade is strongest in the dark, so the castle sleeps.',
  lightsBack: 'The castle lights come back in',

  // settings
  language: 'Language',
  speakHelp: 'Tap the speaker buttons to hear text read aloud.',

  // admin
  adminTitle: "Headmaster's Office",
  pendingProfiles: 'Waiting for approval',
  approve: 'Approve',
  reject: 'Reject',
  allPlayers: 'All wizards',
  resetRunes: 'Reset runes',
  stayingAbove: 'Often above grade — consider raising',

  // misc
  rotate: 'Please turn your device sideways for the best magic!',
  protoMenu: 'Prototype screens',
}

export type Strings = typeof en
export type StringKey = keyof Strings
