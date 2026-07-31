package tg.civilis.pilotage.dto;

import java.util.List;
import java.util.Map;

/**
 * RG-TDB-001 : dans une version future multi-centre, ces indicateurs
 * devront etre filtres selon le perimetre de l'utilisateur connecte
 * (centres affectes). Palier 1 : vue globale pour la demonstration.
 */
public record TableauBordDTO(
    long totalFichesIndexees,
    long totalPersonnes,
    long totalRegistres,
    long totalCentres,
    long fichesIndexeesCetteSemaine,
    Map<String, Long> repartitionParTypeActe,
    List<CentreChargeDTO> chargeParCentre,
    List<EvolutionMensuelleDTO> evolutionMensuelle
) {}
