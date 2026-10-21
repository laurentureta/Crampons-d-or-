// ===================== INTERFACE : base, démarrage, menus, accueil, agenda =====================
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const UI = { screen: 'splash', page: null, tab: 'home', sub: null, arg: null, stack: [], step: 0, create: { first: '', last: '', num: 10, foot: 'Droit', nat: 'FRA', city: 'Paris', pos: 'AIL', fam: null, diff: 1, pref: 'F' }, load: null, tblL: null, trialL: null, calM: 0, calSel: null, eInt: 'N', nego: null, adv: null, anim: null, agentList: null, lspeed: 1, lt: null, cardImg: null };
let MODAL = null, TOAST_T = null;
const OPTS_KEY = 'cdo2_opts';
// caméras du match en 3D : [clé, nom court, description]
const CAM_VIEWS = [['tv', 'TV', 'Caméra TV'], ['large', 'Large', 'Caméra large'], ['tac', 'Tactique', 'Vue tactique : les lignes des deux équipes'], ['joueur', 'Mon joueur', 'Caméra derrière ton joueur'], ['but', 'Derrière le but', 'Caméra derrière le but'], ['bord', 'Bord du terrain', 'Caméra au bord du terrain'], ['drone', 'Drone', 'Caméra drone au-dessus de l\'action']];
const OPT_DEF = { live: 'all', speed: 1, music: true, mvol: .55, svol: .8, shuffle: true, mg: true, geste: true, interrupt: 'all', voice: true, replay: 'all', gfx: '3d', cam: 'tv', chat: 'all', v1: '', v2: '', aiv: 'off', aivMode: 'all', aivS: '', aivN: '', aivM: 'eleven_flash_v2_5', aivEL: [], intro: true, fetes: true, tv: true, motion: true };
function loadOpts() { try { return Object.assign({}, OPT_DEF, JSON.parse(localStorage.getItem(OPTS_KEY) || '{}')); } catch (e) { return Object.assign({}, OPT_DEF); } }
let OPTS = loadOpts();
function saveOpts() { try { localStorage.setItem(OPTS_KEY, JSON.stringify(OPTS)); } catch (e) { } }

const IC = {
  cam: '<rect x="2" y="7" width="14" height="11" rx="2"/><path d="M16 11l6-3v9l-6-3z"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 13v4M9 21h6M10 17h4"/>',
  heart: '<path d="M12 20s-7-4.4-9-9a4.6 4.6 0 0 1 9-2 4.6 4.6 0 0 1 9 2c-2 4.6-9 9-9 9z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  swap: '<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
  watch: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M10 2h4"/>',
  brief: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 4v16"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><path d="M15.5 14.5h2"/>',
  family: '<circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20a6 6 0 0 1 12 0M13 20a4.5 4.5 0 0 1 9 0"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="3"/><path d="M2 20a7 7 0 0 1 14 0M14.5 14.5A5.5 5.5 0 0 1 22 20"/>',
  house: '<path d="M3 21h18M5 21V10l7-5 7 5v11"/><path d="M10 21v-5h4v5"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  dumb: '<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7"/>',
  card: '<rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="9" r="3"/><path d="M8 17h8"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2.2"/><path d="M11 17.5h2"/>',
  medal: '<circle cx="12" cy="15" r="6"/><path d="M8 3l4 6 4-6M12 12.5v5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  ball: '<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 4.5h-5L8 10z"/>',
  save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7M8 21v-7h8v7"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.5"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  door: '<path d="M14 3H6v18h8M10 12h11M18 9l3 3-3 3"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  ff: '<path d="M4 5l8 7-8 7zM12 5l8 7-8 7z"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  note: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  mute: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l4 6M21 9l-4 6"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  curve: '<path d="M3 20h18M4 16l5-6 4 3 7-8"/>',
  next: '<path d="M5 4l10 8-10 8zM19 5v14"/>',
};
const icon = (k, cls) => `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${IC[k] || ''}</svg>`;
function badge(n, lg) { return `<span class="badge${lg ? ' lg' : ''}" style="background:hsl(${hueOf(n)} 48% 30%)">${esc(initials(n))}</span>`; }
function bar(v, cls) { return `<div class="bar ${cls || ''}"><i style="width:${clamp(v, 0, 100)}%"></i></div>`; }
function gauge(t, v, cls) { return `<div class="gauge"><div class="t"><span>${t}</span><span class="num">${Math.round(v)}</span></div>${bar(v, cls)}</div>`; }
function rtCls(r) { return r >= 7.5 ? 'hi' : r < 6 ? 'lo' : r >= 6.8 ? 'mid' : ''; }
function stars(n) { return '<span class="stars">' + '★'.repeat(n) + '<span class="dim">' + '★'.repeat(5 - n) + '</span></span>'; }
function potStars() { const p = S.p.pot; return p >= 92 ? 5 : p >= 86 ? 4 : p >= 80 ? 3 : p >= 74 ? 2 : 1; }
const dec = (v, n) => v.toFixed(n ?? 1).replace('.', ',');
function toast(t) { if (!t) return; const el = $('#toast'); el.innerHTML = `<div class="toast">${esc(t)}</div>`; clearTimeout(TOAST_T); TOAST_T = setTimeout(() => el.innerHTML = '', 2800); }
function openModal(m) { MODAL = m; renderModal(); }
function closeModal() { MODAL = null; renderModal(); }
function renderModal() {
  const ov = $('#ov');
  if (!MODAL) { ov.innerHTML = ''; return; }
  ov.innerHTML = `<div class="ov"><div class="md ${MODAL.cls || ''}" role="dialog" aria-modal="true" aria-label="${esc(MODAL.title)}">${MODAL.kicker ? `<div class="lbl acc">${esc(MODAL.kicker)}</div>` : ''}<div class="ttl">${esc(MODAL.title)}</div><div class="body">${MODAL.html || ''}</div><div class="btns">${(MODAL.btns || []).map((b, i) => `<button class="btn ${b.cls || ''}" data-a="mbtn" data-v="${i}" ${b.dis ? 'disabled' : ''}>${esc(b.t)}</button>`).join('')}</div></div></div>`;
  const md = ov.querySelector('.md'); if (md) md.scrollTop = 0;
  if (typeof uimModal === 'function') uimModal();
}
const shortDate = d => DAYS_S[(d.getDay() + 6) % 7] + '. ' + d.getDate() + ' ' + MONTHS_S[d.getMonth()] + ' ' + d.getFullYear();
const dayMonth = d => d.getDate() + ' ' + MONTHS[d.getMonth()];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
function dateFromAbs(a) { const s = 2026 + Math.floor(a / 364), r = a - (s - 2026) * 364; return dateAt(s, Math.floor(r / 7) + 1, r % 7); }

