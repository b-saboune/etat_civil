package tg.civilis.personnes;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PersonneRepository extends JpaRepository<Personne, Long> {

    /**
     * RG-PER-003 / RG-REC-007 : recherche tolerante aux accents/casse.
     * unaccent(lower(...)) est applique aux DEUX cotes de la comparaison
     * (colonne ET parametre) directement dans la requete (extension
     * unaccent, V5__recherche_insensible_accents.sql) — usage standard de
     * unaccent(), sans index fonctionnel dedie (voir la migration V5 pour
     * la justification de ce choix : un index fonctionnel s'est avere
     * fragile a la construction, non testable sans instance PostgreSQL
     * reelle dans l'environnement de developpement).
     * similarity() sur la colonne brute (via l'index GIN existant,
     * idx_personne_nom_trgm/idx_personne_prenoms_trgm) reste le filtre
     * principal, rapide ; la comparaison unaccent/ILIKE est un filtre
     * complementaire qui evite le fameux echec sec (RG-REC-006) quand les
     * accents different sans que la similarite trigram brute suffise.
     * Limite documentee en V5 concernant les caracteres propres aux
     * orthographes des langues togolaises.
     */
    @Query(value = """
        SELECT * FROM personne p
        WHERE p.statut = 'ACTIVE'
          AND (similarity(p.nom, :nom) > 0.2
               OR similarity(p.prenoms, :prenoms) > 0.2
               OR unaccent(lower(p.nom)) ILIKE '%' || unaccent(lower(:nom)) || '%'
               OR unaccent(lower(p.prenoms)) ILIKE '%' || unaccent(lower(:prenoms)) || '%')
        ORDER BY GREATEST(similarity(p.nom, :nom), similarity(p.prenoms, :prenoms)) DESC
        LIMIT 20
        """, nativeQuery = true)
    List<Personne> rechercheApprochee(@Param("nom") String nom, @Param("prenoms") String prenoms);
}
