/* ==========================================================================
   BANGASH REAL ESTATE — Interactions & animations (tiny, no libraries)
   ========================================================================== */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));

/* ---------- Sticky header ---------- */
const header = $('[data-header]');
const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 12);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

/* ---------- Mobile drawer ---------- */
const drawer = $('[data-drawer]');
const openBtn = $('[data-menu-open]');
const setDrawer = (open: boolean) => {
  if (!drawer) return;
  drawer.classList.toggle('is-open', open);
  drawer.setAttribute('aria-hidden', String(!open));
  openBtn?.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
};
openBtn?.addEventListener('click', () => setDrawer(true));
$$('[data-menu-close]').forEach((el) => el.addEventListener('click', () => setDrawer(false)));
document.addEventListener('keydown', (e) => e.key === 'Escape' && setDrawer(false));

/* ---------- Reveal on scroll ---------- */
const revealEls = $$('[data-reveal]');
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealEls.forEach((el) => el.classList.add('is-visible'));
} else {
  const pending = new Set(revealEls);
  const show = (el: Element) => {
    el.classList.add('is-visible');
    pending.delete(el as HTMLElement);
    io.unobserve(el);
  };
  const io = new IntersectionObserver(
    (entries) => entries.forEach((entry) => entry.isIntersecting && show(entry.target)),
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
  );
  revealEls.forEach((el) => io.observe(el));

  // Fallback: on a fast fling or an anchor jump the observer can miss elements —
  // reveal anything that has already passed the bottom edge of the screen.
  let ticking = false;
  const sweep = () => {
    ticking = false;
    const limit = window.innerHeight;
    pending.forEach((el) => el.getBoundingClientRect().top < limit && show(el));
    if (!pending.size) window.removeEventListener('scroll', onRevealScroll);
  };
  const onRevealScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(sweep); }
  };
  window.addEventListener('scroll', onRevealScroll, { passive: true });
  window.addEventListener('load', sweep);
}

/* ---------- Animated counters ---------- */
const counters = $$('[data-count]');
const runCounter = (el: HTMLElement) => {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix ?? '';
  if (reduceMotion) {
    el.textContent = target.toLocaleString() + suffix;
    return;
  }
  const duration = 1800;
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 4);
    el.textContent = Math.round(target * eased).toLocaleString() + suffix;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
if (counters.length) {
  const cio = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runCounter(entry.target as HTMLElement);
          cio.unobserve(entry.target);
        }
      }),
    { threshold: 0.5 },
  );
  counters.forEach((el) => cio.observe(el));
}

