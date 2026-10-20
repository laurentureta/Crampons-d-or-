// ===================== VIE, ÉVÉNEMENTS, SAISONS, SUCCÈS, SAUVEGARDES =====================
const EVENTS = [
  { w: 3, c: () => S.club.kind === 'amateur' && S.p.age < 18 && S.fam.w === 0, title: 'Fin de mois difficile', text: () => `${S.fam.dad.n.split(' ')[0]} a perdu des heures au travail. L'argent manque à la maison.`, ch: [
    { t: 'Donner une partie de tes économies', f: () => { const g = Math.min(S.p.money, 80); S.p.money -= g; S.fam.savings += g; S.fam.dad.rel += 8; S.fam.mom.rel += 8; S.fam.stress -= 6; return `Tu donnes ${eur(g)}. Ton père a les yeux qui brillent.`; } },
    { t: 'Faire comme si de rien n\'était', f: () => { S.fam.stress += 6; return 'L\'ambiance est lourde à table.'; } }] },
  { w: 2, c: () => S.club.kind === 'amateur' && S.p.age < 18, title: 'Plage ou entraînement ?', text: () => `${S.friend.n.split(' ')[0]} te propose de sécher l'entraînement pour aller à la plage avec la bande.`, ch: [
    { t: 'Y aller, une fois ça va', f: () => { S.p.moral += 8; S.friend.rel += 6; S.coach.rel -= 6; return 'Super journée. Le coach, lui, n\'a pas aimé.'; } },
    { t: 'Rester concentré', f: () => { trainGain({ MEN: .5 }, 1); S.coach.rel += 3; S.friend.rel -= 3; return 'Le coach remarque ton sérieux.'; } }] },
  { w: 2, c: () => S.p.age <= 17 && S.club.kind !== 'pro', title: 'Crampons troués', text: () => 'Tes crampons sont fichus. Une paire correcte coûte 90 €.', ch: [
    { t: 'Les payer toi-même (90 €)', f: () => { if (S.p.money < 90) return 'Pas assez d\'argent… tu joues avec tes vieux crampons.'; spend(90, 'Matériel'); S.p.moral += 4; return 'Tout neufs. Tu te sens plus rapide.'; } },
    { t: 'Demander à tes parents', f: () => { if (S.fam.savings >= 90) { S.fam.savings -= 90; S.fam.stress += 3; S.fam.mom.rel += 1; return 'Ta mère te les offre, même si c\'est serré.'; } S.fam.stress += 5; return 'Ils n\'ont pas les moyens ce mois-ci.'; } }] },
  { w: 2, c: () => S.fam.sac > 0 && S.club.kind !== 'pro', title: 'Les sacrifices de tes parents', text: () => 'Tu entends ta mère dire qu\'elle fait des heures supplémentaires de nuit pour payer tes déplacements.', ch: [
    { t: 'Leur promettre de réussir', f: () => { S.p.moral += 6; S.p.at.MEN += .6; S.fam.mom.rel += 6; return 'Une promesse. Elle te serre fort dans ses bras.'; } },
    { t: 'Leur dire d\'arrêter', f: () => { S.fam.stress -= 8; S.fam.sac = Math.max(0, S.fam.sac - 1); return 'Ils te répondent que ton rêve est aussi le leur.'; } }] },
  { w: 2, c: () => S.p.age >= 15 && !S.agent && S.p.rep >= 6, title: 'Un agent un peu louche', text: () => 'Un homme en costume te promet un contrat dans un grand club contre 500 € de « frais de dossier ».', ch: [
    { t: 'Payer, on ne sait jamais', f: () => { const g = Math.min(500, S.p.money); spend(g, 'Arnaque'); S.p.moral -= 6; return `Il disparaît avec tes ${eur(g)}. Leçon apprise.`; } },
    { t: 'Refuser et en parler à tes parents', f: () => { S.fam.dad.rel += 4; S.p.at.MEN += .4; return 'Ton père est fier de toi. Les vrais agents ne demandent jamais d\'argent.'; } }] },
  { w: 3, c: () => S.club.kind !== 'amateur', title: 'Chambrage à l\'entraînement', text: () => 'Un coéquipier se moque de toi devant tout le groupe après une passe ratée.', ch: [
    { t: 'Lui répondre sèchement', f: () => { S.mateRel -= 6; S.p.moral += 2; return 'L\'ambiance se tend dans le vestiaire.'; } },
    { t: 'En rire avec lui', f: () => { S.mateRel += 5; return 'Le groupe apprécie ton humilité.'; } },
    { t: 'Répondre sur le terrain', f: () => { trainGain({ TEC: .5, DRI: .4 }, 1); S.coach.rel += 3; return 'Grand pont sur lui à l\'exercice suivant. Tout le monde rigole.'; } }] },
  { w: 2, c: () => S.club.kind === 'pro', title: 'Changement de poste', text: () => `${S.coach.n.split(' (')[0]} veut te tester à un autre poste pour dépanner l'équipe.`, ch: [
    { t: 'Accepter sans discuter', f: () => { S.coach.rel += 7; S.p.moral -= 2; return 'Le coach apprécie énormément ton état d\'esprit.'; } },
    { t: 'Refuser poliment', f: () => { S.coach.rel -= 6; return 'Il prend note. Froidement.'; } }] },
  { w: 2, c: () => S.club.kind === 'pro' && S.p.age >= 18, title: 'Soirée la veille du match', text: () => 'Des coéquipiers t\'invitent en boîte de nuit la veille d\'un match important.', ch: [
    { t: 'Y aller', f: () => { S.mateRel += 6; S.p.energy -= 15; if (R() < .4) { S.coach.rel -= 10; S.p.pop -= 5; if (S.love) S.love.rel -= 8; addNews('Polémique', `${pName()} photographié en boîte la veille du match.`); return 'Les photos tournent sur les réseaux. Le coach est furieux.'; } return 'Bonne soirée, personne n\'a rien vu.'; } },
    { t: 'Rester à l\'hôtel', f: () => { S.p.energy += 5; S.coach.rel += 2; return 'Nuit complète. Tu es frais pour le match.'; } }] },
  { w: 2, c: () => S.club.kind === 'pro' && S.coach.rel < 40, title: 'Tension avec l\'entraîneur', text: () => `${S.coach.n} t'a encore laissé sur le banc et refuse de t'expliquer pourquoi.`, ch: [
    { t: 'Demander un entretien calme', f: () => { if (R() < .6) { S.coach.rel += 10; return 'Discussion franche. Il te promet du temps de jeu si tu bosses.'; } S.coach.rel -= 2; return 'Il reste flou. Pas de changement.'; } },
    { t: 'Critiquer le coach dans la presse', f: () => { S.coach.rel -= 18; S.mateRel -= 5; S.transferReq = true; S.p.followers += 3000; return 'Rupture totale. Le club envisage ta vente.'; } }] },
  { w: 2, c: () => S.club.kind === 'pro' && S.coach.rel > 75, title: 'Le coach te félicite', text: () => `Devant tout le groupe, ${S.coach.n.split(' (')[0]} cite ton travail en exemple.`, ch: [{ t: 'Rester humble', f: () => { S.mateRel += 3; S.p.moral += 5; return 'Ça fait du bien.'; } }] },
  { w: 1, c: () => S.club.kind === 'pro' && S.mateRel < 35, title: 'Vestiaire divisé', text: () => 'Un cadre de l\'équipe t\'accuse de jouer pour toi plutôt que pour le collectif.', ch: [
    { t: 'Inviter l\'équipe au restaurant (2 000 €)', f: () => { if (S.p.money < 2000) return 'Tu n\'as pas les moyens…'; spend(2000, 'Restaurant d\'équipe'); S.mateRel += 14; return 'Soirée réussie, la glace est brisée.'; } },
    { t: 'L\'ignorer', f: () => { S.mateRel -= 4; return 'La tension persiste.'; } }] },
  { w: 1, c: () => S.club.kind === 'pro' && S.p.rep > 30, title: 'Un jeune fan malade', text: () => 'Un enfant hospitalisé rêve de te rencontrer.', ch: [
    { t: 'Aller le voir avec ton maillot', f: () => { S.p.pop += 6; S.p.moral += 6; S.p.followers += 4000; feedPost(fanHandle(), 'Respect total pour ce geste. Un grand joueur et un grand homme.'); return 'Le sourire de l\'enfant vaut tous les trophées.'; } },
    { t: 'Envoyer un message vidéo', f: () => { S.p.pop += 2; return 'Gentil geste.'; } }] },
  { w: 2, c: () => S.club.kind === 'pro' && S.p.rep > 15 && windowOpen(), title: 'Rumeur de transfert', text: () => 'La presse annonce que tu veux partir. C\'est faux… ou pas ?', ch: [
    { t: 'Démentir : « Je suis heureux ici »', f: () => { S.coach.rel += 3; S.p.pop += 2; return 'Les supporters apprécient.'; } },
    { t: 'Laisser planer le doute', f: () => { S.coach.rel -= 4; S.transferReq = true; return 'Les clubs intéressés vont se manifester.'; } }] },
  { w: 2, c: () => S.p.money > 50000, title: 'Un proche te demande de l\'aide', text: () => 'Un cousin te demande 20 000 € pour lancer son entreprise.', ch: [
    { t: 'Lui prêter', f: () => { spend(20000, 'Prêt familial'); if (R() < .4) { earn(30000, 'Remboursement'); return 'Son business marche ! Il te rembourse avec un bonus.'; } return 'Tu ne reverras sans doute jamais cet argent.'; } },
    { t: 'Refuser gentiment', f: () => { S.fam.stress += 2; return 'Il est vexé, mais ça passera.'; } }] },
  { w: 1, c: () => S.permis.ok && S.assets.cars.length > 0, title: 'Excès de vitesse', text: () => 'Tu te fais flasher à 180 km/h sur l\'autoroute.', ch: [{ t: 'Assumer et payer l\'amende', f: () => { spend(1500, 'Amendes'); S.p.pop -= 2; return 'Amende payée. Les médias en parlent un peu.'; } }] },
  { w: 2, c: () => S.p.followers > 20000, title: 'Vidéo virale', text: () => 'Une vidéo de ton geste technique à l\'entraînement devient virale.', ch: [{ t: 'Génial', f: () => { S.p.followers = Math.round(S.p.followers + fameTarget() * .08 + 5000); return 'Des milliers de nouveaux abonnés !'; } }] },
  { w: 1, c: () => S.p.age >= 18 && S.friend.rel > 60, title: 'Ton meilleur ami a besoin de toi', text: () => `${S.friend.n.split(' ')[0]} traverse une période compliquée et voudrait te voir.`, ch: [
    { t: 'Passer le week-end avec lui', f: () => { S.friend.rel += 12; S.p.energy -= 10; return 'Il n\'oubliera pas.'; } },
    { t: 'Trop occupé', f: () => { S.friend.rel -= 10; return 'Il se sent abandonné.'; } }] },
];
function randomEvent() { if (isCoach() || R() > .3) return; const e = wpick(EVENTS.filter(e => e.c()), x => x.w); if (e) queueEvent({ title: e.title, text: e.text(), ch: e.ch }); }
function sponsorCheck() {
  const f = S.p.followers;
  for (const b of BRANDS) {
    if (f < b.f || S.assets.spons.some(s => s.n === b.n) || (S.flags['sp_' + b.n] || 0) > absDay() || R() > .08) continue;
    const wk = Math.round(Math.min(f * .0004 + S.p.rep * 15, 40000) * b.k * DF().money);
    S.flags['sp_' + b.n] = absDay() + 180;
    queueEvent({ title: 'Proposition de sponsoring', text: `${b.n} (${b.t}) te propose ${eur(monthly(wk))} par mois pendant un an.${b.bad ? ' Attention : une partie de tes fans n\'aime pas les sites de paris.' : ''}`, ch: [
      { t: 'Signer', f: () => { S.assets.spons.push({ n: b.n, t: b.t, wk, end: absDay() + 364 }); if (b.bad) S.p.pop -= 8; return `Contrat signé avec ${b.n}.`; } },
      { t: 'Refuser', f: () => { if (b.bad) S.p.pop += 3; return 'Tu déclines poliment.'; } }] });
    return;
  }
  S.assets.spons = S.assets.spons.filter(s => s.end > absDay());
}
function agentApplications() {
  if (isCoach()) return;
  if (S.p.age < 15 || R() > .04 + S.p.rep / 900) return;
  if (S.agent && S.agent.kind === 'pro' && S.agent.stars >= 5) return;
  const c = agentCandidates().filter(x => x.kind === 'pro').sort((a, b) => b.stars - a.stars)[0];
  if (S.agent && S.agent.stars >= c.stars) return;
  queueEvent({ title: 'Candidature d\'agent', text: `${c.n} (${c.t}, ${'★'.repeat(c.stars)}) veut te représenter. Commission : ${c.comm.toFixed(1).replace('.', ',')} % de ton salaire.`, ch: [
    { t: 'L\'engager', f: () => { setAgent(c); return `${c.n} est désormais ton agent.`; } },
    { t: 'Plus tard', f: () => 'Tu pourras choisir un agent dans Carrière → Agent.' }] });
}

