package tg.civilis.registres.dto;

import java.time.LocalDateTime;

public record HistoriqueDeplacementDTO(
    Long id,
    String ancienRayonnage,
    String nouveauRayonnage,
    LocalDateTime dateDeplacement,
    String auteurIdentifiant
) {}
