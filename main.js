/* ============================================================
   Arab Club APU — main.js
   All interactivity: cursor, scroll effects, animations, forms
   ============================================================ */

/* ─── CUSTOM CURSOR ─── */
(function initCursor() {
  /*
     Pointless without a mouse: on a phone the gold dot has nothing to follow,
     so it parks in a corner and reads as a rendering fault. CSS hides it too;
     bailing out here also stops a requestAnimationFrame loop running forever
     on a device that gains nothing from it.
  */
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

  const cursor    = document.getElementById('cursor');
  const cursorRing = document.getElementById('cursor-ring');
  if (!cursor || !cursorRing) return;
  let mx = 0, my = 0, rx = 0, ry = 0;

  /* Snap dot to mouse instantly */
  document.addEventListener('mousemove', function (e) {
    mx = e.clientX;
    my = e.clientY;
    cursor.style.transform = `translate(${mx - 5}px, ${my - 5}px)`;
  });

  /* Animate the lagging ring with requestAnimationFrame */
  function animateRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    cursorRing.style.transform = `translate(${rx - 18}px, ${ry - 18}px)`;
    requestAnimationFrame(animateRing);
  }
  animateRing();
})();


/* ─── SCROLL PROGRESS BAR & NAV STYLE ON SCROLL ─── */
(function initScrollEffects() {
  const progressBar = document.getElementById('progress-bar');
  const nav         = document.getElementById('main-nav');

  window.addEventListener('scroll', function () {
    /* Progress bar width as percentage of page scrolled */
    const scrolled = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const pct = (scrolled / maxScroll) * 100;
    progressBar.style.width = pct + '%';

    /* Darken nav once user scrolls past 60px */
    nav.classList.toggle('scrolled', scrolled > 60);
  });
})();


/* ─── SCROLL REVEAL ANIMATION ─── */
(function initReveal() {
  const revealEls = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        /* Small delay so multiple elements stagger slightly */
        setTimeout(function () {
          entry.target.classList.add('visible');
        }, 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealEls.forEach(function (el) {
    observer.observe(el);
  });
})();


/* ─── ANIMATED STAT COUNTERS ─── */
(function initCounters() {
  const statEls = document.querySelectorAll('.stat-num[data-target]');

  const counterObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;

      const el     = entry.target;
      const target = Number(el.dataset.target);
      let current  = 0;
      const step   = target / 40;   /* reach target in ~40 ticks at 30ms each */

      const timer = setInterval(function () {
        current = Math.min(current + step, target);

        /* Special display rules */
        if (target === 1) {
          el.textContent = '1';
        } else if (target === 100) {
          el.textContent = Math.round(current) + '+';
        } else {
          el.textContent = Math.round(current);
        }

        if (current >= target) clearInterval(timer);
      }, 30);

      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });

  statEls.forEach(function (el) {
    counterObserver.observe(el);
  });
})();


/* ─── MOBILE NAV DRAWER ─── */
/*
   Called by the hamburger and the drawer's close button. Alongside sliding
   the panel it dims the page behind, locks the background from scrolling,
   and collapses the Resources submenu so the menu always reopens tidy.
*/
function toggleNav(force) {
  const drawer = document.getElementById('nav-links');
  if (!drawer) return;

  const open = typeof force === 'boolean' ? force : !drawer.classList.contains('open');
  drawer.classList.toggle('open', open);
  document.body.classList.toggle('nav-open', open);

  const backdrop = document.getElementById('nav-backdrop');
  if (backdrop) backdrop.classList.toggle('open', open);

  if (!open) {
    document.querySelectorAll('.nav-dropdown.is-open')
      .forEach(function (d) { d.classList.remove('is-open'); });
  }
}

