// YugaVerse Kids - Copyright (c) 2026 mayurj476. All rights reserved.
// Not for copying, reuse or redistribution without written permission. See LICENSE.
(() => {
  'use strict';

  const APP_VERSION = '17'; // shown in the corner of the start screen
  let updateReady = false;
  let appPaused = false; // true while the app is minimized, hidden or not in focus

  const $ = (s) => document.querySelector(s);
  const board = $('#board');
  const trayTop = $('#trayTop');
  const trayBottom = $('#trayBottom');
  const starsEl = $('#stars');
  const hand = $('#hintHand');
  const celebrateEl = $('#celebrate');
  const yayEl = $('#yay');
  const cat = $('#cat');
  const girl = $('#girl');
  const startEl = $('#start');
  const canvas = $('#confetti');
  const ctx2d = canvas.getContext('2d');

  // ---------- Helpers ----------
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };
  // Parent settings. Kept on this device only; nothing is ever uploaded.
  const settings = (() => {
    const s = Object.assign({ lang: 'en', voice: true }, store.get('mlw_settings', {}));
    return {
      get lang() { return s.lang; },
      get voiceOn() { return s.voice !== false; },
      set(key, value) { s[key] = value; store.set('mlw_settings', s); },
    };
  })();

  // Restart a one-shot CSS animation class on an element.
  const ONE_SHOT = ['popin', 'happy', 'wiggle', 'no'];
  function playAnim(el, cls, delay = 0) {
    ONE_SHOT.forEach((c) => el.classList.remove(c));
    void el.offsetWidth;
    el.style.animationDelay = delay ? delay + 's' : '';
    el.classList.add(cls);
    const done = () => { el.classList.remove(cls); el.style.animationDelay = ''; };
    el.addEventListener('animationend', function h(e) {
      if (e.target !== el) return;
      el.removeEventListener('animationend', h);
      done();
    });
  }

  // ---------- Shapes ----------
  function polyPath(n, r, cx, cy, rotDeg, innerR) {
    const steps = innerR ? n * 2 : n;
    const pts = [];
    for (let i = 0; i < steps; i++) {
      const rr = innerR && i % 2 ? innerR : r;
      const a = (rotDeg + (i * 360) / steps) * Math.PI / 180;
      pts.push((cx + rr * Math.cos(a)).toFixed(2) + ' ' + (cy + rr * Math.sin(a)).toFixed(2));
    }
    return 'M' + pts.join(' L') + ' Z';
  }

  // face: [x, y, scale] where the cute face sits inside the 100x100 shape box
  const SHAPES = [
    { id: 'circle',   name: 'Circle',   d: 'M4 50 A46 46 0 1 0 96 50 A46 46 0 1 0 4 50 Z', face: [50, 50, 1] },
    { id: 'square',   name: 'Square',   d: 'M20 6 H80 Q94 6 94 20 V80 Q94 94 80 94 H20 Q6 94 6 80 V20 Q6 6 20 6 Z', face: [50, 50, 1] },
    { id: 'triangle', name: 'Triangle', d: 'M50 6 L95 90 L5 90 Z', face: [50, 64, 0.8] },
    { id: 'star',     name: 'Star',     d: polyPath(5, 49, 50, 54, -90, 22), face: [50, 56, 0.6] },
    { id: 'heart',    name: 'Heart',    d: 'M50 92 C50 92 6 64 6 34 C6 16 20 6 33 6 C42 6 48 11 50 18 C52 11 58 6 67 6 C80 6 94 16 94 34 C94 64 50 92 50 92 Z', face: [50, 42, 0.85] },
    { id: 'diamond',  name: 'Diamond',  d: 'M50 3 L95 50 L50 97 L5 50 Z', face: [50, 50, 0.75] },
    { id: 'hexagon',  name: 'Hexagon',  d: polyPath(6, 47, 50, 50, 0), face: [50, 50, 0.95] },
    { id: 'plus',     name: 'Plus',     d: 'M36 6 H64 V36 H94 V64 H64 V94 H36 V64 H6 V36 H36 Z', face: [50, 50, 0.6] },
    { id: 'moon',     name: 'Moon',     d: 'M51.45 6.02 A44 44 0 1 0 91.17 65.56 A36 36 0 1 1 51.45 6.02 Z', face: [24, 54, 0.45] },
  ];

  const COLORS = [
    { c: '#FF4D6D', d: '#B3123A' }, // red
    { c: '#FF9F1C', d: '#B35F00' }, // orange
    { c: '#FFD60A', d: '#B38F00' }, // yellow
    { c: '#38D46A', d: '#18803A' }, // green
    { c: '#00C2E0', d: '#00788C' }, // teal
    { c: '#3A86FF', d: '#1A4FB3' }, // blue
    { c: '#A45DFF', d: '#5E25B3' }, // purple
    { c: '#FF5DC8', d: '#B3207F' }, // pink
  ];

  const CAT_FURS = [
    { fur: '#FFA94D', line: '#B85C00', belly: '#FFE8CC', stripe: '#E8590C' }, // ginger
    { fur: '#B8C4CC', line: '#4F6470', belly: '#F1F4F6', stripe: '#7E909C' }, // grey
    { fur: '#FFB8D6', line: '#B8336A', belly: '#FFEAF3', stripe: '#F06292' }, // pink
    { fur: '#FFE08A', line: '#A87A00', belly: '#FFF8DC', stripe: '#F5B700' }, // golden
  ];

  const PHRASES = ['Yay!', 'Great job!', 'Wow!', 'Super!', 'Hooray!', 'Well done!'];

  let uid = 0;
  function faceSVG(f) {
    const [x, y, s] = f;
    const delay = rand(0, 4).toFixed(2);
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <g class="blink" style="animation-delay:${delay}s">
        <ellipse cx="-14" cy="-6" rx="7.5" ry="9" fill="#fff"/><circle cx="-13" cy="-5" r="4.8" fill="#222"/><circle cx="-11.4" cy="-7" r="1.7" fill="#fff"/>
        <ellipse cx="14" cy="-6" rx="7.5" ry="9" fill="#fff"/><circle cx="15" cy="-5" r="4.8" fill="#222"/><circle cx="16.6" cy="-7" r="1.7" fill="#fff"/>
      </g>
      <ellipse cx="-23" cy="7" rx="5.5" ry="3.5" fill="#ff3d7f" opacity=".35"/>
      <ellipse cx="23" cy="7" rx="5.5" ry="3.5" fill="#ff3d7f" opacity=".35"/>
      <path d="M-9 7 Q0 17 9 7" fill="none" stroke="#222" stroke-width="3.5" stroke-linecap="round"/>
    </g>`;
  }
  function shapeSVG(def, color) {
    const id = 'clip' + (uid++);
    return `<svg viewBox="-6 -6 112 112">
      <defs><clipPath id="${id}"><path d="${def.d}"/></clipPath></defs>
      <path d="${def.d}" fill="${color.c}" stroke="${color.d}" stroke-width="5" stroke-linejoin="round"/>
      <g clip-path="url(#${id})">
        <ellipse cx="30" cy="20" rx="34" ry="15" fill="#fff" opacity=".38" transform="rotate(-25 30 20)"/>
      </g>
      ${faceSVG(def.face)}
    </svg>`;
  }
  function holeSVG(def, color) {
    return `<svg viewBox="-6 -6 112 112">
      <path d="${def.d}" fill="${color.c}" fill-opacity=".25"/>
      <path class="outline" d="${def.d}" fill="none" stroke="${color.d}" stroke-width="4.5"
        stroke-dasharray="9 7" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  // ---------- Game 3: Letters ----------
  // In order, two at a time: A+B, C+D, ... Y+Z. Each letter has a word and a picture.
  const XYLOPHONE = `<svg viewBox="0 0 100 100" width="1em" height="1em">
    <rect x="8" y="30" width="12" height="44" rx="4" fill="#FF4D6D"/><rect x="24" y="26" width="12" height="52" rx="4" fill="#FF9F1C"/>
    <rect x="40" y="22" width="12" height="60" rx="4" fill="#FFD60A"/><rect x="56" y="18" width="12" height="68" rx="4" fill="#38D46A"/>
    <rect x="72" y="14" width="12" height="76" rx="4" fill="#3A86FF"/>
    <rect x="4" y="44" width="84" height="5" rx="2" fill="#8d5a3b"/><rect x="4" y="60" width="84" height="5" rx="2" fill="#8d5a3b"/>
    <path d="M30 10 L58 34" stroke="#8d5a3b" stroke-width="4" stroke-linecap="round"/><circle cx="60" cy="36" r="6" fill="#A45DFF"/>
  </svg>`;
  // How each letter is spoken. Voices read a lone capital "A" as "capital A", so spell the sound.
  const LETTER_SAY = {
    A: 'ay', B: 'bee', C: 'see', D: 'dee', E: 'ee', F: 'eff', G: 'gee', H: 'aitch', I: 'eye',
    J: 'jay', K: 'kay', L: 'el', M: 'em', N: 'en', O: 'oh', P: 'pee', Q: 'cue', R: 'are',
    S: 'ess', T: 'tee', U: 'you', V: 'vee', W: 'double you', X: 'ex', Y: 'why', Z: 'zee',
  };
  const LETTERS = [
    ['A', 'Apple', '🍎'], ['B', 'Ball', '⚽'], ['C', 'Cat', '🐱'], ['D', 'Dog', '🐶'],
    ['E', 'Elephant', '🐘'], ['F', 'Fish', '🐟'], ['G', 'Grapes', '🍇'], ['H', 'Hat', '🎩'],
    ['I', 'Ice cream', '🍦'], ['J', 'Juice', '🧃'], ['K', 'Kite', '🪁'], ['L', 'Lion', '🦁'],
    ['M', 'Monkey', '🐵'], ['N', 'Nose', '👃'], ['O', 'Orange', '🍊'], ['P', 'Pig', '🐷'],
    ['Q', 'Queen', '👸'], ['R', 'Rabbit', '🐰'], ['S', 'Sun', '☀️'], ['T', 'Tree', '🌳'],
    ['U', 'Umbrella', '☂️'], ['V', 'Van', '🚐'], ['W', 'Watermelon', '🍉'], ['X', 'Xylophone', XYLOPHONE],
    ['Y', 'Yo-yo', '🪀'], ['Z', 'Zebra', '🦓'],
  ].map(([letter, word, pic]) => ({ id: letter, letter, name: LETTER_SAY[letter], word, pic }));
  const LETTER_FONT = `'Baloo 2', 'Chalkboard SE', 'Comic Sans MS', sans-serif`;
  function letterSVG(def, color) {
    return `<svg viewBox="-6 -6 112 112">
      <text x="50" y="52" text-anchor="middle" dominant-baseline="central" font-size="100" font-weight="800"
        font-family="${LETTER_FONT}" fill="${color.c}" stroke="${color.d}" stroke-width="6"
        stroke-linejoin="round" paint-order="stroke">${def.letter}</text>
    </svg>`;
  }
  // Light, solid version of a colour (so the dashed outline can sit underneath the fill).
  function tint(hex, amount = 0.72) {
    const n = parseInt(hex.slice(1), 16);
    const mix = (c) => Math.round(c + (255 - c) * amount);
    return `rgb(${mix(n >> 16)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
  }
  function letterHoleSVG(def, color) {
    // The stroke is painted first and the solid fill on top, so only the outer edge of the dashes shows.
    return `<svg viewBox="-6 -6 112 112">
      <text x="50" y="52" text-anchor="middle" dominant-baseline="central" font-size="100" font-weight="800"
        font-family="${LETTER_FONT}" fill="${tint(color.c)}" stroke="${color.d}" stroke-width="7"
        stroke-dasharray="8 7" stroke-linecap="round" stroke-linejoin="round" paint-order="stroke">${def.letter}</text>
    </svg>`;
  }

  // ---------- Sound ----------
  // Everything plays through a little "room" (reverb) so it sounds warm instead of beepy.
  // Real recordings win: drop e.g. sounds/clap.mp3 into the sounds folder and it is used instead.
  const audio = (() => {
    const SAMPLE_NAMES = ['pickup', 'place', 'wrong', 'clap', 'applause', 'cheer', 'pop', 'whoosh', 'meow', 'tap', 'burst', 'crackle', 'dance', 'laugh'];
    const samples = {};
    let ac = null, master = null, reverb = null, noiseBuf = null;
    let muted = store.get('sf_muted', false);

    function impulse(seconds, decay) {
      const len = Math.floor(ac.sampleRate * seconds);
      const buf = ac.createBuffer(2, len, ac.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
      return buf;
    }

    // Looks for sounds/<name>.mp3, then .wav, then .m4a.
    function loadSamples(names = SAMPLE_NAMES) {
      if (!window.fetch || !location.protocol.startsWith('http')) return;
      const EXTS = ['mp3', 'wav', 'm4a'];
      names.forEach((name) => {
        const tryExt = (i) => {
          if (i >= EXTS.length) return; // no recording: use the built-in sound
          fetch(`sounds/${name}.${EXTS[i]}`)
            .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
            .then((data) => new Promise((ok, fail) => ac.decodeAudioData(data, ok, fail)))
            .then((buf) => { samples[name] = buf; meta[name] = measure(buf); })
            .catch(() => tryExt(i + 1));
        };
        tryExt(0);
      });
    }

    function unlock() {
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ac = new AC();
        const comp = ac.createDynamicsCompressor();
        comp.threshold.value = -16; comp.ratio.value = 4;
        comp.connect(ac.destination);
        master = ac.createGain();
        master.gain.value = muted ? 0 : 0.9;
        master.connect(comp);
        reverb = ac.createConvolver();
        reverb.buffer = impulse(1.8, 3.2);
        const wet = ac.createGain();
        wet.gain.value = 0.32;
        reverb.connect(wet); wet.connect(master);
        noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        loadSamples();
      }
      if (ac.state === 'suspended') ac.resume();
    }

    const live = () => ac && !appPaused;

    // Route a node to the speakers (dry) and into the room (wet), optionally panned.
    function out(node, send = 0.3, pan = 0) {
      let n = node;
      if (pan && ac.createStereoPanner) {
        const p = ac.createStereoPanner();
        p.pan.value = pan;
        n.connect(p); n = p;
      }
      if (bus) { n.connect(bus); return; }
      n.connect(master);
      if (send) { const s = ac.createGain(); s.gain.value = send; n.connect(s); s.connect(reverb); }
    }
    let bus = null, danceBus = null;
    function env(param, t, peak, attack, decay) {
      param.setValueAtTime(0, t);
      param.linearRampToValueAtTime(peak, t + attack);
      param.setTargetAtTime(0, t + attack, decay / 4);
    }
    // Loudest point, and when the sound first gets going (to skip silence at the start).
    const meta = {};
    function measure(buf) {
      const d = buf.getChannelData(0);
      let peak = 0;
      for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > peak) peak = v; }
      const th = peak * 0.08;
      let first = 0;
      while (first < d.length && Math.abs(d[first]) <= th) first++;
      return { peak: peak || 1, lead: first / buf.sampleRate };
    }
    // Play a recording. maxDur (seconds) trims long files with a gentle fade at the end.
    // opts.skipSilence starts right where the sound begins; opts.normalize evens out loudness.
    function sample(name, vol = 1, at = 0, maxDur = 0, opts = {}) {
      const buf = samples[name];
      if (!live() || !buf) return false;
      const m = meta[name] || { peak: 1, lead: 0 };
      const offset = opts.skipSilence ? Math.max(0, m.lead - 0.04) : 0;
      if (opts.normalize) vol *= Math.min(2.5, 0.9 / m.peak);
      const src = ac.createBufferSource();
      src.buffer = buf;
      const g = ac.createGain();
      const t = ac.currentTime + at;
      g.gain.setValueAtTime(vol, t);
      const trim = maxDur && maxDur < buf.duration - offset;
      if (trim) {
        g.gain.setValueAtTime(vol, t + maxDur - 0.5);
        g.gain.linearRampToValueAtTime(0, t + maxDur);
      }
      src.connect(g); g.connect(master);
      src.start(t, offset);
      if (trim) src.stop(t + maxDur + 0.05);
      playing[name] = { src, g };
      src.onended = () => { if (playing[name] && playing[name].src === src) delete playing[name]; };
      return true;
    }
    const playing = {};
    // Gently fade out a recording that is still playing (e.g. long applause).
    function fadeOut(name, secs = 0.6) {
      const p = playing[name];
      if (!ac || !p) return;
      const t = ac.currentTime;
      p.g.gain.setValueAtTime(p.g.gain.value, t);
      p.g.gain.linearRampToValueAtTime(0, t + secs);
      p.src.stop(t + secs + 0.05);
      delete playing[name];
    }

    // Filtered noise burst: the raw material for claps, pops and whooshes.
    function noise(at, o = {}) {
      const { dur = 0.05, vol = 0.5, type = 'bandpass', freq = 1200, q = 1, send = 0.2, pan = 0, attack = 0.001 } = o;
      const t = ac.currentTime + at;
      const src = ac.createBufferSource();
      src.buffer = noiseBuf;
      const f = ac.createBiquadFilter();
      f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ac.createGain();
      env(g.gain, t, vol, attack, dur);
      src.connect(f); f.connect(g); out(g, send, pan);
      src.start(t, Math.random() * 1.2);
      src.stop(t + attack + dur * 1.5 + 0.05);
    }
    // Wooden marimba note: a sine with the marimba's 4x overtone and a soft mallet knock.
    function mallet(freq, at = 0, o = {}) {
      const { vol = 0.35, decay = 0.9, send = 0.25, pan = 0 } = o;
      const t = ac.currentTime + at;
      const bus = ac.createGain();
      out(bus, send, pan);
      [[1, 1, decay], [3.93, 0.3, decay * 0.22], [9.2, 0.07, decay * 0.07]].forEach(([ratio, amp, d]) => {
        if (freq * ratio > 12000) return;
        const osc = ac.createOscillator();
        osc.frequency.value = freq * ratio;
        const g = ac.createGain();
        env(g.gain, t, amp * vol, 0.003, d);
        osc.connect(g); g.connect(bus);
        osc.start(t); osc.stop(t + d + 0.2);
      });
      noise(at, { dur: 0.012, vol: vol * 0.25, freq: freq * 2, q: 2, send: 0, pan });
    }
    // Glockenspiel / bell sparkle.
    function bell(freq, at = 0, o = {}) {
      const { vol = 0.14, decay = 1.6, send = 0.45, pan = 0 } = o;
      const t = ac.currentTime + at;
      const bus = ac.createGain();
      out(bus, send, pan);
      [[1, 1, decay], [2.76, 0.45, decay * 0.5], [5.4, 0.22, decay * 0.25], [8.93, 0.1, decay * 0.15]].forEach(([ratio, amp, d]) => {
        if (freq * ratio > 14000) return;
        const osc = ac.createOscillator();
        osc.frequency.value = freq * ratio;
        const g = ac.createGain();
        env(g.gain, t, amp * vol, 0.002, d);
        osc.connect(g); g.connect(bus);
        osc.start(t); osc.stop(t + d + 0.2);
      });
    }
    // Water-drop "bloop": a sine that quickly bends up.
    function bubble(at = 0, o = {}) {
      const { from = 350, to = 900, vol = 0.22, dur = 0.12, send = 0.2, pan = 0 } = o;
      const t = ac.currentTime + at;
      const osc = ac.createOscillator();
      osc.frequency.setValueAtTime(from, t);
      osc.frequency.exponentialRampToValueAtTime(to, t + dur * 0.6);
      const g = ac.createGain();
      env(g.gain, t, vol, 0.005, dur);
      osc.connect(g); out(g, send, pan);
      osc.start(t); osc.stop(t + dur + 0.2);
    }
    let burstCount = 0;
    // Slide whistle: a pure tone gliding up with a little wobble (vibrato).
    function whistle(at, from, to) {
      const t = ac.currentTime + at;
      const osc = ac.createOscillator();
      osc.frequency.setValueAtTime(from, t);
      osc.frequency.exponentialRampToValueAtTime(to, t + 0.38);
      const lfo = ac.createOscillator();
      lfo.frequency.value = 9;
      const depth = ac.createGain();
      depth.gain.value = from * 0.04;
      lfo.connect(depth); depth.connect(osc.frequency);
      const g = ac.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.04);
      g.gain.setValueAtTime(0.16, t + 0.3);
      g.gain.linearRampToValueAtTime(0, t + 0.45);
      osc.connect(g); out(g, 0.3);
      osc.start(t); lfo.start(t); osc.stop(t + 0.5); lfo.stop(t + 0.5);
    }
    // Kick drum: a sine that drops quickly in pitch.
    function kick(at) {
      const t = ac.currentTime + at;
      const osc = ac.createOscillator();
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.15);
      const g = ac.createGain();
      env(g.gain, t, 0.8, 0.003, 0.22);
      osc.connect(g); out(g, 0);
      osc.start(t); osc.stop(t + 0.3);
    }
    // One real-sounding hand clap: 3-4 skin slaps a few ms apart, then a short ring.
    function clapOnce(at = 0, o = {}) {
      const { vol = 0.9, pan = 0, send = 0.35 } = o;
      const slaps = 3 + (Math.random() < 0.5 ? 1 : 0);
      const tone = rand(1000, 1400);
      let off = 0;
      for (let i = 0; i < slaps; i++) {
        const last = i === slaps - 1;
        noise(at + off, { dur: last ? rand(0.07, 0.1) : 0.01, vol: vol * (last ? 1 : 0.75), freq: tone * rand(0.95, 1.05), q: 1.2, send, pan });
        if (!last) off += rand(0.006, 0.011);
      }
      noise(at + off, { dur: 0.03, vol: vol * 0.4, type: 'lowpass', freq: 600, q: 0.7, send: 0.1, pan }); // palm thump
    }

    return {
      unlock,
      isMuted: () => muted,
      setMuted(m) {
        muted = m; store.set('sf_muted', m);
        if (master) master.gain.value = m ? 0 : 0.9;
      },
      // Touching empty space: a tiny water-drop so every touch gets an answer.
      tap() {
        if (!live() || sample('tap', 0.6)) return;
        bubble(0, { from: rand(500, 700), to: rand(1100, 1500), vol: 0.12, dur: 0.09 });
      },
      pickup(i = 0) {
        if (!live() || sample('pickup')) return;
        const base = [392, 440, 494, 523, 587][i % 5];
        bubble(0, { from: base * 0.7, to: base * 2, vol: 0.2 });
        mallet(base * 2, 0.04, { vol: 0.18, decay: 0.5 });
      },
      // Getting close to the right hole: a soft twinkle that says "yes, here!"
      near() {
        if (!live()) return;
        bell(1568, 0, { vol: 0.07 });
        bell(2093, 0.07, { vol: 0.06 });
      },
      place(n) {
        if (!live() || sample('place')) return;
        const chords = [[523.25, 659.25], [659.25, 783.99], [783.99, 1046.5]];
        const [a, b] = chords[clamp(n - 1, 0, 2)];
        noise(0, { dur: 0.04, vol: 0.35, type: 'lowpass', freq: 900, send: 0.1 }); // soft "thunk" into the hole
        mallet(a, 0.02, { vol: 0.4 });
        mallet(b, 0.11, { vol: 0.35 });
        [0, 1, 2, 3].forEach((k) => bell(b * 2 * Math.pow(1.122, k), 0.2 + k * 0.06, { vol: 0.07, pan: -0.4 + k * 0.25 }));
      },
      // Friendly "uh-oh": two marimba notes stepping down.
      wrong() {
        if (!live() || sample('wrong')) return;
        mallet(392, 0, { vol: 0.32, decay: 0.6 });
        mallet(311.13, 0.18, { vol: 0.3, decay: 0.8 });
      },
      clap() {
        if (!live() || sample('clap')) return;
        clapOnce(0, { pan: rand(-0.1, 0.1) });
      },
      // A small happy crowd clapping all around.
      applause(dur = 3) {
        if (!live() || sample('applause', 0.7)) return;
        for (let p = 0; p < 10; p++) {
          const rate = rand(3.5, 6), pan = rand(-0.8, 0.8), tone = rand(800, 2400), loud = rand(0.4, 1);
          let t = rand(0, 0.3);
          while (t < dur) {
            const fade = Math.max(0, Math.min(1, t / 0.4, (dur - t) / 1));
            noise(t, { dur: rand(0.03, 0.06), vol: 0.22 * loud * fade * rand(0.7, 1), freq: tone * rand(0.9, 1.1), q: rand(0.8, 1.6), send: 0.5, pan });
            t += (1 / rate) * rand(0.85, 1.15);
          }
        }
      },
      fanfare() {
        if (!live()) return;
        sample('cheer', 0.8);
        const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, E6 = 1318.5;
        [[C5, 0], [E5, 0.1], [G5, 0.2], [C6, 0.3]].forEach(([f, t]) => mallet(f, t, { vol: 0.32, decay: 0.5 }));
        [G5, C6, E6].forEach((f) => mallet(f, 0.5, { vol: 0.26, decay: 1.4 }));
        mallet(130.81, 0.5, { vol: 0.35, decay: 1.4 });
        [0, 1, 2, 3, 4, 5].forEach((k) => bell(C6 * Math.pow(2, k / 5), 0.55 + k * 0.05, { vol: 0.05, pan: -0.6 + k * 0.24 }));
      },
      whoosh() {
        if (!live() || sample('whoosh', 0.6)) return;
        const t = ac.currentTime;
        const src = ac.createBufferSource();
        src.buffer = noiseBuf;
        const f = ac.createBiquadFilter();
        f.type = 'bandpass'; f.Q.value = 1.5;
        f.frequency.setValueAtTime(300, t);
        f.frequency.exponentialRampToValueAtTime(2500, t + 0.45);
        const g = ac.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.18, t + 0.25);
        g.gain.linearRampToValueAtTime(0, t + 0.5);
        src.connect(f); f.connect(g); out(g, 0.3);
        src.start(t, Math.random()); src.stop(t + 0.55);
      },
      // Each shape makes a little "bloop" as it pops onto the screen.
      appear(i) {
        if (!live()) return;
        bubble(0, { from: 300 + i * 80, to: 700 + i * 160, vol: 0.14, dur: 0.14, pan: (i - 1) * 0.5 });
      },
      balloonPop() {
        if (!live() || sample('pop')) return;
        noise(0, { dur: 0.03, vol: 0.9, type: 'highpass', freq: 1200, q: 0.5, send: 0.3 });
        noise(0, { dur: 0.08, vol: 0.5, type: 'lowpass', freq: 250, q: 0.8, send: 0.1 });
      },
      // Balloon burst: big rubbery POP, firework crackle, then a happy tune.
      // Bigger numbers play higher notes; the tune style rotates so it never gets boring.
      burst(n, crackleTimes) {
        if (!live()) return;
        if (!sample('burst')) {
          noise(0, { dur: 0.025, vol: 1, type: 'highpass', freq: 900, q: 0.4, send: 0.35 });   // crack
          noise(0.003, { dur: 0.05, vol: 0.5, type: 'bandpass', freq: 2600, q: 0.8, send: 0.3 }); // rubber snap
          noise(0, { dur: 0.14, vol: 0.65, type: 'lowpass', freq: 170, q: 0.9, send: 0.15 });  // thump
        }
        if (samples.crackle) fadeOut('crackle', 0.15);
        if (!sample('crackle', 0.8, 0.05, 2)) {
          crackleTimes.forEach((t) => noise(t, {
            dur: rand(0.003, 0.012), vol: rand(0.15, 0.45), type: 'highpass', freq: rand(2500, 6500), q: 0.7, send: 0.25, pan: rand(-0.7, 0.7),
          }));
        }
        const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
        const base = 261.63 * Math.pow(2, PENTA[clamp(n - 1, 0, 9)] / 12);
        const step = (k) => base * Math.pow(2, PENTA[k % PENTA.length] / 12) * (k >= PENTA.length ? 2 : 1);
        const style = (burstCount++) % 3;
        if (style === 0) {        // twinkly bells running up
          [0, 1, 2, 3, 4].forEach((k) => bell(step(k) * 2, 0.08 + k * 0.06, { vol: 0.1, pan: -0.5 + k * 0.25 }));
        } else if (style === 1) { // "wheee!" slide whistle
          whistle(0.06, base * 1.5, base * 5);
          bell(base * 4, 0.42, { vol: 0.08 });
        } else {                  // bouncy marimba triplet
          [0, 2, 4].forEach((k, i) => mallet(step(k) * 2, 0.06 + i * 0.09, { vol: 0.3, decay: 0.6 }));
          bell(step(5) * 2, 0.34, { vol: 0.08 });
        }
      },
      // A bouncy 2-bar dance tune (120 bpm) for the dancing girl: kick, claps, hi-hat, bass and marimba.
      dance() {
        if (!live() || sample('dance', 0.8)) return;
        bus = ac.createGain();
        bus.connect(master);
        const room = ac.createGain();
        room.gain.value = 0.22;
        bus.connect(room); room.connect(reverb);
        const beat = 0.5;
        const bass = [130.81, 130.81, 110, 110, 87.31, 87.31, 98, 98];
        for (let i = 0; i < 8; i++) {
          const t = i * beat;
          kick(t);
          if (i % 2 === 1) clapOnce(t, { vol: 0.45, send: 0 });
          noise(t + beat / 2, { dur: 0.03, vol: 0.12, type: 'highpass', freq: 7000, q: 0.7, send: 0 });
          mallet(bass[i], t, { vol: 0.32, decay: 0.35, send: 0 });
        }
        const E5 = 659.25, G5 = 783.99, A5 = 880, D5 = 587.33, C5 = 523.25, C6 = 1046.5;
        [E5, G5, A5, G5, E5, D5, C5, D5, E5, G5, A5, C6, A5, G5, E5, G5].forEach((f, k) =>
          mallet(f, k * beat / 2, { vol: 0.22, decay: 0.3, send: 0, pan: k % 2 ? 0.25 : -0.25 }));
        bell(C6 * 2, 3.5, { vol: 0.08, send: 0 });
        danceBus = bus;
        bus = null;
      },
      meow() { return sample('meow'); },
      laugh(maxDur = 4) { return sample('laugh', 0.9, 0.2, maxDur); },
      has: (name) => !!samples[name],
      // ---- tools for the game files (games/*.js) ----
      registerSamples(names) {
        const fresh = names.filter((n) => !SAMPLE_NAMES.includes(n));
        fresh.forEach((n) => SAMPLE_NAMES.push(n));
        if (ac && fresh.length) loadSamples(fresh);
      },
      play: (name, vol, at, maxDur, opts) => sample(name, vol, at, maxDur, opts),
      fade: (name, secs) => fadeOut(name, secs),
      // Building blocks for a game's own sounds. Everything made between startBus() and
      // endBus() goes into one bus, so it can be faded out at once with fadeBus().
      kit() {
        if (!live()) return null;
        return {
          ac, noiseBuf, out, env, noise,
          startBus() {
            bus = ac.createGain();
            bus.connect(master);
            const room = ac.createGain();
            room.gain.value = 0.22;
            bus.connect(room); room.connect(reverb);
            return bus;
          },
          endBus() { const b = bus; bus = null; return b; },
        };
      },
      fadeBus(b, secs = 0.25) {
        if (!ac || !b) return;
        const t = ac.currentTime;
        b.gain.setValueAtTime(b.gain.value, t);
        b.gain.linearRampToValueAtTime(0, t + secs);
        setTimeout(() => b.disconnect(), secs * 1000 + 100);
      },
      // Freeze / unfreeze everything that is already playing.
      sleep() { if (ac && ac.state === 'running') ac.suspend().catch(() => {}); },
      wake() { if (ac && ac.state !== 'running') ac.resume().catch(() => {}); },
      endCelebration() {
        ['applause', 'cheer', 'dance', 'laugh'].forEach((n) => fadeOut(n));
        if (danceBus && ac) {
          const b = danceBus, t = ac.currentTime;
          danceBus = null;
          b.gain.setValueAtTime(b.gain.value, t);
          b.gain.linearRampToValueAtTime(0, t + 0.3);
          setTimeout(() => b.disconnect(), 400);
        }
      },
    };
  })();

  // ---------- Voice ----------
  // Picks the most natural voice the device has (Edge "Natural" voices, Siri / Enhanced voices
  // on iPad, Google voices in Chrome) and avoids the novelty and robot ones.
  const voice = (() => {
    const synth = window.speechSynthesis;
    let chosen = null;
    const BAD = /Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Junior|Ralph|Fred|Eddy|Flo\b|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley|Kathy/i;
    function score(v) {
      if (!/^en/i.test(v.lang)) return -100;
      if (BAD.test(v.name)) return -50;
      let s = 0;
      if (/Natural|Neural/i.test(v.name)) s += 12;
      if (/Premium|Enhanced|Siri/i.test(v.name)) s += 10;
      if (/Google (US|UK) English/i.test(v.name)) s += 6;
      if (/Jenny|Aria|Ava|Ana|Emma|Michelle|Sonia|Libby|Samantha|Allison|Susan|Karen|Serena|Zoe|Nicky|Moira|Tessa/i.test(v.name)) s += 4;
      if (/en[-_]US/i.test(v.lang)) s += 1;
      return s;
    }
    function choose() {
      if (!synth) return;
      const list = synth.getVoices().slice().sort((a, b) => score(b) - score(a));
      chosen = list.length && score(list[0]) > -50 ? list[0] : null;
    }
    if (synth) {
      choose();
      if (synth.addEventListener) synth.addEventListener('voiceschanged', choose);
      else synth.onvoiceschanged = choose;
    }
    let current = null; // keep a reference, or some browsers never report "finished"
    // Returns true if it started speaking; onEnd runs once when the sentence is over.
    function say(text, onEnd) { return speak(text, chosen, chosen ? chosen.lang : 'en-US', onEnd, 0.92, 1.12); }

    // Hindi and Marathi: best voice for that language. Many devices have no Marathi voice,
    // so Marathi falls back to a Hindi voice (same Devanagari script). No voice at all -> silent.
    const LANG = { hi: /^hi/i, mr: /^mr/i };
    function bestFor(lang) {
      if (!synth || !LANG[lang]) return null;
      const nat = (v) => (/Natural|Neural|Online/i.test(v.name) ? 12 : 0) + (/Premium|Enhanced/i.test(v.name) ? 10 : 0) + (/Google/i.test(v.name) ? 6 : 0);
      const list = synth.getVoices().filter((v) => LANG[lang].test(v.lang)).sort((a, b) => nat(b) - nat(a));
      return list[0] || null;
    }
    function resolve(lang) {
      if (lang === 'en' || !lang) return chosen ? { v: chosen, lang: 'en' } : null;
      const v = bestFor(lang);
      if (v) return { v, lang };
      if (lang === 'mr') { const h = bestFor('hi'); if (h) return { v: h, lang: 'hi' }; }
      return null;
    }
    function sayLang(text, lang, onEnd) {
      if (lang === 'en' || !lang) return say(text, onEnd);
      const r = resolve(lang);
      return r ? speak(text, r.v, r.v.lang, onEnd, 0.85, 1.05) : false;
    }

    function speak(text, v, langCode, onEnd, rate, pitch) {
      if (!synth || audio.isMuted() || !settings.voiceOn || appPaused || !text) return false;
      try {
        if (synth.speaking || synth.pending) synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        if (v) u.voice = v;
        u.lang = langCode;
        u.rate = rate;   // a touch slower, like talking to a toddler
        u.pitch = pitch; // warm, not squeaky
        u.volume = 1;
        if (onEnd) {
          let done = false;
          const finish = () => { if (!done) { done = true; onEnd(); } };
          u.onend = finish;
          u.onerror = finish;
        }
        current = u;
        synth.speak(u);
        return true;
      } catch (e) { return false; /* speech not available */ }
    }
    return {
      say,
      sayLang,
      // For the parent settings: which voice will speak this language (null = none on this device).
      describe(lang) { const r = resolve(lang); return r ? { name: r.v.name, lang: r.lang } : null; },
      stop() { try { if (synth) synth.cancel(); } catch (e) { /* ignore */ } },
      warmup() { say(' '); },
    };
  })();

  // Things the game says: short, warm, and not the same line every time.
  const LINES = {
    start:  ["Let's play!", 'Can you match the shapes?', "Let's help the shapes go home!", 'Where do they go?'],
    pickup: (n) => [`${n}!`, `The ${n}!`, `You found the ${n}!`],
    place:  (n) => [`Yes! The ${n}!`, 'Good job!', 'You did it!', `The ${n} is home!`, 'Perfect!'],
    wrong:  ['Oops! Try another one.', 'Uh oh! Not there.', 'Hmm, try again!'],
    hint:   (n) => [`Where does the ${n} go?`, `Can you help the ${n}?`, `Let's move the ${n}!`],
    cheer:  ['The kitty is clapping for you!', 'You are so clever!', 'Hooray for you!'],
    letterStart:  (a, b) => [`Let's find ${a} and ${b}!`, `${a} and ${b}!`, `Here come ${a} and ${b}!`],
    letterHint:   (n) => [`Where does ${n} go?`, `Can you help ${n}?`, `Let's move ${n}!`],
    balloonStart: ['Pop the balloons!', "Let's pop some balloons!", 'Can you pop a balloon?'],
    balloonHint:  ['Tap a balloon!', 'Pop! Pop! Try it!', 'Look at all the balloons!'],
  };
  const line = (key, name = '') => pick(typeof LINES[key] === 'function' ? LINES[key](name.toLowerCase()) : LINES[key]);

  // ---------- Particles (sparkles + confetti) ----------
  const fx = (() => {
    let parts = [], running = false, last = 0, rainUntil = 0, dpr = 1;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    }
    function start() {
      if (running) return;
      running = true; last = performance.now();
      requestAnimationFrame(loop);
    }
    function burst(x, y, color, n = 28) {
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(220, 560);
        parts.push({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 160, g: 700,
          size: rand(9, 18), color: i % 3 ? color : pick(COLORS).c,
          rot: rand(0, 6.28), vr: rand(-8, 8), kind: i % 2 ? 'star' : 'dot',
          life: 0, max: rand(0.7, 1.1),
        });
      }
      start();
    }
    function rain(ms) { rainUntil = performance.now() + ms; start(); }
    // Balloon burst: stars of every colour plus a few rubber shreds in the balloon's colour.
    function firework(x, y, color) {
      for (let i = 0; i < 48; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(250, 700);
        parts.push({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, g: 520,
          size: rand(10, 22), color: i % 4 ? pick(COLORS).c : color,
          rot: rand(0, 6.28), vr: rand(-9, 9), kind: i % 3 ? 'star' : 'dot',
          life: 0, max: rand(0.9, 1.4),
        });
      }
      for (let i = 0; i < 8; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(120, 300);
        parts.push({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 900,
          size: rand(14, 24), color, rot: rand(0, 6.28), vr: rand(-12, 12), kind: 'rect', life: 0, max: 1,
        });
      }
      start();
    }
    // Tiny twinkling sparks for the crackle.
    function spark(x, y) {
      for (let i = 0; i < 5; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(30, 140);
        parts.push({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 120,
          size: rand(4, 8), color: pick(['#ffffff', '#FFE066', '#FFD60A', pick(COLORS).c]),
          rot: 0, vr: 0, kind: 'spark', life: 0, max: rand(0.25, 0.5),
        });
      }
      start();
    }
    function star(r) {
      ctx2d.beginPath();
      for (let i = 0; i < 10; i++) {
        const rr = i % 2 ? r * 0.45 : r;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        ctx2d.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx2d.closePath(); ctx2d.fill();
    }
    function loop(now) {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const W = window.innerWidth, H = window.innerHeight;
      if (now < rainUntil) {
        for (let i = 0; i < 4; i++) {
          parts.push({
            x: rand(0, W), y: -20, vx: rand(-60, 60), vy: rand(140, 280), g: 60,
            size: rand(9, 16), color: pick(COLORS).c, rot: rand(0, 6.28), vr: rand(-6, 6),
            kind: Math.random() < 0.7 ? 'rect' : 'star', life: 0, max: 8, sway: rand(0, 6.28),
          });
        }
      }
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2d.clearRect(0, 0, W, H);
      parts = parts.filter((p) => p.life < p.max && p.y < H + 40);
      for (const p of parts) {
        p.life += dt;
        p.vy += p.g * dt;
        if (p.sway !== undefined) { p.sway += dt * 3; p.x += Math.sin(p.sway) * 40 * dt; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        const fade = p.max < 2 ? 1 - p.life / p.max : 1;
        ctx2d.save();
        ctx2d.globalAlpha = clamp(fade, 0, 1);
        ctx2d.translate(p.x, p.y); ctx2d.rotate(p.rot);
        ctx2d.fillStyle = p.color;
        if (p.kind === 'rect') ctx2d.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        else if (p.kind === 'star') star(p.size / 2 + 2);
        else if (p.kind === 'spark') {
          ctx2d.globalAlpha *= Math.random() < 0.35 ? 0.25 : 1; // twinkle
          ctx2d.beginPath(); ctx2d.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx2d.fill();
        }
        else { ctx2d.beginPath(); ctx2d.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx2d.fill(); }
        ctx2d.restore();
      }
      if (parts.length || now < rainUntil) requestAnimationFrame(loop);
      else { running = false; ctx2d.clearRect(0, 0, W, H); }
    }
    return { resize, burst, rain, firework, spark };
  })();

  // ---------- Game state ----------
  let W = 0, H = 0, S = 160;
  let holePos = [], homePos = [];
  let pieces = [];
  let busy = true;
  let level = store.get('sf_level', 1);
  let lastIds = [];

  function applyPos(p) {
    p.el.style.transform = `translate3d(${p.x - S / 2}px, ${p.y - S / 2}px, 0) scale(${p.scale})`;
  }
  function placeBox(el, x, y, w, h) {
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    el.style.transform = `translate3d(${x - w / 2}px, ${y - h / 2}px, 0)`;
  }

  function layout() {
    W = window.innerWidth; H = window.innerHeight;
    const top = Math.max(70, H * 0.09);
    const avail = H - top;
    const n = pieces.length || 3; // 3 shapes, or 2 letters
    S = Math.min(W / (H > W ? n + 0.9 : n + 1.3), avail / 3.1, n === 2 ? 290 : 250);
    const gap = Math.min(W / (n + 0.3), S * (n === 2 ? 1.7 : 1.5));
    const xs = Array.from({ length: n }, (_, i) => W / 2 + (i - (n - 1) / 2) * gap);
    const holeY = top + avail * 0.27;
    const homeY = top + avail * 0.75;
    holePos = xs.map((x) => ({ x, y: holeY }));
    homePos = xs.map((x) => ({ x, y: homeY }));
    document.documentElement.style.setProperty('--S', S + 'px');

    const tw = gap * (n - 1) + S * 1.35, th = S * 1.3;
    placeBox(trayTop, W / 2, holeY, tw, th);
    placeBox(trayBottom, W / 2, homeY, tw, th);

    for (const p of pieces) {
      const hp = holePos[p.holeIdx];
      p.hole.style.transform = `translate3d(${hp.x - S / 2}px, ${hp.y - S / 2}px, 0)`;
      if (p.placed) { p.x = hp.x; p.y = hp.y; }
      else if (p.pointerId === null) { p.x = homePos[p.homeIdx].x; p.y = homePos[p.homeIdx].y; }
      applyPos(p);
    }
    fx.resize();
  }

  function updateStars(animateNew) {
    const done = level - 1;
    if (done <= 0) { starsEl.innerHTML = ''; return; }
    if (done <= 8) {
      starsEl.innerHTML = Array.from({ length: done }, (_, i) =>
        `<span class="star${animateNew && i === done - 1 ? ' new' : ''}">⭐</span>`).join('');
    } else {
      starsEl.innerHTML = `<span class="star${animateNew ? ' new' : ''}">⭐</span><span>${done}</span>`;
    }
  }

  let letterIdx = store.get('sf_letter_idx', 0); // which pair: 0 = A+B, 1 = C+D, ... 12 = Y+Z
  function updateLetters(animateNew) {
    if (letterIdx <= 0) { starsEl.innerHTML = ''; return; }
    starsEl.innerHTML = `<span class="star${animateNew ? ' new' : ''}">⭐</span><span>A–${LETTERS[letterIdx * 2 - 1].letter}</span>`;
  }

  // "A for Apple" picture card.
  const wordPop = $('#wordPop');
  let wordPopTimer = null;
  function showWord(def, color) {
    wordPop.innerHTML = `<div class="wpPic">${def.pic}</div><div class="wpText"><b style="color:${color.c}">${def.letter}</b> for ${def.word}</div>`;
    wordPop.classList.remove('show');
    void wordPop.offsetWidth;
    wordPop.classList.add('show');
    clearTimeout(wordPopTimer);
    wordPopTimer = setTimeout(() => wordPop.classList.remove('show'), 2600);
  }
  function hideWord() { clearTimeout(wordPopTimer); wordPop.classList.remove('show'); }

  function clearLevel() {
    for (const p of pieces) { p.el.remove(); p.hole.remove(); }
    pieces = [];
  }

  function newLevel() {
    clearLevel();
    hideWord();
    const letters = mode === 'letters';
    let defs, holeOrder, homeOrder;
    if (letters) {
      // The next two letters, in alphabet order, left to right. They start swapped underneath.
      defs = [LETTERS[letterIdx * 2], LETTERS[letterIdx * 2 + 1]];
      holeOrder = [0, 1];
      homeOrder = [1, 0];
    } else {
      // Three different shapes, avoiding the ones from the last level so it feels fresh.
      defs = shuffle(SHAPES.filter((s) => !lastIds.includes(s.id))).slice(0, 3);
      lastIds = defs.map((d) => d.id);
      holeOrder = shuffle([0, 1, 2]);
      // Make sure no shape starts directly under its own hole.
      do { homeOrder = shuffle([0, 1, 2]); } while (homeOrder.some((h, i) => h === holeOrder[i]));
    }
    const cols = shuffle(COLORS).slice(0, defs.length);

    defs.forEach((def, i) => {
      const color = cols[i];
      const hole = document.createElement('div');
      hole.className = 'hole';
      hole.innerHTML = `<div class="inner">${(letters ? letterHoleSVG : holeSVG)(def, color)}</div>`;
      const el = document.createElement('div');
      el.className = 'piece';
      el.innerHTML = `<div class="inner">${(letters ? letterSVG : shapeSVG)(def, color)}</div>`;
      board.appendChild(hole);
      board.appendChild(el);
      const p = {
        def, color, el, hole, inner: el.firstElementChild,
        holeIdx: holeOrder[i], homeIdx: homeOrder[i],
        x: 0, y: 0, scale: 1, offX: 0, offY: 0, placed: false, pointerId: null,
      };
      pieces.push(p);
      playAnim(hole.firstElementChild, 'popin', 0.1 * holeOrder[i]);
      playAnim(p.inner, 'popin', 0.35 + 0.15 * homeOrder[i]);
    });
    layout();
    audio.whoosh();
    // A little "bloop" as each shape pops in, timed with its pop-in animation.
    defs.forEach((_, k) => setTimeout(() => audio.appear(k), 350 + 150 * k));
    if (letters) setTimeout(() => voice.say(pick(LINES.letterStart(defs[0].name, defs[1].name))), 900);
    else if (level === 1 || Math.random() < 0.4) setTimeout(() => voice.say(line('start')), 900);
    busy = false;
    resetIdle(6000);
  }

  // ---------- Touch / mouse (forgiving grab) ----------
  function grabReach() { return S * 0.5 + Math.max(60, S * 0.45); }

  function onDown(e) {
    audio.unlock();
    if (busy) return;
    const pt = { x: e.clientX, y: e.clientY };
    let best = null, bd = Infinity;
    for (const p of pieces) {
      if (p.placed || p.pointerId !== null) continue;
      const d = dist(pt, p);
      if (d < bd) { bd = d; best = p; }
    }
    if (!best || bd > grabReach()) {
      // Missed everything: still answer the touch with a bloop and a few sparkles.
      audio.tap();
      fx.burst(pt.x, pt.y, pick(COLORS).c, 8);
      return;
    }
    e.preventDefault();
    resetIdle();
    stopHint();
    best.pointerId = e.pointerId;
    best.offX = best.x - pt.x;
    best.offY = best.y - pt.y;
    best.el.classList.remove('returning', 'placing');
    best.el.classList.add('dragging');
    best.scale = 1.15;
    applyPos(best);
    best.wasNear = false;
    audio.pickup(best.homeIdx);
    voice.say(mode === 'letters' ? best.def.name : line('pickup', best.def.name));
  }

  function onMove(e) {
    const p = pieces.find((q) => q.pointerId === e.pointerId);
    if (!p) return;
    e.preventDefault();
    resetIdle();
    // Gently slide the shape under the finger if it was grabbed from a distance.
    p.offX *= 0.9; p.offY *= 0.9;
    p.x = clamp(e.clientX + p.offX, 0, W);
    p.y = clamp(e.clientY + p.offY, 0, H);
    applyPos(p);
    const d = dist(p, holePos[p.holeIdx]);
    const isNear = d < S;
    if (isNear && !p.wasNear) audio.near();
    p.wasNear = isNear;
    p.hole.classList.toggle('near', isNear);
    if (d < S * 0.38) placePiece(p); // magnet: snaps in even before letting go
  }

  function onUp(e) {
    const p = pieces.find((q) => q.pointerId === e.pointerId);
    if (!p) return;
    p.pointerId = null;
    p.el.classList.remove('dragging');
    p.hole.classList.remove('near');
    // Nearest hole wins; generous drop radius for little hands.
    let nearest = null, nd = Infinity;
    for (const q of pieces) {
      const d = dist(p, holePos[q.holeIdx]);
      if (d < nd) { nd = d; nearest = q; }
    }
    if (nearest === p && nd < S * 0.9) return placePiece(p);
    sendHome(p, nearest !== p && nd < S * 0.75);
  }

  function sendHome(p, wrong) {
    const h = homePos[p.homeIdx];
    p.x = h.x; p.y = h.y; p.scale = 1;
    p.el.classList.add('returning');
    applyPos(p);
    setTimeout(() => p.el.classList.remove('returning'), 550);
    if (wrong) {
      audio.wrong();
      voice.say(line('wrong'));
      playAnim(p.inner, 'no');
    }
  }

  function placePiece(p) {
    if (p.placed) return;
    p.placed = true;
    p.pointerId = null;
    p.el.classList.remove('dragging', 'returning');
    p.el.classList.add('placing', 'done');
    p.hole.classList.remove('near', 'hint');
    p.hole.classList.add('filled');
    const hp = holePos[p.holeIdx];
    p.x = hp.x; p.y = hp.y; p.scale = 1;
    applyPos(p);
    setTimeout(() => p.el.classList.remove('placing'), 260);
    playAnim(p.inner, 'happy');
    const n = pieces.filter((q) => q.placed).length;
    audio.place(n);
    fx.burst(hp.x, hp.y, p.color.c);
    const last = n === pieces.length;
    if (last) { busy = true; stopHint(); clearTimeout(idleTimer); }
    if (mode === 'letters') {
      showWord(p.def, p.color);
      let next = null;
      if (last) {
        // Let "B for Ball" finish (and be seen) before the dancing starts.
        let fired = false;
        next = () => { if (!fired) { fired = true; setTimeout(() => celebrate({ character: 'girl' }), 700); } };
      }
      const spoke = voice.say(`${p.def.name}, for ${p.def.word}!`, next);
      if (last) setTimeout(next, spoke ? 5000 : 2200);
    } else {
      // The last shape stays quiet: the cat celebration's voice comes right after.
      if (!last) voice.say(line('place', p.def.name));
      else setTimeout(celebrate, 900);
    }
  }

  board.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove, { passive: false });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);

  // ---------- Idle hint: a little hand shows where a shape goes ----------
  let idleTimer = null, hintAnim = null;
  function resetIdle(ms = 7000) {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(showHint, ms);
  }
  function stopHint() {
    if (hintAnim) { hintAnim.cancel(); hintAnim = null; }
    hand.style.opacity = 0;
  }
  function showHint() {
    if (busy || appPaused) return;
    const free = pieces.filter((p) => !p.placed);
    if (!free.length || pieces.some((p) => p.pointerId !== null)) return resetIdle();
    const p = pick(free);
    const hp = holePos[p.holeIdx];
    playAnim(p.inner, 'wiggle');
    voice.say(mode === 'letters' ? pick(LINES.letterHint(p.def.name)) : line('hint', p.def.name));
    p.hole.classList.remove('hint'); void p.hole.offsetWidth; p.hole.classList.add('hint');
    setTimeout(() => p.hole.classList.remove('hint'), 2800);
    const size = S * 0.55;
    hand.style.fontSize = size + 'px';
    const at = (pt) => `translate(${pt.x - size * 0.45}px, ${pt.y}px)`;
    if (hand.animate) {
      hintAnim = hand.animate([
        { transform: at(p), opacity: 0 },
        { transform: at(p), opacity: 1, offset: 0.15 },
        { transform: at(hp), opacity: 1, offset: 0.75 },
        { transform: at(hp), opacity: 0 },
      ], { duration: 2200, iterations: 2, easing: 'ease-in-out' });
      hintAnim.onfinish = () => { hand.style.opacity = 0; };
    }
    resetIdle(9000);
  }

  // ---------- Celebration: clapping cat ----------
  let clapTimers = [];
  let pendingCelebration = null, celebrationCut = false;
  function celebrate(opts = {}) {
    if (!started) return;
    if (appPaused) { pendingCelebration = opts; return; } // wait until the child is back
    if (mode === 'shapes') {
      level++;
      store.set('sf_level', level);
      updateStars(true);
    }
    if (mode === 'letters') {
      const A = LETTERS[letterIdx * 2], B = LETTERS[letterIdx * 2 + 1];
      const a = A.name, b = B.name; // spoken
      const allDone = letterIdx === 12;
      letterIdx = allDone ? 0 : letterIdx + 1;
      store.set('sf_letter_idx', letterIdx);
      updateLetters(true);
      opts = Object.assign({ character: 'girl' }, opts, allDone
        ? { phrase: 'A to Z!', say: 'Wow! You know all the letters, from ay to zee!' }
        : { phrase: `${A.letter} ${B.letter}!`, say: pick([`Yay! ${a} and ${b}!`, `Well done! You did ${a} and ${b}!`, `Hooray! ${a} and ${b}!`]) });
    }
    const girlMode = opts.character === 'girl';
    celebrateEl.classList.toggle('girlMode', girlMode);

    const fur = pick(CAT_FURS);
    const root = document.documentElement.style;
    root.setProperty('--fur', fur.fur);
    root.setProperty('--furLine', fur.line);
    root.setProperty('--belly', fur.belly);
    root.setProperty('--stripe', fur.stripe);

    const phrase = opts.phrase || pick(PHRASES);
    yayEl.innerHTML = phrase.split('').map((ch, i) =>
      `<span style="color:${COLORS[i % COLORS.length].c};animation-delay:${(i * 0.07).toFixed(2)}s, ${(0.6 + i * 0.07).toFixed(2)}s">${ch === ' ' ? '&nbsp;' : ch}</span>`
    ).join('');

    spawnBalloons();
    celebrateEl.classList.remove('hidden');
    void celebrateEl.offsetWidth;
    celebrateEl.classList.add('show');
    audio.fanfare();
    fx.rain(3200);

    // First the voice says "well done", THEN the cat claps, so they never talk over each other.
    // Clap sounds are in sync with the paws meeting (every 0.64s). With a real applause
    // recording (and no clap recording) the recording does the clapping alone.
    const shownAt = performance.now();
    let clapping = false;
    const startClapping = () => {
      if (clapping || appPaused || !started || !celebrateEl.classList.contains('show')) return;
      clapping = true;
      if (girlMode) {
        girl.classList.add('dancing');
        audio.dance();
        audio.laugh(4);
        clapTimers.push(setTimeout(endCelebrate, 4200));
        return;
      }
      cat.classList.add('clapping');
      audio.applause(3.2);
      if (audio.has('clap') || !audio.has('applause')) {
        clapTimers.push(setTimeout(() => {
          audio.clap();
          clapTimers.push(setInterval(() => audio.clap(), 640));
        }, 320));
      }
      clapTimers.push(setTimeout(endCelebrate, 3800));
    };
    const afterVoice = () => {
      // wait for the cat to finish popping up (about 0.8s) before it starts clapping
      const wait = Math.max(200, 850 - (performance.now() - shownAt));
      clapTimers.push(setTimeout(startClapping, wait));
    };
    const cheerText = opts.say || phrase + ' ' + line('cheer');
    const speaking = opts.lang ? voice.sayLang(cheerText, opts.lang, afterVoice) : voice.say(cheerText, afterVoice);
    // Safety net: if the voice is off, or never says it has finished, clap anyway.
    clapTimers.push(setTimeout(startClapping, speaking ? 6000 : 850));
  }

  function endCelebrate() {
    clapTimers.forEach((t) => { clearTimeout(t); clearInterval(t); });
    clapTimers = [];
    audio.endCelebration();
    celebrateEl.classList.remove('show');
    celebrateEl.classList.add('hidden');
    setTimeout(() => {
      if (updateReady) return location.reload(); // a newer version is waiting
      cat.classList.remove('clapping');
      girl.classList.remove('dancing');
      celebrateEl.querySelectorAll('.balloon').forEach((b) => b.remove());
      if (!started) return;
      if (games[mode]) { if (games[mode].afterCelebration) games[mode].afterCelebration(); }
      else if (mode === 'balloons') balloonGame.resume();
      else newLevel();
    }, 500);
  }

  function spawnBalloons() {
    const cols = shuffle(COLORS);
    for (let i = 0; i < 7; i++) {
      const b = document.createElement('div');
      b.className = 'balloon';
      b.style.left = (5 + i * 13 + rand(-3, 3)) + '%';
      b.style.setProperty('--c', cols[i % cols.length].c);
      b.style.setProperty('--dur', rand(4.2, 5.5).toFixed(2) + 's');
      b.style.setProperty('--delay', rand(0, 1.2).toFixed(2) + 's');
      celebrateEl.appendChild(b);
    }
  }

  // Balloons can be popped during the celebration — with the same forgiving touch.
  celebrateEl.addEventListener('pointerdown', (e) => {
    audio.unlock();
    let best = null, bd = Infinity;
    celebrateEl.querySelectorAll('.balloon:not(.popped)').forEach((b) => {
      const r = b.getBoundingClientRect();
      const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      if (d < bd) { bd = d; best = { b, r }; }
    });
    if (!best || bd > best.r.width * 0.5 + 60) return boopCat(e);
    const { b, r } = best;
    const now = getComputedStyle(b).transform; // freeze where it is mid-flight
    b.style.transform = now;
    b.style.setProperty('--t', now);
    b.classList.add('popped');
    audio.balloonPop();
    fx.burst(r.left + r.width / 2, r.top + r.height / 2, getComputedStyle(b).getPropertyValue('--c').trim() || '#fff', 18);
    setTimeout(() => b.remove(), 250);
  });

  // Tapping the cat makes it hop and meow.
  function boopCat(e) {
    const who = celebrateEl.classList.contains('girlMode') ? girl : cat;
    const r = who.getBoundingClientRect();
    const pad = 40;
    if (e.clientX < r.left - pad || e.clientX > r.right + pad || e.clientY < r.top - pad) return;
    if (who === girl) { if (!audio.laugh(2.5)) voice.say(pick(['Hee hee!', 'Yay!', 'Dance with me!'])); }
    else if (!audio.meow()) voice.say('Meow!');
    if (who.animate) {
      who.animate([
        { transform: 'translateY(0) scale(1)' },
        { transform: 'translateY(-8%) scale(1.04, .96)' },
        { transform: 'translateY(0) scale(1)' },
      ], { duration: 420, easing: 'ease-out' });
    }
  }

  // ---------- Game 2: Balloon pop ----------
  const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  function balloonSVG(color, n) {
    return `<svg viewBox="0 0 100 160">
      <path d="M50 112 C42 124 58 138 50 158" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M44 113 L56 113 L50 104 Z" fill="${color.d}"/>
      <path d="M50 4 C77 4 94 26 94 52 C94 82 70 104 50 108 C30 104 6 82 6 52 C6 26 23 4 50 4 Z" fill="${color.c}" stroke="${color.d}" stroke-width="3"/>
      <ellipse cx="30" cy="30" rx="9" ry="16" fill="#fff" opacity=".45" transform="rotate(25 30 30)"/>
      <text class="num" x="50" y="58" text-anchor="middle" dominant-baseline="central" font-size="${n >= 10 ? 44 : 54}"
        fill="#fff" stroke="${color.d}" stroke-width="6" stroke-linejoin="round" paint-order="stroke">${n}</text>
    </svg>`;
  }

  const balloonGame = (() => {
    const layer = $('#balloonGame');
    let list = [], running = false, paused = false, last = 0, spawnIn = 0, popped = 0, quietSince = 0;
    let lastColor = null, lastNum = 0;
    const bigness = () => clamp(Math.min(window.innerWidth, window.innerHeight) * 0.26, 130, 250);
    const maxAtOnce = () => Math.round(clamp((window.innerWidth * window.innerHeight) / 190000, 4, 7));

    // A balloon drifts in from any side (mostly from the bottom) and slowly crosses the screen.
    function spawn(headStart = 0) {
      const W = window.innerWidth, H = window.innerHeight;
      const bw = bigness() * rand(0.9, 1.12);
      const r = Math.random();
      let x, y, tx, ty;
      if (r < 0.5)      { x = rand(0.12, 0.88) * W; y = H + bw; tx = x + rand(-0.3, 0.3) * W; ty = -bw * 1.5; }
      else if (r < 0.7) { x = -bw; y = rand(0.3, 0.8) * H; tx = W + bw; ty = y + rand(-0.35, 0.2) * H; }
      else if (r < 0.9) { x = W + bw; y = rand(0.3, 0.8) * H; tx = -bw; ty = y + rand(-0.35, 0.2) * H; }
      else              { x = rand(0.15, 0.85) * W; y = -bw; tx = x + rand(-0.3, 0.3) * W; ty = H + bw * 1.5; }
      const len = Math.hypot(tx - x, ty - y);
      const speed = Math.min(W, H) * rand(0.06, 0.095);
      // Never the same colour or number twice in a row.
      let color, n;
      do { color = pick(COLORS); } while (color === lastColor);
      do { n = 1 + Math.floor(Math.random() * 10); } while (n === lastNum);
      lastColor = color; lastNum = n;
      const el = document.createElement('div');
      el.className = 'bal';
      el.style.setProperty('--bw', bw + 'px');
      el.innerHTML = balloonSVG(color, n);
      layer.appendChild(el);
      const dx = (tx - x) / len, dy = (ty - y) / len;
      const b = {
        el, bw, color, n, speed, age: 0, phase: rand(0, 6.28), wob: rand(0.8, 1.3),
        vx: dx * speed, vy: dy * speed,
        x: x + dx * speed * headStart, y: y + dy * speed * headStart,
      };
      place(b);
      list.push(b);
    }
    function place(b) {
      const px = -b.vy / b.speed, py = b.vx / b.speed; // sideways, for a gentle sway
      const sway = Math.sin(b.phase) * b.bw * 0.1;
      b.cx = b.x + px * sway;
      b.cy = b.y + py * sway;
      b.el.style.transform = `translate3d(${b.cx - b.bw * 0.5}px, ${b.cy - b.bw * 0.56}px, 0) rotate(${(Math.sin(b.phase * 1.3) * 7).toFixed(2)}deg)`;
    }
    function loop(now) {
      if (!running) return;
      if (appPaused) { last = now; requestAnimationFrame(loop); return; } // frozen in place
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const W = window.innerWidth, H = window.innerHeight;
      if (!paused) {
        spawnIn -= dt;
        if (spawnIn <= 0 && list.length < maxAtOnce()) { spawn(); spawnIn = rand(0.9, 1.7); }
        if (now - quietSince > 9000) { voice.say(line('balloonHint')); quietSince = now; }
      }
      list = list.filter((b) => {
        b.age += dt;
        b.phase += dt * b.wob * 1.6;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        place(b);
        const gone = b.age > 2 && (b.cx < -2 * b.bw || b.cx > W + 2 * b.bw || b.cy < -2.2 * b.bw || b.cy > H + 2.2 * b.bw);
        if (gone) b.el.remove();
        return !gone;
      });
      requestAnimationFrame(loop);
    }

    function renderCount(bump) {
      starsEl.innerHTML = popped
        ? `<span class="star${bump ? ' new' : ''}">🎈</span><span>${popped}</span>`
        : '';
    }
    function showNumber(b) {
      const el = document.createElement('div');
      el.className = 'numPop';
      el.textContent = b.n;
      el.style.left = b.cx + 'px';
      el.style.top = b.cy + 'px';
      el.style.fontSize = b.bw * 0.75 + 'px';
      el.style.color = b.color.c;
      el.style.transform = 'translate(-50%, -50%)';
      layer.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    }
    function pop(b) {
      list = list.filter((q) => q !== b);
      b.el.classList.add('popping');
      setTimeout(() => b.el.remove(), 220);
      // The crackle sound and the twinkling sparks share one timeline, so they match.
      const crackle = Array.from({ length: 26 }, () => 0.12 + Math.pow(Math.random(), 1.5) * 0.8);
      audio.burst(b.n, crackle);
      fx.firework(b.cx, b.cy, b.color.c);
      const { cx, cy, bw } = b;
      crackle.forEach((t) => setTimeout(() => fx.spark(cx + rand(-1, 1) * bw * 0.8, cy + rand(-1, 1) * bw * 0.8), t * 1000));
      showNumber(b);
      voice.say(NUMBER_WORDS[b.n] + '!');
      popped++;
      renderCount(true);
      if (popped % 10 === 0) {
        paused = true;
        setTimeout(() => celebrate({ phrase: 'Pop pop!', say: `Wow! ${popped} balloons!` }), 900);
      }
    }

    // Forgiving touch: the nearest balloon within reach pops, even if the finger missed it.
    layer.addEventListener('pointerdown', (e) => {
      audio.unlock();
      if (!running || paused) return;
      quietSince = performance.now();
      let best = null, bd = Infinity;
      for (const b of list) {
        const d = Math.hypot(e.clientX - b.cx, e.clientY - b.cy);
        if (d < bd) { bd = d; best = b; }
      }
      if (best && bd < best.bw * 0.55 + 70) return pop(best);
      audio.tap();
      fx.burst(e.clientX, e.clientY, pick(COLORS).c, 8);
    });

    return {
      start() {
        this.stop();
        popped = 0;
        renderCount(false);
        running = true;
        paused = false;
        // A few balloons are already on screen so there is something to pop right away.
        [3.5, 6, 8.5].forEach((s) => spawn(s));
        spawnIn = 1;
        last = quietSince = performance.now();
        requestAnimationFrame(loop);
        setTimeout(() => { if (running) voice.say(line('balloonStart')); }, 500);
      },
      stop() {
        running = false;
        list.forEach((b) => b.el.remove());
        list = [];
        layer.innerHTML = '';
      },
      resume() { paused = false; spawnIn = 0.2; quietSince = performance.now(); },
      wake() { last = quietSince = performance.now(); },
    };
  })();


  // ---------- Start screen ----------
  // Each word stays in one piece, so on a phone it wraps as "My Little / World", never mid-word.
  let ti = 0;
  $('#title').innerHTML = 'YugaVerse Kids'.split(' ').map((word) =>
    '<span class="tWord">' + word.split('').map((ch) => {
      const i = ti++;
      return `<span style="color:${COLORS[i % COLORS.length].c};animation-delay:${(i * 0.08).toFixed(2)}s">${ch}</span>`;
    }).join('') + '</span>'
  ).join(' ');
  const floaters = [
    [8, 10], [78, 8], [6, 70], [80, 68], [44, 84], [45, 2],
  ];
  $('#startShapes').innerHTML = floaters.map(([l, t], i) =>
    `<div class="floater" style="left:${l}%;top:${t}%;animation-delay:${(-i * 0.7).toFixed(1)}s">${shapeSVG(SHAPES[(i * 2) % SHAPES.length], COLORS[i % COLORS.length])}</div>`
  ).join('');

  // Menu card pictures.
  const artAt = (svg, l, t, w, h = w) => svg.replace('<svg ', `<svg style="left:${l}%;top:${t}%;width:${w}%;height:${h}%" `);
  $('#cardShapes').innerHTML = '<div class="art">' +
    artAt(shapeSVG(SHAPES[0], COLORS[2]), 6, 8, 46) +
    artAt(shapeSVG(SHAPES[3], COLORS[7]), 48, 4, 46) +
    artAt(shapeSVG(SHAPES[2], COLORS[5]), 26, 46, 50) + '</div>';
  $('#cardBalloons').innerHTML = '<div class="art">' +
    artAt(balloonSVG(COLORS[0], 1), 2, 10, 34, 54) +
    artAt(balloonSVG(COLORS[2], 2), 33, 2, 36, 58) +
    artAt(balloonSVG(COLORS[5], 3), 64, 14, 33, 53) + '</div>';

  $('#cardLetters').innerHTML = '<div class="art">' +
    artAt(letterSVG(LETTERS[0], COLORS[0]), 2, 6, 46) +
    artAt(letterSVG(LETTERS[1], COLORS[5]), 50, 10, 46) +
    artAt(letterSVG(LETTERS[2], COLORS[3]), 26, 48, 48) + '</div>';

  // Games that live in their own files register here: each gets a full-screen layer and a menu card.
  const games = {};
  function registerGame(id, game) {
    const layer = document.createElement('div');
    layer.className = 'gameLayer';
    layer.id = 'layer-' + id;
    document.body.insertBefore(layer, $('#topbar'));
    const card = document.createElement('button');
    card.className = 'gameCard';
    card.dataset.game = id;
    card.setAttribute('aria-label', game.label);
    card.style.background = game.cardBg;
    card.innerHTML = '<div class="art">' + game.cardArt(artAt) + '</div>';
    card.addEventListener('pointerup', () => startGame(id));
    $('#menu').appendChild(card);
    games[id] = Object.assign(game, { layer });
    if (game.init) game.init(layer);
  }

  // Android's back gesture / button must not throw a toddler out of a game.
  function guardBack() { try { history.pushState({ mlw: Date.now() }, ''); } catch (e) { /* ignore */ } }
  window.addEventListener('popstate', () => { if (started) guardBack(); });

  let started = false, mode = null; // mode: 'shapes', 'balloons', 'letters' or a registered game
  function startGame(which) {
    if (started) return;
    started = true;
    mode = which;
    audio.unlock();
    voice.warmup(); // wakes up speech on iPad (must happen inside a tap)
    const de = document.documentElement;
    const fs = de.requestFullscreen || de.webkitRequestFullscreen;
    if (fs && !window.navigator.standalone) {
      try { const r = fs.call(de); if (r && r.catch) r.catch(() => {}); } catch (e) { /* not allowed */ }
    }
    document.body.classList.add('playing');
    document.body.classList.toggle('mode-balloons', which === 'balloons');
    startEl.classList.add('gone');
    setTimeout(() => { if (started) startEl.style.display = 'none'; }, 550);
    guardBack();
    if (games[which]) {
      document.body.classList.add('mode-custom');
      games[which].layer.classList.add('active');
      games[which].start();
    } else if (which === 'balloons') balloonGame.start();
    else if (which === 'letters') { updateLetters(false); newLevel(); }
    else { updateStars(false); newLevel(); }
  }
  document.querySelectorAll('.gameCard').forEach((card) =>
    card.addEventListener('pointerup', () => startGame(card.dataset.game)));

  // Back to the menu. Stops whatever is running.
  function goHome() {
    if (!started) return;
    started = false;
    if (games[mode]) {
      games[mode].stop();
      games[mode].layer.classList.remove('active');
      document.body.classList.remove('mode-custom');
    }
    mode = null;
    clapTimers.forEach((t) => { clearTimeout(t); clearInterval(t); });
    clapTimers = [];
    audio.endCelebration();
    celebrateEl.classList.remove('show');
    celebrateEl.classList.add('hidden');
    cat.classList.remove('clapping');
    girl.classList.remove('dancing');
    celebrateEl.querySelectorAll('.balloon').forEach((b) => b.remove());
    hideWord();
    busy = true;
    stopHint();
    clearTimeout(idleTimer);
    clearLevel();
    balloonGame.stop();
    voice.stop();
    starsEl.innerHTML = '';
    document.body.classList.remove('playing', 'mode-balloons');
    startEl.style.display = '';
    void startEl.offsetWidth;
    startEl.classList.remove('gone');
    if (updateReady) location.reload();
  }
  // The home button has to be held for about a second, so little ones don't leave by accident.
  const homeBtn = $('#homeBtn');
  let holdTimer = null;
  homeBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    homeBtn.classList.add('holding');
    holdTimer = setTimeout(() => { homeBtn.classList.remove('holding'); goHome(); }, 900);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => homeBtn.addEventListener(ev, () => {
    clearTimeout(holdTimer);
    homeBtn.classList.remove('holding');
  }));

  // ---------- Parent settings ----------
  // Opened by HOLDING the gear on the start screen for 2 seconds (little ones tap, grown-ups hold).
  const setEl = $('#settings');
  const LANG_NAMES = { en: 'English', hi: 'Hindi', mr: 'Marathi' };
  const SAMPLE_WORD = { en: 'Hello!', hi: 'नमस्ते!', mr: 'नमस्कार!' };
  function renderSettings() {
    setEl.querySelectorAll('[data-lang]').forEach((b) => b.classList.toggle('on', b.dataset.lang === settings.lang));
    $('#setSound').classList.toggle('on', !audio.isMuted());
    $('#setSound').textContent = audio.isMuted() ? 'Off' : 'On';
    $('#setVoice').classList.toggle('on', settings.voiceOn);
    $('#setVoice').textContent = settings.voiceOn ? 'On' : 'Off';
    const l = settings.lang, d = voice.describe(l);
    let note;
    if (!d) note = `No ${LANG_NAMES[l]} voice on this device. Names are shown on screen, and animal sounds still play.`;
    else if (d.lang !== l) note = `No ${LANG_NAMES[l]} voice on this device, so a ${LANG_NAMES[d.lang]} voice (${d.name}) reads the ${LANG_NAMES[l]} words.`;
    else note = `Voice: ${d.name}.`;
    $('#voiceInfo').textContent = note + (l !== 'en' ? ' Language applies to Animal Sounds; the older games speak English for now.' : '');
  }
  function openSettings() { renderSettings(); setEl.classList.remove('hidden'); }
  function closeSettings() { setEl.classList.add('hidden'); resetArmed = false; $('#setReset').textContent = 'Reset stars & letters'; }
  setEl.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => {
    audio.unlock();
    settings.set('lang', b.dataset.lang);
    renderSettings();
    voice.sayLang(SAMPLE_WORD[b.dataset.lang], b.dataset.lang); // let the parent hear it
  }));
  $('#setSound').addEventListener('click', () => {
    audio.unlock();
    audio.setMuted(!audio.isMuted());
    if (audio.isMuted()) voice.stop();
    renderSettings();
  });
  $('#setVoice').addEventListener('click', () => {
    settings.set('voice', !settings.voiceOn);
    if (!settings.voiceOn) voice.stop();
    renderSettings();
  });
  let resetArmed = false;
  $('#setReset').addEventListener('click', () => {
    if (!resetArmed) { resetArmed = true; $('#setReset').textContent = 'Tap again to reset'; return; }
    level = 1; letterIdx = 0;
    store.set('sf_level', 1); store.set('sf_letter_idx', 0);
    resetArmed = false;
    $('#setReset').textContent = 'Done ✓';
  });
  $('#setClose').addEventListener('click', closeSettings);
  const parentBtn = $('#parentBtn');
  let parentTimer = null;
  parentBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    parentBtn.classList.add('holding');
    parentTimer = setTimeout(() => { parentBtn.classList.remove('holding'); openSettings(); }, 2000);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => parentBtn.addEventListener(ev, (e) => {
    e.stopPropagation();
    clearTimeout(parentTimer);
    parentBtn.classList.remove('holding');
  }));

  // ---------- iPad / browser guards ----------
  ['gesturestart', 'gesturechange', 'dblclick', 'contextmenu'].forEach((ev) =>
    document.addEventListener(ev, (e) => e.preventDefault()));
  document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', () => setTimeout(layout, 250));
  window.addEventListener('pointerdown', () => audio.unlock(), { capture: true });

  layout();

  // ---------- Pause when the app is not in front ----------
  // Minimized, switched away, screen locked or (on a computer) another window in focus:
  // sound, voice, hints and moving balloons all stop, and carry on when the child comes back.
  function setPaused(p) {
    if (p === appPaused) return;
    appPaused = p;
    document.body.classList.toggle('paused', p);
    if (p) {
      audio.sleep();
      voice.stop();
      if (started && games[mode] && games[mode].pause) games[mode].pause();
      stopHint();
      clearTimeout(idleTimer);
      if (celebrateEl.classList.contains('show')) {
        clapTimers.forEach((t) => { clearTimeout(t); clearInterval(t); });
        clapTimers = [];
        audio.endCelebration();
        celebrationCut = true;
      }
    } else {
      audio.wake();
      balloonGame.wake();
      if (started && games[mode] && games[mode].resume) games[mode].resume();
      if (celebrationCut) { celebrationCut = false; endCelebrate(); }
      else if (pendingCelebration) { const o = pendingCelebration; pendingCelebration = null; celebrate(o); }
      else if (started && (mode === 'shapes' || mode === 'letters') && !busy) resetIdle();
    }
  }
  document.addEventListener('visibilitychange', () => setPaused(document.hidden || !document.hasFocus()));
  window.addEventListener('blur', () => setPaused(true));
  window.addEventListener('focus', () => setPaused(document.hidden));
  window.addEventListener('pagehide', () => setPaused(true));
  window.addEventListener('pageshow', () => setPaused(document.hidden));
  // Tapping the paused screen also wakes the game up.
  $('#pausedOverlay').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    audio.unlock();
    setPaused(false);
  });

  // ---------- Stay up to date ----------
  // run.bat's server reports a fingerprint of the game files. When it changes, the game reloads:
  // straight away on the start screen or when the iPad app is reopened, otherwise after the
  // current level's cat celebration, so a child is never interrupted mid-drag.
  let knownVersion = null;
  function checkForUpdate(reloadNow) {
    if (!location.protocol.startsWith('http') || !window.fetch) return;
    fetch('__version', { cache: 'no-store' })
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((v) => {
        if (knownVersion === null) { knownVersion = v; return; }
        if (v === knownVersion) return;
        if (reloadNow || !started) location.reload();
        else updateReady = true;
      })
      .catch(() => { /* hosted without run.bat, or offline */ });
  }
  checkForUpdate();
  setInterval(() => checkForUpdate(false), 15000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkForUpdate(true); });
  window.addEventListener('pageshow', (e) => { if (e.persisted) checkForUpdate(true); });

  // Offline cache only on a real https host. On the home network (http) it would just keep
  // old files around, so remove any left over from earlier versions.
  if ('serviceWorker' in navigator) {
    if (location.protocol === 'https:') {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    } else {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister())).catch(() => {});
      if (window.caches) caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
    }
  }

  $('#version').textContent = '© 2026 mayurj476 · v' + APP_VERSION;

  window.MLW = {
    audio, voice, fx, store, settings, COLORS, rand, pick, clamp, shuffle,
    isPaused: () => appPaused,
    registerGame,
    celebrate, // the clapping cat, or the dancing girl with { character: 'girl' }
  };
})();
