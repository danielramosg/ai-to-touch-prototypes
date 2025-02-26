import { App } from "./app.ts";
import { baseVector } from "./helpers.ts";
import { Level } from "./levels.ts";
// import { train, predict, getWeights, resetWeights } from "./tf-helpers.ts";

type historyItem = {
  container: HTMLDivElement; // container
  cnv: HTMLCanvasElement; // canvas
  txt: HTMLDivElement; // text div
};

/** Given a neural network N, return the layout position of neuron j of layer k. */
const pos = (N: number[], k: number, j: number) => [
  (k - 1) * 5,
  (3 * (j - (N[k] - 1) / 2)) / (Math.sqrt(N[k]) - 0.5),
];

class Network {
  level: Level;
  app: App;
  cimgcnt: number;
  cnt: number;
  cImg: historyItem[];
  xs: number[][]; //training data (xs)
  ys: number[][]; //training data (ys)
  N: number[];
  W: number[][];
  computing: boolean;

  guesser: number;
  trainer: number;

  net: Worker;

  constructor(level: Level, app: App) {
    this.level = level;
    this.app = app;

    this.cimgcnt = 0;

    /* Neural Network (nn) */
    /** Number of neurons on each layer */
    this.N = this.level.N;

    /** Weights & biases */
    this.W = [
      new Array(this.N[0]).fill(0).map(() => new Array(this.N[1]).fill(0)), // Matrix connecting layer 0 and 1 (weights)
      new Array(this.N[1]).fill(0), // Biases of layer 1
      new Array(this.N[1]).fill(0).map(() => new Array(this.N[2]).fill(0)), // Matrix connecting layer 1 and 2 (weights)
      new Array(this.N[2]).fill(0), // Biases of layer 2
    ];

    // training data
    this.xs = [];
    this.ys = [];

    this.net = new Worker(new URL("./nn-worker.ts", import.meta.url), {
      type: "module",
    });

    this.net.postMessage({ command: "create", N: this.N });

    /** Array of cImg items.
     * The last five data points in the computer-generated
     * data are displayed. */
    this.cImg = new Array(8).fill(null).map(() => {
      const item = document.createElement("div"); // item container
      const cnv = document.createElement("canvas"); // image
      const txt = document.createElement("div"); // label (guess option plus a sign "✔" or "✗")
      cnv.width = 800;
      cnv.height = 500;
      item.classList.add("cImgItem");
      item.appendChild(cnv);
      item.appendChild(txt);
      (document.getElementById("cImgContainer") as HTMLDivElement).appendChild(
        item
      );
      return { container: item, cnv: cnv, txt: txt };
    });

    // Listeners for the web worker
    this.net.addEventListener("message", (e) => {
      // console.log("Received message from worker");
      switch (e.data.type) {
        case "prediction":
          // draw the guess
          const x = e.data.xs[0] as number[];
          const y = e.data.ys[0] as number[];

          const guess = y.reduce(
            (iMax, x, i, arr) => (x > arr[iMax] ? i : iMax),
            0
          ); // find index of max

          let guessLabel = this.level.yLabels[guess];

          if (guess === this.level.answer(x)) {
            guessLabel = guessLabel.concat(` ✔`);
            this.app.correct();
          } else {
            guessLabel = guessLabel.concat(` ✗`);
            this.app.incorrect();
          }

          this.level.draw(this.cImg[this.cimgcnt].cnv, x);
          this.cImg[this.cimgcnt].txt.innerHTML = guessLabel;

          this.animateHistoryItem(this.cImg[this.cimgcnt]);

          // add the datum to the training data
          this.xs.push(x);
          this.ys.push(baseVector(this.level.answer(x), y.length));

          //if model is not getting better, restart it
          this.cnt += 1;
          if (this.cnt > 20 && this.app.nstrike < 4) {
            console.log("Not getting better, resetting");
            this.resetWeights();
            this.cnt = 0;
          }

          // cut away too old answers
          if (this.xs.length > 32) {
            console.log("Cutting data");
            this.xs.shift();
            this.ys.shift();
          }

          break;

        case "getWeights":
          this.W = e.data.W;
          break;
      }
    });
  }

