package tg.civilis.authentification;

import tg.civilis.authentification.dto.LoginRequest;
import tg.civilis.authentification.dto.LoginResponse;
import tg.civilis.authentification.dto.RefreshRequest;
import tg.civilis.common.exception.ApiException;
import tg.civilis.rbac.PermissionRepository;
import tg.civilis.rbac.RolePermissionRepository;
import tg.civilis.utilisateurs.HistoriqueConnexion;
import tg.civilis.utilisateurs.HistoriqueConnexionRepository;
import tg.civilis.utilisateurs.Utilisateur;
import tg.civilis.utilisateurs.UtilisateurRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * RG-AUTH-001 : un compte INACTIF ou VERROUILLE recoit un 403 explicite,
 * mais jamais un message qui permette de deviner si le compte existe.
 * RG-UTI-009 : verrouillage automatique apres N tentatives, deverrouillage
 * exclusivement manuel par un Administrateur (endpoint utilisateurs, pas ici).
 * RG-UTI-003 : chaque tentative de connexion (succes ou echec) est journalisee
 * dans historique_connexion, consultable depuis la fiche de l'agent.
 * RG-RBAC-002 / RG-ADM-002 : les permissions effectives sont resolues a la
 * connexion (matrice role_permission), sauf pour le Super Administrateur qui
 * recoit systematiquement l'ensemble des codes existants (bypass RBAC).
 */
@Service
public class AuthService {

    private static final int MAX_TENTATIVES_ECHEC = 5;

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RolePermissionRepository rolePermissionRepository;
    private final PermissionRepository permissionRepository;
    private final HistoriqueConnexionRepository historiqueConnexionRepository;

    public AuthService(UtilisateurRepository utilisateurRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
                        RolePermissionRepository rolePermissionRepository, PermissionRepository permissionRepository,
                        HistoriqueConnexionRepository historiqueConnexionRepository) {
        this.utilisateurRepository = utilisateurRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.rolePermissionRepository = rolePermissionRepository;
        this.permissionRepository = permissionRepository;
        this.historiqueConnexionRepository = historiqueConnexionRepository;
    }

    @Transactional
    public LoginResponse authentifier(LoginRequest request) {
        Utilisateur utilisateur = utilisateurRepository.findByIdentifiant(request.identifiant())
            .orElseThrow(() -> ApiException.badRequest("AUTH_INVALIDE", "Identifiant ou mot de passe incorrect."));

        if ("VERROUILLE".equals(utilisateur.getStatut()) || "INACTIF".equals(utilisateur.getStatut())) {
            enregistrerHistorique(utilisateur, "ECHOUEE");
            throw ApiException.forbidden("COMPTE_INDISPONIBLE", "Ce compte ne peut pas se connecter actuellement.");
        }

        if (!passwordEncoder.matches(request.motDePasse(), utilisateur.getMotDePasseHash())) {
            enregistrerEchec(utilisateur);
            enregistrerHistorique(utilisateur, "ECHOUEE");
            throw ApiException.badRequest("AUTH_INVALIDE", "Identifiant ou mot de passe incorrect.");
        }

        utilisateur.setTentativesEchec(0);
        utilisateurRepository.save(utilisateur);
        enregistrerHistorique(utilisateur, "REUSSIE");

        return construireReponse(utilisateur);
    }

    @Transactional
    public LoginResponse rafraichir(RefreshRequest request) {
        String token = request.refreshToken();
        if (!jwtService.estUnTokenDeRafraichissement(token)) {
            throw ApiException.badRequest("TOKEN_INVALIDE", "Jeton de rafraichissement invalide.");
        }
        String identifiant = jwtService.extraireIdentifiant(token);
        if (!jwtService.estValide(token, identifiant)) {
            throw ApiException.badRequest("TOKEN_EXPIRE", "Jeton de rafraichissement expire ou invalide.");
        }
        Utilisateur utilisateur = utilisateurRepository.findByIdentifiant(identifiant)
            .orElseThrow(() -> ApiException.badRequest("AUTH_INVALIDE", "Compte introuvable."));
        if (!"ACTIF".equals(utilisateur.getStatut())) {
            throw ApiException.forbidden("COMPTE_INDISPONIBLE", "Ce compte ne peut pas se connecter actuellement.");
        }
        return construireReponse(utilisateur);
    }

    private LoginResponse construireReponse(Utilisateur utilisateur) {
        CivilisUserDetails userDetails = new CivilisUserDetails(utilisateur);
        List<String> permissions = resoudrePermissions(utilisateur);
        String accessToken = jwtService.genererAccessToken(userDetails, permissions);
        String refreshToken = jwtService.genererRefreshToken(userDetails);
        return new LoginResponse(accessToken, refreshToken, utilisateur.getIdentifiant(), utilisateur.getTypeCompte());
    }

    private List<String> resoudrePermissions(Utilisateur utilisateur) {
        if ("SUPER_ADMIN".equals(utilisateur.getTypeCompte())) {
            return permissionRepository.trouverTousLesCodes();
        }
        return rolePermissionRepository.trouverCodesPermissionParUtilisateur(utilisateur.getId());
    }

    private void enregistrerEchec(Utilisateur utilisateur) {
        int tentatives = utilisateur.getTentativesEchec() + 1;
        utilisateur.setTentativesEchec(tentatives);
        if (tentatives >= MAX_TENTATIVES_ECHEC) {
            utilisateur.setStatut("VERROUILLE");
        }
        utilisateurRepository.save(utilisateur);
    }

    private void enregistrerHistorique(Utilisateur utilisateur, String statut) {
        HistoriqueConnexion entree = new HistoriqueConnexion();
        entree.setUtilisateur(utilisateur);
        entree.setStatut(statut);
        historiqueConnexionRepository.save(entree);
    }
}
