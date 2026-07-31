package tg.civilis.audit;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** RG-AUD-001 : aucun verbe autre que GET n'est expose ici, sans exception. */
@RestController
@RequestMapping("/api/journal")
@Tag(name = "Audit et tracabilite")
@PreAuthorize("hasAuthority('AUDIT_CONSULTER') or hasRole('SUPER_ADMIN')")
public class JournalController {

    private final JournalActiviteRepository repository;

    public JournalController(JournalActiviteRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<JournalActivite> rechercher(@RequestParam(required = false) Long utilisateur,
                                             @RequestParam(required = false) String module,
                                             @RequestParam(required = false) String dateDebut,
                                             @RequestParam(required = false) String dateFin) {
        Specification<JournalActivite> spec = Specification.where(null);
        if (utilisateur != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("utilisateur").get("id"), utilisateur));
        }
        if (module != null && !module.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("module"), module));
        }
        LocalDateTime debut = parseDebutJournee(dateDebut);
        if (debut != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("dateHeure"), debut));
        }
        LocalDateTime fin = parseFinJournee(dateFin);
        if (fin != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("dateHeure"), fin));
        }
        return repository.findAll(spec);
    }

    private LocalDateTime parseDebutJournee(String valeur) {
        if (valeur == null || valeur.isBlank()) return null;
        try {
            return LocalDate.parse(valeur.trim()).atStartOfDay();
        } catch (Exception e) {
            return null;
        }
    }

    private LocalDateTime parseFinJournee(String valeur) {
        if (valeur == null || valeur.isBlank()) return null;
        try {
            return LocalDate.parse(valeur.trim()).atTime(23, 59, 59);
        } catch (Exception e) {
            return null;
        }
    }
}
