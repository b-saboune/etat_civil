package tg.civilis.personnes;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LienParenteRepository extends JpaRepository<LienParente, Long> {

    @Query("SELECT l FROM LienParente l WHERE l.personne.id = :personneId ORDER BY l.typeLien")
    List<LienParente> trouverPourPersonne(@Param("personneId") Long personneId);

    Optional<LienParente> findByPersonneIdAndPersonneApparenteeIdAndTypeLien(
        Long personneId, Long personneApparenteeId, String typeLien);
}
