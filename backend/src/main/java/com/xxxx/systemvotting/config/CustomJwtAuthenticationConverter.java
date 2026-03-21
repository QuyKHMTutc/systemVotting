package com.xxxx.systemvotting.config;

import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Component
@RequiredArgsConstructor
public class CustomJwtAuthenticationConverter implements Converter<Jwt, UsernamePasswordAuthenticationToken> {

    private final UserRepository userRepository;

    @Override
    public UsernamePasswordAuthenticationToken convert(Jwt jwt) {
        String userId = jwt.getSubject();
        
        // Fetch the user from the database to ensure we have the most up-to-date roles and status
        User user = userRepository.findById(Long.valueOf(userId))
                .orElseThrow(() -> new org.springframework.security.core.userdetails.UsernameNotFoundException("User not found with ID: " + userId));

        // Optional: Check if the user is locked or disabled
        if (user.isLocked() || !user.isVerified()) {
            throw new org.springframework.security.authentication.DisabledException("User is locked or not verified");
        }

        Collection<GrantedAuthority> authorities = new ArrayList<>();
        List<String> roles = jwt.getClaimAsStringList("roles");
        if (roles != null) {
            for (String role : roles) {
                // Spring Security expects roles to be prefixed with "ROLE_" when using hasRole()
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
            }
        }

        return new UsernamePasswordAuthenticationToken(user, jwt, authorities);
    }
}
