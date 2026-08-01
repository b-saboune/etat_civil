package tg.civilis.notifications.dto;

import java.time.LocalDateTime;

public record NotificationDTO(
    Long id,
    String niveau,
    String module,
    String message,
    String lien,
    LocalDateTime dateCreation,
    boolean lu
) {}
