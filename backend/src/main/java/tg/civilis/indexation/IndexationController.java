package tg.civilis.indexation;

import tg.civilis.indexation.dto.CreerFicheIndexationRequest;
import tg.civilis.indexation.dto.MarquerErroneeRequest;
import tg.civilis.indexation.dto.ModifierFicheIndexationRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import tg.civilis.authentification.CivilisUserDetails;

@RestController
@RequestMapping("/api/indexation/fiches")
@Tag(name = "Indexation")
@PreAuthorize("hasAuthority('INDEXATION_CREER') or hasAuthority('INDEXATION_MODIFIER') or hasRole('SUPER_ADMIN')")
public class IndexationController {

    private final IndexationService service;

    public IndexationController(IndexationService service) {
        this.service = service;
    }

    @GetMapping
    public java.util.List<FicheIndexation> lister(@RequestParam(required = false) Long registreId) {
        return registreId == null ? java.util.List.of() : service.listerParRegistre(registreId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FicheIndexation creer(@Valid @RequestBody CreerFicheIndexationRequest requete) {
        return service.creerFiche(requete, agentConnecteId());
    }

    /** RG-IDX-013 : l'auteur d'une fiche est toujours l'utilisateur authentifie, jamais une valeur fournie par le client. */
    private Long agentConnecteId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CivilisUserDetails userDetails) {
            return userDetails.getId();
        }
        throw tg.civilis.common.exception.ApiException.notFound("UTILISATEUR_INTROUVABLE", "Utilisateur authentifie introuvable.");
    }

    @PatchMapping("/{id}/marquer-erronee")
    public FicheIndexation marquerErronee(@PathVariable Long id, @Valid @RequestBody MarquerErroneeRequest requete) {
        return service.marquerErronee(id, requete);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('INDEXATION_MODIFIER') or hasRole('SUPER_ADMIN')")
    public FicheIndexation modifier(@PathVariable Long id, @Valid @RequestBody ModifierFicheIndexationRequest requete) {
        return service.modifierFiche(id, requete);
    }
}
