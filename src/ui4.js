// ===================== INTERFACE : direct v3, mini-jeux, objectifs, vestiaire, rival, talents, courbes, musique, entraîneur =====================
// ---------- Match en direct ----------
function liveClockPct(M) { const E = M.E; if (!E) return Math.min(100, (+M.min || 0) / 90 * 100); const c = M.clockAt != null ? null : E.clock; const f = LV.M === M ? lvAt(LV.pt) : null; const clk = f ? f[1] : E.clock, hf = f ? f[2] : E.half; return Math.min(100, (hf === 1 ? Math.min(clk, 2700) : clk) / 5400 * 100); }
// tableau de score compact (une seule ligne) : équipes, score, chrono, compétition
const shortTeam = n => { const s = String(n || ''); if (s.length <= 13) return s; const w = s.split(' ').filter(x => !/^(FC|AS|AC|SC|RC|OGC|SSC|CF|CD|US|SV|VfB|VfL|1\.|de|du|la|le|des)$/i.test(x)); return (w.sort((a, b) => b.length - a.length)[0] || s).slice(0, 13); };
function liveHead(M, P) {
  return `<div class="lsb"><div class="tm h">${badge(P.h.n)}<b>${esc(shortTeam(P.h.n))}</b></div><div class="mid"><div class="sc num" id="lScore">${M.hg} – ${M.ag}</div><div class="clk"><span class="num" id="lClock">${M.min}'</span>${M.derby ? ' · <span class="acc">Derby</span>' : M.rivalDuel ? ' · <span class="acc">Duel</span>' : ''}</div></div><div class="tm a"><b>${esc(shortTeam(P.a.n))}</b>${badge(P.a.n)}</div><div class="tbar"><i id="lTime" style="width:${liveClockPct(M)}%"></i></div></div>`;
}
function livePitch(M) { const b = M.E ? M.E.ball : { x: 52.5, y: 34 }; return `<svg class="lpitch" viewBox="0 0 210 136" aria-hidden="true"><rect x="0" y="0" width="210" height="136" rx="3"/><line x1="105" y1="0" x2="105" y2="136"/><circle cx="105" cy="68" r="18"/><rect x="0" y="28" width="33" height="80"/><rect x="177" y="28" width="33" height="80"/><circle id="lBall" class="lb" cx="${b.x * 2}" cy="${b.y * 2}" r="3.4"/></svg>`; }
function liveStatus(M) {
  if (M.coach) return `<span class="lst"><span class="lbl">Confiance</span><b class="num">${Math.round(S.mgr.board)}</b></span>`;
  const on = onPitch(M);
  return `<span class="lst" title="Fraîcheur"><span class="lbl" id="lOn">${M.sent ? 'Expulsé' : M.injOut ? 'Blessé' : on ? 'Fraîcheur' : M.onMin == null ? 'Banc' : 'Remplacé'}</span><span class="bar ${M.stam < 35 ? 'bad' : 'ok'}"><i id="lStam" style="width:${M.stam}%"></i></span>${M.yellow ? '<span class="card y"></span>' : ''}${M.sent ? '<span class="card r"></span>' : ''}</span>`;
}
function diffLab(pr, out) {
  if (out === 'safe') return ['d1', 'Sans risque'];
  if (out === 'goal') return pr >= .32 ? ['d1', 'Grosse occasion'] : pr >= .16 ? ['d2', 'Jouable'] : pr >= .07 ? ['d3', 'Difficile'] : ['d4', 'Tentative'];
  return pr >= .6 ? ['d1', 'Facile'] : pr >= .42 ? ['d2', 'Jouable'] : pr >= .25 ? ['d3', 'Risqué'] : ['d4', 'Très risqué'];
}
function goalSvg(v) {
  const zx = [38, 100, 162], zy = [34, 74];
  const ball = v.kind === 'shot' ? (v.wide ? { x: v.zone % 3 === 0 ? 10 : v.zone % 3 === 2 ? 190 : 100, y: v.zone < 3 ? 6 : 96 } : { x: zx[v.zone % 3], y: zy[v.zone < 3 ? 0 : 1] }) : { x: zx[v.sDir], y: 54 };
  const kx = v.kind === 'shot' ? zx[v.dive] : zx[v.dir], kRot = (v.kind === 'shot' ? v.dive : v.dir) === 0 ? -55 : (v.kind === 'shot' ? v.dive : v.dir) === 2 ? 55 : 0;
  return `<svg class="goalv" viewBox="0 0 200 100" aria-hidden="true"><rect x="8" y="8" width="184" height="90" class="net"/><path d="M8 98V8h184v90" class="post"/><g transform="translate(${kx} 66) rotate(${kRot})"><rect x="-6" y="-26" width="12" height="40" rx="6" class="keeper"/><circle cx="0" cy="-32" r="6" class="keeper"/></g><circle cx="${ball.x}" cy="${ball.y}" r="7" class="ballv"/></svg>`;
}
function vMg(M) {
  const G = UI.mg, o = G.shoot ? M.shoot.o[G.i] : M.pending.o[G.i], el = Date.now() - G.t0;
  if (G.kind === 'shot' && G.step === 'aim') return `<div class="moment mg"><div class="lbl acc">Vise · ${esc(o.t)}</div><div class="goalpick">${[0, 1, 2, 3, 4, 5].map(z => `<button data-a="mgZone" data-v="${z}" aria-label="Viser ${ZONES[z]}"><span>${['↖', '↑', '↗', '↙', '•', '↘'][z]}</span></button>`).join('')}<div class="gk-fig" aria-hidden="true"></div></div><p class="note">Coins hauts : difficiles à cadrer, mais imparables. Au centre : facile, mais le gardien y est souvent.</p></div>`;
  if (G.kind === 'shot') { const w = mgWidth(M, o, G.zone); return `<div class="moment mg"><div class="lbl acc">Frappe ${ZONES[G.zone]}</div><p class="note">Touche quand le curseur passe dans la zone verte.</p><button class="gaugebtn" data-a="mgShoot" aria-label="Frapper"><span class="z amber" style="left:${(.5 - w) * 100}%;width:${w * 200}%"></span><span class="z green" style="left:${(.5 - w / 2) * 100}%;width:${w * 100}%"></span><span class="cur" style="animation-duration:${G.T}ms;animation-delay:-${el}ms"></span></button><button class="btn pri wide" data-a="mgShoot">Frapper !</button></div>`; }
  const pre = G.preDir != null;
  return `<div class="moment mg"><div class="lbl acc">${G.shoot || o.out === 'gkpen' ? 'Penalty' : 'Arrêt'} · ${esc(o.t)}</div><p class="q">${esc(G.hint)}</p><div class="ringbox" aria-hidden="true"><span class="ring" style="animation-duration:${G.T}ms;animation-delay:-${el}ms"></span><span class="target"></span></div><p class="note center">Plonge quand le cercle touche le ballon.</p><div class="dives">${pre ? `<button class="btn pri" data-a="mgDive" data-v="${G.preDir}">Plonger ${['à gauche', 'au centre', 'à droite'][G.preDir]}</button>` : ['Gauche', 'Centre', 'Droite'].map((t, d) => `<button class="btn ${d === 1 ? '' : 'pri'}" data-a="mgDive" data-v="${d}">${t}</button>`).join('')}</div></div>`;
}
function vLiveStats(M) {
  if (!M.E) return '';
  const s = liveStats(M), L = (lab, a, b, pct) => { const t = a + b || 1; if (lab.startsWith('xG')) { a = a.toFixed(2); b = b.toFixed(2); } return `<div class="lsr"><b class="num">${a}${pct ? '%' : ''}</b><span>${lab}</span><b class="num">${b}${pct ? '%' : ''}</b><i style="--a:${Math.round(a / t * 100)}%"></i></div>`; };
  return `<div class="lstats" id="lStats">${L('Possession', s.pos[0], s.pos[1], true)}${L('Tirs', s.sh[0], s.sh[1])}${L('Tirs cadrés', s.sot[0], s.sot[1])}${L('Corners', s.cor[0], s.cor[1])}${L('Fautes', s.fo[0], s.fo[1])}${L('Passes réussies', s.pc[0], s.pc[1], true)}${L('Hors-jeu', s.off[0], s.off[1])}${s.xg ? L('xG (occasions)', s.xg[0], s.xg[1]) : ''}</div>`;
}
// Écran de match : tout tient dans l'écran (aucun défilement). Score en haut, terrain au centre,
// commentaires dessous, commandes en bas ; décisions, stats et fin de match s'ouvrent en panneau par-dessus le terrain.
function vLivePanel(M, P) {
  if (M.coach) {
    if (M.pending) return `<div class="moment"><div class="lbl acc">${M.pending.k === 'tac' ? 'Plan de jeu' : M.pending.k === 'half' ? 'Causerie' : 'Coaching'} · ${M.min}'</div><p class="q">${esc(M.pending.q)}</p><div class="opts">${M.pending.o.map((o, i) => `<button class="opt ${o.v === (M.tac || S.mgr.tactic) && M.pending.k === 'tac' ? 'on' : ''}" data-a="cChoose" data-v="${i}"><b>${esc(o.t)}</b><span>${esc(o.d || '')}</span></button>`).join('')}</div></div>`;
    if (M.shoot) return `<div class="moment"><div class="lbl acc">Tirs au but</div><p class="q">${esc(M.shoot.q)}</p><div class="opts">${M.shoot.o.map((o, i) => `<button class="opt" data-a="lShoot" data-v="${i}"><b>${esc(o.t)}</b></button>`).join('')}</div></div>`;
    if (M.done) { const mine = M.side === 'h' ? M.hg : M.ag, th = M.side === 'h' ? M.ag : M.hg, win = mine > th || (mine === th && M.pen === M.side), loss = mine < th || (mine === th && M.pen && M.pen !== M.side); return `<div class="moment end"><div class="lbl ${win ? 'ok' : loss ? 'bad' : ''}">${win ? 'Victoire' : loss ? 'Défaite' : 'Match nul'}${M.pen ? ' aux tirs au but' : ''}</div><p class="note">Le président et les supporters jugeront. Confiance actuelle : ${Math.round(S.mgr.board)} / 100.</p></div>`; }
    return '';
  }
  if (UI.mg && (M.pending || M.shoot)) return vMg(M);
  if (M.press && typeof voOnce === 'function') voOnce(M.press, M.press.q, 'J');
  if (M.half && typeof voOnce === 'function') voOnce(M.half, coachHalfLine(M), 'C');
  if (M.press) return `<div class="moment press"><div class="lbl acc">Avant-match · micro tendu</div><p class="q">${esc(M.press.q)}</p><div class="opts">${M.press.a.map((a, i) => `<button class="opt" data-a="lPress" data-v="${i}"><b>${esc(a[0])}</b></button>`).join('')}</div></div>`;
  if (M.half) return `<div class="moment press"><div class="lbl acc">Mi-temps · vestiaire</div><p class="q">${esc(M.half.q)}</p>${typeof coachHalfLine === 'function' ? `<p class="note">« ${esc(coachHalfLine(M))} »</p>` : ''}<div class="opts">${M.half.o.map((o, i) => `<button class="opt" data-a="lHalf" data-v="${i}"><b>${esc(o.t)}</b></button>`).join('')}</div></div>`;
  if (M.pending) { const m = M.pending; return `<div class="moment"><div class="lbl acc">Moment clé · ${M.min}'</div><p class="q">${esc(m.q)}</p><div class="opts">${m.o.map((o, i) => { const pr = momProb(M, o), [cl, lab] = diffLab(pr, o.out), mk = mgKind(o); return `<button class="opt" data-a="lChoose" data-v="${i}"><b>${esc(o.t)}</b><span>${o.at ? ATTR_N[o.at] + ' ' + Math.floor(S.p.at[o.at]) + ' · ' : ''}<em class="${cl}">${lab}</em> · ${Math.round(pr * 100)} %${o.card ? ' · <em class="d3">risque de carton</em>' : ''}${mk ? ' · mini-jeu' : ''}</span></button>`; }).join('')}</div></div>`; }
  if (M.shoot) return `<div class="moment"><div class="lbl acc">Tirs au but</div><p class="q">${esc(M.shoot.q)}</p>${M.shoot.auto ? `<p class="note">Tu n'es plus sur le terrain : tu regardes depuis le banc.</p><button class="btn pri wide" data-a="lShoot" data-v="-1">Voir la séance</button>` : `<div class="opts">${M.shoot.o.map((o, i) => `<button class="opt" data-a="lShoot" data-v="${i}"><b>${esc(o.t)}</b>${mgKind(o) ? '<span>mini-jeu</span>' : ''}</button>`).join('')}</div>`}</div>`;
  if (M.done) {
    const pst = liveFinal(M, P), mine = M.side === 'h' ? M.hg : M.ag, th = M.side === 'h' ? M.ag : M.hg;
    const win = mine > th || (mine === th && M.pen === M.side), loss = mine < th || (mine === th && M.pen && M.pen !== M.side), st = pst.st || {};
    return `${M.last && M.last.mg ? `<div class="moment res ${M.last.ok ? 'ok' : 'bad'}">${goalSvg(M.last.mg)}<p>${esc(M.last.txt)}</p></div>` : ''}<div class="moment end"><div class="lbl ${win ? 'ok' : loss ? 'bad' : ''}">${win ? 'Victoire' : loss ? 'Défaite' : 'Match nul'}${M.pen ? ' aux tirs au but' : ''}</div><div class="row between"><div><div class="lbl">Ta note</div><span class="rt big2 ${rtCls(pst.rt)}">${pst.min ? dec(pst.rt) : '–'}</span></div><div class="note" style="text-align:right">${pst.min}' joués${M.g ? '<br>' + M.g + ' but' + (M.g > 1 ? 's' : '') : ''}${M.a ? '<br>' + M.a + ' passe' + (M.a > 1 ? 's' : '') + ' D' : ''}${pst.min ? `<br>${st.pc}/${st.pa} passes · ${st.sh} tir${st.sh > 1 ? 's' : ''}${S.p.pos === 'GB' ? ' · ' + st.sv + ' arrêt' + (st.sv > 1 ? 's' : '') : st.tk ? ' · ' + st.tk + ' ballon' + (st.tk > 1 ? 's' : '') + ' récupéré' + (st.tk > 1 ? 's' : '') : ''}` : ''}${M.yellow && !M.sent ? '<br>Carton jaune' : ''}${M.sent ? '<br><span class="bad">Expulsé</span>' : ''}${M.injOut ? '<br><span class="bad">Blessé</span>' : ''}</div></div></div>`;
  }
  if (M.last) return `<div class="moment res ${M.last.ok ? 'ok' : 'bad'}">${M.last.mg ? goalSvg(M.last.mg) : ''}<p>${esc(M.last.txt)}</p></div>`;
  return '';
}
function vLive() {
  const L = S.live; if (!L) return '';
  const M = L.M, P = L.prep;
  const view = M.eng && !LV.off ? `<div class="lcv" data-a="lvTap"><canvas id="lCan" aria-label="Match en direct"></canvas></div>` : `<div class="lcv svg">${livePitch(M)}</div>`;
  const comBox = M.com ? `<div class="lcom" id="lCom" aria-live="polite">${vCom(M)}</div>` : '';
  const snd = `<button class="ib" data-a="sndToggle" aria-label="Son">${icon(OPTS.svol > 0 ? 'note' : 'mute')}</button>`;
  // panneau du bas (par-dessus le terrain)
  let sheet = '';
  if (M.done && M.E) {
    const tab = UI.lend || 'sum', tabs = [['sum', 'Résumé'], ['rt', 'Notes'], ['sh', 'Tirs'], ...(M.coach || !(M.onMin != null) ? [] : [['hm', 'Carte']]), ['st', 'Stats'], ['fd', 'Fil']];
    const body = tab === 'rt' ? vRatings(M) : tab === 'sh' ? vShotMap(M) : tab === 'hm' ? vHeat(M) : tab === 'st' ? vLiveStats(M) : tab === 'fd' ? `<div class="lfeed" id="lFeed">${vFeed(M, 40)}</div>` : vLivePanel(M, P);
    sheet = `<div class="lsheet tall"><div class="seg endtabs">${tabs.map(([k, n]) => `<button data-a="lEnd" data-v="${k}" class="${tab === k ? 'on' : ''}">${n}</button>`).join('')}</div><div class="shb">${body}</div><button class="btn pri wide" data-a="lDone">Continuer</button></div>`;
  } else {
    const panel = vLivePanel(M, P);
    if (panel) sheet = `<div class="lsheet${M.last && !M.pending && !M.shoot && !M.press && !M.half ? ' res' : ''}"><div class="shb">${panel}</div></div>`;
    else if (UI.lstat) { const tb = UI.lstat === 'fd' ? 'fd' : 'st'; sheet = `<div class="lsheet"><div class="row"><div class="seg grow">${[['st', 'Stats'], ['fd', 'Fil du match']].map(([k, n]) => `<button data-a="lStatTab" data-v="${k}" class="${tb === k ? 'on' : ''}">${n}</button>`).join('')}</div><button class="ib" data-a="lStat" aria-label="Fermer">${icon('close')}</button></div><div class="shb">${tb === 'st' ? vLiveStats(M) : `<div class="lfeed" id="lFeed">${vFeed(M, 40)}</div>`}</div>${!M.done ? '<button class="btn wide" data-a="lAuto">Résultat direct (finir sans regarder)</button>' : ''}</div>`; }
  }
  const cam = M.eng && !LV.off && typeof g3On === 'function' && g3On() ? `<button class="ib" data-a="lCam" aria-label="Changer de caméra">${icon('cam')}</button>` : '';
  const bar = M.done ? `<div class="lbar">${liveStatus(M)}<span class="grow"></span>${snd}</div>`
    : `<div class="lbar"><div class="seg spd">${['×1', '×2', '×4', '×8', 'Résumé'].map((t, i) => `<button data-a="lSpeed" data-v="${i}" class="${(UI.lspeed ?? 1) === i ? 'on' : ''}" aria-label="${i < 4 ? 'Vitesse ' + t : 'Temps forts seulement'}">${t}</button>`).join('')}</div>${cam}<button class="ib${UI.lstat ? ' on' : ''}" data-a="lStat" aria-label="Stats et fil du match">${icon('chart')}</button>${snd}</div>`;
  return `<div class="live lv2">${liveHead(M, P)}<div class="lstage">${view}${sheet}</div>${comBox}<div class="lfoot">${M.done ? '' : liveStatus(M)}${M.cond ? `<span class="lcond">${esc(condTxt(M.cond).replace(/ spectateurs/, ' spect.'))}</span>` : ''}</div>${bar}</div>`;
}
// boîte de commentaire : qui parle (Lo Sol / Nathalie), la réplique en cours et la précédente
function vComL(x) { const w = x.who === 'N' || x.who === 'P' ? x.who : 'S', t = x.song ? '♪ ' + String(x.txt).split('/').map(v => v.trim()).join(' ♪ ') + ' ♪' : x.txt; return `<i class="who ${w.toLowerCase()}">${typeof CM_WHO !== 'undefined' ? CM_WHO[w] : ''}</i>${esc(t)}`; }
function vCom(M) { const C = M.com || [], a = C[C.length - 1], b = C[C.length - 2]; if (!a) return ''; return `<span class="mic" aria-hidden="true">🎙</span><span class="grow"><b class="${a.pri >= 3 ? 'hot' : ''}${a.song ? ' song' : ''}">${vComL(a)}</b>${b ? `<span class="prev">${vComL(b)}</span>` : ''}</span>`; }
// ---------- Fin de match : notes, tirs, carte de chaleur ----------
const ROLE_FR = { GK: 'GB', CB: 'DC', LB: 'DG', RB: 'DD', DM: 'MDC', CM: 'MC', AM: 'MOC', LW: 'AG', RW: 'AD', ST: 'BU' }, ROLE_ORD = ['GK', 'RB', 'CB', 'LB', 'DM', 'CM', 'AM', 'RW', 'LW', 'ST'];
function vRatings(M) {
  const E = M.E, R = liveRatings(M), order = M.side === 'h' ? [0, 1] : [1, 0], best = R.find(x => x.motm);
  const col = k => R.filter(x => x.k === k).sort((a, b) => (a.min < 45) - (b.min < 45) || ROLE_ORD.indexOf(a.role) - ROLE_ORD.indexOf(b.role));
  return `${best ? `<div class="motm"><span>★</span><span class="grow">Homme du match<b>${esc(best.n)}${best.me ? ' (toi)' : ''}</b></span><b class="rt ${rtCls(best.rt)}">${dec(best.rt)}</b></div>` : ''}<div class="rtcols">${order.map(k => `<div><div class="lbl">${esc(E.T[k].n)}</div>${col(k).map(x => `<div class="rtr${x.me ? ' me' : ''}"><span class="rp">${ROLE_FR[x.role] || ''}</span><span class="grow">${esc(LN(x.n))}${x.g ? ' ' + '⚽'.repeat(Math.min(3, x.g)) : ''}${x.as ? ' <span class="note">' + x.as + ' PD</span>' : ''}${x.rc ? ' <span class="card r"></span>' : x.yc ? ' <span class="card y"></span>' : ''}${x.min < 80 ? ` <span class="note">${x.min}'</span>` : ''}</span><b class="rt ${rtCls(x.rt)}">${dec(x.rt)}</b></div>`).join('')}</div>`).join('')}</div>`;
}
function pitchSvg() { return `<rect x="0" y="0" width="105" height="68" class="pl"/><line x1="52.5" y1="0" x2="52.5" y2="68" class="pl"/><circle cx="52.5" cy="34" r="9.15" class="pl"/><rect x="0" y="13.84" width="16.5" height="40.32" class="pl"/><rect x="88.5" y="13.84" width="16.5" height="40.32" class="pl"/><rect x="0" y="24.84" width="5.5" height="18.32" class="pl"/><rect x="99.5" y="24.84" width="5.5" height="18.32" class="pl"/><rect x="-1.4" y="30.34" width="1.4" height="7.32" class="gl"/><rect x="105" y="30.34" width="1.4" height="7.32" class="gl"/>`; }
function vShotMap(M) {
  const E = M.E, h0 = M.side === 'h', xg = [0, 0];
  for (const s of E.shots || []) xg[s.k] += s.xg;
  const cH = h0 ? E.T[0].col : E.T[1].col, cA = h0 ? E.T[1].col : E.T[0].col;
  const marks = (E.shots || []).map(s => {
    const home = (s.k === 0) === h0, x = home ? s.u : PL - s.u, y = home ? s.v : PW - s.v, c = home ? cH : cA, r = (1 + Math.sqrt(s.xg) * 3.2).toFixed(2);
    const ring = s.me ? `<circle cx="${x}" cy="${y}" r="${(+r + 1).toFixed(2)}" fill="none" stroke="#f5c542" stroke-width=".5"/>` : '';
    if (s.res === 'block') return `<path d="M${x - .9} ${y - .9}l1.8 1.8m0-1.8l-1.8 1.8" stroke="${c}" stroke-width=".5" opacity=".8"/>` + ring;
    if (s.res === 'goal') return `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="#fff" stroke-width=".6"/>` + ring;
    if (s.res === 'annul') return `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#e5484d" stroke-width=".6" stroke-dasharray="1 .7"/>` + ring;
    if (s.res === 'save') return `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" fill-opacity=".35" stroke="${c}" stroke-width=".5"/>` + ring;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${c}" stroke-width=".5"/>` + ring;
  }).join('');
  return `<div class="shmap"><div class="row between"><span class="xgv" style="--c:${cH}"><b class="num">${(h0 ? xg[0] : xg[1]).toFixed(2)}</b> xG</span><span class="lbl">Carte des tirs</span><span class="xgv" style="--c:${cA}"><b class="num">${(h0 ? xg[1] : xg[0]).toFixed(2)}</b> xG</span></div><svg viewBox="-3 -2 111 72" role="img" aria-label="Carte des tirs du match">${pitchSvg()}${marks}</svg><p class="note">Plein : but · Teinté : arrêté · Vide : non cadré ou poteau · ✕ : contré · Pointillé rouge : refusé par la VAR · Cercle doré : tes tirs. Plus le rond est gros, plus l'occasion était belle (xG).</p></div>`;
}
function vHeat(M) {
  const E = M.E, hm = E.hm, W = 24, H = 16; if (!hm || !hm.some(x => x)) return '<p class="note">Pas assez de temps de jeu pour dessiner ta carte.</p>';
  const sm = new Array(W * H).fill(0); let mx = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = 0, wsum = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const wt = dx || dy ? (dx && dy ? 1 : 2) : 4; v += hm[yy * W + xx] * wt; wsum += wt; } sm[y * W + x] = v / wsum; mx = Math.max(mx, v / wsum); }
  const cw = PL / W, ch = PW / H; let cells = '';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const f = sm[y * W + x] / (mx || 1); if (f < .05) continue; cells += `<rect x="${(x * cw).toFixed(2)}" y="${(y * ch).toFixed(2)}" width="${(cw + .05).toFixed(2)}" height="${(ch + .05).toFixed(2)}" fill="hsl(${Math.round(48 - 48 * f)} 95% 55%)" fill-opacity="${(.12 + .72 * f).toFixed(2)}"/>`; }
  const me = mePlayerMe(E), st = me ? me.st : {};
  return `<div class="heat"><div class="row between"><span class="lbl">Ta carte de chaleur</span><span class="note">Sens du jeu →</span></div><svg viewBox="-3 -2 111 72" role="img" aria-label="Zones où tu as joué">${cells}${pitchSvg()}</svg><p class="note">${st.pa || 0} passes (${st.pa ? Math.round(st.pc / st.pa * 100) : 0} % réussies) · ${st.sh || 0} tir${st.sh > 1 ? 's' : ''} · ${st.drs || 0} dribble${st.drs > 1 ? 's' : ''} réussi${st.drs > 1 ? 's' : ''} · ${(st.tk || 0) + (st.int || 0)} ballon${(st.tk || 0) + (st.int || 0) > 1 ? 's' : ''} récupéré${(st.tk || 0) + (st.int || 0) > 1 ? 's' : ''}</p></div>`;
}
function vFeed(M, n) { return M.feed.slice().reverse().slice(0, n || 14).map(f => `<div class="fl k-${f.k}"><span class="min">${f.min}'</span><span>${esc(f.t)}</span></div>`).join(''); }
function liveLight() {
  const M = S.live && S.live.M; if (!M) return;
  const sc = $('#lScore'), cl = $('#lClock'), tb = $('#lTime'), fd = $('#lFeed'), st = $('#lStam'), ls = $('#lStats'), b = $('#lBall');
  if (!sc) return;
  sc.textContent = `${M.hg} – ${M.ag}`;
  const f = LV.M === M ? lvAt(LV.pt) : null; if (f) M.min = minLabel(f[1], f[2]);
  cl.textContent = M.min + "'"; if (tb) tb.style.width = liveClockPct(M) + '%';
  if (st) st.style.width = M.stam + '%';
  if (b && M.E) { b.setAttribute('cx', M.E.ball.x * 2); b.setAttribute('cy', M.E.ball.y * 2); }
  const fh = vFeed(M); if (fd && fd._h !== fh) { fd.innerHTML = fh; fd._h = fh; }
  const lc = $('#lCom'); if (lc) { const ch = vCom(M); if (lc._h !== ch) { lc.innerHTML = ch; lc._h = ch; } }
  if (ls) { const h = vLiveStats(M); ls.outerHTML = h; }
}
function liveRun() {
  clearInterval(UI.lt); UI.lt = null;
  if (UI.screen !== 'live' || !S.live) return;
  const L = S.live; if (!L.M.eng) { L.M = liveSetup(L.prep); }
  const M = L.M;
  sfxDrain(M);
  if (LV.off) {
    // repli sans canvas : avance par minutes
    if (M.press || M.pending || M.shoot || M.done || M.half || UI.mg) { render(); return; }
    UI.lt = setInterval(() => {
      if (!S.live) { clearInterval(UI.lt); return; }
      liveTick(M); sfxDrain(M);
      if (M.pending || M.shoot || M.done || M.half) { clearInterval(UI.lt); UI.lt = null; save(); render(); return; }
      liveLight();
    }, [380, 170, 90, 50, 30][UI.lspeed ?? 1]);
    return;
  }
  lvAttach();
}
function startLive() { UI.screen = 'live'; UI.adv = null; UI.mg = null; window.scrollTo(0, 0); render(); liveRun(); }
function startMg(i, shoot) {
  const M = S.live.M, o = shoot ? M.shoot.o[i] : M.pending.o[i], kind = mgKind(o);
  if (!kind) return false;
  const v = o.at ? S.p.at[o.at] : 60, rel = v - (M.opS - 6);
  const sDir = !shoot && M.pending && M.pending.sDir != null ? M.pending.sDir : wpick([0, 1, 2], d => [.38, .24, .38][d]);
  const truth = R() < .55, hd = truth ? sDir : pick([0, 1, 2].filter(x => x !== sDir));
  UI.mg = { kind, i, shoot: !!shoot, step: kind === 'shot' ? 'aim' : 'dive', t0: Date.now(), T: kind === 'shot' ? Math.round(clamp(1000 + rel * 12, 650, 1500)) : Math.round(clamp(1250 + rel * 8, 900, 1600)), dive: wpick([0, 1, 2], d => [.38, .24, .38][d]), sDir, hint: o.out === 'gkpen' || shoot ? `${M.op} : le tireur regarde ${['à gauche', 'au centre', 'à droite'][hd]}…` : `${['Frappe croisée', 'Frappe en force', 'Frappe enroulée'][hd]} en préparation…`, preDir: o.out === 'gkpen' && !shoot ? [0, 2, 1][i] : null };
  return true;
}
function mgFinish(mg) {
  const M = S.live.M, G = UI.mg; UI.mg = null;
  if (G.shoot) liveShoot(M, G.i, mg); else liveChoose(M, G.i, mg);
  save(); render(); liveRun();
}

