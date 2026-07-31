package tg.civilis.utilisateurs;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * RG-UTI-009 : tentativesEchec pilote le verrouillage automatique ; le
 * deverrouillage, lui, est exclusivement manuel (jamais programme ici).
 */
@Entity
@Table(name = "utilisateur")
@Getter @Setter @NoArgsConstructor
public class Utilisateur {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String identifiant;

    // Correctif de securite : ce champ ne doit jamais quitter le backend, meme
    // sous forme de hash BCrypt (fuite qui faciliterait une attaque hors ligne).
    // Toutes les entites qui exposaient un Utilisateur complet en reponse JSON
    // (agents, fiches d'indexation via agent, rapports via utilisateur...)
    // beneficient de cette correction sans autre changement de leur cote.
    @JsonIgnore
    @Column(name = "mot_de_passe_hash", nullable = false, length = 255)
    private String motDePasseHash;

    @Column(name = "type_compte", nullable = false, length = 20)
    private String typeCompte;

    @Column(nullable = false, length = 20)
    private String statut = "ACTIF";

    @Column(name = "tentatives_echec", nullable = false)
    private Integer tentativesEchec = 0;
}
