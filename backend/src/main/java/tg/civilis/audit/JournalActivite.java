package tg.civilis.audit;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import tg.civilis.utilisateurs.Utilisateur;

import java.time.LocalDateTime;

/**
 * RG-AUD-001 : aucun endpoint PUT/DELETE n'est expose sur cette ressource,
 * sans exception (voir JournalController : uniquement des @GetMapping).
 */
@Entity
@Table(name = "journal_activite")
@Getter @Setter @NoArgsConstructor
public class JournalActivite {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;

    @Column(nullable = false, length = 50)
    private String module;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(name = "date_heure", nullable = false)
    private LocalDateTime dateHeure = LocalDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String details;
}