/* ---------- 3D tilt (desktop only) ---------- */
if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  $$('[data-tilt]').forEach((el) => {
    const max = Number(el.dataset.tilt) || 6;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(1000px) rotateY(${x * max}deg) rotateX(${-y * max}deg)`;
    });
    el.addEventListener('pointerleave', () => (el.style.transform = ''));
  });

  /* Parallax on hero visual */
  const parallax = $$('[data-parallax]');
  if (parallax.length) {
    window.addEventListener(
      'pointermove',
      (e) => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        parallax.forEach((el) => {
          const depth = Number(el.dataset.parallax) || 10;
          el.style.translate = `${x * depth}px ${y * depth}px`;
        });
      },
      { passive: true },
    );
  }
}

/* ---------- Hero search tabs (Buy / Rent / Build) ---------- */
const searchForm = $<HTMLFormElement>('[data-search]');
if (searchForm) {
  const purposeInput = $<HTMLInputElement>('input[name="purpose"]', searchForm)!;
  const tabs = $$<HTMLButtonElement>('[data-tab]', searchForm);
  tabs.forEach((tab) =>
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
      purposeInput.value = tab.dataset.tab!;
    }),
  );
  searchForm.addEventListener('submit', (e) => {
    if (purposeInput.value === 'build') {
      e.preventDefault();
      window.location.href = '/services/construction/';
      return;
    }
    // Leave empty fields out of the URL
    $$<HTMLSelectElement | HTMLInputElement>('select, input', searchForm).forEach((f) => {
      if (!f.value) f.disabled = true;
    });
  });
}

/* ---------- Properties page filters ---------- */
const filters = $<HTMLFormElement>('[data-filters]');
if (filters) {
  const cards = $$('[data-property-list] .property-card');
  const countEl = $('[data-count-results]');
  const empty = $('[data-empty]');
  const params = new URLSearchParams(window.location.search);
  const fields = $$<HTMLSelectElement>('select', filters);

  fields.forEach((f) => {
    const v = params.get(f.name);
    if (v && Array.from(f.options).some((o) => o.value === v)) f.value = v;
  });

  const grid = $('[data-property-list]');
  const sortCards = (mode: string) => {
    if (!grid) return;
    const price = (c: HTMLElement) => (c.dataset.price ? Number(c.dataset.price) : NaN);
    const sorted = [...cards].sort((a, b) => {
      if (!mode) return cards.indexOf(a) - cards.indexOf(b);
      const pa = price(a), pb = price(b);
      if (Number.isNaN(pa) !== Number.isNaN(pb)) return Number.isNaN(pa) ? 1 : -1; // "Price on request" last
      return mode === 'price-asc' ? pa - pb : pb - pa;
    });
    sorted.forEach((c) => grid.appendChild(c));
  };

  const apply = (animate = true) => {
    const active = Object.fromEntries(fields.map((f) => [f.name, f.value]));
    sortCards(active.sort ?? '');
    let shown = 0;
    cards.forEach((card) => {
      const match =
        (!active.purpose || card.dataset.purpose === active.purpose) &&
        (!active.type || card.dataset.type === active.type) &&
        (!active.area || card.dataset.area === active.area) &&
        (!active.beds || Number(card.dataset.beds || 0) >= Number(active.beds));
      card.classList.toggle('is-hidden', !match);
      if (match) {
        card.classList.add('is-visible');
        if (animate) {
          card.classList.remove('is-entering');
          void card.offsetWidth;
          card.style.animationDelay = `${shown * 0.05}s`;
          card.classList.add('is-entering');
        }
        shown++;
      }
    });
    if (countEl) countEl.textContent = String(shown);
    empty?.classList.toggle('is-visible', shown === 0);

    const url = new URL(window.location.href);
    fields.forEach((f) => (f.value ? url.searchParams.set(f.name, f.value) : url.searchParams.delete(f.name)));
    history.replaceState(null, '', url);
  };

  fields.forEach((f) => f.addEventListener('change', () => apply()));
  filters.addEventListener('submit', (e) => e.preventDefault());
  filters.addEventListener('reset', () => setTimeout(() => apply(), 0));
  apply(false);
}

/* ---------- Contact form → email (with auto-reply) / WhatsApp + leads inbox ---------- */
const contactForm = $<HTMLFormElement>('[data-contact-form]');
if (contactForm) {
  const build = () => {
    const d = new FormData(contactForm);
    return [
      'Hello Bangash Real Estate & Builders! 🏡',
      'I am contacting you from your website.',
      '',
      `👤 Name: ${d.get('name') || '-'}`,
      `📞 Phone: ${d.get('phone') || '-'}`,
      `🏠 Interested in: ${d.get('interest') || '-'}`,
      `📍 Area: ${d.get('area') || 'Any'}`,
      `💰 Budget: ${d.get('budget') || '-'}`,
      '',
      `${d.get('message') || ''}`,
    ].join('\n');
  };
  // Save the lead to the admin "Leads" inbox (Supabase). The form keeps working even if this fails.
  const saveLead = (source: 'website' | 'whatsapp') => {
    const { sbUrl, sbKey } = contactForm.dataset;
    const d = new FormData(contactForm);
    if (!sbUrl || !sbKey || d.get('_honey')) return Promise.resolve();
    const val = (k: string) => String(d.get(k) ?? '').trim().slice(0, 3000) || null;
    return fetch(`${sbUrl}/rest/v1/leads`, {
      method: 'POST',
      keepalive: true,
      headers: { apikey: sbKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        name: val('name'), phone: val('phone'), email: val('email'), interest: val('interest'),
        area: val('area'), budget: val('budget'), message: val('message'), source,
      }),
      signal: AbortSignal.timeout(5000),
    }).then(() => undefined, () => undefined);
  };

  // "Send Enquiry" — save the lead first, then submit the form for the email + auto-reply
  let sending = false;
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;
    sending = true;
    const btn = $<HTMLButtonElement>('[data-submit]', contactForm);
    if (btn) {
      btn.disabled = true;
      const label = btn.querySelector('span');
      if (label) label.textContent = 'Sending…';
    }
    await saveLead('website');
    track('generate_lead', { method: 'contact_form', interest: String(new FormData(contactForm).get('interest') ?? '') });
    HTMLFormElement.prototype.submit.call(contactForm);
  });
  // "Send via WhatsApp" — no email needed, only name + phone
  $('[data-send-whatsapp]', contactForm)?.addEventListener('click', () => {
    const required = ['#c-name', '#c-phone'].map((sel) => $<HTMLInputElement>(sel, contactForm)!);
    if (!required.every((f) => f.reportValidity())) return;
    const wa = contactForm.dataset.whatsapp!;
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(build())}`, '_blank', 'noopener');
    showToast(WA_TOAST);
    track('generate_lead', { method: 'contact_form_whatsapp', interest: String(new FormData(contactForm).get('interest') ?? '') });
    void saveLead('whatsapp');
  });
}

