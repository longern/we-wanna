import { instantiate, send, onmessage } from "./wasm";
import "./style.css";
import map from "./maps/level1.json";
import { Map } from "./types";
import "./mobile";

const canvas = document.createElement("canvas");
canvas.width = 960;
canvas.height = 540;
canvas.style.maxWidth = "100%";
canvas.style.maxHeight = "100%";

document.getElementById("app")!.appendChild(canvas);

const disableColor = ["#333", "#2196f3", "#f44336"];

function drawMap(map: Map, playerId: number) {
  const ctx = canvas.getContext("2d", { alpha: false })!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const unitSize = canvas.width / map.width;

  // Keep player in the center
  ctx.translate(canvas.width / 2 - map.players[playerId].x * unitSize, 0);

  for (let i = 0; i < map.players.length; i++) {
    const player = map.players[i];
    ctx.fillStyle = ["#f44336", "#2196f3"][i];
    const centerX = player.x * unitSize + unitSize / 2;
    const centerY = canvas.height - player.y * unitSize - unitSize / 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, unitSize / 2, 0, 2 * Math.PI, false);
    ctx.fill();
  }

  for (const tile of map.tiles) {
    ctx.filter = tile.disable_to === playerId + 1 ? "opacity(0.5)" : "none";
    ctx.fillStyle = disableColor[tile.disable_to ?? 0];
    ctx.fillRect(
      tile.x * unitSize,
      canvas.height - tile.y * unitSize - unitSize,
      unitSize,
      unitSize
    );
  }
  ctx.filter = "none";

  // Reset translation
  ctx.translate(-canvas.width / 2 + map.players[playerId].x * unitSize, 0);
}

drawMap(map as Map, 0);

instantiate().then(() => {
  onmessage((channelId, buffer) => {
    const view = new Uint8Array(buffer);
    switch (view[0]) {
      case 3:
        const floatView = new Float32Array(buffer.slice(1));
        const [player0X, player0Y, player1X, player1Y] = floatView;
        map.players[0].x = player0X;
        map.players[0].y = player0Y;
        map.players[1].x = player1X;
        map.players[1].y = player1Y;
        drawMap(map as Map, channelId - 1);
        break;
    }
  });

  // Concat map json with message type flag and convert to ArrayBuffer
  const mapBuffer = new TextEncoder().encode(JSON.stringify(map));
  const buffer = new ArrayBuffer(1 + mapBuffer.byteLength);
  const view = new Uint8Array(buffer);
  view[0] = 0;
  view.set(mapBuffer, 1);
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
