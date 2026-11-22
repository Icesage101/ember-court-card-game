// Ember Court — the Ash Duchess: how the AI opponent picks its card.
// She cannot see the player's pick. She weighs raw power, the chance her
// element lands the +2 bonus against what the player is likely to hold,
// her own ember purse, and the value of each effect — then plays the best
// card she can afford, with a little nerve so no two duels play alike.

import { elementBonus } from './cards.js';

// Rough value of each effect in power terms, so the Duchess can compare
// a plain bruiser against a card that draws, heals, shields or steals.
const FX_VALUE = { draw: 1.5, heal: 1.5, shield: 2, siphon: 1.5, rally: 1 };

function cardValue(card, hand, state) {
  let value = card.power;
  // The element bonus is worth half its face value here: she does not know
  // what the player will play, so she prices the odds, not the promise.
  let bonusChance = 0;
  for (const other of hand) {
    if (elementBonus(card.element, other.element) > 0) bonusChance += 1;
  }
  value += (bonusChance / Math.max(1, hand.length)) * 1;
  if (card.fx) value += FX_VALUE[card.fx] ?? 0;
  // She guards her ember early: a 4-cost card in round 1 is a luxury.
  if (state.round <= 2 && card.cost >= 4) value -= 1.5;
  // When she is bleeding, healing and shields are worth more than power.
  if (state.foe.life <= 8 && (card.fx === 'heal' || card.fx === 'shield')) value += 2;
  // When the player is one good hit from falling, she spends freely.
  if (state.you.life <= 6) value += card.power * 0.25;
  return value;
}

export function chooseCard(state, rand = Math.random) {
  const hand = state.foe.hand;
  const affordable = hand.filter((c) => c.cost <= state.foe.ember);
  if (affordable.length === 0) return null;
  let best = null;
  let bestValue = -Infinity;
  for (const card of affordable) {
    // A small jitter keeps her from playing the same line every duel.
    const value = cardValue(card, state.you.hand, state) + rand() * 0.8;
    if (value > bestValue) {
      bestValue = value;
      best = card;
    }
  }
  return best;
}
