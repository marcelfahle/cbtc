// Homepage scroll effects: reveals, nav glass, the day rail and the sun on the camp-day arc.
// Everything here is decoration; the page reads the same without it.
(function () {
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal blocks once as they enter the viewport
  var rv = document.querySelectorAll('.rv');
  if (!reduced && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  var nav = document.querySelector('.nav');
  var rail = document.querySelector('.dayrail');
  var railSun = rail && rail.querySelector('.sun');
  var railTime = rail && rail.querySelector('.time');
  var stops = [].slice.call(document.querySelectorAll('[data-time]'));
  var arc = document.querySelector('.arc');
  var path = document.getElementById('sunpath');
  var sun = arc && arc.querySelector('.p-sun');
  var len = path && path.getTotalLength ? path.getTotalLength() : 0;

  function minutes(t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; }
  function clock(m) { m = Math.round(m / 5) * 5; var h = Math.floor(m / 60), n = m % 60; return (h < 10 ? '0' : '') + h + ':' + (n < 10 ? '0' : '') + n; }

  var ticking = false;
  function update() {
    ticking = false;
    var y = scrollY, vh = innerHeight;
    if (nav) nav.classList.toggle('scrolled', y > 40);

    if (rail && stops.length) {
      // Time of day: interpolate between the data-time of the sections around a reading line that
      // slides from the top of the viewport (page top = sunrise) to the bottom (page end = night)
      var max = document.documentElement.scrollHeight - vh;
      var progress = max > 0 ? Math.min(1, y / max) : 0;
      var mid = y + vh * progress, tops = stops.map(function (s) { return s.getBoundingClientRect().top + y; });
      var i = 0; while (i < tops.length - 1 && tops[i + 1] <= mid) i++;
      var a = minutes(stops[i].dataset.time), b = i < stops.length - 1 ? minutes(stops[i + 1].dataset.time) : a;
      var span = i < stops.length - 1 ? tops[i + 1] - tops[i] : 1;
      var t = Math.min(1, Math.max(0, (mid - tops[i]) / span));
      var now = a + (b - a) * t;
      var h = rail.clientHeight;
      railSun.style.transform = railTime.style.transform = 'translateY(' + (progress * h).toFixed(1) + 'px)';
      railTime.style.transform += ' translateY(-50%)';
      railTime.textContent = clock(now);
      rail.classList.toggle('dusk', now >= 17 * 60 && now < 19 * 60);
      rail.classList.toggle('night', now >= 19 * 60);
      rail.classList.add('on');
    }

    if (sun && len) {
      // Sun crosses the arc while the camp-day section scrolls through the viewport
      var r = arc.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (vh * 0.9 - r.top) / (vh * 0.9)));
      var pt = path.getPointAtLength(0.08 * len + p * 0.84 * len);
      sun.setAttribute('cx', pt.x.toFixed(1)); sun.setAttribute('cy', pt.y.toFixed(1));
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();
})();
