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
 * Les lectures (GET) sont accessibles a tout utilisateur authentifie : elles
 * alimentent les listes deroulantes (recherche avancee, formulaires d'indexation,
 * creation de registre...). Seules les ecritures sont reservees a la gestion
 * des referentiels (section 11.5 du prompt maitre).
 */
@RestController
@RequestMapping("/api/referentiels")
@Tag(name = "Referentiels")
public class ReferentielsController {

    private static final String GERER = "hasAuthority('REFERENTIEL_GERER') or hasRole('SUPER_ADMIN')";

    private final ReferentielsService service;

    public ReferentielsController(ReferentielsService service) {
        this.service = service;
    }

    @GetMapping("/communes")
    public List<Commune> listerCommunes() { return service.listerCommunes(); }

    @PostMapping("/communes")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(GERER)
    public Commune creerCommune(@Valid @RequestBody CommuneDTO dto) { return service.creerCommune(dto); }

    @PatchMapping("/communes/{id}")
    @PreAuthorize(GERER)
    public Commune modifierCommune(@PathVariable Long id, @Valid @RequestBody CommuneDTO dto) {
        return service.modifierCommune(id, dto);
    }

    @GetMapping("/centres")
    public List<CentreEtatCivil> listerCentres() { return service.listerCentres(); }

    @PostMapping("/centres")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(GERER)
    public CentreEtatCivil creerCentre(@Valid @RequestBody CentreDTO dto) { return service.creerCentre(dto); }

    @PatchMapping("/centres/{id}")
    @PreAuthorize(GERER)
    public CentreEtatCivil modifierCentre(@PathVariable Long id, @Valid @RequestBody CentreDTO dto) {
        return service.modifierCentre(id, dto);
    }

    @PatchMapping("/centres/{id}/desactiver")
    @PreAuthorize(GERER)
    public ResponseEntity<Void> desactiverCentre(@PathVariable Long id) {
        service.desactiverCentre(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/centres/{id}/reactiver")
    @PreAuthorize(GERER)
    public ResponseEntity<Void> reactiverCentre(@PathVariable Long id) {
        service.reactiverCentre(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/salles")
    public List<SalleArchive> listerSalles() { return service.listerSalles(); }

    @PostMapping("/salles")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(GERER)
    public SalleArchive creerSalle(@Valid @RequestBody SalleDTO dto) { return service.creerSalle(dto); }

    @PatchMapping("/salles/{id}")
    @PreAuthorize(GERER)
    public SalleArchive modifierSalle(@PathVariable Long id, @Valid @RequestBody SalleDTO dto) {
        return service.modifierSalle(id, dto);
    }

    @GetMapping("/rayonnages")
    public List<Rayonnage> listerRayonnages() { return service.listerRayonnages(); }

    @PostMapping("/rayonnages")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(GERER)
    public Rayonnage creerRayonnage(@Valid @RequestBody RayonnageDTO dto) { return service.creerRayonnage(dto); }

    @PatchMapping("/rayonnages/{id}")
    @PreAuthorize(GERER)
    public Rayonnage modifierRayonnage(@PathVariable Long id, @Valid @RequestBody RayonnageDTO dto) {
        return service.modifierRayonnage(id, dto);
    }

    @GetMapping("/types-acte")
    public List<TypeActe> listerTypesActe() { return service.listerTypesActe(); }

    @PatchMapping("/types-acte/{id}/desactiver")
    @PreAuthorize(GERER)
    public ResponseEntity<Void> desactiverTypeActe(@PathVariable Long id) {
        service.desactiverTypeActe(id);
        return ResponseEntity.noContent().build();
    }
}
