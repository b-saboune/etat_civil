package tg.civilis.indexation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

/**
 * RG-IDX-013 (tracabilite) : l'agent auteur n'est plus fourni par le
 * client (un champ agentId manipulable aurait permis a un agent
 * d'indexer sous l'identite d'un collegue) — il est desormais toujours
 * derive du token JWT authentifie, cote IndexationController.
 */
public record CreerFicheIndexationRequest(
    @NotNull(message = "Le registre est obligatoire.") Long registreId,
    @NotBlank(message = "Le numero d'acte est obligatoire.") String numeroActe,
    @NotNull(message = "La page est obligatoire.") Integer page,
    @NotNull(message = "Le type d'acte est obligatoire.") Long typeActeId,
    @NotNull(message = "La date de l'evenement est obligatoire.") LocalDate dateEvenement,
    @NotNull @Size(min = 1, message = "Au moins une personne doit etre associee a la fiche (RG-IDX-004).")
    @Valid List<PersonneAssocieeRequest> personnesAssociees
) {}
