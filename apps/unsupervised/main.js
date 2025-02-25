import { levels } from "./levels.js";
import { App } from "./app.js";

const app = new App(levels);

app.setLevel(1);
app.setMode("user");
app.updateInfoLevel();

app.animate();

// const worker = new Worker("./nn-worker.js");
// worker.postMessage({ command: "create", N: N });
// worker.postMessage({ command: "predict", xs: [[0.5, 0.2, 4, 2]] });
// worker.postMessage({ command: "trainAndGetWeights", xs: xs, ys: ys });

// worker.addEventListener("message", (e) => {
//   console.log("Received message from worker");
//   console.log(e);
//   switch (e.data.type) {
//     case "prediction":
//       console.log(e.data.ys[0]);
//       break;

//     case "getWeights":
//       console.log(e.data.W);
//       break;
//   }
// });

// window.nnWorker = worker;
