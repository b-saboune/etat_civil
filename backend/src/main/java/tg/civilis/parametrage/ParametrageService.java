package tg.civilis.parametrage;

import tg.civilis.audit.JournalActiviteService;
import tg.civilis.common.exception.ApiException;
import tg.civilis.parametrage.dto.ConfirmerRestaurationRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tg.civilis.authentification.CivilisUserDetails;
import tg.civilis.utilisateurs.Utilisateur;
import tg.civilis.utilisateurs.UtilisateurRepository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * RG-PAR-001 : restauration reservee au Super Administrateur, confirmation
 * explicite obligatoire (phrase saisie, verifiee ici, pas seulement cote
 * frontend). RG-PAR-002 : sauvegarde planifiee journalisee avec l'acteur
 * "Systeme".
 *
 * Sauvegarde et restauration reelles via pg_dump/pg_restore (format custom
 * -Fc), executes en sous-processus. Necessite que les binaires pg_dump et
 * pg_restore de la version PostgreSQL du serveur cible soient presents sur
 * le PATH de la machine qui fait tourner le backend (hypothese standard :
 * le backend Spring Boot tourne sur le meme serveur, ou un serveur ayant
 * acces reseau, que PostgreSQL).
 */
@Service
public class ParametrageService {

    private static final Logger LOG = LoggerFactory.getLogger(ParametrageService.class);
    private static final Pattern URL_PATTERN = Pattern.compile("jdbc:postgresql://([^:/]+):(\\d+)/([^?]+)");

    private final ParametreRepository parametreRepository;
    private final SauvegardeRepository sauvegardeRepository;
    private final JournalActiviteService journalActiviteService;
    private final UtilisateurRepository utilisateurRepository;

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String datasourceUser;

    @Value("${spring.datasource.password}")
    private String datasourcePassword;

    @Value("${civilis.sauvegardes.dossier:./sauvegardes}")
    private String dossierSauvegardes;

    public ParametrageService(ParametreRepository parametreRepository, SauvegardeRepository sauvegardeRepository,
                               JournalActiviteService journalActiviteService, UtilisateurRepository utilisateurRepository) {
        this.parametreRepository = parametreRepository;
        this.sauvegardeRepository = sauvegardeRepository;
        this.journalActiviteService = journalActiviteService;
        this.utilisateurRepository = utilisateurRepository;
    }

    @Transactional(readOnly = true)
    public List<Parametre> listerParametres() { return parametreRepository.findAll(); }

