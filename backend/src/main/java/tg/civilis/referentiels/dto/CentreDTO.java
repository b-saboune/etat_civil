package tg.civilis.referentiels.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CentreDTO(
    Long id,
    @NotNull(message = "La commune est obligatoire.") Long communeId,
    @NotBlank(message = "Le nom du centre est obligatoire.") String nom,
    String adresse,
    String statut
) {}
