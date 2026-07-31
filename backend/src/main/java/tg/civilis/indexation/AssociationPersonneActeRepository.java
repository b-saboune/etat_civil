package tg.civilis.indexation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssociationPersonneActeRepository extends JpaRepository<AssociationPersonneActe, Long> {
    List<AssociationPersonneActe> findByPersonneId(Long personneId);
}
