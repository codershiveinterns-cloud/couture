// One-off script: queries Wikimedia Commons (free-licensed, stable CDN, no
// API key required) for real photos matching each product's core keyword,
// and writes the resulting direct image URLs to prisma/product-images.json
// for the seed script to consume.
//
// Uses `intitle:` search (the keyword must appear in the filename itself)
// rather than plain full-text search — plain search on a general-purpose
// media repository matches loosely on descriptions/categories and pulls in
// a lot of unrelated results (e.g. searching "wireless headphones" also
// matched a photo of a Motorola phone). Requiring the keyword in the title
// is far more precise for sourcing a product catalog.

const fs = require('fs');
const path = require('path');

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function searchByTitleOnce(keyword, limit, exclude) {
  // Quote multi-word keywords: an unquoted `intitle:coffee table` only
  // constrains "coffee" to the title and treats "table" as a loose
  // full-text term, which let e.g. "Cake and coffee.jpg" match a
  // "coffee table" search. `intitle:"coffee table"` requires the phrase.
  const titleTerm = keyword.includes(' ') ? `intitle:"${keyword}"` : `intitle:${keyword}`;
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `${titleTerm} filetype:bitmap`,
    gsrnamespace: '6',
    gsrlimit: String(limit),
    prop: 'imageinfo',
    iiprop: 'url|size|mime',
    iiurlwidth: '900',
    format: 'json',
    origin: '*',
  });

  const res = await fetch(`${COMMONS_API}?${params.toString()}`, {
    headers: { 'User-Agent': 'ShoplyCatalogBot/1.0 (milestone-1 seed data; contact: dev@shoply.example)' },
  });

  if (res.status === 429 || res.status === 503) {
    const err = new Error(`rate limited (${res.status})`);
    err.retryable = true;
    throw err;
  }
  if (!res.ok) throw new Error(`Commons API ${res.status} for "${keyword}"`);

  const data = await res.json();
  const pages = data.query?.pages ? Object.values(data.query.pages) : [];

  return pages
    .map((p) => ({ title: p.title, info: p.imageinfo?.[0] }))
    .filter((p) => p.info)
    .filter((p) => ['image/jpeg', 'image/png'].includes(p.info.mime))
    .filter((p) => p.info.width >= 400 && p.info.height >= 400)
    .filter((p) => {
      const ratio = p.info.width / p.info.height;
      return ratio > 0.45 && ratio < 2.3; // drop extreme panoramas/strips
    })
    // Skip obvious diagrams/screenshots/logos, and proper-noun place names
    // that coincidentally contain a product word (e.g. the NYC "Lipstick
    // Building", a street or restaurant named after the keyword).
    .filter((p) => !/diagram|logo|chart|map|screenshot|icon/i.test(p.title))
    .filter(
      (p) =>
        !/building|museum|monument|memorial|tower|hotel|restaurant|street|bridge|station|church|square|statue/i.test(
          p.title,
        ),
    )
    .filter((p) => !exclude || !exclude.test(p.title))
    .map((p) => ({ title: p.title, url: p.info.thumburl }));
}

async function searchByTitle(keyword, limit = 10, exclude = null, attempt = 1) {
  try {
    return await searchByTitleOnce(keyword, limit, exclude);
  } catch (err) {
    if (err.retryable && attempt <= 4) {
      const backoff = attempt * 4000;
      process.stdout.write(`[retry in ${backoff}ms] `);
      await sleep(backoff);
      return searchByTitle(keyword, limit, exclude, attempt + 1);
    }
    throw err;
  }
}

