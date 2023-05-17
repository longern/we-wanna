import { Level } from "./types";

export enum GameScreenType {
  PlayMode,
  Lobby,
  SelectLevel,
  Game,
}

export type PlayModeMessage = {
  screen: GameScreenType.PlayMode;
};

export type LobbyMessage = {
  screen: GameScreenType.Lobby;
  players: number;
};

export type SelectLevelMessage = {
  screen: GameScreenType.SelectLevel;
  levels: string[];
  selected_level: number;
  confirmed: boolean;
};

export type GameMessage = {
  screen: GameScreenType.Game;
  level: Level;
};

export type GameScreenMessage =
  | PlayModeMessage
  | LobbyMessage
  | SelectLevelMessage
  | GameMessage;

export enum OutputMessageType {
  Sync,
  JoinLobby,
  Coord,
  Game,
  Error = 255,
}

interface SyncMessage {
  type: OutputMessageType.Sync;
  value: GameScreenMessage;
}

interface JoinLobbyMessage {
  type: OutputMessageType.JoinLobby;
  value: {
    player_id: number;
  };
}

interface CoordMessage {
  type: OutputMessageType.Coord;
  value: {
    player0x: number;
    player0y: number;
    player1x: number;
    player1y: number;
    animatedTiles: {
      index: number;
      x: number;
      y: number;
    }[];
  };
}

interface ErrorMessage {
  type: OutputMessageType.Error;
  value: {
    message: string;
  };
}

type OutputMessage =
  | SyncMessage
  | JoinLobbyMessage
  | CoordMessage
  | ErrorMessage;

export function decodeOutputMessage(buffer: ArrayBuffer): OutputMessage {
  const messageType = new Int32Array(buffer.slice(0, 4))[0];
  switch (messageType) {
    case OutputMessageType.Sync:
      const screen = new Int32Array(buffer.slice(4, 8))[0];
      switch (screen) {
        case GameScreenType.PlayMode:
          return {
            type: OutputMessageType.Sync,
            value: {
              screen: GameScreenType.PlayMode,
            },
          };
        case GameScreenType.Lobby:
          const players = new Int32Array(buffer.slice(8, 12))[0];
          return {
            type: OutputMessageType.Sync,
            value: {
              screen: GameScreenType.Lobby,
              players,
            },
          };
        case GameScreenType.SelectLevel:
          const levelsLength = Number(
            new BigUint64Array(buffer.slice(8, 16))[0]
          );
          const levels = [];
          const reducer = (offset) => {
            const length = Number(
              new BigUint64Array(buffer.slice(offset, offset + 8))[0]
            );
            const level = new TextDecoder().decode(
              new Uint8Array(buffer, offset + 8, length)
            );
            levels.push(level);
            return offset + 8 + length;
          };
          const levelsOffset = Array(levelsLength).fill(0).reduce(reducer, 16);

          const selectedLevel = Number(
            new BigUint64Array(buffer.slice(levelsOffset, levelsOffset + 8))[0]
          );
          const confirmed = Boolean(
            new Uint8Array(buffer.slice(levelsOffset + 8, levelsOffset + 9))[0]
          );
          return {
            type: OutputMessageType.Sync,
            value: {
              screen: GameScreenType.SelectLevel,
              levels,
              selected_level: selectedLevel,
              confirmed,
            },
          };
        case GameScreenType.Game:
          const levelLength = Number(
            new BigUint64Array(buffer.slice(8, 16))[0]
          );
          const levelText = new TextDecoder().decode(
            new Uint8Array(buffer, 16, levelLength)
          );
          const level = JSON.parse(levelText);
          return {
            type: OutputMessageType.Sync,
            value: {
              screen: GameScreenType.Game,
              level,
            },
          };
      }

    case OutputMessageType.JoinLobby:
      return {
        type: OutputMessageType.JoinLobby,
        value: {
          player_id: new Uint8Array(buffer.slice(4, 5))[0],
        },
      };

    case OutputMessageType.Coord:
      const coordView = new Float32Array(buffer.slice(4, 20));
      const [player0x, player0y, player1x, player1y] = coordView;
      const animatedTileCount = Number(
        new BigUint64Array(buffer.slice(20, 28))[0]
      );
      const animatedTiles = [];
      const animatedTileReducer = (offset) => {
        const index = new BigUint64Array(buffer.slice(offset, offset + 8))[0];
        const x = new Float32Array(buffer.slice(offset + 8, offset + 12))[0];
        const y = new Float32Array(buffer.slice(offset + 12, offset + 16))[0];
        animatedTiles.push({ index, x, y });
        return offset + 16;
      };
      Array(animatedTileCount).fill(0).reduce(animatedTileReducer, 28);

      return {
        type: OutputMessageType.Coord,
        value: {
          player0x,
          player0y,
          player1x,
          player1y,
          animatedTiles,
        },
      };

    case OutputMessageType.Error:
      const errorLength = Number(new BigUint64Array(buffer.slice(4, 12))[0]);
      const error = new TextDecoder().decode(
        new Uint8Array(buffer, 12, errorLength)
      );
      console.error(error);

    default:
      throw new Error("Invalid message type");
  }
}
