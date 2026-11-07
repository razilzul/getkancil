// Kancil fireflies for getkancil.app (#267 page 7 lab).
// The app's trail fireflies (src/components/ForestScenery.tsx: a 6 pt #FFF3B0 dot with a soft
// glow that drifts and pulses), let loose on the page. Each one wanders on its own path and
// flashes on its own beat. How they answer a visitor depends on the mode:
//
//   gather  nearby fireflies come and circle the pointer (or a tap), and fall into step
//   shy     they drift out of the pointer's way, like parting a curtain
//   trail   a short string follows the pointer, each one following the one in front
//   catch   tap one to catch it: it flashes and leaves its Malay name behind
//
// In every mode: a tap or click near fireflies scatters them; shaking the phone (or wiggling
// the mouse fast) scatters all of them on screen; scrolling fast gives them a gust of wind.
// Decoration only: one fixed canvas, pointer-events none, only on-screen flies drawn, nothing
// while the tab is hidden. Reduce Motion keeps them, still: each one stays where it is and
// glows slowly up and down; no flying, gathering, scattering or gusts.
//
//   const ff = Fireflies.start({ count: 7 /* per screen */, palette: 'warm', mode: 'gather' });
//   ff.set({ mode: 'shy' }); ff.enableShake(); ff.stop();
(function (root) {
  const PALETTES = {
    app: { core: '#FFF7CF', halo: 'rgba(255,231,140,0.95)', edge: 'rgba(255,231,140,0)' },
    warm: { core: '#FFF4BF', halo: 'rgba(240,158,18,0.88)', edge: 'rgba(236,137,42,0)' },
  };
  const TAU = Math.PI * 2;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function sprite(p, px) {
    const c = document.createElement('canvas');
    c.width = c.height = px;
    const g = c.getContext('2d'), r = px / 2;
    const grd = g.createRadialGradient(r, r, 0, r, r, r);
    grd.addColorStop(0, p.core);
    grd.addColorStop(0.12, p.core);
    grd.addColorStop(0.22, p.halo);
    grd.addColorStop(1, p.edge);
    g.fillStyle = grd;
    g.fillRect(0, 0, px, px);
    return c;
  }

  function start(opts = {}) {
    const o = Object.assign({ count: 7, palette: 'warm', mode: 'gather', size: 1, speed: 1, wind: true, word: { ms: 'kelip-kelip', en: 'firefly' }, onCatch: null, host: document.body }, opts);
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:40';
    o.host.appendChild(cv);
    const g = cv.getContext('2d');
    let dpr = 1, W = 0, H = 0, docH = 0, spr = null, flies = [], raf = 0, last = 0, clock = 0, stopped = false, caught = 0, still = mq.matches, lastDraw = 0;
    const ptr = { x: 0, y: 0, until: 0, phase: 0, touch: false };
    const wig = { lx: 0, ly: 0, lt: 0, dir: 0, flips: [] };
    let lastScroll = scrollY;

    function resize() {
      dpr = Math.min(2, devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      docH = Math.max(document.documentElement.scrollHeight, H);
      spr = sprite(PALETTES[o.palette] || PALETTES.warm, Math.round(64 * dpr));
    }
    function fly(offscreen) {
      let y = rnd(0, docH);
      if (offscreen && docH > H * 1.5) { while (y > scrollY - 60 && y < scrollY + H + 60) y = rnd(0, docH); }
      return {
        x: rnd(0, W), y, th: rnd(0, TAU), turn: 0, turnTo: rnd(-0.8, 0.8), turnAt: 0,
        sp: rnd(10, 22), vx: 0, vy: 0, ph: rnd(0, TAU), per: rnd(2.6, 5.2), r: rnd(0.75, 1.15),
        pull: 0, orb: rnd(0, TAU), rho: rnd(22, 78), orbSp: rnd(0.35, 0.8) * (Math.random() < 0.5 ? -1 : 1),
        boost: 0, calm: 0, fade: 1,
      };
    }
    // count is per screenful, so a long page is no busier than a short one
    const total = () => Math.min(180, Math.round(o.count * Math.max(1, docH / Math.max(1, H))));
    function populate() {
      const n = total();
      while (flies.length < n) flies.push(fly());
      flies.length = n;
    }
    const visible = (f) => f.y > scrollY - 40 && f.y < scrollY + H + 40;

    // ---- scatter: everything near (x, y) bursts outward and flashes; ignores the pointer a moment
    function scatter(x, y, radius, all) {
      let n = 0;
      for (const f of flies) {
        if (!visible(f)) continue;
        const dx = f.x - x, dy = f.y - y, d = Math.hypot(dx, dy);
        if (!all && d > radius) continue;
        const a = d > 1 ? Math.atan2(dy, dx) : rnd(0, TAU);
        const sp = all ? rnd(160, 300) : rnd(200, 340) * (1 - d / (radius * 1.4));
        f.vx += Math.cos(a + rnd(-0.4, 0.4)) * sp; f.vy += Math.sin(a + rnd(-0.4, 0.4)) * sp;
        f.th = a; f.boost = 1; f.calm = clock + rnd(1.4, 2.4); f.pull = 0; n++;
      }
      return n;
    }

    // ---- catch: the Malay word, with its English in gloss blue, where the firefly was
    function label(x, y) {
      const el = document.createElement('div');
      el.style.cssText = `position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-120%) scale(.6);opacity:0;z-index:41;pointer-events:none;
        background:#fff;border-radius:14px;padding:5px 12px 6px;box-shadow:0 0 0 2.5px #F7D774,0 8px 18px rgba(94,51,28,.18);text-align:center;white-space:nowrap;
        transition:transform .5s cubic-bezier(.3,1.6,.5,1),opacity .25s`;
      el.innerHTML = `<b style="display:block;font:800 17px/1.1 'Baloo 2',system-ui;color:#2C2016">${o.word.ms}</b><span style="display:block;font:600 12px/1.2 Lexend,system-ui;color:#3E6E8E">${o.word.en}</span>`;
      document.body.appendChild(el);
      requestAnimationFrame(() => { el.style.opacity = 1; el.style.transform = 'translate(-50%,-150%) scale(1)'; });
      setTimeout(() => { el.style.opacity = 0; el.style.transform = 'translate(-50%,-200%) scale(.9)'; }, 1500);
      setTimeout(() => el.remove(), 2100);
    }
    function tryCatch(x, y) {
      let best = null, bd = 34 * 34;
      for (const f of flies) { const d = (f.x - x) ** 2 + (f.y - y) ** 2; if (d < bd && f.fade > 0.9) { bd = d; best = f; } }
      if (!best) return false;
      best.boost = 1.6; best.vx = 0; best.vy = -30; best.fade = 0.999; // starts fading out
      caught++; label(best.x, best.y);
      if (o.onCatch) o.onCatch(caught);
      return true;
    }

    function step(dt) {
      clock += dt;
      if (still) { for (const f of flies) f.ph += dt * TAU / (f.per * 2.2); return; }
      const now = performance.now();
      const live = now < ptr.until;
      ptr.phase += dt * TAU / 3.4;

      // who answers the pointer this frame
      let chosen = null, order = null;
      if (live && (o.mode === 'gather' || o.mode === 'trail')) {
        const near = flies.map((f, i) => [i, (f.x - ptr.x) ** 2 + (f.y - ptr.y) ** 2]).filter((a) => visible(flies[a[0]]) && flies[a[0]].calm < clock && flies[a[0]].fade > 0.9).sort((a, b) => a[1] - b[1]);
        const take = o.mode === 'trail' ? 6 : 7;
        order = near.slice(0, take).map((a) => a[0]);
        chosen = new Map(order.map((i, k) => [i, k]));
      }

      flies.forEach((f, i) => {
        const k = chosen ? chosen.get(i) : undefined;
        const want = k !== undefined ? 1 : 0;
        f.pull += (want - f.pull) * Math.min(1, dt * (want ? 1.6 : 0.9));
        f.boost = Math.max(0, f.boost - dt * 0.9);

        // wander: the heading turns smoothly towards a new random turn every few seconds
        if (clock > f.turnAt) { f.turnTo = rnd(-0.9, 0.9); f.turnAt = clock + rnd(1.2, 3.5); }
        f.turn += (f.turnTo - f.turn) * Math.min(1, dt * 1.5);
        f.th += f.turn * dt;
        if (f.x < 30) f.th += dt * 2; if (f.x > W - 30) f.th -= dt * 2;
        const s = f.sp * o.speed;
        // drag pulls velocity back to a gentle wander (so a scatter or gust settles by itself)
        let ax = (Math.cos(f.th) * s - f.vx) * 1.4, ay = (Math.sin(f.th) * s * 0.7 - f.vy) * 1.4;

        if (f.pull > 0.01) {
          let tx, ty;
          if (o.mode === 'trail') {
            // each follows the one in front; the first follows the pointer
            const lead = k === 0 || k === undefined ? null : flies[order[k - 1]];
            tx = lead ? lead.x : ptr.x; ty = lead ? lead.y : ptr.y;
            const dx = f.x - tx, dy = f.y - ty, d = Math.hypot(dx, dy) || 1, gap = lead ? 26 : 14;
            tx += (dx / d) * gap; ty += (dy / d) * gap;
          } else {
            f.orb += f.orbSp * dt;
            tx = ptr.x + Math.cos(f.orb) * f.rho; ty = ptr.y + Math.sin(f.orb) * f.rho * 0.8;
            // fall into step: the flash phase drifts towards the group's beat
            const d = Math.atan2(Math.sin(ptr.phase - f.ph), Math.cos(ptr.phase - f.ph));
            f.ph += d * dt * 0.9 * f.pull;
          }
          const kx = (tx - f.x) * 5 - f.vx * 2.6, ky = (ty - f.y) * 5 - f.vy * 2.6;
          ax = ax * (1 - f.pull) + kx * f.pull; ay = ay * (1 - f.pull) + ky * f.pull;
        }
        if (o.mode === 'shy' && live) {
          const dx = f.x - ptr.x, dy = f.y - ptr.y, d = Math.hypot(dx, dy);
          if (d < 170 && d > 0.5) { const push = (1 - d / 170) * 380; ax += (dx / d) * push; ay += (dy / d) * push; f.boost = Math.max(f.boost, 0.35 * (1 - d / 170)); }
        }
        f.vx += ax * dt; f.vy += ay * dt;
        f.x += f.vx * dt; f.y += f.vy * dt;
        if (f.x < -40) f.x = W + 30; if (f.x > W + 40) f.x = -30;
        if (f.y < -40) f.y = docH + 30; if (f.y > docH + 40) f.y = -30;
        f.ph += dt * TAU / f.per;
        if (f.fade < 1) { f.fade -= dt * 1.4; if (f.fade <= 0) Object.assign(f, fly(true)); }
      });
    }

    function draw() {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, cv.width, cv.height);
      const sy = scrollY, base = 26 * dpr * o.size;
      for (const f of flies) {
        const y = f.y - sy;
        if (y < -40 || y > H + 40) continue;
        // a firefly flash: dim most of the time, a quick bright pulse once a beat
        const flash = still ? 0 : Math.pow(Math.max(0, Math.sin(f.ph)), 4);
        const a = still ? 0.4 + 0.35 * (0.5 + 0.5 * Math.sin(f.ph)) : (0.22 + 0.78 * flash + 0.15 * f.pull + f.boost * 0.6) * clamp(f.fade, 0, 1);
        const s = still ? base * f.r * 0.9 : base * f.r * (0.8 + 0.35 * flash + f.boost * 0.5) * (f.fade < 1 ? 1 + (1 - f.fade) * 0.8 : 1);
        g.globalAlpha = Math.min(1, a);
        g.drawImage(spr, f.x * dpr - s, y * dpr - s, s * 2, s * 2);
      }
      g.globalAlpha = 1;
    }

    function frame(t) {
      raf = 0;
      if (stopped) return;
      const dt = Math.min(0.05, (t - (last || t)) / 1000);
      last = t;
      if (!document.hidden && (!still || t - lastDraw > 66)) { step(still ? (t - (lastDraw || t)) / 1000 : dt); draw(); lastDraw = t; }
      raf = requestAnimationFrame(frame);
    }

    // ---- input
    const onMove = (e) => {
      if (e.pointerType === 'touch' || still) return;
      const now = performance.now();
      ptr.x = e.clientX; ptr.y = e.clientY + scrollY; ptr.until = now + 2200;
      // a fast back-and-forth wiggle of the mouse counts as a shake
      const dt = (now - wig.lt) / 1000;
      if (dt > 0 && dt < 0.1) {
        const vx = (e.clientX - wig.lx) / dt;
        const dir = Math.abs(vx) > 900 ? Math.sign(vx) : 0;
        if (dir && dir !== wig.dir) { wig.flips.push(now); wig.dir = dir; }
        wig.flips = wig.flips.filter((t) => now - t < 650);
        if (wig.flips.length >= 4) { wig.flips = []; scatter(ptr.x, ptr.y, 300); }
      }
      wig.lx = e.clientX; wig.ly = e.clientY; wig.lt = now;
    };
    const onDown = (e) => {
      if (still) return;
      const x = e.clientX, y = e.clientY + scrollY;
      if (o.mode === 'catch' && tryCatch(x, y)) return;
      // a tap right on a cluster scatters it; a tap on empty page calls them (gather / trail)
      const near = flies.filter((f) => visible(f) && (f.x - x) ** 2 + (f.y - y) ** 2 < 90 * 90).length;
      if (near) { scatter(x, y, 150); return; }
      ptr.x = x; ptr.y = y; ptr.until = performance.now() + (e.pointerType === 'touch' ? 3200 : 2200);
    };
    const onLeave = () => { ptr.until = 0; };
    const onVis = () => { last = 0; };
    const onScroll = () => {
      const dy = scrollY - lastScroll; lastScroll = scrollY;
      if (!o.wind || still || Math.abs(dy) < 30) return;
      // a gust: on-screen fireflies lag behind a fast scroll and swirl a little
      for (const f of flies) if (visible(f)) { f.vy += clamp(dy, -180, 180) * rnd(0.6, 1.1); f.vx += rnd(-40, 40); }
    };
    let shakeOn = false, lastShake = 0;
    const onMotion = (e) => {
      if (still) return;
      const a = e.accelerationIncludingGravity || e.acceleration; if (!a) return;
      const m = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
      const now = performance.now();
      if (m > 24 && now - lastShake > 900) { lastShake = now; scatter(W / 2 + rnd(-40, 40), scrollY + H / 2, 0, true); }
    };
    let ro = null;

    function run() {
      resize(); populate();
      if (!raf) raf = requestAnimationFrame(frame);
    }
    addEventListener('resize', resize);
    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('pointerdown', onDown, { passive: true });
    addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVis);
    mq.addEventListener('change', () => { still = mq.matches; });
    if ('ResizeObserver' in root) { ro = new ResizeObserver(() => { docH = Math.max(document.documentElement.scrollHeight, H); populate(); }); ro.observe(document.documentElement); }
    run();

    return {
      set(next) {
        const pal = next.palette && next.palette !== o.palette;
        Object.assign(o, next);
        if (pal) spr = sprite(PALETTES[o.palette] || PALETTES.warm, Math.round(64 * dpr));
        populate();
      },
      // iPhone asks for permission, and only from a tap; Android just works.
      async enableShake() {
        if (shakeOn) return true;
        try { if (typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission) { const r = await DeviceMotionEvent.requestPermission(); if (r !== 'granted') return false; } } catch (e) { return false; }
        addEventListener('devicemotion', onMotion); shakeOn = true; return true;
      },
      shake() { if (!still) scatter(W / 2, scrollY + H / 2, 0, true); },
      scatterAt(x, y) { return scatter(x, y + scrollY, 150); },
      pointAt(x, y, ms = 2200) { ptr.x = x; ptr.y = y + scrollY; ptr.until = performance.now() + ms; },
      // Reduce Motion: still, softly glowing (the OS setting does this by itself)
      reduce(on) { still = !!on; for (const f of flies) { f.vx = f.vy = 0; f.pull = 0; f.boost = 0; } },
      // Hide them altogether
      hide(on) { cv.style.display = on ? 'none' : ''; },
      stop() { stopped = true; cancelAnimationFrame(raf); cv.remove(); if (ro) ro.disconnect(); removeEventListener('devicemotion', onMotion); },
      get flies() { return flies; },
      get caught() { return caught; },
    };
  }

  root.Fireflies = { start };
})(window);
