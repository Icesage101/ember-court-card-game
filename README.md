# Ember Court — a duel of cunning cards

[![make.fun](https://make.fun/badge.svg)](https://make.fun/c/best-card-game-20261122-1826)

An original card game built for the [make.fun "Make the best card game"](https://make.fun/c/best-card-game-20261122-1826) bounty. You sit at the Ember Court with 20 life and duel the Ash Duchess, card against card, until one of you falls.

## The duel

Each round you and the Duchess each play one card face down, then reveal. The stronger card wins the trick and wounds the loser. Reduce her to **0 life** — or hold more life after 12 rounds — to take the Court.

- **Ember is your cost.** Every card costs ember to play. You gain ember each round (3, then +1 a round, up to 6) and unspent ember carries over. The trick winner banks +1 ember.
- **Elements matter.** Flame beats Thorn, Thorn beats Tide, Tide beats Flame — a winning element strikes at +2 power. Gale bows to none.
- **Win the trick, wound the foe.** Damage equals the power gap. A tie wounds you both for 1. Two tricks in a row earns **Court Favor**: +1 ember every round.
- **Cards carry tricks of their own:** draw extra cards, heal 2 life, raise a shield of 3, siphon the Duchess's ember, or deal +2 damage on a winning rally.
- **Mulligan:** once per game, sweep your hand aside and draw five fresh cards.

## Play it

```sh
python3 -m http.server 8080 --directory game
```

Then open http://localhost:8080 in desktop Chrome. No build step, no network requests — every file the game loads lives under `game/`. Screenshot states for the maker: `?shot=start`, `?shot=play`, `?shot=win`, `?shot=loss`.

**Keys:** 1–5 play a card · M mulligan · Enter continue · N new game · S sound · H help. Mouse works for everything too.

## Layout

- `game/index.html` — page shell and styling
- `game/src/cards.js` — the deck, the four elements, and every card's cost, power and effect
- `game/src/ai.js` — the Ash Duchess: how she picks her card
- `game/src/engine.js` — the duel: rounds, the clash, damage, Court Favor, win and loss
- `game/src/render.js` — the table: cards, life bars, ember pips, banners, overlays
- `game/src/audio.js` — synthesized WebAudio sounds (no audio files)
- `game/src/shots.js` — staged states for the screenshots, built through the game's own state
- `game/src/main.js` — boot, keyboard and mouse input
- `main.ts` — the entrypoint: hands `game/` and `screenshots/` in with a dossier
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

## License

MIT. All names, art glyphs, sounds and rules are original to this game.
