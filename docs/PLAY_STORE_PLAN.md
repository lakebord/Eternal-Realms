# Play Store launch plan

Status: **on hold — the game lives on the website for now** (https://eternal-realms-26r.pages.dev).
When the owner asks "what's next for the Play Store?", start from the first unchecked item below.

## Done
- [x] Code on GitHub (`lakebord/Eternal-Realms`), auto-deploy to Cloudflare Pages on every push to `main`
- [x] Supabase backend: accounts (email + guest), cloud saves, chat, leaderboard, parcels, presence
- [x] Database security rules (RLS): private saves, players only write their own rows, only admins write the shared world
- [x] In-game account deletion (Google Play requirement)
- [x] Owner account is admin (runs the shared world)

## Owner housekeeping (quick, do anytime)
- [ ] Roll the Cloudflare API token once more (it appeared in a screenshot) and update the `CLOUDFLARE_API_TOKEN` GitHub secret
- [ ] Supabase → Authentication → URL Configuration: Site URL `https://eternal-realms-26r.pages.dev`, redirect `https://eternal-realms-26r.pages.dev/**`

## Next steps, in order
1. [ ] **"Real players only" switch** — turn off the simulated adventurers; replace with clearly-labelled hired NPC companions, solo-scaled dungeons/bosses, NPC arena champions, a merchant-stocked auction house
2. [ ] **Server-side authority (anti-cheat)** — move combat results, loot, gold and XP to Supabase Edge Functions / a small Node server; the shared-world simulation runs 24/7 on a server instead of the admin's phone (~$5–20/month host)
3. [ ] **Chat safety** — report and block players, basic moderation tools (Google Play user-generated-content policy)
4. [ ] **Captcha** on sign-up / guest sign-in (Supabase Auth → Bot protection)
5. [ ] **Android app** — wrap the website with Capacitor; icon, splash screen, back button, audio when backgrounded; app loads the live site so most updates skip store review
6. [ ] **Google Play Console** — $25 one-time developer account; privacy policy page; Data safety form; content rating questionnaire; closed test with at least 12 testers for 14 days (check current rules) before production
7. [ ] **Launch day** — upgrade Supabase to Pro ($25/month, no pausing + daily backups), flip "real players only", release

## Who does what
- Claude: all code, tests, server setup, store listing text, privacy policy draft, step-by-step guides
- Owner: account sign-ups and payments, Android Studio build + app signing key, Play Console forms
