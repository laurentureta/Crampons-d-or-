// ===================== AUDIO : playlist originale (synthèse) + ambiance de stade =====================
const AU = { ctx: null, failed: false, cur: 0, playing: false, scene: '', tm: null, nextT: 0, step: 0, pos: null, crowd: null, crowdT: null, unlocked: false, order: [] };
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
// Morceaux originaux, composés pour le jeu. Sections : [mesures, couches, mélodie]. Couches : K grosse caisse, S caisse claire/clap, H charleston, B basse, P nappe, Q cordes, E piano électrique, A arpège, L mélodie, X accords plaqués, T toms/timbales, V vinyle, C cymbale, R montée, F filtre
const TRACKS = [
  { n: 'Coup d\'envoi', s: 'Hymne de stade', bpm: 118, sw: 0, vol: 1.15,
    prog: [[45, [57, 60, 64]], [41, [57, 60, 65]], [48, [55, 60, 64]], [43, [55, 59, 62]]],
    dr: { K: 'x...x...x...x...', S: '....x.......x...', H: '..x...x...x...x.', h: 'x.x.x.x.x.x.x.x.' },
    bass: { t: 'saw', p: [[0, 0, 2], [2, 0, 2], [4, 12, 2], [6, 0, 2], [8, 0, 2], [10, 0, 2], [12, 12, 2], [14, 7, 2]] },
    arp: [[0, 12], [1, 12], [2, 12], [0, 24], [2, 12], [1, 12], [0, 12], [1, 12]], arpRate: 2, pad: 'saw', lead: 'anthem',
    mel: { A: [[[0, 76, 4], [4, 76, 2], [6, 74, 2], [8, 72, 4], [12, 74, 4]], [[0, 72, 6], [6, 69, 2], [8, 72, 4], [12, 74, 4]], [[0, 76, 4], [4, 79, 4], [8, 76, 4], [12, 74, 4]], [[0, 74, 8], [8, 71, 4], [12, 74, 4]]],
      B: [[[0, 76, 4], [4, 76, 2], [6, 74, 2], [8, 72, 4], [12, 74, 4]], [[0, 72, 6], [6, 69, 2], [8, 72, 4], [12, 74, 4]], [[0, 76, 4], [4, 79, 4], [8, 81, 4], [12, 79, 4]], [[0, 74, 4], [4, 76, 4], [8, 79, 8]]] },
    sec: [[4, 'PTRF'], [8, 'KSHBPA'], [8, 'KSHBPAL', 'A'], [4, 'PLF', 'A'], [8, 'KSHBPALC', 'B'], [4, 'PF']] },
  { n: 'Vestiaire', s: 'Hip-hop boom bap', bpm: 88, sw: .6,
    prog: [[38, [50, 53, 57, 60, 64]], [43, [55, 58, 62, 65]], [46, [53, 57, 58, 62]], [45, [52, 55, 57, 61]]],
    dr: { K: 'x.....x...x..x..', S: '....x.......x...', g: '.......x.......x', h: 'x.x.x.x.x.x.x.x.' },
    bass: { t: 'sub', p: [[0, 0, 6], [10, 0, 3], [13, 12, 3]] }, keys: [[0, 6], [10, 5]], lead: 'flute',
    mel: { A: [[[0, 69, 3], [3, 72, 3], [6, 74, 6], [12, 77, 4]], [[0, 74, 6], [6, 72, 2], [8, 70, 4], [12, 69, 4]], [[0, 65, 4], [4, 69, 4], [8, 74, 8]], [[0, 73, 4], [4, 76, 4], [8, 69, 8]]] },
    sec: [[2, 'EVF'], [8, 'KSHBEV'], [8, 'KSHBEVL', 'A'], [8, 'KSHBEV'], [2, 'EV']] },
  { n: 'Sous les projecteurs', s: 'Synthwave', bpm: 104, sw: 0, vol: 1.3,
    prog: [[40, [52, 55, 59, 64]], [36, [52, 55, 60, 64]], [43, [50, 55, 59, 62]], [38, [50, 54, 57, 62]]],
    dr: { K: 'x.......x.......', S: '....x.......x...', h: 'xxxxxxxxxxxxxxxx' },
    bass: { t: 'pulse', p: [[0, 0, 1], [2, 12, 1], [4, 0, 1], [6, 12, 1], [8, 0, 1], [10, 12, 1], [12, 0, 1], [14, 12, 1]] },
    arp: [[0, 12], [1, 12], [2, 12], [3, 12]], arpRate: 1, pad: 'warm', lead: 'saw',
    mel: { A: [[[0, 71, 6], [6, 67, 2], [8, 69, 4], [12, 71, 4]], [[0, 72, 6], [6, 71, 2], [8, 67, 8]], [[0, 74, 4], [4, 71, 4], [8, 67, 4], [12, 69, 4]], [[0, 66, 8], [8, 69, 4], [12, 74, 4]]] },
    sec: [[4, 'PAF'], [8, 'KSHBPA'], [8, 'KSHBPAL', 'A'], [4, 'PA'], [8, 'KSHBPALC', 'A'], [4, 'PAF']] },
  { n: 'Centre de formation', s: 'Lo-fi chill', bpm: 74, sw: .62,
    prog: [[41, [53, 57, 60, 64]], [40, [52, 55, 59, 62]], [38, [50, 53, 57, 60]], [36, [48, 52, 55, 59]]],
    dr: { K: 'x......x..x.....', r: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
    bass: { t: 'sub', p: [[0, 0, 7], [10, 0, 5]] }, keys: [[0, 8], [8, 8]], lead: 'bell',
    mel: { A: [[[0, 69, 4], [4, 72, 4], [8, 76, 8]], [[0, 74, 6], [6, 71, 2], [8, 67, 8]], [[0, 65, 4], [4, 69, 4], [8, 72, 4], [12, 74, 4]], [[0, 64, 8], [8, 67, 8]]] },
    sec: [[2, 'EV'], [8, 'KSHBEV'], [8, 'KSHBEVL', 'A'], [4, 'EVF'], [2, 'EV']] },
  { n: 'Mercato', s: 'House', bpm: 122, sw: 0,
    prog: [[36, [51, 55, 58, 62]], [44, [51, 55, 56, 60]], [39, [50, 55, 58, 62]], [46, [50, 53, 55, 58]]],
    dr: { K: 'x...x...x...x...', S: '....x.......x...', H: '..x...x...x...x.', h: 'xxxxxxxxxxxxxxxx' },
    bass: { t: 'square', p: [[2, 0, 2], [6, 0, 2], [10, 0, 2], [14, 12, 2]] }, stab: [3, 6, 11], pad: 'saw', lead: 'pluck',
    mel: { A: [[[0, 67, 2], [3, 70, 2], [6, 72, 2], [10, 75, 2], [12, 74, 2]], [[0, 68, 2], [3, 72, 2], [6, 75, 2], [10, 72, 2], [12, 70, 2]], [[0, 67, 2], [3, 70, 2], [6, 74, 2], [10, 75, 2], [12, 79, 2]], [[0, 70, 2], [3, 74, 2], [6, 77, 2], [10, 74, 2], [12, 72, 2]]] },
    sec: [[4, 'KH'], [8, 'KSHBX'], [8, 'KSHBXL', 'A'], [4, 'PLFR', 'A'], [8, 'KSHBXLC', 'A'], [4, 'KHF']] },
  { n: 'Ballon d\'Or', s: 'Cinématique', bpm: 84, sw: 0, vol: 1.7,
    prog: [[36, [55, 60, 64, 67]], [35, [55, 59, 62, 67]], [33, [57, 60, 64, 69]], [29, [57, 60, 65, 69]], [38, [57, 62, 65, 69]], [31, [55, 59, 62, 67]], [36, [55, 60, 64, 67]], [36, [55, 60, 65, 67]]],
    dr: { K: 'x.......x.......', t: 'x...............' },
    bass: { t: 'brass', p: [[0, 0, 16]] }, lead: 'bell',
    mel: { A: [[[0, 76, 8], [8, 79, 8]], [[0, 74, 8], [8, 71, 8]], [[0, 72, 4], [4, 76, 4], [8, 81, 8]], [[0, 81, 6], [6, 79, 2], [8, 77, 4], [12, 76, 4]], [[0, 74, 8], [8, 77, 8]], [[0, 79, 12], [12, 77, 4]], [[0, 76, 16]], []] },
    sec: [[4, 'QF'], [8, 'QTL', 'A'], [8, 'QTLBKC', 'A'], [4, 'Q']] },
];
function impulse(c, sec, decay) { const n = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, n, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); } return b; }
function noiseBuf(c, sec, brown) { const n = Math.floor(c.sampleRate * sec), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); let l = 0; for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; if (brown) { l = (l + .02 * w) / 1.02; d[i] = l * 3.5; } else d[i] = w; } return b; }
function auInit() {
  if (AU.ctx) return true; if (AU.failed) return false;
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!AC) { AU.failed = true; return false; }
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { }
  try {
    const c = AU.ctx = new AC();
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 3; comp.attack.value = .005; comp.release.value = .25; comp.connect(c.destination);
    AU.master = c.createGain(); AU.master.gain.value = .9; AU.master.connect(comp);
    AU.musF = c.createBiquadFilter(); AU.musF.type = 'lowpass'; AU.musF.frequency.value = 18000; AU.musF.connect(AU.master);
    AU.mus = c.createGain(); AU.mus.gain.value = 0; AU.mus.connect(AU.musF);
    AU.bus = c.createGain(); AU.bus.connect(AU.mus);
    AU.rev = c.createConvolver(); AU.rev.buffer = impulse(c, 2.6, 2.8); const rg = c.createGain(); rg.gain.value = .5; AU.rev.connect(rg); rg.connect(AU.bus);
    AU.dly = c.createDelay(2); AU.dly.delayTime.value = .38; const fb = c.createGain(); fb.gain.value = .32; const dl = c.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 2600; AU.dly.connect(dl); dl.connect(fb); fb.connect(AU.dly); const dg = c.createGain(); dg.gain.value = .5; dl.connect(dg); dg.connect(AU.bus);
    AU.fx = c.createGain(); AU.fx.gain.value = OPTS.svol ?? .8; AU.fx.connect(AU.master);
    AU.frev = c.createConvolver(); AU.frev.buffer = impulse(c, 3.2, 2.2); const fr = c.createGain(); fr.gain.value = .45; AU.frev.connect(fr); fr.connect(AU.fx);
    AU.white = noiseBuf(c, 2.5, false); AU.brown = noiseBuf(c, 4, true);
    document.addEventListener('visibilitychange', () => { if (!AU.ctx) return; if (document.hidden) AU.ctx.suspend(); else if (AU.unlocked) AU.ctx.resume(); });
    return true;
  } catch (e) { AU.failed = true; AU.ctx = null; return false; }
}
function auUnlock() { if (!auInit()) return; if (!AU.unlocked) { if (typeof pkdb === 'function') pkdb().then(() => sfxGenLoad()); } AU.unlocked = true; if (AU.ctx.state !== 'running') AU.ctx.resume(); auScene(AU.want || 'menu', true); }
// ---------- Instruments ----------
function vca(t, peak, a, d, s, r, dur) { const g = AU.ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setTargetAtTime(peak * s, t + a, d / 3); g.gain.setTargetAtTime(0, t + Math.max(a, dur), r / 4); return g; }
function send(node, rev, dly) { if (rev) { const g = AU.ctx.createGain(); g.gain.value = rev; node.connect(g); g.connect(AU.rev); } if (dly) { const g = AU.ctx.createGain(); g.gain.value = dly; node.connect(g); g.connect(AU.dly); } node.connect(AU.bus); }
function osc(type, f, t, stop, det) { const o = AU.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (det) o.detune.value = det; o.start(t); o.stop(stop); return o; }
function noiseSrc(t, stop, brown) { const s = AU.ctx.createBufferSource(); s.buffer = brown ? AU.brown : AU.white; s.loop = true; s.start(t, Math.random() * 1.5); s.stop(stop); return s; }
function filt(type, f, q) { const b = AU.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q) b.Q.value = q; return b; }
const I = {
  kick(t, v) { const c = AU.ctx, o = osc('sine', 150, t, t + .4); o.frequency.exponentialRampToValueAtTime(42, t + .12); const g = c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + .38); o.connect(g); g.connect(AU.bus); },
  snare(t, v) { const n = noiseSrc(t, t + .25), f = filt('bandpass', 1900, .7), g = vca(t, v * .55, .002, .12, 0, .1, .02); n.connect(f); f.connect(g); send(g, .25); const o = osc('triangle', 190, t, t + .15), g2 = vca(t, v * .35, .002, .07, 0, .05, .02); o.connect(g2); g2.connect(AU.bus); },
  clap(t, v) { const n = noiseSrc(t, t + .3), f = filt('bandpass', 1150, 1.1), g = AU.ctx.createGain(); g.gain.setValueAtTime(0, t); [0, .011, .022].forEach(d => { g.gain.setValueAtTime(v * .6, t + d); g.gain.linearRampToValueAtTime(v * .1, t + d + .009); }); g.gain.setTargetAtTime(0, t + .03, .05); n.connect(f); f.connect(g); send(g, .3); },
  rim(t, v) { const o = osc('triangle', 820, t, t + .06), g = vca(t, v * .25, .001, .03, 0, .02, .01), f = filt('highpass', 400); o.connect(f); f.connect(g); send(g, .2); },
  hat(t, v, open) { const n = noiseSrc(t, t + .4), f = filt('highpass', 7600), g = vca(t, v * .16, .001, open ? .2 : .04, 0, open ? .12 : .02, .005); n.connect(f); f.connect(g); send(g, .05); },
  crash(t) { const n = noiseSrc(t, t + 2.2), f = filt('highpass', 5200), g = vca(t, .16, .002, 1.6, 0, .6, .05); n.connect(f); f.connect(g); send(g, .3); },
  tom(t, f0, v) { const o = osc('sine', f0, t, t + .5); o.frequency.exponentialRampToValueAtTime(f0 * .55, t + .35); const g = vca(t, v, .003, .3, 0, .15, .02); o.connect(g); send(g, .35); },
  riser(t, dur) { const n = noiseSrc(t, t + dur), f = filt('bandpass', 300, 2); f.frequency.exponentialRampToValueAtTime(6000, t + dur); const g = AU.ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + .05); n.connect(f); f.connect(g); send(g, .4); },
  vinyl(t, dur) { for (let i = 0; i < 5; i++) { const tt = t + Math.random() * dur, n = noiseSrc(tt, tt + .02), f = filt('highpass', 2500), g = vca(tt, .05 + Math.random() * .05, .001, .006, 0, .004, .002); n.connect(f); f.connect(g); g.connect(AU.bus); } },
  bass(t, m, dur, type) {
    const f0 = mtof(m), stop = t + dur + .3;
    if (type === 'sub') { const o = osc('sine', f0, t, stop), o2 = osc('triangle', f0 * 2, t, stop), g = vca(t, .42, .01, dur, .8, .12, dur), g2 = AU.ctx.createGain(); g2.gain.value = .08; o.connect(g); o2.connect(g2); g2.connect(g); g.connect(AU.bus); return; }
    if (type === 'brass') { const o = osc('sawtooth', f0, t, stop), o2 = osc('sawtooth', f0, t, stop, 9), f = filt('lowpass', 420, 1), g = vca(t, .22, .25, dur, .9, .5, dur); o.connect(f); o2.connect(f); f.connect(g); send(g, .3); return; }
    const o = osc(type === 'square' ? 'square' : 'sawtooth', f0, t, stop), f = filt('lowpass', type === 'pulse' ? 900 : 1300, 4);
    f.frequency.setValueAtTime(type === 'pulse' ? 1600 : 2200, t); f.frequency.exponentialRampToValueAtTime(type === 'pulse' ? 260 : 380, t + Math.min(.25, dur));
    const g = vca(t, type === 'square' ? .16 : .22, .004, dur * .8, .6, .06, dur); o.connect(f); f.connect(g); g.connect(AU.bus);
  },
  pad(t, notes, dur, kind) {
    const slow = kind === 'str', f = filt('lowpass', kind === 'warm' ? 1300 : slow ? 1700 : 2300, .6), g = vca(t, slow ? .07 : .055, slow ? .9 : .28, dur, .9, slow ? 1.4 : .7, dur);
    for (const m of notes) for (const det of [-8, 8]) { const o = osc('sawtooth', mtof(m), t, t + dur + 2, det); o.connect(f); }
    f.connect(g); send(g, .45);
  },
  keys(t, notes, dur) { const g = vca(t, .07, .006, .9, .35, .5, dur), trem = AU.ctx.createGain(), lfo = osc('sine', 4.2, t, t + dur + 1), ld = AU.ctx.createGain(); ld.gain.value = .25; lfo.connect(ld); ld.connect(trem.gain); trem.gain.value = .75; for (const m of notes) { const o = osc('sine', mtof(m), t, t + dur + 1), o2 = osc('triangle', mtof(m) * 2, t, t + dur + 1), g2 = AU.ctx.createGain(); g2.gain.value = .12; o.connect(trem); o2.connect(g2); g2.connect(trem); } trem.connect(g); send(g, .3); },
  stab(t, notes) { const f = filt('lowpass', 2000, 2), g = vca(t, .06, .003, .12, 0, .08, .05); f.frequency.setValueAtTime(3200, t); f.frequency.exponentialRampToValueAtTime(700, t + .15); for (const m of notes) { const o = osc('square', mtof(m + 12), t, t + .3); o.connect(f); } f.connect(g); send(g, .2, .2); },
  arp(t, m, v) { const o = osc('sawtooth', mtof(m), t, t + .4), f = filt('lowpass', 3200, 3), g = vca(t, v, .002, .16, 0, .08, .04); f.frequency.setValueAtTime(3600, t); f.frequency.exponentialRampToValueAtTime(600, t + .2); o.connect(f); f.connect(g); send(g, .2, .35); },
  lead(t, m, dur, kind) {
    const f0 = mtof(m), stop = t + dur + 1.6, c = AU.ctx;
    if (kind === 'bell') { const o = osc('sine', f0, t, stop), o2 = osc('sine', f0 * 2.76, t, stop), g2 = c.createGain(); g2.gain.value = .25; const g = vca(t, .13, .003, 1.2, .0, .9, .05); o.connect(g); o2.connect(g2); g2.connect(g); send(g, .5, .2); return; }
    if (kind === 'pluck') { const o = osc('triangle', f0, t, t + .6), o2 = osc('sawtooth', f0, t, t + .6, 6), f = filt('lowpass', 2600, 2), g = vca(t, .1, .002, .2, 0, .1, .05); o.connect(f); o2.connect(f); f.connect(g); send(g, .25, .4); return; }
    const types = kind === 'anthem' ? ['square', 'sawtooth'] : kind === 'flute' ? ['triangle', 'sine'] : ['sawtooth', 'sawtooth'];
    const f = filt('lowpass', kind === 'flute' ? 2400 : 2800, .8), g = vca(t, kind === 'flute' ? .13 : .085, .03, dur, .85, .25, dur);
    const vib = osc('sine', 5.4, t, stop), vd = c.createGain(); vd.gain.setValueAtTime(0, t); vd.gain.linearRampToValueAtTime(f0 * .006, t + .25); vib.connect(vd);
    types.forEach((ty, i) => { const o = osc(ty, f0, t, stop, i ? 7 : 0); vd.connect(o.frequency); o.connect(f); });
    f.connect(g); send(g, .3, kind === 'flute' ? .25 : .3);
  },
};
// ---------- Séquenceur ----------
function trackLen(T) { return T.sec.reduce((x, s) => x + s[0], 0); }
function schedStep(T, st, t) {
  let b = Math.floor(st / 16), s = st % 16, si = 0, acc = 0;
  while (si < T.sec.length && b >= acc + T.sec[si][0]) { acc += T.sec[si][0]; si++; }
  if (si >= T.sec.length) return false;
  const [len, L, melK] = T.sec[si], bis = b - acc, gb = b, ch = T.prog[gb % T.prog.length], spb = 60 / T.bpm / 4, has_ = k => L.includes(k);
  if (s === 0 && bis === 0) { AU.musF.frequency.cancelScheduledValues(t); AU.musF.frequency.setTargetAtTime(has_('F') ? 1100 : 18000, t, .4); if (has_('C')) I.crash(t); }
  const D = T.dr, hit = (p, i) => p && p[i] === 'x';
  if (has_('K') && hit(D.K, s)) I.kick(t, T.n === 'Ballon d\'Or' ? .55 : .9);
  if (has_('S')) { if (hit(D.S, s)) (T.bpm >= 110 ? I.clap : I.snare)(t, .9); if (hit(D.g, s)) I.snare(t, .25); if (hit(D.r, s)) I.rim(t, .9); }
  if (has_('H')) { if (hit(D.H, s)) I.hat(t, .7, true); if (hit(D.h, s)) I.hat(t, s % 4 === 2 ? .55 : .3); }
  if (has_('T')) { if (hit(D.t, s)) I.tom(t, 70, .5); if (T.n === 'Coup d\'envoi' && s >= 12) I.tom(t, [110, 98, 87, 77][s - 12], .2 + bis * .06); }
  if (has_('R') && bis === len - 1 && s === 0) I.riser(t, spb * 16);
  if (has_('V') && s === 0) I.vinyl(t, spb * 16);
  if (has_('B')) for (const [ps, iv, ln] of T.bass.p) if (ps === s) I.bass(t, ch[0] + iv, ln * spb, T.bass.t);
  if (has_('P') && s === 0) I.pad(t, ch[1], spb * 16, T.pad);
  if (has_('Q') && s === 0) I.pad(t, ch[1], spb * 16, 'str');
  if (has_('E') && T.keys) for (const [ps, ln] of T.keys) if (ps === s) I.keys(t, ch[1], ln * spb);
  if (has_('X') && T.stab && T.stab.includes(s)) I.stab(t, ch[1]);
  if (has_('A') && T.arp && s % T.arpRate === 0) { const a = T.arp[(s / T.arpRate) % T.arp.length], n = ch[1][a[0] % ch[1].length] + a[1] - 12; I.arp(t, n, .05); }
  if (has_('L') && melK) { const bars = T.mel[melK], bar = bars[bis % bars.length] || []; for (const [ps, m, ln] of bar) if (ps === s) I.lead(t, m, ln * spb, T.lead); }
  return true;
}
function auTick() {
  if (!AU.ctx || !AU.playing) return;
  const T = TRACKS[AU.cur], spb = 60 / T.bpm / 4;
  while (AU.nextT < AU.ctx.currentTime + .14) {
    if (!schedStep(T, AU.step, AU.nextT)) { auNextTrack(true); return; }
    AU.step++;
    AU.nextT += spb * (AU.step % 2 ? 1 + (T.sw ? (T.sw - .5) * 2 : 0) : 1 - (T.sw ? (T.sw - .5) * 2 : 0));
  }
}
function auStartTrack(i) {
  if (!AU.ctx) return;
  AU.cur = (i + TRACKS.length) % TRACKS.length; AU.step = 0; AU.nextT = AU.ctx.currentTime + .1; AU.playing = true;
  AU.dly.delayTime.setValueAtTime(60 / TRACKS[AU.cur].bpm * .75, AU.ctx.currentTime);
  AU.bus.gain.setTargetAtTime(TRACKS[AU.cur].vol || 1, AU.ctx.currentTime, .05);
  clearInterval(AU.tm); AU.tm = setInterval(auTick, 25);
  AU.mus.gain.cancelScheduledValues(AU.ctx.currentTime); AU.mus.gain.setTargetAtTime(OPTS.mvol ?? .55, AU.ctx.currentTime, .3);
  if (typeof onTrackChange === 'function') onTrackChange();
}
function auStopMusic(fade) { if (!AU.ctx) return; AU.playing = false; clearInterval(AU.tm); AU.mus.gain.cancelScheduledValues(AU.ctx.currentTime); AU.mus.gain.setTargetAtTime(0, AU.ctx.currentTime, fade ? .5 : .05); }
function auNextTrack(auto) {
  if (AU.scene === 'menu' && auto) return auStartTrack(0);
  if (OPTS.shuffle) { let n; do { n = Math.floor(Math.random() * TRACKS.length); } while (n === AU.cur && TRACKS.length > 1); auStartTrack(n); } else auStartTrack(AU.cur + 1);
}
function auScene(scene, force) {
  AU.want = scene;
  if (!AU.ctx || !AU.unlocked) return;
  if (scene === AU.scene && !force) return;
  const prev = AU.scene; AU.scene = scene;
  if (scene === 'live') { auStopMusic(true); crowdStart(); return; }
  if (prev === 'live') crowdStop();
  if (!OPTS.music) { auStopMusic(true); return; }
  if (scene === 'menu') { if (!AU.playing || AU.cur !== 0) auStartTrack(0); }
  else if (!AU.playing || prev === 'menu' || prev === 'live' || force) auStartTrack(prev === 'menu' || !prev ? 1 + Math.floor(Math.random() * (TRACKS.length - 1)) : AU.cur);
}
function auSetVol() { if (!AU.ctx) return; if (AU.playing) AU.mus.gain.setTargetAtTime(OPTS.mvol ?? .55, AU.ctx.currentTime, .1); AU.fx.gain.setTargetAtTime(OPTS.svol ?? .8, AU.ctx.currentTime, .1); }

