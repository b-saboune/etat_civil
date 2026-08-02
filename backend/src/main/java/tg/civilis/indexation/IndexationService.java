package tg.civilis.indexation;

import tg.civilis.common.exception.ApiException;
import tg.civilis.indexation.dto.CreerFicheIndexationRequest;
import tg.civilis.indexation.dto.MarquerErroneeRequest;
import tg.civilis.indexation.dto.ModifierFicheIndexationRequest;
import tg.civilis.indexation.dto.PersonneAssocieeRequest;
import tg.civilis.personnes.LienParenteService;
import tg.civilis.personnes.Personne;
import tg.civilis.personnes.PersonneRepository;
import tg.civilis.referentiels.TypeActe;
import tg.civilis.referentiels.TypeActeRepository;
import tg.civilis.registres.RegistrePhysique;
import tg.civilis.registres.RegistrePhysiqueRepository;
import tg.civilis.utilisateurs.Utilisateur;
import tg.civilis.utilisateurs.UtilisateurRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Module le plus critique du systeme (section 11.8 du prompt maitre).
 * RG-IDX-012 : creation de la fiche + des personnes manquantes + des
 * associations dans une transaction UNIQUE (methode annotee @Transactional,
 * aucun sous-appel ne commite independamment).
 * RG-IDX-004 : au moins une personne associee (verifie par la validation
 * Bean Validation @Size(min=1) sur le DTO, avant meme d'entrer ici).
 * RG-IDX-008 : l'unicite (registre_id, numero_acte) est portee par une
 * contrainte SQL ; la violation est capturee et retransformee en message
 * clair par GlobalExceptionHandler (DataIntegrityViolationException) — pas
 * de verification manuelle prealable qui creerait une fenetre de race
 * condition.
 * RG-JUR-001 : aucun champ de cette entite ne recopie le contenu juridique
 * de l'acte (uniquement metadonnees : numero, page, date, type, personnes).
 */
@Service
public class IndexationService {

    private final FicheIndexationRepository ficheRepository;
    private final AssociationPersonneActeRepository associationRepository;
    private final PersonneRepository personneRepository;
    private final RegistrePhysiqueRepository registreRepository;
    private final TypeActeRepository typeActeRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final LienParenteService lienParenteService;

    public IndexationService(FicheIndexationRepository ficheRepository,
                              AssociationPersonneActeRepository associationRepository,
                              PersonneRepository personneRepository,
                              RegistrePhysiqueRepository registreRepository,
                              TypeActeRepository typeActeRepository,
                              UtilisateurRepository utilisateurRepository,
                              LienParenteService lienParenteService) {
        this.ficheRepository = ficheRepository;
        this.associationRepository = associationRepository;
        this.personneRepository = personneRepository;
        this.registreRepository = registreRepository;
        this.typeActeRepository = typeActeRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.lienParenteService = lienParenteService;
    }

    @Transactional
    public FicheIndexation creerFiche(CreerFicheIndexationRequest requete, Long agentId) {
        RegistrePhysique registre = registreRepository.findById(requete.registreId())
            .orElseThrow(() -> ApiException.notFound("REGISTRE_INTROUVABLE", "Registre introuvable."));
        TypeActe typeActe = typeActeRepository.findById(requete.typeActeId())
            .orElseThrow(() -> ApiException.notFound("TYPE_ACTE_INTROUVABLE", "Type d'acte introuvable."));
        Utilisateur agent = utilisateurRepository.findById(agentId)
            .orElseThrow(() -> ApiException.notFound("UTILISATEUR_INTROUVABLE", "Agent introuvable."));

        FicheIndexation fiche = new FicheIndexation();
        fiche.setRegistre(registre);
        fiche.setNumeroActe(requete.numeroActe());
        fiche.setPage(requete.page());
        fiche.setTypeActe(typeActe);
        fiche.setDateEvenement(requete.dateEvenement());
        fiche.setAgent(agent);

        try {
            fiche = ficheRepository.saveAndFlush(fiche);
        } catch (DataIntegrityViolationException ex) {
            // RG-IDX-008 : contrainte uq_fiche_registre_numero violee.
            throw ApiException.conflict("ACTE_DEJA_INDEXE",
                "Un acte avec ce numero existe deja dans ce registre. Verifiez le numero avant de reessayer.");
        }

        java.util.List<AssociationPersonneActe> associationsEnregistrees = new java.util.ArrayList<>();
        for (PersonneAssocieeRequest personneRequete : requete.personnesAssociees()) {
            Personne personne = resoudrePersonne(personneRequete);

            AssociationPersonneActe association = new AssociationPersonneActe();
            association.setPersonne(personne);
            association.setFicheIndexation(fiche);
            association.setRole(personneRequete.role());
            associationsEnregistrees.add(associationRepository.save(association));
        }

        // Deduit automatiquement les liens de filiation (PERE/MERE <-> ENFANT)
        // quand la fiche porte les roles correspondants (typiquement un acte
        // de naissance) — voir LienParenteService pour le detail.
        lienParenteService.deriverDepuisFiche(associationsEnregistrees);

        return fiche;
    }

    private Personne resoudrePersonne(PersonneAssocieeRequest requete) {
        if (requete.personneId() != null) {
            return personneRepository.findById(requete.personneId())
                .orElseThrow(() -> ApiException.notFound("PERSONNE_INTROUVABLE", "Personne associee introuvable."));
        }
        // RG-IDX-012 : personne manquante creee dans la meme transaction que la fiche.
        Personne personne = new Personne();
        personne.setNom(requete.nom());
        personne.setPrenoms(requete.prenoms());
        return personneRepository.save(personne);
    }

    /**
     * Correctif : open-in-view est desactive (application.yml), donc les
     * associations @ManyToOne(LAZY) non touchees ici deviendraient des
     * proxys Hibernate non initialisables lors de la serialisation JSON,
     * une fois la transaction fermee (LazyInitializationException). On les
     * initialise explicitement pendant que la session est encore ouverte.
     */
    @Transactional(readOnly = true)
    public java.util.List<FicheIndexation> listerParRegistre(Long registreId) {
        java.util.List<FicheIndexation> fiches = ficheRepository.findByRegistreIdOrderByDateIndexationDesc(registreId);
        fiches.forEach(f -> {
            org.hibernate.Hibernate.initialize(f.getRegistre());
            org.hibernate.Hibernate.initialize(f.getTypeActe());
            org.hibernate.Hibernate.initialize(f.getAgent());
        });
        return fiches;
    }

    @Transactional
    public FicheIndexation marquerErronee(Long ficheId, MarquerErroneeRequest requete) {
        FicheIndexation fiche = ficheRepository.findById(ficheId)
            .orElseThrow(() -> ApiException.notFound("FICHE_INTROUVABLE", "Fiche d'indexation introuvable."));
        fiche.setStatut("ERRONEE");
        fiche.setMotifErreur(requete.motif());
        return ficheRepository.save(fiche);
    }

    /**
     * Modification generale d'une fiche deja indexee. Le registre et
     * l'agent createur ne sont volontairement pas modifiables ici : un
     * changement de registre passe par le module Registres (deplacement
     * trace), et l'agent createur est une donnee de tracabilite (RG-IDX-013).
     */
    @Transactional
    public FicheIndexation modifierFiche(Long ficheId, ModifierFicheIndexationRequest requete) {
        FicheIndexation fiche = ficheRepository.findById(ficheId)
            .orElseThrow(() -> ApiException.notFound("FICHE_INTROUVABLE", "Fiche d'indexation introuvable."));
        TypeActe typeActe = typeActeRepository.findById(requete.typeActeId())
            .orElseThrow(() -> ApiException.notFound("TYPE_ACTE_INTROUVABLE", "Type d'acte introuvable."));

        fiche.setNumeroActe(requete.numeroActe());
        fiche.setPage(requete.page());
        fiche.setTypeActe(typeActe);
        fiche.setDateEvenement(requete.dateEvenement());

        try {
            return ficheRepository.saveAndFlush(fiche);
        } catch (DataIntegrityViolationException ex) {
            // RG-IDX-008 : contrainte uq_fiche_registre_numero violee.
            throw ApiException.conflict("ACTE_DEJA_INDEXE",
                "Un acte avec ce numero existe deja dans ce registre. Verifiez le numero avant de reessayer.");
        }
    }
}
