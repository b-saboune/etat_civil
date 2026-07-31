package tg.civilis.rapports;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RapportRepository extends JpaRepository<Rapport, Long> {

    List<Rapport> findAllByOrderByDateGenerationDesc();
}
