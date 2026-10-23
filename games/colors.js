// YugaVerse Kids - Copyright (c) 2026 mayurj476. All rights reserved.
// Not for copying, reuse or redistribution without written permission. See LICENSE.

// ---------- Game: Color Pop ----------
// One big glossy egg or ball at a time. It bounces in and the voice says its colour once.
// First tap cracks it, second tap bursts it into a big paint splat that stays on the screen.
// After 3 bursts, the dancing girl celebrates, then the splats fade away.
(() => {
  'use strict';
  const { audio, voice, fx, pick, clamp, shuffle, settings } = window.MLW;

  const COLORS = [
    { id: 'red',    names: { en: 'Red',    hi: 'लाल',    mr: 'लाल' },    light: '#ff9a9a', mid: '#ff3b3b', dark: '#b31212' },
    { id: 'blue',   names: { en: 'Blue',   hi: 'नीला',   mr: 'निळा' },   light: '#9ccbff', mid: '#2f7bff', dark: '#1a4fb3' },
    { id: 'yellow', names: { en: 'Yellow', hi: 'पीला',   mr: 'पिवळा' },  light: '#fff6b0', mid: '#ffd400', dark: '#c79a00' },
    { id: 'green',  names: { en: 'Green',  hi: 'हरा',    mr: 'हिरवा' },  light: '#b2f7b2', mid: '#2ecc40', dark: '#178a26' },
    { id: 'orange', names: { en: 'Orange', hi: 'नारंगी', mr: 'केशरी' },  light: '#ffcf9a', mid: '#ff8c1a', dark: '#b35a00' },
    { id: 'purple', names: { en: 'Purple', hi: 'बैंगनी', mr: 'जांभळा' }, light: '#dcbfff', mid: '#9b4dff', dark: '#5e25b3' },
    { id: 'pink',   names: { en: 'Pink',   hi: 'गुलाबी', mr: 'गुलाबी' }, light: '#ffcbe7', mid: '#ff5db1', dark: '#b3207a' },
  ];
  const SAY = {
    tapIt: { en: 'Tap it!', hi: 'छुओ!', mr: 'हात लाव!' },
    cheer: { en: 'Yay! Well done!', hi: 'वाह! शाबाश!', mr: 'वा! शाब्बास!' },
  };
  const BURSTS_PER_PARTY = 3;

  // ---------- Pictures: glossy 3D egg and ball ----------
  let uid = 0;
  const EGG = 'M60 6 C89 6 106 48 106 76 C106 103 86 120 60 120 C34 120 14 103 14 76 C14 48 31 6 60 6 Z';
  const PATTERNS = [
    // wavy stripes
    `<path d="M10 58 Q25 48 40 58 T70 58 T100 58 T130 58" fill="none" stroke="#fff" stroke-width="7" opacity=".55" stroke-linecap="round"/>
     <path d="M6 86 Q21 76 36 86 T66 86 T96 86 T126 86" fill="none" stroke="#fff" stroke-width="7" opacity=".55" stroke-linecap="round"/>`,
    // dots
    [[40, 50], [70, 44], [55, 72], [30, 82], [84, 70], [66, 98], [42, 104], [90, 94]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#fff" opacity=".55"/>`).join(''),
    // zigzag band
    `<path d="M8 70 L20 60 L32 70 L44 60 L56 70 L68 60 L80 70 L92 60 L104 70 L116 60" fill="none" stroke="#fff" stroke-width="7" opacity=".55" stroke-linejoin="round" stroke-linecap="round"/>`,
  ];
  function eggSVG(c, pattern, clip) {
    const id = 'cp' + (uid++);
    return `<svg viewBox="0 0 120 126" aria-hidden="true">
      <defs>
        <radialGradient id="${id}g" cx="36%" cy="28%" r="80%"><stop offset="0" stop-color="${c.light}"/><stop offset=".55" stop-color="${c.mid}"/><stop offset="1" stop-color="${c.dark}"/></radialGradient>
        <clipPath id="${id}c"><path d="${EGG}"/></clipPath>
        ${clip ? `<clipPath id="${id}k"><polygon points="${clip}"/></clipPath>` : ''}
      </defs>
      <g ${clip ? `clip-path="url(#${id}k)"` : ''}>
        <path d="${EGG}" fill="url(#${id}g)" stroke="${c.dark}" stroke-width="2.5"/>
        <g clip-path="url(#${id}c)">${PATTERNS[pattern]}</g>
        <ellipse cx="42" cy="34" rx="12" ry="20" fill="#fff" opacity=".55" transform="rotate(25 42 34)"/>
        <ellipse cx="36" cy="58" rx="4" ry="6" fill="#fff" opacity=".5"/>
      </g>
    </svg>`;
  }
  function ballSVG(c) {
    const id = 'cp' + (uid++);
    return `<svg viewBox="0 0 120 126" aria-hidden="true">
      <defs>
        <radialGradient id="${id}g" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="${c.light}"/><stop offset=".55" stop-color="${c.mid}"/><stop offset="1" stop-color="${c.dark}"/></radialGradient>
        <clipPath id="${id}c"><circle cx="60" cy="66" r="52"/></clipPath>
      </defs>
      <circle cx="60" cy="66" r="52" fill="url(#${id}g)" stroke="${c.dark}" stroke-width="2.5"/>
      <g clip-path="url(#${id}c)">
        <path d="M2 50 Q60 92 118 50" fill="none" stroke="#fff" stroke-width="9" opacity=".6"/>
        <path d="M2 84 Q60 122 118 84" fill="none" stroke="#fff" stroke-width="5" opacity=".35"/>
      </g>
      <ellipse cx="40" cy="38" rx="16" ry="10" fill="#fff" opacity=".6" transform="rotate(-30 40 38)"/>
      <circle cx="30" cy="56" r="4" fill="#fff" opacity=".5"/>
    </svg>`;
  }
  // Zigzag crack line for the two shell halves.
  const ZIG = '120,64 108,72 96,60 84,72 72,60 60,72 48,60 36,72 24,60 12,72 0,64';
  const TOP_HALF = '0,0 120,0 ' + ZIG;
  const BOTTOM_HALF = ZIG + ' 0,126 120,126';
  // Crack lines drawn over the object after the first tap.
  const CRACKS = {
    egg: ['M60 18 L53 34 L64 44 L55 60 L66 72', 'M64 44 L78 50', 'M55 60 L42 66'],
    ball: ['M58 22 L51 40 L63 50 L54 66 L64 80', 'M63 50 L80 56', 'M54 66 L40 70'],
  };
  function crackSVG(kind, c) {
    return `<svg class="cpCrack" viewBox="0 0 120 126" aria-hidden="true">${CRACKS[kind].map((d, i) =>
      `<path d="${d}" pathLength="1" style="animation-delay:${i * 0.06}s" fill="none" stroke="${c.dark}" stroke-width="${i ? 2.6 : 3.4}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</svg>`;
  }

  // ---------- Paint splat ----------
  // A wobbly blob with splash spikes, flung droplets and a few drips running down.
  const rnd = (a, b) => a + Math.random() * (b - a);
  function blobPath(cx, cy, R, n) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd(-0.08, 0.08);
      const r = R * (Math.random() < 0.25 ? rnd(1.2, 1.45) : rnd(0.86, 1.02));
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    // Smooth closed curve through the midpoints.
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    let d = `M${mid(pts[n - 1], pts[0]).map((v) => v.toFixed(1)).join(' ')}`;
    pts.forEach((p, i) => { const m = mid(p, pts[(i + 1) % n]); d += ` Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`; });
    return d + 'Z';
  }
  function splatSVG(c) {
    const drops = Array.from({ length: 14 }, () => {
      const a = rnd(0, Math.PI * 2), dist = rnd(62, 96);
      return `<circle class="cpDrop" cx="${(100 + Math.cos(a) * dist).toFixed(1)}" cy="${(100 + Math.sin(a) * dist).toFixed(1)}" r="${rnd(3, 9).toFixed(1)}" style="--dx:${(-Math.cos(a) * 40).toFixed(0)}px;--dy:${(-Math.sin(a) * 40).toFixed(0)}px"/>`;
    }).join('');
    const drips = Array.from({ length: 3 }, () => {
      const x = rnd(78, 122), w = rnd(7, 12), len = rnd(30, 62);
      return `<g class="cpDrip" style="animation-delay:${rnd(0.3, 0.9).toFixed(2)}s"><rect x="${(x - w / 2).toFixed(1)}" y="110" width="${w.toFixed(1)}" height="${len.toFixed(1)}" rx="${(w / 2).toFixed(1)}"/><circle cx="${x.toFixed(1)}" cy="${(110 + len).toFixed(1)}" r="${(w * 0.75).toFixed(1)}"/></g>`;
    }).join('');
    return `<svg viewBox="0 0 200 200" aria-hidden="true" fill="${c.mid}">
      ${drips}
      <path d="${blobPath(100, 100, 52, 26)}"/>
      ${drops}
      <path d="${blobPath(92, 90, 22, 9)}" fill="${c.light}" opacity=".45"/>
      <ellipse cx="80" cy="76" rx="9" ry="5" fill="#fff" opacity=".45" transform="rotate(-30 80 76)"/>
    </svg>`;
  }

  // ---------- The game ----------
  let layer, stage, splats, dotsEl, obj = null, state = 'idle', count = 0, lastColor = null;
  let timers = [], idleTimer = null, running = false, spots = [];
  // Each object of a round lands in its own spot, so all three splats stay visible.
  const SPOTS = [[28, 50], [72, 56], [50, 62]];
  const TALL_SPOTS = [[38, 32], [64, 52], [40, 72]];
  let roundColors = [];
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  const lang = () => settings.lang;
  const nameOf = (c) => c.names[lang()] || c.names.en;
  const size = () => clamp(Math.min(window.innerWidth, window.innerHeight) * 0.52, 180, 380);

  function renderDots(bump) {
    dotsEl.innerHTML = Array.from({ length: BURSTS_PER_PARTY }, (_, i) =>
      `<span class="cpDot${i < count ? ' on' : ''}${bump && i === count - 1 ? ' bump' : ''}"></span>`).join('');
  }

  function next() {
    if (!running) return;
    let c;
    // A new colour each time, and no repeats within a round of three.
    if (!spots.length) roundColors = [];
    do { c = pick(COLORS); } while (c === lastColor || roundColors.includes(c));
    lastColor = c;
    roundColors.push(c);
    const kind = Math.random() < 0.5 ? 'egg' : 'ball';
    const pattern = Math.floor(Math.random() * PATTERNS.length);
    const el = document.createElement('div');
    el.className = 'cpObj enter';
    el.style.setProperty('--s', size() + 'px');
    if (!spots.length) spots = shuffle((window.innerHeight > window.innerWidth * 1.2 ? TALL_SPOTS : SPOTS).slice());
    const [left, top] = spots.pop();
    el.style.left = left + '%';
    el.style.top = top + '%';
    el.innerHTML = `<div class="cpShadow"></div><div class="cpBody">${kind === 'egg' ? eggSVG(c, pattern) : ballSVG(c)}</div>`;
    stage.appendChild(el);
    obj = { el, c, kind, pattern };
    state = 'arriving';
    // Once it has landed: say the colour, once.
    later(() => {
      if (!running || !obj || obj.el !== el) return;
      el.classList.remove('enter');
      state = 'ready';
      voice.sayLang(nameOf(c) + '!', lang());
      resetIdle();
    }, 850);
  }

  function center() {
    const r = obj.el.querySelector('.cpBody').getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 };
  }

  // First tap: the shell cracks and wobbles. It waits for the second tap.
  function crack() {
    state = 'cracking';
    resetIdle();
    const { el, c, kind } = obj;
    const { x, y } = center();
    el.classList.remove('wiggle');
    el.classList.add('crack');
    el.querySelector('.cpBody').insertAdjacentHTML('beforeend', crackSVG(kind, c));
    crackSound();
    fx.burst(x, y - 20, c.mid, 6);
    later(() => { if (obj && obj.el === el && state === 'cracking') { el.classList.remove('crack'); el.classList.add('cracked'); state = 'cracked'; } }, 260);
  }

  function burst() {
    if (state !== 'cracked' || !obj) return;
    state = 'bursting';
    clearTimeout(idleTimer);
    voice.stop();
    const { el, c, kind, pattern } = obj;
    const { x, y, r } = center();
    el.classList.remove('cracked');
    el.classList.add('crack');
    later(() => {
      // Pop: shell halves fly apart (egg) or it bursts into stars (ball).
      if (kind === 'egg') {
        el.querySelector('.cpBody').innerHTML =
          `<div class="cpHalf top">${eggSVG(c, pattern, TOP_HALF)}</div><div class="cpHalf bottom">${eggSVG(c, pattern, BOTTOM_HALF)}</div>`;
        el.classList.add('open');
      } else {
        el.classList.add('popped');
      }
      splatSound();
      splat(x, y, r, c);
      fx.burst(x, y, c.mid, 20);
      count++;
      renderDots(true);
    }, 230);
    later(() => { el.remove(); if (obj && obj.el === el) obj = null; }, 1000);
    later(() => {
      if (!running) return;
      if (count >= BURSTS_PER_PARTY) {
        state = 'party';
        window.MLW.celebrate({ character: 'girl', phrase: 'Yay!', say: SAY.cheer[lang()], lang: lang() });
      } else next();
    }, 1300);
  }

  // Paint stays where it burst, growing in from the middle. Cleared after the party.
  function splat(x, y, r, c) {
    const box = layer.getBoundingClientRect();
    const s = document.createElement('div');
    s.className = 'cpSplat';
    s.style.cssText = `left:${x - box.left}px;top:${y - box.top}px;--s:${Math.round(r * 3.4)}px;--rot:${Math.round(rnd(-40, 40))}deg`;
    s.innerHTML = splatSVG(c);
    splats.appendChild(s);
  }
  function clearSplats() {
    [...splats.children].forEach((s) => { s.classList.add('gone'); setTimeout(() => s.remove(), 700); });
  }

  // Soft sounds only (no firecracker crackle).
  function tone(k, at, from, to, dur, vol, pan = 0) {
    const t = k.ac.currentTime + at;
    const osc = k.ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = k.ac.createGain();
    k.env(g.gain, t, vol, 0.004, dur);
    osc.connect(g); k.out(g, 0.25, pan);
    osc.start(t); osc.stop(t + dur * 1.5 + 0.1);
  }
  // First tap: a gentle wooden "tok" with a little wobble.
  function crackSound() {
    const k = audio.kit();
    if (!k) return;
    k.noise(0, { dur: 0.04, vol: 0.45, type: 'bandpass', freq: 1100, q: 3, send: 0.1 });
    tone(k, 0, 420, 300, 0.12, 0.22);
    tone(k, 0.1, 340, 380, 0.16, 0.12);
  }
  // Second tap: a squishy paint SPLAT, then a few drips plopping up a happy scale.
  function splatSound() {
    const k = audio.kit();
    if (!k) return;
    k.noise(0, { dur: 0.16, vol: 0.85, type: 'lowpass', freq: 420, q: 0.9, send: 0.15 });
    k.noise(0.005, { dur: 0.07, vol: 0.35, type: 'bandpass', freq: 1500, q: 1.2, send: 0.2 });
    tone(k, 0, 520, 140, 0.18, 0.3);
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(k, 0.18 + i * 0.11 + rnd(0, 0.03), f * 0.7, f, 0.09, 0.14, rnd(-0.6, 0.6)));
  }

  // Forgiving touch: anywhere near the object counts. Elsewhere: a soft bloop and sparkles.
  function onDown(e) {
    if (!running) return;
    if ((state === 'ready' || state === 'cracking' || state === 'cracked') && obj) {
      const { x, y, r } = center();
      if (Math.hypot(e.clientX - x, e.clientY - y) < r + 110) {
        e.preventDefault();
        if (state === 'ready') crack(); else if (state === 'cracked') burst();
        return;
      }
    }
    if (state === 'party') return;
    audio.tap();
    fx.burst(e.clientX, e.clientY, pick(COLORS).mid, 8);
  }

  function resetIdle() {
    clearTimeout(idleTimer);
    if (running) idleTimer = setTimeout(hint, 9000);
  }
  function hint() {
    if (!running || (state !== 'ready' && state !== 'cracked') || !obj || window.MLW.isPaused()) return;
    obj.el.classList.remove('wiggle'); void obj.el.offsetWidth; obj.el.classList.add('wiggle');
    voice.sayLang(SAY.tapIt[lang()], lang());
    resetIdle();
  }

  function clearAll() {
    timers.forEach(clearTimeout);
    timers = [];
    clearTimeout(idleTimer);
    stage.innerHTML = '';
    splats.innerHTML = '';
    spots = [];
    obj = null;
    state = 'idle';
  }

  window.MLW.registerGame('colors', {
    label: 'Color pop',
    cardBg: 'radial-gradient(circle at 35% 30%, #ffe3f3, #ff9ad5 45%, #7c5cff 100%)',
    cardArt: (artAt) =>
      artAt(eggSVG(COLORS[1], 1), 6, 6, 50, 53) + artAt(ballSVG(COLORS[0]), 44, 14, 50, 53) + artAt(eggSVG(COLORS[2], 0), 24, 44, 50, 53),
    init(el) {
      layer = el;
      layer.innerHTML = '<div class="cpSplats"></div><div class="cpDots"></div><div class="cpStage"></div>';
      [splats, dotsEl, stage] = layer.children;
      layer.addEventListener('pointerdown', onDown);
    },
    start() {
      running = true;
      clearAll();
      count = 0;
      renderDots(false);
      later(next, 400);
    },
    stop() { running = false; clearAll(); },
    pause() { clearTimeout(idleTimer); },
    resume() { if (state === 'ready' || state === 'cracked') resetIdle(); },
    afterCelebration() {
      count = 0;
      spots = [];
      clearSplats();
      renderDots(false);
      state = 'idle';
      later(next, 300);
    },
  });
})();
