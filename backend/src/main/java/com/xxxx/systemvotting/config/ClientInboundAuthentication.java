package com.xxxx.systemvotting.config;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.xxxx.systemvotting.common.constant.AppConstant.AUTHORITIES;

@Component
@RequiredArgsConstructor
@Slf4j(topic = "CLIENT-INBOUND-AUTHENTICATION")
public class ClientInboundAuthentication implements ChannelInterceptor {

    private final CustomJwtDecoder jwtDecoder;

    @Override
    public @Nullable Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null) {
            if(StompCommand.CONNECT.equals(accessor.getCommand())) {
                String authorization = accessor.getFirstNativeHeader("Authorization");
                if (authorization == null || !authorization.startsWith("Bearer ")) {
                    throw new MessageDeliveryException("Missing token");
                }

                String token = authorization.replace("Bearer ", "");
                try {
                    Jwt jwt = jwtDecoder.decode(token);
                    String userId = jwt.getSubject();
                    List<GrantedAuthority> authorities = Optional.ofNullable(jwt.getClaimAsStringList(AUTHORITIES))
                            .orElse(Collections.emptyList())
                            .stream()
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList());

                    accessor.setUser(new UsernamePasswordAuthenticationToken(userId, null, authorities));
                    log.info("Websocket connected - userId: {}", userId);
                } catch (JwtException e) {
                    log.warn("Invalid JWT: {}", e.getMessage());
                    throw new MessageDeliveryException("Unauthorized");
                }
            }
        }
        return message;
    }
}

