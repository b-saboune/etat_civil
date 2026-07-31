package tg.civilis;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CivilisApplication {
    public static void main(String[] args) {
        SpringApplication.run(CivilisApplication.class, args);
    }
}
