package tg.civilis.rbac;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import tg.civilis.utilisateurs.Utilisateur;

/**
 * Correction : utilisateur_role n'a pas de colonne id (cle primaire
 * composite utilisateur_id/role_id, cf. V1__initial_schema.sql). Cle
 * composite via @IdClass plutot qu'un faux id auto-genere.
 */
@Entity
@Table(name = "utilisateur_role")
@IdClass(UtilisateurRoleId.class)
@Getter @Setter @NoArgsConstructor
public class UtilisateurRole {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;
}
