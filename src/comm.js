// ===================== LES COMMENTATEURS : Jordi « Lo Sol » Puig et Nathalie Ferrand =====================
// Lo Sol : ancien ailier catalan, lyrique, passionné, part dans tous les sens, chante sur les beaux buts.
// Nathalie : ancienne milieu défensive internationale, consultante, pince-sans-rire, le ramène au match.
// Répliques : une chaîne = Lo Sol ; préfixe « N: » = Nathalie ; un tableau = un dialogue.
// Variables : {n} joueur, {n2} second joueur, {tm} son équipe, {other} l'autre équipe, {my} ton équipe, {op} l'adversaire,
// {home}/{away}, {me} ton surnom, {meN} ton nom, {sc} score, {min} minute, {city} ta ville, {att} affluence, {temp},
// {gk} gardien, {d} distance, {hello} bonjour/bonsoir, {rival}, {pron} pronostic, {anyp} un joueur au hasard.
const CM_WHO = { S: 'Lo Sol', N: 'Nathalie', P: 'Speaker' };
const CMX = {
  intro: [
    ['{hello} à tous ! Ici Jordi Puig, Lo Sol pour les intimes… et pour les autres aussi.', 'N:Et Nathalie Ferrand, qui va essayer de le canaliser pendant quatre-vingt-dix minutes.', 'Elle n\'y arrive jamais, mais elle essaie, et c\'est beau. {home} contre {away}, mes amis, préparez votre cœur !'],
    ['{hello} la compagnie ! On est là, on est vivants, et on a du football ! {home} reçoit {away}.', 'N:Une affiche assez équilibrée sur le papier.', 'Le papier, Nathalie ! Le papier ne court pas, le papier ne transpire pas ! C\'est le terrain qui va parler !'],
    ['{hello} ! Je suis arrivé trois heures avant le match, j\'ai déjà mangé deux sandwichs et serré la main de quarante personnes.', 'N:Dont moi. Deux fois.', 'Parce que je t\'aime bien, Nathalie. Allez, {home} contre {away}, c\'est parti pour la grande aventure !'],
    ['Mesdames, messieurs, les enfants, les grands-mères, et les chiens qui regardent avec vous : {hello} !', 'N:Il commence fort.', 'Je commence toujours fort, Nathalie, et je finis encore plus fort ! {home}, {away}, que le spectacle commence !'],
    ['{hello} et bienvenue ! Nathalie, comment tu le sens, ce match ?', 'N:Je sens un match tactique, fermé, avec peu d\'occasions.', 'Moi je sens des buts, des larmes, de la sueur et de la poésie ! On verra qui a raison !'],
    ['{hello} ! Vous êtes bien installés ? Le canapé est confortable ? Les chips sont à portée de main ?', 'N:On parle du match, Jordi ?', 'On y vient ! {home} contre {away}. Ça va être beau, ça va être fou, ça va être football !'],
  ],
  introNight: [['Ah, les matchs du soir… Les projecteurs, l\'herbe qui brille comme un miroir, l\'odeur des frites. C\'est ma madeleine de Proust, ça !', 'N:Ta madeleine de Proust, c\'est des frites ?', 'Chacun ses madeleines, Nathalie.']],
  introRain: [['Il pleut, mes amis ! Il pleut des cordes, des ficelles, des lacets !', 'N:La pelouse va être très glissante. Attention aux tacles.', 'On va voir du ski nautique ce soir. Sortez les bouées !']],
  introSnow: [['De la neige ! Regardez-moi ça, on se croirait au Canigou en plein mois de janvier !', 'N:Ballon orange de sortie, indispensable.', 'Le ballon orange ! Comme une mandarine posée sur un gâteau à la crème. Magnifique.']],
  introDerby: [['Un derby ! Un DERBY ! J\'ai des frissons jusque dans les chaussettes !', 'N:Dans ces matchs-là, la tête compte autant que les jambes.', 'La tête, les jambes, le cœur, les tripes, tout compte ! Ce soir, les familles sont divisées et les voisins ne se parlent plus jusqu\'à lundi !']],
  introBig: [['{att} spectateurs ! Écoutez-moi ce bruit, c\'est un volcan, c\'est un orchestre, c\'est la vie !', 'N:L\'ambiance est incroyable, c\'est vrai.', 'Si vous êtes chez vous, montez le son. Si vous êtes au stade, vous n\'entendez rien de ce que je dis… bonsoir quand même !']],
  introSmall: [['{att} spectateurs aujourd\'hui. Je crois que je les connais presque tous personnellement.', 'N:Il y a même le chien du gardien dans la tribune.', 'Je le salue aussi ! Les petits matchs, c\'est là que naissent les grands joueurs. Ne l\'oubliez jamais.']],
  introHot: [['{temp} degrés ! Les joueurs vont fondre comme le beurre sur la tartine.', 'N:La gestion de l\'effort va être décisive.', 'Buvez, les enfants ! Et vous à la maison aussi. De l\'eau, hein. De l\'eau.']],
  introCold: [['{temp} degrés… Je ne sens plus mes doigts, Nathalie. J\'ai mis deux pulls et l\'écharpe de ma grand-mère.', 'N:Les joueurs, eux, sont en manches courtes.', 'Les joueurs sont des héros. Moi, je suis un poète frileux.']],
  introCoach: [['Ce soir, on regarde un homme en particulier : l\'entraîneur {meN}, debout devant son banc.', 'N:Ses choix tactiques vont être scrutés.', 'Costume impeccable, regard d\'aigle. Allez coach, montre-nous ce que tu as dans la tête !']],
  introMe: [['Et sur la feuille de match, côté {my}, je vois {meN}… Mon petit chouchou ! {me} !', 'N:On l\'appelle comme ça, maintenant ?', 'Moi, je l\'appelle comme ça. Et quand Lo Sol donne un surnom, c\'est pour la vie !'], ['Je cherche quelqu\'un sur la feuille de match… Le voilà : {meN}. {me} pour les amis.', 'N:Tu l\'as à la bonne, celui-là.', 'J\'ai l\'œil, Nathalie. Ce garçon a quelque chose dans les pieds. Et dans le cœur.']],
  introBench: [['{meN} commence sur le banc aujourd\'hui.', 'N:Il pourrait apporter un plus en cours de match.', 'Il est assis, mais je vois ses jambes qui trépignent. Patience, {me}, ton heure viendra !']],
  introRival: [['Et attention, en face, il y a {rival}. Le rival de toujours de {meN} !', 'N:Ils se connaissent depuis les catégories jeunes.', 'Deux coqs dans la même basse-cour, mes amis ! Ça va piquer !']],
  second: [['C\'est reparti pour la deuxième période ! J\'ai bu un café, je suis prêt !', 'N:Tu en as bu trois.', 'Trois petits cafés font un grand commentateur, Nathalie.'], ['Deuxième mi-temps ! Les vestiaires ont parlé, maintenant c\'est le terrain qui parle.'], ['Et on repart ! Nathalie, je sens que cette deuxième période va être folle.', 'N:Tu dis ça à chaque match.', 'Et j\'ai raison une fois sur deux. C\'est énorme !']],
  // ---------- action par action ----------
  shot: ['{n} frappe !', '{n} déclenche !', 'Tir de {n}… !', '{n} tente sa chance !', '{n} arme… et frappe !', 'Allez {n}, allez, allez… la frappe !', 'Il frappe, {n} !'],
  shotClose: ['{n} à bout portant !', '{n} seul devant le gardien !', 'C\'est pour {n}… il est tout seul !', 'Attention, attention, {n} !', 'Mare de Déu, {n} est seul !'],
  shotLong: ['{n} de loin… pourquoi pas !', 'Une frappe de mule de {n} !', '{n} tente un missile des {d} mètres !', 'De loin, {n} ! Un coup de canon !', 'Il ose, {n}, il ose !'],
  shotHead: ['Tête de {n} !', '{n} s\'envole comme un aigle !', '{n} monte au ciel… la tête !', 'Coup de casque de {n} !'],
  shotChip: ['Le lob de {n} ! Oh, la folie !', '{n} tente la pichenette par-dessus le gardien !', 'Un lob ! {n}, l\'audace !'],
  shotVolley: ['Reprise de volée de {n} !', '{n} reprend de volée, en pleine course !', 'Une volée de {n}, sans contrôle, oh la la !'],
  shotCurl: ['{n} enroule… vers la lucarne…', '{n} brosse le ballon, il veut l\'effet…', 'Frappe enroulée de {n}, comme une caresse…'],
  shotPower: ['{n} frappe fort, très fort !', 'Une mine de {n} !', '{n} met tout ce qu\'il a dans cette frappe !'],
  shotMe: ['{me} ! C\'est pour toi ! Frappe !', '{me} arme le pied…', 'Vas-y {me}, vas-y !', 'C\'est {meL}… c\'est {meL}… la frappe !'],
  cross: ['Centre de {n}…', '{n} déborde et centre !', '{n} envoie un caviar dans la surface…', '{n} lève la tête et centre…', 'Ballon aérien de {n}, qui va le chercher ?'],
  thru: ['Ouverture de {n} pour {n2} ! Quelle vision !', '{n} lance {n2} dans le dos de la défense !', 'La passe laser de {n} ! {n2} est lancé !', 'Un caviar de {n} pour {n2} !'],
  long: ['Long ballon de {n} vers {n2}.', '{n} renverse le jeu, transversale pour {n2}.', '{n} cherche {n2} au loin.'],
  box: ['{n} trouve {n2} dans la surface !', '{n} glisse le ballon à {n2} dans les seize mètres…'],
  dribOk: ['{n} élimine {n2} ! Olé !', 'Crochet de {n}, {n2} est assis !', 'Quel geste de {n} ! {n2} cherche encore le ballon !', '{n} danse avec {n2}, c\'est un tango !', 'Petit pont de {n} ! Ça, c\'est le football de la rue !', '{n} passe comme une anguille !'],
  dribMe: ['{me} élimine {n2} ! Mais qui peut l\'arrêter ?!', 'Le crochet de {me} ! {n2} est parti acheter du pain !', '{me} ! Olé ! Olé !'],
  dribKo: ['{n2} ne se laisse pas faire.', '{n} tente le dribble… {n2} dit non.', '{n} a voulu trop en faire, {n2} récupère.'],
  tackle: ['Tacle de {n} ! Propre, net, sans bavure.', '{n} récupère dans les pieds de {n2}.', 'Superbe intervention de {n} !', '{n} sort la jambe comme un ciseau !'],
  slide: ['Tacle glissé de {n} ! Il a raboté la pelouse !', '{n} se jette ! Et il récupère !'],
  int: ['Interception de {n}.', '{n} lit dans les pensées !', '{n} coupe la passe, malin !', '{n} avait tout vu venir.'],
  clear: ['{n} dégage !', 'Dégagement de {n}, on respire.', '{n} envoie ça dans les nuages !'],
  clearHead: ['{n} repousse de la tête.', 'Tête défensive de {n}, solide !'],
  clearOut: ['{n} met le ballon en touche, sagement.'],
  claim: ['{n} capte le ballon dans les airs.', 'Sortie autoritaire de {n} !', '{n} cueille le ballon comme une pomme sur l\'arbre.'],
  punch: ['{n} boxe le ballon !', '{n} sort des poings, un vrai boxeur !'],
  counter: ['{tm} en contre-attaque ! Ça part vite !', '{tm} part en contre, attention !', 'Ça file ! Ça file ! {tm} en contre !', 'Attention, {tm} part à toute vitesse !'],
  chance: ['{n} est seul dans la surface !', 'Énorme occasion pour {n} !', '{n} a tout son temps… trop de temps ?', 'Attention, {n} ! Il est seul !'],
  corner: ['Corner pour {tm}. {n} s\'avance.', '{n} va tirer le corner, les grands gaillards montent.', 'Corner ! Tout le monde dans la surface, même le cousin !'],
  fk: ['Coup franc pour {tm}.', '{n} pose le ballon, il caresse le cuir…', 'Coup franc intéressant pour {tm}.'],
  fkshot: ['{n} tente le coup franc direct !', '{n} va frapper… le mur saute…', 'Coup franc de {n} ! Par-dessus le mur ?'],
  penk: ['{n} s\'élance face à {gk}…', '{n} pose le ballon… le stade retient son souffle.', 'Le face-à-face… {n} contre {gk}…', 'Silence… {n} prend son élan…'],
  adv: ['L\'arbitre laisse l\'avantage. Bravo, monsieur l\'arbitre !', 'Avantage ! On joue, on joue !', 'Faute sur {n}… mais l\'arbitre laisse jouer. Intelligent.'],
  tacUp: ['{tm} se découvre, tout le monde monte !', '{tm} pousse, les latéraux sont presque attaquants !', 'Ça sent la révolte chez {tm} !', 'N:{tm} passe à l\'attaque. Attention aux espaces dans leur dos.'],
  tacDown: ['{tm} recule, ferme les volets et met le cadenas.', '{tm} gère, le bloc est bas.', 'N:{tm} va maintenant défendre ce score, c\'est logique.'],
  // ---------- événements ----------
  goal: ['BUUUUUUUT ! {n} ! {n} ! {n} !', 'C\'EST AU FOND ! {n} ! Mais c\'est magnifique !', 'BUUUT pour {my} ! {n}, mon ami, je t\'aime !', 'OUIIII ! {n} ! Les filets tremblent encore !', 'BUT ! {n} ne tremble pas, il est froid comme la glace !', 'Ohhh {n} ! Dans le mille ! BUUUT !'],
  goalMe: ['BUUUUUT ! {meL} ! {meL} ! {meL} ! C\'est {me} !', 'Le voilà ! Le voilà ! {me} a frappé ! BUUUUUT !', '{meN} ! Je le savais ! Je le savais, Nathalie ! BUUUT !', '{me} marque ! Quelqu\'un peut m\'apporter un verre d\'eau ? Je vais m\'évanouir !'],
  goalOpp: ['{op} marque… {n} ne laisse aucune chance.', 'Aïe aïe aïe… {n} marque pour {op}.', 'Coup dur. {n} punit {my}.', 'Ohhh non… {n}. Froid, clinique. But pour {op}.'],
  goalOppN: ['N:Le marquage était beaucoup trop lâche sur cette action.', 'N:Il y avait de l\'espace entre les lignes, et ça se paie.', 'N:La défense s\'est fait aspirer, le joueur a eu tout le temps.'],
  goalOg: ['Contre son camp… Le ballon touche {n} et finit au fond. Le football peut être si cruel.', 'Oh non… {n} marque contre son camp. Il va falloir le consoler, ce garçon.'],
  goalOgFor: ['Contre son camp ! Le ballon touche {n} et rentre ! Merci, merci beaucoup !', 'C\'est un cadeau ! {n} marque contre son camp ! On prend, on prend !'],
  goalLong: ['De {d} mètres ! De {d} mètres, Nathalie ! Le gardien n\'a rien vu, et moi non plus !', 'Une frappe de loin, un missile, une comète !'],
  goalChip: ['Un lob ! Un lob, mes amis ! Le ballon est monté jusqu\'à la Lune et il est redescendu dans le but !'],
  goalVolley: ['De volée ! Sans contrôle ! C\'est de l\'art, c\'est de la peinture !'],
  goalHead: ['De la tête ! Il est monté jusqu\'au troisième étage !', 'Un coup de tête comme un coup de marteau !'],
  goalFk: ['Coup franc direct ! Par-dessus le mur, sous la barre ! Une feuille morte !'],
  goalPen: ['Penalty transformé, le gardien est parti boire un café de l\'autre côté !', 'Dans le petit filet, aucune chance pour le gardien !'],
  goalPost: ['Poteau rentrant ! Le poteau a dit oui ! Merci, le poteau !'],
  goalEq: ['Égalisation ! Tout est à refaire, tout est possible !', 'On recolle ! Le match recommence !'],
  goalLate: ['À la {min}e minute ! Le cœur ne tiendra pas, Nathalie, il ne tiendra pas !', 'Dans les dernières minutes ! C\'est un film, c\'est un roman !'],
  goalComeback: ['La remontada ! Ils étaient morts, ils sont ressuscités !', 'Ils étaient menés, et maintenant ils mènent ! Le football, mes amis, le football !'],
  goalDouble: ['Doublé ! Doublé de {n} ! Deux fois, mes amis, deux fois !'],
  goalTriple: ['TRIPLÉ ! Le coup du chapeau ! Je jette mon chapeau ! Je n\'ai pas de chapeau, mais je le jette quand même !'],
  goalFirst: ['Premier but de sa carrière ! Notez la date sur le calendrier de la cuisine !', 'C\'est son tout premier but ! Il s\'en souviendra toute sa vie, et moi aussi !'],
  goalPromise: ['Je l\'avais promis ! Je l\'avais promis ! Nathalie, bouche-toi les oreilles, je chante !'],
  goalAvia: ['L\'àvia Montse, si tu nous regardes, ce but est pour toi !'],
  songs: [
    'Ohé, ohé, {n} ! / Il a fait trembler les filets ! / Ohé, ohé, ohé ! / Ce soir, on va danser !',
    'La la la la la / {n}, {n} / C\'est la fête au village / La la la la la !',
    'Dans les filets, dans les filets / {n} l\'a mise dans les filets / Et l\'àvia danse dans son salon / Oh oui, oh oui !',
    'Oh {n} / Tu es le soleil de ma soirée / Oh {n} / Je vais te faire des crêpes !',
    'Allez {my}, allez, allez / Allez {my}, on va chanter / Toute la nuit, toute la nuit !',
    'Tra la la, la sardane de {n} / On se tient la main, on tourne en rond / Tra la la, quel but, quel garçon !',
    'Bim, bam, boum / {n} fait boum / Le gardien fait aïe aïe aïe / Bim, bam, boum !',
    'Hé, hé, hé / {n} est là / Hé, hé, hé / Personne ne l\'arrêtera !',
    'Ooooh {n} ! / Ooooh {n} ! / Ce but-là, je le garde / Dans mon cœur pour toujours !',
    'Un, deux, trois, soleil / {n} brille comme le soleil / Un, deux, trois, merveille / Allez, allez, allez !',
  ],
  songN: ['N:On va recevoir des plaintes, Jordi.', 'N:J\'ai entendu des chiens hurler dans le quartier.', 'N:Très joli. On peut continuer le match ?', 'N:Je crois que les gens à la maison ont baissé le son.', 'N:Je crois que l\'arbitre t\'a entendu.', 'N:C\'était… mélodieux. À peu près.'],
  saveBig: ['Quel arrêt de {n} ! Une parade de chat, de panthère, de super-héros !', 'Non ! {n} sort une main de nulle part !', '{n} ! Il a des ressorts dans les jambes, ce garçon !'],
  save: ['Arrêt de {n}.', '{n} s\'interpose.', 'Parade de {n}, tranquille.', '{n} est là, solide comme le Canigou.'],
  saveMe: ['{me} ! L\'arrêt de {me} ! Ce garçon a des aimants dans les gants !', 'Mais quel arrêt de {me} ! Je l\'embrasse ! Je l\'embrasse à travers l\'écran !'],
  missBig: ['Incroyable ! {n} manque l\'immanquable !', 'Non, non, non, {n} ! Ma grand-mère la mettait, celle-là !', 'Comment ?! Comment, {n} ?! Il était seul au monde !'],
  missBigN: ['N:Il a voulu trop bien faire. Il fallait rester simple.', 'N:Il ouvre trop le pied, c\'est la précipitation.', 'N:Il a regardé le gardien au lieu de regarder le but.'],
  missHigh: ['Au-dessus ! Dans les nuages !', 'Trop haut, ça va réveiller les pigeons du toit.', 'Ça passe au-dessus. Direction la buvette.'],
  missWide: ['C\'est à côté.', 'Ça frôle le poteau !', 'Pas cadré… mais l\'intention était belle.', 'À côté, de peu, d\'un cheveu !'],
  wood: ['POTEAU ! Le poteau, mes amis, le poteau !', 'Le montant ! Si près ! Si près ! J\'ai mal pour lui !', 'Poteau ! Le football est cruel, le football est un poète triste !'],
  bar: ['LA BARRE ! La barre tremble encore !', 'La transversale ! Elle vibre comme une guitare !'],
  block: ['Contré !', 'Le tir est contré, un mur de chair et d\'os !', 'Contré par la défense, quel courage !'],
  penMine: ['PENALTY ! Penalty pour {my} ! L\'arbitre montre le point blanc !', 'Penalty ! Penalty ! Mare de Déu, penalty !'],
  penOpp: ['Penalty pour {op}… aïe aïe aïe.', 'Penalty contre {my}… Je n\'ose pas regarder.'],
  varGoal: ['L\'arbitre a la main sur l\'oreille… La VAR regarde. Mon cœur aussi.', 'Attention, la VAR vérifie… Je n\'aime pas ce silence.'],
  varPen: ['La VAR regarde l\'action… suspense insoutenable.'],
  varOk: ['But validé ! On peut respirer ! On peut chanter !', 'Validé ! La VAR est d\'accord avec moi, pour une fois !'],
  varNo: ['But refusé ! {why}… La VAR a mangé notre joie.', 'Refusé… {why}. J\'avais déjà sorti le champagne, Nathalie.'],
  varPenYes: ['Après visionnage, penalty accordé !'],
  varPenOk: ['Penalty confirmé.'],
  varPenNo: ['Pas de penalty ! La faute était en dehors de la surface.'],
  yellow: ['Carton jaune pour {n}. Il l\'a bien cherché.', 'Jaune pour {n}, l\'arbitre sort le citron.', '{n} prend un avertissement.'],
  yellowMe: ['Oh non, {me}… Jaune. Calme-toi, mon petit, respire.'],
  red: ['ROUGE ! {n} est expulsé ! Douche froide !', 'Carton rouge ! {n} rentre au vestiaire avant tout le monde.'],
  redMe: ['Rouge pour {me}… Je suis triste, Nathalie. Profondément triste.'],
  offside: ['Hors-jeu de {n}, le drapeau se lève.', '{n} était parti trop tôt. Hors-jeu.', 'Hors-jeu ! {n} est parti avant le coup de pistolet.'],
  sub: ['Changement pour {tm} : {n} remplace {out}.'],
  subIn: ['Et voici {me} qui entre en jeu ! Le public se lève !', '{me} entre sur la pelouse ! Fais-nous rêver, mon petit !'],
  subOut: ['{me} sort sous les applaudissements. Belle prestation.', '{me} quitte la pelouse. On l\'applaudit bien fort.'],
  inj: ['{n} reste au sol… on espère que ce n\'est rien.'],
  injMe: ['{me} est touché… Je n\'aime pas ça du tout.'],
  ht: [['C\'est la pause, et c\'est {sc}.', 'N:{htN}', 'Je vais chercher un café. Nathalie, tu veux un café ?', 'N:Je veux que tu restes concentré.']],
  htN: ['On a vu une bonne intensité, mais il va falloir être plus tranchant dans les trente derniers mètres.', 'Le milieu de terrain a beaucoup souffert, il faudra corriger ça.', 'Les deux blocs se neutralisent. Le premier qui fera une erreur sera puni.', 'Pour l\'instant, c\'est un match d\'échecs. #calm'],
  ftWin: [['C\'est terminé ! {my} s\'impose {scn} !', 'N:Une victoire méritée, bien construite.', 'Rentrez chez vous, embrassez vos proches et soyez heureux ! Ciao, à bientôt !']],
  ftDraw: [['C\'est fini, et c\'est {sc}. Un point chacun, on partage le gâteau.', 'N:Un résultat logique au vu de la physionomie du match.', 'Logique, logique… Le football n\'est pas logique, Nathalie, c\'est de la poésie ! Bonne soirée à tous !']],
  ftLoss: [['C\'est terminé… {sc}. Une défaite, ça forge, mes amis, ça forge.', 'N:Il faudra vite se relever.', 'On se relève toujours. Bisous à vos grands-mères, à bientôt !']],
  late: ['Plus que quelques minutes ! Je ne regarde plus, je ne peux plus regarder !', 'Le chrono, Nathalie, le chrono ! Il avance trop vite… ou trop lentement, je ne sais plus !'],
  added: ['Temps additionnel ! Le cœur bat à deux cents !', 'On joue les arrêts de jeu… Que quelqu\'un me tienne la main !'],
  interrupt: ['Attention, attention !', 'Je m\'arrête là, ça chauffe !', 'Pardon Nathalie, je te coupe !', 'On reprend, on reprend !'],
  flow: ['{tm} fait tourner le ballon.', 'Ça joue, ça joue chez {tm}…', 'Patience côté {tm}, on cherche la faille.', '{tm} a le ballon, {other} attend son heure.', 'On joue dans le camp adverse, {other} recule.', 'Phase de jeu tranquille… Profitons-en pour respirer.', 'Le ballon circule, comme un bon vin à table.', '{tm} construit, brique par brique.', 'Ça manque un peu de folie, là. Allez, un peu de folie ! #calm', 'Le public s\'impatiente, il veut du spectacle ! #calm', '{anyp} est partout ! Partout ! Je l\'ai même vu à la buvette !', 'Regardez {anyp}, il court, il court… Il a avalé un moteur, ce garçon.'],
  flowN: ['N:{tm} contrôle bien le milieu de terrain pour l\'instant.', 'N:Côté {tm}, il manque un peu de profondeur.', 'N:{other} défend en bloc très compact, c\'est difficile de trouver des espaces.', 'N:Attention aux transitions, {other} est dangereux en contre.', 'N:{tm} presse très haut, ça perturbe la relance adverse.'],
  scoreLine: ['{min}e minute, {sc}.', 'On joue la {min}e minute, toujours {sc}.', 'Petit point sur le score : {sc}, à la {min}e.'],
  // ---------- digressions : il part, Nathalie le ramène ----------
  dig: [
    ['Vous savez ce que ma grand-mère Montse faisait le dimanche ? La cargolade. Des escargots sur la braise, avec de l\'aïoli…', 'N:Jordi. Le match.', 'Oui, oui, je vois. Mais l\'aïoli, Nathalie… L\'aïoli de ma grand-mère, c\'était un but en lucarne pour le palais.', '#avia'],
    ['Vous sentez cette petite brise ? Chez moi, on a la tramontane. Elle te décoiffe, elle te sèche le linge en dix minutes, elle te rend fou.', 'N:Il n\'y a pas un brin de vent aujourd\'hui.', 'Il y a toujours un peu de tramontane dans le cœur d\'un Catalan, Nathalie.'],
    ['Quand je jouais ailier gauche, j\'avais un crochet. Un seul. Mais tout le monde savait qu\'il arrivait.', 'N:Donc ça ne marchait pas.', 'Ça marchait une fois par saison ! Et cette fois-là, mes amis, le stade entier se levait !'],
    ['Mon genou gauche prédit la pluie. Il me fait mal : il pleut. Il ne me fait pas mal : il pleut quand même, on est dans le Sud mais on n\'est pas au paradis.', 'N:C\'est… fascinant.', 'C\'est la science, Nathalie. La science du genou.'],
    ['Mon chien s\'appelle Canigou. Quand il y a un but, il aboie. Quand c\'est contre nous, il va se cacher sous le canapé.', 'N:Il a du caractère.', 'Il a plus de caractère que certains défenseurs que j\'ai connus !'],
    ['J\'ai goûté le sandwich de la buvette tout à l\'heure. Pain croustillant, saucisse grillée… Un chef-d\'œuvre.', 'N:Tu en as mangé combien ?', 'Deux. Peut-être trois. Je ne compte pas, je ne suis pas comptable, je suis poète.'],
    ['Le football, c\'est la vie en quatre-vingt-dix minutes. On naît au coup d\'envoi, on tombe amoureux, on se dispute, on se réconcilie…', 'N:Et on meurt au coup de sifflet final ?', 'Non ! On renaît au match suivant ! C\'est ça, la beauté !'],
    ['Regardez les chaussettes de l\'arbitre. Impeccables. Bien tirées. Ça, c\'est un homme qui respecte la vie.', 'N:On juge un arbitre à ses chaussettes, maintenant ?', 'On juge tout aux chaussettes, Nathalie. Les chaussettes ne mentent jamais.'],
    ['Si on a un beau but ce soir, je danse la sardane dans la cabine.', 'N:La cabine fait deux mètres carrés.', 'Alors tu te serres un peu. La sardane, ça se danse ensemble !'],
    ['Ce matin, j\'étais au bord de la mer à Collioure. Le soleil, les barques colorées, l\'odeur des anchois…', 'N:Et tu as pensé au match, quand même ?', 'J\'ai pensé à la vie, Nathalie. Et le match fait partie de la vie.'],
    ['Mon fils fait du yoga. Il me dit : papa, respire, détends-toi, sois dans l\'instant présent.', 'N:C\'est plutôt un bon conseil.', 'Comment veux-tu que je respire avec un match pareil ?!'],
    ['Il y avait un pigeon sur la transversale tout à l\'heure. Il regardait le match, très concentré.', 'N:Je ne l\'ai pas vu.', 'Il est reparti. Il avait sûrement un rendez-vous important. Les pigeons ont une vie, eux aussi.'],
    ['La crème catalane, Nathalie, c\'est comme un bon milieu de terrain : croustillant dessus, tout doux dedans.', 'N:Je n\'avais jamais vu les choses comme ça.', 'Personne ne voit les choses comme moi. C\'est mon métier.'],
    ['J\'ai une vieille voiture rouge de 1984. Elle a plus de kilomètres que tous ces joueurs réunis.', 'N:Elle démarre encore ?', 'Quand elle veut. Comme certains attaquants.'],
    ['Je porte mon écharpe porte-bonheur. Elle n\'a pas été lavée depuis 1998.', 'N:…C\'est donc pour ça que j\'ai ouvert la fenêtre.', 'La chance, ça ne se lave pas, Nathalie !'],
    ['Le ballon qui roule sur l\'herbe du soir… C\'est un vers d\'un grand poète, ça. Non, c\'est de moi. Mais ça pourrait être d\'un grand poète.', 'N:C\'était surtout une passe en retrait.', 'Une passe en retrait peut être un poème, Nathalie !'],
    ['Regardez la coupe de cheveux de {anyp}. Un travail d\'orfèvre. Je veux le numéro de son coiffeur.', 'N:Toi, tu n\'as plus beaucoup de cheveux, Jordi.', 'Justement ! Il me faut un spécialiste !'],
    ['L\'àvia Montse regarde le match, j\'en suis sûr. Elle a quatre-vingt-douze ans et elle crie plus fort que moi devant la télé.', 'N:C\'est donc génétique.', 'C\'est un héritage, Nathalie. Un trésor de famille.', '#avia'],
    ['Je vous fais une promesse : si {me} marque aujourd\'hui, je chante. En direct. Devant tout le monde.', 'N:C\'est enregistré, Jordi. On te prendra au mot.', 'Lo Sol n\'a qu\'une parole !', '#promise'],
    ['Au fait, Nathalie, demain il fait beau ?', 'N:Je ne suis pas météorologue.', 'Tu es consultante ! Consulte le ciel !'],
    ['Mon premier match au stade, j\'avais six ans. Mon père m\'avait porté sur ses épaules. Je n\'ai rien vu, mais j\'ai tout entendu.', 'N:C\'est joli, ça.', 'C\'est pour ça que je parle autant, Nathalie. Pour tous ceux qui ne voient rien.'],
    ['Quand j\'étais petit, notre ballon était en cuir. Quand il pleuvait, il pesait trois kilos. Une tête, et tu voyais des étoiles.', 'N:Les ballons ont bien changé.', 'Les ballons, oui. Les étoiles, elles, sont toujours là.'],
    ['On me dit que Josette nous regarde depuis son canapé. Bonsoir, Josette !', 'N:Qui t\'a dit ça ?', 'Personne. Mais il y a toujours une Josette qui regarde. Bonsoir, Josette.'],
    ['Regardez ce supporter en tribune, peint aux couleurs du club de la tête aux pieds. Respect, monsieur. Respect et courage.', 'N:Il fait {temp} degrés.', 'C\'est bien ce que je dis : respect, et courage.'],
    ['N:Tu remarques que {tm} presse beaucoup plus haut depuis quelques minutes ?', 'Je remarque tout, Nathalie. Je le remarquais même avant que ça arrive.', 'N:Donc tu ne l\'avais pas vu.', 'Je l\'avais senti. C\'est mieux.'],
    ['Mon médecin m\'a dit : Jordi, moins de charcuterie, moins d\'émotions. J\'ai gardé la charcuterie.', 'N:Et les émotions ?', 'Impossible. Je suis commentateur.'],
    ['De mon temps, les crampons étaient noirs. Tous noirs. Aujourd\'hui, c\'est orange fluo, vert pomme, rose bonbon…', 'N:Ça permet de repérer les joueurs.', 'Ça permet surtout de les repérer depuis la Lune.'],
    ['Vous entendez les tambours ? Boum, boum, boum… C\'est le cœur du stade qui bat.', 'N:Ou c\'est le monsieur au tambour.', 'Le monsieur au tambour EST le cœur du stade, Nathalie !'],
    ['N:Quand je jouais, on n\'avait pas le temps de parler de cuisine pendant les matchs.', 'Parce que tu courais partout ! Tu étais une machine, une locomotive !', 'N:J\'étais milieu défensive. Je courais là où il fallait.', 'Voilà. Et moi, je parle là où il faut.'],
    ['{sc} à la {min}e minute. Nathalie, ton pronostic ?', 'N:Je reste prudente.', 'Prudente ! Toujours prudente ! Moi je dis {pron}, et je signe !'],
    ['Pensez au gardien de but. Seul dans sa cage, pendant que tout le monde s\'amuse à l\'autre bout du terrain.', 'N:Un vrai gardien de phare.', 'Exactement ! Le gardien de but est un gardien de phare ! Tu deviens poète, Nathalie !'],
    ['Ma femme m\'a dit ce matin : Jordi, ce soir, tu ne cries pas trop.', 'N:Et ?', 'Et elle me connaît depuis trente ans. Elle avait mis ses bouchons d\'oreilles avant que je parte.'],
    ['{min}e minute déjà… Le temps file, Nathalie. Comme les ailiers de mon époque.', 'N:Tu n\'étais pas plutôt lent, toi ?', 'J\'étais lent, mais avec élégance.'],
    ['Vous avez vu le contrôle de {anyp} tout à l\'heure ? Le ballon est tombé du ciel et il l\'a endormi. Comme un bébé.', 'N:Un contrôle orienté, oui. Propre.', 'Propre ! Elle dit « propre » ! C\'était une berceuse, Nathalie !'],
    ['Les bunyetes de ma grand-mère… Des beignets légers comme un nuage. Je les mangeais par dix.', 'N:Et après tu jouais ?', 'Après, je dormais. Mais je dormais heureux.', '#avia'],
    ['Vous savez pourquoi on m\'appelle Lo Sol ? Parce que je suis toujours de bonne humeur. Même quand il pleut. Surtout quand il pleut.', 'N:Et parce que tu brûles tout sur ton passage.', 'Ça aussi. Le soleil, ça chauffe, Nathalie.'],
    ['Si je n\'avais pas été footballeur, j\'aurais été chanteur d\'opéra.', 'N:Tu chantes faux, Jordi.', 'J\'aurais été chanteur d\'opéra moderne.'],
    ['Il y a des matchs qu\'on regarde avec les yeux, et des matchs qu\'on regarde avec le cœur. Celui-là, je le regarde avec les deux.', 'N:Et avec un sandwich.', 'Avec les deux yeux, le cœur et un sandwich. C\'est complet.'],
  ],
};
// ---------- encore des répliques (pour qu'il se répète le moins possible) ----------
const CMX_ADD = {
  long: ['{n} allonge vers {n2}, un ballon qui traverse le ciel.', 'Grand ballon de {n}, {n2} lève les yeux.', '{n} change d\'aile, {n2} est servi.', '{n} joue long, très long, vers {n2}.', 'Diagonale de {n} pour {n2}, au mètre près !', '{n} saute le milieu et cherche {n2}.'],
  cross: ['{n} enroule son centre au second poteau…', 'Centre tendu de {n}, ça brûle devant le but !', '{n} centre en retrait…', '{n} dépose le ballon dans la surface comme une plume…', 'Centre de {n}, les défenseurs reculent…', '{n} au fond du couloir… le centre !'],
  thru: ['{n} trouve {n2} entre deux défenseurs, une passe-aiguille !', '{n} glisse le ballon dans la course de {n2}…', 'Passe en profondeur de {n}, {n2} s\'envole !', '{n} casse les lignes, {n2} est dans l\'espace !', 'Une passe de chirurgien de {n} pour {n2} !'],
  box: ['{n} remet pour {n2} dans les seize mètres !', '{n} décale {n2} dans la surface, attention !', '{n} cherche {n2} au point de penalty…'],
  dribOk: ['{n} fait un sombrero à {n2} ! Un chapeau ! Je l\'adore !', 'Roulette de {n} ! {n2} tourne sur lui-même comme une toupie !', '{n} accélère, {n2} reste planté comme un piquet !', '{n} feinte à gauche, part à droite, {n2} a le vertige !', 'Mais qui lui a appris ça, à {n} ?! {n2} est dans le vent !', '{n} efface {n2} avec une facilité déconcertante.'],
  dribMe: ['{me} ! Il a hypnotisé {n2} !', 'Regardez-moi {me} ! {n2} ne sait plus où il habite !', '{me} passe, {me} danse, {me} enchante !'],
  dribKo: ['{n2} lui chipe le ballon, comme un pickpocket.', '{n} s\'emmêle les pinceaux.', 'Le dribble de trop pour {n}.'],
  tackle: ['{n} gagne son duel, propre et costaud.', 'Retour défensif de {n}, il a couru comme un lièvre !', '{n} récupère, il ne lâche rien.', '{n} vole le ballon à {n2}, sans faute. Chapeau.'],
  int: ['{n} intercepte, il était à la bonne place.', '{n} coupe la ligne de passe, malin comme un renard.', 'Bien vu, {n} ! Ballon récupéré.', '{n} anticipe et ressort proprement.'],
  clear: ['{n} dégage en catastrophe !', '{n} envoie le ballon au loin, ouf !', '{n} met un grand coup de pied dedans, sans chichis.', 'Dégagement de {n}, le ballon va jusqu\'au parking !'],
  save: ['{n} capte sans trembler.', '{n} détourne en corner.', 'Bonne parade de {n}, bien placé.', '{n} bloque en deux temps.'],
  saveBig: ['Miracle ! {n} fait un miracle !', '{n} vole ! Il vole, Nathalie ! Il a des ailes !', 'Mais comment il sort ça, {n} ?! Une parade de cinéma !'],
  missWide: ['Ça passe à côté du cadre, de peu.', 'Le ballon file à côté du poteau, les supporters se prennent la tête.', 'Pas cadré. Le gardien n\'a même pas eu besoin de bouger.', 'À côté ! Il y avait mieux à faire.'],
  missHigh: ['Par-dessus ! Le ballon part avec la tramontane.', 'Au-dessus de la barre, il a trop levé la tête.', 'Trop haut ! Le ballon est en orbite.'],
  missBig: ['Il était seul ! Seul ! Je ne comprends pas, Nathalie, je ne comprends pas !', 'Ohhh ! {n} a la mire mal réglée ce soir !'],
  shot: ['{n} tente le coup !', '{n} ajuste… !', '{n} se retourne et frappe !', 'Frappe de {n}… attention !'],
  shotClose: ['{n} au point de penalty… !', 'C\'est chaud devant le but… {n} !'],
  shotLong: ['{n} déclenche des {d} mètres, une fusée !'],
  chance: ['{n} se retrouve face au but !', 'Occasion en or pour {n} !', 'Tout s\'ouvre devant {n} !'],
  counter: ['Transition éclair, {tm} est lancé !', '{tm} récupère et part à cent à l\'heure !', 'Contre éclair, {tm} à trois contre deux !'],
  corner: ['Encore un corner pour {tm}.', 'Corner. {n} lève le bras, il a un plan.', 'Corner pour {tm}, le gardien crie sur ses défenseurs.'],
  fk: ['Coup franc pour {tm}, {n} se frotte les mains.', 'Faute sifflée, coup franc pour {tm}.'],
  offside: ['Hors-jeu, {n} était trop gourmand.', 'Le juge de touche lève son drapeau : {n} est hors-jeu.', 'Hors-jeu de {n}, d\'un orteil !'],
  yellow: ['{n} est averti, carton jaune.', 'Jaune pour {n}, il va devoir se calmer.', 'L\'arbitre sort le jaune pour {n}, c\'était mérité.'],
  flow: ['{tm} garde le ballon, tranquille, comme un dimanche après-midi.', 'Ça passe de pied en pied chez {tm}.', '{tm} fait tourner, {other} court après le ballon.', 'On respire un peu… le match reprend son souffle.', '{tm} cherche le décalage sur les côtés.', 'Petite séquence de possession pour {tm}.', '{tm} avance doucement, sans se presser.', '{other} attend, regroupé, prêt à bondir.', 'Le gardien relance court, {tm} repart de derrière.', 'Échange de passes au milieu… On attend l\'étincelle.', 'Un match d\'échecs, pour l\'instant. Mais j\'aime les échecs, moi ! #calm'],
  flowN: ['N:{tm} attire le pressing pour mieux le contourner.', 'N:Regardez comme {other} ferme l\'axe, ça oblige à passer par les côtés.', 'N:Le latéral monte beaucoup côté {tm}, il faudra surveiller son dos.', 'N:Il y a de l\'espace entre les lignes, il faut savoir s\'y glisser.', 'N:Au milieu, {tm} gagne la plupart des duels.', 'N:{other} attend son moment, c\'est un plan assumé.', 'N:Regardez {anyp}, il ne cesse de proposer des solutions.', 'N:{anyp} fait un gros travail de l\'ombre, on ne le voit pas assez.', ['N:{anyp} est très juste techniquement depuis le début.', 'Juste ? Il est magnifique, Nathalie ! Dis-le : magnifique !'], ['N:{tm} manque de mouvement devant, les attaquants sont trop statiques.', 'Ils sont plantés comme des oliviers, Nathalie ! Bougez, les enfants !'], ['N:Bonne circulation de balle, mais il manque la dernière passe.', 'La dernière passe, c\'est comme la dernière cuillère de crème catalane : la plus importante.'], ['N:Il faut accélérer le jeu, là.', 'Accélère, accélère ! Comme ma vieille voiture rouge dans la descente !'], ['N:{tm} a trouvé la bonne distance entre ses lignes.', 'Elle parle comme un livre, Nathalie. Moi je dis : ça joue bien !']],
  dig: [
    ['Vous savez ce qui me manque de l\'époque où je jouais ? Le vestiaire. L\'odeur du camphre, les blagues, le coiffeur du club qui coupait mal.', 'N:Le coiffeur du club ?', 'Un ami de l\'entraîneur. Il coupait tout le monde pareil. On avait tous la même tête. On gagnait, mais on était moches.'],
    ['Mon petit-fils m\'a demandé hier : papi, tu étais fort ?', 'N:Et qu\'est-ce que tu as répondu ?', 'J\'ai dit : j\'étais rapide. Il a regardé les vidéos. Il m\'a dit : papi, tu mentais.'],
    ['Le meilleur repas d\'avant-match, Nathalie : des pâtes. Avec un filet d\'huile d\'olive. Et une petite saucisse.', 'N:La saucisse n\'est pas recommandée par les diététiciens.', 'Les diététiciens n\'ont jamais joué ailier gauche sous la tramontane.'],
    ['Vous avez vu la lune ce soir ? Elle est pleine. Les soirs de pleine lune, il se passe toujours quelque chose.', 'N:C\'est scientifiquement prouvé ?', 'C\'est prouvé par quarante ans de football, Nathalie !', '#night'],
    ['Il pleut, il pleut, et moi je pense à la plage de Canet. Les parasols, les beignets, le sable dans les chaussettes…', 'N:Tu as toujours du sable dans les chaussettes ?', 'Toujours. C\'est un souvenir.', '#rain'],
    ['Quand j\'étais jeune, je m\'entraînais en courant après le bus de l\'école. Je ne l\'ai jamais rattrapé.', 'N:C\'est pour ça que tu as fini ailier.', 'Exactement. Toujours en train de courir après quelque chose.'],
    ['Le soir, après les matchs, je danse une petite sardane dans ma cuisine. Tout seul. Pour digérer les émotions.', 'N:Et ta femme ?', 'Elle ferme la porte et elle monte le son de la télé.'],
    ['Nathalie, tu as déjà marqué de la tête, toi ?', 'N:Trois fois. En sélection.', 'Trois ! Moi, une seule fois en dix ans de carrière. Et c\'était un accident, le ballon m\'est tombé dessus.'],
    ['N:Jordi, on me demande en régie si tu vas parler du match à un moment.', 'Je ne parle que du match ! Le match, c\'est la vie, et la vie, c\'est la cuisine de ma grand-mère. Tout est lié !', 'N:Je transmets.', '#avia'],
    ['Ce stade me rappelle mon premier contrat. Je gagnais de quoi m\'acheter une mobylette et des espadrilles.', 'N:Des espadrilles ?', 'Catalanes ! Avec les rubans ! J\'étais le plus élégant du vestiaire.'],
    ['Le football, c\'est comme la pêche, Nathalie. Tu attends, tu attends… et tout d\'un coup, ça mord !', 'N:Tu pêches, toi ?', 'Jamais. Je n\'ai pas la patience. C\'est pour ça que je commente.'],
    ['Je ne sais pas si vous avez remarqué, mais l\'arbitre court très bien. Petites foulées, dos droit. Un athlète.', 'N:Il est surtout bien placé.', 'Bien placé et élégant. Si j\'étais sélectionneur des arbitres, je le prendrais.'],
    ['Mon voisin, monsieur Ribes, regarde tous mes matchs. Il m\'envoie un message à chaque fois que je dis une bêtise.', 'N:Son téléphone doit chauffer.', 'Il en est à son troisième téléphone, Nathalie.'],
    ['Vous connaissez la différence entre un bon ailier et un grand ailier ?', 'N:Vas-y.', 'Le bon ailier dribble le défenseur. Le grand ailier le dribble, revient, et le dribble une deuxième fois. Pour le plaisir.', 'N:Et il perd le ballon.', 'Parfois. Mais avec panache !'],
    ['Tout à l\'heure, à la buvette, un monsieur m\'a reconnu. Il m\'a dit : vous êtes le commentateur qui crie ?', 'N:Ça résume bien.', 'Je lui ai répondu : non, je suis le commentateur qui VIT.'],
    ['Parfois je me demande ce que pense le ballon. Toute la journée, on lui donne des coups de pied.', 'N:Le ballon ne pense pas, Jordi.', 'Tu n\'en sais rien. Moi je crois qu\'il aime ça. Sinon il ne rentrerait pas dans les buts avec autant de plaisir.'],
    ['Ce matin, j\'ai préparé une omelette aux asperges sauvages. La recette de l\'àvia.', 'N:Tu vas nous donner la recette en direct ?', 'Non, c\'est un secret de famille. Mais il y a de l\'ail. Beaucoup d\'ail.', '#avia'],
    ['L\'àvia Montse m\'a appelé avant le match. Elle m\'a dit : Jordi, ne parle pas trop.', 'N:Elle a bien raison.', 'Elle me dit ça depuis quarante ans. Elle ne perd jamais espoir.', '#avia'],
    ['J\'adore les maillots de ce soir. Les couleurs, la coupe… On dirait des tableaux de Matisse.', 'N:Matisse a peint à Collioure, d\'ailleurs.', 'Tu vois, Nathalie ! Tout ramène à Collioure !', '#night'],
    ['Vous savez ce que je fais à la mi-temps ? Je mange une orange. Comme quand je jouais.', 'N:Et un sandwich.', 'Une orange ET un sandwich. L\'équilibre, Nathalie.'],
    ['Le plus beau bruit du monde, c\'est le filet qui tremble. Juste après, il y a la poêle qui grésille le dimanche matin.', 'N:Et en troisième ?', 'Le silence d\'un stade avant un penalty. Ça fait peur, et c\'est beau.'],
    ['Si je pouvais revenir en arrière, je jouerais avant-centre. Les avant-centres, on les aime. Les ailiers, on les engueule.', 'N:Tu te faisais souvent engueuler ?', 'Tous les week-ends. Par l\'entraîneur, par le public, et par ma grand-mère.', '#avia'],
    ['On m\'a offert un livre de poésie pour mon anniversaire. J\'ai lu trois pages.', 'N:Seulement trois ?', 'Il y avait un match à la télé.'],
    ['Il fait {temp} degrés, et je vois un monsieur en tribune en short et en tongs.', 'N:Chacun son équipement.', 'Je l\'admire. Je l\'admire, et je m\'inquiète pour lui.'],
    ['Il y a un enfant au premier rang avec une pancarte : « Lo Sol, chante ! »', 'N:Je ne vois pas de pancarte.', 'Elle est dans mon cœur, Nathalie.'],
    ['Quand je suis arrivé ce soir, la sécurité m\'a demandé mon badge. J\'avais oublié mon badge.', 'N:Et comment tu es entré ?', 'J\'ai chanté. Ils m\'ont laissé passer pour que j\'arrête.', '#night'],
    ['Vous voyez le banc de touche ? Les remplaçants ont des vestes chauffantes. De mon temps, on avait une couverture pour trois.', 'N:Et tu étais souvent remplaçant ?', 'Souvent. J\'étais celui du milieu, sous la couverture. Le plus au chaud.'],
  ],
};
for (const k in CMX_ADD) CMX[k] = (CMX[k] || []).concat(CMX_ADD[k]);
Object.assign(CMX, {
  goalOppEq: ['Et {op} revient au score… Tout est à refaire.', 'Égalisation. Mare de Déu… On était si bien.', ['N:{op} égalise, et c\'est mérité sur la physionomie.', 'Mérité, mérité… Je ne veux pas le savoir, Nathalie !']],
  varOkOpp: ['Le but est validé… Il n\'y a rien à redire, hélas.', 'Validé. Je l\'avais vu venir, mais j\'espérais quand même.'],
  varNoOpp: ['Refusé ! {why} ! On respire, on respire !', 'But annulé ! {why} ! Merci, la VAR, merci !'],
  statPos: ['N:Petite statistique : {pct} % de possession pour {tmP}.', 'N:{tmP} a le ballon {pct} % du temps depuis le coup d\'envoi.', ['N:{pct} % de possession pour {tmP}.', 'Le ballon, c\'est bien. Les buts, c\'est mieux !']],
  statShots: ['N:{shA} tirs pour {my}, {shB} pour {op}. Et {sotA} cadrés côté {my}.', ['N:{shA} tirs pour {my}, {shB} pour {op}.', 'Il faut frapper, les enfants ! Qui ne tente rien n\'a rien !']],
  statXg: ['N:Sur les occasions, {tmX} a été plus dangereux que ce que dit le score.', ['N:Si on regarde la qualité des occasions, {tmX} mériterait mieux.', 'Le football n\'est pas juste, Nathalie. Il est beau, mais il n\'est pas juste.']],
  statCor: ['N:Déjà {cor} corners pour {tmC}. Ça pousse, ça pousse.'],
  statFouls: ['N:{fo} fautes pour {tmF}. L\'arbitre va finir par sortir les cartons.', ['N:Déjà {fo} fautes pour {tmF}.', 'Ils ne jouent pas au football, ils jouent au rugby !']],
  saveOpp: ['Non ! {n} sort le ballon… Il nous fait mal, ce gardien !', 'Encore {n} ! Mais ce n\'est pas possible, il a des aimants dans les gants !', 'Arrêt de {n}… Il faut le reconnaître, c\'est très fort.', '{n} dit non ! Ce garçon va me rendre fou !'],
  woodOpp: ['Poteau ! Ouf ! Le poteau est de notre côté ce soir !', 'Sur le montant ! On a eu chaud, Nathalie, on a eu très chaud !', 'La barre ! Merci la barre ! Je lui offre un café à la mi-temps !'],
  dribAgain: ['Et encore un ! {n} les mange tous !', '{n} en élimine un deuxième ! C\'est un slalom !', 'Encore ! Encore ! {n}, olé !', 'Il ne s\'arrête plus, {n} !'],
  goalRival: [['{n}… Le rival de toujours de {meN}. Ça va piquer dans le vestiaire, ce soir.', 'N:Il voudra répondre sur le terrain.']],
  scoreDown: ['{min}e minute, {sc}. Il faut y croire, il faut toujours y croire !', 'On joue la {min}e, {sc}. Allez {my}, réveillez-vous !', ['N:{min}e minute, et c\'est {sc}.', 'Je ne veux pas entendre ce score, Nathalie. Je me bouche les oreilles.']],
  scoreRout: ['{sc} ! C\'est une fiesta, c\'est la fête au village !', ['{min}e minute, {sc}.', 'N:{op} ne sait plus où donner de la tête.']],
});
Object.assign(CMX, {
  introBack: [['Et quel plaisir de revoir {meN} sur une feuille de match ! Il revient de blessure.', 'N:Il faudra voir comment il gère les duels, la confiance revient avec le temps.', 'Moi, je l\'ai vu à l\'échauffement : il souriait. Un joueur qui sourit est un joueur guéri !'], ['{me} est de retour ! Les semaines sans lui ont été longues, Nathalie.', 'N:Tu as compté les jours ?', 'J\'ai compté les heures.']],
  nickUp: [['Vous savez, avant, je l\'appelais {old}. Mais ce garçon a grandi, mes amis.', 'N:Et donc ?', 'Donc maintenant, c\'est {me} ! Il a mérité son nouveau nom !'], ['N:Tu ne l\'appelles plus {old} ?', 'Non, Nathalie. {old}, c\'était avant. Aujourd\'hui, c\'est {me}. Le temps passe, les légendes grandissent.']],
  goalSeason: ['C\'est son {sg}e but de la saison ! Il est en feu, ce garçon !', '{sg} buts cette saison, Nathalie ! {sg} !', 'Et de {sg} cette saison ! Il faut appeler le sélectionneur !'],
  nickGive: ['{n}… À partir d\'aujourd\'hui, je t\'appelle {nick} !', 'Ce garçon, je le baptise : {nick} ! C\'est officiel, c\'est Lo Sol qui l\'a dit !'],
  nickGiveN: ['N:Tu donnes des surnoms à tout le monde.', 'N:Encore un surnom…', 'N:Il va le garder toute sa carrière, j\'imagine.'],
  injPause: ['On attend… J\'en profite pour saluer tout le monde à la maison !', 'Les soigneurs sont là, ils courent avec la petite valise magique.', 'N:On espère que ce n\'est qu\'un coup.', 'Courage, petit. On est tous avec toi.'],
  second: CMX.second,
});
const CM_NICKS = ['le Cobra', 'la Panthère', 'le Taureau', 'le Lutin', 'l\'Ingénieur', 'le Docteur', 'le Sorcier', 'le Bûcheron', 'le Funambule', 'le Phare', 'la Mouette', 'le Grand Duc'];
// surnom de ton joueur : il évolue avec ta carrière (gamin → surnom de poste → légende)
function comNick(tier) {
  if (!S || !S.p) return 'le petit';
  const p = S.p, city = p.city || 'chez nous', o = typeof OVR === 'function' ? OVR() : 60;
  const tr = tier ?? (o < 64 ? 0 : o < 80 ? 1 : 2);
  const POS = { BU: ['le Renard', 'la Flèche', 'le Bombardier de {city}', 'le Chasseur'], AIL: ['la Gazelle', 'le Feu Follet', 'l\'Éclair de {city}', 'la Fusée'], MC: ['le Chef d\'orchestre', 'le Métronome', 'le Cerveau de {city}'], MOC: ['le Magicien', 'le Poète', 'le Prince de {city}'], MDC: ['l\'Aspirateur', 'le Pitbull', 'la Sentinelle'], DC: ['le Mur', 'la Douane', 'le Rocher de {city}'], DL: ['la Locomotive', 'le TGV', 'le Piston de {city}'], GB: ['la Pieuvre', 'les Mains de {city}', 'le Chat'] }[p.pos] || ['le Prince'];
  const P = tr === 0 ? ['le Petit {first}', 'le Minot de {city}', 'le Gamin de {city}', 'le Petit Prince de {city}'] : tr === 1 ? POS : ['Sa Majesté {last}', 'le Roi de {city}', 'Don {first}', '{first} le Grand'];
  return P[hueOf((p.first || '') + (p.last || '') + tr) % P.length].replace('{city}', city).replace('{first}', p.first || '').replace('{last}', p.last || '');
}
// ===================== LE RÉALISATEUR : des commentaires calés sur l'image =====================
// Le moteur de match calcule environ 16 secondes d'avance sur ce qui est montré à l'écran.
// Chaque action et chaque événement est donc commenté AVANT d'apparaître : la réplique est écrite,
// la voix IA préparée en avance, puis elle part pile quand l'action arrive à l'image.
// Entre deux temps forts, Lo Sol et Nathalie bavardent (joueurs, stats, équipes, arbitre, leur vie),
// mais seulement si le prochain temps fort leur en laisse le temps ; une action importante les coupe.
let CM_ID = 0;
const CM_CUT = ['Attention !', 'Oh, attention !', 'Pardon, je te coupe !', 'Attends, attends !', 'Ça part !'];
function comInit(M) {
  M.cs = { used: {}, nk: {}, scorers: {}, avia: false, promise: false, sung: 0, behind: false, shotD: 0, shotT: -9, drib: null,
    lsc: [0, 0], lg: 0, lev: 0, tl: [], cur: null, chain: [], dlg: null, txtR: -99, bigT: -99,
    next: { flow: 25 + R() * 15, talk: 70 + R() * 40, dig: 170 + R() * 120, score: 290 }, htT: null, secSaid: false, lateSaid: false, addSaid: false,
    ref: null, statU: [], talkU: {} };
  return M.cs;
}
const comCS = M => (M.cs && M.cs.tl ? M.cs : comInit(M));
const cmIsN = s => typeof s === 'string' && s.startsWith('N:');
const cmChat = () => typeof OPTS === 'undefined' || OPTS.chat !== 'match';
function comPick(M, key) {
  const pool = CMX[key]; if (!pool || !pool.length) return null;
  if (!M.cs) comInit(M);
  const u = M.cs.used[key] || (M.cs.used[key] = []); let free = []; for (let i = 0; i < pool.length; i++) if (!u.includes(i)) free.push(i);
  if (!free.length) { const last = u[u.length - 1]; u.length = 0; free = pool.map((_, i) => i).filter(i => i !== last || pool.length < 2); }
  // les digressions déjà entendues lors des matchs précédents passent en dernier
  if (key === 'dig' && S) { const seen = S.cdig || []; const fresh = free.filter(i => !seen.includes(i)); if (fresh.length) free = fresh; }
  const i = pick(free); u.push(i);
  if (key === 'dig' && S) { const seen = S.cdig = S.cdig || []; seen.push(i); if (seen.length > pool.length - 6) seen.splice(0, seen.length - (pool.length - 6)); }
  return pool[i];
}
function comScore(M) { const mine = M.side === 'h' ? M.hg : M.ag, th = M.side === 'h' ? M.ag : M.hg; return mine > th ? `${mine} à ${th} pour ${M.my}` : mine < th ? `${th} à ${mine} pour ${M.op}` : mine === 0 ? 'zéro partout' : `${mine} partout`; }
// nom affiché d'un joueur : parfois son surnom
function comName(M, full, me) {
  if (!full) return '';
  if (me && R() < .35) return comNick();
  const nk = M.cs && M.cs.nk[full]; if (nk && R() < .45) return nk;
  return LN(full);
}
function comCtx(M, x) {
  const C = M.cond || {}, h = C.night ? 'Bonsoir' : 'Bonjour', home = M.side === 'h' ? M.my : M.op, away = M.side === 'h' ? M.op : M.my;
  let anyp = ''; if (M.E) { const L = M.E.T[ri(0, 1)].pl.filter(p => p.on && !p.rc); if (L.length) anyp = LN(pick(L).n); }
  const pr = [[2, 1], [1, 0], [3, 2], [2, 2], [1, 1], [4, 3], [3, 1]][ri(0, 6)];
  return Object.assign({ hello: h, home, away, my: M.my, op: M.op, scn: (() => { const a = M.hg, b = M.ag; return Math.max(a, b) + ' à ' + Math.min(a, b); })(), me: comNick(), meN: S && S.p ? pName() : '', meL: S && S.p ? S.p.last : '', sc: comScore(M), min: String(M.min || '1').replace(/\+.*/, ''), city: S && S.p ? S.p.city : '', att: (C.att || 0).toLocaleString('fr-FR'), temp: C.temp ?? 15, rival: S && S.rival ? S.rival.n : '', pron: `${pr[0]} à ${pr[1]}`, anyp: anyp || 'ce joueur', htN: pick(CMX.htN.filter(v => !(M.hg + M.ag) || !v.includes('#calm'))).replace(/\s#\w+$/, '') }, x || {});
}
const cmFill = (s, c) => String(s).replace(/\s#\w+$/, '').replace(/\{(\w+)\}/g, (_, k) => c[k] ?? '').replace(/\s+([,.])/g, '$1').trim().replace(/(^|[.!?]\s+|\/\s+|« )([a-zà-ÿ])/g, (m, a, b) => a + b.toUpperCase());
// durée de parole estimée (secondes) d'une réplique
const cmDur = (txt, song) => song ? txt.split('/').reduce((a, s) => a + s.trim().split(/\s+/).length * .5 + .5, 0) + 1 : txt.split(/\s+/).length * .36 + 1.1;
function comScoreOf(M, s) { const mine = s[0], th = s[1]; return mine > th ? `${mine} à ${th} pour ${M.my}` : mine < th ? `${th} à ${mine} pour ${M.op}` : mine === 0 ? 'zéro partout' : `${mine} partout`; }
function comSpd(M) { return typeof LV !== 'undefined' && LV.M === M && LV.spd ? LV.spd : 1; }
const comResume = () => typeof UI !== 'undefined' && typeof LV_RESUME !== 'undefined' && UI.lspeed === LV_RESUME;
// une entrée du répertoire (phrase ou dialogue) → répliques {who, txt}
function comLines(M, key, c, fl) {
  const it = typeof key === 'string' ? (CMX[key] ? comPick(M, key) : key) : key; if (!it) return [];
  const out = [];
  for (const raw of Array.isArray(it) ? it : [it]) {
    if (raw[0] === '#') { if (raw === '#avia') M.cs.avia = true; else if (raw === '#promise') M.cs.promise = true; continue; }
    const who = cmIsN(raw) ? 'N' : 'S'; out.push(Object.assign({ who, txt: cmFill(who === 'N' ? raw.slice(2) : raw, c) }, fl || {}));
  }
  return out;
}
// la voix est-elle audible maintenant ? (écran du match affiché, son actif)
function comVoice(M, rt) { return rt != null && typeof sayPlay === 'function' && OPTS.voice !== false && (OPTS.svol ?? .8) > 0 && typeof LV !== 'undefined' && LV.M === M && typeof UI !== 'undefined' && UI.screen === 'live'; }
const comAI = () => typeof aivOn === 'function' && aivOn();
// qu'est-ce qui sera vraiment dit à voix haute ? (le reste s'affiche seulement)
function comSpeakable(x) { if (x.pri < 1) return false; if (!comAI()) return typeof voixFile === 'function' && !!voixFile(x); /* sans ta voix ElevenLabs : seulement les répliques enregistrées */ if (OPTS.aivMode === 'eco') return x.kind === 'evt' || x.kind === 'intro' || x.pri >= 2 || x.dig || x.talk; return true; }
// durée de parole (secondes réelles)
function comDur(it, txt) {
  if (it.buf) return it.buf.duration + .3;
  const w = String(txt || it.txt).split(/\s+/).length;
  return it.song ? cmDur(txt || it.txt, true) + .5 : w * .37 / (it.pri >= 3 ? 1.08 : 1) + .55;
}
// nouvelle réplique dans la file du réalisateur (la première ligne ; les suivantes s'enchaînent derrière)
function comItem(M, T, kind, pri, lines, late, fl) {
  if (!lines || !lines.length) return null;
  const mk = (l, p) => Object.assign({ T, kind, pri: p, who: l.who, txt: l.txt, song: !!l.song, dig: !!l.dig, late, id: ++CM_ID }, fl || {}, l.talk ? { talk: true } : {});
  const it = mk(lines[0], lines[0].pri ?? pri); it.chain = lines.slice(1).map(l => mk(l, l.pri ?? Math.min(pri, 2)));
  M.cs.tl.push(it); return it;
}
// voix IA : on fabrique l'audio en avance (pendant que l'action n'est pas encore à l'image)
function comPrep(M, it) {
  // voix enregistrées : préparées en avance même sans voix IA (durée exacte, départ instantané)
  if (!comAI()) { if (typeof voixFile === 'function') for (const x of [it, ...(it.chain || [])]) if (!x.ap && voixFile(x)) { x.rec = true; x.ap = voixFetch(x); if (x.ap) x.ap.then(b => { x.buf = b; }, () => { x.rec = false; x.ap = null; }); } return; }
  const spd = comSpd(M);
  const want = it.kind === 'evt' || it.kind === 'intro' || it.kind === 'chat' || it.pri >= 2 || (it.pri >= 1 && spd <= 2.1 && !M.cs.tl.some(o => o !== it && o.pri >= it.pri && Math.abs(o.T - it.T) < 2.5));
  if (!want) return;
  for (const x of [it, ...(it.chain || [])]) if (!x.ap && comSpeakable(x)) { x.ap = aivFetch(x); x.ap.then(b => { x.buf = b; }, e => { x.err = e; }); }
}
const comLate = (kind, pri) => kind === 'evt' ? (pri >= 3 ? 3.5 : 2.5) : kind === 'act' ? (pri >= 3 ? 2.5 : pri >= 2 ? 1.4 : .8) : kind === 'intro' ? 30 : 3;

// ---------- 1. Anticipation : tout ce que le moteur a déjà joué est commenté d'avance ----------
function comLook(M) {
  const E = M.E, cs = M.cs; if (!E || !M.com) return;
  const evs = E.ev.slice(cs.lev || 0); cs.lev = E.ev.length;
  const cms = []; for (let i = E.cm.length - 1; i >= 0 && !E.cm[i]._k; i--) { E.cm[i]._k = 1; cms.unshift(E.cm[i]); }
  let i = 0, j = 0;
  while (i < evs.length || j < cms.length) {
    const e = evs[i], a = cms[j];
    if (e && (!a || e.t <= a.t)) { i++; comLookEv(M, e); } else { j++; comLookCm(M, a); }
  }
}
function comLookCm(M, a) {
  const r = cmLine(M, a); if (!r) return;
  const it = comItem(M, a.t, 'act', r[1], [{ who: r[2], txt: r[0] }], comLate('act', r[1]));
  if (it && r[1] >= 1) comPrep(M, it);
}
// actions de jeu (moteur) → [texte, priorité, orateur]
function cmLine(M, a) {
  if (!M.cs) comInit(M);
  const mine = a.k === 0, tm = mine ? M.my : M.op;
  if (a.type === 'shot') { M.cs.shotD = a.d || 0; M.cs.shotT = a.t; }
  const c = comCtx(M, { n: comName(M, a.n, a.me && mine), n2: comName(M, a.n2), tm, other: mine ? M.op : M.my, gk: LN(a.gk), d: a.d });
  const P = k => { const s = comPick(M, k); return s ? [cmFill(cmIsN(s) ? s.slice(2) : s, c), cmIsN(s) ? 'N' : 'S'] : null; };
  let r = null, pri = 0;
  switch (a.type) {
    case 'shot':
      if (a.kind === 'pen' || a.kind === 'fk') return null;
      r = a.me && mine && !M.coach ? P('shotMe') : a.kind === 'head' ? P('shotHead') : a.kind === 'chip' ? P('shotChip') : a.kind === 'volley' ? P('shotVolley') : a.d < 11 ? P('shotClose') : a.d > 22 ? P('shotLong') : a.style === 'curl' && a.d > 15 ? P('shotCurl') : a.style === 'power' && a.d > 18 ? P('shotPower') : P('shot');
      pri = a.d > 22 && !a.me ? 1 : 2; break;
    case 'cross': r = P('cross'); pri = 1; break;
    case 'thru': r = P('thru'); pri = 1; break;
    case 'long': r = P('long'); pri = 0; break;
    case 'box': r = P('box'); pri = 1; break;
    case 'drib': {
      const again = a.ok && M.cs.drib && M.cs.drib.n === a.n && a.t - M.cs.drib.t < 6;
      if (a.ok) M.cs.drib = { n: a.n, t: a.t };
      r = a.ok ? (again ? P('dribAgain') : a.me && mine && !M.coach ? P('dribMe') : P('dribOk')) : P('dribKo'); pri = a.ok ? 1 : 0; break;
    }
    case 'tackle': r = a.slide ? P('slide') : P('tackle'); pri = 0; break;
    case 'int': r = P('int'); pri = 0; break;
    case 'clear': r = a.out ? P('clearOut') : a.head ? P('clearHead') : P('clear'); pri = 0; break;
    case 'claim': r = a.punch ? P('punch') : P('claim'); pri = 0; break;
    case 'counter': r = P('counter'); pri = 1; break;
    case 'chance': r = P('chance'); pri = 1; break;
    case 'corner': r = P('corner'); pri = 0; break;
    case 'fk': r = P('fk'); pri = 0; break;
    case 'fkshot': r = P('fkshot'); pri = 2; break;
    case 'penk': r = P('penk'); pri = 3; break;
    case 'adv': r = P('adv'); pri = 1; break;
    case 'tac': r = a.m > 0 ? P('tacUp') : P('tacDown'); pri = 1; break;
  }
  if (!r) return null;
  return [r[0], pri, r[1]];
}
// événements : buts, arrêts, VAR, cartons, mi-temps… (avec le score de l'instant, pas celui de l'écran)
function comLookEv(M, e) {
  const cs = M.cs, mineK = e.k === 0, t = e.t, meK = e.me && mineK && !M.coach, mn = minNum(e.c, e.h);
  const sc0 = cs.lsc.slice(); if (e.score) cs.lsc = [e.score[0], e.score[1]];
  const mine = cs.lsc[0], th = cs.lsc[1];
  const c = comCtx(M, { n: comName(M, e.n, meK), tm: mineK ? M.my : M.op, other: mineK ? M.op : M.my, out: LN(e.out), sc: comScoreOf(M, cs.lsc), min: String(mn), scn: Math.max(mine, th) + ' à ' + Math.min(mine, th) });
  const seqL = seq => { const out = []; for (const [key, pri, song, x] of seq) for (const l of comLines(M, key, x ? Object.assign({}, c, x) : c, { pri, song: !!song })) out.push(l); return out; };
  const add = (pri, lines) => { const it = comItem(M, t, 'evt', pri, lines, comLate('evt', pri)); if (it) comPrep(M, it); return it; };
  if (['goal', 'save', 'wood', 'penalty', 'red', 'var', 'varchk'].includes(e.type) || (e.type === 'miss' && (e.xg || 0) > .2)) cs.bigT = Math.max(cs.bigT, t);
  switch (e.type) {
    case 'goal': {
      if (e.og) { if (!mineK && mine < th) cs.behind = true; return add(3, seqL([[mineK ? 'goalOgFor' : 'goalOg', 3]])); }
      if (!mineK) {
        const seq = [['goalOpp', 3]], paO = typeof paGoal === 'function' && paGoal(M, e, mn);
        if (S && S.rival && e.n === S.rival.n && !M.coach) seq.push(['goalRival', 2]); else if (mine === th && R() < .7) seq.push(['goalOppEq', 2]); else if (R() < .55) seq.push(['goalOppN', 2]);
        if (mine < th) cs.behind = true; const GO = seqL(seq); if (paO) GO.splice(1, 0, paO); return add(3, GO);
      }
      cs.scorers[e.n] = (cs.scorers[e.n] || 0) + 1;
      const first = meK && S && S.ss && !(S.ss.g > 0) && !(cs.lg > 0) && !(S.hist || []).some(h => h.g > 0);
      if (meK) cs.lg++;
      const seq = [[meK ? 'goalMe' : 'goal', 3]];
      if (cs.scorers[e.n] === 3) seq.push(['goalTriple', 2]); else if (cs.scorers[e.n] === 2) seq.push(['goalDouble', 2]);
      if (first) seq.push(['goalFirst', 2]);
      const d = cs.shotD && t - cs.shotT < 6 ? Math.round(cs.shotD) : 0;
      if (e.post) seq.push(['goalPost', 2]); else if (e.kind === 'chip') seq.push(['goalChip', 2]); else if (e.kind === 'volley') seq.push(['goalVolley', 2]); else if (e.kind === 'fk') seq.push(['goalFk', 2]); else if (e.kind === 'head') seq.push(['goalHead', 2]); else if (e.kind === 'pen') seq.push(['goalPen', 2]); else if (d > 23) seq.push(['goalLong', 2, false, { d }]);
      if (cs.behind && mine > th) { seq.push(['goalComeback', 2]); cs.behind = false; } else if (mine === th) seq.push(['goalEq', 2]);
      if (mn >= 85 && mine >= th) seq.push(['goalLate', 2]);
      if (seq.length > 3) seq.length = 3;
      const beauty = ['chip', 'volley', 'fk'].includes(e.kind) || e.post || d > 23, promise = meK && cs.promise;
      if (cmChat()) {
        if (promise) { seq.push(['goalPromise', 2]); cs.promise = false; }
        if (promise || first || (cs.sung < 3 && R() < (meK ? .85 : beauty ? .8 : mn >= 85 ? .6 : .25))) { cs.sung++; seq.push(['songs', 2, true]); if (R() < .7) seq.push(['songN', 2]); }
        if (meK && S && S.ss) { const sg = (S.ss.g || 0) + cs.lg; if (sg >= 3 && R() < .5) seq.push(['goalSeason', 2, false, { sg }]); }
        if (!meK && cs.scorers[e.n] === 2 && !cs.nk[e.n]) { const nick = pick(CM_NICKS.filter(x => !Object.values(cs.nk).includes(x))); cs.nk[e.n] = nick; seq.push(['nickGive', 2, false, { nick, n: LN(e.n) }]); if (R() < .6) seq.push(['nickGiveN', 2]); }
        if (cs.avia && R() < .5) seq.push(['goalAvia', 2]);
      }
      const GL = seqL(seq), pa = typeof paGoal === 'function' && paGoal(M, e, mn); if (pa) GL.splice(1, 0, pa);
      return add(3, GL);
    }
    case 'save': if (meK) return add(3, seqL([['saveMe', 3]])); if (!mineK && (e.xg || 0) > .12 && R() < .6) return add((e.xg || 0) > .2 ? 3 : 2, seqL([['saveOpp', 3]])); return add((e.xg || 0) > .2 ? 3 : 2, seqL([[(e.xg || 0) > .2 ? 'saveBig' : 'save', 3]]));
    case 'miss': if ((e.xg || 0) > .25) return add(2, seqL(R() < .5 ? [['missBig', 2], ['missBigN', 2]] : [['missBig', 2]])); return add(1, seqL([[e.hi ? 'missHigh' : 'missWide', 1]]));
    case 'wood': return add(3, seqL([[!mineK && R() < .7 ? 'woodOpp' : e.bar ? 'bar' : 'wood', 3]]));
    case 'block': return add(1, seqL([['block', 1]]));
    case 'penalty': return e.var ? null : add(3, seqL([[mineK ? 'penMine' : 'penOpp', 3]]));
    case 'varchk': return add(2, seqL([[e.what === 'goal' ? 'varGoal' : 'varPen', 2]]));
    case 'var': {
      const why = e.why === 'hors-jeu' ? 'Hors-jeu de ' + LN(e.wn) : 'Main de ' + LN(e.wn);
      if (e.what === 'goal') { if (!e.ok && mineK && e.n && cs.scorers[e.n]) cs.scorers[e.n]--; if (!e.ok && meK) cs.lg = Math.max(0, cs.lg - 1); return add(e.ok ? 2 : 3, seqL([[mineK ? (e.ok ? 'varOk' : 'varNo') : (e.ok ? 'varOkOpp' : 'varNoOpp'), e.ok ? 2 : 3, false, { why }]])); }
      return add(3, seqL([[e.award ? 'varPenYes' : e.ok ? 'varPenOk' : 'varPenNo', 3]]));
    }
    case 'yellow': return add(meK ? 2 : 1, seqL([[meK ? 'yellowMe' : 'yellow', meK ? 2 : 1]]));
    case 'red': return add(3, seqL([[meK ? 'redMe' : 'red', 3]]));
    case 'offside': return add(1, seqL([['offside', 1]]));
    case 'sub': if (mineK && e.me && !M.coach) return add(2, seqL([['subIn', 2]])); if (mineK && e.outMe) return add(2, seqL([[e.why === 'blessure' ? 'injMe' : 'subOut', 2]])); return add(0, seqL([['sub', 0]]));
    case 'inj': { const L = seqL([[e.me && mineK && !M.coach ? 'injMe' : 'inj', 1]]); if (cmChat() && R() < .5) for (const l of comLines(M, 'injPause', c, { pri: 1 })) L.push(l); return add(1, L); }
    case 'ht': { cs.htT = t; const it = add(2, seqL([['ht', 2]])); if (it) it.late = 20; return it; }
    case 'ft': { const FL = seqL([[mine > th ? 'ftWin' : mine < th ? 'ftLoss' : 'ftDraw', 3]]), pe = typeof paEnd === 'function' && paEnd(M); if (pe) FL.splice(1, 0, pe); const it = add(3, FL); if (it) it.late = 20; return it; }
  }
}
// avant le coup d'envoi : présentation à deux voix, puis (dès qu'il y a un temps calme) météo, ton joueur, le rival…
function comIntro(M) {
  const cs = comInit(M), C = M.cond || {}, c = comCtx(M);
  const IL = comLines(M, 'intro', c); if (typeof paIntro === 'function') IL.unshift(...paIntro(M));
  const it = comItem(M, 0, 'intro', 2, IL, comLate('intro', 2)); if (it) it.late = 40;
  const ex = C.derby ? 'introDerby' : C.snow ? 'introSnow' : C.rain ? 'introRain' : C.att > 40000 ? 'introBig' : C.att < 500 ? 'introSmall' : C.temp >= 28 ? 'introHot' : C.temp <= 3 ? 'introCold' : C.night && R() < .6 ? 'introNight' : null;
  const lines = [];
  if (cmChat()) {
    if (ex) lines.push(...comLines(M, ex, c, { dig: true }));
    if (M.coach) lines.push(...comLines(M, 'introCoach', c, { dig: true }));
    else if (S && S.p) {
      const back = S.p.backD != null && typeof absDay === 'function' && absDay() - S.p.backD < 21 && M.starter;
      const tier = OVR() < 64 ? 0 : OVR() < 80 ? 1 : 2, prev = S.cnick;
      if (back) { lines.push(...comLines(M, 'introBack', c, { dig: true })); S.p.backD = null; }
      else if (prev && prev.tier < tier && M.starter) lines.push(...comLines(M, 'nickUp', Object.assign({}, c, { old: prev.nick }), { dig: true }));
      else lines.push(...comLines(M, M.starter ? 'introMe' : 'introBench', c, { dig: true }));
      S.cnick = { tier, nick: comNick(tier) };
      if (M.rivalDuel && S.rival) lines.push(...comLines(M, 'introRival', c, { dig: true }));
    }
  }
  if (lines.length) cs.dlg = { lines, i: 0, lastR: null, intro: true };
}

// ---------- 2. Le direct : à chaque image, qui parle et quand ----------
// t = temps du match à l'écran ; rt = temps réel (secondes) quand l'écran du match est affiché (sinon on simule)
function comTick(M, t, rt) {
  if (!M.com) return; const cs = comCS(M), E = M.E;
  comLook(M);
  const voice = comVoice(M, rt), spd = comSpd(M); if (rt == null) rt = t;
  const paused = !!(M.pending || M.press || M.half || M.shoot || (typeof UI !== 'undefined' && UI.mg));
  // la réplique en cours est finie ? (la voix du téléphone peut déborder un peu : on la laisse finir)
  if (cs.cur && rt >= cs.cur.endR) { if (!(voice && typeof sayBusyWith === 'function' && sayBusyWith(cs.cur.it.id) && rt < cs.cur.endR + 1.5)) cs.cur = null; }
  // à grande vitesse, on ne garde que l'essentiel ; les répliques trop en retard sont abandonnées
  const minPri = spd >= 6 ? 3 : spd >= 3 ? 2 : 0;
  const ai = voice && comAI(), due = [];
  cs.tl = cs.tl.filter(it => {
    if (it.T > t + .05) return true;
    if (it.dueR == null) it.dueR = rt;
    const waitAI = ai && it.ap && !it.buf && !it.err ? (it.pri >= 3 ? 2.5 : 1) : 0;
    if (it.pri < minPri || rt - it.dueR > it.late + waitAI || t - it.T > it.late * Math.max(1, spd) + 2 + waitAI * spd) return false;
    due.push(it); return true;
  });
  // répliques d'ambiance (priorité 0) : affichées seulement quand personne ne parle
  for (const it of due) if (it.pri < 1) { if (!cs.cur && rt - cs.txtR > 2.5) { com(M, it.txt, 0, t, it.who); cs.txtR = rt; } cs.tl.splice(cs.tl.indexOf(it), 1); }
  const order = { evt: 3, intro: 2, act: 1, chat: 0 };
  let best = null; for (const it of due) if (it.pri >= 1 && cs.tl.includes(it) && (!best || it.pri > best.pri || (it.pri === best.pri && (order[it.kind] > order[best.kind] || (order[it.kind] === order[best.kind] && it.T < best.T))))) best = it;
  // l'audio IA de cette réplique n'est pas encore prêt : on patiente (ou repli sur la voix du téléphone pour un grand moment)
  if (best && ai && best.ap && !best.buf) { if (!best.err && rt - best.dueR < (best.pri >= 3 ? 2.5 : 1)) best = null; else if (best.err && best.pri < 3) { cs.tl.splice(cs.tl.indexOf(best), 1); best = null; } }
  if (best) {
    const c = cs.cur, cut = !c || best.pri > c.it.pri || (c.it.kind === 'chat' && best.kind !== 'chat') || (c.it.kind === 'intro' && best.kind !== 'intro' && best.pri >= 2);
    if (cut) { cs.tl.splice(cs.tl.indexOf(best), 1); comStart(M, best, t, rt, c, voice); }
  }
  if (cs.cur) return;
  // la suite d'un grand moment (but : réaction, chanson, Nathalie…)
  while (cs.chain.length) {
    const nx = cs.chain[0];
    if (rt - (nx.baseR || rt) > 30) { cs.chain.length = 0; break; }
    if (ai && nx.ap && !nx.buf && !nx.err && rt - (nx.waitR || (nx.waitR = rt)) < 3) return;
    cs.chain.shift(); if (nx.pri < minPri) continue; comStart(M, nx, t, rt, null, voice); return;
  }
  if (paused && cs.dlg && !cs.dlg.intro) cs.dlg = null;
  if (cs.dlg) return comDlgNext(M, t, rt, spd, voice);
  if (!paused && E && !M.done) comPlanChat(M, t, rt, spd, voice);
}
function comStart(M, it, t, rt, prev, voice) {
  const cs = M.cs;
  if (prev && prev.it.kind === 'chat' && it.kind !== 'chat') cs.dlg = null; // l'action coupe la discussion
  if (it.dlg) { it.dlg.pend = null; it.dlg.lastR = rt; }
  if (it.kind !== 'chat' && !it.inChain && (it.pri >= 2 || it.kind === 'evt')) cs.chain = [];
  let txt = it.txt;
  // on coupe Nathalie au milieu d'une phrase : petit mot naturel (seulement avec la voix du téléphone, l'audio IA est déjà fabriqué)
  if (prev && prev.it.kind === 'chat' && it.kind === 'act' && it.pri >= 2 && !(voice && (comAI() || comSpeakable(it))) && R() < .45) txt = pick(CM_CUT) + ' ' + txt;
  const spoken = voice && comSpeakable(it);
  cs.cur = { it, endR: rt + (spoken || !voice || !comAI() ? comDur(it, txt) : 0) };
  com(M, txt, it.pri, t, it.who, { song: it.song, dig: it.dig }); cs.txtR = rt;
  if (it.chain && it.chain.length) cs.chain = it.chain.map(x => Object.assign(x, { baseR: rt, inChain: true }));
  if (spoken) sayPlay(Object.assign({}, it, { txt, kind: it.kind }));
  if (it.kind !== 'chat' && it.pri >= 3) cs.bigT = Math.max(cs.bigT, t);
}
// prochain temps fort connu (ou la limite de ce que le moteur a déjà joué)
function comNextT(M, t) {
  const E = M.E, cs = M.cs; let n = M.stopAt != null ? M.stopAt : E ? E.time : t;
  for (const it of cs.tl) if (it.pri >= 1 && it.kind !== 'chat' && it.T > t - .01 && it.T < n) n = it.T;
  return n;
}
function comFits(M, t, spd, secs, voice) { const lead = voice && comAI() ? Math.min(3, (typeof AIV !== 'undefined' && AIV.lat) || 1.2) + .3 : 0; return { ok: (comNextT(M, t) - t) / Math.max(1, spd) >= lead + secs + .7, lead }; }
// lance la réplique suivante d'une discussion, si le jeu en laisse le temps
function comDlgNext(M, t, rt, spd, voice) {
  const cs = M.cs, D = cs.dlg;
  if (D.pend) { if (cs.tl.includes(D.pend)) return; cs.dlg = null; return; } // réplique abandonnée (une action est passée devant) : la discussion s'arrête là
  const l = D.lines[D.i]; if (!l) { cs.dlg = null; return; }
  if (D.lastR != null && rt - D.lastR > 25) { cs.dlg = null; return; }
  if (rt - cs.txtR < (D.i ? .25 : 1)) return;
  const f = comFits(M, t, spd, comDur(l), voice); if (!f.ok) return;
  // voix IA : toute la discussion est préparée dès sa première réplique
  if (voice && comAI() && D.i === 0) for (const x of D.lines) if (!x.ap) { x.kind = 'chat'; if (x.pri == null) x.pri = 1; if (comSpeakable(x)) { x.ap = aivFetch(x); x.ap.then(b => { x.buf = b; }, e => { x.err = e; }); } }
  const it = comItem(M, t + f.lead * Math.max(1, spd), 'chat', l.pri ?? 1, [l], 3);
  if (l.ap) { it.ap = l.ap; if (l.buf) it.buf = l.buf; it.ap.then(b => { it.buf = b; }, e => { it.err = e; }); } else if (voice) comPrep(M, it);
  it.dlg = D; D.pend = it; D.i++;
}
// rien à commenter : de quoi parlent-ils ?
function comPlanChat(M, t, rt, spd, voice) {
  const cs = M.cs, E = M.E; if (spd > 2.1 || comResume()) return;
  if (rt - cs.txtR < 1.6) return;
  const mnum = parseInt(M.min) || 0, mine = M.side === 'h' ? M.hg : M.ag, th = M.side === 'h' ? M.ag : M.hg;
  const tense = (mnum >= 78 && Math.abs(mine - th) <= 1) || mnum >= 85;
  const start = (lines, fl) => { if (!lines || !lines.length) return false; const f = comFits(M, t, spd, comDur(lines[0]), voice); if (!f.ok) return false; cs.dlg = { lines: lines.map(l => Object.assign(l, fl || {})), i: 0, lastR: null }; comDlgNext(M, t, rt, spd, voice); return true; };
  // reprise de la deuxième période
  if (cs.htT != null && !cs.secSaid && E.half === 2 && t > cs.htT + 2.5) { cs.secSaid = true; return start(comLines(M, 'second', comCtx(M), { pri: 2 })); }
  if (/^90\+/.test(String(M.min)) && !cs.addSaid && Math.abs(mine - th) <= 1) { cs.addSaid = true; return start(comLines(M, 'added', comCtx(M), { pri: 2 })); }
  if (mnum >= 85 && !cs.lateSaid && Math.abs(mine - th) <= 1) { cs.lateSaid = true; return start(comLines(M, 'late', comCtx(M), { pri: 2 })); }
  if (t - cs.bigT < 20) return;
  const fr = typeof lvAt === 'function' && typeof LV !== 'undefined' && LV.M === M ? lvAt(t) : null, poss = fr ? fr[11] : E.poss, tm = poss === 0 ? M.my : M.op, other = poss === 0 ? M.op : M.my;
  // une vraie digression (sa grand-mère, la tramontane…) : il faut un long temps calme
  if (cmChat() && t >= cs.next.dig && !tense && t - cs.bigT > 90 && comFits(M, t, spd, 7, voice).ok) {
    let d = null; for (let k = 0; k < 6 && !d; k++) { d = comPick(M, 'dig'); if (d && !comDigOk(M, d, mnum)) d = null; }
    cs.next.dig = t + 300 + R() * 220;
    if (d && start(comLines(M, d, comCtx(M, { tm, other }), { dig: true, pri: 1 }))) return;
  }
  // on parle du match : joueurs, stats, classement, arbitre, ton joueur…
  if (t >= cs.next.talk && t - cs.bigT > 25 && comFits(M, t, spd, 4, voice).ok) {
    const L = comTalk(M, t); cs.next.talk = t + 40 + R() * 45;
    if (L && start(L, { talk: true })) return;
  }
  if (t >= cs.next.score && mnum >= 10 && comFits(M, t, spd, 3, voice).ok) { cs.next.score = t + 280 + R() * 120; if (start(comLines(M, mine >= th + 3 ? 'scoreRout' : mine < th && mnum > 30 ? 'scoreDown' : 'scoreLine', comCtx(M, { tm, other }), { pri: 1 }))) return; }
  // le commentaire du direct : qui a le ballon, où, ce qu'il fait (lu sur l'image qui sera à l'écran au moment de parler)
  if (t >= (cs.next.live || 0) && comFits(M, t, spd, 2.2, voice).ok) {
    const f = comFits(M, t, spd, 2.2, voice), L = comLiveLine(M, t + f.lead * Math.max(1, spd));
    cs.next.live = t + (5 + R() * 5) * Math.max(1, spd);
    if (L && start([L], { pri: 1, live: true })) return;
  }
  if (t >= cs.next.flow && comFits(M, t, spd, 2.5, voice).ok) {
    cs.next.flow = t + 24 + R() * 26;
    const key = R() < .35 ? 'flowN' : 'flow'; let it = null;
    for (let k = 0; k < 4 && !it; k++) { it = comPick(M, key); if (mine + th > 0 && JSON.stringify(it).includes('#calm')) it = null; }
    if (it) start(comLines(M, it, comCtx(M, { tm, other }), { pri: 1, flow: true }));
  }
}
// une digression convient-elle au moment ? (#night, #rain, #promise…)
function comDigOk(M, d, mnum) {
  const C = M.cond || {};
  if (d.includes('#night') && !C.night) return false;
  if (d.includes('#rain') && !C.rain) return false;
  if (d.includes('#promise') && (!onPitch(M) || (S.p && S.p.pos === 'GB') || M.cs.promise || mnum > 70)) return false;
  return true;
}
// ---------- 3. On parle du match : de vraies infos, tirées de la rencontre et de ta carrière ----------
const CM_REACT = {
  pass: ['Un métronome, Nathalie ! Tic, tac, tic, tac !', 'Il distribue comme un facteur le lundi matin !', 'Tout passe par lui. C\'est le chef de gare.', 'S\'il était serveur, il ne casserait jamais une assiette.'],
  tackle: ['Un aspirateur ! Il ramasse tout ce qui traîne !', 'Il mord les mollets, il ne lâche rien. J\'adore ce garçon.', 'Moi je n\'aimerais pas le croiser dans un couloir sombre.'],
  drib: ['Il joue avec eux comme un chat avec une pelote !', 'Les défenseurs vont faire des cauchemars ce soir.', 'Ça, c\'est le football que j\'aime : un peu de folie !'],
  danger: ['Il faut le surveiller comme le lait sur le feu !', 'Je le connais, celui-là. Un renard. Un vrai renard.', 'Qu\'on lui mette deux joueurs sur le dos, au moins !'],
  table: ['Les points, les points… Moi je veux du spectacle !', 'Le classement, c\'est en mai qu\'on le regarde, Nathalie.', 'Chaque point compte, chaque point est une petite pierre.'],
  form: ['La confiance, mes amis, la confiance ! Ça ne s\'achète pas au marché.', 'La forme, c\'est comme la tramontane : quand elle souffle, elle souffle.', 'Une série, ça porte une équipe, ça la fait voler.'],
  refSoft: ['Laisser jouer, c\'est un art, Nathalie. Un art !', 'Je l\'aime bien, il court beaucoup, il a de belles chaussettes.', 'Un arbitre qu\'on ne remarque pas est un bon arbitre. Bravo, monsieur !'],
  refHard: ['Il a le sifflet facile, ou alors c\'est moi qui suis vieux jeu.', 'Il siffle tout ! Même les oiseaux s\'arrêtent de chanter.', 'Monsieur l\'arbitre, laissez-les jouer, c\'est du football, pas du ballet !'],
  coach: ['Il a la tête de quelqu\'un qui n\'a pas beaucoup dormi.', 'Sur le banc, il ne tient pas en place. Il va user ses chaussures.', 'Un tacticien. Il a sûrement un plan dans sa poche.'],
  me: ['Ce garçon, je l\'ai à la bonne, je l\'ai toujours dit !', 'Notez son nom, mes amis. Notez-le dans un petit carnet.', 'S\'il continue comme ça, je vais lui écrire une chanson. Une vraie.'],
  poss: ['Avoir le ballon, c\'est bien. Le mettre au fond, c\'est mieux !', 'Ils le gardent comme un trésor, ce ballon.', 'L\'autre équipe court derrière, elle va être cuite à l\'heure de jeu.'],
  shots: ['Il faut frapper, les enfants ! Qui ne tente rien n\'a rien !', 'On attend la frappe qui fait trembler les filets.', 'La frappe, c\'est comme le pain : il faut en faire tous les jours.'],
  weather: ['Il faut s\'adapter, comme mon grand-père avec sa barque à Collioure.', 'La météo, ça fait partie du football, mes amis.'],
};
const CM_TAC = { press: 'presser très haut', counter: 'défendre bas et partir en contre', def: 'fermer les espaces et défendre', off: 'attaquer sans retenue', bal: 'rester équilibré' };
const comPick2 = a => a[Math.floor(R() * a.length)];
function comTeamInfo(M, k) {
  const L = S && S.live, P = L && L.prep, mine = k === 0, t = P ? (M.side === 'h' ? (mine ? P.h : P.a) : (mine ? P.a : P.h)) : null;
  const id = t && t.id && typeof t.id === 'string' && !t.id.startsWith('X|') && S.W && S.W.clubs && S.W.clubs[t.id] ? t.id : null;
  return { n: mine ? M.my : M.op, id, club: id ? S.W.clubs[id] : null };
}
function comTalk(M, t) {
  const E = M.E, cs = M.cs; if (!E) return null;
  const U = cs.talkU, opts = [], once = k => !U[k], use = k => { U[k] = (U[k] || 0) + 1; };
  const N = s => ({ who: 'N', txt: s, pri: 1 }), Lo = s => ({ who: 'S', txt: s, pri: 1 });
  const pl = E.T.flatMap((T, k) => T.pl.filter(p => p.on && !p.rc).map(p => ({ p, k })));
  const tmOf = k => k === 0 ? M.my : M.op;
  const best = f => pl.reduce((b, x) => (!b || f(x.p) > f(b.p) ? x : b), null);
  // 1. le meneur de jeu : passes réussies
  const bp = best(p => p.st.pc); if (bp && bp.p.st.pa >= 14 && (U.pass || 0) < 2) opts.push(['pass', () => [N(comPick2([`${LN(bp.p.n)} a déjà réussi ${bp.p.st.pc} passes sur ${bp.p.st.pa}. ${tmOf(bp.k)} passe beaucoup par lui.`, `Regardez les chiffres de ${LN(bp.p.n)} : ${bp.p.st.pc} passes réussies, c'est lui qui donne le tempo.`, `${Math.round(bp.p.st.pc / bp.p.st.pa * 100)} % de passes réussies pour ${LN(bp.p.n)}. Très propre.`])), Lo(comPick2(CM_REACT.pass))]]);
  // 2. le récupérateur
  const bt = best(p => p.st.tk + p.st.int); if (bt && bt.p.st.tk + bt.p.st.int >= 4 && (U.tackle || 0) < 2) opts.push(['tackle', () => [N(`${bt.p.st.tk + bt.p.st.int} ballons récupérés pour ${LN(bt.p.n)}. Il fait un travail énorme pour ${tmOf(bt.k)}.`), Lo(comPick2(CM_REACT.tackle))]]);
  // 3. le dribbleur
  const bd = best(p => p.st.drs); if (bd && bd.p.st.drs >= 3 && (U.drib || 0) < 2) opts.push(['drib', () => [Lo(comPick2([`${LN(bd.p.n)} a déjà réussi ${bd.p.st.drs} dribbles !`, `${bd.p.st.drs} dribbles réussis pour ${LN(bd.p.n)}, c'est un feu follet !`, `Combien de joueurs a-t-il éliminés, ${LN(bd.p.n)} ? ${bd.p.st.drs} ! J'ai compté !`])), N(`Il fait la différence sur son côté. ${tmOf(1 - bd.k)} devra mettre deux joueurs sur lui.`), Lo(comPick2(CM_REACT.drib))]]);
  // 4. l'homme dangereux d'en face (le mieux noté)
  const op = E.T[1].pl.filter(p => p.on && !p.rc && p.role !== 'GK').sort((a, b) => (b.o || 0) - (a.o || 0))[0];
  if (op && op.o && once('danger')) opts.push(['danger', () => [N(`Attention au numéro ${op.num}, ${LN(op.n)}. C'est le joueur le plus fort de ${M.op}${op.sn ? ', une vraie vedette' : ''}.`), Lo(comPick2(CM_REACT.danger))]]);
  // 5. ton joueur : sa saison, son âge, sa note
  if (!M.coach && S && S.p && S.ss && onPitch(M) && (U.me || 0) < 2) {
    const g = S.ss.g || 0, a = S.ss.a || 0, ap = S.ss.apps || 0, o = OVR(), me = comNick();
    const second = !!U.me; opts.push(['me', () => (second ? [N(`${pName()} a ${S.p.age} ans et déjà une note de ${o}. ${o >= 80 ? 'C\'est un des meilleurs à son poste.' : o >= 68 ? 'Il progresse très vite.' : 'Il a encore une belle marge de progression.'}`), Lo(comPick2(CM_REACT.me))]
      : [Lo(ap ? `${me}, cette saison : ${g} but${g > 1 ? 's' : ''} et ${a} passe${a > 1 ? 's' : ''} décisive${a > 1 ? 's' : ''} en ${ap} match${ap > 1 ? 's' : ''} !` : `C'est le début de saison pour ${me}. Tout reste à écrire !`), N(g + a >= ap && ap >= 3 ? 'Des chiffres de très haut niveau, il faut le dire.' : ap ? 'Il doit encore être plus décisif devant le but.' : 'On attend beaucoup de lui, ses entraîneurs en disent du bien.')])]);
  }
  // 6. le classement (match de championnat entre deux clubs connus)
  const A = comTeamInfo(M, 0), B = comTeamInfo(M, 1);
  if (A.club && B.club && A.club.lid === B.club.lid && S.W.leagues[A.club.lid] && once('table')) {
    const T = S.W.leagues[A.club.lid].table, ta = T[A.id], tb = T[B.id];
    if (ta && tb && ta.p >= 2) opts.push(['table', () => { const pa = clubPos(A.id), pb = clubPos(B.id); return [N(`Au classement, ${A.n} est ${pa}${pa === 1 ? 'er' : 'e'} avec ${ta.pts} points, ${B.n} ${pb}${pb === 1 ? 'er' : 'e'} avec ${tb.pts} points.`), Lo(Math.abs(ta.pts - tb.pts) <= 3 ? 'Un match à six points, mes amis ! Six points !' : comPick2(CM_REACT.table))]; }]);
  }
  // 7. la forme du moment (cinq derniers matchs)
  for (const X of [A, B]) {
    if (!X.club || !S.W.leagues[X.club.lid]) continue; const T = S.W.leagues[X.club.lid].table[X.id], f = T && T.f ? T.f.slice(-5) : [];
    if (f.length >= 4 && once('form' + X.n)) { const w = f.filter(r => r === 'V' || r === 'W' || r === 3).length, l = f.filter(r => r === 'D' || r === 'L' || r === 0).length;
      if (w >= 3 || l >= 3) opts.push(['form' + X.n, () => [N(w >= 3 ? `${X.n} reste sur ${w} victoires lors de ses ${f.length} derniers matchs.` : `${X.n} traverse une période difficile : ${l} défaites lors des ${f.length} derniers matchs.`), Lo(comPick2(CM_REACT.form))]]); }
  }
  // 8. l'entraîneur et son plan
  for (const k of [0, 1]) { const X = k ? B : A, tac = E.T[k].tacK || 'bal', coach = X.club && X.club.coach; if (coach && tac !== 'bal' && once('coach' + k)) opts.push(['coach' + k, () => [N(`${coach} a demandé à ${X.n} de ${CM_TAC[tac]}. On le voit bien depuis le début.`), Lo(comPick2(CM_REACT.coach))]]); }
  // 9. l'arbitre
  if (!cs.ref) cs.ref = { n: typeof genName === 'function' ? genName('FRA') : 'Martin Dupont' };
  if (typeof liveStats === 'function' && once('ref') && t > 900) {
    const s = liveStats(M), fo = s.fo[0] + s.fo[1], yc = s.yc[0] + s.yc[1], rn = LN(cs.ref.n), soft = fo <= 8 && yc < 3;
    opts.push(['ref', () => [N(yc >= 3 ? `M. ${rn}, l'arbitre, a déjà sorti ${yc} cartons jaunes. Il ne laisse rien passer.` : soft ? `L'arbitre, M. ${rn}, laisse beaucoup jouer : seulement ${fo} faute${fo > 1 ? 's' : ''} sifflée${fo > 1 ? 's' : ''}.` : `${fo} fautes sifflées par M. ${rn}. Le match est haché.`), Lo(comPick2(soft ? CM_REACT.refSoft : CM_REACT.refHard))]]);
  }
  // 10. les statistiques du match
  if (typeof liveStats === 'function' && t > 600) {
    const s = liveStats(M), mi = M.side === 'h' ? 0 : 1, k = s.pos[0] >= s.pos[1] ? 0 : 1, tmK = j => j === mi ? M.my : M.op;
    if (Math.abs(s.pos[0] - s.pos[1]) >= 14 && (U.poss || 0) < 2) opts.push(['poss', () => [N(`${s.pos[k]} % de possession pour ${tmK(k)}.`), Lo(comPick2(CM_REACT.poss))]]);
    if (s.sh[0] + s.sh[1] >= 6 && (U.shots || 0) < 2) opts.push(['shots', () => [N(`${s.sh[mi]} tir${s.sh[mi] > 1 ? 's' : ''} pour ${M.my}, dont ${s.sot[mi]} cadré${s.sot[mi] > 1 ? 's' : ''}, contre ${s.sh[1 - mi]} pour ${M.op}.`), Lo(comPick2(CM_REACT.shots))]]);
    if (s.xg) { const mine = M.side === 'h' ? M.hg : M.ag, th = M.side === 'h' ? M.ag : M.hg, d = s.xg[mi] - s.xg[1 - mi]; if (((d > .8 && mine <= th) || (d < -.8 && th <= mine)) && once('xg')) opts.push(['xg', () => [N(`Sur la qualité des occasions, ${d > 0 ? M.my : M.op} mériterait mieux que ce score.`), Lo('Le football n\'est pas juste, Nathalie. Il est beau, mais il n\'est pas juste.')]]); }
    for (let j = 0; j < 2; j++) if (s.cor[j] >= 5 && once('cor' + j)) opts.push(['cor' + j, () => [N(`Déjà ${s.cor[j]} corners pour ${tmK(j)}. Ça pousse.`), Lo('Ça sent le but, ça sent le but !')]]);
  }
  // 11. la météo, la pelouse, le public (une fois par match)
  const C = M.cond || {};
  if ((C.rain || C.snow || C.wear > .5 || C.temp >= 30) && once('weather')) opts.push(['weather', () => [N(C.snow ? 'Avec la neige, le ballon ne roule pas pareil, les passes sont plus lentes.' : C.rain ? 'La pelouse est lourde et glissante, regardez comme les passes fusent.' : C.temp >= 30 ? 'Avec cette chaleur, les organismes vont souffrir en fin de match.' : 'La pelouse est abîmée, le ballon fait des faux rebonds.'), Lo(comPick2(CM_REACT.weather))]]);
  if (C.att >= 25000 && C.att <= 40000 && once('crowd')) opts.push(['crowd', () => [Lo(`Écoutez-moi ces ${C.att.toLocaleString('fr-FR')} spectateurs ! Quelle ambiance !`), N('Le public pousse, ça se sent dans les duels.')]]);
  if (!opts.length) return null;
  const [k, f] = comPick2(opts), lines = f(); use(k.replace(/\d$/, '')); if (/^(form|coach|cor)/.test(k)) U[k] = 1;
  return lines;
}
// ---------- 4. Le direct, ballon par ballon ----------
const CM_LIVE = {
  back: ['{n} relance depuis l\'arrière.', '{n} à la relance pour {tm}.', '{tm} repart de derrière avec {n}.', '{n} prend son temps derrière.', 'Ça ressort proprement, {n}.', '{n}, calmement, en défense.'],
  mid: ['{n} au milieu de terrain…', '{n} conduit le ballon, il lève la tête.', '{n} temporise, il cherche une solution.', 'Le ballon pour {n}.', '{n} oriente le jeu.', '{n}, plein axe…', 'C\'est {n} qui touche le ballon.', '{n} se retourne…'],
  wing: ['{n} sur l\'aile {side}…', '{n} file le long de la ligne de touche…', '{n} déborde côté {side}…', 'Côté {side}, {n} accélère…', '{n} dans son couloir…'],
  att: ['{n} entre dans les trente derniers mètres…', '{n} aux abords de la surface !', 'Attention, {n} s\'approche…', '{n} devant la surface, il cherche l\'ouverture…', '{n} à l\'entrée de la surface…'],
  me: ['{n} a le ballon ! Allez !', 'Le ballon pour {n} !', '{n}… vas-y, mon petit !', 'C\'est {n} ! Fais-nous rêver !'],
};
function comLiveLine(M, tt) {
  if (typeof lvAt !== 'function' || typeof LV === 'undefined' || LV.M !== M) return null;
  const fr = lvAt(tt); if (!fr || fr[9] || fr[6] < 0) return null; // ballon mort ou disputé : on ne raconte rien
  const k = fr[6], i = fr[7], ros = LV.ros[fr[8]] || LV.ros[Object.keys(LV.ros).pop()], r = ros && ros[k] && ros[k][i]; if (!r || r.gk) return null;
  const cs = M.cs; if (cs.liveN === r.n && R() < .7) return null; cs.liveN = r.n;
  const [u, v] = loc(k, fr[3], fr[4]), me = r.me && !M.coach;
  const zone = me && R() < .5 ? 'me' : u > 72 ? 'att' : Math.abs(v - 34) > 22 && u > 35 ? 'wing' : u < 32 ? 'back' : 'mid';
  const side = v < 34 ? 'gauche' : 'droit'; // v : largeur vue par l'équipe qui attaque (côté gauche = v < 34)
  const tpl = pick(CM_LIVE[zone]), n = me ? comName(M, r.n, true) : LN(r.n);
  return { who: 'S', txt: cmFill(tpl, { n, tm: k === 0 ? M.my : M.op, side }), pri: 1 };
}
