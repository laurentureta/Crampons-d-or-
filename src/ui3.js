// ===================== INTERFACE : direct, avance du temps, flux, actions =====================
// ---------- Match en direct ----------
// ---------- Avancer dans le temps ----------
const ADV_DELAY = [520, 260, 110, 0];
function renderAdv() {
  const el = $('#adv'); if (!el) return;
  const A = UI.adv;
  if (!A || A.n <= 1) { el.innerHTML = ''; return; }
  const d = today(), last = A.logs[A.logs.length - 1];
  const lastTxt = last ? (last.matches[0] ? `${last.matches[0].h} ${last.matches[0].hg}-${last.matches[0].ag} ${last.matches[0].a}` : (last.lines[0] || '')) : '';
  el.innerHTML = `<div class="advov"><div class="advbox"><div class="lbl">${A.mode === 'month' ? 'Mois en cours' : A.mode === 'match' ? 'Jusqu\'au prochain match' : 'Semaine en cours'}</div>
    <div class="page" key="${absDay()}"><span class="dw">${DAYS[(d.getDay() + 6) % 7]}</span><span class="dn">${d.getDate()}</span><span class="dm">${MONTHS[d.getMonth()]} ${d.getFullYear()}</span></div>
    ${vFrise()}
    <div class="loadbar"><i style="width:${Math.round(A.i / A.n * 100)}%"></i></div><div class="note center">${esc(lastTxt)}</div></div></div>`;
}
function daysToTarget(mode) {
  if (mode === 'week') return 7 - S.day;
  const d = today(); let n = 0; const x = new Date(d);
  do { x.setDate(x.getDate() + 1); n++; } while (x.getMonth() === d.getMonth() && n < 40);
  return n;
}
function advance(mode) {
  if (UI.adv || !S || S.over) return;
  const n = mode === 'day' ? 1 : mode === 'match' ? 70 : daysToTarget(mode);
  UI.adv = { mode, n, i: 0, logs: [] };
  const delay = n === 1 ? 0 : ADV_DELAY[S.settings.speed ?? 1];
  const step = () => {
    const A = UI.adv; if (!A) return;
    const prev = { d: S.day, w: S.week };
    let r;
    try { r = stepDay(); } catch (e) { UI.adv = null; console.error(e); toast('Erreur de simulation : ' + e.message); render(); return; }
    if (r.live) { UI.adv = null; save(); startLive(); return; }
    A.i++; if (r.log) A.logs.push(r.log);
    UI.anim = prev;
    const stop = EVQ.length || (typeof FQ !== 'undefined' && FQ.q.length) || (typeof MQ !== 'undefined' && MQ.q.length) || S.trial || S.over || S.pendingNum || (r.log && r.log.injured) || A.i >= A.n || (A.mode === 'match' && fixturesOn(S.day).length > 0);
    if (stop) { finishAdvance(); return; }
    if (delay) { render(); setTimeout(step, delay); } else step();
  };
  if (n > 1 && delay) render();
  step();
}
function finishAdvance() {
  const A = UI.adv; UI.adv = null; save();
  render();
  if (!A) return flow();
  const logs = A.logs;
  const matches = logs.flatMap(l => l.matches);
  if (logs.length > 1) {
    const gains = {}; let money = 0; const lines = [];
    for (const l of logs) { for (const k in l.gains) gains[k] = (gains[k] || 0) + l.gains[k]; money += l.money || 0; for (const x of l.lines) if (!/^Entraînement|^Repos complet|^Journée en famille|^Sortie avec|^Révisions/.test(x)) lines.push(x); }
    const g = gainsTxt(gains);
    openModal({ kicker: logs.length + ' jours', title: `Du ${dayMonth(dateFromLog(logs[0]))} au ${dayMonth(dateFromLog(logs[logs.length - 1]))}`, html: `${matches.length ? matches.map(m => matchHtml(m, true)).join('') : '<p class="note">Pas de match sur la période.</p>'}${g ? `<p class="note">Progression : ${g}</p>` : ''}<p class="note">Argent : <b class="${money >= 0 ? 'ok' : 'bad'}">${money >= 0 ? '+' : ''}${eur(money)}</b> · Énergie : ${Math.round(S.p.energy)}</p>${lines.slice(0, 8).map(x => `<div class="note">• ${esc(x)}</div>`).join('')}`, btns: [{ t: 'Continuer', cls: 'pri', fn: flow }] });
  } else if (matches.length) {
    openModal({ kicker: logs[0].date, title: 'Résultat', html: matches.map(m => matchHtml(m, false)).join('') + logs[0].lines.map(x => `<div class="note">• ${esc(x)}</div>`).join(''), btns: [{ t: 'Continuer', cls: 'pri', fn: flow }] });
  } else flow();
}
function dateFromLog(l) { const m = l.date.match(/(\d+) (\S+) (\d{4})$/); return m ? new Date(+m[3], MONTHS.indexOf(m[2]), +m[1]) : today(); }

