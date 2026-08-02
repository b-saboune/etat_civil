package tg.civilis.config;

import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Correctif critique (voir pom.xml) : plusieurs controleurs renvoient
 * directement des entites JPA portant des associations @ManyToOne(LAZY)
 * (RegistrePhysique -> centre/rayonnage/typeActe, CentreEtatCivil -> commune,
 * Rayonnage -> salle, SalleArchive -> centre...). Sans ce module, Jackson leve
 * une InvalidDefinitionException des qu'il rencontre un proxy Hibernate non
 * initialise -> 500 sur GET /api/registres, /api/referentiels/centres,
 * /salles, /rayonnages (constate en test reel).
 *
 * FORCE_LAZY_LOADING est active : spring.jpa.open-in-view=true garde la
 * session Hibernate ouverte jusqu'a la fin de la reponse HTTP, donc charger
 * une association a la volee pendant la serialisation est sans risque
 * (LazyInitializationException) et evite de renvoyer des champs manquants
 * (ex. le nom de la commune d'un centre, jusque-la silencieusement absent).
 *
 * Correctif transitoire en attendant la migration complete vers des DTO
 * explicites pour chaque reponse (aucune entite JPA jamais exposee), deja
 * amorcee par endroits (RegistreDTO, NotificationDTO...).
 */
@Configuration
public class JacksonConfig {

    @Bean
    public Hibernate6Module hibernate6Module() {
        Hibernate6Module module = new Hibernate6Module();
        module.enable(Hibernate6Module.Feature.FORCE_LAZY_LOADING);
        return module;
    }
}
