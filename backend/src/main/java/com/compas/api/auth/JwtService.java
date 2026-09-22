package com.compas.api.auth;

import com.compas.api.model.Nutritionist;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;

    public JwtService(
            @Value("${compas.jwt.secret:${nutriai.jwt.secret}}") String secret,
            @Value("${compas.jwt.access-token-expiration:${nutriai.jwt.access-token-expiration}}") long accessTokenExpiration,
            @Value("${compas.jwt.refresh-token-expiration:${nutriai.jwt.refresh-token-expiration}}") long refreshTokenExpiration
    ) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    public String generateAccessToken(Nutritionist nutritionist) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessTokenExpiration);

        return Jwts.builder()
                .subject(nutritionist.getId().toString())
                .claim("email", nutritionist.getEmail())
                .claim("role", nutritionist.getRole().name())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    public String generateRefreshToken(Nutritionist nutritionist) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + refreshTokenExpiration);
        String jti = UUID.randomUUID().toString();

        return Jwts.builder()
                .subject(nutritionist.getId().toString())
                .claim("jti", jti)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    public Jws<Claims> validateToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token);
    }

    public UUID extractNutritionistId(String token) {
        Jws<Claims> claims = validateToken(token);
        return UUID.fromString(claims.getPayload().getSubject());
    }

    public String extractJti(String token) {
        Jws<Claims> claims = validateToken(token);
        return claims.getPayload().get("jti", String.class);
    }
}