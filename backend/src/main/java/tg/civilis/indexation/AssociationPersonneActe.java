package tg.civilis.indexation;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import tg.civilis.personnes.Personne;

@Entity
@Table(name = "association_personne_acte")
@Getter @Setter @NoArgsConstructor
public class AssociationPersonneActe {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "personne_id", nullable = false)
    private Personne personne;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fiche_indexation_id", nullable = false)
    private FicheIndexation ficheIndexation;

    @Column(nullable = false, length = 30)
    private String role;
}
