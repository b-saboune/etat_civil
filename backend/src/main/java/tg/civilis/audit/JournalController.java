package tg.civilis.audit;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** RG-AUD-001 : aucun verbe autre que GET n'est expose ici, sans exception. */
@RestController
@RequestMapping("/api/journal")
@Tag(name = "Audit et tracabilite")
@PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'SUPER_ADMIN')")
public class JournalController {

    private final JournalActiviteRepository repository;

    public JournalController(JournalActiviteRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<JournalActivite> rechercher(@RequestParam(required = false) Long utilisateur,
                                             @RequestParam(required = false) String module) {
        Specification<JournalActivite> spec = Specification.where(null);
        if (utilisateur != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("utilisateur").get("id"), utilisateur));
        }
        if (module != null && !module.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("module"), module));
        }
        return repository.findAll(spec);
    }
}
