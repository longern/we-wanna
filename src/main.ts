import "./style.css";
import "./gamepad";
import "./mobile";
import levelScreen from "./screens/level";
import selectLevelScreen from "./screens/select-level";
import { Level } from "./types";

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
  function createSelectLevelScreen() {
    return selectLevelScreen({
      onLevelSelect: (level) => {
        component.unmount?.();
        component = createLevelScreen({ level });
      },
    });
  }

  function createLevelScreen({ level }: { level: Level }) {
    return levelScreen({
      level,
      playerId: 0,
      onExit: () => {
        component.unmount?.();
        component = createSelectLevelScreen();
      },
    });
  }

  let component: Component = createSelectLevelScreen();

  setInterval(() => {
    component.render(canvas.getContext("2d")!);
  }, 1000 / 60);
}

main();
