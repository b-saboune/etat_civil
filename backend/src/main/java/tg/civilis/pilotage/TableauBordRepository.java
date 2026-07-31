package tg.civilis.pilotage;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;

public interface TableauBordRepository extends Repository<Object, Long> {

    @Query(value = "SELECT count(*) FROM fiche_indexation", nativeQuery = true)
    long compterFiches();

    @Query(value = "SELECT count(*) FROM personne WHERE statut = 'ACTIVE'", nativeQuery = true)
    long compterPersonnes();

    @Query(value = "SELECT count(*) FROM registre_physique", nativeQuery = true)
    long compterRegistres();

    @Query(value = "SELECT count(*) FROM centre_etat_civil WHERE statut = 'ACTIF'", nativeQuery = true)
    long compterCentres();

    @Query(value = "SELECT count(*) FROM fiche_indexation WHERE date_indexation >= now() - interval '7 days'", nativeQuery = true)
    long compterFichesCetteSemaine();

    @Query(value = """
        SELECT ta.libelle AS type_acte, count(fi.id) AS total
        FROM fiche_indexation fi JOIN type_acte ta ON ta.id = fi.type_acte_id
        GROUP BY ta.libelle
        """, nativeQuery = true)
    List<Object[]> repartitionParTypeActe();

    @Query(value = """
        SELECT c.nom AS centre, count(DISTINCT fi.id) AS nb_fiches, count(DISTINCT r.id) AS nb_registres
        FROM centre_etat_civil c
        LEFT JOIN registre_physique r ON r.centre_id = c.id
        LEFT JOIN fiche_indexation fi ON fi.registre_id = r.id
        GROUP BY c.nom
        ORDER BY c.nom
        """, nativeQuery = true)
    List<Object[]> chargeParCentre();

    @Query(value = """
        SELECT to_char(date_trunc('month', date_indexation), 'YYYY-MM') AS mois, count(*) AS total
        FROM fiche_indexation
        GROUP BY 1
        ORDER BY 1
        """, nativeQuery = true)
    List<Object[]> evolutionMensuelle();
}
