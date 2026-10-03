package com.sms.security;

import com.sms.entity.User;
import com.sms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        // Allows login via Email, Roll Number, Student ID, or Faculty ID
        User user = userRepository.findByIdentifier(identifier.trim())
                .orElseThrow(() -> new UsernameNotFoundException("User not found with identifier: " + identifier));

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(), // standard principal username is email
                user.getPassword(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }
}
