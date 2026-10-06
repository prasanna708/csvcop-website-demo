/* CSVCOP website behaviour. Plain JavaScript, no dependencies.
   Each feature is self-contained, so a problem in one never stops the others. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasIO = 'IntersectionObserver' in window;
  function $$(sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function safe(name, fn) { try { fn(); } catch (e) { if (window.console) { console.warn('[site] ' + name, e); } } }

  // Timers that run while the page is hidden waste battery; these are paused and resumed together.
  var pausables = [];
  document.addEventListener('visibilitychange', function () {
    pausables.forEach(function (p) { if (document.hidden) { p.pause(); } else { p.resume(); } });
  });

  // ── Headlines word by word: every word slides up out of its own mask ──
  safe('split', function () {
    $$('[data-split]').forEach(function (el) {
      var i = 0, out = document.createDocumentFragment();
      function word(content) {
        var w = document.createElement('span'), s = document.createElement('span');
        w.className = 'w'; s.style.setProperty('--i', i++);
        if (typeof content === 'string') { s.textContent = content; } else { s.appendChild(content); }
        w.appendChild(s);
        return w;
      }
      Array.prototype.slice.call(el.childNodes).forEach(function (node) {
        if (node.nodeType === 3) {
          node.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) { return; }
            out.appendChild(/^\s+$/.test(part) ? document.createTextNode(' ') : word(part));
          });
        } else if (node.nodeName === 'BR') {
          out.appendChild(node.cloneNode());
        } else {
          out.appendChild(word(node.cloneNode(true)));   // a highlighted phrase moves as one
        }
      });
      el.textContent = '';
      el.appendChild(out);
    });
  });

  // ── Load: the hero plays once the page is ready, never later than 1.2 s ──
  var started = false;
  function start() {
    if (started) { return; }
    started = true;
    root.classList.add('loaded');
    $$('.hero [data-split]').forEach(function (el) { el.classList.add('in'); });
  }
  if (document.readyState === 'complete') { start(); } else { window.addEventListener('load', start); }
  setTimeout(start, 1200);

  // ── Reveal on scroll ──
  safe('reveal', function () {
    $$('[data-stagger]').forEach(function (el) { Array.prototype.forEach.call(el.children, function (c, i) { c.style.setProperty('--i', i); }); });
    var items = $$('[data-reveal], [data-stagger], [data-split]').filter(function (el) { return !el.closest('.hero'); });
    function show(el) {
      el.classList.add('in');
      if (el.hasAttribute('data-stagger')) { setTimeout(function () { el.classList.add('done'); }, 1500); }
    }
    if (!hasIO || reduce) { items.forEach(show); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  });

  // ── Header and mobile menu ──
  safe('nav', function () {
    var toggle = document.getElementById('navToggle'), links = document.getElementById('navLinks');
    if (!toggle || !links) { return; }
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    links.addEventListener('click', function (e) { if (e.target.closest('a') && links.classList.contains('open')) { toggle.click(); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && links.classList.contains('open')) { toggle.click(); } });
  });

  // ── Everything driven by the scroll position, in one frame callback ──
  safe('scroll', function () {
    var header = document.querySelector('.site-header');
    var bar = document.querySelector('.scroll-progress');
    var stages = $$('[data-stage]');
    var steps = $$('.steps');
    var parallax = reduce ? [] : $$('[data-parallax]');
    var ticking = false;
    function frame() {
      ticking = false;
      var y = window.pageYOffset || root.scrollTop, vh = window.innerHeight;
      var max = root.scrollHeight - vh;
      if (header) { header.classList.toggle('scrolled', y > 24); }
      if (bar) { bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0) + ')'; }
      // The hero windows lie back at first and straighten as the stage comes up the screen.
      stages.forEach(function (st) {
        if (reduce) { return; }
        var r = st.getBoundingClientRect();
        var p = clamp((vh * 0.92 - r.top) / (vh * 0.75), 0, 1);
        var e = 1 - Math.pow(1 - p, 2);
        st.style.setProperty('--rx', (26 * (1 - e)).toFixed(2) + 'deg');
        st.style.setProperty('--s', (0.9 + 0.1 * e).toFixed(3));
        st.style.setProperty('--spread', (14 * e).toFixed(2));
        st.style.setProperty('--side', (0.92 - 0.25 * e).toFixed(3));
      });
      steps.forEach(function (s) {
        var r = s.getBoundingClientRect();
        var p = clamp((vh * 0.8 - r.top) / (r.height + vh * 0.3), 0, 1);
        s.style.setProperty('--p', p.toFixed(3));
        var list = s.querySelectorAll('.step');
        Array.prototype.forEach.call(list, function (st, k) { st.classList.toggle('on', p >= (k / list.length) * 0.92 + 0.02); });
      });
      parallax.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -300 || r.top > vh + 300) { return; }
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.08;
        el.style.transform = 'translate3d(0,' + ((r.top + r.height / 2 - vh / 2) * -speed).toFixed(1) + 'px,0)';
      });
    }
    function request() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    frame();
  });

  // ── Tilt towards the pointer ──
  safe('tilt', function () {
    if (reduce || !finePointer) { return; }
    $$('[data-tilt]').forEach(function (el) {
      var inner = el.querySelector('.tilt-inner') || el;
      var strength = parseFloat(el.getAttribute('data-tilt')) || 8;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        inner.style.transform = 'perspective(1500px) rotateY(' + (x * strength).toFixed(2) + 'deg) rotateX(' + (-y * strength * 0.8).toFixed(2) + 'deg)';
      });
      el.addEventListener('pointerleave', function () { inner.style.transform = ''; });
    });
  });

  // ── A light that follows the pointer across the capability tiles ──
  safe('spotlight', function () {
    if (!finePointer) { return; }
    document.addEventListener('pointermove', function (e) {
      var t = e.target.closest ? e.target.closest('.tile') : null;
      if (!t) { return; }
      var r = t.getBoundingClientRect();
      t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      t.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  });

  // ── The 3D carousel of real screens ──
  safe('carousel', function () {
    $$('[data-carousel]').forEach(function (c) {
      var items = $$('.c-item', c), n = items.length;
      if (!n) { return; }
      var cap = c.querySelector('.c-caption'), dots = c.querySelector('.c-dots'), track = c.querySelector('.carousel-track');
      var active = 0, timer = null, inView = false, hover = false, wait = 4200;
      items.forEach(function (it, k) {
        var b = document.createElement('button');
        b.type = 'button'; b.setAttribute('aria-label', 'Show screen ' + (k + 1) + ': ' + it.getAttribute('data-title'));
        b.addEventListener('click', function () { go(k); });
        dots.appendChild(b);
      });
      var dotBtns = $$('button', dots);
      function place() {
        items.forEach(function (it, k) {
          var d = k - active;
          if (d > n / 2) { d -= n; } else if (d < -n / 2) { d += n; }
          var a = Math.abs(d);
          it.style.transform = 'translateX(' + (d * 56) + '%) translateZ(' + (-a * 280) + 'px) rotateY(' + (-d * 40) + 'deg) scale(' + (1 - a * 0.05) + ')';
          it.style.opacity = a > 2 ? '0' : String(1 - a * 0.28);
          it.style.filter = a ? 'brightness(' + (1 - a * 0.22) + ') blur(' + (a * 0.8) + 'px)' : 'none';
          it.style.zIndex = String(10 - a);
          it.style.pointerEvents = a > 2 ? 'none' : 'auto';
          it.classList.toggle('active', a === 0);
          it.setAttribute('aria-hidden', a === 0 ? 'false' : 'true');
        });
        dotBtns.forEach(function (b, k) { b.classList.toggle('active', k === active); b.setAttribute('aria-current', k === active ? 'true' : 'false'); });
        var it = items[active], mod = it.getAttribute('data-mod') === 'b';
        cap.innerHTML = '<span class="tag' + (mod ? ' b' : '') + '"></span><h3></h3><p></p>';
        cap.querySelector('.tag').textContent = mod ? 'Micro-segmentation' : '21 CFR Part 11 Controls';
        cap.querySelector('h3').textContent = it.getAttribute('data-title');
        cap.querySelector('p').textContent = it.getAttribute('data-text');
      }
      function go(k) { active = (k + n) % n; place(); schedule(); }
      function schedule() { clearTimeout(timer); if (inView && !hover && !reduce && !document.hidden) { timer = setTimeout(function () { go(active + 1); }, wait); } }
      items.forEach(function (it, k) { it.addEventListener('click', function () { if (k !== active) { go(k); } }); });
      c.querySelector('.c-prev').addEventListener('click', function () { go(active - 1); });
      c.querySelector('.c-next').addEventListener('click', function () { go(active + 1); });
      c.addEventListener('pointerenter', function () { hover = true; clearTimeout(timer); });
      c.addEventListener('pointerleave', function () { hover = false; schedule(); });
      c.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { go(active + 1); e.preventDefault(); }
        if (e.key === 'ArrowLeft') { go(active - 1); e.preventDefault(); }
      });
      // A swipe on a touch screen moves it on.
      var x0 = null;
      track.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
      track.addEventListener('pointerup', function (e) {
        if (x0 === null) { return; }
        var dx = e.clientX - x0; x0 = null;
        if (Math.abs(dx) > 40) { go(active + (dx < 0 ? 1 : -1)); }
      });
      if (hasIO) { new IntersectionObserver(function (es) { inView = es[0].isIntersecting; schedule(); }, { threshold: 0.3 }).observe(c); }
      pausables.push({ pause: function () { clearTimeout(timer); }, resume: schedule });
      place();
    });
  });

  // ── Stacks of screens that deal themselves: the front card flies off and joins the back ──
  safe('stack', function () {
    $$('[data-stack]').forEach(function (st) {
      var cards = $$('.screen', st), n = cards.length;
      if (n < 2) { return; }
      var label = st.parentNode.querySelector('.stack-label b');
      var order = cards.map(function (c, k) { return k; }), timer = null, inView = false, hover = false, busy = false;
      function paint() {
        order.forEach(function (ci, pos) { cards[ci].setAttribute('data-pos', String(Math.min(pos, 3))); cards[ci].setAttribute('aria-hidden', pos === 0 ? 'false' : 'true'); });
        if (label) { label.textContent = cards[order[0]].getAttribute('data-title') || ''; }
      }
      function next() {
        if (busy) { return; }
        busy = true;
        var front = cards[order[0]];
        front.classList.add('out');
        setTimeout(function () {
          order.push(order.shift());
          front.classList.add('instant'); front.classList.remove('out');
          paint();
          void front.offsetWidth;
          front.classList.remove('instant');
          busy = false;
        }, 700);
        paint2();
        function paint2() {   // the others move up while the front card leaves
          order.slice(1).forEach(function (ci, pos) { cards[ci].setAttribute('data-pos', String(Math.min(pos, 3))); });
          if (label) { label.textContent = cards[order[1]].getAttribute('data-title') || ''; }
        }
      }
      function schedule() { clearTimeout(timer); if (inView && !hover && !reduce && !document.hidden) { timer = setTimeout(function () { next(); schedule(); }, 3600); } }
      st.addEventListener('pointerenter', function () { hover = true; clearTimeout(timer); });
      st.addEventListener('pointerleave', function () { hover = false; schedule(); });
      if (hasIO) { new IntersectionObserver(function (es) { inView = es[0].isIntersecting; schedule(); }, { threshold: 0.35 }).observe(st); }
      pausables.push({ pause: function () { clearTimeout(timer); }, resume: schedule });
      paint();
    });
  });

  // ── The 30-second cycle: a light goes round the ring, step by step ──
  safe('cycle', function () {
    $$('[data-cycle]').forEach(function (cy) {
      var pts = $$('.pt', cy), lis = $$('.cycle-list li', cy), n = pts.length, k = 0, timer = null, inView = false;
      pts.forEach(function (p, i) {   // place the points round the ring
        var a = (i / n) * Math.PI * 2 - Math.PI / 2, r = 41;
        p.style.left = (50 + Math.cos(a) * r) + '%'; p.style.top = (50 + Math.sin(a) * r) + '%';
      });
      function show(i) { pts.forEach(function (p, j) { p.classList.toggle('on', j === i); }); lis.forEach(function (l, j) { l.classList.toggle('on', j === i); }); }
      function tick() { show(k); k = (k + 1) % n; timer = setTimeout(tick, 1700); }
      function run() { clearTimeout(timer); if (inView && !reduce && !document.hidden) { tick(); } else { show(0); } }
      if (hasIO) { new IntersectionObserver(function (es) { inView = es[0].isIntersecting; run(); }, { threshold: 0.3 }).observe(cy); } else { show(0); }
      pausables.push({ pause: function () { clearTimeout(timer); }, resume: run });
    });
  });

  // ── Counters ──
  safe('count', function () {
    var els = $$('[data-count]');
    function run(el) {
      var to = parseInt(el.getAttribute('data-count'), 10) || 0, suffix = el.getAttribute('data-suffix') || '', t0 = null;
      if (reduce) { el.textContent = to + suffix; return; }
      function step(ts) {
        if (t0 === null) { t0 = ts; }
        var p = Math.min((ts - t0) / 1400, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) { requestAnimationFrame(step); }
      }
      requestAnimationFrame(step);
    }
    if (!hasIO) { return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }); }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  });

  // ── Segmented switch (Features): the pill slides to the module on screen ──
  safe('seg', function () {
    $$('[data-seg]').forEach(function (seg) {
      var links = $$('a', seg), thumb = seg.querySelector('.thumb');
      var targets = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
      function mark(k) {
        links.forEach(function (a, j) { a.classList.toggle('active', j === k); });
        var a = links[k];
        thumb.style.width = a.offsetWidth + 'px';
        thumb.style.transform = 'translateX(' + a.offsetLeft + 'px)';
        thumb.className = 'thumb ' + (a.getAttribute('data-mod') || '');
      }
      mark(0);
      window.addEventListener('resize', function () { var k = links.findIndex(function (a) { return a.classList.contains('active'); }); mark(k < 0 ? 0 : k); });
      if (!hasIO) { return; }
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { mark(targets.indexOf(e.target)); } });
      }, { rootMargin: '-35% 0px -60% 0px' });
      targets.forEach(function (t) { if (t) { io.observe(t); } });
    });
  });

  // ── Full-size screens, and the demo's notes, in one overlay ──
  safe('lightbox', function () {
    var lb = document.createElement('div');
    lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Screen, full size');
    lb.innerHTML = '<button class="lb-close" type="button" aria-label="Close">&times;</button><figure><img alt=""><figcaption></figcaption></figure>';
    document.body.appendChild(lb);
    var img = lb.querySelector('img'), cap = lb.querySelector('figcaption'), fig = lb.querySelector('figure'), last = null;
    function close() {
      lb.classList.remove('open'); fig.style.display = '';
      var n = lb.querySelector('.note-card'); if (n) { n.parentNode.removeChild(n); }
      if (last) { last.focus(); last = null; }
    }
    function open() { lb.classList.add('open'); lb.querySelector('.lb-close').focus(); }
    document.addEventListener('click', function (e) {
      var z = e.target.closest ? e.target.closest('[data-zoom]') : null;
      if (z) {
        var item = z.closest('.c-item'); if (item && !item.classList.contains('active')) { return; }
        var st = z.closest('[data-stack]'); if (st && z.getAttribute('data-pos') !== '0') { return; }
        var pic = z.querySelector('img');
        if (!pic) { return; }
        last = document.activeElement;
        img.src = pic.currentSrc || pic.src; img.alt = pic.alt; cap.textContent = pic.alt;
        open();
        return;
      }
      var a = e.target.closest ? e.target.closest('[data-demo-note]') : null;
      if (a) {
        e.preventDefault();
        last = a;
        fig.style.display = 'none';
        var card = document.createElement('div');
        card.className = 'note-card';
        card.innerHTML = '<span class="pill"><span class="dot"></span>Demo</span><h3></h3><p></p><button class="btn btn-primary" type="button">OK</button>';
        card.querySelector('h3').textContent = a.getAttribute('data-demo-title') || 'Not in this demo';
        card.querySelector('p').textContent = a.getAttribute('data-demo-note');
        card.querySelector('button').addEventListener('click', close);
        lb.appendChild(card);
        open();
      }
    });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-close')) { close(); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lb.classList.contains('open')) { close(); } });
  });

  // ── Contact form: checked on the page; the demo sends nothing ──
  safe('contact', function () {
    var form = document.getElementById('contactForm');
    if (!form) { return; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      $$('[required]', form).forEach(function (f) {
        var v = f.value.trim();
        var valid = v !== '' && (f.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) && (f.tagName !== 'TEXTAREA' || v.length >= 20);
        f.parentNode.classList.toggle('invalid', !valid);
        if (!valid) { ok = false; }
      });
      if (!ok) { var first = form.querySelector('.invalid input, .invalid textarea, .invalid select'); if (first) { first.focus(); } return; }
      var done = document.getElementById('formOk');
      if (done) { done.classList.add('show'); done.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); }
    });
    form.addEventListener('input', function (e) { var p = e.target.parentNode; if (p && p.classList.contains('invalid')) { p.classList.remove('invalid'); } });
  });
})();
