package tg.civilis.rbac.dto;

import java.util.List;

/**
 * RG-RBAC-002 : mise a jour d'un role par remplacement COMPLET de la
 * matrice, en une seule transaction (PUT complet, jamais de PATCH
 * incremental).
 */
public record MatricePermissionsRequest(List<Long> permissionIds) {}
