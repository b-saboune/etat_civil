package tg.civilis.registres;

import tg.civilis.common.exception.ApiException;
import tg.civilis.referentiels.CentreEtatCivilRepository;
import tg.civilis.referentiels.Rayonnage;
import tg.civilis.referentiels.RayonnageRepository;
import tg.civilis.referentiels.TypeActeRepository;
import tg.civilis.registres.dto.CouvertureRecensementDTO;
import tg.civilis.registres.dto.DeplacerRegistreRequest;
import tg.civilis.registres.dto.RegistreDTO;
import tg.civilis.registres.dto.RegistreVueDTO;
import tg.civilis.registres.dto.HistoriqueDeplacementDTO;
import tg.civilis.utilisateurs.Utilisateur;
import tg.civilis.utilisateurs.UtilisateurRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

/**
 * RG-REG-006 : confirmation explicite obligatoire avant tout deplacement
 * (imposee cote frontend ; ce service suppose que l'appel n'arrive qu'apres
 * confirmation). RG-REG-009 : suppression interdite si des fiches y font
 * reference (ON DELETE RESTRICT en base ; aucune suppression physique n'est
 * de toute facon exposee par l'API — seul un changement de statut est
 * possible, dans le meme esprit que RG-REF-001). RG-REG-010 : historique +
 * emplacement courant mis a jour dans la meme transaction. RG-LOC-001 : la
 * vue exposee (RegistreVueDTO) porte toujours la chaine complete
 * Commune -> Centre -> Salle -> Rayonnage, jamais un maillon omis.
 */
@Service
public class RegistreService {

    private static final Set<String> STATUTS_VALIDES = Set.of("EN_SERVICE", "ARCHIVE", "RETIRE");

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

    private RegistreVueDTO versVue(RegistrePhysique r) {
        var centre = r.getCentre();
        var rayonnage = r.getRayonnage();
        var salle = rayonnage != null ? rayonnage.getSalle() : null;
        var commune = centre != null ? centre.getCommune() : null;
        var typeActe = r.getTypeActe();
        return new RegistreVueDTO(
            r.getId(), r.getNumeroRegistre(), r.getAnnee(), r.getNbPages(), r.getStatut(),
            centre != null ? centre.getId() : null, centre != null ? centre.getNom() : null,
            commune != null ? commune.getId() : null, commune != null ? commune.getNom() : null,
            salle != null ? salle.getId() : null, salle != null ? salle.getDesignation() : null,
            rayonnage != null ? rayonnage.getId() : null, rayonnage != null ? rayonnage.getDesignation() : null,
            typeActe != null ? typeActe.getId() : null, typeActe != null ? typeActe.getLibelle() : null
        );
    }

    @Transactional(readOnly = true)
    public List<RegistreVueDTO> lister(Long centreId, Integer annee, String statut) {
        return registreRepository.findAll().stream()
            .filter(r -> centreId == null || (r.getCentre() != null && centreId.equals(r.getCentre().getId())))
            .filter(r -> annee == null || annee.equals(r.getAnnee()))
            .filter(r -> statut == null || statut.isBlank() || statut.equalsIgnoreCase(r.getStatut()))
            .map(this::versVue)
            .toList();
    }

    @Transactional(readOnly = true)
    public RegistreVueDTO obtenirVue(Long id) {
        return versVue(obtenir(id));
    }

    @Transactional(readOnly = true)
    public RegistrePhysique obtenir(Long id) {
        return registreRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("REGISTRE_INTROUVABLE", "Registre introuvable."));
    }

    @Transactional
    public RegistreVueDTO creer(RegistreDTO dto) {
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
        return versVue(registreRepository.save(registre));
    }

    @Transactional
    public RegistreVueDTO deplacer(Long registreId, DeplacerRegistreRequest requete, Long auteurId) {
        RegistrePhysique registre = obtenir(registreId);
        Rayonnage ancienRayonnage = registre.getRayonnage();
        Rayonnage nouveauRayonnage = rayonnageRepository.findById(requete.nouveauRayonnageId())
            .orElseThrow(() -> ApiException.notFound("RAYONNAGE_INTROUVABLE", "Rayonnage de destination introuvable."));
        Utilisateur auteur = utilisateurRepository.findById(auteurId)
            .orElseThrow(() -> ApiException.notFound("UTILISATEUR_INTROUVABLE", "Utilisateur auteur introuvable."));

        HistoriqueEmplacementRegistre historique = new HistoriqueEmplacementRegistre();
        historique.setRegistre(registre);
        historique.setAncienRayonnage(ancienRayonnage);
        historique.setNouveauRayonnage(nouveauRayonnage);
        historique.setAuteur(auteur);
        historiqueRepository.save(historique);

        registre.setRayonnage(nouveauRayonnage);
        return versVue(registreRepository.save(registre));
    }

    @Transactional
    public RegistreVueDTO changerStatut(Long registreId, String statut) {
        if (!STATUTS_VALIDES.contains(statut)) {
            throw ApiException.badRequest("STATUT_INVALIDE", "Statut de registre invalide : " + statut);
        }
        RegistrePhysique registre = obtenir(registreId);
        registre.setStatut(statut);
        return versVue(registreRepository.save(registre));
    }

    @Transactional(readOnly = true)
    public List<HistoriqueDeplacementDTO> historiqueDeplacements(Long registreId) {
        return historiqueRepository.findByRegistreIdOrderByDateDeplacementDesc(registreId).stream()
            .map(h -> new HistoriqueDeplacementDTO(
                h.getId(),
                h.getAncienRayonnage() != null ? h.getAncienRayonnage().getDesignation() : null,
                h.getNouveauRayonnage() != null ? h.getNouveauRayonnage().getDesignation() : null,
                h.getDateDeplacement(),
                h.getAuteur() != null ? h.getAuteur().getIdentifiant() : null
            ))
            .toList();
    }

    @Transactional(readOnly = true)
    public CouvertureRecensementDTO couvertureRecensement(Long registreId) {
        RegistrePhysique registre = obtenir(registreId);
        long fichesIndexees = registreRepository.compterFichesIndexation(registreId);
        double taux = registre.getNbPages() == 0 ? 0 : (fichesIndexees * 100.0) / registre.getNbPages();
        return new CouvertureRecensementDTO(registre.getNbPages(), fichesIndexees, Math.round(taux * 100.0) / 100.0);
    }
}
