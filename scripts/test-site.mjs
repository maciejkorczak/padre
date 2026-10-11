// Testy funkcjonalne strony (Playwright / Chromium). Uruchamia własny serwer statyczny.
//   npm test                 -> testy + zrzuty do docs/screenshots
//   npm test -- --no-shots   -> bez zrzutów
//   npm test -- --links      -> dodatkowo sprawdza linki zewnętrzne (wymaga internetu)
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = !process.argv.includes('--no-shots');
const LINKS = process.argv.includes('--links');
const SHOT_DIR = path.join(root, 'docs/screenshots');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.avif': 'image/avif', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.json': 'application/json', '.txt': 'text/plain', '.xml': 'application/xml' };

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x');
    let p = decodeURIComponent(u.pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(root, p);
    if (!file.startsWith(root)) throw new Error('poza katalogiem');
    await stat(file);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end('404'); }
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://localhost:${server.address().port}/`;

const results = [];
let failed = 0;
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  if (!ok) failed++;
  console.log(`${ok ? '✔' : '✘'} ${name}${detail ? ' — ' + detail : ''}`);
}

const browser = await chromium.launch();
if (SHOTS) await mkdir(SHOT_DIR, { recursive: true });

async function open(viewport, opts = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: opts.dpr || 1, isMobile: !!opts.mobile, hasTouch: !!opts.mobile, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
  if (opts.init) await ctx.addInitScript(opts.init);
  const page = await ctx.newPage();
  const log = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) log.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => log.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => { if (r.url().startsWith(BASE) && !/ERR_ABORTED/.test(r.failure()?.errorText || '')) log.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`); });
  page.on('response', (r) => { if (r.url().startsWith(BASE) && r.status() >= 400) log.push(`HTTP ${r.status()}: ${r.url()}`); });
  // Blokuj zewnętrzne trackery w testach — liczymy tylko próby żądań.
  const trackerHits = [];
  await page.route(/googletagmanager\.com|connect\.facebook\.net|google-analytics\.com/, (route) => { trackerHits.push(route.request().url()); route.abort(); });
  await page.goto(BASE + (opts.query || 'index.html'), { waitUntil: 'networkidle' });
  return { ctx, page, log, trackerHits };
}
async function scrollThrough(page) {
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y <= h; y += 400) { await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y); await page.waitForTimeout(60); }
  await page.waitForTimeout(700);
}
const dl = (page) => page.evaluate(() => window.dataLayer.filter((e) => e && e.event).map((e) => ({ ...e })));
async function shot(page, name, opts = {}) {
  if (!SHOTS) return;
  await page.screenshot({ path: path.join(SHOT_DIR, name + '.jpg'), type: 'jpeg', quality: 78, ...opts });
}
async function shotSection(page, sel, name) {
  if (!SHOTS) return;
  const el = page.locator(sel).first();
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1600);
  // Nagłówek i przycisk przyklejony zasłaniałyby górę sekcji na zrzucie.
  await page.evaluate(() => document.querySelectorAll('[data-header], [data-sticky-cta]').forEach((e) => { e.style.visibility = 'hidden'; }));
  await el.screenshot({ path: path.join(SHOT_DIR, name + '.jpg'), type: 'jpeg', quality: 78 });
  await page.evaluate(() => document.querySelectorAll('[data-header], [data-sticky-cta]').forEach((e) => { e.style.visibility = ''; }));
}

/* ===== 1. Statyczny HTML produkcyjny ===== */
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const banned = [/headline show/i, /pierwsz\w* (samodzieln\w* )?koncert/i, /bilety ograniczone/i, /mesjasz edm/i, /techno msza/i, /spowied/i, /fenomenaln/i, /preview-note/, /data-unconfirmed/, /href="https?:\/\/(www\.)?ebilet\.pl\/?"/];
for (const re of banned) check(`Produkcja: brak „${re.source}”`, !re.test(html));
check('Title zgodny z briefem', html.includes('<title>Padre Guilherme w Polsce 2027 | Atlas Arena Łódź | Bilety</title>'));
check('Meta description zgodny z briefem', html.includes('content="Padre Guilherme wystąpi 14 lutego 2027 w Atlas Arenie w Łodzi. Sprawdź informacje o wydarzeniu i kup bilety na eBilet."'));
check('Canonical, OG, Twitter, robots', ['rel="canonical"', 'property="og:image"', 'name="twitter:card"', 'name="robots"'].every((s) => html.includes(s)));
const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
check('JSON-LD MusicEvent (startDate, location, performer, organizer)', ld['@type'] === 'MusicEvent' && ld.startDate === '2027-02-14' && ld.location?.name === 'Atlas Arena' && ld.performer?.length === 2 && ld.organizer?.name === 'Live2Listen');
check('JSON-LD bez niepotwierdzonych cen i dostępności', !JSON.stringify(ld).match(/price|availability/i));
check('Sekcja „Polska” nieopublikowana (brak zatwierdzonych zdjęć)', !html.includes('id="polska"'));

/* ===== 2. Desktop ===== */
{
  const { ctx, page, log, trackerHits } = await open({ width: 1440, height: 900 });
  await page.waitForTimeout(1600);
  await shot(page, 'po-desktop-hero');
  const h1 = await page.locator('h1').count();
  check('Desktop: dokładnie jeden H1', h1 === 1, `H1: ${h1}`);
  const headings = await page.evaluate(() => [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter((h) => h.offsetParent || h.closest('details')).map((h) => +h.tagName[1]));
  const skips = headings.filter((lvl, i) => i > 0 && lvl - headings[i - 1] > 1);
  check('Desktop: hierarchia nagłówków bez przeskoków', skips.length === 0, headings.join(','));
  const tickets = await page.$$eval('[data-ticket]', (els) => els.map((a) => ({ loc: a.dataset.ticket, href: a.getAttribute('href'), text: a.textContent.trim() })));
  const locs = tickets.map((t) => t.loc);
  check('CTA „Kup bilet” w: hero, menu, po bio, love, bilety, final, sticky, FAQ', ['hero', 'menu', 'bio', 'love', 'final', 'sticky', 'faq'].every((l) => locs.includes(l)), locs.join(', '));
  check('Brak linku eBilet → wszystkie CTA prowadzą do #bilety (nie do strony głównej eBilet)', tickets.every((t) => t.href === '#bilety'));
  check('Jednolita nazwa CTA', tickets.filter((t) => t.loc !== 'footer').every((t) => /^Kup bilet/i.test(t.text)), [...new Set(tickets.map((t) => t.text))].join(' | '));
  await scrollThrough(page);
  const ow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('Desktop: brak poziomego przewijania', ow <= 0, `nadmiar ${ow}px`);
  const broken = await page.$$eval('img', (imgs) => imgs.filter((i) => i.getAttribute('src') && (i.loading !== 'lazy' || i.complete)).filter((i) => !i.naturalWidth).map((i) => i.currentSrc || i.src));
  check('Desktop: brak niezaładowanych obrazów', broken.length === 0, broken.slice(0, 3).join(', '));
  const noAlt = await page.$$eval('img', (imgs) => imgs.filter((i) => !i.hasAttribute('alt')).length);
  check('Wszystkie obrazy mają atrybut alt', noAlt === 0);
  const ev = await dl(page);
  check('Pomiar: view_event po dojściu do sekcji biletów', ev.some((e) => e.event === 'view_event'));
  // Galeria + lightbox
  const first = page.locator('[data-lb-index="0"]');
  await first.scrollIntoViewIfNeeded();
  await shotSection(page, '#galeria', 'po-desktop-galeria');
  await first.click();
  await page.waitForTimeout(500);
  check('Lightbox: otwiera się po kliknięciu', await page.locator('[data-lightbox]').isVisible());
  check('Lightbox: fokus na przycisku zamknięcia', await page.evaluate(() => document.activeElement.matches('.lightbox__btn--close')));
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(250);
  check('Lightbox: strzałka w prawo → następne zdjęcie', (await page.textContent('[data-lb-count]')).trim() === '2 / 7');
  await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft');
  check('Lightbox: przewijanie w kółko (7 / 7)', (await page.textContent('[data-lb-count]')).trim() === '7 / 7');
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
  check('Lightbox: pułapka fokusu', await page.evaluate(() => !!document.activeElement.closest('[data-lightbox]')));
  await page.waitForTimeout(400);
  await shot(page, 'po-desktop-lightbox');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(450);
  check('Lightbox: ESC zamyka', !(await page.locator('[data-lightbox]').isVisible()));
  check('Lightbox: fokus wraca na miniaturę', await page.evaluate(() => document.activeElement.matches('[data-lb-index="0"]')));
  check('Pomiar: open_gallery', (await dl(page)).some((e) => e.event === 'open_gallery'));
  // FAQ
  const acc = page.locator('[data-acc-btn]').first();
  await acc.scrollIntoViewIfNeeded();
  await acc.click(); await page.waitForTimeout(500);
  const panelId = await acc.getAttribute('aria-controls');
  check('FAQ: rozwija odpowiedź (aria-expanded=true, panel widoczny)', (await acc.getAttribute('aria-expanded')) === 'true' && await page.locator('#' + panelId).isVisible());
  await shotSection(page, '#faq', 'po-desktop-faq');
  await acc.press('Enter'); await page.waitForTimeout(600);
  check('FAQ: zwija klawiszem Enter', (await acc.getAttribute('aria-expanded')) === 'false' && !(await page.locator('#' + panelId).isVisible()));
  // Biografia
  const ex = page.locator('[data-expander-btn]');
  await ex.scrollIntoViewIfNeeded(); await ex.click(); await page.waitForTimeout(500);
  check('Bio: „Poznaj historię Padre” rozwija tekst', await page.locator('#bio-more').isVisible() && (await ex.textContent()).includes('Zwiń'));
  // Szyna plakatów
  const rail = page.locator('#wydarzenia [data-rail-track]');
  await rail.scrollIntoViewIfNeeded();
  const before = await rail.evaluate((t) => t.scrollLeft);
  await page.click('#wydarzenia [data-rail-next]'); await page.waitForTimeout(900);
  check('Plakaty: przycisk „następne” przewija szynę', (await rail.evaluate((t) => t.scrollLeft)) > before);
  // Pomiar kliknięć (bez faktycznej nawigacji)
  await page.evaluate(() => document.addEventListener('click', (e) => e.preventDefault()));
  await page.click('[data-ticket="hero"]');
  await page.locator('#wideo .viral__card').first().click();
  const ev2 = await dl(page);
  check('Pomiar: click_buy_ticket z lokalizacją CTA', ev2.some((e) => e.event === 'click_buy_ticket' && e.cta_location === 'hero' && e.device_type === 'desktop'));
  check('Pomiar: click_media (TikTok)', ev2.some((e) => e.event === 'click_media' && /tiktok/.test(e.media_id)));
  check('Pomiar: kliknięcie CTA nie jest raportowane jako zakup', !ev2.some((e) => /purchase/i.test(e.event)));
  check('Brak trackerów bez konfiguracji', trackerHits.length === 0 && !(await page.locator('[data-consent]').isVisible()));
  // Klawiatura (świeże załadowanie strony)
  await page.goto(BASE + 'index.html', { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  check('Klawiatura: pierwszy Tab → „Przejdź do treści”', await page.evaluate(() => document.activeElement.classList.contains('skip-link')));
  await page.keyboard.press('Tab');
  check('Klawiatura: widoczny wskaźnik fokusu', await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle !== 'none'));
  for (const [sel, name] of [['#wideo', 'po-desktop-tiktok'], ['#djmag', 'po-desktop-djmag'], ['#artysta', 'po-desktop-bio'], ['#love', 'po-desktop-love'], ['#support', 'po-desktop-skytech'], ['#bilety', 'po-desktop-bilety'], ['#media', 'po-desktop-media'], ['.footer', 'po-desktop-stopka']]) await shotSection(page, sel, name);
  check('Desktop: konsola bez błędów i ostrzeżeń', log.length === 0, log.join(' | '));
  await ctx.close();
}

/* ===== 3. Telefon ===== */
for (const [vp, label] of [[{ width: 390, height: 844 }, 'iPhone 390'], [{ width: 360, height: 740 }, 'Android 360']]) {
  const { ctx, page, log } = await open(vp, { mobile: true, dpr: label.startsWith('iPhone') ? 2 : 1 });
  await page.waitForTimeout(1600);
  if (label.startsWith('iPhone')) await shot(page, 'po-mobile-hero');
  const heroBox = await page.locator('.hero__cta .btn').boundingBox();
  check(`${label}: CTA w hero widoczne na pierwszym ekranie`, heroBox && heroBox.y + heroBox.height <= vp.height);
  check(`${label}: menu ukryte, przycisk menu widoczny`, !(await page.locator('[data-nav]').isVisible()) && await page.locator('[data-nav-toggle]').isVisible());
  await page.click('[data-nav-toggle]'); await page.waitForTimeout(400);
  const navBox = await page.locator('[data-nav]').boundingBox();
  check(`${label}: menu otwiera się na całą wysokość ekranu`, await page.locator('[data-nav]').isVisible() && (await page.getAttribute('[data-nav-toggle]', 'aria-expanded')) === 'true' && navBox && navBox.height > vp.height * 0.8, navBox ? `wysokość panelu ${Math.round(navBox.height)}px` : '');
  if (label.startsWith('iPhone')) await shot(page, 'po-mobile-menu');
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  check(`${label}: ESC zamyka menu i zwraca fokus`, !(await page.locator('[data-nav]').isVisible()) && await page.evaluate(() => document.activeElement.matches('[data-nav-toggle]')));
  await page.click('[data-nav-toggle]'); await page.waitForTimeout(300);
  await page.click('[data-nav] a[href="#faq"]'); await page.waitForTimeout(1200);
  check(`${label}: link w menu zamyka menu i przewija do sekcji`, !(await page.locator('[data-nav]').isVisible()) && (await page.evaluate(() => document.getElementById('faq').getBoundingClientRect().top)) < 200);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(300);
  check(`${label}: sticky CTA ukryte w hero`, !(await page.locator('[data-sticky-cta]').evaluate((e) => e.classList.contains('is-visible'))));
  await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' })); await page.waitForTimeout(600);
  check(`${label}: sticky CTA widoczne po przewinięciu`, await page.locator('[data-sticky-cta]').evaluate((e) => e.classList.contains('is-visible')));
  if (label.startsWith('iPhone')) await shot(page, 'po-mobile-sticky');
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' })); await page.waitForTimeout(600);
  check(`${label}: sticky CTA chowa się przy stopce`, !(await page.locator('[data-sticky-cta]').evaluate((e) => e.classList.contains('is-visible'))));
  await scrollThrough(page);
  const ow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(`${label}: brak poziomego przewijania`, ow <= 0, `nadmiar ${ow}px`);
  const smallTargets = await page.$$eval('a, button', (els) => els.filter((e) => { const r = e.getBoundingClientRect(); return e.offsetParent && r.width > 0 && (r.height < 24 || r.width < 24) && !e.closest('p, dd, .faq__links, .faq__contacts'); }).map((e) => e.textContent.trim().slice(0, 30) || e.getAttribute('aria-label')));
  check(`${label}: cele dotykowe ≥ 24 px (WCAG 2.5.8)`, smallTargets.length === 0, smallTargets.slice(0, 5).join(' | '));
  // Swipe w lightboxie
  const g = page.locator('[data-lb-index="1"]');
  await g.scrollIntoViewIfNeeded(); await g.click(); await page.waitForTimeout(500);
  await page.evaluate(() => {
    const lb = document.querySelector('[data-lightbox]');
    const fire = (type, x) => lb.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: 'touch', clientX: x, clientY: 400 }));
    fire('pointerdown', 300); fire('pointerup', 120);
  });
  await page.waitForTimeout(300);
  check(`${label}: swipe w lightboxie → następne zdjęcie`, (await page.textContent('[data-lb-count]')).trim() === '3 / 7');
  if (label.startsWith('iPhone')) await shot(page, 'po-mobile-lightbox');
  await page.click('.lightbox__btn--close'); await page.waitForTimeout(400);
  if (label.startsWith('iPhone')) {
    for (const [sel, name] of [['#wideo', 'po-mobile-tiktok'], ['#galeria', 'po-mobile-galeria'], ['#bilety', 'po-mobile-bilety'], ['#kup', 'po-mobile-final']]) await shotSection(page, sel, name);
  }
  check(`${label}: konsola bez błędów`, log.length === 0, log.join(' | '));
  await ctx.close();
}

/* ===== 4. Tablet ===== */
{
  const { ctx, page, log } = await open({ width: 768, height: 1024 }, { mobile: true });
  await scrollThrough(page);
  const ow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('Tablet 768: brak poziomego przewijania', ow <= 0, `nadmiar ${ow}px`);
  check('Tablet 768: konsola bez błędów', log.length === 0, log.join(' | '));
  await ctx.close();
}

/* ===== 5. Ograniczony ruch ===== */
{
  const { ctx, page, log } = await open({ width: 1440, height: 900 }, { reduced: true });
  const anim = await page.$eval('.hero__img', (i) => getComputedStyle(i).animationName);
  check('Reduced motion: brak zoomu hero', anim === 'none');
  await page.evaluate(() => window.scrollTo({ top: 3000, behavior: 'instant' })); await page.waitForTimeout(200);
  const hidden = await page.$$eval('.reveal', (els) => els.filter((e) => getComputedStyle(e).opacity !== '1').length);
  check('Reduced motion: treść widoczna bez animacji wejścia', hidden === 0, `ukrytych: ${hidden}`);
  const plx = await page.$eval('.hero__media', (e) => e.style.transform);
  check('Reduced motion: paralaksa wyłączona', !plx);
  check('Reduced motion: konsola bez błędów', log.length === 0, log.join(' | '));
  await ctx.close();
}

/* ===== 6. Bez JavaScriptu ===== */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(BASE + 'index.html');
  const vis = await page.locator('#tickets-title').isVisible();
  check('Bez JS: treść i nagłówki widoczne', vis);
  await ctx.close();
}

/* ===== 7. Integracje włączone konfiguracją (symulacja) ===== */
{
  const init = () => {
    window.PADRE_CONFIG_OVERRIDE = { ticketUrl: 'https://www.ebilet.pl/muzyka/test-padre-guilherme', ga4Id: 'G-TEST000', metaPixelId: '000000000', accreditationReady: true, pressPackUrl: 'https://example.com/presspack.pdf', newsletterEndpoint: 'https://newsletter.example.test/subscribe' };
  };
  const { ctx, page, log, trackerHits } = await open({ width: 1440, height: 900 }, { init, query: 'index.html?utm_source=instagram&utm_medium=story&utm_campaign=padre_lodz' });
  const hrefs = await page.$$eval('[data-ticket]', (els) => els.map((a) => a.href));
  check('Konfiguracja: CTA prowadzą do konkretnego wydarzenia eBilet + UTM', hrefs.every((h) => h.startsWith('https://www.ebilet.pl/muzyka/test-padre-guilherme?') && h.includes('utm_source=instagram') && h.includes('utm_campaign=padre_lodz')));
  check('Konfiguracja: CTA otwierają nową kartę', (await page.$$eval('[data-ticket]', (els) => els.every((a) => a.target === '_blank' && a.rel.includes('noopener')))));
  check('Konfiguracja: sekcja biletów pokazuje przycisk zamiast komunikatu', await page.locator('[data-ticket-ready]').isVisible() && !(await page.locator('[data-ticket-pending]').isVisible()));
  check('Zgoda: baner widoczny, trackery nie ładują się przed zgodą', await page.locator('[data-consent]').isVisible() && trackerHits.length === 0);
  const consentDefault = await page.evaluate(() => window.dataLayer.some((a) => a && a[0] === 'consent' && a[1] === 'default' && a[2].ad_storage === 'denied' && a[2].analytics_storage === 'denied'));
  check('Consent Mode v2: domyślnie denied', consentDefault);
  await page.click('[data-consent-reject]'); await page.waitForTimeout(300);
  check('Zgoda: „Tylko niezbędne” → brak trackerów', trackerHits.length === 0 && !(await page.locator('[data-consent]').isVisible()));
  await page.click('[data-consent-open]'); await page.waitForTimeout(200);
  await page.check('[data-consent-analytics]'); await page.click('[data-consent-save]'); await page.waitForTimeout(500);
  check('Zgoda: tylko analityczne → GA4 tak, Meta Pixel nie', trackerHits.some((u) => u.includes('gtag/js')) && !trackerHits.some((u) => u.includes('facebook')));
  check('Akredytacje: przycisk widoczny z adresem formularza', (await page.getAttribute('[data-accreditation]', 'href')).includes('pressaccreditations.com') && await page.locator('[data-accreditation]').isVisible());
  check('Press pack: przycisk widoczny tylko z adresem', await page.locator('[data-presskit]').isVisible());
  // Newsletter: błąd backendu -> komunikat błędu, brak zdarzenia
  let status = 500;
  await page.route('https://newsletter.example.test/subscribe', (r) => r.fulfill({ status, body: '{}', contentType: 'application/json' }));
  const form = page.locator('[data-newsletter]');
  await form.scrollIntoViewIfNeeded();
  check('Newsletter: formularz widoczny tylko z backendem', await form.isVisible());
  await page.click('[data-newsletter] button[type="submit"]');
  check('Newsletter: walidacja adresu', (await page.textContent('#nl-msg')).includes('poprawny'));
  await page.fill('#nl-email', 'fan@example.com');
  await page.click('[data-newsletter] button[type="submit"]');
  check('Newsletter: walidacja zgody', (await page.textContent('#nl-msg')).includes('zgod'));
  await page.check('[data-newsletter] input[name="consent"]');
  await page.click('[data-newsletter] button[type="submit"]'); await page.waitForTimeout(400);
  check('Newsletter: błąd serwera → komunikat błędu, bez zdarzenia', (await page.textContent('#nl-msg')).includes('Nie udało') && !(await dl(page)).some((e) => e.event === 'newsletter_signup'));
  status = 200;
  await page.click('[data-newsletter] button[type="submit"]'); await page.waitForTimeout(400);
  check('Newsletter: sukces tylko po odpowiedzi 2xx + newsletter_signup', (await page.textContent('#nl-msg')).includes('przyjęte') && (await dl(page)).some((e) => e.event === 'newsletter_signup'));
  await page.evaluate(() => document.addEventListener('click', (e) => e.preventDefault()));
  await page.click('[data-accreditation]');
  check('Pomiar: submit_accreditation (kliknięcie do formularza)', (await dl(page)).some((e) => e.event === 'submit_accreditation'));
  const ev = (await dl(page)).find((e) => e.event === 'view_event' || e.event === 'submit_accreditation');
  check('Pomiar: zdarzenia niosą źródło kampanii (UTM)', ev && ev.utm_source === 'instagram');
  check('Konfiguracja: konsola bez błędów (poza celowo zablokowanymi trackerami i symulowanym błędem 500)', log.filter((l) => !/Failed to load resource/.test(l)).length === 0, log.join(' | '));
  await ctx.close();
}

/* ===== 8. Linki ===== */
{
  const hrefs = [...new Set([...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]))];
  const anchors = hrefs.filter((h) => h.startsWith('#') && h.length > 1);
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const missing = anchors.filter((a) => !ids.has(a.slice(1)));
  check('Linki wewnętrzne (#kotwice) mają cel', missing.length === 0, missing.join(', '));
  const local = hrefs.filter((h) => !/^(https?:|mailto:|#)/.test(h));
  const miss = [];
  for (const l of local) { try { await stat(path.join(root, l.split('?')[0])); } catch { miss.push(l); } }
  check('Pliki lokalne (PDF, ikony, CSS, JS) istnieją', miss.length === 0, miss.join(', '));
  if (LINKS) {
    const ext = hrefs.filter((h) => /^https?:/.test(h));
    for (const u of ext) {
      let st = 'ERR';
      try {
        const r = await fetch(u, { method: 'GET', redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36' }, signal: AbortSignal.timeout(15000) });
        st = r.status;
      } catch (e) { st = 'ERR ' + (e.cause?.code || e.name); }
      console.log(`   link ${st} ${u}`);
      results.push({ name: 'link', ok: st === 200, detail: `${st} ${u}`, link: true });
    }
  }
}

await browser.close();
server.close();
const tests = results.filter((r) => !r.link);
console.log(`\nWynik: ${tests.length - failed}/${tests.length} testów zaliczonych.`);
process.exit(failed ? 1 : 0);
