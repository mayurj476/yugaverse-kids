// YugaVerse Kids - Copyright (c) 2026 mayurj476. All rights reserved.
// Not for copying, reuse or redistribution without written permission. See LICENSE.

// ---------- Game: Color Pop ----------
// One big glossy egg or ball at a time. It bounces in and the voice says its colour once.
// One tap and it cracks and bursts. After 3 bursts, the dancing girl celebrates.
(() => {
  'use strict';
  const { audio, voice, fx, pick, clamp, settings } = window.MLW;

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

  // ---------- The game ----------
  let layer, stage, dotsEl, obj = null, state = 'idle', count = 0, lastColor = null;
  let timers = [], idleTimer = null, running = false;
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
    do { c = pick(COLORS); } while (c === lastColor);
    lastColor = c;
    const kind = Math.random() < 0.5 ? 'egg' : 'ball';
    const pattern = Math.floor(Math.random() * PATTERNS.length);
    const el = document.createElement('div');
    el.className = 'cpObj enter';
    el.style.setProperty('--s', size() + 'px');
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

  function burst() {
    if (state !== 'ready' || !obj) return;
    state = 'bursting';
    clearTimeout(idleTimer);
    voice.stop();
    const { el, c, kind, pattern } = obj;
    const { x, y } = center();
    el.classList.add('crack');
    crackSound();
    later(() => {
      // Pop: shell halves fly apart (egg) or it bursts into stars (ball).
      if (kind === 'egg') {
        el.querySelector('.cpBody').innerHTML =
          `<div class="cpHalf top">${eggSVG(c, pattern, TOP_HALF)}</div><div class="cpHalf bottom">${eggSVG(c, pattern, BOTTOM_HALF)}</div>`;
        el.classList.add('open');
      } else {
        el.classList.add('popped');
      }
      const crackle = Array.from({ length: 26 }, () => 0.12 + Math.pow(Math.random(), 1.5) * 0.8);
      audio.burst(COLORS.indexOf(c) + 2, crackle);
      fx.firework(x, y, c.mid);
      fx.burst(x, y, c.light, 16);
      crackle.forEach((t) => later(() => fx.spark(x + (Math.random() * 2 - 1) * 140, y + (Math.random() * 2 - 1) * 140), t * 1000));
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

  // A crisp eggshell crack: a few sharp clicks and a little "tok" before the big pop.
  function crackSound() {
    const k = audio.kit();
    if (!k) return;
    [0, 0.035, 0.08, 0.12].forEach((t, i) => k.noise(t, { dur: 0.006 + i * 0.002, vol: 0.7, type: 'highpass', freq: 2500 + i * 600, q: 0.7, send: 0.15 }));
    k.noise(0.02, { dur: 0.05, vol: 0.4, type: 'bandpass', freq: 900, q: 2, send: 0.1 });
  }

  // Forgiving touch: anywhere near the object counts. Elsewhere: a soft bloop and sparkles.
  function onDown(e) {
    if (!running) return;
    if (state === 'ready' && obj) {
      const { x, y, r } = center();
      if (Math.hypot(e.clientX - x, e.clientY - y) < r + 110) { e.preventDefault(); burst(); return; }
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
    if (!running || state !== 'ready' || !obj || window.MLW.isPaused()) return;
    obj.el.classList.remove('wiggle'); void obj.el.offsetWidth; obj.el.classList.add('wiggle');
    voice.sayLang(SAY.tapIt[lang()], lang());
    resetIdle();
  }

  function clearAll() {
    timers.forEach(clearTimeout);
    timers = [];
    clearTimeout(idleTimer);
    stage.innerHTML = '';
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
      layer.innerHTML = '<div class="cpDots"></div><div class="cpStage"></div>';
      dotsEl = layer.firstElementChild;
      stage = layer.lastElementChild;
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
    resume() { if (state === 'ready') resetIdle(); },
    afterCelebration() {
      count = 0;
      renderDots(false);
      state = 'idle';
      later(next, 300);
    },
  });
})();
