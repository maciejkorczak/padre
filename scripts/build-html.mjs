// Składa index.html z szablonu src/index.html, treści z src/content.mjs,
// manifestu zdjęć i konfiguracji assets/js/config.js.
//
//   node scripts/build-html.mjs            -> index.html
//   node scripts/build-html.mjs --preview  -> dist-preview/site/index.html (baza dla podglądu-artefaktu)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { SOCIAL, TIKTOK, GALLERY, POSTERS, FAQ_MAIN, FAQ_MORE } from '../src/content.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PREVIEW = process.argv.includes('--preview');
const SITE_URL = 'https://padreguilherme.pl/';

const manifest = JSON.parse(await readFile(path.join(root, 'assets/img/manifest.json'), 'utf8'));
const sandbox = { window: {} };
vm.runInNewContext(await readFile(path.join(root, 'assets/js/config.js'), 'utf8'), sandbox);
const config = sandbox.window.PADRE_CONFIG;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ICONS = {
  arrow: '<svg class="icon" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>',
  left: '<svg class="icon" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  right: '<svg class="icon" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  close: '<svg class="icon" aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  play: '<svg class="icon" aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>',
  instagram: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none"/></svg>',
  tiktok: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.5 2.7 2.4 4.6 5 5"/></svg>',
  youtube: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21.6 7.2a2.8 2.8 0 0 0-2-2C17.9 4.8 12 4.8 12 4.8s-5.9 0-7.6.4a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2 12a29 29 0 0 0 .4 4.8 2.8 2.8 0 0 0 2 2c1.7.4 7.6.4 7.6.4s5.9 0 7.6-.4a2.8 2.8 0 0 0 2-2A29 29 0 0 0 22 12a29 29 0 0 0-.4-4.8z"/><path d="M10 15.2V8.8l5.2 3.2z" fill="currentColor" stroke="none"/></svg>',
  spotify: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M7.5 9.6c3-1 6.6-.8 9.4.8"/><path d="M8 12.6c2.5-.7 5.3-.5 7.5.7"/><path d="M8.6 15.5c1.9-.5 3.9-.3 5.6.5"/></svg>',
};

const img = (name) => {
  const m = manifest[name];
  if (!m) throw new Error(`Brak zdjęcia w manifeście: ${name}`);
  return m;
};
const srcset = (name, ext) => img(name).widths.map((w) => `assets/img/${name}-${w}.${ext} ${w}w`).join(', ');
const fallback = (name) => {
  const ws = img(name).widths;
  const w = ws.find((x) => x >= 1000) || ws[ws.length - 1];
  return `assets/img/${name}-${w}.jpg`;
};
const largest = (name) => img(name).widths[img(name).widths.length - 1];

// <pg-img name="" sizes="" alt="" class="" loading="" fetchpriority="" mobile="" pos="">
function picture(attrs) {
  const { name, sizes = '100vw', alt = '', mobile } = attrs;
  const m = img(name);
  const loading = attrs.loading || 'lazy';
  const cls = attrs.class ? ` class="${esc(attrs.class)}"` : '';
  const style = attrs.pos ? ` style="object-position:${esc(attrs.pos)}"` : '';
  const prio = attrs.fetchpriority ? ` fetchpriority="${esc(attrs.fetchpriority)}"` : '';
  const mob = mobile
    ? `<source media="(max-width: 767px)" type="image/avif" srcset="${srcset(mobile, 'avif')}" sizes="${esc(sizes)}"><source media="(max-width: 767px)" type="image/jpeg" srcset="${srcset(mobile, 'jpg')}" sizes="${esc(sizes)}">`
    : '';
  return `<picture>${mob}<source type="image/avif" srcset="${srcset(name, 'avif')}" sizes="${esc(sizes)}"><img src="${fallback(name)}" srcset="${srcset(name, 'jpg')}" sizes="${esc(sizes)}" width="${m.w}" height="${m.h}" alt="${esc(alt)}" loading="${loading}" decoding="${loading === 'eager' ? 'sync' : 'async'}"${prio}${cls}${style}></picture>`;
}

