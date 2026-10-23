// YugaVerse Kids - Copyright (c) 2026 mayurj476. All rights reserved.
// Not for copying, reuse or redistribution without written permission. See LICENSE.

// ---------- Game: Coloring ----------
// A big outline picture (apple, fish, cat, car...). Six round paint bowls on the right.
// Tap a bowl to pick its colour, then tap a part of the picture: the paint pours in from
// the finger. Any colour is fine. When every part is coloured, the picture jumps for joy
// and the clapping cat celebrates. Then a new picture comes.
(() => {
  'use strict';
  const { audio, voice, fx, pick, clamp, settings } = window.MLW;

  const PAINTS = [
    { id: 'red',    names: { en: 'Red',    hi: 'लाल',    mr: 'लाल' },    light: '#ff9a9a', mid: '#ff3b3b', dark: '#b31212' },
    { id: 'yellow', names: { en: 'Yellow', hi: 'पीला',   mr: 'पिवळा' },  light: '#fff6b0', mid: '#ffd400', dark: '#c79a00' },
    { id: 'blue',   names: { en: 'Blue',   hi: 'नीला',   mr: 'निळा' },   light: '#9ccbff', mid: '#2f7bff', dark: '#1a4fb3' },
    { id: 'green',  names: { en: 'Green',  hi: 'हरा',    mr: 'हिरवा' },  light: '#b2f7b2', mid: '#2ecc40', dark: '#178a26' },
    { id: 'orange', names: { en: 'Orange', hi: 'नारंगी', mr: 'केशरी' },  light: '#ffcf9a', mid: '#ff8c1a', dark: '#b35a00' },
    { id: 'pink',   names: { en: 'Pink',   hi: 'गुलाबी', mr: 'गुलाबी' }, light: '#ffcbe7', mid: '#ff5db1', dark: '#b3207a' },
  ];
  const SAY = {
    intro: { en: "Let's colour!", hi: 'चलो रंग भरें!', mr: 'चला रंग भरूया!' },
    hint:  { en: 'Tap the picture!', hi: 'चित्र को छुओ!', mr: 'चित्राला हात लाव!' },
    done:  { en: (n) => `Wow! A beautiful ${n.toLowerCase()}!`, hi: (n) => `वाह! सुंदर ${n}!`, mr: (n) => `वा! छान ${n}!` },
  };

  // ---------- Pictures (200 x 200). Regions are the parts you colour; decor sits on top. ----------
  const INK = '#3d3552';
  const face = (cx, cy, s = 1) => `
    <circle cx="${cx - 14 * s}" cy="${cy}" r="${5 * s}" fill="${INK}"/><circle cx="${cx + 14 * s}" cy="${cy}" r="${5 * s}" fill="${INK}"/>
    <circle cx="${cx - 12.5 * s}" cy="${cy - 1.8 * s}" r="${1.7 * s}" fill="#fff"/><circle cx="${cx + 15.5 * s}" cy="${cy - 1.8 * s}" r="${1.7 * s}" fill="#fff"/>
    <ellipse cx="${cx - 24 * s}" cy="${cy + 9 * s}" rx="${5 * s}" ry="${3.2 * s}" fill="#ff7aa8" opacity=".45"/>
    <ellipse cx="${cx + 24 * s}" cy="${cy + 9 * s}" rx="${5 * s}" ry="${3.2 * s}" fill="#ff7aa8" opacity=".45"/>
    <path d="M${cx - 9 * s} ${cy + 11 * s} Q${cx} ${cy + 20 * s} ${cx + 9 * s} ${cy + 11 * s}" fill="none" stroke="${INK}" stroke-width="${3.5 * s}" stroke-linecap="round"/>`;
  const circle = (cx, cy, r) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
  function starPath(cx, cy, R, r) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r : R;
      d += (i ? ' L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1);
    }
    return d + ' Z';
  }
  function raysPath(cx, cy, r0, r1, n) {
    let d = '';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, w = 0.2;
      const p = (ang, rr) => (cx + Math.cos(ang) * rr).toFixed(1) + ' ' + (cy + Math.sin(ang) * rr).toFixed(1);
      d += `M${p(a - w, r0)} L${p(a, r1)} L${p(a + w, r0)} Z `;
    }
    return d;
  }
  const PETALS = [0, 1, 2, 3, 4].map((i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return circle(+(100 + Math.cos(a) * 32).toFixed(1), +(84 + Math.sin(a) * 32).toFixed(1), 25);
  }).join(' ');

  const PICTURES = [
    { id: 'apple', names: { en: 'Apple', hi: 'सेब', mr: 'सफरचंद' },
      regions: [
        'M104 52 C108 30 128 20 150 24 C146 46 126 58 104 52 Z',
        'M100 64 C80 44 38 50 36 98 C34 142 66 178 92 174 C97 173 103 173 108 174 C134 178 166 142 164 98 C162 50 120 44 100 64 Z',
      ],
      decor: `<path d="M100 64 C100 50 96 40 90 32" fill="none" stroke="#8a5a2b" stroke-width="7" stroke-linecap="round"/>${face(100, 112)}` },
    { id: 'fish', names: { en: 'Fish', hi: 'मछली', mr: 'मासा' },
      regions: [
        'M146 100 L186 66 C177 90 177 110 186 134 Z',
        'M74 70 C82 42 114 40 126 72 C108 64 92 64 74 70 Z',
        'M24 100 C46 58 122 54 152 100 C122 146 46 142 24 100 Z',
      ],
      decor: `<circle cx="58" cy="92" r="10" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="56" cy="92" r="5" fill="${INK}"/>
        <path d="M38 112 Q46 120 56 114" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M96 84 Q106 100 96 116 M114 84 Q124 100 114 116" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity=".45"/>` },
    { id: 'star', names: { en: 'Star', hi: 'तारा', mr: 'तारा' },
      regions: [starPath(100, 108, 88, 40)],
      decor: face(100, 112, 1.1) },
    { id: 'house', names: { en: 'House', hi: 'घर', mr: 'घर' },
      regions: [
        'M48 98 H152 V176 H48 Z',
        'M30 104 L100 38 L170 104 Z',
        'M86 128 H114 V176 H86 Z',
      ],
      decor: `<rect x="122" y="116" width="22" height="22" rx="3" fill="#cfefff" stroke="${INK}" stroke-width="3.5"/>
        <path d="M133 116 V138 M122 127 H144" stroke="${INK}" stroke-width="3"/><circle cx="108" cy="154" r="3" fill="${INK}"/>` },
    { id: 'butterfly', names: { en: 'Butterfly', hi: 'तितली', mr: 'फुलपाखरू' },
      regions: [
        'M96 98 C70 36 16 38 22 84 C26 114 60 118 96 104 Z M96 110 C60 112 36 136 50 162 C66 182 92 152 96 114 Z',
        'M104 98 C130 36 184 38 178 84 C174 114 140 118 104 104 Z M104 110 C140 112 164 136 150 162 C134 182 108 152 104 114 Z',
        'M100 62 C112 62 110 164 100 164 C90 164 88 62 100 62 Z',
      ],
      decor: `<path d="M96 66 Q86 40 74 34 M104 66 Q114 40 126 34" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="74" cy="34" r="5" fill="${INK}"/><circle cx="126" cy="34" r="5" fill="${INK}"/>
        <circle cx="96" cy="78" r="2.6" fill="${INK}"/><circle cx="104" cy="78" r="2.6" fill="${INK}"/>` },
    { id: 'cat', names: { en: 'Cat', hi: 'बिल्ली', mr: 'मांजर' },
      regions: [
        'M44 96 L50 28 L94 60 Z',
        'M156 96 L150 28 L106 60 Z',
        'M38 112 C38 72 66 56 100 56 C134 56 162 72 162 112 C162 152 134 172 100 172 C66 172 38 152 38 112 Z',
      ],
      decor: `${face(100, 104, 1.15)}<path d="M94.5 114 L105.5 114 L100 120 Z" fill="#ff7aa8" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M60 124 H28 M60 132 L32 142 M140 124 H172 M140 132 L168 142" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` },
    { id: 'car', names: { en: 'Car', hi: 'गाड़ी', mr: 'गाडी' },
      regions: [
        'M24 128 C24 112 36 106 52 104 L70 74 C74 68 80 66 88 66 H128 C136 66 142 70 146 76 L162 104 C174 106 180 114 180 128 V138 C180 142 177 145 174 145 H30 C27 145 24 142 24 138 Z',
        circle(64, 148, 21),
        circle(142, 148, 21),
      ],
      decor: `<path d="M78 78 C80 74 84 72 88 72 H97 V102 H62 Z M105 72 H126 C130 72 134 74 136 78 L150 102 H105 Z" fill="#cfefff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
        <circle cx="64" cy="148" r="7" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="142" cy="148" r="7" fill="#fff" stroke="${INK}" stroke-width="3"/>
        <circle cx="172" cy="118" r="5" fill="#fff6b0" stroke="${INK}" stroke-width="2.5"/>` },
    { id: 'flower', names: { en: 'Flower', hi: 'फूल', mr: 'फूल' },
      regions: [
        'M100 170 C80 150 54 152 46 160 C62 180 86 180 100 170 Z M100 152 C120 134 146 136 154 144 C138 164 114 164 100 152 Z',
        PETALS,
        circle(100, 84, 22),
      ],
      under: '<path d="M100 108 V186" stroke="#2fa858" stroke-width="7" stroke-linecap="round"/>',
      decor: face(100, 82, 0.62) },
    { id: 'sun', names: { en: 'Sun', hi: 'सूरज', mr: 'सूर्य' },
      regions: [raysPath(100, 100, 56, 92, 10), circle(100, 100, 50)],
      decor: face(100, 98, 1.2) },
    { id: 'icecream', names: { en: 'Ice cream', hi: 'आइसक्रीम', mr: 'आईस्क्रीम' },
      regions: [
        'M66 106 L100 186 L134 106 Z',
        'M60 110 C46 110 42 92 54 84 C52 58 74 40 100 40 C126 40 148 58 146 84 C158 92 154 110 140 110 Z',
      ],
      decor: `<path d="M80 120 L112 160 M96 112 L122 140 M120 120 L88 160 M104 112 L78 140" stroke="${INK}" stroke-width="2.5" opacity=".45"/>
        <circle cx="100" cy="34" r="10" fill="#ff3b3b" stroke="${INK}" stroke-width="3"/>${face(100, 78)}` },
    { id: 'duck', names: { en: 'Duck', hi: 'बत्तख', mr: 'बदक' },
      regions: [
        'M140 76 C156 70 174 74 178 82 C170 92 152 92 140 88 Z',
        'M36 124 C36 100 60 94 82 102 C78 62 102 42 126 52 C148 62 148 94 128 106 C152 102 170 110 170 134 C170 160 142 174 104 174 C62 174 36 152 36 124 Z',
      ],
      decor: `<circle cx="122" cy="72" r="5.5" fill="${INK}"/><circle cx="123.5" cy="70" r="1.8" fill="#fff"/>
        <path d="M78 128 C92 146 122 146 136 126" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>` },
    { id: 'turtle', names: { en: 'Turtle', hi: 'कछुआ', mr: 'कासव' },
      regions: [
        'M150 120 C152 96 184 94 188 114 C190 130 170 136 156 130 Z M58 128 C52 150 62 158 74 156 L80 128 Z M124 128 L130 156 C142 158 154 150 148 128 Z M44 124 L24 132 L46 136 Z',
        'M40 132 C40 88 68 64 100 64 C132 64 160 88 160 132 Z',
      ],
      decor: `<path d="M74 132 L84 98 H116 L126 132 M84 98 L72 80 M116 98 L128 80 M100 98 V66" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round" opacity=".5"/>
        <circle cx="174" cy="110" r="4.5" fill="${INK}"/><path d="M168 122 Q176 126 182 120" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` },
  ];

  // ---------- Paint bowls ----------
  let uid = 0;
  function bowlSVG(p) {
    const id = 'clb' + (uid++);
    return `<svg viewBox="0 0 100 90" aria-hidden="true">
      <defs>
        <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d6deeb"/></linearGradient>
        <radialGradient id="${id}p" cx="38%" cy="35%" r="70%"><stop offset="0" stop-color="${p.light}"/><stop offset=".6" stop-color="${p.mid}"/><stop offset="1" stop-color="${p.dark}"/></radialGradient>
      </defs>
      <ellipse cx="50" cy="84" rx="34" ry="5" fill="rgba(0,0,0,.15)"/>
      <path d="M6 38 C6 68 26 82 50 82 C74 82 94 68 94 38 Z" fill="url(#${id}b)" stroke="#9aa8c0" stroke-width="2.5"/>
      <path d="M14 56 Q50 70 86 56" fill="none" stroke="${p.mid}" stroke-width="5" opacity=".55" stroke-linecap="round"/>
      <ellipse cx="50" cy="38" rx="44" ry="13" fill="#eef2f8" stroke="#9aa8c0" stroke-width="2.5"/>
      <ellipse cx="50" cy="39" rx="38" ry="9.5" fill="url(#${id}p)"/>
      <path d="M78 41 C80 48 82 52 79 55 C76 52 76 47 78 41 Z" fill="${p.mid}"/>
      <ellipse cx="38" cy="36" rx="10" ry="3" fill="#fff" opacity=".55"/>
    </svg>`;
  }
  const BRUSH = `<svg viewBox="0 0 40 120" aria-hidden="true">
    <rect x="15" y="0" width="10" height="66" rx="5" fill="#c98b4f" stroke="#8a5a2b" stroke-width="2"/>
    <rect x="13" y="62" width="14" height="16" rx="3" fill="#c7cfdc" stroke="#8b95a8" stroke-width="2"/>
    <path class="clTip" d="M13 77 H27 C29 92 26 106 20 116 C14 106 11 92 13 77 Z" stroke="${INK}" stroke-width="2" stroke-opacity=".35"/>
  </svg>`;

  // ---------- The game ----------
  let layer, picEl, bowlsEl, brushEl, svg = null, pic = null, regions = [];
  let paint = PAINTS[0], state = 'idle', running = false, lastPic = null;
  let timers = [], idleTimer = null;
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  const lang = () => settings.lang;
  const say = (o) => voice.sayLang(o[lang()] || o.en, lang());

  function layout() {
    const W = window.innerWidth, H = window.innerHeight;
    let cols = 1, b = Math.min((H - 100) / 6 - 12, W * 0.2, 100);
    if (b < 54) { cols = 2; b = Math.min((H - 90) / 3 - 12, W * 0.12, 86); }
    b = clamp(b, 44, 100);
    layer.style.setProperty('--b', Math.round(b) + 'px');
    layer.style.setProperty('--cols', cols);
    layer.style.setProperty('--colW', Math.round(cols * b + (cols - 1) * 10 + 24) + 'px');
    placeBrush();
  }

  function renderBowls() {
    bowlsEl.innerHTML = PAINTS.map((p, i) =>
      `<button class="clBowl${p === paint ? ' on' : ''}" data-i="${i}" aria-label="${p.names.en}">${bowlSVG(p)}</button>`).join('');
    bowlsEl.appendChild(brushEl);
    placeBrush();
  }
  function placeBrush() {
    if (!bowlsEl) return;
    const on = bowlsEl.querySelector('.clBowl.on');
    if (!on) return;
    brushEl.style.left = (on.offsetLeft + on.offsetWidth * 0.62) + 'px';
    brushEl.style.top = (on.offsetTop - on.offsetHeight * 0.55) + 'px';
    brushEl.querySelector('.clTip').setAttribute('fill', paint.mid);
  }
  function pickPaint(i) {
    paint = PAINTS[i];
    bowlsEl.querySelectorAll('.clBowl').forEach((b, k) => b.classList.toggle('on', k === i));
    const b = bowlsEl.children[i];
    b.classList.remove('dip'); void b.offsetWidth; b.classList.add('dip');
    brushEl.classList.remove('dip'); void brushEl.offsetWidth; brushEl.classList.add('dip');
    placeBrush();
    dipSound();
    voice.stop();
    voice.sayLang(paint.names[lang()] || paint.names.en, lang());
    resetIdle();
  }

  function next() {
    if (!running) return;
    let p;
    do { p = pick(PICTURES); } while (p === lastPic);
    lastPic = pic = p;
    const id = 'clp' + (uid++);
    const parts = p.regions.map((d, i) => `<g class="clRegion" data-i="${i}">
        <clipPath id="${id}c${i}"><path d="${d}"/></clipPath>
        <path class="clBase" d="${d}" fill="#fff"/>
        <g class="clPaint" clip-path="url(#${id}c${i})"></g>
        <path class="clEdge" d="${d}" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
      </g>`);
    const decor = `<g class="clDecor">${p.decor}</g>`;
    picEl.innerHTML = `<svg viewBox="0 0 200 200" class="clPicture enter" aria-label="${p.names.en}">${p.under ? `<g class="clDecor">${p.under}</g>` : ''}${parts.join('')}${decor}</svg>`;
    svg = picEl.firstElementChild;
    regions = [...svg.querySelectorAll('.clRegion')].map((g) => ({ g, paint: null, box: g.querySelector('.clBase').getBBox() }));
    state = 'ready';
    resetIdle();
  }

  // Finger position in picture units (0-200).
  function toSvg(x, y) {
    const pt = svg.createSVGPoint();
    pt.x = x; pt.y = y;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }
  // Forgiving touch: the part under the finger, or else the closest part nearby.
  function regionAt(e) {
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const g = hit && hit.closest && hit.closest('.clRegion');
    if (g && svg.contains(g)) return regions[+g.dataset.i];
    const p = toSvg(e.clientX, e.clientY);
    let best = null, bestD = 34;
    regions.forEach((r) => {
      const b = r.box;
      const dx = Math.max(b.x - p.x, 0, p.x - b.x - b.width), dy = Math.max(b.y - p.y, 0, p.y - b.y - b.height);
      const d = Math.hypot(dx, dy) - (r.paint ? 0 : 6); // a little nudge towards parts still white
      if (d < bestD) { bestD = d; best = r; }
    });
    return best;
  }

  // Paint pours in from the finger and spreads to fill the part.
  function pour(r, e) {
    const b = r.box;
    let p = toSvg(e.clientX, e.clientY);
    p = { x: clamp(p.x, b.x, b.x + b.width), y: clamp(p.y, b.y, b.y + b.height) };
    const maxR = Math.max(...[[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]]
      .map(([x, y]) => Math.hypot(x - p.x, y - p.y))) + 4;
    const layerG = r.g.querySelector('.clPaint');
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', 0); c.setAttribute('fill', paint.mid);
    layerG.appendChild(c);
    const t0 = performance.now(), dur = 520;
    const step = (now) => {
      const k = clamp((now - t0) / dur, 0, 1);
      c.setAttribute('r', (maxR * (1 - Math.pow(1 - k, 3))).toFixed(1));
      if (k < 1) requestAnimationFrame(step);
      else while (layerG.children.length > 1) layerG.firstChild.remove(); // keep only the newest coat
    };
    requestAnimationFrame(step);
    r.paint = paint;
    r.g.classList.remove('wobble'); void r.g.getBoundingClientRect(); r.g.classList.add('wobble');
  }

  function onDown(e) {
    if (!running || state === 'party') return;
    const bowl = e.target.closest && e.target.closest('.clBowl');
    if (bowl) { e.preventDefault(); pickPaint(+bowl.dataset.i); return; }
    if (state !== 'ready' || !svg) return;
    const r = regionAt(e);
    if (!r) { audio.tap(); fx.burst(e.clientX, e.clientY, paint.mid, 6); resetIdle(); return; }
    e.preventDefault();
    if (r.paint === paint) { fx.burst(e.clientX, e.clientY, paint.light, 6); audio.tap(); resetIdle(); return; }
    pour(r, e);
    pourSound();
    fx.burst(e.clientX, e.clientY, paint.mid, 10);
    resetIdle();
    if (regions.every((x) => x.paint)) finish();
  }

  function finish() {
    state = 'done';
    clearTimeout(idleTimer);
    later(() => {
      if (!running) return;
      svg.classList.remove('enter');
      svg.classList.add('alive');
      const box = svg.getBoundingClientRect();
      regions.forEach((r, i) => later(() => {
        const m = svg.getScreenCTM();
        fx.burst(m.a * (r.box.x + r.box.width / 2) + m.e, m.d * (r.box.y + r.box.height / 2) + m.f, r.paint.mid, 14);
      }, i * 120));
      fx.burst(box.left + box.width / 2, box.top + box.height * 0.3, '#ffd400', 18);
      tadaSound();
    }, 650);
    later(() => {
      if (!running) return;
      state = 'party';
      const n = pic.names[lang()] || pic.names.en;
      window.MLW.celebrate({ phrase: 'Yay!', say: (SAY.done[lang()] || SAY.done.en)(n), lang: lang() });
    }, 1900);
  }

  // ---------- Sounds (soft, no bangs) ----------
  function tone(k, at, from, to, dur, vol, pan = 0, type = 'sine') {
    const t = k.ac.currentTime + at;
    const osc = k.ac.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = k.ac.createGain();
    k.env(g.gain, t, vol, 0.005, dur);
    osc.connect(g); k.out(g, 0.25, pan);
    osc.start(t); osc.stop(t + dur * 1.5 + 0.1);
  }
  // Brush dips into the bowl: a little "bloop".
  function dipSound() {
    const k = audio.kit();
    if (!k) return;
    tone(k, 0, 300, 720, 0.12, 0.25);
    k.noise(0.02, { dur: 0.05, vol: 0.15, type: 'lowpass', freq: 700, send: 0.1 });
  }
  // Paint pours in: a soft "shloop" sliding down, then a bubbly glug.
  function pourSound() {
    const k = audio.kit();
    if (!k) return;
    k.noise(0, { dur: 0.22, vol: 0.35, type: 'bandpass', freq: 600, q: 0.8, send: 0.2, attack: 0.03 });
    tone(k, 0, 900, 260, 0.26, 0.2);
    tone(k, 0.2, 380, 620, 0.08, 0.14);
  }
  // The picture comes to life: a quick happy run up.
  function tadaSound() {
    const k = audio.kit();
    if (!k) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(k, i * 0.09, f, f, 0.22, 0.14, -0.4 + i * 0.27, 'triangle'));
  }

  // ---------- Hints when nothing happens for a while ----------
  function resetIdle() {
    clearTimeout(idleTimer);
    if (running) idleTimer = setTimeout(hint, 9000);
  }
  function hint() {
    if (!running || state !== 'ready' || window.MLW.isPaused()) return;
    const r = regions.find((x) => !x.paint);
    if (r) { r.g.classList.remove('nudge'); void r.g.getBoundingClientRect(); r.g.classList.add('nudge'); }
    say(SAY.hint);
    resetIdle();
  }

  function clearAll() {
    timers.forEach(clearTimeout);
    timers = [];
    clearTimeout(idleTimer);
    picEl.innerHTML = '';
    svg = null; regions = [];
    state = 'idle';
  }

  const CARD_APPLE = `<svg viewBox="0 0 200 200" aria-hidden="true">
    <clipPath id="clCard"><path d="${PICTURES[0].regions[1]}"/></clipPath>
    <path d="${PICTURES[0].regions[0]}" fill="#2ecc40" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    <path d="${PICTURES[0].regions[1]}" fill="#fff"/>
    <circle cx="70" cy="150" r="95" fill="#ff3b3b" clip-path="url(#clCard)"/>
    <path d="${PICTURES[0].regions[1]}" fill="none" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M100 64 C100 50 96 40 90 32" fill="none" stroke="#8a5a2b" stroke-width="8" stroke-linecap="round"/>${face(100, 112)}
  </svg>`;

  window.MLW.registerGame('coloring', {
    label: 'Coloring',
    cardBg: 'radial-gradient(circle at 35% 30%, #fff7e0, #ffd27a 50%, #ff8c5a 100%)',
    cardArt: (artAt) => artAt(CARD_APPLE, 2, 6, 66) +
      artAt(bowlSVG(PAINTS[2]), 64, 8, 34, 31) + artAt(bowlSVG(PAINTS[1]), 64, 38, 34, 31) + artAt(bowlSVG(PAINTS[5]), 64, 68, 34, 31),
    init(el) {
      layer = el;
      layer.innerHTML = '<div class="clPic"></div><div class="clBowls"></div>';
      [picEl, bowlsEl] = layer.children;
      brushEl = document.createElement('div');
      brushEl.className = 'clBrush';
      brushEl.innerHTML = BRUSH;
      layer.addEventListener('pointerdown', onDown);
      window.addEventListener('resize', () => { if (running) layout(); });
    },
    start() {
      running = true;
      clearAll();
      paint = PAINTS[0];
      renderBowls();
      layout();
      next();
      later(() => say(SAY.intro), 500);
    },
    stop() { running = false; clearAll(); },
    pause() { clearTimeout(idleTimer); },
    resume() { if (state === 'ready') resetIdle(); },
    afterCelebration() { later(next, 200); },
  });
})();
