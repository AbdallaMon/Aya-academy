// End-to-end checks against the standalone preview, using the repository's existing Playwright.
const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const output = path.join(__dirname, 'qa');
fs.mkdirSync(output, { recursive: true });
const key = 'ayah-little-explorers-v1';
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const failedRequests = [];
  page.on('requestfailed', request => failedRequests.push(request.url()));
  async function shot(name) { await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true }); }
  async function noOverflow() { assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No horizontal overflow'); }
  async function selectGame(id, resume = false) {
    await page.click('#brand');
    await page.click(`[data-game="${id}"]`);
    await page.click(`[data-action="start"][data-resume="${resume}"]`);
  }
  try {
    await page.goto('http://127.0.0.1:4318');
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('.adventure').count(), 2);
    await noOverflow();
    await shot('01-home-desktop');
    await selectGame('oasis');
    await page.click('[data-action="help"]');
    assert.equal(await page.locator('dialog').evaluate(el => el.open), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog').evaluate(el => el.open), false);
    await page.click('[data-object="book"]');
    assert.match(await page.locator('#feedback-slot').innerText(), /مرة أخرى/);
    await page.click('#hint');
    assert.equal(await page.locator('[data-object="tap"]').evaluate(el => el.classList.contains('hinted')), true);
    await page.click('[data-object="tap"]');
    await page.click('[data-option="1"]');
    assert.equal(await page.locator('[data-option="1"]').isDisabled(), true);
    assert.match(await page.locator('#feedback-slot').innerText(), /يهدر الماء/);
    await page.click('[data-option="0"]');
    assert.equal(await page.locator('.scene-object.cared').count(), 1);
    assert.equal(await page.locator('#confetti i').count(), 0, 'Reduced motion disables particles');
    await page.reload();
    await selectGame('oasis', true);
    assert.match(await page.locator('.step-label').innerText(), /٢/);
    const targets = ['wrapper','flower','lamp','book','food','bird','bag'];
    for (const [i, target] of targets.entries()) {
      await page.click(`[data-object="${target}"]`);
      if (i === 1) await shot('02-oasis-desktop');
      await page.click('[data-option="0"]');
      await page.click('#next');
    }
    assert.match(await page.locator('.finish h1').innerText(), /حارس الواحة/);
    assert.equal(await page.locator('.learned-item').count(), 8);
    await page.click('summary');
    assert.equal(await page.locator('.review-details li').count(), 8);
    await shot('03-oasis-reward');
    await page.click('[data-action="replay"]');
    assert.match(await page.locator('.step-label').innerText(), /١/);
    assert.equal(await page.locator('.scene-object.cared').count(), 0);
    await selectGame('train');
    assert.equal(await page.locator('#check-word').isDisabled(), true);
    await page.click('#hint');
    assert.match(await page.locator('#feedback-slot').innerText(), /ق/);
    let pool = await page.locator('.letter').evaluateAll(items => items.map(el => ({ id: el.dataset.letter, letter: el.textContent })));
    for (const letter of ['ن', 'س', 'ر']) await page.click(`[data-letter="${pool.find(item => item.letter === letter).id}"]`);
    await page.click('#check-word');
    assert.match(await page.locator('#feedback-slot').innerText(), /ترتيبًا آخر/);
    await page.click('[data-slot="1"]');
    assert.equal(await page.locator('.wagon:not(.empty)').count(), 2);
    await page.click('#clear-word');
    assert.equal(await page.locator('.wagon:not(.empty)').count(), 0);
    const words = ['قمر', 'قلم', 'شمس', 'باب', 'نور', 'كتاب', 'مسجد', 'سلام'];
    for (const [i, word] of words.entries()) {
      pool = await page.locator('.letter').evaluateAll(items => items.map(el => ({ id: el.dataset.letter, letter: el.textContent })));
      const used = new Set();
      for (const letter of word) {
        const item = pool.find(item => item.letter === letter && !used.has(item.id));
        used.add(item.id);
        await page.click(`[data-letter="${item.id}"]`);
      }
      assert.equal(await page.locator('.word-preview').innerText(), word);
      if (i === 3) assert.equal(await page.locator('.letter.used').count(), 3, 'Two independent baa tiles');
      if (i === 5) await shot('04-train-desktop');
      await page.click('#check-word');
      assert.equal(await page.locator('.feedback.success').count(), 1);
      // Double-check cannot increment a solved round.
      assert.equal(await page.locator('#check-word').isDisabled(), true);
      await page.click('#next');
    }
    assert.match(await page.locator('.finish h1').innerText(), /قائد قطار الكلمات/);
    assert.equal(await page.locator('.learned-item').count(), 8);
    await shot('05-train-reward');
    for (const width of [390, 320, 768]) {
      await page.setViewportSize({ width, height: 844 });
      await page.click('#brand');
      await noOverflow();
      if(width === 390) await shot('06-home-mobile');
      await selectGame('oasis');
      await page.click('[data-object="tap"]');
      await noOverflow();
      if(width === 390) await shot('07-oasis-mobile');
      await selectGame('train');
      // Resume at the longest word using validated persisted records.
      await page.evaluate(key => { const raw = JSON.parse(localStorage.getItem(key)); raw.train = window.ExplorerGames.train.questions.slice(0,5).map(q => ({ id:q.id, mistakes:0, helped:false })); localStorage.setItem(key, JSON.stringify(raw)); }, key);
      await page.reload();
      await selectGame('train', true);
      await noOverflow();
      if(width === 390) await shot('08-train-mobile');
    }
    await page.click('#sound');
    assert.equal(await page.locator('#sound').getAttribute('aria-pressed'), 'true');
    await page.click('#sound');
    assert.equal(await page.locator('#sound').getAttribute('aria-pressed'), 'false');
    await page.evaluate(key => localStorage.setItem(key, '{broken-json'), key);
    await page.reload();
    assert.equal(await page.locator('.adventure').count(), 2);
    await page.keyboard.press('Tab');
    assert.ok(await page.evaluate(() => document.activeElement.tagName === 'BUTTON' || document.activeElement.tagName === 'A'));
    // File:// use and disabled storage are supported as well.
    const offline = await browser.newPage();
    await offline.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage unavailable'); } }); });
    await offline.goto('file:///' + path.join(__dirname, 'index.html').replaceAll('\\','/'));
    assert.equal(await offline.locator('.adventure').count(), 2);
    await offline.click('[data-game="oasis"]');
    await offline.click('[data-action="start"]');
    await offline.click('[data-object="tap"]');
    await offline.click('[data-option="0"]');
    assert.equal(await offline.locator('.feedback.success').count(), 1);
    await offline.close();
    assert.deepEqual(errors, [], 'No browser exceptions');
    assert.deepEqual(failedRequests, [], 'All assets load');
    const report = { passed: true, games: 2, roundsCompleted: 16, viewports: [1440,768,390,320], checks: ['wrong answers and retries', 'hints', 'scene changes', 'reload and resume', 'repeat letters', 'edit and clear letters', 'completion and review', 'replay reset', 'sound toggle', 'help dialog and Escape', 'keyboard focus', 'reduced motion', 'malformed storage', 'file protocol and unavailable storage', 'no horizontal overflow', 'no browser errors', 'local assets load'], screenshots: fs.readdirSync(output).filter(name => name.endsWith('.png')) };
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
