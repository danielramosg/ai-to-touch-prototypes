function setButtonLabels(labels: string[]) {
  document.getElementById("button1")!.innerHTML = labels[0];
  document.getElementById("button2")!.innerHTML = labels[1];
}
function hide(...l: string[]) {
  for (const k of l) {
    document.getElementById(k)!.classList.remove("visible");
    document.getElementById(k)!.classList.add("hidden");
  }
}

function show(...l: string[]) {
  for (const k of l) {
    document.getElementById(k)!.classList.remove("hidden");
    document.getElementById(k)!.classList.add("visible");
  }
}

function movecenter(...l: string[]) {
  for (const k of l) {
    document.getElementById(k)!.classList.remove("right");
    document.getElementById(k)!.classList.add("center");
  }
}

function moveright(...l: string[]) {
  for (const k of l) {
    document.getElementById(k)!.classList.remove("center");
    document.getElementById(k)!.classList.add("right");
  }
}

export { setButtonLabels, hide, show, movecenter, moveright };
