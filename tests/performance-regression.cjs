const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage();
  await page.setContent('<div id="enabled">Enabled: 🇬🇧</div><div id="disabled">Disabled: 🇫🇷</div>');
  await page.evaluate(() => {
    window.testMutationCount = 0;
    new MutationObserver(records => { window.testMutationCount += records.length; })
      .observe(document.body, { childList: true, subtree: true, characterData: true });
    window.chrome = {
      runtime: { getURL: value => value },
      storage: {
        sync: { get: (_defaults, callback) => callback({ enabled: true, scope: 'all', disabledFlags: ['fr'] }) },
        onChanged: { addListener: () => {} }
      }
    };
  });
  await page.addScriptTag({ path: path.resolve(__dirname, '../content.js') });
  await page.waitForTimeout(150);
  const first = await page.evaluate(() => window.testMutationCount);
  await page.waitForTimeout(150);
  const result = await page.evaluate(firstCount => ({
    firstCount,
    finalCount: window.testMutationCount,
    enabledWrappers: document.querySelectorAll('#enabled .rtf-flag').length,
    enabledTooltip: document.querySelector('#enabled .rtf-flag')?.title,
    disabledWrappers: document.querySelectorAll('#disabled .rtf-flag').length,
    disabledText: document.querySelector('#disabled').textContent
  }), first);
  await browser.close();

  if (result.enabledWrappers !== 1) throw new Error(`Expected one enabled wrapper; got ${result.enabledWrappers}`);
  if (result.enabledTooltip !== 'Flag of United Kingdom') throw new Error(`Tooltip mismatch: ${result.enabledTooltip}`);
  if (result.disabledWrappers !== 0) throw new Error(`Disabled flag was wrapped ${result.disabledWrappers} times`);
  if (result.disabledText !== 'Disabled: 🇫🇷') throw new Error('Disabled Unicode text changed');
  if (result.finalCount !== result.firstCount) throw new Error(`Mutations did not settle: ${result.firstCount} -> ${result.finalCount}`);
  console.log(JSON.stringify(result));
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
