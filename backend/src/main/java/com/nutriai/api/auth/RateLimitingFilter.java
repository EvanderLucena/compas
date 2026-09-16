package com.nutriai.api.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

/**
 * Redis-backed rate limiting filter for sensitive endpoints.
 * Protects login, signup, and webhook endpoints against brute force and DoS.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Logger LOG = LoggerFactory.getLogger(RateLimitingFilter.class);

    private static final int LOGIN_MAX_REQUESTS = 10;
    private static final int SIGNUP_MAX_REQUESTS = 5;
    private static final int WEBHOOK_MAX_REQUESTS = 120;
    private static final long WINDOW_SECONDS = 60;

    private final StringRedisTemplate redisTemplate;

    public RateLimitingFilter(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        if ("POST".equalsIgnoreCase(method)) {
            String clientIp = extractClientIp(request);
            boolean allowed = true;

            if (path.equals("/api/v1/auth/login")) {
                allowed = checkRateLimit("rate_limit:login:" + clientIp, LOGIN_MAX_REQUESTS);
            } else if (path.equals("/api/v1/auth/signup")) {
                allowed = checkRateLimit("rate_limit:signup:" + clientIp, SIGNUP_MAX_REQUESTS);
            } else if (path.equals("/api/v1/webhooks/whatsapp")) {
                allowed = checkRateLimit("rate_limit:webhook:" + clientIp, WEBHOOK_MAX_REQUESTS);
            }

            if (!allowed) {
                LOG.warn("Rate limit exceeded for IP {} on {}", clientIp, path);
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json;charset=UTF-8");
                response.setHeader("Retry-After", String.valueOf(WINDOW_SECONDS));
                response.getWriter().write(
                        "{\"success\":false,\"message\":\"Muitas requisições. "
                                + "Por favor, aguarde um momento antes de tentar novamente.\"}"
                );
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean checkRateLimit(String key, int maxRequests) {
        if (redisTemplate == null) {
            return true;
        }

        try {
            Long count = redisTemplate.opsForValue().increment(key);
            if (count != null && count == 1) {
                redisTemplate.expire(key, Duration.ofSeconds(WINDOW_SECONDS));
            }
            return count != null && count <= maxRequests;
        } catch (Exception e) {
            LOG.warn("Redis unavailable for rate limiting, allowing request: {}", e.getMessage());
            return true;
        }
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/api/v1/auth/login")
                && !path.startsWith("/api/v1/auth/signup")
                && !path.startsWith("/api/v1/webhooks/whatsapp");
    }
}
