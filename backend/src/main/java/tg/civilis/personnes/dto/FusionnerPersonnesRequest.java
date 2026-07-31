package tg.civilis.personnes.dto;

import jakarta.validation.constraints.NotNull;

/** RG-PER-002 : personneSourceId sera desactivee (jamais supprimee) apres report des associations vers personneCibleId. */
public record FusionnerPersonnesRequest(@NotNull Long personneSourceId, @NotNull Long personneCibleId) {}