// ---------- Rendu principal ----------
function render() {
  const app = $('#app');
  let h = '';
  if (UI.screen === 'splash') h = vSplash();
  else if (UI.screen === 'menu') h = vMenu();
  else if (UI.screen === 'page') h = vMenuPage();
  else if (UI.screen === 'create') h = vCreate();
  else if (UI.screen === 'loading') h = vLoading();
  else if (UI.screen === 'intro') h = vIntro();
  else if (UI.screen === 'live') h = vLive();
  else if (S && S.over) h = vEnd();
  else h = vGame();
  app.innerHTML = h;
  app.className = 'scr-' + UI.screen;
  $('#nav').innerHTML = UI.screen === 'game' && S && !S.over ? vNav() : '';
  renderModal(); renderAdv();
  auScene(UI.screen === 'live' ? 'live' : UI.screen === 'game' ? 'game' : 'menu');
  if (UI.screen === 'live') { if (typeof lvAttach === 'function' && S && S.live && S.live.M.eng && !LV.off) lvAttach(); } else if (typeof lvStop === 'function') lvStop();
  if (typeof ldStart === 'function') { if (UI.screen === 'loading' || UI.screen === 'splash') ldStart(); else ldStop(); }
  if (typeof shopAfterRender === 'function') shopAfterRender();
  if (typeof uiMotion === 'function') uiMotion();
  if (UI.anim) setTimeout(() => { UI.anim = null; }, 50);
}

// ---------- Écran de démarrage ----------
function vSplash() {
  if (typeof vLoadScreen === 'function') return vLoadScreen(UI.load || { title: 'Saison 2026-27', t: 'Préparation du stade…', p: 0 }, 'Simulateur de carrière');
  return `<div class="splash">
    <div class="spl-top"><div class="lbl">Simulateur de carrière</div><h1 class="logo">Crampons<span>d'Or</span></h1></div>
    <div class="pitch" aria-hidden="true"><div class="ball"></div></div>
    <div class="loadbox"><div class="loadbar"><i id="lb" style="width:0%"></i></div><div class="row between"><span id="lt" class="note">Préparation du terrain…</span><span id="lp" class="note num">0 %</span></div></div>
    <p class="note center">Saison 2026-27 · données au 11 octobre 2026</p>
  </div>`;
}
function runSplash() {
  const steps = [['Préparation du terrain…', 8], [`Chargement de ${LEAGUES.length} championnats…`, 26], [`${Object.values(LEAGUES).reduce((a, l) => a + l.clubs.length, 0)} clubs et leurs entraîneurs…`, 47], ['Joueurs et effectifs 2026…', 66], [`${Object.keys(NATIONS).length} sélections et leurs sélectionneurs…`, 82], ['Calendrier, coupes d\'Europe, Coupe du monde…', 94], ['Prêt !', 100]];
  let i = 0;
  const tick = () => {
    if (UI.screen !== 'splash') return;
    const [t, p] = steps[i];
    const lb = $('#lb'), lt = $('#lt'), lp = $('#lp');
    if (lb) { lb.style.width = p + '%'; lt.textContent = t; lp.textContent = p + ' %'; }
    i++;
    if (i < steps.length) setTimeout(tick, 230 + Math.random() * 180);
    else setTimeout(() => { UI.screen = 'menu'; render(); }, 380);
  };
  setTimeout(tick, 250);
}
// écran de chargement (src/loading.js) : les étapes défilent, la barre et le ballon suivent, puis éclair et entrée en jeu
function runLoading(title, steps, work, done) {
  UI.load = { title, t: steps[0], p: 0 }; UI.screen = 'loading'; if (typeof LD !== 'undefined') LD.shown = 0; render();
  let i = 0; const t0 = Date.now();
  const tick = () => {
    UI.load.t = steps[i]; UI.load.p = Math.round((i + 1) / steps.length * 100);
    const lt = $('#lt'); if (lt) { lt.textContent = UI.load.t; if (lt.classList) { lt.classList.remove('in'); void lt.offsetWidth; lt.classList.add('in'); } }
    if (i === 1 && work) work();
    i++;
    if (i < steps.length) setTimeout(tick, 280 + Math.random() * 150);
    else setTimeout(() => { const d = $('#ldx'); if (d && d.classList) d.classList.add('out'); setTimeout(done, d && d.classList ? 280 : 0); }, Math.max(380, 1500 - (Date.now() - t0)));
  };
  setTimeout(tick, 320);
}
function vLoading() {
  const L = UI.load || { title: '', t: '', p: 0 };
  return typeof vLoadScreen === 'function' ? vLoadScreen(L, L.kick) : `<div class="splash"><h2 class="logo sm">${esc(L.title)}</h2><span id="lt">${esc(L.t)}</span><span id="lp"></span></div>`;
}

// ---------- Menu principal ----------
function lastSlot() { const m = slotsMeta(); let best = null; for (const k in m) if (!m[k].over && (!best || (m[k].ts || 0) > (m[best].ts || 0))) best = k; return best; }
function vMenu() {
  const ls = lastSlot(), m = slotsMeta(), cur = S && !S.over;
  const cont = cur ? { name: pName(), club: S.club.n, date: fmtShort(today()), age: S.p.age } : ls ? m[ls] : null;
  const item = (a, v, ic, t, d, cls) => `<button class="mitem ${cls || ''}" data-a="${a}" data-v="${v || ''}">${icon(ic)}<span class="grow"><b>${t}</b>${d ? `<span>${d}</span>` : ''}</span><span class="chev">›</span></button>`;
  return `<div class="menu">
    <div class="menu-hd"><div class="lbl">Saison 2026-27</div><h1 class="logo">Crampons<span>d'Or</span></h1></div>
    ${cont ? `<button class="continue" data-a="continue"><span class="lbl">Continuer</span><b>${esc(cont.name)}</b><span class="note">${esc(cont.club)} · ${cont.age} ans · ${esc(cont.date)}</span><span class="go">${icon('play')}</span></button>` : ''}
    <nav class="mlist">
      ${item('newCareer', '', 'star', 'Nouvelle carrière', 'Commence à 14 ans dans le club de ta ville')}
      ${item('page', 'saves', 'save', 'Sauvegardes', typeof onlOn === 'function' && onlOn() ? '3 emplacements · sauvegarde en ligne' : '3 emplacements · code à exporter')}
      ${typeof vShop === 'function' ? item('page', 'shop', 'star', 'Boutique', `${fnum(shopW().bal)} Pépites · crampons, ballons, célébrations`, 'shopit') : ''}
      ${typeof onlOn === 'function' && onlOn() ? item('page', 'ranks', 'medal', 'Classement mondial', 'Les plus grandes carrières des joueurs') : ''}
      ${item('page', 'help', 'help', 'Comment jouer', 'Les bases en 2 minutes')}
      ${item('page', 'options', 'gear', 'Options', 'Matchs en direct, vitesse')}
      ${item('page', 'credits', 'book', 'Données & crédits', 'Ce qui est réel, ce qui est simulé')}
    </nav>
    <p class="note center">${TOP.length} championnats + ${LEAGUES.length - TOP.length} deuxièmes divisions · ${Object.keys(NATIONS).length} sélections</p>
    <p class="note center ver">Version ${typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : 'dev'}</p>
  </div>`;
}
function vMenuPage() {
  const t = { saves: 'Sauvegardes', help: 'Comment jouer', options: 'Options', credits: 'Données & crédits', ranks: 'Classement mondial', shop: 'Boutique' }[UI.page];
  const f = { saves: vSaves, help: vHelp, options: vOptions, credits: vCredits, ranks: typeof vRanks === 'function' ? vRanks : () => '', shop: typeof vShop === 'function' ? vShop : () => '' }[UI.page];
  return `<div class="subhd"><button class="backb" data-a="toMenu" aria-label="Retour">${icon('back')}</button><h2>${t}</h2></div><main class="stack scroll">${f()}</main>`;
}

