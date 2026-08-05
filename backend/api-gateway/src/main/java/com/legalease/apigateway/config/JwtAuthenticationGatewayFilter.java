package com.legalease.apigateway.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * Validates the JWT on every request routed through the gateway, except
 * for the public authentication endpoints ({@code /api/v1/auth/**}) and
 * CORS preflight requests.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class JwtAuthenticationGatewayFilter implements WebFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationGatewayFilter.class);

    private static final String AUTH_PATH_PREFIX = "/api/v1/auth";

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().value();

        if ("OPTIONS".equalsIgnoreCase(request.getMethodValue()) || path.startsWith(AUTH_PATH_PREFIX)) {
            return chain.filter(exchange);
        }

        String authorization = request.getHeaders().getFirst("Authorization");
        if (StringUtils.hasText(authorization) && authorization.startsWith("Bearer ")
                && validateToken(authorization.substring(7))) {
            return chain.filter(exchange);
        }

        return unauthorized(exchange.getResponse());
    }

    private boolean validateToken(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (Exception ex) {
            logger.warn("Rejected request with invalid JWT: {}", ex.getMessage());
            return false;
        }
    }

    private Mono<Void> unauthorized(ServerHttpResponse response) {
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().add("Content-Type", "application/json;charset=UTF-8");
        byte[] body = "{\"message\":\"Unauthorized: a valid access token is required\"}"
                .getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = response.bufferFactory().wrap(body);
        return response.writeWith(Mono.just(buffer));
    }
}
