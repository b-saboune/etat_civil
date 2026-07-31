package tg.civilis.referentiels.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SalleDTO(
    Long id,
    @NotNull(message = "Le centre est obligatoire.") Long centreId,
    @NotBlank(message = "La designation est obligatoire.") String designation
) {}
