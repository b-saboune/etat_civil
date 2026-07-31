package tg.civilis.authentification;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import tg.civilis.utilisateurs.UtilisateurRepository;

@Service
public class CivilisUserDetailsService implements UserDetailsService {

    private final UtilisateurRepository utilisateurRepository;

    public CivilisUserDetailsService(UtilisateurRepository utilisateurRepository) {
        this.utilisateurRepository = utilisateurRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String identifiant) throws UsernameNotFoundException {
        return utilisateurRepository.findByIdentifiant(identifiant)
            .map(CivilisUserDetails::new)
            .orElseThrow(() -> new UsernameNotFoundException("Identifiant ou mot de passe incorrect."));
    }
}