// One concise, unambiguous keyword per target — precise enough that an
// intitle: search reliably returns on-topic product photography. Some
// keywords collide with unrelated Commons content (proper nouns, homonyms,
// museum-catalog scans of unrelated historical objects); `exclude` is an
// extra regex applied only to that target to filter those out.
const TARGETS = {
  categories: {
    electronics: { keyword: 'laptop', exclude: /cooler|specs|programmcode|nested realities/i },
    fashion: { keyword: 'fashion model' },
    'home-and-kitchen': { keyword: 'cookware', exclude: /geograph|nama|cyclad|bc,/i },
    'beauty-and-personal-care': { keyword: 'makeup' },
    'sports-and-outdoors': { keyword: 'yoga mat' },
  },
  products: {
    'aurora-wireless-headphones': { keyword: 'headphones', exclude: /test fixture|niosh|hearing protector/i },
    'pulse-smartwatch-series-4': { keyword: 'smartwatch' },
    'novabook-14-ultralight-laptop': { keyword: 'laptop', exclude: /cooler|specs|programmcode/i },
    'echodot-bluetooth-speaker': { keyword: 'loudspeaker' },
    'fastcharge-65w-usb-c-adapter': { keyword: 'usb-c charger', exclude: /flyer|td \(|lumia/i },
    'clearview-27-4k-monitor': { keyword: 'computer monitor', exclude: /broken|recycling|navy|geograph/i },

    'classic-cotton-crewneck-tee': { keyword: 't-shirt', exclude: /munitions/i },
    'slim-fit-denim-jacket': { keyword: 'denim jacket' },
    'everyday-running-sneakers': { keyword: 'sneakers' },
    'leather-minimalist-wallet': { keyword: 'leather wallet', exclude: /duct tape|fables|met /i },
    'lightweight-rain-jacket': { keyword: 'rain jacket' },
    'wool-blend-scarf': { keyword: 'scarf' },

    'stainless-steel-cookware-set-10-piece': { keyword: 'cookware', exclude: /geograph|nama|cyclad|bc,/i },
    'ceramic-non-stick-frying-pan': { keyword: 'skillet' },
    'linen-throw-pillow-cover-set': { keyword: 'cushion' },
    'electric-pour-over-kettle': { keyword: 'kettle', exclude: /dam|cabin|nps/i },
    'solid-oak-coffee-table': { keyword: 'coffee table' },
    '6-piece-glass-storage-container-set': { keyword: 'lunch box' },

    'hydrating-vitamin-c-serum': { keyword: 'serum', exclude: /bioreactor|blood|vaccine/i },
    'sulfate-free-shampoo-conditioner-set': { keyword: 'shampoo', exclude: /d'cruz|healthbeautyhint/i },
    'matte-finish-lipstick-trio': { keyword: 'lipstick', exclude: /building|portrait|veil|wanrong|katz/i },
    'rechargeable-electric-trimmer': { keyword: 'beard trimmer' },

    'non-slip-yoga-mat-6mm': { keyword: 'yoga mat' },
    'adjustable-dumbbell-set-5-25-lb': { keyword: 'dumbbell', exclude: /nebula|ngc|m27|messier/i },
    '2-person-backpacking-tent': { keyword: 'camping tent', exclude: /rock|turtle|colony/i },
    'insulated-stainless-water-bottle-32oz': { keyword: 'water bottle', exclude: /military|armed forces|enema|combo/i },
  },
  extras: {
    'hero-main': { keyword: 'fashion model' },
    'hero-accent': { keyword: 'sneakers' },
  },
};

async function main() {
  const out = { categories: {}, products: {}, extras: {} };

  for (const [group, entries] of Object.entries(TARGETS)) {
    for (const [key, target] of Object.entries(entries)) {
      process.stdout.write(`Searching intitle:"${target.keyword}" for ${key}... `);
      try {
        const results = await searchByTitle(target.keyword, 14, target.exclude);
        out[group][key] = results.slice(0, 4);
        console.log(`${results.length} results`);
      } catch (err) {
        console.log(`ERROR: ${err.message}`);
        out[group][key] = [];
      }
      await sleep(1500);
    }
  }

  const outPath = path.join(__dirname, '..', 'prisma', 'product-images.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`\nWrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
