// Ember Court — sound: every effect is synthesized with WebAudio, no
// audio files and no network request. A card flip, a coin of ember, a
// wound, a fanfare for the win and a low sting for the loss.

let ctx = null;
let muted = false;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, at, dur, type = 'sine', gain = 0.12) {
  const c = audio();
  if (!c || muted) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime + at);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + at + dur);
  osc.connect(g).connect(c.destination);
  osc.start(c.currentTime + at);
  osc.stop(c.currentTime + at + dur + 0.05);
}

export const sfx = {
  flip() { tone(520, 0, 0.08, 'triangle', 0.1); tone(760, 0.05, 0.08, 'triangle', 0.08); },
  play() { tone(330, 0, 0.1, 'triangle', 0.12); tone(495, 0.07, 0.12, 'triangle', 0.1); },
  winTrick() { tone(523, 0, 0.12, 'sine', 0.12); tone(659, 0.09, 0.12, 'sine', 0.12); tone(784, 0.18, 0.2, 'sine', 0.12); },
  loseTrick() { tone(392, 0, 0.14, 'sawtooth', 0.05); tone(311, 0.1, 0.2, 'sawtooth', 0.05); },
  heal() { tone(660, 0, 0.12, 'sine', 0.09); tone(880, 0.1, 0.16, 'sine', 0.09); },
  shield() { tone(220, 0, 0.18, 'triangle', 0.1); tone(440, 0.08, 0.14, 'triangle', 0.08); },
  victory() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.3, 'sine', 0.13)); },
  defeat() { [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.16, 0.3, 'sawtooth', 0.05)); },
};

export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }
