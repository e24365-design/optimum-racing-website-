/* Optimum Racing – shared behaviour. Every block checks that its elements exist,
   so one file safely serves all pages. Content is real HTML; JS only adds life. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---- Header: shrink on scroll, progress bar, mobile menu, back-to-top ---- */
  var wrap = $('.site-header-wrap'), bar = $('.progress'), top = $('.to-top');
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    if (wrap) wrap.classList.toggle('scrolled', y > 12);
    if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
    if (top) top.classList.toggle('show', y > 700);
    updateTimeline();
  }
  addEventListener('scroll', onScroll, { passive: true });
  if (top) top.addEventListener('click', function () { scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  var toggle = $('.menu-toggle');
  if (toggle && wrap) {
    toggle.addEventListener('click', function () {
      var open = wrap.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open);
    });
    $$('.nav-list a').forEach(function (a) { a.addEventListener('click', function () { wrap.classList.remove('menu-open'); toggle.setAttribute('aria-expanded', 'false'); }); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') { wrap.classList.remove('menu-open'); toggle.setAttribute('aria-expanded', 'false'); } });
  }

  /* ---- Reveal on scroll ---- */
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el, i) { if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', (i % 4) * 0.07 + 's'); io.observe(el); });
  } else { revealEls.forEach(function (el) { el.classList.add('in'); }); }

  /* ---- Count-up numbers ---- */
  function countUp(el) {
    var end = parseFloat(el.dataset.count), dec = +(el.dataset.decimals || 0), dur = reduce ? 1 : 1600, t0 = null;
    var fmt = function (v) { return dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US'); };
    function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(end * e); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  var counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } }); }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---- Generic "animate when visible" (bars, gauges) ---- */
  function whenVisible(els, fn) {
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(fn); return; }
    var o = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { fn(e.target); o.unobserve(e.target); } }); }, { threshold: 0.4 });
    els.forEach(function (el) { o.observe(el); });
  }
  whenVisible($$('.gauge'), function (g) {
    var v = +g.dataset.value, max = +g.dataset.max, num = $('.n', g), circ = 289;
    $('.val', g).style.strokeDashoffset = circ * (1 - Math.min(1, v / max));
    var dec = +(g.dataset.decimals || 0), t0 = null;
    (function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1600), e = 1 - Math.pow(1 - p, 3); num.textContent = (v * e).toFixed(dec); if (p < 1) requestAnimationFrame(step); })(performance.now());
  });

  /* ---- Home: rotating word, parallax car, tilt ---- */
  var word = $('[data-rotate]');
  if (word) {
    var words = word.dataset.rotate.split(','), wi = 0, ci = words[0].length, del = false, hold = 18;
    word.textContent = words[0];
    if (!reduce) setInterval(function () {
      if (hold > 0) { hold--; return; }
      if (del) { ci--; if (ci <= 0) { del = false; wi = (wi + 1) % words.length; ci = 0; } }
      else { ci++; if (ci >= words[wi].length) { ci = words[wi].length; del = true; hold = 18; } }
      word.textContent = words[wi].slice(0, ci) || '\u00a0';
    }, 90);
  }
  var hero = $('.hero'), par = $('.car-par');
  if (hero && par && fine && !reduce) {
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      par.style.transform = 'translate(' + x * 26 + 'px,' + y * 14 + 'px) rotate(' + x * 2 + 'deg)';
    });
    hero.addEventListener('mouseleave', function () { par.style.transform = ''; });
  }
  if (fine && !reduce) {
    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = 'perspective(700px) rotateY(' + x * 8 + 'deg) rotateX(' + -y * 8 + 'deg) translateY(-4px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---- Timeline fill ---- */
  var tl = $('.timeline'), tlFill = tl && $('.fill', tl);
  function updateTimeline() {
    if (!tl) return;
    var r = tl.getBoundingClientRect(), p = (innerHeight * 0.6 - r.top) / r.height;
    p = Math.max(0, Math.min(1, p));
    if (tlFill) tlFill.style.height = 'calc(' + (p * 100) + '% - 1rem)';
    $$('li', tl).forEach(function (li) { li.classList.toggle('in', li.getBoundingClientRect().top < innerHeight * 0.62); });
  }
  onScroll();

  /* ---- Tabs (generic): [role=tablist] > [role=tab][aria-controls] ---- */
  function tabs(list, onShow) {
    var tabEls = $$('[role="tab"]', list);
    function show(t) {
      tabEls.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; var p = document.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !on; });
      var p = document.getElementById(t.getAttribute('aria-controls')); if (onShow) onShow(t, p);
    }
    tabEls.forEach(function (t, i) {
      t.addEventListener('click', function () { show(t); });
      t.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (n) { e.preventDefault(); var nt = tabEls[(i + n + tabEls.length) % tabEls.length]; nt.focus(); show(nt); }
      });
    });
    var first = tabEls.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabEls[0];
    if (first) show(first);
  }
  $$('[role="tablist"]').forEach(function (l) {
    tabs(l, function (t, panel) {
      if (!panel) return;
      $$('.score .bar i', panel).forEach(function (b) { b.style.width = '0'; setTimeout(function () { b.style.width = b.dataset.w + '%'; }, 60); });
    });
  });

  /* ---- Team: filter + search + profile modal ---- */
  var grid = $('[data-roster]');
  if (grid) {
    var cards = $$('.member', grid), fBtns = $$('[data-filter]'), q = $('#member-search'), empty = $('.empty'), count = $('#member-count');
    var dept = 'all';
    function applyFilter() {
      var term = q ? q.value.trim().toLowerCase() : '', shown = 0;
      cards.forEach(function (c) {
        var ok = (dept === 'all' || c.dataset.dept === dept) && (!term || (c.dataset.name + ' ' + c.dataset.role + ' ' + c.dataset.dept).toLowerCase().indexOf(term) > -1);
        c.classList.toggle('hide', !ok); if (ok) shown++;
      });
      if (empty) empty.hidden = shown > 0;
      if (count) count.textContent = shown + (shown === 1 ? ' member' : ' members');
    }
    fBtns.forEach(function (b) { b.addEventListener('click', function () { dept = b.dataset.filter; fBtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); applyFilter(); }); });
    if (q) q.addEventListener('input', applyFilter);
    applyFilter();
  }
  var modal = $('.modal');
  if (modal) {
    var lastFocus = null;
    var mImg = $('img', modal), mName = $('.m-name', modal), mRole = $('.m-role', modal), mMeta = $('.m-meta', modal), mBio = $('.m-bio', modal), mSkills = $('.skills', modal), mFun = $('.m-fun', modal), mMail = $('.m-mail', modal);
    function openProfile(c) {
      lastFocus = c;
      mImg.src = c.dataset.img; mImg.alt = c.dataset.name;
      mName.textContent = c.dataset.name; mRole.textContent = c.dataset.role;
      mMeta.textContent = c.dataset.dept + ' · ' + c.dataset.year;
      mBio.textContent = c.dataset.bio; mFun.textContent = c.dataset.fun;
      mMail.href = 'mailto:' + c.dataset.email;
      mSkills.innerHTML = '';
      (c.dataset.skills || '').split(',').forEach(function (s) {
        var p = s.split(':'); if (p.length < 2) return;
        var row = document.createElement('div'); row.className = 'skill';
        row.innerHTML = '<span></span><div class="bar"><i></i></div><b></b>';
        row.children[0].textContent = p[0]; row.children[2].textContent = p[1] + '%';
        mSkills.appendChild(row);
        setTimeout(function () { row.querySelector('i').style.width = p[1] + '%'; }, 120);
      });
      modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
      $('.modal-close', modal).focus();
    }
    function closeProfile() { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
    $$('.member').forEach(function (c) { c.addEventListener('click', function () { openProfile(c); }); });
    $('.modal-close', modal).addEventListener('click', closeProfile);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeProfile(); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('open')) closeProfile(); });
  }

  /* ---- Car page: build phases, hotspots, launch game ---- */
  var phaseNav = $('.phase-nav');
  if (phaseNav) {
    var pbtns = $$('button', phaseNav), pimg = $('#phase-img'), ptxt = $('#phase-txt'), dots = $$('.progress-dots i');
    var phases = pbtns.map(function (b) { return { img: b.dataset.img, step: b.dataset.step, title: b.dataset.title, text: b.dataset.text }; });
    var pi = 0, auto;
    function showPhase(i, user) {
      pi = i; pbtns.forEach(function (b, k) { b.setAttribute('aria-selected', k === i); });
      var p = phases[i]; pimg.src = p.img; pimg.alt = p.title;
      $('.step', ptxt).textContent = p.step; $('h3', ptxt).textContent = p.title; $('p', ptxt).textContent = p.text;
      dots.forEach(function (d, k) { d.classList.toggle('on', k <= i); });
      ptxt.parentNode.style.animation = 'none'; void ptxt.parentNode.offsetWidth; ptxt.parentNode.style.animation = '';
      if (user) clearInterval(auto);
    }
    pbtns.forEach(function (b, i) { b.addEventListener('click', function () { showPhase(i, true); }); });
    if (!reduce) auto = setInterval(function () { showPhase((pi + 1) % phases.length); }, 6000);
    showPhase(0);
  }
  var hs = $$('.hotspot');
  if (hs.length) {
    var feats = [
      { t: 'Rear Wing & Powertrain', d: 'High-downforce multi-element rear wing paired with an optimised powertrain map for rapid acceleration out of slow corners.', s: [['Downforce', 88], ['Drag', 34], ['Cooling', 72]] },
      { t: 'Cockpit & Telemetry', d: 'Ergonomic seat with a digital dash showing live sensor data, gear indicator and telemetry streamed to the pit lane.', s: [['Sensors', 94], ['Latency', 18], ['Comfort', 76]] },
      { t: 'Suspension & Braking', d: 'Double-wishbone pull-rod suspension with floating disc brakes and custom aluminium uprights for maximum mechanical grip.', s: [['Grip', 91], ['Stiffness', 82], ['Weight', 40]] },
      { t: 'Front Wing & Aerodynamics', d: 'Dual-element carbon composite front wing generating front-axle downforce and balancing high-speed cornering stability.', s: [['Downforce', 85], ['Efficiency', 79], ['Balance', 90]] }
    ];
    var box = $('#feature-box'), fi = 0;
    function showFeat(i) {
      hs.forEach(function (h, k) { h.setAttribute('aria-pressed', k === i); });
      box.classList.add('fade');
      setTimeout(function () {
        $('.idx', box).textContent = 'POINT 0' + (i + 1) + ' / 04';
        $('h3', box).textContent = feats[i].t; $('p', box).textContent = feats[i].d;
        var m = $('.mini', box); m.innerHTML = '';
        feats[i].s.forEach(function (s) {
          var r = document.createElement('div'); r.className = 'row'; r.innerHTML = '<span></span><div class="bar"><i></i></div><b></b>';
          r.children[0].textContent = s[0]; r.children[2].textContent = s[1]; m.appendChild(r);
          setTimeout(function () { r.querySelector('i').style.width = s[1] + '%'; }, 60);
        });
        box.classList.remove('fade');
      }, 220);
      fi = i;
    }
    hs.forEach(function (h, i) { h.addEventListener('click', function () { showFeat(i); clearInterval(cycle); }); });
    var cycle = reduce ? null : setInterval(function () { showFeat((fi + 1) % hs.length); }, 5500);
    showFeat(0);
  }

  var game = $('.game');
  if (game) {
    var lights = $$('.lights i', game), wrapL = $('.lights', game), out = $('.readout', game), btn = $('#game-btn'), list = $('.leader', game);
    var state = 'idle', t0 = 0, timers = [], best = parseFloat(store('or-best')) || null;
    var bots = [['M. Fernando', 0.231], ['A. Perera', 0.264], ['T. Silva', 0.297], ['K. Bandara', 0.331], ['D. Jayasinghe', 0.378]];
    function render(you) {
      var rows = bots.slice(); if (best) rows.push(['You (best)', best]);
      rows.sort(function (a, b) { return a[1] - b[1]; });
      list.innerHTML = '';
      rows.slice(0, 6).forEach(function (r, i) {
        var li = document.createElement('li'); if (r[0].indexOf('You') === 0) li.className = 'you';
        li.innerHTML = '<b></b><span></span><span></span>'; li.children[0].textContent = i + 1; li.children[1].textContent = r[0]; li.children[2].textContent = r[1].toFixed(3) + ' s';
        list.appendChild(li);
      });
    }
    function clear() { timers.forEach(clearTimeout); timers = []; }
    function reset() { lights.forEach(function (l) { l.classList.remove('on'); }); wrapL.classList.remove('go'); }
    function start() {
      clear(); reset(); state = 'arming'; out.innerHTML = '<small>Get ready…</small>—'; btn.textContent = 'HOLD… THEN TAP ON GREEN';
      lights.forEach(function (l, i) { timers.push(setTimeout(function () { l.classList.add('on'); }, 600 * (i + 1))); });
      var wait = 600 * lights.length + 800 + Math.random() * 2200;
      timers.push(setTimeout(function () { reset(); wrapL.classList.add('go'); state = 'go'; t0 = performance.now(); out.innerHTML = '<small>GO!</small>…'; }, wait));
    }
    function press() {
      if (state === 'idle' || state === 'done') return start();
      if (state === 'arming') { clear(); reset(); state = 'done'; out.innerHTML = '<small>Jump start</small>FALSE START'; btn.textContent = 'TRY AGAIN'; return; }
      if (state === 'go') {
        var t = (performance.now() - t0) / 1000; state = 'done';
        out.innerHTML = '<small>Reaction time</small>' + t.toFixed(3) + ' s';
        if (!best || t < best) { best = t; store('or-best', String(t)); toast('New personal best: ' + t.toFixed(3) + ' s'); }
        btn.textContent = 'RACE AGAIN'; render();
      }
    }
    btn.addEventListener('click', press);
    addEventListener('keydown', function (e) { if (e.code === 'Space' && game.contains(document.activeElement) && document.activeElement !== btn) { e.preventDefault(); press(); } });
    render();
  }

  /* ---- Competition: countdown + live state ---- */
  var cd = $('[data-target]');
  if (cd) {
    var target = new Date(cd.dataset.target).getTime(), endT = target + 4 * 864e5;
    var els = { d: $('#days'), h: $('#hours'), m: $('#mins'), s: $('#secs') }, live = $('.live-btn'), prev = {};
    function set(k, v) { var s = String(v).padStart(2, '0'); if (prev[k] !== s) { els[k].textContent = s; els[k].classList.remove('tick'); void els[k].offsetWidth; els[k].classList.add('tick'); prev[k] = s; } }
    function tickCd() {
      var now = Date.now(), dist = target - now;
      if (dist <= 0) { set('d', 0); set('h', 0); set('m', 0); set('s', 0); if (now < endT && live) { live.classList.add('is-live'); live.lastChild.textContent = ' LIVE NOW'; } return; }
      set('d', Math.floor(dist / 864e5)); set('h', Math.floor(dist % 864e5 / 36e5)); set('m', Math.floor(dist % 36e5 / 6e4)); set('s', Math.floor(dist % 6e4 / 1e3));
    }
    tickCd(); setInterval(tickCd, 1000);
  }

  /* ---- Lightbox ---- */
  var lb = $('.lightbox');
  if (lb) {
    var shots = $$('.gallery button'), li = 0, limg = $('img', lb), lcap = $('figcaption', lb);
    function lshow(i) { li = (i + shots.length) % shots.length; var im = $('img', shots[li]); limg.src = im.src; limg.alt = im.alt; lcap.textContent = im.alt; }
    function lopen(i) { lshow(i); lb.classList.add('open'); document.body.style.overflow = 'hidden'; $('.lb-close', lb).focus(); }
    function lclose() { lb.classList.remove('open'); document.body.style.overflow = ''; shots[li].focus(); }
    shots.forEach(function (b, i) { b.addEventListener('click', function () { lopen(i); }); });
    $('.lb-close', lb).addEventListener('click', lclose);
    $('.lb-prev', lb).addEventListener('click', function () { lshow(li - 1); });
    $('.lb-next', lb).addEventListener('click', function () { lshow(li + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lclose(); });
    addEventListener('keydown', function (e) { if (!lb.classList.contains('open')) return; if (e.key === 'Escape') lclose(); if (e.key === 'ArrowLeft') lshow(li - 1); if (e.key === 'ArrowRight') lshow(li + 1); });
  }

  /* ---- Toast ---- */
  var toastEl, toastT;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 3800);
  }

  /* ---- Contact form: validation, counter, topic chips, opens email app ---- */
  var form = $('.contact-form');
  if (form) {
    var note = $('.form-note', form), msg = $('#message'), cnt = $('.counter', form), subj = 'General question';
    $$('.topic-chips .chip', form).forEach(function (c) {
      c.addEventListener('click', function () { subj = c.dataset.topic; $$('.topic-chips .chip', form).forEach(function (x) { x.setAttribute('aria-pressed', x === c); }); });
    });
    if (msg && cnt) msg.addEventListener('input', function () { cnt.textContent = msg.value.length + ' / 600'; });
    function bad(input, text) { var f = input.closest('.field'); f.classList.add('invalid'); $('.err', f).textContent = text; }
    function ok(input) { var f = input.closest('.field'); f.classList.remove('invalid'); $('.err', f).textContent = ''; }
    $$('input, textarea', form).forEach(function (i) { i.addEventListener('input', function () { ok(i); }); });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var n = $('#name'), em = $('#email'), valid = true;
      if (n.value.trim().length < 2) { bad(n, 'Please enter your name.'); valid = false; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value.trim())) { bad(em, 'Please enter a valid email address.'); valid = false; }
      if (msg.value.trim().length < 10) { bad(msg, 'Tell us a little more (at least 10 characters).'); valid = false; }
      if (!valid) { var first = $('.invalid input, .invalid textarea', form); if (first) first.focus(); return; }
      var to = form.dataset.mailto, body = msg.value.trim() + '\n\nFrom: ' + n.value.trim() + ' (' + em.value.trim() + ')';
      window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent('[' + subj + '] ' + n.value.trim()) + '&body=' + encodeURIComponent(body);
      note.textContent = 'Your email app should open now. If it does not, write to us at ' + to + '.';
      toast('Thanks ' + n.value.trim().split(' ')[0] + '! Your message is ready in your email app.');
    });
  }
})();
