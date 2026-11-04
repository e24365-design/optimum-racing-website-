/* Optimum Racing: The Car + Competitions page behaviour.
   Load AFTER js/main.js. Every block checks that its elements exist. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------
     CAR PAGE 1: build phases come in one by one as you scroll
     --------------------------------------------------------------- */
  var phases = $$('.phase');
  if (phases.length) {
    if ('IntersectionObserver' in window && !reduce) {
      var pio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); pio.unobserve(e.target); }
        });
      }, { threshold: 0.3, rootMargin: '0px 0px -8% 0px' });
      phases.forEach(function (p) { pio.observe(p); });
    } else {
      phases.forEach(function (p) { p.classList.add('in'); });
    }
  }

  /* ---------------------------------------------------------------
     CAR PAGE 2: visible dots on the car, popup opens on click
     --------------------------------------------------------------- */
  var stage = $('.car-stage');
  var pts = $$('.car-stage .pt');
  if (stage && pts.length) {
    var feats = [
      { t: 'Rear Wing & Powertrain', d: 'High-downforce multi-element rear wing paired with an optimised powertrain map for rapid acceleration out of slow corners.', s: [['Downforce', 88], ['Drag', 34], ['Cooling', 72]] },
      { t: 'Cockpit & Telemetry', d: 'Ergonomic seat with a digital dash showing live sensor data, gear indicator and telemetry streamed to the pit lane.', s: [['Sensors', 94], ['Latency', 18], ['Comfort', 76]] },
      { t: 'Suspension & Braking', d: 'Double-wishbone pull-rod suspension with floating disc brakes and custom aluminium uprights for maximum mechanical grip.', s: [['Grip', 91], ['Stiffness', 82], ['Weight', 40]] },
      { t: 'Front Wing & Aerodynamics', d: 'Dual-element carbon composite front wing generating front-axle downforce and balancing high-speed cornering stability.', s: [['Downforce', 85], ['Efficiency', 79], ['Balance', 90]] }
    ];

    var pop = document.createElement('div');
    pop.className = 'pt-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-live', 'polite');
    pop.innerHTML = '<button type="button" class="pt-close" aria-label="Close">✕</button>' +
      '<div class="idx"></div><h3></h3><p></p><div class="mini"></div>';
    stage.appendChild(pop);
    var openIdx = -1;

    function place(btn) {
      var s = stage.getBoundingClientRect(), b = btn.getBoundingClientRect();
      var cx = b.left + b.width / 2 - s.left, cy = b.top + b.height / 2 - s.top;
      var w = pop.offsetWidth, h = pop.offsetHeight;
      var left = Math.max(8, Math.min(cx - w / 2, s.width - w - 8));
      var below = cy < s.height / 2;                 // dot in top half → popup underneath
      var top = below ? cy + 36 : cy - h - 36;
      top = Math.max(8, Math.min(top, s.height - h - 8));
      pop.style.left = left + 'px';
      pop.style.top = top + 'px';
      pop.style.setProperty('--ax', Math.max(18, Math.min(cx - left, w - 18)) + 'px');
      pop.classList.toggle('below', below);
      pop.classList.toggle('above', !below);
    }

    function openPt(i) {
      var f = feats[i];
      pts.forEach(function (p, k) { p.setAttribute('aria-expanded', k === i ? 'true' : 'false'); });
      $('.idx', pop).textContent = 'POINT 0' + (i + 1) + ' / 04';
      $('h3', pop).textContent = f.t;
      $('p', pop).textContent = f.d;
      var m = $('.mini', pop); m.innerHTML = '';
      f.s.forEach(function (s) {
        var r = document.createElement('div');
        r.className = 'row';
        r.innerHTML = '<span></span><div class="bar"><i></i></div><b></b>';
        r.children[0].textContent = s[0]; r.children[2].textContent = s[1];
        m.appendChild(r);
      });
      place(pts[i]);
      pop.classList.add('open');
      openIdx = i;
      setTimeout(function () { $$('.bar i', pop).forEach(function (b, k) { b.style.width = f.s[k][1] + '%'; }); }, 80);
    }
    function closePt() {
      pop.classList.remove('open');
      pts.forEach(function (p) { p.setAttribute('aria-expanded', 'false'); });
      openIdx = -1;
    }

    pts.forEach(function (p, i) {
      p.setAttribute('aria-expanded', 'false');
      p.addEventListener('click', function (e) {
        e.stopPropagation();
        if (openIdx === i) closePt(); else openPt(i);
      });
    });
    $('.pt-close', pop).addEventListener('click', function (e) { e.stopPropagation(); closePt(); });
    pop.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', closePt);
    addEventListener('keydown', function (e) { if (e.key === 'Escape') closePt(); });
    addEventListener('resize', function () { if (openIdx > -1) place(pts[openIdx]); });
  }

  /* ---------------------------------------------------------------
     COMPETITIONS: mini car spins when the page opens
     --------------------------------------------------------------- */
  var car = $('.clock-car');
  if (car) {
    function spinCar() {
      if (reduce) return;
      car.classList.remove('spin'); void car.offsetWidth; car.classList.add('spin');
    }
    spinCar();
    car.addEventListener('click', spinCar);
    car.addEventListener('animationend', function (e) {
      if (e.animationName === 'cc-spin') car.classList.remove('spin');   // then it floats gently
    });
  }

  /* ---------------------------------------------------------------
     COMPETITIONS: ticking digital clock (days / hours / minutes / seconds)
     --------------------------------------------------------------- */
  var clock = $('.digital-clock');
  if (clock) {
    var target = new Date(clock.getAttribute('data-deadline')).getTime();
    var endT = target + 4 * 864e5;
    var units = {};
    $$('.unit', clock).forEach(function (u) { units[u.getAttribute('data-unit')] = $$('.dg', u); });
    var live = $('.live-btn'), status = $('.clock-status span');
    var last = {};

    function setUnit(name, value) {
      var cells = units[name]; if (!cells) return;
      var s = String(value);
      while (s.length < cells.length) s = '0' + s;
      if (s.length > cells.length) s = s.slice(-cells.length);
      s.split('').forEach(function (ch, i) {
        var key = name + i;
        if (last[key] !== ch) {
          cells[i].textContent = ch;
          if (last[key] !== undefined && !reduce) {
            cells[i].classList.remove('flip'); void cells[i].offsetWidth; cells[i].classList.add('flip');
          }
          last[key] = ch;
        }
      });
    }
    function tick() {
      var now = Date.now(), dist = target - now;
      if (dist <= 0) {
        setUnit('days', 0); setUnit('hours', 0); setUnit('minutes', 0); setUnit('seconds', 0);
        if (now < endT) {
          if (live) { live.classList.add('is-live'); if (live.lastChild) live.lastChild.textContent = ' LIVE NOW'; }
          if (status) status.textContent = 'Race weekend is live';
        } else if (status) status.textContent = 'Event finished';
        return;
      }
      setUnit('days', Math.floor(dist / 864e5));
      setUnit('hours', Math.floor(dist % 864e5 / 36e5));
      setUnit('minutes', Math.floor(dist % 36e5 / 6e4));
      setUnit('seconds', Math.floor(dist % 6e4 / 1e3));
    }
    tick();
    setInterval(tick, 1000);
  }
})();
