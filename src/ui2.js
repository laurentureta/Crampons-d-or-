// ===================== INTERFACE : menus à tuiles et écrans =====================
const TILES = {
  career: () => isCoach() ? [
    ['club', 'shield', 'Mon équipe', S.club.id ? S.club.n + ' · ' + Math.round(S.mgr.board) + ' de confiance' : 'Sans club'],
    S.club.id ? ['recruit', 'swap', 'Mercato', windowOpen() ? 'Ouvert · ' + eur(S.mgr.budget) : 'Fermé'] : ['jobs', 'brief', 'Offres d\'emploi', (S.mgr.jobs || []).length + ' offre(s)', (S.mgr.jobs || []).length],
    ['goals', 'target', 'Objectifs & défi', S.obj && S.obj.list.length ? S.obj.list.filter(objMet).length + ' / ' + S.obj.list.length + ' en bonne voie' : '—'],
    ['mgr', 'chart', 'Bilan d\'entraîneur', S.mgr.w + ' V · ' + S.mgr.d + ' N · ' + S.mgr.l + ' D'],
    ['comps', 'table', 'Compétitions', myClub() ? L_BY(myClub().lid).name : 'Classements'],
    ['rival', 'bolt', 'Ton rival', S.rival.n],
    ['world', 'globe', 'Actualités du foot', S.news[0] ? S.news[0].t : ''],
  ] : [
    ['goals', 'target', 'Objectifs & défi', S.chal ? (S.chal.done ? 'Défi réussi' : 'Défi : ' + chalProg() + '/' + S.chal.target) : 'Saison ' + seasonLabel(S.season)],
    ['club', 'shield', 'Mon club', S.club.n + ' · ' + roleLabel()],
    ['transfers', 'swap', 'Transferts & contrat', S.offers.length ? S.offers.length + ' offre' + (S.offers.length > 1 ? 's' : '') : windowOpen() ? 'Mercato ouvert' : 'Mercato fermé', S.offers.length],
    S.club.kind === 'amateur' ? ['trials', 'watch', 'Essais en club', 'Tente ta chance chez les pros'] : null,
    ['locker', 'users', 'Vestiaire', (S.mates2 || []).map(m => m.n.split(' ')[0]).join(', ')],
    ['rival', 'bolt', 'Ton rival', S.rival.n + ' · note ' + Math.round(S.rival.o)],
    ['agent', 'brief', 'Agent', S.agent ? S.agent.n : 'Aucun agent'],
    ['nat', 'flag', 'Sélection', nation().n + ' · ' + S.intl.caps + ' sél.'],
    ['comps', 'table', 'Compétitions', myClub() ? L_BY(myClub().lid).name + ' · ' + clubPos(S.club.id) + 'e' : 'Classements'],
    ['stats', 'chart', 'Stats & palmarès', S.ss.apps + ' matchs · ' + S.ss.g + ' buts'],
    ['world', 'globe', 'Actualités du foot', S.news[0] ? S.news[0].t : ''],
  ],
  life: () => [
    ['money', 'wallet', 'Argent', eur(S.p.money) + ' disponibles'],
    ['family', 'family', 'Famille', 'Relation : ' + Math.round((S.fam.dad.rel + S.fam.mom.rel) / 2)],
    ['love', 'heart', 'Amour', S.love ? { date: 'Vous vous fréquentez', couple: 'En couple', live: 'Vous vivez ensemble', married: 'Mariés' }[S.love.st] + ' · ' + S.love.n.split(' ')[0] : 'Célibataire'],
    ['friends', 'users', 'Amis', S.friend.n.split(' ')[0] + ' · ' + Math.round(S.friend.rel)],
    ['assets', 'house', 'Patrimoine', S.assets.houses.length + ' logement' + (S.assets.houses.length > 1 ? 's' : '') + ' · ' + S.assets.cars.length + ' voiture' + (S.assets.cars.length > 1 ? 's' : '')],
    ['invest', 'trend', 'Placements', eur(S.assets.liv + S.assets.etf + S.assets.cry)],
    ['staff', 'dumb', 'Staff personnel', S.assets.serv.length ? S.assets.serv.length + ' actif' + (S.assets.serv.length > 1 ? 's' : '') : 'Aucun'],
    ['school', 'book', 'École & permis', (S.school.bac ? 'Bac obtenu' : S.school.done ? 'Sans bac' : 'Bac en cours') + ' · ' + (S.permis.ok ? 'permis ✓' : 'pas de permis')],
  ],
  settings: () => [
    ['options', 'gear', 'Options', { all: 'Tous les matchs en direct', big: 'Grands matchs en direct', none: 'Matchs simulés' }[S.settings.live]],
    ['music', 'note', 'Musique', (AU.playing && OPTS.music ? '♪ ' : '') + TRACKS[AU.cur].n],
    ['saves', 'save', 'Sauvegardes', 'Emplacement ' + (S.slot || 1)],
    ['help', 'help', 'Comment jouer', 'Les bases en 2 minutes'],
    ['quit', 'grid', 'Menu principal', 'Ta partie est sauvegardée'],
  ],
  profile: () => [
    ['sheet', 'user', isCoach() ? 'Carrière de joueur' : 'Fiche joueur', isCoach() ? S.stats.proApps + ' matchs pro' : 'Note ' + OVR() + ' · potentiel ' + '★'.repeat(potStars())],
    isCoach() ? null : ['perks', 'star', 'Talents', Object.keys(S.perks).length + ' débloqué' + (Object.keys(S.perks).length > 1 ? 's' : '')],
    ['curves', 'curve', 'Progression', 'Courbes saison après saison'],
    ['card', 'card', 'Carte joueur', 'Image à partager'],
    ['social', 'phone', 'Réseaux sociaux', fnum(S.p.followers) + ' abonnés'],
    ['ach', 'medal', 'Succès', Object.keys(S.ach).length + ' / ' + ACH.length],
    ['inbox', 'mail', 'Messages', unread() ? unread() + ' non lu' + (unread() > 1 ? 's' : '') : 'Tout est lu', unread()],
    ['bdo', 'ball', 'Ballon d\'Or', S.bdo.length ? 'Dernier : ' + S.bdo[S.bdo.length - 1].w : 'Cérémonie fin octobre'],
  ],
};
const SUB_T = { settings: 'Réglages', goals: 'Objectifs & défi', locker: 'Vestiaire', rival: 'Ton rival', perks: 'Talents', curves: 'Progression', music: 'Musique', recruit: 'Mercato', jobs: 'Offres d\'emploi', mgr: 'Bilan d\'entraîneur', club: 'Mon club', transfers: 'Transferts & contrat', nego: 'Négociation', trials: 'Essais en club', agent: 'Agent', nat: 'Sélection', comps: 'Compétitions', stats: 'Stats & palmarès', world: 'Actualités du foot', money: 'Argent', family: 'Famille', love: 'Amour', friends: 'Amis', assets: 'Patrimoine', invest: 'Placements', staff: 'Staff personnel', school: 'École & permis', sheet: 'Fiche joueur', card: 'Carte joueur', social: 'Réseaux sociaux', ach: 'Succès', inbox: 'Messages', bdo: 'Ballon d\'Or', saves: 'Sauvegardes', options: 'Options', help: 'Comment jouer' };
function vTiles(tab) {
  const head = { career: ['Carrière', 'Ton club, ton avenir, tes stats'], life: ['Vie', 'Argent, famille, amour, patrimoine'], profile: ['Profil', 'Ton image, tes succès'] }[tab];
  return `<div class="tabhd"><h2>${head[0]}</h2><span class="note">${head[1]}</span></div>${vTileGrid(tab)}
  ${tab === 'profile' && isCoach() ? '<button class="btn wide danger" data-a="endCoach">Terminer ma carrière d\'entraîneur</button>' : ''}
  ${tab === 'profile' && (S.p.age >= 33 && S.club.kind === 'pro' || planBOk()) ? `<div class="stack" style="gap:8px">${S.p.age >= 33 && S.club.kind === 'pro' ? '<button class="btn wide danger" data-a="retire">Prendre ma retraite</button>' : ''}${planBOk() ? '<button class="btn wide danger" data-a="planB">Arrêter le foot (plan B)</button>' : ''}</div>` : ''}`;
}
function vTileGrid(tab) {
  return `<div class="tiles">${TILES[tab]().filter(Boolean).map(([k, ic, t, s, n]) => `<button class="tile" data-a="${k === 'quit' ? 'quitMenu' : 'open'}" data-v="${k}">${icon(ic)}<b>${t}</b><span>${esc(s || '')}</span>${n ? `<i class="tcnt">${n}</i>` : ''}</button>`).join('')}</div>`;
}
function vSubParts() { const h = vSub(), k = h.indexOf('</div>') + 6; return [h.slice(0, k), h.slice(k)]; }
function vSub() {
  const f = { settings: () => vTileGrid('settings'), goals: vGoals, locker: vLocker, rival: vRival, perks: vPerks, curves: vCurves, music: vMusic, recruit: vRecruit, jobs: vJobs, mgr: vMgr, club: vClub, transfers: vTransfers, nego: vNego, trials: vTrials, agent: vAgent, nat: vNat, comps: vComps, stats: vStats, world: vWorld, money: vMoney, family: vFamily, love: vLove, friends: vFriends, assets: vAssets, invest: vInvest, staff: vStaff, school: vSchool, sheet: vSheet, card: vCard, social: vSocial, ach: vAch, inbox: vInbox, bdo: vBdo, saves: vSaves, options: vOptions, help: vHelp }[UI.sub];
  return `<div class="subhd"><button class="backb" data-a="back" aria-label="Retour">${icon('back')}</button><h2>${SUB_T[UI.sub] || ''}</h2></div>${f ? f() : ''}`;
}
const kv = rows => `<dl class="kv">${rows.filter(Boolean).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;

// ---------- Carrière ----------
function vClub() {
  if (isCoach()) return vCoachClub();
  const c = myClub(), p = S.p;
  if (!c) return `<section class="card sec">${S.club.free ? `<h3>Sans club</h3><p>Tu es libre. Fais des essais, attends des offres ou rejoue en amateur pour te montrer.</p><button class="btn wide" data-a="amateur">Rejoindre le club amateur de ${esc(p.city)}</button>` : `<div class="row">${badge(S.club.n, true)}<div class="grow"><h3>${esc(S.club.n)}</h3><div class="note">Football amateur · ${youthCat()}</div></div></div><p>Deux chemins vers le haut niveau : <b>briller en match</b> (une note de 7 ou plus attire les recruteurs) ou <b>payer tes essais</b> dans les clubs.</p><button class="btn wide" data-a="open" data-v="trials">Voir les essais</button>`}
    ${S.club.free ? '' : gauge('Entraîneur · ' + esc(S.coach.n), S.coach.rel, 'info')}</section>`;
  const L = L_BY(c.lid), rv = rivals().slice().sort((a, b) => b.o - a.o), o = OVR(), k = SLOTS[GROUP[p.pos]];
  const comp = rv.concat([{ n: 'Toi', o, me: true, pos: p.pos }]).sort((a, b) => b.o - a.o);
  const cs = contStatus(), pos = clubPos(c.id), cup = S.W.cups[c.cc];
  return `<section class="card sec">
    <div class="row">${badge(c.n, true)}<div class="grow"><h3>${esc(c.n)}</h3><div class="note">${L.name} · ${pos}e · niveau ${c.s}</div></div>${S.club.kind === 'pro' ? `<div class="shirt"><span>${S.club.num}</span></div>` : ''}</div>
    ${kv([['Statut', (S.club.kind === 'academy' ? 'Centre de formation' : esc(S.club.role)) + (S.club.loanFrom ? ' (prêt)' : '') + (S.club.captain ? ' · capitaine' : '')], ['Entraîneur', esc(c.coach)], [S.club.kind === 'academy' ? 'Indemnité' : 'Salaire', eur(monthly(S.club.wage)) + ' / mois'], ['Contrat', 'jusqu\'en juin ' + (S.club.until + 1)], S.club.clause ? ['Clause libératoire', eur(S.club.clause)] : null, S.club.promise ? ['Promesse', 'Temps de jeu garanti'] : null, ['Valeur estimée', eur(marketValue(o, p.age))], cs ? [CONT_CUP[cs.conf], esc(cs.txt)] : null, S.club.kind === 'pro' ? [L.cup, cup.winner === c.id ? 'Vainqueur !' : cup.alive ? 'En course · ' + CUP_ROUNDS[cup.round] : 'Éliminé'] : null])}
  </section>
  <section class="card sec"><div class="hd"><h3>Relations</h3></div>
    ${gauge('Entraîneur · ' + esc(S.coach.n), S.coach.rel, S.coach.rel < 35 ? 'bad' : 'ok')}${gauge('Vestiaire', S.mateRel, S.mateRel < 35 ? 'bad' : 'info')}
    <p class="note">La relation avec le coach pèse sur ton temps de jeu. Viens à l'entraînement, accepte ses choix et performe.</p></section>
  ${S.club.kind === 'pro' ? `<section class="card sec"><div class="hd"><h3>Concurrence à ton poste</h3><span class="note">${k} titulaire${k > 1 ? 's' : ''}</span></div>
    <div class="list">${comp.slice(0, 8).map((x, i) => `<div class="it ${x.me ? 'me' : ''}"><span class="num dim" style="width:18px">${i + 1}</span><span class="grow">${esc(x.n)} <span class="note">${x.pos}</span></span>${i < k ? '<span class="chip ok">Titulaire</span>' : ''}<b class="num">${x.o}</b></div>`).join('')}</div></section>
  <section class="card sec"><div class="hd"><h3>Effectif</h3><span class="note">Joueurs majeurs</span></div><div class="list">${S.squad.filter(x => x.star).sort((a, b) => b.o - a.o).map(x => `<div class="it"><span class="chip line">${x.pos}</span><span class="grow">${esc(x.n)}${x.ref && x.ref.inj ? ' <span class="bad note">blessé</span>' : ''}</span><b class="num">${x.o}</b></div>`).join('') || '<p class="note">Pas de grande star dans cet effectif.</p>'}</div></section>` : ''}
  <div class="stack" style="gap:8px">
    ${S.club.kind === 'pro' && !S.club.loanFrom ? `<button class="btn wide" data-a="req" ${S.transferReq ? 'disabled' : ''}>${S.transferReq ? 'Transfert demandé' : 'Demander un transfert'}</button>` : ''}
    ${S.club.kind === 'pro' && S.club.until - S.season <= 1 && /Titulaire|Star/.test(S.club.role) && !S.club.loanFrom && !S.offers.some(x => x.kind === 'renew') ? '<button class="btn wide" data-a="ext">Demander une prolongation</button>' : ''}
    ${S.club.kind === 'pro' && SUMMER(S.week) ? '<button class="btn wide ghost" data-a="changeNum">Changer de numéro</button>' : ''}
  </div>`;
}
function vTransfers() {
  const open = windowOpen(), free = S.club.kind === 'amateur' && S.p.age >= 17;
  return `<section class="card sec"><div class="hd"><h3>Mercato</h3><span class="chip ${open ? 'ok' : 'line'}">${open ? 'Ouvert' : 'Fermé'}</span></div>
    <p class="note">${S.club.kind === 'academy' ? 'Au centre de formation, ton avenir passe par un premier contrat pro avec ton club.' : free ? 'Sans contrat pro : des clubs peuvent te faire une offre à tout moment.' : 'Fenêtres : été (mi-juin à fin août) et hiver (janvier). ' + (S.transferReq ? 'Tu as demandé à partir : plus d\'offres arrivent.' : '')}</p></section>
    ${S.offers.length ? S.offers.map(o => { const c = club(o.cid), L = L_BY(c.lid); return `<section class="card sec offer"><div class="row">${badge(c.n, true)}<div class="grow"><h3>${esc(c.n)}</h3><div class="note">${L.name} · niveau ${c.s} · ${esc(c.coach)}</div></div></div>
      ${kv([['Type', o.kind === 'renew' ? 'Prolongation' : o.loan ? 'Prêt d\'une saison' : 'Transfert'], ['Salaire', eur(monthly(o.wage)) + ' / mois'], ['Durée', o.years + ' saison' + (o.years > 1 ? 's' : '')], o.fee ? ['Indemnité', eur(o.fee)] : null, ['Temps de jeu estimé', estRole(c)], ['Expire', shortDate(dateFromAbs(o.exp))]])}
      <div class="row"><button class="btn pri grow" data-a="nego" data-v="${o.id}">Négocier</button><button class="btn ghost" data-a="offerDec" data-v="${o.id}">Refuser</button></div></section>`; }).join('') : '<p class="note center">Aucune offre pour le moment.</p>'}
    ${S.club.kind === 'pro' && !S.club.loanFrom && !S.transferReq ? '<button class="btn wide" data-a="req">Demander un transfert</button>' : ''}`;
}
function vNego() {
  const N = UI.nego, off = N && S.offers.find(o => o.id === N.id);
  if (!off) return '<p class="note">Cette offre n\'existe plus.</p>';
  const c = club(off.cid), t = N.t, ch = negoChance(off, t), pat = off.pat ?? 3, w = Math.round(off.wage * t.wm);
  const seg = (k, vals, lab) => `<div class="seg">${vals.map(v => `<button data-a="nT" data-v="${k}:${v}" class="${t[k] === v ? 'on' : ''}">${lab(v)}</button>`).join('')}</div>`;
  return `<section class="card sec"><div class="row">${badge(c.n, true)}<div class="grow"><h3>${esc(c.n)}</h3><div class="note">${off.kind === 'renew' ? 'Prolongation' : off.loan ? 'Prêt' : 'Transfert'} · offre initiale ${eur(monthly(off.wage))} / mois</div></div></div>
    <div class="row between"><span class="lbl">Patience du club</span><span class="pat">${[0, 1, 2].map(i => `<i class="${i < pat ? 'on' : ''}"></i>`).join('')}</span></div>
    ${S.agent ? `<p class="note">${esc(S.agent.n)} négocie pour toi (${S.agent.nego >= 0 ? '+' : ''}${Math.round(S.agent.nego * 100)} %).</p>` : '<p class="note">Sans agent, tu négocies seul.</p>'}</section>
  ${N.msg ? `<div class="alert ${N.bad ? 'bad' : 'acc'}"><span class="grow">${esc(N.msg)}</span></div>` : ''}
  <section class="card sec">
    ${off.loan ? '<p class="note">Prêt : le salaire n\'est pas négociable.</p>' : `<div class="field"><span class="lbl">Salaire · ${eur(monthly(w))} / mois</span>${seg('wm', [1, 1.1, 1.2, 1.35, 1.5], v => v === 1 ? 'Offre' : '+' + Math.round((v - 1) * 100) + ' %')}</div>
    <div class="field"><span class="lbl">Durée</span>${seg('years', [1, 2, 3, 4, 5], v => v + ' an' + (v > 1 ? 's' : ''))}</div>
    <div class="field"><span class="lbl">Prime à la signature</span>${seg('bonus', [0, 1, 3, 6], v => v ? v + ' mois' : 'Aucune')}</div>
    <div class="field"><span class="lbl">Clauses</span><div class="seg"><button data-a="nT" data-v="clause:${!t.clause}" class="${t.clause ? 'on' : ''}">Clause libératoire</button><button data-a="nT" data-v="starter:${!t.starter}" class="${t.starter ? 'on' : ''}">Temps de jeu garanti</button></div></div>`}
    <div class="gauge"><div class="t"><span>Chance d'accord</span><span class="num">${Math.round(ch * 100)} %</span></div>${bar(ch * 100, ch > .6 ? 'ok' : ch > .35 ? '' : 'bad')}</div>
    <div class="note">Temps de jeu estimé : ${estRole(c)}.</div>
  </section>
  <div class="stack" style="gap:8px"><button class="btn pri wide" data-a="nPropose">${off.loan ? 'Accepter le prêt' : 'Proposer ces conditions'}</button>${off.loan ? '' : '<button class="btn wide" data-a="nAccept">Accepter l\'offre initiale</button>'}<button class="btn wide ghost" data-a="nRefuse">Refuser l'offre</button></div>`;
}
function vTrials() {
  const age = S.p.age, o = OVR(), lid = UI.trialL || NAT_LEAGUE[S.p.nat] || 'FRA', L = L_BY(lid);
  const clubs = S.W.leagues[lid].members.map(id => club(id)).sort((a, b) => b.s - a.s);
  const cd = absDay() - S.lastTrialD < 7;
  return `<section class="card sec"><p class="note">Choisis un club, paie ton voyage (bus, train ou avion) et convaincs les recruteurs en trois moments clés.${age < 16 ? ' Avant 16 ans, un parent t\'accompagne : billets et hôtel comptent double.' : ''}</p>${cd ? '<p class="note bad">Tu rentres d\'un essai : attends quelques jours.</p>' : ''}<div class="note">Ton argent : <b>${eur(S.p.money)}</b> · ta note : <b>${o}</b></div></section>
    <div class="tabs2">${LEAGUES.map(l => `<button data-a="trialL" data-v="${l.id}" class="${l.id === lid ? 'on' : ''}">${l.name}</button>`).join('')}</div>
    <section class="card"><div class="list">${clubs.map(c => {
      const thr = age >= 20 ? proThr(c) : acadThr(c, age), gap = o - thr;
      const [cls, lab] = gap >= 3 ? ['diff-1', 'Accessible'] : gap >= -2 ? ['diff-2', 'Jouable'] : gap >= -7 ? ['diff-3', 'Difficile'] : ['diff-4', 'Très difficile'];
      const tr = travelOptions(c.id).sort((a, b) => a.cost - b.cost)[0], rule = joinRule(c.id);
      const recent = S.trialsDone.some(t => t.cid === c.id && absDay() - t.d < 180);
      return `<div class="it">${badge(c.n)}<div class="grow"><div style="font-weight:600;line-height:1.2">${esc(c.n)}</div><div class="note"><span class="${cls}">${lab}</span> · dès ${eur(tr.cost)}${rule.ok ? '' : ' · <span class="bad">18 ans requis</span>'}</div></div><button class="btn sm" data-a="tryClub" data-v="${c.id}" ${cd || recent || S.p.inj > 0 ? 'disabled' : ''}>${recent ? 'Vu' : 'Essai'}</button></div>`;
    }).join('')}</div></section><p class="note">${L.name} · ${L.country}</p>`;
}
function vAgent() {
  const a = S.agent; if (!UI.agentList) UI.agentList = agentCandidates();
  return `<section class="card sec"><div class="hd"><h3>Ton agent</h3>${a ? stars(a.stars) : ''}</div>
    ${a ? `<div class="row">${typeof portrait === 'function' ? `<div class="av lg pic">${portrait(a.n, { role: 'agent', age: 45 })}</div>` : ''}<div class="grow"><b>${esc(a.n)}</b><div class="note">${esc(a.t)} · commission ${dec(a.comm)} % · réseau ${Math.round(a.net * 50)}/100</div></div></div><button class="btn sm ghost" data-a="agentFire">Se séparer</button>` : '<p class="note">Sans agent, tu reçois moins d\'offres et tes salaires sont moins bien négociés.</p>'}</section>
    <section class="sec"><div class="hd"><h3>Candidats</h3><span class="note">Un parent, un ami ou un pro</span></div>
    ${UI.agentList.map((x, i) => `<div class="card row"><div class="grow"><b>${esc(x.n)}</b> ${stars(x.stars)}<div class="note">${esc(x.t)} · commission ${dec(x.comm)} % · réseau ${Math.round(x.net * 50)}/100 · négociation ${x.nego >= 0 ? '+' : ''}${Math.round(x.nego * 100)} %</div></div><button class="btn sm" data-a="agentSet" data-v="${i}" ${a && a.n === x.n ? 'disabled' : ''}>${a && a.n === x.n ? 'Actuel' : 'Choisir'}</button></div>`).join('')}</section>`;
}
function vNat() {
  const N = nation(), I = S.intl, y = S.season + 1;
  let nextT = ''; for (let yy = y; yy < y + 4; yy++) { const k = tourneyFor(yy, N.conf); if (k) { nextT = (k === 'WC' ? 'Coupe du monde ' : CONT_T[N.conf] + ' ') + yy; break; } }
  const tours = (S.W.tours || []).filter(T => T.inField);
  return `<section class="card sec"><div class="row">${badge(N.n, true)}<div class="grow"><h3>${N.n}</h3><div class="note">Sélectionneur : <b>${N.coach}</b></div></div></div>
    ${kv([['Sélections A', I.caps + ' (' + I.g + ' buts)'], ['Sélections jeunes', I.ycaps + ' (' + I.yg + ' buts)'], ['Dernier niveau', I.level ? (I.level === 'A' ? 'Équipe A' : I.level) : '—'], ['Coupes du monde jouées', I.wcs], ['Prochain tournoi', nextT || '—']])}
    <p class="note">Niveau habituel pour l'équipe A : environ <b>${N.thr}</b> (toi : ${OVR()}). Jouer régulièrement en club compte beaucoup. Convocations pendant les trêves de septembre, octobre, novembre et mars.</p></section>
    ${tours.map(T => `<section class="card sec"><h3>${esc(T.name)}</h3><p class="note">${T.done ? 'Vainqueur : ' + esc(natTeam(T.champ).n) + (T.out ? ' · ' + N.n + ' éliminée ' + T.out : '') : T.mine ? 'Tu fais partie de la liste.' : 'Tu n\'as pas été retenu.'}</p></section>`).join('')}
    <section class="card sec"><h3>Repères réels</h3><p class="note">Coupe du monde 2026 : ${REAL_FACTS.wc2026}. Ballon d'Or 2025 : ${REAL_FACTS.bdo2025}.</p>
    <div class="list">${Object.values(NATIONS).map(n => `<div class="it"><span class="grow">${n.n}</span><span class="note">${n.coach}</span></div>`).join('')}</div></section>`;
}
function zoneCls(L, i, n) {
  if (L.tier === 1) { if (i < (L.slots || 0)) return 'z-cl'; const P_ = PROMO[L.id]; if (P_) { if (i >= n - P_.down) return 'z-down'; if (P_.barrage && i === n - P_.down - 1) return 'z-bar'; } return ''; }
  const P_ = PROMO[L.cc]; if (i < 2) return 'z-up'; if (P_ && P_.barrage && i === 2) return 'z-bar'; if (P_ && !P_.barrage && i >= 2 && i < 6) return 'z-bar'; return '';
}
function vComps() {
  const lid = UI.tblL || (myClub() ? myClub().lid : (NAT_LEAGUE[S.p.nat] || 'FRA'));
  const L = L_BY(lid), T = S.W.leagues[lid].table, ord = leagueOrder(lid), ts = topScorers(lid, 8);
  const U = S.W.cl.UEFA;
  return `<div class="tabs2">${LEAGUES.map(l => `<button data-a="tblL" data-v="${l.id}" class="${l.id === lid ? 'on' : ''}">${l.name}</button>`).join('')}</div>
  <section class="card sec"><div class="hd"><h3>${L.name}</h3><span class="note">${L.country}${L.tier === 2 ? ' · 2e division' : ''}</span></div>
  <div class="tblw"><table><thead><tr><th>#</th><th>Club</th><th>J</th><th>Diff</th><th>Pts</th><th>Forme</th></tr></thead><tbody>${ord.map((id, i) => { const r = T[id]; return `<tr class="${id === S.club.id ? 'me' : ''} ${zoneCls(L, i, ord.length)}"><td>${i + 1}</td><td class="cl">${esc(club(id).n)}</td><td>${r.p}</td><td>${r.gf - r.ga > 0 ? '+' : ''}${r.gf - r.ga}</td><td><b>${r.pts}</b></td><td><span class="form">${r.f.map(f => `<i class="${f}"></i>`).join('')}</span></td></tr>`; }).join('')}</tbody></table></div>
  <div class="legend">${L.tier === 1 && L.slots ? `<span><i class="zl z-cl"></i>${CONT_CUP[L.cont]}</span>` : ''}${L.tier === 2 ? '<span><i class="zl z-up"></i>Montée</span>' : ''}${PROMO[L.cc] ? `<span><i class="zl z-bar"></i>${PROMO[L.cc].barrage ? 'Barrage' : (L.tier === 2 ? 'Play-offs' : '')}</span>` : ''}${L.tier === 1 && PROMO[L.id] ? '<span><i class="zl z-down"></i>Relégation</span>' : ''}</div></section>
  <section class="card sec"><div class="hd"><h3>Buteurs</h3></div><div class="list">${ts.map((x, i) => `<div class="it ${x.me ? 'me' : ''}"><span class="num dim" style="width:18px">${i + 1}</span><span class="grow">${esc(x.n)} <span class="note">${esc(x.c)}</span></span><b class="num">${x.g}</b></div>`).join('')}</div></section>
  <section class="card sec"><div class="hd"><h3>Coupes continentales</h3></div>
    ${kv(['UEFA', 'AFC', 'CONCACAF'].map(k => { const C = S.W.cl[k]; return [CONT_CUP[k], C.winner ? 'Vainqueur : ' + esc(team(C.winner).n) : k === 'UEFA' && !C.lpDone ? 'Phase de ligue' : C.pairs ? KO_N[C.key] : 'En cours']; }))}
    ${U.lpDone && U.rank ? `<details><summary class="note">Classement de la phase de ligue</summary><div class="list">${U.rank.slice(0, 36).map((id, i) => `<div class="it ${id === S.club.id ? 'me' : ''}"><span class="num dim" style="width:22px">${i + 1}</span><span class="grow">${esc(team(id).n)}</span><span class="note">${i < 8 ? '8es' : i < 24 ? 'Barrages' : 'Éliminé'}</span></div>`).join('')}</div></details>` : ''}
    ${U.pairs && U.pairs.length ? `<div class="list">${U.pairs.map(([a, b]) => `<div class="it ${a === S.club.id || b === S.club.id ? 'me' : ''}"><span class="grow">${esc(team(a).n)} – ${esc(team(b).n)}</span></div>`).join('')}</div>` : ''}</section>
  <section class="card sec"><div class="hd"><h3>Coupes nationales</h3></div>${kv(TOP.map(L2 => { const cp = S.W.cups[L2.id]; return [L2.cup, cp.winner ? esc(club(cp.winner).n) : 'En cours']; }))}</section>`;
}
function vTrophyBlock() {
  if (!S.trophies.length && !S.awards.length) return '<section class="card"><p class="note">Pas encore de trophée. Le premier sera le plus beau.</p></section>';
  const g = {}; for (const t of S.trophies) (g[t.t] = g[t.t] || []).push(t.s);
  return `<section class="card sec"><div class="hd"><h3>Trophées</h3><span class="note">${S.trophies.length}</span></div><div class="troph">${Object.entries(g).map(([n, ss]) => `<div>${typeof trophyIcon === 'function' ? trophyIcon(n, 38) : ''}<b>${ss.length > 1 ? ss.length + ' × ' : ''}${esc(n)}</b><span class="note">${ss.join(', ')}</span></div>`).join('')}</div>
  ${S.awards.length ? `<div class="list">${S.awards.map(a => `<div class="it"><span class="grow">${esc(a.t)}</span><span class="note">${a.s}</span></div>`).join('')}</div>` : ''}</section>`;
}
function vHistTable() {
  const rows = S.hist.slice(); if (S.ss.apps) rows.push(Object.assign(histRow(), { cur: true }));
  return `<section class="card sec"><div class="hd"><h3>Carrière</h3></div><div class="tblw"><table><thead><tr><th>Saison</th><th>Club</th><th>M</th><th>B</th><th>PD</th><th>Note</th></tr></thead><tbody>${rows.map(h => `<tr class="${h.cur ? 'me' : ''}"><td>${h.s}</td><td class="cl">${esc(h.c)}</td><td>${h.ap}</td><td>${h.g}</td><td>${h.a}</td><td>${h.avg ? dec(h.avg) : '–'}</td></tr>`).join('') || '<tr><td colspan="6" class="note">Ta carrière commence.</td></tr>'}</tbody></table></div></section>`;
}
function vStats() {
  const s = S.ss, avg = s.apps ? dec(s.rs / s.apps, 2) : '–', st = S.stats;
  return `<section class="card sec"><div class="hd"><h3>Saison ${seasonLabel(S.season)}</h3><span class="note">${esc(S.club.n)}</span></div><div class="statg">${[['Matchs', s.apps], ['Buts', s.g], ['Passes D', s.a], ['Note moy.', avg]].map(([k, v]) => `<div><div class="lbl">${k}</div><div class="big">${v}</div></div>`).join('')}</div>${s.cl.apps ? `<p class="note">Coupe continentale : ${s.cl.apps} matchs, ${s.cl.g} buts.</p>` : ''}</section>
  <section class="card sec"><div class="hd"><h3>Records en pro</h3></div>${kv([['Matchs pro', st.proApps], ['Buts pro', st.proGoals], ['Clean sheets', st.cs], ['Triplés', st.hat], ['Notes de 10', st.tens], ['Buts en derby', st.derbyGoals], ['Championnats joués', st.leagues.map(l => L_BY(l).name).join(', ') || '—'], ['Score de légende', legendScore() + ' · ' + legendTitle(legendScore())]])}</section>
  ${vTrophyBlock()}${vHistTable()}`;
}
function vWorld() {
  const H = S.W.hist.filter(h => h.champs).slice().reverse();
  return `<section class="sec"><div class="card list news">${S.news.slice(0, 30).map(n => `<div class="it" style="display:block"><div class="t">${esc(n.t)} · <span class="dim">${n.d}</span></div><div>${esc(n.x)}</div></div>`).join('')}</div></section>
  ${H.length ? `<section class="card sec"><div class="hd"><h3>Palmarès des saisons</h3></div><div class="list">${H.slice(0, 15).map(h => `<div class="it" style="display:block"><div class="lbl acc">${h.s}</div><div class="note">LDC : <b>${esc(h.ucl)}</b> · ${TOP.slice(0, 5).map(l => esc(h.champs[l.id])).join(' · ')}</div>${(h.promo || []).map(x => `<div class="note dim">${esc(x)}</div>`).join('')}</div>`).join('')}</div></section>` : ''}`;
}

