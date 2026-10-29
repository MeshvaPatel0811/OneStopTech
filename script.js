/* ==========================================================================
   One Stop Tech Solutions — script.js
   Vanilla JS + GSAP/ScrollTrigger + Lenis (loaded from CDN in index.html).
   Everything degrades gracefully: if the CDN fails or the visitor prefers
   reduced motion, all content is shown without animation.
   ========================================================================== */

(() => {
  'use strict';

  /* ------------------------------------------------------------------------
     CONFIG — tune every animation timing here.
     Durations are in seconds (GSAP) unless the name ends in "Ms".
     ------------------------------------------------------------------------ */
  const CONFIG = {
    preloader: {
      drawDuration: 1.6,          // hexagon stroke draw + 0→100 counter
      hold: 0.25,                 // pause at 100 before the curtain lifts
      contentFade: 0.4,           // logo/counter fade-out
      curtainDuration: 0.9,       // curtain slide up
      curtainEase: 'power4.inOut',
    },
    hero: {
      lineDuration: 1.1,          // hero headline lines slide up
      lineStagger: 0.12,
      fadeDuration: 0.8,          // eyebrow, subline, buttons, marquee
      fadeStagger: 0.1,
      fadeOverlap: 0.7,           // how early fades start before lines finish
    },
    headings: {
      duration: 1,
      stagger: 0.1,
      ease: 'power4.out',
      start: 'top 85%',           // when the reveal fires (ScrollTrigger start)
    },
    fadeUp: {
      duration: 0.9,
      stagger: 0.1,
      distance: 40,               // px
      start: 'top 88%',
    },
    images: {
      duration: 1.4,              // hexagon clip-path reveal
      ease: 'power3.inOut',
      scaleFrom: 1.1,             // image scales 1.1 → 1
      start: 'top 85%',
    },
    counters: { duration: 2, ease: 'power2.out', start: 'top 85%' },
    processLine: { scrub: 0.6 },  // seconds of "lag" on the scroll-drawn line
    parallax: { distance: 140, rotate: 20 }, // px / deg per 1.0 of data-speed
    magnetic: { strength: 0.35, duration: 0.6 },
    cursor: { follow: 0.18 },     // lower = snappier
    lenis: { duration: 1.15 },    // smooth-scroll inertia
    marquee: { duration: 40 },    // seconds per loop (CSS keyframes)
    menuDemo: {
      soldOutIntervalMs: 2600,    // toggle a "Sold out" badge
      scheduleIntervalMs: 8000,   // switch Breakfast ↔ Lunch
    },
    testimonials: { intervalMs: 6000 },
  };

  /* ---------- Helpers & feature checks ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const animate = hasGSAP && !reduceMotion;

  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  // Hexagon clip-path shapes (same number of points so GSAP can morph them)
  const HEX_SMALL = 'polygon(50% 35%, 63% 42.5%, 63% 57.5%, 50% 65%, 37% 57.5%, 37% 42.5%)';
  const HEX_SHAPE = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
  const HEX_COVER = 'polygon(50% -60%, 160% -5%, 160% 105%, 50% 160%, -60% 105%, -60% -5%)';

  let lenis = null;

  const navHeight = () => ($('#nav')?.offsetHeight || 0);


  /* ------------------------------------------------------------------------
     1. Smooth scroll (Lenis) + anchor links
     ------------------------------------------------------------------------ */
  function initSmoothScroll() {
    if (animate && typeof window.Lenis !== 'undefined') {
      lenis = new Lenis({
        duration: CONFIG.lenis.duration,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute('href');
      if (id.length < 2) return;           // plain "#" placeholder links
      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      closeMobileMenu();
      scrollToTarget(target);
    });
  }

  function scrollToTarget(target) {
    const offset = target.id === 'home' ? 0 : -navHeight() + 1;
    if (lenis) {
      lenis.scrollTo(target, { offset });
    } else {
      const y = target.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    // Move keyboard focus to the section without jumping
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }


  /* ------------------------------------------------------------------------
     2. Navbar: scrolled state + active link highlight
     ------------------------------------------------------------------------ */
  function initNav() {
    const nav = $('#nav');
    if (!nav) return;

    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const links = $$('.nav__link');
    const sections = links
      .map((l) => document.querySelector(l.getAttribute('href')))
      .filter(Boolean);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((l) => {
          const active = l.getAttribute('href') === `#${entry.target.id}`;
          l.classList.toggle('is-active', active);
          if (active) l.setAttribute('aria-current', 'true');
          else l.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach((s) => observer.observe(s));
  }


  /* ------------------------------------------------------------------------
     3. Mobile overlay menu
     ------------------------------------------------------------------------ */
  const toggleBtn = $('.nav__toggle');
  const mobileMenu = $('#mobile-menu');

  function openMobileMenu() {
    document.body.classList.add('menu-open');
    toggleBtn.setAttribute('aria-expanded', 'true');
    mobileMenu.removeAttribute('inert');
    if (lenis) lenis.stop(); else document.body.style.overflow = 'hidden';
    setTimeout(() => $('a', mobileMenu)?.focus(), 300);
  }

  function closeMobileMenu() {
    if (!document.body.classList.contains('menu-open')) return;
    document.body.classList.remove('menu-open');
    toggleBtn.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('inert', '');
    if (lenis) lenis.start(); else document.body.style.overflow = '';
  }

  function initMobileMenu() {
    if (!toggleBtn || !mobileMenu) return;
    toggleBtn.addEventListener('click', () => {
      document.body.classList.contains('menu-open') ? closeMobileMenu() : openMobileMenu();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
        closeMobileMenu();
        toggleBtn.focus();
      }
    });
    // Close if the viewport grows to desktop size while open
    window.matchMedia('(min-width: 1000px)').addEventListener('change', (e) => {
      if (e.matches) closeMobileMenu();
    });
  }


  /* ------------------------------------------------------------------------
     4. Preloader — hexagon draws itself, counter 0→100, curtain slides up
     ------------------------------------------------------------------------ */
  function runPreloader(onDone) {
    const pre = $('#preloader');
    const finish = () => {
      pre?.remove();
      if (lenis) lenis.start();
    };

    if (!pre || !animate) {
      finish();
      onDone();
      return;
    }

    if (lenis) lenis.stop();
    window.scrollTo(0, 0);

    const c = CONFIG.preloader;
    const counter = $('[data-preloader-count]', pre);
    const count = { v: 0 };

    gsap.timeline({ onComplete: () => { finish(); ScrollTrigger.refresh(); } })
      .to('.preloader__hex', { strokeDashoffset: 0, duration: c.drawDuration, ease: 'power2.inOut' }, 0)
      .to(count, {
        v: 100,
        duration: c.drawDuration,
        ease: 'power2.inOut',
        onUpdate: () => { counter.textContent = Math.round(count.v); },
      }, 0)
      .to('.preloader__inner', { opacity: 0, y: -20, duration: c.contentFade, ease: 'power2.in' }, `+=${c.hold}`)
      .to(pre, { yPercent: -100, duration: c.curtainDuration, ease: c.curtainEase })
      .add(onDone, `-=${c.curtainDuration * 0.45}`);
  }


  /* ------------------------------------------------------------------------
     5. Hero intro (plays as the curtain lifts)
     ------------------------------------------------------------------------ */
  function prepareHero() {
    if (!animate) return;
    gsap.set('.hero .line > span', { yPercent: 110 });
    gsap.set('[data-hero-fade]', { opacity: 0, y: 30 });
  }

  function playHero() {
    if (!animate) return;
    const c = CONFIG.hero;
    gsap.timeline()
      .to('.hero .line > span', { yPercent: 0, duration: c.lineDuration, stagger: c.lineStagger, ease: 'power4.out' })
      .to('[data-hero-fade]', {
        opacity: 1, y: 0,
        duration: c.fadeDuration, stagger: c.fadeStagger, ease: 'power3.out',
        clearProps: 'transform',
      }, `-=${c.fadeOverlap}`);
  }


  /* ------------------------------------------------------------------------
     6. Scroll animations (GSAP ScrollTrigger)
     ------------------------------------------------------------------------ */
  function initScrollAnimations() {
    if (!animate) return;

    // 6a. Headlines slide up through a mask
    const h = CONFIG.headings;
    $$('[data-reveal]').forEach((el) => {
      gsap.from(el.querySelectorAll('.line > span'), {
        yPercent: 110,
        duration: h.duration,
        stagger: h.stagger,
        ease: h.ease,
        scrollTrigger: { trigger: el, start: h.start },
      });
    });

    // 6b. Cards, tiles, steps etc. fade up in staggered batches
    const f = CONFIG.fadeUp;
    gsap.set('[data-fade]', { opacity: 0, y: f.distance });
    ScrollTrigger.batch('[data-fade]', {
      start: f.start,
      once: true,
      onEnter: (batch) => gsap.to(batch, {
        opacity: 1, y: 0,
        duration: f.duration, stagger: f.stagger, ease: 'power3.out',
        clearProps: 'transform,opacity', // hand hover transforms back to CSS
      }),
    });

    // 6c. Images reveal with a hexagonal clip-path and scale 1.1 → 1
    const im = CONFIG.images;
    $$('.reveal-img').forEach((el) => {
      const img = $('img', el);
      const keepHex = el.dataset.revealShape === 'hex'; // stays hexagonal after reveal
      const to = { clipPath: keepHex ? HEX_SHAPE : HEX_COVER, duration: im.duration, ease: im.ease };
      if (!keepHex) to.clearProps = 'clipPath';
      gsap.timeline({ scrollTrigger: { trigger: el, start: im.start } })
        .fromTo(el, { clipPath: HEX_SMALL }, to)
        .from(img, { scale: im.scaleFrom, duration: im.duration, ease: im.ease, clearProps: 'transform' }, 0);
    });

    // 6d. Hexagon outlines drift with scroll (parallax)
    const p = CONFIG.parallax;
    $$('[data-speed]').forEach((el) => {
      const speed = parseFloat(el.dataset.speed) || 0.5;
      gsap.to(el, {
        y: -p.distance * speed,
        rotate: p.rotate * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: el.closest('section') || el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    });

    // 6e. Process line draws in on scroll (horizontal desktop / vertical mobile)
    const fill = $('.process__line-fill');
    if (fill) {
      const mm = gsap.matchMedia();
      const st = (start, end) => ({ trigger: '.process', start, end, scrub: CONFIG.processLine.scrub });
      mm.add('(min-width: 900px)', () => {
        gsap.fromTo(fill, { scaleX: 0, scaleY: 1 }, { scaleX: 1, ease: 'none', scrollTrigger: st('top 75%', 'bottom 55%') });
      });
      mm.add('(max-width: 899.98px)', () => {
        gsap.fromTo(fill, { scaleY: 0, scaleX: 1 }, { scaleY: 1, ease: 'none', scrollTrigger: st('top 70%', 'bottom 60%') });
      });
    }

    // 6f. Number counters
    const cc = CONFIG.counters;
    $$('[data-count]').forEach((el) => {
      const target = parseFloat(el.dataset.count) || 0;
      const obj = { v: 0 };
      el.textContent = '0';
      ScrollTrigger.create({
        trigger: el,
        start: cc.start,
        once: true,
        onEnter: () => gsap.to(obj, {
          v: target,
          duration: cc.duration,
          ease: cc.ease,
          onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString('en-CA'); },
        }),
      });
    });

    // Recalculate positions once web fonts have loaded
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }


  /* ------------------------------------------------------------------------
     7. Custom cursor — teal dot that grows into a ring on links/buttons
     ------------------------------------------------------------------------ */
  function initCursor() {
    const cursor = $('.cursor');
    if (!cursor || !finePointer || !animate) return;

    document.documentElement.classList.add('has-cursor');
    const xTo = gsap.quickTo(cursor, 'x', { duration: CONFIG.cursor.follow, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: CONFIG.cursor.follow, ease: 'power3' });

    window.addEventListener('mousemove', (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
      cursor.classList.add('is-visible');
    }, { passive: true });

    document.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));

    document.addEventListener('mouseover', (e) => {
      const t = e.target;
      cursor.classList.toggle('is-hover', !!t.closest('a, button, [data-cursor], .marquee__item'));
      cursor.classList.toggle('is-text', !!t.closest('input, textarea'));
    });
  }


  /* ------------------------------------------------------------------------
     8. Magnetic buttons — follow the cursor slightly
     ------------------------------------------------------------------------ */
  function initMagnetic() {
    if (!finePointer || !animate) return;
    const m = CONFIG.magnetic;

    $$('.magnetic').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: m.duration, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: m.duration, ease: 'power3' });

      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * m.strength);
        yTo((e.clientY - (r.top + r.height / 2)) * m.strength);
      });
      el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    });
  }


  /* ------------------------------------------------------------------------
     9. Digital menu demo — "Sold out" toggles + scheduled Breakfast → Lunch
        (Plain JS, runs even without GSAP. Pauses when off-screen.)
     ------------------------------------------------------------------------ */
  function initMenuDemo() {
    const screen = $('[data-menu-screen]');
    if (!screen) return;

    const menus = $$('[data-menu]', screen);
    const label = $('[data-period-label]', screen);
    const time = $('[data-period-time]', screen);
    const clock = $('[data-screen-clock]', screen);
    const progress = $('[data-menu-progress]', screen);
    const status = $('[data-menu-status]');
    const toggle = $('[data-menu-toggle]');
    const cfg = CONFIG.menuDemo;

    let current = 0;
    let soldTimer = null;
    let scheduleTimer = null;
    let inView = false;
    let paused = false;
    const rotation = menus.map(() => 0); // which demo item to toggle next, per menu

    screen.style.setProperty('--schedule', `${cfg.scheduleIntervalMs}ms`);

    const setStatus = (msg) => {
      if (!status) return;
      status.textContent = msg;
      status.classList.add('is-flash');
      clearTimeout(setStatus.t);
      setStatus.t = setTimeout(() => status.classList.remove('is-flash'), 1200);
    };

    const restartProgress = () => {
      if (!progress) return;
      progress.classList.remove('is-running');
      void progress.offsetWidth; // force reflow so the CSS animation restarts
      progress.classList.add('is-running');
    };

    const showMenu = (i) => {
      menus.forEach((m, idx) => {
        m.classList.toggle('is-active', idx === i);
        m.setAttribute('aria-hidden', String(idx !== i));
      });
      const m = menus[i];
      label.textContent = m.dataset.label;
      time.textContent = m.dataset.time;
      clock.textContent = m.dataset.clock;
    };

    const toggleSoldOut = () => {
      const items = $$('[data-soldout-demo]', menus[current]);
      if (!items.length) return;
      const item = items[rotation[current] % items.length];
      rotation[current]++;
      const name = $('.item__name', item).textContent;
      const soldOut = item.classList.toggle('is-sold-out');
      setStatus(soldOut
        ? `⚡ Update pushed: “${name}” marked sold out`
        : `⚡ Update pushed: “${name}” back in stock`);
    };

    const nextMenu = () => {
      current = (current + 1) % menus.length;
      showMenu(current);
      restartProgress();
      setStatus(`⏱ Scheduled switch: ${menus[current].dataset.label} menu is now live`);
    };

    const start = () => {
      if (soldTimer || paused || !inView) return;
      restartProgress();
      soldTimer = setInterval(toggleSoldOut, cfg.soldOutIntervalMs);
      scheduleTimer = setInterval(nextMenu, cfg.scheduleIntervalMs);
    };

    const stop = () => {
      clearInterval(soldTimer);
      clearInterval(scheduleTimer);
      soldTimer = scheduleTimer = null;
      progress?.classList.remove('is-running');
    };

    showMenu(current);

    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      inView ? start() : stop();
    }, { threshold: 0.35 }).observe(screen);

    toggle?.addEventListener('click', () => {
      paused = !paused;
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.textContent = paused ? 'Play demo' : 'Pause demo';
      paused ? stop() : start();
    });
  }


  /* ------------------------------------------------------------------------
     10. Testimonials slider — dots, arrows, swipe, auto-advance
     ------------------------------------------------------------------------ */
  function initSlider() {
    const slider = $('[data-slider]');
    if (!slider) return;

    const track = $('.slider__track', slider);
    const slides = $$('.slide', slider);
    const dotsWrap = $('[data-slider-dots]', slider);
    let index = 0;
    let timer = null;

    const dots = slides.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'slider__dot';
      b.setAttribute('aria-label', `Show testimonial ${i + 1} of ${slides.length}`);
      b.addEventListener('click', () => { go(i); restart(); });
      dotsWrap.appendChild(b);
      return b;
    });

    function go(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      slides.forEach((s, k) => {
        s.setAttribute('aria-hidden', String(k !== index));
        s.inert = k !== index;
      });
      dots.forEach((d, k) => d.setAttribute('aria-current', String(k === index)));
    }

    const stopAuto = () => { clearInterval(timer); timer = null; };
    const startAuto = () => {
      if (reduceMotion || timer) return;
      timer = setInterval(() => go(index + 1), CONFIG.testimonials.intervalMs);
    };
    const restart = () => { stopAuto(); startAuto(); };

    $('[data-slider-prev]', slider)?.addEventListener('click', () => { go(index - 1); restart(); });
    $('[data-slider-next]', slider)?.addEventListener('click', () => { go(index + 1); restart(); });

    // Pause while the visitor is reading or using the controls
    slider.addEventListener('mouseenter', stopAuto);
    slider.addEventListener('mouseleave', startAuto);
    slider.addEventListener('focusin', stopAuto);
    slider.addEventListener('focusout', startAuto);

    // Swipe on touch screens
    let startX = null;
    slider.addEventListener('pointerdown', (e) => { startX = e.clientX; });
    slider.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 50) { go(index + (dx < 0 ? 1 : -1)); restart(); }
      startX = null;
    });

    go(0);
    startAuto();
  }


  /* ------------------------------------------------------------------------
     11. FAQ accordion (one item open at a time)
     ------------------------------------------------------------------------ */
  function initAccordion() {
    const buttons = $$('.faq__q');

    const setOpen = (btn, open) => {
      btn.setAttribute('aria-expanded', String(open));
      btn.closest('.faq__item').classList.toggle('is-open', open);
    };

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') === 'true';
        buttons.forEach((b) => { if (b !== btn) setOpen(b, false); });
        setOpen(btn, !open);
        // Page height changed — update scroll trigger positions after the transition
        if (hasGSAP) setTimeout(() => ScrollTrigger.refresh(), 500);
      });
    });
  }


  /* ------------------------------------------------------------------------
     12. Contact form — mailto fallback or Formspree (AJAX)
     ------------------------------------------------------------------------ */
  function initForm() {
    const form = $('#contact-form');
    if (!form) return;
    const status = $('[data-form-status]', form);
    const submitBtn = $('button[type="submit"]', form);

    const setStatus = (msg, type = '') => {
      status.textContent = msg;
      status.className = `form__status ${type ? `is-${type}` : ''}`;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = new FormData(form);
      if (data.get('_gotcha')) return; // bot filled the honeypot

      const action = form.getAttribute('action') || '';

      // Option A: mailto — open the visitor's email app with everything filled in
      if (action.startsWith('mailto:')) {
        const to = form.dataset.email || action.replace('mailto:', '');
        const business = data.get('business');
        const subject = `Website enquiry from ${data.get('name')}${business ? ` (${business})` : ''}`;
        const body = [
          `Name: ${data.get('name')}`,
          `Business: ${business || '-'}`,
          `Email: ${data.get('email')}`,
          `Phone: ${data.get('phone') || '-'}`,
          `Service: ${data.get('service')}`,
          '',
          data.get('message'),
        ].join('\n');
        window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setStatus(`Opening your email app… If nothing happens, email us at ${to}.`, 'ok');
        return;
      }

      // Option B: Formspree (or any endpoint that accepts POST + JSON response)
      submitBtn.disabled = true;
      setStatus('Sending…');
      try {
        const res = await fetch(action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(res.statusText);
        form.reset();
        setStatus('Thanks! We’ll be in touch within one business day.', 'ok');
      } catch (err) {
        setStatus('Sorry, something went wrong. Please call 519-992-6711 or email us directly.', 'error');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }


  /* ------------------------------------------------------------------------
     13. Footer: back to top + current year
     ------------------------------------------------------------------------ */
  function initFooter() {
    $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

    $('[data-to-top]')?.addEventListener('click', () => {
      if (lenis) lenis.scrollTo(0);
      else window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      $('.logo')?.focus({ preventScroll: true });
    });
  }


  /* ------------------------------------------------------------------------
     Init
     ------------------------------------------------------------------------ */
  document.documentElement.style.setProperty('--marquee-duration', `${CONFIG.marquee.duration}s`);

  initSmoothScroll();
  initNav();
  initMobileMenu();
  initCursor();
  initMagnetic();
  initMenuDemo();
  initSlider();
  initAccordion();
  initForm();
  initFooter();

  prepareHero();
  initScrollAnimations();
  runPreloader(playHero);
})();