(function initMobileNav() {
  /* Tapping the dimmed area closes the drawer — the first thing most
     people try, and it costs one element. */
  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  backdrop.id = 'nav-backdrop';
  backdrop.addEventListener('click', function () { toggleNav(false); });
  document.body.appendChild(backdrop);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') toggleNav(false);
  });

  const onPhone = function () { return window.matchMedia('(max-width: 900px)').matches; };

  /*
     Resources behaves differently on a phone: it is an expander, not a link.
     Tapping it opens or closes the three sub-items and never navigates, so
     the drawer stays put while you look at them. On desktop it keeps working
     as a normal link with the hover menu.
  */
  const resources = document.querySelector('.nav-dropdown');
  const toggleLink = resources && resources.querySelector('.nav-dropdown-toggle');
  if (toggleLink) {
    toggleLink.addEventListener('click', function (e) {
      if (!onPhone()) return;                       /* desktop keeps hover */
      e.preventDefault();
      resources.classList.toggle('is-open');
    });
  }

  /*
     Every OTHER link actually goes somewhere, so close the drawer behind it.
     The Resources toggle is excluded deliberately — it is handled above, and
     leaving it in this loop made the drawer slam shut the instant the
     submenu expanded.
  */
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    if (link === toggleLink) return;
    link.addEventListener('click', function () { toggleNav(false); });
  });

  /*
     Highlight whichever section the visitor is currently looking at, so the
     menu answers "where am I?" rather than just "where can I go?".
  */
  const links = Array.prototype.slice.call(
    document.querySelectorAll('.nav-links > li > a[href^="#"]')
  ).filter(function (a) { return a.getAttribute('href').length > 1; });

  const bySection = {};
  links.forEach(function (a) { bySection[a.getAttribute('href').slice(1)] = a; });

  const targets = Object.keys(bySection)
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  if (targets.length) {
    let current = null;
    const spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const link = bySection[entry.target.id];
        if (!link || link === current) return;
        if (current) current.classList.remove('is-active');
        link.classList.add('is-active');
        current = link;
      });
    }, { rootMargin: '-45% 0px -50% 0px' });   /* fires around mid-screen */
    targets.forEach(function (t) { spy.observe(t); });
  }
})();


/* ─── SUPABASE BACKEND CONFIG ─── */
/*
   Both forms below submit to Supabase Edge Functions, which validate the
   input, save it to the "arabclub website" Supabase project's database
   (join_submissions / contact_messages tables), and — if the club has set
   the RESEND_API_KEY + NOTIFY_EMAIL secrets on those functions — also send
   a notification email. The tables have no public read/write policy, so
   this anon key can only reach them through these two functions, never
   directly.
*/
const SUPABASE_URL = "https://bfyvhsmzouvjwmrrgeke.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ppPqxt4QazCnIryxxpUigg_5VTrPyRM";

/* Public base URL for photos in the 'event-photos' storage bucket. */
const PHOTO_BASE_URL = `${SUPABASE_URL}/storage/v1/object/public/event-photos/`;

/* How many cards each section shows at most. */
const MAX_EVENTS = 2;
const MAX_ACTIVITIES = 4;

/* Used by the "no events yet" panel. Change here if the account moves. */
const INSTAGRAM_URL = "https://www.instagram.com/apu_arabic_club";

/*
   What each section shows when it has nothing to display. This only appears
   when Supabase answered successfully and genuinely had no rows — if the
   request FAILS we keep the placeholder cards instead, so a dropped
   connection never makes the page look abandoned.
*/
const EMPTY_STATES = {
  'events-carousel': {
    icon: '\u{1F4C5}',
    title: 'No events scheduled right now',
    text: "We're planning the next one — follow us on Instagram and you'll hear about it first.",
    cta: 'Follow on Instagram',
    href: INSTAGRAM_URL
  },
  'activities-carousel': {
    icon: '\u{1F4F8}',
    title: 'More photos coming soon',
    text: 'Photos and highlights from our events will appear here as we run them.',
    cta: 'Join the Club',
    href: '#join'
  }
};


