// Ember Court — the cards: every card in the deck, the four elements and
// the cycle that decides the +2 element bonus. All names, art glyphs and
// effects are original to this game.

// Element cycle: FLAME beats THORN, THORN beats TIDE, TIDE beats FLAME.
// GALE stands outside the cycle and never gains or grants the bonus.
export const ELEMENTS = {
  flame: { label: 'FLAME', glyph: '\u{1F525}', color: '#b3401f', beats: 'thorn' },
  tide: { label: 'TIDE', glyph: '\u{1F30A}', color: '#2266a0', beats: 'flame' },
  thorn: { label: 'THORN', glyph: '\u{1F33F}', color: '#2e6b2e', beats: 'tide' },
  gale: { label: 'GALE', glyph: '\u{1F32C}', color: '#8a6d1f', beats: null },
};

export function elementBonus(attacker, defender) {
  const el = ELEMENTS[attacker];
  return el && el.beats === defender ? 2 : 0;
}

// Effects fire the moment a card is played, before the clash is scored:
//  draw — draw 1 extra card; heal — restore 2 life; shield — block 3 damage
//  from the next hit; siphon — steal 1 ember from the rival; rally — deal +2
//  damage if this card wins the trick.
export const CARD_DEFS = [
  { id: 'imp', name: 'Ember Imp', element: 'flame', cost: 1, power: 2, fx: null, fxText: '', copies: 2 },
  { id: 'sprite', name: 'River Sprite', element: 'tide', cost: 1, power: 2, fx: 'draw', fxText: 'Draw 1 card', copies: 2 },
  { id: 'rat', name: 'Bramble Rat', element: 'thorn', cost: 1, power: 2, fx: null, fxText: '', copies: 2 },
  { id: 'lark', name: 'Zephyr Lark', element: 'gale', cost: 1, power: 2, fx: 'draw', fxText: 'Draw 1 card', copies: 2 },
  { id: 'knight', name: 'Cinder Knight', element: 'flame', cost: 2, power: 3, fx: null, fxText: '', copies: 2 },
  { id: 'serpent', name: 'Mist Serpent', element: 'tide', cost: 2, power: 3, fx: null, fxText: '', copies: 2 },
  { id: 'wolf', name: 'Briar Wolf', element: 'thorn', cost: 2, power: 4, fx: null, fxText: '', copies: 1 },
  { id: 'hawk', name: 'Storm Hawk', element: 'gale', cost: 2, power: 3, fx: 'siphon', fxText: 'Steal 1 ember', copies: 1 },
  { id: 'feather', name: 'Phoenix Feather', element: 'flame', cost: 3, power: 5, fx: 'heal', fxText: 'Heal 2 life', copies: 1 },
  { id: 'tidecaller', name: 'Tidecaller', element: 'tide', cost: 3, power: 4, fx: 'heal', fxText: 'Heal 2 life', copies: 1 },
  { id: 'queen', name: 'Thorn Queen', element: 'thorn', cost: 3, power: 5, fx: 'shield', fxText: 'Shield 3', copies: 1 },
  { id: 'duelist', name: 'Sky Duelist', element: 'gale', cost: 3, power: 5, fx: null, fxText: '', copies: 1 },
  { id: 'jester', name: 'Court Jester', element: 'gale', cost: 2, power: 2, fx: 'draw', fxText: 'Draw 1, heal 1', copies: 1 },
  { id: 'guardian', name: 'Hearth Guardian', element: 'flame', cost: 3, power: 4, fx: 'shield', fxText: 'Shield 3', copies: 1 },
  { id: 'roar', name: "Dragon's Roar", element: 'flame', cost: 4, power: 6, fx: 'rally', fxText: 'Win: +2 damage', copies: 1 },
  { id: 'grasp', name: "Kraken's Grasp", element: 'tide', cost: 4, power: 6, fx: 'siphon', fxText: 'Steal 1 ember', copies: 1 },
  { id: 'colossus', name: 'Root Colossus', element: 'thorn', cost: 4, power: 6, fx: null, fxText: '', copies: 1 },
  { id: 'tempest', name: 'Tempest', element: 'gale', cost: 4, power: 6, fx: 'rally', fxText: 'Win: +2 damage', copies: 1 },
];

let uid = 0;

// Build a fresh 24-card deck from the definitions above.
export function buildDeck() {
  const deck = [];
  for (const def of CARD_DEFS) {
    for (let i = 0; i < def.copies; i++) {
      deck.push({ ...def, uid: `c${uid++}` });
    }
  }
  return deck;
}

// Fisher-Yates shuffle; a supplied random function keeps staged
// screenshots deterministic.
export function shuffle(deck, rand = Math.random) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function deckSize() {
  return CARD_DEFS.reduce((n, d) => n + d.copies, 0);
}
