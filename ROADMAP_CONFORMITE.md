# CIVILIS — Conformite Palier 1 et feuille de route

Ce document trace, honnetement, l'ecart entre le Prompt Maitre et le code a un instant donne.
Objectif : que quiconque reprenne ce depot sache exactement ce qui est solide et ce qui reste a faire
avant une mise en production reelle.

## Corrige dans cette iteration

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

## Ecart encore ouvert (a traiter avant mise en production)

- **RG-RAP-001 — module Rapports** : totalement absent (pas de generation ni d'export
  PDF/XLSX/CSV). A construire de zero (`RapportController`, `RapportService`, ecran dedie).
- **RG-PAR-001 — restauration de sauvegarde** : `ParametrageService.restaurer` verifie l'existence
  de la sauvegarde mais n'effectue aucune restauration reelle. Une vraie restauration de base de
  donnees est une operation a haut risque qui merite sa propre conception (fenetre de maintenance,
  confirmation renforcee, tests sur environnement isole) plutot qu'un correctif rapide.
- **RG-IDX-011 — mode recensement en serie** : la conservation du registre selectionne entre deux
  fiches consecutives n'existe ni cote backend ni cote frontend.
- **`PATCH /api/indexation/fiches/{id}`** : seules la creation et le marquage "erronee" existent ;
  la modification generale d'une fiche indexee n'est pas implementee.
- **RG-UTI-001 — affectation multi-centre depuis l'UI** : la table `utilisateur_centre` est
  peuplee par les jeux de donnees de demonstration mais aucun endpoint ne permet de la gerer
  depuis l'application.
- **RG-UTI-005 — politique de mot de passe** : explicitement laisse ouvert par le Prompt Maitre
  (decision produit non tranchee) ; aucune contrainte de complexite n'est donc imposee cote API.
- **Verification de types complete (`tsc -b`)** avant cette livraison : l'environnement de build
  utilise pour cette iteration n'a pas permis de faire aboutir un `tsc -b` complet dans le temps
  imparti (timeouts d'infrastructure, sans rapport avec le code). `vite build` (qui transpile et
  valide la syntaxe/les imports de l'ensemble des modules) a reussi sans erreur, mais un
  `npm run build` complet (avec `tsc -b`) doit etre rejoue avant toute mise en production pour
  lever le doute sur un eventuel type incorrect non detecte par esbuild.

## Recommandation avant mise en service reelle

1. Rejouer `npm run build` (avec `tsc -b`) et `mvn test` sur un poste avec un temps de build non
   contraint, et corriger toute erreur de type residuelle.
2. Traiter le module Rapports (RG-RAP-001) si le jury/l'utilisateur final en a besoin des la
   premiere mise en service.
3. Concevoir serieusement RG-PAR-001 (restauration) avant de l'exposer a un Super Administrateur
   en environnement reel — ne pas se contenter d'un bouton qui ne fait rien.
4. Ajouter des tests automatises (aucun test unitaire/integration n'existe a ce stade au-dela de
   la verification manuelle) — risque majeur pour une mise en production serieuse.
