window.addEventListener("gamepadconnected", (e) => {
  const gamepad = e.gamepad;
  console.log(
    "Gamepad connected at index %d: %s. %d buttons, %d axes.",
    gamepad.index,
    gamepad.id,
    gamepad.buttons.length,
    gamepad.axes.length
  );

  const isPressed = gamepad.buttons.map((button) => button.pressed);
  const interval = setInterval(() => {
    gamepad.buttons.forEach((button, index) => {
      if (button.pressed !== isPressed[index]) {
        isPressed[index] = button.pressed;
        window.dispatchEvent(
          new KeyboardEvent(button.pressed ? "keydown" : "keyup", {
            code: `GamepadButton${index}`,
          })
        );
      }
    });
  }, 1000 / 60);

  function handleDisconnect() {
    window.removeEventListener("gamepaddisconnected", handleDisconnect);
    clearInterval(interval);
  }

  window.addEventListener("gamepaddisconnected", handleDisconnect);
});