// ---------- Couple, parents ----------
function partnerName() { return S.pref === 'M' ? genName(S.p.nat).split(' ')[0] + ' ' + pick((NAMEPOOL[S.p.nat] || NAMEPOOL.FRA).l) : pick(FEM) + ' ' + pick((NAMEPOOL[S.p.nat] || NAMEPOOL.FRA).l); }
const PLACES = ['à une soirée d\'anniversaire', 'à la bibliothèque', 'à la sortie d\'un match', 'au mariage d\'un cousin', 'dans un café en ville', 'à une soirée caritative'];
function lifeEvents() {
  const p = S.p, L = S.love;
  if (!L && p.age >= 16 && R() < .03 + p.pop / 5000) {
    const n = partnerName(), age = clamp(p.age + ri(-2, 2), 16, 60);
    queueEvent({ title: 'Une rencontre', text: `Tu croises ${n.split(' ')[0]} (${age} ans) ${pick(PLACES)}. Le courant passe bien.`, ch: [
      { t: 'Aller lui parler', f: () => { if (R() < .55 + p.moral / 400) { S.love = { n, rel: 48, st: 'date', since: absDay(), kids: [], baby: 0 }; return `Vous échangez vos numéros. Premier rendez-vous prévu (ajoute « Rendez-vous » dans ton agenda).`; } return 'Ça ne prend pas. Ce n\'était pas le bon moment.'; } },
      { t: 'Rester concentré sur le foot', f: () => 'Tu restes focalisé sur ta carrière.' }] });
  }
  if (L) {
    if (L.rel < 12) { queueEvent({ title: 'Rupture', text: `${L.n.split(' ')[0]} met fin à votre relation : tu n'étais jamais là.`, ch: [{ t: 'Encaisser', f: () => { S.love = null; p.moral -= 18; return 'Dur moment. La vie continue.'; } }] }); return; }
    if (L.st === 'date' && L.rel >= 70 && R() < .2) queueEvent({ title: 'Officialiser ?', text: `${L.n.split(' ')[0]} aimerait que votre relation devienne officielle.`, ch: [{ t: 'Oui, on officialise', f: () => { L.st = 'couple'; L.rel += 6; if (p.followers > 50000) { p.followers += Math.round(fameTarget() * .03); addNews('People', `${pName()} officialise sa relation avec ${L.n}.`); } return 'C\'est officiel. Vous êtes en couple.'; } }, { t: 'Pas encore', f: () => { L.rel -= 8; return 'Petite déception de son côté.'; } }] });
    else if (L.st === 'couple' && p.age >= 20 && L.rel >= 78 && R() < .1) queueEvent({ title: 'Emménager ensemble ?', text: `${L.n.split(' ')[0]} te propose de vivre ensemble.`, ch: [{ t: 'Avec plaisir', f: () => { L.st = 'live'; L.rel += 8; p.moral += 6; return 'Vous emménagez ensemble.'; } }, { t: 'Trop tôt', f: () => { L.rel -= 6; return 'Vous restez chacun chez vous.'; } }] });
    else if ((L.st === 'live' || L.st === 'married') && p.age >= 23 && L.rel >= 80 && L.kids.length < 3 && !L.baby && R() < .04) queueEvent({ title: 'Un projet de famille', text: S.pref === 'M' ? `${L.n.split(' ')[0]} aimerait que vous accueilliez un enfant.` : `${L.n.split(' ')[0]} aimerait avoir un enfant avec toi.`, ch: [{ t: 'Oui, fondons une famille', f: () => { L.baby = absDay() + 252; return S.pref === 'M' ? 'Vous lancez les démarches d\'adoption.' : 'Une grande nouvelle se prépare.'; } }, { t: 'Plus tard', f: () => { L.rel -= 4; return 'Vous en reparlerez.'; } }] });
    if (L.baby && absDay() >= L.baby) { const kid = pick(['Léo', 'Inès', 'Noah', 'Jade', 'Adam', 'Lina', 'Tiago', 'Mia', 'Rayan', 'Lou']); L.kids.push({ n: kid, y: S.season }); L.baby = 0; p.moral = 100; S.flags.dad = true; addNews('Famille', `${pName()} est papa ! Bienvenue à ${kid}.`); queueEvent({ title: 'Bienvenue ' + kid, text: `Ton enfant ${kid} est arrivé. ${S.fam.mom.n.split(' ')[0]} et ${S.fam.dad.n.split(' ')[0]} sont grands-parents.`, ch: [{ t: 'Le plus beau jour', f: () => null }] }); }
  }
  // parents
  const D = S.fam.dad, M_ = S.fam.mom;
  if (Math.max(D.age, M_.age) >= 55 && R() < .015) {
    const who = R() < .5 ? D : M_, cost = 8000;
    queueEvent({ title: 'Santé de ' + (who === D ? 'ton père' : 'ta mère'), text: `${who.n.split(' ')[0]} doit se faire opérer du genou. Une clinique privée coûte ${eur(cost)}, sinon il faut attendre plusieurs mois.`, ch: [
      { t: `Payer la clinique (${eur(cost)})`, f: () => { if (S.p.money < cost) return 'Tu n\'as pas assez d\'argent.'; spend(cost, 'Famille'); who.rel += 12; S.fam.stress -= 10; return 'Opération réussie, tout le monde te remercie.'; } },
      { t: 'Attendre l\'hôpital public', f: () => { S.fam.stress += 6; return 'L\'attente est longue, mais ça finira par s\'arranger.'; } }] });
  }
  if (S.club.kind === 'pro' && distParents() && R() < .02) queueEvent({ title: 'Visite des parents', text: 'Tes parents aimeraient venir te voir jouer. Billets et hôtel : 1 200 €.', ch: [{ t: 'Je leur offre le voyage', f: () => { if (S.p.money < 1200) return 'Pas assez d\'argent pour l\'instant.'; spend(1200, 'Famille'); D.rel += 8; M_.rel += 8; p.moral += 8; return 'Ils sont en tribune, émus aux larmes.'; } }, { t: 'Pas maintenant', f: () => { D.rel -= 2; M_.rel -= 2; return 'Ils comprennent.'; } }] });
}
function distParents() { const c = myClub(); return c && c.city !== S.p.city; }
function marry() {
  const L = S.love; if (!L || L.st !== 'live' || L.rel < 80 || S.p.age < 21) return 'Pas encore le moment.';
  const cost = Math.round(clamp(wealth() * .02, 8000, 800000));
  if (S.p.money < cost) return `Le mariage coûtera ${eur(cost)}.`;
  spend(cost, 'Mariage'); L.st = 'married'; L.rel = 100; S.p.moral = 100; S.flags.married = true;
  addNews('Mariage', `${pName()} épouse ${L.n}.`); if (S.p.followers > 50000) S.p.followers += Math.round(fameTarget() * .05);
  return `Vous êtes mariés ! Fête : ${eur(cost)}.`;
}
function breakUp() { if (!S.love) return; const n = S.love.n; S.love = null; S.p.moral -= 12; return `Tu mets fin à ta relation avec ${n.split(' ')[0]}.`; }
function permisExam() {
  if (S.permis.ok) return 'Tu as déjà ton permis.';
  if (S.p.age < 17) return 'Le permis se passe à partir de 17 ans.';
  if (S.permis.h < 20) return `Il faut au moins 20 h de conduite (tu en as ${S.permis.h}).`;
  if (S.p.money < 120) return 'L\'examen coûte 120 €.';
  spend(120, 'Auto-école'); S.permis.tries++;
  const ok = R() < clamp(.45 + (S.permis.h - 20) * .03 + (S.p.at.MEN - 50) / 200, .1, .95);
  if (ok) { S.permis.ok = true; S.p.moral += 8; addNews('Vie privée', `${S.p.first} obtient son permis de conduire.`); return 'Permis obtenu ! Tu peux conduire ta propre voiture.'; }
  return 'Recalé… L\'inspecteur n\'a pas aimé ton créneau. Prends encore quelques leçons.';
}
function bacExam() {
  const sc = S.school; if (sc.done || S.p.age < 17) return;
  const ok = R() < clamp((sc.lvl - 45) / 30 + .3, .05, .97);
  sc.tries = (sc.tries || 0) + 1;
  if (ok) { sc.bac = true; sc.done = true; S.fam.dad.rel += 8; S.fam.mom.rel += 10; S.flags.bac = true; }
  else if (sc.tries >= 2) sc.done = true;
  queueEvent({ title: 'Résultats du bac', text: ok ? 'Tu as ton bac ! Tes parents sont rassurés : tu as un plan B.' : `Recalé au bac${sc.done ? '. Tu ne le repasseras pas.' : ', tu pourras le repasser l\'an prochain.'}`, ch: [{ t: ok ? 'Génial' : 'Tant pis', f: () => null }] });
}

