package tg.civilis.authentification;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * RG-RBAC-002 / RG-AUTH-003 : les autorites Spring Security d'une requete
 * combinent le role de base (ROLE_AGENT/ROLE_ADMINISTRATEUR/ROLE_SUPER_ADMIN,
 * conserve pour les endpoints strictement reserves au Super Administrateur -
 * RG-ADM-001/002) ET les codes de permission resolus dynamiquement depuis la
 * matrice role_permission au moment de la connexion (claim "perms" du JWT).
 * Aucune requete base supplementaire n'est necessaire ici : les permissions
 * voyagent dans le token signe, ce qui satisfait RG-AUTH-003.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);
        try {
            String identifiant = jwtService.extraireIdentifiant(token);
            if (identifiant != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                CivilisUserDetails userDetails = (CivilisUserDetails) userDetailsService.loadUserByUsername(identifiant);
                if (jwtService.estValide(token, identifiant)) {
                    List<GrantedAuthority> autorites = new ArrayList<>(userDetails.getAuthorities());
                    for (String code : jwtService.extrairePermissions(token)) {
                        autorites.add(new SimpleGrantedAuthority(code));
                    }
                    var authToken = new UsernamePasswordAuthenticationToken(userDetails, null, autorites);
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception ex) {
            // Token invalide/expire : la requete continue non authentifiee,
            // Spring Security renverra 401/403 selon la regle d'acces.
            SecurityContextHolder.clearContext();
        }
        filterChain.doFilter(request, response);
    }
}
