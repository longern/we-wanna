import "./style.css";
import "./gamepad";
import "./mobile";
import lobbyScreen from "./screens/lobby";
import levelScreen from "./screens/level";
import selectLevelScreen from "./screens/select-level";
import selectPlayModeScreen from "./screens/play-mode";
import { Backend } from "./backends/types";
import { backendContext, gameStateContext } from "./contexts";
import { GameScreenMessage, GameScreenType } from "./messages";

const canvas = document.createElement("canvas");
canvas.width = 960;
canvas.height = 540;
canvas.style.maxWidth = "100%";
canvas.style.maxHeight = "100%";

document.getElementById("app")!.appendChild(canvas);

interface Component {
  mount?: () => void;
  render: (ctx: CanvasRenderingContext2D) => void;
  unmount?: () => void;
}

function main() {
  let backend: Backend | null = null;
  let gameState: GameScreenMessage = { screen: 0 };

  function createComponent(): Component {
    backendContext.provide({
      backend,
      setBackend: (value) => {
        component.unmount?.();
        backend = value;
        component = createComponent();
        component.mount?.();
      },
    });

    gameStateContext.provide({
      gameState,
      setGameState: (value) => {
        if (gameState.screen !== value.screen) {
          component.unmount?.();
          gameState = value;
          component = createComponent();
          component.mount?.();
        } else {
          gameState = value;
          component = createComponent();
        }
      },
    });

    switch (gameState.screen) {
      case GameScreenType.PlayMode:
        return selectPlayModeScreen();
      case GameScreenType.Lobby:
        return lobbyScreen();
      case GameScreenType.SelectLevel:
        return selectLevelScreen();
      case GameScreenType.Game:
        return levelScreen();
    }
  }

  let component: Component = createComponent();
  component.mount?.();

  setInterval(() => {
    component.render(canvas.getContext("2d")!);
  }, 1000 / 60);
}

main();
