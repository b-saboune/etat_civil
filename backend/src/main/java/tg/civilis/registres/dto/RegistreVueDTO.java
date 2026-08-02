package tg.civilis.registres.dto;

/**
 * DTO de lecture pour un registre, portant la chaine de localisation complete
 * (RG-LOC-001 : Commune -> Centre -> Salle -> Rayonnage jamais omise) sous
 * forme aplatie plutot que des entites JPA imbriquees — plus sur a serialiser
 * et plus simple a consommer cote frontend que le graphe d'entites brut.
 */
public record RegistreVueDTO(
    Long id,
    String numeroRegistre,
    Integer annee,
    Integer nbPages,
    String statut,
    Long centreId,
    String centreNom,
    Long communeId,
    String communeNom,
    Long salleId,
    String salleDesignation,
    Long rayonnageId,
    String rayonnageDesignation,
    Long typeActeId,
    String typeActeLibelle
) {}