// ---------- Vie ----------
function vMoney() {
  const M = S.month, net = M.inc - M.exp;
  return `<section class="card sec"><div class="lbl">Fortune totale</div><div class="big">${eur(wealth())}</div>
    ${kv([['Argent disponible', eur(S.p.money)], S.club.wage ? [S.club.kind === 'academy' ? 'Indemnité' : 'Salaire', eur(monthly(S.club.wage)) + ' / mois'] : null, S.agent && S.club.wage ? ['Commission agent', dec(S.agent.comm) + ' %'] : null, rentWeek() ? ['Loyer', eur(monthly(rentWeek())) + ' / mois'] : null])}</section>
  <section class="card sec"><div class="hd"><h3>Ce mois-ci</h3><span class="note">${cap(MONTHS[today().getMonth()])}</span></div>
    ${M.lines.length ? M.lines.slice().sort((a, b) => b[1] - a[1]).map(([w, v]) => `<div class="mline"><span>${esc(w)}</span><b class="${v >= 0 ? 'ok' : 'bad'}">${v >= 0 ? '+' : ''}${eur(v)}</b></div>`).join('') : '<p class="note">Aucun mouvement pour l\'instant.</p>'}
    <div class="mline tot"><span>Solde</span><b class="${net >= 0 ? 'ok' : 'bad'}">${net >= 0 ? '+' : ''}${eur(net)}</b></div>
    ${S.club.wage ? '<p class="note">Le salaire est versé le dernier jour du mois.</p>' : ''}</section>
  ${S.assets.spons.length ? `<section class="card sec"><h3>Sponsors</h3><div class="list">${S.assets.spons.map(s => `<div class="it"><span class="grow"><b>${esc(s.n)}</b> <span class="note">${s.t} · jusqu'au ${shortDate(dateFromAbs(s.end))}</span></span><span class="num">${eur(monthly(s.wk))}/mois</span></div>`).join('')}</div></section>` : ''}
  ${S.club.kind === 'amateur' ? `<section class="card sec"><div class="hd"><h3>Petits boulots</h3></div><p class="note">Pour payer tes essais et ton matériel. Ça fatigue et ça prend une journée d'entraînement. Planifie-les dans l'agenda.</p><div class="list">${JOBS.map(j => `<div class="it"><div class="grow"><b>${j.n}</b><div class="note">${j.pay} € la journée · ${j.e} énergie · dès ${j.age} ans</div></div></div>`).join('')}</div><button class="btn wide" data-a="tab" data-v="agenda">Ouvrir l'agenda</button></section>` : ''}`;
}
function vFamily() {
  const f = S.fam, wl = ['Modeste', 'Classe moyenne', 'Aisée'][f.w];
  return `<section class="card sec"><div class="hd"><h3>Tes parents</h3><span class="chip line">${wl}</span></div>
    ${typeof portrait === 'function' ? `<div class="famrow">${[['Père', f.dad, false], ['Mère', f.mom, true]].map(([t, x, fe]) => `<div class="famp"><div class="av lg pic">${portrait(x.n, { f: fe, role: 'family', age: x.age, skinSeed: 'fam' + S.p.last })}</div><span class="note">${t}</span></div>`).join('')}</div>` : ''}
    ${[['Père', f.dad], ['Mère', f.mom]].map(([t, x]) => gauge(`${t} · ${esc(x.n)} · ${x.age} ans`, x.rel, 'ok')).join('')}
    ${gauge('Soucis d\'argent à la maison', f.stress, 'bad')}
    ${kv([['Économies familiales', eur(f.savings)], ['Sacrifices faits pour toi', f.sac + ' / 3'], f.house ? ['Maison offerte', '<span class="gold">Oui</span>'] : null])}
    <div class="row wrap"><button class="btn sm" data-a="ask">Demander de l'argent</button>${S.club.kind !== 'pro' && f.sac < 3 ? '<button class="btn sm" data-a="sac">Ils se sacrifient pour toi…</button>' : ''}</div>
    <p class="note">Plus la famille est modeste, plus chaque billet de train compte. Un jour, tu pourras leur rendre tout ça. Ajoute « Temps en famille » dans l'agenda pour garder le lien.</p></section>
  <section class="card sec"><div class="hd"><h3>Cadeaux</h3></div><div class="list">${SHOP.gifts.map(g => { const done = (g.id === 'gparents' || g.id === 'gvilla') && f.house || g.id === 'gfriend' && S.friend.house || g.id === 'gcar' && f.car; return `<div class="it"><div class="grow"><b>${g.n}</b><div class="note num">${eur(g.p)}</div></div><button class="btn sm" data-a="buy" data-v="gifts:${g.id}" ${done || S.p.money < g.p ? 'disabled' : ''}>${done ? 'Offert' : 'Offrir'}</button></div>`; }).join('')}</div></section>`;
}
function vLove() {
  const L = S.love;
  if (!L) return `<section class="card sec"><h3>Célibataire</h3><p class="note">Les rencontres arrivent au fil de la vie, dès 16 ans : soirées, sorties, popularité… Plus tu sors et plus tu es connu, plus les occasions se présentent.</p><button class="btn wide" data-a="tab" data-v="agenda">Planifier une sortie entre amis</button></section>`;
  const st = { date: 'Vous vous fréquentez', couple: 'En couple', live: 'Vous vivez ensemble', married: 'Mariés' }[L.st];
  const canMarry = L.st === 'live' && L.rel >= 80 && S.p.age >= 21;
  return `<section class="card sec"><div class="row"><div class="av lg pic">${typeof portrait === 'function' ? portrait(L.n, { f: S.pref !== 'M', role: 'love', age: S.p.age }) : esc(L.n[0])}</div><div class="grow"><h3>${esc(L.n)}</h3><div class="note">${st} depuis le ${shortDate(dateFromAbs(L.since))}</div></div></div>
    ${gauge('Relation', L.rel, L.rel < 30 ? 'bad' : 'ok')}
    ${L.kids.length ? `<div class="note">Enfant${L.kids.length > 1 ? 's' : ''} : ${L.kids.map(k => esc(k.n) + ' (' + k.y + ')').join(', ')}</div>` : ''}${L.baby ? '<div class="note acc">Un bébé est en route !</div>' : ''}
    <p class="note">Un rendez-vous dans l'agenda renforce votre couple. Sans attention, la relation s'use chaque semaine.</p>
    <div class="stack" style="gap:8px"><button class="btn wide" data-a="tab" data-v="agenda">Planifier un rendez-vous</button>${L.st === 'live' ? `<button class="btn wide" data-a="marry" ${canMarry ? '' : 'disabled'}>Demander en mariage${canMarry ? '' : ' (relation 80+ et 21 ans)'}</button>` : ''}<button class="btn wide ghost danger" data-a="breakup">Rompre</button></div></section>`;
}
function vFriends() {
  const F = S.friend;
  return `<section class="card sec"><div class="row"><div class="av lg pic">${typeof portrait === 'function' ? portrait(F.n, { role: 'friend', age: S.p.age }) : esc(F.n[0])}</div><div class="grow"><h3>${esc(F.n)}</h3><div class="note">Ton meilleur ami depuis l'enfance${F.house ? ' · tu lui as offert un appartement' : ''}</div></div></div>${gauge('Amitié', F.rel, 'info')}
    <p class="note">Une sortie entre amis remonte le moral. Il peut aussi devenir ton agent (Carrière → Agent).</p><button class="btn wide" data-a="tab" data-v="agenda">Planifier une sortie</button></section>`;
}
function vAssets() {
  const A = S.assets, minor = S.p.age < 18;
  return `<section class="card sec"><div class="hd"><h3>Tes biens</h3></div>${A.houses.length + A.cars.length ? `<div class="list">${A.houses.map((h, i) => `<div class="it"><span class="grow">${esc(h.n)}</span><button class="btn sm ghost" data-a="sell" data-v="houses:${i}">Vendre ${eur(h.p * .9)}</button></div>`).join('')}${A.cars.map((c, i) => `<div class="it"><span class="grow">${esc(c.n)}</span><button class="btn sm ghost" data-a="sell" data-v="cars:${i}">Vendre ${eur(c.p * .5)}</button></div>`).join('')}</div>` : '<p class="note">Rien pour l\'instant.</p>'}${minor ? '<p class="note">Logement et voiture : à partir de 18 ans. Voiture : permis obligatoire.</p>' : ''}${S.club.kind === 'pro' && !A.houses.length ? '<p class="note">Tu es locataire : un loyer est prélevé chaque mois.</p>' : ''}</section>
  ${['houses', 'cars'].map(cat => `<section class="card sec"><h3>${cat === 'houses' ? 'Immobilier' : 'Voitures'}</h3><div class="list">${SHOP[cat].map(it => `<div class="it"><div class="grow"><b>${it.n}</b><div class="note num">${eur(it.p)}</div></div><button class="btn sm" data-a="buy" data-v="${cat}:${it.id}" ${minor || S.p.money < it.p || (cat === 'cars' && !S.permis.ok) ? 'disabled' : ''}>Acheter</button></div>`).join('')}</div></section>`).join('')}`;
}
function vInvest() {
  const A = S.assets, m = S.p.money;
  const row = (k, n, d) => `<div class="it" style="flex-wrap:wrap"><div class="grow"><b>${n}</b><div class="note">${d}</div></div><b class="num">${eur(A[k])}</b><div class="row" style="width:100%;gap:6px"><button class="btn sm grow" data-a="inv" data-v="${k}:.1" ${m < 10 ? 'disabled' : ''}>+10 %</button><button class="btn sm grow" data-a="inv" data-v="${k}:.5" ${m < 10 ? 'disabled' : ''}>+50 %</button><button class="btn sm grow ghost" data-a="wd" data-v="${k}" ${A[k] < 1 ? 'disabled' : ''}>Tout retirer</button></div></div>`;
  return `<section class="card sec"><h3>Placements</h3><p class="note">Les pourcentages portent sur ton argent disponible (${eur(m)}).</p><div class="list">${row('liv', 'Livret d\'épargne', 'Sans risque · environ 2 % par an')}${row('etf', 'Actions (fonds indiciel)', 'Environ 7 % par an, avec des hauts et des bas')}${row('cry', 'Cryptomonnaies', 'Très risqué : tu peux tout perdre… ou exploser')}</div></section>
  <section class="card sec"><div class="hd"><h3>Immobilier locatif</h3><span class="note">400 000 € le bien</span></div><p class="note">Environ 4 % de loyers par an, versés chaque mois.</p>${A.immo.length ? `<div class="list">${A.immo.map(i => `<div class="it"><span class="grow">${esc(i.n)}</span><span class="num">${eur(i.v)}</span></div>`).join('')}</div>` : ''}<button class="btn sm" data-a="immo" ${m < 400000 || S.p.age < 18 ? 'disabled' : ''}>Acheter un bien</button></section>
  <section class="card sec"><h3>Start-up</h3><p class="note">Pari risqué : multiplication par 6 à 12 possible, ou faillite. Résultat en 1 à 2 ans.</p>${A.st.filter(s => !s.done).map(s => `<div class="note">${esc(s.n)} · ${eur(s.amt)} investis</div>`).join('')}<div class="row wrap">${[50000, 250000, 1000000].map(v => `<button class="btn sm" data-a="st" data-v="${v}" ${m < v ? 'disabled' : ''}>${eur(v)}</button>`).join('')}</div></section>`;
}
function vStaff() {
  return `<section class="card sec"><p class="note">Ton équipe personnelle, payée chaque mois. Elle s'arrête automatiquement si ton compte passe dans le rouge.</p><div class="list">${SERVICES.map(s => { const on = has(s.id); return `<div class="it"><div class="grow"><b>${s.n}</b><div class="note">${s.d} · ${s.once ? eur(s.p) + ' une fois' : eur(monthly(s.wk)) + ' / mois'}</div></div><button class="btn sm ${on ? '' : 'ghost'}" data-a="serv" data-v="${s.id}" ${on && s.once ? 'disabled' : ''}>${on ? (s.once ? 'Acheté' : 'Arrêter') : 'Prendre'}</button></div>`; }).join('')}</div></section>`;
}
function vSchool() {
  const sc = S.school, pm = S.permis, a = S.p.age;
  return `<section class="card sec"><div class="hd"><h3>Le bac, ton plan B</h3><span class="chip ${sc.bac ? 'ok' : 'line'}">${sc.bac ? 'Obtenu' : sc.done ? 'Terminé' : 'En cours'}</span></div>
    ${!sc.done ? `${gauge('Niveau scolaire', sc.lvl, 'info')}<p class="note">Examen en juin, dès 17 ans. Ajoute « Réviser les cours » dans l'agenda. Le niveau baisse un peu chaque semaine sans travail.</p>` : `<p class="note">${sc.bac ? 'Ton bac t\'ouvre des portes après le foot.' : 'Tu n\'as pas le bac. Le foot reste ton chemin.'}</p>`}</section>
  <section class="card sec"><div class="hd"><h3>Permis de conduire</h3><span class="chip ${pm.ok ? 'ok' : 'line'}">${pm.ok ? 'Obtenu' : pm.h + ' h de conduite'}</span></div>
    ${pm.ok ? '<p class="note">Tu peux acheter et conduire ta voiture.</p>' : `<p class="note">${a < 17 ? 'Possible dès 17 ans.' : 'Leçons de 2 h à 50 € via l\'agenda (« Leçon de conduite »). Examen à partir de 20 h : 120 €.'}${pm.tries ? ' Tentatives : ' + pm.tries + '.' : ''}</p>${bar(Math.min(100, pm.h / 20 * 100), 'info')}<button class="btn wide" data-a="permis" ${a < 17 || pm.h < 20 ? 'disabled' : ''}>Passer l'examen (120 €)</button>`}</section>`;
}