// ---------- Flux d'événements ----------
function flow() {
  if (!S) return;
  if (S.live) return startLive();
  if (S.over) { closeModal(); render(); return; }
  if (S.trial) return trialModal();
  if (typeof MQ !== 'undefined' && MQ.q.length) {
    // annonce de transfert d'abord, puis le choix du numéro, le maillot, et le récap après les fêtes de trophées
    const i = MQ.q.findIndex(m => m.k === 'hwg' || (!S.pendingNum && (m.k !== 'recap' || !(typeof FQ !== 'undefined' && FQ.q.length))));
    if (i >= 0) { const m = MQ.q.splice(i, 1)[0]; if (mqOk()) { closeModal(); if (mqPlay(m, flow)) return; } return flow(); }
  }
  if (S.pendingNum) return numberModal();
  if (typeof FQ !== 'undefined' && FQ.q.length) { const f = FQ.q.shift(); if (feteOk()) { closeModal(); return fetePlay(f, flow); } return flow(); }
  if (EVQ.length) {
    const e = EVQ.shift();
    openModal({ kicker: e.kind === 'press' ? 'Médias' : e.kind === 'month' ? 'Fin du mois' : dateStr(), title: e.title, html: e.text, cls: (e.kind === 'month' ? 'month ' : '') + 'evc', btns: e.ch.map((c, i) => ({ t: c.t, cls: i === 0 ? 'pri' : '', fn: () => { const r = c.f(); save(); if (r) openModal({ title: e.title, html: `<p>${esc(r)}</p>`, btns: [{ t: 'Continuer', cls: 'pri', fn: flow }] }); else flow(); } })) });
    return;
  }
  closeModal(); render();
  const tt = (S.toasts || []).splice(0); if (S.newAch && S.newAch.length) { tt.push('Succès débloqué : ' + S.newAch.join(', ')); S.newAch = []; }
  if (typeof shopToast === 'function') { const st = shopToast(); if (st) tt.push(st); }
  if (tt.length) toast(tt.join(' · '));
}
function numberModal() {
  const c = myClub(); if (!c) { S.pendingNum = false; return flow(); }
  const taken = new Set(); let h = hueOf(c.n);
  while (taken.size < 14) { h = (h * 37 + 11) % 997; const n = h % 40 + 1; if (n !== S.p.favNum || taken.size > 10) taken.add(n); }
  const fav = !taken.has(S.p.favNum);
  openModal({ kicker: c.n, title: 'Ton numéro', html: `<p>${fav ? `Bonne nouvelle : le <b>${S.p.favNum}</b>, ton numéro préféré, est libre.` : `Ton numéro préféré (${S.p.favNum}) est déjà pris.`} Choisis ton maillot.</p><div class="numgrid">${Array.from({ length: 99 }, (_, i) => i + 1).map(n => `<button data-a="pickNum" data-v="${n}" class="${n === S.p.favNum ? 'fav' : ''}" ${taken.has(n) ? 'disabled' : ''}>${n}</button>`).join('')}</div>`, btns: [] });
}
function trialModal(fb) {
  const T = S.trial, c = club(T.cid);
  if (T.step < 3) {
    const m = T.moments[T.step] === 'GK' ? GK_MOMENT : TRIAL_MOMENTS[T.moments[T.step]];
    openModal({ kicker: 'Essai · moment ' + (T.step + 1) + ' sur 3', title: c.n, html: `${fb ? `<p>${fb}</p>` : `<p class="note">${esc(T.tr.n)}${T.tr.fat < 0 ? ' : voyage fatigant.' : '.'} Les recruteurs t'observent.</p>`}<p class="q">${esc(m.q)}</p>`, btns: m.o.map((o, i) => ({ t: o[0], fn: () => { const r = trialAnswer(i); trialModal(`<span class="${r.ok ? 'ok' : 'bad'}">${esc(r.txt)}</span>`); } })) });
    return;
  }
  if (!T.res) T.res = trialResult();
  const r = T.res, rule = joinRule(r.cid);
  const end = msg => { S.trial = null; save(); if (msg) openModal({ title: c.n, html: `<p>${esc(msg)}</p>`, btns: [{ t: 'Continuer', cls: 'pri', fn: flow }] }); else flow(); };
  if (r.kind === 'no') {
    S.p.moral = clamp(S.p.moral - 8, 0, 100);
    openModal({ kicker: 'Essai', title: 'Pas retenu', html: `${fb ? `<p>${fb}</p>` : ''}<p>${esc(c.n)} ne te retient pas cette fois. Il te manque environ <b>${r.gap} point${r.gap > 1 ? 's' : ''}</b> de niveau.</p><p class="note">Continue à travailler, et retente ta chance plus tard ou dans un club plus accessible.</p>`, btns: [{ t: 'Rentrer à la maison', fn: () => end(null) }] });
    return;
  }
  const lab = r.kind === 'pro' ? `un contrat professionnel : ${eur(monthly(r.wage))} par mois pendant ${r.years} saisons` : `une place au centre de formation (indemnité de ${eur(monthly(r.wage))} par mois, logé sur place)`;
  const btns = [];
  if (rule.ok) btns.push({ t: 'Signer !', cls: 'pri', fn: () => { joinClub(r.cid, r.kind, r.wage, r.years); end(r.kind === 'pro' ? 'Tu es footballeur professionnel !' : 'Une nouvelle vie commence au centre de formation.'); } });
  else btns.push({ t: 'Ta famille déménage avec toi (2 500 €)', cls: 'pri', dis: S.p.money < 2500, fn: () => { if (familyMove(r.cid)) { joinClub(r.cid, r.kind, r.wage, r.years); end('Toute la famille fait ses valises pour ton rêve.'); } else end('Pas assez d\'argent pour déménager.'); } });
  btns.push({ t: 'Refuser', fn: () => end('Tu déclines l\'offre.') });
  openModal({ kicker: 'Essai réussi', title: c.n, html: `${fb ? `<p>${fb}</p>` : ''}<p>${esc(c.n)} te propose ${lab}.</p>${rule.ok ? '' : `<p class="note bad">${esc(rule.note)}</p>`}<p class="note">Entraîneur de l'équipe première : ${esc(c.coach)}.</p>`, btns });
}

// ---------- Carte joueur ----------
function drawCard() {
  const cv = document.createElement('canvas'); cv.width = 720; cv.height = 1000;
  const x = cv.getContext('2d'); if (!x) return null;
  const p = S.p, K = typeof shopEq === 'function' ? shopEq('card') : { b0: '#1c3529', b1: '#09130f', fr: '#ffb02e', ac: '#ffb02e', fg: '#edf4ef', mu: '#9bb2a6' }, gold = K.ac;
  const g = x.createLinearGradient(0, 0, 720, 1000); g.addColorStop(0, K.b0); g.addColorStop(1, K.b1);
  x.fillStyle = '#09130f'; x.fillRect(0, 0, 720, 1000);
  x.beginPath(); x.roundRect ? x.roundRect(30, 30, 660, 940, 40) : x.rect(30, 30, 660, 940); x.fillStyle = g; x.fill();
  // finitions de la Boutique : reflet doré, holographique, étoiles
  x.save(); x.clip();
  if (K.holo) { const h = x.createLinearGradient(0, 0, 720, 1000); ['rgba(255,80,160,.35)', 'rgba(80,200,255,.35)', 'rgba(120,255,160,.3)', 'rgba(255,230,90,.3)', 'rgba(170,110,255,.35)'].forEach((c, i, a) => h.addColorStop(i / (a.length - 1), c)); x.fillStyle = h; x.fillRect(0, 0, 720, 1000); }
  if (K.shine || K.holo) { const h = x.createLinearGradient(100, 0, 620, 1000); h.addColorStop(.35, 'rgba(255,255,255,0)'); h.addColorStop(.5, 'rgba(255,255,255,.35)'); h.addColorStop(.65, 'rgba(255,255,255,0)'); x.fillStyle = h; x.fillRect(0, 0, 720, 1000); }
  if (K.stars) { let r = 7; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280; for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(242,205,92,${.15 + rnd() * .5})`; x.beginPath(); x.arc(40 + rnd() * 640, 40 + rnd() * 920, .8 + rnd() * 2.4, 0, Math.PI * 2); x.fill(); } }
  x.restore();
  x.beginPath(); x.roundRect ? x.roundRect(30, 30, 660, 940, 40) : x.rect(30, 30, 660, 940); x.lineWidth = 6; x.strokeStyle = K.fr; x.stroke();
  x.strokeStyle = 'rgba(237,244,239,.08)'; x.lineWidth = 3; x.beginPath(); x.arc(560, 300, 200, 0, Math.PI * 2); x.stroke();
  const D = "800 {s}px 'Big Shoulders Display', 'Arial Narrow', sans-serif", B = "600 {s}px 'Barlow', sans-serif";
  const f = (t, s) => t.replace('{s}', s);
  x.fillStyle = gold; x.font = f(D, 170); x.textBaseline = 'alphabetic'; x.fillText(String(OVR()), 80, 230);
  x.fillStyle = K.fg; x.font = f(D, 64); x.fillText(p.pos, 86, 300);
  x.font = f(B, 30); x.fillStyle = K.mu; x.fillText(nation().n.toUpperCase(), 86, 345);
  x.fillText(S.club.n.toUpperCase().slice(0, 26), 86, 385);
  x.fillStyle = K.fg; x.font = f(D, 92); x.fillText(p.first.toUpperCase().slice(0, 14), 80, 520); x.fillStyle = gold; x.fillText(p.last.toUpperCase().slice(0, 14), 80, 610);
  const keys = p.pos === 'GB' ? ['GAR', 'MEN', 'PHY', 'PAS', 'VIT', 'END'] : ['VIT', 'TIR', 'PAS', 'DRI', 'DEF', 'PHY'];
  keys.forEach((k, i) => { const cx = 86 + (i % 3) * 200, cy = 700 + Math.floor(i / 3) * 90; x.fillStyle = K.fg; x.font = f(D, 64); x.fillText(String(Math.floor(p.at[k])), cx, cy); x.fillStyle = K.mu; x.font = f(B, 26); x.fillText(ATTR_N[k].slice(0, 3).toUpperCase(), cx + 80, cy - 6); });
  x.fillStyle = 'rgba(237,244,239,.15)'; x.fillRect(80, 820, 560, 2);
  x.fillStyle = K.fg; x.font = f(B, 28);
  x.fillText(`${S.stats.proApps} matchs pro · ${S.stats.proGoals} buts · ${S.intl.caps} sélections`, 80, 870);
  x.fillText(`${S.trophies.length} trophées · ${fnum(p.followers)} abonnés · ${p.age} ans`, 80, 912);
  x.fillStyle = gold; x.font = f(D, 30); x.fillText("CRAMPONS D'OR · " + seasonLabel(S.season), 80, 952);
  try { return cv.toDataURL('image/png'); } catch (e) { return null; }
}
function makeCard() {
  const go = () => { UI.cardImg = drawCard(); if (!UI.cardImg) toast('Impossible de générer l\'image ici.'); render(); };
  try { (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(go, go); } catch (e) { go(); }
}

// ---------- Navigation ----------
function openSub(v) {
  if (UI.sub) UI.stack.push({ sub: UI.sub, arg: UI.arg });
  UI.sub = v; window.scrollTo(0, 0);
  if (v === 'agent') UI.agentList = null;
  if (v === 'card') { UI.cardImg = null; makeCard(); }
  render();
}
function back() { const s = UI.stack.pop(); if (s) { UI.sub = s.sub; UI.arg = s.arg; } else UI.sub = null; window.scrollTo(0, 0); render(); }
function enterGame() { UI.screen = 'game'; UI.tab = 'home'; UI.sub = null; UI.stack = []; render(); flow(); }
function freeSlot() { const m = slotsMeta(); for (const n of [1, 2, 3]) if (!m[n]) return n; return null; }
function beginCreate(slot) { UI.slot = slot; UI.step = 0; UI.create.fam = null; UI.screen = 'create'; render(); }
function confirmM(title, html, ok, fn) { openModal({ title, html, btns: [{ t: ok, cls: 'pri', fn }, { t: 'Annuler', fn: () => { } }] }); }
function keepNames() { const f = $('#cFirst'), l = $('#cLast'); if (f) UI.create.first = f.value; if (l) UI.create.last = l.value; }

// ---------- Actions ----------
const ACT = {
  continue: () => { if (S && !S.over) return enterGame(); const n = lastSlot(); const s = n && loadSlot(n); if (!s) return toast('Sauvegarde introuvable.'); runLoading('Chargement', ['Lecture de la sauvegarde…', 'Reconstruction du monde…', 'Coup d\'envoi'], () => hydrate(s), enterGame); },
  newCareer: () => { const n = freeSlot(); if (n) return beginCreate(n); const m = slotsMeta(); openModal({ title: 'Emplacements pleins', html: '<p>Choisis la sauvegarde à remplacer.</p>', btns: [1, 2, 3].map(k => ({ t: `${k} · ${m[k].name} (${m[k].club})`, fn: () => beginCreate(k) })).concat([{ t: 'Annuler', cls: 'ghost', fn: () => { } }]) }); },
  page: v => { UI.screen = 'page'; UI.page = v; window.scrollTo(0, 0); render(); },
  toMenu: () => { UI.screen = 'menu'; render(); },
  quitMenu: () => { save(); clearInterval(UI.lt); UI.screen = 'menu'; UI.sub = null; UI.stack = []; render(); },
  loadSlot: v => { const s = loadSlot(+v); if (!s) return toast('Sauvegarde illisible.'); save(); runLoading('Chargement', ['Lecture de la sauvegarde…', 'Reconstruction du monde…', 'Coup d\'envoi'], () => hydrate(s), enterGame); },
  delSlot: v => confirmM('Supprimer ?', `<p>La sauvegarde ${v} sera définitivement effacée.</p>`, 'Supprimer', () => { deleteSlot(+v); if (S && (S.slot || 1) === +v) S = null; render(); }),
  wipe: () => confirmM('Tout effacer ?', '<p>Les trois sauvegardes seront définitivement supprimées.</p>', 'Tout effacer', () => { [1, 2, 3].forEach(deleteSlot); S = null; render(); toast('Sauvegardes effacées.'); }),
  // création
  cNum: v => { keepNames(); UI.create.num = +v; render(); },
  cFoot: v => { keepNames(); UI.create.foot = v; render(); },
  cNat: v => { UI.create.nat = v; UI.create.city = NATIONS[v].cities[0]; render(); },
  cCity: v => { UI.create.city = v; render(); },
  cPos: v => { UI.create.pos = v; render(); },
  cFam: v => { UI.create.fam = v === 'rnd' ? wpick([0, 1, 2], k => [5, 4, 1][k]) : +v; render(); },
  cDiff: v => { UI.create.diff = +v; render(); },
  cPref: v => { UI.create.pref = v; render(); },
  wizBack: () => { keepNames(); if (UI.step === 0) { UI.screen = 'menu'; render(); } else { UI.step--; render(); } },
  wizNext: () => {
    keepNames(); const c = UI.create;
    if (UI.step === 0) { const clean = s => (s || '').replace(/[<>&"'`]/g, '').trim(); c.first = clean(c.first); c.last = clean(c.last); if (!c.first || !c.last) return toast('Donne un prénom et un nom à ton joueur.'); }
    if (UI.step < 3) { UI.step++; window.scrollTo(0, 0); return render(); }
    if (c.fam === null) c.fam = wpick([0, 1, 2], k => [5, 4, 1][k]);
    runLoading('Ta carrière', ['Création du monde du football…', `Chargement de ${LEAGUES.length} championnats…`, 'Calendrier 2026-27…', 'Effectifs, entraîneurs, sélectionneurs…', 'Ta famille et ton quartier…', 'Coup d\'envoi !'], () => { newGame(c); EVQ = []; S.slot = UI.slot || 1; S.settings = { live: OPTS.live, speed: OPTS.speed, mg: OPTS.mg, interrupt: OPTS.interrupt }; save(); }, () => { UI.screen = 'intro'; render(); });
  },
  introGo: () => { UI.screen = 'game'; UI.tab = 'home'; UI.sub = null; render(); openModal({ title: 'Premiers pas', html: '<ol class="steps"><li><b>Agenda</b> : choisis tes activités pour chaque jour de la semaine (entraînement, repos, famille…).</li><li><b>Accueil</b> : passe les jours un par un, ou jusqu\'à la fin de la semaine ou du mois. La frise te montre où tu en es.</li><li><b>Matchs</b> : en direct, tu décides aux moments clés. Une bonne note attire les recruteurs.</li><li><b>Carrière</b> : essais en club, transferts, agent, sélection.</li></ol>', btns: [{ t: 'C\'est parti', cls: 'pri', fn: () => { } }] }); },
  // jeu
  tab: v => { UI.tab = v; UI.sub = null; UI.stack = []; window.scrollTo(0, 0); render(); },
  open: v => openSub(v),
  hTab: v => { UI.htab = v; render(); },
  aTab: v => { UI.atab = v; render(); },
  oTab: v => { UI.otab = v; render(); },
  advMore: () => openModal({ title: 'Avancer dans le temps', html: '<p class="note">Le temps s\'arrête tout seul aux événements importants (offres, blessures, matchs en direct…).</p>', btns: [{ t: 'Jusqu\'à la fin de la semaine', cls: 'pri', fn: () => advance('week') }, { t: 'Un mois entier', fn: () => advance('month') }, { t: 'Annuler', fn: () => { } }] }),
  back: () => back(),
  next: () => advance('day'),
  nextMatch: () => advance('match'),
  mateAct: v => { const [r, a] = v.split(':'); toast(mateAction(r, a)); save(); render(); },
  cFocus: v => { S.mgr.focus = v; save(); render(); toast('Entraînement : ' + FOCUS[v][0].toLowerCase() + '.'); },
  cTactic: v => { S.mgr.tactic = v; save(); render(); toast('Tactique par défaut : ' + TACTICS[v][0].toLowerCase() + '.'); },
  cSign: v => { const r = coachSign(v); save(); render(); toast(r); },
  cJob: v => { const j = S.mgr.jobs.find(x => x.cid === v); if (!j) return; takeCoachJob(j.cid, j.wage, j.years); save(); UI.sub = null; UI.stack = []; UI.tab = 'home'; render(); toast('Bienvenue à ' + S.club.n + ' !'); },
  endCoach: () => confirmM('Terminer ta carrière ?', '<p>Tu quittes les bancs pour de bon.</p>', 'Prendre ma retraite', () => { endCoaching(); save(); render(); }),
  mToggle: () => { auUnlock(); if (AU.playing && OPTS.music) { OPTS.music = false; auStopMusic(true); } else { OPTS.music = true; auScene(AU.scene || 'game', true); } saveOpts(); render(); },
  mNext: () => { auUnlock(); OPTS.music = true; saveOpts(); auNextTrack(); render(); },
  mPrev: () => { auUnlock(); OPTS.music = true; saveOpts(); auStartTrack(AU.cur - 1); render(); },
  mPlay: v => { auUnlock(); OPTS.music = true; saveOpts(); auStartTrack(+v); render(); },
  mShuffle: v => { OPTS.shuffle = v === '1'; saveOpts(); render(); },
  optMg: v => { if (UI.screen === 'game' && S) { S.settings.mg = v === '1'; save(); } OPTS.mg = v === '1'; saveOpts(); render(); },
  optIntro: v => { OPTS.intro = v === '1'; saveOpts(); render(); },
  optFetes: v => { OPTS.fetes = v === '1'; saveOpts(); render(); },
  optTv: v => { OPTS.tv = v === '1'; saveOpts(); render(); },
  optMotion: v => { OPTS.motion = v === '1'; saveOpts(); render(); },
  mqDemo: v => { if (typeof mqDemo === 'function') mqDemo(v); },
  feteDemo: v => { if (typeof fetePlay !== 'function' || (typeof feteOk === 'function' && !feteOk() && !(typeof navigator !== 'undefined' && navigator.webdriver))) return toast('La 3D n\'est pas disponible sur cet appareil.');
    const c = S && S.club && S.club.n ? S.club.n : 'FC Crampons', yr = S ? S.season : 2026, ss = S && typeof seasonLabel === 'function' ? seasonLabel(S.season) : '2026-27';
    fetePlay(v === 'pres' ? { k: 'pres', club: c, num: S && S.club && S.club.num || 10, until: S && S.club && S.club.until ? S.club.until + 1 : 2030 } : v === 'bdo' ? { k: 'bdo', yr, club: c } : { k: 'titre', name: 'Championnat', club: c, season: ss, list: ['Championnat'] }, null); },
  introReplay: () => { if (typeof introPlay === 'function') introPlay(true); },
  introSkip: () => { if (typeof introEnd === 'function' && INTRO.on && INTRO.r0 && performance.now() - INTRO.r0 > 300) introEnd(); },
  optInt: v => { if (UI.screen === 'game' && S) { S.settings.interrupt = v; save(); } OPTS.interrupt = v; saveOpts(); render(); },
  optMusic: v => { OPTS.music = v === '1'; saveOpts(); auUnlock(); if (!OPTS.music) auStopMusic(true); else auScene(AU.scene || 'menu', true); render(); },
  week: () => advance('week'),
  month: () => advance('month'),
  editDay: v => { if (isCoach()) return ACT.tab('agenda'); const d = +v; UI.editD = d; openModal({ kicker: cap(fmtDay(dateAt(S.season, S.week, d))), title: DAYS[d], html: editDayHtml(d), btns: [{ t: 'Fermer', fn: () => { } }] }); },
  eInt: v => { UI.eInt = v; ACT.editDay(UI.editD); },
  setAct: v => { const a = JSON.parse(v); S.plan[UI.editD] = a; save(); closeModal(); render(); toast(DAYS[UI.editD] + ' : ' + (a ? actLabel(a) : 'rien de prévu')); },
  preset: v => { S.plan = PRESETS[v](S.club.kind); save(); render(); toast('Programme appliqué.'); },
  calM: v => { UI.calM = clamp(UI.calM + +v, -2, 11); UI.calSel = null; render(); },
  calSel: v => { UI.calSel = v; render(); },
  tblL: v => { UI.tblL = v; render(); },
  trialL: v => { UI.trialL = v; render(); },
  tryClub: v => {
    const c = club(v), opts = travelOptions(v), rule = joinRule(v);
    openModal({ kicker: 'Essai', title: c.n, html: `<p>${esc(L_BY(c.lid).name)} · ${esc(c.city)} · entraîneur ${esc(c.coach)}</p>${rule.ok ? '' : `<p class="note bad">${esc(rule.note)}</p>`}<p class="note">Comment voyages-tu ? Aller-retour ${opts[0].d === 'local' ? '' : '+ 2 nuits d\'hôtel (le bus de nuit en économise une)'}${opts[0].minor ? ', parent compris' : ''}. Tu as ${eur(S.p.money)}.</p>`, btns: opts.map(o => ({ t: `${o.n} · ${eur(o.cost)}${o.fat < 0 ? ' · fatigant' : ''}`, dis: S.p.money < o.cost, fn: () => { startTrial(v, o); save(); trialModal(); } })).concat([{ t: S.p.money < opts[0].cost ? 'Pas assez d\'argent (voir Vie → Famille)' : 'Annuler', cls: 'ghost', fn: () => { } }]) });
  },
  nego: v => { const off = S.offers.find(o => o.id === v); if (!off) return; UI.nego = { id: v, t: negoStart(off), msg: null }; openSub('nego'); },
  nT: v => { const [k, x] = v.split(':'); UI.nego.t[k] = x === 'true' ? true : x === 'false' ? false : +x; UI.nego.msg = null; render(); },
  nPropose: () => {
    const off = S.offers.find(o => o.id === UI.nego.id); if (!off) return;
    const r = negoTry(off, UI.nego.t);
    if (r.ok) { const m = signOffer(off, UI.nego.t); save(); UI.sub = null; UI.stack = []; UI.tab = 'career'; render(); openModal({ title: 'Mercato', html: `<p>${esc(m)}</p>`, btns: [{ t: 'Continuer', cls: 'pri', fn: flow }] }); return; }
    if (r.end) { save(); UI.nego.msg = null; back(); toast('Le club met fin aux discussions.'); return; }
    UI.nego.t = r.counter; UI.nego.msg = 'Refusé. Le club fait une contre-proposition : elle est affichée ci-dessous.'; UI.nego.bad = true; save(); render();
  },
  nAccept: () => { const off = S.offers.find(o => o.id === UI.nego.id); if (!off) return; const m = signOffer(off, negoStart(off)); save(); UI.sub = null; UI.stack = []; render(); openModal({ title: 'Mercato', html: `<p>${esc(m)}</p>`, btns: [{ t: 'Continuer', cls: 'pri', fn: flow }] }); },
  nRefuse: () => { S.offers = S.offers.filter(o => o.id !== UI.nego.id); save(); back(); toast('Offre refusée.'); },
  offerDec: v => { S.offers = S.offers.filter(o => o.id !== v); save(); render(); toast('Offre refusée.'); },
  agentSet: v => { const a = UI.agentList[+v]; setAgent(a); save(); render(); toast(a.n + ' est ton agent.'); },
  agentFire: () => { S.agent = null; save(); render(); toast('Tu n\'as plus d\'agent.'); },
  req: () => confirmM('Demander un transfert ?', '<p>Le coach et le vestiaire vont mal le prendre, mais davantage de clubs vont se manifester au prochain mercato.</p>', 'Demander', () => { S.transferReq = true; S.coach.rel -= 12; S.mateRel -= 5; S.p.pop -= 3; addNews('Mercato', `${pName()} demande à quitter ${S.club.n}.`); save(); render(); toast('Demande envoyée. Le coach fait la tête.'); }),
  ext: () => { if (R() < .35 + S.coach.rel / 200) { renewalOffer(); save(); render(); toast('Le club te propose une prolongation : voir Transferts.'); } else { S.coach.rel -= 3; save(); render(); toast('Le club ne souhaite pas prolonger pour l\'instant.'); } },
  changeNum: () => { S.pendingNum = true; flow(); },
  pickNum: v => { S.club.num = +v; S.pendingNum = false; if (typeof mqQueue === 'function') mqQueue({ k: 'maillot', club: S.club.n, num: +v, name: S.p.last, first: S.p.first }); if (S.club.pres === 0 && typeof feteQueue === 'function') { S.club.pres = 1; feteQueue({ k: 'pres', club: S.club.n, num: +v, until: S.club.until + 1 }); } save(); closeModal(); toast('Tu porteras le numéro ' + v + '.'); flow(); },
  amateur: () => { S.club = { kind: 'amateur', id: null, n: amateurName(S.p.nat, S.p.city), wage: 0, until: 0, since: S.season, num: S.club.num }; S.coach = { n: genName(S.p.nat), rel: 60 }; S.plan = defaultPlan('amateur'); buildWeek(); buildMates(); genObjectives(); save(); render(); toast('Retour au club de ta ville.'); },
  retire: () => confirmM('Prendre ta retraite ?', '<p>Ta carrière de joueur s\'arrête ici.</p>', 'Raccrocher les crampons', () => { retire(); save(); render(); }),
  planB: () => confirmM('Arrêter le foot ?', `<p>Tu raccroches les crampons sans être passé pro.${S.school.bac ? ' Ton bac t\'ouvre d\'autres portes.' : ''}</p>`, 'Arrêter', () => { planB(); save(); render(); }),
  reconv: v => { reconvert(v); save(); if (v === 'coach') { UI.screen = 'game'; UI.tab = 'home'; UI.sub = null; UI.stack = []; } render(); flow(); },
  ask: () => { toast(askParents()); save(); render(); },
  sac: () => openModal({ title: 'Sacrifice des parents', html: '<p>Tes parents peuvent prendre des heures en plus, faire des ménages ou un crédit pour financer tes déplacements.</p><p class="note">Ça pèsera sur eux. Tu pourras les remercier un jour.</p>', btns: [{ t: 'Accepter leur aide', cls: 'pri', fn: () => { const r = sacrifice(); save(); render(); openModal({ title: 'Famille', html: `<p>${esc(r)}</p>`, btns: [{ t: 'Merci', fn: () => { } }] }); } }, { t: 'Non, je me débrouille', fn: () => { } }] }),
  buy: v => { const [c, id] = v.split(':'); const r = buy(c, id); save(); render(); if (c === 'gifts' && r && !/^Il |^Pas|^Déjà/.test(r)) openModal({ title: 'Cadeau', html: `<p>${esc(r)}</p>`, btns: [{ t: 'Continuer', fn: flow }] }); else { toast(r); flow(); } },
  sell: v => { const [c, i] = v.split(':'); toast(sell(c, +i)); save(); render(); },
  inv: v => { const [k, f] = v.split(':'); toast(invest(k, S.p.money * +f)); save(); render(); },
  wd: v => { toast(withdraw(v)); save(); render(); },
  immo: () => { toast(invest('immo', 1)); save(); render(); },
  st: v => { toast(invest('st', +v)); save(); render(); },
  serv: v => { toast(buy('serv', v)); save(); render(); },
  post: v => { toast(doPost(v)); save(); render(); },
  permis: () => { const r = permisExam(); save(); render(); openModal({ title: 'Permis de conduire', html: `<p>${esc(r)}</p>`, btns: [{ t: 'OK', fn: flow }] }); },
  marry: () => { const r = marry(); save(); render(); openModal({ title: 'Mariage', html: `<p>${esc(r)}</p>`, btns: [{ t: 'OK', fn: flow }] }); },
  breakup: () => confirmM('Rompre ?', '<p>C\'est définitif.</p>', 'Rompre', () => { toast(breakUp()); save(); render(); }),
  msg: v => { const m = S.inbox[+v]; if (!m) return; m.read = true; save(); render(); if ((m.k === 'coach' || m.k === 'offer') && typeof voOnce === 'function') voOnce(m, m.x, m.k === 'coach' ? 'C' : 'A', true); const isOffer = m.k === 'offer' && S.offers.some(o => o.id === m.ref); openModal({ kicker: m.d, title: m.t, html: m.k === 'month' ? m.x : `<p>${esc(m.x)}</p>`, cls: m.k === 'month' ? 'month' : '', btns: (isOffer ? [{ t: 'Voir l\'offre', cls: 'pri', fn: () => ACT.nego(m.ref) }] : []).concat([{ t: 'Fermer', fn: () => { } }]) }); },
  msgAll: () => { S.inbox.forEach(m => m.read = true); save(); render(); },
  card: () => { UI.cardImg = null; render(); makeCard(); },
  saveNow: () => { save(); toast('Partie sauvegardée.'); render(); },
  export: () => { const code = exportSave(); openModal({ title: 'Code de sauvegarde', html: `<p class="note">Copie ce code et garde-le (notes, message…). Importe-le dans Sauvegardes sur n'importe quel appareil.</p><textarea id="expCode" rows="6" readonly>${esc(code)}</textarea><p class="note">${fnum(code.length)} caractères</p>`, btns: [{ t: 'Copier', cls: 'pri', fn: () => { const ta = $('#expCode'); try { navigator.clipboard.writeText(code).then(() => toast('Code copié.'), () => toast('Sélectionne le texte et copie-le.')); } catch (e) { toast('Sélectionne le texte et copie-le.'); } } }, { t: 'Fermer', fn: () => { } }] }); },
  import: v => { const ta = $('#impCode'); const code = ta ? ta.value : ''; if (!code.trim()) return toast('Colle d\'abord un code.'); const err = importSave(code, +v); if (err) return toast(err); runLoading('Import', ['Lecture du code…', 'Reconstruction du monde…', 'Coup d\'envoi'], null, enterGame); },
  optLive: v => { if (UI.screen === 'game' && S) { S.settings.live = v; save(); } OPTS.live = v; saveOpts(); render(); },
  optSpeed: v => { if (UI.screen === 'game' && S) { S.settings.speed = +v; save(); } OPTS.speed = +v; saveOpts(); render(); },
  // direct
  lPress: v => { liveAnswerPress(S.live.M, +v); toast(S.live.M.pressRes); save(); render(); liveRun(); },
  lChoose: v => { if (startMg(+v, false)) { render(); return; } liveChoose(S.live.M, +v); save(); render(); liveRun(); },
  lShoot: v => { if (+v >= 0 && !S.live.M.coach && startMg(+v, true)) { render(); return; } liveShoot(S.live.M, +v < 0 ? undefined : +v); save(); sfxDrain(S.live.M); render(); },
  lHalf: v => { liveHalf(S.live.M, +v); save(); render(); liveRun(); },
  cChoose: v => { coachChoose(S.live.M, +v); save(); render(); liveRun(); },
  mgZone: v => { UI.mg.zone = +v; UI.mg.step = 'power'; UI.mg.t0 = Date.now(); render(); },
  mgShoot: () => { const G = UI.mg; if (!G || G.step !== 'power') return; const M = S.live.M, o = G.shoot ? M.shoot.o[G.i] : M.pending.o[G.i], ph = ((Date.now() - G.t0) % (2 * G.T)) / G.T, x = ph <= 1 ? ph : 2 - ph; mgFinish(mgShot(M, o, G.zone, x, G.dive)); },
  mgDive: v => { const G = UI.mg; if (!G) return; const M = S.live.M, o = G.shoot ? M.shoot.o[G.i] : M.pending.o[G.i]; mgFinish(mgSave(M, o, +v, G.sDir, (Date.now() - G.t0) / G.T)); },
  sndToggle: () => { OPTS.svol = OPTS.svol > 0 ? 0 : .8; saveOpts(); auSetVol(); render(); },
  lSpeed: v => { UI.lspeed = +v; render(); liveRun(); },
  lAuto: () => { clearInterval(UI.lt); UI.mg = null; const M = S.live.M; if (!M.eng) S.live.M = liveSetup(S.live.prep); liveAuto(S.live.M); if (S.live.M.eng) lvReset(S.live.M); if (S.live.M.sfx) S.live.M.sfx = ['whistle3']; sfxDrain(S.live.M); save(); render(); },
  lStat: () => { UI.lstat = UI.lstat ? false : 'st'; render(); },
  lSim: () => openModal({ title: 'Simuler le match ?', html: '<p class="note">Le match se termine tout de suite, au rythme du moteur. Tes moments clés sont joués pour toi, au mieux de tes qualités.</p>', btns: [{ t: 'Simuler', cls: 'pri', fn: () => { UI.gest = null; ACT.lAuto(); } }, { t: 'Continuer à jouer', fn: () => { } }] }),
  geList: () => { const M = S.live && S.live.M; if (M && M.pending) M.pending.list = true; UI.gest = null; render(); },
  optGeste: v => { OPTS.geste = v === '1'; saveOpts(); render(); },
  lStatTab: v => { UI.lstat = v === 'fd' ? 'fd' : 'st'; render(); },
  lEnd: v => { UI.lend = v; render(); },
  optRec: v => { OPTS.voixRec = v === '1'; saveOpts(); auUnlock(); render(); if (v === '1' && typeof VOIX_INDEX !== 'undefined') { const k = Object.keys(VOIX_INDEX).find(x => x.startsWith('S|')); if (k) { sayStop(); sayPush({ txt: k.slice(2), pri: 2, who: 'S' }); } } },
  optVoice: v => { OPTS.voice = v === '1'; saveOpts(); auUnlock(); if (v === '1') { sayStop(); sayPush({ txt: 'Bonjour à tous ! Ici Lo Sol, au micro.', pri: 2, who: 'S' }); sayPush({ txt: 'Et Nathalie, à ses côtés.', pri: 2, who: 'N' }); } else sayStop(); render(); },
  vTest: v => { auUnlock(); sayTest(v); },
  aivProv: v => { OPTS.aiv = v === 'eleven' ? v : 'off'; if (OPTS.aiv === 'off') { OPTS.aivS = OPTS.aivN = ''; } else if (OPTS.aivProvWas !== OPTS.aiv) { OPTS.aivS = OPTS.aivN = ''; } OPTS.aivProvWas = OPTS.aiv; AIV.dead = ''; AIV.cache.clear(); saveOpts(); render(); if (OPTS.aiv === 'eleven' && aivKey() && !(OPTS.aivEL || []).length) aivLoadEL().then(render); },
  aivSaveKey: () => { const el = document.querySelector('#aivKeyIn'), v = el ? el.value.trim() : ''; if (!v) return toast('Colle d\'abord ta clé dans le champ.'); aivSetKey(v); toast('Clé enregistrée sur ce téléphone.'); render(); if (OPTS.aiv === 'eleven') aivLoadEL().then(render); },
  aivDelKey: () => { aivSetKey(''); toast('Clé effacée.'); render(); },
  aivLoad: () => { aivLoadEL().then(ok => { if (ok) toast('Voix ElevenLabs chargées.'); render(); }); },
  aivMode: v => { OPTS.aivMode = v === 'eco' ? 'eco' : 'all'; saveOpts(); render(); },
  aivRetry: () => { AIV.dead = ''; render(); },
  pkRun: () => { auUnlock(); if (typeof pkRun === 'function') { pkRun(); setTimeout(render, 50); } },
  pkStop: () => { PK.stop = true; render(); },
  sfxGen: () => { auUnlock(); if (typeof sfxGenRun === 'function') { sfxGenRun(); setTimeout(render, 50); } },
  optChat: v => { OPTS.chat = v === 'match' ? 'match' : 'all'; saveOpts(); render(); toast(v === 'match' ? 'Commentaires : le match seulement.' : 'Commentaires : Lo Sol peut raconter sa vie.'); },
  optReplay: v => { OPTS.replay = v; saveOpts(); render(); },
  optGfx: v => { OPTS.gfx = v; if (typeof G3 !== 'undefined') { G3.lowAuto = false; G3.fail = false; } saveOpts(); render(); },
  lCam: () => { UI.lcam = !UI.lcam; render(); },
  lCamSet: v => { if (!CAM_VIEWS.some(c => c[0] === v)) return; OPTS.cam = v; saveOpts(); UI.lcam = false; render(); toast(CAM_VIEWS.find(c => c[0] === v)[2]); },
  lvTap: () => lvTap(),
  lDone: () => {
    clearInterval(UI.lt); lvStop(); LV.M = null; UI.lend = 'sum'; liveEnd(); UI.screen = 'game'; UI.tab = 'home'; UI.sub = null;
    const prev = { d: S.day, w: S.week };
    const r = stepDay(); save();
    if (r.live) return startLive();
    UI.anim = prev; window.scrollTo(0, 0); render(); flow();
  },
  mbtn: v => { const b = MODAL && MODAL.btns[+v]; MODAL = null; if (b && b.fn) b.fn(); if (!MODAL) renderModal(); if (UI.screen !== 'live') render(); },
};
if (typeof ONL_ACT !== 'undefined') Object.assign(ACT, ONL_ACT);
if (typeof SHOP_ACT !== 'undefined') Object.assign(ACT, SHOP_ACT);

