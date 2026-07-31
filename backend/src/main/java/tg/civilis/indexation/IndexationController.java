package tg.civilis.indexation;

import tg.civilis.indexation.dto.CreerFicheIndexationRequest;
import tg.civilis.indexation.dto.MarquerErroneeRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/indexation/fiches")
@Tag(name = "Indexation")
@PreAuthorize("hasAuthority('INDEXATION_CREER') or hasAuthority('INDEXATION_MODIFIER') or hasRole('SUPER_ADMIN')")
public class IndexationController {

    private final IndexationService service;

    public IndexationController(IndexationService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FicheIndexation creer(@Valid @RequestBody CreerFicheIndexationRequest requete) {
        return service.creerFiche(requete);
    }

    @PatchMapping("/{id}/marquer-erronee")
    public FicheIndexation marquerErronee(@PathVariable Long id, @Valid @RequestBody MarquerErroneeRequest requete) {
        return service.marquerErronee(id, requete);
    }
}