// ---------- Ambiance de stade : affluence, chants propres au stade, derby, pluie ----------
const CHANTS = [
  [[55, .3], [55, .3], [52, .6], [55, .3], [57, .3], [55, .9], [52, .3], [55, .3], [57, .6], [55, 1.1]],
  [[60, .4], [60, .4], [62, .4], [64, .8], [62, .4], [60, .4], [57, 1.2]],
  [[57, .25], [57, .25], [57, .25], [60, .5], [57, .25], [55, .25], [52, .9], [52, .25], [55, .25], [57, 1]],
  [[64, .5], [62, .25], [60, .25], [62, .5], [64, .5], [64, .5], [64, 1]],
];
// ---------- Vraie foule : enregistrements de stade CC0 (Freesound, via joepio/godot-crowd-sound) ----------
const SMP = { buf: {}, p: null };
// adresse d'un son livré avec le jeu (l'empreinte change quand le fichier change → le téléphone le retélécharge)
const mediaUrl = (d, k) => 'assets/' + d + '/' + k + '.mp3' + (typeof MEDIA_H !== 'undefined' && MEDIA_H[d + '/' + k] ? '?h=' + MEDIA_H[d + '/' + k] : '');
// sons de foule : intégrés au fichier (version « un seul fichier ») ou fichiers à côté du jeu (assets/foule/)
const crwdHave = () => typeof CRWD_B64 !== 'undefined' || (typeof CRWD_FILES !== 'undefined' && CRWD_FILES.length > 0);
function smpBytes(k) {
  if (typeof CRWD_B64 !== 'undefined') { const bin = atob(CRWD_B64[k]), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return Promise.resolve(u.buffer); }
  return fetch(mediaUrl('foule', k)).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null);
}
function smpLoad() {
  if (SMP.p || !AU.ctx || !crwdHave()) return SMP.p;
  const c = AU.ctx, keys = typeof CRWD_B64 !== 'undefined' ? Object.keys(CRWD_B64) : CRWD_FILES;
  // décodage étalé (un fichier à la fois) pour ne pas figer l'iPhone au coup d'envoi
  SMP.p = keys.reduce((pr, k) => pr.then(() => smpBytes(k).then(ab => new Promise(res => { if (!ab) return res(); try { const r = c.decodeAudioData(ab, b => { SMP.buf[k] = b; res(); }, () => res()); if (r && r.catch) r.catch(() => res()); } catch (e) { res(); } }))), Promise.resolve());
  return SMP.p;
}
const smpHas = k => !!Object.keys(SMP.buf).find(x => x.startsWith(k));
// joue un enregistrement (au hasard parmi « goal_1…4 », etc.) avec un léger élargissement stéréo
function smpPlay(k, v, o) {
  if (!AU.ctx) return null; o = o || {}; const L = Object.keys(SMP.buf).filter(x => x === k || x.startsWith(k + '_')); if (!L.length) return null;
  const c = AU.ctx, t = c.currentTime + (o.at || 0) + .02, b = SMP.buf[pick(L)], src = c.createBufferSource(); src.buffer = b; src.playbackRate.value = o.rate || (.97 + Math.random() * .06);
  const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + (o.fade || .04));
  let head = src; if (o.lp) { const f = filt('lowpass', o.lp, .7); src.connect(f); head = f; }
  const m = c.createChannelMerger(2), d = c.createDelay(.05); d.delayTime.value = .013; head.connect(m, 0, 0); head.connect(d); d.connect(m, 0, 1); m.connect(g);
  g.connect(o.out || AU.fx); if (o.rev !== 0) { const r = c.createGain(); r.gain.value = o.rev ?? .12; g.connect(r); r.connect(AU.frev); }
  if (o.loop) { src.loop = true; src.loopStart = .04; src.loopEnd = b.duration - .04; src.start(t, o.off || 0); } else { src.start(t); if (o.len) { g.gain.setTargetAtTime(0, t + o.len, .5); src.stop(t + o.len + 2.5); } }
  return { src, g };
}
// tribune côté « maison » : le public pousse pour l'équipe qui reçoit
function crowdHome() { const M = typeof S !== 'undefined' && S && S.live && S.live.M; const h = M && M.E ? M.E.home : 0; return h === -1 ? 'n' : h === 0 ? 'me' : 'op'; }
function crowdCond() { const M = typeof S !== 'undefined' && S && S.live && S.live.M; return (M && M.cond) || { att: 20000, seed: 0 }; }
function crowdStart() {
  if (!AU.ctx || AU.crowd) return; const c = AU.ctx, t = c.currentTime, C = crowdCond();
  const lev = clamp(Math.log10((C.att || 20000) + 10) / 4.9, .3, 1), small = (C.att || 0) < 1500;
  const out = c.createGain(); out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(1, t + 1.5); out.connect(AU.fx);
  const bed = c.createGain(); bed.gain.value = .34 * lev; bed.connect(out); const rs = c.createGain(); rs.gain.value = small ? .15 : .5; bed.connect(rs); rs.connect(AU.frev);
  const n1 = noiseSrc(t, t + 3600, true), f1 = filt('bandpass', 420, .6); n1.connect(f1); f1.connect(bed);
  const n2 = noiseSrc(t, t + 3600, false), f2 = filt('bandpass', 1700, 1.4), g2 = c.createGain(); g2.gain.value = .07; n2.connect(f2); f2.connect(g2); g2.connect(bed);
  const lfo = osc('sine', .13, t, t + 3600), ld = c.createGain(); ld.gain.value = .08 * lev; lfo.connect(ld); ld.connect(bed.gain);
  const srcs = [n1, n2, lfo];
  // vraie rumeur de stade (sauf petits matchs, où la foule synthétique sonne plus juste)
  const real = !small && crwdHave();
  if (real) { smpLoad(); const L2 = clamp((Math.log10(C.att || 20000) - 3.2) / 1.6, .25, 1); f1.disconnect(); const fg = c.createGain(); fg.gain.value = .45; f1.connect(fg); fg.connect(bed); g2.gain.value = .03;
    const startBed = () => { if (!AU.crowd || AU.crowd.out !== out) return; const a = smpPlay('cheer_loop', 1.7 * L2, { loop: true, out: bed, fade: 2, rev: 0 }), b2 = smpPlay('cheer_loop', 1 * L2, { loop: true, out: bed, fade: 3, off: 5.7, rate: .94, rev: 0 }); [a, b2].forEach(x => x && srcs.push(x.src)); };
    if (SMP.p) SMP.p.then(startBed); }
  if (C.rain) { const r = noiseSrc(t, t + 3600, false), rf_ = filt('highpass', 2600, .5), rg = c.createGain(); rg.gain.value = .045; r.connect(rf_); rf_.connect(rg); rg.connect(out); srcs.push(r); }
  AU.crowd = { out, bed, srcs, lev, base: .34 * lev, small, real, derby: !!C.derby, chant: CHANTS[(C.seed || 0) % CHANTS.length], tempo: .36 + ((C.seed || 0) % 5) * .03 };
  clearTimeout(AU.crowdT);
  const gap = small ? 26000 : C.derby ? 7000 : C.big ? 10000 : 14000;
  const chantLoop = () => { if (!AU.crowd) return; crowdChant(); AU.crowdT = setTimeout(chantLoop, gap + Math.random() * gap); }; AU.crowdT = setTimeout(chantLoop, 2500);
}
function crowdStop() { if (!AU.crowd) return; const C = AU.crowd, t = AU.ctx.currentTime; C.out.gain.setTargetAtTime(0, t, .4); setTimeout(() => { try { C.srcs.forEach(s => s.stop()); C.out.disconnect(); } catch (e) { } }, 1800); AU.crowd = null; clearTimeout(AU.crowdT); }
function swell(level, up, hold, down) { if (!AU.crowd) return; const g = AU.crowd.bed.gain, t = AU.ctx.currentTime, L = AU.crowd.lev || 1; g.cancelScheduledValues(t); g.setTargetAtTime(level * L, t, up); g.setTargetAtTime(AU.crowd.base || .34, t + up * 3 + hold, down); }
function claps(t, n, gap, v) { const c = AU.ctx; for (let i = 0; i < n; i++) for (let k = 0; k < 9; k++) { const tt = t + i * gap + Math.random() * .045, s = noiseSrc(tt, tt + .05), f = filt('bandpass', 1400 + Math.random() * 900, 1.3), g = vca(tt, v * (.4 + Math.random() * .6), .001, .02, 0, .015, .003); s.connect(f); f.connect(g); g.connect(AU.fx); const r = c.createGain(); r.gain.value = .4; g.connect(r); r.connect(AU.frev); } }
function voices(t, notes, v) { // foule qui chante : voix désaccordées et formants de voyelle
  const c = AU.ctx, f1 = filt('bandpass', 720, 1.6), f2 = filt('bandpass', 1150, 2.2), g = c.createGain(); g.gain.value = v; f1.connect(g); f2.connect(g); g.connect(AU.fx); const r = c.createGain(); r.gain.value = .9; g.connect(r); r.connect(AU.frev);
  let tt = t;
  for (const [m, d] of notes) { for (let k = 0; k < 6; k++) { const st = tt + Math.random() * .06, o = osc('sawtooth', mtof(m + (k % 2 ? 12 : 0)), st, st + d + .3, (Math.random() - .5) * 40), e = vca(st, .05, .06, d, .85, .12, d * .9); o.connect(e); e.connect(f1); e.connect(f2); } tt += d; }
  return tt;
}
function crowdChant() {
  if (!AU.crowd) return; const C = AU.crowd, t = AU.ctx.currentTime + .1, beat = C.tempo || .42, v = C.lev || 1;
  if (C.small) { claps(t, 4 + Math.floor(Math.random() * 4), .3, .25); return; }
  if (C.real && smpHas('chant')) { smpPlay('chant', .75 * v * (C.derby ? 1.2 : 1), { fade: 1.2, len: 9 + Math.random() * 5 }); return; }
  const r = Math.random();
  if (r < .4) { claps(t, 3, beat, .5 * v); claps(t + beat * 4, 3, beat, .5 * v); claps(t + beat * 8, 3, beat, .55 * v); for (let i = 0; i < 12; i++) if (i % 4 !== 3) tomFx(t + i * beat, 68, .35 * v); }
  else { const end = voices(t, C.chant || CHANTS[0], .5 * v * (C.derby ? 1.2 : 1)); claps(end + .1, 4, beat * .5, .45 * v); if (C.derby) for (let i = 0; i < 8; i++) tomFx(end + .1 + i * beat * .5, 64, .3); }
}
function tomFx(t, f0, v) { const o = osc('sine', f0, t, t + .5); o.frequency.exponentialRampToValueAtTime(f0 * .6, t + .3); const g = vca(t, v, .003, .25, 0, .12, .02); o.connect(g); g.connect(AU.fx); }
function whistle(t, d) { const c = AU.ctx, g = vca(t, .11, .01, d, 1, .03, d), amg = c.createGain(), am = osc('sine', 27, t, t + d + .2), ad = c.createGain(); amg.gain.value = .65; ad.gain.value = .35; am.connect(ad); ad.connect(amg.gain); [2850, 3240].forEach(f => { const o = osc('sine', f, t, t + d + .2); o.connect(amg); }); amg.connect(g); g.connect(AU.fx); }
function horn(t) { const c = AU.ctx; for (let k = 0; k < 3; k++) { const tt = t + k * .55, f = filt('lowpass', 1500, 1), g = vca(tt, .07, .02, .4, .9, .08, .4); [233, 311, 466].forEach(fr => { const o = osc('sawtooth', fr, tt, tt + .6, (Math.random() - .5) * 20); o.connect(f); }); f.connect(g); g.connect(AU.fx); } }
function boo(t) { const n = noiseSrc(t, t + 3, true), f = filt('lowpass', 380, .8), g = vca(t, .9, .5, 1.5, .5, .8, 1.6); n.connect(f); f.connect(g); g.connect(AU.fx); for (let i = 0; i < 7; i++) { const tt = t + Math.random() * 1.5, d = .25 + Math.random() * .5, o = osc('sine', 2300 + Math.random() * 1400, tt, tt + d + .1), gg = vca(tt, .025, .02, d, 1, .05, d); o.frequency.linearRampToValueAtTime(2000 + Math.random() * 1500, tt + d); o.connect(gg); gg.connect(AU.fx); } }
function sfxPlay(k) {
  if (!AU.ctx || !AU.unlocked || (OPTS.svol ?? .8) <= 0) return; const t = AU.ctx.currentTime + .02, C = AU.crowd;
  // bruitages réalistes générés (pack ElevenLabs), sinon synthèse
  if (typeof sfxG === 'function') { if (k === 'whistle1' && sfxG('whistle1', .9)) return; if (k === 'whistle2' && sfxG('whistle1', .8)) { sfxG('whistle1', .8, .45); return; } if (k === 'whistle3' && sfxG('whistle3', .95)) { swell(.75, .3, 1, 1.5); return; } }
  if (k === 'whistle1') whistle(t, .75);
  else if (k === 'whistle2') { whistle(t, .3); whistle(t + .45, .3); }
  else if (k === 'whistle3') { whistle(t, .28); whistle(t + .42, .28); whistle(t + .84, 1.1); swell(.75, .3, 1, 1.5); }
  else if (C && C.real && smpHas('goal') && ['goal', 'oppgoal', 'chance', 'ooh', 'cheer'].includes(k)) {
    // vrais enregistrements : la tribune principale soutient l'équipe qui reçoit
    const home = crowdHome(), lv = C.lev || 1;
    if (k === 'goal') { swell(1.3, .08, 2.6, 2.2); if (home === 'op') smpPlay('goal', .55 * lv, { lp: 2400 }); else { smpPlay('goal', 1.5 * lv); if (smpHas('chant')) setTimeout(() => smpPlay('chant', .8 * lv, { fade: 1.5, len: 10 }), 6500); } }
    else if (k === 'oppgoal') { if (home === 'op') { swell(1.3, .08, 2.6, 2.2); smpPlay('goal', 1.4 * lv); } else { swell(.15, .4, 2, 2.5); smpPlay('ooh', .55 * lv, { rate: .8, lp: 1800 }); } }
    else if (k === 'chance') { swell(.85, .5, 1.5, 1.2); smpPlay('surge', .9 * lv, { len: 6 }); }
    else if (k === 'ooh') { swell(1.05, .12, .3, .9); smpPlay('ooh', .85 * lv); }
    else if (k === 'cheer') { swell(1.0, .15, .6, 1.2); smpPlay('roar', .9 * lv); }
  }
  else if (k === 'goal') { swell(1.6, .08, 2.6, 2.2); horn(t + .4); claps(t + .3, 10, .2, .5); setTimeout(crowdChant, 3800); }
  else if (k === 'oppgoal') { swell(.12, .4, 2, 2.5); boo(t + .2); }
  else if (k === 'chance') swell(.85, .5, 1.5, 1.2);
  else if (k === 'ooh') { swell(1.05, .12, .3, .9); }
  else if (k === 'cheer') { swell(1.0, .15, .6, 1.2); claps(t, 8, .18, .4); }
  else if (k === 'card') { whistle(t, .5); boo(t + .5); }
}
function sfxDrain(M) { if (!M || !M.sfx || !M.sfx.length) return; const q = M.sfx.splice(0); if (!AU.ctx || !AU.unlocked) return; q.slice(-3).forEach((k, i) => setTimeout(() => sfxPlay(k), i * 120)); }

