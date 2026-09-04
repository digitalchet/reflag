# Security

## Design

- Manifest V3 is used throughout.
- HTTP and HTTPS coverage is enabled by default to address browser- and operating-system-level rendering failures beyond a single platform.
- Selected-websites mode prevents the renderer from scanning or modifying sites outside the user's locally stored domain list, although the installation-time host permission remains present.
- The content renderer runs in Chrome's isolated extension world.
- Page text is handled with text nodes and DOM methods; it is never inserted with `innerHTML` or evaluated as code.
- Artwork is bundled locally and referenced with `chrome.runtime.getURL`.
- Selected-domain icons use Chromium's built-in favicon facility, with a generic fallback; no third-party favicon service is contacted.
- No cookies, credentials, form values, network traffic, or browsing history are read.
- Inputs, textareas, select controls, contenteditable regions, scripts, styles, code blocks, SVG, and mathematical markup are deliberately skipped.
- No third-party scripts, build-time package dependencies, telemetry, or remote services are used at runtime.

## Reporting a vulnerability

Please report security concerns privately to the repository owner before opening a public issue. Include reproduction steps and the affected version. Do not include passwords, tokens, personal data, or other secrets in a report.
