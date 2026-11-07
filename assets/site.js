// getkancil.app, every page (#267 pages 7 and 8). Each part runs only if its element is on the page.
// Everything that moves in the app moves here the same way, and only when it can be seen:
//   the live Kancil (logo, hero, closing): arrives with one move, then breathes and blinks
//     (the rig's idle loop), waves now and then, cheers when tapped (KancilBuddy.tsx);
//   trail nodes go green with a tick as the gold trail reaches them; the tree sways, the
//     side-on Kancil breathes and hops, the river croc blinks and naps (RiverNode.tsx), the
//     chest pops; the forest friend breathes, blinks and cheers (FriendAvatar.tsx);
//   coins fly in the screen-time card; one real Dengar & Pilih question; the fireflies.
// Reduce Motion: nothing travels. Kancil and friends hold still, the fireflies stay put and
// glow; colour and ticks still change.
(function () {
  var mq = matchMedia('(prefers-reduced-motion: reduce)');
  var still = mq.matches;
  var html = document.documentElement;
  function setStill(v) { still = v; html.classList.toggle('alive', !v); }
  setStill(still);
  mq.addEventListener && mq.addEventListener('change', function (e) { setStill(e.matches); });
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function onScreen(el, cb, threshold) {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting); }); }, { threshold: threshold || 0 }).observe(el);
  }
  function once(el, cb, threshold) {
    var done = false;
    onScreen(el, function (v) { if (v && !done) { done = true; cb(); } }, threshold);
  }

  // ---------- hero video ----------
  (function () {
    var v = document.getElementById('hero-vid'), b = document.getElementById('hero-play'), shot = v && v.closest('.shot');
    if (!v || !b) return;
    b.addEventListener('click', function () { v.controls = true; v.play(); });
    v.addEventListener('play', function () { shot.classList.add('playing'); });
    v.addEventListener('ended', function () { v.controls = false; v.load(); shot.classList.remove('playing'); });
  })();

  // ---------- the coin sticker pops in, and again when tapped ----------
  (function () {
    var c = document.querySelector('.shot .s2');
    if (!c) return;
    function pop() { if (still) return; c.classList.remove('coin-pop'); void c.offsetWidth; c.classList.add('coin-pop'); }
    c.style.pointerEvents = 'auto'; c.style.cursor = 'pointer';
    c.addEventListener('click', pop);
    addEventListener('load', function () { setTimeout(pop, 600); });
  })();

  // ---------- the trail: path, gold fill, nodes reached ----------
  (function () {
    var t = document.getElementById('trail');
    if (!t) return;
    var svg = t.querySelector('.path'), base = svg.querySelector('.base'), done = svg.querySelector('.done');
    var nodes = [].slice.call(t.querySelectorAll('.node')), sub = t.querySelector('.sub');
    function draw() {
      var o = t.getBoundingClientRect();
      var pts = nodes.map(function (n) { var r = n.getBoundingClientRect(); return [r.left - o.left + r.width / 2, r.top - o.top + r.height / 2]; });
      // start below the intro text, so the dots never run through it
      var top = sub ? sub.getBoundingClientRect().bottom - o.top + 24 : pts[0][1] - 160;
      var start = [pts[0][0], Math.max(top, Math.min(pts[0][1] - 60, pts[0][1] - 160))];
      var d = 'M' + start[0] + ' ' + start[1], prev = start;
      pts.forEach(function (p, i) {
        var my = (prev[1] + p[1]) / 2, sw = (innerWidth > 860 ? 160 : 30) * (i % 2 ? -1 : 1);
        d += ' C' + (prev[0] + sw) + ' ' + my + ' ' + (p[0] - sw) + ' ' + my + ' ' + p[0] + ' ' + p[1];
        prev = p;
      });
      base.setAttribute('d', d); done.setAttribute('d', d);
      scroll();
    }
    function scroll() {
      var o = t.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight * 0.6 - o.top) / o.height));
      done.style.clipPath = 'inset(0 0 ' + (100 - p * 100) + '% 0)';
      var reach = o.top + o.height * p;
      nodes.forEach(function (n) {
        var r = n.getBoundingClientRect();
        if (!n.classList.contains('done') && r.top + r.height / 2 <= reach) { n.classList.add('done'); react(n); }
      });
    }
    addEventListener('resize', draw);
    addEventListener('scroll', scroll, { passive: true });
    addEventListener('load', draw);
    draw();
  })();

  // what each node's character does when the trail reaches it (or when tapped)
  function react(n) {
    if (still) return;
    var k = n.querySelector('.kan'), ch = n.querySelector('.chest'), tr = n.querySelector('.tree');
    if (k) { k.classList.remove('hop'); void k.offsetWidth; k.classList.add('hop'); }
    if (ch) {
      ch.classList.remove('pop'); void ch.offsetWidth; ch.classList.add('pop');
      for (var i = 0; i < 7; i++) {
        var s = document.createElement('i'); s.className = 'spark';
        var a = -Math.PI / 2 + rnd(-1.3, 1.3), d = rnd(46, 80);
        s.style.setProperty('--x', Math.cos(a) * d + 'px'); s.style.setProperty('--y', Math.sin(a) * d + 'px');
        s.style.animationDelay = rnd(0, 0.12) + 's';
        n.appendChild(s); s.classList.add('go');
        setTimeout(s.remove.bind(s), 1100);
      }
    }
    if (tr) { tr.style.animationDuration = '1.1s'; setTimeout(function () { tr.style.animationDuration = ''; }, 2300); }
  }
  [].forEach.call(document.querySelectorAll('.node'), function (n) { n.addEventListener('click', function () { react(n); }); n.style.cursor = 'pointer'; });

  // ---------- the river croc: awake, a blink, sometimes a double blink, then a nap ----------
  [].forEach.call(document.querySelectorAll('.node .croc'), function (c) {
    var AWAKE = 0, BLINK = 1, ASLEEP = 2, seen = false, timer = 0, q = [];
    function cycle() {
      var s = [[AWAKE, rnd(4000, 8000)]];
      if (Math.random() < 1 / 3) s.push([BLINK, 120], [AWAKE, rnd(250, 450)]);
      s.push([BLINK, rnd(140, 220)]);
      var nap = rnd(6000, 12000);
      if (Math.random() < 1 / 4) { var a = nap * rnd(0.3, 0.6); s.push([ASLEEP, a], [BLINK, rnd(500, 900)], [ASLEEP, nap - a]); } else s.push([ASLEEP, nap]);
      s.push([BLINK, rnd(140, 220)]);
      return s;
    }
    function step() {
      if (!seen || still) { c.style.backgroundPosition = '0 0'; timer = 0; return; }
      if (!q.length) q = cycle();
      var f = q.shift();
      c.style.backgroundPosition = f[0] * 50 + '% 0';
      timer = setTimeout(step, f[1]);
    }
    onScreen(c, function (v) { seen = v; if (v && !timer) step(); });
  });

  // ---------- the forest friend: breathes and blinks (CSS); tap to cheer ----------
  [].forEach.call(document.querySelectorAll('.friend'), function (f) {
    f.addEventListener('click', function () {
      if (still || f.classList.contains('cheering')) return;
      f.classList.add('cheering');
      setTimeout(function () { f.classList.remove('cheering'); }, 640);
    });
  });

  // ---------- screen time card: coins fly from the lesson to the minutes ----------
  (function () {
    var deal = document.querySelector('.deal');
    if (!deal) return;
    var eq = deal.querySelectorAll('.eq img');
    if (eq.length < 2) return;
    function fly() {
      if (still || !deal.animate) return;
      var d = deal.getBoundingClientRect(), a = eq[0].getBoundingClientRect(), b = eq[1].getBoundingClientRect();
      var x0 = a.left - d.left + a.width / 2 - 15, y0 = a.top - d.top + a.height / 2 - 15, x1 = b.left - d.left + b.width / 2 - 15, y1 = b.top - d.top + b.height / 2 - 15;
      var vertical = Math.abs(y1 - y0) > Math.abs(x1 - x0);
      for (var i = 0; i < 6; i++) (function (i) {
        var c = document.createElement('img'); c.src = '/assets/img/coin.webp'; c.alt = ''; c.className = 'fly';
        c.style.left = x0 + 'px'; c.style.top = y0 + 'px'; c.style.opacity = 0;
        deal.appendChild(c);
        var mx = (x1 - x0) / 2 + (vertical ? rnd(-60, 60) : 0), my = (y1 - y0) / 2 - (vertical ? 0 : rnd(50, 90));
        var an = c.animate([
          { transform: 'translate(0,0) scale(.6)', opacity: 0 },
          { transform: 'translate(' + mx + 'px,' + my + 'px) scale(1.1)', opacity: 1, offset: 0.5 },
          { transform: 'translate(' + (x1 - x0) + 'px,' + (y1 - y0) + 'px) scale(.8)', opacity: 1 }
        ], { duration: 700, delay: 120 + i * 90, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'both' });
        an.onfinish = function () { c.remove(); eq[1].classList.remove('got'); void eq[1].offsetWidth; eq[1].classList.add('got'); };
      })(i);
    }
    once(deal, fly, 0.6);
    eq[0].style.cursor = 'pointer'; eq[0].addEventListener('click', fly);
  })();

  // ---------- try one word: a real Dengar & Pilih question ----------
  (function () {
    var box = document.querySelector('.cuba');
    if (!box) return;
    var A = '/assets/cuba/', snd = {}, coins = box.querySelector('.coins'), n = 0;
    var msg = box.querySelector('.msg'), again = box.querySelector('.again'), spk = box.querySelector('.spk');
    var tiles = [].slice.call(box.querySelectorAll('.tile')), answer = box.dataset.answer;
    function play(name, vol) {
      try { var a = snd[name] || (snd[name] = new Audio(A + name + '.mp3')); a.volume = vol || 1; a.currentTime = 0; a.play(); } catch (e) {}
    }
    once(box, function () { spk.classList.add('call'); }, 0.6);
    spk.addEventListener('click', function () { spk.classList.remove('call'); play(answer); });
    function say(ms, en, miss) { msg.className = 'msg' + (miss ? ' miss' : ''); msg.innerHTML = ms + '<span>' + en + '</span>'; }
    tiles.forEach(function (t) {
      t.addEventListener('click', function () {
        if (t.disabled || box.dataset.done) return;
        if (t.dataset.word === answer) {
          box.dataset.done = 1;
          t.classList.add('ok'); play('correct', 0.7);
          tiles.forEach(function (x) { if (x !== t) { x.classList.add('dim'); x.disabled = true; } });
          setTimeout(function () { n += 1; coins.querySelector('b').textContent = n; coins.classList.remove('pop'); void coins.offsetWidth; coins.classList.add('pop'); play('coin', 0.5); }, 350);
          say(box.dataset.rightMs, box.dataset.rightEn);
          again.style.display = 'block';
        } else {
          t.classList.remove('no'); void t.offsetWidth; t.classList.add('no'); t.disabled = true; play('wrong', 0.6);
          say(box.dataset.missMs, box.dataset.missEn, true);
        }
      });
    });
    again.addEventListener('click', function () {
      delete box.dataset.done; again.style.display = 'none'; msg.innerHTML = ''; msg.className = 'msg';
      tiles.forEach(function (x) { x.className = 'tile'; x.disabled = false; });
      play(answer);
    });
  })();

  // ---------- the live Kancil (front-facing rig, the app's moves) ----------
  var BUD = '/assets/kancil/buddy/', jsonCache = {};
  function move(name) { return jsonCache[name] || (jsonCache[name] = fetch(BUD + name + '.json').then(function (r) { return r.json(); })); }
  function Buddy(host, opts) {
    var live = host.querySelector('.live'), anims = {}, cur = null, passes = 0, seen = false, ready = false, waiting = null;
    var arrive = opts.arrive || 'happy', attention = opts.attention !== false, tap = opts.tap !== false;
    var names = (still ? [arrive + '-still', 'happy-still'] : [arrive, 'blink', 'wave', 'happy']).filter(function (n, i, a) { return a.indexOf(n) === i; });
    function load(name) {
      return move(name).then(function (data) {
        var box = document.createElement('div'); box.style.visibility = 'hidden';
        live.appendChild(box);
        var a = lottie.loadAnimation({ container: box, renderer: 'svg', loop: false, autoplay: false, animationData: JSON.parse(JSON.stringify(data)), rendererSettings: { preserveAspectRatio: 'xMidYMid meet' } });
        anims[name] = { a: a, box: box };
        return new Promise(function (res) { a.addEventListener('DOMLoaded', res); });
      });
    }
    function show(name) { for (var k in anims) anims[k].box.style.visibility = k === name ? 'visible' : 'hidden'; cur = name; }
    function play(name, then) {
      var m = anims[name]; if (!m) return;
      show(name);
      m.a.removeEventListener('complete');
      if (still) { m.a.goToAndStop(0, true); return; }
      m.a.addEventListener('complete', function () { if (then) then(); });
      m.a.goToAndPlay(0, true);
    }
    function idle() {
      if (!seen || still) { waiting = idle; return; }
      passes += 1;
      var wave = attention && (passes === 3 || (passes > 3 && (passes - 3) % 3 === 0));
      play(wave ? 'wave' : 'blink', idle);
    }
    Promise.all(names.map(load)).then(function () {
      ready = true; host.classList.add('on');
      if (still) { show(names[0]); anims[names[0]].a.goToAndStop(0, true); return; }
      show(arrive); anims[arrive].a.goToAndStop(0, true);
      onScreen(host, function (v) {
        seen = v;
        if (!v) { if (cur && anims[cur]) anims[cur].a.pause(); return; }
        if (waiting) { var w = waiting; waiting = null; w(); return; }
        if (cur && anims[cur] && !anims[cur].a.isPaused) return;
        if (!host.dataset.arrived) { host.dataset.arrived = 1; play(arrive, idle); } else if (cur && anims[cur]) anims[cur].a.play();
      }, 0.2);
    }).catch(function () {});
    if (tap) host.addEventListener('click', function (e) {
      if (!ready) return;
      e.preventDefault();
      if (still) { show('happy-still'); anims['happy-still'].a.goToAndStop(0, true); return; }
      play('happy', idle);
    });
  }

  function buildLockup(el) {
    var live = document.createElement('span'); live.className = 'live';
    live.innerHTML = '<span class="clip"><span class="circle"></span></span><img class="leaf" src="/assets/kancil/logo-leaf.webp" alt=""><span class="bud kbud" style="position:absolute"><span class="live"></span></span><img class="word" src="/assets/kancil/logo-wordmark.webp" alt="">';
    el.appendChild(live);
    var bud = live.querySelector('.bud');
    // the lockup shows when the rig is ready (the still logo until then)
    var obs = new MutationObserver(function () { if (bud.classList.contains('on')) { el.classList.add('on'); obs.disconnect(); } });
    obs.observe(bud, { attributes: true });
    // On the homepage a tap makes him cheer; elsewhere the logo is a link home.
    var isLink = el.tagName === 'A';
    Buddy(bud, { arrive: 'happy', attention: false, tap: !isLink });
    if (!isLink) el.addEventListener('click', function (e) { if (el.classList.contains('on') && !bud.contains(e.target)) { e.preventDefault(); bud.click(); } });
  }

  function startKancil() {
    [].forEach.call(document.querySelectorAll('.kbud[data-arrive]'), function (h) { Buddy(h, { arrive: h.dataset.arrive, attention: h.dataset.attention !== 'off' }); });
    [].forEach.call(document.querySelectorAll('.lockup'), buildLockup);
  }
  function loadScript(src, cb) { var s = document.createElement('script'); s.src = src; s.async = true; s.onload = cb; document.head.appendChild(s); }
  function later(fn) { (window.requestIdleCallback || function (f) { setTimeout(f, 300); })(fn); }

  addEventListener('load', function () {
    later(function () { loadScript('/assets/kancil/lottie_svg.min.js', startKancil); });
    later(function () {
      loadScript('/assets/fireflies.js', function () {
        // Few, slow and shy (owner, 6 Nov): they drift out of the pointer's way, or away from a tap.
        var ff = window.Fireflies.start({ count: 4, palette: 'warm', mode: 'shy', speed: 0.55 });
        // Android: shake to scatter, no prompt needed. iPhone would ask first, so it is left off.
        if (window.DeviceMotionEvent && !DeviceMotionEvent.requestPermission) ff.enableShake();
        if (still) ff.reduce(true);
        mq.addEventListener && mq.addEventListener('change', function (e) { ff.reduce(e.matches); });
      });
    });
  });

  // ---------- support: a topic chip or a link to #answer opens that answer ----------
  function openHash() {
    var id = location.hash.slice(1), d = id && document.getElementById(id);
    if (d && d.tagName === 'DETAILS') { d.open = true; d.scrollIntoView({ block: 'start' }); }
  }
  addEventListener('hashchange', openHash); openHash();

  // ---------- ?ref= attribution: remember where a visitor came from, carry it to the store links ----------
  try {
    var ref = new URLSearchParams(location.search).get('ref');
    if (ref) sessionStorage.setItem('kancil_ref', ref);
    ref = ref || sessionStorage.getItem('kancil_ref');
    if (ref) document.querySelectorAll('a.play').forEach(function (a) { a.href += '&referrer=' + encodeURIComponent('utm_source=' + ref); });
  } catch (e) {}
})();
