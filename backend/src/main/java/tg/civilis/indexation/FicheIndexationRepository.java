package tg.civilis.indexation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FicheIndexationRepository extends JpaRepository<FicheIndexation, Long> {

    List<FicheIndexation> findByRegistreIdOrderByDateIndexationDesc(Long registreId);
}