// ---------- Objectifs & défi ----------
function vGoalsCard() {
  const O = S.obj, ch = S.chal;
  if ((!O || !O.list.length) && !ch) return '';
  return `<section class="card sec"><div class="hd"><h3>Objectifs</h3><button class="link" data-a="open" data-v="goals">Détails</button></div>
    ${O && O.list.length ? O.list.slice(0, 3).map(o => `<div class="obj"><div class="t"><span>${esc(o.t)}</span><span class="num ${objMet(o) ? 'ok' : ''}">${objTxt(o)}</span></div>${bar(objPct(o) * 100, objMet(o) ? 'ok' : '')}</div>`).join('') : ''}
    ${ch ? `<div class="chal ${ch.done ? 'done' : ''}">${icon('bolt')}<span class="grow"><b>Défi de la semaine</b><span>${esc(ch.t)} · ${ch.done ? 'réussi !' : chalProg() + '/' + ch.target}</span></span><span class="rw">${esc(rwTxt(ch.rw))}</span></div>` : ''}</section>`;
}
function vGoals() {
  const O = S.obj, ch = S.chal;
  return `<section class="card sec"><div class="hd"><h3>Objectifs de la saison</h3><span class="note">${seasonLabel(S.season)}</span></div>
    ${O && O.list.length ? O.list.map(o => `<div class="obj"><div class="t"><span>${esc(o.t)}</span><span class="num ${objMet(o) ? 'ok' : ''}">${objTxt(o)}</span></div>${bar(objPct(o) * 100, objMet(o) ? 'ok' : '')}</div>`).join('') : '<p class="note">Pas d\'objectif pour l\'instant.</p>'}
    <p class="note">${isCoach() ? 'Fixés par le président. Bilan en fin de saison : confiance, budget et avenir en dépendent.' : 'Fixés par ton club. Bilan fin mai : primes, confiance du coach et temps de jeu en dépendent.'}</p></section>
  <section class="card sec"><div class="hd"><h3>Défi de la semaine</h3><span class="note">Nouveau chaque lundi</span></div>
    ${ch ? `<div class="chal ${ch.done ? 'done' : ''}">${icon('bolt')}<span class="grow"><b>${esc(ch.t)}</b><span>${ch.done ? 'Réussi !' : 'Progression : ' + chalProg() + ' / ' + ch.target}</span></span><span class="rw">${esc(rwTxt(ch.rw))}</span></div>` : '<p class="note">Pas de défi cette semaine.</p>'}
    <p class="note">Défis réussis depuis le début : <b>${S.stats.chal || 0}</b>.</p></section>`;
}

