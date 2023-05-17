import { backendContext, gameStateContext } from "../contexts";
import {
  GameScreenType,
  OutputMessageType,
  decodeOutputMessage,
} from "../messages";
import { Level } from "../types";

function selectLevelScreen() {
  const { backend } = backendContext.use();
  const { gameState, setGameState } = gameStateContext.use();
  if (gameState.screen !== GameScreenType.SelectLevel)
    throw new Error("Not in select level screen");
  const selectLevelState = gameState;
  const levelImports = import.meta.glob<Level>("../levels/*.json");

  function mount() {
    const levels = [...Object.keys(levelImports)];
    const levelList = new TextEncoder().encode(
      JSON.stringify(
        levels.map((level) => level.replace(/.*\//, "").replace(".json", ""))
      )
    );
    const buffer = new ArrayBuffer(12 + levelList.length);
    const typeView = new DataView(buffer, 0, 4);
    typeView.setInt32(0, 0, true);
    const lengthView = new DataView(buffer, 4, 8);
    lengthView.setBigUint64(0, BigInt(levelList.length), true);
    const dataView = new Uint8Array(buffer, 12);
    dataView.set(levelList);
    backend.send(buffer);

    document.addEventListener("keydown", handleKeyDown);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.repeat) return;
    const buffer = new ArrayBuffer(8);
    const view = new Uint8Array(buffer);
    view[0] = 2;
    view[4] = e.keyCode;
    if (e.code.startsWith("GamepadButton")) {
      view[4] = [38, 37, 40, 39, 13][
        [
          "GamepadButton12",
          "GamepadButton14",
          "GamepadButton13",
          "GamepadButton15",
          "GamepadButton0",
        ].indexOf(e.code)
      ];
    }
    if ([87, 65, 83, 68, 32].includes(view[4])) {
      view[4] = [38, 37, 40, 39, 13][[87, 65, 83, 68, 32].indexOf(view[4])];
      backend.send(buffer);
    } else {
      backend.send(buffer);
    }
  }

  function handleMessage(buffer) {
    const message = decodeOutputMessage(buffer);
    if (message.type !== OutputMessageType.Sync) return;
    setGameState(message.value);

    if (message.value.screen !== GameScreenType.SelectLevel) return;
    if (message.value.confirmed) {
      const levelPromise = [...Object.values(levelImports)][
        selectLevelState.selected_level
      ]();
      levelPromise.then((level) => {
        const levelBuffer = new TextEncoder().encode(JSON.stringify(level));
        const buffer = new ArrayBuffer(12 + levelBuffer.length);
        const typeView = new DataView(buffer, 0, 4);
        typeView.setInt32(0, 1, true);
        const lengthView = new DataView(buffer, 4, 8);
        lengthView.setBigUint64(0, BigInt(levelBuffer.length), true);
        const dataView = new Uint8Array(buffer, 12);
        dataView.set(levelBuffer);
        backend.send(buffer);
      });
    }
  }

  const messageCallback = backend.onmessage(handleMessage);

  function render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.fillStyle = "#000";
    ctx.font = "48px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "Select Level",
      ctx.canvas.width / 2,
      ctx.canvas.height / 2 - 48
    );

    ctx.font = "16px sans-serif";
    for (let i = 0; i < selectLevelState.levels.length; i++) {
      const level = selectLevelState.levels[i];
      if (i === selectLevelState.selected_level) {
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
    mount,
    render,
    unmount: () => {
      document.removeEventListener("keydown", handleKeyDown);
      messageCallback();
    },
  };
}

export default selectLevelScreen;
