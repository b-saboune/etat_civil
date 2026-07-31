package tg.civilis.authentification;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import tg.civilis.utilisateurs.Utilisateur;

import java.util.Collection;
import java.util.List;

public class CivilisUserDetails implements UserDetails {

    private final Utilisateur utilisateur;

    public CivilisUserDetails(Utilisateur utilisateur) {
        this.utilisateur = utilisateur;
    }

    public Long getId() { return utilisateur.getId(); }
    public String getTypeCompte() { return utilisateur.getTypeCompte(); }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + utilisateur.getTypeCompte()));
    }

    @Override
    public String getPassword() { return utilisateur.getMotDePasseHash(); }

    @Override
    public String getUsername() { return utilisateur.getIdentifiant(); }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() {
        // RG-UTI-009 : un compte VERROUILLE ne peut jamais s'authentifier ;
        // seul un Administrateur peut lever ce verrou (aucun mecanisme automatique).
        return !"VERROUILLE".equals(utilisateur.getStatut());
    }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() {
        // RG-AUTH-001 : statut INACTIF traite comme desactive, message generique
        // renvoye par AuthService, jamais un detail permettant de deviner l'existence du compte.
        return "ACTIF".equals(utilisateur.getStatut());
    }
}
