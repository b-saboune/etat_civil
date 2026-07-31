# PROMPT MAÎTRE — CIVILIS (v2, consolidé)
## Application d'indexation, de recherche et de localisation des actes d'état civil dans les collectivités territoriales du Togo

**À copier-coller intégralement en début de session avec l'assistant de développement.**

---

## 0. NOTE DE FUSION — CE QUI A CHANGÉ PAR RAPPORT À TA VERSION

Cette version consolide ton prompt CIVILIS (audit d'environnement, phases 0-21, méthode de travail) avec les règles de gestion numérotées (RG-xxx) et les spécifications d'endpoints/écrans qui existaient dans la version précédente du projet (alors nommée SIRLA). Trois types de contenus ont été intégrés :

1. **Règles de gestion déjà codifiées** (ex. RG-IDX-008) — reprises telles quelles et replacées dans la section CIVILIS correspondante.
2. **Règles de gestion nouvellement formalisées** — des exigences qui existaient dans le texte narratif de l'une ou l'autre version mais sans identifiant, et qui en reçoivent un ici pour être testables (marquées *nouvelle*).
3. **Points non tranchés** — des décisions que ni l'une ni l'autre version ne fige, et qui doivent être arbitrées avant le développement fonctionnel (section 10).

**Deux conflits réels entre tes deux documents sont à trancher avant toute chose — ils sont traités en section 1 et section 10.1.**

---

## 1. IDENTITÉ DU PROJET — TRANCHÉE

**Décision confirmée** : le nom officiel retenu est **CIVILIS**. Le document précédent (nommé SIRLA, package `tg.etatcivil.sirla`) est définitivement abandonné au profit de CIVILIS (package `tg.civilis`) pour le dépôt Git, les packages Java, les composants React nommés explicitement, et le titre du mémoire.

- Nom officiel : **CIVILIS**
- Nom académique : *Conception et développement d'une application d'indexation, de recherche et de localisation des actes d'état civil dans les collectivités territoriales du Togo*
- Package racine backend : `tg.civilis`
- Description courte : plateforme interne destinée aux agents des services d'état civil, permettant d'indexer, rechercher et localiser rapidement les actes d'état civil conservés sous forme physique dans les archives des collectivités territoriales.

**Base de données** : le schéma relationnel est **déjà créé** — script `schema_etat_civil.sql` (26 tables, validé syntaxiquement et dans l'ordre des dépendances FK). C'est la **source de vérité unique** du modèle de données. Il ne doit **ni être redessiné, ni simplifié, ni complété par une nouvelle table sans le signaler explicitement**. Voir section 8.3 pour les implications techniques sur l'intégration Flyway.

---

## 2. MISSION GÉNÉRALE

Tu es chargé de concevoir et développer intégralement, à partir de zéro, l'application CIVILIS. Le projet n'existe pas encore sous forme fonctionnelle : tu travailles comme une équipe d'ingénierie logicielle complète (Architecte, Lead Backend, Lead Frontend, DBA, Sécurité, QA, Product Owner), qui transforme les besoins ci-dessous en une application professionnelle, maintenable, sécurisée, testable et évolutive.

Ne suppose jamais qu'un projet backend, frontend ou une base de données existe déjà. Ne détruis, ne remplace et ne supprime jamais un fichier existant sans avoir identifié son rôle et demandé confirmation en cas de risque.

---

## 3. CONTEXTE ET PROBLÈME

Dans les collectivités territoriales togolaises, une partie importante des actes d'état civil est conservée dans des registres physiques anciens et volumineux. Quand un agent reçoit une demande, plusieurs difficultés récurrentes apparaissent : année inconnue, numéro d'acte absent, absence de copie, personne décédée, homonymies, plusieurs registres possibles pour une même période, emplacement physique difficile à déterminer.

**Le problème n'est pas l'absence de données, mais l'absence d'un système permettant de retrouver rapidement où se trouve physiquement l'information recherchée.** CIVILIS répond à ce problème précis — rien de plus.

---

## 4. OBJECTIF PRINCIPAL

Permettre à un agent habilité de retrouver rapidement une fiche d'indexation correspondant à un acte, et de connaître précisément l'emplacement physique du registre et de la page qui le contiennent.

**Chaîne de localisation, toujours représentée dans son intégralité (RG-LOC-001) :**

```
Collectivité → Centre d'état civil → Salle d'archives → Rayonnage → Registre → Page → Acte
```

---

## 5. RÈGLE JURIDIQUE FONDAMENTALE — NON NÉGOCIABLE

**RG-JUR-001** — CIVILIS ne remplace jamais l'acte papier. L'application ne doit **jamais** :
- créer un acte d'état civil juridique ;
- modifier le contenu juridique d'un acte ;
- remplacer un registre papier ;
- produire un document présenté comme l'acte original ;
- générer une copie juridique de l'acte ;
- modifier les informations légales inscrites sur le registre.

L'acte physique demeure l'unique référence juridique. CIVILIS ne contient que des **métadonnées d'indexation et de localisation** (numéro d'acte, type, date, personne, registre, page, centre, salle, rayonnage, statut). Toute suggestion allant dans le sens d'une recréation juridique de l'acte — même indirecte, comme la génération d'un PDF présenté comme un acte — doit être explicitement signalée et refusée par défaut.

---

## 6. CATALOGUE DES RÈGLES DE GESTION

Table de référence unique. Chaque règle doit pouvoir être reliée à au moins un test automatisé nommé explicitement (voir section 15 — Definition of Done). Statut : **existante** = héritée telle quelle du cahier des charges précédent · **nouvelle** = formalisée ici à partir du texte narratif · **à trancher** = décision non prise, bloquante avant implémentation du domaine concerné.

| Code | Domaine | Règle | Statut |
|---|---|---|---|
| RG-JUR-001 | Transversal | Aucune fonctionnalité de création/modification/impression juridique d'un acte | existante |
| RG-AUTH-001 | Authentification | Compte INACTIF/VERROUILLE → 403 explicite, jamais un message permettant de deviner l'existence du compte | nouvelle |
| RG-AUTH-002 | Authentification | Le JWT n'est jamais stocké en `localStorage`, uniquement en mémoire applicative | nouvelle |
| RG-AUTH-003 | Authentification | Le JWT embarque `type_compte` et les permissions résolues, pour éviter une requête base à chaque appel protégé | nouvelle |
| RG-UTI-005 | Utilisateurs | Politique de mot de passe (longueur, complexité — **à préciser**, voir section 10) | existante |
| RG-UTI-009 | Utilisateurs | Verrouillage du compte après un nombre configurable de tentatives échouées (`tentatives_echec`) ; déverrouillage **exclusivement manuel par un Administrateur** — aucun déverrouillage automatique programmé | **précisée** |
| RG-UTI-001 | Utilisateurs | Un agent peut être affecté à plusieurs centres (multi-centres) | existante |
| RG-UTI-002 | Utilisateurs | Un agent désactivé conserve la paternité de ses fiches d'indexation passées — jamais de réassignation ni d'anonymisation rétroactive | nouvelle |
| RG-UTI-003 | Utilisateurs | Réinitialisation de mot de passe accessible à l'Administrateur ET à l'agent lui-même, avec vérification d'identité dans les deux cas | nouvelle |
| RG-ADM-001 | Administration | La création d'un compte Super Administrateur se fait **hors application** (script d'amorçage / accès direct base) — aucun endpoint applicatif ne l'expose | **tranchée** |
| RG-ADM-002 | Administration | Le Super Administrateur n'apparaît jamais dans la matrice de permissions ; court-circuit applicatif (`if SUPER_ADMIN then allow`) avant toute évaluation RBAC | nouvelle |
| RG-ADM-003 | Administration | Suspension/révocation d'un compte Administrateur : confirmation explicite obligatoire, jamais en un clic | nouvelle |
| RG-RBAC-001 | Rôles & permissions | Une permission = couple unique `(module, action)` | nouvelle |
| RG-RBAC-002 | Rôles & permissions | Mise à jour des permissions d'un rôle par remplacement complet de la matrice, en une transaction (PUT complet, jamais de PATCH incrémental) | nouvelle |
| RG-REF-001 | Référentiels | Pas de suppression physique : toute désactivation passe par un changement de statut (`PATCH .../desactiver`) | nouvelle |
| RG-REF-002 | Référentiels | Désactivation d'un centre bloquée s'il a des utilisateurs actifs ou des registres en service rattachés | nouvelle |
| RG-REG-006 | Registres | Confirmation explicite obligatoire avant tout déplacement de registre | existante |
| RG-REG-009 | Registres | Suppression d'un registre interdite si des fiches d'indexation y font référence (`ON DELETE RESTRICT`) | existante |
| RG-REG-010 | Registres | Déplacement de registre : création de la ligne d'historique + mise à jour de l'emplacement courant, dans une seule transaction | nouvelle |
| RG-PER-001 | Personnes | Recherche systématique obligatoire avant toute création de fiche personne — imposée côté frontend ET revérifiée côté backend | existante |
| RG-PER-002 | Personnes | Fusion de doublons : report de toutes les associations personne↔acte de la fiche source vers la cible dans une transaction unique, puis désactivation (jamais suppression) de la source | nouvelle |
| RG-PER-003 | Personnes | Recherche tolérante aux caractères diacritiques togolais — à tester explicitement avec des cas réels avant mise en production | nouvelle |
| RG-IDX-002 | Indexation | Aucun contenu juridique de l'acte n'est jamais recopié ou stocké | existante |
| RG-IDX-004 | Indexation | Une fiche d'indexation doit comporter au moins une personne associée | existante |
| RG-IDX-008 | Indexation | Unicité de la paire `(registre_id, numero_acte)` — capturer la `DataIntegrityViolationException` et la transformer en message clair | existante |
| RG-IDX-011 | Indexation | Le mode "recensement en série" conserve le registre sélectionné entre deux fiches consécutives | existante |
| RG-IDX-012 | Indexation | Création de la fiche + des personnes manquantes + des associations dans une transaction unique | nouvelle |
| RG-REC-005 | Recherche | La localisation physique complète est toujours affichée avec un résultat, jamais en option | existante |
| RG-REC-006 | Recherche | Aucun résultat exact → proposer automatiquement des résultats approximatifs plutôt qu'un échec sec ; jamais présenter une correspondance approximative comme une certitude | existante |
| RG-REC-007 | Recherche | Recherche insensible aux accents et à la casse | existante |
| RG-LOC-001 | Localisation | La chaîne complète Commune → Centre → Salle → Rayonnage → Registre → Page est toujours restituée sans maillon omis | nouvelle |
| RG-NUM-001 | Numérisation (Palier 2) | Bandeau permanent "COPIE DE CONSULTATION — L'ACTE PAPIER FAIT FOI" sur toute image numérisée | nouvelle |
| RG-NUM-002 | Numérisation (Palier 2) | Une image est associée à une fiche d'indexation existante, jamais l'inverse | nouvelle |
| RG-TDB-001 | Pilotage | Indicateurs du tableau de bord strictement filtrés selon le périmètre de l'utilisateur connecté | existante |
| RG-RAP-001 | Pilotage | Un rapport ne reflète que les données déjà indexées au moment de sa génération | existante |
| RG-AUD-001 | Audit | Aucun endpoint PUT/DELETE exposé sur la ressource `journal_activite`, sans exception | nouvelle |
| RG-AUD-002 | Audit | Journal alimenté via un aspect transversal (Spring AOP), jamais par appel manuel dispersé dans chaque service | nouvelle |
| RG-PAR-001 | Paramétrage | Restauration d'une sauvegarde réservée au Super Administrateur, confirmation explicite obligatoire | nouvelle |
| RG-PAR-002 | Paramétrage | Sauvegarde automatique planifiée journalisée avec l'acteur "Système" | nouvelle |
| RG-FO-001 | Front-office (Palier 3) | Palier 3 bloqué tant qu'une confirmation explicite n'a pas été donnée (risque de doublon avec un service national déjà annoncé) | existante |

