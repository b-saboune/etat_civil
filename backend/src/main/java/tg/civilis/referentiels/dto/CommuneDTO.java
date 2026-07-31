package tg.civilis.referentiels.dto;

import jakarta.validation.constraints.NotBlank;

public record CommuneDTO(Long id, @NotBlank(message = "Le nom de la commune est obligatoire.") String nom) {}