/* ════════════════════════════════════════════════════════════
   ARROW-NAVIGATED CAROUSELS
   ════════════════════════════════════════════════════════════
   Applies to any .carousel-manual — currently the Events and Activities
   sections. (The Departments carousel is NOT one of these; it keeps its
   original auto-scrolling loop.)

   The row of cards is a normal horizontally-scrolling strip, so swiping on
   a phone and two-finger scrolling on a trackpad both work for free. The
   ‹ › buttons scroll it one card at a time.

   The arrows manage themselves:
     - both hidden entirely when every card already fits on screen
     - greyed out at the far left / far right of the row
   They are also re-checked whenever main.js swaps the placeholder cards for
   real Supabase rows, via a MutationObserver on the track.
*/
(function initManualCarousels() {

  document.querySelectorAll('.carousel-manual').forEach(function (carousel) {
    const track = carousel.querySelector('.carousel-track');
    const prev  = carousel.querySelector('.carousel-prev');
    const next  = carousel.querySelector('.carousel-next');
    if (!track || !prev || !next) return;

    /* Distance of one card, including the gap between cards */
    function cardStep() {
      const card = track.querySelector('.carousel-card');
      if (!card) return track.clientWidth;
      const styles = getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap) || 0;
      return card.getBoundingClientRect().width + gap;
    }

    function update() {
      const maxScroll = track.scrollWidth - track.clientWidth;
      /* A couple of pixels of slack — browsers round sub-pixel widths */
      const scrollable = maxScroll > 4;

      carousel.classList.toggle('has-arrows', scrollable);
      prev.disabled = !scrollable || track.scrollLeft <= 2;
      next.disabled = !scrollable || track.scrollLeft >= maxScroll - 2;
    }

    prev.addEventListener('click', function () {
      track.scrollBy({ left: -cardStep(), behavior: 'smooth' });
    });
    next.addEventListener('click', function () {
      track.scrollBy({ left: cardStep(), behavior: 'smooth' });
    });

    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    /* Re-check once the real cards replace the placeholders */
    new MutationObserver(update).observe(track, { childList: true });

    update();
  });
})();


