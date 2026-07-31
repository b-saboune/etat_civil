-- =====================================================================
-- CIVILIS — Schéma de base de données PostgreSQL
-- Fichier : schema_etat_civil.sql
-- =====================================================================
--
-- STATUT : RECONSTRUCTION, PAS L'ORIGINAL.
--
-- Le fichier original mentionné dans le Prompt Maître et dans le Cahier
-- des Charges Techniques ("livré séparément") n'a jamais été retrouvé
-- dans les documents du projet. Ce script est reconstruit à partir de :
--   - la section 3 (Modèle Conceptuel de Données) du Cahier des Charges
--     Techniques, qui liste les 26 entités et leurs attributs ;
--   - l'extrait CREATE TABLE fourni en section 5 de ce même document
--     (table fiche_indexation), repris ici tel quel, qui sert de
--     référence de convention (nommage snake_case, BIGSERIAL, CHECK
--     inline, contraintes nommées pour les composites) ;
--   - Diagramme_Classes.png, qui confirme les mêmes 24 classes + 2
--     associations many-to-many implicites (utilisateur_role,
--     utilisateur_centre) = 26 tables ;
--   - le catalogue de règles de gestion RG-xxx du Prompt Maître CIVILIS.
--
-- Ce que ces sources NE précisaient PAS, et que j'ai dû choisir :
--   - les longueurs de VARCHAR (aucune n'était documentée) ;
--   - la liste exhaustive des valeurs de certains statuts/enums
--     (ex. rôle dans association_personne_acte, type_lien dans
--     lien_parente) — laissés en VARCHAR libre plutôt qu'un CHECK
--     figé, faute de liste officielle ;
--   - les comportements ON DELETE non explicitement cités par une RG
--     (seul fiche_indexation.registre_id → registre_physique a un
--     ON DELETE RESTRICT explicite, imposé par RG-REG-009) ;
--   - le contenu exact du seed (types d'actes, permissions de base) —
--     un jeu minimal indicatif est fourni, à valider avant Phase 2.
--
-- À faire valider avant de le considérer comme source de vérité figée
-- (section 1 du Prompt Maître) : relire ce fichier ligne à ligne et
-- confirmer, ou corriger, chaque hypothèse ci-dessus.
--
-- Ordre de création : respecte les 7 regroupements logiques du
-- diagramme de classes, dans le même ordre que celui-ci (Référentiels
-- géographiques → Registres et types d'actes → Sécurité et RBAC
-- dynamique → Indexation et personnes → Numérisation → Pilotage →
-- Front-office citoyen). Aucune table ne référence une table pas
-- encore créée à ce stade, à une exception documentée près (voir la
-- section 3 — Sécurité, la contrainte différée sur
-- historique_emplacement_registre.auteur_id), reproduisant exactement
-- la technique décrite dans le Cahier des Charges Techniques.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================================
-- 1. RÉFÉRENTIELS GÉOGRAPHIQUES
-- =====================================================================

CREATE TABLE commune (
    id                  BIGSERIAL PRIMARY KEY,
    nom                 VARCHAR(150) NOT NULL
);

CREATE TABLE centre_etat_civil (
    id                  BIGSERIAL PRIMARY KEY,
    commune_id          BIGINT NOT NULL REFERENCES commune(id),
    nom                 VARCHAR(150) NOT NULL,
    adresse             VARCHAR(255),
    statut              VARCHAR(20) NOT NULL DEFAULT 'ACTIF'
                            CHECK (statut IN ('ACTIF', 'INACTIF'))
);

CREATE TABLE salle_archive (
    id                  BIGSERIAL PRIMARY KEY,
    centre_id           BIGINT NOT NULL REFERENCES centre_etat_civil(id),
    designation         VARCHAR(150) NOT NULL
);

CREATE TABLE rayonnage (
    id                  BIGSERIAL PRIMARY KEY,
    salle_id            BIGINT NOT NULL REFERENCES salle_archive(id),
    designation         VARCHAR(150) NOT NULL
);

-- =====================================================================
-- 2. REGISTRES ET TYPES D'ACTES
-- =====================================================================

CREATE TABLE type_acte (
    id                  BIGSERIAL PRIMARY KEY,
    libelle             VARCHAR(100) NOT NULL UNIQUE,
    actif               BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE registre_physique (
    id                  BIGSERIAL PRIMARY KEY,
    centre_id           BIGINT NOT NULL REFERENCES centre_etat_civil(id),
    rayonnage_id        BIGINT NOT NULL REFERENCES rayonnage(id),
    type_acte_id        BIGINT NOT NULL REFERENCES type_acte(id),
    numero_registre     VARCHAR(50) NOT NULL,
    annee               INTEGER NOT NULL,
    nb_pages            INTEGER NOT NULL,
    statut              VARCHAR(20) NOT NULL DEFAULT 'EN_SERVICE'
                            CHECK (statut IN ('EN_SERVICE', 'ARCHIVE', 'RETIRE'))
);

-- Dépendance circulaire documentée : cette table référence utilisateur
-- (auteur_id), mais utilisateur n'est créée que dans la section 3
-- (Sécurité) qui suit. La colonne est déclarée sans contrainte FK ici ;
-- la contrainte est ajoutée par ALTER TABLE une fois utilisateur créée
-- (voir fin de la section 3).
CREATE TABLE historique_emplacement_registre (
    id                  BIGSERIAL PRIMARY KEY,
    registre_id         BIGINT NOT NULL REFERENCES registre_physique(id),
    ancien_rayonnage_id BIGINT REFERENCES rayonnage(id),
    nouveau_rayonnage_id BIGINT NOT NULL REFERENCES rayonnage(id),
    date_deplacement    TIMESTAMP NOT NULL DEFAULT now(),
    auteur_id           BIGINT NOT NULL
);

-- =====================================================================
-- 3. SÉCURITÉ ET RBAC DYNAMIQUE
-- =====================================================================

CREATE TABLE utilisateur (
    id                  BIGSERIAL PRIMARY KEY,
    identifiant         VARCHAR(100) NOT NULL UNIQUE,
    mot_de_passe_hash   VARCHAR(255) NOT NULL,
    type_compte         VARCHAR(20) NOT NULL
                            CHECK (type_compte IN ('SUPER_ADMIN', 'ADMINISTRATEUR', 'AGENT')),
    statut              VARCHAR(20) NOT NULL DEFAULT 'ACTIF'
                            CHECK (statut IN ('ACTIF', 'INACTIF', 'VERROUILLE')),
    -- RG-UTI-009 : colonne explicitement nommée dans le Prompt Maître,
    -- support du verrouillage après N tentatives échouées.
    tentatives_echec    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE permission (
    id                  BIGSERIAL PRIMARY KEY,
    module              VARCHAR(50) NOT NULL,
    action              VARCHAR(50) NOT NULL,
    code                VARCHAR(100) NOT NULL UNIQUE,
    -- RG-RBAC-001 : une permission = couple unique (module, action)
    CONSTRAINT uq_permission_module_action UNIQUE (module, action)
);

CREATE TABLE role (
    id                  BIGSERIAL PRIMARY KEY,
    libelle             VARCHAR(100) NOT NULL UNIQUE,
    description         VARCHAR(255),
    actif               BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE role_permission (
    id                  BIGSERIAL PRIMARY KEY,
    role_id             BIGINT NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    permission_id       BIGINT NOT NULL REFERENCES permission(id) ON DELETE CASCADE,
    accordee            BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);

-- Association many-to-many utilisateur <-> role (pas de classe dédiée
-- dans le diagramme, uniquement les deux clés) : clé primaire composite.
CREATE TABLE utilisateur_role (
    utilisateur_id      BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    role_id             BIGINT NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    PRIMARY KEY (utilisateur_id, role_id)
);

-- Association many-to-many utilisateur <-> centre (multi-centres,
-- RG-UTI-001) : même logique, clé primaire composite.
CREATE TABLE utilisateur_centre (
    utilisateur_id      BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    centre_id           BIGINT NOT NULL REFERENCES centre_etat_civil(id) ON DELETE CASCADE,
    PRIMARY KEY (utilisateur_id, centre_id)
);

CREATE TABLE historique_connexion (
    id                  BIGSERIAL PRIMARY KEY,
    utilisateur_id      BIGINT NOT NULL REFERENCES utilisateur(id),
    date_connexion      TIMESTAMP NOT NULL DEFAULT now(),
    adresse_ip          VARCHAR(45),
    statut              VARCHAR(20) NOT NULL
                            CHECK (statut IN ('REUSSIE', 'ECHOUEE'))
);

-- RG-AUD-001/002 : écriture seule au niveau applicatif (aucun endpoint
-- PUT/DELETE), alimentée par un aspect transversal (AuditAspect), pas
-- par un mécanisme au niveau base. utilisateur_id nullable : permet
-- l'acteur "Système" (RG-PAR-002, sauvegardes planifiées) sans ligne
-- utilisateur dédiée.
CREATE TABLE journal_activite (
    id                  BIGSERIAL PRIMARY KEY,
    utilisateur_id      BIGINT REFERENCES utilisateur(id),
    module              VARCHAR(50) NOT NULL,
    action              VARCHAR(50) NOT NULL,
    date_heure          TIMESTAMP NOT NULL DEFAULT now(),
    details             TEXT
);

-- Contrainte différée : ferme la dépendance circulaire ouverte section 2.
ALTER TABLE historique_emplacement_registre
    ADD CONSTRAINT fk_hist_emplacement_auteur
    FOREIGN KEY (auteur_id) REFERENCES utilisateur(id);

-- =====================================================================
-- 4. INDEXATION ET PERSONNES
-- =====================================================================

-- RG-PER-002 : statut permet la désactivation (fusion) sans suppression
-- physique — jamais de DELETE sur une fiche personne.
CREATE TABLE personne (
    id                  BIGSERIAL PRIMARY KEY,
    nom                 VARCHAR(100) NOT NULL,
    prenoms             VARCHAR(150) NOT NULL,
    sexe                VARCHAR(1) CHECK (sexe IN ('M', 'F')),
    date_naissance      DATE,
    date_approximative  BOOLEAN NOT NULL DEFAULT FALSE,
    statut              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                            CHECK (statut IN ('ACTIVE', 'FUSIONNEE'))
);

-- Reprise à l'identique de l'extrait fourni en section 5 du Cahier des
-- Charges Techniques (module Indexation), avec ajout de motif_erreur
-- (présent dans Diagramme_Classes.png mais absent de l'extrait texte).
CREATE TABLE fiche_indexation (
    id                  BIGSERIAL PRIMARY KEY,
    -- RG-REG-009 : suppression d'un registre interdite tant qu'une
    -- fiche y fait référence.
    registre_id         BIGINT NOT NULL REFERENCES registre_physique(id) ON DELETE RESTRICT,
    numero_acte         VARCHAR(50) NOT NULL,
    page                INTEGER NOT NULL,
    type_acte_id        BIGINT NOT NULL REFERENCES type_acte(id),
    date_evenement      DATE NOT NULL,
    date_indexation     TIMESTAMP NOT NULL DEFAULT now(),
    agent_id            BIGINT NOT NULL REFERENCES utilisateur(id),
    statut              VARCHAR(20) NOT NULL DEFAULT 'VALIDE'
                            CHECK (statut IN ('VALIDE', 'ERRONEE')),
    motif_erreur        VARCHAR(255),
    -- RG-IDX-008 : unicité de la paire (registre_id, numero_acte)
    CONSTRAINT uq_fiche_registre_numero UNIQUE (registre_id, numero_acte)
);

CREATE TABLE association_personne_acte (
    id                  BIGSERIAL PRIMARY KEY,
    personne_id         BIGINT NOT NULL REFERENCES personne(id),
    fiche_indexation_id BIGINT NOT NULL REFERENCES fiche_indexation(id) ON DELETE CASCADE,
    -- Rôle libre (ex. TITULAIRE, PERE, MERE, ENFANT, TEMOIN...) : liste
    -- exhaustive non documentée dans les sources, laissée en VARCHAR
    -- plutôt qu'un CHECK figé arbitrairement.
    role                VARCHAR(30) NOT NULL,
    CONSTRAINT uq_association_personne_fiche_role UNIQUE (personne_id, fiche_indexation_id, role)
);

CREATE TABLE lien_parente (
    id                      BIGSERIAL PRIMARY KEY,
    personne_id             BIGINT NOT NULL REFERENCES personne(id),
    personne_apparentee_id  BIGINT NOT NULL REFERENCES personne(id),
    -- Type de lien libre (PERE, MERE, CONJOINT, ENFANT...) : même
    -- remarque que ci-dessus, liste non documentée.
    type_lien               VARCHAR(30) NOT NULL,
    mode_creation           VARCHAR(20) NOT NULL
                                CHECK (mode_creation IN ('DEDUIT', 'MANUEL')),
    CONSTRAINT chk_lien_parente_distinct CHECK (personne_id <> personne_apparentee_id)
);

-- =====================================================================
-- 5. NUMÉRISATION (PALIER 2)
-- =====================================================================

-- RG-NUM-002 : une image est associée à une fiche d'indexation
-- existante, jamais l'inverse — fiche_indexation_id NOT NULL.
CREATE TABLE image_numerisee (
    id                  BIGSERIAL PRIMARY KEY,
    fiche_indexation_id BIGINT NOT NULL REFERENCES fiche_indexation(id),
    registre_id         BIGINT NOT NULL REFERENCES registre_physique(id),
    chemin_fichier      VARCHAR(500) NOT NULL,
    date_numerisation   TIMESTAMP NOT NULL DEFAULT now(),
    agent_id            BIGINT NOT NULL REFERENCES utilisateur(id)
);

-- =====================================================================
-- 6. PILOTAGE
-- =====================================================================

CREATE TABLE parametre (
    id                  BIGSERIAL PRIMARY KEY,
    cle                 VARCHAR(100) NOT NULL UNIQUE,
    valeur              VARCHAR(500),
    categorie           VARCHAR(50)
);

CREATE TABLE sauvegarde (
    id                  BIGSERIAL PRIMARY KEY,
    date_execution      TIMESTAMP NOT NULL DEFAULT now(),
    type                VARCHAR(20) NOT NULL
                            CHECK (type IN ('AUTOMATIQUE', 'MANUELLE')),
    statut              VARCHAR(20) NOT NULL
                            CHECK (statut IN ('EN_COURS', 'REUSSIE', 'ECHOUEE')),
    taille_octets       BIGINT,
    chemin              VARCHAR(500)
);

CREATE TABLE rapport (
    id                  BIGSERIAL PRIMARY KEY,
    type                VARCHAR(50) NOT NULL,
    criteres            JSONB,
    utilisateur_id      BIGINT NOT NULL REFERENCES utilisateur(id),
    date_generation     TIMESTAMP NOT NULL DEFAULT now()
);

-- =====================================================================
-- 7. FRONT-OFFICE CITOYEN (PALIER 3 — RG-FO-001, bloqué, non confirmé)
-- =====================================================================
-- Tables créées pour cohérence du schéma complet (26 tables), mais
-- aucune implémentation applicative tant que RG-FO-001 n'est pas levée.

CREATE TABLE demandeur (
    id                  BIGSERIAL PRIMARY KEY,
    nom                 VARCHAR(100) NOT NULL,
    prenoms             VARCHAR(150) NOT NULL,
    email               VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe_hash   VARCHAR(255) NOT NULL
);

CREATE TABLE demande_acte (
    id                  BIGSERIAL PRIMARY KEY,
    demandeur_id        BIGINT NOT NULL REFERENCES demandeur(id),
    type_acte_id        BIGINT NOT NULL REFERENCES type_acte(id),
    fiche_indexation_id BIGINT REFERENCES fiche_indexation(id),
    statut              VARCHAR(20) NOT NULL DEFAULT 'SOUMISE'
                            CHECK (statut IN ('SOUMISE', 'EN_TRAITEMENT', 'DELIVREE', 'REJETEE')),
    date_demande        TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE notification (
    id                  BIGSERIAL PRIMARY KEY,
    demandeur_id        BIGINT NOT NULL REFERENCES demandeur(id),
    demande_id          BIGINT REFERENCES demande_acte(id),
    message             VARCHAR(500) NOT NULL,
    date_envoi          TIMESTAMP NOT NULL DEFAULT now(),
    statut_lu           BOOLEAN NOT NULL DEFAULT FALSE
);

-- =====================================================================
-- INDEX DE RECHERCHE (RG-PER-003, RG-REC-007 — recherche tolérante)
-- =====================================================================

CREATE INDEX idx_personne_nom_trgm ON personne USING gin (nom gin_trgm_ops);
CREATE INDEX idx_personne_prenoms_trgm ON personne USING gin (prenoms gin_trgm_ops);
CREATE INDEX idx_fiche_indexation_numero_acte ON fiche_indexation (numero_acte);
CREATE INDEX idx_registre_physique_numero ON registre_physique (numero_registre);
CREATE INDEX idx_journal_activite_utilisateur ON journal_activite (utilisateur_id);
CREATE INDEX idx_journal_activite_date ON journal_activite (date_heure);

-- =====================================================================
-- DONNÉES DE RÉFÉRENCE MINIMALES (seed indicatif — à valider)
-- =====================================================================
-- Le Cahier des Charges Techniques mentionne un seed pour type_acte et
-- permission sans en donner le contenu exact. Ce qui suit est un jeu de
-- départ raisonnable, à corriger/compléter avant la Phase 2.

INSERT INTO type_acte (libelle, actif) VALUES
    ('Naissance', TRUE),
    ('Mariage', TRUE),
    ('Décès', TRUE);

INSERT INTO permission (module, action, code) VALUES
    ('INDEXATION', 'CREER', 'INDEXATION_CREER'),
    ('INDEXATION', 'MODIFIER', 'INDEXATION_MODIFIER'),
    ('RECHERCHE', 'CONSULTER', 'RECHERCHE_CONSULTER'),
    ('REGISTRE', 'GERER', 'REGISTRE_GERER'),
    ('REGISTRE', 'DEPLACER', 'REGISTRE_DEPLACER'),
    ('PERSONNE', 'GERER', 'PERSONNE_GERER'),
    ('REFERENTIEL', 'GERER', 'REFERENTIEL_GERER'),
    ('UTILISATEUR', 'GERER', 'UTILISATEUR_GERER'),
    ('ROLE', 'GERER', 'ROLE_GERER'),
    ('AUDIT', 'CONSULTER', 'AUDIT_CONSULTER'),
    ('PARAMETRAGE', 'GERER', 'PARAMETRAGE_GERER'),
    ('PILOTAGE', 'CONSULTER', 'PILOTAGE_CONSULTER');
