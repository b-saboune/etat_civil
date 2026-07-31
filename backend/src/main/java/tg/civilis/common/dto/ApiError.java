package tg.civilis.common.dto;

import java.time.Instant;
import java.util.List;

public record ApiError(
    Instant horodatage,
    int statut,
    String code,
    String message,
    List<String> details
) {
    public static ApiError of(int statut, String code, String message) {
        return new ApiError(Instant.now(), statut, code, message, List.of());
    }

    public static ApiError of(int statut, String code, String message, List<String> details) {
        return new ApiError(Instant.now(), statut, code, message, details);
    }
}