// ---------- Centre de formation ----------
function academyChecks() {
  if (S.club.kind !== 'academy') return;
  const c = myClub(), o = OVR();
  if (S.p.age >= 17 && o >= c.s - 14 && !S.pendingPro && R() < .1) {
    S.pendingPro = true;
    const wage = Math.round(marketWage(o, c.lid) * .55 * (1 + agentNego()));
    queueEvent({ title: 'Premier contrat professionnel !', text: `${c.coach}, l'entraîneur de l'équipe première de ${c.n}, veut te faire signer ton premier contrat pro : ${eur(monthly(wage))} par mois pendant 3 saisons.`, ch: [
      { t: 'Signer !', f: () => { S.pendingPro = false; joinClub(c.id, 'pro', wage, 3); return 'Tu es officiellement footballeur professionnel. Ta famille pleure de joie.'; } },
      { t: 'Attendre une meilleure offre', f: () => { S.pendingPro = false; S.coach.rel -= 6; return 'Le club est déçu, mais la porte reste ouverte.'; } }] });
  }
  if (o >= c.s - 16 && R() < .05 && S.dayLog) S.dayLog.lines.push(`Tu t'entraînes cette semaine avec l'équipe première de ${c.coach}.`);
}

// ---------- Capitanat, recrutement ----------
function captainCheck() {
  if (S.club.kind !== 'pro') return;
  if (S.club.captain && (/Rempla|Réserve|Espoir/.test(S.club.role) || S.coach.rel < 30)) { S.club.captain = false; inbox('coach', S.coach.n, 'Je te retire le brassard de capitaine.'); S.p.moral -= 8; return; }
  if (!S.club.captain && S.p.age >= 24 && S.season - S.club.since >= 2 && /Titulaire|Star/.test(S.club.role) && S.coach.rel >= 70 && S.mateRel >= 60 && R() < .12)
    queueEvent({ title: 'Le brassard', text: `${S.coach.n} réunit le groupe et annonce que tu seras le nouveau capitaine de ${S.club.n}.`, ch: [{ t: 'Un honneur', f: () => { S.club.captain = true; S.flags.captain = true; S.p.rep += 3; S.mateRel += 5; S.p.followers += Math.round(fameTarget() * .03); addNews('Officiel', `${pName()} devient capitaine de ${S.club.n}.`); return 'Tu portes désormais le brassard.'; } }] });
}
function recruitCheck() {
  if (S.club.kind !== 'pro' || !windowOpen() || !(S.club.captain || /Star/.test(S.club.role)) || R() > .05) return;
  const c = myClub();
  const cand = S.W.stars.filter(s => s.cid !== c.id && s.o >= c.s - 1 && s.o <= c.s + 5 && club(s.cid).s <= c.s + 2 && s.a <= 31);
  if (!cand.length) return;
  const s = pick(cand), from = club(s.cid).n, same = GROUP[s.pos] === GROUP[S.p.pos];
  queueEvent({ title: 'Ton avis compte', text: `Le président te demande ton avis : faut-il recruter ${s.n} (${POS_N[s.pos].toLowerCase()}, note ${s.o}) qui joue à ${from} ?${same ? ' Attention : il joue à ton poste.' : ''}`, ch: [
    { t: 'Oui, il nous rendrait plus forts', f: () => { s.cid = c.id; IDX = null; refreshSquadStars(); c.s = Math.min(92, c.s + 1); S.mateRel += 2; addNews('Mercato', `${s.n} quitte ${from} et rejoint ${c.n}.`); return `${s.n} signe à ${c.n}.`; } },
    { t: 'Non, on a ce qu\'il faut', f: () => { S.mateRel += 3; return 'Le groupe apprécie ta confiance.'; } }] });
}

