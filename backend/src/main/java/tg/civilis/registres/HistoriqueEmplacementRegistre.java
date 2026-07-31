package tg.civilis.registres;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import tg.civilis.referentiels.Rayonnage;
import tg.civilis.utilisateurs.Utilisateur;

import java.time.LocalDateTime;

@Entity
@Table(name = "historique_emplacement_registre")
@Getter @Setter @NoArgsConstructor
public class HistoriqueEmplacementRegistre {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registre_id", nullable = false)
    private RegistrePhysique registre;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ancien_rayonnage_id")
    private Rayonnage ancienRayonnage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nouveau_rayonnage_id", nullable = false)
    private Rayonnage nouveauRayonnage;

    @Column(name = "date_deplacement", nullable = false)
    private LocalDateTime dateDeplacement = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auteur_id", nullable = false)
    private Utilisateur auteur;
}
