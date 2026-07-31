package tg.civilis.rbac;

import tg.civilis.common.exception.ApiException;
import tg.civilis.rbac.dto.MatricePermissionsRequest;
import tg.civilis.rbac.dto.RoleDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RbacService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;

    public RbacService(RoleRepository roleRepository, PermissionRepository permissionRepository,
                        RolePermissionRepository rolePermissionRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.rolePermissionRepository = rolePermissionRepository;
    }

    @Transactional(readOnly = true)
    public List<Role> listerRoles() { return roleRepository.findAll(); }

    @Transactional(readOnly = true)
    public List<Permission> listerPermissions() { return permissionRepository.findAll(); }

    @Transactional(readOnly = true)
    public List<Long> listerPermissionIdsDuRole(Long roleId) {
        return rolePermissionRepository.findByRoleId(roleId).stream()
            .filter(RolePermission::isAccordee)
            .map(rp -> rp.getPermission().getId())
            .collect(Collectors.toList());
    }

    @Transactional
    public Role creerRole(RoleDTO dto) {
        Role role = new Role();
        role.setLibelle(dto.libelle());
        role.setDescription(dto.description());
        return roleRepository.save(role);
    }

    /**
     * RG-RBAC-002 : remplacement complet de la matrice pour ce role, dans
     * une seule transaction (on supprime tout puis on recree).
     */
    @Transactional
    public void remplacerPermissions(Long roleId, MatricePermissionsRequest requete) {
        Role role = roleRepository.findById(roleId)
            .orElseThrow(() -> ApiException.notFound("ROLE_INTROUVABLE", "Role introuvable."));

        rolePermissionRepository.deleteByRoleId(roleId);

        for (Long permissionId : requete.permissionIds()) {
            Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> ApiException.notFound("PERMISSION_INTROUVABLE", "Permission introuvable : " + permissionId));
            RolePermission rp = new RolePermission();
            rp.setRole(role);
            rp.setPermission(permission);
            rp.setAccordee(true);
            rolePermissionRepository.save(rp);
        }
    }
}
