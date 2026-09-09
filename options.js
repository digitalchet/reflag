const ALL_IDS = FLAG_REGIONS.flatMap(region => region.codes).map(code => code.toLowerCase());
const DEFAULT_ENABLED = new Set(['us', 'gb', 'au', 'ca', 'nz']);
const DEFAULT_DISABLED = ALL_IDS.filter(id => !DEFAULT_ENABLED.has(id));
const disabled = new Set();
const specialNames = { ac: 'Ascension Island', cp: 'Clipperton Island', cq: 'Sark', dg: 'Diego Garcia', ea: 'Ceuta & Melilla', eu: 'European Union', ic: 'Canary Islands', ta: 'Tristan da Cunha', un: 'United Nations', xk: 'Kosovo', england: 'England', scotland: 'Scotland', wales: 'Wales' };
const names = new Intl.DisplayNames([navigator.language || 'en'], { type: 'region' });
const regionsRoot = document.querySelector('#regions');
const enabledRoot = document.querySelector('#enabled-flags');
const saved = document.querySelector('#saved');
const searchField = document.querySelector('#search');
const siteForm = document.querySelector('#site-form');
const siteInput = document.querySelector('#site-input');
const siteList = document.querySelector('#site-list');
const siteMessage = document.querySelector('#site-message');
const selectedSites = new Set();
const selectedSitesMode = document.querySelector('#selected-sites-mode');
const siteControls = document.querySelector('#site-controls');
const allFlagsMode = document.querySelector('#all-flags-mode');
const selectedCount = document.querySelector('#selected-count');
const testFlagsRoot = document.querySelector('#test-flags');
const TEST_CODES = ['US', 'GB', 'AU', 'CA', 'NZ', 'JP', 'ZA', 'BR', 'IN', 'DE', 'FR', 'IE', 'EU', 'UN', 'XK', 'CQ', 'AC'];

const idFor = code => code.toLowerCase();
const countryName = code => specialNames[code.toLowerCase()] || names.of(code.toUpperCase()) || code;
const flagSequence = code => [...code.toUpperCase()].map(letter => String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65)).join('');

function renderTestFlags() {
  testFlagsRoot.replaceChildren();
  TEST_CODES.forEach(code => {
    const id = idFor(code);
    const enabled = !disabled.has(id);
    const name = countryName(code);
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'test-flag'; button.dataset.id = id;
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', `${name} flag: ${enabled ? 'enabled' : 'disabled'}`);
    button.title = `${name} (${code})`;
    const original = document.createElement('span'); original.className = 'test-original'; original.textContent = flagSequence(code);
    button.append(original);
    if (enabled) {
      const image = document.createElement('img'); image.src = `assets/flags/${id}.svg`; image.alt = ''; image.setAttribute('aria-hidden', 'true');
      button.append(image);
    }
    button.addEventListener('click', () => setFlag(id, disabled.has(id)));
    testFlagsRoot.append(button);
  });
}

function flagControl(rawCode, compact = false) {
  // All labels are assembled with DOM APIs; country names never become HTML.
  const code = rawCode.length === 2 ? rawCode.toUpperCase() : rawCode.toLowerCase();
  const id = idFor(code);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = compact ? 'flag active-flag' : 'flag';
  button.dataset.id = id;
  button.dataset.search = `${countryName(code)} ${code}`.toLowerCase();
  button.setAttribute('aria-pressed', String(!disabled.has(id)));
  button.setAttribute('aria-label', `${countryName(code)} flag`);
  const art = document.createElement('img'); art.className = 'flag-art'; art.src = `assets/flags/${id}.svg`; art.alt = '';
  const text = document.createElement('span'); text.textContent = countryName(code);
  const codeText = document.createElement('span'); codeText.className = 'code'; codeText.textContent = code.length === 2 ? code : '';
  button.addEventListener('click', () => setFlag(id, disabled.has(id)));
  button.append(art, text, codeText);
  return button;
}

function setFlag(id, enabled) {
  // Keep duplicate controls in the enabled list and region list in sync.
  enabled ? disabled.delete(id) : disabled.add(id);
  document.querySelectorAll(`.flag[data-id="${id}"]`).forEach(button => button.setAttribute('aria-pressed', String(enabled)));
  refreshAllGroups();
  renderEnabled();
  consumeSearchTerm(id);
  persist();
}

function searchTokens() {
  return searchField.value.toLowerCase().split(/[,;\n]+/).map(token => token.trim()).filter(Boolean);
}

function tokenMatches(label, token) {
  // Assigned two-letter identifiers are exact; other text remains a fuzzy
  // country-name search, so “sp” can still find Spain while “de” means Germany.
  if (/^[a-z]{2}$/.test(token) && ALL_IDS.includes(token)) return label.dataset.id === token;
  return label.dataset.search.includes(token);
}

