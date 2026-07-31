package tg.civilis.referentiels;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "salle_archive")
@Getter @Setter @NoArgsConstructor
public class SalleArchive {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "centre_id", nullable = false)
    private CentreEtatCivil centre;

    @Column(nullable = false, length = 150)
    private String designation;
}
