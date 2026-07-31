package tg.civilis.rapports;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import tg.civilis.authentification.CivilisUserDetails;
import tg.civilis.common.exception.ApiException;
import tg.civilis.rapports.dto.GenererRapportRequest;
import tg.civilis.rapports.dto.RapportResumeDTO;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/rapports")
@Tag(name = "Rapports")
@PreAuthorize("hasAuthority('PILOTAGE_CONSULTER') or hasRole('SUPER_ADMIN')")
public class RapportController {

    private final RapportService service;

    public RapportController(RapportService service) {
        this.service = service;
    }

    @PostMapping("/generer")
    @ResponseStatus(HttpStatus.CREATED)
    public Rapport generer(@Valid @RequestBody GenererRapportRequest requete) {
        return service.generer(requete, utilisateurConnecteId());
    }

    @GetMapping
    public List<RapportResumeDTO> lister() {
        return service.lister();
    }

    @GetMapping("/{id}")
    public Rapport obtenir(@PathVariable Long id) {
        return service.obtenir(id);
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<byte[]> exporter(@PathVariable Long id, @RequestParam(defaultValue = "csv") String format) {
        if (!"csv".equalsIgnoreCase(format)) {
            // PDF/XLSX necessitent des bibliotheques supplementaires non
            // disponibles hors ligne dans cet environnement de build ; CSV
            // reste un format d'export tabulaire ouvert et immediatement lisible
            // dans tout tableur, cf. ROADMAP_CONFORMITE.md.
            throw ApiException.badRequest("FORMAT_NON_SUPPORTE", "Seul le format CSV est disponible pour le moment.");
        }
        String csv = service.exporterCsv(id);
        byte[] contenu = csv.getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=rapport-" + id + ".csv")
            .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
            .body(contenu);
    }

    private Long utilisateurConnecteId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CivilisUserDetails userDetails) {
            return userDetails.getId();
        }
        throw ApiException.notFound("UTILISATEUR_INTROUVABLE", "Utilisateur authentifie introuvable.");
    }
}
