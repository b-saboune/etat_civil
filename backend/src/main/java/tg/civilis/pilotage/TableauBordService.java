package tg.civilis.pilotage;

import tg.civilis.pilotage.dto.CentreChargeDTO;
import tg.civilis.pilotage.dto.EvolutionMensuelleDTO;
import tg.civilis.pilotage.dto.TableauBordDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class TableauBordService {

    private final TableauBordRepository repository;

    public TableauBordService(TableauBordRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public TableauBordDTO obtenirTableauBord() {
        Map<String, Long> repartition = new LinkedHashMap<>();
        for (Object[] ligne : repository.repartitionParTypeActe()) {
            repartition.put((String) ligne[0], ((Number) ligne[1]).longValue());
        }

        List<CentreChargeDTO> charge = repository.chargeParCentre().stream()
            .map(l -> new CentreChargeDTO((String) l[0], ((Number) l[1]).longValue(), ((Number) l[2]).longValue()))
            .toList();

        List<EvolutionMensuelleDTO> evolution = repository.evolutionMensuelle().stream()
            .map(l -> new EvolutionMensuelleDTO((String) l[0], ((Number) l[1]).longValue()))
            .toList();

        return new TableauBordDTO(
            repository.compterFiches(),
            repository.compterPersonnes(),
            repository.compterRegistres(),
            repository.compterCentres(),
            repository.compterFichesCetteSemaine(),
            repartition,
            charge,
            evolution
        );
    }
}
