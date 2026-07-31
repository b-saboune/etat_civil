package tg.civilis.indexation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/**
 * Modification generale d'une fiche deja indexee (hors deplacement de
 * registre, qui reste gere separement par le module Registres, et hors
 * agent_id, conserve pour la tracabilite RG-IDX-013). RG-JUR-001 : ne
 * porte que des metadonnees, jamais de contenu juridique.
 */
public record ModifierFicheIndexationRequest(
    @NotBlank(message = "Le numero d'acte est obligatoire.") String numeroActe,
    @NotNull(message = "La page est obligatoire.") Integer page,
    @NotNull(message = "Le type d'acte est obligatoire.") Long typeActeId,
    @NotNull(message = "La date de l'evenement est obligatoire.") LocalDate dateEvenement
) {}
