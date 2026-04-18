import SockJS from 'sockjs-client';
import { Client, IFrame } from '@stomp/stompjs';

let stompClient: Client | null = null;

export interface LobbyEvent {
  type: 'PLAYER_JOINED' | 'PLAYER_LEFT' | 'ROOM_STATUS' | 'GAME_STARTED' | 'ROOM_UPDATE';
  roomCode?: string;
  playerId?: string;
  status?: 'WAITING' | 'STARTING' | 'PLAYING';
  players?: Array<{
    playerId: string;
    username: string;
    team: number;
    turnOrder: number;
    characterClass?: string;
    isReady?: boolean;
    ready?: boolean;
  }>;
}

export interface ErrorMessage {
  reason: string;
  code?: string;
}

export interface MatchStartEvent {
  matchId: string;
  players: Array<{
    playerId: string;
    username: string;
    team: number;
    characterClass: string;
  }>;
}

export function connectWebSocket(
  token: string,
  onConnectedCallback: (client: Client) => void,
  onLobbyEvent?: (event: LobbyEvent) => void,
  onError?: (error: ErrorMessage) => void,
  onMatchStart?: (event: MatchStartEvent) => void
): Client {
  stompClient = new Client({
    webSocketFactory: () => new SockJS(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/ws`),
    connectHeaders: {
      Authorization: `Bearer ${token}`, // Backend requires this!
    },
    reconnectDelay: 5000, // Auto-reconnect after 5 seconds on drop
    heartbeatIncoming: 4000, // Ping every 4s to detect dead connections
    heartbeatOutgoing: 4000,

    onConnect: (frame: IFrame) => {
      console.log('WebSocket connected:', frame);

      // Subscribe to lobby updates
      if (onLobbyEvent) {
        console.log('Subscribing to /topic/lobby');
        stompClient!.subscribe('/topic/lobby', (message) => {
          const event = JSON.parse(message.body);
          onLobbyEvent(event);
        });
      }

      // Subscribe to error messages
      if (onError) {
        console.log('Subscribing to /user/queue/errors');
        stompClient!.subscribe('/user/queue/errors', (message) => {
          const error = JSON.parse(message.body);
          onError(error);
        });
      }

      // Subscribe to match start notification
      if (onMatchStart) {
        console.log('Subscribing to /user/queue/match-start');
        stompClient!.subscribe('/user/queue/match-start', (message) => {
          console.log('Received match-start message:', message.body);
          const event = JSON.parse(message.body);
          onMatchStart(event);
        });
      }

      onConnectedCallback(stompClient!);
    },

    onDisconnect: () => {
      console.log('WebSocket disconnected');
      stompClient = null;
    },

    onStompError: (frame: IFrame) => {
      console.error('STOMP error:', frame.headers.message);
    },
  });

  stompClient.activate();
  return stompClient;
}

export function disconnectWebSocket(): void {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
}

export function getStompClient(): Client | null {
  return stompClient;
}

export function subscribeToMatch(matchId: string, onUpdate: (event: any) => void) {
  if (!stompClient || !stompClient.connected) return null;
  return stompClient.subscribe(`/topic/match/${matchId}`, (message) => {
    onUpdate(JSON.parse(message.body));
  });
}
