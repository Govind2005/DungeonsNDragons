package com.dungeonsNdragons.bouncer.security;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.auth0.jwt.interfaces.DecodedJWT;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
class JwtAuthFilter extends OncePerRequestFilter {
private final JwtService jwtService;

@Override
protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                FilterChain chain) throws ServletException, IOException {
    String authHeader = request.getHeader("Authorization");
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
        try {
            String token = jwtService.extractFromHeader(authHeader);
            DecodedJWT jwt = jwtService.verify(token);
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                jwt.getSubject(), null,
                List.of(new SimpleGrantedAuthority("ROLE_PLAYER")));
            SecurityContextHolder.getContext().setAuthentication(auth);
        } catch (Exception e) {
            log.debug("JWT auth failed: {}", e.getMessage());
        }
    }
    chain.doFilter(request, response);
}
}