// ---------- Vestiaire ----------
function vLocker() {
  if (isCoach()) return '<p class="note">En tant qu\'entraîneur, tu gères tout le groupe : voir Mon équipe.</p>';
  const mates = S.mates2 || [];
  const acts = { pote: [['pote', '', 'Sortir ensemble']], mentor: [['mentor', '', 'Demander conseil']], rival: [['rival', 'hand', 'Tendre la main'], ['rival', 'tease', 'Le chambrer']] };
  return `<section class="card sec">${gauge('Ambiance du vestiaire', S.mateRel, S.mateRel < 35 ? 'bad' : 'info')}${S.club.kind !== 'amateur' ? gauge('Entraîneur · ' + esc(S.coach.n), S.coach.rel, S.coach.rel < 35 ? 'bad' : 'ok') : ''}</section>
  ${mates.map(m => `<section class="card sec mate"><div class="row"><div class="av lg pic">${typeof portrait === 'function' ? portrait(m.n, { role: 'mate', age: m.age }) : esc(m.n[0])}</div><div class="grow"><div class="lbl acc">${ROLE_N[m.role]}</div><h3>${esc(m.n)}</h3><div class="note">${POS_N[m.pos] || ''} · ${m.age} ans</div></div></div>${gauge('Relation', m.rel, m.rel < 30 ? 'bad' : m.role === 'rival' ? 'info' : 'ok')}
    <p class="note">${m.role === 'mentor' ? 'Un cadre expérimenté. Ses conseils te font progresser.' : m.role === 'rival' ? 'Il joue à ton poste. Une saine concurrence te tire vers le haut, une guerre ouverte divise le groupe.' : 'Ton complice. Avec une bonne relation (70+), vos combinaisons marchent mieux en match.'}</p>
    <div class="row wrap">${acts[m.role].map(([r, a, t]) => `<button class="btn sm" data-a="mateAct" data-v="${r}:${a}" ${S.mateAct && S.mateAct[r + weekKey()] ? 'disabled' : ''}>${t}</button>`).join('')}</div></section>`).join('')}
  <p class="note">Une action par coéquipier et par semaine.</p>`;
}

