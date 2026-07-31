package tg.civilis.referentiels;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CentreEtatCivilRepository extends JpaRepository<CentreEtatCivil, Long> {

    @Query(value = "SELECT count(*) FROM utilisateur_centre uc JOIN utilisateur u ON u.id = uc.utilisateur_id " +
        "WHERE uc.centre_id = :centreId AND u.statut = 'ACTIF'", nativeQuery = true)
    long compterUtilisateursActifs(@Param("centreId") Long centreId);

    @Query(value = "SELECT count(*) FROM registre_physique r WHERE r.centre_id = :centreId AND r.statut = 'EN_SERVICE'",
        nativeQuery = true)
    long compterRegistresEnService(@Param("centreId") Long centreId);
}
