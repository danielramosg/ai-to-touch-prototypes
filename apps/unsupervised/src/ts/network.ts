import { Level } from "./levels.ts";
import { train, predict, getWeights, resetWeights } from "./tf-helpers.ts";

/** Given a neural network N, return the layout position of neuron j of layer k. */
const pos = (N: number[], k: number, j: number) => [
  (k - 1) * 5,
  (3 * (j - (N[k] - 1) / 2)) / (Math.sqrt(N[k]) - 0.5),
];

class Network {
  levels: Level[];
  app: any;
  cimgcnt: number;
  cnt: number;
  cImg: { cnv: HTMLCanvasElement; txt: HTMLDivElement }[];
  xs: number[][]; //training data (xs)
  ys: number[][]; //training data (ys)
  N: number[];
  W: number[][];
  computing: boolean;

  //   nets;

  constructor(levels: Level[], app: any) {
    this.levels = levels;
    this.app = app;

    this.cimgcnt = 0;

    /* Neural Network (nn) */
    /** Number of neurons on each layer */
    this.N = [4, 6, 2];

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

    // this.nets = levels.map(() => new Worker("./nn-worker.js")); //array of workers, one per level.
    // this.nets.forEach((net) => {
    //   net.postMessage({ command: "create", N: [4, 6, 2] });
    // });

    /** Array of cImg items.
     * The last five data points in the computer-generated
     * data are displayed. */
    this.cImg = new Array(5).fill(null).map(() => {
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
      return { cnv: cnv, txt: txt };
    });
  }

  resetWeights() {
    resetWeights();
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

  /** Make guess, act consequently (correct/incorrect), add training data, and train network.*/
  makeComputerGuess(l) {
    this.cimgcnt = (this.cimgcnt + 1) % 5;

    // Get new datum X from random seed
    const x = this.levels[l].getX(1000 * Math.random());

    //make some guess for the datum based on nn
    predict([x]).then((ans) => {
      // then draw that guess
      const y = ans[0];

      const guess = y[0] > 0.5 ? 0 : 1;
      let guessLabel = this.levels[l].yLabels[guess];

      if (guess === this.levels[l].answer(x)) {
        guessLabel = guessLabel.concat(` ✔`);
        this.app.correct();
      } else {
        guessLabel = guessLabel.concat(` ✗`);
        this.app.incorrect();
      }

      this.levels[l].draw(this.cImg[this.cimgcnt].cnv, x);
      this.cImg[this.cimgcnt].txt.innerHTML = guessLabel;

      // and add the datum to the training data
      this.xs.push(x);
      this.ys.push(this.levels[l].answer(x) === 0 ? [1, 0] : [0, 1]);

      // if model is not getting better, restart it
      this.cnt += 1;
      if (this.cnt > 20 && this.app.nstrike < 4) {
        console.log("Resetting");
        this.resetWeights();
        this.cnt = 0;
      }

      // cut away too old answers
      if (this.xs.length > 32) {
        console.log("Cutting data");
        this.xs.shift();
        this.ys.shift();
      }

      // resetWeights();
      // getWeights().then((d) => {
      //   W = d;
      //   console.log(W);
      // });

      // console.log(W);
      if (!this.computing && this.xs.length > 1) {
        this.computing = true;
        console.log("computing");

        train(this.xs, this.ys)
          .then(() => getWeights())
          .then((d) => {
            this.W = d as number[][];
            this.computing = false;
            console.log("ended computing");
            // window.W = this.W;
          });
      }
    });
  }

  /** Draw the neural network diagram */
  drawNetwork(l: number) {
    const N = this.N;
    const W = this.W;
    const xLabels = this.levels[l].xLabels;
    const yLabels = this.levels[l].yLabels;
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
