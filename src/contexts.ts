import { Backend } from "./backends/types";
import { GameScreenMessage } from "./messages";

function createContext<T>(defaultValue: T) {
  let context = defaultValue;
  return {
    use: () => context,
    provide: (newContext: T) => {
      context = newContext;
    },
  };
}

export const gameStateContext = createContext<{
  gameState: GameScreenMessage;
  setGameState: (gameState: GameScreenMessage) => void;
} | null>(null);

export const backendContext = createContext<{
  backend: Backend;
  setBackend: (backend: Backend) => void;
} | null>(null);
