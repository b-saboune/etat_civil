package tg.civilis.registres;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RegistrePhysiqueRepository extends JpaRepository<RegistrePhysique, Long> {

    @Query(value = "SELECT count(*) FROM fiche_indexation f WHERE f.registre_id = :registreId", nativeQuery = true)
    long compterFichesIndexation(@Param("registreId") Long registreId);
}
