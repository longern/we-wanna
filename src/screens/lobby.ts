import { backendContext, gameStateContext } from "../contexts";
import {
  GameScreenType,
  OutputMessageType,
  decodeOutputMessage,
} from "../messages";

function LobbyScreen() {
  const { backend } = backendContext.use();
  const { gameState, setGameState } = gameStateContext.use();
  if (gameState.screen !== GameScreenType.Lobby)
    throw new Error("Not in lobby screen");
  const lobbyState = gameState;

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
      view[4] = [38, 37, 40, 39, 13][[87, 65, 83, 68, 32].indexOf(view[1])];
      backend.send(buffer);
    } else {
      backend.send(buffer);
    }
  }

  function mount() {
    document.addEventListener("keydown", handleKeyDown);
  }

  const messageCallback = backend.onmessage((buffer) => {
    const message = decodeOutputMessage(buffer);
    switch (message.type) {
      case OutputMessageType.Sync:
        setGameState(message.value);
        break;
      case OutputMessageType.JoinLobby:
        console.log(message.value.player_id);
        break;
      default:
        break;
    }
  });

  function render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.fillStyle = "#000";
    ctx.font = "48px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Lobby", ctx.canvas.width / 2, ctx.canvas.height / 2 - 48);

    ctx.font = "24px sans-serif";
    ctx.fillText(
      `Player ${lobbyState.players} / 2`,
      ctx.canvas.width / 2,
      ctx.canvas.height / 2
    );
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

export default LobbyScreen;
