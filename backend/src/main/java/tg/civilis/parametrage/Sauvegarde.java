package tg.civilis.parametrage;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "sauvegarde")
@Getter @Setter @NoArgsConstructor
public class Sauvegarde {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_execution", nullable = false)
    private LocalDateTime dateExecution = LocalDateTime.now();

    @Column(nullable = false, length = 20)
    private String type;

    @Column(nullable = false, length = 20)
    private String statut;

    @Column(name = "taille_octets")
    private Long tailleOctets;

    @Column(length = 500)
    private String chemin;
}
