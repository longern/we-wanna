import { Backend } from "../backends/types";
import WasmClient from "../backends/wasm";
import WhipClient from "../backends/whip";

const wasmUrl = new URL(
  "../../core/target/wasm32-unknown-unknown/release/we_wanna_core.wasm",
  import.meta.url
);

function selectPlayModeScreen({
  onPlayModeSelect,
}: {
  onPlayModeSelect: (backend: Backend) => void;
}) {
  const playModes = ["WHIP Server", "Local"];
  let selectedPlayMode = 0;

  function handleKeyDown(e: KeyboardEvent) {
    if (e.repeat) return;
    switch (e.code) {
      case "ArrowLeft":
      case "ArrowUp":
      case "GamepadButton14":
      case "GamepadButton12":
        if (selectedPlayMode > 0) {
          selectedPlayMode--;
        }
        break;
      case "ArrowRight":
      case "ArrowDown":
      case "GamepadButton15":
      case "GamepadButton13":
        if (selectedPlayMode < playModes.length - 1) {
          selectedPlayMode++;
        }
        break;
      case "Enter":
      case "GamepadButton0":
        const playMode = playModes[selectedPlayMode];
        switch (playMode) {
          case "WHIP Server":
            const endpoint = window.prompt("Enter WHIP Server endpoint");
            if (endpoint) {
              const backend = new WhipClient(endpoint, async () => {
                const res = await fetch(wasmUrl);
                const wasm = await res.arrayBuffer();
                return wasm;
              });
              backend.onopen(() => {
                onPlayModeSelect(backend);
              });
            }
            break;
          case "Local":
            const backend = new WasmClient();
            backend.onopen(() => {
              onPlayModeSelect(backend);
            });
        }
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
    for (let i = 0; i < playModes.length; i++) {
      const playMode = playModes[i];
      if (i === selectedPlayMode) {
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
      ctx.fillText(playMode, x, y);
    }
  }

  return {
    render,
    unmount: () => {
      document.removeEventListener("keydown", handleKeyDown);
    },
  };
}

export default selectPlayModeScreen;