// ---------- Rival ----------
function vRival() {
  const R_ = S.rival; if (!R_) return '';
  const st = rivalStar(), myVal = marketValue(OVR(), S.p.age), rv = marketValue(Math.round(R_.o), R_.age);
  const row = (k, a, b, hiA) => `<div class="cmp"><span class="a ${hiA === true ? 'win' : ''}">${a}</span><span class="k">${k}</span><span class="b ${hiA === false ? 'win' : ''}">${b}</span></div>`;
  const myTr = S.trophies.filter(t => !t.coach).length;
  return `<section class="card sec rivalhd"><div class="row"><div class="av lg rv pic">${typeof portrait === 'function' ? portrait(R_.n, { role: 'rival', age: R_.age }) : esc(R_.n[0])}</div><div class="grow"><div class="lbl acc">Ton rival</div><h3>${esc(R_.n)}</h3><div class="note">${natName(R_.nat)} · ${POS_N[R_.pos]} · ${R_.age} ans${R_.done ? ' · retraité' : ''}</div><div class="note">${esc(rivalClubN())}</div></div><a class="ghost note" href="#" data-a="open" data-v="curves">Courbes</a></div>
    <div class="cmphd"><span>${esc(S.p.first)}</span><span></span><span>${esc(R_.n.split(' ')[0])}</span></div>
    ${row('Note', isCoach() ? '—' : OVR(), Math.round(R_.o), isCoach() ? null : OVR() > R_.o ? true : OVR() < R_.o ? false : null)}
    ${row('Valeur', isCoach() ? '—' : eur(myVal), R_.done ? '—' : eur(rv), isCoach() || R_.done ? null : myVal > rv)}
    ${row('Buts en pro', S.stats.proGoals, R_.g + (st ? st.g : 0), S.stats.proGoals > R_.g + (st ? st.g : 0) ? true : S.stats.proGoals < R_.g + (st ? st.g : 0) ? false : null)}
    ${row('Sélections', S.intl.caps, R_.caps, S.intl.caps > R_.caps ? true : S.intl.caps < R_.caps ? false : null)}
    ${row('Trophées', myTr, R_.tr.length, myTr > R_.tr.length ? true : myTr < R_.tr.length ? false : null)}
    ${row('Ballon d\'Or', S.awards.filter(a => a.t === 'Ballon d\'Or').length, R_.bdo, null)}
    <div class="note center">Face-à-face entre vos clubs : ${R_.h2h.w} V · ${R_.h2h.d} N · ${R_.h2h.l} D</div></section>
  ${R_.hist.length ? `<section class="card sec"><div class="hd"><h3>Ses saisons</h3></div><div class="tblw"><table><thead><tr><th>Saison</th><th>Club</th><th>M</th><th>B</th><th>PD</th><th>Note</th></tr></thead><tbody>${R_.hist.slice().reverse().map(h => `<tr><td>${h.s}</td><td class="cl">${esc(h.c)}</td><td>${h.ap}</td><td>${h.g}</td><td>${h.a}</td><td>${h.o}</td></tr>`).join('')}</tbody></table></div></section>` : '<p class="note">Il n\'est pas encore pro. Vous avez commencé le foot la même année.</p>'}
  ${R_.tr.length ? `<section class="card sec"><h3>Son palmarès</h3><div class="note">${R_.tr.map(esc).join(' · ')}</div></section>` : ''}`;
}

