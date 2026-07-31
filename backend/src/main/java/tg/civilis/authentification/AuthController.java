package tg.civilis.authentification;

import tg.civilis.authentification.dto.LoginRequest;
import tg.civilis.authentification.dto.LoginResponse;
import tg.civilis.authentification.dto.MeResponse;
import tg.civilis.authentification.dto.RefreshRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentification")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.authentifier(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService.rafraichir(request));
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me(@AuthenticationPrincipal CivilisUserDetails userDetails) {
        return ResponseEntity.ok(new MeResponse(userDetails.getId(), userDetails.getUsername(), userDetails.getTypeCompte()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // RG-AUTH-002 : le JWT n'est jamais stocke cote serveur (stateless) ;
        // la deconnexion est purement cote client (suppression du token en memoire).
        return ResponseEntity.noContent().build();
    }
}
