package tg.civilis.personnes;

import tg.civilis.personnes.dto.FusionnerPersonnesRequest;
import tg.civilis.personnes.dto.PersonneDTO;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/personnes")
@Tag(name = "Personnes")
public class PersonneController {

    private final PersonneService service;

    public PersonneController(PersonneService service) {
        this.service = service;
    }

    @GetMapping("/recherche")
    @PreAuthorize("hasAuthority('RECHERCHE_CONSULTER') or hasAuthority('PERSONNE_GERER') or hasRole('SUPER_ADMIN')")
    public List<Personne> rechercher(@RequestParam(required = false) String nom, @RequestParam(required = false) String prenoms) {
        return service.rechercher(nom, prenoms);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('PERSONNE_GERER') or hasRole('SUPER_ADMIN')")
    public Personne creer(@Valid @RequestBody PersonneDTO dto) { return service.creer(dto); }

    @PostMapping("/fusionner")
    @PreAuthorize("hasAuthority('PERSONNE_GERER') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> fusionner(@Valid @RequestBody FusionnerPersonnesRequest requete) {
        service.fusionner(requete);
        return ResponseEntity.noContent().build();
    }
}
