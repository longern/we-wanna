window.addEventListener("gamepadconnected", (e) => {
  console.log(
    "Gamepad connected at index %d: %s. %d buttons, %d axes.",
    e.gamepad.index,
    e.gamepad.id,
    e.gamepad.buttons.length,
    e.gamepad.axes.length
  );

  const gamepadIndex = e.gamepad.index;
  const isPressed = e.gamepad.buttons.map((button) => button.pressed);
  const interval = setInterval(() => {
    const gamepad = navigator.getGamepads()[gamepadIndex];
    gamepad.buttons.forEach((button, index) => {
      if (button.pressed !== isPressed[index]) {
        isPressed[index] = button.pressed;
        document.dispatchEvent(
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
