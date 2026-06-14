# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A cultivation-themed (修仙) RPG. The backend is a Node.js + Express 5 + PostgreSQL API at the repo root; the frontend is a React 19 + Vite + Tailwind SPA in `frontend/`. Code comments and all user-facing strings (errors, messages) are written in Traditional Chinese — match this when editing.

## Commands

### Backend (repo root)
```bash
npm install                 # required before running tests — a missing dep makes Jest report 0% coverage with silently-failing suites
npm run dev                 # nodemon server.js (auto-reload)
npm start                   # node server.js

npm test                    # all Jest tests (runInBand)
npm run test:unit           # tests/unit only
npm run test:integration    # tests/integration only
npm run test:coverage       # coverage report

npx jest tests/unit/auth.validator.test.js   # single file
npx jest -t "暴擊率 0%"                        # single test by name (names are in Chinese)
```

### Frontend (`frontend/`)
```bash
npm run dev      # Vite dev server
npm run build    # production build
npm run lint     # ESLint (no test runner is configured)
```

### Database
PostgreSQL must be created and seeded manually. SQL lives in `sql/` (run `sql/setup_database.sql` plus the `create_*.sql` files, then `sql/seed_data.sql`). Root-level helper scripts `setup_player_tables.js` and `import_realms.js` run specific imports via `node <script>.js`. Connection comes entirely from env vars (`.env`, see `.env.example`): `DB_HOST/PORT/NAME/USER/PASSWORD`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`.

## Architecture

### Request pipeline
`server.js` mounts everything under `/api` via `src/routes/index.js`, which delegates to per-domain routers (`auth`, `realms`, `inventory`, `skills`, `battle`, `leaderboard`, `shop`, `quests`). Each route file wires the same layered chain:

`route → authenticateToken (JWT) → validate(schema, target) → controller method`

- **Auth** (`src/middleware/auth.middleware.js`): `authenticateToken` verifies the Bearer JWT and sets `req.user = { playerId, username }`. Controllers read `req.user.playerId`. `optionalAuth` is the no-token-allowed variant.
- **Validation** (`src/middleware/validate.middleware.js` + `src/validators/*`): `validate(schema, target='body')` is a factory returning Joi middleware. It uses `{ abortEarly: false, stripUnknown: true }` and **overwrites `req[target]` with the coerced value** — so defaults (e.g. `limit` default 20) and type coercion happen here, not in controllers.
- **Controllers** (`src/controllers/*`) are exported as singleton instances (`module.exports = new XController()`). There is **no service layer** despite README mentions — controllers talk directly to the `pg` pool.

### Database access pattern
`src/config/database.js` exports a single shared `pg` `Pool`. Two patterns are used:
- Simple reads/writes: `pool.query(...)`.
- Multi-step mutations: acquire a client with `pool.connect()`, then `BEGIN` / ... / `COMMIT`, with `ROLLBACK` in `catch` and `client.release()` in `finally`. Every game action that touches currencies, inventory, or realm state follows this transaction shape (see `battle.controller.startBattle`).

### WebSocket layer (`src/websocket/handlers.js`)
The `ws` server shares the HTTP port (created in `server.js` from the same `server`). It maintains an in-memory `onlinePlayers` Map (`playerId → ws`) with `broadcast()` / `sendToPlayer()` helpers. Clients must send an `AUTH` message (JWT) before any other message type; `ws.playerId`/`ws.username` are set on success. Message types are dispatched in a `switch` (`PING`, `GET_REALM_DATA`, `BREAKTHROUGH`, `CHAT_MESSAGE`, etc.). **Important:** realm breakthrough is implemented over WebSocket here (`handleBreakthrough`) in addition to the REST realm controller — keep both in mind when changing breakthrough rules.

### Core domain: realm progression
The central game system is cultivation realms. `realms` (ordered by `realm_order`) each contain `realm_stages` (ordered by `stage_order`, with an `is_extreme` peak flag). A player's position lives in `player_realms` (`current_realm_id`, `current_stage_id`, `current_exp`). Breakthrough advances stage → next realm's first stage, with success rates that drop at extreme stages and can be boosted by items; failure burns ~30% exp. Realm exp is large enough that comparisons use `BigInt`.

### Quest auto-progression
`src/utils/questProgress.js` (`updateQuestProgress(client, playerId, stepType, targetId, incrementBy)`) is called from within game-action transactions (e.g. after a battle win in `battle.controller`) to advance matching in-progress quest steps. It deliberately swallows its own errors (logs only) so quest-tracking failures never roll back the main action.

### Logging
`src/utils/logger.js` is a Winston logger used everywhere. Tests mock it out in `tests/setup.js`.

## Testing notes

- Jest config lives in `package.json`; `tests/setup.js` sets test env vars (`JWT_SECRET`, etc.) and mocks the logger.
- **Integration tests mock the database module**, not a real DB: `jest.mock("../../src/config/database")` returns a fake pool whose `query`/`connect` are controlled per-test (see `tests/integration/battle.routes.test.js`). Build the app in-test with `express()` + `require("../../src/routes")` and sign tokens with the test `JWT_SECRET`.
- Coverage is currently low and concentrated in validators/middleware; most controllers and the WebSocket layer are largely untested.
