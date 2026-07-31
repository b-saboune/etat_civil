package tg.civilis.utilisateurs;

import tg.civilis.utilisateurs.dto.AgentDTO;
import tg.civilis.utilisateurs.dto.ReinitialiserMotDePasseRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/agents")
@Tag(name = "Utilisateurs (Agents)")
@PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'SUPER_ADMIN')")
public class AgentController {

    private final AgentService service;

    public AgentController(AgentService service) {
        this.service = service;
    }

    @GetMapping
    public List<Utilisateur> lister() { return service.lister(); }

    @PatchMapping("/{id}/deverrouiller")
    public Utilisateur deverrouiller(@PathVariable Long id) { return service.deverrouiller(id); }

    @PostMapping("/{id}/reset-password")
    public void reinitialiserMotDePasse(@PathVariable Long id, @Valid @RequestBody ReinitialiserMotDePasseRequest requete) {
        service.reinitialiserMotDePasse(id, requete);
    }

    @GetMapping("/{id}/historique-connexion")
    public List<HistoriqueConnexion> historique(@PathVariable Long id) {
        return service.historiqueConnexion(id);
    }
}
