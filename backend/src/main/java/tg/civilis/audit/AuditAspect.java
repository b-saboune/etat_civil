package tg.civilis.audit;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import tg.civilis.authentification.CivilisUserDetails;

/**
 * RG-AUD-002 : aspect transversal, seul point d'ecriture du journal cote
 * services d'ecriture (creer, deplacer, fusionner, marquer). Volontairement
 * simple pour Palier 1 : consigne la classe et la methode appelees.
 */
@Aspect
@Component
public class AuditAspect {

    private final JournalActiviteService journalActiviteService;

    public AuditAspect(JournalActiviteService journalActiviteService) {
        this.journalActiviteService = journalActiviteService;
    }

    @AfterReturning("execution(* tg.civilis.indexation.IndexationService.creerFiche(..)) || " +
        "execution(* tg.civilis.registres.RegistreService.deplacer(..)) || " +
        "execution(* tg.civilis.personnes.PersonneService.fusionner(..))")
    public void consignerActionCritique(JoinPoint joinPoint) {
        String module = joinPoint.getTarget().getClass().getSimpleName();
        String action = joinPoint.getSignature().getName();
        journalActiviteService.enregistrer(utilisateurCourant(), module, action,
            "Appel automatique consigne par AuditAspect");
    }

    private tg.civilis.utilisateurs.Utilisateur utilisateurCourant() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CivilisUserDetails userDetails) {
            tg.civilis.utilisateurs.Utilisateur u = new tg.civilis.utilisateurs.Utilisateur();
            u.setId(userDetails.getId());
            return u;
        }
        return null;
    }
}
