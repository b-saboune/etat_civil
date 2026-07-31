package tg.civilis.registres;

import tg.civilis.registres.dto.CouvertureRecensementDTO;
import tg.civilis.registres.dto.DeplacerRegistreRequest;
import tg.civilis.registres.dto.RegistreDTO;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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
    public List<RegistrePhysique> lister() { return service.lister(); }

    @GetMapping("/{id}")
    public RegistrePhysique obtenir(@PathVariable Long id) { return service.obtenir(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'SUPER_ADMIN', 'AGENT')")
    public RegistrePhysique creer(@Valid @RequestBody RegistreDTO dto) { return service.creer(dto); }

    @PostMapping("/{id}/deplacer")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'SUPER_ADMIN', 'AGENT')")
    public RegistrePhysique deplacer(@PathVariable Long id, @Valid @RequestBody DeplacerRegistreRequest requete) {
        return service.deplacer(id, requete);
    }

    @GetMapping("/{id}/couverture-recensement")
    public CouvertureRecensementDTO couvertureRecensement(@PathVariable Long id) {
        return service.couvertureRecensement(id);
    }
}
