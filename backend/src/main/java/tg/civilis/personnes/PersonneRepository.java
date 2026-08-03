package tg.civilis.personnes;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PersonneRepository extends JpaRepository<Personne, Long> {

    /**
     * RG-PER-003 / RG-REC-007 : recherche tolerante aux accents/casse.
     * S'appuie sur civilis_unaccent_lower(...) (V5__recherche_insensible_accents.sql,
     * fonction IMMUTABLE enveloppant unaccent()) applique aux DEUX cotes de la
     * comparaison (colonne ET parametre), et sur les index GIN trigram
     * correspondants (idx_personne_nom_trgm_normalise, idx_personne_prenoms_trgm_normalise).
     * similarity() > seuil evite le fameux echec sec (RG-REC-006) en remontant
     * des correspondances approchees. Limite documentee en V5 concernant les
     * caracteres propres aux orthographes des langues togolaises.
     */
    @Query(value = """
        SELECT * FROM personne p
        WHERE p.statut = 'ACTIVE'
          AND (similarity(civilis_unaccent_lower(p.nom), civilis_unaccent_lower(:nom)) > 0.2
               OR similarity(civilis_unaccent_lower(p.prenoms), civilis_unaccent_lower(:prenoms)) > 0.2
               OR civilis_unaccent_lower(p.nom) ILIKE '%' || civilis_unaccent_lower(:nom) || '%'
               OR civilis_unaccent_lower(p.prenoms) ILIKE '%' || civilis_unaccent_lower(:prenoms) || '%')
        ORDER BY GREATEST(
            similarity(civilis_unaccent_lower(p.nom), civilis_unaccent_lower(:nom)),
            similarity(civilis_unaccent_lower(p.prenoms), civilis_unaccent_lower(:prenoms))
        ) DESC
        LIMIT 20
        """, nativeQuery = true)
    List<Personne> rechercheApprochee(@Param("nom") String nom, @Param("prenoms") String prenoms);
}
