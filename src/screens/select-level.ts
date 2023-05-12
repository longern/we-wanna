import { Level } from "../types";

function selectLevelScreen({
  onLevelSelect,
}: {
  onLevelSelect: (level: Level) => void;
}) {
  const levelImports: Record<string, () => Promise<Level>> = import.meta.glob(
    "../levels/*.json"
  );
  const levels = [...Object.keys(levelImports)];
  let selectedLevel = 0;

  function handleKeyDown(e: KeyboardEvent) {
    if (e.repeat) return;
    switch (e.code) {
      case "ArrowUp":
        if (selectedLevel > 0) {
          selectedLevel--;
        }
        break;
      case "ArrowDown":
        if (selectedLevel < levels.length - 1) {
          selectedLevel++;
        }
        break;
      case "Enter":
        const levelPromise = levelImports[levels[selectedLevel]]();
        levelPromise.then((level) => {
          onLevelSelect(level);
        });
        break;
    }
  }

  document.addEventListener("keydown", handleKeyDown);

  function render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.fillStyle = "#000";
    ctx.font = "48px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("We Wanna", ctx.canvas.width / 2, ctx.canvas.height / 2 - 48);

    ctx.font = "16px sans-serif";
    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      if (i === selectedLevel) {
        // Draw a rectangle around the selected level
        ctx.strokeStyle = "#000";
        ctx.strokeRect(
          ctx.canvas.width / 2 - 48 * 4,
          ctx.canvas.height / 2 + 48 * (2 + Number(i)) - 24,
          48 * 8,
          48
        );
      }
      const [x, y] = [
        ctx.canvas.width / 2,
        ctx.canvas.height / 2 + 48 * (2 + Number(i)),
      ];
      ctx.fillText(level.replace(/.*\//, "").replace(".json", ""), x, y);
    }
  }

  return {
    render,
    unmount: () => {
      document.removeEventListener("keydown", handleKeyDown);
    },
  };
}

export default selectLevelScreen;