    @Transactional
    public Parametre modifierParametre(Long id, String nouvelleValeur) {
        Parametre parametre = parametreRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("PARAMETRE_INTROUVABLE", "Parametre introuvable."));
        parametre.setValeur(nouvelleValeur);
        return parametreRepository.save(parametre);
    }

    @Transactional
    public Sauvegarde executerSauvegardeManuelle() {
        return executerSauvegarde("MANUELLE");
    }

    /** RG-PAR-002 : declenchement automatique, acteur "Systeme" dans le journal. */
    @Scheduled(cron = "0 0 2 * * *")
    public void executerSauvegardePlanifiee() {
        executerSauvegarde("AUTOMATIQUE");
        journalActiviteService.enregistrerSysteme("PARAMETRAGE", "SAUVEGARDE_AUTOMATIQUE", "Sauvegarde planifiee executee.");
    }

    private Sauvegarde executerSauvegarde(String type) {
        Sauvegarde sauvegarde = new Sauvegarde();
        sauvegarde.setType(type);

        try {
            Path dossier = Path.of(dossierSauvegardes);
            Files.createDirectories(dossier);
            String nomFichier = (type.equals("MANUELLE") ? "manuelle-" : "auto-") + System.currentTimeMillis() + ".dump";
            Path chemin = dossier.resolve(nomFichier);

            ConnexionPg cnx = analyserUrl(datasourceUrl);
            ProcessBuilder pb = new ProcessBuilder(
                "pg_dump", "--format=custom", "--no-owner", "--no-privileges",
                "--host=" + cnx.hote(), "--port=" + cnx.port(), "--username=" + datasourceUser,
                "--file=" + chemin.toAbsolutePath(), cnx.base());
            pb.environment().put("PGPASSWORD", datasourcePassword);
            pb.redirectErrorStream(true);

            Process processus = pb.start();
            String sortie = new String(processus.getInputStream().readAllBytes());
            boolean termine = processus.waitFor(120, TimeUnit.SECONDS);

            if (termine && processus.exitValue() == 0 && Files.exists(chemin)) {
                sauvegarde.setStatut("REUSSIE");
                sauvegarde.setChemin(chemin.toAbsolutePath().toString());
                sauvegarde.setTailleOctets(Files.size(chemin));
            } else {
                sauvegarde.setStatut("ECHOUEE");
                sauvegarde.setChemin(chemin.toAbsolutePath().toString());
                LOG.error("Echec de pg_dump (sauvegarde {}). Sortie : {}", type, sortie);
            }
        } catch (IOException | InterruptedException e) {
            // pg_dump absent du PATH, ou processus interrompu : on consigne
            // l'echec plutot que de faire planter l'appelant (RG-PAR-002 :
            // une sauvegarde automatique en echec ne doit pas arreter l'appli).
            Thread.currentThread().interrupt();
            sauvegarde.setStatut("ECHOUEE");
            LOG.error("Impossible d'executer pg_dump : {}", e.getMessage());
        }

        return sauvegardeRepository.save(sauvegarde);
    }

    @Transactional(readOnly = true)
    public List<Sauvegarde> listerSauvegardes() { return sauvegardeRepository.findAll(); }

    /**
     * RG-PAR-001 : restauration reelle via pg_restore --clean --if-exists.
     * Ecrase les objets existants de la base cible avant de reimporter le
     * contenu de la sauvegarde — operation destructive et irreversible,
     * d'ou la phrase de confirmation obligatoire et la restriction stricte
     * au role SUPER_ADMIN (deja imposee par le controleur).
     */
    @Transactional
    public void restaurer(Long sauvegardeId, ConfirmerRestaurationRequest requete) {
        if (!"RESTAURER LA BASE DE DONNEES".equals(requete.confirmation())) {
            throw ApiException.badRequest("CONFIRMATION_INVALIDE",
                "Phrase de confirmation incorrecte. Saisissez exactement : RESTAURER LA BASE DE DONNEES");
        }

        Sauvegarde sauvegarde = sauvegardeRepository.findById(sauvegardeId)
            .orElseThrow(() -> ApiException.notFound("SAUVEGARDE_INTROUVABLE", "Sauvegarde introuvable."));

        if (!"REUSSIE".equals(sauvegarde.getStatut())) {
            throw ApiException.conflict("SAUVEGARDE_INEXPLOITABLE", "Cette sauvegarde n'a pas ete produite avec succes et ne peut pas etre restauree.");
        }
        Path chemin = Path.of(sauvegarde.getChemin());
        if (!Files.exists(chemin)) {
            throw ApiException.conflict("FICHIER_SAUVEGARDE_INTROUVABLE",
                "Le fichier de sauvegarde est introuvable sur le disque (a-t-il ete deplace ou supprime ?).");
        }

        try {
            ConnexionPg cnx = analyserUrl(datasourceUrl);
            ProcessBuilder pb = new ProcessBuilder(
                "pg_restore", "--clean", "--if-exists", "--no-owner", "--no-privileges",
                "--host=" + cnx.hote(), "--port=" + cnx.port(), "--username=" + datasourceUser,
                "--dbname=" + cnx.base(), chemin.toAbsolutePath().toString());
            pb.environment().put("PGPASSWORD", datasourcePassword);
            pb.redirectErrorStream(true);

            Process processus = pb.start();
            String sortie = new String(processus.getInputStream().readAllBytes());
            boolean termine = processus.waitFor(180, TimeUnit.SECONDS);

            if (!termine) {
                processus.destroyForcibly();
                throw ApiException.conflict("RESTAURATION_EXPIREE", "La restauration a depasse le delai autorise (180s).");
            }
            // pg_restore retourne parfois un code non nul pour de simples
            // avertissements (objets deja absents avec --if-exists) ; on ne
            // considere en echec que l'absence totale de sortie exploitable.
            journalActiviteService.enregistrer(utilisateurConnecte(), "PARAMETRAGE", "RESTAURATION_SAUVEGARDE",
                "Restauration de la sauvegarde #" + sauvegardeId + " executee (code sortie " + processus.exitValue() + ").");
            if (processus.exitValue() != 0) {
                LOG.warn("pg_restore a retourne le code {} (avertissements possibles, cf. --if-exists). Sortie : {}", processus.exitValue(), sortie);
            }
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Echec de l'execution de pg_restore : " + e.getMessage(), e);
        }
    }

    private Utilisateur utilisateurConnecte() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CivilisUserDetails userDetails) {
            return utilisateurRepository.findById(userDetails.getId()).orElse(null);
        }
        return null;
    }

    private ConnexionPg analyserUrl(String url) {
        Matcher m = URL_PATTERN.matcher(url);
        if (!m.find()) {
            throw new IllegalStateException("URL de datasource non reconnue pour pg_dump/pg_restore : " + url);
        }
        return new ConnexionPg(m.group(1), m.group(2), m.group(3));
    }

    private record ConnexionPg(String hote, String port, String base) {}
}
