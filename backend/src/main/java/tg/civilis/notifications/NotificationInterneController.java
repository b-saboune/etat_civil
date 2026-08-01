package tg.civilis.notifications;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import tg.civilis.authentification.CivilisUserDetails;
import tg.civilis.common.exception.ApiException;
import tg.civilis.notifications.dto.NotificationDTO;

import java.util.List;
import java.util.Map;

/**
 * Pas de @PreAuthorize specifique : toute personne authentifiee consulte
 * ses propres notifications (+ les diffusions generales) — aucune donnee
 * sensible d'autrui n'est exposee (le filtrage est fait cote requete SQL,
 * jamais cote client).
 */
@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notifications")
public class NotificationInterneController {

    private final NotificationInterneService service;

    public NotificationInterneController(NotificationInterneService service) {
        this.service = service;
    }

    @GetMapping
    public List<NotificationDTO> lister() {
        return service.listerPourUtilisateur(utilisateurConnecteId());
    }

    @GetMapping("/nombre-non-lues")
    public Map<String, Long> nombreNonLues() {
        return Map.of("nombre", service.compterNonLues(utilisateurConnecteId()));
    }

    @PatchMapping("/{id}/lue")
    public void marquerLue(@PathVariable Long id) {
        service.marquerLue(id);
    }

    private Long utilisateurConnecteId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CivilisUserDetails userDetails) {
            return userDetails.getId();
        }
        throw ApiException.notFound("UTILISATEUR_INTROUVABLE", "Utilisateur authentifie introuvable.");
    }
}
