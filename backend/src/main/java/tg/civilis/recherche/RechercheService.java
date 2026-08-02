package tg.civilis.recherche;

import tg.civilis.indexation.AssociationPersonneActe;
import tg.civilis.indexation.AssociationPersonneActeRepository;
import tg.civilis.indexation.FicheIndexation;
import tg.civilis.personnes.Personne;
import tg.civilis.personnes.PersonneRepository;
import tg.civilis.recherche.dto.*;
import tg.civilis.registres.RegistrePhysique;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * RG-REC-006 : si aucun resultat exact n'est trouve, propose automatiquement
 * des resultats approximatifs plutot qu'un echec sec ; une correspondance
 * approchee est toujours signalee comme telle, jamais presentee comme une
 * certitude (champ correspondanceApprochee du DTO).
 * RG-REC-007 : recherche insensible aux accents et a la casse (pg_trgm, ILIKE).
 */
@Service
public class RechercheService {

    private final PersonneRepository personneRepository;
    private final AssociationPersonneActeRepository associationRepository;

    public RechercheService(PersonneRepository personneRepository, AssociationPersonneActeRepository associationRepository) {
        this.personneRepository = personneRepository;
        this.associationRepository = associationRepository;
    }

    @Transactional(readOnly = true)
    public List<ResultatRechercheDTO> rechercher(RechercheRequest requete) {
        String nom = requete.nom() == null ? "" : requete.nom().trim();
        String prenoms = requete.prenoms() == null ? "" : requete.prenoms().trim();

        List<Personne> personnesTrouvees = personneRepository.rechercheApprochee(nom, prenoms);

        Map<Long, ResultatRechercheDTO> resultats = new LinkedHashMap<>();

        for (Personne personne : personnesTrouvees) {
            boolean correspondanceExacte = normalise(personne.getNom()).equals(normalise(nom))
                && normalise(personne.getPrenoms()).equals(normalise(prenoms));

            List<AssociationPersonneActe> associations = associationRepository.findByPersonneId(personne.getId());

            for (AssociationPersonneActe association : associations) {
                // Recherche par affiliation (section 11.9 du prompt maitre) : si un
                // role est precise, on ne retient cette personne que lorsqu'elle
                // apparait dans CE role precis sur la fiche (ex. chercher "AMEGAN"
                // uniquement en tant que PERE, pas en tant que TITULAIRE ou TEMOIN).
                if (requete.roleAffiliation() != null && !requete.roleAffiliation().isBlank()
                    && !requete.roleAffiliation().equalsIgnoreCase(association.getRole())) {
                    continue;
                }

                FicheIndexation fiche = association.getFicheIndexation();
                if (resultats.containsKey(fiche.getId())) continue;

                RegistrePhysique registre = fiche.getRegistre();
                LocalisationDTO localisation = new LocalisationDTO(
                    registre.getCentre().getCommune().getNom(),
                    registre.getCentre().getNom(),
                    registre.getRayonnage().getSalle().getDesignation(),
                    registre.getRayonnage().getDesignation(),
                    registre.getNumeroRegistre(),
                    registre.getAnnee(),
                    fiche.getPage()
                );

                List<PersonneAssocieeDTO> personnesAssociees = associationRepository.findByPersonneId(personne.getId()).stream()
                    .filter(a -> a.getFicheIndexation().getId().equals(fiche.getId()))
                    .map(a -> new PersonneAssocieeDTO(a.getPersonne().getId(), a.getPersonne().getNom(), a.getPersonne().getPrenoms(), a.getRole()))
                    .toList();

                // Recharge toutes les personnes de la fiche (pas seulement celle trouvee par la recherche)
                List<PersonneAssocieeDTO> toutesLesPersonnes = trouverToutesPersonnesDeLaFiche(fiche.getId());

                resultats.put(fiche.getId(), new ResultatRechercheDTO(
                    fiche.getId(),
                    fiche.getNumeroActe(),
                    fiche.getTypeActe().getLibelle(),
                    fiche.getDateEvenement(),
                    fiche.getStatut(),
                    !correspondanceExacte,
                    toutesLesPersonnes,
                    localisation
                ));
            }
        }

        LocalDate dateDebut = parseDate(requete.dateDebut());
        LocalDate dateFin = parseDate(requete.dateFin());

        return resultats.values().stream()
            .filter(r -> requete.typeActe() == null || requete.typeActe().isBlank()
                || r.typeActe().equalsIgnoreCase(requete.typeActe()))
            .filter(r -> dateDebut == null || !r.dateEvenement().isBefore(dateDebut))
            .filter(r -> dateFin == null || !r.dateEvenement().isAfter(dateFin))
            .sorted(Comparator.comparing(ResultatRechercheDTO::correspondanceApprochee))
            .toList();
    }

    private LocalDate parseDate(String valeur) {
        if (valeur == null || valeur.isBlank()) return null;
        try {
            return LocalDate.parse(valeur.trim());
        } catch (Exception e) {
            return null;
        }
    }

    private List<PersonneAssocieeDTO> trouverToutesPersonnesDeLaFiche(Long ficheId) {
        return associationRepository.findAll().stream()
            .filter(a -> a.getFicheIndexation().getId().equals(ficheId))
            .map(a -> new PersonneAssocieeDTO(a.getPersonne().getId(), a.getPersonne().getNom(), a.getPersonne().getPrenoms(), a.getRole()))
            .toList();
    }

    private String normalise(String valeur) {
        if (valeur == null) return "";
        return valeur.trim().toLowerCase()
            .replace("é", "e").replace("è", "e").replace("ê", "e")
            .replace("à", "a").replace("ô", "o").replace("ù", "u");
    }
}
