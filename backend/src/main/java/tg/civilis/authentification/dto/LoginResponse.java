package tg.civilis.authentification.dto;

public record LoginResponse(
    String accessToken,
    String refreshToken,
    String identifiant,
    String typeCompte
) {}