// ---------- Talents ----------
function vPerks() {
  const own = PERKS.filter(P_ => S.perks[P_.id]), todo = PERKS.filter(P_ => !S.perks[P_.id] && perkFor(P_));
  return `<p class="note">Tes talents se débloquent par tes performances et changent tes chances en match.</p>
  ${own.length ? `<div class="perkg">${own.map(P_ => `<div class="perk on">${icon('star')}<b>${P_.n}</b><span>${P_.d}</span><i>${S.perks[P_.id]}</i></div>`).join('')}</div>` : ''}
  <section class="card sec"><div class="hd"><h3>À débloquer</h3><span class="note">${own.length} / ${own.length + todo.length}</span></div>
  ${todo.map(P_ => { let p = 0; try { p = clamp(P_.pr(), 0, 1); } catch (e) { } return `<div class="obj"><div class="t"><span><b>${P_.n}</b> · <span class="note">${P_.need}</span></span><span class="num">${Math.floor(p * 100)} %</span></div>${bar(p * 100, 'info')}<div class="note">${P_.d}</div></div>`; }).join('') || '<p class="note">Tous débloqués !</p>'}</section>`;
}

// ---------- Courbes ----------
const CH_A = '#c98500', CH_B = '#3987e5';
const axEur = v => v >= 1e9 ? Math.round(v / 1e9) + ' Md' : v >= 1e6 ? Math.round(v / 1e6) + ' M' : v >= 1e3 ? Math.round(v / 1e3) + ' k' : Math.round(v) + '';
const CHARTS = {};
function niceMax(v) { const p = Math.pow(10, Math.floor(Math.log10(Math.max(1, v)))); return Math.ceil(v / p) * p; }
function svgLine(id, labels, series, opt = {}) {
  const W = 340, H = 180, l = 34, r = 10, t = 12, b = 26, n = labels.length;
  if (n < 2) return '<p class="note">Pas encore assez de données : reviens dans quelques mois.</p>';
  const vals = series.flatMap(s => s.v.filter(x => x != null));
  const lg = !!opt.log, f = lg ? x => Math.log10(Math.max(1, x)) : x => x;
  let lo = opt.min ?? (lg ? Math.floor(f(Math.min(...vals))) : 0), hi = lg ? Math.ceil(f(Math.max(...vals))) : niceMax(Math.max(...vals));
  if (opt.min != null && !lg) hi = Math.max(hi, opt.min + 10);
  if (hi === lo) hi = lo + 1;
  const X = i => l + i * (W - l - r) / (n - 1), Y = v => t + (1 - (f(v) - lo) / (hi - lo)) * (H - t - b);
  const ticks = []; if (lg) for (let k = lo; k <= hi; k++) ticks.push(Math.pow(10, k)); else for (let k = 0; k <= 4; k++) ticks.push(lo + (hi - lo) * k / 4);
  const fmt = opt.fmt || (x => Math.round(x));
  const grid = ticks.map(v => `<line x1="${l}" x2="${W - r}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" class="gl"/><text x="${l - 5}" y="${(Y(v) + 3.5).toFixed(1)}" class="ax" text-anchor="end">${fmt(v)}</text>`).join('');
  const step = Math.max(1, Math.ceil(n / 5)), xl = labels.map((s, i) => i % step === 0 || i === n - 1 ? `<text x="${X(i).toFixed(1)}" y="${H - 8}" class="ax" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${esc(s)}</text>` : '').join('');
  const paths = series.map(s => { let d = '', pen = false; s.v.forEach((v, i) => { if (v == null) { pen = false; return; } d += (pen ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); pen = true; }); const li = s.v.map((v, i) => [v, i]).filter(x => x[0] != null).pop(); return `<path d="${d}" stroke="${s.c}" class="ln"/>${li ? `<circle cx="${X(li[1]).toFixed(1)}" cy="${Y(li[0]).toFixed(1)}" r="4" fill="${s.c}" class="end"/>` : ''}`; }).join('');
  CHARTS[id] = { labels, series, X, Y, l, r, W, H, t, b, fmt: opt.tip || fmt };
  return `<div class="chartw" data-chart="${id}"><svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${esc(opt.aria || '')}">${grid}${xl}${paths}<line class="xh" x1="0" x2="0" y1="${t}" y2="${H - b}" style="display:none"/></svg><div class="tip" style="display:none"></div></div>`;
}
function svgBars(id, labels, vals, opt = {}) {
  const W = 340, H = 170, l = 28, r = 6, t = 12, b = 24, n = labels.length;
  if (!n) return '<p class="note">Pas encore de saison complète.</p>';
  const hi = niceMax(Math.max(1, ...vals)), bw = Math.min(28, (W - l - r) / n - 2), X = i => l + (i + .5) * (W - l - r) / n, Y = v => t + (1 - v / hi) * (H - t - b);
  const grid = [0, .5, 1].map(k => `<line x1="${l}" x2="${W - r}" y1="${Y(hi * k).toFixed(1)}" y2="${Y(hi * k).toFixed(1)}" class="gl"/><text x="${l - 4}" y="${(Y(hi * k) + 3.5).toFixed(1)}" class="ax" text-anchor="end">${Math.round(hi * k)}</text>`).join('');
  const bars = vals.map((v, i) => { const y = Y(v), h = H - b - y; return `<path d="M${(X(i) - bw / 2).toFixed(1)} ${(H - b).toFixed(1)}V${(y + Math.min(4, h)).toFixed(1)}q0 -4 4 -4h${(bw - 8).toFixed(1)}q4 0 4 4V${(H - b).toFixed(1)}z" fill="${CH_A}" class="barm"/>`; }).join('');
  const step = Math.max(1, Math.ceil(n / 6)), xl = labels.map((s, i) => i % step === 0 || i === n - 1 ? `<text x="${X(i).toFixed(1)}" y="${H - 8}" class="ax" text-anchor="middle">${esc(s)}</text>` : '').join('');
  CHARTS[id] = { bars: true, labels, vals, X, n, l, r, W, H, t, b, unit: opt.unit || '' };
  return `<div class="chartw" data-chart="${id}"><svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${esc(opt.aria || '')}">${grid}${bars}${xl}<line class="xh" x1="0" x2="0" y1="${t}" y2="${H - b}" style="display:none"/></svg><div class="tip" style="display:none"></div></div>`;
}
function chartHover(e) {
  const w = e.target.closest && e.target.closest('.chartw'); if (!w) return;
  const C = CHARTS[w.dataset.chart]; if (!C) return;
  const svg = w.querySelector('svg'), rc = svg.getBoundingClientRect(), x = (e.clientX - rc.left) / rc.width * C.W;
  let i;
  if (C.bars) i = clamp(Math.floor((x - C.l) / ((C.W - C.l - C.r) / C.n)), 0, C.n - 1);
  else { const n = C.labels.length; i = clamp(Math.round((x - C.l) / ((C.W - C.l - C.r) / (n - 1))), 0, n - 1); }
  const xh = svg.querySelector('.xh'), tip = w.querySelector('.tip'), px = C.X(i);
  xh.setAttribute('x1', px); xh.setAttribute('x2', px); xh.style.display = '';
  tip.innerHTML = `<b>${esc(C.labels[i])}</b>` + (C.bars ? `<div>${C.vals[i]} ${C.unit}</div>` : C.series.map(s => s.v[i] == null ? '' : `<div><i style="background:${s.c}"></i>${esc(s.name)} : ${C.fmt(s.v[i])}</div>`).join(''));
  tip.style.display = ''; const left = px / C.W * rc.width; tip.style.left = Math.min(Math.max(0, left - 60), rc.width - 130) + 'px';
}
function vCurves() {
  const C = (S.curve || []).filter(x => x.ovr != null || x.rov != null);
  const lab = C.map(x => x.t.replace(/^(\S+) (\d{4})$/, (m, a, y) => a.slice(0, 4) + '. ' + y.slice(2)));
  const hist = S.hist.filter(h => !/amateur|formation/.test(h.c)).concat(S.ss.apps && S.club.kind === 'pro' ? [Object.assign(histRow(), {})] : []);
  return `<section class="card sec"><div class="hd"><h3>Note générale</h3><span class="legend"><span><b style="background:${CH_A}"></b>Toi</span><span><b style="background:${CH_B}"></b>${esc(S.rival.n.split(' ')[0])} (rival)</span></span></div>
    ${svgLine('ovr', lab, [{ name: 'Toi', c: CH_A, v: C.map(x => x.ovr) }, { name: S.rival.n, c: CH_B, v: C.map(x => x.rov) }], { min: 20, aria: 'Évolution de ta note et de celle de ton rival' })}</section>
  <section class="card sec"><div class="hd"><h3>Valeur marchande</h3><span class="note">en €, échelle log.</span></div>
    ${svgLine('val', lab, [{ name: 'Valeur', c: CH_A, v: C.map(x => x.val) }], { log: true, fmt: axEur, tip: v => eur(v), aria: 'Évolution de ta valeur marchande' })}</section>
  <section class="card sec"><div class="hd"><h3>Buts par saison</h3><span class="note">en club pro</span></div>
    ${svgBars('goals', hist.map(h => h.s.slice(2)), hist.map(h => h.g), { unit: 'buts', aria: 'Buts par saison' })}</section>
  <section class="card sec"><div class="hd"><h3>Fortune</h3><span class="note">en €, échelle log.</span></div>
    ${svgLine('w', (S.curve || []).map(x => x.t.replace(/^(\S+) (\d{4})$/, (m, a, y) => a.slice(0, 4) + '. ' + y.slice(2))), [{ name: 'Fortune', c: CH_A, v: (S.curve || []).map(x => Math.max(1, x.w)) }], { log: true, fmt: axEur, tip: v => eur(v), aria: 'Évolution de ta fortune' })}</section>
  <p class="note">Touche un graphique pour lire les valeurs. Un point par mois.</p>`;
}

