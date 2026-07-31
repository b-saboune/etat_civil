package tg.civilis.authentification.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @NotBlank(message = "L'identifiant est obligatoire.") String identifiant,
    @NotBlank(message = "Le mot de passe est obligatoire.") String motDePasse
) {}
