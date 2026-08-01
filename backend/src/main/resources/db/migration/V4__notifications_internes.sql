-- Notifications internes destinees aux agents/administrateurs (section 20/46
-- du Prompt Maitre V3). A ne pas confondre avec la table "notification"
-- existante (V1), qui concerne exclusivement les demandeurs citoyens du
-- Palier 3 (front-office, bloque par RG-FO-001) : deux publics, deux
-- tables, aucune modification de l'existant.
--
-- utilisateur_id NULL = notification diffusee a tous les utilisateurs
-- authentifies (ex. echec de sauvegarde). Simplification volontaire pour
-- le Palier 1 : pas de ciblage par role, documente comme limite connue.
CREATE TABLE notification_interne (
    id                  BIGSERIAL PRIMARY KEY,
    utilisateur_id      BIGINT REFERENCES utilisateur(id),
    niveau              VARCHAR(20) NOT NULL
                            CHECK (niveau IN ('INFORMATION', 'ATTENTION', 'CRITIQUE')),
    module              VARCHAR(50) NOT NULL,
    message             VARCHAR(500) NOT NULL,
    lien                VARCHAR(200),
    date_creation       TIMESTAMP NOT NULL DEFAULT now(),
    lu                  BOOLEAN NOT NULL DEFAULT FALSE,
    date_lecture        TIMESTAMP
);

CREATE INDEX idx_notification_interne_utilisateur ON notification_interne(utilisateur_id, lu);
