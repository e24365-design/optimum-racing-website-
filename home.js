/* Optimum Racing: Home page extras. Load AFTER js/main.js (which handles the rotating word,
   car tilt, count-up numbers and .reveal). Every block checks its elements exist. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hero = $('.hero');
  if (!hero) return;

  /* Headline: wrap each line so it can rise out of a mask (text is kept, only the markup changes). */
  var h1 = $('h1', hero);
  if (h1 && !reduce) {
    /* move the existing nodes (don't rebuild them) so main.js's rotating word keeps working */
    var lines = [document.createElement('span')];
    while (h1.firstChild) {
      var n = h1.firstChild;
      if (n.nodeName === 'BR') { h1.removeChild(n); lines.push(document.createElement('span')); }
      else lines[lines.length - 1].appendChild(n);
    }
    lines.forEach(function (inner) {
      var ln = document.createElement('span'); ln.className = 'ln';
      ln.appendChild(inner); h1.appendChild(ln);
    });
  }

  /* Pointer glow behind the hero */
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine && !reduce) {
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      hero.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
  }

  /* Gentle parallax as you scroll away from the hero */
  if (!reduce) {
    var ticking = false;
    function onScroll() {
      ticking = false;
      var y = Math.min(window.scrollY, 700);
      hero.style.setProperty('--sy', y);
    }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
  }

  /* Staggered cards and tiles */
  $$('.link-list .reveal').forEach(function (li, i) { li.style.setProperty('--d', (i * 0.12) + 's'); });
  $$('.stats .stat').forEach(function (s, i) { s.style.setProperty('--k', i); });

  /* Marquee draws in, stats underline draws, intro heading bar draws */
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add(e.target.classList.contains('marquee') ? 'hm-in' : 'in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.25 });
    $$('.marquee, .intro h2').forEach(function (el) { io.observe(el); });
  } else {
    $$('.marquee').forEach(function (el) { el.classList.add('hm-in'); });
    $$('.intro h2').forEach(function (el) { el.classList.add('in'); });
  }
})();
