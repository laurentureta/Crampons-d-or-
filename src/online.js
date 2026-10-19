// ---------- En ligne (Supabase) : sauvegarde dans le nuage et classement des carrières ----------
// La clé publiable de Supabase est publique par nature : elle ne permet que ce que les fonctions de tools/supabase.sql autorisent.
// Tant que l'adresse et la clé sont vides, tout ce qui est « en ligne » reste caché.
const ONL = {
  url: 'https://fuhkhyxeytrbxvlqycpj.supabase.co',   // projet Supabase « crampons-dor » (Paris)
  key: 'sb_publishable_N4BoduZ5wSoiqQxpHcLgvA_lhOXEcnT',   // clé publiable : publique par nature
  busy: false, last: 0, pubLast: 0, top: null, topAt: 0, err: '',
};
const onlOn = () => !!(ONL.url && ONL.key) && typeof fetch === 'function';
async function onlRpc(fn, args) {
  const r = await fetch(ONL.url.replace(/\/+$/, '') + '/rest/v1/rpc/' + fn, {
    // clé publiable (sb_…) : seulement dans « apikey » ; ancienne clé anon (JWT) : aussi dans Authorization
    method: 'POST', headers: Object.assign({ apikey: ONL.key, 'Content-Type': 'application/json' }, /^sb_/.test(ONL.key) ? {} : { Authorization: 'Bearer ' + ONL.key }), body: JSON.stringify(args || {}),
  });
  if (!r.ok) { let m = ''; try { m = (await r.json()).message || ''; } catch (e) { } throw Object.assign(new Error(m || 'HTTP ' + r.status), { st: r.status }); }
  const t = await r.text(); return t ? JSON.parse(t) : null;
}
// code de sauvegarde : 12 caractères faciles à recopier (sans 0/O ni 1/I), environ 60 bits de hasard
const ONL_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function onlNewCode() { const a = new Uint8Array(12); crypto.getRandomValues(a); return Array.from(a, x => ONL_ABC[x % 32]).join(''); }
const onlFmt = c => c ? c.replace(/(.{4})(?=.)/g, '$1-') : '';
const onlClean = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
function onlId() { if (!S.onl) S.onl = {}; if (!S.onl.id) { const a = new Uint8Array(8); crypto.getRandomValues(a); S.onl.id = Array.from(a, x => x.toString(16).padStart(2, '0')).join(''); } return S.onl.id; }

// sauvegarde dans le nuage (la carrière entière, compressée)
async function onlSave(silent) {
  if (!onlOn() || !S || ONL.busy) return false;
  if (!S.onl) S.onl = {};
  if (!S.onl.code) S.onl.code = onlNewCode();
  ONL.busy = true;
  try {
    await onlRpc('cdo_sauver', { p_code: S.onl.code, p_data: exportSave(), p_nom: pName(), p_club: S.club.n, p_age: S.p.age });
    ONL.last = Date.now(); S.onl.at = ONL.last; ONL.err = '';
    if (!silent) toast('Carrière sauvegardée en ligne.');
    return true;
  } catch (e) { ONL.err = e.message; if (!silent) toast('Sauvegarde en ligne impossible : ' + e.message); return false; }
  finally { ONL.busy = false; }
}
async function onlLoad(code, slot) {
  if (!onlOn()) return 'La sauvegarde en ligne n\'est pas activée.';
  const c = onlClean(code); if (c.length !== 12) return 'Le code fait 12 caractères (ex. ABCD-EFGH-JKLM).';
  try {
    const rows = await onlRpc('cdo_charger', { p_code: c });
    if (!rows || !rows.length) return 'Aucune carrière avec ce code.';
    const err = importSave(rows[0].data, slot); if (err) return err;
    if (!S.onl) S.onl = {}; S.onl.code = c; save(); return null;
  } catch (e) { return 'Connexion impossible : ' + e.message; }
}
// classement : une ligne par carrière (le joueur fictif, pas la personne)
async function onlPublish(force) {
  if (!onlOn() || !S || S.onl && S.onl.pub === false) return;
  if (!force && Date.now() - ONL.pubLast < 10 * 60e3) return;
  ONL.pubLast = Date.now();
  const tr = S.trophies || [];
  try {
    await onlRpc('cdo_publier', { p: {
      joueur: onlId(), nom: pName(), poste: S.p.pos, nation: S.p.nat, club: S.club.n, age: S.p.age, saison: typeof today === 'function' ? today().getFullYear() : 0,
      score: legendScore(), note: OVR(), buts: S.stats.proGoals || 0, selections: S.intl.caps || 0,
      trophees: tr.length, ballons_or: tr.filter(t => /Ballon d'Or/.test(t.t)).length, fini: !!S.over,
    } });
  } catch (e) { ONL.err = e.message; }
}
// le classement ne montre pas l'identifiant secret des carrières, seulement une empreinte : on reconnaît la sienne en la recalculant
async function onlMyKey() {
  const id = S && S.onl && S.onl.id; if (!id) return null;
  if (ONL.myKey && ONL.myKeyOf === id) return ONL.myKey;
  try { const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(id)); ONL.myKey = Array.from(new Uint8Array(h), x => x.toString(16).padStart(2, '0')).join('').slice(0, 16); ONL.myKeyOf = id; } catch (e) { ONL.myKey = null; }
  return ONL.myKey;
}
async function onlTop(force) {
  if (!onlOn()) return null;
  if (!force && ONL.top && Date.now() - ONL.topAt < 60e3) return ONL.top;
  try { await onlMyKey(); ONL.top = await onlRpc('cdo_top', { n: 50 }) || []; ONL.topAt = Date.now(); ONL.err = ''; } catch (e) { ONL.err = e.message; if (!ONL.top) ONL.top = []; }
  return ONL.top;
}
// masquer / remontrer sa carrière dans le classement
async function onlSetPub(on) {
  if (!S) return; if (!S.onl) S.onl = {};
  S.onl.pub = on; save();
  try { if (on) await onlPublish(true); else if (S.onl.id) await onlRpc('cdo_retirer', { p_joueur: S.onl.id }); ONL.top = null; } catch (e) { ONL.err = e.message; }
}
// appelé après chaque sauvegarde locale : nuage toutes les 5 minutes au plus, classement toutes les 10
function onlAuto() {
  if (!onlOn() || !S) return;
  if (S.onl && S.onl.code && S.onl.auto !== false && Date.now() - ONL.last > 5 * 60e3) onlSave(true);
  onlPublish(false);
}

