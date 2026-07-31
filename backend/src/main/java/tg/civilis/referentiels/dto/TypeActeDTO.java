package tg.civilis.referentiels.dto;

import jakarta.validation.constraints.NotBlank;

public record TypeActeDTO(Long id, @NotBlank(message = "Le libelle est obligatoire.") String libelle, boolean actif) {}
