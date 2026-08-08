import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const textExtensions = new Set(['.html', '.js', '.mjs', '.json', '.md', '.yml', '.yaml']);

function collectTextFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (['.git', 'logos'].includes(entry.name)) return [];
      return collectTextFiles(fullPath);
    }
    if (!textExtensions.has(path.extname(entry.name).toLowerCase())) return [];
    if (entry.name === 'test-public-security.mjs') return [];
    return [fullPath];
  });
}

const contents = collectTextFiles(root)
  .map(file => `${path.relative(root, file)}\n${fs.readFileSync(file, 'utf8')}`)
  .join('\n');

assert.doesNotMatch(contents, /(?:api[_-]?key|auth[_-]?token)\s*[:=]\s*['"][A-Za-z0-9_-]{16,}['"]/i,
  'Mogelijke API-sleutel gevonden in openbare broncode');
assert.doesNotMatch(contents, /x-apisports-key|X-Auth-Token|api-sports\.io|football-data\.org\/v4|corsproxy\.io/i,
  'Sleutelafhankelijke of publieke proxy-route staat nog in de app');
assert.match(contents, /https:\/\/site\.api\.espn\.com\/apis\/v2\/sports\/soccer/,
  'Sleutelloze ESPN-standenbron ontbreekt');

console.log('Public security policy: geen openbare API-sleutels gevonden.');
