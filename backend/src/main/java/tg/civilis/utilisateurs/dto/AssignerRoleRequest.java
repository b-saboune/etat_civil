package tg.civilis.utilisateurs.dto;

import jakarta.validation.constraints.NotNull;

public record AssignerRoleRequest(@NotNull(message = "Le role est obligatoire.") Long roleId) {}
