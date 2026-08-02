package tg.civilis.registres.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Changement de statut du cycle de vie d'un registre (EN_SERVICE -> ARCHIVE
 * -> RETIRE), coherent avec la contrainte CHECK deja presente en base
 * (schema_etat_civil.sql). Aucune suppression physique n'est jamais exposee
 * pour un registre : seul un changement de statut trace l'evolution, dans le
 * meme esprit que RG-REF-001 pour les referentiels.
 */
public record ChangerStatutRegistreRequest(
    @NotBlank @Pattern(regexp = "EN_SERVICE|ARCHIVE|RETIRE") String statut
) {}
