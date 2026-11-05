# Eternal Realms

## Play
- Live game: https://eternal-realms-26r.pages.dev
- Every push to `main` builds the game and publishes it to Cloudflare Pages automatically (`.github/workflows/deploy.yml`).
- Online features (accounts, saves, chat, leaderboard, presence) run on Supabase; database setup lives in `supabase/migrations/`.


A living fantasy text MMORPG that runs in the browser. You start as an ordinary adventurer in a world that already has 500 autonomous adventurers, 20 guilds, seven kingdoms and an economy, and it all keeps going whether or not you take part.

**Play:** https://claude.ai/artifact/CMdRL8qSD4H5cnyrwFD66X (claude.ai, with real multiplayer features). You can also open `index.html` from any static host or straight from disk; that version is single-player with local saves.

## What's in it
- **Character creation:** username, name, gender, age and appearance; 10 races, 12 backgrounds, 15 starting classes, 5 starting locations and 4 difficulties (Ironman is permadeath).
- **Progression:** levels 1–100 with attribute points, and 30 masteries (weapons, magic schools, professions) that improve with use and unlock techniques and spells for any class. You can retrain your class and keep your masteries. 16 advanced classes need levels, mastery and a trial with a mentor.
- **World:** 37 locations across 6 regions, hidden places you find through rumors, travel that takes in-game time, dungeons with floors and bosses, world bosses, a 9-chapter main story and a 22-entry lore codex.
- **Combat:** tactical turn-based fights with initiative, front and back rows, elements, status effects, cooldowns, parry and counter, taming, summons that evolve, party tactics, boss phases, and PvP (duels, ranked arena, a weekly Grand Tournament, open-world PvP zones).
- **Simulated players:** each one has its own personality, goals, schedule, gear, gold, friends, rivals and memories. They hunt, run dungeons in real parties, trade on the auction house, craft, duel, join and leave guilds, stage coups, retire or change careers. All of it comes from tracked game state, nothing is rolled at random.
- **Chat:** Global, Local, Trade, Recruit, Guild, Party, System and whispers. Simulated players talk to each other, react to world events and reply to you. They answer from what they actually know, may ask your level before agreeing to group, and can ignore you.
- **Economy and politics:** supply and demand per city, wars that capture contested towns, treaties, caravans, plagues and other events.
- **Leaderboards:** 11 categories, kept separately for the simulated world and for real players.

## Expansion I: Storms & Shadows
- **5 new classes:** Bard, Shaman, Warlock, Artificer and Ranger (with a wolf companion). Each has 4 skills and an advanced path (Skald, Stormcaller, Hexlord, Machinist, Warden). New weapon types: lutes, totems, scythes, crossbows, rapiers, warhammers and cloaks.
- **About 20 new enemies:** werewolves, ghouls, banshees, imps, hellhounds, magma golems, cultists, minotaurs, pirates, merfolk, storm elementals, thunder rocs, crystal golems and more.
- **4 new dungeons:** Goblin Warrens, Crystal Caverns, Web Depths and Thunderhead Crags.
- **5 new world bosses:** Elder Treant, Storm Roc, Sandworm Colossus, the Kraken and the Void Herald.
- **7 equipment sets** with 2- and 4-piece bonuses, plus 10 new legendaries.
- **10 specialty shops** with named keepers, daily stock, set pieces and a "today's treasure" unique.
- **Quests:** 7 faction questlines (3 steps each, with unique rewards), requests posted by simulated adventurers (which raise their affinity with you), and escort quests.
- **Realm events:** Blood Moon, Blessing, Eclipse, Merchant Fair, Gold Rush, Treasure Hunt, town Invasions (defend in waves), Drake Migration and the Great Storm.
- **The world keeps moving:** when anyone returns, the realm fast-forwards through every hour that passed (up to two weeks) and shows a summary of what happened. The owner's game hosts the shared world (`world/*` in the database), so friends load the same progressed world.

## Playing with friends
1. Open the game link and use **Share** to invite friends by email. They need a claude.ai account.
2. Each friend creates their own character. Saves stay in their own browser, so each phone keeps its own hero. **Menu → Export save** backs a hero up or moves it to another device.
3. While several people have the game open, the **live room** shows who's online (header and Party & Guild). It shares Global, Trade, Recruit and Local chat, lets you duel each other's champions, and runs **co-op**: invite a friend from their profile, and while you're both in the same place each hero fights in the other's battles, with XP and gold for both.

## Multiplayer (claude.ai version)
- Real players who open the same link share Global, Trade and Recruit chat (rate-limited, with basic filtering and muting), public profiles, real-player leaderboards, async duels against each other's champions (stats-accurate, AI-controlled), courier parcels (gold or an item), and a count of who's online.
- Real players are marked with ● and simulated players are never presented as real.
- Characters save to your claude.ai account (privately) and to the browser. You can also export and import a save code.
- Optional Claude AI narrates freeform actions and makes some direct replies smarter. Everything also works rule-based with AI turned off.

**Limits:** each player's simulated world runs in their own browser. It starts from the same seed, so names and history match at the start, but the simulated adventurers drift apart over time. Parties and guilds are with simulated players only. Whispers to real players are stored in the shared database, so they are not private. **Upgrade path:** move `sim.js` to a server tick (Node and a database) and serve NPC state through the same `players`/`chat` collections. The engine has no DOM dependencies, so this works without changes (see `tools/simtest.js`).

## Development
```
node tools/build.js      # src/ → dist/eternal-realms.html (artifact) + index.html (standalone)
node tools/simtest.js    # headless world simulation + combat balance check
node tools/e2e.js        # Playwright playthrough (create, explore, fight, chat, invite)
node tools/mobile.js     # phone-size dark-mode screenshots / overflow check
```
Source: `art.js` (icons, generated scenery), `data.js` (world content), `engine.js` (items, stats), `sim.js` (simulated players, guilds, economy, politics), `player.js`, `combat.js`, `chat.js`, `net.js` (saves, multiplayer), `ui.js`/`ui2.js`, `style.css`.
