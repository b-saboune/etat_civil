package tg.civilis.personnes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreerLienParenteRequest(
    @NotNull Long personneId,
    @NotNull Long personneApparenteeId,
    @NotBlank String typeLien
) {}
