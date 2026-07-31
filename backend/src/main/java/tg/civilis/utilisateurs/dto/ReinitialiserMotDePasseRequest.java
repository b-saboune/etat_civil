package tg.civilis.utilisateurs.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ReinitialiserMotDePasseRequest(
    @NotBlank(message = "Le mot de passe est obligatoire.")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,}$", message = "Le mot de passe doit contenir au moins 8 caracteres, avec au moins une lettre et un chiffre.")
    String nouveauMotDePasse
) {}
