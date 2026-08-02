# CIVILIS — Conformite Palier 1 et feuille de route

Ce document trace, honnetement, l'ecart entre le Prompt Maitre et le code a un instant donne.
Objectif : que quiconque reprenne ce depot sache exactement ce qui est solide et ce qui reste a faire
avant une mise en production reelle.

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