// ---------- Musique ----------
function vMusic() {
  const T = TRACKS[AU.cur], on = AU.playing && OPTS.music;
  return `<section class="card sec np"><div class="row"><div class="eq ${on ? 'on' : ''}" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="grow"><div class="lbl acc">${on ? 'En lecture' : 'En pause'}</div><h3>${esc(T.n)}</h3><div class="note">${esc(T.s)} · ${T.bpm} BPM</div></div></div>
    <div class="row ctl"><button class="btn" data-a="mPrev" aria-label="Précédent">${icon('back')}</button><button class="btn pri grow" data-a="mToggle">${on ? 'Pause' : 'Lecture'}</button><button class="btn" data-a="mNext" aria-label="Suivant"><span style="display:inline-block;transform:scaleX(-1)">${icon('back')}</span></button></div>
    <div class="field"><label class="lbl" for="mvol">Musique · ${Math.round((OPTS.mvol ?? .55) * 100)} %</label><input type="range" id="mvol" min="0" max="1" step=".05" value="${OPTS.mvol ?? .55}"></div>
    <div class="field"><label class="lbl" for="svol">Supporters et effets · ${Math.round((OPTS.svol ?? .8) * 100)} %</label><input type="range" id="svol" min="0" max="1" step=".05" value="${OPTS.svol ?? .8}"></div>
    <div class="seg"><button data-a="mShuffle" data-v="0" class="${!OPTS.shuffle ? 'on' : ''}">Dans l'ordre</button><button data-a="mShuffle" data-v="1" class="${OPTS.shuffle ? 'on' : ''}">Aléatoire</button></div></section>
  <section class="card"><div class="list">${TRACKS.map((t, i) => `<button class="it trk ${i === AU.cur ? 'cur' : ''}" data-a="mPlay" data-v="${i}"><span class="num dim" style="width:18px">${i + 1}</span><span class="grow"><b>${esc(t.n)}</b><span class="note">${esc(t.s)}</span></span>${i === AU.cur && on ? '<span class="chip acc">Lecture</span>' : ''}</button>`).join('')}</div></section>
  <p class="note">Musiques originales composées pour Crampons d'Or et jouées en direct par ton téléphone : libres de droits, sans téléchargement, même hors ligne. En match, la musique laisse place aux supporters. Pas de son sur iPhone ? Monte le volume et vérifie le mode silencieux.</p>
  ${AU.failed ? '<p class="note bad">Le son n\'est pas disponible sur ce navigateur.</p>' : ''}`;
}
function onTrackChange() { if (UI.sub === 'music' && UI.screen === 'game') render(); }

