/* Optimum Racing: University + Team page animations (pairs with css/pages.css) */
(function () {
  'use strict';
  window.__rvLoaded = true; /* tells the page head that this script arrived */

  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var animate = ('IntersectionObserver' in window) && !reduce;

  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function byDom(a, b) { return (a.target.compareDocumentPosition(b.target) & 4) ? -1 : 1; }
  function isIn(e) { return e.isIntersecting; }
  function fmt(n, el) {
    n = Math.round(n);
    return el.hasAttribute('data-sep') ? n.toLocaleString('en-US') : String(n);
  }

  /* ---- Departments tabs: switch panels + glow on the one showing ---- */
  function initTabs() {
    var tabs = $$('.tabs [role="tab"]');
    if (!tabs.length) return;
    function panelOf(t) { return document.getElementById(t.getAttribute('aria-controls')); }
    function flash(p) {
      if (!p) return;
      p.classList.remove('pg-flash');
      void p.offsetWidth;
      p.classList.add('pg-flash');
    }
    $$('.dept-grid').forEach(function (g) {
      $$('li', g).forEach(function (li, i) { li.style.setProperty('--k', i); });
    });
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (x) {
          var on = x === t, p = panelOf(x);
          x.setAttribute('aria-selected', on ? 'true' : 'false');
          if (!p) return;
          if (on) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
        });
        flash(panelOf(t));
      });
    });
    if (animate) {
      new IntersectionObserver(function (entries, obs) {
        if (!entries.some(isIn)) return;
        obs.disconnect();
        tabs.forEach(function (x) { if (x.getAttribute('aria-selected') === 'true') flash(panelOf(x)); });
      }, { threshold: 0.4 }).observe(tabs[0].parentNode);
    }
  }

  /* ---- Numbers that grow when scrolled into view ---- */
  function runCount(el, delay) {
    var to = +el.getAttribute('data-grow');
    var from = +(el.getAttribute('data-from') || 0);
    var dur = +(el.getAttribute('data-dur') || 1900);
    var t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts + delay;
      var k = (ts - t0) / dur;
      if (k < 0) { requestAnimationFrame(step); return; }
      if (k > 1) k = 1;
      el.textContent = fmt(from + (to - from) * (1 - Math.pow(1 - k, 3)), el);
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function initCounters() {
    var els = $$('[data-grow]');
    if (!els.length) return;
    els.forEach(function (el) { el.textContent = fmt(+(el.getAttribute('data-from') || 0), el); });
    var group = els[0].closest('.stats') || document.body;
    new IntersectionObserver(function (entries, obs) {
      if (!entries.some(isIn)) return;
      obs.disconnect();
      els.forEach(function (el, i) { runCount(el, i * 160); });
    }, { threshold: 0.25 }).observe(group);
  }

  /* ---- Generic scroll reveal: elements with class "rv" come in one by one ---- */
  function initReveal() {
    var els = $$('.rv');
    els.forEach(function (el) {
      var d = el.getAttribute('data-d');
      if (d !== null) el.style.setProperty('--d', d + 's');
    });
    var io = new IntersectionObserver(function (entries) {
      entries.filter(isIn).sort(byDom).forEach(function (e, i) {
        var el = e.target, d = el.getAttribute('data-d');
        var delay = d !== null ? parseFloat(d) : Math.min(i, 8) * 0.12;
        io.unobserve(el);
        el.style.setProperty('--d', delay + 's');
        el.classList.add('is-in');
        setTimeout(function () { el.classList.add('rv-done'); }, (delay + 1) * 1000);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---- History timeline: line draws as you scroll, events appear one by one ---- */
  function initTimeline() {
    var tl = document.querySelector('.tl');
    if (!tl) return;
    var items = $$('.tl-item', tl);
    var dots = $$('.tl-dot', tl);
    var rt = 0, rh = 0, ticking = false;

    function measure() {
      if (dots.length < 2) return;
      var base = tl.getBoundingClientRect().top;
      var a = dots[0].getBoundingClientRect();
      var b = dots[dots.length - 1].getBoundingClientRect();
      rt = a.top - base + a.height / 2;
      rh = (b.top + b.height / 2) - (a.top + a.height / 2);
      tl.style.setProperty('--rt', rt + 'px');
      tl.style.setProperty('--rh', rh + 'px');
    }
    function update() {
      ticking = false;
      var vh = window.innerHeight, r = tl.getBoundingClientRect();
      var p = rh > 0 ? (vh * 0.75 - (r.top + rt)) / rh : 0;
      tl.style.setProperty('--p', Math.max(0, Math.min(1, p)).toFixed(4));
      var best = null, bd = 1e9;
      items.forEach(function (el) {
        if (!el.classList.contains('is-in')) return;
        var b = el.getBoundingClientRect();
        var d = Math.abs(b.top + Math.min(b.height, 120) / 2 - vh * 0.5);
        if (d < bd) { bd = d; best = el; }
      });
      items.forEach(function (el) { el.classList.toggle('is-active', el === best); });
    }
    function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

    var tio = new IntersectionObserver(function (entries) {
      entries.filter(isIn).sort(byDom).forEach(function (e, i) {
        tio.unobserve(e.target);
        e.target.style.setProperty('--d', (i * 0.2) + 's');
        e.target.classList.add('is-in');
      });
      req();
    }, { threshold: 0.2, rootMargin: '0px 0px -20% 0px' });
    items.forEach(function (el) { tio.observe(el); });

    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', function () { measure(); req(); });
    window.addEventListener('load', function () { measure(); req(); });
    measure();
    update();
  }

  function showEverything() {
    root.classList.remove('rv-on');
    $$('.tl-item').forEach(function (el) { el.classList.add('is-in'); });
    var tl = document.querySelector('.tl');
    if (tl) tl.style.setProperty('--p', 1);
    $$('[data-grow]').forEach(function (el) { el.textContent = fmt(+el.getAttribute('data-grow'), el); });
  }

  initTabs();
  if (!animate) { showEverything(); return; }
  initReveal();
  initCounters();
  initTimeline();
})();