// ---------- Conférences de presse ----------
const PRESS = {
  pre: [
    { q: 'Comment abordez-vous ce match ?', a: [['« On respecte l\'adversaire, on va tout donner. »', { coach: 2, pop: 1 }, 'Réponse appréciée par ton coach.'], ['« On est plus forts, on va gagner. »', { boost: .2, pop: 2, foll: .01 }, 'Les supporters adorent ta confiance.'], ['« Ils vont souffrir, croyez-moi. »', { boost: .35, foll: .03, coach: -3, mates: -2 }, 'Grosse polémique… et grosse motivation.']] },
    { q: 'On dit que vous êtes l\'homme clé ce soir. Ça vous met la pression ?', a: [['« La pression, c\'est un privilège. »', { boost: .15, pop: 2 }, 'Belle réponse.'], ['« C\'est l\'équipe qui gagne, pas moi. »', { mates: 3, coach: 1 }, 'Le vestiaire apprécie.'], ['« Je n\'ai rien à prouver. »', { foll: .02, pop: -1 }, 'Un peu arrogant aux yeux de certains.']] },
  ],
  win: [
    { q: 'Que ressentez-vous après cette victoire ?', a: [['« Je dédie ce match à ma famille. »', { pop: 3, fam: 4 }, 'Tes parents sont émus devant la télé.'], ['« C\'est le travail de tout le groupe. »', { mates: 4, coach: 2 }, 'Le vestiaire t\'adore.'], ['« Je suis le meilleur, point. »', { foll: .04, mates: -4, pop: -1 }, 'Buzz énorme sur les réseaux.']] },
    { q: 'Votre performance va faire parler. Un message aux sélectionneurs ?', a: [['« Je suis prêt quand on aura besoin de moi. »', { pop: 2, rep: .5 }, 'Message reçu.'], ['« Je me concentre sur mon club. »', { coach: 3 }, 'Ton coach apprécie.'], ['« S\'ils ne m\'appellent pas, c\'est leur problème. »', { foll: .03, pop: -2 }, 'Ça fait polémique.']] },
  ],
  loss: [
    { q: 'Comment expliquez-vous cette défaite ?', a: [['« On doit se remettre en question, moi le premier. »', { coach: 3, pop: 2 }, 'Une réponse de leader.'], ['« L\'arbitrage nous a coûté le match. »', { pop: 1, coach: -1 }, 'Les fans sont d\'accord, la ligue moins.'], ['« Certains n\'étaient pas au niveau. »', { mates: -7, foll: .02 }, 'Le vestiaire est furieux.']] },
  ],
  draw: [
    { q: 'Un match nul, satisfait ?', a: [['« On prend le point, on avance. »', { coach: 1 }, 'Réponse sage.'], ['« On méritait mieux. »', { pop: 1 }, 'Les supporters partagent ta frustration.'], ['« Inacceptable, il faut changer des choses. »', { coach: -3, foll: .01 }, 'Le coach n\'a pas aimé.']] },
  ],
  rumor: [
    { q: 'Des rumeurs vous envoient ailleurs. Allez-vous rester ?', a: [['« Je suis heureux ici. »', { coach: 3, pop: 3 }, 'Les supporters chantent ton nom.'], ['« On verra cet été. »', { transfer: 1 }, 'Les clubs intéressés se manifestent.'], ['« J\'ai besoin d\'un nouveau défi. »', { transfer: 1, coach: -6, pop: -4 }, 'Ta demande est entendue.']] },
  ],
};
function pressApply(e) {
  const p = S.p;
  if (e.coach) S.coach.rel = clamp(S.coach.rel + e.coach, 0, 100);
  if (e.mates) S.mateRel = clamp(S.mateRel + e.mates, 0, 100);
  if (e.pop) p.pop = clamp(p.pop + e.pop, 0, 100);
  if (e.foll) p.followers += Math.round(fameTarget() * e.foll + 200);
  if (e.boost) p.boost = e.boost;
  if (e.rep) p.rep = clamp(p.rep + e.rep, 0, 100);
  if (e.fam) { S.fam.dad.rel += e.fam; S.fam.mom.rel += e.fam; }
  if (e.transfer) S.transferReq = true;
}
function pressConference(kind, prep, pst) {
  const pool = kind === 'win' ? PRESS.win : kind === 'loss' ? PRESS.loss : PRESS.draw;
  const qs = [pick(pool)]; if (windowOpen() && S.p.rep > 25 && R() < .4) qs.push(pick(PRESS.rumor));
  for (const q of qs) queueEvent({ title: 'Conférence de presse', text: `<p class="note">${prep.comp}${prep.label ? ' · ' + prep.label : ''} · ${prep.h.n} ${''}</p><p style="font-size:17px">${q.q}</p>`, ch: q.a.map(([t, e, res]) => ({ t, f: () => { pressApply(e); return res; } })), kind: 'press' });
}
function prematchQuestion(prep) { if (prep.youth || !prep.big || S.p.rep < 5) return null; return pick(PRESS.pre); }

// ---------- Réseaux sociaux ----------
const POSTS = {
  TRAIN: { n: 'Photo à l\'entraînement', d: 'Abonnés +, le coach apprécie', f: () => { S.coach.rel += 1; return 1; } },
  FANS: { n: 'Message aux supporters', d: 'Popularité +', f: () => { S.p.pop += 3; return 1; } },
  GOAL: { n: 'Célébrer ton dernier but', d: 'Gros boost si tu as marqué cette semaine', need: () => S.weekLog.concat(S.lastWeekLog || []).some(l => l.matches.some(m => m.p && m.p.g > 0)), f: () => { S.p.pop += 2; return 2.6; } },
  LIFE: { n: 'Lifestyle & luxe', d: 'Abonnés ++, mal vu si tu joues peu', f: () => { const bad = /Rempla|Réserve|Espoir/.test(S.club.role || ''); if (bad) S.p.pop -= 4; return 1.5 + S.assets.cars.length * .3 + S.assets.houses.length * .3; } },
  LOVE: { n: 'Photo en couple', d: 'Ton couple +, abonnés +', need: () => !!S.love, f: () => { S.love.rel += 4; return 1.4; } },
  CHAR: { n: 'Action solidaire', d: 'Popularité ++ (don de 1 % de ton argent)', f: () => { const g = Math.max(20, Math.round(S.p.money * .01)); spend(g, 'Dons'); S.p.pop += 6; S.p.rep += .4; return 1.2; } },
  CLASH: { n: 'Clash / provocation', d: 'Énorme buzz, vestiaire et coach fâchés', f: () => { S.coach.rel -= 8; S.mateRel -= 6; S.p.pop -= 4; addNews('Polémique', `Le message de ${pName()} sur les réseaux fait polémique.`); return 3.2; } },
};
const weekKey = () => S.season * 52 + S.week;
function doPost(k) {
  if (S.postWeek === weekKey()) return 'Tu as déjà publié cette semaine.';
  const P_ = POSTS[k]; if (P_.need && !P_.need()) return k === 'LOVE' ? 'Tu es célibataire.' : 'Tu n\'as pas marqué cette semaine.';
  S.postWeek = weekKey();
  const m = P_.f(), gain = Math.round((30 + fameTarget() * .0015 + S.p.rep * 20) * m * rf(.7, 1.4));
  S.p.followers += gain; S.p.pop = clamp(S.p.pop, 0, 100);
  const txt = { TRAIN: 'Le travail paie toujours. 💪', FANS: 'Merci pour votre soutien, on lâche rien !', GOAL: 'Ce but est pour vous ⚽', LIFE: 'Petit moment de détente 🌴', LOVE: 'Avec toi ❤️', CHAR: 'Fier de soutenir cette association.', CLASH: 'Certains devraient parler moins et travailler plus.' }[k];
  feedPost(handle(), txt, 'me');
  const reac = k === 'CLASH' ? ['Il a dit ce qu\'il pensait, respect.', 'Quel manque de classe.', 'Le vestiaire va adorer…'] : k === 'LIFE' && /Rempla|Réserve/.test(S.club.role || '') ? ['Joue au foot avant de frimer.', 'Concentre-toi sur le terrain.'] : ['Le meilleur !', 'Force à toi', 'On t\'aime !', 'Machine 🔥', 'Exemplaire.'];
  feedPost(fanHandle(), pick(reac)); feedPost(fanHandle(), pick(reac));
  return `+${fnum(gain)} abonnés.`;
}

