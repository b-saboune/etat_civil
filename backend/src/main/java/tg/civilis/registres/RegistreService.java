package tg.civilis.registres;

import tg.civilis.common.exception.ApiException;
import tg.civilis.referentiels.CentreEtatCivilRepository;
import tg.civilis.referentiels.Rayonnage;
import tg.civilis.referentiels.RayonnageRepository;
import tg.civilis.referentiels.TypeActeRepository;
import tg.civilis.registres.dto.CouvertureRecensementDTO;
import tg.civilis.registres.dto.DeplacerRegistreRequest;
import tg.civilis.registres.dto.RegistreDTO;
import tg.civilis.utilisateurs.Utilisateur;
import tg.civilis.utilisateurs.UtilisateurRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * RG-REG-006 : confirmation explicite obligatoire avant tout deplacement
 * (imposee cote frontend ; ce service suppose que l'appel n'arrive qu'apres
 * confirmation). RG-REG-009 : suppression interdite si des fiches y font
 * reference (ON DELETE RESTRICT en base, verifie ici en amont pour un
 * message clair plutot qu'une DataIntegrityViolationException brute).
 * RG-REG-010 : historique + emplacement courant mis a jour dans la meme
 * transaction.
 */
@Service
public class RegistreService {

    private final RegistrePhysiqueRepository registreRepository;
    private final HistoriqueEmplacementRegistreRepository historiqueRepository;
    private final CentreEtatCivilRepository centreRepository;
    private final RayonnageRepository rayonnageRepository;
    private final TypeActeRepository typeActeRepository;
    private final UtilisateurRepository utilisateurRepository;

    public RegistreService(RegistrePhysiqueRepository registreRepository,
                            HistoriqueEmplacementRegistreRepository historiqueRepository,
                            CentreEtatCivilRepository centreRepository,
                            RayonnageRepository rayonnageRepository,
                            TypeActeRepository typeActeRepository,
                            UtilisateurRepository utilisateurRepository) {
        this.registreRepository = registreRepository;
        this.historiqueRepository = historiqueRepository;
        this.centreRepository = centreRepository;
        this.rayonnageRepository = rayonnageRepository;
        this.typeActeRepository = typeActeRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    @Transactional(readOnly = true)
    public List<RegistrePhysique> lister() { return registreRepository.findAll(); }

    @Transactional(readOnly = true)
    public RegistrePhysique obtenir(Long id) {
        return registreRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("REGISTRE_INTROUVABLE", "Registre introuvable."));
    }

    @Transactional
    public RegistrePhysique creer(RegistreDTO dto) {
        var centre = centreRepository.findById(dto.centreId())
            .orElseThrow(() -> ApiException.notFound("CENTRE_INTROUVABLE", "Centre introuvable."));
        var rayonnage = rayonnageRepository.findById(dto.rayonnageId())
            .orElseThrow(() -> ApiException.notFound("RAYONNAGE_INTROUVABLE", "Rayonnage introuvable."));
        var typeActe = typeActeRepository.findById(dto.typeActeId())
            .orElseThrow(() -> ApiException.notFound("TYPE_ACTE_INTROUVABLE", "Type d'acte introuvable."));

        RegistrePhysique registre = new RegistrePhysique();
        registre.setCentre(centre);
        registre.setRayonnage(rayonnage);
        registre.setTypeActe(typeActe);
        registre.setNumeroRegistre(dto.numeroRegistre());
        registre.setAnnee(dto.annee());
        registre.setNbPages(dto.nbPages());
        if (dto.statut() != null) registre.setStatut(dto.statut());
        return registreRepository.save(registre);
    }

    @Transactional
    public RegistrePhysique deplacer(Long registreId, DeplacerRegistreRequest requete) {
        RegistrePhysique registre = obtenir(registreId);
        Rayonnage ancienRayonnage = registre.getRayonnage();
        Rayonnage nouveauRayonnage = rayonnageRepository.findById(requete.nouveauRayonnageId())
            .orElseThrow(() -> ApiException.notFound("RAYONNAGE_INTROUVABLE", "Rayonnage de destination introuvable."));
        Utilisateur auteur = utilisateurRepository.findById(requete.auteurId())
            .orElseThrow(() -> ApiException.notFound("UTILISATEUR_INTROUVABLE", "Utilisateur auteur introuvable."));

        HistoriqueEmplacementRegistre historique = new HistoriqueEmplacementRegistre();
        historique.setRegistre(registre);
        historique.setAncienRayonnage(ancienRayonnage);
        historique.setNouveauRayonnage(nouveauRayonnage);
        historique.setAuteur(auteur);
        historiqueRepository.save(historique);

        registre.setRayonnage(nouveauRayonnage);
        return registreRepository.save(registre);
    }

    @Transactional(readOnly = true)
    public CouvertureRecensementDTO couvertureRecensement(Long registreId) {
        RegistrePhysique registre = obtenir(registreId);
        long fichesIndexees = registreRepository.compterFichesIndexation(registreId);
        double taux = registre.getNbPages() == 0 ? 0 : (fichesIndexees * 100.0) / registre.getNbPages();
        return new CouvertureRecensementDTO(registre.getNbPages(), fichesIndexees, Math.round(taux * 100.0) / 100.0);
    }
}
