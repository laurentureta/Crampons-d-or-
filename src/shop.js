// ---------- Pépites (monnaie du jeu) et Boutique de style ----------
// Les Pépites se gagnent en jouant (jamais avec de l'argent réel) et n'achètent que du style : rien qui rend plus fort.
// Le porte-monnaie appartient au joueur (toutes carrières confondues) ; il voyage dans les sauvegardes exportées et en ligne.
const SHOP_KEY = 'cdo2_shop';
const SHOP_CAT = [
  { k: 'boots', n: 'Crampons', d: 'Aux pieds de ton joueur pendant les matchs en 3D.' },
  { k: 'ball', n: 'Ballons', d: 'Le ballon de tes matchs en 3D.' },
  { k: 'celeb', n: 'Célébrations', d: 'Ce que fait ton joueur quand il marque, en 3D.' },
  { k: 'fx', n: 'Effets de but', d: 'Le spectacle dans le stade après tes buts.' },
  { k: 'halo', n: 'Halos', d: 'L\'anneau lumineux sous ton joueur.' },
  { k: 'card', n: 'Cartes', d: 'Le style de ta carte de joueur à partager.' },
  { k: 'theme', n: 'Thèmes', d: 'Les couleurs de tout le jeu.' },
];
const SHOP_ITEMS = [
  // crampons : couleur
  { id: 'b_gold', c: 'boots', n: 'Or massif', p: 0, v: '#f2b632' },
  { id: 'b_black', c: 'boots', n: 'Noir mat', p: 250, v: '#18181b' },
  { id: 'b_white', c: 'boots', n: 'Blanc pur', p: 250, v: '#f5f5f2' },
  { id: 'b_fire', c: 'boots', n: 'Rouge feu', p: 400, v: '#e5322d' },
  { id: 'b_ice', c: 'boots', n: 'Bleu glacier', p: 400, v: '#4fc0ff' },
  { id: 'b_lime', c: 'boots', n: 'Vert néon', p: 600, v: '#9dff2e' },
  { id: 'b_pink', c: 'boots', n: 'Rose fluo', p: 600, v: '#ff3fa4' },
  { id: 'b_chrome', c: 'boots', n: 'Chrome', p: 1200, v: '#dfe4ea' },
  // ballons
  { id: 'ball_classic', c: 'ball', n: 'Classique', p: 0, v: 'classic' },
  { id: 'ball_retro', c: 'ball', n: 'Rétro cuir', p: 700, v: 'retro' },
  { id: 'ball_tri', c: 'ball', n: 'Tricolore', p: 800, v: 'tri' },
  { id: 'ball_night', c: 'ball', n: 'Nuit étoilée', p: 900, v: 'night' },
  { id: 'ball_fire', c: 'ball', n: 'Flammes', p: 1100, v: 'fire' },
  { id: 'ball_gold', c: 'ball', n: 'Ballon en or', p: 1500, v: 'gold' },
  // célébrations
  { id: 'c_classic', c: 'celeb', n: 'Poing levé', p: 0, v: 'classic', e: '✊' },
  { id: 'c_calm', c: 'celeb', n: 'Calmez-vous !', p: 500, v: 'calm', e: '🤚' },
  { id: 'c_knee', c: 'celeb', n: 'Glissade à genoux', p: 600, v: 'knee', e: '🙌' },
  { id: 'c_plane', c: 'celeb', n: 'L\'avion', p: 600, v: 'plane', e: '✈️' },
  { id: 'c_heart', c: 'celeb', n: 'Cœur avec les mains', p: 700, v: 'heart', e: '🫶' },
  { id: 'c_ear', c: 'celeb', n: 'J\'entends rien !', p: 700, v: 'ear', e: '👂' },
  { id: 'c_spin', c: 'celeb', n: 'Saut tournant', p: 900, v: 'spin', e: '🌀' },
  { id: 'c_dance', c: 'celeb', n: 'Petite danse', p: 900, v: 'dance', e: '🕺' },
  { id: 'c_flip', c: 'celeb', n: 'Salto arrière', p: 1800, v: 'flip', e: '🤸' },
  // effets de but
  { id: 'fx_none', c: 'fx', n: 'Sobre', p: 0, v: 'none', e: '·' },
  { id: 'fx_confetti', c: 'fx', n: 'Confettis dorés', p: 800, v: 'confetti', e: '🎊' },
  { id: 'fx_smoke', c: 'fx', n: 'Fumigènes du club', p: 1000, v: 'smoke', e: '🔥' },
  { id: 'fx_stars', c: 'fx', n: 'Pluie d\'étoiles', p: 1200, v: 'stars', e: '✨' },
  { id: 'fx_fireworks', c: 'fx', n: 'Feu d\'artifice', p: 1500, v: 'fireworks', e: '🎆' },
  // halos
  { id: 'h_gold', c: 'halo', n: 'Anneau doré', p: 0, v: '#f5c542' },
  { id: 'h_white', c: 'halo', n: 'Blanc', p: 300, v: '#ffffff' },
  { id: 'h_blue', c: 'halo', n: 'Bleu électrique', p: 300, v: '#36a9ff' },
  { id: 'h_red', c: 'halo', n: 'Rouge braise', p: 300, v: '#ff4a3d' },
  { id: 'h_pulse', c: 'halo', n: 'Onde de choc', p: 800, v: 'pulse' },
  { id: 'h_rainbow', c: 'halo', n: 'Arc-en-ciel', p: 1000, v: 'rainbow' },
  // cartes de joueur
  { id: 'k_base', c: 'card', n: 'Classique', p: 0, v: { b0: '#1c3529', b1: '#09130f', fr: '#ffb02e', ac: '#ffb02e', fg: '#edf4ef', mu: '#9bb2a6' } },
  { id: 'k_night', c: 'card', n: 'Nuit', p: 600, v: { b0: '#1b2350', b1: '#05060f', fr: '#5ad1ff', ac: '#5ad1ff', fg: '#eef3ff', mu: '#94a3c9' } },
  { id: 'k_ruby', c: 'card', n: 'Rubis', p: 700, v: { b0: '#5a0f1c', b1: '#14040a', fr: '#ff5a6e', ac: '#ff8a96', fg: '#fff1f2', mu: '#d29aa2' } },
  { id: 'k_gold', c: 'card', n: 'Or brillant', p: 900, v: { b0: '#ffe08a', b1: '#b07a16', fr: '#fff6d8', ac: '#3a2604', fg: '#2a1a02', mu: '#5c430f', shine: 1 } },
  { id: 'k_holo', c: 'card', n: 'Holographique', p: 1500, v: { b0: '#2a1b4a', b1: '#0b1a2a', fr: '#ffffff', ac: '#ffffff', fg: '#ffffff', mu: '#cfd8ff', holo: 1 } },
  { id: 'k_legend', c: 'card', n: 'Légende', p: 2500, v: { b0: '#141414', b1: '#000000', fr: '#f2cd5c', ac: '#f2cd5c', fg: '#fdf7e6', mu: '#b9a77a', stars: 1 } },
  // thèmes de l'interface
  { id: 't_gold', c: 'theme', n: 'Or', p: 0, v: ['#ffb02e', '#ffcf7a', '#1d1405', '#f2cd5c'] },
  { id: 't_emerald', c: 'theme', n: 'Émeraude', p: 500, v: ['#2fd67b', '#8ef0b5', '#03170c', '#7af0a8'] },
  { id: 't_sky', c: 'theme', n: 'Ciel', p: 500, v: ['#3fb2ff', '#a3dcff', '#04121f', '#8fd0ff'] },
  { id: 't_ruby', c: 'theme', n: 'Rubis', p: 500, v: ['#ff4d5e', '#ff9aa3', '#1f0408', '#ff8f9a'] },
  { id: 't_violet', c: 'theme', n: 'Violet', p: 500, v: ['#a46bff', '#d0b3ff', '#12062a', '#c8a8ff'] },
  { id: 't_platinum', c: 'theme', n: 'Platine', p: 800, v: ['#e3eaee', '#ffffff', '#101418', '#f4f7f9'] },
];
const SHOP_DEF = { boots: 'b_gold', ball: 'ball_classic', celeb: 'c_classic', fx: 'fx_none', halo: 'h_gold', card: 'k_base', theme: 't_gold' };
const BTQ = { w: null, pend: 0, why: {}, tab: 'boots' };
const shopItem = id => SHOP_ITEMS.find(x => x.id === id);
function shopToday(d) { const x = d || new Date(); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }
function shopW() {
  if (BTQ.w) return BTQ.w;
  let w = null; try { w = JSON.parse(localStorage.getItem(SHOP_KEY) || 'null'); } catch (e) { }
  if (!w || typeof w.bal !== 'number') { w = { v: 1, bal: 300, tot: 300, owned: {}, eq: {}, day: '', streak: 0, log: [[Date.now(), 300, 'Cadeau de bienvenue']] }; }
  for (const k in SHOP_DEF) { w.owned[SHOP_DEF[k]] = 1; if (!w.eq[k] || !shopItem(w.eq[k])) w.eq[k] = SHOP_DEF[k]; }
  BTQ.w = w; shopPersist(); return w;
}
function shopPersist() { try { localStorage.setItem(SHOP_KEY, JSON.stringify(BTQ.w)); } catch (e) { } }
// ce que le joueur porte (utilisé par la 3D, la carte, le thème)
function shopEq(cat) { const it = shopItem(shopW().eq[cat] || SHOP_DEF[cat]) || shopItem(SHOP_DEF[cat]); return it.v; }
function shopGain(n, why, quiet) {
  n = Math.round(n); if (!(n > 0)) return; const w = shopW();
  w.bal += n; w.tot += n; w.log.unshift([Date.now(), n, why]); if (w.log.length > 40) w.log.length = 40; shopPersist();
  if (!quiet) { BTQ.pend += n; BTQ.why[why] = (BTQ.why[why] || 0) + n; }
}
// à la fin d'un enchaînement de jours : un seul message pour tout ce qui a été gagné
function shopToast() {
  if (!BTQ.pend) return ''; const n = BTQ.pend, top = Object.entries(BTQ.why).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0].toLowerCase()).join(', ');
  BTQ.pend = 0; BTQ.why = {}; return `+${fnum(n)} Pépites (${top})`;
}
// un match joué par ton joueur (appelé par recordMatch)
function shopEarnMatch(pst, mine, th, prep) {
  if (!pst || !(pst.min > 0)) return;
  const live = prep && prep.live ? 1.5 : 1;
  let n = 4; const res = mine > th ? 'Victoire' : mine === th ? 'Nul' : 'Match';
  n += mine > th ? 8 : mine === th ? 3 : 0;
  n += Math.min(5, pst.g || 0) * 12 + Math.min(5, pst.a || 0) * 7;
  if (pst.rt >= 9) n += 20; else if (pst.rt >= 8) n += 10;
  if (pst.cs && ['GB', 'DC', 'DL'].includes(S.p.pos)) n += 8;
  shopGain(n * live, pst.g ? (pst.g > 1 ? pst.g + ' buts' : 'But') : res);
}
// trophées, succès, première sélection : rattrapés à chaque sauvegarde
function shopTick() {
  if (!S || !S.p) return;
  const tr = S.trophies || [], ach = Object.keys(S.ach || {}).length, deb = S.intl && S.intl.debut ? 1 : 0;
  if (!S.shopSeen) {
    // carrière déjà commencée avant la Boutique : un rattrapage, une seule fois
    const back = Math.min(2500, (S.stats ? S.stats.proGoals * 6 + S.stats.proApps * 2 : 0) + tr.length * 80 + ach * 25);
    S.shopSeen = { tr: tr.length, ach, deb };
    if (back >= 20) shopGain(back, 'Rattrapage de ta carrière');
    return;
  }
  const z = S.shopSeen;
  for (const t of tr.slice(z.tr)) shopGain(/Ballon d'Or/.test(t.t) ? 500 : /Montée/.test(t.t) ? 60 : 120, /Ballon d'Or/.test(t.t) ? 'Ballon d\'Or' : 'Trophée');
  if (ach > z.ach) shopGain((ach - z.ach) * 40, 'Succès');
  if (deb && !z.deb) shopGain(100, 'Première sélection');
  S.shopSeen = { tr: tr.length, ach, deb };
}
// bonus du jour : 30 Pépites, +10 par jour d'affilée (jusqu'à 90)
function shopDailyOk() { return shopW().day !== shopToday(); }
function shopDaily() {
  const w = shopW(), today = shopToday(); if (w.day === today) return 0;
  const y = new Date(); y.setDate(y.getDate() - 1);
  w.streak = w.day === shopToday(y) ? Math.min(7, (w.streak || 0) + 1) : 1; w.day = today;
  const n = 30 + 10 * (w.streak - 1); shopGain(n, 'Bonus du jour', true); return n;
}
function shopBuy(id) {
  const it = shopItem(id), w = shopW(); if (!it || w.owned[id]) return 'Déjà à toi.';
  if (w.bal < it.p) return `Il te manque ${fnum(it.p - w.bal)} Pépites.`;
  w.bal -= it.p; w.owned[id] = 1; w.eq[it.c] = id; w.log.unshift([Date.now(), -it.p, it.n]); if (w.log.length > 40) w.log.length = 40; shopPersist(); shopApply(); return null;
}
function shopEquip(id) { const it = shopItem(id), w = shopW(); if (!it || !w.owned[id]) return; w.eq[it.c] = id; shopPersist(); shopApply(); }
// effets immédiats : couleurs de l'interface, et la 3D relit le reste à chaque match
function shopApply() {
  try {
    const [a, a2, ink, gold] = shopEq('theme'), st = document.documentElement.style;
    st.setProperty('--acc', a); st.setProperty('--acc2', a2); st.setProperty('--ink', ink); st.setProperty('--gold', gold);
  } catch (e) { }
  if (typeof G3 !== 'undefined') { G3.kitKey = null; G3.ballSkin = null; }
}
// voyage avec les sauvegardes (export / en ligne) : on garde le meilleur des deux
function shopSnap() { const w = shopW(); return { bal: w.bal, tot: w.tot, owned: Object.assign({}, w.owned), eq: Object.assign({}, w.eq) }; }
function shopMerge(x) {
  if (!x || typeof x.bal !== 'number') return; const w = shopW();
  w.bal = Math.max(w.bal, x.bal); w.tot = Math.max(w.tot, x.tot || 0); Object.assign(w.owned, x.owned || {});
  for (const k in x.eq || {}) if (w.owned[x.eq[k]] && w.eq[k] === SHOP_DEF[k]) w.eq[k] = x.eq[k];
  shopPersist(); shopApply();
}

