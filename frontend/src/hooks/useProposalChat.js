import { useState, useEffect, useRef, useCallback } from 'react';
import { messageService } from '../services/messageService';
import { createChatStompClient, subscribeToProposalTopic } from '../services/stompClient';

export const CHAT_CONNECTION = {
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  ERROR: 'ERROR',
};

/**
 * Real-time proposal chat hook.
 *
 * - Loads message history via REST (chronological, backend-ordered).
 * - Connects one STOMP client scoped to this proposal and subscribes once
 *   to /topic/proposals/{proposalId}.
 * - Messages are deduplicated by their stable backend UUID (id), so a message
 *   is never rendered twice regardless of delivery path.
 * - Sends via the STOMP application destination /app/proposals/{id}/messages
 *   (backend persists + broadcasts, including back to the sender).
 * - Cleans up subscription and connection on unmount/proposal change.
 */
export function useProposalChat(proposalId, user) {
  const [messages, setMessages] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [historyErrorStatus, setHistoryErrorStatus] = useState(null);
  const [connectionState, setConnectionState] = useState(CHAT_CONNECTION.CONNECTING);
  const [connectionError, setConnectionError] = useState(null);
  const [sending, setSending] = useState(false);

  const clientRef = useRef(null);
  const subscriptionRef = useRef(null);
  const messagesRef = useRef(new Map()); // id -> message (dedup, insertion-ordered)

  const publishMessages = useCallback(() => {
    setMessages(Array.from(messagesRef.current.values()));
  }, []);

  const mergeMessage = useCallback((msg) => {
    if (!msg || !msg.id) return;
    if (!messagesRef.current.has(msg.id)) {
      messagesRef.current.set(msg.id, msg);
      publishMessages();
    }
  }, [publishMessages]);

  // Load REST history first; then connect + subscribe exactly once per proposal.
  // user?.id in deps: re-runs only when the authenticated identity actually changes.
  useEffect(() => {
    if (!proposalId || !user) return undefined;

    let cancelled = false;
    messagesRef.current = new Map();
    setMessages([]);
    setHistoryLoading(true);
    setHistoryError(null);
    setHistoryErrorStatus(null);
    setConnectionState(CHAT_CONNECTION.CONNECTING);
    setConnectionError(null);

    async function loadHistoryThenConnect() {
      try {
        const history = await messageService.getMessages(proposalId);
        if (cancelled) return;
        for (const msg of history || []) {
          messagesRef.current.set(msg.id, msg);
        }
        publishMessages();
      } catch (err) {
        if (cancelled) return;
        setHistoryErrorStatus(err.status || null);
        setHistoryError(
          err.status === 403 ? 'You are not a participant of this proposal chat.'
            : err.status === 404 ? 'Proposal not found.'
              : err.message || 'Failed to load message history.'
        );
        setHistoryLoading(false);
        return; // do not open a socket for a chat we cannot read
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }

      // History loaded — establish the real-time connection.
      let client;
      try {
        client = createChatStompClient({
          onConnect: () => {
            if (cancelled) return;
            setConnectionState(CHAT_CONNECTION.CONNECTED);
            setConnectionError(null);
            // Guard against duplicate subscriptions (e.g. broker reconnects).
            if (subscriptionRef.current) {
              try { subscriptionRef.current.unsubscribe(); } catch { /* noop */ }
            }
            subscriptionRef.current = subscribeToProposalTopic(client, proposalId, (msg) => {
              mergeMessage(msg); // stable UUID dedup — no duplicates ever rendered
            });
          },
          onStompError: (frame) => {
            if (cancelled) return;
            setConnectionState(CHAT_CONNECTION.ERROR);
            const headers = frame?.headers || {};
            setConnectionError(headers.message || 'WebSocket error.');
          },
          onWebSocketClose: () => {
            if (cancelled) return;
            setConnectionState((prev) => (prev === CHAT_CONNECTION.ERROR ? prev : CHAT_CONNECTION.DISCONNECTED));
          },
          onWebSocketError: () => {
            if (cancelled) return;
            setConnectionError('WebSocket connection failed. Retrying…');
          },
        });
        clientRef.current = client;
        client.activate();
      } catch (err) {
        if (cancelled) return;
        setConnectionState(CHAT_CONNECTION.ERROR);
        setConnectionError(err.message || 'Could not start chat connection.');
      }
    }

    loadHistoryThenConnect();

    return () => {
      cancelled = true;
      if (subscriptionRef.current) {
        try { subscriptionRef.current.unsubscribe(); } catch { /* noop */ }
        subscriptionRef.current = null;
      }
      if (clientRef.current) {
        try { clientRef.current.deactivate(); } catch { /* noop */ }
        clientRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- identity (user?.id) is the meaningful dependency
  }, [proposalId, user?.id, mergeMessage, publishMessages]);

  const sendMessage = useCallback(async (content) => {
    const trimmed = (content || '').trim();
    if (!trimmed) return false;
    const client = clientRef.current;
    if (!client || !client.connected) {
      setConnectionError('Chat is not connected. Cannot send right now.');
      return false;
    }
    setSending(true);
    try {
      client.publish({
        destination: `/app/proposals/${proposalId}/messages`,
        body: JSON.stringify({ content: trimmed }),
      });
      return true;
      // No local insert: the backend broadcasts the persisted message
      // (including to this sender), and mergeMessage dedups by UUID.
    } finally {
      setSending(false);
    }
  }, [proposalId]);

  const retryConnection = useCallback(() => {
    const client = clientRef.current;
    if (client) {
      setConnectionState(CHAT_CONNECTION.CONNECTING);
      setConnectionError(null);
      client.activate();
    }
  }, []);

  return {
    messages,
    historyLoading,
    historyError,
    historyErrorStatus,
    connectionState,
    connectionError,
    sending,
    sendMessage,
    retryConnection,
  };
}