/* ════════════════════════════════════════════════════════════
   ACTIVITY DETAIL POPUP (MODAL)
   ════════════════════════════════════════════════════════════
   Clicking a card in "Upcoming Events" or "Past Highlights" opens this popup,
   showing the full write-up, the date/time/location/speaker, every photo, and
   the registration or social-post link where one exists.

   Photos come from two columns on the gallery_items row:
     image_path  -> the cover photo (also the one shown on the card)
     photo_paths -> optional EXTRA photos, e.g. {"night-1.jpg","night-2.jpg"}
   With only a cover photo, the popup simply shows that one image and hides
   the next/previous controls.

   The markup is built here in JavaScript rather than sitting in index.html,
   so there is exactly one popup on the page and index.html stays untouched.
*/
const ActivityModal = (function buildActivityModal() {

  let overlay, dialog, closeBtn, imgEl, imgWrap, counterEl, prevBtn, nextBtn,
      thumbStrip, titleEl, dateEl, descEl, emptyEl, linksEl;
  let photos = [];
  let index = 0;
  let lastFocused = null;   /* the card that opened it, so focus can return */
  let built = false;

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function build() {
    overlay = make('div', 'amodal-overlay');
    overlay.id = 'activity-modal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'amodal-title');
    overlay.hidden = true;

    dialog = make('div', 'amodal');

    closeBtn = make('button', 'amodal-close', '✕');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    dialog.appendChild(closeBtn);

    /* ── Photo area ── */
    imgWrap = make('div', 'amodal-figure');
    imgEl = document.createElement('img');
    imgEl.className = 'amodal-img';
    imgEl.alt = '';
    imgWrap.appendChild(imgEl);

    emptyEl = make('div', 'amodal-empty', '📷');   /* shown when there are no photos */
    imgWrap.appendChild(emptyEl);

    prevBtn = make('button', 'amodal-nav amodal-prev', '‹');
    prevBtn.type = 'button';
    prevBtn.setAttribute('aria-label', 'Previous photo');
    nextBtn = make('button', 'amodal-nav amodal-next', '›');
    nextBtn.type = 'button';
    nextBtn.setAttribute('aria-label', 'Next photo');
    counterEl = make('div', 'amodal-counter');
    imgWrap.append(prevBtn, nextBtn, counterEl);
    dialog.appendChild(imgWrap);

    thumbStrip = make('div', 'amodal-thumbs');
    dialog.appendChild(thumbStrip);

    /* ── Text area ── */
    const body = make('div', 'amodal-body');
    titleEl = make('h3', 'amodal-title');
    titleEl.id = 'amodal-title';
    dateEl  = make('div', 'amodal-meta-block');   /* date/time, location, speaker */
    descEl  = make('p', 'amodal-desc');
    linksEl = make('div', 'amodal-links');        /* Register / View post */
    body.append(titleEl, dateEl, descEl, linksEl);
    dialog.appendChild(body);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    /* ── Wiring ── */
    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function () { step(-1); });
    nextBtn.addEventListener('click', function () { step(1); });

    /* Backdrop click closes; clicks inside the dialog must not bubble out */
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    document.addEventListener('keydown', function (e) {
      if (overlay.hidden) return;
      if (e.key === 'Escape')     { close(); }
      else if (e.key === 'ArrowLeft')  { step(-1); }
      else if (e.key === 'ArrowRight') { step(1); }
      else if (e.key === 'Tab')        { trapFocus(e); }
    });

    built = true;
  }

  /* Keeps keyboard focus inside the popup while it is open */
  function trapFocus(e) {
    const focusables = dialog.querySelectorAll(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function showPhoto(i) {
    if (!photos.length) return;
    index = (i + photos.length) % photos.length;   /* wrap around both ways */
    imgEl.src = photos[index].url;
    imgEl.alt = photos[index].alt;
    counterEl.textContent = `${index + 1} / ${photos.length}`;

    Array.prototype.forEach.call(thumbStrip.children, function (thumb, n) {
      thumb.classList.toggle('is-active', n === index);
      thumb.setAttribute('aria-current', n === index ? 'true' : 'false');
    });
  }

  function step(delta) {
    if (photos.length > 1) showPhoto(index + delta);
  }

  function open(item, opener) {
    if (!built) build();
    lastFocused = opener || document.activeElement;

    /* Cover photo first, then any extras, skipping blanks */
    const paths = [item.image_path]
      .concat(Array.isArray(item.photo_paths) ? item.photo_paths : [])
      .filter(function (p) { return typeof p === 'string' && p.trim(); });

    photos = paths.map(function (p) {
      return { url: PHOTO_BASE_URL + encodeURIComponent(p.trim()), alt: item.title || 'Arab Club APU photo' };
    });

    /* Text */
    titleEl.textContent = item.title || 'Activity';

    const metaRows = buildMetaRows(item, 'amodal-meta-row');
    dateEl.replaceChildren();
    metaRows.forEach(function (row) { dateEl.appendChild(row); });
    dateEl.hidden = metaRows.length === 0;

    descEl.textContent = item.description || '';
    descEl.hidden = !item.description;

    /* Register for an upcoming event, or read the post about a past one */
    linksEl.replaceChildren();
    [externalLink(item.register_url, 'Register for this event →', 'amodal-link'),
     externalLink(item.post_url, 'View the post →', 'amodal-link amodal-link-ghost')
    ].filter(Boolean).forEach(function (a) { linksEl.appendChild(a); });
    linksEl.hidden = linksEl.children.length === 0;

    /* Photos */
    const hasPhotos = photos.length > 0;
    imgEl.hidden    = !hasPhotos;
    emptyEl.hidden  = hasPhotos;

    const multi = photos.length > 1;
    prevBtn.hidden = nextBtn.hidden = counterEl.hidden = !multi;

    thumbStrip.replaceChildren();
    thumbStrip.hidden = !multi;
    if (multi) {
      photos.forEach(function (photo, n) {
        const thumb = make('button', 'amodal-thumb');
        thumb.type = 'button';
        thumb.setAttribute('aria-label', `Show photo ${n + 1}`);
        const t = document.createElement('img');
        t.src = photo.url;
        t.alt = '';
        t.loading = 'lazy';
        thumb.appendChild(t);
        thumb.addEventListener('click', function () { showPhoto(n); });
        thumbStrip.appendChild(thumb);
      });
    }

    if (hasPhotos) showPhoto(0);

    /* Stop the page behind from scrolling while the popup is open */
    document.body.classList.add('amodal-open');

    overlay.hidden = false;
    /* Next frame, so the CSS transition has a starting state to animate from */
    requestAnimationFrame(function () { overlay.classList.add('is-open'); });
    closeBtn.focus();
  }

  function close() {
    if (!built || overlay.hidden) return;
    overlay.classList.remove('is-open');
    document.body.classList.remove('amodal-open');

    /* Wait for the fade-out before hiding, so it doesn't snap away */
    setTimeout(function () {
      overlay.hidden = true;
      imgEl.removeAttribute('src');   /* let the browser release the image */
    }, 200);

    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  return { open: open, close: close };
})();


/*
   Only http(s) links are ever turned into a clickable link. Anything else
   typed into register_url / post_url (a bare word, or a "javascript:" URL)
   is ignored rather than rendered — the dashboard is trusted, but a public
   page should never hand a visitor a link it hasn't checked.
*/
function safeUrl(value) {
  if (typeof value !== 'string') return null;
  const url = value.trim();
  return /^https?:\/\//i.test(url) ? url : null;
}

/* Builds an external link button, or nothing if the URL isn't usable */
function externalLink(url, label, className) {
  const safe = safeUrl(url);
  if (!safe) return null;
  const a = document.createElement('a');
  a.className = className;
  a.href = safe;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';   /* don't hand the new tab control of ours */
  a.textContent = label;
  return a;
}

/* Turns "2026-03-14" into "14 March 2026". Shared by the cards and the popup.
   Parsed as plain year/month/day so a timezone offset can't shift the day. */
function formatDate(value) {
  if (!value) return '';
  const parts = String(value).split('-');
  if (parts.length !== 3) return String(value);
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}


/* ════════════════════════════════════════════════════════════
   EVENT & ACTIVITY CARDS — LOADED FROM SUPABASE
   ════════════════════════════════════════════════════════════
   HOW TO ADD A CARD (no code editing needed):
     1. Supabase dashboard → Storage → 'event-photos' bucket → Upload,
        e.g. "cultural-night-2026.jpg"
     2. Supabase dashboard → Table Editor → 'gallery_items' → Insert row:
          section     = 'event'  (upcoming)  or  'activity'  (past)
          title       = "Arab Cultural Night"
          description = the write-up (events show it on the card;
                        activities show it inside the detail popup)
          event_date  = 2026-03-14
          image_path  = "cultural-night-2026.jpg"  (the cover photo)
          photo_paths = extra photos for the popup, e.g.
                        {"night-1.jpg","night-2.jpg"}   (optional)
          sort_order  = lower numbers appear first
          published   = untick to hide it without deleting it
     3. Refresh the site — the card appears automatically.

   Only the first 2 events and first 4 activities are shown.

   An ACTIVITY card becomes clickable (opening the detail popup) only when it
   has a description or extra photo_paths. With neither, it stays a plain tile.

   SAFETY: if Supabase is unreachable, or no rows exist yet, this does
   nothing at all and the placeholder cards already in index.html stay
   exactly as they are. The site never ends up blank.
*/
/*
   The date / time / location / speaker lines. Each is skipped entirely when
   its column is blank, so a half-filled row never shows an empty label.
   Date and time share one line because they read as a single fact.
*/
function buildMetaRows(item, rowClass) {
  const rows = [];
  const when = [formatDate(item.event_date), (item.event_time || '').trim()]
    .filter(Boolean).join(' · ');

  [['\u{1F4C5}', when],
   ['\u{1F4CD}', (item.location || '').trim()],
   ['\u{1F464}', (item.speaker  || '').trim()]
  ].forEach(function (pair) {
    if (!pair[1]) return;
    const row = document.createElement('div');
    row.className = rowClass;
    const icon = document.createElement('span');
    icon.className = 'meta-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = pair[0];
    const text = document.createElement('span');
    text.textContent = pair[1];
    row.append(icon, text);
    rows.push(row);
  });
  return rows;
}


(function initGalleryFromSupabase() {

  /* Reuse the existing gradient classes so photo-less cards still look right */
  const EVENT_THUMB_CLASSES    = ['event-thumb-1', 'event-thumb-2', 'event-thumb-3'];
  const ACTIVITY_THUMB_CLASSES = ['gallery-thumb-1', 'gallery-thumb-2', 'gallery-thumb-3',
                                  'gallery-thumb-4', 'gallery-thumb-5'];

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    /* textContent (never innerHTML) so database text can't inject markup */
    if (text != null) node.textContent = text;
    return node;
  }

  /* Builds the image/placeholder tile at the top of a card */
  function buildThumb(item, index, baseClass, gradientClasses, fallbackEmoji) {
    const thumb = el('div', baseClass);

    function useGradient() {
      thumb.classList.add(gradientClasses[index % gradientClasses.length]);
      thumb.textContent = fallbackEmoji;
    }

    if (item.image_path) {
      const img = document.createElement('img');
      img.src = PHOTO_BASE_URL + encodeURIComponent(item.image_path);
      img.alt = item.title || 'Arab Club APU photo';
      img.loading = 'lazy';
      /* If the file is missing/renamed, fall back to a gradient tile
         rather than showing a broken-image icon. */
      img.addEventListener('error', function () {
        img.remove();
        useGradient();
      });
      thumb.appendChild(img);
    } else {
      useGradient();
    }
    return thumb;
  }

  /*
     Is there anything worth opening the popup for? A write-up counts (the
     card only shows the first couple of lines of it), and so do extra
     photos. With neither, the card shows everything it has, so it stays a
     plain non-clickable tile rather than opening a box with nothing new.
  */
  function hasMoreToShow(item) {
    const extraPhotos = Array.isArray(item.photo_paths)
      ? item.photo_paths.filter(function (p) { return typeof p === 'string' && p.trim(); })
      : [];
    return Boolean(item.description)
        || extraPhotos.length > 0
        || Boolean(safeUrl(item.post_url))
        || Boolean(safeUrl(item.register_url));
  }

  /*
     Makes a card open the detail popup.

     The real accessible control is the "View details" BUTTON, not the card
     itself — a card carrying its own <a href="#join"> link can't also be a
     button without nesting one interactive element inside another, which
     confuses screen readers and the tab order. So: the button is what
     keyboard and screen-reader users get (and it handles Enter/Space for
     free), while the click on the card is just a convenience for mouse users.
  */
  function wireDetailPopup(card, item, container) {
    card.classList.add('is-clickable');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card-more';
    btn.textContent = 'View details →';
    btn.setAttribute('aria-label', `View details for ${item.title}`);
    btn.addEventListener('click', function (e) {
      e.stopPropagation();               /* don't also fire the card handler */
      ActivityModal.open(item, btn);
    });
    container.appendChild(btn);

    card.addEventListener('click', function () { ActivityModal.open(item, btn); });
  }

  function buildEventCard(item, index) {
    const card = el('div', 'event-card carousel-card');
    card.appendChild(buildThumb(item, index, 'event-thumb', EVENT_THUMB_CLASSES, '🗓️'));

    const body = el('div', 'event-body');
    body.appendChild(el('div', 'event-name', item.title));
    /* CSS clamps this to 2 lines; the popup carries the full text */
    if (item.description) body.appendChild(el('div', 'event-desc', item.description));
    buildMetaRows(item, 'card-meta').forEach(function (row) { body.appendChild(row); });
    card.appendChild(body);

    if (hasMoreToShow(item)) wireDetailPopup(card, item, body);

    /*
       The old footer link said "Join ›" and went to the club sign-up form,
       which was confusing on a card about one specific workshop. It now
       carries that event's own registration link instead, and the footer
       disappears entirely when there isn't one.
    */
    const register = externalLink(item.register_url, 'Register →', 'event-link');
    if (register) {
      register.addEventListener('click', function (e) { e.stopPropagation(); });
      const footer = el('div', 'event-footer');
      footer.appendChild(register);
      card.appendChild(footer);
    }

    return card;
  }

  function buildActivityCard(item, index) {
    const card = el('div', 'gallery-card carousel-card');
    card.appendChild(buildThumb(item, index, 'gallery-thumb', ACTIVITY_THUMB_CLASSES, '📸'));

    const caption = el('div', 'gallery-caption');
    caption.appendChild(el('div', 'gallery-title', item.title));

    buildMetaRows(item, 'gallery-date').forEach(function (row) { caption.appendChild(row); });

    if (hasMoreToShow(item)) wireDetailPopup(card, item, caption);

    card.appendChild(caption);
    return card;
  }

  /* The "nothing here yet" panel, built once per section and reused */
  function buildEmptyState(config) {
    const box = el('div', 'section-empty');

    const icon = el('span', 'section-empty-icon', config.icon);
    icon.setAttribute('aria-hidden', 'true');
    box.appendChild(icon);

    box.appendChild(el('div', 'section-empty-title', config.title));
    box.appendChild(el('p', 'section-empty-text', config.text));

    const link = el('a', 'btn-primary', config.cta);
    link.href = config.href;
    if (/^https?:/i.test(config.href)) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    box.appendChild(link);

    return box;
  }

  /*
     Fills a section with real cards, or with the empty-state panel when there
     are none. The placeholder cards baked into index.html are only left alone
     when the Supabase request fails outright — see the .catch below.
  */
  function renderSection(carouselId, items, buildCard) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;
    const track = carousel.querySelector('.carousel-track');
    if (!track) return;

    const section  = carousel.closest('section');
    const intro    = section && section.querySelector('.section-desc');
    let   emptyBox = section && section.querySelector('.section-empty');

    if (items.length) {
      carousel.hidden = false;
      if (emptyBox) emptyBox.hidden = true;
      if (intro) intro.hidden = false;

      const fragment = document.createDocumentFragment();
      items.forEach(function (item, index) {
        fragment.appendChild(buildCard(item, index));
      });
      /* Replacing the children fires the MutationObserver in
         initManualCarousels(), which re-checks whether arrows are needed. */
      track.replaceChildren(fragment);
      track.scrollLeft = 0;
      return;
    }

    /* Nothing to show. Hide the carousel (and its arrows) entirely, and hide
       the intro line too — "workshops, cultural nights and everything in
       between" reads badly directly above "no events scheduled". */
    carousel.hidden = true;
    if (intro) intro.hidden = true;

    if (!emptyBox) {
      emptyBox = buildEmptyState(EMPTY_STATES[carouselId]);
      carousel.parentNode.insertBefore(emptyBox, carousel.nextSibling);
    }
    emptyBox.hidden = false;
  }

  /* Today as YYYY-MM-DD in the visitor's own timezone, so an event doesn't
     disappear a few hours early for people east of the server. */
  function todayISO() {
    const d = new Date();
    return [d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, '0'),
            String(d.getDate()).padStart(2, '0')].join('-');
  }

  const query = 'gallery_items?select=*&published=eq.true' +
                '&order=sort_order.asc,event_date.desc,created_at.desc';

  fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  })
    .then(function (res) {
      if (!res.ok) throw new Error(`Gallery request failed (${res.status})`);
      return res.json();
    })
    .then(function (items) {
      if (!Array.isArray(items)) return;   /* unexpected shape — keep placeholders */

      const today = todayISO();
      const events = items
        .filter(function (i) { return i.section === 'event'; })
        /* An event that has already happened drops out of "Upcoming" on its
           own. Today's events still show; undated ones always show, since
           there's nothing to judge them by. */
        .filter(function (i) { return !i.event_date || i.event_date >= today; })
        .slice(0, MAX_EVENTS);
      const activities = items
        .filter(function (i) { return i.section === 'activity'; })
        .slice(0, MAX_ACTIVITIES);

      renderSection('events-carousel', events, buildEventCard);
      renderSection('activities-carousel', activities, buildActivityCard);
    })
    .catch(function (err) {
      console.warn('Could not load cards from Supabase — showing placeholder cards.', err);
    });
})();


