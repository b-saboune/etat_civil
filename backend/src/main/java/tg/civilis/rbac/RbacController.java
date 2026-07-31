package tg.civilis.rbac;

import tg.civilis.rbac.dto.MatricePermissionsRequest;
import tg.civilis.rbac.dto.RoleDTO;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Tag(name = "RBAC - Roles et permissions")
@PreAuthorize("hasAuthority('ROLE_GERER') or hasRole('SUPER_ADMIN')")
public class RbacController {

    private final RbacService service;

    public RbacController(RbacService service) {
        this.service = service;
    }

    @GetMapping("/api/roles")
    public List<Role> listerRoles() { return service.listerRoles(); }

    @PostMapping("/api/roles")
    @ResponseStatus(HttpStatus.CREATED)
    public Role creerRole(@Valid @RequestBody RoleDTO dto) { return service.creerRole(dto); }

    @GetMapping("/api/permissions")
    public List<Permission> listerPermissions() { return service.listerPermissions(); }

    @PutMapping("/api/roles/{id}/permissions")
    public ResponseEntity<Void> remplacerPermissions(@PathVariable Long id, @RequestBody MatricePermissionsRequest requete) {
        service.remplacerPermissions(id, requete);
        return ResponseEntity.noContent().build();
    }
}
