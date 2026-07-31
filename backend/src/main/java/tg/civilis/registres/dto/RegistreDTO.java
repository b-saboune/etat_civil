package tg.civilis.registres.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RegistreDTO(
    Long id,
    @NotNull Long centreId,
    @NotNull Long rayonnageId,
    @NotNull Long typeActeId,
    @NotBlank String numeroRegistre,
    @NotNull Integer annee,
    @NotNull Integer nbPages,
    String statut
) {}
