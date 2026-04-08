import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import {
  connectWebSocket,
  disconnectWebSocket,
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
  currentPlayerId: string | null;
  isConnected: boolean;
  connectionError: string | null;
  selectedCharacter: CharacterClass | null;

  // WebSocket
  stompClient: Client | null;

  // Actions
  initializeWebSocket: (token: string) => Promise<void>;
  createRoom: (playerId: string, token: string) => Promise<string>;
  joinRoom: (roomCode: string, playerId: string, username: string, characterClass: CharacterClass | null, token: string) => Promise<void>;
  selectCharacter: (characterClass: CharacterClass, token: string) => Promise<void>;
  setSelectedCharacter: (characterClass: CharacterClass | null) => void;
  playerReady: (token: string) => Promise<void>;
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
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [selectedCharacter, setSelectedCharacterState] = useState<CharacterClass | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchPlayers, setMatchPlayers] = useState<GamePlayer[] | null>(null);

  const handleLobbyEvent = useCallback((event: LobbyEvent) => {
    console.log('Lobby event:', event);
    if (event.roomCode && event.players) {
      const players: GamePlayer[] = event.players.map(p => ({
        playerId: p.playerId,
        username: p.username,
        team: p.team,
        turnOrder: p.turnOrder,
        characterClass: p.characterClass ? (p.characterClass.toLowerCase() as CharacterClass) : undefined,
      }));
      setCurrentRoom({
        roomCode: event.roomCode,
        status: event.type === 'GAME_STARTED' ? 'PLAYING' : 'WAITING',
        players,
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
    setMatchPlayers(event.players.map((p: any) => ({
      playerId: p.playerId,
      username: p.username,
      team: p.team,
      turnOrder: p.turnOrder || 0,
      characterClass: p.characterClass,
    })));
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
    async (playerId: string, authToken: string): Promise<string> => {
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
        setCurrentPlayerId(playerId);
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
      characterClass: CharacterClass | null,
      authToken: string
    ) => {
      try {
        const payload: any = {
          playerId,
          username,
        };

        if (characterClass) {
          payload.characterClass = characterClass.toUpperCase();
        }

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
        setCurrentPlayerId(playerId);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to join room';
        setConnectionError(message);
        throw error;
      }
    },
    []
  );

  const selectCharacter = useCallback(
    async (characterClass: CharacterClass, authToken: string) => {
      try {
        if (!currentRoom) {
          throw new Error('No room loaded');
        }
        if (!currentPlayerId) {
          throw new Error('No player ID available');
        }

        const response = await fetch(`http://localhost:8080/api/lobby/rooms/${currentRoom.roomCode}/select-character?characterClass=${characterClass.toUpperCase()}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to select character: ${response.statusText}`);
        }

        setSelectedCharacterState(characterClass);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to select character';
        setConnectionError(message);
        throw error;
      }
    },
    [currentRoom, currentPlayerId]
  );

  const playerReady = useCallback(
    async (authToken: string) => {
      try {
        if (!currentRoom) {
          throw new Error('No room loaded');
        }
        if (!currentPlayerId) {
          throw new Error('No player ID available');
        }

        const response = await fetch(`http://localhost:8080/api/lobby/rooms/ready?roomCode=${currentRoom.roomCode}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to mark as ready: ${response.statusText}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to mark as ready';
        setConnectionError(message);
        throw error;
      }
    },
    [currentRoom, currentPlayerId]
  );

  const setSelectedCharacter = useCallback((characterClass: CharacterClass | null) => {
    setSelectedCharacterState(characterClass);
  }, []);

  const leaveRoom = useCallback(async () => {
    setCurrentRoom(null);
    setRoomCode(null);
    setCurrentPlayerId(null);
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
    currentPlayerId,
    isConnected,
    connectionError,
    stompClient,
    selectedCharacter,
    initializeWebSocket,
    createRoom,
    joinRoom,
    selectCharacter,
    setSelectedCharacter,
    playerReady,
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
