package tg.civilis.rapports.dto;

import java.time.LocalDateTime;

public record RapportResumeDTO(Long id, String type, String genereParIdentifiant, LocalDateTime dateGeneration) {}