  run() {
    this.guesser = setInterval(() => this.makeComputerGuess(), 1000);
    this.trainer = setInterval(() => this.trainNetwork(), 100);
  }

  stop() {
    clearInterval(this.guesser);
    clearInterval(this.trainer);
  }

  trainNetwork() {
    this.net.postMessage({
      command: "trainAndGetWeights",
      xs: this.xs,
      ys: this.ys,
    });
  }

  resetWeights() {
    this.net.postMessage({ command: "resetWeights" });
  }

  /** Reset Neural Network and history of saved observations */
  resethistory() {
    this.cimgcnt = 0;
    this.xs = [];
    this.ys = [];
    this.cnt = 0;
    this.resetWeights();
    this.app.resetStats();
  }

  animateHistoryItem(item: historyItem) {
    // console.log("animating: ", item);
    item.container.style.left = "-50%";
    item.container.style.opacity = "1";
    const timer0 = performance.now();

    const animation = () => {
      const t = performance.now() - timer0;
      if (t < 5000) {
        item.container.style.left = `${(-50 + (200 * t) / 5000).toString()}%`;
        if (t > 4000) {
          item.container.style.opacity = (5 - t / 1000).toString();
        }
        requestAnimationFrame(animation);
      } else {
        item.container.style.opacity = "0";
      }
    };
    animation();
  }

  /** Make guess */
  makeComputerGuess() {
    this.cimgcnt = (this.cimgcnt + 1) % 8;
    // Get new datum X from random seed
    const x = this.level.getX(1000 * Math.random());
    //make some guess for the datum based on nn
    this.net.postMessage({ command: "predict", xs: [x] });
  }

  /** Draw the neural network diagram */
  drawNetwork() {
    const N = this.N;
    const W = this.W;
    const xLabels = this.level.xLabels;
    const yLabels = this.level.yLabels;
    const cnv = document.getElementById("mainCanvas") as HTMLCanvasElement;
    const ctx = cnv.getContext("2d") as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, 800, 500);
    ctx.setTransform(40, 0, 0, 40, 400, 250);
    ctx.fillStyle = "grey";
    ctx.strokeStyle = "white";

    for (let k = 0; k < 2; k += 1) {
      for (let j0 = 0; j0 < N[k]; j0 += 1) {
        for (let j1 = 0; j1 < N[k + 1]; j1 += 1) {
          const p0 = pos(N, k, j0);
          const p1 = pos(N, k + 1, j1);
          const w = W[2 * k][j0][j1];
          // const w = -0.09; //test
          const lw = Math.min(0.1, 4 * w * w);
          if (lw > 0.01) {
            ctx.lineWidth = lw;
            ctx.strokeStyle = `hsl(${w > 0 ? 0.3 * 360 : 0.8 * 360},100%,50%)`; // green, purple
            ctx.beginPath();
            ctx.moveTo(p0[0], p0[1]);
            ctx.lineTo(p1[0], p1[1]);
            ctx.stroke();
          }
        }
      }
    }

    for (let k = 0; k < 3; k += 1) {
      for (let j = 0; j < N[k]; j += 1) {
        const p = pos(N, k, j);
        const w = k > 0 ? W[2 * k - 1][j] : 0;
        //   const w = 0.5; // test

        ctx.fillStyle = "grey";
        ctx.beginPath();
        ctx.arc(p[0], p[1], 0.4, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = `hsla(${
          w > 0 ? 0.3 * 360 : 0.8 * 360
        },100%,50%,${Math.abs(w)})`;
        ctx.beginPath();
        ctx.arc(p[0], p[1], 0.3, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    if (xLabels.length !== N[0] || yLabels.length !== N[2])
      console.error("Wrong labels dimensions");

    ctx.fillStyle = "white";
    ctx.font = "0.5px Quicksand";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let j = 0; j < N[0]; j += 1) {
      const p = pos(N, 0, j);
      ctx.fillText(xLabels[j], p[0] - 0.8, p[1]);
    }

    ctx.textAlign = "left";
    for (let j = 0; j < N[2]; j += 1) {
      const p = pos(N, 2, j);
      ctx.fillText(yLabels[j], p[0] + 0.8, p[1]);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}

export { Network };
