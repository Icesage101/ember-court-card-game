// Ember Court — the hand-in for the make.fun best card game bounty.
//
// This program is the entrypoint of the repository: it gathers the game
// (game/), the screenshots (screenshots/) and a dossier describing them
// (dossier.json) into the output directory the grader reads. The game is
// plain static files a desktop browser loads offline; the dossier is built
// with the kit's vendored library so the gate can rebuild it byte for byte.
//
// Run it outside the grader with an output stand-in:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The repository root is the directory this file lives in.
const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The competition's own caps, from its gate: the dossier text stays under
// 160 KiB, at most 4 screenshots of 256 KiB each, the game under 993 files
// and 48 MiB. Enforcing them here means a bad bundle fails loudly at the
// hand-in instead of silently on the server.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function fail(message) {
  throw new Error(`Ember Court hand-in: ${message}`);
}

function countFiles(dir) {
  let files = 0;
  let bytes = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const info = statSync(path);
    if (info.isDirectory()) {
      const sub = countFiles(path);
      files += sub.files;
      bytes += sub.bytes;
    } else {
      files += 1;
      bytes += info.size;
    }
  }
  return { files, bytes };
}

// The game must exist, be inside its caps, and its index must be a file.
const gameDir = join(here, 'game');
if (!existsSync(join(gameDir, 'index.html'))) fail('game/index.html is missing');
const gameSize = countFiles(gameDir);
if (gameSize.files > CAPS.game_max_files) fail(`game/ has ${gameSize.files} files, over the ${CAPS.game_max_files} cap`);
if (gameSize.bytes > CAPS.game_max_bytes) fail(`game/ is ${gameSize.bytes} bytes, over the ${CAPS.game_max_bytes} cap`);

// Screenshots: 3 or 4, each a whole PNG or JPEG under the 256 KiB cap.
const shotsDir = join(here, 'screenshots');
if (!existsSync(shotsDir)) fail('screenshots/ is missing');
const shots = readdirSync(shotsDir).filter((n) => !n.startsWith('.')).sort();
if (shots.length < 3 || shots.length > CAPS.screenshots.max) {
  fail(`screenshots/ holds ${shots.length} images, need 3 or 4`);
}
for (const name of shots) {
  const info = statSync(join(shotsDir, name));
  if (!/\.(png|jpe?g)$/i.test(name)) fail(`screenshot ${name} is not a PNG or JPEG`);
  if (info.size > CAPS.screenshots.max_bytes) fail(`screenshot ${name} is ${info.size} bytes, over the 256 KiB cap`);
}

// Prepare the output directory. Only its CONTENTS are cleared: the grader
// mounts the output directory itself, and removing that mount point fails
// with EBUSY and kills the run — a failure the heist entry hit and fixed
// by clearing children instead of the directory.
mkdirSync(outDir, { recursive: true });
for (const name of readdirSync(outDir)) {
  rmSync(join(outDir, name), { recursive: true, force: true });
}

cpSync(gameDir, join(outDir, 'game'), { recursive: true });
cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });
writeFileSync(join(outDir, 'dossier.json'), buildDossier(resolve(outDir), CAPS));
console.log(`Ember Court handed in to ${outDir}: ${gameSize.files} game files, ${shots.length} screenshots`);
