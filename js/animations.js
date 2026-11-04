/* Optimum Racing: Home page animations (works with css/animations.css) */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('anim-ready');

  /* Replay the car entrance when the page is restored from the back/forward cache */
  window.addEventListener('pageshow', function (e) {
    var wrap = document.querySelector('.hero-stage .car-wrap');
    if (e.persisted && wrap) {
      wrap.style.animation = 'none';
      void wrap.offsetWidth;
      wrap.style.animation = '';
    }
  });

  if (!('IntersectionObserver' in window)) {
    root.classList.remove('anim-ready'); /* old browsers: just show everything */
    return;
  }

  /* Stats: number each item so they enter one after another, then start when visible */
  var stats = document.querySelector('.stats');
  if (stats) {
    var items = stats.querySelectorAll('.stat');
    for (var i = 0; i < items.length; i++) items[i].style.setProperty('--i', i);
    new IntersectionObserver(function (entries, obs) {
      if (entries[0].isIntersecting) {
        stats.classList.add('stats-go');
        obs.disconnect();
      }
    }, { threshold: 0.35 }).observe(stats);
  }

  /* Mirrored corner car: appears when scrolling gets near the intro paragraph */
  var target = document.querySelector('.intro-text p') || document.querySelector('.intro');
  if (target) {
    var car = document.createElement('img');
    car.className = 'corner-car';
    car.src = 'images/car.webp';
    car.alt = '';
    car.width = 568;
    car.height = 215;
    car.decoding = 'async';
    car.setAttribute('aria-hidden', 'true');
    document.body.appendChild(car);

    new IntersectionObserver(function (entries, obs) {
      if (entries[0].isIntersecting) {
        car.classList.add('is-in');
        obs.disconnect();
      }
    }, { rootMargin: '0px 0px 25% 0px' }).observe(target); /* 25% = "near", before it is fully on screen */
  }
})();
