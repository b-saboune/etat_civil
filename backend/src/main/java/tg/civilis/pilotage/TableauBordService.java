package tg.civilis.pilotage;

import tg.civilis.pilotage.dto.CentreChargeDTO;
import tg.civilis.pilotage.dto.EvolutionMensuelleDTO;
import tg.civilis.pilotage.dto.TableauBordDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tg.civilis.utilisateurs.UtilisateurCentreRepository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class TableauBordService {

    private final TableauBordRepository repository;
    private final UtilisateurCentreRepository utilisateurCentreRepository;

    public TableauBordService(TableauBordRepository repository, UtilisateurCentreRepository utilisateurCentreRepository) {
        this.repository = repository;
        this.utilisateurCentreRepository = utilisateurCentreRepository;
    }

    /**
     * RG-TDB-001 : les indicateurs sont strictement filtres selon le
     * perimetre de l'utilisateur connecte. Un AGENT n'a de perimetre que
     * sur ses centres affectes (utilisateur_centre, RG-UTI-001) ; s'il n'en
     * a aucun, son perimetre est vide et le tableau de bord doit rester a
     * zero plutot que de retomber par defaut sur une vue globale.
     * ADMINISTRATEUR et SUPER_ADMIN n'ont pas de notion de centre affecte
     * dans le modele de donnees : leur perimetre est le systeme entier.
     */
    @Transactional(readOnly = true)
    public TableauBordDTO obtenirTableauBord(Long utilisateurId, String typeCompte) {
        if (!"AGENT".equals(typeCompte)) {
            return construire(
                repository.compterFiches(),
                repository.compterPersonnes(),
                repository.compterRegistres(),
                repository.compterCentres(),
                repository.compterFichesCetteSemaine(),
                repository.repartitionParTypeActe(),
                repository.chargeParCentre(),
                repository.evolutionMensuelle()
            );
        }

        List<Long> centreIds = utilisateurCentreRepository.trouverCentreIdsParUtilisateur(utilisateurId);
        if (centreIds.isEmpty()) {
            return new TableauBordDTO(0, 0, 0, 0, 0, Map.of(), List.of(), List.of());
        }

        return construire(
            repository.compterFichesParCentres(centreIds),
            repository.compterPersonnesParCentres(centreIds),
            repository.compterRegistresParCentres(centreIds),
            repository.compterCentresParCentres(centreIds),
            repository.compterFichesCetteSemaineParCentres(centreIds),
            repository.repartitionParTypeActeParCentres(centreIds),
            repository.chargeParCentreParCentres(centreIds),
            repository.evolutionMensuelleParCentres(centreIds)
        );
    }

    private TableauBordDTO construire(long totalFiches, long totalPersonnes, long totalRegistres, long totalCentres,
                                       long fichesCetteSemaine, List<Object[]> repartitionBrute,
                                       List<Object[]> chargeBrute, List<Object[]> evolutionBrute) {
        Map<String, Long> repartition = new LinkedHashMap<>();
        for (Object[] ligne : repartitionBrute) {
            repartition.put((String) ligne[0], ((Number) ligne[1]).longValue());
        }

        List<CentreChargeDTO> charge = chargeBrute.stream()
            .map(l -> new CentreChargeDTO((String) l[0], ((Number) l[1]).longValue(), ((Number) l[2]).longValue()))
            .toList();

        List<EvolutionMensuelleDTO> evolution = evolutionBrute.stream()
            .map(l -> new EvolutionMensuelleDTO((String) l[0], ((Number) l[1]).longValue()))
            .toList();

        return new TableauBordDTO(totalFiches, totalPersonnes, totalRegistres, totalCentres, fichesCetteSemaine,
            repartition, charge, evolution);
    }

}
