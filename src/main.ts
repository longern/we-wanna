import "./style.css";
import "./mobile";
import levelScreen from "./screens/level";
import selectLevelScreen from "./screens/select-level";

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
  let component: Component = selectLevelScreen({
    onLevelSelect: (map) => {
      component.unmount?.();
      component = levelScreen({ map, playerId: 0 });
    },
  });

  setInterval(() => {
    component.render(canvas.getContext("2d")!);
  }, 1000 / 60);
}

main();
