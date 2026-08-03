package tg.civilis.pilotage.dto;

import java.util.List;
import java.util.Map;

/**
 * RG-TDB-001 : ces indicateurs sont deja filtres selon le perimetre de
 * l'utilisateur connecte (voir TableauBordService.obtenirTableauBord) -
 * vue globale pour ADMINISTRATEUR/SUPER_ADMIN, restreinte aux centres
 * affectes pour un AGENT.
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