// ---------- Création de carrière ----------
const POS_D = { GB: 'Dernier rempart : réflexes, placement, sang-froid.', DC: 'Le patron de la défense : duels et jeu de tête.', DL: 'Tout le couloir : défendre puis centrer.', MDC: 'La sentinelle : récupère et relance.', MC: 'Le métronome : passes et endurance.', MOC: 'Le créateur : dernière passe et frappe.', AIL: 'Vitesse et dribbles sur le côté.', BU: 'Le finisseur : il vit pour marquer.' };
const WIZ = ['Identité', 'Origines', 'Poste', 'Famille & défi'];
function vCreate() {
  const c = UI.create, st = UI.step;
  const dots = `<div class="wiz">${WIZ.map((n, i) => `<div class="wz ${i < st ? 'done' : i === st ? 'on' : ''}"><i>${i + 1}</i><span>${n}</span></div>`).join('')}</div>`;
  let body = '';
  if (st === 0) body = `<h2>Qui es-tu ?</h2>
    <div class="row"><div class="field grow"><label class="lbl" for="cFirst">Prénom</label><input id="cFirst" maxlength="16" value="${esc(c.first)}" placeholder="Prénom" autocomplete="off" autocapitalize="words"></div><div class="field grow"><label class="lbl" for="cLast">Nom</label><input id="cLast" maxlength="18" value="${esc(c.last)}" placeholder="Nom" autocomplete="off" autocapitalize="words"></div></div>
    <div class="field"><span class="lbl">Numéro de maillot préféré</span><div class="nums">${[1, 4, 5, 7, 8, 9, 10, 11, 17, 19, 23, 99].map(n => `<button data-a="cNum" data-v="${n}" class="${c.num === n ? 'on' : ''}">${n}</button>`).join('')}</div><span class="note">Tu le demanderas en signant pro… s'il est libre.</span></div>
    <div class="field"><span class="lbl">Pied fort</span><div class="seg">${['Droit', 'Gauche'].map(f => `<button data-a="cFoot" data-v="${f}" class="${c.foot === f ? 'on' : ''}">${f}</button>`).join('')}</div></div>`;
  else if (st === 1) { const N = NATIONS[c.nat]; body = `<h2>D'où viens-tu ?</h2>
    <div class="natgrid">${Object.keys(NATIONS).map(k => `<button data-a="cNat" data-v="${k}" class="${c.nat === k ? 'on' : ''}"><b>${k}</b><span>${NATIONS[k].n}</span></button>`).join('')}</div>
    <div class="card flat"><dl class="kv"><dt>Sélectionneur</dt><dd>${N.coach}</dd><dt>Championnat national</dt><dd>${NAT_LEAGUE[c.nat] ? L_BY(NAT_LEAGUE[c.nat]).name : 'À l\'étranger'}</dd></dl></div>
    <div class="field"><span class="lbl">Ville natale</span><div class="chipsel">${N.cities.map(x => `<button data-a="cCity" data-v="${esc(x)}" class="${x === c.city ? 'on' : ''}">${esc(x)}</button>`).join('')}</div></div>`; }
  else if (st === 2) body = `<h2>Ton poste</h2><div class="poslist">${Object.keys(POS_N).map(k => `<button data-a="cPos" data-v="${k}" class="${c.pos === k ? 'on' : ''}"><span class="pk">${k}</span><span class="grow"><b>${POS_N[k]}</b><span>${POS_D[k]}</span><span class="keys">${Object.entries(POSW[k]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([a]) => ATTR_N[a]).join(' · ')}</span></span></button>`).join('')}</div>`;
  else body = `<h2>Ta famille</h2>
    <div class="fam">${[[0, 'Modeste', 'Chaque billet de train compte. Tes parents devront se sacrifier.'], [1, 'Classe moyenne', 'Un peu d\'aide pour les essais et le matériel.'], [2, 'Aisée', 'Des moyens pour voyager et t\'équiper.']].map(([k, n, d]) => `<button data-a="cFam" data-v="${k}" class="${c.fam === k ? 'on' : ''}"><b>${n}</b><span>${d}</span></button>`).join('')}</div>
    <button class="btn sm ghost" data-a="cFam" data-v="rnd">Laisser le destin choisir</button>
    <h3 style="margin-top:6px">Difficulté</h3><div class="difs">${DIFF.map((d, i) => `<button data-a="cDiff" data-v="${i}" class="${c.diff === i ? 'on' : ''}"><b>${d.n}</b><span>${d.d}</span></button>`).join('')}</div>
    <div class="field"><span class="lbl">Vie sentimentale : tu pourras rencontrer</span><div class="seg"><button data-a="cPref" data-v="F" class="${c.pref === 'F' ? 'on' : ''}">Une femme</button><button data-a="cPref" data-v="M" class="${c.pref === 'M' ? 'on' : ''}">Un homme</button></div></div>`;
  return `<div class="create">${dots}<div class="stack">${body}</div>
    <div class="wizbar"><button class="btn ghost" data-a="wizBack">${st === 0 ? 'Menu' : 'Retour'}</button><button class="btn pri grow" data-a="wizNext">${st === 3 ? 'Lancer la carrière' : 'Suivant'}</button></div></div>`;
}
function vIntro() {
  const p = S.p, N = nation(), f = S.fam;
  const famTxt = ['Chez toi, on compte chaque euro. Le frigo est souvent à moitié vide, mais jamais les encouragements.', 'Tes parents travaillent dur. Il y a de quoi vivre, pas de quoi rêver trop grand… sauf toi.', 'Tes parents ont les moyens. Ils veulent surtout que tu restes humble et que tu bosses.'][f.w];
  const lines = [`<div class="lbl acc">${cap(fmtDay(today()))}</div>`, `<h2 class="logo sm">${esc(p.city)}</h2>`, `<p><b>${esc(p.first)} ${esc(p.last)}</b>, 14 ans. ${POS_N[p.pos]}, pied ${p.foot.toLowerCase()}. Nationalité : ${N.n}.</p>`, `<p>${famTxt} Ton père, ${esc(f.dad.n.split(' ')[0])}, et ta mère, ${esc(f.mom.n.split(' ')[0])}, croient en toi plus que tout.</p>`, `<p>Ce soir, premier entraînement avec les U15 de <b>${esc(S.club.n)}</b>. Ton coach s'appelle ${esc(S.coach.n)}.</p>`, `<p>Le rêve : un centre de formation, un premier contrat pro, les grands stades… et un jour, le Ballon d'Or.</p>`];
  return `<div class="intro">${lines.map((l, i) => `<div class="fadein" style="animation-delay:${.25 + i * .55}s">${l}</div>`).join('')}<button class="btn pri wide fadein" style="animation-delay:${.4 + lines.length * .55}s" data-a="introGo">Commencer ma carrière</button></div>`;
}

