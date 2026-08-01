package tg.civilis.notifications;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tg.civilis.common.exception.ApiException;
import tg.civilis.notifications.dto.NotificationDTO;
import tg.civilis.utilisateurs.Utilisateur;
import tg.civilis.utilisateurs.UtilisateurRepository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * RG-NOTIF-001 (nouvelle) : trois niveaux uniquement (INFORMATION,
 * ATTENTION, CRITIQUE — section 20 du Prompt Maitre V3). Chaque
 * notification porte un "lien" de contexte->action quand pertinent
 * (section 46 : "notification -> contexte -> action").
 */
@Service
public class NotificationInterneService {

    private final NotificationInterneRepository repository;
    private final UtilisateurRepository utilisateurRepository;

    public NotificationInterneService(NotificationInterneRepository repository, UtilisateurRepository utilisateurRepository) {
        this.repository = repository;
        this.utilisateurRepository = utilisateurRepository;
    }

    /** Diffusion a tous les utilisateurs authentifies (utilisateur_id NULL). */
    @Transactional
    public void diffuser(String niveau, String module, String message, String lien) {
        NotificationInterne notification = new NotificationInterne();
        notification.setUtilisateur(null);
        notification.setNiveau(niveau);
        notification.setModule(module);
        notification.setMessage(message);
        notification.setLien(lien);
        repository.save(notification);
    }

    @Transactional
    public void notifierUtilisateur(Long utilisateurId, String niveau, String module, String message, String lien) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId).orElse(null);
        NotificationInterne notification = new NotificationInterne();
        notification.setUtilisateur(utilisateur);
        notification.setNiveau(niveau);
        notification.setModule(module);
        notification.setMessage(message);
        notification.setLien(lien);
        repository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> listerPourUtilisateur(Long utilisateurId) {
        return repository.trouverPourUtilisateur(utilisateurId).stream()
            .map(n -> new NotificationDTO(n.getId(), n.getNiveau(), n.getModule(), n.getMessage(), n.getLien(), n.getDateCreation(), n.isLu()))
            .toList();
    }

    @Transactional(readOnly = true)
    public long compterNonLues(Long utilisateurId) {
        return repository.compterNonLuesPourUtilisateur(utilisateurId);
    }

    @Transactional
    public void marquerLue(Long id) {
        NotificationInterne notification = repository.findById(id)
            .orElseThrow(() -> ApiException.notFound("NOTIFICATION_INTROUVABLE", "Notification introuvable."));
        notification.setLu(true);
        notification.setDateLecture(LocalDateTime.now());
        repository.save(notification);
    }
}
