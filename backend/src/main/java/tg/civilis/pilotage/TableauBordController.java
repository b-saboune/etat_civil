package tg.civilis.pilotage;

import tg.civilis.pilotage.dto.TableauBordDTO;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import tg.civilis.authentification.CivilisUserDetails;

@RestController
@Tag(name = "Pilotage")
@PreAuthorize("hasAuthority('PILOTAGE_CONSULTER') or hasRole('SUPER_ADMIN')")
public class TableauBordController {

    private final TableauBordService service;

    public TableauBordController(TableauBordService service) {
        this.service = service;
    }

    /**
     * RG-TDB-001 : les indicateurs sont strictement filtres selon le
     * perimetre de l'utilisateur connecte. Un AGENT ne voit que les
     * centres auxquels il est affecte (RG-UTI-001, table utilisateur_centre) ;
     * un ADMINISTRATEUR ou le SUPER_ADMIN n'ont pas de perimetre de centre
     * restreint dans le modele de donnees (aucune affectation centre pour
     * ces types de compte) et voient donc la vue globale, coherente avec
     * le court-circuit RG-ADM-002 deja applique au RBAC.
     */
    @GetMapping("/api/tableau-de-bord")
    public TableauBordDTO obtenir() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CivilisUserDetails userDetails) {
            return service.obtenirTableauBord(userDetails.getId(), userDetails.getTypeCompte());
        }
        throw tg.civilis.common.exception.ApiException.notFound("UTILISATEUR_INTROUVABLE", "Utilisateur authentifie introuvable.");
    }
}