/* ─── JOIN FORM SUBMISSION ─── */
/*
   Validates ALL required fields, then POSTs to the submit-join Edge
   Function, which stores the row in Supabase and (optionally) emails a
   notification. Shows the success message only once the save is confirmed;
   on failure it tells the person to try again rather than lying to them.
*/

function submitForm() {
  /* Grab and trim every field */
  const firstName = document.getElementById('f-first').value.trim();
  const lastName  = document.getElementById('f-last').value.trim();
  const email     = document.getElementById('f-email').value.trim();
  const studentId = document.getElementById('f-id').value.trim();
  const dept      = document.getElementById('f-dept').value;

  /* Validation: every field is required (including Student ID) */
  if (!firstName || !lastName || !email || !studentId || !dept) {
    alert('Please fill in all fields — including your Student ID — to continue.');
    return;
  }
  /* Simple email sanity check */
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('Please enter a valid email address.');
    return;
  }

  const submitBtn = document.querySelector('#join-form-content .btn-submit');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';
  }

  fetch(`${SUPABASE_URL}/functions/v1/submit-join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    /* Key must be 'department' — that's the name the Edge Function reads. */
    body: JSON.stringify({
      firstName, lastName, email, studentId,
      /* Key must be 'department' — that's the name the Edge Function reads. */
      department: dept,
      /* Honeypot: empty for real people, filled by bots. See index.html. */
      website: (document.getElementById('f-website') || {}).value || ''
    })
  })
    .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
    .then(function (result) {
      if (!result.ok) throw new Error(result.data && result.data.error ? result.data.error : 'Submission failed.');
      /* Hide the form and show the success message */
      document.getElementById('join-form-content').style.display = 'none';
      document.getElementById('success-msg').style.display = 'block';
    })
    .catch(function (err) {
      console.error('Join submit failed:', err);
      alert(err && err.message && err.message !== 'Submission failed.'
        ? err.message
        : 'Sorry, something went wrong sending your submission. Please try again in a moment.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit My Interest ✦';
      }
    });
}


/* ─── CONTACT FORM SUBMISSION ─── */
/*
   Validates all 3 required fields, POSTs to the submit-contact Edge
   Function (stores the message in Supabase, optionally emails a
   notification), then shows the "Message sent!" confirmation only once
   the save is confirmed.
*/

(function initContactForm() {
  const sendBtn = document.querySelector('.btn-send');
  if (!sendBtn) return;

  sendBtn.addEventListener('click', function () {
    const name    = document.getElementById('c-name').value.trim();
    const email   = document.getElementById('c-email').value.trim();
    const message = document.getElementById('c-message').value.trim();

    /* Validation: all fields required */
    if (!name || !email || !message) {
      alert('Please fill in your name, email, and message before sending.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('Please enter a valid email address.');
      return;
    }

    const originalLabel = sendBtn.textContent;
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending…';

    fetch(`${SUPABASE_URL}/functions/v1/submit-contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        name, email, message,
        website: (document.getElementById('c-website') || {}).value || ''
      })
    })
      .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (result) {
        if (!result.ok) throw new Error(result.data && result.data.error ? result.data.error : 'Message failed to send.');
        /* Hide the form and show the success confirmation */
        document.getElementById('contact-form-content').style.display = 'none';
        document.getElementById('contact-success').style.display = 'block';
      })
      .catch(function (err) {
        console.error('Contact submit failed:', err);
        alert(err && err.message && err.message !== 'Message failed to send.'
          ? err.message
          : 'Sorry, something went wrong sending your message. Please try again in a moment.');
        sendBtn.disabled = false;
        sendBtn.textContent = originalLabel;
      });
  });
})();
