package tg.civilis.notifications;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationInterneRepository extends JpaRepository<NotificationInterne, Long> {

    @Query("SELECT n FROM NotificationInterne n WHERE n.utilisateur.id = :utilisateurId OR n.utilisateur IS NULL ORDER BY n.dateCreation DESC")
    List<NotificationInterne> trouverPourUtilisateur(@Param("utilisateurId") Long utilisateurId);

    @Query("SELECT count(n) FROM NotificationInterne n WHERE (n.utilisateur.id = :utilisateurId OR n.utilisateur IS NULL) AND n.lu = false")
    long compterNonLuesPourUtilisateur(@Param("utilisateurId") Long utilisateurId);
}
