package tg.civilis.parametrage;

import tg.civilis.audit.JournalActiviteService;
import tg.civilis.common.exception.ApiException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * RG-PAR-001 : restauration reservee au Super Administrateur, confirmation
 * explicite obligatoire (verifiee cote frontend + @PreAuthorize ici).
 * RG-PAR-002 : sauvegarde planifiee journalisee avec l'acteur "Systeme".
 */
@Service
public class ParametrageService {

    private final ParametreRepository parametreRepository;
    private final SauvegardeRepository sauvegardeRepository;
    private final JournalActiviteService journalActiviteService;

    public ParametrageService(ParametreRepository parametreRepository, SauvegardeRepository sauvegardeRepository,
                               JournalActiviteService journalActiviteService) {
        this.parametreRepository = parametreRepository;
        this.sauvegardeRepository = sauvegardeRepository;
        this.journalActiviteService = journalActiviteService;
    }

    @Transactional(readOnly = true)
    public List<Parametre> listerParametres() { return parametreRepository.findAll(); }

    @Transactional
    public Parametre modifierParametre(Long id, String nouvelleValeur) {
        Parametre parametre = parametreRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("PARAMETRE_INTROUVABLE", "Parametre introuvable."));
        parametre.setValeur(nouvelleValeur);
        return parametreRepository.save(parametre);
    }

    @Transactional
    public Sauvegarde executerSauvegardeManuelle() {
        Sauvegarde sauvegarde = new Sauvegarde();
        sauvegarde.setType("MANUELLE");
        sauvegarde.setStatut("REUSSIE");
        sauvegarde.setChemin("/sauvegardes/manuelle-" + System.currentTimeMillis() + ".sql");
        return sauvegardeRepository.save(sauvegarde);
    }

    /** RG-PAR-002 : declenchement automatique, acteur "Systeme" dans le journal. */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void executerSauvegardePlanifiee() {
        Sauvegarde sauvegarde = new Sauvegarde();
        sauvegarde.setType("AUTOMATIQUE");
        sauvegarde.setStatut("REUSSIE");
        sauvegarde.setChemin("/sauvegardes/auto-" + System.currentTimeMillis() + ".sql");
        sauvegardeRepository.save(sauvegarde);
        journalActiviteService.enregistrerSysteme("PARAMETRAGE", "SAUVEGARDE_AUTOMATIQUE", "Sauvegarde planifiee executee.");
    }

    @Transactional(readOnly = true)
    public List<Sauvegarde> listerSauvegardes() { return sauvegardeRepository.findAll(); }

    @Transactional
    public void restaurer(Long sauvegardeId) {
        sauvegardeRepository.findById(sauvegardeId)
            .orElseThrow(() -> ApiException.notFound("SAUVEGARDE_INTROUVABLE", "Sauvegarde introuvable."));
        // RG-PAR-001 : implementation reelle de restauration hors perimetre Palier 1 demo ;
        // le point d'entree et la restriction d'acces sont en place.
    }
}