// ---------- Ballon d'Or ----------
const FAV_2026 = [['Lamine Yamal', 'FC Barcelone', 30], ['Ousmane Dembélé', 'Paris Saint-Germain', 27], ['Harry Kane', 'Bayern Munich', 26], ['Kylian Mbappé', 'Real Madrid', 27], ['Rodri', 'Manchester City', 25], ['Raphinha', 'FC Barcelone', 24], ['Michael Olise', 'Bayern Munich', 23], ['Vitinha', 'Paris Saint-Germain', 23], ['Pedri', 'FC Barcelone', 22], ['Erling Haaland', 'Manchester City', 21], ['Declan Rice', 'Arsenal', 20], ['Khvicha Kvaratskhelia', 'Paris Saint-Germain', 19]];
function ballonDor() {
  const yr = S.season, H = S.W.lastHon || {};
  let cands = yr === 2026 ? FAV_2026.map(([n, c, sc]) => ({ n, c, sc: sc + rf(0, 9) })) : S.W.stars.filter(s => s.ls && s.o >= 80).map(s => {
    const att = ['BU', 'AIL', 'MOC'].includes(s.pos);
    let sc = (s.o - 78) * 2.3 + s.ls.g * (att ? .5 : .8) + s.ls.as * .35 + rf(0, 7);
    if ((H.champs || []).includes(s.cid)) sc += 6; if (H.ucl === s.cid) sc += 12; if (s.pos === 'GB') sc -= 6;
    return { n: s.n, c: club(s.cid).n, sc };
  });
  let me = null; const L = S.lastSS;
  if (L && L.apps >= 10 && L.ovr >= 76) {
    const att = ['BU', 'AIL', 'MOC'].includes(S.p.pos);
    let sc = (L.ovr - 78) * 2.3 + L.g * (att ? .5 : .8) + L.a * .35 + (L.avg - 7) * 7 + rf(0, 7);
    for (const t of L.tr) sc += /Ligue des champions|Coupe des champions/.test(t) ? 12 : /Coupe du monde/.test(t) ? 15 : /Euro|Copa|CAN|Gold/.test(t) ? 8 : /Cup|Coupe|Copa del Rey|Pokal|Coppa|Taça|Beker|King/.test(t) ? 2 : 6;
    if (S.p.pos === 'GB') sc -= 6;
    me = { n: pName(), c: L.club, sc, me: true }; cands.push(me);
  }
  if (!cands.length) cands.push({ n: 'Aucun lauréat', c: '—', sc: 0 });
  cands.sort((a, b) => b.sc - a.sc);
  const top = cands.slice(0, 30), winner = top[0], rank = me ? cands.indexOf(me) + 1 : 0;
  const rr = S.rival && !S.rival.done ? cands.findIndex(c => c.n === S.rival.n) + 1 : 0;
  if (rr === 1) { S.rival.bdo++; addNews('Ton rival', `${S.rival.n} remporte le Ballon d'Or.`); }
  if (rr) S.rival.best = S.rival.best ? Math.min(S.rival.best, rr) : rr;
  S.W.hist.push({ s: String(yr), bdo: winner.n + ' (' + winner.c + ')' });
  S.bdo.push({ y: yr, w: winner.n, rank, rr });
  if (me && rank === 1) { S.awards.push({ t: 'Ballon d\'Or', s: String(yr) }); winTrophy('Ballon d\'Or', S.club.n || L.club, yr + ' '); S.p.followers = Math.round(S.p.followers + fameTarget() * .3); if (typeof feteQueue === 'function') feteQueue({ k: 'bdo', yr, club: S.club.n || L.club }); }
  const podium = top.slice(0, 3).map((c, i) => `<div class="mline"><span>${i + 1}. ${c.me ? '<b>' + c.n + '</b>' : c.n}</span><span class="note">${c.c}</span></div>`).join('');
  queueEvent({ title: `Ballon d'Or ${yr}`, text: (yr === 2026 ? `<p class="note">Cérémonie à Londres ce soir (26 octobre 2026). Le vrai résultat n\'était pas encore connu à la création du jeu : ce classement est simulé.</p>` : '<p class="note">Cérémonie du Ballon d\'Or ce soir.</p>') + podium + (me ? `<p>${rank === 1 ? '🏆 <b>C\'EST TOI ! Tu remportes le Ballon d\'Or !</b>' : rank <= 30 ? `Tu termines <b>${rank}e</b> du classement.` : 'Tu n\'es pas dans les 30 nommés.'}</p>` : '') + (rr && rr <= 30 ? `<p class="note">Ton rival ${S.rival.n} : ${rr === 1 ? '<b>vainqueur</b>' : rr + 'e'}.</p>` : ''), ch: [{ t: 'Continuer', f: () => null }] });
  addNews('Ballon d\'Or', `${winner.n} remporte le Ballon d'Or ${yr}${yr === 2026 ? ' (simulation du jeu)' : ''}.`);
}

