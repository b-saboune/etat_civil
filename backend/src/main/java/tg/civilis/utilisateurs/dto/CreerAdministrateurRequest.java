package tg.civilis.utilisateurs.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreerAdministrateurRequest(
    @NotBlank(message = "L'identifiant est obligatoire.") String identifiant,
    @NotBlank(message = "Le mot de passe initial est obligatoire.")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caracteres.") String motDePasseInitial
) {}
