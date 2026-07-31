package tg.civilis.rapports;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import tg.civilis.utilisateurs.Utilisateur;

import java.time.LocalDateTime;

/**
 * RG-RAP-001 : un rapport, une fois genere, est un instantane fige. La
 * colonne "criteres" (JSONB, deja prevue par V1__initial_schema.sql)
 * porte a la fois les criteres de filtrage ET les resultats calcules au
 * moment de la generation — consulter un rapport plus tard ne relance
 * jamais le calcul, il n'affiche que ce qui a ete fige (aucune donnee
 * indexee apres coup ne peut donc "corriger" un rapport deja emis).
 */
@Entity
@Table(name = "rapport")
@Getter @Setter @NoArgsConstructor
public class Rapport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String type;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String criteres;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Column(name = "date_generation", nullable = false)
    private LocalDateTime dateGeneration = LocalDateTime.now();
}