// ---------- Fin de saison, montées et descentes ----------
function topScorers(lid, n) {
  const list = S.W.stars.filter(s => club(s.cid).lid === lid).map(s => ({ n: s.n, c: club(s.cid).n, g: s.g }));
  if (S.club.kind === 'pro' && myClub().lid === lid) list.push({ n: pName(), c: myClub().n, g: S.ss.g, me: true });
  return list.sort((a, b) => b.g - a.g).slice(0, n || 10);
}
function moveClub(id, toLid) { const c = club(id), from = S.W.leagues[c.lid]; from.members = from.members.filter(x => x !== id); S.W.leagues[toLid].members.push(id); c.lid = toLid; }
function endSeason() {
  const W = S.W, hon = { champs: [], cups: {}, ucl: W.cl.UEFA.winner }, champs = {}, moves = [];
  for (const L of LEAGUES) W.lastOrder[L.id] = leagueOrder(L.id);
  for (const L of LEAGUES) {
    const ord = W.lastOrder[L.id]; let champ = ord[0];
    if (L.id === 'USA') { let ko = ord.slice(0, 8); while (ko.length > 1) { const nx = []; for (let i = 0; i < ko.length / 2; i++) { const a = ko[i], b = ko[ko.length - 1 - i]; const m = simMatch(team(a), team(b), { ko: true }); nx.push(m.hg > m.ag ? a : m.hg < m.ag ? b : (m.pen === 'h' ? a : b)); } ko = nx; } champ = ko[0]; }
    champs[L.id] = club(champ).n; if (L.tier === 1) hon.champs.push(champ);
    if (proLike() && S.club.id && myClub().lid === L.id && champ === S.club.id && (isCoach() || S.ss.apps >= 5)) winTrophy(L.id === 'USA' ? 'MLS Cup' : L.tier === 2 ? 'Champion de ' + L.name : L.name, myClub().n);
  }
  for (const L of TOP) { const cup = W.cups[L.id]; if (!cup.winner) cup.winner = wpick(Object.values(W.clubs).filter(c => c.cc === L.id && !(S.club.id === c.id && !cup.alive)).map(c => c.id), id => Math.pow(club(id).s - 55, 3)); hon.cups[L.id] = club(cup.winner).n; }
  // montées / descentes
  const promoTxt = [];
  for (const cc in PROMO) {
    const P_ = PROMO[cc], top = W.lastOrder[cc], sec = W.lastOrder[cc + '2'].filter(id => !NO_PROMO.includes(club(id).n));
    const down = top.slice(-P_.down), up = sec.slice(0, 2);
    if (P_.barrage) { const a = top[top.length - P_.down - 1], b = sec[2]; const m1 = simMatch(team(b), team(a)), m2 = simMatch(team(a), team(b), { ko: true }); const ga = m1.ag + m2.hg, gb = m1.hg + m2.ag; if (gb > ga || (gb === ga && m2.pen === 'a')) { down.push(a); up.push(b); promoTxt.push(`Barrage : ${club(b).n} monte, ${club(a).n} descend.`); } }
    else { const po = sec.slice(2, 6); const s1 = simMatch(team(po[0]), team(po[3]), { ko: true }), s2 = simMatch(team(po[1]), team(po[2]), { ko: true }); const f1 = s1.hg > s1.ag || (s1.hg === s1.ag && s1.pen === 'h') ? po[0] : po[3], f2 = s2.hg > s2.ag || (s2.hg === s2.ag && s2.pen === 'h') ? po[1] : po[2]; const fm = simMatch(team(f1), team(f2), { ko: true, neutral: true }); up.push(fm.hg > fm.ag || (fm.hg === fm.ag && fm.pen === 'h') ? f1 : f2); }
    for (const id of down) { moveClub(id, cc + '2'); moves.push([id, 'down']); }
    for (const id of up) { moveClub(id, cc); moves.push([id, 'up']); }
    promoTxt.push(`${L_BY(cc).name} : ${up.map(id => club(id).n).join(', ')} montent · ${down.map(id => club(id).n).join(', ')} descendent.`);
  }
  for (const [id, dir] of moves) if (id === S.club.id) {
    if (dir === 'up') { S.flags.promoted = true; S.trophies.push({ t: 'Montée en ' + L_BY(club(id).lid).name, s: seasonLabel(S.season), c: club(id).n }); }
    queueEvent({ title: dir === 'up' ? 'Montée !' : 'Relégation', text: dir === 'up' ? `${club(id).n} monte en ${L_BY(club(id).lid).name} ! La ville fait la fête toute la nuit.` : `${club(id).n} est relégué en ${L_BY(club(id).lid).name}. Les supporters sont abattus. Ton avenir est à réfléchir.`, ch: [{ t: 'Continuer', f: () => { if (dir === 'down') S.p.moral -= 10; return null; } }] });
  }
  W.lastHon = hon;
  const rrow = rivalSeasonEnd(champs);
  W.hist.push({ s: seasonLabel(S.season), champs, cups: hon.cups, ucl: W.cl.UEFA.winner ? team(W.cl.UEFA.winner).n : '—', afc: W.cl.AFC.winner ? team(W.cl.AFC.winner).n : '—', cnc: W.cl.CONCACAF.winner ? team(W.cl.CONCACAF.winner).n : '—', promo: promoTxt });
  // bilan joueur
  const ss = S.ss, avg = ss.apps ? Math.round(ss.rs / ss.apps * 10) / 10 : 0;
  const trThis = S.trophies.filter(t => t.s === seasonLabel(S.season)).map(t => t.t);
  S.lastSS = { apps: ss.apps, g: ss.g, a: ss.a, avg, ovr: OVR(), club: S.club.n, tr: trThis };
  let pos = null;
  if (proLike() && S.club.id) {
    const lid = W.lastOrder[myClub().lid] ? myClub().lid : null; const oldLid = moves.find(m => m[0] === S.club.id) ? (moves.find(m => m[0] === S.club.id)[1] === 'up' ? myClub().cc + '2' : myClub().cc) : myClub().lid;
    pos = W.lastOrder[oldLid].indexOf(S.club.id) + 1;
    if (!isCoach()) {
    const ts = topScorers(oldLid, 1)[0];
    if (ts && ts.me && ss.g >= 8) { S.awards.push({ t: 'Meilleur buteur de ' + L_BY(oldLid).name, s: seasonLabel(S.season) }); addNews('Distinction', `${pName()} termine meilleur buteur de ${L_BY(oldLid).name} avec ${ss.g} buts.`); }
    if (S.p.age <= 21 && avg >= 7.1 && ss.apps >= 18) S.awards.push({ t: 'Meilleur jeune de ' + L_BY(oldLid).name, s: seasonLabel(S.season) });
    if (avg >= 7.4 && ss.apps >= 25 && R() < .5) S.awards.push({ t: 'Équipe type de ' + L_BY(oldLid).name, s: seasonLabel(S.season) });
    }
  }
  if (ss.apps > 0) S.hist.push(Object.assign(histRow(), { pos }));
  S.ss = newSS(S.club.n);
  // contrats
  if (S.club.kind === 'pro' && S.club.loanFrom) {
    const lf = S.club.loanFrom, back = club(lf.id);
    queueEvent({ title: 'Fin du prêt', text: `Ton prêt à ${S.club.n} est terminé. Retour à ${back.n}.`, ch: [{ t: 'OK', f: () => { joinClub(lf.id, 'pro', lf.wage, Math.max(1, lf.until - S.season), 0); S.club.until = lf.until; return null; } }] });
  } else if (S.club.kind === 'pro' && S.season >= S.club.until) {
    addNews('Contrat', `Le contrat de ${pName()} avec ${S.club.n} est arrivé à son terme. Il est libre.`);
    S.club = { kind: 'amateur', id: null, n: 'Sans club (joueur libre)', wage: 0, until: 0, free: true, since: S.season, num: S.club.num };
    S.squad = []; S.coach = { n: '—', rel: 50 }; buildWeek();
  }
  if (S.club.kind === 'academy' && (S.p.age >= 19 || (S.p.age >= 18 && OVR() < acadThr(myClub(), S.p.age) - 10))) {
    const n = S.club.n;
    queueEvent({ title: 'Le centre ne te garde pas', text: `${n} ne te propose pas de contrat professionnel. C'est dur, mais beaucoup de grands joueurs ont rebondi après un échec.${S.school.bac ? ' Ton bac en poche, tu as aussi un plan B.' : ''}`, ch: [{ t: 'Rebondir', f: () => { S.club = { kind: 'amateur', id: null, n: 'Sans club (joueur libre)', wage: 0, until: 0, free: true, since: S.season, num: S.club.num }; S.squad = []; S.p.moral -= 15; buildWeek(); return 'Tu peux faire des essais ou attendre des offres de clubs.'; } }] });
  }
  const lines = isCoach() ? [S.club.id ? `<div class="mline"><span>Bilan de ${esc0(S.club.n)}</span><b>${S.mgr.ss.w} V · ${S.mgr.ss.d} N · ${S.mgr.ss.l} D</b></div>` : '<p>Saison sans club.</p>'] : [`<div class="mline"><span>Matchs</span><b>${S.lastSS.apps}</b></div><div class="mline"><span>Buts</span><b>${S.lastSS.g}</b></div><div class="mline"><span>Passes décisives</span><b>${S.lastSS.a}</b></div><div class="mline"><span>Note moyenne</span><b>${avg || '–'}</b></div>`];
  if (pos) lines.push(`<div class="mline"><span>Classement de ${S.lastSS.club}</span><b>${pos}e</b></div>`);
  if (rrow && !isCoach()) lines.push(`<p class="note">Ton rival ${S.rival.n} (${rrow.c}) : ${rrow.g} buts, ${rrow.a} passes D, note ${rrow.o}. Toi : ${S.lastSS.g} buts, ${S.lastSS.a} passes D, note ${S.lastSS.ovr}.</p>`);
  if (trThis.length) lines.push(`<p><b>Trophées :</b> ${trThis.join(', ')}</p>`);
  lines.push('<p class="note"><b>Champions :</b> ' + TOP.map(L => `${L.name} : ${champs[L.id]}`).join(' · ') + `<br><b>Ligue des champions :</b> ${W.hist[W.hist.length - 1].ucl}</p>`);
  queueEvent({ title: `Bilan ${seasonLabel(S.season)}`, text: lines.join(''), ch: [{ t: 'Place aux vacances', f: () => null }] });
  if (isCoach() && pos) mgrSeasonEnd(pos);
}
const esc0 = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function summerWorld() {
  const W = S.W, moves = [];
  for (const s of W.stars) { if (s.rival) continue; s.a++; const d = s.a <= 22 ? ri(1, 3) : s.a <= 27 ? ri(-1, 1) : s.a <= 30 ? ri(-2, 0) : s.a <= 33 ? ri(-3, -1) : ri(-4, -2); s.o = clamp(s.o + d, 55, 95); }
  const retired = W.stars.filter(s => !s.rival && ((s.a >= 36 && s.o < 78) || s.a >= 41));
  for (const s of retired) addNews('Retraite', `${s.n} (${club(s.cid).n}) met un terme à sa carrière.`);
  W.stars = W.stars.filter(s => !retired.includes(s));
  const clubsArr = Object.values(W.clubs);
  for (let i = 0; i < retired.length + ri(2, 5); i++) { const c = wpick(clubsArr, x => Math.pow(Math.max(1, x.s - 60), 2)); const nat = pick(Object.keys(NAMEPOOL)); W.stars.push({ n: genName(nat), pos: pick(['GB', 'DC', 'DC', 'DL', 'MDC', 'MC', 'MOC', 'AIL', 'AIL', 'BU', 'BU']), o: clamp(Math.round(c.s - 8 + gauss() * 4), 62, 84), a: ri(17, 20), cid: c.id, g: 0, as: 0, ap: 0, inj: 0, ls: { g: 0, as: 0, ap: 0 }, gen: true }); }
  const big = clubsArr.filter(c => c.s >= 82 && L_BY(c.lid).tier === 1);
  for (const s of shuffle(W.stars.slice()).slice(0, 70)) {
    if (moves.length >= 12) break;
    if (s.rival) continue;
    const c = club(s.cid);
    if (S.club.id === c.id && R() < .5) continue;
    if (s.o >= c.s + 3 && s.a <= 30 && R() < .5) { const t = pick(big.filter(b => b.id !== c.id && b.s >= s.o - 4)); if (t) moves.push([s, t]); }
    else if (s.a >= 31 && ['ENG', 'ESP', 'ITA', 'GER', 'FRA'].includes(c.lid) && R() < .18) { const t = pick(clubsArr.filter(b => ['KSA', 'USA', 'TUR'].includes(b.lid) && b.s >= 72)); if (t) moves.push([s, t]); }
    else if (L_BY(c.lid).tier === 2 && s.o >= 72) { const t = pick(clubsArr.filter(b => L_BY(b.lid).tier === 1 && b.cc === c.cc && b.s >= s.o - 6)); if (t) moves.push([s, t]); }
  }
  for (const [s, t] of moves) { const from = club(s.cid).n; s.cid = t.id; addNews('Mercato', `${s.n} quitte ${from} et s'engage avec ${t.n}.`); }
  IDX = null;
  for (const c of clubsArr) { const tier = L_BY(c.lid).tier; const st = starsOf(c.id); const top = st.map(x => x.o).sort((a, b) => b - a).slice(0, 5); const avg = top.length ? top.reduce((a, b) => a + b, 0) / top.length : c.base - 3; c.s = Math.round(clamp(c.base * .6 + Math.max(avg, c.base - 4) * .4 + rf(-1, 1) + (tier === 1 && c.base < 66 ? 2 : 0) - (tier === 2 && c.base > 72 ? 2 : 0), 58, 92)); }
  S.fam.dad.age++; S.fam.mom.age++;
  if (S.fam.dad.age === 64) inbox('info', 'Retraite de ton père', `${S.fam.dad.n.split(' ')[0]} prend sa retraite après une vie de travail.`);
  if (proLike() && S.club.id) refreshSquadStars();
}

