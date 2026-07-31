package tg.civilis.utilisateurs.dto;

import jakarta.validation.constraints.NotNull;

public record AffecterCentreRequest(@NotNull(message = "Le centre est obligatoire.") Long centreId) {}
