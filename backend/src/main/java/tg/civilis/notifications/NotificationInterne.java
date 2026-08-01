package tg.civilis.notifications;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import tg.civilis.utilisateurs.Utilisateur;

import java.time.LocalDateTime;

/**
 * Notification interne agent/administrateur (section 20/46 du Prompt
 * Maitre V3). utilisateur == null signifie une diffusion a tous les
 * utilisateurs authentifies (ex. echec de sauvegarde, RG-PAR-002).
 * Distincte de la table "notification" (V1), reservee aux demandeurs
 * citoyens du Palier 3.
 */
@Entity
@Table(name = "notification_interne")
@Getter @Setter @NoArgsConstructor
public class NotificationInterne {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;

    @Column(nullable = false, length = 20)
    private String niveau;

    @Column(nullable = false, length = 50)
    private String module;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(length = 200)
    private String lien;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    @Column(nullable = false)
    private boolean lu = false;

    @Column(name = "date_lecture")
    private LocalDateTime dateLecture;
}