const parseAttrs = (s) => Object.fromEntries([...s.matchAll(/([a-z-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));

const social = SOCIAL.map((s) => `<li><a href="${s.href}" target="_blank" rel="noopener" aria-label="${s.label}" title="${s.label}" data-media="social-${s.icon}">${ICONS[s.icon]}</a></li>`).join('');

const fmtViews = (v) => String(v).replace('.', ',');
const tiktok = TIKTOK.map((t, i) => `<li class="viral__item reveal" style="--i:${i}">
        <a class="viral__card${t.highlight ? ' viral__card--pl' : ''}" href="https://www.tiktok.com/@padreguilherme/video/${t.id}" target="_blank" rel="noopener" data-media="tiktok-${t.img.replace('tiktok-', '')}">
          <span class="viral__thumb">${picture({ name: t.img, sizes: '(min-width: 1200px) 200px, (min-width: 768px) 30vw, 46vw', alt: t.alt })}<span class="play" aria-hidden="true">${ICONS.play}</span></span>
          <span class="viral__meta"><span class="viral__place">${esc(t.place)}</span><span class="viral__where">${esc(t.where)}</span><span class="viral__views"><span data-count="${t.views}">${fmtViews(t.views)}</span> mln wyświetleń</span></span>
          <span class="visually-hidden">(TikTok, otwiera się w nowej karcie)</span>
        </a>
      </li>`).join('\n      ');

const gallery = GALLERY.map((g, i) => {
  const m = img(g.img);
  const L = largest(g.img);
  return `<li class="gallery__item gallery__item--${g.layout} reveal" style="--i:${i % 3}">
        <button class="gallery__btn" type="button" data-lb-index="${i}" data-lb-avif="assets/img/${g.img}-${L}.avif" data-lb-jpg="assets/img/${g.img}-${L}.jpg" data-lb-w="${m.w}" data-lb-h="${m.h}" data-lb-caption="${esc(g.caption)}" aria-label="Powiększ zdjęcie: ${esc(g.caption)}">
          <span class="gallery__frame"><span class="gallery__plx" data-parallax-inner>${picture({ name: g.img, sizes: g.sizes, alt: g.caption, pos: g.pos })}</span></span>
        </button>
      </li>`;
}).join('\n      ');

const posters = POSTERS.map((p, i) => `<li class="poster reveal" style="--i:${i % 5}">
        <div class="poster__card">
          <span class="poster__img">${picture({ name: p.img, sizes: '(min-width: 1200px) 230px, (min-width: 768px) 28vw, 62vw', alt: p.alt })}</span>
          <span class="poster__meta"><span class="poster__title">${esc(p.title)}</span><span class="poster__where">${esc(p.where)}</span></span>
        </div>
      </li>`).join('\n      ');

function faqItem(item, id) {
  const paras = item.a.map((t) => `<p>${esc(t)}</p>`).join('');
  const list = item.list ? `<ul class="faq__list">${item.list.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '';
  const contacts = item.contacts ? `<ul class="faq__contacts">${item.contacts.map((c) => `<li><span>${esc(c.label)}:</span> <a href="mailto:${c.email}">${c.email}</a></li>`).join('')}</ul>` : '';
  const links = item.links ? `<ul class="faq__links">${item.links.map((l) => `<li><a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`).join('')}</ul>` : '';
  const ticket = item.ticket ? '<p><a class="btn btn--primary btn--sm" href="#bilety" data-ticket="faq">Kup bilet</a></p>' : '';
  return `<div class="acc">
        <h3 class="acc__h"><button class="acc__btn" type="button" id="${id}-btn" aria-expanded="false" aria-controls="${id}-panel" data-acc-btn>${esc(item.q)}<span class="acc__icon" aria-hidden="true"></span></button></h3>
        <div class="acc__panel" id="${id}-panel" role="region" aria-labelledby="${id}-btn" data-acc-panel>
          <div class="acc__inner">${paras}${list}${contacts}${links}${ticket}</div>
        </div>
      </div>`;
}
const faq = `<div class="acc-group reveal" data-acc>
      ${FAQ_MAIN.map((q, i) => faqItem(q, `faq-${i + 1}`)).join('\n      ')}
      </div>
      <h3 class="faq__more-title reveal">Pozostałe pytania</h3>
      <div class="acc-group reveal" data-acc>
      ${FAQ_MORE.map((q, i) => faqItem(q, `faq-m${i + 1}`)).join('\n      ')}
      </div>`;

const heroPreload = ['hero-m', 'hero'].map((n) => `<link rel="preload" as="image" type="image/avif" imagesrcset="${srcset(n, 'avif')}" imagesizes="100vw" media="${n === 'hero-m' ? '(max-width: 767px)' : '(min-width: 768px)'}" fetchpriority="high">`).join('\n');

// Dane strukturalne (@graph): strona, wydarzenie, wykonawcy, organizator i FAQ widoczne na stronie.
const IMG = [`${SITE_URL}assets/og-image.jpg`, `${SITE_URL}assets/img/hero-1920.jpg`];
const padre = {
  '@type': 'Person', '@id': `${SITE_URL}#padre-guilherme`, name: 'Padre Guilherme', alternateName: 'Guilherme Peixoto',
  description: 'Portugalski ksiądz, DJ i producent muzyki elektronicznej.', nationality: { '@type': 'Country', name: 'Portugalia' },
  image: `${SITE_URL}assets/img/artysta-1024.jpg`, sameAs: SOCIAL.map((s) => s.href),
};
const skytech = { '@type': 'Person', '@id': `${SITE_URL}#skytech`, name: 'Skytech', description: 'Polski DJ i producent muzyki elektronicznej.', url: 'http://skytechmusic.com', image: `${SITE_URL}assets/img/skytech-pomaranczowe-800.jpg` };
const organizer = {
  '@type': 'Organization', '@id': `${SITE_URL}#live2listen`, name: 'Live2Listen', legalName: 'L2L sp. z o.o.', url: 'https://www.live2listen.com',
  sameAs: ['https://www.facebook.com/live2listen/', 'https://www.instagram.com/live_2_listen/', 'https://www.tiktok.com/@live_2_listen'],
};
const event = {
  '@type': 'MusicEvent', '@id': `${SITE_URL}#koncert`,
  name: 'Padre Guilherme - Love is My Religion | Atlas Arena, Łódź',
  description: 'Koncert Padre Guilherme, księdza i DJ-a z Portugalii, w Atlas Arenie w Łodzi 14 lutego 2027.' + (config.supportAnnounced ? ' Support: Skytech.' : ''),
  startDate: '2027-02-14',
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  inLanguage: 'pl-PL',
  url: SITE_URL,
  image: IMG,
  location: {
    '@type': 'Place', name: 'Atlas Arena', url: 'https://atlasarena.pl',
    address: { '@type': 'PostalAddress', streetAddress: 'al. Bandurskiego 7', postalCode: '94-020', addressLocality: 'Łódź', addressRegion: 'łódzkie', addressCountry: 'PL' },
  },
  performer: [{ '@id': padre['@id'] }, ...(config.supportAnnounced ? [{ '@id': skytech['@id'] }] : [])],
  organizer: { '@id': organizer['@id'] },
};
// Oferta: tylko link i dostępność (sprzedaż od 13.10.2026). Bez cen i nazwy sprzedawcy.
if (config.ticketUrl) event.offers = { '@type': 'Offer', url: config.ticketUrl, availability: 'https://schema.org/InStock', validFrom: '2026-10-13' };
const plain = (q) => [...q.a, ...(q.list || []).map((t) => `- ${t}`), ...(q.contacts || []).map((c) => `${c.label}: ${c.email}`), ...(q.links || []).map((l) => `${l.label}: ${new URL(l.href, SITE_URL).href}`)].join(' ');
const faqLd = { '@type': 'FAQPage', '@id': `${SITE_URL}#faq`, mainEntity: [...FAQ_MAIN, ...FAQ_MORE].map((q) => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: plain(q) } })) };
const jsonld = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', '@id': `${SITE_URL}#strona`, name: 'Padre Guilherme w Atlas Arenie', url: SITE_URL, inLanguage: 'pl-PL', publisher: { '@id': organizer['@id'] } },
    { '@type': 'WebPage', '@id': `${SITE_URL}#witryna`, url: SITE_URL, name: 'Padre Guilherme w Polsce 2027 | Atlas Arena Łódź | Bilety', inLanguage: 'pl-PL', isPartOf: { '@id': `${SITE_URL}#strona` }, about: { '@id': event['@id'] }, primaryImageOfPage: IMG[0] },
    event, padre, ...(config.supportAnnounced ? [skytech] : []), organizer, faqLd,
  ],
};

