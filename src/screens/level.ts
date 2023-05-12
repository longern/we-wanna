import { Level } from "../types";
import { instantiate, send, onmessage } from "../wasm";

const disableColor = ["#333", "#2196f3", "#f44336"];

function levelScreen({
  level,
  playerId,
  onExit,
}: {
  level: Level;
  playerId: number;
  onExit: () => void;
}) {
  instantiate().then(() => {
    onmessage((channelId, buffer) => {
      const view = new Uint8Array(buffer);
      switch (view[0]) {
        case 3:
          const floatView = new Float32Array(buffer.slice(1, 17));
          const [player0X, player0Y, player1X, player1Y] = floatView;
          level.players[0].x = player0X;
          level.players[0].y = player0Y;
          level.players[1].x = player1X;
          level.players[1].y = player1Y;

          const animatedTilesCountView = new Int32Array(buffer.slice(17, 21));
          const animatedTilesCount = animatedTilesCountView[0];
          for (let i = 0; i < animatedTilesCount; i++) {
            const offset = 21 + i * 12;
            const animatedIndexView = new Int32Array(
              buffer.slice(offset, offset + 4)
            );
            const animatedIndex = animatedIndexView[0];
            const animatedPosView = new Float32Array(
              buffer.slice(offset + 4, offset + 12)
            );
            const [x, y] = animatedPosView;
            level.tiles[animatedIndex].x = x;
            level.tiles[animatedIndex].y = y;
          }

          break;
      }
    });

    // Concat level json with message type flag and convert to ArrayBuffer
    const levelBuffer = new TextEncoder().encode(JSON.stringify(level));
    const buffer = new ArrayBuffer(1 + levelBuffer.byteLength);
    const view = new Uint8Array(buffer);
    view[0] = 0;
    view.set(levelBuffer, 1);
    send(1, buffer);

    document.addEventListener("keydown", (e) => {
      if (e.repeat) return;
      const buffer = new ArrayBuffer(2);
      const view = new Uint8Array(buffer);
      view[0] = 1;
      view[1] = e.keyCode;
      if ([87, 65, 83, 68, 32].includes(view[1])) {
        view[1] = [38, 37, 40, 39, 13][[87, 65, 83, 68, 32].indexOf(view[1])];
        send(2, buffer);
      } else {
        send(1, buffer);
      }
    });

    document.addEventListener("keyup", (e) => {
      const buffer = new ArrayBuffer(2);
      const view = new Uint8Array(buffer);
      view[0] = 2;
      view[1] = e.keyCode;
      if ([87, 65, 83, 68, 32].includes(view[1])) {
        view[1] = [38, 37, 40, 39, 13][[87, 65, 83, 68, 32].indexOf(view[1])];
        send(2, buffer);
      } else {
        send(1, buffer);
      }
    });
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
