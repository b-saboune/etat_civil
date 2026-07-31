package tg.civilis.authentification;

import tg.civilis.authentification.dto.LoginRequest;
import tg.civilis.authentification.dto.LoginResponse;
import tg.civilis.common.exception.ApiException;
import tg.civilis.utilisateurs.Utilisateur;
import tg.civilis.utilisateurs.UtilisateurRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * RG-AUTH-001 : un compte INACTIF ou VERROUILLE recoit un 403 explicite,
 * mais jamais un message qui permette de deviner si le compte existe.
 * RG-UTI-009 : verrouillage automatique apres N tentatives, deverrouillage
 * exclusivement manuel par un Administrateur (endpoint utilisateurs, pas ici).
 */
@Service
public class AuthService {

    private static final int MAX_TENTATIVES_ECHEC = 5;

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UtilisateurRepository utilisateurRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.utilisateurRepository = utilisateurRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public LoginResponse authentifier(LoginRequest request) {
        Utilisateur utilisateur = utilisateurRepository.findByIdentifiant(request.identifiant())
            .orElseThrow(() -> ApiException.badRequest("AUTH_INVALIDE", "Identifiant ou mot de passe incorrect."));

        if ("VERROUILLE".equals(utilisateur.getStatut()) || "INACTIF".equals(utilisateur.getStatut())) {
            throw ApiException.forbidden("COMPTE_INDISPONIBLE", "Ce compte ne peut pas se connecter actuellement.");
        }

        if (!passwordEncoder.matches(request.motDePasse(), utilisateur.getMotDePasseHash())) {
            enregistrerEchec(utilisateur);
            throw ApiException.badRequest("AUTH_INVALIDE", "Identifiant ou mot de passe incorrect.");
        }

        utilisateur.setTentativesEchec(0);
        utilisateurRepository.save(utilisateur);

        CivilisUserDetails userDetails = new CivilisUserDetails(utilisateur);
        String accessToken = jwtService.genererAccessToken(userDetails);
        String refreshToken = jwtService.genererRefreshToken(userDetails);

        return new LoginResponse(accessToken, refreshToken, utilisateur.getIdentifiant(), utilisateur.getTypeCompte());
    }

    private void enregistrerEchec(Utilisateur utilisateur) {
        int tentatives = utilisateur.getTentativesEchec() + 1;
        utilisateur.setTentativesEchec(tentatives);
        if (tentatives >= MAX_TENTATIVES_ECHEC) {
            utilisateur.setStatut("VERROUILLE");
        }
        utilisateurRepository.save(utilisateur);
    }
}
