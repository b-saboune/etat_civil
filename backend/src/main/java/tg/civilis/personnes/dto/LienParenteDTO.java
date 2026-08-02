package tg.civilis.personnes.dto;

public record LienParenteDTO(
    Long id,
    Long personneApparenteeId,
    String nomApparente,
    String prenomsApparente,
    String typeLien,
    String modeCreation
) {}