// ---------- Succès ----------
const ACH = [
  ['first', 'Premier match', 'Jouer ton premier match', () => S.ss.apps > 0 || S.hist.length > 0],
  ['goal', 'Premier but', 'Marquer ton premier but', () => S.ss.g > 0 || S.hist.some(h => h.g > 0)],
  ['scout', 'Repéré !', 'Être repéré par un recruteur', () => S.flags.scouted],
  ['acad', 'Centre de formation', 'Intégrer un centre de formation', () => S.flags.academy],
  ['pro', 'Footballeur pro', 'Signer ton premier contrat pro', () => S.flags.pro],
  ['hat', 'Coup du chapeau', 'Marquer un triplé', () => S.stats.hat > 0],
  ['ten', 'Match parfait', 'Obtenir la note de 10', () => S.stats.tens > 0],
  ['derby', 'Héros du derby', 'Marquer dans un derby', () => S.stats.derbyGoals > 0],
  ['cap', 'Sélectionné', 'Jouer en équipe nationale A', () => S.intl.caps > 0],
  ['cap50', 'Cadre de la sélection', '50 sélections', () => S.intl.caps >= 50],
  ['capt', 'Capitaine', 'Recevoir le brassard', () => S.flags.captain],
  ['app100', 'Centurion', '100 matchs professionnels', () => S.stats.proApps >= 100],
  ['g100', 'Machine à buts', '100 buts professionnels', () => S.stats.proGoals >= 100],
  ['league', 'Champion', 'Gagner un championnat de 1re division', () => S.trophies.some(t => TOP.some(L => L.name === t.t) || t.t === 'MLS Cup')],
  ['cup', 'Coupe en poche', 'Gagner une coupe nationale', () => S.trophies.some(t => TOP.some(L => L.cup === t.t))],
  ['ucl', 'Roi d\'Europe', 'Gagner la Ligue des champions', () => S.trophies.some(t => t.t === 'Ligue des champions')],
  ['wc', 'Champion du monde', 'Gagner la Coupe du monde', () => S.trophies.some(t => t.t === 'Coupe du monde')],
  ['bdo', 'Ballon d\'Or', 'Remporter le Ballon d\'Or', () => S.awards.some(a => a.t === 'Ballon d\'Or')],
  ['up', 'Montée', 'Monter en 1re division avec ton club', () => S.flags.promoted],
  ['eu', 'Globe-trotter', 'Jouer dans 3 championnats différents', () => S.stats.leagues.length >= 3],
  ['fee', 'Transfert record', 'Être transféré pour 100 M€ ou plus', () => S.flags.fee100],
  ['mill', 'Millionnaire', 'Fortune de 1 M€', () => wealth() >= 1e6],
  ['cent', 'Fortune colossale', 'Fortune de 100 M€', () => wealth() >= 1e8],
  ['parents', 'Merci papa, merci maman', 'Offrir une maison à tes parents', () => !!S.fam.house],
  ['permis', 'Permis en poche', 'Obtenir ton permis de conduire', () => S.permis.ok],
  ['bac', 'Bachelier', 'Obtenir ton bac', () => S.flags.bac],
  ['married', 'Oui !', 'Te marier', () => S.flags.married],
  ['dad', 'Papa', 'Avoir un enfant', () => S.flags.dad],
  ['f1m', 'Influenceur', '1 million d\'abonnés', () => S.p.followers >= 1e6],
  ['f10m', 'Star mondiale', '10 millions d\'abonnés', () => S.p.followers >= 1e7],
  ['cs50', 'Mur infranchissable', '50 clean sheets en pro', () => S.stats.cs >= 50],
  ['legend', 'Légende', 'Atteindre un score de légende de 180', () => legendScore() >= 180],
  ['perk', 'Un talent', 'Débloquer ton premier talent', () => Object.keys(S.perks || {}).length > 0],
  ['perk5', 'Joueur complet', 'Débloquer 5 talents', () => Object.keys(S.perks || {}).length >= 5],
  ['chal10', 'Régulier', 'Réussir 10 défis de la semaine', () => (S.stats.chal || 0) >= 10],
  ['rivalbdo', 'Au-dessus du lot', 'Finir devant ton rival au Ballon d\'Or', () => S.bdo.some(b => b.rank && (!b.rr || b.rank < b.rr))],
  ['h2h', 'Duel gagné', 'Battre l\'équipe de ton rival', () => S.rival && S.rival.h2h.w > 0],
  ['coach1', 'Sur le banc', 'Diriger ton premier match comme entraîneur', () => S.mgr && S.mgr.w + S.mgr.d + S.mgr.l > 0],
  ['coachT', 'Coach titré', 'Gagner un trophée comme entraîneur', () => S.trophies.some(t => t.coach)],
];
function checkAchievements() {
  for (const [id, n, d, t] of ACH) if (!S.ach[id]) { let ok = false; try { ok = !!t(); } catch (e) { } if (ok) { S.ach[id] = dateStr(); inbox('info', 'Succès débloqué : ' + n, d + '.'); (S.newAch = S.newAch || []).push(n); } }
}

// ---------- Achats & famille ----------
function buy(cat, id) {
  const p = S.p;
  if (cat === 'serv') {
    const s = SERVICES.find(x => x.id === id);
    if (S.assets.serv.includes(id)) { if (s.once) return 'Déjà acheté.'; S.assets.serv = S.assets.serv.filter(x => x !== id); return `${s.n} : arrêté.`; }
    if (s.once) { if (p.money < s.p) return 'Pas assez d\'argent.'; spend(s.p, 'Matériel'); }
    else if (p.money < monthly(s.wk)) return 'Il te faut au moins un mois d\'avance.';
    S.assets.serv.push(id); return `${s.n} : activé.`;
  }
  if (p.age < 18 && cat !== 'gifts') return 'Il faut avoir 18 ans.';
  const it = SHOP[cat].find(x => x.id === id);
  if (cat === 'cars' && !S.permis.ok) return 'Passe d\'abord ton permis de conduire.';
  if (p.money < it.p) return `Il te manque ${eur(it.p - p.money)}.`;
  spend(it.p, cat === 'houses' ? 'Immobilier' : cat === 'cars' ? 'Voitures' : 'Cadeaux');
  if (cat === 'houses') { S.assets.houses.push({ id, n: it.n, p: it.p }); p.moral += it.m; addNews('Vie privée', `${pName()} s'offre : ${it.n.toLowerCase()}.`); return `Félicitations, tu es propriétaire : ${it.n}.`; }
  if (cat === 'cars') { S.assets.cars.push({ id, n: it.n, p: it.p }); p.moral += it.m; return `${it.n} dans ton garage !`; }
  if (id === 'gparents' || id === 'gvilla') { S.fam.house = id; S.fam.dad.rel = 100; S.fam.mom.rel = 100; S.fam.stress = 0; p.moral = 100; S.fam.w = Math.max(S.fam.w, id === 'gvilla' ? 2 : 1); addNews('Émotion', `${pName()} offre une ${id === 'gvilla' ? 'villa' : 'maison'} à ses parents.${S.fam.sac ? ' Une façon de les remercier pour tous leurs sacrifices.' : ''}`); feedPost('Papa', 'Je n\'ai pas les mots. Merci mon fils. On a toujours cru en toi.'); return 'Tes parents découvrent leur nouvelle maison. Ta mère pleure, ton père aussi.'; }
  if (id === 'gcar') { S.fam.car = true; S.fam.dad.rel += 15; S.fam.mom.rel += 10; return 'Ton père n\'en revient pas. Il fait le tour du quartier trois fois.'; }
  if (id === 'gfriend') { S.friend.house = true; S.friend.rel = 100; return `${S.friend.n.split(' ')[0]} est sans voix. Une amitié pour la vie.`; }
  if (id === 'gtrip') { S.fam.dad.rel += 8; S.fam.mom.rel += 8; S.fam.stress -= 10; p.moral += 8; return 'Des vacances inoubliables en famille.'; }
}
function sell(cat, i) { const a = S.assets[cat][i]; if (!a) return ''; const v = Math.round(a.p * (cat === 'houses' ? .9 : .5)); earn(v, 'Ventes'); S.assets[cat].splice(i, 1); return `Vendu pour ${eur(v)}.`; }
function invest(kind, amt) {
  const p = S.p, A = S.assets; amt = Math.round(amt);
  if (kind === 'immo') { if (p.age < 18) return 'Il faut avoir 18 ans.'; if (p.money < 400000) return 'Un bien locatif coûte 400 000 €.'; p.money -= 400000; A.immo.push({ n: pick(['Immeuble de rapport', 'Appartements meublés', 'Local commercial', 'Résidence étudiante']) + ' à ' + pick(['Lyon', 'Bordeaux', 'Lisbonne', 'Madrid', 'Dubaï', 'Montpellier']), v: 400000 }); return 'Bien locatif acheté : environ 4 % de loyers par an.'; }
  if (amt <= 0 || p.money < amt) return 'Pas assez d\'argent.';
  if (kind === 'st') { if (amt < 50000) return 'Minimum 50 000 €.'; p.money -= amt; A.st.push({ n: pick(['FitTrack', 'KickLab', 'GreenCrate', 'Pitchly', 'MedScan', 'Foodies', 'Sporty AI']), amt, end: absDay() + ri(210, 700), done: false }); return 'Investissement réalisé. Résultat dans 1 à 2 ans.'; }
  p.money -= amt; A[kind] += amt; return `${eur(amt)} placés.`;
}
function withdraw(kind) { const v = Math.round(S.assets[kind]); if (v <= 0) return 'Rien à retirer.'; S.p.money += v; S.assets[kind] = 0; return `${eur(v)} récupérés.`; }
function askParents() {
  const f = S.fam;
  if (absDay() - f.lastAsk < 28) return 'Tu as déjà demandé ce mois-ci.';
  f.lastAsk = absDay();
  const give = Math.round(Math.min(f.savings * .25, [60, 200, 900][f.w]) * DF().money);
  if (give < 15) { f.stress += 3; return 'Tes parents n\'ont rien à te donner pour l\'instant.'; }
  f.savings -= give; earn(give, 'Aide des parents'); f.stress += f.w === 0 ? 5 : 2; f.dad.rel -= 1;
  return `Tes parents te donnent ${eur(give)}.`;
}
function sacrifice() {
  const f = S.fam;
  if (f.sac >= 3) return 'Tes parents ont déjà tout donné.';
  if (S.club.kind === 'pro') return 'Tu gagnes ta vie maintenant.';
  const g = Math.round([650, 1300, 3500][f.w] * DF().money);
  f.sac++; f.stress += 22; earn(g, 'Sacrifice des parents'); f.mom.rel += 4; f.dad.rel += 4;
  addNews('Famille', ['Ton père prend des heures de nuit à l\'usine.', 'Ta mère fait des ménages le week-end en plus de son travail.', 'Tes parents font un crédit pour financer ton rêve.'][f.sac - 1]);
  return `Tes parents se sacrifient pour toi : +${eur(g)}. Ne les déçois pas.`;
}
function familyMove(cid) { if (S.p.money < 2500) return false; spend(2500, 'Déménagement familial'); S.fam.stress += 30; S.flags.famMoved = club(cid).city; return true; }

