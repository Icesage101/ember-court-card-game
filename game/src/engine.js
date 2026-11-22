// Ember Court — the engine: the duel's state, the round flow, the clash
// and the win/loss verdicts. The table is drawn from this state and nothing
// else, so the staged screenshot poses are the same game, frozen mid-duel.

import { buildDeck, shuffle, elementBonus, deckSize } from './cards.js';
import { chooseCard } from './ai.js';

export const MAX_LIFE = 20;
export const MAX_ROUNDS = 12;
export const HAND_SIZE = 5;
export const START_EMBER = 3;
export const MAX_EMBER_PER_ROUND = 6;
export const EMBER_CAP = 10;

export function newGame(rand = Math.random) {
  const deck = shuffle(buildDeck(), rand);
  const state = {
    phase: 'title', // title | choose | reveal | won | lost
    round: 1,
    deck,
    discard: [],
    you: { life: MAX_LIFE, ember: START_EMBER, hand: [], tricks: 0, shield: 0, streak: 0 },
    foe: { life: MAX_LIFE, ember: START_EMBER, hand: [], tricks: 0, shield: 0, streak: 0 },
    youPlayed: null,
    foePlayed: null,
    foePick: null, // the Duchess's card, hidden until the reveal
    lastClash: null,
    log: 'The Duchess shuffles her hand and waits.',
    mulliganUsed: false,
    favor: false, // Court Favor: +1 ember every round once earned
    damageDealt: 0,
    damageTaken: 0,
  };
  drawUpTo(state, state.you);
  drawUpTo(state, state.foe);
  return state;
}

export function drawUpTo(state, side) {
  while (side.hand.length < HAND_SIZE) {
    if (state.deck.length === 0) {
      if (state.discard.length === 0) return;
      state.deck = shuffle(state.discard, Math.random);
      state.discard = [];
    }
    side.hand.push(state.deck.shift());
  }
}

function emberIncome(state) {
  return Math.min(MAX_EMBER_PER_ROUND, START_EMBER + state.round - 1) + (state.favor ? 1 : 0);
}

// Apply a card's on-play effect the moment it is laid down.
function applyEffect(state, side, other, card) {
  if (!card.fx) return '';
  if (card.fx === 'draw') {
    drawUpTo(state, side);
    if (card.id === 'jester') side.life = Math.min(MAX_LIFE, side.life + 1);
    return card.id === 'jester' ? 'draws a card and heals 1' : 'draws a card';
  }
  if (card.fx === 'heal') {
    side.life = Math.min(MAX_LIFE, side.life + 2);
    return 'heals 2 life';
  }
  if (card.fx === 'shield') {
    side.shield += 3;
    return 'raises a shield of 3';
  }
  if (card.fx === 'siphon') {
    const stolen = Math.min(1, other.ember);
    other.ember -= stolen;
    side.ember = Math.min(EMBER_CAP, side.ember + stolen);
    return stolen > 0 ? 'siphons 1 ember' : 'siphons nothing — the rival is dry';
  }
  return '';
}

function dealDamage(state, target, amount, attacker) {
  let left = amount;
  if (target.shield > 0) {
    const blocked = Math.min(target.shield, left);
    target.shield -= blocked;
    left -= blocked;
  }
  if (left > 0) {
    target.life = Math.max(0, target.life - left);
    if (attacker === state.you) state.damageDealt += left;
    else state.damageTaken += left;
  }
  return left;
}

// The player lays a card. Returns false when the play is illegal
// (wrong phase, card not in hand, or not enough ember).
export function playCard(state, cardUid) {
  if (state.phase !== 'choose') return false;
  const idx = state.you.hand.findIndex((c) => c.uid === cardUid);
  if (idx < 0) return false;
  const card = state.you.hand[idx];
  if (card.cost > state.you.ember) return false;
  state.you.hand.splice(idx, 1);
  state.you.ember -= card.cost;
  state.youPlayed = card;
  state.discard.push(card);
  const foeCard = chooseCard(state);
  state.foePick = foeCard;
  if (foeCard) {
    const fidx = state.foe.hand.findIndex((c) => c.uid === foeCard.uid);
    state.foe.hand.splice(fidx, 1);
    state.foe.ember -= foeCard.cost;
    state.foePlayed = foeCard;
    state.discard.push(foeCard);
  }
  // Effects fire on the play, before the clash is scored.
  const youFx = applyEffect(state, state.you, state.foe, card);
  const foeFx = foeCard ? applyEffect(state, state.foe, state.you, foeCard) : '';
  state.lastClash = { youFx, foeFx };
  state.phase = 'reveal';
  return true;
}

