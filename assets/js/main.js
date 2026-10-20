/* Padre Guilherme — Atlas Arena, Łódź, 14.02.2027. Bez zależności. */
(function () {
  'use strict';
  window.__pgReady = true;

  var doc = document;
  var root = doc.documentElement;
  var cfg = Object.assign({}, window.PADRE_CONFIG || {}, window.PADRE_CONFIG_OVERRIDE || {});

  var mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqMotionDesktop = window.matchMedia('(min-width: 960px) and (hover: hover) and (pointer: fine)');
  var mqMobile = window.matchMedia('(max-width: 767px) and (min-height: 421px)'); // jak w CSS paska z „Kup bilet”
  var reduced = mqReduced.matches;
  if (reduced) root.classList.add('no-anim');

  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };
  var store = {
    get: function (k, s) { try { return JSON.parse((s || localStorage).getItem(k)); } catch (e) { return null; } },
    set: function (k, v, s) { try { (s || localStorage).setItem(k, JSON.stringify(v)); } catch (e) { /* tryb prywatny */ } }
  };

  /* ---------- Kampanie (UTM) ---------- */
  // Tylko z adresu strony i tylko w pamięci: nic nie jest zapisywane w przeglądarce przed zgodą.
  // Strona ma jeden adres (nawigacja przez #kotwice), więc parametry zostają w adresie do końca wizyty.
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var campaign = (function () {
    var found = {};
    try {
      var qs = new URLSearchParams(location.search);
      UTM_KEYS.forEach(function (k) { if (qs.get(k)) found[k] = qs.get(k).slice(0, 150); });
    } catch (e) { /* brak URLSearchParams */ }
    return found;
  })();

  /* ---------- Pomiar ---------- */
  window.dataLayer = window.dataLayer || [];
  function deviceType() { var w = window.innerWidth; return w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop'; }
  function track(name, params) {
    var payload = Object.assign({ device_type: deviceType() }, campaign, params || {});
    window.dataLayer.push(Object.assign({ event: name }, payload));
    if (typeof window.gtag === 'function' && cfg.ga4Id && !cfg.gtmId && name !== 'page_view') {
      window.gtag('event', name, Object.assign({}, payload));
    }
    if (typeof window.fbq === 'function') {
      if (name === 'view_event') window.fbq('track', 'ViewContent', { content_name: 'Padre Guilherme - Atlas Arena 2027' });
      if (name === 'click_buy_ticket') window.fbq('trackCustom', 'ClickBuyTicket', { cta_location: payload.cta_location });
    }
  }
  window.pgTrack = track;

  /* ---------- Zgoda (Consent Mode v2) — tylko gdy skonfigurowano narzędzia ---------- */
  var hasTrackers = !!(cfg.gtmId || cfg.ga4Id || cfg.metaPixelId);
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  if (hasTrackers) {
    window.gtag('consent', 'default', { ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500 });
  }
  var loaded = {};
  function loadScript(src) { var s = doc.createElement('script'); s.async = true; s.src = src; doc.head.appendChild(s); }
  function applyConsent(c) {
    if (c.analytics && cfg.ga4Id) window['ga-disable-' + cfg.ga4Id] = false;
    window.gtag('consent', 'update', {
      analytics_storage: c.analytics ? 'granted' : 'denied',
      ad_storage: c.marketing ? 'granted' : 'denied',
      ad_user_data: c.marketing ? 'granted' : 'denied',
      ad_personalization: c.marketing ? 'granted' : 'denied'
    });
    if ((c.analytics || c.marketing) && cfg.gtmId && !loaded.gtm) {
      loaded.gtm = true;
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      loadScript('https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(cfg.gtmId));
    } else if (c.analytics && cfg.ga4Id && !cfg.gtmId && !loaded.ga4) {
      loaded.ga4 = true;
      loadScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.ga4Id));
      window.gtag('js', new Date());
      window.gtag('config', cfg.ga4Id, { send_page_view: true, cookie_flags: 'secure;samesite=lax', cookie_expires: 34128000 }); // 395 dni
    }
    if (c.marketing && cfg.metaPixelId && !loaded.meta) {
      loaded.meta = true;
      /* eslint-disable */
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, doc, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */
      window.fbq('init', cfg.metaPixelId);
      window.fbq('track', 'PageView');
    }
  }
  // Wersja zgody: podnieś, gdy zmienią się narzędzia lub cele (np. nowy piksel). Zgoda ważna 12 miesięcy.
  var CONSENT_V = 1, CONSENT_TTL = 365 * 864e5;
  function readConsent() {
    var c = store.get('pg_consent');
    if (!c || c.v !== CONSENT_V) return null;
    var age = Date.now() - c.ts; // zapis „z przyszłości” (zegar był przestawiony) też wygasa; dzień tolerancji
    return age > -864e5 && age < CONSENT_TTL ? c : null;
  }
  function expireCookies(names) {
    var host = location.hostname.replace(/^www\./, '');
    names.forEach(function (n) {
      ['', '; domain=' + host, '; domain=.' + host].forEach(function (d) { doc.cookie = n + '=; Max-Age=0; path=/' + d; });
    });
  }
  // Brak zgody na kategorię: blokada narzędzia i usunięcie jego ciasteczek (także tych z wcześniejszej zgody).
  // Zwraca true, gdy skrypt narzędzia był już wczytany w tej wizycie: wtedy strona się przeładowuje.
  function withdraw(c) {
    var reload = false;
    if (!c.analytics && cfg.ga4Id) {
      window['ga-disable-' + cfg.ga4Id] = true;
      expireCookies(['_ga', '_ga_' + cfg.ga4Id.replace(/^G-/, '')]);
      if (loaded.ga4 || loaded.gtm) reload = true;
    }
    if (!c.marketing) {
      if (typeof window.fbq === 'function') window.fbq('consent', 'revoke');
      expireCookies(['_fbp', '_fbc']);
      if (loaded.meta || loaded.gtm) reload = true;
    }
    return reload;
  }
  function initConsent() {
    var box = $('[data-consent]');
    if (!hasTrackers || !box) return;
    $$('[data-privacy-link]').forEach(function (a) { if (cfg.privacyPolicyUrl) a.href = cfg.privacyPolicyUrl; });
    var opts = $('[data-consent-opts]', box);
    var cbA = $('[data-consent-analytics]', box);
    var cbM = $('[data-consent-marketing]', box);
    var btnSave = $('[data-consent-save]', box);
    var btnCustom = $('[data-consent-custom]', box);
    var opener = null;
    // Miejsce pod banerem: element z fokusem nie chowa się za nim (scroll-padding) i da się dojść do końca strony.
    function reserve(on) {
      var h = on ? (box.offsetHeight + 24) + 'px' : '';
      root.style.scrollPaddingBottom = h; doc.body.style.paddingBottom = h;
    }
    function save(c) {
      c.v = CONSENT_V; c.ts = Date.now();
      store.set('pg_consent', c);
      box.hidden = true; reserve(false); updateSticky();
      if (withdraw(c)) { location.reload(); return; }
      applyConsent(c);
      var back = opener && opener.isConnected ? opener : doc.getElementById('tresc');
      opener = null;
      if (back) { if (back.id === 'tresc') back.setAttribute('tabindex', '-1'); back.focus({ preventScroll: true }); }
    }
    function open(custom) {
      var saved = readConsent() || {};
      cbA.checked = !!saved.analytics; cbM.checked = !!saved.marketing;
      opts.hidden = !custom; btnSave.hidden = !custom; btnCustom.hidden = !!custom;
      box.hidden = false;
      reserve(true); updateSticky();
    }
    $('[data-consent-accept]', box).addEventListener('click', function () { save({ analytics: true, marketing: true }); });
    $('[data-consent-reject]', box).addEventListener('click', function () { save({ analytics: false, marketing: false }); });
    btnCustom.addEventListener('click', function () { open(true); cbA.focus(); });
    btnSave.addEventListener('click', function () { save({ analytics: cbA.checked, marketing: cbM.checked }); });
    var reopen = $('[data-consent-open]');
    if (reopen) { reopen.hidden = false; reopen.addEventListener('click', function () { opener = reopen; open(true); cbA.focus(); }); }
    window.addEventListener('resize', function () { if (!box.hidden) reserve(true); });
    box.addEventListener('keydown', function (e) {
      if (!opener) return;
      if (e.key === 'Escape') { e.preventDefault(); box.hidden = true; reserve(false); updateSticky(); var o = opener; opener = null; o.focus(); return; }
      if (e.key !== 'Tab') return;
      var f = $$('input:not([disabled]), button, a[href]', box).filter(function (el) { return el.offsetParent !== null; });
      if ((!e.shiftKey && doc.activeElement === f[f.length - 1]) || (e.shiftKey && doc.activeElement === f[0])) { e.preventDefault(); opener.focus(); }
    });
    var saved = readConsent();
    if (saved) applyConsent(saved); else open(false);
  }

  /* ---------- Bilety ---------- */
  function ticketHref() {
    if (!cfg.ticketUrl) return '';
    if (!cfg.passUtmToTicketUrl || !Object.keys(campaign).length) return cfg.ticketUrl;
    try {
      var u = new URL(cfg.ticketUrl);
      UTM_KEYS.forEach(function (k) { if (campaign[k] && k.indexOf('utm_') === 0 && !u.searchParams.has(k)) u.searchParams.set(k, campaign[k]); });
      return u.toString();
    } catch (e) { return cfg.ticketUrl; }
  }
  function initTickets() {
    if (!window.PADRE_CONFIG) return; // brak config.js: zostają linki partnera wpisane do HTML przy budowaniu
    var href = ticketHref();
    $$('[data-ticket-ready]').forEach(function (el) { el.hidden = !href; });
    $$('[data-ticket-pending]').forEach(function (el) { el.hidden = !!href; });
    $$('[data-ticket]').forEach(function (a) {
      if (href) {
        a.href = href; a.target = '_blank'; a.rel = 'noopener';
        if (!$('.visually-hidden', a)) a.insertAdjacentHTML('beforeend', '<span class="visually-hidden"> (sprzedaż biletów, otwiera się w nowej karcie)</span>');
      } else {
        a.setAttribute('href', '#bilety'); a.removeAttribute('target');
        var hint = $('.visually-hidden', a); if (hint) hint.remove();
      }
      a.addEventListener('click', function () {
        track('click_buy_ticket', { cta_location: a.getAttribute('data-ticket'), ticket_url_ready: !!href, link_url: href || '#bilety' });
      });
    });
    var section = $('[data-view-event]');
    if (section && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { track('view_event', { section: 'bilety' }); io.disconnect(); }
      }, { rootMargin: '-35% 0px -35% 0px' }); // sekcja dochodzi do środka ekranu — działa przy każdej wysokości sekcji
      io.observe(section);
    }
  }

  /* ---------- Nagłówek i menu ---------- */
  function initHeader() {
    var header = $('[data-header]');
    var toggle = $('[data-nav-toggle]');
    var nav = $('[data-nav]');
    var label = $('[data-nav-toggle-label]');
    var ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () { header.classList.toggle('is-scrolled', window.scrollY > 24); ticking = false; });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function setOpen(open, returnFocus) {
      toggle.setAttribute('aria-expanded', String(open));
      label.textContent = open ? 'Zamknij menu' : 'Otwórz menu';
      nav.classList.toggle('is-open', open);
      root.classList.toggle('nav-open', open);
      $$('main, footer, [data-sticky-cta]').forEach(function (el) { if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert'); });
      updateSticky();
      if (open) { var first = $('a', nav); if (first) first.focus(); } else if (returnFocus) toggle.focus();
    }
    toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a') && nav.classList.contains('is-open')) setOpen(false); });
    doc.addEventListener('keydown', function (e) {
      if (!nav.classList.contains('is-open')) return;
      if (e.key === 'Escape') { setOpen(false, true); return; }
      if (e.key === 'Tab') {
        var items = $$('a[href], button', header).filter(function (el) { return el.offsetParent !== null; });
        var first = items[0], last = items[items.length - 1];
        if (!header.contains(doc.activeElement)) { e.preventDefault(); first.focus(); }
        else if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (e) { if (e.matches && nav.classList.contains('is-open')) setOpen(false); });

    // Podświetlenie bieżącej sekcji w menu.
    var links = $$('.site-nav__list a');
    if ('IntersectionObserver' in window) {
      var map = {};
      links.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) map[s.id] = a; });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var a = map[en.target.id]; if (!a) return;
          if (en.isIntersecting) { links.forEach(function (l) { l.removeAttribute('aria-current'); }); a.setAttribute('aria-current', 'true'); }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(map).forEach(function (id) { io.observe(doc.getElementById(id)); });
    }
  }

  /* ---------- Odliczanie (pełne dni do wydarzenia, czas polski) ---------- */
  function initCountdown() {
    var box = $('[data-countdown]');
    if (!box) return;
    var ev = (cfg.eventDate || '2027-02-14').split('-').map(Number);
    var num = $('[data-cd="d"]', box), unit = $('[data-cd-unit="d"]', box);
    function todayInPoland() {
      try {
        var parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).split('-').map(Number);
        return Date.UTC(parts[0], parts[1] - 1, parts[2]);
      } catch (e) { var d = new Date(); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); }
    }
    function tick() {
      var days = Math.round((Date.UTC(ev[0], ev[1] - 1, ev[2]) - todayInPoland()) / 864e5);
      if (!(days > 0)) { box.hidden = true; return false; }
      num.textContent = days;
      unit.textContent = days === 1 ? 'dzień' : 'dni';
      return true;
    }
    if (tick()) { box.hidden = false; setInterval(tick, 60000); }
  }

  /* ---------- Pojawianie się elementów ---------- */
  function initReveal() {
    var items = $$('.reveal');
    var all = function () { items.forEach(function (el) { el.classList.add('is-in'); }); };
    // Okno wyższe niż 2000 px to nie ekran, tylko render (np. robot wyszukiwarki): pokaż wszystko od razu.
    if (reduced || !('IntersectionObserver' in window) || window.innerHeight > 2000) { all(); return; }
    window.addEventListener('resize', function () { if (window.innerHeight > 2000) all(); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Paralaksa (tylko desktop, bez reduced motion) ---------- */
  function initParallax() {
    var layers = $$('[data-parallax]').map(function (el) { return { el: el, type: 'layer', k: parseFloat(el.getAttribute('data-parallax')) || 0.15 }; })
      .concat($$('[data-parallax-img]').map(function (el) { return { el: el, type: 'frame', img: $('img', el) }; }))
      .concat($$('[data-parallax-inner]').map(function (el) { return { el: el, type: 'inner' }; }));
    if (!layers.length) return;
    var active = new Set();
    var enabled = false, ticking = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { var l = en.target.__plx; if (en.isIntersecting) active.add(l); else active.delete(l); });
      request();
    }, { rootMargin: '10% 0px' });
    layers.forEach(function (l) { l.el.__plx = l; });
    function reset() { layers.forEach(function (l) { (l.img || l.el).style.transform = ''; }); }
    function frame() {
      ticking = false;
      if (!enabled) return;
      var vh = window.innerHeight;
      active.forEach(function (l) {
        var box = (l.type === 'layer' ? l.el.parentNode : l.el).getBoundingClientRect();
        var offset = (box.top + box.height / 2) - vh / 2;
        if (l.type === 'layer') {
          var extra = Math.max(0, (l.el.offsetHeight - l.el.parentNode.offsetHeight) / 2);
          var y = -offset * l.k;
          if (l.el.parentNode.classList.contains('hero')) y = Math.max(0, y); else y = Math.max(-extra, Math.min(extra, y));
          l.el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
        } else {
          var r = Math.max(-1, Math.min(1, offset / vh));
          if (l.type === 'frame') l.img.style.transform = 'translate3d(0,' + (-r * 5).toFixed(2) + '%,0) scale(1.12)';
          else l.el.style.transform = 'translate3d(0,' + (-r * 5).toFixed(2) + '%,0)';
        }
      });
    }
    function request() { if (!ticking && enabled) { ticking = true; requestAnimationFrame(frame); } }
    function update() {
      enabled = mqMotionDesktop.matches && !mqReduced.matches;
      if (enabled) { layers.forEach(function (l) { io.observe(l.el); }); request(); } else { io.disconnect(); active.clear(); reset(); }
    }
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    mqMotionDesktop.addEventListener('change', update);
    update();
  }

  /* ---------- Szyny przewijane ---------- */
  function initRails() {
    $$('[data-rail]').forEach(function (rail) {
      var track = $('[data-rail-track]', rail);
      var prev = $('[data-rail-prev]', rail);
      var next = $('[data-rail-next]', rail);
      function state() {
        var max = track.scrollWidth - track.clientWidth;
        var atStart = track.scrollLeft <= 4, atEnd = track.scrollLeft >= max - 4;
        rail.classList.toggle('is-scrollable', max > 4);
        if (atEnd && doc.activeElement === next && !atStart) prev.focus();
        if (atStart && doc.activeElement === prev && !atEnd) next.focus();
        prev.disabled = atStart;
        next.disabled = atEnd;
      }
      function go(dir) { track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: reduced ? 'auto' : 'smooth' }); }
      prev.addEventListener('click', function () { go(-1); });
      next.addEventListener('click', function () { go(1); });
      track.addEventListener('scroll', function () { requestAnimationFrame(state); }, { passive: true });
      track.addEventListener('focusin', function (e) {
        try { if (!e.target.matches(':focus-visible')) return; } catch (err) { /* starsza przeglądarka */ }
        var li = e.target.closest('li'); if (li) li.scrollIntoView({ inline: 'nearest', block: 'nearest' });
      });
      window.addEventListener('resize', state);
      state();
    });
  }

  /* ---------- Rozwijane panele (FAQ, biografia) ---------- */
  var UNTIL_FOUND = 'onbeforematch' in doc.body;
  function hide(panel) { if (UNTIL_FOUND) panel.setAttribute('hidden', 'until-found'); else panel.hidden = true; }
  function setPanel(btn, panel, open) {
    btn.setAttribute('aria-expanded', String(open));
    clearTimeout(panel.__t);
    if (open) {
      panel.hidden = false;
      void panel.offsetHeight;
      panel.classList.add('is-open');
    } else {
      panel.classList.remove('is-open');
      panel.__t = setTimeout(function () { if (btn.getAttribute('aria-expanded') === 'false') hide(panel); }, reduced ? 0 : 420);
    }
  }
  function initCollapsibles() {
    $$('[data-acc-btn]').forEach(function (btn) {
      var panel = doc.getElementById(btn.getAttribute('aria-controls'));
      btn.setAttribute('aria-expanded', 'false');
      hide(panel);
      btn.addEventListener('click', function () { setPanel(btn, panel, btn.getAttribute('aria-expanded') !== 'true'); });
      panel.addEventListener('beforematch', function () { setPanel(btn, panel, true); });
    });
    var ex = $('[data-expander]');
    if (ex) {
      var btn = $('[data-expander-btn]', ex), panel = $('[data-expander-panel]', ex), label = $('[data-expander-label]', ex);
      btn.setAttribute('aria-expanded', 'false');
      hide(panel);
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') !== 'true';
        setPanel(btn, panel, open);
        label.textContent = open ? 'Zwiń historię' : 'Poznaj historię Padre';
      });
      panel.addEventListener('beforematch', function () { setPanel(btn, panel, true); label.textContent = 'Zwiń historię'; });
    }
  }

  /* ---------- Liczniki wyświetleń ---------- */
  function initCounters() {
    var els = $$('[data-count]');
    if (reduced || !('IntersectionObserver' in window)) return;
    var fmt = function (v) { return v.toFixed(1).replace('.', ','); };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, to = parseFloat(el.getAttribute('data-count')), from = to * 0.82, t0 = null;
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min(1, (ts - t0) / 1300), e = 1 - Math.pow(1 - p, 3);
          el.textContent = fmt(from + (to - from) * e);
          if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(to);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Lightbox ---------- */
  function initLightbox() {
    var lb = $('[data-lightbox]');
    if (!lb) return;
    var img = $('[data-lb-img]', lb), source = $('[data-lb-source]', lb), cap = $('[data-lb-caption]', lb), count = $('[data-lb-count]', lb);
    var btnClose = $('.lightbox__btn--close', lb);
    var items = [], index = 0, trigger = null, outside = $$('body > :not([data-lightbox])');
    // Szerokość, w jakiej zdjęcie wyświetli się w lightboxie (jak w CSS: margines boczny i miejsce na podpis).
    function slot(b) {
      var w = +b.getAttribute('data-lb-w'), h = +b.getAttribute('data-lb-h');
      var side = window.innerWidth >= 768 ? 192 : 32;
      return Math.ceil(Math.min(window.innerWidth - side, 1600, (window.innerHeight - 170) * w / h)) + 'px';
    }
    function show(i) {
      index = (i + items.length) % items.length;
      var b = items[index];
      img.classList.add('is-loading');
      var sz = slot(b);
      source.sizes = sz; img.sizes = sz;
      source.srcset = b.getAttribute('data-lb-avif');
      img.srcset = b.getAttribute('data-lb-jpg');
      img.src = b.getAttribute('data-lb-src');
      img.width = +b.getAttribute('data-lb-w'); img.height = +b.getAttribute('data-lb-h');
      img.alt = '';
      cap.textContent = b.getAttribute('data-lb-caption');
      count.textContent = (index + 1) + ' / ' + items.length;
      // Wstępnie pobierz sąsiednie zdjęcia w tym samym rozmiarze i formacie, który wybierze przeglądarka.
      var avif = /\.avif/.test((b.querySelector('img') || {}).currentSrc || '');
      [index + 1, index - 1].forEach(function (n) {
        var nb = items[(n + items.length) % items.length], p = new Image();
        p.sizes = slot(nb); p.srcset = nb.getAttribute(avif ? 'data-lb-avif' : 'data-lb-jpg');
      });
    }
    img.addEventListener('load', function () { img.classList.remove('is-loading'); });
    function open(btn) {
      var group = btn.closest('[data-gallery]');
      items = $$('[data-lb-index]', group);
      trigger = btn;
      show(items.indexOf(btn));
      lb.hidden = false;
      root.classList.add('lb-open');
      outside.forEach(function (el) { el.setAttribute('inert', ''); });
      requestAnimationFrame(function () { lb.classList.add('is-open'); });
      btnClose.focus();
      updateSticky();
      track('open_gallery', { gallery: group.getAttribute('data-gallery'), image_index: index + 1 });
    }
    function close() {
      lb.classList.remove('is-open');
      outside.forEach(function (el) { el.removeAttribute('inert'); });
      root.classList.remove('lb-open');
      setTimeout(function () { lb.hidden = true; }, reduced ? 0 : 280);
      if (trigger) trigger.focus();
      updateSticky();
    }
    $$('[data-lb-index]').forEach(function (b) { b.addEventListener('click', function () { open(b); }); });
    $$('[data-lb-close]', lb).forEach(function (b) { b.addEventListener('click', close); });
    $('[data-lb-prev]', lb).addEventListener('click', function () { show(index - 1); });
    $('[data-lb-next]', lb).addEventListener('click', function () { show(index + 1); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
      else if (e.key === 'Tab') {
        var f = $$('button', lb).filter(function (b) { return !b.hidden; });
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    // Przesuwanie palcem.
    var sx = null, sy = null;
    lb.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') { sx = e.clientX; sy = e.clientY; } });
    lb.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy; sx = sy = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) show(index + (dx < 0 ? 1 : -1));
    });
    lb.addEventListener('pointercancel', function () { sx = sy = null; });
  }

  /* ---------- Media, akredytacje, press pack ---------- */
  function initMedia() {
    $$('[data-media]').forEach(function (a) {
      a.addEventListener('click', function () { track('click_media', { media_id: a.getAttribute('data-media'), link_url: a.href }); });
    });
    var acc = $('[data-accreditation]'), pending = $('[data-accreditation-pending]');
    if (acc && cfg.accreditationReady && cfg.accreditationUrl) {
      acc.href = cfg.accreditationUrl; acc.target = '_blank'; acc.rel = 'noopener'; acc.hidden = false;
      var accName = /pressaccreditations/.test(cfg.accreditationUrl) ? 'formularz Press Accreditations' : 'formularz kontaktowy Live2Listen';
      if (!$('.visually-hidden', acc)) acc.insertAdjacentHTML('beforeend', '<span class="visually-hidden"> (' + accName + ', otwiera się w nowej karcie)</span>');
      if (pending) pending.hidden = true;
      acc.addEventListener('click', function () { track('submit_accreditation', { step: 'outbound_click', link_url: cfg.accreditationUrl }); });
    }
    var kit = $('[data-presskit]');
    if (kit && cfg.pressPackUrl) {
      kit.href = cfg.pressPackUrl; kit.hidden = false;
      kit.addEventListener('click', function () { track('click_media', { media_id: 'press-pack', link_url: cfg.pressPackUrl }); });
    }
  }

  /* ---------- Newsletter (tylko z działającym backendem) ---------- */
  function initNewsletter() {
    var form = $('[data-newsletter]');
    if (!form || !cfg.newsletterEndpoint) return;
    form.hidden = false;
    var privacy = $('[data-newsletter-privacy]', form);
    if (privacy) privacy.href = cfg.newsletterPrivacyUrl || cfg.privacyPolicyUrl || '#';
    var email = form.elements.email, consent = form.elements.consent, msg = $('#nl-msg'), btn = $('button[type="submit"]', form);
    function say(text, kind) { msg.textContent = text; msg.className = 'newsletter__msg' + (kind ? ' is-' + kind : ''); }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      email.removeAttribute('aria-invalid');
      if (form.elements.company.value) return; // honeypot
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { email.setAttribute('aria-invalid', 'true'); email.focus(); say('Wpisz poprawny adres e-mail.', 'error'); return; }
      if (!consent.checked) { consent.focus(); say('Zaznacz zgodę, aby się zapisać.', 'error'); return; }
      btn.disabled = true; say('Wysyłanie…');
      fetch(cfg.newsletterEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.value.trim(), consent: true, source: 'padre-atlas-arena-2027', campaign: campaign })
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        say('Dziękujemy. Zgłoszenie zostało przyjęte. Sprawdź skrzynkę e-mail.', 'ok');
        form.reset();
        track('newsletter_signup', { form: 'badz-na-biezaco' });
      }).catch(function () {
        say('Nie udało się zapisać. Spróbuj ponownie za chwilę.', 'error');
      }).then(function () { btn.disabled = false; });
    });
  }

  /* ---------- Kopiowanie adresów ---------- */
  function initCopy() {
    $$('[data-copy]').forEach(function (b) {
      var original = b.textContent;
      function done(t) { b.textContent = t; setTimeout(function () { b.textContent = original; }, 2200); }
      b.addEventListener('click', function () {
        var text = b.getAttribute('data-copy');
        var fallback = function () {
          var a = b.previousElementSibling;
          try { var r = doc.createRange(); r.selectNodeContents(a); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) { /* ignoruj */ }
          done('Zaznaczono');
        };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done('Skopiowano'); }, fallback);
        else fallback();
      });
    });
  }

  /* ---------- Przyklejony przycisk na telefonie ---------- */
  var sticky = $('[data-sticky-cta]');
  var stickyState = { heroVisible: true, stopVisible: false, typing: false };
  function updateSticky() {
    if (!sticky) return;
    var consentBox = $('[data-consent]');
    var show = mqMobile.matches && !stickyState.heroVisible && !stickyState.stopVisible && !stickyState.typing &&
      !root.classList.contains('nav-open') && !root.classList.contains('lb-open') && !(consentBox && !consentBox.hidden);
    sticky.classList.toggle('is-visible', show);
    root.classList.toggle('has-sticky', show);
    sticky.setAttribute('aria-hidden', String(!show));
    var a = $('a', sticky); if (a) a.tabIndex = show ? 0 : -1;
  }
  function initSticky() {
    if (!sticky || !('IntersectionObserver' in window)) return;
    var heroCta = $('.hero__cta');
    new IntersectionObserver(function (en) { stickyState.heroVisible = en[0].isIntersecting; updateSticky(); }).observe(heroCta);
    var stops = $$('[data-sticky-stop]'), vis = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) vis.add(e.target); else vis.delete(e.target); });
      stickyState.stopVisible = vis.size > 0; updateSticky();
    });
    stops.forEach(function (s) { io.observe(s); });
    doc.addEventListener('focusin', function (e) { stickyState.typing = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName); updateSticky(); });
    doc.addEventListener('focusout', function () { stickyState.typing = false; updateSticky(); });
    mqMobile.addEventListener('change', updateSticky);
  }

  /* ---------- Start ---------- */
  function safe(fn) { try { fn(); } catch (err) { if (window.console) console.error('[padre]', err); } }
  if (!root.classList.contains('js')) { root.classList.add('js'); $$('.reveal').forEach(function (el) { el.classList.add('is-in'); }); }
  safe(initTickets);
  safe(initHeader);
  safe(initCountdown);
  safe(initReveal);
  safe(initParallax);
  safe(initRails);
  safe(initCollapsibles);
  safe(initCounters);
  safe(initLightbox);
  safe(initMedia);
  safe(initNewsletter);
  safe(initCopy);
  safe(initSticky);
  safe(initConsent);
})();
