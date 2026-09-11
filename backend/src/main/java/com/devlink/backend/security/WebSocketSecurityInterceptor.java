package com.devlink.backend.security;

import com.devlink.backend.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class WebSocketSecurityInterceptor implements ChannelInterceptor {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private MessageService messageService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null) {
            if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                String authHeader = accessor.getFirstNativeHeader("Authorization");
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);
                    if (jwtUtils.validateJwtToken(token)) {
                        String email = jwtUtils.getUserNameFromJwtToken(token);
                        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                        accessor.setUser(authentication);
                    } else {
                        throw new AccessDeniedException("Invalid JWT token in STOMP CONNECT");
                    }
                } else {
                    throw new AccessDeniedException("Missing Authorization header in STOMP CONNECT");
                }
            } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                String destination = accessor.getDestination();
                if (destination != null && destination.startsWith("/topic/proposals/")) {
                    try {
                        String proposalIdStr = destination.substring("/topic/proposals/".length());
                        UUID proposalId = UUID.fromString(proposalIdStr);
                        
                        UsernamePasswordAuthenticationToken auth = (UsernamePasswordAuthenticationToken) accessor.getUser();
                        if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails)) {
                            throw new AccessDeniedException("User not authenticated");
                        }
                        
                        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
                        messageService.validateParticipant(proposalId, userDetails.getUser().getId());
                    } catch (IllegalArgumentException e) {
                        throw new AccessDeniedException("Invalid proposal ID format");
                    }
                }
            }
        }
        return message;
    }
}
