package tg.civilis.personnes;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Fonctionnalite prevue des l'origine (section 11.7 du prompt maitre :
 * "referentiel central evitant les doublons, support de la recherche par
 * affiliation") et deja presente dans le schema V1 (table lien_parente),
 * mais jamais reliee a une entite JPA / un service / un controleur ni a
 * aucun ecran -> totalement invisible et inutilisable depuis le debut,
 * corrige ici (retour utilisateur : "je ne vois pas la partie qui parle
 * de l'affiliation").
 *
 * Un lien est oriente : personne -> personneApparentee avec un type_lien du
 * point de vue de "personne" (ex. personne=l'enfant, personneApparentee=le
 * pere, typeLien="PERE"). Cree automatiquement (DEDUIT) a partir des roles
 * TITULAIRE/PERE/MERE d'une meme fiche d'indexation (voir
 * LienParenteService.deriverDepuisFiche), ou manuellement (MANUEL).
 */
@Entity
@Table(name = "lien_parente")
@Getter @Setter @NoArgsConstructor
public class LienParente {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "personne_id", nullable = false)
    private Personne personne;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "personne_apparentee_id", nullable = false)
    private Personne personneApparentee;

    @Column(name = "type_lien", nullable = false, length = 30)
    private String typeLien;

    @Column(name = "mode_creation", nullable = false, length = 20)
    private String modeCreation;
}
