package tg.civilis.personnes;

import tg.civilis.personnes.dto.CreerLienParenteRequest;
import tg.civilis.personnes.dto.FusionnerPersonnesRequest;
import tg.civilis.personnes.dto.LienParenteDTO;
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
    private final LienParenteService lienParenteService;

    public PersonneController(PersonneService service, LienParenteService lienParenteService) {
        this.service = service;
        this.lienParenteService = lienParenteService;
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

    // Affiliation / filiation (section 11.7 du prompt maitre, cf. LienParente) :
    // fonctionnalite prevue depuis l'origine mais jusque-la totalement absente
    // (aucun endpoint, aucun ecran) alors meme que la table lien_parente
    // existait deja en base.
    @GetMapping("/{id}/liens")
    @PreAuthorize("hasAuthority('RECHERCHE_CONSULTER') or hasAuthority('PERSONNE_GERER') or hasRole('SUPER_ADMIN')")
    public List<LienParenteDTO> listerLiens(@PathVariable Long id) {
        return lienParenteService.listerPourPersonne(id);
    }

    @PostMapping("/liens")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('PERSONNE_GERER') or hasRole('SUPER_ADMIN')")
    public void creerLien(@Valid @RequestBody CreerLienParenteRequest requete) {
        lienParenteService.creerManuel(requete);
    }
}
