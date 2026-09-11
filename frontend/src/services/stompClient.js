import { Client } from '@stomp/stompjs';
import { authStorage } from '../utils/authStorage';

const WS_URL = `${import.meta.env.VITE_WS_BASE_URL || ''}/ws`;

/**
 * Creates a STOMP-over-WebSocket client for the DEVLINK backend.
 *
 * Backend contract (backend/src/main/java/com/devlink/backend/config/WebSocketConfig.java):
 * - Native WebSocket endpoint at /ws (NO SockJS).
 * - CONNECT requires a native `Authorization: Bearer <JWT>` header
 *   (enforced by WebSocketSecurityInterceptor).
 * - Broker prefix: /topic ; application prefix: /app.
 *
 * The returned client is not connected yet — call client.activate() to connect.
 */
export function createChatStompClient({ onConnect, onStompError, onWebSocketClose, onWebSocketError }) {
  const token = authStorage.getToken();

  if (!token) {
    throw new Error('Not authenticated: missing token for WebSocket connection.');
  }

  const client = new Client({
    webSocketFactory: () => new WebSocket(WS_URL),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    // Backend has no heartbeat config; defaults are fine. Reconnect with backoff:
    reconnectDelay: 5000,
    onConnect: (frame) => onConnect && onConnect(frame),
    onStompError: (frame) => onStompError && onStompError(frame),
    onWebSocketClose: (event) => onWebSocketClose && onWebSocketClose(event),
    onWebSocketError: (event) => onWebSocketError && onWebSocketError(event),
  });

  return client;
}

/**
 * Subscribes to the real-time topic of a proposal chat.
 * Backend broadcasts persisted MessageResponse objects to:
 *   /topic/proposals/{proposalId}
 */
export function subscribeToProposalTopic(client, proposalId, onMessage) {
  return client.subscribe(`/topic/proposals/${proposalId}`, (message) => {
    try {
      const body = JSON.parse(message.body);
      onMessage(body);
    } catch (e) {
      console.error('Failed to parse incoming chat message:', e);
    }
  });
}
