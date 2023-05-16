import "./style.css";
import "./gamepad";
import "./mobile";
import levelScreen from "./screens/level";
import selectLevelScreen from "./screens/select-level";
import selectPlayModeScreen from "./screens/play-mode";
import { Level } from "./types";
import { Backend } from "./backends/types";

const canvas = document.createElement("canvas");
canvas.width = 960;
canvas.height = 540;
canvas.style.maxWidth = "100%";
canvas.style.maxHeight = "100%";

document.getElementById("app")!.appendChild(canvas);

interface Component {
  render: (ctx: CanvasRenderingContext2D) => void;
  unmount?: () => void;
}

function main() {
  function createSelectPlayModeScreen() {
    return selectPlayModeScreen({
      onPlayModeSelect: (backend) => {
        component.unmount?.();
        component = createSelectLevelScreen({ backend });
      },
    });
  }

  function createSelectLevelScreen({ backend }: { backend: Backend }) {
    return selectLevelScreen({
      onLevelSelect: (level) => {
        component.unmount?.();
        component = createLevelScreen({ backend, level });
      },
    });
  }

  function createLevelScreen({
    backend,
    level,
  }: {
    backend: Backend;
    level: Level;
  }) {
    return levelScreen({
      backend,
      level,
      playerId: 0,
      onExit: () => {
        component.unmount?.();
        component = createSelectLevelScreen({ backend });
      },
    });
  }

  let component: Component = createSelectPlayModeScreen();

  setInterval(() => {
    component.render(canvas.getContext("2d")!);
  }, 1000 / 60);
}

main();
