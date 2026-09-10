// Project Neo — one-command shutdown.
//
//   pnpm stop   (or)   npm stop
//
// Turns off every Neo container (docker compose stop) — containers AND data
// volumes are KEPT, so the next `pnpm start` comes back up instantly with
// your catalogue intact. To fully remove the containers (and optionally
// wipe data), run:
//
//   pnpm stop -- --down        (or)   node scripts/stop.mjs --down
//   pnpm stop -- --wipe        (or)   node scripts/stop.mjs --wipe

import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const COMPOSE = `docker compose -f infra/docker-compose.yml`;
const wipe = process.argv.includes('--wipe');
const down = process.argv.includes('--down');

const log = (m) => console.log(`\n\x1b[1m\x1b[36m▶ ${m}\x1b[0m`);

try {
  if (wipe) {
    log('Stopping all containers AND wiping data volumes');
    execSync(`${COMPOSE} down -v`, { cwd: root, stdio: 'inherit' });
    // let the next start reseed a fresh database
    execSync('node -e "require(\'fs\').rmSync(require(\'path\').join(process.cwd(),\'.neo-seeded\'),{force:true})"',
      { cwd: root, stdio: 'ignore' });
    console.log('\n\x1b[32m  ✓ Everything stopped and data wiped. Next start will reseed.\x1b[0m\n');
  } else if (down) {
    log('Removing all containers (data volumes kept)');
    execSync(`${COMPOSE} down`, { cwd: root, stdio: 'inherit' });
    console.log('\n\x1b[32m  ✓ Containers removed. Your data is preserved for next time.\x1b[0m\n');
  } else {
    log('Turning off all containers (containers + data volumes kept)');
    execSync(`${COMPOSE} stop`, { cwd: root, stdio: 'inherit' });
    console.log('\n\x1b[32m  ✓ Everything turned off. Next "pnpm start" will restart the same containers instantly.\x1b[0m\n');
  }
} catch (err) {
  console.error(`\n\x1b[31m✗ Shutdown failed: ${err.message}\x1b[0m`);
  process.exit(1);
}