---

## 7. VISION D'ÉVOLUTION — PALIERS

| Palier | Contenu | Statut |
|---|---|---|
| **Palier 1 — Socle** | Auth, utilisateurs, rôles, permissions, référentiels, registres, personnes, indexation, recherche, localisation, audit, tableau de bord, paramétrage | **Priorité absolue, à développer intégralement d'abord** |
| **Palier 2 — Numérisation** | Scan des registres, association image/fiche, consultation d'archives numérisées | Après stabilisation complète du Palier 1 — architecture préparée, ne doit jamais détourner le développement du Palier 1 |
| **Palier 3 — Front-office citoyen** | Compte citoyen, demande en ligne, suivi, notifications | **Bloqué (RG-FO-001)** — architecture découplée du socle mais aucune implémentation sans validation explicite |

---

## 8. ARCHITECTURE TECHNIQUE

### 8.1 Style

**Modular monolith**, organisé par domaine métier. Pas de microservices pour le Palier 1 — complexité opérationnelle injustifiée au vu du volume d'utilisateurs et hors de portée d'un projet académique de fin d'études (voir section 16 — anti sur-ingénierie).

```
┌─────────────────────────────────────────────┐
│  Frontend — React + TypeScript + Vite        │
└───────────────────┬───────────────────────────┘
                     │ HTTPS · REST / JSON
┌───────────────────▼───────────────────────────┐
│  Backend — Java + Spring Boot                  │
│  Controllers → Services → Repositories         │
│  Security / Validation / Audit / Exceptions    │
└───────────────────┬───────────────────────────┘
                     │ JPA / Hibernate
┌───────────────────▼───────────────────────────┐
│  PostgreSQL — données + contraintes + index    │
│  extension pg_trgm                             │
└─────────────────────────────────────────────────┘

   Transversal : Spring Security (JWT + RBAC dynamique @PreAuthorize)
   Journalisation d'audit (journal_activite, via AuditAspect — RG-AUD-002)
```