/* ---------- Toast: WhatsApp click ke baad confirmation ---------- */
const WA_TOAST = 'WhatsApp opened — please press Send. Our agent will contact you shortly.';
function showToast(text: string) {
  let toast = document.querySelector<HTMLElement>('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.classList.remove('is-visible');
  void toast.offsetWidth;
  toast.classList.add('is-visible');
  window.clearTimeout(Number(toast.dataset.timer));
  toast.dataset.timer = String(window.setTimeout(() => toast!.classList.remove('is-visible'), 6000));
}
document.addEventListener('click', (e) => {
  const link = (e.target as Element).closest?.('a[href^="https://wa.me/"]');
  if (link) showToast(WA_TOAST);
});

/* ---------- Conversion tracking (Google Analytics 4 — only when a GA4 ID is set in site.ts) ---------- */
type Gtag = (cmd: 'event', name: string, params?: Record<string, unknown>) => void;
function track(name: string, params: Record<string, unknown> = {}) {
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  gtag?.('event', name, { page_path: location.pathname, ...params });
}
document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[href]');
  if (!a) return;
  const href = a.getAttribute('href') ?? '';
  if (href.startsWith('https://wa.me/')) track('whatsapp_click', { link_text: a.textContent?.trim().slice(0, 60) });
  else if (href.startsWith('tel:')) track('phone_click', { link_text: a.textContent?.trim().slice(0, 60) });
  else if (href.startsWith('mailto:')) track('email_click');
  else if (a.hostname && a.hostname !== location.hostname && /google\.|goo\.gl/.test(a.hostname)) track('google_maps_click');
});

/* ---------- Property photo viewer (tap a photo → full screen, swipe / arrow keys) ---------- */
const viewer = $<HTMLDialogElement>('[data-lightbox-dialog]');
if (viewer && typeof viewer.showModal === 'function') {
  const photos: string[] = JSON.parse(viewer.dataset.photos ?? '[]');
  // The <img> is added on first open, so the page never contains an image without a source
  const img = document.createElement('img');
  img.dataset.lightboxImg = '';
  img.decoding = 'async';
  const count = $('[data-lightbox-count]', viewer)!;
  const title = document.querySelector('h1')?.textContent?.trim() ?? 'Property';
  let index = 0;
  const show = (i: number) => {
    index = (i + photos.length) % photos.length;
    img.src = photos[index];
    img.alt = `${title} — photo ${index + 1} of ${photos.length}`;
    if (!img.isConnected) $('[data-lightbox-stage]', viewer)!.append(img);
    count.textContent = `${index + 1} / ${photos.length}`;
    // Warm up the next photo so swiping feels instant
    const next = new Image();
    next.src = photos[(index + 1) % photos.length];
  };
  document.querySelectorAll<HTMLAnchorElement>('[data-lightbox] a[data-lightbox-index]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      show(Number(a.dataset.lightboxIndex));
      viewer.showModal();
      track('view_photos', { photo: index + 1 });
    }),
  );
  $('[data-lightbox-close]', viewer)?.addEventListener('click', () => viewer.close());
  $('[data-lightbox-prev]', viewer)?.addEventListener('click', () => show(index - 1));
  $('[data-lightbox-next]', viewer)?.addEventListener('click', () => show(index + 1));
  viewer.addEventListener('click', (e) => { if (e.target === viewer) viewer.close(); });
  viewer.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
  let startX = 0;
  viewer.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  viewer.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 45) show(index + (dx < 0 ? 1 : -1));
  }, { passive: true });
}
