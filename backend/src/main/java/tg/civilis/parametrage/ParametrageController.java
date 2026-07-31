package tg.civilis.parametrage;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tg.civilis.parametrage.dto.ConfirmerRestaurationRequest;

import java.util.List;
import java.util.Map;

@RestController
@Tag(name = "Parametrage et sauvegarde")
public class ParametrageController {

    private final ParametrageService service;

    public ParametrageController(ParametrageService service) {
        this.service = service;
    }

    @GetMapping("/api/parametres")
    @PreAuthorize("hasAuthority('PARAMETRAGE_GERER') or hasRole('SUPER_ADMIN')")
    public List<Parametre> lister() { return service.listerParametres(); }

    @PatchMapping("/api/parametres/{id}")
    @PreAuthorize("hasAuthority('PARAMETRAGE_GERER') or hasRole('SUPER_ADMIN')")
    public Parametre modifier(@PathVariable Long id, @RequestBody Map<String, String> corps) {
        return service.modifierParametre(id, corps.get("valeur"));
    }

    @PostMapping("/api/sauvegardes/executer")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Sauvegarde executer() { return service.executerSauvegardeManuelle(); }

    @GetMapping("/api/sauvegardes")
    @PreAuthorize("hasAuthority('PARAMETRAGE_GERER') or hasRole('SUPER_ADMIN')")
    public List<Sauvegarde> lister2() { return service.listerSauvegardes(); }

    @PostMapping("/api/sauvegardes/{id}/restaurer")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public void restaurer(@PathVariable Long id, @Valid @RequestBody ConfirmerRestaurationRequest requete) {
        service.restaurer(id, requete);
    }
}
