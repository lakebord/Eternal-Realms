// Exhaustive UI crawler: opens every tab the way a player would, presses every button on every screen,
// visits every location, uses every item, fights, and reports problems:
//   errors (page errors, console errors, "Something went wrong" toasts)
//   bad text on screen (undefined, NaN, [object Object])
//   layout (sideways scroll, tap targets too small, buttons covered by the header/bottom bar, clipped labels)
//   navigation (tabs not reachable from the visible nav, modals without a way out)
// Usage: node tools/crawl.js [phone|desktop]   (screenshots go to $SHOTS if set)
const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');
const MODE = process.argv[2] || 'phone';
const SHOTS = process.env.SHOTS || '';
const SKIP = new Set(['delacct', 'delacctgo', 'signout', 'wipe', 'wipeask', 'importask', 'contcloud', 'authmode', 'authguest',
  'newchar', 'dlexp', 'copyexp', 'export', 'sound', 'cont', 'save', 'journey']);
const issues = [];
const seen = new Set();
function issue(where, kind, detail) {
  const key = kind + '|' + detail;
  if (seen.has(key)) return;
  seen.add(key);
  issues.push({ where, kind, detail });
}

(async () => {
  const b = await chromium.launch();
  const ctx = MODE === 'phone' ? await b.newContext({ ...devices['Pixel 7'] }) : await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  let where = 'start';
  p.on('pageerror', e => issue(where, 'page error', e.message + ' :: ' + String(e.stack||'').split('\n').slice(1,5).join(' | ')));
  p.on('console', m => { if (m.type() === 'error') issue(where, 'console error', m.text().slice(0, 200)); });
  await p.goto('file://' + path.resolve(__dirname, '../index.html'));
  await p.waitForTimeout(800);
  await p.click('[data-a=newchar]');
  await p.fill('#cc_user', 'Crawler');
  await p.fill('#cc_name', 'Crawly McTest');
  await p.click('.ccside .b.gilt');
  await p.waitForTimeout(800);
  // enough gold, levels and points that shops, training, crafting and higher areas are all reachable
  await p.evaluate(() => { const P = S.P; P.gold = 500000; for (let i = 0; i < 40; i++) gainXp(xpNext(P.level)); P._st = null; P.hp = stats(P).mhp || 9999; UI.dirty = true; render(); });

  const shot = async name => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, `${MODE}-${name}.png`) }); };

  // ---- checks run on whatever is on screen ----
  async function scan(label) {
    where = label;
    const r = await p.evaluate(() => {
      const out = [];
      const W = innerWidth;
      if (document.documentElement.scrollWidth > W + 1) out.push(['sideways scroll', `page is ${document.documentElement.scrollWidth}px wide on a ${W}px screen`]);
      const txt = document.body.innerText;
      const bad = txt.match(/.{0,30}(\bundefined\b|\bNaN\b|\[object Object\]|\bnull\b).{0,30}/);
      if (bad) out.push(['bad text', bad[0].replace(/\s+/g, ' ')]);
      const fixed = [...document.querySelectorAll('#hdr,#bnav,#ticker,#toasts,.toast')].filter(e => e.offsetParent !== null || getComputedStyle(e).position === 'fixed');
      const els = [...document.querySelectorAll('#main [data-a], #modal:not([hidden]) [data-a], #combat:not([hidden]) [data-a]')]
        .filter(e => e.offsetParent !== null && e.getBoundingClientRect().width > 0);
      for (const e of els) {
        const rc = e.getBoundingClientRect();
        const id = `${e.dataset.a}${e.dataset.v ? '=' + e.dataset.v : ''} "${(e.innerText || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 30)}"`;
        if (e.tagName !== 'A' && (rc.height < 30 || rc.width < 30)) out.push(['small tap target', `${id} is ${Math.round(rc.width)}x${Math.round(rc.height)}px`]);
        if (e.scrollWidth > e.clientWidth + 3 && getComputedStyle(e).overflow !== 'visible' && e.clientWidth > 0) out.push(['clipped label', id]);
        if (rc.right > W + 1 || rc.left < -1) out.push(['off screen', `${id} at x ${Math.round(rc.left)}..${Math.round(rc.right)}`]);
      }
      return out;
    });
    for (const [k, d] of r) issue(label, k, d);
  }

  // is a button (once scrolled into the middle of the screen) actually tappable, or covered by something?
  async function coverCheck(label) {
    const r = await p.evaluate(async () => {
      const out = [];
      // scroll all the way down: anything still hidden under a bar at that point can never be tapped
      window.scrollTo(0, document.documentElement.scrollHeight);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const els = [...document.querySelectorAll('#main [data-a]')].filter(e => e.offsetParent !== null);
      for (const e of els) {
        const rc = e.getBoundingClientRect();
        if (rc.bottom < 0 || rc.top > innerHeight) continue;
        const x = rc.left + rc.width / 2, y = rc.top + rc.height / 2;
        if (y < 0 || y > innerHeight) continue;
        const hit = document.elementFromPoint(x, y);
        if (hit && !e.contains(hit) && !hit.contains(e)) {
          const by = hit.closest('#bnav,#ticker,#hdr,#toasts,.toast,#chatdock') || hit;
          if (by.id === 'hdr' || hit.closest('svg')) continue;   // top items scroll back down from under the header; map pins may overlap each other
          out.push(`${e.dataset.a}${e.dataset.v ? '=' + e.dataset.v : ''} covered by ${by.id ? '#' + by.id : by.className || by.tagName} even when scrolled to the very bottom`);
        }
      }
      window.scrollTo(0, 0);
      return out;
    });
    for (const d of r) issue(label, 'covered button', d);
  }

  async function errToast(label) {
    const t = await p.evaluate(() => [...document.querySelectorAll('.toast')].map(x => x.innerText).join(' | '));
    if (/something went wrong/i.test(t)) issue(label, 'action crashed', t.slice(0, 200));
  }

  async function finishCombat() {
    const t0 = Date.now();
    while (Date.now() - t0 < 90000) {   // enemy turns play out on timers, so give a long fight real time
      const st = await p.evaluate(() => ({ c: UI.inCombat(), ended: !!(C && C.ended) }));
      if (!st.c) return;
      const close = await p.$('#combat [data-a=cclose]');
      if (close) { await p.evaluate(() => document.querySelector('#combat [data-a=cclose]').dispatchEvent(new MouseEvent('click',{bubbles:true}))); await p.waitForTimeout(80); continue; }
      const atk = await p.$('#combat [data-a=ca][data-v=attack]');
      if (atk) await p.evaluate(() => document.querySelector('#combat [data-a=ca][data-v=attack]').dispatchEvent(new MouseEvent('click',{bubbles:true})));
      else await p.evaluate(() => { const b = document.querySelector('#combat [data-a]'); if (b) b.dispatchEvent(new MouseEvent('click',{bubbles:true})); });
      await p.waitForTimeout(120);
    }
    issue(where, 'stuck in combat', 'fight still running after 90s: ' + await p.evaluate(() => C ? `round ${C.round} waiting=${C.waiting} ended=${C.ended} enemies=${C.enemies.map(e => e.name + ':' + Math.round(e.hp)).join(',')}` : 'no C'));
    await p.evaluate(() => { if (C) { C.ended = true; C.closed = true; } UI.dirty = true; render(); });
  }

  async function resetView(tab) {
    await finishCombat();
    await p.evaluate(t => { while (UI.modalStack && UI.modalStack.length) closeModal(); if (!document.getElementById('modal').hidden) closeModal(); S.P.hp = Math.max(S.P.hp, 1); if (S.P.dead) S.P.dead = false; act('tab', t); }, tab);
    await p.waitForTimeout(60);
  }

  // press every button on the current screen once (deduplicated), checking after each press
  async function pressAll(tab, label, limitPerAction = 4) {
    const list = await p.evaluate(() => [...document.querySelectorAll('#main [data-a]')].filter(e => e.offsetParent !== null)
      .map(e => ({ a: e.dataset.a, v: e.dataset.v || '' })));
    const per = {};
    const done = new Set();
    for (const { a, v } of list) {
      if (SKIP.has(a)) continue;
      const k = a + '|' + v;
      if (done.has(k)) continue;
      per[a] = (per[a] || 0) + 1;
      if (per[a] > limitPerAction) continue;
      done.add(k);
      where = `${label} > ${a}${v ? '=' + v : ''}`;
      await p.evaluate(({ a, v }) => {
        const e = [...document.querySelectorAll('#main [data-a]')].find(x => x.dataset.a === a && (x.dataset.v || '') === v);
        if (e) e.dispatchEvent(new MouseEvent('click',{bubbles:true}));
      }, { a, v });
      await p.waitForTimeout(90);
      await errToast(where);
      // a modal opened: check it, press its buttons too (not the destructive ones), and make sure it can be closed
      const modal = await p.evaluate(() => !document.getElementById('modal').hidden);
      if (modal) {
        await scan(where + ' (popup)');
        const canClose = await p.evaluate(() => !!document.querySelector('#modal [data-a=close], #modal .x, #modal [aria-label=Close], #modal [data-a=cclose]'));
        if (!canClose) issue(where, 'popup without a close button', 'only Escape or tapping outside closes it');
        const mlist = await p.evaluate(() => [...document.querySelectorAll('#modal [data-a]')].filter(e => e.offsetParent !== null).map(e => ({ a: e.dataset.a, v: e.dataset.v || '' })));
        for (const m of mlist.slice(0, 12)) {
          if (SKIP.has(m.a) || m.a === 'close') continue;
          where = `${label} > ${a} > popup ${m.a}${m.v ? '=' + m.v : ''}`;
          await p.evaluate(m => { const e = [...document.querySelectorAll('#modal [data-a]')].find(x => x.dataset.a === m.a && (x.dataset.v || '') === m.v); if (e) e.dispatchEvent(new MouseEvent('click',{bubbles:true})); }, m);
          await p.waitForTimeout(80);
          await errToast(where);
          if (await p.evaluate(() => UI.inCombat())) { await scan(where + ' (battle)'); await finishCombat(); }
          if (await p.evaluate(() => document.getElementById('modal').hidden)) break;
        }
      }
      if (await p.evaluate(() => UI.inCombat())) { await scan(where + ' (battle)'); await finishCombat(); }
      await resetView(tab);
    }
  }

  // ---- 1) navigation: every tab reachable from what is visible, then everything on it ----
  const TABS = await p.evaluate(() => TABS.map(t => t[0]));
  for (const t of TABS) {
    where = `nav to ${t}`;
    // reach it like a player: bottom bar (phone) / side nav (desktop), or the More menu
    let reached = false;
    await p.evaluate(() => { while (UI.modalStack && UI.modalStack.length) closeModal(); if (!document.getElementById('modal').hidden) closeModal(); window.scrollTo(0, 0); });
    await p.waitForTimeout(80);
    const tryClick = async (sel) => { const h = await p.$(sel); if (!h) return false; try { await h.click({ timeout: 2500 }); return true; } catch (e) { issue(where, 'blocked tap', `${sel}: ${e.message.split('\n')[0]}`); return false; } };
    if (await tryClick(`#bnav [data-v=${t}]:visible`) || await tryClick(`#nav [data-v=${t}]:visible`)) reached = true;
    else if (await tryClick('#bnav [data-a=more]:visible')) {
      await p.waitForTimeout(200);
      if (await tryClick(`#modal [data-a=gotab][data-v=${t}]:visible`)) reached = true;
    }
    if (!reached) { issue(where, 'not reachable', `no visible way to open the ${t} tab`); await p.evaluate(t => act('tab', t), t); }
    await p.waitForTimeout(150);
    const on = await p.evaluate(() => UI.tab);
    if (on !== t) issue(where, 'navigation', `tapping ${t} opened ${on}`);
    await scan(`tab ${t}`);
    await coverCheck(`tab ${t}`);
    await shot(`tab-${t}`);
    await pressAll(t, `tab ${t}`);
  }

  // ---- 2) every location: the World tab and its services ----
  const LOCS_ = await p.evaluate(() => Object.keys(LOCS));
  for (const loc of LOCS_) {
    await p.evaluate(l => { S.P.loc = l; S.P._st = null; S.P.hp = stats(S.P).mhp; act('tab', 'world'); }, loc);
    await p.waitForTimeout(80);
    await scan(`world @ ${loc}`);
    await pressAll('world', `world @ ${loc}`, 3);
    // shops / services / map entry of this place
    for (const sub of ['map']) { await p.evaluate(s => act('tab', s), sub); await scan(`${sub} @ ${loc}`); }
  }
  await shot('world-last');

  // ---- 3) every item: into the bag, then open / use / equip / sell from the item popup ----
  const KEYS = await p.evaluate(() => Object.keys(ITEMS));
  await p.evaluate(keys => { const P = S.P; P.loc = Object.keys(LOCS)[0]; for (const k of keys) invAdd(P, k, 3); for (let i = 0; i < 12; i++) P.inv.push(randomGear(Math.max(1, P.level - i * 3))); act('tab', 'bag'); }, KEYS);
  await p.waitForTimeout(150);
  await scan('bag (full)');
  await coverCheck('bag (full)');
  await shot('bag-full');
  await pressAll('bag', 'bag (items)', 60);

  // ---- 4) a few fights in different places ----
  for (const loc of LOCS_.filter((_, i) => i % 4 === 0)) {
    where = `fight @ ${loc}`;
    await p.evaluate(l => { S.P.loc = l; S.P._st = null; S.P.hp = stats(S.P).mhp; if (LOCS[l].mon && LOCS[l].mon.length) startEncounter(l); render(); if (UI.inCombat()) renderCombat(); }, loc);
    await p.waitForTimeout(100);
    if (await p.evaluate(() => UI.inCombat())) {
      await scan(`battle @ ${loc}`);
      await shot(`battle-${loc}`);
      // every combat command once
      const cmds = await p.evaluate(() => [...document.querySelectorAll('#combat [data-a]')].filter(e => e.offsetParent !== null).map(e => ({ a: e.dataset.a, v: e.dataset.v || '' })));
      for (const c of cmds.slice(0, 20)) {
        if (!(await p.evaluate(() => UI.inCombat() && !C.ended))) break;
        where = `battle @ ${loc} > ${c.a}=${c.v}`;
        await p.evaluate(c => { const e = [...document.querySelectorAll('#combat [data-a]')].find(x => x.dataset.a === c.a && (x.dataset.v || '') === c.v); if (e) e.dispatchEvent(new MouseEvent('click',{bubbles:true})); }, c);
        await p.waitForTimeout(100);
        await errToast(where);
      }
      await finishCombat();
    }
    await resetView('world');
  }

  console.log(`\n=== ${MODE}: ${issues.length} issue(s) ===`);
  const byKind = {};
  for (const i of issues) (byKind[i.kind] = byKind[i.kind] || []).push(i);
  for (const k of Object.keys(byKind)) {
    console.log(`\n## ${k} (${byKind[k].length})`);
    for (const i of byKind[k].slice(0, 40)) console.log(`- [${i.where}] ${i.detail}`);
  }
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(issues, null, 1));
  await b.close();
})();
