(() => {
  'use strict';

  const SKIP = 'input, textarea, select, option, [contenteditable]:not([contenteditable="false"]), script, style, noscript, template, code, pre, svg, math, .rtf-flag';
  const REGIONAL_PAIR = /[\u{1F1E6}-\u{1F1FF}]{2}/u;
  const ISO_CODES = new Set(('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW').split(' '));
  const DEFAULT_ENABLED = new Set(['US', 'GB', 'AU', 'CA', 'NZ']);
  const DEFAULTS = { enabled: true, scope: 'all', selectedSites: [], disabledFlags: [...ISO_CODES].filter(code => !DEFAULT_ENABLED.has(code)).map(code => code.toLowerCase()).concat(['england', 'scotland', 'wales']) };
  const SUBDIVISIONS = new Map([
    ['\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}', ['england', 'Flag of England']],
    ['\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}', ['scotland', 'Flag of Scotland']],
    ['\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}', ['wales', 'Flag of Wales']]
  ]);
  const FLAG_PATTERN = new RegExp(`(?:${[...SUBDIVISIONS.keys()].join('|')}|[\\u{1F1E6}-\\u{1F1FF}]{2})`, 'gu');
  let settings = DEFAULTS;
  let disabledFlags = new Set(DEFAULTS.disabledFlags);
  let observer;
  let queued = new Set();
  let scheduled = false;

  const siteIsSelected = () => (settings.selectedSites || []).some(site =>
    location.hostname === site || location.hostname.endsWith(`.${site}`)
  );
  const active = () => settings.enabled && (settings.scope === 'all' || (settings.scope === 'selected' && siteIsSelected()));

  function regionalCode(flag) {
    const cps = [...flag].map(char => char.codePointAt(0));
    if (cps.length !== 2 || !cps.every(cp => cp >= 0x1f1e6 && cp <= 0x1f1ff)) return null;
    return String.fromCharCode(cps[0] - 0x1f1e6 + 65, cps[1] - 0x1f1e6 + 65);
  }

  function flagInfo(sequence) {
    const subdivision = SUBDIVISIONS.get(sequence);
    if (subdivision) {
      if (disabledFlags.has(subdivision[0])) return null;
      return { file: subdivision[0], label: subdivision[1] };
    }
    if (!REGIONAL_PAIR.test(sequence)) return null;
    const code = regionalCode(sequence);
    if (!ISO_CODES.has(code)) return null;
    if (disabledFlags.has(code.toLowerCase())) return null;
    let country = code;
    try { country = new Intl.DisplayNames([document.documentElement.lang || navigator.language || 'en'], { type: 'region' }).of(code) || code; } catch (_) {}
    return { file: code.toLowerCase(), label: `Flag of ${country}` };
  }

  function replaceTextNode(node) {
    FLAG_PATTERN.lastIndex = 0;
    if (!active() || !node.nodeValue || !FLAG_PATTERN.test(node.nodeValue)) return;
    FLAG_PATTERN.lastIndex = 0;
    // Build with DOM primitives only. No page text is interpreted as HTML.
    const fragment = document.createDocumentFragment();
    let last = 0;
    let replaced = false;
    for (const match of node.nodeValue.matchAll(FLAG_PATTERN)) {
      const info = flagInfo(match[0]);
      if (!info) continue;
      replaced = true;
      fragment.append(node.nodeValue.slice(last, match.index));
      const wrapper = document.createElement('span');
      wrapper.className = 'rtf-flag';
      wrapper.dataset.rtfProcessed = 'true';
      wrapper.setAttribute('role', 'img');
      wrapper.setAttribute('aria-label', info.label);
      wrapper.title = info.label;
      const original = document.createElement('span');
      original.className = 'rtf-original';
      original.setAttribute('aria-hidden', 'true');
      original.textContent = match[0];
      const image = document.createElement('img');
      image.className = 'rtf-image';
      image.alt = '';
      image.setAttribute('aria-hidden', 'true');
      image.src = chrome.runtime.getURL(`assets/flags/${info.file}.svg`);
      wrapper.append(original, image);
      fragment.append(wrapper);
      last = match.index + match[0].length;
    }
    // Critical: replacing a node with identical text would retrigger the
    // MutationObserver forever when a recognised flag is disabled.
    if (!replaced) return;
    fragment.append(node.nodeValue.slice(last));
    node.replaceWith(fragment);
  }

  function process(root) {
    if (!active() || !(root instanceof Node)) return;
    if (root.nodeType === Node.TEXT_NODE) {
      const parent = root.parentElement;
      if (parent && !parent.closest(SKIP)) replaceTextNode(root);
      return;
    }
    if (!(root instanceof Element || root instanceof Document || root instanceof DocumentFragment)) return;
    if (root instanceof Element && root.closest(SKIP)) return;
    // Text-node traversal preserves site event listeners and avoids innerHTML.
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.parentElement?.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(replaceTextNode);
  }

  function flush() {
    scheduled = false;
    const roots = queued;
    queued = new Set();
    // If both a container and one of its descendants were added in the same
    // frame, scan only the container to avoid duplicate work on dynamic feeds.
    const minimalRoots = [...roots].filter(root => {
      for (let parent = root.parentNode; parent; parent = parent.parentNode) {
        if (roots.has(parent)) return false;
      }
      return true;
    });
    minimalRoots.forEach(process);
  }

  function queue(root) {
    queued.add(root);
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(flush);
    }
  }

  function unwrapAll() {
    document.querySelectorAll('.rtf-flag[data-rtf-processed="true"]').forEach(wrapper => {
      wrapper.replaceWith(document.createTextNode(wrapper.textContent || ''));
    });
  }

  function start() {
    observer?.disconnect();
    unwrapAll();
    if (!active()) {
      return;
    }
    queue(document.body || document.documentElement);
    // Dynamic feeds such as X append and recycle post elements after load.
    observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'characterData') queue(record.target);
        record.addedNodes.forEach(queue);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  }

  chrome.storage.sync.get(DEFAULTS, value => {
    // Preserve the intent of installations that used the former X-only mode.
    if (value.scope === 'x') {
      value.scope = 'selected';
      value.selectedSites = [...new Set([...(value.selectedSites || []), 'x.com', 'twitter.com'])];
      chrome.storage.sync.set({ scope: value.scope, selectedSites: value.selectedSites });
    }
    settings = value;
    disabledFlags = new Set(value.disabledFlags || []);
    start();
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    settings = { ...settings, ...Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, value.newValue])) };
    if (changes.disabledFlags) disabledFlags = new Set(changes.disabledFlags.newValue || []);
    start();
  });
})();