// ---------- Entraîneur ----------
function coachForm() { const c = myClub(); if (!c) return 50; const f = clubRow(c.id).f; if (!f.length) return 50; return f.reduce((x, r) => x + (r === 'V' ? 3 : r === 'N' ? 1 : 0), 0) / (f.length * 3) * 100; }
function vHomeCoach() {
  const M = S.mgr, c = myClub(), d0 = today(), fx = fixturesOn(S.day), nx = nextMatch(), tab = UI.htab || 'today';
  if (tab === 'res') return segTabs('hTab', tab, HOME_TABS) + (S.lastDay ? vDayReport(S.lastDay) : '<p class="note center">Pas encore de résultat.</p>');
  if (tab === 'news') return segTabs('hTab', tab, HOME_TABS) + vNewsList();
  return segTabs('hTab', tab, HOME_TABS) + `<section class="hero compact"><div class="row" style="align-items:flex-start"><div class="grow stack" style="gap:6px;position:relative;z-index:1"><div class="name">${esc(S.p.first)} ${esc(S.p.last)}</div><div class="chips"><span class="chip acc">Entraîneur</span><span class="chip">${S.p.age} ans</span>${c ? `<span class="chip line">${esc(TACTICS[M.tactic][0])}</span>` : ''}</div><div class="row">${badge(S.club.n)}<div class="grow"><div style="font-weight:600;line-height:1.2">${esc(S.club.n)}</div><div class="note">${c ? L_BY(c.lid).name + ' · ' + clubPos(c.id) + 'e' : 'En recherche d\'un club'}</div></div></div></div><div class="ovr"><div class="v num">${M.w}</div><div class="k">Victoires</div></div></div></section>
  <div class="gauges">${gauge('Président', M.board, M.board < 30 ? 'bad' : 'ok')}${gauge('Vestiaire', S.mateRel, 'info')}${gauge('Forme', coachForm())}</div>
  ${!c && M.jobs.length ? `<button class="alert acc" data-a="open" data-v="jobs">${icon('brief')}<span class="grow"><b>${M.jobs.length} offre${M.jobs.length > 1 ? 's' : ''} d'emploi</b><span>Choisis ton prochain club</span></span><span class="chev">›</span></button>` : ''}
  ${c && windowOpen() ? `<button class="alert acc" data-a="open" data-v="recruit">${icon('swap')}<span class="grow"><b>Mercato ouvert</b><span>Budget : ${eur(M.budget)} · ${3 - M.signed} recrue${3 - M.signed > 1 ? 's' : ''} possible${3 - M.signed > 1 ? 's' : ''}</span></span><span class="chev">›</span></button>` : ''}
  <section class="card sec"><div class="hd"><h3>${cap(MONTHS[d0.getMonth()])} ${d0.getFullYear()}</h3><span class="note">Semaine ${S.week}</span></div>${vFrise()}
    <div class="today">${fx.length ? fx.map(j => { const l = fixtureLabel(j); return `<div class="matchday"><div class="lbl acc">Jour de match${l.derby ? ' · ' + esc(l.derby) : ''}</div><div class="mdt">${esc(l.txt)}</div><div class="note">${esc(l.comp)}</div></div>`; }).join('') : `<div class="row"><div class="grow"><div class="lbl">Séance du jour</div><div class="mdt">${c ? FOCUS[M.focus][0] : 'Observation'}</div><div class="note">${c ? FOCUS[M.focus][1] : 'Tu regardes des matchs et tu soignes ton réseau.'}</div></div>${c ? '<button class="btn sm" data-a="tab" data-v="agenda">Changer</button>' : ''}</div>`}</div>
    ${nx ? `<div class="note">Prochain match : <b>${esc(nx)}</b></div>` : ''}</section>
  ${vGoalsMini()}
  `;
}
function vAgendaCoach() {
  const M = S.mgr;
  return `<section class="card sec"><div class="hd"><h3>Entraînement de la semaine</h3></div><div class="opts">${Object.keys(FOCUS).map(k => `<button class="opt ${M.focus === k ? 'on' : ''}" data-a="cFocus" data-v="${k}"><b>${FOCUS[k][0]}</b><span>${FOCUS[k][1]}</span></button>`).join('')}</div></section>
  <section class="card sec"><div class="hd"><h3>Tactique par défaut</h3><span class="note">matchs simulés</span></div><div class="opts">${Object.keys(TACTICS).map(k => `<button class="opt ${M.tactic === k ? 'on' : ''}" data-a="cTactic" data-v="${k}"><b>${TACTICS[k][0]}</b><span>${TACTICS[k][1]}</span></button>`).join('')}</div></section>
  ${vMonth()}`;
}
function vCoachClub() {
  if (!S.mgr) return '<p class="note">Disponible pendant ta carrière d\'entraîneur.</p>';
  const c = myClub(), M = S.mgr;
  if (!c) return `<section class="card sec"><h3>Sans club</h3><p class="note">Les offres arrivent régulièrement. Ta réputation d'entraîneur : ${Math.round(M.rep)} / 100.</p>${M.jobs.length ? '<button class="btn wide" data-a="open" data-v="jobs">Voir les offres</button>' : ''}</section>`;
  const sq = (S.squad || []).slice().sort((a, b) => GROUP_ORDER.indexOf(GROUP[a.pos]) - GROUP_ORDER.indexOf(GROUP[b.pos]) || b.o - a.o);
  return `<section class="card sec"><div class="row">${badge(c.n, true)}<div class="grow"><h3>${esc(c.n)}</h3><div class="note">${L_BY(c.lid).name} · ${clubPos(c.id)}e · niveau ${c.s}</div></div></div>
    ${kv([['Contrat', 'jusqu\'en juin ' + (S.club.until + 1)], ['Salaire', eur(monthly(S.club.wage)) + ' / mois'], ['Budget mercato', eur(M.budget)], ['Saison', M.ss.w + ' V · ' + M.ss.d + ' N · ' + M.ss.l + ' D']])}
    ${gauge('Confiance du président', M.board, M.board < 30 ? 'bad' : 'ok')}${gauge('Vestiaire', S.mateRel, 'info')}</section>
  <section class="card sec"><div class="hd"><h3>Effectif</h3><span class="note">${sq.length} joueurs</span></div><div class="list">${sq.map(x => `<div class="it"><span class="chip line">${x.pos}</span><span class="grow">${esc(x.n)}${x.ref && x.ref.inj ? ' <span class="bad note">blessé</span>' : ''}</span><b class="num">${x.o}</b></div>`).join('')}</div></section>
  <button class="btn wide" data-a="tab" data-v="agenda">Tactique et entraînement</button>`;
}
const GROUP_ORDER = ['GB', 'DC', 'DL', 'MIL', 'AIL', 'BU'];
function vRecruit() {
  if (!S.mgr) return '<p class="note">Disponible pendant ta carrière d\'entraîneur.</p>';
  const M = S.mgr, c = myClub(); if (!c) return '<p class="note">Il te faut un club.</p>';
  const L = coachRecruitList();
  return `<section class="card sec"><div class="hd"><h3>Mercato</h3><span class="chip ${windowOpen() ? 'ok' : 'line'}">${windowOpen() ? 'Ouvert' : 'Fermé'}</span></div>${kv([['Budget', eur(M.budget)], ['Recrues ce mercato', M.signed + ' / 3']])}<p class="note">Chaque recrue au-dessus du niveau du club le renforce.</p></section>
  <section class="card"><div class="list">${L.map(x => `<div class="it"><span class="chip line">${x.s.pos}</span><div class="grow"><b>${esc(x.s.n)}</b><div class="note">${esc(club(x.s.cid).n)} · ${x.s.a} ans · ${eur(x.v)}</div></div><b class="num">${x.s.o}</b><button class="btn sm" data-a="cSign" data-v="${esc(x.s.n)}" ${!windowOpen() || x.v > M.budget || M.signed >= 3 ? 'disabled' : ''}>Recruter</button></div>`).join('') || '<p class="note">Aucune cible.</p>'}</div></section>`;
}
function vJobs() {
  if (!S.mgr) return '<p class="note">Disponible pendant ta carrière d\'entraîneur.</p>';
  const J = (S.mgr.jobs || []).filter(j => j.exp > absDay());
  return J.length ? J.map(j => { const c = club(j.cid); return `<section class="card sec"><div class="row">${badge(c.n, true)}<div class="grow"><h3>${esc(c.n)}</h3><div class="note">${L_BY(c.lid).name} · niveau ${c.s}</div></div></div>${kv([['Salaire', eur(monthly(j.wage)) + ' / mois'], ['Contrat', j.years + ' saisons'], ['Objectif', expectedRank(c) + 'e']])}<button class="btn pri wide" data-a="cJob" data-v="${j.cid}">Signer</button></section>`; }).join('') : '<p class="note center">Aucune offre pour l\'instant.</p>';
}
function vMgr() {
  if (!S.mgr) return '<p class="note">Disponible pendant ta carrière d\'entraîneur.</p>';
  const M = S.mgr, tr = S.trophies.filter(t => t.coach), g = M.w + M.d + M.l;
  return `<section class="card sec"><div class="hd"><h3>Bilan d'entraîneur</h3><span class="note">depuis ${seasonLabel(M.since)}</span></div><div class="statg">${[['Matchs', g], ['Victoires', M.w], ['Nuls', M.d], ['Défaites', M.l]].map(([k, v]) => `<div><div class="lbl">${k}</div><div class="big">${v}</div></div>`).join('')}</div>${kv([['% de victoires', g ? Math.round(M.w / g * 100) + ' %' : '–'], ['Buts', M.gf + ' marqués · ' + M.ga + ' encaissés'], ['Réputation', Math.round(M.rep) + ' / 100'], ['Limogeages', M.sacked]])}</section>
  ${tr.length ? `<section class="card sec"><h3>Trophées d'entraîneur</h3><div class="troph">${tr.map(t => `<div><b>${esc(t.t)}</b><span class="note">${t.s} · ${esc(t.c)}</span></div>`).join('')}</div></section>` : ''}
  ${M.hist.length ? `<section class="card sec"><div class="hd"><h3>Parcours</h3></div><div class="tblw"><table><thead><tr><th>Saison</th><th>Club</th><th>Pos.</th><th>V</th><th>N</th><th>D</th></tr></thead><tbody>${M.hist.slice().reverse().map(h => `<tr><td>${h.s}</td><td class="cl">${esc(h.c)}</td><td>${h.pos}</td><td>${h.w}</td><td>${h.d}</td><td>${h.l}</td></tr>`).join('')}</tbody></table></div></section>` : ''}
  <button class="btn wide danger" data-a="endCoach">Terminer ma carrière d'entraîneur</button>`;
}
