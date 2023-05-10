const { matches } = window.matchMedia("(max-width: 768px)");

function addControls() {
  const leftButton = document.createElement("button");
  leftButton.innerText = "←";
  leftButton.style.position = "absolute";
  leftButton.style.bottom = "48px";
  leftButton.style.left = "100px";
  leftButton.style.width = "48px";
  leftButton.style.height = "48px";
  leftButton.style.zIndex = "100";
  leftButton.style.borderRadius = "999px";
  leftButton.ontouchstart = (ev) => {
    ev.preventDefault();
    document.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 37 }));
    leftButton.style.backgroundColor = "#ccc";
  };
  leftButton.ontouchend = () => {
    document.dispatchEvent(new KeyboardEvent("keyup", { keyCode: 37 }));
    leftButton.style.backgroundColor = "#f5f5f5";
  };
  document.body.appendChild(leftButton);

  const rightButton = document.createElement("button");
  rightButton.innerText = "→";
  rightButton.style.position = "absolute";
  rightButton.style.bottom = "48px";
  rightButton.style.left = "160px";
  rightButton.style.width = "48px";
  rightButton.style.height = "48px";
  rightButton.style.zIndex = "100";
  rightButton.style.borderRadius = "999px";
  rightButton.ontouchstart = (ev) => {
    ev.preventDefault();
    document.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 39 }));
    rightButton.style.backgroundColor = "#ccc";
  };
  rightButton.ontouchend = () => {
    document.dispatchEvent(new KeyboardEvent("keyup", { keyCode: 39 }));
    rightButton.style.backgroundColor = "#f5f5f5";
  };
  document.body.appendChild(rightButton);

  const jumpButton = document.createElement("button");
  jumpButton.innerText = "↑";
  jumpButton.style.position = "absolute";
  jumpButton.style.bottom = "48px";
  jumpButton.style.right = "100px";
  jumpButton.style.width = "48px";
  jumpButton.style.height = "48px";
  jumpButton.style.zIndex = "100";
  jumpButton.style.borderRadius = "999px";
  jumpButton.ontouchstart = (ev) => {
    ev.preventDefault();
    document.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 13 }));
    jumpButton.style.backgroundColor = "#ccc";
  };
  jumpButton.ontouchend = () => {
    document.dispatchEvent(new KeyboardEvent("keyup", { keyCode: 13 }));
    jumpButton.style.backgroundColor = "#f5f5f5";
  };
  document.body.appendChild(jumpButton);
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
    }
  });
  document.body.appendChild(fullscreenButton);
}
