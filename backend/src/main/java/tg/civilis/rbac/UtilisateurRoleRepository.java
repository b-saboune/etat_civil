package tg.civilis.rbac;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UtilisateurRoleRepository extends JpaRepository<UtilisateurRole, UtilisateurRoleId> {

    void deleteByUtilisateurId(Long utilisateurId);

    @Query("SELECT ur.role.id FROM UtilisateurRole ur WHERE ur.utilisateur.id = :utilisateurId")
    List<Long> trouverRoleIdsParUtilisateur(@Param("utilisateurId") Long utilisateurId);
}