// ---------- écran Boutique ----------
const PEP = '<i class="pep" aria-hidden="true"></i>';
function shopSwatch(it) {
  const v = it.v;
  if (it.c === 'boots') return `<div class="sw bootsw" style="--c:${v}"><span class="bt"></span><span class="bt"></span></div>`;
  if (it.c === 'halo') return `<div class="sw halo ${v === 'pulse' ? 'pulse' : v === 'rainbow' ? 'rainbow' : ''}" style="--c:${v.startsWith('#') ? v : '#f5c542'}"></div>`;
  if (it.c === 'ball') return `<div class="sw ballsw" style="background-image:url(${shopBallImg(v)})"></div>`;
  if (it.c === 'card') return `<div class="sw cardsw ${v.holo ? 'holo' : ''}" style="--b0:${v.b0};--b1:${v.b1};--fr:${v.fr};--ac:${v.ac}"><b>87</b><span class="shn"></span></div>`;
  if (it.c === 'theme') return `<div class="sw themesw" style="--a:${v[0]};--a2:${v[1]}"><span></span><span></span><span></span></div>`;
  return `<div class="sw emo">${it.e || '★'}</div>`;
}
// image d'un ballon (texture plaquée sur un disque) pour la vitrine
const SHOP_BALLIMG = {};
function shopBallImg(skin) {
  if (SHOP_BALLIMG[skin]) return SHOP_BALLIMG[skin];
  try { const c = typeof g3BallPaint === 'function' ? g3BallPaint(skin, 256, 128) : null; SHOP_BALLIMG[skin] = c ? c.toDataURL() : ''; } catch (e) { SHOP_BALLIMG[skin] = ''; }
  return SHOP_BALLIMG[skin];
}
function vShop() {
  const w = shopW(), cat = SHOP_CAT.find(c => c.k === BTQ.tab) || SHOP_CAT[0], items = SHOP_ITEMS.filter(x => x.c === cat.k), eq = w.eq[cat.k];
  const dOk = shopDailyOk(), st = w.streak || 0, next = w.day === shopToday(new Date(Date.now() - 864e5)) ? Math.min(7, st + 1) : 1;
  const show3d = ['boots', 'ball', 'celeb', 'fx', 'halo'].includes(cat.k) && typeof g3PreviewOk === 'function' && g3PreviewOk();
  return `<section class="card shophd">
      <div class="row"><div class="grow"><div class="lbl">Tes Pépites</div><div class="pepbal">${PEP}<b>${fnum(w.bal)}</b></div><div class="note">${fnum(w.tot)} gagnées depuis le début</div></div>
      <button class="btn ${dOk ? '' : 'ghost'} daily" data-a="shopDaily" ${dOk ? '' : 'disabled'}><span>${dOk ? 'Bonus du jour' : 'Revenez demain'}</span><b>${dOk ? '+' + (30 + 10 * (next - 1)) : '✓'}</b></button></div>
      <div class="streak" aria-label="Jours d'affilée">${[1, 2, 3, 4, 5, 6, 7].map(i => `<i class="${i <= (dOk ? next - 1 : st) ? 'on' : ''}"></i>`).join('')}<span class="note">${dOk ? (next > 1 ? `${next}e jour d'affilée` : 'Reviens chaque jour : le bonus grimpe') : `${st} jour${st > 1 ? 's' : ''} d'affilée`}</span></div>
    </section>
    ${show3d ? `<section class="card shop3d"><canvas id="shopCv" aria-label="Ton joueur en 3D"></canvas><div class="shop3d-cap"><span class="lbl">Ton joueur</span>${cat.k === 'celeb' || cat.k === 'fx' ? '<button class="btn sm ghost" data-a="shopReplay">Revoir</button>' : ''}</div></section>` : ''}
    <nav class="shoptabs">${SHOP_CAT.map(c => `<button data-a="shopTab" data-v="${c.k}" class="${c.k === cat.k ? 'on' : ''}">${c.n}</button>`).join('')}</nav>
    <p class="note">${cat.d}</p>
    <div class="shopgrid">${items.map(it => { const own = !!w.owned[it.id], on = eq === it.id, can = w.bal >= it.p;
      return `<button class="sitem ${on ? 'on' : ''} ${own ? 'own' : ''}" data-a="shopItem" data-v="${it.id}">${shopSwatch(it)}<b>${esc(it.n)}</b><span class="sprice">${on ? 'Équipé ✓' : own ? 'Équiper' : it.p ? `${PEP}${fnum(it.p)}` : 'Gratuit'}</span>${!own && !can ? '<span class="slock">' + fnum(it.p - w.bal) + ' de plus</span>' : ''}</button>`; }).join('')}</div>
    <section class="card sec"><h3>Gagner des Pépites</h3><ul class="pepways">
      <li><b>Chaque match</b> joué : 4, +8 en cas de victoire</li><li><b>But</b> : 12 · <b>passe décisive</b> : 7</li><li><b>Grande note</b> (8 ou plus) : 10 à 20</li>
      <li><b>Match en direct</b> : tout compte une fois et demie</li><li><b>Trophée</b> : 120 · <b>Ballon d'Or</b> : 500</li><li><b>Succès</b> : 40 · <b>première sélection</b> : 100</li><li><b>Bonus du jour</b> : 30 à 90</li></ul>
      <p class="note">Les Pépites ne s'achètent pas : elles se gagnent. La Boutique ne vend que du style, jamais de points de stats.</p></section>
    ${w.log.length ? `<section class="card sec"><h3>Derniers mouvements</h3><div class="peplog">${w.log.slice(0, 8).map(([ts, n, why]) => `<div class="row"><span class="grow">${esc(why)}</span><span class="note">${new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span><b class="${n < 0 ? 'neg' : ''}">${n > 0 ? '+' : ''}${fnum(n)}</b></div>`).join('')}</div></section>` : ''}`;
}
// la vitrine 3D se branche après chaque affichage de la page
function shopAfterRender() {
  const cv = document.getElementById('shopCv');
  if (cv && typeof g3Preview === 'function') g3Preview(cv, BTQ.tab); else if (typeof g3PreviewStop === 'function') g3PreviewStop();
}
// petit « ding » de pièce (synthèse, pas de fichier)
function shopDing() {
  try { if (typeof auUnlock === 'function') auUnlock(); const c = typeof AU !== 'undefined' && AU.ctx; if (!c || (OPTS.svol ?? .8) <= 0) return; const t = c.currentTime + .02;
    [[1319, 0], [1976, .07]].forEach(([f, d]) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(.0001, t + d); g.gain.exponentialRampToValueAtTime(.18 * (OPTS.svol ?? .8), t + d + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d + .35); o.connect(g); g.connect(c.destination); o.start(t + d); o.stop(t + d + .4); });
  } catch (e) { }
}
const SHOP_ACT = {
  shopTab: v => { BTQ.tab = v; render(); },
  shopDaily: () => { const n = shopDaily(); if (n) { toast(`+${n} Pépites · bonus du jour`); shopDing(); } render(); },
  shopReplay: () => { if (typeof g3PreviewReplay === 'function') g3PreviewReplay(); },
  shopItem: v => {
    const it = shopItem(v), w = shopW(); if (!it) return;
    if (w.owned[v]) { shopEquip(v); toast(`${it.n} : équipé.`); return render(); }
    if (w.bal < it.p) return toast(`Il te manque ${fnum(it.p - w.bal)} Pépites pour « ${it.n} ».`);
    openModal({ kicker: 'Boutique', title: it.n, html: `<div class="shopconf">${shopSwatch(it)}<p>Acheter <b>${esc(it.n)}</b> pour <b>${fnum(it.p)} Pépites</b> ?</p><p class="note">Il te restera ${fnum(w.bal - it.p)} Pépites. L'objet est équipé tout de suite.</p></div>`,
      btns: [{ t: 'Acheter', cls: 'pri', fn: () => { const err = shopBuy(v); toast(err || `${it.n} : à toi !`); if (!err) shopDing(); render(); } }, { t: 'Annuler', fn: () => { } }] });
  },
};