// ---------- écrans ----------
function vOnlineSave() {
  if (!onlOn()) return `<section class="card sec"><h3>Sauvegarde en ligne</h3><p class="note">Bientôt : ta carrière gardée dans le nuage, à retrouver sur n'importe quel téléphone avec un simple code.</p></section>`;
  const inGame = UI.screen === 'game' && S, c = inGame && S.onl && S.onl.code;
  return `<section class="card sec"><h3>Sauvegarde en ligne</h3>
    ${inGame ? (c ? `<p class="note">Ton code : <b class="onlcode">${onlFmt(c)}</b>. Note-le : il suffit pour retrouver cette carrière sur un autre téléphone. ${S.onl.at ? 'Dernier envoi : ' + new Date(S.onl.at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '.' : ''}</p>
      <div class="row"><button class="btn sm grow" data-a="onlSave">Envoyer maintenant</button><button class="btn sm ghost" data-a="onlAuto">${S.onl.auto === false ? 'Envoi auto : non' : 'Envoi auto : oui'}</button></div>`
      : `<p class="note">Garde ta carrière dans le nuage : tu recevras un code de 12 caractères pour la retrouver partout.</p><button class="btn wide" data-a="onlSave">Sauvegarder en ligne</button>`) : ''}
    ${inGame ? `<p class="note">Classement mondial : le nom de ton joueur, son club et ses chiffres sont visibles par tous.</p><div class="seg"><button data-a="onlPub" data-v="1" class="${S.onl && S.onl.pub === false ? '' : 'on'}">Visible</button><button data-a="onlPub" data-v="0" class="${S.onl && S.onl.pub === false ? 'on' : ''}">Caché</button></div>` : ''}
    <p class="note">Récupérer une carrière avec son code :</p><input id="onlCode" maxlength="16" placeholder="ABCD-EFGH-JKLM" autocomplete="off" autocapitalize="characters" spellcheck="false">
    <div class="row">${[1, 2, 3].map(n => `<button class="btn sm grow" data-a="onlLoad" data-v="${n}">Vers l'emplacement ${n}</button>`).join('')}</div>
    ${ONL.err ? `<p class="note bad">${esc(ONL.err)}</p>` : ''}</section>`;
}
function vRanks() {
  if (!onlOn()) return `<section class="card sec"><h3>Classement mondial</h3><p class="note">Bientôt : compare ta carrière à celles des autres joueurs (score de légende, buts, trophées, Ballons d'Or).</p></section>`;
  const T = ONL.top, me = S && S.onl && S.onl.id && ONL.myKeyOf === S.onl.id ? ONL.myKey : null;
  if (!T) { onlTop().then(() => { if (UI.page === 'ranks' || UI.sub === 'ranks') render(); }); return '<section class="card sec"><p class="note">Chargement du classement…</p></section>'; }
  if (!T.length) return '<section class="card sec"><p class="note">Personne n\'est encore classé. Sois le premier !</p></section>';
  return `<section class="card sec"><h3>Les plus grandes carrières</h3><p class="note">Score de légende : trophées, buts et sélections. Mis à jour pendant que chacun joue.</p>
    <div class="ranks">${T.map((r, i) => `<div class="rk ${me && r.cle === me ? 'me' : ''}"><span class="rkn">${i + 1}</span><span class="grow"><b>${esc(r.nom)}</b><span class="note">${esc(r.poste || '')} · ${esc(r.nation || '')} · ${esc(r.club || '')} · ${r.age} ans${r.fini ? ' · retraité' : ''}</span></span><span class="rks"><b>${r.score}</b><span class="note">${r.buts} buts · ${r.trophees} 🏆${r.ballons_or ? ' · ' + r.ballons_or + ' Ballon' + (r.ballons_or > 1 ? 's' : '') + " d'Or" : ''}</span></span></div>`).join('')}</div>
    <button class="btn sm ghost wide" data-a="onlTop">Actualiser</button></section>`;
}
const ONL_ACT = {
  onlSave: async () => { if (await onlSave(false)) { save(); render(); } },
  onlAuto: () => { S.onl.auto = S.onl.auto === false; save(); render(); },
  onlLoad: async v => {
    const el = $('#onlCode'), code = el ? el.value : ''; if (!code.trim()) return toast('Entre d\'abord ton code.');
    toast('Recherche de la carrière…'); const err = await onlLoad(code, +v); if (err) return toast(err);
    runLoading('Chargement', ['Téléchargement de la carrière…', 'Reconstruction du monde…', 'Coup d\'envoi'], null, enterGame);
  },
  onlTop: async () => { await onlTop(true); render(); },
  onlPub: async v => { await onlSetPub(v === '1'); toast(v === '1' ? 'Ta carrière apparaît dans le classement.' : 'Ta carrière est retirée du classement.'); render(); },
};
