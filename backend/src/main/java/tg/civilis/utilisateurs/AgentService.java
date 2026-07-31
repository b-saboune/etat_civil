package tg.civilis.utilisateurs;

import tg.civilis.common.exception.ApiException;
import tg.civilis.utilisateurs.dto.CreerAgentRequest;
import tg.civilis.utilisateurs.dto.ReinitialiserMotDePasseRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * RG-UTI-009 : deverrouillage exclusivement manuel par un Administrateur,
 * aucun mecanisme automatique programme. RG-UTI-002 : un agent desactive
 * conserve la paternite de ses fiches passees (aucune reassignation, aucune
 * suppression physique — la "suppression" d'un agent est une desactivation).
 * RG-UTI-003 : reinitialisation de mot de passe accessible a l'Administrateur
 * ET a l'agent lui-meme (l'identite de l'appelant est verifiee par le
 * controleur via @PreAuthorize, pas ici).
 */
@Service
public class AgentService {

    private final UtilisateurRepository utilisateurRepository;
    private final HistoriqueConnexionRepository historiqueRepository;
    private final PasswordEncoder passwordEncoder;

    public AgentService(UtilisateurRepository utilisateurRepository,
                         HistoriqueConnexionRepository historiqueRepository,
                         PasswordEncoder passwordEncoder) {
        this.utilisateurRepository = utilisateurRepository;
        this.historiqueRepository = historiqueRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<Utilisateur> lister() { return utilisateurRepository.findAll(); }

    @Transactional
    public Utilisateur creer(CreerAgentRequest requete) {
        utilisateurRepository.findByIdentifiant(requete.identifiant()).ifPresent(u -> {
            throw ApiException.conflict("IDENTIFIANT_EXISTANT", "Cet identifiant est deja utilise.");
        });
        Utilisateur agent = new Utilisateur();
        agent.setIdentifiant(requete.identifiant());
        agent.setMotDePasseHash(passwordEncoder.encode(requete.motDePasseInitial()));
        agent.setTypeCompte("AGENT");
        agent.setStatut("ACTIF");
        return utilisateurRepository.save(agent);
    }

    @Transactional
    public Utilisateur deverrouiller(Long id) {
        Utilisateur agent = trouver(id);
        agent.setStatut("ACTIF");
        agent.setTentativesEchec(0);
        return utilisateurRepository.save(agent);
    }

    @Transactional
    public Utilisateur desactiver(Long id) {
        Utilisateur agent = trouver(id);
        agent.setStatut("INACTIF");
        return utilisateurRepository.save(agent);
    }

    @Transactional
    public Utilisateur reactiver(Long id) {
        Utilisateur agent = trouver(id);
        agent.setStatut("ACTIF");
        agent.setTentativesEchec(0);
        return utilisateurRepository.save(agent);
    }

    @Transactional
    public void reinitialiserMotDePasse(Long id, ReinitialiserMotDePasseRequest requete) {
        Utilisateur agent = trouver(id);
        agent.setMotDePasseHash(passwordEncoder.encode(requete.nouveauMotDePasse()));
        agent.setTentativesEchec(0);
        utilisateurRepository.save(agent);
    }

    @Transactional(readOnly = true)
    public List<HistoriqueConnexion> historiqueConnexion(Long id) {
        return historiqueRepository.findByUtilisateurIdOrderByDateConnexionDesc(id);
    }

    private Utilisateur trouver(Long id) {
        return utilisateurRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("AGENT_INTROUVABLE", "Agent introuvable."));
    }
}
