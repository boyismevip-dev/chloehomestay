(function () {
  'use strict';

  // Header: đổ bóng khi cuộn
  var header = document.querySelector('[data-header]');
  function onScroll() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Menu mobile
  var btn = document.querySelector('[data-menu]');
  var nav = document.getElementById('nav');
  function setMenu(open) {
    if (!btn || !nav) return;
    nav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
  }
  if (btn && nav) {
    btn.addEventListener('click', function () { setMenu(btn.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  // Hiệu ứng xuất hiện khi cuộn
  var items = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // Bộ lọc hạng phòng
  var grid = document.querySelector('[data-room-grid]');
  if (grid) {
    var chips = document.querySelectorAll('[data-filter]');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-filter');
        chips.forEach(function (c) {
          var on = c === chip;
          c.classList.toggle('is-on', on);
          c.setAttribute('aria-pressed', String(on));
        });
        grid.querySelectorAll('.room-card').forEach(function (card) {
          var show = f === 'all'
            || (f === 'balcony' && card.dataset.balcony === '1')
            || (f === 'window' && card.dataset.window === '1')
            || (f === 'budget' && Number(card.dataset.price) < 600000);
          card.classList.toggle('is-hidden', !show);
        });
      });
    });
  }

  // Thư viện ảnh + lightbox
  var gallery = document.querySelector('[data-gallery]');
  var lb = document.querySelector('[data-lightbox]');
  if (gallery && lb) {
    var thumbs = Array.prototype.slice.call(gallery.querySelectorAll('button'));
    var sources = thumbs.map(function (b) {
      var img = b.querySelector('img');
      return { src: img.getAttribute('data-full') || img.getAttribute('src'), alt: img.alt };
    });
    var imgEl = lb.querySelector('.lb-img');
    var count = lb.querySelector('.lb-count');
    var cur = 0, opener = null;

    function show(i) {
      cur = (i + sources.length) % sources.length;
      imgEl.src = sources[cur].src;
      imgEl.alt = sources[cur].alt;
      count.textContent = (cur + 1) + ' / ' + sources.length;
    }
    function open(i, from) {
      opener = from; show(i); lb.hidden = false;
      document.body.style.overflow = 'hidden';
      lb.querySelector('.lb-close').focus();
    }
    function close() {
      lb.hidden = true; document.body.style.overflow = '';
      if (opener) opener.focus();
    }
    thumbs.forEach(function (b, i) { b.addEventListener('click', function () { open(i, b); }); });
    lb.addEventListener('click', function (e) {
      var a = e.target.closest('[data-lb]');
      if (a) {
        var k = a.getAttribute('data-lb');
        if (k === 'close') close(); else if (k === 'prev') show(cur - 1); else show(cur + 1);
      } else if (e.target === lb) close();
    });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(cur - 1);
      else if (e.key === 'ArrowRight') show(cur + 1);
    });
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }
})();
