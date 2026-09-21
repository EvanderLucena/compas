package com.nutriai.api.auth;

import com.nutriai.api.auth.dto.*;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    @Value("${compas.jwt.cookie.name:${nutriai.jwt.cookie.name:compas_refresh}}")
    private String cookieName;

    @Value("${nutriai.jwt.cookie.path:/api/v1/auth}")
    private String cookiePath;

    @Value("${nutriai.jwt.cookie.max-age:604800}")
    private int cookieMaxAge;

    @Value("${nutriai.jwt.cookie.secure:false}")
    private boolean cookieSecure;

    @Value("${nutriai.jwt.cookie.same-site:Lax}")
    private String cookieSameSite;

    // HttpOnly is hardcoded in buildCookieHeaderValue() — always emitted.
    // The cookieHttpOnly property was removed because it defaulted to true
    // and was never actually read (the builder appends "; HttpOnly" directly).

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(
            @RequestBody @Valid SignupRequest request,
            HttpServletResponse response
    ) {
        AuthService.SignupResult result = authService.signup(request);

        setRefreshTokenCookie(response, result.refreshToken(), cookieMaxAge);

        return ResponseEntity.ok(Map.of(
                "accessToken", result.accessToken(),
                "user", Map.of(
                        "id", result.user().id(),
                        "name", result.user().name(),
                        "email", result.user().email(),
                        "role", result.user().role(),
                        "onboardingCompleted", result.user().onboardingCompleted()
                )
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody @Valid LoginRequest request,
            HttpServletResponse response
    ) {
        AuthService.LoginResult result = authService.login(request);

        setRefreshTokenCookie(response, result.refreshToken(), cookieMaxAge);

        return ResponseEntity.ok(Map.of(
                "accessToken", result.accessToken(),
                "user", Map.of(
                        "id", result.user().id(),
                        "name", result.user().name(),
                        "email", result.user().email(),
                        "role", result.user().role(),
                        "onboardingCompleted", result.user().onboardingCompleted()
                )
        ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refresh(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String refreshToken = extractRefreshToken(request);
        if (refreshToken == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("success", false, "message", "Refresh token não encontrado"));
        }

        AuthService.RefreshResult result = authService.refresh(refreshToken);

        setRefreshTokenCookie(response, result.refreshToken(), cookieMaxAge);

        return ResponseEntity.ok(Map.of(
                "accessToken", result.accessToken(),
                "user", Map.of(
                        "id", result.user().id(),
                        "name", result.user().name(),
                        "email", result.user().email(),
                        "role", result.user().role(),
                        "onboardingCompleted", result.user().onboardingCompleted()
                )
        ));
    }

    @PostMapping("/logout")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    public ResponseEntity<Map<String, Object>> logout(HttpServletResponse response) {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        authService.logout(nutritionistId);

        // Clear refresh token cookie
        setRefreshTokenCookie(response, "", 0);
        if (!"nutriai_refresh".equals(cookieName)) {
            response.addHeader(
                    "Set-Cookie",
                    "nutriai_refresh=; Path=" + cookiePath + "; Max-Age=0; HttpOnly"
                            + (cookieSecure ? "; Secure" : "")
                            + "; SameSite=" + cookieSameSite
            );
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "Logout realizado com sucesso"));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    public ResponseEntity<MeResponse> me() {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        MeResponse meResponse = authService.getCurrentUser(nutritionistId);
        return ResponseEntity.ok(meResponse);
    }

    @PostMapping("/onboarding")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    public ResponseEntity<Map<String, Object>> completeOnboarding() {
        UUID nutritionistId = NutritionistAccess.getCurrentNutritionistId();
        authService.completeOnboarding(nutritionistId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Onboarding concluído"));
    }

    private String extractRefreshToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookieName.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
            // Fallback for sessions with legacy cookie name
            for (Cookie cookie : cookies) {
                if ("nutriai_refresh".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String value, int maxAge) {
        // Use only addHeader with the full Set-Cookie value (including SameSite).
        // addCookie() doesn't support SameSite and would create a duplicate Set-Cookie header.
        response.addHeader("Set-Cookie", buildCookieHeaderValue(value, maxAge));
    }

    private String buildCookieHeaderValue(String value, int maxAge) {
        StringBuilder sb = new StringBuilder();
        sb.append(cookieName).append("=").append(value);
        sb.append("; Path=").append(cookiePath);
        sb.append("; Max-Age=").append(maxAge);
        sb.append("; HttpOnly");
        if (cookieSecure) {
            sb.append("; Secure");
        }
        sb.append("; SameSite=").append(cookieSameSite);
        return sb.toString();
    }
}