// YugaVerse Kids - Copyright (c) 2026 mayurj476. All rights reserved.
// Not for copying, reuse or redistribution without written permission. See LICENSE.

// ---------- Game: Animal Sounds ----------
// Tap an animal: it bounces, the voice says its name (English / Hindi / Marathi),
// then the animal makes its sound. Nothing to get wrong: every tap is a good tap.
(() => {
  'use strict';
  const { audio, voice, fx, pick, clamp, settings } = window.MLW;

  // Names are spoken and shown in the language chosen in the parent settings.
  const ANIMALS = [
    { id: 'cow',      names: { en: 'Cow',      hi: 'गाय',    mr: 'गाय' },    bg: '#C9F3B8', shade: '#8FD177' },
    { id: 'dog',      names: { en: 'Dog',      hi: 'कुत्ता',  mr: 'कुत्रा' },  bg: '#BFE3FF', shade: '#7FBDEB' },
    { id: 'cat',      names: { en: 'Cat',      hi: 'बिल्ली',  mr: 'मांजर' },  bg: '#FFE0C2', shade: '#F2B07A' },
    { id: 'duck',     names: { en: 'Duck',     hi: 'बत्तख',  mr: 'बदक' },    bg: '#C4F1F6', shade: '#7FD3DE' },
    { id: 'sheep',    names: { en: 'Sheep',    hi: 'भेड़',    mr: 'मेंढी' },  bg: '#E2EEFF', shade: '#A9C2EE' },
    { id: 'lion',     names: { en: 'Lion',     hi: 'शेर',    mr: 'सिंह' },   bg: '#FFF0B3', shade: '#F0CF5A' },
    { id: 'elephant', names: { en: 'Elephant', hi: 'हाथी',   mr: 'हत्ती' },  bg: '#E7DCFF', shade: '#B9A2EE' },
    { id: 'pig',      names: { en: 'Pig',      hi: 'सूअर',   mr: 'डुक्कर' }, bg: '#FFD9E6', shade: '#F2A3BE' },
  ];
  // One simple instruction at a time.
  const SAY = {
    intro: { en: 'Tap an animal!', hi: 'किसी जानवर को छुओ!', mr: 'एका प्राण्याला हात लाव!' },
    look:  { en: (n) => `Look! The ${n.toLowerCase()}!`, hi: (n) => `देखो! ${n}!`, mr: (n) => `बघ! ${n}!` },
  };

  // Recordings in sounds/animals/<id>.mp3 (or .wav / .m4a) replace the built-in sounds.
  audio.registerSamples(ANIMALS.map((a) => 'animals/' + a.id));

  // ---------- Pictures (soft 3D cartoon heads) ----------
  const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    ${[
      ['mlwCow', '#ffffff', '#d5dae2'], ['mlwPink', '#ffd0dc', '#ff8fab'], ['mlwDog', '#efc08c', '#b9773f'],
      ['mlwDogEar', '#9a6338', '#5e3518'], ['mlwCat', '#ffcb8a', '#f08a24'], ['mlwDuck', '#fff59a', '#ffc400'],
      ['mlwBeak', '#ffc06a', '#f07800'], ['mlwWool', '#ffffff', '#dfe0ec'], ['mlwSheepFace', '#7a7a8e', '#3f3f4f'],
      ['mlwLion', '#ffdb80', '#f0a530'], ['mlwMane', '#e08a3a', '#a8501a'], ['mlwEle', '#c6d0e0', '#8592ab'],
      ['mlwPig', '#ffd0de', '#f58fb1'], ['mlwSnout', '#ffb6cc', '#ec6f99'],
    ].map(([id, a, b]) => `<radialGradient id="${id}" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`).join('')}
  </defs></svg>`;

  const eye = (x, y) => `<g class="aEye"><ellipse cx="${x}" cy="${y}" rx="5.6" ry="6.6" fill="#2b2633"/>
    <circle cx="${x + 1.9}" cy="${y - 2.3}" r="2.1" fill="#fff"/><circle cx="${x - 1.6}" cy="${y + 2.2}" r="0.9" fill="#fff" opacity=".8"/></g>`;
  const cheek = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="3.6" fill="#ff7aa8" opacity=".45"/>`;
  const shine = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="10" ry="5.5" fill="#fff" opacity=".45" transform="rotate(-22 ${x} ${y})"/>`;
  const shadow = `<ellipse cx="60" cy="113" rx="32" ry="5" fill="#000" opacity=".12"/>`;
  const ring = (cx, cy, r, n, br, fill, stroke) => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return `<circle cx="${(cx + Math.cos(a) * r).toFixed(1)}" cy="${(cy + Math.sin(a) * r).toFixed(1)}" r="${br}" fill="${fill}" ${stroke ? `stroke="${stroke}" stroke-width="2"` : ''}/>`;
  }).join('');

  const ART = {
    cow: `${shadow}
      <path d="M38 30 Q29 16 37 9 Q40 22 46 27 Z" fill="#fff3c4" stroke="#c9a85a" stroke-width="2" stroke-linejoin="round"/>
      <path d="M82 30 Q91 16 83 9 Q80 22 74 27 Z" fill="#fff3c4" stroke="#c9a85a" stroke-width="2" stroke-linejoin="round"/>
      <ellipse cx="22" cy="47" rx="14" ry="8" transform="rotate(-25 22 47)" fill="url(#mlwCow)" stroke="#9aa3ad" stroke-width="2"/>
      <ellipse cx="22" cy="47" rx="8" ry="4" transform="rotate(-25 22 47)" fill="#ffb3c6"/>
      <ellipse cx="98" cy="47" rx="14" ry="8" transform="rotate(25 98 47)" fill="url(#mlwCow)" stroke="#9aa3ad" stroke-width="2"/>
      <ellipse cx="98" cy="47" rx="8" ry="4" transform="rotate(25 98 47)" fill="#ffb3c6"/>
      <ellipse cx="60" cy="56" rx="36" ry="34" fill="url(#mlwCow)" stroke="#9aa3ad" stroke-width="2.5"/>
      <path d="M33 42 q8 -12 19 -5 q4 9 -4 13 q-11 4 -15 -8 z" fill="#3a3340"/>
      <path d="M77 33 q11 -2 13 9 q-2 9 -11 6 q-8 -4 -2 -15 z" fill="#3a3340"/>
      ${shine(46, 30)}${eye(47, 55)}${eye(73, 55)}
      <ellipse cx="60" cy="80" rx="27" ry="17" fill="url(#mlwPink)" stroke="#e0708f" stroke-width="2"/>
      <ellipse cx="50" cy="79" rx="4" ry="5.5" fill="#b8486b"/><ellipse cx="70" cy="79" rx="4" ry="5.5" fill="#b8486b"/>
      <path class="aMouth" d="M52 90 Q60 96 68 90" fill="none" stroke="#b8486b" stroke-width="2.5" stroke-linecap="round"/>`,
    dog: `${shadow}
      <ellipse cx="26" cy="60" rx="13" ry="26" transform="rotate(18 26 60)" fill="url(#mlwDogEar)"/>
      <ellipse cx="94" cy="60" rx="13" ry="26" transform="rotate(-18 94 60)" fill="url(#mlwDogEar)"/>
      <circle cx="60" cy="56" r="34" fill="url(#mlwDog)" stroke="#8a5530" stroke-width="2.5"/>
      <ellipse cx="74" cy="52" rx="11" ry="12" fill="#8a5530" opacity=".5"/>
      ${shine(45, 33)}${eye(47, 52)}${eye(74, 52)}${cheek(37, 67)}${cheek(83, 67)}
      <ellipse cx="60" cy="75" rx="21" ry="16" fill="#fff1df" stroke="#d9a66e" stroke-width="2"/>
      <ellipse cx="60" cy="66" rx="9" ry="6.5" fill="#2b2633"/><circle cx="57" cy="64" r="2" fill="#fff"/>
      <path d="M56 82 Q60 93 64 82 Z" fill="#ff7aa8"/>
      <path class="aMouth" d="M60 72 v5 M51 78 Q60 86 69 78" fill="none" stroke="#2b2633" stroke-width="2.5" stroke-linecap="round"/>`,
    cat: `${shadow}
      <path d="M28 46 L32 12 L55 31 Z" fill="url(#mlwCat)" stroke="#c2621a" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M33 39 L35 21 L48 31 Z" fill="#ffb3c6"/>
      <path d="M92 46 L88 12 L65 31 Z" fill="url(#mlwCat)" stroke="#c2621a" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M87 39 L85 21 L72 31 Z" fill="#ffb3c6"/>
      <ellipse cx="60" cy="60" rx="38" ry="33" fill="url(#mlwCat)" stroke="#c2621a" stroke-width="2.5"/>
      <path d="M60 28 v10 M50 30 l2 9 M70 30 l-2 9" stroke="#d96b16" stroke-width="4" stroke-linecap="round"/>
      ${shine(42, 40)}${eye(46, 57)}${eye(74, 57)}${cheek(35, 70)}${cheek(85, 70)}
      <ellipse cx="53" cy="75" rx="9" ry="7" fill="#fff"/><ellipse cx="67" cy="75" rx="9" ry="7" fill="#fff"/>
      <path d="M56 68 L64 68 L60 73 Z" fill="#ff7aa8" stroke="#e0708f" stroke-width="1" stroke-linejoin="round"/>
      <path class="aMouth" d="M60 73 v3 M54 78 Q57 81 60 77 Q63 81 66 78" fill="none" stroke="#6b3a1a" stroke-width="2" stroke-linecap="round"/>
      <path d="M41 73 L22 69 M41 77 L22 79 M79 73 L98 69 M79 77 L98 79" stroke="#8a4a1a" stroke-width="1.8" stroke-linecap="round"/>`,
    duck: `${shadow}
      <path d="M58 23 Q53 12 60 7 Q62 16 67 12 Q67 20 62 25 Z" fill="url(#mlwDuck)" stroke="#d9a400" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="60" cy="58" r="36" fill="url(#mlwDuck)" stroke="#d9a400" stroke-width="2.5"/>
      ${shine(45, 36)}${eye(46, 52)}${eye(74, 52)}${cheek(36, 66)}${cheek(84, 66)}
      <path d="M42 75 Q60 92 78 75 Q60 82 42 75 Z" fill="#e86a00"/>
      <path class="aBeak" d="M37 72 Q60 61 83 72 Q60 83 37 72 Z" fill="url(#mlwBeak)" stroke="#c25e00" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="54" cy="69" r="1.4" fill="#a84a00"/><circle cx="66" cy="69" r="1.4" fill="#a84a00"/>`,
    sheep: `${shadow}
      <circle cx="60" cy="56" r="34" fill="url(#mlwWool)"/>
      ${ring(60, 56, 33, 13, 12, 'url(#mlwWool)', '#cfd0de')}
      <circle cx="60" cy="56" r="31" fill="url(#mlwWool)"/>
      <ellipse cx="31" cy="62" rx="12" ry="6" transform="rotate(-20 31 62)" fill="url(#mlwSheepFace)"/>
      <ellipse cx="89" cy="62" rx="12" ry="6" transform="rotate(20 89 62)" fill="url(#mlwSheepFace)"/>
      <ellipse cx="60" cy="66" rx="20" ry="25" fill="url(#mlwSheepFace)"/>
      <circle cx="50" cy="41" r="9" fill="url(#mlwWool)"/><circle cx="60" cy="38" r="10" fill="url(#mlwWool)"/><circle cx="70" cy="41" r="9" fill="url(#mlwWool)"/>
      ${shine(42, 30)}
      <g class="aEye"><ellipse cx="52" cy="61" rx="5" ry="6" fill="#fff"/><circle cx="52.5" cy="62" r="3.2" fill="#22202a"/>
        <ellipse cx="68" cy="61" rx="5" ry="6" fill="#fff"/><circle cx="67.5" cy="62" r="3.2" fill="#22202a"/></g>
      ${cheek(47, 72)}${cheek(73, 72)}
      <path class="aMouth" d="M55 77 Q60 81 65 77 M60 80 v3" fill="none" stroke="#22202a" stroke-width="2" stroke-linecap="round"/>`,
    lion: `${shadow}
      <circle cx="60" cy="58" r="40" fill="url(#mlwMane)"/>
      ${ring(60, 58, 38, 14, 13, 'url(#mlwMane)')}
      <circle cx="38" cy="32" r="9" fill="url(#mlwLion)" stroke="#c07a1a" stroke-width="2"/>
      <circle cx="82" cy="32" r="9" fill="url(#mlwLion)" stroke="#c07a1a" stroke-width="2"/>
      <circle cx="60" cy="60" r="30" fill="url(#mlwLion)" stroke="#c07a1a" stroke-width="2.5"/>
      ${shine(48, 42)}${eye(49, 55)}${eye(71, 55)}${cheek(41, 68)}${cheek(79, 68)}
      <ellipse cx="53" cy="72" rx="9" ry="7" fill="#fff1cf"/><ellipse cx="67" cy="72" rx="9" ry="7" fill="#fff1cf"/>
      <path d="M54 64 Q60 61 66 64 L60 70 Z" fill="#7a3b12" stroke-linejoin="round"/>
      <path class="aMouth" d="M60 70 v4 M53 77 Q56.5 80 60 76 Q63.5 80 67 77" fill="none" stroke="#7a3b12" stroke-width="2" stroke-linecap="round"/>`,
    elephant: `${shadow}
      <ellipse cx="27" cy="52" rx="22" ry="27" fill="url(#mlwEle)" stroke="#6d7a94" stroke-width="2.5"/>
      <ellipse cx="29" cy="53" rx="13" ry="17" fill="#ffc0cf" opacity=".8"/>
      <ellipse cx="93" cy="52" rx="22" ry="27" fill="url(#mlwEle)" stroke="#6d7a94" stroke-width="2.5"/>
      <ellipse cx="91" cy="53" rx="13" ry="17" fill="#ffc0cf" opacity=".8"/>
      <ellipse cx="60" cy="50" rx="30" ry="30" fill="url(#mlwEle)" stroke="#6d7a94" stroke-width="2.5"/>
      <path d="M48 66 Q45 75 52 77" fill="none" stroke="#fffaf0" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M72 66 Q75 75 68 77" fill="none" stroke="#fffaf0" stroke-width="4.5" stroke-linecap="round"/>
      <g class="aTrunk">
        <path d="M60 62 C58 80 56 92 64 100 C70 104 77 98 73 93" fill="none" stroke="#6d7a94" stroke-width="18" stroke-linecap="round"/>
        <path d="M60 62 C58 80 56 92 64 100 C70 104 77 98 73 93" fill="none" stroke="#a9b4c8" stroke-width="13" stroke-linecap="round"/>
      </g>
      ${shine(48, 30)}${eye(48, 48)}${eye(72, 48)}${cheek(43, 60)}${cheek(77, 60)}`,
    pig: `${shadow}
      <path d="M29 37 L33 14 L52 28 Z" fill="url(#mlwPig)" stroke="#d96a90" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M91 37 L87 14 L68 28 Z" fill="url(#mlwPig)" stroke="#d96a90" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="60" cy="58" r="35" fill="url(#mlwPig)" stroke="#d96a90" stroke-width="2.5"/>
      ${shine(45, 36)}${eye(46, 50)}${eye(74, 50)}${cheek(35, 64)}${cheek(85, 64)}
      <ellipse class="aSnout" cx="60" cy="68" rx="17" ry="12" fill="url(#mlwSnout)" stroke="#d0577f" stroke-width="2"/>
      <ellipse cx="54" cy="68" rx="3" ry="4.5" fill="#a8325b"/><ellipse cx="66" cy="68" rx="3" ry="4.5" fill="#a8325b"/>
      <path class="aMouth" d="M50 84 Q60 90 70 84" fill="none" stroke="#a8325b" stroke-width="2.5" stroke-linecap="round"/>`,
  };
  const animalSVG = (id) => `<svg viewBox="0 0 120 120" aria-hidden="true">${ART[id]}</svg>`;

  // ---------- Built-in animal sounds ----------
  // Shaped like the real thing (pitch glides, mouth-shape "formants", growl and bleat wobble).
  // A real recording in sounds/animals/ always wins.
  function tone(k, o) {
    const { ac } = k;
    const t = ac.currentTime + (o.at || 0);
    const osc = ac.createOscillator();
    osc.type = o.type || 'sawtooth';
    o.f.forEach(([dt, fr], i) => (i ? osc.frequency.linearRampToValueAtTime(fr, t + dt) : osc.frequency.setValueAtTime(fr, t + dt)));
    const stopAt = t + o.dur + 0.1;
    if (o.vib) {
      const l = ac.createOscillator(); l.frequency.value = o.vib[0];
      const d = ac.createGain(); d.gain.value = o.vib[1];
      l.connect(d); d.connect(osc.frequency); l.start(t); l.stop(stopAt);
    }
    const mix = ac.createGain();
    o.formants.forEach(([fq, q, gn, path]) => {
      const bp = ac.createBiquadFilter();
      bp.type = 'bandpass'; bp.Q.value = q;
      bp.frequency.setValueAtTime(fq, t);
      if (path) path.forEach(([dt, ff]) => bp.frequency.linearRampToValueAtTime(ff, t + dt));
      const g = ac.createGain(); g.gain.value = gn;
      osc.connect(bp); bp.connect(g); g.connect(mix);
    });
    const env = ac.createGain();
    const att = o.attack || 0.05, rel = o.release || 0.15;
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(o.vol, t + att);
    env.gain.setValueAtTime(o.vol, t + Math.max(att, o.dur - rel));
    env.gain.linearRampToValueAtTime(0, t + o.dur);
    if (o.trem) {
      const l = ac.createOscillator(); l.frequency.value = o.trem[0];
      const d = ac.createGain(); d.gain.value = o.trem[1] * o.vol;
      l.connect(d); d.connect(env.gain); l.start(t); l.stop(stopAt);
    }
    mix.connect(env);
    k.out(env, 0);
    osc.start(t); osc.stop(stopAt);
  }
  // Breathy noise that swells and fades (for the lion's roar and the dog's bark).
  function breath(k, o) {
    const { ac } = k;
    const t = ac.currentTime + (o.at || 0);
    const src = ac.createBufferSource();
    src.buffer = k.noiseBuf;
    const f = ac.createBiquadFilter();
    f.type = o.type || 'lowpass'; f.frequency.value = o.freq; f.Q.value = o.q || 0.7;
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(o.vol, t + (o.attack || 0.02));
    g.gain.linearRampToValueAtTime(0, t + o.dur);
    src.connect(f); f.connect(g); k.out(g, 0);
    src.start(t, Math.random()); src.stop(t + o.dur + 0.05);
  }
  const RECIPES = {
    cow(k) { // "mmmooo"
      tone(k, { dur: 1.4, f: [[0, 105], [0.25, 126], [1.0, 118], [1.4, 92]], vib: [5, 3], attack: 0.18, release: 0.35, vol: 1,
        formants: [[350, 2, 1, [[0.3, 720], [1.0, 600], [1.4, 380]]], [1100, 4, 0.35]] });
    },
    dog(k) { // "woof woof"
      [0, 0.32].forEach((at) => {
        tone(k, { at, dur: 0.2, f: [[0, 240], [0.05, 310], [0.2, 170]], attack: 0.008, release: 0.12, vol: 1, formants: [[600, 1.5, 1], [1300, 3, 0.5]] });
        breath(k, { at, dur: 0.14, vol: 0.35, type: 'bandpass', freq: 900, q: 0.8 });
      });
    },
    cat(k) { // "mee-ow"
      tone(k, { dur: 0.85, f: [[0, 520], [0.3, 780], [0.85, 480]], vib: [6, 8], attack: 0.05, release: 0.25, vol: 0.6,
        formants: [[320, 4, 1, [[0.3, 900], [0.85, 420]]], [2300, 6, 0.5, [[0.3, 1300], [0.85, 800]]]] });
    },
    duck(k) { // "quack quack"
      [0, 0.32].forEach((at) => {
        tone(k, { at, dur: 0.24, f: [[0, 330], [0.24, 270]], attack: 0.01, release: 0.08, vol: 0.7, formants: [[1100, 6, 1], [2200, 8, 0.6]] });
        breath(k, { at, dur: 0.2, vol: 0.12, type: 'bandpass', freq: 1800, q: 2 });
      });
    },
    sheep(k) { // "baa-aa" with the bleat wobble
      tone(k, { dur: 0.95, f: [[0, 300], [0.15, 330], [0.95, 290]], vib: [6, 10], trem: [9, 0.55], attack: 0.04, release: 0.2, vol: 0.65,
        formants: [[750, 3, 1], [1250, 4, 0.6], [2600, 6, 0.25]] });
    },
    lion(k) { // growly "rrroar"
      tone(k, { dur: 1.5, f: [[0, 90], [0.4, 130], [1.5, 70]], trem: [22, 0.45], attack: 0.25, release: 0.5, vol: 1,
        formants: [[500, 1.2, 1, [[0.5, 900], [1.5, 400]]], [1400, 3, 0.3]] });
      breath(k, { dur: 1.5, vol: 0.45, freq: 700, attack: 0.3 });
    },
    elephant(k) { // trumpet "pawoo!"
      [1, 1.012].forEach((det) => tone(k, { dur: 1.1, f: [[0, 420 * det], [0.15, 620 * det], [0.8, 600 * det], [1.1, 480 * det]], vib: [7, 18],
        attack: 0.06, release: 0.3, vol: 0.4, formants: [[1200, 2, 1], [2500, 3, 0.6]] }));
    },
    pig(k) { // "oink oink"
      [0, 0.3].forEach((at) => {
        tone(k, { at, dur: 0.22, f: [[0, 190], [0.08, 245], [0.22, 160]], trem: [28, 0.4], attack: 0.02, release: 0.08, vol: 0.85,
          formants: [[800, 5, 1], [1800, 7, 0.4]] });
        breath(k, { at, dur: 0.18, vol: 0.2, freq: 500 });
      });
    },
  };

  // Longest a recording plays (with a soft fade). The pig file is 9s; its grunts are in the first 2.5s.
  const MAX_SECONDS = { pig: 2.5, elephant: 3.2, lion: 2.8 };

  let soundBus = null, lastId = null;
  function stopSound() {
    if (lastId) audio.fade('animals/' + lastId, 0.2);
    if (soundBus) { audio.fadeBus(soundBus, 0.2); soundBus = null; }
  }
  function playSound(id) {
    stopSound();
    lastId = id;
    // A real recording: skip any silence at the start, even out the loudness, keep it short.
    if (audio.play('animals/' + id, 1, 0, MAX_SECONDS[id] || 3.5, { skipSilence: true, normalize: true })) return;
    const k = audio.kit();
    if (!k) return;
    k.startBus();
    RECIPES[id](k);
    soundBus = k.endBus();
  }

  // ---------- The game ----------
  let layer, grid, cards = [], running = false, token = 0, idleTimer = null, cell = 160;

  function lang() { return settings.lang; }
  function nameOf(a) { return a.names[lang()] || a.names.en; }

  function build() {
    if (!document.getElementById('mlwAnimalDefs')) {
      const holder = document.createElement('div');
      holder.id = 'mlwAnimalDefs';
      holder.innerHTML = DEFS;
      document.body.appendChild(holder);
    }
    layer.innerHTML = '<div class="aGrid"></div>';
    grid = layer.firstElementChild;
    cards = ANIMALS.map((a, i) => {
      const el = document.createElement('div');
      el.className = 'aCard';
      el.setAttribute('role', 'button');
      el.style.setProperty('--bg', a.bg);
      el.style.setProperty('--shade', a.shade);
      el.innerHTML = `<div class="aArt" style="animation-delay:${(-i * 0.37).toFixed(2)}s">${animalSVG(a.id)}</div><div class="aName"></div>`;
      grid.appendChild(el);
      return { a, el, art: el.firstElementChild, label: el.lastElementChild, lastTap: 0 };
    });
  }

  function layout() {
    if (!grid) return;
    const W = window.innerWidth, H = window.innerHeight;
    const top = Math.max(78, H * 0.1);
    const pad = clamp(Math.min(W, H) * 0.035, 12, 30);
    const n = cards.length;
    let best = { s: 0, cols: 1 };
    for (let cols = 1; cols <= n; cols++) {
      const rows = Math.ceil(n / cols);
      const s = Math.min((W - pad * 2 - pad * (cols - 1)) / cols, (H - top - pad - pad * (rows - 1)) / rows);
      if (s > best.s) best = { s, cols };
    }
    cell = Math.min(best.s, 300);
    grid.style.gridTemplateColumns = `repeat(${best.cols}, ${cell}px)`;
    grid.style.gap = pad + 'px';
    grid.style.top = top + 'px';
    grid.style.height = `calc(100% - ${top + pad}px)`;
    layer.style.setProperty('--cell', cell + 'px');
  }

  function labels() { cards.forEach((c) => { c.label.textContent = nameOf(c.a); c.el.setAttribute('aria-label', nameOf(c.a)); }); }

  function restart(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  // Tap: bounce + sparkle, say the name, THEN the animal's sound (never on top of each other).
  function tapCard(c) {
    const now = performance.now();
    if (now - c.lastTap < 350) return; // ignore accidental double taps
    c.lastTap = now;
    resetIdle();
    const my = ++token;
    stopSound();
    voice.stop();
    restart(c.el, 'pressed');
    restart(c.art, 'talk');
    const r = c.el.getBoundingClientRect();
    fx.burst(r.left + r.width / 2, r.top + r.height * 0.4, c.a.shade, 12);
    showBubble(c);
    let fired = false;
    const go = () => {
      if (fired || my !== token || !running || window.MLW.isPaused()) return;
      fired = true;
      restart(c.art, 'sing');
      playSound(c.a.id);
    };
    const spoke = voice.sayLang(nameOf(c.a), lang(), () => setTimeout(go, 120));
    setTimeout(go, spoke ? 2600 : 150); // safety net if the voice is off or never finishes
  }

  function showBubble(c) {
    const old = c.el.querySelector('.aBubble');
    if (old) old.remove();
    const b = document.createElement('div');
    b.className = 'aBubble';
    b.textContent = nameOf(c.a);
    c.el.appendChild(b);
    setTimeout(() => b.remove(), 1900);
  }

  // Forgiving touch: the nearest card to the finger is the one tapped.
  function onDown(e) {
    if (!running) return;
    let best = null, bd = Infinity;
    for (const c of cards) {
      const r = c.el.getBoundingClientRect();
      const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      if (d < bd) { bd = d; best = c; }
    }
    if (best && bd < cell * 0.85) { e.preventDefault(); tapCard(best); }
  }

  // If nobody taps for a while, one animal waves hello.
  function resetIdle() {
    clearTimeout(idleTimer);
    if (running) idleTimer = setTimeout(hint, 12000);
  }
  function hint() {
    if (!running || window.MLW.isPaused()) return;
    const c = pick(cards);
    restart(c.art, 'wave');
    voice.sayLang(SAY.look[lang()](nameOf(c.a)), lang());
    resetIdle();
  }

  window.MLW.registerGame('animals', {
    label: 'Animal sounds',
    cardBg: 'radial-gradient(circle at 35% 30%, #e9ffd9, #8fdc6a 55%, #4cb84a 100%)',
    cardArt: (artAt) =>
      artAt(animalSVG('cow'), 0, 2, 56) + artAt(animalSVG('duck'), 46, 4, 52) + artAt(animalSVG('pig'), 22, 44, 56),
    init(el) {
      layer = el;
      build();
      layer.addEventListener('pointerdown', onDown);
      window.addEventListener('resize', layout);
    },
    start() {
      running = true;
      labels();
      layout();
      cards.forEach((c, i) => { c.el.style.animationDelay = (i * 0.06).toFixed(2) + 's'; restart(c.el, 'enter'); });
      setTimeout(() => { if (running) voice.sayLang(SAY.intro[lang()], lang()); }, 700);
      resetIdle();
    },
    stop() {
      running = false;
      token++;
      clearTimeout(idleTimer);
      stopSound();
    },
    pause() { clearTimeout(idleTimer); stopSound(); token++; },
    resume() { resetIdle(); },
  });
})();
