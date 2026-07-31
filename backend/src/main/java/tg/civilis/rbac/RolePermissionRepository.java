package tg.civilis.rbac;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {
    List<RolePermission> findByRoleId(Long roleId);
    void deleteByRoleId(Long roleId);

    /**
     * RG-RBAC-002 : resout dynamiquement les codes de permission accordes a un
     * utilisateur via les roles qui lui sont affectes (utilisateur_role), en
     * ignorant les roles desactives et les octrois revoques (accordee = false).
     */
    @Query(value = """
        SELECT DISTINCT p.code
        FROM utilisateur_role ur
        JOIN role r ON r.id = ur.role_id AND r.actif = true
        JOIN role_permission rp ON rp.role_id = ur.role_id AND rp.accordee = true
        JOIN permission p ON p.id = rp.permission_id
        WHERE ur.utilisateur_id = :utilisateurId
        """, nativeQuery = true)
    List<String> trouverCodesPermissionParUtilisateur(@Param("utilisateurId") Long utilisateurId);
}
