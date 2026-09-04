const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const content = fs.readFileSync(path.join(root, 'content.js'), 'utf8');
const popup = fs.readFileSync(path.join(root, 'popup.js'), 'utf8');

const matches = manifest.content_scripts?.[0]?.matches || [];
if (!matches.includes('http://*/*') || !matches.includes('https://*/*')) throw new Error('Global HTTP/HTTPS content coverage is missing');
if (manifest.background) throw new Error('Obsolete background registration remains in the manifest');
if ((manifest.permissions || []).includes('scripting')) throw new Error('Unnecessary scripting permission remains');
if (!/scope:\s*'all'/.test(content)) throw new Error('Content renderer does not default to all websites');
if (!/scope:\s*'all'/.test(popup)) throw new Error('Popup does not default to all websites');
if (!content.includes("settings.scope === 'selected' && siteIsSelected()")) throw new Error('Selected-website runtime guard is missing');
if (!content.includes("location.hostname.endsWith(`.${site}`)")) throw new Error('Subdomain matching is missing');
if (!content.includes("value.scope === 'x'")) throw new Error('Legacy X-only migration is missing');

console.log(JSON.stringify({ globalHttpHttps: true, noBackgroundWorker: true, permissions: manifest.permissions, selectedWebsiteGuard: true, legacyMigration: true }));
