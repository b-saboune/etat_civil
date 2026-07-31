package tg.civilis.referentiels;

import tg.civilis.referentiels.dto.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Acces reserve a l'Administrateur (section 11.5 du prompt maitre) : les
 * referentiels sont des donnees de configuration, pas de la consultation
 * courante par un Agent.
 */
@RestController
@RequestMapping("/api/referentiels")
@Tag(name = "Referentiels")
@PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'SUPER_ADMIN')")
public class ReferentielsController {

    private final ReferentielsService service;

    public ReferentielsController(ReferentielsService service) {
        this.service = service;
    }

    @GetMapping("/communes")
    public List<Commune> listerCommunes() { return service.listerCommunes(); }

    @PostMapping("/communes")
    @ResponseStatus(HttpStatus.CREATED)
    public Commune creerCommune(@Valid @RequestBody CommuneDTO dto) { return service.creerCommune(dto); }

    @GetMapping("/centres")
    public List<CentreEtatCivil> listerCentres() { return service.listerCentres(); }

    @PostMapping("/centres")
    @ResponseStatus(HttpStatus.CREATED)
    public CentreEtatCivil creerCentre(@Valid @RequestBody CentreDTO dto) { return service.creerCentre(dto); }

    @PatchMapping("/centres/{id}/desactiver")
    public ResponseEntity<Void> desactiverCentre(@PathVariable Long id) {
        service.desactiverCentre(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/salles")
    public List<SalleArchive> listerSalles() { return service.listerSalles(); }

    @PostMapping("/salles")
    @ResponseStatus(HttpStatus.CREATED)
    public SalleArchive creerSalle(@Valid @RequestBody SalleDTO dto) { return service.creerSalle(dto); }

    @GetMapping("/rayonnages")
    public List<Rayonnage> listerRayonnages() { return service.listerRayonnages(); }

    @PostMapping("/rayonnages")
    @ResponseStatus(HttpStatus.CREATED)
    public Rayonnage creerRayonnage(@Valid @RequestBody RayonnageDTO dto) { return service.creerRayonnage(dto); }

    @GetMapping("/types-acte")
    public List<TypeActe> listerTypesActe() { return service.listerTypesActe(); }

    @PatchMapping("/types-acte/{id}/desactiver")
    public ResponseEntity<Void> desactiverTypeActe(@PathVariable Long id) {
        service.desactiverTypeActe(id);
        return ResponseEntity.noContent().build();
    }
}
