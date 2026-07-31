package tg.civilis.utilisateurs;

import java.io.Serializable;
import java.util.Objects;

/** Cle composite de utilisateur_centre (pas de colonne id, RG-UTI-001). */
public class UtilisateurCentreId implements Serializable {
    private Long utilisateur;
    private Long centre;

    public UtilisateurCentreId() {}

    public UtilisateurCentreId(Long utilisateur, Long centre) {
        this.utilisateur = utilisateur;
        this.centre = centre;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UtilisateurCentreId that)) return false;
        return Objects.equals(utilisateur, that.utilisateur) && Objects.equals(centre, that.centre);
    }

    @Override
    public int hashCode() {
        return Objects.hash(utilisateur, centre);
    }
}
