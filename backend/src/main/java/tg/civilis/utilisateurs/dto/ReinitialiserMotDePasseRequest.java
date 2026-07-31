package tg.civilis.utilisateurs.dto;

import jakarta.validation.constraints.NotBlank;

public record ReinitialiserMotDePasseRequest(@NotBlank String nouveauMotDePasse) {}
