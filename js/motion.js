/* CSVCOP site motion and the demo's own behaviour. Plain JavaScript, no dependencies. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var each = function (sel, fn, scope) { Array.prototype.forEach.call((scope || document).querySelectorAll(sel), fn); };

  // ── Entrance: [data-enter] elements play once the page has loaded (never later than 1.2 s) ──
  var started = false;
  function start() { if (!started) { started = true; root.classList.add('loaded'); } }
  if (document.readyState === 'complete') { start(); } else { window.addEventListener('load', start); }
  setTimeout(start, 1200);

  // ── Reveal on scroll: the directional variants, staggered groups and the module drawings ──
  each('.stagger', function (el) { Array.prototype.forEach.call(el.children, function (c, i) { c.style.setProperty('--i', i); }); });
  var targets = Array.prototype.slice.call(document.querySelectorAll('.reveal-left, .reveal-right, .reveal-zoom, .stagger'));
  function shown(el) {
    el.classList.add('in');
    // Once a group has come in, its cards answer the pointer at once rather than after their delay.
    if (el.classList.contains('stagger')) { setTimeout(function () { el.classList.add('done'); }, 1400); }
  }
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { shown(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(shown);
  }

  // ── Scroll-driven: reading progress, the header, parallax ──
  var progress = document.querySelector('.scroll-progress');
  var header = document.querySelector('.site-header');
  var parallax = reduce ? [] : Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  var ticking = false;
  function onScroll() {
    if (ticking) { return; }
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.pageYOffset || root.scrollTop;
      var max = root.scrollHeight - window.innerHeight;
      if (progress) { progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')'; }
      if (header) { header.classList.toggle('scrolled', y > 10); }
      var vh = window.innerHeight;
      parallax.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) { return; }
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.1;
        var offset = (r.top + r.height / 2 - vh / 2) * -speed;
        el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
      });
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // ── Tilt: the hero windows lean towards the pointer ──
  if (!reduce && !(window.matchMedia && window.matchMedia('(hover: none)').matches)) {
    each('[data-tilt]', function (el) {
      var inner = el.querySelector('.tilt-inner') || el;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        inner.style.transform = 'perspective(1500px) rotateY(' + (x * 7).toFixed(2) + 'deg) rotateX(' + (-y * 6).toFixed(2) + 'deg)';
      });
      el.addEventListener('mouseleave', function () { inner.style.transform = ''; });
    });
  }

  // ── Product tour: the step in the middle of the screen decides which screenshot shows ──
  each('.tour', function (tour) {
    var steps = tour.querySelectorAll('.tour-step');
    var imgs = tour.querySelectorAll('.tour-stage .imgs img');
    var dots = tour.querySelectorAll('.tour-dots i');
    var badge = tour.querySelector('.tour-badge');
    var cap = tour.querySelector('.tour-cap');
    var current = -1;
    function activate(i) {
      if (i === current) { return; }
      current = i;
      var step = steps[i], mod = step.getAttribute('data-module') || 'a';
      each('.tour-step', function (s, k) { s.classList.toggle('active', k === i); }, tour);
      Array.prototype.forEach.call(imgs, function (im, k) { im.classList.toggle('active', k === i); });
      Array.prototype.forEach.call(dots, function (d, k) { d.classList.toggle('active', k === i); d.classList.toggle('b', k === i && mod === 'b'); });
      if (badge) { badge.textContent = step.getAttribute('data-badge') || ''; badge.classList.toggle('b', mod === 'b'); }
      if (cap) { cap.innerHTML = step.getAttribute('data-caption') || ''; }
    }
    if ('IntersectionObserver' in window) {
      var tio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { activate(Array.prototype.indexOf.call(steps, e.target)); } });
      }, { rootMargin: '-45% 0px -45% 0px' });
      Array.prototype.forEach.call(steps, function (s) { tio.observe(s); });
    }
    activate(0);
  });

  // ── Galleries: tabs of real screenshots that move on by themselves while in view ──
  each('.gallery', function (g) {
    var tabs = g.querySelectorAll('.gal-tab'), imgs = g.querySelectorAll('.gal-stage .imgs img'), cap = g.querySelector('.gal-cap');
    var i = 0, timer = null, inView = false, hover = false, dur = 6500;
    g.style.setProperty('--dur', dur + 'ms');
    function show(k) {
      i = k;
      Array.prototype.forEach.call(tabs, function (t, j) {
        t.classList.toggle('active', j === k);
        t.setAttribute('aria-selected', j === k ? 'true' : 'false');
        var bar = t.querySelector('.bar'); if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
      });
      Array.prototype.forEach.call(imgs, function (im, j) { im.classList.toggle('active', j === k); });
      if (cap) { cap.textContent = tabs[k].getAttribute('data-caption') || ''; }
    }
    function schedule() {
      clearTimeout(timer);
      if (inView && !hover && !reduce) { timer = setTimeout(function () { show((i + 1) % tabs.length); schedule(); }, dur); }
    }
    Array.prototype.forEach.call(tabs, function (t, j) { t.addEventListener('click', function () { show(j); schedule(); }); });
    g.addEventListener('mouseenter', function () { hover = true; g.classList.add('paused'); clearTimeout(timer); });
    g.addEventListener('mouseleave', function () { hover = false; g.classList.remove('paused'); show(i); schedule(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; schedule(); }, { threshold: 0.35 }).observe(g);
    }
    show(0);
  });

  // ── Lightbox: any [data-zoom] screenshot opens at full size ──
  var lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.innerHTML = '<button class="lb-close" type="button" aria-label="Close">&times;</button><figure><img alt=""><figcaption></figcaption></figure>';
  document.body.appendChild(lb);
  var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('figcaption'), lbFig = lb.querySelector('figure');
  function closeBox() { lb.classList.remove('open'); lbFig.style.display = ''; var n = lb.querySelector('.note-card'); if (n) { n.parentNode.removeChild(n); } }
  document.addEventListener('click', function (e) {
    var z = e.target.closest ? e.target.closest('[data-zoom]') : null;
    if (!z) { return; }
    var img = z.querySelector('img.active') || z.querySelector('.imgs img') || z.querySelector('img:not(.app-ico)');
    if (!img) { return; }
    lbImg.src = img.getAttribute('src'); lbImg.alt = img.alt; lbCap.textContent = img.getAttribute('data-caption') || img.alt || '';
    lb.classList.add('open');
  });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-close')) { closeBox(); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeBox(); } });

  // ── The demo's notes: what the live site would do that a demo cannot ──
  function note(title, text) {
    lbFig.style.display = 'none';
    var card = document.createElement('div');
    card.className = 'note-card';
    card.innerHTML = '<span class="eyebrow">Demo</span><h3></h3><p></p><button class="btn btn-primary" type="button">OK</button>';
    card.querySelector('h3').textContent = title; card.querySelector('p').textContent = text;
    card.querySelector('button').addEventListener('click', closeBox);
    lb.appendChild(card);
    lb.classList.add('open');
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('[data-demo-note]') : null;
    if (!a) { return; }
    e.preventDefault();
    note(a.getAttribute('data-demo-title') || 'Not in this demo', a.getAttribute('data-demo-note'));
  });

  // ── Features page: the switch at the top follows the section on screen ──
  each('[data-spy]', function (nav) {
    var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
    var map = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
    if (!('IntersectionObserver' in window)) { return; }
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) { return; }
        var k = map.indexOf(e.target);
        links.forEach(function (a, j) { a.classList.toggle('active', j === k); });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    map.forEach(function (s) { if (s) { sio.observe(s); } });
  });
})();
