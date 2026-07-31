package tg.civilis.pilotage;

import tg.civilis.pilotage.dto.TableauBordDTO;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Pilotage")
@PreAuthorize("hasAuthority('PILOTAGE_CONSULTER') or hasRole('SUPER_ADMIN')")
public class TableauBordController {

    private final TableauBordService service;

    public TableauBordController(TableauBordService service) {
        this.service = service;
    }

    @GetMapping("/api/tableau-de-bord")
    public TableauBordDTO obtenir() {
        return service.obtenirTableauBord();
    }
}