// ---------- Voix des commentateurs (synthèse vocale du navigateur) ----------
// Une file d'attente : Lo Sol (voix masculine) et Nathalie (voix féminine si l'appareil en a une, sinon même voix plus aiguë).
// Les grands moments passent devant, les digressions s'effacent quand le jeu s'emballe, les chansons varient la hauteur.
const SAY = { voice: null, voice2: null, ok: null, q: [], cur: null, tok: 0, wd: 0 };
// prénoms des voix (comparés mot à mot, sans accents) : masculines, féminines, voix gadget d'iOS
const sayWords = v => String(v && v.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().split(/[^a-z]+/).filter(Boolean);
const SAY_MW = new Set(['thomas', 'nicolas', 'daniel', 'jacques', 'henri', 'paul', 'mathieu', 'antoine', 'guillaume', 'louis', 'remy', 'remi', 'claude', 'eddy', 'reed', 'rocko', 'grandpa']);
const SAY_FW = new Set(['amelie', 'audrey', 'aurelie', 'marie', 'virginie', 'julie', 'celine', 'hortense', 'lea', 'chantal', 'denise', 'vivienne', 'eloise', 'charlotte', 'sylvie', 'nathalie', 'flo', 'sandy', 'shelley', 'grandma', 'google']);
const SAY_NW = new Set(['eddy', 'reed', 'rocko', 'grandpa', 'grandma', 'flo', 'sandy', 'shelley']);
const SAY_M = { test: v => sayWords(typeof v === 'string' ? { name: v } : v).some(w => SAY_MW.has(w)) };
const SAY_F = { test: v => sayWords(typeof v === 'string' ? { name: v } : v).some(w => SAY_FW.has(w)) };
const SAY_NOVEL = { test: v => sayWords(typeof v === 'string' ? { name: v } : v).some(w => SAY_NW.has(w)) };
const SAY_LOW = new Set(['AU', 'AVANT', 'BARRE', 'BUT', 'DERBY', 'EST', 'ET', 'FOND', 'LA', 'PENALTY', 'POTEAU', 'ROUGE', 'TRIPLÉ', 'VIT', 'OUIIII']);
// qualité d'une voix : 3 premium, 2 améliorée/naturelle, 1 standard, 0 de base (compacte), -1 voix gadget
function sayQual(v) { const id = (v.voiceURI || '') + ' ' + v.name; return SAY_NOVEL.test(v.name) ? -1 : /premium/i.test(id) ? 3 : /enhanced|am[ée]lior|neural|natural|online|wavenet/i.test(id) ? 2 : /compact/i.test(id) ? 0 : 1; }
const sayBase = v => String(v && v.name || '').split(' (')[0].trim();
function sayVoices() { try { return (speechSynthesis.getVoices() || []).filter(v => /^fr/i.test(v.lang)); } catch (e) { return []; } }
// choix des voix : celle réglée dans Options, sinon la meilleure qualité (masculine pour Lo Sol, féminine pour Nathalie)
function sayPick() {
  const all = sayVoices(), byId = id => id && all.find(v => v.voiceURI === id);
  const sc = (v, fem) => sayQual(v) * 10 + (/^fr[-_]FR/i.test(v.lang) ? 3 : 0) + (fem ? (SAY_F.test(v.name) ? 6 : SAY_M.test(v.name) ? -6 : 0) : (SAY_M.test(v.name) ? 6 : SAY_F.test(v.name) ? -6 : 0));
  const best = (L, fem) => L.slice().sort((a, b) => sc(b, fem) - sc(a, fem))[0] || null;
  SAY.voice = byId(OPTS.v1) || best(all, false);
  SAY.voice2 = byId(OPTS.v2) || best(all.filter(v => sayBase(v) !== sayBase(SAY.voice)), true);
}
function sayInit() {
  if (SAY.ok !== null) return SAY.ok;
  SAY.ok = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  if (SAY.ok) { try { sayPick(); } catch (e) { } try { speechSynthesis.onvoiceschanged = () => { try { sayPick(); } catch (e) { } if (typeof UI !== 'undefined' && UI.page === 'options' && typeof render === 'function' && document.querySelector('#vS') && document.querySelector('#vS').options.length < 2) render(); }; } catch (e) { } }
  return SAY.ok;
}
// essai d'une voix depuis les Options
function sayTest(who) { if (!aivOn()) { if (typeof toast === 'function') toast('Règle ta voix ElevenLabs (clé) pour l\'écouter.'); return; } sayStop(); if (typeof VOX_TEST !== 'undefined' && VOX_TEST[who]) sayPush({ txt: VOX_TEST[who], pri: 2, who }); else if (who === 'N') sayPush({ txt: 'Bonsoir, ici Nathalie Ferrand. Je vais essayer de le canaliser pendant quatre-vingt-dix minutes.', pri: 2, who: 'N' }); else sayPush({ txt: 'Bonsoir à tous, ici Lo Sol ! Quel plaisir d\'être avec vous ce soir, mes amis !', pri: 2, who: 'S' }); }
function sayPrime() { if (!sayInit()) return; try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) { } }
// texte → prononçable (les mots en capitales seraient épelés)
function sayNorm(t) {
  return String(t).replace(/\bB(U{2,})T\b/g, 'Buuuut').replace(/C'EST/g, 'C\'est').replace(/[A-ZÀ-ÝŒ]{2,}/g, w => SAY_LOW.has(w) ? w.toLowerCase() : w)
    .replace(/…/g, '... ').replace(/[«»]/g, '').replace(/!{2,}/g, '!').replace(/\s+/g, ' ').trim().replace(/(^|[.!?]\s+)([a-zà-ÿ])/g, (m, a, b) => a + b.toUpperCase());
}
// ---------- Voix IA : vraies voix humaines (OpenAI ou ElevenLabs), avec la clé API du joueur ----------
// La clé reste sur l'appareil (stockage local à part, jamais dans les sauvegardes exportées) et n'est envoyée qu'au fournisseur choisi.
const AIV = { key: null, cache: new Map(), dead: '', el: null, src: null, duck: 0, bad: new Set() };
const AIV_OAI = ['cedar', 'marin', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer', 'verse', 'alloy'];
const AIV_ELM = [['eleven_flash_v2_5', 'Flash 2.5 (rapide, économique)'], ['eleven_multilingual_v2', 'Multilingual v2 (qualité)'], ['eleven_v3', 'v3 (très expressif, plus lent)'], ['eleven_v4_turbo', 'v4 Turbo (expressif et rapide)']];
const AIV_TAGS = new Set(['eleven_v3', 'eleven_v3_conversational', 'eleven_v4_turbo']);
function aivKey() { if (AIV.key == null) { try { AIV.key = localStorage.getItem('cdo_aikey') || ''; } catch (e) { AIV.key = ''; } } return AIV.key; }
function aivSetKey(k) { AIV.key = String(k || '').trim(); AIV.dead = ''; AIV.cache.clear(); try { if (AIV.key) localStorage.setItem('cdo_aikey', AIV.key); else localStorage.removeItem('cdo_aikey'); } catch (e) { } }
const aivOn = () => OPTS.aiv === 'eleven' && !!aivKey() && !AIV.dead && !!AU.ctx; // seulement tes voix ElevenLabs (plus de voix de synthèse génériques)
const voixAny = () => typeof VOIX_INDEX !== 'undefined' && OPTS.voixRec !== false && Object.keys(VOIX_INDEX).length > 0;
// voix ElevenLabs créée par le joueur pour Lo Sol : utilisée par défaut (un autre choix dans Options reste prioritaire)
const AIV_EL_DEF = { S: 'EQHLm8eFXUqKbFzlvnSA', N: '' };
function aivVoice(who) {
  who = who || 'S';
  if (OPTS.aiv === 'openai') return who === 'N' ? (OPTS.aivN || 'marin') : who === 'S' ? (OPTS.aivS || 'cedar') : ((typeof VOX_OAI !== 'undefined' && VOX_OAI[who]) || 'alloy');
  const id = who === 'N' ? OPTS.aivN : who === 'S' ? OPTS.aivS : (OPTS.aivX || {})[who]; if (id && !AIV_OAI.includes(id) && !AIV.bad.has(id)) return id;
  const def = AIV_EL_DEF[who] || (typeof VOX_EL !== 'undefined' && VOX_EL[who]); if (def && !AIV.bad.has(def)) return def;
  // sinon : une voix de ton compte, homme ou femme selon le personnage, jamais celle d'un commentateur
  const avoid = who === 'S' ? [] : who === 'N' ? [aivVoice('S')] : [aivVoice('S'), aivVoice('N')], L0 = (OPTS.aivEL || []).filter(v => !avoid.includes(v.id) && !AIV.bad.has(v.id)), mine = L0.filter(v => v.c && v.c !== 'premade'), L = mine.length ? mine : L0;
  const g = (typeof VOX_G !== 'undefined' && VOX_G[who]) || 'male';
  const f = L.find(v => (v.g || '') === g) || L[who === 'N' ? 1 : 0] || L[0]; return f ? f.id : (who !== 'S' && who !== 'N' ? aivVoice(g === 'female' ? 'N' : 'S') : '');
}
// consignes de jeu d'acteur (OpenAI) ou balises d'émotion (ElevenLabs v3/v4)
function aivInstr(x) {
  const OT = { P: 'Tu es le speaker officiel d\'un stade de football français : voix grave, posée, solennelle, tu détaches les noms comme dans la sono d\'un stade.', C: 'Tu es l\'entraîneur, dans le vestiaire à la mi-temps : voix ferme, motivante, directe, tu parles à ton joueur les yeux dans les yeux.', A: 'Tu es l\'agent du joueur : complice, commercial, sûr de toi, débit vif et souriant.', J: 'Tu es une journaliste sportive en conférence de presse : ton professionnel, question claire et posée.' };
  if (OT[x.who]) return OT[x.who] + ' Français de France, débit naturel.';
  const base = x.who === 'N' ? 'Tu es Nathalie Ferrand, consultante football à la télévision française, ancienne milieu de terrain internationale. Voix posée, claire, analytique, pince-sans-rire, un peu amusée par son collègue. Français de France, débit naturel.'
    : 'Tu es Jordi « Lo Sol » Puig, commentateur de football à la télévision française, ancien ailier de Perpignan : léger accent chantant du Sud, voix chaleureuse, passionnée, débit vif, beaucoup d\'émotion et d\'humour. Français de France.';
  return base + (x.song ? ' Tu CHANTES cette petite chanson de supporter, joyeusement et un peu faux, en rythme, comme dans une tribune.' : x.pri >= 3 ? ' Moment énorme du match : vis-le à fond, explosion de joie ou grosse déception selon la phrase, tu peux crier et étirer les voyelles.' : x.dig ? ' Moment calme : tu racontes une anecdote, ton détendu, complice, souriant.' : x.pri >= 2 ? ' Action chaude : ton vif, tendu, rythmé.' : ' Commentaire en direct, naturel et vivant.');
}
function aivText(x) {
  let t = String(x.txt).replace(/\s*\/\s*/g, x.song ? '\n' : ' ').replace(/[«»]/g, '"');
  if (OPTS.aiv === 'eleven' && AIV_TAGS.has(OPTS.aivM || '')) t = (x.song ? '[sings] ' : x.pri >= 3 ? '[excited] ' : x.dig ? '' : '') + t;
  return t;
}
function aivUse(n) { const m = new Date().toISOString().slice(0, 7); if (!OPTS.aivUse || OPTS.aivUse.m !== m) OPTS.aivUse = { m, c: 0 }; OPTS.aivUse.c += n; if (typeof saveOpts === 'function') saveOpts(); }
// petit cache durable (IndexedDB) : les répliques déjà entendues ne sont pas facturées deux fois
const AIDB = { p: null };
function aidb() { if (AIDB.p) return AIDB.p; AIDB.p = new Promise(res => { try { const r = indexedDB.open('cdo-voix', 1); r.onupgradeneeded = () => { try { r.result.createObjectStore('a'); } catch (e) { } }; r.onsuccess = () => { const db = r.result; try { const q = db.transaction('a').objectStore('a').count(); q.onsuccess = () => { if (q.result > 1500) try { db.transaction('a', 'readwrite').objectStore('a').clear(); } catch (e) { } }; } catch (e) { } res(db); }; r.onerror = () => res(null); } catch (e) { res(null); } }); return AIDB.p; }
function aidbGet(k) { return aidb().then(db => db && new Promise(res => { try { const q = db.transaction('a').objectStore('a').get(k); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); } catch (e) { res(null); } })); }
function aidbPut(k, v) { aidb().then(db => { if (db) try { db.transaction('a', 'readwrite').objectStore('a').put(v, k); } catch (e) { } }); }
// ---------- voix enregistrées (fichiers assets/voix/, fabriqués une fois sur ElevenLabs) ----------
// une réplique fixe déjà enregistrée part instantanément, sans clé ni réseau (gardée par le service worker)
const VOIX = { cache: new Map() };
function voixFile(x) {
  if (!x || x.noRec || typeof VOIX_INDEX === 'undefined' || OPTS.voixRec === false || x.song) return null;
  return VOIX_INDEX[(x.who || 'S') + '|' + String(x.txt).trim()] || null;
}
function voixFetch(x) {
  const f = voixFile(x); if (!f || !AU.ctx) return null;
  if (VOIX.cache.has(f)) return VOIX.cache.get(f);
  const p = fetch('assets/voix/' + f).then(r => { if (!r.ok) throw Object.assign(new Error('HTTP ' + r.status), { st: r.status, rec: true }); return r.arrayBuffer(); })
    .then(ab => new Promise((ok, ko) => { try { const r = AU.ctx.decodeAudioData(ab, ok, ko); if (r && r.catch) r.catch(ko); } catch (e) { ko(e); } }));
  VOIX.cache.set(f, p); if (VOIX.cache.size > 120) VOIX.cache.delete(VOIX.cache.keys().next().value);
  p.catch(() => VOIX.cache.delete(f));
  return p;
}
// un appel au fournisseur (réplique → MP3) ; une voix de la bibliothèque refusée par ton compte est remplacée
async function aivNet(x, voice, depth) {
  const prov = OPTS.aiv, txt = aivText(x), model = prov === 'openai' ? 'gpt-4o-mini-tts' : (OPTS.aivM || 'eleven_flash_v2_5');
  if (!voice) throw Object.assign(new Error('Aucune voix ElevenLabs choisie'), { st: 0 });
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, to = ctl && setTimeout(() => ctl.abort(), 15000);
  const vs = x.who === 'N' || x.who === 'J' ? { stability: .55, similarity_boost: .75, style: .15, use_speaker_boost: true } : x.who === 'P' ? { stability: .7, similarity_boost: .8, style: .1, use_speaker_boost: true } : x.who === 'C' || x.who === 'A' ? { stability: .5, similarity_boost: .75, style: .3, use_speaker_boost: true } : { stability: x.pri >= 3 || x.song ? .3 : .4, similarity_boost: .75, style: x.pri >= 3 || x.song ? .6 : .4, use_speaker_boost: true };
  let res;
  try {
    if (prov === 'openai') res = await fetch('https://api.openai.com/v1/audio/speech', { method: 'POST', signal: ctl && ctl.signal, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + aivKey() }, body: JSON.stringify({ model, voice, input: txt, instructions: aivInstr(x), response_format: 'mp3' }) });
    else res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_64`, { method: 'POST', signal: ctl && ctl.signal, headers: { 'Content-Type': 'application/json', 'xi-api-key': aivKey(), Accept: 'audio/mpeg' }, body: JSON.stringify({ text: txt, model_id: model, voice_settings: vs }) });
  } finally { if (to) clearTimeout(to); }
  if (!res.ok) {
    let m = ''; try { m = (await res.text()).slice(0, 300); } catch (e) { }
    // voix par défaut inaccessible (voix de bibliothèque pas ajoutée à ton compte) : on passe à une voix du compte
    if (prov === 'eleven' && !depth && [400, 403, 404, 422].includes(res.status) && /voice/i.test(m) && x.who !== 'S' && !(x.who === 'N' && OPTS.aivN)) { AIV.bad.add(voice); const v2 = aivVoice(x.who); if (v2 && v2 !== voice) return aivNet(x, v2, 1); }
    throw Object.assign(new Error(m || ('HTTP ' + res.status)), { st: res.status });
  }
  return await res.arrayBuffer();
}
function aivFetch(x) {
  { const rp = !x.noRec && voixFetch(x); if (rp) return rp.catch(() => aivFetch(Object.assign({}, x, { noRec: true }))); }
  const prov = OPTS.aiv, voice = aivVoice(x.who), txt = aivText(x), model = prov === 'openai' ? 'gpt-4o-mini-tts' : (OPTS.aivM || 'eleven_flash_v2_5'), style = x.song ? 's' : x.pri >= 3 ? 'h' : x.dig ? 'd' : x.pri >= 2 ? 'w' : 'n';
  const ck = [prov, model, voice, style, txt].join('|');
  if (AIV.cache.has(ck)) return AIV.cache.get(ck);
  const p = (async () => {
    if (!voice) throw Object.assign(new Error('Aucune voix ElevenLabs choisie'), { st: 0 });
    const t0 = Date.now(), pk = typeof pkKey === 'function' ? pkKey(prov, voice, x.txt) : '';
    // pack de voix déjà téléchargé : instantané, hors connexion, gratuit
    let ab = pk && PK.have.has(pk) ? await pkGet(pk) : null;
    if (!ab) ab = await aidbGet(ck);
    if (!ab) { ab = await aivNet(x, voice); aivUse(txt.length); aidbPut(ck, ab.slice(0)); const lat = (Date.now() - t0) / 1000; AIV.lat = AIV.lat ? AIV.lat * .7 + lat * .3 : lat; }
    return await new Promise((ok, ko) => { try { const r = AU.ctx.decodeAudioData(ab.slice(0), ok, ko); if (r && r.catch) r.catch(ko); } catch (e) { ko(e); } });
  })();
  AIV.cache.set(ck, p); if (AIV.cache.size > 160) AIV.cache.delete(AIV.cache.keys().next().value);
  p.catch(() => AIV.cache.delete(ck));
  return p;
}
// panne de la voix IA : les commentaires restent écrits (pas de voix de synthèse) et on prévient une fois
// détail d'une erreur du fournisseur (JSON ElevenLabs/OpenAI → phrase courte), gardé pour l'afficher dans Options
function aivErr(e) {
  if (!e) return 'erreur inconnue';
  if (!e.st) return e.name === 'AbortError' ? 'délai dépassé' : 'appel bloqué ou réseau indisponible (' + (e.message || 'TypeError') + ')';
  let d = e.message || ''; try { const j = JSON.parse(d), x = j.detail || j.error || j; d = (x.message || x.status || (typeof x === 'string' ? x : JSON.stringify(x))); } catch (er) { }
  return 'code ' + e.st + (d ? ' : ' + String(d).slice(0, 140) : '');
}
function aivFail(e) {
  AIV.last = aivErr(e) + ' · ' + new Date().toLocaleTimeString('fr-FR');
  const st = e && e.st, msg = st === 401 || st === 403 ? 'Voix IA : clé refusée. Vérifie-la dans Options.' : st === 429 || st === 402 ? 'Voix IA : quota ou crédit épuisé chez le fournisseur.' : st === 0 ? 'Voix IA : choisis les voix ElevenLabs dans Options.' : st ? 'Voix IA indisponible (' + st + ').' : 'Voix IA injoignable (réseau, ou appel bloqué par la page).';
  if (!st || st === 401 || st === 403 || st === 402 || st === 429 || st === 0 || st === 404 || st === 400 || st === 422) AIV.dead = msg;
  if (typeof toast === 'function' && Date.now() - (AIV.toastT || 0) > 15000) { AIV.toastT = Date.now(); toast(msg + ' Les commentaires restent écrits.'); }
}
// la foule baisse un peu quand un commentateur parle (vraie voix)
function aivDuck(on) { const C = AU.crowd; if (!C || !AU.ctx) return; C.out.gain.setTargetAtTime(on ? .62 : 1, AU.ctx.currentTime, on ? .12 : .6); }
// liste des voix de ton compte ElevenLabs (pour les menus d'Options)
async function aivLoadEL() {
  if (!aivKey()) return false;
  try { const r = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': aivKey() } }); if (!r.ok) { let m = ''; try { m = (await r.text()).slice(0, 300); } catch (er) { } throw Object.assign(new Error(m || ('HTTP ' + r.status)), { st: r.status }); } const j = await r.json(); OPTS.aivEL = (j.voices || []).slice(0, 80).map(v => ({ id: v.voice_id, n: v.name, c: v.category || '', g: (v.labels && v.labels.gender) || '', a: (v.labels && (v.labels.accent || v.labels.language)) || '' })); saveOpts(); return true; }
  catch (e) { AIV.last = 'Liste des voix : ' + aivErr(e) + ' · ' + new Date().toLocaleTimeString('fr-FR'); if (typeof toast === 'function') toast(e && e.st ? 'ElevenLabs refuse la liste des voix (' + aivErr(e) + ').' : 'Impossible de joindre ElevenLabs (' + aivErr(e) + ').'); return false; }
}
// seules les vraies voix humaines parlent : tes répliques enregistrées et ta voix ElevenLabs ; le reste s'affiche en texte (plus jamais la voix robotique du téléphone)
const sayOn = () => OPTS.voice !== false && (OPTS.svol ?? .8) > 0 && AU.unlocked && !!AU.ctx && (aivOn() || voixAny());
// it : { txt, pri, who: 'S'|'N', song, dig }
function sayPush(it) {
  if (!it || !it.txt || !sayOn()) return;
  const ai = aivOn(), now = Date.now(), pri = it.pri || 0, who = it.who || 'S';
  if (ai && OPTS.aivMode === 'eco' && pri < 2 && !it.dig) return; // mode économique : temps forts et histoires seulement
  const items = [{ txt: it.txt, pri, who, dig: !!it.dig, song: !!it.song }].filter(x => ai || voixFile(x)); if (!items.length) return;
  const ttl = (pri >= 3 ? 9000 : it.song ? 15000 : it.dig ? 16000 : pri >= 2 ? 7000 : 5000) + (ai ? 2500 : 0);
  items.forEach(x => { x.exp = now + ttl + (x.si || 0) * 4000; });
  const cur = SAY.cur;
  if (pri >= 3 && !it.song && !it.dig) { SAY.q = SAY.q.filter(x => x.pri >= 3); if (cur && (cur.pri < 2 || cur.dig)) { if (ai) items.forEach(x => { x.ap = aivFetch(x); }); return sayCut(items); } }
  else if (pri >= 2 && !it.dig) { SAY.q = SAY.q.filter(x => !x.dig && x.pri >= 2); if (cur && cur.dig) { if (ai) items.forEach(x => { x.ap = aivFetch(x); }); return sayCut(items); } }
  else if (!it.dig && SAY.q.length >= 2) return; // on ne commente pas une action avec dix secondes de retard
  // voix IA : on lance la fabrication de l'audio tout de suite, pendant que la phrase précédente se termine
  items.forEach(x => { if (!ai && voixFile(x)) { x.rec = true; x.ap = voixFetch(x); x.ap.catch(() => { }); } });
  if (ai) items.forEach(x => { x.ap = aivFetch(x); x.ap.catch(() => { }); });
  SAY.q.push(...items); if (SAY.q.length > 14) SAY.q.splice(0, SAY.q.length - 14);
  if (!SAY.cur) sayNext();
}
// coupe la phrase en cours (iOS : petit délai avant de reparler)
function sayCut(items) {
  SAY.tok++; clearTimeout(SAY.wd); SAY.q.unshift(...items); SAY.cur = { cut: true, pri: 9 };
  if (AIV.src) { try { AIV.src.stop(); } catch (e) { } AIV.src = null; aivDuck(false); }
  try { if (SAY.ok) speechSynthesis.cancel(); } catch (e) { }
  setTimeout(() => { if (SAY.cur && SAY.cur.cut) sayNext(); }, 90);
}
function sayNext() {
  SAY.cur = null; const now = Date.now();
  while (SAY.q.length && SAY.q[0].exp < now) SAY.q.shift();
  const x = SAY.q.shift(); if (!x || !sayOn()) { aivDuck(false); return; }
  const tok = ++SAY.tok, nextWho = () => (SAY.q[0] || {}).who;
  const done = () => { if (tok !== SAY.tok) return; SAY.tok++; clearTimeout(SAY.wd); AIV.src = null; if (!SAY.q.length) aivDuck(false); SAY.cur = { gap: true, pri: 0 }; setTimeout(() => { if (SAY.cur && SAY.cur.gap) sayNext(); }, x.song && !x.ap ? 40 : nextWho() && nextWho() !== x.who ? 320 : 160); };
  SAY.cur = x;
  if (x.ap && (aivOn() || x.rec)) {
    // vraie voix : on attend l'audio (déjà en préparation), on le joue dans le mixage du jeu
    SAY.wd = setTimeout(() => { if (tok === SAY.tok) done(); }, 15000);
    x.ap.then(buf => {
      if (tok !== SAY.tok) return; clearTimeout(SAY.wd);
      if (Date.now() > x.exp + 3000) return done();
      const c = AU.ctx, src = c.createBufferSource(), g = c.createGain(); src.buffer = buf; g.gain.value = clamp((OPTS.svol ?? .8) * (x.who === 'P' ? .95 : 1.25), 0, 1.4); src.connect(g); g.connect(x.who === 'P' && typeof paOut === 'function' && paOut() || AU.master);
      src.onended = () => { if (AIV.src === src) done(); }; AIV.src = src; aivDuck(true); src.start();
      SAY.wd = setTimeout(() => { if (tok === SAY.tok) done(); }, (buf.duration + 3) * 1000);
    }).catch(e => { if (tok !== SAY.tok) return; clearTimeout(SAY.wd); if (x.rec) { x.rec = false; VOIX.off = (VOIX.off || 0) + 1; } else aivFail(e); x.ap = null; SAY.q.unshift(x); SAY.tok++; SAY.cur = null; sayNext(); });
    return;
  }
  // pas de vraie voix pour cette réplique : elle reste écrite, on passe à la suivante (jamais la voix robotique du téléphone)
  SAY.cur = null; return sayNext();
}
// le réalisateur des commentaires (comm.js) lance une réplique TOUT DE SUITE, en coupant la précédente
function sayPlay(it) {
  if (!sayOn()) return;
  SAY.q = []; SAY.tok++; clearTimeout(SAY.wd);
  if (AIV.src) { try { AIV.src.stop(); } catch (e) { } AIV.src = null; }
  const x = Object.assign({}, it, { exp: Date.now() + 30000 });
  const vf = voixFile(it); x.rec = !!vf;
  x.ap = it.buf && (aivOn() || vf) ? Promise.resolve(it.buf) : vf ? voixFetch(it) : aivOn() ? aivFetch(x) : null;
  if (!x.ap) return; // aucune voix humaine pour cette phrase : texte seulement
  let busy = false; try { busy = SAY.ok && (speechSynthesis.speaking || speechSynthesis.pending); if (busy) speechSynthesis.cancel(); } catch (e) { }
  SAY.q.push(x);
  if (busy && !x.ap) { SAY.cur = { cut: true, pri: 9 }; setTimeout(() => { if (SAY.cur && SAY.cur.cut) sayNext(); }, 70); } else { SAY.cur = null; sayNext(); }
}
// cette réplique est-elle encore en train d'être dite ?
function sayBusyWith(id) { const c = SAY.cur; if (!c || c.id !== id) return false; if (AIV.src) return true; try { return SAY.ok && speechSynthesis.speaking; } catch (e) { return false; } }
function say(txt, pri) { sayPush({ txt, pri: pri || 0, who: 'S' }); }
function sayStop() { SAY.q = []; SAY.tok++; SAY.cur = null; clearTimeout(SAY.wd); aivDuck(false); if (AIV.src) { try { AIV.src.stop(); } catch (e) { } AIV.src = null; } try { if (SAY.ok) speechSynthesis.cancel(); } catch (e) { } }
