// Ember Court — staged states for screenshots. ?shot=start | play | win |
// loss sets the game up in a fixed, deterministic pose and freezes it, so a
// screenshot shows the real game at its best: the title over the table, a
// mid-duel clash with both hands and both life totals visible, the victory
// screen and the defeat screen. Every pose is built through the game's own
// state — real cards from the real deck, real life totals — never drawn by hand.

import { CARD_DEFS } from './cards.js';
import { MAX_LIFE } from './engine.js';

function findDef(id) {
  const def = CARD_DEFS.find((d) => d.id === id);
  return { ...def, uid: `shot-${def.id}` };
}

function handOf(ids) {
  return ids.map(findDef);
}

export function stageShot(game, name) {
  const s = game;
  if (name === 'start') {
    s.phase = 'title';
    s.round = 1;
    s.log = 'The Duchess shuffles her hand and waits. Flame beats Thorn, Thorn beats Tide, Tide beats Flame — a winning element strikes +2 power.';
    return;
  }
  if (name === 'play') {
    // Round 4, mid-duel: both sides bloodied, hands full, a clash just
    // resolved in the player's favour — Phoenix Feather over Mist Serpent.
    s.phase = 'reveal';
    s.round = 4;
    s.you.life = 15;
    s.foe.life = 11;
    s.you.ember = 4;
    s.foe.ember = 3;
    s.you.tricks = 2;
    s.foe.tricks = 1;
    s.you.streak = 1;
    s.you.hand = handOf(['knight', 'serpent', 'wolf', 'hawk', 'queen']);
    s.foe.hand = handOf(['imp', 'sprite', 'rat', 'lark', 'duelist']);
    s.youPlayed = findDef('feather');
    s.foePlayed = findDef('wolf');
    s.lastClash = { youFx: 'heals 2 life', foeFx: '', winner: 'you', damage: 3, youPower: 7, foePower: 4, tie: false };
    s.log = 'Your Phoenix Feather (7) meets her Briar Wolf (4). You win the trick and deal 3 damage. — You heals 2 life';
    s.deck = handOf(['imp', 'sprite', 'rat', 'lark', 'knight', 'serpent']);
    s.discard = handOf(['wolf', 'hawk']);
    return;
  }
  if (name === 'win') {
    s.phase = 'won';
    s.round = 9;
    s.you.life = 9;
    s.foe.life = 0;
    s.you.ember = 5;
    s.foe.ember = 1;
    s.you.tricks = 6;
    s.foe.tricks = 3;
    s.damageDealt = 24;
    s.damageTaken = 11;
    s.you.hand = handOf(['roar', 'tempest', 'colossus', 'grasp', 'duelist']);
    s.foe.hand = handOf(['imp', 'rat']);
    s.youPlayed = findDef('roar');
    s.foePlayed = findDef('colossus');
    s.lastClash = { youFx: '', foeFx: '', winner: 'you', damage: 4, youPower: 8, foePower: 6, tie: false };
    s.log = "Your Dragon's Roar (8) meets her Root Colossus (6). You win the trick and deal 4 damage.";
    s.deck = handOf(['imp', 'sprite', 'rat']);
    s.discard = handOf(['wolf', 'hawk', 'knight', 'serpent', 'lark']);
    return;
  }
  if (name === 'loss') {
    s.phase = 'lost';
    s.round = 8;
    s.you.life = 0;
    s.foe.life = 12;
    s.you.ember = 2;
    s.foe.ember = 4;
    s.you.tricks = 2;
    s.foe.tricks = 5;
    s.damageDealt = 8;
    s.damageTaken = 20;
    s.you.hand = handOf(['imp', 'sprite', 'rat', 'lark']);
    s.foe.hand = handOf(['queen', 'feather', 'tidecaller', 'wolf', 'hawk']);
    s.youPlayed = findDef('serpent');
    s.foePlayed = findDef('queen');
    s.lastClash = { youFx: '', foeFx: 'raises a shield of 3', winner: 'foe', damage: 4, youPower: 3, foePower: 7, tie: false };
    s.log = 'Your Mist Serpent (3) meets her Thorn Queen (7). The Duchess wins the trick and deals 4 damage. — The Duchess raises a shield of 3';
    s.deck = handOf(['imp', 'sprite', 'rat', 'lark']);
    s.discard = handOf(['wolf', 'hawk', 'knight']);
    return;
  }
  // Unknown shot name: leave the live game alone.
}

export { MAX_LIFE };
