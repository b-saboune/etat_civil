package tg.civilis.rbac;

import java.io.Serializable;
import java.util.Objects;

/**
 * Cle composite de utilisateur_role (table sans colonne id — la cle
 * primaire est (utilisateur_id, role_id), cf. V1__initial_schema.sql).
 */
public class UtilisateurRoleId implements Serializable {
    private Long utilisateur;
    private Long role;

    public UtilisateurRoleId() {}

    public UtilisateurRoleId(Long utilisateur, Long role) {
        this.utilisateur = utilisateur;
        this.role = role;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UtilisateurRoleId that)) return false;
        return Objects.equals(utilisateur, that.utilisateur) && Objects.equals(role, that.role);
    }

    @Override
    public int hashCode() {
        return Objects.hash(utilisateur, role);
    }
}
