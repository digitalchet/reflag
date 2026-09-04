const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
let browser;

(async () => {
  browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage();
  const root = path.resolve(__dirname, '..');
  await page.setContent(fs.readFileSync(path.join(root, 'options.html'), 'utf8'));
  await page.evaluate(() => {
    window.chrome = {
      runtime: { getURL: path => `chrome-extension://test/${path}` },
      storage: {
        sync: {
          get: (defaults, callback) => callback(defaults),
          set: (_value, callback) => callback?.()
        }
      }
    };
  });
  await page.addScriptTag({ path: path.join(root, 'regions.js') });
  await page.addScriptTag({ path: path.join(root, 'options.js') });

  const initiallyFocused = await page.evaluate(() => document.activeElement.id);
  await page.locator('#selected-sites-mode').click();
  if (await page.locator('#site-controls').isHidden()) throw new Error('Selected-sites controls did not expand');
  await page.locator('#site-input').fill('https://News.Example.com/path');
  await page.locator('#site-form button').click();
  const addedSite = await page.locator('.site-chip > span:not(.site-fallback)').textContent();
  const clearedSiteInput = await page.locator('#site-input').inputValue();
  await page.locator('.site-chip button').click();
  const emptySiteMessage = await page.locator('#site-list .empty').textContent();
  await page.locator('#search').focus();
  await page.locator('details.region').first().evaluate(section => { section.open = true; });
  const firstBox = page.locator('.flags .flag').first();
  await firstBox.click();
  await page.keyboard.type('f');
  const typeResult = await page.evaluate(() => ({ active: document.activeElement.id, value: document.querySelector('#search').value }));

  await page.locator('#search').fill('');
  await firstBox.focus();
  const beforeSpace = await firstBox.getAttribute('aria-pressed');
  await page.keyboard.press('Space');
  const afterSpace = await firstBox.getAttribute('aria-pressed');
  const searchAfterSpace = await page.locator('#search').inputValue();

  await page.locator('#search').fill('cn, ru, it, sp, de, fr');
  const visibleBefore = await page.locator('.flags .flag:not([hidden])').evaluateAll(labels => labels.map(label => label.dataset.id).sort());
  await page.locator('.flags .flag[data-id="cn"]').click();
  const queueAfterChina = await page.locator('#search').inputValue();
  const visibleAfter = await page.locator('.flags .flag:not([hidden])').evaluateAll(labels => labels.map(label => label.dataset.id).sort());

  await page.locator('#search').fill('ca');
  await page.locator('.flags .flag[data-id="ca"]').click();
  const singleAfterCanada = await page.locator('#search').inputValue();

  await page.locator('#all-flags-mode').click();
  const checkedAfterAll = await page.locator('.flags .flag[aria-pressed="true"]').count();
  await page.locator('#all-flags-mode').click();
  const checkedAfterNone = await page.locator('.flags .flag[aria-pressed="true"]').count();
  const emptyMessage = await page.locator('#enabled-flags .empty').textContent();
  await page.locator('#all-flags-mode').click();

  await page.locator('#help-button').click();
  const helpOpen = await page.evaluate(() => ({
    expanded: document.querySelector('#help-button').getAttribute('aria-expanded'),
    hidden: document.querySelector('#help-panel').getAttribute('aria-hidden'),
    inert: document.querySelector('#help-panel').hasAttribute('inert')
  }));
  await page.keyboard.press('Escape');
  const helpClosed = await page.evaluate(() => ({
    expanded: document.querySelector('#help-button').getAttribute('aria-expanded'),
    hidden: document.querySelector('#help-panel').getAttribute('aria-hidden'),
    inert: document.querySelector('#help-panel').hasAttribute('inert')
  }));
  await browser.close();

  if (initiallyFocused !== 'search') throw new Error(`Search was not initially focused: ${initiallyFocused}`);
  if (addedSite !== 'news.example.com' || clearedSiteInput !== '' || emptySiteMessage !== 'No websites selected yet.') throw new Error('Website allowlist add/remove failed');
  if (typeResult.active !== 'search' || typeResult.value !== 'f') throw new Error(`Type-to-search failed: ${JSON.stringify(typeResult)}`);
  if (beforeSpace === afterSpace) throw new Error('Space did not retain toggle-button behavior');
  if (searchAfterSpace !== '') throw new Error(`Space was captured by search: ${searchAfterSpace}`);
  const expectedBefore = ['cn', 'de', 'es', 'fr', 'it', 'ru'];
  const expectedAfter = ['de', 'es', 'fr', 'it', 'ru'];
  if (JSON.stringify(visibleBefore) !== JSON.stringify(expectedBefore)) throw new Error(`Multi-search mismatch: ${JSON.stringify(visibleBefore)}`);
  if (queueAfterChina !== 'ru, it, sp, de, fr') throw new Error(`Queue did not consume China: ${queueAfterChina}`);
  if (JSON.stringify(visibleAfter) !== JSON.stringify(expectedAfter)) throw new Error(`Remaining results mismatch: ${JSON.stringify(visibleAfter)}`);
  if (singleAfterCanada !== '') throw new Error(`Single search was not cleared: ${singleAfterCanada}`);
  if (checkedAfterNone !== 0 || emptyMessage !== 'No flags are currently enabled.') throw new Error(`Disable All failed: ${checkedAfterNone}, ${emptyMessage}`);
  if (checkedAfterAll !== 261) throw new Error(`Enable All failed: ${checkedAfterAll}`);
  if (helpOpen.expanded !== 'true' || helpOpen.hidden !== 'false' || helpOpen.inert) throw new Error(`Help did not open accessibly: ${JSON.stringify(helpOpen)}`);
  if (helpClosed.expanded !== 'false' || helpClosed.hidden !== 'true' || !helpClosed.inert) throw new Error(`Help did not close accessibly: ${JSON.stringify(helpClosed)}`);
  console.log(JSON.stringify({ initiallyFocused, addedSite, emptySiteMessage, typeResult, spaceToggled: beforeSpace !== afterSpace, visibleBefore, queueAfterChina, visibleAfter, singleAfterCanada, checkedAfterNone, checkedAfterAll, helpOpen, helpClosed }));
})().catch(error => {
  console.error(error);
  browser?.close().catch(() => {});
  process.exitCode = 1;
});
