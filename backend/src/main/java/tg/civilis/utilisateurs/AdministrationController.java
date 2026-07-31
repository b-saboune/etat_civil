package tg.civilis.utilisateurs;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admins")
@Tag(name = "Administration (Super Administrateur)")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdministrationController {

    private final AdministrationService service;

    public AdministrationController(AdministrationService service) {
        this.service = service;
    }

    @GetMapping
    public List<Utilisateur> lister() { return service.listerAdministrateurs(); }

    @PatchMapping("/{id}/suspendre")
    public Utilisateur suspendre(@PathVariable Long id) { return service.suspendre(id); }

    @PatchMapping("/{id}/revoquer")
    public Utilisateur revoquer(@PathVariable Long id) { return service.revoquer(id); }
}
