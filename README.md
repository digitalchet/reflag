# Reflag — Restore the flags

Reflag turns missing flag emoji and letter codes back into the flags they were meant to be. It preserves the original Unicode text for copying, search, and accessibility.

It works across HTTP and HTTPS websites by default, with a selected-websites mode whenever you want a narrower scope. Everything runs locally in your browser—no tracking, advertising, or collection of browsing data.

## Highlights

- Restores & displays all emoticon flags for the 262 Unicode graphemes that refer to flag-bearing entities.
- Works dynamically across all websites by default, or on your own selected websites.
- Gives you as much control as you need, from enabling the entire global set, to selected regions, to individual options, quickly & easily.
- A great search functionality is included.
- Preserves the original Unicode grapheme in page code, but avoids editable fields and sensitive page structures.
- Flags include tooltips on mouse hover.

## Installing from an unpacked folder

1. Unzip the release.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and choose the unzipped `reflag` folder.
5. Pin the extension if desired. It runs on HTTP and HTTPS websites by default; the popup can restrict it to your selected websites, turn it off, or open the flag and website settings. The initial enabled set is the United States, United Kingdom, Australia, Canada, and New Zealand.

After changing the scope, existing open pages may need one refresh to restore flags already present before the extension loaded.

## Development checks

The `tests` folder contains browser interaction, dynamic-content performance, and manifest/scope regression checks. They use Node.js and Playwright with a locally installed Chromium-based browser; the extension itself has no runtime package dependencies.

## How it works

- A grapheme/sequence-aware scanner recognises pairs of Unicode Regional Indicator Symbols and the full Unicode tag sequences for England, Scotland, and Wales.
- It works on initial content and watches dynamic sites with `MutationObserver`. The main test case is X post text such as `[data-testid='tweetText']` containing raw `🇬🇧`.
- The extension wraps—not deletes—the original Unicode. The text stays in the DOM for copy and find/search; a local SVG is positioned over it, and its wrapper exposes an accessible country name. Turning the extension off unwraps processed flags back to plain text.
- Inline sizing compensates for the transparent padding in Twemoji's square flag canvases. X post text receives an additional proportional optical offset because its line-box positioning differs from ordinary document text.
- Editable controls, `contenteditable`, scripts, styles, code blocks, and already processed flags are skipped.
- Processing is batched per animation frame and settings are stored with Chrome sync storage.
- Disabled or unsupported flag sequences are left completely untouched, preventing no-op DOM mutations and observer feedback loops.
- The settings page shows the current enabled set, supports individual flags, and provides collapsible continental groups with group-level switches. Region groupings follow Unicode CLDR territory containment, with England, Scotland, and Wales listed under Europe.
- The switch beside Selected flags enables or disables the complete flag collection, while the side-panel tutorial explains search, selection, website scope, privacy, and Unicode preservation.
- The settings search is focused on opening and supports type-to-search after clicking flag or region controls. It accepts comma-separated country names or codes; selecting a result consumes its matching term while leaving any remaining terms active. Standard navigation keys and modified browser shortcuts are not intercepted.

Continental groupings are derived from the [Unicode Common Locale Data Repository territory-containment data](https://github.com/unicode-org/cldr-json). Unicode data and software are subject to the [Unicode License](https://www.unicode.org/license.txt).

## Permissions

- `storage` saves the master switch, scope, selected websites, and selected flags.
- `favicon` lets the settings page show browser-cached icons for selected domains. Reflag does not contact external favicon services.
- Reflag runs on HTTP and HTTPS pages so it can correct system-level flag-rendering failures wherever they appear.
- The **Selected websites only** setting prevents scanning and rendering outside the locally stored domain list, although the browser's installation-time host permission remains present.
- Browser-internal pages, extension stores, and other protected browser surfaces do not permit content-script access.

The extension contains no telemetry, analytics, advertising, remote code, or background network requests. See [Privacy](docs/PRIVACY.md) and [Security](.github/SECURITY.md).

## Artwork and licensing

Flag SVG artwork is from [Twemoji](https://github.com/jdecked/twemoji), version 17.0.3. Copyright 2014–2021 Twitter and other contributors. The graphics are licensed under [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/). A copy is included as `LICENSE-GRAPHICS`.

The extension code is released under the MIT License; see `LICENSE`.

## Project layout

- `assets/flags/` — bundled Twemoji flag artwork required at runtime.
- `icons/` — packaged toolbar and extension icons.
- `design/` — editable design-source artwork.
- `docs/` — privacy, architecture, and project-structure documentation.
- `media/screenshots/` — store-listing previews and promotional imagery.
- `website/` — future product website, kept separate from extension runtime code.
- `.github/` — GitHub-specific community and security files.
- `tests/` — interaction, performance, and scope regression checks.
- `releases/` — local packaged builds; release files are intentionally excluded from Git.

The manifest and executable extension files remain at the repository root so a cloned repository can be loaded directly as an unpacked extension. See [Project structure](docs/PROJECT_STRUCTURE.md) for details.

## Release

The current release is **Reflag v1.02** (`1.0.2` in the browser manifest). Future functional changes will use incremented version numbers.

## Notes

The regional-indicator registry follows Unicode's RGI emoji flag sequences. It includes the 249 assigned ISO 3166-1 entries and ten additional Unicode-recognised region or organisation codes: AC, CP, CQ, DG, EA, EU, IC, TA, UN, and XK. England, Scotland, and Wales use full subdivision tag sequences. Unsupported regional-indicator pairs remain as untouched Unicode text.

[A Digital*Impulse Creation.](https://digital-impulse.com/)

[If you found this extension useful, buy me a coffee on Ko-fi.](https://ko-fi.com/digitalchet)
