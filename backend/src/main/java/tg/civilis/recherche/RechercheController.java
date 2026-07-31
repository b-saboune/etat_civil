package tg.civilis.recherche;

import tg.civilis.recherche.dto.RechercheRequest;
import tg.civilis.recherche.dto.ResultatRechercheDTO;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/recherche")
@Tag(name = "Recherche et localisation")
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
        @RequestParam(required = false) String dateFin
    ) {
        var resultats = rechercheService.rechercher(new RechercheRequest(nom, prenoms, typeActe, dateDebut, dateFin));
        return ResponseEntity.ok(resultats);
    }
}