// ---------- Jeu : barre du haut et navigation ----------
// Coque de l'appli (plein écran, sans défilement de page) : en-tête fixe, contenu au milieu, bouton principal toujours visible, navigation en bas
function vGame() {
  if (UI.sub) { const [hd, body] = vSubParts(); return hd + `<main class="stack scroll">${body}</main>`; }
  const body = ({ home: isCoach() ? vHomeCoach : vHome, agenda: isCoach() ? vAgendaCoach : vAgenda, career: () => vTiles('career'), life: () => vTiles('life'), profile: () => vTiles('profile') })[UI.tab]();
  return vTop() + `<main class="stack scroll">${body}</main>` + (UI.tab === 'home' || UI.tab === 'agenda' ? vActBar() : '');
}
const segTabs = (act, cur, items) => `<div class="seg subtabs">${items.map(([k, n]) => `<button data-a="${act}" data-v="${k}" class="${cur === k ? 'on' : ''}">${n}</button>`).join('')}</div>`;
// le bouton pour avancer dans le temps : toujours à portée de pouce
function vActBar() {
  const fx = fixturesOn(S.day), coach = isCoach(), c = myClub();
  return `<div class="actbar"><button class="btn pri grow" data-a="next">${fx.length ? (coach ? 'Diriger le match' : 'Jouer le match') : 'Jour suivant'} ${icon('play')}</button><button class="btn sq" data-a="nextMatch" ${fx.length || (coach && !c) ? 'disabled' : ''} aria-label="Avancer jusqu'au prochain match">${icon('next')}<span>Match</span></button><button class="btn sq" data-a="advMore" aria-label="Avancer plus loin">${icon('ff')}<span>Plus</span></button></div>`;
}
function vTop() {
  const n = unread();
  return `<header class="top"><div class="when"><b>${shortDate(today())}</b><span>Sem. ${S.week} · Saison ${seasonLabel(S.season)}</span></div><div class="cash num" data-cnt="${Math.round(S.p.money)}" data-ck="cash" data-fmt="eur">${eur(S.p.money)}</div><button class="bell" data-a="open" data-v="settings" aria-label="Réglages">${icon('gear')}</button><button class="bell" data-a="open" data-v="inbox" aria-label="Messages${n ? ', ' + n + ' non lus' : ''}">${icon('bell')}${n ? `<span class="cnt">${n > 9 ? '9+' : n}</span>` : ''}</button></header>`;
}
function vNav() {
  const t = [['home', 'Accueil', 'home'], ['agenda', 'Agenda', 'cal'], ['career', 'Carrière', 'trophy'], ['life', 'Vie', 'heart'], ['profile', 'Profil', 'user']];
  return `<div class="in">${t.map(([k, n, ic]) => `<button data-a="tab" data-v="${k}" class="${UI.tab === k ? 'on' : ''}" aria-label="${n}">${icon(ic)}${n}${k === 'career' && S.offers.length ? '<span class="dot"></span>' : ''}</button>`).join('')}</div>`;
}

// ---------- Frise de la semaine ----------
function shortAct(a) {
  if (!a || !actAllowed(a)) return ['Libre', 'rest'];
  if (a.k === 'train') return [{ POSTE: 'Poste', TECH: 'Technique', PHYS: 'Physique', VIT: 'Vitesse', PASS: 'Passes', SHOT: 'Finition', DEF: 'Défense', GK: 'Gardien', MENT: 'Mental' }[a.s], 'train', a.i];
  if (a.k === 'job') return ['Boulot', 'job'];
  return [{ rest: 'Repos', free: 'Libre', family: 'Famille', friends: 'Amis', date: 'Rendez-vous', drive: 'Conduite', study: 'Révisions' }[a.k] || '?', a.k === 'rest' || a.k === 'free' ? 'rest' : 'life'];
}
function compShort(job) {
  if (job.k === 'league') return L_BY(job.lid).tier === 2 ? L_BY(job.lid).name.replace('Segunda División', 'Segunda').replace('Championship', 'Champ.') : L_BY(job.lid).name.replace('Premier League', 'Premier L.').replace('Saudi Pro League', 'Saudi PL').replace('Liga Portugal', 'Liga').replace('Bundesliga', 'Bundes.');
  if (job.k === 'cup') return 'Coupe';
  if (job.k === 'uclp' || job.k === 'ko') return job.conf && job.conf !== 'UEFA' ? 'Continent.' : 'LDC';
  if (job.k === 'youth') return youthCat();
  if (job.k === 'intl') return job.lvl === 'A' ? 'Sélection' : job.lvl;
  if (job.k === 'tour') return 'Tournoi';
  return 'Match';
}
function vFrise() {
  const A = UI.anim, sameWeek = A && A.w === S.week, slide = A && A.w !== S.week;
  const cells = [];
  for (let d = 0; d < 7; d++) {
    const date = dateAt(S.season, S.week, d), past = d < S.day, now = d === S.day;
    let top = '', cls = '';
    if (past) {
      const lg = S.weekLog.find(l => l.dow === d);
      const m = lg && lg.matches.find(x => x.kind !== 'reserve') || (lg && lg.matches[0]);
      if (m) { const r = logRes(m); top = `<span class="res r${r}">${r} ${m.hg}-${m.ag}</span>`; cls = 'match'; }
      else { const [t] = isCoach() ? [S.club.id && d < 6 ? FOCUS[S.mgr.focus][0] : 'Repos'] : shortAct(lg ? lg.act : S.plan[d]); top = `<span class="act">${t}</span>`; }
      cls += ' past';
    } else {
      const fx = fixturesOn(d);
      if (fx.length) { top = `<span class="mt">${esc(compShort(fx[0]))}</span>`; cls = 'match'; }
      else if (isCoach()) top = `<span class="act k-train">${S.club.id && d < 6 ? FOCUS[S.mgr.focus][0] : 'Repos'}</span>`;
      else { const [t, k, i] = shortAct(S.plan[d]); top = `<span class="act k-${k}">${t}${i ? `<i class="int int-${i}"></i>` : ''}</span>`; }
    }
    if (now) cls += ' today';
    if (sameWeek && d === A.d) cls += ' stamp';
    if (sameWeek && now) cls += ' arrive';
    cells.push(`<button class="fd ${cls}" data-a="editDay" data-v="${d}"><span class="dn">${DAYS_S[d]}</span><span class="dd">${date.getDate()}</span>${top}</button>`);
  }
  const fromP = sameWeek ? (A.d / 7 * 100) : 0, toP = S.day / 7 * 100;
  return `<div class="frise ${slide ? 'slide' : ''}"><div class="track"><i style="--from:${fromP}%;--to:${toP}%;width:${toP}%" class="${sameWeek ? 'grow' : ''}"></i></div><div class="fds">${cells.join('')}</div></div>`;
}

