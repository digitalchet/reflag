# Architecture

Reflag is a dependency-free Manifest V3 browser extension. Its runtime consists of a content renderer, a toolbar popup, and a settings page.

## Content renderer

`content.js` recognises all 259 Unicode RGI regional-indicator flag pairs and the full Unicode tag sequences for England, Scotland, and Wales. This includes ten RGI entries outside the assigned ISO 3166-1 set: AC, CP, CQ, DG, EA, EU, IC, TA, UN, and XK. It replaces only matching text-node ranges with a wrapper that retains the original Unicode and overlays a bundled SVG. Editable controls, scripts, styles, code blocks, SVG, mathematical markup, and previously processed flags are excluded.

Initial content is scanned after page load. A batched `MutationObserver` handles dynamic feeds while removing nested duplicate scan roots. Disabling Reflag or changing its scope unwraps generated elements back to their original text.

## Settings

Preferences are stored with `chrome.storage.sync`: the master state, website scope, selected domains, and disabled flag identifiers. Five flags are enabled initially: the United States, United Kingdom, Australia, Canada, and New Zealand.

The selected-websites scope compares the current hostname against locally stored domains and their subdomains. Cached site icons are requested through Chromium's built-in favicon facility; no external favicon provider is used.

## Assets and permissions

All flag SVGs and executable files are bundled locally. The extension requests `storage` and `favicon`. Static HTTP and HTTPS content-script coverage allows it to address flag-rendering failures across websites, while its runtime scope setting can prevent processing outside selected domains.

## Tests

The `tests` directory covers manifest and scope assumptions, settings-page interactions, Unicode preservation, dynamic-content processing, and the observer feedback-loop regression.
