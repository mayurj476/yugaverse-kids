// YugaVerse Kids - Copyright (c) 2026 mayurj476. All rights reserved.
// Not for copying, reuse or redistribution without written permission. See LICENSE.

// ---------- Game: Talking Cat ----------
// Talk to the cat and it repeats what you said in a funny squeaky voice.
// Tap its head and it runs around the screen with a meow, tickle its belly and it giggles,
// tap its tail and it jumps. Every few seconds it does something silly by itself:
// sticks its tongue out, winks, goes cross-eyed, puffs its cheeks, waves hi or dances.
// Privacy: the microphone sound only lives in memory for a few seconds so it can be played
// back. Nothing is saved or uploaded, and the microphone is switched off as soon as the
// child leaves the game or the app goes to the background.
(() => {
  'use strict';
  const { audio, voice, fx, pick, clamp, settings } = window.MLW;

  const SAY = {
    hello: { en: 'Hello! Talk to me!', hi: 'नमस्ते! मुझसे बात करो!', mr: 'नमस्कार! माझ्याशी बोल!' },
    poke:  { en: 'Tap me!', hi: 'मुझे छुओ!', mr: 'मला हात लाव!' },
    hi:    { en: 'Hi!', hi: 'हाय!', mr: 'हाय!' },
  };

  // ---------- The cat (front view, parts can move on their own) ----------
  const CAT = `<svg viewBox="0 0 300 340" aria-hidden="true">
    <defs>
      <radialGradient id="tcFur" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#ffd08a"/><stop offset=".6" stop-color="#ff9f3a"/><stop offset="1" stop-color="#e07818"/></radialGradient>
      <radialGradient id="tcCream" cx="45%" cy="35%" r="75%"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#ffe2bf"/></radialGradient>
      <radialGradient id="tcIris" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#b6f28a"/><stop offset="1" stop-color="#3aa83a"/></radialGradient>
    </defs>
    <ellipse cx="150" cy="330" rx="98" ry="10" fill="rgba(0,0,0,.16)"/>
    <g class="tcTail" data-zone="tail">
      <path d="M196 292 C258 292 278 236 252 188" fill="none" stroke="#c86a12" stroke-width="28" stroke-linecap="round"/>
      <path d="M196 292 C258 292 278 236 252 188" fill="none" stroke="#ff9f3a" stroke-width="22" stroke-linecap="round"/>
      <path d="M262 214 C258 200 255 194 252 188" fill="none" stroke="#fff2dc" stroke-width="22" stroke-linecap="round"/>
      <path d="M196 292 C258 292 278 236 252 188" fill="none" stroke="transparent" stroke-width="60" stroke-linecap="round"/>
    </g>
    <g class="tcBody" data-zone="belly">
      <ellipse cx="150" cy="258" rx="74" ry="70" fill="url(#tcFur)" stroke="#c86a12" stroke-width="3"/>
      <ellipse cx="150" cy="270" rx="44" ry="50" fill="url(#tcCream)"/>
      <ellipse cx="112" cy="320" rx="28" ry="14" fill="url(#tcFur)" stroke="#c86a12" stroke-width="3"/>
      <ellipse cx="188" cy="320" rx="28" ry="14" fill="url(#tcFur)" stroke="#c86a12" stroke-width="3"/>
      <ellipse cx="124" cy="298" rx="16" ry="21" fill="url(#tcFur)" stroke="#c86a12" stroke-width="3"/>
      <path d="M118 312 v-6 M124 313 v-7 M130 312 v-6" stroke="#c86a12" stroke-width="2.4" stroke-linecap="round"/>
      <g class="tcPawR"><ellipse cx="176" cy="298" rx="16" ry="21" fill="url(#tcFur)" stroke="#c86a12" stroke-width="3"/>
        <path d="M170 312 v-6 M176 313 v-7 M182 312 v-6" stroke="#c86a12" stroke-width="2.4" stroke-linecap="round"/></g>
    </g>
    <g class="tcHead" data-zone="head">
      <g class="tcEar l"><path d="M66 118 L80 34 L134 88 Z" fill="url(#tcFur)" stroke="#c86a12" stroke-width="3" stroke-linejoin="round"/><path d="M82 104 L88 60 L118 90 Z" fill="#ffb0c4"/></g>
      <g class="tcEar r"><path d="M234 118 L220 34 L166 88 Z" fill="url(#tcFur)" stroke="#c86a12" stroke-width="3" stroke-linejoin="round"/><path d="M218 104 L212 60 L182 90 Z" fill="#ffb0c4"/></g>
      <ellipse cx="150" cy="136" rx="90" ry="74" fill="url(#tcFur)" stroke="#c86a12" stroke-width="3"/>
      <path d="M140 66 Q138 80 142 88 M150 64 V88 M160 66 Q162 80 158 88" stroke="#d97416" stroke-width="5" stroke-linecap="round" fill="none"/>
      <ellipse class="tcMuzzle l" cx="126" cy="168" rx="28" ry="20" fill="url(#tcCream)"/>
      <ellipse class="tcMuzzle r" cx="174" cy="168" rx="28" ry="20" fill="url(#tcCream)"/>
      <g class="tcEyes">${[[112, 114, 118, 'l'], [188, 186, 190, 'r']].map(([ex, px, gx, side]) => `
        <g class="tcEye ${side}">
          <g class="tcOpen">
            <ellipse cx="${ex}" cy="126" rx="21" ry="25" fill="#fff" stroke="#3d3552" stroke-width="3"/>
            <g class="tcPupil"><circle cx="${px}" cy="130" r="13" fill="url(#tcIris)"/><circle cx="${px}" cy="131" r="7.5" fill="#22202e"/><circle cx="${gx}" cy="125" r="3.4" fill="#fff"/></g>
          </g>
          <path class="tcLid" d="M${ex - 20} 132 Q${ex} 112 ${ex + 20} 132" fill="none" stroke="#3d3552" stroke-width="4.5" stroke-linecap="round"/>
        </g>`).join('')}
      </g>
      <ellipse cx="92" cy="160" rx="10" ry="6" fill="#ff7aa8" opacity=".45"/><ellipse cx="208" cy="160" rx="10" ry="6" fill="#ff7aa8" opacity=".45"/>
      <path d="M142 152 H158 L150 161 Z" fill="#ff7aa8" stroke="#3d3552" stroke-width="2.5" stroke-linejoin="round"/>
      <g class="tcMouthOpen"><ellipse cx="150" cy="176" rx="17" ry="15" fill="#7a1f2b" stroke="#3d3552" stroke-width="2.5"/><ellipse cx="150" cy="185" rx="10" ry="5.5" fill="#ff7aa8"/></g>
      <g class="tcTongue"><path d="M140 170 C140 198 160 198 160 170 Z" fill="#ff6f9a" stroke="#3d3552" stroke-width="2.5" stroke-linejoin="round"/><path d="M150 174 V188" stroke="#d94a78" stroke-width="2" stroke-linecap="round"/></g>
      <path class="tcMouthShut" d="M134 167 Q142 176 150 166 Q158 176 166 167" fill="none" stroke="#3d3552" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M100 168 H54 M102 177 L58 190 M200 168 H246 M198 177 L242 190" stroke="#3d3552" stroke-width="2.6" stroke-linecap="round"/>
    </g>
    <g class="tcArm" data-zone="head">
      <path d="M196 246 Q240 232 252 190" fill="none" stroke="#c86a12" stroke-width="30" stroke-linecap="round"/>
      <path d="M196 246 Q240 232 252 190" fill="none" stroke="#ff9f3a" stroke-width="24" stroke-linecap="round"/>
      <circle cx="253" cy="182" r="19" fill="url(#tcFur)" stroke="#c86a12" stroke-width="3"/>
      <path d="M244 172 v6 M253 169 v7 M262 172 v6" stroke="#c86a12" stroke-width="2.4" stroke-linecap="round"/>
    </g>
  </svg>`;

  // ---------- State ----------
  let layer, wrap, catEl, mouthOpen, mouthShut, micBadge, running = false, paused = false;
  let busy = false, busyUntil = 0, timers = [], idleTimer = null, blinkTimer = null, raf = 0;
  let mouth = 0, talkLevel = () => 0, playing = null;
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  const lang = () => settings.lang;
  const hold = (ms) => { busyUntil = Math.max(busyUntil, performance.now() + ms); };
  const quiet = () => !busy && performance.now() > busyUntil;

  // ---------- Microphone: hear a phrase, then play it back squeaky ----------
  let stream = null, src = null, proc = null, sink = null, micState = 'off'; // off | asking | on | none
  let pre = [], rec = null, loud = 0, hush = 0, floor = 0.01;

  async function micOn() {
    if (micState === 'on' || micState === 'asking') return;
    const k = audio.kit();
    if (!k || !window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { setMic('none'); return; }
    setMic('asking');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (!running || paused) { s.getTracks().forEach((t) => t.stop()); setMic('off'); return; }
      stream = s;
      const ac = k.ac;
      src = ac.createMediaStreamSource(stream);
      proc = ac.createScriptProcessor(2048, 1, 1);
      sink = ac.createGain();
      sink.gain.value = 0; // the processor only runs when connected; keep it silent
      src.connect(proc); proc.connect(sink); sink.connect(ac.destination);
      proc.onaudioprocess = (e) => hear(e.inputBuffer.getChannelData(0), ac);
      pre = []; rec = null; loud = 0; hush = 0;
      setMic('on');
    } catch (e) {
      setMic('none');
    }
  }
  function micOff() {
    if (proc) { proc.onaudioprocess = null; try { src.disconnect(); proc.disconnect(); sink.disconnect(); } catch (e) { /* gone */ } }
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = src = proc = sink = null;
    rec = null; pre = [];
    if (micState !== 'none') setMic('off');
  }
  function setMic(s) {
    micState = s;
    if (micBadge) micBadge.className = 'tcMic ' + s;
  }

  function hear(chunk, ac) {
    if (!running || paused) return;
    const data = new Float32Array(chunk);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
    const rms = Math.sqrt(sum / data.length);
    const secs = data.length / ac.sampleRate;
    if (!quiet()) { // never record the cat itself
      if (rec) catEl.classList.remove('listening');
      pre = []; rec = null; loud = 0;
      return;
    }
    const thr = Math.max(0.015, floor * 3.2);
    if (!rec) {
      if (rms < thr) floor = floor * 0.98 + rms * 0.02; // learn the room's background noise
      pre.push(data);
      if (pre.length > 7) pre.shift();
      loud = rms > thr ? loud + 1 : 0;
      if (loud >= 3) { rec = pre.slice(); pre = []; hush = 0; catEl.classList.add('listening'); }
      return;
    }
    rec.push(data);
    hush = rms < thr * 0.7 ? hush + 1 : 0;
    const len = rec.length * secs;
    if (hush * secs > 0.75 || len > 6) {
      const keep = rec.slice(0, rec.length - Math.max(0, hush - 3));
      rec = null;
      catEl.classList.remove('listening');
      if (keep.length * secs > 0.35) playBack(keep, ac);
    }
  }

  function playBack(chunks, ac) {
    const k = audio.kit();
    if (!k) return;
    const n = chunks.reduce((a, c) => a + c.length, 0);
    const buf = ac.createBuffer(1, n, ac.sampleRate);
    const ch = buf.getChannelData(0);
    let o = 0, peak = 0.001;
    chunks.forEach((c) => { ch.set(c, o); o += c.length; });
    for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(ch[i]));
    const s = ac.createBufferSource();
    s.buffer = buf;
    s.playbackRate.value = pick([1.55, 1.65, 1.75]); // the funny squeaky voice
    const g = ac.createGain();
    g.gain.value = Math.min(6, 0.85 / peak);
    const an = ac.createAnalyser();
    an.fftSize = 512;
    s.connect(g); g.connect(an); k.out(an, 0.12, 0);
    const td = new Float32Array(an.fftSize);
    talkLevel = () => { an.getFloatTimeDomainData(td); let q = 0; for (let i = 0; i < td.length; i += 4) q += td[i] * td[i]; return Math.sqrt(q / (td.length / 4)); };
    busy = true;
    playing = s;
    catEl.classList.add('talking');
    s.onended = () => {
      if (playing === s) playing = null;
      talkLevel = () => 0;
      busy = false;
      hold(450);
      catEl.classList.remove('talking');
      resetIdle();
    };
    s.start();
    clearTimeout(idleTimer);
  }

  // ---------- Taps ----------
  function onDown(e) {
    if (!running) return;
    const zoneEl = e.target.closest && e.target.closest('[data-zone]');
    if (zoneEl && anticEnd) anticEnd();
    if (zoneEl && playing) { const s = playing; s.onended(); s.onended = null; try { s.stop(); } catch (err) { /* done */ } } // a tap cuts the cat off
    if (!zoneEl || busy) {
      if (!busy) { audio.tap(); fx.burst(e.clientX, e.clientY, pick(['#ff9f3a', '#ffd400', '#ff5db1', '#2f7bff']), 8); }
      return;
    }
    e.preventDefault();
    voice.stop();
    const zone = zoneEl.dataset.zone;
    if (zone === 'belly') giggle(e);
    else if (zone === 'tail') jump();
    else runAround();
  }

  // The cat runs around the screen: off to one side, across to the other, and back home.
  function runAround() {
    busy = true;
    clearTimeout(idleTimer);
    meow();
    const W = window.innerWidth, w = wrap.offsetWidth;
    const edge = Math.max(0, W / 2 - w * 0.42);
    const first = Math.random() < 0.5 ? -1 : 1;
    const stops = [first * edge, -first * edge, 0];
    const speed = Math.max(700, W * 1.1); // px per second
    let x = 0, leg = 0, t = 0, last = performance.now(), dustAt = 0;
    catEl.classList.add('running');
    const step = (now) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (paused) { raf = requestAnimationFrame(step); return; }
      t += dt;
      const target = stops[leg], dir = Math.sign(target - x) || 1;
      x += dir * speed * dt;
      if ((dir > 0 && x >= target) || (dir < 0 && x <= target)) { x = target; leg++; if (leg < stops.length) meowSoft(); }
      const hop = Math.abs(Math.sin(t * 14)) * 26;
      wrap.style.transform = `translateX(calc(-50% + ${x.toFixed(1)}px)) translateY(${-hop.toFixed(1)}px) rotate(${dir * 9}deg)`;
      if (now > dustAt) {
        dustAt = now + 110;
        const r = wrap.getBoundingClientRect();
        fx.burst(r.left + r.width / 2 - dir * r.width * 0.3, r.bottom - 10, '#e9dcc4', 3);
      }
      if (leg < stops.length) raf = requestAnimationFrame(step);
      else {
        wrap.style.transform = '';
        catEl.classList.remove('running');
        busy = false;
        hold(400);
        resetIdle();
      }
    };
    raf = requestAnimationFrame(step);
  }
  function giggle(e) {
    busy = true;
    clearTimeout(idleTimer);
    catEl.classList.remove('giggle'); void catEl.getBoundingClientRect(); catEl.classList.add('giggle');
    if (!audio.laugh(2.2)) purr();
    fx.burst(e.clientX, e.clientY, '#ff7aa8', 10);
    later(() => { catEl.classList.remove('giggle'); busy = false; hold(400); resetIdle(); }, 1900);
  }
  function jump() {
    busy = true;
    clearTimeout(idleTimer);
    catEl.classList.remove('jump'); void catEl.getBoundingClientRect(); catEl.classList.add('jump');
    boing();
    later(meow, 250);
    later(() => { const r = wrap.getBoundingClientRect(); fx.burst(r.left + r.width / 2, r.bottom - 10, '#ffd400', 12); }, 900);
    later(() => { catEl.classList.remove('jump'); busy = false; hold(400); resetIdle(); }, 1100);
  }

  // ---------- Sounds ----------
  // The real cat recording (sounds/animals/cat.mp3, also used by Animal Sounds), or a made-up meow.
  function meow() {
    mouthFor(700);
    if (audio.play('animals/cat', 1, 0, 2, { skipSilence: true, normalize: true })) return;
    synthMeow(1);
  }
  function meowSoft() { mouthFor(400); synthMeow(0.6); }
  function synthMeow(vol) {
    const k = audio.kit();
    if (!k) return;
    const t = k.ac.currentTime, o = k.ac.createOscillator(), f = k.ac.createBiquadFilter(), g = k.ac.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(520, t);
    o.frequency.linearRampToValueAtTime(820, t + 0.15);
    o.frequency.linearRampToValueAtTime(480, t + 0.5);
    f.type = 'bandpass'; f.Q.value = 3;
    f.frequency.setValueAtTime(900, t);
    f.frequency.linearRampToValueAtTime(1800, t + 0.18);
    f.frequency.linearRampToValueAtTime(800, t + 0.5);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.35 * vol, t + 0.05);
    g.gain.linearRampToValueAtTime(0.25 * vol, t + 0.35);
    g.gain.linearRampToValueAtTime(0, t + 0.55);
    o.connect(f); f.connect(g); k.out(g, 0.2, 0);
    o.start(t); o.stop(t + 0.6);
  }
  function boing() {
    const k = audio.kit();
    if (!k) return;
    const t = k.ac.currentTime, o = k.ac.createOscillator(), g = k.ac.createGain();
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(620, t + 0.25);
    k.env(g.gain, t, 0.3, 0.005, 0.3);
    o.connect(g); k.out(g, 0.2, 0);
    o.start(t); o.stop(t + 0.5);
  }
  // Tongue out: a silly "pbbbt" raspberry.
  function raspberry() {
    const k = audio.kit();
    if (!k) return;
    const t = k.ac.currentTime, o = k.ac.createOscillator(), lfo = k.ac.createOscillator(), lg = k.ac.createGain(), f = k.ac.createBiquadFilter(), g = k.ac.createGain();
    o.type = 'sawtooth'; o.frequency.value = 95;
    lfo.frequency.value = 28; lg.gain.value = 0.5;
    f.type = 'lowpass'; f.frequency.value = 900;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.4, t + 0.04);
    g.gain.setValueAtTime(0.4, t + 0.45); g.gain.linearRampToValueAtTime(0, t + 0.6);
    const am = k.ac.createGain(); am.gain.value = 0.5;
    lfo.connect(lg); lg.connect(am.gain);
    o.connect(f); f.connect(am); am.connect(g); k.out(g, 0.1, 0);
    o.start(t); lfo.start(t); o.stop(t + 0.65); lfo.stop(t + 0.65);
  }
  function sine(at, from, to, dur, vol, type = 'sine') {
    const k = audio.kit();
    if (!k) return;
    const t = k.ac.currentTime + at, o = k.ac.createOscillator(), g = k.ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + dur);
    k.env(g.gain, t, vol, 0.006, dur);
    o.connect(g); k.out(g, 0.25, 0);
    o.start(t); o.stop(t + dur * 1.5 + 0.1);
  }
  const twinkle = () => { sine(0.05, 1568, 1568, 0.25, 0.12); sine(0.16, 2093, 2093, 0.35, 0.1); };
  const ooh = () => sine(0, 380, 900, 0.45, 0.22, 'triangle');
  const pop = () => { const k = audio.kit(); if (k) k.noise(0, { dur: 0.03, vol: 0.6, type: 'highpass', freq: 1200, send: 0.2 }); };
  function wobble() { [0, 0.18, 0.36].forEach((t, i) => sine(t, 700 - i * 120, 420 - i * 80, 0.17, 0.16)); }
  function inflate() { sine(0, 200, 520, 1.1, 0.12, 'triangle'); }
  // A bouncy little dance tune with a soft beat.
  function danceTune() {
    const k = audio.kit();
    if (!k) return;
    [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 1046.5].forEach((f, i) => {
      sine(i * 0.3, f, f, 0.22, 0.13, 'triangle');
      if (i % 2 === 0) k.noise(i * 0.3, { dur: 0.08, vol: 0.4, type: 'lowpass', freq: 160, send: 0.05 });
    });
  }
  function purr() {
    const k = audio.kit();
    if (!k) return;
    for (let i = 0; i < 6; i++) k.noise(i * 0.09, { dur: 0.06, vol: 0.3, type: 'lowpass', freq: 260, q: 2, send: 0.1 });
  }

  // ---------- Face: mouth follows the voice, eyes blink ----------
  let fakeTalkUntil = 0;
  const mouthFor = (ms) => { fakeTalkUntil = performance.now() + ms; };
  function frame(now) {
    if (!running) return;
    let target = clamp(talkLevel() * 9, 0, 1);
    if (now < fakeTalkUntil) target = Math.max(target, 0.35 + 0.45 * Math.abs(Math.sin(now / 70)));
    if (catEl.classList.contains('surprised')) target = Math.max(target, 0.8);
    mouth += (target - mouth) * 0.45;
    mouthOpen.style.transform = `scaleY(${Math.max(0.05, mouth).toFixed(2)})`;
    mouthOpen.style.opacity = mouth > 0.08 ? 1 : 0;
    mouthShut.style.opacity = mouth > 0.08 ? 0 : 1;
    requestAnimationFrame(frame);
  }
  function blink() {
    if (!running) return;
    catEl.classList.add('blink');
    setTimeout(() => catEl.classList.remove('blink'), 160);
    blinkTimer = setTimeout(blink, 2500 + Math.random() * 3000);
  }

  // ---------- Silly antics at random times, in random order ----------
  const ANTICS = {
    tongue:    { ms: 1500, sound: () => raspberry() },
    wink:      { ms: 1100, sound: () => twinkle() },
    cross:     { ms: 1500, sound: () => wobble() },
    surprised: { ms: 1300, sound: () => ooh() },
    puff:      { ms: 1500, sound: () => { inflate(); later(pop, 1250); } },
    wave:      { ms: 2200, sound: () => { mouthFor(500); voice.sayLang(SAY.hi[lang()] || SAY.hi.en, lang()); later(meowSoft, 900); } },
    dance:     { ms: 2600, sound: () => { danceTune(); notes(); } },
  };
  let lastAntic = null, antics = 0, anticEnd = null;
  function resetIdle(ms = 4500 + Math.random() * 5500) {
    clearTimeout(idleTimer);
    if (running) idleTimer = setTimeout(antic, ms);
  }
  function antic() {
    if (!running || !quiet() || rec || window.MLW.isPaused()) { resetIdle(2500); return; }
    antics++;
    if (antics % 5 === 0) { // now and then, invite the child to play
      catEl.classList.remove('wave'); void catEl.getBoundingClientRect(); catEl.classList.add('wave');
      sayAsCat(micState === 'on' ? SAY.hello : SAY.poke);
      later(() => catEl.classList.remove('wave'), 2200);
      resetIdle(); return;
    }
    let name;
    do { name = pick(Object.keys(ANTICS)); } while (name === lastAntic);
    lastAntic = name;
    busy = true;
    catEl.classList.add(name);
    ANTICS[name].sound();
    const t = later(() => anticEnd && anticEnd(), ANTICS[name].ms);
    anticEnd = () => {
      clearTimeout(t);
      anticEnd = null;
      catEl.classList.remove(name);
      busy = false;
      hold(500);
      resetIdle();
    };
  }
  // Music notes float up while it dances.
  function notes() {
    const r = wrap.getBoundingClientRect(), box = layer.getBoundingClientRect();
    ['♪', '♫', '♪'].forEach((ch, i) => later(() => {
      const n = document.createElement('div');
      n.className = 'tcNote';
      n.textContent = ch;
      n.style.left = (r.left - box.left + r.width * (0.2 + Math.random() * 0.6)) + 'px';
      n.style.top = (r.top - box.top + r.height * 0.1) + 'px';
      n.style.color = pick(['#7c5cff', '#ff5db1', '#2f7bff', '#ff8c1a']);
      layer.appendChild(n);
      setTimeout(() => n.remove(), 1600);
    }, i * 500));
  }
  // The voice speaks for the cat. The microphone ignores it, so it doesn't get repeated.
  function sayAsCat(o) {
    busy = true;
    mouthFor(1200);
    let done = false;
    const finish = () => { if (done) return; done = true; busy = false; hold(600); fakeTalkUntil = 0; };
    const speaking = voice.sayLang(o[lang()] || o.en, lang(), finish);
    later(finish, speaking ? 5000 : 300);
  }

  function layout() {
    const W = window.innerWidth, H = window.innerHeight;
    const w = Math.min(W * 0.8, (H - 110) * 0.85, 520);
    wrap.style.width = Math.round(w) + 'px';
  }

  const CARD = `<svg viewBox="0 0 120 120" aria-hidden="true">
    <path d="M22 50 L28 14 L52 34 Z M98 50 L92 14 L68 34 Z" fill="#ff9f3a" stroke="#c86a12" stroke-width="2.5" stroke-linejoin="round"/>
    <ellipse cx="60" cy="62" rx="44" ry="38" fill="#ffb45c" stroke="#c86a12" stroke-width="2.5"/>
    <ellipse cx="44" cy="56" rx="9" ry="11" fill="#fff" stroke="#3d3552" stroke-width="2"/><ellipse cx="76" cy="56" rx="9" ry="11" fill="#fff" stroke="#3d3552" stroke-width="2"/>
    <circle cx="45" cy="58" r="5" fill="#22202e"/><circle cx="75" cy="58" r="5" fill="#22202e"/>
    <path d="M55 70 H65 L60 75 Z" fill="#ff7aa8"/>
    <ellipse cx="60" cy="84" rx="8" ry="7" fill="#7a1f2b"/>
    <path d="M84 24 C84 14 110 14 110 24 C110 32 100 34 96 34 L92 40 L92 34 C86 33 84 30 84 24 Z" fill="#fff" stroke="#3d3552" stroke-width="2"/>
    <path d="M93 27 v-6 l8 -2 v6" fill="none" stroke="#7c5cff" stroke-width="2.4" stroke-linecap="round"/><circle cx="92" cy="27" r="2.4" fill="#7c5cff"/><circle cx="100" cy="25" r="2.4" fill="#7c5cff"/>
  </svg>`;

  window.MLW.registerGame('talkingcat', {
    label: 'Talking cat',
    cardBg: 'radial-gradient(circle at 35% 30%, #fff4d6, #ffc46b 50%, #ff7a59 100%)',
    cardArt: (artAt) => artAt(CARD, 4, 4, 92),
    init(el) {
      layer = el;
      layer.innerHTML = `<div class="tcMic off" aria-hidden="true">🎤</div><div class="tcWrap"><div class="tcCat">${CAT}</div></div>`;
      micBadge = layer.querySelector('.tcMic');
      wrap = layer.querySelector('.tcWrap');
      catEl = layer.querySelector('.tcCat');
      mouthOpen = layer.querySelector('.tcMouthOpen');
      mouthShut = layer.querySelector('.tcMouthShut');
      layer.addEventListener('pointerdown', onDown);
      window.addEventListener('resize', () => { if (running) layout(); });
    },
    start() {
      running = true; paused = false; busy = false; busyUntil = 0;
      layout();
      wrap.style.transform = '';
      catEl.className = 'tcCat enter';
      requestAnimationFrame(frame);
      blinkTimer = setTimeout(blink, 2000);
      micOn();
      later(() => { catEl.classList.remove('enter'); sayAsCat(SAY.hello); resetIdle(); }, 900);
    },
    stop() {
      running = false;
      micOff();
      timers.forEach(clearTimeout); timers = [];
      clearTimeout(idleTimer); clearTimeout(blinkTimer); cancelAnimationFrame(raf);
      anticEnd = null;
      layer.querySelectorAll('.tcNote').forEach((n) => n.remove());
      if (playing) { try { playing.stop(); } catch (e) { /* done */ } playing = null; }
      talkLevel = () => 0;
      busy = false;
      catEl.className = 'tcCat';
      wrap.style.transform = '';
    },
    pause() {
      paused = true;
      clearTimeout(idleTimer);
      if (micState !== 'asking') micOff(); // the permission prompt itself can blur the page
    },
    resume() {
      paused = false;
      if (micState === 'off') micOn();
      resetIdle();
    },
  });
})();
