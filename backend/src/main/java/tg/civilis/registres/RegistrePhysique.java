package tg.civilis.registres;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import tg.civilis.referentiels.CentreEtatCivil;
import tg.civilis.referentiels.Rayonnage;
import tg.civilis.referentiels.TypeActe;

@Entity
@Table(name = "registre_physique")
@Getter @Setter @NoArgsConstructor
public class RegistrePhysique {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "centre_id", nullable = false)
    private CentreEtatCivil centre;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rayonnage_id", nullable = false)
    private Rayonnage rayonnage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_acte_id", nullable = false)
    private TypeActe typeActe;

    @Column(name = "numero_registre", nullable = false, length = 50)
    private String numeroRegistre;

    @Column(nullable = false)
    private Integer annee;

    @Column(name = "nb_pages", nullable = false)
    private Integer nbPages;

    @Column(nullable = false, length = 20)
    private String statut = "EN_SERVICE";
}