let html = await readFile(path.join(root, 'src/index.html'), 'utf8');

html = html
  .replace(/<pg-img\s+([^>]*)><\/pg-img>/g, (_, a) => picture(parseAttrs(a)))
  .replace('<!--pg:preload-hero-->', heroPreload)
  .replace('<!--pg:jsonld-->', `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>`)
  .replaceAll('<!--pg:social-->', social)
  .replace('<!--pg:tiktok-->', tiktok)
  .replace('<!--pg:gallery-->', gallery)
  .replace('<!--pg:posters-->', posters)
  .replace('<!--pg:faq-->', faq)
  .replace(/<!--pg:icon-([a-z]+)-->/g, (_, n) => ICONS[n]);

// Weryfikacja domeny w Google Search Console i Meta Business (jeśli podano w config.js).
const verify = [
  config.googleSiteVerification && `<meta name="google-site-verification" content="${esc(config.googleSiteVerification)}">`,
  config.facebookDomainVerification && `<meta name="facebook-domain-verification" content="${esc(config.facebookDomainVerification)}">`,
].filter(Boolean).join('\n');
if (verify) html = html.replace('<link rel="icon"', `${verify}\n<link rel="icon"`);

// Linki biletowe: konkretne wydarzenie w eBilet albo — gdy brak linku — sekcja #bilety.
if (config.ticketUrl) {
  html = html.replace(/href="#bilety"(\s+data-ticket="[^"]+")/g, `href="${esc(config.ticketUrl)}" target="_blank" rel="noopener"$1`);
  html = html.replace(/\sdata-ticket-pending([ >])/g, ' data-ticket-pending hidden$1');
} else {
  html = html.replace(/\sdata-ticket-ready([ >])/g, ' data-ticket-ready hidden$1');
}

// Sekcje ukryte do czasu ogłoszenia: support (Skytech) i harmonogram.
for (const [flag, attr] of [[config.supportAnnounced, 'data-support'], [config.scheduleAnnounced, 'data-schedule']]) {
  if (flag) { html = html.replaceAll(` ${attr}`, ''); continue; }
  html = html.replace(new RegExp(`<!-- [^>]*\\(${attr}:[^>]*-->\\s*<section\\b[^>]*\\s${attr}[\\s\\S]*?</section>\\s*`, 'g'), '');
  html = html.replace(new RegExp(`[ \\t]*<li ${attr}>[\\s\\S]*?</li>\\n`, 'g'), '');
  if (html.includes(attr)) throw new Error(`Nie usunięto wszystkich elementów ${attr}`);
}

// Akredytacje: przycisk wpisany do HTML (działa także bez JavaScriptu).
if (config.accreditationReady && config.accreditationUrl) {
  html = html.replace('<a class="btn btn--primary" href="#media" data-accreditation hidden>', `<a class="btn btn--primary" href="${esc(config.accreditationUrl)}" target="_blank" rel="noopener" data-accreditation>`);
  html = html.replace(/<p class="media__pending reveal" data-accreditation-pending>[\s\S]*?<\/p>\s*/, '');
}

// Wersjonowanie CSS i JS (bezpieczny długi cache na serwerze).
for (const f of ['assets/css/main.css', 'assets/js/config.js', 'assets/js/main.js']) {
  const v = createHash('sha1').update(await readFile(path.join(root, f))).digest('hex').slice(0, 8);
  html = html.replace(`"${f}"`, `"${f}?v=${v}"`);
}

const left = html.match(/<pg-img|<!--pg:/g);
if (left) throw new Error(`Nierozwinięte znaczniki: ${left.length}`);
// Komentarze szablonu nie trafiają na stronę.
html = html.replace(/[ \t]*<!--[\s\S]*?-->\n?/g, '');

const outDir = PREVIEW ? path.join(root, 'dist-preview/site') : root;
await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, 'index.html'), html);
console.log(`OK: ${path.relative(root, path.join(outDir, 'index.html'))} (${(html.length / 1024).toFixed(1)} KB)${config.ticketUrl ? '' : ' — UWAGA: brak ticketUrl, przyciski prowadzą do #bilety'}`);
