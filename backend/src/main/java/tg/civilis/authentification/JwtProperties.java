package tg.civilis.authentification;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "civilis.jwt")
public class JwtProperties {
    private String secret;
    private int accessTokenMinutes = 30;
    private int refreshTokenDays = 7;

    public String getSecret() { return secret; }
    public void setSecret(String secret) { this.secret = secret; }
    public int getAccessTokenMinutes() { return accessTokenMinutes; }
    public void setAccessTokenMinutes(int accessTokenMinutes) { this.accessTokenMinutes = accessTokenMinutes; }
    public int getRefreshTokenDays() { return refreshTokenDays; }
    public void setRefreshTokenDays(int refreshTokenDays) { this.refreshTokenDays = refreshTokenDays; }
}