document.addEventListener('click', e => {
  if (!AU.unlocked) auUnlock();
  const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
  const f = ACT[b.dataset.a]; if (f) { e.preventDefault(); try { f(b.dataset.v, b); } catch (err) { console.error(err); toast('Oups : ' + err.message); } }
});
document.addEventListener('pointerdown', chartHover);
document.addEventListener('pointermove', chartHover);
document.addEventListener('change', e => { if (['aivS', 'aivN', 'aivM'].includes(e.target.id)) { OPTS[e.target.id] = e.target.value; saveOpts(); AIV.cache.clear(); auUnlock(); if (e.target.id !== 'aivM') sayTest(e.target.id === 'aivN' ? 'N' : 'S'); return; } if (e.target.id === 'vS' || e.target.id === 'vN') { OPTS[e.target.id === 'vS' ? 'v1' : 'v2'] = e.target.value; saveOpts(); auUnlock(); sayTest(e.target.id === 'vS' ? 'S' : 'N'); } });
document.addEventListener('input', e => { if (e.target.id === 'mvol' || e.target.id === 'svol') { OPTS[e.target.id] = +e.target.value; saveOpts(); auUnlock(); auSetVol(); const lb = e.target.previousElementSibling; if (lb) lb.textContent = (e.target.id === 'mvol' ? 'Musique · ' : 'Supporters et effets · ') + Math.round(+e.target.value * 100) + ' %'; return; } if (e.target.id === 'cFirst') UI.create.first = e.target.value; if (e.target.id === 'cLast') UI.create.last = e.target.value; });

