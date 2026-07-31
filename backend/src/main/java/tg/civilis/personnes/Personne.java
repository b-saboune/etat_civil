package tg.civilis.personnes;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * RG-PER-002 : jamais de suppression physique, seule la desactivation
 * (statut FUSIONNEE) est autorisee, via le processus de fusion de doublons.
 */
@Entity
@Table(name = "personne")
@Getter @Setter @NoArgsConstructor
public class Personne {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(nullable = false, length = 150)
    private String prenoms;

    @Column(length = 1)
    private String sexe;

    @Column(name = "date_naissance")
    private LocalDate dateNaissance;

    @Column(name = "date_approximative", nullable = false)
    private boolean dateApproximative = false;

    @Column(nullable = false, length = 20)
    private String statut = "ACTIVE";
}
