// YugaVerse Kids - Copyright (c) 2026 mayurj476. All rights reserved.
// Not for copying, reuse or redistribution without written permission. See LICENSE.

// ---------- Game: Body Parts ----------
// A big, round 3D-style baby. One body part at a time glows, a rainbow ring circles it,
// its name pops up and the voice says it loud ("Nose!"), then "Touch your nose!".
// The baby acts it out too: the nose boops, the eyes blink, the arms go up, the feet stomp.
// The big ▶ button (bottom right) goes to the next part; tapping a part also shows it.
// After all fourteen parts, the clapping cat celebrates and it starts again.
(() => {
  'use strict';
  const { audio, voice, fx, pick, clamp, settings } = window.MLW;

  const PARTS = [
    { id: 'head',  names: { en: 'Head',  hi: 'सिर',    mr: 'डोकं' },   touch: { en: 'Touch your head!',  hi: 'अपना सिर छुओ!',    mr: 'तुझं डोकं दाखव!' } },
    { id: 'hair',  names: { en: 'Hair',  hi: 'बाल',    mr: 'केस' },    touch: { en: 'Touch your hair!',  hi: 'अपने बाल छुओ!',    mr: 'तुझे केस दाखव!' } },
    { id: 'eyes',  names: { en: 'Eyes',  hi: 'आँखें',   mr: 'डोळे' },   touch: { en: 'Blink your eyes!',  hi: 'अपनी आँखें झपकाओ!', mr: 'डोळे मिचकाव!' } },
    { id: 'ears',  names: { en: 'Ears',  hi: 'कान',    mr: 'कान' },    touch: { en: 'Touch your ears!',  hi: 'अपने कान छुओ!',    mr: 'तुझे कान दाखव!' } },
    { id: 'nose',  names: { en: 'Nose',  hi: 'नाक',    mr: 'नाक' },    touch: { en: 'Touch your nose!',  hi: 'अपनी नाक छुओ!',    mr: 'तुझं नाक दाखव!' } },
    { id: 'mouth', names: { en: 'Mouth', hi: 'मुँह',    mr: 'तोंड' },   touch: { en: 'Open your mouth!',  hi: 'अपना मुँह खोलो!',   mr: 'तोंड उघड!' } },
    { id: 'teeth', names: { en: 'Teeth', hi: 'दाँत',    mr: 'दात' },    touch: { en: 'Show your teeth!',  hi: 'अपने दाँत दिखाओ!',  mr: 'तुझे दात दाखव!' } },
    { id: 'tongue', names: { en: 'Tongue', hi: 'जीभ',  mr: 'जीभ' },    touch: { en: 'Stick out your tongue!', hi: 'अपनी जीभ दिखाओ!', mr: 'तुझी जीभ दाखव!' } },
    { id: 'arms',  names: { en: 'Arms',  hi: 'बाँहें',   mr: 'बाहू' },   touch: { en: 'Arms up high!',     hi: 'बाँहें ऊपर करो!',    mr: 'हात वर कर!' } },
    { id: 'hands', names: { en: 'Hands', hi: 'हाथ',    mr: 'हात' },    touch: { en: 'Clap your hands!',  hi: 'ताली बजाओ!',       mr: 'टाळ्या वाजव!' } },
    { id: 'tummy', names: { en: 'Tummy', hi: 'पेट',    mr: 'पोट' },    touch: { en: 'Pat your tummy!',   hi: 'अपना पेट थपथपाओ!', mr: 'पोटावर हात ठेव!' } },
    { id: 'legs',  names: { en: 'Legs',  hi: 'पैर',    mr: 'पाय' },    touch: { en: 'Jump, jump!',       hi: 'कूदो, कूदो!',        mr: 'उडी मार!' } },
    { id: 'knees', names: { en: 'Knees', hi: 'घुटने',   mr: 'गुडघे' },  touch: { en: 'Bend your knees!',  hi: 'घुटने मोड़ो!',       mr: 'गुडघे वाकव!' } },
    { id: 'feet',  names: { en: 'Feet',  hi: 'पाँव',    mr: 'पावलं' },  touch: { en: 'Stomp your feet!',  hi: 'पाँव पटको!',         mr: 'पाय आपट!' } },
  ];
  const SAY = {
    intro: { en: "Let's find body parts!", hi: 'चलो शरीर के अंग देखें!', mr: 'चला शरीराचे भाग बघूया!' },
    next:  { en: 'Tap the arrow!', hi: 'तीर को छुओ!', mr: 'बाणाला हात लाव!' },
    done:  { en: 'Wow! You know your body!', hi: 'वाह! तुम्हें सब अंग पता हैं!', mr: 'वा! तुला सगळे भाग माहीत आहेत!' },
  };

  // ---------- The baby (front view, 400 x 600) ----------
  const LINE = '#d98a5f';
  const skin = (extra = '') => `fill="url(#bpSkin)" stroke="${LINE}" stroke-width="3" ${extra}`;
  const toes = (cx, dir) => [0, 1, 2, 3, 4].map((i) =>
    `<circle cx="${cx + dir * (-22 + i * 10)}" cy="${566 - Math.abs(i - 1.5) * 1.5}" r="${6.5 - i * 0.6}" ${skin()}/>`).join('');
  const armL = `
    <g class="bpPart bpArm" data-part="arms"><g data-spot>
      <path d="M144 276 Q106 304 96 350" fill="none" stroke="${LINE}" stroke-width="44" stroke-linecap="round"/>
      <path d="M144 276 Q106 304 96 350" fill="none" stroke="url(#bpSkin)" stroke-width="38" stroke-linecap="round"/>
      <ellipse cx="112" cy="300" rx="7" ry="14" fill="#fff" opacity=".35" transform="rotate(35 112 300)"/>
    </g></g>
    <g class="bpPart bpHand" data-part="hands"><g data-spot>
      <ellipse cx="117" cy="362" rx="8" ry="13" transform="rotate(-30 117 362)" ${skin()}/>
      <circle cx="95" cy="376" r="25" ${skin()}/>
      <path d="M83 393 v8 M93 396 v9 M103 394 v8" stroke="${LINE}" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="86" cy="366" rx="7" ry="5" fill="#fff" opacity=".45"/>
    </g></g>`;
  const BABY = `<svg viewBox="0 0 400 600" class="bpSvg" aria-label="Baby">
    <defs>
      <radialGradient id="bpSkin" cx="40%" cy="32%" r="78%"><stop offset="0" stop-color="#ffecd9"/><stop offset=".6" stop-color="#ffc9a3"/><stop offset="1" stop-color="#eaa077"/></radialGradient>
      <radialGradient id="bpSkinDeep" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#ffd4b3"/><stop offset="1" stop-color="#e5946a"/></radialGradient>
      <radialGradient id="bpShirt" cx="38%" cy="25%" r="85%"><stop offset="0" stop-color="#b9f0ff"/><stop offset=".55" stop-color="#45b8f2"/><stop offset="1" stop-color="#1f78c2"/></radialGradient>
      <radialGradient id="bpShorts" cx="40%" cy="25%" r="85%"><stop offset="0" stop-color="#ffc6dd"/><stop offset=".6" stop-color="#ff6fa8"/><stop offset="1" stop-color="#cf3a78"/></radialGradient>
      <radialGradient id="bpBelly" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fffbd0"/><stop offset=".6" stop-color="#ffd84a"/><stop offset="1" stop-color="#f0a800"/></radialGradient>
      <radialGradient id="bpHair" cx="45%" cy="25%" r="80%"><stop offset="0" stop-color="#c58d5a"/><stop offset=".6" stop-color="#8a5328"/><stop offset="1" stop-color="#5a3214"/></radialGradient>
      <radialGradient id="bpIris" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#9a6a44"/><stop offset="1" stop-color="#3a2414"/></radialGradient>
      <linearGradient id="bpRainbow" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ff3b3b"/><stop offset=".2" stop-color="#ff8c1a"/><stop offset=".4" stop-color="#ffd400"/>
        <stop offset=".6" stop-color="#2ecc40"/><stop offset=".8" stop-color="#2f7bff"/><stop offset="1" stop-color="#9b4dff"/>
      </linearGradient>
      <filter id="bpGlow" x="-40%" y="-40%" width="180%" height="180%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="4" result="fat"/>
        <feGaussianBlur in="fat" stdDeviation="7" result="blur"/>
        <feFlood flood-color="#fff36a"/><feComposite in2="blur" operator="in" result="glow"/>
        <feMerge><feMergeNode in="glow"/><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <ellipse cx="200" cy="584" rx="128" ry="12" fill="rgba(0,0,0,.15)"/>
    <g class="bpBaby">
      <g class="bpLower">
        <g class="bpPart bpLegs" data-part="legs">
          <rect data-spot x="150" y="396" width="44" height="156" rx="22" ${skin()}/>
          <rect data-spot x="206" y="396" width="44" height="156" rx="22" ${skin()}/>
          <rect x="158" y="420" width="8" height="90" rx="4" fill="#fff" opacity=".3"/><rect x="214" y="420" width="8" height="90" rx="4" fill="#fff" opacity=".3"/>
        </g>
        <g class="bpPart bpKnees" data-part="knees">
          <ellipse data-spot cx="172" cy="484" rx="18" ry="13" fill="url(#bpSkinDeep)"/>
          <ellipse data-spot cx="228" cy="484" rx="18" ry="13" fill="url(#bpSkinDeep)"/>
          <path d="M162 480 Q172 474 182 480 M218 480 Q228 474 238 480" fill="none" stroke="${LINE}" stroke-width="2.5" stroke-linecap="round"/>
        </g>
        <g class="bpPart bpFeet" data-part="feet">
          <g class="bpFoot l" data-spot><ellipse cx="166" cy="556" rx="36" ry="19" ${skin()}/>${toes(166, 1)}</g>
          <g class="bpFoot r" data-spot><ellipse cx="234" cy="556" rx="36" ry="19" ${skin()}/>${toes(234, -1)}</g>
        </g>
      </g>
      <g class="bpUpper">
        <g class="bpSide l">${armL}</g>
        <g class="bpSide r"><g transform="matrix(-1 0 0 1 400 0)">${armL}</g></g>
        <g class="bpTorso" data-tap="tummy">
          <path d="M124 390 H276 L283 452 C283 460 277 464 269 464 H214 L200 438 L186 464 H131 C123 464 117 460 117 452 Z" fill="url(#bpShorts)" stroke="#b02d63" stroke-width="3" stroke-linejoin="round" data-tap="legs"/>
          <path d="M136 256 C150 247 170 244 200 244 C230 244 250 247 264 256 L292 290 C296 298 292 306 284 309 L268 313 L276 398 C276 410 262 416 200 416 C138 416 124 410 124 398 L132 313 L116 309 C108 306 104 298 108 290 Z" fill="url(#bpShirt)" stroke="#1a64a3" stroke-width="3" stroke-linejoin="round"/>
          <path d="M170 248 Q200 270 230 248" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".8"/>
          <ellipse cx="160" cy="290" rx="14" ry="26" fill="#fff" opacity=".22" transform="rotate(20 160 290)"/>
        </g>
        <g class="bpPart bpTummy" data-part="tummy">
          <ellipse data-spot cx="200" cy="350" rx="50" ry="42" fill="url(#bpBelly)" stroke="#e09a00" stroke-width="3"/>
          <path d="M200 330 L206 343 L220 344 L209 353 L213 367 L200 359 L187 367 L191 353 L180 344 L194 343 Z" fill="#ff8c1a" stroke="#e06a00" stroke-width="2" stroke-linejoin="round"/>
          <ellipse cx="184" cy="332" rx="12" ry="6" fill="#fff" opacity=".5"/>
        </g>
        <g class="bpHeadAll" data-tap="head">
          <rect x="180" y="228" width="40" height="28" fill="url(#bpSkinDeep)"/>
          <g class="bpPart bpEars" data-part="ears">
            <g class="bpEar l" data-spot><ellipse cx="96" cy="166" rx="22" ry="29" ${skin()}/><ellipse cx="99" cy="166" rx="11" ry="17" fill="#f2a984"/></g>
            <g class="bpEar r" data-spot><ellipse cx="304" cy="166" rx="22" ry="29" ${skin()}/><ellipse cx="301" cy="166" rx="11" ry="17" fill="#f2a984"/></g>
          </g>
          <g class="bpPart bpHead" data-part="head">
            <circle data-spot cx="200" cy="152" r="108" ${skin()}/>
            <ellipse cx="156" cy="104" rx="30" ry="18" fill="#fff" opacity=".35" transform="rotate(-25 156 104)"/>
          </g>
          <g class="bpPart bpHair" data-part="hair"><g data-spot>
            <path d="M104 128 C100 70 146 42 200 42 C254 42 300 70 296 128 C282 98 250 84 222 88 C214 74 200 70 186 80 C160 76 124 92 104 128 Z" fill="url(#bpHair)" stroke="#4a2810" stroke-width="3" stroke-linejoin="round"/>
            <path d="M198 46 C186 18 222 8 222 30 C222 44 204 44 206 32" fill="none" stroke="#5a3214" stroke-width="9" stroke-linecap="round"/>
            <ellipse cx="170" cy="62" rx="20" ry="7" fill="#fff" opacity=".25" transform="rotate(-15 170 62)"/>
          </g></g>
          <ellipse cx="136" cy="198" rx="20" ry="12" fill="#ff8fb1" opacity=".5"/><ellipse cx="264" cy="198" rx="20" ry="12" fill="#ff8fb1" opacity=".5"/>
          <path d="M142 118 Q160 108 178 116 M222 116 Q240 108 258 118" fill="none" stroke="#7a4a24" stroke-width="5" stroke-linecap="round"/>
          <g class="bpPart bpEyes" data-part="eyes">
            ${[160, 240].map((x) => `<g class="bpEye" data-spot>
              <ellipse cx="${x}" cy="152" rx="18" ry="21" fill="#fff" stroke="#3d3552" stroke-width="3"/>
              <circle cx="${x + 1}" cy="155" r="12" fill="url(#bpIris)"/><circle cx="${x + 1}" cy="156" r="6.5" fill="#1d1410"/>
              <circle cx="${x + 5}" cy="150" r="3.6" fill="#fff"/><circle cx="${x - 4}" cy="161" r="1.8" fill="#fff"/>
            </g>`).join('')}
          </g>
          <g class="bpPart bpNose" data-part="nose"><g data-spot>
            <ellipse cx="200" cy="186" rx="14" ry="11" fill="url(#bpSkinDeep)" stroke="${LINE}" stroke-width="2.5"/>
            <ellipse cx="195" cy="182" rx="5" ry="3" fill="#fff" opacity=".7"/>
          </g></g>
          <g class="bpMouthAll">
            <clipPath id="bpMouthClip"><path d="M166 206 Q200 252 234 206 Q200 218 166 206 Z"/></clipPath>
            <g class="bpPart bpMouth" data-part="mouth"><g data-spot>
              <path d="M166 206 Q200 252 234 206 Q200 218 166 206 Z" fill="#c9374a" stroke="#8a1f30" stroke-width="2.5" stroke-linejoin="round"/>
            </g></g>
            <g class="bpPart bpTeeth" data-part="teeth"><g data-spot clip-path="url(#bpMouthClip)">
              <rect x="186" y="208" width="13" height="12" rx="3" fill="#fff" stroke="#e2d6d0" stroke-width="1.5"/>
              <rect x="201" y="208" width="13" height="12" rx="3" fill="#fff" stroke="#e2d6d0" stroke-width="1.5"/>
            </g></g>
            <g class="bpPart bpTongue" data-part="tongue"><g data-spot>
              <path d="M186 228 C186 220 214 220 214 228 C214 238 186 238 186 228 Z" fill="#ff7f9e" stroke="#d94a6e" stroke-width="2"/>
              <path d="M200 224 V232" stroke="#d94a6e" stroke-width="1.8" stroke-linecap="round"/>
            </g></g>
          </g>
        </g>
      </g>
    </g>
    <g class="bpRings"></g>
  </svg>`;

  // ---------- State ----------
  let layer, svg, wordEl, nextBtn, dotsEl, running = false, idx = -1, seen = new Set();
  let timers = [], idleTimer = null, actTimer = null;
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  const lang = () => settings.lang;
  const tr = (o) => o[lang()] || o.en;

  function layout() {
    const H = window.innerHeight, W = window.innerWidth;
    const h = Math.min(H - 150, (W - 40) * 1.5);
    svg.style.height = Math.max(240, Math.round(h)) + 'px';
  }

  // Glow + rainbow rings around the part, the word on top, and the baby acting it out.
  function show(i, fromTap) {
    idx = i;
    const p = PARTS[i];
    seen.add(p.id);
    svg.querySelectorAll('.bpPart').forEach((g) => { g.classList.remove('hl'); g.removeAttribute('filter'); });
    svg.classList.remove(...PARTS.map((q) => 'do-' + q.id)); // measure the rings with the baby standing still
    const groups = [...svg.querySelectorAll(`.bpPart[data-part="${p.id}"]`)]; // left and right arm are two groups
    drawRings(groups);
    groups.forEach((g) => { g.classList.add('hl'); g.setAttribute('filter', 'url(#bpGlow)'); });
    act(p.id);
    renderWord(p);
    renderDots();
    voice.stop();
    voice.sayLang(tr(p.names) + '!', lang(), () => later(() => { if (running && idx === i) voice.sayLang(tr(p.touch), lang()); }, 350));
    if (!fromTap) {
      const r = groups[0].getBoundingClientRect();
      fx.burst(r.left + r.width / 2, r.top + r.height / 2, pick(['#ffd400', '#ff5db1', '#2f7bff', '#2ecc40']), 14);
    }
    resetIdle();
  }

  function drawRings(groups) {
    const rings = svg.querySelector('.bpRings');
    const inv = svg.getScreenCTM().inverse();
    rings.innerHTML = groups.flatMap((g) => [...g.querySelectorAll('[data-spot]')]).map((el) => {
      const r = el.getBoundingClientRect();
      const a = new DOMPoint(r.left, r.top).matrixTransform(inv), b = new DOMPoint(r.right, r.bottom).matrixTransform(inv);
      const pad = 12, rx = (b.x - a.x) / 2 + pad, ry = (b.y - a.y) / 2 + pad;
      return `<g class="bpRing" style="transform-origin:${((a.x + b.x) / 2).toFixed(1)}px ${((a.y + b.y) / 2).toFixed(1)}px">
        <ellipse cx="${((a.x + b.x) / 2).toFixed(1)}" cy="${((a.y + b.y) / 2).toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="rgba(255,255,255,.14)" stroke="url(#bpRainbow)" stroke-width="6" stroke-dasharray="16 10" stroke-linecap="round"/>
      </g>`;
    }).join('');
  }

  function renderWord(p) {
    const word = tr(p.names);
    const cols = ['#ff3b3b', '#ff8c1a', '#2ecc40', '#2f7bff', '#9b4dff', '#ff5db1'];
    // Devanagari letters must stay joined, so Hindi and Marathi words stay one piece.
    const latin = /^[A-Za-z ]+$/.test(word);
    wordEl.innerHTML = latin
      ? word.split('').map((ch, k) => `<span style="color:${cols[k % cols.length]};animation-delay:${(k * 0.06).toFixed(2)}s">${ch}</span>`).join('')
      : `<span style="color:${pick(cols)}">${word}</span>`;
    wordEl.classList.remove('pop'); void wordEl.offsetWidth; wordEl.classList.add('pop');
  }
  function renderDots() {
    dotsEl.innerHTML = PARTS.map((p, i) => `<span class="${i === idx ? 'now' : seen.has(p.id) ? 'on' : ''}"></span>`).join('');
  }

  // ---------- The baby acts out each part ----------
  function act(id) {
    clearTimeout(actTimer);
    svg.classList.remove(...PARTS.map((p) => 'do-' + p.id));
    void svg.getBoundingClientRect();
    svg.classList.add('do-' + id);
    actTimer = setTimeout(() => svg.classList.remove('do-' + id), 1700);
    const S = {
      head: () => [0, 0.35].forEach((t) => tone(t, 300, 240, 0.18, 0.18)),
      hair: () => tone(0, 260, 900, 0.3, 0.16, 'triangle'),
      eyes: () => [0.1, 0.5].forEach((t) => tone(t, 1568, 1568, 0.18, 0.1)),
      ears: () => [0, 0.15, 0.3].forEach((t, i) => tone(t, 500 + i * 120, 700 + i * 120, 0.1, 0.12)),
      nose: () => tone(0.05, 500, 1300, 0.16, 0.25),
      mouth: () => tone(0.05, 300, 500, 0.4, 0.16, 'triangle'),
      teeth: () => [0.05, 0.4, 0.75].forEach((t) => chomp(t)),
      tongue: () => raspberry(0.15),
      arms: () => { const k = audio.kit(); if (k) k.noise(0, { dur: 0.35, vol: 0.3, type: 'bandpass', freq: 900, q: 0.8, attack: 0.12 }); tone(0.1, 400, 1000, 0.35, 0.14, 'triangle'); },
      hands: () => [0.15, 0.55, 0.95].forEach((t) => later(() => audio.clap && audio.clap(), t * 1000)),
      tummy: () => { if (!audio.laugh(2)) [0, 0.12, 0.24, 0.36].forEach((t) => tone(t, 700, 500, 0.08, 0.14)); },
      legs: () => tone(0, 180, 640, 0.3, 0.3),
      knees: () => [0, 0.5].forEach((t) => tone(t, 520, 260, 0.25, 0.16, 'triangle')),
      feet: () => [0, 0.3, 0.6, 0.9].forEach((t) => thump(t)),
    };
    S[id]();
  }
  function tone(at, from, to, dur, vol, type = 'sine') {
    const k = audio.kit();
    if (!k) return;
    const t = k.ac.currentTime + at, o = k.ac.createOscillator(), g = k.ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + dur);
    k.env(g.gain, t, vol, 0.006, dur);
    o.connect(g); k.out(g, 0.2, 0);
    o.start(t); o.stop(t + dur * 1.5 + 0.1);
  }
  // Teeth: a little "chomp" click.
  function chomp(at) {
    const k = audio.kit();
    if (!k) return;
    k.noise(at, { dur: 0.015, vol: 0.6, type: 'highpass', freq: 2200, q: 0.8, send: 0.1 });
    tone(at, 900, 500, 0.06, 0.12);
  }
  // Tongue out: a silly "blblbl" raspberry.
  function raspberry(at) {
    const k = audio.kit();
    if (!k) return;
    const t = k.ac.currentTime + at, o = k.ac.createOscillator(), lfo = k.ac.createOscillator(), depth = k.ac.createGain();
    const f = k.ac.createBiquadFilter(), am = k.ac.createGain(), g = k.ac.createGain();
    o.type = 'sawtooth'; o.frequency.value = 110;
    lfo.frequency.value = 26; depth.gain.value = 0.5; am.gain.value = 0.5;
    f.type = 'lowpass'; f.frequency.value = 1000;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.35, t + 0.04);
    g.gain.setValueAtTime(0.35, t + 0.55); g.gain.linearRampToValueAtTime(0, t + 0.7);
    lfo.connect(depth); depth.connect(am.gain);
    o.connect(f); f.connect(am); am.connect(g); k.out(g, 0.1, 0);
    o.start(t); lfo.start(t); o.stop(t + 0.75); lfo.stop(t + 0.75);
  }
  function thump(at) {
    const k = audio.kit();
    if (!k) return;
    k.noise(at, { dur: 0.1, vol: 0.7, type: 'lowpass', freq: 180, q: 1, send: 0.1 });
    tone(at, 140, 60, 0.12, 0.3);
  }

  // ---------- Taps ----------
  function goNext() {
    nextBtn.classList.remove('press', 'nudge'); void nextBtn.offsetWidth; nextBtn.classList.add('press');
    audio.tap();
    if (idx === PARTS.length - 1 && seen.size === PARTS.length) {
      // All of them: the clapping cat celebrates, then it starts again from the head.
      clearRing();
      idx = -1; seen = new Set();
      renderDots();
      window.MLW.celebrate({ phrase: 'Yay!', say: tr(SAY.done), lang: lang() });
      return;
    }
    show((idx + 1) % PARTS.length);
  }
  function clearRing() {
    svg.querySelector('.bpRings').innerHTML = '';
    svg.querySelectorAll('.bpPart').forEach((g) => { g.classList.remove('hl'); g.removeAttribute('filter'); });
    wordEl.innerHTML = '';
  }
  // Forgiving touch: the part under the finger, or the closest one nearby.
  // Small parts (nose, eyes...) sit on big ones (head, tummy), so a finger close to a
  // small part counts for the small part.
  const BIG = ['head', 'tummy', 'legs', 'arms', 'hair', 'mouth'];
  function partAt(e) {
    const hit = e.target.closest && e.target.closest('[data-part],[data-tap]');
    const direct = hit && svg.contains(hit) ? hit.dataset.part || hit.dataset.tap : null;
    if (direct && !BIG.includes(direct)) return direct;
    const small = nearest(e, 22, (id) => !BIG.includes(id));
    return small || direct || nearest(e, 50, () => true);
  }
  function nearest(e, within, ok) {
    const inv = svg.getScreenCTM().inverse();
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(inv);
    let best = null, bestD = within;
    svg.querySelectorAll('.bpPart').forEach((g) => ok(g.dataset.part) && g.querySelectorAll('[data-spot]').forEach((el) => {
      const r = el.getBoundingClientRect();
      const a = new DOMPoint(r.left, r.top).matrixTransform(inv), b = new DOMPoint(r.right, r.bottom).matrixTransform(inv);
      const d = Math.hypot(Math.max(a.x - p.x, 0, p.x - b.x), Math.max(a.y - p.y, 0, p.y - b.y));
      if (d < bestD) { bestD = d; best = g.dataset.part; }
    }));
    return best;
  }
  function onDown(e) {
    if (!running) return;
    if (e.target.closest && e.target.closest('.bpNext')) { e.preventDefault(); goNext(); return; }
    const id = partAt(e);
    if (id) { e.preventDefault(); show(PARTS.findIndex((p) => p.id === id), true); fx.burst(e.clientX, e.clientY, '#ffd400', 10); return; }
    audio.tap();
    fx.burst(e.clientX, e.clientY, pick(['#ff5db1', '#2f7bff', '#2ecc40']), 6);
  }

  function resetIdle() {
    clearTimeout(idleTimer);
    if (running) idleTimer = setTimeout(hint, 9000);
  }
  function hint() {
    if (!running || window.MLW.isPaused()) return;
    nextBtn.classList.remove('nudge'); void nextBtn.offsetWidth; nextBtn.classList.add('nudge');
    voice.sayLang(tr(SAY.next), lang());
    resetIdle();
  }

  const CARD = `<svg viewBox="0 0 120 120" aria-hidden="true">
    <defs><radialGradient id="bpCardSkin" cx="40%" cy="32%" r="78%"><stop offset="0" stop-color="#ffecd9"/><stop offset=".6" stop-color="#ffc9a3"/><stop offset="1" stop-color="#eaa077"/></radialGradient></defs>
    <ellipse cx="22" cy="64" rx="9" ry="12" fill="url(#bpCardSkin)" stroke="#d98a5f" stroke-width="2"/><ellipse cx="98" cy="64" rx="9" ry="12" fill="url(#bpCardSkin)" stroke="#d98a5f" stroke-width="2"/>
    <circle cx="60" cy="62" r="42" fill="url(#bpCardSkin)" stroke="#d98a5f" stroke-width="2"/>
    <path d="M22 54 C20 30 40 18 60 18 C80 18 100 30 98 54 C92 42 80 36 68 38 C64 32 58 30 52 34 C42 32 30 40 22 54 Z" fill="#8a5328"/>
    <circle cx="45" cy="62" r="7" fill="#3a2414"/><circle cx="75" cy="62" r="7" fill="#3a2414"/><circle cx="47" cy="60" r="2.2" fill="#fff"/><circle cx="77" cy="60" r="2.2" fill="#fff"/>
    <ellipse cx="60" cy="76" rx="12" ry="10" fill="none" stroke="#ffd400" stroke-width="3.5" stroke-dasharray="6 4"/>
    <ellipse cx="60" cy="76" rx="6" ry="4.5" fill="#f0a07a"/>
    <path d="M50 88 Q60 97 70 88" fill="none" stroke="#c9374a" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="36" cy="80" rx="7" ry="4" fill="#ff8fb1" opacity=".6"/><ellipse cx="84" cy="80" rx="7" ry="4" fill="#ff8fb1" opacity=".6"/>
  </svg>`;

  window.MLW.registerGame('bodyparts', {
    label: 'Body parts',
    cardBg: 'radial-gradient(circle at 35% 30%, #fff0f6, #ffb3d1 50%, #8f7bff 100%)',
    cardArt: (artAt) => artAt(CARD, 4, 4, 92),
    init(el) {
      layer = el;
      layer.innerHTML = `<div class="bpWord"></div><div class="bpDots"></div><div class="bpStage">${BABY}</div>
        <button class="bpNext" aria-label="Next"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M38 26 L72 50 L38 74 Z" fill="#fff" stroke="#fff" stroke-width="10" stroke-linejoin="round"/></svg></button>`;
      wordEl = layer.querySelector('.bpWord');
      dotsEl = layer.querySelector('.bpDots');
      svg = layer.querySelector('.bpSvg');
      nextBtn = layer.querySelector('.bpNext');
      layer.addEventListener('pointerdown', onDown);
      window.addEventListener('resize', () => { if (running) { layout(); if (idx >= 0) drawRings([...svg.querySelectorAll('.bpPart.hl')]); } });
    },
    start() {
      running = true;
      idx = -1; seen = new Set();
      layout();
      clearRing();
      renderDots();
      svg.classList.add('enter');
      later(() => svg.classList.remove('enter'), 900);
      later(() => voice.sayLang(tr(SAY.intro), lang(), () => later(() => { if (running && idx < 0) show(0); }, 300)), 500);
      later(() => { if (running && idx < 0) show(0); }, 4500); // in case the voice is off
    },
    stop() {
      running = false;
      timers.forEach(clearTimeout); timers = [];
      clearTimeout(idleTimer); clearTimeout(actTimer);
      clearRing();
    },
    pause() { clearTimeout(idleTimer); },
    resume() { resetIdle(); },
    afterCelebration() { later(() => show(0), 300); },
  });
})();