// ---------- Démarrage ----------
function start(data) {
  if (typeof shopApply === 'function') shopApply();
  if (data && data.S) { hydrate(data.S); UI.screen = data.screen === 'live' && S.live ? 'live' : 'game'; render(); if (UI.screen === 'live') liveRun(); return; }
  const go = () => { UI.screen = 'menu'; render(); if (typeof introPlay === 'function') introPlay(false); };
  if (typeof ldBootFinish === 'function' && ldBootFinish(go)) return; // l'écran de démarrage (stade de nuit) termine sa barre, puis le menu
  go();
}
if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(() => ({ S: S ? JSON.parse(JSON.stringify(S, (k, v) => k === 'ref' ? undefined : v)) : null, screen: UI.screen }));
// app installable : copie hors connexion (seulement sur un vrai site, ex. GitHub Pages)
// mises à jour : le service worker télécharge la nouvelle version en arrière-plan, on propose de l'installer
const MAJ = { w: null, go: false };
function majShow(w) {
  MAJ.w = w; if ($('#maj')) return;
  const d = document.createElement('div'); d.id = 'maj'; d.setAttribute('role', 'status');
  d.innerHTML = `<span class="grow"><b>Nouvelle version disponible</b><span>Ta carrière est sauvegardée avant la mise à jour.</span></span><button class="btn sm" data-maj="1">Mettre à jour</button><button class="majx" data-maj="0" aria-label="Plus tard">×</button>`;
  document.body.appendChild(d);
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-maj]'); if (!b) return;
  const d = $('#maj'); if (d) d.remove();
  if (b.dataset.maj !== '1' || !MAJ.w) return;
  try { if (S && !S.over && typeof save === 'function') save(); } catch (er) { }
  MAJ.go = true; MAJ.w.postMessage('maj');
  setTimeout(() => location.reload(), 2500); // filet de sécurité
});
try {
  if (typeof navigator !== 'undefined' && navigator.serviceWorker && (location.protocol === 'https:' || location.hostname === 'localhost') && !/claude|anthropic/.test(location.hostname)) {
    const sw = navigator.serviceWorker, had = !!sw.controller;
    sw.addEventListener('controllerchange', () => { if (MAJ.go) location.reload(); else { const d = $('#maj'); if (d) d.remove(); } });
    sw.register('sw.js').then(reg => {
      // on ne propose la mise à jour que si elle attend vraiment (une version qui prend la main d'elle-même n'a pas besoin du bandeau)
      const offer = w => setTimeout(() => { if (w && reg.waiting === w && w.state === 'installed') majShow(w); }, 1200);
      const watch = w => { if (!w) return; w.addEventListener('statechange', () => { if (w.state === 'installed' && sw.controller) offer(w); }); };
      if (reg.waiting && had) offer(reg.waiting);
      watch(reg.installing); reg.addEventListener('updatefound', () => watch(reg.installing));
      // vérifie au retour dans l'app (iPhone : l'app reste souvent ouverte des jours)
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => { }); });
    }).catch(() => { });
  }
} catch (e) { }
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
