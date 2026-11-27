# Eternal Realms Online

A 2.5D fantasy MMORPG for the browser and Android: chibi sprite heroes in a 3D world.

**Play:** https://eternal-realms-26r.pages.dev · Android app: `eternal-realms.apk` on the same site.

- `game/` — the whole game (static site): `index.html`, `style.css`, `js/` (game, world, sprites, data), `assets/`, `vendor/three.js`.
- Base & job levels, six jobs, stat points, skills, cards, refining, shops, storage, field boss (MVP), emotes, local saves.
- Characters and monsters are drawn by `game/js/sprites.js`; world models are KayKit (CC0), see `game/CREDITS.md`.
- `tools/build-apk.sh` — wraps the site in an Android app (built by the deploy workflow).
- Deploys: `main` → live site, `next` → test site (next.eternal-realms-26r.pages.dev).

Run locally: `cd game && python3 -m http.server` and open http://localhost:8000.
