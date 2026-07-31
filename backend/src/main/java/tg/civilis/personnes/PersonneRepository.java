package tg.civilis.personnes;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PersonneRepository extends JpaRepository<Personne, Long> {

    /**
     * RG-PER-003 / RG-REC-007 : recherche tolerante aux accents/casse,
     * appuyee sur l'index GIN pg_trgm cree en base (idx_personne_nom_trgm,
     * idx_personne_prenoms_trgm). similarity() > seuil evite le fameux
     * echec sec (RG-REC-006) en remontant des correspondances approchees.
     */
    @Query(value = """
        SELECT * FROM personne p
        WHERE p.statut = 'ACTIVE'
          AND (similarity(p.nom, :nom) > 0.2 OR similarity(p.prenoms, :prenoms) > 0.2
               OR p.nom ILIKE '%' || :nom || '%' OR p.prenoms ILIKE '%' || :prenoms || '%')
        ORDER BY GREATEST(similarity(p.nom, :nom), similarity(p.prenoms, :prenoms)) DESC
        LIMIT 20
        """, nativeQuery = true)
    List<Personne> rechercheApprochee(@Param("nom") String nom, @Param("prenoms") String prenoms);
}
