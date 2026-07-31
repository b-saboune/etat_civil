package tg.civilis.referentiels;

import tg.civilis.common.exception.ApiException;
import tg.civilis.referentiels.dto.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * RG-REF-001 : pas de suppression physique, toute desactivation passe par
 * un changement de statut. RG-REF-002 : desactivation d'un centre bloquee
 * s'il a des utilisateurs actifs ou des registres en service rattaches.
 */
@Service
public class ReferentielsService {

    private final CommuneRepository communeRepository;
    private final CentreEtatCivilRepository centreRepository;
    private final SalleArchiveRepository salleRepository;
    private final RayonnageRepository rayonnageRepository;
    private final TypeActeRepository typeActeRepository;

    public ReferentielsService(CommuneRepository communeRepository, CentreEtatCivilRepository centreRepository,
                                SalleArchiveRepository salleRepository, RayonnageRepository rayonnageRepository,
                                TypeActeRepository typeActeRepository) {
        this.communeRepository = communeRepository;
        this.centreRepository = centreRepository;
        this.salleRepository = salleRepository;
        this.rayonnageRepository = rayonnageRepository;
        this.typeActeRepository = typeActeRepository;
    }

    @Transactional(readOnly = true)
    public List<Commune> listerCommunes() { return communeRepository.findAll(); }

    @Transactional
    public Commune creerCommune(CommuneDTO dto) {
        Commune commune = new Commune();
        commune.setNom(dto.nom());
        return communeRepository.save(commune);
    }

    @Transactional(readOnly = true)
    public List<CentreEtatCivil> listerCentres() { return centreRepository.findAll(); }

    @Transactional
    public CentreEtatCivil creerCentre(CentreDTO dto) {
        Commune commune = communeRepository.findById(dto.communeId())
            .orElseThrow(() -> ApiException.notFound("COMMUNE_INTROUVABLE", "Commune introuvable."));
        CentreEtatCivil centre = new CentreEtatCivil();
        centre.setCommune(commune);
        centre.setNom(dto.nom());
        centre.setAdresse(dto.adresse());
        centre.setStatut(dto.statut() != null ? dto.statut() : "ACTIF");
        return centreRepository.save(centre);
    }

    @Transactional
    public void desactiverCentre(Long id) {
        CentreEtatCivil centre = centreRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("CENTRE_INTROUVABLE", "Centre introuvable."));

        long utilisateursActifs = centreRepository.compterUtilisateursActifs(id);
        if (utilisateursActifs > 0) {
            throw ApiException.conflict("CENTRE_A_UTILISATEURS_ACTIFS",
                "Impossible de desactiver ce centre : " + utilisateursActifs + " utilisateur(s) actif(s) y sont rattache(s).");
        }
        long registresEnService = centreRepository.compterRegistresEnService(id);
        if (registresEnService > 0) {
            throw ApiException.conflict("CENTRE_A_REGISTRES_EN_SERVICE",
                "Impossible de desactiver ce centre : " + registresEnService + " registre(s) en service y sont rattaches.");
        }
        centre.setStatut("INACTIF");
        centreRepository.save(centre);
    }

    @Transactional(readOnly = true)
    public List<SalleArchive> listerSalles() { return salleRepository.findAll(); }

    @Transactional
    public SalleArchive creerSalle(SalleDTO dto) {
        CentreEtatCivil centre = centreRepository.findById(dto.centreId())
            .orElseThrow(() -> ApiException.notFound("CENTRE_INTROUVABLE", "Centre introuvable."));
        SalleArchive salle = new SalleArchive();
        salle.setCentre(centre);
        salle.setDesignation(dto.designation());
        return salleRepository.save(salle);
    }

    @Transactional(readOnly = true)
    public List<Rayonnage> listerRayonnages() { return rayonnageRepository.findAll(); }

    @Transactional
    public Rayonnage creerRayonnage(RayonnageDTO dto) {
        SalleArchive salle = salleRepository.findById(dto.salleId())
            .orElseThrow(() -> ApiException.notFound("SALLE_INTROUVABLE", "Salle d'archives introuvable."));
        Rayonnage rayonnage = new Rayonnage();
        rayonnage.setSalle(salle);
        rayonnage.setDesignation(dto.designation());
        return rayonnageRepository.save(rayonnage);
    }

    @Transactional(readOnly = true)
    public List<TypeActe> listerTypesActe() { return typeActeRepository.findAll(); }

    @Transactional
    public void desactiverTypeActe(Long id) {
        TypeActe typeActe = typeActeRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("TYPE_ACTE_INTROUVABLE", "Type d'acte introuvable."));
        typeActe.setActif(false);
        typeActeRepository.save(typeActe);
    }
}
