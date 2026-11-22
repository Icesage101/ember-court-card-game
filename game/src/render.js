// Ember Court — the table: every pixel of the game is DOM built from the
// engine state, so a screenshot is the game itself, never a mock-up.

import { ELEMENTS } from './cards.js';
import { MAX_LIFE, MAX_ROUNDS } from './engine.js';

const $ = (id) => document.getElementById(id);

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

// One card face: cost in the gold coin, power in the red coin, element,
// art glyph, name, effect line, and the keyboard key that plays it.
export function cardElement(card, opts = {}) {
  const node = el('div', 'card' + (opts.small ? ' small' : ''));
  const elInfo = ELEMENTS[card.element];
  node.append(el('div', 'cost', String(card.cost)));
  node.append(el('div', 'power', String(card.power)));
  const elLine = el('div', `el ${card.element}`, elInfo.label);
  node.append(elLine);
  node.append(el('div', 'art', elInfo.glyph));
  node.append(el('div', 'name', card.name));
  if (card.fxText) node.append(el('div', 'fx', card.fxText));
  if (opts.key) node.append(el('div', 'key', opts.key));
  if (opts.onClick) {
    node.classList.add('playable');
    if (opts.disabled) node.classList.add('too-expensive');
    node.addEventListener('click', opts.onClick);
  }
  return node;
}

function cardBack() {
  const node = el('div', 'card back small');
  node.append(el('div', 'crest', '\u{1F451}'));
  node.append(el('div', 'lbl', 'EMBER COURT'));
  return node;
}

function renderEmbers(node, ember, maxIncome) {
  node.replaceChildren();
  for (let i = 0; i < 10; i++) {
    const pip = el('span', 'pip' + (i < ember ? ' on' : '') + (i >= maxIncome ? ' max' : ''));
    node.append(pip);
  }
}

function renderLife(fill, text, life) {
  fill.style.width = `${Math.max(0, (life / MAX_LIFE) * 100)}%`;
  text.textContent = `${life} / ${MAX_LIFE} LIFE`;
}

export function render(state, ui) {
  $('roundnum').textContent = state.round;
  $('deckline').textContent = `Deck: ${state.deck.length} cards · Discard: ${state.discard.length}`;
  renderLife($('you-life-fill'), $('you-life-text'), state.you.life);
  renderLife($('foe-life-fill'), $('foe-life-text'), state.foe.life);
  renderEmbers($('you-embers'), state.you.ember, 10);
  renderEmbers($('foe-embers'), state.foe.ember, 10);
  $('you-ember-num').textContent = ` ${state.you.ember}`;
  $('foe-ember-num').textContent = ` ${state.foe.ember}`;
  $('you-tricks').textContent = state.you.tricks;
  $('foe-tricks').textContent = state.foe.tricks;
  $('you-shield').textContent = state.you.shield;
  $('foe-shield').textContent = state.foe.shield;
  $('favor').textContent = state.favor ? (state.you.streak >= 2 ? 'You' : 'Duchess') : '–';
  $('btn-mulligan').disabled = state.phase !== 'choose' || state.mulliganUsed;

  // The Duchess's hand is always face down: the count is public, the cards are not.
  const foeHand = $('foe-hand');
  foeHand.replaceChildren();
  for (let i = 0; i < state.foe.hand.length; i++) foeHand.append(cardBack());

  // The player's hand: playable cards lift on hover, unaffordable ones grey out.
  const youHand = $('you-hand');
  youHand.replaceChildren();
  state.you.hand.forEach((card, i) => {
    const affordable = card.cost <= state.you.ember;
    const node = cardElement(card, {
      key: String(i + 1),
      disabled: !affordable,
      onClick: state.phase === 'choose' ? () => ui.onPlay(card.uid) : null,
    });
    if (state.phase === 'choose' && affordable) node.classList.add('playable');
    youHand.append(node);
  });

  // The table: what each side played, or the empty slots.
  const youSlot = $('you-played');
  const foeSlot = $('foe-played');
  youSlot.replaceChildren();
  foeSlot.replaceChildren();
  if (state.youPlayed) {
    const n = cardElement(state.youPlayed, { small: true });
    n.classList.add('played');
    if (state.lastClash?.winner === 'you') n.classList.add('winner-glow');
    youSlot.append(n);
  } else {
    youSlot.append(el('div', 'empty', 'Your card\ngoes here'));
  }
  if (state.phase === 'reveal' && state.foePlayed) {
    const n = cardElement(state.foePlayed, { small: true });
    n.classList.add('played');
    if (state.lastClash?.winner === 'foe') n.classList.add('winner-glow');
    foeSlot.append(n);
  } else if (state.phase === 'choose' && state.foe.hand.length > 0) {
    const n = cardBack();
    foeSlot.append(n);
  } else {
    foeSlot.append(el('div', 'empty', 'The Duchess\nplays here'));
  }

  // Banner and log.
  const banner = $('banner');
  banner.className = '';
  if (state.phase === 'choose') {
    banner.textContent = 'Choose a card to play';
  } else if (state.phase === 'reveal' && state.lastClash) {
    const r = state.lastClash;
    if (r.tie) { banner.textContent = 'A dead tie — both take 1'; banner.className = ''; }
    else if (r.winner === 'you') { banner.textContent = `You win the trick — ${r.damage} damage!`; banner.className = 'good'; }
    else if (r.winner === 'foe') { banner.textContent = `The Duchess wins — ${r.damage} damage!`; banner.className = 'bad'; }
    else banner.textContent = 'Cards revealed';
  } else if (state.phase === 'won') {
    banner.textContent = 'VICTORY';
    banner.className = 'good';
  } else if (state.phase === 'lost') {
    banner.textContent = 'DEFEAT';
    banner.className = 'bad';
  }
  $('log').textContent = state.log;
  $('hint').innerHTML = state.phase === 'reveal'
    ? 'Press <b>Enter</b> or click anywhere on the table to continue.'
    : 'Click a card or press <b>1–5</b> to play it. <b>Enter</b> continues after a clash.';
  $('status').textContent = `${state.log} Your life ${state.you.life}, Duchess life ${state.foe.life}, round ${state.round} of ${MAX_ROUNDS}.`;

  // Overlays.
  $('overlay-title').classList.toggle('hidden', state.phase !== 'title');
  const end = $('overlay-end');
  const over = state.phase === 'won' || state.phase === 'lost';
  end.classList.toggle('hidden', !over);
  if (over) {
    const won = state.phase === 'won';
    $('end-title').textContent = won ? 'VICTORY' : 'DEFEAT';
    $('end-sub').textContent = won
      ? 'The Ash Duchess bows. The Court is yours.'
      : (state.tiedFinish ? 'A dead tie — the Court keeps its seat.' : 'The Ash Duchess keeps her seat. Your ember is spent.');
    $('end-score').innerHTML =
      `You <b>${state.you.life}</b> life — Duchess <b>${state.foe.life}</b> life · ` +
      `Tricks <b>${state.you.tricks}–${state.foe.tricks}</b> · Rounds <b>${state.round}</b> · ` +
      `Damage dealt <b>${state.damageDealt}</b>`;
    $('end-detail').textContent = won
      ? 'Twelve rounds or a fallen Duchess — either way, the Court remembers the challenger who played the sharper hand.'
      : 'The cards were honest and the Duchess was sharper. Shuffle up and take your seat again.';
  }
}
