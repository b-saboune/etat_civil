# CIVILIS — Conformite Palier 1 et feuille de route

Ce document trace, honnetement, l'ecart entre le Prompt Maitre et le code a un instant donne.
Objectif : que quiconque reprenne ce depot sache exactement ce qui est solide et ce qui reste a faire
avant une mise en production reelle.

## Deuxieme echec reel de la migration V5 (retour utilisateur) : abandon de l'index fonctionnel

Le premier correctif (forme a un seul argument `unaccent(texte)`) a echoue a son tour au demarrage
reel (`mvn spring-boot:run`, Java 17, instance PostgreSQL reelle) avec `la fonction unaccent(text)
n'existe pas` au moment de la creation de l'index fonctionnel — l'exact symetrique de l'echec
precedent (`unaccent(unknown, text)`). Diagnostic : le probleme n'est pas la forme a un ou deux
arguments, mais l'optimisation d'inlining que PostgreSQL applique aux fonctions SQL simples
utilisees dans un index fonctionnel ; cette optimisation echoue a resoudre correctement l'appel a
`unaccent()`, quelle que soit sa forme, dans ce contexte precis — un comportement que cette
session ne peut pas reproduire ni deboguer avec certitude sans acces a l'instance PostgreSQL cible
(aucune base de donnees disponible dans le bac a sable de developpement).

Plutot que de continuer a deviner une troisieme variante de casting sans pouvoir la tester,
decision assumee : **abandon de l'index fonctionnel**. La migration V5 ne cree desormais que
l'extension `unaccent` ; `PersonneRepository.rechercheApprochee` appelle `unaccent(lower(...))`
directement dans la requete (usage standard et documente de cette extension, sans aucun probleme
de resolution de type puisqu'il n'y a plus d'inlining dans un index a gerer). Cout assume : cette
comparaison ne beneficie pas d'un index dedie (sequential scan sur l'expression), la recherche
restant principalement guidee par `similarity()` sur la colonne brute qui, elle, utilise bien
l'index GIN trigram existant. Proportionne pour les volumes d'un projet academique (section 16) ;
a revisiter avec un index fonctionnel si le volume de personnes croit significativement, en le
testant cette fois directement sur l'instance PostgreSQL cible avant de le livrer.

## Correctif suite a un test reel du demarrage backend (retour utilisateur)

`mvn spring-boot:run` execute reellement par l'utilisateur (Java 17, environnement complet) a
revele ce que la sandbox de developpement ne pouvait pas detecter (pas d'acces a une instance
PostgreSQL reelle) : la migration `V5__recherche_insensible_accents.sql` echouait au demarrage
avec `la fonction unaccent(unknown, text) n'existe pas`. Cause : la fonction wrapper
`civilis_unaccent_lower` appelait la forme a deux arguments `unaccent('unaccent', texte)` — le
litteral `'unaccent'` n'est pas automatiquement reconnu comme `regdictionary` dans le contexte
d'inlining d'une fonction SQL utilisee dans un index fonctionnel. Corrige en utilisant la forme a
un seul argument `unaccent(texte)` (utilise en interne le dictionnaire par defaut, aucune
resolution de type necessaire cote appelant) — plus simple et plus robuste, sans rien perdre du
comportement recherche. Flyway ayant execute la migration dans une transaction, l'echec precedent
a ete integralement annule (aucune ligne "dirty" dans `flyway_schema_history`) : aucune action de
reparation manuelle n'est necessaire, un simple redemarrage rejoue V5 proprement.

A noter positivement : `npm run build` execute par l'utilisateur (acces reseau complet, hors de
cette sandbox) a reussi du premier coup (2233 modules, bundle 773 kB, 57s) — l'incertitude
documentee plus haut sur le bundle de production est donc levee.

## Audit final Palier 1 avant ouverture du Palier 2 (demande explicite)

Demande : verifier que toutes les attentes du Palier 1 (section 6 et section 11 du Prompt Maitre)
sont bien respectees et terminees avant de passer au Palier 2. Contrairement aux audits precedents
(qui relisaient surtout le code deja modifie dans le lot en cours), celui-ci relit systematiquement
CHAQUE regle RG-xxx du catalogue (section 6) contre le code reellement present, avec citation de
fichier/ligne, plutot que de faire confiance aux conclusions des audits anterieurs.

### Deux ecarts reels, jamais detectes par les 2 audits precedents, corriges dans ce lot

- **RG-TDB-001 (grave)** : le Prompt Maitre exige "indicateurs du tableau de bord strictement
  filtres selon le perimetre de l'utilisateur connecte". `TableauBordController.obtenir()`
  n'acceptait aucun contexte utilisateur et `TableauBordService` renvoyait des compteurs 100%
  globaux (toutes fiches, tous centres, tous registres) a **n'importe quel agent**, quel que soit
  son centre d'affectation — le code portait meme un commentaire assumant explicitement ce choix
  ("Palier 1 : vue globale pour la demonstration"), ce qui n'est pourtant écrit nulle part comme
  exception autorisee dans le Prompt Maitre : la regle est classee "existante", sans reserve.
  Corrige : `TableauBordController` derive desormais l'utilisateur connecte du JWT (meme pattern
  que RG-IDX-013/registres) et `TableauBordService.obtenirTableauBord(utilisateurId, typeCompte)`
  restreint tous les compteurs, la repartition par type d'acte, la charge par centre et
  l'evolution mensuelle aux centres affectes (`utilisateur_centre`, RG-UTI-001) lorsque l'appelant
  est un AGENT — et renvoie un tableau de bord a zero (pas la vue globale par defaut) si cet agent
  n'a aucun centre affecte. ADMINISTRATEUR et SUPER_ADMIN conservent la vue globale : ces types de
  compte n'ont pas de notion de centre affecte dans le schema, leur perimetre est donc le systeme
  entier (coherent avec le court-circuit RG-ADM-002 deja applique au RBAC). Nouvelles requetes
  `*ParCentres` ajoutees dans `TableauBordRepository` (additif, les requetes globales existantes
  ne sont pas retirees, seulement reservees aux comptes non-AGENT).
