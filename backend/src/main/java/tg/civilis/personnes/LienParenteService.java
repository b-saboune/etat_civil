package tg.civilis.personnes;

import tg.civilis.common.exception.ApiException;
import tg.civilis.indexation.AssociationPersonneActe;
import tg.civilis.personnes.dto.CreerLienParenteRequest;
import tg.civilis.personnes.dto.LienParenteDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Voir LienParente pour le contexte (fonctionnalite prevue mais jamais
 * implementee jusqu'ici). RG-PER-001/002 : jamais de doublon, jamais de
 * suppression physique d'une personne ; par coherence, un lien deja existant
 * n'est jamais recree (verifie avant insertion).
 */
@Service
public class LienParenteService {

    /** Type de lien reciproque du point de vue de la personne apparentee. */
    private static final Map<String, String> INVERSE = Map.of(
        "PERE", "ENFANT",
        "MERE", "ENFANT",
        "ENFANT", "ENFANT", // ambigu sans le sexe du parent ; laisse tel quel, corrigeable manuellement
        "CONJOINT", "CONJOINT"
    );

    private final LienParenteRepository lienRepository;
    private final PersonneRepository personneRepository;

    public LienParenteService(LienParenteRepository lienRepository, PersonneRepository personneRepository) {
        this.lienRepository = lienRepository;
        this.personneRepository = personneRepository;
    }

    @Transactional(readOnly = true)
    public List<LienParenteDTO> listerPourPersonne(Long personneId) {
        return lienRepository.trouverPourPersonne(personneId).stream()
            .map(l -> new LienParenteDTO(
                l.getId(),
                l.getPersonneApparentee().getId(),
                l.getPersonneApparentee().getNom(),
                l.getPersonneApparentee().getPrenoms(),
                l.getTypeLien(),
                l.getModeCreation()
            ))
            .toList();
    }

    @Transactional
    public void creerManuel(CreerLienParenteRequest requete) {
        if (requete.personneId().equals(requete.personneApparenteeId())) {
            throw ApiException.conflict("LIEN_INVALIDE", "Une personne ne peut pas etre apparentee a elle-meme.");
        }
        Personne personne = personneRepository.findById(requete.personneId())
            .orElseThrow(() -> ApiException.notFound("PERSONNE_INTROUVABLE", "Personne introuvable."));
        Personne apparentee = personneRepository.findById(requete.personneApparenteeId())
            .orElseThrow(() -> ApiException.notFound("PERSONNE_INTROUVABLE", "Personne apparentee introuvable."));

        creerSiAbsent(personne, apparentee, requete.typeLien(), "MANUEL");
        String inverse = INVERSE.getOrDefault(requete.typeLien(), requete.typeLien());
        creerSiAbsent(apparentee, personne, inverse, "MANUEL");
    }

    /**
     * Appele juste apres l'enregistrement des associations personne/acte
     * d'une fiche d'indexation (voir IndexationService.creerFiche). Deduit
     * automatiquement les liens de filiation quand une meme fiche porte les
     * roles TITULAIRE + PERE et/ou TITULAIRE + MERE (cas le plus courant :
     * un acte de naissance). RG-JUR-001 non concerne : aucune donnee
     * juridique, uniquement une relation entre fiches personne deja saisies.
     */
    @Transactional
    public void deriverDepuisFiche(List<AssociationPersonneActe> associations) {
        Personne titulaire = trouverParRole(associations, "TITULAIRE");
        if (titulaire == null) return;

        Personne pere = trouverParRole(associations, "PERE");
        if (pere != null) {
            creerSiAbsent(titulaire, pere, "PERE", "DEDUIT");
            creerSiAbsent(pere, titulaire, "ENFANT", "DEDUIT");
        }
        Personne mere = trouverParRole(associations, "MERE");
        if (mere != null) {
            creerSiAbsent(titulaire, mere, "MERE", "DEDUIT");
            creerSiAbsent(mere, titulaire, "ENFANT", "DEDUIT");
        }
    }

    private Personne trouverParRole(List<AssociationPersonneActe> associations, String role) {
        return associations.stream()
            .filter(a -> role.equals(a.getRole()))
            .map(AssociationPersonneActe::getPersonne)
            .findFirst()
            .orElse(null);
    }

    private void creerSiAbsent(Personne personne, Personne apparentee, String typeLien, String modeCreation) {
        boolean existeDeja = lienRepository
            .findByPersonneIdAndPersonneApparenteeIdAndTypeLien(personne.getId(), apparentee.getId(), typeLien)
            .isPresent();
        if (existeDeja) return;

        LienParente lien = new LienParente();
        lien.setPersonne(personne);
        lien.setPersonneApparentee(apparentee);
        lien.setTypeLien(typeLien);
        lien.setModeCreation(modeCreation);
        lienRepository.save(lien);
    }
}
