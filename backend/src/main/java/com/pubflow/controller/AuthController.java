package com.pubflow.controller;

import com.pubflow.model.entity.UtenteEntity;
import com.pubflow.model.repository.UtenteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/pubflow/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UtenteRepository utenteRepository;

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMe(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String username = authentication.getName();
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("username", username);
        
        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
        userInfo.put("roles", roles);

        return ResponseEntity.ok(userInfo);
    }
}
