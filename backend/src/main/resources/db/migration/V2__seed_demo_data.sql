-- Donnees de demonstration realistes (Togo) pour Phase 17 / soutenance.
-- Ne remplace jamais schema_etat_civil.sql : ne fait qu inserer des lignes.

-- Referentiels geographiques
INSERT INTO commune (nom) VALUES ('Lome'), ('Kara'), ('Sokode');

INSERT INTO centre_etat_civil (commune_id, nom, adresse, statut) VALUES
    (1, 'Centre d''Etat Civil de Lome I', 'Avenue de la Liberation, Lome', 'ACTIF'),
    (1, 'Centre d''Etat Civil de Lome II - Be', 'Quartier Be, Lome', 'ACTIF'),
    (2, 'Centre d''Etat Civil de Kara', 'Route Nationale 1, Kara', 'ACTIF');

INSERT INTO salle_archive (centre_id, designation) VALUES
    (1, 'Salle d''archives A - Rez-de-chaussee'),
    (1, 'Salle d''archives B - Etage 1'),
    (2, 'Salle d''archives Be'),
    (3, 'Salle d''archives Kara Centrale');

INSERT INTO rayonnage (salle_id, designation) VALUES
    (1, 'Rayonnage A1'), (1, 'Rayonnage A2'), (1, 'Rayonnage A3'),
    (2, 'Rayonnage B1'), (2, 'Rayonnage B2'),
    (3, 'Rayonnage Be-1'),
    (4, 'Rayonnage Kara-1');

-- Registres physiques (type_acte 1=Naissance, 2=Mariage, 3=Deces, deja seedes en V1)
INSERT INTO registre_physique (centre_id, rayonnage_id, type_acte_id, numero_registre, annee, nb_pages, statut) VALUES
    (1, 1, 1, 'REG-NAI-2018-001', 2018, 200, 'EN_SERVICE'),
    (1, 1, 1, 'REG-NAI-2019-001', 2019, 200, 'EN_SERVICE'),
    (1, 2, 2, 'REG-MAR-2020-001', 2020, 150, 'EN_SERVICE'),
    (2, 6, 1, 'REG-NAI-2017-014', 2017, 180, 'ARCHIVE'),
    (3, 7, 3, 'REG-DEC-2021-002', 2021, 120, 'EN_SERVICE');

-- Compte de demonstration : mot de passe = "Civilis#2026" (BCrypt)
-- Hash genere avec BCryptPasswordEncoder (force 10)
INSERT INTO utilisateur (identifiant, mot_de_passe_hash, type_compte, statut, tentatives_echec) VALUES
    ('admin.demo', '$2b$10$DLEh2BG5KkZqPB/v9GxSj.wJglPpLdSYF9itKqI9.i05GnwvlvzzO', 'ADMINISTRATEUR', 'ACTIF', 0),
    ('agent.lome1', '$2b$10$DLEh2BG5KkZqPB/v9GxSj.wJglPpLdSYF9itKqI9.i05GnwvlvzzO', 'AGENT', 'ACTIF', 0);

INSERT INTO utilisateur_centre (utilisateur_id, centre_id) VALUES (1, 1), (1, 2), (1, 3), (2, 1);

INSERT INTO role (libelle, description, actif) VALUES
    ('Administrateur Centre', 'Gestion complete du centre', TRUE),
    ('Agent Indexation', 'Indexation et recherche', TRUE);

INSERT INTO role_permission (role_id, permission_id, accordee)
    SELECT 1, id, TRUE FROM permission;
INSERT INTO role_permission (role_id, permission_id, accordee)
    SELECT 2, id, TRUE FROM permission WHERE code IN ('INDEXATION_CREER','INDEXATION_MODIFIER','RECHERCHE_CONSULTER');

INSERT INTO utilisateur_role (utilisateur_id, role_id) VALUES (1, 1), (2, 2);

-- Personnes et fiches d'indexation de demonstration
INSERT INTO personne (nom, prenoms, sexe, date_naissance, date_approximative, statut) VALUES
    ('AMEGAN', 'Kossi Edem', 'M', '2018-03-12', FALSE, 'ACTIVE'),
    ('AMEGAN', 'Ama Efua', 'F', '1990-07-01', TRUE, 'ACTIVE'),
    ('AMEGAN', 'Kwami', 'M', '1985-01-15', FALSE, 'ACTIVE'),
    ('KONLANI', 'Essowavana', 'M', '2019-11-03', FALSE, 'ACTIVE'),
    ('KONLANI', 'Abra', 'F', '1992-05-20', FALSE, 'ACTIVE');

INSERT INTO fiche_indexation (registre_id, numero_acte, page, type_acte_id, date_evenement, agent_id, statut) VALUES
    (1, '045', 23, 1, '2018-03-12', 2, 'VALIDE'),
    (2, '112', 56, 1, '2019-11-03', 2, 'VALIDE');

INSERT INTO association_personne_acte (personne_id, fiche_indexation_id, role) VALUES
    (1, 1, 'TITULAIRE'),
    (2, 1, 'MERE'),
    (3, 1, 'PERE'),
    (4, 2, 'TITULAIRE'),
    (5, 2, 'MERE');
