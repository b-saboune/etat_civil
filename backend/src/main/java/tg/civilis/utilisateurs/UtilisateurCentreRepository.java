package tg.civilis.utilisateurs;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UtilisateurCentreRepository extends JpaRepository<UtilisateurCentre, UtilisateurCentreId> {

    void deleteByUtilisateurIdAndCentreId(Long utilisateurId, Long centreId);

    @Query("SELECT uc.centre.id FROM UtilisateurCentre uc WHERE uc.utilisateur.id = :utilisateurId")
    List<Long> trouverCentreIdsParUtilisateur(@Param("utilisateurId") Long utilisateurId);
}
