package tg.civilis.utilisateurs;

import tg.civilis.utilisateurs.dto.CreerAgentRequest;
import tg.civilis.utilisateurs.dto.ReinitialiserMotDePasseRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/agents")
@Tag(name = "Utilisateurs (Agents)")
@PreAuthorize("hasAuthority('UTILISATEUR_GERER') or hasRole('SUPER_ADMIN')")
public class AgentController {

    private final AgentService service;

    public AgentController(AgentService service) {
        this.service = service;
    }

    @GetMapping
    public List<Utilisateur> lister() { return service.lister(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Utilisateur creer(@Valid @RequestBody CreerAgentRequest requete) { return service.creer(requete); }

    @PatchMapping("/{id}/deverrouiller")
    public Utilisateur deverrouiller(@PathVariable Long id) { return service.deverrouiller(id); }

    @PatchMapping("/{id}/desactiver")
    public Utilisateur desactiver(@PathVariable Long id) { return service.desactiver(id); }

    @PatchMapping("/{id}/reactiver")
    public Utilisateur reactiver(@PathVariable Long id) { return service.reactiver(id); }

    @PostMapping("/{id}/reset-password")
    public void reinitialiserMotDePasse(@PathVariable Long id, @Valid @RequestBody ReinitialiserMotDePasseRequest requete) {
        service.reinitialiserMotDePasse(id, requete);
    }

    @GetMapping("/{id}/historique-connexion")
    public List<HistoriqueConnexion> historique(@PathVariable Long id) {
        return service.historiqueConnexion(id);
    }
}