// ---------- Accueil ----------
function roleLabel() { return S.club.kind === 'coach' ? 'Entraîneur' : S.club.kind === 'pro' ? S.club.role : S.club.kind === 'academy' ? 'Centre de formation' : S.club.free ? 'Sans club' : 'Amateur · ' + youthCat(); }
function vHome() {
  const p = S.p, c = myClub(), o = OVR(), d0 = today();
  const fx = fixturesOn(S.day);
  const alerts = [];
  if (S.offers.length) alerts.push(`<button class="alert acc" data-a="open" data-v="transfers">${icon('swap')}<span class="grow"><b>${S.offers.length} offre${S.offers.length > 1 ? 's' : ''} sur la table</b><span>Négocie dans Transferts</span></span><span class="chev">›</span></button>`);
  if (p.inj > 0) alerts.push(`<div class="alert bad">${icon('heart')}<span class="grow"><b>Blessé : ${esc(p.injName.toLowerCase())}</b><span>Encore ${p.inj} jour${p.inj > 1 ? 's' : ''} d'absence</span></span></div>`);
  if (p.energy < 25 && p.inj <= 0) alerts.push(`<button class="alert bad" data-a="tab" data-v="agenda">${icon('watch')}<span class="grow"><b>Énergie basse (${Math.round(p.energy)})</b><span>Risque de blessure : prévois du repos dans l'agenda</span></span><span class="chev">›</span></button>`);
  if (S.susp > 0 && S.club.kind === 'pro') alerts.push(`<div class="alert bad">${icon('flag')}<span class="grow"><b>Suspendu</b><span>Tu manqueras ${S.susp > 1 ? 'les ' + S.susp + ' prochains matchs' : 'le prochain match'} de ton club</span></span></div>`);
  if (S.intlCall && S.day <= 3) alerts.push(`<div class="alert">${icon('flag')}<span class="grow"><b>Convoqué ${S.intlCall === 'A' ? 'en équipe nationale' : 'en ' + S.intlCall}</b><span>Matchs jeudi et dimanche</span></span></div>`);
  let todayCard;
  if (fx.length) todayCard = fx.map(j => { const l = fixtureLabel(j); return `<div class="matchday"><div class="lbl acc">Jour de match${l.derby ? ' · ' + esc(l.derby) : ''}</div><div class="mdt">${esc(l.txt)}</div><div class="note">${esc(l.comp)}${S.settings.live === 'all' || (S.settings.live === 'big' && (l.derby || /Ligue des champions|Coupe|Sélection|Équipe|Tournoi|Euro|Coupe du monde/.test(l.comp))) ? ' · en direct' : ''}</div></div>`; }).join('');
  else { const a = S.plan[S.day], [t] = shortAct(a), e = a ? actEnergy(a) : 4; todayCard = `<div class="row"><div class="grow"><div class="lbl">Programme du jour</div><div class="mdt">${esc(actLabel(a) === 'Rien de prévu' ? 'Journée libre' : actLabel(a))}</div><div class="note">${a && a.k === 'train' ? INTENS[a.i].n + ' · ' : ''}${e >= 0 ? '+' : ''}${e} énergie${!actAllowed(a) ? ' · indisponible, journée libre' : ''}</div></div><button class="btn sm" data-a="editDay" data-v="${S.day}">Changer</button></div>`; }
  const nx = nextMatch(), tab = UI.htab || 'today';
  if (tab === 'res') return segTabs('hTab', tab, HOME_TABS) + (S.lastDay ? vDayReport(S.lastDay) : '<p class="note center">Pas encore de résultat : joue ta première journée.</p>');
  if (tab === 'news') return segTabs('hTab', tab, HOME_TABS) + vNewsList();
  return segTabs('hTab', tab, HOME_TABS) + `
  <section class="hero compact">
    <div class="row hrow">
      ${badge(S.club.n)}
      <div class="grow hid">
        <div class="name">${esc(p.first)} ${esc(p.last)}</div>
        <div class="hsub"><span class="chip acc">${p.pos}</span>${S.club.captain ? '<span class="chip gold">C</span>' : ''}<span class="t">${p.age} ans · ${S.club.kind === 'pro' ? 'N°' + S.club.num + ' · ' : ''}${esc(S.club.n)}</span></div>
        <div class="note hrole">${esc(roleLabel())}${c ? ' · ' + L_BY(c.lid).name : ''}</div>
      </div>
      <div class="ovr"><div class="v num" data-cnt="${o}" data-ck="ovr">${o}</div><div class="hst">${stars(potStars())}</div></div>
    </div>
    <div class="gauges">${gauge('Énergie', p.energy, p.energy < 30 ? 'bad' : 'ok')}${gauge('Moral', p.moral, 'info')}${gauge('Forme', p.forme)}</div>
  </section>
  ${typeof shopW === 'function' ? `<button class="pepbar" data-a="open" data-v="shop"><i class="pep"></i><b data-cnt="${shopW().bal}" data-ck="pep" data-fmt="n">${fnum(shopW().bal)}</b><span class="grow">Pépites · Boutique</span>${shopDailyOk() ? '<span class="pepnew">Bonus du jour</span>' : ''}<span class="chev">›</span></button>` : ''}
  ${alerts.slice(0, 2).join('')}${alerts.length > 2 ? `<p class="note">+ ${alerts.length - 2} autre${alerts.length > 3 ? 's' : ''} alerte${alerts.length > 3 ? 's' : ''}</p>` : ''}
  <section class="card sec">
    <div class="hd"><h3>${cap(MONTHS[d0.getMonth()])} ${d0.getFullYear()}</h3><span class="note">Semaine ${S.week}${WINTER(S.week) || SUMMER(S.week) ? ' · mercato ouvert' : ''}</span></div>
    ${vFrise()}
    <div class="today">${todayCard}</div>
    ${nx ? `<div class="note">Prochain match : <b>${esc(nx)}</b></div>` : ''}
  </section>
  ${vGoalsMini()}`;
}
const HOME_TABS = [['today', 'Aujourd\'hui'], ['res', 'Résultats'], ['news', 'Actus']];
function vNewsList() { return `<div class="card list news">${S.news.slice(0, 12).map(n => `<div class="it" style="display:block"><div class="t">${esc(n.t)} · <span class="dim">${n.d}</span></div><div>${esc(n.x)}</div></div>`).join('')}</div><button class="btn wide" data-a="open" data-v="world">Toute l'actualité du foot</button>`; }
// objectifs en une ligne (le détail est dans Carrière › Objectifs)
function vGoalsMini() {
  const O = S.obj, ch = S.chal; if ((!O || !O.list.length) && !ch) return '';
  const ok = O && O.list.length ? O.list.filter(objMet).length : 0;
  return `<button class="alert" data-a="open" data-v="goals">${icon('target')}<span class="grow"><b>Objectifs : ${O && O.list.length ? ok + ' / ' + O.list.length + ' en bonne voie' : 'saison en cours'}</b>${ch ? `<span>Défi : ${esc(ch.t)} · ${ch.done ? 'réussi !' : chalProg() + '/' + ch.target}</span>` : ''}</span><span class="chev">›</span></button>`;
}
function nextMatch() {
  for (let d = S.day + 1; d < 7; d++) { const f = fixturesOn(d); if (f.length) { const l = fixtureLabel(f[0]); return `${DAYS[d].toLowerCase()} · ${l.txt}`; } }
  const up = upcoming(1)[0]; return up ? `${shortDate(up.date)} · ${up.t}` : null;
}
function upcoming(n) {
  const out = [];
  for (let w = S.week + 1; w <= 52 && out.length < n; w++) for (let d = 0; d < 7 && out.length < n; d++) { const ev = dayEvents(S.season, w, d).filter(e => e.k === 'match'); for (const e of ev) out.push({ date: dateAt(S.season, w, d), t: e.t }); }
  return out;
}
function matchHtml(m, compact) {
  const r = logRes(m), p = m.p;
  let line = '';
  if (p) line = p.min > 0 ? `<span class="rt ${rtCls(p.rt)}">${dec(p.rt)}</span> <span class="note">${p.min}'${p.g ? ' · ' + p.g + ' but' + (p.g > 1 ? 's' : '') : ''}${p.a ? ' · ' + p.a + ' passe' + (p.a > 1 ? 's' : '') + ' D' : ''}${p.cs ? ' · clean sheet' : ''}</span>` : `<span class="note">${S.p.inj > 0 ? 'Blessé' : 'Pas entré en jeu'}</span>`;
  const evs = compact ? '' : `<div class="evs">${m.ev.slice(0, 8).map(e => `<div><span class="min">${e.min}'</span>${e.sc === 'P' ? '<b>Toi</b>' : e.sc ? (e.side === m.side ? '' : '<span class="dim">adv. · </span>') + esc(e.sc) : (e.side === m.side ? 'But de ton équipe' : '<span class="dim">But adverse</span>')}${e.as ? ` <span class="dim">(passe ${e.as === 'P' ? '<b>toi</b>' : esc(e.as)})</span>` : ''}</div>`).join('')}</div>`;
  return `<div class="mrow"><div class="fx"><div class="grow"><div class="comp">${esc(m.comp)}</div><div style="font-size:14px;line-height:1.25">${esc(m.h)} <span class="dim">–</span> ${esc(m.a)}</div></div><div class="score res-${r}">${m.hg}-${m.ag}</div></div>${m.pen ? `<div class="note">Tirs au but : ${m.pen === m.side ? 'victoire' : 'défaite'}</div>` : ''}${m.agg ? `<div class="note">${esc(m.agg)}</div>` : ''}<div style="margin-top:4px">${line}</div>${evs}</div>`;
}
function gainsTxt(g) { return Object.entries(g).filter(([, v]) => v >= .04).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${ATTR_N[k]} <b class="ok">+${dec(v, 2)}</b>`).join(' · '); }
function vDayReport(L) {
  const g = gainsTxt(L.gains);
  return `<section class="card sec"><div class="hd"><h3>${S.lastDay === L ? 'Hier' : ''}</h3><span class="note">${esc(L.date)}</span></div>
    ${L.matches.map(m => matchHtml(m, false)).join('')}
    ${L.lines.length ? L.lines.map(l => `<div class="note">• ${esc(l)}</div>`).join('') : ''}
    ${g ? `<div class="note">Progression : ${g}</div>` : ''}
    ${L.money ? `<div class="note">Argent : <b class="${L.money >= 0 ? 'ok' : 'bad'}">${L.money >= 0 ? '+' : ''}${eur(L.money)}</b></div>` : ''}</section>`;
}

// ---------- Agenda ----------
function projEnergy() {
  let e = S.p.energy; const out = [];
  for (let d = S.day; d < 7; d++) {
    const fx = fixturesOn(d);
    if (fx.length) e -= 13; else { const a = S.plan[d]; e += a && actAllowed(a) ? actEnergy(a) : 4; }
    e = clamp(e + 7 + (has('chef') ? 1 : 0), 0, 100); out.push(Math.round(e));
  }
  return out;
}
function vAgenda() {
  const pe = projEnergy(), low = Math.min(...pe), tab = UI.atab || 'week';
  if (tab === 'month') return segTabs('aTab', tab, AG_TABS) + vMonth();
  if (tab === 'season') return segTabs('aTab', tab, AG_TABS) + vSeasonKeys();
  const rows = [];
  for (let d = 0; d < 7; d++) {
    const date = dateAt(S.season, S.week, d), past = d < S.day, fx = past ? [] : fixturesOn(d), a = S.plan[d];
    let main, sub, cls = '';
    if (past) { const lg = S.weekLog.find(l => l.dow === d); const m = lg && lg.matches[0]; main = m ? `${m.h} ${m.hg}-${m.ag} ${m.a}` : actLabel(lg ? lg.act : a); sub = 'Passé'; cls = 'past'; }
    else if (fx.length) { const l = fixtureLabel(fx[0]); main = l.txt; sub = l.comp + (fx.length > 1 ? ' + ' + (fx.length - 1) : ''); cls = 'match'; }
    else { main = a && actAllowed(a) ? actLabel(a) : 'Journée libre'; const e = a && actAllowed(a) ? actEnergy(a) : 4; sub = (a && a.k === 'train' ? INTENS[a.i].n + ' · ' : a && a.k === 'job' ? actSub(a) + ' · ' : '') + (e >= 0 ? '+' : '') + e + ' énergie'; }
    rows.push(`<button class="arow ${cls} ${d === S.day ? 'today' : ''}" data-a="editDay" data-v="${d}"><span class="ad"><b>${DAYS_S[d]}</b><span>${date.getDate()}</span></span><span class="grow"><b>${esc(main)}</b><span class="note">${esc(sub)}</span></span>${!past ? `<span class="pe num ${pe[d - S.day] < 25 ? 'bad' : ''}">${pe[d - S.day]}</span>` : ''}</button>`);
  }
  return segTabs('aTab', tab, AG_TABS) + `<section class="sec"><div class="hd"><h3>Ma semaine</h3><span class="note">Énergie le soir</span></div>
    <div class="card list agenda">${rows.join('')}</div>
    ${low < 25 ? '<p class="note bad">Ton énergie va trop baisser : risque de blessure et de mauvaises performances. Ajoute du repos.</p>' : ''}
    <div class="presets">${[['bal', 'Équilibré'], ['max', 'Progression max'], ['rec', 'Récupération'], ['life', 'Vie perso']].map(([k, n]) => `<button class="btn sm" data-a="preset" data-v="${k}">${n}</button>`).join('')}</div>
    <p class="note">Touche un jour pour le changer : le programme se répète chaque semaine.</p></section>
`;
}
const AG_TABS = [['week', 'Semaine'], ['month', 'Calendrier'], ['season', 'Saison']];
function vSeasonKeys() { return `<section class="card sec"><div class="hd"><h3>Temps forts de la saison</h3><span class="note">${seasonLabel(S.season)}</span></div><div class="list">${seasonKeys().map(k => `<div class="it ${k.past ? 'dim' : ''}"><span class="kd">${shortDate(k.date).replace(/ \d{4}$/, '')}</span><span class="grow">${esc(k.t)}</span></div>`).join('')}</div></section>`; }
function seasonKeys() {
  const y = S.season, cur = absDay(), K = [];
  const add = (w, d, t) => K.push({ date: dateAt(y, w, d), t, past: (y - 2026) * 364 + (w - 1) * 7 + d < cur });
  add(1, 0, 'Reprise et début de la saison'); add(3, 6, 'Fermeture du mercato d\'été');
  for (const w of INTL_WEEKS) add(w, 3, 'Trêve internationale');
  add(12, 0, 'Cérémonie du Ballon d\'Or'); add(20, 0, 'Ouverture du mercato d\'hiver'); add(23, 6, 'Fermeture du mercato d\'hiver');
  add(KO.f[0], 5, 'Finale de la Ligue des champions'); add(42, 6, 'Fin de saison et bilans'); add(43, 0, 'Ouverture du mercato d\'été');
  if (S.p.age >= 16 && S.p.age <= 19 && !S.school.done) add(44, 2, 'Épreuves du bac');
  for (const T of S.W.tours || []) if (!T.done && T.inField) K.push({ date: dateFromAbs(T.start + TOUR_OFF.g[0]), t: T.name + (T.mine ? ' (tu es sélectionné)' : ''), past: false });
  return K.sort((a, b) => a.date - b.date);
}
function dayEvents(season, w, d) {
  const ev = [], p = S.p, isCur = season === S.season;
  if (!isCur || w < 1 || w > 52) return ev;
  if (w === S.week && d >= S.day) { for (const j of fixturesOn(d)) { const l = fixtureLabel(j); ev.push({ t: `${l.comp} · ${l.txt}`, k: 'match' }); } }
  else if (w > S.week) {
    if (proLike()) { if (S.club.id) {
      const c = myClub(), LG = S.W.leagues[c.lid], rs = LG.weekMap[w] || [];
      rs.forEach((r, i) => { if (leagueDays(rs.length, i)[0] !== d) return; const m = LG.rounds[r].find(x => x.includes(c.id)); if (m) ev.push({ t: `${L_BY(c.lid).name} · J${r + 1} · ${m[0] === c.id ? 'vs ' + club(m[1]).n : 'à ' + club(m[0]).n}`, k: 'match' }); });
      const U = S.W.cl.UEFA; if (contOf(c.lid) === 'UEFA' && UCL_LP.includes(w) && U.teams.includes(c.id) && d === 1) ev.push({ t: 'Ligue des champions · phase de ligue', k: 'match' });
      const cup = S.W.cups[c.cc]; if (cup.alive && CUP_WEEKS[cup.round] === w && d === 2) ev.push({ t: `${L_BY(c.lid).cup} · ${CUP_ROUNDS[cup.round]}`, k: 'match' });
    } } else if (!S.club.free && LEAGUE_WEEKS.includes(w) && d === 5) ev.push({ t: 'Championnat ' + youthCat(), k: 'match' });
  }
  if (INTL_WEEKS.includes(w) && (d === 3 || d === 6)) ev.push({ t: 'Trêve internationale', k: 'intl' });
  if (w === 12 && d === 0) ev.push({ t: 'Cérémonie du Ballon d\'Or', k: 'event' });
  if (w === 42 && d === 6) ev.push({ t: 'Fin de saison', k: 'event' });
  if ((w === 43 || w === 20) && d === 0) ev.push({ t: 'Ouverture du mercato', k: 'event' });
  if ((w === 3 || w === 23) && d === 6) ev.push({ t: 'Fermeture du mercato', k: 'event' });
  if (w === 44 && d === 2 && p.age >= 16 && p.age <= 19 && !S.school.done) ev.push({ t: 'Épreuves du bac', k: 'event' });
  if (w === p.bweek && d === 6) ev.push({ t: `Ton anniversaire (${p.age + (w >= S.week ? 1 : 0)} ans)`, k: 'bday' });
  const dt = dateAt(season, w, d), nx = new Date(dt); nx.setDate(nx.getDate() + 1);
  if (nx.getMonth() !== dt.getMonth() && (S.club.wage || S.assets.spons.length)) ev.push({ t: S.club.kind === 'academy' ? 'Versement de l\'indemnité' : 'Versement du salaire', k: 'pay' });
  return ev;
}
function locate(date) { const s0 = seasonStart(S.season), diff = Math.round((date - s0) / 864e5); if (diff < 0 || diff >= 364) return null; return { w: Math.floor(diff / 7) + 1, d: diff % 7 }; }
function vMonth() {
  const t = today(), m = new Date(t.getFullYear(), t.getMonth() + UI.calM, 1);
  const first = (m.getDay() + 6) % 7, nd = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const cells = []; for (let i = 0; i < first; i++) cells.push('<span class="cd empty"></span>');
  let sel = null;
  for (let day = 1; day <= nd; day++) {
    const dt = new Date(m.getFullYear(), m.getMonth(), day), loc = locate(dt), ev = loc ? dayEvents(S.season, loc.w, loc.d) : [];
    const isT = dt.toDateString() === t.toDateString(), past = dt < t && !isT, key = dt.toDateString();
    if (UI.calSel === key) sel = { dt, ev };
    const win = loc && (WINTER(loc.w) || SUMMER(loc.w));
    cells.push(`<button class="cd ${isT ? 'today' : ''} ${past ? 'past' : ''} ${win ? 'win' : ''} ${UI.calSel === key ? 'sel' : ''}" data-a="calSel" data-v="${key}"><span>${day}</span><i>${ev.slice(0, 3).map(e => `<b class="k-${e.k}"></b>`).join('')}</i></button>`);
  }
  if (!sel && UI.calM === 0) { const loc = locate(t); sel = { dt: t, ev: loc ? dayEvents(S.season, loc.w, loc.d) : [] }; }
  return `<section class="card sec"><div class="hd"><button class="btn sm ghost" data-a="calM" data-v="-1" aria-label="Mois précédent" ${UI.calM <= -2 ? 'disabled' : ''}>‹</button><h3>${cap(MONTHS[m.getMonth()])} ${m.getFullYear()}</h3><button class="btn sm ghost" data-a="calM" data-v="1" aria-label="Mois suivant" ${UI.calM >= 11 ? 'disabled' : ''}>›</button></div>
    <div class="calg">${DAYS_S.map(d => `<span class="cw">${d[0]}</span>`).join('')}${cells.join('')}</div>
    <div class="legend"><span><b class="k-match"></b>Match</span><span><b class="k-intl"></b>Sélection</span><span><b class="k-event"></b>Événement</span><span><b class="k-pay"></b>Salaire</span><span><i class="winsw"></i>Mercato</span></div>
    ${sel ? `<div class="calday"><div class="lbl">${cap(fmtDay(sel.dt))}</div>${sel.ev.length ? sel.ev.map(e => `<div><b class="dotk k-${e.k}"></b>${esc(e.t)}</div>`).join('') : '<div class="note">Rien de prévu.</div>'}</div>` : ''}
    ${S.club.kind === 'pro' ? '<p class="note">Les matchs de coupe et de Ligue des champions s\'ajoutent après chaque tirage au sort.</p>' : ''}</section>`;
}
const PRESETS = {
  bal: k => defaultPlan(k === 'amateur' ? 'amateur' : 'pro'),
  max: () => [{ k: 'train', s: 'POSTE', i: 'H' }, { k: 'train', s: 'TECH', i: 'N' }, { k: 'train', s: 'PHYS', i: 'N' }, { k: 'train', s: 'POSTE', i: 'H' }, { k: 'train', s: 'MENT', i: 'L' }, null, { k: 'rest' }],
  rec: () => [{ k: 'train', s: 'POSTE', i: 'L' }, { k: 'rest' }, { k: 'train', s: 'TECH', i: 'L' }, { k: 'free' }, { k: 'train', s: 'PHYS', i: 'L' }, null, { k: 'rest' }],
  life: () => [{ k: 'train', s: 'POSTE', i: 'N' }, { k: 'family' }, { k: 'train', s: 'TECH', i: 'N' }, S.love ? { k: 'date' } : { k: 'friends' }, S.p.age <= 19 && !S.school.done ? { k: 'study' } : { k: 'train', s: 'MENT', i: 'L' }, null, { k: 'rest' }],
};
function editDayHtml(d) {
  const a = S.plan[d], fx = d >= S.day ? fixturesOn(d) : [];
  const cur = JSON.stringify(a ?? null);
  const opt = (v, t, s, dis) => `<button class="opt ${cur === JSON.stringify(v) ? 'on' : ''}" data-a="setAct" data-v='${esc(JSON.stringify(v))}' ${dis ? 'disabled' : ''}><b>${t}</b><span>${s}</span></button>`;
  const styles = Object.keys(TRAIN).filter(k => k !== 'GK' || S.p.pos === 'GB');
  const life = Object.keys(ACTS).map(k => { const x = { k }; return opt(x, ACTS[k].n, (ACTS[k].e >= 0 ? '+' : '') + ACTS[k].e + ' énergie · ' + ACTS[k].d, !actAllowed(x)); });
  const jobs = S.club.kind === 'amateur' ? JOBS.map((j, i) => opt({ k: 'job', j: i }, j.n, `+${j.pay} € · ${j.e} énergie · dès ${j.age} ans`, !actAllowed({ k: 'job', j: i }))) : [];
  return `${fx.length ? `<p class="note acc">Cette semaine, ${DAYS[d].toLowerCase()} est un jour de match : l'activité choisie servira les autres semaines.</p>` : ''}
    <div class="lbl">Entraînement</div><div class="seg">${Object.keys(INTENS).map(k => `<button data-a="eInt" data-v="${k}" class="${UI.eInt === k ? 'on' : ''}">${INTENS[k].n} ${INTENS[k].e}</button>`).join('')}</div>
    <div class="opts">${styles.map(k => opt({ k: 'train', s: k, i: UI.eInt }, TRAIN[k].n, TRAIN[k].w ? Object.keys(TRAIN[k].w).map(x => ATTR_N[x]).join(', ') : 'Tous tes attributs clés')).join('')}</div>
    <div class="lbl">Repos et vie perso</div><div class="opts">${opt(null, 'Rien de prévu', '+4 énergie')}${life.join('')}</div>
    ${jobs.length ? `<div class="lbl">Petits boulots</div><div class="opts">${jobs.join('')}</div>` : ''}`;
}
