package tg.civilis.rapports.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record GenererRapportRequest(
    @NotBlank(message = "Le type de rapport est obligatoire.") String type,
    @NotNull(message = "La date de debut est obligatoire.") LocalDate dateDebut,
    @NotNull(message = "La date de fin est obligatoire.") LocalDate dateFin,
    Long centreId
) {}
