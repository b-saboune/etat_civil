-- RG-ADM-001 : le compte SUPER_ADMIN ne peut jamais etre cree via un endpoint
-- de l'application (aucun /api/... ne permet de creer un SUPER_ADMIN). La
-- seule voie autorisee est une migration Flyway (executee au demarrage,
-- hors de toute requete HTTP) ou un acces direct a la base. Ce fichier est
-- cette voie de bootstrap.
--
-- Identifiant : superadmin
-- Mot de passe initial : Civilis!Superadmin2026  (a changer immediatement
-- apres la premiere connexion — aucune politique de renouvellement force
-- n'est appliquee automatiquement, RG-UTI-005).
--
-- Hash BCrypt (force 10), genere hors application :
-- $2b$10$5sBVQrBKGkTfIOJHbckwpuYDiMsk3JOM7UhN7n6/X9z8v8dODvl0K

INSERT INTO utilisateur (identifiant, mot_de_passe_hash, type_compte, statut, tentatives_echec)
SELECT 'superadmin', '$2b$10$5sBVQrBKGkTfIOJHbckwpuYDiMsk3JOM7UhN7n6/X9z8v8dODvl0K', 'SUPER_ADMIN', 'ACTIF', 0
WHERE NOT EXISTS (SELECT 1 FROM utilisateur WHERE identifiant = 'superadmin');
