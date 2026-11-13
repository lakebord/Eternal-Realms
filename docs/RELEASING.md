# How updates are made and released

The owner stacks changes up and releases them together, like a live game. **Never push game changes straight to `main`.**

| Branch | Site | Who sees it |
|---|---|---|
| `main` | https://eternal-realms-26r.pages.dev | Everyone (LIVE) |
| `next` | https://next.eternal-realms-26r.pages.dev | The owner and testers (TEST) |

Both publish automatically through `.github/workflows/deploy.yml` on every push.

## Day to day
1. `git checkout next && git pull` — all new work goes here.
2. Make the change, `node tools/build.js`, run the tests in `tools/` (at least `e2e.js`, `mobile.js`, `combatui.js`).
3. Add a line for the change to the **top entry** of `PATCH_NOTES` in `src/version.js` (create the next version's entry if it doesn't exist yet, e.g. `{v:'1.1.0', date:'', title:'', notes:[...]}`). Write notes for players, not developers.
4. Commit and push `next`. The test site updates in about 30 seconds. Tell the owner what to try there.

## Release day (when the owner says "release it")
1. In `src/version.js`: set `GAME_VERSION` to the new version, fill in the entry's `date` and `title`.
2. Build, run the full test set.
3. Merge `next` into `main` (`git checkout main && git merge --no-ff next`), push `main`. The live site updates in about 30 seconds.
4. Returning players see a "What's new in vX.Y.Z" popup once. New players don't.
5. If something breaks: Cloudflare dashboard → Workers & Pages → eternal-realms → Deployments → roll back to the previous one (one click), then fix on `next`.

## Version numbers
- `1.0.0` → `1.1.0` for a normal content update; `1.1.0` → `1.1.1` for a quick bug-fix release; `2.0.0` for something huge.

## Test site and data
- The test site must never use the live database. `src/supa.js` picks `SUPA_TEST` on `next.` hosts; while `SUPA_TEST` is empty, the test site runs offline with local saves.
- To give the test site online features: create a second Supabase project ("Eternal Realms Test"), run `supabase/migrations/*.sql` in it, enable anonymous sign-ins, and put its URL + publishable key in `SUPA_TEST`.

## Optional, not set up yet
- Scheduled releases (e.g. every Saturday 6 PM) via a scheduled GitHub Action that merges `next` into `main`.
