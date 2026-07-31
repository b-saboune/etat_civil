package tg.civilis.utilisateurs;

import tg.civilis.utilisateurs.dto.CreerAdministrateurRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Utilisateur creer(@Valid @RequestBody CreerAdministrateurRequest requete) {
        return service.creerAdministrateur(requete);
    }

    @PatchMapping("/{id}/suspendre")
    public Utilisateur suspendre(@PathVariable Long id) { return service.suspendre(id); }

    @PatchMapping("/{id}/revoquer")
    public Utilisateur revoquer(@PathVariable Long id) { return service.revoquer(id); }
}