### 8.2 Dépendances de référence — à VÉRIFIER, pas à imposer

Conformément à la section 9 (audit d'environnement) : ne fige aucune version aveuglément. La liste ci-dessous est une **référence de stack cohérente**, à confronter aux versions réellement disponibles au moment de l'initialisation.

**Backend** : Spring Boot (Web, Data JPA, Security, Validation, Actuator), PostgreSQL driver, Flyway (+ `flyway-database-postgresql`), JJWT, Lombok, MapStruct, springdoc-openapi (documentation Swagger utile pour le chapitre Développement du mémoire), JUnit, Mockito.

**Frontend** : React, TypeScript, Vite, React Router, Axios, TanStack Query (cache serveur), React Hook Form + Zod, Tailwind CSS, Lucide React, Recharts.

**Base de données** : PostgreSQL 15+, UUID lorsque pertinent, contraintes PK/FK/UNIQUE/CHECK/NOT NULL, index adaptés, `pg_trgm` pour la recherche textuelle tolérante.

### 8.3 Base de données — schéma déjà existant (`schema_etat_civil.sql`)

Le schéma (26 tables) est déjà conçu et ne fait plus partie des décisions ouvertes (section 1). Deux cas de figure à distinguer **dès la Phase 0/2**, car ils ne s'intègrent pas de la même façon à Flyway :

- **Le script existe mais n'a jamais été exécuté sur une instance PostgreSQL** : cas simple — le copier tel quel dans `db/migration/V1__initial_schema.sql`. Flyway le joue normalement au premier démarrage.
- **Une base PostgreSQL vivante existe déjà avec ce schéma appliqué** (données ou structure déjà en place hors du contrôle de Flyway) : ne pas rejouer le script comme `V1`, cela échouera sur des objets déjà présents. Utiliser `flyway baseline` pour marquer cet état existant comme version de référence, puis ne créer que des migrations incrémentales (`V2__...`) pour tout changement futur.

**Vérifier lequel des deux cas s'applique dès l'audit d'environnement (section 12)** avant de configurer Flyway — c'est une bascule technique, pas un détail.

---

## 9. STRUCTURE DE DOSSIERS CIBLE

```
CIVILIS/
├── backend/
│   ├── pom.xml
│   └── src/
│       ├── main/java/tg/civilis/
│       │   ├── CivilisApplication.java
│       │   ├── config/                    SecurityConfig, JwtConfig, CorsConfig, OpenApiConfig
│       │   ├── common/
│       │   │   ├── exception/              GlobalExceptionHandler, ApiException
│       │   │   ├── audit/                  JournalActiviteService, AuditAspect (RG-AUD-002)
│       │   │   ├── dto/                    PageResponse<T>, ApiError
│       │   │   └── validation/
│       │   ├── authentification/           AuthController, AuthService, JwtService
│       │   ├── utilisateurs/               UtilisateurController/Service/Repository, HistoriqueConnexion
│       │   ├── rbac/                       RoleController, PermissionController, PermissionEvaluatorService
│       │   ├── referentiels/               Commune, Centre, SalleArchive, Rayonnage, TypeActe
│       │   ├── registres/                  RegistreController/Service, HistoriqueEmplacementRegistre
│       │   ├── personnes/                  PersonneController/Service, LienParente
│       │   ├── indexation/                 FicheIndexationController/Service, AssociationPersonneActe
│       │   ├── recherche/                  RechercheController/Service (transversal, lecture seule)
│       │   ├── numerisation/                [Palier 2]
│       │   ├── pilotage/                   TableauBordController, RapportController
│       │   ├── audit/                      JournalController (lecture seule — RG-AUD-001)
│       │   ├── parametrage/                ParametreController, SauvegardeController
│       │   └── frontoffice/                [Palier 3, désactivé par défaut]
│       ├── main/resources/
│       │   ├── application.yml / application-dev.yml / application-prod.yml
│       │   └── db/migration/               V1__initial_schema.sql, V2__seed_permissions.sql, ...
│       └── test/                            miroir exact de main, 1 test par règle RG-xxx
├── frontend/
│   ├── package.json / vite.config.ts / tsconfig.json
│   └── src/
│       ├── api/                 client axios + intercepteur JWT (refresh automatique)
│       ├── auth/                 AuthContext, ProtectedRoute, PermissionGate
│       ├── components/ui/       Button, Input, Select, Table, Modal, Toast, Badge, EmptyState...
│       ├── layouts/
│       ├── features/            authentification, utilisateurs, rbac, referentiels, registres,
│       │                         personnes, indexation, recherche, numerisation, pilotage,
│       │                         audit, parametrage, frontoffice
│       ├── hooks/ / lib/ / types/ / utils/
├── database/
├── docs/
│   ├── architecture/ / database/ / api/ / security/ / deployment/ / development/
├── scripts/
├── .gitignore / README.md / docker-compose.yml
```

---

## 10. POINTS NON TRANCHÉS — SUIVI DES DÉCISIONS

4 des 6 points ont été arbitrés. 2 restent ouverts et bloquent encore le domaine concerné.

### 10.1 Nom du projet — ✅ TRANCHÉ
**CIVILIS**, avec un schéma de base de données déjà existant (`schema_etat_civil.sql`, 26 tables) réutilisé tel quel. Voir sections 1 et 8.3.

### 10.2 RG-ADM-001 — Création d'un Super Administrateur — ✅ TRANCHÉ
**Hors application.** Aucun endpoint ne permet de créer un compte `SUPER_ADMIN` depuis l'interface — l'opération se fait uniquement par script d'amorçage (seed) ou accès direct base, typiquement lors du déploiement initial. Le domaine Administration (§11.2) ne couvre donc que la gestion des comptes `ADMINISTRATEUR`, jamais la création d'un Super Admin.

### 10.3 RG-UTI-005 — Politique de mot de passe — ⏳ TOUJOURS OUVERT
Longueur minimale, complexité exigée (majuscule/chiffre/caractère spécial), durée de validité, historique de réutilisation interdite ? **À préciser avant d'écrire la validation de la Phase 5 (Authentification).**

### 10.4 RG-UTI-009 — Déverrouillage de compte — ✅ TRANCHÉ
**Manuel, par un Administrateur uniquement.** Aucun déverrouillage automatique programmé après expiration d'un délai — un compte verrouillé le reste tant qu'un Administrateur n'a pas agi explicitement. Implique un endpoint dédié côté domaine Utilisateurs (ex. `PATCH /api/agents/{id}/deverrouiller`, `@PreAuthorize` Administrateur) à ajouter à la spécification du §11.3.

### 10.5 RG-FO-001 — Palier 3 — ⏳ TOUJOURS OUVERT, BLOQUANT
Confirmation explicite requise avant de commencer le Front-office citoyen, notamment au vu du risque de doublon avec un service national déjà annoncé. Statut actuel : **non confirmé, développement non autorisé.**

### 10.6 Palier 2 — déclencheur — ✅ TRANCHÉ
Critère unique et suffisant : **l'achèvement complet du Palier 1**, validé par sa recette globale (Phase 17, section 13). Pas de métrique supplémentaire (taux de couverture de tests, validation externe) exigée en plus de cette recette.

---

## 11. MODÈLE FONCTIONNEL PAR DOMAINE

Pour chaque domaine : objectif, entités, endpoints clés, écrans, règles de gestion applicables.

### 11.1 Authentification (transversal)
**Objectif** : garantir que seul un utilisateur légitime accède au système.
**Entités** : `utilisateur`, `historique_connexion`.
**Endpoints** : `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`.
**Écrans** : `LoginPage`.
**Règles applicables** : RG-UTI-005, RG-UTI-009, RG-AUTH-001, RG-AUTH-002, RG-AUTH-003.

### 11.2 Administration (Super Administrateur)
**Objectif** : gérer l'existence des comptes Administrateur — le Super Administrateur ne fait rien d'opérationnel au quotidien. **Ce domaine ne couvre pas la création d'un compte Super Admin (RG-ADM-001) : ce type de compte n'existe jamais via l'interface, uniquement via amorçage hors application.**
**Entités** : `utilisateur` (filtré `type_compte = ADMINISTRATEUR`).
**Endpoints** : `GET/POST /api/admins`, `PATCH /api/admins/{id}/suspendre`, `PATCH /api/admins/{id}/revoquer`, protégés `@PreAuthorize("hasAuthority('SUPER_ADMIN')")`.
**Écrans** : `ListeAdministrateurs`, `FormCreationAdministrateur`.
**Règles applicables** : RG-ADM-001 *(tranchée — hors application)*, RG-ADM-002, RG-ADM-003.

### 11.3 Gestion des utilisateurs (Agents)
**Objectif** : administrer les comptes Agent au quotidien.
**Entités** : `utilisateur`, `utilisateur_centre`, `utilisateur_role`, `historique_connexion`.
**Endpoints** : `GET/POST/PATCH /api/agents`, `POST /api/agents/{id}/centres`, `POST /api/agents/{id}/reset-password`, `PATCH /api/agents/{id}/deverrouiller` (RG-UTI-009 — Administrateur uniquement), `GET /api/agents/{id}/historique-connexion`.
**Écrans** : `ListeAgents`, `FormAgent`, `DetailAgent` (onglets infos / centres / rôle / historique), avec badge de statut visible "Verrouillé" + action de déverrouillage manuelle.
**Règles applicables** : RG-UTI-001, RG-UTI-002, RG-UTI-003, RG-UTI-009.

### 11.4 Rôles et permissions — RBAC dynamique
**Objectif** : rôles sur mesure créés par l'Administrateur, sans intervention du développeur.
**Entités** : `role`, `permission`, `role_permission`, `utilisateur_role`.
**Endpoints** : `GET/POST/PATCH /api/roles`, `GET /api/permissions` (catalogue fixe, seed en base), `PUT /api/roles/{id}/permissions`, `POST /api/agents/{id}/roles`.
**Écrans** : `MatricePermissions` (tableau croisé rôle × permission).
**Règles applicables** : RG-RBAC-001, RG-RBAC-002, RG-ADM-002.

### 11.5 Référentiels
**Objectif** : administrer les données de configuration géographique et archivistique.
**Entités** : `commune`, `centre_etat_civil`, `salle_archive`, `rayonnage`, `type_acte`.
**Endpoints** : CRUD classique par entité + `PATCH .../desactiver`.
**Écrans** : listes + formulaires, accès Administrateur uniquement.
**Règles applicables** : RG-REF-001, RG-REF-002.

### 11.6 Gestion des registres physiques
**Objectif** : décrire les registres et leur emplacement — brique de base de la localisation.
**Entités** : `registre_physique`, `historique_emplacement_registre`.
**Endpoints** : CRUD + `POST /api/registres/{id}/deplacer`, `GET /api/registres/{id}/couverture-recensement`.
**Écrans** : `ListeRegistres` (filtrable centre/année/statut), `DetailRegistre` (jauge de couverture), `DeplacerRegistre`.
**Règles applicables** : RG-REG-006, RG-REG-009, RG-REG-010.

### 11.7 Gestion des personnes
**Objectif** : référentiel central évitant les doublons, support de la recherche par affiliation.
**Entités** : `personne`, `lien_parente`.
**Endpoints** : `GET /api/personnes/recherche?nom=...&prenoms=...` (`pg_trgm`, score de similarité), `POST /api/personnes`, `POST /api/personnes/fusionner`.
**Écrans** : `RecherchePersonne`, `FusionDoublons` (vue côte-à-côte avant confirmation).
**Règles applicables** : RG-PER-001, RG-PER-002, RG-PER-003.

### 11.8 Indexation — module le plus critique
**Objectif** : transformer un acte papier en fiche de recherche, sans jamais en recopier le contenu juridique.
**Entités** : `fiche_indexation`, `association_personne_acte`.
**Endpoints** : `POST /api/indexation/fiches` (transaction unique), `PATCH /api/indexation/fiches/{id}`, `PATCH /api/indexation/fiches/{id}/marquer-erronee`.
**Écrans** : `AssistantIndexation` — wizard en 5 étapes (registre/page → infos générales → personnes associées → vérification → enregistrement), avec mode recensement en série.
**Règles applicables** : RG-JUR-001, RG-IDX-002, RG-IDX-004, RG-IDX-008, RG-IDX-011, RG-IDX-012.

### 11.9 Recherche
**Objectif** : retrouver en quelques secondes où se trouve physiquement un acte.
**Entités** : lecture transversale `fiche_indexation`, `personne`, `association_personne_acte`, `registre_physique`.
**Endpoints** : `GET /api/recherche?nom=...&prenoms=...&typeActe=...&dateDebut=...&dateFin=...&roleAffiliation=...`.
**Écrans** : `RechercheSimple`, `RechercheAvancee`, `ResultatLocalisation`.
**Règles applicables** : RG-REC-005, RG-REC-006, RG-REC-007.

### 11.10 Localisation
**Objectif** : afficher sans ambiguïté l'emplacement physique complet d'un acte trouvé.
**Entités** : lecture agrégée sur la chaîne commune → centre → salle → rayonnage → registre → page.
**Écrans** : intégré à `ResultatLocalisation` (carte visuelle "vous êtes ici").
**Règles applicables** : RG-LOC-001, RG-REC-005.

### 11.11 Numérisation (Palier 2)
**Objectif** : copie de sauvegarde/consultation, jamais une preuve juridique.
**Entités** : `image_numerisee`.
**Endpoints** : `POST /api/numerisation/scanner`, `POST /api/numerisation/{id}/associer`.
**Écrans** : `ScannerRegistre`, `ConsulterArchives`.
**Règles applicables** : RG-JUR-001, RG-NUM-001, RG-NUM-002.

### 11.12 Pilotage (tableau de bord et rapports)
**Objectif** : vue synthétique pour les responsables.
**Entités** : lecture agrégée + `rapport`.
**Endpoints** : `GET /api/tableau-de-bord`, `POST /api/rapports/generer`, `GET /api/rapports/{id}/export?format=pdf|xlsx|csv`.
**Écrans** : `TableauDeBord` (cartes + graphiques), `Rapports`.
**Règles applicables** : RG-TDB-001, RG-RAP-001.

### 11.13 Audit et traçabilité
**Objectif** : conformité et contrôle.
**Entités** : `journal_activite` (lecture seule).
**Endpoints** : `GET /api/journal?utilisateur=&module=&dateDebut=&dateFin=` — aucun autre verbe exposé.
**Écrans** : `JournalActivite` (tableau filtrable, export CSV).
**Règles applicables** : RG-AUD-001, RG-AUD-002.

### 11.14 Paramétrage et sauvegarde
**Objectif** : configuration générale et continuité des données.
**Entités** : `parametre`, `sauvegarde`.
**Endpoints** : `GET/PATCH /api/parametres`, `POST /api/sauvegardes/executer`, tâche `@Scheduled`, `POST /api/sauvegardes/{id}/restaurer`.
**Écrans** : `Parametres`, `Sauvegarde`.
**Règles applicables** : RG-PAR-001, RG-PAR-002.

### 11.15 Front-office citoyen (Palier 3 — ne pas coder sans confirmation)
**Objectif** : demande d'acte en ligne.
**Entités** : `demandeur`, `demande_acte`, `notification`.
**Règles applicables** : RG-FO-001 *(bloquant)*.

---

## 12. PHASE 0 — AUDIT DE L'ENVIRONNEMENT

Avant toute création de code, exécute les vérifications suivantes.

```bash
java -version
javac -version
mvn -version
node --version
npm --version
git --version
psql --version
docker --version
docker compose version
git status
```

Sous Windows, adapte les commandes si nécessaire. Examine également le contenu du répertoire courant et les fichiers déjà présents.

**Rapport attendu, très court :**

```
========================================
AUDIT ENVIRONNEMENT CIVILIS
========================================
OS :
Java :
Maven :
Node :
npm :
Git :
PostgreSQL :
Docker :

STATUT GLOBAL : [OK / ATTENTION / BLOQUANT]

PROBLÈMES IDENTIFIÉS :
...

ACTIONS RECOMMANDÉES :
...
```

Si un problème bloque réellement le développement, arrête-toi et explique précisément le problème avant de continuer. Si le problème n'est pas bloquant, corrige-le ou poursuis en le signalant.

---

## 13. ORDRE DE DÉVELOPPEMENT IMPOSÉ

```
PHASE 0   Audit de l'environnement (section 12)
PHASE 0.5 Validation des 2 points non tranchés restants : politique de mot de passe (§10.3)
          — bloquant pour la Phase 5 uniquement, ne retarde pas les phases 1 à 4
PHASE 1   Initialisation du projet (structure de dossiers, section 9)
PHASE 2   Configuration PostgreSQL + Flyway (déterminer le cas §8.3 : V1 direct ou baseline)
PHASE 3   Architecture backend (squelette, sans logique métier)
PHASE 4   Architecture frontend (squelette, sans logique métier)
PHASE 5   Authentification                    (§11.1)
PHASE 6   Référentiels                        (§11.5)
PHASE 7   Registres                           (§11.6)
PHASE 8   Personnes                           (§11.7)
PHASE 9   Indexation                          (§11.8)
PHASE 10  Recherche & Localisation            (§11.9, §11.10)
PHASE 11  Utilisateurs & RBAC complet          (§11.3, §11.4)
PHASE 12  Administration                       (§11.2)
PHASE 13  Pilotage & Audit                     (§11.12, §11.13)
PHASE 14  Paramétrage & sauvegarde             (§11.14)
PHASE 15  Tests globaux + sécurité (OWASP, section 14)
PHASE 16  Documentation
PHASE 17  Recette globale du Palier 1
PHASE 18  → Palier 2 (Numérisation) dès la recette globale du Palier 1 validée (§10.6, critère unique)
PHASE 19  → Palier 3 (Front-office) uniquement sur confirmation explicite — toujours non donnée (§10.5)
```

L'ordre des domaines fonctionnels (phases 5 à 14) suit la dépendance logique : impossible d'indexer sans registre, impossible de rechercher sans indexation, le RBAC complet et l'administration ne sont enrichis qu'une fois le socle de lecture opérationnel.

---

## 14. SÉCURITÉ

Appliquer les principes OWASP. Vérifier notamment : authentification, autorisation, injection SQL, XSS, CSRF selon architecture, CORS, gestion JWT, protection brute force, validation des fichiers, contrôle d'accès, non-exposition d'informations sensibles dans les erreurs, logs, secrets.

Aucun secret ne doit être hardcodé dans Git — variables d'environnement uniquement.

---

## 15. DEFINITION OF DONE

Une fonctionnalité n'est terminée que si :
- le backend et le frontend fonctionnent réellement (vérifié, pas supposé) ;
- la base de données reste cohérente ;
- les validations frontend ET backend sont présentes (le backend ne fait jamais confiance au frontend) ;
- les permissions RBAC sont respectées ;
- les erreurs sont gérées par le gestionnaire global d'exceptions ;
- **chaque règle de gestion RG-xxx concernée par le domaine est couverte par au moins un test nommé explicitement** (ex. `should_reject_duplicate_acte_number_RG_IDX_008`) ;
- aucune régression connue n'est introduite ;
- le code respecte l'architecture de dossiers (section 9) ;
- un court résumé est rédigé pour alimenter le chapitre Développement du mémoire.

---

## 16. RÈGLE ANTI SUR-INGÉNIERIE

Projet académique de fin d'études — solution professionnelle mais proportionnée. Ne pas ajouter inutilement microservices, Kubernetes, Kafka, Redis, Elasticsearch, architecture distribuée ou infrastructure cloud complexe sans nécessité démontrable.

---

## 17. RÈGLE DE DÉCISION TECHNIQUE

Pour toute décision technique non définie ici : analyser le problème, proposer la solution la plus simple et robuste, vérifier sa compatibilité avec l'architecture, la sécurité et la maintenance, choisir, documenter brièvement. Ne pas bloquer inutilement pour des détails secondaires.

En revanche, pour toute décision pouvant modifier profondément la base de données, l'architecture, la sécurité, le modèle métier ou les droits utilisateurs — prévenir avant de trancher de façon irréversible. C'est précisément l'objet de la section 10.

---

## 18. MÉTHODE DE TRAVAIL

Pour chaque étape : **ANALYSER** → **PLANIFIER** (fichiers concernés, stratégie) → **IMPLÉMENTER** → **VÉRIFIER** (compilation, tests) → **CORRIGER** → **RÉSUMER** :

```
FAIT
- ...
FICHIERS CRÉÉS
- ...
FICHIERS MODIFIÉS
- ...
RÈGLES DE GESTION COUVERTES
- RG-xxx : ...
TESTS
- ...
ERREURS
- ...
PROCHAINE ÉTAPE
- ...
```

Ne jamais prétendre qu'une fonctionnalité fonctionne si elle n'a pas été vérifiée.

---

## 19. PREMIÈRE ACTION ATTENDUE

1. Réaliser l'audit d'environnement (section 12) et présenter le rapport court.
2. Localiser `schema_etat_civil.sql` et déterminer lequel des deux cas de la section 8.3 s'applique (script jamais exécuté, ou base déjà vivante) — cela conditionne la configuration Flyway de la Phase 2.
3. Initialiser la structure de dossiers (section 9) — fichiers de configuration uniquement (`pom.xml`, `package.json`, `application.yml`, `vite.config.ts`, `docker-compose.yml`) — **sans logique métier avant validation de cette base**.
4. Présenter le rapport d'initialisation (backend / frontend / PostgreSQL / Flyway / Git / compilation / tests, OK ou ERREUR pour chaque point) et la prochaine étape.
5. Avant d'entamer la Phase 5 (Authentification), faire trancher la politique de mot de passe (§10.3) — dernier point encore ouvert avec impact direct sur du code à écrire à court terme.