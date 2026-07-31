package tg.civilis.referentiels.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RayonnageDTO(
    Long id,
    @NotNull(message = "La salle est obligatoire.") Long salleId,
    @NotBlank(message = "La designation est obligatoire.") String designation
) {}
