# Privacy

Reflag does not collect, transmit, sell, share, or retain personal information or browsing history.

## Local processing

Flag detection and rendering happen entirely inside the browser. The extension examines page text only to recognise supported Unicode flag sequences. It does not send page content anywhere.

## Stored settings

The extension stores only its enabled state, website scope, selected website domains, and the identifiers of disabled flags using the browser's extension sync-storage API. Depending on the user's browser settings, the browser vendor may synchronise those preferences between the user's own browser installations. Reflag does not operate or receive that data.

## Website access

The default installation runs on HTTP and HTTPS websites so it can address system-level flag-rendering failures wherever they appear. Choosing **Selected websites only** prevents processing outside the user's locally stored domain list, although the browser's installation-time host permission remains present. Editable fields, form controls, scripts, styles, code blocks, SVG, and mathematical markup are excluded from processing.

## Network activity

All flag artwork and executable code are bundled with the extension. It has no telemetry, analytics, advertising, remote-code loading, or background network requests. The Digital*Impulse and Ko-fi links are opened only when a user clicks them.

The settings page may display favicons already available through the browser's built-in favicon facility. Reflag does not send selected domains to an external icon service.
