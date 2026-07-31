package tg.civilis.rapports;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tg.civilis.common.exception.ApiException;
import tg.civilis.rapports.dto.GenererRapportRequest;
import tg.civilis.rapports.dto.RapportResumeDTO;
import tg.civilis.utilisateurs.Utilisateur;
import tg.civilis.utilisateurs.UtilisateurRepository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * RG-RAP-001 : module de generation de rapports statistiques. Chaque
 * rapport genere est fige (voir Rapport.java) — la colonne "criteres"
 * (JSONB) porte a la fois les parametres de filtrage et le resultat
 * calcule au moment T, jamais recalcule ensuite.
 *
 * Types geres a ce stade : FICHES_PAR_CENTRE, FICHES_PAR_AGENT,
 * REPARTITION_TYPE_ACTE. Liste volontairement restreinte a des besoins
 * de pilotage reels du Palier 1 plutot qu'une liste artificiellement
 * longue ; d'autres types peuvent etre ajoutes sur le meme modele.
 */
@Service
public class RapportService {

    private static final List<String> TYPES_SUPPORTES = List.of(
        "FICHES_PAR_CENTRE", "FICHES_PAR_AGENT", "REPARTITION_TYPE_ACTE");

    @PersistenceContext
    private EntityManager entityManager;

    private final RapportRepository rapportRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RapportService(RapportRepository rapportRepository, UtilisateurRepository utilisateurRepository) {
        this.rapportRepository = rapportRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    @Transactional
    public Rapport generer(GenererRapportRequest requete, Long utilisateurId) {
        if (!TYPES_SUPPORTES.contains(requete.type())) {
            throw ApiException.badRequest("TYPE_RAPPORT_INCONNU",
                "Type de rapport non reconnu. Types disponibles : " + String.join(", ", TYPES_SUPPORTES));
        }
        if (requete.dateFin().isBefore(requete.dateDebut())) {
            throw ApiException.badRequest("PLAGE_DATES_INVALIDE", "La date de fin doit etre posterieure a la date de debut.");
        }
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
            .orElseThrow(() -> ApiException.notFound("UTILISATEUR_INTROUVABLE", "Utilisateur introuvable."));

        List<String> colonnes;
        List<List<Object>> lignes;
        switch (requete.type()) {
            case "FICHES_PAR_CENTRE" -> {
                colonnes = List.of("Centre", "Nombre de fiches indexees");
                lignes = executerRequeteDeuxColonnes("""
                    SELECT c.nom, count(fi.id)
                    FROM centre_etat_civil c
                    LEFT JOIN registre_physique r ON r.centre_id = c.id
                    LEFT JOIN fiche_indexation fi ON fi.registre_id = r.id
                        AND fi.date_indexation::date BETWEEN :debut AND :fin
                    WHERE (:centreId IS NULL OR c.id = :centreId)
                    GROUP BY c.nom ORDER BY c.nom
                    """, requete);
            }
            case "FICHES_PAR_AGENT" -> {
                colonnes = List.of("Agent", "Nombre de fiches indexees");
                lignes = executerRequeteDeuxColonnes("""
                    SELECT u.identifiant, count(fi.id)
                    FROM utilisateur u
                    LEFT JOIN fiche_indexation fi ON fi.agent_id = u.id
                        AND fi.date_indexation::date BETWEEN :debut AND :fin
                    WHERE u.type_compte = 'AGENT'
                    GROUP BY u.identifiant ORDER BY u.identifiant
                    """, requete);
            }
            case "REPARTITION_TYPE_ACTE" -> {
                colonnes = List.of("Type d'acte", "Nombre de fiches indexees");
                lignes = executerRequeteDeuxColonnes("""
                    SELECT ta.libelle, count(fi.id)
                    FROM type_acte ta
                    LEFT JOIN fiche_indexation fi ON fi.type_acte_id = ta.id
                        AND fi.date_indexation::date BETWEEN :debut AND :fin
                    GROUP BY ta.libelle ORDER BY ta.libelle
                    """, requete);
            }
            default -> throw new IllegalStateException("Type deja valide plus haut.");
        }

        Map<String, Object> snapshot = new LinkedHashMap<>();
        Map<String, Object> criteres = new LinkedHashMap<>();
        criteres.put("dateDebut", requete.dateDebut().toString());
        criteres.put("dateFin", requete.dateFin().toString());
        criteres.put("centreId", requete.centreId());
        snapshot.put("criteres", criteres);
        snapshot.put("colonnes", colonnes);
        snapshot.put("lignes", lignes);

        Rapport rapport = new Rapport();
        rapport.setType(requete.type());
        rapport.setUtilisateur(utilisateur);
        try {
            rapport.setCriteres(objectMapper.writeValueAsString(snapshot));
        } catch (Exception e) {
            throw new IllegalStateException("Erreur de serialisation du rapport.", e);
        }
        return rapportRepository.save(rapport);
    }

    @SuppressWarnings("unchecked")
    private List<List<Object>> executerRequeteDeuxColonnes(String sql, GenererRapportRequest requete) {
        Query query = entityManager.createNativeQuery(sql)
            .setParameter("debut", requete.dateDebut())
            .setParameter("fin", requete.dateFin());
        // centreId n'est utilise que par FICHES_PAR_CENTRE ; les autres requetes
        // ignorent ce parametre nomme s'il n'apparait pas dans leur SQL.
        if (sql.contains(":centreId")) {
            query.setParameter("centreId", requete.centreId());
        }
        List<Object[]> resultats = query.getResultList();
        return resultats.stream()
            .map(ligne -> List.of(ligne[0] == null ? "" : ligne[0], ((Number) ligne[1]).longValue()))
            .map(l -> (List<Object>) l)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<RapportResumeDTO> lister() {
        return rapportRepository.findAllByOrderByDateGenerationDesc().stream()
            .map(r -> new RapportResumeDTO(r.getId(), r.getType(), r.getUtilisateur().getIdentifiant(), r.getDateGeneration()))
            .toList();
    }

    /**
     * Correctif : open-in-view desactive -> initialiser la relation lazy
     * "utilisateur" pendant que la session est ouverte, sinon Jackson leve
     * une LazyInitializationException lors de la serialisation du controleur.
     */
    @Transactional(readOnly = true)
    public Rapport obtenir(Long id) {
        Rapport rapport = rapportRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("RAPPORT_INTROUVABLE", "Rapport introuvable."));
        org.hibernate.Hibernate.initialize(rapport.getUtilisateur());
        return rapport;
    }

    @Transactional(readOnly = true)
    public String exporterCsv(Long id) {
        Rapport rapport = obtenir(id);
        try {
            Map<String, Object> snapshot = objectMapper.readValue(rapport.getCriteres(), Map.class);
            @SuppressWarnings("unchecked")
            List<String> colonnes = (List<String>) snapshot.get("colonnes");
            @SuppressWarnings("unchecked")
            List<List<Object>> lignes = (List<List<Object>>) snapshot.get("lignes");

            StringBuilder csv = new StringBuilder();
            csv.append(String.join(";", colonnes)).append("\n");
            for (List<Object> ligne : lignes) {
                csv.append(ligne.stream().map(String::valueOf).map(v -> v.replace(";", ",")).reduce((a, b) -> a + ";" + b).orElse(""))
                    .append("\n");
            }
            return csv.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Erreur de generation du CSV.", e);
        }
    }
}
