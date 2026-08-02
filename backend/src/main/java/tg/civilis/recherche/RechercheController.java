package tg.civilis.recherche;

import tg.civilis.recherche.dto.RechercheRequest;
import tg.civilis.recherche.dto.ResultatRechercheDTO;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/recherche")
@Tag(name = "Recherche et localisation")
@PreAuthorize("hasAuthority('RECHERCHE_CONSULTER') or hasRole('SUPER_ADMIN')")
public class RechercheController {

    private final RechercheService rechercheService;

    public RechercheController(RechercheService rechercheService) {
        this.rechercheService = rechercheService;
    }

    @GetMapping
    public ResponseEntity<List<ResultatRechercheDTO>> rechercher(
        @RequestParam(required = false) String nom,
        @RequestParam(required = false) String prenoms,
        @RequestParam(required = false) String typeActe,
        @RequestParam(required = false) String dateDebut,
        @RequestParam(required = false) String dateFin,
        // Section 11.9 du prompt maitre : recherche par affiliation (ex. ne
        // retrouver le nom saisi que lorsqu'il apparait comme PERE/MERE d'un
        // acte, pas dans n'importe quel role) — parametre prevu des l'origine
        // mais jusque-la absent de l'implementation.
        @RequestParam(required = false) String roleAffiliation
    ) {
        var resultats = rechercheService.rechercher(new RechercheRequest(nom, prenoms, typeActe, dateDebut, dateFin, roleAffiliation));
        return ResponseEntity.ok(resultats);
    }
}
