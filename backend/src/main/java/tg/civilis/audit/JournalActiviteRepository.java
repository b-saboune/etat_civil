package tg.civilis.audit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface JournalActiviteRepository extends JpaRepository<JournalActivite, Long>, JpaSpecificationExecutor<JournalActivite> {
}
