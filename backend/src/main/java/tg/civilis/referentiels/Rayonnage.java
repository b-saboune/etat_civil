package tg.civilis.referentiels;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "rayonnage")
@Getter @Setter @NoArgsConstructor
public class Rayonnage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salle_id", nullable = false)
    private SalleArchive salle;

    @Column(nullable = false, length = 150)
    private String designation;
}
