import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import {
  connectWebSocket,
  disconnectWebSocket,
  getStompClient,
  LobbyEvent,
  ErrorMessage,
  MatchStartEvent,
} from '../lib/websocket';
import { CharacterClass } from '../lib/gameData';

export interface GamePlayer {
  playerId: string;
  username: string;
  team: number;
  turnOrder: number;
  characterClass?: CharacterClass;
}

export interface RoomData {
  roomCode: string;
  status: 'WAITING' | 'READY' | 'PLAYING';
  players: GamePlayer[];
}

interface GameContextType {
  // Lobby state
  currentRoom: RoomData | null;
  roomCode: string | null;
  isConnected: boolean;
  connectionError: string | null;

  // WebSocket
  stompClient: Client | null;

  // Actions
  initializeWebSocket: (token: string) => Promise<void>;
  createRoom: (token: string) => Promise<string>;
  joinRoom: (roomCode: string, playerId: string, username: string, characterClass: CharacterClass, token: string) => Promise<void>;
  leaveRoom: () => Promise<void>;

  // Match state
  matchId: string | null;
  matchPlayers: GamePlayer[] | null;
  setMatchId: (id: string) => void;
  setMatchPlayers: (players: GamePlayer[]) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children, token }: { children: ReactNode; token: string | null }) {
  const [currentRoom, setCurrentRoom] = useState<RoomData | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchPlayers, setMatchPlayers] = useState<GamePlayer[] | null>(null);

  const handleLobbyEvent = useCallback((event: LobbyEvent) => {
    console.log('Lobby event:', event);
    if (event.roomCode && event.players) {
      setCurrentRoom({
        roomCode: event.roomCode,
        status: event.type === 'GAME_STARTED' ? 'PLAYING' : 'WAITING',
        players: event.players,
      });
    }
  }, []);

  const handleError = useCallback((error: ErrorMessage) => {
    console.error('Server error:', error);
    setConnectionError(error.reason || 'Unknown error');
  }, []);

  const handleMatchStart = useCallback((event: MatchStartEvent) => {
    console.log('Match started:', event);
    setMatchId(event.matchId);
    setMatchPlayers(event.players);
    // Navigation happens at screen level
  }, []);

  const initializeWebSocket = useCallback(
    async (authToken: string) => {
      if (isConnected || !authToken) return;

      try {
        const client = connectWebSocket(authToken, () => {
          setStompClient(client);
          setIsConnected(true);
          setConnectionError(null);
        }, handleLobbyEvent, handleError, handleMatchStart);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to connect';
        setConnectionError(message);
      }
    },
    [isConnected, handleLobbyEvent, handleError, handleMatchStart]
  );

  const createRoom = useCallback(
    async (authToken: string): Promise<string> => {
      try {
        const response = await fetch('http://localhost:8080/api/lobby/create', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to create room: ${response.statusText}`);
        }

        const room = (await response.json()) as RoomData;
        setCurrentRoom(room);
        setRoomCode(room.roomCode);
        return room.roomCode;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create room';
        setConnectionError(message);
        throw error;
      }
    },
    []
  );

  const joinRoom = useCallback(
    async (
      code: string,
      playerId: string,
      username: string,
      characterClass: CharacterClass,
      authToken: string
    ) => {
      try {
        const payload = {
          playerId,
          username,
          characterClass: characterClass.toUpperCase(),
        };

        const response = await fetch(`http://localhost:8080/api/lobby/join/${code}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Failed to join room: ${response.statusText}`);
        }

        const room = (await response.json()) as RoomData;
        setCurrentRoom(room);
        setRoomCode(room.roomCode);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to join room';
        setConnectionError(message);
        throw error;
      }
    },
    []
  );

  const leaveRoom = useCallback(async () => {
    setCurrentRoom(null);
    setRoomCode(null);
    setMatchId(null);
    setMatchPlayers(null);
  }, []);

  // Auto-initialize WebSocket when token becomes available
  useEffect(() => {
    if (token && !isConnected) {
      initializeWebSocket(token);
    }
  }, [token, isConnected, initializeWebSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, []);

  const value: GameContextType = {
    currentRoom,
    roomCode,
    isConnected,
    connectionError,
    stompClient,
    initializeWebSocket,
    createRoom,
    joinRoom,
    leaveRoom,
    matchId,
    matchPlayers,
    setMatchId,
    setMatchPlayers,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextType {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}
