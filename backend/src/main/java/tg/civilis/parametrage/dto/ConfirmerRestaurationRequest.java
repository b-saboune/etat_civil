package tg.civilis.parametrage.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * RG-PAR-001 : la restauration ecrase la base de production courante —
 * confirmation renforcee obligatoire, le Super Administrateur doit saisir
 * litteralement la phrase de confirmation (pas une simple case a cocher).
 */
public record ConfirmerRestaurationRequest(@NotBlank String confirmation) {}
