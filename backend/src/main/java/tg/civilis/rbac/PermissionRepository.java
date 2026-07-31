package tg.civilis.rbac;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PermissionRepository extends JpaRepository<Permission, Long> {

    /** RG-ADM-002 : le Super Administrateur recoit tous les codes existants, sans passer par la matrice. */
    @Query("SELECT p.code FROM Permission p")
    List<String> trouverTousLesCodes();
}
