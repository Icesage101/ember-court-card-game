// Ember Court — the boot: wires the engine to the table, the keyboard and
// the mouse, and runs the game loop (render on every state change). The
// game starts on the title screen; "Take Your Seat" opens round 1.

import { newGame, playCard, resolveClash, nextRound, mulligan, MAX_ROUNDS } from './engine.js';
import { render } from './render.js';
import { sfx, setMuted, isMuted } from './audio.js';
import { stageShot } from './shots.js';

let game = newGame();
let soundOn = true;

const ui = {
  onPlay(cardUid) {
    if (game.phase !== 'choose') return;
    const played = game.youPlayed;
    if (!playCard(game, cardUid)) return;
    sfx.play();
    render(game, ui);
    // The reveal holds a beat so both cards can be read, then scores.
    setTimeout(() => {
      if (game.phase !== 'reveal') return;
      const result = resolveClash(game);
      if (!result) return;
      if (result.winner === 'you') sfx.winTrick();
      else if (result.winner === 'foe') sfx.loseTrick();
      else sfx.flip();
      if (game.lastClash?.youFx?.includes('heal') || game.lastClash?.foeFx?.includes('heal')) sfx.heal();
      if (game.phase === 'won') sfx.victory();
      if (game.phase === 'lost') sfx.defeat();
      render(game, ui);
    }, 900);
  },
};

function startDuel() {
  game = newGame();
  game.phase = 'choose';
  game.log = 'Round 1. The Duchess draws five cards, and the Court waits for yours.';
  sfx.flip();
  render(game, ui);
}

function continueAfterClash() {
  if (game.phase !== 'reveal') return;
  nextRound(game);
  render(game, ui);
}

function bindButtons() {
  document.getElementById('btn-start').addEventListener('click', startDuel);
  document.getElementById('btn-again').addEventListener('click', startDuel);
  document.getElementById('btn-new').addEventListener('click', startDuel);
  document.getElementById('btn-mulligan').addEventListener('click', () => {
    if (mulligan(game)) { sfx.flip(); render(game, ui); }
  });
  document.getElementById('btn-sound').addEventListener('click', (e) => {
    soundOn = !soundOn;
    setMuted(!soundOn);
    e.target.textContent = `Sound: ${soundOn ? 'on' : 'off'}`;
  });
  document.getElementById('btn-help').addEventListener('click', () => {
    document.getElementById('overlay-help').classList.remove('hidden');
  });
  document.getElementById('btn-close-help').addEventListener('click', () => {
    document.getElementById('overlay-help').classList.add('hidden');
  });
  document.getElementById('middle').addEventListener('click', continueAfterClash);
}

function bindKeys() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (game.phase === 'title') startDuel();
      else if (game.phase === 'reveal') continueAfterClash();
      else if (game.phase === 'won' || game.phase === 'lost') startDuel();
      return;
    }
    if (e.key >= '1' && e.key <= '5') {
      const card = game.you.hand[Number(e.key) - 1];
      if (card) ui.onPlay(card.uid);
      return;
    }
    const k = e.key.toLowerCase();
    if (k === 'm' && game.phase === 'choose') {
      if (mulligan(game)) { sfx.flip(); render(game, ui); }
    } else if (k === 'n') {
      startDuel();
    } else if (k === 's') {
      soundOn = !soundOn;
      setMuted(!soundOn);
      document.getElementById('btn-sound').textContent = `Sound: ${soundOn ? 'on' : 'off'}`;
    } else if (k === 'h') {
      document.getElementById('overlay-help').classList.toggle('hidden');
    } else if (k === 'r' && (game.phase === 'won' || game.phase === 'lost')) {
      startDuel();
    }
  });
}

// Staged screenshot poses (?shot=start|play|win|loss) freeze the real game
// in a fixed state; the live game is untouched otherwise.
function applyShot() {
  const shot = new URLSearchParams(window.location.search).get('shot');
  if (!shot) return;
  stageShot(game, shot);
  render(game, ui);
}

bindButtons();
bindKeys();
render(game, ui);
applyShot();

// The driver (and any human tester) reads the live game here.
window.__ember = {
  get game() { return game; },
  startDuel,
  playCard: (uid) => ui.onPlay(uid),
  resolveClash: () => resolveClash(game),
  nextRound: () => nextRound(game),
  MAX_ROUNDS,
};
