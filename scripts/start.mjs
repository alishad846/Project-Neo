// Project Neo — one-command startup.
//
//   pnpm start   (or)   npm start
//
// Brings the WHOLE stack up in the right order:
//   1. ensures apps/backend/.env exists
//   2. builds and starts every datastore container (postgres, redis, minio, ollama, extractor)
//   3. waits for Postgres to be healthy
//   4. runs DB migrations, and seeds sample data on the very first run
//   5. builds the shared packages + backend + web + extension (Turbo-cached, so
//      only the first run is slow)
//   6. runs the backend API and the marketing website together in the foreground
//
// Press Ctrl+C to stop the API + website. To turn off the containers too, run
// `pnpm stop` in another terminal (or after Ctrl+C). Containers and volumes
// stay in place, so the next `pnpm start` comes back up instantly.

import { execSync, spawn } from 'node:child_process';
import { existsSync, copyFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const COMPOSE = `docker compose -f infra/docker-compose.yml`;
// Datastores only — the backend runs on the host (below), so we do NOT start the
// compose `backend` service or port 3000 would clash.
const SERVICES = 'postgres redis minio ollama extractor';
const SEED_SENTINEL = join(root, '.neo-seeded');

const log = (m) => console.log(`\n\x1b[1m\x1b[36m▶ ${m}\x1b[0m`);
const ok = (m) => console.log(`\x1b[32m  ✓ ${m}\x1b[0m`);
const run = (cmd) => execSync(cmd, { cwd: root, stdio: 'inherit' });
const quiet = (cmd) => execSync(cmd, { cwd: root, stdio: 'pipe' });
// Blocking sleep with no extra deps: a node process stays alive until its timer fires.
const sleep = (ms) => { try { execSync(`node -e "setTimeout(()=>{}, ${ms})"`); } catch {} };

function ensureEnv() {
  log('Checking backend .env');
  const env = join(root, 'apps/backend/.env');
  const example = join(root, 'apps/backend/.env.example');
  if (existsSync(env)) return ok('.env already present');
  if (existsSync(example)) {
    copyFileSync(example, env);
    ok('created apps/backend/.env from .env.example');
  } else {
    console.warn('  ! no .env.example found — make sure apps/backend/.env exists');
  }
}

function dockerUp() {
  log('Building and starting datastore containers (postgres, redis, minio, ollama, extractor)');
  // Rebuild the extractor image so source changes and the configured model are
  // not masked by a stale container from an earlier checkout.
  run(`${COMPOSE} up -d --build ${SERVICES}`);
  ok('containers started');
}

function ensureOllamaModel() {
  const model = process.env.OLLAMA_MODEL ?? 'qwen2.5vl:3b';
  log(`Checking Ollama model (${model})`);
  try {
    quiet(`${COMPOSE} exec -T ollama ollama show ${model}`);
    ok(`${model} is available`);
  } catch {
    console.log(`  ! ${model} is not installed — downloading it now (first start may take a while)`);
    run(`${COMPOSE} exec -T ollama ollama pull ${model}`);
    ok(`${model} is available`);
  }
}

function waitForPostgres() {
  log('Waiting for Postgres to accept connections (port 5433)');
  const deadline = Date.now() + 90_000; // give first-boot image pulls some room
  while (Date.now() < deadline) {
    try {
      quiet(`${COMPOSE} exec -T postgres pg_isready -U neo`);
      return ok('Postgres is ready');
    } catch {
      process.stdout.write('  … still starting\r');
      sleep(2000);
    }
  }
  throw new Error('Postgres did not become ready in time. Is Docker Desktop running?');
}

function migrateAndSeed() {
  log('Applying database migrations');
  run('pnpm --filter @neo/backend db:migrate');
  ok('migrations applied');

  if (!existsSync(SEED_SENTINEL)) {
    log('Seeding sample catalogue (first run only)');
    run('pnpm --filter @neo/backend seed');
    writeFileSync(SEED_SENTINEL, `seeded at ${new Date().toISOString()}\n`);
    ok('sample products seeded');
  } else {
    ok('sample data already seeded (delete .neo-seeded to reseed)');
  }
}

function buildAll() {
  log('Building shared packages, backend, website and extension (cached after first run)');
  run('pnpm exec turbo run build --filter=@neo/backend --filter=@neo/web --filter=@neo/extension');
  ok('build complete');
}

function serve() {
  log('Starting the backend API and the marketing website');
  console.log('\n\x1b[1m  Backend  → http://localhost:3000');
  console.log('  Website  → http://localhost:4173');
  console.log('  Extension→ load unpacked from apps/extension/.output/chrome-mv3\x1b[0m');
  console.log('\n  (Press Ctrl+C to stop these two. Run "pnpm stop" to also stop Docker.)\n');

  const opts = { cwd: root, stdio: 'inherit', shell: true };
  const backend = spawn('node', ['apps/backend/dist/src/main.js'], opts);
  const web = spawn('pnpm', ['--filter', '@neo/web', 'exec', 'vite', 'preview', '--port', '4173'], opts);

  const shutdown = () => {
    console.log('\n\x1b[33m▶ Stopping backend + website…\x1b[0m');
    try { backend.kill(); } catch {}
    try { web.kill(); } catch {}
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  backend.on('exit', (c) => { if (c) console.error(`backend exited (${c})`); });
  web.on('exit', (c) => { if (c) console.error(`website exited (${c})`); });
}

try {
  ensureEnv();
  dockerUp();
  ensureOllamaModel();
  waitForPostgres();
  migrateAndSeed();
  buildAll();
  serve();
} catch (err) {
  console.error(`\n\x1b[31m✗ Startup failed: ${err.message}\x1b[0m`);
  console.error('  Make sure Docker Desktop is running, then try again.');
  process.exit(1);
}
