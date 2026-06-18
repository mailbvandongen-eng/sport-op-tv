import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHANNEL_ID = 'UCT4oPufBQa0f6C67Fw_HXNg';
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const OUTPUT_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'nos-highlights.json');
const MAX_ITEMS = 256;

function decodeXml(value = '') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function getTag(block, tagName) {
  const escapedTag = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = block.match(new RegExp(`<${escapedTag}[^>]*>([\\s\\S]*?)<\\/${escapedTag}>`, 'i'));
  return match ? decodeXml(match[1].trim()) : '';
}

function getAttr(block, tagName, attrName) {
  const escapedTag = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedAttr = attrName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tag = block.match(new RegExp(`<${escapedTag}[^>]*>`, 'i'));
  if (!tag) return '';
  const attr = tag[0].match(new RegExp(`${escapedAttr}="([^"]+)"`, 'i'));
  return attr ? decodeXml(attr[1]) : '';
}

function getAlternateLink(block) {
  const match = block.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/i);
  return match ? decodeXml(match[1]) : '';
}

function parseSummaryTitle(title) {
  const match = title.match(/^Samenvatting\s+(.+?)\s+-\s+(.+?)\s+\|\s+(Groep\s+[A-Z])\s+\|\s+WK2026\b/i);
  if (!match) return null;

  return {
    home: match[1].trim(),
    away: match[2].trim(),
    group: match[3].trim()
  };
}

function normalizeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function parseFeed(xml) {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)]
    .map(([, block]) => {
      const title = getTag(block, 'title');
      const match = parseSummaryTitle(title);
      const videoId = getTag(block, 'yt:videoId');
      const url = getAlternateLink(block);

      if (!match || !videoId || !url.includes('/watch')) return null;

      return {
        videoId,
        title,
        url,
        thumbnail: getAttr(block, 'media:thumbnail', 'url') || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        published: normalizeDate(getTag(block, 'published')),
        updated: normalizeDate(getTag(block, 'updated')),
        source: 'NOS Sport YouTube',
        ...match
      };
    })
    .filter(Boolean);
}

async function readExistingItems() {
  try {
    const existing = JSON.parse(await readFile(OUTPUT_PATH, 'utf8'));
    return Array.isArray(existing.items) ? existing.items : [];
  } catch {
    return [];
  }
}

function mergeItems(existingItems, freshItems) {
  const byVideoId = new Map();

  for (const item of [...existingItems, ...freshItems]) {
    if (!item?.videoId || !item?.url || !item?.home || !item?.away) continue;
    byVideoId.set(item.videoId, item);
  }

  return [...byVideoId.values()]
    .sort((a, b) => new Date(b.published || b.updated || 0) - new Date(a.published || a.updated || 0))
    .slice(0, MAX_ITEMS);
}

async function main() {
  const response = await fetch(FEED_URL, {
    headers: {
      'User-Agent': 'sport-op-tv-highlight-updater/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`NOS Sport RSS ophalen mislukt: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  const freshItems = parseFeed(xml);
  const existingItems = await readExistingItems();
  const items = mergeItems(existingItems, freshItems);

  const payload = {
    source: FEED_URL,
    channelId: CHANNEL_ID,
    updatedAt: new Date().toISOString(),
    items
  };

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`NOS highlights bijgewerkt: ${freshItems.length} nieuw uit feed, ${items.length} totaal.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
