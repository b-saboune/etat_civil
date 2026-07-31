package tg.civilis.utilisateurs;

import tg.civilis.common.exception.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * RG-ADM-001 : ce service ne cree JAMAIS de compte SUPER_ADMIN (aucune
 * methode ne le permet) — uniquement gestion des comptes ADMINISTRATEUR.
 * RG-ADM-002 : le Super Administrateur court-circuite le RBAC en amont
 * (SecurityConfig / PreAuthorize), il n'apparait jamais dans cette liste.
 * RG-ADM-003 : suspension/revocation confirmee explicitement cote frontend
 * avant l'appel a ce service (pas d'action en un clic).
 */
@Service
public class AdministrationService {

    private final UtilisateurRepository utilisateurRepository;

    public AdministrationService(UtilisateurRepository utilisateurRepository) {
        this.utilisateurRepository = utilisateurRepository;
    }

    @Transactional(readOnly = true)
    public List<Utilisateur> listerAdministrateurs() {
        return utilisateurRepository.findAll().stream()
            .filter(u -> "ADMINISTRATEUR".equals(u.getTypeCompte()))
            .toList();
    }

    @Transactional
    public Utilisateur suspendre(Long id) {
        Utilisateur admin = trouverAdministrateur(id);
        admin.setStatut("INACTIF");
        return utilisateurRepository.save(admin);
    }

    @Transactional
    public Utilisateur revoquer(Long id) {
        Utilisateur admin = trouverAdministrateur(id);
        admin.setStatut("INACTIF");
        return utilisateurRepository.save(admin);
    }

    private Utilisateur trouverAdministrateur(Long id) {
        Utilisateur utilisateur = utilisateurRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("ADMINISTRATEUR_INTROUVABLE", "Administrateur introuvable."));
        if (!"ADMINISTRATEUR".equals(utilisateur.getTypeCompte())) {
            throw ApiException.badRequest("PAS_UN_ADMINISTRATEUR", "Cet utilisateur n'est pas un compte Administrateur.");
        }
        return utilisateur;
    }
}
