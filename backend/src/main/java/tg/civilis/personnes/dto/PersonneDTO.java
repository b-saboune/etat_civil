package tg.civilis.personnes.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record PersonneDTO(
    Long id,
    @NotBlank String nom,
    @NotBlank String prenoms,
    String sexe,
    LocalDate dateNaissance,
    boolean dateApproximative
) {}
