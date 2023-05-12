const { matches } = window.matchMedia("(max-width: 768px)");

function addControls() {
  const controller = document.createElement("div");
  controller.classList.add("controller");

  const leftButton = document.createElement("button");
  leftButton.innerText = "←";
  leftButton.style.bottom = "48px";
  leftButton.style.left = "100px";
  leftButton.ontouchstart = (ev) => {
    ev.preventDefault();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { code: "ArrowLeft", keyCode: 37 })
    );
    leftButton.style.backgroundColor = "#ccc";
  };
  leftButton.ontouchend = leftButton.ontouchcancel = () => {
    document.dispatchEvent(
      new KeyboardEvent("keyup", { code: "ArrowLeft", keyCode: 37 })
    );
    leftButton.style.backgroundColor = "#f5f5f5";
  };
  controller.appendChild(leftButton);

  const rightButton = document.createElement("button");
  rightButton.innerText = "→";
  rightButton.style.bottom = "48px";
  rightButton.style.left = "172px";
  rightButton.ontouchstart = (ev) => {
    ev.preventDefault();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { code: "ArrowRight", keyCode: 39 })
    );
    rightButton.style.backgroundColor = "#ccc";
  };
  rightButton.ontouchend = rightButton.ontouchcancel = () => {
    document.dispatchEvent(
      new KeyboardEvent("keyup", { code: "ArrowRight", keyCode: 39 })
    );
    rightButton.style.backgroundColor = "#f5f5f5";
  };
  controller.appendChild(rightButton);

  const jumpButton = document.createElement("button");
  jumpButton.innerText = "↑";
  jumpButton.style.bottom = "48px";
  jumpButton.style.right = "100px";
  jumpButton.ontouchstart = (ev) => {
    ev.preventDefault();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Enter", keyCode: 13 })
    );
    jumpButton.style.backgroundColor = "#ccc";
  };
  jumpButton.ontouchend = jumpButton.ontouchcancel = () => {
    document.dispatchEvent(
      new KeyboardEvent("keyup", { code: "Enter", keyCode: 13 })
    );
    jumpButton.style.backgroundColor = "#f5f5f5";
  };
  controller.appendChild(jumpButton);

  document.body.appendChild(controller);
}

if (matches) {
  const fullscreenButton = document.createElement("button");
  fullscreenButton.innerText = "Fullscreen";
  fullscreenButton.style.position = "absolute";
  fullscreenButton.style.bottom = "12px";
  fullscreenButton.style.right = "12px";
  fullscreenButton.style.zIndex = "100";
  fullscreenButton.onclick = () => {
    document.body.requestFullscreen();
  };
  document.body.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement) {
      fullscreenButton.style.display = "none";
      screen.orientation.lock("landscape");
      addControls();
    } else {
      fullscreenButton.style.display = "block";
      const controller = document.querySelector(".controller");
      if (controller) document.body.removeChild(controller);
    }
  });
  document.body.appendChild(fullscreenButton);
}
