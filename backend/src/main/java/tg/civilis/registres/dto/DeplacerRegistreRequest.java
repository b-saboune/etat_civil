package tg.civilis.registres.dto;

import jakarta.validation.constraints.NotNull;

/**
 * RG-REG-006 : le frontend doit avoir recueilli une confirmation explicite
 * avant d'appeler cet endpoint. L'auteur du deplacement n'est plus fourni
 * ici : il est desormais toujours derive du token JWT authentifie cote
 * controleur (meme correctif de securite que RG-IDX-013 sur l'indexation) —
 * un champ auteurId fourni par le client aurait permis d'attribuer a tort un
 * deplacement a un autre agent.
 */
public record DeplacerRegistreRequest(@NotNull Long nouveauRayonnageId) {}
