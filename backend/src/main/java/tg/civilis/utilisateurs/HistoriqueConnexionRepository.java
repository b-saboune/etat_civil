package tg.civilis.utilisateurs;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HistoriqueConnexionRepository extends JpaRepository<HistoriqueConnexion, Long> {
    List<HistoriqueConnexion> findByUtilisateurIdOrderByDateConnexionDesc(Long utilisateurId);
}
