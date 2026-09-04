'use strict';

const DEFAULTS = { enabled: true, scope: 'all' };
const enabled = document.querySelector('#enabled');
const status = document.querySelector('#status');
const radios = [...document.querySelectorAll('[name="scope"]')];

function showStatus(message) {
  status.textContent = message;
  setTimeout(() => { status.textContent = ''; }, 1100);
}

chrome.storage.sync.get(DEFAULTS, settings => {
  enabled.checked = settings.enabled;
  const scope = radios.find(item => item.value === (settings.scope === 'x' ? 'selected' : settings.scope));
  if (scope) scope.checked = true;
});

enabled.addEventListener('change', () => {
  chrome.storage.sync.set({ enabled: enabled.checked }, () => showStatus('Saved'));
});

radios.forEach(radio => radio.addEventListener('change', () => {
  if (!radio.checked) return;
  chrome.storage.sync.set({ scope: radio.value }, () => {
    showStatus(radio.value === 'all' ? 'All websites enabled' : 'Selected websites only');
  });
}));

document.querySelector('#settings').addEventListener('click', () => chrome.runtime.openOptionsPage());
