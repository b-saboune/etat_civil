package tg.civilis.recherche.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * RG-REC-005 : la localisation physique complete est toujours affichee
 * avec un resultat, jamais en option.
 */
public record ResultatRechercheDTO(
    Long ficheIndexationId,
    String numeroActe,
    String typeActe,
    LocalDate dateEvenement,
    String statut,
    boolean correspondanceApprochee,
    List<PersonneAssocieeDTO> personnesAssociees,
    LocalisationDTO localisation
) {}
