import { existsSync } from 'fs';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';

// `dotenv/config`'s default behaviour loads `.env` relative to `process.cwd()`,
// which silently finds nothing (and falls back to pg's own defaults, e.g. a
// different local Postgres on 5432) whenever the backend is launched from
// outside `apps/backend` — e.g. `node apps/backend/dist/src/main.js` from the
// repo root. Walk up from this file's own location instead, so the correct
// `.env` loads no matter what the caller's working directory is.
let dir = __dirname;
for (let i = 0; i < 6; i++) {
  const candidate = join(dir, '.env');
  if (existsSync(candidate)) {
    dotenv.config({ path: candidate });
    break;
  }
  const parent = dirname(dir);
  if (parent === dir) break;
  dir = parent;
}