function consumeSearchTerm(id) {
  const tokens = searchTokens();
  if (!tokens.length) return;
  const label = document.querySelector(`.flags .flag[data-id="${id}"]`);
  if (!label) return;
  const remaining = tokens.filter(token => !tokenMatches(label, token));
  if (remaining.length === tokens.length) return;
  searchField.value = remaining.join(', ');
  searchField.dispatchEvent(new Event('input', { bubbles: true }));
}

function persist() {
  chrome.storage.sync.set({ disabledFlags: [...disabled].sort() }, () => {
    saved.textContent = 'Saved';
    setTimeout(() => { saved.textContent = ''; }, 900);
  });
}

function persistSites() {
  chrome.storage.sync.set({ selectedSites: [...selectedSites].sort() }, () => {
    siteMessage.textContent = 'Saved';
    setTimeout(() => { siteMessage.textContent = ''; }, 900);
  });
}

function normalizeSite(value) {
  let candidate = value.trim().toLowerCase().replace(/^\*\./, '');
  if (!candidate) return null;
  if (!/^https?:\/\//.test(candidate)) candidate = `https://${candidate}`;
  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) return null;
    return url.hostname.replace(/\.$/, '');
  } catch (_) {
    return null;
  }
}

function renderSites() {
  siteList.replaceChildren();
  if (!selectedSites.size) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No websites selected yet.';
    siteList.append(empty);
    return;
  }
  [...selectedSites].sort().forEach(site => {
    const chip = document.createElement('span'); chip.className = 'site-chip';
    const fallback = document.createElement('span'); fallback.className = 'site-fallback'; fallback.textContent = '🌐'; fallback.setAttribute('aria-hidden', 'true');
    const icon = document.createElement('img'); icon.className = 'site-favicon'; icon.alt = '';
    icon.src = `${chrome.runtime.getURL('_favicon/')}?pageUrl=${encodeURIComponent(`https://${site}`)}&size=32`;
    icon.addEventListener('load', () => { fallback.hidden = true; });
    icon.addEventListener('error', () => { icon.hidden = true; });
    const name = document.createElement('span'); name.textContent = site;
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', `Remove ${site}`);
    remove.addEventListener('click', () => { selectedSites.delete(site); renderSites(); persistSites(); });
    chip.append(fallback, icon, name, remove); siteList.append(chip);
  });
}

function refreshGroup(section) {
  const boxes = [...section.querySelectorAll('.flags .flag')];
  const group = section.querySelector('.region-toggle');
  const allEnabled = boxes.every(button => button.getAttribute('aria-pressed') === 'true');
  const someEnabled = boxes.some(button => button.getAttribute('aria-pressed') === 'true');
  group.setAttribute('aria-pressed', String(allEnabled));
  group.classList.toggle('mixed', !allEnabled && someEnabled);
}
function refreshAllGroups() { document.querySelectorAll('details.region').forEach(refreshGroup); }

function renderEnabled() {
  enabledRoot.replaceChildren();
  const active = ALL_IDS.filter(id => !disabled.has(id));
  selectedCount.textContent = `${active.length} of ${ALL_IDS.length}`;
  allFlagsMode.setAttribute('aria-checked', String(active.length === ALL_IDS.length));
  allFlagsMode.setAttribute('aria-label', active.length === ALL_IDS.length ? 'Disable all flags' : 'Enable all flags');
  document.querySelector('.all-flags-control > span').textContent = active.length === ALL_IDS.length ? 'Disable all' : 'Enable all';
  renderTestFlags();
  if (!active.length) {
    const empty = document.createElement('p'); empty.className = 'empty'; empty.textContent = 'No flags are currently enabled.'; enabledRoot.append(empty); return;
  }
  active.forEach(id => enabledRoot.append(flagControl(id, true)));
}

function renderRegions() {
  // Native details/summary elements provide keyboard-accessible disclosure UI.
  for (const region of FLAG_REGIONS) {
    const section = document.createElement('details'); section.className = 'region';
    const head = document.createElement('summary'); head.className = 'region-head';
    const representative = document.createElement('img'); representative.className = 'region-art'; representative.src = `assets/flags/${region.representative.toLowerCase()}.svg`; representative.alt = '';
    const title = document.createElement('h2'); title.textContent = region.name;
    const count = document.createElement('span'); count.className = 'region-count'; count.textContent = `${region.codes.length} flags`;
    const group = document.createElement('button'); group.type = 'button'; group.className = 'group-control region-toggle'; group.textContent = 'All'; group.title = `Enable or disable all ${region.name} flags`; group.setAttribute('aria-pressed', 'false');
    group.addEventListener('click', event => event.stopPropagation());
    head.append(representative, title, count, group); section.append(head);
    const flags = document.createElement('div'); flags.className = 'flags';
    region.codes.forEach(code => flags.append(flagControl(code)));
    group.addEventListener('click', () => {
      const enable = group.getAttribute('aria-pressed') !== 'true';
      region.codes.forEach(code => enable ? disabled.delete(idFor(code)) : disabled.add(idFor(code)));
      flags.querySelectorAll('.flag').forEach(button => button.setAttribute('aria-pressed', String(enable)));
      group.setAttribute('aria-pressed', String(enable)); group.classList.remove('mixed'); renderEnabled(); persist();
    });
    section.append(flags); regionsRoot.append(section); refreshGroup(section);
  }
}

