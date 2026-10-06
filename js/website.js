/* CSVCOP marketing site. Plain JavaScript, no dependencies. */
(function () {
  'use strict';

  // ── Mobile navigation ──
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && links.classList.contains('open')) { toggle.click(); }
    });
  }

  // ── Reveal on scroll ──
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  function revealAll() { revealEls.forEach(function (el) { el.classList.add('in'); }); }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
    // Safety net for an observer that never fires (a background tab): after 2.5 s, whatever is already above the
    // bottom of the window is shown. Sections further down still come in as they are scrolled to; the old net
    // revealed the whole page at once, so nothing was ever seen animating.
    setTimeout(function () {
      var limit = window.innerHeight;
      revealEls.forEach(function (el) { if (el.getBoundingClientRect().top < limit) { el.classList.add('in'); } });
    }, 2500);
  } else {
    revealAll();
  }

  // ── Animated counters: <b class="count" data-count="97" data-suffix=" s"> ──
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1100, start = null;
    function tick(ts) {
      if (start === null) { start = ts; }
      var p = Math.min((ts - start) / duration, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) { requestAnimationFrame(tick); }
    }
    requestAnimationFrame(tick);
  }
  // Only elements that carry data-count: the accordion's ".count" chips hold plain text and must be left alone.
  var counters = Array.prototype.slice.call(document.querySelectorAll('.count[data-count]'));
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCount(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.3 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  // ── Feature-page chips: open the accordion a chip points at ──
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) { return; }
    var target = document.querySelector(a.getAttribute('href'));
    if (target && target.tagName === 'DETAILS') { target.open = true; }
  });

  // ── Contact form: marks empty or malformed boxes before the post, so the visitor is not
  //    sent to the server to be told something obvious. The server checks all of this again. ──
  var form = document.getElementById('contactForm');
  if (form) {
    var sent = false;
    form.addEventListener('submit', function (e) {
      var ok = true;
      Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (field) {
        var value = field.value.trim();
        var valid = value !== '' && (field.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
        field.parentNode.classList.toggle('invalid', !valid);
        if (!valid) { ok = false; }
      });

      var message = form.elements['Message'];
      if (ok && message && message.value.trim().length < 20) {
        message.parentNode.classList.add('invalid');
        ok = false;
      }

      if (!ok) {
        e.preventDefault();
        var first = form.querySelector('.invalid input, .invalid textarea, .invalid select');
        if (first) { first.focus(); }
        return;
      }

      // The demo has no server: a complete form is answered on the page and sent nowhere.
      if (form.hasAttribute('data-demo')) {
        e.preventDefault();
        var okBox = document.getElementById('formOk');
        if (okBox) { okBox.classList.add('show'); okBox.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        return;
      }

      // One press is enough; a second would be turned away as a repeat anyway.
      if (sent) { e.preventDefault(); return; }
      sent = true;
      var button = form.querySelector('button[type="submit"]');
      // After this event, not during it: a button disabled mid-submit stops the post in some browsers.
      if (button) { setTimeout(function () { button.disabled = true; button.textContent = 'Sending…'; }, 0); }
    });
    form.addEventListener('input', function (e) {
      if (e.target.parentNode.classList.contains('invalid')) { e.target.parentNode.classList.remove('invalid'); }
    });
  }

  // Show/hide for password boxes: the button sits inside .input-wrap next to the field.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-password-toggle]') : null;
    if (!btn) { return; }
    var wrap = btn.parentNode;
    var field = wrap ? wrap.querySelector('input[type="password"], input[type="text"]') : null;
    if (!field) { return; }
    var show = field.type === 'password';
    field.type = show ? 'text' : 'password';
    btn.classList.toggle('on', show);
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    btn.setAttribute('title', show ? 'Hide password' : 'Show password');
    field.focus();
  });

  // ── Footer year ──
  Array.prototype.forEach.call(document.querySelectorAll('.year'), function (el) { el.textContent = new Date().getFullYear(); });
})();