// ---------- Profil ----------
function vSheet() {
  if (isCoach()) return `<section class="card sec"><h3>Ta carrière de joueur</h3>${kv([['Matchs pro', S.stats.proApps], ['Buts pro', S.stats.proGoals], ['Sélections', S.intl.caps], ['Score de légende', legendScore() + ' · ' + legendTitle(legendScore())]])}</section>${vTrophyBlock()}${vHistTable()}`;
  const p = S.p, key = POSW[p.pos], lg = S.lastDay ? S.lastDay.gains : {};
  const attrs = ATTR.filter(k => k !== 'GAR' || p.pos === 'GB');
  return `<section class="card sec"><div class="row"><div class="grow"><h3>${esc(pName())}</h3><div class="note">${POS_N[p.pos]} · ${p.age} ans · pied ${p.foot.toLowerCase()} · ${nation().n}</div></div><div class="ovr"><div class="v num">${OVR()}</div><div class="k">Note</div></div></div>
    ${kv([['Potentiel', stars(potStars())], ['Valeur', eur(marketValue(OVR(), p.age))], ['Réputation', Math.round(p.rep) + ' / 100'], ['Popularité', Math.round(p.pop) + ' / 100'], ['Anniversaire', shortDate(dateAt(S.season, p.bweek, 6)).replace(/ \d{4}$/, '')]])}</section>
  <section class="card sec"><div class="hd"><h3>Attributs</h3><span class="note">En orange : clés pour ton poste</span></div>
    <div class="attrs">${attrs.map(k => `<div class="attr ${key[k] ? 'key' : ''}"><div class="t"><span>${ATTR_N[k]}</span><b class="num">${Math.floor(p.at[k])}</b></div>${bar(p.at[k], key[k] ? '' : 'info')}</div>`).join('')}</div>
    <p class="note">La progression est rapide jeune et ralentit près de ton potentiel. Après 30 ans, le physique décline.</p></section>`;
}
function vCard() {
  return `<section class="card sec center"><p class="note">Ta carte de joueur, à partager. Sur iPhone : appui long sur l'image, puis « Enregistrer dans Photos ».</p>${UI.cardImg ? `<img class="cardimg" src="${UI.cardImg}" alt="Carte joueur de ${esc(pName())}">` : '<div class="cardph">Génération…</div>'}<button class="btn wide" data-a="card">Régénérer la carte</button></section>`;
}
function vSocial() {
  const p = S.p, posted = S.postWeek === weekKey();
  return `<section class="card sec"><div class="row"><div class="av lg acc">${esc((p.first[0] || '?') + (p.last[0] || ''))}</div><div class="grow"><b>${esc(handle())}</b><div class="note">${esc(S.club.n)}</div></div></div>
    <div class="row between"><div><div class="lbl">Abonnés</div><div class="big">${fnum(p.followers)}</div></div><div style="text-align:right"><div class="lbl">Valeur</div><div class="mid num">${eur(marketValue(OVR(), p.age))}</div></div></div>
    ${gauge('Popularité auprès des fans', p.pop, 'ok')}${gauge('Réputation dans le football', p.rep, 'info')}</section>
  <section class="sec"><div class="hd"><h3>Publier</h3><span class="note">${posted ? 'Déjà publié cette semaine' : '1 publication par semaine'}</span></div>
    <div class="opts two">${Object.keys(POSTS).map(k => { const x = POSTS[k]; const ok = !posted && (!x.need || x.need()); return `<button class="opt" data-a="post" data-v="${k}" ${ok ? '' : 'disabled'}><b>${x.n}</b><span>${x.d}</span></button>`; }).join('')}</div></section>
  <section class="card sec"><div class="hd"><h3>Fil d'actualité</h3></div><div>${S.feed.slice(0, 20).map(f => `<div class="post ${f.k === 'me' ? 'me' : ''}"><div class="av">${esc(f.w.replace('@', '').slice(0, 2).toUpperCase())}</div><div class="grow"><div><b>${esc(f.w)}</b> <span class="note">${f.d}</span></div><div>${esc(f.x)}</div></div></div>`).join('') || '<p class="note">Rien pour l\'instant.</p>'}</div></section>`;
}
function vAch() {
  return `<div class="achg">${ACH.map(([id, n, d]) => { const ok = S.ach[id]; return `<div class="ach ${ok ? 'on' : ''}">${icon(ok ? 'medal' : 'star')}<b>${n}</b><span>${d}</span>${ok ? `<i>${ok}</i>` : ''}</div>`; }).join('')}</div>`;
}
function vInbox() {
  return `${S.inbox.length ? `<button class="btn sm ghost" data-a="msgAll">Tout marquer comme lu</button><div class="card list">${S.inbox.map((m, i) => `<button class="it msg ${m.read ? '' : 'unread'}" data-a="msg" data-v="${i}"><span class="mdot"></span><span class="grow"><b>${esc(m.t)}</b><span class="note">${m.d}</span></span><span class="chev">›</span></button>`).join('')}</div>` : '<p class="note center">Aucun message.</p>'}`;
}
function vBdo() {
  const H = S.W.hist.filter(h => h.bdo).slice().reverse();
  return `<section class="card sec"><p class="note">Cérémonie chaque fin octobre. Ballon d'Or 2025 : ${REAL_FACTS.bdo2025}. L'édition 2026 (${REAL_FACTS.bdo2026date}) est simulée dans le jeu.</p>
    ${S.bdo.length ? `<div class="list">${S.bdo.slice().reverse().map(b => `<div class="it"><span class="num" style="width:44px">${b.y}</span><span class="grow">${esc(b.w)}</span><span class="note">${b.rank === 1 ? '<b class="gold">Toi !</b>' : b.rank ? 'Toi : ' + b.rank + 'e' : ''}</span></div>`).join('')}</div>` : '<p class="note">Aucune cérémonie depuis le début de ta carrière.</p>'}</section>`;
}
function vSaves() {
  const m = slotsMeta(), inGame = UI.screen === 'game' && S;
  return `<section class="stack">${[1, 2, 3].map(n => { const x = m[n], cur = inGame && (S.slot || 1) === n; return `<div class="card slot ${cur ? 'cur' : ''}"><div class="row"><div class="slotn">${n}</div><div class="grow">${x ? `<b>${esc(x.name)}</b><div class="note">${esc(x.club)} · ${x.age} ans · note ${x.ovr} · ${esc(x.date)}${x.over ? ' · carrière terminée' : ''}</div>` : '<span class="note">Emplacement vide</span>'}</div>${cur ? '<span class="chip acc">En cours</span>' : ''}</div>
      ${x && !cur ? `<div class="row"><button class="btn sm grow" data-a="loadSlot" data-v="${n}">Charger</button><button class="btn sm ghost" data-a="delSlot" data-v="${n}">Supprimer</button></div>` : ''}</div>`; }).join('')}</section>
    ${inGame ? '<div class="stack" style="gap:8px"><button class="btn wide" data-a="saveNow">Sauvegarder maintenant</button><button class="btn wide" data-a="export">Exporter ma carrière (code)</button></div>' : ''}
    <section class="card sec"><h3>Importer un code</h3><p class="note">Colle le code d'une carrière exportée (depuis un autre appareil ou navigateur).</p><textarea id="impCode" rows="3" placeholder="CDO2…" autocomplete="off" spellcheck="false"></textarea><div class="row">${[1, 2, 3].map(n => `<button class="btn sm grow" data-a="import" data-v="${n}">Vers l'emplacement ${n}</button>`).join('')}</div></section>
    <p class="note">La partie est sauvegardée automatiquement dans ce navigateur. Exporte un code de temps en temps pour ne rien perdre.</p>`;
}
// voix IA : fournisseur, clé API (gardée sur l'appareil), voix, mode économique, consommation
function vAiVoice() {
  const P = OPTS.aiv || 'off', k = typeof aivKey === 'function' ? aivKey() : '', seg = (a, v, l, on) => `<button data-a="${a}" data-v="${v}" class="${on ? 'on' : ''}">${l}</button>`;
  let h = `<p class="note">Lo Sol et Nathalie parlent avec de vraies voix humaines générées par une IA, au lieu des voix du téléphone. Il te faut un compte et une clé API chez OpenAI ou ElevenLabs : c'est payant à l'usage, sur ton compte.</p>
  <div class="seg">${seg('aivProv', 'off', 'Désactivé', P === 'off')}${seg('aivProv', 'openai', 'OpenAI', P === 'openai')}${seg('aivProv', 'eleven', 'ElevenLabs', P === 'eleven')}</div>`;
  if (P === 'off') return h;
  const sel = (id, label, cur, opts) => `<div class="vpick"><label class="lbl" for="${id}">${label}</label><div class="vrow"><select id="${id}">${opts.map(([v, l]) => `<option value="${esc(v)}"${cur === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></div></div>`;
  h += `<div class="vpick"><label class="lbl" for="aivKeyIn">Clé API ${P === 'openai' ? 'OpenAI' : 'ElevenLabs'}</label><div class="vrow"><input id="aivKeyIn" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${k ? 'Clé enregistrée ••••' + esc(k.slice(-4)) : 'Colle ta clé ici'}"><button class="btn sm" data-a="aivSaveKey">Enregistrer</button>${k ? '<button class="btn sm" data-a="aivDelKey">Effacer</button>' : ''}</div></div>`;
  if (P === 'openai') {
    const L = AIV_OAI.map(v => [v, v[0].toUpperCase() + v.slice(1) + (v === 'cedar' || v === 'marin' ? ' (recommandée)' : '')]);
    h += sel('aivS', 'Voix de Lo Sol', OPTS.aivS || 'cedar', L) + sel('aivN', 'Voix de Nathalie', OPTS.aivN || 'marin', L);
  } else {
    h += sel('aivM', 'Modèle', OPTS.aivM || 'eleven_flash_v2_5', AIV_ELM);
    const V = OPTS.aivEL || [];
    if (V.length) { const au = w => { const keep = [OPTS.aivS, OPTS.aivN]; OPTS.aivS = OPTS.aivN = ''; const id = aivVoice(w); [OPTS.aivS, OPTS.aivN] = keep; const f = V.find(v => v.id === id); return f ? ' (' + f.n + ')' : id === AIV_EL_DEF[w] ? ' (ta voix créée)' : ''; }, L = [['', 'Automatique'], ...V.map(v => [v.id, v.n + (v.g ? ' · ' + (v.g === 'male' ? 'homme' : v.g === 'female' ? 'femme' : v.g) : '') + (v.a ? ' · ' + v.a : '')])]; h += sel('aivS', 'Voix de Lo Sol', OPTS.aivS || '', [['', 'Automatique' + au('S')], ...L.slice(1)]) + sel('aivN', 'Voix de Nathalie', OPTS.aivN || '', [['', 'Automatique' + au('N')], ...L.slice(1)]); }
    if (!V.length && AIV_EL_DEF.S) h += `<p class="note">Lo Sol parle avec ta voix créée sur ElevenLabs. Charge tes voix pour choisir aussi celle de Nathalie.</p>`;
    h += `<div class="vrow"><button class="btn sm" data-a="aivLoad"${k ? '' : ' disabled'}>${V.length ? 'Recharger mes voix' : 'Charger mes voix ElevenLabs'}</button></div><p class="note">Astuce : ajoute à ta bibliothèque ElevenLabs des voix françaises (Voice Library, par exemple un commentateur sportif pour Lo Sol), puis recharge.</p>`;
  }
  h += `<div class="seg">${seg('aivMode', 'all', 'Tout le commentaire', OPTS.aivMode !== 'eco')}${seg('aivMode', 'eco', 'Économique', OPTS.aivMode === 'eco')}</div>
  <div class="vrow"><button class="btn sm" data-a="vTest" data-v="S"${k ? '' : ' disabled'}>Écouter Lo Sol</button><button class="btn sm" data-a="vTest" data-v="N"${k ? '' : ' disabled'}>Écouter Nathalie</button></div>`;
  if (typeof pkStat === 'function' && k) {
    const st = pkStat(), sg = sfxGenCount(), full = st.tot && st.ok >= st.tot;
    h += `<div class="pack"><div class="lbl">Pack de voix · hors connexion</div><p class="note">Les ${st.tot} répliques fixes de Lo Sol et Nathalie (histoires, réactions, analyses) sont fabriquées une seule fois avec ta clé puis gardées sur ce téléphone : elles partent sans attendre, même sans réseau, et ne sont plus jamais facturées.</p>
    <div class="pkbar"><i id="pkBar" style="width:${PK.run ? (PK.tot ? PK.n / PK.tot * 100 : 0).toFixed(1) : (st.tot ? st.ok / st.tot * 100 : 0).toFixed(1)}%"></i></div>
    <p class="note"><b>${st.ok} / ${st.tot}</b> répliques prêtes pour ces voix${full ? ' ✓' : ` · reste environ ${st.chars.toLocaleString('fr-FR')} caractères à fabriquer`}.</p>
    <div class="vrow">${PK.run ? '<button class="btn sm" data-a="pkStop">Mettre en pause</button>' : `<button class="btn sm" data-a="pkRun"${full ? ' disabled' : ''}>${st.ok ? 'Compléter le pack' : 'Télécharger le pack de voix'}</button>`}</div>
    ${P === 'eleven' ? `<div class="lbl">Bruitages réalistes</div><p class="note">Frappe, poteau, filet, sifflets, tacle, arrêt du gardien et vitre qui casse, créés par ElevenLabs Sound Effects (quelques centaines de crédits, une seule fois). <b>${sg} / ${SFXG.length}</b> prêts.</p><div class="vrow"><button class="btn sm" data-a="sfxGen"${PK.run || sg >= SFXG.length ? ' disabled' : ''}>${sg ? 'Compléter les bruitages' : 'Créer les bruitages'}</button></div>` : ''}
    <p class="note" id="pkProg">${esc(PK.run ? '' : PK.err || '')}</p></div>
    <div class="lbl">Les autres voix</div><p class="note">Le speaker du stade annonce les buts, ton coach te parle à la mi-temps, la journaliste pose ses questions avant le match, ton agent lit ses messages.${P === 'eleven' ? ` Voix choisies : ${['P', 'C', 'A', 'J'].map(w => VOX[w] + ' (' + (VOX_ELN[w] || '') + ')').join(', ')} ; si l'une n'est pas disponible sur ton compte, le jeu prend une de tes voix.` : ''}</p>
    <div class="vrow wrap">${['P', 'C', 'A', 'J'].map(w => `<button class="btn sm" data-a="vTest" data-v="${w}">${VOX[w]}</button>`).join('')}</div>`;
  }
  const U = OPTS.aivUse && OPTS.aivUse.m === new Date().toISOString().slice(0, 7) ? OPTS.aivUse.c : 0;
  if (AIV.dead) h += `<div class="alert"><span class="grow"><b>Voix IA en pause</b><span>${esc(AIV.dead)}</span></span><button class="btn sm" data-a="aivRetry">Réessayer</button></div>`;
  if (AIV.last) h += `<p class="note">Dernière erreur du fournisseur : ${esc(AIV.last)}</p>`;
  h += `<p class="note">Ce mois-ci : ${U.toLocaleString('fr-FR')} caractères envoyés. Un match regardé en entier en ×1 en consomme environ 13 000 à 16 000 (environ 4 500 en mode économique, qui ne garde que les temps forts et les histoires) ; les répliques déjà entendues sont gardées sur le téléphone et ne sont pas refacturées. Ta clé reste sur ce téléphone, n'est envoyée qu'à ${P === 'openai' ? 'OpenAI' : 'ElevenLabs'} et n'apparaît pas dans les sauvegardes exportées. Pense à fixer un plafond de dépenses sur ton compte. La voix IA marche dans la version Netlify/GitHub ; si la page publiée ici bloque l'appel, le jeu repasse tout seul aux voix du téléphone.</p>`;
  return h;
}
// choix des voix des commentateurs (voix françaises installées sur l'appareil)
function vVoicePick() {
  if (typeof sayInit !== 'function' || !sayInit()) return '<p class="note">La synthèse vocale n\'est pas disponible sur ce navigateur.</p>';
  sayPick(); const L = sayVoices().slice().sort((a, b) => sayQual(b) - sayQual(a) || a.name.localeCompare(b.name));
  const tag = v => ({ 3: ' · premium', 2: ' · améliorée', 1: '', 0: ' · de base', '-1': ' · gadget' })[sayQual(v)] + (/^fr[-_]FR/i.test(v.lang) ? '' : ' · ' + v.lang.slice(3));
  const sel = (id, cur, who) => `<div class="vpick"><label class="lbl" for="${id}">Voix de ${who === 'N' ? 'Nathalie' : 'Lo Sol'}</label><div class="vrow"><select id="${id}"><option value="">Automatique${(who === 'N' ? SAY.voice2 : SAY.voice) ? ' (' + esc((who === 'N' ? SAY.voice2 : SAY.voice).name) + ')' : ''}</option>${L.map(v => `<option value="${esc(v.voiceURI)}"${cur === v.voiceURI ? ' selected' : ''}>${esc(v.name + tag(v))}</option>`).join('')}</select><button class="btn sm" data-a="vTest" data-v="${who}">Écouter</button></div></div>`;
  const bestQ = L.length ? Math.max(...L.map(sayQual)) : -2;
  const hint = bestQ < 2 ? `<details class="alert vhelp"><summary><b>Voix robotiques ?</b> <span class="note">· toucher pour l'astuce</span></summary><span>Ton téléphone n'a que des voix de base. Sur iPhone : Réglages › Accessibilité › Contenu énoncé › Voix › Français, puis télécharge une voix « améliorée » ou « premium » (par exemple Thomas pour Lo Sol, Audrey ou Aurélie pour Nathalie). Reviens ici ensuite : le jeu les choisit tout seul.</span></details>` : `<p class="note">Les voix « améliorées » ou « premium » sonnent bien plus naturel. Pour en ajouter sur iPhone : Réglages › Accessibilité › Contenu énoncé › Voix › Français.</p>`;
  return (L.length ? sel('vS', OPTS.v1 || '', 'S') + sel('vN', OPTS.v2 || '', 'N') : '<p class="note">Aucune voix française trouvée pour l\'instant (touche « Voix activée » pour les charger).</p>') + hint;
}
// Options en trois volets (tout tient à l'écran)
const OPT_TABS = [['match', 'Matchs'], ['jeu', 'Jeu'], ['son', 'Son'], ['ia', 'Voix IA']];
function vOptions() {
  const tab = UI.otab || 'match', parts = vOptionsAll().split(/(?=<section )/).filter(x => x.trim());
  const cat = h => /<h3>(Commentateurs|Son)<\/h3>/.test(h) ? 'son' : /<h3>Vraies voix/.test(h) ? 'ia' : /<h3>(Vitesse du temps|Interruptions|Difficulté|Mini-jeux d'adresse|Écran d'ouverture)<\/h3>|data-a="(wipe|resetAll|quit)/.test(h) || !/<section /.test(h) ? 'jeu' : 'match';
  return segTabs('oTab', tab, OPT_TABS) + `<div class="optc stack">${parts.filter(h => cat(h) === tab).join('')}</div>`;
}
function vOptionsAll() {
  const o = UI.screen === 'game' && S ? S.settings : OPTS;
  return `<section class="card sec"><h3>Matchs en direct</h3><div class="seg">${[['all', 'Tous'], ['big', 'Les grands'], ['none', 'Aucun']].map(([k, n]) => `<button data-a="optLive" data-v="${k}" class="${o.live === k ? 'on' : ''}">${n}</button>`).join('')}</div><p class="note">En direct, tu décides aux moments clés. « Aucun » : résultat simulé.</p></section>
  <section class="card sec"><h3>Vitesse du temps</h3><div class="seg">${[['0', 'Lente'], ['1', 'Normale'], ['2', 'Rapide'], ['3', 'Instant.']].map(([k, n]) => `<button data-a="optSpeed" data-v="${k}" class="${+o.speed === +k ? 'on' : ''}">${n}</button>`).join('')}</div><p class="note">Animation quand les jours défilent.</p></section>
  <section class="card sec"><h3>Commentateurs</h3><p class="note">Jordi « Lo Sol » Puig, ancien ailier catalan intarissable, et Nathalie Ferrand, ancienne milieu internationale qui essaie de le ramener au match.</p><div class="seg"><button data-a="optVoice" data-v="1" class="${OPTS.voice !== false ? 'on' : ''}">Voix activée</button><button data-a="optVoice" data-v="0" class="${OPTS.voice === false ? 'on' : ''}">Texte seulement</button></div><div class="seg"><button data-a="optChat" data-v="all" class="${OPTS.chat !== 'match' ? 'on' : ''}">Bavards (histoires, chansons)</button><button data-a="optChat" data-v="match" class="${OPTS.chat === 'match' ? 'on' : ''}">Le match seulement</button></div><p class="note">Les digressions et les chansons arrivent dans les temps calmes, en vitesse ×1 ou ×2.</p>${typeof VOIX_INDEX !== 'undefined' && Object.keys(VOIX_INDEX).length ? `<div class="seg"><button data-a="optRec" data-v="1" class="${OPTS.voixRec !== false ? 'on' : ''}">Voix enregistrées</button><button data-a="optRec" data-v="0" class="${OPTS.voixRec === false ? 'on' : ''}">Voix du téléphone</button></div><p class="note">${Object.keys(VOIX_INDEX).length} répliques enregistrées en studio (ElevenLabs) sont livrées avec le jeu : elles marchent sans clé et hors connexion. Les phrases avec des noms de joueurs passent par la voix IA si elle est réglée, sinon par la voix du téléphone.</p>` : ''}${vVoicePick()}</section>
  <section class="card sec"><h3>Vraies voix (IA)</h3>${vAiVoice()}</section>
  <section class="card sec"><h3>Graphismes des matchs</h3><div class="seg">${[['3d', '3D'], ['3dl', '3D rapide'], ['2d', '2D léger']].map(([k, n]) => `<button data-a="optGfx" data-v="${k}" class="${(OPTS.gfx || '3d') === k ? 'on' : ''}">${n}</button>`).join('')}</div>${typeof g3Avail === 'function' && !g3Avail() ? '<p class="note">La 3D n\'est pas disponible sur cet appareil : le jeu utilise la 2D.</p>' : '<p class="note">Si ça saccade, le jeu passe seul en 3D rapide.</p>'}</section>
  <section class="card sec"><h3>Ralentis</h3><div class="seg">${[['all', 'Grosses actions'], ['goals', 'Buts seulement'], ['none', 'Aucun']].map(([k, n]) => `<button data-a="optReplay" data-v="${k}" class="${(OPTS.replay || 'all') === k ? 'on' : ''}">${n}</button>`).join('')}</div><p class="note">Buts, poteaux, arrêts décisifs, grosses occasions.</p></section>
  <section class="card sec"><h3>Mini-jeux d'adresse</h3><div class="seg"><button data-a="optMg" data-v="1" class="${o.mg !== false ? 'on' : ''}">Activés</button><button data-a="optMg" data-v="0" class="${o.mg === false ? 'on' : ''}">Désactivés</button></div><p class="note">Vise et tape au bon moment. Désactivés : simple choix.</p></section>
  <section class="card sec"><h3>Écran d'ouverture</h3><div class="seg"><button data-a="optIntro" data-v="1" class="${OPTS.intro !== false ? 'on' : ''}">Activé</button><button data-a="optIntro" data-v="0" class="${OPTS.intro === false ? 'on' : ''}">Jamais</button><button data-a="introReplay">▶ Revoir</button></div><p class="note">Le retourné qui casse l'écran, avec le son quand tu le revois.</p></section>
  <section class="card sec"><h3>Interruptions</h3><div class="seg"><button data-a="optInt" data-v="all" class="${o.interrupt !== 'key' ? 'on' : ''}">Toutes</button><button data-a="optInt" data-v="key" class="${o.interrupt === 'key' ? 'on' : ''}">Essentielles</button></div><p class="note">Essentielles : moins de fenêtres pendant la saison.</p></section>
  <section class="card sec"><h3>Son</h3><div class="seg"><button data-a="optMusic" data-v="1" class="${OPTS.music ? 'on' : ''}">Musique activée</button><button data-a="optMusic" data-v="0" class="${!OPTS.music ? 'on' : ''}">Musique coupée</button></div>${UI.screen === 'game' ? '<button class="btn sm" data-a="open" data-v="music">Ouvrir le lecteur</button>' : ''}</section>
  ${UI.screen === 'game' && S ? `<section class="card sec"><h3>Difficulté</h3><p>${DIFF[S.diff].n} <span class="note">· ${DIFF[S.diff].d}</span></p><p class="note">Fixée à la création de la carrière.</p></section>` : `<button class="btn wide danger" data-a="wipe">Effacer toutes les sauvegardes</button>`}`;
}
function vHelp() {
  const H = [
    ['Le temps passe jour après jour', 'Chaque journée a une date réelle : semaines, mois et saisons s\'enchaînent. Sur l\'Accueil, « Jour suivant » avance d\'un jour, « Fin de semaine » jusqu\'au lundi, « Mois suivant » jusqu\'au mois d\'après. La frise montre la semaine : matchs, entraînements, repos.'],
    ['L\'agenda', 'Ton programme se répète chaque semaine. Touche un jour pour choisir : entraînement (type et intensité), repos, famille, amis, rendez-vous, permis, révisions ou petit boulot. Surveille l\'énergie prévue.'],
    ['Les matchs en direct', 'Le match est simulé en 3D : le ballon suit une vraie physique (effet, rebonds, poteaux, filets) et les deux équipes jouent une vraie tactique (lignes, pressing, appels, hors-jeu, bloc qui recule quand on mène). Le bouton Caméra passe de la vue TV à la vue large puis à la vue tactique, qui montre les lignes des deux équipes. Graphismes réglables dans Options (3D, 3D rapide ou 2D). Deux commentateurs racontent le match : Lo Sol, passionné, qui part dans ses histoires de grand-mère et de tramontane et chante sur les beaux buts, et Nathalie, la consultante, qui le ramène au jeu (voix et bavardage réglables dans Options ; vraies voix humaines possibles avec une clé OpenAI ou ElevenLabs). L\'ambiance des grands stades vient de vrais enregistrements de tribunes, libres de droits (CC0, Freesound, rassemblés par le projet godot-crowd-sound) et les grosses actions passent au ralenti, vues de derrière le but ou au ras de la pelouse. Aux moments clés, tu choisis : frapper, dribbler, passer, tacler, plonger… Vitesses : ×1 = temps réel (90 minutes), ×2, ×4 et ×8 accélèrent joueurs et chrono ensemble ; « Résumé » ne garde que les grosses actions, jouées en temps réel. À la fin : notes de tous les joueurs, carte des tirs et ta carte de chaleur. « Résultat direct » termine le match.'],
    ['Devenir pro', 'Une note de 7 ou plus en match peut attirer un recruteur. Tu peux aussi payer des essais dans les clubs (train, bus, avion). Puis centre de formation, premier contrat pro.'],
    ['Transferts et contrats', 'Les offres arrivent pendant le mercato. Négocie salaire, durée, prime, clause libératoire et temps de jeu. Ton agent aide à obtenir plus.'],
    ['La vie', 'Famille, amour, amis, permis, bac : tout compte pour le moral. Avec l\'argent, achète, investis, et offre une maison à tes parents.'],
    ['Montées et descentes', 'Cinq championnats ont leur 2e division. Les derniers descendent, les premiers montent (barrages en France et en Allemagne, play-offs ailleurs).'],
    ['Mini-jeux d\'adresse', 'Sur une frappe, choisis la zone du but puis tape quand le curseur est dans le vert. En gardien, plonge du bon côté quand le cercle touche le ballon.'],
    ['Match vivant', 'Ta fraîcheur baisse pendant le match. Un tacle risqué peut coûter un carton (5 jaunes = suspension, rouge = suspension). À la mi-temps, parle au coach.'],
    ['Objectifs et défis', 'Ton club fixe des objectifs de saison (bilan fin mai) et chaque lundi un défi de la semaine rapporte un bonus.'],
    ['Talents', 'Débloqués par tes performances (buts, arrêts, dribbles…), ils te donnent des bonus en match. Voir Profil → Talents.'],
    ['Vestiaire et rival', 'Un mentor, un pote et un concurrent dans ton club. Et un rival de ta génération qui grandit en même temps que toi.'],
    ['Carrière d\'entraîneur', 'À la retraite, deviens entraîneur : plan de jeu, causerie, changements, mercato, et un président à convaincre.'],
    ['Musique', 'Six morceaux originaux joués par ton téléphone, et l\'ambiance des supporters en match. Lecteur dans Profil → Musique.'],
    ['Sauvegardes', 'Trois emplacements automatiques dans ce navigateur, et un code à exporter pour changer d\'appareil.'],
  ];
  return H.map(([t, d]) => `<section class="card sec"><h3>${t}</h3><p class="note">${d}</p></section>`).join('');
}
function vCredits() {
  return `<section class="card sec"><h3>Ce qui est réel</h3><p class="note">Clubs, entraîneurs, sélectionneurs et effectifs principaux de la saison 2026-27, mis à jour au 11 octobre 2026 (mercato d'été 2026 compris). Coupe du monde 2026 : ${REAL_FACTS.wc2026}. Ballon d'Or 2025 : ${REAL_FACTS.bdo2025}.</p></section>
  <section class="card sec"><h3>Ce qui est simulé</h3><p class="note">Tous les résultats à partir du début de ta carrière, le Ballon d'Or 2026 (cérémonie réelle le ${REAL_FACTS.bdo2026date}), les transferts futurs, les jeunes joueurs générés, les sponsors (marques fictives) et ta vie.</p></section>
  <section class="card sec"><h3>Crampons d'Or</h3><p class="note">Un simulateur de carrière pensé pour iPhone. Ajoute-le à l'écran d'accueil depuis Safari pour l'avoir comme une app : il marche aussi hors connexion et se met à jour tout seul.</p><p class="note">Version ${typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : 'dev'}${typeof VOIX_INDEX !== 'undefined' ? ' · ' + Object.keys(VOIX_INDEX).length + ' répliques enregistrées' : ''}</p></section>`;
}

// ---------- Fin de carrière ----------
function vEnd() {
  const sc = legendScore();
  if (!S.ended) {
    return `<div class="stack end" style="padding-block:24px"><div class="lbl">Fin de carrière · ${S.p.age} ans</div><h2 class="logo sm">${esc(pName())}</h2>
      <div class="card"><div class="lbl">Statut</div><div class="big gold">${legendTitle(sc)}</div><div class="note">Score de légende : ${sc}</div></div>
      <h3>Et maintenant ?</h3><div class="opts">${reconvOptions().map(o => `<button class="opt" data-a="reconv" data-v="${o.id}" ${o.ok ? '' : 'disabled'}><b>${o.n}</b><span>${o.d}</span></button>`).join('')}</div></div>`;
  }
  const g = S.stats.proGoals;
  return `<div class="stack end" style="padding-block:24px">
    <div class="lbl">Épilogue</div><h2 class="logo sm">${esc(pName())}</h2>
    <div class="card"><div class="lbl">Statut</div><div class="big gold">${legendTitle(sc)}</div><div class="note">Score de légende : ${sc}</div></div>
    <section class="card"><p>${esc(S.ended.txt)}</p></section>
    <div class="card">${kv([['Matchs pro', S.stats.proApps], ['Buts en pro', g], ['Sélections', S.intl.caps + ' (' + S.intl.g + ' buts)'], ['Trophées', S.trophies.length], ['Fortune', eur(wealth())], ['Abonnés', fnum(S.p.followers)], ['Succès', Object.keys(S.ach).length + ' / ' + ACH.length], ['Parents', S.fam.house ? 'Dans la maison que tu leur as offerte' : 'Chez eux']])}</div>
    ${vTrophyBlock()}${vHistTable()}
    <button class="btn wide" data-a="card">Ma carte joueur</button>${UI.cardImg ? `<img class="cardimg" src="${UI.cardImg}" alt="Carte joueur">` : ''}
    <button class="btn pri wide" data-a="newCareer">Nouvelle carrière</button><button class="btn wide ghost" data-a="quitMenu">Menu principal</button></div>`;
}
