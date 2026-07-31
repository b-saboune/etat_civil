package tg.civilis.utilisateurs;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "historique_connexion")
@Getter @Setter @NoArgsConstructor
public class HistoriqueConnexion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Column(name = "date_connexion", nullable = false)
    private LocalDateTime dateConnexion = LocalDateTime.now();

    @Column(name = "adresse_ip", length = 45)
    private String adresseIp;

    @Column(nullable = false, length = 20)
    private String statut;
}
