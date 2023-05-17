import { Level } from "../types";
import { backendContext, gameStateContext } from "../contexts";
import { OutputMessageType, decodeOutputMessage } from "../messages";

const disableColor = ["#333", "#2196f3", "#f44336"];

function levelScreen() {
  const { backend } = backendContext.use();
  const { gameState, setGameState } = gameStateContext.use();
  let playerId = 0;

  if (gameState.screen !== 3) throw new Error("Not in game screen");
  const level = gameState.level;

  backend.onmessage((buffer) => {
    const message = decodeOutputMessage(buffer);
    switch (message.type) {
      case OutputMessageType.Sync:
        setGameState(message.value);
        break;
      case OutputMessageType.Coord:
        level.players[0].x = message.value.player0x;
        level.players[0].y = message.value.player0y;
        level.players[1].x = message.value.player1x;
        level.players[1].y = message.value.player1y;
        for (const tile of message.value.animatedTiles) {
          level.tiles[tile.index].x = tile.x;
          level.tiles[tile.index].y = tile.y;
        }
        break;
    }
  });

  document.addEventListener("keydown", (e) => {
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
  });

  document.addEventListener("keyup", (e) => {
    const buffer = new ArrayBuffer(8);
    const view = new Uint8Array(buffer);
    view[0] = 3;
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
  });

  function render(ctx: CanvasRenderingContext2D) {
    const canvas = ctx.canvas;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const unitSize = canvas.width / level.width;

    // Keep player in the center
    ctx.translate(canvas.width / 2 - level.players[playerId].x * unitSize, 0);

    // Draw exit
    ctx.fillStyle = "#4caf50";
    ctx.fillRect(
      (level.goal.x - 0.1) * unitSize,
      canvas.height - (level.goal.y + 0.5) * unitSize,
      unitSize * 1.2 + 0.1,
      unitSize + 0.1
    );
    ctx.beginPath();
    ctx.arc(
      (level.goal.x + 0.5) * unitSize,
      canvas.height - (level.goal.y + 0.6) * unitSize,
      unitSize * 0.6,
      0,
      2 * Math.PI,
      false
    );
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(
      (level.goal.x + 0.9) * unitSize,
      canvas.height - (level.goal.y + 0.5) * unitSize,
      unitSize * 0.1,
      0,
      2 * Math.PI,
      false
    );
    ctx.fill();

    for (let i = 0; i < level.players.length; i++) {
      const player = level.players[i];
      ctx.fillStyle = ["#f44336", "#2196f3"][i];
      const centerX = player.x * unitSize + unitSize / 2;
      const centerY = canvas.height - player.y * unitSize - unitSize / 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, unitSize / 2, 0, 2 * Math.PI, false);
      ctx.fill();
    }

    for (const tile of level.tiles) {
      ctx.filter = tile.disable_to === playerId + 1 ? "opacity(0.5)" : "none";
      ctx.fillStyle = disableColor[tile.disable_to ?? 0];
      ctx.fillRect(
        tile.x * unitSize,
        canvas.height - (tile.y + 1) * unitSize,
        unitSize + 0.1,
        unitSize + 0.1
      );
    }
    ctx.filter = "none";

    // Reset translation
    ctx.translate(-canvas.width / 2 + level.players[playerId].x * unitSize, 0);
  }

  return { render };
}

export default levelScreen;