// ---------- Fin de carrière ----------
function retire() { if (S.ss.apps > 0) S.hist.push(histRow()); S.over = true; S.ended = null; addNews('Retraite', `${pName()} annonce la fin de sa carrière à ${S.p.age} ans.`); }
function legendScore() {
  let sc = 0;
  for (const t of S.trophies) sc += /Ballon d'Or/.test(t.t) ? 40 : /Coupe du monde/.test(t.t) ? 30 : /Ligue des champions$/.test(t.t) ? 20 : /Euro|Copa|CAN|Gold/.test(t.t) ? 15 : /Montée/.test(t.t) ? 3 : /Cup|Coupe|Copa del Rey|Pokal|Coppa|Taça|Beker|King/.test(t.t) ? 4 : 8;
  sc += S.stats.proGoals * .3 + S.intl.caps * .4 + S.intl.g * .6;
  return Math.round(sc);
}
function legendTitle(sc) { return sc >= 300 ? 'Légende éternelle du football' : sc >= 180 ? 'Légende' : sc >= 100 ? 'Grand joueur' : sc >= 50 ? 'Très bon professionnel' : sc >= 15 ? 'Joueur professionnel' : 'Rêveur courageux'; }
function reconvOptions() {
  const w = wealth(), rep = S.p.rep, pro = S.flags.pro;
  return [
    { id: 'coach', n: 'Devenir entraîneur (jouable)', d: 'Diplômes, puis tu prends un banc : tactiques, mercato, président.', ok: pro },
    { id: 'tv', n: 'Consultant TV', d: 'Commenter les grands matchs.', ok: rep >= 35 },
    { id: 'pres', n: 'Président de club', d: 'Racheter un club (30 M€ minimum).', ok: w >= 3e7 },
    { id: 'found', n: 'Créer ta fondation', d: 'Aider les jeunes de ton quartier (2 M€).', ok: w >= 2e6 },
    { id: 'study', n: 'Reprendre des études', d: S.school.bac ? 'Ton bac t\'ouvre l\'université.' : 'Formation professionnelle.', ok: true },
    { id: 'family', n: 'Profiter de ta famille', d: 'Une vie tranquille.', ok: true },
  ];
}
function reconvert(id) {
  if (id === 'coach') { startCoaching(); return ''; }
  const p = S.p, last = S.hist.filter(h => !/amateur|formation/.test(h.c)).pop(), home = amateurName(p.nat, p.city);
  let txt = '';
  if (id === 'coach') {
    const sc = p.at.MEN + p.rep / 2 + rf(-15, 15);
    txt = sc > 95 ? `Après tes diplômes, tu prends les U19 de ${last ? last.c : home}, puis l'équipe première. Quelques années plus tard, tu soulèves un titre de champion comme entraîneur, et ${nation().n} t'appelle pour devenir sélectionneur.` : sc > 70 ? `Tu deviens entraîneur adjoint, puis numéro un d'un club de 2e division que tu fais monter. Ta méthode est respectée partout.` : `Tu entraînes les jeunes de ${home}. Plusieurs de tes joueurs deviennent pros, et c'est ta plus grande fierté.`;
  } else if (id === 'tv') txt = `Tu deviens consultant à la télévision. Ton franc-parler fait de toi la voix des grands soirs de ${CONT_CUP.UEFA}.`;
  else if (id === 'pres') { spend(3e7, 'Rachat de club'); txt = `Tu rachètes ${home} et tu le fais grimper division après division. Le stade porte désormais ton nom.`; }
  else if (id === 'found') { spend(2e6, 'Fondation'); txt = `Ta fondation construit des terrains et finance les déplacements des jeunes de familles modestes, comme toi autrefois. Des centaines d'enfants ont leur chance grâce à toi.`; }
  else if (id === 'study') txt = S.school.bac ? 'Tu reprends des études de management du sport et tu deviens directeur sportif.' : 'Tu passes une formation et tu ouvres ta propre école de foot.';
  else txt = `Tu profites enfin de ${S.love ? 'ta famille' : 'tes proches'}${S.love && S.love.kids.length ? ' et de tes ' + S.love.kids.length + ' enfant' + (S.love.kids.length > 1 ? 's' : '') : ''}. Tes parents vivent ${S.fam.house ? 'dans la maison que tu leur as offerte' : 'tranquillement'}.`;
  S.ended = { id, txt }; return txt;
}
function planBOk() { return !S.flags.pro && S.p.age >= 21; }
function planB() { if (S.ss.apps > 0) S.hist.push(histRow()); S.over = true; S.ended = { id: 'planb', txt: S.school.bac ? 'Tu raccroches les crampons et tu reprends tes études grâce à ton bac. Aujourd\'hui, tu travailles dans le sport, et tu joues encore le dimanche avec tes amis.' : 'Tu raccroches les crampons sans diplôme. Tu trouves un travail et tu entraînes les enfants du quartier le mercredi. Le foot reste ta passion.' }; }

// ---------- Sauvegardes ----------
const SAVE_PREFIX = 'cdo2_slot_', META_KEY = 'cdo2_meta';
function slotsMeta() { try { return JSON.parse(localStorage.getItem(META_KEY) || '{}'); } catch (e) { return {}; } }
function save() {
  if (!S) return;
  try { if (typeof shopTick === 'function') { shopTick(); S.shopW = shopSnap(); } } catch (e) { }
  try {
    const slot = S.slot || 1;
    localStorage.setItem(SAVE_PREFIX + slot, JSON.stringify(S, (k, v) => k === 'ref' ? undefined : v));
    const m = slotsMeta(); m[slot] = { name: pName(), age: S.p.age, club: S.club.n, date: fmtShort(today()), ovr: OVR(), over: S.over, ts: Date.now() }; localStorage.setItem(META_KEY, JSON.stringify(m));
  } catch (e) { }
  try { if (typeof onlAuto === 'function') onlAuto(); } catch (e) { }
}
function loadSlot(n) { try { const t = localStorage.getItem(SAVE_PREFIX + n); if (!t) return null; const s = JSON.parse(t); if (!s || s.v !== VERSION) return null; s.slot = n; return s; } catch (e) { return null; } }
function deleteSlot(n) { try { localStorage.removeItem(SAVE_PREFIX + n); const m = slotsMeta(); delete m[n]; localStorage.setItem(META_KEY, JSON.stringify(m)); } catch (e) { } }
function hydrate(s) { S = s; IDX = null; EVQ = []; if (typeof FQ !== 'undefined') FQ.q = []; if (S.squad) for (const x of S.squad) if (x.star) x.ref = S.W.stars.find(st => st.n === x.n); ensureV3(); if (S.live && S.live.M && !S.live.M.eng && typeof liveSetup === 'function') { try { S.live.M = liveSetup(S.live.prep); } catch (e) { S.live = null; } } if (S.live && S.live.M && S.live.M.eng && typeof meUpgrade === 'function') { meUpgrade(S.live.M.E); const M = S.live.M; if (!M.com) { M.com = []; M.cmT = M.clockAt || 0; M.comLast = -99; M.say = []; } } }
function exportSave() {
  try { if (typeof shopSnap === 'function') S.shopW = shopSnap(); } catch (e) { }
  const json = JSON.stringify(S, (k, v) => k === 'ref' ? undefined : v);
  const LZ = typeof LZString !== 'undefined' ? LZString : (typeof window !== 'undefined' ? window.LZString : null);
  if (LZ) return 'CDO2Z' + LZ.compressToBase64(json);
  return 'CDO2B' + btoa(unescape(encodeURIComponent(json)));
}
function importSave(str, slot) {
  try {
    str = (str || '').trim().replace(/\s+/g, '');
    let json = null;
    const LZ = typeof LZString !== 'undefined' ? LZString : (typeof window !== 'undefined' ? window.LZString : null);
    if (str.startsWith('CDO2Z')) { if (!LZ) return 'Impossible de décompresser (connexion nécessaire).'; json = LZ.decompressFromBase64(str.slice(5)); }
    else if (str.startsWith('CDO2B')) json = decodeURIComponent(escape(atob(str.slice(5))));
    else return 'Ce code ne ressemble pas à une sauvegarde Crampons d\'Or.';
    const s = JSON.parse(json); if (!s || s.v !== VERSION) return 'Sauvegarde d\'une ancienne version.';
    s.slot = slot; hydrate(s); if (typeof shopMerge === 'function') shopMerge(s.shopW); save(); return null;
  } catch (e) { return 'Code invalide ou incomplet.'; }
}
