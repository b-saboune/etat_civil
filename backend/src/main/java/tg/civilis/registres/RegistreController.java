package tg.civilis.registres;

import tg.civilis.authentification.CivilisUserDetails;
import tg.civilis.registres.dto.ChangerStatutRegistreRequest;
import tg.civilis.registres.dto.CouvertureRecensementDTO;
import tg.civilis.registres.dto.DeplacerRegistreRequest;
import tg.civilis.registres.dto.RegistreDTO;
import tg.civilis.registres.dto.RegistreVueDTO;
import tg.civilis.registres.dto.HistoriqueDeplacementDTO;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/registres")
@Tag(name = "Registres physiques")
public class RegistreController {

    private final RegistreService service;

    public RegistreController(RegistreService service) {
        this.service = service;
    }

    @GetMapping
    public List<RegistreVueDTO> lister(@RequestParam(required = false) Long centreId,
                                        @RequestParam(required = false) Integer annee,
                                        @RequestParam(required = false) String statut) {
        return service.lister(centreId, annee, statut);
    }

    @GetMapping("/{id}")
    public RegistreVueDTO obtenir(@PathVariable Long id) { return service.obtenirVue(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('REGISTRE_GERER') or hasRole('SUPER_ADMIN')")
    public RegistreVueDTO creer(@Valid @RequestBody RegistreDTO dto) { return service.creer(dto); }

    @PostMapping("/{id}/deplacer")
    @PreAuthorize("hasAuthority('REGISTRE_DEPLACER') or hasRole('SUPER_ADMIN')")
    public RegistreVueDTO deplacer(@PathVariable Long id, @Valid @RequestBody DeplacerRegistreRequest requete) {
        return service.deplacer(id, requete, agentConnecteId());
    }

    /** RG-REG-010 bis : meme correctif que RG-IDX-013 — l'auteur d'un deplacement est toujours l'utilisateur authentifie. */
    private Long agentConnecteId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CivilisUserDetails userDetails) {
            return userDetails.getId();
        }
        throw tg.civilis.common.exception.ApiException.notFound("UTILISATEUR_INTROUVABLE", "Utilisateur authentifie introuvable.");
    }

    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasAuthority('REGISTRE_GERER') or hasRole('SUPER_ADMIN')")
    public RegistreVueDTO changerStatut(@PathVariable Long id, @Valid @RequestBody ChangerStatutRegistreRequest requete) {
        return service.changerStatut(id, requete.statut());
    }

    @GetMapping("/{id}/couverture-recensement")
    public CouvertureRecensementDTO couvertureRecensement(@PathVariable Long id) {
        return service.couvertureRecensement(id);
    }

    @GetMapping("/{id}/historique")
    public List<HistoriqueDeplacementDTO> historique(@PathVariable Long id) {
        return service.historiqueDeplacements(id);
    }
}
