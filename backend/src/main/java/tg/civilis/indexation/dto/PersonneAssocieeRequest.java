package tg.civilis.indexation.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Si personneId est fourni, l'association pointe vers une personne
 * existante (retrouvee via RG-PER-001 avant d'arriver ici). Sinon, nom et
 * prenoms permettent de creer la personne manquante dans la meme
 * transaction (RG-IDX-012).
 */
public record PersonneAssocieeRequest(
    Long personneId,
    String nom,
    String prenoms,
    @NotBlank(message = "Le role de la personne dans l'acte est obligatoire.") String role
) {}
