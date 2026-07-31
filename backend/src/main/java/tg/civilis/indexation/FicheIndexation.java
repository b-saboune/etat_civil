package tg.civilis.indexation;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import tg.civilis.referentiels.TypeActe;
import tg.civilis.registres.RegistrePhysique;
import tg.civilis.utilisateurs.Utilisateur;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Module le plus critique (section 11.8 du prompt maitre). RG-JUR-001 :
 * ne contient jamais le contenu juridique de l'acte, uniquement des
 * metadonnees d'indexation et de localisation.
 */
@Entity
@Table(name = "fiche_indexation")
@Getter @Setter @NoArgsConstructor
public class FicheIndexation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registre_id", nullable = false)
    private RegistrePhysique registre;

    @Column(name = "numero_acte", nullable = false, length = 50)
    private String numeroActe;

    @Column(nullable = false)
    private Integer page;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_acte_id", nullable = false)
    private TypeActe typeActe;

    @Column(name = "date_evenement", nullable = false)
    private LocalDate dateEvenement;

    @Column(name = "date_indexation", nullable = false)
    private LocalDateTime dateIndexation = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id", nullable = false)
    private Utilisateur agent;

    @Column(nullable = false, length = 20)
    private String statut = "VALIDE";

    @Column(name = "motif_erreur", length = 255)
    private String motifErreur;
}
