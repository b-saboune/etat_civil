package tg.civilis.utilisateurs;

import tg.civilis.common.exception.ApiException;
import tg.civilis.rbac.Role;
import tg.civilis.rbac.RoleRepository;
import tg.civilis.rbac.UtilisateurRole;
import tg.civilis.rbac.UtilisateurRoleRepository;
import tg.civilis.referentiels.CentreEtatCivil;
import tg.civilis.referentiels.CentreEtatCivilRepository;
import tg.civilis.utilisateurs.dto.AffecterCentreRequest;
import tg.civilis.utilisateurs.dto.AssignerRoleRequest;
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
    private final UtilisateurRoleRepository utilisateurRoleRepository;
    private final RoleRepository roleRepository;
    private final UtilisateurCentreRepository utilisateurCentreRepository;
    private final CentreEtatCivilRepository centreEtatCivilRepository;

    public AgentService(UtilisateurRepository utilisateurRepository,
                         HistoriqueConnexionRepository historiqueRepository,
                         PasswordEncoder passwordEncoder,
                         UtilisateurRoleRepository utilisateurRoleRepository,
                         RoleRepository roleRepository,
                         UtilisateurCentreRepository utilisateurCentreRepository,
                         CentreEtatCivilRepository centreEtatCivilRepository) {
        this.utilisateurRepository = utilisateurRepository;
        this.historiqueRepository = historiqueRepository;
        this.passwordEncoder = passwordEncoder;
        this.utilisateurRoleRepository = utilisateurRoleRepository;
        this.roleRepository = roleRepository;
        this.utilisateurCentreRepository = utilisateurCentreRepository;
        this.centreEtatCivilRepository = centreEtatCivilRepository;
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

    /**
     * Modele simplifie : un agent porte un role principal a la fois. Affecter
     * un nouveau role remplace le precedent (les permissions effectives sont
     * de toute facon recalculees a la prochaine connexion — RG-RBAC-002).
     */
    @Transactional
    public void assignerRole(Long agentId, AssignerRoleRequest requete) {
        Utilisateur agent = trouver(agentId);
        Role role = roleRepository.findById(requete.roleId())
            .orElseThrow(() -> ApiException.notFound("ROLE_INTROUVABLE", "Role introuvable."));
        utilisateurRoleRepository.deleteByUtilisateurId(agentId);
        UtilisateurRole association = new UtilisateurRole();
        association.setUtilisateur(agent);
        association.setRole(role);
        utilisateurRoleRepository.save(association);
    }

    @Transactional(readOnly = true)
    public List<Long> rolesDeLAgent(Long agentId) {
        return utilisateurRoleRepository.trouverRoleIdsParUtilisateur(agentId);
    }

    /**
     * RG-UTI-001 : un agent peut etre affecte a plusieurs centres. Contrairement
     * au role (un seul a la fois), l'affectation centre est additive : on
     * ajoute une association sans retirer les precedentes.
     */
    @Transactional
    public void affecterCentre(Long agentId, AffecterCentreRequest requete) {
        Utilisateur agent = trouver(agentId);
        CentreEtatCivil centre = centreEtatCivilRepository.findById(requete.centreId())
            .orElseThrow(() -> ApiException.notFound("CENTRE_INTROUVABLE", "Centre introuvable."));
        boolean dejaAffecte = utilisateurCentreRepository.trouverCentreIdsParUtilisateur(agentId)
            .contains(requete.centreId());
        if (dejaAffecte) {
            return;
        }
        UtilisateurCentre association = new UtilisateurCentre();
        association.setUtilisateur(agent);
        association.setCentre(centre);
        utilisateurCentreRepository.save(association);
    }

    @Transactional
    public void retirerCentre(Long agentId, Long centreId) {
        utilisateurCentreRepository.deleteByUtilisateurIdAndCentreId(agentId, centreId);
    }

    @Transactional(readOnly = true)
    public List<Long> centresDeLAgent(Long agentId) {
        return utilisateurCentreRepository.trouverCentreIdsParUtilisateur(agentId);
    }

    private Utilisateur trouver(Long id) {
        return utilisateurRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("AGENT_INTROUVABLE", "Agent introuvable."));
    }
}