function setSitesExpanded(expanded) {
  siteControls.hidden = !expanded;
  selectedSitesMode.setAttribute('aria-expanded', String(expanded));
}

chrome.storage.sync.get({ disabledFlags: DEFAULT_DISABLED, selectedSites: [], scope: 'all' }, settings => {
  settings.disabledFlags.forEach(id => disabled.add(id));
  settings.selectedSites.forEach(site => selectedSites.add(site));
  const selectedMode = settings.scope === 'selected' || settings.scope === 'x';
  selectedSitesMode.setAttribute('aria-checked', String(selectedMode));
  setSitesExpanded(selectedMode);
  renderSites();
  renderEnabled(); renderRegions();
});

selectedSitesMode.addEventListener('click', () => {
  const expanded = selectedSitesMode.getAttribute('aria-checked') !== 'true';
  selectedSitesMode.setAttribute('aria-checked', String(expanded));
  setSitesExpanded(expanded);
  chrome.storage.sync.set({ scope: expanded ? 'selected' : 'all' });
  if (expanded) siteInput.focus();
});

siteForm.addEventListener('submit', event => {
  event.preventDefault();
  const site = normalizeSite(siteInput.value);
  if (!site) { siteMessage.textContent = 'Enter a valid website, such as example.com.'; return; }
  if (selectedSites.has(site)) { siteMessage.textContent = `${site} is already selected.`; siteInput.select(); return; }
  selectedSites.add(site); siteInput.value = ''; renderSites(); persistSites(); siteInput.focus();
});

searchField.addEventListener('input', event => {
  const tokens = searchTokens();
  document.querySelectorAll('details.region').forEach(section => {
    let matches = 0;
    section.querySelectorAll('.flags .flag').forEach(label => { const visible = !tokens.length || tokens.some(token => tokenMatches(label, token)); label.hidden = !visible; if (visible) matches += 1; });
    section.hidden = matches === 0;
    if (tokens.length && matches) section.open = true;
  });
});
allFlagsMode.addEventListener('click', () => {
  const enable = allFlagsMode.getAttribute('aria-checked') !== 'true';
  if (enable) disabled.clear(); else ALL_IDS.forEach(id => disabled.add(id));
  document.querySelectorAll('.flag').forEach(button => button.setAttribute('aria-pressed', String(enable)));
  refreshAllGroups();
  renderEnabled();
  persist();
});

const helpButton = document.querySelector('#help-button');
const helpPanel = document.querySelector('#help-panel');
const helpScrim = document.querySelector('#help-scrim');
const helpClose = document.querySelector('#help-close');
function setHelpOpen(open) {
  helpPanel.classList.toggle('open', open);
  helpScrim.classList.toggle('open', open);
  helpPanel.setAttribute('aria-hidden', String(!open));
  helpPanel.toggleAttribute('inert', !open);
  helpButton.setAttribute('aria-expanded', String(open));
  if (open) helpClose.focus(); else helpButton.focus();
}
helpButton.addEventListener('click', () => setHelpOpen(true));
helpClose.addEventListener('click', () => setHelpOpen(false));
helpScrim.addEventListener('click', () => setHelpOpen(false));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && helpPanel.classList.contains('open')) {
    event.preventDefault();
    setHelpOpen(false);
  }
});

// Keep the settings page ready for quick filtering. Printable typing is sent
// to search even after a flag toggle or disclosure header was clicked, without
// taking over Space, Enter, navigation keys, or browser/assistive shortcuts.
searchField.focus({ preventScroll: true });
document.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
  if (helpPanel.classList.contains('open')) return;
  if (event.key === '/' && document.activeElement !== searchField) {
    event.preventDefault();
    searchField.focus({ preventScroll: true });
    searchField.select();
    return;
  }
  if (event.key === 'Escape' && document.activeElement === searchField) {
    searchField.value = '';
    searchField.dispatchEvent(new Event('input', { bubbles: true }));
    searchField.blur();
    return;
  }
  const target = event.target;
  const isOtherTextEditor = target !== searchField && (
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLInputElement && /^(?:text|search|email|url|tel|password)$/i.test(target.type)) ||
    target.isContentEditable
  );
  if (document.activeElement === searchField || isOtherTextEditor || event.key.length !== 1 || event.key === ' ') return;

  event.preventDefault();
  searchField.focus({ preventScroll: true });
  const start = searchField.selectionStart ?? searchField.value.length;
  const end = searchField.selectionEnd ?? start;
  searchField.setRangeText(event.key, start, end, 'end');
  searchField.dispatchEvent(new Event('input', { bubbles: true }));
});
