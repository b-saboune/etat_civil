package tg.civilis.utilisateurs;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import tg.civilis.referentiels.CentreEtatCivil;

/**
 * RG-UTI-001 : un agent peut etre affecte a plusieurs centres d'etat
 * civil. Cle composite (utilisateur_id, centre_id), pas de colonne id
 * (cf. V1__initial_schema.sql).
 */
@Entity
@Table(name = "utilisateur_centre")
@IdClass(UtilisateurCentreId.class)
@Getter @Setter @NoArgsConstructor
public class UtilisateurCentre {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "centre_id", nullable = false)
    private CentreEtatCivil centre;
}
