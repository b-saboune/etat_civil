package tg.civilis.personnes;

import tg.civilis.common.exception.ApiException;
import tg.civilis.indexation.AssociationPersonneActeRepository;
import tg.civilis.personnes.dto.FusionnerPersonnesRequest;
import tg.civilis.personnes.dto.PersonneDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * RG-PER-001 : la recherche systematique avant creation est imposee cote
 * frontend (l'ecran RecherchePersonne precede toujours FormPersonne) ET
 * revalidee ici : creerPersonne() refuse une creation s'il existe deja une
 * personne quasi identique (nom+prenoms exacts, statut ACTIVE).
 * RG-PER-002 : fusion = report de toutes les associations source -> cible
 * dans une transaction unique, puis desactivation (jamais suppression) de
 * la source.
 */
@Service
public class PersonneService {

    private final PersonneRepository personneRepository;
    private final AssociationPersonneActeRepository associationRepository;

    public PersonneService(PersonneRepository personneRepository, AssociationPersonneActeRepository associationRepository) {
        this.personneRepository = personneRepository;
        this.associationRepository = associationRepository;
    }

    @Transactional(readOnly = true)
    public List<Personne> rechercher(String nom, String prenoms) {
        return personneRepository.rechercheApprochee(nom == null ? "" : nom, prenoms == null ? "" : prenoms);
    }

    @Transactional
    public Personne creer(PersonneDTO dto) {
        boolean doublonProbable = personneRepository.rechercheApprochee(dto.nom(), dto.prenoms()).stream()
            .anyMatch(p -> p.getNom().equalsIgnoreCase(dto.nom()) && p.getPrenoms().equalsIgnoreCase(dto.prenoms()));
        if (doublonProbable) {
            throw ApiException.conflict("DOUBLON_PROBABLE",
                "Une personne avec un nom et des prenoms identiques existe deja. Verifiez avant de creer une nouvelle fiche (RG-PER-001).");
        }
        Personne personne = new Personne();
        personne.setNom(dto.nom());
        personne.setPrenoms(dto.prenoms());
        personne.setSexe(dto.sexe());
        personne.setDateNaissance(dto.dateNaissance());
        personne.setDateApproximative(dto.dateApproximative());
        return personneRepository.save(personne);
    }

    @Transactional
    public void fusionner(FusionnerPersonnesRequest requete) {
        if (requete.personneSourceId().equals(requete.personneCibleId())) {
            throw ApiException.badRequest("FUSION_INVALIDE", "La personne source et la personne cible doivent etre distinctes.");
        }
        Personne source = personneRepository.findById(requete.personneSourceId())
            .orElseThrow(() -> ApiException.notFound("PERSONNE_INTROUVABLE", "Personne source introuvable."));
        Personne cible = personneRepository.findById(requete.personneCibleId())
            .orElseThrow(() -> ApiException.notFound("PERSONNE_INTROUVABLE", "Personne cible introuvable."));

        associationRepository.findByPersonneId(source.getId())
            .forEach(association -> association.setPersonne(cible));

        source.setStatut("FUSIONNEE");
        personneRepository.save(source);
    }
}
