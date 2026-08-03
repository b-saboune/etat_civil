package tg.civilis.pilotage;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import tg.civilis.indexation.FicheIndexation;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;

public interface TableauBordRepository extends Repository<FicheIndexation, Long> {

    // --- Vue globale (ADMINISTRATEUR / SUPER_ADMIN : pas de perimetre de centre) ---

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

    // --- Vue restreinte (RG-TDB-001 : AGENT, filtre sur ses centres affectes) ---
    // Note : appelees uniquement avec une liste non vide (garde faite cote service,
    // "IN ()" est invalide en SQL) ; personne est comptee via son association a une
    // fiche rattachee a un registre d'un des centres autorises (personne n'a pas de
    // centre_id propre dans le schema).

    @Query(value = """
        SELECT count(*) FROM fiche_indexation fi
        JOIN registre_physique r ON r.id = fi.registre_id
        WHERE r.centre_id IN (:centreIds)
        """, nativeQuery = true)
    long compterFichesParCentres(@Param("centreIds") List<Long> centreIds);

    @Query(value = """
        SELECT count(DISTINCT p.id) FROM personne p
        JOIN association_personne_acte apa ON apa.personne_id = p.id
        JOIN fiche_indexation fi ON fi.id = apa.fiche_indexation_id
        JOIN registre_physique r ON r.id = fi.registre_id
        WHERE p.statut = 'ACTIVE' AND r.centre_id IN (:centreIds)
        """, nativeQuery = true)
    long compterPersonnesParCentres(@Param("centreIds") List<Long> centreIds);

    @Query(value = "SELECT count(*) FROM registre_physique WHERE centre_id IN (:centreIds)", nativeQuery = true)
    long compterRegistresParCentres(@Param("centreIds") List<Long> centreIds);

    @Query(value = "SELECT count(*) FROM centre_etat_civil WHERE statut = 'ACTIF' AND id IN (:centreIds)", nativeQuery = true)
    long compterCentresParCentres(@Param("centreIds") List<Long> centreIds);

    @Query(value = """
        SELECT count(*) FROM fiche_indexation fi
        JOIN registre_physique r ON r.id = fi.registre_id
        WHERE r.centre_id IN (:centreIds) AND fi.date_indexation >= now() - interval '7 days'
        """, nativeQuery = true)
    long compterFichesCetteSemaineParCentres(@Param("centreIds") List<Long> centreIds);

    @Query(value = """
        SELECT ta.libelle AS type_acte, count(fi.id) AS total
        FROM fiche_indexation fi
        JOIN type_acte ta ON ta.id = fi.type_acte_id
        JOIN registre_physique r ON r.id = fi.registre_id
        WHERE r.centre_id IN (:centreIds)
        GROUP BY ta.libelle
        """, nativeQuery = true)
    List<Object[]> repartitionParTypeActeParCentres(@Param("centreIds") List<Long> centreIds);

    @Query(value = """
        SELECT c.nom AS centre, count(DISTINCT fi.id) AS nb_fiches, count(DISTINCT r.id) AS nb_registres
        FROM centre_etat_civil c
        LEFT JOIN registre_physique r ON r.centre_id = c.id
        LEFT JOIN fiche_indexation fi ON fi.registre_id = r.id
        WHERE c.id IN (:centreIds)
        GROUP BY c.nom
        ORDER BY c.nom
        """, nativeQuery = true)
    List<Object[]> chargeParCentreParCentres(@Param("centreIds") List<Long> centreIds);

    @Query(value = """
        SELECT to_char(date_trunc('month', fi.date_indexation), 'YYYY-MM') AS mois, count(*) AS total
        FROM fiche_indexation fi
        JOIN registre_physique r ON r.id = fi.registre_id
        WHERE r.centre_id IN (:centreIds)
        GROUP BY 1
        ORDER BY 1
        """, nativeQuery = true)
    List<Object[]> evolutionMensuelleParCentres(@Param("centreIds") List<Long> centreIds);
}
