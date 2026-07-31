package tg.civilis.rbac.dto;

import jakarta.validation.constraints.NotBlank;

public record RoleDTO(Long id, @NotBlank String libelle, String description) {}
