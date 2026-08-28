# Contributing to SAATH

Thanks for taking a look! SAATH is intentionally small and dependency-light, and the goal is
to keep it that way — easy to read, easy to self-host.

## Project layout

```
frontend/  React + Vite app (src/views, src/components, src/store, src/lib). Builds to static files.
           android/ + ios/ are the Capacitor shells for the standalone mobile app (docs/MOBILE.md).
api/       backend — server.js (Node, no framework), password login, account admin, web push.
web/       multi-stage Dockerfile (builds frontend → nginx) + nginx.conf (serves app, proxies /api).
media/     exercise img/gif (gitignored, fetched at runtime).
docs/      self-hosting guide.
mcp/       optional Model Context Protocol server — read-only stdio bridge for LLM apps
           (Claude Desktop, Cursor, …) to query a user's workouts/1RM/muscle balance. Not in
           the Docker build; only runs when an LLM client spawns it. See mcp/README.md.
```

## Running for development

```bash
cp .env.example .env
docker compose up -d --build      # api + web + media on :8080
# frontend hot reload:
cd frontend && npm install && npm run dev
# training logic (progression rules, 1RM, how a session is read back):
cd frontend && npm test
```

## Guidelines

- **Keep it dependency-light.** The frontend uses React + Router + Zustand and nothing else;
  new deps (front or back) are a hard sell. Keep `api/` close to its current small runtime surface.
- **Match the style.** Small components, clear names, comments only where the "why" isn't obvious.
  State lives in the Zustand store (`src/store`); pure helpers in `src/lib`.
- **Don't commit** the exercise media (`media/`) or `data/` — they're gitignored.
- **Test the flow** you touched — click through the affected screens (and the workout flow) in a
  browser before opening a PR.
- **Training logic gets a unit test.** Anything deciding what you lift next, or reading a logged
  session back, belongs in a pure helper in `src/lib` with tests beside it (`npm test`). These
  rules are easy to get subtly wrong and nearly impossible to verify by clicking — the
  progression engine grew two real bugs that only a test pinned down.

## Good first issues

- Additional starter plans (upper/lower, full-body, 5×5…)
- More languages for the exercise instructions (the dataset ships several)
- Percentage / training-max programming (5/3/1-style) on top of the progression engine in
  `src/lib/progression.js` — the policy interface is already there
- Accessibility passes on the workout and chart screens

## Where to ask what

| You have | Goes to |
| --- | --- |
| A question, or self-hosting that won't behave | [An issue labelled `question`](https://github.com/sanjaymaverick-cmd/SAATH/issues) |
| An idea you're not sure about yet | [An issue labelled `idea`](https://github.com/sanjaymaverick-cmd/SAATH/issues) |
| A reproducible bug | [Issues](https://github.com/sanjaymaverick-cmd/SAATH/issues) |
| A change you've already built | A pull request |

Questions and ideas may be filed as labelled GitHub issues so they are distinguishable from
agreed work and remain searchable for future maintainers.

## Reporting bugs

Open an issue with: what you did, what you expected, what happened, and your browser/OS. If it's
about login, include your `RP_ID`/`ORIGIN` (not the `data/` contents) — many deployment login
issues are an origin mismatch.

By contributing you agree your work is licensed under the project's [GNU AGPL v3.0](LICENSE).
