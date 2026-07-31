package tg.civilis.registres.dto;

import jakarta.validation.constraints.NotNull;

/** RG-REG-006 : le frontend doit avoir recueilli une confirmation explicite avant d'appeler cet endpoint. */
public record DeplacerRegistreRequest(@NotNull Long nouveauRayonnageId, @NotNull Long auteurId) {}
