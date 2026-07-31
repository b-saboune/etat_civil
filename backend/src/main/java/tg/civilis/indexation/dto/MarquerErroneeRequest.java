package tg.civilis.indexation.dto;

import jakarta.validation.constraints.NotBlank;

public record MarquerErroneeRequest(@NotBlank(message = "Le motif est obligatoire.") String motif) {}
