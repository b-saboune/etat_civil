package tg.civilis.recherche.dto;

/**
 * RG-LOC-001 : la chaine complete Commune -> Centre -> Salle -> Rayonnage
 * -> Registre -> Page est toujours restituee sans maillon omis.
 */
public record LocalisationDTO(
    String commune,
    String centre,
    String salleArchive,
    String rayonnage,
    String numeroRegistre,
    Integer annee,
    Integer page
) {}