// Score the revealed clash. The stronger card wins the trick and wounds
// the loser by the power gap; a tie wounds both sides for 1.
export function resolveClash(state) {
  if (state.phase !== 'reveal') return null;
  const you = state.youPlayed;
  const foe = state.foePlayed;
  let result;
  if (!foe) {
    // The Duchess could afford nothing: she passes, the player takes the trick free.
    state.you.tricks += 1;
    state.you.streak += 1;
    state.foe.streak = 0;
    dealDamage(state, state.foe, 2, state.you);
    result = { winner: 'you', damage: 2, youPower: you.power, foePower: 0, tie: false, foePassed: true };
  } else {
    const youPower = you.power + elementBonus(you.element, foe.element);
    const foePower = foe.power + elementBonus(foe.element, you.element);
    if (youPower > foePower) {
      let dmg = youPower - foePower + (you.fx === 'rally' ? 2 : 0);
      const dealt = dealDamage(state, state.foe, dmg, state.you);
      state.you.tricks += 1;
      state.you.streak += 1;
      state.foe.streak = 0;
      result = { winner: 'you', damage: dealt, youPower, foePower, tie: false };
    } else if (foePower > youPower) {
      let dmg = foePower - youPower + (foe.fx === 'rally' ? 2 : 0);
      const dealt = dealDamage(state, state.you, dmg, state.foe);
      state.foe.tricks += 1;
      state.foe.streak += 1;
      state.you.streak = 0;
      result = { winner: 'foe', damage: dealt, youPower, foePower, tie: false };
    } else {
      dealDamage(state, state.foe, 1, state.you);
      dealDamage(state, state.you, 1, state.foe);
      state.you.streak = 0;
      state.foe.streak = 0;
      result = { winner: null, damage: 1, youPower, foePower, tie: true };
    }
  }
  // Two tricks in a row earns Court Favor: +1 ember every round after.
  if (state.you.streak >= 2 && !state.favor) {
    state.favor = true;
    result.favor = 'you';
  } else if (state.foe.streak >= 2 && !state.favor) {
    state.favor = true;
    result.favor = 'foe';
  }
  // The trick winner banks +1 ember for the next round.
  if (result.winner === 'you') state.you.ember = Math.min(EMBER_CAP, state.you.ember + 1);
  if (result.winner === 'foe') state.foe.ember = Math.min(EMBER_CAP, state.foe.ember + 1);
  state.lastClash = { ...state.lastClash, ...result };
  state.log = clashLine(state, result);
  state.phase = checkEnd(state) ? state.phase : 'reveal';
  return result;
}

function clashLine(state, r) {
  const y = state.youPlayed;
  const f = state.foePlayed;
  const fxNote = (who, fx) => (fx ? ` — ${who} ${fx}` : '');
  const youFx = state.lastClash?.youFx;
  const foeFx = state.lastClash?.foeFx;
  if (r.foePassed) {
    return `The Duchess could afford nothing and passes. Your ${y.name} takes the trick and deals 2 damage.`;
  }
  const head = `Your ${y.name} (${r.youPower}) meets her ${f.name} (${r.foePower}).`;
  const fx = fxNote('You', youFx) + fxNote('The Duchess', foeFx);
  if (r.tie) return `${head} A dead tie — both sides take 1 damage.${fx}`;
  if (r.winner === 'you') {
    return `${head} You win the trick and deal ${r.damage} damage.${r.favor === 'you' ? ' Court Favor is yours: +1 ember every round!' : ''}${fx}`;
  }
  return `${head} The Duchess wins the trick and deals ${r.damage} damage.${r.favor === 'foe' ? ' She holds Court Favor now: +1 ember every round!' : ''}${fx}`;
}

// Advance after a clash: clear the table, pay out the round's ember,
// draw back up, and either open the next round or end the duel.
export function nextRound(state) {
  if (state.phase !== 'reveal') return false;
  state.youPlayed = null;
  state.foePlayed = null;
  state.foePick = null;
  state.lastClash = null;
  if (checkEnd(state)) return true;
  state.round += 1;
  state.you.ember = Math.min(EMBER_CAP, state.you.ember + emberIncome(state));
  state.foe.ember = Math.min(EMBER_CAP, state.foe.ember + emberIncome(state));
  drawUpTo(state, state.you);
  drawUpTo(state, state.foe);
  state.log = `Round ${state.round}. The Duchess draws, and the Court waits for your card.`;
  state.phase = 'choose';
  return true;
}

export function checkEnd(state) {
  if (state.you.life <= 0) {
    state.phase = 'lost';
    return true;
  }
  if (state.foe.life <= 0) {
    state.phase = 'won';
    return true;
  }
  if (state.round >= MAX_ROUNDS && state.phase === 'reveal') {
    state.tiedFinish = state.you.life === state.foe.life;
    // On a tie the Court keeps its seat: the challenger must finish ahead.
    state.phase = state.you.life > state.foe.life ? 'won' : 'lost';
    return true;
  }
  return false;
}

// Once per game, discard the hand and draw five fresh cards.
export function mulligan(state) {
  if (state.phase !== 'choose' || state.mulliganUsed) return false;
  state.discard.push(...state.you.hand);
  state.you.hand = [];
  state.mulliganUsed = true;
  drawUpTo(state, state.you);
  state.log = 'You sweep your hand aside and draw five fresh cards. The Duchess smiles — she will not forget that.';
  return true;
}

export function deckCount(state) {
  return state.deck.length + state.discard.length;
}

export { deckSize };
