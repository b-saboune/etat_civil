-- RG-PER-003 / RG-REC-007 : la recherche doit etre insensible a la casse ET
-- aux accents. Les index pg_trgm crees en V1 (idx_personne_nom_trgm,
-- idx_personne_prenoms_trgm) portent sur la colonne brute : une recherche
-- "Kodjo" ne remontait donc pas fiablement une fiche saisie "Kôdjô", le
-- calcul de similarite pg_trgm n'etant pas lui-meme insensible aux accents.
--
-- Ajout additif (aucun index ni colonne existante retiree) : extension
-- unaccent + fonction wrapper IMMUTABLE (unaccent() est STABLE par defaut,
-- ce qui interdit son usage direct dans un index fonctionnel) + nouveaux
-- index trigram sur la forme normalisee (minuscules + sans accent), utilises
-- par PersonneRepository.rechercheApprochee.
--
-- Limite documentee (RG-PER-003 : "a tester explicitement avec des cas reels
-- avant mise en production") : unaccent() traite les diacritiques latins
-- standards (é, è, ê, à, ô, ù, ç...) via decomposition Unicode, mais ne
-- transcrit pas les caracteres propres aux orthographes des langues
-- togolaises (ex. ɖ, ɣ, ŋ, ɔ, ɛ) qui ne sont pas des lettres latines
-- accentuees mais des caracteres distincts. Une table de translitteration
-- dediee, validee avec des locuteurs/donnees reels, reste necessaire avant
-- une mise en production couvrant ces cas — hors de portee d'une correction
-- technique isolee sans validation linguistique.

CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION civilis_unaccent_lower(texte TEXT)
RETURNS TEXT AS $$
    SELECT lower(unaccent('unaccent', coalesce(texte, '')));
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;

CREATE INDEX IF NOT EXISTS idx_personne_nom_trgm_normalise
    ON personne USING gin (civilis_unaccent_lower(nom) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_personne_prenoms_trgm_normalise
    ON personne USING gin (civilis_unaccent_lower(prenoms) gin_trgm_ops);
