package tg.civilis.audit;

import tg.civilis.utilisateurs.Utilisateur;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * RG-AUD-002 : point d'ecriture unique du journal, appele exclusivement par
 * AuditAspect (aspect transversal), jamais par un appel manuel disperse
 * dans chaque service metier.
 */
@Service
public class JournalActiviteService {

    private final JournalActiviteRepository repository;

    public JournalActiviteService(JournalActiviteRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void enregistrer(Utilisateur utilisateur, String module, String action, String details) {
        JournalActivite entree = new JournalActivite();
        entree.setUtilisateur(utilisateur);
        entree.setModule(module);
        entree.setAction(action);
        entree.setDetails(details);
        repository.save(entree);
    }

    /** Acteur "Systeme" (RG-PAR-002) : utilisateur nul, module/action explicites. */
    @Transactional
    public void enregistrerSysteme(String module, String action, String details) {
        enregistrer(null, module, action, details);
    }
}
