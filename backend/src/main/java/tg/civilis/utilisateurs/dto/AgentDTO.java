package tg.civilis.utilisateurs.dto;

import jakarta.validation.constraints.NotBlank;

public record AgentDTO(Long id, @NotBlank String identifiant, String typeCompte, String statut) {}
