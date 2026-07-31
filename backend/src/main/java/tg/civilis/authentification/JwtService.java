package tg.civilis.authentification;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.function.Function;

/**
 * RG-AUTH-003 : le token embarque type_compte et les permissions resolues
 * pour eviter une requete base a chaque appel protege.
 */
@Service
@EnableConfigurationProperties(JwtProperties.class)
public class JwtService {

    private final JwtProperties properties;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
    }

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(properties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String genererAccessToken(CivilisUserDetails userDetails) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(userDetails.getUsername())
            .claim("uid", userDetails.getId())
            .claim("type_compte", userDetails.getTypeCompte())
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(properties.getAccessTokenMinutes(), ChronoUnit.MINUTES)))
            .signWith(signingKey())
            .compact();
    }

    public String genererRefreshToken(CivilisUserDetails userDetails) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(userDetails.getUsername())
            .claim("type", "refresh")
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(properties.getRefreshTokenDays(), ChronoUnit.DAYS)))
            .signWith(signingKey())
            .compact();
    }

    public String extraireIdentifiant(String token) {
        return extraireClaim(token, Claims::getSubject);
    }

    public boolean estValide(String token, String identifiantAttendu) {
        String identifiant = extraireIdentifiant(token);
        return identifiant.equals(identifiantAttendu) && !estExpire(token);
    }

    private boolean estExpire(String token) {
        return extraireClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extraireClaim(String token, Function<Claims, T> resolver) {
        Claims claims = Jwts.parser().verifyWith(signingKey()).build().parseSignedClaims(token).getPayload();
        return resolver.apply(claims);
    }
}