- **RG-PER-003 / RG-REC-007 (moyen)** : la recherche de personnes (`PersonneRepository.rechercheApprochee`,
  utilisee par la fusion de doublons ET par `GET /api/recherche`) reposait sur `similarity()` et
  `ILIKE` appliques directement aux colonnes brutes `nom`/`prenoms`, sans aucune neutralisation des
  accents au niveau SQL — seule `RechercheService.normalise()` compensait partiellement, cote Java,
  et uniquement pour decider si une correspondance deja trouvee est "exacte" ou "approchee", jamais
  pour la recherche elle-meme. Consequence concrete : une fiche saisie "Kôdjô" pouvait ne jamais
  remonter du tout pour une recherche "Kodjo", la similarite trigram entre les deux chaines brutes
  etant trop faible — violant RG-REC-006 (jamais d'echec sec) autant que RG-REC-007. Corrige par la
  migration `V5__recherche_insensible_accents.sql` (additive) : extension `unaccent`, fonction
  wrapper `civilis_unaccent_lower()` (IMMUTABLE, necessaire pour indexer), deux nouveaux index GIN
  trigram sur la forme normalisee, et la requete native de `rechercheApprochee` compare desormais
  `civilis_unaccent_lower(colonne)` a `civilis_unaccent_lower(parametre)` des deux cotes. **Limite
  assumee et documentee dans la migration elle-meme** (pas cachee) : `unaccent()` neutralise les
  diacritiques latins standards (é/è/ê/à/ô/ù/ç...) mais ne translitere pas les caracteres propres
  aux orthographes des langues togolaises (ɖ, ɣ, ŋ, ɔ, ɛ...), qui ne sont pas des lettres latines
  accentuees mais des caracteres distincts — une table de translitteration dediee necessiterait une
  validation avec des locuteurs/donnees reels, exactement ce que RG-PER-003 demande explicitement
  ("a tester explicitement avec des cas reels avant mise en production"). Non resolu ce tour-ci par
  choix assume, pas par oubli.

### Verifie conforme par lecture directe du code (pas par confiance aux audits precedents)

Chaque regle du catalogue section 6 a ete recherchee et confirmee presente dans le code source
(fichier + ligne cites en session) : RG-JUR-001, RG-AUTH-001/002/003, RG-UTI-001/002/003/005/009,
RG-ADM-001/002/003, RG-RBAC-001/002, RG-REF-001/002, RG-REG-006/009/010, RG-PER-001/002,
RG-IDX-002/004/008/011/012, RG-REC-005/006, RG-LOC-001, RG-RAP-001, RG-AUD-001/002, RG-PAR-001/002.
RG-FO-001 (Palier 3) et RG-NUM-001/002 (Palier 2) sont correctement NON implementes — aucun package
`frontoffice` ni `numerisation` n'existe cote backend, aucun ecran correspondant cote frontend,
conformement a l'ordre impose (section 13) et au blocage explicite de Palier 3.

Nuance mineure relevee (non bloquante) : RG-AUD-002 dit que le journal est alimente "via un aspect
transversal (Spring AOP), jamais par appel manuel disperse dans chaque service" ; `AuditAspect`
couvre bien les 3 actions critiques par AOP (creerFiche, deplacer registre, fusionner personnes),
mais `ParametrageService` appelle `journalActiviteService` directement (manuellement) pour la
sauvegarde planifiee et la restauration — lecture retenue : ces evenements systeme/RG-PAR-001/002
ne correspondent pas au pattern "action metier critique" vise par l'aspect, l'appel direct y est
plus lisible qu'un pointcut sur une methode `@Scheduled`. A rediscuter si une revue future juge
cette tolerance insuffisante.

### Ecarts structurels deja connus, non ouverts par ce tour, toujours reels

Ces points figurent dans les audits precedents et restent effectivement non resolus — confirmes a
nouveau dans cette session (Java 11 sans Maven disponible dans cet environnement, `tsc --noEmit`
executes avec succes, `npm run build`/`vite build` se bloquent ou sont tues avant la fin dans cet
environnement de build restreint, sans que la cause soit imputable au code) :

- **Aucun test automatise** (0 fichier sous `backend/src/test`, 0 fichier `*.test.*`/`*.spec.*`
  cote frontend) — contrevient directement a la Definition of Done (section 15 : "chaque regle de
  gestion RG-xxx concernee par le domaine est couverte par au moins un test nomme explicitement")
  et a la Phase 15 ("Tests globaux + securite"). C'est l'ecart le plus serieux du Palier 1 au sens
  strict du Prompt Maitre — la verification faite jusqu'ici (relecture manuelle, equilibrage
  accolades/parentheses, `tsc --noEmit`) est une compensation, pas un remplacement.
  `mvn compile` n'a jamais pu etre verifie avec succes dans un environnement de build de cette
  serie de sessions (Java 11 present, pas Java 17 requis par Spring Boot 3.3.4 ; pas de Maven
  installe ni d'acces reseau vers Maven Central).
- `npm run build` (bundle Rollup/esbuild complet) ne s'est jamais termine dans le temps/les
  ressources de cet environnement de sandbox precis, y compris re-teste dans cette session
  (processus tue avant completion) ; `tsc --noEmit` reste la seule verification de type disponible
  ici et est passee sans erreur.
- Export PDF/XLSX des rapports toujours indisponible (Apache POI/iText non telechargeables hors
  ligne dans cet environnement) — CSV pleinement fonctionnel en attendant.
- Migration complete vers des DTO explicites (au lieu d'entites JPA directement serialisees via
  `open-in-view`) toujours a terminer par endroits.

### Conclusion de cet audit

Perimetre fonctionnel du Palier 1 (section 6 + section 11 du Prompt Maitre) : **conforme**, les 2
ecarts reels trouves ont ete corriges dans ce meme lot (voir ci-dessus), verifies par relecture
(accolades/parentheses equilibrees, `tsc --noEmit` sans erreur). Le seul point qui empeche une
declaration de conformite totale et inconditionnelle est l'absence de suite de tests automatises
et l'impossibilite de cet environnement de sandbox a executer `mvn compile`/`npm run build` de bout
en bout — ce sont des limites d'infrastructure de la session de developpement, documentees depuis
plusieurs lots, pas des trous fonctionnels dans le code lui-meme. A rejouer par l'utilisateur avec
un acces reseau normal avant mise en production reelle (voir section "Recommandation avant mise en
service reelle" plus bas, deja existante).

## Innovation et creativite visuelle : Tableau de bord, Recherche, Indexation, Personnes, Registres, Parametrage

Demande explicite : plus d'innovation/creativite et de soin visuel sur ces six ecrans. Chaque
page recoit un ajout distinct plutot qu'un simple recolorage generique :

- **Tableau de bord** : en-tete transforme en briefing (salutation dynamique selon l'heure +
  date du jour), un "pouls de l'activite" (mini graphique en aire dégradee au-dessus des KPI,
  reprenant l'evolution mensuelle deja chargee) et un grand icone en filigrane derriere chaque
  carte KPI.
- **Recherche** : barre de recherche transformee en hero (champs larges, icone integree),
  carte de conseils affichee avant toute recherche (astuces RG-REC-006/007/PER-003), resume
  chiffre des resultats (exacts vs approches) et un bouton "copier la localisation" (presse-papiers)
  sur chaque resultat — utilite concrete pour un agent qui doit se deplacer vers le rayonnage.
  Le doublon de bouton "Rechercher" (un dans le hero, un en bas du formulaire) a ete supprime au
  passage.
- **Indexation** : disposition en deux colonnes avec un panneau "Apercu de la fiche" vivant a
  cote du formulaire — checklist qui se coche en temps reel (registre, type d'acte, numero, page,
  date, personnes) et recapitulatif des personnes deja saisies, pour visualiser l'etat de la
  fiche avant validation. Animation echelonnee ajoutee sur les lignes du tableau des fiches deja
  indexees (elle existait deja ailleurs dans l'appli mais pas ici).
- **Personnes** : les liens de parente ne sont plus une liste plate de badges mais regroupes par
  type de lien (Pere/Mere/Conjoint/Enfant) avec icone dediee par groupe. La carte de fusion de
  doublons affiche desormais un avatar a initiales pour la personne source et la personne cible,
  coherent avec le style introduit sur Agents & utilisateurs.
- **Registres** : la jauge lineaire de couverture de recensement est remplacee par un anneau de
  progression circulaire (conic-gradient CSS, sans dependance supplementaire), plus lisible et
  plus proche des tableaux de bord modernes.
- **Parametrage** : nouvelle carte "Etat du systeme" en tete de page (derniere sauvegarde
  reussie, taille, nombre total, nombre d'echecs, badge sain/alerte). Les parametres sont
  desormais groupes par categorie (`Parametre.categorie`, colonne deja presente en base et dans
  le type frontend mais jamais exploitee jusqu'ici — pas une nouvelle donnee, un affichage enfin
  branche dessus). Le bouton de restauration (action irreversible, reservee Super Admin) recoit
  un style "danger" explicite plutot qu'un simple bouton secondaire neutre.

Toutes les additions reutilisent les tokens de la refonte SaaS precedente (ombres, rayons,
transitions) ; aucune ne touche a l'overflow d'un ancetre de `.civilis-sidebar`.

## Refonte de l'ecran "Agents & utilisateurs" (demande explicite : style + creativite)

L'ancien ecran etait un simple tableau plat (une ligne par compte, colonnes role/centres/statut/
actions) avec un bouton "Reinitialiser le mot de passe" present mais **volontairement desactive**
(`disabled`, aucune logique derriere) alors que l'endpoint `POST /api/agents/{id}/reset-password`
existe et fonctionne depuis un lot precedent — fonctionnalite factice corrigee au passage.

Reconstruit en panneau maitre-detail (pattern SaaS moderne : liste filtrable a gauche, detail
complet a droite), avec :
- une rangee de statistiques (total, actifs, verrouilles, desactives) ;
- une liste recherchable et filtrable (type de compte, statut), avatars a initiales degrades ;
- un panneau de detail par compte selectionne : actions (deverrouiller, activer/desactiver,
  reinitialiser le mot de passe — desormais un vrai formulaire qui appelle l'API), role, centres
  affectes (RG-UTI-001), et **l'historique de connexion (RG-UTI-003)** qui n'avait jusque-la
  aucune interface bien qu'expose par le backend (`GET /api/agents/{id}/historique-connexion`) —
  liste chronologique avec distinction visuelle connexion reussie / tentative echouee.
- CSS dedie (stats miniatures, cartes de liste cliquables avec etat actif, avatars a degrade,
  historique de type "timeline" avec bordure de couleur par statut), coherent avec les tokens de
  la refonte SaaS precedente (ombres, rayons, transitions).

## Audit exhaustif Palier 1 vs Prompt Maitre + refonte visuelle "SaaS haut de gamme" (3e passage)

Demande explicite : verifier que toutes les attentes du Palier 1 (section 6 et section 11 du
Prompt Maitre) sont bien respectees et terminees, corriger tout ecart trouve, et elever le visuel
au niveau d'un SaaS institutionnel haut de gamme (inspiration cabinets de conseil internationaux
et sites d'Etat).

### Ecarts reels trouves et corriges

- **Faille de securite (meme famille que RG-IDX-013)** : `POST /api/registres/{id}/deplacer`
  acceptait un `auteurId` fourni par le client dans le corps de la requete, permettant a un agent
  authentifie d'attribuer a tort un deplacement de registre a un autre utilisateur. Corrige :
  l'auteur est desormais toujours derive du token JWT authentifie (`SecurityContextHolder`),
  exactement comme pour l'indexation. `DeplacerRegistreRequest` ne porte plus que
  `nouveauRayonnageId`.
- **Ecran "Registres physiques" quasi vide** : le backend exposait deja la creation, le
  deplacement et le calcul de couverture de recensement (section 11.6), mais l'ecran frontend
  n'etait qu'un tableau en lecture seule (numero/annee/pages/statut), sans filtre, sans
  formulaire de creation, sans action de deplacement et sans acces a l'historique ou a la
  couverture — alors que la section 11.6 prevoit explicitement `ListeRegistres` (filtrable
  centre/annee/statut) et `DetailRegistre` (jauge de couverture) en plus de `DeplacerRegistre`.
  Reconstruit entierement : filtres centre/annee/statut, formulaire de creation, action
  "deplacer" avec confirmation explicite obligatoire (RG-REG-006), changement de statut du cycle
  de vie (EN_SERVICE/ARCHIVE/RETIRE — nouvel endpoint `PATCH /api/registres/{id}/statut`, aucune
  suppression physique n'est jamais exposee, dans le meme esprit que RG-REF-001), et un panneau
  de detail depliable montrant la jauge de couverture de recensement et l'historique complet des
  deplacements. Les endpoints de lecture (`GET /api/registres`, `GET /api/registres/{id}`)
  renvoient desormais un DTO de vue (`RegistreVueDTO`) portant la chaine de localisation complete
  aplati (commune/centre/salle/rayonnage/type d'acte — RG-LOC-001) plutot que le graphe d'entites
  JPA brut, plus sur et plus simple a consommer.
- **Ecran "FusionDoublons" totalement absent** : le backend exposait deja
  `POST /api/personnes/fusionner` (RG-PER-002), mais aucun ecran ne l'appelait — le texte de la
  page Personnes affirmait a tort que "la fusion de doublons se fait depuis le module de
  recherche", ce qui etait faux (aucune trace de `fusionner` dans tout le frontend). Construit :
  vue cote-a-cote (section 11.7) avec recherche independante de la personne source et de la
  personne cible, apercu des deux fiches, case de confirmation explicite et appel reel a
  l'endpoint existant.
- **`PATCH /api/roles/{id}` manquant** : la section 11.4 prevoit "GET/POST/PATCH /api/roles" ;
  seuls GET et POST existaient, aucune voie pour renommer un role deja cree. Ajoute
  (`RbacService.modifierRole`, edition en ligne dans l'ecran Roles & permissions).

### Verifie conforme, sans modification necessaire

- RG-AUTH-001/RG-UTI-009/RG-UTI-003 (AuthService) : compte VERROUILLE/INACTIF -> 403 generique
  sans divulgation, verrouillage automatique + journalisation systematique de chaque tentative.
- RG-IDX-004/008/012 (IndexationService) : transaction unique, contrainte d'unicite capturee
  proprement, personne associee obligatoire des la validation Bean Validation.
- RG-REF-002 (ReferentielsService.desactiverCentre) : blocage effectif si utilisateurs actifs ou
  registres en service rattaches.
- L'absence de `PATCH .../desactiver` pour `commune`, `salle_archive` et `rayonnage` n'est **pas**
  un ecart : `schema_etat_civil.sql` (source de verite, jamais modifiee sans signalement explicite)
  ne porte tout simplement aucune colonne de statut sur ces trois tables — seuls
  `centre_etat_civil.statut` et `type_acte.actif` existent. RG-REF-001 ne peut donc s'appliquer
  qu'aux entites qui en ont techniquement les moyens.

### Refonte visuelle "SaaS institutionnel haut de gamme"

Le design existant (identite togolaise, ruban tricolore, notifications, KPI animes) etait deja
solide ; plutot que de le remplacer, un bloc CSS additif a ete place en fin de `styles.css`
(regle de non-destruction : la cascade permet d'affiner sans rien supprimer plus haut) pour
l'elever au niveau attendu par un cabinet de conseil international ou une grande plateforme
SaaS : echelle de gris etendue, rayons de bordure harmonises, ombres douces multi-couches
(inspiration Stripe/Linear), fond de page avec relief radial tres subtil, topbar en verre depoli
(glassmorphism sobre), navigation laterale avec halo d'icone et pilule active lumineuse, boutons
avec micro-interaction de pression, tableaux avec en-tete sticky et lignes plus respirees, cartes
KPI avec icone dans un halo circulaire colore. Aucune propriete `overflow` n'a ete touchee sur un
ancetre de `.civilis-sidebar` (cause de la regression precedente) : uniquement des raffinements
de surface, ombre, rayon et typographie.

### Corrige en cours de verification (avant commit)

Une incoherence de nommage entre le DTO backend `CouvertureRecensementDTO` (champs
`nbFichesIndexees`/`tauxCouverturePourcent`) et le type frontend nouvellement ajoute (qui
utilisait par erreur `fichesIndexees`/`tauxCouverture`) a ete detectee par relecture manuelle
avant commit et corrigee des deux cotes (type TypeScript + utilisation dans `RegistresPage.tsx`)
avant tout commit — aucune version fautive n'a ete poussee.

## Regression sidebar + fonctionnalite d'affiliation absente (retour utilisateur, 2e passage)

### Regression introduite par le lot precedent : menu de gauche non fige

Le filet de securite anti-debordement du lot precedent (`overflow-x: clip` pose
sur `html, body, #root, .civilis-app, .civilis-shell`) a casse le
`position: sticky` de `.civilis-sidebar` : poser une valeur d'overflow autre que
`visible` sur un ANCETRE d'un element sticky annule son ancrage. Le menu de
gauche defilait donc avec le reste de la page. Une seconde cause, preexistante
celle-la (round "wow" anterieur), aggravait le probleme : une regle plus bas
dans le fichier (`.civilis-sidebar { position: relative; }`, ajoutee pour le
ruban tricolore) ecrasait le `position: sticky` d'origine, meme sans le filet
de securite. Corrige des deux cotes : le filet ne porte plus que sur
`.civilis-corps` (le frere du sidebar dans `.civilis-shell`, pas un ancetre),
et la regle `position: relative` superflue a ete supprimee (sticky sert deja
de contexte de positionnement pour le `::before` du ruban).

### Fonctionnalite "affiliation" prevue depuis l'origine mais jamais implementee

Retour utilisateur : "je ne vois pas la partie qui parle de l'affiliation
ainsi la recherche par affiliation". Verification faite : c'est fonde. Le
prompt maitre (section 11.7 et 11.9) prevoit explicitement un "support de la
recherche par affiliation" et un parametre `roleAffiliation` sur
`GET /api/recherche`. Le schema V1 contient meme deja la table
`lien_parente` (personne_id, personne_apparentee_id, type_lien, mode_creation)
— mais aucune entite JPA, aucun repository, aucun service, aucun controleur,
aucun ecran n'avait jamais ete construit dessus. Corrige :

- Backend : entite `LienParente` + `LienParenteRepository` + `LienParenteService`
  (`GET /api/personnes/{id}/liens`, `POST /api/personnes/liens`).
- Deduction automatique : `IndexationService.creerFiche` appelle desormais
  `LienParenteService.deriverDepuisFiche(...)` juste apres l'enregistrement
  des associations — quand une fiche porte les roles TITULAIRE + PERE et/ou
  TITULAIRE + MERE (typiquement un acte de naissance), les liens de filiation
  reciproques (PERE/MERE <-> ENFANT) sont crees automatiquement
  (`mode_creation = DEDUIT`), sans double creation si deja existants.
- `GET /api/recherche` accepte desormais `roleAffiliation` (ex. ne retrouver
  le nom saisi que lorsqu'il apparait comme PERE d'un acte, pas dans n'importe
  quel role) — parametre prevu des l'origine, ajoute a `RechercheController`,
  `RechercheRequest` et filtre dans `RechercheService`.
- Frontend : filtre "Affiliation (role sur l'acte)" dans les filtres avances
  de Recherche ; nouvelle section "Affiliations (filiation)" sur la page
  Personnes (recherche d'une personne, affichage de ses liens de parente,
  ajout manuel d'un lien avec recherche de la personne apparentee).

## Correctifs suite a un test reel en conditions de production (retour utilisateur)

Ce lot fait suite a un test reel de l'application (backend + frontend + base
Postgres locale de l'utilisateur, pas seulement une revue de code). Le test a
mis en evidence un bug critique invisible jusque-la.

### Bug critique corrige : 500 sur plusieurs listes (Registres, Referentiels)

Constate en direct via le navigateur : `GET /api/registres`,
`/api/referentiels/centres`, `/salles`, `/rayonnages` renvoyaient tous une
erreur 500, silencieusement transformee par le frontend en un ecran "Aucun
... enregistre" (aucun `.catch()` sur ces appels). Cause racine identifiee :
ces controleurs renvoient directement des entites JPA portant des
associations `@ManyToOne(LAZY)` (ex. `RegistrePhysique.centre`,
`CentreEtatCivil.commune`) sans le module Jackson qui sait serialiser un
proxy Hibernate non initialise (`jackson-datatype-hibernate6`, absent du
projet) -> `InvalidDefinitionException` a chaque fois qu'un enregistrement
avait une relation non explicitement chargee.

Aggravant : `GlobalExceptionHandler.handleGeneric()` ne journalisait rien du
tout -> ces 500 etaient totalement invisibles, meme en console serveur.

Corrige :
- Ajout de `jackson-datatype-hibernate6` (pom.xml) + `JacksonConfig` enregistrant
  le module avec `FORCE_LAZY_LOADING` (coherent avec `open-in-view=true` deja
  actif : la session reste ouverte, donc charger l'association a la volee est
  sans risque et evite des champs manquants a l'affichage).
- `GlobalExceptionHandler.handleGeneric()` journalise desormais la cause
  complete (`log.error(..., ex)`) — message generique conserve cote client
  (aucune stacktrace exposee), mais diagnostic possible cote serveur.
- Correctif transitoire en attendant la migration complete vers des DTO
  explicites pour chaque reponse (deja amorcee : RegistreDTO, NotificationDTO).

### Absence generalisee de gestion d'erreur cote frontend

9 pages faisaient `apiClient.get(...).then(...).finally(...)` sans jamais de
`.catch()` (Rapports, Journal, Referentiels, Utilisateurs, Roles&Permissions,
Registres, Parametrage, Administration, Indexation) : toute erreur reseau ou
serveur produisait un ecran silencieusement vide plutot qu'un message.

Corrige par un bus de toasts centralise (`lib/toast.ts` + `components/ToastHost.tsx`) :
l'intercepteur de reponse de `apiClient` (deja utilise pour le rafraichissement
de token) emet desormais un toast d'erreur des qu'une requete echoue (sauf
`/auth/login`, `/auth/refresh` et `/notifications`, geres separement pour ne
pas etre redondants ou intrusifs). Chaque page conserve en plus un `.catch(() => {})`
local pour eviter les promesses rejetees non gerees. Registres beneficie en
plus d'un etat d'erreur distinct de l'etat vide (message + icone plutot qu'un
texte gris ambigu).

### Debordement horizontal (retour utilisateur : "le design est vilain, surtout le debordement")

`.civilis-carte` n'avait aucune gestion d'overflow : un tableau large (ex.
Agents & utilisateurs : Identifiant/Type/Role/Centres/Statut/Actions) forcait
la carte puis toute la page a deborder horizontalement au lieu de faire
defiler uniquement la zone du tableau. Corrige : `overflow-x: auto` sur
`.civilis-carte`, `word-break` sur les cellules, et un filet de securite
global (`overflow-x: clip` sur le document) pour qu'aucune scrollbar
horizontale de page n'apparaisse plus jamais, quel que soit le contenu.

### A faire cote utilisateur

Ces correctifs backend necessitent un redemarrage du serveur Spring Boot
(`mvn spring-boot:run`) pour prendre effet — la recompilation ne se fait pas
a chaud sans plugin de reload actif sur ce projet.

## Prompt Maitre V3 (Strategic Government-Grade Edition) — audit Palier 1

Le Prompt Maitre V3 redefinit CIVILIS avec un perimetre tres large (70 sections). Sa propre
section 1 impose de distinguer V1 (indispensable), V1+ (forte valeur, optionnel), Palier 2 et
Palier 3, et d'eviter la sur-ingenierie. Sa section 50 fixe la liste exacte du "Palier 1 — CIVILIS
CORE" : authentification, utilisateurs, RBAC, centres, registres, archives, personnes, indexation,
recherche, localisation, tableau de bord, rapports, audit, notifications, sauvegarde, parametres.

### Etat du Palier 1 CORE face a cette liste

- authentification, utilisateurs, RBAC, centres, registres, personnes, indexation, recherche,
  localisation, tableau de bord, rapports, audit, sauvegarde, parametres : **deja livres** dans
  les iterations precedentes (voir sections ci-dessous).
- **notifications** : seul point reellement absent de la liste V1 core. Corrige dans cette
  livraison : table `notification_interne` (V4, distincte de la table `notification` de V1 qui
  concerne exclusivement les demandeurs citoyens du Palier 3), `NotificationInterneService`,
  cloche avec compteur non lu dans la topbar, trois niveaux (INFORMATION/ATTENTION/CRITIQUE,
  section 20), avec deux declencheurs reels branches sur des evenements existants : compte
  verrouille apres echecs (RG-UTI-009) et echec de sauvegarde pg_dump (RG-PAR-002). Chaque
  notification porte un lien de contexte -> action (section 46), pas de polling continu (coherent
  avec le monolithe modulaire vise section 53).
- "archives" en tant que concept distinct des registres n'est pas une entite technique separee
  dans le modele actuel : les tables `salle_archive`/`rayonnage`/`centre_etat_civil` couvrent deja
  la hierarchie physique (section 7, Archive Digital Twin). La visualisation dediee (cartographie
  colorée, section 17) reste un item V1+ (voir plus bas), pas V1 core au sens strict de la liste.

### Elements V1+ du Prompt V3 (forte valeur, explicitement optionnels) — non traites ce tour-ci

Classes ainsi par le prompt lui-meme (section 51) : recherche tolerante (deja partiellement
couverte par `pg_trgm`), detection des doublons (fusion manuelle deja possible, moteur de
detection automatique absent), Archive Health Score, Data Quality Center, Archive Digital Twin
(visualisation), guide de localisation pas-a-pas, analyse des recherches sans resultat, Command
Center. Aucun n'est requis pour declarer le Palier 1 core complet ; ils sont conserves comme
recommandations priorisees pour un prochain lot, conformement a la regle anti-sur-ingenierie de
la section 1 du prompt lui-meme.

### Renforcement UX/UI (sections 28-34) appliqué sans casser l'existant

- Page de connexion alignee sur le gabarit de la section 34 : case "Afficher le mot de passe",
  pied "Systeme securise · Version 1.x" + date du jour, formulation exacte de la sous-devise.
- Le ruban tricolore et les animations ajoutes lors de la refonte precedente sont conserves (la
  consigne explicite de l'utilisateur etait de renforcer "sans casser ce qui est la") ; ils
  respectent deja les durees courtes recommandees section 31 (150-320ms), pas d'effet "gaming".

## Corrige dans cette livraison (Palier 1 — completion demandee explicitement)

- **RG-UTI-001 — affectation multi-centre** : entite/repo `UtilisateurCentre` (cle composite,
  additive : un agent peut cumuler plusieurs centres), endpoints `POST/DELETE/GET
  /api/agents/{id}/centres`, chips + selecteur dans l'ecran Agents.
- **`PATCH /api/indexation/fiches/{id}`** : modification du numero d'acte, de la page, du type
  d'acte et de la date d'evenement d'une fiche deja indexee (le registre et l'agent createur
  restent non modifiables ici par design — un changement de registre passe par le deplacement
  trace du module Registres, l'agent createur est une donnee de tracabilite RG-IDX-013).
- **RG-IDX-011 — recensement en serie** : bascule explicite dans l'ecran Indexation qui conserve
  le registre et le type d'acte entre deux fiches, focus automatique sur le numero d'acte apres
  chaque enregistrement, compteur de fiches saisies dans la session, et tableau des fiches deja
  indexees dans le registre courant (avec edition en ligne via le PATCH ci-dessus).
- **RG-RAP-001 — module Rapports** : construit de zero (`Rapport`, `RapportRepository`,
  `RapportService`, `RapportController`, ecran `RapportsPage`). Trois types geres
  (`FICHES_PAR_CENTRE`, `FICHES_PAR_AGENT`, `REPARTITION_TYPE_ACTE`) sur une plage de dates. Chaque
  rapport genere est fige : la colonne JSONB `criteres` porte a la fois les criteres de filtrage et
  le resultat calcule au moment T (stocke via `@JdbcTypeCode(SqlTypes.JSON)`, natif Hibernate 6,
  aucune dependance supplementaire) — consulter un rapport plus tard n'entraine jamais un
  recalcul. Export CSV fonctionnel. Export PDF/XLSX explicitement refuse (400) avec message clair :
  ces formats necessitent des bibliotheques (Apache POI, iText...) que cet environnement de build
  ne pouvait pas telecharger (Maven Central inaccessible hors ligne dans ce sandbox) ; a ajouter
  des qu'un environnement avec acces reseau complet est disponible.
- **RG-PAR-001 — restauration reelle** : `pg_dump`/`pg_restore` executes en sous-processus
  (format custom `-Fc`), remplacant l'ancienne implementation qui n'ecrivait ni ne lisait jamais
  de vrai fichier. La sauvegarde manuelle produit desormais un fichier reel avec taille exacte ;
  la restauration exige une phrase de confirmation exacte (`RESTAURER LA BASE DE DONNEES`),
  verifiee cote serveur (pas seulement cosmetique cote client), reste strictement reservee au
  role SUPER_ADMIN, et l'action est journalisee avec l'identite reelle de l'auteur. Necessite que
  les binaires `pg_dump`/`pg_restore` de PostgreSQL soient presents sur le PATH du serveur qui
  execute le backend (hypothese standard, a verifier en production).
- **RG-UTI-005 — politique de mot de passe** : minimum 8 caracteres + une lettre + un chiffre,
  appliquee via `@Pattern` sur les trois points d'entree (creation agent, creation administrateur,
  reinitialisation de mot de passe).
- **RG-ADM-001 — bootstrap SUPER_ADMIN** : compte cree via `V3__bootstrap_super_admin.sql`
  (migration Flyway, donc strictement hors API), identifiants transmis separement.
- **Affectation de role a un agent** : `UtilisateurRole`/`UtilisateurRoleRepository`,
  `POST/GET /api/agents/{id}/roles`, selecteur dans l'ecran Agents.
- **Correctif de securite** : `Utilisateur.motDePasseHash` n'avait aucun `@JsonIgnore` — le hash
  BCrypt du mot de passe de chaque agent/administrateur/super admin fuitait dans toute reponse
  JSON exposant un objet `Utilisateur` (liste des agents, fiche d'indexation via `agent`, rapport
  via `utilisateur`...). Corrige d'un seul endroit (l'entite), benefice immediat partout.
- **Correctif de securite (RG-IDX-013)** : `agentId` etait un champ fourni par le client dans
  `POST /api/indexation/fiches`, ce qui permettait a un agent authentifie d'indexer une fiche sous
  l'identite d'un collegue. L'auteur est desormais toujours derive du token JWT authentifie
  (`SecurityContextHolder`), jamais d'une valeur envoyee par le navigateur.
- **Correctif structurel** : `UtilisateurRole` (cree lors du lot precedent) declarait une colonne
  `id` auto-generee qui n'existe pas dans la table reelle (`utilisateur_role` a une cle composite
  `(utilisateur_id, role_id)`, sans surrogate id) — ce qui aurait fait planter Hibernate au
  demarrage ou lors du moindre insert. Corrige via `@IdClass` (meme pattern applique a la nouvelle
  entite `UtilisateurCentre`, qui a la meme forme de table).
- **Correctif critique (portee large)** : `spring.jpa.open-in-view` etait a `false` alors que
  plusieurs controleurs (registres, indexation, rapports...) renvoient directement des entites
  JPA portant des associations `@ManyToOne(LAZY)` jamais explicitement chargees. Une fois la
  transaction fermee, Jackson aurait leve une `LazyInitializationException` des que ces listes
  contenaient des lignes reelles (probleme latent qui touchait potentiellement `GET /api/registres`
  et d'autres listes deja existantes, pas seulement le code ajoute ici). Corrige en reactivant
  `open-in-view` (compromis documente dans `application.yml`) et, en complement, en initialisant
  explicitement les associations critiques dans les nouveaux services (`Hibernate.initialize`).
  Un remede plus propre (DTO partout, aucune entite JPA exposee directement) reste souhaitable a
  terme mais depasse le cadre de ce lot.
- **Verification de types complete (`tsc --noEmit`)** : executee avec succes cette fois
  (contrainte de temps d'infrastructure levee), aucune erreur de type sur l'ensemble du frontend.
  Un `npm run build` complet (bundling Rollup/esbuild) n'a en revanche pas pu etre mene a son terme
  dans le temps imparti par cet environnement de build precis ; a rejouer par l'utilisateur avant
  mise en service pour lever tout doute residuel sur le bundle final.

## Corrige dans l'iteration precedente

- **RBAC reellement dynamique (RG-RBAC-002, RG-AUTH-003)** : les autorisations ne reposent plus
  uniquement sur `type_compte`. A la connexion, les permissions du/des role(s) affectes a
  l'utilisateur (`utilisateur_role` -> `role_permission` -> `permission`) sont resolues et
  embarquees dans le JWT (claim `perms`). Chaque controleur verifie desormais
  `hasAuthority('CODE_PERMISSION')` (ex. `REFERENTIEL_GERER`, `INDEXATION_CREER`,
  `PILOTAGE_CONSULTER`...) plutot qu'un role fige. Le Super Administrateur continue de
  court-circuiter cette evaluation (RG-ADM-002) : il recoit systematiquement tous les codes de
  permission existants.
- **RG-UTI-003** : chaque tentative de connexion (succes, echec, compte indisponible) est
  desormais journalisee dans `historique_connexion`.
- **Endpoint `POST /api/auth/refresh`** : le refresh token emis au login est desormais
  effectivement consomme ; le frontend rejoue automatiquement une requete 401 apres rafraichissement
  silencieux du token (voir `api/client.ts`).
- **RG-REC-005** : les filtres `typeActe`, `dateDebut`, `dateFin` de la recherche sont maintenant
  reellement appliques (ils etaient acceptes par l'API mais ignores).
- **Filtre par date sur `GET /api/journal`** (`dateDebut`/`dateFin`), prevu au §11.13.
- **`POST /api/admins`** : creation d'un compte Administrateur, qui manquait completement.
- **CRUD Referentiels** : ajout des `PATCH` manquants sur `commune`, `salle_archive`, `rayonnage`
  (seuls `centre` et `type_acte` avaient une voie de modification).
- **Correctif critique** : `TableauBordRepository` heritait de `Repository<Object, Long>`,
  provoquant un echec de demarrage total de l'application (Hibernate : "Not a managed type").
- **Correctif critique** : commentaire Javadoc mal forme dans `AuditAspect.java` (sequence `*/`
  prematuree) empechant toute compilation.
- **Frontend** : correction d'un vrai bug (`SalleDTO`/`RayonnageDTO` referencaient des champs
  `nom`/`code` inexistants, la vraie propriete etant `designation` — les tableaux Referentiels
  affichaient des cases vides). Navigation laterale desormais filtree selon les permissions reelles
  de l'utilisateur connecte. Ecran Super Administration ajoute (creation/suspension/revocation de
  comptes Administrateur). Sidebar responsive (tiroir mobile sous 900px), transitions de page,
  emblem institutionnel sur l'ecran de connexion, etats de focus accessibles.
- **Affectation de role a un agent** : il etait possible de creer des roles et d'editer leurs
  permissions, mais aucune voie n'existait pour rattacher un role a un agent precis (la table
  `utilisateur_role` n'avait ni entite JPA ni endpoint). Ajout de `UtilisateurRole`/
  `UtilisateurRoleRepository`, de `POST /api/agents/{id}/roles` et `GET /api/agents/{id}/roles`,
  et d'un selecteur de role par ligne dans l'ecran Agents.
- **RG-UTI-005 — politique de mot de passe** : le Prompt Maitre laissait la decision ouverte.
  Decision retenue : minimum 8 caracteres, au moins une lettre et un chiffre, appliquee via
  `@Pattern` sur les trois points d'entree (creation agent, creation administrateur,
  reinitialisation de mot de passe). Documente ici pour tracabilite de la decision produit.
- **RG-ADM-001 — bootstrap du compte SUPER_ADMIN** : creation via une migration Flyway
  (`V3__bootstrap_super_admin.sql`), donc strictement hors de toute API applicative, conformement
  a l'exigence. Identifiants transmis separement a l'utilisateur (voir message de livraison) ;
  le mot de passe doit etre change des la premiere connexion, aucune politique de renouvellement
  force n'etant appliquee automatiquement.

## Ecart encore ouvert (a traiter avant mise en production)

- **Export PDF/XLSX des rapports** : seul le CSV est disponible (voir justification ci-dessus,
  Apache POI/iText non telechargeables hors ligne dans cet environnement de build). L'export CSV
  reste neanmoins pleinement exploitable (ouvrable dans tout tableur).
- **Migration vers des DTO systematiques** : plusieurs controleurs renvoient encore des entites
  JPA directement (contournement via `open-in-view: true`, voir plus haut). Fonctionnellement
  correct, mais une refonte vers des DTO explicites partout serait plus saine architecturalement
  et eviterait de reactiver open-in-view.
- **Palier 2 (numerisation) et Palier 3 (front-office, RG-FO-001)** : non demarres, par choix
  deliberement conforme a l'ordre impose par le Prompt Maitre (§7, §10.6, §13) — la recette
  globale du Palier 1 doit etre validee avant d'ouvrir le Palier 2, et RG-FO-001 interdit tout
  developpement du Palier 3 sans confirmation explicite separee.
- **Verification de build backend complete (`mvn compile`)** : l'environnement de build de cette
  session n'a ni Maven pre-installe, ni acces reseau vers Maven Central (seul le miroir Ubuntu
  `archive.ubuntu.com` est autorise). Maven a ete reconstruit manuellement a partir de paquets
  `.deb` pour verifier au moins que l'outil fonctionne, mais la resolution des dependances Spring
  Boot elles-memes reste impossible hors ligne. Tous les fichiers Java modifies ont ete relus
  manuellement (equilibrage des accolades/parentheses verifie automatiquement, coherence des
  imports et des signatures verifiee a la main) ; **`mvn compile` doit imperativement etre rejoue
  par l'utilisateur** (qui a un acces reseau normal) avant toute mise en service.
- **`npm run build` (bundle Rollup/esbuild complet)** : `tsc --noEmit` a reussi sans aucune erreur
  sur l'ensemble du frontend (verification de types complete, contrainte de temps levee cette
  fois). Le bundling complet (`vite build`) n'a en revanche pas pu se terminer dans le temps
  imparti par cet environnement precis ; chaque fichier touche a neanmoins ete verifie
  individuellement avec `esbuild` (transpilation + validation syntaxique). A rejouer par
  l'utilisateur pour confirmation finale du bundle de production.

## Recommandation avant mise en service reelle

1. Rejouer `mvn compile` (backend) et `npm run build` (frontend) sur un poste avec acces reseau
   normal, et corriger toute erreur residuelle que cet environnement de build restreint n'a pas pu
   detecter lui-meme.
2. Verifier que `pg_dump` et `pg_restore` (version PostgreSQL correspondante) sont bien presents
   sur le PATH du serveur qui execute le backend — condition necessaire au bon fonctionnement des
   sauvegardes/restaurations reelles ajoutees dans cette livraison (RG-PAR-001/002). Faire un essai
   de sauvegarde puis de restauration sur une base de test avant de s'y fier en production.
3. Changer immediatement le mot de passe du compte `superadmin` (bootstrap RG-ADM-001) des la
   premiere connexion.
4. Ajouter des tests automatises (aucun test unitaire/integration n'existe a ce stade au-dela de
   la verification manuelle) — risque majeur pour une mise en production serieuse.
5. Envisager, a terme, la migration des controleurs restants vers des DTO explicites plutot que
   des entites JPA directement serialisees (voir "Ecart encore ouvert").
